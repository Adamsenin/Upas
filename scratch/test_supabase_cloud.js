import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

console.log('Connecting to Supabase Cloud:', SUPABASE_URL);

async function checkTables() {
  const tables = ['soal', 'soal_kunci', 'kuis', 'profil', 'kelas', 'siswa_terdaftar', 'kamus'];
  for (const t of tables) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${t}?select=*&limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        console.log(`Table '${t}': ❌ [${res.status}] -> ${data.code}: ${data.message}`);
      } else {
        console.log(`Table '${t}': ✅ [${res.status} OK] -> ${data.length} row(s) returned`);
      }
    } catch (e) {
      console.log(`Table '${t}': ❌ Network error:`, e.message);
    }
  }
}

checkTables();
