import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import AppHeader from '../components/AppHeader';

const Wallet = () => {
  const { profile, user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
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
        .limit(5);
      setPromotions(data || []);
    };
    fetchPromotions();

    const fetchBanks = async () => {
      const { data } = await supabase.from('banks').select('name, code, image_url').eq('is_active', true);
      setBanks(data || []);
    };
    fetchBanks();
  }, [user]);

  const getTypeThai = (type) => {
    switch (type) {
      case 'DEPOSIT': return 'ฝากเงินผ่านบัญชีธนาคาร';
      case 'WITHDRAW': return 'ถอนเงิน';
      case 'WIN':
      case 'PAYOUT': return 'ถูกรางวัล';
      case 'BET': return 'เดิมพัน';
      case 'BONUS': return 'โบนัส';
      default: return type;
    }
  };

  const isIncome = (type) => ['DEPOSIT', 'WIN', 'PAYOUT', 'BONUS'].includes(type);

  const bankInfo = banks.find(b =>
    b.name === profile?.bank_name || b.code === profile?.bank_name
  );

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="bg-[#f6f8f6] min-h-screen flex justify-center items-start text-slate-900 font-thai">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col relative overflow-hidden">
        <AppHeader />
        <header className="pt-4 pb-4 px-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <div className="flex flex-col">
              <p className="text-xs text-slate-400 font-medium">สวัสดีคุณ 👋</p>
              <h2 className="text-lg font-bold tracking-tight">{profile?.full_name || 'สมาชิก'}</h2>
            </div>
            <div></div>
          </div>

          {/* Smart Card */}
          <div className="w-full glass-card rounded-[2.5rem] p-6 text-white shadow-2xl relative">
            <div className="flex justify-between items-start mb-8">
              <div className="flex flex-col">
                <p className="text-emerald-100/70 text-xs font-medium mb-1">{profile?.bank_account_name || profile?.full_name || 'ไม่ระบุชื่อ'}</p>
                <h3 className="text-xl font-bold tracking-wide">{profile?.bank_name || 'ไม่ระบุธนาคาร'}</h3>
              </div>
              {/* Chip */}
              <div className="w-12 h-9 bg-gradient-to-br from-gold-premium/80 to-yellow-600 rounded-md relative chip-glow border border-white/20">
                <div className="absolute inset-2 border-t border-b border-black/10 flex flex-col justify-between">
                  <div className="w-full h-[1px] bg-black/10"></div>
                  <div className="w-full h-[1px] bg-black/10"></div>
                </div>
                <div className="absolute inset-x-4 inset-y-0 border-l border-r border-black/10"></div>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-emerald-100/60 text-[10px] font-semibold tracking-[0.2em] uppercase mb-1">ยอดเงินคงเหลือ</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-medium text-emerald-200">฿</span>
                <h1 className="text-4xl font-extrabold tracking-tight font-display">
                  {Number(profile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h1>
              </div>
            </div>
            <div className="flex justify-between items-end mt-4">
              <div className="flex items-center gap-2">
                {bankInfo?.image_url ? (
                  <img src={bankInfo.image_url} alt={bankInfo.name} className="w-8 h-8 rounded-full object-cover border border-white/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-sm">account_balance</span>
                  </div>
                )}
                <p className="text-[10px] text-emerald-100/70 font-medium">{profile?.bank_account_number || ''}</p>
              </div>
              <div className="text-right">
                {memberSince && (
                  <p className="text-[10px] text-emerald-100/50 tracking-wide">สมาชิกตั้งแต่ {memberSince}</p>
                )}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 size-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
          </div>
        </header>

        {/* Main Actions */}
        <div className="px-6 grid grid-cols-2 gap-4 my-6">
          <button
            onClick={() => navigate('/deposit')}
            className="glossy-green text-white h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">add_circle</span>
            <span>ฝากเงิน</span>
          </button>
          <button
            onClick={() => navigate('/withdrawal')}
            className="bg-white border-2 border-primary/20 text-primary h-14 rounded-2xl flex items-center justify-center gap-2 font-bold active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">payments</span>
            <span>ถอนเงิน</span>
          </button>
        </div>

        {/* Promotions */}
        <section className="mb-8">
          <div className="px-6 flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg">โปรโมชั่นแนะนำ</h4>
            <button onClick={() => navigate('/promotions')} className="text-primary text-sm font-semibold">ดูทั้งหมด</button>
          </div>
          <div className="flex overflow-x-auto gap-4 px-6 no-scrollbar">
            {promotions.length > 0 ? promotions.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/deposit?promo=${p.id}&amount=${p.min_deposit || 100}`)}
                className="min-w-[280px] bg-slate-50 rounded-2xl p-4 border border-slate-100 cursor-pointer active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-14 rounded-xl bg-white flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                      : <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-bold text-sm truncate">{p.title}</p>
                      {p.badge_text && (
                        <span className="bg-primary text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0">{p.badge_text}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {p.bonus_amount > 0 && (
                    <p className="text-xs font-bold text-primary">+{p.bonus_amount} บาท</p>
                  )}
                  <button className="ml-auto bg-primary text-white text-xs font-extrabold px-4 py-1.5 rounded-full shadow-sm shadow-primary/20">
                    รับโปร
                  </button>
                </div>
              </div>
            )) : (
              <>
                <div className="min-w-[280px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-xl bg-white flex items-center justify-center border border-slate-100">
                      <span className="material-symbols-outlined text-primary text-3xl">redeem</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">โบนัสฝากครั้งแรก</p>
                      <p className="text-xs text-slate-500">รับเพิ่มทันที 10% สูงสุด 500.-</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-[280px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-xl bg-white flex items-center justify-center border border-slate-100">
                      <span className="material-symbols-outlined text-gold-premium text-3xl">stars</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm">ลูกค้า VIP ระดับทอง</p>
                      <p className="text-xs text-slate-500">คืนเงินทุกยอดเสีย 5% ทุกสัปดาห์</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Transaction History */}
        <section className="px-6 mb-32">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg">ประวัติรายการ</h4>
            <Link to="/transactions" className="material-symbols-outlined text-slate-400">tune</Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="py-10 text-center">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((tx) => {
                const income = isIncome(tx.type);
                const iconBg =
                  tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'bg-yellow-100 text-yellow-600' :
                  tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'bg-green-100 text-green-600' :
                  'bg-red-50 text-red-400';
                const icon =
                  tx.type === 'WIN' || tx.type === 'PAYOUT' ? 'military_tech' :
                  tx.type === 'DEPOSIT' || tx.type === 'BONUS' ? 'input' :
                  'output';
                const statusBadge =
                  tx.status === 'COMPLETED' ? 'bg-gold-premium/10 text-gold-premium' :
                  tx.status === 'PENDING' ? 'bg-slate-100 text-slate-400' :
                  'bg-red-50 text-red-500';
                const statusText =
                  tx.status === 'COMPLETED' ? 'สำเร็จ' :
                  tx.status === 'PENDING' ? 'รอดำเนินการ' : 'ปฏิเสธ';
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-50 shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-full flex items-center justify-center ${iconBg.split(' ')[0]}`}>
                        <span className={`material-symbols-outlined ${iconBg.split(' ')[1]}`}>{icon}</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tx.note || getTypeThai(tx.type)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.created_at).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit' })} • {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusBadge}`}>{statusText}</span>
                        </div>
                      </div>
                    </div>
                    <p className={`font-bold font-display ${income ? 'text-primary' : 'text-rose-500'}`}>
                      {income ? '+' : '-'}฿{Math.abs(Number(tx.amount)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 text-sm">ไม่มีประวัติรายการ</div>
            )}
          </div>
        </section>

        <BottomNav />

        {/* Decorative bg */}
        <div className="absolute -top-24 -right-24 size-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute top-1/2 -left-24 size-48 bg-gold-premium/5 rounded-full blur-3xl -z-10"></div>
      </div>
    </div>
  );
};

export default Wallet;
