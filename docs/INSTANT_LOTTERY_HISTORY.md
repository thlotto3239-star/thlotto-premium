# 📜 หวย 1 นาที — Chat Log ฉบับเต็ม (12 พ.ค. 2026)

> **เอกสารนี้คือบันทึกการคุยระหว่าง user กับ AI วันที่ 12 พ.ค. 2026** ที่นำไปสู่การพัฒนาฟีเจอร์ "หวยไทย 1 นาที"
> เก็บไว้เป็นหลักฐาน + reference สำหรับ AI/Agent ที่จะต่อยอดงานในอนาคต

---

## รอบ 1 — วิเคราะห์ฟีเจอร์

### หัวข้อ: เกมหวย 1 นาที → เข้าระบบ TH-LOTTO

**สิ่งที่ user ต้องการ:**
"หวย 1 นาที" = มินิเกมแยกต่างหาก ไม่ใช่ตลาดหวยปกติ (`lottery_markets`) เป็นเกมที่:
- ลูกค้ากดเข้าจาก หน้าแรก (Home) ผ่านรายการ "มาแรง" (`trending_items`)
- เข้าไปหน้าเกมแยก → เลือกประเภท → แทง → รอผล 1 นาที → ออกรางวัลอัตโนมัติ
- ใช้กระเป๋าเงินเดียวกัน (`wallets.balance`) กับระบบหลัก — หักเงินตอนแทง, บวกเงินตอนถูก

**สถานะปัจจุบัน (12 พ.ค.):**

| สิ่งที่มี | รายละเอียด |
|---|---|
| `trending_items` | มีรายการ "หวยไทย 1 นาที" อยู่แล้ว แต่ link ชี้ไป Netlify ภายนอก |
| โค้ด Apps Script | Backend ครบ: สุ่ม, ตรวจผล, จ่ายเงิน, ล้างข้อมูล — แต่ใช้ Google Sheets เป็น DB |
| ระบบปัจจุบัน | ใช้ Supabase (PostgreSQL) + React frontend |
| `lottery_markets` | ❌ ไม่มี market "1 นาที" — และไม่ควรมี เพราะนี่เป็นมินิเกมแยก |

---

## รอบ 2 — แผนพัฒนา 4 ส่วนหลัก

### ส่วน 1: Database (Supabase — ตารางใหม่)

ต้องสร้าง 3 ตารางใหม่:

| ตารางใหม่ | ทำหน้าที่ | เทียบ Apps Script |
|---|---|---|
| `instant_draws` | เก็บงวด + ผลรางวัล 6 หลัก (ทุก 1 นาที) | ชีต "ผลรางวัล" |
| `instant_bets` | เก็บรายการแทง | ชีต "รายการแทง" |
| `instant_bet_types` | ประเภทแทง + อัตราจ่าย | ชีต "ประเภทหวย" |

**ไม่ใช้ตาราง `bets`, `lottery_results` เดิม — แยกกันชัดเจน ไม่กระทบระบบหลัก**

**Mapping จาก Apps Script:**
- Users → ไม่ต้องสร้างใหม่ → ใช้ `profiles` + `wallets` ที่มีอยู่
- BET_DATA → `instant_bets` (user_id ผูก auth.uid(), draw_id ผูก instant_draws)
- DRAW_RESULTS → `instant_draws` (draw_id, result_6d, created_at)
- BET_TYPE → `instant_bet_types` (code, name, rate, min_digits, max_digits)

### ส่วน 2: Backend Logic (Supabase RPC/Cron)

| Apps Script function | → Supabase equivalent | หมายเหตุ |
|---|---|---|
| `autoDrawHandler()` | Cron Job ทุก 1 นาที → RPC `fn_instant_draw()` | สุ่ม 6 หลัก + settle งวดก่อน |
| `generateTrueRandom(6)` | `lpad(floor(random()*1000000)::text, 6, '0')` | PostgreSQL random |
| `processWinningsForDraw()` | RPC `fn_settle_instant_draw()` | ตรวจผล + จ่ายเงินเข้า wallets |
| `checkWin()` | RPC `fn_check_instant_win()` | เทียบเลขตามประเภท |
| `recordBet()` | RPC `fn_place_instant_bet()` | หัก balance + สร้าง bet |
| `clearDailyHistory()` | Cron ทุกวัน 00:00 | ลบ `instant_draws` เก่า |
| `login()` | ❌ ไม่ต้อง | ใช้ auth ปัจจุบัน (auth.uid()) |

**จุดสำคัญ:**
- `fn_place_instant_bet()` ต้อง หัก `wallets.balance` เหมือน `place_bet_securely` ทำอยู่
- `fn_settle_instant_draw()` ต้อง บวก `wallets.balance` + สร้าง `transactions` + `notifications` เหมือน `fn_settle_result` ทำอยู่
- ต้องใช้ `SECURITY DEFINER` + `SELECT FOR UPDATE` ป้องกัน race condition

