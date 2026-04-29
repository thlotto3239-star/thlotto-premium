# TH-LOTTO Premium — เอกสารสรุประบบ

> **Version:** Production Ready  
> **Stack:** React 18 + Vite + Supabase (PostgreSQL + Auth + Storage)  
> **Date:** เมษายน 2025

---

## 1. ภาพรวมระบบ (System Overview)

TH-LOTTO Premium เป็นเว็บแอปพลิเคชันหวยออนไลน์ สำหรับ Mobile (max-width 480px)  
ทำงานแบบ **Single Page Application (SPA)** บน React Router  
ข้อมูลทั้งหมดจัดเก็บและประมวลผลที่ **Supabase** (Backend as a Service)

```
ผู้ใช้ (Browser)
    │
    ▼
React App (Vite)
    │
    ├── AuthContext  ← จัดการ session, profile, wallet ทั่วทั้งแอป
    ├── ProtectedRoute ← กั้น route ที่ต้อง login ก่อน
    └── Pages (22 หน้า)
            │
            ▼
    Supabase Client
            │
            ├── PostgreSQL DB  (tables + RLS)
            ├── Auth           (email/password)
            ├── Storage        (deposit-slips bucket)
            └── RPC Functions  (business logic ฝั่ง server)
```

---

## 2. เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend Framework | React 18 + Vite |
| Routing | React Router v6 |
| Styling | TailwindCSS + Custom CSS Variables |
| Icons | Lucide React + Google Material Symbols |
| Fonts | Prompt (Thai), Manrope (EN) |
| Backend | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (email/password — ใช้ phone@gmail.com) |
| File Storage | Supabase Storage (bucket: deposit-slips) |
| Real-time | Supabase Realtime (Notifications) |

---

## 3. โครงสร้างไฟล์

```
src/
├── App.jsx                 ← Router หลัก + route definitions
├── AuthContext.jsx         ← Global auth state (user, profile, wallet)
├── ProtectedRoute.jsx      ← HOC กั้น route
├── supabaseClient.js       ← Supabase client instance
└── pages/
    ├── Login.jsx
    ├── Register.jsx
    ├── RegistrationSuccess.jsx
    ├── Home.jsx
    ├── LotteryList.jsx
    ├── Betting.jsx
    ├── BetHistory.jsx
    ├── Results.jsx
    ├── Wallet.jsx
    ├── Deposit.jsx
    ├── QRPayment.jsx
    ├── UploadSlip.jsx
    ├── DepositSuccess.jsx
    ├── Withdrawal.jsx
    ├── WithdrawalConfirm.jsx
    ├── Transactions.jsx
    ├── Profile.jsx
    ├── EditProfile.jsx
    ├── Affiliate.jsx
    ├── LuckyWheel.jsx
    ├── Notifications.jsx
    ├── Support.jsx
    └── Processing.jsx
```

---

## 4. ระบบ Authentication

### การทำงาน
- ใช้ **Supabase Auth** — email/password
- email ถูก generate จาก `{phone}@gmail.com` (ผู้ใช้กรอกแค่เบอร์โทร)
- เมื่อ login สำเร็จ Supabase ออก **JWT session** เก็บใน localStorage อัตโนมัติ
- `AuthContext` ฟังก์ `onAuthStateChange` → โหลด profile + wallet ทันที

### ไฟล์หลัก
- `src/AuthContext.jsx`
- `src/ProtectedRoute.jsx`

### ฟังก์ชัน

| ฟังก์ชัน | การทำงาน |
|---------|---------|
| `signIn(phone, password)` | Login ด้วยเบอร์โทร + PIN → Supabase Auth |
| `signUp(formData)` | สมัครสมาชิก → สร้าง Auth user → อัปเดต profiles (ธนาคาร) → เรียก `set_user_pin` RPC |
| `signOut()` | ล้าง session |
| `refreshProfile()` | โหลด profiles + wallets ใหม่ → อัปเดต global state |
| `fetchProfile(userId)` | ดึง profiles join wallets → merge เป็น profile object เดียว |

### Profile Object ที่ได้
```js
profile = {
  // จาก profiles table
  id, member_id, full_name, phone, vip_level,
  referrer_id, bank_name, bank_account_number,
  bank_account_name, pin_hash, avatar_url,
  is_admin, created_at,
  // จาก wallets table (merged)
  balance, commission_balance, total_won, total_bets
}
```

---

## 5. ฐานข้อมูล (Database Schema)

### Tables

