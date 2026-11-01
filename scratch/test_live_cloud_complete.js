globalThis.window = globalThis;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testLiveCloudImport() {
  console.log('--- TEST LIVE CLOUD IMPORT WITH ADAPTIVE SELF-HEALING ---');
  console.log('Target URL:', SUPABASE_URL);

  const {
    parseCSVKeObjek,
    validasiDanSiapkanSoal,
    simpanSoalAdaptif,
    buatPayloadSoalAdaptif,
    ambilKolomTabelSoal
  } = await import('../assets/js/kuis.js');

  // Create mock supabase client for Node.js using real fetch
  const liveSupabaseClient = {
    from: (table) => {
      let _select = '';
      let _limit = null;
      let _order = null;
      let _eq = null;

      const builder = {
        select: (cols) => { _select = cols; return builder; },
        limit: (n) => { _limit = n; return builder; },
        order: (col, opts) => { _order = { col, opts }; return builder; },
        eq: (col, val) => { _eq = { col, val }; return builder; },
        then: async (resolve) => {
          let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(_select || '*')}`;
          if (_limit) url += `&limit=${_limit}`;
          if (_eq) url += `&${_eq.col}=eq.${encodeURIComponent(_eq.val)}`;
          if (_order) url += `&order=${_order.col}.${_order.opts?.ascending === false ? 'desc' : 'asc'}`;

          const res = await fetch(url, {
            headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
          });
          const data = await res.json().catch(() => null);
          resolve({ data: res.ok ? data : null, error: res.ok ? null : data });
        },
        insert: (payload) => {
          return {
            select: async () => {
              const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
                method: 'POST',
                headers: {
                  apikey: SUPABASE_ANON_KEY,
                  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
              });
              const body = await res.json().catch(() => null);
              return { data: res.ok ? body : null, error: res.ok ? null : body };
            }
          };
        },
        update: (payload) => {
          return {
            eq: (col, val) => {
              return {
                select: async () => {
                  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
                    method: 'PATCH',
                    headers: {
                      apikey: SUPABASE_ANON_KEY,
                      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                      'Content-Type': 'application/json',
                      'Prefer': 'return=representation'
                    },
                    body: JSON.stringify(payload)
                  });
                  const body = await res.json().catch(() => null);
                  return { data: res.ok ? body : null, error: res.ok ? null : body };
                }
              };
            }
          };
        },
        delete: () => {
          return {
            eq: async (col, val) => {
              const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
                method: 'DELETE',
                headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
              });
              return { error: res.ok ? null : await res.json().catch(() => null) };
            }
          };
        }
      };
      return builder;
    }
  };

  const csvRaw = fs.readFileSync(path.join(__dirname, '30_soal_ipas_kelas5.csv'), 'utf-8');
  const rows = parseCSVKeObjek(csvRaw);
  console.log(`Parsed ${rows.length} rows.`);

  const validated = validasiDanSiapkanSoal(rows, 1);
  console.log(`Validated ${validated.length} questions.`);

  const cols = await ambilKolomTabelSoal();
  console.log('Columns detected:', Array.from(cols));

  // Test inserting 3 questions directly into live Supabase cloud
  const testBatch = validated.slice(0, 3);
  const insertedIds = [];

  for (const item of testBatch) {
    const payload = buatPayloadSoalAdaptif(
      item.soalPayload,
      '11111111-1111-1111-1111-111111111111',
      cols,
      item.kunci
    );

    console.log(`Inserting question #${payload.urutan}...`);
    const res = await simpanSoalAdaptif(liveSupabaseClient, payload, item.kunci, cols);

    if (res.error) {
      console.error(`FAILED to insert #${payload.urutan}:`, res.error);
      throw res.error;
    }

    const createdId = res.data?.[0]?.id;
    console.log(`  -> Inserted ID: ${createdId}`);
    insertedIds.push(createdId);
  }

  console.log(`\nSuccessfully inserted ${insertedIds.length} questions into live Supabase cloud!`);

  // Cleanup test records
  console.log('Cleaning up live test records...');
  for (const id of insertedIds) {
    await liveSupabaseClient.from('soal').delete().eq('id', id);
  }
  console.log('Cleanup complete. Live test passed with 100% SUCCESS!');
}

testLiveCloudImport().catch(console.error);
