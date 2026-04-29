# TH-LOTTO Premium — User App Blueprint
**เวอร์ชัน:** 1.0 (Deploy: 29 เม.ย. 2569 — อัพเดทล่าสุด)  
**Production URL:** https://th-lotto-app.vercel.app  
**GitHub:** https://github.com/thlotto3239-star/thlotto-premium  
**Database:** Supabase (ygopnjbvccenryejqmlw.supabase.co)

---

## 1. สถาปัตยกรรมระบบ

```
Frontend (React + Vite)          Backend (Supabase)
─────────────────────            ──────────────────────────
https://th-lotto.life    ◄───►  PostgreSQL + RLS Policies
React 19 + TailwindCSS           Auth (email/password)
React Router v7                  Storage (slips bucket)
Supabase JS Client               RPC Functions (SECURITY DEFINER)
```

### Tech Stack
- **Frontend:** React 19, Vite 8, TailwindCSS v4, React Router v7
- **State/Auth:** Supabase JS v2, React Context (AuthContext)
- **Icons:** Material Symbols Outlined (Google Fonts CDN)
- **UI Components:** Custom, Lucide React (บางหน้า)
- **Hosting:** Vercel (project: th-lotto-app)
- **Database:** Supabase PostgreSQL

---

## 2. ระบบ Authentication

### วิธี Login/Register
- ระบบใช้ **เบอร์โทรศัพท์ + PIN 4 หลัก** ในการเข้าสู่ระบบ
- Supabase Auth เก็บเป็น email: `{phone}@thlotto.app`
- Password จริง (Supabase): `THLT_{pin}_{phone}` (ซ่อนจากผู้ใช้)
- PIN 4 หลักยังถูก hash ด้วย bcrypt เก็บใน `profiles.pin_hash` สำหรับตรวจสอบตอนถอนเงิน

### Flow การสมัครสมาชิก
```
ผู้ใช้กรอกข้อมูล (ชื่อ, เบอร์, ธนาคาร, PIN)
    ↓
supabase.auth.signUp() → สร้าง Auth User
    ↓
Trigger: handle_new_user() → สร้าง profiles + wallets อัตโนมัติ
    ↓
set_user_pin() → บันทึก pin_hash (bcrypt)
    ↓
redirect → /registration-success
```

### ข้อมูลที่เก็บตอนสมัคร
| Field | เก็บที่ |
|---|---|
| ชื่อ-นามสกุล | profiles.full_name |
| เบอร์โทรศัพท์ | profiles.phone, profiles.phone_number |
| ชื่อธนาคาร (code) | profiles.bank_name |
| เลขบัญชี | profiles.bank_account_number |
| ชื่อบัญชี | profiles.bank_account_name |
| รหัส referrer | profiles.referrer_id (ถ้ามี) |
| member_id (auto) | profiles.member_id (รูปแบบ: THxxxx) |

---

## 3. หน้าทั้งหมด (31 Routes)

### Public Routes (ไม่ต้อง Login)
| Route | Component | ฟังก์ชัน |
|---|---|---|
| `/` | RootRedirect | redirect → /home (login แล้ว) หรือ /login |
| `/login` | Login | เข้าสู่ระบบด้วยเบอร์ + PIN |
| `/register` | Register | สมัครสมาชิกใหม่ (รองรับ ?ref=CODE) |

### Protected Routes (ต้อง Login)
| Route | Component | ฟังก์ชัน |
|---|---|---|
| `/home` | Home | หน้าหลัก: balance, slider, quick actions, trending |
| `/results` | Results | ผลรางวัล: ดึงจาก Google Sheet CSV |
| `/lottery-list` | LotteryList | รายการตลาดหวยที่เปิดรับแทง |
| `/betting` | Betting | แทงหวย + live stream + countdown |
| `/bet-history` | BetHistory | ประวัติโพยทั้งหมด |
| `/wallet` | Wallet | กระเป๋าเงิน: balance, ฝาก, ถอน |
| `/deposit` | Deposit | เลือกวิธีฝากเงิน |
| `/upload-slip` | UploadSlip | อัพโหลดสลิป + เลือกโปรโมชั่น |
| `/deposit-success` | DepositSuccess | ยืนยันการฝากสำเร็จ |
| `/qr-payment` | QRPayment | แสดง QR Code สำหรับโอนเงิน |
| `/withdrawal` | Withdrawal | ถอนเงิน (ต้องใส่ PIN) |
| `/withdrawal-confirm` | WithdrawalConfirm | ยืนยันการถอนสำเร็จ |
| `/registration-success` | RegistrationSuccess | หน้าสมัครสำเร็จ |
| `/profile` | Profile | โปรไฟล์: stats, referral, การตั้งค่า |
| `/edit-profile` | EditProfile | แก้ไขข้อมูลส่วนตัว |
| `/bank-account` | BankAccount | แสดงข้อมูลธนาคาร + โลโก้ |
| `/change-password` | ChangePassword | เปลี่ยน PIN 4 หลัก |
| `/transactions` | Transactions | ประวัติธุรกรรมทั้งหมด |
| `/notifications` | Notifications | การแจ้งเตือนทั้งหมด |
| `/support` | Support | ศูนย์ช่วยเหลือ: FAQ + ติดต่อ LINE |
| `/promotions` | Promotions | รายการโปรโมชั่น |
| `/affiliate` | Affiliate | ระบบแนะนำเพื่อน + รายได้ commission |
| `/lucky-wheel` | LuckyWheel | วงล้อนำโชค (ใช้ credit ตามที่ตั้งไว้) |
| `/articles` | Articles | บทความ/ข่าวสาร |
| `/articles/:id` | ArticleDetail | รายละเอียดบทความ |
| `/terms` | Terms | ข้อตกลงการใช้งาน |

