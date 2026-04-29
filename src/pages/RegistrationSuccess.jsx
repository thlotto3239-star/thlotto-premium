import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const RegistrationSuccess = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => navigate('/home'), 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  const displayName = profile?.full_name || 'สมาชิกใหม่';

  return (
    <div className="bg-white text-zinc-900 min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Confetti decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary opacity-20 rotate-12"></div>
        <div className="absolute top-20 right-20 w-4 h-2 rounded-sm bg-yellow-400 opacity-30 -rotate-45"></div>
        <div className="absolute bottom-40 left-1/4 w-2 h-4 rounded-full bg-primary opacity-25 rotate-90"></div>
        <div className="absolute top-1/3 right-10 w-3 h-3 rounded-full bg-yellow-400 opacity-20"></div>
        <div className="absolute bottom-20 right-1/4 w-4 h-2 rounded-sm bg-primary opacity-30 rotate-12"></div>
        <div className="absolute top-1/2 left-8 w-2 h-2 rounded-full bg-yellow-400 opacity-25"></div>
        <div className="absolute top-32 left-1/3 w-2 h-3 rounded-sm bg-primary opacity-20 rotate-45"></div>
        <div className="absolute bottom-32 right-1/3 w-3 h-2 rounded-full bg-yellow-400 opacity-25 -rotate-12"></div>
      </div>

      {/* Content */}
      <div className="z-10 w-full max-w-md flex flex-col items-center text-center space-y-8">

        {/* Success Icon */}
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-primary/10">
            <span
              className="material-symbols-outlined text-6xl text-primary"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check_circle
            </span>
          </div>
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow-lg">
            <span
              className="material-symbols-outlined text-sm block"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            ยินดีต้อนรับ! 🎉
          </h1>
          <p className="text-lg text-primary font-semibold tracking-wide">
            คุณ{displayName} เข้าร่วมแล้ว
          </p>
          <p className="text-sm text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
            บัญชีของคุณพร้อมใช้งานแล้ว ยินดีต้อนรับสู่ TH-LOTTO Premium
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col items-start text-left space-y-2">
            <span className="material-symbols-outlined text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>military_tech</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">สถานะ</span>
            <span className="text-sm font-bold text-zinc-800">Premium Member</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col items-start text-left space-y-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-tighter">กระเป๋าเงิน</span>
            <span className="text-sm font-bold text-zinc-800">พร้อมฝากเงิน</span>
          </div>
        </div>

        {/* CTA */}
        <div className="w-full pt-2">
          <button
            onClick={() => navigate('/home')}
            className="group w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>เริ่มใช้งานเลย</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
          <p className="mt-4 text-xs text-zinc-400 animate-pulse">กำลังพาไปยังหน้าหลักอัตโนมัติ...</p>
        </div>
      </div>

      {/* Brand Footer */}
      <div className="absolute bottom-10 flex flex-col items-center space-y-2">
        <span className="text-xs font-bold tracking-[0.2em] text-zinc-300 uppercase">Powered By</span>
        <div className="text-xl font-black text-primary tracking-tighter">
          TH-LOTTO <span className="text-yellow-400">Premium</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
