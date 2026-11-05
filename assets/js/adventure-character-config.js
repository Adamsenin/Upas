/**
 * KUPAS KUIS IPAS - Konfigurasi Karakter Utama (adventure-character-config.js)
 * Terpisah dari Game Engine untuk mempermudah pemeliharaan dan kustomisasi.
 *
 * Karakter Utama: Aliya Penjelajah
 * Sprite Sheet: assets/images/adventure/character-aliya.png (2172 x 724 px)
 * Dilengkapi 8 Animasi Lengkap + Prosedural Vektor HD Fallback bila citra belum siap.
 */

export const CHARACTER_CONFIG = {
  id: 'aliya',
  name: 'Aliya Penjelajah',
  badge: 'Penjelajah Ekosistem Nusantara',
  avatar: 'assets/images/adventure/character-aliya.png',
  spriteSrc: 'assets/images/adventure/character-aliya.png',
  fallbackSpriteSrc: 'assets/images/adventure/character-spritesheet.png',

  // Hitbox Fisika Invarian
  hitbox: {
    width: 44,
    height: 48
  },

  visualScale: 0.115,

  // Definisi 8 Animasi Lengkap
  animations: {
    idle: {
      name: 'idle',
      fps: 4,
      loop: true,
      frames: [
        { sx: 42, sy: 118, sw: 190, sh: 482, footOffset: 478, centerX: 95 }
      ]
    },
    walk: {
      name: 'walk',
      fps: 6,
      loop: true,
      frames: [
        { sx: 284, sy: 118, sw: 175, sh: 482, footOffset: 477, centerX: 87 },
        { sx: 758, sy: 118, sw: 180, sh: 486, footOffset: 482, centerX: 89 }
      ]
    },
    run: {
      name: 'run',
      fps: 8,
      loop: true,
      frames: [
        { sx: 284, sy: 118, sw: 175, sh: 482, footOffset: 477, centerX: 87 },
        { sx: 512, sy: 118, sw: 200, sh: 482, footOffset: 478, centerX: 99 },
        { sx: 758, sy: 118, sw: 180, sh: 486, footOffset: 482, centerX: 89 },
        { sx: 992, sy: 118, sw: 200, sh: 486, footOffset: 482, centerX: 100 }
      ]
    },
    jump: {
      name: 'jump',
      fps: 2,
      loop: false,
      frames: [
        { sx: 1226, sy: 118, sw: 195, sh: 486, footOffset: 482, centerX: 97 }
      ]
    },
    fall: {
      name: 'fall',
      fps: 2,
      loop: false,
      frames: [
        { sx: 1470, sy: 118, sw: 198, sh: 484, footOffset: 480, centerX: 99 }
      ]
    },
    land: {
      name: 'land',
      fps: 8,
      loop: false,
      frames: [
        { sx: 1712, sy: 118, sw: 192, sh: 482, footOffset: 478, centerX: 95 }
      ]
    },
    hurt: {
      name: 'hurt',
      fps: 4,
      loop: false,
      frames: [
        { sx: 1948, sy: 118, sw: 185, sh: 486, footOffset: 482, centerX: 92 }
      ]
    },
    celebrate: {
      name: 'celebrate',
      fps: 4,
      loop: true,
      frames: [
        { sx: 42, sy: 118, sw: 190, sh: 482, footOffset: 478, centerX: 95 },
        { sx: 1226, sy: 118, sw: 195, sh: 486, footOffset: 482, centerX: 97 }
      ]
    }
  }
};

/**
 * Fallback Vektor HD Prosedural jika citra PNG sedang dimuat atau gagal
 */
export function drawCharacterProceduralFallback(ctx, footCenterX, footBottomY, facing = 1, state = 'idle', isInvulnerable = false) {
  if (isInvulnerable && Math.floor(Date.now() / 80) % 2 === 0) {
    return;
  }

  ctx.save();
  ctx.translate(footCenterX, footBottomY);
  ctx.scale(facing, 1);

  // Efek squash and stretch mendarat
  if (state === 'land') {
    ctx.scale(1.2, 0.8);
  } else if (state === 'jump') {
    ctx.scale(0.9, 1.15);
  }

  // Tubuh / Rompi Penjelajah Hijau
  ctx.fillStyle = '#2E7D4F';
  ctx.beginPath();
  ctx.roundRect(-16, -42, 32, 28, 8);
  ctx.fill();

  // Celana Cokelat
  ctx.fillStyle = '#78350F';
  ctx.fillRect(-12, -18, 10, 18);
  ctx.fillRect(2, -18, 10, 18);

  // Sepatu
  ctx.fillStyle = '#1B3A2F';
  ctx.beginPath();
  ctx.ellipse(-7, -1, 6, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(7, -1, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wajah & Jilbab Krem / Topi
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(0, -48, 15, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#FED7AA';
  ctx.beginPath();
  ctx.arc(3, -48, 10, 0, Math.PI * 2);
  ctx.fill();

  // Mata
  ctx.fillStyle = '#1B3A2F';
  ctx.beginPath();
  ctx.arc(6, -49, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Ransel Petualang
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.roundRect(-22, -38, 9, 20, 4);
  ctx.fill();

  ctx.restore();
}
