import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Search, RefreshCw, Edit2, Save, X } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

export default function Members() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [adjustOpen, setAdjustOpen] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('admin_list_members', { p_search: search || null, p_limit: 100, p_offset: 0 });
    if (!error) setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const startEdit = (m) => {
    setEditId(m.id);
    setEditForm({ status: m.status, vip_level: m.vip_level, is_admin: m.is_admin, full_name: m.full_name, phone: m.phone });
  };

  const saveEdit = async () => {
    const { error } = await supabase.rpc('admin_update_member', { p_user_id: editId, p_patch: editForm });
    if (error) return alert(error.message);
    setEditId(null); load();
  };

  const adjust = async (userId, delta, note) => {
    const { error } = await supabase.rpc('admin_adjust_wallet', { p_user_id: userId, p_delta: delta, p_note: note });
    if (error) return alert(error.message);
    setAdjustOpen(null); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">สมาชิกทั้งหมด</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
              placeholder="ค้นหา ชื่อ/เบอร์/รหัส" className="pl-7 pr-2 py-1.5 border rounded-lg text-sm w-56"/>
          </div>
          <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1">
            <RefreshCw size={14}/> รีเฟรช
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ไม่มีสมาชิก —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-2">รหัส/ชื่อ</th>
                <th className="text-left p-2">เบอร์</th>
                <th className="text-right p-2">ยอดเงิน</th>
                <th className="text-right p-2">คอมมิชชั่น</th>
                <th className="text-center p-2">สถานะ</th>
                <th className="text-center p-2">VIP</th>
                <th className="text-center p-2">Admin</th>
                <th className="text-right p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(m => editId === m.id ? (
                <tr key={m.id} className="border-t bg-amber-50">
                  <td className="p-2"><input className="border rounded px-1 py-0.5 w-32" value={editForm.full_name||''} onChange={e=>setEditForm({...editForm,full_name:e.target.value})}/></td>
                  <td className="p-2"><input className="border rounded px-1 py-0.5 w-28" value={editForm.phone||''} onChange={e=>setEditForm({...editForm,phone:e.target.value})}/></td>
                  <td colSpan={2}></td>
                  <td className="p-2"><select className="border rounded px-1 py-0.5" value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})}><option value="active">active</option><option value="suspended">suspended</option><option value="banned">banned</option></select></td>
                  <td className="p-2"><input className="border rounded px-1 py-0.5 w-20" value={editForm.vip_level||''} onChange={e=>setEditForm({...editForm,vip_level:e.target.value})}/></td>
                  <td className="p-2 text-center"><input type="checkbox" checked={editForm.is_admin||false} onChange={e=>setEditForm({...editForm,is_admin:e.target.checked})}/></td>
                  <td className="p-2 text-right">
                    <button onClick={saveEdit} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs"><Save size={12} className="inline"/></button>
                    <button onClick={()=>setEditId(null)} className="ml-1 px-2 py-1 bg-slate-300 rounded text-xs"><X size={12} className="inline"/></button>
                  </td>
                </tr>
              ) : (
                <tr key={m.id} className="border-t hover:bg-slate-50">
                  <td className="p-2"><div className="font-medium">{m.full_name || '-'}</div><div className="text-xs text-slate-500">{m.member_id}</div></td>
                  <td className="p-2 text-xs">{m.phone || '-'}</td>
                  <td className="p-2 text-right tabular-nums">{fmt(m.balance)}</td>
                  <td className="p-2 text-right tabular-nums text-slate-500">{fmt(m.commission_balance)}</td>
                  <td className="p-2 text-center"><span className={`text-xs px-2 py-0.5 rounded-full ${m.status==='active'?'bg-emerald-50 text-emerald-700':'bg-rose-50 text-rose-700'}`}>{m.status}</span></td>
                  <td className="p-2 text-center text-xs">{m.vip_level}</td>
                  <td className="p-2 text-center">{m.is_admin ? '✅' : ''}</td>
                  <td className="p-2 text-right whitespace-nowrap">
                    <button onClick={()=>setAdjustOpen(m)} className="px-2 py-1 bg-sky-600 text-white rounded text-xs hover:bg-sky-700">เติม/หัก</button>
                    <button onClick={()=>startEdit(m)} className="ml-1 px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"><Edit2 size={12} className="inline"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {adjustOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={()=>setAdjustOpen(null)}>
          <div className="bg-white rounded-lg p-5 w-80" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-1">ปรับยอด {adjustOpen.full_name}</h3>
            <div className="text-xs text-slate-500 mb-3">ยอดปัจจุบัน {fmt(adjustOpen.balance)} บาท</div>
            <form onSubmit={e=>{e.preventDefault(); const f=new FormData(e.target); adjust(adjustOpen.id, parseFloat(f.get('delta')), f.get('note'));}}>
              <input name="delta" type="number" step="0.01" placeholder="+/- จำนวน เช่น 100 หรือ -50" required className="w-full border rounded px-2 py-1.5 mb-2"/>
              <input name="note" type="text" placeholder="เหตุผล" required className="w-full border rounded px-2 py-1.5 mb-3"/>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>setAdjustOpen(null)} className="px-3 py-1.5 border rounded text-sm">ยกเลิก</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm">ยืนยัน</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
