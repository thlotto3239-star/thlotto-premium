# 🛑 TH-LOTTO Premium — STOP AND READ FIRST

> **AI/Agent ทุกตัว: หยุดก่อน อ่านไฟล์นี้ให้จบก่อนทำอะไร**

## 🎯 โปรเจกต์นี้คืออะไร

- **TH-LOTTO Premium** — User App (Frontend ผู้ใช้)
- **Production:** https://th-lotto-app.vercel.app
- **Stack:** React 19 + Vite + TailwindCSS + Supabase + Vercel
- **Repo (User App, this):** https://github.com/thlotto3239-star/thlotto-premium  ← branch `main`
- **Repo (Admin Panel, **DO NOT TOUCH**):** https://github.com/thlotto3239-star/TH-LOTTO-Admin-push  ← branch `master`
- **Admin Live:** https://th-lotto-admin.vercel.app

## 🚨 กฎเหล็ก 5 ข้อ (NO EXCEPTIONS)

### 1. ก่อนแก้โค้ดใดๆ → สร้าง git tag checkpoint + push GitHub
```powershell
$ts = Get-Date -Format "yyyyMMdd-HHmm"
git tag "pre-work-$ts" -m "checkpoint before [งาน]"
git push origin "pre-work-$ts"
```

### 2. ก่อนเขียนโค้ด → summarize + ขอ approval
- บอก user ก่อนว่าจะแก้ไฟล์อะไร แก้ตรงไหน เพราะอะไร
- รอให้ user ตอบ "go" หรือ "ok" ก่อนเริ่ม
- **ยกเว้น:** อ่านไฟล์, git log, SQL SELECT, สร้าง checkpoint, แก้ docs หลังงานเสร็จ

### 3. ทำงานบน branch แยก ห้าม push ตรง main
```powershell
git checkout -b feature/xxx-description
# ... แก้โค้ด ...
git push origin feature/xxx-description
# merge ผ่าน PR เท่านั้น
```

### 4. หลังแก้โค้ด → update เอกสาร + push + deploy + verify
- Update `CHANGELOG.md` (เพิ่ม version ใหม่ขึ้นบนสุด)
- Update `PROJECT_STATUS.md` (เปลี่ยนเลขเวอร์ชัน + อัพเดทตาราง bug)
- Commit + push + Vercel deploy + เปิด live URL ตรวจ

### 5. แยกระบบ — ห้ามมั่ว
| ระบบ | ตาราง | RPC | หน้า | สถานะ |
|---|---|---|---|---|
| **หวยทั่วไป (หลัก)** | `bets`, `lottery_results`, `lottery_markets` | `place_bet_securely`, `fn_settle_result` | `Betting.jsx`, `LotteryList.jsx` | ⛔ ห้ามแตะ ถ้าไม่ได้สั่ง |
| **หวย 1 นาที (มินิเกม)** | `instant_bets`, `instant_draws`, `instant_bet_types` | `fn_*_instant_*` | `InstantLottery.jsx` | ✅ แก้ได้ |
| **กลาง (ใช้ร่วม)** | `wallets`, `transactions`, `profiles`, `notifications` | — | — | ⚠️ อ่าน/เขียนต้องระวัง |

---

## 📋 5-Line System Prompt (paste ทุกเซสชันใหม่)

```
You are joining mid-project TH-LOTTO Premium User App.
Step 1: Read README.md at repo root NOW.
Step 2: Run `git log --oneline -5` and `git tag -l "stable-*" | tail -1`
Step 3: Read AGENT_HANDOFF.md, PROJECT_STATUS.md, CHANGELOG.md
Step 4: Summarize what you understand in 5 bullet points.
Step 5: Wait for my approval before ANY code edit.
```

---

## 📚 ลำดับการอ่านเอกสาร (ตามนี้เท่านั้น)

| # | ไฟล์ | อ่านเพื่อ |
|---|---|---|
| 1 | `README.md` (this) | ทางเข้า + กฎเหล็ก |
| 2 | `AGENT_HANDOFF.md` | quick start สำหรับ AI ใหม่ |
| 3 | `PROJECT_STATUS.md` | สถานะปัจจุบัน + bug list |
| 4 | `CHANGELOG.md` | ประวัติเวอร์ชัน |
| 5 | `DEVELOPMENT_GUIDE.md` | workflow + best practices |
| 6 | `docs/INSTANT_LOTTERY_PLAN.md` | แผนหวย 1 นาที (ถ้าทำงานฟีเจอร์นี้) |
| 7 | `docs/INSTANT_LOTTERY_HISTORY.md` | chat log วันที่สร้างฟีเจอร์ |

---

## 🛠️ Setup สำหรับ Dev / AI

```bash
# 1. Install deps
npm install

# 2. Enable git hooks (auto-checkpoint)
git config core.hooksPath .githooks

# 3. Run dev server
npm run dev
```

## 📁 Project Structure

```
src/
├── pages/             # 33 user-facing pages
├── components/        # Shared components
├── hooks/             # Custom React hooks
├── AuthContext.jsx    # Auth state
├── supabaseClient.js  # Supabase client
└── App.jsx            # Routes (33 routes)

docs/
├── INSTANT_LOTTERY_PLAN.md     # 🆕 แผนหวย 1 นาที
├── INSTANT_LOTTERY_HISTORY.md  # 🆕 chat log
├── USER_APP_BLUEPRINT.md
├── SYSTEM_DOCUMENTATION.md
└── database/                    # SQL migration files

.github/copilot-instructions.md  # Copilot rules → ชี้กลับ README
.cursorrules                     # Cursor rules → ชี้กลับ README
CLAUDE.md                        # Claude Code rules → ชี้กลับ README
.windsurfrules                   # Windsurf rules
.githooks/pre-commit             # Auto-checkpoint hook
```

---

## 🔑 Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## 🚀 Deploy

```bash
# Production
vercel --prod --yes

# Preview
vercel --yes
```

---

## ⛔ FORBIDDEN (ห้ามทำเด็ดขาด)

- แก้โค้ดโดยไม่สร้าง checkpoint tag ก่อน
- push ไป `main` ตรงๆ (ใช้ branch + PR)
- แก้ระบบหลัก (`bets`, `lottery_markets`, `Betting.jsx`) ถ้า user ไม่สั่ง
- เปลี่ยนระบบ auth (SHA256 password)
- สร้าง Vercel project ใหม่
- ลบ DB schema โดยไม่ตรวจ references
- ข้ามการอัพเดท CHANGELOG + PROJECT_STATUS
- เขียน function ใหม่โดยไม่รักษา field names เดิม

---

**ยังไม่เข้าใจ? กลับไปอ่านข้อ "กฎเหล็ก 5 ข้อ" ใหม่ — ทุกข้อสำคัญ**
