import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import Dashboard from './pages/Dashboard';
import Deposits from './pages/Deposits';
import Members from './pages/Members';
import Results from './pages/Results';
import GenericCrud from './pages/GenericCrud';
import LuckyWheelHistory from './pages/LuckyWheelHistory';
import SystemMessages from './pages/SystemMessages';
import SettingsPage from './pages/SettingsPage';
import BetsList from './pages/BetsList';
import RestrictedNumbers from './pages/RestrictedNumbers';
import Admins from './pages/Admins';
import LotteryMarketsAdmin from './pages/LotteryMarketsAdmin';
import WheelAdmin from './pages/WheelAdmin';

// Column schemas (Thai labels)
const BANK_COLS = [
  { key:'name', label:'ชื่อธนาคาร' }, { key:'code', label:'รหัส' },
  { key:'image_url', label:'โลโก้', type:'image' }, { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const SLIDER_COLS = [
  { key:'image_url', label:'รูป', type:'image' }, { key:'title', label:'หัวข้อ' },
  { key:'subtitle', label:'รอง' }, { key:'link', label:'ลิงก์' },
  { key:'display_order', label:'ลำดับ', type:'number', default:0 },
  { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const PROMO_COLS = [
  { key:'image_url', label:'รูป', type:'image' }, { key:'title', label:'ชื่อ' },
  { key:'line1', label:'บรรทัดที่ 1' }, { key:'line2', label:'บรรทัดที่ 2' },
  { key:'description', label:'รายละเอียด', type:'textarea' },
  { key:'promo_code', label:'โค้ด' },
  { key:'bonus_amount', label:'โบนัส', type:'number', default:0 },
  { key:'turnover_multiplier', label:'เทิร์น x', type:'number', default:1 },
  { key:'target_view', label:'หน้าแสดง', type:'select', options:[{value:'deposit',label:'หน้าฝาก'},{value:'home',label:'หน้าหลัก'}] },
  { key:'display_order', label:'ลำดับ', type:'number', default:0 },
  { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const ARTICLE_COLS = [
  { key:'title', label:'หัวข้อ' }, { key:'image_url', label:'รูป', type:'image' },
  { key:'category', label:'หมวด' }, { key:'brand', label:'แบรนด์' },
  { key:'sub_content', label:'คำโปรย' },
  { key:'content', label:'เนื้อหา', type:'textarea' },
  { key:'display_order', label:'ลำดับ', type:'number', default:0 },
  { key:'is_published', label:'เผยแพร่', type:'boolean', default:true },
];
const ANNOUNCE_COLS = [
  { key:'title', label:'หัวข้อ' },
  { key:'message', label:'ข้อความ', type:'textarea' },
  { key:'display_order', label:'ลำดับ', type:'number', default:0 },
  { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const TREND_COLS = [
  { key:'code', label:'โค้ด' }, { key:'title', label:'ชื่อ' },
  { key:'image_url', label:'รูป', type:'image' }, { key:'link', label:'ลิงก์' },
  { key:'display_order', label:'ลำดับ', type:'number', default:0 },
  { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const MARKET_COLS = [
  { key:'name', label:'ชื่อ' }, { key:'code', label:'โค้ด' }, { key:'category', label:'หมวด' },
  { key:'logo_url', label:'โลโก้', type:'image' },
  { key:'display_order', label:'ลำดับ', type:'number' },
  { key:'is_open', label:'เปิดรับแทง', type:'boolean', default:true },
  { key:'is_active', label:'เปิดใช้งาน', type:'boolean', default:true },
];
const PAYOUT_COLS = [
  { key:'market', label:'ตลาด' }, { key:'bet_type', label:'ประเภท' },
  { key:'rate', label:'อัตราจ่าย', type:'number' },
];

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout/>}>
        <Route index                       element={<Dashboard/>}/>
        <Route path="deposits"             element={<Deposits/>}/>
        <Route path="members"              element={<Members/>}/>
        <Route path="banks"                element={<GenericCrud title="ธนาคารของเว็บ"  table="banks"          columns={BANK_COLS}    orderBy="id" orderAsc={true}/>}/>
        <Route path="bets"                 element={<BetsList/>}/>
        <Route path="markets"              element={<LotteryMarketsAdmin/>}/>
        <Route path="results"              element={<Results/>}/>
        <Route path="restricted"           element={<RestrictedNumbers/>}/>
        <Route path="payout-rates"         element={<GenericCrud title="อัตราจ่าย"       table="payout_rates"    columns={PAYOUT_COLS} orderBy="market" orderAsc={true}/>}/>
        <Route path="promotions"           element={<GenericCrud title="โปรโมชั่น"        table="promotions"      columns={PROMO_COLS}/>}/>
        <Route path="sliders"              element={<GenericCrud title="สไลด์แบนเนอร์"   table="sliders"          columns={SLIDER_COLS} orderBy="display_order" orderAsc={true}/>}/>
        <Route path="articles"             element={<GenericCrud title="บทความ/ข่าวสาร"  table="articles"         columns={ARTICLE_COLS}/>}/>
        <Route path="trending"             element={<GenericCrud title="รายการมาแรง"    table="trending_items"   columns={TREND_COLS} orderBy="display_order" orderAsc={true}/>}/>
        <Route path="lucky-wheel"          element={<WheelAdmin/>}/>
        <Route path="lucky-wheel-history"  element={<LuckyWheelHistory/>}/>
        <Route path="admins"               element={<Admins/>}/>
        <Route path="system-messages"      element={<GenericCrud title="ข้อความระบบ"     table="announcements"    columns={ANNOUNCE_COLS}/>}/>
        <Route path="settings"             element={<SettingsPage title="ตั้งค่าหน้าเว็บ"/>}/>
      </Route>
    </Routes>
  );
}
