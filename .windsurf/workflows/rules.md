---
description: กฎเหล็กก่อนแก้โค้ดหรือ deploy โปรเจค TH-LOTTO
---

# กฎเหล็ก TH-LOTTO — บังคับทุก AI session

## ก่อนทำอะไรทั้งสิ้น
1. อ่าน DEVELOPMENT_GUIDE.md + PROJECT_STATUS.md + CHANGELOG.md ให้จบก่อน
2. ตรวจสอบว่าแก้ถูก repo (ดูตาราง DEPLOY_MAP.md)
   - **User App**: 	hlotto3239-star/thlotto-premium → branch main → https://th-lotto-app.vercel.app
   - **Admin Panel**: 	hlotto3239-star/TH-LOTTO-Admin-push → branch master → https://th-lotto-admin.vercel.app
3. ห้ามแก้สิ่งที่ทำงานอยู่ปกติ แก้เฉพาะที่ได้รับอนุญาต

## ก่อนแก้โค้ด
4. เทียบโค้ดเดิมก่อนแก้ — ถ้าเขียนฟังก์ชันใหม่ ต้องรักษา logic เดิมที่ทำงานอยู่ให้ครบ
5. ตรวจสอบ field name frontend ตรงกับ RPC/DB ทุกครั้ง — query DB เทียบ column name
6. commit checkpoint ก่อนแก้โค้ดเสมอ

## หลังแก้โค้ด
7. git add + git commit (ระบุสิ่งที่แก้ให้ชัดเจน)
8. git push origin main (หรือ master สำหรับ Admin)
9. deploy: 
px vercel --prod --yes
10. ตรวจสอบเว็บจริงว่าทำงานได้

## อัพเดทเอกสาร (บังคับทุกครั้ง)
11. อัพเดท CHANGELOG.md — เพิ่ม version ใหม่ด้านบนสุด ตามรูปแบบเดิม
12. อัพเดท PROJECT_STATUS.md — version + วันที่ + ตาราง bug
13. อัพเดท DEVELOPMENT_GUIDE.md ถ้ามีกฎใหม่
14. commit + push + deploy อีกรอบ

## ข้อห้ามเด็ดขาด
- ห้ามแก้สิ่งที่ทำงานอยู่ปกติ
- ห้าม deploy ไปโดเมนอื่น
- ห้ามสร้างโปรเจค Vercel ใหม่
- ห้ามเปลี่ยน auth flow (SHA256)
- ห้ามลบ DB schema โดยไม่ตรวจสอบ
- ห้ามข้ามขั้นตอนอัพเดทเอกสาร
