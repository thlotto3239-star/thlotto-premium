import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

// ─── Wheel geometry ────────────────────────────────────────────────────────
// Default segments shown before DB loads — overridden by get_spin_status.prizes
const DEFAULT_SEGMENTS = [
  { slot_index: 0, name: '฿50',  color: '#b45309', hi_color: '#f59e0b' },
  { slot_index: 1, name: '฿20',  color: '#1d4ed8', hi_color: '#3b82f6' },
  { slot_index: 2, name: '฿10',  color: '#6d28d9', hi_color: '#8b5cf6' },
  { slot_index: 3, name: '฿5',   color: '#065f46', hi_color: '#10b981' },
  { slot_index: 4, name: 'โชค',  color: '#1e293b', hi_color: '#475569' },
  { slot_index: 5, name: '฿10',  color: '#6d28d9', hi_color: '#8b5cf6' },
  { slot_index: 6, name: '฿5',   color: '#065f46', hi_color: '#10b981' },
  { slot_index: 7, name: '฿20',  color: '#1d4ed8', hi_color: '#3b82f6' },
];
const N   = DEFAULT_SEGMENTS.length;
const DEG = 360 / N;
const R   = 134;
const CX  = 160, CY = 160;
const toR = d => d * Math.PI / 180;

const buildArc = i => {
  const a1 = -90 + i * DEG, a2 = a1 + DEG;
  const x1 = CX + R * Math.cos(toR(a1)), y1 = CY + R * Math.sin(toR(a1));
  const x2 = CX + R * Math.cos(toR(a2)), y2 = CY + R * Math.sin(toR(a2));
  return `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R},0,0,1,${x2.toFixed(1)},${y2.toFixed(1)} Z`;
};
const textPos = i => {
  const mid = -90 + i * DEG + DEG / 2, tr = R * 0.63;
  return { x: (CX + tr * Math.cos(toR(mid))).toFixed(1), y: (CY + tr * Math.sin(toR(mid))).toFixed(1), r: mid + 90 };
};

// LED ring (16 dots, fixed, outside the spinning SVG)
const LED_R = R + 20;
const LEDS  = Array.from({ length: 16 }, (_, i) => {
  const a = toR(-90 + i * (360 / 16));
  const colors = ['#fbbf24','#f43f5e','#34d399','#818cf8'];
  return { cx: (CX + LED_R * Math.cos(a)).toFixed(1), cy: (CY + LED_R * Math.sin(a)).toFixed(1), color: colors[i % 4] };
});

// slot_index → centre angle (clockwise from top)
const slotAngle = idx => idx * DEG + DEG / 2;

