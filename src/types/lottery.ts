// interfaces หลักที่ใช้ร่วมกันทั้ง UI และ Supabase

// จุดนี้เชื่อมกับ LotteryRoundStatus.tsx
export interface RoundStatus {
  id: string;
  market_id: string;
  lottery_type: string;        // lottery_markets.name
  lottery_code: string;        // lottery_markets.code
  logo_url: string | null;
  draw_date: string;           // 'YYYY-MM-DD'
  open_time: string;           // ISO timestamptz
  close_time: string;          // ISO timestamptz (20 นาทีก่อนผล)
  result_time: string;         // ISO timestamptz
  status: 'open' | 'closing' | 'waiting' | 'done';
}

// ใช้ข้อมูลจาก Supabase table bet_slips (bets)
export interface BetSlip {
  id: string;
  user_id: string;
  market_id: string;
  draw_schedule_id: string | null;
  draw_date: string;
  bet_type: string;            // '3TOP' | '3TODE' | '2TOP' | '2BOTTOM' | 'RUN_UP' | 'RUN_DOWN'
  numbers: string;
  amount: number;
  payout_rate: number;
  payout_amount: number;
  status: 'PENDING' | 'WAITING' | 'WON' | 'LOST';
  created_at: string;
  updated_at: string;
  market?: {
    name: string;
    code: string;
    logo_url: string | null;
  };
}

// ใช้ข้อมูลจาก Supabase table lottery_results
export interface DrawResult {
  id: string;
  market_id: string;
  draw_date: string;
  result_main: string | null;
  result_3top: string | null;
  result_3front: string | null;
  result_3bottom: string | null;
  result_2top: string | null;
  result_2bottom: string | null;
  result_6digit?: string | null;
  status: 'PENDING' | 'ANNOUNCED';
  announced_at: string | null;
  market?: {
    name: string;
    code: string;
    logo_url: string | null;
  };
}

// draw_schedules row จาก Supabase
export interface DrawScheduleRow {
  id: string;
  market_id: string;
  draw_date: string;
  open_time: string;
  close_time: string;
  result_time: string;
  status: 'open' | 'closing' | 'waiting' | 'done';
  created_at?: string;
  updated_at?: string;
}

// balance_log = transactions พร้อม balance_after
export interface BalanceLog {
  id: string;
  user_id: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'BET' | 'WIN' | 'BONUS';
  amount: number;
  balance_after: number;
  reference_id: string | null;
  note: string | null;
  status: string;
  created_at: string;
}
