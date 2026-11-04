/**
 * KUPAS KUIS IPAS v4.0 - Mesin Petualangan Mandiri (adventure-platformer.js)
 * Platformer 2D Side-scroller Edukasi IPAS Kelas V SD
 *
 * Fitur:
 * - 60 FPS Physics Engine (Gravity, Momentum, Solid Tile Collisions).
 * - Multi-layer Parallax Scrolling (Sky, Hills, Foliage, Playfield).
 * - Animated Character Sprite System (Idle, Run, Jump, Fall, Cheer).
 * - 5 Interactive Environmental Story Challenges (Jembatan, Bunga, Kincir, Koleksi, Gerbang).
 * - Standalone IPAS Question Engine (No Lobby, No Sockets, No Sesi Dependency).
 * - Multi-platform Controls: Keyboard (WASD/Arrows/Space/E) & Mobile Virtual Touch Buttons.
 * - Local & Profile Persistent Progress (Stars, Leaf Coins, Badges).
 * - Full Memory & Audio Cleanup on Exit.
 */

// ============================================================================
// 1. MANAJEMEN PENYIMPANAN PROGRES ADVENTURE (TERISOLASI DARI KUIS BERSAMA)
// ============================================================================
export const adventureProgress = {
  getStorageKey() {
    return 'kupas_adventure_progress_v1';
  },

  muatProgres() {
    try {
      const data = JSON.parse(localStorage.getItem(this.getStorageKey()));
      if (data && data.levels) return data;
    } catch (e) {}

    // Bawaan awal
    return {
      totalCoins: 0,
      totalStars: 0,
      badges: [],
      levels: {
        1: { unlocked: true, completed: false, stars: 0, coins: 0, score: 0, nama: 'Padang Rumput Asri' },
        2: { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Sawah & Rantai Makanan' },
        3: { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Hutan Rimba & Simbiosis' },
        4: { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Sungai & Siklus Air' }
      }
    };
  },

  simpanProgres(progres) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(progres));
    } catch (e) {
      console.warn('Gagal menyimpan progres adventure:', e);
    }
  },

  selesaikanLevel(levelId, stars, coinsEarned, score) {
    const p = this.muatProgres();
    const lvl = p.levels[levelId] || { unlocked: true };
    lvl.completed = true;
    lvl.stars = Math.max(lvl.stars || 0, stars);
    lvl.coins = Math.max(lvl.coins || 0, coinsEarned);
    lvl.score = Math.max(lvl.score || 0, score);
    p.levels[levelId] = lvl;

    // Buka level berikutnya
    const nextLevel = levelId + 1;
    if (p.levels[nextLevel]) {
      p.levels[nextLevel].unlocked = true;
    }

    // Tambah koin dan lencana
    p.totalCoins = (p.totalCoins || 0) + coinsEarned;
    let totalBintang = 0;
    Object.values(p.levels).forEach(l => { totalBintang += (l.stars || 0); });
    p.totalStars = totalBintang;

    const badgeId = `penjelajah_level_${levelId}`;
    if (!p.badges.includes(badgeId)) {
      p.badges.push(badgeId);
    }

    this.simpanProgres(p);
    return p;
  }
};

// ============================================================================
// 2. SISTEM AUDIO EFEK MANDIRI (WEB AUDIO API SINTETIS)
// ============================================================================
class AdventureAudio {
  constructor() {
    this.ctx = null;
    this.muted = (typeof localStorage !== 'undefined') ? (localStorage.getItem('kupas_suara_aktif') === 'false') : false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playJump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playSuccess() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.2, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.18);
      });
    } catch (e) {}
  }

  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.2);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.2);
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('kupas_suara_aktif', this.muted ? 'false' : 'true');
    return !this.muted;
  }
}

export const adventureAudio = new AdventureAudio();

