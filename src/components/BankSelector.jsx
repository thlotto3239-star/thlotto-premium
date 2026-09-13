import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * BankSelector — Dropdown เลือกธนาคารจากตาราง banks
 * Props:
 *   value: string (bank code เช่น "KBANK")
 *   onChange: (code, bank) => void
 *   placeholder?: string
 */
const BANK_COLORS = {
  KBANK: '#138f2d',
  SCB: '#4e2a84',
  KTB: '#1897d4',
  BBL: '#1e4586',
  GSB: '#eb198d',
  BAY: '#fdb813',
  TTB: '#002d63',
  BAAC: '#008b44',
  KKP: '#2b2353',
  CIMB: '#7b0d1e',
  TRUEWALLET: '#ff6600',
};

export default function BankSelector({ value, onChange, placeholder = 'เลือกธนาคาร' }) {
  const [banks, setBanks] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failedImgs, setFailedImgs] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('banks')
          .select('code, name, image_url')
          .eq('is_active', true)
          .order('name');
        setBanks(data || []);
      } catch (e) {
        console.warn('BankSelector fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = banks.find(b => b.code.toUpperCase() === (value || '').toUpperCase());

  const renderLogo = (b, size = 'w-7 h-7') => {
    const code = (b?.code || '').toUpperCase();
    const bg = BANK_COLORS[code] || '#64748b';
    if (b?.image_url && !failedImgs[code]) {
      return (
        <img
          src={b.image_url}
          alt={b.name}
          className={`${size} rounded-xl object-cover bg-white shrink-0 border border-slate-200/60`}
          onError={() => setFailedImgs(p => ({ ...p, [code]: true }))}
        />
      );
    }
    return (
      <div
        className={`${size} rounded-xl flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-2xs`}
        style={{ backgroundColor: bg }}
      >
        {code.slice(0, 3)}
      </div>
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 transition focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
      >
        {selected ? (
          <>
            {renderLogo(selected)}
            <div className="flex-1 text-left min-w-0">
              <div className="font-extrabold text-slate-900 text-sm truncate">{selected.name}</div>
              <div className="text-xs font-mono font-semibold text-slate-400">{selected.code}</div>
            </div>
          </>
        ) : (
          <span className="flex-1 text-left text-slate-400 text-sm font-medium">{loading ? 'กำลังโหลด...' : placeholder}</span>
        )}
        <span className={`material-symbols-outlined text-slate-400 transition ${open ? 'rotate-180' : ''}`}>expand_more</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-72 overflow-y-auto p-1.5 space-y-0.5">
          {banks.map(b => (
            <button
              key={b.code}
              type="button"
              onClick={() => { onChange(b.code, b); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-emerald-50/80 rounded-xl transition text-left cursor-pointer ${value?.toUpperCase() === b.code.toUpperCase() ? 'bg-emerald-50 ring-1 ring-emerald-200' : ''}`}
            >
              {renderLogo(b)}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">{b.name}</div>
                <div className="text-xs font-mono font-medium text-slate-400">{b.code}</div>
              </div>
              {value?.toUpperCase() === b.code.toUpperCase() && (
                <span className="material-symbols-outlined text-emerald-600 text-lg">check</span>
              )}
            </button>
          ))}
          {banks.length === 0 && !loading && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">ไม่พบข้อมูลธนาคาร</p>
          )}
        </div>
      )}
    </div>
  );
}
