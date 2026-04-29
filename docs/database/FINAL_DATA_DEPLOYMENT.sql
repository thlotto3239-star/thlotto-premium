-- FINAL AUTHORITATIVE DATA DEPLOYMENT
-- บันทึกข้อมูลหวยทั้ง 21 รายการ พร้อมเกณฑ์เวลาปิดรับ 20 นาที (20-Minute Closing Rule)

-- 1. ล้างข้อมูลเก่าเพื่อให้โครงสร้างตรงกัน
TRUNCATE TABLE public.lottery_types CASCADE;

-- 2. นำเข้าข้อมูลประเภทหวย (Types)
INSERT INTO public.lottery_types (code, full_name, short_name, is_popular, display_order, image_url) VALUES
  ('TH_GOV', 'สลากกินแบ่งรัฐบาล', 'รัฐบาลไทย', true, 1, 'https://play-lh.googleusercontent.com/4pg4yiOE00PNQGeovUPxL_svNuhBej5poDY9Ts6V9Qd_BSaWwcDLv8kFbsGAq_9isuI=w240-h480-rw'),
  ('LAO_DEV', 'หวยลาวพัฒนา', 'ลาวพัฒนา', true, 2, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/fqW29ieijwwJQMBAwWoC.png'),
  ('HANOI_VIP', 'ฮานอย VIP', 'ฮานอย VIP', true, 3, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/M5P6d7nXU8TwpnWCVsrw.png'),
  ('HANOI', 'ฮานอยปกติ', 'ฮานอยปกติ', true, 4, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/jwEPDlOqTYJOQgbLd9F1.png'),
  ('HANOI_SPECIAL', 'ฮานอยพิเศษ', 'ฮานอยพิเศษ', true, 5, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/NLH3aQjOcgah91nGgQIO.png'),
  ('MALAY', 'หวยมาเลย์', 'หวยมาเลย์', false, 6, 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/fI9BcjFZ8EVJ9ZEcmf9e.png'),
  ('STOCK_DOWJONES', 'หุ้นดาวน์โจนส์', 'ดาวน์โจนส์', false, 7, 'https://mootelu.com/img/Thai.png'),
  ('STOCK_RUSSIA', 'หุ้นรัสเซีย', 'หุ้นรัสเซีย', false, 8, 'https://mootelu.com/img/Russia.png'),
  ('STOCK_ENGLAND', 'หุ้นอังกฤษ', 'หุ้นอังกฤษ', false, 9, 'https://mootelu.com/img/Hong-Kong.png'),
  ('STOCK_GERMANY', 'หุ้นเยอรมัน', 'หุ้นเยอรมัน', false, 10, 'https://mootelu.com/img/En.png'),
  ('STOCK_KOREA', 'หุ้นเกาหลี', 'หุ้นเกาหลี', false, 11, 'https://mootelu.com/img/South-Korea.png'),
  ('STOCK_TAIWAN', 'หุ้นไต้หวัน', 'หุ้นไต้หวัน', false, 12, 'https://mootelu.com/img/Taiwan.png'),
  ('STOCK_SG', 'หุ้นสิงคโปร์', 'หุ้นสิงคโปร์', false, 13, 'https://mootelu.com/img/Singapore.png'),
  ('STOCK_INDIA', 'หุ้นอินเดีย', 'หุ้นอินเดีย', false, 14, 'https://mootelu.com/img/India.png'),
  ('STOCK_EGYPT', 'หุ้นอียิปต์', 'หุ้นอียิปต์', false, 15, 'https://mootelu.com/img/Egypt2.png'),
  ('NIKKEI_MORNING', 'หุ้นนิเคอิเช้า', 'นิเคอิเช้า', false, 16, 'https://mootelu.com/img/Japan.png'),
  ('NIKKEI_AFTERNOON', 'หุ้นนิเคอิบ่าย', 'นิเคอิบ่าย', false, 17, 'https://mootelu.com/img/Hong-Kong.png'),
  ('CHINA_MORNING', 'หุ้นจีนเช้า', 'หุ้นจีนเช้า', false, 18, 'https://mootelu.com/img/China.png'),
  ('CHINA_AFTERNOON', 'หุ้นจีนบ่าย', 'หุ้นจีนบ่าย', false, 19, 'https://mootelu.com/img/China.png'),
  ('HANGSENG_MORNING', 'หุ้นฮั่งเส็งเช้า', 'ฮั่งเส็งเช้า', false, 20, 'https://mootelu.com/img/Japan.png'),
  ('HANGSENG_AFTERNOON', 'หุ้นฮั่งเส็งบ่าย', 'ฮั่งเส็งบ่าย', false, 21, 'https://mootelu.com/img/Germany.png');

-- 3. นำเข้าตารางเวลา (Schedules) พร้อมกฎ 20 นาที
-- ใช้วันที่ปัจจุบันเป็นตัวอย่าง (ในระบบจริงจะใช้ Cron Job หรือ Admin Tool ในการสร้าง)
INSERT INTO public.lottery_schedules (lottery_type, draw_date, close_time, result_time) VALUES
  ('TH_GOV', '2026-04-16', '15:30:00', '15:50:00'),
  ('LAO_DEV', '2026-04-15', '20:10:00', '20:30:00'),
  ('HANOI_VIP', '2026-04-16', '19:10:00', '19:30:00'),
  ('HANOI', '2026-04-16', '18:10:00', '18:30:00'),
  ('HANOI_SPECIAL', '2026-04-16', '17:10:00', '17:30:00'),
  ('MALAY', '2026-04-15', '18:40:00', '19:00:00'),
  ('STOCK_DOWJONES', '2026-04-16', '03:40:00', '04:00:00'),
  ('STOCK_RUSSIA', '2026-04-16', '22:25:00', '22:45:00'),
  ('STOCK_ENGLAND', '2026-04-16', '23:10:00', '23:30:00'),
  ('STOCK_GERMANY', '2026-04-16', '22:40:00', '23:00:00'),
  ('STOCK_KOREA', '2026-04-16', '13:10:00', '13:30:00'),
  ('STOCK_TAIWAN', '2026-04-16', '12:10:00', '12:30:00'),
  ('STOCK_SG', '2026-04-16', '17:10:00', '17:30:00'),
  ('STOCK_INDIA', '2026-04-16', '17:50:00', '18:10:00'),
  ('STOCK_EGYPT', '2026-04-16', '19:40:00', '20:00:00'),
  ('NIKKEI_MORNING', '2026-04-16', '09:10:00', '09:30:00'),
  ('NIKKEI_AFTERNOON', '2026-04-16', '12:40:00', '13:00:00'),
  ('CHINA_MORNING', '2026-04-16', '10:10:00', '10:30:00'),
  ('CHINA_AFTERNOON', '2026-04-16', '13:40:00', '14:00:00'),
  ('HANGSENG_MORNING', '2026-04-16', '10:40:00', '11:00:00'),
  ('HANGSENG_AFTERNOON', '2026-04-16', '14:40:00', '15:00:00');

-- 4. ติดตั้ง Payout Rates พื้นฐานสำหรับทุกหวย
-- รัฐบาลไทย (Code: TH_GOV) = 900-950
INSERT INTO public.payout_rates (lottery_code, bet_type, rate)
SELECT code, '3_top', 850 FROM public.lottery_types WHERE code <> 'TH_GOV'
UNION ALL
SELECT code, '2_top', 95 FROM public.lottery_types WHERE code <> 'TH_GOV'
UNION ALL
SELECT code, '2_bottom', 95 FROM public.lottery_types WHERE code <> 'TH_GOV'
UNION ALL
SELECT 'TH_GOV', '3_top', 950
UNION ALL
SELECT 'TH_GOV', '2_top', 95
UNION ALL
SELECT 'TH_GOV', '2_bottom', 95;

-- ✅ DONE: AUTHORITATIVE DATA DEPLOYED
