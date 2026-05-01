import { describe, it, expect } from 'vitest';

// ============================================
// ทดสอบ Win Check Logic (mirror ของ fn_check_win ใน DB)
// ============================================

function sortString(s) {
  return s.split('').sort().join('');
}

function checkWin(betType, numbers, result) {
  const { main, top3, top2, bottom2, front3, bottom3 } = result;

  switch (betType) {
    case '4TOP':
      return main != null && main.slice(-4) === numbers;
    case '3TOP':
      return top3 != null && top3 === numbers;
    case '3TODE':
      return top3 != null && numbers.length === 3 && sortString(numbers) === sortString(top3);
    case '3FRONT':
      if (!front3) return false;
      return front3.split(' ').map(s => s.trim()).includes(numbers);
    case '3BOTTOM':
      if (!bottom3) return false;
      return bottom3.split(' ').map(s => s.trim()).includes(numbers);
    case '2TOP':
      return top2 != null && top2 === numbers;
    case '2BOTTOM':
      return bottom2 != null && bottom2 === numbers;
    case 'RUN_UP':
      return top3 != null && numbers.length === 1 && top3.includes(numbers);
    case 'RUN_DOWN':
      return bottom2 != null && numbers.length === 1 && bottom2.includes(numbers);
    default:
      return false;
  }
}

const GOV_RESULT = {
  main: '835624',
  top3: '624',
  top2: '24',
  bottom2: '87',
  front3: '868 424',
  bottom3: '035 712',
};

describe('Win Check — ถูกรางวัล', () => {
  it('3TOP: เลขตรง 3 ตัวบน', () => {
    expect(checkWin('3TOP', '624', GOV_RESULT)).toBe(true);
  });

  it('2TOP: เลขตรง 2 ตัวบน', () => {
    expect(checkWin('2TOP', '24', GOV_RESULT)).toBe(true);
  });

  it('2BOTTOM: เลขตรง 2 ตัวล่าง', () => {
    expect(checkWin('2BOTTOM', '87', GOV_RESULT)).toBe(true);
  });

  it('3TODE: สลับหลักถูก', () => {
    expect(checkWin('3TODE', '462', GOV_RESULT)).toBe(true);
    expect(checkWin('3TODE', '246', GOV_RESULT)).toBe(true);
    expect(checkWin('3TODE', '624', GOV_RESULT)).toBe(true);
  });

  it('3FRONT: ตรงกับ 3 ตัวหน้าตัวใดตัวหนึ่ง', () => {
    expect(checkWin('3FRONT', '868', GOV_RESULT)).toBe(true);
    expect(checkWin('3FRONT', '424', GOV_RESULT)).toBe(true);
  });

  it('3BOTTOM: ตรงกับ 3 ตัวท้ายตัวใดตัวหนึ่ง', () => {
    expect(checkWin('3BOTTOM', '035', GOV_RESULT)).toBe(true);
    expect(checkWin('3BOTTOM', '712', GOV_RESULT)).toBe(true);
  });

  it('RUN_UP: เลขอยู่ใน 3 ตัวบน', () => {
    expect(checkWin('RUN_UP', '6', GOV_RESULT)).toBe(true);
    expect(checkWin('RUN_UP', '2', GOV_RESULT)).toBe(true);
    expect(checkWin('RUN_UP', '4', GOV_RESULT)).toBe(true);
  });

  it('RUN_DOWN: เลขอยู่ใน 2 ตัวล่าง', () => {
    expect(checkWin('RUN_DOWN', '8', GOV_RESULT)).toBe(true);
    expect(checkWin('RUN_DOWN', '7', GOV_RESULT)).toBe(true);
  });
});

describe('Win Check — ไม่ถูกรางวัล', () => {
  it('3TOP: เลขไม่ตรง', () => {
    expect(checkWin('3TOP', '123', GOV_RESULT)).toBe(false);
  });

  it('2BOTTOM: เลขไม่ตรง', () => {
    expect(checkWin('2BOTTOM', '99', GOV_RESULT)).toBe(false);
  });

  it('3FRONT: ไม่ตรง (ไม่ควรตรงกับ 3bottom)', () => {
    expect(checkWin('3FRONT', '035', GOV_RESULT)).toBe(false);
    expect(checkWin('3FRONT', '712', GOV_RESULT)).toBe(false);
  });

  it('3BOTTOM: ไม่ตรง (ไม่ควรตรงกับ 3front)', () => {
    expect(checkWin('3BOTTOM', '868', GOV_RESULT)).toBe(false);
    expect(checkWin('3BOTTOM', '424', GOV_RESULT)).toBe(false);
  });

  it('RUN_UP: เลขไม่อยู่ใน 3 ตัวบน', () => {
    expect(checkWin('RUN_UP', '0', GOV_RESULT)).toBe(false);
    expect(checkWin('RUN_UP', '9', GOV_RESULT)).toBe(false);
  });

  it('bet type ที่ไม่รู้จัก return false', () => {
    expect(checkWin('INVALID', '123', GOV_RESULT)).toBe(false);
  });
});

describe('Win Check — Edge Cases', () => {
  it('ผลรางวัลเป็น null ทั้งหมด', () => {
    const empty = { main: null, top3: null, top2: null, bottom2: null, front3: null, bottom3: null };
    expect(checkWin('3TOP', '123', empty)).toBe(false);
    expect(checkWin('2BOTTOM', '12', empty)).toBe(false);
    expect(checkWin('RUN_UP', '5', empty)).toBe(false);
  });

  it('3TODE: เลข 3 ตัวเหมือนกันหมด', () => {
    const r = { ...GOV_RESULT, top3: '111' };
    expect(checkWin('3TODE', '111', r)).toBe(true);
  });
});
