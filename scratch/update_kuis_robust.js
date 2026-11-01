import fs from 'fs';
import path from 'path';

const kuisPath = path.resolve('assets/js/kuis.js');
let content = fs.readFileSync(kuisPath, 'utf-8');

// 1. Helper isUUID & resetCacheKolomSoal
const helperBlockOld = `let cacheKolomSoal = null;

/**
 * Deteksi kolom yang benar-benar ada pada tabel public.soal di Supabase
 * Mencegah PostgREST schema cache rejection (misal: kamus_id atau opsi vs opsi_a..d)
 */
export async function ambilKolomTabelSoal() {`;

const helperBlockNew = `export function isUUID(val) {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

let cacheKolomSoal = null;

export function resetCacheKolomSoal() {
  cacheKolomSoal = null;
}

/**
 * Deteksi kolom yang benar-benar ada pada tabel public.soal di Supabase
 * Mencegah PostgREST schema cache rejection (misal: kamus_id atau opsi vs opsi_a..d)
 */
export async function ambilKolomTabelSoal() {`;

content = content.replace(helperBlockOld, helperBlockNew);

// 2. buatPayloadSoalAdaptif sanitization
const payloadOld = `  // kuis_id (hanya jika kolom tersedia di DB)
  if (kolomTersedia.has('kuis_id') && kuisIdTarget) {
    payload.kuis_id = kuisIdTarget;
  }

  // kamus_id: JANGAN kirim jika kolom tidak ada di DB!
  if (kolomTersedia.has('kamus_id') && soalData.kamus_id) {
    payload.kamus_id = soalData.kamus_id;
  }

  // gambar_path (hanya jika kolom tersedia di DB)
  if (kolomTersedia.has('gambar_path') && soalData.gambar_path) {
    payload.gambar_path = soalData.gambar_path;
  }

  // Kolom kunci jika tabel soal memiliki kolom kunci (legacy/compatibility)
  const nilaiKunci = soalData.kunci !== undefined ? soalData.kunci : kunciJawaban;
  if (kolomTersedia.has('kunci') && nilaiKunci !== null && nilaiKunci !== undefined) {
    payload.kunci = String(nilaiKunci);
  }`;

const payloadNew = `  // kuis_id (hanya jika kolom tersedia di DB dan UUID valid)
  if (kolomTersedia.has('kuis_id') && kuisIdTarget && isUUID(kuisIdTarget)) {
    payload.kuis_id = kuisIdTarget.trim();
  }

  // kamus_id: JANGAN kirim jika bukan UUID valid atau kolom tidak ada di DB!
  if (kolomTersedia.has('kamus_id') && soalData.kamus_id && isUUID(soalData.kamus_id)) {
    payload.kamus_id = soalData.kamus_id.trim();
  }

  // gambar_path (hanya jika kolom tersedia di DB)
  if (kolomTersedia.has('gambar_path') && soalData.gambar_path) {
    payload.gambar_path = soalData.gambar_path;
  }

  // Kolom kunci jika tabel soal memiliki kolom kunci (legacy/compatibility)
  const nilaiKunci = soalData.kunci !== undefined ? soalData.kunci : kunciJawaban;
  if (kolomTersedia.has('kunci') && nilaiKunci !== null && nilaiKunci !== undefined) {
    const num = parseInt(nilaiKunci, 10);
    payload.kunci = isNaN(num) ? String(nilaiKunci) : num;
  }`;

content = content.replace(payloadOld, payloadNew);

// 3. validasiDanSiapkanSoal kamus_id sanitization
content = content.replace(
  "kamus_id: row.kamus_id || null",
  "kamus_id: (row.kamus_id && isUUID(row.kamus_id)) ? row.kamus_id.trim() : null"
);

