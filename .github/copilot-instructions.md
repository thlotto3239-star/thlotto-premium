# GitHub Copilot Instructions — TH-LOTTO Premium

🛑 **STOP — Read `README.md` at repo root first before suggesting any code**

## Project Context

- **Project:** TH-LOTTO Premium (Thai lottery betting platform)
- **This Repo:** User App (`thlotto-premium`)
- **Sister Repo (DO NOT TOUCH):** `TH-LOTTO-Admin-push`
- **Stack:** React 19 + Vite + TailwindCSS + Supabase
- **Production:** https://th-lotto-app.vercel.app

## Iron Rules

1. **Before editing code:** ensure git checkpoint tag exists
2. **Before writing code:** summary required for human approval
3. **After editing:** update `CHANGELOG.md` and `PROJECT_STATUS.md`

## Two Separate Betting Systems

- **Main Lottery** (`bets`, `lottery_markets`, `lottery_results`, `place_bet_securely`, `Betting.jsx`) — DO NOT TOUCH unless explicitly requested
- **Instant Lottery / หวย 1 นาที** (`instant_bets`, `instant_draws`, `instant_bet_types`, `fn_*_instant_*`, `InstantLottery.jsx`) — mini-game, isolated

Shared (read/write OK): `wallets`, `transactions`, `profiles`, `notifications`

## Read These Docs

1. `README.md`
2. `AGENT_HANDOFF.md`
3. `DEVELOPMENT_GUIDE.md`
4. `docs/INSTANT_LOTTERY_PLAN.md`
