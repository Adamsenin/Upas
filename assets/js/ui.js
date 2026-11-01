/**
 * KUPAS KUIS IPAS v4.0 - Utilitas Antarmuka Pengguna, Aksesibilitas & Gamifikasi Siswa (ui.js)
 * Mematuhi PRD Bagian 6, 7, 8 & Fase 1-3:
 * - Pembaca layar aria-live polite
 * - Cincin fokus keyboard & tombol 1-4
 * - Pengatur suara efek (SFX) & musik latar ceria (BGM) sintetis Web Audio API
 * - Navigasi responsif: Navbar + Offcanvas + Bottom-Nav (HP/Tablet) & Sidebar (Laptop)
 * - Gamifikasi Siswa: XP, Level, Streak Harian, Streak Jawaban, Lencana & Skeleton Bermaskot
 */

import { animasi, TingkatGerak } from './animasi.js';
import { konfigurasiManager } from './konfigurasi.js';

// Pengatur Efek Suara Web Audio API Sederhana (Tanpa File Eksternal)
class AudioEfek {
  constructor() {
    this.diaktifkan = localStorage.getItem('kupas_suara_aktif') === 'true';
    this.ctx = null;
  }

  toggle() {
    this.diaktifkan = !this.diaktifkan;
    localStorage.setItem('kupas_suara_aktif', this.diaktifkan ? 'true' : 'false');
    this.perbaruiUI();
    return this.diaktifkan;
  }

  perbaruiUI() {
    const btn = document.getElementById('btn-toggle-suara');
    if (btn) {
      btn.innerHTML = this.diaktifkan
        ? `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/><path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.482 5.482 0 0 1 11.025 8a5.482 5.482 0 0 1-1.61 3.89l.706.706z"/><path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/></svg> <span>SFX: Nyala</span>`
        : `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06zm7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0z"/></svg> <span>SFX: Bisu</span>`;
    }
  }

  mainkan(tipe) {
    if (!this.diaktifkan) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const t = this.ctx.currentTime;
      if (tipe === 'benar') {
        osc.frequency.setValueAtTime(523.25, t);
        osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.2);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
        osc.start(t);
        osc.stop(t + 0.35);
      } else if (tipe === 'salah') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(164.81, t + 0.25);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t);
        osc.stop(t + 0.3);
      } else if (tipe === 'selesai') {
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.setValueAtTime(554.37, t + 0.1);
        osc.frequency.setValueAtTime(659.25, t + 0.2);
        osc.frequency.setValueAtTime(880, t + 0.3);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
        osc.start(t);
        osc.stop(t + 0.6);
      } else if (tipe === 'klik') {
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.08);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
      } else if (tipe === 'balik') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, t);
        osc.frequency.exponentialRampToValueAtTime(500, t + 0.12);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      }
    } catch (e) {
      console.warn('Audio SFX tidak dapat diputar:', e);
    }
  }
}

// Musik Latar Ceria Sintetis (Melodi Belajar Bel Pentatonik Lembut)
class MusikLatar {
  constructor() {
    this.diaktifkan = localStorage.getItem('kupas_bgm_aktif') === 'true';
    this.ctx = null;
    this.timer = null;
    this.langkah = 0;
    this.melodi = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
      293.66, 329.63, 392.00, 440.00, 392.00, 0,
      329.63, 392.00, 523.25, 440.00, 392.00, 329.63,
      261.63, 293.66, 329.63, 261.63, 0, 0
    ];

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.jeda();
      } else if (this.diaktifkan) {
        this.mulai();
      }
    });
  }

  toggle() {
    this.diaktifkan = !this.diaktifkan;
    localStorage.setItem('kupas_bgm_aktif', this.diaktifkan ? 'true' : 'false');
    if (this.diaktifkan) {
      this.mulai();
    } else {
      this.jeda();
    }
    this.perbaruiUI();
    return this.diaktifkan;
  }

  mulai() {
    if (!this.diaktifkan) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx) this.ctx = new AudioContext();
      if (this.ctx.state === 'suspended') this.ctx.resume();
      if (this.timer) clearInterval(this.timer);

      this.timer = setInterval(() => {
        if (!this.diaktifkan || !this.ctx) return;
        const freq = this.melodi[this.langkah % this.melodi.length];
        this.langkah++;
        if (freq > 0) {
          this.bunyikanNada(freq);
        }
      }, 320);
    } catch (e) {
      console.warn('Musik tidak dapat dimulai:', e);
    }
  }

  bunyikanNada(freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.32);
  }

  jeda() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  perbaruiUI() {
    const btn = document.getElementById('btn-toggle-musik');
    if (btn) {
      btn.innerHTML = this.diaktifkan
        ? `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/></svg> <span>Musik: Nyala</span>`
        : `<svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2m9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2"/><path fill-rule="evenodd" d="M14 11V2h1v9zM6 3v10H5V3z"/><path d="M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4z"/><line x1="1" y1="1" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg> <span>Musik: Bisu</span>`;
    }
  }
}

