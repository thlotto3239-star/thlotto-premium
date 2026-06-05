import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/home', icon: 'home', label: 'หน้าหลัก' },
  { path: '/results', icon: 'leaderboard', label: 'ผลรางวัล' },
  { path: '/lottery-list', icon: 'confirmation_number', label: 'แทงหวย', filled: true },
  { path: '/wallet', icon: 'account_balance_wallet', label: 'กระเป๋าเงิน' },
  { path: '/profile', icon: 'person', label: 'โปรไฟล์' },
];

const BottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // หา index ของ tab ที่ active (default = 2 = แทงหวย)
  const activeIndex = useMemo(() => {
    const idx = tabs.findIndex(t => currentPath.startsWith(t.path));
    return idx >= 0 ? idx : 2;
  }, [currentPath]);

  // คำนวณตำแหน่ง X ของวงกลม (5 tabs, แบ่งเท่าๆ กัน)
  // แต่ละ tab กว้าง 20% → center ของ tab i = (i * 20) + 10 %
  const circleLeft = `${activeIndex * 20 + 10}%`;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white/90 border-t border-slate-100 px-2 pb-8 pt-3 flex justify-around items-end z-50"
      style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      {/* วงกลมลอย — วิ่งตาม tab ที่ active */}
      <div
        className="absolute -top-7 transition-all duration-300 ease-out pointer-events-none"
        style={{ left: circleLeft, transform: 'translateX(-50%)' }}
      >
        <div className="bg-primary size-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 border-4 border-white">
          <span
            className="material-symbols-outlined text-white text-3xl"
            style={{ fontVariationSettings: tabs[activeIndex]?.filled ? "'FILL' 1" : "'FILL' 0" }}
          >
            {tabs[activeIndex]?.icon || 'home'}
          </span>
        </div>
      </div>

      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center gap-1 flex-1 group relative ${
              isActive ? 'text-primary' : 'text-slate-400'
            }`}
          >
            {/* ไอคอนปกติ (ซ่อนเมื่อ active เพราะโชว์ในวงกลมแทน) */}
            <span
              className={`material-symbols-outlined text-2xl transition-all duration-300 ${
                isActive ? 'opacity-0 scale-50' : 'opacity-100 group-hover:text-primary'
              }`}
            >
              {tab.icon}
            </span>
            {/* spacer เมื่อ active (เว้นที่ให้วงกลมลอย) */}
            {isActive && <div className="h-6" />}
            <span className={`text-[10px] font-bold whitespace-nowrap truncate ${isActive ? 'text-primary' : ''}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNav;
