/**
 * KUPAS KUIS IPAS - Konfigurasi Lingkungan & Pemisahan Visual vs Collision (adventure-env-config.js)
 * Memisahkan data fisika/collision dari tampilan visual agar penggantian aset
 * tidak merusak mekanik permainan, navigasi, atau interaksi.
 */

// 1. DATA COLLISION FISIKA (TIDAK BERUBAH MESKI VISUAL DIGANTI)
export const ENV_COLLISION_DATA = {
  worldWidth: 3600,
  worldHeight: 540,
  groundY: 444,

  // Daftar platform solid dan jurang (x, y, width, height, tipe)
  platforms: [
    // Area Awal (x: 0 .. 760)
    { x: 0, y: 444, width: 760, height: 96, tipe: 'tanah' },
    { x: 300, y: 350, width: 120, height: 28, tipe: 'platform' },
    { x: 500, y: 280, width: 130, height: 28, tipe: 'platform' },

    // Jembatan Kayu Menyeberangi Jurang Sungai (x: 760 .. 960)
    { x: 760, y: 432, width: 200, height: 32, tipe: 'jembatan' },

    // Area Tengah (x: 960 .. 2100)
    { x: 960, y: 444, width: 1140, height: 96, tipe: 'tanah' },
    { x: 1250, y: 360, width: 110, height: 28, tipe: 'platform' },
    { x: 1600, y: 340, width: 140, height: 28, tipe: 'platform' },
    { x: 1850, y: 290, width: 130, height: 28, tipe: 'platform' },

    // Area Kincir, Koleksi & Gerbang Akhir (x: 2100 .. 3600)
    { x: 2100, y: 444, width: 1500, height: 96, tipe: 'tanah' },
    { x: 2320, y: 350, width: 100, height: 26, tipe: 'platform' },
    { x: 2500, y: 270, width: 110, height: 26, tipe: 'platform' },
    { x: 2700, y: 340, width: 120, height: 26, tipe: 'platform' },
    { x: 2900, y: 260, width: 130, height: 26, tipe: 'platform' }
  ],

  // Jurang Sungai
  riverZone: {
    x: 760,
    y: 480,
    width: 200,
    height: 60
  }
};

// 2. ASET VISUAL LINGKUNGAN (DAPAT DIUBAH/DIGANTI KUSTOM DENGAN MUDAH)
export const ENV_VISUAL_ASSETS = {
  level1: {
    id: 1,
    name: 'Padang Rumput Asri',
    bgSky: 'assets/images/adventure/bg-sky.png',
    bgTrees: 'assets/images/adventure/bg-trees.png',
    tileset: 'assets/images/adventure/tileset-grassland.png',
    banner: 'assets/images/adventure/level1-banner.png',
    parallaxSkySpeed: 0.1,
    parallaxTreesSpeed: 0.35
  },
  props: {
    jembatan: {
      colorIntact: '#BE824B',
      colorPost: '#8C552D',
      colorBroken: '#BE824B',
      warningColor: '#DC2626'
    },
    bunga: {
      stemColorFresh: '#22C55E',
      stemColorWilted: '#78733C',
      petalColorFresh: '#F43F5E',
      petalColorWilted: '#B4825A',
      centerColor: '#FACC15'
    },
    kincir: {
      rimColor: '#8C552D',
      bladeColor: '#BE824B',
      hubColor: '#4A2810'
    },
    gerbang: {
      pillarColor: '#78827D',
      lintelColor: '#78827D',
      doorColorLocked: '#374151',
      doorColorOpen: 'rgba(74, 222, 128, 0.45)'
    }
  },
  collectibles: [
    // Biotik
    { id: 'bio_kupu', tipe: 'biotik', name: 'Kupu-kupu Biru 🦋', x: 2350, y: 300, r: 18, color: '#22C55E' },
    { id: 'bio_jamur', tipe: 'biotik', name: 'Jamur Hutan 🍄', x: 2540, y: 225, r: 18, color: '#22C55E' },
    { id: 'bio_ulat', tipe: 'biotik', name: 'Ulat Daun 🐛', x: 2740, y: 295, r: 18, color: '#22C55E' },
    // Abiotik
    { id: 'abio_air', tipe: 'abiotik', name: 'Tetes Air Sungai 💧', x: 2420, y: 400, r: 18, color: '#38BDF8' },
    { id: 'abio_batu', tipe: 'abiotik', name: 'Batu Kerikil 🪨', x: 2620, y: 400, r: 18, color: '#38BDF8' },
    { id: 'abio_cahaya', tipe: 'abiotik', name: 'Kristal Sinar Mentari ☀️', x: 2940, y: 215, r: 18, color: '#F59E0B' }
  ]
};
