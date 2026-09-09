import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';

const FAQ_ITEMS = [
  {
    q: 'ฝากเงินแล้วยอดไม่เข้า ทำอย่างไร?',
    a: 'โดยปกติระบบการเงินอัตโนมัติจะปรับยอดให้ภายใน 1–3 นาที หากเกิน 15 นาที กรุณาตรวจสอบว่ายอดเงินและเวลาในสลิปตรงกัน หรือกดส่งสลิปผ่านหน้าแจ้งฝาก หากยังไม่เข้า สามารถส่งสลิปให้เจ้าหน้าที่ตรวจสอบผ่าน LINE ได้ทันที 24 ชม.',
    icon: 'account_balance_wallet',
    category: 'บัญชีและการเงิน',
  },
  {
    q: 'ถอนเงินแล้วกี่นาทีถึงได้รับเงินเข้าบัญชี?',
    a: 'ระบบโอนเงินรางวัลอัตโนมัติจะดำเนินการเข้าบัญชีธนาคารของท่านภายใน 1–5 นาที ในช่วงเวลาที่มีผู้ใช้งานหนาแน่นอาจใช้เวลาไม่เกิน 15 นาที ระบบเปิดให้บริการถอนเงินตลอด 24 ชั่วโมง ไม่มีวันหยุด',
    icon: 'payments',
    category: 'บัญชีและการเงิน',
  },
  {
    q: 'ลืมรหัส PIN 4 หลัก สำหรับถอนเงิน ต้องทำอย่างไร?',
    a: 'ท่านสามารถเข้าไปที่เมนู "โปรไฟล์" → "ตั้งค่าความปลอดภัย" → "เปลี่ยนรหัส PIN" หรือกดปุ่มด้านล่างเพื่อไปยังหน้าแก้ไขรหัส PIN หากจำรหัสเดิมไม่ได้ ให้ติดต่อทีมงานผ่าน LINE เพื่อยืนยันตัวตน',
    icon: 'lock_reset',
    category: 'ความปลอดภัย',
    action: { label: 'ไปที่หน้าเปลี่ยน PIN', route: '/change-password' },
  },
  {
    q: 'ผลหวยแต่ละประเภทออกเวลากี่โมง?',
    a: 'หวยรัฐบาลไทยออกผลทุกวันที่ 1 และ 16 ของเดือน เวลา 14:30 น. เป็นต้นไป, หวยลาว ฮานอย และหุ้นต่างประเทศจะออกผลตามรอบเวลามาตรฐานของแต่ละประเทศ ท่านสามารถดูตารางเวลาและถ่ายทอดสดได้ที่หน้า "ผลรางวัล"',
    icon: 'emoji_events',
    category: 'การแทงหวย',
    action: { label: 'ดูหน้าตรวจผลรางวัล', route: '/results' },
  },
  {
    q: 'โปรโมชั่นและเครดิตโบนัสรับอย่างไร?',
    a: 'เข้าสู่หน้า "โปรโมชั่น" เลือกโปรโมชั่นที่ตรงกับความต้องการของท่าน จากนั้นกด "รับโปร" และฝากเงินขั้นต่ำตามเงื่อนไขที่กำหนด โบนัสจะถูกเติมเข้าสู่กระเป๋าเงินของท่านโดยอัตโนมัติ',
    icon: 'redeem',
    category: 'โปรโมชั่น',
    action: { label: 'ดูโปรโมชั่นทั้งหมด', route: '/promotions' },
  },
  {
    q: 'สามารถเปลี่ยนบัญชีธนาคารสำหรับถอนเงินได้หรือไม่?',
    a: 'เพื่อความปลอดภัยสูงสุดและป้องกันการสวมรอย สมาชิกไม่สามารถแก้ไขเลขบัญชีธนาคารได้ด้วยตนเอง หากท่านมีการเปลี่ยนชื่อหรือเปิดบัญชีใหม่ กรุณาติดต่อทีมงานฝ่ายบริการลูกค้าผ่าน LINE พร้อมเตรียมรูปถ่ายสมุดบัญชีเพื่อยืนยันตัวตน',
    icon: 'account_balance',
    category: 'ความปลอดภัย',
    action: { label: 'ดูข้อมูลบัญชีธนาคาร', route: '/bank-account' },
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [lineUrl, setLineUrl] = useState('https://line.me/ti/p/@thlotto');
  const [openFaq, setOpenFaq] = useState(0);
  const [faqs, setFaqs] = useState(FAQ_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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

    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from('cms_faq')
        .select('id, question, answer, category, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      if (data && data.length > 0 && !error) {
        setFaqs(data.map(item => ({
          q: item.question,
          a: item.answer,
          category: item.category || 'ทั่วไป',
          icon: item.category === 'บัญชีและการเงิน' ? 'account_balance_wallet' :
                item.category === 'ความปลอดภัย' ? 'security' :
                item.category === 'การแทงหวย' ? 'casino' : 'help_outline'
        })));
      }
    };
    fetchFaqs();
  }, []);

  const handleLine = () => window.open(lineUrl, '_blank');

  const filteredFaqs = useMemo(() => {
    return faqs.filter(item => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchSearch = !searchQuery ||
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqs, selectedCategory, searchQuery]);

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
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">ศูนย์ช่วยเหลือและบริการลูกค้า</h1>
              <p className="text-xs text-slate-400 hidden sm:block">ติดต่อทีมงานและค้นหาคำตอบข้อสงสัยที่พบบ่อย</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="size-2 rounded-full bg-[#06C755] animate-ping" />
              เจ้าหน้าที่ออนไลน์ 24 ชม.
            </span>
          </div>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Contact Channels & Service Hours ════ */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">

            {/* Official LINE Contact Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-6 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  <div className="size-16 rounded-2xl bg-[#06C755]/10 border border-[#06C755]/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#06C755] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      support_agent
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-[#06C755] border-2 border-white flex items-center justify-center">
                    <div className="size-2 rounded-full bg-white" />
                  </div>
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg">ฝ่ายบริการลูกค้า TH-LOTTO</h2>
                  <p className="text-xs text-slate-500 mt-0.5">ตอบกลับรวดเร็วภายใน 1–5 นาที</p>
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1.5">
                    <div className="size-2 rounded-full bg-[#06C755] animate-pulse" />
                    <span className="text-xs font-bold text-[#06C755]">พร้อมให้บริการตลอด 24 ชั่วโมง</span>
                  </div>
                </div>
              </div>

              {/* LINE Button */}
              <button
                onClick={handleLine}
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#06C755]/25 active:scale-[0.99] cursor-pointer hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #06C755 0%, #04a847 100%)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>แชทสอบถามทาง LINE Official</span>
              </button>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>LINE ID: @thlotto</span>
                <span className="text-emerald-700 font-bold">ตอบสดโดยคนจริง</span>
              </div>
            </div>

            {/* Service Hours Schedule */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">เวลาทำการและระบบบริการ</h3>
                  <p className="text-xs text-slate-400">ตารางความพร้อมของระบบและการช่วยเหลือ</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 pt-1">
                {[
                  { title: 'ระบบฝาก-ถอนเงินอัตโนมัติ', time: 'เปิดบริการ 24 ชั่วโมง', badge: 'Auto 24/7', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { title: 'ทีมแอดมินตอบแชท LINE', time: 'เปิดบริการ 24 ชั่วโมง', badge: 'Online', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                  { title: 'ระบบรับแทงหวยและออกผล', time: 'ตามรอบเวลาแต่ละตลาด', badge: 'Live', badgeColor: 'bg-slate-50 text-slate-700 border-slate-200' },
                ].map((row, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{row.title}</p>
                      <p className="text-slate-500 mt-0.5">{row.time}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full font-bold border text-[11px] ${row.badgeColor}`}>
                      {row.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* SLA Response Guarantee */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                <span className="material-symbols-outlined text-brand-600 text-base">verified_user</span>
                <span>มาตรฐานการบริการลูกค้า</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                เรายึดมั่นในความปลอดภัยและความถูกต้องของข้อมูล สมาชิกสามารถสอบถามสถานะบิล ตรวจสอบสลิป หรือขอคำแนะนำได้ตลอดเวลา
              </p>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Search & Interactive FAQ ════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Search Input Bar */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div>
                <h2 className="font-black text-slate-900 text-lg">คำถามที่พบบ่อย (FAQ)</h2>
                <p className="text-xs text-slate-500 mt-0.5">ค้นหาคำตอบและแนวทางแก้ไขปัญหาเบื้องต้นได้อย่างรวดเร็ว</p>
              </div>

              {/* Search Box */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาคำถาม เช่น ฝากเงิน, ถอนเงิน, ลืม PIN, หวยออกกี่โมง..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none text-sm text-slate-900 placeholder:text-slate-400 font-medium"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                {[
                  { id: 'ALL', label: 'ทั้งหมด' },
                  { id: 'บัญชีและการเงิน', label: 'ฝาก-ถอนเงิน' },
                  { id: 'ความปลอดภัย', label: 'รหัส PIN & ความปลอดภัย' },
                  { id: 'การแทงหวย', label: 'กติกาหวย' },
                  { id: 'โปรโมชั่น', label: 'โปรโมชั่น' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-brand-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ Accordion List */}
            <div className="space-y-3">
              {filteredFaqs.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                  <p className="text-sm font-bold">ไม่พบคำถามที่ตรงกับคำค้นหา "{searchQuery}"</p>
                  <button
                    onClick={handleLine}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors cursor-pointer"
                  >
                    <span>สอบถามเจ้าหน้าที่โดยตรงทาง LINE</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              ) : (
                filteredFaqs.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs transition-colors hover:border-slate-300"
                  >
                    <button
                      onClick={() => setOpenFaq(prev => prev === idx ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left active:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 pr-4">
                        <div className="size-10 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100/60">
                          <span className="material-symbols-outlined text-lg">{item.icon}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                          {item.q}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined text-slate-400 text-xl shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-brand-600' : ''}`}>
                        expand_more
                      </span>
                    </button>

                    {openFaq === idx && (
                      <div className="px-6 pb-5 pt-1 border-t border-slate-100/80 bg-slate-50/40">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                          {item.a}
                        </p>
                        {item.action && (
                          <button
                            onClick={() => navigate(item.action.route)}
                            className="mt-3.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-brand-700 hover:bg-brand-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <span>{item.action.label}</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Need More Assistance Card */}
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                  <span className="material-symbols-outlined text-emerald-400 text-2xl">chat</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">ยังไม่พบคำตอบที่ต้องการ?</h3>
                  <p className="text-xs text-slate-300 mt-0.5">ทีมงานพร้อมตอบข้อซักถามและแก้ปัญหาให้ท่านทันที</p>
                </div>
              </div>
              <button
                onClick={handleLine}
                className="px-6 py-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <span>ติดต่อทาง LINE</span>
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Support;
