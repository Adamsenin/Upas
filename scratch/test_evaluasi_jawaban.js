function apakahJawabanBenar(jawabanInput, kunci, opsi = [], tipe = 'pilihan_ganda') {
  if (jawabanInput === null || jawabanInput === undefined || jawabanInput === '-1') return false;
  if (kunci === null || kunci === undefined) return false;

  const rawJwb = String(jawabanInput).trim().toLowerCase();
  const rawKunci = String(kunci).trim().toLowerCase();

  // 1. Kecocokan langsung
  if (rawJwb === rawKunci) return true;

  // 2. Format Benar / Salah
  if (tipe === 'benar_salah') {
    const isBenarJwb = ['0', 'benar', 'true', 'b'].includes(rawJwb);
    const isBenarKunci = ['0', 'benar', 'true', 'b'].includes(rawKunci);
    const isSalahJwb = ['1', 'salah', 'false', 's'].includes(rawJwb);
    const isSalahKunci = ['1', 'salah', 'false', 's'].includes(rawKunci);
    if (isBenarJwb && isBenarKunci) return true;
    if (isSalahJwb && isSalahKunci) return true;
    return false;
  }

  // 3. Mapping index ('0','1','2','3') ke huruf ('a','b','c','d') dan sebaliknya
  const hurufMap = { '0': 'a', '1': 'b', '2': 'c', '3': 'd' };
  if (hurufMap[rawJwb] && hurufMap[rawJwb] === rawKunci) return true;
  if (hurufMap[rawKunci] && hurufMap[rawKunci] === rawJwb) return true;

  // 4. Mapping 1-based index jika ada yang pakai '1'..'4'
  const hurufMap1Based = { '1': 'a', '2': 'b', '3': 'c', '4': 'd' };
  if (hurufMap1Based[rawJwb] && hurufMap1Based[rawJwb] === rawKunci) return true;

  // 5. Pencocokan dengan teks opsi
  if (Array.isArray(opsi) && opsi.length > 0) {
    const idxJwb = parseInt(rawJwb, 10);
    if (!isNaN(idxJwb) && opsi[idxJwb]) {
      const teksOpsiJwb = String(opsi[idxJwb]).trim().toLowerCase();
      if (teksOpsiJwb === rawKunci) return true;
    }
    const idxKunci = parseInt(rawKunci, 10);
    if (!isNaN(idxKunci) && opsi[idxKunci]) {
      const teksOpsiKunci = String(opsi[idxKunci]).trim().toLowerCase();
      if (teksOpsiKunci === rawJwb) return true;
    }
  }

  return false;
}

const opsiTest = ['Padi', 'Tikus', 'Ular', 'Elang'];

const tests = [
  { name: "Direct index match", actual: apakahJawabanBenar('0', '0', opsiTest), expected: true },
  { name: "Index '0' vs Letter 'A'", actual: apakahJawabanBenar('0', 'A', opsiTest), expected: true },
  { name: "Index '1' vs Letter 'b'", actual: apakahJawabanBenar('1', 'b', opsiTest), expected: true },
  { name: "Index '2' vs Letter 'C'", actual: apakahJawabanBenar('2', 'C', opsiTest), expected: true },
  { name: "Index '3' vs Letter 'D'", actual: apakahJawabanBenar('3', 'D', opsiTest), expected: true },
  { name: "Letter 'A' vs Index '0'", actual: apakahJawabanBenar('A', '0', opsiTest), expected: true },
  { name: "Index '0' vs Opsi Text 'Padi'", actual: apakahJawabanBenar('0', 'Padi', opsiTest), expected: true },
  { name: "Opsi Text 'Padi' vs Index '0'", actual: apakahJawabanBenar('Padi', '0', opsiTest), expected: true },
  { name: "Benar/Salah index '0' vs 'benar'", actual: apakahJawabanBenar('0', 'benar', ['Benar', 'Salah'], 'benar_salah'), expected: true },
  { name: "Benar/Salah index '1' vs 'salah'", actual: apakahJawabanBenar('1', 'salah', ['Benar', 'Salah'], 'benar_salah'), expected: true },
  { name: "Isian singkat", actual: apakahJawabanBenar('fotosintesis', 'Fotosintesis', [], 'isian_singkat'), expected: true },
  { name: "Wrong answer '0' vs 'B'", actual: apakahJawabanBenar('0', 'B', opsiTest), expected: false },
  { name: "Timeout '-1'", actual: apakahJawabanBenar('-1', '0', opsiTest), expected: false }
];

let failed = 0;
tests.forEach(t => {
  if (t.actual === t.expected) {
    console.log(`[PASS] ${t.name}`);
  } else {
    console.error(`[FAIL] ${t.name} - Got ${t.actual}, Expected ${t.expected}`);
    failed++;
  }
});

if (failed > 0) process.exit(1);
console.log('All 13 evaluation tests passed!');

