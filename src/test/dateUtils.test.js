import { describe, it, expect } from 'vitest';

// ============================================
// ทดสอบ Date Parsing Logic (เหมือนที่ใช้ใน Results.jsx)
// ============================================

const TH_MONTHS = {
  'มกราคม':1,'กุมภาพันธ์':2,'มีนาคม':3,'เมษายน':4,
  'พฤษภาคม':5,'มิถุนายน':6,'กรกฎาคม':7,'สิงหาคม':8,
  'กันยายน':9,'ตุลาคม':10,'พฤศจิกายน':11,'ธันวาคม':12,
};

function parseThaiDate(s) {
  if (!s) return null;
  s = s.trim();
  const thMatch = s.match(/(\d{1,2})\s+([\u0E00-\u0E7F]+)\s+(\d{4})/);
  if (thMatch) {
    const d = parseInt(thMatch[1]);
    const m = TH_MONTHS[thMatch[2]];
    let y = parseInt(thMatch[3]);
    if (y > 2400) y -= 543;
    if (m) return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  const slash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    const d = parseInt(slash[1]);
    const m = parseInt(slash[2]);
    let y = parseInt(slash[3]);
    if (y < 100) y = y > 50 ? (y + 2500) - 543 : 2000 + y;
    else if (y > 2400) y -= 543;
    return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  }
  return null;
}

async function pinToPassword(phone, pin) {
  const raw = new TextEncoder().encode(pin + phone);
  const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

describe('Thai Date Parsing', () => {
  it('แปลงวันที่ภาษาไทย (พ.ศ.) ได้ถูกต้อง', () => {
    expect(parseThaiDate('2 พฤษภาคม 2569')).toBe('2026-05-02');
    expect(parseThaiDate('16 มิถุนายน 2569')).toBe('2026-06-16');
    expect(parseThaiDate('1 มกราคม 2570')).toBe('2027-01-01');
  });

  it('แปลง DD/MM/YYYY ได้ถูกต้อง', () => {
    expect(parseThaiDate('2/5/2026')).toBe('2026-05-02');
    expect(parseThaiDate('25/12/2026')).toBe('2026-12-25');
  });

  it('แปลง DD/MM/YY ได้ถูกต้อง', () => {
    expect(parseThaiDate('2/5/26')).toBe('2026-05-02');
    expect(parseThaiDate('15/1/26')).toBe('2026-01-15');
  });

  it('แปลง DD/MM/YYYY พ.ศ. ได้ถูกต้อง', () => {
    expect(parseThaiDate('2/5/2569')).toBe('2026-05-02');
  });

  it('ข้อมูลว่าง return null', () => {
    expect(parseThaiDate('')).toBe(null);
    expect(parseThaiDate(null)).toBe(null);
    expect(parseThaiDate(undefined)).toBe(null);
  });

  it('ข้อมูลผิดรูปแบบ return null', () => {
    expect(parseThaiDate('invalid')).toBe(null);
    expect(parseThaiDate('2026-05-02')).toBe(null);
  });
});

describe('PIN to Password (SHA256)', () => {
  it('สร้าง password ด้วย SHA256(pin+phone) ถูกต้อง', async () => {
    const r1 = await pinToPassword('0812345678', '1234');
    expect(r1).toHaveLength(64);
    expect(r1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('phone+PIN ต่างกัน → hash ต่างกันเสมอ', async () => {
    const a = await pinToPassword('0812345678', '1234');
    const b = await pinToPassword('0812345678', '5678');
    const c = await pinToPassword('0999999999', '1234');
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
  });

  it('SHA256("32390853232656") ต้องได้ค่าที่ถูกต้อง', async () => {
    const result = await pinToPassword('0853232656', '3239');
    expect(result).toBe('5d610e46ab1b4f50ad41984d1bc6f187159a6ec5318f7a960c149641ce7edab8');
  });
});
