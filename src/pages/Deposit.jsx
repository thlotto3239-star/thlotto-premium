import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import BankBadge from '../components/BankBadge';
import PageWrapper from '../components/PageWrapper';
import AppHeader from '../components/AppHeader';

const Deposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();
  const promoCode = searchParams.get('promo');
  const promoName = searchParams.get('promoName');
  const initialAmount = searchParams.get('amount') || '';
  const isPromoDeposit = !!promoCode;

  const [amount, setAmount] = useState(initialAmount);
  const [minDeposit, setMinDeposit] = useState(100);
  const [bankSettings, setBankSettings] = useState({
    bank_name: 'ธนาคารกสิกรไทย',
    bank_code: 'KBANK',
    bank_account_name: 'บจก. ทีเอช ล็อตโต้ พรีเมียม',
    bank_account_number: '123-4-56789-0',
  });

  useEffect(() => {
    const fetchBankSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['company_bank_name', 'company_bank_code', 'company_bank_account_name', 'company_bank_account_number', 'min_deposit']);
      if (data && data.length > 0) {
        const map = {};
        data.forEach(item => { map[item.key] = item.value; });
        setBankSettings(prev => ({
          bank_name: map['company_bank_name'] || prev.bank_name,
          bank_code: map['company_bank_code'] || prev.bank_code,
          bank_account_name: map['company_bank_account_name'] || prev.bank_account_name,
          bank_account_number: map['company_bank_account_number'] || prev.bank_account_number,
        }));
        if (map['min_deposit']) setMinDeposit(Number(map['min_deposit']));
      }
    };
    fetchBankSettings();
  }, [searchParams]);

  const quickAmounts = promoCode ? ['300', '500', '1000', '5000'] : ['100', '500', '1000', '5000'];

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(val);
  };

  const handleQuickAmount = (val) => {
    setAmount(prev => {
      const current = parseFloat(prev || '0');
      const add = parseFloat(val);
      return (current + add).toString();
    });
  };

  const handleProceed = () => {
    if (!amount || parseFloat(amount) < minDeposit) return;
    if (isPromoDeposit) {
      navigate('/upload-slip', { state: { amount, promoCode, promoName } });
    } else {
      navigate('/qr-payment', { state: { amount } });
    }
  };

  return (
    <PageWrapper>
      <AppHeader />

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
                <span>ฝากเงินเข้าสู่ระบบ</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  AUTO 15s
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">ระบบฝากเงินอัตโนมัติ 24 ชม. ไม่ต้องรอเจ้าหน้าที่</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Section Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ SECTION 1 (Left 4 Cols on PC): Balance & Company Bank ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* User Balance Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ยอดเงินคงเหลือปัจจุบัน</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-emerald-700">฿</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                  {Number(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Company Bank Account Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                บัญชีรับฝากของบริษัท
              </h3>
              <BankBadge
                code={bankSettings.bank_code}
                accountName={bankSettings.bank_account_name}
                size="lg"
              />
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">เลขที่บัญชี</p>
                  <p className="text-base font-extrabold font-mono text-slate-900 tracking-wider">
                    {bankSettings.bank_account_number}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(bankSettings.bank_account_number)}
                  className="px-3.5 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 font-bold text-xs hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  คัดลอก
                </button>
              </div>
            </div>

            {/* SLA Guarantee */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-950">ปรับยอดอัตโนมัติภายใน 15 วินาที</h4>
                <p className="text-[11px] text-emerald-700 font-medium">สแกน QR ผ่านโมบายแบงก์กิ้งได้ทุกธนาคาร</p>
              </div>
            </div>
          </aside>

          {/* ════ SECTION 2 (Center 5 Cols on PC): Amount Entry & Actions ════ */}
          <main className="lg:col-span-8 xl:col-span-5 space-y-5">
            {/* Promo Notification */}
            {isPromoDeposit && (
              <div className="flex items-center gap-3 bg-emerald-50/80 border border-emerald-200 rounded-3xl p-4.5">
                <span className="material-symbols-outlined text-emerald-700 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-900 font-extrabold text-xs">ฝากพร้อมโปรโมชั่นพิเศษ</p>
                  <p className="text-emerald-700 text-xs font-semibold truncate">{promoName || promoCode}</p>
                </div>
                <span className="text-[10px] font-black bg-emerald-700 text-white px-2.5 py-0.5 rounded-full uppercase">Active</span>
              </div>
            )}

            {/* Amount Entry Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <p className="text-slate-800 font-extrabold text-base">ระบุจำนวนเงินที่ต้องการฝาก</p>
              
              <div className="relative bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-black text-emerald-700">฿</span>
                  <input
                    className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black font-mono text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-300"
                    inputMode="decimal"
                    placeholder="0.00"
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                  />
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickAmount(q)}
                    className="h-11 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-xs hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    +{Number(q).toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium pt-1">
                <span className="material-symbols-outlined text-sm">info</span>
                <span>ขั้นต่ำการฝาก {minDeposit.toLocaleString()} บาท</span>
              </div>

              {/* Next Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleProceed}
                  disabled={!amount || parseFloat(amount) < minDeposit}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white text-base font-extrabold active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600"
                >
                  <span>ถัดไป: สร้าง QR Code ชำระเงิน</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </main>

          {/* ════ SECTION 3 (Right 3 Cols on PC): Instructions & Guidelines ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* 3 Simple Steps */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                ขั้นตอนการฝากเงิน
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">1</span>
                  <p>ระบุจำนวนเงินที่ต้องการฝาก แล้วกดปุ่ม <strong>ถัดไป</strong></p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">2</span>
                  <p>สแกน QR Code ผ่านแอปธนาคารของท่าน หรือโอนไปยังเลขบัญชีที่แสดง</p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="size-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs shrink-0">3</span>
                  <p>ระบบตรวจจับสลิปอัตโนมัติและปรับยอดเงินเข้ากระเป๋าทันที</p>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50/60 rounded-3xl p-4.5 border border-amber-200/80 text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-extrabold text-xs">
                <span className="material-symbols-outlined text-sm text-amber-700">warning</span>
                <span>ข้อควรระวังสำคัญ</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                กรุณาใช้บัญชีธนาคารที่ลงทะเบียนไว้กับ TH-LOTTO เท่านั้น ห้ามใช้บัญชีบุคคลอื่นโอนเด็ดขาด เพื่อความรวดเร็วในการปรับยอดอัตโนมัติ
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Deposit;
