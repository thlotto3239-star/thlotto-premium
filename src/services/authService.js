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

  // 1. ลอง Sign in ด้วย hashed PIN (กรณีผู้ใช้ใช้รหัส PIN ดั้งเดิม)
  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: pinHash,
  });

  // 2. Dual-Auth Fallback: หากไม่ผ่าน ให้ลองด้วย plain password ตรงๆ (กรณีตั้งรหัสผ่านแบบอิสระ)
  if (error && pin) {
    const directRes = await supabase.auth.signInWithPassword({
      email,
      password: pin,
    });
    if (!directRes.error && directRes.data?.session) {
      data = directRes.data;
      error = null;
    }
  }

  if (!error && data?.session) {
    setSessionExpiry(rememberMe);
    recordLoginSession(phone, data.user?.id, true).catch(() => {});
  } else {
    recordLoginSession(phone, null, false).catch(() => {});
  }

  return { data, error };
}

/**
 * Sign in ด้วย Google OAuth
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/home`,
    },
  });

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
    logger.warn('fetchProfile initial fetch:', profileRes.error.message);
    // กรณีผู้ใช้เข้าสู่ระบบด้วย Google OAuth ครั้งแรกและยังไม่มีแถวข้อมูลใน profiles
    if (profileRes.error.code === 'PGRST116') {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const u = userData.user;
          const meta = u.user_metadata || {};
          const memberId = 'TH' + Math.floor(100000 + Math.random() * 900000);
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert({
              id: u.id,
              member_id: memberId,
              full_name: meta.full_name || meta.name || u.email?.split('@')[0] || 'สมาชิก Google',
              username: meta.name || u.email?.split('@')[0] || 'member',
              phone: meta.phone || '',
              avatar_url: meta.avatar_url || meta.picture || '',
            })
            .select()
            .single();

          await supabase.from('wallets').upsert({ user_id: u.id }).catch(() => {});

          return { 
            ...(createdProfile || {}), 
            balance: 0, 
            commission_balance: 0, 
            total_won: 0, 
            total_bets: 0 
          };
        }
      } catch (err) {
        logger.error('Error creating fallback profile for OAuth user:', err);
      }
    }
    throw profileRes.error;
  }

  const walletData = walletRes.data || {};
  let currentProfile = profileRes.data;

  // ซิงค์ข้อมูล Gmail อัตโนมัติ (ชื่อและรูปโปรไฟล์) เมื่อล็อกอินผ่าน Google
  try {
    const { data: userData } = await supabase.auth.getUser();
    const u = userData?.user;
    if (u && (u.app_metadata?.provider === 'google' || u.user_metadata?.avatar_url || u.user_metadata?.picture)) {
      const meta = u.user_metadata || {};
      const googleAvatar = meta.avatar_url || meta.picture || '';
      const googleName = meta.full_name || meta.name || '';

      const needsAvatar = googleAvatar && (!currentProfile.avatar_url || currentProfile.avatar_url !== googleAvatar);
      const needsName = googleName && (!currentProfile.full_name || currentProfile.full_name === 'สมาชิกใหม่' || currentProfile.full_name.startsWith('TH'));

      if (needsAvatar || needsName) {
        const updatePayload = {};
        if (needsAvatar) updatePayload.avatar_url = googleAvatar;
        if (needsName) updatePayload.full_name = googleName;

        const { data: updated } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', userId)
          .select()
          .single();

        if (updated) currentProfile = updated;
      }
    }
  } catch (err) {
    logger.warn('Google metadata sync skipped:', err.message);
  }

  return { ...currentProfile, ...walletData };
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

/**
 * ตรวจจับ Device Forensics และรุ่นอุปกรณ์จริงจากเบราว์เซอร์
 */
