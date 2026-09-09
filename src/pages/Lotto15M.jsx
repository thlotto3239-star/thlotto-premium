import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import Lotto15MLiveStudio from '../components/Lotto15MLiveStudio';
import PageWrapper from '../components/PageWrapper';
import AppHeader from '../components/AppHeader';
import { 
  ArrowLeft, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ChevronRight, 
  Trophy, 
  Sparkles,
  Info,
  History,
  CheckCircle2
} from 'lucide-react';

const PAYOUT_RATES = [
  { type: '3 ตัวบน', rate: '900', note: 'บาทละ 900' },
  { type: '3 ตัวโต๊ด', rate: '150', note: 'บาทละ 150' },
  { type: '2 ตัวบน', rate: '95', note: 'บาทละ 95' },
  { type: '2 ตัวล่าง', rate: '95', note: 'บาทละ 95' },
  { type: 'วิ่งบน', rate: '3.2', note: 'บาทละ 3.2' },
  { type: 'วิ่งล่าง', rate: '4.2', note: 'บาทละ 4.2' },
];

export default function Lotto15M() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const marketId = "2ecc136e-0734-4be0-9e26-cf3149cb84cd";
  const [recentSettledRounds, setRecentSettledRounds] = useState([]);

  const handleRoundDataLoaded = (activeRound, allRounds) => {
    if (Array.isArray(allRounds)) {
      const settled = allRounds.filter(r => r.isSettled).slice(-8).reverse();
      setRecentSettledRounds(settled);
    }
  };

  return (
    <PageWrapper>
      {/* Universal Desktop & Mobile Header */}
      <AppHeader />

      {/* Sub-Header Navigation / Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3.5">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="ย้อนกลับหน้าหลัก"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline whitespace-nowrap">ตลาดหวย /</span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 whitespace-nowrap">
                  <span>ล็อตโต้ 15 นาที</span>
                  <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 font-extrabold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium whitespace-nowrap">TH-LOTTO In-House Speed Draw · สัญญาณสดเรียลไทม์</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/betting?draw=${marketId}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all whitespace-nowrap"
            >
              <Flame className="size-3.5" />
              <span>เข้าแทงรอบปัจจุบัน</span>
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Standard Responsive 12-Column Desktop Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Column (8 Cols on PC, 12 on Mobile): Live Studio & Recent Results Table */}
          <div className="lg:col-span-8 space-y-6">
            {/* The Live Studio Component */}
            <Lotto15MLiveStudio 
              marketId={marketId} 
              onSelectRoundCallback={handleRoundDataLoaded}
            />

            {/* Recent 8 Draws Historical Results Table */}
            {recentSettledRounds.length > 0 && (
              <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <History className="size-4.5 text-brand-600" />
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
                      สถิติผลรางวัลย้อนหลัง 8 รอบล่าสุด
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                    อัปเดตอัตโนมัติตลอด 24 ชม.
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-100 font-bold">
                        <th className="py-3 px-4 whitespace-nowrap">รอบเวลา</th>
                        <th className="py-3 px-4 whitespace-nowrap">รอบที่</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">3 ตัวบน</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">2 ตัวบน</th>
                        <th className="py-3 px-4 text-center whitespace-nowrap">2 ตัวล่าง</th>
                        <th className="py-3 px-4 text-right whitespace-nowrap">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentSettledRounds.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap flex items-center gap-1.5">
                            <Clock className="size-3.5 text-slate-400" />
                            <span>{row.time} น.</span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono">
                            รอบที่ {row.round}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-black font-mono text-sm border border-emerald-200/80">
                              {row.top3 || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap font-mono font-bold text-slate-700">
                            {row.top2 || (row.top3 ? row.top3.slice(-2) : '—')}
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-black font-mono text-sm border border-amber-200/80">
                              {row.bottom2 || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle2 className="size-3 text-emerald-600" />
                              <span>ออกผลแล้ว</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quick Features Highlight Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-brand-200 transition-colors">
                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                  <Zap className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 whitespace-nowrap">ออกผลทุก 15 นาที</p>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">วันละ 96 รอบ 24 ชม.</p>
              </div>
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-amber-200 transition-colors">
                <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                  <Trophy className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 whitespace-nowrap">จ่ายบาทละ 900</p>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">2 ตัวจ่ายบาทละ 95</p>
              </div>
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-teal-200 transition-colors">
                <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                  <ShieldCheck className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 whitespace-nowrap">โปร่งใส ตรวจสอบได้</p>
                <p className="text-xs text-slate-500 mt-0.5 whitespace-nowrap">ระบบถ่ายทอดสดอัตโนมัติ</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 Cols on PC): Fast Actions, Payouts & Schedule */}
          <div className="lg:col-span-4 space-y-5">
            {/* Action Card: Direct Betting Portal */}
            <div className="rounded-3xl bg-gradient-to-br from-brand-900 via-brand-950 to-brand-950 p-5 sm:p-6 text-white shadow-xl border border-brand-800/80 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-brand-500/20 blur-2xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-brand-100 ring-1 ring-white/15 whitespace-nowrap">
                    <Sparkles className="size-3.5 text-amber-300" />
                    เปิดรับแทง 24 ชั่วโมง
                  </span>
                  <span className="text-xs text-brand-200 font-mono whitespace-nowrap">รอบละ 15 นาที</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mb-1.5">
                  วางเดิมพันล็อตโต้ 15 นาที
                </h3>
                <p className="text-xs text-brand-200/90 leading-relaxed mb-5">
                  เลือกเลขเด็ด 3 ตัว, 2 ตัว หรือเลขวิ่ง ส่งโพยรวดเร็ว ตัดรอบอัตโนมัติ จ่ายจริง
                </p>
                <Link
                  to={`/betting?draw=${marketId}`}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-brand-950/50 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Flame className="size-4 text-amber-300" />
                  <span>เข้าสู่หน้าแทงหวย</span>
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Payout Rates Table */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                    อัตราจ่ายรางวัล
                  </h4>
                </div>
                <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/60 whitespace-nowrap">
                  สูงสุด 900
                </span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {PAYOUT_RATES.map((item) => (
                  <div key={item.type} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-semibold text-slate-700 whitespace-nowrap">{item.type}</span>
                    <div className="text-right whitespace-nowrap">
                      <span className="font-bold text-brand-700 font-mono">฿{item.rate}</span>
                      <span className="text-xs text-slate-500 ml-1">/ 1 บ.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule & Timing Info */}
            <div className="rounded-3xl bg-white border border-slate-200/90 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-brand-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                  กำหนดการออกผล
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบออกผลสดทุก ๆ 15 นาที ตลอด 24 ชั่วโมง เริ่มตั้งแต่ 00:00 น. ถึง 23:45 น. รวม 96 รอบต่อวัน
              </p>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                <Info className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">ปิดรับแทงก่อนเวลาออกผล 1 นาที และปรับยอดทันทีหลังประกาศผลเสร็จสิ้น</span>
              </div>
            </div>

          </div>
        </div>
      </main>

    </PageWrapper>
  );
}
