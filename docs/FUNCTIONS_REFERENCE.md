# TH-LOTTO Premium — Backend Functions Reference (ฉบับสมบูรณ์)
**อัพเดทล่าสุด:** 29 เม.ย. 2569  
**สถานะ User App:** ✅ Production Ready  
**Production URL:** https://th-lotto-app.vercel.app  
**GitHub:** https://github.com/thlotto3239-star/thlotto-premium  
**Database:** Supabase — ygopnjbvccenryejqmlw.supabase.co

---

## ภาพรวมระบบอัตโนมัติ

```
Google Sheet CSV (ผลรางวัล)
        ↓ ทุก 2 นาที (cron)
fetch-and-settle Edge Function
        ↓
fn_import_csv_result() → บันทึกผลลง lottery_results
        ↓
process_lottery_draw() → ตรวจโพยทุกใบ → check_bet_winner()
        ↓
WON → บวก balance + แจ้งเตือน user
LOST → update status = LOST
        ↓
User เห็น realtime ผ่าน Supabase Realtime
```

---

## 1. Security Functions (พื้นฐาน)

### `is_admin()` → boolean
- ตรวจว่า `auth.uid()` ที่ login อยู่มี `is_admin = true` ใน profiles หรือไม่
- ใช้ใน RLS policies และ admin functions ทุกตัว
- มี 2 version: ไม่มี parameter (ใช้ uid ปัจจุบัน) และ `is_admin(uid uuid)`

### `assert_admin()` → void
- เรียก `is_admin()` แล้ว RAISE EXCEPTION ถ้าไม่ใช่ admin
- ใช้แทน `is_admin()` ใน admin functions เพื่อหยุดทันทีถ้าไม่มีสิทธิ์

---

## 2. User Functions (ผู้ใช้เรียกโดยตรง)

### `handle_new_user()` → trigger
**เรียกเมื่อ:** INSERT เข้า auth.users  
**ทำงาน:**
1. generate `member_id` ไม่ซ้ำ (loop จนกว่าจะไม่ซ้ำ)
2. รับ `referrer_code` จาก metadata → หา referrer_id
3. INSERT profiles (id, member_id, full_name, phone, bank_name, bank_account_number, referrer_id, status=active)
4. INSERT wallets (balance=0, commission_balance=0, total_won=0, total_bets=0)
5. ON CONFLICT → update bank info และ referrer_id

### `set_user_pin(p_pin, p_user_id?)` → jsonb
**หน้าที่:** บันทึก PIN  
**ตรวจ:** auth.uid() ≠ null, format ^\d{4}$, ถ้า target ≠ caller ต้องเป็น admin  
**action:** UPDATE profiles SET pin_hash = crypt(p_pin, gen_salt('bf'))  
**return:** `{success: true}` หรือ error message

### `place_bet_securely(p_market_id, p_bets jsonb)` → jsonb
**หน้าที่:** แทงหวยอย่างปลอดภัย  
**ตรวจลำดับ:**
1. auth.uid() ≠ null
2. market exists + is_active = true
3. draw_schedule เปิดอยู่ (close_time > now(), status IN open/closing)
4. แต่ละ bet มี amount ≥ min_bet (จาก settings)
5. balance ≥ total_amount  

**action:** INSERT bets ทุกรายการพร้อม draw_schedule_id + draw_date  
**Trigger:** trg_fn_bet_deduct หักเงินอัตโนมัติหลัง INSERT

### `submit_deposit_slip(p_amount, p_slip_url, p_promo_code?)` → jsonb
**หน้าที่:** ส่งสลิปฝากเงิน  
**ตรวจ:** auth.uid(), amount ≥ min_deposit (settings), promo_code valid (ถ้าส่งมา)  
**action:** INSERT deposit_requests (status=PENDING, promo_code)  
**return:** `{success: true, request_id: uuid}`

### `request_withdrawal_securely(p_amount, p_pin)` → jsonb
**หน้าที่:** ขอถอนเงิน  
**ตรวจลำดับ:**
1. auth.uid() ≠ null
2. amount ≥ min_withdrawal (settings)
3. PIN ถูกต้อง → crypt(p_pin, pin_hash) = pin_hash
4. balance ≥ amount
5. daily_withdraw_limit ไม่เกิน (settings)  

