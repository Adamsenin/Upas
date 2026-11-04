/**
 * KUPAS KUIS IPAS v4.3 - Mesin Petualangan Mandiri (adventure-platformer.js)
 * Platformer 2D Side-scroller Edukasi IPAS Kelas V SD
 *
 * Phase 2 - Custom Character & Asset Integration:
 * - Karakter Tunggal Orisinal: Aliya Penjelajah (character-aliya.png).
 * - Konfigurasi Karakter Terpisah (adventure-character-config.js).
 * - Konfigurasi Lingkungan Terpisah (adventure-env-config.js) -> Pisahkan Visual & Collision.
 * - Pemuatan Asinkron dengan Proteksi Anti-Flicker (Game loop tidak mulai sebelum aset siap).
 * - 7 Animasi Sprite Lengkap: idle, run, jump, fall, land, hurt, celebrate.
 * - Animasi Presisi Berbasis Delta Time (dt) & Penjajaran Titik Kaki (Zero Floating / Sinking).
 * - Fisika & Hitbox Logis Tetap Invarian (44x48 px, speed 4.4, jump -12.8, gravity 0.58).
 * - 5 Tantangan Edukasi IPAS Mandiri (Jembatan, Bunga, Kincir, Koleksi, Gerbang).
 * - Pembersihan Memori & Event Listener pada Cleanup.
 */

import { CHARACTER_CONFIG } from './adventure-character-config.js';
import { ENV_COLLISION_DATA, ENV_VISUAL_ASSETS } from './adventure-env-config.js';

// ============================================================================
// 1. MANAJEMEN PENYIMPANAN PROGRES ADVENTURE
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

    const nextLevel = levelId + 1;
    if (p.levels[nextLevel]) {
      p.levels[nextLevel].unlocked = true;
    }

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
      osc.frequency.exponentialRampToValueAtTime(340, this.ctx.currentTime + 0.15);
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
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
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
      osc.frequency.linearRampToValueAtTime(160, now + 0.22);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kupas_suara_aktif', this.muted ? 'false' : 'true');
    }
    return !this.muted;
  }
}

export const adventureAudio = new AdventureAudio();

// ============================================================================
// 3. ANIMATOR SPRITE DELTA-TIME (7 ANIMASI: IDLE, RUN, JUMP, FALL, LAND, HURT, CELEBRATE)
// ============================================================================
export class SpriteAnimator {
  constructor(charConfig = CHARACTER_CONFIG) {
    this.config = charConfig;
    this.currentAnim = 'idle';
    this.frameIndex = 0;
    this.timer = 0;
  }

  play(animName) {
    if (this.currentAnim === animName) return;
    this.currentAnim = animName;
    this.frameIndex = 0;
    this.timer = 0;
  }

  update(dt = 0.016) {
    const anim = this.config.animations[this.currentAnim] || this.config.animations.idle;
    if (!anim || !anim.frames || anim.frames.length === 0) return;

    this.timer += dt * (anim.fps || 6);
    if (this.timer >= 1) {
      const step = Math.floor(this.timer);
      this.timer -= step;
      this.frameIndex += step;

      if (this.frameIndex >= anim.frames.length) {
        if (anim.loop !== false) {
          this.frameIndex = this.frameIndex % anim.frames.length;
        } else {
          this.frameIndex = anim.frames.length - 1;
        }
      }
    }
  }

  getCurrentFrameData() {
    const anim = this.config.animations[this.currentAnim] || this.config.animations.idle;
    if (!anim || !anim.frames || anim.frames.length === 0) {
      return this.config.animations.idle.frames[0];
    }
    const idx = Math.min(this.frameIndex, anim.frames.length - 1);
    return anim.frames[idx];
  }

  /**
   * Menggambar sprite dengan titik kaki yang konsisten
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLImageElement} img
   * @param {number} footCenterX - Posisi X kaki karakter di dunia game
   * @param {number} footBottomY - Posisi Y dasar kaki karakter di dunia game
   * @param {number} facing - 1 (kanan) atau -1 (kiri)
   */
  draw(ctx, img, footCenterX, footBottomY, facing = 1) {
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    const f = this.getCurrentFrameData();
    const scale = this.config.visualScale || 0.115;

    const destW = f.sw * scale;
    const destH = f.sh * scale;
    const footOffsetY = f.footOffset * scale;
    const centerOffsetX = f.centerX * scale;

    ctx.save();
    ctx.translate(footCenterX, footBottomY);
    ctx.scale(facing, 1);

    // Gambar frame tepat dari source rectangle (sx, sy, sw, sh)
    ctx.drawImage(
      img,
      f.sx, f.sy, f.sw, f.sh,
      -centerOffsetX, -footOffsetY, destW, destH
    );

    ctx.restore();
    return true;
  }
}

