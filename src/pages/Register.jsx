import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  Gift, 
  AlertCircle, 
  Plus, 
  CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { prewarmClientGeo } from '../services/authService';

const FEATURE_LIST = [
  "ระบบผูกบัญชีธนาคารอัตโนมัติ ถอนเงินเข้าบัญชีตรง ปลอดภัยสูงสุด",
  "ระบบคำนวณและปรับยอดรางวัลอัตโนมัติ แม่นยำทุกมาร์เก็ต",
  "บริการสมาชิกตลอด 24 ชั่วโมง พร้อมทีมงานดูแลอย่างมืออาชีพ",
];

const STATS = [
  { value: "0 บาท", label: "ค่าธรรมเนียมสมัคร" },
  { value: "100%", label: "ระบบอัตโนมัติ" },
  { value: "24/7", label: "ศูนย์บริการสมาชิก" },
];

function GoogleLogo({ className, size = 18 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.97 11.97 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [banks, setBanks] = useState([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('TH LOTTO');
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referral_code: ref }));
    }
  }, [searchParams]);

  useEffect(() => {
    prewarmClientGeo();
    supabase.from('settings')
      .select('key,value')
      .in('key', ['site_logo_url', 'site_name'])
      .then(({ data }) => {
        if (data) {
          const map = {};
          data.forEach(s => { map[s.key] = s.value; });
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
      setError('หมายเลขโทรศัพท์ไม่ถูกต้อง (ต้องขึ้นต้นด้วย 0 และมี 10 หลัก)');
      return;
    }
    if (!formData.full_name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (formData.pin.length !== 4) {
      setError('รหัส PIN ต้องมีตัวเลข 4 หลัก');
      return;
    }
    if (formData.pin !== formData.confirm_pin) {
      setError('รหัส PIN ทั้งสองช่องไม่ตรงกัน');
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
      const { data: phoneExists } = await supabase.rpc('check_phone_exists', { p_phone: formData.phone });
      if (phoneExists) {
        throw new Error('หมายเลขโทรศัพท์นี้ถูกใช้สมัครสมาชิกไปแล้ว กรุณาเข้าสู่ระบบ หรือใช้หมายเลขอื่น');
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
        msg = 'หมายเลขโทรศัพท์นี้ถูกใช้สมัครสมาชิกไปแล้ว กรุณาเข้าสู่ระบบ หรือใช้หมายเลขอื่น';
      } else if (raw.includes('password') || raw.includes('pin')) {
        msg = 'รหัส PIN 4 หลักไม่ถูกต้องตามรูปแบบ';
      } else if (raw.includes('network') || raw.includes('fetch')) {
        msg = 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่';
      }
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError('');
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'ไม่สามารถเชื่อมต่อ Google ได้ กรุณาลองใหม่อีกครั้ง');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex antialiased">
      {/* ─── ฝั่งแบรนดิ้ง (ดึงสีและโครงสร้างจากโลโก้ทางการ ตรงกับ Admin Login) ─── */}
      <aside className="relative hidden w-[44%] overflow-hidden bg-brand-950 lg:flex xl:w-[50%] select-none">
        {/* พื้นหลังไล่เฉดเขียวจากโลโก้ */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800" />
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }}
        />
        {/* วงกลมตกแต่ง */}
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-500/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-600/20 blur-2xl pointer-events-none" />
        <div className="absolute right-16 top-1/3 size-24 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute right-32 top-1/2 size-40 rounded-full border border-white/5 pointer-events-none" />

        <div className="relative z-10 flex w-full flex-col px-10 py-9 xl:px-14">
          {/* โลโก้ + ชื่อระบบ */}
          <div className="flex items-center gap-3.5">
            <img
              src={logoUrl || '/logo.svg'}
              alt={siteName}
              className="size-13 rounded-full object-cover ring-2 ring-white/25"
            />
            <div>
              <p className="text-xl font-bold tracking-tight text-white">{siteName}</p>
              <p className="text-xs font-medium tracking-wide text-brand-200">สมัครสมาชิกใหม่</p>
            </div>
          </div>

          {/* คำโปรยและจุดเด่น */}
          <div className="mt-auto pt-10">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-brand-100 ring-1 ring-inset ring-white/15">
              <ShieldCheck className="size-3.5" />
              ระบบรับรองความปลอดภัยข้อมูลสมาชิก 100%
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight text-white xl:text-4xl">
              เปิดบัญชีสมาชิกใหม่
              <br />
              สะดวกรวดเร็วในไม่กี่ขั้นตอน
            </h2>
            <ul className="mt-6 space-y-3">
              {FEATURE_LIST.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-500/90">
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </span>
                  <span className="text-sm leading-relaxed text-brand-100">{f}</span>
                </li>
              ))}
            </ul>

            {/* ตัวเลขภาพรวมทางการ */}
            <div className="mt-8 flex items-center gap-6 border-t border-white/10 pt-6 xl:gap-9">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-bold text-white xl:text-3xl font-mono">{s.value}</p>
                  <p className="mt-0.5 text-xs text-brand-300">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-9 text-[11px] text-brand-300/70">
            © 2569 TH-LOTTO · สงวนลิขสิทธิ์ทุกประการ
          </p>
        </div>
      </aside>

      {/* ─── ฝั่งฟอร์มผู้ใช้ (Clean White Minimalist Form) ─── */}
      <main className="flex-1 flex flex-col justify-center items-center px-5 sm:px-8 py-10 min-h-screen bg-white">
        <div className="w-full max-w-[440px] mx-auto">
          {/* แถบแบรนด์มือถือ (เมื่ออยู่บนจอมือถือ) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 px-5 py-5 lg:hidden rounded-2xl mb-6 text-white shadow-xs">
            <div className="absolute -right-10 -top-14 size-40 rounded-full bg-brand-500/15 blur-xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <img
                src={logoUrl || '/logo.svg'}
                alt={siteName}
                className="size-11 rounded-full object-cover ring-2 ring-white/25"
              />
              <div className="min-w-0">
                <p className="text-base font-bold tracking-tight text-white">{siteName}</p>
                <p className="truncate text-xs font-medium text-brand-200">ลงทะเบียนสมาชิกใหม่</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/15">
                <ShieldCheck className="size-3.5" />
                SSL 256-Bit
              </span>
            </div>
          </div>

          {/* Progress Indicator Card */}
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-slate-900 text-sm font-bold">
                  {step === 1 ? 'ขั้นตอนที่ 1: ข้อมูลส่วนตัว' : 'ขั้นตอนที่ 2: ข้อมูลบัญชีธนาคาร'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">
                  {step === 1 ? 'กำหนดหมายเลขโทรศัพท์และรหัส PIN' : 'สำหรับรับเงินรางวัลอัตโนมัติ'}
                </p>
              </div>
              <span className="text-brand-700 text-xs font-bold bg-brand-50 border border-brand-200 px-3 py-1 rounded-full">
                {step === 1 ? '50%' : '100%'}
              </span>
            </div>
            <div className="relative h-2 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-brand-600 transition-all duration-500"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-3">
              <AlertCircle className="size-5 text-red-600 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleNextStep} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">หมายเลขโทรศัพท์</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
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
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
                  <span className="flex h-full items-center pl-3.5 pr-2 text-slate-400">
                    <User className="size-4 text-slate-400" />
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">รหัส PIN (4 หลัก)</label>
                <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
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
                    aria-label={showPassword ? 'ซ่อนรหัส PIN' : 'แสดงรหัส PIN'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">ยืนยันรหัส PIN (4 หลัก)</label>
                <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
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
                    aria-label={showConfirmPassword ? 'ซ่อนรหัส PIN' : 'แสดงรหัส PIN'}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">รหัสผู้แนะนำ (ไม่บังคับ)</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
                  <span className="flex h-full items-center pl-3.5 pr-2 text-slate-400">
                    <Gift className="size-4 text-slate-400" />
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
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 h-12 text-white font-bold text-sm tracking-wide rounded-2xl active:scale-[0.99] transition-all bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 cursor-pointer mt-6 disabled:opacity-50"
              >
                <span>ถัดไป: ผูกบัญชีธนาคาร</span>
                <ArrowRight className="size-4" />
              </button>

              {/* Divider */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="absolute bg-white px-3 text-xs font-semibold text-slate-400">
                  หรือ
                </span>
              </div>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border border-slate-200 bg-white font-semibold text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99] transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <div className="size-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                ) : (
                  <GoogleLogo size={20} />
                )}
                <span>{googleLoading ? 'กำลังเชื่อมต่อ Google...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft className="size-4" />
                  <span>ย้อนกลับไปแก้ไขข้อมูลส่วนตัว</span>
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
                          ? 'border-brand-600 bg-brand-50/50 text-brand-700 shadow-xs'
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
                        ? 'border-brand-600 bg-brand-50/50 text-brand-700 shadow-xs'
                        : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600 mb-1.5">
                      <Plus className="size-4" />
                    </div>
                    <span className="text-[11px] font-bold">อื่นๆ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">ชื่อบัญชีธนาคาร</label>
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
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
                <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
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

              <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-start gap-2.5">
                <ShieldCheck className="size-4 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-xs text-brand-900 leading-relaxed font-medium">
                  ชื่อบัญชีธนาคารต้องตรงกับชื่อที่ลงทะเบียนเพื่อความรวดเร็วในการถอนเงินรางวัลแบบอัตโนมัติ
                </p>
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-12 text-white font-bold text-sm tracking-wide rounded-2xl active:scale-[0.99] transition-all bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50 cursor-pointer mt-6"
              >
                {loading ? (
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ยืนยันและเปิดบัญชีสมาชิก</span>
                    <CheckCircle2 className="size-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Already have account */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              มีบัญชีสมาชิกอยู่แล้ว?{' '}
              <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700 hover:underline ml-1">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
