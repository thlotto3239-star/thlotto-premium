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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden border border-emerald-500/30 shadow-2xl shadow-emerald-950/60"
        style={{
          background: 'radial-gradient(ellipse at top, #064e3b 0%, #032318 60%, #02120d 100%)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-emerald-500/20 bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-300/40">
              <span className="material-icons text-white text-xl">menu_book</span>
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base tracking-wide flex items-center gap-2">
                กติกาและอัตราจ่าย
                <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 font-bold">
                  TH-LOTTO 15M
                </span>
              </h3>
              <p className="text-emerald-300/70 text-xs">มาตรฐานการคิดเงินและรอบเวลาการออกรางวัล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white flex items-center justify-center transition-colors"
          >
            <span className="material-icons text-sm">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-2 bg-emerald-950/60 gap-2 border-b border-emerald-500/20">
          {RULE_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === cat.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-900/40 ring-1 ring-emerald-300/30'
                  : 'text-emerald-300/60 hover:text-emerald-200 hover:bg-white/5'
              }`}
            >
              <span className="material-icons text-[16px]">{cat.icon}</span>
              <span>{cat.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto p-5 space-y-4 text-emerald-100/90 text-xs">
          {activeTab === 'types' && (
            <div className="space-y-3">
              {RULE_CATEGORIES[0].rules.map((rule, idx) => (
                <div 
                  key={idx}
                  className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-900/20 hover:bg-emerald-900/30 transition-all backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        {rule.name}
                      </h4>
                      <p className="text-emerald-200/80 text-xs mt-0.5">{rule.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-emerald-400 block font-semibold">อัตราจ่าย</span>
                      <span className="text-base font-black text-amber-400">บาทละ {rule.rate}</span>
                    </div>
                  </div>

                  {/* Visual Ball Example */}
                  <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-emerald-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-emerald-300/70 mr-1">ตัวอย่าง:</span>
                      {rule.example.result.map((n, i) => (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 text-white font-extrabold flex items-center justify-center text-xs shadow-inner shadow-black/40 border border-emerald-300/50"
                        >
                          {n}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] text-emerald-300/80 italic">
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
                  className="rounded-2xl p-4 border border-emerald-500/20 bg-emerald-900/20 flex gap-3.5 items-start"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/30">
                    <span className="font-extrabold text-xs">{idx + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs mb-1">{item.title}</h4>
                    <p className="text-emerald-200/70 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-500/20 bg-emerald-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-emerald-400/80">
            <span className="material-icons text-[14px]">verified</span>
            <span>ระบบคำนวณและจ่ายรางวัลอัตโนมัติ 100%</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full font-bold text-xs bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/40 active:scale-95 transition-all"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
