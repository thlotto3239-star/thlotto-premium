import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
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
    <div className="bg-white text-slate-900 min-h-screen flex flex-col max-w-[430px] mx-auto overflow-x-hidden border-x border-slate-100">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5 sticky top-0 bg-white z-50 border-b border-slate-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-700">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight text-slate-800">สแกน QR ชำระเงิน</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pb-32 flex flex-col items-center">
        {/* Branding */}
        <div className="mt-6 mb-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="text-[11px] uppercase font-bold tracking-widest text-primary">TH-LOTTO Premium</span>
        </div>

        {/* Amount */}
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm mb-1 font-medium">ยอดชำระทั้งหมด</p>
          <h2 className="text-5xl font-extrabold text-slate-900 tracking-tight">
            ฿{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
        </div>

        {/* QR Code */}
        <div className="relative w-full max-w-[280px] aspect-square mb-8 p-4 rounded-[2.5rem] bg-white border border-slate-100 shadow-xl">
          <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
            {settings.promptpay ? (
              <img
                alt="Payment QR Code"
                className="w-full h-auto"
                src={`https://promptpay.io/${settings.promptpay}/${amount}.png`}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-6xl">qr_code_2</span>
              </div>
            )}
            <div className="absolute left-0 right-0 h-0.5 bg-primary/30 top-0 animate-scan"></div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="absolute w-full h-full -rotate-90">
              <circle className="text-slate-50" cx="56" cy="56" fill="transparent" r="52" stroke="currentColor" strokeWidth="5" />
              <circle
                className={secondsLeft > 60 ? 'text-primary' : 'text-red-500'}
                cx="56" cy="56" fill="transparent" r="52"
                stroke="currentColor"
                strokeDasharray="326"
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeWidth="5"
              />
            </svg>
            <div className="text-center z-10">
              <p className="text-[9px] uppercase text-slate-400 font-bold tracking-widest">หมดเวลาใน</p>
              <p className={`text-2xl font-bold ${secondsLeft <= 60 ? 'text-red-500' : 'text-slate-800'}`}>
                {minutes}:{seconds}
              </p>
            </div>
          </div>
          {secondsLeft === 0 ? (
            <p className="text-sm text-red-500 font-bold">หมดเวลาแล้ว กรุณาทำรายการใหม่</p>
          ) : (
            <p className="text-sm text-slate-400 font-medium">กรุณาชำระเงินภายในเวลาที่กำหนด</p>
          )}
        </div>

        {/* Account Info Card */}
        <div className="w-full bg-white rounded-[2rem] p-6 mb-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center p-2 shadow-sm">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">PromptPay ID</p>
                <p className="text-base font-bold text-slate-900">
                  {settings.promptpay || '—'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-medium">ชื่อบัญชี</p>
              <p className="text-sm font-bold text-slate-900 max-w-[110px] text-right leading-tight">
                {settings.accountName}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleUploadSlip}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-white font-bold text-sm active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2db340 100%)' }}
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              แนบสลิป
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-white text-slate-700 border border-slate-200 font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">{copied ? 'check_circle' : 'content_copy'}</span>
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกเลข'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="w-full mt-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] text-center mb-6">ขั้นตอนการชำระเงิน</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 1, text: 'เปิดแอปธนาคาร\nในมือถือ' },
              { id: 2, text: 'สแกน QR Code\nหรือใช้ PromptPay' },
              { id: 3, text: 'กด "แนบสลิป"\nเพื่อยืนยัน' },
            ].map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-100">{step.id}</div>
                <p className="text-[11px] leading-relaxed text-slate-400 font-bold whitespace-pre-line">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default QRPayment;
