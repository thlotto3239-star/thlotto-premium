import React from 'react';
import { Link } from 'react-router-dom';

const Preview = () => {
  const pages = [
    { name: 'หน้าหลัก (Home)', path: '/', icon: 'home' },
    { name: 'รายการหวย (Lottery List)', path: '/lottery-list', icon: 'list_alt' },
    { name: 'แทงหวย (Betting)', path: '/betting', icon: 'confirmation_number' },
    { name: 'ประวัติโพย (Bet History)', path: '/bet-history', icon: 'receipt_long' },
    { name: 'ผลรางวัล (Results)', path: '/results', icon: 'emoji_events' },
    { name: 'กระเป๋าเงิน (Wallet)', path: '/wallet', icon: 'wallet' },
    { name: 'ฝากเงิน (Deposit)', path: '/deposit', icon: 'account_balance_wallet' },
    { name: 'QR ชำระเงิน (QR Payment)', path: '/qr-payment', icon: 'qr_code_2' },
    { name: 'แนบสลิป (Upload Slip)', path: '/upload-slip', icon: 'upload_file' },
    { name: 'เติมเงินสำเร็จ (Deposit Success)', path: '/deposit-success', icon: 'check_circle' },
    { name: 'ถอนเงิน (Withdrawal)', path: '/withdrawal', icon: 'payments' },
    { name: 'ถอนเงินสำเร็จ (Withdrawal Confirm)', path: '/withdrawal-confirm', icon: 'verified' },
    { name: 'ประวัติธุรกรรม (Transactions)', path: '/transactions', icon: 'history' },
    { name: 'โปรไฟล์ (Profile)', path: '/profile', icon: 'person' },
    { name: 'แก้ไขโปรไฟล์ (Edit Profile)', path: '/edit-profile', icon: 'edit' },
    { name: 'แนะนำเพื่อน (Affiliate)', path: '/affiliate', icon: 'group' },
    { name: 'กงล้อเสี่ยงโชค (Lucky Wheel)', path: '/lucky-wheel', icon: 'casino' },
    { name: 'แจ้งเตือน (Notifications)', path: '/notifications', icon: 'notifications' },
    { name: 'ติดต่อเรา (Support Chat)', path: '/support', icon: 'support_agent' },
    { name: 'ตัวอย่าง Dialog (Dialog Showcase)', path: '/dialog-showcase', icon: 'ads_click' },
    { name: 'แอนิเมชันประมวลผล (Processing)', path: '/processing', icon: 'sync' },
    { name: 'สมัครสำเร็จ (Reg Success)', path: '/register-success', icon: 'verified_user' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen p-6 font-display">
      <div className="max-w-md mx-auto pb-12">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">UI High-Fidelity</h1>
          <p className="text-slate-500 font-medium italic">TH-LOTTO Premium Zenith Restoration</p>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {pages.map((page) => (
            <Link 
              key={page.path} 
              to={page.path}
              className="flex items-center gap-4 p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{page.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{page.name}</h3>
                <p className="text-xs text-slate-400 font-medium">{page.path}</p>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-8 rounded-[2.5rem] bg-primary text-white text-center shadow-xl shadow-primary/20">
          <span className="material-symbols-outlined text-5xl mb-4">verified</span>
          <h2 className="text-xl font-bold mb-2">100% Visual Fidelity</h2>
          <p className="text-sm opacity-80 leading-relaxed font-medium">
            ทุกหน้าจอถูกถอดแบบมาจาก "Emerald Premium" ต้นฉบับ พร้อมระบบ Interactive ที่ทำงานได้จริง
          </p>
        </div>
      </div>
    </div>
  );
};

export default Preview;
