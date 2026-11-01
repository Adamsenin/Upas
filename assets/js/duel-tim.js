/**
 * KUPAS KUIS IPAS v4.0 - Mode Duel Tim Smartboard (duel-tim.js)
 * Standar: Vanilla JS, Accessible (WCAG AA), Smartboard Touch Targets (>=64px)
 * Mendukung mode Bel Buzzer Cepat & Giliran Beregu, Keyboard Shortcuts, Audio & Podium
 */

import { pasangHeader, umumkanAria, suara } from './ui.js';
import { supabase } from './supabase.js';

// 1. Template Tim Tematik IPAS
const TEMPLATE_TIM = [
  { id: 'tim-1', nama: 'Tim Elang', ikon: '🦅', warnaClass: 'tim-merah', modifierClass: 'kartu-regu-duel--elang', peran: 'Predator Udara Rimba', tombolBuzzer: 'A', skor: 0, benar: 0 },
  { id: 'tim-2', nama: 'Tim Lumba-Lumba', ikon: '🐬', warnaClass: 'tim-biru', modifierClass: 'kartu-regu-duel--lumba', peran: 'Penjelajah Samudra', tombolBuzzer: 'L', skor: 0, benar: 0 },
  { id: 'tim-3', nama: 'Tim Komodo', ikon: '🦎', warnaClass: 'tim-hijau', modifierClass: 'kartu-regu-duel--komodo', peran: 'Predator Purba Darat', tombolBuzzer: 'Z', skor: 0, benar: 0 },
  { id: 'tim-4', nama: 'Tim Harimau', ikon: '🐯', warnaClass: 'tim-kuning', modifierClass: 'kartu-regu-duel--harimau', peran: 'Penguasa Hutan Rimba', tombolBuzzer: 'M', skor: 0, benar: 0 }
];

// 2. Bank Soal IPAS Kelas 5 SD Kurikulum Merdeka
const BANK_SOAL_DUEL = [
  {
    soal: 'Makhluk hidup yang berperan menghasilkan makanan sendiri melalui proses fotosintesis dalam rantai makanan disebut...',
    opsi: ['Konsumen I', 'Produsen', 'Pengurai (Dekomposer)', 'Konsumen Puncak'],
    jawaban: 1,
    pembahasan: 'Produsen seperti tumbuhan hijau dan fitoplankton membuat makanan sendiri dengan bantuan sinar matahari.'
  },
  {
    soal: 'Proses penguapan air dari permukaan laut, danau, dan sungai ke atmosfer bumi dinamakan...',
    opsi: ['Presipitasi', 'Kondensasi', 'Evaporasi', 'Infiltrasi'],
    jawaban: 2,
    pembahasan: 'Evaporasi adalah perubahan wujud air dari cair menjadi gas akibat pemanasan energi matahari.'
  },
  {
    soal: 'Mengapa pensil yang dimasukkan ke dalam gelas berisi air bening terlihat patah atau bengkok?',
    opsi: ['Cahaya mengalami pemantulan baur', 'Cahaya mengalami pembiasan (refraksi)', 'Pensil menyerap seluruh warna cahaya', 'Air merusak bentuk fisik pensil'],
    jawaban: 1,
    pembahasan: 'Pembiasan cahaya terjadi ketika cahaya merambat melalui dua medium yang berbeda kerapatan optiknya (udara ke air).'
  },
  {
    soal: 'Dalam ekosistem sawah, jika populasi katak menurun drastis karena diburu manusia, kemungkinan yang akan terjadi adalah...',
    opsi: ['Populasi belalang meningkat pesat', 'Populasi padi meningkat pesat', 'Populasi ular meningkat pesat', 'Tidak ada pengaruh pada rantai makanan'],
    jawaban: 0,
    pembahasan: 'Katak adalah predator belalang. Tanpa katak, belalang pemakan padi akan berkembang biak tanpa kendali.'
  },
  {
    soal: 'Proses pelepasan uap air sejuk dari daun-daun pepohonan di hutan ke atmosfer disebut...',
    opsi: ['Transpirasi', 'Kondensasi', 'Respirasi', 'Perkolasi'],
    jawaban: 0,
    pembahasan: 'Transpirasi adalah proses penguapan air dari dalam tubuh tumbuhan melalui stomata daun.'
  },
  {
    soal: 'Benda yang dapat ditarik dengan kuat oleh gaya magnet (feromagnetik) adalah...',
    opsi: ['Sendok kayu dan kaca', 'Paku besi dan peniti baja', 'Kertas dan kain katun', 'Emas murni dan plastik'],
    jawaban: 1,
    pembahasan: 'Besi, baja, nikel, dan kobalt adalah logam feromagnetik yang dapat ditarik magnet dengan kuat.'
  },
  {
    soal: 'Organisme yang bertugas menguraikan bangkai makhluk hidup menjadi zat hara penyubur tanah adalah...',
    opsi: ['Herbivora', 'Jamur dan Bakteri', 'Karnivora', 'Tumbuhan Hijau'],
    jawaban: 1,
    pembahasan: 'Jamur dan bakteri pengurai mengembalikan nutrisi organik ke tanah agar bisa diserap kembali oleh produsen.'
  },
  {
    soal: 'Bunyi dapat merambat paling cepat ketika melewati medium berupa...',
    opsi: ['Ruang hampa udara', 'Gas oksigen', 'Zat cair (air)', 'Benda padat (besi/baja)'],
    jawaban: 3,
    pembahasan: 'Partikel pada benda padat tersusun paling rapat sehingga gelombang bunyi merambat paling cepat.'
  },
  {
    soal: 'Titik-titik air di langit yang saling bersatu, menjadi berat, lalu jatuh ke bumi dikenal sebagai peristiwa...',
    opsi: ['Presipitasi (Hujan)', 'Transpirasi', 'Evaporasi', 'Sublimasi'],
    jawaban: 0,
    pembahasan: 'Presipitasi adalah segala bentuk air yang jatuh dari awan atmosfer ke permukaan bumi.'
  },
  {
    soal: 'Hewan yang memakan tumbuhan sekaligus daging hewan lain (pemakan segalanya) disebut...',
    opsi: ['Herbivora', 'Karnivora', 'Omnivora', 'Insektivora'],
    jawaban: 2,
    pembahasan: 'Omnivora memakan tumbuhan dan hewan, seperti ayam, bebek, monyet, dan manusia.'
  }
];

