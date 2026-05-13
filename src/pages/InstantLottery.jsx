import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import BottomNav from '../components/BottomNav';

const BET_TABS = [
  { code: '2top', name: '2 ตัวบน', digits: 2, positioned: false },
  { code: '2bottom', name: '2 ตัวล่าง', digits: 2, positioned: false },
  { code: '3top', name: '3 ตัวบน', digits: 3, positioned: false },
  { code: '3toad', name: '3 ตัวโต๊ด', digits: 3, positioned: false },
  { code: '3front', name: '3 ตัวหน้า', digits: 3, positioned: false },
  { code: '3back', name: '3 ตัวท้าย', digits: 3, positioned: false },
  { code: '6straight', name: '6 ตัวตรง', digits: 6, positioned: false },
  { code: 'pin_top', name: 'ปักหลักบน', digits: 0, positioned: true },
  { code: 'pin_bottom', name: 'ปักหลักล่าง', digits: 0, positioned: true },
];

const CHIPS = [10, 20, 50, 100, 200, 500];

export default function InstantLottery() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const balance = profile?.balance ?? 0;

  // --- State ---
  const [activeTab, setActiveTab] = useState('2top');
  const [inputNumber, setInputNumber] = useState('');
  const [pinSelection, setPinSelection] = useState({ hundreds: [], tens: [], units: [] });
  const [amount, setAmount] = useState(0);
  const [cart, setCart] = useState([]);
  const [countdown, setCountdown] = useState(60);
  const [drawId, setDrawId] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [bettingOpen, setBettingOpen] = useState(true);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [popupData, setPopupData] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const prevDrawIdRef = useRef(0);

  const currentTabInfo = BET_TABS.find(t => t.code === activeTab);

  // --- Draw ID & Countdown ---
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const currentDrawId = Math.floor(now / 60000);
      const secondsInMinute = new Date(now).getSeconds();
      const remaining = 60 - secondsInMinute;

      setDrawId(currentDrawId);
      setCountdown(remaining);
      setBettingOpen(remaining > 5);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Load result when draw changes ---
  useEffect(() => {
    if (drawId === 0) return;
    if (drawId === prevDrawIdRef.current) return;

    const prevDraw = prevDrawIdRef.current;
    prevDrawIdRef.current = drawId;

    // Load result for previous draw
    if (prevDraw > 0) {
      loadResultAndPopup(prevDraw);
    }
    // Load latest result for display
    loadLatestResult(drawId - 1);
  }, [drawId]);

  const loadLatestResult = async (dId) => {
    if (!dId || dId <= 0) return;
    try {
      const { data } = await supabase.rpc('fn_get_instant_result', { p_draw_id: dId });
      if (data?.ok) setLastResult(data);
    } catch (err) {
      console.error('loadLatestResult error:', err);
    }
  };

  const loadResultAndPopup = async (dId) => {
    try {
      const { data } = await supabase.rpc('fn_get_instant_popup', { p_draw_id: dId });
      if (data?.ok && data.has_bet) {
        setPopupData(data);
        setShowResultPopup(true);
      }
    } catch (err) {
      console.error('loadResultAndPopup error:', err);
    }
  };

  // --- Numpad input ---
  const handleNumpad = (val) => {
    if (!currentTabInfo || currentTabInfo.positioned) return;
    const maxLen = currentTabInfo.digits;
    if (val === 'del') {
      setInputNumber(prev => prev.slice(0, -1));
    } else if (val === 'clear') {
      setInputNumber('');
    } else {
      if (inputNumber.length < maxLen) {
        setInputNumber(prev => prev + val);
      }
    }
  };

  // --- Pin selection ---
  const togglePinDigit = (position, digit) => {
    setPinSelection(prev => {
      const arr = prev[position] || [];
      const newArr = arr.includes(digit) ? arr.filter(d => d !== digit) : [...arr, digit];
      // Max 7 total across all positions
      const total = (position === 'hundreds' ? newArr.length : (prev.hundreds?.length || 0))
        + (position === 'tens' ? newArr.length : (prev.tens?.length || 0))
        + (position === 'units' ? newArr.length : (prev.units?.length || 0));
      if (total > 7) return prev;
      return { ...prev, [position]: newArr };
    });
  };

  // --- Add to cart ---
  const addToCart = () => {
    if (amount <= 0) { showToast('กรุณาระบุจำนวนเงิน'); return; }

    if (currentTabInfo.positioned) {
      // Pin bet
      const pin = activeTab === 'pin_top'
        ? { hundreds: pinSelection.hundreds, tens: pinSelection.tens, units: pinSelection.units }
        : { tens: pinSelection.tens, units: pinSelection.units };

      const hasSelection = Object.values(pin).some(arr => arr.length > 0);
      if (!hasSelection) { showToast('กรุณาเลือกตัวเลข'); return; }

      // Calculate number of combinations
      let combos = 1;
      if (pin.hundreds?.length) combos *= pin.hundreds.length;
      if (pin.tens?.length) combos *= pin.tens.length;
      if (pin.units?.length) combos *= pin.units.length;

      setCart(prev => [...prev, {
        type: activeTab,
        numbers: JSON.stringify(pin),
        amountPerCombo: amount,
        totalAmount: amount * combos,
        combos,
        label: currentTabInfo.name,
      }]);
      setPinSelection({ hundreds: [], tens: [], units: [] });
    } else {
      // Normal bet
      if (!inputNumber || inputNumber.length !== currentTabInfo.digits) {
        showToast(`กรุณาใส่เลข ${currentTabInfo.digits} หลัก`);
        return;
      }
      setCart(prev => [...prev, {
        type: activeTab,
        numbers: inputNumber,
        amountPerCombo: amount,
        totalAmount: amount,
        combos: 1,
        label: currentTabInfo.name,
      }]);
      setInputNumber('');
    }
    setAmount(0);
    showToast('เพิ่มรายการแล้ว');
  };

  // --- Submit bets ---
  const submitBets = async () => {
    if (cart.length === 0) { showToast('ไม่มีรายการแทง'); return; }
    if (!bettingOpen) { showToast('หมดเวลาแทงงวดนี้'); return; }
    if (submitting) return;

    const totalAmount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
    if (totalAmount > balance) { showToast('ยอดเงินไม่พอ'); return; }

    setSubmitting(true);
    try {
      for (const item of cart) {
        const { data, error } = await supabase.rpc('fn_place_instant_bet', {
          p_draw_id: drawId,
          p_bet_type: item.type,
          p_numbers: item.numbers,
          p_amount: item.amountPerCombo,
        });
        if (error || !data?.ok) {
          showToast(data?.error || error?.message || 'เกิดข้อผิดพลาด');
          break;
        }
      }
      setCart([]);
      showToast('บันทึกสำเร็จ');
    } catch (err) {
      showToast('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Remove from cart ---
  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- History ---
  const openHistory = async () => {
    try {
      const { data } = await supabase.rpc('fn_get_instant_bets');
      if (data?.ok) setHistoryData(data.bets || []);
    } catch (err) {
      console.error('openHistory error:', err);
    }
    setShowHistory(true);
  };

  // --- Toast ---
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // --- Format result digits for display ---
  const renderDigits = (str, size = 'w-9 h-9 text-lg') => {
    if (!str) return Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className={`${size} bg-gray-700/50 rounded-full flex items-center justify-center text-white/30 text-lg`}>-</div>
    ));
    return str.split('').map((d, i) => (
      <div key={i} className={`${size} bg-white rounded-full flex items-center justify-center text-emerald-900 font-bold text-lg`}>{d}</div>
    ));
  };

  return (
    <div
      className="min-h-screen text-white pb-28 relative overflow-x-hidden"
      style={{ background: 'radial-gradient(ellipse at top, #0d4a0a 0%, #064e3b 40%, #021a0b 100%)' }}
    >
      {/* ───────── Header (Glass + Gold accent) ───────── */}
      <div
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        style={{ background: 'linear-gradient(180deg, rgba(6,78,59,0.95) 0%, rgba(13,74,10,0.92) 100%)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/home')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center active:scale-95 transition-all hover:bg-white/15 shadow-lg"
          >
            <span className="material-icons text-xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-extrabold tracking-wide drop-shadow-[0_2px_6px_rgba(212,175,55,0.4)]">
            หวยไทย <span className="text-[#D4AF37]">1</span> นาที
          </h1>
          <button
            onClick={openHistory}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center active:scale-95 transition-all hover:bg-white/15 shadow-lg"
          >
            <span className="material-icons text-xl">history</span>
          </button>
        </div>
      </div>

      {/* ───────── Status Bar (premium) ───────── */}
      <div
        className="px-4 py-3 flex items-center justify-between backdrop-blur-sm border-b border-[#D4AF37]/15"
        style={{ background: 'linear-gradient(90deg, rgba(6,78,59,0.5) 0%, rgba(13,74,10,0.55) 50%, rgba(6,78,59,0.5) 100%)' }}
      >
        <div className="text-sm">
          <span className="text-emerald-300/80 text-xs">งวดที่</span>{' '}
          <span className="font-extrabold text-[#D4AF37] font-mono tabular-nums drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">{drawId}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 border border-[#D4AF37]/30 shadow-inner">
          <span className={`material-icons text-base ${countdown <= 10 ? 'text-red-400' : 'text-[#22c55e]'}`}>schedule</span>
          <span className={`font-mono text-xl font-extrabold tabular-nums ${countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-[#D4AF37]'}`}>
            {countdown.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] text-emerald-300/80">วิ</span>
        </div>
        <div className="text-sm">
          <span className="text-emerald-300/80 text-xs">เครดิต</span>{' '}
          <span className="font-extrabold text-[#D4AF37] font-mono tabular-nums drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">{Number(balance).toFixed(0)}</span>
        </div>
      </div>

      {/* ───────── Betting Closed Banner ───────── */}
      {!bettingOpen && (
        <div
          className="mx-4 mt-3 rounded-2xl p-3 text-center font-bold animate-pulse shadow-lg shadow-red-500/40 border border-red-400/50"
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' }}
        >
          ⏸ ปิดรับแทงชั่วคราว — รอผลงวดหน้า
        </div>
      )}

      {/* ───────── Result Card (premium glass) ───────── */}
      {lastResult && (
        <div
          className="mx-4 mt-4 rounded-3xl p-4 space-y-3 border border-[#D4AF37]/30 shadow-2xl shadow-black/50 backdrop-blur-md"
          style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.85) 0%, rgba(13,74,10,0.85) 100%)' }}
        >
          <h3 className="text-center text-sm font-bold text-[#D4AF37] tracking-wide">
            ผลงวดที่ <span className="font-mono">{lastResult.draw_id}</span>
          </h3>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/70 mb-2">รางวัลที่ 1</p>
            <div className="flex justify-center gap-1.5">{renderDigits(lastResult.result_6d)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <ResultCell label="3 ตัวหน้า" value={lastResult.result_3front} />
            <ResultCell label="3 ตัวท้าย" value={lastResult.result_3back} />
            <ResultCell label="2 ตัวบน" value={lastResult.result_2top} />
          </div>
        </div>
      )}

      {/* ───────── Bet Tabs (premium pill) ───────── */}
      <div className="px-4 mt-4">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {BET_TABS.map(tab => {
            const active = activeTab === tab.code;
            return (
              <button
                key={tab.code}
                onClick={() => { setActiveTab(tab.code); setInputNumber(''); setPinSelection({ hundreds: [], tens: [], units: [] }); }}
                className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-extrabold tracking-wide transition-all active:scale-95 ${
                  active
                    ? 'text-[#0a3a07] shadow-lg shadow-[#D4AF37]/50 border-2 border-[#D4AF37]'
                    : 'text-emerald-100 border-2 border-[#137c10]/40 hover:border-[#137c10] backdrop-blur-sm'
                }`}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)'
                    : 'linear-gradient(135deg, rgba(13,74,10,0.7) 0%, rgba(6,78,59,0.7) 100%)',
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────── Input Area ───────── */}
      <div className="px-4 mt-3">
        {currentTabInfo?.positioned ? (
          <PinSelector mode={activeTab} selection={pinSelection} onToggle={togglePinDigit} />
        ) : (
          <div
            className="rounded-3xl p-4 border border-[#137c10]/30 shadow-xl shadow-black/40 backdrop-blur-md"
            style={{ background: 'linear-gradient(135deg, rgba(13,74,10,0.7) 0%, rgba(6,78,59,0.7) 100%)' }}
          >
            {/* Display row */}
            <div className="flex items-center justify-center gap-2 mb-4 min-h-[52px]">
              {inputNumber.length === 0 ? (
                <span className="text-[#D4AF37]/50 text-sm tracking-wider">
                  ใส่เลข <span className="font-bold text-[#D4AF37]/70">{currentTabInfo?.digits}</span> หลัก
                </span>
              ) : (
                inputNumber.split('').map((d, i) => (
                  <div
                    key={i}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[#0a3a07] font-extrabold text-xl shadow-lg shadow-[#D4AF37]/40 border-2 border-[#D4AF37]"
                    style={{ background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }}
                  >
                    {d}
                  </div>
                ))
              )}
            </div>

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2.5">
              {['1','2','3','4','5','6','7','8','9','del','0','clear'].map(key => {
                const isDel = key === 'del';
                const isClear = key === 'clear';
                return (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key)}
                    className={`py-4 rounded-2xl font-extrabold active:scale-95 transition-all border ${
                      isDel
                        ? 'text-white text-base border-red-400/50 shadow-md shadow-red-900/50'
                        : isClear
                        ? 'text-white text-base border-slate-500/40 shadow-md shadow-black/40'
                        : 'text-white text-2xl border-[#137c10]/50 shadow-md shadow-black/40'
                    }`}
                    style={{
                      background: isDel
                        ? 'linear-gradient(180deg, #b91c1c 0%, #7f1d1d 100%)'
                        : isClear
                        ? 'linear-gradient(180deg, #475569 0%, #1e293b 100%)'
                        : 'linear-gradient(180deg, #137c10 0%, #0d4a0a 100%)',
                    }}
                  >
                    {isDel ? '⌫' : isClear ? 'ล้าง' : key}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ───────── Amount + Add to Cart ───────── */}
      <div className="px-4 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowMoneyModal(true)}
          className={`flex-1 py-3.5 rounded-2xl font-extrabold text-sm border transition-all active:scale-[0.98] ${
            amount > 0
              ? 'text-[#0a3a07] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/40'
              : 'text-emerald-200 border-[#137c10]/40 backdrop-blur-sm'
          }`}
          style={{
            background: amount > 0
              ? 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)'
              : 'linear-gradient(135deg, rgba(13,74,10,0.6) 0%, rgba(6,78,59,0.6) 100%)',
          }}
        >
          {amount > 0 ? `฿ ${amount.toLocaleString()}` : 'ระบุจำนวนเงิน'}
        </button>
        <button
          onClick={addToCart}
          disabled={!bettingOpen}
          className="px-7 py-3.5 rounded-2xl font-extrabold text-sm text-white active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-emerald-500/40 border border-[#22c55e]/60"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 50%, #15803d 100%)' }}
        >
          เพิ่ม
        </button>
      </div>

      {/* ───────── Cart ───────── */}
      {cart.length > 0 && (
        <div className="px-4 mt-3 space-y-2">
          {cart.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl p-3.5 flex items-center justify-between border border-[#137c10]/30 shadow-md backdrop-blur-md"
              style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.75) 0%, rgba(13,74,10,0.75) 100%)' }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30 bg-black/20 shrink-0">
                  {item.label}
                </span>
                <span className="font-mono font-bold text-white truncate">
                  {item.type.startsWith('pin_') ? 'ปักหลัก' : item.numbers}
                </span>
                {item.combos > 1 && (
                  <span className="text-[10px] text-[#D4AF37]/80 shrink-0">×{item.combos}</span>
                )}
                <span className="ml-auto font-extrabold text-[#D4AF37] shrink-0">฿{item.totalAmount.toLocaleString()}</span>
              </div>
              <button
                onClick={() => removeFromCart(i)}
                className="ml-3 w-7 h-7 rounded-full flex items-center justify-center text-red-300 bg-red-900/30 border border-red-500/30 hover:bg-red-900/50 active:scale-90 transition-all shrink-0"
              >
                ✕
              </button>
            </div>
          ))}
          <div
            className="flex items-center justify-between p-3 rounded-2xl mt-2 border border-[#D4AF37]/30 shadow-lg"
            style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.8) 0%, rgba(13,74,10,0.8) 100%)' }}
          >
            <div className="text-sm">
              <span className="text-emerald-200">รวม </span>
              <span className="text-[#D4AF37] font-extrabold text-lg font-mono">
                ฿{cart.reduce((s, i) => s + i.totalAmount, 0).toLocaleString()}
              </span>
            </div>
            <button
              onClick={submitBets}
              disabled={!bettingOpen || submitting}
              className="px-7 py-3 rounded-2xl font-extrabold text-[#0a3a07] active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-[#D4AF37]/50 border-2 border-[#D4AF37] tracking-wide"
              style={{ background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }}
            >
              {submitting ? 'กำลังส่ง...' : 'แทงเลย'}
            </button>
          </div>
        </div>
      )}

      {/* ───────── Money Modal ───────── */}
      {showMoneyModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm bg-black/70"
          onClick={() => setShowMoneyModal(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6 border-t-2 border-[#D4AF37]/50 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #064e3b 0%, #0d4a0a 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[#D4AF37]/40 rounded-full mx-auto mb-4" />
            <h3 className="text-center font-extrabold text-[#D4AF37] text-lg mb-5 tracking-wide">ระบุจำนวนเงิน</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CHIPS.map(c => {
                const selected = amount === c;
                return (
                  <button
                    key={c}
                    onClick={() => setAmount(c)}
                    className={`py-3 rounded-2xl font-extrabold active:scale-95 transition-all border ${
                      selected
                        ? 'text-[#0a3a07] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/40'
                        : 'text-white border-[#137c10]/40 hover:border-[#137c10]'
                    }`}
                    style={{
                      background: selected
                        ? 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)'
                        : 'linear-gradient(135deg, rgba(19,124,16,0.5) 0%, rgba(13,74,10,0.5) 100%)',
                    }}
                  >
                    ฿{c}
                  </button>
                );
              })}
            </div>
            <input
              type="number"
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              placeholder="หรือพิมพ์จำนวนเอง"
              className="w-full rounded-2xl px-4 py-3 text-center text-white placeholder-emerald-300/40 outline-none focus:ring-2 ring-[#D4AF37] bg-black/30 border border-[#137c10]/40 font-mono text-lg font-bold"
            />
            <button
              onClick={() => setShowMoneyModal(false)}
              className="w-full mt-4 py-3.5 rounded-2xl font-extrabold text-[#0a3a07] shadow-lg shadow-[#D4AF37]/40 active:scale-[0.98] transition-all border-2 border-[#D4AF37] tracking-wide"
              style={{ background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }}
            >
              ยืนยัน
            </button>
          </div>
        </div>
      )}

      {/* ───────── Result Popup ───────── */}
      {showResultPopup && popupData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowResultPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 text-center border-2 border-[#D4AF37]/50 shadow-2xl shadow-[#D4AF37]/30 animate-[popIn_0.4s_ease]"
            style={{ background: 'linear-gradient(135deg, #064e3b 0%, #0d4a0a 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-extrabold text-[#D4AF37] mb-2 tracking-wide">
              ผลงวดที่ <span className="font-mono">{popupData.draw_id}</span>
            </h3>
            <div className="flex justify-center gap-1.5 mb-3">{renderDigits(popupData.result_6d)}</div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <ResultCell label="3 ตัวหน้า" value={popupData.result_3front} />
              <ResultCell label="3 ตัวท้าย" value={popupData.result_3back} />
              <ResultCell label="2 ตัวบน" value={popupData.result_2top} />
            </div>
            {popupData.total_win > 0 ? (
              <div
                className="rounded-2xl p-5 mb-4 border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/40"
                style={{ background: 'linear-gradient(135deg, rgba(245,207,87,0.15) 0%, rgba(184,134,11,0.15) 100%)' }}
              >
                <p className="text-[#D4AF37] font-extrabold text-xl drop-shadow-[0_2px_8px_rgba(212,175,55,0.5)]">🎉 ถูกรางวัล!</p>
                <p className="text-[#D4AF37] text-3xl font-black font-mono mt-1 drop-shadow-[0_2px_12px_rgba(212,175,55,0.6)]">
                  +฿{Number(popupData.total_win).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="rounded-2xl p-4 mb-4 border border-[#137c10]/30 bg-black/30">
                <p className="text-emerald-200">ไม่ถูกรางวัลในงวดนี้</p>
              </div>
            )}
            <button
              onClick={() => setShowResultPopup(false)}
              className="w-full py-3 rounded-2xl font-extrabold text-[#0a3a07] shadow-lg shadow-[#D4AF37]/40 active:scale-[0.98] transition-all border-2 border-[#D4AF37] tracking-wide"
              style={{ background: 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)' }}
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ───────── History Modal ───────── */}
      {showHistory && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center backdrop-blur-sm bg-black/70"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl p-6 max-h-[75vh] overflow-y-auto border-t-2 border-[#D4AF37]/50 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #064e3b 0%, #0d4a0a 100%)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-[#D4AF37]/40 rounded-full mx-auto mb-4" />
            <h3 className="text-center font-extrabold text-[#D4AF37] text-lg mb-4 tracking-wide">ประวัติการแทง</h3>
            {historyData.length === 0 ? (
              <p className="text-center text-emerald-300/50 py-8">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-2">
                {historyData.map((bet, i) => (
                  <div
                    key={i}
                    className="rounded-2xl p-3 flex items-center justify-between border border-[#137c10]/30 backdrop-blur-md"
                    style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.7) 0%, rgba(13,74,10,0.7) 100%)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-emerald-300/80 tracking-wide">งวด <span className="font-mono">{bet.draw_id}</span> · <span className="text-[#D4AF37]/90">{bet.bet_type}</span></p>
                      <p className="font-mono font-bold truncate">{bet.bet_type?.startsWith('pin_') ? 'ปักหลัก' : bet.numbers}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-sm font-mono">฿{Number(bet.amount).toLocaleString()}</p>
                      <p className={`text-xs font-extrabold ${
                        bet.status === 'WON' ? 'text-[#D4AF37]' :
                        bet.status === 'LOST' ? 'text-red-400' :
                        'text-emerald-300'
                      }`}>
                        {bet.status === 'WON' ? `+฿${Number(bet.winnings).toLocaleString()}` :
                         bet.status === 'LOST' ? 'ไม่ถูก' : 'รอผล'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 py-3 rounded-2xl font-bold text-white bg-black/30 border border-[#137c10]/40 active:scale-[0.98] transition-all"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {/* ───────── Toast ───────── */}
      {toast && (
        <div
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm border border-[#D4AF37]/40 backdrop-blur-md"
          style={{ background: 'linear-gradient(135deg, rgba(6,78,59,0.95) 0%, rgba(13,74,10,0.95) 100%)' }}
        >
          <span className="text-[#D4AF37]">{toast}</span>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/* ───────── Sub Components ───────── */
function ResultCell({ label, value }) {
  return (
    <div className="rounded-xl p-2 bg-black/25 border border-[#137c10]/30">
      <p className="text-[10px] text-emerald-300/70 tracking-wider">{label}</p>
      <p className="font-extrabold tracking-[0.15em] text-white font-mono mt-0.5">{value || '—'}</p>
    </div>
  );
}

function PinSelector({ mode, selection, onToggle }) {
  const positions = mode === 'pin_top'
    ? [
        { key: 'hundreds', label: 'หลักร้อย' },
        { key: 'tens', label: 'หลักสิบ' },
        { key: 'units', label: 'หลักหน่วย' },
      ]
    : [
        { key: 'tens', label: 'หลักสิบ' },
        { key: 'units', label: 'หลักหน่วย' },
      ];

  const totalSelected = Object.values(selection).reduce((s, arr) => s + (arr?.length || 0), 0);

  return (
    <div
      className="rounded-3xl p-4 space-y-3 border border-[#137c10]/30 shadow-xl shadow-black/40 backdrop-blur-md"
      style={{ background: 'linear-gradient(135deg, rgba(13,74,10,0.7) 0%, rgba(6,78,59,0.7) 100%)' }}
    >
      {positions.map(pos => (
        <div key={pos.key}>
          <p className="text-xs text-[#D4AF37] mb-2 font-extrabold tracking-wide">{pos.label}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i).map(digit => {
              const selected = (selection[pos.key] || []).includes(digit);
              return (
                <button
                  key={digit}
                  onClick={() => onToggle(pos.key, digit)}
                  className={`py-2.5 rounded-xl font-extrabold text-base active:scale-90 transition-all border ${
                    selected
                      ? 'text-[#0a3a07] border-[#D4AF37] shadow-md shadow-[#D4AF37]/40'
                      : 'text-white border-[#137c10]/50'
                  }`}
                  style={{
                    background: selected
                      ? 'linear-gradient(135deg, #f5cf57 0%, #D4AF37 50%, #b8860b 100%)'
                      : 'linear-gradient(180deg, #137c10 0%, #0d4a0a 100%)',
                  }}
                >
                  {digit}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-center text-xs text-emerald-300/70 pt-1">
        เลือกแล้ว: <span className="text-[#D4AF37] font-bold">{totalSelected}</span>/7 ตัว
      </div>
    </div>
  );
}
