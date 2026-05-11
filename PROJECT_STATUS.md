# TH LOTTO PREMIUM — Project Status & AI Handoff Document
> อัพเดทล่าสุด: 2026-05-11 | เวอร์ชัน: 1.5.3
> ⚠️ เอกสารนี้ต้องอัพเดทด้วยทุกครั้งที่มีการเปลี่ยนแปลงระบบ

---

## 🗂️ ภาพรวมโปรเจค

ระบบแทงหวยออนไลน์ครบวงจร — ฝาก/ถอน, แทงหวย, วงล้อโชคดี, Affiliate

| ส่วน | เทคโนโลยี | URL Live | Git Repo |
|------|-----------|----------|----------|
| **User App** | React + Vite + TailwindCSS | https://th-lotto-app.vercel.app | `thlotto3239-star/thlotto-premium` (branch: `main`) |
| **Admin Panel** | React + TailwindCSS | https://th-lotto-admin.vercel.app | `thlotto3239-star/TH-LOTTO-Admin-push` (branch: `master`) |
| **Backend** | Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime) | — | — |

**Local paths:**
- User App: `c:\Users\armyn\Downloads\thlotto-app-main\thlotto-app-main`
- Admin Panel: `c:\Users\armyn\Downloads\thlotto-admin`

---

## 🚀 การ Deploy (ทุกครั้ง)

```bash
# User App → push แล้ว Vercel auto-deploy
git add . && git commit -m "..."
git push https://[GITHUB_PAT]@github.com/thlotto3239-star/thlotto-premium.git HEAD:main

# Admin Panel → push แล้ว Vercel auto-deploy
git push https://[GITHUB_PAT]@github.com/thlotto3239-star/TH-LOTTO-Admin-push.git HEAD:master

# หรือ deploy ตรงด้วย Vercel CLI
vercel deploy --prod --yes
```

> **หมายเหตุ:** GitHub PAT เก็บแยกต่างหาก ห้ามเขียนใน repo (org: `thlotto3239-star`)

---

## 👤 Admin Accounts (ณ วันที่ 2026-05-11)

| ชื่อ | เบอร์ | PIN | Role | สิทธิ์ |
|------|-------|-----|------|--------|
| อาม (เจ้าของ) | `0622306037` | `3239` | `super_admin` | ทุกอย่าง (`*`) |
| Admin Staff | `0811111111` | `1111` | `admin` | deposits, withdrawals, members, bets |
| (เบอร์เก่า) | `0853232656` | `3239` | `admin` | deposits, withdrawals, members, bets, markets, settings |

**สูตร password:** `SHA256(PIN + phone)` → bcrypt → `auth.users.encrypted_password`
- Login URL Admin: https://th-lotto-admin.vercel.app

---

## 🗄️ Database Schema (Supabase — public schema)

### ตารางหลัก

| ตาราง | คำอธิบาย | คอลัมน์สำคัญ |
|-------|---------|--------------|
| `profiles` | ข้อมูลผู้ใช้ทุกคน | `id, member_id, full_name, phone, is_admin, admin_role, admin_permissions, status` |
| `wallets` | กระเป๋าเงิน | `user_id, balance, commission_balance, total_won, total_bets` |
| `transactions` | ประวัติธุรกรรมทั้งหมด | `user_id, type(DEPOSIT/WITHDRAW/WIN/COMMISSION/BONUS), amount, status, reference_id, balance_after` |
| `deposit_requests` | คำขอฝากเงิน | `user_id, amount, slip_url, status, admin_note, approved_by, approved_at, promo_code` |
| `withdraw_requests` | คำขอถอนเงิน | `user_id, amount, bank_name, bank_account_number, bank_account_name, status, admin_note, approved_by, approved_at` |
| `lottery_markets` | ตลาดหวย 21 รายการ | `id, name, code, category, draw_time, close_minutes_before, logo_url, stream_url, is_active` |
| `draw_schedules` | ตารางออกผล | `market_id, draw_date, close_time, status(open/closed/announced)` |
| `lottery_results` | ผลรางวัล | `market_id, draw_date, result_main, result_3top, result_2top, result_2bottom, status(ANNOUNCED)` |
| `bets` | โพยแทงหวย | `user_id, market_id, draw_schedule_id, type, number, amount, potential_win, status, payout` |
| `notifications` | แจ้งเตือน user | `user_id, type(WIN/DEPOSIT/WITHDRAW/SYSTEM), title, body, is_read` |
| `payout_rates` | อัตราจ่าย | `market_id, bet_type, rate, max_per_number` |
| `settings` | ตั้งค่าระบบ | `key, value` — ใช้เก็บค่าต่างๆ เช่น `referral_commission_rate` |

