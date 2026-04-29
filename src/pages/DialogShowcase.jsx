import React from 'react';

const DialogShowcase = () => {
  return (
    <div className="bg-background-dark text-slate-100 min-h-screen pb-24 font-display">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 flex items-center bg-background-dark/80 backdrop-blur-md p-4 border-b border-slate-800">
        <button className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-800 cursor-pointer transition-colors">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold tracking-tight">TH-LOTTO Premium</h1>
        <div className="w-10 h-10"></div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-12">
        <div className="space-y-2">
          <h2 className="text-sm font-medium uppercase tracking-widest text-primary/70 px-2">Dialog Variants</h2>
          <p className="text-slate-400 text-xs px-2">Standardized UI components for premium experience</p>
        </div>

        {/* 1. SUCCESS ALERT */}
        <section className="relative">
          <div className="absolute -top-3 left-6 z-10 bg-primary px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-bold text-background-dark uppercase">Success Alert</span>
          </div>
          <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="mb-6 bg-primary/20 p-4 rounded-full">
              <span className="material-symbols-outlined text-primary text-5xl leading-none">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">ดำเนินการสำเร็จ</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">การทำรายการของคุณเสร็จสมบูรณ์แล้ว<br/>ระบบได้บันทึกข้อมูลเรียบร้อย</p>
            <button className="w-full py-4 bg-primary text-background-dark font-black rounded-xl hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
              ตกลง
            </button>
          </div>
        </section>

        {/* 2. WARNING CONFIRM */}
        <section className="relative">
          <div className="absolute -top-3 left-6 z-10 bg-yellow-400 px-3 py-0.5 rounded-full">
            <span className="text-[10px] font-bold text-background-dark uppercase">Warning Confirm</span>
          </div>
          <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="mb-6 bg-yellow-400/20 p-4 rounded-full">
              <span className="material-symbols-outlined text-yellow-400 text-5xl leading-none">warning</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">ยืนยันการถอนเงิน?</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">คุณต้องการถอน <span className="text-white font-semibold">฿500</span> ใช่หรือไม่?<br/>โปรดตรวจสอบข้อมูลก่อนกดยืนยัน</p>
            <div className="flex gap-3 w-full">
              <button className="flex-1 py-4 border border-slate-600 text-slate-300 font-bold rounded-xl hover:bg-slate-800 transition-all">
                ยกเลิก
              </button>
              <button className="flex-1 py-4 bg-primary text-background-dark font-black rounded-xl hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                ยืนยัน
              </button>
            </div>
          </div>
        </section>

        {/* 3. ERROR ALERT */}
        <section className="relative">
          <div className="absolute -top-3 left-6 z-10 bg-rose-500 px-3 py-0.5 rounded-full text-white">
            <span className="text-[10px] font-bold uppercase">Error Alert</span>
          </div>
          <div className="glass-card rounded-[2rem] p-8 relative overflow-hidden flex flex-col items-center text-center shadow-2xl">
            <button className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <div className="mb-6 bg-rose-500/20 p-4 rounded-full">
              <span className="material-symbols-outlined text-rose-500 text-5xl leading-none">cancel</span>
            </div>
            <h3 className="text-2xl font-bold text-rose-500 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">ไม่สามารถดำเนินการต่อได้ในขณะนี้<br/>กรุณาตรวจสอบการเชื่อมต่อของคุณ</p>
            <button className="w-full py-4 bg-rose-500 text-white font-black rounded-xl hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-rose-500/20">
              ลองใหม่
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a1f14]/90 backdrop-blur-xl border-t border-primary/20 px-4 pb-8 pt-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <a className="flex flex-col items-center gap-1 text-primary" href="/">
            <span className="material-symbols-outlined">home</span>
            <span className="text-[10px] font-bold">หน้าหลัก</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-primary/40" href="/bet-history">
            <span className="material-symbols-outlined">confirmation_number</span>
            <span className="text-[10px] font-bold">โพยหวย</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-primary/40" href="/results">
            <span className="material-symbols-outlined">emoji_events</span>
            <span className="text-[10px] font-bold">ผลรางวัล</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-primary/40" href="/profile">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-bold">โปรไฟล์</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default DialogShowcase;
