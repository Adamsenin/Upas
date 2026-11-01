import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

globalThis.window = globalThis;
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, val) { store.set(key, String(val)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); }
  };
}
if (typeof globalThis.BroadcastChannel === 'undefined') {
  globalThis.BroadcastChannel = class {
    constructor(name) { this.name = name; }
    postMessage() {}
    close() {}
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testActualImport() {
  const { kuisManager, parseCSVKeObjek, ambilKolomTabelSoal } = await import('../assets/js/kuis.js');
  const { supabase } = await import('../assets/js/supabase.js');

  console.log('Testing ambilKolomTabelSoal()...');
  const cols = await ambilKolomTabelSoal();
  console.log('Detected cols in kuis.js:', Array.from(cols));

  const csvRaw = fs.readFileSync(path.join(__dirname, '30_soal_ipas_kelas5.csv'), 'utf-8');
  const rows = parseCSVKeObjek(csvRaw);
  console.log('Parsed rows:', rows.length);

  try {
    // Test importing 1 question
    const testRows = rows.slice(0, 1);
    console.log('Importing 1 question with target kuis-ekosistem-1...');
    const result = await kuisManager.imporSoalMassal('11111111-1111-1111-1111-111111111111', testRows);
    console.log('Import successful! Rows imported:', result);
  } catch (err) {
    console.error('Import FAILED with error:', err);
  }
}

testActualImport();
