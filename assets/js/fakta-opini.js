/**
 * KUPAS KUIS IPAS v4.0 - Logika Permainan Fakta atau Opini (fakta-opini.js)
 * Mematuhi spesifikasi Fitur 1:
 * - Drag & drop menggunakan Pointer Events (mouse, touch screen, pena smartboard).
 * - touch-action: none untuk mencegah scroll tak sengaja di HP.
 * - Alternatif keyboard penuh (tombol 1 untuk Fakta, 2 untuk Opini, panah) & aria-live.
 * - Umpan balik langsung per kartu dengan animasi 60fps (transform & opacity) dan maskot ekspresif.
 * - Akhir ronde: skor, ulasan kesalahan, penyimpanan ke activity_results & certificates jika >= 80.
 */

import { supabase } from './supabase.js';
import { animasi, TingkatGerak } from './animasi.js';
import { pasangHeader, suara, gamifikasi, cetusKonfeti, umumkanAria, renderSkeletonMaskot, renderEmptyStateRamah } from './ui.js';

class GameFaktaOpini {
  constructor() {
    this.daftarSoal = [];
    this.indeksSoal = 0;
    this.riwayatJawaban = [];
    this.skor = 0;
    this.benarCount = 0;
    this.sedangAnimasi = false;
    this.waktuMulaiRonde = Date.now();
    this.namaSiswa = localStorage.getItem('kupas_nama_siswa') || 'Siswa Hebat';

    // Elemen DOM
    this.wadahUtama = document.getElementById('wadah-game-fakta-opini');
    this.wadahHasil = document.getElementById('wadah-hasil-ronde');
    this.kartuAktif = null;
    this.zonaFakta = document.getElementById('zona-fakta');
    this.zonaOpini = document.getElementById('zona-opini');
    this.maskotEl = document.getElementById('maskot-reaksi');
    this.balonTeksEl = document.getElementById('balon-ucapan-teks');
    this.progresTeks = document.getElementById('progres-soal-teks');
    this.progresBar = document.getElementById('progres-soal-bar');
    this.skorLiveEl = document.getElementById('skor-live-angka');

    // Pointer state
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.currentDx = 0;
    this.currentDy = 0;
  }

  async init() {
    pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

    // Muat data dari Supabase
    await this.muatDataPernyataan();

    // Event listener keyboard global
    window.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Tombol aksi cepat
    const btnFakta = document.getElementById('btn-pilih-fakta');
    const btnOpini = document.getElementById('btn-pilih-opini');
    if (btnFakta) {
      btnFakta.addEventListener('click', () => this.jawab('fakta'));
    }
    if (btnOpini) {
      btnOpini.addEventListener('click', () => this.jawab('opini'));
    }

    // Tombol main lagi di layar hasil
    const btnMainLagi = document.getElementById('btn-main-lagi');
    if (btnMainLagi) {
      btnMainLagi.addEventListener('click', () => this.mulaiRondeBaru());
    }
  }

  async muatDataPernyataan() {
    if (this.wadahUtama) {
      this.wadahUtama.innerHTML = renderSkeletonMaskot('', 'Si Kupas sedang memilih kartu pernyataan seru...');
    }

    try {
      const { data, error } = await supabase.from('fact_opinion_statements').select();
      if (error || !data || data.length === 0) {
        if (this.wadahUtama) {
          this.wadahUtama.innerHTML = renderEmptyStateRamah('', 'Pernyataan Belum Tersedia', 'Guru belum menerbitkan pernyataan fakta atau opini.');
        }
        return;
      }

      // Acak dan ambil 8-10 butir pernyataan untuk 1 ronde menggunakan Fisher-Yates
      const terbit = data.filter(d => d.status === 'terbit');
      const acak = [...terbit];
      for (let i = acak.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [acak[i], acak[j]] = [acak[j], acak[i]];
      }
      const jumlahRonde = Math.min(10, Math.max(8, acak.length));
      this.daftarSoal = acak.slice(0, jumlahRonde);

      this.indeksSoal = 0;
      this.riwayatJawaban = [];
      this.skor = 0;
      this.benarCount = 0;
      this.waktuMulaiRonde = Date.now();

      this.renderSoalAktif();
    } catch (err) {
      console.error('Gagal memuat pernyataan:', err);
    }
  }

