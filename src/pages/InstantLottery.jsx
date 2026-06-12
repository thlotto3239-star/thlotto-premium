import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

// ============================================================
// หวยไทย 1 นาที (Instant Lottery) — Single-bet auto-popup UX
// ============================================================

const BET_TABS = [
  { code: '2top',      name: '2 ตัว',    digits: 2, positioned: false },
  { code: '2bottom',   name: '2 ตัวร่าง',   digits: 2, positioned: false },
  { code: '3top',      name: '3 ตัวหน้า',    digits: 3, positioned: false },
  { code: '3toad',     name: '3 ตัวโต๊ด',   digits: 3, positioned: false },
  { code: '3front',    name: '3 ตัวหน้า',   digits: 3, positioned: false },
  { code: '3back',     name: '3 ตัวท้าย',   digits: 3, positioned: false },
  { code: '6straight', name: '6 ตัวตรง',    digits: 6, positioned: false },
  { code: 'pin_top',    name: 'ปักหลักบน',  digits: 0, positioned: true, maxPin: 7, positions: ['hundreds', 'tens', 'units'] },
  { code: 'pin_bottom', name: 'ปักหลักล่าง', digits: 0, positioned: true, maxPin: 7, positions: ['tens', 'units'] },
];

const CHIPS = [10, 20, 50, 100, 200, 500];
const POS_LABEL = { hundreds: 'หลักร้อย', tens: 'หลักสิบ', units: 'หลักหน่วย' };
const POS_SHORT = { hundreds: 'ร้อย', tens: 'สิบ', units: 'หน่วย' };

const BET_NAME_BY_CODE = BET_TABS.reduce((a, c) => ({ ...a, [c.code]: c.name }), {});

const fmt = (n) => Math.floor(parseFloat(n || 0)).toLocaleString('th-TH');

