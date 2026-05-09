import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useModal } from '../contexts/ModalContext';

const Withdrawal = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError } = useModal();
  // ใช้ profile data ในการแสดงผลและตรวจสอบ
  const userProfile = profile;
  const [amount, setAmount] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [minWithdraw, setMinWithdraw] = useState(300);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAmount, setPendingAmount] = useState(null);
  const navigate = useNavigate();

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
  }, []);

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
    setShowPinModal(true);
  };

  const handleConfirmPin = async () => {
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      showError('รหัสผ่านไม่ถูกต้อง', 'กรุณากรอกรหัสผ่าน 4 หลัก');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_withdrawal_securely', {
        p_amount: pendingAmount,
        p_pin: pin
      });

      if (error) throw error;

      if (data.success) {
        setShowPinModal(false);
        await refreshProfile();
        // แสดง Modal Success แล้วค่อยไปหน้า withdrawal-confirm
        showSuccess(
          'ส่งคำขอถอนเงินสำเร็จ!',
          `รอการอนุมัติประมาณ 10-30 นาที\nยอดถอน: ฿${pendingAmount?.toLocaleString()}`,
          () => navigate('/withdrawal-confirm', { state: { amount: pendingAmount, bankName: userProfile?.bank_name } })
        );
      } else {
        showError('ถอนเงินไม่สำเร็จ', data.message || 'กรุณาตรวจสอบรหัสผ่านและลองใหม่');
        setPin('');
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-[#1a7e2a]"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">ถอนเงิน</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 pt-6 pb-36">
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
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest px-1 mb-3">บัญชีรับเงินของคุณ</p>
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 font-extrabold text-lg border-2 border-white shadow ${getBankColor(userProfile?.bank_name)}`}>
              {bankShortName(userProfile?.bank_name)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-slate-900 font-extrabold text-base truncate">{userProfile?.bank_name || 'ไม่พบข้อมูล'}</p>
              <p className="text-slate-400 font-body tabular-nums text-sm tracking-widest">{userProfile?.bank_account_number || 'xxx-x-xxxxx-x'}</p>
            </div>
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
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-900">Secure SSL 256-bit Encryption</span>
        </div>
      </footer>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPinModal(false)}></div>
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-primary">lock</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">ยืนยันรหัส PIN</h3>
              <p className="text-sm text-slate-500 mt-1">ถอนเงิน ฿{pendingAmount?.toLocaleString()}</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-6">
              <p className="text-center text-slate-900 font-extrabold text-sm mb-3 uppercase tracking-widest">ระบุ PIN 4 หลัก</p>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-xl py-4 px-5 pr-14 text-center text-2xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmPin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                >
                  <span className="material-symbols-outlined text-xl">{showPin ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleConfirmPin}
              disabled={loading || pin.length !== 4}
              className="w-full h-14 rounded-full flex items-center justify-center gap-2 text-white text-base font-extrabold active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #156321 100%)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  ยืนยันการถอนเงิน
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawal;
