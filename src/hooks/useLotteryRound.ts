import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { RoundStatus } from '../types/lottery';

// จุดนี้เชื่อมกับ LotteryRoundStatus.tsx
// ดึง draw_schedules + lottery_markets เพื่อแสดงสถานะงวดปัจจุบัน

export function useLotteryRound(marketId?: string) {
  const [rounds, setRounds] = useState<RoundStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRounds = async () => {
    let query = supabase
      .from('draw_schedules')
      .select(`
        id,
        market_id,
        draw_date,
        open_time,
        close_time,
        result_time,
        status,
        lottery_markets (
          name,
          code,
          logo_url
        )
      `)
      .neq('status', 'done')
      .order('result_time', { ascending: true });

    if (marketId) {
      query = query.eq('market_id', marketId);
    }

    const { data, error } = await query;
    if (error) { console.error(error); return; }

    const mapped: RoundStatus[] = (data ?? []).map((row: any) => ({
      id: row.id,
      market_id: row.market_id,
      lottery_type: row.lottery_markets?.name ?? '',
      lottery_code: row.lottery_markets?.code ?? '',
      logo_url: row.lottery_markets?.logo_url ?? null,
      draw_date: row.draw_date,
      open_time: row.open_time,
      close_time: row.close_time,
      result_time: row.result_time,
      status: row.status,
    }));

    setRounds(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchRounds();

    // Realtime subscription เมื่อ status เปลี่ยน
    const channel = supabase
      .channel('draw_schedules_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'draw_schedules',
      }, () => { fetchRounds(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [marketId]);

  return { rounds, loading, refetch: fetchRounds };
}
