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

// ─── THAI 77 PROVINCE CENTROIDS & TRANSLATION ENGINE ─────────────────────────
export const THAI_PROVINCES = [
  { name: 'กรุงเทพมหานคร', lat: 13.7563, lon: 100.5018 },
  { name: 'นนทบุรี', lat: 13.8591, lon: 100.5217 },
  { name: 'ปทุมธานี', lat: 14.0208, lon: 100.5250 },
  { name: 'สมุทรปราการ', lat: 13.5991, lon: 100.5998 },
  { name: 'สมุทรสาคร', lat: 13.5475, lon: 100.2744 },
  { name: 'สมุทรสงคราม', lat: 13.4098, lon: 99.9998 },
  { name: 'นครปฐม', lat: 13.8196, lon: 100.0443 },
  { name: 'พระนครศรีอยุธยา', lat: 14.3532, lon: 100.5684 },
  { name: 'สระบุรี', lat: 14.5289, lon: 100.9108 },
  { name: 'ลพบุรี', lat: 14.7995, lon: 100.6534 },
  { name: 'สิงห์บุรี', lat: 14.8911, lon: 100.4049 },
  { name: 'ชัยนาท', lat: 15.1852, lon: 100.1251 },
  { name: 'อ่างทอง', lat: 14.5896, lon: 100.4550 },
  { name: 'สุพรรณบุรี', lat: 14.4745, lon: 100.1177 },
  { name: 'กาญจนบุรี', lat: 14.0228, lon: 99.5328 },
  { name: 'ราชบุรี', lat: 13.5376, lon: 99.8166 },
  { name: 'เพชรบุรี', lat: 13.1114, lon: 99.9391 },
  { name: 'ประจวบคีรีขันธ์', lat: 11.8124, lon: 99.7972 },
  { name: 'ชลบุรี', lat: 13.3611, lon: 100.9847 },
  { name: 'ระยอง', lat: 12.6815, lon: 101.2816 },
  { name: 'จันทบุรี', lat: 12.6114, lon: 102.1039 },
  { name: 'ตราด', lat: 12.2428, lon: 102.5175 },
  { name: 'ฉะเชิงเทรา', lat: 13.6904, lon: 101.0779 },
  { name: 'ปราจีนบุรี', lat: 14.0509, lon: 101.3716 },
  { name: 'นครนายก', lat: 14.2069, lon: 101.2131 },
  { name: 'สระแก้ว', lat: 13.8140, lon: 102.0718 },
  { name: 'เชียงใหม่', lat: 18.7883, lon: 98.9853 },
  { name: 'ลำพูน', lat: 18.5744, lon: 99.0087 },
  { name: 'ลำปาง', lat: 18.2888, lon: 99.4928 },
  { name: 'อุตรดิตถ์', lat: 17.6201, lon: 100.0993 },
  { name: 'แพร่', lat: 18.1446, lon: 100.1413 },
  { name: 'น่าน', lat: 18.7830, lon: 100.7782 },
  { name: 'พะเยา', lat: 19.1664, lon: 99.9022 },
  { name: 'เชียงราย', lat: 19.9105, lon: 99.8406 },
  { name: 'แม่ฮ่องสอน', lat: 19.3020, lon: 97.9654 },
  { name: 'นครสวรรค์', lat: 15.7057, lon: 100.1378 },
  { name: 'อุทัยธานี', lat: 15.3835, lon: 100.0245 },
  { name: 'กำแพงเพชร', lat: 16.4828, lon: 99.5227 },
  { name: 'ตาก', lat: 16.8839, lon: 99.1258 },
  { name: 'สุโขทัย', lat: 17.0078, lon: 99.8234 },
  { name: 'พิษณุโลก', lat: 16.8211, lon: 100.2659 },
  { name: 'พิจิตร', lat: 16.4429, lon: 100.3488 },
  { name: 'เพชรบูรณ์', lat: 16.4189, lon: 101.1600 },
  { name: 'นครราชสีมา', lat: 14.9799, lon: 102.0978 },
  { name: 'บุรีรัมย์', lat: 14.9930, lon: 103.1029 },
  { name: 'สุรินทร์', lat: 14.8818, lon: 103.4936 },
  { name: 'ศรีสะเกษ', lat: 15.1186, lon: 104.3220 },
  { name: 'อุบลราชธานี', lat: 15.2448, lon: 104.8473 },
  { name: 'ยโสธร', lat: 15.7926, lon: 104.1451 },
  { name: 'ชัยภูมิ', lat: 15.8064, lon: 102.0315 },
  { name: 'อำนาจเจริญ', lat: 15.8584, lon: 104.6258 },
  { name: 'บึงกาฬ', lat: 18.3633, lon: 103.6529 },
  { name: 'หนองบัวลำภู', lat: 17.2040, lon: 102.4407 },
  { name: 'ขอนแก่น', lat: 16.4419, lon: 102.8359 },
  { name: 'อุดรธานี', lat: 17.4157, lon: 102.7872 },
  { name: 'เลย', lat: 17.4860, lon: 101.7223 },
  { name: 'หนองคาย', lat: 17.8783, lon: 102.7420 },
  { name: 'มหาสารคาม', lat: 16.1851, lon: 103.3007 },
  { name: 'ร้อยเอ็ด', lat: 16.0538, lon: 103.6520 },
  { name: 'กาฬสินธุ์', lat: 16.4322, lon: 103.5061 },
  { name: 'สกลนคร', lat: 17.1546, lon: 104.1486 },
  { name: 'นครพนม', lat: 17.3999, lon: 104.7801 },
  { name: 'มุกดาหาร', lat: 16.5436, lon: 104.7235 },
  { name: 'นครศรีธรรมราช', lat: 8.4304, lon: 99.9631 },
  { name: 'กระบี่', lat: 8.0863, lon: 98.9063 },
  { name: 'พังงา', lat: 8.4509, lon: 98.5255 },
  { name: 'ภูเก็ต', lat: 7.8804, lon: 98.3923 },
  { name: 'สุราษฎร์ธานี', lat: 9.1382, lon: 99.3215 },
  { name: 'ระนอง', lat: 9.9658, lon: 98.6348 },
  { name: 'ชุมพร', lat: 10.4930, lon: 99.1800 },
  { name: 'สงขลา', lat: 7.1898, lon: 100.5954 },
  { name: 'สตูล', lat: 6.6238, lon: 100.0674 },
  { name: 'ตรัง', lat: 7.5563, lon: 99.6114 },
  { name: 'พัทลุง', lat: 7.6167, lon: 100.0740 },
  { name: 'ปัตตานี', lat: 6.8671, lon: 101.2501 },
  { name: 'ยะลา', lat: 6.5411, lon: 101.2804 },
  { name: 'นราธิวาส', lat: 6.4255, lon: 101.8253 },
];

