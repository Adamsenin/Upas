/**
 * KUPAS KUIS IPAS v4.0 - Supabase Client Bridge (supabase.js)
 * Membaca URL dan Anon Key dari config.js (placeholder).
 * Mendukung tabel profil, kuis, kamus, soal, soal_kunci, sesi, peserta, jawaban,
 * kelas, dan siswa_terdaftar.
 * RLS Ketat: Siswa/anon tidak dapat menulis ke kamus, dan hanya guru pemilik
 * yang dapat mengakses/mengubah data kelas, siswa_terdaftar, serta catatan_guru.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const SEED_KAMUS = [
  { id: 'kamus-1', guru_id: 'guru-demo-1', istilah: 'Produsen', kategori: 'Rantai Makanan', definisi: 'Makhluk hidup autotrof yang mampu membuat makanannya sendiri melalui proses fotosintesis.', contoh: 'Padi, rumput teki, pohon mangga, dan fitoplankton.', status: 'terbit' },
  { id: 'kamus-2', guru_id: 'guru-demo-1', istilah: 'Konsumen Tingkat I', kategori: 'Rantai Makanan', definisi: 'Hewan herbivora yang langsung memakan produsen untuk memperoleh energi kelangsungan hidupnya.', contoh: 'Belalang sawah, ulat daun, kelinci, dan sapi.', status: 'terbit' },
  { id: 'kamus-3', guru_id: 'guru-demo-1', istilah: 'Konsumen Tingkat II', kategori: 'Rantai Makanan', definisi: 'Hewan karnivora atau omnivora yang memangsa konsumen tingkat pertama dalam rantai makanan.', contoh: 'Katak pemakan belalang, ayam pemakan ulat, dan burung pipit.', status: 'terbit' },
  { id: 'kamus-4', guru_id: 'guru-demo-1', istilah: 'Pengurai (Dekomposer)', kategori: 'Rantai Makanan', definisi: 'Organisme yang bertugas menguraikan sisa organisme mati menjadi unsur hara yang menyuburkan tanah.', contoh: 'Bakteri pengurai, jamur tanah, dan cacing tanah.', status: 'terbit' },
  { id: 'kamus-5', guru_id: 'guru-demo-1', istilah: 'Energi Matahari', kategori: 'Ekosistem', definisi: 'Sumber energi primer terbesar di bumi yang diserap oleh klorofil tumbuhan untuk membuat makanan.', contoh: 'Cahaya matahari pagi yang menyinari hamparan sawah dan hutan.', status: 'terbit' },
  { id: 'kamus-6', guru_id: 'guru-demo-1', istilah: 'Keseimbangan Ekosistem', kategori: 'Ekosistem', definisi: 'Kondisi harmonis di mana seluruh komponen biotik dan abiotik saling mendukung tanpa ada kepunahan atau ledakan populasi liar.', contoh: 'Terjaganya populasi katak di sawah yang mencegah ledakan hama belalang perusak padi.', status: 'terbit' },
  { id: 'kamus-7', guru_id: 'guru-demo-1', istilah: 'Jaring-jaring Makanan', kategori: 'Rantai Makanan', definisi: 'Kumpulan dari beberapa rantai makanan yang saling tumpang tindih dan terhubung dalam suatu ekosistem.', contoh: 'Jaring-jaring makanan di hutan antara pohon, rusa, burung, dan harimau.', status: 'terbit' },
  { id: 'kamus-8', guru_id: 'guru-demo-1', istilah: 'Fitoplankton', kategori: 'Ekosistem', definisi: 'Organisme tumbuhan mikroskopis bersel tunggal yang melayang di perairan dan bertindak sebagai produsen utama laut.', contoh: 'Fitoplankton di lapisan atas laut yang menjadi makanan zooplankton.', status: 'terbit' },
  { id: 'kamus-9', guru_id: 'guru-demo-1', istilah: 'Fotosintesis', kategori: 'Ekosistem', definisi: 'Proses pembentukan zat makanan (glukosa) dan oksigen oleh tumbuhan berklorofil menggunakan air, karbon dioksida, dan cahaya matahari.', contoh: 'Daun menyerap cahaya matahari dan CO2 lalu melepaskan gas oksigen ke udara.', status: 'terbit' },
  { id: 'kamus-10', guru_id: 'guru-demo-1', istilah: 'Piramida Makanan', kategori: 'Rantai Makanan', definisi: 'Diagram berbentuk piramida yang menggambarkan perbandingan biomassa dan energi, di mana produsen memiliki jumlah terbanyak di dasar piramida.', contoh: 'Produsen di dasar, herbivora di tengah, dan karnivora puncak di pucuk.', status: 'terbit' },
  { id: 'kamus-11', guru_id: 'guru-demo-1', istilah: 'Simbiosis Mutualisme', kategori: 'Saling Bergantung', definisi: 'Hubungan timbal balik antara dua makhluk hidup berbeda jenis yang saling menguntungkan kedua belah pihak.', contoh: 'Lebah madu yang mengisap nektar bunga sembari membantu penyerbukan.', status: 'terbit' },
  { id: 'kamus-12', guru_id: 'guru-demo-1', istilah: 'Simbiosis Komensalisme', kategori: 'Saling Bergantung', definisi: 'Hubungan antara dua jenis organisme di mana satu pihak diuntungkan dan pihak lain tidak dirugikan maupun diuntungkan.', contoh: 'Tanaman anggrek yang menempel pada dahan pohon mangga.', status: 'terbit' },
  { id: 'kamus-13', guru_id: 'guru-demo-1', istilah: 'Simbiosis Parasitisme', kategori: 'Saling Bergantung', definisi: 'Hubungan di mana satu pihak (parasit) mengambil keuntungan dan menyebabkan kerugian bagi pihak lain (inang).', contoh: 'Nyamuk mengisap darah manusia sehingga menimbulkan gatal dan sakit.', status: 'terbit' },
  { id: 'kamus-14', guru_id: 'guru-demo-1', istilah: 'Pencemaran Air', kategori: 'Dampak Lingkungan', definisi: 'Masuknya limbah kimia, racun, atau sampah ke dalam badan air sehingga merusak ekosistem perairan.', contoh: 'Pembuangan limbah detergen dan racun pabrik ke sungai.', status: 'terbit' },
  { id: 'kamus-15', guru_id: 'guru-demo-1', istilah: 'Karnivora', kategori: 'Rantai Makanan', definisi: 'Kelompok hewan pemangsa yang makanan utamanya adalah daging atau hewan lain.', contoh: 'Harimau sumatera, elang jawa, serigala, dan singa.', status: 'terbit' },
  { id: 'kamus-16', guru_id: 'guru-demo-1', istilah: 'Deforestasi (Penebangan Hutan)', kategori: 'Dampak Lingkungan', definisi: 'Kegiatan penebangan dan pembabatan pohon hutan secara liar yang merusak habitat alami satwa.', contoh: 'Pembalakan liar yang memaksa satwa hutan masuk ke permukiman warga.', status: 'terbit' },
  { id: 'kamus-17', guru_id: 'guru-demo-1', istilah: 'Pestisida Berlebihan', kategori: 'Dampak Lingkungan', definisi: 'Penggunaan racun kimia pembasmi hama tanaman secara berlebih yang mematikan musuh alami dan mencemari tanah.', contoh: 'Penyemprotan insektisida yang mematikan lebah penyerbuk dan burung pemakan hama.', status: 'terbit' },
  { id: 'kamus-18', guru_id: 'guru-demo-1', istilah: 'Aliran Energi', kategori: 'Rantai Makanan', definisi: 'Perpindahan energi makanan dari produsen ke konsumen, di mana sebagian besar energi terlepas sebagai panas.', contoh: 'Energi padi berpindah ke belalang lalu ke katak.', status: 'terbit' },
  { id: 'kamus-19', guru_id: 'guru-demo-1', istilah: 'Omnivora', kategori: 'Rantai Makanan', definisi: 'Kelompok hewan pemakan segala yang mengonsumsi bagian tumbuhan sekaligus hewan lain.', contoh: 'Ayam memakan biji dan cacing; tikus, bebek, dan beruang.', status: 'terbit' },
  { id: 'kamus-20', guru_id: 'guru-demo-1', istilah: 'Habitat', kategori: 'Ekosistem', definisi: 'Tempat hidup dan bertumbuh alami bagi suatu populasi makhluk hidup.', contoh: 'Hutan bakau sebagai habitat kepiting bakau dan ikan gelodok.', status: 'terbit' }
];

export const SEED_FAKTA_OPINI = [
  { id: 'fo-1', guru_id: 'guru-demo-1', pernyataan: 'Padi membuat makanannya sendiri melalui fotosintesis dengan bantuan sinar matahari dan air.', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: padi adalah produsen autotrof yang melakukan fotosintesis.', topik: 'Ekosistem', status: 'terbit' },
  { id: 'fo-2', guru_id: 'guru-demo-1', pernyataan: 'Bunga mawar adalah produsen yang paling indah dan anggun di seluruh taman sekolah.', tipe: 'opini', tingkat_kesulitan: 'mudah', penjelasan: 'Opini: keindahan adalah penilaian rasa subjektif setiap orang.', topik: 'Ekosistem', status: 'terbit' },
  { id: 'fo-3', guru_id: 'guru-demo-1', pernyataan: 'Konsumen tingkat satu pada rantai makanan darat umumnya adalah hewan pemakan tumbuhan (herbivora).', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: konsumen I langsung memakan biomassa dari produsen tumbuhan.', topik: 'Rantai Makanan', status: 'terbit' },
  { id: 'fo-4', guru_id: 'guru-demo-1', pernyataan: 'Ular sawah adalah hewan yang paling menakutkan dan sebaiknya dibasmi semuanya dari sawah.', tipe: 'opini', tingkat_kesulitan: 'mudah', penjelasan: 'Opini: menakutkan adalah rasa takut individu, dan membasmi ular justru memicu ledakan hama tikus.', topik: 'Keseimbangan Ekosistem', status: 'terbit' },
  { id: 'fo-5', guru_id: 'guru-demo-1', pernyataan: 'Fitoplankton di lautan menyerap karbon dioksida dan menghasilkan sebagian besar oksigen bumi.', tipe: 'fakta', tingkat_kesulitan: 'sedang', penjelasan: 'Fakta ilmiah: fitoplankton menghasilkan lebih dari 50% oksigen atmosfer bumi melalui fotosintesis.', topik: 'Ekosistem Laut', status: 'terbit' },
  { id: 'fo-6', guru_id: 'guru-demo-1', pernyataan: 'Belalang sawah memakan daun padi sehingga petani selalu merasa jengkel setiap hari.', tipe: 'opini', tingkat_kesulitan: 'sedang', penjelasan: 'Opini: perasaan jengkel adalah kondisi emosional subjektif.', topik: 'Interaksi Makhluk Hidup', status: 'terbit' },
  { id: 'fo-7', guru_id: 'guru-demo-1', pernyataan: 'Dekomposer seperti jamur dan bakteri menguraikan bangkai makhluk hidup menjadi unsur hara tanah.', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: dekomposer mengembalikan mineral dan zat hara penting ke dalam tanah.', topik: 'Rantai Makanan', status: 'terbit' },
  { id: 'fo-8', guru_id: 'guru-demo-1', pernyataan: 'Cacing tanah adalah hewan yang paling menjijikkan saat bergerak di tanah sawah basah.', tipe: 'opini', tingkat_kesulitan: 'mudah', penjelasan: 'Opini: anggapan menjijikkan bersifat subjektif; secara ekologis cacing sangat membantu menggemburkan tanah.', topik: 'Dekomposer', status: 'terbit' },
  { id: 'fo-9', guru_id: 'guru-demo-1', pernyataan: 'Energi matahari yang diserap produsen akan berkurang saat berpindah ke tingkat trofik berikutnya sebagai panas.', tipe: 'fakta', tingkat_kesulitan: 'sedang', penjelasan: 'Fakta ilmiah: hanya sekitar 10% energi kimia yang berpindah ke konsumen berikutnya (hukum 10%).', topik: 'Aliran Energi', status: 'terbit' },
  { id: 'fo-10', guru_id: 'guru-demo-1', pernyataan: 'Kegiatan menanam pohon di hutan lindung jauh lebih menyenangkan daripada membersihkan selokan.', tipe: 'opini', tingkat_kesulitan: 'sedang', penjelasan: 'Opini: tingkat rasa senang adalah preferensi masing-masing orang.', topik: 'Dampak Lingkungan', status: 'terbit' },
  { id: 'fo-11', guru_id: 'guru-demo-1', pernyataan: 'Simbiosis antara lebah madu dan bunga tanaman mangga saling menguntungkan kedua belah pihak.', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: lebah memperoleh nektar dan bunga terbantu dalam penyerbukan (mutualisme).', topik: 'Simbiosis', status: 'terbit' },
  { id: 'fo-12', guru_id: 'guru-demo-1', pernyataan: 'Lebah madu adalah serangga yang paling pintar dan rajin dibanding semua serangga di bumi.', tipe: 'opini', tingkat_kesulitan: 'sedang', penjelasan: 'Opini: sebutan pintar dan rajin adalah kiasan/sifat subjektif manusia.', topik: 'Simbiosis', status: 'terbit' },
  { id: 'fo-13', guru_id: 'guru-demo-1', pernyataan: 'Penebangan hutan secara liar dapat merusak habitat alami dan mengancam kepunahan satwa langka.', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: deforestasi menghilangkan tempat bernaung, berkembang biak, dan sumber makanan satwa.', topik: 'Dampak Lingkungan', status: 'terbit' },
  { id: 'fo-14', guru_id: 'guru-demo-1', pernyataan: 'Pemberantasan hama dengan menyemprotkan pestisida kimia sebanyak-banyaknya adalah cara paling tepat merawat sawah.', tipe: 'opini', tingkat_kesulitan: 'sedang', penjelasan: 'Opini keliru: pestisida berlebih membunuh serangga penyerbuk dan musuh alami, serta merusak tanah.', topik: 'Keseimbangan Lingkungan', status: 'terbit' },
  { id: 'fo-15', guru_id: 'guru-demo-1', pernyataan: 'Pada piramida makanan yang seimbang di daratan, jumlah biomassa produsen lebih besar daripada konsumen puncak.', tipe: 'fakta', tingkat_kesulitan: 'sulit', penjelasan: 'Fakta ilmiah: dasar piramida makanan membutuhkan jumlah biomassa tumbuhan terbanyak untuk menyangga kehidupan tingkat atas.', topik: 'Piramida Makanan', status: 'terbit' },
  { id: 'fo-16', guru_id: 'guru-demo-1', pernyataan: 'Hewan karnivora pemangsa seperti elang jawa tampak lebih gagah dan berani daripada burung gereja.', tipe: 'opini', tingkat_kesulitan: 'mudah', penjelasan: 'Opini: gagah dan berani adalah persepsi visual subjektif manusia.', topik: 'Karakteristik Hewan', status: 'terbit' },
  { id: 'fo-17', guru_id: 'guru-demo-1', pernyataan: 'Limbah detergen yang dibuang langsung ke sungai dapat menurunkan kadar oksigen terlarut sehingga ikan mati.', tipe: 'fakta', tingkat_kesulitan: 'sedang', penjelasan: 'Fakta ilmiah: eutrofikasi dan bahan kimia detergen memicu ledakan alga lalu menghabiskan oksigen air.', topik: 'Pencemaran Air', status: 'terbit' },
  { id: 'fo-18', guru_id: 'guru-demo-1', pernyataan: 'Udara sejuk di kawasan pegunungan selalu lebih menyehatkan daripada udara di daerah pesisir pantai.', tipe: 'opini', tingkat_kesulitan: 'sulit', penjelasan: '[perlu dicek guru] Opini: manfaat udara bergantung pada kondisi kesehatan tiap orang, kelembapan, dan tingkat alergen bebas polutan.', topik: 'Lingkungan Hidup', status: 'terbit' },
  { id: 'fo-19', guru_id: 'guru-demo-1', pernyataan: 'Burung hantu aktif berburu mangsa tikus dan serangga di malam hari sehingga tergolong hewan nokturnal.', tipe: 'fakta', tingkat_kesulitan: 'mudah', penjelasan: 'Fakta ilmiah: hewan nokturnal beradaptasi aktif mencari makan pada malam hari.', topik: 'Adaptasi Hewan', status: 'terbit' },
  { id: 'fo-20', guru_id: 'guru-demo-1', pernyataan: 'Semua anak kelas lima pasti merasa sangat senang saat diajak mengamati jaring-jaring makanan di kebun sekolah.', tipe: 'opini', tingkat_kesulitan: 'mudah', penjelasan: 'Opini: perasaan anak tidak seragam; ada yang menyukai dan mungkin ada yang belum tertarik.', topik: 'Metode Pembelajaran', status: 'terbit' }
];

export const SEED_RANTAI_MAKANAN = [
  {
    id: 'skenario-sawah',
    guru_id: 'guru-demo-1',
    judul: 'Rantai Makanan Ekosistem Sawah',
    ekosistem: 'sawah',
    deskripsi: 'Aliran energi makanan di hamparan sawah basah dari tanaman padi hingga burung elang.',
    kartu_makhluk: [
      { id: 'sw-1', nama: 'Padi', peran: 'Produsen', urutan: 1, ikon_svg: 'padi', petunjuk: 'Tumbuhan hijau berklorofil penghasil beras melalui fotosintesis.', deskripsi_peran: 'Menangkap energi matahari untuk membuat sumber makanan pertama.' },
      { id: 'sw-2', nama: 'Belalang', peran: 'Konsumen I', urutan: 2, ikon_svg: 'belalang', petunjuk: 'Hewan herbivora kecil pemakan daun padi muda.', deskripsi_peran: 'Memakan daun padi untuk memperoleh energi nabati.' },
      { id: 'sw-3', nama: 'Katak Sawah', peran: 'Konsumen II', urutan: 3, ikon_svg: 'katak', petunjuk: 'Hewan amfibi karnivora pemakan serangga pelompat.', deskripsi_peran: 'Memangsa belalang dan mengendalikan populasinya.' },
      { id: 'sw-4', nama: 'Ular Sawah', peran: 'Konsumen III', urutan: 4, ikon_svg: 'ular', petunjuk: 'Reptil karnivora melata pemangsa katak dan tikus.', deskripsi_peran: 'Memangsa katak sebagai konsumen tingkat ketiga.' },
      { id: 'sw-5', nama: 'Burung Elang', peran: 'Konsumen Puncak', urutan: 5, ikon_svg: 'elang', petunjuk: 'Burung karnivora puncak bersarang tinggi pemangsa ular.', deskripsi_peran: 'Berada di puncak rantai makanan tanpa pemangsa alami.' },
      { id: 'sw-6', nama: 'Jamur Pengurai', peran: 'Pengurai', urutan: 6, ikon_svg: 'jamur', petunjuk: 'Dekomposer tanah pengurai bangkai menjadi zat hara.', deskripsi_peran: 'Menguraikan sisa organisme mati menjadi mineral tanah bagi padi.' }
    ],
    status: 'terbit'
  },
  {
    id: 'skenario-kolam',
    guru_id: 'guru-demo-1',
    judul: 'Rantai Makanan Ekosistem Kolam',
    ekosistem: 'kolam',
    deskripsi: 'Perpindahan energi antarmakhluk hidup di lingkungan perairan kolam tenang.',
    kartu_makhluk: [
      { id: 'kl-1', nama: 'Lumut & Alga Air', peran: 'Produsen', urutan: 1, ikon_svg: 'alga', petunjuk: 'Tumbuhan air hijau yang mengapung dan berfotosintesis.', deskripsi_peran: 'Produsen utama perairan yang menyuplai oksigen kolam.' },
      { id: 'kl-2', nama: 'Kutu Air', peran: 'Konsumen I', urutan: 2, ikon_svg: 'kutu-air', petunjuk: 'Zooplankton kecil pemakan alga hijau air tawar.', deskripsi_peran: 'Herbivora mikroskopis penyaring alga perairan.' },
      { id: 'kl-3', nama: 'Ikan Sepat Kecil', peran: 'Konsumen II', urutan: 3, ikon_svg: 'ikan-kecil', petunjuk: 'Ikan kecil perenang lincah pemakan jentik dan kutu air.', deskripsi_peran: 'Karnivora perantara pemakan serangga dan kutu air.' },
      { id: 'kl-4', nama: 'Ikan Gabus', peran: 'Konsumen III', urutan: 4, ikon_svg: 'ikan-gabus', petunjuk: 'Ikan karnivora predator pemangsa ikan-ikan kecil.', deskripsi_peran: 'Predator air tawar yang memangsa ikan kecil di kolam.' },
      { id: 'kl-5', nama: 'Burung Bangau', peran: 'Konsumen Puncak', urutan: 5, ikon_svg: 'bangau', petunjuk: 'Burung berkaki panjang pemancing ikan di pinggir kolam.', deskripsi_peran: 'Konsumen puncak air tawar pemakan ikan besar.' },
      { id: 'kl-6', nama: 'Bakteri Dekomposer', peran: 'Pengurai', urutan: 6, ikon_svg: 'bakteri', petunjuk: 'Mikroorganisme pengurai lumpur dasar kolam.', deskripsi_peran: 'Mengembalikan unsur hara dari dasar kolam ke air.' }
    ],
    status: 'terbit'
  },
  {
    id: 'skenario-hutan',
    guru_id: 'guru-demo-1',
    judul: 'Rantai Makanan Ekosistem Hutan',
    ekosistem: 'hutan',
    deskripsi: 'Keseimbangan alami rantai makanan rimbun di pedalaman hutan hujan tropis.',
    kartu_makhluk: [
      { id: 'ht-1', nama: 'Tunas & Buah Hutan', peran: 'Produsen', urutan: 1, ikon_svg: 'pohon-buah', petunjuk: 'Pohon dan semak hutan penghasil daun segar serta buah.', deskripsi_peran: 'Menyerap sinar matahari dari kanopi hutan untuk berbuah.' },
      { id: 'ht-2', nama: 'Kancil / Rusa', peran: 'Konsumen I', urutan: 2, ikon_svg: 'rusa', petunjuk: 'Mamalia herbivora pemakan pucuk daun dan buah jatuh.', deskripsi_peran: 'Konsumen pertama pemakan biomassa dedaunan hutan.' },
      { id: 'ht-3', nama: 'Ular Sanca Hutan', peran: 'Konsumen II', urutan: 3, ikon_svg: 'ular-sanca', petunjuk: 'Reptil karnivora pemangsa mamalia sedang di lantai hutan.', deskripsi_peran: 'Karnivora pemburu hewan herbivora hutan.' },
      { id: 'ht-4', nama: 'Harimau Sumatera', peran: 'Konsumen Puncak', urutan: 4, ikon_svg: 'harimau', petunjuk: 'Kucing besar karnivora penguasa wilayah hutan.', deskripsi_peran: 'Konsumen puncak menjaga keseimbangan populasi fauna rimba.' },
      { id: 'ht-5', nama: 'Cacing & Rayap Tanah', peran: 'Pengurai', urutan: 5, ikon_svg: 'cacing-rayap', petunjuk: 'Pengurai serasah kayu lapuk dan daun di lantai hutan.', deskripsi_peran: 'Mengubah sisa organik menjadi humus subur bagi pohon hutan.' }
    ],
    status: 'terbit'
  },
  {
    id: 'skenario-laut',
    guru_id: 'guru-demo-1',
    judul: 'Rantai Makanan Ekosistem Laut',
    ekosistem: 'laut',
    deskripsi: 'Aliran energi samudra dari mikroorganisme fotosintesis hingga hiu pemangsa puncak.',
    kartu_makhluk: [
      { id: 'lt-1', nama: 'Fitoplankton', peran: 'Produsen', urutan: 1, ikon_svg: 'fitoplankton', petunjuk: 'Tumbuhan mikroskopis melayang penyerap cahaya di laut.', deskripsi_peran: 'Produsen primer terbesar perairan laut bumi.' },
      { id: 'lt-2', nama: 'Zooplankton', peran: 'Konsumen I', urutan: 2, ikon_svg: 'zooplankton', petunjuk: 'Hewan mikroskopis melayang pemakan fitoplankton.', deskripsi_peran: 'Herbivora laut pertama pemakan fitoplankton.' },
      { id: 'lt-3', nama: 'Ikan Teri / Sardin', peran: 'Konsumen II', urutan: 3, ikon_svg: 'ikan-teri', petunjuk: 'Kawanan ikan kecil pemakan plankton di perairan lepas.', deskripsi_peran: 'Konsumen kedua pemakan zooplankton laut.' },
      { id: 'lt-4', nama: 'Ikan Tuna', peran: 'Konsumen III', urutan: 4, ikon_svg: 'ikan-tuna', petunjuk: 'Ikan perenang cepat karnivora pemakan kawanan ikan kecil.', deskripsi_peran: 'Karnivora laut pemangsa ikan pelagis kecil.' },
      { id: 'lt-5', nama: 'Ikan Hiu Samudra', peran: 'Konsumen Puncak', urutan: 5, ikon_svg: 'hiu', petunjuk: 'Apex predator laut bertaring tajam tanpa pemangsa alami.', deskripsi_peran: 'Konsumen puncak yang menjaga ekosistem terumbu dan samudra.' },
      { id: 'lt-6', nama: 'Bakteri Laut Dalam', peran: 'Pengurai', urutan: 6, ikon_svg: 'bakteri-laut', petunjuk: 'Dekomposer dasar laut pengurai sisa organisme.', deskripsi_peran: 'Menguraikan materi organik yang jatuh ke dasar samudra.' }
    ],
    status: 'terbit'
  }
];

export const SEED_SOAL = [
  { id: 'soal-1', kamus_id: 'kamus-1', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'mudah', urutan: 1, tipe: 'pilihan_ganda', teks: 'Dalam ekosistem sawah, makhluk hidup yang berperan sebagai produsen adalah...', opsi: ['Padi', 'Tikus', 'Ular', 'Elang'], penjelasan: 'Padi adalah tumbuhan hijau yang membuat makanan sendiri melalui fotosintesis.', waktu_detik: 30, poin: 10, kunci: '0' },
  { id: 'soal-2', kamus_id: 'kamus-2', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'mudah', urutan: 2, tipe: 'pilihan_ganda', teks: 'Hewan yang memakan produsen secara langsung disebut sebagai...', opsi: ['Konsumen puncak', 'Konsumen tingkat I', 'Pengurai (Dekomposer)', 'Produsen kedua'], penjelasan: 'Konsumen tingkat I (herbivora) memakan produsen tumbuhan hijau.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-3', kamus_id: 'kamus-3', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'sedang', urutan: 3, tipe: 'pilihan_ganda', teks: 'Perhatikan urutan: Rumput -> Belalang -> Katak -> Ular -> Elang. Makhluk hidup yang berperan sebagai konsumen tingkat II adalah...', opsi: ['Belalang', 'Katak', 'Ular', 'Elang'], penjelasan: 'Katak adalah konsumen tingkat II yang memakan belalang.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-4', kamus_id: 'kamus-4', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'mudah', urutan: 4, tipe: 'pilihan_ganda', teks: 'Makhluk hidup yang bertugas menguraikan sisa organisme mati menjadi zat hara tanah adalah...', opsi: ['Karnivora', 'Herbivora', 'Bakteri dan Jamur', 'Omnivora'], penjelasan: 'Bakteri dan jamur adalah dekomposer/pengurai tanah.', waktu_detik: 30, poin: 10, kunci: '2' },
  { id: 'soal-5', kamus_id: 'kamus-5', bab: 'Bab 2: Ekosistem & Habitat', tingkat_kesulitan: 'mudah', urutan: 5, tipe: 'benar_salah', teks: 'Semua rantai makanan di darat berawal dari tumbuhan hijau yang memperoleh energi dari cahaya matahari.', opsi: ['Benar', 'Salah'], penjelasan: 'Benar, tumbuhan hijau adalah dasar dari seluruh rantai makanan darat.', waktu_detik: 25, poin: 10, kunci: '0' },
  { id: 'soal-6', kamus_id: 'kamus-6', bab: 'Bab 2: Ekosistem & Habitat', tingkat_kesulitan: 'sulit', urutan: 6, tipe: 'pilihan_ganda', teks: 'Jika populasi katak di sawah punah, dampak langsung yang kemungkinan terjadi adalah...', opsi: ['Populasi belalang meningkat pesat', 'Populasi padi bertambah banyak', 'Populasi ular bertambah banyak', 'Populasi elang bertambah banyak'], penjelasan: 'Belalang kehilangan pemangsa alaminya sehingga populasinya melonjak.', waktu_detik: 30, poin: 10, kunci: '0' },
  { id: 'soal-7', kamus_id: 'kamus-7', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'sedang', urutan: 7, tipe: 'pilihan_ganda', teks: 'Kumpulan beberapa rantai makanan yang saling berhubungan dalam ekosistem disebut...', opsi: ['Piramida makanan', 'Jaring-jaring makanan', 'Siklus hidup', 'Habitat'], penjelasan: 'Jaring-jaring makanan terbentuk dari rantai-rantai makanan yang tumpang tindih.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-8', kamus_id: 'kamus-8', bab: 'Bab 2: Ekosistem & Habitat', tingkat_kesulitan: 'sulit', urutan: 8, tipe: 'pilihan_ganda', teks: 'Di ekosistem laut, makhluk renik yang berfotosintesis dan bertindak sebagai produsen utama adalah...', opsi: ['Zooplankton', 'Fitoplankton', 'Ikan teri', 'Hiu'], penjelasan: 'Fitoplankton merupakan produsen primer terbanyak di perairan laut.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-9', kamus_id: 'kamus-9', bab: 'Bab 2: Ekosistem & Habitat', tingkat_kesulitan: 'sedang', urutan: 9, tipe: 'isian_singkat', teks: 'Proses pembentukan makanan oleh tumbuhan hijau dengan bantuan cahaya matahari disebut...', opsi: [], penjelasan: 'Fotosintesis adalah proses biokimia tumbuhan berklorofil membuat makanan.', waktu_detik: 35, poin: 10, kunci: 'fotosintesis' },
  { id: 'soal-10', kamus_id: 'kamus-10', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'sedang', urutan: 10, tipe: 'benar_salah', teks: 'Piramida makanan menunjukkan bahwa jumlah produsen selalu lebih sedikit dibandingkan konsumen puncak.', opsi: ['Benar', 'Salah'], penjelasan: 'Salah, produsen berada di tingkat dasar piramida dan berjumlah paling banyak.', waktu_detik: 25, poin: 10, kunci: '1' },
  { id: 'soal-11', kamus_id: 'kamus-11', bab: 'Bab 3: Simbiosis & Ketergantungan', tingkat_kesulitan: 'mudah', urutan: 11, tipe: 'pilihan_ganda', teks: 'Hubungan lebah mengisap madu dan membantu penyerbukan bunga merupakan contoh...', opsi: ['Mutualisme', 'Komensalisme', 'Parasitisme', 'Predasi'], penjelasan: 'Simbiosis mutualisme saling menguntungkan kedua belah pihak.', waktu_detik: 30, poin: 10, kunci: '0' },
  { id: 'soal-12', kamus_id: 'kamus-12', bab: 'Bab 3: Simbiosis & Ketergantungan', tingkat_kesulitan: 'sedang', urutan: 12, tipe: 'pilihan_ganda', teks: 'Anggrek yang menempel pada pohon tanpa merugikan inangnya merupakan contoh...', opsi: ['Parasitisme', 'Komensalisme', 'Mutualisme', 'Saprofitisme'], penjelasan: 'Komensalisme: satu pihak untung, pihak lain tidak dirugikan atau diuntungkan.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-13', kamus_id: 'kamus-13', bab: 'Bab 3: Simbiosis & Ketergantungan', tingkat_kesulitan: 'mudah', urutan: 13, tipe: 'pilihan_ganda', teks: 'Nyamuk mengisap darah manusia sehingga manusia merasa gatal dan dapat sakit termasuk...', opsi: ['Komensalisme', 'Mutualisme', 'Parasitisme', 'Netralisme'], penjelasan: 'Parasitisme: satu pihak untung (nyamuk) dan pihak lain rugi (manusia).', waktu_detik: 30, poin: 10, kunci: '2' },
  { id: 'soal-14', kamus_id: 'kamus-14', bab: 'Bab 4: Dampak Perubahan Lingkungan', tingkat_kesulitan: 'sedang', urutan: 14, tipe: 'pilihan_ganda', teks: 'Tindakan manusia yang merusak keseimbangan rantai makanan di sungai adalah...', opsi: ['Membersihkan sampah', 'Membuang limbah pabrik dan racun', 'Menanam pohon di bantaran sungai', 'Membuat suaka margasatwa'], penjelasan: 'Limbah kimia dan racun mematikan produsen air dan ikan-ikan kecil.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-15', kamus_id: 'kamus-15', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'mudah', urutan: 15, tipe: 'isian_singkat', teks: 'Hewan pemakan daging seperti elang dan singa digolongkan sebagai hewan...', opsi: [], penjelasan: 'Karnivora adalah istilah untuk kelompok pemakan daging.', waktu_detik: 30, poin: 10, kunci: 'karnivora' },
  { id: 'soal-16', kamus_id: 'kamus-16', bab: 'Bab 4: Dampak Perubahan Lingkungan', tingkat_kesulitan: 'mudah', urutan: 16, tipe: 'benar_salah', teks: 'Penebangan hutan liar dapat mengakibatkan hewan kehilangan tempat tinggal dan sumber makanan.', opsi: ['Benar', 'Salah'], penjelasan: 'Benar, hutan adalah habitat alami penyedia makanan bagi satwa liar.', waktu_detik: 25, poin: 10, kunci: '0' },
  { id: 'soal-17', kamus_id: 'kamus-17', bab: 'Bab 4: Dampak Perubahan Lingkungan', tingkat_kesulitan: 'sulit', urutan: 17, tipe: 'pilihan_ganda', teks: 'Dampak buruk penggunaan pestisida kimia berlebihan bagi sawah adalah...', opsi: ['Tanaman selalu terlindungi', 'Musuh alami hama dan penyerbuk ikut mati', 'Tanah semakin subur secara alami', 'Burung pemakan serangga bertambah'], penjelasan: 'Pestisida membunuh serangga pembasmi alami hama serta lebah penyerbuk.', waktu_detik: 30, poin: 10, kunci: '1' },
  { id: 'soal-18', kamus_id: 'kamus-18', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'sulit', urutan: 18, tipe: 'pilihan_ganda', teks: 'Dalam perpindahan energi pada rantai makanan, sebagian energi terlepas dalam bentuk...', opsi: ['Panas', 'Oksigen', 'Cahaya', 'Air'], penjelasan: 'Energi kimia terbuang sebagai panas saat metabolisme dan bergerak.', waktu_detik: 30, poin: 10, kunci: '0' },
  { id: 'soal-19', kamus_id: 'kamus-19', bab: 'Bab 1: Rantai Makanan', tingkat_kesulitan: 'sedang', urutan: 19, tipe: 'pilihan_ganda', teks: 'Hewan pemakan tumbuhan sekaligus hewan lain (seperti ayam) disebut hewan...', opsi: ['Herbivora', 'Karnivora', 'Omnivora', 'Insektivora'], penjelasan: 'Omnivora adalah hewan pemakan segala (tumbuhan dan hewan).', waktu_detik: 30, poin: 10, kunci: '2' },
  { id: 'soal-20', kamus_id: 'kamus-20', bab: 'Bab 2: Ekosistem & Habitat', tingkat_kesulitan: 'mudah', urutan: 20, tipe: 'isian_singkat', teks: 'Tempat hidup alami bagi suatu makhluk hidup untuk tumbuh dan berkembang biak disebut...', opsi: [], penjelasan: 'Habitat adalah lingkungan alami tempat hidup suatu spesies.', waktu_detik: 30, poin: 10, kunci: 'habitat' }
];

// Inisialisasi Database Lokal
function inisialisasiDataLokal() {
  if (!localStorage.getItem('kupas_db_kuis')) {
    const kuisAwal = [
      {
        id: 'kuis-ekosistem-1',
        guru_id: 'guru-demo-1',
        judul: 'Petualangan Rantai Makanan & Ekosistem',
        topik: 'Ekosistem dan Rantai Makanan (IPAS Kelas V)',
        deskripsi: '20 Soal Kurikulum Merdeka IPAS Kelas V SD.',
        status: 'terbit',
        kkm: 75,
        acak_soal: false,
        durasi_menit: 15,
        jadwal_buka: '2026-10-01T07:00',
        jadwal_tutup: '2026-12-31T23:59',
        created_at: '2026-10-10T08:00:00.000Z'
      },
      {
        id: 'kuis-simbiosis-2',
        guru_id: 'guru-demo-1',
        judul: 'Evaluasi Harmoni & Simbiosis Alam',
        topik: 'Simbiosis dan Dampak Perubahan Lingkungan',
        deskripsi: 'Latihan pengayaan hubungan antarmakhluk hidup dan keseimbangan alam.',
        status: 'terbit',
        kkm: 75,
        acak_soal: true,
        durasi_menit: 10,
        jadwal_buka: '2026-10-15T07:00',
        jadwal_tutup: '2026-12-31T23:59',
        created_at: '2026-10-15T08:00:00.000Z'
      }
    ];
    localStorage.setItem('kupas_db_kuis', JSON.stringify(kuisAwal));
  } else {
    // Pastikan kuis yang ada memiliki properti default KKM, durasi, dll.
    const existingKuis = JSON.parse(localStorage.getItem('kupas_db_kuis') || '[]');
    const updatedKuis = existingKuis.map(k => ({
      kkm: 75,
      acak_soal: false,
      durasi_menit: 15,
      jadwal_buka: '',
      jadwal_tutup: '',
      ...k
    }));
    localStorage.setItem('kupas_db_kuis', JSON.stringify(updatedKuis));
  }

  // Simpan atau lengkapi bank soal tanpa menimpa soal baru buatan guru
  const existingSoal = JSON.parse(localStorage.getItem('kupas_db_soal') || '[]');
  const soalKunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

  if (existingSoal.length === 0) {
    const soalPublik = SEED_SOAL.map(s => {
      const { kunci, ...publik } = s;
      return { ...publik, kuis_id: 'kuis-ekosistem-1' };
    });
    localStorage.setItem('kupas_db_soal', JSON.stringify(soalPublik));
    SEED_SOAL.forEach(s => { soalKunciDB[s.id] = s.kunci; });
    localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(soalKunciDB));
  } else {
    // Lengkapi kolom bab & tingkat_kesulitan pada soal seed jika belum ada
    const seedMap = Object.fromEntries(SEED_SOAL.map(s => [s.id, s]));
    const mergedSoal = existingSoal.map(s => {
      const ref = seedMap[s.id];
      return {
        bab: ref ? ref.bab : (s.bab || 'Bab 1: Rantai Makanan'),
        tingkat_kesulitan: ref ? ref.tingkat_kesulitan : (s.tingkat_kesulitan || 'sedang'),
        ...s
      };
    });
    localStorage.setItem('kupas_db_soal', JSON.stringify(mergedSoal));
    SEED_SOAL.forEach(s => {
      if (soalKunciDB[s.id] === undefined) soalKunciDB[s.id] = s.kunci;
    });
    localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(soalKunciDB));
  }

  // Simpan kamus belajar
  if (!localStorage.getItem('kupas_db_kamus')) {
    localStorage.setItem('kupas_db_kamus', JSON.stringify(SEED_KAMUS));
  }

  // Simpan Pernyataan Fakta atau Opini (Fase A)
  if (!localStorage.getItem('kupas_db_fact_opinion_statements')) {
    localStorage.setItem('kupas_db_fact_opinion_statements', JSON.stringify(SEED_FAKTA_OPINI));
  }

  // Simpan Skenario Rantai Makanan (Fase A)
  if (!localStorage.getItem('kupas_db_food_chain_scenarios')) {
    localStorage.setItem('kupas_db_food_chain_scenarios', JSON.stringify(SEED_RANTAI_MAKANAN));
  }

  // Simpan Hasil Aktivitas Siswa (Fase A)
  if (!localStorage.getItem('kupas_db_activity_results')) {
    const hasilAktivitasAwal = [
      {
        id: 'act-res-1',
        aktivitas_tipe: 'fakta_opini',
        aktivitas_id: 'ronde-demo-1',
        siswa_id: 'siswa-1',
        user_id: null,
        nama_siswa: 'Budi Santoso',
        kelas: 'Kelas V-A',
        skor: 90,
        total_soal: 10,
        benar: 9,
        percobaan: 1,
        petunjuk_digunakan: 0,
        durasi_detik: 120,
        detail_jawaban: [],
        created_at: '2026-10-25T08:15:00.000Z'
      },
      {
        id: 'act-res-2',
        aktivitas_tipe: 'rantai_makanan',
        aktivitas_id: 'skenario-sawah',
        siswa_id: 'siswa-2',
        user_id: null,
        nama_siswa: 'Siti Aminah',
        kelas: 'Kelas V-A',
        skor: 100,
        total_soal: 6,
        benar: 6,
        percobaan: 1,
        petunjuk_digunakan: 0,
        durasi_detik: 75,
        detail_jawaban: [],
        created_at: '2026-10-25T08:20:00.000Z'
      }
    ];
    localStorage.setItem('kupas_db_activity_results', JSON.stringify(hasilAktivitasAwal));
  }

  // Simpan Sertifikat Digital Awal (Fase A)
  if (!localStorage.getItem('kupas_db_certificates')) {
    const sertifikatAwal = [
      {
        id: 'cert-demo-1',
        nomor_sertifikat: 'KPS-EKO-2026-0001',
        siswa_id: 'siswa-2',
        user_id: null,
        nama_siswa: 'Siti Aminah',
        kelas: 'Kelas V-A',
        aktivitas_tipe: 'rantai_makanan',
        aktivitas_id: 'skenario-sawah',
        nama_kuis_topik: 'Rantai Makanan Ekosistem Sawah',
        nilai: 100,
        ambang_batas: 80,
        nama_guru: 'Ibu Guru IPAS',
        tanggal_terbit: '2026-10-25T08:22:00.000Z',
        created_at: '2026-10-25T08:22:00.000Z'
      }
    ];
    localStorage.setItem('kupas_db_certificates', JSON.stringify(sertifikatAwal));
  }

  // Simpan Kelas Awal (Fase 2)
  if (!localStorage.getItem('kupas_db_kelas')) {
    const kelasAwal = [
      { id: 'kelas-5a', guru_id: 'guru-demo-1', nama_kelas: 'Kelas V-A', tingkat: 'Kelas V SD', tahun_ajaran: '2026/2027', created_at: '2026-07-15T07:00:00.000Z' },
      { id: 'kelas-5b', guru_id: 'guru-demo-1', nama_kelas: 'Kelas V-B', tingkat: 'Kelas V SD', tahun_ajaran: '2026/2027', created_at: '2026-07-15T07:05:00.000Z' }
    ];
    localStorage.setItem('kupas_db_kelas', JSON.stringify(kelasAwal));
  }

  // Simpan Daftar Siswa Terdaftar & Catatan Guru (Fase 2)
  if (!localStorage.getItem('kupas_db_siswa_terdaftar')) {
    const siswaAwal = [
      { id: 'siswa-1', guru_id: 'guru-demo-1', kelas_id: 'kelas-5a', nama_kelas: 'Kelas V-A', nama_lengkap: 'Budi Santoso', nama_panggilan: 'Budi', kode_akses: 'KPS101', avatar: 'avatar-1.svg', catatan_guru: 'Sangat aktif menjawab soal rantai makanan.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-2', guru_id: 'guru-demo-1', kelas_id: 'kelas-5a', nama_kelas: 'Kelas V-A', nama_lengkap: 'Siti Aminah', nama_panggilan: 'Siti', kode_akses: 'KPS102', avatar: 'avatar-2.svg', catatan_guru: 'Konsisten nilai tertinggi di kelas V-A.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-3', guru_id: 'guru-demo-1', kelas_id: 'kelas-5a', nama_kelas: 'Kelas V-A', nama_lengkap: 'Edo Pratama', nama_panggilan: 'Edo', kode_akses: 'KPS103', avatar: 'avatar-3.svg', catatan_guru: 'Perlu bimbingan pada materi fitoplankton & piramida makanan.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-4', guru_id: 'guru-demo-1', kelas_id: 'kelas-5a', nama_kelas: 'Kelas V-A', nama_lengkap: 'Lani Kusuma', nama_panggilan: 'Lani', kode_akses: 'KPS104', avatar: 'avatar-4.svg', catatan_guru: 'Sudah tuntas KKM dengan baik.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-5', guru_id: 'guru-demo-1', kelas_id: 'kelas-5a', nama_kelas: 'Kelas V-A', nama_lengkap: 'Raka Putra', nama_panggilan: 'Raka', kode_akses: 'KPS105', avatar: 'avatar-1.svg', catatan_guru: 'Belum mengerjakan kuis terakhir karena izin sakit.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-6', guru_id: 'guru-demo-1', kelas_id: 'kelas-5b', nama_kelas: 'Kelas V-B', nama_lengkap: 'Dayu Lestari', nama_panggilan: 'Dayu', kode_akses: 'KPS201', avatar: 'avatar-2.svg', catatan_guru: 'Pemahaman konsep simbiosis sangat baik.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-7', guru_id: 'guru-demo-1', kelas_id: 'kelas-5b', nama_kelas: 'Kelas V-B', nama_lengkap: 'Beni Wijaya', nama_panggilan: 'Beni', kode_akses: 'KPS202', avatar: 'avatar-3.svg', catatan_guru: 'Perlu remedial pada dampak penggunaan pestisida.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-8', guru_id: 'guru-demo-1', kelas_id: 'kelas-5b', nama_kelas: 'Kelas V-B', nama_lengkap: 'Meli Rahmawati', nama_panggilan: 'Meli', kode_akses: 'KPS203', avatar: 'avatar-4.svg', catatan_guru: 'Mengalami peningkatan pesat pada pekan ini.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-9', guru_id: 'guru-demo-1', kelas_id: 'kelas-5b', nama_kelas: 'Kelas V-B', nama_lengkap: 'Udin Saputra', nama_panggilan: 'Udin', kode_akses: 'KPS204', avatar: 'avatar-1.svg', catatan_guru: 'Perlu pendampingan membaca soal lebih teliti.', created_at: '2026-08-01T08:00:00.000Z' },
      { id: 'siswa-10', guru_id: 'guru-demo-1', kelas_id: 'kelas-5b', nama_kelas: 'Kelas V-B', nama_lengkap: 'Nadia Putri', nama_panggilan: 'Nadia', kode_akses: 'KPS205', avatar: 'avatar-2.svg', catatan_guru: 'Belum mengikuti sesi kuis pekan ini.', created_at: '2026-08-01T08:00:00.000Z' }
    ];
    localStorage.setItem('kupas_db_siswa_terdaftar', JSON.stringify(siswaAwal));
  }

  // Simpan Riwayat Sesi, Peserta, dan Jawaban Awal bila belum ada untuk Analitik & Grafik
  if (!localStorage.getItem('kupas_db_sesi_seeded')) {
    const existingSesi = JSON.parse(localStorage.getItem('kupas_db_sesi') || '[]');
    const existingPeserta = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
    const existingJawaban = JSON.parse(localStorage.getItem('kupas_db_jawaban') || '[]');

    const sesiHistori = [
      { id: 'sesi-hist-1', kuis_id: 'kuis-ekosistem-1', guru_id: 'guru-demo-1', kode: 'EKO101', mode: 'custom', status: 'selesai', soal_aktif: 5, pengali_waktu: 1.0, created_at: '2026-10-14T08:30:00.000Z' },
      { id: 'sesi-hist-2', kuis_id: 'kuis-ekosistem-1', guru_id: 'guru-demo-1', kode: 'EKO102', mode: 'adventure', status: 'selesai', soal_aktif: 5, pengali_waktu: 1.0, created_at: '2026-10-21T08:30:00.000Z' },
      { id: 'sesi-hist-3', kuis_id: 'kuis-ekosistem-1', guru_id: 'guru-demo-1', kode: 'EKO103', mode: 'custom', status: 'berjalan', soal_aktif: 3, pengali_waktu: 1.0, created_at: '2026-10-28T07:30:00.000Z' }
    ];

    const pesertaHistori = [
      // Sesi 1 (14 Okt)
      { id: 'pes-h1-1', sesi_id: 'sesi-hist-1', siswa_id: 'siswa-1', nama_panggilan: 'Budi', kelas: 'Kelas V-A', avatar: 'avatar-1.svg', skor: 80, durasi_detik: 115, created_at: '2026-10-14T08:31:00.000Z' },
      { id: 'pes-h1-2', sesi_id: 'sesi-hist-1', siswa_id: 'siswa-2', nama_panggilan: 'Siti', kelas: 'Kelas V-A', avatar: 'avatar-2.svg', skor: 90, durasi_detik: 98, created_at: '2026-10-14T08:31:10.000Z' },
      { id: 'pes-h1-3', sesi_id: 'sesi-hist-1', siswa_id: 'siswa-3', nama_panggilan: 'Edo', kelas: 'Kelas V-A', avatar: 'avatar-3.svg', skor: 55, durasi_detik: 145, created_at: '2026-10-14T08:31:20.000Z' },
      { id: 'pes-h1-4', sesi_id: 'sesi-hist-1', siswa_id: 'siswa-6', nama_panggilan: 'Dayu', kelas: 'Kelas V-B', avatar: 'avatar-2.svg', skor: 80, durasi_detik: 110, created_at: '2026-10-14T08:31:30.000Z' },
      { id: 'pes-h1-5', sesi_id: 'sesi-hist-1', siswa_id: 'siswa-7', nama_panggilan: 'Beni', kelas: 'Kelas V-B', avatar: 'avatar-3.svg', skor: 60, durasi_detik: 140, created_at: '2026-10-14T08:31:40.000Z' },
      // Sesi 2 (21 Okt)
      { id: 'pes-h2-1', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-1', nama_panggilan: 'Budi', kelas: 'Kelas V-A', avatar: 'avatar-1.svg', skor: 90, durasi_detik: 105, created_at: '2026-10-21T08:31:00.000Z' },
      { id: 'pes-h2-2', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-2', nama_panggilan: 'Siti', kelas: 'Kelas V-A', avatar: 'avatar-2.svg', skor: 100, durasi_detik: 88, created_at: '2026-10-21T08:31:10.000Z' },
      { id: 'pes-h2-3', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-3', nama_panggilan: 'Edo', kelas: 'Kelas V-A', avatar: 'avatar-3.svg', skor: 65, durasi_detik: 138, created_at: '2026-10-21T08:31:20.000Z' },
      { id: 'pes-h2-4', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-4', nama_panggilan: 'Lani', kelas: 'Kelas V-A', avatar: 'avatar-4.svg', skor: 85, durasi_detik: 112, created_at: '2026-10-21T08:31:25.000Z' },
      { id: 'pes-h2-5', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-6', nama_panggilan: 'Dayu', kelas: 'Kelas V-B', avatar: 'avatar-2.svg', skor: 90, durasi_detik: 102, created_at: '2026-10-21T08:31:30.000Z' },
      { id: 'pes-h2-6', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-7', nama_panggilan: 'Beni', kelas: 'Kelas V-B', avatar: 'avatar-3.svg', skor: 65, durasi_detik: 132, created_at: '2026-10-21T08:31:40.000Z' },
      { id: 'pes-h2-7', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-8', nama_panggilan: 'Meli', kelas: 'Kelas V-B', avatar: 'avatar-4.svg', skor: 85, durasi_detik: 108, created_at: '2026-10-21T08:31:45.000Z' },
      { id: 'pes-h2-8', sesi_id: 'sesi-hist-2', siswa_id: 'siswa-9', nama_panggilan: 'Udin', kelas: 'Kelas V-B', avatar: 'avatar-1.svg', skor: 60, durasi_detik: 142, created_at: '2026-10-21T08:31:50.000Z' },
      // Sesi 3 (28 Okt - Aktif/Berjalan untuk Pemantauan Realtime)
      { id: 'pes-h3-1', sesi_id: 'sesi-hist-3', siswa_id: 'siswa-1', nama_panggilan: 'Budi', kelas: 'Kelas V-A', avatar: 'avatar-1.svg', skor: 95, durasi_detik: 95, created_at: '2026-10-28T07:32:00.000Z' },
      { id: 'pes-h3-2', sesi_id: 'sesi-hist-3', siswa_id: 'siswa-2', nama_panggilan: 'Siti', kelas: 'Kelas V-A', avatar: 'avatar-2.svg', skor: 100, durasi_detik: 84, created_at: '2026-10-28T07:32:10.000Z' },
      { id: 'pes-h3-3', sesi_id: 'sesi-hist-3', siswa_id: 'siswa-3', nama_panggilan: 'Edo', kelas: 'Kelas V-A', avatar: 'avatar-3.svg', skor: 60, durasi_detik: 130, created_at: '2026-10-28T07:32:20.000Z' },
      { id: 'pes-h3-4', sesi_id: 'sesi-hist-3', siswa_id: 'siswa-8', nama_panggilan: 'Meli', kelas: 'Kelas V-B', avatar: 'avatar-4.svg', skor: 90, durasi_detik: 98, created_at: '2026-10-28T07:32:30.000Z' }
    ];

    // Buat butir jawaban realistis untuk analisis butir soal & pengecoh
    const jawabanHistori = [
      // Soal 1 (Mudah - Kunci '0' Padi): hampir semua benar
      { id: 'jwb-h-1', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-1', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 8200, created_at: '2026-10-21T08:32:00.000Z' },
      { id: 'jwb-h-2', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-2', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 6500, created_at: '2026-10-21T08:32:05.000Z' },
      { id: 'jwb-h-3', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-3', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 11200, created_at: '2026-10-21T08:32:10.000Z' },
      { id: 'jwb-h-4', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-4', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 9100, created_at: '2026-10-21T08:32:12.000Z' },
      { id: 'jwb-h-5', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-5', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 7800, created_at: '2026-10-21T08:32:15.000Z' },
      { id: 'jwb-h-6', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-6', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 10400, created_at: '2026-10-21T08:32:18.000Z' },
      // Soal 3 (Sedang - Kunci '1' Katak, pengecoh '0' Belalang)
      { id: 'jwb-h-7', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-1', soal_id: 'soal-3', jawaban: '1', benar: true, poin: 10, waktu_ms: 12000, created_at: '2026-10-21T08:33:00.000Z' },
      { id: 'jwb-h-8', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-2', soal_id: 'soal-3', jawaban: '1', benar: true, poin: 10, waktu_ms: 9500, created_at: '2026-10-21T08:33:05.000Z' },
      { id: 'jwb-h-9', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-3', soal_id: 'soal-3', jawaban: '0', benar: false, poin: 0, waktu_ms: 18500, created_at: '2026-10-21T08:33:10.000Z' },
      { id: 'jwb-h-10', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-4', soal_id: 'soal-3', jawaban: '1', benar: true, poin: 10, waktu_ms: 11000, created_at: '2026-10-21T08:33:12.000Z' },
      { id: 'jwb-h-11', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-6', soal_id: 'soal-3', jawaban: '0', benar: false, poin: 0, waktu_ms: 19200, created_at: '2026-10-21T08:33:18.000Z' },
      // Soal 8 (Sulit - Kunci '1' Fitoplankton, pengecoh populer '0' Zooplankton)
      { id: 'jwb-h-12', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-1', soal_id: 'soal-8', jawaban: '0', benar: false, poin: 0, waktu_ms: 21000, created_at: '2026-10-21T08:35:00.000Z' },
      { id: 'jwb-h-13', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-2', soal_id: 'soal-8', jawaban: '1', benar: true, poin: 10, waktu_ms: 14000, created_at: '2026-10-21T08:35:05.000Z' },
      { id: 'jwb-h-14', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-3', soal_id: 'soal-8', jawaban: '0', benar: false, poin: 0, waktu_ms: 24000, created_at: '2026-10-21T08:35:10.000Z' },
      { id: 'jwb-h-15', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-6', soal_id: 'soal-8', jawaban: '0', benar: false, poin: 0, waktu_ms: 22500, created_at: '2026-10-21T08:35:15.000Z' },
      { id: 'jwb-h-16', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-8', soal_id: 'soal-8', jawaban: '0', benar: false, poin: 0, waktu_ms: 25000, created_at: '2026-10-21T08:35:20.000Z' },
      // Soal 17 (Sulit - Kunci '1' Musuh alami mati, pengecoh '0' Tanaman selalu terlindungi)
      { id: 'jwb-h-17', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-1', soal_id: 'soal-17', jawaban: '1', benar: true, poin: 10, waktu_ms: 15000, created_at: '2026-10-21T08:37:00.000Z' },
      { id: 'jwb-h-18', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-3', soal_id: 'soal-17', jawaban: '0', benar: false, poin: 0, waktu_ms: 20000, created_at: '2026-10-21T08:37:05.000Z' },
      { id: 'jwb-h-19', sesi_id: 'sesi-hist-2', peserta_id: 'pes-h2-6', soal_id: 'soal-17', jawaban: '0', benar: false, poin: 0, waktu_ms: 21000, created_at: '2026-10-21T08:37:10.000Z' },
      // Jawaban sesi aktif 3
      { id: 'jwb-h3-1', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-1', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 7500, created_at: '2026-10-28T07:33:00.000Z' },
      { id: 'jwb-h3-2', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-1', soal_id: 'soal-2', jawaban: '1', benar: true, poin: 10, waktu_ms: 8400, created_at: '2026-10-28T07:34:00.000Z' },
      { id: 'jwb-h3-3', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-1', soal_id: 'soal-3', jawaban: '1', benar: true, poin: 10, waktu_ms: 9100, created_at: '2026-10-28T07:35:00.000Z' },
      { id: 'jwb-h3-4', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-2', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 6200, created_at: '2026-10-28T07:33:05.000Z' },
      { id: 'jwb-h3-5', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-2', soal_id: 'soal-2', jawaban: '1', benar: true, poin: 10, waktu_ms: 7100, created_at: '2026-10-28T07:34:05.000Z' },
      { id: 'jwb-h3-6', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-2', soal_id: 'soal-3', jawaban: '1', benar: true, poin: 10, waktu_ms: 8000, created_at: '2026-10-28T07:35:05.000Z' },
      { id: 'jwb-h3-7', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-3', soal_id: 'soal-1', jawaban: '0', benar: true, poin: 10, waktu_ms: 11000, created_at: '2026-10-28T07:33:10.000Z' },
      { id: 'jwb-h3-8', sesi_id: 'sesi-hist-3', peserta_id: 'pes-h3-3', soal_id: 'soal-2', jawaban: '0', benar: false, poin: 0, waktu_ms: 15000, created_at: '2026-10-28T07:34:15.000Z' }
    ];

    localStorage.setItem('kupas_db_sesi', JSON.stringify([...sesiHistori, ...existingSesi]));
    localStorage.setItem('kupas_db_peserta', JSON.stringify([...pesertaHistori, ...existingPeserta]));
    localStorage.setItem('kupas_db_jawaban', JSON.stringify([...jawabanHistori, ...existingJawaban]));
    localStorage.setItem('kupas_db_sesi_seeded', 'true');
  }
}

inisialisasiDataLokal();

class ChannelMock {
  constructor(channelName) {
    this.name = channelName;
    this.bc = new BroadcastChannel('kupas_' + channelName);
    this.bcChanges = new BroadcastChannel('kupas_postgres_changes');
    this.handlers = { broadcast: [], presence: [], postgres_changes: [] };

    this.bc.onmessage = (event) => {
      const { type, eventName, payload } = event.data;
      if (type === 'broadcast') {
        this.handlers.broadcast.forEach(h => {
          if (!h.event || h.event === eventName) h.callback({ event: eventName, payload });
        });
      } else if (type === 'presence') {
        this.handlers.presence.forEach(h => h.callback(payload));
      }
    };

    this.bcChanges.onmessage = (event) => {
      const { table, eventType, new: newRow } = event.data;
      this.handlers.postgres_changes.forEach(h => h.callback({ table, eventType, new: newRow }));
      if (table === 'peserta') {
        this.handlers.presence.forEach(h => h.callback(newRow));
      }
    };
  }

  on(type, filter, callback) {
    if (type === 'broadcast') {
      this.handlers.broadcast.push({ event: filter.event, callback });
    } else if (type === 'presence') {
      this.handlers.presence.push({ filter, callback });
    } else if (type === 'postgres_changes') {
      this.handlers.postgres_changes.push({ filter, callback });
    }
    return this;
  }

  subscribe(callback) {
    if (callback) callback('SUBSCRIBED');
    return this;
  }

  async send(msg) {
    this.bc.postMessage({ type: 'broadcast', eventName: msg.event, payload: msg.payload });
    return 'ok';
  }

  async track(state) {
    this.bc.postMessage({ type: 'presence', payload: state });
    return 'ok';
  }
}

class SupabaseMockClient {
  constructor() {
    this.auth = {
      async signInWithPassword({ email, password }) {
        if (!email || !password) throw new Error('Email dan kata sandi wajib diisi');
        const user = { id: 'guru-demo-1', email, user_metadata: { nama: 'Ibu Guru IPAS', sekolah: 'SD Negeri Merdeka 01' } };
        localStorage.setItem('kupas_auth_user', JSON.stringify(user));
        return { data: { user, session: { access_token: 'mock-token' } }, error: null };
      },
      async signUp({ email, password, options }) {
        const user = { id: 'guru-demo-1', email, user_metadata: options?.data || { nama: 'Guru IPAS', sekolah: 'SD Negeri' } };
        localStorage.setItem('kupas_auth_user', JSON.stringify(user));
        return { data: { user, session: { access_token: 'mock-token' } }, error: null };
      },
      async signOut() {
        localStorage.removeItem('kupas_auth_user');
        return { error: null };
      },
      async getUser() {
        const u = localStorage.getItem('kupas_auth_user');
        return { data: { user: u ? JSON.parse(u) : null }, error: null };
      },
      async getSession() {
        const u = localStorage.getItem('kupas_auth_user');
        return { data: { session: u ? { user: JSON.parse(u) } : null }, error: null };
      },
      async signInAnonymously() {
        const user = { id: 'anon-' + Math.random().toString(36).substr(2, 9), is_anonymous: true };
        return { data: { user }, error: null };
      }
    };
  }

  channel(name) {
    return new ChannelMock(name);
  }

  from(table) {
    const getStore = () => JSON.parse(localStorage.getItem('kupas_db_' + table) || '[]');
    const setStore = (data) => localStorage.setItem('kupas_db_' + table, JSON.stringify(data));
    const getCurrentUser = () => JSON.parse(localStorage.getItem('kupas_auth_user') || 'null');
    const tabelKhususGuru = ['kamus', 'kelas', 'siswa_terdaftar', 'fact_opinion_statements', 'food_chain_scenarios'];

    return {
      _filters: [],
      _order: null,
      _single: false,

      select(fields = '*') {
        return this;
      },
      eq(col, val) {
        this._filters.push(item => item[col] === val);
        return this;
      },
      order(col, { ascending = true } = {}) {
        this._order = { col, ascending };
        return this;
      },
      single() {
        this._single = true;
        return this;
      },
      async then(resolve) {
        let rows = getStore();
        const user = getCurrentUser();
        const isGuru = user && !user.is_anonymous;

        // RLS SELECT pada konten materi: publik hanya melihat terbit, guru melihat miliknya
        if (table === 'kamus' || table === 'fact_opinion_statements' || table === 'food_chain_scenarios') {
          if (!isGuru) {
            rows = rows.filter(r => r.status === 'terbit');
          } else {
            rows = rows.filter(r => !r.guru_id || r.guru_id === user.id);
          }
        }

        // RLS SELECT pada kelas & siswa_terdaftar: guru hanya melihat data kelasnya sendiri
        if (table === 'kelas' || table === 'siswa_terdaftar') {
          const activeGuruId = isGuru ? user.id : 'guru-demo-1';
          rows = rows.filter(r => !r.guru_id || r.guru_id === activeGuruId);
        }

        for (const f of this._filters) {
          rows = rows.filter(f);
        }
        if (this._order) {
          rows.sort((a, b) => {
            if (a[this._order.col] > b[this._order.col]) return this._order.ascending ? 1 : -1;
            if (a[this._order.col] < b[this._order.col]) return this._order.ascending ? -1 : 1;
            return 0;
          });
        }
        if (this._single) {
          resolve({ data: rows[0] || null, error: rows.length ? null : { message: 'Data tidak ditemukan' } });
        } else {
          resolve({ data: rows, error: null });
        }
      },
      insert(items) {
        const user = getCurrentUser();

        // RLS INSERT pada tabel khusus guru: siswa/anon DITOLAK
        if (tabelKhususGuru.includes(table) && (!user || user.is_anonymous)) {
          return {
            select() { return this; },
            single() { return this; },
            then(resolve) {
              resolve({ data: null, error: { message: `Izin ditolak: hanya guru yang dapat menambah data ${table} (RLS)` } });
            }
          };
        }

        // Logika Khusus Sertifikat: Satu per murid per aktivitas, perbarui jika nilai lebih tinggi
        if (table === 'certificates') {
          const list = Array.isArray(items) ? items : [items];
          const store = getStore();
          const results = [];

          list.forEach(cert => {
            const ambang = cert.ambang_batas !== undefined ? Number(cert.ambang_batas) : 80;
            if (Number(cert.nilai) < ambang) {
              return; // Di bawah ambang batas tidak diterbitkan sertifikat
            }

            const existingIdx = store.findIndex(c =>
              (c.siswa_id && cert.siswa_id && c.siswa_id === cert.siswa_id && c.aktivitas_tipe === cert.aktivitas_tipe && c.aktivitas_id === cert.aktivitas_id) ||
              (c.nama_siswa && cert.nama_siswa && c.nama_siswa.trim().toLowerCase() === cert.nama_siswa.trim().toLowerCase() && c.aktivitas_tipe === cert.aktivitas_tipe && c.aktivitas_id === cert.aktivitas_id)
            );

            if (existingIdx >= 0) {
              const existing = store[existingIdx];
              if (Number(cert.nilai) > Number(existing.nilai)) {
                existing.nilai = Number(cert.nilai);
                existing.tanggal_terbit = new Date().toISOString();
                store[existingIdx] = existing;
              }
              results.push(existing);
            } else {
              const randomNum = Math.floor(1000 + Math.random() * 9000);
              const newCert = {
                id: cert.id || 'cert-' + Math.random().toString(36).substr(2, 9),
                nomor_sertifikat: cert.nomor_sertifikat || `KPS-EKO-2026-${randomNum}`,
                created_at: new Date().toISOString(),
                tanggal_terbit: new Date().toISOString(),
                ...cert
              };
              store.push(newCert);
              results.push(newCert);
            }
          });

          setStore(store);

          const bc = new BroadcastChannel('kupas_postgres_changes');
          bc.postMessage({ type: 'postgres_changes', table: 'certificates', eventType: 'INSERT', new: results[0] });

          const builder = {
            _single: false,
            select() { return this; },
            single() { this._single = true; return this; },
            then(resolve) {
              resolve({ data: this._single ? results[0] : results, error: null });
            }
          };
          return builder;
        }

        const list = Array.isArray(items) ? items : [items];
        const store = getStore();
        const inserted = list.map(it => ({
          id: it.id || 'id-' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          ...it
        }));
        setStore([...store, ...inserted]);

        if (['peserta', 'sesi', 'jawaban', 'kamus', 'kelas', 'siswa_terdaftar', 'fact_opinion_statements', 'food_chain_scenarios', 'activity_results', 'certificates'].includes(table)) {
          const bc = new BroadcastChannel('kupas_postgres_changes');
          bc.postMessage({ type: 'postgres_changes', table, eventType: 'INSERT', new: inserted[0] });
        }

        const builder = {
          _single: false,
          select() { return this; },
          single() { this._single = true; return this; },
          then(resolve) {
            resolve({ data: this._single ? inserted[0] : inserted, error: null });
          }
        };
        return builder;
      },
      update(values) {
        const user = getCurrentUser();
        if (tabelKhususGuru.includes(table) && (!user || user.is_anonymous)) {
          return {
            eq() { return this; },
            then(resolve) {
              resolve({ data: null, error: { message: `Izin ditolak: hanya guru yang dapat mengubah ${table} (RLS)` } });
            }
          };
        }

        const self = this;
        const builder = {
          _filters: [...self._filters],
          eq(col, val) {
            this._filters.push(item => item[col] === val);
            return this;
          },
          select() { return this; },
          single() { return this; },
          then(resolve) {
            const store = getStore();
            const newStore = store.map(item => {
              let match = true;
              for (const f of this._filters) {
                if (!f(item)) { match = false; break; }
              }
              if (match) {
                return { ...item, ...values };
              }
              return item;
            });
            setStore(newStore);
            resolve({ data: null, error: null });
          }
        };
        return builder;
      },
      delete() {
        const user = getCurrentUser();
        if (tabelKhususGuru.includes(table) && (!user || user.is_anonymous)) {
          return {
            eq() { return this; },
            then(resolve) {
              resolve({ data: null, error: { message: `Izin ditolak: hanya guru yang dapat menghapus ${table} (RLS)` } });
            }
          };
        }

        const self = this;
        const builder = {
          _filters: [...self._filters],
          eq(col, val) {
            this._filters.push(item => item[col] === val);
            return this;
          },
          then(resolve) {
            const store = getStore();
            const newStore = store.filter(item => {
              for (const f of this._filters) {
                if (f(item)) return false;
              }
              return true;
            });
            setStore(newStore);
            resolve({ data: null, error: null });
          }
        };
        return builder;
      }
    };
  }

  async rpc(funcName, params = {}) {
    if (funcName === 'generate_kode_sesi') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return { data: code, error: null };
    }

    if (funcName === 'kirim_jawaban') {
      const { p_sesi_id, p_peserta_id, p_soal_id, p_jawaban, p_waktu_ms } = params;
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      const soalList = JSON.parse(localStorage.getItem('kupas_db_soal') || '[]');
      const soal = soalList.find(s => s.id === p_soal_id);

      const kunciAsli = String(kunciDB[p_soal_id] || '').trim().toLowerCase();
      const jawabanUser = String(p_jawaban ?? '').trim().toLowerCase();
      const benar = (jawabanUser === kunciAsli);
      const poinDapat = benar ? (soal ? soal.poin : 10) : 0;

      const storeJawaban = JSON.parse(localStorage.getItem('kupas_db_jawaban') || '[]');
      storeJawaban.push({
        id: 'jawaban-' + Math.random().toString(36).substr(2, 9),
        sesi_id: p_sesi_id,
        peserta_id: p_peserta_id,
        soal_id: p_soal_id,
        jawaban: p_jawaban,
        benar,
        poin: poinDapat,
        waktu_ms: p_waktu_ms || 0,
        created_at: new Date().toISOString()
      });
      localStorage.setItem('kupas_db_jawaban', JSON.stringify(storeJawaban));

      const storePeserta = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
      const targetPeserta = storePeserta.find(p => p.id === p_peserta_id);
      if (targetPeserta) {
        targetPeserta.skor = (targetPeserta.skor || 0) + poinDapat;
        localStorage.setItem('kupas_db_peserta', JSON.stringify(storePeserta));
      }

      const bc = new BroadcastChannel('kupas_postgres_changes');
      bc.postMessage({ type: 'postgres_changes', table: 'jawaban', eventType: 'INSERT', new: { sesi_id: p_sesi_id, peserta_id: p_peserta_id, soal_id: p_soal_id, benar, poin: poinDapat } });

      return {
        data: {
          success: true,
          benar,
          poin: poinDapat,
          penjelasan: soal ? soal.penjelasan : '',
          kamus_id: soal ? soal.kamus_id : null
        },
        error: null
      };
    }

    return { data: null, error: { message: 'Fungsi tidak dikenal: ' + funcName } };
  }
}

let clientInstance = null;
if (SUPABASE_URL !== 'SUPABASE_URL' && window.supabase && typeof window.supabase.createClient === 'function') {
  clientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  clientInstance = new SupabaseMockClient();
}

export const supabase = clientInstance;