// 3. State Permainan Duel
const state = {
  jumlahTim: 2,
  format: 'buzzer', // 'buzzer' | 'giliran'
  jumlahSoal: 5,
  soalList: [],
  indeksSoal: 0,
  timBertanding: [],
  timMenjawab: null, // Tim yang sedang mendapat hak menjawab
  statusFase: 'lobi', // 'lobi' | 'tunggu_bel' | 'menjawab' | 'selesai_soal' | 'podium'
  timerDetik: 20,
  timerInterval: null
};

// 4. Inisialisasi Halaman
document.addEventListener('DOMContentLoaded', () => {
  pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

  pasangListenerLobi();
  pasangListenerArena();
  pasangKeyboardShortcut();
  perbaruiPratinjauLobi();
});

// 5. Pengendali Lobi
function pasangListenerLobi() {
  const radTim = document.querySelectorAll('input[name="opsi-tim"]');
  const radFormat = document.querySelectorAll('input[name="opsi-format"]');
  const radSoal = document.querySelectorAll('input[name="opsi-soal"]');
  const btnMulai = document.getElementById('btn-mulai-duel');

  radTim.forEach((r) => {
    r.addEventListener('change', () => {
      state.jumlahTim = Number(r.value);
      suara.mainkan('klik');
      perbaruiPratinjauLobi();
    });
  });

  radFormat.forEach((r) => {
    r.addEventListener('change', () => {
      state.format = r.value;
      suara.mainkan('klik');
    });
  });

  radSoal.forEach((r) => {
    r.addEventListener('change', () => {
      state.jumlahSoal = Number(r.value);
      suara.mainkan('klik');
    });
  });

  if (btnMulai) {
    btnMulai.addEventListener('click', mulaiPertandingan);
  }
}

