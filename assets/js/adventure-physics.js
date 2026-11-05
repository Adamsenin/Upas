/**
 * KUPAS KUIS IPAS - Mesin Fisika Platformer ala Super Mario (adventure-physics.js)
 * Menyediakan inersia gerak, akselerasi, deselerasi licin, lompatan variabel,
 * coyote time, jump buffering, serta resolusi benturan AABB dengan platform solid.
 */

export class MarioPhysicsEngine {
  constructor(options = {}) {
    // Parameter Gerak Horizontal (Inersia Mario)
    this.accel = options.accel || 0.52;              // Percepatan lari bertahap
    this.friction = options.friction || 0.82;        // Gesekan saat berhenti (sedikit meluncur)
    this.maxSpeed = options.maxSpeed || 5.2;         // Kecepatan lari puncak
    this.airControl = options.airControl || 0.75;    // Kontrol arah di udara

    // Parameter Gerak Vertikal (Gravitasi & Lompatan Variabel)
    this.gravity = options.gravity || 0.52;          // Tarikan gravitasi
    this.terminalVelocity = options.terminalVelocity || 11.0; // Batas kecepatan jatuh
    this.jumpForce = options.jumpForce || -12.0;     // Dorongan lompat awal
    this.jumpCutMultiplier = options.jumpCut || 0.52;// Pemotongan lonjakan jika tombol dilepas awal

    // Toleransi Lompat Ramah Pemain
    this.coyoteDuration = options.coyoteDuration || 0.12;  // 120ms toleransi melayang
    this.bufferDuration = options.bufferDuration || 0.12;  // 120ms toleransi sebelum mendarat

    // State Internal Pengatur Waktu
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.wasGrounded = false;
  }

  /**
   * Mengatur input lompat pemain (bisa dipanggil saat tombol ditekan)
   */
  queueJump() {
    this.jumpBufferTimer = this.bufferDuration;
  }

  /**
   * Update satu siklus fisika
   * @param {Object} player - Entitas pemain
   * @param {Object} input - { left, right, jumpHeld }
   * @param {Array} platforms - Daftar platform solid
   * @param {number} dt - Delta time (detik, terbatasi maks 0.033s)
   * @returns {Object} { jumped, landed, skidded, fellInPit }
   */
  update(player, input, platforms = [], dt = 0.016) {
    const events = {
      jumped: false,
      landed: false,
      skidded: false,
      fellInPit: false
    };

    // 1. Hitung Pengatur Waktu (Coyote Time & Jump Buffer)
    if (player.isGrounded) {
      this.coyoteTimer = this.coyoteDuration;
      if (!this.wasGrounded) {
        events.landed = true;
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    this.wasGrounded = player.isGrounded;

    // 2. Akselerasi Horizontal & Inersia
    const currentAccel = player.isGrounded ? this.accel : (this.accel * this.airControl);
    const prevVx = player.vx;

    if (input.left && !input.right) {
      if (player.vx > 0.8 && player.isGrounded) {
        events.skidded = true; // Efek skid debu saat berbalik arah
      }
      player.vx = Math.max(-this.maxSpeed, player.vx - currentAccel);
      player.facing = -1;
    } else if (input.right && !input.left) {
      if (player.vx < -0.8 && player.isGrounded) {
        events.skidded = true;
      }
      player.vx = Math.min(this.maxSpeed, player.vx + currentAccel);
      player.facing = 1;
    } else {
      // Deselerasi (sedikit meluncur ala Mario, bukan berhenti kaku)
      player.vx *= this.friction;
      if (Math.abs(player.vx) < 0.08) player.vx = 0;
    }

    // 3. Eksekusi Lompatan (Jump Buffering + Coyote Time)
    const canJump = (player.isGrounded || this.coyoteTimer > 0);
    if (this.jumpBufferTimer > 0 && canJump) {
      player.vy = this.jumpForce;
      player.isGrounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      events.jumped = true;
    }

    // 4. Lompatan Variabel (Variable Jump Height)
    // Jika pemain melepaskan tombol lompat saat masih melesat ke atas, kurangi kecepatan ke atas
    if (!input.jumpHeld && player.vy < -2.5) {
      player.vy *= this.jumpCutMultiplier;
    }

    // 5. Gravitasi
    player.vy = Math.min(this.terminalVelocity, player.vy + this.gravity);

    // 6. Integrasi Posisi & Resolusi Benturan (AABB)
    // Sumbu X
    player.x += player.vx;
    this.resolveCollisionX(player, platforms);

    // Sumbu Y
    player.y += player.vy;
    player.isGrounded = false;
    this.resolveCollisionY(player, platforms, events);

    // Batas bawah jurang (fell in pit)
    if (player.y > 600) {
      events.fellInPit = true;
    }

    return events;
  }

  /**
   * Resolusi benturan horizontal (dinding / rintangan)
   */
  resolveCollisionX(player, platforms) {
    const pw = player.width;
    const ph = player.height;
    const px = player.x;
    const py = player.y;

    for (const plat of platforms) {
      // Abaikan platform jembatan yang belum dibuka/selesai dibangun
      if (plat.terbuka === false && (plat.tipe && plat.tipe.includes('jembatan'))) continue;
      if (plat.isPassThrough) continue; // Platform tembus pandang dari samping

      if (
        px < plat.x + plat.width &&
        px + pw > plat.x &&
        py < plat.y + plat.height &&
        py + ph > plat.y
      ) {
        // Jika pemain sedang melompat/jatuh dan hampir mendarat di atas platform, jangan hentikan sumbu X (cegah glitch melompati kotak)
        if (player.vy >= 0 && (py + ph - player.vy) <= plat.y + 14) {
          continue;
        }

        if (player.vx > 0) {
          player.x = plat.x - pw;
        } else if (player.vx < 0) {
          player.x = plat.x + plat.width;
        }
        player.vx = 0;
      }
    }
  }

  /**
   * Resolusi benturan vertikal (pijakan platform & sundulan atap)
   */
  resolveCollisionY(player, platforms, events = {}) {
    const pw = player.width;
    const ph = player.height;
    const px = player.x;
    const py = player.y;

    for (const plat of platforms) {
      // Abaikan platform jembatan yang belum dibuka/selesai dibangun
      if (plat.terbuka === false && (plat.tipe && plat.tipe.includes('jembatan'))) continue;

      if (
        px + pw * 0.2 < plat.x + plat.width &&
        px + pw * 0.8 > plat.x &&
        py < plat.y + plat.height &&
        py + ph > plat.y
      ) {
        // Mendarat di atas platform (Jatuh dari atas)
        if (player.vy >= 0 && (py + ph - player.vy) <= plat.y + 12) {
          player.y = plat.y - ph;
          player.vy = 0;
          player.isGrounded = true;
          player.currentPlatform = plat;
        }
        // Menyundul platform dari bawah (jika bukan passthrough)
        else if (player.vy < 0 && !plat.isPassThrough) {
          player.y = plat.y + plat.height;
          player.vy = 0;
          if (plat.hits !== undefined && !plat.disundul) {
            events.blockHit = plat;
          }
        }
      }
    }
  }
}

