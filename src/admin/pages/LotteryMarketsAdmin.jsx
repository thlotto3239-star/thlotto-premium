import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Plus, Edit2, Trash2, Save, X, RefreshCw, CalendarDays } from 'lucide-react';

const DOW = [
  { val: 1, label: 'จ' }, { val: 2, label: 'อ' }, { val: 3, label: 'พ' },
  { val: 4, label: 'พฤ' }, { val: 5, label: 'ศ' }, { val: 6, label: 'ส' }, { val: 7, label: 'อา' },
];

const EMPTY = {
  name: '', code: '', category: 'FOREIGN', logo_url: '',
  draw_time: '16:00', close_minutes_before: 20,
  draw_days: [], draw_day_of_month: [],
  tz: 'Asia/Bangkok', display_order: 99,
  is_open: true, is_active: true,
};

export default function LotteryMarketsAdmin() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [rebuilding, setRebuilding] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('lottery_markets').select('*').order('display_order');
    setRows(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    // Parse draw_days from checkboxes
    const draw_days = DOW.map(d => d.val).filter(v => fd.get(`dow_${v}`) === 'on');

    // Parse draw_day_of_month from comma-separated string
    const domRaw = fd.get('draw_day_of_month') || '';
    const draw_day_of_month = domRaw
      ? domRaw.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 31)
      : [];

    const obj = {
      name: fd.get('name'),
      code: fd.get('code'),
      category: fd.get('category'),
      logo_url: fd.get('logo_url') || null,
      draw_time: fd.get('draw_time'),
      close_minutes_before: parseInt(fd.get('close_minutes_before')) || 20,
      draw_days: draw_days.length > 0 ? draw_days : null,
      draw_day_of_month: draw_day_of_month.length > 0 ? draw_day_of_month : null,
      tz: fd.get('tz') || 'Asia/Bangkok',
      display_order: parseInt(fd.get('display_order')) || 99,
      is_open: fd.get('is_open') === 'on',
      is_active: fd.get('is_active') === 'on',
    };

    let res;
    if (editing?.id) res = await supabase.from('lottery_markets').update(obj).eq('id', editing.id);
    else res = await supabase.from('lottery_markets').insert(obj);

    if (res.error) return alert(res.error.message);
    setEditing(null);
    load();
  };

  const del = async (row) => {
    if (!window.confirm(`ลบ "${row.name}"?`)) return;
    const { error } = await supabase.from('lottery_markets').delete().eq('id', row.id);
    if (error) alert(error.message); else load();
  };

  const rebuildSchedule = async (marketId, marketName) => {
    setRebuilding(marketId);
    const { data, error } = await supabase.rpc('admin_rebuild_draw_schedules', { p_market_id: marketId, p_days: 90 });
    setRebuilding(null);
    if (error) alert(error.message);
    else alert(`สร้าง schedule ใหม่ ${data} รายการ สำหรับ "${marketName}"`);
  };

  const categoryLabel = (c) => ({ GOV: 'รัฐบาล', FOREIGN: 'ต่างประเทศ', STOCK: 'หุ้น' }[c] || c);
  const formatDays = (row) => {
    if (row.draw_day_of_month?.length) return `วันที่ ${row.draw_day_of_month.join(',')} ของเดือน`;
    if (!row.draw_days?.length) return 'ทุกวัน';
    return row.draw_days.map(d => DOW.find(x => x.val === d)?.label || d).join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">ตลาดหวย &amp; ตารางออกรางวัล</h1>
        <button onClick={load} className="px-3 py-1.5 text-sm border rounded-lg bg-white hover:bg-slate-50 flex items-center gap-1"><RefreshCw size={14}/> รีเฟรช</button>
        <button onClick={() => setEditing({ ...EMPTY })} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg flex items-center gap-1"><Plus size={14}/> เพิ่มตลาด</button>
      </div>

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? <div className="p-6 text-center text-slate-500">กำลังโหลด...</div>
        : rows.length === 0 ? <div className="p-6 text-center text-slate-400">— ไม่มีรายการ —</div>
        : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-2 text-left">ชื่อ / โค้ด</th>
                <th className="p-2 text-left">หมวด</th>
                <th className="p-2 text-left">วันออก</th>
                <th className="p-2 text-left">เวลาออก</th>
                <th className="p-2 text-left">ปิดก่อน</th>
                <th className="p-2 text-center">เปิดรับ</th>
                <th className="p-2 text-center">ใช้งาน</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-slate-50">
                  <td className="p-2">
                    <div className="font-semibold">{r.name}</div>
                    <div className="text-xs text-slate-400">{r.code}</div>
                  </td>
                  <td className="p-2">{categoryLabel(r.category)}</td>
                  <td className="p-2 text-xs">{formatDays(r)}</td>
                  <td className="p-2 font-mono">{r.draw_time?.slice(0,5)}</td>
                  <td className="p-2">{r.close_minutes_before} นาที</td>
                  <td className="p-2 text-center">{r.is_open ? '✅' : '—'}</td>
                  <td className="p-2 text-center">{r.is_active ? '✅' : '—'}</td>
                  <td className="p-2 text-right whitespace-nowrap flex gap-1 justify-end">
                    <button
                      onClick={() => rebuildSchedule(r.id, r.name)}
                      disabled={rebuilding === r.id}
                      title="สร้าง schedule ใหม่"
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:opacity-50"
                    >
                      {rebuilding === r.id ? '...' : <CalendarDays size={12} className="inline"/>}
                    </button>
                    <button onClick={() => setEditing(r)} className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300"><Edit2 size={12} className="inline"/></button>
                    <button onClick={() => del(r)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs hover:bg-rose-700"><Trash2 size={12} className="inline"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-lg p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{editing.id ? 'แก้ไขตลาด' : 'เพิ่มตลาดใหม่'}</h3>
              <button onClick={() => setEditing(null)}><X size={18}/></button>
            </div>
            <form onSubmit={save} className="space-y-3">

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  ชื่อตลาด <span className="text-red-500">*</span>
                  <input name="name" required defaultValue={editing.name} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
                </label>
                <label className="block text-sm">
                  โค้ด (CODE)
                  <input name="code" defaultValue={editing.code} className="w-full border rounded px-2 py-1.5 mt-1 text-sm font-mono uppercase"/>
                </label>
              </div>

              <label className="block text-sm">
                หมวดหมู่
                <select name="category" defaultValue={editing.category} className="w-full border rounded px-2 py-1.5 mt-1 text-sm">
                  <option value="GOV">รัฐบาล (GOV)</option>
                  <option value="FOREIGN">ต่างประเทศ (FOREIGN)</option>
                  <option value="STOCK">หุ้น (STOCK)</option>
                </select>
              </label>

              <label className="block text-sm">
                URL โลโก้
                <input name="logo_url" type="url" defaultValue={editing.logo_url || ''} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
              </label>

              <hr className="my-2"/>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ตารางออกรางวัล</p>

              {/* Draw Days of Week */}
              <div className="text-sm">
                <p className="mb-2 font-medium">วันออกรางวัล (วันในสัปดาห์)</p>
                <div className="flex gap-2 flex-wrap">
                  {DOW.map(d => (
                    <label key={d.val} className="flex flex-col items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        name={`dow_${d.val}`}
                        defaultChecked={(editing.draw_days || []).includes(d.val)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-xs font-bold">{d.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">ไม่เลือก = ทุกวัน (ใช้กับหวยรายวัน)</p>
              </div>

              {/* Draw Day of Month */}
              <label className="block text-sm">
                วันที่ในเดือน (เว้นด้วยเครื่องหมาย ,)
                <input
                  name="draw_day_of_month"
                  placeholder="เช่น 1,16 สำหรับหวยรัฐบาล (เว้นว่างถ้าใช้วันในสัปดาห์)"
                  defaultValue={(editing.draw_day_of_month || []).join(',')}
                  className="w-full border rounded px-2 py-1.5 mt-1 text-sm"
                />
                <span className="text-[11px] text-slate-400">ถ้ากำหนดนี้ จะใช้แทนวันในสัปดาห์ข้างบน</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  เวลาออกรางวัล
                  <input name="draw_time" type="time" required defaultValue={editing.draw_time?.slice(0,5) || '16:00'} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
                </label>
                <label className="block text-sm">
                  ปิดรับก่อน (นาที)
                  <input name="close_minutes_before" type="number" min="1" max="120" defaultValue={editing.close_minutes_before ?? 20} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  Timezone
                  <input name="tz" defaultValue={editing.tz || 'Asia/Bangkok'} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
                </label>
                <label className="block text-sm">
                  ลำดับแสดง
                  <input name="display_order" type="number" defaultValue={editing.display_order ?? 99} className="w-full border rounded px-2 py-1.5 mt-1 text-sm"/>
                </label>
              </div>

              <hr className="my-2"/>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="is_open" defaultChecked={editing.is_open ?? true} className="w-4 h-4 accent-emerald-600"/>
                  เปิดรับแทง
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" name="is_active" defaultChecked={editing.is_active ?? true} className="w-4 h-4 accent-emerald-600"/>
                  เปิดใช้งาน
                </label>
              </div>

              <p className="text-[11px] text-blue-600 bg-blue-50 rounded p-2">
                💡 เมื่อบันทึก ระบบจะสร้าง schedule 90 วันล่วงหน้าโดยอัตโนมัติ และ countdown จะอัปเดตทันที
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="px-3 py-1.5 border rounded text-sm">ยกเลิก</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm flex items-center gap-1"><Save size={14}/> บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
