import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function checkColumns() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const spec = await res.json();
  const soalDef = spec.definitions?.soal;
  console.log('Columns in public.soal on Supabase Cloud:');
  if (soalDef) {
    console.log(Object.keys(soalDef.properties));
    console.log(JSON.stringify(soalDef.properties, null, 2));
  } else {
    console.log('No soal definition found in OpenAPI spec.');
  }
}

checkColumns();