function perbaruiPratinjauLobi() {
  const wadah = document.getElementById('wadah-pratinjau-tim');
  if (!wadah) return;

  const timTerpilih = TEMPLATE_TIM.slice(0, state.jumlahTim);
  const count = state.jumlahTim;

  // Bangun elemen kartu regu face-off
  const kartuTimHTML = timTerpilih.map((tim) => `
    <div class="kartu-regu-duel ${tim.modifierClass || ''}" id="kartu-lobi-${tim.id}" data-tim-id="${tim.id}">
      <div class="kartu-regu-insignia" aria-hidden="true">${tim.ikon}</div>
      <h4 class="kartu-regu-nama">${tim.nama}</h4>
      <span class="kartu-regu-peran">${tim.peran || 'Regu Sains'}</span>
      <div class="keycap-wadah">
        <button type="button" class="keycap-bel smartboard-btn" id="keycap-tim-${tim.id}" data-tombol-key="${tim.tombolBuzzer}" aria-label="Uji tombol bel ${tim.nama}, tombol keyboard ${tim.tombolBuzzer}">
          <span class="keycap-huruf">${tim.tombolBuzzer}</span>
          <span class="keycap-label-bawah">Bel Regu</span>
        </button>
        <p class="keycap-petunjuk">Ketuk atau tekan [ ${tim.tombolBuzzer} ]</p>
      </div>
    </div>
  `);

  if (count === 2) {
    wadah.innerHTML = `
      <div class="duel-faceoff-grid" data-tim-count="2">
        ${kartuTimHTML[0]}
        <div class="duel-vs-badge" aria-label="Lawan">VS</div>
        ${kartuTimHTML[1]}
      </div>
    `;
  } else {
    wadah.innerHTML = `
      <div class="duel-faceoff-grid" data-tim-count="${count}">
        ${kartuTimHTML.join('')}
      </div>
    `;
  }

  // Pasang event listener interaktif pada keycap untuk uji coba bel di lobi
  timTerpilih.forEach((tim) => {
    const btnKeycap = document.getElementById(`keycap-tim-${tim.id}`);
    if (btnKeycap) {
      btnKeycap.addEventListener('click', () => {
        ujiCobaBelLobi(tim);
      });
    }
  });

  umumkanAria(`Jumlah regu diatur ke ${count} regu. ${timTerpilih.map(t => t.nama + ' tombol ' + t.tombolBuzzer).join(', ')}.`);
}

// Uji coba bel interaktif di lobi sebelum pertandingan dimulai
function ujiCobaBelLobi(tim) {
  const keycap = document.getElementById(`keycap-tim-${tim.id}`);
  if (keycap) {
    keycap.classList.add('keycap-tertekan');
    setTimeout(() => {
      keycap.classList.remove('keycap-tertekan');
    }, 220);
  }
  putarNadaBel();
  umumkanAria(`Bel ${tim.nama} aktif, tombol ${tim.tombolBuzzer}!`);
}

// 6. Mulai Pertandingan Duel
function mulaiPertandingan() {
  // Salin tim dengan skor 0
  state.timBertanding = TEMPLATE_TIM.slice(0, state.jumlahTim).map((t) => ({
    ...t,
    skor: 0,
    benar: 0
  }));

  // Acak urutan butir soal dengan Fisher-Yates
  const bankAcak = [...BANK_SOAL_DUEL];
  for (let i = bankAcak.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bankAcak[i], bankAcak[j]] = [bankAcak[j], bankAcak[i]];
  }
  state.soalList = bankAcak.slice(0, state.jumlahSoal);

  state.indeksSoal = 0;
  state.statusFase = 'tunggu_bel';

  // Sembunyikan lobi, tampilkan arena
  document.getElementById('layar-lobi').classList.add('d-none');
  document.getElementById('layar-arena').classList.remove('d-none');
  document.getElementById('layar-podium').classList.add('d-none');

  suara.mainkan('hore');
  muatSoalDuel();
}

