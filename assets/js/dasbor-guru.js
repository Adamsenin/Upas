/**
 * KUPAS KUIS IPAS v4.0 - Modul Pengendali Dasbor Guru Profesional (dasbor-guru.js)
 * Mencakup seluruh 11 fitur Fase 2:
 * 1. Ekspor/rekap nilai (.xlsx SheetJS, .csv, .pdf jsPDF+autoTable)
 * 2. Ringkasan statistik & pengaturan KKM dinamis
 * 3. Analisis butir soal (tersulit, termudah, % benar, opsi pengecoh terbanyak)
 * 4. Daftar remedial & siswa perlu perhatian (< KKM atau tidak mengerjakan)
 * 5. Grafik perkembangan nilai per kelas & per siswa (Chart.js)
 * 6. Pemantauan Realtime siswa yang sedang mengerjakan kuis
 * 7. Manajemen kuis (buat, edit, duplikat, arsipkan, acak soal, durasi, jadwal buka/tutup)
 * 8. Bank soal dengan filter bab/topik/kesulitan & impor CSV/Excel
 * 9. Manajemen kelas & siswa (tambah/impor massal, reset kode akses, pindah kelas)
 * 10. Pencarian, filter, urutan, dan pagination di semua tabel
 * 11. Catatan guru per siswa (hanya terlihat guru sesuai RLS)
 */

import { auth } from './auth.js';
import { supabase } from './supabase.js';
import { kuisManager, ambilKolomTabelSoal, buatPayloadSoalAdaptif, normalisasiKunciJawaban } from './kuis.js?v=4.2.0';

if (typeof window !== 'undefined') {
  window.kuisManager = kuisManager;
  window.ambilKolomTabelSoal = ambilKolomTabelSoal;
  window.buatPayloadSoalAdaptif = buatPayloadSoalAdaptif;
  window.normalisasiKunciJawaban = normalisasiKunciJawaban;
}
import { sesiManager } from './sesi.js';
import { pasangHeader, umumkanAria, suara } from './ui.js';
import { konfigurasiManager } from './konfigurasi.js';

// State Global Dasbor
const state = {
  guruAktif: null,
  kkm: Number(localStorage.getItem('kupas_kkm_guru') || 75),
  data: null,
  kuisTerpilihId: null,
  chartKelas: null,
  chartSiswa: null,

  // State Tabel & Paginasi Rekap Nilai
  rekap: {
    cari: '',
    kuisId: 'semua',
    kelas: 'semua',
    mulai: '',
    selesai: '',
    urut: 'tanggal_desc',
    halaman: 1,
    perHalaman: 6
  },

  // State Tabel & Paginasi Analisis Butir Soal
  analisis: {
    cari: '',
    urut: 'persen_asc',
    halaman: 1,
    perHalaman: 6
  },

  // State Tabel & Paginasi Bank Soal
  bank: {
    cari: '',
    bab: 'semua',
    kesulitan: 'semua',
    urut: 'urutan_asc',
    halaman: 1,
    perHalaman: 6
  },

  // State Tabel & Paginasi Siswa & Kelas
  siswa: {
    cari: '',
    kelas: 'semua',
    urut: 'nama_asc',
    halaman: 1,
    perHalaman: 6
  },

  // State Aktivitas & Sertifikat (Fase E)
  aktivitas: {
    ambangSertifikat: Number(localStorage.getItem('kupas_ambang_sertifikat') || 80),
    cariPernyataan: '',
    filterTipe: 'semua',
    filterKesulitan: 'semua',
    halamanPernyataan: 1,
    perHalamanPernyataan: 6,
    filterKelasSertifikat: 'semua',
    daftarPernyataan: [],
    daftarSkenario: [],
    daftarSertifikat: []
  },

  // Filter Daftar Kuis
  filterStatusKuis: 'semua',
  cariKuis: ''
};

// Utilitas Paginasi Umum
function paginasiArray(arr, halaman, perHalaman) {
  const totalItem = arr.length;
  const totalHalaman = Math.max(1, Math.ceil(totalItem / perHalaman));
  const halAman = Math.min(Math.max(1, halaman), totalHalaman);
  const mulai = (halAman - 1) * perHalaman;
  return {
    items: arr.slice(mulai, mulai + perHalaman),
    halaman: halAman,
    totalHalaman,
    totalItem
  };
}

function renderKontrolPaginasi(wadahId, infoPaginasi, onGantiHalaman) {
  const wadah = document.getElementById(wadahId);
  if (!wadah) return;
  const { halaman, totalHalaman, totalItem } = infoPaginasi;

  wadah.innerHTML = `
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3">
      <span class="small fw-bold text-secondary">
        Menampilkan halaman ${halaman} dari ${totalHalaman} (${totalItem} data)
      </span>
      <div class="btn-group" role="group" aria-label="Navigasi halaman tabel">
        <button type="button" class="btn btn-outline-dark btn-sm fw-bold" data-page="${halaman - 1}" ${halaman <= 1 ? 'disabled' : ''}>
          ← Seb.
        </button>
        <button type="button" class="btn btn-outline-dark btn-sm fw-bold" data-page="${halaman + 1}" ${halaman >= totalHalaman ? 'disabled' : ''}>
          Ber. →
        </button>
      </div>
    </div>
  `;

  wadah.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.getAttribute('data-page'), 10);
      onGantiHalaman(p);
    });
  });
}

// ============================================================================
// INISIALISASI DASBOR
// ============================================================================
export async function inisialisasiDasborGuru() {
  pasangHeader('guru', { berandaLink: '../index.html', rootAset: '../' });

  // Route Guard: Pastikan guru telah terotentikasi di Supabase
  state.guruAktif = await auth.periksaAksesGuru();
  if (!state.guruAktif) {
    return;
  }

  const infoEl = document.getElementById('info-guru');
  if (infoEl) {
    const namaGuru = state.guruAktif.user_metadata?.nama || state.guruAktif.email?.split('@')[0] || 'Ibu/Bapak Guru';
    const sekolahGuru = state.guruAktif.user_metadata?.sekolah ? ` (${state.guruAktif.user_metadata.sekolah})` : '';
    infoEl.textContent = `Akun: ${namaGuru}${sekolahGuru}`;
  }

  const inputKKM = document.getElementById('input-kkm-global');
  if (inputKKM) {
    inputKKM.value = state.kkm;
    inputKKM.addEventListener('change', async () => {
      state.kkm = Math.min(100, Math.max(0, parseInt(inputKKM.value, 10) || 75));
      inputKKM.value = state.kkm;
      localStorage.setItem('kupas_kkm_guru', String(state.kkm));
      await muatUlangSemuaData();
      umumkanAria(`Batas KKM diperbarui menjadi ${state.kkm}`);
    });
  }

  pasangEventListeners();
  pasangPendengarRealtime();
  await muatUlangSemuaData();
}

async function muatUlangSemuaData() {
  state.data = await kuisManager.ambilAnalitikLengkap(state.kkm);

  isiPilihanFilterDinamis();
  renderKartuStatistik();
  renderDaftarKuis();
  renderTabelRekap();
  renderAnalisisButirDanRemedial();
  renderGrafikPerkembangan();
  renderPantauRealtime();
  renderBankSoal();
  renderKelasDanSiswa();
  await renderTabAktivitasDanSertifikat();
}

// ============================================================================
// 1. KARTU RINGKASAN STATISTIK
// ============================================================================
function renderKartuStatistik() {
  const rekap = ambilRekapTerfilter();
  const nilaiList = rekap.map(r => r.nilai);
  const jml = nilaiList.length;

  const rata = jml > 0 ? Math.round(nilaiList.reduce((a, b) => a + b, 0) / jml) : 0;
  const tertinggi = jml > 0 ? Math.max(...nilaiList) : 0;
  const terendah = jml > 0 ? Math.min(...nilaiList) : 0;
  const jmlLulus = rekap.filter(r => r.nilai >= state.kkm).length;
  const persenTuntas = jml > 0 ? Math.round((jmlLulus / jml) * 100) : 0;

  const setTeks = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTeks('stat-rata-rata', rata);
  setTeks('stat-tinggi-rendah', `${tertinggi} / ${terendah}`);
  setTeks('stat-ketuntasan', `${persenTuntas}%`);
  setTeks('stat-jumlah-peserta', `${jml} Siswa`);
  setTeks('stat-jumlah-remedial', `${state.data.daftarPerhatian.length} Siswa`);
}