export default function InstantLottery() {
  const navigate = useNavigate();
  const { profile, user, refreshProfile, signOut } = useAuth();
  const balance = Math.floor(profile?.balance ?? 0);

  // ---- State ----
  const [activeTab, setActiveTab] = useState('2top');
  const [inputNumber, setInputNumber] = useState('');
  const [pinSelection, setPinSelection] = useState({ hundreds: [], tens: [], units: [] });
  const [logoUrl, setLogoUrl] = useState('https://flagcdn.com/w160/th.png');

  const [drawId, setDrawId] = useState(() => Math.floor(Date.now() / 60000));
  const [viewingDrawId, setViewingDrawId] = useState(() => Math.floor(Date.now() / 60000) - 1);
  const [countdown, setCountdown] = useState(60);
  const [bettingOpen, setBettingOpen] = useState(true);
  const [resultDisplay, setResultDisplay] = useState(null);

  const [pendingBet, setPendingBet] = useState(null);
  const [amountInput, setAmountInput] = useState('');
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [showResultModal, setShowResultModal] = useState(false);
  const [popupData, setPopupData] = useState(null);

  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [toast, setToast] = useState(null);
  const [balanceFlash, setBalanceFlash] = useState(false);

  const prevBalanceRef = useRef(balance);
  const prevDrawIdRef = useRef(null);

  const tabInfo = BET_TABS.find(t => t.code === activeTab);

  // ============================================================
  // Timer — sync every second + detect minute change
  // ============================================================
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const newDrawId = Math.floor(now / 60000);
      const secs = new Date(now).getSeconds();
      const remaining = 60 - secs;

      setDrawId(newDrawId);
      setCountdown(remaining);
      setBettingOpen(remaining > 5);

      if (prevDrawIdRef.current !== null && newDrawId > prevDrawIdRef.current) {
        const finishedDraw = prevDrawIdRef.current;
        resetBetUI();
        setShowMoneyModal(false);
        // Wait 3s for server to settle + generate result, then show popup + refresh history
        setTimeout(() => {
          setViewingDrawId(finishedDraw);
          fetchAndShowPopup(finishedDraw);
          // Re-fetch history so WIN/LOSE status updates immediately
          supabase.rpc('fn_get_instant_bets').then(({ data }) => {
            if (data?.bets) setHistoryData(data.bets);
          });
        }, 3000);
      }
      prevDrawIdRef.current = newDrawId;

      if (remaining <= 5) {
        setShowMoneyModal(false);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'instant_logo_url')
          .maybeSingle();
        if (data?.value) {
          setLogoUrl(data.value);
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      }
    };
    fetchLogo();
  }, []);

  // Balance flash when changed
  useEffect(() => {
    if (prevBalanceRef.current !== balance) {
      const isIncrease = balance > prevBalanceRef.current;
      if (isIncrease) {
        setBalanceFlash(true);
        const t = setTimeout(() => setBalanceFlash(false), 800);
        prevBalanceRef.current = balance;
        return () => clearTimeout(t);
      } else {
        prevBalanceRef.current = balance;
      }
    }
  }, [balance]);

  // Load result when viewing draw changes
  useEffect(() => {
    loadResult(viewingDrawId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingDrawId]);

  // ============================================================
  // Helpers
  // ============================================================
  const resetBetUI = () => {
    setInputNumber('');
    setPinSelection({ hundreds: [], tens: [], units: [] });
    setPendingBet(null);
  };

  const loadResult = async (targetDrawId) => {
    if (!targetDrawId || targetDrawId <= 0) return;
    try {
      const { data } = await supabase.rpc('fn_get_instant_result', { p_draw_id: targetDrawId });
      if (data?.ok) {
        setResultDisplay({
          prize6: data.result_6d,
          f3: data.result_3front,
          b3: data.result_3back,
          t2: data.result_2top,
        });
      } else {
        setResultDisplay(null);
      }
    } catch (e) {
      setResultDisplay(null);
    }
  };

  const fetchAndShowPopup = async (targetDrawId) => {
    try {
      const { data } = await supabase.rpc('fn_get_instant_popup', { p_draw_id: targetDrawId });
      if (data?.ok) {
        setPopupData(data);
        setShowResultModal(true);
        // Update result display too
        setResultDisplay({
          prize6: data.result_6d,
          f3: data.result_3front,
          b3: data.result_3back,
          t2: data.result_2top,
        });
      }
    } catch (e) { /* silent */ }
  };

  const navigateDraw = (step) => {
    const next = viewingDrawId + step;
    if (next >= drawId) return;
    setViewingDrawId(next);
  };

  // ---- Change tab ----
  const selectTab = (code) => {
    setActiveTab(code);
    resetBetUI();
  };

  // ---- Numpad (non-positioned) ----
  const numPress = (v) => {
    if (!tabInfo || tabInfo.positioned) return;
    if (!bettingOpen) return;
    if (v === 'del') {
      setInputNumber(s => s.slice(0, -1));
      return;
    }
    const reqLen = tabInfo.digits;
    if (inputNumber.length < reqLen) {
      const newVal = inputNumber + String(v);
      setInputNumber(newVal);
      if (newVal.length === reqLen) {
        setTimeout(() => {
          setPendingBet({ type: activeTab, numbers: newVal, display: newVal });
          setAmountInput('');
          setShowMoneyModal(true);
        }, 300);
      }
    }
  };

  const manualSubmit = () => {
    if (!tabInfo || tabInfo.positioned) return;
    if (!inputNumber) return;
    setPendingBet({ type: activeTab, numbers: inputNumber, display: inputNumber });
    setAmountInput('');
    setShowMoneyModal(true);
  };

  // ---- Pin (positioned) ----
  const togglePin = (posKey, digit) => {
    if (!bettingOpen) return;
    const curr = pinSelection[posKey] || [];
    const isActive = curr.includes(digit);
    if (isActive) {
      setPinSelection({ ...pinSelection, [posKey]: curr.filter(d => d !== digit) });
      return;
    }
    const total = (pinSelection.hundreds?.length || 0) + (pinSelection.tens?.length || 0) + (pinSelection.units?.length || 0);
    if (total >= 7) return;
    const newSel = { ...pinSelection, [posKey]: [...curr, digit] };
    setPinSelection(newSel);
    const newTotal = (newSel.hundreds?.length || 0) + (newSel.tens?.length || 0) + (newSel.units?.length || 0);
    if (newTotal === 7) {
      setTimeout(() => confirmPin(newSel), 300);
    }
  };

  const confirmPin = (selObj) => {
    const sel = selObj || pinSelection;
    const total = (sel.hundreds?.length || 0) + (sel.tens?.length || 0) + (sel.units?.length || 0);
    if (total < 1) {
      setToast({ type: 'error', text: 'เลือกตัวเลขอย่างน้อย 1 ตัว' });
      setTimeout(() => setToast(null), 1500);
      return;
    }
    const positions = tabInfo.positions;
    const parts = positions.filter(k => sel[k]?.length).map(k => `${POS_SHORT[k]}:${sel[k].join('')}`);
    const display = parts.join(' + ');
    const numbersObj = {};
    positions.forEach(k => { if (sel[k]?.length) numbersObj[k] = sel[k]; });
    setPendingBet({ type: activeTab, numbers: JSON.stringify(numbersObj), display });
    setAmountInput('');
    setShowMoneyModal(true);
  };

  // ---- Submit bet ----
  const submitBet = async () => {
    const amt = parseFloat(amountInput);
    if (!amt || amt < 1) {
      setToast({ type: 'error', text: 'ระบุเงินให้ถูกต้อง' });
      setTimeout(() => setToast(null), 1500);
      return;
    }
    if (!pendingBet) return;
    setSubmitting(true);
    try {
      // pin bets: amount = ราคาต่อตัว × จำนวนตัวที่เลือก
      const isPinBet = pendingBet.type.startsWith('pin_');
      let totalAmount = amt;
      if (isPinBet) {
        const numObj = JSON.parse(pendingBet.numbers);
        const picks = (numObj.hundreds?.length || 0) + (numObj.tens?.length || 0) + (numObj.units?.length || 0);
        totalAmount = amt * picks;
      }
      const { data, error } = await supabase.rpc('fn_place_instant_bet', {
        p_draw_id: drawId,
        p_bet_type: pendingBet.type,
        p_numbers: pendingBet.numbers,
        p_amount: totalAmount,
      });
      if (error) throw error;
      if (data?.ok) {
        setShowMoneyModal(false);
        resetBetUI();
        refreshProfile();
        setToast({ type: 'success', text: 'บันทึกสำเร็จ' });
        setTimeout(() => setToast(null), 1800);
      } else {
        setToast({ type: 'error', text: data?.error || 'แทงไม่สำเร็จ' });
        setTimeout(() => setToast(null), 2500);
      }
    } catch (e) {
      setToast({ type: 'error', text: e?.message || 'เกิดข้อผิดพลาด' });
      setTimeout(() => setToast(null), 2500);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- History ----
  const openHistory = async () => {
    setShowHistory(true);
    setLoadingHistory(true);
    try {
      const { data } = await supabase.rpc('fn_get_instant_bets');
      setHistoryData(data?.bets || []);
    } catch (e) {
      setHistoryData([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Realtime: อัปเดตประวัติอัตโนมัติเมื่อ bet status เปลี่ยน (WIN/LOSE) — ทำงานตลอดไม่ใช่แค่ตอนเปิด modal
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('instant-bets-history')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'instant_bets', filter: `user_id=eq.${user.id}` }, (payload) => {
        setHistoryData(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'instant_bets', filter: `user_id=eq.${user.id}` }, (payload) => {
        setHistoryData(prev => [payload.new, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);


  // ============================================================
  // RENDER
  // ============================================================
  const drawShort = String(drawId).slice(-4);
  const timerMin = '00';
  const timerSec = String(countdown).padStart(2, '0');
  const prize6 = resultDisplay?.prize6 || '------';
  const f3 = resultDisplay?.f3 || '---';
  const b3 = resultDisplay?.b3 || '---';
  const t2 = resultDisplay?.t2 || '--';

  const pinTotal = (pinSelection.hundreds?.length || 0) + (pinSelection.tens?.length || 0) + (pinSelection.units?.length || 0);

  return (
    <div
      className="flex flex-col h-screen w-full max-w-2xl mx-auto relative overflow-hidden"
      style={{
        fontFamily: 'Prompt, sans-serif',
        background: 'radial-gradient(ellipse at top, #0d4a0a 0%, #064e3b 35%, #021a0b 100%)',
      }}
    >
      {/* ========== Header ========== */}
      <header
        className="px-3 py-2 flex justify-between items-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] z-20 backdrop-blur-xl border-b border-[#D4AF37]/30"
        style={{ background: 'linear-gradient(180deg, rgba(2,26,11,0.95) 0%, rgba(6,78,59,0.9) 100%)' }}
      >
        <div className="flex items-center gap-2 w-1/3">
          <span className="material-icons text-[#D4AF37] text-2xl">account_circle</span>
          <span className="text-white font-bold text-sm truncate">{profile?.username || profile?.full_name || '...'}</span>
        </div>
        <div className="flex justify-center w-1/3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center border-2 border-[#D4AF37] shadow-lg overflow-hidden">
            <img src={logoUrl} alt="ธงไทย" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex justify-end w-1/3 gap-1">
          <button
            onClick={() => navigate('/home')}
            className="bg-[#0e2415] border border-[#2e5c3e] text-[#D4AF37] text-xs px-2 py-1.5 rounded flex items-center gap-1 hover:bg-[#1a3a26]"
            title="กลับหน้าแรก"
          >
            <span className="material-icons text-sm">arrow_back</span>
          </button>
          <button
            onClick={openHistory}
            className="bg-[#0e2415] border border-[#2e5c3e] text-[#D4AF37] text-xs px-3 py-1.5 rounded flex items-center gap-1 hover:bg-[#1a3a26]"
          >
            <span className="material-icons text-sm">history</span>
            <span>ประวัติ</span>
          </button>
        </div>
      </header>

      {/* ========== Status Bar ========== */}
      <div
        className="px-3 py-2 flex justify-between items-center border-b border-[#D4AF37]/15 text-white backdrop-blur-sm"
        style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(6,78,59,0.4) 50%, rgba(0,0,0,0.85) 100%)' }}
      >
        <div className="text-left">
          <div className="text-[10px] text-gray-400">งวดที่</div>
          <div className="text-2xl font-bold text-[#d32f2f] font-mono leading-none">{drawShort}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-400 mb-1">เวลาถอยหลัง</div>
          <div className="flex items-center gap-1 justify-center">
            <div className="bg-white text-[#d32f2f] rounded px-2 py-0.5 text-xl font-bold min-w-[40px] text-center">{timerMin}</div>
            <span className="text-white font-bold text-xl">:</span>
            <div
              className={`bg-white text-[#d32f2f] rounded px-2 py-0.5 text-xl font-bold min-w-[40px] text-center ${countdown <= 5 ? 'animate-pulse' : ''}`}
            >
              {timerSec}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400">เครดิต</div>
          <div
            className={`text-2xl font-bold leading-none transition-all duration-300 ${balanceFlash ? 'text-green-400 scale-110' : 'text-[#D4AF37]'}`}
          >
            ฿{fmt(balance)}
          </div>
        </div>
      </div>

      {/* ========== Nav Bar (view past draws) ========== */}
      <div className="bg-[#1a1a1a] py-1 px-2 flex justify-between items-center border-b border-black">
        <button onClick={() => navigateDraw(-1)} className="text-gray-400 px-4 py-1 hover:text-white">
          <span className="material-icons">chevron_left</span>
        </button>
        <div className="bg-[#2d2d2d] px-4 py-0.5 rounded-full border border-gray-600">
          <span className="text-gray-300 text-xs font-mono">งวด {viewingDrawId}</span>
        </div>
        <button onClick={() => navigateDraw(1)} className="text-gray-400 px-4 py-1 hover:text-white">
          <span className="material-icons">chevron_right</span>
        </button>
      </div>

      {/* ========== Result Table ========== */}
      <div className="bg-white shadow-md">
        <ResultRow label="รางวัลที่ 1" value={prize6} color="#d32f2f" bigSize />
        <ResultRow label="หน้า 3 ตัว" value={f3} color="#1976d2" />
        <ResultRow label="ท้าย 3 ตัว" value={b3} color="#1976d2" />
        <ResultRow label="2 ตัว" value={t2} color="#1976d2" noBorder />
      </div>

      {/* ========== Bet Section ========== */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Tabs — 2 rows grid (5 + 4) */}
        <div
          className="border-b border-[#D4AF37]/30 p-1.5 z-10 shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
          style={{ background: 'linear-gradient(180deg, rgba(13,74,10,0.95) 0%, rgba(6,78,59,0.9) 100%)' }}
        >
          <div className="grid grid-cols-5 gap-1">
            {BET_TABS.slice(0, 5).map((tab) => (
              <button
                key={tab.code}
                onClick={() => selectTab(tab.code)}
                className={`px-2 py-2 text-[11px] font-extrabold transition-all rounded-full truncate active:scale-95 border ${
                  activeTab === tab.code
                    ? 'text-[#0a3a07] border-[#D4AF37] shadow-md shadow-[#D4AF37]/40'
                    : 'text-emerald-100 border-[#137c10]/40 hover:border-[#137c10] backdrop-blur-sm'
                }`}
                style={
                  activeTab === tab.code
                    ? { background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }
                    : { background: 'linear-gradient(135deg, rgba(6,78,59,0.6) 0%, rgba(13,74,10,0.6) 100%)' }
                }
              >
                {tab.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 mt-1">
            {BET_TABS.slice(5).map((tab) => (
              <button
                key={tab.code}
                onClick={() => selectTab(tab.code)}
                className={`px-2 py-2 text-[11px] font-extrabold transition-all rounded-full truncate active:scale-95 border ${
                  activeTab === tab.code
                    ? 'text-[#0a3a07] border-[#D4AF37] shadow-md shadow-[#D4AF37]/40'
                    : 'text-emerald-100 border-[#137c10]/40 hover:border-[#137c10] backdrop-blur-sm'
                }`}
                style={
                  activeTab === tab.code
                    ? { background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }
                    : { background: 'linear-gradient(135deg, rgba(6,78,59,0.6) 0%, rgba(13,74,10,0.6) 100%)' }
                }
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bet Area */}
        <div
          className="flex-1 overflow-y-auto p-2 pb-6"
          style={{ opacity: bettingOpen ? 1 : 0.5, pointerEvents: bettingOpen ? 'auto' : 'none' }}
        >
          {!tabInfo?.positioned ? (
            // ---- Non-positioned: input + numpad ----
            <>
              <div className="flex justify-center mb-3 mt-2">
                <input
                  type="text"
                  readOnly
                  value={inputNumber}
                  placeholder={'-'.repeat(tabInfo?.digits || 2)}
                  className="border border-[#D4AF37]/40 rounded-xl py-3 w-[85%] text-center text-3xl text-[#D4AF37] font-mono font-extrabold tracking-[0.3em] placeholder-[#137c10]/50 shadow-inner shadow-black/50"
                  style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(6,78,59,0.5) 100%)' }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 px-2 max-w-sm mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <NumpadBtn key={n} onClick={() => numPress(n)}>{n}</NumpadBtn>
                ))}
                <NumpadBtn onClick={() => numPress('del')} color="red">
                  <span className="material-icons">backspace</span>
                </NumpadBtn>
                <NumpadBtn onClick={() => numPress(0)}>0</NumpadBtn>
                <NumpadBtn onClick={manualSubmit} color="green">ตกลง</NumpadBtn>
              </div>
            </>
          ) : (
            // ---- Positioned (pin) ----
            <>
              <div className="text-center text-[#D4AF37] text-xs font-bold mb-2">
                เลือกตัวเลข (สูงสุด 7 ตัว) — กดครบ 7 จะเด้งอัตโนมัติ
              </div>
              {tabInfo.positions.map((posKey) => (
                <PinRow
                  key={posKey}
                  label={POS_LABEL[posKey]}
                  selected={pinSelection[posKey] || []}
                  onToggle={(d) => togglePin(posKey, d)}
                />
              ))}
              <div className="px-2 pt-3">
                <button
                  onClick={() => confirmPin()}
                  disabled={pinTotal === 0}
                  className="w-full bg-gradient-to-b from-[#D4AF37] to-[#a8851e] text-black font-bold py-3 rounded-lg border border-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
                >
                  <span className="material-icons align-middle mr-1">check_circle</span>
                  ยืนยัน / ใส่ราคา ({pinTotal} ตัว)
                </button>
              </div>
            </>
          )}
        </div>
      </main>


      {/* ========== MODAL: Money Input ========== */}
      {showMoneyModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0a2012] border border-green-700 rounded-xl p-5 shadow-2xl animate-[popIn_0.3s_ease]">
            <div className="text-center mb-4">
              <h3 className="text-gray-300 text-sm">รายการที่เลือก</h3>
              <div className="text-[#D4AF37] font-mono text-sm font-bold mt-1 break-all">
                [{BET_NAME_BY_CODE[pendingBet?.type] || ''}] {pendingBet?.display}
              </div>
              {pendingBet?.type?.startsWith('pin_') && (() => {
                const numObj = JSON.parse(pendingBet.numbers || '{}');
                const picks = (numObj.hundreds?.length || 0) + (numObj.tens?.length || 0) + (numObj.units?.length || 0);
                const perPick = parseFloat(amountInput) || 0;
                const total = perPick * picks;
                return picks > 0 ? (
                  <div className="mt-2 text-xs text-gray-400">
                    <span className="text-white">{picks} ตัว</span>
                    {perPick > 0 && <span className="text-[#D4AF37] ml-1">× {perPick} = <span className="text-green-400 font-bold">฿{total} รวม</span></span>}
                  </div>
                ) : null;
              })()}
            </div>
            <div className="relative mb-4">
              <input
                type="tel"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value.replace(/[^\d]/g, ''))}
                className="w-full bg-black border border-green-600 rounded-lg py-3 text-center text-3xl text-white font-bold outline-none focus:border-[#D4AF37]"
                placeholder={pendingBet?.type?.startsWith('pin_') ? 'ราคาต่อตัว (บาท)' : 'ระบุเงิน (บาท)'}
                autoFocus
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs">THB</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-5">
              {CHIPS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAmountInput(String(c))}
                  className="bg-[#1a3a26] text-[#D4AF37] border border-[#1e4528] py-2 rounded text-sm font-bold hover:bg-[#D4AF37] hover:text-black active:scale-95 transition"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMoneyModal(false)}
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg font-bold text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={submitBet}
                disabled={submitting}
                className="flex-1 bg-gradient-to-b from-[#D4AF37] to-[#a8851e] text-black py-3 rounded-lg font-bold shadow-lg text-sm disabled:opacity-50"
              >
                {submitting ? 'ส่งโพย...' : 'แทงทันที'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: Result Popup ========== */}
      {showResultModal && popupData && (
        <div className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#002400] border border-[#0f4c25] rounded-xl shadow-2xl animate-[popIn_0.3s_ease] overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-[#1e572e]">
              <div className="flex items-center gap-2">
                <span className="material-icons text-[#D4AF37]">emoji_events</span>
                <span className="text-white font-bold">ผลรางวัล</span>
              </div>
              <button onClick={() => setShowResultModal(false)} className="text-gray-400 hover:text-white">
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col items-center">
              <div className="text-gray-400 text-xs mb-2">งวดประจำวันที่ <span>{popupData.draw_id}</span></div>
              <div className="w-full bg-white rounded-lg py-4 flex items-center justify-center mb-2 shadow-inner">
                <div className="text-5xl font-bold text-[#d32f2f] tracking-[0.15em] font-mono">{popupData.result_6d}</div>
              </div>
              <div className="text-gray-500 text-[10px] mb-4">รางวัลที่ 1</div>
              <div className="grid grid-cols-2 gap-3 w-full mb-5">
                <PopupSubBox label="3 ตัวหน้า" value={popupData.result_3top} />
                <PopupSubBox label="3 ตัวท้าย" value={popupData.result_3back} />
                <PopupSubBox label="2 ตัว" value={popupData.result_2top} />
                <PopupSubBox label="2 ตัวร่าง" value={popupData.result_2bottom} />
              </div>
              <div
                className={`w-full rounded-lg py-3 px-3 text-center border ${
                  !popupData.has_bet
                    ? 'bg-[#0a2012] border-[#1e572e]'
                    : popupData.total_win > 0
                      ? 'bg-green-900/50 border-green-500 shadow-[0_0_10px_rgba(0,255,0,0.3)]'
                      : 'bg-[#1a0505] border-red-900'
                }`}
              >
                {!popupData.has_bet ? (
                  <span className="text-gray-400 text-sm">คุณไม่ได้เดิมพันในรอบนี้</span>
                ) : popupData.total_win > 0 ? (
                  <span className="text-white text-sm">
                    ยินดีด้วย! คุณถูกรางวัล{' '}
                    <span className="text-[#D4AF37] font-bold">{fmt(popupData.total_win)}</span> บาท
                  </span>
                ) : (
                  <span className="text-red-400 text-sm">เสียใจด้วย รอบนี้ไม่ถูกรางวัล</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL: History ========== */}
      {showHistory && (
        <div className="fixed inset-0 z-[70] bg-[#050f08] flex flex-col">
          <div className="bg-[#021a0b] p-4 flex justify-between items-center border-b border-green-900">
            <h2 className="text-white font-bold flex items-center gap-2">
              <span className="material-icons text-[#D4AF37]">history</span>
              ประวัติการแทง
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="w-8 h-8 flex items-center justify-center bg-gray-800 rounded-full text-white"
            >
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#050f08]">
            {loadingHistory ? (
              <div className="text-center text-gray-500 mt-10">กำลังโหลด...</div>
            ) : historyData.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">ไม่มีประวัติ</div>
            ) : (
              historyData.map((b) => <HistoryItem key={b.id} bet={b} />)
            )}
          </div>
        </div>
      )}

      {/* ========== Toast ========== */}
      {toast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-[90] flex flex-col items-center min-w-[200px]">
          <span
            className={`material-icons text-4xl mb-2 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
          >
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-bold text-center">{toast.text}</span>
        </div>
      )}

      {/* Animation keyframe */}
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ResultRow({ label, value, color, bigSize = false, noBorder = false }) {
  return (
    <div className={`flex h-[56px] ${noBorder ? '' : 'border-b border-gray-200'}`}>
      <div className="w-[35%] bg-[#e8f5e9] text-[#004d25] flex items-center justify-center text-sm font-semibold">
        {label}
      </div>
      <div
        className={`w-[65%] flex items-center justify-center font-bold font-mono ${bigSize ? 'text-3xl' : 'text-2xl'} tracking-[2px]`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

function NumpadBtn({ children, onClick, color = 'default' }) {
  const styles =
    color === 'red'
      ? {
          bg: 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)',
          text: 'text-white',
          border: 'border-red-400/50 shadow-md shadow-red-900/50',
        }
      : color === 'green'
        ? {
            bg: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)',
            text: 'text-[#0a3a07]',
            border: 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/40',
          }
        : {
            bg: 'linear-gradient(180deg, #137c10 0%, #0d4a0a 100%)',
            text: 'text-white',
            border: 'border-[#137c10]/60 shadow-md shadow-black/40',
          };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl py-4 text-2xl font-extrabold border transition-all active:scale-95 ${styles.text} ${styles.border}`}
      style={{ background: styles.bg }}
    >
      {children}
    </button>
  );
}

function PinRow({ label, selected, onToggle }) {
  return (
    <div className="mb-2 bg-[#0a2012] border border-[#1e4528] rounded-lg p-2">
      <div className="text-[#D4AF37] text-xs font-bold mb-2 ml-1">{label}</div>
      <div className="grid grid-cols-5 gap-1">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
          const isActive = selected.includes(d);
          return (
            <button
              key={d}
              onClick={() => onToggle(d)}
              className={`py-2 text-lg font-mono rounded transition ${
                isActive
                  ? 'bg-gradient-to-b from-[#D4AF37] to-[#a8851e] text-black border border-white font-bold shadow-[0_0_8px_rgba(255,215,0,0.5)]'
                  : 'bg-[#0f2214] border border-[#1e4528] text-gray-300'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PopupSubBox({ label, value }) {
  return (
    <div className="bg-[#011506] border border-[#1e572e] rounded-lg p-2 flex flex-col items-center">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#D4AF37] font-mono">{value}</div>
    </div>
  );
}

function HistoryItem({ bet }) {
  const typeName = BET_NAME_BY_CODE[bet.bet_type] || bet.bet_type;
  let displayNum = bet.numbers;
  if (bet.bet_type?.startsWith('pin_')) {
    try {
      const sel = JSON.parse(bet.numbers);
      const parts = [];
      if (sel.hundreds?.length) parts.push(`ร้อย: ${sel.hundreds.join(',')}`);
      if (sel.tens?.length) parts.push(`สิบ: ${sel.tens.join(',')}`);
      if (sel.units?.length) parts.push(`หน่วย: ${sel.units.join(',')}`);
      displayNum = parts.join(' | ');
    } catch (e) { /* fallback */ }
  }
  let statusNode;
  let bgClass;
  if (bet.status === 'WIN') {
    statusNode = (
      <span className="text-green-400 font-bold text-xs">
        <span className="material-icons align-middle text-sm">check_circle</span> ถูกรางวัล (+{fmt(bet.winnings)})
      </span>
    );
    bgClass = 'border-green-800 bg-green-900/20';
  } else if (bet.status === 'LOSE') {
    statusNode = (
      <span className="text-red-400 text-xs">
        <span className="material-icons align-middle text-sm">cancel</span> ไม่ถูกรางวัล
      </span>
    );
    bgClass = 'border-red-900 bg-red-900/10';
  } else {
    statusNode = (
      <span className="text-gray-400 text-xs">
        <span className="material-icons align-middle text-sm">schedule</span> รอผล
      </span>
    );
    bgClass = 'border-gray-700 bg-gray-800/30';
  }
  const dt = bet.created_at ? new Date(bet.created_at).toLocaleString('th-TH') : '';
  return (
    <div className={`rounded-lg border p-3 ${bgClass}`}>
      <div className="flex justify-between items-start mb-1">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#D4AF37] font-bold mb-1">{typeName}</div>
          <div className="text-white text-base font-mono font-bold break-all leading-tight">{displayNum}</div>
          <div className="text-[10px] text-gray-500 mt-1">งวด {bet.draw_id} | {dt}</div>
        </div>
        <div className="text-right ml-2">
          <div className="text-lg font-bold text-white mb-1">฿{fmt(bet.amount)}</div>
          {statusNode}
        </div>
      </div>
    </div>
  );
}
