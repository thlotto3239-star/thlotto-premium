import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const EditProfile = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
  });

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('ขนาดรูปภาพต้องไม่เกิน 2MB');
      return;
    }
    setAvatarUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${profile.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
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
      alert('อัปเดตรูปโปรไฟล์สำเร็จ');
    } catch (err) {
      console.error('Avatar upload error:', err);
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูป');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
        })
        .eq('id', profile.id);

      if (error) throw error;
      await refreshProfile();
      alert('บันทึกข้อมูลสำเร็จ');
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white text-slate-900 min-h-screen pb-32">
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
          <button className="p-2 transition-all duration-200 active:scale-95 hover:bg-zinc-50 rounded-full">
            <span className="material-symbols-outlined text-emerald-600">notifications</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden border border-zinc-100">
            <img
              alt="Profile"
              className="w-full h-full object-cover"
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone}`}
            />
          </div>
        </div>
      </header>

      <main className="pt-24 px-4 max-w-[480px] mx-auto">
        {/* Profile Picture Section */}
        <section className="flex flex-col items-center mb-8">
          <div className="relative">
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="w-32 h-32 rounded-full border-4 border-white ring-1 ring-zinc-200 overflow-hidden bg-zinc-100">
              <img
                alt="Avatar"
                className="w-full h-full object-cover"
                src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.phone}`}
              />
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="absolute bottom-0 right-0 bg-emerald-600 text-white p-3 rounded-full border-4 border-white transition-all duration-200 active:scale-90 flex items-center justify-center disabled:opacity-60"
            >
              {avatarUploading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
              }
            </button>
          </div>
          <p className="mt-4 text-sm font-semibold text-zinc-500">แก้ไขรูปโปรไฟล์</p>
        </section>

        {/* Edit Form */}
        <section className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <h3 className="text-emerald-700 font-extrabold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-[20px]">person</span>
              ข้อมูลส่วนตัว
            </h3>
            <div className="space-y-5">
              {/* Read-only Phone */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-400 px-1 uppercase tracking-wide">หมายเลขโทรศัพท์ (ไม่สามารถแก้ไขได้)</label>
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400">
                  <span className="material-symbols-outlined text-zinc-400">call</span>
                  <span className="font-medium">{profile?.phone || '—'}</span>
                  <span className="ml-auto material-symbols-outlined text-zinc-300">lock</span>
                </div>
              </div>
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-700 px-1 uppercase tracking-wide" htmlFor="full_name">ชื่อ-นามสกุล</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-emerald-600">person</span>
                  <input
                    id="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-medium"
                  />
                </div>
              </div>
              {/* Email (read-only, shown from auth) */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-400 px-1 uppercase tracking-wide">อีเมล (ไม่สามารถแก้ไขได้)</label>
                <div className="flex items-center gap-3 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-zinc-400">
                  <span className="material-symbols-outlined text-zinc-400">mail</span>
                  <span className="font-medium">{user?.email || '—'}</span>
                  <span className="ml-auto material-symbols-outlined text-zinc-300">lock</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-white p-6 rounded-2xl border border-zinc-100">
            <h3 className="text-emerald-700 font-extrabold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
              <span className="material-symbols-outlined text-[20px]">verified_user</span>
              ข้อมูลความปลอดภัย
            </h3>
            <div className="divide-y divide-zinc-50">
              <div onClick={() => navigate('/change-password')} className="py-4 flex justify-between items-center group cursor-pointer">
                <div>
                  <p className="font-bold text-zinc-800">เปลี่ยนรหัสผ่าน</p>
                  <p className="text-xs text-zinc-500 font-medium">เปลี่ยนรหัสผ่านของบัญชี</p>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:text-emerald-600 transition-colors">chevron_right</span>
              </div>
              <div onClick={() => navigate('/change-password')} className="py-4 flex justify-between items-center group cursor-pointer">
                <div>
                  <p className="font-bold text-zinc-800">PIN 4 หลัก</p>
                  <p className="text-xs text-zinc-500 font-medium">ตั้งหรือเปลี่ยน PIN สำหรับถอนเงิน</p>
                </div>
                <span className="material-symbols-outlined text-zinc-300 group-hover:text-emerald-600 transition-colors">chevron_right</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full py-4 bg-emerald-600 text-white font-extrabold rounded-full active:scale-[0.98] transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'บันทึกการเปลี่ยนแปลง'
              )}
            </button>
            <button
              onClick={() => { signOut(); navigate('/login'); }}
              className="w-full py-4 bg-white text-red-500 border border-red-100 font-extrabold rounded-full active:scale-[0.98] transition-all duration-200 uppercase tracking-wider"
            >
              ออกจากระบบ
            </button>
          </div>

          <div className="text-center pb-8">
            <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">TH-LOTTO Premium</p>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