### ส่วน 3: Frontend (หน้าเกมใหม่)

สร้าง 1 หน้าใหม่ใน User App:

| Component | หน้าที่ |
|---|---|
| `/instant-lottery` | หน้าเกมหลัก — countdown 60 วินาที, เลือกประเภท, ใส่เลข, แทง, ดูผล |

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

**แก้ `trending_items`:** เปลี่ยน link จาก Netlify → `/instant-lottery`

### ส่วน 4: สิ่งที่ไม่ต้องแก้ (ระบบเดิม)

| ระบบเดิม | สถานะ |
|---|---|
| `lottery_markets`, `bets`, `lottery_results` | ❌ ไม่แตะ |
| `place_bet_securely`, `fn_settle_result` | ❌ ไม่แตะ |
| `Betting.jsx`, `LotteryList.jsx` | ❌ ไม่แตะ |
| `profiles`, `wallets`, `transactions`, `notifications` | ✅ ใช้ร่วม (อ่าน/เขียน) |

---

## รอบ 3 — Mapping ประเภทแทง

| Apps Script code | ชื่อ | อัตราจ่าย | ตรวจจากเลข 6 หลัก |
|---|---|---|---|
| `2top` | 2 ตัวบน | ×90 | หลักที่ 5-6 |
| `2bottom` | 2 ตัวล่าง | ×90 | หลักที่ 5-6 |
| `3top` | 3 ตัวบน | ×900 | หลักที่ 4-6 |
| `3toad` | 3 ตัวโต๊ด | ×150 | หลักที่ 4-6 (เรียงลำดับ) |
| `3front` | 3 ตัวหน้า | ×450 | หลักที่ 1-3 |
| `3back` | 3 ตัวท้าย | ×450 | หลักที่ 4-6 |
| `6straight` | 6 ตัวตรง | ×100,000 | ตรงทั้ง 6 หลัก |
| `pin_top` | ปักหลักบน | ×3.2 | เลือกตัวเลขแต่ละหลัก |
| `pin_bottom` | ปักหลักล่าง | ×4.2 | เลือกตัวเลขแต่ละหลัก |

---

## รอบ 4 — Frontend HTML → React

**สิ่งที่ตัดออก (ไม่ต้องแปลง):**

| สิ่งที่ตัด | เหตุผล |
|---|---|
| `#loginScreen` ทั้งหมด | ใช้ AuthContext ที่มีอยู่ — user login แล้วก่อนเข้าหน้านี้ |
| `handleLogin()` / `loginSuccess()` | เหมือนกัน |
| `logout()` | ปุ่มกลับหน้าหลัก → ใช้ `navigate('/home')` แทน |
| `google.script.run` / `callApi()` | เปลี่ยนเป็น Supabase RPC |
| `currentUser.userId` | เปลี่ยนเป็น `auth.uid()` (backend ดึงเอง) |

**สิ่งที่เก็บไว้ 100% (แปลงเป็น React):**

| ส่วนเดิม | → React | หมายเหตุ |
|---|---|---|
| Header | ส่วนบนของ component | ดึง `user.full_name` จาก AuthContext, balance จาก wallets |
| Status Bar | useState + useEffect timer | drawId, countdown, balance — logic เหมือนเดิม 100% |
| Result Table | JSX + state result6D | ดึงจาก Supabase RPC แทน |
| Bet Tabs | bettingConfig array + selectedType state | 9 ประเภทเหมือนเดิม |
| Numpad | Component ย่อย | numPress() logic เหมือนเดิม |
| Pin Selector | Component ย่อย | togglePin() / confirmPin() logic เหมือนเดิม |
| Money Modal | State-controlled overlay | pendingBet state + submitBet() เรียก RPC |
| Result Popup | State-controlled overlay | fetchAndShowPopup() → Supabase RPC |
| History Modal | State-controlled overlay | getAllUserBets() → Supabase RPC |
| Toast | State-controlled toast | showToast() |
| Theme (สีเขียวเข้ม/ทอง) | Tailwind classes | คงไว้เหมือนเดิมทุก pixel |

**Mapping: ฟังก์ชัน JS เดิม → React + Supabase**

