import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PageWrapper from '../components/PageWrapper';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { useModal } from '../contexts/ModalContext';
import BankSelector from '../components/BankSelector';

const EditProfile = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { showSuccess, showError } = useModal();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    bank_name: profile?.bank_name || '',
    bank_account_number: profile?.bank_account_number || '',
    bank_account_name: profile?.bank_account_name || '',
  });
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone || 'user'}`;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showError('ขนาดไฟล์ใหญ่เกินไป', 'รูปภาพต้องไม่เกิน 2MB');
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const fileName = `${profile.id}/${Date.now()}.${safeExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;
      await refreshProfile();
      showSuccess('อัปเดตรูปโปรไฟล์สำเร็จ!', 'รูปโปรไฟล์ของคุณถูกอัปเดตแล้ว');
    } catch (err) {
      console.error('Avatar upload error:', err);
      showError('อัปโหลดไม่สำเร็จ', err?.message || err?.statusCode || 'เกิดข้อผิดพลาดในการอัปโหลดรูป กรุณาลองใหม่');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.full_name.trim()) {
      showError('กรุณากรอกชื่อ', 'ชื่อ-นามสกุลไม่สามารถเว้นว่างได้');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          bank_name: formData.bank_name || null,
          bank_account_number: formData.bank_account_number || null,
          bank_account_name: formData.bank_account_name || null,
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      showSuccess('บันทึกสำเร็จ!', 'ข้อมูลโปรไฟล์ถูกอัปเดตเรียบร้อยแล้ว');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('บันทึกไม่สำเร็จ', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
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
                <span>แก้ไขข้อมูลโปรไฟล์</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  Settings
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">อัปเดตข้อมูลส่วนตัว ชื่อ-นามสกุล และบัญชีธนาคารสำหรับถอนเงิน</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {loading ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">save</span>
                  <span>บันทึกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Section Settings Cockpit */}
      <div className="max-w-[1720px] 2xl:max-w-[1850px] mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 pb-28 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ════ SECTION 1 (Left 4 Cols on PC): Avatar & User Overview ════ */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-4">
            {/* Avatar & Photo Upload Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs text-center space-y-4">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="relative inline-block mx-auto">
                <div className="size-32 rounded-full p-1 border-2 border-emerald-600/30 shadow-xs">
                  <div className="size-full rounded-full bg-slate-50 overflow-hidden">
                    <img
                      alt="Avatar"
                      className="size-full object-cover"
                      src={profile?.avatar_url || defaultAvatar}
                    />
                  </div>
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-1 right-1 size-10 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer disabled:opacity-50"
                  title="เปลี่ยนรูปโปรไฟล์"
                >
                  {avatarUploading ? (
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                  )}
                </button>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">รูปภาพโปรไฟล์</h3>
                <p className="text-xs text-slate-400 mt-0.5">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 2MB</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">รหัสสมาชิก:</span>
                  <span className="font-mono font-bold text-slate-800">{profile?.member_id || '------'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400">ระดับสมาชิก:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{profile?.vip_level || 'MEMBER'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">เบอร์มือถือ:</span>
                  <span className="font-mono font-bold text-slate-800">{profile?.phone || '—'}</span>
                </div>
              </div>

              {/* Quick Navigation to Change PIN */}
              <button
                type="button"
                onClick={() => navigate('/change-password')}
                className="w-full h-11 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">lock_reset</span>
                <span>เปลี่ยนรหัสผ่าน / PIN 4 หลัก</span>
              </button>
            </div>
          </aside>

          {/* ════ SECTION 2 (Center 5 Cols on PC): Form Details ════ */}
          <main className="lg:col-span-5 space-y-4">
            {/* Personal Details Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">ข้อมูลส่วนตัว</h3>
                  <p className="text-[11px] text-slate-400 font-medium">ชื่อ-นามสกุลสำหรับแสดงผลในระบบ</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700" htmlFor="full_name">
                    ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      badge
                    </span>
                    <input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="ระบุชื่อและนามสกุลจริง"
                      className="w-full h-12 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Locked Phone */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">
                    เบอร์โทรศัพท์ (ใช้เป็น ID เข้าสู่ระบบ - แก้ไขไม่ได้)
                  </label>
                  <div className="flex items-center gap-3 px-4 h-12 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 text-xs font-mono">
                    <span className="material-symbols-outlined text-slate-400 text-base">call</span>
                    <span>{profile?.phone || '—'}</span>
                    <span className="ml-auto material-symbols-outlined text-slate-400 text-sm">lock</span>
                  </div>
                </div>

                {/* Locked Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-400">
                    อีเมลที่เชื่อมต่อ
                  </label>
                  <div className="flex items-center gap-3 px-4 h-12 bg-slate-100 border border-slate-200/60 rounded-xl text-slate-500 text-xs">
                    <span className="material-symbols-outlined text-slate-400 text-base">mail</span>
                    <span className="truncate">{user?.email || '—'}</span>
                    <span className="ml-auto material-symbols-outlined text-slate-400 text-sm">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Account Details Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">account_balance</span>
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">บัญชีธนาคารสำหรับถอนเงิน</h3>
                  <p className="text-[11px] text-slate-400 font-medium">ชื่อบัญชีต้องตรงกับชื่อสมาชิกเพื่อความรวดเร็วในการถอน</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">ธนาคาร</label>
                  <BankSelector
                    value={formData.bank_name}
                    onChange={(code) => setFormData({ ...formData, bank_name: code })}
                    placeholder="เลือกธนาคารของคุณ"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700" htmlFor="bank_account_number">
                    เลขที่บัญชี
                  </label>
                  <input
                    id="bank_account_number"
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value.replace(/[^0-9-]/g, '') })}
                    placeholder="เช่น 123-4-56789-0"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700" htmlFor="bank_account_name">
                    ชื่อบัญชีธนาคาร
                  </label>
                  <input
                    id="bank_account_name"
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="ชื่อ-นามสกุลตรงตามสมุดบัญชี"
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={loading}
                  className="w-full h-13 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">save</span>
                      <span>บันทึกการเปลี่ยนแปลงทั้งหมด</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </main>

          {/* ════ SECTION 3 (Right 3 Cols on PC): Compliance & Security ════ */}
          <aside className="hidden xl:block xl:col-span-3 space-y-4">
            {/* Bank Compliance Guidelines */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                กฎระเบียบบัญชีธนาคาร
              </h3>
              <div className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-sm shrink-0 mt-0.5">info</span>
                  <p>ชื่อบัญชีธนาคารต้องตรงกับชื่อผู้ลงทะเบียน เพื่อป้องกันการฟอกเงินและความปลอดภัยสูงสุด</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-700 text-sm shrink-0 mt-0.5">verified</span>
                  <p>ระบบถอนเงินออโต้จะโอนเข้าบัญชีที่ระบุนี้โดยตรงภายใน 5-15 นาที</p>
                </div>
              </div>
            </div>

            {/* Security Audit Badge */}
            <div className="bg-emerald-50/60 rounded-3xl p-4.5 border border-emerald-200/80 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-700 text-lg">shield</span>
                <h4 className="text-xs font-extrabold">ความปลอดภัยระดับสูง</h4>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                ข้อมูลส่วนบุคคลทั้งหมดถูกเข้ารหัสด้วยเทคโนโลยี AES-256 ปลอดภัย 100%
              </p>
            </div>

            {/* Logout Action */}
            <button
              type="button"
              onClick={() => { signOut(); navigate('/login'); }}
              className="w-full h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>ออกจากระบบ</span>
            </button>
          </aside>

        </div>
      </div>
    </PageWrapper>
  );
};

export default EditProfile;
