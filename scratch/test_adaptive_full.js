import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function testAdaptive() {
  const kandidat = [
    'id', 'urutan', 'teks', 'tipe', 'bab', 'tingkat_kesulitan',
    'penjelasan', 'poin', 'waktu_detik', 'gambar_path',
    'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d',
    'kuis_id', 'kamus_id', 'kunci'
  ];
  
  const set = new Set();
  for (const col of kandidat) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/soal?select=${col}&limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (res.ok) set.add(col);
    } catch (e) {}
  }
  console.log('Kolom terdeteksi:', Array.from(set));

  // Buat payload adaptif
  const rawItem = {
    urutan: 1,
    teks: 'Tes soal IPAS adaptif',
    tipe: 'pilihan_ganda',
    bab: 'Bab 1: Rantai Makanan',
    tingkat_kesulitan: 'mudah',
    opsi: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
    penjelasan: 'Pembahasan tes',
    waktu_detik: 30,
    poin: 10,
    kamus_id: null
  };

  const payload = {
    urutan: rawItem.urutan,
    teks: rawItem.teks,
    tipe: rawItem.tipe,
    bab: rawItem.bab,
    tingkat_kesulitan: rawItem.tingkat_kesulitan,
    penjelasan: rawItem.penjelasan,
    waktu_detik: rawItem.waktu_detik,
    poin: rawItem.poin
  };

  if (set.has('opsi')) payload.opsi = rawItem.opsi;
  if (set.has('opsi_a')) {
    payload.opsi_a = rawItem.opsi[0] || '';
    payload.opsi_b = rawItem.opsi[1] || '';
    payload.opsi_c = rawItem.opsi[2] || '';
    payload.opsi_d = rawItem.opsi[3] || '';
  }
  if (set.has('kuis_id')) {
    payload.kuis_id = '11111111-1111-1111-1111-111111111111';
  }
  if (set.has('kamus_id') && rawItem.kamus_id) {
    payload.kamus_id = rawItem.kamus_id;
  }

  console.log('Generated adaptive payload:', payload);
}

testAdaptive();

