import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [selectedNotif, setSelectedNotif] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications(user.id);
        const list = data || [];
        setNotifications(list);
        if (list.length > 0) setSelectedNotif(list[0]);
      } catch (err) {
        logger.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    const unsub = subscribeNotifications(user.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
    });

    return unsub;
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await markAsReadService(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      if (selectedNotif?.id === id) {
        setSelectedNotif(prev => ({ ...prev, is_read: true }));
      }
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
      if (selectedNotif) setSelectedNotif(prev => ({ ...prev, is_read: true }));
    } catch (err) {
      logger.error('Error marking all notifications as read:', err);
    }
  };

  const getIconName = (type) => {
    switch (type) {
      case 'WIN': return 'emoji_events';
      case 'DEPOSIT': return 'account_balance_wallet';
      case 'WITHDRAW': return 'payments';
      case 'SYSTEM': return 'info';
      case 'broadcast': return 'campaign';
      default: return 'notifications';
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'WIN': return 'text-amber-600';
      case 'DEPOSIT': return 'text-emerald-700';
      case 'WITHDRAW': return 'text-blue-600';
      case 'SYSTEM': return 'text-purple-600';
      case 'broadcast': return 'text-orange-600';
      default: return 'text-slate-500';
    }
  };

  const getIconBg = (type) => {
    switch (type) {
      case 'WIN': return 'bg-amber-50';
      case 'DEPOSIT': return 'bg-emerald-50';
      case 'WITHDRAW': return 'bg-blue-50';
      case 'SYSTEM': return 'bg-purple-50';
      case 'broadcast': return 'bg-orange-50';
      default: return 'bg-slate-100';
    }
  };

  const filteredNotifications = useMemo(() => {
    return activeFilter === 'ALL' 
      ? notifications 
      : notifications.filter(n => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  const groupedToday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === todayStr);
  const groupedYesterday = filteredNotifications.filter(n => new Date(n.created_at).toDateString() === yesterdayStr);
  const groupedOlder = filteredNotifications.filter(n => {
    const d = new Date(n.created_at).toDateString();
    return d !== todayStr && d !== yesterdayStr;
  });

  const categories = [
    { id: 'ALL', name: 'ทั้งหมด', icon: 'list_alt' },
    { id: 'WIN', name: 'ถูกรางวัล', icon: 'emoji_events' },
    { id: 'DEPOSIT', name: 'ฝากเงิน', icon: 'account_balance_wallet' },
    { id: 'WITHDRAW', name: 'ถอนเงิน', icon: 'payments' },
    { id: 'broadcast', name: 'ประกาศ', icon: 'campaign' },
    { id: 'SYSTEM', name: 'ระบบ', icon: 'info' }
  ];

  const handleSelectNotif = (n) => {
    setSelectedNotif(n);
    if (!n.is_read) {
      markAsRead(n.id);
    }
  };

  return (
    <PageWrapper>
      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>ศูนย์การแจ้งเตือน</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200/70 animate-pulse">
                    {unreadCount} ข้อความใหม่
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">แจ้งเตือนผลรางวัล รายการฝาก-ถอน และข่าวสารกิจกรรมจากระบบ</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">done_all</span>
                <span>อ่านทั้งหมด</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 3 Cols on PC): Filter Categories & Shortcuts ════ */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs space-y-1">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2">
                หมวดหมู่การแจ้งเตือน
              </h3>
              {categories.map((cat) => {
                const isActive = activeFilter === cat.id;
                const count = cat.id === 'ALL'
                  ? notifications.length
                  : notifications.filter(n => n.type === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFilter(cat.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`material-symbols-outlined text-lg ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {cat.icon}
                      </span>
                      <span>{cat.name}</span>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-300 text-xl">notifications_active</span>
                <h4 className="text-xs font-extrabold">ไม่พลาดทุกรางวัล</h4>
              </div>
              <p className="text-[11px] text-emerald-200 leading-relaxed">
                ระบบตรวจผลหวยอัตโนมัติ แจ้งเตือนยอดเงินรางวัลเข้ากระเป๋าทันทีที่มีการออกผล
              </p>
              <Link
                to="/results"
                className="block py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs text-center transition-all shadow-xs"
              >
                ตรวจผลรางวัลวันนี้
              </Link>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 6 Cols on PC): Notification Feed ════ */}
          <main className="lg:col-span-6 space-y-4">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-100">
                <div className="size-9 border-3 border-emerald-600/30 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">กำลังโหลดการแจ้งเตือน...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {groupedToday.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-2">วันนี้</p>
                    {groupedToday.map(n => renderItem(n))}
                  </div>
                )}
                {groupedYesterday.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-2">เมื่อวาน</p>
                    {groupedYesterday.map(n => renderItem(n))}
                  </div>
                )}
                {groupedOlder.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-2">ก่อนหน้านี้</p>
                    {groupedOlder.map(n => renderItem(n))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-6">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">notifications_off</span>
                <p className="text-sm font-extrabold text-slate-800">ไม่มีการแจ้งเตือนในหมวดหมู่นี้</p>
                <p className="text-xs text-slate-400 mt-1">ข้อความแจ้งเตือนใหม่ๆ จะแสดงที่นี่โดยอัตโนมัติ</p>
              </div>
            )}
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Notification Inspector ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {selectedNotif ? (
              <div className="bg-white rounded-3xl p-5 border border-emerald-300 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-700 text-lg">mark_email_read</span>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      รายละเอียดข้อความ
                    </h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedNotif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {selectedNotif.is_read ? 'อ่านแล้ว' : 'ข้อความใหม่'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(selectedNotif.type)}`}>
                      <span className={`material-symbols-outlined text-xl ${getIconColor(selectedNotif.type)}`}>
                        {getIconName(selectedNotif.type)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{selectedNotif.title}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(selectedNotif.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 text-xs leading-relaxed">
                    {selectedNotif.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl p-5 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl mb-1 text-slate-300">touch_app</span>
                <p>คลิกเลือกการแจ้งเตือนเพื่อดูเนื้อหาฉบับเต็ม</p>
              </div>
            )}

            {/* Notification Delivery Policy */}
            <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-2xs space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5 font-extrabold text-slate-800">
                <span className="material-symbols-outlined text-emerald-700 text-base">security_update_good</span>
                <span>ระบบแจ้งเตือนแบบเรียลไทม์</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                ระบบอัปเดตแจ้งเตือนผ่านช่องสัญญาณความเร็วสูงทันทีที่มีความเคลื่อนไหวทางบัญชี
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );

  function renderItem(n) {
    const isSelected = selectedNotif?.id === n.id;
    return (
      <div
        key={n.id}
        onClick={() => handleSelectNotif(n)}
        className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3.5 hover:border-emerald-300 hover:shadow-xs active:scale-[0.99] ${
          isSelected
            ? 'border-emerald-500 ring-2 ring-emerald-500/15'
            : n.is_read
            ? 'border-slate-200/80'
            : 'border-emerald-200 bg-emerald-50/20 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(n.type)}`}>
            <span className={`material-symbols-outlined text-xl ${getIconColor(n.type)}`}>
              {getIconName(n.type)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-xs truncate ${n.is_read ? 'text-slate-700' : 'text-slate-900 font-extrabold'}`}>
                {n.title}
              </h4>
              {!n.is_read && (
                <span className="size-2 rounded-full bg-emerald-600 shrink-0"></span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{n.body}</p>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-medium shrink-0 whitespace-nowrap">
          {new Date(n.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    );
  }
};

export default Notifications;
