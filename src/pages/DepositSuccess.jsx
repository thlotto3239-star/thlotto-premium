import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import BottomNav from '../components/BottomNav';

const DepositSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const handleShare = () => {
    const text = `เติมเงิน TH-LOTTO สำเร็จ ฿${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (navigator.share) {
      navigator.share({ title: 'TH-LOTTO Premium', text }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(text);
    }
  };

  const amount = location.state?.amount || 0;
  const txRef = location.state?.txRef || '';
  const createdAt = location.state?.createdAt ? new Date(location.state.createdAt) : new Date();

  return (
    <div className="bg-white font-display text-slate-800 antialiased overflow-x-hidden min-h-screen flex flex-col">
      <div className="relative flex min-h-screen flex-col max-w-[430px] mx-auto w-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate('/home')}
            className="flex w-10 h-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors active:bg-slate-100">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          <h2 className="text-xs font-bold tracking-widest uppercase text-slate-300">TH-LOTTO Premium</h2>
          <button onClick={handleShare} className="flex w-10 h-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition-colors active:bg-slate-100">
            <span className="material-symbols-outlined text-xl">share</span>
          </button>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col items-center px-6 pt-6 pb-12">
          {/* Success Indicator Section */}
          <div className="flex flex-col items-center w-full max-w-sm mx-auto">
            {/* Large Green Checkmark */}
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-40 h-40 rounded-full bg-primary/5 animate-pulse"></div>
              <div className="absolute w-32 h-32 rounded-full border border-primary/10"></div>
              <div className="relative flex w-24 h-24 items-center justify-center rounded-full bg-primary text-white">
                <span className="material-symbols-outlined text-5xl font-bold" style={{ fontVariationSettings: "'wght' 700" }}>check</span>
              </div>
            </div>

            {/* Headlines */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">เติมเงินสำเร็จ!</h1>
              <p className="text-slate-400 font-medium">รายการของคุณได้รับการยืนยันเรียบร้อยแล้ว</p>
            </div>

            {/* Amount Display */}
            <div className="text-center mb-8">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-1">จำนวนเงิน</div>
              <span className="text-5xl font-bold text-primary tracking-tight">
                ฿{Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Transaction Details Card */}
            <div className="w-full bg-white rounded-2xl p-6 border border-slate-100 space-y-4 shadow-sm">
              {txRef && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">เลขที่รายการ</span>
                  <span className="font-semibold text-slate-700 text-sm">{txRef}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">วันที่และเวลา</span>
                <span className="font-medium text-slate-700 text-sm">
                  {createdAt.toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="h-px w-full bg-slate-50"></div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 font-medium">ยอดเงินคงเหลือ</span>
                <span className="text-xl font-bold text-slate-900">฿{(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-[40px]"></div>

          {/* Action Buttons */}
          <div className="w-full max-w-sm space-y-3">
            <button
              onClick={() => navigate('/lottery-list')}
              className="w-full rounded-2xl py-4 text-lg font-bold text-white transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              <span className="flex items-center justify-center gap-2">
                แทงหวยเลย!
                <span className="material-symbols-outlined text-xl">arrow_forward</span>
              </span>
            </button>
            <button
              onClick={() => navigate('/home')}
              className="w-full rounded-2xl bg-white border border-slate-100 py-4 text-lg font-bold text-slate-400 transition-all active:scale-[0.98] active:bg-slate-50"
            >
              กลับหน้าหลัก
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default DepositSuccess;
