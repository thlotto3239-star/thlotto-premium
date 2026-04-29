-- =====================================================
-- TH-LOTTO FULL PRODUCTION SETUP SQL
-- รัน Script นี้ใน Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id TEXT,
  full_name TEXT,
  phone TEXT,
  phone_number TEXT,
  vip_level TEXT DEFAULT 'MEMBER',
  referrer_id UUID,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  pin_hash TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS member_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vip_level TEXT DEFAULT 'MEMBER';

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance DECIMAL(15, 2) DEFAULT 0.00,
  commission_balance DECIMAL(15, 2) DEFAULT 0.00,
  total_won DECIMAL(15, 2) DEFAULT 0.00,
  total_bets DECIMAL(15, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS commission_balance DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS total_won DECIMAL(15, 2) DEFAULT 0.00;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS total_bets DECIMAL(15, 2) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lottery_markets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  image_url TEXT,
  closing_time TEXT,
  is_open BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.lottery_markets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE TABLE IF NOT EXISTS public.lottery_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id UUID REFERENCES public.lottery_markets(id),
  draw_date DATE NOT NULL,
  result_p1 TEXT,
  result_3front TEXT,
  result_3bottom TEXT,
  result_bottom2 TEXT,
  result_top3 TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payout_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market TEXT NOT NULL,
  bet_type TEXT NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  UNIQUE(market, bet_type)
);

CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  market_id UUID REFERENCES public.lottery_markets(id),
  lottery_code TEXT,
  draw_date DATE,
  bet_type TEXT NOT NULL,
  numbers TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payout_rate DECIMAL(10, 2),
  status TEXT DEFAULT 'PENDING',
  payout_amount DECIMAL(15, 2) DEFAULT 0.00,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.bets ADD COLUMN IF NOT EXISTS market_id UUID REFERENCES public.lottery_markets(id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  status TEXT DEFAULT 'PENDING',
  reference_id TEXT,
  ref_id TEXT,
  note TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS details JSONB;

CREATE TABLE IF NOT EXISTS public.sliders (
  id SERIAL PRIMARY KEY,
  title TEXT,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  link_url TEXT,
  button_text TEXT DEFAULT 'ดูรายละเอียด',
  type TEXT DEFAULT 'hero',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.sliders ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'hero';
ALTER TABLE public.sliders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.sliders ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT 'ดูรายละเอียด';
ALTER TABLE public.sliders ADD COLUMN IF NOT EXISTS link TEXT;

CREATE TABLE IF NOT EXISTS public.announcements (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.promotions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  bonus_rate DECIMAL(5, 2) DEFAULT 0.00,
  min_deposit DECIMAL(15, 2) DEFAULT 0.00,
  type TEXT DEFAULT 'general',
  badge_text TEXT,
  background_color TEXT,
  default_amount DECIMAL(15, 2) DEFAULT 0,
  target_view TEXT DEFAULT 'deposit',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  category TEXT DEFAULT 'NEWS',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.banks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.withdraw_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_name TEXT,
  status TEXT DEFAULT 'PENDING',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  slip_url TEXT,
  status TEXT DEFAULT 'PENDING',
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ALGORITHMIC FUNCTIONS
-- sort_string: Helper สำหรับตรวจ 3 ตัวโต๊ด (Permutation matching)
CREATE OR REPLACE FUNCTION public.sort_string(input_string TEXT)
RETURNS TEXT AS $$
  SELECT string_agg(chars, '')
  FROM (
    SELECT unnest(regexp_split_to_array(input_string, '')) AS chars
    ORDER BY chars
  ) AS sorted;
$$ LANGUAGE sql IMMUTABLE SECURITY DEFINER;

-- check_bet_winner: ตรวจสอบว่าบิลชนะหรือไม่
CREATE OR REPLACE FUNCTION public.check_bet_winner(
  p_bet_numbers TEXT, 
  p_bet_type TEXT, 
  p_result_p1 TEXT,
  p_result_3front TEXT DEFAULT NULL,
  p_result_3bottom TEXT DEFAULT NULL,
  p_result_bottom2 TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  CASE p_bet_type
    WHEN '3TOP' THEN RETURN p_bet_numbers = RIGHT(p_result_p1, 3);
    WHEN '3TODE' THEN RETURN sort_string(p_bet_numbers) = sort_string(RIGHT(p_result_p1, 3));
    WHEN '3FRONT' THEN RETURN p_bet_numbers = p_result_3front OR p_bet_numbers = p_result_3bottom;
    WHEN '2BOTTOM' THEN RETURN p_bet_numbers = p_result_bottom2;
    WHEN '2TOP' THEN RETURN p_bet_numbers = RIGHT(p_result_p1, 2);
    WHEN 'RUN_UP' THEN RETURN p_result_p1 LIKE '%' || p_bet_numbers || '%';
    WHEN 'RUN_DOWN' THEN RETURN p_result_bottom2 LIKE '%' || p_bet_numbers || '%';
    ELSE RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- process_lottery_draw: ประมวลผลรางวัลทั้งหมดของงวดที่ออก
CREATE OR REPLACE FUNCTION public.process_lottery_draw(
  p_market_id UUID,
  p_result_p1 TEXT,
  p_result_3front TEXT DEFAULT NULL,
  p_result_3bottom TEXT DEFAULT NULL,
  p_result_bottom2 TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_bet RECORD;
  v_won_count INTEGER := 0;
BEGIN
  -- Loop through all pending bets for this market
  FOR v_bet IN 
    SELECT * FROM public.bets 
    WHERE market_id = p_market_id AND status = 'PENDING'
  LOOP
    IF check_bet_winner(v_bet.numbers, v_bet.bet_type, p_result_p1, p_result_3front, p_result_3bottom, p_result_bottom2) THEN
      UPDATE public.bets 
      SET status = 'WON', 
          payout_amount = v_bet.amount * v_bet.payout_rate,
          updated_at = NOW()
      WHERE id = v_bet.id;
      v_won_count := v_won_count + 1;
    ELSE
      UPDATE public.bets SET status = 'LOST', updated_at = NOW() WHERE id = v_bet.id;
    END IF;
  END LOOP;
  
  -- Auto-credit winnings
  UPDATE public.wallets w
  SET balance = balance + b.payout_amount, updated_at = NOW()
  FROM public.bets b
  WHERE b.market_id = p_market_id AND b.status = 'WON' AND b.is_paid = FALSE
    AND w.user_id = b.user_id;

  UPDATE public.bets SET is_paid = TRUE, updated_at = NOW()
  WHERE market_id = p_market_id AND status = 'WON' AND is_paid = FALSE;

  RETURN v_won_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- exec_sql: Admin convenience
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN EXECUTE sql_query; END;
$$;

-- 4. AUTH TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, member_id, full_name, phone)
  VALUES (
    new.id,
    'THP-' || upper(substr(md5(random()::text), 0, 8)),
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'phone', new.raw_user_meta_data->>'phone_number')
  ) ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id)
  VALUES (new.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdraw_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='User own profile') THEN
    CREATE POLICY "User own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallets' AND policyname='User own wallet') THEN
    CREATE POLICY "User own wallet" ON public.wallets FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bets' AND policyname='User own bets') THEN
    CREATE POLICY "User own bets" ON public.bets FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='transactions' AND policyname='User own transactions') THEN
    CREATE POLICY "User own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='withdraw_requests' AND policyname='User own withdrawals') THEN
    CREATE POLICY "User own withdrawals" ON public.withdraw_requests FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='deposit_requests' AND policyname='User own deposits') THEN
    CREATE POLICY "User own deposits" ON public.deposit_requests FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- Public read access on CMS tables
