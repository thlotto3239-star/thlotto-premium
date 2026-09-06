import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { supabase } from '../supabaseClient';
import BankBadge from '../components/BankBadge';

const Profile = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ betCount: 0, totalWin: 0, referralCount: 0, referralIncome: 0 });
  const [copied, setCopied] = useState(false);

  const handleCopyReferral = () => {
    const link = `${window.location.origin}/register?ref=${profile?.member_id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [betsRes, wonBetsRes, referralsRes] = await Promise.all([
        supabase
          .from('bets')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('bets')
          .select('payout_amount')
          .eq('user_id', user.id)
          .eq('status', 'WON'),
        supabase.rpc('get_my_referrals'),
      ]);
      const betCount = betsRes.count || 0;
      const totalWin = (wonBetsRes.data || []).reduce((sum, b) => sum + Number(b.payout_amount || 0), 0);
      const referralCount = (referralsRes.data || []).length;
      const referralIncome = profile?.commission_balance || 0;
      setStats({ betCount, totalWin, referralCount, referralIncome });
    };
    fetchStats();
  }, [user, profile]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <PageWrapper>
      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>บัญชีผู้ใช้</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {profile?.vip_level || 'MEMBER'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">จัดการข้อมูลส่วนบุคคล การเงิน และความปลอดภัยของบัญชี</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/edit-profile')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              <span>ตั้งค่าโปรไฟล์</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Section Dashboard */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ SECTION 1 (Left 4 Cols on PC): User Identity & Quick Financial Card ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <div className="relative inline-block mx-auto">
                <div className="size-28 rounded-full p-1 border-2 border-emerald-600/30 shadow-xs">
                  <div className="size-full rounded-full bg-slate-50 overflow-hidden">
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone || 'user'}`}
                      alt="Avatar"
                      className="size-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-0.5 rounded-full border-2 border-white shadow-xs flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">stars</span>
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {profile?.vip_level || 'MEMBER'}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900 truncate">
                  {profile?.full_name || 'ผู้ใช้งานทั่วไป'}
                </h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: {profile?.member_id || '------'} • เบอร์โทร: {profile?.phone ? `${profile.phone.slice(0, 3)}-xxx-${profile.phone.slice(-4)}` : '-'}
                </p>
              </div>

              {/* Balance Bar inside Profile */}
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-2xl p-4.5 text-white text-left space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">ยอดเงินในกระเป๋า</span>
                  <span className="material-symbols-outlined text-emerald-300 text-base">account_balance_wallet</span>
                </div>
                <p className="text-3xl font-black font-mono tracking-tight">
                  ฿{(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <Link
                    to="/deposit"
                    className="py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs text-center transition-all shadow-xs"
                  >
                    เติมเงิน
                  </Link>
                  <Link
                    to="/withdrawal"
                    className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs text-center transition-all border border-white/10"
                  >
                    ถอนเงิน
                  </Link>
                </div>
              </div>

              {/* Security & Account Verified Badges */}
              <div className="space-y-2 pt-1 text-left text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">ยืนยันเบอร์มือถือ:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    สำเร็จ
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">บัญชีธนาคาร:</span>
                  <span className="font-bold text-slate-800">
                    {profile?.bank_name || 'ยังไม่ได้ระบุ'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 font-medium">สมาชิกตั้งแต่:</span>
                  <span className="font-mono text-slate-600">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH') : '-'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                <span>ออกจากระบบ</span>
              </button>
            </div>
          </aside>

          {/* ════ SECTION 2 (Center 5 Cols on PC): Stats & Affiliate Hub ════ */}
          <main className="lg:col-span-5 space-y-4">
            {/* Account Metrics Grid (2x2) */}
            <div className="grid grid-cols-2 gap-3.5">
              <div
                onClick={() => navigate('/wallet')}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all active:scale-[0.98]"
              >
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">กระเป๋าเงิน</p>
                  <p className="text-xl font-black font-mono text-slate-900">
                    ฿{(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div
                onClick={() => navigate('/affiliate')}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all active:scale-[0.98]"
              >
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl">group</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">รายได้แนะนำเพื่อน</p>
                  <p className="text-xl font-black font-mono text-emerald-700">
                    ฿{(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              <div
                onClick={() => navigate('/bet-history')}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all active:scale-[0.98]"
              >
                <div className="size-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl">confirmation_number</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ประวัติการแทง</p>
                  <p className="text-xl font-black font-mono text-slate-900">
                    {stats.betCount} <span className="text-xs font-bold text-slate-400">ใบ</span>
                  </p>
                </div>
              </div>

              <div
                onClick={() => navigate('/bet-history')}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-xs transition-all active:scale-[0.98]"
              >
                <div className="size-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-xl">emoji_events</span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ถูกรางวัลรวม</p>
                  <p className="text-xl font-black font-mono text-amber-600">
                    ฿{stats.totalWin.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Affiliate Link Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">link</span>
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">ลิงก์แนะนำเพื่อนของคุณ</h3>
                    <p className="text-[11px] text-slate-400">รับค่าคอมมิชชั่น 8% จากทุกยอดแทง</p>
                  </div>
                </div>
                <Link
                  to="/affiliate"
                  className="text-xs font-extrabold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                >
                  <span>จัดการรายได้</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 pl-3.5 rounded-2xl border border-slate-200/80">
                <span className="text-xs font-mono font-bold text-slate-700 truncate flex-1 select-all">
                  {window.location.origin}/register?ref={profile?.member_id || 'XXXXXX'}
                </span>
                <button
                  onClick={handleCopyReferral}
                  className="shrink-0 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                >
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">เพื่อนทั้งหมด</p>
                  <p className="text-lg font-black font-mono text-slate-900">{stats.referralCount} <span className="text-xs text-slate-400">คน</span></p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">รายได้สะสม</p>
                  <p className="text-lg font-black font-mono text-emerald-700">฿{stats.referralIncome.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                </div>
              </div>
            </div>
          </main>

          {/* ════ SECTION 3 (Right 3 Cols on PC): Navigation, Settings & Help ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Account Settings Menu */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-1">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                ข้อมูลส่วนตัว & บัญชี
              </h3>
              
              <button
                onClick={() => navigate('/edit-profile')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">manage_accounts</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">แก้ไขโปรไฟล์</span>
                    <span className="text-[11px] text-slate-400">{profile?.full_name || 'ชื่อ-นามสกุล'}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-base">chevron_right</span>
              </button>

              <button
                onClick={() => navigate('/bank-account')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">credit_card</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">บัญชีธนาคาร</span>
                    <span className="text-[11px] text-slate-400">{profile?.bank_name || 'ยังไม่ได้ผูกบัญชี'}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-base">chevron_right</span>
              </button>

              <button
                onClick={() => navigate('/change-password')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">lock_reset</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">เปลี่ยนรหัสผ่าน / PIN</span>
                    <span className="text-[11px] text-slate-400">ความปลอดภัยบัญชี</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-base">chevron_right</span>
              </button>
            </div>

            {/* Help & Terms Menu */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-1">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                ศูนย์ช่วยเหลือ & กฎระเบียบ
              </h3>

              <button
                onClick={() => navigate('/support')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">contact_support</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">ศูนย์บริการลูกค้า</span>
                    <span className="text-[11px] text-slate-400">ติดต่อแอดมิน 24 ชม.</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-base">chevron_right</span>
              </button>

              <button
                onClick={() => navigate('/terms')}
                className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">description</span>
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">ข้อกำหนดและเงื่อนไข</span>
                    <span className="text-[11px] text-slate-400">กติกาการใช้งาน</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-base">chevron_right</span>
              </button>
            </div>

            {/* Version & Security Assurance */}
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-700 font-semibold">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                <span>SSL 256-Bit Encrypted Platform</span>
              </div>
              <p className="text-[10px] text-slate-300 font-mono">TH-LOTTO Premium v{__APP_VERSION__}</p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Profile;
