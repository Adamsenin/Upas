// Mock browser environment for Node.js test before importing modules
const store = {};
globalThis.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};
globalThis.window = globalThis;

import fs from 'fs';

async function test() {
  const { ambilKolomTabelSoal, buatPayloadSoalAdaptif, parseCSVKeObjek, validasiDanSiapkanSoal } = await import('../assets/js/kuis.js');

  console.log('1. Probing columns against live Supabase...');
  const cols = await ambilKolomTabelSoal();
  console.log('Columns detected:', Array.from(cols));

  console.log('2. Reading CSV...');
  const csv = fs.readFileSync('scratch/30_soal_ipas_kelas5.csv', 'utf8');
  const rows = parseCSVKeObjek(csv);
  console.log('Rows parsed:', rows.length);

  console.log('3. Validating questions...');
  const validated = validasiDanSiapkanSoal(rows, 1);
  console.log('Validated questions:', validated.length);

  console.log('4. Testing first payload generation...');
  const p1 = buatPayloadSoalAdaptif(validated[0].soalPayload, '11111111-1111-1111-1111-111111111111', cols);
  console.log('Payload #1:');
  console.log(JSON.stringify(p1, null, 2));

  if ('kamus_id' in p1 && !cols.has('kamus_id')) {
    console.error('FAIL: kamus_id still in payload even though column does not exist!');
    process.exit(1);
  } else {
    console.log('SUCCESS: kamus_id is correctly omitted from payload!');
  }
}

test().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