export const suara = new AudioEfek();
export const musik = new MusikLatar();

/**
 * Mesin Gamifikasi Siswa (XP, Level, Streak Harian, Streak Jawaban, Lencana)
 */
const GAMIFIKASI_KEY = 'kupas_gamifikasi_siswa';

const DAFTAR_GELAR_LEVEL = [
  'Tunas Ekosistem',
  'Penjelajah Sawah',
  'Sahabat Rimba',
  'Ksatria Rantai Makanan',
  'Penjaga Harmoni Alam',
  'Master IPAS Nusantara'
];

export const KatalogLencana = [
  { 
    id: 'pemula', 
    ikon: '🌱', 
    nama: 'Tunas Penjelajah', 
    syarat: 'Mulai petualangan belajar IPAS pertama',
    ikonSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22V12"/><path d="M12 12C9 12 5 9 5 4C10 4 12 8 12 12Z"/><path d="M12 12C15 12 19 9 19 4C14 4 12 8 12 12Z"/></svg>`
  },
  { 
    id: 'kamus_5', 
    ikon: '📖', 
    nama: 'Kutu Buku Ekosistem', 
    syarat: 'Pelajari minimal 3 istilah di Kamus Belajar',
    ikonSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>`
  },
  { 
    id: 'streak_3', 
    ikon: '🔥', 
    nama: 'Api Semangat 3x', 
    syarat: 'Jawab 3 soal benar berturut-turut',
    ikonSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`
  },
  { 
    id: 'juara_kuis', 
    ikon: '🏆', 
    nama: 'Penjelajah Cilik IPAS', 
    syarat: 'Selesaikan sesi kuis bersama kelas',
    ikonSvg: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34"/><path d="M18 4H6v7a6 6 0 0 0 12 0V4z"/></svg>`
  }
];

class GamifikasiManager {
  constructor() {
    this.muat();
    this.perbaruiStreakHarian();
  }

  muat() {
    const raw = localStorage.getItem(GAMIFIKASI_KEY);
    const defaultData = {
      xp: 120,
      streakHarian: 1,
      streakJawab: 0,
      tanggalTerakhir: '',
      lencana: ['pemula']
    };
    try {
      this.data = raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
    } catch {
      this.data = defaultData;
    }
  }

  simpan() {
    localStorage.setItem(GAMIFIKASI_KEY, JSON.stringify(this.data));
  }

  perbaruiStreakHarian() {
    const hariIni = new Date().toISOString().slice(0, 10);
    if (this.data.tanggalTerakhir !== hariIni) {
      if (this.data.tanggalTerakhir) {
        const kemarin = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (this.data.tanggalTerakhir === kemarin) {
          this.data.streakHarian = (this.data.streakHarian || 1) + 1;
        } else {
          this.data.streakHarian = 1;
        }
      } else {
        this.data.streakHarian = 1;
      }
      this.data.tanggalTerakhir = hariIni;
      this.simpan();
    }
  }

