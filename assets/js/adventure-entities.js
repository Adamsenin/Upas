/**
 * KUPAS KUIS IPAS - Pengelola Entitas & Interaksi (adventure-entities.js)
 * Mengelola platform bergerak, blok misteri '?', koin berputar,
 * musuh ramah anak (stomp bounce), pos checkpoint, dan tiang bendera finis.
 */

export class AdventureEntityManager {
  constructor(levelData) {
    this.levelData = levelData;
    this.movingPlatforms = JSON.parse(JSON.stringify(levelData.movingPlatforms || []));
    this.mysteryBlocks = JSON.parse(JSON.stringify(levelData.mysteryBlocks || []));
    this.leafCoins = JSON.parse(JSON.stringify(levelData.leafCoins || []));
    this.enemies = JSON.parse(JSON.stringify(levelData.enemies || []));
    this.checkpoints = JSON.parse(JSON.stringify(levelData.checkpoints || []));
    this.finishFlagpole = JSON.parse(JSON.stringify(levelData.finishFlagpole || {}));

    // Partikel Efek Visual (Bintang, Debu Skid, Koin Memantul)
    this.particles = [];
    this.poppedItems = []; // Koin / hati yang muncul saat blok disundul

    // State Finis
    this.flagpoleTriggered = false;
  }

  /**
   * Reset entitas ke kondisi awal level
   */
  reset() {
    this.movingPlatforms = JSON.parse(JSON.stringify(this.levelData.movingPlatforms || []));
    this.mysteryBlocks = JSON.parse(JSON.stringify(this.levelData.mysteryBlocks || []));
    this.leafCoins = JSON.parse(JSON.stringify(this.levelData.leafCoins || []));
    this.enemies = JSON.parse(JSON.stringify(this.levelData.enemies || []));
    this.checkpoints = JSON.parse(JSON.stringify(this.levelData.checkpoints || []));
    this.finishFlagpole = JSON.parse(JSON.stringify(this.levelData.finishFlagpole || {}));
    this.particles = [];
    this.poppedItems = [];
    this.flagpoleTriggered = false;
  }

  /**
   * Update seluruh entitas dalam 1 frame
   */
  update(player, dt = 0.016, audio, options = {}) {
    const isAllGatesUnlocked = options.isAllGatesUnlocked ?? false;
    const isAllPriorGatesUnlocked = options.isAllPriorGatesUnlocked || (() => true);

    const events = {
      coinCollected: 0,
      blockHit: false,
      enemyStomped: false,
      playerHurt: false,
      checkpointActivated: null,
      flagpoleReached: false
    };

    // 1. Update Platform Bergerak & Bawa Pemain Jika Bertengger
    this.updateMovingPlatforms(player, dt);

    // 2. Update & Deteksi Sundulan Blok Misteri '?'
    this.updateMysteryBlocks(player, events, audio);

    // 3. Update Koin Memantul dari Blok
    this.updatePoppedItems(events, dt);

    // 4. Update Koleksi Koin Daun di Jalur
    this.updateLeafCoins(player, events, audio);

    // 5. Update Musuh (Patroli, Stomp Bounce, Kerusakan Pemain)
    this.updateEnemies(player, events, dt, audio);

    // 6. Update Pos Checkpoint (hanya aktif jika gerbang sebelum pos sudah terbuka)
    this.updateCheckpoints(player, events, audio, isAllPriorGatesUnlocked);

    // 7. Update Tiang Bendera Finis (hanya aktif jika SELURUH gerbang tuntas)
    this.updateFlagpole(player, events, dt, audio, isAllGatesUnlocked);

    // 8. Update Partikel
    this.updateParticles(dt);

    return events;
  }

  /**
   * Update gerak platform melayang horizontal & vertikal
   */
  updateMovingPlatforms(player, dt) {
    for (const mp of this.movingPlatforms) {
      const prevX = mp.x;
      const prevY = mp.y;

      if (mp.sumbu === 'horizontal') {
        mp.x += mp.speed * mp.dir;
        if (mp.x > mp.endX) {
          mp.x = mp.endX;
          mp.dir = -1;
        } else if (mp.x < mp.startX) {
          mp.x = mp.startX;
          mp.dir = 1;
        }
      } else if (mp.sumbu === 'vertikal') {
        mp.y += mp.speed * mp.dir;
        if (mp.y > mp.endY) {
          mp.y = mp.endY;
          mp.dir = -1;
        } else if (mp.y < mp.startY) {
          mp.y = mp.startY;
          mp.dir = 1;
        }
      }

      const dx = mp.x - prevX;
      const dy = mp.y - prevY;

      // Jika pemain berdiri di atas platform ini, bawa pemain bersamanya
      const onTop = (
        player.isGrounded &&
        player.x + player.width > mp.x &&
        player.x < mp.x + mp.width &&
        Math.abs((player.y + player.height) - mp.y) < 6
      );

      if (onTop) {
        player.x += dx;
        player.y += dy;
      }
    }
  }

