import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Users, Wallet, Inbox, Send, TrendingUp, ListOrdered, AlertCircle } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

const StatCard = ({ icon: Icon, label, value, suffix, color = 'emerald' }) => (
  <div className="bg-white rounded-xl border p-4 flex items-center gap-3 shadow-sm">
    <div className={`w-10 h-10 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
      <Icon size={20}/>
    </div>
    <div className="min-w-0">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold truncate">{fmt(value)}{suffix && <span className="text-xs ml-1 text-slate-500">{suffix}</span>}</div>
    </div>
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('admin_dashboard_stats');
      if (error) setErr(error.message); else setStats(data);
    })();
  }, []);

  if (err) return <div className="text-rose-600 text-sm">เกิดข้อผิดพลาด: {err}</div>;
  if (!stats) return <div className="text-slate-500 text-sm">กำลังโหลด...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">ภาพรวม</h1>
        <p className="text-sm text-slate-500">สรุปสถิติและงานที่รออนุมัติ</p>
      </div>

      {(stats.pending_deposits > 0 || stats.pending_withdraws > 0) && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 flex items-center gap-2 text-sm">
          <AlertCircle size={16}/>
          มีรายการรออนุมัติ — ฝาก {stats.pending_deposits}, ถอน {stats.pending_withdraws}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users}  label="สมาชิกทั้งหมด" value={stats.total_members} />
        <StatCard icon={Users}  label="สมาชิกใหม่วันนี้" value={stats.new_today} color="sky" />
        <StatCard icon={Inbox}  label="ฝากรออนุมัติ" value={stats.pending_deposits} color="amber" />
        <StatCard icon={Send}   label="ถอนรออนุมัติ" value={stats.pending_withdraws} color="rose" />
        <StatCard icon={Wallet} label="ยอดฝากวันนี้" value={stats.today_deposit} suffix="บาท" />
        <StatCard icon={Wallet} label="ยอดถอนวันนี้" value={stats.today_withdraw} suffix="บาท" color="rose" />
        <StatCard icon={ListOrdered} label="ยอดแทงวันนี้" value={stats.today_bets} suffix="บาท" color="indigo" />
        <StatCard icon={TrendingUp}  label="จ่ายรางวัลวันนี้" value={stats.today_payouts} suffix="บาท" color="violet" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={Wallet} label="ยอดเงินคงเหลือทั้งระบบ" value={stats.total_balance} suffix="บาท" />
        <StatCard icon={ListOrdered} label="ตลาดที่เปิดอยู่" value={stats.open_markets} color="emerald" />
        <StatCard icon={AlertCircle} label="งวดรอประกาศผล" value={stats.pending_results} color="amber" />
      </div>
    </div>
  );
}
