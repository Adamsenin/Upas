import fs from 'fs';
import path from 'path';

// Helper link stylesheet
function linkStylesheet(filePath, href) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(href)) {
    content = content.replace(
      /(<link rel="stylesheet" href="[^"]*komponen\.css">)/,
      `$1\n  <link rel="stylesheet" href="${href}">`
    );
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Linked ${href} in ${filePath}`);
  }
}

// 1. Link petualangan-siswa.css to student pages
const studentPages = [
  'rantai-makanan.html',
  'siklus-air.html',
  'fakta-opini.html',
  'kamus-belajar.html',
  'sertifikat.html',
  'gabung.html'
];
studentPages.forEach(p => linkStylesheet(p, 'assets/css/petualangan-siswa.css'));
linkStylesheet('siswa/main.html', '../assets/css/petualangan-siswa.css');

// 2. Link dasbor-saas-guru.css to teacher pages
const teacherPages = [
  'guru/dasbor.html',
  'guru/editor.html',
  'guru/kamus.html',
  'guru/sesi.html',
  'guru/masuk.html'
];
teacherPages.forEach(p => linkStylesheet(p, '../assets/css/dasbor-saas-guru.css'));

// 3. SVG icons mapping
const SVG_ICONS = {
  gear: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  flame: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#F59E0B" stroke="#B45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 17c1.38 0 2.5-1.12 2.5-2.5 0-1.63-1.04-2.45-1.74-3.5C11.13 9.94 11 8.87 11 8c0 1-1.5 2-2 3.5-.47 1.4-.5 2.1-.5 3z"/><path d="M12 2c1 3 4 4.5 4 9a6 6 0 1 1-12 0c0-3.5 3-6.5 4-8.5.5 1.5 1.5 2 2 2 1-1 1.5-2 2-2.5z"/></svg>`,
  trophy: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#F59E0B" stroke="#B45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 3h16v6a8 8 0 0 1-16 0V3z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>`,
  disk: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
  rocket: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>`,
  books: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  signal: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#23708A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.93 19.07A10 10 0 0 1 19.07 4.93"/><path d="M7.76 16.24a6 6 0 0 1 8.48-8.48"/><circle cx="12" cy="12" r="2"/></svg>`,
  chartUp: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2E7D4F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  barChart: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  gradCap: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#23708A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
  alertBell: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#B3412E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  trayIn: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  trayOut: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  school: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#23708A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  target: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#F2A541" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  leaf: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2E7D4F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  shuffle: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.2V16a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2.8c1.79-1.04 3-2.98 3-5.2a6 6 0 0 0-6-6z"/><line x1="9" y1="21" x2="15" y2="21"/></svg>`,
  home: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>`,
  medal: `<svg viewBox="0 0 24 24" width="18" height="18" fill="#F59E0B" stroke="#B45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  crown: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#FBBF24" stroke="#B45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
  lightning: `<svg viewBox="0 0 24 24" width="16" height="16" fill="#F59E0B" stroke="#B45309" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>`,
  book: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
};

// 4. Update guru/editor.html
let ed = fs.readFileSync('guru/editor.html', 'utf8');
ed = ed.replace('💾 Simpan Kuis', `${SVG_ICONS.disk} <span>Simpan Kuis</span>`);
ed = ed.replace('<span>🚀</span>', SVG_ICONS.rocket);
ed = ed.replace('<span>📚</span>', SVG_ICONS.books);
ed = ed.replace('<span class="fs-3" aria-hidden="true">📚</span>', `<span class="d-inline-flex p-2 rounded-circle" style="background:rgba(35,112,138,0.12);">${SVG_ICONS.books}</span>`);
ed = ed.replace('placeholder="🔍 Cari', 'placeholder="Cari');
ed = ed.replace('<span class="fs-3 d-block mb-1">📭</span>', `<span class="d-inline-flex p-3 rounded-circle mb-2" style="background:#F1F5F9;">${SVG_ICONS.trayIn}</span>`);
fs.writeFileSync('guru/editor.html', ed, 'utf8');
console.log('Cleaned guru/editor.html emojis');