  ambilInfoLevel() {
    const xp = this.data.xp || 0;
    const level = Math.floor(xp / 100) + 1;
    const xpDalamLevel = xp % 100;
    const gelar = DAFTAR_GELAR_LEVEL[Math.min(level - 1, DAFTAR_GELAR_LEVEL.length - 1)];
    return {
      xp,
      level,
      xpDalamLevel,
      targetXpLevel: 100,
      fraksiLevel: xpDalamLevel / 100,
      gelar,
      streakHarian: this.data.streakHarian || 1,
      streakJawab: this.data.streakJawab || 0,
      lencana: this.data.lencana || ['pemula']
    };
  }

  tambahXP(jumlah, alasan = '') {
    this.data.xp = Math.max(0, (this.data.xp || 0) + jumlah);
    this.simpan();
    this.segarkanPanelUI();
    if (alasan) {
      umumkanAria(`+${jumlah} XP diperoleh: ${alasan}`);
    }
    return this.ambilInfoLevel();
  }

  catatHasilJawab(benar) {
    if (benar) {
      this.data.streakJawab = (this.data.streakJawab || 0) + 1;
      const bonusStreak = this.data.streakJawab >= 3 ? 10 : 0;
      if (this.data.streakJawab >= 3) {
        this.bukaLencana('streak_3');
      }
      this.tambahXP(25 + bonusStreak);
    } else {
      this.data.streakJawab = 0;
      // Tetap beri +5 XP usaha belajar agar memotivasi dan tidak menghakimi
      this.tambahXP(5);
    }
    this.simpan();
    return this.ambilInfoLevel();
  }

  bukaLencana(idLencana) {
    if (!this.data.lencana.includes(idLencana)) {
      this.data.lencana.push(idLencana);
      this.simpan();
      this.segarkanPanelUI();
      return true;
    }
    return false;
  }

  segarkanPanelUI() {
    const info = this.ambilInfoLevel();
    const elLevel = document.getElementById('gamifikasi-level-teks');
    const elGelar = document.getElementById('gamifikasi-gelar-teks');
    const elXP = document.getElementById('gamifikasi-xp-angka');
    const elStreak = document.getElementById('gamifikasi-streak-angka');
    const elBar = document.getElementById('gamifikasi-xp-bar');
    const elRing = document.getElementById('gamifikasi-xp-ring-circle');

    if (elLevel) elLevel.textContent = `Lv.${info.level}`;
    if (elGelar) elGelar.textContent = info.gelar;
    if (elXP) animasi.hitungAngka(elXP, info.xp, 650);
    if (elStreak) elStreak.textContent = `${info.streakHarian} Hari`;
    if (elBar) animasi.isiBar(elBar, info.fraksiLevel);
    if (elRing) {
      const keliling = 144.5;
      elRing.style.strokeDashoffset = `${keliling * (1 - info.fraksiLevel)}`;
    }
  }
}

export const gamifikasi = new GamifikasiManager();

/**
 * Render Panel Gamifikasi Siswa (Cincin XP Melingkar, Level, Streak Api, Lencana Stiker & Teks Motivasi)
 */
