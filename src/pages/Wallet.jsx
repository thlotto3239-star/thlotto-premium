import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';

const Wallet = () => {
  const { profile, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promoStatus, setPromoStatus] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();

    const fetchPromotions = async () => {
      const { data } = await supabase
        .from('promotions')
        .select('id, title, description, image_url, min_deposit, bonus_amount, badge_text')
        .eq('is_active', true)
        .order('id', { ascending: false })
        .limit(6);
      setPromotions(data || []);
    };
    fetchPromotions();

    const fetchBanks = async () => {
      const { data } = await supabase.from('banks').select('name, code, image_url').eq('is_active', true);
      setBanks(data || []);
    };
    fetchBanks();

    const fetchPromoStatus = async () => {
      const { data } = await supabase
        .from('wallets')
        .select('active_promo_id, turnover_required, turnover_completed, promo_max_withdrawal, promo_allowed_game')
        .eq('user_id', user.id)
        .single();
      if (data?.active_promo_id) {
        const { data: promo } = await supabase
          .from('promotions')
          .select('title')
          .eq('id', data.active_promo_id)
          .single();
        setPromoStatus({
          ...data,
          promo_title: promo?.title || 'โปรโมชั่นพิเศษ',
        });
      }
    };
    fetchPromoStatus();
  }, [user]);

  const getTypeThai = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'ฝากเงิน';
      case 'WITHDRAW': return 'ถอนเงิน';
      case 'BET': return 'แทงหวย';
      case 'WIN': return 'ถูกรางวัล';
      case 'PAYOUT': return 'จ่ายเงินรางวัล';
      case 'BONUS': return 'โบนัสโปรโมชั่น';
      case 'COMMISSION': return 'คอมมิชชั่นแนะนำเพื่อน';
      case 'ADMIN_CREDIT': return 'เติมเงินโดยแอดมิน';
      case 'ADMIN_DEBIT': return 'หักเงินโดยแอดมิน';
      case 'REFUND': return 'คืนเงิน';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION', 'ADMIN_CREDIT', 'REFUND'].includes(type);

  const bankInfo = banks.find(b =>
    b.name === profile?.bank_name || b.code === profile?.bank_name
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <PageWrapper>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">กระเป๋าเงิน (Wallet)</h1>
              <p className="text-xs text-slate-400 hidden sm:block">จัดการยอดเงิน ฝาก-ถอน และประวัติธุรกรรม</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/transactions')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">receipt_long</span>
              <span className="hidden sm:inline">ดูรายการทั้งหมด</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Wallet Card & Financial Actions ════ */}
          <div className="lg:col-span-5 space-y-6">

            {/* Smart Holographic Wallet Card */}
            <div className="w-full bg-gradient-to-br from-brand-900 via-emerald-950 to-slate-950 rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden border border-emerald-800/40">
              <div className="absolute -top-12 -right-12 size-44 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 size-44 rounded-full bg-black/40 blur-2xl pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start mb-6">
                <div>
                  <p className="text-emerald-300/80 text-xs font-bold uppercase tracking-wider">
                    {profile?.bank_account_name || profile?.full_name || 'สมาชิก TH-LOTTO'}
                  </p>
                  <h3 className="text-lg font-black tracking-tight mt-0.5">{profile?.bank_name || 'TH-LOTTO WALLET'}</h3>
                </div>
                {/* Chip pattern */}
                <div className="w-11 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-600 p-1 border border-white/30 shadow-xs flex flex-col justify-between">
                  <div className="w-full h-px bg-black/20" />
                  <div className="w-full h-px bg-black/20" />
                </div>
              </div>

              <div className="relative z-10 mb-6">
                <p className="text-emerald-200/70 text-xs font-bold tracking-[0.2em] uppercase mb-1">ยอดเงินคงเหลือสุทธิ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">฿</span>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-mono">
                    {Number(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>
              </div>

              <div className="relative z-10 flex justify-between items-end pt-2 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  {bankInfo?.image_url ? (
                    <img src={bankInfo.image_url} alt={bankInfo.name} className="size-6 rounded-full object-cover border border-white/30" />
                  ) : (
                    <span className="material-symbols-outlined text-sm text-emerald-400">account_balance</span>
                  )}
                  <span className="font-mono text-emerald-200/90 font-medium">
                    {profile?.bank_account_number || 'ยังไม่ได้ผูกบัญชี'}
                  </span>
                </div>
                {memberSince && (
                  <span className="text-emerald-200/50">สมาชิกตั้งแต่ {memberSince}</span>
                )}
              </div>
            </div>

            {/* Quick Action Buttons (Deposit & Withdrawal) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/deposit')}
                className="py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">add_circle</span>
                <span>ฝากเงิน</span>
              </button>
              <button
                onClick={() => navigate('/withdrawal')}
                className="py-4 rounded-2xl bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-800 font-black text-sm flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-brand-600">payments</span>
                <span>ถอนเงิน</span>
              </button>
            </div>

            {/* Active Promo Turnover Card (if active) */}
            {promoStatus && (
              <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-amber-900">
                  <span className="material-symbols-outlined text-lg text-amber-600">redeem</span>
                  <span className="font-extrabold text-sm truncate">โปรโมชั่นที่ใช้อยู่: {promoStatus.promo_title}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-amber-800 font-bold mb-1.5">
                    <span>ความคืบหน้าเทิร์นโอเวอร์</span>
                    <span className="font-mono">
                      {Number(promoStatus.turnover_completed).toLocaleString()} / {Number(promoStatus.turnover_required).toLocaleString()} บ.
                    </span>
                  </div>
                  <div className="w-full bg-amber-200/80 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, promoStatus.turnover_required > 0 ? (promoStatus.turnover_completed / promoStatus.turnover_required) * 100 : 0)}%`,
                        background: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#f59e0b'
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs text-amber-800 font-medium">
                  {promoStatus.turnover_completed < promoStatus.turnover_required ? (
                    <span>ต้องการยอดเดิมพันอีก ฿{(promoStatus.turnover_required - promoStatus.turnover_completed).toLocaleString()} จึงจะถอนเงินได้</span>
                  ) : (
                    <span className="text-emerald-700 font-bold">✅ ครบเงื่อนไขเทิร์นโอเวอร์แล้ว สามารถทำรายการถอนเงินได้ทันที</span>
                  )}
                </div>
              </div>
            )}

            {/* Bank Linking Info Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">account_balance</span>
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">{bankInfo?.name || profile?.bank_name || 'บัญชีธนาคาร'}</p>
                  <p className="text-xs text-slate-400 font-mono">{profile?.bank_account_number || 'ยังไม่ได้ผูกบัญชี'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/bank-account')}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
              >
                ดูรายละเอียด
              </button>
            </div>

          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Recent Transactions & Promo Offers ════ */}
          <div className="lg:col-span-7 space-y-6">

            {/* Recent Transactions Desk */}
            <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-900 text-base">ประวัติธุรกรรมล่าสุด</h3>
                  <p className="text-xs text-slate-400 mt-0.5">รายการฝาก ถอน และเงินรางวัล 10 รายการล่าสุด</p>
                </div>
                <Link
                  to="/transactions"
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
                >
                  <span>ประวัติทั้งหมด</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="py-16 text-center">
                    <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-xs text-slate-400 mt-3 font-bold">กำลังดึงข้อมูลธุรกรรม...</p>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const income = isIncome(tx.type);
                    const iconBg =
                      tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      'bg-rose-50 text-rose-600 border-rose-100';
                    const icon =
                      tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'emoji_events' :
                      tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'arrow_downward' :
                      'arrow_upward';
                    const isDone = tx.status === 'COMPLETED' || tx.status === 'SUCCESS';
                    const statusBadge =
                      isDone ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      tx.status === 'PENDING' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                      'bg-rose-50 text-rose-600 border-rose-100';
                    const statusText =
                      isDone ? 'สำเร็จ' :
                      tx.status === 'PENDING' ? 'รอดำเนินการ' : 'ปฏิเสธ';

                    return (
                      <div key={tx.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`size-11 rounded-2xl flex items-center justify-center shrink-0 border ${iconBg}`}>
                            <span className="material-symbols-outlined text-lg">{icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 text-sm truncate">
                              {tx.note || getTypeThai(tx.type)}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">
                                {new Date(tx.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${statusBadge}`}>
                                {statusText}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className={`font-mono font-black text-base sm:text-lg shrink-0 ml-3 ${income ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {income ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <span className="material-symbols-outlined text-4xl text-slate-300">receipt</span>
                    <p className="text-sm font-bold">ยังไม่มีประวัติการทำรายการ</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Promotions Section */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-black text-slate-900 text-base">โปรโมชั่นและสิทธิพิเศษ</h3>
                  <p className="text-xs text-slate-400">เพิ่มยอดฝากรับโบนัสพิเศษทันที</p>
                </div>
                <Link to="/promotions" className="text-xs font-bold text-brand-600 hover:text-brand-700">
                  ดูทั้งหมด
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {promotions.slice(0, 2).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/deposit?promo=${p.promo_code || p.id}&promoName=${encodeURIComponent(p.title)}&promoId=${p.id}&amount=${p.min_deposit || 100}`)}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer flex items-center gap-3.5 group"
                  >
                    <div className="size-14 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="size-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <span className="material-symbols-outlined text-brand-600 text-2xl">redeem</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm truncate">{p.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{p.description}</p>
                      {p.bonus_amount > 0 && (
                        <p className="text-xs font-black text-brand-600 mt-1">โบนัส +฿{p.bonus_amount}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default Wallet;
