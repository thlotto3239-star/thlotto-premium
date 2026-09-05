import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LottoRulesModal from './LottoRulesModal';

// Mock/fallback rounds data based on 58 rounds (every 15 mins)
const GENERATE_ROUNDS = () => {
  const list = [];
  let roundNum = 1;
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (roundNum > 58) break;
      const hh = String(h).padStart(2, '0');
      const mm = String(m).padStart(2, '0');
      const timeStr = `${hh}:${mm}`;
      list.push({
        round: roundNum,
        time: timeStr,
        key: `liw#${hh}${mm}`,
        label: `รอบ ${timeStr} น.`,
      });
      roundNum++;
    }
  }
  return list;
};

const ALL_ROUNDS = GENERATE_ROUNDS();

// Single Rolling Ball Component with Slot-Machine Deceleration
function RollingBall({ targetDigit, isRolling, theme = 'emerald', label }) {
  const isEmerald = theme === 'emerald';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div 
        className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-full flex items-center justify-center overflow-hidden shadow-md transition-all ${
          isEmerald 
            ? 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-800 border-2 border-emerald-300 shadow-emerald-700/20' 
            : 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 border-2 border-amber-200 shadow-amber-600/20'
        }`}
        style={{
          boxShadow: isRolling
            ? (isEmerald ? '0 0 20px rgba(16, 185, 129, 0.6)' : '0 0 20px rgba(245, 158, 11, 0.6)')
            : undefined
        }}
      >
        {/* Specular Sphere Reflection Highlight */}
        <div className="absolute top-1 left-2 w-4 h-2.5 bg-white/60 rounded-full blur-[0.8px] transform -rotate-12 pointer-events-none" />
        <div className="absolute bottom-1 right-2 w-3.5 h-1.5 bg-black/30 rounded-full blur-[1px] pointer-events-none" />

        {/* Rolling Digits Reel */}
        {isRolling ? (
          <div className="flex flex-col items-center animate-slot-roll">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4].map((d, i) => (
              <span 
                key={i} 
                className="h-13 sm:h-15 flex items-center justify-center text-2xl sm:text-3xl font-black text-white drop-shadow-sm"
              >
                {d}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] animate-in zoom-in-50 duration-300">
            {targetDigit !== undefined && targetDigit !== null ? targetDigit : '-'}
          </span>
        )}
      </div>
      {label && <span className="text-[11px] font-semibold text-slate-500">{label}</span>}
    </div>
  );
}

export default function Lotto15MLiveStudio({ marketId = '2ecc136e-0734-4be0-9e26-cf3149cb84cd' }) {
  const navigate = useNavigate();
  const [roundsData, setRoundsData] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(480);
  const videoRef = useRef(null);
  const roundsScrollRef = useRef(null);

  // Fetch real-time results from API
  useEffect(() => {
    const fetchLiveResults = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://thailottoapi.com/api/results');
        const json = await res.json();
        const liwItems = json.categories?.liw?.items || [];

        // Merge with our 58 standard rounds
        const merged = ALL_ROUNDS.map((r) => {
          const found = liwItems.find((item) => item.key === r.key);
          return {
            ...r,
            top3: found?.top3 || found?.result || null,
            top2: found?.top2 || (found?.top3 ? found.top3.slice(-2) : null),
            bottom2: found?.bottom2 || null,
            videoUrl: found?.dataresult?.result_video || null,
            imageUrl: found?.dataresult?.result_image || null,
            isSettled: Boolean(found?.top3),
          };
        });

        setRoundsData(merged);

        // Determine current or latest round
        const now = new Date();
        const curMins = now.getHours() * 60 + now.getMinutes();
        let active = merged.find((r) => {
          const [rh, rm] = r.time.split(':').map(Number);
          return rh * 60 + rm >= curMins;
        }) || merged[0];

        // Prefer latest settled round for video replay
        const lastSettled = [...merged].reverse().find((r) => r.isSettled) || active;
        setSelectedRound(lastSettled.key);
        setCurrentRoundData(lastSettled);
      } catch (err) {
        console.error('Failed to load 15M lotto API:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveResults();
    const interval = setInterval(fetchLiveResults, 60000); // refresh every min
    return () => clearInterval(interval);
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // When round changes, trigger rolling animation if updating
  const handleSelectRound = (round) => {
    setSelectedRound(round.key);
    setIsRolling(true);
    setTimeout(() => {
      setCurrentRoundData(round);
      setIsRolling(false);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }, 600);
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const top3Digits = currentRoundData?.top3 ? currentRoundData.top3.split('') : ['-', '-', '-'];
  const bottom2Digits = currentRoundData?.bottom2 ? currentRoundData.bottom2.split('') : ['-', '-'];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* CSS for smooth Slot Machine rolling */}
      <style>{`
        @keyframes slotRoll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        .animate-slot-roll {
          animation: slotRoll 0.4s linear infinite;
        }
      `}</style>

      {/* Main Studio Card Container - Clean Minimal White Aesthetic */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden text-slate-800">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-50 p-1 border border-slate-200 shadow-2xs flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="TH-LOTTO" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  ล็อตโต้ 15 นาที Live Studio
                </h2>
                <span className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span> LIVE 24H
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {currentRoundData ? `${currentRoundData.label} (รอบที่ ${currentRoundData.round}/58) · ระบบออกผลสดอัตโนมัติ` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold transition-all active:scale-95"
            >
              <span className="material-icons text-sm text-slate-500">help_outline</span>
              <span>กติกาและอัตราจ่าย</span>
            </button>
          </div>
        </div>

        {/* Studio Content Grid (2 Columns on Desktop PC, Stacked on Mobile) */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-0">
          {/* Left Column: HD Live Stream Player */}
          <div className="lg:col-span-7 p-4 sm:p-5 bg-slate-950 flex flex-col justify-center">
            <div className="relative w-full aspect-video rounded-2xl bg-black overflow-hidden shadow-inner group border border-slate-800">
              {currentRoundData?.videoUrl ? (
                <video
                  ref={videoRef}
                  src={currentRoundData.videoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-white/90">
                  <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                    <span className="material-icons text-emerald-400 text-2xl animate-spin">rotate_right</span>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">สัญญาณการออกรางวัลรอบนี้</p>
                    <p className="text-xs text-slate-400 mt-1">รอการออกผลสดประจำรอบเวลา {currentRoundData?.time || '—'}</p>
                  </div>
                </div>
              )}

              {/* Video Floating Controls */}
              {currentRoundData?.videoUrl && (
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20"
                    title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                  >
                    <span className="material-icons text-sm">{isMuted ? 'volume_off' : 'volume_up'}</span>
                  </button>
                </div>
              )}

              {/* Live Official Watermark Badge */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/60 flex items-center gap-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-slate-800 tracking-wide">
                  TH-LOTTO OFFICIAL STREAM
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Rolling Digit Showcase & Fast Action */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/60 border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col justify-between gap-5">
            <div>
              {/* Header Info: Round Time & Next Draw Countdown */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-icons text-amber-500 text-lg">emoji_events</span>
                  <h3 className="font-bold text-sm text-slate-900">
                    ผลการออกรางวัลรอบ {currentRoundData?.time || ''}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <span className="material-icons text-xs text-amber-600">timer</span>
                  <span className="font-semibold">รอบถัดไป:</span>
                  <span className="font-mono font-bold text-amber-700">{formatCountdown(countdownSeconds)}</span>
                </div>
              </div>

              {/* White Minimalist Ball Showcase Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-wrap items-center justify-around gap-4">
                {/* 3 Top Balls */}
                <div className="flex flex-col items-center gap-2.5">
                  <span className="text-[11px] font-bold tracking-wider text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200/80">
                    3 ตัวบน
                  </span>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <RollingBall targetDigit={top3Digits[0]} isRolling={isRolling} theme="emerald" label="หลักร้อย" />
                    <RollingBall targetDigit={top3Digits[1]} isRolling={isRolling} theme="emerald" label="หลักสิบ" />
                    <RollingBall targetDigit={top3Digits[2]} isRolling={isRolling} theme="emerald" label="หลักหน่วย" />
                  </div>
                </div>

                {/* Center Divider */}
                <div className="hidden sm:block w-px h-16 bg-slate-200" />

                {/* 2 Bottom Balls */}
                <div className="flex flex-col items-center gap-2.5">
                  <span className="text-[11px] font-bold tracking-wider text-amber-800 bg-amber-50 px-3 py-0.5 rounded-full border border-amber-200/80">
                    2 ตัวล่าง
                  </span>
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <RollingBall targetDigit={bottom2Digits[0]} isRolling={isRolling} theme="gold" label="หลักสิบ" />
                    <RollingBall targetDigit={bottom2Digits[1]} isRolling={isRolling} theme="gold" label="หลักหน่วย" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payout Information & Action Button */}
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 text-center">
                <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5">
                  <span className="material-icons text-brand-600 text-sm">verified</span>
                  <span>3 ตัวตรง จ่ายบาทละ 900 · 2 ตัว จ่ายบาทละ 95</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เดิมพันขั้นต่ำ 1 บาท · จ่ายจริง ถอนไวใน 1 นาที
                </p>
              </div>

              <button
                onClick={() => navigate(`/betting?draw=${marketId}`)}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-brand-600 hover:bg-brand-700 shadow-sm hover:shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>เข้าสู่หน้ารับแทงรอบนี้</span>
                <span className="material-icons text-base">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* 58-Round Horizontal Time Scrubber */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span className="material-icons text-sm text-brand-600">view_timeline</span>
              <span>เลือกรอบออกรางวัล (ทั้งหมด 58 รอบ/วัน)</span>
            </span>
            <span className="text-[11px] text-slate-500">คลิกที่รอบเพื่อดูผลย้อนหลังหรือแทงล่วงหน้า</span>
          </div>

          <div 
            ref={roundsScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          >
            {roundsData.map((r) => {
              const isSelected = selectedRound === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => handleSelectRound(r)}
                  className={`shrink-0 px-3.5 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all text-center border ${
                    isSelected
                      ? 'bg-brand-600 text-white font-bold border-brand-600 shadow-sm scale-105'
                      : r.isSettled
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-white border-slate-200/60 text-slate-400 opacity-75'
                  }`}
                >
                  <span className="text-[10px] opacity-80">รอบที่ {r.round}</span>
                  <span className="text-xs font-bold">{r.time}</span>
                  <span className="text-[9px] mt-0.5">
                    {r.isSettled ? (
                      <span className={isSelected ? 'text-white' : 'text-brand-700 font-semibold'}>ออกผลแล้ว</span>
                    ) : (
                      <span className={isSelected ? 'text-white/80' : 'text-slate-400'}>รอผล</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rules Modal */}
      <LottoRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
