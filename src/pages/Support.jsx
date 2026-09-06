import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';

const FAQ_ITEMS = [
  {
    category: 'DEPOSIT',
    q: 'ฝากเงินแล้วยอดไม่เข้า ทำอย่างไร?',
    a: 'โดยปกติระบบออโต้จะปรับยอดเงินภายใน 5-15 นาที หากเกิน 30 นาทียังไม่ได้รับยอด กรุณาแนบสลิปการโอนเงินแล้วติดต่อทีมงานผ่าน LINE เพื่อให้เจ้าหน้าที่ตรวจสอบให้ทันที',
    icon: 'account_balance_wallet',
    action: { label: 'แจ้งสลิปเติมเงิน', route: '/deposit' },
  },
  {
    category: 'WITHDRAW',
    q: 'ถอนเงินแล้วกี่นาทีถึงได้รับเงินเข้าบัญชี?',
    a: 'ระบบถอนเงินอัตโนมัติทำงานตลอด 24 ชั่วโมง ใช้เวลาเฉลี่ย 5-15 นาที ในช่วงเวลาที่มีผู้ใช้งานหนาแน่นอาจใช้เวลาไม่เกิน 30 นาที เงินจะโอนเข้าบัญชีธนาคารที่คุณผูกไว้โดยตรง',
    icon: 'payments',
    action: { label: 'ไปหน้าถอนเงิน', route: '/withdrawal' },
  },
  {
    category: 'SECURITY',
    q: 'ลืมรหัส PIN ถอนเงิน ต้องทำอย่างไร?',
    a: 'คุณสามารถเปลี่ยนหรือตั้งรหัส PIN ใหม่ได้ด้วยตนเองผ่านเมนู "เปลี่ยน PIN" โดยระบบจะให้ยืนยันผ่านเบอร์มือถือของคุณ หรือสามารถติดต่อแอดมินเพื่อรีเซ็ตได้',
    icon: 'lock_reset',
    action: { label: 'เปลี่ยน PIN ใหม่', route: '/change-password' },
  },
  {
    category: 'LOTTERY',
    q: 'ผลรางวัลออกเมื่อไหร่ และดูผลย้อนหลังได้ที่ไหน?',
    a: 'หวยรัฐบาลไทยออกทุกวันที่ 1 และ 16 ของเดือน ส่วนหวยฮานอย ลาว และหุ้นต่างประเทศจะออกตามรอบเวลาสากล ตรวจสอบตารางออกรางวัลและตรวจผลย้อนหลังได้ที่เมนู "ผลรางวัล"',
    icon: 'emoji_events',
    action: { label: 'ตรวจผลรางวัล', route: '/results' },
  },
  {
    category: 'PROMOTION',
    q: 'รับโบนัสโปรโมชั่นอย่างไร?',
    a: 'คุณสามารถเลือกโปรโมชั่นที่ต้องการได้ที่เมนู "โปรโมชั่น" จากนั้นทำรายการฝากเงินตามเงื่อนไขที่กำหนด โบนัสจะถูกปรับเข้ากระเป๋าเงินของคุณโดยอัตโนมัติทันที',
    icon: 'redeem',
    action: { label: 'ดูโปรโมชั่นทั้งหมด', route: '/promotions' },
  },
  {
    category: 'ACCOUNT',
    q: 'ต้องการเปลี่ยนบัญชีธนาคารสำหรับถอนเงินทำได้ไหม?',
    a: 'เพื่อความปลอดภัยสูงสุดและป้องกันการสวมรอย การเปลี่ยนบัญชีธนาคารจำเป็นต้องติดต่อทีมงานผ่าน LINE พร้อมส่งรูปบัตรประชาชนหรือหน้าสมุดบัญชีเพื่อยืนยันตัวตน',
    icon: 'account_balance',
    action: { label: 'ดูบัญชีธนาคาร', route: '/bank-account' },
  },
];

