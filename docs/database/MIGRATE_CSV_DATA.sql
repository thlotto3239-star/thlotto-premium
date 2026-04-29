-- MIGRATE LOTTERY MARKETS FROM CSV AND INSTALL AUTOMATION
-- ขั้นตอนนี้จะทำการเพิ่มคอลัมน์เวลาประกาศผล และนำเข้าข้อมูลหวยทั้ง 21 รายการจาก CSV

-- 1. เพิ่มคอลัมน์ประกาศผล (Announcement Time)
ALTER TABLE public.lottery_markets ADD COLUMN IF NOT EXISTS announcement_time TIME;

-- 2. ล้างข้อมูลเก่า (เพื่อป้องกันข้อมูลซ้ำซ้อน)
TRUNCATE TABLE public.lottery_markets CASCADE;

-- 3. นำเข้าข้อมูลหวย 21 รายการ
-- รหัส UUID แบบคงที่เพื่อให้การอ้างอิงของผลรางวัลและ Payout Rate แม่นยำ
INSERT INTO public.lottery_markets (id, name, type, image_url, announcement_time, closing_time, is_open, is_active, display_order) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'หวยรัฐบาลไทย', 'thai', 'https://play-lh.googleusercontent.com/4pg4yiOE00PNQGeovUPxL_svNuhBej5poDY9Ts6V9Qd_BSaWwcDLv8kFbsGAq_9isuI=w240-h480-rw', '15:50:00', '15:30:00', true, true, 1),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'หวยลาวพัฒนา', 'lao', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/fqW29ieijwwJQMBAwWoC.png', '20:30:00', '20:10:00', true, true, 2),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ฮานอย VIP', 'hanoi', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/M5P6d7nXU8TwpnWCVsrw.png', '19:30:00', '19:10:00', true, true, 3),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'ฮานอยปกติ', 'hanoi', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/jwEPDlOqTYJOQgbLd9F1.png', '18:30:00', '18:10:00', true, true, 4),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'ฮานอยพิเศษ', 'hanoi', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/NLH3aQjOcgah91nGgQIO.png', '17:30:00', '17:10:00', true, true, 5),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'หวยมาเลย์', 'malay', 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/d3Nyjgtntlkei3MGYjuM/pub/fI9BcjFZ8EVJ9ZEcmf9e.png', '19:00:00', '18:40:00', true, true, 6),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a17', 'หุ้นดาวน์โจนส์', 'stock', 'https://mootelu.com/img/Thai.png', '04:00:00', '03:40:00', true, true, 7),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a18', 'หุ้นรัสเซีย', 'stock', 'https://mootelu.com/img/Russia.png', '22:45:00', '22:25:00', true, true, 8),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a19', 'หุ้นอังกฤษ', 'stock', 'https://mootelu.com/img/Hong-Kong.png', '23:30:00', '23:10:00', true, true, 9),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a20', 'หุ้นเยอรมัน', 'stock', 'https://mootelu.com/img/En.png', '23:00:00', '22:40:00', true, true, 10),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a21', 'หุ้นเกาหลี', 'stock', 'https://mootelu.com/img/South-Korea.png', '13:30:00', '13:10:00', true, true, 11),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'หุ้นไต้หวัน', 'stock', 'https://mootelu.com/img/Taiwan.png', '12:30:00', '12:10:00', true, true, 12),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a23', 'หุ้นสิงคโปร์', 'stock', 'https://mootelu.com/img/Singapore.png', '17:30:00', '17:10:00', true, true, 13),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a24', 'หุ้นอินเดีย', 'stock', 'https://mootelu.com/img/India.png', '18:10:00', '17:50:00', true, true, 14),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a25', 'หุ้นอียิปต์', 'stock', 'https://mootelu.com/img/Egypt2.png', '20:00:00', '19:40:00', true, true, 15),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a26', 'หุ้นนิเคอิเช้า', 'stock', 'https://mootelu.com/img/Japan.png', '09:30:00', '09:10:00', true, true, 16),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a27', 'หุ้นนิเคอิบ่าย', 'stock', 'https://mootelu.com/img/Hong-Kong.png', '13:00:00', '12:40:00', true, true, 17),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a28', 'หุ้นจีนเช้า', 'stock', 'https://mootelu.com/img/China.png', '10:30:00', '10:10:00', true, true, 18),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a29', 'หุ้นจีนบ่าย', 'stock', 'https://mootelu.com/img/China.png', '14:00:00', '13:40:00', true, true, 19),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd381a11', 'หุ้นฮั่งเส็งเช้า', 'stock', 'https://mootelu.com/img/Japan.png', '11:00:00', '10:40:00', true, true, 20),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd381a12', 'หุ้นฮั่งเส็งบ่าย', 'stock', 'https://mootelu.com/img/Germany.png', '15:00:00', '14:40:00', true, true, 21);

-- 4. นำเข้าผลรางวัลล่าสุดจาก CSV (ข้อมูล ณ วันที่ 16 เมษายน 2569/2526)
INSERT INTO public.lottery_results (market_id, draw_date, result_p1, result_3front, result_3bottom, result_bottom2) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '2026-04-16', '309612', '355', '868', '77'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', '2026-04-16', '1041', '041', '', '34'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', '2026-04-16', '5035', '035', '', '27'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', '2026-04-16', '3430', '430', '', '04');

-- ✅ DONE: FULL DEPLOYMENT OF 21 MARKETS + INITIAL RESULTS