// ============================================================================
// 2. REKAP NILAI & EKSPOR (EXCEL .XLSX, CSV, PDF SIAP CETAK)
// ============================================================================
function isiPilihanFilterDinamis() {
  const { daftarKuis, daftarKelas, daftarSiswa, daftarSoal } = state.data;

  const selKuis = document.getElementById('filter-rekap-kuis');
  if (selKuis && selKuis.options.length <= 1) {
    daftarKuis.forEach(k => {
      const opt = document.createElement('option');
      opt.value = k.id;
      opt.textContent = k.judul;
      selKuis.appendChild(opt);
    });
  }

  const selKelasRekap = document.getElementById('filter-rekap-kelas');
  const selKelasSiswa = document.getElementById('filter-siswa-kelas');
  const selTargetKelasModal = document.getElementById('siswa-input-kelas');
  const namaKelasUnik = Array.from(new Set([
    ...daftarKelas.map(k => k.nama_kelas),
    ...daftarSiswa.map(s => s.nama_kelas)
  ]));

  if (selKelasRekap) {
    const cur = selKelasRekap.value || 'semua';
    selKelasRekap.innerHTML = '<option value="semua">Semua Kelas</option>';
    namaKelasUnik.forEach(nk => {
      selKelasRekap.innerHTML += `<option value="${nk}" ${nk === cur ? 'selected' : ''}>${nk}</option>`;
    });
  }

  if (selKelasSiswa) {
    const cur = selKelasSiswa.value || 'semua';
    selKelasSiswa.innerHTML = '<option value="semua">Semua Kelas</option>';
    namaKelasUnik.forEach(nk => {
      selKelasSiswa.innerHTML += `<option value="${nk}" ${nk === cur ? 'selected' : ''}>${nk}</option>`;
    });
  }

  if (selTargetKelasModal) {
    selTargetKelasModal.innerHTML = namaKelasUnik.map(nk => `<option value="${nk}">${nk}</option>`).join('');
  }

  // Dropdown siswa pada grafik perkembangan
  const selGrafikSiswa = document.getElementById('select-grafik-siswa');
  if (selGrafikSiswa) {
    const cur = selGrafikSiswa.value;
    selGrafikSiswa.innerHTML = daftarSiswa.map(s =>
      `<option value="${s.nama_panggilan}" ${s.nama_panggilan === cur ? 'selected' : ''}>${s.nama_lengkap} (${s.nama_kelas})</option>`
    ).join('');
  }

  // Dropdown bab pada bank soal
  const selBab = document.getElementById('filter-bank-bab');
  if (selBab) {
    const cur = selBab.value || 'semua';
    const babUnik = Array.from(new Set(daftarSoal.map(s => s.bab || 'Bab 1: Rantai Makanan')));
    selBab.innerHTML = '<option value="semua">Semua Bab / Topik</option>';
    babUnik.forEach(b => {
      selBab.innerHTML += `<option value="${b}" ${b === cur ? 'selected' : ''}>${b}</option>`;
    });
  }
}

function ambilRekapTerfilter() {
  if (!state.data) return [];
  const { cari, kuisId, kelas, mulai, selesai, urut } = state.rekap;
  const q = cari.trim().toLowerCase();

  const hasil = state.data.rekapNilai.filter(r => {
    const cocokKuis = kuisId === 'semua' || r.kuis_id === kuisId;
    const cocokKelas = kelas === 'semua' || r.kelas === kelas;
    const cocokCari = !q ||
      r.nama.toLowerCase().includes(q) ||
      r.kelas.toLowerCase().includes(q) ||
      r.kuis.toLowerCase().includes(q);
    const cocokMulai = !mulai || r.tanggal >= mulai;
    const cocokSelesai = !selesai || r.tanggal <= selesai;
    return cocokKuis && cocokKelas && cocokCari && cocokMulai && cocokSelesai;
  });

  hasil.sort((a, b) => {
    if (urut === 'nilai_desc') return b.nilai - a.nilai;
    if (urut === 'nilai_asc') return a.nilai - b.nilai;
    if (urut === 'nama_asc') return a.nama.localeCompare(b.nama);
    return b.tanggal.localeCompare(a.tanggal);
  });

  return hasil;
}

function renderTabelRekap() {
  const tbody = document.getElementById('tabel-rekap-body');
  if (!tbody) return;

  const terfilter = ambilRekapTerfilter();
  const pageInfo = paginasiArray(terfilter, state.rekap.halaman, state.rekap.perHalaman);
  state.rekap.halaman = pageInfo.halaman;

  tbody.innerHTML = '';
  if (pageInfo.items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-secondary">Tidak ada data rekap nilai yang sesuai filter.</td></tr>`;
  } else {
    pageInfo.items.forEach(r => {
      const tr = document.createElement('tr');
      const lulus = r.nilai >= state.kkm;
      tr.innerHTML = `
        <td data-label="Nama" class="fw-bold text-dark">${r.nama}</td>
        <td data-label="Kelas"><span class="badge bg-light text-dark border border-dark">${r.kelas}</span></td>
        <td data-label="Kuis" class="small fw-semibold">${r.kuis}</td>
        <td data-label="Nilai" class="fw-bolder fs-6 ${lulus ? 'text-success' : 'text-danger'}">${r.nilai}</td>
        <td data-label="Benar/Salah" class="small">${r.benar_salah}</td>
        <td data-label="Durasi" class="small">${r.durasi}</td>
        <td data-label="Tanggal" class="small">${r.tanggal}</td>
        <td data-label="Status">
          <span class="badge ${lulus ? 'bg-success' : 'bg-danger'} border border-dark rounded-pill">
            ${lulus ? 'Lulus' : 'Remedial'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderKontrolPaginasi('paginasi-rekap', pageInfo, (p) => {
    state.rekap.halaman = p;
    renderTabelRekap();
  });
}

function formatDataEkspor() {
  const data = ambilRekapTerfilter();
  return data.map(r => ({
    'Nama': r.nama,
    'Kelas': r.kelas,
    'Kuis': r.kuis,
    'Nilai': r.nilai,
    'Benar/Salah': r.benar_salah,
    'Durasi': r.durasi,
    'Tanggal': r.tanggal,
    'Status Lulus/Remedial': r.nilai >= state.kkm ? 'Lulus' : 'Remedial'
  }));
}

function eksporRekapCSV() {
  const rows = formatDataEkspor();
  const header = ['Nama', 'Kelas', 'Kuis', 'Nilai', 'Benar/Salah', 'Durasi', 'Tanggal', 'Status Lulus/Remedial'];
  const csvLines = [
    header.join(','),
    ...rows.map(r => header.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))
  ];
  const blob = new Blob(['\uFEFF' + csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rekap_Nilai_KUPAS_IPAS_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  umumkanAria('Berkas rekap CSV berhasil diunduh.');
}

function eksporRekapExcel() {
  const rows = formatDataEkspor();
  if (window.XLSX && typeof window.XLSX.utils?.json_to_sheet === 'function') {
    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Rekap Nilai IPAS');
    window.XLSX.writeFile(wb, `Rekap_Nilai_KUPAS_IPAS_${new Date().toISOString().slice(0, 10)}.xlsx`);
    umumkanAria('Berkas Excel (.xlsx) berhasil diunduh.');
  } else {
    eksporRekapCSV();
  }
}

function eksporRekapPDF() {
  const rows = formatDataEkspor();
  if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
    const doc = new window.jspdf.jsPDF({ orientation: 'landscape' });
    doc.setFontSize(15);
    doc.text('REKAPITULASI NILAI KUPAS KUIS IPAS KELAS V SD', 14, 15);
    doc.setFontSize(10);
    doc.text(`KKM: ${state.kkm} | Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 22);

    const head = [['Nama', 'Kelas', 'Kuis', 'Nilai', 'Benar/Salah', 'Durasi', 'Tanggal', 'Status Lulus/Remedial']];
    const body = rows.map(r => [
      r['Nama'],
      r['Kelas'],
      r['Kuis'],
      String(r['Nilai']),
      r['Benar/Salah'],
      r['Durasi'],
      r['Tanggal'],
      r['Status Lulus/Remedial']
    ]);

    if (typeof doc.autoTable === 'function') {
      doc.autoTable({
        startY: 27,
        head,
        body,
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] }
      });
    }
    doc.save(`Rekap_Nilai_KUPAS_IPAS_${new Date().toISOString().slice(0, 10)}.pdf`);
    umumkanAria('Berkas PDF siap cetak berhasil diunduh.');
  } else {
    window.print();
  }
}

