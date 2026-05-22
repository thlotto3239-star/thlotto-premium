# PROJECT GUIDE - TH-LOTTO User App

## 🚨 สำคัญ - อ่านก่อนทำงานทุกครั้ง

**กฎเหล็ก:**
1. **อ่านเอกสารนี้ก่อนทำงานทุกครั้ง** - ห้ามข้ามเด็ดขาด
2. ใช้ฟังก์ชั่นที่มีอยู่แล้วเท่านั้น ห้ามสร้างใหม่
3. ตรวจสอบ field name จาก RPC/DB ก่อนเรียก
4. อัพเดทเอกสารทุกครั้งหลังทำงาน
5. Commit + push + deploy หลังทำงานเสร็จ
6. **ตรวจสอบสถานะล่าสุดก่อนแก้ไขทุกครั้ง** - ใช้ฟังก์ชั่นป้องกันโปรเจคพัง
7. **วิเคราะห์และอ่านรายละเอียดก่อนเสมอ** - ห้ามเดาหรือคิดแทน

---

## 📍 ข้อมูลโปรเจค

### User App (หน้าผู้ใช้)
- **Repo**: https://github.com/thlotto3239-star/thlotto-premium
- **Branch**: main
- **Live URL**: https://th-lotto-app.vercel.app
- **Local**: c:\Users\armyn\.windsurf\worktrees\thlotto-app-main\thlotto-app-main-9738fbe1
- **Download**: D:\TH-LOTTO-Projects\thlotto-premium
- **Vercel Project**: th-lottie-app (prj_tJriP88kWcWOSUQOo8E0UrwSJb7v)

### Admin Panel (หน้าแอดมิน)
- **Repo**: https://github.com/thlotto3239-star/TH-LOTTO-Admin-push
- **Branch**: master (ไม่ใช่ main)
- **Live URL**: https://th-lotto-admin.vercel.app
- **Local**: D:\TH-LOTTO-Projects\thlotto-admin
- **Vercel Project**: thlotto-admin (prj_qcbZ2uJ6PACcOUQIXiw6mt8ZP75N)

---

## 🔴 ห้ามทำ

- **ห้าม** สร้างฟังก์ชั่นใหม่โดยไม่ตรวจสอบว่ามีอยู่แล้ว
- **ห้าม** แก้โค้ดที่ทำงานได้อยู่แล้ว
- **ห้าม** deploy ไป domain อื่น
- **ห้าม** เปลี่ยน auth flow (SHA256)
- **ห้าม** ลบ DB schema โดยไม่ตรวจสอบ references
- **ห้าม** ข้ามการอัพเดทเอกสาร

---

## ✅ ขั้นตอนการทำงาน

### 1. อ่านเอกสาร
- PROJECT_GUIDE.md (ไฟล์นี้)
- AGENT_HANDOFF.md (ถ้ามี)
- PROJECT_STATUS.md
- DEVELOPMENT_GUIDE.md (ถ้ามี)
- CHANGELOG.md

### 2. ตรวจสอบสถานะล่าสุด (บังคับ)
- ตรวจสอบ Git status: `git status`
- ตรวจสอบ Git diff: `git diff`
- ตรวจสอบ Git log: `git log --oneline -5`
- ตรวจสอบว่าอยู่ใน repo ที่ถูกต้อง (User App vs Admin Panel)
- ตรวจสอบ branch (User App = main, Admin Panel = master)
- ตรวจสอบ field name จาก RPC/DB
- ตรวจสอบ deployment status ล่าสุด

### 3. รัน workflow /checkpoint (บังคับ)
```bash
git add -A
git commit -m "checkpoint: before work"
git tag -a checkpoint-YYYYMMDD-HHMMSS -m "Safety checkpoint"
git push origin <branch>
git push --tags
```

### 4. วิเคราะห์และทำความเข้าใจ (บังคับ)
- อ่าน code ที่เกี่ยวข้องทั้งหมด
- วิเคราะห์ flow การทำงาน
- ตรวจสอบจุดเชื่อมต่อทั้งหมด
- เข้าใจระบบทั้งหมดก่อนแก้ไข
- ห้ามเดาหรือคิดแทน

### 5. ทำงาน
- ใช้ฟังก์ชั่นที่มีอยู่แล้วเท่านั้น
- ตรวจสอบ field name จาก RPC/DB ก่อนเรียก
- ทำงานตามที่ต้องการ

