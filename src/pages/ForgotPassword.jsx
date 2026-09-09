import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [step, setStep] = useState(1); // 1: phone, 2: verify bank, 3: new password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // ตรวจสอบเบอร์โทรและขอ reset
  const handleCheckPhone = async (e) => {
    e.preventDefault();
    if (!/^0\d{8,9}$/.test(phone)) {
      setError('เบอร์โทรศัพท์ไม่ถูกต้อง');
      return;
    }
    setError('');
    // ไปขั้นตอนยืนยันเลขบัญชีเลย (RPC จะตรวจสอบเบอร์โทรให้)
    setStep(2);
  };

  // ยืนยันเลขบัญชีธนาคาร
  const handleVerifyBank = (e) => {
    e.preventDefault();
    if (!bankAccount.trim()) {
      setError('กรุณากรอกเลขบัญชีธนาคาร');
      return;
    }
    setError('');
    setStep(3);
  };

  // ตั้งรหัสผ่านใหม่
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setError('รหัสผ่านต้องมี 4 หลัก');
      return;
    }
    if (newPin !== confirmPin) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: resetError } = await supabase.rpc('reset_user_password', {
        p_phone: phone,
        p_new_pin: newPin,
        p_bank_account_number: bankAccount.trim()
      });

      if (resetError) {
        setError(resetError.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
        return;
      }

      if (data && !data.success) {
        setError(data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
        return;
      }

      setSuccess('เปลี่ยนรหัสผ่านสำเร็จแล้ว! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      
      // รอ 2 วินาทีแล้ว redirect ไป login
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row antialiased">
      {/* ─── ฝั่งซ้าย: Desktop Security Hero Showcase ─── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-between bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 p-10 xl:p-14 text-white relative overflow-hidden shrink-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-brand-100 text-xs font-bold transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            กลับสู่หน้าเข้าสู่ระบบ
          </Link>

          <div className="mt-12">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-6 shadow-xl">
              <span className="material-symbols-outlined text-3xl text-emerald-400">lock_reset</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
              กู้คืนรหัสผ่านความปลอดภัยสูง
            </h1>
            <p className="text-brand-200/90 text-sm mt-3 leading-relaxed">
              ระบบยืนยันตัวตน 2 ชั้น (2FA Verification) เพื่อปกป้องสินทรัพย์และบัญชีสมาชิกของคุณ
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {[
              { icon: 'phone_iphone', title: 'ขั้นตอนที่ 1: ตรวจสอบเบอร์โทร', desc: 'ระบุหมายเลขโทรศัพท์ที่ลงทะเบียนไว้' },
              { icon: 'account_balance', title: 'ขั้นตอนที่ 2: ยืนยันเลขบัญชี', desc: 'ตรวจสอบกับบัญชีธนาคารจริงที่ผูกไว้' },
              { icon: 'key', title: 'ขั้นตอนที่ 3: ตั้งรหัส PIN ใหม่', desc: 'กำหนดรหัส PIN 4 หลักใหม่สำหรับการเข้าใช้งาน' }
            ].map((st, i) => (
              <div
                key={st.title}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                  step === i + 1
                    ? 'bg-white/15 border-white/30 shadow-lg ring-2 ring-emerald-400/30'
                    : 'bg-white/5 border-white/10 opacity-70'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-xl text-emerald-300">{st.icon}</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{st.title}</h3>
                  <p className="text-xs text-brand-200/80 mt-0.5">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 flex items-center justify-between text-xs text-brand-300">
          <span>TH-LOTTO Security Operations</span>
          <span>SSL 256-Bit Encrypted</span>
        </div>
      </aside>

      {/* ─── ฝั่งขวา: Reset Password Form ─── */}
      <main className="flex-1 flex flex-col justify-center items-center px-4 sm:px-8 py-10 min-h-screen bg-white">
        <div className="w-full max-w-[440px] mx-auto">
          {/* Mobile Brand Banner */}
          <div className="lg:hidden mb-8">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-900 text-xs font-bold mb-4">
              <span className="material-symbols-outlined text-base">arrow_back</span>
              กลับสู่หน้าเข้าสู่ระบบ
            </Link>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950 to-brand-800 text-white flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-emerald-400">lock_reset</span>
              </div>
              <div>
                <h2 className="text-base font-black text-white">กู้คืนรหัสผ่าน</h2>
                <p className="text-xs text-brand-200 font-medium">TH-LOTTO Account Recovery</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-primary/10 text-primary">
                ขั้นตอนที่ {step} จาก 3
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {step === 1 ? 'ระบุเบอร์โทรศัพท์' : step === 2 ? 'ยืนยันเลขบัญชีธนาคาร' : 'ตั้งรหัส PIN ใหม่'}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium leading-relaxed">
              {step === 1 
                ? 'กรุณากรอกเบอร์โทรศัพท์ที่ใช้ลงทะเบียนสมาชิกเพื่อเริ่มต้นกู้คืนรหัส' 
                : step === 2
                ? 'กรุณาระบุเลขที่บัญชีธนาคารที่ผูกไว้กับระบบเพื่อยืนยันความเป็นเจ้าของบัญชี'
                : 'ตั้งรหัส PIN 4 หลักใหม่ที่คุณจำได้เพื่อใช้เข้าสู่ระบบในครั้งต่อไป'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-500 shrink-0 text-xl">error</span>
              <p className="text-rose-600 text-xs sm:text-sm font-bold">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 shrink-0 text-xl">check_circle</span>
              <p className="text-emerald-600 text-xs sm:text-sm font-bold">{success}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleCheckPhone} className="space-y-6">
              <div className="space-y-2">
                <label className="text-slate-700 text-xs font-black uppercase tracking-wider" htmlFor="phone">หมายเลขโทรศัพท์</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-xl">phone_iphone</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    required
                    className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
                style={{ background: '#008a3e' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ถัดไป</span>
                    <span className="material-symbols-outlined font-bold text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={handleVerifyBank} className="space-y-6">
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-primary shrink-0">verified_user</span>
                <p className="text-xs leading-relaxed text-slate-600 font-medium">
                  เพื่อความปลอดภัยสูงสุด กรุณากรอกเลขบัญชีธนาคารที่ผูกไว้ตอนสมัครสมาชิก
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 text-xs font-black uppercase tracking-wider">เลขบัญชีธนาคาร</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-xl">account_balance</span>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="ระบุเลขบัญชีธนาคารที่ผูกไว้"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                    className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 pl-12 pr-4 text-slate-900 font-mono font-bold placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-base"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
                style={{ background: '#008a3e' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ยืนยันตัวตน</span>
                    <span className="material-symbols-outlined font-bold text-lg">arrow_forward</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="w-full py-2.5 text-slate-500 font-bold text-xs sm:text-sm hover:text-slate-900 transition-colors"
              >
                ← กลับไปแก้ไขเบอร์โทรศัพท์
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-black uppercase tracking-wider">PIN ใหม่ (4 หลัก)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 text-center text-xl font-black font-mono tracking-[0.4em] text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-slate-700 text-xs font-black uppercase tracking-wider">ยืนยัน PIN ใหม่</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="flex w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-3.5 text-center text-xl font-black font-mono tracking-[0.4em] text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || newPin.length !== 4 || newPin !== confirmPin}
                className="w-full flex items-center justify-center gap-2 py-4 text-white font-black text-base rounded-2xl shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
                style={{ background: '#008a3e' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    <span>ยืนยันเปลี่ยนรหัส PIN</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setStep(2); setError(''); }}
                className="w-full py-2.5 text-slate-500 font-bold text-xs sm:text-sm hover:text-slate-900 transition-colors"
              >
                ← กลับไปขั้นตอนก่อนหน้า
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              จำรหัสผ่านได้แล้ว?{' '}
              <Link to="/login" className="text-primary font-black hover:underline transition-all">
                เข้าสู่ระบบทันที
              </Link>
            </p>
          </div>

          <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <span className="material-symbols-outlined text-slate-400 text-lg shrink-0">support_agent</span>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              หากข้อมูลบัญชีไม่ถูกต้องหรือไม่สามารถกู้คืนได้ กรุณาติดต่อฝ่ายบริการลูกค้า 24 ชม. ผ่าน LINE Official
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
