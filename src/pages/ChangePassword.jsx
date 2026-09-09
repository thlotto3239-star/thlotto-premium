import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import PageWrapper from '../components/PageWrapper';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const hasPin = !!profile?.pin_hash;

  const pinToPassword = async (phone, pin) => {
    const raw = new TextEncoder().encode(pin + phone);
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const validate = () => {
    if (hasPin && !currentPin) return 'กรุณากรอก PIN ปัจจุบัน';
    if (hasPin && !/^\d{4}$/.test(currentPin)) return 'PIN ปัจจุบันต้องเป็นตัวเลข 4 หลัก';
    if (!newPin) return 'กรุณากรอก PIN ใหม่';
    if (!/^\d{4}$/.test(newPin)) return 'PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น';
    if (newPin !== confirmPin) return 'PIN ใหม่ไม่ตรงกัน';
    if (hasPin && newPin === currentPin) return 'PIN ใหม่ต้องไม่ซ้ำกับ PIN ปัจจุบัน';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      const phone = profile?.phone;
      if (!phone) throw new Error('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');

      // ตรวจ PIN เก่าก่อน (ถ้ามี)
      if (hasPin) {
        const currentHash = await pinToPassword(phone, currentPin);
        if (currentHash !== profile.pin_hash) {
          setError('PIN ปัจจุบันไม่ถูกต้อง');
          setCurrentPin('');
          setLoading(false);
          return;
        }
      }

      const newPassword = await pinToPassword(phone, newPin);

      const { error: authErr } = await supabase.auth.updateUser({ password: newPassword });
      if (authErr) throw authErr;

      const { error: pinErr } = await supabase.rpc('set_user_pin', { p_pin: newPin, p_user_id: user.id });
      if (pinErr) throw new Error(pinErr.message || 'ไม่สามารถบันทึก PIN ได้');

      setSuccess(true);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      const msg = e.message || '';
      if (msg.includes('different from the old')) {
        setError('PIN ใหม่ต้องไม่ซ้ำกับ PIN ปัจจุบัน');
      } else if (msg.includes('session_not_found') || msg.includes('not authenticated')) {
        setError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
      } else {
        setError(msg || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg tracking-tight">ตั้งค่ารหัส PIN ความปลอดภัย</h1>
              <p className="text-xs text-slate-400 hidden sm:block">จัดการรหัสผ่าน 4 หลักสำหรับเข้าสู่ระบบและถอนเงิน</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
            <span className="material-symbols-outlined text-sm text-brand-600">lock</span>
            PIN 4 หลัก
          </span>
        </div>
      </header>

      {/* Main Responsive Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">

        {/* Success State */}
        {success ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 shadow-xs text-center max-w-md mx-auto space-y-6">
            <div className="size-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">เปลี่ยนรหัส PIN สำเร็จ</h2>
              <p className="text-sm text-slate-500 mt-2">
                รหัส PIN ใหม่ของคุณได้รับการบันทึกอย่างปลอดภัยเรียบร้อยแล้ว ใช้รหัสนี้ในการเข้าสู่ระบบและยืนยันการถอนเงิน
              </p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-4 rounded-2xl font-extrabold text-white text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.99] cursor-pointer bg-brand-600 hover:bg-brand-700"
            >
              กลับหน้าโปรไฟล์
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* ════ LEFT COLUMN (5 cols on PC): Security Overview & Rules ════ */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                    <span className="material-symbols-outlined text-2xl">shield_lock</span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">ความปลอดภัยระดับสูง</h3>
                    <p className="text-xs text-slate-400">การเข้ารหัส Hash 256-Bit</p>
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  <div className="flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5 shrink-0">check_circle</span>
                    <span>ใช้สำหรับเข้าสู่ระบบแทนรหัสผ่านตัวอักษร</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-emerald-600 text-sm mt-0.5 shrink-0">check_circle</span>
                    <span>ใช้ยืนยันการทำรายการถอนเงินออกจากบัญชี</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-600">
                    <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5 shrink-0">info</span>
                    <span>ห้ามตั้ง PIN ที่เดาง่าย เช่น 1234 หรือ 0000</span>
                  </div>
                </div>
              </div>

              {/* Security Shield Notice */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 text-lg mt-0.5 shrink-0">lock</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  อย่าเปิดเผยรหัส PIN ให้แก่ผู้อื่น ทางทีมงานจะไม่มีการขอรหัส PIN ของท่านในทุกกรณี
                </p>
              </div>
            </div>

            {/* ════ RIGHT COLUMN (7 cols on PC): PIN Form Card ════ */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                <div>
                  <h2 className="font-black text-slate-900 text-lg">
                    {hasPin ? 'แก้ไขรหัส PIN เดิม' : 'ตั้งค่ารหัส PIN ใหม่'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">กรอกตัวเลข 4 หลักเพื่อความปลอดภัยของกระเป๋าเงินคุณ</p>
                </div>

                {/* Form Inputs */}
                <div className="space-y-5">
                  {/* Current PIN (only if user has PIN set) */}
                  {hasPin && (
                    <div>
                      <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        รหัส PIN ปัจจุบัน
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">key</span>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={currentPin}
                          onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-black text-2xl text-center tracking-[0.5em] text-slate-900 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* New PIN */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      รหัส PIN ใหม่ (4 หลัก)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">lock</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={newPin}
                        onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-black text-2xl text-center tracking-[0.5em] text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* Confirm PIN */}
                  <div>
                    <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                      ยืนยันรหัส PIN ใหม่อีกครั้ง
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-xl">lock_reset</span>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all outline-none font-black text-2xl text-center tracking-[0.5em] text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  {/* PIN match indicator */}
                  {newPin.length === 4 && confirmPin.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                      <span className={`material-symbols-outlined text-base ${newPin === confirmPin ? 'text-emerald-500' : 'text-red-500'}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                        {newPin === confirmPin ? 'check_circle' : 'cancel'}
                      </span>
                      <span className={`text-xs font-bold ${newPin === confirmPin ? 'text-emerald-600' : 'text-red-500'}`}>
                        {newPin === confirmPin ? 'รหัส PIN ใหม่ตรงกันสมบูรณ์' : 'รหัส PIN ใหม่ยังไม่ตรงกัน'}
                      </span>
                    </div>
                  )}

                  {/* Error Alert */}
                  {error && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
                      <span className="material-symbols-outlined text-rose-500 text-xl shrink-0">error</span>
                      <p className="text-xs text-rose-700 font-bold">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || newPin.length !== 4 || confirmPin.length !== 4 || (hasPin && currentPin.length !== 4)}
                    className="w-full py-4 rounded-2xl font-extrabold text-white text-sm uppercase tracking-wider transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer bg-brand-600 hover:bg-brand-700"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">security</span>
                        <span>ยืนยันการตั้งรหัส PIN</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </PageWrapper>
  );
};

export default ChangePassword;