// ============================================================================
// 3 & 4. ANALISIS BUTIR SOAL & DAFTAR REMEDIAL / PERLU PERHATIAN
// ============================================================================
function renderAnalisisButirDanRemedial() {
  if (!state.data) return;
  const { analisisButir, daftarPerhatian } = state.data;

  // Sorotan Soal Tersulit & Termudah
  const denganJawaban = analisisButir.filter(a => a.total_jawab > 0);
  const urutKesulitan = [...(denganJawaban.length ? denganJawaban : analisisButir)].sort((a, b) => a.persen_benar - b.persen_benar);
  const tersulit = urutKesulitan[0];
  const termudah = urutKesulitan[urutKesulitan.length - 1];

  const elSulit = document.getElementById('info-soal-tersulit');
  if (elSulit && tersulit) {
    elSulit.innerHTML = `
      <span class="badge bg-danger text-white border border-dark mb-1">Soal #${tersulit.nomor} (${tersulit.persen_benar}% Benar)</span>
      <p class="fw-bold text-dark small mb-1">${tersulit.teks}</p>
      <small class="text-secondary d-block">Pengecoh terbanyak: <strong>${tersulit.pengecoh_terbanyak}</strong></small>
    `;
  }

  const elMudah = document.getElementById('info-soal-termudah');
  if (elMudah && termudah) {
    elMudah.innerHTML = `
      <span class="badge bg-success text-white border border-dark mb-1">Soal #${termudah.nomor} (${termudah.persen_benar}% Benar)</span>
      <p class="fw-bold text-dark small mb-1">${termudah.teks}</p>
      <small class="text-secondary d-block">Kunci benar: <strong>${termudah.kunci_label}</strong></small>
    `;
  }

  // Tabel Analisis Butir Soal
  const q = state.analisis.cari.trim().toLowerCase();
  const terfilter = analisisButir.filter(a =>
    !q || a.teks.toLowerCase().includes(q) || a.bab.toLowerCase().includes(q)
  );

  terfilter.sort((a, b) => {
    if (state.analisis.urut === 'persen_asc') return a.persen_benar - b.persen_benar;
    if (state.analisis.urut === 'persen_desc') return b.persen_benar - a.persen_benar;
    return a.nomor - b.nomor;
  });

  const pageInfo = paginasiArray(terfilter, state.analisis.halaman, state.analisis.perHalaman);
  state.analisis.halaman = pageInfo.halaman;

  const tbodyAnalisis = document.getElementById('tabel-analisis-body');
  if (tbodyAnalisis) {
    tbodyAnalisis.innerHTML = '';
    pageInfo.items.forEach(item => {
      const tr = document.createElement('tr');
      const warnaBar = item.persen_benar >= 75 ? 'bg-success' : (item.persen_benar >= 50 ? 'bg-warning' : 'bg-danger');
      tr.innerHTML = `
        <td data-label="No" class="fw-bolder">#${item.nomor}</td>
        <td data-label="Pertanyaan & Bab">
          <div class="fw-bold text-dark small">${item.teks}</div>
          <span class="badge bg-light text-secondary border border-dark mt-1">${item.bab}</span>
        </td>
        <td data-label="Kesulitan">
          <span class="badge ${item.tingkat_kesulitan === 'sulit' ? 'bg-danger' : (item.tingkat_kesulitan === 'mudah' ? 'bg-success' : 'bg-warning text-dark')} border border-dark text-capitalize">
            ${item.tingkat_kesulitan}
          </span>
        </td>
        <td data-label="% Menjawab Benar" style="min-width: 150px;">
          <div class="d-flex align-items-center gap-2">
            <div class="progress flex-grow-1 border border-dark" style="height: 12px;">
              <div class="progress-bar ${warnaBar}" role="progressbar" style="width: ${item.persen_benar}%"></div>
            </div>
            <span class="fw-bolder small">${item.persen_benar}%</span>
          </div>
        </td>
        <td data-label="Opsi Pengecoh Terbanyak" class="small fw-semibold text-danger">${item.pengecoh_terbanyak}</td>
      `;
      tbodyAnalisis.appendChild(tr);
    });
  }

  renderKontrolPaginasi('paginasi-analisis', pageInfo, (p) => {
    state.analisis.halaman = p;
    renderAnalisisButirDanRemedial();
  });

  // Tabel Remedial & Siswa Perlu Perhatian
  const tbodyRemedial = document.getElementById('tabel-remedial-body');
  if (tbodyRemedial) {
    tbodyRemedial.innerHTML = '';
    if (daftarPerhatian.length === 0) {
      tbodyRemedial.innerHTML = `<tr><td colspan="5" class="text-center py-3 text-success fw-bold">🎉 Seluruh siswa telah tuntas KKM!</td></tr>`;
    } else {
      daftarPerhatian.forEach(item => {
        const tr = document.createElement('tr');
        const isBelum = item.kategori === 'Tidak Mengerjakan';
        tr.innerHTML = `
          <td data-label="Nama Siswa" class="fw-bold">${item.nama}</td>
          <td data-label="Kelas"><span class="badge bg-light text-dark border border-dark">${item.kelas}</span></td>
          <td data-label="Nilai Terakhir" class="fw-bolder text-danger">${isBelum ? '-' : item.nilai_terakhir}</td>
          <td data-label="Status Perhatian">
            <span class="badge ${isBelum ? 'bg-secondary' : 'bg-danger'} border border-dark rounded-pill">
              ${item.kategori}
            </span>
          </td>
          <td data-label="Catatan Guru" class="small text-secondary">${item.catatan_guru}</td>
        `;
        tbodyRemedial.appendChild(tr);
      });
    }
  }
}

// ============================================================================
// 5. GRAFIK PERKEMBANGAN NILAI PER KELAS & PER SISWA (CHART.JS)
// ============================================================================
function renderGrafikPerkembangan() {
  if (!state.data || typeof window.Chart === 'undefined') return;
  const { rekapNilai } = state.data;

  // 1. Grafik Perkembangan Rata-rata Kelas per Tanggal
  const tanggalUnik = Array.from(new Set(rekapNilai.map(r => r.tanggal))).sort();
  const kelasUnik = Array.from(new Set(rekapNilai.map(r => r.kelas))).sort();
  const warnaKelas = ['#16A34A', '#0284C7', '#F59E0B', '#8B5CF6'];

  const datasetsKelas = kelasUnik.map((namaKelas, idx) => {
    const dataPerTanggal = tanggalUnik.map(tgl => {
      const cocok = rekapNilai.filter(r => r.kelas === namaKelas && r.tanggal === tgl);
      if (cocok.length === 0) return null;
      return Math.round(cocok.reduce((sum, x) => sum + x.nilai, 0) / cocok.length);
    });
    return {
      label: namaKelas,
      data: dataPerTanggal,
      borderColor: warnaKelas[idx % warnaKelas.length],
      backgroundColor: warnaKelas[idx % warnaKelas.length] + '33',
      borderWidth: 3,
      tension: 0.3,
      spanGaps: true
    };
  });

  const ctxKelas = document.getElementById('chart-perkembangan-kelas');
  if (ctxKelas) {
    if (state.chartKelas) state.chartKelas.destroy();
    state.chartKelas = new window.Chart(ctxKelas, {
      type: 'line',
      data: { labels: tanggalUnik, datasets: datasetsKelas },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100 } }
      }
    });
  }

  // 2. Grafik Perkembangan Individu Siswa
  const selSiswa = document.getElementById('select-grafik-siswa');
  const panggilanTarget = selSiswa ? selSiswa.value : (state.data.daftarSiswa[0]?.nama_panggilan || 'Budi');
  const riwayatIndividu = rekapNilai
    .filter(r => r.nama_panggilan.toLowerCase() === panggilanTarget.toLowerCase())
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const ctxSiswa = document.getElementById('chart-perkembangan-siswa');
  if (ctxSiswa) {
    if (state.chartSiswa) state.chartSiswa.destroy();
    state.chartSiswa = new window.Chart(ctxSiswa, {
      type: 'bar',
      data: {
        labels: riwayatIndividu.map(r => `${r.tanggal} (${r.kode_sesi})`),
        datasets: [
          {
            label: `Nilai ${panggilanTarget}`,
            data: riwayatIndividu.map(r => r.nilai),
            backgroundColor: riwayatIndividu.map(r => r.nilai >= state.kkm ? '#22C55E' : '#F59E0B'),
            borderColor: '#0F172A',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { min: 0, max: 100 } }
      }
    });
  }
}

// ============================================================================
// 6. PEMANTAUAN REALTIME SISWA YANG SEDANG MENGERJAKAN KUIS
// ============================================================================
function pasangPendengarRealtime() {
  const bc = new BroadcastChannel('kupas_postgres_changes');
  bc.onmessage = async () => {
    await muatUlangSemuaData();
  };
}

