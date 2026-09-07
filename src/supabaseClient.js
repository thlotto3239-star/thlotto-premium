import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://ygopnjbvccenryejqmlw.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlnb3BuamJ2Y2NlbnJ5ZWpxbWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTc2NjQsImV4cCI6MjA5MjEzMzY2NH0.aOA0zbkUtS85hb0Bz5aZO8koi2gVHmDGE7Vttv0VDME';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

// ตรวจสอบว่า Key ไม่มีอักขระ Masked Bullet (•) หรือ Non-ASCII ที่ทำให้ fetch พัง
const isValidAsciiKey = (key) => {
  if (!key || key.length < 50) return false;
  for (let i = 0; i < key.length; i++) {
    if (key.charCodeAt(i) > 127) return false;
  }
  return true;
};

const supabaseUrl = rawUrl.startsWith('http') ? rawUrl : FALLBACK_URL;
const supabaseAnonKey = isValidAsciiKey(rawKey) ? rawKey : FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
