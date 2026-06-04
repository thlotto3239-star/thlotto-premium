/**
 * Notification Service — Singleton
 * Subscribe notifications ครั้งเดียว → broadcast ให้ทุก component
 * แก้ปัญหา B002: subscribe ซ้ำซ้อน 3 ที่
 */

import { supabase } from '../supabaseClient';
import logger from './logger';

let channel = null;
const listeners = new Set();

/**
 * ดึง notifications ทั้งหมดของ user
 */
export async function fetchNotifications(userId, { limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('fetchNotifications error:', error.message);
    return [];
  }
  return data;
}

/**
 * ดึงจำนวน unread notifications
 */
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    logger.error('getUnreadCount error:', error.message);
    return 0;
  }
  return count || 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    logger.error('markAsRead error:', error.message);
  }
}

/**
 * Mark all as read
 */
export async function markAllAsRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    logger.error('markAllAsRead error:', error.message);
  }
}

/**
 * Subscribe new notifications (singleton)
 * @param {string} userId
 * @param {function} callback - รับ notification object ใหม่
 * @returns {function} unsubscribe function
 */
export function subscribeNotifications(userId, callback) {
  listeners.add(callback);

  if (!channel) {
    channel = supabase
      .channel(`notif-service:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          logger.log('New notification:', payload.new);
          listeners.forEach(fn => fn(payload.new));
        }
      )
      .subscribe();
    logger.info('Notification subscription created (singleton)');
  }

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0 && channel) {
      supabase.removeChannel(channel);
      channel = null;
      logger.info('Notification subscription removed (no listeners)');
    }
  };
}

/**
 * Force cleanup (สำหรับ logout)
 */
export function cleanupNotifications() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  listeners.clear();
}
