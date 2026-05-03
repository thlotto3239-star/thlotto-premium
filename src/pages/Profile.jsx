import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { supabase } from '../supabaseClient';

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
    <div className="bg-background-light text-slate-900 font-thai">
      <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col pb-24 shadow-2xl bg-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-8 pb-4">
          <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full bg-slate-100">
            <span className="material-symbols-outlined text-slate-600 text-[20px]">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 font-thai">โปรไฟล์</h1>
          <button onClick={() => navigate('/edit-profile')} className="flex items-center justify-center size-10 rounded-full bg-slate-100">
            <span className="material-symbols-outlined text-slate-600 text-[22px]">settings</span>
          </button>
        </div>
        {/* User Summary */}
        <div className="flex flex-col items-center px-6 py-6">
          <div className="relative">
            <div className="size-32 rounded-full p-1 border-2 border-gold-premium">
              <div className="size-full rounded-full bg-white p-1">
                <div className="size-full rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${profile?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgof3BCFj0rErRAwKrIsWBLEWMdvgPl8nEtwZp4Rdi5D2FtM5MeFaCdN-mvSekasJaxAPmbZeD4AzLkfUqdNETdbKUy6oaVXOEOGbyAjjNfPxCBm_lxQVZVBTmnlPxAPbi_eVhqjgfWBHfavqn-LY8lnIxIgAKTqn51tMMKbmnWSkTJ_iegEl7pHS6layrdt47gsJ4tCG4EsxNjWKmMsrkniohPpAH_LAmP9SYmrRknJWD_tj9d8935gZe6xoaxyIs3ewfwxz70Q'}')` }}></div>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full border border-gold-premium/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-gold-premium text-sm fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              <span className="text-[10px] font-extrabold text-gold-premium uppercase tracking-widest font-thai">{profile?.vip_level || 'MEMBER'}</span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-thai">{profile?.full_name || 'ผู้ใช้งานทั่วไป'}</h2>
            <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-tight font-thai">ID: {profile?.member_id || '------'} • สมาชิกตั้งแต่ {profile?.created_at ? new Date(profile.created_at).getFullYear() : '-'}</p>
          </div>
        </div>
        {/* Account Stats Grid */}
        <div className="grid grid-cols-2 gap-4 px-6 mt-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-thai">ยอดเงิน</p>
            <p className="text-lg font-extrabold text-slate-900 font-display">฿{(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-thai">รายได้แนะนำเพื่อน</p>
            <p className="text-lg font-extrabold text-slate-900 font-display">฿{(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-thai">รายการแทง</p>
            <p className="text-lg font-extrabold text-slate-900 font-display">{stats.betCount} <span className="text-xs font-medium text-slate-400 font-thai">ครั้ง</span></p>
          </div>
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col gap-2">
            <span className="material-symbols-outlined text-primary fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider font-thai">ถูกรางวัล</p>
            <p className="text-lg font-extrabold text-slate-900 font-display">฿{stats.totalWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        {/* Affiliate System Section */}
        <div className="px-6 mt-10">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4 tracking-tight font-thai">ระบบแนะนำเพื่อน</h3>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 font-thai">ลิงก์แนะนำของคุณ</p>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 bg-white border border-slate-200 rounded-full px-5 py-3 text-sm text-slate-400 truncate font-medium font-thai">
                {window.location.origin}/register?ref={profile?.member_id || 'XXXXXX'}
              </div>
              <button
                onClick={handleCopyReferral}
                className="bg-gold-premium text-white px-6 py-3 rounded-full font-extrabold text-sm uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all font-thai whitespace-nowrap"
              >
                {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-thai">เพื่อนทั้งหมด</p>
                <p className="text-xl font-extrabold text-slate-900 font-display">{stats.referralCount.toLocaleString()} <span className="text-sm font-semibold text-slate-400 font-thai">คน</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest font-thai">รายได้สะสม</p>
                <p className="text-xl font-extrabold text-primary font-display">฿{stats.referralIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <button onClick={() => navigate('/affiliate')} className="w-full bg-primary text-white py-4 rounded-full font-extrabold text-lg flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all font-thai">
              <span className="material-symbols-outlined fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
              จัดการรายได้
            </button>
          </div>
        </div>
        {/* ── Section: ข้อมูลส่วนตัว ── */}
        <div className="px-6 mt-10 flex flex-col">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1 font-thai">ข้อมูลส่วนตัว</h3>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            <button onClick={() => navigate('/edit-profile')} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">manage_accounts</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 font-thai block">แก้ไขโปรไฟล์</span>
                  <span className="text-xs text-slate-400 font-thai">{profile?.full_name || '—'}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button onClick={() => navigate('/bank-account')} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">credit_card</span>
                </div>
                <div>
                  <span className="font-bold text-slate-800 font-thai block">บัญชีธนาคาร</span>
                  <span className="text-xs text-slate-400 font-thai">{profile?.bank_name || 'ยังไม่ได้ผูกบัญชี'}</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
        </div>

        {/* ── Section: ตั้งค่าและช่วยเหลือ ── */}
        <div className="px-6 mt-6 flex flex-col">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 px-1 font-thai">ตั้งค่าและช่วยเหลือ</h3>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden divide-y divide-slate-50">
            <button onClick={() => navigate('/change-password')} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-orange-500 text-[20px]">lock_reset</span>
                </div>
                <span className="font-bold text-slate-700 font-thai">เปลี่ยนรหัสผ่าน</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button onClick={() => navigate('/support')} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600 text-[20px]">contact_support</span>
                </div>
                <span className="font-bold text-slate-700 font-thai">ศูนย์ช่วยเหลือ</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
            <button onClick={() => navigate('/terms')} className="flex items-center justify-between p-4 group active:bg-slate-50 transition-colors w-full text-left">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-600 text-[20px]">description</span>
                </div>
                <span className="font-bold text-slate-700 font-thai">เงื่อนไขการใช้งาน</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
          <button onClick={handleLogout} className="mt-6 flex items-center justify-center gap-2 p-4 w-full bg-red-50 text-red-600 rounded-full font-extrabold uppercase tracking-wider text-sm transition-all hover:bg-red-100 active:scale-[0.98] font-thai">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            ออกจากระบบ
          </button>
        </div>
        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