function renderPantauRealtime() {
  const wadah = document.getElementById('wadah-pantau-realtime');
  if (!wadah || !state.data) return;

  const { sesiList, pesertaList, jawabanList, daftarSoal } = state.data;
  const sesiAktif = sesiList.filter(s => s.status === 'berjalan' || s.status === 'lobi');

  if (sesiAktif.length === 0) {
    wadah.innerHTML = `
      <div class="text-center py-4 text-secondary">
        <p class="mb-2 fw-bold">Belum ada sesi yang sedang berjalan saat ini.</p>
        <small>Mulai sesi dari daftar kuis untuk memantau progres siswa secara langsung.</small>
      </div>
    `;
    return;
  }

  wadah.innerHTML = sesiAktif.map(sesi => {
    const pesertaSesi = pesertaList.filter(p => p.sesi_id === sesi.id);
    const totalSoal = daftarSoal.filter(s => s.kuis_id === sesi.kuis_id).length || 10;

    const barisPeserta = pesertaSesi.map(p => {
      const dijawab = jawabanList.filter(j => j.sesi_id === sesi.id && j.peserta_id === p.id).length;
      const persen = Math.min(100, Math.round((dijawab / totalSoal) * 100));
      return `
        <div class="p-2 bg-white rounded-3 border border-2 border-dark d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="d-flex align-items-center gap-2">
            <img src="../assets/svg/${p.avatar || 'avatar-1.svg'}" width="28" height="28" alt="">
            <div>
              <span class="fw-bolder d-block lh-1">${p.nama_panggilan}</span>
              <small class="text-secondary">${p.kelas || 'Kelas V-A'}</small>
            </div>
          </div>
          <div class="flex-grow-1 mx-md-3" style="min-width: 140px;">
            <div class="d-flex justify-content-between small fw-bold mb-1">
              <span>Progres: ${dijawab}/${totalSoal} soal</span>
              <span>Skor: ${p.skor || 0}</span>
            </div>
            <div class="progress border border-dark" style="height: 12px;">
              <div class="progress-bar bg-success" role="progressbar" style="width: ${persen}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="p-3 bg-light rounded-4 border border-2 border-dark mb-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <span class="badge bg-success border border-dark rounded-pill me-2">LIVE • ${sesi.status.toUpperCase()}</span>
            <strong class="fs-5">Kode Sesi: ${sesi.kode}</strong>
            <span class="text-secondary small ms-2">(${pesertaSesi.length} peserta terhubung)</span>
          </div>
          <a href="sesi.html?kode=${sesi.kode}" class="btn btn-kupas-kuning btn-sm fw-bold">
            🖥️ Buka Layar Kendali Sesi →
          </a>
        </div>
        <div class="d-flex flex-column gap-2">
          ${barisPeserta || '<div class="text-secondary small">Menunggu siswa bergabung ke lobi...</div>'}
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================================
// 7. MANAJEMEN KUIS (BUAT, EDIT, DUPLIKAT, ARSIPKAN, ACAK, DURASI, JADWAL)
// ============================================================================
function renderDaftarKuis() {
  const wadah = document.getElementById('wadah-kuis');
  if (!wadah || !state.data) return;

  const q = state.cariKuis.trim().toLowerCase();
  const daftarKuis = state.data.daftarKuis.filter(k => {
    const cocokStatus = state.filterStatusKuis === 'semua' || k.status === state.filterStatusKuis;
    const cocokCari = !q || k.judul.toLowerCase().includes(q) || (k.topik && k.topik.toLowerCase().includes(q));
    return cocokStatus && cocokCari;
  });

  wadah.innerHTML = '';

  if (daftarKuis.length === 0) {
    wadah.innerHTML = `
      <div class="col-12 text-center py-4">
        <img src="../assets/svg/maskot-berpikir.svg" alt="Maskot Berpikir" width="96" height="96" class="anim-melambai mb-2">
        <h3 class="h5 fw-bold">Tidak Ada Kuis pada Filter Ini</h3>
        <p class="text-secondary small mb-3">Buat kuis baru atau ubah filter status di atas.</p>
        <a href="editor.html" class="btn btn-kupas-hijau btn-sm">+ Buat Kuis Sekarang</a>
      </div>
    `;
    return;
  }

  daftarKuis.forEach((kuis) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    const badgeWarna = kuis.status === 'terbit' ? 'bg-success' : (kuis.status === 'arsip' ? 'bg-dark' : 'bg-secondary');

    col.innerHTML = `
      <div class="kupas-card h-100 d-flex flex-column justify-content-between">
        <div>
          <div class="d-flex justify-content-between align-items-start mb-2 gap-1 flex-wrap">
            <span class="badge ${badgeWarna} border border-dark rounded-pill text-uppercase">
              ${kuis.status || 'terbit'}
            </span>
            <div class="d-flex gap-1 flex-wrap">
              <span class="badge bg-light text-dark border border-dark">KKM: ${kuis.kkm ?? 75}</span>
              <span class="badge bg-light text-dark border border-dark">⏱️ ${kuis.durasi_menit ?? 15}m</span>
              ${kuis.acak_soal ? '<span class="badge bg-warning text-dark border border-dark">🔀 Acak</span>' : ''}
            </div>
          </div>
          <h3 class="h5 fw-bold mb-1 text-dark">${kuis.judul}</h3>
          <p class="text-secondary small mb-2">${kuis.deskripsi || kuis.topik || 'Materi IPAS ekosistem & rantai makanan.'}</p>
          ${kuis.jadwal_buka ? `<div class="small text-secondary mb-2">📅 Jadwal: ${String(kuis.jadwal_buka).replace('T', ' ').slice(0, 16)} s/d ${String(kuis.jadwal_tutup || '-').replace('T', ' ').slice(0, 16)}</div>` : ''}
        </div>

        <div class="pt-3 border-top border-2 border-dark d-flex flex-column gap-2">
          <button class="btn btn-kupas-kuning w-100 fw-bold py-2 smartboard-btn btn-buka-modal" data-id="${kuis.id}">
            ▶ Mulai Sesi Kelas
          </button>
          <div class="d-flex flex-wrap gap-1">
            <a href="editor.html?id=${kuis.id}" class="btn btn-outline-dark fw-bold btn-sm flex-grow-1">Ubah</a>
            <button class="btn btn-outline-dark fw-bold btn-sm flex-grow-1 btn-atur-kuis" data-id="${kuis.id}">⚙️ Jadwal/Acak</button>
            <button class="btn btn-outline-dark fw-bold btn-sm flex-grow-1 btn-duplikat" data-id="${kuis.id}">Duplikat</button>
            <button class="btn btn-outline-secondary fw-bold btn-sm flex-grow-1 btn-arsip" data-id="${kuis.id}" data-status="${kuis.status}">
              ${kuis.status === 'arsip' ? 'Pulihkan' : 'Arsipkan'}
            </button>
            <button class="btn btn-outline-danger fw-bold btn-sm btn-hapus" data-id="${kuis.id}">Hapus</button>
          </div>
        </div>
      </div>
    `;
    wadah.appendChild(col);
  });

  // Hubungkan aksi tombol kartu kuis
  const modalMulai = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalMulaiSesi'));
  wadah.querySelectorAll('.btn-buka-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      state.kuisTerpilihId = btn.getAttribute('data-id');
      modalMulai.show();
    });
  });

  wadah.querySelectorAll('.btn-duplikat').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      await kuisManager.duplikatKuis(btn.getAttribute('data-id'));
      umumkanAria('Kuis berhasil digandakan.');
      await muatUlangSemuaData();
    });
  });

  wadah.querySelectorAll('.btn-arsip').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const st = btn.getAttribute('data-status');
      const targetStatus = st === 'arsip' ? 'terbit' : 'arsip';
      await kuisManager.ubahStatusKuis(id, targetStatus);
      umumkanAria(`Status kuis diubah menjadi ${targetStatus}.`);
      await muatUlangSemuaData();
    });
  });

  wadah.querySelectorAll('.btn-hapus').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Yakin ingin menghapus kuis ini?')) {
        await kuisManager.hapusKuis(id);
        umumkanAria('Kuis berhasil dihapus.');
        await muatUlangSemuaData();
      }
    });
  });

  wadah.querySelectorAll('.btn-atur-kuis').forEach(btn => {
    btn.addEventListener('click', () => {
      const kuis = state.data.daftarKuis.find(k => k.id === btn.getAttribute('data-id'));
      if (!kuis) return;
      document.getElementById('atur-kuis-id').value = kuis.id;
      document.getElementById('atur-kuis-judul').value = kuis.judul;
      document.getElementById('atur-kuis-kkm').value = kuis.kkm ?? 75;
      document.getElementById('atur-kuis-durasi').value = kuis.durasi_menit ?? 15;
      document.getElementById('atur-kuis-acak').checked = Boolean(kuis.acak_soal);
      document.getElementById('atur-kuis-buka').value = (kuis.jadwal_buka || '').slice(0, 16);
      document.getElementById('atur-kuis-tutup').value = (kuis.jadwal_tutup || '').slice(0, 16);
      bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAturKuis')).show();
    });
  });
}

// ============================================================================
// 8. BANK SOAL & IMPOR CSV / EXCEL
// ============================================================================
function renderBankSoal() {
  const tbody = document.getElementById('tabel-bank-soal-body');
  if (!tbody || !state.data) return;

  const { cari, bab, kesulitan, urut } = state.bank;
  const q = cari.trim().toLowerCase();

  const terfilter = state.data.daftarSoal.filter(s => {
    const cocokBab = bab === 'semua' || (s.bab || 'Bab 1: Rantai Makanan') === bab;
    const cocokKesulitan = kesulitan === 'semua' || (s.tingkat_kesulitan || 'sedang') === kesulitan;
    const cocokCari = !q || s.teks.toLowerCase().includes(q) || (s.bab && s.bab.toLowerCase().includes(q));
    return cocokBab && cocokKesulitan && cocokCari;
  });

  terfilter.sort((a, b) => {
    if (urut === 'poin_desc') return (b.poin || 10) - (a.poin || 10);
    if (urut === 'kesulitan') return (a.tingkat_kesulitan || '').localeCompare(b.tingkat_kesulitan || '');
    return (a.urutan || 0) - (b.urutan || 0);
  });

  const pageInfo = paginasiArray(terfilter, state.bank.halaman, state.bank.perHalaman);
  state.bank.halaman = pageInfo.halaman;

  tbody.innerHTML = '';
  if (pageInfo.items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-secondary">Tidak ada soal yang cocok dengan filter.</td></tr>`;
  } else {
    pageInfo.items.forEach((s, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="No" class="fw-bold">#${s.urutan || idx + 1}</td>
        <td data-label="Bab / Topik"><span class="badge bg-light text-dark border border-dark">${s.bab || 'Bab 1: Rantai Makanan'}</span></td>
        <td data-label="Pertanyaan" class="fw-semibold text-dark small">${s.teks}</td>
        <td data-label="Tipe" class="small text-capitalize">${(s.tipe || 'pilihan_ganda').replace('_', ' ')}</td>
        <td data-label="Kesulitan">
          <span class="badge ${s.tingkat_kesulitan === 'sulit' ? 'bg-danger' : (s.tingkat_kesulitan === 'mudah' ? 'bg-success' : 'bg-warning text-dark')} border border-dark text-capitalize">
            ${s.tingkat_kesulitan || 'sedang'}
          </span>
        </td>
        <td data-label="Aksi" class="text-md-center">
          <a href="editor.html?id=${s.kuis_id || 'kuis-ekosistem-1'}" class="btn btn-outline-dark btn-sm fw-bold">Edit</a>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderKontrolPaginasi('paginasi-bank-soal', pageInfo, (p) => {
    state.bank.halaman = p;
    renderBankSoal();
  });
}

function parseCSVKeObjek(teksCSV) {
  if (!teksCSV) return [];
  const baris = teksCSV.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (baris.length < 2) return [];
  const pemisah = baris[0].includes(';') ? ';' : ',';
  const splitBaris = (line) => {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === pemisah && !inQuotes) {
        res.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return res;
  };

  const headers = splitBaris(baris[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return baris.slice(1).map(line => {
    const cols = splitBaris(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
}

// ============================================================================
// 9 & 11. MANAJEMEN KELAS, SISWA & CATATAN GURU
// ============================================================================
function renderKelasDanSiswa() {
  if (!state.data) return;
  const { daftarKelas, daftarSiswa } = state.data;

  // Render chip daftar kelas
  const wadahKelas = document.getElementById('daftar-kelas-chips');
  if (wadahKelas) {
    wadahKelas.innerHTML = daftarKelas.map(k => {
      const jmlSiswa = daftarSiswa.filter(s => s.nama_kelas === k.nama_kelas).length;
      return `
        <div class="kupas-badge bg-white">
          <span>🏫 ${k.nama_kelas}</span>
          <span class="badge bg-success rounded-pill">${jmlSiswa} siswa</span>
        </div>
      `;
    }).join('');
  }

  // Filter & Urutkan Tabel Siswa
  const { cari, kelas, urut } = state.siswa;
  const q = cari.trim().toLowerCase();

  const terfilter = daftarSiswa.filter(s => {
    const cocokKelas = kelas === 'semua' || s.nama_kelas === kelas;
    const cocokCari = !q ||
      s.nama_lengkap.toLowerCase().includes(q) ||
      s.nama_panggilan.toLowerCase().includes(q) ||
      (s.catatan_guru && s.catatan_guru.toLowerCase().includes(q));
    return cocokKelas && cocokCari;
  });

  terfilter.sort((a, b) => {
    if (urut === 'kelas_asc') return a.nama_kelas.localeCompare(b.nama_kelas);
    if (urut === 'nama_desc') return b.nama_lengkap.localeCompare(a.nama_lengkap);
    return a.nama_lengkap.localeCompare(b.nama_lengkap);
  });

  const pageInfo = paginasiArray(terfilter, state.siswa.halaman, state.siswa.perHalaman);
  state.siswa.halaman = pageInfo.halaman;

  const tbody = document.getElementById('tabel-siswa-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const pilihanKelas = Array.from(new Set(daftarKelas.map(k => k.nama_kelas)));

  pageInfo.items.forEach(s => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Nama Siswa">
        <div class="d-flex align-items-center gap-2 justify-content-end justify-content-md-start">
          <img src="../assets/svg/${s.avatar || 'avatar-1.svg'}" width="28" height="28" alt="">
          <div class="text-end text-md-start">
            <div class="fw-bold text-dark">${s.nama_lengkap}</div>
            <small class="text-secondary">Panggilan: ${s.nama_panggilan}</small>
          </div>
        </div>
      </td>
      <td data-label="Kelas">
        <select class="form-select form-select-sm border-2 border-dark fw-bold select-pindah-kelas" data-id="${s.id}" style="min-width: 125px;" aria-label="Pindah kelas untuk ${s.nama_lengkap}">
          ${pilihanKelas.map(nk => `<option value="${nk}" ${nk === s.nama_kelas ? 'selected' : ''}>${nk}</option>`).join('')}
        </select>
      </td>
      <td data-label="Kode Akses">
        <div class="d-inline-flex align-items-center gap-1">
          <code class="px-2 py-1 bg-light border border-dark rounded fw-bolder text-dark">${s.kode_akses}</code>
          <button type="button" class="btn btn-outline-dark btn-sm btn-reset-kode" data-id="${s.id}" title="Reset Kode Akses">🔄</button>
        </div>
      </td>
      <td data-label="Catatan Guru (Privat)">
        <div class="d-flex align-items-center gap-1">
          <input type="text" class="form-control form-control-sm border-2 border-dark input-catatan-guru" data-id="${s.id}" value="${(s.catatan_guru || '').replace(/"/g, '&quot;')}" placeholder="Tulis catatan perkembangan...">
          <button type="button" class="btn btn-kupas-hijau btn-sm btn-simpan-catatan" data-id="${s.id}">💾</button>
        </div>
      </td>
      <td data-label="Aksi" class="text-md-center">
        <button type="button" class="btn btn-outline-danger btn-sm fw-bold btn-hapus-siswa" data-id="${s.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Event listeners baris siswa
  tbody.querySelectorAll('.select-pindah-kelas').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = sel.getAttribute('data-id');
      await kuisManager.pindahKelasSiswa(id, sel.value);
      suara.mainkan('klik');
      umumkanAria(`Siswa dipindahkan ke ${sel.value}`);
      await muatUlangSemuaData();
    });
  });

  tbody.querySelectorAll('.btn-reset-kode').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const kodeBaru = await kuisManager.resetKodeAksesSiswa(id);
      suara.mainkan('benar');
      umumkanAria(`Kode akses siswa berhasil direset menjadi ${kodeBaru}`);
      await muatUlangSemuaData();
    });
  });

  tbody.querySelectorAll('.btn-simpan-catatan').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const inp = tbody.querySelector(`.input-catatan-guru[data-id="${id}"]`);
      if (!inp) return;
      await kuisManager.simpanCatatanGuru(id, inp.value.trim());
      suara.mainkan('benar');
      umumkanAria('Catatan guru berhasil disimpan.');
      await muatUlangSemuaData();
    });
  });

  tbody.querySelectorAll('.btn-hapus-siswa').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (confirm('Hapus data siswa ini?')) {
        await kuisManager.hapusSiswa(id);
        await muatUlangSemuaData();
      }
    });
  });

  renderKontrolPaginasi('paginasi-siswa', pageInfo, (p) => {
    state.siswa.halaman = p;
    renderKelasDanSiswa();
  });
}

