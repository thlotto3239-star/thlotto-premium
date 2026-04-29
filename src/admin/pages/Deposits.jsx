import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Check, X, RefreshCw } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('th-TH');
const fmtDate = (d) => d ? new Date(d).toLocaleString('th-TH') : '-';

export default function Deposits() {
  const [tab, setTab] = useState('PENDING');     // PENDING | APPROVED | REJECTED
  const [type, setType] = useState('deposit');   // deposit | withdraw
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = async () => {
    setLoading(true);
    const table = type === 'deposit' ? 'deposit_requests' : 'withdraw_requests';
    const { data, error } = await supabase
      .from(table)
      .select(`*, profile:profiles!${table === 'deposit_requests' ? 'deposit_requests_profile_fkey' : 'withdraw_requests_profile_fkey'}(full_name, member_id, phone, bank_name, bank_account_number)`)
      .eq('status', tab)
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setRows(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab, type]);

  const act = async (id, action) => {
    setActing(id + action);
    const fn = type === 'deposit'
      ? (action === 'approve' ? 'admin_approve_deposit' : 'admin_reject_deposit')
      : (action === 'approve' ? 'admin_approve_withdraw' : 'admin_reject_withdraw');
    const note = action === 'reject' ? (window.prompt('เหตุผลที่ปฏิเสธ:') ?? '') : '';
    const { error } = await supabase.rpc(fn, { p_request_id: id, p_note: note });
    setActing(null);
    if (error) alert(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">รายการฝาก-ถอน</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1">
          <RefreshCw size={14}/> รีเฟรช
        </button>
      </div>

      <div className="flex gap-2">
        <button className={`px-3 py-1.5 rounded-lg text-sm ${type==='deposit' ? 'bg-emerald-600 text-white' : 'bg-white border'}`} onClick={() => setType('deposit')}>ฝากเงิน</button>
        <button className={`px-3 py-1.5 rounded-lg text-sm ${type==='withdraw' ? 'bg-rose-600 text-white' : 'bg-white border'}`} onClick={() => setType('withdraw')}>ถอนเงิน</button>
      </div>

      <div className="flex gap-2 border-b">
        {['PENDING','APPROVED','REJECTED'].map(s => (
          <button key={s} onClick={() => setTab(s)}
            className={`px-3 py-2 text-sm font-medium ${tab===s ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500'}`}>
            {s === 'PENDING' ? 'รออนุมัติ' : s === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500 text-sm">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400 text-sm">— ไม่มีรายการ —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-2">วันที่</th>
                <th className="text-left p-2">สมาชิก</th>
                <th className="text-right p-2">ยอด</th>
                <th className="text-left p-2">{type==='deposit' ? 'สลิป' : 'บัญชี'}</th>
                {tab === 'PENDING' && <th className="text-right p-2">การกระทำ</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td className="p-2">
                    <div className="font-medium">{r.profile?.full_name || '-'}</div>
                    <div className="text-xs text-slate-500">{r.profile?.member_id} · {r.profile?.phone}</div>
                  </td>
                  <td className="p-2 text-right font-bold tabular-nums">{fmt(r.amount)}</td>
                  <td className="p-2">
                    {type === 'deposit'
                      ? (r.slip_url
                          ? <a href={r.slip_url} target="_blank" rel="noreferrer" className="text-sky-600 underline">ดูสลิป</a>
                          : <span className="text-slate-400">—</span>)
                      : <div className="text-xs">{r.bank_name} {r.bank_account_number}</div>}
                  </td>
                  {tab === 'PENDING' && (
                    <td className="p-2 text-right whitespace-nowrap">
                      <button disabled={!!acting} onClick={() => act(r.id, 'approve')}
                        className="px-2 py-1 mr-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 disabled:opacity-50">
                        <Check size={14} className="inline"/> อนุมัติ
                      </button>
                      <button disabled={!!acting} onClick={() => act(r.id, 'reject')}
                        className="px-2 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700 disabled:opacity-50">
                        <X size={14} className="inline"/> ปฏิเสธ
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
