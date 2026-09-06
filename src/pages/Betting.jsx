import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useModal } from '../contexts/ModalContext';

const DEFAULT_RATES = {
  '6DIGIT': 2000000, '4TOP': 6000, '3TOP': 900, '3TODE': 150, '3FRONT': 450,
  '3BOTTOM': 450, '2TOP': 95, '2BOTTOM': 95, 'RUN_UP': 3.2, 'RUN_DOWN': 4.2
};

// ตามมาตรฐานหวยออนไลน์ไทย:
// - หวยรัฐบาล: 6DIGIT, 3TOP, 3TODE, 3FRONT, 3BOTTOM, 2TOP, 2BOTTOM, RUN_UP, RUN_DOWN
// - หวยลาว/ฮานอย/มาเลย์ (4 หลัก): 4TOP, 3TOP, 3TODE, 2TOP, 2BOTTOM, RUN_UP, RUN_DOWN
// - หวยหุ้น (3 หลัก): 3TOP, 3TODE, 2TOP, 2BOTTOM, RUN_UP, RUN_DOWN
const BASE_CATEGORIES = [
  { name: '6 ตัวตรง', code: '6DIGIT', limit: 6, span: 'full' },
  { name: '4 ตัวตรง', code: '4TOP', limit: 4, span: 'full' },
  { name: '3 ตัวบน', code: '3TOP', limit: 3, span: 'half', active: true },
  { name: '3 ตัวโต๊ด', code: '3TODE', limit: 3, span: 'half' },
  { name: '3 ตัวหน้า', code: '3FRONT', limit: 3, span: 'half' },
  { name: '3 ตัวล่าง', code: '3BOTTOM', limit: 3, span: 'half' },
  { name: '2 ตัวบน', code: '2TOP', limit: 2, span: 'half' },
  { name: '2 ตัวล่าง', code: '2BOTTOM', limit: 2, span: 'half' },
  { name: 'วิ่งบน', code: 'RUN_UP', limit: 1, span: 'half', dashed: true },
  { name: 'วิ่งล่าง', code: 'RUN_DOWN', limit: 1, span: 'half', dashed: true },
];