// ============================================================================
// PENGHUBUNG EVENT LISTENER UTAMA
// ============================================================================
function pasangEventListeners() {
  // Keluar Guru
  const btnKeluar = document.getElementById('btn-keluar');
  if (btnKeluar) {
    btnKeluar.addEventListener('click', async () => {
      if (confirm('Apakah Anda yakin ingin keluar dari akun Guru?')) {
        await auth.keluarGuru();
        window.location.href = 'masuk.html';
      }
    });
  }

  // Konfirmasi Mulai Sesi Kelas (Mulai Langsung vs Mulai Bersama)
  const btnMulaiSesi = document.getElementById('btn-konfirmasi-mulai');
  const radiosJalur = document.querySelectorAll('input[name="jalurPelaksanaan"]');
  radiosJalur.forEach(r => {
    r.addEventListener('change', () => {
      if (!btnMulaiSesi) return;
      if (r.value === 'langsung') {
        btnMulaiSesi.innerHTML = '▶ Mulai Langsung di Layar Ini →';
        btnMulaiSesi.className = 'btn btn-kupas-hijau fw-bold px-4 py-2 smartboard-btn fs-6 shadow-sm';
      } else {
        btnMulaiSesi.innerHTML = '📱 Buka Lobi Sesi Siswa →';
        btnMulaiSesi.className = 'btn btn-kupas-kuning fw-bold px-4 py-2 smartboard-btn fs-6 shadow-sm';
      }
    });
  });

  if (btnMulaiSesi) {
    btnMulaiSesi.addEventListener('click', async () => {
      const mode = document.querySelector('input[name="modePermainan"]:checked')?.value || 'custom';
      const pengali = parseFloat(document.getElementById('pengaliWaktu')?.value) || 1.0;
      const jalur = document.querySelector('input[name="jalurPelaksanaan"]:checked')?.value || 'langsung';
      btnMulaiSesi.disabled = true;
      btnMulaiSesi.textContent = 'Menyiapkan Kuis...';
      try {
        const targetId = state.kuisTerpilihId || state.data?.daftarKuis[0]?.id || 'kuis-ekosistem-1';
        const sesi = await sesiManager.buatSesi(targetId, state.guruAktif.id, mode, pengali);
        if (jalur === 'langsung') {
          window.location.href = `sesi.html?kode=${sesi.kode}&langsung=1`;
        } else {
          window.location.href = `sesi.html?kode=${sesi.kode}`;
        }
      } catch (err) {
        btnMulaiSesi.disabled = false;
        btnMulaiSesi.textContent = jalur === 'langsung' ? '▶ Mulai Langsung di Layar Ini →' : '📱 Buka Lobi Sesi Siswa →';
        alert('Gagal membuat sesi: ' + err.message);
      }
    });
  }

  // Filter Rekap Nilai
  const hubungkanFilterRekap = (id, prop) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', () => {
      state.rekap[prop] = el.value;
      state.rekap.halaman = 1;
      renderKartuStatistik();
      renderTabelRekap();
    });
  };
  hubungkanFilterRekap('filter-rekap-siswa', 'cari');
  hubungkanFilterRekap('filter-rekap-kuis', 'kuisId');
  hubungkanFilterRekap('filter-rekap-kelas', 'kelas');
  hubungkanFilterRekap('filter-rekap-mulai', 'mulai');
  hubungkanFilterRekap('filter-rekap-selesai', 'selesai');
  hubungkanFilterRekap('sort-rekap', 'urut');

  // Tombol Ekspor Excel, CSV, PDF
  document.getElementById('btn-ekspor-excel')?.addEventListener('click', eksporRekapExcel);
  document.getElementById('btn-ekspor-csv')?.addEventListener('click', eksporRekapCSV);
  document.getElementById('btn-ekspor-pdf')?.addEventListener('click', eksporRekapPDF);

  // Grafik Siswa Selector
  document.getElementById('select-grafik-siswa')?.addEventListener('change', renderGrafikPerkembangan);

  // Filter Analisis Butir Soal
  document.getElementById('cari-analisis-soal')?.addEventListener('input', (e) => {
    state.analisis.cari = e.target.value;
    state.analisis.halaman = 1;
    renderAnalisisButirDanRemedial();
  });
  document.getElementById('sort-analisis-soal')?.addEventListener('change', (e) => {
    state.analisis.urut = e.target.value;
    renderAnalisisButirDanRemedial();
  });

  // Filter Manajemen Kuis
  document.getElementById('filter-status-kuis')?.addEventListener('change', (e) => {
    state.filterStatusKuis = e.target.value;
    renderDaftarKuis();
  });
  document.getElementById('cari-daftar-kuis')?.addEventListener('input', (e) => {
    state.cariKuis = e.target.value;
    renderDaftarKuis();
  });

  // Simpan Pengaturan Cepat Kuis (Modal Jadwal/Acak/KKM/Durasi)
  document.getElementById('btn-simpan-atur-kuis')?.addEventListener('click', async () => {
    const id = document.getElementById('atur-kuis-id').value;
    const kuis = state.data.daftarKuis.find(k => k.id === id);
    if (!kuis) return;

    await kuisManager.simpanKuis({
      ...kuis,
      judul: document.getElementById('atur-kuis-judul').value.trim() || kuis.judul,
      kkm: parseInt(document.getElementById('atur-kuis-kkm').value, 10) || 75,
      durasi_menit: parseInt(document.getElementById('atur-kuis-durasi').value, 10) || 15,
      acak_soal: document.getElementById('atur-kuis-acak').checked,
      jadwal_buka: document.getElementById('atur-kuis-buka').value,
      jadwal_tutup: document.getElementById('atur-kuis-tutup').value
    });

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAturKuis')).hide();
    suara.mainkan('benar');
    umumkanAria('Pengaturan jadwal dan acak soal kuis berhasil disimpan.');
    await muatUlangSemuaData();
  });

  // Filter Bank Soal
  document.getElementById('cari-bank-soal')?.addEventListener('input', (e) => {
    state.bank.cari = e.target.value;
    state.bank.halaman = 1;
    renderBankSoal();
  });
  document.getElementById('filter-bank-bab')?.addEventListener('change', (e) => {
    state.bank.bab = e.target.value;
    state.bank.halaman = 1;
    renderBankSoal();
  });
  document.getElementById('filter-bank-kesulitan')?.addEventListener('change', (e) => {
    state.bank.kesulitan = e.target.value;
    state.bank.halaman = 1;
    renderBankSoal();
  });
  document.getElementById('sort-bank-soal')?.addEventListener('change', (e) => {
    state.bank.urut = e.target.value;
    renderBankSoal();
  });

  // Impor Bank Soal dari CSV / Excel
  const inputImporSoal = document.getElementById('input-impor-soal');
  if (inputImporSoal) {
    inputImporSoal.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        let rows = [];
        if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
          const text = await file.text();
          rows = parseCSVKeObjek(text);
        } else if (window.XLSX) {
          const buf = await file.arrayBuffer();
          const wb = window.XLSX.read(buf, { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          rows = window.XLSX.utils.sheet_to_json(sheet);
        }

        const targetId = state.kuisTerpilihId || state.data?.daftarKuis?.[0]?.id || 'kuis-ekosistem-1';
        const jml = await kuisManager.imporSoalMassal(targetId, rows);
        suara.mainkan('benar');
        umumkanAria(`${jml} soal berhasil diimpor ke bank soal.`);
        alert(`Berhasil mengimpor ${jml} butir soal ke Bank Soal!`);
        inputImporSoal.value = '';
        await muatUlangSemuaData();
      } catch (err) {
        alert('Gagal mengimpor berkas soal: ' + err.message);
      }
    });
  }

  // Unduh Template CSV Bank Soal
  document.getElementById('btn-template-soal')?.addEventListener('click', () => {
    const contoh = [
      'bab,tingkat_kesulitan,tipe,teks,opsi_a,opsi_b,opsi_c,opsi_d,kunci,penjelasan,waktu_detik,poin',
      '"Bab 1: Rantai Makanan",mudah,pilihan_ganda,"Konsumen tingkat I yang memakan tumbuhan hijau disebut...",Herbivora,Karnivora,Omnivora,Dekomposer,0,"Herbivora adalah hewan pemakan tumbuhan.",30,10'
    ].join('\n');
    const blob = new Blob(['\uFEFF' + contoh], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Template_Impor_Bank_Soal_KUPAS.csv';
    a.click();
  });

  // Filter Siswa & Kelas
  document.getElementById('cari-daftar-siswa')?.addEventListener('input', (e) => {
    state.siswa.cari = e.target.value;
    state.siswa.halaman = 1;
    renderKelasDanSiswa();
  });
  document.getElementById('filter-siswa-kelas')?.addEventListener('change', (e) => {
    state.siswa.kelas = e.target.value;
    state.siswa.halaman = 1;
    renderKelasDanSiswa();
  });
  document.getElementById('sort-daftar-siswa')?.addEventListener('change', (e) => {
    state.siswa.urut = e.target.value;
    renderKelasDanSiswa();
  });

  // Tambah Kelas Baru
  document.getElementById('form-tambah-kelas')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const inp = document.getElementById('input-nama-kelas-baru');
    const nama = inp.value.trim();
    if (!nama) return;
    await kuisManager.tambahKelas({ nama_kelas: nama, guru_id: state.guruAktif.id });
    inp.value = '';
    suara.mainkan('benar');
    umumkanAria(`Kelas ${nama} berhasil ditambahkan.`);
    await muatUlangSemuaData();
  });

  // Simpan Siswa Baru / Massal
  document.getElementById('btn-simpan-siswa-modal')?.addEventListener('click', async () => {
    const namaKelas = document.getElementById('siswa-input-kelas').value || 'Kelas V-A';
    const teksMassal = document.getElementById('siswa-input-massal').value.trim();
    if (!teksMassal) return;

    const baris = teksMassal.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const objekSiswa = baris.map(b => {
      const parts = b.split(',').map(x => x.trim());
      return {
        nama_lengkap: parts[0],
        nama_panggilan: parts[1] || parts[0].split(' ')[0],
        nama_kelas: parts[2] || namaKelas,
        catatan_guru: parts[3] || ''
      };
    });

    const jml = await kuisManager.imporSiswaMassal(objekSiswa, namaKelas, state.guruAktif.id);
    document.getElementById('siswa-input-massal').value = '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTambahSiswa')).hide();
    suara.mainkan('benar');
    umumkanAria(`${jml} siswa berhasil ditambahkan.`);
    await muatUlangSemuaData();
  });

  // Event Listeners Tab Aktivitas & Sertifikat (Fase E)
  // 1. Simpan Ambang Batas Sertifikat
  document.getElementById('btn-simpan-ambang-sertifikat')?.addEventListener('click', () => {
    const val = Number(document.getElementById('input-ambang-batas-sertifikat')?.value) || 80;
    state.aktivitas.ambangSertifikat = val;
    localStorage.setItem('kupas_ambang_sertifikat', String(val));
    suara.mainkan('benar');
    umumkanAria(`Batas kelulusan sertifikat berhasil disimpan: ${val}%.`);
  });

  // 2. Filter & Pencarian Pernyataan Fakta/Opini
  document.getElementById('cari-pernyataan-guru')?.addEventListener('input', (e) => {
    state.aktivitas.cariPernyataan = e.target.value.trim();
    state.aktivitas.halamanPernyataan = 1;
    renderTabelPernyataanGuru();
  });

  document.getElementById('filter-tipe-pernyataan')?.addEventListener('change', (e) => {
    state.aktivitas.filterTipe = e.target.value;
    state.aktivitas.halamanPernyataan = 1;
    renderTabelPernyataanGuru();
  });

  document.getElementById('filter-kesulitan-pernyataan')?.addEventListener('change', (e) => {
    state.aktivitas.filterKesulitan = e.target.value;
    state.aktivitas.halamanPernyataan = 1;
    renderTabelPernyataanGuru();
  });

  // 3. Tambah Pernyataan Baru (Modal)
  document.getElementById('btn-tambah-pernyataan-modal')?.addEventListener('click', () => {
    bukaModalEditPernyataan(null);
  });

  // 4. Simpan Form Pernyataan (Tambah/Ubah)
  document.getElementById('btn-simpan-pernyataan')?.addEventListener('click', async () => {
    const id = document.getElementById('form-pernyataan-id')?.value;
    const teks = document.getElementById('form-pernyataan-teks')?.value.trim();
    const tipe = document.getElementById('form-pernyataan-tipe')?.value || 'fakta';
    const kesulitan = document.getElementById('form-pernyataan-kesulitan')?.value || 'sedang';
    const topik = document.getElementById('form-pernyataan-topik')?.value.trim() || 'Ekosistem';
    const penjelasan = document.getElementById('form-pernyataan-penjelasan')?.value.trim() || '';

    if (!teks || !penjelasan) {
      alert('Teks pernyataan dan penjelasan edukatif wajib diisi!');
      return;
    }

    if (id) {
      await supabase.from('fact_opinion_statements').update({
        pernyataan: teks,
        tipe,
        tingkat_kesulitan: kesulitan,
        topik,
        penjelasan
      }).eq('id', id);
      umumkanAria('Pernyataan berhasil diperbarui.');
    } else {
      await supabase.from('fact_opinion_statements').insert({
        guru_id: state.guruAktif.id,
        pernyataan: teks,
        tipe,
        tingkat_kesulitan: kesulitan,
        topik,
        penjelasan,
        status: 'terbit'
      });
      umumkanAria('Pernyataan baru berhasil ditambahkan.');
    }

    const modalEl = document.getElementById('modalPernyataanGuru');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).hide();
    suara.mainkan('benar');
    await renderTabAktivitasDanSertifikat();
  });

  // 5. Filter Kelas Rekap Sertifikat Murid
  document.getElementById('filter-kelas-sertifikat')?.addEventListener('change', (e) => {
    state.aktivitas.filterKelasSertifikat = e.target.value;
    renderTabelSertifikatGuru();
  });
}

