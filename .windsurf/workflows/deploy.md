---
description: Deploy User App to production
---

# Deploy User App (thlotto-premium)

## Pre-deploy checklist
1. ตรวจสอบว่าอยู่ใน repo ที่ถูกต้อง
2. ตรวจสอบ branch (User App = main, Admin = master)
3. อัพเดท CHANGELOG.md + PROJECT_STATUS.md แล้ว

## Deploy steps
// turbo
4. git add .
// turbo
5. git commit
// turbo
6. git push origin main
7. npx vercel --prod --yes
8. ตรวจเว็บจริง
