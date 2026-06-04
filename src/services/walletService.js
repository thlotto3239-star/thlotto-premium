/**
 * Wallet Service — Singleton
 * Subscribe wallet ครั้งเดียว → broadcast ให้ทุก component
 * แก้ปัญหา B001: subscribe ซ้ำซ้อน 3 ที่
 */

import { supabase } from '../supabaseClient';
import logger from './logger';

let channel = null;
const listeners = new Set();

/**
 * ดึง wallet data ครั้งแรก
 */
export async function fetchWallet(userId) {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance, commission_balance, total_won, total_bets')
    .eq('user_id', userId)
    .single();

  if (error) {
    logger.error('fetchWallet error:', error.message);
    return null;
  }
  return data;
}

/**
 * Subscribe wallet changes (singleton — ไม่ซ้ำซ้อน)
 * @param {string} userId
 * @param {function} callback - รับ payload.new (wallet data ใหม่)
 * @returns {function} unsubscribe function
 */
export function subscribeWallet(userId, callback) {
  listeners.add(callback);

  // สร้าง channel ถ้ายังไม่มี
  if (!channel) {
    channel = supabase
      .channel(`wallet-service:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${userId}` },
        (payload) => {
          logger.log('Wallet updated:', payload.new);
          listeners.forEach(fn => fn(payload.new));
        }
      )
      .subscribe();
    logger.info('Wallet subscription created (singleton)');
  }

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && channel) {
      supabase.removeChannel(channel);
      channel = null;
      logger.info('Wallet subscription removed (no listeners)');
    }
  };
}

/**
 * Force cleanup (สำหรับ logout)
 */
export function cleanupWallet() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  listeners.clear();
}
