# CHANGELOG — TH LOTTO Premium

ประวัติการเปลี่ยนแปลงระบบทั้งหมด เรียงจากล่าสุดก่อน

---

## [1.6.0] — 2026-05-22

### 🔧 Documentation Update - บังคับอ่านเอกสารก่อนทำงาน
- อัพเดท PROJECT_GUIDE.md - เพิ่มกฎเหล็ก (ตรวจสอบสถานะล่าสุด, วิเคราะห์ก่อนทำงาน)
- อัพเดท PROJECT_GUIDE.md - เพิ่ม Vercel Project ID สำหรับการตรวจสอบก่อน deploy
- อัพเดท PROJECT_GUIDE.md - อัพเดทขั้นตอนการทำงานให้ชัดเจนขึ้น (8 ขั้นตอน)
- อัพเดท PROJECT_STATUS.md - อัพเดท version เป็น v1.6.0
- อัพเดท PROJECT_STATUS.md - เพิ่ม column Vercel Project ID

---

## [1.5.8] — 2026-05-14

### 🔧 Project Protection — ป้องกันโปรเจค
- สร้าง PROJECT_GUIDE.md เพื่อป้องกันโปรเจค
- อัพเดท .windsurfrules ให้บังคับให้อ่าน PROJECT_GUIDE.md ก่อนทำงาน
- อัพเดทข้อมูลโปรเจคล่าสุด (Repo, Branch, Live URL, Local, Vercel Project)
- แก้ .vercel/project.json ให้ชี้ไป project ที่ถูกต้อง (th-lottie-app)
- สร้าง script check-vercel-config.js เพื่อตรวจสอบ .vercel/project.json
- Deploy ให้ถูกต้อง (https://th-lotto-app.vercel.app)

---

## [1.5.7] — 2026-05-14

### 🎨 Results Page — อัพเดทดีไซน์การ์ดหวยสลากกินแบ่งรัฐบาล

#### Results.jsx
- **การ์ดหวยสลากกินแบ่งรัฐบาล** — เปลี่ยน background เป็น gradient เหมือนหน้าโฮม
- เอา border ออกเพื่อความสวยงามสอดคล้องกับหน้าโฮม

---

## [1.5.6] — 2026-05-14

### 🎨 Instant Lottery — ลบปุ่มออกจากระบบ

#### InstantLottery.jsx
- **ลบปุ่มออกจากระบบ** ออกจากหน้าหวยไทย 1 นาที (ตามเอกสาร AGENT_HANDOFF.md)
- **ลบ handleLogout function** ออกเพราะไม่มีปุ่มใช้แล้ว

---

## [1.5.5] — 2026-05-14

### 🐛 แก้บั๊ก Instant Lottery Frontend

#### InstantLottery.jsx
- **`balanceFlash`** — แก้ logic ให้ flash เฉพาะเมื่อ balance เพิ่มขึ้น (ไม่ flash เมื่อ balance ลดลง)
- เพิ่ม check `isIncrease = balance > prevBalanceRef.current` ก่อน flash

#### AuthContext.jsx
- **`signOut`** — เพิ่ม `localStorage.removeItem('thlotto_session_expiry')` เพื่อลบ session expiry เมื่อออกจากระบบ

#### Supabase RPC
- **`fn_get_instant_bets`** — แก้ SQL error: `ORDER BY` อยู่ใน subquery เพื่อแก้ปัญหา GROUP BY clause
- Migration: `fix_fn_get_instant_bets_order_by`

---

## [1.5.4] — 2026-05-13

### 🎰 Instant Lottery (หวยไทย 1 นาที) — Rebuild & UI Refinement

#### 🐛 แก้บั๊ก Backend (Supabase RPC)
- **`fn_check_instant_win`** — แก้ตำแหน่งเลขที่เทียบให้ตรงตามแผน:
  - `3top`: เคยเทียบหลัก 1-3 → แก้เป็นหลัก 4-6
  - `3toad`: เคยเทียบหลัก 1-3 sorted → แก้เป็นหลัก 4-6 sorted
  - `pin_top`: เคยใช้ 3 หลักหน้า → แก้เป็น 3 หลักท้าย (`hundreds`/`tens`/`units` → position 4/5/6)
  - Pin logic: เคย AND-all → แก้เป็น OR per-position
- **`fn_settle_instant_draw`** — pin payout แก้จาก amount เต็ม → `amount × rate × ตำแหน่งที่ถูก`
- **`fn_place_instant_bet`** — แก้การหักเงิน pin จาก `amount × combinations` → `amount × จำนวนเลข`
- Migration: `20260513032530_fix_instant_lottery_win_logic`

#### 🎨 Frontend Rewrite (`InstantLottery.jsx`)
- **Rewrite ทั้งไฟล์** จาก cart-system UI → auto-popup single-bet UX (763 บรรทัด)
- ลบ "ระบุจำนวนเงิน + เพิ่ม" ของเดิม → กรอกเลขครบ → modal ใส่เงินเด้งอัตโนมัติ
- ซ่อน BottomNav ในหน้านี้ (เกมแบบ fullscreen)
- **Logo** → เปลี่ยนเป็น **ธงไทยวงกลม** (`flagcdn.com/w160/th.png`) แทน logo TH-LOTTO
- **Tabs** → grid 2 แถว (5 บน + 4 ล่าง) แทน scroll แนวนอน 1 แถว
- **สี** → ใช้ brand gold premium `#D4AF37` แทน `text-yellow-400/500` ทุกที่ (consistent)

#### 🐛 แก้บั๊กรูปแตกใน Home
- **`trending_items.image_url`** ของ "หวยไทย 1 นาที" — URL `pic.in.th/secure-sv1/-1-Violet-and-Yellow-Casino-Night-Party-Neon...` หายจาก CDN แล้ว
- แก้เป็น `https://flagcdn.com/w160/th.png` (CDN เสถียร + ตรงกับชื่อ "หวยไทย")
- Migration: `fix_trending_items_thai_lotto_image`

#### 📚 AI-Proof Onboarding (เอกสารกันงงข้ามเซสชัน)
- **เพิ่ม 5 ไฟล์ใหม่** เพื่อให้ AI ทุกตัวเข้าใจตรงกัน ไม่ว่าจะเป็น Claude / Cursor / Copilot / Windsurf:
  - `CLAUDE.md` — Claude Code rules → ชี้กลับ README
  - `.cursorrules` — Cursor AI rules → ชี้กลับ README
  - `.github/copilot-instructions.md` — GitHub Copilot rules → ชี้กลับ README
  - `docs/INSTANT_LOTTERY_PLAN.md` — แผนหวย 1 นาทีฉบับสมบูรณ์ (4 ส่วน + 9 bet types + 9 steps)
  - `docs/INSTANT_LOTTERY_HISTORY.md` — chat log วันที่ 12 พ.ค. ฉบับเต็ม (กันลืม)
- **Rewrite `README.md`** เป็น **STOP-AND-READ** กระชับ — กฎเหล็ก 5 ข้อ + 5-line system prompt + ลำดับเอกสาร
- **เพิ่ม `.githooks/pre-commit`** — auto-tag ทุก commit (`auto-checkpoint-YYYYMMDD-HHMMSS`) → rollback ได้เสมอ
- **Enable `git config core.hooksPath .githooks`** ในโปรเจกต์

#### 🛡️ Safety Tags (จาก checkpoint workflow)
- `stable-2026-05-13-pre-rebuild` ← production point (rollback ได้)
- `checkpoint-2026-05-13-1249` ← หลัง rewrite InstantLottery.jsx
- `pre-ui-refinement-20260513-1337` ← ก่อน UI 3 จุด
- `pre-onboarding-setup-20260513-1404` ← ก่อนตั้ง AI-proof onboarding

---

## [1.5.3] — 2026-05-11

### 🔧 แก้ไข
- [CRITICAL] **Betting.jsx — แทงหวยส่งโพยไม่ได้** — field name ไม่ตรงกับ RPC place_bet_securely (เกิดจาก commit 446257c ที่เขียน handleSubmit ใหม่ตอนเพิ่ม Modal)
  - et_type: item.bet_type → แก้เป็น et_type: item.type (cart เก็บ category ในชื่อ 	ype)
  - 
ate: item.rate → แก้เป็น payout_rate: item.rate (RPC อ่าน payout_rate ไม่ใช่ 
ate)

### ✨ เพิ่มใหม่ (Admin Panel — repo: TH-LOTTO-Admin-push)
- **WheelAdmin.jsx — จัดการภาพปกกงล้อ** — เพิ่ม preview ภาพ, URL input, อัพโหลดไฟล์ไป Supabase Storage (sliders/wheel-banner/)
- ใช้ RPC dmin_upsert_setting key lucky_wheel_banner_url

---

## [1.5.2] — 2026-05-04

### ✨ เพิ่มใหม่
- **บันทึกผู้อนุมัติ** — `deposit_requests` และ `withdraw_requests` มี column `approved_by` + `approved_at` บันทึกว่าแอดมินคนไหนอนุมัติ/ปฏิเสธ เมื่อไหร่
- **คอลัมน์ "ผู้ดำเนินการ"** ในหน้าฝากและถอน — แสดงชื่อ + เวลาที่อนุมัติ

### 🔧 แก้ไข
- RPCs ทั้ง 4: `admin_approve_deposit`, `admin_reject_deposit`, `admin_approve_withdraw`, `admin_reject_withdraw` — เพิ่ม `SET approved_by = auth.uid()`

---

## [1.5.1] — 2026-05-04

### 🔒 Security / Access Control
- **ซ่อน Super Admin** จาก Admin ธรรมดา — หน้า "ผู้ดูแลระบบ" ไม่แสดง super_admin ให้ admin ระดับล่างเห็น
- **แก้ bug login 500** — `confirmation_token = NULL` ใน manually created user → ตั้งเป็น `''`
- **อัพเกรด Super Admin** — บัญชี `0622306037` (อาม) เป็น super_admin ใหม่ PIN 3239
- **Popup แจ้งเตือน** — ระบบ NotificationPopup global center-screen สำหรับทุก notification type

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
