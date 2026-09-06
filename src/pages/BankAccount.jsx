import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';
import { useModal } from '../contexts/ModalContext';

const BANK_COLORS = {
  KBANK:      { bg: '#1BA74E', text: '#fff' },
  SCB:        { bg: '#4E2E7F', text: '#fff' },
  BBL:        { bg: '#1E4D8C', text: '#fff' },
  KTB:        { bg: '#1BA1E5', text: '#fff' },
  BAY:        { bg: '#FFD000', text: '#543b17' },
  TTB:        { bg: '#002A68', text: '#fff' },
  GSB:        { bg: '#E91E8C', text: '#fff' },
  BAAC:       { bg: '#4CAF50', text: '#fff' },
  TRUEWALLET: { bg: '#FF6600', text: '#fff' },
  UOB:        { bg: '#003DA5', text: '#fff' },
};

const maskAccountNumber = (acc) => {
  if (!acc) return '•••• •••• ••••';
  const clean = acc.replace(/[-\s]/g, '');
  if (clean.length <= 4) return acc;
  const last4 = clean.slice(-4);
  const masked = '•'.repeat(Math.max(0, clean.length - 4)) + last4;
  return masked.match(/.{1,4}/g)?.join('  ') || masked;
};

const BankAccount = () => {
  const { profile } = useAuth();
  const { showSuccess } = useModal();
  const navigate = useNavigate();
  const [bankInfo, setBankInfo] = useState(null);

  useEffect(() => {
    if (!profile?.bank_name) return;
    const fetchBank = async () => {
      const { data } = await supabase
        .from('banks')
        .select('name, code, image_url')
        .eq('code', profile.bank_name)
        .single();
      if (data) setBankInfo(data);
    };
    fetchBank();
  }, [profile?.bank_name]);

  const bankCode = profile?.bank_name || '';
  const bankColor = BANK_COLORS[bankCode] || { bg: '#475569', text: '#fff' };
  const memberDate = profile?.created_at
    ? new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short' }).format(new Date(profile.created_at))
    : '—';

  const copyAcc = () => {
    if (profile?.bank_account_number) {
      navigator.clipboard.writeText(profile.bank_account_number);
      showSuccess('คัดลอกสำเร็จ', 'คัดลอกเลขที่บัญชีแล้ว');
    }
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
                <span>บัญชีธนาคารของคุณ</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Verified Bank
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">บัญชีธนาคารที่ผูกไว้สำหรับรับเงินรางวัลและถอนเงินอัตโนมัติ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/edit-profile')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              <span>แก้ไขบัญชี</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 4 Cols on PC): 3D Bank Smart Card ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            <div
              className="relative w-full rounded-[28px] overflow-hidden shadow-xl"
              style={{ aspectRatio: '1.586 / 1', background: `linear-gradient(135deg, ${bankColor.bg}ee 0%, ${bankColor.bg} 100%)` }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-12 -right-12 size-56 rounded-full bg-white/10 blur-sm pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 size-44 rounded-full bg-black/10 blur-sm pointer-events-none" />

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6" style={{ color: bankColor.text }}>
                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {bankInfo?.image_url ? (
                      <div className="size-11 rounded-xl bg-white shadow-md flex items-center justify-center overflow-hidden p-1 shrink-0">
                        <img
                          src={bankInfo.image_url}
                          alt={bankInfo.name}
                          className="size-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="size-11 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
                        {bankCode || 'BNK'}
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-sm leading-tight drop-shadow-xs">
                        {bankInfo?.name || profile?.bank_name || 'ยังไม่ผูกบัญชี'}
                      </p>
                      <p className="text-[10px] opacity-75 font-mono tracking-wider">SAVINGS ACCOUNT</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-black/20 backdrop-blur-xs">
                    DEBIT
                  </span>
                </div>

                {/* Account Number */}
                <div className="space-y-1 my-auto">
                  <p className="font-mono text-xl sm:text-2xl font-black tracking-widest drop-shadow-xs">
                    {maskAccountNumber(profile?.bank_account_number)}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="flex items-end justify-between text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-70 mb-0.5">CARD HOLDER</p>
                    <p className="font-extrabold tracking-wide uppercase drop-shadow-xs">
                      {profile?.bank_account_name || profile?.full_name || 'ACCOUNT HOLDER'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider opacity-70 mb-0.5">MEMBER SINCE</p>
                    <p className="font-mono font-bold">{memberDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">สถานะการผูกบัญชี</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                  พร้อมรับเงิน
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                บัญชีนี้ใช้สำหรับระบบถอนเงินออโต้ ยอดเงินจะถูกโอนเข้าบัญชีนี้โดยตรง
              </p>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 5 Cols on PC): Detailed Account Specs ════ */}
          <main className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">badge</span>
                <span>รายละเอียดข้อมูลบัญชีธนาคาร</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block">ธนาคาร</span>
                    <span className="font-extrabold text-slate-900 text-sm">{bankInfo?.name || profile?.bank_name || '—'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-500 bg-white px-2.5 py-1 rounded-xl border border-slate-200/80">
                    {profile?.bank_name || 'N/A'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-[11px] block">เลขที่บัญชี</span>
                    <span className="font-mono font-black text-slate-900 text-base">{profile?.bank_account_number || '—'}</span>
                  </div>
                  {profile?.bank_account_number && (
                    <button
                      onClick={copyAcc}
                      className="size-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="คัดลอกเลขบัญชี"
                    >
                      <span className="material-symbols-outlined text-base">content_copy</span>
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 text-[11px] block">ชื่อเจ้าของบัญชี</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {profile?.bank_account_name || profile?.full_name || '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/edit-profile')}
                  className="w-full h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  <span>เปลี่ยนหรือแก้ไขบัญชีธนาคาร</span>
                </button>
              </div>
            </div>
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Quick Banking Shortcuts & SLA ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Direct Withdrawal Shortcut */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-300 text-xl">payments</span>
                <h4 className="text-xs font-extrabold">ต้องการถอนเงิน?</h4>
              </div>
              <p className="text-[11px] text-emerald-200 leading-relaxed">
                เงินจะถูกโอนเข้าบัญชีนี้โดยอัตโนมัติภายใน 5-15 นาที ตลอด 24 ชม.
              </p>
              <Link
                to="/withdrawal"
                className="block py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs text-center transition-all shadow-xs"
              >
                ไปหน้าถอนเงิน
              </Link>
            </div>

            {/* Safety Rules */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-2.5 text-xs text-slate-600">
              <h4 className="font-extrabold text-slate-400 uppercase tracking-wider text-[11px]">
                ข้อกำหนดความปลอดภัย
              </h4>
              <p className="leading-relaxed">
                1 บัญชีผู้ใช้สามารถผูกได้ 1 บัญชีธนาคารเท่านั้น เพื่อความปลอดภัยจากการถูกสวมรอย
              </p>
              <p className="leading-relaxed">
                หากต้องการเปลี่ยนชื่อบัญชี กรุณาติดต่อฝ่ายบริการลูกค้าเพื่อยืนยันตัวตน
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default BankAccount;
