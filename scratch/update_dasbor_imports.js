import fs from 'fs';

// 1. Update assets/js/dasbor-guru.js
let dasborJs = fs.readFileSync('assets/js/dasbor-guru.js', 'utf8');
dasborJs = dasborJs.replace(
  "import { kuisManager } from './kuis.js?v=4.0.4';",
  `import { kuisManager, ambilKolomTabelSoal, buatPayloadSoalAdaptif, normalisasiKunciJawaban } from './kuis.js?v=4.2.0';

if (typeof window !== 'undefined') {
  window.kuisManager = kuisManager;
  window.ambilKolomTabelSoal = ambilKolomTabelSoal;
  window.buatPayloadSoalAdaptif = buatPayloadSoalAdaptif;
  window.normalisasiKunciJawaban = normalisasiKunciJawaban;
}`
);
fs.writeFileSync('assets/js/dasbor-guru.js', dasborJs, 'utf8');
console.log('Updated assets/js/dasbor-guru.js');

// 2. Update guru/dasbor.html
let dasborHtml = fs.readFileSync('guru/dasbor.html', 'utf8');
dasborHtml = dasborHtml.replace(
  "import { inisialisasiDasborGuru } from '../assets/js/dasbor-guru.js?v=4.0.4';",
  "import { inisialisasiDasborGuru } from '../assets/js/dasbor-guru.js?v=4.2.0';"
);
fs.writeFileSync('guru/dasbor.html', dasborHtml, 'utf8');
console.log('Updated guru/dasbor.html');

