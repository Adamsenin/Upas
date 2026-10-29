/**
 * KUPAS KUIS IPAS v4.0 - Laboratorium Mini: Simulasi Siklus Air & Suhu (siklus-air.js)
 * Standar: Vanilla JS, Accessible (WCAG AA), Animasi 60fps (transform & opacity)
 * Menyimpan progres eksperimen sains siswa ke Supabase (tabel activity_results)
 */

import { pasangHeader, umumkanAria, suara } from './ui.js';
import { supabase } from './supabase.js';

// 1. Data Sains & Detail Tahapan Siklus Air
const TAHAPAN_SAINS = {
  matahari: {
    judul: 'Matahari & Energi Panas',
    ikon: '☀️',
    badge: 'Sumber Energi Utama',
    penjelasan: 'Matahari memancarkan energi panas ke bumi. Panas ini menghangatkan air laut, sungai, dan danau sehingga molekul-molekul air bergerak semakin lincah dan berubah wujud menjadi uap air (gas) yang naik ke atmosfer.',
    balonMaskot: 'Matahari adalah motor penggerak siklus air! Tanpa panas matahari, air tidak akan pernah menguap ke langit.'
  },
  laut: {
    judul: 'Evaporasi (Penguapan Air Laut)',
    ikon: '🌊',
    badge: 'Evaporasi',
    penjelasan: 'Evaporasi adalah proses perubahan air dari wujud cair menjadi gas (uap air) akibat panas. Lautan adalah penyumbang uap air terbesar di bumi karena menutupi lebih dari 70% permukaan planet kita.',
    balonMaskot: 'Saat air laut menguap, garamnya tertinggal di laut lho! Jadi uap air yang naik ke langit selalu air tawar yang murni.'
  },
  hutan: {
    judul: 'Transpirasi (Penguapan Tumbuhan)',
    ikon: '🌲',
    badge: 'Transpirasi',
    penjelasan: 'Transpirasi adalah proses pelepasan uap air dari jaringan tumbuhan ke atmosfer, terutama melalui pori-pori halus daun yang disebut stomata. Hutan lebat berfungsi seperti spons raksasa penghasil kelembapan udara.',
    balonMaskot: 'Pepohonan hutan juga "berkeringat" mengeluarkan uap air sejuk! Inilah sebabnya udara di hutan selalu terasa lembap dan segar.'
  },
  awan: {
    judul: 'Kondensasi (Pengembunan Uap Air)',
    ikon: '☁️',
    badge: 'Kondensasi',
    penjelasan: 'Kondensasi terjadi saat uap air yang naik ke lapisan udara tinggi mengalami penurunan suhu (mendingin). Uap air pun berubah kembali menjadi titik-titik air mikro yang melayang dan berkumpul membentuk awan.',
    balonMaskot: 'Awan sebenarnya bukan gas, melainkan kumpulan miliaran titik air cair yang sangat kecil dan ringan!'
  },
  hujan: {
    judul: 'Presipitasi (Terjadinya Hujan)',
    ikon: '🌧️',
    badge: 'Presipitasi',
    penjelasan: 'Ketika titik-titik air di dalam awan saling bertubrukan dan bertambah besar, awan menjadi jenuh dan berat. Gravitasi bumi menarik titik air tersebut jatuh ke permukaan tanah sebagai hujan atau salju.',
    balonMaskot: 'Byur! Air hujan yang jatuh ke daratan akan menyirami tanaman dan mengisi kembali sungai serta danau kita.'
  },
  tanah: {
    judul: 'Infiltrasi & Aliran Permukaan (Runoff)',
    ikon: '💧',
    badge: 'Infiltrasi & Akuifer',
    penjelasan: 'Sebagian air hujan mengalir di permukaan tanah menuju selokan dan sungai (runoff). Sebagian lainnya meresap ke dalam pori-pori tanah (infiltrasi) menjadi cadangan air tanah bersih yang mengalir lambat kembali ke laut.',
    balonMaskot: 'Akar pohon membantu tanah menyerap air hujan dengan baik, sehingga mencegah bencana tanah longsor dan banjir bandang!'
  }
};

