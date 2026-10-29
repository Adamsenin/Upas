/**
 * KUPAS KUIS IPAS v4.0 - Pengelola Sertifikat Prestasi Siswa (sertifikat.js)
 * Standar Desain: Piagam Penghargaan Resmi A4 Lanskap (297x210 mm)
 * - Format A4 Lanskap Rasio Tetap (1188x840 viewBox).
 * - Desain Vektor Mandiri (100% SVG Inline & CSS, bebas gambar eksternal).
 * - Ornamen Sudut Emas Marigold, Pola Guilloche Halus & Watermark Si Kupas Samar.
 * - Tipografi Serif Mewah (Playfair Display) & Sans-Serif Bersih (Nunito).
 * - Segel Medali Emas Berpita SVG Dinamis Sesuai Nilai/Level.
 * - Proteksi Nama Panjang (Skala Ukuran Otomatis & Wrap Aman).
 * - Unduh PNG Resolusi Tinggi (Native Canvas Browser API).
 * - Cetak Presisi 1 Halaman A4 Lanskap (@media print).
 * - Galeri Koleksi Sertifikat (Kartu Terbuka & Kartu Terkunci Bersyarat).
 */

import { supabase } from './supabase.js';
import { pasangHeader, suara, cetusKonfeti, umumkanAria, gamifikasi } from './ui.js';

// Katalog Standar Seluruh Sertifikat Prestasi IPAS Kelas V SD
const KATALOG_SERTIFIKAT_MASTER = [
  {
    aktivitas_tipe: 'rantai_makanan',
    aktivitas_id: 'skenario-sawah',
    nama_kuis_topik: 'Rantai Makanan Ekosistem Sawah',
    kategori: 'Simulasi Ekosistem',
    syarat_buka: 'Selesaikan tantangan rantai makanan ekosistem sawah dengan nilai minimal 80%.',
    tautan_mulai: 'rantai-makanan.html'
  },
  {
    aktivitas_tipe: 'fakta_opini',
    aktivitas_id: 'topik-fakta-opini',
    nama_kuis_topik: 'Fakta atau Opini Ekosistem IPAS',
    kategori: 'Literasi Kritis',
    syarat_buka: 'Tuntaskan pemilahan pernyataan fakta vs opini ekosistem dengan nilai minimal 80%.',
    tautan_mulai: 'fakta-opini.html'
  },
  {
    aktivitas_tipe: 'rantai_makanan',
    aktivitas_id: 'skenario-hutan',
    nama_kuis_topik: 'Rantai Makanan Ekosistem Hutan',
    kategori: 'Simulasi Ekosistem',
    syarat_buka: 'Selesaikan tantangan rantai makanan ekosistem hutan tropis dengan nilai minimal 80%.',
    tautan_mulai: 'rantai-makanan.html'
  },
  {
    aktivitas_tipe: 'kuis',
    aktivitas_id: 'evaluasi-ekosistem-v',
    nama_kuis_topik: 'Evaluasi Harmoni & Simbiosis Alam',
    kategori: 'Ujian Sesi Kelas',
    syarat_buka: 'Ikuti sesi kuis live bersama guru dan raih skor minimal 80 (Tuntas KKM).',
    tautan_mulai: 'gabung.html'
  }
];

class PengelolaSertifikat {
  constructor() {
    this.daftarSertifikat = [];
    this.sertifikatAktif = null;
    this.namaSiswa = localStorage.getItem('kupas_nama_siswa') || 'Siti Aminah';
    this.infoGamifikasi = gamifikasi.ambilInfoLevel() || { level: 2, xp: 120, gelar: 'Penjelajah Sawah' };

    // Elemen DOM Halaman
    this.wadahA4 = document.getElementById('wadah-sertifikat-a4');
    this.wadahGrid = document.getElementById('wadah-daftar-sertifikat');
    this.elJudulShowcase = document.getElementById('showcase-cert-judul');
    this.elSubjudulShowcase = document.getElementById('showcase-cert-subjudul');
    this.elBadgeStatus = document.getElementById('showcase-cert-badge-status');
    this.elInfoStatusGaleri = document.getElementById('galeri-info-status');

    this.btnCetak = document.getElementById('btn-cetak-sertifikat');
    this.btnUnduhPNG = document.getElementById('btn-unduh-png');
  }

