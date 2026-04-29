import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit2, Trash2, Save, X, RefreshCw } from 'lucide-react';

// Generic admin CRUD for content tables. RLS must allow admin via policy or service path.
// Used for: banks, sliders, promotions, articles, announcements, trending_items, payout_rates, restricted_numbers, lottery_markets

export default function GenericCrud({ title, table, columns, defaults = {}, orderBy = 'created_at', orderAsc = false, customSubmit }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | object (new = {})

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from(table).select('*').order(orderBy, { ascending: orderAsc }).limit(500);
    if (!error) setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [table]);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const obj = { ...defaults };
    columns.forEach(c => {
      if (c.readonly) return;
      let v = fd.get(c.key);
      if (c.type === 'number') v = v === '' ? null : Number(v);
      if (c.type === 'boolean') v = fd.get(c.key) === 'on';
      if (c.type === 'date' && !v) v = null;
      obj[c.key] = v;
    });
    let res;
    if (customSubmit) res = await customSubmit(obj, editing);
    else if (editing && editing.id) res = await supabase.from(table).update(obj).eq('id', editing.id);
    else res = await supabase.from(table).insert(obj);
    if (res.error) return alert(res.error.message);
    setEditing(null); load();
  };

  const del = async (row) => {
    if (!window.confirm('ลบรายการนี้?')) return;
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    if (error) return alert(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">{title}</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1"><RefreshCw size={14}/> รีเฟรช</button>
        <button onClick={() => setEditing({})} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Plus size={14}/> เพิ่ม</button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ไม่มีรายการ —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>{columns.map(c => <th key={c.key} className="p-2 text-left">{c.label}</th>)}<th className="p-2"></th></tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  {columns.map(c => (
                    <td key={c.key} className="p-2 max-w-xs truncate">
                      {c.type === 'image' && r[c.key] ? <img src={r[c.key]} className="w-12 h-12 object-cover rounded" alt=""/>
                       : c.type === 'boolean' ? (r[c.key] ? '✅' : '—')
                       : c.type === 'number' ? Number(r[c.key]||0).toLocaleString('th-TH')
                       : (r[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="p-2 text-right whitespace-nowrap">
                    <button onClick={() => setEditing(r)} className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"><Edit2 size={12} className="inline"/></button>
                    <button onClick={() => del(r)} className="ml-1 px-2 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700"><Trash2 size={12} className="inline"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3" onClick={()=>setEditing(null)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">{editing.id ? 'แก้ไข' : 'เพิ่มใหม่'}</h3>
              <button onClick={()=>setEditing(null)}><X size={18}/></button>
            </div>
            <form onSubmit={save} className="space-y-3">
              {columns.filter(c => !c.readonly).map(c => (
                <label key={c.key} className="block text-sm">
                  {c.label}
                  {c.type === 'boolean'
                    ? <input type="checkbox" name={c.key} defaultChecked={editing[c.key] ?? c.default ?? false} className="ml-2"/>
                    : c.type === 'textarea'
                    ? <textarea name={c.key} defaultValue={editing[c.key] ?? ''} rows={4} className="w-full border rounded px-2 py-1.5 mt-1"/>
                    : c.type === 'select'
                    ? <select name={c.key} defaultValue={editing[c.key] ?? c.options?.[0]?.value} className="w-full border rounded px-2 py-1.5 mt-1">
                        {c.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    : <input type={c.type === 'image' ? 'url' : (c.type || 'text')} name={c.key} defaultValue={editing[c.key] ?? c.default ?? ''} className="w-full border rounded px-2 py-1.5 mt-1"/>}
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setEditing(null)} className="px-3 py-1.5 border rounded text-sm">ยกเลิก</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm flex items-center gap-1"><Save size={14}/> บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
