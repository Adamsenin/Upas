/**
 * KUPAS KUIS IPAS v4.0 - Pengelola Animasi Interaktif 60fps (animasi.js)
 * Mematuhi PRD Bagian 7 & Fase 3:
 * - Aturan Keras: Animasi hanya memakai transform dan opacity.
 * - Tiga mode: Penuh (full), Kurang (reduced), Mati (off).
 * - Dukung prefers-reduced-motion.
 * - Jeda saat tab tidak terlihat (visibilitychange).
 */

const STORAGE_KEY = 'kupas_motion_pref';

export const TingkatGerak = {
  PENUH: 'penuh',
  KURANG: 'kurang',
  MATI: 'mati'
};

class PengelolaAnimasi {
  constructor() {
    this.mode = TingkatGerak.PENUH;
    this.init();
  }

  init() {
    const tersimpan = localStorage.getItem(STORAGE_KEY);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (tersimpan && Object.values(TingkatGerak).includes(tersimpan)) {
      this.mode = tersimpan;
    } else if (prefersReduced) {
      this.mode = TingkatGerak.KURANG;
    } else {
      this.mode = TingkatGerak.PENUH;
    }

    this.terapkanKeBody();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        document.body.classList.add('tab-tersembunyi');
      } else {
        document.body.classList.remove('tab-tersembunyi');
      }
    });

    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.setMode(e.matches ? TingkatGerak.KURANG : TingkatGerak.PENUH);
      }
    });
  }

  setMode(modeBaru) {
    if (!Object.values(TingkatGerak).includes(modeBaru)) return;
    this.mode = modeBaru;
    localStorage.setItem(STORAGE_KEY, modeBaru);
    this.terapkanKeBody();
  }

  getMode() {
    return this.mode;
  }

  terapkanKeBody() {
    document.body.classList.remove('motion-full', 'motion-reduced', 'motion-off');
    if (this.mode === TingkatGerak.PENUH) {
      document.body.classList.add('motion-full');
    } else if (this.mode === TingkatGerak.KURANG) {
      document.body.classList.add('motion-reduced');
    } else {
      document.body.classList.add('motion-off');
    }

    const sel = document.getElementById('select-animasi-global');
    if (sel && sel.value !== this.mode) {
      sel.value = this.mode;
    }
  }

  /**
   * Efek goyang lembut & menyemangati untuk masukan belum tepat / validasi
   * Hanya memakai transform translateX & rotate
   */
  goyang(elemen) {
    if (!elemen || this.mode === TingkatGerak.MATI) return;

    if (this.mode === TingkatGerak.KURANG) {
      elemen.style.outline = '3px solid #D97706';
      setTimeout(() => { elemen.style.outline = ''; }, 600);
      return;
    }

    elemen.animate([
      { transform: 'translateX(0) rotate(0deg)' },
      { transform: 'translateX(-7px) rotate(-1deg)' },
      { transform: 'translateX(7px) rotate(1deg)' },
      { transform: 'translateX(-5px) rotate(-0.5deg)' },
      { transform: 'translateX(5px) rotate(0.5deg)' },
      { transform: 'translateX(0) rotate(0deg)' }
    ], {
      duration: 420,
      easing: 'ease-in-out'
    });
  }

  /**
   * Efek lompat gembira pada maskot saat jawaban benar
   * Hanya memakai transform translateY & scale
   */
  lompat(elemen) {
    if (!elemen || this.mode !== TingkatGerak.PENUH) return;

    elemen.animate([
      { transform: 'translateY(0) scale(1)' },
      { transform: 'translateY(-22px) scale(1.12)', offset: 0.35 },
      { transform: 'translateY(0) scale(0.95)', offset: 0.7 },
      { transform: 'translateY(-8px) scale(1.04)', offset: 0.85 },
      { transform: 'translateY(0) scale(1)' }
    ], {
      duration: 650,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
  }

  /**
   * Efek pop / memantul saat elemen muncul
   * Hanya memakai transform scale dan opacity
   */
  pop(elemen) {
    if (!elemen || this.mode === TingkatGerak.MATI) return;

    if (this.mode === TingkatGerak.KURANG) {
      elemen.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], { duration: 200, easing: 'ease-out' });
      return;
    }

    elemen.animate([
      { transform: 'scale(0.84)', opacity: 0 },
      { transform: 'scale(1.06)', opacity: 1, offset: 0.7 },
      { transform: 'scale(1)', opacity: 1 }
    ], {
      duration: 350,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    });
  }

  /**
   * Mengisi bar progres dengan halus (hanya transform: scaleX)
   */
  isiBar(elemenBar, fraksi) {
    if (!elemenBar) return;
    const nilaiAman = Math.max(0, Math.min(1, Number(fraksi) || 0));
    elemenBar.style.transform = `scaleX(${nilaiAman})`;
  }

  /**
   * Menghitung angka skor / XP naik bertahap
   */
  hitungAngka(elemen, targetNilai, durasiMs = 900) {
    if (!elemen) return;
    const awal = parseInt(elemen.textContent, 10) || 0;
    if (this.mode === TingkatGerak.MATI || awal === targetNilai) {
      elemen.textContent = targetNilai;
      return;
    }

    const mulai = performance.now();
    const selisih = targetNilai - awal;

    const frame = (sekarang) => {
      const progres = Math.min((sekarang - mulai) / durasiMs, 1);
      const kemudahan = 1 - Math.pow(1 - progres, 3);
      const nilaiSekarang = Math.round(awal + selisih * kemudahan);
      elemen.textContent = nilaiSekarang;

      if (progres < 1) {
        requestAnimationFrame(frame);
      } else {
        elemen.textContent = targetNilai;
      }
    };

    requestAnimationFrame(frame);
  }
}

export const animasi = new PengelolaAnimasi();
