/**
 * KUPAS KUIS IPAS v4.0 - Pengelola Sertifikat "Penyelamat Ekosistem" (sertifikat.js)
 * Mematuhi spesifikasi Fitur 3:
 * - Mengambil sertifikat siswa dari tabel Supabase `certificates`.
 * - Menampilkan pratinjau sertifikat di halaman web (layar penuh dengan animasi confetti).
 * - Menghasilkan unduhan PDF A4 landscape rapi dan siap cetak menggunakan jsPDF CDN.
 * - Halaman galeri "Sertifikat Saya" dengan filter dan rincian lengkap.
 */

import { supabase } from './supabase.js';
import { pasangHeader, suara, cetusKonfeti, umumkanAria, renderSkeletonMaskot, renderEmptyStateRamah } from './ui.js';
import { animasi } from './animasi.js';

class PengelolaSertifikat {
  constructor() {
    this.daftarSertifikat = [];
    this.sertifikatAktif = null;
    this.namaSiswa = localStorage.getItem('kupas_nama_siswa') || 'Siswa Hebat';

    // Elemen DOM
    this.wadahGrid = document.getElementById('wadah-daftar-sertifikat');
    this.modalEl = document.getElementById('modal-pratinjau-sertifikat');
    this.modalBS = null;
    this.btnUnduhPdfModal = document.getElementById('btn-unduh-pdf-modal');
  }

  async init() {
    pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

    if (this.modalEl && window.bootstrap) {
      this.modalBS = new window.bootstrap.Modal(this.modalEl);
    }

    if (this.btnUnduhPdfModal) {
      this.btnUnduhPdfModal.addEventListener('click', () => {
        if (this.sertifikatAktif) {
          this.unduhPDF(this.sertifikatAktif);
        }
      });
    }

    await this.muatSertifikat();
  }

