import fs from 'fs';

// 1. Clean emojis in guru/dasbor.html
let dasbor = fs.readFileSync('guru/dasbor.html', 'utf8');

dasbor = dasbor.replace(
  '<h2 class="h5 fw-bolder mb-0">📥 Rekapitulasi & Ekspor Nilai Siswa</h2>',
  `<h2 class="h5 fw-bolder mb-0 d-inline-flex align-items-center gap-2">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    <span>Rekapitulasi & Ekspor Nilai Siswa</span>
  </h2>`
);

dasbor = dasbor.replace(
  '<h2 class="h5 fw-bolder mb-0">🗂️ Bank Soal IPAS Terpadu</h2>',
  `<h2 class="h5 fw-bolder mb-0 d-inline-flex align-items-center gap-2">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    <span>Bank Soal IPAS Terpadu</span>
  </h2>`
);

dasbor = dasbor.replace(
  '<h2 class="h5 fw-bolder mb-0">📜 Rekap Sertifikat "Penyelamat Ekosistem" Murid</h2>',
  `<h2 class="h5 fw-bolder mb-0 d-inline-flex align-items-center gap-2">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 3h16v6a8 8 0 0 1-16 0V3z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
    <span>Rekap Sertifikat "Penyelamat Ekosistem" Murid</span>
  </h2>`
);

fs.writeFileSync('guru/dasbor.html', dasbor, 'utf8');
console.log('guru/dasbor.html emojis replaced with SVG!');

// 2. Clean emoji in sertifikat.html
let sertifikat = fs.readFileSync('sertifikat.html', 'utf8');
sertifikat = sertifikat.replace(
  '<span class="fs-4" aria-hidden="true">📜</span>',
  `<span class="d-inline-flex align-items-center justify-content-center p-2 rounded-circle" style="background: rgba(35, 112, 138, 0.12);" aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#23708A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 3h16v6a8 8 0 0 1-16 0V3z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
  </span>`
);
fs.writeFileSync('sertifikat.html', sertifikat, 'utf8');
console.log('sertifikat.html emoji replaced with SVG!');

// 3. Clean emoji in assets/js/rantai-makanan.js
let rantai = fs.readFileSync('assets/js/rantai-makanan.js', 'utf8');
rantai = rantai.replace(
  '<span class="fs-1 d-block anim-melambai" style="line-height: 1;">☀️</span>',
  `<span class="d-inline-flex align-items-center justify-content-center anim-melambai" style="width: 44px; height: 44px;" aria-hidden="true">
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none"><circle cx="24" cy="24" r="11" fill="#FEF08A" stroke="#B45309" stroke-width="2.5"/><path d="M24 4V10M24 38V44M4 24H10M38 24H44M9.86 9.86L14.1 14.1M33.9 33.9L38.14 38.14M9.86 38.14L14.1 33.9M33.9 14.1L38.14 9.86" stroke="#B45309" stroke-width="3" stroke-linecap="round"/></svg>
  </span>`
);
fs.writeFileSync('assets/js/rantai-makanan.js', rantai, 'utf8');
console.log('rantai-makanan.js emoji replaced with SVG!');

