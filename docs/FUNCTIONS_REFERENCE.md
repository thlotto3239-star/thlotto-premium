# TH-LOTTO Premium — Functions Reference
**อัพเดทล่าสุด:** 29 เม.ย. 2569  
**สถานะ User App:** ✅ Production Ready  
**Production URL:** https://th-lotto-app.vercel.app

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
