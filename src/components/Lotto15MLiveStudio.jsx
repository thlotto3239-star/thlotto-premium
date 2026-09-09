import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LottoRulesModal from './LottoRulesModal';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  Flame, 
  ChevronRight, 
  HelpCircle, 
  PlayCircle, 
  Volume2, 
  VolumeX, 
  RotateCw, 
  CheckCircle2, 
  Radio, 
  Zap, 
  Layers
} from 'lucide-react';

// Standard 96 rounds per day (every 15 mins: 00:00 to 23:45)
const GENERATE_ROUNDS = () => {
  const list = [];
  let roundNum = 1;
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
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

// Single Rolling Ball Component with 3D Holographic Sphere Design
function RollingBall({ targetDigit, isRolling, theme = 'emerald', label }) {
  const isEmerald = theme === 'emerald';

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div 
        className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-17 md:h-17 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 ${
          isEmerald 
            ? 'bg-gradient-to-b from-emerald-400 via-emerald-600 to-emerald-950 border-2 border-emerald-300/80 shadow-lg shadow-emerald-900/50 ring-2 ring-emerald-500/20' 
            : 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-900 border-2 border-amber-200/80 shadow-lg shadow-amber-900/50 ring-2 ring-amber-500/20'
        }`}
        style={{
          boxShadow: isRolling
            ? (isEmerald ? '0 0 25px rgba(16, 185, 129, 0.85)' : '0 0 25px rgba(245, 158, 11, 0.85)')
            : undefined
        }}
      >
        {/* Specular Sphere Reflection Highlight */}
        <div className="absolute top-1.5 left-2.5 w-5 h-2.5 bg-white/70 rounded-full blur-[0.6px] transform -rotate-15 pointer-events-none" />
        <div className="absolute bottom-1.5 right-2.5 w-4 h-2 bg-black/40 rounded-full blur-[1px] pointer-events-none" />

        {/* Rolling Digits Reel */}
        {isRolling ? (
          <div className="flex flex-col items-center animate-slot-roll">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4].map((d, i) => (
              <span 
                key={i} 
                className="h-14 sm:h-16 md:h-17 flex items-center justify-center text-3xl sm:text-4xl font-black text-white drop-shadow-md"
              >
                {d}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] animate-in zoom-in-75 duration-300">
            {targetDigit !== undefined && targetDigit !== null ? targetDigit : '-'}
          </span>
        )}
      </div>
      {label && (
        <span className="text-[11px] sm:text-xs font-semibold text-slate-300 tracking-wide whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
}

export default function Lotto15MLiveStudio({ marketId = '2ecc136e-0734-4be0-9e26-cf3149cb84cd', onSelectRoundCallback }) {
  const navigate = useNavigate();
  const [roundsData, setRoundsData] = useState([]);
  const [selectedRound, setSelectedRound] = useState(null);
  const [currentRoundData, setCurrentRoundData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(480);
  const [videoMode, setVideoMode] = useState('live'); // 'live' | 'replay'
  const videoRef = useRef(null);
  const roundsScrollRef = useRef(null);

  // Fetch real-time results from LIW Lottery API (96 rounds)
  useEffect(() => {
    const fetchLiveResults = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://liwlottery.com/api/results/history?limit=96&offset=0');
        const json = await res.json();
        const liwItems = json.results || [];

        // Merge with our 96 standard rounds
        const merged = ALL_ROUNDS.map((r) => {
          const found = liwItems.find((item) => item.clock === r.time);
          return {
            ...r,
            no: found?.no || null,
            top3: found?.three || null,
            top2: found?.two_top || (found?.three ? found.three.slice(-2) : null),
            bottom2: found?.two_bottom || null,
            keno: found?.keno || [],
            videoUrl: found?.video || null,
            imageUrl: found?.image || null,
            isSettled: Boolean(found?.three),
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
        if (onSelectRoundCallback) onSelectRoundCallback(lastSettled, merged);
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
    if (round.videoUrl) {
      setVideoMode('replay');
    }
    setTimeout(() => {
      setCurrentRoundData(round);
      setIsRolling(false);
      if (videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
      if (onSelectRoundCallback) onSelectRoundCallback(round, roundsData);
    }, 500);
  };

  const scrollToCurrentRound = () => {
    if (roundsScrollRef.current) {
      const activeBtn = roundsScrollRef.current.querySelector('[data-selected="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  const formatCountdown = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const top3Digits = currentRoundData?.top3 ? currentRoundData.top3.split('') : ['-', '-', '-'];
  const bottom2Digits = currentRoundData?.bottom2 ? currentRoundData.bottom2.split('') : ['-', '-'];

  return (
    <div className="w-full space-y-4">
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

      {/* Main Studio Card Container - Executive Live Broadcast Console */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        
        {/* ─── 1. TOP CONTROL BAR ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-950/80 p-1.5 border border-brand-700/50 shadow-inner flex items-center justify-center shrink-0">
              <img 
                src="/logo.svg" 
                alt="TH-LOTTO" 
                className="w-full h-full object-contain drop-shadow"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
                  ล็อตโต้ 15 นาที Live Studio
                </h2>
                <span className="inline-flex items-center gap-1.5 bg-rose-500/20 text-rose-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30 whitespace-nowrap">
                  <span className="size-2 rounded-full bg-rose-500 animate-ping" />
                  LIVE 24H
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                {currentRoundData ? `${currentRoundData.label} (รอบที่ ${currentRoundData.round}/96) · ระบบออกผลสดอัตโนมัติ` : 'กำลังเชื่อมต่อสัญญาณสด...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Live vs Replay Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setVideoMode('live')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  videoMode === 'live'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="size-3.5 animate-pulse text-white" />
                <span>สัญญาณสด</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoMode('replay')}
                disabled={!currentRoundData?.videoUrl}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  videoMode === 'replay'
                    ? 'bg-brand-600 text-white shadow-xs'
                    : currentRoundData?.videoUrl
                    ? 'text-slate-400 hover:text-white cursor-pointer'
                    : 'text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                <PlayCircle className="size-3.5" />
                <span>คลิปย้อนหลัง</span>
              </button>
            </div>

            {/* Rules Modal Button */}
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="size-3.5 text-slate-400" />
              <span>กติกาและอัตราจ่าย</span>
            </button>
          </div>
        </div>

        {/* ─── 2. VIDEO PLAYER ON TOP (FULL THEATER 16:9 ASPECT) ─── */}
        <div className="p-3 sm:p-5 bg-slate-950 flex flex-col items-center">
          <div className="relative w-full aspect-video max-h-[480px] rounded-2xl bg-black overflow-hidden shadow-2xl border border-slate-800/90 group">
            {videoMode === 'live' ? (
              <iframe
                src="https://liwlottery.com/embed"
                title="LIW Lottery live video"
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '16px', overflow: 'hidden', maxWidth: '100%', aspectRatio: '16/9' }}
                allow="autoplay *; fullscreen *; encrypted-media *"
                loading="eager"
                className="w-full h-full object-cover"
              />
            ) : currentRoundData?.videoUrl ? (
              <video
                ref={videoRef}
                src={currentRoundData.videoUrl}
                autoPlay
                loop
                playsInline
                muted={isMuted}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 text-center text-white/90 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <RotateCw className="size-7 text-emerald-400 animate-spin" />
                </div>
                <div>
                  <p className="font-bold text-base text-white">รอสัญญาณการออกรางวัลประจำรอบ</p>
                  <p className="text-xs text-slate-400 mt-1">ประจำรอบเวลา {currentRoundData?.time || '—'} น. · สัญญาณสดจะเริ่มถ่ายทอดอัตโนมัติ</p>
                </div>
              </div>
            )}

            {/* Replay Video Mute Toggle */}
            {videoMode === 'replay' && currentRoundData?.videoUrl && (
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="size-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 cursor-pointer"
                  title={isMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
              </div>
            )}

            {/* Official Stream Live Badge Watermark */}
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15 flex items-center gap-2 shadow-md pointer-events-none whitespace-nowrap">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-bold text-slate-200 tracking-wider">
                TH-LOTTO OFFICIAL LIVE BROADCAST
              </span>
            </div>
          </div>
        </div>

        {/* ─── 3. GRAND PRIZE BALL DECK (DIRECTLY UNDER THE VIDEO) ─── */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-t border-slate-800">
          
          {/* Deck Header: Round Info + Live Countdown Timer */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                <Trophy className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 flex-wrap whitespace-nowrap">
                  <span>ผลการออกรางวัลรอบ {currentRoundData?.time || '—'} น.</span>
                  {currentRoundData?.isSettled ? (
                    <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      ออกผลแล้ว
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Clock className="size-3" />
                      รอผลรางวัล
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">
                  รอบที่ {currentRoundData?.round || '—'}/96 · เลขที่งวด: {currentRoundData?.no || 'กำลังรอสรุปงวด'}
                </p>
              </div>
            </div>

            {/* Next Draw Countdown Box */}
            <div className="flex items-center gap-3 bg-slate-950/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-inner whitespace-nowrap">
              <Clock className="size-4 text-amber-400 animate-pulse shrink-0" />
              <div className="text-right">
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">ออกผลรอบถัดไปใน</p>
                <p className="text-base sm:text-lg font-black font-mono text-amber-400 tracking-wider leading-none mt-0.5">
                  {formatCountdown(countdownSeconds)}
                </p>
              </div>
            </div>
          </div>

          {/* ─── SINGLE CONTINUOUS HORIZONTAL BALL TRAY (ALL 5 BALLS IN 1 ROW) ─── */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800/90 p-4 sm:p-6 shadow-inner">
            <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 flex-wrap lg:flex-nowrap">
              
              {/* Group A: 3 ตัวบน (3 Emerald Holographic Spheres) */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center sm:items-end sm:pr-4 sm:border-r border-slate-800">
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-emerald-400 whitespace-nowrap">
                    <Sparkles className="size-3.5 text-emerald-400" />
                    3 ตัวบน
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    บาทละ 900
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <RollingBall targetDigit={top3Digits[0]} isRolling={isRolling} theme="emerald" label="หลักร้อย" />
                  <RollingBall targetDigit={top3Digits[1]} isRolling={isRolling} theme="emerald" label="หลักสิบ" />
                  <RollingBall targetDigit={top3Digits[2]} isRolling={isRolling} theme="emerald" label="หลักหน่วย" />
                </div>
              </div>

              {/* Luxury Gold Pillar Divider */}
              <div className="hidden sm:block w-px h-16 sm:h-20 bg-gradient-to-b from-slate-800 via-amber-400/50 to-slate-800 shrink-0" />

              {/* Group B: 2 ตัวล่าง (2 Gold Metallic Spheres) */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center sm:items-end sm:pr-4 sm:border-r border-slate-800">
                  <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-extrabold text-amber-400 whitespace-nowrap">
                    <Trophy className="size-3.5 text-amber-400" />
                    2 ตัวล่าง
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    บาทละ 95
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <RollingBall targetDigit={bottom2Digits[0]} isRolling={isRolling} theme="gold" label="หลักสิบ" />
                  <RollingBall targetDigit={bottom2Digits[1]} isRolling={isRolling} theme="gold" label="หลักหน่วย" />
                </div>
              </div>

            </div>
          </div>

          {/* Quick Betting Action Bar Below Ball Tray */}
          <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-3.5">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Zap className="size-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">เดิมพันขั้นต่ำเพียง 1 บาท</span>
              <span className="text-slate-500 hidden sm:inline">·</span>
              <span className="text-slate-400 hidden sm:inline">ระบบปรับยอดอัตโนมัติภายใน 1 นาทีหลังประกาศผล</span>
            </div>

            <button
              onClick={() => navigate(`/betting?draw=${marketId}`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] shadow-md shadow-emerald-950/50 transition-all cursor-pointer border border-emerald-400/40 whitespace-nowrap"
            >
              <Flame className="size-4 text-amber-300 animate-pulse" />
              <span>เข้าสู่หน้ารับแทงรอบนี้</span>
              <ChevronRight className="size-4" />
            </button>
          </div>

        </div>

        {/* ─── 4. 96-ROUND HORIZONTAL TIME SCRUBBER ─── */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap">
                <Layers className="size-4 text-brand-400" />
                <span>เลือกดูรอบออกรางวัล (ทั้งหมด 96 รอบ / วัน)</span>
              </span>
            </div>
            <button
              onClick={scrollToCurrentRound}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
            >
              <RotateCw className="size-3" />
              <span>เลื่อนไปรอบล่าสุด</span>
            </button>
          </div>

          <div 
            ref={roundsScrollRef}
            className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {roundsData.map((r) => {
              const isSelected = selectedRound === r.key;
              return (
                <button
                  key={r.key}
                  data-selected={isSelected ? "true" : "false"}
                  onClick={() => handleSelectRound(r)}
                  className={`shrink-0 px-3.5 py-2.5 rounded-xl flex flex-col items-center gap-0.5 transition-all text-center border cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-gradient-to-b from-brand-600 to-brand-700 text-white font-bold border-brand-400 shadow-md scale-105 ring-2 ring-brand-400/30'
                      : r.isSettled
                      ? 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-[10px] opacity-75">รอบที่ {r.round}</span>
                  <span className="text-xs font-bold font-mono">{r.time}</span>
                  <span className="text-[10px] mt-0.5">
                    {r.isSettled ? (
                      <span className={isSelected ? 'text-white font-bold' : 'text-emerald-400 font-semibold'}>
                        {r.top3 ? `ออก ${r.top3}` : 'ออกผลแล้ว'}
                      </span>
                    ) : (
                      <span className={isSelected ? 'text-white/80' : 'text-slate-500'}>รอผล</span>
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
