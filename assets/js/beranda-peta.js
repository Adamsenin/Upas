/**
 * KUPAS KUIS IPAS - Interaktivitas Beranda "Pulau Kupas" (beranda-peta.js)
 * Mengelola tab peran, pergerakan maskot di peta, gamifikasi, suara & aksesibilitas.
 */

import { pasangHeader, pasangPanelGamifikasi, suara, umumkanAria, gamifikasi } from './ui.js';
import { animasi, TingkatGerak } from './animasi.js';
import { auth } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Pasang Navigasi Global & Panel Gamifikasi Buku Jejak
  pasangHeader('umum', { berandaLink: 'index.html', rootAset: '' });
  pasangPanelGamifikasi('wadah-gamifikasi-beranda');

  // 2. Tab Pilihan Peran (Aku Siswa / Saya Guru)
  const tabSiswa = document.getElementById('tab-peran-siswa');
  const tabGuru = document.getElementById('tab-peran-guru');
  const panelSiswa = document.getElementById('panel-peran-siswa');
  const panelGuru = document.getElementById('panel-peran-guru');

  function aktifkanTab(tabAktif, tabNonaktif, panelAktif, panelNonaktif) {
    tabAktif.setAttribute('aria-selected', 'true');
    tabAktif.tabIndex = 0;
    tabNonaktif.setAttribute('aria-selected', 'false');
    tabNonaktif.tabIndex = -1;

    panelAktif.removeAttribute('hidden');
    panelNonaktif.setAttribute('hidden', '');
    suara.mainkan('klik');
  }

  if (tabSiswa && tabGuru && panelSiswa && panelGuru) {
    tabSiswa.addEventListener('click', () => {
      aktifkanTab(tabSiswa, tabGuru, panelSiswa, panelGuru);
      umumkanAria('Peran Siswa aktif. Tombol Gabung kuis kelasmu siap.');
    });

    tabGuru.addEventListener('click', () => {
      aktifkanTab(tabGuru, tabSiswa, panelGuru, panelSiswa);
      umumkanAria('Peran Guru aktif. Tombol Buka Ruang Guru siap.');
    });

    // Cegat tombol Buka Ruang Guru: Wajib login guru terlebih dahulu
    const btnGuru = document.getElementById('btn-saya-guru');
    if (btnGuru) {
      btnGuru.addEventListener('click', async (e) => {
        e.preventDefault();
        const guru = await auth.ambilGuruAktif();
        if (guru) {
          window.location.href = 'guru/dasbor.html';
        } else {
          try {
            sessionStorage.setItem('kupas_redirect_tujuan', 'dasbor.html');
          } catch (err) {}
          window.location.href = 'guru/masuk.html';
        }
      });
    }

    // Dukungan Keyboard Panah Kiri/Kanan pada Tablist
    [tabSiswa, tabGuru].forEach((tab) => {
      tab.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          tabGuru.focus();
          tabGuru.click();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          tabSiswa.focus();
          tabSiswa.click();
        }
      });
    });
  }

  // 3. Konfigurasi Pesan & Ekspresi Maskot Si Kupas
  const infoGamifikasi = gamifikasi.ambilInfoLevel();
  let pesanDefault = 'Halo! Ketuk aku, atau pilih tempat di peta.';
  if (infoGamifikasi.streakHarian > 1) {
    pesanDefault = `Streak ${infoGamifikasi.streakHarian} hari aktif! Lanjutkan petualanganmu!`;
  } else if (infoGamifikasi.xp > 0) {
    pesanDefault = `Keren, kamu sudah mengumpulkan ${infoGamifikasi.xp} XP!`;
  }

  const balonMaskot = document.getElementById('balon-sapa-maskot');
  const btnMaskot = document.getElementById('btn-sapa-maskot');
  const imgMaskot = document.getElementById('maskot-utama');
  const wadahMaskotPeta = document.getElementById('maskot-peta');

  if (balonMaskot) {
    balonMaskot.textContent = pesanDefault;
  }

  const ekspresiList = [
    { svg: 'assets/svg/maskot-senang.svg', pesan: pesanDefault },
    { svg: 'assets/svg/maskot-semangat.svg', pesan: 'Ayo kumpulkan XP dan jelajahi seisi pulau!' },
    { svg: 'assets/svg/maskot-berpikir.svg', pesan: 'Tahukah kamu? Rantai makanan menjaga bumi tetap seimbang.' },
    { svg: 'assets/svg/maskot-bersorak.svg', pesan: 'Hebat! Kamu pasti bisa meraih lencana baru hari ini!' },
    { svg: 'assets/svg/maskot-sedih-menyemangati.svg', pesan: 'Jangan takut mencoba, salah itu bagian dari belajar!' }
  ];
  let idxEkspresi = 0;

  if (btnMaskot && imgMaskot && balonMaskot) {
    btnMaskot.addEventListener('click', () => {
      idxEkspresi = (idxEkspresi + 1) % ekspresiList.length;
      const item = ekspresiList[idxEkspresi];
      imgMaskot.src = item.svg;
      balonMaskot.textContent = item.pesan;
      suara.mainkan('klik');
      animasi.lompat(imgMaskot);
      umumkanAria(item.pesan);
    });
  }

  // 4. Interaksi Dinamis Lokasi Peta & Pergerakan Maskot (Desktop)
  const lokasiLinks = document.querySelectorAll('.lokasi');
  const posisiAsalMaskot = { left: '45%', top: '80%' };

  // Pemetaan offset posisi maskot saat mendekati tiap lokasi di peta desktop
  const offsetPeta = {
    'btn-kamus-belajar': { left: '34%', top: '68%' },
    'btn-rantai-makanan': { left: '20%', top: '36%' },
    'btn-siklus-air': { left: '50%', top: '70%' },
    'btn-fakta-opini': { left: '68%', top: '48%' },
    'btn-sertifikat': { left: '52%', top: '22%' },
    'btn-duel-tim': { left: '68%', top: '78%' }
  };

  const isDesktop = () => window.innerWidth >= 1024;
  const isReducedMotion = () => {
    return animasi.getMode() !== TingkatGerak.PENUH ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  lokasiLinks.forEach((link) => {
    const id = link.id;
    const pesanLokasi = link.dataset.pesan;

    function sorotLokasi() {
      if (link.classList.contains('lokasi--aktif')) return;
      link.classList.add('lokasi--aktif');
      if (balonMaskot && pesanLokasi) {
        balonMaskot.textContent = pesanLokasi;
      }
      if (isDesktop() && wadahMaskotPeta && !isReducedMotion() && offsetPeta[id]) {
        wadahMaskotPeta.style.left = offsetPeta[id].left;
        wadahMaskotPeta.style.top = offsetPeta[id].top;
      }
    }

    function lepasLokasi(e) {
      if (e && e.relatedTarget && link.contains(e.relatedTarget)) {
        return;
      }
      link.classList.remove('lokasi--aktif');
      if (balonMaskot) {
        balonMaskot.textContent = ekspresiList[idxEkspresi].pesan;
      }
      if (isDesktop() && wadahMaskotPeta && !isReducedMotion()) {
        wadahMaskotPeta.style.left = posisiAsalMaskot.left;
        wadahMaskotPeta.style.top = posisiAsalMaskot.top;
      }
    }

    link.addEventListener('mouseenter', sorotLokasi);
    link.addEventListener('focus', sorotLokasi);
    link.addEventListener('mouseleave', lepasLokasi);
    link.addEventListener('blur', lepasLokasi);

    link.addEventListener('click', (e) => {
      suara.mainkan('klik');
      if (!isReducedMotion() && imgMaskot) {
        animasi.lompat(imgMaskot);
      }
    });
  });

  // 5. Rangkaian Pembuka Halus (Hanya transform & opacity)
  if (!isReducedMotion()) {
    const pulauEl = document.querySelector('.peta-pulau');
    if (pulauEl) {
      pulauEl.animate([
        { transform: 'translateY(16px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ], {
        duration: 450,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
      });
    }
  }
});