// ============================================================================
// 3. BANK SOAL & TANTANGAN IPAS PADANG RUMPUT (STANDALONE)
// ============================================================================
const TANTANGAN_LEVEL_1 = {
  jembatan: {
    id: 't1_jembatan',
    judul: 'Tantangan 1: Jembatan Rusak',
    instruksi: 'Jembatan kayu penghubung seberang sungai patah! Kita butuh bahan perbaikan dari alam sekitar.',
    pertanyaan: 'Manakah di bawah ini yang seluruhnya merupakan komponen ABIOTIK (benda tak hidup) di sekitar sungai padang rumput?',
    opsi: [
      'Batu kerikil, air sungai, dan sinar matahari',
      'Ikan kecil, cacing tanah, dan rumput teki',
      'Jamur pengurai, lumut, dan katak hijau',
      'Burung pipit, capung, dan pohon beringin'
    ],
    kunci: 0,
    penjelasan: 'Komponen abiotik adalah semua benda tak hidup dalam ekosistem, seperti batu, air, tanah, udara, dan cahaya matahari.'
  },
  bunga: {
    id: 't2_bunga',
    judul: 'Tantangan 2: Bunga Padang Layu',
    instruksi: 'Bunga liar ini layu dan kepanasan. Agar dapat berfotosintesis dan kembali mekar segar, apa yang dibutuhkannya?',
    pertanyaan: 'Bahan apakah yang diserap oleh akar tumbuhan dari dalam tanah dan daun dari udara untuk proses fotosintesis?',
    opsi: [
      'Menghirup gas oksigen dan pupuk buatan',
      'Air dari tanah dan gas karbon dioksida dari udara',
      'Minyak tanah dan sari gula pasir',
      'Gas nitrogen dan serbuk kapur'
    ],
    kunci: 1,
    penjelasan: 'Tumbuhan hijau membutuhkan air dari dalam tanah dan karbon dioksida (CO2) dari udara, yang diolah dengan bantuan cahaya matahari dan klorofil untuk menghasilkan makanan.'
  },
  kincir: {
    id: 't3_kincir',
    judul: 'Tantangan 3: Kincir Air Macet',
    instruksi: 'Saluran air irigasi macet sehingga kincir air berhenti berputar. Bagaimana kincir air dapat bergerak kembali?',
    pertanyaan: 'Perubahan bentuk energi apakah yang dimanfaatkan kincir air dari arus sungai untuk menyiram padang rumput?',
    opsi: [
      'Energi panas bumi menjadi energi listrik',
      'Energi kinetik (gerak) air mengalir menjadi energi gerak kincir',
      'Energi bunyi air menjadi energi magnet',
      'Energi kimia air menjadi energi cahaya'
    ],
    kunci: 1,
    penjelasan: 'Arus air sungai yang mengalir memiliki energi kinetik (gerak). Tekanan aliran air mendorong bilah kincir sehingga menghasilkan energi gerak mekanis.'
  },
  gerbang_1: {
    id: 't5_gerbang_1',
    judul: 'Ujian Penjaga: Rantai Makanan',
    instruksi: 'Penjaga Gerbang Padang Rumput menguji pemahaman rantai makananmu.',
    pertanyaan: 'Di padang rumput terdapat: Rumput -> Belalang -> Katak -> Ular -> Elang. Makhluk hidup manakah yang berperan sebagai PRODUSEN?',
    opsi: [
      'Rumput hijau',
      'Belalang sawah',
      'Katak pemakan serangga',
      'Burung Elang'
    ],
    kunci: 0,
    penjelasan: 'Rumput hijau adalah produsen karena dapat membuat makanannya sendiri melalui fotosintesis.'
  },
  gerbang_2: {
    id: 't5_gerbang_2',
    judul: 'Ujian Penjaga: Keseimbangan Ekosistem',
    instruksi: 'Pertanyaan terakhir sebelum Gerbang Kemenangan terbuka!',
    pertanyaan: 'Jika populasi katak di padang rumput punah karena diburu, dampak langsung apa yang terjadi pada rantai makanan?',
    opsi: [
      'Populasi belalang melonjak pesat karena pemangsanya hilang',
      'Rumput bertumbuh sangat subur melimpah',
      'Populasi ular langsung berlipat ganda',
      'Seluruh tumbuhan langsung layu seketika'
    ],
    kunci: 0,
    penjelasan: 'Katak adalah predator pengendali belalang. Jika katak punah, belalang akan bertambah sangat banyak dan memakan rumput secara berlebihan.'
  }
};

// ============================================================================
// 4. KELAS MESIN PERMAINAN PLATFORMER 2D (GAME ENGINE)
// ============================================================================
export class AdventureGameEngine {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d', { alpha: false });

    // Dimensi Virtual Game (16:9 ratio, fixed logical coordinates)
    this.virtualWidth = 960;
    this.virtualHeight = 540;
    this.canvas.width = this.virtualWidth;
    this.canvas.height = this.virtualHeight;

    // Dimensi Dunia (Lebar peta side-scrolling)
    this.worldWidth = 3600;
    this.worldHeight = 540;

    // Assets Images
    this.assets = {
      sky: new Image(),
      trees: new Image(),
      character: new Image(),
      tileset: new Image()
    };
    this.assetsLoaded = false;