const Support = () => {
  const navigate = useNavigate();
  const [lineUrl, setLineUrl] = useState('https://line.me/ti/p/@thlotto');
  const [openFaq, setOpenFaq] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

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

  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter(item => {
      const matchCat = activeCategory === 'ALL' || item.category === activeCategory;
      const matchSearch = !searchQuery.trim() || 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [searchQuery, activeCategory]);

  return (
    <PageWrapper>
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
                <span>ศูนย์ช่วยเหลือและบริการลูกค้า</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  24/7 Support
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">ตอบทุกข้อสงสัย ติดต่อเจ้าหน้าที่ และแก้ปัญหาการใช้งานได้อย่างรวดเร็ว</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLine}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#06C755] hover:opacity-90 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">chat</span>
              <span>แชท LINE 24 ชม.</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 4 Cols on PC): Live Contact CTA & Operating Hours ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* LINE Hero Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
              <div className="flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <div className="size-14 rounded-2xl bg-emerald-50 text-[#06C755] flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-3xl">support_agent</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-[#06C755] border-2 border-white flex items-center justify-center">
                    <div className="size-1.5 rounded-full bg-white animate-ping" />
                  </div>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">ฝ่ายบริการลูกค้า</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ตอบกลับเฉลี่ยภายใน 5-15 นาที</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="size-2 rounded-full bg-[#06C755] animate-pulse" />
                    <span className="text-[11px] font-bold text-[#06C755]">พร้อมให้บริการตลอด 24 ชั่วโมง</span>
                  </div>
                </div>
              </div>

              {/* LINE Button */}
              <button
                onClick={handleLine}
                className="w-full h-13 rounded-2xl font-extrabold text-white text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] transition-all shadow-md cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #06C755 0%, #04a847 100%)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
                </svg>
                <span>ติดต่อแอดมินผ่าน LINE @thlotto</span>
              </button>
            </div>

            {/* Service Highlights Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                มาตรฐานการดูแลสมาชิก
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'ระบบฝาก-ถอนเงินออโต้', time: 'ตลอด 24 ชั่วโมง', icon: 'payments', color: 'text-emerald-700 bg-emerald-50' },
                  { label: 'ฝ่ายบริการลูกค้าทาง LINE', time: 'ตลอด 24 ชั่วโมง', icon: 'chat', color: 'text-blue-600 bg-blue-50' },
                  { label: 'ออกผลรางวัลและตรวจโพย', time: 'เรียลไทม์ทุกตลาด', icon: 'emoji_events', color: 'text-amber-600 bg-amber-50' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className={`size-8 rounded-xl flex items-center justify-center ${item.color}`}>
                        <span className="material-symbols-outlined text-base">{item.icon}</span>
                      </div>
                      <span className="font-bold text-slate-800">{item.label}</span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 5 Cols on PC): Interactive FAQs ════ */}
          <main className="lg:col-span-5 space-y-4">
            {/* Search & Filter Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาคำถาม เช่น ฝากเงิน, ถอนเงิน, ลืม PIN..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              {/* Category Pills */}
              <div className="flex overflow-x-auto no-scrollbar gap-1.5">
                {[
                  { id: 'ALL', label: 'ทั้งหมด' },
                  { id: 'DEPOSIT', label: 'ฝากเงิน' },
                  { id: 'WITHDRAW', label: 'ถอนเงิน' },
                  { id: 'SECURITY', label: 'ความปลอดภัย' },
                  { id: 'LOTTERY', label: 'ผลรางวัล' },
                  { id: 'PROMOTION', label: 'โปรโมชั่น' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-emerald-700 text-white shadow-2xs'
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
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden transition-all shadow-2xs"
                    >
                      <button
                        onClick={() => toggleFaq(idx)}
                        className="w-full p-4 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                            <span className="material-symbols-outlined text-lg">{faq.icon}</span>
                          </div>
                          <span className="text-xs font-extrabold text-slate-900 leading-snug">{faq.q}</span>
                        </div>
                        <span className={`material-symbols-outlined text-slate-400 text-base transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                          expand_more
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-5 pb-4 pt-1 border-t border-slate-50 space-y-3">
                          <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
                          {faq.action && (
                            <Link
                              to={faq.action.route}
                              className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:underline"
                            >
                              <span>{faq.action.label}</span>
                              <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-14 text-center bg-white rounded-3xl border border-slate-200/80 p-6">
                  <span className="material-symbols-outlined text-slate-300 text-4xl mb-1">help_outline</span>
                  <p className="text-xs font-extrabold text-slate-800">ไม่พบคำถามที่ค้นหา</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดแชทเพื่อคุยกับทีมงานโดยตรง</p>
                </div>
              )}
            </div>
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Fast Resolution Shortcuts ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Quick Action Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                ทางลัดแก้ไขปัญหาด่วน
              </h3>
              <div className="space-y-2">
                <Link
                  to="/deposit"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-emerald-700">add_card</span>
                    <span>ฝากเงิน & ตรวจสอบสลิป</span>
                  </div>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>

                <Link
                  to="/withdrawal"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-emerald-700">payments</span>
                    <span>ถอนเงินเข้าบัญชี</span>
                  </div>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>

                <Link
                  to="/change-password"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-bold transition-all border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-amber-600">lock_reset</span>
                    <span>ลืม PIN / เปลี่ยน PIN</span>
                  </div>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>

                <Link
                  to="/terms"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all border border-slate-100"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-base text-slate-400">description</span>
                    <span>กติกาและเงื่อนไขการใช้งาน</span>
                  </div>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </Link>
              </div>
            </div>

            {/* Service Guarantee */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-base">verified</span>
                <h4 className="text-xs font-extrabold">รับประกันความมั่นคง</h4>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                การันตีความปลอดภัยและข้อมูลส่วนบุคคลตามมาตรฐานสากล จ่ายจริงทุกบิล รวดเร็ว 100%
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Support;
