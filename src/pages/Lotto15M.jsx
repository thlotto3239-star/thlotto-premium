import React from 'react';
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
  Info
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
  const balance = Math.floor(profile?.balance ?? 0);
  const marketId = "2ecc136e-0734-4be0-9e26-cf3149cb84cd";

  return (
    <PageWrapper>
      {/* Universal Desktop & Mobile Header */}
      <AppHeader />

      {/* Sub-Header Navigation / Breadcrumb */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="ย้อนกลับหน้าหลัก"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400 hidden sm:inline">ตลาดหวย /</span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  ล็อตโต้ 15 นาที
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-300 font-extrabold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                    LIVE
                  </span>
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">TH-LOTTO In-House Speed Draw · สัญญาณสดเรียลไทม์</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/betting?draw=${marketId}`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
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
          
          {/* Main Column (8 Cols on PC, 12 on Mobile): Live Studio & Animation */}
          <div className="lg:col-span-8 space-y-6">
            {/* The Live Studio Component */}
            <Lotto15MLiveStudio marketId={marketId} />

            {/* Quick Features Highlight Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-brand-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-2">
                  <Zap className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">ออกผลทุก 15 นาที</p>
                <p className="text-[11px] text-slate-500 mt-0.5">วันละ 96 รอบ 24 ชม.</p>
              </div>
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-amber-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-2">
                  <Trophy className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">จ่ายบาทละ 900</p>
                <p className="text-[11px] text-slate-500 mt-0.5">2 ตัวจ่ายบาทละ 95</p>
              </div>
              <div className="rounded-2xl p-4 bg-white border border-slate-200/80 shadow-xs text-center flex flex-col items-center hover:border-teal-200 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-2">
                  <ShieldCheck className="size-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">โปร่งใส ตรวจสอบได้</p>
                <p className="text-[11px] text-slate-500 mt-0.5">ระบบสุ่มเข้ารหัสมาตรฐาน</p>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (4 Cols on PC): Fast Actions, Payouts & Schedule */}
          <div className="lg:col-span-4 space-y-5">
            {/* Action Card: Direct Betting Portal */}
            <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-950 p-5 text-white shadow-md border border-brand-800/60 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 size-28 rounded-full bg-brand-500/20 blur-xl" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-[11px] font-semibold text-brand-100 ring-1 ring-white/15">
                    <Sparkles className="size-3 text-amber-300" />
                    เปิดรับแทง 24 ชั่วโมง
                  </span>
                  <span className="text-[11px] text-brand-200 font-mono">รอบละ 15 นาที</span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white mb-1">
                  วางเดิมพันล็อตโต้ 15 นาที
                </h3>
                <p className="text-xs text-brand-200/90 leading-relaxed mb-4">
                  เลือกเลขเด็ด 3 ตัว, 2 ตัว หรือเลขวิ่ง ส่งโพยเร็ว ตัดรอบอัตโนมัติ
                </p>
                <Link
                  to={`/betting?draw=${marketId}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-md transition-all cursor-pointer"
                >
                  <Flame className="size-4" />
                  <span>เข้าสู่หน้าแทงหวย</span>
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Payout Rates Table */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Trophy className="size-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    อัตราจ่ายรางวัล
                  </h4>
                </div>
                <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full">
                  สูงสุด 900
                </span>
              </div>
              <div className="mt-3 divide-y divide-slate-100">
                {PAYOUT_RATES.map((item) => (
                  <div key={item.type} className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">{item.type}</span>
                    <div className="text-right">
                      <span className="font-bold text-brand-700 font-mono">฿{item.rate}</span>
                      <span className="text-[10px] text-slate-400 ml-1">/ 1 บ.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule & Timing Info */}
            <div className="rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-brand-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  กำหนดการออกผล
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                ระบบออกผลทุก ๆ 15 นาที เริ่มรอบแรกเวลา 06:00 น. จนถึงรอบสุดท้าย 20:30 น. ของทุกวัน รวม 58 รอบ
              </p>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 text-[11px] text-slate-600 flex items-start gap-2">
                <Info className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <span>ปิดรับแทงก่อนเวลาออกผล 1 นาที และปรับยอดทันทีหลังประกาศผลเสร็จสิ้น</span>
              </div>
            </div>

          </div>
        </div>
      </main>

    </PageWrapper>
  );
}
