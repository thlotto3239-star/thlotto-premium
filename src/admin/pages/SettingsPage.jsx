import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Save, RefreshCw, Plus } from 'lucide-react';

export default function SettingsPage({ filterPrefix, title = 'ตั้งค่าหน้าเว็บ' }) {
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let q = supabase.from('settings').select('*').order('key');
    if (filterPrefix) q = q.like('key', `${filterPrefix}%`);
    const { data } = await q;
    setRows(data || []); setEdits({}); setLoading(false);
  };
  useEffect(() => { load(); }, [filterPrefix]);

  const save = async (key) => {
    const value = edits[key];
    if (value === undefined) return;
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: key, p_value: value });
    if (error) return alert(error.message);
    load();
  };

  const addNew = async () => {
    const key = window.prompt('ชื่อคีย์ใหม่ (เช่น ' + (filterPrefix ? filterPrefix + '_' : '') + 'xxx):');
    if (!key) return;
    const value = window.prompt('ค่า:') ?? '';
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: key, p_value: value });
    if (error) return alert(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">{title}</h1>
        <button onClick={addNew} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Plus size={14}/> เพิ่มคีย์</button>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg flex items-center gap-1"><RefreshCw size={14}/></button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ไม่มีคีย์ —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2 text-left w-1/3">คีย์</th><th className="p-2 text-left">ค่า</th><th className="p-2 text-left">คำอธิบาย</th><th className="p-2"></th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} className="border-t">
                  <td className="p-2 font-mono text-xs">{r.key}</td>
                  <td className="p-2"><input className="w-full border rounded px-2 py-1" defaultValue={r.value || ''} onChange={e => setEdits({...edits, [r.key]: e.target.value})}/></td>
                  <td className="p-2 text-xs text-slate-500">{r.description}</td>
                  <td className="p-2 text-right"><button onClick={() => save(r.key)} disabled={edits[r.key]===undefined} className="px-2 py-1 bg-emerald-600 text-white rounded text-xs disabled:opacity-30"><Save size={12} className="inline"/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