### Views

| View | คำอธิบาย |
|------|---------|
| `v_latest_results` | ผลล่าสุดของแต่ละตลาด |
| `v_open_markets` | ตลาดที่เปิดรับแทงอยู่ |

---

## ⚙️ Supabase RPCs (ฟังก์ชันหลัก)

| RPC | คำอธิบาย | เรียกใช้จาก |
|-----|---------|------------|
| `get_markets_with_countdown` | ดึงตลาดพร้อม stream_url, next_close_time | User App (Betting, LotteryList) |
| `place_bet` | แทงหวย (ตัด balance, สร้าง bet) | User App |
| `request_withdrawal_securely` | ขอถอนเงิน (ตัด balance ล่วงหน้า) | User App |
| `admin_approve_deposit` | อนุมัติฝาก + บันทึก approved_by | Admin Panel |
| `admin_reject_deposit` | ปฏิเสธฝาก + บันทึก approved_by | Admin Panel |
| `admin_approve_withdraw` | อนุมัติถอน + บันทึก approved_by | Admin Panel |
| `admin_reject_withdraw` | ปฏิเสธถอน + คืนเงิน + บันทึก approved_by | Admin Panel |
| `admin_set_admin_permissions` | ตั้งสิทธิ์ admin (เฉพาะ super_admin) | Admin Panel |
| `admin_revoke_admin` | ถอนสิทธิ์ admin | Admin Panel |
| `admin_search_non_admins` | ค้นหา user ที่ยังไม่เป็น admin | Admin Panel |
| `fn_settle_result` | คำนวณผล+จ่ายรางวัล (trigger) | Auto (trigger) |
| `fn_import_csv_result` | import ผลจาก Google Sheets CSV | Edge Function |
| `apply_promotion` | ใช้โปรโมชั่น (ต่อ deposit) | เรียกใน admin_approve_deposit |
| `check_login_rate_limit` | ตรวจ rate limit login | User App |

---

## 🤖 Automation Pipeline

```
ทุก 1 นาที:  update-draw-status-cron → fn_update_draw_status()
              (เปลี่ยน draw_schedules.status เป็น closed เมื่อถึงเวลา)

ทุก 2 นาที:  fetch-and-settle-cron → Edge Function: fetch-and-settle
              → fn_import_csv_result RPC
              (ดึงผลจาก Google Sheets CSV → import → trigger settle)

ทุกวัน 04:00: cleanup-old-data-daily
              (ลบข้อมูลเก่า)

Trigger:      trg_on_result_announced (AFTER INSERT/UPDATE ON lottery_results)
              → fn_settle_result()
              (คำนวณ bet ที่ถูก → จ่ายรางวัล → แจ้งเตือน WIN)
```

**Google Sheets CSV (ผลหวย):**
```
https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv
```

---

## 🔒 Auth & Security

- **Password format:** `SHA256(pin + phone)` → `signInWithPassword` email=`{phone}@thlotto.app`
- **Admin guard:** `profiles.is_admin = true` — ถ้าไม่ใช่ admin จะ signOut อัตโนมัติ
- **Super Admin guard:** `admin_role = 'super_admin'` — เท่านั้นที่จัดการ admin อื่นได้
- **RLS:** ทุกตารางมี Row Level Security — user เห็นเฉพาะข้อมูลตัวเอง
- **SECURITY DEFINER RPCs:** ทุก admin RPC ใช้ `SECURITY DEFINER` + check `is_admin()`

