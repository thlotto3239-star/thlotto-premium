import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Trash2, Save, X } from 'lucide-react';

const BET_TYPES = ['3top','3bottom','3front','2top','2bottom','run_top','run_bottom'];

export default function RestrictedNumbers() {
  const [markets, setMarkets] = useState([]);
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [m, r] = await Promise.all([
      supabase.from('lottery_markets').select('id, name').order('display_order'),
      supabase.from('restricted_numbers').select('*, market:lottery_markets(name)').order('created_at', { ascending: false }),
    ]);
    setMarkets(m.data || []);
    setRows(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      id: editing?.id || null,
      market_id: fd.get('market_id'),
      bet_type:  fd.get('bet_type'),
      number:    fd.get('number'),
      max_amount: fd.get('max_amount') || 0,
      payout_rate: fd.get('payout_rate') || null,
      draw_date:  fd.get('draw_date') || null,
      note:       fd.get('note'),
    };
    const { error } = await supabase.rpc('admin_upsert_restricted_number', { p: payload });
    if (error) return alert(error.message);
    setEditing(null); load();
  };

  const del = async (id) => {
    if (!window.confirm('ลบเลขนี้?')) return;
    const { error } = await supabase.rpc('admin_delete_restricted_number', { p_id: id });
    if (error) return alert(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">จัดการเลขอั้น</h1>
        <button onClick={() => setEditing({})} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Plus size={14}/> เพิ่มเลข</button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-2 text-left">ตลาด</th><th className="p-2 text-left">ประเภท</th><th className="p-2 text-left">เลข</th><th className="p-2 text-right">ยอดสูงสุด</th><th className="p-2 text-right">อัตราจ่าย</th><th className="p-2 text-left">วันที่</th><th className="p-2 text-left">หมายเหตุ</th><th className="p-2"></th></tr>
          </thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={8} className="p-6 text-center text-slate-400">— ไม่มีเลขอั้น —</td></tr>
            : rows.map(r => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="p-2">{r.market?.name || 'ทุกตลาด'}</td>
                <td className="p-2">{r.bet_type}</td>
                <td className="p-2 font-mono font-bold">{r.number}</td>
                <td className="p-2 text-right tabular-nums">{r.max_amount == 0 ? <span className="text-rose-600 font-semibold">ห้ามรับ</span> : Number(r.max_amount).toLocaleString()}</td>
                <td className="p-2 text-right tabular-nums">{r.payout_rate || '—'}</td>
                <td className="p-2">{r.draw_date || 'ทุกงวด'}</td>
                <td className="p-2 text-xs text-slate-500">{r.note}</td>
                <td className="p-2 text-right"><button onClick={() => del(r.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs"><Trash2 size={12} className="inline"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="flex justify-between mb-3"><h3 className="font-bold">{editing.id ? 'แก้ไขเลขอั้น' : 'เพิ่มเลขอั้น'}</h3><button onClick={()=>setEditing(null)}><X size={18}/></button></div>
            <form onSubmit={save} className="space-y-3 text-sm">
              <label>ตลาด<select name="market_id" defaultValue={editing.market_id||''} className="w-full border rounded px-2 py-1.5 mt-1"><option value="">— ทุกตลาด —</option>{markets.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
              <label>ประเภท<select name="bet_type" defaultValue={editing.bet_type||'3top'} className="w-full border rounded px-2 py-1.5 mt-1">{BET_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></label>
              <label>เลข<input name="number" defaultValue={editing.number||''} required className="w-full border rounded px-2 py-1.5 mt-1"/></label>
              <label>ยอดสูงสุด (0=ห้ามรับ)<input name="max_amount" type="number" step="0.01" defaultValue={editing.max_amount ?? 0} className="w-full border rounded px-2 py-1.5 mt-1"/></label>
              <label>อัตราจ่าย override (ว่าง=ปกติ)<input name="payout_rate" type="number" step="0.01" defaultValue={editing.payout_rate||''} className="w-full border rounded px-2 py-1.5 mt-1"/></label>
              <label>เฉพาะงวด (ว่าง=ทุกงวด)<input name="draw_date" type="date" defaultValue={editing.draw_date||''} className="w-full border rounded px-2 py-1.5 mt-1"/></label>
              <label>หมายเหตุ<input name="note" defaultValue={editing.note||''} className="w-full border rounded px-2 py-1.5 mt-1"/></label>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={()=>setEditing(null)} className="px-3 py-1.5 border rounded">ยกเลิก</button><button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded flex items-center gap-1"><Save size={14}/> บันทึก</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
