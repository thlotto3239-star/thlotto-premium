import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { BetSlip } from '../types/lottery';

// ใช้ข้อมูลจาก Supabase table bets สำหรับ BetSlipList.tsx
export function useBetSlips(userId?: string, drawScheduleId?: string) {
  const [bets, setBets] = useState<BetSlip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBets = async () => {
    if (!userId) return;

    let query = supabase
      .from('bets')
      .select(`
        id,
        user_id,
        market_id,
        draw_schedule_id,
        draw_date,
        bet_type,
        numbers,
        amount,
        payout_rate,
        payout_amount,
        status,
        created_at,
        updated_at,
        lottery_markets (
          name,
          code,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (drawScheduleId) {
      query = query.eq('draw_schedule_id', drawScheduleId);
    }

    const { data, error } = await query;
    if (error) { console.error(error); return; }

    const mapped: BetSlip[] = (data ?? []).map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      market_id: row.market_id,
      draw_schedule_id: row.draw_schedule_id,
      draw_date: row.draw_date,
      bet_type: row.bet_type,
      numbers: row.numbers,
      amount: Number(row.amount),
      payout_rate: Number(row.payout_rate ?? 0),
      payout_amount: Number(row.payout_amount ?? 0),
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      market: row.lottery_markets ? {
        name: row.lottery_markets.name,
        code: row.lottery_markets.code,
        logo_url: row.lottery_markets.logo_url,
      } : undefined,
    }));

    setBets(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchBets();
  }, [userId, drawScheduleId]);

  return { bets, loading, refetch: fetchBets };
}

// อัปเดต status และ credit ผ่าน RPC
export async function updateBetSlipAndCredit(betId: string, winAmount: number) {
  const { error } = await supabase.rpc('update_bet_slip_and_credit', {
    p_bet_id: betId,
    p_win_amount: winAmount,
  });
  if (error) throw error;
}