---

## 📱 User App — Pages & Features

| หน้า | Path | ฟีเจอร์ |
|------|------|--------|
| Home | `/home` | แสดงยอดเงิน, ผลล่าสุด, ตลาดที่เปิด, แบนเนอร์ |
| Lottery List | `/lottery-list` | รายการตลาดหวยทั้งหมด |
| Betting | `/betting?drawId=` | แทงหวย + YouTube Live stream ต่อตลาด |
| Results | `/results` | ผลรางวัล (DB primary + CSV fallback) |
| Wallet | `/wallet` | กระเป๋าเงิน + ประวัติ |
| Deposit | `/deposit` → `/qr-payment` → `/upload-slip` | ฝากเงิน |
| Withdrawal | `/withdrawal` → `/withdrawal-confirm` | ถอนเงิน |
| Bet History | `/bet-history` | ประวัติโพย |
| Notifications | `/notifications` | แจ้งเตือนทั้งหมด |
| Lucky Wheel | `/lucky-wheel` | วงล้อโชคดี |
| Affiliate | `/affiliate` | ระบบ referral + commission |
| Profile | `/profile` | โปรไฟล์ผู้ใช้ |

**Global Components:**
- `NotificationPopup` — popup กลางจอ realtime (WIN/DEPOSIT/WITHDRAW/SYSTEM)
- `AppHeader` — แสดงยอดเงิน + notification badge

---

## 🖥️ Admin Panel — Pages & Permissions

| หน้า | Path | Permission Key |
|------|------|----------------|
| Dashboard | `/` | (ทุกคน) |
| ฝากเงิน | `/deposits` | `deposits` |
| ถอนเงิน | `/withdrawals` | `withdrawals` |
| สมาชิก | `/members` | `members` |
| ผู้ดูแลระบบ | `/admins` | (ทุก admin, แต่ซ่อน super_admin จาก admin ธรรมดา) |
| ตลาดหวย | `/markets` | `markets` |
| ออกผลรางวัล | `/results` | `markets` |
| รายการโพย | `/bets` | `bets` |
| เลขอั้น | `/restricted` | `restricted` |
| วงล้อโชคดี | `/wheel` | `wheel` |
| สไลเดอร์ | `/sliders` | `sliders` |
| โปรโมชั่น | `/promotions` | `promotions` |
| บทความ | `/articles` | `articles` |
| ตั้งค่าระบบ | `/settings` | `settings` |
| รูปลักษณ์ | `/appearance` | `appearance` |
| ธนาคาร | `/banks` | `banks` |

---

## 🐛 Bug ที่แก้แล้ว (ห้ามย้อนกลับ)

| # | ระดับ | บัก | การแก้ไข |
|---|-------|-----|---------|
| 1 | CRITICAL | `request_withdrawal_securely` — transactions INSERT ขาด `reference_id` | เพิ่ม reference_id ใน INSERT |
| 2 | HIGH | `BetHistory.jsx` — `bet.potential_win` ไม่มี field นี้ | ใช้ field ที่ถูกต้อง |
| 3 | HIGH | STOCK `payout_rates 4TOP` — `result_main=NULL` | แยก logic result_main สำหรับ STOCK |
| 4 | MEDIUM | `Deposits.jsx / Withdrawals.jsx` — stale closure ใน realtime | ใช้ `useRef` wrap load function |
| 5 | MEDIUM | Admin `App.jsx /test` route — ไม่มี auth guard | เพิ่ม auth guard |
| 6 | LOW | `Wallet.jsx` — ไม่แสดง COMMISSION type | เพิ่ม COMMISSION ใน type map |
| 7 | BUG | Admin login 500
| 8 | CRITICAL | Betting.jsx — handleSubmit field name ไม่ตรง RPC (item.bet_type + 
ate) | แก้เป็น item.type + payout_rate ตาม RPC place_bet_securely | — `confirmation_token = NULL` | SET `confirmation_token = ''` |

