import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function testDetectCols() {
  const set = new Set();
  const kandidat = [
    'id', 'urutan', 'teks', 'tipe', 'bab', 'tingkat_kesulitan',
    'penjelasan', 'poin', 'waktu_detik', 'gambar_path',
    'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d',
    'kuis_id', 'kamus_id', 'kunci'
  ];
  
  for (const col of kandidat) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/soal?select=${col}&limit=1`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
      });
      if (res.ok) {
        set.add(col);
      }
    } catch (e) {}
  }

  console.log('Detected available columns on user Supabase table:');
  console.log(Array.from(set));
}

testDetectCols();

