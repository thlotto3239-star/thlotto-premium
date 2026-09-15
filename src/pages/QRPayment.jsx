import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { supabase } from '../supabaseClient';
import BankBadge from '../components/BankBadge';
import { useModal } from '../contexts/ModalContext';

const TOTAL_SECONDS = 15 * 60; // 15 นาที

const QRPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSuccess } = useModal();

  const amount = location.state?.amount || 0;
  const promoCode = location.state?.promoCode || null;
  const promoName = location.state?.promoName || null;
  const passedBank = location.state?.bank || null;
  const isPromo = !!promoCode || !!location.state?.isPromo;

  const [bankInfo, setBankInfo] = useState({
    bank_code: passedBank?.bank_code || 'KBANK',
    account_name: passedBank?.account_name || 'บจก. ทีเอช ล็อตโต้ กรุ๊ป',
    account_number: passedBank?.account_number || passedBank?.account_no || '098-2-54321-0',
    promptpay_id: passedBank?.promptpay_id || (passedBank?.account_number || '0982543210').replace(/[^\d]/g, ''),
  });

  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchBankSettings = async () => {
      if (passedBank && passedBank.account_number) {
        setBankInfo({
          bank_code: passedBank.bank_code || 'KBANK',
          account_name: passedBank.account_name || 'บจก. ทีเอช ล็อตโต้ กรุ๊ป',
          account_number: passedBank.account_number || passedBank.account_no || '',
          promptpay_id: passedBank.promptpay_id || (passedBank.account_number || '').replace(/[^\d]/g, ''),
        });
        return;
      }

      try {
        const { data: setRows } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'company_bank_code',
            'company_bank_account_number',
            'company_bank_account_name',
            'bank_account_name',
            'bank_qr_url'
          ]);

        if (setRows && setRows.length > 0) {
          const map = {};
          setRows.forEach(s => { map[s.key] = s.value; });
          if (map.company_bank_account_number) {
            setBankInfo({
              bank_code: map.company_bank_code || 'KBANK',
              account_name: map.company_bank_account_name || map.bank_account_name || 'บจก. ทีเอช ล็อตโต้ กรุ๊ป',
              account_number: map.company_bank_account_number,
              promptpay_id: map.company_bank_account_number.replace(/[^\d]/g, ''),
            });
          }
        }
      } catch (e) {
        console.warn('Could not load company bank settings:', e);
      }
    };

    fetchBankSettings();
  }, [passedBank]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          navigate('/deposit');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const seconds = (secondsLeft % 60).toString().padStart(2, '0');
  const dashOffset = Math.round(326 * (1 - secondsLeft / TOTAL_SECONDS));

  const handleCopy = (textToCopy, label = 'คัดลอกแล้ว') => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showSuccess(label, textToCopy);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadSlip = () => {
    navigate('/upload-slip', {
      state: {
        amount,
        promoCode,
        promoName,
        bank: bankInfo,
        isPromo,
      }
    });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                {isPromo ? 'โอนเงินเข้าบัญชีธนาคาร' : 'สแกน QR ชำระเงิน'}
              </h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">
                {isPromo
                  ? 'ขั้นตอนการฝากเงินพร้อมรับโปรโมชั่นพิเศษผ่านบัญชีธนาคารบริษัท'
                  : 'ระบบรับชำระเงินอัตโนมัติผ่าน พร้อมเพย์ (PromptPay)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            <span className="text-xs uppercase font-black tracking-wider text-primary">TH-LOTTO Premium</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Order Summary & Guide */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Alert Card if active */}
            {isPromo && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-brand-50 to-emerald-50 border border-brand-200 rounded-3xl p-5 shadow-xs">
                <div className="size-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-brand-700 font-black text-xs uppercase tracking-wider">โปรโมชั่นที่เลือก</p>
                  <p className="text-slate-900 text-sm sm:text-base font-black truncate">{promoName || promoCode}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">โอนเข้าบัญชีบริษัทด้านล่างเพื่อรับโบนัส</p>
                </div>
              </div>
            )}

            {/* Amount Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm relative overflow-hidden">
              <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">ยอดชำระที่ต้องโอน</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                ฿{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>ประเภทการชำระ</span>
                <span className="text-slate-900 font-black">
                  {isPromo ? 'โอนผ่านบัญชีธนาคาร (รับโปรโมชั่น)' : 'พร้อมเพย์ คิวอาร์โค้ด (ฝากปกติ)'}
                </span>
              </div>
            </div>

            {/* Bank / Account Info Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {isPromo ? 'บัญชีธนาคารรับโอนของบริษัท' : 'ข้อมูล PromptPay รับชำระ'}
                </h3>
                <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60">
                  ตรวจสอบถูกต้อง
                </span>
              </div>

              {isPromo ? (
                /* Promo: Bank Account Info */
                <div className="space-y-3">
                  <BankBadge
                    code={bankInfo.bank_code || 'KBANK'}
                    accountName={bankInfo.account_name}
                    size="lg"
                  />
                  <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">เลขที่บัญชีธนาคาร</p>
                      <p className="text-base sm:text-lg font-black font-mono tracking-wider text-slate-900">
                        {bankInfo.account_number}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankInfo.account_number, 'คัดลอกเลขบัญชีแล้ว')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 font-bold text-xs active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      คัดลอก
                    </button>
                  </div>
                </div>
              ) : (
                /* Normal: PromptPay Account Info */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold">PromptPay ID</p>
                        <p className="text-base sm:text-lg font-black font-mono text-slate-900">
                          {bankInfo.promptpay_id || '—'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(bankInfo.promptpay_id, 'คัดลอกหมายเลข PromptPay แล้ว')}
                      className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/70 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                      {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                    </button>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">ชื่อบัญชีรับโอน</span>
                    <span className="text-xs sm:text-sm font-black text-slate-900">{bankInfo.account_name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Step Guide */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">ขั้นตอนการทำรายการ</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'เปิดแอปพลิเคชันธนาคาร', desc: 'เปิดแอปธนาคารบนโทรศัพท์มือถือของคุณ' },
                  { step: '2', title: isPromo ? 'โอนเงินเข้าเลขบัญชีบริษัท' : 'สแกน QR Code หรือ PromptPay', desc: isPromo ? 'โอนเงินตามยอดที่ระบุเข้าบัญชีธนาคารด้านบน' : 'สแกนคิวอาร์โค้ดเพื่อชำระเงินตามยอด' },
                  { step: '3', title: 'กด "แนบสลิปโอนเงิน"', desc: 'อัปโหลดหลักฐานการโอนเพื่อให้แอดมินและระบบอนุมัติยอดทันที' }
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900">{s.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: QR Code or Bank Card & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/70 shadow-sm flex flex-col items-center text-center">
              
              {isPromo ? (
                /* ════ PROMO MODE: Large Bank Card Display ════ */
                <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl mb-6 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-widest text-emerald-400">บัญชีสำหรับฝากรับโปรโมชั่น</span>
                    </div>
                    <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full text-slate-200 backdrop-blur-sm">
                      {bankInfo.bank_code || 'KBANK'}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">เลขที่บัญชีธนาคาร</p>
                      <div className="flex items-center justify-between gap-3 bg-white/10 p-3.5 rounded-2xl border border-white/10">
                        <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-emerald-300">
                          {bankInfo.account_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(bankInfo.account_number, 'คัดลอกเลขบัญชีแล้ว')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md shrink-0 cursor-pointer"
                        >
                          คัดลอก
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs">
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">ชื่อบัญชี</p>
                        <p className="font-extrabold text-white truncate">{bankInfo.account_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-bold mb-0.5">ยอดที่ต้องโอน</p>
                        <p className="font-black text-emerald-400 text-sm font-mono">฿{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ════ NORMAL MODE: PromptPay QR Code Display ════ */
                <div className="relative w-full max-w-[300px] aspect-square p-5 rounded-3xl bg-white border-2 border-slate-100 shadow-xl mb-6">
                  <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                    {bankInfo.promptpay_id ? (
                      <img
                        alt="Payment QR Code"
                        className="w-full h-auto"
                        src={`https://promptpay.io/${bankInfo.promptpay_id}/${amount}.png`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-7xl">qr_code_2</span>
                      </div>
                    )}
                    <div className="absolute left-0 right-0 h-0.5 bg-primary/40 top-0 animate-scan"></div>
                  </div>
                </div>
              )}

              {/* Countdown Timer (ทั้งสองแบบจับเวลาเหมือนกัน) */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="absolute w-full h-full -rotate-90">
                    <circle className="text-slate-100" cx="48" cy="48" fill="transparent" r="42" stroke="currentColor" strokeWidth="5" />
                    <circle
                      className={secondsLeft > 60 ? 'text-primary' : 'text-rose-500'}
                      cx="48" cy="48" fill="transparent" r="42"
                      stroke="currentColor"
                      strokeDasharray="264"
                      strokeDashoffset={dashOffset * 0.81}
                      strokeLinecap="round"
                      strokeWidth="5"
                    />
                  </svg>
                  <div className="text-center z-10">
                    <p className="text-[10px] uppercase text-slate-400 font-black tracking-wider">เหลือเวลา</p>
                    <p className={`text-xl font-black font-mono ${secondsLeft <= 60 ? 'text-rose-500' : 'text-slate-900'}`}>
                      {minutes}:{seconds}
                    </p>
                  </div>
                </div>
                {secondsLeft === 0 ? (
                  <p className="text-xs text-rose-500 font-black">หมดเวลาทำรายการ กรุณาสร้างรายการใหม่</p>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">กรุณาโอนเงินและแนบสลิปก่อนหมดเวลา</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-md space-y-3">
                <button
                  onClick={handleUploadSlip}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                  style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2db340 100%)' }}
                >
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                  แนบสลิปโอนเงิน (ยืนยันยอด)
                </button>
                {isPromo ? (
                  <button
                    onClick={() => handleCopy(bankInfo.account_number, 'คัดลอกเลขบัญชีแล้ว')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 font-bold text-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'content_copy'}</span>
                    {copied ? 'คัดลอกเลขบัญชีแล้ว' : 'คัดลอกเลขบัญชีธนาคาร'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCopy(bankInfo.promptpay_id, 'คัดลอกหมายเลข PromptPay แล้ว')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 font-bold text-sm transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'content_copy'}</span>
                    {copied ? 'คัดลอกหมายเลข PromptPay แล้ว' : 'คัดลอกหมายเลข PromptPay'}
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default QRPayment;
