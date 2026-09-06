import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
                <span>ความปลอดภัย & รหัส PIN</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Security PIN
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">ตั้งค่าหรือเปลี่ยนรหัส PIN 4 หลักสำหรับเข้าใช้งานและยืนยันการถอนเงิน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ COLUMN 1 (Left 4 Cols on PC): Security Status ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <div className="size-20 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-4xl">shield</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {hasPin ? 'PIN ความปลอดภัยเปิดใช้งานอยู่' : 'ยังไม่ได้ตั้ง PIN'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  รหัส PIN 4 หลัก ใช้สำหรับการล็อกอินและยืนยันทำธุรกรรมการเงิน
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left text-xs space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">บัญชีผู้ใช้:</span>
                  <span className="font-mono font-bold text-slate-800">{profile?.phone || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">สถานะ PIN:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    {hasPin ? 'พร้อมใช้งาน' : 'ต้องตั้งค่า'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ════ COLUMN 2 (Center 5 Cols on PC): PIN Form ════ */}
          <main className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
              {success ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="size-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">เปลี่ยน PIN สำเร็จแล้ว!</h3>
                    <p className="text-xs text-slate-400 mt-1">รหัสความปลอดภัยของคุณได้รับการอัปเดตเรียบร้อย</p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setSuccess(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      เปลี่ยนอีกครั้ง
                    </button>
                    <button
                      onClick={() => navigate('/profile')}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      กลับหน้าโปรไฟล์
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-sm font-extrabold text-slate-900">กำหนดรหัส PIN 4 หลัก</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">กรุณากรอกตัวเลข 4 หลักที่คุณจำได้ง่าย</p>
                  </div>

                  <div className="space-y-4">
                    {/* Current PIN */}
                    {hasPin && (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          PIN ปัจจุบัน <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                            key
                          </span>
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            value={currentPin}
                            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="••••"
                            className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center font-mono font-black text-xl tracking-[0.4em] focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    )}

                    {/* New PIN */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        PIN ใหม่ 4 หลัก <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                          lock
                        </span>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={newPin}
                          onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center font-mono font-black text-xl tracking-[0.4em] focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Confirm PIN */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        ยืนยัน PIN ใหม่อีกครั้ง <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                          lock_reset
                        </span>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={confirmPin}
                          onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="••••"
                          className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center font-mono font-black text-xl tracking-[0.4em] focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    {/* Indicator */}
                    {newPin.length === 4 && confirmPin.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className={`material-symbols-outlined text-sm ${newPin === confirmPin ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {newPin === confirmPin ? 'check_circle' : 'cancel'}
                        </span>
                        <span className={newPin === confirmPin ? 'text-emerald-700' : 'text-rose-600'}>
                          {newPin === confirmPin ? 'รหัส PIN ตรงกัน' : 'รหัส PIN ไม่ตรงกัน'}
                        </span>
                      </div>
                    )}

                    {/* Error */}
                    {error && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-base">error</span>
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading || newPin.length !== 4 || confirmPin.length !== 4 || (hasPin && currentPin.length !== 4)}
                        className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg">security</span>
                            <span>ยืนยันเปลี่ยน PIN</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </main>

          {/* ════ COLUMN 3 (Right 3 Cols on PC): Security Best Practices ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                คำแนะนำความปลอดภัย
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm shrink-0 mt-0.5">warning</span>
                  <p>หลีกเลี่ยงการใช้ตัวเลขที่คาดเดาง่าย เช่น 1234, 0000 หรือ 9999</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm shrink-0 mt-0.5">warning</span>
                  <p>ไม่ควรใช้วันเดือนปีเกิด หรือเลข 4 ตัวท้ายของเบอร์โทรศัพท์</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm shrink-0 mt-0.5">verified</span>
                  <p>ห้ามเปิดเผย PIN ให้ผู้อื่นทราบ แอดมินจะไม่มีวันสอบถาม PIN ของคุณ</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-4.5 border border-slate-200/80 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">ลืมรหัส PIN ปัจจุบัน?</p>
              <Link
                to="/support"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-800"
              >
                <span>ติดต่อฝ่ายบริการลูกค้าเพื่อรีเซ็ต</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default ChangePassword;