// 2. Daftar Misi Eksperimen Sains
const DAFTAR_MISI = [
  {
    id: 1,
    judul: 'Misi 1: Picu Hujan Alami',
    petunjuk: 'Naikkan suhu matahari hingga minimal 35°C agar air laut menguap cepat, lalu ubah kondisi awan menjadi Hujan!',
    hadiahXP: 50,
    cekKondisi: (s) => s.suhu >= 35 && s.awanKondisi === 'hujan',
    pesanBerhasil: 'Luar biasa! Panas matahari yang terik memicu penguapan kilat hingga awan jenuh dan memuntahkan air hujan ke pegunungan!',
    pesanBelum: 'Belum tepat! Pastikan suhu matahari disetel minimal 35°C dan kondisi awan dipilih "Hujan".'
  },
  {
    id: 2,
    judul: 'Misi 2: Buktikan Transpirasi Hutan',
    petunjuk: 'Nyalakan saklar "Hutan Lebat" dan atur suhu minimal 25°C untuk melihat uap air transpirasi keluar dari dedaunan!',
    hadiahXP: 60,
    cekKondisi: (s) => s.hutanAktif && s.suhu >= 25,
    pesanBerhasil: 'Hebat! Kamu membuktikan bahwa hutan lebat sangat penting membantu pembentukan awan melalui uap air daun (transpirasi)!',
    pesanBelum: 'Hutan lebat belum aktif atau suhu masih terlalu dingin. Pastikan saklar Hutan menyala dan suhu minimal 25°C.'
  },
  {
    id: 3,
    judul: 'Misi 3: Eksperimen Dampak Hutan Gundul',
    petunjuk: 'Matikan saklar Hutan (hutan gundul), lalu turunkan hujan untuk melihat hilangnya transpirasi dan bahaya erosi tanah!',
    hadiahXP: 75,
    cekKondisi: (s) => !s.hutanAktif && s.awanKondisi === 'hujan',
    pesanBerhasil: 'Sempurna! Tanpa pohon, transpirasi terhenti dan air hujan langsung mengikis tanah tanpa akar penyerap. Jagalah kelestarian hutan kita!',
    pesanBelum: 'Matikan saklar Hutan terlebih dahulu, lalu pilih kondisi awan "Hujan" untuk mengamati dampaknya.'
  }
];

// 3. State Simulasi
const state = {
  suhu: 25,
  awanKondisi: 'cerah', // 'cerah' | 'mendung' | 'hujan'
  hutanAktif: true,
  misiIndex: 0,
  bintangTotal: 0,
  misiSelesai: [false, false, false],
  namaMurid: localStorage.getItem('kupas_nama_siswa') || 'Ilmuwan Cilik'
};

// 4. Inisialisasi Halaman
document.addEventListener('DOMContentLoaded', () => {
  pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

  // Inisialisasi elemen interaksi
  pasangKontrolSuhu();
  pasangKontrolAwan();
  pasangKontrolHutan();
  pasangHotspotPanggung();
  pasangAksiMisi();
  perbaruiTampilanMisi();
  perbaruiVisualSimulasi();
});

// 5. Pengendali Kontrol Suhu
function pasangKontrolSuhu() {
  const slider = document.getElementById('slider-suhu');
  const btnDingin = document.getElementById('btn-suhu-dingin');
  const btnNormal = document.getElementById('btn-suhu-normal');
  const btnPanas = document.getElementById('btn-suhu-panas');

  if (slider) {
    slider.addEventListener('input', (e) => {
      state.suhu = Number(e.target.value);
      perbaruiBadgeSuhu();
      perbaruiVisualSimulasi();
    });
  }

  if (btnDingin) {
    btnDingin.addEventListener('click', () => {
      setelSuhu(10);
    });
  }

  if (btnNormal) {
    btnNormal.addEventListener('click', () => {
      setelSuhu(25);
    });
  }

  if (btnPanas) {
    btnPanas.addEventListener('click', () => {
      setelSuhu(40);
    });
  }
}

function setelSuhu(nilai) {
  state.suhu = nilai;
  const slider = document.getElementById('slider-suhu');
  if (slider) {
    slider.value = nilai;
    slider.setAttribute('aria-valuenow', nilai);
  }
  suara.mainkan('klik');
  perbaruiBadgeSuhu();
  perbaruiVisualSimulasi();
  umumkanAria(`Suhu matahari diubah menjadi ${nilai} derajat Celsius.`);
}