// 7. Pengendali Arena Pertandingan
function pasangListenerArena() {
  // Tombol Pilihan Ganda (A, B, C, D)
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-opsi-${i}`);
    if (btn) {
      btn.addEventListener('click', () => {
        pilihJawaban(i);
      });
    }
  }

  // Tombol Kontrol Guru
  const btnNext = document.getElementById('btn-soal-berikutnya');
  const btnLewati = document.getElementById('btn-lewati-soal');
  const btnKeluar = document.getElementById('btn-keluar-duel');
  const btnDuelUlang = document.getElementById('btn-duel-ulang');

  if (btnNext) {
    btnNext.addEventListener('click', lanjutSoalBerikutnya);
  }

  if (btnLewati) {
    btnLewati.addEventListener('click', lewatiSoalSaatIni);
  }

  if (btnKeluar) {
    btnKeluar.addEventListener('click', () => {
      if (confirm('Yakin ingin mengakhiri pertandingan duel sekarang?')) {
        selesaikanDuel();
      }
    });
  }

  if (btnDuelUlang) {
    btnDuelUlang.addEventListener('click', () => {
      document.getElementById('layar-podium').classList.add('d-none');
      document.getElementById('layar-lobi').classList.remove('d-none');
      perbaruiPratinjauLobi();
    });
  }
}

// 8. Muat Soal Aktif
function muatSoalDuel() {
  hentikanTimer();

  const soal = state.soalList[state.indeksSoal];
  if (!soal) {
    selesaikanDuel();
    return;
  }

  state.timMenjawab = null;
  state.statusFase = state.format === 'buzzer' ? 'tunggu_bel' : 'menjawab';

  // Update Header & Teks
  const badgeIndeks = document.getElementById('badge-indeks-soal');
  const teksPertanyaan = document.getElementById('teks-pertanyaan-duel');
  const banner = document.getElementById('banner-giliran');
  const btnNext = document.getElementById('btn-soal-berikutnya');

  if (badgeIndeks) badgeIndeks.textContent = `Soal ${state.indeksSoal + 1} dari ${state.jumlahSoal}`;
  if (teksPertanyaan) teksPertanyaan.textContent = soal.soal;
  if (btnNext) btnNext.disabled = true;

  // Acak susunan pilihan jawaban dengan Fisher-Yates (stabil per soal aktif)
  if (!soal._opsiTersusun) {
    const items = soal.opsi.map((op, i) => ({ teks: op, originalIndex: i }));
    const regexTetapAkhir = /(semua.*(benar|salah)|tidak ada.*(benar|salah))/i;
    const normalItems = [];
    const akhirItems = [];
    items.forEach(it => {
      if (regexTetapAkhir.test(it.teks)) akhirItems.push(it);
      else normalItems.push(it);
    });
    for (let i = normalItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalItems[i], normalItems[j]] = [normalItems[j], normalItems[i]];
    }
    soal._opsiTersusun = [...normalItems, ...akhirItems];
  }

  // Reset tampilan pilihan ganda
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-opsi-${i}`);
    const teks = document.getElementById(`teks-opsi-${i}`);
    if (btn && teks) {
      btn.className = 'tombol-opsi-duel w-100';
      btn.disabled = state.format === 'buzzer'; // Disable pada mode buzzer sampai bel ditekan
      const item = soal._opsiTersusun[i];
      teks.textContent = item ? item.teks : (soal.opsi[i] || '');
    }
  }

  // Render Scoreboard & Buzzer
  renderScoreboardArena();
  renderBuzzerArena();

  if (state.format === 'buzzer') {
    if (banner) {
      banner.className = 'alert alert-primary border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
      banner.textContent = '⚡ Tekan Bel Buzzer Tim untuk merebut giliran menjawab!';
    }
    umumkanAria(`Soal ${state.indeksSoal + 1}: ${soal.soal}. Tekan bel tim untuk menjawab.`);
  } else {
    // Mode Giliran
    const giliranIndex = state.indeksSoal % state.timBertanding.length;
    state.timMenjawab = state.timBertanding[giliranIndex];
    if (banner) {
      banner.className = 'alert alert-success border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
      banner.textContent = `🎯 Giliran ${state.timMenjawab.nama} menjawab!`;
    }
    renderScoreboardArena();
    aktifkanOpsiJawaban();
    mulaiTimer(20);
    umumkanAria(`Soal ${state.indeksSoal + 1}. Giliran ${state.timMenjawab.nama}. ${soal.soal}`);
  }
}

