/**
 * scratch/test_adventure_worlds_engine.js
 * Verifikasi Mendalam Mesin Petualangan Multi-Dunia Fase A (Dunia 1)
 */

import assert from 'assert';
import { 
  ADVENTURE_QUESTIONS, 
  getQuestionsForLevel 
} from '../assets/js/adventure-questions-data.js';
import { 
  WORLDS_METADATA, 
  ADVENTURE_LEVELS_REGISTRY, 
  adventureWorldsProgress 
} from '../assets/js/adventure-worlds-data.js';
import { AdventureParallaxEngine } from '../assets/js/adventure-parallax.js';
import { adventureAudio } from '../assets/js/adventure-audio.js';

console.log('--- TEST 1: VERIFIKASI BANK SOAL 30 SOAL BERJENJANG ---');
// 1. Total soal harus minimal 30
assert(Array.isArray(ADVENTURE_QUESTIONS), 'ADVENTURE_QUESTIONS harus berupa Array');
assert.strictEqual(ADVENTURE_QUESTIONS.length, 30, `Harus ada tepat 30 soal, ditemukan ${ADVENTURE_QUESTIONS.length}`);

// 2. Setiap soal memiliki struktur lengkap
const levelCounts = {};
ADVENTURE_QUESTIONS.forEach((q, idx) => {
  assert(q.id, `Soal index ${idx} harus memiliki ID`);
  assert(q.level, `Soal ${q.id} harus memiliki properti level`);
  const teksPertanyaan = q.pertanyaan || q.teks;
  assert(typeof teksPertanyaan === 'string' && teksPertanyaan.length > 5, `Soal ${q.id} harus memiliki teks pertanyaan`);
  const pilihan = q.opsi || q.pilihan;
  assert(Array.isArray(pilihan) && pilihan.length === 4, `Soal ${q.id} harus memiliki tepat 4 opsi jawaban`);
  const kunci = (typeof q.kunci === 'number') ? q.kunci : q.jawaban;
  assert(typeof kunci === 'number' && kunci >= 0 && kunci <= 3, `Soal ${q.id} jawaban harus antara 0 dan 3`);
  const penjelasan = q.penjelasan || q.pembahasan;
  assert(typeof penjelasan === 'string' && penjelasan.length > 5, `Soal ${q.id} harus memiliki penjelasan`);
  assert.strictEqual(q.isSampleData, true, `Soal ${q.id} harus ditandai isSampleData: true`);
  
  levelCounts[q.level] = (levelCounts[q.level] || 0) + 1;
});

console.log('Distribusi Soal per Level:', levelCounts);
['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'].forEach(lvl => {
  assert.strictEqual(levelCounts[lvl], 5, `Level ${lvl} harus memiliki 5 soal`);
  const lvlQuestions = getQuestionsForLevel(lvl);
  assert.strictEqual(lvlQuestions.length, 5, `getQuestionsForLevel('${lvl}') harus mengembalikan 5 soal`);
});
console.log('✓ TEST 1 LOLOS: 30 Soal IPAS tervalidasi lengkap (5 soal per level)');

console.log('\n--- TEST 2: VERIFIKASI REGISTRY PETA & PRESERVASI LEVEL LAMA 7200px ---');
// 1. Metadata 3 Dunia
assert(WORLDS_METADATA[1], 'Dunia 1 harus terdefinisi');
assert(WORLDS_METADATA[2], 'Dunia 2 harus terdefinisi');
assert(WORLDS_METADATA[3], 'Dunia 3 harus terdefinisi');
assert(WORLDS_METADATA[1].nama.includes('Hutan Ceria'));
assert(WORLDS_METADATA[2].nama.includes('Padang Rumput'));
assert(WORLDS_METADATA[3].nama.includes('Sungai Kehidupan'));

// 2. Level 1-1 (Hutan Ceria Dasar)
const lvl1_1 = ADVENTURE_LEVELS_REGISTRY['1-1'];
assert(lvl1_1, 'Level 1-1 harus terdaftar');
assert.strictEqual(lvl1_1.worldWidth, 3800, 'Level 1-1 harus memiliki lebar 3800px');
assert(lvl1_1.platforms.length >= 8, 'Level 1-1 harus memiliki minimal 8 platform');
assert(lvl1_1.questionGates.length === 5, 'Level 1-1 harus memiliki 5 gerbang soal IPAS');
assert(lvl1_1.leafCoins.length >= 10, 'Level 1-1 harus memiliki koin koleksi');
assert(lvl1_1.enemies.length >= 4, 'Level 1-1 harus memiliki musuh');
assert(lvl1_1.finishFlagpole && lvl1_1.finishFlagpole.x >= 3500, 'Level 1-1 harus memiliki tiang finis di akhir peta');

// 3. Level 1-2 (Kanopi Hijau)
const lvl1_2 = ADVENTURE_LEVELS_REGISTRY['1-2'];
assert(lvl1_2, 'Level 1-2 harus terdaftar');
assert.strictEqual(lvl1_2.worldWidth, 4200, 'Level 1-2 harus memiliki lebar 4200px');
assert(lvl1_2.questionGates.length === 5, 'Level 1-2 harus memiliki 5 gerbang soal IPAS');
assert(lvl1_2.enemies.length >= 5, 'Level 1-2 harus memiliki musuh kanopi');
assert(lvl1_2.finishFlagpole && lvl1_2.finishFlagpole.x >= 3900, 'Level 1-2 harus memiliki tiang finis kanopi');

