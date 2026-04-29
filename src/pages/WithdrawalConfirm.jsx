import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  ArrowRight, 
  History, 
  Home, 
  ShieldCheck, 
  Wallet,
  Building2,
  Trophy
} from 'lucide-react';

const WithdrawalConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const withdrawalAmount = location.state?.amount || 0;
  const bankName = location.state?.bankName || 'ธนาคารของคุณ';

  return (
    <div className="bg-background-light min-h-screen font-body flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-accent-gold/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>

      <main className="w-full max-w-[480px] relative z-10 text-center">
        {/* Success Icon Animation */}
        <div className="mb-12 relative inline-block">
           <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse scale-150"></div>
           <div className="relative w-32 h-32 rounded-[2.5rem] bg-white shadow-2xl flex items-center justify-center border-4 border-primary/10 group overflow-hidden">
              <div className="absolute inset-0 bg-emerald-zenith translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <CheckCircle2 size={64} className="text-primary relative z-10 group-hover:text-white transition-colors duration-500" />
           </div>
           
           {/* Floating Particles */}
           <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-accent-gold/20 backdrop-blur-md border border-accent-gold/30 flex items-center justify-center text-accent-gold animate-bounce">
              <Trophy size={20} />
           </div>
        </div>

        {/* Success Typography */}
        <div className="mb-12">
           <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight mb-4 animate-fade-in-up">
             ส่งคำขอถอนเงินสำเร็จ!
           </h1>
           <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <ShieldCheck size={18} className="text-primary" />
              <p className="text-primary font-black text-[11px] uppercase tracking-[0.3em]">Processing Secure Transaction</p>
           </div>
           <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-[300px] mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
             ระบบกำลังดำเนินการตรวจสอบข้อมูล <br /> 
             ยอดเงินจะเข้าบัญชีของท่านภายใน <span className="text-gray-900 font-bold">5-15 นาที</span>
           </p>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
           <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-sm text-left">
              <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-4">
                 <Wallet size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ยอดเงินที่ถอน</p>
              <p className="text-xl font-display font-black text-gray-900">฿{Number(withdrawalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
           </div>
           <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-6 border border-white/50 shadow-sm text-left">
              <div className="w-10 h-10 rounded-xl bg-accent-gold/5 flex items-center justify-center text-accent-gold mb-4">
                 <Building2 size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">บัญชีรับเงิน</p>
              <p className="text-lg font-display font-black text-gray-900 truncate">{bankName}</p>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
           <button 
             onClick={() => navigate('/home')}
             className="w-full h-18 bg-emerald-zenith text-white rounded-[1.5rem] font-display font-black text-lg flex items-center justify-center gap-3 shadow-2xl shadow-emerald-deep/30 btn-press"
           >
             กลับสู่หน้าหลัก
             <Home size={20} />
           </button>
           
           <button 
             onClick={() => navigate('/transactions')}
             className="w-full h-18 bg-white text-gray-400 rounded-[1.5rem] font-display font-black text-lg flex items-center justify-center gap-3 border border-gray-100 btn-press"
           >
             ตรวจสอบประวัติธุรกรรม
             <History size={20} />
           </button>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="absolute bottom-12 text-center opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-2">Powered by TH-LOTTO Infinity</p>
         <div className="flex justify-center gap-4">
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <div className="w-1 h-1 bg-primary rounded-full"></div>
            <div className="w-1 h-1 bg-primary rounded-full"></div>
         </div>
      </footer>
    </div>
  );
};

export default WithdrawalConfirm;
