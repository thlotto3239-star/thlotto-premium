import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const Affiliate = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, member_id, created_at')
          .eq('referrer_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching referrals:', err);
        return [];
      }
    };

    const fetchActivities = async () => {
      try {
        const { data } = await supabase
          .from('transactions')
          .select('id, type, amount, created_at, note')
          .eq('user_id', profile.id)
          .eq('type', 'COMMISSION')
          .order('created_at', { ascending: false })
          .limit(10);
        return data || [];
      } catch { return []; }
    };

    if (profile?.id) {
      Promise.all([fetchReferrals(), fetchActivities()]).then(([refs, commissions]) => {
        setReferrals(refs);
        const refActivities = refs.map(r => ({
          id: 'ref_' + r.id,
          kind: 'signup',
          name: r.full_name || r.member_id,
          sub: 'สมัครสมาชิกใหม่',
          created_at: r.created_at,
          amount: 0,
        }));
        const commActivities = commissions.map(c => ({
          id: 'com_' + c.id,
          kind: 'commission',
          name: c.note || 'คอมมิชชั่น',
          sub: 'ทำรายการ',
          created_at: c.created_at,
          amount: c.amount,
        }));
        const merged = [...refActivities, ...commActivities]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 10);
        setActivities(merged);
        setLoading(false);
      });
    }
  }, [profile?.id]);

  const handleTransfer = async () => {
    if (!profile?.commission_balance || profile.commission_balance <= 0) return;
    
    setTransferring(true);
    try {
      const { data, error } = await supabase.rpc('transfer_referral_income');
      if (error) throw error;
      
      if (data.success) {
        alert(`โอนรายได้จำนวน ${data.amount} บาท สำเร็จ!`);
        await refreshProfile();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error('Error transferring income:', err);
      alert('เกิดข้อผิดพลาดในการโอน');
    } finally {
      setTransferring(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?ref=${profile?.member_id}`;
    navigator.clipboard.writeText(link);
    alert('คัดลอกลิงก์แนะนำเพื่อนแล้ว!');
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700">
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">ระบบแนะนำเพื่อน</h1>
        <button
          onClick={() => alert('รับคอมมิชชั่น 8% จากทุกยอดเดิมพันของเพื่อนที่คุณแนะนำ\n\nสะสมได้ไม่จำกัด แล้วกด "โอนรายได้เข้ากระเป๋า" เพื่อรับเงิน')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700"
        >
          <span className="material-symbols-outlined text-[20px]">info</span>
        </button>
      </header>

      <main className="px-6 pt-6">
        {/* Hero Summary Card */}
        <div className="rounded-[2rem] p-7 mb-6 relative overflow-hidden text-white" style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #0f5e1d 100%)' }}>
          <div className="absolute top-[-20px] right-[-20px] w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-300 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
              </div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Affiliate Dashboard</span>
            </div>
            <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-1">รายได้สะสมทั้งหมด</p>
            <p className="text-4xl font-extrabold text-white mb-1">
              ฿{(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-emerald-300 text-xs font-bold mb-6">คอมมิชชั่น 8% จากทุกยอดเดิมพัน</p>
            <button
              onClick={handleTransfer}
              disabled={transferring || !(profile?.commission_balance > 0)}
              className="w-full h-13 py-3.5 bg-white text-[#1a7e2a] rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {transferring ? (
                <div className="w-5 h-5 border-2 border-[#1a7e2a]/30 border-t-[#1a7e2a] rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                  โอนรายได้เข้ากระเป๋า
                </>
              )}
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-[2rem] p-6 border border-slate-100 mb-6" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">link</span>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">ลิงก์แนะนำของคุณ</h3>
              <p className="text-[10px] text-slate-400 font-medium">แชร์เพื่อรับรายได้ตลอดชีพ</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-100">
            <span className="text-sm font-bold text-primary truncate flex-1">
              {window.location.origin}/register?ref={profile?.member_id || 'XXXXXX'}
            </span>
            <button
              onClick={copyToClipboard}
              className="shrink-0 w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-base">content_copy</span>
            </button>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex-1 bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">เพื่อนทั้งหมด</p>
              <p className="text-lg font-extrabold text-slate-900">{referrals.length} <span className="text-xs text-slate-400 font-medium">คน</span></p>
            </div>
            <div className="flex-1 bg-primary/5 rounded-xl p-3 border border-primary/10 text-center">
              <p className="text-[9px] text-primary font-bold uppercase tracking-widest">รหัสของคุณ</p>
              <p className="text-lg font-extrabold text-primary">{profile?.member_id || '------'}</p>
            </div>
          </div>
        </div>

        {/* Network Activity */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-900">กิจกรรมล่าสุด</h3>
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-full">
              {referrals.length} Friends
            </span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            ) : activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    act.kind === 'commission' ? 'bg-yellow-50' : 'bg-slate-50'
                  }`}>
                    <span className={`material-symbols-outlined text-xl ${
                      act.kind === 'commission' ? 'text-yellow-500' : 'text-slate-400'
                    }`} style={act.kind === 'commission' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                      {act.kind === 'commission' ? 'confirmation_number' : 'person_add'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 text-[15px] truncate">{act.name}</h4>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {act.sub} • {new Date(act.created_at).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-sm text-primary">+฿{Number(act.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <span className="material-symbols-outlined text-slate-200 text-5xl">group_add</span>
                <p className="mt-3 text-sm font-bold text-slate-400">ยังไม่มีกิจกรรม</p>
                <p className="text-xs text-slate-300 mt-1">แชร์ลิงก์เพื่อเริ่มรับรายได้</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Affiliate;
