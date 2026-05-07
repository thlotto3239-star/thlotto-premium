import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv';

const parseCSV = (text) => {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
    return { code: cols[0], name: cols[1], date: cols[2], main: cols[3], top3: cols[4], bot2: cols[5], col6: cols[6], logo: cols[7] };
  }).filter(r => r.code);
};

const isPending = (v) => {
  if (!v) return true;
  const s = v.trim().toLowerCase();
  return !s || s === 'รอผล' || /^[x\s-]+$/.test(s);
};

const fmtCsvDate = (dateStr) => {
  if (!dateStr) return '';
  const thMatch = dateStr.match(/(\d{1,2})\s+([\u0e00-\u0e7f]+)\s+(\d{4})/);
  if (thMatch) return `${thMatch[1]} ${thMatch[2]} ${thMatch[3]}`;
  const slashMatch = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slashMatch) {
    let [, d, m, y] = slashMatch;
    if (parseInt(y) > 2400) y = String(parseInt(y) - 543);
    else if (y.length === 2) { const n = parseInt(y); y = n > 43 ? String(n + 1957) : String(2000 + n); }
    const dt = new Date(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}T00:00:00`);
    return dt.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return dateStr;
};

const FOREIGN_CODES = ['LAO_DEV','HANOI_VIP','HANOI','HANOI_SPECIAL','MALAY'];
const isStock = (code) => code && (code.startsWith('STOCK_') || code.startsWith('NIKKEI_') || code.startsWith('CHINA_') || code.startsWith('HANGSENG_'));

const Results = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCSV = useCallback(() => {
    fetch(CSV_URL + '&t=' + Date.now())
      .then(r => r.text())
      .then(text => { setRows(parseCSV(text)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCSV();
    const interval = setInterval(fetchCSV, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCSV]);

  const govRow    = rows.find(r => r.code === 'TH_GOV');
  const foreignRows = rows.filter(r => FOREIGN_CODES.includes(r.code));
  const stockRows   = rows.filter(r => isStock(r.code));


  return (
    <div className="bg-white min-h-screen text-slate-900 font-body flex flex-col">
      <AppHeader />

      <main className="flex-1 overflow-y-auto px-6 pb-40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* ── GOV CARD ── */}
            {govRow && (
              <section className="mb-8">
                <div className="bg-[#064e3b] rounded-[2.5rem] overflow-hidden text-white border border-emerald-900/10">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                          <img alt="Government Crest" className="w-full h-full object-cover" src={govRow.logo || 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Seal_of_the_Government_Lottery_Office.png/240px-Seal_of_the_Government_Lottery_Office.png'} />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-bold">สลากกินแบ่งรัฐบาล</h2>
                          <p className="text-white/70 text-[10px] font-medium truncate">
                            {fmtCsvDate(govRow.date)}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shrink-0 ml-2 ${isPending(govRow.main) ? 'bg-red-500 text-white' : 'bg-green-400 text-white'}`}>
                        {isPending(govRow.main) ? 'รอประกาศผล' : 'ประกาศผลแล้ว'}
                      </div>
                    </div>
                    <div className="mb-6 text-center">
                      <p className="text-white/80 text-[11px] font-medium mb-3">รางวัลที่ 1</p>
                      <div className="flex justify-center gap-1.5">
                        {isPending(govRow.main)
                          ? Array.from({ length: 6 }).map((_, i) => (
                              <span key={i} className="w-10 h-10 bg-white/15 border border-white/20 rounded-full flex items-center justify-center text-white/30 font-bold text-xl">?</span>
                            ))
                          : (govRow.main).split('').map((digit, i) => (
                              <span key={i} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#064e3b] font-bold text-xl">{digit}</span>
                            ))
                        }
                      </div>
                    </div>
                    <div className="h-px bg-white/10 mb-5"></div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-white/60 text-[9px] font-medium mb-1">3 ตัวหน้า</p>
                        <div className="text-base font-bold">
                          {govRow.top3 || '—'}
                        </div>
                      </div>
                      <div>
                        <p className="text-white/60 text-[9px] font-medium mb-1">2 ตัวล่าง</p>
                        <div className="text-xl font-bold">
                          {govRow.col6 || '—'}
                        </div>
                      </div>
                      <div>
                        <p className="text-white/60 text-[9px] font-medium mb-1">3 ตัวท้าย</p>
                        <div className="text-base font-bold">
                          {govRow.bot2 || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ── FOREIGN LOTTERY ── */}
            {foreignRows.length > 0 && (
              <section className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900">ผลหวยอื่นๆ</h3>
                </div>
                <div className="space-y-3">
                  {foreignRows.map((r) => {
                    const pending = isPending(r.main) && isPending(r.top3);
                    const display2Top  = r.col6;
                    const display2Bot  = r.bot2;
                    return (
                      <div key={r.code} className="bg-white p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
                              {r.logo
                                ? <img alt={r.name} className="w-full h-full object-cover" src={r.logo} />
                                : <span className="material-symbols-outlined text-slate-400 text-lg">flag</span>}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm whitespace-nowrap truncate">{r.name}</h4>
                              <p className="text-[9px] text-slate-400 font-medium whitespace-nowrap">{fmtCsvDate(r.date)}</p>
                            </div>
                          </div>
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${pending ? 'bg-slate-100 text-slate-400' : 'bg-green-100 text-green-700'}`}>
                            {pending ? 'รอผล' : 'ประกาศแล้ว'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <p className="text-[7px] text-slate-400 font-bold uppercase">รางวัล</p>
                            <p className="text-xs font-bold text-slate-800">{r.main || r.top3 || '—'}</p>
                          </div>
                          <div className="text-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <p className="text-[7px] text-slate-400 font-bold uppercase">3 บน</p>
                            <p className="text-xs font-bold text-slate-800">{r.top3 || '—'}</p>
                          </div>
                          <div className="text-center bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <p className="text-[7px] text-slate-400 font-bold uppercase">2 บน</p>
                            <p className="text-xs font-bold text-slate-800">{display2Top || '—'}</p>
                          </div>
                          <div className="text-center bg-primary/5 p-1.5 rounded-xl border border-primary/10">
                            <p className="text-[7px] text-primary font-bold uppercase">2 ล่าง</p>
                            <p className="text-xs font-bold text-primary">{display2Bot || '—'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  {stockRows.map((r) => {
                    return (
                      <div key={r.code} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {r.logo ? (
                            <img alt={r.name} className="w-8 h-8 rounded-full object-cover shrink-0" src={r.logo} />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-slate-400 text-sm">show_chart</span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-xs whitespace-nowrap truncate">{r.name}</h4>
                            <p className="text-[8px] text-slate-400 whitespace-nowrap">{fmtCsvDate(r.date)}</p>
                          </div>
                        </div>
                        <div className="flex gap-4 text-right">
                          <div>
                            <p className="text-[7px] text-slate-400 font-bold uppercase">3 ตัว</p>
                            <p className="text-xs font-bold text-slate-800">{r.top3 || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-primary font-bold uppercase">2 ตัว</p>
                            <p className="text-xs font-bold text-primary">{r.bot2 || '—'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Results;
