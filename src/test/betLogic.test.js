import { describe, it, expect } from 'vitest';

// ============================================
// ทดสอบ Logic การคำนวณเดิมพันและอัตราจ่าย
// ============================================

const BET_TYPE_DIGITS = {
  '4TOP': 4, '3TOP': 3, '3TODE': 3, '3FRONT': 3,
  '3BOTTOM': 3, '2TOP': 2, '2BOTTOM': 2, 'RUN_UP': 1, 'RUN_DOWN': 1,
};

function validateBetNumber(betType, numbers) {
  const expected = BET_TYPE_DIGITS[betType];
  if (!expected) return false;
  if (numbers.length !== expected) return false;
  return /^\d+$/.test(numbers);
}

function calculatePotentialWin(amount, payoutRate) {
  return amount * payoutRate;
}

function calculateTotalBet(bets) {
  return bets.reduce((sum, b) => sum + b.amount, 0);
}

function canAffordBets(balance, bets) {
  return balance >= calculateTotalBet(bets);
}

describe('Bet Number Validation', () => {
  it('3TOP ต้องเป็นเลข 3 หลัก', () => {
    expect(validateBetNumber('3TOP', '123')).toBe(true);
    expect(validateBetNumber('3TOP', '12')).toBe(false);
    expect(validateBetNumber('3TOP', '1234')).toBe(false);
    expect(validateBetNumber('3TOP', 'abc')).toBe(false);
  });

  it('2TOP/2BOTTOM ต้องเป็นเลข 2 หลัก', () => {
    expect(validateBetNumber('2TOP', '45')).toBe(true);
    expect(validateBetNumber('2BOTTOM', '99')).toBe(true);
    expect(validateBetNumber('2TOP', '1')).toBe(false);
  });

  it('RUN_UP/RUN_DOWN ต้องเป็นเลข 1 หลัก', () => {
    expect(validateBetNumber('RUN_UP', '5')).toBe(true);
    expect(validateBetNumber('RUN_DOWN', '0')).toBe(true);
    expect(validateBetNumber('RUN_UP', '12')).toBe(false);
  });

  it('4TOP ต้องเป็นเลข 4 หลัก', () => {
    expect(validateBetNumber('4TOP', '1234')).toBe(true);
    expect(validateBetNumber('4TOP', '123')).toBe(false);
  });

  it('bet type ที่ไม่รู้จัก return false', () => {
    expect(validateBetNumber('INVALID', '123')).toBe(false);
  });
});

describe('Payout Calculation', () => {
  it('คำนวณเงินรางวัลถูกต้อง', () => {
    expect(calculatePotentialWin(10, 900)).toBe(9000);
    expect(calculatePotentialWin(50, 95)).toBe(4750);
    expect(calculatePotentialWin(100, 4)).toBe(400);
  });

  it('เดิมพัน 0 บาท = รางวัล 0', () => {
    expect(calculatePotentialWin(0, 900)).toBe(0);
  });
});

describe('Balance Check', () => {
  it('ยอดพอ = แทงได้', () => {
    const bets = [{ amount: 10 }, { amount: 20 }, { amount: 30 }];
    expect(canAffordBets(100, bets)).toBe(true);
    expect(canAffordBets(60, bets)).toBe(true);
  });

  it('ยอดไม่พอ = แทงไม่ได้', () => {
    const bets = [{ amount: 50 }, { amount: 60 }];
    expect(canAffordBets(100, bets)).toBe(false);
  });

  it('ไม่มี bet = ผ่านเสมอ', () => {
    expect(canAffordBets(0, [])).toBe(true);
  });
});

describe('Total Bet Calculation', () => {
  it('รวมยอดเดิมพันทั้งหมดถูกต้อง', () => {
    expect(calculateTotalBet([
      { amount: 10 }, { amount: 20 }, { amount: 30 }
    ])).toBe(60);
  });

  it('รายการเดียว', () => {
    expect(calculateTotalBet([{ amount: 100 }])).toBe(100);
  });
});