    // Game loop & Timing
    this.isRunning = false;
    this.rafId = null;
    this.lastTime = 0;

    // Kamera side-scroller
    this.camera = { x: 0, y: 0 };

    // Karakter Pemain (Si Kupas Penjelajah)
    this.player = {
      x: 100,
      y: 380,
      width: 44,
      height: 48,
      vx: 0,
      vy: 0,
      speed: 4.4,
      jumpForce: -12.8,
      gravity: 0.58,
      onGround: false,
      facing: 1, // 1: kanan, -1: kiri
      animFrame: 0,
      animTimer: 0,
      state: 'idle' // idle, run, jump, fall, cheer
    };

    // Input Controller
    this.keys = {
      left: false,
      right: false,
      up: false,
      interact: false
    };

    // State Tantangan & Objek Interaktif Level 1
    this.stateLevel = {
      levelId: 1,
      koinTerkumpul: 0,
      misiSelesai: 0,
      totalMisi: 5,
      jembatanSelesai: false,
      bungaSelesai: false,
      kincirSelesai: false,
      koleksiSelesai: false,
      gerbangSelesai: false,
      koleksiItem: {
        biotik: 0,
        targetBiotik: 3,
        abiotik: 0,
        targetAbiotik: 3
      }
    };

    // Daftar Partikel Visual (Debu, Percikan Air, Bintang)
    this.particles = [];

    // Koleksi Item Lingkungan (Biotik & Abiotik)
    this.collectibleItems = [];

    // Kotak Rintangan / Platform Solid
    this.solidPlatforms = [];

    // Pointer ke dialog tantangan UI
    this.dialogAktif = false;
    this.callbackTantanganSelesai = null;

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  async inisialisasi() {
    this.muatAsetVisual();
    this.bangunDuniaLevel1();
    this.pasangInputListener();
  }

  muatAsetVisual() {
    const root = 'assets/images/adventure/';
    let loadedCount = 0;
    const total = 4;

    const onLoad = () => {
      loadedCount++;
      if (loadedCount >= total) {
        this.assetsLoaded = true;
      }
    };

    this.assets.sky.src = `${root}bg-sky.png`;
    this.assets.trees.src = `${root}bg-trees.png`;
    this.assets.character.src = `${root}character-spritesheet.png`;
    this.assets.tileset.src = `${root}tileset-grassland.png`;

    this.assets.sky.onload = onLoad;
    this.assets.trees.onload = onLoad;
    this.assets.character.onload = onLoad;
    this.assets.tileset.onload = onLoad;
  }

  bangunDuniaLevel1() {
    this.solidPlatforms = [
      // Tanah 1: Area Awal (x: 0 .. 760, y: 444)
      { x: 0, y: 444, width: 760, height: 96, tipe: 'tanah' },

      // Platform mengambang batu/tanah area awal
      { x: 300, y: 350, width: 120, height: 28, tipe: 'platform' },
      { x: 500, y: 280, width: 130, height: 28, tipe: 'platform' },

      // Jembatan Kayu (x: 760 .. 960, y: 432)
      // Catatan: Jika belum selesai, tengah jembatan bolong & ada penghalang
      { x: 760, y: 432, width: 200, height: 32, tipe: 'jembatan' },

      // Tanah 2: Area Tengah (x: 960 .. 2100, y: 444)
      { x: 960, y: 444, width: 1140, height: 96, tipe: 'tanah' },

      // Platform dekat Bunga & Kincir
      { x: 1250, y: 360, width: 110, height: 28, tipe: 'platform' },
      { x: 1600, y: 340, width: 140, height: 28, tipe: 'platform' },
      { x: 1850, y: 290, width: 130, height: 28, tipe: 'platform' },

      // Tanah 3: Saluran Kincir & Area Koleksi (x: 2100 .. 3600, y: 444)
      { x: 2100, y: 444, width: 1500, height: 96, tipe: 'tanah' },

      // Platform zona koleksi ekosistem
      { x: 2320, y: 350, width: 100, height: 26, tipe: 'platform' },
      { x: 2500, y: 270, width: 110, height: 26, tipe: 'platform' },
      { x: 2700, y: 340, width: 120, height: 26, tipe: 'platform' },
      { x: 2900, y: 260, width: 130, height: 26, tipe: 'platform' }
    ];

    // Koleksi 6 Objek Ekosistem di Area x: 2300 - 3000
    this.collectibleItems = [
      // 3 Komponen Biotik
      { id: 'bio_kupu', tipe: 'biotik', nama: 'Kupu-kupu Biru 🦋', x: 2350, y: 300, r: 18, diambil: false },
      { id: 'bio_jamur', tipe: 'biotik', nama: 'Jamur Hutan 🍄', x: 2540, y: 225, r: 18, diambil: false },
      { id: 'bio_ulat', tipe: 'biotik', nama: 'Ulat Daun 🐛', x: 2740, y: 295, r: 18, diambil: false },

      // 3 Komponen Abiotik
      { id: 'abio_air', tipe: 'abiotik', nama: 'Tetes Air Sungai 💧', x: 2420, y: 400, r: 18, diambil: false },
      { id: 'abio_batu', tipe: 'abiotik', nama: 'Batu Kerikil 🪨', x: 2620, y: 400, r: 18, diambil: false },
      { id: 'abio_cahaya', tipe: 'abiotik', nama: 'Kristal Sinar Mentari ☀️', x: 2940, y: 215, r: 18, diambil: false }
    ];
  }

