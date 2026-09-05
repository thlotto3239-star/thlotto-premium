import React, { useState } from 'react';

const RULE_CATEGORIES = [
  {
    id: 'types',
    title: 'รูปแบบการแทงและตัวอย่าง',
    icon: 'casino',
    rules: [
      {
        name: '3 ตัวบน (3 ตัวตรง)',
        rate: '900',
        desc: 'ทายตัวเลข 3 ตัวท้ายของรางวัลที่ 1 ให้ตรงทั้งตัวเลขและตำแหน่ง',
        example: {
          result: ['0', '3', '6'],
          won: ['0', '3', '6'],
          note: 'เลขออก 036 ซื้อ 036 = ถูกรางวัล รับ 900 บาท/บาท'
        }
      },
      {
        name: '3 ตัวโต๊ด',
        rate: '150',
        desc: 'ทายตัวเลข 3 ตัวบน โดยตัวเลขตรงกันแต่สลับตำแหน่งกันได้ทุกตำแหน่ง',
        example: {
          result: ['0', '3', '6'],
          won: ['063', '306', '360', '603', '630'],
          note: 'เลขออก 036 ซื้อสลับตำแหน่ง = ถูกรางวัล รับ 150 บาท/บาท'
        }
      },
      {
        name: '2 ตัวบน',
        rate: '95',
        desc: 'ทายตัวเลข 2 ตัวท้ายของรางวัล 3 ตัวบน ให้ตรงทั้งตัวเลขและตำแหน่ง',
        example: {
          result: ['3', '6'],
          won: ['3', '6'],
          note: 'เลขออก 036 -> 2 ตัวบนคือ 36 รับ 95 บาท/บาท'
        }
      },
      {
        name: '2 ตัวล่าง',
        rate: '95',
        desc: 'ทายตัวเลข 2 ตัวล่าง ให้ตรงทั้งตัวเลขและตำแหน่ง',
        example: {
          result: ['8', '0'],
          won: ['8', '0'],
          note: 'เลขออก 80 ซื้อ 80 = ถูกรางวัล รับ 95 บาท/บาท'
        }
      },
      {
        name: 'วิ่งบน',
        rate: '3.2',
        desc: 'ซื้อเลขหลักเดียว หากมีเลขนั้นปรากฏอยู่ใน 3 ตัวบนตำแหน่งใดก็ได้',
        example: {
          result: ['0', '3', '6'],
          won: ['0 หรือ 3 หรือ 6'],
          note: 'เลขออก 036 ซื้อวิ่งบน 3 หรือ 6 = ถูกรางวัล รับ 3.2 บาท/บาท'
        }
      },
      {
        name: 'วิ่งล่าง',
        rate: '4.2',
        desc: 'ซื้อเลขหลักเดียว หากมีเลขนั้นปรากฏอยู่ใน 2 ตัวล่างตำแหน่งใดก็ได้',
        example: {
          result: ['8', '0'],
          won: ['8 หรือ 0'],
          note: 'เลขออก 80 ซื้อวิ่งล่าง 8 หรือ 0 = ถูกรางวัล รับ 4.2 บาท/บาท'
        }
      }
    ]
  },
  {
    id: 'schedule',
    title: 'กติกาและรอบเวลาออกรางวัล',
    icon: 'schedule',
    details: [
      {
        title: 'ความถี่ในการออกรางวัล',
        desc: 'ล็อตโต้ 15 นาที ออกรางวัลทุกๆ 15 นาที ตลอด 24 ชั่วโมง รวมทั้งหมด 58 รอบต่อวัน'
      },
      {
        title: 'เวลาปิดรับแทง',
        desc: 'ระบบปิดรับแทงก่อนเวลาออกผลรางวัล 1 นาทีในแต่ละรอบ (เช่น รอบ 15:45 น. ปิดรับแทงเวลา 15:44 น.)'
      },
      {
        title: 'การยกเลิกโพย',
        desc: 'สมาชิกสามารถยกเลิกโพยด้วยตนเองได้ก่อนเวลาปิดรับแทงอย่างน้อย 5 นาที'
      },
      {
        title: 'การคิดเงินและจ่ายรางวัล',
        desc: 'ระบบคำนวณผลและปรับยอดเครดิตเข้ากระเป๋าเงินทันทีหลังจากการออกผลรางวัลเสร็จสิ้นภายใน 15 วินาที'
      },
      {
        title: 'กรณีขัดข้องจากสัญญาณต้นทาง',
        desc: 'หากเกิดปัญหาการถ่ายทอดสดขัดข้องจากศูนย์ออกรางวัล ระบบจะทำการคืนยอดเดิมพันเข้าสู่กระเป๋าเงินของสมาชิกเต็มจำนวนโดยอัตโนมัติ'
      }
    ]
  }
];

export default function LottoRulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('types');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-2xl text-slate-800"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
              <span className="material-icons text-xl">menu_book</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-2">
                กติกาและอัตราจ่าย
                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                  TH-LOTTO 15M
                </span>
              </h3>
              <p className="text-slate-500 text-xs">มาตรฐานการคิดเงินและรอบเวลาการออกรางวัล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-slate-50 gap-2 border-b border-slate-100">
          {RULE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === cat.id
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200/80 font-bold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
              }`}
            >
              <span className="material-icons text-[16px]">{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 space-y-3 text-slate-700 text-xs">
          {activeTab === 'types' && (
            <div className="space-y-3">
              {RULE_CATEGORIES[0].rules.map((rule, idx) => (
                <div 
                  key={idx}
                  className="rounded-2xl p-4 border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                        {rule.name}
                      </h4>
                      <p className="text-slate-500 text-xs mt-0.5">{rule.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-medium">อัตราจ่าย</span>
                      <span className="text-base font-extrabold text-emerald-600">บาทละ {rule.rate}</span>
                    </div>
                  </div>

                  {/* Visual Ball Example */}
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-medium mr-1">ตัวอย่าง:</span>
                      {rule.example.result.map((n, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700 text-white font-bold flex items-center justify-center text-xs shadow-2xs"
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {rule.example.note}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="space-y-3">
              {RULE_CATEGORIES[1].details.map((item, idx) => (
                <div 
                  key={idx}
                  className="rounded-2xl p-4 border border-slate-200 bg-slate-50/50 flex gap-3.5 items-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1">{item.title}</h4>
                    <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="material-icons text-emerald-600 text-sm">verified</span>
            <span>ระบบคำนวณและจ่ายรางวัลอัตโนมัติ 100%</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs active:scale-95 transition-all"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
