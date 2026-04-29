-- ==========================================
-- TH-LOTTO PREMIUM: MASTER BLUEPRINT v3.0 (FINAL)
-- ✅ Full UI-to-DB 1:1 synchronization
-- ✅ All missing tables added
-- ✅ Auto-trigger functions complete
-- ✅ Column names aligned with api.js
-- ==========================================

-- 1. ล้าง Schema เก่าทิ้ง
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- ==========================================
-- 2. ตารางสมาชิก (Profiles)
--    ใช้ใน: Register, Profile, Affiliate, Withdraw, Betting
-- ==========================================
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    phone_number TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT DEFAULT 'https://img2.pic.in.th/pic/TH-LOTTO.md.png',
    member_id TEXT UNIQUE,             -- เช่น LOTTO-A1B2, แสดงบน Profile & Affiliate
    referrer_id UUID REFERENCES public.profiles(id),  -- api.js ใช้ชื่อนี้ตรงๆ
    bank_name TEXT,
    bank_account_number TEXT,          -- api.js เรียก profile.bank_account_number
    vip_level TEXT DEFAULT 'BRONZE',   -- BRONZE, SILVER, GOLD, PLATINUM
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ระบบกระเป๋าเงิน (Wallets)
--    ใช้ใน: Wallet, Withdraw, Deposit, Home
-- ==========================================
CREATE TABLE public.wallets (
    user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
    balance DECIMAL(15, 2) DEFAULT 0.00,
    commission_balance DECIMAL(15, 2) DEFAULT 0.00,  -- Affiliate earnings
    total_deposit DECIMAL(15, 2) DEFAULT 0.00,
    total_withdraw DECIMAL(15, 2) DEFAULT 0.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. ระบบตลาดหวย (Lottery Markets)
--    ใช้ใน: LotteryList, Betting, BetHistory, Results
--    ต้องมี: name, type, is_active, closing_time, display_order, last_result, image_url
-- ==========================================
CREATE TABLE public.lottery_markets (
    id TEXT PRIMARY KEY,               -- เช่น 'th_govt', 'hanoi_normal', 'lao_dev'
    name TEXT NOT NULL,
    logo_url TEXT,
    image_url TEXT,                    -- ใช้แสดงรูปในหน้ารายการหวย
    type TEXT,                         -- 'thai', 'hanoi', 'lao', 'stock', 'fast'
    market_type TEXT,                  -- THAI, HANOI, LAO, STOCK (ใช้กับ filter)
    is_active BOOLEAN DEFAULT TRUE,
    is_open BOOLEAN DEFAULT TRUE,      -- api.js ส่งค่า is_open กลับไปตรงๆ
    closing_time TEXT,                 -- เช่น "15:20" แสดงหน้า LotteryList
    last_result TEXT,                  -- ผลล่าสุด เช่น '803481' หรือ '81 29'
    display_order INTEGER DEFAULT 0
);

-- ==========================================
-- 5. งวดหวย (Lottery Rounds/Schedules)
--    ใช้ใน: Betting (เชื่อมกับ draw_date), Results
-- ==========================================
CREATE TABLE public.lottery_rounds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    market_id TEXT REFERENCES public.lottery_markets(id),
    draw_date DATE NOT NULL,
    open_time TIMESTAMPTZ,
    close_time TIMESTAMPTZ,
    status TEXT DEFAULT 'OPEN',        -- OPEN, CLOSED, FINISHED
    announcement_text TEXT,            -- "งวดประจำวันที่ 1 มีนาคม 2567"
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. ผลหวย (Lottery Results)
--    ใช้ใน: Results, Home (getLatestResults), BetHistory
-- ==========================================
CREATE TABLE public.lottery_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    round_id UUID REFERENCES public.lottery_rounds(id) UNIQUE,
    lottery_code TEXT REFERENCES public.lottery_markets(id),  -- api.js join ผ่าน lottery_code
    draw_date DATE,
    result_p1 TEXT,                    -- รางวัลที่ 1 (6 หลัก)
    result_top3 TEXT,                  -- 3 ตัวหน้า
    result_bottom2 TEXT,               -- 2 ตัวล่าง
    result_3front TEXT,                -- 3 ตัวหน้า
    result_3bottom TEXT,               -- 3 ตัวท้าย
    digit_6 TEXT,                      -- ผลรางวัลที่ 1 แบบ 6 หลักแยกต่อกัน (แสดงบน Results)
    front_3_a TEXT,
    front_3_b TEXT,
    back_3_a TEXT,
    back_3_b TEXT,
    bottom_2 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lottery_code, draw_date)      -- 🔒 ป้องกันผลซ้ำงวดเดียวกัน และรองรับการ Upsert จากระบบ Sync
);