  pasangInputListener() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  lepasInputListener() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  handleKeyDown(e) {
    if (this.dialogAktif) return;
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this.keys.left = true;
    if (k === 'arrowright' || k === 'd') this.keys.right = true;
    if (k === 'arrowup' || k === 'w' || k === ' ') {
      this.keys.up = true;
      e.preventDefault();
    }
    if (k === 'e' || k === 'enter') {
      this.keys.interact = true;
      this.periksaPemicuInteraksi();
    }
  }

  handleKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this.keys.left = false;
    if (k === 'arrowright' || k === 'd') this.keys.right = false;
    if (k === 'arrowup' || k === 'w' || k === ' ') this.keys.up = false;
    if (k === 'e' || k === 'enter') this.keys.interact = false;
  }

  mulai() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.loop);
  }

  berhenti() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  cleanup() {
    this.berhenti();
    this.lepasInputListener();
    this.particles = [];
  }

  // ==========================================================================
  // GAME LOOP: UPDATE & RENDER (60 FPS)
  // ==========================================================================
  loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.dialogAktif) {
      this.updateFisika();
      this.updateKamera();
      this.updateKoleksi();
      this.updatePartikel();
    }

    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  updateFisika() {
    const p = this.player;

    // Horizontal Movement
    if (this.keys.left) {
      p.vx = -p.speed;
      p.facing = -1;
    } else if (this.keys.right) {
      p.vx = p.speed;
      p.facing = 1;
    } else {
      p.vx *= 0.78; // Gesekan alami
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    }

    // Melompat
    if (this.keys.up && p.onGround) {
      p.vy = p.jumpForce;
      p.onGround = false;
      adventureAudio.playJump();
      this.buatPartikelDebu(p.x + p.width / 2, p.y + p.height, 5);
    }

    // Terapkan Gravitasi
    p.vy += p.gravity;
    if (p.vy > 14) p.vy = 14; // Batas kecepatan jatuh terminal

    // Prediksi posisi baru
    let newX = p.x + p.vx;
    let newY = p.y + p.vy;

    // Batasi batas kiri dunia
    if (newX < 0) newX = 0;

    // Penghalang Jembatan jika belum selesai diperbaiki (x: 750 .. 960)
    if (!this.stateLevel.jembatanSelesai) {
      if (newX + p.width > 750 && p.x < 760) {
        newX = 750 - p.width;
        p.vx = 0;
      }
    }

    // Penghalang Gerbang Akhir jika belum selesai
    if (!this.stateLevel.koleksiSelesai) {
      if (newX + p.width > 3100 && p.x + p.width <= 3100) {
        newX = 3100 - p.width;
        p.vx = 0;
      }
    }

    // Deteksi Tabrakan Platform Solid
    p.onGround = false;
    for (const plat of this.solidPlatforms) {
      // Abaikan jembatan jika belum diperbaiki
      if (plat.tipe === 'jembatan' && !this.stateLevel.jembatanSelesai) {
        continue;
      }

      // Tabrakan vertikal (mendarat di atas permukaan)
      const tabrakX = newX + p.width > plat.x + 4 && newX < plat.x + plat.width - 4;
      const mendarat = p.y + p.height <= plat.y + 12 && newY + p.height >= plat.y;

      if (tabrakX && mendarat && p.vy >= 0) {
        newY = plat.y - p.height;
        p.vy = 0;
        p.onGround = true;
      }
    }

    // Terapkan posisi akhir
    p.x = newX;
    p.y = newY;

    // Jika jatuh ke jurang (misal di bawah jembatan saat rusak), respawn aman di pos terdekat
    if (p.y > this.worldHeight + 30) {
      this.respawnPlayer();
    }

    // Update State Animasi Sprite
    if (!p.onGround) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.5) {
      p.state = 'run';
      p.animTimer += 0.2;
      p.animFrame = 1 + (Math.floor(p.animTimer) % 4);
    } else {
      p.state = 'idle';
      p.animFrame = 0;
    }
  }

  respawnPlayer() {
    const p = this.player;
    if (p.x < 900) {
      p.x = 200;
      p.y = 380;
    } else if (p.x < 2100) {
      p.x = 1050;
      p.y = 380;
    } else {
      p.x = 2200;
      p.y = 380;
    }
    p.vx = 0;
    p.vy = 0;
    this.buatPartikelDebu(p.x + p.width / 2, p.y + p.height, 12);
  }

  updateKamera() {
    // Kamera mengikuti pemain secara mulus (smooth lerp) dengan deadzone di tengah
    const targetX = this.player.x - this.virtualWidth / 2 + this.player.width / 2;
    this.camera.x += (targetX - this.camera.x) * 0.12;

    // Batasi kamera dalam batas dunia
    if (this.camera.x < 0) this.camera.x = 0;
    if (this.camera.x > this.worldWidth - this.virtualWidth) {
      this.camera.x = this.worldWidth - this.virtualWidth;
    }
  }

  updateKoleksi() {
    const p = this.player;
    const px = p.x + p.width / 2;
    const py = p.y + p.height / 2;

    for (const item of this.collectibleItems) {
      if (item.diambil) continue;
      const dx = px - item.x;
      const dy = py - item.y;
      if (dx * dx + dy * dy < (item.r + 20) * (item.r + 20)) {
        item.diambil = true;
        adventureAudio.playCoin();
        this.tambahKoin(3);

        if (item.tipe === 'biotik') {
          this.stateLevel.koleksiItem.biotik++;
        } else {
          this.stateLevel.koleksiItem.abiotik++;
        }

        this.buatPartikelKilau(item.x, item.y, item.tipe === 'biotik' ? '#22C55E' : '#38BDF8', 12);
        this.perbaruiHUD();

        // Cek jika seluruh komponen telah terkumpul
        if (
          this.stateLevel.koleksiItem.biotik >= this.stateLevel.koleksiItem.targetBiotik &&
          this.stateLevel.koleksiItem.abiotik >= this.stateLevel.koleksiItem.targetAbiotik &&
          !this.stateLevel.koleksiSelesai
        ) {
          this.stateLevel.koleksiSelesai = true;
          this.stateLevel.misiSelesai++;
          adventureAudio.playSuccess();
          this.tambahKoin(10);
          this.perbaruiHUD();
        }
      }
    }
  }

  // ==========================================================================
  // PEMICU INTERAKSI TANTANGAN IPAS
  // ==========================================================================
  periksaPemicuInteraksi() {
    const px = this.player.x + this.player.width / 2;

    // 1. Dekat Jembatan Rusak (x: ~700..780)
    if (px >= 680 && px <= 780 && !this.stateLevel.jembatanSelesai) {
      this.bukaDialogTantangan(TANTANGAN_LEVEL_1.jembatan, () => {
        this.stateLevel.jembatanSelesai = true;
        this.stateLevel.misiSelesai++;
        this.tambahKoin(5);
        this.buatPartikelKilau(850, 420, '#F59E0B', 24);
        this.perbaruiHUD();
      });
      return;
    }

    // 2. Dekat Bunga Padang Layu (x: ~1350..1480)
    if (px >= 1350 && px <= 1480 && !this.stateLevel.bungaSelesai) {
      this.bukaDialogTantangan(TANTANGAN_LEVEL_1.bunga, () => {
        this.stateLevel.bungaSelesai = true;
        this.stateLevel.misiSelesai++;
        this.tambahKoin(5);
        this.buatPartikelKilau(1400, 390, '#EC4899', 30);
        this.perbaruiHUD();
      });
      return;
    }

    // 3. Dekat Kincir Air (x: ~2000..2120)
    if (px >= 2000 && px <= 2120 && !this.stateLevel.kincirSelesai) {
      this.bukaDialogTantangan(TANTANGAN_LEVEL_1.kincir, () => {
        this.stateLevel.kincirSelesai = true;
        this.stateLevel.misiSelesai++;
        this.tambahKoin(5);
        this.buatPartikelKilau(2070, 350, '#38BDF8', 30);
        this.perbaruiHUD();
      });
      return;
    }

    // 5. Dekat Gerbang Penjaga Akhir (x: ~3250..3400)
    if (px >= 3250 && px <= 3400 && !this.stateLevel.gerbangSelesai) {
      this.bukaDialogTantangan(TANTANGAN_LEVEL_1.gerbang_1, () => {
        // Lanjut ke tantangan gerbang bagian 2
        setTimeout(() => {
          this.bukaDialogTantangan(TANTANGAN_LEVEL_1.gerbang_2, () => {
            this.stateLevel.gerbangSelesai = true;
            this.stateLevel.misiSelesai++;
            this.tambahKoin(15);
            this.buatPartikelKilau(3360, 280, '#FBBF24', 50);
            this.perbaruiHUD();
            this.tampilkanKemenanganLevel();
          });
        }, 400);
      });
      return;
    }
  }

  bukaDialogTantangan(dataTantangan, onSelesai) {
    this.dialogAktif = true;
    this.callbackTantanganSelesai = onSelesai;

    const overlay = document.getElementById('dialog-tantangan-overlay');
    if (!overlay) return;

    document.getElementById('dialog-judul').textContent = dataTantangan.judul;
    document.getElementById('dialog-instruksi').textContent = dataTantangan.instruksi;
    document.getElementById('dialog-soal-teks').textContent = dataTantangan.pertanyaan;

    const wadahOpsi = document.getElementById('dialog-grid-opsi');
    wadahOpsi.innerHTML = '';

    const wadahFeedback = document.getElementById('dialog-feedback-wadah');
    wadahFeedback.className = 'dialog-feedback-wadah';
    wadahFeedback.style.display = 'none';

    const keys = ['1', '2', '3', '4'];
    dataTantangan.opsi.forEach((opsiTeks, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opsi-adventure';
      btn.innerHTML = `<span class="opsi-key-badge">${keys[idx]}</span> <span>${opsiTeks}</span>`;

      btn.onclick = () => {
        if (idx === dataTantangan.kunci) {
          // Jawaban Benar
          adventureAudio.playSuccess();
          wadahFeedback.className = 'dialog-feedback-wadah sukses';
          wadahFeedback.innerHTML = `<strong>Hebat Sekali! Jawabanmu Benar!</strong><br>${dataTantangan.penjelasan}`;
          wadahFeedback.style.display = 'block';

          // Nonaktifkan tombol opsi sementara
          wadahOpsi.querySelectorAll('button').forEach(b => b.disabled = true);

          setTimeout(() => {
            overlay.classList.remove('aktif');
            this.dialogAktif = false;
            if (this.callbackTantanganSelesai) {
              this.callbackTantanganSelesai();
            }
          }, 1400);
        } else {
          // Jawaban Salah: feedback mendidik, beri kesempatan coba lagi
          adventureAudio.playWrong();
          wadahFeedback.className = 'dialog-feedback-wadah gagal';
          wadahFeedback.innerHTML = `<strong>Yuk, periksa lagi!</strong> Belum tepat. <em>Petunjuk: ${dataTantangan.penjelasan}</em>`;
          wadahFeedback.style.display = 'block';
        }
      };

      wadahOpsi.appendChild(btn);
    });

    overlay.classList.add('aktif');
  }

  tambahKoin(jumlah) {
    this.stateLevel.koinTerkumpul += jumlah;
    this.perbaruiHUD();
  }

  perbaruiHUD() {
    if (typeof document === 'undefined') return;
    const elKoin = document.getElementById('hud-koin-jumlah');
    const elMisi = document.getElementById('hud-misi-teks');
    if (elKoin) elKoin.textContent = this.stateLevel.koinTerkumpul;
    if (elMisi) elMisi.textContent = `Misi: ${this.stateLevel.misiSelesai}/${this.stateLevel.totalMisi}`;
  }

  tampilkanKemenanganLevel() {
    adventureAudio.playSuccess();
    this.player.state = 'cheer';

    // Hitung Bintang & Simpan Progres
    const stars = 3;
    const coins = this.stateLevel.koinTerkumpul;
    const score = 1000 + coins * 50;

    adventureProgress.selesaikanLevel(1, stars, coins, score);

    setTimeout(() => {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-victory-overlay');
      if (modal) {
        document.getElementById('victory-koin').textContent = `+${coins} Koin Daun 🍃`;
        document.getElementById('victory-skor').textContent = `Skor Petualangan: ${score}`;
        modal.classList.add('aktif');
      }
    }, 1200);
  }

  // ==========================================================================
  // PARTIKEL VISUAL (DEBU & KILAU BINTANG)
  // ==========================================================================
  buatPartikelDebu(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 2,
        size: Math.random() * 4 + 2,
        color: '#D1D5DB',
        alpha: 0.9,
        life: 0.4
      });
    }
  }

  buatPartikelKilau(x, y, color = '#FACC15', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 5 + 3,
        color,
        alpha: 1,
        life: 0.8
      });
    }
  }

  updatePartikel() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.03;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ==========================================================================
  // RENDERING DUNIA PLATFORMER
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    const cx = this.camera.x;

    ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 1. Layer 1: Parallax Sky (bergerak sangat lambat 0.1x)
    if (this.assetsLoaded && this.assets.sky.complete) {
      const skyOffset = (cx * 0.1) % 960;
      ctx.drawImage(this.assets.sky, -skyOffset, 0, 960, 540);
      ctx.drawImage(this.assets.sky, 960 - skyOffset, 0, 960, 540);
    } else {
      ctx.fillStyle = '#78C4D4';
      ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // 2. Layer 2: Parallax Midground Trees & Hills (bergerak 0.35x)
    if (this.assetsLoaded && this.assets.trees.complete) {
      const treeOffset = (cx * 0.35) % 960;
      ctx.drawImage(this.assets.trees, -treeOffset, 180, 960, 360);
      ctx.drawImage(this.assets.trees, 960 - treeOffset, 180, 960, 360);
    }

    // 3. Layer 3: Playfield (Dunia Nyata Platform & Tantangan)
    ctx.save();
    ctx.translate(-cx, 0);

    this.renderPlatformDanTanah(ctx);
    this.renderObjekTantangan(ctx);
    this.renderKoleksiItem(ctx);
    this.renderPartikel(ctx);
    this.renderPemain(ctx);

    ctx.restore();
  }

  renderPlatformDanTanah(ctx) {
    for (const plat of this.solidPlatforms) {
      if (plat.tipe === 'tanah') {
        // Lapisan rumput hijau subur di atas tanah
        ctx.fillStyle = '#4AB23E';
        ctx.fillRect(plat.x, plat.y, plat.width, 16);
        ctx.fillStyle = '#2E7D4F';
        ctx.fillRect(plat.x, plat.y + 14, plat.width, 4);

        // Lapisan tanah lempung cokelat subur
        ctx.fillStyle = '#8E552A';
        ctx.fillRect(plat.x, plat.y + 18, plat.width, plat.height - 18);
      } else if (plat.tipe === 'platform') {
        // Platform melayang
        ctx.fillStyle = '#4AB23E';
        ctx.fillRect(plat.x, plat.y, plat.width, 8);
        ctx.fillStyle = '#8E552A';
        ctx.fillRect(plat.x, plat.y + 8, plat.width, plat.height - 8);
      }
    }

    // Jurang Sungai Padang Rumput (x: 760 .. 960, y: 444 .. 540)
    ctx.fillStyle = '#23708A';
    ctx.fillRect(760, 480, 200, 60);

    // Ombak buih sungai
    ctx.fillStyle = '#FFFDF7';
    for (let i = 770; i < 950; i += 32) {
      ctx.fillRect(i + Math.sin(performance.now() * 0.005 + i) * 6, 484, 20, 4);
    }
  }

  renderObjekTantangan(ctx) {
    // 1. Tantangan 1: Jembatan Kayu (x: 760, y: 432)
    if (this.stateLevel.jembatanSelesai) {
      // Jembatan tersambung utuh sempurna
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(760, 432, 200, 14);
      ctx.fillStyle = '#8C552D';
      ctx.fillRect(760, 420, 8, 24);
      ctx.fillRect(860, 420, 8, 24);
      ctx.fillRect(952, 420, 8, 24);
    } else {
      // Jembatan patah terbelah
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(760, 432, 60, 14);
      ctx.fillRect(900, 432, 60, 14);

      // Papan tanda peringatan interaksi
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(740, 400, 24, 24);
      ctx.fillStyle = '#FFFDF7';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('!', 749, 417);

      // Label interaksi
      if (Math.abs((this.player.x + this.player.width / 2) - 740) < 60) {
        this.renderPetunjukInteraksi(ctx, 740, 380, 'Perbaiki Jembatan');
      }
    }

    // 2. Tantangan 2: Bunga Padang Rumput (x: 1400, y: 400)
    if (this.stateLevel.bungaSelesai) {
      // Bunga mekar semerbak pink & kuning cerah
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(1408, 410, 4, 34); // Tangkai segar
      ctx.beginPath();
      ctx.arc(1410, 396, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#F43F5E';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1410, 396, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FACC15';
      ctx.fill();
    } else {
      // Bunga layu cokelat keemasan
      ctx.fillStyle = '#78733C';
      ctx.fillRect(1408, 420, 4, 24); // Tangkai melengkung layu
      ctx.beginPath();
      ctx.arc(1402, 412, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#B4825A';
      ctx.fill();

      if (Math.abs((this.player.x + this.player.width / 2) - 1410) < 60) {
        this.renderPetunjukInteraksi(ctx, 1410, 365, 'Bantu Bunga Liar');
      }
    }

    // 3. Tantangan 3: Kincir Air (x: 2060, y: 380)
    ctx.save();
    ctx.translate(2060, 380);
    const rotSpeed = this.stateLevel.kincirSelesai ? performance.now() * 0.0025 : 0;
    ctx.rotate(rotSpeed);

    // Roda kincir
    ctx.strokeStyle = '#8C552D';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    // 8 Bilah kincir
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(-4, -36, 8, 20);
    }
    ctx.restore();

    // As roda kincir
    ctx.fillStyle = '#4A2810';
    ctx.beginPath();
    ctx.arc(2060, 380, 8, 0, Math.PI * 2);
    ctx.fill();

    if (!this.stateLevel.kincirSelesai && Math.abs((this.player.x + this.player.width / 2) - 2060) < 60) {
      this.renderPetunjukInteraksi(ctx, 2060, 315, 'Putar Kincir Air');
    }

    // 5. Tantangan 5: Gerbang Penjaga Kuno (x: 3350, y: 320)
    // Pilar Gerbang
    ctx.fillStyle = '#78827D';
    ctx.fillRect(3320, 300, 30, 144);
    ctx.fillRect(3430, 300, 30, 144);
    ctx.fillRect(3320, 276, 140, 28);

    if (this.stateLevel.gerbangSelesai) {
      // Gerbang terbuka dengan portal cahaya hijau bercahaya
      ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
      ctx.fillRect(3350, 304, 80, 140);
    } else {
      ctx.fillStyle = '#374151';
      ctx.fillRect(3350, 304, 80, 140);
      if (Math.abs((this.player.x + this.player.width / 2) - 3390) < 80) {
        this.renderPetunjukInteraksi(ctx, 3390, 250, 'Buka Gerbang Padang');
      }
    }
  }

  renderKoleksiItem(ctx) {
    for (const item of this.collectibleItems) {
      if (item.diambil) continue;

      const bob = Math.sin(performance.now() * 0.005 + item.x) * 4;

      // Lingkaran kilau latar
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, item.r, 0, Math.PI * 2);
      ctx.fillStyle = item.tipe === 'biotik' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // Ikon visual item
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = item.id.includes('kupu') ? '🦋' :
                   item.id.includes('jamur') ? '🍄' :
                   item.id.includes('ulat') ? '🐛' :
                   item.id.includes('air') ? '💧' :
                   item.id.includes('batu') ? '🪨' : '☀️';
      ctx.fillText(icon, item.x, item.y + bob);
    }
  }

  renderPetunjukInteraksi(ctx, x, y, teks) {
    ctx.save();
    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = '#1B3A2F';
    ctx.lineWidth = 2.5;

    const boxWidth = ctx.measureText(teks).width + 36;
    ctx.beginPath();
    ctx.roundRect(x - boxWidth / 2, y, boxWidth, 28, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F2A541';
    ctx.fillRect(x - boxWidth / 2 + 5, y + 4, 20, 20);
    ctx.fillStyle = '#1B3A2F';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E', x - boxWidth / 2 + 15, y + 18);

    ctx.fillStyle = '#1B3A2F';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(teks, x - boxWidth / 2 + 30, y + 18);
    ctx.restore();
  }

  renderPartikel(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderPemain(ctx) {
    const p = this.player;

    ctx.save();
    ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
    ctx.scale(p.facing, 1);

    if (this.assetsLoaded && this.assets.character.complete) {
      // 8 Frame @ 48x48
      const frameIdx = p.state === 'idle' ? 0 :
                       p.state === 'run' ? p.animFrame :
                       p.state === 'jump' ? 5 :
                       p.state === 'fall' ? 6 : 7;

      ctx.drawImage(
        this.assets.character,
        frameIdx * 48, 0, 48, 48,
        -p.width / 2 - 2, -p.height / 2, 48, 48
      );
    } else {
      // Fallback procedural rendering
      ctx.fillStyle = '#2E7D4F';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.fillStyle = '#F2A541';
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, 14); // Hat
    }

    ctx.restore();
  }
}
