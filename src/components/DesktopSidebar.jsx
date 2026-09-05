import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import {
  Home,
  Zap,
  Ticket,
  Trophy,
  History,
  Wallet,
  Users,
  Sparkles,
  BadgePercent,
  User,
  Bell,
  Headphones,
  LogOut,
  ShieldCheck,
  PlusCircle,
  ChevronRight,
  Flame
} from 'lucide-react';

const MENU_GROUPS = [
  {
    title: 'เมนูหลัก',
    items: [
      { path: '/home', label: 'หน้าหลัก', icon: Home },
      { path: '/lotto-15m', label: 'ล็อตโต้ 15 นาที', icon: Zap, badge: 'LIVE', badgeColor: 'bg-emerald-500' },
      { path: '/lottery-list', label: 'ตลาดหวยทั้งหมด', icon: Ticket },
      { path: '/results', label: 'ผลรางวัล', icon: Trophy },
      { path: '/bet-history', label: 'โพยหวยของฉัน', icon: History },
    ],
  },
  {
    title: 'การเงินและสิทธิพิเศษ',
    items: [
      { path: '/wallet', label: 'กระเป๋าเงิน ฝาก-ถอน', icon: Wallet },
      { path: '/affiliate', label: 'แนะนำเพื่อน (คอม 0.6%)', icon: Users, highlight: true },
      { path: '/lucky-wheel', label: 'วงล้อเสี่ยงโชค', icon: Sparkles },
      { path: '/promotions', label: 'โปรโมชั่น', icon: BadgePercent },
    ],
  },
  {
    title: 'บัญชีและบริการ',
    items: [
      { path: '/notifications', label: 'การแจ้งเตือน', icon: Bell },
      { path: '/profile', label: 'โปรไฟล์ส่วนตัว', icon: User },
      { path: '/support', label: 'ติดต่อเจ้าหน้าที่ 24 ชม.', icon: Headphones },
    ],
  },
];

export default function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { settings } = useSettings();

  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await signOut();
      navigate('/login', { replace: true });
    }
  };

  const balance = profile?.balance !== undefined
    ? Number(profile.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  return (
    <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white border-r border-slate-200/80 sticky top-0 h-screen shrink-0 z-40 select-none antialiased shadow-xs">
      {/* ─── 1. Brand Header ─── */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-3 group">
          <div className="size-11 rounded-full overflow-hidden border border-slate-200 bg-white shadow-2xs group-hover:scale-105 transition-transform shrink-0">
            <img
              src={settings.site_logo_url || '/logo.svg'}
              alt={settings.site_name || 'TH-LOTTO'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h1 className="font-extrabold text-base text-slate-900 tracking-tight truncate group-hover:text-brand-600 transition-colors">
                {settings.site_name || 'TH-LOTTO'}
              </h1>
              <span className="material-symbols-outlined text-brand-600 text-sm shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
            <p className="text-[11px] font-semibold text-brand-600 tracking-wide">
              Official Gaming Portal
            </p>
          </div>
        </Link>
      </div>

      {/* ─── 2. User Mini Card & Quick Deposit ─── */}
      <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-slate-50 to-brand-50/40 border border-slate-200/70 shadow-2xs">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-9 rounded-full overflow-hidden border border-brand-200 bg-white shadow-2xs shrink-0">
              <img
                src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=287e0b&color=fff`}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {profile?.full_name || profile?.username || 'สมาชิก'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono truncate">
                ID: {profile?.member_id || profile?.phone || '—'}
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-brand-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
            VIP {profile?.vip_level || 1}
          </span>
        </div>

        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-medium block">ยอดเงินคงเหลือ</span>
            <span className="text-sm font-extrabold text-slate-900 font-mono">
              ฿{balance}
            </span>
          </div>
          <Link
            to="/deposit"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="size-3.5" />
            <span>เติมเงิน</span>
          </Link>
        </div>
      </div>

      {/* ─── 3. Navigation Sections (Scrollable) ─── */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-5 no-scrollbar">
        {MENU_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/home' && location.pathname.startsWith(item.path));
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all group ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-xs font-extrabold'
                        : 'text-slate-600 hover:text-brand-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`size-4 shrink-0 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-white' : item.highlight ? 'text-brand-600' : 'text-slate-400 group-hover:text-brand-600'
                      }`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`${item.badgeColor || 'bg-red-500'} text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse shrink-0`}>
                        {item.badge}
                      </span>
                    )}

                    {!item.badge && isActive && (
                      <ChevronRight className="size-3.5 text-white/80 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ─── 4. Footer & Logout ─── */}
      <div className="p-3 border-t border-slate-100 mt-auto space-y-2 bg-slate-50/40">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 active:scale-98 transition-all cursor-pointer"
        >
          <LogOut className="size-4" />
          <span>ออกจากระบบ</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-medium pt-1">
          <ShieldCheck className="size-3.5 text-brand-600" />
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </div>
    </aside>
  );
}
