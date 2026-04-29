import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../AuthContext';

const brandGradient = 'linear-gradient(135deg, #1a7e2a 0%, #2ecc71 100%)';

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [summary, setSummary] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setTransactions(data);

        // Calculate summary for current month only
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthData = data.filter(t => t.created_at >= startOfMonth);
        const income = monthData
          .filter(t => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION'].includes(t.type) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = monthData
          .filter(t => ['WITHDRAW', 'BET'].includes(t.type) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
        
        setSummary({ income, expense });
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  const getIconName = (type, status) => {
    if (status === 'REJECTED') return 'error';
    switch (type) {
      case 'DEPOSIT': return 'add_card';
      case 'WITHDRAW': return 'trending_down';
      case 'WIN': return 'trending_up';
      case 'PAYOUT': return 'military_tech';
      case 'BET': return 'confirmation_number';
      case 'BONUS': return 'redeem';
      case 'COMMISSION': return 'group';
      default: return 'info';
    }
  };

  const getIconColor = (type, status) => {
    if (status === 'REJECTED') return 'text-rose-500';
    switch (type) {
      case 'DEPOSIT': return 'text-[#1a7e2a]';
      case 'WIN': return 'text-[#1a7e2a]';
      case 'PAYOUT': return 'text-yellow-600';
      case 'BONUS': return 'text-[#1a7e2a]';
      case 'COMMISSION': return 'text-blue-500';
      case 'WITHDRAW': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  const getIconBg = (type, status) => {
    if (status === 'REJECTED') return 'bg-rose-50';
    switch (type) {
      case 'DEPOSIT': return 'bg-emerald-50';
      case 'WIN': return 'bg-emerald-50';
      case 'PAYOUT': return 'bg-yellow-50';
      case 'BONUS': return 'bg-emerald-50';
      case 'COMMISSION': return 'bg-blue-50';
      case 'WITHDRAW': return 'bg-slate-50';
      default: return 'bg-slate-50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-[#1a7e2a]/10 text-[#1a7e2a]';
      case 'PENDING': return 'bg-amber-50 text-amber-600';
      case 'REJECTED': return 'bg-rose-50 text-rose-500';
      default: return 'bg-slate-100 text-slate-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'COMPLETED': return 'สำเร็จ';
      case 'PENDING': return 'รอตรวจสอบ';
      case 'REJECTED': return 'ปฏิเสธ';
      default: return status;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'เติมเงินผ่าน QR Code';
      case 'WITHDRAW': return 'ถอนเงินเข้าธนาคาร';
      case 'WIN': return 'รับรางวัลสลากกินแบ่ง';
      case 'PAYOUT': return 'จ่ายรางวัล';
      case 'BET': return 'แทงหวย';
      case 'BONUS': return 'โบนัส';
      case 'COMMISSION': return 'รายได้แนะนำเพื่อน';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION'].includes(type);

  const filteredTransactions = activeFilter === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === activeFilter);

  return (
    <div className="bg-white text-slate-800 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 pt-6 pb-4 flex items-center justify-between border-b border-slate-50">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-slate-700">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-semibold text-slate-900">ประวัติธุรกรรม</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
          <span className="material-symbols-outlined text-slate-700">search</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Filter Tabs */}
        <div className="flex overflow-x-auto no-scrollbar px-4 py-4 gap-3">
          {[
            { id: 'ALL', name: 'ทั้งหมด' },
            { id: 'DEPOSIT', name: 'เติมเงิน' },
            { id: 'WITHDRAW', name: 'ถอนเงิน' },
            { id: 'WIN', name: 'รางวัล' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 px-6 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all ${
                activeFilter === tab.id
                  ? 'text-white'
                  : 'bg-slate-50 border border-slate-100 text-slate-500'
              }`}
              style={activeFilter === tab.id ? { background: brandGradient } : {}}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Monthly Summary Card */}
        <div className="px-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <p className="text-slate-500 text-sm font-medium">สรุปรายการ{new Date().toLocaleDateString('th-TH', { month: 'long' })}</p>
              <span className="material-symbols-outlined text-[#1a7e2a]/60 text-lg">calendar_month</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">รายรับรวม</p>
                <p className="text-2xl font-extrabold text-[#1a7e2a]">฿{summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex flex-col gap-1 border-l border-slate-100 pl-4">
                <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">รายจ่ายรวม</p>
                <p className="text-2xl font-extrabold text-slate-800">฿{summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="px-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900">รายการล่าสุด</h3>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-[#1a7e2a]/20 border-t-[#1a7e2a] rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="bg-white p-4 rounded-xl border border-slate-50 flex items-start gap-4 transition-colors active:bg-slate-50">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${getIconBg(t.type, t.status)}`}>
                    <span className={`material-symbols-outlined ${getIconColor(t.type, t.status)}`}>
                      {getIconName(t.type, t.status)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800 truncate">{getTypeLabel(t.type)}</h4>
                      <p className={`font-bold text-sm ${
                        isIncome(t.type) ? 'text-[#1a7e2a]' : 'text-slate-800'
                      }`}>
                        {isIncome(t.type) ? '+' : '-'}฿{Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {t.reference_id && (
                      <p className="text-xs mt-1 uppercase tracking-tight text-slate-400">Ref: {t.reference_id}</p>
                    )}
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-xs text-slate-400">
                        {new Date(t.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })},{' '}
                        {new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getStatusStyle(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-slate-200 text-5xl">receipt_long</span>
              <p className="mt-3 text-sm font-semibold text-slate-900">ไม่พบรายการธุรกรรม</p>
              <p className="text-xs text-slate-400 mt-1">รายการธุรกรรมทั้งหมดจะแสดงที่นี่</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Transactions;
