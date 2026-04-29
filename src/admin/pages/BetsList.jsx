import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { RefreshCw } from 'lucide-react';

const fmt = (n) => Number(n||0).toLocaleString('th-TH');
const fmtDate = (d) => d ? new Date(d).toLocaleString('th-TH') : '-';

export default function BetsList() {
  const [tab, setTab] = useState('PENDING');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_bets', { p_status: tab, p_limit: 200, p_offset: 0 });
    if (!error) setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [tab]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">รายการโพยหวย</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg flex items-center gap-1"><RefreshCw size={14}/> รีเฟรช</button>
      </div>

      <div className="flex gap-2 border-b">
        {['PENDING','WON','LOST','CANCELLED'].map(s => (
          <button key={s} onClick={()=>setTab(s)} className={`px-3 py-2 text-sm ${tab===s?'border-b-2 border-emerald-600 font-semibold':'text-slate-500'}`}>
            {s==='PENDING'?'รอผล':s==='WON'?'ถูกรางวัล':s==='LOST'?'ไม่ถูก':'ยกเลิก'}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ไม่มีรายการ —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr><th className="p-2 text-left">เวลา</th><th className="p-2 text-left">สมาชิก</th><th className="p-2 text-left">ตลาด</th><th className="p-2 text-left">ประเภท</th><th className="p-2 text-left">เลข</th><th className="p-2 text-right">ยอดแทง</th><th className="p-2 text-right">รางวัล</th></tr>
            </thead>
            <tbody>
              {rows.map(b => (
                <tr key={b.id} className="border-t hover:bg-slate-50">
                  <td className="p-2 whitespace-nowrap text-xs">{fmtDate(b.created_at)}</td>
                  <td className="p-2"><div className="font-medium">{b.full_name||'-'}</div><div className="text-xs text-slate-500">{b.member_id}</div></td>
                  <td className="p-2 text-xs">{b.market_name}</td>
                  <td className="p-2 text-xs">{b.bet_type}</td>
                  <td className="p-2 font-mono">{b.numbers}</td>
                  <td className="p-2 text-right tabular-nums">{fmt(b.amount)}</td>
                  <td className="p-2 text-right tabular-nums text-emerald-600 font-semibold">{b.payout_amount ? fmt(b.payout_amount) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
