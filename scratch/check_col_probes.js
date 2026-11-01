import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function checkColumns() {
  const kandidat = [
    'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d',
    'kuis_id', 'kamus_id', 'gambar_path', 'kunci'
  ];

  for (const c of kandidat) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/soal?select=${c}&limit=1`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const text = await res.text();
    console.log(`Column ${c}: status=${res.status}, ok=${res.ok}, body=${text}`);
  }
}

checkColumns();
