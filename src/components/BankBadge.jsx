import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * BankBadge — แสดงโลโก้+ชื่อธนาคาร (อ้างอิงจาก banks table)
 * Props:
 *   code: string — bank code (เช่น "KBANK")
 *   accountNumber?: string — แสดงเลขบัญชี (มาส์กหรือเต็ม)
 *   accountName?: string — แสดงชื่อบัญชี
 *   size?: 'sm' | 'md' | 'lg'
 *   mask?: boolean — ถ้า true จะปิดเลขบัญชีบางส่วน
 */
const sizeMap = {
  sm: { logo: 'w-6 h-6', name: 'text-xs', acc: 'text-[10px]' },
  md: { logo: 'w-10 h-10', name: 'text-sm', acc: 'text-xs' },
  lg: { logo: 'w-14 h-14', name: 'text-base', acc: 'text-sm' },
};

const maskAccount = (n) => {
  if (!n) return '—';
  const s = String(n);
  if (s.length < 8) return s;
  return s.slice(0, 3) + '-x-xxxxx-' + s.slice(-1);
};

export default function BankBadge({ code, accountNumber, accountName, size = 'md', mask = false, className = '' }) {
  const [bank, setBank] = useState(null);
  const s = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!code) return;
    (async () => {
      const { data } = await supabase
        .from('banks')
        .select('code, name, image_url')
        .eq('code', code)
        .maybeSingle();
      setBank(data);
    })();
  }, [code]);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${s.logo} rounded-full overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0`}>
        {bank?.image_url ? (
          <img src={bank.image_url} alt={bank.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[9px] font-black text-slate-500">{(code || '?').slice(0, 3)}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-slate-900 truncate ${s.name}`}>{bank?.name || code || 'ไม่ระบุธนาคาร'}</div>
        {accountNumber && (
          <div className={`font-mono text-slate-500 tracking-wider ${s.acc}`}>
            {mask ? maskAccount(accountNumber) : accountNumber}
          </div>
        )}
        {accountName && <div className={`text-slate-600 truncate ${s.acc}`}>{accountName}</div>}
      </div>
    </div>
  );
}
