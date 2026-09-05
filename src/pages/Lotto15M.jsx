import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Lotto15MLiveStudio from '../components/Lotto15MLiveStudio';
import BottomNav from '../components/BottomNav';

export default function Lotto15M() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const balance = Math.floor(profile?.balance ?? 0);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col pb-24 selection:bg-emerald-600 selection:text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/home')}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span className="material-icons text-xl">arrow_back</span>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-white">
                <img src="/logo.svg" alt="TH-LOTTO" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                  ล็อตโต้ 15 นาที
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    LIVE
                  </span>
                </h1>
                <p className="text-[11px] text-slate-500 font-medium">TH-LOTTO In-House Speed Draw</p>
              </div>
            </div>
          </div>

          {/* User Balance & Deposit */}
          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block leading-tight font-medium">ยอดคงเหลือ</span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                ฿{balance.toLocaleString('th-TH')}
              </span>
            </div>
            <button
              onClick={() => navigate('/deposit')}
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:opacity-90 active:scale-95 transition-all"
              title="เติมเงิน"
            >
              <span className="material-icons text-sm">add</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        {/* The Live Studio Component */}
        <Lotto15MLiveStudio marketId="2ecc136e-0734-4be0-9e26-cf3149cb84cd" />

        {/* Quick Features Highlight Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
              <span className="material-icons text-lg">bolt</span>
            </div>
            <p className="text-xs font-bold text-slate-800">ออกผลทุก 15 นาที</p>
            <p className="text-[10px] text-slate-500 mt-0.5">วันละ 58 รอบ 24 ชม.</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
              <span className="material-icons text-lg">stars</span>
            </div>
            <p className="text-xs font-bold text-slate-800">จ่ายบาทละ 900</p>
            <p className="text-[10px] text-slate-500 mt-0.5">2 ตัวจ่ายบาทละ 95</p>
          </div>
          <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
              <span className="material-icons text-lg">videocam</span>
            </div>
            <p className="text-xs font-bold text-slate-800">ลูกบอลจริง HD</p>
            <p className="text-[10px] text-slate-500 mt-0.5">โปร่งใส ตรวจย้อนหลังได้</p>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
