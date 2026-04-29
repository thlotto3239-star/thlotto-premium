import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { RefreshCw } from 'lucide-react';

const fmt = (n) => Number(n||0).toLocaleString('th-TH');
const fmtDate = (d) => d ? new Date(d).toLocaleString('th-TH') : '-';

export default function LuckyWheelHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lucky_wheel_spins')
      .select('*, profile:profiles(full_name, member_id)')
      .order('spun_at', { ascending: false }).limit(200);
    setRows(data || []); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">ประวัติกงล้อ</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg flex items-center gap-1"><RefreshCw size={14}/></button>
      </div>
      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ยังไม่มีการหมุน —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2 text-left">เวลา</th><th className="p-2 text-left">สมาชิก</th><th className="p-2 text-left">รางวัล</th><th className="p-2 text-right">มูลค่า</th><th className="p-2 text-right">ค่าหมุน</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 text-xs">{fmtDate(r.spun_at)}</td>
                  <td className="p-2"><div className="font-medium">{r.profile?.full_name||'-'}</div><div className="text-xs text-slate-500">{r.profile?.member_id}</div></td>
                  <td className="p-2">{r.prize_name}</td>
                  <td className="p-2 text-right text-emerald-600 font-semibold">{fmt(r.prize_amount)}</td>
                  <td className="p-2 text-right text-slate-500">{fmt(r.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
