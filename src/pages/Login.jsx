import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [phone, setPhone] = useState(() => localStorage.getItem('thlotto_phone') || '');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockSeconds, setLockSeconds] = useState(0);
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('thlotto_remember') === 'true');
  const [logoUrl, setLogoUrl] = useState('');
  const [siteName, setSiteName] = useState('TH LOTTO');
  const { signIn } = useAuth();
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

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('กรุณากรอกรหัสผ่าน 4 หลัก');
      return;
    }
    if (lockSeconds > 0) return;
    setLoading(true);
    setError('');

    try {
      // ตรวจ rate limit ก่อน login
      const { data: rlCheck } = await supabase.rpc('check_login_rate_limit', { p_phone: phone });
      if (rlCheck?.locked) {
        setLockSeconds(Math.max(rlCheck.remaining_seconds || 60, 1));
        setError(`บัญชีถูกล็อคชั่วคราว กรุณารอ ${Math.ceil((rlCheck.remaining_seconds || 60) / 60)} นาที`);
        return;
      }

      const { error: signInError } = await signIn(phone, pin, rememberMe);
      if (signInError) {
        // บันทึก failed attempt
        await supabase.rpc('record_login_attempt', { p_phone: phone, p_success: false });
        const remaining = (rlCheck?.remaining_attempts ?? 5) - 1;
        setError(`เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง${remaining > 0 ? ` (เหลืออีก ${remaining} ครั้ง)` : ''}`);
        if (remaining <= 0) {
          setLockSeconds(900);
          setError('ใส่รหัสผ่านผิดเกินจำนวนครั้ง บัญชีถูกล็อค 15 นาที');
        }
        return;
      }
      
      // บันทึกการตั้งค่าจำฉันไว้
      localStorage.setItem('thlotto_remember', rememberMe.toString());

      // บันทึก success → ลบ failed records
      await supabase.rpc('record_login_attempt', { p_phone: phone, p_success: true });
      localStorage.setItem('thlotto_phone', phone);
      localStorage.setItem('thlotto_remember', rememberMe.toString());
      navigate('/home');
    } catch (err) {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex antialiased">
      {/* ─── Desktop Left Brand Showcase Panel (Visible on lg+) ─── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 text-white p-12 xl:p-16 flex-col justify-between select-none">
        {/* Subtle Background Pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        {/* Glow Spheres */}
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-emerald-600/20 blur-3xl pointer-events-none" />

        {/* Top: Brand Logo & Title */}
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
            <p className="text-xs font-medium text-emerald-200/90 tracking-wider uppercase">Official Lottery & Lotto Platform</p>
          </div>
        </div>

        {/* Center: Main Headline & Official Guarantees */}
        <div className="relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur-md border border-white/15 text-emerald-200 mb-6">
            <span className="material-symbols-outlined text-sm text-emerald-400">shield_lock</span>
            ระบบความปลอดภัยมาตรฐานระดับสากล SSL 256-Bit
          </div>

          <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight tracking-tight text-white mb-6">
            สลากและล็อตโต้ออนไลน์
            <br />
            <span className="text-emerald-300">โปร่งใส ปลอดภัย จ่ายจริง 100%</span>
          </h2>

          <ul className="space-y-4 text-sm text-emerald-100/90 font-medium">
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>อัตราจ่ายสูงสุด 3 ตัวบาทละ 900 / 2 ตัวบาทละ 95</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>ล็อตโต้ 15 นาที ออกผลสดด้วยลูกบอลจริง วันละ 58 รอบ ตลอด 24 ชม.</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 text-xs shrink-0 font-bold">✓</span>
              <span>ฝาก-ถอนออโต้ ตรวจสอบสลิปผ่าน QR รวดเร็วภายใน 10 วินาที</span>
            </li>
          </ul>

          {/* Key Stats Counter */}
          <div className="mt-10 grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">฿900</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">จ่ายสูงสุด 3 ตัว</p>
            </div>
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">58 รอบ</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">ล็อตโต้ต่อวัน</p>
            </div>
            <div>
              <p className="text-2xl xl:text-3xl font-black text-white font-mono">24 ชม.</p>
              <p className="text-xs text-emerald-300/80 mt-1 font-medium">บริการข้อมูลสด</p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="relative z-10 text-xs text-emerald-300/60 flex items-center justify-between">
          <p>© {new Date().getFullYear()} {siteName}. สงวนลิขสิทธิ์ทุกประการ</p>
          <span>ความมั่นคงทางการเงิน 100%</span>
        </div>
      </aside>

      {/* ─── Right Form Side (Desktop & Mobile Clean Form) ─── */}
      <main className="flex-1 flex flex-col justify-center items-center px-5 sm:px-8 py-10 min-h-screen bg-white">
        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile-only Top Brand Header */}
          <div className="lg:hidden flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 bg-white shadow-xs p-0.5 mb-2">
              <img
                alt={siteName}
                className="w-full h-full object-cover rounded-full"
                src={logoUrl || '/logo.svg'}
              />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{siteName}</h1>
            <span className="text-primary text-[11px] font-bold tracking-widest uppercase">เข้าสู่ระบบ</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">ยินดีต้อนรับกลับมา</h2>
            <p className="text-slate-500 text-sm mt-1.5">กรุณากรอกข้อมูลเพื่อเข้าใช้งานบัญชีของคุณ</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200/80 rounded-2xl flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">error</span>
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Phone */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="phone">
                หมายเลขโทรศัพท์
              </label>
              <div className="flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/15">
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

            {/* PIN/Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="pin">
                  รหัสผ่าน (4 หลัก)
                </label>
                <Link to="/forgot-password" className="text-xs font-bold text-primary hover:underline">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative flex h-12 items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/15">
                <input
                  id="pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  required
                  className="h-full min-w-0 flex-1 bg-transparent px-4 text-center tracking-[0.5em] text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors p-1"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPin ? 'visibility' : 'visibility_off'}
                  </span>
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
                  className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary accent-emerald-700"
                />
                <span className="text-xs font-medium text-slate-600">จดจำเบอร์โทรศัพท์ในเครื่องนี้</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || lockSeconds > 0}
              className="w-full flex items-center justify-center gap-2.5 h-12 text-white font-bold text-base rounded-2xl active:scale-[0.99] transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50 mt-4 cursor-pointer"
              style={{ background: lockSeconds > 0 ? '#dc2626' : 'linear-gradient(to bottom, #15803d, #166534)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : lockSeconds > 0 ? (
                <span>ถูกล็อค {Math.floor(lockSeconds / 60)}:{String(lockSeconds % 60).padStart(2, '0')}</span>
              ) : (
                <>
                  <span>เข้าสู่ระบบ</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Register Callout */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              ยังไม่มีบัญชีสมาชิก?{' '}
              <Link to="/register" className="text-primary font-bold hover:underline ml-1">
                สมัครสมาชิกใหม่ฟรี
              </Link>
            </p>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-8 grid grid-cols-3 gap-2.5 pt-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
              <p className="text-[11px] font-bold text-slate-800 mt-1">ปลอดภัย</p>
              <p className="text-[9px] text-slate-400">SSL 256-bit</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <span className="material-symbols-outlined text-amber-500 text-xl">bolt</span>
              <p className="text-[11px] font-bold text-slate-800 mt-1">ฝากถอนไว</p>
              <p className="text-[9px] text-slate-400">ออโต้ 10 วิ</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <span className="material-symbols-outlined text-teal-500 text-xl">support_agent</span>
              <p className="text-[11px] font-bold text-slate-800 mt-1">บริการ 24 ชม.</p>
              <p className="text-[9px] text-slate-400">ดูแลตลอดเวลา</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