  async muatSertifikat() {
    if (this.wadahGrid) {
      this.wadahGrid.innerHTML = renderSkeletonMaskot('', 'Memuat sertifikat prestasi...');
    }

    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('tanggal_terbit', { ascending: false });

      if (error || !data || data.length === 0) {
        if (this.wadahGrid) {
          this.wadahGrid.innerHTML = `
            <div class="col-12 text-center py-5 anim-pop">
              <img src="assets/svg/maskot-sedih-menyemangati.svg" alt="Maskot menyemangati" width="110" height="110" class="anim-melambai mb-3">
              <h3 class="h4 fw-bolder text-dark mb-1">Belum Ada Sertifikat yang Terbuka</h3>
              <p class="text-secondary small mb-4 mx-auto" style="max-width: 480px;">
                Dapatkan nilai minimal <strong>80%</strong> pada kuis atau aktivitas Fakta/Opini dan Susun Rantai Makanan untuk membuka sertifikat resmi <em>"Penyelamat Ekosistem"</em>!
              </p>
              <div class="d-flex justify-content-center gap-2 flex-wrap">
                <a href="fakta-opini.html" class="btn btn-kupas-hijau fw-bold smartboard-btn">
                  🎯 Mainkan Fakta vs Opini
                </a>
                <a href="rantai-makanan.html" class="btn btn-kupas-kuning fw-bold smartboard-btn">
                  🌿 Susun Rantai Makanan
                </a>
                <a href="gabung.html" class="btn btn-kupas-putih fw-bold smartboard-btn">
                  🎒 Gabung Sesi Kuis
                </a>
              </div>
            </div>
          `;
        }
        return;
      }

      this.daftarSertifikat = data;
      this.renderGaleri();
    } catch (e) {
      console.error('Gagal memuat sertifikat:', e);
    }
  }

  renderGaleri() {
    if (!this.wadahGrid) return;

    this.wadahGrid.innerHTML = this.daftarSertifikat.map((cert, idx) => {
      const tanggalFormat = new Date(cert.tanggal_terbit || cert.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      return `
        <div class="col-12 col-md-6 col-lg-4 anim-pop anim-stagger-${(idx % 4) + 1}">
          <div class="kupas-card p-3 bg-white h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
            <!-- Pita Lencana Ekosistem -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-success-subtle text-success border border-success rounded-pill px-2 py-1 small fw-bold">
                🏆 Penyelamat Ekosistem
              </span>
              <span class="badge bg-warning text-dark border border-dark rounded-pill px-2 py-1 small fw-bold">
                Nilai: ${cert.nilai}
              </span>
            </div>

            <!-- Pratinjau Bingkai Miniatur Sertifikat -->
            <div class="p-3 my-2 rounded-3 border-2 border-dark text-center position-relative" style="background: linear-gradient(135deg, #F0FDF4 0%, #FEFCE8 100%);">
              <span class="fs-1 d-block mb-1" aria-hidden="true">📜</span>
              <h3 class="h6 fw-bolder text-dark mb-1 text-truncate" title="${cert.nama_kuis_topik}">
                ${cert.nama_kuis_topik}
              </h3>
              <p class="small text-secondary mb-1">
                Diberikan kepada: <strong class="text-dark">${cert.nama_siswa}</strong>
              </p>
              <div class="small fw-semibold text-muted font-monospace" style="font-size: 0.75rem;">
                No: ${cert.nomor_sertifikat}
              </div>
            </div>

            <div class="small text-secondary mb-3">
              📅 Diterbitkan: <strong>${tanggalFormat}</strong>
            </div>

            <!-- Tombol Aksi -->
            <div class="d-flex gap-2 mt-auto">
              <button type="button" class="btn btn-kupas-hijau btn-sm flex-fill fw-bold smartboard-btn btn-lihat-sertif" data-id="${cert.id}">
                👁️ Pratinjau
              </button>
              <button type="button" class="btn btn-outline-dark btn-sm flex-fill fw-bold smartboard-btn btn-unduh-sertif" data-id="${cert.id}">
                📥 Unduh PDF
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Listener tombol pratinjau & unduh
    this.wadahGrid.querySelectorAll('.btn-lihat-sertif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const cert = this.daftarSertifikat.find(c => c.id === id);
        if (cert) this.bukaPratinjau(cert);
      });
    });

    this.wadahGrid.querySelectorAll('.btn-unduh-sertif').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        const cert = this.daftarSertifikat.find(c => c.id === id);
        if (cert) this.unduhPDF(cert);
      });
    });
  }

  bukaPratinjau(cert) {
    this.sertifikatAktif = cert;
    const tanggalFormat = new Date(cert.tanggal_terbit || cert.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Pasang data ke modal pratinjau
    const elNama = document.getElementById('modal-cert-nama');
    const elTopik = document.getElementById('modal-cert-topik');
    const elNilai = document.getElementById('modal-cert-nilai');
    const elNo = document.getElementById('modal-cert-nomor');
    const elTgl = document.getElementById('modal-cert-tanggal');
    const elGuru = document.getElementById('modal-cert-guru');

    if (elNama) elNama.textContent = cert.nama_siswa;
    if (elTopik) elTopik.textContent = cert.nama_kuis_topik;
    if (elNilai) elNilai.textContent = `${cert.nilai} / 100`;
    if (elNo) elNo.textContent = cert.nomor_sertifikat;
    if (elTgl) elTgl.textContent = tanggalFormat;
    if (elGuru) elGuru.textContent = cert.nama_guru || 'Ibu Guru IPAS';

    // Bunyi & Konfeti
    suara.mainkan('selesai');
    cetusKonfeti();

    if (this.modalBS) {
      this.modalBS.show();
    }
    umumkanAria(`Membuka sertifikat ${cert.nama_kuis_topik} atas nama ${cert.nama_siswa}.`);
  }

  unduhPDF(cert) {
    suara.mainkan('klik');

    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('Pustaka jsPDF sedang dimuat. Mohon tunggu beberapa detik.');
      return;
    }

    const { jsPDF } = window.jspdf;
    // Format A4 Landscape: 297mm x 210mm
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const tanggalFormat = new Date(cert.tanggal_terbit || cert.created_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // 1. Bingkai Ganda Berornamen Elegan & Ceria
    // Bingkai Luar (Hijau Alam Pekat)
    doc.setDrawColor(22, 101, 52);
    doc.setLineWidth(2.5);
    doc.rect(10, 10, 277, 190);

    // Bingkai Dalam (Emas Prestasi)
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1.2);
    doc.rect(14, 14, 269, 182);

    // Ornamen Sudut Vektor
    doc.setFillColor(22, 101, 52);
    doc.circle(14, 14, 3, 'F');
    doc.circle(283, 14, 3, 'F');
    doc.circle(14, 196, 3, 'F');
    doc.circle(283, 196, 3, 'F');

    // 2. Header Sertifikat
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(22, 101, 52);
    doc.text('KUPAS KUIS IPAS • KURIKULUM MERDEKA KELAS V SD', 148.5, 30, { align: 'center' });

    doc.setFontSize(28);
    doc.setTextColor(15, 23, 42);
    doc.text('SERTIFIKAT PENGHARGAAN', 148.5, 44, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(217, 119, 6);
    doc.text('🌿 PENYELAMAT EKOSISTEM 🌿', 148.5, 54, { align: 'center' });

    // Garis Aksen Emas
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(95, 58, 202, 58);

    // 3. Penerima Penghargaan
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139);
    doc.text('Sertifikat ini dengan bangga diberikan kepada:', 148.5, 72, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(22, 101, 52);
    doc.text(cert.nama_siswa, 148.5, 87, { align: 'center' });

    // Garis Bawah Nama
    doc.setDrawColor(22, 163, 74);
    doc.setLineWidth(1);
    doc.line(75, 92, 222, 92);

    // 4. Deskripsi Prestasi & Capaian
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(51, 65, 85);
    doc.text(`Siswa ${cert.kelas || 'Kelas V-A'} atas pemahaman istimewa dalam menyelesaikan topik:`, 148.5, 105, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`"${cert.nama_kuis_topik}"`, 148.5, 116, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.text(`Capaian Nilai: ${cert.nilai} / 100 (Status: TUNTAS KKM)`, 148.5, 128, { align: 'center' });

    // 5. Bagian Bawah: Nomor Registrasi & Tanda Tangan Guru
    // Kiri: Registrasi & Verifikasi
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`No. Sertifikat : ${cert.nomor_sertifikat}`, 25, 160);
    doc.text(`Diterbitkan     : ${tanggalFormat}`, 25, 167);
    doc.text(`Verifikasi       : Sah di Sistem KUPAS IPAS v4.0`, 25, 174);

    // Kanan: Tanda Tangan Guru Pembimbing
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    doc.text('Guru Pembimbing IPAS,', 225, 150, { align: 'center' });

    // Garis Tanda Tangan
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.6);
    doc.line(195, 176, 255, 176);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(cert.nama_guru || 'Ibu Guru IPAS', 225, 182, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('SD Negeri Merdeka 01', 225, 188, { align: 'center' });

    // Unduh berkas
    const namaBersih = (cert.nama_siswa || 'Siswa').replace(/\s+/g, '_');
    doc.save(`Sertifikat_Penyelamat_Ekosistem_${namaBersih}.pdf`);
    umumkanAria(`Sertifikat ${cert.nomor_sertifikat} berhasil diunduh dalam format PDF.`);
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const app = new PengelolaSertifikat();
  app.init();
});