// 5. Update guru/kamus.html
let km = fs.readFileSync('guru/kamus.html', 'utf8');
km = km.replace('🔍', SVG_ICONS.search);
fs.writeFileSync('guru/kamus.html', km, 'utf8');
console.log('Cleaned guru/kamus.html emojis');

// 6. Update guru/dasbor.html
let db = fs.readFileSync('guru/dasbor.html', 'utf8');
db = db.replace('<span>⚙️</span>', SVG_ICONS.gear);
db = db.replace('📡 Pemantauan', `${SVG_ICONS.signal} Pemantauan`);
db = db.replace('placeholder="🔍 Cari judul', 'placeholder="Cari judul');
db = db.replace('📈 Perkembangan Rata-rata', `${SVG_ICONS.chartUp} Perkembangan Rata-rata`);
db = db.replace('🧑‍🎓 Perkembangan Nilai', `${SVG_ICONS.gradCap} Perkembangan Nilai`);
db = db.replace('🔥 Butir Soal Tersulit', `${SVG_ICONS.flame} Butir Soal Tersulit`);
db = db.replace('🌟 Butir Soal Termudah', `${SVG_ICONS.target} Butir Soal Termudah`);
db = db.replace('🔍 Analisis Butir', `${SVG_ICONS.search} Analisis Butir`);
db = db.replace('🚨 Daftar Remedial', `${SVG_ICONS.alertBell} Daftar Remedial`);
db = db.replace('📥 Template CSV Soal', `${SVG_ICONS.trayIn} <span>Template CSV Soal</span>`);
db = db.replace('📤 Impor Soal (CSV / Excel)', `${SVG_ICONS.trayOut} <span>Impor Soal (CSV / Excel)</span>`);
db = db.replace('placeholder="🔍 Cari pertanyaan', 'placeholder="Cari pertanyaan');
db = db.replace('🏫 Daftar Kelas Anda', `${SVG_ICONS.school} Daftar Kelas Anda`);
db = db.replace('👧👦 Manajemen Siswa', `${SVG_ICONS.gradCap} Manajemen Siswa`);
db = db.replace('placeholder="🔍 Cari nama siswa', 'placeholder="Cari nama siswa');
db = db.replace('<span class="fs-4" aria-hidden="true">🏆</span>', `<span class="d-inline-flex p-2 rounded-circle" style="background:rgba(242,165,65,0.15);">${SVG_ICONS.trophy}</span>`);
db = db.replace('🎯 Kelola Bank Pernyataan', `${SVG_ICONS.target} Kelola Bank Pernyataan`);
db = db.replace('placeholder="🔍 Cari teks', 'placeholder="Cari teks');
db = db.replace('🌿 Skenario Ekosistem', `${SVG_ICONS.leaf} Skenario Ekosistem`);
db = db.replace('⚙️ Parameter Game', `${SVG_ICONS.gear} Parameter Game`);
db = db.replace(/🎯 Formulir Pernyataan/g, `${SVG_ICONS.target} Formulir Pernyataan`);
db = db.replace('⚙️ Pengaturan Kuis', `${SVG_ICONS.gear} Pengaturan Kuis`);
db = db.replace('🔀 Acak Urutan', `${SVG_ICONS.shuffle} Acak Urutan`);
fs.writeFileSync('guru/dasbor.html', db, 'utf8');
console.log('Cleaned guru/dasbor.html emojis');