| ฟังก์ชัน HTML/JS เดิม | → React/Supabase equivalent |
|---|---|
| `initGame()` | useEffect on mount → start timer + load result |
| `startTimer()` | useEffect + setInterval 1 วินาที |
| `loadDrawResult(drawId)` | `supabase.rpc('fn_get_instant_result', {p_draw_id})` |
| `submitBet()` | `supabase.rpc('fn_place_instant_bet', {p_draw_id, p_type, p_number, p_amount})` |
| `fetchAndShowPopup(drawId)` | `supabase.rpc('fn_get_instant_popup', {p_draw_id})` |
| `openHistory()` / `getAllUserBets()` | `supabase.rpc('fn_get_instant_bets')` |
| `updateUI() (balance)` | AuthContext realtime subscription (มีอยู่แล้ว) |
| `navigateDraw()` | `setViewingDrawId(prev => prev + step)` |
| `renderTabs()` | JSX map จาก bettingConfig |
| `numPress() / togglePin()` | React state handlers |
| `formatMoney()` | utility function |

**Pin Betting (ปักหลัก) — ซับซ้อนที่สุด:**
- `pin_top`: เลือกได้ 3 หลัก (ร้อย, สิบ, หน่วย) ≤ 7 ตัวรวม
- `pin_bottom`: เลือกได้ 2 หลัก (สิบ, หน่วย) ≤ 7 ตัวรวม
- เก็บเป็น JSON: `{"hundreds":[1,5], "tens":[3,7], "units":[0]}`
- ค่าเดิมพัน = เงินต่อตัว × จำนวนตัวที่เลือก

**Timer System:**
- `drawId = Math.floor(Date.now() / 60000)` ← เลขงวด = นาทีนับจาก epoch
- `countdown = 60 - วินาทีปัจจุบัน`
- เมื่อ countdown ≤ 5 วินาที → ปิดการแทง (grey out)
- เมื่อหมดเวลา (นาทีใหม่) → โหลดผล + แสดง popup ผลรางวัล

---

## รอบ 5 — Cron ลบข้อมูลเก่า

**ตัวเลือก:**
- A) เพิ่มเข้า `fn_cleanup_old_data()` ที่มีอยู่ → ลบตอน 04:00 น.
- B) สร้าง cron แยกตอน 00:00 น. (เที่ยงคืน) เหมือน Apps Script เดิม

**user เลือก: B (สร้าง cron แยกตอน 00:00 น.)**

ลบ:
- `instant_draws` ทั้งหมดของวันก่อนหน้า (ผลรางวัล)
- `instant_bets` ที่ status เป็น WON หรือ LOST แล้ว (settle แล้ว)
- เก็บ `instant_bets` ที่ยัง PENDING ไว้ (กรณี edge case)

---

## รอบ 6 — ทางเข้าเกม (User Screenshot)

User ส่งภาพหน้า Home ส่วน "มาแรง" ที่มีกล่อง "หวยไทย 1 นาที" + ปุ่ม "เล่นเลย"

ตอนนั้นกดแล้วไป Netlify ภายนอก → แผนคือแก้ link ใน `trending_items` ให้ชี้ `/instant-lottery`

---

## รอบ 7 — เริ่ม Step 1 (User กดอนุมัติ)

ลำดับการทำงาน 8 Steps:
1. สร้างตาราง `instant_bet_types`, `instant_draws`, `instant_bets` + RLS + Seed data
2. สร้าง RPC: `fn_place_instant_bet`, `fn_get_instant_result`, `fn_get_instant_popup`, `fn_get_instant_bets`
3. สร้าง RPC: `fn_instant_draw` (สุ่มผล) + `fn_settle_instant_draw` (ตรวจ+จ่าย) + `fn_check_instant_win`
4. สร้าง Cron ออกผลทุก 1 นาที
5. สร้าง Cron ลบข้อมูลเก่าทุก 00:00 น.
6. สร้าง `InstantLottery.jsx` (แปลง HTML → React)
7. เพิ่ม route `/instant-lottery` ใน `App.jsx`
8. แก้ `trending_items` link ชี้ `/instant-lottery`
9. ทดสอบ + Deploy

**→ AI วันที่ 12 ทำ Step 1-8 จากรายการนี้ (ก่อนรอบ rebuild วันที่ 13)**

---

## 📌 Outcome (สถานะหลังจบ chat 12 พ.ค.)

- ✅ Database: 3 ตาราง + 9 bet types
- ✅ Backend: 7 RPC + 2 cron jobs
- ✅ Frontend: `InstantLottery.jsx` 567 บรรทัด (commit `7012d99`)
- ✅ Route: `/instant-lottery` ใน `App.jsx`
- ✅ trending_items.link → `/instant-lottery`
- ⚠️ trending_items.image_url ยังเป็น URL pic.in.th (รูปแตก — เจอวันที่ 13)
- ⚠️ Logic บั๊ก: 3top/3toad/pin_* ตำแหน่งผิด (แก้วันที่ 13)

---

> เอกสารนี้บันทึกโดย AI Agent (Cascade) วันที่ 13 พ.ค. 2026 หลังจาก user ส่ง chat log มาเพื่อแก้ปัญหา "AI งงทุกครั้งที่เปลี่ยนเซสชัน"
