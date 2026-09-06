import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import AppHeader from '../components/AppHeader';
import { supabase } from '../supabaseClient';

const isPending = (status) => !status || status === 'PENDING';

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const dt = new Date(dateStr + 'T00:00:00');
    return dt.toLocaleDateString('th-TH-u-ca-buddhist', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const fmtTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
};

const getCountdown = (drawTime) => {
  if (!drawTime) return null;
  const now = new Date();
  const [h, m] = drawTime.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = target - now;
  if (diff <= 0) return null;
  const hrs = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (hrs > 0) return `${hrs} ชม. ${mins} น.`;
  if (mins > 0) return `${mins} น. ${secs} วิ.`;
  return `${secs} วิ.`;
};

const Results = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [tick, setTick] = useState(0);

  // Fast Digit Checker state
  const [checkDigits, setCheckDigits] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  const fetchResults = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_today_results');
      if (error) throw error;
      setRows(data || []);
    } catch (e) {
      console.error('Error fetching results:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    const since = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const { data } = await supabase
      .from('lottery_results')
      .select('draw_date, result_main, result_3top, result_3front, result_3bottom, result_2top, result_2bottom, status, lottery_markets(name, code, category, logo_url)')
      .gte('draw_date', since)
      .in('status', ['ANNOUNCED', 'SETTLED'])
      .order('draw_date', { ascending: false })
      .limit(100);
    setHistory(data || []);
  }, []);

  useEffect(() => {
    fetchResults();
    const interval = setInterval(fetchResults, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchResults]);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (tab === 'history' && history.length === 0) fetchHistory();
  }, [tab, history.length, fetchHistory]);

  const govRow = rows.find(r => r.category === 'GOV');
  const foreignRows = rows.filter(r => r.category === 'FOREIGN');
  const stockRows = rows.filter(r => r.category === 'STOCK');
  const todayStr = fmtDate(new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }));

  const historyDates = [...new Set(history.map(r => r.draw_date))];

  const Badge = ({ row }) => {
    if (!row.has_draw_today) return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/60">งวดล่าสุด</span>;
    if (isPending(row.result_status)) return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">รอผล</span>;
    return <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">ประกาศแล้ว</span>;
  };

  const SubDate = ({ row }) => {
    if (row.has_draw_today && isPending(row.result_status)) {
      const cd = getCountdown(row.draw_time);
      if (cd) return <p className="text-xs text-amber-600 font-bold">อีก {cd}</p>;
      return <p className="text-xs text-slate-400 font-medium">ออกผล {fmtTime(row.draw_time)}</p>;
    }
    if (row.has_draw_today) return <p className="text-xs text-slate-400 font-medium">ออกผล {fmtTime(row.draw_time)}</p>;
    return <p className="text-xs text-slate-400 font-medium">{fmtDate(row.draw_date)}</p>;
  };

  const pending = (row) => isPending(row.result_status);

  // Fast check algorithm against today's results
  const handleCheckPrize = (e) => {
    e.preventDefault();
    const query = checkDigits.trim();
    if (!query) {
      setCheckResult(null);
      return;
    }

    const matches = [];
    rows.forEach(r => {
      if (pending(r)) return;
      if (r.result_main && r.result_main === query) {
        matches.push({ market: r.name, prize: 'รางวัลที่ 1 / รางวัลหลัก', number: r.result_main });
      }
      if (r.result_3top && r.result_3top === query) {
        matches.push({ market: r.name, prize: '3 ตัวบน', number: r.result_3top });
      }
      if (r.result_3front && r.result_3front === query) {
        matches.push({ market: r.name, prize: '3 ตัวหน้า', number: r.result_3front });
      }
      if (r.result_3bottom && r.result_3bottom === query) {
        matches.push({ market: r.name, prize: '3 ตัวล่าง', number: r.result_3bottom });
      }
      if (r.result_2top && r.result_2top === query) {
        matches.push({ market: r.name, prize: '2 ตัวบน', number: r.result_2top });
      }
      if (r.result_2bottom && r.result_2bottom === query) {
        matches.push({ market: r.name, prize: '2 ตัวล่าง', number: r.result_2bottom });
      }
    });

    setCheckResult({ query, matches });
  };

  return (
    <PageWrapper>
      <AppHeader />

      {/* Page Breadcrumb / Controls Header */}
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
                <span>ผลรางวัลสลากและหวย</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {todayStr}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">อัปเดตผลรางวัล Real-time ทันทีที่ออกรางวัลเสร็จสิ้น</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60">
            <button
              onClick={() => setTab('today')}
              className={`px-5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tab === 'today'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ผลวันนี้
            </button>
            <button
              onClick={() => setTab('history')}
              className={`px-5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                tab === 'history'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ย้อนหลัง 7 วัน
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Layout Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-5 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 1: LEFT COLUMN (Government Lottery Hero & Live Studio)
              ════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Government Lottery Hero Ticket Card */}
            {govRow ? (
              <div className="rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden"
                   style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}>
                {/* Background GLO Seal */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 opacity-15 pointer-events-none select-none">
                  <img
                    alt="GLO Seal"
                    className="w-full h-full object-contain"
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png"
                  />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-2 mb-5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center overflow-hidden shrink-0 border border-white/30 backdrop-blur-xs">
                        <img
                          alt="Government"
                          className="w-full h-full object-cover"
                          src={govRow.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png'}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-black leading-tight truncate">สลากกินแบ่งรัฐบาล</h2>
                        <p className="text-white/80 text-xs font-medium truncate mt-0.5">
                          {govRow.has_draw_today ? `วันนี้ ออกผล ${fmtTime(govRow.draw_time)}` : fmtDate(govRow.draw_date)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                      !govRow.has_draw_today ? 'bg-blue-400/30 text-white' :
                      pending(govRow) ? 'bg-amber-400/30 text-amber-200 border border-amber-300/40' : 'bg-white/25 text-white'
                    }`}>
                      {!govRow.has_draw_today ? 'งวดล่าสุด' : pending(govRow) ? 'รอผลออก' : 'ออกแล้ว'}
                    </div>
                  </div>

                  {/* 6-Digit Prize 1 Balls */}
                  <div className="mb-6 text-center">
                    <p className="text-white/80 text-xs font-extrabold uppercase tracking-widest mb-3">รางวัลที่ 1 (บาทละ 2,000,000)</p>
                    <div className="flex justify-center gap-1.5 sm:gap-2">
                      {pending(govRow)
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className="size-10 sm:size-11 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center text-white/40 font-bold text-lg">?</span>
                          ))
                        : (govRow.result_main || '------').split('').map((d, i) => (
                            <span key={i} className="size-10 sm:size-11 bg-white rounded-2xl flex items-center justify-center text-emerald-950 font-black text-xl shadow-md transform hover:scale-105 transition-transform">
                              {d}
                            </span>
                          ))}
                    </div>
                  </div>

                  {/* 3 Front / 3 Back / 2 Bottom Grid */}
                  <div className="grid grid-cols-3 gap-2.5 text-center pt-4 border-t border-white/20">
                    <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
                      <p className="text-white/70 text-[10px] font-bold mb-1">3 ตัวหน้า</p>
                      <p className="text-base sm:text-lg font-black font-mono tracking-wider">{pending(govRow) ? 'xxx' : (govRow.result_3front || '—')}</p>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2.5 backdrop-blur-xs border border-white/10">
                      <p className="text-white/70 text-[10px] font-bold mb-1">3 ตัวท้าย</p>
                      <p className="text-base sm:text-lg font-black font-mono tracking-wider">{pending(govRow) ? 'xxx' : (govRow.result_3top || '—')}</p>
                    </div>
                    <div className="bg-amber-400/20 rounded-2xl p-2.5 backdrop-blur-xs border border-amber-300/30">
                      <p className="text-amber-200 text-[10px] font-bold mb-1">2 ตัวล่าง</p>
                      <p className="text-base sm:text-lg font-black font-mono tracking-wider text-amber-200">{pending(govRow) ? 'xx' : (govRow.result_2bottom || '—')}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={() => navigate('/lottery-list')}
                      className="flex-1 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all text-center cursor-pointer"
                    >
                      แทงสลากงวดถัดไป
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Quick Live Game Results (Instant Lotto Tape) */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-red-500 text-sm animate-pulse">videocam</span>
                  ผลสตรีมมิ่งสด & หวยเร็ว
                </h3>
                <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">REALTIME</span>
              </div>
              <div className="space-y-2">
                <div
                  onClick={() => navigate('/instant-lottery')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center text-xs font-black">
                      1M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">หวยไทย 1 นาที</h4>
                      <p className="text-[10px] text-slate-400">ออกผลทุก 60 วินาที</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                    เข้าชม <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>

                <div
                  onClick={() => navigate('/lotto-15m')}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/50 border border-slate-100 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-xl bg-slate-800 text-white flex items-center justify-center text-xs font-black">
                      15M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">ล็อตโต้ 15 นาที LIVE</h4>
                      <p className="text-[10px] text-slate-400">ถ่ายทอดสดสตูดิโอ HD</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1">
                    เข้าชม <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 2: CENTER WORKSPACE (International & Daily Stock Results)
              ════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-8 xl:col-span-5 space-y-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs">
                <div className="w-10 h-10 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">กำลังโหลดผลรางวัล...</p>
              </div>
            ) : tab === 'today' ? (
              <>
                {/* ── Foreign Lotteries Section ── */}
                {foreignRows.length > 0 && (
                  <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-emerald-700 rounded-full"></span>
                        หวยต่างประเทศ (ลาว • ฮานอย • มาเลย์)
                      </h3>
                      <span className="text-xs text-slate-400 font-bold">{foreignRows.length} รายการ</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {foreignRows.map((r) => (
                        <div key={r.code} className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-200 transition-all flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="size-10 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 shrink-0">
                                  {r.logo_url ? (
                                    <img alt={r.name} className="w-full h-full object-cover" src={r.logo_url} />
                                  ) : (
                                    <span className="material-symbols-outlined text-slate-400 text-lg">flag</span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">{r.name}</h4>
                                  <SubDate row={r} />
                                </div>
                              </div>
                              <Badge row={r} />
                            </div>

                            <div className="grid grid-cols-4 gap-1.5">
                              {[
                                ['รางวัล', pending(r) ? 'xxxx' : (r.result_main || r.result_3top || 'xxxx'), false],
                                ['3 บน', pending(r) ? 'xxx' : (r.result_3top || 'xxx'), false],
                                ['2 บน', pending(r) ? 'xx' : (r.result_2top || 'xx'), false],
                                ['2 ล่าง', pending(r) ? 'xx' : (r.result_2bottom || 'xx'), true],
                              ].map(([label, val, accent]) => (
                                <div key={label} className={`text-center p-2 rounded-xl border ${accent ? 'bg-emerald-50/70 border-emerald-200/80' : 'bg-slate-50 border-slate-100'}`}>
                                  <p className={`text-[8px] font-extrabold uppercase ${accent ? 'text-emerald-800' : 'text-slate-400'}`}>{label}</p>
                                  <p className={`text-xs font-black font-mono mt-0.5 ${accent ? 'text-emerald-800' : 'text-slate-800'}`}>{val}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* ── Daily Stock Results Section ── */}
                {stockRows.length > 0 && (
                  <section className="space-y-3 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
                        ผลหุ้นรายวัน (Nikkei, Hang Seng, Dow Jones)
                      </h3>
                      <span className="text-xs text-slate-400 font-bold">{stockRows.length} รายการ</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stockRows.map((r) => (
                        <div key={r.code} className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {r.logo_url ? (
                              <img alt={r.name} className="w-8 h-8 rounded-full object-cover shrink-0" src={r.logo_url} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-400 text-sm">show_chart</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-slate-900 text-xs truncate">{r.name}</h4>
                              <SubDate row={r} />
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-[7px] text-slate-400 font-bold uppercase">3 บน</p>
                              <p className="text-xs font-bold text-slate-800 font-mono">{pending(r) ? 'xxx' : (r.result_3top || 'xxx')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] text-emerald-700 font-bold uppercase">2 ล่าง</p>
                              <p className="text-xs font-bold text-emerald-700 font-mono">{pending(r) ? 'xx' : (r.result_2bottom || r.result_2top || 'xx')}</p>
                            </div>
                            <Badge row={r} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            ) : (
              /* ── TAB: ย้อนหลัง 7 วัน ── */
              <div className="space-y-6">
                {historyDates.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80">
                    <p className="text-sm font-bold">ยังไม่มีผลรางวัลย้อนหลัง</p>
                  </div>
                ) : (
                  historyDates.map(date => {
                    const dayResults = history.filter(r => r.draw_date === date);
                    return (
                      <div key={date} className="space-y-3">
                        <h4 className="text-xs font-extrabold text-slate-700 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-emerald-700 rounded-full"></span>
                          ผลประจำวันที่ {fmtDate(date)}
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {dayResults.map((r, idx) => (
                            <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                              <div className="flex items-center gap-2.5 mb-2.5">
                                {r.lottery_markets?.logo_url ? (
                                  <img alt="" className="size-7 rounded-full object-cover shrink-0" src={r.lottery_markets.logo_url} />
                                ) : (
                                  <div className="size-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-slate-400 text-xs">flag</span>
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <h5 className="font-extrabold text-slate-900 text-xs truncate">{r.lottery_markets?.name}</h5>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5 text-center">
                                <div className="bg-slate-50 p-1.5 rounded-lg">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">3 ตัวบน</p>
                                  <p className="text-xs font-black font-mono text-slate-800">{r.result_3top || '—'}</p>
                                </div>
                                <div className="bg-slate-50 p-1.5 rounded-lg">
                                  <p className="text-[8px] text-slate-400 font-bold uppercase">3 หน้า/ล่าง</p>
                                  <p className="text-xs font-black font-mono text-slate-800">{r.result_3front || r.result_3bottom || '—'}</p>
                                </div>
                                <div className="bg-emerald-50 p-1.5 rounded-lg">
                                  <p className="text-[8px] text-emerald-800 font-bold uppercase">2 ตัวล่าง</p>
                                  <p className="text-xs font-black font-mono text-emerald-800">{r.result_2bottom || r.result_2top || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </main>

          {/* ════════════════════════════════════════════════════════════
              LAYOUT 3: RIGHT COLUMN (Fast Digit Checker & Draw Calendar)
              ════════════════════════════════════════════════════════════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Interactive Fast Digit Checker */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-emerald-700 text-lg">search_check</span>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  ตรวจรางวัลทันใจ
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mb-3.5">
                กรอกเลข 2 ตัว, 3 ตัว หรือ 6 ตัว เพื่อตรวจเช็กกับผลรางวัลที่ประกาศแล้ววันนี้
              </p>

              <form onSubmit={handleCheckPrize} className="space-y-2.5">
                <div className="relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={checkDigits}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setCheckDigits(val);
                      if (!val) setCheckResult(null);
                    }}
                    placeholder="ใส่ตัวเลขที่ต้องการตรวจ..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black font-mono tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-center"
                  />
                  {checkDigits && (
                    <button
                      type="button"
                      onClick={() => { setCheckDigits(''); setCheckResult(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!checkDigits.trim()}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition-all shadow-xs cursor-pointer ${
                    checkDigits.trim()
                      ? 'bg-gradient-to-r from-emerald-800 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-600 active:scale-95'
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  ตรวจเช็กผลรางวัล
                </button>
              </form>

              {/* Fast Checker Results Display */}
              {checkResult && (
                <div className="mt-4 pt-3.5 border-t border-slate-100">
                  {checkResult.matches.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-xs">
                        <span className="material-symbols-outlined text-base">celebration</span>
                        <span>ยินดีด้วย! ถูกรางวัล ({checkResult.matches.length} รายการ)</span>
                      </div>
                      <div className="space-y-1.5">
                        {checkResult.matches.map((m, idx) => (
                          <div key={idx} className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs">
                            <p className="font-extrabold text-emerald-900">{m.market}</p>
                            <p className="text-emerald-700 text-[11px] font-semibold">{m.prize}: <span className="font-mono font-bold text-emerald-950">{m.number}</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-center space-y-1">
                      <span className="material-symbols-outlined text-slate-400 text-xl">sentiment_dissatisfied</span>
                      <p className="text-xs font-bold text-slate-700">ไม่พบข้อมูลถูกรางวัล</p>
                      <p className="text-[10px] text-slate-400">เลข {checkResult.query} ไม่ตรงกับผลรางวัลวันนี้</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Official Draw Schedule Timetable */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-emerald-700">calendar_month</span>
                ตารางเวลาออกผลรางวัล
              </h3>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'สลากกินแบ่งรัฐบาล', days: 'ทุกวันที่ 1 และ 16', time: '14:30 น.' },
                  { name: 'หวยลาวพัฒนา', days: 'จันทร์ / พุธ / ศุกร์', time: '20:30 น.' },
                  { name: 'หวยฮานอยพิเศษ', days: 'ออกทุกวัน', time: '17:30 น.' },
                  { name: 'หวยฮานอยปกติ', days: 'ออกทุกวัน', time: '18:30 น.' },
                  { name: 'หวยฮานอย VIP', days: 'ออกทุกวัน', time: '19:30 น.' },
                  { name: 'หวยมาเลย์ 4D', days: 'พุธ / เสาร์ / อาทิตย์', time: '18:30 น.' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <div>
                      <p className="font-bold text-slate-800">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.days}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Results;