  renderSoalAktif() {
    if (this.indeksSoal >= this.daftarSoal.length) {
      this.tampilkanLayarHasil();
      return;
    }

    const soal = this.daftarSoal[this.indeksSoal];
    const total = this.daftarSoal.length;
    const urutan = this.indeksSoal + 1;

    // Perbarui teks progres & bar
    if (this.progresTeks) {
      this.progresTeks.textContent = `Pernyataan ${urutan} dari ${total}`;
    }
    if (this.progresBar) {
      animasi.isiBar(this.progresBar, urutan / total);
    }
    if (this.skorLiveEl) {
      this.skorLiveEl.textContent = this.skor;
    }

    // Reset Maskot ke ekspresi berpikir/semangat
    this.aturMaskot('assets/svg/maskot-semangat.svg', `Pernyataan ke-${urutan}: Apakah ini fakta nyata atau hanya opini?`);

    // Acak posisi kiri/kanan tombol dan drop zone (50% probabilitas bertukar sisi)
    const harusTukarSisi = Math.random() < 0.5;
    this.sisiKiri = harusTukarSisi ? 'opini' : 'fakta';

    const btnFakta = document.getElementById('btn-pilih-fakta');
    const btnOpini = document.getElementById('btn-pilih-opini');
    const wadahTombol = btnFakta ? btnFakta.parentElement : null;

    if (wadahTombol && btnFakta && btnOpini) {
      if (this.sisiKiri === 'opini') {
        wadahTombol.insertBefore(btnOpini, btnFakta);
        const spOpini = btnOpini.querySelector('span');
        if (spOpini) spOpini.textContent = '[ 1 ] Ini OPINI';
        btnOpini.setAttribute('aria-label', 'Pilih Opini (Tombol 1)');

        const spFakta = btnFakta.querySelector('span');
        if (spFakta) spFakta.textContent = '[ 2 ] Ini FAKTA';
        btnFakta.setAttribute('aria-label', 'Pilih Fakta (Tombol 2)');
      } else {
        wadahTombol.insertBefore(btnFakta, btnOpini);
        const spFakta = btnFakta.querySelector('span');
        if (spFakta) spFakta.textContent = '[ 1 ] Ini FAKTA';
        btnFakta.setAttribute('aria-label', 'Pilih Fakta (Tombol 1)');

        const spOpini = btnOpini.querySelector('span');
        if (spOpini) spOpini.textContent = '[ 2 ] Ini OPINI';
        btnOpini.setAttribute('aria-label', 'Pilih Opini (Tombol 2)');
      }
    }

    // Sesuaikan susunan kolom zona drop
    const colFakta = this.zonaFakta ? this.zonaFakta.closest('.col-12') : null;
    const colOpini = this.zonaOpini ? this.zonaOpini.closest('.col-12') : null;
    const rowZona = colFakta ? colFakta.parentElement : null;
    if (rowZona && colFakta && colOpini) {
      if (this.sisiKiri === 'opini') {
        rowZona.insertBefore(colOpini, colFakta);
      } else {
        rowZona.insertBefore(colFakta, colOpini);
      }
    }

    // Render kartu aktif
    if (this.wadahUtama) {
      const warnaKesulitan = soal.tingkat_kesulitan === 'sulit' ? 'danger' : (soal.tingkat_kesulitan === 'sedang' ? 'warning' : 'success');
      this.wadahUtama.innerHTML = `
        <div class="kartu-seret anim-pop" id="kartu-pernyataan-aktif" tabindex="0" role="region" aria-label="Kartu Pernyataan: ${soal.pernyataan}">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-light text-dark border border-dark rounded-pill px-2 py-1 small fw-bold">
              📚 ${soal.topik || 'Ekosistem IPAS'}
            </span>
            <span class="badge bg-${warnaKesulitan} text-white border border-dark rounded-pill px-2 py-1 small text-capitalize fw-bold">
              ${soal.tingkat_kesulitan || 'sedang'}
            </span>
          </div>

          <p class="fs-5 fw-bolder text-dark mb-3 lh-base text-center py-2" id="teks-pernyataan-aktif">
            "${soal.pernyataan}"
          </p>

          <div class="bg-light p-2 rounded-3 text-center border border-2 border-dark-subtle mb-1">
            <small class="text-secondary fw-bold d-block">
              👆 Seret kartu ke zona <strong>FAKTA</strong> atau <strong>OPINI</strong>, atau tekan tombol <strong>[1]</strong> / <strong>[2]</strong>
            </small>
          </div>
        </div>
      `;

      this.kartuAktif = document.getElementById('kartu-pernyataan-aktif');
      this.pasangPointerEvents(this.kartuAktif);
      this.kartuAktif.focus();
      umumkanAria(`Pernyataan baru: ${soal.pernyataan}. Seret ke zona Fakta atau Opini.`);
    }
  }

