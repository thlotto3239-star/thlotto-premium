import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';

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
    <div className="bg-white min-h-screen text-slate-900">
      <AppHeader />

      {/* Header */}
      <header className="sticky top-12 z-50 bg-white/80 border-b border-primary/5 px-6 py-4 flex items-center justify-between" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <button onClick={() => navigate(-1)} className="flex items-center justify-center text-slate-400 hover:opacity-70 transition-opacity">
          <span className="material-symbols-outlined text-3xl">chevron_left</span>
        </button>
        <h1 className="text-xl font-extrabold tracking-tight text-slate-900">รายการหวยรายวัน</h1>
        <div className="w-8"></div>
      </header>

      {/* Filter Tabs */}
      <div className="mt-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 pb-2 w-max min-w-full">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm whitespace-nowrap shrink-0 transition-all ${
                activeTab === tab.value
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 mt-6 pb-32 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลด...</p>
          </div>
        ) : filteredLotteries.length > 0 ? (
          filteredLotteries.map((draw) => (
            <div
              key={draw.id}
              onClick={() => { if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
              className={`bg-white rounded-[2.5rem] p-6 border border-primary/5 group transition-all ${draw.is_open ? 'cursor-pointer active:scale-[0.99]' : 'cursor-not-allowed opacity-70'}`}
              style={{ boxShadow: '0 10px 30px -5px rgba(26, 127, 43, 0.08)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-slate-50 overflow-hidden flex items-center justify-center">
                    {draw.logo_url ? (
                      <img alt={draw.name} className="w-full h-full object-cover" src={draw.logo_url} />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-3xl">confirmation_number</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-[1.1rem] font-extrabold text-slate-900">{draw.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`size-2 rounded-full ${draw.is_open ? 'bg-emerald-500' : 'bg-red-400'}`}></span>
                      <span className={`text-xs font-bold ${draw.is_open ? 'text-emerald-500' : 'text-red-400'}`}>
                        {draw.is_open ? 'เปิดรับแทง' : 'ปิดรับแล้ว'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">อัตราจ่าย</p>
                  <p className="text-lg font-extrabold text-slate-900">บาทละ <span className="text-primary">{draw.payout_3top || 900}</span></p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-5 border-t border-slate-100">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">ปิดรับใน</p>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-base ${timeLeft[draw.id] <= 3600 ? 'text-red-500' : 'text-slate-700'}`}>schedule</span>
                    <span className={`font-body tabular-nums font-bold text-base ${timeLeft[draw.id] <= 3600 ? 'text-red-500' : 'text-slate-700'}`}>
                      {formatTime(timeLeft[draw.id] || 0)}
                    </span>
                  </div>
                </div>
                <button
                  disabled={!draw.is_open}
                  onClick={(e) => { e.stopPropagation(); if (draw.is_open) navigate(`/betting?draw=${draw.id}`); }}
                  className={`px-10 py-3.5 rounded-full font-extrabold text-sm transition-all ${
                    draw.is_open
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {draw.is_open ? 'แทงเลย' : 'ปิดรับแล้ว'}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-32 text-center space-y-4 opacity-40">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-slate-200">
              <span className="material-symbols-outlined text-slate-300 text-4xl">confirmation_number</span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">ไม่มีหวยเปิดรับแทง</p>
            <p className="text-xs text-slate-400">ขณะนี้ทุกตลาดปิดทำการชั่วคราว</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default LotteryList;
