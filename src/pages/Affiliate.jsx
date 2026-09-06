import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useModal } from '../contexts/ModalContext';

const Affiliate = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError, showInfo } = useModal();
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [calcVolume, setCalcVolume] = useState(50000);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL', 'COMMISSION', 'SIGNUP'

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const { data, error } = await supabase.rpc('get_my_referrals');
        if (error) throw error;
        return (data || []).slice(0, 20);
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
          .eq('user_id', profile?.id)
          .eq('type', 'COMMISSION')
          .order('created_at', { ascending: false })
          .limit(20);
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
          name: c.note || 'คอมมิชชั่นแทงหวย',
          sub: 'รับคอมมิชชั่น 8%',
          created_at: c.created_at,
          amount: c.amount,
        }));
        const merged = [...refActivities, ...commActivities]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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
      
      if (data?.success) {
        showSuccess('โอนรายได้สำเร็จ!', `โอนเงิน ฿${Number(data.amount || 0).toLocaleString()} เข้ากระเป๋าหลักเรียบร้อยแล้ว`);
        await refreshProfile();
      } else {
        showError('โอนไม่สำเร็จ', data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      }
    } catch (err) {
      console.error('Error transferring income:', err);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถโอนรายได้ได้ กรุณาลองใหม่');
    } finally {
      setTransferring(false);
    }
  };

  const referralLink = `${window.location.origin}/register?ref=${profile?.member_id || '------'}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    showSuccess('คัดลอกแล้ว!', 'ลิงก์แนะนำเพื่อนถูกคัดลอกไปยังคลิปบอร์ด');
  };

  const filteredActivities = activities.filter(act => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'COMMISSION') return act.kind === 'commission';
    if (activeTab === 'SIGNUP') return act.kind === 'signup';
    return true;
  });

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
                <span>ระบบแนะนำเพื่อน</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Affiliate 8%
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">แชร์ลิงก์รับส่วนแบ่งค่าคอมมิชชั่น 8% จากทุกยอดเดิมพันตลอดชีพ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">content_copy</span>
              <span>คัดลอกลิงก์</span>
            </button>
            <button
              onClick={() => showInfo('เงื่อนไขระบบแนะนำเพื่อน', '1. รับคอมมิชชั่น 8% จากทุกยอดการแทงหวยของเพื่อนที่คุณแนะนำ\n2. รายได้สะสมอัปเดตแบบเรียลไทม์\n3. สามารถกดโอนเข้ากระเป๋าหลักได้ทันที ไม่มีเงื่อนไขเทิร์นโอเวอร์')}
              className="size-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-base">info</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Section Dashboard */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ SECTION 1 (Left 4 Cols on PC): Referral Card & Links ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* My Referral Link Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">share</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">ลิงก์ชวนเพื่อนของคุณ</h3>
                    <p className="text-[11px] text-slate-400 font-medium">ส่งให้เพื่อนสมัครเพื่อรับคอมมิชชั่น</p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  รับ 8%
                </span>
              </div>

              {/* Link Input with Copy Button */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-slate-50 p-2 pl-3.5 rounded-2xl border border-slate-200/80">
                  <span className="material-symbols-outlined text-slate-400 text-base">link</span>
                  <span className="text-xs font-mono font-bold text-slate-700 truncate flex-1 select-all">
                    {referralLink}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="shrink-0 size-9 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
                    title="คัดลอกลิงก์"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                </div>
              </div>

              {/* Member ID & Friends Count */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                    รหัสแนะนำของคุณ
                  </p>
                  <p className="text-base font-black font-mono text-emerald-800">
                    {profile?.member_id || '------'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-center">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">
                    เพื่อนที่สมัครแล้ว
                  </p>
                  <p className="text-base font-black font-mono text-slate-900">
                    {referrals.length} <span className="text-xs text-slate-400 font-bold">คน</span>
                  </p>
                </div>
              </div>

              {/* Share Channels */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-extrabold text-slate-500 mb-2.5">แชร์ผ่านช่องทางโซเชียล</p>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://line.me/R/msg/text/?${encodeURIComponent('เว็บแทงหวยออนไลน์อัตราจ่ายสูงสุด สมัครที่นี่: ' + referralLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 rounded-xl bg-[#06C755] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <span>LINE</span>
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 rounded-xl bg-[#1877F2] hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <span>Facebook</span>
                  </a>
                  <button
                    onClick={copyToClipboard}
                    className="h-10 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    <span>ส่งลิงก์</span>
                  </button>
                </div>
              </div>
            </div>

            {/* How it Works Guide */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                ขั้นตอนการสร้างรายได้
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">1</span>
                  <p><strong>แชร์ลิงก์</strong> ให้เพื่อนผ่าน LINE, Facebook หรือกลุ่มต่างๆ</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">2</span>
                  <p><strong>เพื่อนสมัครและแทงหวย</strong> ระบบคำนวณคอมมิชชั่น 8% ให้ทันที</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <p><strong>กดโอนเข้ากระเป๋า</strong> ถอนเงินสดเข้าบัญชีธนาคารได้ทันที</p>
                </div>
              </div>
            </div>
          </aside>

          {/* ════ SECTION 2 (Center 5 Cols on PC): Income Dashboard & Activity Feed ════ */}
          <main className="lg:col-span-5 space-y-4">
            {/* Hero Commission Balance Card */}
            <div
              className="rounded-3xl p-7 relative overflow-hidden text-white shadow-md"
              style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #0f5e1d 100%)' }}
            >
              <div className="absolute top-[-30px] right-[-30px] size-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-300 text-lg">monetization_on</span>
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">รายได้คอมมิชชั่นพร้อมโอน</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white">
                    อัตรา 8%
                  </span>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-emerald-200">฿</span>
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                      {(profile?.commission_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-200/90 font-medium mt-1">
                    สะสมได้ไม่จำกัด ถอนเข้ากระเป๋าหลักได้ตลอดเวลา
                  </p>
                </div>

                <button
                  onClick={handleTransfer}
                  disabled={transferring || !(profile?.commission_balance > 0)}
                  className="w-full h-13 rounded-2xl bg-white hover:bg-emerald-50 text-[#1a7e2a] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {transferring ? (
                    <div className="size-5 border-2 border-[#1a7e2a]/30 border-t-[#1a7e2a] rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
                      <span>โอนรายได้เข้ากระเป๋าหลัก</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Activity Feed Container */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <span>กิจกรรมและรายได้ล่าสุด</span>
                  <span className="text-xs font-bold text-slate-400 font-mono">({filteredActivities.length})</span>
                </h3>

                {/* Filter Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                  {[
                    { id: 'ALL', label: 'ทั้งหมด' },
                    { id: 'COMMISSION', label: 'คอมมิชชั่น' },
                    { id: 'SIGNUP', label: 'สมาชิกใหม่' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        activeTab === tab.id
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed List */}
              {loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2">
                  <div className="size-8 border-3 border-emerald-600/30 border-t-emerald-700 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-400 font-medium">กำลังโหลดกิจกรรม...</p>
                </div>
              ) : filteredActivities.length > 0 ? (
                <div className="space-y-2.5">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                          act.kind === 'commission' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          <span className="material-symbols-outlined text-lg">
                            {act.kind === 'commission' ? 'monetization_on' : 'person_add'}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{act.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {act.sub} • {new Date(act.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {act.kind === 'commission' ? (
                          <p className="text-xs font-black font-mono text-emerald-700">
                            +฿{Number(act.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full">
                            ลงทะเบียน
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-1">group_add</span>
                  <p className="text-xs font-extrabold text-slate-700">ยังไม่มีประวัติในหมวดหมู่นี้</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">เริ่มแชร์ลิงก์แนะนำเพื่อนเพื่อรับคอมมิชชั่น</p>
                </div>
              )}
            </div>
          </main>

          {/* ════ SECTION 3 (Right 3 Cols on PC): Calculator & Benefits ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Revenue Estimator Calculator */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">calculate</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  คำนวณรายได้โดยประมาณ
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">ยอดแทงของเพื่อนรวม:</span>
                    <span className="font-mono font-bold text-slate-900">฿{calcVolume.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="5000"
                    max="500000"
                    step="5000"
                    value={calcVolume}
                    onChange={(e) => setCalcVolume(Number(e.target.value))}
                    className="w-full accent-emerald-700 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>5,000</span>
                    <span>250,000</span>
                    <span>500,000</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center">
                  <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    คุณจะได้รับคอมมิชชั่น 8%
                  </p>
                  <p className="text-2xl font-black font-mono text-emerald-700">
                    ฿{(calcVolume * 0.08).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                  <p className="text-[10px] text-emerald-600 mt-1">
                    คำนวณจากยอดแทงหวยทุกประเภท
                  </p>
                </div>
              </div>
            </div>

            {/* VIP Affiliate Benefits */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-400 uppercase tracking-wider">
                สิทธิประโยชน์พาร์ทเนอร์
              </h3>
              <div className="space-y-2.5 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>รับส่วนแบ่งคงที่ <strong>8% ทุกบิล</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>ระบบตัดรอบและโอนเงิน <strong>เรียลไทม์</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>ผูกมิตรภาพตลอดชีพ สมาชิกไม่หมดอายุ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm">check_circle</span>
                  <span>ถอนได้ทันที <strong>ไม่ติดยอดเทิร์น</strong></span>
                </div>
              </div>
            </div>

            {/* Support Hotline */}
            <div className="bg-slate-50 rounded-3xl p-4.5 border border-slate-200/80 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">ต้องการสื่อโปรโมทหรือคำปรึกษา?</p>
              <Link
                to="/support"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-800"
              >
                <span>ติดต่อฝ่ายดูแลพันธมิตร</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Affiliate;