// ============================================================================
// 7. TAB KELOLA AKTIVITAS & SERTIFIKAT (FASE E)
// ============================================================================
async function renderTabAktivitasDanSertifikat() {
  try {
    const [resPernyataan, resSkenario, resSertif] = await Promise.all([
      supabase.from('fact_opinion_statements').select(),
      supabase.from('food_chain_scenarios').select(),
      supabase.from('certificates').select()
    ]);

    state.aktivitas.daftarPernyataan = resPernyataan.data || [];
    state.aktivitas.daftarSkenario = resSkenario.data || [];
    state.aktivitas.daftarSertifikat = resSertif.data || [];
  } catch (e) {
    console.warn('Gagal memuat data aktivitas & sertifikat:', e);
  }

  const inputAmbang = document.getElementById('input-ambang-batas-sertifikat');
  if (inputAmbang) {
    inputAmbang.value = state.aktivitas.ambangSertifikat;
  }

  renderTabelPernyataanGuru();
  renderDaftarSkenarioGuru();
  renderTabelSertifikatGuru();
}

function renderTabelPernyataanGuru() {
  const tbody = document.getElementById('tabel-pernyataan-body');
  if (!tbody) return;

  let list = [...state.aktivitas.daftarPernyataan];

  if (state.aktivitas.cariPernyataan) {
    const q = state.aktivitas.cariPernyataan.toLowerCase();
    list = list.filter(p => (p.pernyataan && p.pernyataan.toLowerCase().includes(q)) || (p.topik && p.topik.toLowerCase().includes(q)));
  }

  if (state.aktivitas.filterTipe !== 'semua') {
    list = list.filter(p => p.tipe === state.aktivitas.filterTipe);
  }

  if (state.aktivitas.filterKesulitan !== 'semua') {
    list = list.filter(p => p.tingkat_kesulitan === state.aktivitas.filterKesulitan);
  }

  const pageInfo = paginasiArray(list, state.aktivitas.halamanPernyataan, state.aktivitas.perHalamanPernyataan);
  state.aktivitas.halamanPernyataan = pageInfo.halaman;

  tbody.innerHTML = '';
  if (pageInfo.items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-secondary">Tidak ada pernyataan yang cocok dengan filter.</td></tr>`;
  } else {
    pageInfo.items.forEach((p, idx) => {
      const nomor = (pageInfo.halaman - 1) * state.aktivitas.perHalamanPernyataan + idx + 1;
      const tr = document.createElement('tr');
      const badgeTipe = p.tipe === 'fakta' ? 'bg-success' : 'bg-warning text-dark';
      const badgeKesulitan = p.tingkat_kesulitan === 'sulit' ? 'bg-danger' : (p.tingkat_kesulitan === 'mudah' ? 'bg-success' : 'bg-warning text-dark');

      tr.innerHTML = `
        <td data-label="No" class="fw-bold">#${nomor}</td>
        <td data-label="Pernyataan">
          <div class="fw-bold text-dark">${p.pernyataan}</div>
          <span class="badge bg-light text-secondary border border-dark mt-1">${p.status || 'terbit'}</span>
        </td>
        <td data-label="Tipe">
          <span class="badge ${badgeTipe} border border-dark text-uppercase">${p.tipe}</span>
        </td>
        <td data-label="Kesulitan">
          <span class="badge ${badgeKesulitan} border border-dark text-capitalize">${p.tingkat_kesulitan}</span>
        </td>
        <td data-label="Topik" class="small fw-semibold text-secondary">${p.topik || '-'}</td>
        <td data-label="Penjelasan" class="small text-secondary">${p.penjelasan}</td>
        <td data-label="Aksi" class="text-center">
          <div class="btn-group btn-group-sm">
            <button type="button" class="btn btn-outline-dark btn-edit-pernyataan" data-id="${p.id}" title="Ubah pernyataan">
              ✏️
            </button>
            <button type="button" class="btn btn-outline-danger btn-hapus-pernyataan" data-id="${p.id}" title="Hapus pernyataan">
              🗑️
            </button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  tbody.querySelectorAll('.btn-edit-pernyataan').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.getAttribute('data-id');
      const item = state.aktivitas.daftarPernyataan.find(x => x.id === id);
      if (item) bukaModalEditPernyataan(item);
    });
  });

  tbody.querySelectorAll('.btn-hapus-pernyataan').forEach(b => {
    b.addEventListener('click', async () => {
      const id = b.getAttribute('data-id');
      if (confirm('Yakin ingin menghapus butir pernyataan ini?')) {
        await supabase.from('fact_opinion_statements').delete().eq('id', id);
        suara.mainkan('benar');
        umumkanAria('Pernyataan berhasil dihapus.');
        await renderTabAktivitasDanSertifikat();
      }
    });
  });

  renderKontrolPaginasi('paginasi-pernyataan', pageInfo, (p) => {
    state.aktivitas.halamanPernyataan = p;
    renderTabelPernyataanGuru();
  });
}

function bukaModalEditPernyataan(item = null) {
  const modalEl = document.getElementById('modalPernyataanGuru');
  if (!modalEl) return;

  document.getElementById('form-pernyataan-id').value = item ? item.id : '';
  document.getElementById('form-pernyataan-teks').value = item ? item.pernyataan : '';
  document.getElementById('form-pernyataan-tipe').value = item ? item.tipe : 'fakta';
  document.getElementById('form-pernyataan-kesulitan').value = item ? item.tingkat_kesulitan : 'sedang';
  document.getElementById('form-pernyataan-topik').value = item ? item.topik : 'Ekosistem';
  document.getElementById('form-pernyataan-penjelasan').value = item ? item.penjelasan : '';

  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

function renderDaftarSkenarioGuru() {
  const container = document.getElementById('daftar-skenario-guru');
  if (!container) return;

  const ikonPeta = { sawah: '🌾', kolam: '💧', hutan: '🌲', laut: '🌊', kebun: '🌻', sungai: '🏞️' };
  container.innerHTML = state.aktivitas.daftarSkenario.map(s => {
    const cards = Array.isArray(s.kartu_makhluk) ? s.kartu_makhluk : JSON.parse(s.kartu_makhluk || '[]');
    return `
      <div class="col-12 col-md-6 col-lg-3">
        <div class="kupas-card p-3 bg-white h-100 d-flex flex-column justify-content-between">
          <div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="fs-3" aria-hidden="true">${ikonPeta[s.ekosistem] || '🌿'}</span>
              <span class="badge bg-success text-white border border-dark rounded-pill">${s.status}</span>
            </div>
            <h3 class="h6 fw-bolder text-dark mb-1">${s.judul}</h3>
            <p class="small text-secondary mb-2">${s.deskripsi}</p>
            <div class="small fw-bold text-dark mb-3">
              🃏 Jumlah Kartu: <strong>${cards.length} Organisme</strong>
            </div>
          </div>
          <a href="../rantai-makanan.html" class="btn btn-outline-dark btn-sm fw-bold w-100 smartboard-btn">
            👁️ Coba Skenario Siswa
          </a>
        </div>
      </div>
    `;
  }).join('');
}

function renderTabelSertifikatGuru() {
  const tbody = document.getElementById('tabel-sertifikat-guru-body');
  if (!tbody) return;

  let list = [...state.aktivitas.daftarSertifikat];
  if (state.aktivitas.filterKelasSertifikat !== 'semua') {
    list = list.filter(c => c.kelas === state.aktivitas.filterKelasSertifikat);
  }

  tbody.innerHTML = '';
  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-secondary">Belum ada murid yang memperoleh sertifikat di kelas ini.</td></tr>`;
  } else {
    list.forEach(c => {
      const tgl = new Date(c.tanggal_terbit || c.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td data-label="No. Sertifikat" class="font-monospace fw-bold text-dark small">${c.nomor_sertifikat}</td>
        <td data-label="Nama Murid" class="fw-bolder">${c.nama_siswa}</td>
        <td data-label="Kelas"><span class="badge bg-light text-dark border border-dark">${c.kelas || 'Kelas V-A'}</span></td>
        <td data-label="Aktivitas">${c.nama_kuis_topik}</td>
        <td data-label="Nilai"><span class="badge bg-success text-white border border-dark">${c.nilai} / 100</span></td>
        <td data-label="Tanggal Terbit" class="small text-secondary">${tgl}</td>
        <td data-label="Aksi" class="text-center">
          <button type="button" class="btn btn-outline-dark btn-sm fw-bold btn-cetak-sertif-guru" data-id="${c.id}" title="Cetak PDF">
            📥 PDF
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-cetak-sertif-guru').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        const cert = state.aktivitas.daftarSertifikat.find(x => x.id === id);
        if (cert) unduhPDFSertifikatGuru(cert);
      });
    });
  }
}

function unduhPDFSertifikatGuru(cert) {
  if (!window.jspdf || !window.jspdf.jsPDF) return;
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const tgl = new Date(cert.tanggal_terbit || cert.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setDrawColor(22, 101, 52); doc.setLineWidth(2.5); doc.rect(10, 10, 277, 190);
  doc.setDrawColor(245, 158, 11); doc.setLineWidth(1.2); doc.rect(14, 14, 269, 182);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(22, 101, 52);
  doc.text('KUPAS KUIS IPAS • KURIKULUM MERDEKA KELAS V SD', 148.5, 30, { align: 'center' });

  doc.setFontSize(28); doc.setTextColor(15, 23, 42);
  doc.text('SERTIFIKAT PENGHARGAAN', 148.5, 44, { align: 'center' });

  doc.setFontSize(16); doc.setTextColor(217, 119, 6);
  doc.text('🌿 PENYELAMAT EKOSISTEM 🌿', 148.5, 54, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(12); doc.setTextColor(100, 116, 139);
  doc.text('Sertifikat ini dengan bangga diberikan kepada:', 148.5, 72, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(22, 101, 52);
  doc.text(cert.nama_siswa, 148.5, 87, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(51, 65, 85);
  doc.text(`Siswa ${cert.kelas || 'Kelas V-A'} atas pemahaman istimewa dalam menyelesaikan:`, 148.5, 105, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setTextColor(15, 23, 42);
  doc.text(`"${cert.nama_kuis_topik}"`, 148.5, 116, { align: 'center' });

  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(217, 119, 6);
  doc.text(`Capaian Nilai: ${cert.nilai} / 100 (Status: TUNTAS KKM)`, 148.5, 128, { align: 'center' });

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(100, 116, 139);
  doc.text(`No. Sertifikat : ${cert.nomor_sertifikat}`, 25, 160);
  doc.text(`Diterbitkan     : ${tgl}`, 25, 167);
  doc.text(`Verifikasi       : Sah di Sistem KUPAS IPAS v4.0`, 25, 174);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(51, 65, 85);
  doc.text('Guru Pembimbing IPAS,', 225, 150, { align: 'center' });
  doc.setDrawColor(100, 116, 139); doc.setLineWidth(0.6); doc.line(195, 176, 255, 176);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(15, 23, 42);
  doc.text(cert.nama_guru || 'Ibu Guru IPAS', 225, 182, { align: 'center' });

  doc.save(`Sertifikat_${(cert.nama_siswa || 'Siswa').replace(/\s+/g, '_')}.pdf`);
}

