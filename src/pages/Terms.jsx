import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';

const STATIC_SECTIONS = [
  {
    id: 'general',
    icon: 'gavel',
    title: 'เงื่อนไขทั่วไปของสมาชิก',
    items: [
      'สมาชิกต้องมีอายุ 18 ปีบริบูรณ์ขึ้นไปจึงจะสามารถสมัครและใช้บริการได้',
      'ข้อมูลชื่อ-นามสกุลและบัญชีธนาคารต้องตรงกับชื่อผู้สมัครจริงเท่านั้น',
      'อนุญาตให้ 1 บุคคล มีได้เพียง 1 บัญชีเท่านั้น หากพบบัญชีซ้ำซ้อนจะถูกระงับทันที',
      'ห้ามใช้โปรแกรมช่วยเล่น บอท หรือระบบอัตโนมัติที่ไม่ได้รับอนุญาตในการแทงหวย',
      'บริษัทขอสงวนสิทธิ์ในการปรับปรุงเงื่อนไขการให้บริการตามความเหมาะสมเพื่อความปลอดภัย',
    ],
  },
  {
    id: 'financial',
    icon: 'savings',
    title: 'นโยบายการฝากและถอนเงิน',
    items: [
      'ฝากเงินขั้นต่ำและถอนเงินขั้นต่ำเป็นไปตามที่ระบบกำหนดในตารางนโยบาย',
      'ระบบการเงินทำงานอัตโนมัติ ดำเนินการเสร็จสิ้นภายใน 1-15 นาที (ยกเว้นกรณีตรวจจับความผิดปกติ)',
      'บัญชีธนาคารปลายทางสำหรับการถอนเงิน ต้องเป็นบัญชีที่ผูกไว้กับระบบเท่านั้น',
      'เพื่อความปลอดภัย หากตรวจพบธุรกรรมต้องสงสัย บริษัทขอสงวนสิทธิ์ระงับรายการชั่วคราวเพื่อตรวจสอบ',
    ],
  },
  {
    id: 'betting',
    icon: 'confirmation_number',
    title: 'กฎกติกาการเดิมพันและรับแทงหวย',
    items: [
      'การแทงหวยแต่ละประเภทมีอัตราจ่ายและขีดจำกัดสูงสุดตามที่ระบุไว้ในหน้ารายละเอียดตลาด',
      'เมื่อส่งโพยและระบบยืนยันแล้ว จะไม่สามารถยกเลิกหรือแก้ไขรายการได้ทุกกรณี',
      'ผลรางวัลยึดตามการถ่ายทอดสดและประกาศอย่างเป็นทางการของหน่วยงานผู้รับผิดชอบแต่ละตลาด',
      'กรณีเกิดเหตุสุดวิสัยหรือระบบขัดข้อง รายการแทงที่ไม่สมบูรณ์จะถูกยกเลิกและคืนเครดิตให้อัตโนมัติทันที',
    ],
  },
  {
    id: 'promo',
    icon: 'redeem',
    title: 'เงื่อนไขโปรโมชั่นและเครดิตโบนัส',
    items: [
      'โปรโมชั่นแต่ละรายการมีเงื่อนไขและยอดเทิร์นโอเวอร์เฉพาะ กรุณาอ่านรายละเอียดก่อนกดรับสิทธิ์',
      'เครดิตโบนัสต้องทำยอดเทิร์นโอเวอร์ตามที่กำหนดให้ครบถ้วนจึงจะสามารถทำรายการถอนเงินได้',
      'ห้ามใช้โปรโมชั่นในลักษณะเก็งกำไรฉ้อฉล หากตรวจพบจะถูกริบโบนัสและกำไรที่ได้จากโบนัสทันที',
    ],
  },
  {
    id: 'affiliate',
    icon: 'group',
    title: 'ระบบแนะนำเพื่อน (Affiliate Program)',
    items: [
      'สมาชิกรับค่าคอมมิชชั่น 8% จากทุกยอดเดิมพันของผู้ที่สมัครผ่านลิงก์แนะนำของท่าน',
      'ค่าคอมมิชชั่นจะคำนวณและสะสมในกระเป๋าคอมมิชชั่นแบบเรียลไทม์',
      'ห้ามแนะนำตนเอง สร้างบัญชีจำลอง หรือใช้วิธีการทุจริตเพื่อรับผลประโยชน์จากระบบแนะนำเพื่อน',
    ],
  },
  {
    id: 'privacy',
    icon: 'shield',
    title: 'ความปลอดภัยและความเป็นส่วนตัวของข้อมูล',
    items: [
      'ข้อมูลส่วนตัวของสมาชิกทุกท่านได้รับการคุ้มครองและเข้ารหัสความปลอดภัยระดับ SSL 256-Bit',
      'ไม่มีนโยบายเปิดเผยหรือจำหน่ายข้อมูลสมาชิกให้แก่บุคคลภายนอกโดยเด็ดขาด',
      'สมาชิกมีหน้าที่เก็บรักษาข้อมูลเข้าสู่ระบบและรหัส PIN ไว้เป็นความลับส่วนบุคคล',
    ],
  },
];

