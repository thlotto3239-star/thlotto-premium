import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { useModal } from '../contexts/ModalContext';
import BankBadge from '../components/BankBadge';

const Withdrawal = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useModal();
  // ใช้ profile data ในการแสดงผลและตรวจสอบ
  const userProfile = profile;
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(100);
  const [withdrawEnabled, setWithdrawEnabled] = useState(true);
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
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['min_withdraw', 'withdraw_enabled']);
      if (data) {
        data.forEach(row => {
          if (row.key === 'min_withdraw') setMinWithdraw(Number(row.value));
          if (row.key === 'withdraw_enabled') {
            setWithdrawEnabled(String(row.value).toLowerCase() !== 'false');
          }
        });
      }
    };
    fetchSettings();

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
    if (!withdrawEnabled) {
      showError('ระบบปิดรับถอนเงินชั่วคราว', 'ขณะนี้ระบบปิดรับคำขอถอนเงินชั่วคราวเพื่อปรับปรุงระบบ');
      return;
    }

    if (!userProfile?.bank_name || !userProfile?.bank_account_number) {
      showError(
        'ยังไม่ได้เพิ่มบัญชีธนาคาร',
        'กรุณาเพิ่มบัญชีธนาคารก่อนทำรายการถอนเงิน',
        () => navigate('/bank-account')
      );
      return;
    }

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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100">
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-50 text-[#1a7e2a] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ถอนเงิน</h1>
          <div className="w-11"></div>
        </div>
      </header>

      {/* Main Container — Desktop 2-Column Split Console */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-36 lg:pb-12 space-y-6">
        {/* Onboarding Notice if Profile Incomplete */}
        {userProfile && (!userProfile.phone || !userProfile.bank_account_number) && (
          <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                <span className="material-symbols-outlined text-xl">warning</span>
              </div>
              <div>
                <p className="text-sm font-extrabold text-amber-900">กรุณาตั้งค่าเบอร์โทร บัญชีธนาคาร และรหัส PIN</p>
                <p className="text-xs text-amber-700 font-medium">เพื่อความปลอดภัยและเพื่อเปิดใช้งานระบบถอนเงิน</p>
              </div>
            </div>
            <Link
              to="/edit-profile"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
            >
              ตั้งค่าตอนนี้
            </Link>
          </div>
        )}

        {/* Desktop 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ════ LEFT COLUMN (5 cols on PC): Balance, Bank Account & Promo Status ════ */}
          <div className="lg:col-span-5 space-y-5">
            {/* Balance Card */}
            <div className="relative overflow-hidden bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">ยอดเงินที่ถอนได้</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  พร้อมถอน
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-2xl font-black text-brand-600">฿</span>
                <p className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900">
                  {(userProfile?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Receiving Bank Details */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">บัญชีรับเงินของคุณ</span>
              <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <BankBadge
                  code={userProfile?.bank_name}
                  accountNumber={userProfile?.bank_account_number}
                  size="lg"
                  className="flex-1"
                />
                <div className="text-brand-600">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                </div>
              </div>
            </div>

            {/* Promo Turnover Warning */}
            {promoStatus && (
              <div className={`rounded-3xl p-5 border shadow-xs ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-lg" style={{ color: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#d97706' }}>
                    {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'check_circle' : 'warning'}
                  </span>
                  <span className={`font-black text-xs ${promoStatus.turnover_completed >= promoStatus.turnover_required ? 'text-emerald-800' : 'text-amber-800'}`}>
                    {promoStatus.turnover_completed >= promoStatus.turnover_required ? 'ทำเทิร์นครบแล้ว ถอนได้' : 'ติดเงื่อนไขโปรโมชั่น'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-700 mb-2">โปร: {promoStatus.promo_title}</p>
                <div className="flex justify-between text-xs text-slate-500 mb-1 font-mono font-medium">
                  <span>เทิร์นโอเวอร์</span>
                  <span className="font-bold text-slate-800">{Number(promoStatus.turnover_completed).toLocaleString()} / {Number(promoStatus.turnover_required).toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200/70 rounded-full h-2 mb-2 overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{
                    width: `${Math.min(100, promoStatus.turnover_required > 0 ? (promoStatus.turnover_completed / promoStatus.turnover_required) * 100 : 0)}%`,
                    background: promoStatus.turnover_completed >= promoStatus.turnover_required ? '#16a34a' : '#f59e0b'
                  }} />
                </div>
                {promoStatus.turnover_completed < promoStatus.turnover_required && (
                  <p className="text-xs text-amber-700 font-medium">แทงอีก ฿{(promoStatus.turnover_required - promoStatus.turnover_completed).toLocaleString()} ถึงจะถอนได้</p>
                )}
                {promoStatus.promo_max_withdrawal > 0 && (
                  <p className="text-xs text-slate-500 mt-1">ถอนสูงสุด ฿{Number(promoStatus.promo_max_withdrawal).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>

          {/* ════ RIGHT COLUMN (7 cols on PC): Amount Entry, Quick Select & PC Action Button ════ */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
            
            {!withdrawEnabled && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800 text-xs font-bold">
                <span className="material-symbols-outlined text-amber-600 text-lg">error</span>
                <span>ระบบปิดรับถอนเงินชั่วคราว อยู่ระหว่างการปรับปรุงระบบการเงิน</span>
              </div>
            )}

            {/* Amount Entry */}
            <div>
              <label className="block text-center text-slate-900 font-black text-base sm:text-lg mb-4">
                ระบุจำนวนเงินที่ต้องการถอน
              </label>
              <div className="relative bg-slate-50 rounded-3xl p-6 border border-slate-200 focus-within:border-brand-500 focus-within:bg-white transition-all">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black text-brand-600">฿</span>
                  <input
                    className="w-full bg-transparent text-center text-4xl sm:text-5xl font-black font-mono text-slate-900 border-none focus:ring-0 outline-none placeholder:text-slate-300"
                    placeholder="0.00"
                    type="text"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </div>
              </div>
            </div>

            {/* Quick Chips */}
            <div>
              <p className="text-xs font-bold text-slate-400 mb-3 text-center sm:text-left">เลือกจำนวนเงินด่วน</p>
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {['1000', '5000', '10000'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="flex h-11 sm:h-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-700 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    +{Number(v).toLocaleString()}
                  </button>
                ))}
                <button
                  onClick={() => setAmount((userProfile?.balance || 0).toString())}
                  className="flex h-11 sm:h-12 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-700 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer hover:bg-brand-100"
                >
                  ทั้งหมด
                </button>
              </div>
            </div>

            {/* Minimum Info */}
            <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
              <span className="material-symbols-outlined text-sm">info</span>
              <span>ถอนขั้นต่ำ {minWithdraw.toLocaleString()} บาท</span>
            </div>

            {/* Desktop Direct Action Button (Inside card on PC) */}
            <div className="hidden lg:block pt-4 border-t border-slate-100">
              <button
                onClick={handleWithdrawal}
                disabled={loading || !withdrawEnabled || !amount || parseFloat(amount) < minWithdraw}
                className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white text-base font-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer bg-brand-600 hover:bg-brand-700 active:scale-[0.99]"
              >
                {loading ? (
                  <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl">payments</span>
                    <span>ยืนยันการถอนเงิน</span>
                  </>
                )}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 opacity-40">
                <span className="material-symbols-outlined text-[12px]">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Secure SSL 256-bit Encryption & PIN Protection</span>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* Mobile Fixed Footer (Hidden on PC) */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-slate-100 z-30">
        <button
          onClick={handleWithdrawal}
          disabled={loading || !withdrawEnabled || !amount || parseFloat(amount) < minWithdraw}
          className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 text-white text-base font-black active:scale-[0.98] transition-all disabled:opacity-40 shadow-md cursor-pointer bg-brand-600"
        >
          {loading ? (
            <div className="size-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="material-symbols-outlined">payments</span>
              <span>ยืนยันการถอนเงิน</span>
            </>
          )}
        </button>
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
