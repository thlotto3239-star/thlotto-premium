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

  // แปลง PIN 4 หลัก → password ภายใน (Supabase ต้องการ 6+ ตัว)
  const pinToPassword = (phone, pin) => `THLT_${pin}_${phone}`;

  const signIn = async (phone, pin) => {
    const email = `${phone}@thlotto.app`;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pinToPassword(phone, pin),
    });
    return { data, error };
  };

  const signUp = async (formData) => {
    const { phone, pin, full_name, bank_name, bank_account_number, bank_account_name, referral_code } = formData;
    const email = `${phone}@thlotto.app`;
    const displayName = full_name?.split(' ')[0] || '';

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pinToPassword(phone, pin),
      options: {
        data: {
          phone,
          full_name,
          username: displayName,
          bank_name,
          bank_account_number,
          bank_account_name,
          referrer_code: referral_code || '',
        }
      }
    });

    if (!error && data?.user) {
      // เก็บ pin_hash สำหรับการตรวจสอบตอนถอนเงิน (PIN เดียวกับ login)
      await supabase.rpc('set_user_pin', { p_pin: pin, p_user_id: data.user.id });
    }

    return { data, error };
  };

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile: () => fetchProfile(user?.id) }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