function perbaruiBadgeSuhu() {
  const badge = document.getElementById('badge-suhu-nilai');
  if (!badge) return;

  badge.className = 'badge-suhu';
  if (state.suhu <= 15) {
    badge.classList.add('suhu-dingin');
    badge.innerHTML = `<span aria-hidden="true">❄️</span> ${state.suhu}°C - Dingin`;
  } else if (state.suhu <= 32) {
    badge.classList.add('suhu-normal');
    badge.innerHTML = `<span aria-hidden="true">🌡️</span> ${state.suhu}°C - Normal`;
  } else {
    badge.classList.add('suhu-panas');
    badge.innerHTML = `<span aria-hidden="true">🔥</span> ${state.suhu}°C - Terik`;
  }
}

// 6. Pengendali Kontrol Awan & Kelembapan
function pasangKontrolAwan() {
  const radCerah = document.getElementById('awan-cerah');
  const radMendung = document.getElementById('awan-mendung');
  const radHujan = document.getElementById('awan-hujan');

  if (radCerah) {
    radCerah.addEventListener('change', () => {
      if (radCerah.checked) setelAwan('cerah');
    });
  }
  if (radMendung) {
    radMendung.addEventListener('change', () => {
      if (radMendung.checked) setelAwan('mendung');
    });
  }
  if (radHujan) {
    radHujan.addEventListener('change', () => {
      if (radHujan.checked) setelAwan('hujan');
    });
  }
}

function setelAwan(kondisi) {
  state.awanKondisi = kondisi;
  suara.mainkan('klik');
  perbaruiVisualSimulasi();
  umumkanAria(`Kondisi awan diubah menjadi ${kondisi}.`);
}

// 7. Pengendali Kontrol Hutan & Transpirasi
function pasangKontrolHutan() {
  const switchHutan = document.getElementById('switch-hutan');
  const ketHutan = document.getElementById('ket-hutan');

  if (switchHutan) {
    switchHutan.addEventListener('change', (e) => {
      state.hutanAktif = e.target.checked;
      suara.mainkan('klik');
      if (ketHutan) {
        ketHutan.textContent = state.hutanAktif
          ? 'Pohon menyerap air tanah dan melepas uap air sejuk melalui stomata daun.'
          : 'Hutan gundul! Transpirasi terhenti, air hujan tidak terserap maksimal dan rentan erosi.';
      }
      perbaruiVisualSimulasi();
      umumkanAria(state.hutanAktif ? 'Hutan lebat diaktifkan.' : 'Hutan digundulkan.');
    });
  }
}

// 8. Pembaruan Visual Panggung SVG Berdasarkan State
function perbaruiVisualSimulasi() {
  const panggung = document.getElementById('wadah-panggung-lab');
  const bentukAwan = document.getElementById('bentuk-awan');
  const grupHujan = document.getElementById('grup-hujan');
  const grupHutan = document.getElementById('grup-hutan');
  const grupHutanGundul = document.getElementById('grup-hutan-gundul');
  const partikelTranspirasi = document.getElementById('partikel-transpirasi');
  const partikelEvaporasi = document.getElementById('partikel-evaporasi');
  const matahariMulut = document.getElementById('matahari-mulut');
  const teksLabelAwan = document.getElementById('teks-label-awan');

  // A. Ekspresi & Sinar Matahari
  if (matahariMulut) {
    if (state.suhu <= 15) {
      // Mulut dingin / menggigil
      matahariMulut.setAttribute('d', 'M -10 10 Q -5 5 0 10 Q 5 15 10 10');
    } else if (state.suhu <= 32) {
      // Senyum ramah
      matahariMulut.setAttribute('d', 'M -12 7 Q 0 18 12 7');
    } else {
      // Senyum lebar / tertawa terik
      matahariMulut.setAttribute('d', 'M -14 5 Q 0 25 14 5 Z');
      matahariMulut.setAttribute('fill', '#991B1B');
    }
  }

  // B. Partikel Evaporasi Laut
  if (partikelEvaporasi) {
    if (state.suhu <= 15) {
      partikelEvaporasi.style.opacity = '0.25';
    } else if (state.suhu <= 32) {
      partikelEvaporasi.style.opacity = '0.75';
    } else {
      partikelEvaporasi.style.opacity = '1';
    }
  }

  // C. Hutan & Transpirasi
  if (grupHutan && grupHutanGundul && partikelTranspirasi) {
    if (state.hutanAktif) {
      grupHutan.style.display = 'block';
      grupHutanGundul.style.display = 'none';
      partikelTranspirasi.style.display = state.suhu >= 18 ? 'block' : 'none';
    } else {
      grupHutan.style.display = 'none';
      grupHutanGundul.style.display = 'block';
      partikelTranspirasi.style.display = 'none';
    }
  }

  // D. Cuaca & Awan
  if (panggung) {
    panggung.classList.remove('cuaca-mendung', 'cuaca-hujan');
  }

  if (state.awanKondisi === 'cerah') {
    if (bentukAwan) {
      bentukAwan.setAttribute('fill', 'url(#grad-awan-cerah)');
      bentukAwan.setAttribute('stroke', '#94A3B8');
    }
    if (teksLabelAwan) teksLabelAwan.textContent = '☁️ KONDENSASI';
    if (grupHujan) grupHujan.style.display = 'none';
  } else if (state.awanKondisi === 'mendung') {
    if (panggung) panggung.classList.add('cuaca-mendung');
    if (bentukAwan) {
      bentukAwan.setAttribute('fill', '#64748B');
      bentukAwan.setAttribute('stroke', '#334155');
    }
    if (teksLabelAwan) teksLabelAwan.textContent = '☁️ AWAN MENDUNG';
    if (grupHujan) grupHujan.style.display = 'none';
  } else if (state.awanKondisi === 'hujan') {
    if (panggung) panggung.classList.add('cuaca-hujan');
    if (bentukAwan) {
      bentukAwan.setAttribute('fill', '#334155');
      bentukAwan.setAttribute('stroke', '#0F172A');
    }
    if (teksLabelAwan) teksLabelAwan.textContent = '🌧️ AWAN JENUH';
    if (grupHujan) grupHujan.style.display = 'block';
  }
}