export const THAI_PROVINCE_MAP = {
  'bangkok': 'กรุงเทพมหานคร',
  'krung thep maha nakhon': 'กรุงเทพมหานคร',
  'changwat nonthaburi': 'นนทบุรี',
  'nonthaburi': 'นนทบุรี',
  'changwat pathum thani': 'ปทุมธานี',
  'pathum thani': 'ปทุมธานี',
  'changwat samut prakan': 'สมุทรปราการ',
  'samut prakan': 'สมุทรปราการ',
  'changwat samut sakhon': 'สมุทรสาคร',
  'samut sakhon': 'สมุทรสาคร',
  'changwat samut songkhram': 'สมุทรสงคราม',
  'samut songkhram': 'สมุทรสงคราม',
  'changwat nakhon pathom': 'นครปฐม',
  'nakhon pathom': 'นครปฐม',
  'changwat phra nakhon si ayutthaya': 'พระนครศรีอยุธยา',
  'phra nakhon si ayutthaya': 'พระนครศรีอยุธยา',
  'ayutthaya': 'พระนครศรีอยุธยา',
  'changwat saraburi': 'สระบุรี',
  'saraburi': 'สระบุรี',
  'changwat lop buri': 'ลพบุรี',
  'lop buri': 'ลพบุรี',
  'lopburi': 'ลพบุรี',
  'changwat chon buri': 'ชลบุรี',
  'chon buri': 'ชลบุรี',
  'chonburi': 'ชลบุรี',
  'pattaya': 'ชลบุรี (พัทยา)',
  'changwat rayong': 'ระยอง',
  'rayong': 'ระยอง',
  'changwat chanthaburi': 'จันทบุรี',
  'chanthaburi': 'จันทบุรี',
  'changwat trat': 'ตราด',
  'trat': 'ตราด',
  'changwat chachoengsao': 'ฉะเชิงเทรา',
  'chachoengsao': 'ฉะเชิงเทรา',
  'changwat prachin buri': 'ปราจีนบุรี',
  'prachin buri': 'ปราจีนบุรี',
  'prachinburi': 'ปราจีนบุรี',
  'changwat sa kaeo': 'สระแก้ว',
  'sa kaeo': 'สระแก้ว',
  'sakaeo': 'สระแก้ว',
  'changwat nakhon nayok': 'นครนายก',
  'nakhon nayok': 'นครนายก',
  'changwat chiang mai': 'เชียงใหม่',
  'chiang mai': 'เชียงใหม่',
  'chiangmai': 'เชียงใหม่',
  'changwat chiang rai': 'เชียงราย',
  'chiang rai': 'เชียงราย',
  'chiangrai': 'เชียงราย',
  'changwat lampang': 'ลำปาง',
  'lampang': 'ลำปาง',
  'changwat lamphun': 'ลำพูน',
  'lamphun': 'ลำพูน',
  'changwat mae hong son': 'แม่ฮ่องสอน',
  'mae hong son': 'แม่ฮ่องสอน',
  'changwat nan': 'น่าน',
  'nan': 'น่าน',
  'changwat phayao': 'พะเยา',
  'phayao': 'พะเยา',
  'changwat phrae': 'แพร่',
  'phrae': 'แพร่',
  'changwat uttaradit': 'อุตรดิตถ์',
  'uttaradit': 'อุตรดิตถ์',
  'changwat phitsanulok': 'พิษณุโลก',
  'phitsanulok': 'พิษณุโลก',
  'changwat sukhothai': 'สุโขทัย',
  'sukhothai': 'สุโขทัย',
  'changwat phetchabun': 'เพชรบูรณ์',
  'phetchabun': 'เพชรบูรณ์',
  'changwat phichit': 'พิจิตร',
  'phichit': 'พิจิตร',
  'changwat kamphaeng phet': 'กำแพงเพชร',
  'kamphaeng phet': 'กำแพงเพชร',
  'changwat nakhon sawan': 'นครสวรรค์',
  'nakhon sawan': 'นครสวรรค์',
  'changwat uthai thani': 'อุทัยธานี',
  'uthai thani': 'อุทัยธานี',
  'changwat chai nat': 'ชัยนาท',
  'chai nat': 'ชัยนาท',
  'chainat': 'ชัยนาท',
  'changwat sing buri': 'สิงห์บุรี',
  'sing buri': 'สิงห์บุรี',
  'singburi': 'สิงห์บุรี',
  'changwat ang thong': 'อ่างทอง',
  'ang thong': 'อ่างทอง',
  'angthong': 'อ่างทอง',
  'changwat suphan buri': 'สุพรรณบุรี',
  'suphan buri': 'สุพรรณบุรี',
  'suphanburi': 'สุพรรณบุรี',
  'changwat kanchanaburi': 'กาญจนบุรี',
  'kanchanaburi': 'กาญจนบุรี',
  'changwat ratchaburi': 'ราชบุรี',
  'ratchaburi': 'ราชบุรี',
  'changwat phetchaburi': 'เพชรบุรี',
  'phetchaburi': 'เพชรบุรี',
  'changwat prachuap khiri khan': 'ประจวบคีรีขันธ์',
  'prachuap khiri khan': 'ประจวบคีรีขันธ์',
  'changwat nakhon ratchasima': 'นครราชสีมา',
  'nakhon ratchasima': 'นครราชสีมา',
  'korat': 'นครราชสีมา',
  'changwat khon kaen': 'ขอนแก่น',
  'khon kaen': 'ขอนแก่น',
  'khonkaen': 'ขอนแก่น',
  'ban fang': 'ขอนแก่น (บ้านฝาง)',
  'changwat udon thani': 'อุดรธานี',
  'udon thani': 'อุดรธานี',
  'udonthani': 'อุดรธานี',
  'changwat ubon ratchathani': 'อุบลราชธานี',
  'ubon ratchathani': 'อุบลราชธานี',
  'ubon': 'อุบลราชธานี',
  'changwat buri ram': 'บุรีรัมย์',
  'buri ram': 'บุรีรัมย์',
  'buriram': 'บุรีรัมย์',
  'changwat surin': 'สุรินทร์',
  'surin': 'สุรินทร์',
  'changwat si sa ket': 'ศรีสะเกษ',
  'si sa ket': 'ศรีสะเกษ',
  'sisaket': 'ศรีสะเกษ',
  'changwat roi et': 'ร้อยเอ็ด',
  'roi et': 'ร้อยเอ็ด',
  'roiet': 'ร้อยเอ็ด',
  'changwat kalasin': 'กาฬสินธุ์',
  'kalasin': 'กาฬสินธุ์',
  'changwat maha sarakham': 'มหาสารคาม',
  'maha sarakham': 'มหาสารคาม',
  'changwat chaiyaphum': 'ชัยภูมิ',
  'chaiyaphum': 'ชัยภูมิ',
  'changwat nong khai': 'หนองคาย',
  'nong khai': 'หนองคาย',
  'changwat nong bua lamphu': 'หนองบัวลำภู',
  'nong bua lamphu': 'หนองบัวลำภู',
  'changwat loei': 'เลย',
  'loei': 'เลย',
  'changwat sakon nakhon': 'สกลนคร',
  'sakon nakhon': 'สกลนคร',
  'changwat nakhon phanom': 'นครพนม',
  'nakhon phanom': 'นครพนม',
  'changwat mukdahan': 'มุกดาหาร',
  'mukdahan': 'มุกดาหาร',
  'changwat yasothon': 'ยโสธร',
  'yasothon': 'ยโสธร',
  'changwat amnat charoen': 'อำนาจเจริญ',
  'amnat charoen': 'อำนาจเจริญ',
  'changwat bueng kan': 'บึงกาฬ',
  'bueng kan': 'บึงกาฬ',
  'buengkan': 'บึงกาฬ',
  'changwat chumphon': 'ชุมพร',
  'chumphon': 'ชุมพร',
  'changwat ranong': 'ระนอง',
  'ranong': 'ระนอง',
  'changwat surat thani': 'สุราษฎร์ธานี',
  'surat thani': 'สุราษฎร์ธานี',
  'ko samui': 'สุราษฎร์ธานี (เกาะสมุย)',
  'changwat phang nga': 'พังงา',
  'phang nga': 'พังงา',
  'phangnga': 'พังงา',
  'changwat phuket': 'ภูเก็ต',
  'phuket': 'ภูเก็ต',
  'changwat krabi': 'กระบี่',
  'krabi': 'กระบี่',
  'changwat nakhon si thammarat': 'นครศรีธรรมราช',
  'nakhon si thammarat': 'นครศรีธรรมราช',
  'changwat trang': 'ตรัง',
  'trang': 'ตรัง',
  'changwat phatthalung': 'พัทลุง',
  'phatthalung': 'พัทลุง',
  'changwat satun': 'สตูล',
  'satun': 'สตูล',
  'changwat songkhla': 'สงขลา',
  'songkhla': 'สงขลา',
  'hat yai': 'สงขลา (หาดใหญ่)',
  'changwat pattani': 'ปัตตานี',
  'pattani': 'ปัตตานี',
  'changwat yala': 'ยะลา',
  'yala': 'ยะลา',
  'changwat narathiwat': 'นราธิวาส',
  'narathiwat': 'นราธิวาส',
};

