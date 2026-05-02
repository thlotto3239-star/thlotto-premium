import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import BottomNav from '../components/BottomNav';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const PIN_BLACKLIST = [
    '0000','1111','2222','3333','4444',
    '5555','6666','7777','8888','9999',
    '1234','4321','1122','2233','3344',
    '4455','5566','6677','7788','8899',
    '0123','3210','9876','6789','1212',
    '2121','1010','0101','2580','0852'
  ];

  const validate = () => {
    if (!newPin) return 'กรุณากรอก PIN ใหม่';
    if (!/^\d{4}$/.test(newPin)) return 'PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น';
    if (PIN_BLACKLIST.includes(newPin)) return 'PIN นี้ง่ายเกินไป กรุณาเลือก PIN ที่ปลอดภัยกว่า';
    if (newPin !== confirmPin) return 'PIN ใหม่ไม่ตรงกัน';
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

      const newPassword = `THLT_${newPin}_${phone}`;

      const { error: authErr } = await supabase.auth.updateUser({ password: newPassword });
      if (authErr) throw authErr;

      const { data: pinResult } = await supabase.rpc('set_user_pin', { p_pin: newPin });
      if (pinResult && !pinResult.success) throw new Error(pinResult.message);

      setSuccess(true);
      setNewPin('');
      setConfirmPin('');
    } catch (e) {
      setError(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-body flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 px-4 h-16">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="font-extrabold text-lg tracking-tight">เปลี่ยน PIN</h1>
      </header>

      <div className="flex-1 px-5 py-8 pb-32 max-w-md mx-auto w-full">

        {/* Success State */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-6">
            <div className="size-20 rounded-full bg-emerald-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-extrabold text-slate-900 mb-2">เปลี่ยน PIN สำเร็จ</h2>
              <p className="text-sm text-slate-400">รหัส PIN ของคุณได้รับการอัปเดตเรียบร้อยแล้ว</p>
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-4 rounded-full font-extrabold text-white text-sm uppercase tracking-wider active:scale-[0.98] transition-all"
              style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
            >
              กลับหน้าโปรไฟล์
            </button>
          </div>
        ) : (
          <>
            {/* Info Card */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[20px] mt-0.5 shrink-0">info</span>
              <p className="text-xs text-amber-700 leading-relaxed">
                PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น ใช้สำหรับเข้าสู่ระบบและยืนยันการถอนเงิน
              </p>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {/* New PIN */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  PIN ใหม่
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all outline-none font-bold text-xl text-center tracking-[0.5em]"
                  />
                </div>
              </div>

              {/* Confirm PIN */}
              <div>
                <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 px-1">
                  ยืนยัน PIN ใหม่
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[20px]">lock_reset</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all outline-none font-bold text-xl text-center tracking-[0.5em]"
                  />
                </div>
              </div>

              {/* PIN match indicator */}
              {newPin.length === 4 && confirmPin.length > 0 && (
                <div className="flex items-center gap-2 px-1">
                  <span className={`material-symbols-outlined text-sm ${newPin === confirmPin ? 'text-emerald-500' : 'text-red-400'}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                    {newPin === confirmPin ? 'check_circle' : 'cancel'}
                  </span>
                  <span className={`text-xs font-medium ${newPin === confirmPin ? 'text-emerald-600' : 'text-red-400'}`}>
                    {newPin === confirmPin ? 'PIN ตรงกัน' : 'PIN ไม่ตรงกัน'}
                  </span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-[20px]">error</span>
                  <p className="text-xs text-red-600 font-bold">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={loading || newPin.length !== 4 || confirmPin.length !== 4}
                className="w-full py-4 rounded-full font-extrabold text-white text-sm uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(to right, rgb(22,68,30), rgb(13,121,4))' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">security</span>
                    ยืนยันเปลี่ยน PIN
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ChangePassword;
