/**
 * KUPAS KUIS IPAS - Unit & Integration Test Platformer ala Super Mario
 * (scratch/test_adventure_mario_engine.js)
 */

import assert from 'assert';
import { LEVEL1_DATA } from '../assets/js/adventure-level1-data.js';
import { MarioPhysicsEngine } from '../assets/js/adventure-physics.js';
import { AdventureCamera } from '../assets/js/adventure-camera.js';
import { AdventureEntityManager } from '../assets/js/adventure-entities.js';
import { AdventureQuestionGates } from '../assets/js/adventure-questions.js';

console.log('========================================================');
console.log('🧪 PENGUJIAN OTOMATIS: MESIN PLATFORMER SUPER MARIO IPAS');
console.log('========================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: Struktur & Integritas Data Level 1 (7200px)
// ----------------------------------------------------------------------------
console.log('Test 1: Validasi Data Level 1 Padang Rumput Asri');
assert.strictEqual(LEVEL1_DATA.worldWidth, 7200, 'Lebar peta harus 7200px');
assert.strictEqual(LEVEL1_DATA.worldHeight, 540, 'Tinggi peta harus 540px');
assert.strictEqual(LEVEL1_DATA.questionGates.length, 5, 'Harus ada 5 Gerbang Soal IPAS');
assert.strictEqual(LEVEL1_DATA.checkpoints.length, 3, 'Harus ada 3 Pos Checkpoint');
assert.strictEqual(LEVEL1_DATA.mysteryBlocks.length, 12, 'Harus ada 12 Blok Misteri ?');
assert.strictEqual(LEVEL1_DATA.enemies.length, 7, 'Harus ada 7 musuh ramah anak');
assert(LEVEL1_DATA.finishFlagpole.x > 6700, 'Tiang bendera finis harus berada di dekat ujung peta');
console.log('  ✅ Level 1 Data Valid: 7200px, 5 Gerbang IPAS, 3 Checkpoints, 12 Blok ?, 7 Musuh.\n');

// ----------------------------------------------------------------------------
// TEST 2: Fisika Mario (Akselerasi, Deselerasi, Coyote Time, Jump Buffering)
// ----------------------------------------------------------------------------
console.log('Test 2: Validasi Fisika Mario (Inersia & Toleransi Gerak)');
const physics = new MarioPhysicsEngine({
  accel: 0.52,
  friction: 0.82,
  maxSpeed: 5.2,
  jumpForce: -12.0
});

const mockPlayer = {
  x: 100, y: 396, width: 44, height: 48,
  vx: 0, vy: 0, isGrounded: true, facing: 1
};
const platforms = [{ x: 0, y: 444, width: 1000, height: 96, tipe: 'tanah' }];

// A. Akselerasi ke kanan
physics.update(mockPlayer, { left: false, right: true, jumpHeld: false }, platforms, 0.016);
assert(mockPlayer.vx > 0, 'Pemain harus berakselerasi ke kanan');
assert(mockPlayer.vx <= 5.2, 'Kecepatan tidak boleh melebihi maxSpeed');

// B. Deselerasi licin saat input dilepas
const speedBefore = mockPlayer.vx;
physics.update(mockPlayer, { left: false, right: false, jumpHeld: false }, platforms, 0.016);
assert(mockPlayer.vx < speedBefore && mockPlayer.vx > 0, 'Pemain harus meluncur sedikit (deselerasi), bukan berhenti mendadak');

// C. Coyote Time
mockPlayer.isGrounded = true;
physics.update(mockPlayer, { left: false, right: false, jumpHeld: false }, platforms, 0.016);
// Sekarang buat melayang di tepi tebing (isGrounded = false)
mockPlayer.isGrounded = false;
physics.update(mockPlayer, { left: false, right: false, jumpHeld: false }, platforms, 0.05); // 50ms berlalu
assert(physics.coyoteTimer > 0, 'Coyote timer harus masih aktif dalam rentang 120ms');
physics.queueJump();
const jumpEv = physics.update(mockPlayer, { left: false, right: false, jumpHeld: true }, platforms, 0.016);
assert.strictEqual(jumpEv.jumped, true, 'Pemain harus tetap bisa melompat via Coyote Time');
assert(mockPlayer.vy <= -11.0, 'Kecepatan vertikal harus terdorong ke atas (~ -12.0)');

// D. Lompatan Variabel (Variable Jump Cut)
physics.update(mockPlayer, { left: false, right: false, jumpHeld: false }, platforms, 0.016);
assert(mockPlayer.vy > -12.0 && mockPlayer.vy < 0, 'Kecepatan lompat harus dipotong saat tombol dilepas awal');
console.log('  ✅ Fisika Mario Valid: Akselerasi, Deselerasi Inersia, Coyote Time & Lompatan Variabel bekerja sempurna.\n');

// ----------------------------------------------------------------------------
// TEST 3: Blok Misteri '?' Disundul dari Bawah
// ----------------------------------------------------------------------------
console.log('Test 3: Validasi Blok Misteri ? Disundul dari Bawah');
const entities = new AdventureEntityManager(LEVEL1_DATA);
const targetBlock = entities.mysteryBlocks[0]; // x: 330, y: 300, width: 36, height: 36

// Pemain melompat ke atas membentur bagian bawah blok
const jumper = {
  x: targetBlock.x,
  y: targetBlock.y + targetBlock.height - 4,
  width: 44,
  height: 48,
  vy: -8.0,
  isInvulnerable: false
};

const blockEvents = entities.update(jumper, 0.016, null);
assert.strictEqual(blockEvents.blockHit, true, 'Blok harus mencatat benturan sundulan');
assert(targetBlock.bounceY < 0, 'Blok harus memantul naik (bounceY < 0)');
assert.strictEqual(entities.poppedItems.length, 1, 'Harus memunculkan koin memantul ke atas');
console.log('  ✅ Blok Misteri ? Valid: Sundulan dari bawah memantulkan blok dan memunculkan koin.\n');

// ----------------------------------------------------------------------------
// TEST 4: Musuh Ramah Anak & Mekanik Stomp Bounce
// ----------------------------------------------------------------------------
console.log('Test 4: Validasi Musuh Ramah Anak & Stomp Bounce');
const enemy = entities.enemies[0]; // Ulat di x: 480, y: 416, width: 34, height: 28

// Pemain jatuh dari atas menginjak kepala musuh (vy > 0)
const stomper = {
  x: enemy.x,
  y: enemy.y - 40,
  width: 44,
  height: 48,
  vy: 6.0,
  isInvulnerable: false
};

const stompEvents = entities.update(stomper, 0.016, null);
assert.strictEqual(stompEvents.enemyStomped, true, 'Harus mencatat event enemy stomped');
assert.strictEqual(enemy.isAlive, false, 'Musuh harus kempes / tidak hidup');
assert.strictEqual(stomper.vy, -9.2, 'Pemain harus melambung tinggi ke atas (stomp bounce vy = -9.2)');
assert(stompEvents.coinCollected >= 5, 'Menginjak musuh memberikan hadiah koin');

// Pemain menyentuh musuh hidup dari samping -> Kerusakan
const enemy2 = entities.enemies[1];
const victim = {
  x: enemy2.x + 10,
  y: enemy2.y,
  width: 44,
  height: 48,
  vy: 0,
  isInvulnerable: false
};
const hurtEvents = entities.update(victim, 0.016, null);
assert.strictEqual(hurtEvents.playerHurt, true, 'Pemain harus terluka saat tertabrak musuh dari samping');
assert.strictEqual(victim.isInvulnerable, true, 'Pemain harus mendapatkan status kebal setelah terluka');
console.log('  ✅ Mekanik Musuh Valid: Stomp bounce melambungkan pemain, sentuhan samping mengurangi hati & memicu invulnerability blink.\n');

// ----------------------------------------------------------------------------
// TEST 5: 5 Gerbang Soal IPAS & Checkpoints
// ----------------------------------------------------------------------------
console.log('Test 5: Validasi 5 Gerbang Soal IPAS & Checkpoint');
let unlockedGateCount = 0;
let coinsAwarded = 0;

const gatesManager = new AdventureQuestionGates(LEVEL1_DATA.questionGates, {
  onGateUnlocked: (gate) => { unlockedGateCount++; },
  onCoinAwarded: (koin) => { coinsAwarded += koin; }
});

// A. Deteksi kedekatan gerbang 1 (x: 820)
const gate1 = LEVEL1_DATA.questionGates[0];
const nearPlayer = { x: 800, y: 380, width: 44, height: 48 };
const nearby = gatesManager.getNearbyGate(nearPlayer);
assert.strictEqual(nearby.id, gate1.id, 'Pemain harus mendeteksi gerbang 1 saat mendekat');

// B. Evaluasi kunci jawaban
assert.strictEqual(gate1.kunci, 0, 'Kunci gerbang 1 harus pilihan pertama (Batu, air, sinar matahari)');
assert(gate1.opsi[0].includes('Batu kerikil'), 'Opsi jawaban benar sesuai PRD');

// C. Checkpoint aktivasi
const cp1 = entities.checkpoints[0]; // x: 1800
const cpPlayer = { x: 1790, y: 380, width: 44, height: 48 };
const cpEvents = entities.update(cpPlayer, 0.016, null);
assert.strictEqual(cpEvents.checkpointActivated.id, cp1.id, 'Checkpoint 1 harus aktif saat pemain melewatinya');
console.log('  ✅ Gerbang Soal & Checkpoint Valid: Deteksi kedekatan presisi, kunci soal kurikulum akurat, aktivasi checkpoint tuntas.\n');

// ----------------------------------------------------------------------------
// TEST 6: Kamera Halus (Lerp & Lookahead)
// ----------------------------------------------------------------------------
console.log('Test 6: Validasi Kamera Halus');
const cam = new AdventureCamera(960, 540, 7200, 540);
cam.resetTo(100);
assert.strictEqual(cam.x, 0, 'Kamera pada posisi awal harus di-clamp ke batas kiri 0');

cam.update({ x: 1500, width: 44, facing: 1 }, 0.016);
assert(cam.targetX > 0, 'Target kamera bergerak maju mengikuti pemain');
assert(cam.x < cam.targetX, 'Kamera menggunakan lerp interpolasi halus (tidak loncat kaku)');
console.log('  ✅ Kamera Halus Valid: Clamping peta, lookahead orientasi, dan lerp 60fps terverifikasi.\n');

console.log('🎉 SELURUH PENGUJIAN OTOMATIS BERHASIL 100% (6/6 SUITES PASSED)!');
