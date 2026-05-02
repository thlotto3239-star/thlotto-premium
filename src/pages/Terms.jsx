import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';

const STATIC_SECTIONS = [
  {
    icon: 'gavel',
    title: 'เงื่อนไขทั่วไป',
    items: [
      'สมาชิกต้องมีอายุ 18 ปีบริบูรณ์ขึ้นไป',
      'ข้อมูลบัญชีธนาคารต้องตรงกับชื่อผู้สมัครเท่านั้น',
      '1 คน สามารถมีได้ 1 บัญชีเท่านั้น หากพบบัญชีซ้ำซ้อน จะถูกระงับทันที',
      'ห้ามใช้โปรแกรมเสริม บอท หรือระบบอัตโนมัติในการใช้งาน',
      'บริษัทขอสงวนสิทธิ์ในการแก้ไขเงื่อนไขโดยไม่ต้องแจ้งล่วงหน้า',
    ],
  },
  {
    icon: 'savings',
    title: 'การฝาก-ถอนเงิน',
    items: [
      'ฝากเงินขั้นต่ำตามที่ระบบกำหนด',
      'ถอนเงินขั้นต่ำตามที่ระบบกำหนด',
      'การถอนเงินจะดำเนินการภายใน 1-15 นาที (อาจนานกว่าในกรณีตรวจสอบพิเศษ)',
      'จำนวนครั้งในการถอนต่อวันมีจำกัดตามที่ระบบกำหนด',
      'หากตรวจพบพฤติกรรมผิดปกติ บริษัทขอสงวนสิทธิ์ในการระงับการถอนเพื่อตรวจสอบ',
    ],
  },
  {
    icon: 'confirmation_number',
    title: 'การแทงหวย',
    items: [
      'แทงขั้นต่ำตามที่ระบบกำหนดในแต่ละประเภท',
      'เมื่อส่งโพยแล้วไม่สามารถยกเลิกได้',
      'ผลรางวัลยึดตามการออกรางวัลอย่างเป็นทางการของแต่ละสำนัก',
      'อัตราจ่ายอาจมีการเปลี่ยนแปลงโดยไม่ต้องแจ้งล่วงหน้า',
      'หากระบบขัดข้อง การแทงที่ไม่สมบูรณ์จะถูกยกเลิกและคืนเงินอัตโนมัติ',
    ],
  },
  {
    icon: 'redeem',
    title: 'โปรโมชั่นและโบนัส',
    items: [
      'โปรโมชั่นแต่ละรายการมีเงื่อนไขเฉพาะ กรุณาอ่านรายละเอียดก่อนรับ',
      'โบนัสต้องทำเทิร์นโอเวอร์ตามที่กำหนดก่อนถอน',
      'ห้ามใช้โปรโมชั่นในทางที่ผิดหรือฉ้อโกง',
      'บริษัทขอสงวนสิทธิ์ในการยกเลิกโบนัสหากตรวจพบพฤติกรรมไม่สุจริต',
    ],
  },
  {
    icon: 'group',
    title: 'ระบบแนะนำเพื่อน',
    items: [
      'ค่าคอมมิชชั่นจะคำนวณจากยอดแทงของผู้ที่ถูกแนะนำ',
      'ค่าคอมมิชชั่นจะเข้ากระเป๋าอัตโนมัติ',
      'ห้ามแนะนำตัวเองหรือสร้างบัญชีปลอมเพื่อรับคอมมิชชั่น',
    ],
  },
  {
    icon: 'shield',
    title: 'ความเป็นส่วนตัวและความปลอดภัย',
    items: [
      'ข้อมูลส่วนตัวของสมาชิกจะถูกเก็บรักษาเป็นความลับ',
      'เราใช้ระบบเข้ารหัสข้อมูลระดับสูงในการรักษาความปลอดภัย',
      'ไม่มีการแบ่งปันข้อมูลกับบุคคลที่สาม ยกเว้นกรณีที่กฎหมายกำหนด',
      'สมาชิกมีหน้าที่รักษารหัสผ่านและข้อมูลเข้าสู่ระบบของตนเอง',
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
    <div className="bg-white min-h-screen text-slate-900 font-body flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 px-4 h-16">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-extrabold text-lg tracking-tight">เงื่อนไขการใช้งาน</h1>
      </header>

      <div className="flex-1 px-5 py-6 pb-32 max-w-md mx-auto w-full">

        {/* Top banner */}
        <div className="bg-gradient-to-br from-emerald-800 to-emerald-900 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-emerald-300">description</span>
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-300">Terms & Conditions</span>
            </div>
            <h2 className="text-lg font-extrabold mb-1">เงื่อนไขและข้อตกลงการใช้งาน</h2>
            <p className="text-xs text-emerald-200/80 leading-relaxed">
              {siteName} — โปรดอ่านเงื่อนไขอย่างละเอียดก่อนใช้บริการ
              {serviceHours && <><br />เวลาให้บริการ: {serviceHours}</>}
            </p>
          </div>
        </div>

        {/* Quick Info Bar */}
        {(minDeposit || minWithdraw || minBet) && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {minDeposit && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-emerald-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>savings</span>
                <p className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wide">ฝากขั้นต่ำ</p>
                <p className="text-base font-black text-emerald-900">฿{Number(minDeposit).toLocaleString()}</p>
              </div>
            )}
            {minWithdraw && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-center flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-blue-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                <p className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wide">ถอนขั้นต่ำ</p>
                <p className="text-base font-black text-blue-900">฿{Number(minWithdraw).toLocaleString()}</p>
              </div>
            )}
            {minBet && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center flex flex-col items-center gap-1">
                <span className="material-symbols-outlined text-amber-600 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
                <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wide">แทงขั้นต่ำ</p>
                <p className="text-base font-black text-amber-900">฿{Number(minBet).toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Extra terms from DB (if any) */}
        {extraTerms.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-amber-500 text-[18px]">priority_high</span>
              <p className="text-xs font-extrabold text-amber-700 uppercase tracking-widest">ข้อกำหนดเฉพาะ</p>
            </div>
            <ul className="space-y-2">
              {extraTerms.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 text-xs mt-0.5">●</span>
                  <span className="text-xs text-amber-800 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Sections */}
        <div className="space-y-4">
          {STATIC_SECTIONS.map((section, idx) => (
            <details key={idx} className="group bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
              <summary className="flex items-center gap-3 p-4 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                <div className="size-9 rounded-full bg-white flex items-center justify-center shrink-0 border border-slate-100">
                  <span className="material-symbols-outlined text-primary text-[18px]">{section.icon}</span>
                </div>
                <span className="font-bold text-sm text-slate-800 flex-1">{section.title}</span>
                <span className="material-symbols-outlined text-slate-400 text-[20px] group-open:rotate-180 transition-transform">expand_more</span>
              </summary>
              <div className="px-4 pb-4">
                <ul className="space-y-2.5 ml-12">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary text-[8px] mt-1.5 shrink-0">●</span>
                      <span className="text-xs text-slate-600 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </details>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-[10px] text-slate-400 leading-relaxed">
            การใช้บริการ {siteName} ถือว่าท่านยอมรับเงื่อนไขทั้งหมดข้างต้น
          </p>
          <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
            {siteName} Premium © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Terms;