---

## 4. Database Tables (User-Related)

### profiles
```
id (uuid, PK = auth.uid)
member_id (text, unique, auto: THxxxx)
username, full_name, phone, phone_number
bank_name (code เช่น "KBANK")
bank_account_number, bank_account_name
referrer_id (uuid, FK → profiles.id)
status (active/suspended)
vip_level, is_admin (boolean)
avatar_url, pin_hash (bcrypt)
created_at, updated_at
```

### wallets
```
user_id (uuid, FK → profiles.id, unique)
balance (numeric, ยอดเงินหลัก)
commission_balance (numeric, รายได้จาก referral)
total_won (numeric, ยอดถูกรางวัลสะสม)
total_bets (numeric, จำนวนเดิมพันสะสม)
updated_at
```

### bets
```
id, user_id, market_id, lottery_code
draw_date, draw_schedule_id
bet_type (4TOP/3TOP/3TODE/2TOP/2BOTTOM/RUN_UP/RUN_DOWN ฯลฯ)
numbers (text), amount (numeric)
payout_rate (numeric), payout_amount (numeric, default 0)
status (PENDING/WON/LOST)
is_paid, created_at, updated_at, settled_at
```

### deposit_requests
```
id, user_id, amount, slip_url
promo_code (optional)
status (PENDING/APPROVED/REJECTED)
admin_note, created_at, updated_at
```

### withdraw_requests
```
id, user_id, amount
bank_name, bank_account_number, bank_account_name
status (PENDING/APPROVED/REJECTED)
admin_note, created_at, updated_at
```

### transactions
```
id, user_id
type (DEPOSIT/WITHDRAW/BET/WIN/BONUS/COMMISSION)
amount, balance_after, status
reference_id, note
created_at
```

### notifications
```
id, user_id, type, title, body
is_read, created_at
```

### settings (39 keys)
| Key สำคัญ | ความหมาย |
|---|---|
| min_deposit | ยอดฝากขั้นต่ำ |
| min_withdraw | ยอดถอนขั้นต่ำ |
| max_withdraw_per_request | ถอนสูงสุดต่อครั้ง |
| max_daily_withdraw | ถอนสูงสุดต่อวัน |
| min_bet | เดิมพันขั้นต่ำ |
| contact_line_url | LINE URL สำหรับติดต่อ |
| lucky_wheel_cost | ค่าใช้จ่ายหมุนวงล้อ |
| lucky_wheel_daily_limit | จำนวนครั้งหมุนต่อวัน |
| live_stream_url | ลิงค์ถ่ายทอดสด YouTube |
| referral_commission_rate | % commission ให้ referrer |

---

## 5. RPC Functions (Backend Logic)

### ฟังก์ชันที่ User เรียกใช้
| Function | ใช้ใน | ทำงานอะไร |
|---|---|---|
| `place_bet_securely` | Betting | ตรวจ balance, หักเงิน, บันทึก bet |
| `request_withdrawal_securely` | Withdrawal | ตรวจ PIN, limit, หักเงิน, สร้าง request |
| `submit_deposit_slip` | UploadSlip | ตรวจ min_deposit, สร้าง request |
| `set_user_pin` | Register, ChangePassword | bcrypt hash PIN บันทึกใน profiles |
| `spin_lucky_wheel` | LuckyWheel | ตรวจ credit, หัก, random รางวัล |
| `get_spin_status` | LuckyWheel | ตรวจสถานะวงล้อวันนี้ |
| `get_markets_with_countdown` | LotteryList, Betting | ดึงตลาดพร้อม countdown |
| `get_user_stats` | (utility) | สถิติผู้ใช้รวม |
| `transfer_referral_income` | Affiliate | โอน commission_balance → balance |
| `apply_promotion` | (ถูกเรียกจาก admin_approve_deposit) | คำนวณ + บวกโบนัส |

### ฟังก์ชัน Admin ที่ส่งผลต่อ User
| Function | ผลต่อ User |
|---|---|
| `admin_approve_deposit` | บวก balance + โบนัส + commission referrer |
| `admin_approve_withdraw` | เปลี่ยน status withdraw request |
| `admin_set_result_and_settle` | ตั้งผลรางวัล + จ่ายเงินผู้ถูกรางวัล |

---

## 6. Security (RLS Policies)