  /**
   * Cari blok misteri '?' terdekat yang belum disundul/dibuka
   */
  getNearbyMysteryBlock(player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    for (const block of this.mysteryBlocks) {
      if (block.disundul) continue;
      const bx = block.x + block.width / 2;
      const by = block.y + block.height / 2;
      // Deteksi dekat: horizontal radius 80px, vertikal dari 50px di atas hingga 200px di bawah
      if (Math.abs(px - bx) <= 80 && (py >= by - 50 && py <= by + 200)) {
        return block;
      }
    }
    return null;
  }

  /**
   * Buka / sundul blok misteri '?' (bisa lewat sundulan bawah atau tombol E/Aksi)
   */
  hitMysteryBlock(block, events, audio) {
    if (!block || block.disundul) return false;

    block.bounceY = -9;
    block.disundul = true; // Langsung tandai disundul agar tidak bisa dipicu dua kali
    if (events) events.blockHit = true;
    if (audio) audio.playCoin();

    this.poppedItems.push({
      x: block.x + block.width / 2,
      y: block.y - 6,
      vy: -7.5,
      gravity: 0.35,
      item: block.item || 'koin',
      alpha: 1.0,
      rotation: 0
    });

    this.spawnSparkles(block.x + block.width / 2, block.y, 8, '#F2A541');
    return true;
  }

  /**
   * Deteksi sundulan blok '?' dari bawah ala Super Mario
   */
  updateMysteryBlocks(player, events, audio) {
    const pw = player.width;
    const px = player.x;
    const py = player.y;

    for (const block of this.mysteryBlocks) {
      // Pulihkan animasi pantul blok jika sedang memantul
      if (block.bounceY < 0) {
        block.bounceY += 1.2;
        if (block.bounceY > 0) block.bounceY = 0;
      }

      // Deteksi kepala pemain menyundul bagian bawah blok saat melompat naik
      if (
        player.vy < 0 &&
        px + pw * 0.7 > block.x &&
        px + pw * 0.3 < block.x + block.width &&
        py <= block.y + block.height &&
        py >= block.y + block.height - 16
      ) {
        player.vy = 1.5; // Pantulkan kepala pemain ke bawah
        player.y = block.y + block.height;

        if (!block.disundul) {
          this.hitMysteryBlock(block, events, audio);
        }
      }
    }
  }

  /**
   * Update koin/hati yang meloncat keluar dari blok misteri
   */
  updatePoppedItems(events, dt) {
    for (let i = this.poppedItems.length - 1; i >= 0; i--) {
      const it = this.poppedItems[i];
      it.y += it.vy;
      it.vy += it.gravity;
      it.rotation += 0.2;

      // Setelah memuncak dan mulai turun, kumpulkan ke saldo
      if (it.vy > 2.0) {
        events.coinCollected += (it.item === 'koin_ganda' ? 2 : 1);
        this.spawnSparkles(it.x, it.y, 8, '#22C55E');
        this.poppedItems.splice(i, 1);
      }
    }
  }