  async init() {
    pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

    // Pasang listener tombol cetak & unduh PNG
    if (this.btnCetak) {
      this.btnCetak.addEventListener('click', () => this.cetakSertifikat());
    }

    if (this.btnUnduhPNG) {
      this.btnUnduhPNG.addEventListener('click', () => this.unduhPNG());
    }

    await this.muatDataSertifikat();
  }

  /**
   * Mengambil sertifikat dari tabel Supabase / storage lokal
   */
  async muatDataSertifikat() {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('tanggal_terbit', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        this.daftarSertifikat = data;
      } else {
        // Fallback data demo jika belum ada di database
        this.daftarSertifikat = [
          {
            id: 'cert-demo-default',
            nomor_sertifikat: 'KPS-EKO-2026-0001',
            nama_siswa: this.namaSiswa,
            kelas: 'Kelas V-A',
            aktivitas_tipe: 'rantai_makanan',
            aktivitas_id: 'skenario-sawah',
            nama_kuis_topik: 'Rantai Makanan Ekosistem Sawah',
            nilai: 100,
            ambang_batas: 80,
            nama_guru: 'Ibu Guru IPAS, S.Pd.',
            tanggal_terbit: new Date().toISOString()
          }
        ];
      }

      // Tampilkan sertifikat pertama sebagai sertifikat aktif
      this.pilihSertifikat(this.daftarSertifikat[0], false);
      this.renderGaleri();
    } catch (e) {
      console.error('Gagal memuat sertifikat:', e);
    }
  }

  /**
   * Menghitung ukuran font nama siswa secara otomatis agar tetap proporsional
   * Mendukung nama pendek maupun nama panjang 40+ karakter tanpa keluar batas.
   */
  hitungUkuranFontNama(nama) {
    const pjg = (nama || '').trim().length;
    if (pjg <= 16) {
      return { fontSize: 44, y: 304, letterSpacing: 2 };
    } else if (pjg <= 24) {
      return { fontSize: 36, y: 304, letterSpacing: 1 };
    } else if (pjg <= 32) {
      return { fontSize: 29, y: 304, letterSpacing: 0.5 };
    } else if (pjg <= 42) {
      return { fontSize: 23, y: 304, letterSpacing: 0 };
    } else {
      return { fontSize: 19, y: 304, letterSpacing: 0 };
    }
  }

  /**
   * Menghasilkan SVG Sertifikat A4 Lanskap Utuh (1188 x 840)
   */
  buatSertifikatSVG(cert) {
    const tanggalObj = new Date(cert.tanggal_terbit || cert.created_at || Date.now());
    const tanggalFormat = tanggalObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const namaSiswa = cert.nama_siswa || this.namaSiswa;
    const kelasSiswa = cert.kelas || 'Kelas V-A';
    const topikKuis = cert.nama_kuis_topik || 'Ekosistem & Rantai Makanan';
    const nilai = Number(cert.nilai) || 100;
    const nomorCert = cert.nomor_sertifikat || 'KPS-EKO-2026-0001';
    const namaGuru = (cert.nama_guru && cert.nama_guru.trim() !== '') ? cert.nama_guru : 'Ibu Guru IPAS, S.Pd.';

    // Tier Medali & Predikat
    const isEmas = nilai >= 90;
    const isPerak = nilai >= 80 && nilai < 90;
    const predikatTeks = isEmas ? 'PREDIKAT EMAS' : (isPerak ? 'PREDIKAT PERAK' : 'PREDIKAT PERUNGGU');
    const gradMedaliId = isEmas ? 'grad-medali-emas' : (isPerak ? 'grad-medali-perak' : 'grad-medali-perunggu');
    const pitaFill = isEmas ? '#B45309' : (isPerak ? '#0F3D2E' : '#78350F');

    const gayaNama = this.hitungUkuranFontNama(namaSiswa);

    return `
      <svg id="svg-sertifikat-render" class="sertifikat-svg-root" viewBox="0 0 1188 840" width="100%" height="100%"
        xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sertifikat Pencapaian IPAS untuk ${namaSiswa}">
        
        <defs>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&amp;family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700&amp;family=Nunito:wght@600;700;800;900&amp;display=swap');
            .cert-serif { font-family: 'Playfair Display', 'Cormorant Garamond', Georgia, serif; }
            .cert-sans { font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .cert-mono { font-family: 'Courier New', Courier, monospace; }
          </style>

          <!-- Gradien Emas Medali -->
          <linearGradient id="grad-medali-emas" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE68A" />
            <stop offset="35%" stop-color="#F59E0B" />
            <stop offset="70%" stop-color="#D97706" />
            <stop offset="100%" stop-color="#78350F" />
          </linearGradient>

          <!-- Gradien Perak Medali -->
          <linearGradient id="grad-medali-perak" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="40%" stop-color="#CBD5E1" />
            <stop offset="80%" stop-color="#94A3B8" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>

          <!-- Gradien Perunggu Medali -->
          <linearGradient id="grad-medali-perunggu" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FDE68A" />
            <stop offset="40%" stop-color="#D97706" />
            <stop offset="80%" stop-color="#92400E" />
            <stop offset="100%" stop-color="#451A03" />
          </linearGradient>

          <!-- Gradien Pita & Aksen Emas -->
          <linearGradient id="grad-aksen-emas" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#D97706" stop-opacity="0" />
            <stop offset="25%" stop-color="#F59E0B" stop-opacity="1" />
            <stop offset="50%" stop-color="#FEF08A" stop-opacity="1" />
            <stop offset="75%" stop-color="#F59E0B" stop-opacity="1" />
            <stop offset="100%" stop-color="#D97706" stop-opacity="0" />
          </linearGradient>

          <!-- Pola Guilloche Halus Latar Belakang -->
          <pattern id="pola-guilloche" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#D97706" stroke-width="0.8" stroke-opacity="0.07" />
            <circle cx="0" cy="0" r="24" fill="none" stroke="#D97706" stroke-width="0.8" stroke-opacity="0.07" />
            <circle cx="60" cy="0" r="24" fill="none" stroke="#D97706" stroke-width="0.8" stroke-opacity="0.07" />
            <circle cx="0" cy="60" r="24" fill="none" stroke="#D97706" stroke-width="0.8" stroke-opacity="0.07" />
            <circle cx="60" cy="60" r="24" fill="none" stroke="#D97706" stroke-width="0.8" stroke-opacity="0.07" />
            <path d="M 0,30 Q 30,0 60,30 Q 30,60 0,30" fill="none" stroke="#0F3D2E" stroke-width="0.6" stroke-opacity="0.04" />
          </pattern>

          <!-- Ornamen Sudut Vektor Kaligrafi Emas -->
          <g id="ornamen-sudut">
            <path d="M 0,0 L 48,0 C 38,12 28,16 22,26 C 18,34 18,44 24,54 L 0,54 Z" fill="#F59E0B" opacity="0.12" />
            <path d="M 4,4 L 64,4 C 50,14 36,22 28,34 C 20,46 18,60 22,76" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" />
            <path d="M 4,4 L 4,64 C 14,50 22,36 34,28 C 46,20 60,18 76,22" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" />
            <path d="M 12,12 Q 32,16 38,38" fill="none" stroke="#F59E0B" stroke-width="1.4" stroke-linecap="round" />
            <circle cx="20" cy="20" r="3.5" fill="#D97706" />
            <circle cx="56" cy="14" r="2.5" fill="#F59E0B" />
            <circle cx="14" cy="56" r="2.5" fill="#F59E0B" />
            <circle cx="34" cy="34" r="1.8" fill="#D97706" />
          </g>

          <!-- Watermark Maskot Si Kupas Samar di Tengah -->
          <g id="watermark-burung-kupas" opacity="0.05" transform="translate(594, 420) scale(1.65)">
            <g transform="translate(-80, -85)">
              <circle cx="80" cy="85" r="55" fill="#0F3D2E" />
              <ellipse cx="80" cy="100" rx="35" ry="30" fill="#FFF6E0" />
              <!-- Mata Melengkung -->
              <path d="M52,75 Q62,65 72,75" fill="none" stroke="#0F3D2E" stroke-width="5" stroke-linecap="round" />
              <path d="M88,75 Q98,65 108,75" fill="none" stroke="#0F3D2E" stroke-width="5" stroke-linecap="round" />
              <!-- Paruh -->
              <polygon points="80,80 70,92 90,92" fill="#D97706" />
              <!-- Sayap Mengembang -->
              <path d="M26,80 Q8,45 25,35 Q40,55 35,80 Z" fill="#0F3D2E" />
              <path d="M134,80 Q152,45 135,35 Q120,55 125,80 Z" fill="#0F3D2E" />
              <!-- Mahkota Bintang & Daun -->
              <polygon points="80,18 84,27 94,27 86,33 89,42 80,36 71,42 74,33 66,27 76,27" fill="#D97706" />
              <path d="M80,36 C65,26 70,48 80,48 C90,48 95,26 80,36 Z" fill="#0F3D2E" />
            </g>
          </g>
        </defs>

        <!-- 1. KANVAS & WARNA DASAR KERTAS (Krem Elegan) -->
        <rect width="100%" height="100%" fill="#FFFDF7" />

        <!-- 2. TEKSTUR GUILLOCHE HALUS -->
        <rect x="42" y="42" width="1104" height="756" fill="url(#pola-guilloche)" rx="6" />

        <!-- 3. WATERMARK RESMI SI KUPAS -->
        <use href="#watermark-burung-kupas" />

        <!-- 4. BINGKAI GANDA DOKUMEN PRESTASI -->
        <!-- Bingkai Luar: Hijau Hutan Tua (4px) -->
        <rect x="22" y="22" width="1144" height="796" rx="10" fill="none" stroke="#0F3D2E" stroke-width="3.5" />
        
        <!-- Bingkai Tengah: Emas Marigold (1.5px) -->
        <rect x="32" y="32" width="1124" height="776" rx="8" fill="none" stroke="#D97706" stroke-width="1.8" />

        <!-- Bingkai Dalam: Garis Halus Berselang (1px) -->
        <rect x="42" y="42" width="1104" height="756" rx="6" fill="none" stroke="#F59E0B" stroke-width="1" stroke-dasharray="14, 4" />

        <!-- 5. ORNAMEN SUDUT KALIGRAFI EMAS PADA 4 SUDUT -->
        <!-- Sudut Kiri Atas -->
        <use href="#ornamen-sudut" x="42" y="42" />
        <!-- Sudut Kanan Atas -->
        <use href="#ornamen-sudut" x="1146" y="42" transform="scale(-1, 1) translate(-1188, 0)" />
        <!-- Sudut Kiri Bawah -->
        <use href="#ornamen-sudut" x="42" y="798" transform="scale(1, -1) translate(0, -840)" />
        <!-- Sudut Kanan Bawah -->
        <use href="#ornamen-sudut" x="1146" y="798" transform="scale(-1, -1) translate(-1188, -840)" />

        <!-- 6. KOP HEADER: LOGO APLIKASI & KURIKULUM -->
        <g id="header-sertifikat">
          <!-- Pita Badge Kurikulum Merdeka -->
          <rect x="394" y="62" width="400" height="28" rx="14" fill="#0F3D2E" />
          <text class="cert-sans" x="594" y="81" text-anchor="middle" font-size="11.5" font-weight="800" fill="#FFF6E0" letter-spacing="2">
            KUPAS KUIS IPAS &bull; KURIKULUM MERDEKA KELAS V SD
          </text>
        </g>

        <!-- 7. JUDUL DOKUMEN: SERTIFIKAT PENCAPAIAN -->
        <g id="judul-sertifikat">
          <text class="cert-serif" x="594" y="142" text-anchor="middle" font-size="38" font-weight="900" fill="#0F3D2E" letter-spacing="4">
            SERTIFIKAT PENCAPAIAN
          </text>
          
          <!-- Sub-pita Gelar Prestasi -->
          <text class="cert-sans" x="594" y="174" text-anchor="middle" font-size="16" font-weight="900" fill="#B45309" letter-spacing="3">
            🌿 PENYELAMAT EKOSISTEM NUSANTARA 🌿
          </text>

          <!-- Garis Pemisah Emas Berornamen -->
          <rect x="294" y="188" width="600" height="2" fill="url(#grad-aksen-emas)" />
          <polygon points="594,184 599,189 594,194 589,189" fill="#D97706" />
        </g>

        <!-- 8. KALIMAT PENGHARGAAN -->
        <text class="cert-sans" x="594" y="234" text-anchor="middle" font-size="15" font-weight="600" fill="#64748B" letter-spacing="0.5">
          Sertifikat penghargaan resmi ini dengan bangga dianugerahkan kepada:
        </text>

        <!-- 9. NAMA PENERIMA / SISWA (Paling Menonjol) -->
        <g id="nama-siswa-group">
          <text class="cert-serif" id="cert-svg-nama" x="594" y="${gayaNama.y}" text-anchor="middle"
            font-size="${gayaNama.fontSize}" font-weight="900" fill="#0F3D2E" letter-spacing="${gayaNama.letterSpacing}">
            ${namaSiswa}
          </text>

          <!-- Garis Dekoratif Bawah Nama -->
          <path d="M 374,320 L 554,320 M 634,320 L 814,320" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="584" cy="320" r="3" fill="#D97706" />
          <circle cx="594" cy="320" r="4.5" fill="#16A34A" />
          <circle cx="604" cy="320" r="3" fill="#D97706" />
        </g>

        <!-- 10. DESKRIPSI PENCAPAIAN MATERI & KELAS -->
        <g id="deskripsi-pencapaian">
          <text class="cert-sans" x="594" y="362" text-anchor="middle" font-size="15" font-weight="600" fill="#475569">
            Siswa <tspan font-weight="800" fill="#0F3D2E">${kelasSiswa}</tspan> atas keberhasilan luar biasa dan penguasaan materi:
          </text>

          <text class="cert-serif" x="594" y="400" text-anchor="middle" font-size="24" font-weight="800" fill="#0F3D2E" font-style="italic">
            "${topikKuis}"
          </text>
        </g>

        <!-- 11. BARIS PILL / LENCANA CAPAIAN NILAI & GAMIFIKASI -->
        <g id="lencana-capaian" transform="translate(374, 428)">
          <!-- Pill Nilai Ujian -->
          <rect x="0" y="0" width="210" height="38" rx="19" fill="#FEF3C7" stroke="#D97706" stroke-width="1.8" />
          <text class="cert-sans" x="105" y="24" text-anchor="middle" font-size="13" font-weight="800" fill="#92400E">
            ★ Nilai: ${nilai} / 100 (Tuntas KKM)
          </text>

          <!-- Pill Level & XP Gamifikasi -->
          <rect x="230" y="0" width="210" height="38" rx="19" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.8" />
          <text class="cert-sans" x="335" y="24" text-anchor="middle" font-size="13" font-weight="800" fill="#14532D">
            ⚡ Level ${this.infoGamifikasi.level} • ${this.infoGamifikasi.xp} Total XP
          </text>
        </g>

        <!-- 12. SEGEL MEDALI EMAS SVG (Gold / Silver Seal) -->
        <g id="segel-medali" transform="translate(594, 620)">
          <!-- Pita Medali Menjuntai ke Bawah -->
          <path d="M -18,15 L -36,82 L -18,72 L 0,82 L -8,15 Z" fill="${pitaFill}" stroke="#78350F" stroke-width="1.2" />
          <path d="M 18,15 L 36,82 L 18,72 L 0,82 L 8,15 Z" fill="${pitaFill}" stroke="#78350F" stroke-width="1.2" />

          <!-- Gerigi Medali 24-Titik Scalloped -->
          <circle cx="0" cy="0" r="46" fill="url(#${gradMedaliId})" stroke="#78350F" stroke-width="2" />
          <circle cx="0" cy="0" r="39" fill="none" stroke="#FFFDF7" stroke-width="1.5" stroke-dasharray="3, 2" />
          <circle cx="0" cy="0" r="34" fill="#0F3D2E" />

          <!-- Ikon Bintang & Teks Predikat di Dalam Medali -->
          <polygon points="0,-18 5,-6 18,-6 8,2 12,14 0,7 -12,14 -8,2 -18,-6 -5,-6" fill="#FDE68A" stroke="#F59E0B" stroke-width="1" />
          <text class="cert-sans" x="0" y="19" text-anchor="middle" font-size="8.5" font-weight="900" fill="#FEF08A" letter-spacing="1">
            ${isEmas ? 'EMAS' : (isPerak ? 'PERAK' : 'PERUNGGU')}
          </text>
          <text class="cert-sans" x="0" y="27" text-anchor="middle" font-size="6.5" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">
            RESMI IPAS
          </text>
        </g>

        <!-- 13. DUA KOLOM TANDA TANGAN & PENGESAHAN -->
        <!-- Kolom Kiri: Guru Pembimbing IPAS -->
        <g id="ttd-guru" transform="translate(220, 570)">
          <text class="cert-sans" x="0" y="0" text-anchor="middle" font-size="13" font-weight="600" fill="#64748B">
            Guru Pembimbing IPAS,
          </text>
          
          <!-- Garis Tanda Tangan -->
          <line x1="-100" y1="68" x2="100" y2="68" stroke="#0F3D2E" stroke-width="1.5" />
          
          <text class="cert-sans" x="0" y="88" text-anchor="middle" font-size="14.5" font-weight="800" fill="#0F3D2E">
            ${namaGuru}
          </text>
          <text class="cert-sans" x="0" y="104" text-anchor="middle" font-size="11.5" font-weight="600" fill="#64748B">
            SD Negeri Merdeka 01
          </text>
        </g>

        <!-- Kolom Kanan: Penyelenggara / Sekolah -->
        <g id="ttd-sekolah" transform="translate(968, 570)">
          <text class="cert-sans" x="0" y="0" text-anchor="middle" font-size="13" font-weight="600" fill="#64748B">
            Penyelenggara / Sekolah,
          </text>

          <!-- Stempel Resmi Bundar Vektor -->
          <g transform="translate(0, 36) scale(0.65)" opacity="0.85">
            <circle cx="0" cy="0" r="42" fill="none" stroke="#0F3D2E" stroke-width="3" stroke-dasharray="6, 3" />
            <circle cx="0" cy="0" r="35" fill="none" stroke="#D97706" stroke-width="1.8" />
            <text class="cert-sans" x="0" y="-8" text-anchor="middle" font-size="9" font-weight="900" fill="#0F3D2E" letter-spacing="1">
              KUPAS IPAS
            </text>
            <text class="cert-sans" x="0" y="4" text-anchor="middle" font-size="7.5" font-weight="800" fill="#D97706" letter-spacing="0.5">
              TERVALIDASI
            </text>
            <text class="cert-sans" x="0" y="15" text-anchor="middle" font-size="7" font-weight="700" fill="#0F3D2E">
              ${tanggalObj.getFullYear()}
            </text>
          </g>

          <!-- Garis Tanda Tangan -->
          <line x1="-100" y1="68" x2="100" y2="68" stroke="#0F3D2E" stroke-width="1.5" />

          <text class="cert-sans" x="0" y="88" text-anchor="middle" font-size="14.5" font-weight="800" fill="#0F3D2E">
            Kepala Sekolah / Penyelenggara
          </text>
          <text class="cert-sans" x="0" y="104" text-anchor="middle" font-size="11.5" font-weight="600" fill="#64748B">
            Kurikulum Merdeka Indonesia
          </text>
        </g>

        <!-- 14. BARIS METADATA: NOMOR, TANGGAL & VALIDASI SISTEM -->
        <g id="footer-metadata" transform="translate(70, 776)">
          <!-- Kiri: Nomor Sertifikat & Tanggal -->
          <text class="cert-mono" x="0" y="0" font-size="11.5" font-weight="700" fill="#475569">
            No. Sertifikat: <tspan font-weight="900" fill="#0F3D2E">${nomorCert}</tspan>
          </text>
          <text class="cert-sans" x="0" y="18" font-size="11" font-weight="600" fill="#64748B">
            Diterbitkan: ${tanggalFormat}
          </text>

          <!-- Kanan: Status Verifikasi & Security Code -->
          <text class="cert-sans" x="1048" y="0" text-anchor="end" font-size="11" font-weight="800" fill="#15803D">
            ✔ Terverifikasi Sah di Database KUPAS IPAS v4.0
          </text>
          <text class="cert-mono" x="1048" y="18" text-anchor="end" font-size="9.5" font-weight="600" fill="#94A3B8">
            VERIF-ID: ${nomorCert.replace(/[^A-Za-z0-9]/g, '')}-${nilai}EKO
          </text>
        </g>

      </svg>
    `;
  }

  /**
   * Menampilkan sertifikat yang dipilih ke dalam showcase pratinjau utama
   */
  pilihSertifikat(cert, putarSuara = true) {
    this.sertifikatAktif = cert;

    if (this.wadahA4) {
      this.wadahA4.innerHTML = this.buatSertifikatSVG(cert);
    }

    if (this.elJudulShowcase) {
      this.elJudulShowcase.textContent = cert.nama_kuis_topik || 'Sertifikat Prestasi Belajar';
    }

    if (this.elSubjudulShowcase) {
      this.elSubjudulShowcase.textContent = `Penerima: ${cert.nama_siswa || this.namaSiswa} • Kelas ${cert.kelas || 'Kelas V-A'}`;
    }

    if (this.elBadgeStatus) {
      const nilai = Number(cert.nilai) || 100;
      const isEmas = nilai >= 90;
      this.elBadgeStatus.innerHTML = `
        <span class="badge ${isEmas ? 'bg-warning text-dark' : 'bg-success text-white'} border border-dark rounded-pill px-3 py-1 fw-bold">
          ${isEmas ? '🏆 Predikat Emas' : '⭐ Predikat Perak'} (Nilai: ${nilai})
        </span>
      `;
    }

    // Perbarui status aktif pada galeri kartu jika ada
    if (this.wadahGrid) {
      this.wadahGrid.querySelectorAll('.kartu-galeri-sertifikat').forEach(card => {
        const id = card.getAttribute('data-cert-id');
        if (id === cert.id) {
          card.classList.add('aktif');
        } else {
          card.classList.remove('aktif');
        }
      });
    }

    if (putarSuara) {
      suara.mainkan('selesai');
      cetusKonfeti();
      umumkanAria(`Menampilkan sertifikat ${cert.nama_kuis_topik} atas nama ${cert.nama_siswa || this.namaSiswa}`);
    }
  }

  /**
   * Merender daftar galeri sertifikat (terbuka & terkunci)
   */
  renderGaleri() {
    if (!this.wadahGrid) return;

    // Gabungkan master topik dengan sertifikat yang telah diperoleh
    const itemGaleri = KATALOG_SERTIFIKAT_MASTER.map(master => {
      // Cari apakah siswa memiliki sertifikat untuk materi ini
      const certTerkait = this.daftarSertifikat.find(c =>
        c.aktivitas_tipe === master.aktivitas_tipe && c.aktivitas_id === master.aktivitas_id
      );

      return {
        master,
        terbuka: Boolean(certTerkait),
        cert: certTerkait || null
      };
    });

    // Tambahkan sertifikat tambahan di database yang mungkin di luar master
    this.daftarSertifikat.forEach(c => {
      const sudahAda = itemGaleri.some(item => item.cert && item.cert.id === c.id);
      if (!sudahAda) {
        itemGaleri.push({
          master: {
            nama_kuis_topik: c.nama_kuis_topik,
            kategori: 'Penghargaan IPAS',
            syarat_buka: 'Tuntaskan materi dengan nilai minimal 80%.',
            tautan_mulai: 'index.html'
          },
          terbuka: true,
          cert: c
        });
      }
    });

    const totalTerbuka = itemGaleri.filter(i => i.terbuka).length;
    const totalSemua = itemGaleri.length;

    if (this.elInfoStatusGaleri) {
      this.elInfoStatusGaleri.textContent = `Koleksi: ${totalTerbuka} Terbuka dari ${totalSemua} Sertifikat Prestasi. Klik kartu untuk melihat pratinjau.`;
    }

    this.wadahGrid.innerHTML = itemGaleri.map(item => {
      if (item.terbuka) {
        const c = item.cert;
        const isAktif = this.sertifikatAktif && this.sertifikatAktif.id === c.id;
        const tanggalFormat = new Date(c.tanggal_terbit || c.created_at || Date.now()).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        return `
          <div class="col-12 col-md-6 col-lg-3">
            <div class="kartu-galeri-sertifikat p-3 ${isAktif ? 'aktif' : ''}" data-cert-id="${c.id}" role="button" tabindex="0" aria-label="Lihat Sertifikat ${c.nama_kuis_topik}">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-success-subtle text-success border border-success rounded-pill px-2 py-1 small fw-bold">
                  🏆 Terbuka
                </span>
                <span class="badge bg-warning text-dark border border-dark rounded-pill px-2 py-1 small fw-bold">
                  Nilai: ${c.nilai}
                </span>
              </div>

              <div class="text-center p-2 rounded-2 my-2 border border-2 border-dark" style="background: #FFFDF7;">
                <span class="fs-2 d-block mb-1" aria-hidden="true">📜</span>
                <h3 class="h6 fw-bolder text-dark mb-1 text-truncate" title="${c.nama_kuis_topik}">
                  ${c.nama_kuis_topik}
                </h3>
                <div class="small text-secondary font-monospace" style="font-size: 0.72rem;">
                  ${c.nomor_sertifikat}
                </div>
              </div>

              <div class="small text-secondary mb-3 mt-auto">
                📅 Terbit: <strong>${tanggalFormat}</strong>
              </div>

              <button type="button" class="btn btn-kupas-hijau btn-sm w-100 fw-bold smartboard-btn btn-pilih-sertif" data-id="${c.id}">
                👁️ Tampilkan di Atas
              </button>
            </div>
          </div>
        `;
      } else {
        const m = item.master;
        return `
          <div class="col-12 col-md-6 col-lg-3">
            <div class="kartu-galeri-sertifikat terkunci p-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-secondary text-white rounded-pill px-2 py-1 small fw-bold">
                  🔒 Terkunci
                </span>
                <span class="badge bg-light text-secondary border rounded-pill px-2 py-1 small fw-bold">
                  Target: 80%
                </span>
              </div>

              <div class="text-center p-2 rounded-2 my-2 border border-secondary" style="background: #E2E8F0;">
                <span class="fs-2 d-block mb-1 opacity-50" aria-hidden="true">🔒</span>
                <h3 class="h6 fw-bolder text-secondary mb-1 text-truncate" title="${m.nama_kuis_topik}">
                  ${m.nama_kuis_topik}
                </h3>
                <div class="small text-muted" style="font-size: 0.72rem;">
                  ${m.kategori}
                </div>
              </div>

              <p class="small text-secondary mb-3 mt-auto" style="font-size: 0.78rem;">
                ${m.syarat_buka}
              </p>

              <a href="${m.tautan_mulai}" class="btn btn-outline-secondary btn-sm w-100 fw-bold smartboard-btn">
                🎯 Kerjakan Aktivitas
              </a>
            </div>
          </div>
        `;
      }
    }).join('');

    // Pasang listener klik pada kartu terbuka
    this.wadahGrid.querySelectorAll('.kartu-galeri-sertifikat:not(.terkunci)').forEach(card => {
      card.addEventListener('click', (e) => {
        const id = card.getAttribute('data-cert-id');
        const c = this.daftarSertifikat.find(x => x.id === id);
        if (c) {
          this.pilihSertifikat(c, true);
          // Scroll halus ke pratinjau di layar mobile
          this.wadahA4.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });
    });
  }

  /**
   * Menghasilkan Unduhan Gambar PNG Resolusi Tinggi (Native Canvas Browser API)
   * Mengkonversi elemen SVG ke Canvas tanpa pustaka eksternal.
   */
  async unduhPNG() {
    if (!this.sertifikatAktif) return;
    suara.mainkan('klik');

    const svgElement = document.getElementById('svg-sertifikat-render');
    if (!svgElement) {
      alert('Elemen sertifikat belum siap.');
      return;
    }

    try {
      // 1. Ambil representasi string SVG
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);

      // Pastikan atribut xmlns terpasang
      if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // 2. Buat Blob SVG dan Image objek
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        // Buat kanvas dengan resolusi 2x A4 (2376 x 1680) agar hasil cetak/tampil sangat tajam
        const canvas = document.createElement('canvas');
        canvas.width = 2376;
        canvas.height = 1680;
        const ctx = canvas.getContext('2d');

        // Isi latar putih bersih
        ctx.fillStyle = '#FFFDF7';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Gambar SVG ke kanvas
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(blobURL);

        // Unduh sebagai PNG
        const link = document.createElement('a');
        const namaFile = (this.sertifikatAktif.nama_siswa || 'Siswa').replace(/\s+/g, '_');
        link.download = `Sertifikat_Pencapaian_IPAS_${namaFile}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        suara.mainkan('benar');
        cetusKonfeti();
        umumkanAria('Sertifikat berhasil diunduh dalam format gambar PNG resolusi tinggi.');
      };

      image.onerror = (err) => {
        console.error('Gagal merender gambar sertifikat:', err);
        URL.revokeObjectURL(blobURL);
        alert('Gagal membuat berkas PNG. Silakan coba fitur Cetak ke PDF.');
      };

      image.src = blobURL;
    } catch (e) {
      console.error('Error proses unduh PNG:', e);
      alert('Terjadi kendala saat menyiapkan unduhan gambar.');
    }
  }

  /**
   * Menjalankan Cetak Browser (CSS @media print menangani orientasi A4 Lanskap)
   */
  cetakSertifikat() {
    suara.mainkan('klik');
    umumkanAria('Membuka dialog cetak sertifikat.');
    window.print();
  }
}

// Inisialisasi Aplikasi Sertifikat saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const app = new PengelolaSertifikat();
  app.init();
  if (typeof window !== 'undefined') {
    window.pengelolaSertifikat = app;
  }
});