-- Relation ใช้ join กับ lottery_markets ใน Home -> getLatestResults
-- api.js: .select('*, lottery_types(full_name, image_url)')  
-- → เปลี่ยน join ชื่อ alias ให้ตรงด้วย VIEW ด้านล่าง

-- ==========================================
-- 7. การแทงหวย (Bets)
--    ใช้ใน: Betting (placeBet), BetHistory (getBetTickets)
-- ==========================================
CREATE TABLE public.bets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    lottery_code TEXT REFERENCES public.lottery_markets(id),
    draw_date DATE NOT NULL,
    bet_type TEXT,                     -- '3_top', '2_bottom', 'run_top', etc.
    numbers TEXT,                      -- ตัวเลขที่แทง เช่น '481'
    amount DECIMAL(15, 2),
    payout_rate DECIMAL(15, 2),
    status TEXT DEFAULT 'PENDING',     -- PENDING, WON, LOST, CANCEL
    payout_amount DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. ธุรกรรมทางการเงิน (Transactions)
--    ใช้ใน: Wallet (getTransactionHistory), Deposit, Withdraw
-- ==========================================
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    type TEXT,                         -- 'deposit', 'withdraw', 'bet', 'win', 'commission'
    amount DECIMAL(15, 2),
    status TEXT DEFAULT 'PENDING',     -- PENDING, SUCCESS, FAILED
    ref_id TEXT,                       -- DEP-168xxx, WTH-168xxx
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. ประกาศ / Marquee (Announcements)
--    ใช้ใน: Home (getAnnouncements) → api.js เรียกตาราง 'settings'
--    FIX: สร้างทั้ง settings และ announcements
-- ==========================================
CREATE TABLE public.announcements (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ตาราง settings: api.js getAnnouncements เรียก key='announcement_marquee' 
CREATE TABLE public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- seed ค่าเริ่มต้น
INSERT INTO public.settings (key, value) VALUES
    ('announcement_marquee', 'ยินดีต้อนรับสู่ TH-LOTTO ระบบฝาก-ถอนอัตโนมัติ 24ชม.'),
    ('min_deposit', '100'),
    ('min_withdraw', '100'),
    ('commission_rate', '0.006');

-- ==========================================
-- 10. hero sliders / promo banners (Hero Sliders)
--    ใช้ใน: Home (getSliders) → api.js เรียกตาราง 'sliders'
-- ==========================================
CREATE TABLE public.sliders (
    id SERIAL PRIMARY KEY,
    type TEXT DEFAULT 'hero',          -- 'hero' หรือ 'promo'
    title TEXT,
    description TEXT,                  -- api.js ส่ง description กลับ
    sub_title TEXT,                    -- สำหรับ promo card
    badge_text TEXT,
    image_url TEXT NOT NULL,
    button_text TEXT,
    background_color TEXT,             -- สำหรับ promo gradient
    link TEXT,                         -- 'deposit', 'affiliate', etc.
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. ธนาคาร (Banks)
--    ใช้ใน: Deposit (getSupportedBanks)
-- ==========================================
CREATE TABLE public.banks (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,                -- 'KASIKORNBANK', 'SCB', etc.
    short_name TEXT,                   -- 'KBank'
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- seed ธนาคารหลัก
INSERT INTO public.banks (name, short_name, is_active) VALUES
    ('ธนาคารกสิกรไทย', 'KBank', TRUE),
    ('ธนาคารไทยพาณิชย์', 'SCB', TRUE),
    ('ธนาคารกรุงไทย', 'KTB', TRUE),
    ('ธนาคารกรุงเทพ', 'BBL', TRUE),
    ('ธนาคารกรุงศรีอยุธยา', 'BAY', TRUE),
    ('ธนาคารทหารไทยธนชาต', 'TTB', TRUE);

-- ==========================================
-- 12. โปรโมชั่น (Promotions)
--    ใช้ใน: Home (getSliders type='promo')
-- ==========================================
CREATE TABLE public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT,
    image_url TEXT,
    min_deposit DECIMAL(15, 2),
    bonus_amount DECIMAL(15, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 13. บทความ (Articles)  
--    ใช้ใน: api.getArticles() (เผื่อหน้าข่าวสาร)
-- ==========================================
CREATE TABLE public.articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT,
    content TEXT,
    image_url TEXT,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 14. เมนูปุ่มเปย์เอาต์พิเศษ (Special Payout Marquee)
--    ใช้ใน: Home (อัตราจ่ายสูงพิเศษ)
-- ==========================================
CREATE TABLE public.special_payout_marquee (
    id SERIAL PRIMARY KEY,
    name TEXT,
    rate TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0
);

-- ==========================================
-- 15. VIEW เพื่อ compatibility กับ api.js
--    api.getLatestResults joins lottery_types(full_name, image_url)
-- ==========================================
CREATE VIEW public.lottery_types AS
    SELECT 
        id,
        name AS full_name,
        image_url,
        type,
        market_type
    FROM public.lottery_markets;

-- ==========================================
-- 16. ฟังก์ชันอัตโนมัติ (Automation Functions)
-- ==========================================

-- F1: สร้าง member_id สุ่ม 6 หลักเมื่อสมัครสมาชิก
CREATE OR REPLACE FUNCTION public.generate_member_id()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := 'LOTTO-';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- F2: Auto-create profile + wallet + member_id เมื่อ user ใหม่สมัคร
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_member_id TEXT;
    referrer_profile_id UUID;
BEGIN
    -- Generate unique member_id
    LOOP
        new_member_id := public.generate_member_id();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE member_id = new_member_id);
    END LOOP;
    
    -- Find referrer if ref code was passed
    IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL THEN
        SELECT id INTO referrer_profile_id 
        FROM public.profiles 
        WHERE member_id = NEW.raw_user_meta_data->>'referral_code';
    END IF;
    
    -- Create profile
    INSERT INTO public.profiles (
        id, 
        phone_number, 
        full_name, 
        member_id,
        referrer_id,
        bank_name,
        bank_account_number
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'full_name',
        new_member_id,
        referrer_profile_id,
        NEW.raw_user_meta_data->>'bank_name',
        NEW.raw_user_meta_data->>'account_number'
    );
    
    -- Create wallet
    INSERT INTO public.wallets (user_id) VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- F3: คำนวณคอมมิชชั่น 0.6% อัตโนมัติเมื่อมีการแทงหวย
CREATE OR REPLACE FUNCTION public.calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_referrer_id UUID;
    v_comm_rate DECIMAL;
BEGIN
    -- ดึงอัตราคอมมิชชั่นจาก settings
    SELECT COALESCE(value::DECIMAL, 0.006) INTO v_comm_rate 
    FROM public.settings WHERE key = 'commission_rate';
    
    -- ดึง referrer
    SELECT referrer_id INTO v_referrer_id 
    FROM public.profiles WHERE id = NEW.user_id;
    
    IF v_referrer_id IS NOT NULL THEN
        UPDATE public.wallets 
        SET commission_balance = commission_balance + (NEW.amount * v_comm_rate)
        WHERE user_id = v_referrer_id;
        
        INSERT INTO public.transactions (user_id, type, amount, status, details)
        VALUES (
            v_referrer_id, 
            'commission', 
            NEW.amount * v_comm_rate, 
            'SUCCESS',
            jsonb_build_object('source_user_id', NEW.user_id, 'bet_id', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bet_placed
    AFTER INSERT ON public.bets
    FOR EACH ROW EXECUTE PROCEDURE public.calculate_commission();

-- F4: ตรวจสอบผลและแจ้งรางวัลอัตโนมัติ (Autonomous Payout Engine)
CREATE OR REPLACE FUNCTION public.process_lottery_results(p_lottery_code TEXT, p_draw_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_result RECORD;
    v_bet RECORD;
    v_payout DECIMAL;
    v_winners INTEGER := 0;
BEGIN
    -- ดึงผลหวย
    SELECT * INTO v_result 
    FROM public.lottery_results 
    WHERE lottery_code = p_lottery_code AND draw_date = p_draw_date
    LIMIT 1;
    
    IF NOT FOUND THEN RETURN 0; END IF;
    
    -- วนผ่านโพยที่ยังรอผลทั้งหมด
    FOR v_bet IN 
        SELECT * FROM public.bets 
        WHERE lottery_code = p_lottery_code 
          AND draw_date = p_draw_date 
          AND status = 'PENDING'
    LOOP
        v_payout := 0;
        
        -- ตรวจสอบแต่ละประเภทการแทง
        CASE v_bet.bet_type
            WHEN '3_top' THEN
                IF v_bet.numbers = RIGHT(v_result.result_p1, 3) THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN '3_tod' THEN
                -- 3 ตัวโต๊ด: เรียงสลับได้
                IF LENGTH(v_bet.numbers) = 3 AND (
                    v_bet.numbers = RIGHT(v_result.result_p1, 3) OR
                    REVERSE(v_bet.numbers) = RIGHT(v_result.result_p1, 3)
                ) THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN '3_front' THEN
                IF v_bet.numbers = LEFT(v_result.result_p1, 3) THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN '2_top' THEN
                IF v_bet.numbers = RIGHT(v_result.result_p1, 2) THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN '2_bottom' THEN
                IF v_bet.numbers = v_result.result_bottom2 THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN 'run_top' THEN
                IF POSITION(v_bet.numbers IN RIGHT(v_result.result_p1, 2)) > 0 THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
            WHEN 'run_bottom' THEN
                IF POSITION(v_bet.numbers IN v_result.result_bottom2) > 0 THEN
                    v_payout := v_bet.amount * v_bet.payout_rate;
                END IF;
        END CASE;
        
        IF v_payout > 0 THEN
            -- อัปเดตสถานะ bet เป็น WON + บันทึกยอดรางวัล
            UPDATE public.bets 
            SET status = 'WON', payout_amount = v_payout
            WHERE id = v_bet.id;
            
            -- เพิ่มเงินรางวัลเข้ากระเป๋า
            UPDATE public.wallets 
            SET balance = balance + v_payout
            WHERE user_id = v_bet.user_id;
            
            -- สร้างรายการธุรกรรม
            INSERT INTO public.transactions (user_id, type, amount, status, details)
            VALUES (
                v_bet.user_id, 
                'win', 
                v_payout, 
                'SUCCESS',
                jsonb_build_object('bet_id', v_bet.id, 'numbers', v_bet.numbers, 'bet_type', v_bet.bet_type)
            );
            
            v_winners := v_winners + 1;
        ELSE
            -- ไม่ถูก
            UPDATE public.bets SET status = 'LOST' WHERE id = v_bet.id;
        END IF;
    END LOOP;
    
    -- อัปเดต last_result ในตาราง lottery_markets
    UPDATE public.lottery_markets 
    SET last_result = v_result.result_p1
    WHERE id = p_lottery_code;
    
    RETURN v_winners;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- F5: หักเงินจากกระเป๋าเมื่อแทงหวย (ป้องกัน Over-bet)
CREATE OR REPLACE FUNCTION public.deduct_bet_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT balance INTO v_balance FROM public.wallets WHERE user_id = NEW.user_id;
    
    IF v_balance < NEW.amount THEN
        RAISE EXCEPTION 'ยอดเงินไม่เพียงพอ: มี ฿% แต่แทง ฿%', v_balance, NEW.amount;
    END IF;
    
    UPDATE public.wallets 
    SET balance = balance - NEW.amount
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bet_deduct_balance
    BEFORE INSERT ON public.bets
    FOR EACH ROW EXECUTE PROCEDURE public.deduct_bet_amount();

-- F6: อัปเดตยอดเงินในกระเป๋าตามประเภทธุรกรรม (Financial Logic Engine)
-- สำหรับ Deposit: เพิ่มเงินเมื่อ SUCCESS
-- สำหรับ Withdrawal: หักเงินทันทีเมื่อ PENDING (เพื่อล็อคยอด) และคืนเงินหาก FAILED/CANCELLED
CREATE OR REPLACE FUNCTION public.update_wallet_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    -- 🟢 กรณี DEPOSIT: เพิ่มเงินเมื่อสำเร็จเท่านั้น
    IF NEW.type = 'DEPOSIT' AND NEW.status = 'SUCCESS' AND (OLD.status IS NULL OR OLD.status != 'SUCCESS') THEN
        UPDATE public.wallets 
        SET balance = balance + NEW.amount,
            total_deposit = total_deposit + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

    -- 🔴 กรณี WITHDRAWAL: หักเงินทันทีเมื่อสร้างรายการ (PENDING) เพื่อล็อคยอด
    ELSIF NEW.type = 'WITHDRAWAL' AND TG_OP = 'INSERT' THEN
        -- ตรวจสอบยอดเงินก่อนหัก
        SELECT balance INTO v_balance FROM public.wallets WHERE user_id = NEW.user_id;
        IF v_balance < NEW.amount THEN
            RAISE EXCEPTION 'ยอดเงินไม่เพียงพอสำหรับการถอน: มี ฿% แต่ต้องการถอน ฿%', v_balance, NEW.amount;
        END IF;

        UPDATE public.wallets 
        SET balance = balance - NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

    -- 🟡 กรณี WITHDRAWAL: คืนเงิน (Refund) ถ้าสถานะเปลี่ยนเป็น FAILED หรือ CANCELLED
    ELSIF NEW.type = 'WITHDRAWAL' AND (NEW.status = 'FAILED' OR NEW.status = 'CANCELLED') AND OLD.status = 'PENDING' THEN
        UPDATE public.wallets 
        SET balance = balance + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;

    -- 🔵 กรณี WITHDRAWAL: บันทึกยอดถอนรวมเมื่อ SUCCESS
    ELSIF NEW.type = 'WITHDRAWAL' AND NEW.status = 'SUCCESS' AND OLD.status = 'PENDING' THEN
        UPDATE public.wallets 
        SET total_withdraw = total_withdraw + NEW.amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_update_wallet
    AFTER INSERT OR UPDATE ON public.transactions
    FOR EACH ROW EXECUTE PROCEDURE public.update_wallet_on_transaction();

-- ==========================================
-- 17. Row Level Security (RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Wallets
CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manage wallets" ON public.wallets FOR ALL USING (auth.role() = 'service_role');

-- Bets
CREATE POLICY "Users view own bets" ON public.bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users place own bets" ON public.bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Public tables (no auth required)
CREATE POLICY "Public read lottery markets" ON public.lottery_markets FOR SELECT USING (TRUE);
CREATE POLICY "Public read lottery results" ON public.lottery_results FOR SELECT USING (TRUE);
CREATE POLICY "Public read lottery rounds" ON public.lottery_rounds FOR SELECT USING (TRUE);
CREATE POLICY "Public read sliders" ON public.sliders FOR SELECT USING (TRUE);
CREATE POLICY "Public read announcements" ON public.announcements FOR SELECT USING (TRUE);
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (TRUE);
CREATE POLICY "Public read banks" ON public.banks FOR SELECT USING (TRUE);
CREATE POLICY "Public read promotions" ON public.promotions FOR SELECT USING (TRUE);
CREATE POLICY "Public read articles" ON public.articles FOR SELECT USING (TRUE);

-- ==========================================
-- 18. Seed Data (ข้อมูลตั้งต้น)
-- ==========================================

-- ตลาดหวยเริ่มต้น (ใช้ใน LotteryList + Home)
INSERT INTO public.lottery_markets (id, name, type, market_type, is_active, is_open, closing_time, last_result, image_url, display_order) VALUES
    ('th_govt', 'สลากกินแบ่งรัฐบาล', 'thai', 'THAI', TRUE, TRUE, '15:20', '803481', 'https://upload.wikimedia.org/wikipedia/th/thumb/a/ae/Government_Lottery_Office.svg/1024px-Government_Lottery_Office.svg.png', 1),
    ('hanoi_normal', 'ฮานอยปกติ', 'hanoi', 'HANOI', TRUE, TRUE, '18:15', '542 90', NULL, 2),
    ('hanoi_extra', 'ฮานอยพิเศษ', 'hanoi', 'HANOI', TRUE, TRUE, '17:30', '381 54', NULL, 3),
    ('lao_dev', 'หวยลาวพัฒนา', 'lao', 'LAO', TRUE, TRUE, '20:20', '8812', NULL, 4),
    ('malay', 'หวยมาเลย์', 'malay', 'LAO', TRUE, FALSE, '18:45', '2391', NULL, 5);

-- Sliders / Banner หน้าหลัก
INSERT INTO public.sliders (type, title, description, image_url, button_text, link, display_order, is_active) VALUES
    ('hero', 'เพิ่มโชคเป็นสองเท่า', 'ฝากเงินวันนี้ รับเครดิตเพิ่มทันที 10%', 'https://i.postimg.cc/mD8G18Z5/Gemini-Generated-Image-pcscyjpcscyjpcsc.png', 'รับสิทธิ์เลย', 'deposit', 1, TRUE),
    ('hero', 'แนะนำเพื่อนรับโบนัส', 'รับส่วนแบ่ง 0.6% จากยอดเดิมพัน', 'https://i.postimg.cc/mD8G18Z5/Gemini-Generated-Image-pcscyjpcscyjpcsc.png', 'แนะนำตอนนี้', 'affiliate', 2, TRUE),
    ('promo', 'แนะนำเพื่อน รับโบนัส', 'รับส่วนแบ่งไม่อั้น ยิ่งชวนยิ่งได้', 'https://i.postimg.cc/mD8G18Z5/Gemini-Generated-Image-pcscyjpcscyjpcsc.png', 'รับโปรโมชั่น', 'affiliate', 1, TRUE),
    ('promo', 'สมาชิกใหม่ รับเครดิตฟรี', 'เพียงฝากครั้งแรกขั้นต่ำ 300 บาท', 'https://i.postimg.cc/mD8G18Z5/Gemini-Generated-Image-pcscyjpcscyjpcsc.png', 'รับโปรโมชั่น', 'deposit', 2, TRUE);

-- Special Payout Marquee
INSERT INTO public.special_payout_marquee (name, rate, display_order) VALUES
    ('3 ตัวตรง', '950', 1),
    ('2 ตัวบน', '95', 2),
    ('2 ตัวล่าง', '95', 3),
    ('วิ่งบน', '3.2', 4),
    ('4 ตัวตรง', '6000', 5);

-- ==========================================
-- END OF MASTER BLUEPRINT v3.0 (FINAL)
-- ==========================================
