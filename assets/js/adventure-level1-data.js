/**
 * KUPAS KUIS IPAS - Data Level 1: Padang Rumput Asri (adventure-level1-data.js)
 * Format modular untuk platformer 2D ala Super Mario.
 * Dunia berukuran 7200 x 540 piksel dengan 5 gerbang soal IPAS, 3 checkpoint,
 * blok misteri '?', koin daun, platform bergerak, dan musuh ramah anak.
 */

export const LEVEL1_DATA = {
  id: 1,
  nama: 'Padang Rumput Asri',
  tema: 'padang_rumput',
  worldWidth: 7200,
  worldHeight: 540,
  groundY: 444,

  // Titik Mulai Pemain
  spawnPoint: { x: 80, y: 380 },

  // Pos Pemeriksaan (Checkpoints)
  checkpoints: [
    { id: 'cp_1', x: 1800, y: 444, name: 'Pos 1: Lembah Bunga', aktif: false },
    { id: 'cp_2', x: 3600, y: 444, name: 'Pos 2: Kincir Irigasi', aktif: false },
    { id: 'cp_3', x: 5350, y: 444, name: 'Pos 3: Bukit Rantai Makanan', aktif: false }
  ],

  // Platform Statis & Jurang (Collision Poligon/Kotak)
  platforms: [
    // --- SEKTOR 1: PENGENALAN & GERBANG 1 (x: 0 .. 1500) ---
    { x: 0, y: 444, width: 850, height: 96, tipe: 'tanah' },
    { x: 260, y: 340, width: 110, height: 26, tipe: 'platform' },
    { x: 440, y: 265, width: 120, height: 26, tipe: 'platform' },
    { x: 620, y: 330, width: 100, height: 26, tipe: 'platform' },
    // Jurang Sungai 1 (x: 850 .. 1080)
    // Jembatan Abiotik Gerbang 1
    { x: 850, y: 444, width: 230, height: 32, tipe: 'jembatan_abiotik', terbuka: false },
    { x: 1080, y: 444, width: 820, height: 96, tipe: 'tanah' },
    { x: 1220, y: 350, width: 110, height: 26, tipe: 'platform' },
    { x: 1400, y: 275, width: 130, height: 26, tipe: 'platform' },

    // --- SEKTOR 2: LEMBAH BUNGA & GERBANG 2 (x: 1900 .. 3300) ---
    { x: 1900, y: 444, width: 900, height: 96, tipe: 'tanah' },
    { x: 2050, y: 350, width: 110, height: 26, tipe: 'platform' },
    { x: 2240, y: 270, width: 120, height: 26, tipe: 'platform' },
    { x: 2450, y: 340, width: 130, height: 26, tipe: 'platform' },
    // Jurang Sungai 2 (x: 2800 .. 3020)
    { x: 3020, y: 444, width: 880, height: 96, tipe: 'tanah' },
    { x: 3180, y: 350, width: 120, height: 26, tipe: 'platform' },
    { x: 3380, y: 270, width: 110, height: 26, tipe: 'platform' },

    // --- SEKTOR 3: KINCIR IRIGASI & GERBANG 3 (x: 3900 .. 4900) ---
    { x: 3900, y: 444, width: 950, height: 96, tipe: 'tanah' },
    { x: 4100, y: 345, width: 120, height: 26, tipe: 'platform' },
    { x: 4320, y: 265, width: 140, height: 26, tipe: 'platform' },
    { x: 4560, y: 340, width: 120, height: 26, tipe: 'platform' },
    // Jurang Air Terjun 3 (x: 4850 .. 5100)
    { x: 5100, y: 444, width: 950, height: 96, tipe: 'tanah' },
    { x: 5260, y: 350, width: 120, height: 26, tipe: 'platform' },
    { x: 5460, y: 270, width: 130, height: 26, tipe: 'platform' },

    // --- SEKTOR 4: BUKIT RANTAI MAKANAN & GERBANG 4 (x: 5500 .. 6400) ---
    { x: 5700, y: 350, width: 110, height: 26, tipe: 'platform' },
    { x: 5900, y: 270, width: 120, height: 26, tipe: 'platform' },
    // Jurang Sungai 4 (x: 6050 .. 6250)
    { x: 6250, y: 444, width: 950, height: 96, tipe: 'tanah' },

    // --- SEKTOR 5: GERBANG KESEIMBANGAN & TIANG FINIS (x: 6400 .. 7200) ---
    { x: 6420, y: 350, width: 120, height: 26, tipe: 'platform' },
    { x: 6600, y: 270, width: 130, height: 26, tipe: 'platform' }
  ],

  // Platform Bergerak (Moving Platforms)
  movingPlatforms: [
    // Platform bergerak horizontal di atas jurang 1
    {
      id: 'mp_1',
      x: 870, y: 360, width: 90, height: 22,
      startX: 870, endX: 1060, speed: 1.2, dir: 1, sumbu: 'horizontal'
    },
    // Platform bergerak vertikal di lembah bunga
    {
      id: 'mp_2',
      x: 2620, y: 380, width: 95, height: 22,
      startY: 230, endY: 390, speed: 1.0, dir: 1, sumbu: 'vertikal'
    },
    // Platform bergerak horizontal di atas jurang 2
    {
      id: 'mp_3',
      x: 2820, y: 355, width: 90, height: 22,
      startX: 2820, endX: 3000, speed: 1.3, dir: 1, sumbu: 'horizontal'
    },
    // Platform bergerak vertikal di area kincir
    {
      id: 'mp_4',
      x: 4880, y: 370, width: 95, height: 22,
      startY: 240, endY: 400, speed: 1.1, dir: 1, sumbu: 'vertikal'
    },
    // Platform bergerak horizontal di bukit rantai makanan
    {
      id: 'mp_5',
      x: 6070, y: 350, width: 90, height: 22,
      startX: 6070, endX: 6230, speed: 1.4, dir: 1, sumbu: 'horizontal'
    }
  ],

  // Blok Misteri '?' ala Super Mario (bisa disundul dari bawah)
  mysteryBlocks: [
    { id: 'mb_1', x: 330, y: 300, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_2', x: 500, y: 225, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_3', x: 1300, y: 300, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_4', x: 1470, y: 225, width: 36, height: 36, item: 'hati', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_5', x: 2150, y: 300, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_6', x: 2360, y: 220, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_7', x: 3260, y: 300, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_8', x: 4220, y: 295, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_9', x: 4420, y: 215, width: 36, height: 36, item: 'hati', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_10', x: 5360, y: 300, width: 36, height: 36, item: 'koin', hits: 1, bounceY: 0, disundul: false },
    { id: 'mb_11', x: 5800, y: 300, width: 36, height: 36, item: 'koin_ganda', hits: 2, bounceY: 0, disundul: false },
    { id: 'mb_12', x: 6500, y: 300, width: 36, height: 36, item: 'bintang_bonus', hits: 1, bounceY: 0, disundul: false }
  ],

  // Koin Daun Koleksi Tersebar di Jalur (~65 koin)
  leafCoins: [
    // Sektor 1
    { x: 180, y: 405, r: 12, diambil: false },
    { x: 210, y: 405, r: 12, diambil: false },
    { x: 290, y: 305, r: 12, diambil: false },
    { x: 320, y: 305, r: 12, diambil: false },
    { x: 460, y: 230, r: 12, diambil: false },
    { x: 490, y: 230, r: 12, diambil: false },
    { x: 520, y: 230, r: 12, diambil: false },
    { x: 650, y: 295, r: 12, diambil: false },
    { x: 680, y: 295, r: 12, diambil: false },
    { x: 920, y: 320, r: 12, diambil: false }, // Di atas jembatan
    { x: 970, y: 320, r: 12, diambil: false },
    { x: 1020, y: 320, r: 12, diambil: false },
    { x: 1250, y: 315, r: 12, diambil: false },
    { x: 1430, y: 240, r: 12, diambil: false },
    { x: 1460, y: 240, r: 12, diambil: false },

    // Sektor 2
    { x: 1960, y: 405, r: 12, diambil: false },
    { x: 2000, y: 405, r: 12, diambil: false },
    { x: 2080, y: 315, r: 12, diambil: false },
    { x: 2270, y: 235, r: 12, diambil: false },
    { x: 2300, y: 235, r: 12, diambil: false },
    { x: 2480, y: 305, r: 12, diambil: false },
    { x: 2510, y: 305, r: 12, diambil: false },
    { x: 2650, y: 320, r: 12, diambil: false },
    { x: 2870, y: 315, r: 12, diambil: false },
    { x: 2920, y: 315, r: 12, diambil: false },
    { x: 3100, y: 405, r: 12, diambil: false },
    { x: 3210, y: 315, r: 12, diambil: false },
    { x: 3410, y: 235, r: 12, diambil: false },
    { x: 3450, y: 235, r: 12, diambil: false },

    // Sektor 3
    { x: 3960, y: 405, r: 12, diambil: false },
    { x: 4000, y: 405, r: 12, diambil: false },
    { x: 4130, y: 310, r: 12, diambil: false },
    { x: 4350, y: 230, r: 12, diambil: false },
    { x: 4380, y: 230, r: 12, diambil: false },
    { x: 4410, y: 230, r: 12, diambil: false },
    { x: 4590, y: 305, r: 12, diambil: false },
    { x: 4920, y: 310, r: 12, diambil: false },
    { x: 5150, y: 405, r: 12, diambil: false },
    { x: 5290, y: 315, r: 12, diambil: false },
    { x: 5490, y: 235, r: 12, diambil: false },

    // Sektor 4
    { x: 5730, y: 315, r: 12, diambil: false },
    { x: 5930, y: 235, r: 12, diambil: false },
    { x: 5960, y: 235, r: 12, diambil: false },
    { x: 6120, y: 310, r: 12, diambil: false },
    { x: 6160, y: 310, r: 12, diambil: false },
    { x: 6300, y: 405, r: 12, diambil: false },
    { x: 6350, y: 405, r: 12, diambil: false },

    // Sektor 5
    { x: 6450, y: 315, r: 12, diambil: false },
    { x: 6630, y: 235, r: 12, diambil: false },
    { x: 6660, y: 235, r: 12, diambil: false },
    { x: 6730, y: 405, r: 12, diambil: false }
  ],

  // Musuh Ramah Anak (Enemies) - Tanpa Darah/Kekerasan
  // Bisa diinjak dari atas (stomp bounce) untuk mengalahkannya
  enemies: [
    // Ulat Daun (Goomba style: jalan bolak-balik lambat)
    {
      id: 'en_1', tipe: 'ulat', name: 'Ulat Daun Hama',
      x: 480, y: 416, width: 34, height: 28,
      minX: 380, maxX: 680, vx: 0.9,
      isAlive: true, squishTimer: 0
    },
    {
      id: 'en_2', tipe: 'ulat', name: 'Ulat Daun Hama',
      x: 1350, y: 416, width: 34, height: 28,
      minX: 1150, maxX: 1550, vx: 1.0,
      isAlive: true, squishTimer: 0
    },
    // Belalang Perusak (melompat berkala)
    {
      id: 'en_3', tipe: 'belalang', name: 'Belalang Perusak',
      x: 2150, y: 414, width: 36, height: 30,
      minX: 2000, maxX: 2380, vx: 1.1, vy: 0,
      jumpTimer: 2.2, isGrounded: true,
      isAlive: true, squishTimer: 0
    },
    {
      id: 'en_4', tipe: 'ulat', name: 'Ulat Daun Hama',
      x: 3250, y: 416, width: 34, height: 28,
      minX: 3080, maxX: 3450, vx: 1.1,
      isAlive: true, squishTimer: 0
    },
    // Tikus Sawah / Kumbang (patroli cepat)
    {
      id: 'en_5', tipe: 'kumbang', name: 'Kumbang Pengerek Batang',
      x: 4200, y: 414, width: 36, height: 30,
      minX: 4000, maxX: 4480, vx: 1.5,
      isAlive: true, squishTimer: 0
    },
    {
      id: 'en_6', tipe: 'belalang', name: 'Belalang Perusak',
      x: 5350, y: 414, width: 36, height: 30,
      minX: 5200, maxX: 5550, vx: 1.2, vy: 0,
      jumpTimer: 2.0, isGrounded: true,
      isAlive: true, squishTimer: 0
    },
    {
      id: 'en_7', tipe: 'kumbang', name: 'Kumbang Pengerek Batang',
      x: 6380, y: 414, width: 36, height: 30,
      minX: 6280, maxX: 6580, vx: 1.6,
      isAlive: true, squishTimer: 0
    }
  ],

  // 5 Gerbang Tantangan Soal IPAS (Kurikulum Kelas V SD)
  questionGates: [
    {
      id: 'gate_1',
      x: 820,
      y: 380,
      width: 48,
      height: 64,
      tipe: 'jembatan_abiotik',
      judul: 'Gerbang 1: Jembatan Abiotik Sungai',
      instruksi: 'Jembatan rusak! Jawab pertanyaan tentang komponen abiotik untuk menyambung jembatan kayu!',
      pertanyaan: 'Manakah di bawah ini yang seluruhnya merupakan komponen ABIOTIK (benda tak hidup) di sekitar sungai padang rumput?',
      opsi: [
        'Batu kerikil, air sungai, dan sinar matahari',
        'Ikan kecil, cacing tanah, dan rumput teki',
        'Jamur pengurai, lumut, dan katak hijau',
        'Burung pipit, capung, dan pohon beringin'
      ],
      kunci: 0,
      penjelasan: 'Komponen abiotik adalah semua benda tak hidup dalam ekosistem, seperti batu, air, tanah, udara, dan cahaya matahari.',
      terbuka: false
    },
    {
      id: 'gate_2',
      x: 2750,
      y: 380,
      width: 48,
      height: 64,
      tipe: 'bunga_fotosintesis',
      judul: 'Gerbang 2: Bunga Padang Layu',
      instruksi: 'Bunga liar padang layu kepanasan. Agar berfotosintesis dan kembali mekar, apa yang dibutuhkannya?',
      pertanyaan: 'Bahan apakah yang diserap oleh akar tumbuhan dari dalam tanah dan daun dari udara untuk proses fotosintesis?',
      opsi: [
        'Menghirup gas oksigen dan pupuk buatan',
        'Air dari tanah dan gas karbon dioksida dari udara',
        'Minyak tanah dan sari gula pasir',
        'Gas nitrogen dan serbuk kapur'
      ],
      kunci: 1,
      penjelasan: 'Tumbuhan hijau membutuhkan air dari tanah dan karbon dioksida (CO2) dari udara, dibantu cahaya matahari dan klorofil.',
      terbuka: false
    },
    {
      id: 'gate_3',
      x: 4800,
      y: 380,
      width: 48,
      height: 64,
      tipe: 'kincir_kinetik',
      judul: 'Gerbang 3: Kincir Air Irigasi',
      instruksi: 'Saluran irigasi macet. Pahami perubahan energi agar bilah kincir air berputar kembali!',
      pertanyaan: 'Perubahan bentuk energi apakah yang dimanfaatkan kincir air dari arus sungai untuk menyiram padang rumput?',
      opsi: [
        'Energi panas bumi menjadi energi listrik',
        'Energi kinetik (gerak) air mengalir menjadi energi gerak kincir',
        'Energi bunyi air menjadi energi magnet',
        'Energi kimia air menjadi energi cahaya'
      ],
      kunci: 1,
      penjelasan: 'Arus air sungai yang mengalir memiliki energi kinetik (gerak) yang mendorong bilah kincir menjadi gerak mekanis.',
      terbuka: false
    },
    {
      id: 'gate_4',
      x: 6000,
      y: 380,
      width: 48,
      height: 64,
      tipe: 'rantai_makanan',
      judul: 'Gerbang 4: Produsen Padang Rumput',
      instruksi: 'Jawab ujian rantai makanan untuk membuka jalan ke bukit ekosistem!',
      pertanyaan: 'Di padang rumput terdapat: Rumput -> Belalang -> Katak -> Ular -> Elang. Makhluk hidup manakah yang berperan sebagai PRODUSEN?',
      opsi: [
        'Rumput hijau',
        'Belalang sawah',
        'Katak pemakan serangga',
        'Burung Elang'
      ],
      kunci: 0,
      penjelasan: 'Rumput hijau adalah produsen karena mampu membuat makanannya sendiri melalui proses fotosintesis.',
      terbuka: false
    },
    {
      id: 'gate_5',
      x: 6720,
      y: 380,
      width: 48,
      height: 64,
      tipe: 'gerbang_akhir',
      judul: 'Gerbang 5: Keseimbangan Ekosistem & Pintu Kemenangan',
      instruksi: 'Ujian penutup sebelum mencapai Tiang Bendera Kemenangan!',
      pertanyaan: 'Jika populasi katak di padang rumput punah karena diburu liar, dampak langsung apa yang terjadi pada rantai makanan?',
      opsi: [
        'Populasi belalang melonjak pesat karena pemangsanya hilang',
        'Rumput bertumbuh sangat subur melimpah',
        'Populasi ular langsung berlipat ganda',
        'Seluruh tumbuhan langsung layu seketika'
      ],
      kunci: 0,
      penjelasan: 'Katak adalah predator pengendali belalang. Jika katak punah, populasi belalang melonjak drastis dan merusak rumput produsen.',
      terbuka: false
    }
  ],

  // Tiang Bendera Finis ala Super Mario
  finishFlagpole: {
    x: 6850,
    baseY: 444,
    poleHeight: 280,
    flagY: 180,
    targetFlagY: 410,
    isSliding: false,
    cleared: false
  },

  // Gazebo Kemenangan di Balik Tiang Bendera
  victoryGazebo: {
    x: 7020,
    y: 360,
    width: 120,
    height: 84
  }
};

