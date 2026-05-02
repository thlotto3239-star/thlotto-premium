import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const DEFAULT_RATES = {
  '4TOP': 6000, '3TOP': 900, '3TODE': 150, '3FRONT': 450,
  '3BOTTOM': 450, '2TOP': 95, '2BOTTOM': 95, 'RUN_UP': 3.2, 'RUN_DOWN': 4.2
};

const BASE_CATEGORIES = [
  { name: '4 ตัวบน', code: '4TOP', limit: 4, span: 'full' },
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
  const [searchParams] = useSearchParams();
  const drawId = searchParams.get('draw');
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

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
  const [showCartModal, setShowCartModal] = useState(false);
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
  }, [drawId, navigate]);

  useEffect(() => {
    const fetchDraw = async () => {
      if (!drawId) return;
      const { data: streamSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'live_stream_url')
        .single();
      if (streamSetting?.value) setLiveStreamUrl(streamSetting.value);
      const { data: markets } = await supabase.rpc('get_markets_with_countdown');
      const data = (markets || []).find(m => m.id === drawId);
      if (!data) return;
      setDraw(data);
      const { data: rates } = await supabase
        .from('payout_rates')
        .select('bet_type, rate')
        .eq('market', data.code);
      if (rates && rates.length > 0) {
        const rateMap = {};
        rates.forEach(r => { rateMap[r.bet_type] = Number(r.rate); });
        setCategories(BASE_CATEGORIES.map(c => ({ ...c, rate: rateMap[c.code] ?? DEFAULT_RATES[c.code] })));
      }
    };
    fetchDraw();
  }, [drawId]);

  const getEmbedUrl = (url, muted) => {
    if (!url) return null;
    const muteParam = muted ? '1' : '0';
    const base = `autoplay=1&mute=${muteParam}&rel=0&modestbranding=1&playsinline=1`;
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
      alert('งวดนี้ปิดรับแทงแล้ว ไม่สามารถส่งโพยได้');
      return;
    }
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
      if (data && !data.success) throw new Error(data.message);
      await refreshProfile();
      navigate('/bet-history');
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการส่งโพย');
    } finally {
      setLoading(false);
    }
  };

  const lastCartItem = cart[cart.length - 1];

  return (
    <div className="bg-white min-h-screen font-display text-slate-900 antialiased overflow-x-hidden">
      <audio ref={audioRef} preload="auto">
        <source src="https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3" type="audio/mpeg"/>
      </audio>

      <div className="relative flex min-h-screen w-full max-w-[430px] mx-auto flex-col bg-white">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-4 pt-6 pb-2">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center size-10 rounded-full bg-slate-100 active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-slate-600">chevron_left</span>
            </button>
            <h1 className="text-lg font-extrabold tracking-tight text-slate-900 uppercase">
              {draw?.name || 'TH-LOTTO Premium'}
            </h1>
            <div className="size-10"></div>
          </div>

          {/* Live Stream */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 aspect-video mb-4">
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
                {/* LIVE badge */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black animate-pulse pointer-events-none">
                  <div className="size-2 rounded-full bg-white"></div> ถ่ายทอดสด
                </div>
                {/* Mute toggle */}
                <button
                  onClick={handleToggleMute}
                  className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-[11px] font-bold active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isMuted ? 'volume_off' : 'volume_up'}
                  </span>
                  {isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="size-14 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>live_tv</span>
                </div>
                <p className="text-white/50 text-xs font-bold">ยังไม่มีการถ่ายทอดสด</p>
                <p className="text-white/30 text-[10px]">แอดมินยังไม่ได้ตั้งค่าลิงค์สตรีม</p>
              </div>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-between border border-yellow-400/20 p-4 rounded-2xl mb-4 bg-slate-50/50">
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.1em] mb-1 ${timeLeft.isExpired ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>
                {timeLeft.isExpired ? 'ปิดรับแทงแล้ว!' : 'งวดถัดไปเปิดรับแทง'}
              </p>
              <p className="text-sm font-bold text-slate-700">{draw?.name || 'สลากกินแบ่งรัฐบาล'}</p>
            </div>
            {!timeLeft.isExpired ? (
              <div className="flex items-center gap-1.5">
                {[
                  ...(parseInt(timeLeft.d || '0') > 0 ? [{ val: timeLeft.d, label: 'วัน' }] : []),
                  { val: timeLeft.h, label: 'ชม.' }, { val: timeLeft.m, label: 'นาที' }, { val: timeLeft.s, label: 'วิ' }
                ].map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-lg font-black text-slate-300">:</span>}
                    <div className="flex flex-col items-center justify-center bg-white size-[54px] rounded-xl border border-slate-100">
                      <span className="text-xl font-black text-slate-900 leading-none">{t.val}</span>
                      <span className="text-[9px] font-bold text-slate-400 mt-1.5">{t.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100">
                <span className="material-symbols-outlined text-red-500 text-base">lock</span>
                <span className="text-xs font-black text-red-500">ปิดแล้ว</span>
              </div>
            )}
          </div>
        </header>

        {/* ── MAIN ── */}
        <main className="flex-1 px-4 flex flex-col gap-5 pb-[240px]">

          {/* Category Selection */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 pl-1 border-l-4 border-primary ml-1">เลือกประเภทการแทง</h2>
            <div className="flex flex-col gap-3">

              {/* 4 ตัวบน — full width */}
              <div className="grid grid-cols-1">
                <button
                  onClick={() => handleCategoryChange(categories.find(c => c.code === '4TOP'))}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all active:scale-95 ${
                    currentCategory === '4TOP'
                      ? 'text-white ring-1 ring-primary/30'
                      : 'bg-white border border-slate-100 text-slate-700'
                  }`}
                  style={currentCategory === '4TOP' ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                >
                  <span className="text-sm font-black">4 ตัวบน</span>
                  <span className={`text-[10px] font-medium ${currentCategory === '4TOP' ? 'text-white/70' : 'text-slate-400'}`}>
                    บาทละ {categories.find(c => c.code === '4TOP')?.rate?.toLocaleString()}
                  </span>
                </button>
              </div>

              {/* 3 top / 3 tode */}
              <div className="grid grid-cols-2 gap-2">
                {['3TOP', '3TODE'].map(code => {
                  const cat = categories.find(c => c.code === code);
                  const isActive = currentCategory === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? 'text-white ring-1 ring-primary/30'
                          : 'bg-white border border-slate-100 text-slate-700'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                    >
                      <span className="text-xs font-black">{cat?.name}</span>
                      <span className={`text-[9px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>บาทละ {cat?.rate?.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>

              {/* 3 front / 3 bottom */}
              <div className="grid grid-cols-2 gap-2">
                {['3FRONT', '3BOTTOM'].map(code => {
                  const cat = categories.find(c => c.code === code);
                  const isActive = currentCategory === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? 'text-white ring-1 ring-primary/30'
                          : 'bg-white border border-slate-100 text-slate-700'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                    >
                      <span className="text-xs font-black">{cat?.name}</span>
                      <span className={`text-[9px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>บาทละ {cat?.rate?.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>

              {/* 2 top / 2 bottom */}
              <div className="grid grid-cols-2 gap-2">
                {['2TOP', '2BOTTOM'].map(code => {
                  const cat = categories.find(c => c.code === code);
                  const isActive = currentCategory === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? 'text-white ring-1 ring-primary/30'
                          : 'bg-white border border-slate-100 text-slate-700'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                    >
                      <span className="text-xs font-black">{cat?.name}</span>
                      <span className={`text-[9px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>บาทละ {cat?.rate?.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>

              {/* วิ่งบน / วิ่งล่าง — dashed */}
              <div className="grid grid-cols-2 gap-2">
                {['RUN_UP', 'RUN_DOWN'].map(code => {
                  const cat = categories.find(c => c.code === code);
                  const isActive = currentCategory === code;
                  return (
                    <button
                      key={code}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all active:scale-95 ${
                        isActive
                          ? 'text-white ring-1 ring-primary/30'
                          : 'bg-white border-2 border-dashed border-slate-200 text-slate-600'
                      }`}
                      style={isActive ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                    >
                      <span className="text-xs font-black uppercase tracking-wide">{cat?.name}</span>
                      <span className={`text-[9px] font-medium ${isActive ? 'text-white/70' : 'text-slate-400'}`}>บาทละ {cat?.rate?.toLocaleString()}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Number Display */}
          <div
            className={`flex flex-col gap-3 min-h-[130px] border-2 border-dashed rounded-[2rem] p-5 transition-all duration-300 ${
              isSuccessAnimating
                ? 'bg-primary/10 border-primary/40 scale-[1.01]'
                : 'bg-primary/5 border-primary/20'
            }`}
          >
            <p className="text-[10px] font-black text-primary tracking-[0.1em] text-center uppercase">
              ตัวเลขที่คุณเลือก ({currentCat?.name || currentCategory})
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {Array.from({ length: digitLimit }).map((_, i) => (
                <div
                  key={i}
                  className={`size-16 flex items-center justify-center rounded-full transition-all duration-300 border-2 ${
                    currentDigits[i]
                      ? 'bg-white border-primary shadow-lg shadow-primary/10'
                      : 'bg-slate-100/50 border-slate-200 animate-pulse'
                  }`}
                >
                  <span className={`text-3xl font-black ${currentDigits[i] ? 'text-slate-900' : 'text-slate-300'}`}>
                    {currentDigits[i] || '_'}
                  </span>
                </div>
              ))}
            </div>

            {/* Bet amount quick-select */}
            <div className="flex items-center justify-center gap-2 mt-1">
              {[10, 20, 50, 100, 200, 500].map(amt => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(amt)}
                  className={`h-8 px-3 rounded-xl text-[10px] font-black transition-all ${
                    betAmount === amt
                      ? 'text-white shadow-md'
                      : 'bg-white border border-slate-100 text-slate-500'
                  }`}
                  style={betAmount === amt ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                >
                  {amt}
                </button>
              ))}
            </div>
            <p className="text-center text-[10px] font-medium text-slate-400 italic">
              ช่องตัวเลขจะเคลียร์อัตโนมัติเมื่อเปลี่ยนประเภท และบันทึกทันทีเมื่อกดครบหลัก
            </p>
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <button
                key={n}
                onClick={() => handleNumpadClick(n.toString())}
                className="h-16 flex items-center justify-center bg-white rounded-2xl text-2xl font-black border border-slate-100 active:bg-slate-50 transition-colors"
              >
                {n}
              </button>
            ))}
            <button
              onClick={handleBackspace}
              className="h-16 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">backspace</span>
            </button>
            <button
              onClick={() => handleNumpadClick('0')}
              className="h-16 flex items-center justify-center bg-white rounded-2xl text-2xl font-black border border-slate-100 active:bg-slate-50 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleClear}
              className="h-16 flex items-center justify-center bg-primary/10 text-primary rounded-2xl font-black border border-primary/20 active:scale-95 transition-transform text-[11px] tracking-wider uppercase"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </main>

        {/* ── CART FOOTER (always visible) ── */}
        <div className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto z-30">
          {/* Cart Modal (slide up) */}
          {showCartModal && (
            <div className="bg-white rounded-t-[2.5rem] border-t border-slate-100 px-6 pt-5 pb-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-base">receipt_long</span>
                  <h3 className="text-xs font-black text-slate-800">รายการทั้งหมด ({cart.length})</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCart([])} className="text-[11px] font-black text-red-400">ล้างทั้งหมด</button>
                  <button onClick={() => setShowCartModal(false)} className="text-slate-400">
                    <span className="material-symbols-outlined text-xl">expand_more</span>
                  </button>
                </div>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-2 no-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-black text-primary">{item.numbers}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">{categories.find(c => c.code === item.type)?.name}</p>
                        {editingIdx === idx ? (
                          <div className="flex items-center gap-1">
                            <input
                              autoFocus
                              className="w-20 text-xs font-black border border-primary rounded-lg px-2 py-0.5 text-center"
                              value={editAmount}
                              onChange={e => setEditAmount(e.target.value)}
                              onBlur={() => handleSaveAmount(idx)}
                              onKeyDown={e => e.key === 'Enter' && handleSaveAmount(idx)}
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-black text-slate-700">฿ {item.amount}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAmount(idx)}
                        className="flex items-center gap-1 bg-white px-2 py-1 rounded-xl border border-slate-100"
                      >
                        <span className="text-[10px] font-bold text-slate-400">แก้ไข</span>
                        <span className="material-symbols-outlined text-primary text-sm">edit</span>
                      </button>
                      <button onClick={() => handleRemoveFromCart(idx)} className="text-slate-300 hover:text-red-400 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Footer Bar */}
          <div className="bg-white/95 backdrop-blur-xl rounded-t-[2.5rem] border-t border-slate-100 px-6 pt-5 pb-8">
            {/* Last item preview */}
            {lastCartItem && !showCartModal && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-400 text-sm">receipt_long</span>
                  <h3 className="text-xs font-black text-slate-800">
                    รายการที่เลือก ({cart.length})
                  </h3>
                </div>
                <button
                  onClick={() => setShowCartModal(true)}
                  className="text-[11px] font-black text-primary"
                >
                  ดูรายการทั้งหมด
                </button>
              </div>
            )}
            {!showCartModal && lastCartItem && (
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl mb-5 ring-1 ring-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-black text-primary">{lastCartItem.numbers}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400">{categories.find(c => c.code === lastCartItem.type)?.name}</span>
                    <span className="text-xs font-black text-slate-700">฿ {lastCartItem.amount}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleEditAmount(cart.length - 1)}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-100"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase">เปลี่ยนราคา</span>
                  <span className="material-symbols-outlined text-primary text-sm">edit</span>
                </button>
              </div>
            )}
            {!lastCartItem && !showCartModal && (
              <div className="flex items-center justify-center gap-2 mb-4 py-3">
                <span className="material-symbols-outlined text-slate-300 text-lg">touch_app</span>
                <p className="text-[11px] font-bold text-slate-400">กดตัวเลขเพื่อเพิ่มรายการในโพย</p>
              </div>
            )}

            {/* Total + Submit */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 tracking-[0.1em] mb-0.5 uppercase">ยอดรวมทั้งหมด</span>
                <span className="text-2xl font-black text-yellow-500 flex items-center gap-1">
                  ฿ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading || cart.length === 0 || timeLeft.isExpired}
                className="flex-1 py-4 text-white font-black rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 tracking-wider disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                    ส่งโพย
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── BOTTOM NAV ── */}
        <nav className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center pt-3 pb-8 px-4 z-40">
          <Link to="/home" className="flex flex-col items-center gap-1 group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">home</span>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-primary tracking-tight">หน้าหลัก</span>
          </Link>
          <Link to="/lottery-list" className="flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-1.5 size-1.5 rounded-full bg-primary"></div>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            <span className="text-[9px] font-black text-primary tracking-tight">แทงหวย</span>
          </Link>
          <Link to="/results" className="flex flex-col items-center gap-1 group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">leaderboard</span>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-primary tracking-tight">ผลรางวัล</span>
          </Link>
          <Link to="/wallet" className="flex flex-col items-center gap-1 group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">account_balance_wallet</span>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-primary tracking-tight">กระเป๋าเงิน</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center gap-1 group">
            <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">person</span>
            <span className="text-[9px] font-black text-slate-400 group-hover:text-primary tracking-tight">โปรไฟล์</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Betting;