// 9. Render Scoreboard Arena
function renderScoreboardArena() {
  const wadah = document.getElementById('wadah-scoreboard-arena');
  if (!wadah) return;

  wadah.innerHTML = state.timBertanding.map((tim) => {
    const isAktif = state.timMenjawab && state.timMenjawab.id === tim.id;
    return `
      <div class="col-6 col-md-${12 / state.timBertanding.length}">
        <div class="kartu-tim-scoreboard ${tim.warnaClass} ${isAktif ? 'giliran-aktif' : ''}">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-2">
              <span class="fs-2" aria-hidden="true">${tim.ikon}</span>
              <div>
                <h3 class="h6 fw-bolder mb-0">${tim.nama}</h3>
                <span class="small text-muted">[ Tombol: ${tim.tombolBuzzer} ]</span>
              </div>
            </div>
            <div class="text-end">
              <span class="skor-angka-tim" id="skor-${tim.id}">${tim.skor}</span>
              <span class="small d-block fw-bold text-secondary">Poin</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 10. Render Tombol Bel Buzzer Cepat
function renderBuzzerArena() {
  const wadah = document.getElementById('wadah-buzzer-tim');
  if (!wadah) return;

  if (state.format !== 'buzzer') {
    wadah.innerHTML = '';
    wadah.classList.add('d-none');
    return;
  }

  wadah.classList.remove('d-none');
  wadah.innerHTML = state.timBertanding.map((tim) => `
    <button type="button" class="buzzer-tim-btn ${tim.warnaClass}" id="btn-buzzer-${tim.id}" data-tim-id="${tim.id}" aria-label="Bel ${tim.nama} (Tekan ${tim.tombolBuzzer})">
      <span class="fs-3 mb-0" aria-hidden="true">${tim.ikon}</span>
      <span class="small fw-bolder mt-0">[ ${tim.tombolBuzzer} ]</span>
    </button>
  `).join('');

  // Pasang listener klik/sentuh buzzer
  state.timBertanding.forEach((tim) => {
    const btn = document.getElementById(`btn-buzzer-${tim.id}`);
    if (btn) {
      btn.addEventListener('click', () => {
        tekanBuzzer(tim.id);
      });
    }
  });
}

// 11. Logika Penekanan Buzzer
function tekanBuzzer(timId) {
  if (state.statusFase !== 'tunggu_bel') return;

  const tim = state.timBertanding.find((t) => t.id === timId);
  if (!tim) return;

  state.timMenjawab = tim;
  state.statusFase = 'menjawab';

  // Animasi & SFX bel
  const btnBuzzer = document.getElementById(`btn-buzzer-${tim.id}`);
  if (btnBuzzer) btnBuzzer.classList.add('tertekan', 'anim-buzzer-press');
  putarNadaBel();

  // Nonaktifkan seluruh bel
  document.querySelectorAll('.buzzer-tim-btn').forEach((b) => (b.disabled = true));

  // Perbarui Banner
  const banner = document.getElementById('banner-giliran');
  if (banner) {
    banner.className = 'alert alert-warning border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
    banner.textContent = `🔔 ${tim.nama.toUpperCase()} MENEKAN BEL DULUAN! Silakan jawab...`;
  }

  renderScoreboardArena();
  aktifkanOpsiJawaban();
  mulaiTimer(12); // Beri 12 detik setelah bel ditekan
  umumkanAria(`${tim.nama} menekan bel. Silakan pilih jawaban.`);
}

function aktifkanOpsiJawaban() {
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-opsi-${i}`);
    if (btn) btn.disabled = false;
  }
}

// 12. Pilihan Jawaban
function pilihJawaban(indexJawaban) {
  if (state.statusFase !== 'menjawab' || !state.timMenjawab) return;

  hentikanTimer();
  state.statusFase = 'selesai_soal';

  const soal = state.soalList[state.indeksSoal];
  const itemDipilih = (soal._opsiTersusun && soal._opsiTersusun[indexJawaban]) 
    ? soal._opsiTersusun[indexJawaban] 
    : { originalIndex: indexJawaban };
  const adalahBenar = (itemDipilih.originalIndex === soal.jawaban);
  const btnDipilih = document.getElementById(`btn-opsi-${indexJawaban}`);

  // Posisi tombol yang menampilkan kunci jawaban asli setelah diacak
  const idxTampilanKunci = soal._opsiTersusun
    ? soal._opsiTersusun.findIndex(it => it.originalIndex === soal.jawaban)
    : soal.jawaban;
  const btnKunci = document.getElementById(`btn-opsi-${idxTampilanKunci >= 0 ? idxTampilanKunci : soal.jawaban}`);
  const banner = document.getElementById('banner-giliran');
  const btnNext = document.getElementById('btn-soal-berikutnya');

  // Kunci semua opsi
  for (let i = 0; i < 4; i++) {
    const b = document.getElementById(`btn-opsi-${i}`);
    if (b) b.disabled = true;
  }

  if (adalahBenar) {
    suara.mainkan('benar');
    if (btnDipilih) btnDipilih.classList.add('opsi-benar');

    // Tambah skor tim
    state.timMenjawab.skor += 100;
    state.timMenjawab.benar += 1;

    if (banner) {
      banner.className = 'alert alert-success border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
      banner.textContent = `🎉 BENAR! +100 Poin untuk ${state.timMenjawab.nama}! (${soal.pembahasan})`;
    }
    umumkanAria(`Jawaban benar! 100 poin untuk ${state.timMenjawab.nama}.`);
  } else {
    suara.mainkan('salah');
    if (btnDipilih) btnDipilih.classList.add('opsi-salah');
    if (btnKunci) btnKunci.classList.add('opsi-benar');

    if (banner) {
      banner.className = 'alert alert-danger border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
      banner.textContent = `❌ Belum tepat! Jawaban benar adalah: ${soal.opsi[soal.jawaban]}. (${soal.pembahasan})`;
    }
    umumkanAria(`Jawaban salah. Jawaban benar adalah ${soal.opsi[soal.jawaban]}.`);
  }

  renderScoreboardArena();
  if (btnNext) btnNext.disabled = false;
}

