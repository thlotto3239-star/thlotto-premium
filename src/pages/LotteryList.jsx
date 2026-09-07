import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/AppHeader';
import PageWrapper from '../components/PageWrapper';

const LotteryList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  const tabs = [
    { label: 'ทั้งหมด', value: 'ทั้งหมด' },
    { label: 'รัฐบาลไทย', value: 'GOV' },
    { label: 'หวยต่างประเทศ', value: 'FOREIGN' },
    { label: 'หวยหุ้น', value: 'STOCK' },
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

  const filteredLotteries = useMemo(() => {
    return lotteries.filter(market => {
      // Category match
      if (activeTab !== 'ทั้งหมด') {
        const matched = tabs.find(t => t.label === activeTab || t.value === activeTab)?.value;
        if (market.category !== matched) return false;
      }
      // Only open filter
      if (onlyOpen && !market.is_open) return false;
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = market.name?.toLowerCase().includes(q);
        const codeMatch = market.code?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }
      return true;
    });
  }, [lotteries, activeTab, onlyOpen, searchQuery]);

  // Quick stats calculation
  const openCount = useMemo(() => lotteries.filter(m => m.is_open).length, [lotteries]);
  const closingSoonCount = useMemo(() => {
    return lotteries.filter(m => m.is_open && timeLeft[m.id] > 0 && timeLeft[m.id] <= 3600).length;
  }, [lotteries, timeLeft]);

  return (
    <PageWrapper>
      <AppHeader />

      {/* Desktop Fluid Workspace Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 max-w-[2200px] mx-auto space-y-6">

        {/* ════ TOP HEADER & KPI METRICS (PC Dashboard Grid) ════ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="size-11 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-all active:scale-95 border border-slate-200/60 shrink-0"
              title="ย้อนกลับ"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  ตลาดหวยทั้งหมด
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  เปิดรับแทงสด 24 ชม.
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                เลือกตลาดหวยที่ต้องการแทง อัตราจ่ายสูง จ่ายจริง จ่ายไว ไม่มีเลขอั้น
              </p>
            </div>
          </div>

          {/* KPI Mini-Cards (Visible on Desktop / Tablet) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">ตลาดทั้งหมด</span>
              <span className="text-lg font-black font-mono text-slate-900">{lotteries.length} <span className="text-xs font-normal text-slate-500">ตลาด</span></span>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl px-4 py-2.5 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">กำลังเปิดรับแทง</span>
              <span className="text-lg font-black font-mono text-emerald-700">{openCount} <span className="text-xs font-normal text-emerald-600">ตลาด</span></span>
            </div>
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl px-4 py-2.5 text-center sm:text-left col-span-2 sm:col-span-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block">ใกล้ปิดรับ (1 ชม.)</span>
              <span className="text-lg font-black font-mono text-amber-700">{closingSoonCount} <span className="text-xs font-normal text-amber-600">ตลาด</span></span>
            </div>
          </div>
        </div>

        {/* ════ ADVANCED PC TOOLBAR: Search, Category Tabs & View Switcher ════ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          
          {/* Left: Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 xl:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.value
                    ? 'bg-brand-600 text-white shadow-xs font-black'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Right: Search, Filter Toggle, View Switcher */}
          <div className="flex items-center flex-wrap sm:flex-nowrap gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อตลาดหวย..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle Only Open */}
            <button
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                onlyOpen
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{onlyOpen ? 'check_box' : 'check_box_outline_blank'}</span>
              <span>เฉพาะที่เปิดอยู่</span>
            </button>

            {/* View Mode Toggle (Grid vs Table on PC) */}
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="มุมมองการ์ด (Grid)"
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white text-brand-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                title="มุมมองตาราง (Table)"
              >
                <span className="material-symbols-outlined text-lg">table_rows</span>
              </button>
            </div>
          </div>
        </div>

        {/* ════ MAIN CONTENT AREA (PC Responsive Multi-Column / Table) ════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200/80">
            <div className="w-10 h-10 border-3 border-brand-600/20 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดตลาดหวย...</p>
          </div>
        ) : filteredLotteries.length > 0 ? (
          viewMode === 'grid' ? (
            /* True Desktop Responsive Multi-Column Grid (Up to 6 columns on Ultrawide/QHD) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 xl:gap-5">
              {filteredLotteries.map((draw) => {
                const secs = timeLeft[draw.id] || 0;
                const isClosingSoon = draw.is_open && secs > 0 && secs <= 3600;

                return (
                  <div
                    key={draw.id}
                    onClick={() => { if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-200 flex flex-col justify-between group ${
                      draw.is_open
                        ? 'border-slate-200/80 hover:border-brand-300 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                        : 'border-slate-100 bg-slate-50/60 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Icon + Name + Category */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="size-12 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                          {draw.logo_url ? (
                            <img alt={draw.name} className="w-full h-full object-cover" src={draw.logo_url} />
                          ) : (
                            <span className="material-symbols-outlined text-brand-600 text-2xl">confirmation_number</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                            {draw.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`size-2 rounded-full ${draw.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                            <span className={`text-[11px] font-bold ${draw.is_open ? 'text-emerald-600' : 'text-red-500'}`}>
                              {draw.is_open ? 'เปิดรับแทง' : 'ปิดรับแล้ว'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Stats: Rate & Countdown */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อัตราจ่าย 3 ตัว</p>
                          <p className="text-xs font-mono font-black text-brand-700">฿{draw.payout_3top || '900'}</p>
                        </div>
                        <div className="border-l border-slate-200/60 pl-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ปิดรับใน</p>
                          <p className={`text-xs font-mono font-black ${isClosingSoon ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
                            {formatTime(secs)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Button */}
                    <button
                      disabled={!draw.is_open}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (draw.is_open) navigate(`/betting?draw=${draw.id}`);
                      }}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        draw.is_open
                          ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95 cursor-pointer group-hover:shadow-md'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <span>{draw.is_open ? 'แทงเลย' : 'ปิดรับแล้ว'}</span>
                      {draw.is_open && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop High-Density Data Table View */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">ตลาดหวย</th>
                      <th className="px-6 py-4">หมวดหมู่</th>
                      <th className="px-6 py-4">สถานะ</th>
                      <th className="px-6 py-4 text-center">เวลานับถอยหลัง</th>
                      <th className="px-6 py-4 text-right">อัตราจ่าย 3 ตัว</th>
                      <th className="px-6 py-4 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLotteries.map((draw) => {
                      const secs = timeLeft[draw.id] || 0;
                      const isClosingSoon = draw.is_open && secs > 0 && secs <= 3600;

                      return (
                        <tr key={draw.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                {draw.logo_url ? (
                                  <img alt={draw.name} className="w-full h-full object-cover" src={draw.logo_url} />
                                ) : (
                                  <span className="material-symbols-outlined text-brand-600 text-xl">confirmation_number</span>
                                )}
                              </div>
                              <span className="font-extrabold text-slate-900 text-sm">{draw.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500">
                            {draw.category === 'GOV' ? 'รัฐบาลไทย' : draw.category === 'FOREIGN' ? 'หวยต่างประเทศ' : 'หวยหุ้น'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              draw.is_open ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
                            }`}>
                              <span className={`size-1.5 rounded-full ${draw.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                              {draw.is_open ? 'เปิดรับแทง' : 'ปิดรับแล้ว'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold">
                            <span className={isClosingSoon ? 'text-red-600 animate-pulse' : 'text-slate-700'}>
                              {formatTime(secs)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-black text-brand-600 text-sm">
                            ฿{draw.payout_3top || '900'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={!draw.is_open}
                              onClick={() => { if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                              className={`px-5 py-1.5 rounded-xl font-bold text-xs transition-all ${
                                draw.is_open
                                  ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95 cursor-pointer shadow-xs'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {draw.is_open ? 'เข้าแทง' : 'ปิดรับ'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200/70 p-8 max-w-md mx-auto">
            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-3xl">confirmation_number</span>
            </div>
            <p className="text-sm font-extrabold text-slate-800">ไม่มีหวยเปิดรับแทงในเงื่อนไขนี้</p>
            <p className="text-xs text-slate-400">กรุณาลองเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่</p>
          </div>
        )}

      </div>
    </PageWrapper>
  );
};

export default LotteryList;
