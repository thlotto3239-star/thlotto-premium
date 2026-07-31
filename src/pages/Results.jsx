import React, { useState, useEffect, useCallback } from 'react';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';
import { supabase } from '../supabaseClient';

const isPending = (status) => !status || status === 'PENDING';

const fmtDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const dt = new Date(dateStr + 'T00:00:00');
    // Buddhist calendar (พ.ศ.)
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
  const [rows, setRows] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const [, setTick] = useState(0);

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
    if (!row.has_draw_today) return <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">งวดล่าสุด</span>;
    if (isPending(row.result_status)) return <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">รอผล</span>;
    return <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">ประกาศแล้ว</span>;
  };

  const SubDate = ({ row }) => {
    if (row.has_draw_today && isPending(row.result_status)) {
      const cd = getCountdown(row.draw_time);
      if (cd) return <p className="text-xs text-amber-500 font-bold">อีก {cd}</p>;
      return <p className="text-xs text-slate-400 font-medium">ออกผล {fmtTime(row.draw_time)}</p>;
    }
    if (row.has_draw_today) return <p className="text-xs text-slate-400 font-medium">ออกผล {fmtTime(row.draw_time)}</p>;
    return <p className="text-xs text-slate-400 font-medium">{fmtDate(row.draw_date)}</p>;
  };

  const pending = (row) => isPending(row.result_status);

  return (
    <div className="bg-white min-h-screen text-slate-900 font-body flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-6 pb-40">
        {/* หัวข้อ + Tabs */}
        <div className="text-center mb-4 mt-2">
          <h1 className="text-lg font-bold text-slate-900">ผลรางวัลประจำวัน</h1>
          <p className="text-xs text-slate-400 mt-1">{todayStr}</p>
        </div>
        <div className="flex gap-2 mb-5 justify-center">
          <button onClick={() => setTab('today')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition ${tab === 'today' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            วันนี้
          </button>
          <button onClick={() => setTab('history')}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition ${tab === 'history' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
            ย้อนหลัง 7 วัน
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : tab === 'today' ? (
          <>
            {/* ── GOV CARD ── */}
            {govRow && (
              <section className="mb-8">
                <div className="rounded-[2.5rem] p-5 sm:p-6 text-white" style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}>
                  <div className="flex justify-between items-start gap-2 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        <img alt="Government" className="w-full h-full object-cover" src={govRow.logo_url || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png'} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-lg font-bold leading-tight truncate">สลากกินแบ่งรัฐบาล</h2>
                        <p className="text-white/70 text-xs font-medium truncate mt-0.5">
                          {govRow.has_draw_today ? `วันนี้ ออกผล ${fmtTime(govRow.draw_time)}` : fmtDate(govRow.draw_date)}
                        </p>
                      </div>
                    </div>
                    <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-xs font-bold whitespace-nowrap shrink-0 ${
                      !govRow.has_draw_today ? 'bg-blue-400/30 text-white' :
                      pending(govRow) ? 'bg-red-500 text-white' : 'bg-green-400 text-white'
                    }`}>
                      {!govRow.has_draw_today ? 'งวดล่าสุด' : pending(govRow) ? 'รอผล' : 'ออกแล้ว'}
                    </div>
                  </div>
                  <div className="mb-6 text-center">
                    <p className="text-white/80 text-xs font-medium mb-3">รางวัลที่ 1</p>
                    <div className="flex justify-center gap-1.5">
                      {pending(govRow)
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <span key={i} className="w-11 h-11 bg-white/15 border border-white/20 rounded-full flex items-center justify-center text-white/30 font-bold text-xl">x</span>
                          ))
                        : (govRow.result_main || '').split('').map((digit, i) => (
                            <span key={i} className="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#064e3b] font-bold text-xl">{digit}</span>
                          ))
                      }
                    </div>
                  </div>
                  <div className="h-px bg-white/10 mb-5"></div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-white/60 text-xs font-medium mb-1">3 ตัวหน้า</p>
                      <div className="text-base font-bold">{pending(govRow) ? 'xxx' : (govRow.result_3front || 'xxx')}</div>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs font-medium mb-1">3 ตัวท้าย</p>
                      <div className="text-base font-bold">{pending(govRow) ? 'xxx' : (govRow.result_3top || 'xxx')}</div>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs font-medium mb-1">2 ตัวล่าง</p>
                      <div className="text-xl font-bold">{pending(govRow) ? 'xx' : (govRow.result_2bottom || govRow.result_2top || 'xx')}</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── FOREIGN ── */}
            {foreignRows.length > 0 && (
              <section className="mb-4">
                <h3 className="text-base font-bold text-slate-900 mb-4">หวยต่างประเทศ</h3>
                <div className="space-y-3">
                  {foreignRows.map((r) => (
                    <div key={r.code} className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                            {r.logo_url ? <img alt={r.name} className="w-full h-full object-cover" src={r.logo_url} /> : <span className="material-symbols-outlined text-slate-400 text-lg">flag</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{r.name}</h4>
                            <SubDate row={r} />
                          </div>
                        </div>
                        <Badge row={r} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          ['รางวัล', pending(r) ? 'xxxx' : (r.result_main || r.result_3top || 'xxxx'), false],
                          ['3 บน', pending(r) ? 'xxx' : (r.result_3top || 'xxx'), false],
                          ['2 บน', pending(r) ? 'xx' : (r.result_2top || 'xx'), false],
                          ['2 ล่าง', pending(r) ? 'xx' : (r.result_2bottom || 'xx'), true],
                        ].map(([label, val, accent]) => (
                          <div key={label} className={`text-center p-1.5 rounded-xl border ${accent ? 'bg-primary/5 border-primary/10' : 'bg-slate-50 border-slate-100'}`}>
                            <p className={`text-[7px] font-bold uppercase ${accent ? 'text-primary' : 'text-slate-400'}`}>{label}</p>
                            <p className={`text-xs font-bold ${accent ? 'text-primary' : 'text-slate-800'}`}>{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── STOCK ── */}
            {stockRows.length > 0 && (
              <section className="mb-4">
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary rounded-full"></span>
                    ผลหุ้นรายวัน
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {stockRows.map((r) => (
                    <div key={r.code} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {r.logo_url ? <img alt={r.name} className="w-8 h-8 rounded-full object-cover shrink-0" src={r.logo_url} />
                          : <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-slate-400 text-sm">show_chart</span></div>}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{r.name}</h4>
                          <SubDate row={r} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-[7px] text-slate-400 font-bold uppercase">3 ตัว</p>
                          <p className="text-xs font-bold text-slate-800">{pending(r) ? 'xxx' : (r.result_3top || 'xxx')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] text-primary font-bold uppercase">2 ตัว</p>
                          <p className="text-xs font-bold text-primary">{pending(r) ? 'xx' : (r.result_2top || 'xx')}</p>
                        </div>
                        <Badge row={r} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {rows.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <span className="material-symbols-outlined text-5xl text-slate-200">emoji_events</span>
                <p className="mt-4 text-sm font-medium">ยังไม่มีผลรางวัล</p>
              </div>
            )}
          </>
        ) : (
          /* ── TAB: ย้อนหลัง ── */
          <div className="space-y-6">
            {historyDates.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <p className="text-sm">ยังไม่มีผลรางวัลย้อนหลัง</p>
              </div>
            ) : (() => {
              // จัดลำดับในแต่ละวัน: ลาว(1) → ฮานอย(2) → มาเลย์(3) → หุ้น(4)
              const sortOrder = (r) => {
                const c = r.lottery_markets?.code;
                if (c === 'LAO') return 1;
                if (c?.startsWith('HANOI')) return 2;
                if (c === 'MALAY') return 3;
                return 4;
              };

              // แยกรัฐบาลออก → แสดงบนสุดเสมอ
              const govResults = history.filter(r => r.lottery_markets?.code === 'TH_GOV');
              const govDates = [...new Set(govResults.map(r => r.draw_date))];
              const otherResults = history.filter(r => r.lottery_markets?.code !== 'TH_GOV');
              const otherDates = [...new Set(otherResults.map(r => r.draw_date))];

              // ฟังก์ชัน render การ์ดรัฐบาล (เขียว)
              const renderGovCard = (r, date) => (
                <div className="relative rounded-[2rem] p-5 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}>
                  {r.lottery_markets?.logo_url && (
                    <img src={r.lottery_markets.logo_url} alt=""
                      className="absolute -right-8 -bottom-8 w-48 h-48 object-contain pointer-events-none opacity-10 select-none"/>
                  )}
                  <div className="relative z-10">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                        {r.lottery_markets?.logo_url
                          ? <img alt="" className="w-full h-full object-cover" src={r.lottery_markets.logo_url} />
                          : <div className="w-full h-full bg-white/10"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold leading-tight truncate">{r.lottery_markets?.name}</h4>
                        <p className="text-white/70 text-xs font-medium truncate mt-0.5">{fmtDate(date)}</p>
                      </div>
                    </div>
                    {r.result_main && (
                      <div className="mb-4 text-center">
                        <p className="text-white/80 text-xs font-medium mb-2">รางวัลที่ 1</p>
                        <div className="flex justify-center gap-1">
                          {r.result_main.split('').map((d, idx) => (
                            <span key={idx} className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-[#064e3b] font-bold text-base sm:text-xl">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="h-px bg-white/10 mb-3"></div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div><p className="text-white/60 text-xs font-medium mb-1">3 ตัวหน้า</p><div className="text-sm sm:text-base font-bold">{r.result_3front || '—'}</div></div>
                      <div><p className="text-white/60 text-xs font-medium mb-1">3 ตัวท้าย</p><div className="text-sm sm:text-base font-bold">{r.result_3top || '—'}</div></div>
                      <div><p className="text-white/60 text-xs font-medium mb-1">2 ตัวล่าง</p><div className="text-base sm:text-xl font-bold">{r.result_2bottom || r.result_2top || '—'}</div></div>
                    </div>
                  </div>
                </div>
              );

              return <>
                {/* ── หวยรัฐบาล — บนสุดเสมอ ── */}
                {govDates.map(date => {
                  const gov = govResults.find(r => r.draw_date === date);
                  if (!gov) return null;
                  return (
                    <div key={`gov-${date}`}>
                      <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-700 rounded-full"></span>
                        หวยรัฐบาล — {fmtDate(date)}
                      </h3>
                      {renderGovCard(gov, date)}
                    </div>
                  );
                })}

                {/* ── ตลาดอื่นๆ เรียงตามวัน: ลาว → ฮานอย → มาเลย์ → หุ้น ── */}
                {otherDates.map(date => (
              <div key={date}>
                <h3 className="text-sm font-bold text-slate-600 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary rounded-full"></span>
                  {fmtDate(date)}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {otherResults.filter(r => r.draw_date === date)
                    .sort((a, b) => sortOrder(a) - sortOrder(b))
                    .map((r, i) => {

                    // ── ตลาดอื่นๆ: การ์ดขาว + watermark โลโก้ ──
                    return (
                      <div key={i} className="relative bg-white p-4 rounded-2xl border border-slate-100 overflow-hidden">
                        {/* Watermark logo */}
                        {r.lottery_markets?.logo_url && (
                          <img src={r.lottery_markets.logo_url} alt=""
                            className="absolute -right-6 -bottom-6 w-40 h-40 object-contain pointer-events-none opacity-[0.07] select-none"/>
                        )}
                        <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                          {r.lottery_markets?.logo_url
                            ? <img alt="" className="w-10 h-10 rounded-full object-cover shrink-0" src={r.lottery_markets.logo_url} />
                            : <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0"></div>}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">{r.lottery_markets?.name}</h4>
                            <p className="text-xs text-slate-400 font-mono">{r.lottery_markets?.code}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {r.result_main && r.result_main !== r.result_3top && (
                            <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">รางวัล</p>
                              <p className="text-sm font-bold text-slate-800">{r.result_main}</p>
                            </div>
                          )}
                          {r.result_3top && (
                            <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">3 ตัวบน</p>
                              <p className="text-sm font-bold text-slate-800">{r.result_3top}</p>
                            </div>
                          )}
                          {r.result_3front && (
                            <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">3 ตัวหน้า</p>
                              <p className="text-sm font-bold text-slate-800">{r.result_3front}</p>
                            </div>
                          )}
                          {r.result_3bottom && (
                            <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">3 ตัวล่าง</p>
                              <p className="text-sm font-bold text-slate-800">{r.result_3bottom}</p>
                            </div>
                          )}
                          {r.result_2top && (
                            <div className="text-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                              <p className="text-[8px] text-slate-400 font-bold uppercase">2 ตัวบน</p>
                              <p className="text-sm font-bold text-slate-800">{r.result_2top}</p>
                            </div>
                          )}
                          {r.result_2bottom && (
                            <div className="text-center bg-primary/5 p-2 rounded-xl border border-primary/10">
                              <p className="text-[8px] text-primary font-bold uppercase">2 ตัวล่าง</p>
                              <p className="text-sm font-bold text-primary">{r.result_2bottom}</p>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
                ))}
              </>;
            })()}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Results;