/**
 * คำนวณหาจังหวัดของไทยที่ใกล้พิกัด (lat, lon) มากที่สุด
 */
export function matchNearestThaiProvince(lat, lon) {
  if (!lat || !lon) return null;
  let best = null;
  let minDist = Infinity;
  for (const p of THAI_PROVINCES) {
    const dLat = p.lat - lat;
    const dLon = (p.lon - lon) * Math.cos((lat * Math.PI) / 180);
    const dist = dLat * dLat + dLon * dLon;
    if (dist < minDist) {
      minDist = dist;
      best = p;
    }
  }
  return best;
}

export function translateThaiLocation(city, region) {
  const normCity = (city || '').toLowerCase().trim();
  const normRegion = (region || '').toLowerCase().trim();

  if (THAI_PROVINCE_MAP[normCity]) return THAI_PROVINCE_MAP[normCity];
  if (THAI_PROVINCE_MAP[normRegion]) return THAI_PROVINCE_MAP[normRegion];

  for (const [key, val] of Object.entries(THAI_PROVINCE_MAP)) {
    if (normCity.includes(key) || normRegion.includes(key)) {
      return val;
    }
  }

  if (city && city !== 'Unknown') return city;
  if (region && region !== 'Unknown') return region;
  return 'กรุงเทพมหานคร';
}

