# 📜 หวยไทย 1 นาที (Instant Lottery) — แผนพัฒนาฉบับสมบูรณ์

> **เอกสารนี้บันทึกจากการคุยกับ AI วันที่ 12 พ.ค. 2026**
> ทุก AI/Agent ที่จะทำงานต่อในฟีเจอร์นี้ — **ต้องอ่านไฟล์นี้ก่อน**

---

## 🎯 สิ่งที่ตกลงกัน

**"หวยไทย 1 นาที" = มินิเกมแยกต่างหาก ไม่ใช่ตลาดหวยปกติ**

ลูกค้ากดเข้าจาก หน้า Home → "มาแรง" (`trending_items`) → `/instant-lottery`
- เลือกประเภท → ใส่เลข → แทง → รอผล 1 นาที → ออกรางวัลอัตโนมัติ
- ใช้กระเป๋าเงินเดียวกัน (`wallets.balance`) กับระบบหลัก
- หักเงินตอนแทง / บวกเงินตอนถูก

---

## 🏗️ โครงสร้าง 4 ส่วน

### ส่วนที่ 1 — Database (3 ตารางใหม่)

| ตาราง | หน้าที่ | เทียบ Apps Script |
|---|---|---|
| `instant_draws` | งวด + ผลรางวัล 6 หลัก (ทุก 1 นาที) | ชีต "ผลรางวัล" |
| `instant_bets` | รายการแทง | ชีต "รายการแทง" |
| `instant_bet_types` | ประเภทแทง + อัตราจ่าย | ชีต "ประเภทหวย" |

**❌ ไม่ใช้ตาราง `bets`, `lottery_results`, `lottery_markets` เดิม — แยกขาด**

### ส่วนที่ 2 — Backend Logic (Supabase RPC + pg_cron)

| Function | หน้าที่ | เทียบ Apps Script |
|---|---|---|
| `fn_instant_draw()` | สุ่มผล 6 หลัก + settle งวดก่อน | `autoDrawHandler()` |
| `fn_settle_instant_draw()` | ตรวจผล + จ่ายเงินเข้า wallets | `processWinningsForDraw()` |
| `fn_check_instant_win()` | เทียบเลขตามประเภท | `checkWin()` |
| `fn_place_instant_bet()` | หัก balance + สร้าง bet | `recordBet()` |
| `fn_get_instant_result()` | ดึงผลงวด | — |
| `fn_get_instant_popup()` | ดึงผล + สถานะถูก/ไม่ถูก | — |
| `fn_get_instant_bets()` | ดึงประวัติ 50 รายการล่าสุด | — |

**Cron Jobs:**
- ทุก 1 นาที → `fn_instant_draw()` (สุ่ม + settle อัตโนมัติ)
- ทุกวัน 00:00 น. → ลบ `instant_draws` + `instant_bets` ที่ settle แล้ว ของวันก่อนหน้า

**ข้อกำหนดเทคนิค:**
- ใช้ `SECURITY DEFINER` ป้องกัน race condition
- ใช้ `SELECT FOR UPDATE` ตอนหัก/บวก wallet
- `lpad(floor(random()*1000000)::text, 6, '0')` สำหรับสุ่ม

### ส่วนที่ 3 — Frontend (1 หน้าใหม่)

**Component:** `src/pages/InstantLottery.jsx` — Route: `/instant-lottery`

**Flow:**
```
Home → กด "หวยไทย 1 นาที" (trending)
  → /instant-lottery
    → เห็น countdown ถึงงวดถัดไป
    → เลือกประเภท (2ตัวบน, 3ตัวบน, etc.)
    → ใส่เลข + จำนวนเงิน
    → กด "แทง" → หัก balance ทันที
    → หมดเวลา → ผลออก → popup ถูก/ไม่ถูก
    → balance อัพเดท realtime
```

**ไม่ต้อง login ซ้ำ** — ใช้ `AuthContext` ที่มีอยู่ (auth.uid() ฝั่ง backend)

### ส่วนที่ 4 — สิ่งที่ห้ามแตะ (ระบบหลัก)

| ระบบเดิม | สถานะ |
|---|---|
| `lottery_markets`, `bets`, `lottery_results` | ❌ ไม่แตะ |
| `place_bet_securely`, `fn_settle_result` | ❌ ไม่แตะ |
| `Betting.jsx`, `LotteryList.jsx` | ❌ ไม่แตะ |
| `profiles`, `wallets`, `transactions`, `notifications` | ✅ ใช้ร่วม (อ่าน/เขียนได้) |

---

## 🎲 9 ประเภทแทง + อัตราจ่าย