#### `profiles`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| id | uuid | FK → auth.users |
| member_id | text | รหัสสมาชิก เช่น TH260425012 |
| full_name | text | ชื่อ-นามสกุล |
| phone | text | เบอร์โทรศัพท์ |
| vip_level | text | MEMBER / VIP / VIP_GOLD |
| referrer_id | uuid | FK → profiles.id |
| bank_name | text | ชื่อย่อธนาคาร เช่น KBank |
| bank_account_number | text | เลขบัญชี |
| bank_account_name | text | ชื่อบัญชี |
| pin_hash | text | bcrypt hash ของ PIN |
| avatar_url | text | รูปโปรไฟล์ |
| is_admin | boolean | สิทธิ์แอดมิน |

#### `wallets`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| user_id | uuid | FK → profiles.id |
| balance | numeric | ยอดเงินปัจจุบัน |
| commission_balance | numeric | รายได้จากระบบแนะนำเพื่อน |
| total_won | numeric | รวมเงินที่ถูกรางวัลตลอดกาล |
| total_bets | numeric | รวมยอดแทงตลอดกาล |

#### `bets`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| user_id | uuid | เจ้าของโพย |
| market_id | uuid | FK → lottery_markets |
| lottery_code | text | รหัสตลาด เช่น TH_GOV |
| draw_date | date | วันที่ออกรางวัล |
| bet_type | text | 3_TOP / 2_TOP / RUN_TOP ฯลฯ |
| numbers | text | เลขที่แทง |
| amount | numeric | จำนวนเงิน |
| payout_rate | numeric | อัตราจ่าย |
| status | text | PENDING / WON / LOST |
| payout_amount | numeric | เงินรางวัลที่ได้รับ |

#### `lottery_markets`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| id | uuid | |
| name | text | ชื่อตลาด เช่น หวยรัฐบาล |
| code | text | TH_GOV / HANOI / MALAY ฯลฯ |
| category | text | GOV / FOREIGN / STOCK |
| draw_time | time | เวลาออกรางวัล |
| close_minutes_before | int | ปิดรับกี่นาทีก่อนออก |
| is_open | boolean | เปิดรับแทงอยู่หรือไม่ |
| is_active | boolean | แสดงในระบบหรือไม่ |

#### `transactions`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| user_id | uuid | |
| type | text | DEPOSIT / WITHDRAW / BET / WIN / BONUS / COMMISSION |
| amount | numeric | จำนวนเงิน |
| status | text | COMPLETED / PENDING / REJECTED |
| note | text | คำอธิบาย |

#### `deposit_requests`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| user_id | uuid | |
| amount | numeric | จำนวนที่แจ้งฝาก |
| slip_url | text | URL สลิปใน Storage |
| status | text | PENDING / APPROVED / REJECTED |

#### `withdraw_requests`
| Column | Type | หมายเหตุ |
|--------|------|---------|
| user_id | uuid | |
| amount | numeric | จำนวนที่ขอถอน |
| bank_name / bank_account_number / bank_account_name | text | สำเนาจาก profiles |
| status | text | PENDING / APPROVED / REJECTED |

#### `settings`
| Key | ค่าปัจจุบัน | หมายเหตุ |
|-----|-----------|---------|
| min_bet | 1 | แทงขั้นต่ำ (บาท) |
| min_deposit | 100 | ฝากขั้นต่ำ (บาท) |
| min_withdraw | 300 | ถอนขั้นต่ำ (บาท) |
| company_bank_name | ธนาคารกสิกรไทย | |
| company_bank_account_number | 123-4-56789-0 | |
| company_bank_account_name | บจก. ทีเอช-ลอตโต พรีเมียม | |
| company_bank_code | KBANK | |
| contact_line_url | https://line.me/ti/p/@thlotto | |
| maintenance_mode | false | |
| system_status | ONLINE | |

---

## 6. RPC Functions (Database Functions)

### `set_user_pin(p_pin, p_user_id)`
- **ใช้ที่:** Register → AuthContext.signUp
- **การทำงาน:** รับ PIN plaintext → `crypt(p_pin, gen_salt('bf'))` → บันทึก `pin_hash` ใน profiles
- **Security:** SECURITY DEFINER

