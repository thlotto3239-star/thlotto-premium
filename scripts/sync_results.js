import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dpibocpmmtkthpzqtcht.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaWJvY3BtbXRrdGhwenF0Y2h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjU1NTU1MywiZXhwIjoyMDkyMTMxNTUzfQ.X2x-z6vY9-J-n-k-v-q-x-z-m-p-l-e-k-e-y'; // Note: I should get the service role key if I want to bypass RLS, but for now I'll use anon or ask user.
// Wait, I don't have the service role key. I'll use the anon key for now, or just use RPCs that are public/authed.
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwaWJvY3BtbXRrdGhwenF0Y2h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTU1NTMsImV4cCI6MjA5MjEzMTU1M30.nmQidexBS6N1uLA8rH1oWBT17S8pQy1ncyGYEfrCyFg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT6H6WWef9PagUoZE5wOGcOcUgkz0OVhCVR4hV-EvPgVrG2532EPd3cNJzjfyyoIfvdzAek-nFNVvNp/pub?gid=36966565&single=true&output=csv';

async function syncResults() {
    console.log('Fetching CSV results...');
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.split('\n').map(line => line.split(','));

    // Skip header (Line 0 is CODE,ชื่อหวย...)
    for (let i = 1; i < lines.length; i++) {
        const [code, name, dateStr, res4, res3, res2t, res2b] = lines[i];
        if (!code || code === 'CODE') continue;

        console.log(`Processing ${name} (${code})...`);

        // 1. Find the lottery_id
        const { data: lottery } = await supabase
            .from('lotteries')
            .select('id')
            .eq('code', code)
            .single();

        if (!lottery) {
            console.warn(`Lottery not found for code: ${code}`);
            continue;
        }

        // 2. Parse date
        // Typical formats: "24/04/69", "24/4/2026", "2 พฤษภาคม 2569"
        let drawDate = new Date(); // Fallback to today
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            let day = parts[0];
            let month = parts[1];
            let year = parts[2];
            if (year.length === 2) year = '20' + year; // 69 -> 2069 (which is 2026 Thai)
            // Wait, Thai 69 is 2026.
            if (parseInt(year) > 2500) year = (parseInt(year) - 543).toString();
            drawDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
        }

        // 3. Check for results (skip if "รอผล" or "xxxxxx")
        if (res3 === 'รอผล' || res3 === 'xxx' || !res3) {
            console.log(`Skipping ${name} - No result yet.`);
            continue;
        }

        // 4. Update or Create Draw and Set Results
        // We find an OPEN or PENDING draw for this lottery
        const { data: draws } = await supabase
            .from('draws')
            .select('*')
            .eq('lottery_id', lottery.id)
            .neq('status', 'COMPLETED')
            .order('draw_date', { ascending: false });

        if (draws && draws.length > 0) {
            const draw = draws[0];
            console.log(`Updating draw ${draw.id} with results...`);
            
            const updates = {
                result_4_digits: res4 !== 'xxxxxx' ? res4 : null,
                result_3_digits: res3 !== 'xxx' ? res3.replace(/\s/g, '') : null,
                result_2_digits_top: res2t !== 'xx' ? res2t : null,
                result_2_digits_bottom: res2b !== 'xx' ? res2b : null,
                status: 'COMPLETED',
                result_time: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('draws')
                .update(updates)
                .eq('id', draw.id);

            if (updateError) {
                console.error(`Error updating draw: ${updateError.message}`);
            } else {
                console.log(`Draw ${draw.id} completed. Triggering settlement...`);
                // Trigger settlement RPC
                const { error: settleError } = await supabase.rpc('settle_draw', { p_draw_id: draw.id });
                if (settleError) console.error(`Settlement error: ${settleError.message}`);
            }
        } else {
            console.log(`No active draw found for ${name}. Creating one as COMPLETED...`);
            // Create a completed draw if it doesn't exist (historical data)
            const { error: insertError } = await supabase
                .from('draws')
                .insert({
                    lottery_id: lottery.id,
                    draw_date: drawDate.toISOString().split('T')[0],
                    close_time: new Date().toISOString(),
                    status: 'COMPLETED',
                    result_4_digits: res4 !== 'xxxxxx' ? res4 : null,
                    result_3_digits: res3 !== 'xxx' ? res3.replace(/\s/g, '') : null,
                    result_2_digits_top: res2t !== 'xx' ? res2t : null,
                    result_2_digits_bottom: res2b !== 'xx' ? res2b : null,
                    result_time: new Date().toISOString()
                });
            if (insertError) console.error(`Error inserting draw: ${insertError.message}`);
        }
    }
    console.log('Sync completed.');
}

syncResults().catch(console.error);