const Terms = () => {
  const navigate = useNavigate();
  const [extraTerms, setExtraTerms] = useState([]);
  const [siteName, setSiteName] = useState('TH-LOTTO');
  const [serviceHours, setServiceHours] = useState('');
  const [minDeposit, setMinDeposit] = useState(null);
  const [minWithdraw, setMinWithdraw] = useState(null);
  const [minBet, setMinBet] = useState(null);
  const [activeSection, setActiveSection] = useState('general');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['terms_html', 'site_name', 'service_hours_text', 'min_deposit', 'min_withdraw', 'min_bet']);
      if (data) {
        const map = {};
        data.forEach(d => { map[d.key] = d.value; });
        if (map.site_name) setSiteName(map.site_name);
        if (map.service_hours_text) setServiceHours(map.service_hours_text);
        if (map.min_deposit) setMinDeposit(map.min_deposit);
        if (map.min_withdraw) setMinWithdraw(map.min_withdraw);
        if (map.min_bet) setMinBet(map.min_bet);
        if (map.terms_html) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(`<ul>${map.terms_html}</ul>`, 'text/html');
          const items = Array.from(doc.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
          if (items.length > 0) setExtraTerms(items);
        }
      }
    };
    fetchSettings();
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">เงื่อนไขและข้อตกลงการใช้งาน</h1>
              <p className="text-xs text-slate-400 hidden sm:block">กฎ กติกา และนโยบายความปลอดภัยของระบบ</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <span className="material-symbols-outlined text-sm text-brand-600">verified</span>
            นโยบายทางการ
          </span>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (4 cols on PC): Sticky Table of Contents & Quick Limits ════ */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">

            {/* Quick Limits Card */}
            {(minDeposit || minWithdraw || minBet) && (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">เกณฑ์การเงินเบื้องต้น</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {minDeposit && (
                    <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100">
                      <p className="text-[11px] font-bold text-emerald-700">ฝากขั้นต่ำ</p>
                      <p className="text-sm font-black text-emerald-900 mt-0.5">฿{Number(minDeposit).toLocaleString()}</p>
                    </div>
                  )}
                  {minWithdraw && (
                    <div className="bg-blue-50 rounded-2xl p-2.5 border border-blue-100">
                      <p className="text-[11px] font-bold text-blue-700">ถอนขั้นต่ำ</p>
                      <p className="text-sm font-black text-blue-900 mt-0.5">฿{Number(minWithdraw).toLocaleString()}</p>
                    </div>
                  )}
                  {minBet && (
                    <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-100">
                      <p className="text-[11px] font-bold text-amber-700">แทงขั้นต่ำ</p>
                      <p className="text-sm font-black text-amber-900 mt-0.5">฿{Number(minBet).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Table of Contents Navigation Card (Desktop) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-2 hidden lg:block">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 mb-3">สารบัญข้อตกลง</h3>
              <div className="space-y-1">
                {STATIC_SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      activeSection === sec.id
                        ? 'bg-brand-50 text-brand-700 font-extrabold border border-brand-200/60'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base shrink-0">{sec.icon}</span>
                    <span className="truncate">{sec.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Need Help Card */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs">
                <span className="material-symbols-outlined text-brand-600 text-base">support_agent</span>
                <span>มีข้อสงสัยเกี่ยวกับกติกา?</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                ทีมงานฝ่ายบริการลูกค้าพร้อมให้คำแนะนำและช่วยเหลือตลอด 24 ชั่วโมง
              </p>
              <button
                onClick={() => navigate('/support')}
                className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 font-bold text-xs transition-colors cursor-pointer"
              >
                ติดต่อฝ่ายบริการลูกค้า
              </button>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (8 cols on PC): Detailed Content Panes ════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* Hero Top Banner */}
            <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-400">description</span>
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Terms & Conditions</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black">{siteName} นโยบายและเงื่อนไขการใช้บริการ</h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  โปรดอ่านและทำความเข้าใจข้อกำหนดการใช้งานอย่างละเอียด เพื่อรักษาสิทธิประโยชน์และความปลอดภัยในการใช้งานของท่าน
                  {serviceHours && <span className="block mt-1 text-emerald-300">เวลาให้บริการ: {serviceHours}</span>}
                </p>
              </div>
            </div>

            {/* Extra terms from Admin Settings (if configured) */}
            {extraTerms.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">priority_high</span>
                  <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">ข้อกำหนดเฉพาะกิจ</h3>
                </div>
                <ul className="space-y-2">
                  {extraTerms.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                      <span className="material-symbols-outlined text-amber-600 text-sm mt-0.5 shrink-0">arrow_right</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Detailed Accordion Section Cards */}
            <div className="space-y-4">
              {STATIC_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs scroll-mt-24"
                >
                  <details open className="group">
                    <summary className="flex items-center justify-between p-5 sm:p-6 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden bg-slate-50/40 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3.5">
                        <div className="size-10 rounded-2xl bg-brand-50 text-brand-700 flex items-center justify-center shrink-0 border border-brand-100">
                          <span className="material-symbols-outlined text-xl">{section.icon}</span>
                        </div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">{section.title}</h3>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 text-xl group-open:rotate-180 transition-transform duration-200">
                        expand_more
                      </span>
                    </summary>

                    <div className="px-6 py-5 border-t border-slate-100 bg-white">
                      <ul className="space-y-3">
                        {section.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="size-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-100">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            </span>
                            <span className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </div>
              ))}
            </div>

            {/* Footer Signoff */}
            <div className="pt-6 text-center space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                การเข้าสู่ระบบและใช้งาน {siteName} ถือว่าท่านได้รับทราบและยอมรับข้อตกลงข้างต้นทุกประการ
              </p>
              <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">
                {siteName} Premium Platform © {new Date().getFullYear()}
              </p>
            </div>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Terms;
