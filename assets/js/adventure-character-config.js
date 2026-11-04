/**
 * KUPAS KUIS IPAS - Konfigurasi Karakter Utama (adventure-character-config.js)
 * Terpisah dari Game Engine untuk mempermudah pemeliharaan dan kustomisasi.
 *
 * Karakter Utama Orisinal: Aliya Penjelajah
 * Sprite Sheet: assets/images/adventure/character-aliya.png (2172 x 724 px)
 */

export const CHARACTER_CONFIG = {
  id: 'aliya',
  name: 'Aliya Penjelajah',
  badge: 'Penjelajah Ekosistem',
  avatar: 'assets/images/adventure/character-aliya.png',
  spriteSrc: 'assets/images/adventure/character-aliya.png',
  fallbackSpriteSrc: 'assets/images/adventure/character-spritesheet.png',

  // Hitbox Fisika Invarian (Tidak berubah apapun visualnya)
  hitbox: {
    width: 44,
    height: 48
  },

  // Skala visual saat dirender ke canvas 960x540
  // 480px * 0.115 ~= 55px (pas dengan hitbox 48px dan platform padang rumput)
  visualScale: 0.115,

  // Definisi frame terpisah per animasi
  animations: {
    idle: {
      name: 'idle',
      fps: 4,
      loop: true,
      frames: [
        { sx: 42, sy: 118, sw: 190, sh: 482, footOffset: 478, centerX: 95 }
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
      fps: 1,
      loop: false,
      frames: [
        { sx: 1226, sy: 118, sw: 195, sh: 486, footOffset: 482, centerX: 97 }
      ]
    },
    fall: {
      name: 'fall',
      fps: 1,
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