// ============================================================================
// 4. BANK SOAL & TANTANGAN IPAS PADANG RUMPUT (STANDALONE)
// ============================================================================
const TANTANGAN_LEVEL_1 = {
  jembatan: {
    id: 't1_jembatan',
    judul: 'Tantangan 1: Jembatan Rusak',
    instruksi: 'Jembatan kayu patah! Butuh pemahaman bahan alam dari sekitar sungai.',
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
    instruksi: 'Bunga padang layu kepanasan. Agar berfotosintesis dan kembali mekar, apa yang dibutuhkannya?',
    pertanyaan: 'Bahan apakah yang diserap oleh akar tumbuhan dari dalam tanah dan daun dari udara untuk proses fotosintesis?',
    opsi: [
      'Menghirup gas oksigen dan pupuk buatan',
      'Air dari tanah dan gas karbon dioksida dari udara',
      'Minyak tanah dan sari gula pasir',
      'Gas nitrogen dan serbuk kapur'
    ],
    kunci: 1,
    penjelasan: 'Tumbuhan hijau membutuhkan air dari tanah dan karbon dioksida (CO2) dari udara, dibantu cahaya matahari dan klorofil.'
  },
  kincir: {
    id: 't3_kincir',
    judul: 'Tantangan 3: Kincir Air Macet',
    instruksi: 'Saluran irigasi macet sehingga kincir air berhenti berputar. Bagaimana kincir air dapat berputar kembali?',
    pertanyaan: 'Perubahan bentuk energi apakah yang dimanfaatkan kincir air dari arus sungai untuk menyiram padang rumput?',
    opsi: [
      'Energi panas bumi menjadi energi listrik',
      'Energi kinetik (gerak) air mengalir menjadi energi gerak kincir',
      'Energi bunyi air menjadi energi magnet',
      'Energi kimia air menjadi energi cahaya'
    ],
    kunci: 1,
    penjelasan: 'Arus air sungai yang mengalir memiliki energi kinetik (gerak) yang mendorong bilah kincir menjadi gerak mekanis.'
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
    penjelasan: 'Rumput hijau adalah produsen karena mampu membuat makanannya sendiri melalui proses fotosintesis.'
  },
  gerbang_2: {
    id: 't5_gerbang_2',
    judul: 'Ujian Penjaga: Keseimbangan Ekosistem',
    instruksi: 'Pertanyaan penutup sebelum Gerbang Kemenangan terbuka!',
    pertanyaan: 'Jika populasi katak di padang rumput punah karena diburu, dampak langsung apa yang terjadi pada rantai makanan?',
    opsi: [
      'Populasi belalang melonjak pesat karena pemangsanya hilang',
      'Rumput bertumbuh sangat subur melimpah',
      'Populasi ular langsung berlipat ganda',
      'Seluruh tumbuhan langsung layu seketika'
    ],
    kunci: 0,
    penjelasan: 'Katak adalah predator pengendali belalang. Jika katak punah, belalang melonjak drastis dan merusak rumput.'
  }
};

