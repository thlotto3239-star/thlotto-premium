import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';

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
  const navigate = useNavigate();
  const [bankInfo, setBankInfo] = useState(null);
  const [copied, setCopied] = useState(false);

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
  const bankColor = BANK_COLORS[bankCode] || { bg: '#1e293b', text: '#fff' };
  const memberDate = profile?.created_at
    ? new Intl.DateTimeFormat('th-TH', { year: 'numeric', month: 'short' }).format(new Date(profile.created_at))
    : '—';

  const copyAccountNo = () => {
    if (profile?.bank_account_number) {
      navigator.clipboard.writeText(profile.bank_account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">บัญชีธนาคาร</h1>
              <p className="text-xs text-slate-400 hidden sm:block">ข้อมูลบัญชีสำหรับการฝาก-ถอนเงินรางวัล</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ยืนยันแล้ว
            </span>
          </div>
        </div>
      </header>

      {/* Main Responsive Container (Full Width on PC) */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): 3D Bank Card & Security Radar ════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* ── Premium Realistic Debit Card ── */}
            <div
              className="relative w-full rounded-[28px] overflow-hidden shadow-2xl transition-transform duration-300 hover:scale-[1.01]"
              style={{
                aspectRatio: '1.586 / 1',
                background: `linear-gradient(135deg, ${bankColor.bg} 0%, #0f172a 120%)`,
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)'
              }}
            >
              {/* Decorative blobs */}
              <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-sm" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/20 blur-sm" />
              <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5" />

              {/* Chip pattern */}
              <div
                className="absolute left-6 top-[38%] w-11 h-8 rounded-lg border-2 opacity-50 bg-amber-400/20"
                style={{ borderColor: bankColor.text + '90' }}
              >
                <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: bankColor.text + '70' }} />
                <div className="absolute inset-y-0 left-1/3 w-px" style={{ background: bankColor.text + '70' }} />
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-7" style={{ color: bankColor.text }}>

                {/* Top row — bank logo + DEBIT label */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {bankInfo?.image_url ? (
                      <div className="size-12 rounded-2xl bg-white shadow-md flex items-center justify-center overflow-hidden p-1.5 shrink-0">
                        <img
                          src={bankInfo.image_url}
                          alt={bankInfo.name}
                          className="w-full h-full object-contain"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="size-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                        <span className="font-black text-sm tracking-tight" style={{ color: bankColor.text }}>
                          {bankCode.slice(0, 3)}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.2em] opacity-70">BANK</p>
                      <p className="font-extrabold text-sm sm:text-base leading-tight truncate max-w-[180px]">
                        {bankInfo?.name || bankCode || 'ไม่ระบุธนาคาร'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 mt-0.5">
                    <span className="text-xs font-black tracking-[0.3em] uppercase opacity-50">DEBIT</span>
                    <div className="flex gap-0.5">
                      <div className="w-5 h-5 rounded-full bg-white/30" />
                      <div className="w-5 h-5 rounded-full bg-white/20 -ml-2.5" />
                    </div>
                  </div>
                </div>

                {/* Account Number */}
                <div className="my-auto pt-6">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-1">ACCOUNT NO.</p>
                  <p className="tabular-nums text-xl sm:text-2xl font-black tracking-[0.22em] font-mono">
                    {maskAccountNumber(profile?.bank_account_number)}
                  </p>
                </div>

                {/* Bottom row */}
                <div className="flex items-end justify-between pt-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5">ACCOUNT HOLDER</p>
                    <p className="font-extrabold text-sm sm:text-base truncate max-w-[200px]">
                      {profile?.full_name || '—'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-60 mb-0.5">MEMBER SINCE</p>
                    <p className="font-bold text-xs sm:text-sm">{memberDate}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            <button
              onClick={copyAccountNo}
              className="w-full py-3.5 px-5 rounded-2xl bg-white border border-slate-200/80 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-brand-600">
                {copied ? 'check_circle' : 'content_copy'}
              </span>
              <span>{copied ? 'คัดลอกเลขบัญชีสำเร็จ!' : 'คัดลอกเลขบัญชีธนาคาร'}</span>
            </button>

            {/* Security Guarantee Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-emerald-600 text-base">verified_user</span>
                <span>มาตรฐานความปลอดภัยสูงสุด</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ระบบใช้มาตรการ 1 บัญชีผู้ใช้ ต่อ 1 บัญชีธนาคาร เพื่อป้องกันการโจรกรรมและการฟอกเงิน ยอดเงินรางวัลจะถูกโอนตรงเข้าสู่บัญชีนี้เท่านั้น
              </p>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Account Specs & Details ════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Detail Spec Table Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-slate-900 text-base">ข้อมูลการผูกบัญชี</h2>
                  <p className="text-xs text-slate-400 mt-0.5">รายละเอียดสำหรับการทำธุรกรรมการเงิน</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                  {bankCode || 'ACTIVE'}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-1 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: bankColor.bg + '15' }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: bankColor.bg }}>account_balance</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ธนาคาร</p>
                      <p className="font-extrabold text-slate-900 text-sm">{bankInfo?.name || bankCode || '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200/60 self-start sm:self-auto">
                    รหัสย่อ: {bankCode}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-1 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="material-symbols-outlined text-slate-500 text-lg">credit_card</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">เลขที่บัญชี</p>
                      <p className="font-black text-slate-900 text-base font-mono tabular-nums tracking-wider">
                        {profile?.bank_account_number || '—'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={copyAccountNo}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                    คัดลอก
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-1 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="material-symbols-outlined text-slate-500 text-lg">person</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่อเจ้าของบัญชี</p>
                      <p className="font-extrabold text-slate-900 text-sm">{profile?.full_name || '—'}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 self-start sm:self-auto">
                    ชื่อตรงกับโปรไฟล์
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 gap-1 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <span className="material-symbols-outlined text-slate-500 text-lg">verified</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะการตรวจสอบ</p>
                      <p className="font-extrabold text-emerald-600 text-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        พร้อมใช้งานสำหรับฝาก-ถอน
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-slate-400 self-start sm:self-auto">
                    SSL 256-Bit Protected
                  </span>
                </div>
              </div>
            </div>

            {/* Change Account Policy Warning Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-3xl p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <span className="material-symbols-outlined text-xl">help_outline</span>
                </div>
                <div>
                  <h3 className="font-black text-amber-950 text-sm sm:text-base">ต้องการเปลี่ยนบัญชีธนาคาร?</h3>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    เพื่อความปลอดภัยของเงินในระบบ สมาชิกไม่สามารถแก้ไขเลขบัญชีธนาคารด้วยตนเองได้ หากท่านเปลี่ยนบัญชีใหม่ กรุณาติดต่อทีมงานฝ่ายบริการลูกค้าพร้อมเตรียมหลักฐานยืนยันตัวตน
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/support')}
                className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                <span>ติดต่อฝ่ายบริการลูกค้าเพื่อขอเปลี่ยนบัญชี</span>
              </button>
            </div>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default BankAccount;
