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
  const isNewPhone = !profile?.phone;
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    pin: '',
    confirm_pin: '',
    bank_name: profile?.bank_name || '',
    bank_account_number: profile?.bank_account_number || '',
    bank_account_name: profile?.bank_account_name || profile?.full_name || '',
  });
  const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone || profile?.id}`;

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

    if (isNewPhone) {
      if (!formData.phone || !/^[0-9]{10}$/.test(formData.phone)) {
        showError('เบอร์โทรศัพท์ไม่ถูกต้อง', 'กรุณากรอกหมายเลขโทรศัพท์ 10 หลัก');
        return;
      }
      if (!formData.pin || !/^[0-9]{4}$/.test(formData.pin)) {
        showError('รหัส PIN ไม่ถูกต้อง', 'กรุณากำหนดรหัส PIN ตัวเลข 4 หลักเพื่อความปลอดภัย');
        return;
      }
      if (formData.pin !== formData.confirm_pin) {
        showError('รหัส PIN ไม่ตรงกัน', 'กรุณากรอกรหัส PIN และยืนยันรหัส PIN ให้ตรงกัน');
        return;
      }
    }

    setLoading(true);
    try {
      const updatePayload = {
        full_name: formData.full_name,
        bank_name: formData.bank_name || null,
        bank_account_number: formData.bank_account_number || null,
        bank_account_name: formData.bank_account_name || formData.full_name || null,
      };

      if (isNewPhone) {
        const raw = new TextEncoder().encode(formData.pin + formData.phone);
        const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
        const pinHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
        updatePayload.phone = formData.phone;
        updatePayload.pin_hash = pinHash;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      showSuccess('บันทึกสำเร็จ!', 'ข้อมูลโปรไฟล์และบัญชีธนาคารถูกอัปเดตเรียบร้อยแล้ว');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      showError('บันทึกไม่สำเร็จ', err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 transition-all duration-200 active:scale-95 hover:bg-zinc-50 rounded-full"
          >
            <span className="material-symbols-outlined text-zinc-600">arrow_back</span>
          </button>
          <h1 className="text-2xl font-black text-emerald-600 tracking-tight uppercase">TH-LOTTO</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/notifications')} className="p-2 transition-all duration-200 active:scale-95 hover:bg-zinc-50 rounded-full">
            <span className="material-symbols-outlined text-emerald-600">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden border border-zinc-100">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src={profile?.avatar_url || defaultAvatar}
            />
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════ LEFT COLUMN (4 cols on PC): Avatar Studio & Identity ════ */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs flex flex-col items-center text-center">
              <div className="relative mb-4">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <div className="w-32 h-32 rounded-full border-4 border-white ring-2 ring-emerald-500/30 overflow-hidden bg-zinc-100 shadow-md">
                  <img
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    src={profile?.avatar_url || defaultAvatar}
                  />
                </div>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-full border-2 border-white transition-all active:scale-95 shadow-md flex items-center justify-center disabled:opacity-60 cursor-pointer"
                  title="เปลี่ยนรูปโปรไฟล์"
                >
                  {avatarUploading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
                  }
                </button>
              </div>
              <h3 className="font-extrabold text-zinc-800 text-base">{profile?.full_name || 'สมาชิก'}</h3>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">ID: {profile?.member_id || '------'}</p>

              <div className="mt-4 pt-4 border-t border-zinc-100 w-full text-left space-y-2">
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>ไฟล์รูป JPG, PNG, WEBP สูงสุด 2MB</span>
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-emerald-600">check_circle</span>
                  <span>รูปจะแสดงในหน้าข้อมูลสมาชิก</span>
                </p>
              </div>
            </div>

            {/* Quick Security Shortcut */}
            <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-brand-600 text-sm">security</span>
                ความปลอดภัยของบัญชี
              </h4>
              <div
                onClick={() => navigate('/change-password')}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer group"
              >
                <div>
                  <p className="text-xs font-bold text-zinc-800">เปลี่ยนรหัส PIN (4 หลัก)</p>
                  <p className="text-[11px] text-zinc-400">ใช้ยืนยันการถอนเงิน</p>
                </div>
                <span className="material-symbols-outlined text-zinc-400 text-base group-hover:text-emerald-600 transition-colors">chevron_right</span>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN (8 cols on PC): Edit Form Fields ════ */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Info */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
              <h3 className="text-emerald-700 font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">person</span>
                ข้อมูลส่วนตัว
              </h3>
              <div className="space-y-4">
                {/* Phone Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">
                    หมายเลขโทรศัพท์ {isNewPhone ? <span className="text-red-500">* (กรอก 10 หลัก)</span> : <span className="text-zinc-400 font-normal">(ไม่สามารถแก้ไขได้)</span>}
                  </label>
                  {isNewPhone ? (
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-emerald-600">call</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="0xxxxxxxxx"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-500 text-sm">
                      <span className="material-symbols-outlined text-zinc-400">call</span>
                      <span className="font-bold font-mono">{profile?.phone || '—'}</span>
                      <span className="ml-auto material-symbols-outlined text-zinc-300 text-base">lock</span>
                    </div>
                  )}
                </div>

                {/* PIN Setup (Only for new Google users without phone) */}
                {isNewPhone && (
                  <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <span className="material-symbols-outlined text-sm font-bold">pin</span>
                      <p className="text-xs font-bold">กำหนดรหัส PIN 4 หลัก สำหรับยืนยันการถอนเงิน</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-zinc-600 px-1">รหัส PIN 4 หลัก</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          value={formData.pin}
                          onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/[^0-9]/g, '') })}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xl font-bold tracking-widest"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-zinc-600 px-1">ยืนยัน PIN อีกครั้ง</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="••••"
                          value={formData.confirm_pin}
                          onChange={(e) => setFormData({ ...formData, confirm_pin: e.target.value.replace(/[^0-9]/g, '') })}
                          className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-center font-mono text-xl font-bold tracking-widest"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide" htmlFor="full_name">ชื่อ-นามสกุล</label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-emerald-600">person</span>
                    <input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium text-sm text-zinc-900"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wide">อีเมล (ไม่สามารถแก้ไขได้)</label>
                  <div className="flex items-center gap-3 p-3.5 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400 text-sm">
                    <span className="material-symbols-outlined text-zinc-400">mail</span>
                    <span className="font-medium">{user?.email || '—'}</span>
                    <span className="ml-auto material-symbols-outlined text-zinc-300 text-base">lock</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Account Section */}
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-zinc-200/80 shadow-xs space-y-5">
              <h3 className="text-emerald-700 font-extrabold flex items-center gap-2 text-sm uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">account_balance</span>
                บัญชีธนาคาร (สำหรับถอนเงิน)
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide">ธนาคาร</label>
                  <BankSelector
                    value={formData.bank_name}
                    onChange={(code) => setFormData({ ...formData, bank_name: code })}
                    placeholder="เลือกธนาคารของคุณ"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide" htmlFor="bank_account_number">เลขที่บัญชี</label>
                  <input
                    id="bank_account_number"
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value.replace(/[^0-9-]/g, '') })}
                    placeholder="xxx-x-xxxxx-x"
                    className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-mono tracking-wider text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wide" htmlFor="bank_account_name">ชื่อบัญชี</label>
                  <input
                    id="bank_account_name"
                    type="text"
                    value={formData.bank_account_name}
                    onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })}
                    placeholder="ชื่อ-นามสกุลผู้ถือบัญชี"
                    className="w-full px-4 py-3.5 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl active:scale-[0.99] transition-all uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  'บันทึกการเปลี่ยนแปลง'
                )}
              </button>
              <button
                onClick={() => { signOut(); navigate('/login'); }}
                className="py-4 px-6 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-extrabold rounded-2xl active:scale-[0.99] transition-all uppercase tracking-wider cursor-pointer text-sm"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>

        </div>
      </main>

    </PageWrapper>
  );
};

export default EditProfile;
