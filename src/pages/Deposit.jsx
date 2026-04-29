import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Deposit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [amount, setAmount] = useState('');
  const promoCode = searchParams.get('promo') || null;
  const promoName = searchParams.get('promoName') || null;
  const isPromoDeposit = !!promoCode;
  const [minDeposit, setMinDeposit] = useState(100);
  const [bankSettings, setBankSettings] = useState({
    bank_name: 'ธนาคารกสิกรไทย (KBank)',
    bank_account_name: 'บจก. ทีเอช-ลอตโต พรีเมียม',
    bank_account_number: '123-x-xxxxx-x',
  });

  useEffect(() => {
    const amountParam = searchParams.get('amount');
    if (amountParam) {
      setAmount(amountParam);
    }

    const fetchBankSettings = async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['company_bank_name', 'company_bank_account_name', 'company_bank_account_number', 'min_deposit']);
      if (data && !error) {
        const map = {};
        data.forEach(row => { map[row.key] = row.value; });
        setBankSettings(prev => ({
          bank_name: map['company_bank_name'] || prev.bank_name,
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
    // allow only numbers and decimals
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

  return (
    <div className="bg-white min-h-screen text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors text-[#b08d57]"
        >
          <span className="material-symbols-outlined text-3xl font-bold">chevron_left</span>
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex-1 text-center pr-10">ฝากเงิน</h1>
      </header>

      <main className="flex-1 px-6 pt-6 pb-36">
        {/* Promo Banner */}
        {isPromoDeposit && (
          <div className="mb-6 flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4">
            <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
            <div className="flex-1">
              <p className="text-primary font-extrabold text-sm">ฝากพร้อมโปรโมชั่น</p>
              <p className="text-slate-600 text-xs font-medium">{promoName || promoCode}</p>
            </div>
            <span className="text-[10px] font-bold bg-primary text-white px-3 py-1 rounded-full uppercase tracking-wide">Active</span>
          </div>
        )}

        {/* Bank Details Card — แสดงเฉพาะเมื่อฝากพร้อมโปร */}
        {isPromoDeposit &&
        <section className="mb-8">
          <div className="bg-white rounded-[1.75rem] p-6 border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/5">
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBMSZQCiTuQu46dtDzVAhRus0mqsbN2OZw2_LsG1Vk_bj2FF4sQb3MX6sUssTtvQWaCQrMLg4yKJsgUK_rnzrdKy8QeOn6P8he1RSOV2F7rl04oiygOOO9W2xLPMKmlbixcovuYMxfOeJUMb5_sFmyzDUYE9eGwbUf_RZF8ouTXZcMVTZ0srXABJ7hlZ7hJIfDPrc2lsJVaw2Eaqab_Wbh_U7_o5We8yu-f5OqrVIiNCM2HqjLjbobOo8BdR9-v7XKGQQgfc1WQSQ')" }}
                ></div>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">{bankSettings.bank_name}</p>
                <p className="text-slate-900 text-base font-extrabold leading-tight">{bankSettings.bank_account_name}</p>
              </div>
            </div>
            <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">เลขที่บัญชี</p>
                <p className="text-lg font-extrabold font-body tabular-nums tracking-wider text-slate-800">{bankSettings.bank_account_number}</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(bankSettings.bank_account_number)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#b08d57]/30 text-[#b08d57] font-bold text-sm active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">content_copy</span>
                คัดลอก
              </button>
            </div>
          </div>
        </section>}

        {/* Amount Entry */}
        <section className="mb-8">
          <p className="text-center text-slate-900 font-extrabold text-lg mb-5">ระบุจำนวนเงินที่ต้องการฝาก</p>
          <div className="relative bg-white rounded-[1.75rem] p-7 border border-slate-100 focus-within:border-primary/30 transition-all" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-extrabold text-primary">฿</span>
              <input
                className="w-full bg-transparent text-center text-5xl font-extrabold text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-200"
                inputMode="decimal"
                placeholder="0.00"
                type="text"
                value={amount}
                onChange={handleAmountChange}
              />
            </div>
          </div>
        </section>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {quickAmounts.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickAmount(q)}
              className="flex h-12 items-center justify-center rounded-full bg-white border border-primary text-primary font-bold text-sm hover:bg-primary hover:text-white active:scale-95 transition-all"
            >
              +{Number(q).toLocaleString()}
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-2 text-slate-400">
          <span className="material-symbols-outlined text-base">info</span>
          <p className="text-xs font-medium">ขั้นต่ำการฝาก {minDeposit.toLocaleString()} บาท</p>
        </div>
      </main>

      {/* Footer Button */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-lg border-t border-slate-100">
        <button
          onClick={() => {
            if (isPromoDeposit) {
              navigate('/upload-slip', { state: { amount, promoCode, promoName } });
            } else {
              navigate('/qr-payment', { state: { amount } });
            }
          }}
          disabled={!amount || parseFloat(amount) < minDeposit}
          className="w-full h-16 rounded-full flex items-center justify-center gap-3 text-white text-lg font-extrabold active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2db340 100%)' }}
        >
          ถัดไป
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </footer>
    </div>
  );
};

export default Deposit;