// 13. Navigasi Soal
function lanjutSoalBerikutnya() {
  state.indeksSoal += 1;
  if (state.indeksSoal < state.jumlahSoal) {
    suara.mainkan('klik');
    muatSoalDuel();
  } else {
    selesaikanDuel();
  }
}

function lewatiSoalSaatIni() {
  hentikanTimer();
  const soal = state.soalList[state.indeksSoal];
  const idxTampilanKunci = soal._opsiTersusun
    ? soal._opsiTersusun.findIndex(it => it.originalIndex === soal.jawaban)
    : soal.jawaban;
  const btnKunci = document.getElementById(`btn-opsi-${idxTampilanKunci >= 0 ? idxTampilanKunci : soal.jawaban}`);
  if (btnKunci) btnKunci.classList.add('opsi-benar');

  const banner = document.getElementById('banner-giliran');
  if (banner) {
    banner.className = 'alert alert-secondary border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
    banner.textContent = `⏭️ Soal dilewati guru. Kunci jawaban: ${soal.opsi[soal.jawaban]}.`;
  }

  for (let i = 0; i < 4; i++) {
    const b = document.getElementById(`btn-opsi-${i}`);
    if (b) b.disabled = true;
  }

  const btnNext = document.getElementById('btn-soal-berikutnya');
  if (btnNext) btnNext.disabled = false;
}

// 14. Timer Hitung Mundur
function mulaiTimer(detik) {
  state.timerDetik = detik;
  perbaruiBadgeTimer();

  state.timerInterval = setInterval(() => {
    state.timerDetik -= 1;
    perbaruiBadgeTimer();

    if (state.timerDetik <= 0) {
      hentikanTimer();
      waktuHabis();
    }
  }, 1000);
}

function hentikanTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function perbaruiBadgeTimer() {
  const el = document.getElementById('angka-timer-soal');
  if (el) el.textContent = state.timerDetik;
}

function waktuHabis() {
  suara.mainkan('salah');
  const banner = document.getElementById('banner-giliran');
  if (banner) {
    banner.className = 'alert alert-warning border-2 border-dark text-center fw-bolder py-2 mb-3 fs-5 anim-pop';
    banner.textContent = '⏰ Waktu menjawab habis!';
  }

  for (let i = 0; i < 4; i++) {
    const b = document.getElementById(`btn-opsi-${i}`);
    if (b) b.disabled = true;
  }

  const btnNext = document.getElementById('btn-soal-berikutnya');
  if (btnNext) btnNext.disabled = false;
}

