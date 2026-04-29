import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const BET_TYPE_LABEL = {
  '4TOP':    '4 ตัวบน',
  '3TOP':    '3 ตัวบน',
  '3TODE':   '3 ตัวโต๊ด',
  '3BOTTOM': '3 ตัวล่าง',
  '3FRONT':  '3 ตัวหน้า',
  '2TOP':    '2 ตัวบน',
  '2BOTTOM': '2 ตัวล่าง',
  'RUN_UP':  'วิ่งบน',
  'RUN_DOWN':'วิ่งล่าง',
};

const BetHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [filterDate, setFilterDate] = useState('');
  const [summary, setSummary] = useState({ totalBet: 0, totalWin: 0 });
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const fetchBets = async () => {
      try {
        const { data, error } = await supabase
          .from('bets')
          .select(`
            *,
            market:lottery_markets(*)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBets(data);

        // Calculate summary
        const totalBet = data.reduce((sum, bet) => sum + Number(bet.amount), 0);
        const totalWin = data.reduce((sum, bet) => sum + Number(bet.payout_amount || 0), 0);
        setSummary({ totalBet, totalWin });
      } catch (err) {
        console.error('Error fetching bets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [user]);

  const filteredBets = bets
    .filter(bet => activeTab === 'ALL' || bet.status === activeTab)
    .filter(bet => !filterDate || bet.created_at?.startsWith(filterDate));

  const getStatusStyle = (status) => {
    switch (status) {
      case 'WON': return 'bg-emerald-glow/20 text-emerald-glow border-emerald-glow/30';
      case 'LOST': return 'bg-accent-red/10 text-accent-red border-accent-red/20';
      case 'PENDING': return 'bg-accent-gold/10 text-accent-gold border-accent-gold/20';
      default: return 'bg-gray-100 text-gray-400 border-gray-200';
    }
  };

  const getStatusIconName = (status) => {
    switch (status) {
      case 'WON': return 'military_tech';
      case 'LOST': return 'cancel';
      case 'PENDING': return 'schedule';
      default: return 'info';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'WON': return 'ถูกรางวัล';
      case 'LOST': return 'ไม่ถูกรางวัล';
      case 'PENDING': return 'รอผลรางวัล';
      default: return status;
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'WON': return 'border-l-primary';
      case 'LOST': return 'border-l-red-200';
      case 'PENDING': return 'border-l-slate-300';
      default: return 'border-l-slate-200';
    }
  };

  const getIconBg = (status) => {
    switch (status) {
      case 'WON': return 'bg-primary/10';
      case 'LOST': return 'bg-red-50';
      case 'PENDING': return 'bg-slate-100';
      default: return 'bg-slate-50';
    }
  };

  const getIconColor = (status) => {
    switch (status) {
      case 'WON': return 'text-primary';
      case 'LOST': return 'text-red-400';
      case 'PENDING': return 'text-slate-500';
      default: return 'text-slate-400';
    }
  };

  const getIconName = (status) => {
    switch (status) {
      case 'WON': return 'confirmation_number';
      case 'LOST': return 'close';
      case 'PENDING': return 'query_stats';
      default: return 'confirmation_number';
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'WON': return 'bg-amber-50 text-amber-600 border border-amber-200';
      case 'LOST': return 'bg-red-50 text-red-400 border border-red-100';
      case 'PENDING': return 'bg-slate-100 text-slate-500 border border-slate-200';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-slate-600 text-[20px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">ประวัติโพย</h1>
        <button
          onClick={() => dateInputRef.current?.click()}
          className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors ${filterDate ? 'text-primary' : ''}`}
        >
          <span className={`material-symbols-outlined text-[20px] ${filterDate ? 'text-primary' : 'text-slate-600'}`}>calendar_today</span>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="hidden"
        />
      </header>

      <main className="flex-1 px-6 pb-32">
        {/* Filter Tabs */}
        <div className="flex gap-2 py-5 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', name: 'ทั้งหมด' },
            { id: 'WON', name: 'ถูกรางวัล' },
            { id: 'PENDING', name: 'รอผล' },
            { id: 'LOST', name: 'ไม่ถูกรางวัล' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-white text-slate-500 border border-slate-100'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 relative overflow-hidden border border-slate-50" style={{ boxShadow: '0 10px 30px -5px rgba(26,127,43,0.05), 0 4px 12px -4px rgba(0,0,0,0.05)' }}>
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <span className="material-symbols-outlined text-8xl text-primary">analytics</span>
          </div>
          <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest mb-4">TH-LOTTO PREMIUM SUMMARY</p>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-1">
              <p className="text-slate-500 text-sm">ยอดแทงสะสม</p>
              <p className="text-xl font-extrabold text-slate-900">฿{summary.totalBet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="space-y-1 border-l border-slate-100 pl-4">
              <p className="text-slate-500 text-sm flex items-center gap-1">
                ยอดถูกรางวัล
                <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
              </p>
              <p className="text-xl font-extrabold text-primary">฿{summary.totalWin.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* List Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-800">รายการล่าสุด</h2>
          <span className="text-xs text-slate-400 font-medium">{filteredBets.length} รายการ</span>
        </div>

        {/* Bets List */}
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-bold animate-pulse">กำลังดึงข้อมูล...</p>
            </div>
          ) : filteredBets.length > 0 ? (
            filteredBets.map((bet) => (
              <div
                key={bet.id}
                className={`bg-white rounded-2xl p-5 border-l-4 ${getBorderColor(bet.status)}`}
                style={{ boxShadow: '0 10px 30px -5px rgba(26,127,43,0.05), 0 4px 12px -4px rgba(0,0,0,0.05)' }}
              >
                {/* Card Top */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${getIconBg(bet.status)}`}>
                      {bet.market?.logo_url || bet.market?.image_url ? (
                        <img
                          src={bet.market.logo_url || bet.market.image_url}
                          alt={bet.market.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className={`material-symbols-outlined ${getIconColor(bet.status)}`}>
                          {getIconName(bet.status)}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900 text-sm leading-tight">{bet.market?.name || 'หวย'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(bet.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })}{' • '}
                        {new Date(bet.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${getBadgeStyle(bet.status)}`}>
                    {bet.status === 'WON' && <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>}
                    {getStatusText(bet.status)}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-50 w-full mb-3"></div>

                {/* Card Bottom */}
                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">เลข • {BET_TYPE_LABEL[bet.bet_type] || bet.bet_type}</p>
                    <p className="text-lg font-extrabold text-slate-900 tracking-widest">{bet.numbers}</p>
                    <p className="text-[10px] text-slate-400 font-medium">ยอดแทง ฿{Number(bet.amount).toLocaleString()}</p>
                  </div>
                  <div className="text-right space-y-0.5">
                    {bet.status === 'WON' ? (
                      <>
                        <p className="text-[10px] text-primary uppercase font-extrabold tracking-tighter">เงินรางวัลรวม</p>
                        <p className="text-xl font-extrabold text-primary">฿{Number(bet.payout_amount || 0).toLocaleString()}</p>
                      </>
                    ) : bet.status === 'PENDING' ? (
                      <>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">รางวัลสูงสุดที่อาจได้</p>
                        <p className="text-lg font-extrabold text-slate-400">฿{Number(bet.potential_win || 0).toLocaleString()}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">เงินรางวัล</p>
                        <p className="text-lg font-extrabold text-slate-300">฿0.00</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-white">
              <span className="material-symbols-outlined text-slate-200 text-5xl">confirmation_number</span>
              <p className="mt-3 text-sm font-extrabold text-slate-900">ไม่พบประวัติการแทง</p>
              <p className="text-xs text-slate-400 mt-1 mb-6">รายการเดิมพันทั้งหมดจะแสดงที่นี่</p>
              <Link to="/lottery-list" className="inline-flex items-center gap-2 bg-primary text-white px-7 py-3 rounded-full text-sm font-extrabold shadow-lg shadow-primary/20 active:scale-95 transition-all">
                ไปหน้าแทงหวย
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default BetHistory;