GRANT SELECT ON public.lottery_markets TO anon, authenticated;
GRANT SELECT ON public.lottery_results TO anon, authenticated;
GRANT SELECT ON public.sliders TO anon, authenticated;
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT SELECT ON public.promotions TO anon, authenticated;
GRANT SELECT ON public.articles TO anon, authenticated;
GRANT SELECT ON public.banks TO anon, authenticated;
GRANT SELECT ON public.payout_rates TO anon, authenticated;
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.bets TO authenticated;
GRANT INSERT ON public.transactions TO authenticated;
GRANT INSERT ON public.withdraw_requests TO authenticated;
GRANT INSERT ON public.deposit_requests TO authenticated;
GRANT UPDATE ON public.wallets TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;

-- 6. SEED DATA
INSERT INTO public.settings (key, value, description) VALUES
  ('system_status', 'ONLINE', 'สถานะระบบ'),
  ('maintenance_mode', 'false', 'โหมดซ่อมบำรุง'),
  ('min_deposit', '100', 'จำนวนเงินฝากขั้นต่ำ'),
  ('min_withdraw', '300', 'จำนวนเงินถอนขั้นต่ำ'),
  ('min_bet', '1', 'จำนวนเดิมพันขั้นต่ำ')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.lottery_markets (name, type, closing_time, is_open, is_active, display_order) VALUES
  ('หวยรัฐบาลไทย', 'thai', '15:00:00', true, true, 1),
  ('หวยฮานอย VIP', 'hanoi', '18:30:00', true, true, 2),
  ('หวยลาวพัฒนา', 'lao', '20:30:00', true, true, 3),
  ('หวยมาเลย์', 'malay', '19:00:00', true, true, 4),
  ('หวยยี่กี 5 นาที', 'yeekee', '23:55:00', true, true, 5),
  ('หวยฮานอยปกติ', 'hanoi_normal', '18:00:00', true, true, 6),
  ('หวยฮานอยพิเศษ', 'hanoi_special', '19:00:00', true, true, 7)
