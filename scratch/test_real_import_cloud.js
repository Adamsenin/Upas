import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';
import fs from 'fs';

async function testRealCloud() {
  console.log('--- TEST REAL SUPABASE CLOUD ---');
  console.log('URL:', SUPABASE_URL);

  // 1. Probe actual columns via REST
  const kandidat = [
    'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d',
    'kuis_id', 'kamus_id', 'gambar_path'
  ];
  const set = new Set([
    'id', 'urutan', 'teks', 'tipe', 'bab', 'tingkat_kesulitan',
    'penjelasan', 'poin', 'waktu_detik'
  ]);

  for (const c of kandidat) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/soal?select=${c}&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (res.ok) {
      set.add(c);
    }
  }

  console.log('Actual DB columns in cloud:', Array.from(set));

  // 2. Build payload without kamus_id
  const payload = {
    urutan: 9999,
    teks: 'Uji Coba Otomatis Validasi Impor Cloud',
    tipe: 'pilihan_ganda',
    bab: 'Bab 1: Rantai Makanan',
    tingkat_kesulitan: 'mudah',
    penjelasan: 'Soal verifikasi sistem.',
    waktu_detik: 30,
    poin: 10
  };

  if (set.has('opsi')) {
    payload.opsi = ['A', 'B', 'C', 'D'];
  }
  if (set.has('opsi_a')) {
    payload.opsi_a = 'A';
    payload.opsi_b = 'B';
    payload.opsi_c = 'C';
    payload.opsi_d = 'D';
  }
  if (set.has('kuis_id')) {
    payload.kuis_id = '11111111-1111-1111-1111-111111111111';
  }
  if (set.has('kamus_id')) {
    // Only if present
    // payload.kamus_id = ...
  }

  console.log('Sending payload to cloud:', payload);

  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/soal`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  const body = await insertRes.json();
  console.log('Insert status:', insertRes.status);
  console.log('Insert response:', body);

  if (insertRes.ok && body && body[0]?.id) {
    console.log('Insert SUCCEEDED! Cleaning up test record...');
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/soal?id=eq.${body[0].id}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    console.log('Delete status:', delRes.status);
  }
}

testRealCloud().catch(console.error);

