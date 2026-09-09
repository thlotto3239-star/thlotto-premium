import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { supabase } from '../supabaseClient';

const Profile = () => {
  const { profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ betCount: 0, totalWin: 0, referralCount: 0, referralIncome: 0 });
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const handleCopyReferral = () => {
    const link = `${window.location.origin}/register?ref=${profile?.member_id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    });
  };

  const handleCopyMemberId = () => {
    if (profile?.member_id) {
      navigator.clipboard.writeText(profile.member_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
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
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">โปรไฟล์สมาชิก</h1>
              <p className="text-xs text-slate-400 hidden sm:block">ข้อมูลบัญชีและศูนย์จัดการความปลอดภัย</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/edit-profile')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">manage_accounts</span>
            <span>แก้ไขโปรไฟล์</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Member Card, Financial Summary & Referral ════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* Member Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-br from-brand-700 to-slate-900 opacity-90"></div>

              <div className="relative z-10 mt-6 mb-3">
                <div className="size-28 rounded-full p-1 bg-white shadow-xl ring-4 ring-gold-premium/30">
                  <img
                    alt={profile?.full_name || 'Member'}
                    className="size-full rounded-full object-cover"
                    src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone || profile?.id}`}
                  />
                </div>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-slate-900 text-gold-premium px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-widest border border-gold-premium/40 flex items-center gap-1 shadow-sm whitespace-nowrap">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                  {profile?.vip_level || 'MEMBER'}
                </span>
              </div>

              <div className="relative z-10 mt-2 space-y-1">
                <h2 className="text-xl font-black text-slate-900 truncate max-w-[280px]">
                  {profile?.full_name || 'ผู้ใช้งานทั่วไป'}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-500">ID: {profile?.member_id || '------'}</span>
                  <button
                    onClick={handleCopyMemberId}
                    className="text-slate-400 hover:text-brand-600 transition-colors cursor-pointer"
                    title="คัดลอก Member ID"
                  >
                    <span className="material-symbols-outlined text-sm">{copiedId ? 'check' : 'content_copy'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  สมาชิกตั้งแต่ {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { month: 'short', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>

            {/* Financial & Activity Stats 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ยอดเงินคงเหลือ</p>
                  <p className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-0.5">
                    ฿{(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="size-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-lg">payments</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ค่าคอมมิชชั่น</p>
                  <p className="text-lg sm:text-xl font-black font-mono text-brand-700 mt-0.5">
                    ฿{(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div
                onClick={() => navigate('/bet-history')}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-brand-300 transition-all cursor-pointer"
              >
                <div className="size-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">รายการแทงสะสม</p>
                  <p className="text-lg sm:text-xl font-black font-mono text-slate-900 mt-0.5">
                    {stats.betCount.toLocaleString()} <span className="text-xs font-normal text-slate-400">บิล</span>
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div className="size-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-lg">emoji_events</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">ยอดถูกรางวัลรวม</p>
                  <p className="text-lg sm:text-xl font-black font-mono text-amber-600 mt-0.5">
                    ฿{stats.totalWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Referral Card */}
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400 text-xl">group_add</span>
                  <h3 className="font-extrabold text-sm sm:text-base">แนะนำเพื่อนรับ 8%</h3>
                </div>
                <span className="text-xs text-emerald-300 font-bold bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                  {stats.referralCount} คน
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-300 font-mono truncate">
                  {window.location.origin}/register?ref={profile?.member_id || 'XXXXXX'}
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                  {copiedRef ? 'คัดลอกแล้ว!' : 'คัดลอก'}
                </button>
              </div>
              <button
                onClick={() => navigate('/affiliate')}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>เข้าสู่ระบบจัดการสายงานแนะนำเพื่อน</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Account Settings Hub ════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Settings Group: บัญชีและความปลอดภัย */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">บัญชีและความปลอดภัย</h3>
              </div>
              <div className="divide-y divide-slate-100">
                <button
                  onClick={() => navigate('/bank-account')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">account_balance</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">บัญชีธนาคารสำหรับฝาก-ถอน</p>
                      <p className="text-xs text-slate-500 mt-0.5">{profile?.bank_name || 'ยังไม่ได้ผูกบัญชี'} · {profile?.bank_account_number || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">ยืนยันแล้ว</span>
                    <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/edit-profile')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">badge</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">แก้ไขข้อมูลส่วนตัวและรูปโปรไฟล์</p>
                      <p className="text-xs text-slate-500 mt-0.5">เบอร์โทรศัพท์: {profile?.phone || '—'}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                </button>

                <button
                  onClick={() => navigate('/change-password')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">lock_reset</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">รหัส PIN ความปลอดภัย (4 หลัก)</p>
                      <p className="text-xs text-slate-500 mt-0.5">สำหรับเข้าสู่ระบบและยืนยันการถอนเงิน</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Settings Group: การใช้งานและบริการ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">บริการและข้อตกลง</h3>
              </div>
              <div className="divide-y divide-slate-100">
                <button
                  onClick={() => navigate('/bet-history')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">receipt_long</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">ประวัติการเดิมพันและโพยหวย</p>
                      <p className="text-xs text-slate-500 mt-0.5">ตรวจสอบโพยที่ออกผลแล้วและรอผล</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                </button>

                <button
                  onClick={() => navigate('/support')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">contact_support</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">ศูนย์ช่วยเหลือและติดต่อทีมงาน</p>
                      <p className="text-xs text-slate-500 mt-0.5">บริการ 24 ชั่วโมงผ่าน LINE Official</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                </button>

                <button
                  onClick={() => navigate('/terms')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-xl">description</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm">เงื่อนไขและข้อตกลงการใช้งาน</p>
                      <p className="text-xs text-slate-500 mt-0.5">นโยบายความเป็นส่วนตัวและกติกา</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-lg group-hover:text-brand-600 transition-colors">chevron_right</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full py-4 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>ออกจากระบบสมาชิก</span>
            </button>

            <p className="text-center text-xs text-slate-400">
              TH-LOTTO Platform v{__APP_VERSION__} · SSL 256-Bit Protected
            </p>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Profile;