export function detectClientForensics() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceType: 'desktop', deviceModel: 'PC', os: 'Unknown', browser: 'Browser', ua: '' };
  }
  const ua = navigator.userAgent || '';
  let deviceType = 'desktop';
  let deviceModel = 'Windows PC';
  let os = 'Windows';
  let browser = 'Web Browser';

  if (/iPhone/i.test(ua)) {
    deviceType = 'mobile';
    deviceModel = 'Apple iPhone';
    os = 'iOS';
    const m = ua.match(/OS (\d+[_\.]\d+)/);
    if (m) os = `iOS ${m[1].replace(/_/g, '.')}`;
  } else if (/iPad/i.test(ua)) {
    deviceType = 'tablet';
    deviceModel = 'Apple iPad';
    os = 'iPadOS';
    const m = ua.match(/OS (\d+[_\.]\d+)/);
    if (m) os = `iPadOS ${m[1].replace(/_/g, '.')}`;
  } else if (/Android/i.test(ua)) {
    deviceType = /Tablet|iPad/i.test(ua) ? 'tablet' : 'mobile';
    os = 'Android';
    const m = ua.match(/Android (\d+(\.\d+)?)/);
    if (m) os = `Android ${m[1]}`;
    const modelM = ua.match(/;\s*([^;]+?)\s*Build\//i);
    deviceModel = modelM && modelM[1] ? modelM[1].trim() : 'Android Smartphone';
  } else if (/Macintosh|Mac OS/i.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Apple Mac / MacBook';
    os = 'macOS';
    const m = ua.match(/Mac OS X (\d+[_\.]\d+)/);
    if (m) os = `macOS ${m[1].replace(/_/g, '.')}`;
  } else if (/Windows/i.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Windows PC';
    if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
    else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
    else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  } else if (/Linux/i.test(ua)) {
    deviceType = 'desktop';
    deviceModel = 'Linux Workstation';
    os = 'Linux';
  }

  if (/Edg\//i.test(ua)) {
    const m = ua.match(/Edg\/(\d+[\.\d]*)/);
    browser = `Microsoft Edge ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) {
    const m = ua.match(/Chrome\/(\d+[\.\d]*)/);
    browser = `Google Chrome ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    const m = ua.match(/Version\/(\d+[\.\d]*)/);
    browser = `Apple Safari ${m ? m[1].split('.')[0] : ''}`.trim();
  } else if (/Firefox\//i.test(ua)) {
    const m = ua.match(/Firefox\/(\d+[\.\d]*)/);
    browser = `Mozilla Firefox ${m ? m[1].split('.')[0] : ''}`.trim();
  }

  return { deviceType, deviceModel, os, browser, ua };
}

/**
 * ดึงพิกัดและ IP จริงของผู้ใช้งาน
 */
export async function getClientGeo() {
  try {
    const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    if (data && data.success !== false) {
      return {
        ip: data.ip || null,
        city: data.city || 'Bangkok',
        region: data.region || 'Bangkok',
        country: data.country_code || 'TH',
        lat: data.latitude || 13.7563,
        lon: data.longitude || 100.5018,
        isp: (data.connection && data.connection.isp) || null,
      };
    }
  } catch (_) {
    // fallback
  }
  return {
    ip: '127.0.0.1',
    city: 'เครือข่ายภายใน (Local / Dev)',
    region: 'Local Network',
    country: 'TH',
    lat: 13.7563,
    lon: 100.5018,
    isp: 'Localhost / Internal Dev',
  };
}

/**
 * บันทึกประวัติการเข้าสู่ระบบลง Supabase (RPC record_login_session)
 */
export async function recordLoginSession(phone, userId, success) {
  try {
    const dev = detectClientForensics();
    const geo = await getClientGeo();

    await supabase.rpc('record_login_session', {
      p_phone: phone || null,
      p_user_id: userId || null,
      p_success: Boolean(success),
      p_ip: geo.ip,
      p_user_agent: dev.ua,
      p_city: geo.city,
      p_region: geo.region,
      p_country: geo.country,
      p_lat: geo.lat,
      p_lon: geo.lon,
      p_isp: geo.isp,
      p_device_type: dev.deviceType,
      p_device_model: dev.deviceModel,
      p_os: dev.os,
      p_browser: dev.browser,
    });
  } catch (err) {
    logger.warn('recordLoginSession error:', err?.message);
  }
}

/**
 * ส่ง Heartbeat อัปเดตสถานะออนไลน์ลง profiles.last_seen_at
 */
export async function heartbeat(userId) {
  try {
    if (userId) {
      await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId);
    } else {
      await supabase.rpc('update_user_heartbeat');
    }
  } catch (_) {}
}

