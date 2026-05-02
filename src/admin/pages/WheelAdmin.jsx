import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const N = 8;
const DEG = 360 / N;
const toR = d => d * Math.PI / 180;
const CX = 80, CY = 80, R = 68;

const buildArc = (i) => {
  const a1 = -90 + i * DEG, a2 = a1 + DEG;
  const x1 = CX + R * Math.cos(toR(a1)), y1 = CY + R * Math.sin(toR(a1));
  const x2 = CX + R * Math.cos(toR(a2)), y2 = CY + R * Math.sin(toR(a2));
  return `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R},0,0,1,${x2.toFixed(1)},${y2.toFixed(1)} Z`;
};

const labelPos = i => {
  const mid = -90 + i * DEG + DEG / 2, tr = R * 0.63;
  return { x: (CX + tr * Math.cos(toR(mid))).toFixed(1), y: (CY + tr * Math.sin(toR(mid))).toFixed(1), r: mid + 90 };
};

const PRESET_COLORS = [
  ['#b45309','#f59e0b'],['#1d4ed8','#3b82f6'],['#6d28d9','#8b5cf6'],
  ['#065f46','#10b981'],['#1e293b','#475569'],['#be185d','#ec4899'],
  ['#b91c1c','#f87171'],['#0369a1','#38bdf8'],
];

