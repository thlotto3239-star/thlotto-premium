import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BottomNav = () => {
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-slate-100 px-2 pb-8 pt-3 flex justify-around items-end z-50" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <Link to="/home" className={`flex flex-col items-center gap-1 group ${path === '/home' ? 'text-primary' : 'text-slate-400'}`}>
        <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">home</span>
        <span className="text-[10px] font-bold">หน้าหลัก</span>
      </Link>
      <Link to="/results" className={`flex flex-col items-center gap-1 group ${path === '/results' ? 'text-primary' : 'text-slate-400'}`}>
        <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">leaderboard</span>
        <span className="text-[10px] font-bold">ผลรางวัล</span>
      </Link>
      <Link to="/lottery-list" className="flex flex-col items-center gap-1 text-primary relative">
        <div className="absolute -top-12 bg-primary size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white active:scale-90 transition-transform">
          <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
        </div>
        <span className="text-[10px] font-bold mt-4">แทงหวย</span>
      </Link>
      <Link to="/wallet" className={`flex flex-col items-center gap-1 group ${path === '/wallet' ? 'text-primary' : 'text-slate-400'}`}>
        <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">account_balance_wallet</span>
        <span className="text-[10px] font-bold">กระเป๋าเงิน</span>
      </Link>
      <Link to="/profile" className={`flex flex-col items-center gap-1 group ${path === '/profile' ? 'text-primary' : 'text-slate-400'}`}>
        <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">person</span>
        <span className="text-[10px] font-bold">โปรไฟล์</span>
      </Link>
    </nav>
  );
};

export default BottomNav;