### `place_bet_securely(p_market_id, p_bets)`
- **ใช้ที่:** Betting.jsx
- **p_bets:** `[{ numbers, bet_type, amount, payout_rate }]`
- **การทำงาน:**
  1. ตรวจสอบ auth
  2. ตรวจ lottery_market ว่า is_open = true
  3. ตรวจ amount >= min_bet
  4. ตรวจ balance เพียงพอ
  5. INSERT ลง bets ทุกรายการ
  6. UPDATE wallets.balance (หัก)
  7. INSERT transactions type=BET

### `request_withdrawal_securely(p_amount, p_pin)`
- **ใช้ที่:** Withdrawal.jsx
- **การทำงาน:**
  1. ตรวจสอบ auth
  2. verify PIN ด้วย `crypt(p_pin, pin_hash)`
  3. ตรวจ amount >= min_withdraw
  4. ตรวจ balance เพียงพอ
  5. INSERT ลง withdraw_requests
  6. UPDATE wallets.balance (หัก)
  7. INSERT transactions type=WITHDRAW status=PENDING

### `submit_deposit_slip(p_amount, p_slip_url)`
- **ใช้ที่:** UploadSlip.jsx
- **การทำงาน:** INSERT ลง deposit_requests status=PENDING (รอแอดมินอนุมัติ)

### `transfer_referral_income()`
- **ใช้ที่:** Affiliate.jsx
- **การทำงาน:**
  1. ดึง commission_balance จาก wallets
  2. balance += commission_balance
  3. commission_balance = 0
  4. INSERT transactions type=COMMISSION

### `spin_lucky_wheel()`
- **ใช้ที่:** LuckyWheel.jsx
- **ค่าหมุน:** 10 บาท/ครั้ง
- **รางวัล:** ฿50 (5%), ฿20 (10%), ฿10 (20%), ฿5 (30%), ลองใหม่ (35%)
- **การทำงาน:**
  1. หัก 10 บาทจาก wallets
  2. สุ่มรางวัลตาม probability
  3. ถ้าได้เงิน → เพิ่ม balance + INSERT transactions type=WIN
  4. INSERT transactions type=BET (ค่าหมุน)
  5. return `{ success, prize, amount, message }`

---

## 7. ระบบหน้าต่างๆ (Pages)

### หน้าสาธารณะ (ไม่ต้อง Login)

#### `/login` — Login.jsx
- กรอก **เบอร์โทร + PIN**
- เรียก `signIn()` จาก AuthContext
- redirect → `/home` เมื่อสำเร็จ

#### `/register` — Register.jsx
- **2 ขั้นตอน:** ข้อมูลส่วนตัว → ข้อมูลธนาคาร
- รับ `?ref=XXXXXX` จาก URL → pre-fill รหัสแนะนำอัตโนมัติ
- ธนาคารที่รองรับ: KBank, SCB, BBL, KTB, BAY, GSB, อื่นๆ
- redirect → `/registration-success`

---

### หน้าที่ต้อง Login (Protected)

#### `/home` — Home.jsx
- แสดง **Slider/Banner** จาก `sliders` table
- แสดง **ตลาดหวยยอดนิยม** พร้อม Countdown timer ถึงเวลาปิดรับ
- แสดง **โปรโมชั่น** จาก `promotions` table
- แสดง **บทความ** จาก `articles` table
- Navigation bar ด้านล่าง: หน้าหลัก / โพย / แทง / กระเป๋า / โปรไฟล์

#### `/lottery-list` — LotteryList.jsx
- แสดงรายการตลาดหวยทั้งหมด แบ่งหมวด: **ทั้งหมด / รัฐบาล / หุ้น / ต่างประเทศ**
- มี Countdown timer แต่ละตลาด
- กด → ไป `/betting?draw={market_id}`

#### `/betting?draw={id}` — Betting.jsx
- เลือกประเภทการแทง: 4 ตัวบน / 3 ตัวบน / 3 ตัวโต๊ด / 3 ตัวล่าง / 3 ตัวหน้า / 2 ตัวบน / 2 ตัวล่าง / วิ่งบน / วิ่งล่าง
- กด Numpad → เลขครบ → เพิ่มลงตะกร้า (cart) อัตโนมัติ
- แสดง Countdown ถึงเวลาปิดรับ (คำนวณจาก `draw_time - close_minutes_before`)
- กด "ส่งโพย" → เรียก `place_bet_securely` RPC

#### `/bet-history` — BetHistory.jsx
- ดูประวัติการแทงทั้งหมด แยก tab: ทั้งหมด / PENDING / WON / LOST
- สรุปยอดแทงรวม + ถูกรางวัลรวม
- join `lottery_markets` เพื่อแสดงชื่อตลาด