const LuckyWheel = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments]         = useState(DEFAULT_SEGMENTS);
  const [rotation, setRotation]         = useState(0);
  const [isSpinning, setIsSpinning]     = useState(false);
  const [showPrize, setShowPrize]       = useState(false);
  const [prizeData, setPrizeData]       = useState(null);
  const [history, setHistory]           = useState([]);
  const [spinStatus, setSpinStatus]     = useState({ spins_left: 0, daily_limit: 5, spin_cost: 10, can_spin: false });
  const [statusLoading, setStatusLoading] = useState(true);
  const [showInfo, setShowInfo]         = useState(false);

  useEffect(() => {
    if (profile?.id) { fetchHistory(); fetchSpinStatus(); }
  }, [profile?.id]);

  const fetchSpinStatus = async () => {
    setStatusLoading(true);
    try {
      const { data } = await supabase.rpc('get_spin_status');
      if (data?.success) {
        setSpinStatus(data);
        if (data.prizes?.length === N) setSegments(data.prizes);
      }
    } finally { setStatusLoading(false); }
  };

  const fetchHistory = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('lucky_wheel_spins')
      .select('id, prize_name, prize_amount, spun_at')
      .eq('user_id', profile.id)
      .order('spun_at', { ascending: false })
      .limit(5);
    setHistory(data || []);
  };

  const handleSpin = async () => {
    if (isSpinning || !spinStatus.can_spin) return;
    setIsSpinning(true);
    setShowPrize(false);
    try {
      const { data, error } = await supabase.rpc('spin_lucky_wheel');
      if (error) throw error;
      if (!data.success) {
        alert(data.message);
        setIsSpinning(false);
        fetchSpinStatus();
        return;
      }
      const targetAngle   = slotAngle(data.slot_index ?? 4);
      const finalRotation = rotation + (1800 - (rotation % 360)) + (360 - targetAngle);
      setRotation(finalRotation);
      setPrizeData(data);
      setTimeout(() => {
        setIsSpinning(false);
        setShowPrize(true);
        refreshProfile();
        fetchHistory();
        fetchSpinStatus();
      }, 5300);
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการหมุน');
      setIsSpinning(false);
    }
  };

  return (
    <div className="min-h-screen font-body flex flex-col items-center overflow-x-hidden relative"
      style={{ background: 'linear-gradient(160deg, #071a10 0%, #0d2d1a 45%, #071a10 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[420px] h-[420px] rounded-full blur-[90px]"
          style={{ background: 'rgba(16,185,129,0.07)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-60 h-60 rounded-full blur-[60px]"
          style={{ background: 'rgba(59,130,246,0.05)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 rounded-full blur-[60px]"
          style={{ background: 'rgba(139,92,246,0.05)' }} />
      </div>

      {/* Page header */}
      <header className="relative z-10 w-full max-w-[480px] px-5 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
        </button>
        <div className="text-center">
          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.35em]">TH LOTTO VIP</p>
          <p className="text-sm font-black text-white" style={{ whiteSpace: 'normal' }}>Premium Lucky Wheel</p>
        </div>
        <button onClick={() => setShowInfo(true)}
          className="w-11 h-11 flex items-center justify-center rounded-2xl text-white"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span className="material-symbols-outlined text-xl">info</span>
        </button>
      </header>

      <main className="relative z-10 w-full max-w-[480px] px-5 flex flex-col items-center">

        {/* ── WHEEL AREA ── */}
        <div className="relative w-full max-w-[320px] mt-4 mb-8">

          {/* Outer decorative rings (don't rotate) */}
          <div className="absolute inset-[-18px] rounded-full"
            style={{ border: '1px dashed rgba(16,185,129,0.18)', animation: isSpinning ? 'spinCW 5s linear infinite' : 'none' }} />
          <div className="absolute inset-[-8px] rounded-full"
            style={{ border: '1px solid rgba(255,255,255,0.05)', animation: isSpinning ? 'spinCCW 7s linear infinite' : 'none' }} />

          {/* Pointer ▼ */}
          <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
            <div className="relative">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full blur-lg"
                style={{ background: 'rgba(52,211,153,0.3)' }} />
              <svg width="28" height="38" viewBox="0 0 28 38" className="relative"
                style={{ filter: 'drop-shadow(0 4px 14px rgba(52,211,153,0.85))' }}>
                <polygon points="14,36 1,7 27,7" fill="#34d399" />
                <polygon points="14,36 4,9 24,9"  fill="#059669" />
                <circle cx="14" cy="7" r="6" fill="#ffffff" opacity="0.95" />
                <circle cx="14" cy="7" r="3"   fill="#34d399" />
              </svg>
            </div>
          </div>

          {/* Fixed SVG layer: gold ring + LED dots (never rotates) */}
          <svg viewBox="0 0 320 320" className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="goldRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%"   stopColor="#fbbf24" />
                <stop offset="50%"  stopColor="#b45309" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R + 13} fill="none" stroke="url(#goldRing)" strokeWidth="7" opacity="0.65" />
            <circle cx={CX} cy={CY} r={R + 4}  fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
            {LEDS.map((d, i) => (
              <circle key={i} cx={d.cx} cy={d.cy}
                r={i % 2 === 0 ? 4.5 : 3}
                fill={d.color}
                style={{
                  opacity: isSpinning ? 1 : 0.3,
                  transition: 'opacity 0.4s',
                  animation: isSpinning ? `ledBlink ${0.3 + (i % 4) * 0.1}s ease-in-out infinite alternate` : 'none',
                }}
              />
            ))}
          </svg>

          {/* Rotating wheel SVG */}
          <svg viewBox="0 0 320 320" className="w-full h-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: 'transform 5.2s cubic-bezier(0.17, 0.67, 0.12, 0.99)',
              transformOrigin: '50% 50%',
              willChange: 'transform',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.7))',
              borderRadius: '50%',
            }}>
            {/* Segment fills */}
            {segments.map((seg, i) => (
              <path key={i} d={buildArc(i)} fill={seg.color}
                stroke="rgba(0,0,0,0.45)" strokeWidth="1.5" />
            ))}
            {/* Highlight overlay (inner glow) */}
            {segments.map((seg, i) => (
              <path key={`h${i}`} d={buildArc(i)} fill={seg.hi_color} opacity="0.1" />
            ))}
            {/* Divider lines */}
            {Array.from({ length: N }, (_, i) => {
              const a = toR(-90 + i * DEG);
              return (
                <line key={`d${i}`} x1={CX} y1={CY}
                  x2={(CX + R * Math.cos(a)).toFixed(1)}
                  y2={(CY + R * Math.sin(a)).toFixed(1)}
                  stroke="rgba(0,0,0,0.5)" strokeWidth="2.5" />
              );
            })}
            {/* Inner rim ring */}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
            {/* Prize labels */}
            {segments.map((seg, i) => {
              const t = textPos(i);
              const noWin = seg.amount === 0;
              return (
                <g key={`lbl${i}`} transform={`translate(${t.x},${t.y}) rotate(${t.r})`}>
                  <text textAnchor="middle" dominantBaseline="middle"
                    fontSize={noWin ? '11' : '19'} fontWeight="900"
                    fontFamily="'Prompt', 'Noto Sans Thai', sans-serif"
                    fill={noWin ? '#64748b' : '#ffffff'}
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                    {seg.name}
                  </text>
                  {!noWin && (
                    <text textAnchor="middle" dominantBaseline="middle"
                      fontSize="9" fontWeight="700"
                      fontFamily="'Prompt', sans-serif"
                      fill="rgba(255,255,255,0.5)" y="15">
                      บาท
                    </text>
                  )}
                </g>
              );
            })}
            {/* Centre hub */}
            <circle cx={CX} cy={CY} r="31" fill="#071a10" stroke="rgba(52,211,153,0.55)" strokeWidth="3" />
            <circle cx={CX} cy={CY} r="23" fill="#0d2d1a" />
            <circle cx={CX} cy={CY} r="15" fill="rgba(52,211,153,0.1)" />
            <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle"
              fontSize="18" fill="#34d399" fontWeight="900" fontFamily="sans-serif">★</text>
          </svg>

        </div>

        {/* ── STATS ROW ── */}
        <div className="flex justify-center gap-3 mb-4 w-full">
          <div className="flex items-center gap-2 rounded-2xl px-5 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-outlined text-emerald-400"
              style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <span className="text-white font-black tabular-nums">
              ฿{(profile?.balance || 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-2xl px-5 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-outlined text-amber-400"
              style={{ fontVariationSettings: "'FILL' 1" }}>casino</span>
            <span className="text-white font-black tabular-nums">
              {statusLoading ? '...' : `${spinStatus.spins_left}/${spinStatus.daily_limit}`}
            </span>
          </div>
        </div>

        {/* ── SPIN BUTTON ── */}
        <div className="w-full mb-3">
          <button
            onClick={handleSpin}
            disabled={isSpinning || !spinStatus.can_spin}
            className="relative w-full h-[66px] rounded-[2rem] disabled:opacity-50 active:scale-[0.98] transition-transform"
            style={{
              background: spinStatus.can_spin
                ? 'linear-gradient(135deg, #065f46 0%, #059669 50%, #34d399 100%)'
                : '#0d2d1a',
              boxShadow: spinStatus.can_spin
                ? '0 6px 30px rgba(52,211,153,0.38), inset 0 1px 0 rgba(255,255,255,0.12)'
                : 'none',
              color: spinStatus.can_spin ? '#fff' : '#475569',
            }}>
            {/* shimmer sweep */}
            {spinStatus.can_spin && !isSpinning && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ animation: 'shimmerSweep 2.8s ease-in-out infinite' }} />
            )}
            <span className="relative z-10 flex items-center justify-center gap-2 font-black text-xl uppercase tracking-widest"
              style={{ whiteSpace: 'normal' }}>
              {isSpinning ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  <span className="text-base font-black">กำลังหมุน...</span>
                </>
              ) : !spinStatus.can_spin ? (
                <span className="text-base font-black">ครบสิทธิ์วันนี้แล้ว</span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-2xl shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}>casino</span>
                  SPIN NOW!
                </>
              )}
            </span>
          </button>
        </div>
        <p className="text-center text-white/25 text-[10px] font-black uppercase tracking-widest mb-8">
          ค่าหมุน ฿{spinStatus.spin_cost} / ครั้ง · คงเหลือ {spinStatus.spins_left} สิทธิ์วันนี้
        </p>

        {/* ── HISTORY ── */}
        <div className="w-full mb-8 rounded-3xl p-6"
          style={{ background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">history</span>
              <h3 className="text-white font-black text-sm" style={{ whiteSpace: 'normal' }}>ประวัติการหมุน</h3>
            </div>
            <span className="text-[9px] font-black text-white/25 uppercase shrink-0">{history.length} LATEST</span>
          </div>
          <div className="space-y-3">
            {history.length > 0 ? history.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: Number(item.prize_amount) > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)' }}>
                    <span className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1", color: Number(item.prize_amount) > 0 ? '#34d399' : '#475569' }}>
                      {Number(item.prize_amount) > 0 ? 'emoji_events' : 'refresh'}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">{item.prize_name}</p>
                    <p className="text-[9px] text-white/25 font-bold uppercase">
                      {new Date(item.spun_at).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black shrink-0"
                  style={{ color: Number(item.prize_amount) > 0 ? '#34d399' : 'rgba(255,255,255,0.2)' }}>
                  {Number(item.prize_amount) > 0 ? `+฿${Number(item.prize_amount).toLocaleString()}` : '—'}
                </span>
              </div>
            )) : (
              <div className="py-8 text-center">
                <span className="material-symbols-outlined text-4xl block mb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>sports_esports</span>
                <p className="text-[10px] font-black uppercase" style={{ color: 'rgba(255,255,255,0.18)' }}>ยังไม่มีประวัติ</p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* ── PRIZE MODAL ── */}
      {showPrize && prizeData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(24px)' }}>
          <div className="w-full max-w-sm" style={{ animation: 'popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
            {prizeData.amount > 0 ? (
              <div className="rounded-[3rem] p-8 text-center"
                style={{ background: 'linear-gradient(160deg, #064e3b 0%, #071a10 100%)', border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 0 60px rgba(52,211,153,0.22)' }}>
                <div className="text-6xl mb-3">🎉</div>
                <h2 className="text-2xl font-black text-white mb-1">ยินดีด้วย!</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)', whiteSpace: 'normal' }}>{prizeData.message}</p>
                <div className="rounded-2xl p-5 mb-6"
                  style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(52,211,153,0.6)' }}>รางวัลที่ได้รับ</p>
                  <p className="text-5xl font-black" style={{ color: '#34d399' }}>{prizeData.prize}</p>
                </div>
                <button onClick={() => setShowPrize(false)}
                  className="w-full h-14 rounded-2xl font-black text-slate-900 text-lg"
                  style={{ background: 'linear-gradient(135deg, #34d399, #059669)' }}>
                  รับรางวัลทันที 🎊
                </button>
              </div>
            ) : (
              <div className="rounded-[3rem] p-8 text-center"
                style={{ background: '#071a10', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="text-6xl mb-3">😢</div>
                <h2 className="text-2xl font-black text-white mb-1">เสียดายจัง</h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.3)', whiteSpace: 'normal' }}>{prizeData.message}</p>
                <div className="rounded-2xl p-5 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.25)' }}>ผลการหมุน</p>
                  <p className="text-3xl font-black" style={{ color: 'rgba(255,255,255,0.35)' }}>{prizeData.prize}</p>
                </div>
                <button onClick={() => setShowPrize(false)}
                  className="w-full h-14 rounded-2xl font-black text-base"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  ลองใหม่อีกครั้ง
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INFO MODAL ── */}
      {showInfo && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowInfo(false)}>
          <div className="w-full max-w-md rounded-t-[3rem] p-8 pb-12"
            style={{ background: '#0d2d1a', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 rounded-full mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <h3 className="text-xl font-black text-white mb-5" style={{ whiteSpace: 'normal' }}>วิธีเล่น Lucky Wheel</h3>
            <div className="space-y-4 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {[
                `กด SPIN NOW! — ระบบหักเครดิต ฿${spinStatus.spin_cost} ต่อครั้ง`,
                `หมุนได้สูงสุด ${spinStatus.daily_limit} ครั้งต่อวัน`,
                'รางวัลจะเพิ่มเข้ากระเป๋าเงินอัตโนมัติ',
                '"โชค" = ไม่ได้รับโบนัสในครั้งนี้',
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-emerald-400 shrink-0"
                    style={{ background: 'rgba(52,211,153,0.12)' }}>{i + 1}</span>
                  <p style={{ whiteSpace: 'normal' }}>{t}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowInfo(false)}
              className="mt-8 w-full py-4 rounded-2xl font-black text-sm text-emerald-400"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.18)' }}>
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LuckyWheel;