**action:** หักเงินจาก wallet → INSERT withdraw_requests (PENDING) → INSERT transactions (PENDING)  
**return:** `{success: true, balance_after: xxx}`

### `spin_lucky_wheel()` → jsonb
**หน้าที่:** หมุนวงล้อลุ้นโชค  
**ตรวจลำดับ:**
1. auth.uid() ≠ null
2. today_spins < daily_limit (settings: lucky_wheel_daily_limit)
3. balance ≥ spin_cost (settings: lucky_wheel_cost)  

**action:** หัก spin_cost → weighted random ตาม probability ของ prizes → บวกรางวัล (ถ้า amount > 0) → บันทึก transactions + lucky_wheel_spins  
**return:** `{success, prize, amount, slot_index, spins_left, message}`

### `get_spin_status()` → jsonb
**หน้าที่:** ตรวจสถานะวงล้อวันนี้  
**return:** `{spins_used, spins_left, daily_limit, spin_cost, can_spin, prizes[]}`

### `get_markets_with_countdown()` → TABLE
**หน้าที่:** ดึงตลาดทั้งหมดพร้อม countdown  
**ข้อมูล:** id, name, code, category, logo_url, draw_time, next_close_time, next_draw_date, schedule_status, is_open  
**is_open:** `close_time > now()` คำนวณ realtime

### `get_user_stats()` → jsonb
**หน้าที่:** ดึงสถิติรวมของ user  
**return:** balance, commission_balance, total_won, total_bets, pending_bets, won_bets, pending_deposits, pending_withdraws

### `transfer_referral_income()` → jsonb
**หน้าที่:** โอน commission_balance → balance หลัก  
**ตรวจ:** commission_balance > 0  
**action:** UPDATE wallets SET balance += commission_balance, commission_balance = 0 → INSERT transactions (COMMISSION)

---

## 3. Admin Functions

### `admin_approve_deposit(p_request_id, p_note?)` → void
**ตรวจ:** is_admin(), status = PENDING  
**action ทั้งหมด:**
1. UPDATE deposit_requests → APPROVED
2. UPDATE wallets balance + amount
3. INSERT transactions (DEPOSIT, COMPLETED)
4. apply_promotion() ถ้ามี promo_code
5. INSERT notifications แจ้ง user
6. คำนวณ commission ให้ referrer (referral_commission_rate จาก settings, default 0.5%)
7. UPDATE wallets.commission_balance ของ referrer
8. INSERT transactions + notifications ให้ referrer

### `admin_reject_deposit(p_request_id, p_note?)` → void
**action:** UPDATE → REJECTED → INSERT notification แจ้ง user

### `admin_approve_withdraw(p_request_id, p_note?)` → void
**ตรวจ:** is_admin(), status = PENDING  
**action:** UPDATE withdraw_requests → APPROVED → UPDATE transactions → COMPLETED → INSERT notification แจ้ง user

### `admin_reject_withdraw(p_request_id, p_note?)` → void
**action:** UPDATE → REJECTED → **คืนเงิน** (balance + amount) → INSERT transactions คืนเงิน → INSERT notification

### `admin_set_result_and_settle(p_market_id, p_draw_date, p_result_main, p_3top, p_3bottom, p_3front, p_2top, p_2bottom)` → jsonb
**ใช้เมื่อ:** กรณีต้องการ override ผลรางวัลด้วยตนเอง (fallback)  
**action:**
1. Upsert lottery_results
2. UPDATE draw_schedules → done
3. Loop PENDING bets → check_bet_winner() → WON/LOST → บวก balance + notifications

### `admin_adjust_wallet(p_user_id, p_delta, p_note)` → jsonb
**action:** UPDATE wallets balance ± delta → INSERT transactions (ADMIN_CREDIT/ADMIN_DEBIT)

### `admin_update_member(p_user_id, p_patch jsonb)` → void
**แก้ได้:** status, vip_level, is_admin, full_name, phone, bank_name, bank_account_number, bank_account_name

### `admin_list_members(p_search?, p_limit?, p_offset?)` → jsonb
**return:** รายชื่อสมาชิกพร้อม balance, commission_balance, total_won, total_bets