// 4. Tambahkan simpanSoalAdaptif sebelum kuisManager
const simpanAdaptifFunc = `/**
 * Eksekusi penyimpanan soal dengan perulangan adaptif swa-pulih (self-healing retry loop)
 * Mampu mengatasi secara otomatis:
 * - PostgREST schema cache rejection (Could not find the '...' column)
 * - Constraint NOT NULL pada kolom 'kunci'
 * - Invalid UUID syntax pada 'kamus_id' atau 'kuis_id'
 * - Pelanggaran Foreign Key constraint
 */
export async function simpanSoalAdaptif(supabaseClient, payloadAwal, rawKunci, kolomTersedia, updateId = null) {
  let payload = { ...payloadAwal };
  let attempts = 0;
  const maxAttempts = 6;

  // Sanitasi awal kamus_id & kuis_id
  if ('kamus_id' in payload && (!payload.kamus_id || !isUUID(payload.kamus_id))) {
    delete payload.kamus_id;
  }
  if ('kuis_id' in payload && (!payload.kuis_id || !isUUID(payload.kuis_id))) {
    delete payload.kuis_id;
  }

  // Jika kolom 'kunci' terdeteksi, pastikan disiapkan
  if (kolomTersedia.has('kunci') && !('kunci' in payload) && rawKunci !== undefined && rawKunci !== null) {
    const num = parseInt(rawKunci, 10);
    payload.kunci = isNaN(num) ? 0 : num;
  }

  while (attempts < maxAttempts) {
    attempts++;
    let res;
    if (updateId) {
      res = await supabaseClient.from('soal').update(payload).eq('id', updateId).select();
    } else {
      res = await supabaseClient.from('soal').insert(payload).select();
    }

    if (!res.error) {
      return res;
    }

    const errMsg = (res.error.message || JSON.stringify(res.error || '')).toLowerCase();

    // 1. Column missing in PostgREST schema cache: "Could not find the 'X' column..."
    if (errMsg.includes("could not find the '") && errMsg.includes("column")) {
      const match = errMsg.match(/could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingCol = match[1];
        console.warn(\`[Adaptif DB] Menghapus kolom "\${missingCol}" yang tidak ada di schema cache PostgREST lalu mencoba kembali...\`);
        kolomTersedia.delete(missingCol);
        delete payload[missingCol];
        continue;
      }
    }

    // 2. Column "kunci" violates NOT NULL constraint
    if (errMsg.includes('column "kunci"') && (errMsg.includes('not-null') || errMsg.includes('violates'))) {
      console.warn('[Adaptif DB] Kolom "kunci" bertipe NOT NULL di database. Menambahkan nilai kunci default/normalisasi...');
      kolomTersedia.add('kunci');
      const numKunci = parseInt(rawKunci ?? 0, 10);
      payload.kunci = isNaN(numKunci) ? 0 : numKunci;
      continue;
    }

    // 3. Invalid UUID syntax (misal 'kamus-1' pada kolom uuid)
    if (errMsg.includes('invalid input syntax for type uuid')) {
      if ('kamus_id' in payload && !isUUID(payload.kamus_id)) {
        console.warn(\`[Adaptif DB] Nilai kamus_id bukan format UUID valid ("\${payload.kamus_id}"). Menghapus kolom dari payload...\`);
        delete payload.kamus_id;
        continue;
      }
      if ('kuis_id' in payload && !isUUID(payload.kuis_id)) {
        console.warn(\`[Adaptif DB] Nilai kuis_id bukan format UUID valid ("\${payload.kuis_id}"). Menghapus kolom dari payload...\`);
        kolomTersedia.delete('kuis_id');
        delete payload.kuis_id;
        continue;
      }
    }

    // 4. Foreign key constraint
    if (errMsg.includes('foreign key constraint') || errMsg.includes('violates foreign key')) {
      if (errMsg.includes('kamus_id') && 'kamus_id' in payload) {
        console.warn('[Adaptif DB] FK kamus_id tidak valid di database. Menghapus kamus_id...');
        delete payload.kamus_id;
        continue;
      }
      if (errMsg.includes('kuis_id') && 'kuis_id' in payload) {
        console.warn('[Adaptif DB] FK kuis_id tidak valid di database. Menghapus kuis_id...');
        kolomTersedia.delete('kuis_id');
        delete payload.kuis_id;
        continue;
      }
    }

    // 5. Izin ditolak
    if (errMsg.includes('permission denied')) {
      throw new Error("Izin database ditolak (permission denied). Silakan jalankan file SQL '20261101_perbaikan_akses_dan_kamus.sql' di SQL Editor Supabase untuk memberikan hak akses tabel soal.");
    }

    // Tidak ada recovery yang cocok, kembalikan res untuk penanganan error akhir
    return res;
  }

  return { error: new Error('Percobaan adaptif penyimpanan soal melebihi batas maksimum (6x).') };
}

export const kuisManager = {`;