// ============================================================================
// 5. KELAS MESIN PERMAINAN PLATFORMER 2D (GAME ENGINE)
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
    this.worldWidth = ENV_COLLISION_DATA.worldWidth || 3600;
    this.worldHeight = ENV_COLLISION_DATA.worldHeight || 540;

    // Karakter Utama Orisinal & Animator
    this.characterConfig = CHARACTER_CONFIG;
    this.animator = new SpriteAnimator(this.characterConfig);

    // Cache Aset Gambar
    this.assets = {
      character: new Image(),
      sky: new Image(),
      trees: new Image(),
      tileset: new Image()
    };
    this.assetsLoaded = false;
    this.isLoadingAssets = false;

    // Game loop & Timing
    this.isRunning = false;
    this.rafId = null;
    this.lastTime = 0;

    // Kamera side-scroller
    this.camera = { x: 0, y: 0 };

    // Karakter Pemain (Hitbox & Fisika Invarian)
    this.player = {
      x: 100,
      y: 380,
      width: CHARACTER_CONFIG.hitbox.width,   // 44
      height: CHARACTER_CONFIG.hitbox.height, // 48
      vx: 0,
      vy: 0,
      speed: 4.4,
      jumpForce: -12.8,
      gravity: 0.58,
      onGround: false,
      facing: 1, // 1: kanan, -1: kiri
      state: 'idle', // idle, run, jump, fall, land, hurt, celebrate
      hurtTimer: 0,
      celebrateTimer: 0,
      landTimer: 0
    };

    // Input Controller
    this.keys = {
      left: false,
      right: false,
      up: false,
      interact: false
    };

    // State Tantangan Level 1
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

    // Partikel Visual & Koleksi
    this.particles = [];
    this.collectibleItems = [];
    this.solidPlatforms = [...ENV_COLLISION_DATA.platforms];

    // Pointer ke dialog tantangan UI
    this.dialogAktif = false;
    this.callbackTantanganSelesai = null;

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.loop = this.loop.bind(this);
  }

  /**
   * Pemuatan aset secara asinkron dengan proteksi anti-flicker
   */
  async inisialisasi() {
    await this.muatSemuaAset();
    this.bangunDuniaLevel1();
    this.pasangInputListener();
  }

  loadImagePromise(img, src, fallbackSrc = null) {
    return new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => {
        if (fallbackSrc && src !== fallbackSrc) {
          console.warn(`Gagal memuat ${src}, beralih ke fallback ${fallbackSrc}`);
          img.src = fallbackSrc;
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        } else {
          console.warn(`Gagal memuat aset: ${src}`);
          resolve(false);
        }
      };
      img.src = src;
    });
  }

  async muatSemuaAset() {
    if (this.assetsLoaded) return;
    this.isLoadingAssets = true;

    const env = ENV_VISUAL_ASSETS.level1;
    const char = this.characterConfig;

    const promises = [
      this.loadImagePromise(this.assets.character, char.spriteSrc, char.fallbackSpriteSrc),
      this.loadImagePromise(this.assets.sky, env.bgSky),
      this.loadImagePromise(this.assets.trees, env.bgTrees),
      this.loadImagePromise(this.assets.tileset, env.tileset)
    ];

    await Promise.allSettled(promises);
    this.assetsLoaded = true;
    this.isLoadingAssets = false;
  }

  bangunDuniaLevel1() {
    this.solidPlatforms = JSON.parse(JSON.stringify(ENV_COLLISION_DATA.platforms));
    this.collectibleItems = ENV_VISUAL_ASSETS.collectibles.map(item => ({
      ...item,
      diambil: false
    }));
  }

  pasangInputListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  lepasInputListener() {
    if (typeof window === 'undefined') return;
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

  async mulai() {
    if (this.isRunning) return;

    // Pastikan aset penting sudah siap sebelum game loop diputar (anti-flicker)
    if (!this.assetsLoaded) {
      await this.muatSemuaAset();
    }

    this.isRunning = true;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
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
  // GAME LOOP: UPDATE & RENDER DENGAN DELTA TIME (60 FPS)
  // ==========================================================================
  loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    if (!this.dialogAktif) {
      this.updateFisika(dt);
      this.updateKamera();
      this.updateKoleksi();
      this.updatePartikel();
    }

    this.render();

    this.rafId = requestAnimationFrame(this.loop);
  }

  updateFisika(dt = 0.016) {
    const p = this.player;
    const wasInAir = !p.onGround;
    const prevVy = p.vy;

    // Horizontal Movement
    if (this.keys.left) {
      p.vx = -p.speed;
      p.facing = -1;
    } else if (this.keys.right) {
      p.vx = p.speed;
      p.facing = 1;
    } else {
      p.vx *= 0.78;
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
    if (p.vy > 14) p.vy = 14;

    let newX = p.x + p.vx;
    let newY = p.y + p.vy;

    if (newX < 0) newX = 0;

    // Penghalang Jembatan Rusak (belum selesai)
    if (!this.stateLevel.jembatanSelesai) {
      const batasKiriJembatan = 750;
      if (p.x + p.width <= batasKiriJembatan && newX + p.width > batasKiriJembatan) {
        newX = batasKiriJembatan - p.width;
        p.vx = 0;
      }
    }

    // Collision Detection Platform Solid
    p.onGround = false;

    for (const plat of this.solidPlatforms) {
      if (plat.tipe === 'jembatan' && !this.stateLevel.jembatanSelesai) {
        continue;
      }

      const playerBottom = p.y + p.height;
      const newBottom = newY + p.height;
      const playerCenterX = newX + p.width / 2;

      if (playerCenterX >= plat.x && playerCenterX <= plat.x + plat.width) {
        if (playerBottom <= plat.y + 10 && newBottom >= plat.y && p.vy >= 0) {
          newY = plat.y - p.height;
          p.vy = 0;
          p.onGround = true;
          break;
        }
      }
    }

    // Deteksi Efek Mendarat (Land State)
    if (wasInAir && p.onGround && prevVy > 4) {
      p.landTimer = 0.14;
      this.buatPartikelDebu(p.x + p.width / 2, p.y + p.height, 4);
    }

    p.x = newX;
    p.y = newY;

    // Respawn aman jika jatuh ke jurang sungai
    if (p.y > this.worldHeight + 30) {
      this.respawnPlayer();
    }

    // Evaluasi 7 State Animasi Sprite Karakter
    if (p.hurtTimer > 0) {
      p.hurtTimer -= dt;
      p.state = 'hurt';
    } else if (p.celebrateTimer > 0) {
      p.celebrateTimer -= dt;
      p.state = 'celebrate';
    } else if (p.landTimer > 0) {
      p.landTimer -= dt;
      p.state = 'land';
    } else if (!p.onGround) {
      p.state = p.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 0.5) {
      p.state = 'run';
    } else {
      p.state = 'idle';
    }

    // Sinkronkan ke Animator Sprite Berbasis Delta Time
    this.animator.play(p.state);
    this.animator.update(dt);
  }

  respawnPlayer() {
    const p = this.player;
    p.hurtTimer = 0.5;
    p.state = 'hurt';
    adventureAudio.playWrong();

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
  }

  updateKamera() {
    const targetCamX = this.player.x - this.virtualWidth * 0.35;
    this.camera.x += (targetCamX - this.camera.x) * 0.12;

    if (this.camera.x < 0) this.camera.x = 0;
    const maxCamX = this.worldWidth - this.virtualWidth;
    if (this.camera.x > maxCamX) this.camera.x = maxCamX;
  }

  updateKoleksi() {
    const px = this.player.x + this.player.width / 2;
    const py = this.player.y + this.player.height / 2;

    for (const item of this.collectibleItems) {
      if (item.diambil) continue;

      const dx = px - item.x;
      const dy = py - item.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < item.r + this.player.width / 2) {
        item.diambil = true;
        this.tambahKoin(3);
        adventureAudio.playCoin();
        this.buatPartikelKilau(item.x, item.y, item.tipe === 'biotik' ? '#22C55E' : '#38BDF8', 12);

        if (item.tipe === 'biotik') {
          this.stateLevel.koleksiItem.biotik++;
        } else {
          this.stateLevel.koleksiItem.abiotik++;
        }

        const k = this.stateLevel.koleksiItem;
        if (!this.stateLevel.koleksiSelesai && k.biotik >= k.targetBiotik && k.abiotik >= k.targetAbiotik) {
          this.stateLevel.koleksiSelesai = true;
          this.stateLevel.misiSelesai++;
          this.tambahKoin(10);
          adventureAudio.playSuccess();
          this.buatPartikelKilau(this.player.x + 20, this.player.y - 10, '#F59E0B', 30);
          this.perbaruiHUD();
        }
      }
    }
  }

  periksaPemicuInteraksi() {
    const px = this.player.x + this.player.width / 2;

    // 1. Dekat Jembatan Rusak (x: ~680..780)
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

    // 4. Dekat Gerbang Penjaga Akhir (x: ~3250..3400)
    if (px >= 3250 && px <= 3400 && !this.stateLevel.gerbangSelesai) {
      this.bukaDialogTantangan(TANTANGAN_LEVEL_1.gerbang_1, () => {
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

    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('dialog-tantangan-overlay');
    if (!overlay) return;

    const elJudul = document.getElementById('dialog-judul');
    const elInstruksi = document.getElementById('dialog-instruksi');
    const elSoal = document.getElementById('dialog-soal-teks');
    if (elJudul) elJudul.textContent = dataTantangan.judul;
    if (elInstruksi) elInstruksi.textContent = dataTantangan.instruksi;
    if (elSoal) elSoal.textContent = dataTantangan.pertanyaan;

    const wadahOpsi = document.getElementById('dialog-grid-opsi');
    if (wadahOpsi) wadahOpsi.innerHTML = '';

    const wadahFeedback = document.getElementById('dialog-feedback-wadah');
    if (wadahFeedback) {
      wadahFeedback.className = 'dialog-feedback-wadah';
      wadahFeedback.style.display = 'none';
    }

    const keys = ['1', '2', '3', '4'];
    dataTantangan.opsi.forEach((opsiTeks, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn-opsi-adventure';
      btn.innerHTML = `<span class="opsi-key-badge">${keys[idx]}</span> <span>${opsiTeks}</span>`;

      btn.onclick = () => {
        if (idx === dataTantangan.kunci) {
          adventureAudio.playSuccess();
          this.player.celebrateTimer = 0.8;
          this.player.state = 'celebrate';

          if (wadahFeedback) {
            wadahFeedback.className = 'dialog-feedback-wadah sukses';
            wadahFeedback.innerHTML = `<strong>Hebat Sekali! Jawabanmu Tepat! 🌟</strong><br>${dataTantangan.penjelasan}`;
            wadahFeedback.style.display = 'block';
          }

          if (wadahOpsi) {
            wadahOpsi.querySelectorAll('button').forEach(b => b.disabled = true);
          }

          setTimeout(() => {
            overlay.classList.remove('aktif');
            this.dialogAktif = false;
            if (this.callbackTantanganSelesai) {
              this.callbackTantanganSelesai();
            }
          }, 1400);
        } else {
          adventureAudio.playWrong();
          this.player.hurtTimer = 0.5;
          this.player.state = 'hurt';

          if (wadahFeedback) {
            wadahFeedback.className = 'dialog-feedback-wadah gagal';
            wadahFeedback.innerHTML = `<strong>Yuk, periksa lagi!</strong> Belum tepat. <em>Petunjuk: ${dataTantangan.penjelasan}</em>`;
            wadahFeedback.style.display = 'block';
          }
        }
      };

      if (wadahOpsi) wadahOpsi.appendChild(btn);
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
    this.player.celebrateTimer = 9999;
    this.player.state = 'celebrate';

    const stars = 3;
    const coins = this.stateLevel.koinTerkumpul;
    const score = 1000 + coins * 50;

    adventureProgress.selesaikanLevel(1, stars, coins, score);

    setTimeout(() => {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-victory-overlay');
      if (modal) {
        const koinEl = document.getElementById('victory-koin');
        const skorEl = document.getElementById('victory-skor');
        if (koinEl) koinEl.textContent = `+${coins} Koin Daun 🍃`;
        if (skorEl) skorEl.textContent = `Skor Petualangan: ${score}`;
        modal.classList.add('aktif');
      }
    }, 1200);
  }

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
  // RENDERING DUNIA PLATFORMER 2D
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    const cx = this.camera.x;

    ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 1. Layer 1: Parallax Sky (bergerak lambat 0.1x)
    if (this.assets.sky && this.assets.sky.complete && this.assets.sky.naturalWidth > 0) {
      const skyOffset = (cx * 0.1) % 960;
      ctx.drawImage(this.assets.sky, -skyOffset, 0, 960, 540);
      ctx.drawImage(this.assets.sky, 960 - skyOffset, 0, 960, 540);
    } else {
      ctx.fillStyle = '#78C4D4';
      ctx.fillRect(0, 0, this.virtualWidth, this.virtualHeight);
    }

    // 2. Layer 2: Parallax Midground Trees & Hills (bergerak 0.35x)
    if (this.assets.trees && this.assets.trees.complete && this.assets.trees.naturalWidth > 0) {
      const treeOffset = (cx * 0.35) % 960;
      ctx.drawImage(this.assets.trees, -treeOffset, 180, 960, 360);
      ctx.drawImage(this.assets.trees, 960 - treeOffset, 180, 960, 360);
    }

    // 3. Layer 3: Playfield (Dunia Platform, Objek, & Pemain)
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
        ctx.fillStyle = '#4AB23E';
        ctx.fillRect(plat.x, plat.y, plat.width, 16);
        ctx.fillStyle = '#2E7D4F';
        ctx.fillRect(plat.x, plat.y + 14, plat.width, 4);

        ctx.fillStyle = '#8E552A';
        ctx.fillRect(plat.x, plat.y + 18, plat.width, plat.height - 18);
      } else if (plat.tipe === 'platform') {
        ctx.fillStyle = '#4AB23E';
        ctx.fillRect(plat.x, plat.y, plat.width, 8);
        ctx.fillStyle = '#8E552A';
        ctx.fillRect(plat.x, plat.y + 8, plat.width, plat.height - 8);
      }
    }

    // Jurang Sungai Padang Rumput
    const rz = ENV_COLLISION_DATA.riverZone;
    ctx.fillStyle = '#23708A';
    ctx.fillRect(rz.x, rz.y, rz.width, rz.height);

    ctx.fillStyle = '#FFFDF7';
    const nowTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    for (let i = rz.x + 10; i < rz.x + rz.width - 10; i += 32) {
      ctx.fillRect(i + Math.sin(nowTime * 0.005 + i) * 6, rz.y + 4, 20, 4);
    }
  }

  renderObjekTantangan(ctx) {
    const nowTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // 1. Jembatan Kayu (x: 760, y: 432)
    if (this.stateLevel.jembatanSelesai) {
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(760, 432, 200, 14);
      ctx.fillStyle = '#8C552D';
      ctx.fillRect(760, 420, 8, 24);
      ctx.fillRect(860, 420, 8, 24);
      ctx.fillRect(952, 420, 8, 24);
    } else {
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(760, 432, 60, 14);
      ctx.fillRect(900, 432, 60, 14);

      ctx.fillStyle = '#DC2626';
      ctx.fillRect(740, 400, 24, 24);
      ctx.fillStyle = '#FFFDF7';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('!', 749, 417);

      if (Math.abs((this.player.x + this.player.width / 2) - 740) < 60) {
        this.renderPetunjukInteraksi(ctx, 740, 380, 'Perbaiki Jembatan');
      }
    }

    // 2. Bunga Padang Rumput (x: 1400, y: 400)
    if (this.stateLevel.bungaSelesai) {
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(1408, 410, 4, 34);
      ctx.beginPath();
      ctx.arc(1410, 396, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#F43F5E';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1410, 396, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#FACC15';
      ctx.fill();
    } else {
      ctx.fillStyle = '#78733C';
      ctx.fillRect(1408, 420, 4, 24);
      ctx.beginPath();
      ctx.arc(1402, 412, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#B4825A';
      ctx.fill();

      if (Math.abs((this.player.x + this.player.width / 2) - 1410) < 60) {
        this.renderPetunjukInteraksi(ctx, 1410, 365, 'Bantu Bunga Liar');
      }
    }

    // 3. Kincir Air (x: 2060, y: 380)
    ctx.save();
    ctx.translate(2060, 380);
    const rotSpeed = this.stateLevel.kincirSelesai ? nowTime * 0.0025 : 0;
    ctx.rotate(rotSpeed);

    ctx.strokeStyle = '#8C552D';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#BE824B';
      ctx.fillRect(-4, -36, 8, 20);
    }
    ctx.restore();

    ctx.fillStyle = '#4A2810';
    ctx.beginPath();
    ctx.arc(2060, 380, 8, 0, Math.PI * 2);
    ctx.fill();

    if (!this.stateLevel.kincirSelesai && Math.abs((this.player.x + this.player.width / 2) - 2060) < 60) {
      this.renderPetunjukInteraksi(ctx, 2060, 315, 'Putar Kincir Air');
    }

    // 4. Gerbang Penjaga Kuno (x: 3350, y: 320)
    ctx.fillStyle = '#78827D';
    ctx.fillRect(3320, 300, 30, 144);
    ctx.fillRect(3430, 300, 30, 144);
    ctx.fillRect(3320, 276, 140, 28);

    if (this.stateLevel.gerbangSelesai) {
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
    const nowTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    for (const item of this.collectibleItems) {
      if (item.diambil) continue;

      const bob = Math.sin(nowTime * 0.005 + item.x) * 4;

      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, item.r, 0, Math.PI * 2);
      ctx.fillStyle = item.tipe === 'biotik' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

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

    // Titik pusat kaki karakter di koordinat dunia game
    const footCenterX = p.x + p.width / 2;
    const footBottomY = p.y + p.height;

    const drew = this.animator.draw(
      ctx,
      this.assets.character,
      footCenterX,
      footBottomY,
      p.facing
    );

    // Fallback procedural rendering hanya jika citra sprite belum siap
    if (!drew) {
      ctx.save();
      ctx.translate(footCenterX, footBottomY);
      ctx.scale(p.facing, 1);
      ctx.fillStyle = '#2E7D4F';
      ctx.fillRect(-p.width / 2, -p.height, p.width, p.height);
      ctx.fillStyle = '#F2A541';
      ctx.fillRect(-p.width / 2, -p.height, p.width, 14);
      ctx.restore();
    }
  }
}
