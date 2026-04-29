import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Shield } from 'lucide-react';

export default function Admins() {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await supabase.rpc('admin_list_members', { p_search: null, p_limit: 500, p_offset: 0 });
    setRows((data||[]).filter(m => m.is_admin));
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id, makeAdmin) => {
    const { error } = await supabase.rpc('admin_update_member', { p_user_id: id, p_patch: { is_admin: makeAdmin } });
    if (error) return alert(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2"><Shield size={20}/> ผู้ดูแลระบบ</h1>
      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><th className="p-2 text-left">รหัส</th><th className="p-2 text-left">ชื่อ</th><th className="p-2 text-left">เบอร์</th><th className="p-2 text-right"></th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-slate-400">ยังไม่มีผู้ดูแลระบบ</td></tr>
            : rows.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2 font-mono">{m.member_id}</td>
                <td className="p-2 font-medium">{m.full_name}</td>
                <td className="p-2">{m.phone}</td>
                <td className="p-2 text-right"><button onClick={()=>toggle(m.id, false)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs">ยกเลิก admin</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">หากต้องการเพิ่ม admin ใหม่ ไปที่ "สมาชิกทั้งหมด" → แก้ไข → ติ๊ก Admin</p>
    </div>
  );
}