// 4. PRESERVASI PETA LAMA (7200px) sebagai Level 2-1
const lvl2_1 = ADVENTURE_LEVELS_REGISTRY['2-1'];
assert(lvl2_1, 'Peta lama 7200px harus dipreservasi di Level 2-1');
assert.strictEqual(lvl2_1.worldWidth, 7200, 'Level 2-1 harus tetap 7200px persis seperti aslinya');
assert(lvl2_1.platforms.length >= 20, 'Level 2-1 harus mempertahankan semua platform lama');
assert(lvl2_1.questionGates.length >= 5, 'Level 2-1 harus memiliki gerbang soal');
assert(lvl2_1.finishFlagpole && lvl2_1.finishFlagpole.x >= 6800, 'Level 2-1 harus mempertahankan tiang finis 6800px');
console.log('✓ TEST 2 LOLOS: Registry Level 1-1, 1-2, dan Preservasi Peta 7200px di Level 2-1 valid');

console.log('\n--- TEST 3: VERIFIKASI SISTEM PROGRES & LEVEL UNLOCKING ---');
// Simulasi localStorage mock
const mockStorage = {};
globalThis.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; }
};

// 1. State awal
const initP = adventureWorldsProgress.muatProgres();
assert.strictEqual(initP.levels['1-1'].unlocked, true, 'Level 1-1 harus terbuka di awal');
assert.strictEqual(initP.levels['1-2'].unlocked, false, 'Level 1-2 harus terkunci di awal');
assert.strictEqual(initP.levels['2-1'].unlocked, false, 'Level 2-1 harus terkunci di awal');

// 2. Selesaikan Level 1-1
console.log('Menyelesaikan Level 1-1 dengan 3 bintang & 25 koin...');
adventureWorldsProgress.selesaikanLevel('1-1', 3, 25, 450);
const pAfter1_1 = adventureWorldsProgress.muatProgres();
assert.strictEqual(pAfter1_1.levels['1-1'].completed, true, 'Level 1-1 harus berstatus completed');
assert.strictEqual(pAfter1_1.levels['1-1'].stars, 3, 'Level 1-1 harus dapat 3 bintang');
assert.strictEqual(pAfter1_1.levels['1-2'].unlocked, true, 'Level 1-2 HARUS TERBUKA setelah 1-1 selesai!');
assert(pAfter1_1.badges.includes('penjelajah_level_1_1'), 'Harus mendapatkan badge penjelajah_level_1_1');

// 3. Selesaikan Level 1-2
console.log('Menyelesaikan Level 1-2 dengan 3 bintang & 30 koin...');
adventureWorldsProgress.selesaikanLevel('1-2', 3, 30, 500);
const pAfter1_2 = adventureWorldsProgress.muatProgres();
assert.strictEqual(pAfter1_2.levels['1-2'].completed, true, 'Level 1-2 harus completed');
assert.strictEqual(pAfter1_2.levels['2-1'].unlocked, true, 'Level 2-1 (Peta 7200px) HARUS TERBUKA setelah 1-2 selesai!');
assert(pAfter1_2.badges.includes('lencana_dunia_1'), 'Harus mendapatkan lencana tuntas Dunia 1');
assert.strictEqual(pAfter1_2.totalStars, 6, 'Total bintang harus 6');
assert.strictEqual(pAfter1_2.totalCoins, 55, 'Total koin harus 55');
console.log('✓ TEST 3 LOLOS: Alur buka level (1-1 -> 1-2 -> 2-1) dan penghargaan berfungsi sempurna');

console.log('\n--- TEST 4: VERIFIKASI PARALLAX ENGINE 5 LAPIS & REDUCED MOTION ---');
const parallax = new AdventureParallaxEngine(960, 540);
assert.strictEqual(parallax.birds.length, 3, 'Harus ada 3 burung hidup');
assert.strictEqual(parallax.butterflies.length, 4, 'Harus ada 4 kupu-kupu hidup');
assert(parallax.fallingLeaves.length >= 10, 'Harus ada partikel daun gugur');

// Update simulasi 60fps
const initBirdX = parallax.birds[0].x;
parallax.update(0.016, 50, 0);
assert(parallax.birds[0].x > initBirdX, 'Burung harus bergerak maju pada update biasa');

// Toggle reduced motion
parallax.setReducedMotion(true);
assert.strictEqual(parallax.isReducedMotion, true, 'Reduced motion flag harus true');
const startBirdX = parallax.birds[0].x;
parallax.update(0.016, 100, 0);
const reducedDelta = parallax.birds[0].x - startBirdX;
const normalDelta = initBirdX - (startBirdX - (parallax.birds[0].speed * 1.0)); // expected normal speed ~ 1.4
assert(reducedDelta < 0.6, `Gerakan pada reduced motion harus berkurang drastis (delta: ${reducedDelta})`);
console.log('✓ TEST 4 LOLOS: Parallax engine 5 lapis dan aksesibilitas reduced motion tervalidasi');

console.log('\n--- TEST 5: VERIFIKASI SISTEM AUDIO SINTETIK ---');
assert(adventureAudio, 'adventureAudio singleton harus ada');
adventureAudio.toggleMute();
assert.strictEqual(adventureAudio.muted, true, 'Mute toggle harus berhasil');
adventureAudio.toggleMute();
assert.strictEqual(adventureAudio.muted, false, 'Unmute toggle harus berhasil');
console.log('✓ TEST 5 LOLOS: Adventure audio singleton responsif');

console.log('\n======================================================');
console.log('SEMUA TEST FASE A BERHASIL (5 DARI 5 MODUL TERVERIFIKASI)!');
console.log('======================================================');
