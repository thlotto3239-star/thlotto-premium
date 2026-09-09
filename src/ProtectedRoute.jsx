import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import DesktopSidebar from './components/DesktopSidebar';

const ProtectedRoute = ({ children }) => {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (profile?.status === 'SUSPENDED' || profile?.status === 'BANNED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="size-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200">
            <span className="material-symbols-outlined text-3xl">block</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">บัญชีถูกระงับการใช้งาน</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              บัญชีผู้ใช้งานของท่านถูกระงับชั่วคราวโดยผู้ดูแลระบบ หากท่านคิดว่าเป็นข้อผิดพลาด กรุณาติดต่อฝ่ายบริการลูกค้า
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2.5">
            <a
              href="/support"
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>ติดต่อฝ่ายบริการลูกค้า</span>
            </a>
            <button
              onClick={() => signOut && signOut()}
              className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex antialiased">
      {/* Side Navigation Menu on Desktop PC (hidden on mobile) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default ProtectedRoute;
