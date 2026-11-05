/**
 * KUPAS KUIS IPAS v5.2 - Super Mario-Style Adventure Platformer (adventure-platformer.js)
 * Koordinator Mesin Petualangan Mandiri Kelas V SD.
 *
 * Fase A (Dunia 1: Hutan Ceria - Level 1-1 & 1-2):
 * - Karakter Aliya (8 animasi lengkap: idle, walk, run, jump, fall, land, celebrate, hurt)
 * - Fallback Vektor HD Prosedural jika citra sprite belum siap
 * - Parallax 5 Lapis + Elemen Hidup (Burung terbang, kupu-kupu, daun luruh)
 * - Peta Dunia Interaktif & Ringkasan Materi IPAS Dunia 1
 * - Bank 30 Soal IPAS Kelas V (5 soal x 6 level)
 * - BGM Sintetis Ambient Web Audio API per Dunia
 */

import { CHARACTER_CONFIG, drawCharacterProceduralFallback } from './adventure-character-config.js';
import { MarioPhysicsEngine } from './adventure-physics.js';
import { AdventureCamera } from './adventure-camera.js';
import { AdventureEntityManager } from './adventure-entities.js';
import { AdventureQuestionGates } from './adventure-questions.js';
import { AdventureParallaxEngine } from './adventure-parallax.js';
import { adventureAudio } from './adventure-audio.js';
import {
  WORLDS_METADATA,
  ADVENTURE_LEVELS_REGISTRY,
  adventureWorldsProgress
} from './adventure-worlds-data.js';

// Ekspor sistem audio dan progres
export { adventureAudio };
export const adventureProgress = adventureWorldsProgress;

