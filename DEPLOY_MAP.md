# TH-LOTTO System - Deployment Map

> ⚠️ กฎเหล็ก: ระบบนี้มีแค่ 2 โดเมนเท่านั้นที่ใช้งานจริง ห้าม deploy ไปที่อื่น

## โดเมนที่ใช้งานจริง

| ระบบ | URL | Vercel Project | GitHub Repo | Branch |
|------|-----|---------------|-------------|--------|
| **ผู้ใช้** | https://th-lotto-app.vercel.app/ | `th-lotto-app` | `thlotto3239-star/thlotto-premium` | `main` |
| **แอดมิน** | https://th-lotto-admin.vercel.app/ | `th-lotto-admin` | `thlotto3239-star/TH-LOTTO-Admin-push` | `master` |

## Custom Domain
- https://th-lotto.life → ชี้ไปที่ `th-lotto-app` (อันเดียวกับ th-lotto-app.vercel.app)

## Vercel Account
- **Account**: `thlotto3239-1721`
- **Team/Org ID**: `team_babk9xu2M3DdrIMngeAMj154`

## Database
- **Supabase** (shared ระหว่าง 2 โปรเจค)

## Deploy Flow
```
โค้ดใน IDE → git commit → git push → npx vercel --prod --yes
```

> หมายเหตุ: GitHub ไม่ได้เชื่อม auto-deploy กับ Vercel  
> ต้องรัน `npx vercel --prod --yes` ทุกครั้งเพื่อ deploy จริง
