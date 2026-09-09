import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';
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
      case 'WIN': return 'รับรางวัล';
      case 'PAYOUT': return 'จ่ายรางวัล';
      case 'BET': return 'แทงหวย';
      case 'BONUS': return 'โบนัส';
      case 'COMMISSION': return 'รายได้แนะนำเพื่อน';
      case 'ADMIN_CREDIT': return 'แอดมินปรับยอด (เพิ่ม)';
      case 'ADMIN_DEBIT': return 'แอดมินปรับยอด (หัก)';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION', 'ADMIN_CREDIT'].includes(type);

  const filteredTransactions = activeFilter === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.type === activeFilter);

  const [copiedRef, setCopiedRef] = useState(null);

  const copyReference = (ref) => {
    if (!ref) return;
    navigator.clipboard?.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const netFlow = summary.income - summary.expense;

  return (
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                ประวัติธุรกรรม
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-600">
                  {filteredTransactions.length} รายการ
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">บันทึกการเงิน การฝาก ถอน และเงินรางวัลทั้งหมด</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/deposit"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-black shadow-md shadow-primary/20 hover:brightness-105 transition-all"
            >
              <span className="material-symbols-outlined text-base">add_card</span>
              เติมเงิน
            </Link>
            <Link
              to="/withdrawal"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-slate-200 transition-all"
            >
              <span className="material-symbols-outlined text-base">payments</span>
              ถอนเงิน
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Monthly Financial Metrics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-lg">calendar_month</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">สรุปประจำเดือน</h3>
                    <p className="text-xs text-slate-400 font-bold">{new Date().toLocaleDateString('th-TH-u-ca-buddhist', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-xl">arrow_downward</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">รายรับรวม</p>
                      <p className="text-xs text-emerald-600 font-bold">ฝาก/รางวัล/โบนัส</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-emerald-600 font-mono">
                    +฿{summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                      <span className="material-symbols-outlined text-xl">arrow_upward</span>
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-800 uppercase tracking-wider">รายจ่ายรวม</p>
                      <p className="text-xs text-rose-600 font-bold">ถอนเงิน/แทงหวย</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-rose-600 font-mono">
                    -฿{summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider">ยอดเงินหมุนเวียนสุทธิ</span>
                  <span className={`text-base font-black font-mono ${netFlow >= 0 ? 'text-primary' : 'text-slate-700'}`}>
                    {netFlow >= 0 ? '+' : ''}฿{netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Security Notice */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-gold">verified_user</span>
                <h4 className="text-sm font-black tracking-wide">ความปลอดภัยระบบการเงิน</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                ทุกธุรกรรมถูกเข้ารหัสด้วยมาตรฐาน SSL 256-bit บันทึกบน Ledger ไม่สามารถแก้ไขหรือปลอมแปลงได้
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/deposit"
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-center text-xs font-black hover:brightness-105 transition-all shadow-md shadow-primary/20"
                >
                  เติมเงินด่วน
                </Link>
                <Link
                  to="/withdrawal"
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-center text-xs font-black transition-all border border-white/10"
                >
                  แจ้งถอนเงิน
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Transaction List & Filters */}
          <div className="lg:col-span-8 space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'ALL', name: 'ทั้งหมด', icon: 'all_inbox' },
                { id: 'DEPOSIT', name: 'เติมเงิน', icon: 'add_card' },
                { id: 'WITHDRAW', name: 'ถอนเงิน', icon: 'payments' },
                { id: 'WIN', name: 'รางวัล', icon: 'military_tech' },
                { id: 'BET', name: 'แทงหวย', icon: 'confirmation_number' },
                { id: 'COMMISSION', name: 'ค่าคอม', icon: 'group' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                    activeFilter === tab.id
                      ? 'bg-primary text-white shadow-lg shadow-primary/25 ring-2 ring-primary/20'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/70'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </div>

            {/* Transaction Ledger Cards */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-slate-100">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-400">กำลังโหลดรายการธุรกรรม...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/70 hover:border-slate-300 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(t.type, t.status)} shadow-sm`}>
                        <span className={`material-symbols-outlined text-2xl ${getIconColor(t.type, t.status)}`}>
                          {getIconName(t.type, t.status)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 truncate">
                          {t.note || getTypeLabel(t.type)}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400 font-bold">
                            {new Date(t.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short', year: '2-digit' })},{' '}
                            {new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {t.reference_id && (
                            <button
                              onClick={() => copyReference(t.reference_id)}
                              className="text-xs font-mono font-bold text-slate-400 hover:text-primary flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 transition-colors"
                            >
                              <span>Ref: {t.reference_id}</span>
                              <span className="material-symbols-outlined text-xs">
                                {copiedRef === t.reference_id ? 'check' : 'content_copy'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-1.5 shrink-0">
                      <p className={`font-black font-mono text-base sm:text-lg ${
                        isIncome(t.type) ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {isIncome(t.type) ? '+' : '-'}฿{Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider whitespace-nowrap ${getStatusStyle(t.status)}`}>
                        {getStatusLabel(t.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-24 text-center bg-white rounded-3xl border border-slate-200/70 p-8 shadow-sm">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <span className="material-symbols-outlined text-4xl">receipt_long</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">ไม่พบรายการธุรกรรม</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">ไม่มีประวัติธุรกรรมในหมวดหมู่นี้</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Transactions;
