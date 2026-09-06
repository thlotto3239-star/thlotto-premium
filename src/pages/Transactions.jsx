import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
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
        setTransactions(data || []);

        // Calculate summary for current month only
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const monthData = (data || []).filter(t => t.created_at >= startOfMonth);
        const income = monthData
          .filter(t => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION', 'ADMIN_CREDIT'].includes(t.type) && t.status === 'COMPLETED')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = monthData
          .filter(t => ['WITHDRAW', 'BET', 'ADMIN_DEBIT'].includes(t.type) && t.status === 'COMPLETED')
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
      case 'WIN': return 'emoji_events';
      case 'PAYOUT': return 'military_tech';
      case 'BET': return 'confirmation_number';
      case 'BONUS': return 'redeem';
      case 'COMMISSION': return 'group';
      case 'ADMIN_CREDIT': return 'account_balance_wallet';
      case 'ADMIN_DEBIT': return 'money_off';
      default: return 'receipt_long';
    }
  };

  const getIconColor = (type, status) => {
    if (status === 'REJECTED') return 'text-rose-500';
    switch (type) {
      case 'DEPOSIT': return 'text-emerald-700';
      case 'WIN': return 'text-emerald-700';
      case 'PAYOUT': return 'text-amber-600';
      case 'BONUS': return 'text-emerald-700';
      case 'COMMISSION': return 'text-blue-600';
      case 'WITHDRAW': return 'text-slate-500';
      default: return 'text-slate-500';
    }
  };

  const getIconBg = (type, status) => {
    if (status === 'REJECTED') return 'bg-rose-50';
    switch (type) {
      case 'DEPOSIT': return 'bg-emerald-50';
      case 'WIN': return 'bg-emerald-50';
      case 'PAYOUT': return 'bg-amber-50';
      case 'BONUS': return 'bg-emerald-50';
      case 'COMMISSION': return 'bg-blue-50';
      case 'WITHDRAW': return 'bg-slate-100';
      default: return 'bg-slate-50';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-200/80';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
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
      case 'DEPOSIT': return 'เติมเงินเข้าระบบ';
      case 'WITHDRAW': return 'ถอนเงินเข้าบัญชี';
      case 'WIN': return 'ถูกรางวัล';
      case 'PAYOUT': return 'จ่ายเงินรางวัล';
      case 'BET': return 'แทงหวย';
      case 'BONUS': return 'โบนัสพิเศษ';
      case 'COMMISSION': return 'คอมมิชชั่นแนะนำเพื่อน';
      case 'ADMIN_CREDIT': return 'ปรับยอดเงิน (เพิ่ม)';
      case 'ADMIN_DEBIT': return 'ปรับยอดเงิน (หัก)';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION', 'ADMIN_CREDIT'].includes(type);

  // Filter logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchType = activeFilter === 'ALL' || t.type === activeFilter;
      const matchStatus = activeStatus === 'ALL' || t.status === activeStatus;
      const matchQuery = searchQuery.trim() === '' || 
        (t.reference_id && t.reference_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.note && t.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (getTypeLabel(t.type).toLowerCase().includes(searchQuery.toLowerCase()));
      return matchType && matchStatus && matchQuery;
    });
  }, [transactions, activeFilter, activeStatus, searchQuery]);

  const categories = [
    { id: 'ALL', name: 'ทั้งหมด', icon: 'list_alt' },
    { id: 'DEPOSIT', name: 'เติมเงิน', icon: 'add_card' },
    { id: 'WITHDRAW', name: 'ถอนเงิน', icon: 'trending_down' },
    { id: 'WIN', name: 'เงินรางวัล', icon: 'emoji_events' },
    { id: 'BET', name: 'แทงหวย', icon: 'confirmation_number' },
    { id: 'COMMISSION', name: 'แนะนำเพื่อน', icon: 'group' },
    { id: 'BONUS', name: 'โบนัส', icon: 'redeem' },
  ];

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
                <span>ประวัติธุรกรรมการเงิน</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Financial Ledger
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">บันทึกรายการฝาก ถอน แทงหวย และรับรางวัลย้อนหลัง</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/deposit"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              <span>เติมเงิน</span>
            </Link>
            <Link
              to="/withdrawal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>ถอนเงิน</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main 3-Column Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 3 Cols on PC): Filter & Fast Actions ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Category Navigation */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                หมวดหมู่ธุรกรรม
              </h3>
              <div className="space-y-1">
                {categories.map(cat => {
                  const isActive = activeFilter === cat.id;
                  const count = cat.id === 'ALL' 
                    ? transactions.length 
                    : transactions.filter(t => t.type === cat.id).length;
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
            </div>

            {/* Status Filter */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2.5">
                สถานะรายการ
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'ALL', label: 'ทั้งหมด' },
                  { id: 'COMPLETED', label: 'สำเร็จ' },
                  { id: 'PENDING', label: 'รอตรวจสอบ' },
                  { id: 'REJECTED', label: 'ปฏิเสธ' }
                ].map(st => (
                  <button
                    key={st.id}
                    onClick={() => setActiveStatus(st.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      activeStatus === st.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Banking Shortcuts */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400 text-xl">verified_user</span>
                <h4 className="text-xs font-extrabold">ศูนย์ธุรกรรมการเงิน</h4>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                ทำรายการฝาก-ถอนได้ตลอด 24 ชม. ด้วยระบบออโต้ความเร็วสูง
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/deposit"
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition-all"
                >
                  เติมเงินทันที
                </Link>
                <Link
                  to="/withdrawal"
                  className="py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold text-center transition-all border border-white/10"
                >
                  ถอนเงิน
                </Link>
              </div>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 6 Cols on PC): Ledger Feed ════ */}
          <main className="lg:col-span-6 space-y-4">
            {/* Search and Stats Bar */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-72">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาเลข Ref หรือประเภท..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <div className="text-xs text-slate-400 font-semibold self-end sm:self-center">
                พบ <span className="font-mono font-bold text-slate-900">{filteredTransactions.length}</span> รายการ
              </div>
            </div>

            {/* Transaction List */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-100">
                <div className="size-9 border-3 border-emerald-600/30 border-t-emerald-700 rounded-full animate-spin"></div>
                <p className="text-xs text-slate-400 font-medium">กำลังโหลดประวัติธุรกรรม...</p>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {filteredTransactions.map((t) => {
                  const income = isIncome(t.type);
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTx(t)}
                      className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 hover:border-emerald-300 hover:shadow-xs active:scale-[0.99] ${
                        selectedTx?.id === t.id ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 ${getIconBg(t.type, t.status)}`}>
                          <span className={`material-symbols-outlined text-xl ${getIconColor(t.type, t.status)}`}>
                            {getIconName(t.type, t.status)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-800 truncate">
                              {t.note || getTypeLabel(t.type)}
                            </h4>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(t.status)}`}>
                              {getStatusLabel(t.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span>
                              {new Date(t.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short', year: '2-digit' })},{' '}
                              {new Date(t.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {t.reference_id && (
                              <span className="font-mono text-slate-400 hidden sm:inline">
                                • Ref: {t.reference_id.slice(-8)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className={`font-mono font-black text-base ${
                          income ? 'text-emerald-700' : 'text-slate-800'
                        }`}>
                          {income ? '+' : '-'}฿{Math.abs(Number(t.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {income ? 'ยอดเข้า' : 'ยอดออก'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-6">
                <span className="material-symbols-outlined text-slate-300 text-5xl mb-2">receipt_long</span>
                <p className="text-sm font-extrabold text-slate-800">ไม่พบรายการธุรกรรมตามที่เลือก</p>
                <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรอง หรือตรวจสอบประวัติในช่วงเวลาอื่น</p>
                {(activeFilter !== 'ALL' || activeStatus !== 'ALL' || searchQuery !== '') && (
                  <button
                    onClick={() => { setActiveFilter('ALL'); setActiveStatus('ALL'); setSearchQuery(''); }}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-all"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                )}
              </div>
            )}
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Analytics & Inspector ════ */}
          <aside className="lg:col-span-3 space-y-4">
            {/* Monthly Statement Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  สรุปบัญชีเดือนนี้
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {new Date().toLocaleDateString('th-TH-u-ca-buddhist', { month: 'short', year: '2-digit' })}
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 mb-1">
                    <span>รายรับทั้งหมด</span>
                    <span className="material-symbols-outlined text-base">arrow_downward</span>
                  </div>
                  <p className="text-xl font-black font-mono text-emerald-700">
                    ฿{summary.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>รายจ่ายทั้งหมด</span>
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                  </div>
                  <p className="text-xl font-black font-mono text-slate-800">
                    ฿{summary.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">ผลต่างสุทธิ</span>
                  <span className={`text-sm font-mono font-black ${
                    summary.income - summary.expense >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {summary.income - summary.expense >= 0 ? '+' : ''}
                    ฿{(summary.income - summary.expense).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Transaction Inspector (PC Details) */}
            {selectedTx ? (
              <div className="bg-white rounded-3xl p-5 border border-emerald-300 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    รายละเอียดธุรกรรม
                  </h4>
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="size-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">ประเภท:</span>
                    <span className="font-bold text-slate-800">{getTypeLabel(selectedTx.type)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">จำนวนเงิน:</span>
                    <span className="font-mono font-black text-slate-900">฿{Math.abs(Number(selectedTx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-400">สถานะ:</span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${getStatusStyle(selectedTx.status)}`}>
                      {getStatusLabel(selectedTx.status)}
                    </span>
                  </div>
                  {selectedTx.reference_id && (
                    <div className="flex justify-between py-1 border-b border-slate-50">
                      <span className="text-slate-400">Ref ID:</span>
                      <span className="font-mono font-semibold text-slate-700 text-[11px] truncate max-w-[140px]">{selectedTx.reference_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">เวลาที่ทำรายการ:</span>
                    <span className="font-medium text-slate-700 text-[11px]">
                      {new Date(selectedTx.created_at).toLocaleString('th-TH')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/80 rounded-3xl p-5 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                <span className="material-symbols-outlined text-2xl mb-1 text-slate-300">touch_app</span>
                <p>คลิกเลือกรายการเพื่อดูรายละเอียดเชิงลึก</p>
              </div>
            )}

            {/* Regulatory & Security Info */}
            <div className="bg-emerald-50/50 rounded-3xl p-4.5 border border-emerald-100 text-emerald-950 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-700 text-lg shrink-0 mt-0.5">verified</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ข้อมูลการเงินทั้งหมดถูกบันทึกอย่างโปร่งใส ตรวจสอบความถูกต้องได้ย้อนหลัง 90 วัน
              </p>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Transactions;
