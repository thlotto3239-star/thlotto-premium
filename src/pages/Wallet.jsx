import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import AppHeader from '../components/AppHeader';

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
        setPromoStatus({ ...data, promo_title: promo?.title || 'โปรโมชั่น' });
      }
    };
    fetchPromoStatus();
  }, [user]);

  const getTypeThai = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'ฝากเงินผ่านบัญชีธนาคาร';
      case 'WITHDRAW': return 'ถอนเงิน';
      case 'WIN':
      case 'PAYOUT': return 'ถูกรางวัล';
      case 'BET': return 'เดิมพัน';
      case 'BONUS': return 'โบนัส';
      case 'COMMISSION': return 'คอมมิชชั่นแนะนำเพื่อน';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS', 'COMMISSION'].includes(type);

  const bankInfo = banks.find(b =>
    b.name === profile?.bank_name || b.code === profile?.bank_name
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <PageWrapper>
      <AppHeader />

      {/* Page Header / Breadcrumb */}
      <div className="bg-white/80 border-b border-slate-100 px-4 sm:px-6 lg:px-8 py-3.5 sticky top-[72px] lg:top-[34px] z-40 backdrop-blur-md">
        <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">chevron_left</span>
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <span>กระเป๋าเงิน & ธุรกรรม</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  {profile?.username || profile?.full_name || 'สมาชิก'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">จัดการยอดเงิน ฝาก-ถอนออโต้ 24 ชั่วโมง</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/deposit')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              ฝากเงิน
            </button>
            <button
              onClick={() => navigate('/withdrawal')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-extrabold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              ถอนเงิน
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Section Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════════════════════════════════════════════════════════════
              SECTION 1 (Left 4 Cols on PC): Smart Card & Fast Actions
              ════════════════════════════════════════════════════════════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-5">
            {/* The Smart Card */}
            <div className="w-full glass-card rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, rgb(22, 68, 30) 0%, rgb(13, 121, 4) 100%)' }}>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex flex-col">
                  <p className="text-emerald-100/80 text-xs font-medium mb-1">{profile?.bank_account_name || profile?.full_name || 'ไม่ระบุชื่อ'}</p>
                  <h3 className="text-xl font-black tracking-wide">{profile?.bank_name || 'ไม่ระบุธนาคาร'}</h3>
                </div>
                {/* Chip */}
                <div className="w-12 h-9 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-md relative border border-white/20 shadow-md">
                  <div className="absolute inset-2 border-t border-b border-black/10 flex flex-col justify-between">
                    <div className="w-full h-[1px] bg-black/10"></div>
                    <div className="w-full h-[1px] bg-black/10"></div>
                  </div>
                  <div className="absolute inset-x-4 inset-y-0 border-l border-r border-black/10"></div>
                </div>
              </div>

              <div className="mb-6 relative z-10">
                <p className="text-emerald-100/70 text-xs font-extrabold tracking-[0.2em] uppercase mb-1">ยอดเงินคงเหลือ</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-medium text-emerald-200">฿</span>
                  <h1 className="text-4xl sm:text-5xl font-black tracking-tight font-mono">
                    {Number(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>
              </div>

              <div className="flex justify-between items-end pt-3 border-t border-white/15 relative z-10">
                <div className="flex items-center gap-2.5">
                  {bankInfo?.image_url ? (
                    <img src={bankInfo.image_url} alt={bankInfo.name} className="size-8 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="size-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm">account_balance</span>
                    </div>
                  )}
                  <p className="text-xs text-emerald-100/80 font-mono font-bold tracking-wider">{profile?.bank_account_number || ''}</p>
                </div>
                <div className="text-right">
                  {memberSince && (
                    <p className="text-[11px] text-emerald-100/60 font-medium">สมาชิกตั้งแต่ {memberSince}</p>
                  )}
                </div>
              </div>

              <div className="absolute -bottom-10 -right-10 size-36 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Fast Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate('/deposit')}
                className="py-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">add_circle</span>
                <span>ฝากเงิน</span>
              </button>
              <button
                onClick={() => navigate('/withdrawal')}
                className="py-4 rounded-2xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 font-black text-sm flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl text-emerald-700">payments</span>
                <span>ถอนเงิน</span>
              </button>
            </div>

            {/* Banking Security Info */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">ระบบถอนเงินปลอดภัย 100%</h4>
                  <p className="text-[11px] text-slate-400">โอนเข้าบัญชีที่ผูกไว้เท่านั้น ป้องกันมิจฉาชีพ</p>
                </div>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">บัญชีธนาคาร</span>
                <Link to="/bank-account" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                  ตรวจสอบข้อมูล <span className="material-symbols-outlined text-xs">chevron_right</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* ════════════════════════════════════════════════════════════
              SECTION 2 (Center 5 Cols on PC): Turnover & Promotions
              ════════════════════════════════════════════════════════════ */}
          <main className="lg:col-span-8 xl:col-span-5 space-y-5">
            {/* Active Promo Turnover Progress Card */}
            {promoStatus ? (
              <div className="bg-white border border-amber-200/80 rounded-3xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>redeem</span>
                    <h3 className="font-extrabold text-sm text-slate-900">โปรโมชั่น: {promoStatus.promo_title}</h3>
                  </div>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-semibold">
                    <span>ความคืบหน้ายอดเทิร์นโอเวอร์</span>
                    <span className="font-mono font-bold text-slate-900">
                      ฿{Number(promoStatus.turnover_completed).toLocaleString()} / ฿{Number(promoStatus.turnover_required).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, promoStatus.turnover_required > 0 ? (promoStatus.turnover_completed / promoStatus.turnover_required) * 100 : 0)}%`,
                        background: promoStatus.turnover_completed >= promoStatus.turnover_required
                          ? 'linear-gradient(to right, #16a34a, #22c55e)'
                          : 'linear-gradient(to right, #f59e0b, #d97706)'
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-xs pt-2 border-t border-slate-100">
                  {promoStatus.turnover_completed < promoStatus.turnover_required ? (
                    <span className="text-amber-700 font-bold flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-amber-500"></span>
                      แทงอีก ฿{(promoStatus.turnover_required - promoStatus.turnover_completed).toLocaleString()} เพื่อปลดล็อคการถอน
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-black flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500"></span>
                      ทำเทิร์นครบแล้ว สามารถถอนได้ทันที
                    </span>
                  )}
                  {promoStatus.promo_max_withdrawal > 0 && (
                    <span className="text-slate-400">ถอนได้สูงสุด ฿{Number(promoStatus.promo_max_withdrawal).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ) : null}

            {/* Recommended Promotions Grid */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-lg">loyalty</span>
                  <h3 className="font-extrabold text-sm text-slate-900">โปรโมชั่นและโบนัสแนะนำ</h3>
                </div>
                <Link to="/promotions" className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  ดูทั้งหมด <span className="material-symbols-outlined text-xs">chevron_right</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {promotions.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/deposit?promo=${p.promo_code || p.id}&promoName=${encodeURIComponent(p.title)}&promoId=${p.id}&amount=${p.min_deposit || 100}`)}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-100 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="flex items-start gap-3 mb-2.5">
                      <div className="size-11 rounded-xl bg-white flex items-center justify-center border border-slate-200/60 overflow-hidden shrink-0 shadow-2xs">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-emerald-700 text-2xl">redeem</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 transition-colors truncate">{p.title}</p>
                          {p.badge_text && (
                            <span className="bg-emerald-700 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">{p.badge_text}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{p.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/40">
                      {p.bonus_amount > 0 ? (
                        <span className="text-xs font-black text-emerald-700">+{p.bonus_amount} บาท</span>
                      ) : p.min_deposit > 0 ? (
                        <span className="text-[11px] text-slate-500 font-semibold">ฝากขั้นต่ำ {p.min_deposit}฿</span>
                      ) : <span />}
                      <span className="text-xs font-extrabold text-white bg-emerald-800 px-3 py-1 rounded-xl group-hover:bg-emerald-700 transition-colors">
                        รับโปร
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile / Tablet Transaction List fallback */}
            <div className="xl:hidden bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-extrabold text-sm text-slate-900">ประวัติรายการล่าสุด</h4>
                <Link to="/transactions" className="text-xs font-bold text-emerald-700 hover:underline">ดูประวัติทั้งหมด</Link>
              </div>
              <div className="space-y-2.5">
                {transactions.slice(0, 5).map((tx) => {
                  const income = isIncome(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="font-bold text-xs text-slate-800">{tx.note || getTypeThai(tx.type)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(tx.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                      <p className={`font-mono font-bold text-xs ${income ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {income ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>

          {/* ════════════════════════════════════════════════════════════
              SECTION 3 (Right 3 Cols on PC): Live Transactions Ledger
              ════════════════════════════════════════════════════════════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-5">
            {/* Transaction History Ledger Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-slate-500 text-lg">receipt_long</span>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700">ประวัติรายการ (10 ล่าสุด)</h3>
                </div>
                <Link to="/transactions" className="text-xs font-bold text-emerald-700 hover:underline">
                  ดูทั้งหมด
                </Link>
              </div>

              <div className="space-y-2.5 max-h-[580px] overflow-y-auto no-scrollbar">
                {loading ? (
                  <div className="py-12 text-center">
                    <div className="size-8 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : transactions.length > 0 ? (
                  transactions.map((tx) => {
                    const income = isIncome(tx.type);
                    const icon =
                      tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'military_tech' :
                      tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'input' : 'output';
                    const iconBg =
                      tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'bg-amber-100 text-amber-700' :
                      tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500';
                    const isDone = tx.status === 'COMPLETED' || tx.status === 'SUCCESS';
                    return (
                      <div key={tx.id} className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 transition-colors flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                            <span className="material-symbols-outlined text-base">{icon}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate">{tx.note || getTypeThai(tx.type)}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(tx.created_at).toLocaleDateString('th-TH-u-ca-buddhist', { day: '2-digit', month: 'short' })} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-mono font-extrabold text-xs ${income ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {income ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : tx.status === 'PENDING' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isDone ? 'สำเร็จ' : tx.status === 'PENDING' ? 'รอ' : 'ยกเลิก'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">ยังไม่มีประวัติรายการ</div>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default Wallet;
