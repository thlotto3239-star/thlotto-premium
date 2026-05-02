import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Results from './pages/Results';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Deposit from './pages/Deposit';
import DepositSuccess from './pages/DepositSuccess';
import QRPayment from './pages/QRPayment';
import UploadSlip from './pages/UploadSlip';
import RegistrationSuccess from './pages/RegistrationSuccess';
import Betting from './pages/Betting';
import LotteryList from './pages/LotteryList';
import BetHistory from './pages/BetHistory';
import Wallet from './pages/Wallet';
import Affiliate from './pages/Affiliate';
import LuckyWheel from './pages/LuckyWheel';
import Withdrawal from './pages/Withdrawal';
import WithdrawalConfirm from './pages/WithdrawalConfirm';
import Transactions from './pages/Transactions';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import Promotions from './pages/Promotions';
import BankAccount from './pages/BankAccount';
import ChangePassword from './pages/ChangePassword';
import Terms from './pages/Terms';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Processing from './pages/Processing';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
