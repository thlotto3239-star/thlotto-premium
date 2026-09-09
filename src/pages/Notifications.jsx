import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../AuthContext';
import { fetchNotifications, subscribeNotifications, markAsRead as markAsReadService, markAllAsRead as markAllAsReadService } from '../services/notificationService';
import logger from '../services/logger';

const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications(user.id);
        setNotifications(data);
      } catch (err) {
        logger.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe (singleton — ร่วมกับ NotificationPopup + AppHeader)
    const unsub = subscribeNotifications(user.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return unsub;
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await markAsReadService(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      logger.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    const hasUnread = notifications.some(n => !n.is_read);
    if (!hasUnread) return;
    try {
      await markAllAsReadService(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      logger.error('Error marking all notifications as read:', err);
    }
  };

  const getIconName = (type) => {
    const t = String(type || '').toUpperCase();
    switch (t) {
      case 'WIN': return 'military_tech';
      case 'DEPOSIT': return 'account_balance_wallet';
      case 'WITHDRAW': return 'payments';
      case 'WARNING': return 'warning';
      case 'PROMOTION': return 'campaign';
      case 'SYSTEM':
      case 'INFO': return 'info';
      case 'BROADCAST': return 'campaign';
      default: return 'notifications';
    }
  };

  const getIconColor = (type) => {
    const t = String(type || '').toUpperCase();
    switch (t) {
      case 'WIN': return 'text-emerald-500';
      case 'DEPOSIT': return 'text-[#1a7e2a]';
      case 'WITHDRAW': return 'text-[#b08d57]';
      case 'WARNING': return 'text-amber-500';
      case 'PROMOTION': return 'text-emerald-600';
      case 'SYSTEM':
      case 'INFO': return 'text-blue-500';
      case 'BROADCAST': return 'text-orange-500';
      default: return 'text-slate-400';
    }
  };

  const getIconBg = (type) => {
    const t = String(type || '').toUpperCase();
    switch (t) {
      case 'WIN': return 'bg-emerald-50';
      case 'DEPOSIT': return 'bg-[#1a7e2a]/10';
      case 'WITHDRAW': return 'bg-[#b08d57]/10';
      case 'WARNING': return 'bg-amber-50';
      case 'PROMOTION': return 'bg-emerald-50';
      case 'SYSTEM':
      case 'INFO': return 'bg-blue-50';
      case 'BROADCAST': return 'bg-orange-50';
      default: return 'bg-slate-50';
    }
  };

  const filteredNotifications = activeFilter === 'ALL' 
    ? notifications 
    : notifications.filter(n => {
        const t = String(n.type || '').toUpperCase();
        if (activeFilter === 'SYSTEM') {
          return t === 'SYSTEM' || t === 'INFO' || t === 'WARNING';
        }
        if (activeFilter === 'broadcast') {
          return t === 'BROADCAST' || t === 'PROMOTION' || t === 'ANNOUNCEMENT';
        }
        return t === activeFilter.toUpperCase();
      });

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  const groupedToday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === todayStr);
  const groupedYesterday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === yesterdayStr);
  const groupedOlder = filteredNotifications.filter(n => {
    const d = new Date(n.created_at).toDateString();
    return d !== todayStr && d !== yesterdayStr;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const NotifItem = ({ n }) => (
    <div
      onClick={() => !n.is_read && markAsRead(n.id)}
      className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
        n.is_read ? 'bg-white border-slate-100 hover:border-slate-200' : 'bg-primary/[0.03] border-primary/20 hover:border-primary/40'
      }`}
    >
      {!n.is_read && <span className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/10"></span>}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(n.type)} shadow-sm`}>
        <span className={`material-symbols-outlined text-2xl ${getIconColor(n.type)}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {getIconName(n.type)}
        </span>
      </div>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex justify-between items-start">
          <h3 className={`font-black text-sm sm:text-base truncate ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>{n.title}</h3>
          <span className="text-xs text-slate-400 whitespace-nowrap ml-2 font-bold">
            {new Date(n.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-600'}`}>{n.body}</p>
      </div>
    </div>
  );

  return (
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-primary text-white">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">ข่าวสารและการแจ้งเตือนระบบทั้งหมด</p>
            </div>
          </div>
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              unreadCount > 0
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer'
                : 'bg-slate-50 text-slate-300 cursor-not-allowed'
            }`}
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            <span className="hidden sm:inline">อ่านทั้งหมด</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-1">
          {[
            { id: 'ALL', name: 'ทั้งหมด', icon: 'all_inbox' },
            { id: 'WIN', name: 'ถูกรางวัล', icon: 'military_tech' },
            { id: 'DEPOSIT', name: 'ฝากเงิน', icon: 'account_balance_wallet' },
            { id: 'WITHDRAW', name: 'ถอนเงิน', icon: 'payments' },
            { id: 'SYSTEM', name: 'ระบบ', icon: 'info' },
            { id: 'broadcast', name: 'ประกาศ', icon: 'campaign' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === f.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/20'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
              }`}
            >
              <span className="material-symbols-outlined text-base">{f.icon}</span>
              {f.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-400">กำลังโหลดการแจ้งเตือน...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-8">
            {groupedToday.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">วันนี้</p>
                </div>
                <div className="space-y-3">{groupedToday.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
            {groupedYesterday.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">เมื่อวาน</p>
                </div>
                <div className="space-y-3">{groupedYesterday.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
            {groupedOlder.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider">ก่อนหน้านี้</p>
                </div>
                <div className="space-y-3">{groupedOlder.map(n => <NotifItem key={n.id} n={n} />)}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <span className="material-symbols-outlined text-4xl">notifications_off</span>
            </div>
            <h3 className="text-lg font-black text-slate-900">ไม่พบการแจ้งเตือน</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">ไม่มีรายการแจ้งเตือนในหมวดหมู่นี้</p>
          </div>
        )}
      </main>
    </PageWrapper>
  );
};

export default Notifications;