  pasangPointerEvents(el) {
    if (!el) return;

    el.addEventListener('pointerdown', (e) => {
      if (this.sedangAnimasi) return;
      this.isDragging = true;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.currentDx = 0;
      this.currentDy = 0;
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
    });

    el.addEventListener('pointermove', (e) => {
      if (!this.isDragging || this.sedangAnimasi) return;
      this.currentDx = e.clientX - this.startX;
      this.currentDy = e.clientY - this.startY;

      // Transform 60fps dengan sedikit rotasi alami
      const rotasi = Math.max(-12, Math.min(12, this.currentDx * 0.05));
      el.style.transform = `translate3d(${this.currentDx}px, ${this.currentDy}px, 0) rotate(${rotasi}deg)`;

      // Cek persinggungan zona
      this.cekHoverZona(e.clientX, e.clientY);
    });

    const selesaiSeret = (e) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      el.classList.remove('is-dragging');
      try { el.releasePointerCapture(e.pointerId); } catch (_) {}

      // Bersihkan indikator hover
      if (this.zonaFakta) this.zonaFakta.classList.remove('zona-hover');
      if (this.zonaOpini) this.zonaOpini.classList.remove('zona-hover');

      // Tentukan apakah jatuh di zona Fakta atau Opini
      const zonaTarget = this.deteksiZonaDrop(e.clientX, e.clientY);

      if (zonaTarget) {
        this.jawab(zonaTarget);
      } else {
        // Kembalikan ke posisi awal jika lepas di luar zona
        el.style.transition = 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
        setTimeout(() => {
          if (el) el.style.transition = '';
        }, 300);
      }
    };

