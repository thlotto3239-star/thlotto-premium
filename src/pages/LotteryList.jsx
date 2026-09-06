import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/AppHeader';
import PageWrapper from '../components/PageWrapper';

const LotteryList = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ทั้งหมด');
  const [lotteries, setLotteries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState({});

  const tabs = [
    { label: 'ทั้งหมด', value: 'ทั้งหมด' },
    { label: 'รัฐบาล', value: 'GOV' },
    { label: 'ต่างประเทศ', value: 'FOREIGN' },
    { label: 'หุ้น', value: 'STOCK' },
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
    if (activeTab === 'ทั้งหมด') return true;
    return market.category === tabs.find(t => t.label === activeTab || t.value === activeTab)?.value;
  });

  return (
    <PageWrapper>
      <AppHeader />

      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>รายการหวยทั้งหมด</span>
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60 hidden sm:inline">
                  {filteredLotteries.length} ตลาด
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">เปิดรับแทง 24 ชม. อัตราจ่ายมาตรฐานสูงสุด</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-600 hidden sm:inline">ระบบรับแทงเปิดทำการปกติ</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs Container */}
      <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-5 py-2 rounded-xl font-bold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === tab.value
                  ? 'bg-brand-600 text-white shadow-xs font-extrabold'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 mt-5 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-3 border-brand-600/20 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดตลาดหวย...</p>
          </div>
        ) : filteredLotteries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredLotteries.map((draw) => (
              <div
                key={draw.id}
                onClick={() => { if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                className={`bg-white rounded-3xl p-5 border border-slate-200/80 group transition-all duration-200 shadow-2xs hover:shadow-md hover:border-brand-300 flex flex-col justify-between ${
                  draw.is_open ? 'cursor-pointer active:scale-[0.99]' : 'cursor-not-allowed opacity-75'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start gap-3 mb-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-13 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100 shrink-0 group-hover:scale-105 transition-transform">
                        {draw.logo_url ? (
                          <img alt={draw.name} className="w-full h-full object-cover" src={draw.logo_url} />
                        ) : (
                          <span className="material-symbols-outlined text-brand-600 text-2xl">confirmation_number</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
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

                    <div className="text-right shrink-0 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">อัตราจ่าย</p>
                      <p className="text-sm font-extrabold text-slate-900">
                        บาทละ <span className="text-brand-600 font-mono">{draw.payout_3top || '900'}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ปิดรับใน</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`material-symbols-outlined text-base ${timeLeft[draw.id] <= 3600 && timeLeft[draw.id] > 0 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>schedule</span>
                      <span className={`font-mono font-bold text-sm ${timeLeft[draw.id] <= 3600 && timeLeft[draw.id] > 0 ? 'text-red-600' : 'text-slate-700'}`}>
                        {formatTime(timeLeft[draw.id] || 0)}
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={!draw.is_open}
                    onClick={(e) => { e.stopPropagation(); if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                    className={`px-7 py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs ${
                      draw.is_open
                        ? 'bg-brand-600 hover:bg-brand-700 text-white active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {draw.is_open ? 'แทงเลย' : 'ปิดรับแล้ว'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-3 bg-white rounded-3xl border border-slate-200/70 p-8 max-w-md mx-auto">
            <div className="size-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-400 text-3xl">confirmation_number</span>
            </div>
            <p className="text-sm font-extrabold text-slate-800">ไม่มีหวยเปิดรับแทงในหมวดนี้</p>
            <p className="text-xs text-slate-400">กรุณาเลือกหมวดหมู่อื่น หรือรอรอบเปิดรับแทงถัดไป</p>
          </div>
        )}
      </main>
    </PageWrapper>
  );
};

export default LotteryList;
