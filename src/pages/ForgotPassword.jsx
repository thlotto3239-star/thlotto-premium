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
    <div className="bg-white min-h-screen flex justify-center items-start antialiased">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-white overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center px-6 pt-8 pb-4 justify-between bg-white sticky top-0 z-50">
          <Link to="/login" className="w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img
                alt="TH LOTTO"
                className="w-full h-full object-cover"
                src="https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png"
              />
            </div>
            <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">TH LOTTO</h1>
          </div>
          <div className="w-10 h-10" />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-12">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100">
            <h2 className="text-slate-900 text-2xl font-extrabold mb-2">
              {step === 1 ? 'ลืมรหัสผ่าน?' : step === 2 ? 'ยืนยันตัวตน' : 'ตั้งรหัสผ่านใหม่'}
            </h2>
            <p className="text-slate-500 text-sm font-medium mb-8">
              {step === 1 
                ? 'กรุณากรอกเบอร์โทรศัพท์ที่ใช้สมัครสมาชิก' 
                : step === 2
                ? 'กรุณากรอกเลขบัญชีธนาคารที่ผูกไว้กับบัญชีนี้'
                : 'กรุณาตั้งรหัสผ่านใหม่ 4 หลัก'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">error</span>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-500 shrink-0 text-xl">check_circle</span>
                <p className="text-emerald-600 text-sm font-medium">{success}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleCheckPhone} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-bold ml-4" htmlFor="phone">หมายเลขโทรศัพท์</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400 pointer-events-none">
                      <span className="material-symbols-outlined text-xl">phone_iphone</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="08X-XXX-XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      required
                      className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-4 text-white font-extrabold text-lg rounded-full active:scale-[0.98] transition-all border-b-4 border-emerald-900 disabled:opacity-50"
                  style={{ background: '#008a3e' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>ถัดไป</span>
                      <span className="material-symbols-outlined font-bold">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            ) : step === 2 ? (
              <form onSubmit={handleVerifyBank} className="space-y-6">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex gap-3">
                  <span className="material-symbols-outlined text-primary shrink-0">verified_user</span>
                  <p className="text-xs leading-relaxed text-slate-600">
                    เพื่อความปลอดภัย กรุณากรอกเลขบัญชีธนาคารที่ผูกไว้ตอนสมัครสมาชิก
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-bold ml-4">เลขบัญชีธนาคาร</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400 pointer-events-none">
                      <span className="material-symbols-outlined text-xl">account_balance</span>
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="xxx-x-xxxxx-x"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      required
                      className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-3 py-4 text-white font-extrabold text-lg rounded-full active:scale-[0.98] transition-all border-b-4 border-emerald-900"
                  style={{ background: '#008a3e' }}
                >
                  <span>ยืนยันตัวตน</span>
                  <span className="material-symbols-outlined font-bold">arrow_forward</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="w-full py-3 text-slate-500 font-medium text-sm hover:text-slate-700 transition-colors"
                >
                  ← กลับไปแก้ไขเบอร์โทร
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-bold ml-4">รหัสผ่านใหม่ (4 หลัก)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-bold ml-4">ยืนยันรหัสผ่าน</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="****"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      required
                      className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || newPin.length !== 4 || newPin !== confirmPin}
                  className="w-full flex items-center justify-center gap-3 py-4 text-white font-extrabold text-lg rounded-full active:scale-[0.98] transition-all border-b-4 border-emerald-900 disabled:opacity-50"
                  style={{ background: '#008a3e' }}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>ยืนยันเปลี่ยนรหัสผ่าน</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(2); setError(''); }}
                  className="w-full py-3 text-slate-500 font-medium text-sm hover:text-slate-700 transition-colors"
                >
                  ← กลับขั้นตอนก่อนหน้า
                </button>
              </form>
            )}

            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-500">
                จำรหัสผ่านได้แล้ว?{' '}
                <Link to="/login" className="text-primary font-bold hover:opacity-80 transition-opacity">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-slate-400 text-xl shrink-0">info</span>
              <div>
                <p className="text-sm font-bold text-slate-700">หมายเหตุ:</p>
                <p className="text-xs text-slate-500 mt-1">
                  หากคุณไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาติดต่อฝ่ายบริการลูกค้า 24 ชั่วโมง
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-2 border-t border-slate-100 flex flex-col items-center gap-3">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} TH LOTTO. หนึ่งในเครือข่ายความภูมิใจของประเทศไทย
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
