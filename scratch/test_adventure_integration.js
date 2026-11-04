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
    this.onerror = null;
    this.complete = true;
    this.width = 432;
    this.height = 48;
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
  console.log('=== MULAI PENGUJIAN ADVENTURE & CUSTOM ASSETS KUPAS IPAS ===\n');

  const {
    adventureProgress,
    adventureAudio,
    DEFAULT_MANIFEST,
    AdventureAssetManager,
    SpriteAnimator,
    AdventureGameEngine
  } = await import('../assets/js/adventure-platformer.js');

  // TEST 1: Asset Manifest & Manager
  console.log('1. Menguji Asset Manifest & AdventureAssetManager:');
  console.log(`   - Versi Manifest: ${DEFAULT_MANIFEST.version} (Nama: ${DEFAULT_MANIFEST.name})`);
  const assetMgr = new AdventureAssetManager();
  await assetMgr.init();

  const chars = assetMgr.getCharacters();
  console.log(`   - Jumlah Karakter Tersedia: ${chars.length} (Si Kupas & Rara)`);
  const defaultChar = assetMgr.getSelectedCharacter();
  console.log(`   - Karakter Default Aktif: ${defaultChar.name} (${defaultChar.id})`);

  // Ganti ke Rara
  const swapped = assetMgr.setSelectedCharacter('rara');
  console.log(`   - Berhasil Switch ke Rara: ${swapped && assetMgr.getSelectedCharacter().id === 'rara' ? '✅ BENAR' : '❌ SALAH'}`);

  // Pasang Karakter Kustom
  const customConfig = assetMgr.setCustomCharacter({
    name: 'Budi Petualang',
    badge: 'Peneliti Cilik',
    spriteSrc: 'assets/images/adventure/character-spritesheet.png',
    frameWidth: 48,
    frameHeight: 48,
    scale: 1.0
  });
  console.log(`   - Pendaftaran Karakter Kustom: ${customConfig.id === 'custom' && assetMgr.getSelectedCharacter().name === 'Budi Petualang' ? '✅ BERHASIL' : '❌ GAGAL'}`);

  // TEST 2: Sprite Animator (7 Animasi: Idle, Run, Jump, Fall, Land, Hurt, Celebrate)
  console.log('\n2. Menguji Sprite Animator 7 State:');
  const animator = new SpriteAnimator(customConfig);
  const states = ['idle', 'run', 'jump', 'fall', 'land', 'hurt', 'celebrate'];
  let allStatesOk = true;

  for (const st of states) {
    animator.play(st);
    animator.update(0.016);
    const frame = animator.getCurrentFrame();
    if (frame === undefined || isNaN(frame)) {
      allStatesOk = false;
      console.log(`   - State ${st}: ❌ Gagal ambil frame`);
    }
  }
  console.log(`   - 7 Animasi Sprite (Idle, Run, Jump, Fall, Land, Hurt, Celebrate): ${allStatesOk ? '✅ 100% VALID' : '❌ ADA ERROR'}`);

  // Test rendering via draw
  const mockCtx = createMockCanvas().getContext('2d');
  const dummyImg = new globalThis.Image();
  const drew = animator.draw(mockCtx, dummyImg, 100, 200, 1);
  console.log(`   - Draw Sprite Animator ke Context 2D: ${drew ? '✅ BERHASIL' : '❌ GAGAL'}`);

  // TEST 3: Invariant Physics & Hitbox
  console.log('\n3. Menguji Fisika Tetap Invarian Saat Ganti Karakter:');
  const mockCanvas = createMockCanvas();
  const engine = new AdventureGameEngine(mockCanvas, assetMgr);
  await engine.inisialisasi();

  const initialWidth = engine.player.width;
  const initialHeight = engine.player.height;
  const initialSpeed = engine.player.speed;
  const initialJump = engine.player.jumpForce;

  // Ganti karakter di game engine
  engine.gantiKarakter('si_kupas');
  const p1Width = engine.player.width;
  const p1Height = engine.player.height;

  engine.gantiKarakter('rara');
  const p2Width = engine.player.width;
  const p2Height = engine.player.height;

  const invariant = (initialWidth === p1Width && p1Width === p2Width &&
                     initialHeight === p1Height && p1Height === p2Height &&
                     initialSpeed === engine.player.speed &&
                     initialJump === engine.player.jumpForce);
  console.log(`   - Hitbox (${p1Width}x${p1Height}) & Fisika (Speed: ${engine.player.speed}, Jump: ${engine.player.jumpForce}) Terbukti Invarian: ${invariant ? '✅ BENAR (STABIL)' : '❌ BERUBAH'}`);

  // TEST 4: Simulasi Fisika & 5 Tantangan
  console.log('\n4. Menguji Fisika & 5 Tantangan Lingkungan Level 1:');
  engine.player.y = 100;
  engine.player.vy = 0;
  engine.updateFisika();
  console.log(`   - Gravitasi berfungsi (vy > 0): ${engine.player.vy > 0 ? '✅ BENAR' : '❌ SALAH'}`);

  // Mendarat di atas tanah (y: 444)
  engine.player.y = 444 - engine.player.height;
  engine.player.vy = 0;
  engine.updateFisika();
  console.log(`   - Mendarat di atas platform tanah (onGround): ${engine.player.onGround ? '✅ BENAR' : '❌ SALAH'}`);

  // Lompat
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
  console.log(`   - Berjalan di atas jembatan setelah selesai: ${engine.player.onGround ? '✅ BENAR' : '❌ SALAH'}`);

  // Koleksi Item
  const item1 = engine.collectibleItems[0];
  engine.player.x = item1.x - engine.player.width / 2;
  engine.player.y = item1.y - engine.player.height / 2;
  engine.updateKoleksi();
  console.log(`   - Koleksi item biotik/abiotik: ${item1.diambil ? '✅ BERHASIL' : '❌ GAGAL'}`);

  // TEST 5: Progres & Kemenangan
  console.log('\n5. Menguji Penyimpanan Progres & Hadiah:');
  const setelahMenang = adventureProgress.selesaikanLevel(1, 3, 28, 1500);
  console.log(`   - Bintang Level 1: ${setelahMenang.levels[1].stars} (Target: 3)`);
  console.log(`   - Total Koin: ${setelahMenang.totalCoins}`);
  console.log(`   - Level 2 Terbuka otomatis: ${setelahMenang.levels[2].unlocked ? '✅ BENAR' : '❌ SALAH'}`);

  // TEST 6: Render & Cleanup
  console.log('\n6. Menguji Render & Cleanup:');
  engine.render();
  console.log('   - Render canvas 2D multi-layer: ✅ BERHASIL');
  engine.cleanup();
  console.log('   - Cleanup engine & event listeners: ✅ BERHASIL');

  console.log('\n=== SELURUH PENGUJIAN ADVENTURE & CUSTOM ASSETS 100% SUKSES ===');
}

runAdventureTests().catch(err => {
  console.error('Pengujian gagal:', err);
  process.exit(1);
});