const Betting = () => {
  const { refreshProfile } = useAuth();
  const { showSuccess, showError, showConfirm } = useModal();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { marketId: paramMarketId } = useParams();
  const drawId = searchParams.get('draw') || paramMarketId;
  const [draw, setDraw] = useState(null);
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [streamKey, setStreamKey] = useState(0);
  const [categories, setCategories] = useState(BASE_CATEGORIES.map(c => ({ ...c, rate: DEFAULT_RATES[c.code] })));
  const [currentDigits, setCurrentDigits] = useState([]);
  const [digitLimit, setDigitLimit] = useState(3);
  const [currentCategory, setCurrentCategory] = useState('3TOP');
  const [betAmount, setBetAmount] = useState(100);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSuccessAnimating, setIsSuccessAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ h: '00', m: '00', s: '00', isExpired: false });
  const [editingIdx, setEditingIdx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    if (!draw?.next_close_time) return;
    const closeTime = new Date(draw.next_close_time);
    const timer = setInterval(() => {
      const diff = closeTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: '00', m: '00', s: '00', d: '00', isExpired: true });
        clearInterval(timer);
        return;
      }
      const totalSecs = Math.floor(diff / 1000);
      const d = Math.floor(totalSecs / 86400);
      const h = Math.floor((totalSecs % 86400) / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      const s = totalSecs % 60;
      setTimeLeft({
        d: d.toString().padStart(2, '0'),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0'),
        isExpired: false
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [draw?.id, draw?.next_close_time]);

  useEffect(() => {
    if (!drawId) { navigate('/lottery-list', { replace: true }); return; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawId]);

  useEffect(() => {
    const fetchDraw = async () => {
      if (!drawId) return;
      const { data: markets } = await supabase.rpc('get_markets_with_countdown');
      const data = (markets || []).find(m => m.id === drawId);
      if (!data) { navigate('/lottery-list', { replace: true }); return; }
      setDraw(data);
      if (data.stream_url) setLiveStreamUrl(data.stream_url);
      if (!data.is_open) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00', isExpired: true });
      }
      const { data: rates } = await supabase
        .from('payout_rates')
        .select('bet_type, rate')
        .eq('market', data.code);
      if (rates && rates.length > 0) {
        const rateMap = {};
        rates.forEach(r => { rateMap[r.bet_type] = Number(r.rate); });
        const filtered = BASE_CATEGORIES.filter(c => rateMap[c.code] !== undefined).map(c => ({ ...c, rate: rateMap[c.code] }));
        setCategories(filtered);
        if (!filtered.find(c => c.code === currentCategory)) {
          const first = filtered.find(c => c.code === '3TOP') || filtered[0];
          if (first) { setCurrentCategory(first.code); setDigitLimit(first.limit); }
        }
      }
    };
    fetchDraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawId]);

  const getEmbedUrl = (url, muted) => {
    if (!url) return null;
    const muteParam = muted ? '1' : '0';
    const base = `autoplay=1&mute=${muteParam}&rel=0&modestbranding=1&playsinline=1`;
    
    // Facebook video or live embed
    if (url.includes('facebook.com/plugins/video.php')) {
      const u = new URL(url);
      u.searchParams.set('autoplay', 'true');
      u.searchParams.set('mute', muted ? 'true' : 'false');
      return u.toString();
    }
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      const encodedUrl = encodeURIComponent(url);
      const muteFbParam = muted ? 'true' : 'false';
      return `https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&t=0&autoplay=true&mute=${muteFbParam}`;
    }

    // YouTube embed already
    if (url.includes('youtube.com/embed/')) {
      const u = new URL(url);
      u.searchParams.set('autoplay', '1');
      u.searchParams.set('mute', muteParam);
      u.searchParams.set('rel', '0');
      return u.toString();
    }
    // youtube.com/watch?v=
    const ytWatch = url.match(/[?&]v=([^&]+)/);
    if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?${base}`;
    // youtube.com/live/ID
    const ytLive = url.match(/youtube\.com\/live\/([^?&/]+)/);
    if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}?${base}`;
    // youtu.be/ID
    const ytShort = url.match(/youtu\.be\/([^?&/]+)/);
    if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?${base}`;
    // Other: return as-is (assume it's already embeddable)
    return url;
  };

  const handleToggleMute = () => {
    setIsMuted(prev => !prev);
    setStreamKey(prev => prev + 1);
  };

  const embedUrl = getEmbedUrl(liveStreamUrl, isMuted);

  const currentCat = categories.find(c => c.code === currentCategory);

  const handleCategoryChange = (cat) => {
    setCurrentCategory(cat.code);
    setDigitLimit(cat.limit);
    setCurrentDigits([]);
  };

  const handleNumpadClick = (num) => {
    if (currentDigits.length >= digitLimit) return;
    const newDigits = [...currentDigits, num];
    setCurrentDigits(newDigits);
    if (newDigits.length === digitLimit) {
      addToCart(newDigits.join(''));
    }
  };

  const addToCart = (numbers) => {
    setCart(prev => [...prev, {
      numbers,
      type: currentCategory,
      amount: betAmount,
      rate: currentCat?.rate ?? DEFAULT_RATES[currentCategory]
    }]);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setIsSuccessAnimating(true);
    setTimeout(() => {
      setIsSuccessAnimating(false);
      setCurrentDigits([]);
    }, 600);
  };

  const handleBackspace = () => setCurrentDigits(prev => prev.slice(0, -1));
  const handleClear = () => setCurrentDigits([]);
  const handleRemoveFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const handleEditAmount = (idx) => {
    setEditingIdx(idx);
    setEditAmount(cart[idx].amount.toString());
  };
  const handleSaveAmount = (idx) => {
    const val = parseInt(editAmount);
    if (!isNaN(val) && val > 0) {
      setCart(prev => prev.map((item, i) => i === idx ? { ...item, amount: val } : item));
    }
    setEditingIdx(null);
  };

  const totalAmount = cart.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    if (timeLeft.isExpired) {
      showError('งวดปิดแล้ว', 'งวดนี้ปิดรับแทงแล้ว ไม่สามารถส่งโพยได้');
      return;
    }

    // คำนวณยอดรวม
    const totalAmount = cart.reduce((sum, item) => sum + item.amount, 0);

    // แสดง Confirm Modal ก่อนส่ง
    showConfirm(
      'ยืนยันการแทงหวย?',
      `จำนวนโพย: ${cart.length} รายการ\nยอดรวม: ฿${totalAmount.toLocaleString()}\n\nยืนยันการส่งโพย?`,
      async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.rpc('place_bet_securely', {
            p_market_id: drawId,
            p_bets: cart.map(item => ({
              numbers: item.numbers,
              bet_type: item.type,
              amount: item.amount,
              payout_rate: item.rate
            }))
          });
          if (error) throw error;
          if (!data.success) throw new Error(data.message);
          await refreshProfile();
          // แสดง Success แล้วค่อยไปหน้า bet-history
          showSuccess(
            'ส่งโพยสำเร็จ!',
            `แทงหวยสำเร็จ ${cart.length} รายการ\nยอดรวม: ฿${totalAmount.toLocaleString()}`,
            () => navigate('/bet-history')
          );
        } catch (err) {
          showError('แทงหวยไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการส่งโพย กรุณาลองใหม่');
        } finally {
          setLoading(false);
        }
      },
      'ยืนยันแทง',
      'ยกเลิก'
    );
  };

  // Keyboard listener for desktop PC numpad & keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (timeLeft.isExpired) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadClick(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter') {
        if (cart.length > 0 && !loading) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDigits, digitLimit, cart, timeLeft.isExpired, loading]);

  // Helper to render Category buttons
  const renderCategoryRow = (codes, opts = {}) => {
    const available = codes.map(c => categories.find(cat => cat.code === c)).filter(Boolean);
    if (available.length === 0) return null;
    const cols = opts.fullWidth ? 1 : Math.min(available.length, 2);
    const colsClass = cols === 1 ? 'grid-cols-1' : 'grid-cols-2';
    return (
      <div className={`grid ${colsClass} gap-2`}>
        {available.map(cat => {
          const isActive = currentCategory === cat.code;
          const dashed = opts.dashed;
          const fullW = opts.fullWidth;
          return (
            <button
              key={cat.code}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`flex flex-col items-center justify-center ${fullW ? 'p-3.5' : 'p-3'} rounded-2xl transition-all active:scale-95 text-center cursor-pointer ${
                isActive
                  ? 'text-white ring-2 ring-primary/40 shadow-sm'
                  : dashed
                    ? 'bg-white border-2 border-dashed border-slate-200 text-slate-600 hover:border-primary/40'
                    : 'bg-white border border-slate-200/80 text-slate-700 hover:border-primary/40'
              }`}
              style={isActive ? { background: 'linear-gradient(135deg, rgb(22,68,30), rgb(13,121,4))' } : {}}
            >
              <span className={`${fullW ? 'text-sm' : 'text-xs'} font-black ${dashed ? 'uppercase tracking-wide' : ''}`}>{cat.name}</span>
              <span className={`${fullW ? 'text-xs' : 'text-[11px]'} font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>
                บาทละ {cat.rate?.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // Reusable Numpad Component
  const renderNumpad = () => (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 select-none">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => handleNumpadClick(n.toString())}
          className="h-14 sm:h-16 flex items-center justify-center bg-white rounded-2xl text-2xl font-black border border-slate-200/80 text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          {n}
        </button>
      ))}
      <button
        type="button"
        onClick={handleBackspace}
        className="h-14 sm:h-16 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 hover:bg-red-100/70 active:scale-95 transition-all cursor-pointer"
        title="ลบหลักล่าสุด (Backspace)"
      >
        <span className="material-symbols-outlined text-2xl sm:text-3xl">backspace</span>
      </button>
      <button
        type="button"
        onClick={() => handleNumpadClick('0')}
        className="h-14 sm:h-16 flex items-center justify-center bg-white rounded-2xl text-2xl font-black border border-slate-200/80 text-slate-800 hover:bg-emerald-50/50 hover:border-emerald-300 active:scale-95 transition-all shadow-2xs cursor-pointer"
      >
        0
      </button>
      <button
        type="button"
        onClick={handleClear}
        className="h-14 sm:h-16 flex items-center justify-center bg-emerald-50 text-primary rounded-2xl font-black border border-emerald-200 hover:bg-emerald-100/80 active:scale-95 transition-all text-xs tracking-wider uppercase cursor-pointer"
        title="ล้างตัวเลข (Esc)"
      >
        ล้าง
      </button>
    </div>
  );

  return (
    <div className="bg-[#f8fafc] min-h-screen font-display text-slate-900 antialiased">
      <audio ref={audioRef} preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* ── CLOSED OVERLAY ── */}
      {timeLeft.isExpired && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="size-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5 border border-red-100">
              <span className="material-symbols-outlined text-red-500 text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">ปิดรับแทงแล้ว</h2>
            <p className="text-sm text-slate-500 mb-6">ตลาดหวยนี้หมดเวลารับแทงของงวดนี้แล้ว<br />กรุณาเลือกตลาดที่ยังเปิดรับแทง</p>
            <button
              onClick={() => navigate('/lottery-list', { replace: true })}
              className="w-full py-4 rounded-2xl font-extrabold text-white text-sm shadow-lg shadow-emerald-900/20 cursor-pointer"
              style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
            >
              กลับไปเลือกตลาดหวย
            </button>
          </div>
        </div>
      )}

      {/* ── RESPONSIVE CONTAINER ── */}
      <div className="w-full max-w-[1720px] 2xl:max-w-[1850px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={() => navigate('/lottery-list')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>กลับไปตลาดหวย</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {draw?.name || 'TH-LOTTO Premium'}
            </span>
          </div>
        </div>

        {/* ── 3-PANE COCKPIT GRID FOR PC WIDESCREEN / LAPTOP / TABLET / MOBILE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
          
          {/* ════ LEFT COLUMN (Pane 1): Live Stream, Countdown, Market Info & Rates ════ */}
          <div className="lg:col-span-3 xl:col-span-3 space-y-4">

            {/* Live Stream / Broadcast Video */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-video shadow-md border border-slate-800">
              {embedUrl ? (
                <>
                  <iframe
                    key={streamKey}
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title="Live Stream"
                    frameBorder="0"
                  />
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-black animate-pulse pointer-events-none shadow-md">
                    <div className="size-2 rounded-full bg-white"></div> ถ่ายทอดสด
                  </div>
                  <button
                    onClick={handleToggleMute}
                    className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-all hover:bg-black/80 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {isMuted ? 'volume_off' : 'volume_up'}
                    </span>
                    {isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <div className="size-14 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>live_tv</span>
                  </div>
                  <p className="text-white font-bold text-sm">การถ่ายทอดสดผลรางวัล</p>
                  <p className="text-white/50 text-xs">จะเปิดอัตโนมัติเมื่อถึงเวลาออกรางวัล</p>
                </div>
              )}
            </div>

            {/* Countdown Banner */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-center sm:text-left">
                <p className={`text-xs font-black uppercase tracking-[0.1em] mb-0.5 ${timeLeft.isExpired ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                  {timeLeft.isExpired ? '● ปิดรับแทงแล้ว' : '● นับถอยหลังปิดรับแทง'}
                </p>
                <p className="text-sm font-bold text-slate-800">{draw?.name || 'สลากกินแบ่งรัฐบาล'}</p>
              </div>
              {!timeLeft.isExpired ? (
                <div className="flex items-center gap-1.5">
                  {[
                    ...(parseInt(timeLeft.d || '0') > 0 ? [{ val: timeLeft.d, label: 'วัน' }] : []),
                    { val: timeLeft.h, label: 'ชม.' },
                    { val: timeLeft.m, label: 'นาที' },
                    { val: timeLeft.s, label: 'วิ' }
                  ].map((t, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <span className="text-lg font-black text-slate-300">:</span>}
                      <div className="flex flex-col items-center justify-center bg-slate-50 size-[50px] sm:size-[54px] rounded-xl border border-slate-200">
                        <span className="text-lg sm:text-xl font-black text-slate-900 leading-none">{t.val}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1">{t.label}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-200">
                  <span className="material-symbols-outlined text-red-500 text-base">lock</span>
                  <span className="text-xs font-black text-red-600">งวดนี้ปิดรับแทงแล้ว</span>
                </div>
              )}
            </div>

            {/* Payout Rates Quick Card on Left Pane */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-emerald-600 text-sm">stars</span>
                อัตราจ่ายตลาดนี้
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {categories.slice(0, 6).map((c) => (
                  <div key={c.code} className="p-2 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <span className="font-bold text-slate-700 text-[11px]">{c.name}</span>
                    <span className="font-mono font-black text-emerald-700 text-xs">฿{c.rate}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ════ CENTER COLUMN (Pane 2): Category Selection, Number Display & Numpad ════ */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">

            {/* Category Selection */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-primary inline-block"></span>
                  เลือกประเภทการแทง
                </h2>
                <span className="text-xs font-bold text-slate-400">เลือกประเภทก่อนกดเลข</span>
              </div>
              <div className="space-y-3">
                {renderCategoryRow(['6DIGIT'], { fullWidth: true })}
                {renderCategoryRow(['4TOP'], { fullWidth: true })}
                {renderCategoryRow(['3TOP', '3TODE'])}
                {renderCategoryRow(['3FRONT', '3BOTTOM'])}
                {renderCategoryRow(['2TOP', '2BOTTOM'])}
                {renderCategoryRow(['RUN_UP', 'RUN_DOWN'], { dashed: true })}
              </div>
            </div>

            {/* Number Display & Bet Amount Quick Select */}
            <div
              className={`flex flex-col gap-3 rounded-2xl p-5 transition-all duration-300 border-2 ${
                isSuccessAnimating
                  ? 'bg-emerald-50/70 border-emerald-400 scale-[1.01]'
                  : 'bg-white border-dashed border-emerald-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-primary tracking-wider uppercase">
                  ตัวเลขที่กำลังเลือก ({currentCat?.name || currentCategory})
                </p>
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">
                  คีย์ผ่านแป้นพิมพ์ 0-9 ได้ทันที
                </span>
              </div>

              {/* Balls */}
              <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center py-2">
                {Array.from({ length: digitLimit }).map((_, i) => (
                  <div
                    key={i}
                    className={`size-14 sm:size-16 flex items-center justify-center rounded-full transition-all duration-300 border-2 ${
                      currentDigits[i]
                        ? 'bg-white border-primary shadow-md shadow-emerald-900/10 scale-105'
                        : 'bg-slate-50 border-slate-200 animate-pulse'
                    }`}
                  >
                    <span className={`text-2xl sm:text-3xl font-black ${currentDigits[i] ? 'text-slate-900' : 'text-slate-300'}`}>
                      {currentDigits[i] || '_'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Amount Selector */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500">ยอดเดิมพันต่องวด:</span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {[10, 20, 50, 100, 200, 500].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setBetAmount(amt)}
                      className={`h-8 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        betAmount === amt
                          ? 'text-white shadow-sm'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                      style={betAmount === amt ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                    >
                      ฿{amt}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-center text-[11px] font-medium text-slate-400 italic">
                ช่องตัวเลขจะเคลียร์อัตโนมัติเมื่อเปลี่ยนประเภท และบันทึกลงโพยทันทีเมื่อกดครบหลัก
              </p>
            </div>

            {/* Interactive Numpad Console */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-lg">dialpad</span>
                  <h3 className="text-sm font-black text-slate-800">แป้นกดตัวเลข</h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  รองรับแป้นพิมพ์ PC (0-9)
                </span>
              </div>
              {renderNumpad()}
            </div>

          </div>

          {/* ════ RIGHT COLUMN (Pane 3): Live Slip Console ════ */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-4 lg:sticky lg:top-5 lg:self-start">

            {/* Live Slip Card */}
            <div className="flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-lg">receipt_long</span>
                  <h3 className="text-sm font-black text-slate-800">โพยหวยของคุณ ({cart.length})</h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="text-xs font-bold text-red-500 hover:text-red-600 hover:underline cursor-pointer"
                  >
                    ล้างโพย
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="p-4 max-h-[340px] overflow-y-auto space-y-2 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                    <span className="material-symbols-outlined text-4xl text-slate-300">touch_app</span>
                    <p className="text-xs font-bold text-slate-500">ยังไม่มีรายการในโพย</p>
                    <p className="text-[11px]">กดตัวเลขบนแป้นพิมพ์หรือคลิกปุ่มเพื่อเพิ่มรายการ</p>
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                          {item.numbers}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-500">{categories.find(c => c.code === item.type)?.name}</p>
                          {editingIdx === idx ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                autoFocus
                                className="w-20 text-xs font-black border border-primary rounded px-2 py-0.5 text-center bg-white"
                                value={editAmount}
                                onChange={e => setEditAmount(e.target.value)}
                                onBlur={() => handleSaveAmount(idx)}
                                onKeyDown={e => e.key === 'Enter' && handleSaveAmount(idx)}
                              />
                            </div>
                          ) : (
                            <span className="text-xs font-black text-slate-800">฿ {item.amount}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditAmount(idx)}
                          className="px-2 py-1 bg-white rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:text-primary transition-colors cursor-pointer"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="ลบรายการ"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total & Submit in Desktop Slip Card */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">ยอดรวมสุทธิ</span>
                  <span className="text-2xl font-black text-amber-600">
                    ฿ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || cart.length === 0 || timeLeft.isExpired}
                  className="w-full py-4 text-white font-black rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wider disabled:opacity-50 shadow-md shadow-emerald-900/20 cursor-pointer text-base"
                  style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                      ส่งโพยหวย (Enter)
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Betting;
