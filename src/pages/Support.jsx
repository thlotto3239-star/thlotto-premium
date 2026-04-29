import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const FAQ_ITEMS = [
  {
    q: 'ฝากเงินแล้วยอดไม่เข้า ทำอย่างไร?',
    a: 'กรุณารอ 5-15 นาที ระบบจะตรวจสอบโดยอัตโนมัติ หากเกิน 30 นาทียังไม่เข้า ให้แนบสลิปแจ้งทีมงานผ่าน LINE',
    icon: 'account_balance_wallet',
  },
  {
    q: 'ถอนเงินแล้วกี่นาทีถึงได้รับ?',
    a: 'โดยทั่วไปภายใน 5-15 นาที ในช่วงเวลาเร่งด่วนอาจใช้เวลาสูงสุด 30 นาที ระบบทำงาน 24 ชั่วโมง',
    icon: 'payments',
  },
  {
    q: 'ลืม PIN ถอนเงิน ต้องทำอย่างไร?',
    a: 'ไปที่ โปรไฟล์ → แก้ไขโปรไฟล์ → เปลี่ยน PIN หรือกด "เปลี่ยน PIN" ด้านล่างนี้',
    icon: 'lock_reset',
    action: { label: 'เปลี่ยน PIN', route: '/change-password' },
  },
  {
    q: 'ผลรางวัลออกเมื่อไหร่?',
    a: 'หวยรัฐบาลไทยออกทุกวันที่ 1 และ 16 ของเดือน หวยต่างประเทศและหุ้นออกตามตารางในหน้าผลรางวัล',
    icon: 'emoji_events',
  },
  {
    q: 'โปรโมชั่นรับโบนัสทำอย่างไร?',
    a: 'ฝากเงินผ่านหน้าโปรโมชั่น เลือกโปรที่ต้องการ แล้วฝากเงินขั้นต่ำตามเงื่อนไข โบนัสจะเข้าอัตโนมัติ',
    icon: 'redeem',
  },
  {
    q: 'เปลี่ยนบัญชีธนาคารได้ไหม?',
    a: 'ไม่สามารถเปลี่ยนได้ด้วยตัวเอง เพื่อความปลอดภัยต้องติดต่อทีมงานผ่าน LINE พร้อมหลักฐานยืนยันตัวตน',
    icon: 'account_balance',
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [lineUrl, setLineUrl] = useState('https://line.me/ti/p/@thlotto');
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'contact_line_url')
        .single();
      if (data?.value) setLineUrl(data.value);
    };
    fetchSettings();
  }, []);

  const handleLine = () => window.open(lineUrl, '_blank');

  const toggleFaq = (i) => setOpenFaq(prev => prev === i ? null : i);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 px-4 h-16">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-extrabold text-lg tracking-tight flex-1">ศูนย์ช่วยเหลือ</h1>
      </header>

      <main className="flex-1 pb-16">

        {/* Hero — LINE CTA */}
        <div className="bg-white px-5 pt-6 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-5">
            <div className="relative shrink-0">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
              </div>
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#06C755] border-2 border-white flex items-center justify-center">
                <div className="size-2 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-base">ทีมงาน TH-LOTTO</h2>
              <p className="text-xs text-slate-500 mt-0.5">ตอบกลับภายใน 5-15 นาที</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="size-1.5 rounded-full bg-[#06C755] animate-pulse" />
                <span className="text-[11px] font-bold text-[#06C755]">พร้อมให้บริการ 24 ชั่วโมง</span>
              </div>
            </div>
          </div>

          {/* LINE Button */}
          <button
            onClick={handleLine}
            className="w-full py-4 rounded-2xl font-extrabold text-white text-base flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-lg shadow-[#06C755]/25"
            style={{ background: 'linear-gradient(135deg, #06C755 0%, #04a847 100%)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            แชทกับทีมงานผ่าน LINE
          </button>
        </div>

        {/* Business Hours */}
        <div className="mx-5 mt-5 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
            </div>
            <p className="font-extrabold text-slate-900 text-sm">เวลาให้บริการ</p>
          </div>
          <div className="px-5 py-4 space-y-3">
            {[
              { days: 'จันทร์ – ศุกร์', hours: '08:00 – 24:00 น.' },
              { days: 'เสาร์ – อาทิตย์', hours: '09:00 – 22:00 น.' },
              { days: 'ฝาก / ถอนเงิน', hours: 'ระบบอัตโนมัติ 24 ชม.' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-sm text-slate-500">{r.days}</span>
                <span className="text-sm font-bold text-slate-900">{r.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mx-5 mt-5">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest px-1 mb-3">
            คำถามที่พบบ่อย
          </p>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-slate-50 transition-colors"
                >
                  <div className="size-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {item.icon}
                    </span>
                  </div>
                  <p className="flex-1 text-sm font-bold text-slate-800 leading-snug">{item.q}</p>
                  <span className={`material-symbols-outlined text-slate-400 text-[20px] shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 pl-[52px]">
                    <p className="text-sm text-slate-500 leading-relaxed">{item.a}</p>
                    {item.action && (
                      <button
                        onClick={() => navigate(item.action.route)}
                        className="mt-3 text-xs font-extrabold text-primary flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        {item.action.label}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still need help */}
        <div className="mx-5 mt-5 mb-8 bg-primary/5 border border-primary/15 rounded-2xl p-5 flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>help</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-slate-900 text-sm">ยังไม่พบคำตอบ?</p>
            <p className="text-xs text-slate-500 mt-0.5">ทีมงานพร้อมช่วยเหลือทันที</p>
          </div>
          <button
            onClick={handleLine}
            className="shrink-0 px-4 py-2.5 rounded-xl font-extrabold text-white text-xs"
            style={{ background: 'linear-gradient(135deg, #06C755 0%, #04a847 100%)' }}
          >
            LINE
          </button>
        </div>

      </main>
    </div>
  );
};

export default Support;