// 7. Update guru/sesi.html
let se = fs.readFileSync('guru/sesi.html', 'utf8');
se = se.replace('⚙️ Pengaturan Game', `${SVG_ICONS.gear} <span>Pengaturan Game</span>`);
se = se.replace('⚙️ Info Pengaturan', `${SVG_ICONS.gear} <span>Info Pengaturan</span>`);
se = se.replace('📊 Papan Skor Kelas ➔', `${SVG_ICONS.barChart} <span>Papan Skor Kelas</span> ${SVG_ICONS.arrowRight}`);
se = se.replace('🚀 Progres Langsung', `${SVG_ICONS.rocket} Progres Langsung`);
se = se.replace('Lanjut ke Papan Skor ➔', `<span>Lanjut ke Papan Skor</span> ${SVG_ICONS.arrowRight}`);
se = se.replace('📖 Pelajari: -', `${SVG_ICONS.book} <span>Pelajari: -</span>`);
se = se.replace('🥈 2', '2');
se = se.replace('<div class="fs-4 mb-0 anim-bounce" aria-hidden="true">👑</div>', `<div class="mb-0 anim-bounce d-flex justify-content-center" aria-hidden="true">${SVG_ICONS.crown}</div>`);
se = se.replace('🥇 1', '1');
se = se.replace('🥉 3', '3');
se = se.replace('Soal Berikutnya ➔', `<span>Soal Berikutnya</span> ${SVG_ICONS.arrowRight}`);
se = se.replace('Selesaikan Kuis 🏁', `<span>Selesaikan Kuis</span> ${SVG_ICONS.flag}`);
se = se.replace('Petualangan Selesai! 🎉', `Petualangan Selesai!`);
se = se.replace('<span class="fs-1" aria-hidden="true">🎖️</span>', `<span class="d-inline-flex p-3 rounded-circle" style="background:#FEF3C7;">${SVG_ICONS.medal}</span>`);
se = se.replace('📥 Unduh Rekap Hasil (CSV)', `${SVG_ICONS.trayIn} <span>Unduh Rekap Hasil (CSV)</span>`);
se = se.replace('🏠 Kembali ke Dasbor', `${SVG_ICONS.home} <span>Kembali ke Dasbor</span>`);
fs.writeFileSync('guru/sesi.html', se, 'utf8');
console.log('Cleaned guru/sesi.html emojis');

// 8. Update siswa/main.html
let sm = fs.readFileSync('siswa/main.html', 'utf8');
sm = sm.replace('🔥 Streak:', `${SVG_ICONS.flame} Streak:`);
sm = sm.replace('🏆 Skor:', `${SVG_ICONS.trophy} Skor:`);
sm = sm.replace('Kamu Sudah di Lobi! 🎉', 'Kamu Sudah di Lobi!');
sm = sm.replace('💡 Tip Aksesibilitas:', `${SVG_ICONS.bulb} Tip Aksesibilitas:`);
sm = sm.replace('✏️ Tuliskan Jawaban', `${SVG_ICONS.pencil} Tuliskan Jawaban`);
sm = sm.replace('Kunci Jawaban 🔒', `Kunci Jawaban ${SVG_ICONS.lock}`);
sm = sm.replace('💡 Pembahasan IPAS:', `${SVG_ICONS.bulb} Pembahasan IPAS:`);
sm = sm.replace('📖 Pelajari: -', `${SVG_ICONS.book} Pelajari: -`);
sm = sm.replace('⚡ Lanjut otomatis', `${SVG_ICONS.lightning} Lanjut otomatis`);
sm = sm.replace('Lanjut Sekarang ➔', `<span>Lanjut Sekarang</span> ${SVG_ICONS.arrowRight}`);
sm = sm.replace('🏆 Papan Peringkat Kelas', `${SVG_ICONS.trophy} Papan Peringkat Kelas`);
sm = sm.replace('Petualangan Selesai! 🎉', 'Petualangan Selesai!');
sm = sm.replace('<span class="fs-1" aria-hidden="true">🎖️</span>', `<span class="d-inline-flex p-3 rounded-circle" style="background:#FEF3C7;">${SVG_ICONS.medal}</span>`);
sm = sm.replace('🏆 Buka Sertifikat', `${SVG_ICONS.trophy} Buka Sertifikat`);
sm = sm.replace('📖 Buka Kamus Belajar', `${SVG_ICONS.book} Buka Kamus Belajar`);
sm = sm.replace('🏠 Kembali ke Beranda', `${SVG_ICONS.home} Kembali ke Beranda`);
fs.writeFileSync('siswa/main.html', sm, 'utf8');
console.log('Cleaned siswa/main.html emojis');

console.log('SUCCESS: All stylesheets linked and emojis upgraded to semantic SVGs!');
