import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/AppHeader';
import PageWrapper from '../components/PageWrapper';

const LotteryList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [onlyClosingSoon, setOnlyClosingSoon] = useState(false);
  const [sortBy, setSortBy] = useState('DEFAULT'); // 'DEFAULT' | 'CLOSING_SOON' | 'PAYOUT_HIGH' | 'NAME_ASC'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

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
    if (d > 0) return `${d}วัน ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  // Identification helpers for categories & popular markets
  const isHotMarket = (m) => {
    const name = (m.name || '').toLowerCase();
    const code = (m.code || '').toLowerCase();
    return name.includes('รัฐบาล') || name.includes('15 นาที') || name.includes('ลาวพัฒนา') || name.includes('ฮานอยพิเศษ') || name.includes('ฮานอย vip') || code === 'gov' || code === '15m';
  };

  const isLotto15M = (m) => {
    const name = (m.name || '').toLowerCase();
    const code = (m.code || '').toLowerCase();
    return name.includes('15 นาที') || code === '15m';
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { ALL: lotteries.length, HOT: 0, GOV: 0, FOREIGN: 0, STOCK: 0, '15M': 0 };
    lotteries.forEach(m => {
      if (isHotMarket(m)) counts.HOT++;
      if (m.category === 'GOV') counts.GOV++;
      if (m.category === 'FOREIGN') counts.FOREIGN++;
      if (m.category === 'STOCK') counts.STOCK++;
      if (isLotto15M(m)) counts['15M']++;
    });
    return counts;
  }, [lotteries]);

  const tabs = [
    { label: 'ทั้งหมด', value: 'ALL', icon: 'apps', count: categoryCounts.ALL },
    { label: '🔥 ยอดนิยม', value: 'HOT', icon: 'local_fire_department', count: categoryCounts.HOT },
    { label: '🇹🇭 รัฐบาลไทย', value: 'GOV', icon: 'flag', count: categoryCounts.GOV },
    { label: '🌏 หวยต่างประเทศ', value: 'FOREIGN', icon: 'public', count: categoryCounts.FOREIGN },
    { label: '📈 หวยหุ้น', value: 'STOCK', icon: 'trending_up', count: categoryCounts.STOCK },
    { label: '⚡ ล็อตโต้ 15 นาที', value: '15M', icon: 'bolt', count: categoryCounts['15M'] },
  ];

  // Filtering & Sorting
  const filteredLotteries = useMemo(() => {
    let result = lotteries.filter(market => {
      // Tab Category
      if (activeTab === 'HOT') {
        if (!isHotMarket(market)) return false;
      } else if (activeTab === '15M') {
        if (!isLotto15M(market)) return false;
      } else if (activeTab !== 'ALL') {
        if (market.category !== activeTab) return false;
      }

      // Only Open
      if (onlyOpen && !market.is_open) return false;

      // Only Closing Soon
      const secs = timeLeft[market.id] || 0;
      if (onlyClosingSoon && (!market.is_open || secs <= 0 || secs > 3600)) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = market.name?.toLowerCase().includes(q);
        const codeMatch = market.code?.toLowerCase().includes(q);
        if (!nameMatch && !codeMatch) return false;
      }
      return true;
    });

    // Sorting
    if (sortBy === 'CLOSING_SOON') {
      result = [...result].sort((a, b) => {
        if (!a.is_open && b.is_open) return 1;
        if (a.is_open && !b.is_open) return -1;
        const timeA = timeLeft[a.id] || 99999999;
        const timeB = timeLeft[b.id] || 99999999;
        return timeA - timeB;
      });
    } else if (sortBy === 'PAYOUT_HIGH') {
      result = [...result].sort((a, b) => {
        const payA = Number(a.payout_3top || 900);
        const payB = Number(b.payout_3top || 900);
        return payB - payA;
      });
    } else if (sortBy === 'NAME_ASC') {
      result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
    }

    return result;
  }, [lotteries, activeTab, onlyOpen, onlyClosingSoon, searchQuery, sortBy, timeLeft]);

  // Key KPI stats
  const openCount = useMemo(() => lotteries.filter(m => m.is_open).length, [lotteries]);
  const closingSoonCount = useMemo(() => {
    return lotteries.filter(m => m.is_open && timeLeft[m.id] > 0 && timeLeft[m.id] <= 3600).length;
  }, [lotteries, timeLeft]);

  // Featured Spotlight Markets (Top 3 flagships)
  const spotlightMarkets = useMemo(() => {
    const gov = lotteries.find(m => m.category === 'GOV' || (m.name || '').includes('รัฐบาล'));
    const lotto15 = lotteries.find(m => isLotto15M(m));
    const foreign = lotteries.find(m => (m.name || '').includes('ลาวพัฒนา') || (m.name || '').includes('ฮานอยพิเศษ'));
    return [gov, lotto15, foreign].filter(Boolean);
  }, [lotteries]);

  return (
    <PageWrapper>
      <AppHeader />

      {/* Desktop Fluid Workspace Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5 max-w-[2200px] mx-auto space-y-6">

        {/* ════ TOP HEADER & KPI METRICS (PC Exchange Dashboard Banner) ════ */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-slate-800/80 flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative overflow-hidden">
          {/* Subtle Background Glow Accent */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex items-center gap-4 z-10">
            <button
              onClick={() => navigate(-1)}
              className="size-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 border border-white/10 shrink-0 cursor-pointer backdrop-blur-md"
              title="ย้อนกลับ"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  ตลาดหวยออนไลน์สากล
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  เปิดรับแทงสดตลอด 24 ชั่วโมง
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-normal mt-1.5 max-w-2xl">
                ศูนย์รวมหวยรัฐบาล หวยต่างประเทศ และหวยหุ้นทั่วโลก อัตราจ่ายสูง จ่ายจริง จ่ายไว ถอนเงินอัตโนมัติ 100%
              </p>
            </div>
          </div>

          {/* KPI Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 z-10 shrink-0">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-4 py-3 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">ตลาดทั้งหมด</span>
              <span className="text-xl font-black font-mono text-white">{lotteries.length} <span className="text-xs font-normal text-slate-400">ตลาด</span></span>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl px-4 py-3 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">กำลังเปิดรับแทง</span>
              <span className="text-xl font-black font-mono text-emerald-400">{openCount} <span className="text-xs font-normal text-emerald-300">ตลาด</span></span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl px-4 py-3 text-center sm:text-left col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">ใกล้ปิดรับ (1 ชม.)</span>
              <span className="text-xl font-black font-mono text-amber-400">{closingSoonCount} <span className="text-xs font-normal text-amber-300">ตลาด</span></span>
            </div>
          </div>
        </div>

        {/* ════ SPOTLIGHT / FEATURED SHOWCASE (VIP Flagship Markets) ════ */}
        {spotlightMarkets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                <span>ตลาดแนะนำยอดนิยมระดับพรีเมียม (Featured Flagship Markets)</span>
              </h2>
              <span className="text-xs text-slate-400 font-bold hidden sm:inline">คัดสรรตลาดที่มีผู้เล่นและอัตราจ่ายสูงสุด</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-5">
              {spotlightMarkets.map((market) => {
                const secs = timeLeft[market.id] || 0;
                const isClosingSoon = market.is_open && secs > 0 && secs <= 3600;
                const is15M = isLotto15M(market);

                return (
                  <div
                    key={`spotlight-${market.id}`}
                    onClick={() => {
                      if (market.is_open) {
                        navigate(is15M ? '/lotto-15m' : `/betting?draw=${market.id}`);
                      }
                    }}
                    className={`relative overflow-hidden rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between group shadow-sm ${
                      market.is_open
                        ? 'bg-gradient-to-br from-white via-white to-emerald-50/30 border-emerald-200/80 hover:border-emerald-500/80 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                        : 'bg-white border-slate-200 opacity-75'
                    }`}
                  >
                    {/* VIP Ribbon Badge */}
                    <div className="absolute -right-12 top-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider py-1 w-40 text-center rotate-45 shadow-sm">
                      {is15M ? '⚡ LIVE 24H' : '👑 ยอดนิยม'}
                    </div>

                    <div>
                      {/* Header */}
                      <div className="flex items-center gap-3.5 mb-4 pr-10">
                        <div className="size-13 rounded-2xl bg-white shadow-xs border border-slate-100 p-1 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {market.logo_url ? (
                            <img alt={market.name} className="w-full h-full object-contain rounded-xl" src={market.logo_url} />
                          ) : (
                            <span className="material-symbols-outlined text-emerald-700 text-2xl">confirmation_number</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                            {market.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`size-2 rounded-full ${market.is_open ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`}></span>
                            <span className={`text-xs font-black ${market.is_open ? 'text-emerald-700' : 'text-red-500'}`}>
                              {market.is_open ? 'เปิดรับแทงปกติ' : 'ปิดรับแล้ว'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stats Metric Boxes */}
                      <div className="grid grid-cols-2 gap-2.5 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 mb-4">
                        <div className="text-left">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">อัตราจ่าย 3 ตัว</span>
                          <span className="text-base sm:text-lg font-mono font-black text-emerald-800">
                            ฿{market.payout_3top || '900'}
                          </span>
                        </div>
                        <div className="text-right border-l border-slate-200/70 pl-3">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">นับถอยหลัง</span>
                          <span className={`text-sm sm:text-base font-mono font-black ${isClosingSoon ? 'text-red-600 animate-pulse' : 'text-slate-900'}`}>
                            {formatTime(secs)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      {is15M ? (
                        <>
                          <button
                            disabled={!market.is_open}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/lotto-15m');
                            }}
                            className="flex-1 py-3 rounded-xl font-black text-xs text-white transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/20 active:scale-95 cursor-pointer"
                            style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
                          >
                            <span>เข้าแทงสด</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/lotto-15m');
                            }}
                            className="px-3.5 py-3 rounded-xl font-bold text-xs bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all flex items-center gap-1 active:scale-95 cursor-pointer shrink-0"
                            title="ชมไลฟ์สดสตรีมมิ่ง"
                          >
                            <span className="size-2 rounded-full bg-red-600 animate-ping"></span>
                            <span className="material-symbols-outlined text-base">live_tv</span>
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={!market.is_open}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (market.is_open) navigate(`/betting?draw=${market.id}`);
                          }}
                          className={`w-full py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${
                            market.is_open
                              ? 'text-white shadow-emerald-900/20 active:scale-95 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                          style={market.is_open ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
                        >
                          <span>{market.is_open ? 'แทงเลย' : 'งวดนี้ปิดรับแล้ว'}</span>
                          {market.is_open && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ ADVANCED TOOLBAR: Category Tabs, Search, Sort & View Switcher ════ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          
          {/* Top Row: Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  activeTab === tab.value
                    ? 'text-white shadow-sm font-black ring-1 ring-emerald-500/50'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                }`}
                style={activeTab === tab.value ? { background: 'linear-gradient(135deg, rgb(22,68,30), rgb(13,121,4))' } : {}}
              >
                <span>{tab.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono ${
                  activeTab === tab.value ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom Row: Search, Quick Filters, Sort & View Mode */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาชื่อตลาดหวย (เช่น ลาว, ฮานอย, นิเคอิ)..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-600 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Controls Right */}
            <div className="flex items-center flex-wrap gap-2">
              
              {/* Quick Toggle: Only Open */}
              <button
                onClick={() => setOnlyOpen(!onlyOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                  onlyOpen
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-extrabold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base">{onlyOpen ? 'check_circle' : 'radio_button_unchecked'}</span>
                <span>เฉพาะเปิดรับแทง</span>
              </button>

              {/* Quick Toggle: Only Closing Soon */}
              <button
                onClick={() => setOnlyClosingSoon(!onlyClosingSoon)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer ${
                  onlyClosingSoon
                    ? 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-base text-amber-500">timer</span>
                <span>ใกล้ปิดรับ (1 ชม.)</span>
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs shrink-0">
                <span className="material-symbols-outlined text-slate-400 text-base">sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 outline-none cursor-pointer pr-1"
                >
                  <option value="DEFAULT">เรียงตามค่าเริ่มต้น</option>
                  <option value="CLOSING_SOON">ใกล้ปิดรับที่สุดก่อน</option>
                  <option value="PAYOUT_HIGH">อัตราจ่ายสูงสุดก่อน</option>
                  <option value="NAME_ASC">ชื่อตลาด (ก - ฮ)</option>
                </select>
              </div>

              {/* View Switcher (Grid vs Table) */}
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                  title="มุมมองการ์ด (Grid)"
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-400 hover:text-slate-700'}`}
                  title="มุมมองตาราง (Table)"
                >
                  <span className="material-symbols-outlined text-lg">table_rows</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* ════ MAIN CONTENT AREA (PC Responsive Multi-Column / Table) ════ */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200/80">
            <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดตลาดหวย...</p>
          </div>
        ) : filteredLotteries.length > 0 ? (
          viewMode === 'grid' ? (
            /* True Desktop Responsive Multi-Column Grid (3 to 5 columns balanced) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 xl:gap-5">
              {filteredLotteries.map((draw) => {
                const secs = timeLeft[draw.id] || 0;
                const isClosingSoon = draw.is_open && secs > 0 && secs <= 3600;
                const is15M = isLotto15M(draw);

                return (
                  <div
                    key={draw.id}
                    onClick={() => {
                      if (draw.is_open) {
                        navigate(is15M ? '/lotto-15m' : `/betting?draw=${draw.id}`);
                      }
                    }}
                    className={`bg-white rounded-3xl p-5 border transition-all duration-300 flex flex-col justify-between group ${
                      draw.is_open
                        ? 'border-slate-200/90 hover:border-emerald-400 hover:shadow-lg hover:-translate-y-1 cursor-pointer'
                        : 'border-slate-100 bg-slate-50/60 opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Flag/Icon + Title + Category Tag */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="size-12 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100 p-1 shrink-0 group-hover:scale-105 transition-transform">
                          {draw.logo_url ? (
                            <img alt={draw.name} className="w-full h-full object-contain rounded-xl" src={draw.logo_url} />
                          ) : (
                            <span className="material-symbols-outlined text-emerald-700 text-2xl">confirmation_number</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                            {draw.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              draw.is_open
                                ? isClosingSoon
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                draw.is_open
                                  ? isClosingSoon
                                    ? 'bg-amber-500 animate-ping'
                                    : 'bg-emerald-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}></span>
                              {draw.is_open ? (isClosingSoon ? 'ใกล้ปิดรับ' : 'เปิดรับแทง') : 'ปิดรับแล้ว'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold">
                              {draw.category === 'GOV' ? '🇹🇭 รัฐบาล' : draw.category === 'FOREIGN' ? '🌏 ต่างประเทศ' : '📈 หุ้น'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle Stats: Rate & Countdown */}
                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/90 rounded-2xl border border-slate-100 mb-4 text-center">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">อัตราจ่าย 3 ตัว</p>
                          <p className="text-sm font-mono font-black text-emerald-800 mt-0.5">฿{draw.payout_3top || '900'}</p>
                        </div>
                        <div className="border-l border-slate-200/70 pl-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ปิดรับใน</p>
                          <p className={`text-xs font-mono font-black mt-0.5 truncate ${isClosingSoon ? 'text-red-600 animate-pulse font-extrabold' : 'text-slate-800'}`}>
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
                        if (draw.is_open) {
                          navigate(is15M ? '/lotto-15m' : `/betting?draw=${draw.id}`);
                        }
                      }}
                      className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                        draw.is_open
                          ? 'text-white active:scale-95 cursor-pointer shadow-emerald-900/10 hover:shadow-md'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      style={draw.is_open ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
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
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">ตลาดหวย</th>
                      <th className="px-6 py-4">หมวดหมู่</th>
                      <th className="px-6 py-4">สถานะการรับแทง</th>
                      <th className="px-6 py-4 text-center">เวลานับถอยหลัง</th>
                      <th className="px-6 py-4 text-right">อัตราจ่าย 3 ตัว</th>
                      <th className="px-6 py-4 text-right">การดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLotteries.map((draw) => {
                      const secs = timeLeft[draw.id] || 0;
                      const isClosingSoon = draw.is_open && secs > 0 && secs <= 3600;
                      const is15M = isLotto15M(draw);

                      return (
                        <tr key={draw.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="size-10 rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center p-1 border border-slate-100 shrink-0">
                                {draw.logo_url ? (
                                  <img alt={draw.name} className="w-full h-full object-contain rounded-lg" src={draw.logo_url} />
                                ) : (
                                  <span className="material-symbols-outlined text-emerald-700 text-xl">confirmation_number</span>
                                )}
                              </div>
                              <span className="font-extrabold text-slate-900 text-sm">{draw.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-500">
                            {draw.category === 'GOV' ? '🇹🇭 รัฐบาลไทย' : draw.category === 'FOREIGN' ? '🌏 หวยต่างประเทศ' : '📈 หวยหุ้น'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              draw.is_open
                                ? isClosingSoon
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                              <span className={`size-1.5 rounded-full ${
                                draw.is_open
                                  ? isClosingSoon
                                    ? 'bg-amber-500 animate-ping'
                                    : 'bg-emerald-500 animate-pulse'
                                  : 'bg-slate-400'
                              }`}></span>
                              {draw.is_open ? (isClosingSoon ? 'ใกล้ปิดรับ' : 'เปิดรับแทง') : 'ปิดรับแล้ว'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold">
                            <span className={isClosingSoon ? 'text-red-600 animate-pulse font-black' : 'text-slate-700'}>
                              {formatTime(secs)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-black text-emerald-800 text-sm">
                            ฿{draw.payout_3top || '900'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={!draw.is_open}
                              onClick={() => {
                                if (draw.is_open) {
                                  navigate(is15M ? '/lotto-15m' : `/betting?draw=${draw.id}`);
                                }
                              }}
                              className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                                draw.is_open
                                  ? 'text-white active:scale-95 cursor-pointer shadow-xs'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              style={draw.is_open ? { background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' } : {}}
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
