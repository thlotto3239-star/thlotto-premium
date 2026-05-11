# TH-LOTTO Development Guide

> เอกสารนี้สำหรับ AI และนักพัฒนาที่จะทำงานต่อในอนาคต  
> อัพเดทล่าสุด: 2026-05-09

---

## 1. โครงสร้างระบบ

| ส่วน | เทคโนโลยี | URL |
|------|-----------|-----|
| User App | React + Vite + TailwindCSS | https://th-lotto-app.vercel.app/ |
| Admin Panel | React + Vite | https://th-lotto-admin.vercel.app/ |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) | — |
| Auto-deploy | GitHub → Vercel (push to main/master) | — |

## 2. GitHub Repos & Branches

- **User App**: `thlotto3239-star/thlotto-premium` → branch: `main`
- **Admin Panel**: `thlotto3239-star/TH-LOTTO-Admin-push` → branch: `master`

## 3. Deploy Flow

```
1. git commit (checkpoint ก่อนแก้)
2. แก้โค้ด
3. git commit + git push
4. Vercel auto-deploy อัตโนมัติ
```

**ห้าม**: deploy ไปโดเมนอื่น, สร้างโปรเจค Vercel ใหม่, แก้สิ่งที่ไม่เกี่ยว

## 4. Auth System

- ใช้ **SHA256(PIN + phone)** เป็น password
- PIN = ตัวเลข 4 หลัก
- Frontend hash ผ่าน Web Crypto API ก่อนส่ง Supabase Auth
- `pin_hash` ใน profiles = SHA256 hex สำหรับ verify ตอนถอนเงิน

## 5. Database — ตารางหลัก

| ตาราง | หน้าที่ |
|-------|---------|
| `profiles` | ข้อมูลสมาชิก (ผูก auth.users) |
| `wallets` | ยอดเงิน, commission, สถิติ |
| `bets` | รายการเดิมพัน |
| `transactions` | ประวัติ deposit/withdraw/win/bet |
| `deposit_requests` | คำขอฝากเงิน |
| `withdraw_requests` | คำขอถอนเงิน |
| `lottery_markets` | ตลาดหวยทั้งหมด |
| `lottery_results` | ผลหวย |
| `draw_schedules` | ตารางงวด (open/closing/waiting/done) |
| `payout_rates` | อัตราจ่าย |
| `settings` | ค่า config ระบบ |
| `notifications` | แจ้งเตือนผู้ใช้ |
| `admin_notifications` | แจ้งเตือนแอดมิน |

## 6. Cron Jobs (อัตโนมัติ)

| Job | Schedule | ทำอะไร |
|-----|----------|--------|
| `fn_update_draw_status()` | ทุก 1 นาที | open→closing→waiting→done(48h) |
| `fetch-and-settle` | ทุก 2 นาที | ดึง CSV → import ผล → settle เดิมพัน |
| `fn_cleanup_old_data()` | ทุกวัน 04:00 | ลบ login_attempts(24h), notifications(90d), schedules(7d), admin_notif(30d) |
| `fn_auto_cancel_pending_bets(48)` | ทุกวัน 04:00 | ยกเลิก bet ที่ค้าง pending > 48 ชม. |
| `backup-and-cleanup` | ทุก 7 วัน | สำรองข้อมูล |

## 7. RPC Functions ที่สำคัญ

### User-facing (frontend เรียก)
- `check_phone_exists(p_phone)` — เช็คเบอร์ซ้ำตอนสมัคร
- `set_user_pin(p_pin, p_user_id)` — ตั้ง/เปลี่ยน PIN
- `reset_user_password(p_phone, p_new_pin, p_bank_account_number)` — ลืมรหัสผ่าน
- `request_withdrawal_securely(p_amount, p_pin_hash)` — ถอนเงิน + verify PIN
- `submit_deposit_slip(p_amount, p_slip_url, p_promo_code)` — ส่งสลิปฝาก
- `place_bet_securely(p_market_id, p_bets)` — วางเดิมพัน
- `spin_lucky_wheel()` — หมุนกงล้อ
- `get_markets_with_countdown()` — รายการตลาดพร้อม countdown
- `get_spin_status()` — สถานะสิทธิ์หมุน
- `get_my_referrals()` — ดูลูกทีม
- `transfer_referral_income()` — โอน commission เป็นเงินจริง

### Admin-facing (admin panel เรียก)
- `admin_approve_deposit/reject_deposit` — อนุมัติ/ปฏิเสธฝาก
- `admin_approve_withdraw/reject_withdraw` — อนุมัติ/ปฏิเสธถอน
- `admin_adjust_wallet` — ปรับยอดเงิน
- `admin_list_members/admin_update_member` — จัดการสมาชิก
- `admin_set_result_and_settle` — ใส่ผลหวย manual
- `admin_dashboard_stats` — สถิติ dashboard
- `admin_rebuild_draw_schedules` — สร้างตารางงวดใหม่

## 8. RLS Policies — หลักการ

- `profiles` → SELECT: authenticated only, UPDATE: own row only
- `wallets/bets/transactions` → SELECT: own rows (user_id = auth.uid())
- `settings/banks/promotions` → SELECT: public (ไม่มีข้อมูลลับ)
- ทุก RPC ที่สำคัญใช้ **SECURITY DEFINER** → bypass RLS

## 9. ข้อห้ามเด็ดขาดในการพัฒนา

1. **ห้าม** ลบหรือแก้ไขสิ่งที่ทำงานอยู่ปกติ
2. **ห้าม** deploy โดยไม่ผ่านการยืนยันจากเจ้าของ
3. **ห้าม** แก้ database schema (ลบ column/table) โดยไม่ตรวจสอบว่ามี code อ้างอิง
4. **ห้าม** ลบ Edge Functions ที่ไม่แน่ใจว่าไม่ได้ใช้
5. **ห้าม** เปลี่ยน auth flow (SHA256 hashing)
6. **ต้อง** commit checkpoint ก่อนแก้โค้ดเสมอ
7. **ต้อง** ตรวจสอบ RLS policy หลังเปลี่ยน schema

## 10. คอลัมน์ legacy ใน lottery_results

| คอลัมน์ปัจจุบัน | คอลัมน์ legacy (ค่าเดียวกัน) | หมายเหตุ |
|-----------------|----------------------------|----------|
| `result_3top` | `result_top3` | ห้ามลบ — ทั้ง 2 มี code อ้างอิง |
| `result_2bottom` | `result_bottom2` | ห้ามลบ — ทั้ง 2 มี code อ้างอิง |

## 11. Admin Accounts

- **Super Admin**: 0622306037 (role=super_admin, permissions=['*'])
- **Admin Staff**: 0811111111 (role=admin, permissions=[deposits,withdrawals,members,bets])

---

*เอกสารนี้อัพเดทอัตโนมัติทุกครั้งที่มีการเปลี่ยนแปลงสำคัญ*