export default function WheelAdmin() {
  const [prizes, setPrizes]   = useState([]);
  const [settings, setSettings] = useState({ lucky_wheel_cost: '10', lucky_wheel_daily_limit: '5' });
  const [edits, setEdits]     = useState({});       // { slotIndex: {...fields} }
  const [saving, setSaving]   = useState({});
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_get_wheel_config');
    if (data?.success) {
      setPrizes(data.prizes || []);
      setSettings(s => ({ ...s, ...data.settings }));
    }
    setEdits({});
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  const current = (slot, field) =>
    edits[slot.slot_index]?.[field] ?? slot[field];

  const setField = (slotIndex, field, value) => {
    setEdits(e => ({
      ...e,
      [slotIndex]: { ...(e[slotIndex] || {}), [field]: value },
    }));
  };

  const saveSlot = async (slot) => {
    const i = slot.slot_index;
    setSaving(s => ({ ...s, [i]: true }));
    const { data } = await supabase.rpc('admin_update_wheel_prize', {
      p_slot_index:  i,
      p_name:        current(slot, 'name'),
      p_amount:      Number(current(slot, 'amount')),
      p_probability: Number(current(slot, 'probability')),
      p_color:       current(slot, 'color'),
      p_hi_color:    current(slot, 'hi_color'),
      p_is_active:   current(slot, 'is_active'),
    });
    setSaving(s => ({ ...s, [i]: false }));
    if (data?.success) {
      setMsg({ type: 'ok', text: `บันทึก Slot ${i} สำเร็จ` });
      load();
    } else {
      setMsg({ type: 'err', text: data?.message || 'เกิดข้อผิดพลาด' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const saveSetting = async (key) => {
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: key, p_value: settings[key] });
    if (!error) { setMsg({ type: 'ok', text: `บันทึก ${key} สำเร็จ` }); load(); }
    else setMsg({ type: 'err', text: error.message });
    setTimeout(() => setMsg(null), 3000);
  };

  const totalProb = prizes.reduce((s, p) => s + Number(current(p, 'probability')), 0);
  const probOk = Math.abs(totalProb - 100) < 0.01;

  if (loading) return <div className="p-8 text-center text-slate-500">กำลังโหลด...</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold">ตั้งค่ากงล้อ Lucky Wheel</h1>
          <p className="text-sm text-slate-500 mt-0.5">ปรับรางวัล, อัตราจ่าย, เปอร์เซ็นต์ และสีของแต่ละช่อง</p>
        </div>
        <button onClick={load} className="ml-auto px-3 py-1.5 text-sm border rounded-lg flex items-center gap-1 hover:bg-slate-50">
          <RefreshCw size={14}/> รีโหลด
        </button>
      </div>

      {/* Status bar */}
      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.type === 'ok' ? <CheckCircle size={16}/> : <AlertTriangle size={16}/>}
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Preview Wheel */}
        <div className="bg-white border rounded-xl p-5 flex flex-col items-center gap-4">
          <h2 className="font-bold text-sm text-slate-700 self-start">ตัวอย่างวงล้อ</h2>
          <svg viewBox="0 0 160 160" className="w-48 h-48">
            {prizes.map((p, i) => {
              const col = current(p, 'color');
              const t = labelPos(i);
              const active = activeSlot === i;
              return (
                <g key={i} onClick={() => setActiveSlot(active ? null : i)} className="cursor-pointer">
                  <path d={buildArc(i, col)} fill={col}
                    stroke={active ? '#f59e0b' : 'rgba(0,0,0,0.3)'} strokeWidth={active ? 3 : 1.5} />
                  <g transform={`translate(${t.x},${t.y}) rotate(${t.r})`}>
                    <text textAnchor="middle" dominantBaseline="middle"
                      fontSize={current(p, 'name').length > 4 ? '7' : '10'}
                      fontWeight="900" fill="white" fontFamily="sans-serif">
                      {current(p, 'name')}
                    </text>
                  </g>
                </g>
              );
            })}
            {prizes.map((_, i) => {
              const a = toR(-90 + i * DEG);
              return <line key={i} x1={CX} y1={CY} x2={(CX + R * Math.cos(a)).toFixed(1)} y2={(CY + R * Math.sin(a)).toFixed(1)} stroke="rgba(0,0,0,0.3)" strokeWidth="1.5"/>;
            })}
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
            <circle cx={CX} cy={CY} r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2"/>
            <text x={CX} y={CY+1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#34d399" fontWeight="900">★</text>
            {/* pointer */}
            <polygon points={`${CX},${CY - R - 10} ${CX - 6},${CY - R - 1} ${CX + 6},${CY - R - 1}`} fill="#34d399"/>
          </svg>
          <p className="text-xs text-slate-400 text-center">คลิกที่ช่องเพื่อเลือก</p>

          {/* Prob total indicator */}
          <div className={`w-full text-center text-sm font-bold rounded-lg py-2 ${probOk ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            รวมเปอร์เซ็นต์: {totalProb.toFixed(2)}%
            {!probOk && <span className="block text-xs font-normal mt-0.5">⚠ ควรรวมเท่ากับ 100%</span>}
          </div>
        </div>

        {/* Slot list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-bold text-sm text-slate-700">ตั้งค่าแต่ละช่อง (8 ช่อง)</h2>
          {prizes.map((slot) => {
            const i = slot.slot_index;
            const isActive = activeSlot === i;
            return (
              <div key={i}
                className={`bg-white border rounded-xl transition-all ${isActive ? 'border-amber-300 shadow-md' : 'border-slate-100'}`}>
                {/* Slot header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setActiveSlot(isActive ? null : i)}>
                  <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-black"
                    style={{ background: current(slot, 'color') }}>
                    {i}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{current(slot, 'name')}</p>
                    <p className="text-xs text-slate-400">จ่าย ฿{current(slot, 'amount')} · โอกาส {Number(current(slot, 'probability')).toFixed(1)}%</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${current(slot,'is_active') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {current(slot,'is_active') ? 'เปิด' : 'ปิด'}
                    </span>
                    <span className="text-slate-400 text-lg">{isActive ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded editor */}
                {isActive && (
                  <div className="px-4 pb-4 border-t border-slate-100 pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อรางวัล</label>
                        <input className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={current(slot, 'name')}
                          onChange={e => setField(i, 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">จำนวนเงินที่จ่าย (฿)</label>
                        <input type="number" min="0" step="1" className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={current(slot, 'amount')}
                          onChange={e => setField(i, 'amount', e.target.value)} />
                        <p className="text-[10px] text-slate-400 mt-0.5">0 = ไม่ได้รางวัล</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">โอกาสชนะ (%)</label>
                        <input type="number" min="0.1" max="99" step="0.5" className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={current(slot, 'probability')}
                          onChange={e => setField(i, 'probability', e.target.value)} />
                        <p className="text-[10px] text-slate-400 mt-0.5">ทั้ง 8 ช่องรวมกันควรเท่ากับ 100</p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">สถานะ</label>
                        <select className="w-full border rounded-lg px-3 py-2 text-sm"
                          value={current(slot, 'is_active') ? 'true' : 'false'}
                          onChange={e => setField(i, 'is_active', e.target.value === 'true')}>
                          <option value="true">เปิดใช้งาน</option>
                          <option value="false">ปิด (จะถือว่าเป็นโชคครั้งหน้า)</option>
                        </select>
                      </div>
                    </div>

                    {/* Color presets */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-2">สีพื้นหลัง + สีไฮไลท์</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {PRESET_COLORS.map(([c, h], pi) => (
                          <button key={pi} onClick={() => { setField(i, 'color', c); setField(i, 'hi_color', h); }}
                            className="w-8 h-8 rounded-lg border-2 transition-all"
                            style={{ background: c, borderColor: current(slot,'color') === c ? '#f59e0b' : 'transparent' }} />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 mb-1">พื้นหลัง</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded shrink-0" style={{ background: current(slot,'color') }} />
                            <input type="text" className="w-full border rounded px-2 py-1 text-xs font-mono"
                              value={current(slot,'color')}
                              onChange={e => setField(i, 'color', e.target.value)} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] text-slate-400 mb-1">ไฮไลท์</p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded shrink-0" style={{ background: current(slot,'hi_color') }} />
                            <input type="text" className="w-full border rounded px-2 py-1 text-xs font-mono"
                              value={current(slot,'hi_color')}
                              onChange={e => setField(i, 'hi_color', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => saveSlot(slot)}
                      disabled={saving[i]}
                      className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                      <Save size={14}/>
                      {saving[i] ? 'กำลังบันทึก...' : 'บันทึก Slot ' + i}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Spin Settings */}
      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-bold text-sm text-slate-700 mb-4">การตั้งค่าการหมุน</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'lucky_wheel_cost',        label: 'ค่าหมุนต่อครั้ง (฿)',        desc: 'หักจากกระเป๋าเงินของผู้ใช้' },
            { key: 'lucky_wheel_daily_limit',  label: 'จำนวนสิทธิ์หมุนต่อวัน',    desc: 'นับรวมต่อวัน (reset ตีหนึ่ง)' },
            { key: 'lucky_wheel_min_deposit',  label: 'ฝากขั้นต่ำเพื่อรับสิทธิ์ (฿)', desc: 'ถ้าไม่ใช้ ใส่ 0' },
          ].map(({ key, label, desc }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
              <div className="flex gap-2">
                <input type="number" min="0" className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  value={settings[key] ?? ''}
                  onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />
                <button onClick={() => saveSetting(key)}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold flex items-center gap-1">
                  <Save size={13}/>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Probability bar chart */}
      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-bold text-sm text-slate-700 mb-4">กราฟโอกาสชนะ</h2>
        <div className="space-y-2">
          {prizes.map(p => {
            const prob = Number(current(p, 'probability'));
            const pct  = totalProb > 0 ? (prob / totalProb * 100) : 0;
            return (
              <div key={p.slot_index} className="flex items-center gap-3">
                <div className="w-16 text-xs font-bold text-right text-slate-600 shrink-0">{current(p,'name')}</div>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div className="h-full rounded-full flex items-center px-2 transition-all"
                    style={{ width: `${Math.max(pct, 2)}%`, background: current(p,'color') }}>
                    <span className="text-white text-[9px] font-black">{prob.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="w-10 text-[10px] text-slate-400 shrink-0">฿{current(p,'amount')}</div>
              </div>
            );
          })}
        </div>
        <div className={`mt-3 text-center text-xs font-bold ${probOk ? 'text-emerald-600' : 'text-amber-600'}`}>
          รวม: {totalProb.toFixed(2)}% {probOk ? '✓ ถูกต้อง' : '⚠ ควรเท่ากับ 100%'}
        </div>
      </div>
    </div>
  );
}
