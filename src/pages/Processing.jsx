import React from 'react';
import { useNavigate } from 'react-router-dom';

const Processing = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-background-dark font-display antialiased overflow-hidden min-h-screen">
      <div className="relative flex h-screen w-full flex-col items-center justify-between text-slate-100 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute inset-0 bg-primary/5 blur-[120px] pointer-events-none rounded-full scale-150"></div>
        
        {/* Top App Bar */}
        <div className="z-10 flex w-full items-center p-6 justify-between">
          <button onClick={() => navigate(-1)} className="text-slate-100 flex w-10 h-10 shrink-0 items-center justify-center rounded-full bg-slate-800/40 backdrop-blur-md hover:bg-slate-700/50 transition-colors">
            <span className="material-symbols-outlined text-[24px]">close</span>
          </button>
          <h2 className="text-slate-100 text-sm font-bold tracking-[0.1em] uppercase flex-1 text-center pr-10">
            TH-LOTTO <span className="text-primary">Premium</span>
          </h2>
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8">
          {/* Custom Premium Loader */}
          <div className="relative flex items-center justify-center mb-12">
            {/* Glowing Outer Ring */}
            <div className="w-48 h-48 rounded-full border-4 border-t-primary border-b-primary border-l-transparent border-r-transparent animate-spin duration-[2000ms] shadow-[0_0_30px_rgba(0,255,128,0.3)] opacity-80"></div>
            
            {/* Inner Gold Logo/Coin */}
            <div className="absolute w-24 h-24 bg-gradient-to-tr from-yellow-500 via-yellow-200 to-yellow-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.2)]">
              <div className="w-20 h-20 rounded-full border-2 border-yellow-600/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-900 text-5xl font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              </div>
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center space-y-4">
            <h1 className="text-slate-100 text-3xl font-semibold tracking-wide">
              กำลังดำเนินการ...
            </h1>
            <p className="text-slate-400 text-base max-w-[280px] leading-relaxed mx-auto">
              กรุณารอซักครู่ ระบบกำลังตรวจสอบข้อมูลของคุณ
            </p>
          </div>
        </div>

        {/* Progress Metrics */}
        <div className="z-10 w-full max-w-sm px-8 pb-16">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs font-medium uppercase tracking-widest text-primary/80">
              <span>Verifying Identity</span>
              <span>75%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800/50 overflow-hidden border border-slate-700/30">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary/40 to-primary shadow-[0_0_10px_rgba(0,255,128,0.5)]"></div>
            </div>
            <div className="flex justify-center gap-1 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-primary/30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Processing;
