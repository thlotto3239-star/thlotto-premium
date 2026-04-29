import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    full_name: '',
    pin: '',
    confirm_pin: '',
    referral_code: '',
    bank_name: 'KBank',
    bank_account_number: '',
    bank_account_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [banks, setBanks] = useState([]);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referral_code: ref }));
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBanks = async () => {
      const { data } = await supabase
        .from('banks')
        .select('code, name, image_url')
        .eq('is_active', true)
        .order('name');
      if (data && data.length > 0) {
        setBanks(data.map(b => ({ name: b.code, label: b.name, image_url: b.image_url })));
        setFormData(prev => ({ ...prev, bank_name: data[0].code }));
      }
    };
    fetchBanks();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pin' || name === 'confirm_pin') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!/^0\d{8,9}$/.test(formData.phone)) {
      setError('เบอร์โทรศัพท์ไม่ถูกต้อง');
      return;
    }
    if (!formData.full_name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (formData.pin.length !== 4) {
      setError('PIN ต้องมี 4 หลัก');
      return;
    }
    if (formData.pin !== formData.confirm_pin) {
      setError('PIN ไม่ตรงกัน');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Pre-check: เบอร์นี้มีในระบบแล้วหรือยัง
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', formData.phone)
        .maybeSingle();
      if (existing) {
        throw new Error('เบอร์นี้ถูกใช้สมัครสมาชิกไปแล้ว กรุณาเข้าสู่ระบบ หรือใช้เบอร์อื่น');
      }

      const { error: signUpError } = await signUp({
        phone: formData.phone,
        pin: formData.pin,
        full_name: formData.full_name,
        bank_name: formData.bank_name,
        bank_account_number: formData.bank_account_number,
        bank_account_name: formData.bank_account_name,
        referral_code: formData.referral_code,
      });
      if (signUpError) throw signUpError;
      navigate('/registration-success');
    } catch (err) {
      // แปล error ทั่วไปจาก Supabase → ข้อความภาษาไทย
      const raw = (err.message || '').toLowerCase();
      let msg = err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      if (raw.includes('duplicate') || raw.includes('unique') || raw.includes('already') || raw.includes('database error saving new user')) {
        msg = 'เบอร์นี้ถูกใช้สมัครสมาชิกไปแล้ว กรุณาเข้าสู่ระบบ หรือใช้เบอร์อื่น';
      } else if (raw.includes('password')) {
        msg = 'PIN ไม่ถูกต้องตามรูปแบบ';
      } else if (raw.includes('network') || raw.includes('fetch')) {
        msg = 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่';
      }
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="bg-white min-h-screen font-headline">
        <div className="relative flex h-full min-h-screen w-full max-w-[430px] mx-auto flex-col bg-white overflow-x-hidden">
          {/* Header with Logo */}
          <div className="flex items-center px-6 pt-8 pb-4 justify-between bg-white sticky top-0 z-50">
            <button 
              onClick={() => navigate(-1)}
              className="text-slate-900 flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100"
            >
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                <img alt="TH LOTTO" className="w-full h-full object-cover" src="https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png" />
              </div>
              <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">TH LOTTO</h1>
              <span className="text-[#008a3e] text-[10px] font-extrabold tracking-[0.2em] uppercase">การลงทะเบียน</span>
            </div>
            <div className="size-10"></div>
          </div>

          <div className="flex flex-col gap-3 px-8 py-6">
            <div className="flex justify-between items-end mb-1">
              <div>
                <p className="text-slate-900 text-xl font-extrabold leading-none">ข้อมูลส่วนตัว</p>
                <p className="text-slate-500 text-xs font-medium mt-1">ขั้นตอนที่ 1 จาก 2</p>
              </div>
              <p className="text-[#008a3e] text-sm font-bold bg-[#008a3e]/10 px-4 py-1.5 rounded-full leading-normal">เสร็จสิ้น 50%</p>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="absolute top-0 left-0 h-full rounded-full bg-[#008a3e] transition-all duration-500" style={{ width: '50%' }}></div>
            </div>
          </div>

          {error && (
            <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500 text-sm">error</span>
              <p className="text-red-500 text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="flex-1 px-6 pb-12">
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-none">
              <h2 className="text-slate-900 text-2xl font-extrabold mb-8">สร้างบัญชีของคุณ</h2>
              <form onSubmit={handleNextStep} className="space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-bold ml-4">หมายเลขโทรศัพท์</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400">
                      <span className="material-symbols-outlined text-xl">phone_iphone</span>
                    </div>
                    <input 
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="flex w-full rounded-full border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-[#008a3e] focus:ring-2 focus:ring-[#008a3e]/20 transition-all outline-none" 
                      placeholder="08X-XXX-XXXX" 
                      type="tel" 
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-slate-700 text-sm font-bold ml-4">ชื่อ-นามสกุล</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400">
                      <span className="material-symbols-outlined text-xl">person</span>
                    </div>
                    <input 
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      required
                      className="flex w-full rounded-full border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-[#008a3e] focus:ring-2 focus:ring-[#008a3e]/20 transition-all outline-none" 
                      placeholder="สมชาย มุ่งมั่น" 
                      type="text" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-bold ml-4">ตั้งรหัส PIN</label>
                    <input
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      required
                      inputMode="numeric"
                      maxLength={4}
                      className="flex w-full rounded-full border-slate-200 bg-slate-50/50 py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-[#008a3e] focus:ring-2 focus:ring-[#008a3e]/20 transition-all outline-none"
                      placeholder="****"
                      type="password"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-700 text-sm font-bold ml-4">ยืนยันรหัส PIN</label>
                    <input
                      name="confirm_pin"
                      value={formData.confirm_pin}
                      onChange={handleInputChange}
                      required
                      inputMode="numeric"
                      maxLength={4}
                      className="flex w-full rounded-full border-slate-200 bg-slate-50/50 py-4 text-center text-xl font-bold tracking-[0.5em] text-slate-900 placeholder:text-slate-300 focus:border-[#008a3e] focus:ring-2 focus:ring-[#008a3e]/20 transition-all outline-none"
                      placeholder="****"
                      type="password"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between px-4">
                    <label className="text-slate-700 text-sm font-bold">รหัสแนะนำ</label>
                    <span className="text-slate-400 text-xs italic font-medium">ไม่บังคับ</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400">
                      <span className="material-symbols-outlined text-xl">redeem</span>
                    </div>
                    <input 
                      name="referral_code"
                      value={formData.referral_code}
                      onChange={handleInputChange}
                      className="flex w-full rounded-full border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-[#008a3e] focus:ring-2 focus:ring-[#008a3e]/20 transition-all outline-none" 
                      placeholder="เช่น: PREMIUM100" 
                      type="text" 
                    />
                  </div>
                </div>

                <div className="mt-12 space-y-6">
                  <button type="submit" className="w-full flex items-center justify-center gap-3 py-4 bg-[#008a3e] text-white font-extrabold text-lg rounded-full active:scale-[0.98] transition-all border-b-4 border-[#00602b]">
                    <span>ถัดไป: ข้อมูลธนาคาร</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </button>
                  <p className="text-center text-slate-400 text-[10px] px-4 leading-relaxed">
                    เมื่อคลิกถัดไป แสดงว่าคุณยอมรับ <Link to="/terms" className="text-[#008a3e] underline font-bold">ข้อกำหนดการให้บริการ</Link> และ <Link to="/privacy" className="text-[#008a3e] underline font-bold">นโยบายความเป็นส่วนตัว</Link> ของเรา
                  </p>
                </div>
              </form>
            </div>
          </div>
          
          <div className="flex justify-center pb-4 pt-4">
            <div className="w-32 h-1.5 bg-slate-100 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf8] min-h-screen flex justify-center items-start antialiased font-headline">
      <div 
        className="relative w-full max-w-[430px] min-h-screen flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#f8faf8',
          backgroundImage: 'radial-gradient(at 0% 0%, rgba(0, 138, 0, 0.03) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(0, 138, 0, 0.03) 0px, transparent 50%)'
        }}
      >
        <header className="pt-12 px-6 pb-6 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setStep(1)}
              className="text-slate-900 p-2 -ml-2 hover:bg-[#008a00]/10 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[28px]">chevron_left</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#008a00] mb-1">ขั้นตอนที่ 2 จาก 2</span>
              <div className="flex gap-1.5 items-center">
                <div className="h-1.5 w-8 rounded-full bg-[#008a00]/20"></div>
                <div className="h-1.5 w-12 rounded-full bg-[#008a00]"></div>
              </div>
            </div>
            <div className="w-10"></div>
          </div>
          <div className="flex flex-col items-center text-center space-y-3">
            <img alt="TH LOTTO Logo" className="w-20 h-20 drop-shadow-sm" src="https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png"/>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">TH <span className="text-[#008a00]">LOTTO</span></h1>
              <p className="text-slate-500 text-sm max-w-[320px] mx-auto leading-relaxed">
                ตั้งค่าข้อมูลธนาคารของคุณเพื่อรับรางวัลโดยอัตโนมัติและปลอดภัย
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-12 relative z-10">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-8 shadow-sm">
            
            {error && (
              <div className="mb-2 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                <p className="text-red-500 text-xs font-bold">{error}</p>
              </div>
            )}

            <section>
              <h3 className="text-sm font-semibold text-slate-800 mb-4 px-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#008a00] text-lg">account_balance</span>
                เลือกธนาคารของคุณ
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {banks.map((bank) => (
                  <button
                    type="button"
                    key={bank.name}
                    onClick={() => setFormData(prev => ({ ...prev, bank_name: bank.name }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                      formData.bank_name === bank.name
                      ? 'border-[#008a00] bg-[#008a00]/5'
                      : 'border-slate-100 bg-slate-50/30 hover:border-[#008a00]/30'
                    }`}
                  >
                    <div className="w-10 h-10 mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100">
                      {bank.image_url ? (
                        <img src={bank.image_url} alt={bank.label} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#008a00] font-black text-[9px]">{bank.name}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 text-center leading-tight">{bank.label}</span>
                  </button>
                ))}
                <button 
                  onClick={() => setFormData(prev => ({ ...prev, bank_name: 'OTHER' }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.bank_name === 'OTHER' 
                    ? 'border-[#008a00] bg-[#008a00]/5' 
                    : 'border-slate-100 bg-slate-50/30 hover:border-[#008a00]/30'
                  }`}
                >
                  <div className="w-10 h-10 mb-2 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                    <span className="material-symbols-outlined text-xl">add</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-700">อื่นๆ</span>
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 px-1 flex items-center gap-2" htmlFor="account-name">
                  <span className="material-symbols-outlined text-[#008a00] text-lg">person</span>
                  ชื่อบัญชีธนาคาร
                </label>
                <input 
                  id="account-name"
                  name="bank_account_name"
                  value={formData.bank_account_name}
                  onChange={handleInputChange}
                  required
                  className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base focus:outline-none focus:ring-2 focus:ring-[#008a00]/20 focus:border-[#008a00] transition-all placeholder:text-slate-400" 
                  placeholder="ชื่อ-นามสกุล ตามหน้าสมุดบัญชี" 
                  type="text"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-800 px-1 flex items-center gap-2" htmlFor="account-number">
                  <span className="material-symbols-outlined text-[#008a00] text-lg">payments</span>
                  หมายเลขบัญชีธนาคาร
                </label>
                <div className="relative">
                  <input 
                    id="account-number"
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleInputChange}
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-lg focus:outline-none focus:ring-2 focus:ring-[#008a00]/20 focus:border-[#008a00] transition-all placeholder:text-slate-400" 
                    placeholder="xxx-x-xxxxx-x" 
                    type="text"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#008a00]">
                    <span className="material-symbols-outlined text-xl">verified_user</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#008a00]/5 border border-[#008a00]/10 rounded-xl p-4 flex gap-3">
                <span className="material-symbols-outlined text-[#008a00] shrink-0">info</span>
                <p className="text-[12px] leading-relaxed text-slate-600">
                  โปรดตรวจสอบให้แน่ใจว่าชื่อบัญชีตรงกับชื่อที่ลงทะเบียนไว้เพื่อป้องกันความล่าช้าในการจ่ายเงิน
                </p>
              </div>
            </section>
          </div>
        </main>

        <footer className="mt-auto px-6 pb-12 pt-4 bg-white/50 backdrop-blur-md border-t border-slate-100/50 relative z-10">
          <button 
            onClick={handleRegister}
            disabled={loading}
            className="w-full h-14 rounded-xl text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-[#008a00] hover:bg-[#007a00] shadow-lg shadow-[#008a00]/20 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span>ยืนยันและสมัครสมาชิก</span>
                <span className="material-symbols-outlined text-[24px]">arrow_forward</span>
              </>
            )}
          </button>
          <p className="text-center mt-6 text-xs text-slate-400">
            Secure 256-bit SSL encrypted connection
          </p>
        </footer>

        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#008a00]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#008a00]/5 rounded-full blur-3xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Register;
