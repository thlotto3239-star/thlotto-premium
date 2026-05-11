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
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-emerald-950 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-emerald-900/95 backdrop-blur border-b border-emerald-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate('/home')} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-icons text-xl">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold">หวยไทย 1 นาที</h1>
          <button onClick={openHistory} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-icons text-xl">history</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-3 flex items-center justify-between bg-emerald-800/50">
        <div className="text-sm">
          <span className="text-emerald-300">งวดที่</span>{' '}
          <span className="font-bold text-yellow-400">{drawId}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="material-icons text-sm text-emerald-300">schedule</span>
          <span className={`font-mono text-xl font-bold ${countdown <= 10 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
            {countdown.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-emerald-300">วิ</span>
        </div>
        <div className="text-sm">
          <span className="text-emerald-300">เครดิต</span>{' '}
          <span className="font-bold text-yellow-400">{Number(balance).toFixed(0)}</span>
        </div>
      </div>

      {/* Betting Closed Banner */}
      {!bettingOpen && (
        <div className="mx-4 mt-3 bg-red-600/80 rounded-2xl p-3 text-center font-bold animate-pulse">
          ปิดรับแทงชั่วคราว — รอผลงวดหน้า
        </div>
      )}

      {/* Result Table */}
      {lastResult && (
        <div className="mx-4 mt-4 bg-emerald-800/60 rounded-3xl p-4 space-y-3">
          <h3 className="text-center text-sm text-emerald-300 font-bold">ผลงวดที่ {lastResult.draw_id}</h3>
          <div className="text-center">
            <p className="text-[10px] text-emerald-300/70 mb-1">รางวัลที่ 1</p>
            <div className="flex justify-center gap-1.5">{renderDigits(lastResult.result_6d)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-emerald-300/70">3 ตัวหน้า</p>
              <p className="font-bold tracking-wider">{lastResult.result_3front || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70">3 ตัวท้าย</p>
              <p className="font-bold tracking-wider">{lastResult.result_3back || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-300/70">2 ตัวบน</p>
              <p className="font-bold tracking-wider">{lastResult.result_2top || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bet Tabs */}
      <div className="px-4 mt-4">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {BET_TABS.map(tab => (
            <button
              key={tab.code}
              onClick={() => { setActiveTab(tab.code); setInputNumber(''); setPinSelection({ hundreds: [], tens: [], units: [] }); }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                activeTab === tab.code
                  ? 'bg-yellow-400 text-emerald-900 shadow-lg shadow-yellow-400/30'
                  : 'bg-emerald-800 text-emerald-200 hover:bg-emerald-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="px-4 mt-3">
        {currentTabInfo?.positioned ? (
          /* Pin Selector */
          <PinSelector
            mode={activeTab}
            selection={pinSelection}
            onToggle={togglePinDigit}
          />
        ) : (
          /* Numpad */
          <div className="bg-emerald-800/60 rounded-3xl p-4">
            <div className="flex items-center justify-center gap-2 mb-4 min-h-[48px]">
              {inputNumber.length === 0 ? (
                <span className="text-emerald-400/50 text-sm">ใส่เลข {currentTabInfo?.digits} หลัก</span>
              ) : (
                inputNumber.split('').map((d, i) => (
                  <div key={i} className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-emerald-900 font-bold text-lg">{d}</div>
                ))
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['1','2','3','4','5','6','7','8','9','del','0','clear'].map(key => (
                <button
                  key={key}
                  onClick={() => handleNumpad(key)}
                  className={`py-3 rounded-2xl font-bold text-lg active:scale-95 transition-transform ${
                    key === 'del' ? 'bg-red-600/60 text-white text-sm' :
                    key === 'clear' ? 'bg-gray-600/60 text-white text-sm' :
                    'bg-emerald-700 text-white'
                  }`}
                >
                  {key === 'del' ? '⌫' : key === 'clear' ? 'ล้าง' : key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Amount + Add to Cart */}
      <div className="px-4 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowMoneyModal(true)}
          className={`flex-1 py-3 rounded-2xl font-bold text-sm ${
            amount > 0 ? 'bg-yellow-400 text-emerald-900' : 'bg-emerald-800 text-emerald-200'
          }`}
        >
          {amount > 0 ? `฿${amount}` : 'ระบุจำนวนเงิน'}
        </button>
        <button
          onClick={addToCart}
          disabled={!bettingOpen}
          className="px-6 py-3 rounded-2xl font-bold text-sm bg-emerald-600 text-white active:scale-95 transition-transform disabled:opacity-50"
        >
          เพิ่ม
        </button>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="px-4 mt-3 space-y-2">
          {cart.map((item, i) => (
            <div key={i} className="bg-emerald-800/60 rounded-2xl p-3 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-300">{item.label}</span>
                <span className="ml-2 font-bold">{item.type.startsWith('pin_') ? 'ปักหลัก' : item.numbers}</span>
                {item.combos > 1 && <span className="ml-1 text-xs text-yellow-400">×{item.combos}</span>}
                <span className="ml-2 text-yellow-400 font-bold">฿{item.totalAmount}</span>
              </div>
              <button onClick={() => removeFromCart(i)} className="text-red-400 text-sm">✕</button>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-emerald-300">รวม: <span className="text-yellow-400 font-bold">฿{cart.reduce((s, i) => s + i.totalAmount, 0)}</span></span>
            <button
              onClick={submitBets}
              disabled={!bettingOpen || submitting}
              className="px-8 py-3 rounded-2xl font-bold bg-yellow-400 text-emerald-900 active:scale-95 transition-transform disabled:opacity-50"
            >
              {submitting ? 'กำลังส่ง...' : 'แทงเลย'}
            </button>
          </div>
        </div>
      )}

      {/* Money Modal */}
      {showMoneyModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowMoneyModal(false)}>
          <div className="bg-emerald-900 w-full max-w-md rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-center font-bold mb-4">ระบุจำนวนเงิน</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CHIPS.map(c => (
                <button
                  key={c}
                  onClick={() => setAmount(c)}
                  className={`py-3 rounded-2xl font-bold ${amount === c ? 'bg-yellow-400 text-emerald-900' : 'bg-emerald-800 text-white'}`}
                >฿{c}</button>
              ))}
            </div>
            <input
              type="number"
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              placeholder="หรือพิมพ์จำนวนเอง"
              className="w-full bg-emerald-800 rounded-2xl px-4 py-3 text-center text-white placeholder-emerald-400/50 outline-none focus:ring-2 ring-yellow-400"
            />
            <button
              onClick={() => setShowMoneyModal(false)}
              className="w-full mt-3 py-3 rounded-2xl font-bold bg-yellow-400 text-emerald-900"
            >ยืนยัน</button>
          </div>
        </div>
      )}

      {/* Result Popup */}
      {showResultPopup && popupData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70" onClick={() => setShowResultPopup(false)}>
          <div className="bg-emerald-900 w-full max-w-sm rounded-3xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">ผลงวดที่ {popupData.draw_id}</h3>
            <div className="flex justify-center gap-1.5 mb-3">{renderDigits(popupData.result_6d)}</div>
            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div>
                <p className="text-[10px] text-emerald-300/70">3 ตัวหน้า</p>
                <p className="font-bold">{popupData.result_3front}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-300/70">3 ตัวท้าย</p>
                <p className="font-bold">{popupData.result_3back}</p>
              </div>
              <div>
                <p className="text-[10px] text-emerald-300/70">2 ตัวบน</p>
                <p className="font-bold">{popupData.result_2top}</p>
              </div>
            </div>
            {popupData.total_win > 0 ? (
              <div className="bg-yellow-400/20 rounded-2xl p-4 mb-4">
                <p className="text-yellow-400 font-bold text-xl">🎉 ถูกรางวัล!</p>
                <p className="text-yellow-300 text-2xl font-black">฿{popupData.total_win}</p>
              </div>
            ) : (
              <div className="bg-emerald-800/60 rounded-2xl p-4 mb-4">
                <p className="text-emerald-300">ไม่ถูกรางวัลในงวดนี้</p>
              </div>
            )}
            <button
              onClick={() => setShowResultPopup(false)}
              className="w-full py-3 rounded-2xl font-bold bg-yellow-400 text-emerald-900"
            >ปิด</button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowHistory(false)}>
          <div className="bg-emerald-900 w-full max-w-md rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-center font-bold mb-4">ประวัติการแทง</h3>
            {historyData.length === 0 ? (
              <p className="text-center text-emerald-400/50">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-2">
                {historyData.map((bet, i) => (
                  <div key={i} className="bg-emerald-800/60 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-300">งวด {bet.draw_id} · {bet.bet_type}</p>
                      <p className="font-bold">{bet.type?.startsWith('pin_') ? 'ปักหลัก' : bet.numbers}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">฿{bet.amount}</p>
                      <p className={`text-xs font-bold ${bet.status === 'WON' ? 'text-yellow-400' : bet.status === 'LOST' ? 'text-red-400' : 'text-emerald-300'}`}>
                        {bet.status === 'WON' ? `+฿${bet.winnings}` : bet.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowHistory(false)}
              className="w-full mt-4 py-3 rounded-2xl font-bold bg-emerald-800 text-white"
            >ปิด</button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-800 text-white px-6 py-3 rounded-2xl shadow-xl font-bold text-sm animate-bounce">
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

/* Pin Selector Component */
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

  return (
    <div className="bg-emerald-800/60 rounded-3xl p-4 space-y-3">
      {positions.map(pos => (
        <div key={pos.key}>
          <p className="text-xs text-emerald-300 mb-2 font-bold">{pos.label}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: 10 }, (_, i) => i).map(digit => {
              const selected = (selection[pos.key] || []).includes(digit);
              return (
                <button
                  key={digit}
                  onClick={() => onToggle(pos.key, digit)}
                  className={`py-2 rounded-xl font-bold text-sm active:scale-95 transition-all ${
                    selected ? 'bg-yellow-400 text-emerald-900' : 'bg-emerald-700 text-white'
                  }`}
                >
                  {digit}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-center text-xs text-emerald-300/70">
        เลือกแล้ว: {Object.values(selection).flat().length}/7 ตัว
      </div>
    </div>
  );
}
