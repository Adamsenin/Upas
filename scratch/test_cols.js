import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function testSelectColumns() {
  const cols = ['id', 'urutan', 'teks', 'tipe', 'opsi', 'bab', 'tingkat_kesulitan', 'kuis_id', 'penjelasan', 'poin', 'waktu_detik'];
  for (const c of cols) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/soal?select=${c}&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      console.log(`Column '${c}': ❌ DOES NOT EXIST (${data.code}: ${data.message})`);
    } else {
      console.log(`Column '${c}': ✅ EXISTS`);
    }
  }
}

testSelectColumns();