| Code | ชื่อ | อัตรา | ตำแหน่งเลข 6 หลัก |
|---|---|---|---|
| `2top` | 2 ตัวบน | ×90 | หลัก 5-6 |
| `2bottom` | 2 ตัวล่าง | ×90 | หลัก 5-6 |
| `3top` | 3 ตัวบน | ×900 | **หลัก 4-6** |
| `3toad` | 3 ตัวโต๊ด | ×150 | **หลัก 4-6 (เรียงลำดับ)** |
| `3front` | 3 ตัวหน้า | ×450 | หลัก 1-3 |
| `3back` | 3 ตัวท้าย | ×450 | หลัก 4-6 |
| `6straight` | 6 ตัวตรง | ×100,000 | ตรงทั้ง 6 หลัก |
| `pin_top` | ปักหลักบน | ×3.2 | เลือกตัวเลขแต่ละหลัก (3 หลักท้าย) |
| `pin_bottom` | ปักหลักล่าง | ×4.2 | เลือกตัวเลขแต่ละหลัก (2 หลักท้าย) |

**Pin Betting JSON Format:**
```json
{"hundreds":[1,5], "tens":[3,7], "units":[0]}
```

**Pin Logic:**
- ตรวจถูกแบบ **OR per-position** (ไม่ใช่ AND-all)
- จ่ายเงิน = `amount × rate × จำนวนตำแหน่งที่ถูก`
- หักเงินตอนแทง = `amount × จำนวนเลขที่เลือกรวมทุกหลัก`
- `pin_top`: เลือกได้ 3 หลัก (ร้อย/สิบ/หน่วย) ≤ 7 ตัวรวม
- `pin_bottom`: เลือกได้ 2 หลัก (สิบ/หน่วย) ≤ 7 ตัวรวม

---

## 📋 ลำดับการพัฒนา 9 Steps

| # | งาน | สถานะ |
|---|---|---|
| 1 | สร้างตาราง `instant_*` + RLS + seed bet types | ✅ เสร็จ |
| 2 | สร้าง RPC วางเดิมพัน/ดึงผล/ดึงประวัติ/popup | ✅ เสร็จ |
| 3 | สร้าง RPC สุ่มผล/settle/check_win | ✅ เสร็จ (แก้บั๊ก 2026-05-13) |
| 4 | สร้าง Cron ทุก 1 นาที | ✅ เสร็จ (jobid 14) |
| 5 | สร้าง Cron ลบเก่า 00:00 น. | ✅ เสร็จ (jobid 15) |
| 6 | สร้าง `InstantLottery.jsx` | ✅ เสร็จ (rewrite 2026-05-13) |
| 7 | เพิ่ม route `/instant-lottery` | ✅ เสร็จ |
| 8 | แก้ `trending_items` link → `/instant-lottery` | ✅ เสร็จ (link)<br>⏳ image_url ต้องแก้ |
| 9 | ทดสอบ + Deploy | ⏳ รอ merge งานล่าสุด |

---

## 🐛 บั๊กที่พบและแก้ไขแล้ว (2026-05-13)

Migration: `20260513032530_fix_instant_lottery_win_logic`

1. **3top:** เคยเทียบหลัก 1-3 → แก้เป็นหลัก 4-6
2. **3toad:** เคยเทียบหลัก 1-3 sorted → แก้เป็นหลัก 4-6 sorted
3. **pin_top:** เคยใช้ 3 หลักหน้า → แก้เป็น 3 หลักท้าย (`hundreds`, `tens`, `units` mapped to position 4, 5, 6)
4. **pin logic:** เคยใช้ AND-all → แก้เป็น OR per-position
5. **pin payout:** เคยจ่าย amount เต็ม → แก้เป็น amount × rate × ตำแหน่งที่ถูก
6. **`fn_place_instant_bet`:** เคยคูณ amount × pin combinations → แก้เป็น amount × จำนวนเลข

---

## 🎨 UI Theme (ตาม HTML reference เดิม)

- พื้นหลัก: เขียวเข้มมาก `#050f08`
- Header: `#021a0b`
- Status bar: ดำ
- Logo bg: `#004d25` border `#006828` ← *เปลี่ยนเป็นธงไทย (2026-05-13)*
- Active tab: ตัวอักษรทอง `text-yellow-400`
- Result red: `#d32f2f` / blue: `#1976d2`

**Brand Palette ที่ควรใช้** (แทน hex สุ่ม):
- Primary: `#1a7e2a` (เขียว TH-LOTTO)
- Emerald deep: `#064e3b`
- Emerald dark: `#0d4a0a`
- Border emerald: `#137c10`
- Gold premium: `#D4AF37`
- Accent red: `#dc2626`

---

## 📌 หมายเหตุสำหรับ AI ที่ต่อยอด

1. ถ้าจะแก้ logic ตรวจถูก → แก้ที่ `fn_check_instant_win` ใน Supabase **ห้าม** แก้ logic ฝั่ง frontend
2. ถ้าจะเพิ่มประเภทแทงใหม่ → INSERT ใน `instant_bet_types` + เพิ่ม case ใน `fn_check_instant_win` + เพิ่ม BET_TABS ใน `InstantLottery.jsx`
3. ถ้าจะเปลี่ยนรอบเวลา (ไม่ใช่ 1 นาที) → ต้องแก้ทั้ง pg_cron + frontend timer logic + drawId formula
4. **ห้าม merge ระบบนี้กับระบบหลัก** — เก็บแยกตามที่ออกแบบไว้