ON CONFLICT DO NOTHING;

INSERT INTO public.payout_rates (market, bet_type, rate) VALUES
  ('thai', '3TOP', 900), ('thai', '3TODE', 150), ('thai', '3FRONT', 450), ('thai', '2BOTTOM', 90), ('thai', '2TOP', 90), ('thai', 'RUN_UP', 3.2), ('thai', 'RUN_DOWN', 4.5),
  ('hanoi', '3TOP', 800), ('hanoi', '3TODE', 125), ('hanoi', '2BOTTOM', 85), ('hanoi', '2TOP', 85), ('hanoi', 'RUN_UP', 3.2), ('hanoi', 'RUN_DOWN', 4.5),
  ('hanoi_normal', '3TOP', 750), ('hanoi_normal', '3TODE', 120), ('hanoi_normal', '2BOTTOM', 80), ('hanoi_normal', 'RUN_UP', 3.0),
  ('hanoi_special', '3TOP', 800), ('hanoi_special', '3TODE', 125), ('hanoi_special', '2BOTTOM', 85), ('hanoi_special', 'RUN_UP', 3.2),
  ('lao', '3TOP', 750), ('lao', '3TODE', 120), ('lao', '2BOTTOM', 80), ('lao', 'RUN_UP', 3.0), ('lao', 'RUN_DOWN', 4.0),
  ('malay', '3TOP', 700), ('malay', '3TODE', 110), ('malay', '2BOTTOM', 75), ('malay', 'RUN_UP', 2.8), ('malay', 'RUN_DOWN', 3.8),
  ('yeekee', '3TOP', 900), ('yeekee', '3TODE', 150), ('yeekee', '2BOTTOM', 90), ('yeekee', 'RUN_UP', 3.2), ('yeekee', 'RUN_DOWN', 4.5)
ON CONFLICT (market, bet_type) DO NOTHING;

INSERT INTO public.announcements (content, is_active, display_order) VALUES
  ('ยินดีต้อนรับสู่ TH-LOTTO ระบบฝาก-ถอนอัตโนมัติ 24 ชม.', true, 1),
  ('แนะนำเพื่อน รับโบนัส 0.6% ทุกยอดเดิมพัน ไม่จำกัด', true, 2),
  ('อัตราจ่ายสูงสุด หวยรัฐบาล 3 ตัวบน จ่าย 900 บาท', true, 3)
ON CONFLICT DO NOTHING;

INSERT INTO public.sliders (title, description, image_url, button_text, link, type, display_order, is_active) VALUES
  ('เพิ่มโชคเป็นสองเท่า', 'ฝากเงินวันนี้ รับเครดิตเพิ่มทันที 10%', 'https://images.unsplash.com/photo-1607944024060-42b14e7d73ac?w=800', 'รับสิทธิ์เลย', 'deposit', 'hero', 1, true),
  ('หวยยี่กี 5 นาที', 'ออกผลทุก 5 นาที ตลอด 24 ชั่วโมง', 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800', 'แทงเลย', 'lottery', 'hero', 2, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.banks (name, code, is_active) VALUES
  ('ธนาคารกสิกรไทย', 'KBANK', true),
  ('ธนาคารไทยพาณิชย์', 'SCB', true),
  ('ธนาคารกรุงไทย', 'KTB', true),
  ('ธนาคารกรุงเทพ', 'BBL', true),
  ('ธนาคารออมสิน', 'GSB', true),
  ('ทรูมันนี่วอลเล็ท', 'TRUEWALLET', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.promotions (title, description, badge_text, background_color, default_amount, target_view, is_active) VALUES
  ('โบนัสฝากครั้งแรก', 'รับเพิ่มทันที 10% สูงสุด 500 บาท', 'NEW', 'linear-gradient(135deg, #059669 0%, #10b981 100%)', 500, 'deposit', true),
  ('ลูกค้า VIP ระดับทอง', 'คืนเงินทุกยอดเสีย 5% ทุกสัปดาห์', 'VIP', 'linear-gradient(135deg, #b45309 0%, #d97706 100%)', 1000, 'deposit', true)
ON CONFLICT DO NOTHING;

-- ✅ DONE: TH-LOTTO Full Schema + Algorithmic Functions + Seed Data