// 15. Podium Kemenangan & Selesai Duel
async function selesaikanDuel() {
  hentikanTimer();
  state.statusFase = 'podium';

  document.getElementById('layar-arena').classList.add('d-none');
  document.getElementById('layar-podium').classList.remove('d-none');

  // Urutkan tim berdasarkan skor tertinggi
  const urutanJuara = [...state.timBertanding].sort((a, b) => b.skor - a.skor);

  // Pasang Podium 1, 2, 3
  const j1 = urutanJuara[0];
  const j2 = urutanJuara[1];
  const j3 = urutanJuara[2] || null;

  if (j1) {
    const elNama1 = document.getElementById('nama-tim-podium-1');
    const elSkor1 = document.getElementById('skor-tim-podium-1');
    if (elNama1) elNama1.textContent = `${j1.ikon} ${j1.nama}`;
    if (elSkor1) elSkor1.textContent = `${j1.skor} Poin`;
  }

  if (j2) {
    const elNama2 = document.getElementById('nama-tim-podium-2');
    const elSkor2 = document.getElementById('skor-tim-podium-2');
    if (elNama2) elNama2.textContent = `${j2.ikon} ${j2.nama}`;
    if (elSkor2) elSkor2.textContent = `${j2.skor} Poin`;
  }

  const elPodium3 = document.getElementById('podium-juara-3');
  if (j3 && elPodium3) {
    elPodium3.classList.remove('d-none');
    const elNama3 = document.getElementById('nama-tim-podium-3');
    const elSkor3 = document.getElementById('skor-tim-podium-3');
    if (elNama3) elNama3.textContent = `${j3.ikon} ${j3.nama}`;
    if (elSkor3) elSkor3.textContent = `${j3.skor} Poin`;
  } else if (elPodium3) {
    elPodium3.classList.add('d-none');
  }

  // Tabel Rekap
  const tabelBody = document.getElementById('tabel-rekap-podium');
  if (tabelBody) {
    tabelBody.innerHTML = urutanJuara.map((t, idx) => `
      <tr>
        <td class="fw-bold">${idx === 0 ? '🥇 Juara 1' : idx === 1 ? '🥈 Juara 2' : idx === 2 ? '🥉 Juara 3' : 'Regu 4'}</td>
        <td class="fw-bold fs-6">${t.ikon} ${t.nama}</td>
        <td class="fw-bolder fs-5 text-success">${t.skor} Poin</td>
        <td>${t.benar} dari ${state.jumlahSoal} soal</td>
      </tr>
    `).join('');
  }

  // Selebrasi
  suara.mainkan('hore');
  if (typeof confetti === 'function') {
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.5 } });
  }

  // Simpan hasil ke Supabase activity_results
  try {
    await supabase.from('activity_results').insert({
      aktivitas_tipe: 'duel_tim',
      aktivitas_id: `duel-${Date.now()}`,
      nama_siswa: `Duel Kelas: ${j1.nama} Juara`,
      kelas: 'Kelas V Smartboard',
      skor: j1.skor,
      total_soal: state.jumlahSoal,
      benar: j1.benar,
      percobaan: 1,
      petunjuk_digunakan: 0,
      durasi_detik: state.jumlahSoal * 15,
      detail_jawaban: {
        format: state.format,
        peringkat: urutanJuara.map((t) => ({ nama: t.nama, skor: t.skor, benar: t.benar }))
      }
    });
  } catch (err) {
    console.warn('Gagal menyimpan hasil duel tim:', err);
  }

  umumkanAria(`Pertandingan duel selesai! Juara 1 adalah ${j1.nama} dengan skor ${j1.skor} poin.`);
}

// 16. Keyboard Shortcuts Pintar (Smartboard / Guru / Siswa)
function pasangKeyboardShortcut() {
  document.addEventListener('keydown', (e) => {
    const key = e.key.toUpperCase();

    // Uji Coba Bel Interaktif saat di Layar Lobi
    if (state.statusFase === 'lobi') {
      const timCocok = TEMPLATE_TIM.slice(0, state.jumlahTim).find((t) => t.tombolBuzzer === key);
      if (timCocok) {
        e.preventDefault();
        ujiCobaBelLobi(timCocok);
        return;
      }
    }

    // Hotkey Buzzer saat Pertandingan
    if (state.statusFase === 'tunggu_bel' && state.format === 'buzzer') {
      const timCocok = state.timBertanding.find((t) => t.tombolBuzzer === key);
      if (timCocok) {
        e.preventDefault();
        tekanBuzzer(timCocok.id);
        return;
      }
    }

    // Hotkey Opsi A, B, C, D (1, 2, 3, 4 atau A, B, C, D saat giliran menjawab)
    if (state.statusFase === 'menjawab') {
      if (['1', '2', '3', '4'].includes(key)) {
        e.preventDefault();
        pilihJawaban(Number(key) - 1);
        return;
      }
    }

    // Space / Enter untuk soal berikutnya saat fase selesai_soal
    if (state.statusFase === 'selesai_soal') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        lanjutSoalBerikutnya();
      }
    }
  });
}

// 17. Sintesis Nada Bel Buzzer Lembut (Web Audio API)
function putarNadaBel() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    suara.mainkan('klik');
  }
}