### หลักการ: ทุก write ต้องผ่าน RPC เท่านั้น
| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | ตัวเอง/admin | ❌ (trigger เท่านั้น) | ตัวเอง | ❌ |
| wallets | ตัวเอง/admin | ❌ (trigger เท่านั้น) | ❌ (RPC เท่านั้น) | ❌ |
| bets | ตัวเอง/admin | ❌ (RPC เท่านั้น) | ❌ | ❌ |
| deposit_requests | ตัวเอง/admin | ❌ (RPC เท่านั้น) | admin เท่านั้น | ❌ |
| withdraw_requests | ตัวเอง/admin | ❌ (RPC เท่านั้น) | admin เท่านั้น | ❌ |
| transactions | ตัวเอง/admin | ❌ (RPC เท่านั้น) | ❌ | ❌ |
| notifications | ตัวเอง | ❌ | ตัวเอง (is_read) | ❌ |
| settings | ทุกคน (read) | ❌ | admin เท่านั้น | ❌ |
| banks | ทุกคน (read) | ❌ | admin เท่านั้น | ❌ |

### Security ที่แก้ไขในเซสชั่นนี้ (29 เม.ย.)
- ✅ ลบ `wallets_update_own` — ป้องกัน user แก้ balance ตรง
- ✅ ลบ `bets_insert_own` — บังคับผ่าน place_bet_securely
- ✅ ลบ `withdraw_insert_own` — บังคับผ่าน request_withdrawal_securely
- ✅ ลบ `deposit_insert_own` — บังคับผ่าน submit_deposit_slip
- ✅ แก้ PIN bypass: ถ้า pin_hash = NULL ห้ามถอน (เดิมอนุญาต)

---

## 7. Realtime Features

### Auto-update Balance
- `AuthContext` subscribe `wallets` table realtime
- เมื่อ admin อนุมัติฝาก/ถูกรางวัล → balance อัพเดทหน้า app ทันทีโดยไม่ต้อง refresh

---

## 8. ระบบ Referral (แนะนำเพื่อน)

```
ผู้ใช้ A แนะนำ ผู้ใช้ B
    ↓ B สมัครด้วย ?ref=member_id ของ A
    ↓ profiles.referrer_id ของ B = id ของ A
    ↓ เมื่อ admin อนุมัติ deposit ของ B
    ↓ A ได้รับ commission_balance += ยอดฝาก × referral_commission_rate
    ↓ A กด "โอนรายได้" → commission_balance → balance หลัก
```

---

## 9. ระบบผลรางวัล

- **แหล่งข้อมูล:** Google Sheet CSV (ไม่ใช้ Supabase)
- **URL:** `https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv`
- **หน้า Results.jsx** fetch CSV → parse → แสดงผล
- Admin ตั้งผลผ่าน `admin_set_result_and_settle()` → trigger settle bets อัตโนมัติ

---

## 10. Live Stream

- Admin ตั้ง `live_stream_url` ใน settings
- รองรับ: YouTube watch/live/short URL และ embed URL อื่นๆ
- Auto-play muted เมื่อเปิดหน้า Betting
- ผู้ใช้กด "เปิดเสียง" เองได้

---

## 11. Storage

| Bucket | ใช้เก็บ | Public |
|---|---|---|
| `slips` | สลิปฝากเงิน (upload โดย user) | ✅ |
| `deposit-slips` | (bucket เก่า, ไม่ได้ใช้แล้ว) | ✅ |

---

## 12. สิ่งที่ยังไม่มีใน User App (พัฒนาต่อได้)
- Push Notifications (ตอนนี้เป็น in-app เท่านั้น)
- OTP ยืนยันเบอร์โทร (ตอนนี้ไม่มี verification)
- เปลี่ยนข้อมูลธนาคาร (ตอนนี้ต้องติดต่อ admin ผ่าน LINE)
- ประวัติการหมุนวงล้อในหน้า user (ตอนนี้มีแค่ admin side)

---

## 13. Admin App (ทำต่อ — แยก Deployment)

ฟังก์ชัน admin ที่ต้องพัฒนา:
1. **Dashboard** — สถิติรวม, ยอดฝาก/ถอน วันนี้
2. **จัดการสมาชิก** — ดูข้อมูล, ระงับบัญชี, แก้ balance
3. **อนุมัติฝากเงิน** — ดูสลิป, อนุมัติ/ปฏิเสธ
4. **อนุมัติถอนเงิน** — ตรวจสอบ, อนุมัติ/ปฏิเสธ
5. **ตั้งผลรางวัล** — ตั้งผล + settle bets อัตโนมัติ
6. **จัดการตลาด** — เพิ่ม/แก้/ปิด-เปิดตลาดหวย
7. **ตั้งค่าระบบ** — min_deposit, rates, live_stream_url ฯลฯ
8. **วงล้อ** — config รางวัล, ดูประวัติ
9. **โปรโมชั่น** — เพิ่ม/แก้ promotion
10. **บทความ** — เพิ่ม/แก้ article
11. **แบนเนอร์** — จัดการ slider images
