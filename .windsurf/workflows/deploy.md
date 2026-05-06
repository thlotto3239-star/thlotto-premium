---
description: Deploy User App to production
---

# กฎเหล็ก - TH-LOTTO User App

## โปรเจคนี้คืออะไร
- **ชื่อ**: TH-LOTTO Premium (หน้าผู้ใช้)
- **Vercel Project**: `th-lotto-app`
- **Project ID**: `prj_tJriP88kWcWOSUQOo8E0UrwSJb7v`
- **URL ออนไลน์**: https://th-lotto-app.vercel.app/ (= https://th-lotto.life)
- **GitHub Repo**: `thlotto3239-star/thlotto-premium`
- **Branch deploy**: `main`
- **Branch ทำงาน**: `develop`
- **Local Path**: `c:\Users\armyn\Downloads\thlotto-app-main\thlotto-app-main`

## ขั้นตอน Deploy

1. Commit checkpoint ก่อน AI แก้โค้ด
// turbo
```bash
git add -A && git commit -m "checkpoint: before ai changes"
```

2. AI แก้โค้ด (ทำงานตามคำสั่ง)

3. ทดสอบ build
// turbo
```bash
npx vite build
```

4. Commit งานใหม่
```bash
git add -A && git commit -m "feat: <description>"
```

5. Push (Vercel auto-deploy)
// turbo
```bash
git push origin develop:main
```
> Vercel จะ auto-deploy อัตโนมัติ ไม่ต้องรัน vercel --prod อีก

## ข้อห้าม
- ห้าม deploy ไปโดเมนอื่นนอกจาก https://th-lotto-app.vercel.app/
- ห้ามสร้างโปรเจค Vercel ใหม่
- ห้ามแก้ไขไฟล์ที่ไม่เกี่ยวข้องกับคำสั่ง
- ห้ามแตะโปรเจค Admin Panel (th-lotto-admin)
- ต้องตรวจสอบกับผู้ใช้ก่อนทำการเปลี่ยนแปลงทุกครั้ง
