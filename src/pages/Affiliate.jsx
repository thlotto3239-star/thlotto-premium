import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useModal } from '../contexts/ModalContext';
import PageWrapper from '../components/PageWrapper';

const Affiliate = () => {
  const { profile, user, refreshProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useModal();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchAffiliateData = async () => {
      try {
        const { data: refData, error: refError } = await supabase.rpc('get_my_referrals');
        if (refError) throw refError;
        setReferrals(refData || []);

        const { data: txData, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'COMMISSION')
          .order('created_at', { ascending: false })
          .limit(10);

        if (txError) throw txError;

        const acts = [];
        (txData || []).forEach(tx => {
          acts.push({
            id: tx.id,
            type: 'commission',
            name: 'ค่าคอมมิชชั่นแนะนำเพื่อน',
            amount: tx.amount,
            created_at: tx.created_at,
            sub: 'รายได้จากการแทง',
            kind: 'commission'
          });
        });

        (refData || []).forEach(ref => {
          acts.push({
            id: ref.id,
            type: 'referral_join',
            name: ref.full_name || 'สมาชิกใหม่',
            amount: 0,
            created_at: ref.created_at,
            sub: 'สมัครผ่านลิงก์ของคุณ',
            kind: 'join'
          });
        });

        acts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setActivities(acts.slice(0, 15));
      } catch (err) {
        console.error('Error fetching affiliate data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAffiliateData();
  }, [user]);

  const handleTransfer = async () => {
    if (!profile?.commission_balance || profile.commission_balance <= 0) {
      showError('ยอดเงินไม่เพียงพอ', 'คุณยังไม่มีรายได้สะสมที่สามารถโอนได้');
      return;
    }
    setTransferring(true);
    try {
      const { data, error } = await supabase.rpc('transfer_commission_to_balance');
      if (error) throw error;
      if (data.success) {
        showSuccess('โอนเงินสำเร็จ!', `โอนรายได้ ${Number(data.transferred).toLocaleString()} บาท เข้าสู่กระเป๋าหลักเรียบร้อยแล้ว`);
        await refreshProfile();
      } else {
        showError('โอนไม่สำเร็จ', data.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Error transferring income:', err);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถโอนรายได้ได้ กรุณาลองใหม่');
    } finally {
      setTransferring(false);
    }
  };

  const copyToClipboard = () => {
    const link = `${window.location.origin}/register?ref=${profile?.member_id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      showSuccess('คัดลอกแล้ว!', 'ลิงก์แนะนำเพื่อนถูกคัดลอกไปยังคลิปบอร์ด');
      setTimeout(() => setCopied(false), 2000);
    });
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
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">ระบบแนะนำเพื่อน (Affiliate)</h1>
              <p className="text-xs text-slate-400 hidden sm:block">สร้างรายได้แบบไม่จำกัด รับคอมมิชชั่น 8% ทุกยอดแทง</p>
            </div>
          </div>
          <button
            onClick={() => showInfo('วิธีการใช้งาน', 'รับคอมมิชชั่น 8% จากทุกยอดเดิมพันของเพื่อนที่คุณแนะนำ\n\nสะสมได้ไม่จำกัด แล้วกด "โอนรายได้เข้ากระเป๋า" เพื่อรับเงิน')}
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            title="วิธีคำนวณรายได้"
          >
            <span className="material-symbols-outlined text-lg">info</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Commission Hub & Sharing ════ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">

            {/* Hero Earnings Summary Card */}
            <div
              className="rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden border border-emerald-800/40"
              style={{ background: 'linear-gradient(135deg, #0e5b29 0%, #063d1a 100%)' }}
            >
              <div className="absolute top-[-20px] right-[-20px] size-48 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      <span className="material-symbols-outlined text-emerald-300 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
                    </div>
                    <span className="text-white/70 text-xs font-black uppercase tracking-[0.2em]">Affiliate Balance</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    อัตรา 8% ตลอดชีพ
                  </span>
                </div>

                <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">รายได้สะสมพร้อมโอน</p>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-emerald-400">฿</span>
                  <h2 className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                    {(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h2>
                </div>
                <p className="text-emerald-300/80 text-xs font-bold mb-6">คำนวณและปรับเข้ากระเป๋าแบบเรียลไทม์</p>

                <button
                  onClick={handleTransfer}
                  disabled={transferring || !(profile?.commission_balance > 0)}
                  className="w-full py-4 bg-white hover:bg-emerald-50 text-emerald-900 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {transferring ? (
                    <div className="w-5 h-5 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
                      <span>โอนรายได้เข้ากระเป๋าหลัก</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Referral Link Sharing Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <span className="material-symbols-outlined text-xl">share</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">ลิงก์และรหัสแนะนำของคุณ</h3>
                  <p className="text-xs text-slate-400">ส่งต่อให้เพื่อนเพื่อเริ่มรับส่วนแบ่งทันที</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-2 pl-4 rounded-2xl border border-slate-200/80">
                <span className="text-xs sm:text-sm font-mono font-bold text-brand-700 truncate flex-1">
                  {window.location.origin}/register?ref={profile?.member_id || 'XXXXXX'}
                </span>
                <button
                  onClick={copyToClipboard}
                  className="shrink-0 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl flex items-center gap-1 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">{copied ? 'check' : 'content_copy'}</span>
                  <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 text-center">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">เพื่อนที่แนะนำ</p>
                  <p className="text-xl font-black font-mono text-slate-900 mt-0.5">{referrals.length} <span className="text-xs font-normal text-slate-400">คน</span></p>
                </div>
                <div className="bg-brand-50/60 rounded-2xl p-3.5 border border-brand-100 text-center">
                  <p className="text-xs text-brand-700 font-bold uppercase tracking-wider">รหัสของคุณ</p>
                  <p className="text-xl font-black font-mono text-brand-700 mt-0.5">{profile?.member_id || '------'}</p>
                </div>
              </div>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Network Activity & Referrals ════ */}
          <div className="lg:col-span-7 space-y-6">

            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-900 text-base">กิจกรรมและรายได้สายงาน</h3>
                  <p className="text-xs text-slate-400 mt-0.5">รายการคอมมิชชั่นและการสมัครของสมาชิกในเครือข่าย</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200/60">
                  {referrals.length} สมาชิก
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 mt-3 font-bold">กำลังดึงข้อมูลสายงาน...</p>
                  </div>
                ) : activities.length > 0 ? (
                  activities.map((act) => (
                    <div key={act.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                          act.kind === 'commission'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                          <span className="material-symbols-outlined text-lg" style={act.kind === 'commission' ? { fontVariationSettings: "'FILL' 1" } : {}}>
                            {act.kind === 'commission' ? 'stars' : 'person_add'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-sm truncate">{act.name}</h4>
                          <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {act.sub} • {new Date(act.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        {act.kind === 'commission' ? (
                          <p className="font-mono font-black text-sm sm:text-base text-emerald-600">
                            +฿{Number(act.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            เข้าร่วมแล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-3">
                    <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                      <span className="material-symbols-outlined text-3xl">group_add</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-600">ยังไม่มีสมาชิกในสายงาน</p>
                      <p className="text-xs text-slate-400 mt-1">คัดลอกลิงก์ด้านซ้ายแล้วแชร์ให้เพื่อนเพื่อเริ่มรับรายได้ 8% ทันที</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Affiliate;