// ============================================================================
// 1. ANIMATOR SPRITE DELTA-TIME (8 ANIMASI SPRITE SHEET)
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

  draw(ctx, img, footCenterX, footBottomY, facing = 1, isInvulnerable = false) {
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    // Efek berkedip saat kebal
    if (isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
      return true;
    }

    const f = this.getCurrentFrameData();
    const scale = this.config.visualScale || 0.115;

    const destW = f.sw * scale;
    const destH = f.sh * scale;
    const footOffsetY = f.footOffset * scale;
    const centerOffsetX = f.centerX * scale;

    ctx.save();
    ctx.translate(footCenterX, footBottomY);
    ctx.scale(facing, 1);

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
// 2. KELAS UTAMA KOORDINATOR GAME (ADVENTURE GAME ENGINE)
// ============================================================================
export class AdventureGameEngine {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.ctx = canvasEl.getContext('2d', { alpha: false });

    // Resolusi Virtual 16:9
    this.virtualWidth = 960;
    this.virtualHeight = 540;

    // Sub-engine Fisika, Parallax 5 Lapis, & Kamera
    this.physics = new MarioPhysicsEngine({
      accel: 0.52,
      friction: 0.82,
      maxSpeed: 5.2,
      jumpForce: -12.0,
      gravity: 0.52
    });
    this.parallax = new AdventureParallaxEngine(this.virtualWidth, this.virtualHeight);
    this.camera = new AdventureCamera(this.virtualWidth, this.virtualHeight, 3800, 540);

    // Karakter & Animator
    this.characterConfig = CHARACTER_CONFIG;
    this.animator = new SpriteAnimator(this.characterConfig);

    // Cache Aset
    this.assets = {
      character: new Image()
    };
    this.assetsLoaded = false;
    this.isLoadingAssets = false;

    // Loop & Waktu
    this.isRunning = false;
    this.rafId = null;
    this.lastTime = 0;

    // State Level & Pemain
    this.currentLevelId = '1-1';
    this.currentWorldId = 1;

    this.player = {
      x: 80,
      y: 380,
      width: CHARACTER_CONFIG.hitbox.width,
      height: CHARACTER_CONFIG.hitbox.height,
      vx: 0,
      vy: 0,
      speed: 5.2,
      jumpForce: -12.0,
      gravity: 0.52,
      isGrounded: false,
      facing: 1,
      state: 'idle',
      nyawa: 3,
      maxNyawa: 3,
      isInvulnerable: false,
      invulnerableTimer: 0,
      respawnX: 80,
      respawnY: 380
    };

    this.keys = {
      left: false,
      right: false,
      up: false,
      interact: false
    };

    this.stateLevel = {
      levelId: '1-1',
      koinTerkumpul: 0,
      misiSelesai: 0,
      totalMisi: 5,
      isCleared: false
    };

    this.solidPlatforms = [];

    // Bind event handlers
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.resetKeys = this.resetKeys.bind(this);
    this.loop = this.loop.bind(this);

    // State Jembatan & Fixed Timestep Accumulator
    this.accumulator = 0;
    this.isBuildingBridge = false;

    // Muat level awal
    this.muatLevel('1-1');
    this.aturResolusiRetina();
  }

  resetKeys() {
    this.keys = { left: false, right: false, up: false, interact: false };
  }

  handlePointerUp() {
    this.keys.interact = false;
  }

  aturResolusiRetina() {
    if (!this.canvas || typeof window === 'undefined') return;

    const dpr = window.devicePixelRatio || 1;
    const rect = (this.canvas.getBoundingClientRect) ? this.canvas.getBoundingClientRect() : { width: this.virtualWidth, height: this.virtualHeight };
    const displayWidth = rect.width || this.virtualWidth;
    const displayHeight = rect.height || this.virtualHeight;

    this.canvas.width = Math.round(displayWidth * dpr);
    this.canvas.height = Math.round(displayHeight * dpr);

    const scaleX = (displayWidth * dpr) / this.virtualWidth;
    const scaleY = (displayHeight * dpr) / this.virtualHeight;

    if (this.ctx && this.ctx.setTransform) {
      this.ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  async inisialisasi() {
    await this.muatSemuaAset();
    this.pasangInputListener();
    this.aturResolusiRetina();
  }

  loadImagePromise(img, src, fallbackSrc = null) {
    return new Promise((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => {
        if (fallbackSrc && src !== fallbackSrc) {
          img.src = fallbackSrc;
          img.onload = () => resolve(true);
          img.onerror = () => resolve(false);
        } else {
          resolve(false);
        }
      };
      img.src = src;
    });
  }

  async muatSemuaAset() {
    if (this.assetsLoaded) return;
    this.isLoadingAssets = true;

    const char = this.characterConfig;
    await this.loadImagePromise(this.assets.character, char.spriteSrc, char.fallbackSpriteSrc);

    this.assetsLoaded = true;
    this.isLoadingAssets = false;
  }

  /**
   * Pemuatan Level Dinamis (Dunia 1: 1-1 atau 1-2, Dunia 2: 2-1)
   */
  muatLevel(fullLevelId = '1-1') {
    this.currentLevelId = fullLevelId;
    const levelData = ADVENTURE_LEVELS_REGISTRY[fullLevelId] || ADVENTURE_LEVELS_REGISTRY['1-1'];
    this.currentLevelData = levelData;
    this.currentWorldId = levelData.worldId || 1;

    this.worldWidth = levelData.worldWidth || 3800;
    this.worldHeight = levelData.worldHeight || 540;
    this.groundY = levelData.groundY || 444;

    // Reset kamera dengan batas peta level ini
    this.camera = new AdventureCamera(this.virtualWidth, this.virtualHeight, this.worldWidth, this.worldHeight);

    // Reset entitas
    this.entities = new AdventureEntityManager(levelData);

    // Reset gerbang soal dengan State Machine Quiz
    this.questionGates = new AdventureQuestionGates(levelData.questionGates || [], {
      audio: adventureAudio,
      onGateUnlocked: (gate) => this.onGateUnlocked(gate),
      onCoinAwarded: (koin) => this.tambahKoin(koin),
      onDialogOpen: (gate) => {
        this.gameState = 'quiz';
        this.resetKeys();
        this.player.vx = 0;
      },
      onDialogClosed: () => {
        if (this.gameState === 'quiz') {
          this.gameState = 'playing';
        }
      }
    });

    // Reset platform solid
    this.solidPlatforms = JSON.parse(JSON.stringify(levelData.platforms || []));

    // Reset status State Machine Game
    this.gameState = 'playing';
    this.toastTimer = null;

    // Reset posisi pemain (pastikan tidak di dalam tanah)
    this.player.x = levelData.spawnPoint?.x || 80;
    this.player.y = Math.min(levelData.spawnPoint?.y || 380, this.groundY - this.player.height - 2);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.nyawa = 3;
    this.player.respawnX = this.player.x;
    this.player.respawnY = this.player.y;
    this.player.state = 'idle';
    this.player.isInvulnerable = false;
    this.player.invulnerableTimer = 0;

    this.resetKeys();
    this.isBuildingBridge = false;
    this.accumulator = 0;

    this.stateLevel.levelId = fullLevelId;
    this.stateLevel.misiSelesai = 0;
    this.stateLevel.totalMisi = (levelData.questionGates || []).length;
    this.stateLevel.isCleared = false;

    this.camera.resetTo(this.player.x);
    this.perbaruiHUD();
  }

  // Alias untuk kompatibilitas mundur
  bangunDuniaLevel1() {
    this.muatLevel('1-1');
  }

  pasangInputListener() {
    if (typeof window === 'undefined') return;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('blur', this.resetKeys);
    document.addEventListener('visibilitychange', this.resetKeys);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('touchend', this.handlePointerUp);
  }

  lepasInputListener() {
    if (typeof window === 'undefined') return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('blur', this.resetKeys);
    document.removeEventListener('visibilitychange', this.resetKeys);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('touchend', this.handlePointerUp);
  }

  handleResize() {
    this.aturResolusiRetina();
  }

  handleKeyDown(e) {
    if (this.questionGates.isDialogOpen) return;

    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') this.keys.left = true;
    if (k === 'arrowright' || k === 'd') this.keys.right = true;
    if (k === 'arrowup' || k === 'w' || k === ' ') {
      this.keys.up = true;
      this.physics.queueJump();
      adventureAudio.playJump();
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
    if (!this.assetsLoaded) {
      await this.muatSemuaAset();
    }
    this.isRunning = true;
    this.lastTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    // Mulai musik latar ambient dunia 1
    adventureAudio.startBgm(this.currentWorldId);

    this.rafId = requestAnimationFrame(this.loop);
  }

  simpanProgresSaatIni() {
    if (!this.stateLevel || !this.currentLevelId) return;
    const p = adventureWorldsProgress.muatProgres();
    const lvl = p.levels[this.currentLevelId] || { unlocked: true };
    const koinSekarang = this.stateLevel.koinTerkumpul || 0;
    const koinLama = lvl.coins || 0;
    if (koinSekarang > koinLama) {
      const delta = koinSekarang - koinLama;
      lvl.coins = koinSekarang;
      p.totalCoins = (p.totalCoins || 0) + delta;
    }
    p.levels[this.currentLevelId] = lvl;
    adventureWorldsProgress.simpanProgres(p);
  }

  berhenti() {
    this.simpanProgresSaatIni();
    this.isRunning = false;
    adventureAudio.stopBgm();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  cleanup() {
    this.berhenti();
    this.lepasInputListener();
  }

  loop(now) {
    if (!this.isRunning) return;

    if (!this.lastTime) this.lastTime = now;
    const rawDt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Fixed Timestep 60Hz (dt = 1/60 ~ 0.01667 detik)
    const fixedDt = 1 / 60;
    this.accumulator = (this.accumulator || 0) + rawDt;

    let subSteps = 0;
    while (this.accumulator >= fixedDt && subSteps < 4) {
      if (!this.questionGates.isDialogOpen && !this.stateLevel.isCleared && !this.isBuildingBridge) {
        this.update(fixedDt);
      }
      this.accumulator -= fixedDt;
      subSteps++;
    }

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  }

  updateFisika(dt = 0.016) {
    this.update(dt);
  }

  update(dt = 0.016) {
    const p = this.player;

    if (p.isInvulnerable) {
      p.invulnerableTimer -= dt;
      if (p.invulnerableTimer <= 0) {
        p.isInvulnerable = false;
      }
    }

    // Update Parallax & Living Entities
    this.parallax.update(dt);

    const platformsForPhysics = [
      ...this.solidPlatforms,
      ...this.entities.movingPlatforms,
      ...this.entities.mysteryBlocks
    ];

    const physEvents = this.physics.update(
      p,
      { left: this.keys.left, right: this.keys.right, jumpHeld: this.keys.up },
      platformsForPhysics,
      dt
    );

    if (physEvents.landed) {
      adventureAudio.playLand();
      p.state = 'land';
    }

    if (physEvents.skidded && Math.random() < 0.4) {
      this.entities.spawnSparkles(p.x + p.width / 2, p.y + p.height, 2, '#D1D5DB');
    }

    if (physEvents.fellInPit) {
      this.tanganiJatuhJurang();
    }

    if (physEvents.blockHit) {
      this.entities.hitMysteryBlock(physEvents.blockHit, null, adventureAudio);
    }

    const isAllGatesUnlocked = (this.stateLevel.misiSelesai >= this.stateLevel.totalMisi);
    const isAllPriorGatesUnlocked = (cpX) => {
      return this.questionGates.gates.every(g => (g.x > cpX || g.terbuka));
    };

    const entityEvents = this.entities.update(p, dt, adventureAudio, {
      isAllGatesUnlocked,
      isAllPriorGatesUnlocked
    });

    if (entityEvents.coinCollected > 0) {
      this.tambahKoin(entityEvents.coinCollected);
    }

    if (entityEvents.playerHurt) {
      this.tanganiPemainTerluka();
    }

    if (entityEvents.flagpoleBlocked) {
      this.tampilkanNotifikasiPemain('⚠️ Buka seluruh 5 Misi Penjaga untuk menuntaskan level!');
    }

    if (entityEvents.checkpointActivated) {
      p.respawnX = entityEvents.checkpointActivated.x;
      p.respawnY = Math.min(entityEvents.checkpointActivated.y - p.height - 2, this.groundY - p.height - 2);
    }

    if (entityEvents.flagpoleReached && !this.stateLevel.isCleared) {
      this.stateLevel.isCleared = true;
      adventureAudio.playFlagpole();
      this.tanganiKemenanganLevel();
    }

    this.camera.update(p, dt);

    // 8 State Animasi Kiko / Aliya
    if (p.isInvulnerable && p.invulnerableTimer > 1.0) {
      p.state = 'hurt';
    } else if (this.stateLevel.isCleared) {
      p.state = 'celebrate';
    } else if (!p.isGrounded) {
      p.state = (p.vy < 0) ? 'jump' : 'fall';
    } else if (Math.abs(p.vx) > 3.0) {
      p.state = 'run';
    } else if (Math.abs(p.vx) > 0.3) {
      p.state = 'walk';
    } else {
      p.state = 'idle';
    }

    this.animator.play(p.state);
    this.animator.update(dt);

    // ATURAN 1 (TAMBAHAN WAJIB): Batas gerbang solid tak tertembus ditegakkan
    // sebagai langkah TERAKHIR setiap frame setelah seluruh pergerakan, knockback, dan platform
    this.enforceGateBoundaries();
  }

  /**
   * Penegakan pembatas gerbang solid tak tertembus (infinite vertical sky barrier)
   */
  enforceGateBoundaries() {
    const pw = this.player.width;

    for (const gate of this.questionGates.gates) {
      if (!gate.terbuka) {
        const gLeft = gate.x;
        const gRight = gate.x + (gate.width || 48);

        // Jika pemain mencoba menerobos dari sisi kiri gerbang:
        if (this.player.x + pw > gLeft && this.player.x < gLeft + 25) {
          this.player.x = gLeft - pw;
          if (this.player.vx > 0) this.player.vx = 0;
        }
        // Jika pemain di sisi kanan dan mencoba ke kiri:
        else if (this.player.x < gRight && this.player.x + pw > gRight - 25) {
          this.player.x = gRight;
          if (this.player.vx < 0) this.player.vx = 0;
        }

        // Pembatas absolut jika pemain berada di dalam zona gerbang:
        if (this.player.x + pw > gLeft && this.player.x < gRight) {
          this.player.x = gLeft - pw;
          if (this.player.vx > 0) this.player.vx = 0;
        }
      }
    }
  }

  tampilkanNotifikasiPemain(pesan) {
    if (typeof document === 'undefined') return;
    const toast = document.getElementById('hud-notifikasi-toast');
    if (!toast) return;
    toast.textContent = pesan;
    toast.classList.remove('d-none');
    toast.style.animation = 'none';
    toast.offsetHeight; /* trigger reflow */
    toast.style.animation = '';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.classList.add('d-none');
    }, 2200);
  }

  tanganiPemainTerluka(alasan = 'Aduh! Terkena Musuh 🐛 (-1 Hati)') {
    this.player.nyawa = Math.max(0, this.player.nyawa - 1);
    this.player.isInvulnerable = true;
    this.player.invulnerableTimer = 1.5;
    this.tampilkanNotifikasiPemain(alasan);
    this.perbaruiHUD();

    if (this.player.nyawa <= 0) {
      this.respawnDiCheckpoint();
    }
  }

  tanganiJatuhJurang() {
    adventureAudio.playWrong();
    this.player.nyawa = Math.max(0, this.player.nyawa - 1);
    this.tampilkanNotifikasiPemain('Tercebur ke Jurang! 💧 (-1 Hati)');
    this.respawnDiCheckpoint();
  }

  respawnDiCheckpoint() {
    this.player.x = this.player.respawnX;
    this.player.y = Math.min(this.player.respawnY, this.groundY - this.player.height - 2);
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isInvulnerable = true;
    this.player.invulnerableTimer = 2.0;
    if (this.player.nyawa <= 0) {
      this.player.nyawa = 3;
    }
    this.entities.spawnSparkles(this.player.x + 22, this.player.y + 24, 12, '#38BDF8');
    this.perbaruiHUD();
  }

  periksaPemicuInteraksi() {
    // 1. Cek gerbang soal terdekat
    const nearbyGate = this.questionGates.getNearbyGate(this.player);
    if (nearbyGate) {
      this.resetKeys();
      this.questionGates.openChallenge(nearbyGate);
      return;
    }

    // 2. Cek kotak misteri '?' terdekat yang belum dibuka
    const nearbyBlock = this.entities.getNearbyMysteryBlock(this.player);
    if (nearbyBlock) {
      this.entities.hitMysteryBlock(nearbyBlock, null, adventureAudio);
      return;
    }
  }

  onGateUnlocked(gate) {
    this.stateLevel.misiSelesai += 1;
    this.perbaruiHUD();

    // Memicu animasi pembangunan jembatan jika gerbang terhubung dengan jembatan
    if (gate.tipe && gate.tipe.includes('jembatan')) {
      const platJembatan = this.solidPlatforms.find(p => p.tipe === gate.tipe);
      if (platJembatan) {
        this.mulaiAnimasiJembatan(platJembatan);
      }
    }

    this.entities.spawnSparkles(gate.x + 24, gate.y, 24, '#22C55E');
  }

  /**
   * Animasi kemunculan bilah papan jembatan dari sisi kiri ke kanan (Aturan C)
   */
  mulaiAnimasiJembatan(plat) {
    plat.animating = true;
    plat.animPlanks = 0;
    plat.totalPlanks = Math.max(6, Math.floor(plat.width / 26));
    this.isBuildingBridge = true;
    this.player.vx = 0;

    let plankIndex = 0;
    const intervalId = setInterval(() => {
      plankIndex++;
      plat.animPlanks = plankIndex;
      const currentX = plat.x + (plat.width / plat.totalPlanks) * plankIndex;
      adventureAudio.playLand();
      this.entities.spawnSparkles(currentX, plat.y, 6, '#22C55E');

      if (plankIndex >= plat.totalPlanks) {
        clearInterval(intervalId);
        plat.animating = false;
        plat.terbuka = true;
        this.isBuildingBridge = false;
        adventureAudio.playSuccess();
        this.entities.spawnSparkles(plat.x + plat.width / 2, plat.y, 18, '#FACC15');
      }
    }, 70);
  }

  tambahKoin(jumlah) {
    this.stateLevel.koinTerkumpul += jumlah;
    this.perbaruiHUD();
  }

  perbaruiHUD() {
    if (typeof document === 'undefined') return;

    const elKoin = document.getElementById('hud-koin-jumlah');
    const elMisi = document.getElementById('hud-misi-teks');
    const elNyawa = document.getElementById('hud-nyawa-teks');
    const elLevelBadge = document.getElementById('hud-level-badge');

    if (elKoin) elKoin.textContent = this.stateLevel.koinTerkumpul;
    if (elMisi) elMisi.textContent = `Misi: ${this.stateLevel.misiSelesai}/${this.stateLevel.totalMisi}`;
    if (elNyawa) {
      const hearts = '❤️'.repeat(this.player.nyawa) + '🖤'.repeat(this.player.maxNyawa - this.player.nyawa);
      elNyawa.textContent = hearts;
    }
    if (elLevelBadge) {
      elLevelBadge.textContent = `Level ${this.currentLevelId}`;
    }
  }

  tanganiKemenanganLevel() {
    this.player.state = 'celebrate';

    const stars = (this.stateLevel.koinTerkumpul >= 20 && this.player.nyawa === 3) ? 3 :
                  (this.stateLevel.koinTerkumpul >= 10) ? 2 : 1;
    const coins = this.stateLevel.koinTerkumpul;
    const score = 1000 + coins * 50;

    adventureWorldsProgress.selesaikanLevel(this.currentLevelId, stars, coins, score);

    setTimeout(() => {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-victory-overlay');
      if (modal) {
        const koinEl = document.getElementById('victory-koin');
        const skorEl = document.getElementById('victory-skor');
        const levelJudulEl = document.getElementById('victory-level-judul');
        if (koinEl) koinEl.textContent = `+${coins} Koin Daun 🍃`;
        if (skorEl) skorEl.textContent = `Skor: ${score}`;
        if (levelJudulEl) levelJudulEl.textContent = `Level ${this.currentLevelId} Selesai!`;
        modal.classList.add('aktif');
      }
    }, 1800);
  }

  // ==========================================================================
  // RENDERING DUNIA PLATFORMER (PARALLAX 5 LAPIS + PLAYFIELD + LIVING ENTITIES)
  // ==========================================================================
  render() {
    const ctx = this.ctx;
    // Pembulatan ke bilangan bulat penuh untuk mencegah getaran sub-piksel (anti-jitter)
    const cx = Math.round(this.camera.x);

    ctx.clearRect(0, 0, this.virtualWidth, this.virtualHeight);

    // 1. Render 5 Lapis Parallax Dinamis
    this.parallax.render(ctx, cx, this.currentWorldId);

    // 2. Playfield
    ctx.save();
    ctx.translate(-cx, 0);

    this.renderPlatforms(ctx);
    this.renderQuestionGates(ctx);
    this.renderEntities(ctx);

    // 3. Render Living Entities di Atas Platform (Kupu-kupu, Daun Gugur)
    this.parallax.renderLivingEntities(ctx, cx);

    this.renderPlayer(ctx);

    ctx.restore();
  }

  renderPlatforms(ctx) {
    for (const plat of this.solidPlatforms) {
      if (plat.tipe === 'tanah') {
        // Rumput Hutan Ceria (Hijau Emerald Segar)
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(plat.x, plat.y, plat.width, 16);
        ctx.fillStyle = '#15803D';
        ctx.fillRect(plat.x, plat.y + 14, plat.width, 4);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(plat.x, plat.y + 18, plat.width, plat.height - 18);
      } else if (plat.tipe === 'platform') {
        ctx.fillStyle = '#22C55E';
        ctx.fillRect(plat.x, plat.y, plat.width, 8);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(plat.x, plat.y + 8, plat.width, plat.height - 8);
      } else if (plat.tipe && plat.tipe.includes('jembatan')) {
        if (plat.terbuka) {
          // Jembatan kokoh selesai dibangun
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, plat.width, 14);
          ctx.fillStyle = '#78350F';
          for (let bx = plat.x; bx < plat.x + plat.width; bx += 28) {
            ctx.fillRect(bx, plat.y - 10, 6, 24);
          }
        } else if (plat.animating) {
          // Bilah jembatan muncul bertahap dari kiri ke kanan (Aturan C)
          const stepW = plat.width / (plat.totalPlanks || 8);
          const currentW = Math.min(plat.width, stepW * (plat.animPlanks || 0));
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, currentW, 14);
          ctx.fillStyle = '#78350F';
          for (let bx = plat.x; bx < plat.x + currentW; bx += 28) {
            ctx.fillRect(bx, plat.y - 10, 6, 24);
          }
        } else {
          // Jurang belum ada jembatan: tampilkan tunggul dan tanda seru merah
          ctx.fillStyle = '#B45309';
          ctx.fillRect(plat.x, plat.y, 45, 14);
          ctx.fillRect(plat.x + plat.width - 45, plat.y, 45, 14);
          ctx.fillStyle = '#DC2626';
          ctx.fillRect(plat.x + plat.width / 2 - 12, plat.y - 20, 24, 24);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px sans-serif';
          ctx.fillText('!', plat.x + plat.width / 2 - 3, plat.y - 3);
        }
      }
    }

    // Aliran Sungai Dasar
    ctx.fillStyle = '#0284C7';
    ctx.fillRect(880, 480, 220, 60);
    ctx.fillRect(2200, 480, 220, 60);

    for (const mp of this.entities.movingPlatforms) {
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.roundRect(mp.x, mp.y, mp.width, mp.height, 6);
      ctx.fill();
      ctx.fillStyle = '#78350F';
      ctx.fillRect(mp.x + 4, mp.y + mp.height - 4, mp.width - 8, 3);
    }
  }

  renderQuestionGates(ctx) {
    const nearbyGate = this.questionGates.getNearbyGate(this.player);

    for (const gate of this.questionGates.gates) {
      const isBridgeGate = (gate.tipe && gate.tipe.includes('jembatan'));

      if (isBridgeGate) {
        // 1. Tipe Tantangan Jembatan: Prasasti Totem Kristal Penjaga di Tepian Jurang (Bebas Pintu Bertumpuk)
        ctx.save();
        // Tiang kayu prasasti
        ctx.fillStyle = '#78350F';
        ctx.fillRect(gate.x - 20, gate.y - 42, 16, 46);
        ctx.fillStyle = '#451A03';
        ctx.fillRect(gate.x - 22, gate.y + 2, 20, 4);

        // Batu Kristal Permata Penjaga Alam
        ctx.fillStyle = gate.terbuka ? '#22C55E' : '#EF4444';
        ctx.beginPath();
        ctx.arc(gate.x - 12, gate.y - 50, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(gate.terbuka ? '🌿' : '🔒', gate.x - 12, gate.y - 46);

        // Jika terkunci: tirai energi tipis di mulut jurang
        if (!gate.terbuka) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.28)';
          ctx.fillRect(gate.x, gate.y - 65, 8, 120);
        }
        ctx.restore();
      } else {
        // 2. Tipe Gapura Ranting Alam (Ramping, Harmonis & Estetis)
        ctx.save();
        const archW = gate.width || 44;
        const archH = 100;
        const topY = gate.y - archH;

        // Tiang ranting kiri & kanan
        ctx.fillStyle = '#78350F';
        ctx.fillRect(gate.x - 8, topY + 10, 8, archH - 6);
        ctx.fillRect(gate.x + archW, topY + 10, 8, archH - 6);

        // Lengkungan ranting atas
        ctx.fillStyle = '#451A03';
        ctx.fillRect(gate.x - 10, topY, archW + 20, 12);

        // Kanopi Daun Hiasan
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(gate.x - 4, topY - 2, 8, 0, Math.PI * 2);
        ctx.arc(gate.x + archW / 2, topY - 5, 10, 0, Math.PI * 2);
        ctx.arc(gate.x + archW + 4, topY - 2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Segel Pembatas
        if (gate.terbuka) {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.20)';
          ctx.fillRect(gate.x, topY + 12, archW, archH - 8);
          ctx.fillStyle = '#16A34A';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🌿', gate.x + archW / 2, gate.y - 30);
        } else {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.fillRect(gate.x, topY + 12, archW, archH - 8);
          ctx.fillStyle = '#FACC15';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🔒', gate.x + archW / 2, gate.y - 30);
        }
        ctx.restore();
      }

      if (nearbyGate === gate) {
        this.renderInteractionBadge(ctx, gate.x + (gate.width || 44) / 2, gate.y - 88, 'Jawab Soal Penjaga');
      }
    }
  }

  renderEntities(ctx) {
    const nowTime = (typeof performance !== 'undefined') ? performance.now() : Date.now();

    for (const block of this.entities.mysteryBlocks) {
      const by = block.y + block.bounceY;
      if (block.disundul) {
        // Blok bata kayu kosong selesai disundul (Desain Bertekstur Taktil & Bernilai Estetika)
        ctx.fillStyle = '#B45309';
        ctx.fillRect(block.x, by, block.width, block.height);
        ctx.fillStyle = '#78350F';
        ctx.fillRect(block.x + 3, by + 3, block.width - 6, block.height - 6);
        ctx.strokeStyle = '#451A03';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(block.x, by, block.width, block.height);

        // 4 Paku keling sudut
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(block.x + 5, by + 5, 3, 3);
        ctx.fillRect(block.x + block.width - 8, by + 5, 3, 3);
        ctx.fillRect(block.x + 5, by + block.height - 8, 3, 3);
        ctx.fillRect(block.x + block.width - 8, by + block.height - 8, 3, 3);
      } else {
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(block.x, by, block.width, block.height);
        ctx.fillStyle = '#FDE68A';
        ctx.fillRect(block.x + 2, by + 2, block.width - 4, 4);
        ctx.strokeStyle = '#B45309';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(block.x, by, block.width, block.height);

        ctx.fillStyle = '#78350F';
        ctx.font = 'bold 22px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', block.x + block.width / 2, by + 26);
      }
    }

    const nearbyBlock = this.entities.getNearbyMysteryBlock(this.player);
    if (nearbyBlock) {
      this.renderInteractionBadge(ctx, nearbyBlock.x + nearbyBlock.width / 2, nearbyBlock.y - 30, 'Buka Kotak');
    }

    for (const coin of this.entities.leafCoins) {
      if (coin.diambil) continue;
      const bob = Math.sin(nowTime * 0.005 + coin.x) * 4;
      ctx.save();
      ctx.translate(coin.x, coin.y + bob);

      const scaleX = Math.cos(nowTime * 0.004 + coin.x);
      ctx.scale(scaleX, 1);

      ctx.fillStyle = '#16A34A';
      ctx.beginPath();
      ctx.ellipse(0, 0, coin.r, coin.r + 2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86EFAC';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍃', 0, 4);
      ctx.restore();
    }

    for (const item of this.entities.poppedItems) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.item === 'hati' ? '❤️' : '🍃', 0, 6);
      ctx.restore();
    }

    for (const en of this.entities.enemies) {
      if (!en.isAlive && en.squishTimer <= 0) continue;

      ctx.save();
      ctx.translate(en.x + en.width / 2, en.y + en.height);

      if (!en.isAlive) {
        ctx.scale(1.4, 0.3);
      } else {
        ctx.scale(en.vx < 0 ? -1 : 1, 1);
      }

      if (en.tipe === 'ulat') {
        ctx.fillStyle = '#16A34A';
        ctx.beginPath();
        ctx.arc(-8, -12, 10, 0, Math.PI * 2);
        ctx.arc(4, -12, 9, 0, Math.PI * 2);
        ctx.arc(14, -12, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(12, -15, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(13, -15, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (en.tipe === 'belalang') {
        ctx.fillStyle = '#65A30D';
        ctx.fillRect(-14, -24, 28, 18);
        ctx.fillStyle = '#84CC16';
        ctx.fillRect(-18, -16, 8, 12);
        ctx.fillStyle = '#000000';
        ctx.fillRect(8, -20, 3, 3);
      } else {
        ctx.fillStyle = '#78350F';
        ctx.beginPath();
        ctx.ellipse(0, -14, 16, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-2, -26, 4, 12);
      }

      ctx.restore();
    }

    for (const cp of this.entities.checkpoints) {
      ctx.fillStyle = '#475569';
      ctx.fillRect(cp.x - 3, cp.y - 70, 6, 70);

      ctx.fillStyle = cp.aktif ? '#22C55E' : '#EF4444';
      ctx.beginPath();
      ctx.moveTo(cp.x + 3, cp.y - 70);
      ctx.lineTo(cp.x + 32, cp.y - 56);
      ctx.lineTo(cp.x + 3, cp.y - 42);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = cp.aktif ? '#FACC15' : '#64748B';
      ctx.beginPath();
      ctx.arc(cp.x, cp.y - 76, 7, 0, Math.PI * 2);
      ctx.fill();
    }

    const fp = this.entities.finishFlagpole;
    if (fp) {
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(fp.x, fp.baseY - fp.poleHeight, 8, fp.poleHeight);
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(fp.x + 4, fp.baseY - fp.poleHeight, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#F97316';
      ctx.beginPath();
      ctx.moveTo(fp.x - 42, fp.flagY);
      ctx.lineTo(fp.x, fp.flagY - 18);
      ctx.lineTo(fp.x, fp.flagY + 18);
      ctx.closePath();
      ctx.fill();
    }

    for (const p of this.entities.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderPlayer(ctx) {
    const p = this.player;
    const footCenterX = Math.round(p.x + p.width / 2);
    const footBottomY = Math.round(p.y + p.height);

    // Coba render sprite PNG Aliya
    const drew = this.animator.draw(
      ctx,
      this.assets.character,
      footCenterX,
      footBottomY,
      p.facing,
      p.isInvulnerable
    );

    // Jika PNG belum termuat atau fallback, gunakan gambar vektor prosedural HD
    if (!drew) {
      drawCharacterProceduralFallback(
        ctx,
        footCenterX,
        footBottomY,
        p.facing,
        p.state,
        p.isInvulnerable
      );
    }
  }

  renderInteractionBadge(ctx, x, y, label) {
    ctx.save();
    ctx.font = 'bold 12px sans-serif';
    const textW = ctx.measureText(label).width;
    const totalW = textW + 36;

    ctx.fillStyle = '#FFFDF7';
    ctx.strokeStyle = '#1B3A2F';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x - totalW / 2, y, totalW, 26, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#F2A541';
    ctx.fillRect(x - totalW / 2 + 4, y + 4, 18, 18);
    ctx.fillStyle = '#1B3A2F';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('E', x - totalW / 2 + 13, y + 17);

    ctx.fillStyle = '#1B3A2F';
    ctx.textAlign = 'left';
    ctx.fillText(label, x - totalW / 2 + 28, y + 17);
    ctx.restore();
  }
}
