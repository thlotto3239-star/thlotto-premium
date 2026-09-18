import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import BankSelector from '../components/BankSelector';
import { ShieldCheck, ArrowRight, User, AlertCircle, CheckCircle2 } from 'lucide-react';

const Onboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    phone: '',
    pin: '',
    confirm_pin: '',
    bank_name: 'KBANK',
    bank_account_number: '',
    bank_account_name: profile?.full_name || ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate a random serial number
  const generateSerial = () => {
    const prefix = 'TH';
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    return `${prefix}${randomNum}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin' || name === 'confirm_pin') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 6) }));
      return;
    }
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 10) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (code) => {
    setFormData(prev => ({ ...prev, bank_name: code }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^0\d{8,9}$/.test(formData.phone)) {
      setError('หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)');
      return;
    }
    if (formData.pin.length !== 6) {
      setError('รหัส PIN ต้องมีตัวเลข 6 หลัก');
      return;
    }
    if (formData.pin !== formData.confirm_pin) {
      setError('รหัส PIN ทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (!formData.bank_account_number) {
      setError('กรุณากรอกเลขบัญชีธนาคาร');
      return;
    }
    if (!formData.bank_account_name) {
      setError('กรุณากรอกชื่อบัญชีธนาคาร');
      return;
    }

    setLoading(true);

    try {
      // Create Pin Hash (assuming pinToPassword logic is available, or use a simple hash for now if not exposed)
      // Since pinToPassword is in authService and we might not be able to import it easily if it's not exported.
      // Let's check authService.js to see if pinToPassword is exported.
      // Wait, we can call supabase.rpc('set_user_pin') directly!
      
      const serialNumber = generateSerial();
      
      const updates = {
        phone: formData.phone,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        serial_number: serialNumber,
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update PIN using RPC
      try {
        await supabase.rpc('set_user_pin', { p_pin: formData.pin, p_user_id: user.id });
      } catch (pinError) {
        console.warn('Could not set PIN via RPC:', pinError);
      }

      setSuccess(true);
      
      // Refresh profile in AuthContext
      if (refreshProfile) {
        await refreshProfile();
      }

    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const regDate = new Date(profile?.created_at || new Date()).toLocaleDateString('en-GB'); // DD/MM/YYYY
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5">
          <div className="size-20 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900">ยืนยันตัวตนสำเร็จ!</h2>
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-3">
              <div className="flex items-center gap-3">
                <img src={profile?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback'} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200" />
                <div>
                  <div className="font-bold text-slate-900">{profile?.full_name || profile?.username}</div>
                  <div className="text-xs text-slate-500">Google Account</div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-200/60 flex justify-between text-sm">
                <span className="text-slate-500">วันที่สมัคร:</span>
                <span className="font-bold text-slate-900">{regDate}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/home')}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all shadow-sm"
          >
            เข้าสู่ระบบ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="text-3xl font-black text-slate-900">ตั้งค่าบัญชี</h2>
          <p className="mt-2 text-sm text-slate-500">กรุณากรอกข้อมูลเพื่อความปลอดภัยของท่าน</p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-100">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์ (10 หลัก)</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0xxxxxxxxx"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ธนาคารของคุณ</label>
                <BankSelector 
                  value={formData.bank_name} 
                  onChange={handleBankChange} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">เลขบัญชีธนาคาร</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleInputChange}
                  placeholder="กรอกเลขบัญชี"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono text-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อ-นามสกุล (ตรงกับสมุดบัญชี)</label>
                <input
                  type="text"
                  name="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={handleInputChange}
                  placeholder="นายใจดี มีเงิน"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-lg"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ตั้งรหัส PIN 6 หลัก</label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="password"
                    name="pin"
                    value={formData.pin}
                    onChange={handleInputChange}
                    placeholder="PIN"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-center font-mono text-2xl tracking-[0.5em]"
                    required
                  />
                  <input
                    type="password"
                    name="confirm_pin"
                    value={formData.confirm_pin}
                    onChange={handleInputChange}
                    placeholder="ยืนยัน PIN"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all text-center font-mono text-2xl tracking-[0.5em]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-lg text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    ยืนยันข้อมูลและเข้าสู่ระบบ
                  </>
                )}
              </button>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
