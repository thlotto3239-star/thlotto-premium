import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { subscribeNotifications } from '../services/notificationService';

const AUTO_DISMISS_MS = 7000;

const TYPE_CONFIG = {
  WIN: {
    bg: 'from-amber-400 via-yellow-300 to-amber-400',
    border: 'border-amber-300',
    iconBg: 'bg-amber-500',
    icon: 'military_tech',
    textColor: 'text-amber-900',
    subColor: 'text-amber-800',
    badge: 'bg-amber-600 text-white',
    badgeLabel: '🎉 ถูกรางวัล!',
    progressColor: 'bg-amber-600',
    shadow: 'shadow-amber-400/40',
  },
  DEPOSIT: {
    bg: 'from-emerald-500 via-green-400 to-emerald-500',
    border: 'border-emerald-300',
    iconBg: 'bg-emerald-600',
    icon: 'account_balance_wallet',
    textColor: 'text-emerald-900',
    subColor: 'text-emerald-800',
    badge: 'bg-emerald-700 text-white',
    badgeLabel: '💰 ฝากเงิน',
    progressColor: 'bg-emerald-700',
    shadow: 'shadow-emerald-400/40',
  },
  WITHDRAW: {
    bg: 'from-blue-500 via-indigo-400 to-blue-500',
    border: 'border-blue-300',
    iconBg: 'bg-blue-600',
    icon: 'payments',
    textColor: 'text-blue-900',
    subColor: 'text-blue-800',
    badge: 'bg-blue-700 text-white',
    badgeLabel: '💸 ถอนเงิน',
    progressColor: 'bg-blue-700',
    shadow: 'shadow-blue-400/40',
  },
  SYSTEM: {
    bg: 'from-slate-600 via-slate-500 to-slate-600',
    border: 'border-slate-400',
    iconBg: 'bg-slate-700',
    icon: 'info',
    textColor: 'text-slate-900',
    subColor: 'text-slate-700',
    badge: 'bg-slate-700 text-white',
    badgeLabel: '📢 แจ้งเตือนระบบ',
    progressColor: 'bg-slate-700',
    shadow: 'shadow-slate-400/30',
  },
  DEFAULT: {
    bg: 'from-primary via-primary/80 to-primary',
    border: 'border-primary/30',
    iconBg: 'bg-primary',
    icon: 'notifications',
    textColor: 'text-slate-900',
    subColor: 'text-slate-700',
    badge: 'bg-primary text-white',
    badgeLabel: '🔔 แจ้งเตือน',
    progressColor: 'bg-primary',
    shadow: 'shadow-primary/30',
  },
};

function SinglePopup({ notif, onDismiss }) {
  const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.DEFAULT;
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.current);
        handleDismiss();
      }
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [handleDismiss]);

  const isWin = notif.type === 'WIN';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300
        ${visible ? 'opacity-100' : 'opacity-0 scale-95'}`}
      style={{ pointerEvents: 'none' }}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: 'auto' }}
        onClick={handleDismiss}
      />

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-sm rounded-3xl shadow-2xl ${cfg.shadow} overflow-hidden transition-all duration-300 ${visible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-8'}`}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${cfg.bg} px-5 pt-5 pb-8`}>
          {/* Top row */}
          <div className="flex items-center justify-between mb-4">
            <span className={`text-xs font-black px-3 py-1 rounded-full ${cfg.badge}`}>
              {cfg.badgeLabel}
            </span>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-white hover:bg-white/50 transition"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full ${cfg.iconBg} flex items-center justify-center shadow-lg ${isWin ? 'animate-bounce' : ''}`}>
              <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                {cfg.icon}
              </span>
            </div>
          </div>

          {/* Win confetti emoji */}
          {isWin && (
            <div className="absolute top-4 left-4 text-2xl animate-spin" style={{ animationDuration: '3s' }}>🎊</div>
          )}
          {isWin && (
            <div className="absolute top-4 right-14 text-2xl animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>✨</div>
          )}
        </div>

        {/* White body */}
        <div className="bg-white px-5 pt-4 pb-5 -mt-4 rounded-t-3xl">
          <h2 className={`text-lg font-black text-center ${cfg.textColor} leading-tight`}>
            {notif.title}
          </h2>
          <p className={`text-sm text-center mt-2 leading-relaxed ${cfg.subColor}`}>
            {notif.body}
          </p>

          <div className="flex items-center justify-between mt-4 gap-3">
            <button
              onClick={handleDismiss}
              className={`flex-1 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r ${cfg.bg} text-white shadow-lg transition active:scale-95`}
            >
              รับทราบ
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${cfg.progressColor} rounded-full transition-all`}
              style={{ width: `${progress}%`, transitionDuration: '50ms' }}
            />
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-1">ปิดอัตโนมัติใน {Math.ceil((progress / 100) * (AUTO_DISMISS_MS / 1000))} วินาที</p>
        </div>
      </div>
    </div>
  );
}

export default function NotificationPopup() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (!user?.id) return;

    const unsub = subscribeNotifications(user.id, (notification) => {
      setQueue(prev => [...prev, { ...notification, _popupId: Date.now() + Math.random() }]);
    });

    return unsub;
  }, [user?.id]);

  const dismiss = useCallback((popupId) => {
    setQueue(prev => prev.filter(n => n._popupId !== popupId));
  }, []);

  if (!queue.length) return null;

  return (
    <SinglePopup
      key={queue[0]._popupId}
      notif={queue[0]}
      onDismiss={() => dismiss(queue[0]._popupId)}
    />
  );
}
