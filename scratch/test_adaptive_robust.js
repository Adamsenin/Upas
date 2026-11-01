import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

function isUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str.trim());
}

async function executeInsertAdaptif(payloadAwal, rawKunci, kolomTersedia) {
  let payload = { ...payloadAwal };
  let attempts = 0;
  const maxAttempts = 6;

  while (attempts < maxAttempts) {
    attempts++;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/soal`, {
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

    if (res.ok && body && Array.isArray(body) && body.length > 0) {
      return { success: true, data: body[0], attempts };
    }

    const errMsg = (body?.message || JSON.stringify(body || '')).toLowerCase();
    console.log(`[Attempt ${attempts}] Error:`, errMsg);

    // 1. Column missing in PostgREST schema cache
    if (errMsg.includes("could not find the '") && errMsg.includes("column")) {
      const match = errMsg.match(/could not find the '([^']+)' column/);
      if (match && match[1]) {
        const col = match[1];
        console.log(`  -> Removing missing column: ${col}`);
        kolomTersedia.delete(col);
        delete payload[col];
        continue;
      }
    }

    // 2. Column "kunci" violates NOT NULL constraint
    if (errMsg.includes('column "kunci"') && (errMsg.includes('not-null') || errMsg.includes('violates'))) {
      console.log(`  -> Adding required 'kunci' column`);
      kolomTersedia.add('kunci');
      const numKunci = parseInt(rawKunci ?? 0, 10);
      payload.kunci = isNaN(numKunci) ? 0 : numKunci;
      continue;
    }

    // 3. Invalid UUID syntax (e.g. 'kamus-1' in a uuid column)
    if (errMsg.includes('invalid input syntax for type uuid')) {
      if ('kamus_id' in payload && !isUUID(payload.kamus_id)) {
        console.log(`  -> Removing invalid UUID kamus_id: ${payload.kamus_id}`);
        delete payload.kamus_id;
        continue;
      }
      if ('kuis_id' in payload && !isUUID(payload.kuis_id)) {
        console.log(`  -> Removing invalid UUID kuis_id: ${payload.kuis_id}`);
        delete payload.kuis_id;
        continue;
      }
    }

    // 4. Foreign key constraint
    if (errMsg.includes('foreign key constraint') || errMsg.includes('violates foreign key')) {
      if (errMsg.includes('kamus_id') && 'kamus_id' in payload) {
        console.log(`  -> Removing FK violating kamus_id`);
        delete payload.kamus_id;
        continue;
      }
      if (errMsg.includes('kuis_id') && 'kuis_id' in payload) {
        console.log(`  -> Removing FK violating kuis_id`);
        kolomTersedia.delete('kuis_id');
        delete payload.kuis_id;
        continue;
      }
    }

    return { success: false, error: body, attempts };
  }

  return { success: false, error: 'Exceeded max retry attempts', attempts };
}

async function runTest() {
  console.log('--- Testing Adaptive Insert with deliberate schema mismatches ---');
  const cols = new Set(['id', 'urutan', 'teks', 'tipe', 'bab', 'tingkat_kesulitan', 'penjelasan', 'poin', 'waktu_detik', 'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'kuis_id', 'kamus_id']);

  // Intentional issues:
  // 1. non_existent_col: 'bad' (schema cache error)
  // 2. kamus_id: 'kamus-1' (invalid uuid)
  // 3. no 'kunci' (not-null constraint)
  const problematicPayload = {
    urutan: 9999,
    teks: 'Uji Coba Ketahanan Eksekusi Adaptif',
    tipe: 'pilihan_ganda',
    bab: 'Bab 1: Rantai Makanan',
    tingkat_kesulitan: 'mudah',
    penjelasan: 'Test',
    waktu_detik: 30,
    poin: 10,
    opsi: ['A', 'B', 'C', 'D'],
    opsi_a: 'A',
    opsi_b: 'B',
    opsi_c: 'C',
    opsi_d: 'D',
    kuis_id: '11111111-1111-1111-1111-111111111111',
    kamus_id: 'kamus-1',
    non_existent_col: 'trigger_schema_cache_error'
  };

  const result = await executeInsertAdaptif(problematicPayload, '2', cols);
  console.log('Final Result:', result);

  if (result.success && result.data?.id) {
    console.log('Insert succeeded! Cleaning up test record...');
    await fetch(`${SUPABASE_URL}/rest/v1/soal?id=eq.${result.data.id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    console.log('Record cleaned up cleanly.');
  }
}

runTest();
