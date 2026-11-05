/**
 * KUPAS KUIS IPAS - Konfigurasi 3 Dunia & 6 Level Petualangan (adventure-worlds-data.js)
 *
 * Struktur Permainan:
 * Dunia 1: Hutan Ceria (Level 1-1 & Level 1-2)
 * Dunia 2: Padang Rumput (Level 2-1 & Level 2-2) -> Level 2-1 menampung peta 7200px eksisting
 * Dunia 3: Sungai Kehidupan (Level 3-1 & Level 3-2)
 */

import { ADVENTURE_QUESTIONS_DATABASE } from './adventure-questions-data.js';
import { LEVEL1_DATA } from './adventure-level1-data.js';

export const WORLDS_METADATA = {
  1: {
    id: 1,
    nama: 'Hutan Ceria',
    ikon: '🌲',
    deskripsi: 'Jelajahi lebatnya hutan tropis Nusantara, temukan produsen tumbuhan hijau, dan kenali jaring-jaring makanan!',
    warnaTema: '#16A34A',
    bgGradient: 'linear-gradient(180deg, #102B1E 0%, #166534 100%)',
    ringkasanMateri: {
      judul: '🌿 Rangkuman Materi Dunia 1: Rantai Makanan Hutan',
      poinPenting: [
        'Tumbuhan hijau adalah Produsen autotrof yang membuat makanannya lewat fotosintesis (air + CO2 + cahaya matahari).',
        'Herbivora (pemakan tumbuhan) menduduki Konsumen I, sedangkan Karnivora pemangsa menduduki Konsumen II dan seterusnya.',
        'Kumpulan rantai makanan yang saling berhubungan di hutan membentuk Jaring-Jaring Makanan.',
        'Jamur dan bakteri (Dekomposer) bertugas mengurai sisa makhluk hidup mati menjadi zat hara bagi tanah.'
      ],
      lencanaDidapat: '🏅 Sahabat Rimba Nusantara'
    }
  },
  2: {
    id: 2,
    nama: 'Padang Rumput',
    ikon: '🌾',
    deskripsi: 'Bentangan savana luas dengan interaksi rantai makanan yang dinamis, predator puncak, dan ragam simbiosis!',
    warnaTema: '#F59E0B',
    bgGradient: 'linear-gradient(180deg, #3B2A10 0%, #B45309 100%)',
    ringkasanMateri: {
      judul: '🌾 Rangkuman Materi Dunia 2: Harmoni Savana',
      poinPenting: [
        'Komponen Ekosistem terdiri dari Biotik (makhluk hidup) dan Abiotik (benda tak hidup: air, tanah, matahari).',
        'Simbiosis Mutualisme saling menguntungkan (lebah & bunga), Komensalisme satu pihak untung satu netral (anggrek & mangga).',
        'Simbiosis Parasitisme menguntungkan parasit namun merugikan inangnya (kutu atau cacing pita).',
        'Reboisasi sangat penting untuk mencegah erosi dan menjaga keseimbangan ekosistem.'
      ],
      lencanaDidapat: '🏅 Pelindung Savana Asri'
    }
  },
  3: {
    id: 3,
    nama: 'Sungai Kehidupan',
    ikon: '🌊',
    deskripsi: 'Arus jeram jernih hingga muara bakau, pelajari siklus hidrologi air bumi dan konservasi perairan!',
    warnaTema: '#0284C7',
    bgGradient: 'linear-gradient(180deg, #082F49 0%, #0369A1 100%)',
    ringkasanMateri: {
      judul: '💧 Rangkuman Materi Dunia 3: Siklus Air Bumi',
      poinPenting: [
        'Air menguap dari laut/danau lewat Evaporasi dan dari dedaunan lewat Transpirasi.',
        'Uap air mendingin di angkasa membentuk awan melalui proses Kondensasi.',
        'Curahan air hujan jatuh kembali ke bumi melalui proses Presipitasi.',
        'Air meresap ke dalam tanah melalui Infiltrasi, sehingga daerah resapan tanah terbuka harus selalu dijaga.'
      ],
      lencanaDidapat: '🏅 Penjaga Air Nusantara'
    }
  }
};

// ============================================================================
// DATA LEVEL DETAIL: DUNIA 1 (HUTAN CERIA)
// ============================================================================

