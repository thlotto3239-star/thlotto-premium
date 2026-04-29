import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

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

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-body flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-extrabold text-lg tracking-tight">บัญชีธนาคาร</h1>
      </header>

      <div className="flex-1 px-5 py-8 pb-32 max-w-md mx-auto w-full">

        {/* ── Premium Bank Card ── */}
        <div
          className="relative w-full rounded-[28px] overflow-hidden shadow-2xl"
          style={{ aspectRatio: '1.586 / 1', background: `linear-gradient(135deg, ${bankColor.bg}ee 0%, ${bankColor.bg} 100%)` }}
        >
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-white/10 blur-sm" />
          <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/10 blur-sm" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5" />

          {/* Chip pattern */}
          <div className="absolute left-6 top-[38%] w-9 h-7 rounded-md border-2 opacity-40"
               style={{ borderColor: bankColor.text + '80' }}>
            <div className="absolute inset-x-0 top-1/2 h-px" style={{ background: bankColor.text + '60' }} />
            <div className="absolute inset-y-0 left-1/3 w-px" style={{ background: bankColor.text + '60' }} />
          </div>

          {/* Card Content */}
          <div className="relative z-10 h-full flex flex-col justify-between p-6" style={{ color: bankColor.text }}>

            {/* Top row — bank logo + DEBIT label */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {bankInfo?.image_url ? (
                  <div className="size-11 rounded-xl bg-white shadow-lg flex items-center justify-center overflow-hidden p-1 shrink-0">
                    <img
                      src={bankInfo.image_url}
                      alt={bankInfo.name}
                      className="w-full h-full object-contain"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="size-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
                    <span className="font-extrabold text-sm tracking-tight" style={{ color: bankColor.text }}>
                      {bankCode.slice(0, 3)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">BANK</p>
                  <p className="font-bold text-sm leading-tight truncate max-w-[150px]">
                    {bankInfo?.name || bankCode || 'ไม่ระบุธนาคาร'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 mt-0.5">
                <span className="text-[10px] font-extrabold tracking-[0.3em] uppercase opacity-40">DEBIT</span>
                <div className="flex gap-0.5">
                  <div className="w-4 h-4 rounded-full bg-white/30" />
                  <div className="w-4 h-4 rounded-full bg-white/20 -ml-2" />
                </div>
              </div>
            </div>

            {/* Account Number */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50 mb-1">ACCOUNT NO.</p>
              <p className="tabular-nums text-[1.2rem] font-bold tracking-[0.22em]">
                {maskAccountNumber(profile?.bank_account_number)}
              </p>
            </div>

            {/* Bottom row */}
            <div className="flex items-end justify-between">
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50 mb-0.5">ACCOUNT HOLDER</p>
                <p className="font-bold text-sm truncate max-w-[160px]">
                  {profile?.full_name || '—'}
                </p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50 mb-0.5">MEMBER SINCE</p>
                <p className="font-bold text-sm">{memberDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bank Info Detail ── */}
        <div className="mt-6 bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
            <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                 style={{ background: bankColor.bg + '15' }}>
              {bankInfo?.image_url ? (
                <img src={bankInfo.image_url} alt="" className="size-7 object-contain" />
              ) : (
                <span className="material-symbols-outlined text-[18px]" style={{ color: bankColor.bg }}>account_balance</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ธนาคาร</p>
              <p className="font-extrabold text-slate-900 text-sm truncate">{bankInfo?.name || bankCode || '—'}</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: bankColor.bg + '15', color: bankColor.bg }}>
              {bankCode}
            </span>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
            <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">credit_card</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">เลขที่บัญชี</p>
              <p className="font-extrabold text-slate-900 text-sm tabular-nums tracking-wider">
                {profile?.bank_account_number || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4 border-b border-slate-50">
            <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ชื่อบัญชี</p>
              <p className="font-extrabold text-slate-900 text-sm">{profile?.full_name || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 px-5 py-4">
            <div className="size-10 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">สถานะ</p>
              <p className="font-extrabold text-emerald-600 text-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                ยืนยันแล้ว
              </p>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="mt-5 bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <span className="material-symbols-outlined text-amber-500 text-[18px] mt-0.5 shrink-0">info</span>
          <p className="text-xs text-amber-700 leading-relaxed">
            หากต้องการเปลี่ยนแปลงข้อมูลบัญชีธนาคาร กรุณาติดต่อเจ้าหน้าที่ผ่านช่องทางสนับสนุน
          </p>
        </div>

        <button
          onClick={() => navigate('/support')}
          className="mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-full border border-slate-200 bg-white text-slate-700 font-bold text-sm active:scale-[0.98] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">contact_support</span>
          ติดต่อเจ้าหน้าที่
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default BankAccount;
