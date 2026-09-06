import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../contexts/ModalContext';
import BankBadge from '../components/BankBadge';
import PageWrapper from '../components/PageWrapper';

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
                <span>ถอนเงินเข้าบัญชี</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  ระบบออโต้
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">โอนเงินเข้าบัญชีธนาคารของคุณโดยตรง ปลอดภัย รวดเร็ว</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Section Container */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-36 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ SECTION 1 (Left 4 Cols on PC): Balance & Bank Account ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Balance Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">ยอดเงินที่สามารถถอนได้</p>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-2xl font-bold text-emerald-700">฿</span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-slate-900">
                  {(userProfile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">ถอนขั้นต่ำ {minWithdraw.toLocaleString()} บาท</p>
            </div>

            {/* Bank Details */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">บัญชีรับเงินของคุณ</p>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">ยืนยันแล้ว</span>
              </div>
              <BankBadge
                code={userProfile?.bank_name}
                accountNumber={userProfile?.bank_account_number}
                size="lg"
                className="w-full"
              />
            </div>

            {/* Promo Turnover Warning */}
            {promoStatus && (
              <div className={`rounded-3xl p-5 border ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#d97706' }}>
                    {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'check_circle' : 'warning'}
                  </span>
                  <span className={`font-extrabold text-xs ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'ทำเทิร์นครบแล้ว ถอนได้ทันที' : 'ติดเงื่อนไขโปรโมชั่น'}
                  </span>
                </div>
                <div className="w-full bg-black/10 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${Math.min(100, promoStatus.turnover_required > 0 ? (promoStatus.turnover_completed / promoStatus.turnover_required) * 100 : 0)}%`,
                    background: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#f59e0b'
                  }} />
                </div>
                {promoStatus.turnover_completed < promoStatus.turnover_required && (
                  <p className="text-[11px] text-amber-800 font-medium">แทงอีก ฿{(promoStatus.turnover_required - promoStatus.turnover_completed).toLocaleString()} ถึงจะถอนได้</p>
                )}
              </div>
            )}
          </aside>

          {/* ════ SECTION 2 (Center 5 Cols on PC): Withdrawal Amount & Action ════ */}
          <main className="lg:col-span-8 xl:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <p className="text-slate-800 font-extrabold text-base">ระบุจำนวนเงินที่ต้องการถอน</p>

              <div className="relative bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-black text-emerald-700">฿</span>
                  <input
                    className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black font-mono text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-300"
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                    autoComplete="new-password"
                    name="withdrawal-amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="grid grid-cols-4 gap-2.5 pt-2">
                {['1000', '5000', '10000'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAmount(v)}
                    className="h-11 rounded-xl bg-white border border-slate-200 text-slate-700 font-black text-xs hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50 active:scale-95 transition-all cursor-pointer shadow-2xs"
                  >
                    ฿{Number(v).toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAmount(String(Math.floor(userProfile?.balance || 0)))}
                  className="h-11 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs hover:bg-emerald-100 active:scale-95 transition-all cursor-pointer shadow-2xs"
                >
                  ถอนทั้งหมด
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleWithdrawal}
                  disabled={loading || !amount || parseFloat(amount) < minWithdraw}
                  className="w-full h-14 rounded-2xl flex items-center justify-center gap-2 text-white text-base font-extrabold active:scale-[0.98] transition-all disabled:opacity-50 shadow-md cursor-pointer bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600"
                >
                  <span>ยืนยันการถอนเงิน</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
              </div>
            </div>
          </main>

          {/* ════ SECTION 3 (Right 3 Cols on PC): Rules & Safety Policy ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Daily Limits */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                เงื่อนไขการถอนเงิน
              </h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>ถอนขั้นต่ำต่อครั้ง</span>
                  <span className="font-mono font-bold text-slate-800">฿{minWithdraw.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>ถอนได้สูงสุดต่อวัน</span>
                  <span className="font-mono font-bold text-emerald-700">฿2,000,000</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span>ค่าธรรมเนียมการถอน</span>
                  <span className="font-bold text-emerald-700">ฟรี 0%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>ระยะเวลาโอนเงิน</span>
                  <span className="font-bold text-slate-800">5 - 15 นาที</span>
                </div>
              </div>
            </div>

            {/* Security Guarantee */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl">shield</span>
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-950">ปลอดภัยด้วยระบบ PIN 4 หลัก</h4>
                <p className="text-[11px] text-emerald-700 font-medium">ยืนยันรหัสความปลอดภัยทุกครั้งก่อนถอน</p>
              </div>
            </div>
          </aside>

        </div>
      </div>

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
    </PageWrapper>
  );
};

export default Withdrawal;
