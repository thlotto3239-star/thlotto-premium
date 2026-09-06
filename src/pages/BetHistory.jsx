import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBet, setSelectedBet] = useState(null);
  const [summary, setSummary] = useState({ totalBet: 0, totalWin: 0, winCount: 0 });
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
        const betList = data || [];
        setBets(betList);

        if (betList.length > 0) {
          setSelectedBet(betList[0]);
        }

        // Calculate summary
        const totalBet = betList.reduce((sum, bet) => sum + Number(bet.amount || 0), 0);
        const totalWin = betList.reduce((sum, bet) => sum + Number(bet.payout_amount || 0), 0);
        const winCount = betList.filter(b => b.status === 'WON').length;
        setSummary({ totalBet, totalWin, winCount });
      } catch (err) {
        console.error('Error fetching bets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBets();
  }, [user]);

  const filteredBets = useMemo(() => {
    return bets
      .filter(bet => activeTab === 'ALL' || bet.status === activeTab)
      .filter(bet => !filterDate || bet.created_at?.startsWith(filterDate))
      .filter(bet => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          bet.numbers?.includes(q) ||
          bet.market?.name?.toLowerCase().includes(q) ||
          (BET_TYPE_LABEL[bet.bet_type] || '').toLowerCase().includes(q)
        );
      });
  }, [bets, activeTab, filterDate, searchQuery]);

  const getStatusText = (status) => {
    switch (status) {
      case 'WON': return 'ถูกรางวัล';
      case 'LOST': return 'ไม่ถูกรางวัล';
      case 'PENDING': return 'รอผลรางวัล';
      default: return status;
    }
  };

  const getBadgeStyle = (status) => {
    switch (status) {
      case 'WON': return 'bg-amber-50 text-amber-700 border-amber-300 font-black';
      case 'LOST': return 'bg-slate-100 text-slate-400 border-slate-200';
      case 'PENDING': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-400 border-slate-200';
    }
  };

  return (
    <PageWrapper>
      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>ประวัติการเดิมพัน (โพยหวย)</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {bets.length} รายการ
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">ตรวจสอบสถานะโพย เลขที่แทง และยอดเงินรางวัลที่ได้รับ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/lottery-list"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>แทงหวยเพิ่ม</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 3 Cols on PC): Filter & Date Controls ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Status Tabs */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                สถานะโพยหวย
              </h3>
              <div className="space-y-1">
                {[
                  { id: 'ALL', name: 'ทั้งหมด', icon: 'list_alt' },
                  { id: 'WON', name: 'ถูกรางวัล', icon: 'emoji_events', color: 'text-amber-500' },
                  { id: 'PENDING', name: 'รอผลรางวัล', icon: 'hourglass_top', color: 'text-emerald-700' },
                  { id: 'LOST', name: 'ไม่ถูกรางวัล', icon: 'close', color: 'text-slate-400' }
                ].map(tab => {
                  const isActive = activeTab === tab.id;
                  const count = tab.id === 'ALL'
                    ? bets.length
                    : bets.filter(b => b.status === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : tab.color || 'text-slate-400'}`}>
                          {tab.icon}
                        </span>
                        <span>{tab.name}</span>
                      </div>
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  กรองตามวันที่
                </h3>
                {filterDate && (
                  <button
                    onClick={() => setFilterDate('')}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    ล้างวันที่
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFilterDate(today);
                  }}
                  className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
                >
                  วันนี้
                </button>
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all text-center cursor-pointer"
                >
                  ทุกช่วงเวลา
                </button>
              </div>
            </div>

            {/* Quick Lotto Markets Shortcut */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-xl">stars</span>
                <h4 className="text-xs font-extrabold">แทงหวยรอบต่อไป</h4>
              </div>
              <p className="text-[11px] text-emerald-200 leading-relaxed">
                หวยรัฐบาล ฮานอย ลาว ยี่กี 264 รอบ เปิดรับแทงตลอด 24 ชม.
              </p>
              <Link
                to="/lottery-list"
                className="block py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 text-xs font-extrabold text-center transition-all shadow-xs"
              >
                เลือกตลาดหวย
              </Link>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 6 Cols on PC): Ticket Feed ════ */}
          <main className="lg:col-span-6 space-y-4">
            {/* Search Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาเลขที่แทง (เช่น 89, 752) หรือชื่อหวย..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>
              <span className="text-xs text-slate-400 font-semibold shrink-0">
                พบ <strong className="text-slate-900 font-mono">{filteredBets.length}</strong> ใบ
              </span>
            </div>

            {/* Ticket Cards Grid (2 cols on md, 1 col on mobile) */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-100">
                <div className="size-9 border-3 border-emerald-600/30 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">กำลังโหลดโพยหวย...</p>
              </div>
            ) : filteredBets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredBets.map((bet) => {
                  const isWon = bet.status === 'WON';
                  const isSelected = selectedBet?.id === bet.id;
                  return (
                    <div
                      key={bet.id}
                      onClick={() => setSelectedBet(bet)}
                      className={`bg-white rounded-3xl p-4.5 border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden active:scale-[0.99] ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/15 shadow-sm'
                          : 'border-slate-200/80 hover:border-emerald-300 hover:shadow-xs'
                      }`}
                    >
                      {isWon && (
                        <div className="absolute -top-1 -right-1 size-10 bg-amber-400/20 rounded-bl-3xl flex items-start justify-end p-1.5 pointer-events-none">
                          <span className="material-symbols-outlined text-amber-500 text-base">emoji_events</span>
                        </div>
                      )}

                      {/* Market Info */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200/50">
                              {bet.market?.logo_url || bet.market?.image_url ? (
                                <img
                                  src={bet.market.logo_url || bet.market.image_url}
                                  alt={bet.market.name}
                                  className="size-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-slate-500 text-lg">confirmation_number</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-xs text-slate-900 truncate">
                                {bet.market?.name || 'หวย'}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(bet.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })} • {new Date(bet.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>

                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(bet.status)}`}>
                            {getStatusText(bet.status)}
                          </span>
                        </div>

                        {/* Digits & Bet Type */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">
                              {BET_TYPE_LABEL[bet.bet_type] || bet.bet_type}
                            </span>
                            <span className="text-2xl font-black font-mono tracking-widest text-slate-900">
                              {bet.numbers}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block">ยอดแทง</span>
                            <span className="text-sm font-black font-mono text-slate-800">
                              ฿{Number(bet.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Payout Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-medium">
                          อัตราจ่าย {bet.payout_rate ? `1 : ${bet.payout_rate}` : '-'}
                        </span>
                        {isWon ? (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-amber-600 block">เงินรางวัลที่ได้</span>
                            <span className="text-base font-black font-mono text-emerald-700">
                              ฿{Number(bet.payout_amount || 0).toLocaleString()}
                            </span>
                          </div>
                        ) : bet.status === 'PENDING' ? (
                          <span className="text-[11px] font-bold text-slate-500">
                            ลุ้นรับ ฿{(Number(bet.amount || 0) * Number(bet.payout_rate || 0)).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-300 font-mono">-</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-6">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">receipt_long</span>
                <p className="text-sm font-extrabold text-slate-800">ไม่พบโพยหวยตามเงื่อนไข</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">ลองปรับตัวกรองสถานะ หรือเปลี่ยนวันที่ค้นหา</p>
                <Link
                  to="/lottery-list"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-all shadow-xs"
                >
                  <span>เลือกแทงหวยตอนนี้</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
            )}
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Analytics & Ticket Inspector ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Total Betting Summary Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3.5">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                ภาพรวมการเดิมพัน
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">ยอดเดิมพันสะสม</span>
                  <span className="font-mono font-black text-slate-900 text-base">
                    ฿{summary.totalBet.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800">เงินรางวัลสะสม</span>
                  <span className="font-mono font-black text-emerald-700 text-base">
                    ฿{summary.totalWin.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800">โพยที่ถูกรางวัล</span>
                  <span className="font-mono font-black text-amber-700 text-base">
                    {summary.winCount} <span className="text-xs text-amber-600 font-normal">ใบ</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Bet Slip Inspector */}
            {selectedBet ? (
              <div className="bg-white rounded-3xl p-5 border border-emerald-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-lg">receipt</span>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      ใบเสร็จโพยหวย
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getBadgeStyle(selectedBet.status)}`}>
                    {getStatusText(selectedBet.status)}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ตลาดหวย:</span>
                    <span className="font-bold text-slate-800">{selectedBet.market?.name || 'หวย'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ประเภท:</span>
                    <span className="font-bold text-slate-800">{BET_TYPE_LABEL[selectedBet.bet_type] || selectedBet.bet_type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">เลขที่แทง:</span>
                    <span className="font-mono font-black text-emerald-700 text-base">{selectedBet.numbers}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ยอดเงินเดิมพัน:</span>
                    <span className="font-mono font-bold text-slate-900">฿{Number(selectedBet.amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">อัตราจ่าย:</span>
                    <span className="font-mono font-bold text-slate-700">1 : {selectedBet.payout_rate || '-'}</span>
                  </div>
                  {selectedBet.status === 'WON' && (
                    <div className="flex justify-between py-1 border-b border-slate-50 bg-amber-50/50 px-2 rounded-lg">
                      <span className="text-amber-800 font-bold">เงินรางวัลสุทธิ:</span>
                      <span className="font-mono font-black text-emerald-700 text-base">฿{Number(selectedBet.payout_amount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">เวลาที่แทง:</span>
                    <span className="text-[11px] text-slate-600 font-medium">
                      {new Date(selectedBet.created_at).toLocaleString('th-TH')}
                    </span>
                  </div>
                </div>

                {/* Digital Barcode / Ticket ID */}
                <div className="pt-2 border-t border-dashed border-slate-200 text-center">
                  <div className="h-6 flex items-center justify-center gap-1 opacity-40 mb-1">
                    {[...Array(24)].map((_, i) => (
                      <span
                        key={i}
                        className={`h-full bg-slate-900 inline-block ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                      ></span>
                    ))}
                  </div>
                  <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">
                    ID: {selectedBet.id ? String(selectedBet.id).slice(0, 16) : 'TICKET-REF'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-5 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl mb-1 text-slate-300">touch_app</span>
                <p>คลิกเลือกโพยหวยเพื่อดูใบเสร็จดิจิทัล</p>
              </div>
            )}

            {/* Fair Play & Transparency */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-100 text-emerald-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700 text-lg shrink-0 mt-0.5">verified</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ระบบคำนวณผลรางวัลอัตโนมัติ 100% ตามผลการออกรางวัลจริงอย่างโปร่งใส
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default BetHistory;
