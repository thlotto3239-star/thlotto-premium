# 🤝 AGENT HANDOFF — Quick Start สำหรับ AI ทุกคน

> **อ่านไฟล์นี้ก่อนทำอะไรเลย** — เพื่อให้ AI ทุกตัวเดินทางเดียวกัน เจ้าของโปรเจกต์ไม่ต้องตอบซ้ำ

---

## 📌 ข้อมูลโปรเจกต์ (ห้ามถามซ้ำ)

| รายการ | URL / Path |
|---|---|
| 🌐 **User App (Live)** | https://th-lotto-app.vercel.app |
| 🛠️ **Admin Panel (Live)** | https://th-lotto-admin.vercel.app |
| 📦 **GitHub: User App** | https://github.com/thlotto3239-star/thlotto-premium (`main`) |
| 📦 **GitHub: Admin** | https://github.com/thlotto3239-star/TH-LOTTO-Admin-push (`master`) |
| 💾 **Local: User App** | `C:\Users\armyn\Downloads\thlotto-app-main\thlotto-app-main` |
| 💾 **Local: Admin** | `C:\Users\armyn\Downloads\thlotto-admin` |
| 🗄️ **Database** | Supabase (project linked via Supabase MCP) |
| 🚀 **Deploy** | Vercel auto-deploy from GitHub `main`/`master` |

---

## 🏗️ สถาปัตยกรรม (เข้าใจให้ตรงกัน)

โปรเจกต์มี **2 ระบบแยกกัน** ในเว็บเดียวกัน:

### 1. ระบบหวยหลัก (Main Lottery) — `LIVE & WORKING`
- หน้า: `/lottery-list`, `/betting`, `/results`, `/bet-history`
- ตาราง: `lottery_markets` (21 ตลาด), `lottery_results`, `bets`, `payout_rates`, `restricted_numbers`, `draw_schedules`
- RPCs: `get_markets_with_countdown`, `place_bet_securely`, `fn_settle_result`, `fn_import_csv_result`
- กลไก: Admin/CSV import ผล → settle trigger → notify
- **❌ ห้ามแตะถ้าไม่สั่ง**

### 2. หวยไทย 1 นาที (Instant Lottery / mini-game) — `LIVE`
- หน้า: `/instant-lottery`
- ตาราง: `instant_bet_types` (9 ประเภท), `instant_draws`, `instant_bets`
- RPCs: `fn_instant_draw`, `fn_place_instant_bet`, `fn_settle_instant_draw`, `fn_check_instant_win`, `fn_get_instant_result`, `fn_get_instant_popup`, `fn_get_instant_bets`
- กลไก: pg_cron jobid 14 สุ่มทุกนาที + jobid 15 ล้างเที่ยงคืน
- ใช้ `wallets` + `auth.users` ร่วมกับระบบหลัก

### จุดที่ใช้ร่วมกัน
- `wallets` (เครดิตเดียวกัน)
- `auth.users` + `profiles` (บัญชีเดียวกัน)
- `transactions`, `notifications`

---

## 🔴 กฎเหล็ก 7 ข้อ — ห้ามฝ่าฝืน

1. **อ่าน 4 ไฟล์ก่อนทำงาน** — `.windsurfrules`, `PROJECT_STATUS.md`, `DEVELOPMENT_GUIDE.md`, `CHANGELOG.md`
2. **ก่อนแก้โค้ดทุกครั้ง** — รัน workflow `/checkpoint` (commit + tag + push)
3. **ห้ามเขียนโค้ดถ้าไม่ได้ approve** — วิเคราะห์ → สรุปเข้าใจ → ขอ ok → ค่อยเขียน
4. **ห้ามแตะระบบหวยหลัก** ถ้า task ไม่ระบุชัดเจน
5. **ตรวจ field name** จาก RPC/DB ก่อนเรียก (อย่าเดา)
6. **อัพเดต `CHANGELOG.md` + `PROJECT_STATUS.md`** ทุกครั้งที่แก้ (ไม่งั้น = ยังไม่เสร็จ)
7. **ทดสอบ local ก่อน push** — `npm run build` + manual preview → ค่อย deploy

---

## 🔧 Stack & Conventions

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Routing | react-router-dom v6 |
| State | React Context (`AuthContext`, `WalletContext`) |
| Icons | Material Icons (ไม่ใช้ Font Awesome) + Lucide |
| Backend | Supabase (PostgreSQL + RPC + RLS + pg_cron) |
| Auth | Phone + PIN → hash SHA256(`THLT_${pin}_${phone}`) → email format `${phone}@thlotto.app` |
| Deploy | Vercel auto-deploy on push to `main` |

---

## 📋 Workflow ที่ต้องรู้

| Slash Command | ทำอะไร |
|---|---|
| `/start` | อ่าน 4 ไฟล์ + sync git + report status |
| `/checkpoint` | commit + tag + push ก่อนแก้ใหญ่ |
| `/deploy` | build + test + commit + push + verify live |
| `/finish` | update docs + CHANGELOG + commit + push |

---

## 🔍 Bug ที่รู้แล้ว (กำลังจะแก้)

ดูใน `PROJECT_STATUS.md` และ `CHANGELOG.md` หัวข้อ "Known Issues"

ปัจจุบัน (2026-05-13):
- `fn_check_instant_win`: `3top`/`3toad` เทียบ first-3 แทน last-3
- `fn_check_instant_win`: `pin_*` ใช้ AND logic บน wrong position
- `fn_get_instant_popup`: `result_3top` คืน first-3 แทน last-3
- `InstantLottery.jsx`: เป็น cart system — ต้องเปลี่ยนเป็น auto-popup single-bet

---

## 🆘 ถ้าสับสน

1. อ่าน `PROJECT_STATUS.md` หัวข้อ "Current State"
2. ดู git log: `git log --oneline -n 20`
3. ดู Supabase: `mcp1_list_tables`, `mcp1_get_advisors`
4. **ห้ามเดา** — ถามผู้ใช้
