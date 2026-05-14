import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      // ตรวจสอบ session expiry สำหรับ "จำฉันไว้"
      const sessionExpiry = localStorage.getItem('thlotto_session_expiry');
      if (sessionExpiry) {
        const expiryTime = parseInt(sessionExpiry);
        if (Date.now() > expiryTime) {
          // Session หมดอายุแล้ว → sign out
          await supabase.auth.signOut();
          localStorage.removeItem('thlotto_session_expiry');
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: auto-update balance เมื่อ wallet เปลี่ยน (เช่น ถูกรางวัล)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`wallet:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setProfile(prev => prev ? {
            ...prev,
            balance: payload.new.balance,
            commission_balance: payload.new.commission_balance,
            total_won: payload.new.total_won,
          } : prev);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  const fetchProfile = async (userId) => {
    try {
      const [profileRes, walletRes] = await Promise.all([
        supabase.from('profiles').select('id,member_id,username,full_name,phone,bank_name,bank_account_number,bank_account_name,referrer_id,status,vip_level,is_admin,avatar_url,pin_hash,created_at,updated_at').eq('id', userId).single(),
        supabase.from('wallets').select('balance, commission_balance, total_won, total_bets').eq('user_id', userId).single(),
      ]);
      if (profileRes.error) throw profileRes.error;
      const walletData = walletRes.data || {};
      setProfile({ ...profileRes.data, ...walletData });
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // แปลง PIN 4 หลัก → SHA256(pin+phone) — ป้องกัน reverse ถ้า source code หลุด
  const pinToPassword = async (phone, pin) => {
    const raw = new TextEncoder().encode(pin + phone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const signIn = async (phone, pin, rememberMe = false) => {
    const email = `${phone}@thlotto.app`;
    const pinHash = await pinToPassword(phone, pin);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pinHash,
    });
    
    // ตั้งค่า session ให้คงทนตาม rememberMe
    if (!error && data?.session) {
      if (rememberMe) {
        // จำ session 7 วัน
        localStorage.setItem('thlotto_session_expiry', (Date.now() + 7 * 24 * 60 * 60 * 1000).toString());
      } else {
        // session นี้เท่านั้น (clear expiry)
        localStorage.removeItem('thlotto_session_expiry');
      }

      // Auto-fix: ถ้า pin_hash ยังไม่ได้ set → set ให้อัตโนมัติหลัง login สำเร็จ
      try {
        const { data: prof } = await supabase.from('profiles').select('pin_hash').eq('id', data.user.id).single();
        if (prof && !prof.pin_hash) {
          await supabase.rpc('set_user_pin', { p_pin: pin, p_user_id: data.user.id });
        }
      } catch (e) {
        console.warn('Auto-set pin_hash skipped:', e.message);
      }
    }
    
    return { data, error };
  };

  const signUp = async (formData) => {
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
      // Backup: set pin_hash via RPC (ถ้า trigger ยังไม่ set ให้)
      try {
        await supabase.rpc('set_user_pin', { p_pin: pin, p_user_id: data.user.id });
      } catch (e) {
        // ไม่ block registration ถ้า RPC fail — trigger ได้ set pin_hash แล้ว
        console.warn('set_user_pin fallback skipped:', e.message);
      }
    }

    return { data, error };
  };

  const signOut = async () => {
    localStorage.removeItem('thlotto_session_expiry');
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile: () => fetchProfile(user?.id) }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
