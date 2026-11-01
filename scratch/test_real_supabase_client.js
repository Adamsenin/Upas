import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function testWithFetch() {
  console.log('Testing PostgREST directly against:', SUPABASE_URL);

  async function postSoal(payload) {
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
    const status = res.status;
    const body = await res.json().catch(() => null);
    return { status, body };
  }

  // Test 1: with kamus_id: null
  const payload1 = {
    urutan: 9991,
    teks: 'Uji coba payload kamus_id null',
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
    kamus_id: null,
    kunci: 0
  };

  const res1 = await postSoal(payload1);
  console.log('Test 1 (kamus_id: null): status =', res1.status, 'body =', res1.body);
  if (res1.body?.[0]?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/soal?id=eq.${res1.body[0].id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    console.log('Cleaned up Test 1');
  }

  // Test 2: with kamus_id: 'kamus-1' (invalid uuid)
  const payload2 = { ...payload1, urutan: 9992, kamus_id: 'kamus-1' };
  const res2 = await postSoal(payload2);
  console.log('\nTest 2 (kamus_id: "kamus-1"): status =', res2.status, 'body =', res2.body);

  // Test 3: without kamus_id
  const payload3 = { ...payload1, urutan: 9993 };
  delete payload3.kamus_id;
  const res3 = await postSoal(payload3);
  console.log('\nTest 3 (WITHOUT kamus_id): status =', res3.status, 'body =', res3.body);
  if (res3.body?.[0]?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/soal?id=eq.${res3.body[0].id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    console.log('Cleaned up Test 3');
  }

  // Test 4: without kunci
  const payload4 = { ...payload1, urutan: 9994 };
  delete payload4.kunci;
  delete payload4.kamus_id;
  const res4 = await postSoal(payload4);
  console.log('\nTest 4 (WITHOUT kunci): status =', res4.status, 'body =', res4.body);

  // Test 5: without kuis_id
  const payload5 = { ...payload1, urutan: 9995 };
  delete payload5.kuis_id;
  delete payload5.kamus_id;
  const res5 = await postSoal(payload5);
  console.log('\nTest 5 (WITHOUT kuis_id): status =', res5.status, 'body =', res5.body);
  if (res5.body?.[0]?.id) {
    await fetch(`${SUPABASE_URL}/rest/v1/soal?id=eq.${res5.body[0].id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    console.log('Cleaned up Test 5');
  }
}

testWithFetch().catch(console.error);
