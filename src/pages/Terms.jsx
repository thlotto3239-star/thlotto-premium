import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';

const STATIC_SECTIONS = [
  {
    id: 'general',
    icon: 'gavel',
    title: 'เงื่อนไขทั่วไปของสมาชิก',
    items: [
      'สมาชิกต้องมีอายุ 18 ปีบริบูรณ์ขึ้นไปตามกฎหมาย',
      'ข้อมูลบัญชีธนาคารต้องตรงกับชื่อ-นามสกุลของผู้สมัครเท่านั้น',
      '1 คน สามารถลงทะเบียนได้ 1 บัญชีเท่านั้น หากพบบัญชีซ้ำซ้อนจะถูกระงับสิทธิ์ทันที',
      'ห้ามใช้โปรแกรมโกง สคริปต์อัตโนมัติ หรือบอทในการเดิมพันทุกกรณี',
      'บริษัทขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขโดยไม่ต้องแจ้งให้ทราบล่วงหน้า',
    ],
  },
  {
    id: 'banking',
    icon: 'savings',
    title: 'นโยบายการฝากและถอนเงิน',
    items: [
      'การฝากเงินต้องโอนจากบัญชีธนาคารที่ลงทะเบียนไว้กับระบบเท่านั้น',
      'ระบบฝาก-ถอนเงินอัตโนมัติเปิดให้บริการตลอด 24 ชั่วโมง',
      'ระยะเวลาดำเนินการโอนเงินเฉลี่ย 5 - 15 นาที (อาจมีความล่าช้าตามระบบธนาคารช่วงปรับปรุงประจำวัน)',
      'การถอนเงินจำกัดยอดสูงสุด 2,000,000 บาทต่อวัน',
      'หากตรวจพบพฤติกรรมผิดปกติ บริษัทขอสงวนสิทธิ์ในการระงับรายการชั่วคราวเพื่อตรวจสอบความโปร่งใส',
    ],
  },
  {
    id: 'betting',
    icon: 'confirmation_number',
    title: 'กติกาการแทงหวยและรับรางวัล',
    items: [
      'เมื่อส่งโพยหวยและระบบยืนยันแล้ว สมาชิกไม่สามารถแก้ไขหรือยกเลิกโพยได้',
      'การตัดสินผลรางวัลยึดตามผลการออกรางวัลอย่างเป็นทางการของหน่วยงานที่เกี่ยวข้องในแต่ละประเทศ',
      'อัตราจ่ายเงินรางวัลเป็นไปตามที่ระบุไว้ในระบบ ณ เวลาที่ส่งโพย',
      'หากเกิดเหตุการณ์ระบบขัดข้องหรือปิดรับแทงก่อนเวลา บิลที่ไม่สมบูรณ์จะถูกยกเลิกและคืนเครดิตเต็มจำนวน',
    ],
  },
  {
    id: 'promotions',
    icon: 'redeem',
    title: 'เงื่อนไขโปรโมชั่นและโบนัส',
    items: [
      'โปรโมชั่นแต่ละรายการมีข้อกำหนดและอัตราเทิร์นโอเวอร์เฉพาะ กรุณาศึกษารายละเอียดก่อนกดรับ',
      'ยอดโบนัสต้องทำเทิร์นโอเวอร์ครบตามเงื่อนไขจึงจะสามารถถอนเงินออกจากระบบได้',
      'ห้ามมิให้กระทำการฉ้อโกงเพื่อสะสมโบนัสในทางมิชอบ',
      'บริษัทขอสงวนสิทธิ์ในการยกเลิกโบนัสและกำไรที่เกิดขึ้นหากพบการกระทำทุจริต',
    ],
  },
  {
    id: 'affiliate',
    icon: 'group',
    title: 'ระบบแนะนำเพื่อน (Affiliate)',
    items: [
      'ค่าคอมมิชชั่น 8% คำนวณจากยอดเดิมพันจริงของสมาชิกที่คุณแนะนำ',
      'รายได้สะสมอัปเดตแบบเรียลไทม์ และสามารถกดโอนเข้ากระเป๋าหลักได้ทันที',
      'ห้ามแนะนำตนเองหรือสร้างบัญชีปลอมเพื่อหวังผลประโยชน์จากระบบคอมมิชชั่น',
    ],
  },
  {
    id: 'privacy',
    icon: 'shield',
    title: 'นโยบายความเป็นส่วนตัวและความปลอดภัย',
    items: [
      'ข้อมูลส่วนบุคคลของสมาชิกจะถูกจัดเก็บด้วยระบบเข้ารหัสระดับสากล SSL 256-Bit',
      'ไม่มีการเปิดเผยหรือจำหน่ายข้อมูลสมาชิกให้แก่บุคคลที่สามโดยเด็ดขาด',
      'สมาชิกมีหน้าที่รักษารหัสผ่านและ PIN 4 หลักของตนเองเป็นความลับสูงสุด',
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
                <span>ข้อกำหนดและเงื่อนไขการใช้งาน</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Compliance Policy
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">กติกาการเดิมพัน นโยบายฝาก-ถอน และข้อตกลงการใช้งานแพลตฟอร์มอย่างเป็นทางการ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/support"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-sm">help</span>
              <span>สอบถามเพิ่มเติม</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 3 Cols on PC): Navigation & System Limits ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Table of Contents / Anchors */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-1">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                หัวข้อกติกาสำคัญ
              </h3>
              {STATIC_SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-emerald-700 transition-all"
                >
                  <span className="material-symbols-outlined text-base text-slate-400">{sec.icon}</span>
                  <span className="truncate">{sec.title}</span>
                </a>
              ))}
            </div>

            {/* System Limits Box */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                เกณฑ์วงเงินระบบ
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">ฝากเงินขั้นต่ำ:</span>
                  <span className="font-mono font-bold text-slate-900">฿{minDeposit ? Number(minDeposit).toLocaleString() : '100'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500">ถอนเงินขั้นต่ำ:</span>
                  <span className="font-mono font-bold text-emerald-700">฿{minWithdraw ? Number(minWithdraw).toLocaleString() : '300'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">เดิมพันขั้นต่ำ:</span>
                  <span className="font-mono font-bold text-slate-900">฿{minBet ? Number(minBet).toLocaleString() : '1'}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 6 Cols on PC): Policy Articles Feed ════ */}
          <main className="lg:col-span-6 space-y-4">
            {/* Hero Header Card */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-6 text-white shadow-md space-y-2 relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] size-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-emerald-300 text-lg">verified</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-200">ข้อตกลงและนโยบายการให้บริการ</span>
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">ข้อกำหนดการใช้งาน {siteName}</h2>
                <p className="text-xs text-emerald-200/90 leading-relaxed mt-1">
                  โปรดศึกษาและทำความเข้าใจข้อกำหนดการใช้งานอย่างละเอียด เพื่อรักษาสิทธิประโยชน์และความปลอดภัยของบัญชีของท่าน
                  {serviceHours && <span className="block mt-1">เวลาให้บริการ: {serviceHours}</span>}
                </p>
              </div>
            </div>

            {/* Extra DB-Configured Terms */}
            {extraTerms.length > 0 && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600 text-base">warning</span>
                  <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">ข้อกำหนดเฉพาะกิจ</h3>
                </div>
                <ul className="space-y-1.5 text-xs text-amber-800">
                  {extraTerms.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Static Policy Sections in Rich Cards */}
            <div className="space-y-4">
              {STATIC_SECTIONS.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3 scroll-mt-28"
                >
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-xl">{section.icon}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{section.title}</h3>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-emerald-600 text-sm shrink-0 mt-0.5">check_circle</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Legal & Compliance Certifications ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Fair Play & Transparency */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">policy</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                  มาตรฐานความโปร่งใส
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                การออกผลรางวัลทุกมาร์เก็ตอ้างอิงจากผลอย่างเป็นทางการ ไม่มีการดัดแปลงผลลัพธ์ใดๆ ทั้งสิ้น
              </p>
            </div>

            {/* Security Guarantee */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">lock</span>
                <h4 className="text-xs font-extrabold">ความปลอดภัย 256-Bit</h4>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ข้อมูลส่วนบุคคล การทำธุรกรรม และการเดิมพันทั้งหมดได้รับการคุ้มครองภายใต้มาตรฐานสากล
              </p>
            </div>

            {/* Contact Support Link */}
            <div className="p-4 text-center text-xs text-slate-400 space-y-1">
              <p>มีข้อสงสัยเกี่ยวกับกติกา?</p>
              <Link
                to="/support"
                className="font-bold text-emerald-700 hover:underline inline-block"
              >
                ติดต่อฝ่ายบริการลูกค้า 24 ชม.
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Terms;