### `admin_dashboard_stats()` → jsonb
**return:** total_members, new_today, pending_deposits, pending_withdraws, today_deposit, today_withdraw, today_bets, today_payouts, total_balance, open_markets, pending_results

### `admin_upsert_setting(p_key, p_value)` → void
**action:** INSERT/UPDATE settings ON CONFLICT key

---

## 4. Lottery Result Processing Functions

### `fn_import_csv_result(p_market_code, p_draw_date, p_result_main, p_top3, p_bot2, p_col6, p_front3?)` → jsonb
**เรียกโดย:** Edge Function `fetch-and-settle` และ `sync-results` ทุก 2-15 นาที  
**ตรวจ:** ถ้า result_main เป็น xxx/xx/xxxxxx/รอผล → skip (ยังไม่มีผล)  
**action:**
1. หา market_id จาก code
2. UPSERT lottery_results (ON CONFLICT → update ผลใหม่)
3. UPDATE draw_schedules → done
4. เรียก `process_lottery_draw()` → settle bets อัตโนมัติ

### `process_lottery_draw(p_market_id, p_result_p1, p_result_3front?, p_result_3bottom?, p_result_bottom2?)` → jsonb
**หน้าที่:** settle bets ทุกใบของตลาด+วันที่นั้น  
**action:**
1. คำนวณ 2bottom, 3top, 2top, 4top จาก result_p1
2. UPSERT lottery_results
3. Loop PENDING bets → `check_bet_winner()` → WON: บวก balance + INSERT transactions(WIN) + notifications | LOST: update status
**return:** `{result_id, market, draw_date, won, lost, total_payout}`

### `check_bet_winner(p_bet_numbers, p_bet_type, p_result_p1, p_result_3front?, p_result_3bottom?, p_result_bottom2?)` → boolean
**รองรับประเภท:** 4TOP, 3TOP, 3TODE (โต๊ด), 3FRONT, 3BOTTOM, 2TOP, 2BOTTOM, RUN_UP (วิ่งบน), RUN_DOWN (วิ่งล่าง)

### `apply_promotion(p_user_id, p_promo_code, p_deposit_amount)` → jsonb
**เรียกโดย:** admin_approve_deposit  
**ตรวจ:** promo active, deposit ≥ min_deposit  
**คำนวณ:** bonus = MAX(deposit × bonus_rate%, bonus_amount) — cap ที่ max_withdrawal  
**action:** UPDATE wallets + INSERT transactions (BONUS)

---

## 5. Automation Functions (Cron + Triggers)

### `fn_update_draw_status()` → void
**รันทุก:** 1 นาที (cron: update-draw-status-cron)  
**action:** open → closing เมื่อ close_time ≤ now | closing → waiting เมื่อ result_time ≤ now

### `trg_fn_bet_deduct` → trigger
**รันเมื่อ:** INSERT บน bets  
**action:** UPDATE wallets.balance -= bet.amount

### `trg_fn_create_wallet` → trigger
**รันเมื่อ:** INSERT บน profiles  
**action:** สร้าง wallet ให้ user ใหม่อัตโนมัติ

---

## 6. Edge Functions (Supabase)

| Function | รันทุก | ทำงานอะไร |
|---|---|---|
| `fetch-and-settle` | 2 นาที | ดึง CSV → fn_import_csv_result → settle bets |
| `sync-results` | 15 นาที | sync ผลรางวัลทุกตลาดจาก Google Sheet |
| `update-lottery-round-status` | 1 นาที | อัพเดทสถานะตลาด open/closing/done |
| `import-draw-schedules-from-sheet` | manual | import ตาราง draw schedules |

**แหล่งข้อมูลผลรางวัล (ONLY):**  
CSV: `https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv`

---

## 7. Settings Keys ที่ระบบใช้

| Key | ความหมาย | default |
|---|---|---|
| `min_bet` | แทงขั้นต่ำ | 1 |
| `min_deposit` | ฝากขั้นต่ำ | 100 |
| `min_withdrawal` | ถอนขั้นต่ำ | 100 |
| `daily_withdraw_limit` | ถอนสูงสุด/วัน | - |
| `lucky_wheel_cost` | ค่าหมุนวงล้อ | 10 |
| `lucky_wheel_daily_limit` | หมุนได้/วัน | 5 |
| `referral_commission_rate` | % commission referrer | 0.005 (0.5%) |
| `live_stream_url` | YouTube live embed | - |
| `contact_line_url` | LINE URL | - |

