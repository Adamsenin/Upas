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

  // 4. Interaktivitas Sistem Pin Peta Pulau, Popover & Chip Navigasi (Tahap 3)
  const pinButtons = document.querySelectorAll('.pin-lokasi');
  const chipLinks = document.querySelectorAll('.peta-chip');
  const popovers = document.querySelectorAll('.popover-lokasi');
  let popoverAktifId = null;
  let timerHover = null;

  function tutupSemuaPopover() {
    popovers.forEach((p) => {
      p.setAttribute('hidden', '');
    });
    pinButtons.forEach((pin) => {
      pin.setAttribute('aria-expanded', 'false');
      pin.classList.remove('pin--aktif');
      const item = pin.closest('.lokasi-item');
      if (item) item.classList.remove('lokasi-item--aktif');
    });
    chipLinks.forEach((chip) => chip.classList.remove('chip--aktif'));
    popoverAktifId = null;

    if (balonMaskot) {
      balonMaskot.textContent = ekspresiList[idxEkspresi].pesan;
    }
  }

  function bukaPopover(lokasiNomor, opsi = { fokusAksi: false, bersuara: true }) {
    const pin = document.getElementById(`pin-${lokasiNomor}`);
    const popover = document.getElementById(`popover-${lokasiNomor}`);
    const chip = document.querySelector(`.peta-chip[data-pin="${lokasiNomor}"]`);

    if (!pin || !popover) return;

    // Jika sudah aktif, tidak perlu re-render
    if (popoverAktifId === lokasiNomor) return;

    // Tutup popover lain terlebih dahulu (Hanya satu popover aktif dalam satu waktu)
    tutupSemuaPopover();

    popover.removeAttribute('hidden');
    pin.setAttribute('aria-expanded', 'true');
    pin.classList.add('pin--aktif');
    const item = pin.closest('.lokasi-item');
    if (item) item.classList.add('lokasi-item--aktif');

    if (chip) chip.classList.add('chip--aktif');
    popoverAktifId = lokasiNomor;

    const pesanLokasi = pin.dataset.pesan;
    if (balonMaskot && pesanLokasi) {
      balonMaskot.textContent = pesanLokasi;
    }

    if (opsi.bersuara) {
      suara.mainkan('klik');
    }

    const judul = popover.querySelector('.popover-judul')?.textContent || '';
    umumkanAria(`Lokasi terbuka: ${judul}.`);

    if (opsi.fokusAksi) {
      const btnAksi = popover.querySelector('.popover-aksi');
      if (btnAksi) btnAksi.focus();
    }
  }

  // Pasang Event Listener pada Setiap Pin
  pinButtons.forEach((pin) => {
    const no = pin.dataset.lokasi;

    // Klik / Ketuk Pin (Smartboard, Tablet, Ponsel & Desktop)
    pin.addEventListener('click', (e) => {
      e.stopPropagation();
      if (popoverAktifId === no) {
        tutupSemuaPopover();
      } else {
        bukaPopover(no, { fokusAksi: false, bersuara: true });
      }
    });

    // Hover Desktop
    pin.addEventListener('mouseenter', () => {
      clearTimeout(timerHover);
      timerHover = setTimeout(() => {
        bukaPopover(no, { fokusAksi: false, bersuara: false });
      }, 120);
    });

    // Keyboard Focus pada Pin
    pin.addEventListener('focus', () => {
      bukaPopover(no, { fokusAksi: false, bersuara: false });
    });
  });

  // Pasang Handler Tutup pada Setiap Popover
  popovers.forEach((popover) => {
    // Tombol (X) Tutup Popover
    const btnTutup = popover.querySelector('.popover-tutup');
    if (btnTutup) {
      btnTutup.addEventListener('click', (e) => {
        e.stopPropagation();
        const lokasiNo = popover.id.replace('popover-', '');
        tutupSemuaPopover();
        const pin = document.getElementById(`pin-${lokasiNo}`);
        if (pin) pin.focus();
      });
    }

    // Cegah klik di dalam popover menutup popover
    popover.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Batalkan timer tutup jika kursor masuk ke popover
    popover.addEventListener('mouseenter', () => {
      clearTimeout(timerHover);
    });
  });

  // Pasang Event Listener pada Chip Navigasi Cepat
  chipLinks.forEach((chip) => {
    const no = chip.dataset.pin;

    chip.addEventListener('mouseenter', () => {
      clearTimeout(timerHover);
      timerHover = setTimeout(() => {
        bukaPopover(no, { fokusAksi: false, bersuara: false });
      }, 120);
    });

    chip.addEventListener('focus', () => {
      bukaPopover(no, { fokusAksi: false, bersuara: false });
    });
  });

  // Mouse leave peta secara keseluruhan menutup popover
  const wadahPeta = document.querySelector('.peta-pulau');
  if (wadahPeta) {
    wadahPeta.addEventListener('mouseleave', () => {
      clearTimeout(timerHover);
      timerHover = setTimeout(() => {
        tutupSemuaPopover();
      }, 350);
    });
  }

  // Keyboard Escape: Tutup Popover Aktif & Kembalikan Fokus ke Pin Terkait
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      const pinTerkait = popoverAktifId ? document.getElementById(`pin-${popoverAktifId}`) : null;
      tutupSemuaPopover();
      if (pinTerkait) pinTerkait.focus();
    }
  });

  // Klik di Luar: Tutup Popover
  document.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.lokasi-item') && !e.target.closest('.peta-chip')) {
      tutupSemuaPopover();
    }
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