// Level 1-1: Jalur Rimbun Hutan (3800px)
const LEVEL_1_1_DATA = {
  worldId: 1,
  levelNum: 1,
  fullId: '1-1',
  nama: 'Jalur Rimbun Hutan',
  subjudul: 'Produsen & Konsumen Tingkat I',
  worldWidth: 3800,
  worldHeight: 540,
  groundY: 444,
  spawnPoint: { x: 80, y: 380 },

  checkpoints: [
    { id: 'cp_1_1_1', x: 1400, y: 444, name: 'Pos Sulur Beringin', aktif: false },
    { id: 'cp_1_1_2', x: 2600, y: 444, name: 'Pos Bunga Pakis', aktif: false }
  ],

  platforms: [
    // Lantai dasar hutan
    { x: 0, y: 444, width: 880, height: 96, tipe: 'tanah' },
    { x: 260, y: 340, width: 110, height: 26, tipe: 'platform' },
    { x: 440, y: 265, width: 120, height: 26, tipe: 'platform' },
    { x: 620, y: 330, width: 100, height: 26, tipe: 'platform' },

    // Jurang Sungai Rimbun 1 (x: 880 .. 1100) - Jembatan Ranting Gerbang 1 (tinggi rata y: 444)
    { x: 880, y: 444, width: 220, height: 32, tipe: 'jembatan_ranting', terbuka: false },

    { x: 1100, y: 444, width: 1100, height: 96, tipe: 'tanah' },
    { x: 1260, y: 350, width: 110, height: 26, tipe: 'platform' },
    { x: 1460, y: 275, width: 130, height: 26, tipe: 'platform' },
    { x: 1720, y: 340, width: 110, height: 26, tipe: 'platform' },
    { x: 1940, y: 270, width: 120, height: 26, tipe: 'platform' },

    // Jurang Sungai Rimbun 2 (x: 2200 .. 2420) - Jembatan Ranting Gerbang 3 (tinggi rata y: 444)
    { x: 2200, y: 444, width: 220, height: 32, tipe: 'jembatan_ranting_2', terbuka: false },

    { x: 2420, y: 444, width: 1380, height: 96, tipe: 'tanah' },
    { x: 2580, y: 350, width: 120, height: 26, tipe: 'platform' },
    { x: 2800, y: 270, width: 130, height: 26, tipe: 'platform' },
    { x: 3040, y: 340, width: 120, height: 26, tipe: 'platform' },
    { x: 3260, y: 270, width: 130, height: 26, tipe: 'platform' }
  ],

  movingPlatforms: [
    { id: 'mp_1_1_1', x: 900, y: 360, width: 90, height: 22, startX: 900, endX: 1080, speed: 1.2, dir: 1, sumbu: 'horizontal' },
    { id: 'mp_1_1_2', x: 2220, y: 365, width: 90, height: 22, startX: 2220, endX: 2400, speed: 1.3, dir: 1, sumbu: 'horizontal' }
  ],

  mysteryBlocks: [
    { id: 'mb_1_1_1', x: 340, y: 220, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_1_2', x: 520, y: 155, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_1_1_3', x: 1340, y: 230, width: 36, height: 36, item: 'hati', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_1_4', x: 1800, y: 220, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_1_5', x: 2660, y: 230, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_1_1_6', x: 3120, y: 220, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false }
  ],

  leafCoins: [
    { x: 180, y: 405, r: 12, diambil: false },
    { x: 210, y: 405, r: 12, diambil: false },
    { x: 300, y: 305, r: 12, diambil: false },
    { x: 480, y: 230, r: 12, diambil: false },
    { x: 510, y: 230, r: 12, diambil: false },
    { x: 650, y: 295, r: 12, diambil: false },
    { x: 940, y: 320, r: 12, diambil: false },
    { x: 990, y: 320, r: 12, diambil: false },
    { x: 1300, y: 315, r: 12, diambil: false },
    { x: 1500, y: 240, r: 12, diambil: false },
    { x: 1760, y: 305, r: 12, diambil: false },
    { x: 1980, y: 235, r: 12, diambil: false },
    { x: 2260, y: 320, r: 12, diambil: false },
    { x: 2310, y: 320, r: 12, diambil: false },
    { x: 2620, y: 315, r: 12, diambil: false },
    { x: 2840, y: 235, r: 12, diambil: false },
    { x: 3080, y: 305, r: 12, diambil: false },
    { x: 3300, y: 235, r: 12, diambil: false }
  ],

  enemies: [
    { id: 'en_1_1_1', tipe: 'ulat', name: 'Ulat Daun Hijau', x: 480, y: 416, width: 34, height: 28, minX: 380, maxX: 680, vx: 0.9, isAlive: true, squishTimer: 0 },
    { id: 'en_1_1_2', tipe: 'ulat', name: 'Ulat Daun Hijau', x: 1400, y: 416, width: 34, height: 28, minX: 1200, maxX: 1600, vx: 1.0, isAlive: true, squishTimer: 0 },
    { id: 'en_1_1_3', tipe: 'belalang', name: 'Belalang Hutan', x: 1850, y: 414, width: 36, height: 30, minX: 1700, maxX: 2050, vx: 1.1, vy: 0, jumpTimer: 2.2, isGrounded: true, isAlive: true, squishTimer: 0 },
    { id: 'en_1_1_4', tipe: 'kumbang', name: 'Kumbang Daun Hutan', x: 2750, y: 414, width: 36, height: 30, minX: 2550, maxX: 2950, vx: 1.4, isAlive: true, squishTimer: 0 }
  ],

  questionGates: ADVENTURE_QUESTIONS_DATABASE.level_1_1.map((q, idx) => {
    const tipos = ['jembatan_ranting', 'pintu_ranting_1', 'jembatan_ranting_2', 'pintu_ranting_2', 'pintu_puncak'];
    return {
      ...q,
      x: [840, 1600, 2150, 2900, 3420][idx],
      y: 380,
      width: 48,
      height: 64,
      tipe: tipos[idx],
      terbuka: false
    };
  }),

  finishFlagpole: { x: 3550, baseY: 444, poleHeight: 280, flagY: 180, targetFlagY: 410, isSliding: false, cleared: false },
  victoryGazebo: { x: 3680, y: 360, width: 110, height: 84 }
};

// Level 1-2: Puncak Kanopi Hijau (4200px)
const LEVEL_1_2_DATA = {
  worldId: 1,
  levelNum: 2,
  fullId: '1-2',
  nama: 'Puncak Kanopi Hijau',
  subjudul: 'Jaring Makanan & Dekomposer Hutan',
  worldWidth: 4200,
  worldHeight: 540,
  groundY: 444,
  spawnPoint: { x: 80, y: 380 },

  checkpoints: [
    { id: 'cp_1_2_1', x: 1550, y: 444, name: 'Pos Jamur Pelangi', aktif: false },
    { id: 'cp_1_2_2', x: 2850, y: 444, name: 'Pos Dahan Raksasa', aktif: false }
  ],

  platforms: [
    { x: 0, y: 444, width: 920, height: 96, tipe: 'tanah' },
    { x: 240, y: 330, width: 120, height: 26, tipe: 'platform' },
    { x: 420, y: 250, width: 130, height: 26, tipe: 'platform' },
    { x: 620, y: 320, width: 110, height: 26, tipe: 'platform' },

    // Jurang Air Terjun Kanopi 1 (x: 920 .. 1160) - Jembatan Kanopi 1 (y: 444 rata tanah)
    { x: 920, y: 444, width: 240, height: 32, tipe: 'jembatan_kanopi_1', terbuka: false },

    { x: 1160, y: 444, width: 1150, height: 96, tipe: 'tanah' },
    { x: 1320, y: 340, width: 120, height: 26, tipe: 'platform' },
    { x: 1520, y: 260, width: 130, height: 26, tipe: 'platform' },
    { x: 1780, y: 330, width: 120, height: 26, tipe: 'platform' },
    { x: 2000, y: 250, width: 130, height: 26, tipe: 'platform' },

    // Jurang Kanopi 2 (x: 2310 .. 2550) - Jembatan Kanopi 2 (y: 444 rata tanah)
    { x: 2310, y: 444, width: 240, height: 32, tipe: 'jembatan_kanopi_2', terbuka: false },

    { x: 2550, y: 444, width: 1650, height: 96, tipe: 'tanah' },
    { x: 2720, y: 340, width: 120, height: 26, tipe: 'platform' },
    { x: 2940, y: 260, width: 130, height: 26, tipe: 'platform' },
    { x: 3200, y: 330, width: 120, height: 26, tipe: 'platform' },
    { x: 3420, y: 250, width: 130, height: 26, tipe: 'platform' },
    { x: 3660, y: 320, width: 120, height: 26, tipe: 'platform' }
  ],

  movingPlatforms: [
    { id: 'mp_1_2_1', x: 940, y: 350, width: 95, height: 22, startX: 940, endX: 1140, speed: 1.3, dir: 1, sumbu: 'horizontal' },
    { id: 'mp_1_2_2', x: 1680, y: 370, width: 90, height: 22, startY: 230, endY: 380, speed: 1.1, dir: 1, sumbu: 'vertikal' },
    { id: 'mp_1_2_3', x: 2330, y: 350, width: 95, height: 22, startX: 2330, endX: 2530, speed: 1.4, dir: 1, sumbu: 'horizontal' }
  ],

  mysteryBlocks: [
    { id: 'mb_1_2_1', x: 300, y: 215, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_2_2', x: 480, y: 140, width: 36, height: 36, item: 'hati', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_2_3', x: 1400, y: 220, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_1_2_4', x: 1860, y: 215, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_1_2_5', x: 2800, y: 220, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_1_2_6', x: 3280, y: 215, width: 36, height: 36, item: 'bintang_bonus', hits: 1, bounceY: 0, disundul: false }
  ],

  leafCoins: [
    { x: 180, y: 405, r: 12, diambil: false },
    { x: 280, y: 295, r: 12, diambil: false },
    { x: 460, y: 215, r: 12, diambil: false },
    { x: 650, y: 285, r: 12, diambil: false },
    { x: 990, y: 310, r: 12, diambil: false },
    { x: 1040, y: 310, r: 12, diambil: false },
    { x: 1360, y: 305, r: 12, diambil: false },
    { x: 1560, y: 225, r: 12, diambil: false },
    { x: 1820, y: 295, r: 12, diambil: false },
    { x: 2040, y: 215, r: 12, diambil: false },
    { x: 2380, y: 310, r: 12, diambil: false },
    { x: 2430, y: 310, r: 12, diambil: false },
    { x: 2760, y: 305, r: 12, diambil: false },
    { x: 2980, y: 225, r: 12, diambil: false },
    { x: 3240, y: 295, r: 12, diambil: false },
    { x: 3460, y: 215, r: 12, diambil: false },
    { x: 3700, y: 285, r: 12, diambil: false }
  ],

  enemies: [
    { id: 'en_1_2_1', tipe: 'ulat', name: 'Ulat Bulu Kanopi', x: 500, y: 416, width: 34, height: 28, minX: 400, maxX: 700, vx: 1.0, isAlive: true, squishTimer: 0 },
    { id: 'en_1_2_2', tipe: 'belalang', name: 'Belalang Kanopi', x: 1450, y: 414, width: 36, height: 30, minX: 1300, maxX: 1650, vx: 1.1, vy: 0, jumpTimer: 2.0, isGrounded: true, isAlive: true, squishTimer: 0 },
    { id: 'en_1_2_3', tipe: 'kumbang', name: 'Kumbang Tanduk Hutan', x: 1900, y: 414, width: 36, height: 30, minX: 1750, maxX: 2150, vx: 1.5, isAlive: true, squishTimer: 0 },
    { id: 'en_1_2_4', tipe: 'belalang', name: 'Belalang Kanopi', x: 2900, y: 414, width: 36, height: 30, minX: 2700, maxX: 3100, vx: 1.2, vy: 0, jumpTimer: 2.2, isGrounded: true, isAlive: true, squishTimer: 0 },
    { id: 'en_1_2_5', tipe: 'kumbang', name: 'Kumbang Tanduk Hutan', x: 3350, y: 414, width: 36, height: 30, minX: 3200, maxX: 3550, vx: 1.6, isAlive: true, squishTimer: 0 }
  ],

  questionGates: ADVENTURE_QUESTIONS_DATABASE.level_1_2.map((q, idx) => {
    const tipos = ['jembatan_kanopi_1', 'pintu_kanopi_1', 'jembatan_kanopi_2', 'pintu_kanopi_2', 'pintu_kanopi_puncak'];
    return {
      ...q,
      x: [860, 1640, 2250, 3100, 3820][idx],
      y: 380,
      width: 48,
      height: 64,
      tipe: tipos[idx],
      terbuka: false
    };
  }),

  finishFlagpole: { x: 3980, baseY: 444, poleHeight: 280, flagY: 180, targetFlagY: 410, isSliding: false, cleared: false },
  victoryGazebo: { x: 4090, y: 360, width: 110, height: 84 }
};

// ============================================================================
// REGISTRI LEVEL & SISTEM PENYIMPANAN PROGRES
// ============================================================================

export const ADVENTURE_LEVELS_REGISTRY = {
  '1-1': LEVEL_1_1_DATA,
  '1-2': LEVEL_1_2_DATA,
  // Dunia 2 Level 2-1 menampung peta 7200px eksisting (Padang Rumput Savana)
  '2-1': {
    ...LEVEL1_DATA,
    worldId: 2,
    levelNum: 1,
    fullId: '2-1',
    nama: 'Padang Rumput Savana (7200px)',
    subjudul: 'Petualangan Panjang Savana & Aliran Energi',
    questionGates: ADVENTURE_QUESTIONS_DATABASE.level_2_1.map((q, idx) => {
      const origGate = LEVEL1_DATA.questionGates[idx] || {};
      return {
        ...q,
        x: origGate.x || [820, 2750, 4800, 6000, 6720][idx],
        y: origGate.y || 380,
        width: origGate.width || 48,
        height: origGate.height || 64,
        tipe: origGate.tipe || 'jembatan_abiotik',
        terbuka: false
      };
    })
  }
};

export const adventureWorldsProgress = {
  getStorageKey() {
    return 'kupas_adventure_progress_v2';
  },

  muatProgres() {
    try {
      const data = JSON.parse(localStorage.getItem(this.getStorageKey()));
      if (data && data.levels) return data;
    } catch (e) {}

    // Inisialisasi awal: Level 1-1 terbuka, lainnya bertahap
    return {
      totalCoins: 0,
      totalStars: 0,
      badges: [],
      currentWorld: 1,
      storyIntroSeen: false,
      levels: {
        '1-1': { unlocked: true, completed: false, stars: 0, coins: 0, score: 0, nama: 'Jalur Rimbun Hutan' },
        '1-2': { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Puncak Kanopi Hijau' },
        '2-1': { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Padang Rumput Savana' },
        '2-2': { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Lembah Keseimbangan' },
        '3-1': { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Hulu Sungai Pegunungan' },
        '3-2': { unlocked: false, completed: false, stars: 0, coins: 0, score: 0, nama: 'Muara & Samudra' }
      }
    };
  },

  simpanProgres(progres) {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(progres));
    } catch (e) {
      console.warn('Gagal menyimpan progres adventure v2:', e);
    }
  },

  selesaikanLevel(fullLevelId, stars, coinsEarned, score) {
    const p = this.muatProgres();
    const lvl = p.levels[fullLevelId] || { unlocked: true };
    lvl.completed = true;
    lvl.stars = Math.max(lvl.stars || 0, stars);
    lvl.coins = Math.max(lvl.coins || 0, coinsEarned);
    lvl.score = Math.max(lvl.score || 0, score);
    p.levels[fullLevelId] = lvl;

    // Buka level berikutnya secara berurutan
    const urutan = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2'];
    const idx = urutan.indexOf(fullLevelId);
    if (idx !== -1 && idx + 1 < urutan.length) {
      const nextLevelId = urutan[idx + 1];
      if (p.levels[nextLevelId]) {
        p.levels[nextLevelId].unlocked = true;
      }
    }

    p.totalCoins = (p.totalCoins || 0) + coinsEarned;
    let totalBintang = 0;
    Object.values(p.levels).forEach(l => { totalBintang += (l.stars || 0); });
    p.totalStars = totalBintang;

    const badgeId = `penjelajah_level_${fullLevelId.replace('-', '_')}`;
    if (!p.badges.includes(badgeId)) {
      p.badges.push(badgeId);
    }

    // Penghargaan Lencana Dunia saat level terakhir dunia selesai
    if (fullLevelId === '1-2' && !p.badges.includes('lencana_dunia_1')) {
      p.badges.push('lencana_dunia_1');
    } else if (fullLevelId === '2-2' && !p.badges.includes('lencana_dunia_2')) {
      p.badges.push('lencana_dunia_2');
    } else if (fullLevelId === '3-2' && !p.badges.includes('lencana_dunia_3')) {
      p.badges.push('lencana_dunia_3');
    }

    this.simpanProgres(p);
    return p;
  }
};
