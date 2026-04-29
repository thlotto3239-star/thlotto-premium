// Verify seed users can now login
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const SB_URL = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const SB_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();

const users = [
  { name: 'Wachira (admin)', phone: '0900000001', pin: '1234' },
  { name: 'Friend 1',        phone: '0900000002', pin: '1234' },
  { name: 'Friend 2',        phone: '0900000003', pin: '1234' },
  { name: 'Friend 3',        phone: '0900000004', pin: '1234' },
];

let pass = 0, fail = 0;
for (const u of users) {
  const sb = createClient(SB_URL, SB_KEY);
  const { data, error } = await sb.auth.signInWithPassword({
    email: `${u.phone}@thlotto.app`,
    password: `THLT_${u.pin}_${u.phone}`,
  });
  if (error) { console.log(`❌ ${u.name} (${u.phone}/${u.pin}) — ${error.message}`); fail++; }
  else       { console.log(`✅ ${u.name} (${u.phone}/${u.pin}) — login OK`); pass++; }
  await sb.auth.signOut();
}
console.log(`\n${pass}/${pass+fail} seed users can login`);
process.exit(fail > 0 ? 1 : 0);
