# AGENT.md — กติกาสำหรับ AI Agent ในโปรเจกต์ TH-LOTTO

---

## หลักการสำคัญ

**AI = คนลงมือทำเร็ว**
**มนุษย์ = คนตัดสินใจและอนุมัติเสมอ**

---

## กติกาที่ AI ต้องทำตามเสมอ

### ก่อนเขียนโค้ด
1. **วิเคราะห์ requirement ก่อนเสมอ** — ห้ามเขียนโค้ดทันที
2. **บอกว่าจะแก้ไฟล์ไหนบ้าง** ก่อนลงมือ
3. **แบ่งงานเป็น step เล็กๆ** ห้ามทำหลายอย่างในครั้งเดียว
4. **ถ้าไม่แน่ใจ ถามก่อน** อย่าเดาเอง

### ขณะเขียนโค้ด
5. **ห้ามลบโค้ดเดิมโดยไม่จำเป็น** และไม่มีเหตุผล
6. **ห้ามแก้ไฟล์ที่ไม่เกี่ยวข้องกับ requirement**
7. **ห้ามเพิ่ม package แปลกๆ** โดยไม่แจ้ง
8. **เขียนโค้ดให้อ่านง่าย** เหมาะกับการ maintain ระยะยาว
9. **คำนึงถึง security เสมอ** — ไม่ hardcode key, ไม่เปิด endpoint สาธารณะโดยไม่จำเป็น

### หลังเขียนโค้ด
10. **สรุปสิ่งที่เปลี่ยนแปลงทุกครั้ง** — ไฟล์ไหน เปลี่ยนอะไร ทำไม
11. **อธิบาย logic ที่ซับซ้อน** ถ้า owner ถาม
12. **แจ้ง risk / side effect** ถ้ามีสิ่งที่ต้องระวัง

---

## สิ่งที่ห้ามทำ

| ห้าม | เหตุผล |
|------|--------|
| เขียนทั้งระบบในครั้งเดียว | โค้ดซับซ้อน ตามบั้งยาก |
| ตัดสินใจ business logic เอง | เจ้าของโปรเจกต์ต้องเป็นคนกำหนด |
| แก้ Home.jsx, Auth, DB schema โดยไม่รับคำสั่ง | ผลกระทบวงกว้าง |
| Deploy โดยไม่ขออนุญาต | ส่งผลกระทบ production จริง |
| เชื่อ assumption เอง 100% | ต้องยืนยันจาก codebase จริง |

---

## ขั้นตอนทำงานที่ถูกต้อง

```
1. รับ requirement
2. วิเคราะห์ + วางแผน (บอกไฟล์ที่จะแก้)
3. รอ owner อนุมัติแผน
4. ลงมือทำทีละ step
5. สรุปสิ่งที่เปลี่ยน
6. owner ตรวจ diff + รัน test
7. commit ก่อน step ถัดไป
```

---

## Git Workflow

```bash
# ก่อนให้ AI แก้โค้ดทุกครั้ง
git add .
git commit -m "checkpoint: ก่อนแก้ [feature]"

# ถ้า AI แก้แล้วพัง
git restore .          # ย้อนกลับไฟล์ที่ยังไม่ commit
git reset --hard HEAD  # ย้อนกลับ commit ล่าสุด
```

---

## โครงสร้างโปรเจกต์ปัจจุบัน

```
thlotto-app-main/    ← User App (React + Vite)
  src/pages/         ← หน้าต่างๆ ของผู้ใช้
  src/components/    ← UI components
  src/AuthContext.jsx ← Authentication state

thlotto-admin/       ← Admin Panel (React + Vite)
  src/pages/         ← หน้า admin

Supabase (Backend)
  PostgreSQL         ← ฐานข้อมูลหลัก
  RPC Functions      ← Business logic (server-side)
  Edge Functions     ← Automation (fetch-and-settle)
  Cron Jobs          ← ระบบอัตโนมัติทุก 1-2 นาที
```

---

## เทคโนโลยีที่ใช้ (ห้ามเปลี่ยนโดยไม่ขออนุญาต)

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deploy:** Vercel
- **Automation:** pg_cron + Edge Functions

---

## จุดที่ต้องระวังเป็นพิเศษ

| จุด | ความเสี่ยง |
|-----|-----------|
| `place_bet_securely` RPC | กระทบเงินผู้ใช้โดยตรง |
| `fn_settle_result` trigger | คำนวณรางวัล auto — ผิดพลาดกระทบทุก bet |
| `wallets` table | ยอดเงินจริง ห้ามแก้โดยไม่มี RPC guard |
| `draw_schedules` | ผิดพลาดทำให้ตลาดเปิด/ปิดผิดวัน |
| `lottery_results` | เป็น trigger point สำหรับ settle ทั้งระบบ |
