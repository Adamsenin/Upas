/**
 * KUPAS KUIS IPAS - Data 30 Soal Petualangan IPAS Kelas V SD (adventure-questions-data.js)
 *
 * Diadaptasi dari bank soal terverifikasi (scratch/30_soal_ipas_kelas5.csv).
 * CATATAN UNTUK GURU:
 * Data soal di bawah ini adalah data contoh terverifikasi sesuai Capaian Pembelajaran IPAS Fase C.
 * Guru dapat menyesuaikan atau menambah butir soal melalui Dasbor Bank Soal KUPAS.
 */

export const ADVENTURE_QUESTIONS_DATABASE = {
  // ==========================================================================
  // DUNIA 1: HUTAN CERIA (10 SOAL)
  // ==========================================================================

  // Level 1-1: Jalur Rimbun Hutan (Produsen, Konsumen I, & Fotosintesis)
  'level_1_1': [
    {
      id: 'q_1_1_1',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 1: Rahasia Daun Hijau',
      instruksi: 'Pahami peran tumbuhan di dasar hutan tropis untuk membuka gerbang sulur!',
      pertanyaan: 'Tumbuhan hijau dalam ekosistem bertindak sebagai produsen karena...',
      opsi: [
        'Dapat membuat makanannya sendiri lewat fotosintesis',
        'Memakan hewan lain yang lebih kecil',
        'Menguraikan sampah organik di tanah',
        'Menyerap makanan dari akar tumbuhan lain'
      ],
      kunci: 0,
      penjelasan: 'Tumbuhan hijau adalah organisme autotrof yang melakukan fotosintesis menghasilkan glukosa dan melepaskan oksigen.'
    },
    {
      id: 'q_1_1_2',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 2: Pemakan Tumbuhan',
      instruksi: 'Identifikasi tingkat trofik satwa pemakan rumput dan dedaunan!',
      pertanyaan: 'Hewan pemakan tumbuhan (herbivora) dalam rantai makanan menduduki tingkat...',
      opsi: [
        'Konsumen Tingkat I',
        'Konsumen Tingkat II',
        'Konsumen Puncak',
        'Pengurai'
      ],
      kunci: 0,
      penjelasan: 'Konsumen Tingkat I (herbivora) memakan langsung produsen tumbuhan untuk memperoleh energi.'
    },
    {
      id: 'q_1_1_3',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 3: Sumber Energi Utama',
      instruksi: 'Temukan asal muasal seluruh energi yang menghidupi hutan!',
      pertanyaan: 'Energi utama yang diserap oleh tumbuhan untuk menggerakkan rantai makanan berasal dari...',
      opsi: [
        'Cahaya sinar matahari',
        'Zat asam dari air hujan',
        'Panas dari inti bumi',
        'Gas nitrogen di udara bebas'
      ],
      kunci: 0,
      penjelasan: 'Matahari adalah sumber energi primer bagi seluruh kehidupan di bumi yang diserap klorofil tumbuhan.'
    },
    {
      id: 'q_1_1_4',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 4: Sahabat Omnivora',
      instruksi: 'Kenali satwa yang memakan tumbuhan sekaligus hewan kecil di lantai hutan!',
      pertanyaan: 'Hewan yang tergolong omnivora (pemakan segala) di sekitar ekosistem adalah...',
      opsi: [
        'Ayam dan musang pemakan biji serta cacing',
        'Kambing pemakan rumput teki',
        'Kelinci pemakan wortel',
        'Kupu-kupu penghisap nektar'
      ],
      kunci: 0,
      penjelasan: 'Hewan omnivora memakan bahan nabati (tumbuhan) sekaligus hewani (serangga/cacing).'
    },
    {
      id: 'q_1_1_5',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 5: Penjaga Keseimbangan',
      instruksi: 'Ujian penutup Level 1-1 sebelum menaiki kanopi pohon beringin!',
      pertanyaan: 'Keseimbangan ekosistem hutan dapat terjaga apabila...',
      opsi: [
        'Jumlah populasi produsen selalu melimpah daripada konsumen',
        'Semua serangga dibasmi hingga habis',
        'Seluruh pohon besar ditebang untuk lahan terbuka',
        'Jumlah karnivora jauh melebihi jumlah herbivora'
      ],
      kunci: 0,
      penjelasan: 'Dasar piramida ekologi harus selalu memiliki biomassa produsen terbesar agar mampu menopang konsumen di atasnya.'
    }
  ],

  // Level 1-2: Puncak Kanopi Hijau (Karnivora, Dekomposer, & Jaring Makanan)
  'level_1_2': [
    {
      id: 'q_1_2_1',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 1: Jaring-Jaring Makanan',
      instruksi: 'Pahami hubungan makan-dimakan yang bercabang di tajuk kanopi pohon!',
      pertanyaan: 'Kumpulan rantai makanan yang saling tumpang tindih dan berhubungan di dalam hutan disebut...',
      opsi: [
        'Jaring-jaring makanan',
        'Piramida batuan',
        'Siklus udara tunggal',
        'Rantai trofik lurus'
      ],
      kunci: 0,
      penjelasan: 'Jaring-jaring makanan adalah gabungan berbagai rantai makanan yang saling berinterelasi dalam suatu ekosistem.'
    },
    {
      id: 'q_1_2_2',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 2: Sang Pengurai Hutan',
      instruksi: 'Siapakah yang mengembalikan zat hara dari daun gugur ke dalam tanah?',
      pertanyaan: 'Organisme dekomposer yang bertugas menguraikan bangkai dan dedaunan mati di hutan adalah...',
      opsi: [
        'Bakteri dan jamur tanah',
        'Burung elang dan ular pohon',
        'Kera dan tupai kanopi',
        'Rusa dan kancil'
      ],
      kunci: 0,
      penjelasan: 'Bakteri dan jamur (dekomposer) menguraikan materi organik mati menjadi mineral hara yang diserap kembali oleh akar tumbuhan.'
    },
    {
      id: 'q_1_2_3',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 3: Sang Konsumen Puncak',
      instruksi: 'Kenali karakteristik predator di puncak tajuk kanopi pohon!',
      pertanyaan: 'Burung elang di kanopi hutan bertindak sebagai konsumen puncak karena...',
      opsi: [
        'Tidak memiliki predator alami yang memangsa dirinya',
        'Hanya memakan dedaunan muda',
        'Mampu menghasilkan makanannya sendiri',
        'Bertubuh paling kecil di antara hewan lain'
      ],
      kunci: 0,
      penjelasan: 'Konsumen puncak berada di ujung rantai makanan tanpa pemangsa alami di habitatnya.'
    },
    {
      id: 'q_1_2_4',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 4: Aliran Energi 10 Persen',
      instruksi: 'Berapakah energi yang berpindah saat hewan memakan mangsanya?',
      pertanyaan: 'Menurut kaidah piramida energi, porsi energi yang diteruskan ke tingkat trofik berikutnya sekitar...',
      opsi: [
        '10 persen',
        '50 persen',
        '90 persen',
        '100 persen utuh'
      ],
      kunci: 0,
      penjelasan: 'Sebagian besar energi (~90%) terlepas sebagai panas tubuh dan sisa metabolisme; hanya sekitar 10% yang menjadi biomassa baru.'
    },
    {
      id: 'q_1_2_5',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 5: Puncak Kanopi Emas',
      instruksi: 'Ujian terakhir Dunia 1 untuk meraih Mahkota Bunga Hutan Ceria!',
      pertanyaan: 'Jika jamur dan bakteri pengurai di hutan musnah total, apa yang akan terjadi?',
      opsi: [
        'Bangkai dan sampah daun menumpuk, tanah kehilangan kesuburan',
        'Hutan tumbuh semakin lebat tanpa gangguan',
        'Hewan herbivora bertambah semakin gemuk',
        'Air sungai langsung mengering seketika'
      ],
      kunci: 0,
      penjelasan: 'Tanpa pengurai, nutrisi terkunci di bangkai mati dan tidak dapat didaur ulang kembali ke tumbuhan produsen.'
    }
  ],

  // ==========================================================================
  // DUNIA 2: PADANG RUMPUT (10 SOAL)
  // ==========================================================================

  // Level 2-1: Padang Rumput Savana (Peta 7200px Eksisting yang Dilestarikan)
  'level_2_1': [
    {
      id: 'q_2_1_1',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 1: Jembatan Abiotik Sungai',
      instruksi: 'Jawab pertanyaan tentang komponen abiotik untuk menyeberangi sungai padang rumput!',
      pertanyaan: 'Manakah di bawah ini yang seluruhnya merupakan komponen ABIOTIK (benda tak hidup) di sekitar sungai padang rumput?',
      opsi: [
        'Batu kerikil, air sungai, dan sinar matahari',
        'Ikan kecil, cacing tanah, dan rumput teki',
        'Jamur pengurai, lumut, dan katak hijau',
        'Burung pipit, capung, dan pohon beringin'
      ],
      kunci: 0,
      penjelasan: 'Komponen abiotik adalah semua benda tak hidup dalam ekosistem seperti batu, air, tanah, udara, dan cahaya matahari.'
    },
    {
      id: 'q_2_1_2',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 2: Bunga Padang Layu',
      instruksi: 'Bunga liar padang layu kepanasan. Agar berfotosintesis dan kembali mekar, apa yang dibutuhkannya?',
      pertanyaan: 'Bahan apakah yang diserap oleh akar tumbuhan dari dalam tanah dan daun dari udara untuk fotosintesis?',
      opsi: [
        'Air dari tanah dan gas karbon dioksida dari udara',
        'Menghirup gas oksigen dan pupuk buatan',
        'Minyak tanah dan sari gula pasir',
        'Gas nitrogen dan serbuk kapur'
      ],
      kunci: 0,
      penjelasan: 'Tumbuhan hijau membutuhkan air dari tanah dan gas karbon dioksida (CO2) dari udara, dibantu cahaya matahari dan klorofil.'
    },
    {
      id: 'q_2_1_3',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 3: Kincir Air Irigasi',
      instruksi: 'Saluran irigasi macet. Pahami perubahan energi agar bilah kincir air berputar kembali!',
      pertanyaan: 'Perubahan bentuk energi apakah yang dimanfaatkan kincir air dari arus sungai untuk menyiram padang rumput?',
      opsi: [
        'Energi kinetik (gerak) air mengalir menjadi energi gerak kincir',
        'Energi panas bumi menjadi energi listrik',
        'Energi bunyi air menjadi energi magnet',
        'Energi kimia air menjadi energi cahaya'
      ],
      kunci: 0,
      penjelasan: 'Arus air sungai yang mengalir memiliki energi kinetik (gerak) yang mendorong bilah kincir menjadi gerak mekanis.'
    },
    {
      id: 'q_2_1_4',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
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
      penjelasan: 'Rumput hijau adalah produsen karena mampu membuat makanannya sendiri melalui proses fotosintesis.'
    },
    {
      id: 'q_2_1_5',
      isSampleData: true,
      bab: 'Bab 1: Rantai Makanan',
      judul: 'Gerbang 5: Keseimbangan Predator',
      instruksi: 'Ujian penutup sebelum mencapai Tiang Bendera Kemenangan Savana!',
      pertanyaan: 'Jika populasi katak di padang rumput punah karena diburu liar, dampak langsung apa yang terjadi pada rantai makanan?',
      opsi: [
        'Populasi belalang melonjak pesat karena pemangsanya hilang',
        'Rumput bertumbuh sangat subur melimpah',
        'Populasi ular langsung berlipat ganda',
        'Seluruh tumbuhan langsung layu seketika'
      ],
      kunci: 0,
      penjelasan: 'Katak adalah predator pengendali belalang. Jika katak punah, populasi belalang melonjak drastis dan merusak rumput produsen.'
    }
  ],

  // Level 2-2: Lembah Keseimbangan (Simbiosis & Harmoni Alam)
  'level_2_2': [
    {
      id: 'q_2_2_1',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 1: Rumah Alami Makhluk Hidup',
      instruksi: 'Temukan istilah tempat tinggal makhluk hidup!',
      pertanyaan: 'Tempat tinggal alami suatu makhluk hidup untuk hidup, tumbuh, dan berkembang biak dinamakan...',
      opsi: [
        'Habitat',
        'Populasi',
        'Komunitas',
        'Biosfer'
      ],
      kunci: 0,
      penjelasan: 'Habitat adalah lingkungan fisik alami tempat suatu spesies hewan atau tumbuhan hidup dan bertahan hidup.'
    },
    {
      id: 'q_2_2_2',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 2: Sahabat yang Saling Menguntungkan',
      instruksi: 'Kenali bentuk persahabatan antar spesies yang saling membantu!',
      pertanyaan: 'Hubungan simbiosis mutualisme yang saling menguntungkan kedua pihak dicontohkan oleh...',
      opsi: [
        'Lebah mengisap nektar bunga sambil membantu penyerbukan',
        'Nyamuk mengisap darah manusia',
        'Anggrek menempel di batang pohon mangga',
        'Tali putri mengisap nutrisi tanaman inang'
      ],
      kunci: 0,
      penjelasan: 'Lebah mendapat makanan nektar bergizi, sedangkan bunga berhasil terbantu perkembangbiakannya melalui penyerbukan serbuk sari.'
    },
    {
      id: 'q_2_2_3',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 3: Menumpang Tanpa Merugikan',
      instruksi: 'Pahami simbiosis komensalisme pada tanaman epifit!',
      pertanyaan: 'Simbiosis antara tanaman anggrek dan pohon mangga disebut komensalisme karena...',
      opsi: [
        'Anggrek diuntungkan tempat tinggi, pohon tidak dirugikan',
        'Keduanya saling bertukar sari makanan',
        'Pohon mangga menjadi kerdil dan mati',
        'Anggrek melubangi dahan pohon mangga'
      ],
      kunci: 0,
      penjelasan: 'Komensalisme adalah interaksi di mana satu pihak untung (mendapat cahaya matahari) dan pihak lain netral (tidak dirugikan).'
    },
    {
      id: 'q_2_2_4',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 4: Dampak Parasit Merugikan',
      instruksi: 'Kenali dampak buruk organisme parasit pada inangnya!',
      pertanyaan: 'Cacing pita atau kutu pada hewan peliharaan termasuk bentuk simbiosis parasitisme karena...',
      opsi: [
        'Parasit mengambil nutrisi sambil merugikan inangnya',
        'Keduanya saling memberi makanan',
        'Hewan inang bertambah sehat dan kuat',
        'Parasit membantu membersihkan bulu inang'
      ],
      kunci: 0,
      penjelasan: 'Parasitisme terjadi bila satu organisme mengambil keuntungan dengan cara menyerap zat hidup dan merugikan pihak lain.'
    },
    {
      id: 'q_2_2_5',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 5: Gerbang Mahkota Savana',
      instruksi: 'Ujian puncak Dunia 2 untuk membuka jalan menuju Dunia 3!',
      pertanyaan: 'Upaya penanaman kembali pohon-pohon di hutan atau bukit yang telah gundul dinamakan...',
      opsi: [
        'Reboisasi',
        'Irigasi',
        'Abrasi',
        'Erosi'
      ],
      kunci: 0,
      penjelasan: 'Reboisasi adalah kegiatan penghijauan kembali kawasan lahan hutan gundul agar tanah mampu mengikat air dan mencegah longsor.'
    }
  ],

  // ==========================================================================
  // DUNIA 3: SUNGAI KEHIDUPAN (10 SOAL)
  // ==========================================================================

  // Level 3-1: Hulu Sungai Pegunungan (Siklus Air: Evaporasi & Kondensasi)
  'level_3_1': [
    {
      id: 'q_3_1_1',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 1: Uap Air yang Membumbung',
      instruksi: 'Bagaimana air sungai dan laut bisa naik menuju langit?',
      pertanyaan: 'Proses penguapan air permukaan laut atau danau akibat terik panas matahari dinamakan...',
      opsi: [
        'Evaporasi',
        'Kondensasi',
        'Presipitasi',
        'Infiltrasi'
      ],
      kunci: 0,
      penjelasan: 'Evaporasi adalah perubahan wujud air cair menjadi uap air yang naik ke atmosfer bumi.'
    },
    {
      id: 'q_3_1_2',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 2: Nafas Daun Pegunungan',
      instruksi: 'Tumbuhan juga melepaskan uap air ke angkasa!',
      pertanyaan: 'Pelepasan uap air dari daun-daun pepohonan melalui pori stomata disebut...',
      opsi: [
        'Transpirasi',
        'Evaporasi air asin',
        'Sublimasi es',
        'Kondensasi awan'
      ],
      kunci: 0,
      penjelasan: 'Transpirasi adalah proses penguapan air dari jaringan tubuh tumbuhan hidup ke atmosfer.'
    },
    {
      id: 'q_3_1_3',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 3: Lahirnya Gumpalan Awan',
      instruksi: 'Bagaimana uap air berubah menjadi awan putih di langit?',
      pertanyaan: 'Uap air yang mendingin di lapisan udara tinggi lalu mengembun menjadi titik-titik air awan disebut...',
      opsi: [
        'Kondensasi',
        'Presipitasi',
        'Infiltrasi',
        'Evaporasi'
      ],
      kunci: 0,
      penjelasan: 'Kondensasi terjadi saat uap air mengalami penurunan suhu sehingga memadat menjadi kumpulan butiran air mikro pembentuk awan.'
    },
    {
      id: 'q_3_1_4',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 4: Curahan Hujan Berkah',
      instruksi: 'Ketika awan jenuh tak sanggup lagi menahan butir air!',
      pertanyaan: 'Jatuhnya butiran air dari awan jenuh ke permukaan tanah dalam bentuk hujan dinamakan...',
      opsi: [
        'Presipitasi',
        'Kondensasi',
        'Transpirasi',
        'Evaporasi'
      ],
      kunci: 0,
      penjelasan: 'Presipitasi adalah segala bentuk curahan air yang jatuh dari atmosfer ke bumi (hujan, salju, atau hujan es).'
    },
    {
      id: 'q_3_1_5',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 5: Arus Jeram Hulu',
      instruksi: 'Pertanyaan penutup sebelum menuruni air terjun menuju muara!',
      pertanyaan: 'Awan tebal bergumpal gelap yang menjadi pertanda akan datangnya badai petir dan hujan deras adalah...',
      opsi: [
        'Awan Kumulonimbus',
        'Awan Sirus tipis',
        'Awan Stratus berlapis',
        'Awan Altosirrus'
      ],
      kunci: 0,
      penjelasan: 'Awan Kumulonimbus memiliki massa uap air vertikal masif yang sering memicu kilat, petir, dan hujan lebat.'
    }
  ],

  // Level 3-2: Muara & Samudra Kehidupan (Infiltrasi, Muara Mangrove, & Kelestarian Bumi)
  'level_3_2': [
    {
      id: 'q_3_2_1',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 1: Resapan Air Tanah',
      instruksi: 'Ke mana perginya air hujan yang jatuh ke tanah terbuka?',
      pertanyaan: 'Proses meresapnya air permukaan ke dalam pori-pori tanah dan batuan bumi dinamakan...',
      opsi: [
        'Infiltrasi',
        'Kondensasi',
        'Evaporasi kilat',
        'Abrasi pantai'
      ],
      kunci: 0,
      penjelasan: 'Infiltrasi adalah peresapan air ke dalam lapisan tanah yang menjadi cadangan air tanah (air sumur/mata air).'
    },
    {
      id: 'q_3_2_2',
      isSampleData: true,
      bab: 'Bab 3: Siklus Air & Cuaca',
      judul: 'Gerbang 2: Bahaya Lantai Semen',
      instruksi: 'Mengapa pekarangan harus memiliki tanah resapan terbuka?',
      pertanyaan: 'Jika seluruh tanah pekarangan ditutup semen dan aspal kedap air, dampak langsungnya adalah...',
      opsi: [
        'Air hujan sulit meresap sehingga rawan banjir',
        'Air tanah menjadi berlipat ganda melimpah',
        'Fotosintesis tanaman melonjak drastis',
        'Curah hujan mendadak berhenti selamanya'
      ],
      kunci: 0,
      penjelasan: 'Lapisan semen menghambat infiltrasi, memperbesar limpasan permukaan (*surface runoff*), dan memicu banjir genangan.'
    },
    {
      id: 'q_3_2_3',
      isSampleData: true,
      bab: 'Bab 2: Harmoni dalam Ekosistem',
      judul: 'Gerbang 3: Benteng Hijau Mangrove',
      instruksi: 'Kenali fungsi hutan bakau di muara pertemuan sungai dan laut!',
      pertanyaan: 'Hutan mangrove di pesisir muara sangat vital bagi kehidupan laut karena berfungsi untuk...',
      opsi: [
        'Mencegah abrasi pantai dan tempat bertelur ikan',
        'Menghalangi pergerakan perahu nelayan',
        'Mempercepat pengikisan tanah oleh ombak',
        'Mengeringkan air laut menjadi daratan'
      ],
      kunci: 0,
      penjelasan: 'Akar bakau yang kokoh memecah energi ombak, mengendapkan lumpur, dan menjadi tempat aman bagi benih ikan bertumbuh.'
    },
    {
      id: 'q_3_2_4',
      isSampleData: true,
      bab: 'Bab 4: Fakta vs Opini Lingkungan',
      judul: 'Gerbang 4: Menjaga Sungai dari Plastik',
      instruksi: 'Mengapa membuang sampah plastik ke sungai merusak rantai makanan?',
      pertanyaan: 'Sampah plastik berbahaya bagi ekosistem perairan karena fakta membuktikan bahwa plastik...',
      opsi: [
        'Membutuhkan ratusan tahun untuk terurai dan meracuni biota air',
        'Dapat menguap ke angkasa menjadi awan hujan',
        'Merupakan makanan bergizi bagi ikan bandeng',
        'Membuat air sungai menjadi sangat harum'
      ],
      kunci: 0,
      penjelasan: 'Plastik bersifat anorganik tidak dapat diurai mikroba secara cepat, terpecah menjadi mikroplastik yang meracuni ikan dan manusia.'
    },
    {
      id: 'q_3_2_5',
      isSampleData: true,
      bab: 'Bab 4: Fakta vs Opini Lingkungan',
      judul: 'Gerbang 5: Pintu Gerbang Kelestarian Bumi',
      instruksi: 'Ujian pamungkas penutup Petualangan IPAS Nusantara!',
      pertanyaan: 'Manakah dari pernyataan berikut yang merupakan FAKTA ilmiah mengenai ekosistem?',
      opsi: [
        'Tumbuhan menghasilkan oksigen melalui proses fotosintesis',
        'Sungai di pegunungan selalu lebih indah daripada laut',
        'Ular adalah hewan yang paling menakutkan di bumi',
        'Bunga mawar adalah bunga paling sempurna di dunia'
      ],
      kunci: 0,
      penjelasan: 'Fotosintesis menghasilkan oksigen adalah fakta ilmiah terukur, sedangkan anggapan "paling indah/menakutkan" adalah opini subjektif.'
    }
  ]
};

/**
 * Mendapatkan 5 soal untuk level tertentu (contoh: '1-1', '1_1', atau 'level_1_1')
 */
export function getQuestionsForLevel(levelKeyOrId) {
  const clean = String(levelKeyOrId).replace(/^level_/, '').replace('-', '_');
  const key = `level_${clean}`;
  return ADVENTURE_QUESTIONS_DATABASE[key] || [];
}

/**
 * Mendapatkan seluruh daftar 30 soal sebagai flat array
 */
export function getAllAdventureQuestions() {
  const all = [];
  Object.entries(ADVENTURE_QUESTIONS_DATABASE).forEach(([lvl, list]) => {
    list.forEach(item => all.push({ ...item, level: lvl.replace('level_', '').replace('_', '-') }));
  });
  return all;
}

export const ADVENTURE_QUESTIONS = getAllAdventureQuestions();

