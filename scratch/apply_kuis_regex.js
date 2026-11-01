import fs from 'fs';
import path from 'path';

const kuisPath = path.resolve('assets/js/kuis.js');
let raw = fs.readFileSync(kuisPath, 'utf-8');
const isCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

// 1. isUUID & resetCacheKolomSoal
if (!content.includes('export function isUUID')) {
  content = content.replace(
    'let cacheKolomSoal = null;',
    `export function isUUID(val) {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());
}

let cacheKolomSoal = null;

export function resetCacheKolomSoal() {
  cacheKolomSoal = null;
}`
  );
}

// 2. buatPayloadSoalAdaptif
const oldPayloadPattern = /\/\/ kuis_id \(hanya jika kolom tersedia di DB\)[\s\S]*?payload\.kuis_id = kuisIdTarget;[\s\S]*?payload\.kamus_id = soalData\.kamus_id;[\s\S]*?payload\.gambar_path = soalData\.gambar_path;[\s\S]*?payload\.kunci = String\(nilaiKunci\);[\s\S]*?}/;

const newPayloadBlock = `// kuis_id (hanya jika kolom tersedia di DB dan UUID valid)
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
  }

  return payload;
}`;

content = content.replace(oldPayloadPattern, newPayloadBlock);

// 3. simpanSoal in kuisManager
const oldSimpanSoalPattern = /async simpanSoal\(kuisId, soalData, kunciJawaban\) \{[\s\S]*?soalId = resInsert\.data\?\.\[0\]\?\.id;\s*\}/;

const newSimpanSoalBlock = `async simpanSoal(kuisId, soalData, kunciJawaban) {
    const getKolom = (typeof ambilKolomTabelSoal === 'function') ? ambilKolomTabelSoal : (this.ambilKolomTabelSoal || window.ambilKolomTabelSoal);
    const kolomTersedia = await getKolom();
    let payload = buatPayloadSoalAdaptif(soalData, kuisId || soalData.kuis_id, kolomTersedia, kunciJawaban);
    let soalId = soalData.id;

    const res = await simpanSoalAdaptif(supabase, payload, kunciJawaban ?? soalData.kunci, kolomTersedia, soalId);
    if (res.error) throw res.error;
    soalId = soalId || res.data?.[0]?.id;
  }`;

content = content.replace(oldSimpanSoalPattern, newSimpanSoalBlock);

// 4. imporSoalMassal insertion loop
const oldLoopPattern = /for \(const item of itemTervalidasi\) \{[\s\S]*?let payload = buatPayloadSoalAdaptif[\s\S]*?idSoalTerbuat\.push\(createdId\);/;

const newLoopBlock = `for (const item of itemTervalidasi) {
        let payload = buatPayloadSoalAdaptif(item.soalPayload, idKuisFinal, kolomTersedia, item.kunci);

        const resInsert = await simpanSoalAdaptif(supabase, payload, item.kunci, kolomTersedia);

        if (resInsert.error) {
          throw new Error(\`Gagal menyimpan butir soal urutan #\${payload.urutan}: \${resInsert.error.message || JSON.stringify(resInsert.error)}\`);
        }

        const createdId = resInsert.data?.[0]?.id || ('soal-imp-' + Math.random().toString(36).substr(2, 9));
        idSoalTerbuat.push(createdId);`;

content = content.replace(oldLoopPattern, newLoopBlock);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(kuisPath, content, 'utf-8');
console.log('Clean regex replacement complete.');
