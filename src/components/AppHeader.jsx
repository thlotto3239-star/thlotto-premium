import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const AppHeader = ({ announcements = [] }) => {
  const { profile, user } = useAuth();
  const [balance, setBalance] = useState(null);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchWallet = async () => {
      const { data } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (data) setBalance(data.balance);
    };
    fetchWallet();

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnread(count > 0);
    };
    fetchUnread();

    const walletSub = supabase
      .channel('wallet-header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` }, (payload) => {
        if (payload.new?.balance !== undefined) setBalance(payload.new.balance);
      })
      .subscribe();

    return () => supabase.removeChannel(walletSub);
  }, [user]);

  const announcementText = announcements.length > 0
    ? announcements.map(a => a.content).join('  •  ')
    : 'ต้อนรับสู่ TH-LOTTO ระบบฝาก-ถอนอัตโนมัติ 24 ชม. • ประกาศ: ระบบฝาก-ถอน อัตโนมัติ รวดเร็ว ทันใจ';

  const displayBalance = balance !== null
    ? Number(balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
    : profile?.balance !== undefined
      ? Number(profile.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })
      : '0.00';

  return (
    <>
      {/* Marquee announcement */}
      <div className="bg-primary text-white text-[11px] py-2 overflow-hidden sticky top-0 z-[60]">
        <div className="flex animate-marquee whitespace-nowrap">
          <span className="mx-4 font-medium">{announcementText}</span>
          <span className="mx-4 font-medium">{announcementText}</span>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-[34px] z-50 bg-white/95 backdrop-blur-md border-b border-gray-50 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
            <img
              alt="TH LOTTO"
              className="w-full h-full object-cover"
              src="https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png"
            />
          </div>
          <div className="shrink-0">
            <div className="flex items-center gap-1">
              <h1 className="font-bold text-[16px] leading-tight whitespace-nowrap">TH LOTTO</h1>
              <span className="material-symbols-outlined text-primary text-[14px] shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <p className="text-primary text-[12px] font-medium leading-tight whitespace-nowrap">Premium</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-400 uppercase font-bold whitespace-nowrap">ยอดคงเหลือ</span>
            <div className="flex items-center gap-1">
              <span className="material-icons text-accent-gold text-sm shrink-0">monetization_on</span>
              <span className="font-bold text-[14px] whitespace-nowrap">฿{displayBalance}</span>
            </div>
          </div>
          <Link to="/notifications" className="relative p-1 shrink-0">
            <span className="material-icons text-gray-500">notifications</span>
            {unread && <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full border border-white"></span>}
          </Link>
          <Link to="/profile" className="w-9 h-9 rounded-full border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
            <img
              alt="User"
              className="w-full h-full object-cover"
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=1a7e2a&color=fff`}
            />
          </Link>
        </div>
      </header>
    </>
  );
};

export default AppHeader;