#### `/results` — Results.jsx
- ดูผลหวย แยก: วันนี้ / เมื่อวาน / ย้อนหลัง
- query `lottery_results` join `lottery_markets`
- แสดงผล: เลขหน้า 3 / 2 ตัวบน / 3 ตัวบน / 2 ตัวล่าง ฯลฯ

#### `/wallet` — Wallet.jsx
- แสดง **Balance card** สไตล์บัตร ATM
- แสดงรายการ transactions ล่าสุด
- ปุ่มไป: ฝากเงิน / ถอนเงิน / ประวัติทั้งหมด

#### `/deposit` — Deposit.jsx
- แสดงบัญชีธนาคารบริษัท (ดึงจาก `settings`)
- กรอกจำนวนเงิน / ปุ่มเลือกด่วน
- กด "ถัดไป" → ไป `/upload-slip` พร้อม amount

#### `/upload-slip` — UploadSlip.jsx
- อัปโหลดไฟล์สลิป (รูปภาพ, max 5MB)
- Upload ไปที่ **Supabase Storage** bucket `deposit-slips`
- เรียก `submit_deposit_slip(amount, slip_url)` RPC
- มี countdown 10 นาที สำหรับการส่งสลิป

#### `/withdrawal` — Withdrawal.jsx
- แสดงยอดคงเหลือ + บัญชีธนาคารที่ผูกไว้
- กรอกจำนวนเงิน (ขั้นต่ำดึงจาก `settings.min_withdraw`)
- กรอก PIN 6 หลัก (แสดงเป็น dots)
- เรียก `request_withdrawal_securely(amount, pin)` RPC

#### `/withdrawal-confirm` — WithdrawalConfirm.jsx
- หน้ายืนยันการส่งคำขอถอนเงินสำเร็จ
- แสดงจำนวนเงิน + ธนาคาร
- ปุ่ม: กลับหน้าหลัก / ดูประวัติ

#### `/transactions` — Transactions.jsx
- สรุปรายรับ-รายจ่ายของเดือนปัจจุบัน
- filter ประเภท: ทั้งหมด / ฝาก / ถอน / แทง / ถูกรางวัล
- แสดง status badge: สำเร็จ (COMPLETED) / รอตรวจสอบ (PENDING) / ปฏิเสธ (REJECTED)

#### `/profile` — Profile.jsx
- แสดง avatar + ชื่อ + member_id + vip_level
- สถิติ: ยอดเงิน / จำนวนการแทง / ถูกรางวัล
- ระบบแนะนำเพื่อน: ลิงก์ + ปุ่มคัดลอก (clipboard API)
- เมนู: เปลี่ยนรหัส / บัญชีธนาคาร / ศูนย์ช่วยเหลือ / ออกจากระบบ

#### `/edit-profile` — EditProfile.jsx
- แก้ไข full_name
- บันทึก → `profiles` table → เรียก `refreshProfile()`

#### `/affiliate` — Affiliate.jsx
- แสดง commission_balance (รายได้จากแนะนำเพื่อน)
- แสดงรายชื่อผู้ที่สมัครผ่านลิงก์ของเรา (query profiles ที่ referrer_id = user.id)
- ปุ่ม "โอนเงินเข้ากระเป๋า" → เรียก `transfer_referral_income()` RPC
- ปุ่มคัดลอก + แชร์ลิงก์ `?ref={member_id}`

#### `/lucky-wheel` — LuckyWheel.jsx
- วงล้อ 8 ช่อง (฿50 / ฿20 / ฿10 / ฿5 / ลองใหม่)
- ค่าหมุน 10 บาท/ครั้ง
- กด SPIN → เรียก `spin_lucky_wheel()` RPC → animate ล้อ 4 วินาที → แสดง Modal รางวัล
- แสดงประวัติการหมุน 5 ครั้งล่าสุด

#### `/notifications` — Notifications.jsx
- แสดงการแจ้งเตือนทั้งหมด
- **Realtime subscription** ด้วย Supabase Realtime channel
- กดอ่าน → UPDATE `is_read = true`
- filter: ทั้งหมด / ยังไม่อ่าน

#### `/support` — Support.jsx
- หน้า chat UI (mockup)
- ดึง LINE URL จาก `settings.contact_line_url`
- ปุ่มทุกปุ่ม → เปิด LINE OA ใน browser tab ใหม่

---

## 8. Row Level Security (RLS)

ทุก table เปิด RLS — ผู้ใช้เข้าถึงได้เฉพาะข้อมูลตัวเอง

