import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { supabase } from '../supabaseClient';

const TOTAL_SECONDS = 15 * 60; // 15 นาที

const QRPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const amount = location.state?.amount || 0;

  const [settings, setSettings] = useState({
    promptpay: '',
    accountName: 'บจก. ทีเอช-ลอตโต พรีเมียม',
  });
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['company_promptpay_number', 'company_bank_account_name']);
      if (data) {
        const map = {};
        data.forEach(r => { map[r.key] = r.value; });
        setSettings({
          promptpay: map['company_promptpay_number'] || '',
          accountName: map['company_bank_account_name'] || 'บจก. ทีเอช-ลอตโต พรีเมียม',
        });
      }
    };
    fetchSettings();
  }, []);

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

  const handleCopy = () => {
    if (!settings.promptpay) return;
    navigator.clipboard.writeText(settings.promptpay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUploadSlip = () => {
    navigate('/upload-slip', { state: { amount } });
  };

  return (
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">สแกน QR ชำระเงิน</h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">ระบบรับชำระเงินอัตโนมัติผ่าน พร้อมเพย์ (PromptPay)</p>
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
            {/* Amount Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm relative overflow-hidden">
              <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">ยอดชำระที่ต้องโอน</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                ฿{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>ประเภทการชำระ</span>
                <span className="text-slate-900">พร้อมเพย์ คิวอาร์โค้ด</span>
              </div>
            </div>

            {/* PromptPay Account Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">PromptPay ID</p>
                    <p className="text-base sm:text-lg font-black font-mono text-slate-900">
                      {settings.promptpay || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/70 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">{copied ? 'check' : 'content_copy'}</span>
                  {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold">ชื่อบัญชีรับโอน</span>
                <span className="text-xs sm:text-sm font-black text-slate-900">{settings.accountName}</span>
              </div>
            </div>

            {/* Step Guide */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">ขั้นตอนการชำระเงิน</h3>
              <div className="space-y-3">
                {[
                  { step: '1', title: 'เปิดแอปพลิเคชันธนาคาร', desc: 'เปิดแอปธนาคารบนโทรศัพท์มือถือเครื่องใดก็ได้' },
                  { step: '2', title: 'สแกน QR Code หรือ PromptPay', desc: 'สแกนคิวอาร์โค้ดหรือโอนเงินผ่านหมายเลข PromptPay' },
                  { step: '3', title: 'กด "แนบสลิปโอนเงิน"', desc: 'อัปโหลดหลักฐานการโอนเพื่อให้ระบบตรวจสอบยอดอัตโนมัติ' }
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

          {/* Right Column: QR Code & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/70 shadow-sm flex flex-col items-center text-center">
              {/* QR Code Container */}
              <div className="relative w-full max-w-[300px] aspect-square p-5 rounded-3xl bg-white border-2 border-slate-100 shadow-xl mb-6">
                <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                  {settings.promptpay ? (
                    <img
                      alt="Payment QR Code"
                      className="w-full h-auto"
                      src={`https://promptpay.io/${settings.promptpay}/${amount}.png`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <span className="material-symbols-outlined text-7xl">qr_code_2</span>
                    </div>
                  )}
                  <div className="absolute left-0 right-0 h-0.5 bg-primary/40 top-0 animate-scan"></div>
                </div>
              </div>

              {/* Countdown Timer */}
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
                  <p className="text-xs text-rose-500 font-black">คิวอาร์หมดอายุแล้ว กรุณาสร้างรายการใหม่</p>
                ) : (
                  <p className="text-xs text-slate-400 font-bold">กรุณาชำระเงินและแนบสลิปก่อนหมดเวลา</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="w-full max-w-md space-y-3">
                <button
                  onClick={handleUploadSlip}
                  className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl text-white font-black text-base shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all"
                  style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2db340 100%)' }}
                >
                  <span className="material-symbols-outlined text-2xl">upload_file</span>
                  แนบสลิปโอนเงิน (ยืนยันยอด)
                </button>
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70 font-bold text-sm transition-all"
                >
                  <span className="material-symbols-outlined text-lg">{copied ? 'check_circle' : 'content_copy'}</span>
                  {copied ? 'คัดลอกหมายเลข PromptPay แล้ว' : 'คัดลอกหมายเลข PromptPay'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default QRPayment;
