import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type { DrawResult } from '../types/lottery';

// ดึง draw_results + bet_slips สำหรับ ResultModal.tsx
export function useDrawResults(marketId?: string, drawDate?: string) {
  const [results, setResults] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    let query = supabase
      .from('lottery_results')
      .select(`
        id,
        market_id,
        draw_date,
        result_main,
        result_3top,
        result_3front,
        result_3bottom,
        result_2top,
        result_2bottom,
        status,
        announced_at,
        lottery_markets (
          name,
          code,
          logo_url
        )
      `)
      .order('draw_date', { ascending: false });

    if (marketId) query = query.eq('market_id', marketId);
    if (drawDate) query = query.eq('draw_date', drawDate);

    const { data, error } = await query;
    if (error) { console.error(error); return; }

    const mapped: DrawResult[] = (data ?? []).map((row: any) => ({
      id: row.id,
      market_id: row.market_id,
      draw_date: row.draw_date,
      result_main: row.result_main,
      result_3top: row.result_3top,
      result_3front: row.result_3front,
      result_3bottom: row.result_3bottom,
      result_2top: row.result_2top,
      result_2bottom: row.result_2bottom,
      status: row.status,
      announced_at: row.announced_at,
      market: row.lottery_markets ? {
        name: row.lottery_markets.name,
        code: row.lottery_markets.code,
        logo_url: row.lottery_markets.logo_url,
      } : undefined,
    }));

    setResults(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchResults();

    // Realtime: รับผลทันทีที่ประกาศ
    const channel = supabase
      .channel('lottery_results_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lottery_results',
      }, () => { fetchResults(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [marketId, drawDate]);

  return { results, loading, refetch: fetchResults };
}

// ประมวลผลรางวัลผ่าน RPC (admin ใช้)
export async function processDrawResults(params: {
  draw_schedule_id: string;
  result_main: string;
  result_3top?: string;
  result_3front?: string;
  result_3bottom?: string;
  result_2top?: string;
  result_2bottom?: string;
  result_6digit?: string;
}) {
  const { data, error } = await supabase.rpc('process_draw_results', {
    p_draw_schedule_id: params.draw_schedule_id,
    p_result_main: params.result_main,
    p_result_3top: params.result_3top ?? null,
    p_result_3front: params.result_3front ?? null,
    p_result_3bottom: params.result_3bottom ?? null,
    p_result_2top: params.result_2top ?? null,
    p_result_2bottom: params.result_2bottom ?? null,
    p_result_6digit: params.result_6digit ?? null,
  });
  if (error) throw error;
  return data as { won: number; lost: number; total_payout: number };
}
