import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock browser globals
globalThis.window = globalThis;
const store = new Map();
globalThis.localStorage = {
  getItem(k) { return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
  clear() { store.clear(); }
};
globalThis.BroadcastChannel = class {
  constructor(name) { this.name = name; }
  postMessage() {}
  close() {}
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCloudImport30() {
  console.log('Testing full import of 30 questions against Supabase cloud...');
  const { kuisManager, parseCSVKeObjek } = await import('../assets/js/kuis.js');
  const { supabase } = await import('../assets/js/supabase.js');

  const csvContent = fs.readFileSync(path.join(__dirname, '30_soal_ipas_kelas5.csv'), 'utf-8');
  const rows = parseCSVKeObjek(csvContent);
  console.log(`Parsed ${rows.length} rows from CSV.`);

  // First, check how many questions currently exist in Supabase
  const { data: initialSoal, error: errCount } = await supabase.from('soal').select('id, urutan');
  console.log('Initial questions in DB:', initialSoal?.length, 'Error:', errCount?.message);

  const targetKuisId = '11111111-1111-1111-1111-111111111111';
  console.log('Calling kuisManager.imporSoalMassal...');
  const startTime = Date.now();
  try {
    const importedCount = await kuisManager.imporSoalMassal(targetKuisId, rows);
    console.log(`SUCCESS! Imported ${importedCount} questions in ${Date.now() - startTime}ms`);
  } catch (err) {
    console.error('FAILED TO IMPORT:', err);
  }

  const { data: afterSoal } = await supabase.from('soal').select('id, urutan').order('urutan', { ascending: true });
  console.log('Total questions in DB after import:', afterSoal?.length);
}

testCloudImport30();