---

## สรุป — Admin Panel ต้องพัฒนา

1. Dashboard → เรียก `admin_dashboard_stats()`
2. จัดการสมาชิก → `admin_list_members()` + `admin_update_member()`
3. อนุมัติฝาก → `admin_approve_deposit()` / `admin_reject_deposit()`
4. อนุมัติถอน → `admin_approve_withdraw()` / `admin_reject_withdraw()`
5. ปรับยอดเงิน → `admin_adjust_wallet()`
6. ตั้งค่าระบบ → `admin_upsert_setting()`
7. จัดการตลาด + เวลาออกรางวัล (lottery_markets)
8. จัดการวงล้อ → `admin_get_wheel_config()` + `admin_update_wheel_prize()`
9. จัดการโปรโมชั่น (CRUD promotions)
10. จัดการบทความ (CRUD articles)
11. จัดการ Banner/Slider

---

## ฟังก์ชัน User ใช้โดยตรง (9 ตัว)

| Function | หน้าที่ใช้ | การทำงาน | Security |
|---|---|---|---|
| `handle_new_user` | Register | Trigger สร้าง profile + wallet อัตโนมัติ | SECURITY DEFINER |
| `set_user_pin` | Register, ChangePassword | bcrypt hash PIN บันทึกใน profiles.pin_hash | SECURITY DEFINER |
| `place_bet_securely` | Betting | ตรวจ balance + ตลาดเปิด → หักเงิน → บันทึก bet | SECURITY DEFINER |
| `submit_deposit_slip` | UploadSlip | ตรวจ min_deposit → upload slip → สร้าง deposit request | SECURITY DEFINER |
| `request_withdrawal_securely` | Withdrawal | ตรวจ PIN + daily limit + min amount → หักเงิน → สร้าง request | SECURITY DEFINER |
| `spin_lucky_wheel` | LuckyWheel | ตรวจ credit + daily limit → หัก → random รางวัล → บวก balance | SECURITY DEFINER |
| `get_spin_status` | LuckyWheel | ตรวจจำนวนครั้งหมุนวันนี้ | SECURITY DEFINER |
| `get_markets_with_countdown` | LotteryList, Betting | ดึงตลาดที่เปิดพร้อม countdown ถึงปิดรับ | SECURITY DEFINER |
| `transfer_referral_income` | Affiliate | โอน commission_balance → balance หลัก | SECURITY DEFINER |

---

## ฟังก์ชัน Admin (15 ตัว)

| Function | การทำงาน |
|---|---|
| `admin_approve_deposit` | อนุมัติฝาก → บวก balance + โบนัส + commission referrer |
| `admin_reject_deposit` | ปฏิเสธฝาก + บันทึกหมายเหตุ |
| `admin_approve_withdraw` | อนุมัติถอน → เปลี่ยนสถานะ |
| `admin_reject_withdraw` | ปฏิเสธถอน → คืนเงิน + แจ้งเตือน |
| `admin_set_result_and_settle` | ตั้งผลรางวัล → settle bets → จ่ายเงินผู้ถูกอัตโนมัติ |
| `admin_adjust_wallet` | ปรับยอดเงิน user โดยตรง |
| `admin_update_member` | แก้ไขข้อมูลสมาชิก / ระงับบัญชี |
| `admin_list_members` | ดูรายชื่อสมาชิกทั้งหมด |
| `admin_list_bets` | ดูโพยทั้งหมด |
| `admin_dashboard_stats` | สถิติ dashboard |
| `admin_upsert_setting` | เพิ่ม/แก้ไข settings |
| `admin_upsert_restricted_number` | จำกัดเลขที่ไม่รับแทง |
| `admin_delete_restricted_number` | ลบเลขที่จำกัด |
| `admin_get_wheel_config` | ดู config วงล้อ |
| `admin_update_wheel_prize` | แก้ไขรางวัลวงล้อ |
| `admin_rebuild_draw_schedules` | rebuild ตาราง draw schedules |

