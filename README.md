# TH-LOTTO Premium

ระบบแทงหวยออนไลน์ครบวงจร — User App

**Production:** https://th-lotto.life

---

## Tech Stack

- **Frontend:** React 19, Vite 8, TailwindCSS v4
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Hosting:** Vercel

---

## Getting Started

```bash
# 1. Clone repo
git clone <repo-url>
cd th-lotto-app

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# แก้ไข .env ใส่ค่า Supabase

# 4. Run development server
npm run dev
```

---

## Project Structure

```
src/
├── pages/           # User-facing pages (28 routes)
├── admin/           # Admin panel (separate deployment)
├── components/      # Shared components
├── hooks/           # Custom React hooks
├── AuthContext.jsx  # Auth state management
├── App.jsx          # Routes
└── supabaseClient.js

docs/
├── USER_APP_BLUEPRINT.md     # User app documentation
├── SYSTEM_DOCUMENTATION.md  # System overview
└── database/                 # SQL migration files
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Deploy

```bash
vercel deploy --prod
```
