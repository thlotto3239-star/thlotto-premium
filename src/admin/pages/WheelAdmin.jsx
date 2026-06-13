import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

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
  const [edits, setEdits]     = useState({});
  const [saving, setSaving]   = useState({});
  const [msg, setMsg]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlot, setActiveSlot] = useState(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerUploading, setBannerUploading] = useState(false);

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_get_wheel_config');
    if (data?.success) {
      setPrizes(data.prizes || []);
      setSettings(s => ({ ...s, ...data.settings }));
    }
    const { data: bannerData } = await supabase
      .from('settings').select('value').eq('key', 'lucky_wheel_banner_url').single();
    if (bannerData?.value) setBannerUrl(bannerData.value);
    setEdits({});
    setLoading(false);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { flash('err', 'ขนาดไฟล์ต้องไม่เกิน 5MB'); return; }
    setBannerUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `wheel-banner/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('sliders').upload(fileName, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('sliders').getPublicUrl(fileName);
      setBannerUrl(publicUrl);
      await supabase.rpc('admin_upsert_setting', { p_key: 'lucky_wheel_banner_url', p_value: publicUrl });
      flash('ok', 'อัพโหลดภาพปกกงล้อสำเร็จ');
    } catch (err) {
      flash('err', 'อัพโหลดล้มเหลว: ' + err.message);
    } finally { setBannerUploading(false); }
  };

  const saveBannerUrl = async () => {
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: 'lucky_wheel_banner_url', p_value: bannerUrl });
    flash(error ? 'err' : 'ok', error ? error.message : 'บันทึก URL ภาพปกสำเร็จ');
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const current = (slot, field) => edits[slot.slot_index]?.[field] ?? slot[field];

  const setField = (slotIndex, field, value) => {
    setEdits(e => ({ ...e, [slotIndex]: { ...(e[slotIndex] || {}), [field]: value } }));
  };

  const saveSlot = async (slot) => {
    const i = slot.slot_index;
    setSaving(s => ({ ...s, [i]: true }));
    const { data } = await supabase.rpc('admin_update_wheel_prize', {
      p_slot_index: i, p_name: current(slot, 'name'), p_amount: Number(current(slot, 'amount')),
      p_probability: Number(current(slot, 'probability')), p_color: current(slot, 'color'),
      p_hi_color: current(slot, 'hi_color'), p_is_active: current(slot, 'is_active'),
    });
    setSaving(s => ({ ...s, [i]: false }));
    if (data?.success) { flash('ok', `บันทึก Slot ${i} สำเร็จ`); load(); }
    else flash('err', data?.message || 'เกิดข้อผิดพลาด');
  };

  const saveSetting = async (key) => {
    const { error } = await supabase.rpc('admin_upsert_setting', { p_key: key, p_value: settings[key] });
    if (!error) { flash('ok', `บันทึก ${key} สำเร็จ`); load(); }
    else flash('err', error.message);
  };

  const totalProb = prizes.reduce((s, p) => s + Number(current(p, 'probability')), 0);
  const probOk = Math.abs(totalProb - 100) < 0.01;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 max-w-[1440px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">จัดการวงล้อลุ้นโชค</h2>
          <p className="text-sm text-slate-500 mt-1">จัดการช่อง น้ำหนัก รูปลักษณ์ และภาพปกแบนเนอร์</p>
        </div>
        <button onClick={load}
          className="bg-emerald-900 text-white px-6 py-3 rounded-full hover:scale-[1.02] active:scale-95 transition-transform flex items-center gap-2 text-sm font-semibold shadow-lg shadow-emerald-900/20">
          <span className="material-symbols-outlined text-[20px]">refresh</span>
          รีโหลดข้อมูล
        </button>
      </div>

      {/* Status bar */}
      {msg && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium backdrop-blur-sm border ${
          msg.type === 'ok'
            ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200'
            : 'bg-red-50/80 text-red-700 border-red-200'
        }`}>
          <span className="material-symbols-outlined text-lg">
            {msg.type === 'ok' ? 'check_circle' : 'warning'}
          </span>
          {msg.text}
        </div>
      )}

      {/* Bento Grid: Wheel + Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Wheel Preview + Stats */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(6,78,59,0.05)] border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none" />
            <h3 className="text-lg font-semibold text-slate-900 mb-6 relative z-10">องค์ประกอบวงล้อ</h3>
            <div className="relative w-full max-w-[280px] mx-auto">
              <svg viewBox="0 0 160 160" className="w-full">
                {prizes.map((p, i) => {
                  const col = current(p, 'color');
                  const t = labelPos(i);
                  const active = activeSlot === i;
                  return (
                    <g key={i} onClick={() => setActiveSlot(active ? null : i)} className="cursor-pointer">
                      <path d={buildArc(i)} fill={col}
                        stroke={active ? '#f59e0b' : 'rgba(0,0,0,0.15)'} strokeWidth={active ? 3 : 1} />
                      <g transform={`translate(${t.x},${t.y}) rotate(${t.r})`}>
                        <text textAnchor="middle" dominantBaseline="middle"
                          fontSize={current(p, 'name').length > 4 ? '6.5' : '9'}
                          fontWeight="900" fill="white" fontFamily="sans-serif">
                          {current(p, 'name')}
                        </text>
                      </g>
                    </g>
                  );
                })}
                {prizes.map((_, i) => {
                  const a = toR(-90 + i * DEG);
                  return <line key={i} x1={CX} y1={CY} x2={(CX + R * Math.cos(a)).toFixed(1)} y2={(CY + R * Math.sin(a)).toFixed(1)} stroke="rgba(0,0,0,0.15)" strokeWidth="1" />;
                })}
                <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx={CX} cy={CY} r="14" fill="#0f172a" stroke="#34d399" strokeWidth="2" />
                <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#34d399" fontWeight="900">★</text>
                <polygon points={`${CX},${CY - R - 10} ${CX - 6},${CY - R - 1} ${CX + 6},${CY - R - 1}`} fill="#34d399" />
              </svg>
            </div>
            <p className="text-xs text-slate-400 text-center mt-4 relative z-10">คลิกที่ช่องเพื่อเลือกแก้ไข</p>

            {/* Stats */}
            <div className="mt-6 space-y-3 relative z-10">
              <div className="flex justify-between items-center p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">จำนวนช่องทั้งหมด</span>
                <span className="text-xl font-bold text-emerald-700">{prizes.length}</span>
              </div>
              <div className={`flex justify-between items-center p-4 rounded-2xl border ${probOk ? 'bg-emerald-50/80 border-emerald-100' : 'bg-amber-50/80 border-amber-200'}`}>
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">รวมเปอร์เซ็นต์</span>
                <div className="text-right">
                  <span className={`text-xl font-bold ${probOk ? 'text-emerald-700' : 'text-amber-600'}`}>{totalProb.toFixed(2)}%</span>
                  {!probOk && <p className="text-xs text-amber-500 mt-0.5">ควรรวมเท่ากับ 100%</p>}
                </div>
              </div>
            </div>

            {/* Prob bar chart */}
            <div className="mt-6 space-y-2 relative z-10">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">กราฟโอกาสชนะ</h4>
              {prizes.map(p => {
                const prob = Number(current(p, 'probability'));
                const pct = totalProb > 0 ? (prob / totalProb * 100) : 0;
                return (
                  <div key={p.slot_index} className="flex items-center gap-3">
                    <div className="w-16 text-xs font-semibold text-right text-slate-600 shrink-0 truncate">{current(p, 'name')}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full rounded-full flex items-center px-2 transition-all duration-300"
                        style={{ width: `${Math.max(pct, 3)}%`, background: current(p, 'color') }}>
                        <span className="text-white text-xs font-black whitespace-nowrap">{prob.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="w-12 text-xs text-slate-400 shrink-0 text-right">฿{current(p, 'amount')}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Slots Manager */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(6,78,59,0.05)] border border-white/50">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-slate-900">จัดการช่อง</h3>
              <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full">{prizes.length} ช่อง</span>
            </div>

            <div className="space-y-3">
              {prizes.map((slot) => {
                const i = slot.slot_index;
                const isActive = activeSlot === i;
                const prob = Number(current(slot, 'probability'));
                return (
                  <div key={i}
                    className={`bg-slate-50/50 rounded-2xl border transition-all overflow-hidden ${isActive ? 'border-emerald-300 shadow-md shadow-emerald-100/50' : 'border-slate-100 hover:border-slate-200'}`}>
                    {/* Slot row */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 cursor-pointer relative"
                      onClick={() => setActiveSlot(isActive ? null : i)}>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-r-full" style={{ background: current(slot, 'color') }} />
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full ml-2">
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">ชื่อรางวัล</p>
                          <p className="font-semibold text-sm text-slate-800 mt-0.5">{current(slot, 'name')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">จำนวน / มูลค่า</p>
                          <p className="font-semibold text-sm text-slate-800 mt-0.5">฿ {Number(current(slot, 'amount')).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-emerald-700">{prob.toFixed(2)}%</p>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">โอกาสชนะ</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="color" className="w-7 h-7 rounded-full border-0 p-0 cursor-pointer"
                            value={current(slot, 'color')}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setField(i, 'color', e.target.value)} />
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${current(slot, 'is_active') ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'}`}>
                            {current(slot, 'is_active') ? 'เปิด' : 'ปิด'}
                          </span>
                          <span className="material-symbols-outlined text-slate-400 text-lg transition-transform" style={{ transform: isActive ? 'rotate(180deg)' : '' }}>
                            expand_more
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    {isActive && (
                      <div className="px-5 pb-5 pt-4 border-t border-slate-100 space-y-4 bg-white/50">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">ชื่อรางวัล</label>
                            <input className="w-full bg-white border-none rounded-full px-4 py-2.5 text-sm text-slate-800 shadow-inner focus:ring-2 focus:ring-emerald-200"
                              value={current(slot, 'name')} onChange={e => setField(i, 'name', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">จำนวนเงินที่จ่าย (฿)</label>
                            <input type="number" min="0" step="1"
                              className="w-full bg-white border-none rounded-full px-4 py-2.5 text-sm text-slate-800 shadow-inner focus:ring-2 focus:ring-emerald-200"
                              value={current(slot, 'amount')} onChange={e => setField(i, 'amount', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">โอกาสชนะ (%)</label>
                            <input type="number" min="0.1" max="99" step="0.5"
                              className="w-full bg-white border-none rounded-full px-4 py-2.5 text-sm text-slate-800 shadow-inner focus:ring-2 focus:ring-emerald-200"
                              value={current(slot, 'probability')} onChange={e => setField(i, 'probability', e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">สถานะ</label>
                            <select className="w-full bg-white border-none rounded-full px-4 py-2.5 text-sm text-slate-800 shadow-inner focus:ring-2 focus:ring-emerald-200"
                              value={current(slot, 'is_active') ? 'true' : 'false'}
                              onChange={e => setField(i, 'is_active', e.target.value === 'true')}>
                              <option value="true">เปิดใช้งาน</option>
                              <option value="false">ปิด (โชคครั้งหน้า)</option>
                            </select>
                          </div>
                        </div>

                        {/* Color presets */}
                        <div>
                          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">สี Preset</label>
                          <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map(([c, h], pi) => (
                              <button key={pi} onClick={() => { setField(i, 'color', c); setField(i, 'hi_color', h); }}
                                className="w-9 h-9 rounded-xl border-2 transition-all hover:scale-110 active:scale-95"
                                style={{ background: `linear-gradient(135deg, ${c}, ${h})`, borderColor: current(slot, 'color') === c ? '#f59e0b' : 'transparent' }} />
                            ))}
                          </div>
                        </div>

                        <button onClick={() => saveSlot(slot)} disabled={saving[i]}
                          className="w-full py-3 bg-emerald-900 text-white rounded-full text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-emerald-900/20">
                          <span className="material-symbols-outlined text-[18px]">save</span>
                          {saving[i] ? 'กำลังบันทึก...' : `บันทึก Slot ${i}`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Settings + Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Spin Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(6,78,59,0.05)] border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-700">settings</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">การตั้งค่าการหมุน</h3>
              <p className="text-xs text-slate-400">ปรับค่าใช้จ่ายและลิมิตการหมุน</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: 'lucky_wheel_cost', label: 'ค่าหมุนต่อครั้ง (฿)', desc: 'หักจากกระเป๋าเงินของผู้ใช้', icon: 'paid' },
              { key: 'lucky_wheel_daily_limit', label: 'จำนวนสิทธิ์หมุนต่อวัน', desc: 'นับรวมต่อวัน (reset ตีหนึ่ง)', icon: 'today' },
              { key: 'lucky_wheel_min_deposit', label: 'ฝากขั้นต่ำเพื่อรับสิทธิ์ (฿)', desc: 'ถ้าไม่ใช้ ใส่ 0', icon: 'account_balance_wallet' },
            ].map(({ key, label, desc, icon }) => (
              <div key={key} className="flex items-center gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">{icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <input type="number" min="0"
                    className="w-20 bg-white border-none rounded-full px-3 py-2 text-sm text-center shadow-inner focus:ring-2 focus:ring-emerald-200"
                    value={settings[key] ?? ''}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))} />
                  <button onClick={() => saveSetting(key)}
                    className="w-9 h-9 bg-emerald-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md">
                    <span className="material-symbols-outlined text-[16px]">save</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner Image Management */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_20px_50px_rgba(6,78,59,0.05)] border border-white/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-700">image</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">ภาพปกกงล้อ</h3>
              <p className="text-xs text-slate-400">แสดงในหน้าแรกของแอปผู้ใช้</p>
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 h-44 relative mb-5 bg-slate-100">
            {bannerUrl ? (
              <>
                <img src={bannerUrl} alt="Lucky Wheel Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <div className="absolute bottom-3 right-3">
                  <span className="bg-white/90 backdrop-blur-sm text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    ภาพปัจจุบัน
                  </span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-5xl mb-2">hide_image</span>
                <p className="text-sm">ยังไม่มีภาพปก</p>
              </div>
            )}
          </div>

          {/* URL Input */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">URL ภาพปก</label>
            <div className="flex gap-2">
              <input type="text"
                className="flex-1 bg-slate-50 border-none rounded-full px-4 py-2.5 text-sm shadow-inner focus:ring-2 focus:ring-emerald-200"
                placeholder="https://..."
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)} />
              <button onClick={saveBannerUrl}
                className="w-11 h-11 bg-emerald-900 text-white rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md shrink-0">
                <span className="material-symbols-outlined text-[16px]">save</span>
              </button>
            </div>
          </div>

          {/* Upload */}
          <label className="flex items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-2xl py-6 cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/30 transition-all active:scale-[0.99]">
            <input type="file" className="hidden" accept="image/*" onChange={handleBannerUpload} />
            {bannerUploading ? (
              <>
                <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                <span className="text-sm text-slate-500 font-medium">กำลังอัพโหลด...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-slate-400 text-2xl">cloud_upload</span>
                <div className="text-center">
                  <p className="text-sm text-slate-600 font-medium">คลิกเพื่ออัพโหลดภาพใหม่</p>
                  <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP — สูงสุด 5MB — แนะนำ 800x400 px</p>
                </div>
              </>
            )}
          </label>
        </div>
      </div>
    </div>
  );
}