// 9. Hotspot Interaktif di Panggung SVG
function pasangHotspotPanggung() {
  const hotspotMap = [
    { el: document.getElementById('grup-matahari'), kunci: 'matahari' },
    { el: document.getElementById('grup-laut'), kunci: 'laut' },
    { el: document.getElementById('grup-hutan'), kunci: 'hutan' },
    { el: document.getElementById('grup-awan'), kunci: 'awan' },
    { el: document.getElementById('grup-hujan'), kunci: 'hujan' },
    { el: document.getElementById('grup-tanah-dalam'), kunci: 'tanah' }
  ];

  hotspotMap.forEach(({ el, kunci }) => {
    if (!el) return;

    const aktifkan = () => {
      tampilkanDetailTahap(kunci);
      suara.mainkan('klik');
    };

    el.addEventListener('click', aktifkan);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        aktifkan();
      }
    });
  });
}

function tampilkanDetailTahap(kunci) {
  const data = TAHAPAN_SAINS[kunci];
  if (!data) return;

  const detailJudul = document.getElementById('detail-judul');
  const detailIkon = document.getElementById('detail-ikon');
  const detailBadge = document.getElementById('detail-tahap-badge');
  const detailTeks = document.getElementById('detail-teks');
  const balonTeks = document.getElementById('balon-ucapan-lab');

  if (detailJudul) detailJudul.textContent = data.judul;
  if (detailIkon) detailIkon.textContent = data.ikon;
  if (detailBadge) detailBadge.textContent = data.badge;
  if (detailTeks) detailTeks.textContent = data.penjelasan;
  if (balonTeks) balonTeks.textContent = data.balonMaskot;

  umumkanAria(`${data.judul}. ${data.penjelasan}`);
}