content = content.replace("export const kuisManager = {", simpanAdaptifFunc);

// 5. Update simpanSoal in kuisManager
const simpanSoalOld = `  async simpanSoal(kuisId, soalData, kunciJawaban) {
    const kolomTersedia = await ambilKolomTabelSoal();
    let payload = buatPayloadSoalAdaptif(soalData, kuisId || soalData.kuis_id, kolomTersedia, kunciJawaban);
    let soalId = soalData.id;

    if (soalId) {
      let resUpdate = await supabase
        .from('soal')
        .update(payload)
        .eq('id', soalId);

      // Penanganan otomatis jika kolom kunci dituntut di DB
      if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes('column "kunci" of relation "soal"')) {
        kolomTersedia.add('kunci');
        payload.kunci = String(kunciJawaban ?? soalData.kunci ?? '0');
        resUpdate = await supabase.from('soal').update(payload).eq('id', soalId);
      }

      // Penanganan otomatis jika ada kolom yang tidak ada di schema cache
      if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes("Could not find the '")) {
        const match = resUpdate.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          kolomTersedia.delete(match[1]);
          delete payload[match[1]];
          resUpdate = await supabase.from('soal').update(payload).eq('id', soalId);
        }
      }
      if (resUpdate.error) throw resUpdate.error;
    } else {
      let resInsert = await supabase
        .from('soal')
        .insert(payload)
        .select();

      // Penanganan otomatis jika kolom kunci dituntut di DB
      if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('column "kunci" of relation "soal"')) {
        kolomTersedia.add('kunci');
        payload.kunci = String(kunciJawaban ?? soalData.kunci ?? '0');
        resInsert = await supabase.from('soal').insert(payload).select();
      }

      if (resInsert.error && resInsert.error.message && resInsert.error.message.includes("Could not find the '")) {
        const match = resInsert.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          kolomTersedia.delete(match[1]);
          delete payload[match[1]];
          resInsert = await supabase.from('soal').insert(payload).select();
        }
      }
      if (resInsert.error) throw resInsert.error;
      soalId = resInsert.data?.[0]?.id;
    }`;

const simpanSoalNew = `  async simpanSoal(kuisId, soalData, kunciJawaban) {
    const getKolom = (typeof ambilKolomTabelSoal === 'function') ? ambilKolomTabelSoal : (this.ambilKolomTabelSoal || window.ambilKolomTabelSoal);
    const kolomTersedia = await getKolom();
    let payload = buatPayloadSoalAdaptif(soalData, kuisId || soalData.kuis_id, kolomTersedia, kunciJawaban);
    let soalId = soalData.id;

    const res = await simpanSoalAdaptif(supabase, payload, kunciJawaban ?? soalData.kunci, kolomTersedia, soalId);
    if (res.error) throw res.error;
    soalId = soalId || res.data?.[0]?.id;`;

content = content.replace(simpanSoalOld, simpanSoalNew);

