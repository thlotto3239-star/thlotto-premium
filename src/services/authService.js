/**
 * Auth Service — รวม logic auth ทั้งหมด
 * ใช้โดย AuthContext.jsx
 */

import { supabase } from '../supabaseClient';
import logger from './logger';

const SESSION_EXPIRY_KEY = 'thlotto_session_expiry';

/**
 * แปลง PIN 4 หลัก → SHA256(pin+phone)
 */
export async function pinToPassword(phone, pin) {
  const raw = new TextEncoder().encode(pin + phone);
  const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * ตรวจ session expiry (สำหรับ "จำฉันไว้")
 * @returns {boolean} true ถ้า session ยังใช้ได้
 */
export function isSessionValid() {
  const sessionExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);
  if (!sessionExpiry) return true; // ไม่ได้ set = session-only (ไม่ expire)
  return Date.now() <= parseInt(sessionExpiry);
}

/**
 * Set session expiry
 */
export function setSessionExpiry(rememberMe) {
  if (rememberMe) {
    localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
  } else {
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }
}

/**
 * Clear session expiry
 */
export function clearSessionExpiry() {
  localStorage.removeItem(SESSION_EXPIRY_KEY);
}

/**
 * Sign in ด้วย phone + pin
 */
export async function signIn(phone, pin, rememberMe = false) {
  const email = `${phone}@thlotto.app`;
  const pinHash = await pinToPassword(phone, pin);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pinHash,
  });

  if (!error && data?.session) {
    setSessionExpiry(rememberMe);
  }

  return { data, error };
}

/**
 * Sign up (สมัครสมาชิก)
 */
export async function signUp(formData) {
  const { phone, pin, full_name, bank_name, bank_account_number, bank_account_name, referral_code } = formData;
  const email = `${phone}@thlotto.app`;
  const displayName = full_name?.split(' ')[0] || '';
  const pinHash = await pinToPassword(phone, pin);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: pinHash,
    options: {
      data: {
        phone,
        full_name,
        username: displayName,
        bank_name,
        bank_account_number,
        bank_account_name,
        referrer_code: referral_code || '',
        pin_hash: pinHash,
      }
    }
  });

  if (!error && data?.user) {
    try {
      await supabase.rpc('set_user_pin', { p_pin: pin, p_user_id: data.user.id });
    } catch (e) {
      logger.warn('set_user_pin fallback skipped:', e.message);
    }
  }

  return { data, error };
}

/**
 * Sign out
 */
export async function signOut() {
  clearSessionExpiry();
  await supabase.auth.signOut();
}

/**
 * Fetch profile + wallet data
 */
export async function fetchProfile(userId) {
  const [profileRes, walletRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,member_id,username,full_name,phone,bank_name,bank_account_number,bank_account_name,referrer_id,status,vip_level,is_admin,avatar_url,pin_hash,created_at,updated_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('wallets')
      .select('balance, commission_balance, total_won, total_bets')
      .eq('user_id', userId)
      .single(),
  ]);

  if (profileRes.error) {
    logger.error('fetchProfile error:', profileRes.error.message);
    throw profileRes.error;
  }

  const walletData = walletRes.data || {};
  return { ...profileRes.data, ...walletData };
}

/**
 * Get current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Listen auth state changes
 */
export function onAuthStateChange(callback) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
}
