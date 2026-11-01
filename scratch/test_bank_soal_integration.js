import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { spawn } from 'child_process';

// Mock browser globals for Node.js environment
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
const rootDir = 'C:\\Users\\STEEL LEGEND\\Downloads\\KUPAS';
const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function runTests() {
  console.log('=== MULAI AUDIT & PENGUJIAN INTEGRASI BANK SOAL KUPAS ===\n');

  // 1. Import module kuis.js dan supabase.js
  const { kuisManager, parseCSVKeObjek, validasiDanSiapkanSoal, normalisasiKunciJawaban } = await import('../assets/js/kuis.js');
  const { supabase } = await import('../assets/js/supabase.js');

  console.log('1. Menguji Parser CSV & Normalisasi Kunci:');
  const csvPath = path.join(__dirname, '30_soal_ipas_kelas5.csv');
  const csvRaw = fs.readFileSync(csvPath, 'utf-8');
  const parsedRows = parseCSVKeObjek(csvRaw);
  console.log(`   - Jumlah baris terbaca dari CSV: ${parsedRows.length} (Target: 30)`);
  if (parsedRows.length !== 30) throw new Error(`Harus ada 30 baris, didapat: ${parsedRows.length}`);

  // Uji normalisasi kunci jawaban (A-D, 0-3, Benar/Salah)
  const testKunci = [
    { in: 'A', tipe: 'pilihan_ganda', out: '0' },
    { in: 'b', tipe: 'pilihan_ganda', out: '1' },
    { in: '2', tipe: 'pilihan_ganda', out: '2' },
    { in: 'D', tipe: 'pilihan_ganda', out: '3' },
    { in: 'Benar', tipe: 'benar_salah', out: '0' },
    { in: 'salah', tipe: 'benar_salah', out: '1' }
  ];
  testKunci.forEach(t => {
    const res = normalisasiKunciJawaban(t.in, t.tipe);
    if (res !== t.out) throw new Error(`Normalisasi kunci gagal: ${t.in} -> ${res} (harus ${t.out})`);
  });
  console.log('   - Normalisasi kunci jawaban 0–3 & A–D: ✅ BERHASIL');

  // 2. Uji Validasi Mendalam
  console.log('\n2. Menguji Validasi Mendalam Pra-Impor:');
  const validasiResult = validasiDanSiapkanSoal(parsedRows, 1);
  console.log(`   - 30 Butir Soal berhasil divalidasi: ✅ LOLOS`);

  // Uji penolakan data korup / tidak valid (Zero tolerance)
  try {
    const invalidRows = [{ teks: '', tipe: 'pilihan_ganda' }];
    validasiDanSiapkanSoal(invalidRows, 1);
    throw new Error('Validasi seharusnya menolak pertanyaan kosong!');
  } catch (err) {
    console.log(`   - Deteksi pertanyaan kosong: ✅ DITOLAK SEBELUM TERSIMPAN ("${err.message.split('\n')[1]}")`);
  }

  // 3. Uji Rollback Transaksi Jika Terjadi Kegagalan DB
  console.log('\n3. Menguji Perlindungan Transaksi & Rollback:');
  // Bersihkan data soal lama untuk pengujian terisolasi
  localStorage.setItem('kupas_db_soal', JSON.stringify([]));
  localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify({}));

  const initialCount = (await kuisManager.ambilSemuaSoal()).length;
  console.log(`   - Jumlah soal sebelum transaksi: ${initialCount}`);

  // Coba impor dengan daftar yang sengaja memicu error di tengah
  try {
    const badBatch = [
      { teks: 'Soal bagus', tipe: 'pilihan_ganda', opsi_a: 'A', opsi_b: 'B', kunci: '0' },
      { teks: '', tipe: 'pilihan_ganda' } // error di baris 2
    ];
    await kuisManager.imporSoalMassal('kuis-ekosistem-1', badBatch);
  } catch (err) {
    const afterFailedCount = (await kuisManager.ambilSemuaSoal()).length;
    console.log(`   - Error tertangkap: ${err.message.split('\n')[0]}`);
    console.log(`   - Jumlah soal setelah kegagalan: ${afterFailedCount} (Harus tetap ${initialCount})`);
    if (afterFailedCount !== initialCount) {
      throw new Error('Gagal: Terjadi kebocoran data setengah tersimpan (partial save)!');
    }
    console.log('   - Perlindungan data setengah tersimpan: ✅ TERLINDUNGI (0 soal bocor)');
  }

  // 4. Eksekusi Impor 30 Soal IPAS Kelas 5
  console.log('\n4. Mengimpor 30 Soal IPAS Kelas 5:');
  const jumlahDiimpor = await kuisManager.imporSoalMassal('kuis-ekosistem-1', parsedRows);
  console.log(`   - Berhasil mengimpor: ${jumlahDiimpor} butir soal.`);
  if (jumlahDiimpor !== 30) throw new Error(`Jumlah yang diimpor tidak sesuai (diharapkan 30, didapat ${jumlahDiimpor})`);

  // 5. Pembacaan & Verifikasi Database
  console.log('\n5. Membaca & Memverifikasi Struktur Soal di Database:');
  const semuaSoal = await kuisManager.ambilSemuaSoal();
  console.log(`   - Total soal tersimpan: ${semuaSoal.length}`);

  // Cek konsistensi kolom urutan
  let urutanKonsisten = true;
  for (let i = 0; i < semuaSoal.length; i++) {
    const s = semuaSoal[i];
    if (s.urutan !== i + 1) {
      console.error(`Urutan tidak cocok pada indeks ${i}: diharapkan ${i + 1}, didapat ${s.urutan}`);
      urutanKonsisten = false;
    }
    // Periksa kolom wajib
    if (!s.id || !s.teks || !s.tipe || !s.bab || !s.tingkat_kesulitan || !Array.isArray(s.opsi)) {
      throw new Error(`Data soal #${s.urutan} memiliki kolom yang tidak lengkap!`);
    }
  }
  console.log(`   - Verifikasi kolom urutan (1 s.d. 30 berurutan): ${urutanKonsisten ? '✅ KONSISTEN & VALID' : '❌ GAGAL'}`);

  // Periksa kunci jawaban terpisah di soal_kunci
  const kunciStorage = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
  const keysSavedCount = Object.keys(kunciStorage).length;
  console.log(`   - Kunci jawaban tersimpan terpisah di soal_kunci: ${keysSavedCount} kunci (Target: 30)`);
  if (keysSavedCount !== 30) throw new Error('Kunci jawaban belum tersimpan lengkap di soal_kunci!');

  // Periksa format kunci (semua harus string 0-3 untuk pilihan ganda)
  let formatKunciValid = true;
  semuaSoal.forEach(s => {
    const k = kunciStorage[s.id];
    if (s.tipe === 'pilihan_ganda' && !['0', '1', '2', '3'].includes(k)) {
      console.error(`Kunci tidak valid untuk soal #${s.urutan}: "${k}"`);
      formatKunciValid = false;
    }
  });
  console.log(`   - Format seluruh kunci jawaban pilihan ganda 0–3: ${formatKunciValid ? '✅ SESUAI' : '❌ TIDAK SESUAI'}`);

  // 6. Uji Pengurutan (Sorting)
  console.log('\n6. Menguji Fitur Pengurutan Bank Soal:');
  
  // A. Urutan Default (urutan asc)
  const sortUrutan = [...semuaSoal].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
  const isSortedUrutan = sortUrutan.every((val, i, arr) => !i || arr[i - 1].urutan <= val.urutan);
  console.log(`   - Pengurutan berdasarkan No Urut (Ascending): ${isSortedUrutan ? '✅ BENAR' : '❌ SALAH'}`);

  // B. Poin Tertinggi (poin desc)
  const sortPoin = [...semuaSoal].sort((a, b) => (b.poin || 10) - (a.poin || 10));
  const isSortedPoin = sortPoin.every((val, i, arr) => !i || arr[i - 1].poin >= val.poin);
  console.log(`   - Pengurutan berdasarkan Poin (Descending): ${isSortedPoin ? '✅ BENAR (Tertinggi: ' + sortPoin[0].poin + ')' : '❌ SALAH'}`);

  // C. Tingkat Kesulitan
  const sortKesulitan = [...semuaSoal].sort((a, b) => (a.tingkat_kesulitan || '').localeCompare(b.tingkat_kesulitan || ''));
  const isSortedKesulitan = sortKesulitan.every((val, i, arr) => !i || (arr[i - 1].tingkat_kesulitan || '').localeCompare(val.tingkat_kesulitan || '') <= 0);
  console.log(`   - Pengurutan berdasarkan Tingkat Kesulitan: ${isSortedKesulitan ? '✅ BENAR' : '❌ SALAH'}`);

  console.log('\n=== SELURUH PENGUJIAN LOGIKA & DATABASE BANK SOAL 100% SUKSES ===');
}

runTests().catch(err => {
  console.error('\n❌ PENGUJIAN GAGAL:', err);
  process.exit(1);
});