/**
 * ดึงข้อมูลพิกัดและ IP จริงของผู้ใช้งานแบบเงียบในเบื้องหลัง (Silent High-Accuracy Client Geo)
 * ทำงานใน Background ทันทีที่ผู้ใช้เข้าสู่ระบบ โดยไม่ต้องแสดงหน้าต่างขออนุญาต GPS
 */
let _cachedGeo = null;
let _isResolving = false;

export async function prewarmClientGeo() {
  if (_cachedGeo || _isResolving) return;
  _isResolving = true;
  try {
    _cachedGeo = await getClientGeo();
  } catch (_) {}
  _isResolving = false;
}

export async function getClientGeo() {
  if (_cachedGeo && Date.now() - (_cachedGeo._timestamp || 0) < 300000) {
    return _cachedGeo;
  }

  // ดึง IP และพิกัดจังหวัดจริงผ่าน Multi-Provider Waterfall ในเบื้องหลัง
  let ipData = null;

  // Provider A: ipwho.is (ความแม่นยำสูงสำหรับโครงข่ายไทยและมือถือ)
  try {
    const resA = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(2500) });
    const dataA = await resA.json();
    if (dataA && dataA.success !== false && dataA.ip) {
      const cityTh = translateThaiLocation(dataA.city, dataA.region);
      const rawIsp = (dataA.connection && (dataA.connection.org || dataA.connection.isp)) || '';
      const shortIsp = rawIsp.includes('AIS') || rawIsp.includes('Advanced Info') ? 'AIS' :
                       rawIsp.includes('True') || rawIsp.includes('TRUE') ? 'TRUE' :
                       rawIsp.includes('Triple T') || rawIsp.includes('3BB') ? '3BB' :
                       rawIsp.includes('National Telecom') || rawIsp.includes('TOT') || rawIsp.includes('CAT') ? 'NT' :
                       rawIsp.includes('DTAC') || rawIsp.includes('Total Access') ? 'DTAC' : '';

      const finalCity = shortIsp ? `${cityTh} (${shortIsp})` : cityTh;

      ipData = {
        ip: dataA.ip,
        city: finalCity,
        region: dataA.region || cityTh,
        country: dataA.country_code || 'TH',
        lat: Number(dataA.latitude) || 13.7563,
        lon: Number(dataA.longitude) || 100.5018,
        isp: rawIsp || 'ISP ประเทศไทย',
      };
    }
  } catch (_) {}

  // Provider B: ipapi.co (fallback)
  if (!ipData) {
    try {
      const resB = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(2500) });
      const dataB = await resB.json();
      if (dataB && !dataB.error && dataB.ip) {
        const cityTh = translateThaiLocation(dataB.city, dataB.region);
        ipData = {
          ip: dataB.ip,
          city: cityTh,
          region: dataB.region || cityTh,
          country: dataB.country_code || 'TH',
          lat: Number(dataB.latitude) || 13.7563,
          lon: Number(dataB.longitude) || 100.5018,
          isp: dataB.org || 'ISP ประเทศไทย',
        };
      }
    } catch (_) {}
  }

  // Provider C: ipify for public IP
  if (!ipData) {
    try {
      const resC = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
      const dataC = await resC.json();
      if (dataC?.ip) {
        ipData = {
          ip: dataC.ip,
          city: 'ประเทศไทย (เครือข่ายมือถือ/บรอดแบนด์)',
          region: 'Thailand',
          country: 'TH',
          lat: 13.7563,
          lon: 100.5018,
          isp: 'Thailand Gateway',
        };
      }
    } catch (_) {}
  }

  const result = {
    ip: ipData?.ip || '127.0.0.1',
    city: ipData?.city || 'ประเทศไทย',
    region: ipData?.region || 'Thailand',
    country: ipData?.country || 'TH',
    lat: ipData?.lat || 13.7563,
    lon: ipData?.lon || 100.5018,
    isp: ipData?.isp || 'เครือข่ายอินเทอร์เน็ตในประเทศ',
    _timestamp: Date.now(),
  };

  _cachedGeo = result;
  return result;
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

