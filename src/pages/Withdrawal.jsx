import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../contexts/ModalContext';
import BankBadge from '../components/BankBadge';

const Withdrawal = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useModal();
  // ใช้ profile data ในการแสดงผลและตรวจสอบ
  const userProfile = profile;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(300);
  const [promoStatus, setPromoStatus] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const navigate = useNavigate();

  const pinToHash = async (pinValue) => {
    const phone = userProfile?.phone;
    if (!phone) return null;
    const raw = new TextEncoder().encode(pinValue + phone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  useEffect(() => {
    const fetchMin = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'min_withdraw')
        .single();
      if (data) setMinWithdraw(Number(data.value));
    };
    fetchMin();

    if (profile) {
      const fetchPromoStatus = async () => {
        const { data } = await supabase
          .from('wallets')
          .select('active_promo_id, turnover_required, turnover_completed, promo_max_withdrawal, promo_allowed_game')
          .eq('user_id', profile.id)
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
    }
  }, [profile]);

  const handleWithdrawal = () => {
    const withdrawAmount = parseFloat(amount);
    if (!amount || withdrawAmount < minWithdraw) {
      showError(
        'จำนวนเงินไม่ถูกต้อง',
        `กรุณาระบุจำนวนเงินที่ต้องการถอน (ขั้นต่ำ ${minWithdraw.toLocaleString()} บาท)`
      );
      return;
    }
    
    // ตรวจสอบยอดเงิน
    if (withdrawAmount > (userProfile?.balance || 0)) {
      showError('ยอดเงินไม่เพียงพอ', `ยอดเงินคงเหลือของคุณ: ฿${(userProfile?.balance || 0).toLocaleString()}`);
      return;
    }
    
    setPendingAmount(withdrawAmount);
    setPin('');
    setPinError('');
    setShowPinModal(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (pin.length !== 4) {
      setPinError('กรุณากรอก PIN 4 หลัก');
      return;
    }
    setLoading(true);
    setPinError('');
    try {
      const hash = await pinToHash(pin);
      const { data, error } = await supabase.rpc('request_withdrawal_securely', {
        p_amount: pendingAmount,
        p_pin_hash: hash
      });

      if (error) throw error;

      if (data.success) {
        setShowPinModal(false);
        await refreshProfile();
        showSuccess(
          'ส่งคำขอถอนเงินสำเร็จ!',
          `รอการอนุมัติประมาณ 10-30 นาที\nยอดถอน: ฿${pendingAmount?.toLocaleString()}`,
          () => navigate('/withdrawal-confirm', { state: { amount: pendingAmount, bankName: userProfile?.bank_name } })
        );
      } else {
        if (data.error_code === 'WRONG_PIN') {
          setPinError('รหัส PIN ไม่ถูกต้อง');
          setPin('');
        } else if (data.error_code === 'NO_PIN') {
          setShowPinModal(false);
          showError('ยังไม่ได้ตั้งค่า PIN', 'กรุณาตั้งค่า PIN ก่อนถอนเงิน', () => navigate('/change-password'));
        } else {
          showError('ถอนเงินไม่สำเร็จ', data.message || 'กรุณาลองใหม่');
        }
      }
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      showError('เกิดข้อผิดพลาด', 'ไม่สามารถถอนเงินได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const getBankColor = (bankName) => {
    const name = bankName?.toUpperCase() || '';
    if (name.includes('SCB') || name.includes('ไทยพาณิชย์')) return 'bg-[#4e2e7f] text-white';
    if (name.includes('KBANK') || name.includes('กสิกร')) return 'bg-[#138036] text-white';
    if (name.includes('BBL') || name.includes('กรุงเทพ')) return 'bg-[#1e4598] text-white';
    if (name.includes('KTB') || name.includes('กรุงไทย')) return 'bg-[#00a1e0] text-white';
    if (name.includes('BAY') || name.includes('กรุงศรี')) return 'bg-[#fec43b] text-[#543b17]';
    return 'bg-purple-600 text-white';
  };

  const bankShortName = (bankName) => {
    const name = bankName?.toUpperCase() || '';
    if (name.includes('SCB')) return 'SCB';
    if (name.includes('KBANK')) return 'KBANK';
    if (name.includes('BBL')) return 'BBL';
    if (name.includes('KTB')) return 'KTB';
    if (name.includes('BAY')) return 'BAY';
    return bankName?.substring(0, 3)?.toUpperCase() || 'BNK';
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 pt-12 pb-4 flex items-center justify-between border-b border-slate-100">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 text-[#1a7e2a]"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ถอนเงิน</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pt-6 pb-36">
        {/* Promo Turnover Warning */}
        {promoStatus && (
          <div className={`mb-4 rounded-2xl p-4 border ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-lg" style={{ color: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#d97706' }}>
                {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'check_circle' : 'warning'}
              </span>
              <span className={`font-bold text-sm ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'text-green-800' : 'text-amber-800'}`}>
                {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'ทำเทิร์นครบแล้ว ถอนได้' : 'ติดเงื่อนไขโปรโมชั่น'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-2">โปร: {promoStatus.promo_title}</p>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>เทิร์นโอเวอร์</span>
              <span className="font-bold">{Number(promoStatus.turnover_completed).toLocaleString()} / {Number(promoStatus.turnover_required).toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
              <div className="h-2 rounded-full transition-all" style={{
                width: `${Math.min(100, promoStatus.turnover_required > 0 ? (promoStatus.turnover_completed / promoStatus.turnover_required) * 100 : 0)}%`,
                background: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#f59e0b'
              }} />
            </div>
            {promoStatus.turnover_completed < promoStatus.turnover_required && (
              <p className="text-xs text-amber-700">แทงอีก ฿{(promoStatus.turnover_required - promoStatus.turnover_completed).toLocaleString()} ถึงจะถอนได้</p>
            )}
            {promoStatus.promo_max_withdrawal > 0 && (
              <p className="text-xs text-slate-500 mt-1">ถอนสูงสุด ฿{Number(promoStatus.promo_max_withdrawal).toLocaleString()}</p>
            )}
          </div>
        )}

        {/* Premium Badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-primary text-xs font-extrabold uppercase tracking-widest">TH-LOTTO Premium</span>
          </div>
        </div>

        {/* Balance Card */}
        <section className="mb-6">
          <div className="relative overflow-hidden bg-white rounded-[1.75rem] p-7 text-center border border-slate-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
              <span className="material-symbols-outlined text-9xl">account_balance_wallet</span>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-2">ยอดเงินที่ถอนได้</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl font-extrabold text-primary">฿</span>
              <p className="text-5xl font-extrabold text-primary tracking-tight">
                {(userProfile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </section>

        {/* Bank Details */}
        <section className="mb-6">
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest px-1 mb-3">บัญชีรับเงินของคุณ</p>
          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100">
            <BankBadge
              code={userProfile?.bank_name}
              accountNumber={userProfile?.bank_account_number}
              size="lg"
              className="flex-1"
            />
            <div className="text-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
        </section>

        {/* Amount Entry */}
        <section className="mb-5">
          <p className="text-center text-slate-900 font-extrabold text-base mb-4">ระบุจำนวนเงินที่ต้องการถอน</p>
          <div className="relative bg-slate-50 rounded-2xl border border-slate-100 focus-within:border-primary/30 transition-all overflow-hidden">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-extrabold text-slate-300">฿</div>
            <input
              className="w-full bg-transparent pl-14 pr-6 py-5 text-4xl font-extrabold text-slate-900 border-none focus:ring-0 outline-none text-center"
              placeholder="0.00"
              type="text"
              inputMode="decimal"
              autoComplete="new-password"
              name="withdrawal-amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            />
          </div>
          <p className="text-center mt-2 text-slate-400 text-xs font-medium">ถอนขั้นต่ำ {minWithdraw.toLocaleString()} บาท</p>
        </section>

        {/* Quick Select */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['1000', '5000', '10000'].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-slate-600 bg-white hover:border-primary hover:text-primary active:scale-95 transition-all"
            >
              {Number(v).toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => setAmount((userProfile?.balance || 0).toString())}
            className="px-5 py-2.5 rounded-full border border-primary/20 text-sm font-bold text-primary bg-primary/5 active:scale-95 transition-all"
          >
            ทั้งหมด
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white/95 backdrop-blur-lg border-t border-slate-100">
        <button
          onClick={handleWithdrawal}
          disabled={loading || !amount || parseFloat(amount) < minWithdraw}
          className="w-full h-16 rounded-full flex items-center justify-center gap-3 text-white text-lg font-extrabold active:scale-[0.98] transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #156321 100%)' }}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="material-symbols-outlined">payments</span>
              ยืนยันการถอนเงิน
            </>
          )}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1.5 opacity-40">
          <span className="material-symbols-outlined text-[12px]">lock</span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-900">Secure SSL 256-bit Encryption</span>
        </div>
      </footer>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">lock</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">กรอก PIN เพื่อยืนยัน</h3>
              <p className="text-sm text-slate-500 mt-1">ถอนเงิน ฿{pendingAmount?.toLocaleString()}</p>
            </div>

            {/* PIN Input */}
            <div className="mb-4">
              <div className="flex justify-center gap-3 mb-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-extrabold transition-all ${
                      pin.length === i
                        ? 'border-primary bg-primary/5'
                        : pin.length > i
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {pin.length > i ? (
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                    ) : null}
                  </div>
                ))}
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                  setPinError('');
                }}
                className="opacity-0 absolute w-0 h-0"
                onKeyDown={(e) => { if (e.key === 'Enter' && pin.length === 4) handleConfirmWithdrawal(); }}
              />
              {/* Tap area to focus input */}
              <div
                className="text-center"
                onClick={(e) => {
                  const input = e.currentTarget.parentElement.querySelector('input');
                  if (input) input.focus();
                }}
              >
                {pinError ? (
                  <p className="text-red-500 text-xs font-bold flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {pinError}
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs font-medium">แตะเพื่อกรอก PIN 4 หลัก</p>
                )}
              </div>
            </div>

            {/* Amount Summary */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">ยอดถอน</span>
                <span className="text-xl font-extrabold text-primary">฿{pendingAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPinModal(false)}
                disabled={loading}
                className="flex-1 h-14 rounded-full flex items-center justify-center text-slate-600 text-base font-bold border-2 border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmWithdrawal}
                disabled={loading || pin.length !== 4}
                className="flex-1 h-14 rounded-full flex items-center justify-center gap-2 text-white text-base font-extrabold active:scale-[0.98] transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #156321 100%)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    ยืนยัน
                  </>
                )}
              </button>
            </div>

            <button
              onClick={() => { setShowPinModal(false); navigate('/change-password'); }}
              className="w-full mt-3 text-center text-xs text-slate-400 font-bold hover:text-primary transition-colors"
            >
              ลืม PIN? เปลี่ยน PIN ใหม่
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;