  /**
   * Update koin daun koleksi di peta
   */
  updateLeafCoins(player, events, audio) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    for (const coin of this.leafCoins) {
      if (coin.diambil) continue;

      const dist = Math.hypot(px - coin.x, py - coin.y);
      if (dist < (coin.r + 22)) {
        coin.diambil = true;
        events.coinCollected += 1;
        if (audio) audio.playCoin();
        this.spawnSparkles(coin.x, coin.y, 6, '#4ADE80');
      }
    }
  }

  /**
   * Update kecerdasan buatan musuh & mekanik Stomp Bounce
   */
  updateEnemies(player, events, dt, audio) {
    const pw = player.width;
    const ph = player.height;

    for (const en of this.enemies) {
      if (!en.isAlive) {
        en.squishTimer -= dt;
        continue;
      }

      // Gerak musuh
      if (en.tipe === 'belalang') {
        en.jumpTimer -= dt;
        if (en.jumpTimer <= 0 && en.isGrounded) {
          en.vy = -6.5;
          en.isGrounded = false;
          en.jumpTimer = 2.2 + Math.random() * 0.8;
        }
        en.y += en.vy;
        en.vy = Math.min(8.0, en.vy + 0.35);
        if (en.y >= 414) {
          en.y = 414;
          en.vy = 0;
          en.isGrounded = true;
        }
      }

      en.x += en.vx;
      if (en.x > en.maxX) {
        en.x = en.maxX;
        en.vx = -Math.abs(en.vx);
      } else if (en.x < en.minX) {
        en.x = en.minX;
        en.vx = Math.abs(en.vx);
      }

      // Deteksi Benturan Pemain vs Musuh
      const overlapX = (player.x + pw * 0.8 > en.x) && (player.x + pw * 0.2 < en.x + en.width);
      const overlapY = (player.y + ph > en.y) && (player.y < en.y + en.height);

      if (overlapX && overlapY) {
        // A. STOMP BOUNCE: Pemain mendarat di atas kepala musuh saat bergerak turun (vy > 0)
        const isLandingOnHead = (player.vy > 0) && (player.y + ph - player.vy <= en.y + 14);

        if (isLandingOnHead) {
          en.isAlive = false;
          en.squishTimer = 0.4;
          player.vy = -9.2; // Melambung tinggi ke atas ala Mario Goomba
          player.isGrounded = false;
          events.enemyStomped = true;
          events.coinCollected += 5; // Hadiah 5 koin daun

          if (audio) audio.playJump();
          this.spawnSparkles(en.x + en.width / 2, en.y + en.height / 2, 10, '#FACC15');
        }
        // B. KERUSAKAN: Tersentuh dari samping/bawah saat pemain tidak sedang kebal
        else if (!player.isInvulnerable) {
          events.playerHurt = true;
          player.isInvulnerable = true;
          player.invulnerableTimer = 1.5; // 1.5 detik berkedip kebal
          player.vx = (player.x < en.x ? -4.5 : 4.5); // Dorongan knockback
          player.vy = -4.0;
          if (audio) audio.playWrong();
          this.spawnSparkles(player.x + pw / 2, player.y + ph / 2, 8, '#EF4444');
        }
      }
    }
  }

  /**
   * Update aktivasi pos pemeriksaan (checkpoints)
   */
  updateCheckpoints(player, events, audio, isAllPriorGatesUnlocked) {
    const px = player.x + player.width / 2;

    for (const cp of this.checkpoints) {
      if (!cp.aktif && Math.abs(px - cp.x) < 40) {
        // Hanya aktifkan jika gerbang sebelum checkpoint ini sudah terbuka
        if (typeof isAllPriorGatesUnlocked === 'function' && !isAllPriorGatesUnlocked(cp.x)) {
          continue;
        }
        cp.aktif = true;
        events.checkpointActivated = cp;
        if (audio) audio.playSuccess();
        this.spawnSparkles(cp.x, cp.y - 30, 14, '#22C55E');
      }
    }
  }

  /**
   * Update tiang bendera finis ala Mario
   */
  updateFlagpole(player, events, dt, audio, isAllGatesUnlocked = false) {
    const fp = this.finishFlagpole;
    if (!fp || fp.cleared) return;

    if (!fp.isSliding) {
      // Sentuhan tiang bendera
      if (player.x + player.width >= fp.x && player.x <= fp.x + 20) {
        // KUNCI: Finis hanya bisa dipicu jika SELURUH gerbang soal telah terbuka!
        if (!isAllGatesUnlocked) {
          // Tolak dan pantulkan pemain sedikit mundur
          player.x = fp.x - player.width - 4;
          player.vx = -2.0;
          events.flagpoleBlocked = true;
          return;
        }

        fp.isSliding = true;
        this.flagpoleTriggered = true;
        events.flagpoleReached = true;
        if (audio) audio.playSuccess();
        player.vx = 0;
        player.vy = 2.0;
      }
    } else {
      // Turunkan bendera
      if (fp.flagY < fp.targetFlagY) {
        fp.flagY += 4.5;
      } else {
        fp.cleared = true;
      }
    }
  }

  /**
   * Tambah efek partikel
   */
  spawnSparkles(x, y, count = 6, color = '#FACC15') {
    // Batasi partikel maksimum 90 agar tidak menumpuk dan membebani performa
    if (this.particles.length > 90) {
      this.particles.splice(0, Math.min(count, this.particles.length - 80));
    }
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2.5;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.0,
        radius: 2.5 + Math.random() * 2.5,
        alpha: 1.0,
        color
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // Gravitasi partikel
      p.alpha -= dt * 1.5;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}