---

## ⚠️ กฎที่ต้องรู้ (ห้ามละเมิด)

1. **Results.jsx — HYBRID เท่านั้น** — PRIMARY: DB (`lottery_results` status=ANNOUNCED), FALLBACK: CSV. ห้าม revert เป็น CSV-only
2. **Password = SHA256(PIN + phone)** — ห้ามเปลี่ยน format
3. **ไม่มีตาราง `deposits` / `withdrawals`** — ใช้ `deposit_requests` / `withdraw_requests` เท่านั้น
4. **`wallets` ไม่มี `created_at`** — columns: `id, user_id, balance, commission_balance, total_won, total_bets, updated_at`
5. **Admin RPC ทุกตัวต้อง check `is_admin()`** — ก่อน execute
6. **`stream_url` อยู่ที่ `lottery_markets.stream_url`** — ไม่ใช่ `settings` table

---

## 📋 สิ่งที่ยังไม่ได้ทำ / แนะนำพัฒนาต่อ

- [ ] ระบบ OTP สำหรับ login (ตอนนี้ใช้ PIN เท่านั้น)
- [ ] Export รายงาน (Excel/PDF) สำหรับ admin
- [ ] ระบบ limit การแทง (ต่อ user ต่อวัน)
- [ ] Push notification (ตอนนี้เป็น in-app เท่านั้น)
- [ ] ระบบ KYC (ยืนยันตัวตน)
- [ ] Dashboard สถิติ admin แบบ realtime (กราฟ, ยอดรวม)
- [ ] 2FA สำหรับ admin
- [ ] ระบบ audit log (ว่า admin คนไหนทำอะไรเมื่อไหร่)

---

## 📁 โครงสร้างไฟล์สำคัญ

### User App (`thlotto-app-main`)
```
src/
├── App.jsx                    ← Routes + NotificationPopup (global)
├── AuthContext.jsx            ← Auth + wallet realtime
├── supabaseClient.js          ← Supabase client init
├── components/
│   ├── NotificationPopup.jsx  ← Global center-screen popup (realtime)
│   ├── AppHeader.jsx          ← Header + balance + notification badge
│   └── ...
└── pages/
    ├── Betting.jsx            ← แทงหวย + YouTube live (stream_url ต่อตลาด)
    ├── Results.jsx            ← ผลรางวัล (HYBRID: DB + CSV fallback)
    ├── Notifications.jsx      ← รายการ notification
    └── ...
```

### Admin Panel (`thlotto-admin`)
```
src/
├── App.jsx                    ← Routes + PermGuard
├── AuthContext.jsx            ← Auth + isSuperAdmin + hasPermission
├── components/
│   └── Layout.jsx             ← Sidebar nav (filter by permission)
└── pages/
    ├── Deposits.jsx           ← อนุมัติฝาก + แสดง approved_by
    ├── Withdrawals.jsx        ← อนุมัติถอน + แสดง approved_by
    ├── Admins.jsx             ← จัดการ admin (super_admin only จัดการได้)
    ├── LotteryMarkets.jsx     ← จัดการตลาด + stream_url
    └── ...
```

---

## 🔄 วิธีอัพเดทเอกสารนี้

**ทุกครั้งที่แก้ระบบ ให้อัพเดท 2 ไฟล์:**
1. `CHANGELOG.md` — เพิ่ม version ใหม่ด้านบนสุด
2. `PROJECT_STATUS.md` (ไฟล์นี้) — อัพเดทส่วนที่เปลี่ยนแปลง + วันที่บนสุด

**วิธีบอก AI session ใหม่:**
```
"อ่าน PROJECT_STATUS.md และ CHANGELOG.md ที่ 
c:\Users\armyn\Downloads\thlotto-app-main\thlotto-app-main\ ก่อน
แล้วค่อยเริ่มงานตามที่ขอ"
```
