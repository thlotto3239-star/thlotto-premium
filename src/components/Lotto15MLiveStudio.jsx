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
        className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center overflow-hidden shadow-2xl transition-all ${
          isEmerald 
            ? 'bg-gradient-to-b from-emerald-300 via-emerald-600 to-emerald-950 border-2 border-emerald-300/80 shadow-emerald-900/50' 
            : 'bg-gradient-to-b from-amber-200 via-amber-500 to-amber-900 border-2 border-amber-300/80 shadow-amber-900/50'
        }`}
        style={{
          boxShadow: isRolling
            ? (isEmerald ? '0 0 25px rgba(16, 185, 129, 0.7)' : '0 0 25px rgba(245, 158, 11, 0.7)')
            : undefined
        }}
      >
        {/* Specular Sphere Reflection Highlight */}
        <div className="absolute top-1 left-2 w-5 h-3 bg-white/50 rounded-full blur-[1px] transform -rotate-12 pointer-events-none" />
        <div className="absolute bottom-1 right-2 w-4 h-2 bg-black/40 rounded-full blur-[1px] pointer-events-none" />

        {/* Rolling Digits Reel */}
        {isRolling ? (
          <div className="flex flex-col items-center animate-slot-roll">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4].map((d, i) => (
              <span 
                key={i} 
                className="h-14 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl font-black text-white drop-shadow-md"
              >
                {d}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-2xl sm:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-in zoom-in-50 duration-300">
            {targetDigit !== undefined && targetDigit !== null ? targetDigit : '-'}
          </span>
        )}
      </div>
      {label && <span className="text-[10px] font-bold text-emerald-300/80 uppercase">{label}</span>}
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
    <div className="w-full max-w-2xl mx-auto space-y-4">
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

      {/* Main Studio Screen Container */}
      <div 
        className="relative rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-950/80 text-white"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, #064e3b 0%, #032318 55%, #01110b 100%)'
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between p-4 border-b border-emerald-500/20 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 p-1 border border-emerald-400/30 shadow-inner flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="TH-LOTTO" 
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  ล็อตโต้ 15 นาที
                </h2>
                <span className="flex items-center gap-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-sm shadow-red-500/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE 24H
                </span>
              </div>
              <p className="text-[11px] text-emerald-300/80">
                {currentRoundData ? `${currentRoundData.label} (รอบที่ ${currentRoundData.round}/58)` : 'กำลังโหลด...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-800/40 hover:bg-emerald-800/60 border border-emerald-500/30 text-emerald-200 text-xs font-bold transition-all active:scale-95"
            >
              <span className="material-icons text-sm">help_outline</span>
              <span>กติกา</span>
            </button>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="relative w-full aspect-video bg-black/90 flex items-center justify-center overflow-hidden group">
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
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <span className="material-icons text-emerald-400 text-3xl animate-spin">rotate_right</span>
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-200">สัญญาณการออกรางวัลรอบนี้</p>
                <p className="text-xs text-emerald-400/60 mt-1">รอการออกผลสดประจำรอบเวลา {currentRoundData?.time || '—'}</p>
              </div>
            </div>
          )}

          {/* Video Floating Controls */}
          {currentRoundData?.videoUrl && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white/90 flex items-center justify-center backdrop-blur-md transition-all border border-white/10"
                title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
              >
                <span className="material-icons text-sm">{isMuted ? 'volume_off' : 'volume_up'}</span>
              </button>
            </div>
          )}

          {/* Live Watermark Overlay */}
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-bold text-emerald-200 tracking-wider">
              TH-LOTTO OFFICIAL STREAM
            </span>
          </div>
        </div>

        {/* 3D Ball Draw & Slot Digits Showcase Section */}
        <div className="p-5 bg-gradient-to-b from-black/40 to-emerald-950/50 border-t border-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="material-icons text-amber-400 text-base">military_tech</span>
              <h3 className="font-extrabold text-xs sm:text-sm text-amber-300 uppercase tracking-wider">
                ผลการออกรางวัลรอบ {currentRoundData?.time || ''}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-300/80 bg-emerald-900/40 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="material-icons text-xs text-amber-400">timer</span>
              <span>นับถอยหลังรอบถัดไป:</span>
              <span className="font-mono font-black text-amber-300">{formatCountdown(countdownSeconds)}</span>
            </div>
          </div>

          {/* Balls Layout Container */}
          <div className="flex flex-wrap items-center justify-around gap-4 p-4 rounded-2xl bg-black/50 border border-emerald-500/20 backdrop-blur-md shadow-inner">
            {/* 3 Top Balls */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-black tracking-widest text-emerald-300 bg-emerald-950/80 px-3 py-0.5 rounded-full border border-emerald-500/30 shadow-xs">
                3 ตัวบน
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <RollingBall targetDigit={top3Digits[0]} isRolling={isRolling} theme="emerald" label="หลักร้อย" />
                <RollingBall targetDigit={top3Digits[1]} isRolling={isRolling} theme="emerald" label="หลักสิบ" />
                <RollingBall targetDigit={top3Digits[2]} isRolling={isRolling} theme="emerald" label="หลักหน่วย" />
              </div>
            </div>

            {/* Center Divider */}
            <div className="hidden sm:block w-[1px] h-20 bg-gradient-to-b from-transparent via-emerald-500/30 to-transparent" />

            {/* 2 Bottom Balls */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-black tracking-widest text-amber-300 bg-amber-950/80 px-3 py-0.5 rounded-full border border-amber-500/30 shadow-xs">
                2 ตัวล่าง
              </span>
              <div className="flex items-center gap-2 sm:gap-3">
                <RollingBall targetDigit={bottom2Digits[0]} isRolling={isRolling} theme="gold" label="หลักสิบ" />
                <RollingBall targetDigit={bottom2Digits[1]} isRolling={isRolling} theme="gold" label="หลักหน่วย" />
              </div>
            </div>
          </div>
        </div>

        {/* 58-Round Horizontal Time Scrubber */}
        <div className="p-4 bg-emerald-950/80 border-t border-emerald-500/20">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
              <span className="material-icons text-sm text-emerald-400">view_timeline</span>
              <span>เลือกรอบออกรางวัล (ทั้งหมด 58 รอบ/วัน)</span>
            </span>
            <span className="text-[10px] text-emerald-400/60">คลิกที่รอบเพื่อดูย้อนหลังหรือแทงล่วงหน้า</span>
          </div>

          <div 
            ref={roundsScrollRef}
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-emerald-700/50 scrollbar-track-transparent"
          >
            {roundsData.map((r) => {
              const isSelected = selectedRound === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => handleSelectRound(r)}
                  className={`shrink-0 px-3.5 py-2 rounded-2xl flex flex-col items-center gap-0.5 transition-all text-center border ${
                    isSelected
                      ? 'bg-gradient-to-b from-amber-400 to-amber-600 border-amber-300 text-black font-black shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300/60'
                      : r.isSettled
                      ? 'bg-emerald-900/40 hover:bg-emerald-900/70 border-emerald-500/20 text-emerald-200'
                      : 'bg-black/30 hover:bg-black/50 border-white/5 text-white/50'
                  }`}
                >
                  <span className="text-[10px] opacity-80">รอบที่ {r.round}</span>
                  <span className="text-xs font-extrabold">{r.time}</span>
                  <span className="text-[9px] mt-0.5">
                    {r.isSettled ? '✅ ออกผล' : '⏳ รอผล'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Call to Action Footer */}
        <div className="p-4 bg-black/60 border-t border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-center sm:justify-start">
              <span className="material-icons text-emerald-400 text-base">verified</span>
              <span>จ่าย 3 ตัวตรง บาทละ 900 · 2 ตัว บาทละ 95</span>
            </p>
            <p className="text-[11px] text-emerald-400/70 mt-0.5">
              ขั้นต่ำเพียง 1 บาท · ออกรางวัลต่อเนื่องทุก 15 นาที
            </p>
          </div>

          <button
            onClick={() => navigate(`/betting?draw=${marketId}`)}
            className="w-full sm:w-auto px-8 py-3 rounded-full font-black text-sm tracking-wider uppercase text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 shadow-xl shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-icons text-lg">local_fire_department</span>
            <span>แทงหวยรอบนี้เลย</span>
          </button>
        </div>
      </div>

      {/* Rules Modal */}
      <LottoRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
