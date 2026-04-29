import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setNotifications(data);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications_realtime')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const getIconName = (type) => {
    switch (type) {
      case 'WIN': return 'military_tech';
      case 'DEPOSIT': return 'account_balance_wallet';
      case 'WITHDRAW': return 'payments';
      case 'SYSTEM': return 'info';
      default: return 'notifications';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'WIN': return 'text-emerald-500';
      case 'DEPOSIT': return 'text-[#1a7e2a]';
      case 'WITHDRAW': return 'text-[#b08d57]';
      case 'SYSTEM': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'WIN': return 'bg-emerald-50';
      case 'DEPOSIT': return 'bg-[#1a7e2a]/10';
      case 'WITHDRAW': return 'bg-[#b08d57]/10';
      case 'SYSTEM': return 'bg-blue-50';
      default: return 'bg-slate-50';
    }
  };

  const filteredNotifications = activeFilter === 'ALL' 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter);

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  const groupedToday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === todayStr);
  const groupedYesterday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === yesterdayStr);
  const groupedOlder = filteredNotifications.filter(n => {
    const d = new Date(n.created_at).toDateString();
    return d !== todayStr && d !== yesterdayStr;
  });

  const NotifItem = ({ n }) => (
    <div
      onClick={() => !n.is_read && markAsRead(n.id)}
      className={`relative flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
        n.is_read ? 'bg-white border-slate-100' : 'bg-primary/[0.03] border-primary/20'
      }`}
    >
      {!n.is_read && <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary"></span>}
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(n.type)}`}>
        <span className={`material-symbols-outlined text-xl ${getIconColor(n.type)}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {getIconName(n.type)}
        </span>
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex justify-between items-start">
          <h3 className={`font-extrabold text-sm ${n.is_read ? 'text-slate-500' : 'text-slate-900'}`}>{n.title}</h3>
          <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 font-medium">
            {new Date(n.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={`text-xs mt-0.5 leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-600'}`}>{n.body}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen text-slate-900 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 h-16 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700">
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">การแจ้งเตือน</h1>
        <button
          onClick={markAllAsRead}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-700"
        >
          <span className="material-symbols-outlined text-[20px]">done_all</span>
        </button>
      </header>

      <main className="px-6 pt-5">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5 pb-1">
          {[
            { id: 'ALL', name: 'ทั้งหมด' },
            { id: 'WIN', name: 'ถูกรางวัล' },
            { id: 'DEPOSIT', name: 'ฝากเงิน' },
            { id: 'WITHDRAW', name: 'ถอนเงิน' },
            { id: 'SYSTEM', name: 'ระบบ' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-6">
            {groupedToday.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">วันนี้</p>
                <div className="space-y-2">{groupedToday.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
            {groupedYesterday.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">เมื่อวาน</p>
                <div className="space-y-2">{groupedYesterday.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
            {groupedOlder.length > 0 && (
              <div>
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">ก่อนหน้านี้</p>
                <div className="space-y-2">{groupedOlder.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-slate-200 text-5xl">notifications_off</span>
            <p className="mt-3 text-sm font-extrabold text-slate-900">ไม่พบการแจ้งเตือน</p>
            <p className="text-xs text-slate-400 mt-1">การแจ้งเตือนทั้งหมดจะแสดงที่นี่</p>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Notifications;
