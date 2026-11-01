import fs from 'fs';

// 1. guru/editor.html
let ed = fs.readFileSync('guru/editor.html', 'utf8');
ed = ed.replace(/btnSimpan\.textContent = '💾 Simpan Kuis';/g, "btnSimpan.textContent = 'Simpan Kuis';");
ed = ed.replace(/btnMulai\.innerHTML = '<span>🚀<\/span> <span>Simpan & Langsung Mulai Sesi<\/span>';/g, "btnMulai.innerHTML = '<span>Simpan & Langsung Mulai Sesi</span>';");
ed = ed.replace(/💡 /g, '');
fs.writeFileSync('guru/editor.html', ed, 'utf8');

// 2. guru/sesi.html
let se = fs.readFileSync('guru/sesi.html', 'utf8');
se = se.replace(/Lihat Hasil Akhir 🎉/g, 'Lihat Hasil Akhir');
se = se.replace(/ ➔/g, '');
se = se.replace(/📖 Pelajari:/g, 'Pelajari:');
se = se.replace(/Mode Adventure Kelas 🗺️/g, 'Mode Adventure Kelas');
se = se.replace(/Mode Custom Guru 🎯/g, 'Mode Custom Guru');
se = se.replace(/🎉 Seluruh Siswa Selesai!/g, 'Seluruh Siswa Selesai!');
se = se.replace(/🏁 Selesai/g, 'Selesai');
fs.writeFileSync('guru/sesi.html', se, 'utf8');

// 3. siswa/main.html
let sm = fs.readFileSync('siswa/main.html', 'utf8');
sm = sm.replace(/Kunci Jawaban 🔒/g, 'Kunci Jawaban');
sm = sm.replace(/Waktu Habis ⏱️/g, 'Waktu Habis');
sm = sm.replace(/Jawaban Terkunci ✓/g, 'Jawaban Terkunci');
sm = sm.replace(/✓ Hebat, Jawabanmu Benar! 🌟/g, 'Hebat, Jawabanmu Benar!');
sm = sm.replace(/⏱️ Waktu Habis!/g, 'Waktu Habis!');
sm = sm.replace(/💡 Belum Tepat, Ayo Semangat! 💪/g, 'Belum Tepat, Ayo Semangat!');
sm = sm.replace(/📖 Pelajari:/g, 'Pelajari:');
sm = sm.replace(/🏁 Soal terakhir/g, 'Soal terakhir');
sm = sm.replace(/⚡ Lanjut otomatis/g, 'Lanjut otomatis');
sm = sm.replace(/ ➔/g, '');
sm = sm.replace(/i === 0 \? '🥇' : \(i === 1 \? '🥈' : \(i === 2 \? '🥉' : `#\$\{i \+ 1\}`\)\)/g, '`#${i + 1}`');
sm = sm.replace(/✓ /g, '');
sm = sm.replace(/🔥 /g, '');
fs.writeFileSync('siswa/main.html', sm, 'utf8');

// 4. duel-tim.html & 404.html
let dt = fs.readFileSync('duel-tim.html', 'utf8');
dt = dt.replace(/👑/g, '');
fs.writeFileSync('duel-tim.html', dt, 'utf8');

let p404 = fs.readFileSync('404.html', 'utf8');
p404 = p404.replace(/🎒/g, '');
fs.writeFileSync('404.html', p404, 'utf8');

console.log('Script emojis cleaned completely!');

