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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [banks, setBanks] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('TH LOTTO');
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
    supabase.from('settings')
      .select('key,value')
      .in('key', ['site_logo_url', 'site_name'])
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach(s => { map[s.key] = s.value });
          if (map.site_logo_url) setLogoUrl(map.site_logo_url);
          if (map.site_name) setSiteName(map.site_name);
        }
      });
  }, []);

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
      setError('รหัสผ่านต้องมี 4 หลัก');
      return;
    }
    if (formData.pin !== formData.confirm_pin) {
      setError('รหัสผ่านไม่ตรงกัน');
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
      // Pre-check: เบอร์นี้มีในระบบแล้วหรือยัง (ผ่าน RPC — ไม่ expose ข้อมูล profiles)
      const { data: phoneExists } = await supabase.rpc('check_phone_exists', { p_phone: formData.phone });
      if (phoneExists) {
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
      const raw = (err.message || '').toLowerCase();
      let msg = err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      if (raw.includes('duplicate') || raw.includes('unique') || raw.includes('already') || raw.includes('database error saving new user')) {
        msg = 'เบอร์นี้ถูกใช้สมัครสมาชิกไปแล้ว กรุณาเข้าสู่ระบบ หรือใช้เบอร์อื่น';
      } else if (raw.includes('password')) {
        msg = 'รหัสผ่านไม่ถูกต้องตามรูปแบบ';
      } else if (raw.includes('network') || raw.includes('fetch')) {
        msg = 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่';
      }
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex antialiased">
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-12 xl:p-16 flex-col justify-between select-none">
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="size-13 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 shadow-lg p-0.5">
            <img
              src={logoUrl || '/logo.svg'}
              alt={siteName}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-white">{siteName}</span>
              <span className="material-symbols-outlined text-emerald-400 text-base" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <p className="text-xs font-medium text-emerald-200/90 tracking-wider uppercase">สมัครสมาชิกใหม่</p>
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-emerald-200 mb-6">
            <span className="material-symbols-outlined text-sm text-emerald-400">lock</span>
            ข้อมูลปลอดภัย ไม่เปิดเผยต่อบุคคลภายนอก 100%
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white mb-6">
            เปิดบัญชีง่าย ภายใน 1 นาที
            <br />
            <span className="text-emerald-300">เริ่มแทงหวยและรับรางวัลทันที</span>
          </h2>

          <ul className="space-y-4 text-sm text-emerald-100/90 font-medium">
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>ฟรีค่าธรรมเนียมสมัครสมาชิก ไม่มีขั้นต่ำในการฝาก</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>ระบบผูกบัญชีธนาคารอัตโนมัติ ถอนเงินเข้าบัญชีตรง ปลอดภัยสูงสุด</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>บริการลูกค้าตลอด 24 ชั่วโมง มีทีมงานดูแลช่วยเหลืออย่างมืออาชีพ</span>
            </li>
          </ul>

          <div className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">0 บาท</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">ค่าสมัคร</p>
            </div>
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">1 นาที</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">เปิดบัญชีเสร็จ</p>
            </div>
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">24 ชม.</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">ดูแลตลอดเวลา</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-emerald-300/60 flex items-center justify-between">
          <p>© {new Date().getFullYear()} {siteName}. สงวนลิขสิทธิ์ทุกประการ</p>
          <span>มาตรฐานความปลอดภัยระดับสูง</span>
        </div>
      </aside>

      <main className="flex-1 flex flex-col justify-center items-center px-5 sm:px-8 py-10 min-h-screen bg-white">
        <div className="w-full max-w-[440px] mx-auto">
          <div className="lg:hidden flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-white shadow-xs p-0.5 mb-2">
              <img
                alt={siteName}
                className="w-full h-full object-cover rounded-full"
                src={logoUrl || '/logo.svg'}
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{siteName}</h1>
            <span className="text-[#008a3e] text-[11px] font-bold tracking-widest uppercase">การลงทะเบียนสมาชิก</span>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-slate-900 text-sm font-bold">
                  {step === 1 ? 'ขั้นตอนที่ 1: ข้อมูลส่วนตัว' : 'ขั้นตอนที่ 2: ข้อมูลบัญชีธนาคาร'}
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {step === 1 ? 'กำหนดเบอร์และรหัสผ่าน' : 'สำหรับรับเงินรางวัลอัตโนมัติ'}
                </p>
              </div>
              <span className="text-[#008a3e] text-xs font-bold bg-[#008a3e]/10 px-3 py-1 rounded-full">
                {step === 1 ? '50%' : '100%'}
              </span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-[#008a3e] transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">error</span>
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">หมายเลขโทรศัพท์</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <span className="flex h-full items-center border-r border-slate-200 px-3.5 text-xs font-bold text-slate-500 bg-slate-100/70">
                    โทร. +66
                  </span>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    type="tel"
                    placeholder="0812345678"
                    className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชื่อ-นามสกุล (ตรงกับบัญชีธนาคาร)</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <span className="flex h-full items-center pl-3.5 pr-2 text-slate-400">
                    <span className="material-symbols-outlined text-lg">person</span>
                  </span>
                  <input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    required
                    type="text"
                    placeholder="นายสมชาย ใจดี"
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">รหัสผ่าน PIN (4 หลัก)</label>
                <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <input
                    name="pin"
                    type={showPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={formData.pin}
                    onChange={handleInputChange}
                    required
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-center tracking-[0.5em] text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors p-1"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">ยืนยันรหัสผ่าน PIN</label>
                <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <input
                    name="confirm_pin"
                    type={showConfirmPassword ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={formData.confirm_pin}
                    onChange={handleInputChange}
                    required
                    className="h-full min-w-0 flex-1 bg-transparent px-4 text-center tracking-[0.5em] text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors p-1"
                    tabIndex={-1}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">รหัสผู้แนะนำ (ไม่บังคับ)</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <span className="flex h-full items-center pl-3.5 pr-2 text-slate-400">
                    <span className="material-symbols-outlined text-lg">redeem</span>
                  </span>
                  <input
                    name="referral_code"
                    value={formData.referral_code}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="เช่น: FRIEND100"
                    className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2.5 h-12 text-white font-bold text-base rounded-2xl active:scale-[0.99] transition-all shadow-md shadow-emerald-900/20 cursor-pointer mt-6"
                style={{ background: 'linear-gradient(to bottom, #15803d, #166534)' }}
              >
                <span>ถัดไป: ผูกบัญชีธนาคาร</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>ย้อนกลับไปแก้ไขข้อมูล</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  เลือกธนาคารของคุณ
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {banks.map((b) => (
                    <button
                      type="button"
                      key={b.name}
                      onClick={() => setFormData(prev => ({ ...prev, bank_name: b.name }))}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                        formData.bank_name === b.name
                          ? 'border-[#008a3e] bg-[#008a3e]/5 text-[#008a3e] shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-100 flex items-center justify-center p-1 mb-1.5">
                        {b.image_url ? (
                          <img src={b.image_url} alt={b.label} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-slate-800">{b.name}</span>
                        )}
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-full">{b.label}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, bank_name: 'OTHER' }))}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      formData.bank_name === 'OTHER'
                        ? 'border-[#008a3e] bg-[#008a3e]/5 text-[#008a3e] shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 mb-1.5">
                      <span className="material-symbols-outlined text-lg">add</span>
                    </div>
                    <span className="text-[11px] font-bold">อื่นๆ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชื่อบัญชีธนาคาร</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <input
                    name="bank_account_name"
                    value={formData.bank_account_name}
                    onChange={handleInputChange}
                    required
                    placeholder="ชื่อ-นามสกุล ตามหน้าสมุดบัญชี"
                    className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">หมายเลขบัญชีธนาคาร</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-[#008a3e] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008a3e]/15">
                  <input
                    name="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={handleInputChange}
                    required
                    placeholder="xxx-x-xxxxx-x"
                    className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#008a3e] text-lg shrink-0 mt-0.5">verified_user</span>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  ชื่อบัญชีธนาคารต้องตรงกับชื่อที่ลงทะเบียนเพื่อความรวดเร็วในการถอนเงินรางวัลแบบอัตโนมัติ
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 h-12 text-white font-bold text-base rounded-2xl active:scale-[0.99] transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 cursor-pointer mt-6"
                style={{ background: 'linear-gradient(to bottom, #15803d, #166534)' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ยืนยันและสมัครสมาชิก</span>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Register;