// 10. Pengendali Misi & Tantangan Lab
function pasangAksiMisi() {
  const btnCekMisi = document.getElementById('btn-cek-misi');
  const btnMisiBerikutnya = document.getElementById('btn-misi-berikutnya');
  const btnResetLab = document.getElementById('btn-reset-lab');
  const btnPanduan = document.getElementById('btn-panduan-lab');

  if (btnCekMisi) {
    btnCekMisi.addEventListener('click', () => {
      verifikasiMisi();
    });
  }

  if (btnMisiBerikutnya) {
    btnMisiBerikutnya.addEventListener('click', () => {
      const modalEl = document.getElementById('modalMisiSelesai');
      if (modalEl) bootstrap.Modal.getInstance(modalEl).hide();

      if (state.misiIndex < DAFTAR_MISI.length - 1) {
        state.misiIndex += 1;
        perbaruiTampilanMisi();
        suara.mainkan('klik');
      } else {
        // Semua misi selesai
        const balonTeks = document.getElementById('balon-ucapan-lab');
        if (balonTeks) {
          balonTeks.textContent = 'Hebat sekali! Kamu telah menyelesaikan seluruh 3 Misi Lab Siklus Air dengan predikat Ilmuwan Cilik Teladan!';
        }
        umumkanAria('Selamat! Seluruh misi lab siklus air telah kamu kuasai.');
      }
    });
  }

  if (btnResetLab) {
    btnResetLab.addEventListener('click', () => {
      setelSuhu(25);
      const radCerah = document.getElementById('awan-cerah');
      if (radCerah) {
        radCerah.checked = true;
        setelAwan('cerah');
      }
      const switchHutan = document.getElementById('switch-hutan');
      if (switchHutan) {
        switchHutan.checked = true;
        state.hutanAktif = true;
      }
      perbaruiVisualSimulasi();
      suara.mainkan('klik');
      umumkanAria('Simulasi lab siklus air telah direset ke kondisi awal.');
    });
  }

  if (btnPanduan) {
    btnPanduan.addEventListener('click', () => {
      const modalEl = document.getElementById('modalPanduanLab');
      if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();
    });
  }
}

function perbaruiTampilanMisi() {
  const misi = DAFTAR_MISI[state.misiIndex];
  if (!misi) return;

  const badgeMisi = document.getElementById('badge-misi-judul');
  const misiJudul = document.getElementById('misi-tujuan-judul');
  const misiPetunjuk = document.getElementById('misi-tujuan-petunjuk');
  const misiXP = document.getElementById('misi-hadiah-xp');

  if (badgeMisi) badgeMisi.textContent = `🧪 Misi ${misi.id} dari ${DAFTAR_MISI.length}`;
  if (misiJudul) misiJudul.textContent = misi.judul;
  if (misiPetunjuk) misiPetunjuk.innerHTML = misi.petunjuk;
  if (misiXP) misiXP.textContent = `+${misi.hadiahXP} XP`;
}

async function verifikasiMisi() {
  const misi = DAFTAR_MISI[state.misiIndex];
  if (!misi) return;

  const berhasil = misi.cekKondisi(state);

  if (berhasil) {
    suara.mainkan('hore');
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    if (!state.misiSelesai[state.misiIndex]) {
      state.misiSelesai[state.misiIndex] = true;
      state.bintangTotal += 1;

      const badgeBintang = document.getElementById('badge-skor-bintang');
      if (badgeBintang) {
        badgeBintang.textContent = `⭐ ${state.bintangTotal} Bintang Sains`;
      }

      // Simpan riwayat aktivitas ke Supabase
      try {
        await supabase.from('activity_results').insert({
          aktivitas_tipe: 'siklus_air',
          aktivitas_id: `misi-${misi.id}`,
          nama_siswa: state.namaMurid,
          kelas: 'Kelas V-A',
          skor: 100,
          total_soal: 1,
          benar: 1,
          percobaan: 1,
          petunjuk_digunakan: 0,
          durasi_detik: 15,
          detail_jawaban: {
            misiId: misi.id,
            misiJudul: misi.judul,
            suhu: state.suhu,
            awan: state.awanKondisi,
            hutan: state.hutanAktif,
            bintangTotal: state.bintangTotal
          }
        });
      } catch (err) {
        console.warn('Gagal menyimpan hasil lab ke Supabase:', err);
      }
    }

    const modalSelesaiJudul = document.getElementById('modal-selesai-judul');
    const modalSelesaiPesan = document.getElementById('modal-selesai-pesan');
    if (modalSelesaiJudul) modalSelesaiJudul.textContent = `Misi ${misi.id} Berhasil!`;
    if (modalSelesaiPesan) modalSelesaiPesan.textContent = misi.pesanBerhasil;

    const modalEl = document.getElementById('modalMisiSelesai');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();

    umumkanAria(`Selamat! ${misi.pesanBerhasil}`);
  } else {
    suara.mainkan('salah');
    const balonTeks = document.getElementById('balon-ucapan-lab');
    if (balonTeks) {
      balonTeks.textContent = misi.pesanBelum;
    }
    umumkanAria(misi.pesanBelum);
  }
}