export function pasangPanelGamifikasi(wadahId) {
  const wadah = document.getElementById(wadahId);
  if (!wadah) return;

  const info = gamifikasi.ambilInfoLevel();
  const keliling = 144.5;
  const dashoffset = keliling * (1 - info.fraksiLevel);

  const lencanaHTML = KatalogLencana.map(b => {
    const terbuka = info.lencana.includes(b.id);
    return `
      <div class="stiker-lencana-item ${terbuka ? 'bg-warning text-dark' : 'stiker-lencana-terkunci'}" 
           title="${b.nama}: ${b.syarat}" 
           role="img" 
           aria-label="${b.nama} (${terbuka ? 'Terkumpul' : 'Terkunci'})">
        ${b.ikonSvg || `<span aria-hidden="true">${b.ikon}</span>`}
      </div>
    `;
  }).join('');

  const pesanMotivasi = info.xpDalamLevel < 40 
    ? 'Ayo selesaikan petualangan pertamamu hari ini untuk melesat naik level!' 
    : `Keren! Tinggal ${100 - info.xpDalamLevel} XP lagi untuk meraih level ${info.level + 1}!`;

  wadah.innerHTML = `
    <div class="bilah-gamifikasi-diorama anim-slide-up" role="region" aria-label="Status Petualang Siswa">
      <div class="row g-2 align-items-center">
        <!-- 1. Cincin XP Melingkar & Level Siswa -->
        <div class="col-12 col-md-5 d-flex align-items-center gap-3">
          <div class="ring-xp-container" title="Progres Level ${info.level}: ${info.xpDalamLevel}/100 XP">
            <svg class="ring-xp-svg" viewBox="0 0 58 58" aria-hidden="true">
              <circle class="ring-xp-bg" cx="29" cy="29" r="23" />
              <circle class="ring-xp-bar" id="gamifikasi-xp-ring-circle" cx="29" cy="29" r="23"
                stroke-dasharray="${keliling}"
                stroke-dashoffset="${dashoffset}" />
            </svg>
            <span class="ring-level-angka" id="gamifikasi-level-teks">Lv.${info.level}</span>
          </div>

          <div class="text-start">
            <div class="fw-bolder fs-6 text-dark lh-sm" id="gamifikasi-gelar-teks">${info.gelar}</div>
            <div class="small text-secondary fw-bold d-flex align-items-center gap-1 mt-1">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#F59E0B" stroke="#0F3D2E" stroke-width="1.5" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Total XP: <strong class="text-dark" id="gamifikasi-xp-angka">${info.xp}</strong> XP</span>
            </div>
          </div>
        </div>

        <!-- 2. Progres Bar & Pesan Motivasi -->
        <div class="col-12 col-md-4">
          <div class="d-flex justify-content-between small fw-bold mb-1">
            <span class="text-dark">Progres Level</span>
            <span class="text-secondary">${info.xpDalamLevel} / 100 XP</span>
          </div>
          <div class="progres-wadah-halus" role="progressbar" aria-label="Progres XP Level" aria-valuenow="${info.xpDalamLevel}" aria-valuemin="0" aria-valuemax="100">
            <div class="progres-bar-halus progres-bar-xp" id="gamifikasi-xp-bar" style="transform: scaleX(${info.fraksiLevel});"></div>
          </div>
          <div class="small fw-semibold text-secondary mt-1 text-truncate" style="font-size: 0.78rem;" id="gamifikasi-motivasi-teks">
            ${pesanMotivasi}
          </div>
        </div>

        <!-- 3. Streak Api Harian & Lencana Stiker -->
        <div class="col-12 col-md-3 d-flex flex-column align-items-md-end gap-1">
          <div class="kupas-badge bg-warning-subtle text-dark py-1 px-3 border border-2 border-dark rounded-pill d-inline-flex align-items-center gap-1" title="Streak Belajar Harian">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="#EF4444" stroke="#991B1B" stroke-width="1.5" aria-hidden="true"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
            <span class="small fw-bold">Streak: <strong id="gamifikasi-streak-angka">${info.streakHarian} Hari</strong></span>
          </div>
          <div class="d-flex align-items-center gap-1 mt-1">
            ${lencanaHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render Skeleton Loading Bermaskot yang Ramah
 */
export function renderSkeletonMaskot(rootAset = '', pesan = 'Si Kupas sedang menyiapkan materi ekosistem...') {
  return `
    <div class="col-12 text-center py-4" role="status" aria-live="polite">
      <img src="${rootAset}assets/svg/maskot-berpikir.svg" alt="Maskot sedang memuat" width="84" height="84" class="anim-bounce mb-2">
      <p class="fw-bold text-dark mb-3">${pesan}</p>
      <div class="mx-auto" style="max-width: 420px;">
        <div class="kupas-skeleton-bar mb-2" style="width: 100%;"></div>
        <div class="kupas-skeleton-bar mb-2" style="width: 80%; margin: 0 auto;"></div>
        <div class="kupas-skeleton-bar" style="width: 60%; margin: 0 auto;"></div>
      </div>
    </div>
  `;
}

/**
 * Render Empty State Ramah Bermaskot
 */
export function renderEmptyStateRamah(rootAset = '', judul = 'Belum Ada Data', subjudul = 'Coba kata kunci atau pilihan kategori lainnya ya!') {
  return `
    <div class="col-12 text-center py-5 anim-pop">
      <img src="${rootAset}assets/svg/maskot-sedih-menyemangati.svg" alt="Maskot Si Kupas menyemangati" width="100" height="100" class="anim-melambai mb-3">
      <h3 class="h5 fw-bolder text-dark mb-1">${judul}</h3>
      <p class="text-secondary small mb-0 mx-auto" style="max-width: 420px;">${subjudul}</p>
    </div>
  `;
}

/**
 * Umumkan status penting lewat aria-live polite
 */
export function umumkanAria(pesan) {
  let liveEl = document.getElementById('kupas-aria-live');
  if (!liveEl) {
    liveEl = document.createElement('div');
    liveEl.id = 'kupas-aria-live';
    liveEl.setAttribute('aria-live', 'polite');
    liveEl.setAttribute('aria-atomic', 'true');
    liveEl.className = 'sr-only';
    document.body.appendChild(liveEl);
  }
  liveEl.textContent = '';
  setTimeout(() => {
    liveEl.textContent = pesan;
  }, 50);
}

/**
 * Pasang Navigasi Atas Standar, Offcanvas (HP/Tablet), Bottom-Nav (HP/Tablet), dan Sidebar (Laptop)
 */
export function pasangHeader(peran = 'umum', opsi = {}) {
  const wadah = document.getElementById('wadah-navbar');
  if (!wadah) return;

  const modeSekarang = animasi.getMode();
  const root = opsi.rootAset || '';
  const berandaHref = opsi.berandaLink || `${root}index.html`;
  const pathSekarang = window.location.pathname.toLowerCase();

  wadah.innerHTML = `
    <nav class="navbar navbar-expand-lg kupas-nav py-2 px-2 px-sm-3" aria-label="Navigasi Utama">
      <div class="container-fluid d-flex justify-content-between align-items-center flex-nowrap">
        <a class="navbar-brand d-flex align-items-center gap-2 text-decoration-none text-dark fw-bolder m-0 text-truncate" href="${berandaHref}">
          <img src="${root}assets/svg/maskot-senang.svg" alt="Maskot KUPAS" width="38" height="38" class="anim-melambai flex-shrink-0" aria-hidden="true" />
          <span class="fs-4 text-truncate">KUPAS <span class="badge bg-warning text-dark border border-dark rounded-pill fs-6 d-none d-sm-inline-block">KUIS IPAS</span></span>
        </a>

        <!-- Tombol Menu Offcanvas untuk HP & Tablet (<992px) -->
        <button class="btn btn-kupas-kuning btn-sm d-lg-none fw-bold px-3 flex-shrink-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#kupasOffcanvasNav" aria-controls="kupasOffcanvasNav" aria-label="Buka menu dan pengaturan">
          ☰ Menu
        </button>

        <!-- Panel Kontrol & Menu (Offcanvas di HP/Tablet, Baris Penuh di Laptop/Smartboard) -->
        <div class="offcanvas-lg offcanvas-end" tabindex="-1" id="kupasOffcanvasNav" aria-labelledby="kupasOffcanvasLabel">
          <div class="offcanvas-header border-bottom border-2 border-dark">
            <h2 class="offcanvas-title h5 fw-bolder mb-0 d-flex align-items-center gap-2" id="kupasOffcanvasLabel">
              <img src="${root}assets/svg/maskot-senang.svg" alt="" width="32" height="32" aria-hidden="true" />
              Menu & Pengaturan
            </h2>
            <button type="button" class="btn-close" data-bs-dismiss="offcanvas" data-bs-target="#kupasOffcanvasNav" aria-label="Tutup menu"></button>
          </div>

          <div class="offcanvas-body d-flex flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-lg-end gap-2">
            <!-- Tautan Cepat di Offcanvas HP -->
            <div class="d-flex flex-column gap-2 d-lg-none mb-2 pb-2 border-bottom border-2 border-dark">
              <a href="${berandaHref}" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Beranda Utama</span>
              </a>
              <a href="${root}gabung.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>
                <span>Gabung Kuis Siswa</span>
              </a>
              <a href="${root}rantai-makanan.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V12M12 12C9 12 5 9 5 4C10 4 12 8 12 12ZM12 12C15 12 19 9 19 4C14 4 12 8 12 12Z"/></svg>
                <span>Hutan Rantai Makanan</span>
              </a>
              <a href="${root}siklus-air.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                <span>Danau Siklus Air</span>
              </a>
              <a href="${root}kamus-belajar.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
                <span>Pohon Kamus Belajar</span>
              </a>
              <a href="${root}fakta-opini.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                <span>Pos Fakta vs Opini</span>
              </a>
              <a href="${root}sertifikat.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8v4h8v-4h-1c-.55 0-1-.45-1-1v-2.34M18 4H6v7a6 6 0 0 0 12 0V4z"/></svg>
                <span>Puncak Sertifikat</span>
              </a>
              <a href="${root}duel-tim.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>Arena Duel Smartboard</span>
              </a>
              <a href="${root}guru/dasbor.html" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>Ruang Guru Dasbor</span>
              </a>
              <button type="button" id="btn-offcanvas-pengaturan-kuis" class="btn btn-kupas-kuning w-100 justify-content-start d-flex align-items-center gap-2 fw-bold" style="min-height: 48px;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Pengaturan Kuis</span>
              </button>
            </div>

            <!-- Tombol Kamus Belajar Cepat (Desktop) -->
            <a href="${root}kamus-belajar.html" class="btn btn-outline-success btn-sm fw-bold d-none d-lg-inline-flex align-items-center gap-1" aria-label="Buka Kamus Belajar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
              <span>Kamus</span>
            </a>

            <!-- Tombol Suara SFX -->
            <button id="btn-toggle-suara" type="button" class="btn btn-outline-dark btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold" style="min-height: 48px; min-width: 48px; padding: 0.5rem 0.85rem;" aria-label="Beralih efek suara">
              SFX
            </button>

            <!-- Tombol Musik Latar BGM -->
            <button id="btn-toggle-musik" type="button" class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold" style="min-height: 48px; min-width: 48px; padding: 0.5rem 0.85rem;" aria-label="Beralih musik latar">
              Musik
            </button>

            <!-- Pengaturan Animasi -->
            <div class="d-flex align-items-center justify-content-between gap-2 bg-white px-2 py-1 rounded-3 border border-2 border-dark" style="min-height: 48px;">
              <label for="select-animasi-global" class="small fw-bold mb-0">Gerak:</label>
              <select id="select-animasi-global" class="form-select form-select-sm border-0 fw-bold py-0" style="width: auto; min-height: 48px; font-size: 0.95rem;" aria-label="Pilih tingkat animasi">
                <option value="penuh" ${modeSekarang === 'penuh' ? 'selected' : ''}>Penuh</option>
                <option value="kurang" ${modeSekarang === 'kurang' ? 'selected' : ''}>Kurang</option>
                <option value="mati" ${modeSekarang === 'mati' ? 'selected' : ''}>Mati</option>
              </select>
            </div>

            ${opsi.extraBtn || ''}
          </div>
        </div>
      </div>
    </nav>
  `;

  // Pasang Sidebar untuk Laptop (>=1024px) bila halaman guru
  const adalahHalamanGuruKelola = peran === 'guru' &&
    !pathSekarang.includes('masuk.html') &&
    !pathSekarang.includes('sesi.html');

  const mainEl = document.querySelector('main');
  if (adalahHalamanGuruKelola && mainEl && !document.querySelector('.kupas-sidebar')) {
    const wrapper = document.createElement('div');
    wrapper.className = 'kupas-app-wrapper has-sidebar';

    const sidebar = document.createElement('aside');
    sidebar.className = 'kupas-sidebar';
    sidebar.setAttribute('aria-label', 'Menu Samping Guru');
    sidebar.innerHTML = `
      <div class="mb-3 px-2">
        <span class="text-uppercase small fw-bolder text-secondary">Menu Ruang Guru</span>
      </div>
      <nav class="d-flex flex-column gap-2 flex-grow-1">
        <a href="${root}guru/dasbor.html" class="kupas-sidebar-link ${pathSekarang.includes('dasbor.html') ? 'active' : ''}">
          <span>📊</span> <span>Dasbor Kuis</span>
        </a>
        <a href="${root}guru/editor.html" class="kupas-sidebar-link ${pathSekarang.includes('editor.html') ? 'active' : ''}">
          <span>✏️</span> <span>Editor Kuis</span>
        </a>
        <a href="${root}guru/kamus.html" class="kupas-sidebar-link ${pathSekarang.includes('guru/kamus.html') ? 'active' : ''}">
          <span>📖</span> <span>Kelola Kamus</span>
        </a>
        <button type="button" id="btn-sidebar-pengaturan-kuis" class="kupas-sidebar-link border-0 bg-transparent text-start w-100" style="min-height: 48px; cursor: pointer;">
          <span>⚙️</span> <span>Pengaturan Kuis</span>
        </button>
        <hr class="border-dark my-2" />
        <a href="${root}kamus-belajar.html" class="kupas-sidebar-link">
          <span>🌿</span> <span>Kamus Siswa</span>
        </a>
        <a href="${berandaHref}" class="kupas-sidebar-link">
          <span>🏠</span> <span>Beranda Utama</span>
        </a>
      </nav>
    `;

    mainEl.parentNode.insertBefore(wrapper, mainEl);
    mainEl.classList.add('kupas-main-content');
    wrapper.appendChild(sidebar);
    wrapper.appendChild(mainEl);
  }

  // Pasang Bottom Navigation untuk HP & Tablet (<1024px)
  if (!opsi.sembunyikanBottomNav && !document.getElementById('kupas-bottom-nav')) {
    const bottomNav = document.createElement('nav');
    bottomNav.id = 'kupas-bottom-nav';
    bottomNav.className = 'kupas-bottom-nav';
    bottomNav.setAttribute('aria-label', 'Navigasi Bawah Perangkat Seluler');

    if (peran === 'guru' && !pathSekarang.includes('masuk.html')) {
      bottomNav.innerHTML = `
        <a href="${root}guru/dasbor.html" class="kupas-bottom-nav-item ${pathSekarang.includes('dasbor.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">📊</span>
          <span>Dasbor</span>
        </a>
        <a href="${root}guru/editor.html" class="kupas-bottom-nav-item ${pathSekarang.includes('editor.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">✏️</span>
          <span>Editor</span>
        </a>
        <a href="${root}guru/kamus.html" class="kupas-bottom-nav-item ${pathSekarang.includes('guru/kamus.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">📖</span>
          <span>Kamus</span>
        </a>
        <button type="button" class="kupas-bottom-nav-item" data-bs-toggle="offcanvas" data-bs-target="#kupasOffcanvasNav" aria-label="Buka Pengaturan">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">⚙️</span>
          <span>Atur</span>
        </button>
      `;
    } else {
      bottomNav.innerHTML = `
        <a href="${berandaHref}" class="kupas-bottom-nav-item ${pathSekarang.endsWith('index.html') || pathSekarang.endsWith('/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">🏠</span>
          <span>Beranda</span>
        </a>
        <a href="${root}gabung.html" class="kupas-bottom-nav-item ${pathSekarang.includes('gabung.html') || pathSekarang.includes('siswa/main.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">🎒</span>
          <span>Gabung</span>
        </a>
        <a href="${root}kamus-belajar.html" class="kupas-bottom-nav-item ${pathSekarang.includes('kamus-belajar.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">📖</span>
          <span>Kamus</span>
        </a>
        <a href="${root}guru/dasbor.html" class="kupas-bottom-nav-item ${pathSekarang.includes('guru/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">👩‍🏫</span>
          <span>Guru</span>
        </a>
      `;
    }
    document.body.appendChild(bottomNav);
  }

  // Listener pengatur animasi
  const select = document.getElementById('select-animasi-global');
  if (select) {
    select.addEventListener('change', (e) => {
      animasi.setMode(e.target.value);
      umumkanAria('Tingkat animasi diubah menjadi ' + e.target.value);
    });
  }

  // Listener tombol suara & musik
  suara.perbaruiUI();
  musik.perbaruiUI();
  if (musik.diaktifkan) {
    musik.mulai();
  }

  const btnSuara = document.getElementById('btn-toggle-suara');
  if (btnSuara) {
    btnSuara.addEventListener('click', () => {
      const aktif = suara.toggle();
      umumkanAria(aktif ? 'Efek suara diaktifkan' : 'Efek suara dimatikan');
    });
  }

  const btnMusik = document.getElementById('btn-toggle-musik');
  if (btnMusik) {
    btnMusik.addEventListener('click', () => {
      const aktif = musik.toggle();
      umumkanAria(aktif ? 'Musik latar diaktifkan' : 'Musik latar dimatikan');
    });
  }

  // Listener Tombol Pengaturan Kuis Guru (Sidebar & Offcanvas)
  const btnSidebarPengaturan = document.getElementById('btn-sidebar-pengaturan-kuis');
  if (btnSidebarPengaturan) {
    btnSidebarPengaturan.addEventListener('click', (e) => {
      e.preventDefault();
      konfigurasiManager.bukaModalPengaturan();
    });
  }

  const btnOffcanvasPengaturan = document.getElementById('btn-offcanvas-pengaturan-kuis');
  if (btnOffcanvasPengaturan) {
    btnOffcanvasPengaturan.addEventListener('click', (e) => {
      e.preventDefault();
      const offcanvasEl = document.getElementById('kupasOffcanvasNav');
      if (offcanvasEl && window.bootstrap && window.bootstrap.Offcanvas) {
        const oc = window.bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (oc) oc.hide();
      }
      konfigurasiManager.bukaModalPengaturan();
    });
  }
}

/**
 * Konfeti Ringan Kartun (Hanya transform & opacity)
 */
export function cetusKonfeti(wadahInduk = document.body) {
  if (animasi.getMode() === TingkatGerak.MATI) return;
  const warna = ['#22C55E', '#F59E0B', '#0284C7', '#EC4899', '#8B5CF6'];
  const jumlah = animasi.getMode() === TingkatGerak.KURANG ? 8 : 24;

  for (let i = 0; i < jumlah; i++) {
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.top = '10%';
    el.style.left = (15 + Math.random() * 70) + '%';
    el.style.width = '12px';
    el.style.height = '12px';
    el.style.backgroundColor = warna[Math.floor(Math.random() * warna.length)];
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '3px';
    el.style.zIndex = '9999';
    el.style.pointerEvents = 'none';
    wadahInduk.appendChild(el);

    const geserX = (Math.random() - 0.5) * 200;
    const geserY = 250 + Math.random() * 300;
    const putaran = (Math.random() - 0.5) * 720;

    const anim = el.animate([
      { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
      { transform: `translate(${geserX}px, ${geserY}px) rotate(${putaran}deg) scale(0.6)`, opacity: 0 }
    ], {
      duration: 1200 + Math.random() * 800,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    });

    anim.onfinish = () => el.remove();
  }
}
