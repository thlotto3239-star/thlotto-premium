import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useModal } from '../contexts/ModalContext';

const UploadSlip = () => {
  const { profile, refreshProfile } = useAuth();
  const { showSuccess, showError, showConfirm } = useModal();
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const depositAmount = location.state?.amount || 0;
  const promoCode = location.state?.promoCode || null;
  const promoName = location.state?.promoName || null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      showError('กรุณาอัปโหลดสลิป', 'กรุณาเลือกไฟล์สลิปก่อนกดยืนยัน');
      return;
    }

    // แสดง Modal Confirm ก่อนส่ง
    showConfirm(
      'ยืนยันการฝากเงิน?',
      `ยอดเงิน: ฿${parseFloat(depositAmount).toLocaleString()}${promoName ? `\nโปรโมชั่น: ${promoName}` : ''}`,
      async () => {
        setUploading(true);
        setError('');
        
        try {
          // 1. Upload to Storage
          const fileExt = file.name.split('.').pop();
          const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('slips')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // 2. Get Public URL
          const { data: { publicUrl } } = supabase.storage
            .from('slips')
            .getPublicUrl(fileName);

          // 3. Submit RPC
          const { data: rpcData, error: rpcError } = await supabase.rpc('submit_deposit_slip', {
            p_amount: parseFloat(depositAmount),
            p_slip_url: publicUrl,
            p_promo_code: promoCode || null,
          });

          if (rpcError) throw rpcError;

          if (rpcData.success) {
            await refreshProfile();
            // แสดง Modal Success แล้วค่อยไปหน้า deposit-success
            showSuccess(
              'ส่งสลิปสำเร็จ!',
              `รอการอนุมัติประมาณ 1-5 นาที\nเลขที่รายการ: ${rpcData.request_id || '-'}`,
              () => navigate('/deposit-success', { state: { amount: depositAmount, txRef: rpcData.request_id } })
            );
          } else {
            showError('ไม่สำเร็จ', rpcData.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
          }
        } catch (err) {
          console.error('Error submitting slip:', err);
          showError('เกิดข้อผิดพลาด', 'ไม่สามารถส่งสลิปได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
          setUploading(false);
        }
      },
      'ยืนยัน',
      'ยกเลิก'
    );
  };

  return (
    <PageWrapper>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors border border-slate-100"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">แนบสลิปโอนเงิน</h1>
              <p className="text-xs text-slate-400 font-bold hidden sm:block">ขั้นตอนที่ 3 จาก 3 — ยืนยันการชำระเงินและปรับยอดเครดิต</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">เวลาที่เหลือ:</span>
            <span className={`text-xs sm:text-sm font-black font-mono px-3 py-1 rounded-full ${timeLeft <= 60 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 pb-32">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500 text-lg">error</span>
            <p className="text-rose-600 text-xs sm:text-sm font-bold">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Transfer Summary & Rules */}
          <div className="lg:col-span-5 space-y-6">
            {/* Amount Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm relative overflow-hidden">
              <p className="text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">ยอดเงินที่ต้องตรงกับสลิป</p>
              <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
                ฿{Number(depositAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              {promoCode && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">โปรโมชั่นที่เลือก</span>
                  <span className="text-primary">{promoName || promoCode}</span>
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>วันที่ทำรายการ</span>
                <span className="text-slate-900">{new Date().toLocaleDateString('th-TH-u-ca-buddhist', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>

            {/* Verification Guidelines Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/70 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">ข้อแนะนำการแนบสลิป</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-slate-600 font-medium">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                  <span>ภาพสลิปต้องเห็นชื่อผู้โอน, เลขบัญชี, วันเวลา และจำนวนเงินชัดเจน</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-emerald-500 text-base shrink-0">check_circle</span>
                  <span>ต้องเป็นสลิปจากแอปธนาคารตัวจริง ห้ามครอปตัดหรือตกแต่งภาพ</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-amber-500 text-base shrink-0">warning</span>
                  <span>ระบบ AI และเจ้าหน้าที่จะตรวจสอบความถูกต้อง หากพบสลิปซ้ำจะระงับบัญชี</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Upload Studio */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/70 shadow-sm space-y-6">
              <input
                type="file"
                id="slip-upload"
                className="hidden"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/webp,image/gif"
              />
              <label
                htmlFor="slip-upload"
                className="w-full aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-all bg-emerald-50/20 hover:bg-emerald-50/40 border-2 border-dashed border-emerald-500/30 rounded-3xl overflow-hidden relative group"
              >
                {file ? (
                  <div className="w-full h-full p-4 relative flex items-center justify-center">
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Slip Preview"
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-md"
                    />
                    <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                      <span className="material-symbols-outlined text-4xl">photo_camera</span>
                      <p className="text-xs font-black">คลิกเพื่อเปลี่ยนรูปสลิป</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center px-6 py-12 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4 shadow-sm group-hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-900 mb-1">คลิกหรือลากไฟล์สลิปมาวางที่นี่</p>
                    <p className="text-xs text-slate-400 font-bold">รองรับไฟล์ JPG, PNG, WebP ขนาดไม่เกิน 5MB</p>
                  </div>
                )}
              </label>

              <button
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="w-full py-4 sm:py-5 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-primary/25 hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2ecc71 100%)' }}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>กำลังตรวจสอบสลิป...</span>
                  </>
                ) : (
                  <>
                    <span>ยืนยันการโอนเงิน</span>
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                  </>
                )}
              </button>

              <div className="flex justify-center items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="material-symbols-outlined text-slate-400 text-sm">lock</span>
                <span>ระบบรักษาความปลอดภัยมาตรฐานระดับสากล SSL 256-Bit</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </PageWrapper>
  );
};

export default UploadSlip;
