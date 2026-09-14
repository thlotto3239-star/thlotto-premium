import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useModal } from '../contexts/ModalContext';
import BankBadge from '../components/BankBadge';

const Deposit = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showError, showSuccess } = useModal();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState(() => searchParams.get('amount') || '');
  const promoCode = searchParams.get('promo') || null;
  const promoName = searchParams.get('promoName') || null;
  const isPromoDeposit = !!promoCode;
  const [minDeposit, setMinDeposit] = useState(100);
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [companyBanks, setCompanyBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState({
    bank_code: 'KBANK',
    account_name: 'บจก. ทีเอช ล็อตโต้ กรุ๊ป',
    account_number: '098-2-54321-0',
    promptpay_id: '0982543210',
  });

  useEffect(() => {
    const fetchBankData = async () => {
      try {
        // 1. Fetch active company bank accounts with fallback to settings
        let { data: cBanks } = await supabase
          .from('company_bank_accounts')
          .select('*')
          .eq('is_active', true)
          .order('id');

        if (!cBanks || cBanks.length === 0) {
          const { data: setRows } = await supabase
            .from('settings')
            .select('key, value')
            .in('key', ['company_bank_code', 'company_bank_account_number', 'company_bank_account_name', 'bank_account_name', 'bank_qr_url']);
          
          if (setRows && setRows.length > 0) {
            const map = {};
            setRows.forEach(s => { map[s.key] = s.value; });
            if (map.company_bank_account_number) {
              cBanks = [{
                id: 1,
                bank_code: map.company_bank_code || 'KBANK',
                account_name: map.company_bank_account_name || map.bank_account_name || 'บริษัท ทีเอช ล็อตโต้ จำกัด',
                account_number: map.company_bank_account_number,
                promptpay_id: map.company_bank_account_number.replace(/[^\d]/g, ''),
                qr_code_url: map.bank_qr_url || '',
                is_active: true,
              }];
            }
          }
        }

        if (cBanks && cBanks.length > 0) {
          const formatted = cBanks.map(b => ({
            ...b,
            account_number: b.account_number || b.account_no || '',
            promptpay_id: b.promptpay_id || (b.account_number || b.account_no || '').replace(/[^\d]/g, ''),
          }));
          setCompanyBanks(formatted);
          setSelectedBank(formatted[0]);
        }

        // 2. Fetch min deposit from system_settings
        const { data: sysData } = await supabase
          .from('system_settings')
          .select('min_deposit, maintenance_mode')
          .maybeSingle();

        if (sysData) {
          if (sysData.min_deposit) setMinDeposit(Number(sysData.min_deposit));
          if (sysData.maintenance_mode !== undefined) {
            setDepositEnabled(!sysData.maintenance_mode);
          }
        }
      } catch (err) {
        console.warn('Error fetching deposit settings:', err);
      }
    };
    fetchBankData();
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
    if (profile && (!profile.phone || !profile.bank_account_number)) {
      showError(
        'ข้อมูลบัญชีไม่สมบูรณ์',
        'กรุณาระบุหมายเลขโทรศัพท์และบัญชีธนาคารให้ครบถ้วนก่อนทำรายการฝากเงิน',
        () => navigate('/edit-profile')
      );
      return;
    }
    if (isPromoDeposit) {
      navigate('/upload-slip', { state: { amount, promoCode, promoName, bank: selectedBank } });
    } else {
      navigate('/qr-payment', { state: { amount, bank: selectedBank } });
    }
  };

  const isProceedDisabled = !depositEnabled || !amount || parseFloat(amount) < minDeposit;

  return (
    <div className="bg-slate-50/50 min-h-screen text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="size-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all border border-slate-200/60 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">ฝากเงินเข้าระบบ</h1>
          <div className="size-10"></div>
        </div>
      </header>

      {/* Main Container — Desktop 2-Column Split Console */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-36 lg:pb-12 space-y-6">
        
        {/* Onboarding Notice if Profile Incomplete */}
        {profile && (!profile.phone || !profile.bank_account_number) && (
          <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-amber-900">กรุณาตั้งค่าเบอร์โทรและบัญชีธนาคาร</p>
                <p className="text-xs text-amber-700 font-medium">เพื่อความปลอดภัยและเปิดสิทธิ์การทำธุรกรรมฝาก-ถอน</p>
              </div>
            </div>
            <Link
              to="/edit-profile"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              ตั้งค่าตอนนี้
            </Link>
          </div>
        )}

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Bank Details & Info ════ */}
          <div className="lg:col-span-5 space-y-5">
            {/* Promo Banner if active */}
            {isPromoDeposit && (
              <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-3xl p-4">
                <span className="material-symbols-outlined text-brand-600 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                <div className="flex-1 min-w-0">
                  <p className="text-brand-700 font-black text-xs uppercase tracking-wider">ฝากพร้อมโปรโมชั่น</p>
                  <p className="text-slate-800 text-sm font-extrabold truncate">{promoName || promoCode}</p>
                </div>
                <span className="text-xs font-bold bg-brand-600 text-white px-2.5 py-1 rounded-full uppercase">Active</span>
              </div>
            )}

            {/* Bank Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">บัญชีธนาคารสำหรับโอนเงิน</h3>
                {companyBanks.length > 1 && (
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                    เลือกบัญชีโอน
                  </span>
                )}
              </div>

              {/* Multi-account Switcher Tabs if multiple accounts */}
              {companyBanks.length > 1 && (
                <div className="flex gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60">
                  {companyBanks.map((b) => {
                    const isSelected = selectedBank?.id === b.id || selectedBank?.bank_code === b.bank_code;
                    const isKBank = b.bank_code === 'KBANK';
                    return (
                      <button
                        key={b.id || b.bank_code}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-xs font-black ring-1 ring-slate-200'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                        }`}
                      >
                        <span
                          className="size-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: isKBank ? '#138f2d' : '#4e2a84' }}
                        ></span>
                        <span>{b.bank_code}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <BankBadge
                code={selectedBank?.bank_code || 'KBANK'}
                accountName={selectedBank?.account_name || 'บจก. ทีเอช ล็อตโต้ กรุ๊ป'}
                size="lg"
              />
              <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-0.5">เลขที่บัญชี</p>
                  <p className="text-base sm:text-lg font-black font-mono tracking-wider text-slate-800">
                    {selectedBank?.account_number || '098-2-54321-0'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedBank?.account_number) {
                      navigator.clipboard.writeText(selectedBank.account_number);
                      showSuccess('คัดลอกเลขบัญชีแล้ว', selectedBank.account_number);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 font-bold text-xs active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">content_copy</span>
                  คัดลอก
                </button>
              </div>
            </div>

            {/* Instruction Guidelines Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-brand-600 text-sm">shield_check</span>
                ข้อควรทราบในการฝากเงิน
              </h4>
              <ul className="text-xs text-slate-500 space-y-2 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold">•</span>
                  <span>ต้องใช้บัญชีธนาคารที่ลงทะเบียนไว้เท่านั้นในการโอนเงิน</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold">•</span>
                  <span>ยอดเงินจะเข้ากระเป๋าอัตโนมัติภายใน 1-3 นาที</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-brand-600 font-bold">•</span>
                  <span>ฝากขั้นต่ำ {minDeposit.toLocaleString()} บาท</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Amount Entry, Chips & Action Button ════ */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            
            {!depositEnabled && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-bold">
                <span className="material-symbols-outlined text-amber-600 text-lg">error</span>
                <span>ระบบปิดรับฝากเงินชั่วคราว อยู่ระหว่างการปรับปรุงระบบการเงิน</span>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="block text-center text-slate-900 font-black text-base sm:text-lg mb-4">
                ระบุจำนวนเงินที่ต้องการฝาก
              </label>
              <div className="relative bg-slate-50 rounded-3xl p-6 border border-slate-200 focus-within:border-brand-500 focus-within:bg-white transition-all">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-brand-600">฿</span>
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
            </div>

            {/* Quick Amount Chips */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-3 text-center sm:text-left">เลือกจำนวนเงินด่วน</p>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuickAmount(q)}
                    className="flex h-11 sm:h-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    +{Number(q).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Info */}
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>ขั้นต่ำการฝากเงิน {minDeposit.toLocaleString()} บาท</span>
            </div>

            {/* Desktop Direct Action Button (Inside card on PC) */}
            <div className="hidden lg:block pt-4 border-t border-slate-100">
              <button
                onClick={handleProceed}
                disabled={isProceedDisabled}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white text-base font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer bg-brand-600 hover:bg-brand-700 active:scale-[0.99]"
              >
                <span>ถัดไป (ชำระเงิน)</span>
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </button>
            </div>

          </div>

        </div>

      </main>

      {/* Mobile Fixed Footer Button (Hidden on PC) */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-40">
        <button
          onClick={handleProceed}
          disabled={isProceedDisabled}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white text-base font-black active:scale-[0.98] transition-all disabled:opacity-40 shadow-md cursor-pointer bg-brand-600"
        >
          <span>ถัดไป</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};

export default Deposit;
