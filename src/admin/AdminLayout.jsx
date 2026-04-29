import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import {
  LayoutDashboard, Wallet, Users, Building2, FileText, ListOrdered, Tag,
  Trophy, Ban, Percent, Megaphone, Image as ImageIcon, Newspaper, TrendingUp,
  Gift, History, Settings, Shield, Bell, LogOut, Menu, X
} from 'lucide-react';

const NAV = [
  { section: 'ภาพรวม', items: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ]},
  { section: 'การเงิน & สมาชิก', items: [
    { to: '/admin/deposits',    label: 'รายการฝาก-ถอน', icon: Wallet },
    { to: '/admin/members',     label: 'สมาชิกทั้งหมด',  icon: Users },
    { to: '/admin/banks',       label: 'ธนาคารของเว็บ',  icon: Building2 },
  ]},
  { section: 'จัดการหวย', items: [
    { to: '/admin/bets',        label: 'รายการโพยหวย',  icon: ListOrdered },
    { to: '/admin/markets',     label: 'ประเภทหวย',     icon: Tag },
    { to: '/admin/results',     label: 'ผลรางวัล',      icon: Trophy },
    { to: '/admin/restricted',  label: 'จัดการเลขอั้น',  icon: Ban },
    { to: '/admin/payout-rates', label: 'อัตราจ่าย',     icon: Percent },
  ]},
  { section: 'เนื้อหา', items: [
    { to: '/admin/promotions',  label: 'โปรโมชั่น',      icon: Megaphone },
    { to: '/admin/sliders',     label: 'สไลด์แบนเนอร์',  icon: ImageIcon },
    { to: '/admin/articles',    label: 'บทความ/ข่าวสาร', icon: Newspaper },
    { to: '/admin/trending',    label: 'รายการมาแรง',    icon: TrendingUp },
  ]},
  { section: 'กิจกรรม', items: [
    { to: '/admin/lucky-wheel',         label: 'กงล้อนำโชค', icon: Gift },
    { to: '/admin/lucky-wheel-history', label: 'ประวัติกงล้อ', icon: History },
  ]},
  { section: 'ตั้งค่า', items: [
    { to: '/admin/admins',          label: 'ผู้ดูแลระบบ',  icon: Shield },
    { to: '/admin/system-messages', label: 'ข้อความระบบ',  icon: Bell },
    { to: '/admin/settings',        label: 'ตั้งค่าหน้าเว็บ', icon: Settings },
  ]},
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => { await signOut(); nav('/', { replace: true }); };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="font-bold text-emerald-400">TH LOTTO Admin</div>
          <button className="lg:hidden text-slate-400" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 text-sm">
          {NAV.map(group => (
            <div key={group.section} className="mb-3">
              <div className="px-4 py-1 text-[11px] uppercase tracking-wider text-slate-500">{group.section}</div>
              {group.items.map(it => {
                const Icon = it.icon;
                return (
                  <NavLink key={it.to} to={it.to} end={it.end}
                    onClick={() => setOpen(false)}
                    className={({isActive}) => `flex items-center gap-3 px-4 py-2 hover:bg-slate-800 transition ${isActive ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-300'}`}>
                    <Icon size={16}/> <span>{it.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-800 text-xs">
          <div className="text-slate-400">เข้าใช้โดย</div>
          <div className="font-semibold truncate">{profile?.full_name || profile?.member_id}</div>
          <button onClick={handleLogout} className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-rose-600 rounded text-slate-200 transition">
            <LogOut size={14}/> ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center px-4 lg:px-6 gap-3">
          <button className="lg:hidden text-slate-700" onClick={() => setOpen(true)}><Menu size={22}/></button>
          <div className="font-semibold text-slate-700">แผงควบคุมผู้ดูแล</div>
          <div className="ml-auto text-xs text-slate-500">v1.0</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