### 6. Commit + Push + Deploy
```bash
git add -A
git commit -m "describe changes clearly"
git push origin <branch>
npx vercel --prod --yes
```

### 7. อัพเดทเอกสาร
- CHANGELOG.md (เพิ่ม version ใหม่ด้านบน)
- PROJECT_STATUS.md (อัพเดท version + date)

### 8. Commit Docs + Push + Deploy
```bash
git add CHANGELOG.md PROJECT_STATUS.md
git commit -m "docs: update CHANGELOG and PROJECT_STATUS"
git push origin <branch>
npx vercel --prod --yes
```

---

## 📊 สถานะปัจจุบัน

### User App
- ✅ หวยสลากกินแบ่งรัฐบาล
- ✅ หวยหนึ่งนาที (Instant Lottery)
- ✅ ระบบฝากเงิน
- ✅ ระบบถอนเงิน
- ✅ วงล้อโชคดี
- ✅ ระบบแนะนำ

### Admin Panel v1.0.1 (2026-05-14)
- ✅ Instant Lottery - หวยหนึ่งนาที (6 หน้า)
- ✅ 6 RPC สำหรับ admin
- ✅ เมนูหวยหนึ่งนาทีใน sidebar
- ✅ Routing ครบถ้วน

---

## 🔧 ฟังก์ชั่นที่มีอยู่แล้ว

### Instant Lottery RPCs (User App)
- place_instant_bet
- get_instant_draws
- get_instant_bet_types
- get_my_instant_bets

### Instant Lottery RPCs (Admin Panel)
- admin_get_instant_bet_types
- admin_get_instant_draws
- admin_get_instant_bets
- admin_update_instant_bet_type
- admin_toggle_instant_bet_type
- admin_get_instant_stats

### Instant Lottery Pages (User App)
- InstantLottery - หน้าหวยหนึ่งนาที

### Instant Lottery Pages (Admin Panel)
- InstantOverview
- InstantBetTypes
- InstantDraws
- InstantBets
- InstantResults
- InstantSettings

---

## 📝 เอกสารอื่นๆ

- AGENT_HANDOFF.md - ข้อมูลส่งมอบโปรเจค
- PROJECT_STATUS.md - สถานะโปรเจค
- DEVELOPMENT_GUIDE.md - คู่มือการพัฒนา
- CHANGELOG.md - บันทึกการเปลี่ยนแปลง
- DEPLOY_MAP.md - แผนการ deploy

---

## ⚠️ ปัญหาที่ต้องระวัง

### Field Name
- ตรวจสอบ field name จาก RPC/DB ก่อนเรียก
- อย่าสมมติ field name จาก frontend
- เคยมีปัญหา: bet_type vs type, rate vs payout_rate

### Branch
- User App = main
- Admin Panel = master (ไม่ใช่ main)
- ตรวจสอบ branch ก่อน commit + push

### Deploy
- User App deploy ไป https://th-lotto-app.vercel.app
- Admin Panel deploy ไป https://th-lotto-admin.vercel.app
- ห้าม deploy ไป domain อื่น
- **ตรวจสอบ .vercel/project.json ก่อน deploy ทุกครั้ง**
- **ตรวจสอบว่า project name ตรงกับ DEPLOY_MAP.md**
- **User App Vercel Project: th-lotto-app (prj_tJriP88kWcWOSUQOo8E0UrwSJb7v)**
- **Admin Panel Vercel Project: th-lotto-admin (prj_Un7pZtGDhtaxXOGaOXDajtLDpPWM)**

---

## 🎯 วิธีตรวจสอบ Field Name

1. เปิดไฟล์ RPC ใน Supabase
2. ตรวจสอบ parameter name และ return field name
3. เปรียบเทียบกับ frontend field name
4. แก้ frontend ให้ตรงกับ RPC/DB

---

## 📞 ติดต่อ

- ผู้ดูแลระบบ: 0622306037
- GitHub: thlotto3239-star

---

**อัพเดทล่าสุด: 2026-05-22 (15:17)**
- ✅ อัพเดทกฎเหล็กเพิ่มเติม (ตรวจสอบสถานะล่าสุด, วิเคราะห์ก่อนทำงาน)
- ✅ อัพเดทขั้นตอนการทำงานให้ชัดเจนขึ้น
- ✅ เพิ่มข้อมูล Vercel Project ID สำหรับการตรวจสอบก่อน deploy
- ✅ อัพเดทข้อมูลโปรเจคล่าสุด (Repo, Branch, Live URL, Local, Vercel Project)