    el.addEventListener('pointerup', selesaiSeret);
    el.addEventListener('pointercancel', selesaiSeret);
  }

  cekHoverZona(clientX, clientY) {
    const rectFakta = this.zonaFakta?.getBoundingClientRect();
    const rectOpini = this.zonaOpini?.getBoundingClientRect();

    if (rectFakta && clientX >= rectFakta.left && clientX <= rectFakta.right && clientY >= rectFakta.top && clientY <= rectFakta.bottom) {
      this.zonaFakta.classList.add('zona-hover');
      if (this.zonaOpini) this.zonaOpini.classList.remove('zona-hover');
    } else if (rectOpini && clientX >= rectOpini.left && clientX <= rectOpini.right && clientY >= rectOpini.top && clientY <= rectOpini.bottom) {
      this.zonaOpini.classList.add('zona-hover');
      if (this.zonaFakta) this.zonaFakta.classList.remove('zona-hover');
    } else {
      if (this.zonaFakta) this.zonaFakta.classList.remove('zona-hover');
      if (this.zonaOpini) this.zonaOpini.classList.remove('zona-hover');
    }
  }

  deteksiZonaDrop(clientX, clientY) {
    const rectFakta = this.zonaFakta?.getBoundingClientRect();
    const rectOpini = this.zonaOpini?.getBoundingClientRect();

    if (rectFakta && clientX >= rectFakta.left && clientX <= rectFakta.right && clientY >= rectFakta.top && clientY <= rectFakta.bottom) {
      return 'fakta';
    }
    if (rectOpini && clientX >= rectOpini.left && clientX <= rectOpini.right && clientY >= rectOpini.top && clientY <= rectOpini.bottom) {
      return 'opini';
    }
    return null;
  }

  handleKeyboard(e) {
    if (this.sedangAnimasi || this.indeksSoal >= this.daftarSoal.length) return;

    const pilihanKiri = this.sisiKiri || 'fakta';
    const pilihanKanan = (pilihanKiri === 'fakta') ? 'opini' : 'fakta';

    if (e.key === '1' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.jawab(pilihanKiri);
    } else if (e.key === '2' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.jawab(pilihanKanan);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      this.jawab('fakta');
    } else if (e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      this.jawab('opini');
    }
  }

  async jawab(pilihan) {
    if (this.sedangAnimasi || this.indeksSoal >= this.daftarSoal.length) return;
    this.sedangAnimasi = true;

    const soal = this.daftarSoal[this.indeksSoal];
    const benar = (pilihan === soal.tipe);
    const cardEl = this.kartuAktif;

    this.riwayatJawaban.push({
      soal,
      jawabanSiswa: pilihan,
      benar,
      penjelasan: soal.penjelasan
    });

    if (benar) {
      this.benarCount++;
      const poinDapat = 10;
      this.skor += poinDapat;
      if (this.skorLiveEl) this.skorLiveEl.textContent = this.skor;

      suara.mainkan('benar');
      gamifikasi.catatHasilJawab(true);

      // Maskot melompat gembira
      this.aturMaskot('assets/svg/maskot-senang.svg', `Hebat! Tepat sekali! ${soal.penjelasan}`);
      if (this.maskotEl) animasi.lompat(this.maskotEl);

      // Animasikan kartu menempel ke zona yang dipilih
      if (cardEl) {
        cardEl.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        const geserX = (this.sisiKiri === 'fakta') ? (pilihan === 'fakta' ? -120 : 120) : (pilihan === 'fakta' ? 120 : -120);
        cardEl.style.transform = `translate3d(${geserX}px, 80px, 0) scale(0.85)`;
        cardEl.style.opacity = '0';
      }

      // Tambahkan miniatur kartu di zona tujuan
      this.tempelKartuDiZona(pilihan, soal, true);
      umumkanAria(`Jawaban benar! Pilihanmu ${pilihan.toUpperCase()}. ${soal.penjelasan}`);
    } else {
      suara.mainkan('salah');
      gamifikasi.catatHasilJawab(false);

      // Maskot menyemangati tanpa nada menghakimi
      this.aturMaskot('assets/svg/maskot-sedih-menyemangati.svg', `Hampir tepat! Yuk cermati lagi: ${soal.penjelasan}`);
      if (cardEl) {
        cardEl.style.transition = 'transform 0.3s ease';
        cardEl.style.transform = 'translate3d(0, 0, 0)';
        animasi.goyang(cardEl);
      }
      umumkanAria(`Belum tepat. Jawaban yang benar adalah ${soal.tipe.toUpperCase()}. ${soal.penjelasan}`);
    }

    // Tunggu animasi sebentar lalu lanjut ke pernyataan berikutnya
    setTimeout(() => {
      this.indeksSoal++;
      this.sedangAnimasi = false;
      this.renderSoalAktif();
    }, 1400);
  }

  tempelKartuDiZona(zona, soal, benar) {
    const wadahTumpukan = document.getElementById(zona === 'fakta' ? 'tumpukan-fakta' : 'tumpukan-opini');
    if (!wadahTumpukan) return;

    const el = document.createElement('div');
    el.className = 'badge bg-white text-dark border border-dark rounded-3 p-2 mb-1 w-100 text-truncate text-start anim-pop';
    el.style.fontSize = '0.85rem';
    el.innerHTML = `✓ ${soal.pernyataan}`;
    wadahTumpukan.prepend(el);
  }

  aturMaskot(svgPath, teks) {
    if (this.maskotEl) {
      this.maskotEl.src = svgPath;
    }
    if (this.balonTeksEl) {
      this.balonTeksEl.textContent = teks;
    }
  }

  async tampilkanLayarHasil() {
    if (this.wadahUtama) this.wadahUtama.style.display = 'none';
    if (this.wadahHasil) this.wadahHasil.style.display = 'block';

    const total = this.daftarSoal.length;
    const persentase = Math.round((this.benarCount / total) * 100);
    const durasiDetik = Math.round((Date.now() - this.waktuMulaiRonde) / 1000);
    const dapatSertifikat = persentase >= 80;

    // Simpan ke Supabase activity_results
    try {
      await supabase.from('activity_results').insert({
        aktivitas_tipe: 'fakta_opini',
        aktivitas_id: 'fakta-opini-' + Date.now(),
        nama_siswa: this.namaSiswa,
        kelas: 'Kelas V-A',
        skor: persentase,
        total_soal: total,
        benar: this.benarCount,
        percobaan: 1,
        petunjuk_digunakan: 0,
        durasi_detik: durasiDetik,
        detail_jawaban: this.riwayatJawaban
      });
    } catch (e) {
      console.warn('Gagal menyimpan hasil ke Supabase:', e);
    }

    // Jika tuntas >= 80, otomatis simpan/perbarui ke tabel certificates
    let nomorSertif = null;
    if (dapatSertifikat) {
      try {
        const certRes = await supabase.from('certificates').insert({
          nama_siswa: this.namaSiswa,
          kelas: 'Kelas V-A',
          aktivitas_tipe: 'fakta_opini',
          aktivitas_id: 'topik-fakta-opini',
          nama_kuis_topik: 'Fakta atau Opini Ekosistem IPAS',
          nilai: persentase,
          ambang_batas: 80,
          nama_guru: 'Ibu Guru IPAS'
        }).select().single();
        if (certRes.data) {
          nomorSertif = certRes.data.nomor_sertifikat;
        }
      } catch (e) {
        console.warn('Gagal menerbitkan sertifikat:', e);
      }
    }

    // Efek gembira & musik selesai
    suara.mainkan('selesai');
    if (dapatSertifikat) {
      cetusKonfeti();
      this.aturMaskot('assets/svg/maskot-bersorak.svg', `Luar biasa! Kamu meraih nilai ${persentase}% dan berhak mendapat Sertifikat Penyelamat Ekosistem!`);
    } else {
      this.aturMaskot('assets/svg/maskot-semangat.svg', `Nilaimu ${persentase}%. Teruslah mencoba untuk mencapai nilai 80% agar membuka Sertifikat!`);
    }

    // Pasang angka skor
    const elSkorAkhir = document.getElementById('hasil-skor-akhir');
    const elBenarSalah = document.getElementById('hasil-benar-salah');
    const elBoxSertifikat = document.getElementById('box-pemberitahuan-sertifikat');

    if (elSkorAkhir) animasi.hitungAngka(elSkorAkhir, persentase, 800);
    if (elBenarSalah) elBenarSalah.textContent = `${this.benarCount} Benar / ${total - this.benarCount} Perlu Dicek`;

    if (elBoxSertifikat) {
      if (dapatSertifikat) {
        elBoxSertifikat.innerHTML = `
          <div class="alert alert-success border-2 border-dark d-flex align-items-center gap-3 anim-pop" role="alert">
            <span class="fs-1" aria-hidden="true">🏆</span>
            <div>
              <h4 class="h6 fw-bolder mb-1">Selamat! Kamu Mendapat Sertifikat "Penyelamat Ekosistem"</h4>
              <p class="small mb-2">Nilai ${persentase}% memenuhi ambang batas kelulusan (>= 80%).</p>
              <a href="sertifikat.html" class="btn btn-kupas-hijau btn-sm fw-bold px-3">
                📜 Lihat & Unduh Sertifikat
              </a>
            </div>
          </div>
        `;
      } else {
        elBoxSertifikat.innerHTML = `
          <div class="alert alert-warning border-2 border-dark d-flex align-items-center gap-3 anim-pop" role="alert">
            <span class="fs-1" aria-hidden="true">💡</span>
            <div>
              <h4 class="h6 fw-bolder mb-1">Sedikit Lagi Menuju Sertifikat!</h4>
              <p class="small mb-0">Raih nilai minimal 80% untuk membuka sertifikat digital resmi Penyelamat Ekosistem.</p>
            </div>
          </div>
        `;
      }
    }

    // Render daftar ulasan pernyataan
    const wadahUlasan = document.getElementById('wadah-ulasan-pernyataan');
    if (wadahUlasan) {
      wadahUlasan.innerHTML = this.riwayatJawaban.map((rj, idx) => {
        const bgBadge = rj.benar ? 'bg-success' : 'bg-warning text-dark';
        return `
          <div class="p-3 mb-2 bg-white rounded-3 border border-2 border-dark anim-slide-up">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-1">
              <span class="badge ${bgBadge} border border-dark rounded-pill px-2 py-1 small fw-bold">
                ${rj.benar ? '✓ Benar' : '⚠️ Perlu Dipelajari Lagi'}
              </span>
              <span class="small fw-bolder text-secondary">
                Jawabanmu: <strong>${rj.jawabanSiswa.toUpperCase()}</strong> | Tipe Asli: <strong>${rj.soal.tipe.toUpperCase()}</strong>
              </span>
            </div>
            <p class="fw-bold mb-1 text-dark">"${rj.soal.pernyataan}"</p>
            <p class="small text-secondary mb-0">📖 <strong>Penjelasan:</strong> ${rj.penjelasan}</p>
          </div>
        `;
      }).join('');
    }

    umumkanAria(`Ronde selesai! Skormu ${persentase} persen. ${this.benarCount} dari ${total} pernyataan dijawab dengan tepat.`);
  }

  mulaiRondeBaru() {
    if (this.wadahHasil) this.wadahHasil.style.display = 'none';
    if (this.wadahUtama) this.wadahUtama.style.display = 'block';

    // Bersihkan tumpukan kartu lama di dropzone
    const tf = document.getElementById('tumpukan-fakta');
    const to = document.getElementById('tumpukan-opini');
    if (tf) tf.innerHTML = '';
    if (to) to.innerHTML = '';

    this.muatDataPernyataan();
  }
}

// Inisialisasi Game saat dokumen siap
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameFaktaOpini();
  game.init();
});

