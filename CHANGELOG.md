# CHANGELOG — TH LOTTO Premium

ประวัติการเปลี่ยนแปลงระบบทั้งหมด เรียงจากล่าสุดก่อน

---

## [1.5.0] — 2026-05-04

### ✨ เพิ่มใหม่
- **Popup แจ้งเตือนกลางหน้าจอ** (`NotificationPopup`) — แสดง popup realtime เมื่อมีการแจ้งเตือนใหม่ทุกประเภท (ถูกรางวัล / ฝากเงิน / ถอนเงิน / ระบบ) พร้อม progress bar และปิดอัตโนมัติ 7 วินาที
- **Stream URL รายตลาด** — แต่ละตลาดหวยมี URL ถ่ายทอดสดของตัวเองแทนการใช้ URL เดียวร่วมกัน
- **ระบบ Admin Role & Permissions** — Super Admin สามารถเพิ่ม/แก้ไข/ถอนสิทธิ์ Admin ได้ 13 รายการ พร้อม PermGuard ป้องกันทุก route

### 🔧 แก้ไข
- `get_markets_with_countdown` RPC: เพิ่ม `stream_url` field
- `Betting.jsx`: ใช้ `draw.stream_url` แทน global settings

---

## [1.4.0] — 2026-05-03

### ✨ เพิ่มใหม่
- **Admin Role System** — เพิ่ม column `admin_role` และ `admin_permissions` ใน `profiles`
- **RPC ใหม่**: `admin_set_admin_permissions`, `admin_revoke_admin`, `admin_search_non_admins`
- **Admins.jsx** — ออกแบบใหม่ทั้งหน้า: Super Admin ค้นหาสมาชิกและกำหนดสิทธิ์ต่อ Admin
- **Layout.jsx** — เมนูซ้ายแสดงเฉพาะหน้าที่ Admin มีสิทธิ์
- **App.jsx** — `PermGuard` ป้องกันทุก route

---

## [1.3.0] — 2026-05-02

### ✨ เพิ่มใหม่
- **YouTube Live Stream** ต่อตลาดหวย — เพิ่ม `stream_url` column ใน `lottery_markets`
- **Admin ตลาดหวย** — เพิ่มช่องกรอก URL ถ่ายทอดสด
- **Betting.jsx** — autoplay YouTube ในหน้าแทงหวย พร้อมปุ่มปิด/เปิดเสียง, badge "ถ่ายทอดสด"

### 🔧 แก้ไข
- ลบ global `live_stream_url` setting ออก แต่ละตลาดจัดการ stream เอง

---

## [1.2.0] — 2026-05-01

### 🔒 Security
- เพิกถอน EXECUTE permission `process_draw_results` จาก authenticated users
- จำกัดการ list Storage bucket
- Results ใช้ CSV เป็นแหล่งข้อมูลอัตโนมัติเท่านั้น (Admin แก้ผลไม่ได้)

### 🔧 แก้ไข
- [CRITICAL] `request_withdrawal_securely` — ขาด `reference_id` ใน transactions INSERT
- [HIGH] `BetHistory.jsx` — `bet.potential_win` ไม่มีอยู่จริง
- [HIGH] STOCK `payout_rates 4TOP` — `result_main=NULL` สำหรับหุ้น
- [MEDIUM] `Deposits.jsx / Withdrawals.jsx` — stale closure ใน realtime
- [MEDIUM] Admin `App.jsx /test` route — ไม่มี auth guard
- [LOW] `Wallet.jsx` — ไม่แสดง transaction ประเภท COMMISSION

---

## [1.1.0] — 2026-04-28

### ✨ เพิ่มใหม่
- **Results** — ระบบ hybrid: DB primary + CSV fallback
- **Automation pipeline**: cron 3 ตัว + trigger `trg_on_result_announced` → `fn_settle_result()`
- **Rate limit login** — RPC `check_login_rate_limit` + `record_login_attempt`
- **SHA256 PIN hashing** — เปลี่ยนจาก `THLT_{pin}_{phone}` เป็น `SHA256(pin+phone)`

### 🔧 แก้ไข
- `ChangePassword.jsx` — อัพเดต password format ให้ตรงกับ SHA256
- ลบ `PIN_BLACKLIST` ออก (ผู้ใช้เลือก PIN ได้อิสระ)

---

## [1.0.0] — 2026-04-20

### 🎉 เปิดระบบครั้งแรก
- User App: React + Vite + TailwindCSS
- Admin Panel: React + TailwindCSS
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime)
- ระบบฝาก-ถอน อัตโนมัติ 24 ชั่วโมง
- ระบบแทงหวย: 9 ประเภทการแทง (3TOP, 3TODE, 3FRONT, 3BOTTOM, 2TOP, 2BOTTOM, RUN_UP, RUN_DOWN, 4TOP)
- วงล้อโชคดี
- ระบบ Affiliate / Commission
- Realtime wallet balance update
