-- TH-LOTTO V1 PRO UPGRADE SQL
-- สคริปต์นี้สำหรับการอัปเกรดฐานข้อมูลเพื่อรองรับหน้าจอมาตรฐานใหม่ 81 หน้า

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MASTER LOTTERY TABLES
-- lottery_types: เก็บประเภทของหวยและค่าการตั้งค่าหลัก
CREATE TABLE IF NOT EXISTS public.lottery_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- เช่น TH_GOV, LAO_DEV
  full_name TEXT NOT NULL,
  short_name TEXT,
  image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  live_url TEXT, -- ลิงก์ถ่ายทอดสดรายวัน
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- lottery_schedules: ตารางเวลาการออกรางวัลแต่ละงวด
CREATE TABLE IF NOT EXISTS public.lottery_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lottery_type TEXT REFERENCES public.lottery_types(code),
  draw_date DATE NOT NULL,
  close_time TIME NOT NULL,
  result_time TIME,
  status TEXT DEFAULT 'OPEN', -- OPEN, CLOSED, FINISHED
  next_draw_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER & FINANCIAL TABLES
-- user_banks: แยกข้อมูลธนาคารเพื่อความปลอดภัยและรองรับหลายบัญชี
CREATE TABLE IF NOT EXISTS public.user_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_code TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- trending: สำหรับจัดการส่วน "มาแรง" บนหน้า Home
CREATE TABLE IF NOT EXISTS public.trending (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. UPDATING EXISTING TABLES (Ensuring compatibility with Pro UI)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS turnover_required DECIMAL(15, 2) DEFAULT 0.00;

ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS announcement_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS announcement_message TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS maintenance_mode BOOLEAN DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS live_stream_url TEXT;

-- 5. SEED DATA FOR NEW STRUCTURE
INSERT INTO public.lottery_types (code, full_name, short_name, is_popular, display_order)
VALUES 
  ('TH_GOV', 'สลากกินแบ่งรัฐบาล', 'รัฐบาลไทย', true, 1),
  ('HANOI_VIP', 'ฮานอย VIP', 'ฮานอย VIP', true, 2),
  ('LAO_DEV', 'หวยลาวพัฒนา', 'ลาวพัฒนา', true, 3)
ON CONFLICT (code) DO NOTHING;

-- ✅ DONE: SUPABASE PRO UPGRADE SCHEMA
