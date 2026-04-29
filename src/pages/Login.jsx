import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('กรุณากรอก PIN 4 หลัก');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(phone, pin);
      if (signInError) throw signInError;
      navigate('/home');
    } catch (err) {
      setError('เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex justify-center items-start antialiased">
      <div className="relative w-full max-w-[430px] min-h-screen flex flex-col bg-white overflow-x-hidden">
        {/* Header with Logo */}
        <div className="flex items-center px-6 pt-8 pb-4 justify-between bg-white sticky top-0 z-50">
          <div className="w-10 h-10" />
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
              <img
                alt="TH LOTTO"
                className="w-full h-full object-cover"
                src="https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png"
              />
            </div>
            <h1 className="text-slate-900 text-lg font-bold leading-tight tracking-tight">TH LOTTO</h1>
            <span className="text-primary text-[10px] font-extrabold tracking-[0.2em] uppercase">เข้าสู่ระบบ</span>
          </div>
          <div className="w-10 h-10" />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-12">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100">
            <h2 className="text-slate-900 text-2xl font-extrabold mb-2">ยินดีต้อนรับกลับมา</h2>
            <p className="text-slate-500 text-sm font-medium mb-8">กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500 shrink-0 text-xl">error</span>
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-bold ml-4" htmlFor="phone">หมายเลขโทรศัพท์</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-xl">phone_iphone</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="08X-XXX-XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 pl-14 pr-6 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                  />
                </div>
              </div>

              {/* PIN */}
              <div className="flex flex-col gap-2">
                <label className="text-slate-700 text-sm font-bold ml-4" htmlFor="pin">รหัสความปลอดภัย (PIN)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-6 text-slate-400 pointer-events-none">
                    <span className="material-symbols-outlined text-xl">lock</span>
                  </div>
                  <input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                    className="flex w-full rounded-full border border-slate-200 bg-slate-50/50 py-4 pl-14 pr-14 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-[0.5em] text-xl font-bold text-center transition-all outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center cursor-pointer text-slate-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPin ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Forgot PIN */}
              <div className="flex justify-end">
                <Link to="/support" className="text-xs font-bold text-primary hover:opacity-80 transition-opacity">
                  ลืมรหัส PIN?
                </Link>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 text-white font-extrabold text-lg rounded-full active:scale-[0.98] transition-all border-b-4 border-emerald-900 disabled:opacity-50"
                style={{ background: '#008a3e' }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>เข้าสู่ระบบ</span>
                    <span className="material-symbols-outlined font-bold">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-8 text-center border-t border-slate-100 pt-6">
              <p className="text-sm text-slate-500">
                ยังไม่มีบัญชีใช่ไหม?{' '}
                <Link to="/register" className="text-primary font-bold hover:opacity-80 transition-opacity">
                  สมัครสมาชิกตอนนี้
                </Link>
              </p>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: 'verified_user', title: 'ปลอดภัย', sub: '256-bit SSL' },
              { icon: 'bolt', title: 'รวดเร็ว', sub: 'เรียลไทม์' },
              { icon: 'support_agent', title: '24 ชม.', sub: 'ช่วยเหลือ' },
            ].map((f) => (
              <div key={f.icon} className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center text-center border border-slate-100">
                <span className="material-symbols-outlined text-primary text-2xl mb-1">{f.icon}</span>
                <p className="font-bold text-slate-900 text-xs">{f.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{f.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-8 pt-2 border-t border-slate-100 flex flex-col items-center gap-3">
          <p className="text-[10px] text-slate-400 text-center">
            © {new Date().getFullYear()} TH LOTTO. หนึ่งในเครือข่ายความภูมิใจของประเทศไทย
          </p>
          <div className="flex items-center gap-6">
            <a className="text-[10px] font-medium text-slate-400 hover:text-primary transition-colors" href="#">นโยบายความเป็นส่วนตัว</a>
            <a className="text-[10px] font-medium text-slate-400 hover:text-primary transition-colors" href="#">ข้อกำหนดการใช้งาน</a>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center pb-4">
          <div className="w-32 h-1.5 bg-slate-100 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
