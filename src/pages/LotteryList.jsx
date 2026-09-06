import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/AppHeader';
import PageWrapper from '../components/PageWrapper';

const LotteryList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  const tabs = [
    { label: 'ทั้งหมด', value: 'ทั้งหมด', icon: 'apps' },
    { label: 'สลากกินแบ่งรัฐบาล', value: 'GOV', icon: 'account_balance' },
    { label: 'หวยต่างประเทศ', value: 'FOREIGN', icon: 'public' },
    { label: 'หวยหุ้นรายวัน', value: 'STOCK', icon: 'trending_up' },
  ];

  useEffect(() => {
    const fetchLotteries = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_markets_with_countdown');
        if (error) throw error;
        setLotteries(data || []);

        const initialTimeLeft = {};
        (data || []).forEach(market => {
          if (market.next_close_time) {
            const secs = Math.max(0, Math.floor((new Date(market.next_close_time) - Date.now()) / 1000));
            initialTimeLeft[market.id] = secs;
          } else {
            initialTimeLeft[market.id] = 0;
          }
        });
        setTimeLeft(initialTimeLeft);
      } catch (err) {
        console.error('Error fetching lotteries:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLotteries();

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => { next[id] = Math.max(0, next[id] - 1); });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'ปิดรับแล้ว';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}ว ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const filteredLotteries = lotteries.filter(market => {
    const matchTab = activeTab === 'ทั้งหมด' || market.category === tabs.find(t => t.label === activeTab || t.value === activeTab)?.value;
    const matchSearch = !searchQuery.trim() || market.name.toLowerCase().includes(searchQuery.toLowerCase()) || (market.code && market.code.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchTab && matchSearch;
  });

  const getCategoryCount = (val) => {
    if (val === 'ทั้งหมด') return lotteries.length;
    return lotteries.filter(m => m.category === val).length;
  };

  return (
    <PageWrapper>
      <AppHeader />

      {/* Page Breadcrumb / Top Bar */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>รายการหวยทั้งหมด</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {filteredLotteries.length} ตลาด
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">เปิดรับแทง 24 ชม. อัตราจ่ายสูงสุด 3 ตัวตรง ฿900 - ฿1,100</p>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อตลาดหวย..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-3 py-1.5 rounded-xl">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold">ระบบรับแทงเปิดทำการ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Layout Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 1: LEFT SIDEBAR (Category Switcher & Quick Navigation)
              ════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-3 xl:col-span-3 space-y-4">
            {/* Category Filter Menu */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-600">tune</span>
                หมวดหมู่หวย
              </h2>
              <div className="space-y-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.value;
                  const count = getCategoryCount(tab.value);
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setActiveTab(tab.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white shadow-xs font-extrabold'
                          : 'bg-slate-50/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>
                          {tab.icon}
                        </span>
                        <span className="truncate">{tab.label}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instant Lottery Quick Banner */}
            <div className="rounded-3xl p-5 text-white relative overflow-hidden shadow-md group cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #16441e 0%, #0d7904 100%)' }}
                 onClick={() => navigate('/instant-lottery')}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="size-2 rounded-full bg-red-400 animate-ping"></span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">เกมสดออกผลไว</span>
                </div>
                <h3 className="text-base font-extrabold">หวยไทย 1 นาที (Instant)</h3>
                <p className="text-white/80 text-xs mt-1">ออกผลทุก 60 วินาที ลุ้นรางวัลได้ตลอด 24 ชั่วโมง</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-black text-amber-300">จ่าย 3 ตัว ฿900</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-white text-emerald-900 px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-emerald-50 transition-colors">
                    เข้าห้องเดิมพัน
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-6 opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-8xl">timer</span>
              </div>
            </div>

            {/* Security Guarantee Card */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800">ระบบมาตรฐานสากล</h4>
                  <p className="text-[11px] text-slate-400">ฝาก-ถอนออโต้ จ่ายตรงเต็มจำนวน</p>
                </div>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                <span>อัตราจ่ายสูงสุดในไทย</span>
                <span className="text-emerald-700 font-bold">100% Guaranteed</span>
              </div>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 2: CENTER WORKSPACE (Lottery Markets 2-Column Grid)
              ════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-9 xl:col-span-6 space-y-4">
            {/* Header info */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  {activeTab === 'ทั้งหมด' ? 'ตลาดหวยทั้งหมด' : `หมวดหมู่: ${activeTab}`}
                </span>
                <span className="text-xs text-slate-400 font-medium">({filteredLotteries.length} รายการ)</span>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  ล้างคำค้นหา
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="w-10 h-10 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดตลาดหวย...</p>
              </div>
            ) : filteredLotteries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredLotteries.map((draw) => {
                  const remaining = timeLeft[draw.id] || 0;
                  const isUrgent = remaining <= 3600 && remaining > 0;
                  return (
                    <div
                      key={draw.id}
                      onClick={() => { if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                      className={`bg-white rounded-3xl p-4.5 border border-slate-200/80 group transition-all duration-200 shadow-2xs hover:shadow-md hover:border-emerald-300 flex flex-col justify-between ${
                        draw.is_open ? 'cursor-pointer active:scale-[0.99]' : 'cursor-not-allowed opacity-75'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2.5 mb-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-12 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                              {draw.logo_url ? (
                                <img alt={draw.name} className="w-full h-full object-cover" src={draw.logo_url} />
                              ) : (
                                <span className="material-symbols-outlined text-emerald-700 text-2xl">confirmation_number</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                                {draw.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`size-2 rounded-full ${draw.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                                <span className={`text-[11px] font-bold ${draw.is_open ? 'text-emerald-600' : 'text-red-500'}`}>
                                  {draw.is_open ? 'เปิดรับแทง' : 'ปิดรับแล้ว'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">3 ตัวตรง</p>
                            <p className="text-xs font-black text-slate-900">
                              บาทละ <span className="text-emerald-700 font-mono">{draw.payout_3top || '900'}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        <div className="flex flex-col">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">ปิดรับใน</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`material-symbols-outlined text-base ${isUrgent ? 'text-red-500 animate-pulse' : 'text-slate-600'}`}>schedule</span>
                            <span className={`font-mono font-extrabold text-xs sm:text-sm ${isUrgent ? 'text-red-600' : 'text-slate-700'}`}>
                              {formatTime(remaining)}
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={!draw.is_open}
                          onClick={(e) => { e.stopPropagation(); if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                          className={`px-5 sm:px-6 py-2 rounded-xl font-extrabold text-xs transition-all shadow-xs ${
                            draw.is_open
                              ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white active:scale-95 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {draw.is_open ? 'แทงเลย' : 'ปิดรับแล้ว'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200/70 p-8">
                <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">search_off</span>
                </div>
                <p className="text-sm font-extrabold text-slate-800">ไม่พบตลาดหวยที่ค้นหา</p>
                <p className="text-xs text-slate-400">ลองค้นหาด้วยชื่ออื่น หรือเปลี่ยนหมวดหมู่</p>
              </div>
            )}
          </main>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 3: RIGHT PANEL (Highest Payouts, Rules & VIP Support)
              ════════════════════════════════════════════════════════════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Highest Payout Rates Vertical Table */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  อัตราจ่ายสูงสุด
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  มาตรฐาน
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { name: '6 ตัวตรง (รัฐบาล)', pay: '2,000,000', badge: 'รางวัลใหญ่', accent: true },
                  { name: '3 ตัวบนตรง', pay: '900 - 1,100', badge: 'ยอดนิยม', accent: true },
                  { name: '3 ตัวโต๊ด', pay: '150', badge: null },
                  { name: '3 ตัวหน้า / ท้าย', pay: '450', badge: null },
                  { name: '2 ตัวบน - ล่าง', pay: '95 - 100', badge: 'เล่นง่าย' },
                  { name: 'วิ่งบน', pay: '3.2', badge: null },
                  { name: 'วิ่งล่าง', pay: '4.2', badge: null },
                ].map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-700">{item.name}</span>
                      {item.badge && (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                          item.accent ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-right font-mono font-extrabold">
                      <span className={item.accent ? 'text-emerald-700' : 'text-slate-800'}>
                        ฿{item.pay}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lotto 15M Live Studio Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 border border-slate-700/60 shadow-md relative overflow-hidden group cursor-pointer"
                 onClick={() => navigate('/lotto-15m')}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide">
                    <span className="size-1.5 rounded-full bg-white animate-pulse"></span>
                    LIVE STUDIO
                  </span>
                  <span className="text-[11px] text-slate-300 font-semibold">ห้องถ่ายทอดสด</span>
                </div>
                <h4 className="text-base font-extrabold text-white">ล็อตโต้ 15 นาที ถ่ายทอดสด</h4>
                <p className="text-slate-300 text-xs mt-1">รับชมการออกรางวัลผ่านสตรีมสดคมชัด พร้อมลงเดิมพันได้ทันที</p>
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">รอบถัดไปเร็วๆ นี้</span>
                  <span className="text-xs font-extrabold text-white group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    เข้าสู่ห้องสด <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </span>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined text-7xl">videocam</span>
              </div>
            </div>

            {/* Customer Care Hotline */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-xl">headset_mic</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-emerald-950">บริการสมาชิก 24 ชม.</h4>
                  <p className="text-[11px] text-emerald-700 font-medium">สอบถามผลรางวัลหรือแจ้งปัญหา</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/support')}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100/60 transition-colors cursor-pointer"
              >
                ติดต่อ
              </button>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default LotteryList;
