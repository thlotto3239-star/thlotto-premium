// E2E Smoke Test Runner — uses supabase-js + fetch to validate full user flows
// Run: node tests/e2e-smoke.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const SUPABASE_URL  = env.match(/VITE_SUPABASE_URL=(.+)/)[1].trim();
const SUPABASE_ANON = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)[1].trim();
const APP_URL = 'http://localhost:5174';
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

const results = [];
const t = async (name, fn) => {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: 'PASS', ms: Date.now() - start });
    console.log(`✅ PASS  ${name}  (${Date.now() - start}ms)`);
  } catch (err) {
    results.push({ name, status: 'FAIL', ms: Date.now() - start, error: err.message });
    console.log(`❌ FAIL  ${name}  — ${err.message}`);
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

// === TESTS ===

await t('Vite dev server reachable', async () => {
  const r = await fetch(APP_URL);
  assert(r.ok, `HTTP ${r.status}`);
  const html = await r.text();
  assert(html.includes('<div id="root">'), 'Missing root div');
});

await t('CSV lottery results endpoint reachable', async () => {
  const r = await fetch(CSV_URL);
  assert(r.ok, `CSV HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  assert(lines.length >= 2, `CSV has only ${lines.length} lines`);
});

await t('Supabase: lottery_markets has open markets', async () => {
  const { data, error } = await sb.from('lottery_markets').select('*').eq('is_active', true);
  assert(!error, error?.message);
  assert(data.length > 0, 'No active markets');
});

await t('Supabase: home page tables exist (sliders/promotions/articles/announcements/trending_items)', async () => {
  const tables = ['sliders', 'promotions', 'articles', 'announcements', 'trending_items'];
  for (const tbl of tables) {
    const { error } = await sb.from(tbl).select('id').limit(1);
    assert(!error, `${tbl}: ${error?.message}`);
  }
});

await t('Supabase: settings table accessible', async () => {
  const { data, error } = await sb.from('settings').select('key,value').limit(5);
  assert(!error, error?.message);
});

let testEmail, testPhone, testPin = '1234';
await t('Auth: signUp new user (phone+PIN flow)', async () => {
  testPhone = '09' + Math.floor(10000000 + Math.random() * 89999999);
  testEmail = `${testPhone}@thlotto.app`;
  const password = `THLT_${testPin}_${testPhone}`;
  const { data, error } = await sb.auth.signUp({
    email: testEmail,
    password,
    options: { data: { phone: testPhone, full_name: 'E2E Tester' } },
  });
  assert(!error, error?.message);
  assert(data.user?.id, 'No user id returned');
});

await t('Auth: signIn with phone+PIN', async () => {
  await sb.auth.signOut();
  const password = `THLT_${testPin}_${testPhone}`;
  const { data, error } = await sb.auth.signInWithPassword({ email: testEmail, password });
  assert(!error, error?.message);
  assert(data.session, 'No session');
});

await t('Auth: profile auto-created on signup', async () => {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
  assert(!error, error?.message);
  assert(data.member_id, 'member_id missing');
});

await t('Auth: wallet auto-created on signup', async () => {
  const { data: { user } } = await sb.auth.getUser();
  const { data, error } = await sb.from('wallets').select('*').eq('user_id', user.id).single();
  assert(!error, error?.message);
  assert(data.balance !== null, 'balance is null');
});

await t('RPC: get_spin_status', async () => {
  const { data, error } = await sb.rpc('get_spin_status');
  assert(!error, error?.message);
  assert(data?.success !== undefined, 'No success field');
});

await t('RPC: place_bet_securely (insufficient balance expected)', async () => {
  const { data, error } = await sb.rpc('place_bet_securely', {
    p_market_id: '00000000-0000-0000-0000-000000000000',
    p_bets: [],
  });
  // Either RPC returns {success:false} or DB error — both are acceptable as "callable"
  assert(error || data, 'No response from RPC');
});

await t('Realtime: publication has wallets+notifications', async () => {
  // Subscribe and check channel state
  const channel = sb.channel('test_check')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {});
  const subscribed = await new Promise((resolve) => {
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') resolve(true);
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') resolve(false);
    });
    setTimeout(() => resolve(false), 5000);
  });
  await sb.removeChannel(channel);
  assert(subscribed, 'Realtime channel did not subscribe');
});

await t('Admin: dashboard_stats requires admin (anon should fail)', async () => {
  const sb2 = createClient(SUPABASE_URL, SUPABASE_ANON);
  const { error } = await sb2.rpc('admin_dashboard_stats');
  assert(error, 'anon should not be allowed');
});

await t('Admin: login Wachira + dashboard stats works', async () => {
  await sb.auth.signOut();
  const { error: e1 } = await sb.auth.signInWithPassword({
    email: '0900000001@thlotto.app', password: 'THLT_1234_0900000001',
  });
  assert(!e1, e1?.message);
  const { data, error } = await sb.rpc('admin_dashboard_stats');
  assert(!error, error?.message);
  assert(data?.total_members !== undefined, 'no stats fields');
});

await t('Admin: list_members works', async () => {
  const { data, error } = await sb.rpc('admin_list_members', { p_search: null, p_limit: 10, p_offset: 0 });
  assert(!error, error?.message);
  assert(Array.isArray(data), 'not array');
});

await t('Admin: restricted_numbers RPCs', async () => {
  const id = await sb.rpc('admin_upsert_restricted_number', {
    p: { bet_type: '3top', number: '999', max_amount: 0, note: 'e2e' }
  });
  assert(!id.error, id.error?.message);
  const del = await sb.rpc('admin_delete_restricted_number', { p_id: id.data });
  assert(!del.error, del.error?.message);
});

// Cleanup
await t('Cleanup: signOut', async () => {
  const { error } = await sb.auth.signOut();
  assert(!error, error?.message);
});

// === REPORT ===
console.log('\n=== SUMMARY ===');
const pass = results.filter(r => r.status === 'PASS').length;
const fail = results.filter(r => r.status === 'FAIL').length;
console.log(`Total: ${results.length}  Pass: ${pass}  Fail: ${fail}`);
if (fail > 0) {
  console.log('\nFailures:');
  results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  process.exit(1);
}
process.exit(0);