---

## Triggers (Auto-run)

| Trigger | เมื่อไหร่ | ทำงานอะไร |
|---|---|---|
| `trg_fn_create_wallet` | INSERT profiles | สร้าง wallet ให้ user ใหม่อัตโนมัติ |
| `trg_fn_bet_deduct` | INSERT bets | หักเงินจาก wallet อัตโนมัติ |
| `trg_fn_on_result_announced` | UPDATE draw_results | settle bets อัตโนมัติเมื่อประกาศผล |
| `trg_fn_rebuild_schedules_on_market_update` | UPDATE lottery_markets | rebuild draw schedules |

---

## หน้าทั้งหมด 26 หน้า (Production)

### Public (ไม่ต้อง login)
| หน้า | URL | สถานะ |
|---|---|---|
| Login | `/login` | ✅ |
| Register | `/register` | ✅ รองรับ ?ref=CODE |

### Protected (ต้อง login)
| หน้า | URL | สถานะ |
|---|---|---|
| Home | `/home` | ✅ Balance realtime |
| ผลรางวัล | `/results` | ✅ Google Sheet CSV |
| รายการตลาด | `/lottery-list` | ✅ countdown |
| แทงหวย | `/betting` | ✅ Live Stream + countdown |
| ประวัติโพย | `/bet-history` | ✅ |
| กระเป๋าเงิน | `/wallet` | ✅ |
| ฝากเงิน | `/deposit` | ✅ |
| อัพโหลดสลิป | `/upload-slip` | ✅ + เลือกโปรโมชั่น |
| ฝากสำเร็จ | `/deposit-success` | ✅ |
| QR Payment | `/qr-payment` | ✅ |
| ถอนเงิน | `/withdrawal` | ✅ ต้องใส่ PIN |
| ยืนยันถอน | `/withdrawal-confirm` | ✅ |
| สมัครสำเร็จ | `/registration-success` | ✅ |
| โปรไฟล์ | `/profile` | ✅ stats + referral |
| แก้ไขข้อมูล | `/edit-profile` | ✅ |
| ธนาคาร | `/bank-account` | ✅ โลโก้ธนาคาร |
| เปลี่ยน PIN | `/change-password` | ✅ |
| ธุรกรรม | `/transactions` | ✅ |
| แจ้งเตือน | `/notifications` | ✅ |
| ช่วยเหลือ | `/support` | ✅ → LINE |
| โปรโมชั่น | `/promotions` | ✅ |
| แนะนำเพื่อน | `/affiliate` | ✅ commission system |
| วงล้อนำโชค | `/lucky-wheel` | ✅ |
| บทความ | `/articles` | ✅ |
| รายละเอียดบทความ | `/articles/:id` | ✅ |
| ข้อตกลง | `/terms` | ✅ |

---

## Security Summary

| | |
|---|---|
| RLS Policies | 44 policies ครอบทุก table |
| Write operations | ผ่าน RPC (SECURITY DEFINER) เท่านั้น |
| PIN | bcrypt hash, bypass ปิดแล้ว |
| Wallet | ห้าม update ตรง ต้องผ่าน RPC |

---

## Database — ข้อมูลปัจจุบัน

| Table | จำนวน |
|---|---|
| สมาชิก | 6 คน |
| Settings | 39 ค่า |
| ธนาคาร (active) | 8 ธนาคาร |
| ตลาดหวย (active) | 21 ตลาด |
| โปรโมชั่น | 10 รายการ |
| บทความ | 8 บทความ |

---

## สิ่งที่ Admin Panel ต้องพัฒนาต่อ

1. Dashboard สถิติรวม
2. จัดการสมาชิก (ดู/ระงับ/แก้ balance)
3. อนุมัติฝากเงิน (ดูสลิป)
4. อนุมัติถอนเงิน
5. ตั้งผลรางวัล → settle อัตโนมัติ
6. จัดการตลาดหวย
7. ตั้งค่าระบบ (live stream, min/max, rates)
8. จัดการวงล้อ
9. จัดการโปรโมชั่น
10. จัดการบทความ
11. จัดการแบนเนอร์