| Table | Policy |
|-------|--------|
| profiles | auth.uid() = id |
| wallets | auth.uid() = user_id |
| bets | auth.uid() = user_id |
| transactions | auth.uid() = user_id |
| deposit_requests | auth.uid() = user_id |
| withdraw_requests | auth.uid() = user_id |
| notifications | auth.uid() = user_id |
| lottery_markets | public read (ทุกคนดูได้) |
| lottery_results | public read |
| settings | public read |
| sliders | public read (is_active = true) |
| promotions | public read (is_active = true) |

---

## 9. ประเภทหวยที่รองรับ

### หมวด GOV (รัฐบาล)
- หวยรัฐบาลไทย (TH_GOV) — ออก 15:30

### หมวด FOREIGN (ต่างประเทศ)
- หวยลาวพัฒนา (LAO_DEV) — ออก 20:30
- ฮานอยปกติ (HANOI) — ออก 19:30
- ฮานอย VIP (HANOI_VIP) — ออก 19:00
- ฮานอยพิเศษ (HANOI_SPECIAL) — ออก 18:30
- หวยมาเลย์ (MALAY) — ออก 16:00

### หมวด STOCK (หุ้น)
- หุ้นนิเคอิเช้า/บ่าย, จีนเช้า/บ่าย, ฮั่งเส็งเช้า/บ่าย, เกาหลี, ไต้หวัน, สิงคโปร์, อินเดีย, รัสเซีย, เยอรมัน, อังกฤษ, ดาวน์โจนส์, อียิปต์

---

## 10. ประเภทการแทง + อัตราจ่าย

| ประเภท | Code | ตัวเลข | อัตราจ่าย |
|--------|------|--------|----------|
| 4 ตัวบน | 4_TOP | 4 หลัก | x 7,000 |
| 3 ตัวบน | 3_TOP | 3 หลัก | x 900 |
| 3 ตัวโต๊ด | 3_TOD | 3 หลัก | x 150 |
| 3 ตัวล่าง | 3_BOTTOM | 3 หลัก | x 450 |
| 3 ตัวหน้า | 3_FRONT | 3 หลัก | x 450 |
| 2 ตัวบน | 2_TOP | 2 หลัก | x 95 |
| 2 ตัวล่าง | 2_BOTTOM | 2 หลัก | x 95 |
| วิ่งบน | RUN_TOP | 1 หลัก | x 3.2 |
| วิ่งล่าง | RUN_BOTTOM | 1 หลัก | x 4.2 |

---

## 11. Environment Variables

ไฟล์ `.env` ที่ต้องมี:

```env
VITE_SUPABASE_URL=https://ygopnjbvccenryejqmlw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 12. การ Deploy

- Build: `npm run build`
- Output: `dist/` folder
- Deploy ได้บน: Netlify / Vercel / Cloudflare Pages
- ตั้งค่า Redirect rule: `/* → /index.html` (สำหรับ SPA routing)

---

## 13. Flow การทำงานหลัก

### Flow ฝากเงิน
```
ผู้ใช้ → /deposit (กรอกจำนวน)
    → /upload-slip (อัปโหลดสลิป → Storage)
    → submit_deposit_slip RPC
    → deposit_requests (PENDING)
    → แอดมินอนุมัติ → balance เพิ่ม
```

### Flow ถอนเงิน
```
ผู้ใช้ → /withdrawal (กรอกจำนวน + PIN)
    → request_withdrawal_securely RPC (verify PIN)
    → balance หัก ทันที
    → withdraw_requests (PENDING)
    → แอดมินโอนเงิน → สถานะเปลี่ยน APPROVED
```

### Flow แทงหวย
```
ผู้ใช้ → /lottery-list (เลือกตลาด)
    → /betting?draw={id} (เลือกประเภท + กด numpad)
    → cart (รายการรอส่ง)
    → place_bet_securely RPC
    → bets (PENDING) + balance หัก + transactions (BET)
    → รอผลออก → admin ตรวจผล → WON/LOST
```

### Flow แนะนำเพื่อน
```
ผู้ใช้ A แชร์ลิงก์ → /register?ref={member_id}
    → ผู้ใช้ B สมัคร → handle_new_user trigger
    → profiles.referrer_id = A.id
    → เมื่อ B ทำธุรกรรม → commission เพิ่มให้ A
    → A กด "โอนเงินเข้ากระเป๋า" → transfer_referral_income RPC
```