// 6. Update imporSoalMassal insertion loop
const imporLoopOld = `      for (const item of itemTervalidasi) {
        let payload = buatPayloadSoalAdaptif(item.soalPayload, idKuisFinal, kolomTersedia, item.kunci);
        if (kolomTersedia.has('kunci')) {
          payload.kunci = String(item.kunci ?? '0');
        }

        let resInsert = await supabase
          .from('soal')
          .insert(payload)
          .select();

        // Penanganan otomatis jika kolom "kunci" memiliki constraint NOT NULL di DB
        if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('column "kunci" of relation "soal"')) {
          kolomTersedia.add('kunci');
          payload.kunci = String(item.kunci ?? '0');
          resInsert = await supabase.from('soal').insert(payload).select();
        }

        // Penanganan otomatis jika ada kolom yang ditolak oleh PostgREST schema cache
        if (resInsert.error && resInsert.error.message && resInsert.error.message.includes("Could not find the '")) {
          const match = resInsert.error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const badCol = match[1];
            console.warn(\`Menghapus kolom "\${badCol}" yang tidak ada di schema cache lalu mencoba kembali.\`);
            kolomTersedia.delete(badCol);
            delete payload[badCol];
            resInsert = await supabase.from('soal').insert(payload).select();
          }
        }

        if (resInsert.error) {
          if (resInsert.error.message && resInsert.error.message.toLowerCase().includes('permission denied')) {
            throw new Error(\`Izin database ditolak (permission denied). Silakan jalankan file SQL '20261101_perbaikan_akses_dan_kamus.sql' di SQL Editor Supabase untuk memberikan hak akses tabel soal.\`);
          }
          throw new Error(\`Gagal menyimpan butir soal urutan #\${payload.urutan}: \${resInsert.error.message}\`);
        }

        const createdId = resInsert.data?.[0]?.id || ('soal-imp-' + Math.random().toString(36).substr(2, 9));
        idSoalTerbuat.push(createdId);`;

const imporLoopNew = `      for (const item of itemTervalidasi) {
        let payload = buatPayloadSoalAdaptif(item.soalPayload, idKuisFinal, kolomTersedia, item.kunci);

        const resInsert = await simpanSoalAdaptif(supabase, payload, item.kunci, kolomTersedia);

        if (resInsert.error) {
          throw new Error(\`Gagal menyimpan butir soal urutan #\${payload.urutan}: \${resInsert.error.message || JSON.stringify(resInsert.error)}\`);
        }

        const createdId = resInsert.data?.[0]?.id || ('soal-imp-' + Math.random().toString(36).substr(2, 9));
        idSoalTerbuat.push(createdId);`;

content = content.replace(imporLoopOld, imporLoopNew);

// 7. Update exports & window globals
const endWindowOld = `if (typeof window !== 'undefined') {
  window.kuisManager = kuisManager;
  window.ambilKolomTabelSoal = ambilKolomTabelSoal;
  window.buatPayloadSoalAdaptif = buatPayloadSoalAdaptif;
}`;

const endWindowNew = `// Hubungkan fungsi adaptif ke kuisManager
kuisManager.ambilKolomTabelSoal = ambilKolomTabelSoal;
kuisManager.buatPayloadSoalAdaptif = buatPayloadSoalAdaptif;
kuisManager.simpanSoalAdaptif = simpanSoalAdaptif;
kuisManager.isUUID = isUUID;
kuisManager.resetCacheKolomSoal = resetCacheKolomSoal;

if (typeof window !== 'undefined') {
  window.kuisManager = kuisManager;
  window.ambilKolomTabelSoal = ambilKolomTabelSoal;
  window.buatPayloadSoalAdaptif = buatPayloadSoalAdaptif;
  window.simpanSoalAdaptif = simpanSoalAdaptif;
  window.normalisasiKunciJawaban = normalisasiKunciJawaban;
  window.parseCSVKeObjek = parseCSVKeObjek;
  window.isUUID = isUUID;
}`;

content = content.replace(endWindowOld, endWindowNew);

fs.writeFileSync(kuisPath, content, 'utf-8');
console.log('Successfully updated assets/js/kuis.js with unbreakable adaptive engine!');
