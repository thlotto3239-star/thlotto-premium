import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Trophy, Save } from 'lucide-react';

export default function Results() {
  const [markets, setMarkets] = useState([]);
  const [recent, setRecent] = useState([]);
  const [form, setForm] = useState({ market_id: '', draw_date: new Date().toISOString().slice(0,10) });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [m, r] = await Promise.all([
      supabase.from('lottery_markets').select('id, code, name').eq('is_active', true).order('display_order'),
      supabase.from('lottery_results').select('*, market:lottery_markets(name, code)').order('created_at', { ascending: false }).limit(30),
    ]);
    setMarkets(m.data || []);
    setRecent(r.data || []);
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.rpc('admin_set_result_and_settle', {
      p_market_id: form.market_id,
      p_draw_date: form.draw_date,
      p_result_main: form.result_main || null,
      p_3top:        form.result_3top || null,
      p_3bottom:     form.result_3bottom || null,
      p_3front:      form.result_3front || null,
      p_2top:        form.result_2top || null,
      p_2bottom:     form.result_2bottom || null,
    });
    setBusy(false);
    if (error) return alert(error.message);
    alert('บันทึกผลและประมวลโพยเรียบร้อย');
    setForm({ market_id: '', draw_date: form.draw_date });
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><Trophy size={20}/> ผลรางวัล</h1>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-3">บันทึกผล / ปิดงวด</h2>
        <form onSubmit={submit} className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <label>หวย
            <select required value={form.market_id} onChange={e=>setForm({...form, market_id: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1">
              <option value="">เลือกตลาด</option>
              {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          <label>วันที่งวด
            <input type="date" required value={form.draw_date} onChange={e=>setForm({...form, draw_date: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>รางวัลที่ 1 / Main
            <input value={form.result_main||''} onChange={e=>setForm({...form, result_main: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>3 ตัวบน
            <input value={form.result_3top||''} onChange={e=>setForm({...form, result_3top: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>3 ตัวล่าง
            <input value={form.result_3bottom||''} onChange={e=>setForm({...form, result_3bottom: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>3 ตัวหน้า
            <input value={form.result_3front||''} onChange={e=>setForm({...form, result_3front: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>2 ตัวบน
            <input value={form.result_2top||''} onChange={e=>setForm({...form, result_2top: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <label>2 ตัวล่าง
            <input value={form.result_2bottom||''} onChange={e=>setForm({...form, result_2bottom: e.target.value})} className="w-full border rounded px-2 py-1.5 mt-1"/>
          </label>
          <div className="md:col-span-3">
            <button disabled={busy} className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
              <Save size={14}/> {busy ? 'กำลังบันทึก...' : 'บันทึกและปิดงวด'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        <h2 className="font-semibold p-3 border-b">ผลล่าสุด</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr><th className="p-2 text-left">หวย</th><th className="p-2 text-left">งวด</th><th className="p-2">ผลหลัก</th><th className="p-2">3บน</th><th className="p-2">2ล่าง</th><th className="p-2 text-left">สถานะ</th></tr>
          </thead>
          <tbody>
            {recent.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.market?.name}</td>
                <td className="p-2">{r.draw_date}</td>
                <td className="p-2 text-center font-mono">{r.result_main || '-'}</td>
                <td className="p-2 text-center font-mono">{r.result_3top || '-'}</td>
                <td className="p-2 text-center font-mono">{r.result_2bottom || '-'}</td>
                <td className="p-2"><span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
