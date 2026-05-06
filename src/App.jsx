import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';
import NotificationPopup from './components/NotificationPopup';

// Lazy-loaded pages — โหลดเฉพาะหน้าที่ผู้ใช้เปิด
const Home               = lazy(() => import('./pages/Home'));
const Login              = lazy(() => import('./pages/Login'));
const Register           = lazy(() => import('./pages/Register'));
const Results            = lazy(() => import('./pages/Results'));
const Profile            = lazy(() => import('./pages/Profile'));
const EditProfile        = lazy(() => import('./pages/EditProfile'));
const Deposit            = lazy(() => import('./pages/Deposit'));
const DepositSuccess     = lazy(() => import('./pages/DepositSuccess'));
const QRPayment          = lazy(() => import('./pages/QRPayment'));
const UploadSlip         = lazy(() => import('./pages/UploadSlip'));
const RegistrationSuccess = lazy(() => import('./pages/RegistrationSuccess'));
const Betting            = lazy(() => import('./pages/Betting'));
const LotteryList        = lazy(() => import('./pages/LotteryList'));
const BetHistory         = lazy(() => import('./pages/BetHistory'));
const Wallet             = lazy(() => import('./pages/Wallet'));
const Affiliate          = lazy(() => import('./pages/Affiliate'));
const LuckyWheel         = lazy(() => import('./pages/LuckyWheel'));
const Withdrawal         = lazy(() => import('./pages/Withdrawal'));
const WithdrawalConfirm  = lazy(() => import('./pages/WithdrawalConfirm'));
const Transactions       = lazy(() => import('./pages/Transactions'));
const Notifications      = lazy(() => import('./pages/Notifications'));
const Support            = lazy(() => import('./pages/Support'));
const Promotions         = lazy(() => import('./pages/Promotions'));
const BankAccount        = lazy(() => import('./pages/BankAccount'));
const ChangePassword     = lazy(() => import('./pages/ChangePassword'));
const Terms              = lazy(() => import('./pages/Terms'));
const Articles           = lazy(() => import('./pages/Articles'));
const ArticleDetail      = lazy(() => import('./pages/ArticleDetail'));
const Processing         = lazy(() => import('./pages/Processing'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <NotificationPopup />
      <Router>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
          <Route path="/deposit-success" element={<ProtectedRoute><DepositSuccess /></ProtectedRoute>} />
          <Route path="/qr-payment" element={<ProtectedRoute><QRPayment /></ProtectedRoute>} />
          <Route path="/upload-slip" element={<ProtectedRoute><UploadSlip /></ProtectedRoute>} />
          <Route path="/withdrawal" element={<ProtectedRoute><Withdrawal /></ProtectedRoute>} />
          <Route path="/withdrawal-confirm" element={<ProtectedRoute><WithdrawalConfirm /></ProtectedRoute>} />
          <Route path="/registration-success" element={<ProtectedRoute><RegistrationSuccess /></ProtectedRoute>} />
          <Route path="/betting" element={<ProtectedRoute><Betting /></ProtectedRoute>} />
          <Route path="/lottery-list" element={<ProtectedRoute><LotteryList /></ProtectedRoute>} />
          <Route path="/bet-history" element={<ProtectedRoute><BetHistory /></ProtectedRoute>} />
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/affiliate" element={<ProtectedRoute><Affiliate /></ProtectedRoute>} />
          <Route path="/lucky-wheel" element={<ProtectedRoute><LuckyWheel /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/promotions" element={<ProtectedRoute><Promotions /></ProtectedRoute>} />
          <Route path="/bank-account" element={<ProtectedRoute><BankAccount /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/terms" element={<ProtectedRoute><Terms /></ProtectedRoute>} />
          <Route path="/articles" element={<ProtectedRoute><Articles /></ProtectedRoute>} />
          <Route path="/articles/:id" element={<ProtectedRoute><ArticleDetail /></ProtectedRoute>} />
          <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/home" replace />} />

        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
