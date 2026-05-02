import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

const UploadSlip = () => {
  const { profile, refreshProfile } = useAuth();
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
      setError('กรุณาอัปโหลดสลิปโอนเงิน');
      return;
    }

    setUploading(true);
    setError('');
    
    try {
      // 1. Upload to Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
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
        navigate('/deposit-success', { state: { amount: depositAmount, txRef: rpcData.request_id } });
      } else {
        setError(rpcData.message);
      }
    } catch (err) {
      console.error('Error submitting slip:', err);
      setError('เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col max-w-[430px] mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white">
        <div className="flex items-center justify-between p-4 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-900">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">แนบสลิปโอนเงิน</h1>
          <div className="w-10 h-10"></div>
        </div>
        <div className="px-6 pb-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium text-slate-400">ขั้นตอนสุดท้าย</span>
            <span className="text-sm font-bold text-[#1a7e2a]">3 / 3</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1a7e2a] w-full"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col gap-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-red-500 text-sm">error</span>
            <p className="text-red-600 text-xs font-medium">{error}</p>
          </div>
        )}

        {/* Upload Zone */}
        <section className="relative">
          <input
            type="file"
            id="slip-upload"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,application/pdf"
          />
          <label
            htmlFor="slip-upload"
            className="w-full aspect-[4/3] flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 bg-[#1a7e2a]/[0.02] hover:bg-[#1a7e2a]/[0.04]"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='32' ry='32' stroke='%231a7e2a' stroke-width='2' stroke-dasharray='12%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")",
              borderRadius: '2rem'
            }}
          >
            {file ? (
              <div className="w-full h-full p-4 relative group" style={{ borderRadius: '2rem', overflow: 'hidden' }}>
                <img
                  src={URL.createObjectURL(file)}
                  alt="Slip Preview"
                  className="w-full h-full object-contain"
                  style={{ borderRadius: '1.5rem' }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="relative w-16 h-16 flex items-center justify-center rounded-2xl bg-[#1a7e2a]/10 border border-[#1a7e2a]/20">
                    <span className="material-symbols-outlined text-[#1a7e2a] text-4xl">add_a_photo</span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-[#1a7e2a] font-semibold text-lg mb-1">แตะเพื่ออัปโหลดสลิป</p>
                  <p className="text-slate-400 text-xs">รองรับไฟล์ JPG, PNG, PDF (สูงสุด 5MB)</p>
                </div>
              </>
            )}
          </label>
        </section>

        {/* Summary Card */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-slate-400 px-1 uppercase tracking-wider">สรุปรายละเอียดการโอน</h2>
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col gap-4">
            {promoCode && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">โปรโมชั่น</span>
                <span className="text-sm font-bold text-primary">{promoName || promoCode}</span>
              </div>
              <div className="h-px bg-slate-100 w-full"></div>
            </>
          )}
          <div className="flex justify-between items-center">
              <span className="text-slate-500">จำนวนเงิน</span>
              <span className="text-xl font-bold text-slate-900">฿{Number(depositAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="h-px bg-slate-100 w-full"></div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">วันที่โอน</span>
              <span className="text-slate-700">{new Date().toLocaleString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">เวลาที่เหลือ</span>
              <span className={`font-bold ${timeLeft <= 60 ? 'text-red-500' : 'text-[#1a7e2a]'}`}>{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <span className="material-symbols-outlined text-[#1a7e2a] text-xl">info</span>
          <p className="text-slate-600 text-sm leading-relaxed">
            โปรดตรวจสอบความถูกต้องของสลิปและจำนวนเงินก่อนกดปุ่มยืนยันเพื่อให้ระบบดำเนินการได้อย่างรวดเร็ว
          </p>
        </section>
      </main>

      {/* Footer Action */}
      <footer className="p-6 pb-10 flex flex-col gap-4 bg-white">
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300">EMERALD TREASURY PREMIUM SERVICE</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={uploading || !file}
          className="w-full h-14 text-white font-bold text-lg rounded-xl hover:brightness-105 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1a7e2a 0%, #2ecc71 100%)' }}
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>กำลังตรวจสอบสลิป...</span>
            </>
          ) : (
            <>
              ยืนยันการโอน
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </>
          )}
        </button>
        <div className="flex justify-center items-center gap-1.5 opacity-60">
          <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '14px' }}>verified_user</span>
          <span className="text-[11px] text-slate-400">ธุรกรรมปลอดภัยและถูกเข้ารหัส</span>
        </div>
      </footer>
    </div>
  );
};

export default UploadSlip;
