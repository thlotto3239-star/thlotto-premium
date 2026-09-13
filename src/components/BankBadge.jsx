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
  sm: { logo: 'w-6 h-6', name: 'text-xs', acc: 'text-xs' },
  md: { logo: 'w-10 h-10', name: 'text-sm', acc: 'text-xs' },
  lg: { logo: 'w-14 h-14', name: 'text-base', acc: 'text-sm' },
};

const maskAccount = (n) => {
  if (!n) return '—';
  const s = String(n);
  if (s.length < 8) return s;
  return s.slice(0, 3) + '-x-xxxxx-' + s.slice(-1);
};

const BANK_DEFAULTS = {
  KBANK: { name: 'ธนาคารกสิกรไทย', bg: '#138f2d', text: '#ffffff', short: 'KBANK' },
  SCB: { name: 'ธนาคารไทยพาณิชย์', bg: '#4e2a84', text: '#ffffff', short: 'SCB' },
  KTB: { name: 'ธนาคารกรุงไทย', bg: '#1897d4', text: '#ffffff', short: 'KTB' },
  BBL: { name: 'ธนาคารกรุงเทพ', bg: '#1e4586', text: '#ffffff', short: 'BBL' },
  GSB: { name: 'ธนาคารออมสิน', bg: '#eb198d', text: '#ffffff', short: 'GSB' },
  BAY: { name: 'ธนาคารกรุงศรีอยุธยา', bg: '#fdb813', text: '#333333', short: 'BAY' },
  TTB: { name: 'ธนาคารทหารไทยธนชาต', bg: '#002d63', text: '#ffffff', short: 'TTB' },
  BAAC: { name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร', bg: '#008b44', text: '#ffffff', short: 'ธ.ก.ส.' },
  KKP: { name: 'ธนาคารเกียรตินาคินภัทร', bg: '#2b2353', text: '#ffffff', short: 'KKP' },
  CIMB: { name: 'ธนาคารซีไอเอ็มบีไทย', bg: '#7b0d1e', text: '#ffffff', short: 'CIMB' },
  TRUEWALLET: { name: 'ทรูมันนี่วอลเล็ท', bg: '#ff6600', text: '#ffffff', short: 'TRUE' },
};

export default function BankBadge({ code, accountNumber, accountName, size = 'md', mask = false, className = '' }) {
  const [bank, setBank] = useState(null);
  const [imgError, setImgError] = useState(false);
  const s = sizeMap[size] || sizeMap.md;

  const upperCode = (code || '').trim().toUpperCase();
  const defaultInfo = BANK_DEFAULTS[upperCode] || {
    name: upperCode || 'ไม่ระบุธนาคาร',
    bg: '#64748b',
    text: '#ffffff',
    short: (upperCode || '?').slice(0, 3),
  };

  useEffect(() => {
    if (!upperCode) return;
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('banks')
          .select('code, name, image_url')
          .ilike('code', upperCode)
          .maybeSingle();
        if (isMounted && data) {
          setBank(data);
          setImgError(false);
        }
      } catch (e) {
        console.warn('BankBadge fetch error:', e);
      }
    })();
    return () => { isMounted = false; };
  }, [upperCode]);

  const bankName = bank?.name || defaultInfo.name;
  const logoUrl = bank?.image_url;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className={`${s.logo} rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 transition-transform`}
        style={{ backgroundColor: defaultInfo.bg }}
      >
        {logoUrl && !imgError ? (
          <img
            src={logoUrl}
            alt={bankName}
            className="w-full h-full object-cover bg-white"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-[11px] sm:text-xs font-black tracking-tight" style={{ color: defaultInfo.text }}>
            {defaultInfo.short}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-extrabold text-slate-900 truncate ${s.name}`}>{bankName}</div>
        {accountNumber && (
          <div className={`font-mono text-slate-500 tracking-wider font-semibold ${s.acc}`}>
            {mask ? maskAccount(accountNumber) : accountNumber}
          </div>
        )}
        {accountName && <div className={`text-slate-600 truncate font-medium ${s.acc}`}>{accountName}</div>}
      </div>
    </div>
  );
}
