import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../assets/js/config.js';

async function listDefinitions() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const spec = await res.json();
  console.log('Definitions in OpenAPI spec:', Object.keys(spec.definitions || {}));
  console.log('Paths in OpenAPI spec:', Object.keys(spec.paths || {}));
}

listDefinitions();

