import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Check, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Lock, 
  Zap, 
  Headphones,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';
import { prewarmClientGeo } from '../services/authService';

const FEATURE_LIST = [
  "ระบบคำนวณและปรับยอดรางวัลอัตโนมัติ แม่นยำทุกมาร์เก็ต",
  "ถ่ายทอดสดสัญญาณผลรางวัลเรียลไทม์ โปร่งใส ตรวจสอบได้",
  "ธุรกรรมการเงินอัตโนมัติ รวดเร็ว ปลอดภัย ได้รับการรับรอง",
];

const STATS = [
  { value: "9", label: "ตลาดหวยชั้นนำ" },
  { value: "100%", label: "การันตีความมั่นคง" },
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

const Login = () => {
  const [phone, setPhone] = useState(() => localStorage.getItem('thlotto_phone') || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('thlotto_remember') === 'true');
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('TH LOTTO');
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockSeconds(prev => {
        if (prev <= 1) { setError(''); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (lockSeconds > 0) return;

    if (!phone || phone.length !== 10) {
      setError('กรุณากรอกหมายเลขโทรศัพท์ 10 หลัก');
      return;
    }
    if (!pin || pin.trim().length === 0) {
      setError('กรุณากรอกรหัสผ่าน หรือ PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (rememberMe) {
        localStorage.setItem('thlotto_phone', phone);
        localStorage.setItem('thlotto_remember', 'true');
      } else {
        localStorage.removeItem('thlotto_phone');
        localStorage.removeItem('thlotto_remember');
      }

      const { data, error: authError } = await signIn(phone, pin, rememberMe);

      if (authError) {
        if (authError.status === 429) {
          setLockSeconds(300);
          setError('พยายามเข้าสู่ระบบมากเกินไป กรุณารอ 5 นาที');
        } else if (authError.message?.includes('Invalid login credentials')) {
          setError('หมายเลขโทรศัพท์หรือรหัสผ่าน / PIN ไม่ถูกต้อง');
        } else {
          setError(authError.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        }
        return;
      }

      if (data?.session) {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
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
              <p className="text-xs font-medium tracking-wide text-brand-200">ระบบสลากและล็อตโต้ออนไลน์</p>
            </div>
          </div>

          {/* คำโปรยและจุดเด่น */}
          <div className="mt-auto pt-10">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-brand-100 ring-1 ring-inset ring-white/15">
              <ShieldCheck className="size-3.5" />
              มาตรฐานความปลอดภัยข้อมูล SSL 256-Bit
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-snug tracking-tight text-white xl:text-4xl">
              ระบบสลากและล็อตโต้ออนไลน์
              <br />
              มาตรฐานความมั่นคงระดับสูง
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
        <div className="w-full max-w-[420px] mx-auto">
          {/* แถบแบรนด์มือถือ (เมื่ออยู่บนจอมือถือ) */}
          <div className="relative overflow-hidden bg-gradient-to-r from-brand-950 via-brand-900 to-brand-800 px-5 py-5 lg:hidden rounded-2xl mb-8 text-white shadow-xs">
            <div className="absolute -right-10 -top-14 size-40 rounded-full bg-brand-500/15 blur-xl pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <img
                src={logoUrl || '/logo.svg'}
                alt={siteName}
                className="size-11 rounded-full object-cover ring-2 ring-white/25"
              />
              <div className="min-w-0">
                <p className="text-base font-bold tracking-tight text-white">{siteName}</p>
                <p className="truncate text-xs font-medium text-brand-200">เข้าสู่ระบบสมาชิก</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-brand-100 ring-1 ring-inset ring-white/15">
                <ShieldCheck className="size-3.5" />
                SSL 256-Bit
              </span>
            </div>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">เข้าสู่ระบบสมาชิก</h2>
            <p className="text-slate-500 text-sm mt-1.5">กรุณากรอกหมายเลขโทรศัพท์และรหัส PIN 4 หลักเพื่อเข้าใช้งาน</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-3">
              <AlertCircle className="size-5 text-red-600 shrink-0" />
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Phone Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="phone">
                หมายเลขโทรศัพท์
              </label>
              <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
                <span className="flex h-full items-center border-r border-slate-200 px-3.5 text-xs font-bold text-slate-500 bg-slate-100/70">
                  โทร. +66
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="0812345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>

            {/* รหัสผ่าน / PIN Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="pin">
                  รหัสผ่าน / PIN
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-brand-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-600/15">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  placeholder="กรอกรหัสผ่าน หรือ PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors p-1"
                  tabIndex={-1}
                  aria-label={showPin ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 text-brand-600 border-slate-300 rounded focus:ring-brand-600 accent-brand-600"
                />
                <span className="text-xs font-medium text-slate-600">จดจำหมายเลขโทรศัพท์ในเครื่องนี้</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || lockSeconds > 0 || googleLoading}
              className="w-full flex items-center justify-center gap-2 h-12 text-white font-bold text-sm tracking-wide rounded-2xl active:scale-[0.99] transition-all bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-600/20 disabled:opacity-50 mt-4 cursor-pointer"
            >
              {loading ? (
                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : lockSeconds > 0 ? (
                <span>ถูกล็อค {Math.floor(lockSeconds / 60)}:{String(lockSeconds % 60).padStart(2, '0')}</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <ArrowRight className="size-4" />
                </>
              )}
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

          {/* Register Callout */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ยังไม่มีบัญชีสมาชิก?{' '}
              <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700 hover:underline ml-1">
                สมัครสมาชิกใหม่ฟรี
              </Link>
            </p>
          </div>

          {/* Trust Badges — Official Lucide Vector Icons (No Emojis) */}
          <div className="mt-8 grid grid-cols-3 gap-2.5 pt-4">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-center flex flex-col items-center">
              <ShieldCheck className="size-4 text-brand-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">ความปลอดภัย</p>
              <p className="text-xs text-slate-500 mt-0.5">SSL 256-Bit</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-center flex flex-col items-center">
              <Zap className="size-4 text-amber-500 mb-1" />
              <p className="text-xs font-bold text-slate-800">ธุรกรรมออโต้</p>
              <p className="text-xs text-slate-500 mt-0.5">ปรับยอดทันที</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 text-center flex flex-col items-center">
              <Headphones className="size-4 text-brand-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">ศูนย์บริการ</p>
              <p className="text-xs text-slate-500 mt-0.5">ดูแล 24 ชม.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
