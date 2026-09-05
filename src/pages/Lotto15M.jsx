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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-20 selection:bg-emerald-500 selection:text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/home')}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <span className="material-icons text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 p-0.5 border border-emerald-400/30 flex items-center justify-center">
              <img src="/icons/thlotto-15m.png" alt="TH" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                ล็อตโต้ 15 นาที
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded-full border border-emerald-400/30 font-bold">
                  LIVE
                </span>
              </h1>
              <p className="text-[10px] text-slate-400">TH-LOTTO In-House Speed Draw</p>
            </div>
          </div>
        </div>

        {/* User Balance & Deposit */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block leading-tight">ยอดคงเหลือ</span>
            <span className="text-xs font-black text-amber-400 font-mono">
              ฿{balance.toLocaleString('th-TH')}
            </span>
          </div>
          <button
            onClick={() => navigate('/deposit')}
            className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-900/40 active:scale-95 transition-all"
            title="เติมเงิน"
          >
            <span className="material-icons text-sm">add</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-5">
        {/* The Live Studio Component */}
        <Lotto15MLiveStudio marketId="2ecc136e-0734-4be0-9e26-cf3149cb84cd" />

        {/* Quick Features Highlight Banner */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl p-3 bg-slate-900/60 border border-emerald-500/20 text-center">
            <span className="material-icons text-emerald-400 text-lg">bolt</span>
            <p className="text-[11px] font-bold text-slate-200 mt-1">ออกผลทุก 15 นาที</p>
            <p className="text-[9px] text-slate-400">วันละ 58 รอบ 24 ชม.</p>
          </div>
          <div className="rounded-2xl p-3 bg-slate-900/60 border border-amber-500/20 text-center">
            <span className="material-icons text-amber-400 text-lg">stars</span>
            <p className="text-[11px] font-bold text-slate-200 mt-1">จ่ายบาทละ 900</p>
            <p className="text-[9px] text-slate-400">2 ตัวจ่ายบาทละ 95</p>
          </div>
          <div className="rounded-2xl p-3 bg-slate-900/60 border border-teal-500/20 text-center">
            <span className="material-icons text-teal-400 text-lg">videocam</span>
            <p className="text-[11px] font-bold text-slate-200 mt-1">ลูกบอลจริง HD</p>
            <p className="text-[9px] text-slate-400">โปร่งใส ตรวจย้อนหลังได้</p>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}
