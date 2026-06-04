import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authService from './services/authService';
import { subscribeWallet, cleanupWallet } from './services/walletService';
import { cleanupNotifications } from './services/notificationService';
import logger from './services/logger';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      if (!authService.isSessionValid()) {
        await authService.signOut();
        setUser(null);
        setLoading(false);
        return;
      }

      const session = await authService.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const subscription = authService.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Wallet subscription (singleton — ไม่ซ้ำซ้อน)
  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeWallet(user.id, (walletData) => {
      setProfile(prev => prev ? {
        ...prev,
        balance: walletData.balance,
        commission_balance: walletData.commission_balance,
        total_won: walletData.total_won,
      } : prev);
    });
    return unsub;
  }, [user?.id]);

  const loadProfile = async (userId) => {
    try {
      const data = await authService.fetchProfile(userId);
      setProfile(data);
    } catch (error) {
      logger.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (phone, pin, rememberMe = false) => {
    return authService.signIn(phone, pin, rememberMe);
  };

  const signUp = async (formData) => {
    return authService.signUp(formData);
  };

  const signOut = async () => {
    cleanupWallet();
    cleanupNotifications();
    await authService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile: () => loadProfile(user?.id) }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
