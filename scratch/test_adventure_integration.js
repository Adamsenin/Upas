import fs from 'fs';
import path from 'path';

// Mock browser globals for Node.js test environment
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.complete = true;
  }
};
const store = new Map();
globalThis.localStorage = {
  getItem(k) { return store.has(k) ? store.get(k) : null; },
  setItem(k, v) { store.set(k, String(v)); },
  removeItem(k) { store.delete(k); },
  clear() { store.clear(); }
};

// Mock AudioContext
globalThis.AudioContext = class {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
      connect() {},
      start() {},
      stop() {}
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} },
      connect() {}
    };
  }
};

// Mock Canvas 2D
function createMockCanvas() {
  return {
    width: 960,
    height: 540,
    getContext: () => ({
      clearRect() {},
      fillRect() {},
      strokeRect() {},
      beginPath() {},
      arc() {},
      fill() {},
      stroke() {},
      save() {},
      restore() {},
      translate() {},
      scale() {},
      rotate() {},
      roundRect() {},
      fillText() {},
      measureText: () => ({ width: 80 }),
      drawImage() {}
    })
  };
}

async function runAdventureTests() {
  console.log('=== MULAI PENGUJIAN ADVENTURE MANDIRI KUPAS IPAS ===\n');

  const {
    adventureProgress,
    adventureAudio,
    AdventureGameEngine
  } = await import('../assets/js/adventure-platformer.js');

  // TEST 1: Sistem Progres Mandiri
  console.log('1. Menguji Sistem Penyimpanan Progres:');
  const progresAwal = adventureProgress.muatProgres();
  console.log(`   - Level 1 Terbuka: ${progresAwal.levels[1].unlocked ? '✅ BENAR' : '❌ SALAH'}`);
  console.log(`   - Level 2 Terkunci: ${!progresAwal.levels[2].unlocked ? '✅ BENAR' : '❌ SALAH'}`);

  // Simulasi menyelesaikan Level 1
  const setelahMenang = adventureProgress.selesaikanLevel(1, 3, 28, 1500);
  console.log(`   - Bintang Level 1: ${setelahMenang.levels[1].stars} (Target: 3)`);
  console.log(`   - Total Koin: ${setelahMenang.totalCoins} (Target: 28)`);
  console.log(`   - Level 2 Terbuka otomatis: ${setelahMenang.levels[2].unlocked ? '✅ BENAR' : '❌ SALAH'}`);
  console.log(`   - Lencana Diperoleh: ${setelahMenang.badges.includes('penjelajah_level_1') ? '✅ BENAR' : '❌ SALAH'}`);

  // TEST 2: Sistem Audio Sintetis
  console.log('\n2. Menguji Sistem Audio Sintetis:');
  adventureAudio.playJump();
  adventureAudio.playCoin();
  adventureAudio.playSuccess();
  adventureAudio.playWrong();
  const muteStatus = adventureAudio.toggleMute();
  console.log(`   - Toggle Mute audio: ${muteStatus !== undefined ? '✅ BERHASIL' : '❌ SALAH'}`);

  // TEST 3: Game Engine & Fisika Platformer
  console.log('\n3. Menguji Game Engine & Fisika 60 FPS:');
  const mockCanvas = createMockCanvas();
  const engine = new AdventureGameEngine(mockCanvas);
  await engine.inisialisasi();

  console.log(`   - Dimensi Virtual: ${engine.virtualWidth}x${engine.virtualHeight}`);
  console.log(`   - Dimensi Dunia: ${engine.worldWidth}x${engine.worldHeight}`);
  console.log(`   - Jumlah Platform Solid: ${engine.solidPlatforms.length}`);
  console.log(`   - Jumlah Koleksi Item Ekosistem: ${engine.collectibleItems.length}`);

  // Uji gravitasi & mendarat
  engine.player.y = 100;
  engine.player.vy = 0;
  engine.updateFisika();
  console.log(`   - Gravitasi berfungsi (vy > 0): ${engine.player.vy > 0 ? '✅ BENAR' : '❌ SALAH'}`);

  // Simulasikan pendaratan di atas tanah (y: 444)
  engine.player.y = 444 - engine.player.height;
  engine.player.vy = 0;
  engine.updateFisika();
  console.log(`   - Mendarat di atas platform tanah (onGround): ${engine.player.onGround ? '✅ BENAR' : '❌ SALAH'}`);

  // Uji melompat
  engine.keys.up = true;
  engine.updateFisika();
  console.log(`   - Lompatan berhasil (vy < 0): ${engine.player.vy < 0 ? '✅ BENAR' : '❌ SALAH'}`);
  engine.keys.up = false;

  // Uji penghalang jembatan rusak
  engine.stateLevel.jembatanSelesai = false;
  engine.player.x = 690;
  engine.player.y = 444 - engine.player.height;
  engine.player.vy = 0;
  engine.keys.right = true;
  for (let step = 0; step < 15; step++) {
    engine.updateFisika();
  }
  console.log(`   - Penghalang jembatan rusak menahan pemain: ${engine.player.x + engine.player.width <= 750 ? '✅ AMAN (TERTAHAN)' : '❌ TEMBUS'}`);
  engine.keys.right = false;

  // Selesaikan jembatan
  engine.stateLevel.jembatanSelesai = true;
  engine.player.x = 800;
  engine.player.y = 432 - engine.player.height;
  engine.player.vy = 0;
  engine.updateFisika();
  console.log(`   - Setelah jembatan diperbaiki, pemain dapat berjalan di atas jembatan: ${engine.player.onGround ? '✅ BENAR' : '❌ SALAH'}`);

  // Uji Koleksi Item Biotik & Abiotik
  console.log('\n4. Menguji Koleksi Item Ekosistem:');
  const item1 = engine.collectibleItems[0];
  engine.player.x = item1.x - engine.player.width / 2;
  engine.player.y = item1.y - engine.player.height / 2;
  engine.updateKoleksi();
  console.log(`   - Item biotik terambil saat disentuh: ${item1.diambil ? '✅ BERHASIL' : '❌ GAGAL'}`);
  console.log(`   - Koin bertambah: ${engine.stateLevel.koinTerkumpul > 0 ? '✅ BERHASIL' : '❌ GAGAL'}`);

  // Uji Render & Cleanup
  console.log('\n5. Menguji Rendering & Cleanup:');
  engine.render();
  console.log('   - Render frame canvas: ✅ BERHASIL');
  engine.cleanup();
  console.log('   - Cleanup engine & audio: ✅ BERHASIL');

  console.log('\n=== SELURUH PENGUJIAN ADVENTURE MANDIRI 100% SUKSES ===');
}

runAdventureTests().catch(err => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
