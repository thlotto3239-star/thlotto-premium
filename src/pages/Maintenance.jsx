import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function Maintenance() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 text-white px-6">
      <img
        src={settings.site_logo_url || 'https://img1.pic.in.th/images/e012bf8186b87f91c4892bef665aba4e.png'}
        alt="Logo"
        className="w-24 h-24 rounded-2xl mb-6 shadow-lg"
      />
      <h1 className="text-2xl font-bold mb-2">{settings.site_name || 'TH LOTTO'}</h1>
      <div className="text-6xl mb-4">🔧</div>
      <p className="text-lg text-center text-slate-300 mb-2">ระบบปิดปรับปรุงชั่วคราว</p>
      <p className="text-sm text-center text-slate-400">กรุณากลับมาใหม่ในภายหลัง</p>
    </div>
  );
}
