/**
 * KUPAS KUIS IPAS v4.0 - Objek Konfigurasi Pengaturan Permainan Terpusat (konfigurasi.js)
 * Menyimpan parameter kuis untuk Guru SD:
 * 1. Soal: jumlah soal, topik materi, tingkat kesulitan, acak urutan soal, acak urutan jawaban.
 * 2. Waktu: batas waktu per soal (termasuk opsi tanpa batas), durasi jeda antar soal.
 * 3. Poin: bobot poin per jawaban benar, bonus kecepatan, pengurangan poin salah.
 * 4. Sesi: kuota peserta maksimal, izin gabung saat kuis berjalan, mode sesi, visibilitas papan peringkat.
 * 5. Tampilan & Suara: SFX/audio default, tingkat gerak animasi, ukuran teks smartboard.
 * 6. Umpan Balik: tampilkan kunci jawaban benar, tampilkan penjelasan edukatif.
 */

export const STORAGE_KEY_PENGATURAN = 'kupas_pengaturan_kuis';

export const DEFAULT_PENGATURAN = Object.freeze({
  // 1. Soal
  jumlah_soal: 0, // 0 = Semua soal yang tersedia (default)
  topik: 'semua', // 'semua' atau nama Bab spesifik
  tingkat_kesulitan: 'semua', // 'semua' | 'mudah' | 'sedang' | 'sulit'
  acak_soal: false,
  acak_jawaban: true,

  // 2. Waktu
  batas_waktu: 'otomatis', // 'otomatis' (dari soal) | 0 (tanpa batas) | 15 | 20 | 30 | 45 | 60 (detik)
  jeda_antar_soal: 'manual', // 'manual' (diklik guru) | 3 | 5 | 10 (detik otomatis)

  // 3. Poin
  poin_benar: 10,
  bonus_kecepatan: false,
  penalti_salah: false,

  // 4. Sesi
  maks_peserta: 0, // 0 = Tanpa batas kuota
  izinkan_gabung_setelah_mulai: true,
  mode_sesi: 'custom', // 'custom' (individu) | 'adventure' (kolaborasi kelas)
  tampilkan_peringkat: 'selama_kuis', // 'selama_kuis' | 'akhir_saja' | 'sembunyikan'

  // 5. Tampilan & Suara
  sfx_aktif: true,
  tingkat_gerak: 'penuh', // 'penuh' | 'sedang' | 'tenang'
  ukuran_teks: 'normal', // 'normal' | 'besar' (untuk smartboard / layar proyektor besar)

  // 6. Umpan Balik
  tampilkan_kunci_jawaban: true,
  tampilkan_penjelasan: true
});

export const DAFTAR_TOPIK_MATERI = [
  { id: 'semua', label: 'Semua Materi (Campuran Bab 1-4)' },
  { id: 'Bab 1: Rantai Makanan', label: 'Bab 1: Rantai Makanan & Jaring-Jaring Makanan' },
  { id: 'Bab 2: Ekosistem & Habitat', label: 'Bab 2: Ekosistem & Habitat Alami' },
  { id: 'Bab 3: Interaksi & Simbiosis', label: 'Bab 3: Interaksi Antarmakhluk Hidup & Simbiosis' },
  { id: 'Bab 4: Dampak Perubahan Lingkungan', label: 'Bab 4: Dampak Perubahan Lingkungan & Konservasi' }
];


/**
 * Mengacak urutan pilihan jawaban menggunakan algoritma Fisher-Yates murni.
 * Opsi khusus seperti "Semua jawaban benar" atau "Tidak ada yang benar"
 * akan selalu dipertahankan di posisi paling akhir.
 * @param {Array<string>} opsiArray - Array teks pilihan jawaban
 * @returns {Array<{ teks: string, originalIndex: number, id: string }>}
 */
export function acakPilihanJawaban(opsiArray) {
  if (!Array.isArray(opsiArray) || opsiArray.length === 0) return [];

  const items = opsiArray.map((teks, idx) => ({
    teks,
    originalIndex: idx,
    id: String(idx)
  }));

  // Deteksi opsi yang harus tetap di posisi terakhir
  const regexTetapAkhir = /(semua.*(benar|salah)|tidak ada.*(benar|salah)|semua pilihan)/i;
  const normalItems = [];
  const akhirItems = [];

  for (const item of items) {
    if (regexTetapAkhir.test(item.teks)) {
      akhirItems.push(item);
    } else {
      normalItems.push(item);
    }
  }

  // Fisher-Yates Shuffle murni
  for (let i = normalItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [normalItems[i], normalItems[j]] = [normalItems[j], normalItems[i]];
  }

  return [...normalItems, ...akhirItems];
}

export const konfigurasiManager = {
  /**
   * Mengambil konfigurasi aktif dari localStorage, di-merge dengan DEFAULT_PENGATURAN
   */
  ambilPengaturan() {
    try {
      const tersimpan = localStorage.getItem(STORAGE_KEY_PENGATURAN);
      if (!tersimpan) {
        return { ...DEFAULT_PENGATURAN };
      }
      const parsed = JSON.parse(tersimpan);
      return { ...DEFAULT_PENGATURAN, ...parsed };
    } catch (err) {
      console.warn('[Konfigurasi] Gagal membaca konfigurasi lokal, menggunakan default:', err);
      return { ...DEFAULT_PENGATURAN };
    }
  },

  /**
   * Memvalidasi data input pengaturan dengan pesan ramah berbahasa Indonesia
   */
  validasiPengaturan(data) {
    if (data.jumlah_soal !== undefined) {
      const jml = Number(data.jumlah_soal);
      if (isNaN(jml) || jml < 0 || jml > 50) {
        return { valid: false, pesan: 'Jumlah soal harus berupa angka antara 0 (Semua) sampai 50 butir.' };
      }
    }

    if (data.poin_benar !== undefined) {
      const poin = Number(data.poin_benar);
      if (isNaN(poin) || poin < 5 || poin > 500) {
        return { valid: false, pesan: 'Poin per jawaban benar harus antara 5 sampai 500 poin.' };
      }
    }

    if (data.maks_peserta !== undefined) {
      const maks = Number(data.maks_peserta);
      if (isNaN(maks) || maks < 0 || maks > 200) {
        return { valid: false, pesan: 'Batas peserta maksimal harus antara 0 (Tanpa batas) sampai 200 siswa.' };
      }
    }

    if (data.batas_waktu !== undefined && data.batas_waktu !== 'otomatis') {
      const bw = Number(data.batas_waktu);
      if (isNaN(bw) || bw < 0 || bw > 300) {
        return { valid: false, pesan: 'Batas waktu per soal harus antara 0 (Tanpa batas) sampai 300 detik.' };
      }
    }

    return { valid: true, pesan: '' };
  },

  /**
   * Menyimpan konfigurasi ke localStorage setelah divalidasi
   */
  simpanPengaturan(pengaturanBaru) {
    const validasi = this.validasiPengaturan(pengaturanBaru);
    if (!validasi.valid) {
      throw new Error(validasi.pesan);
    }

    const gabungan = {
      ...this.ambilPengaturan(),
      ...pengaturanBaru
    };

    try {
      localStorage.setItem(STORAGE_KEY_PENGATURAN, JSON.stringify(gabungan));
      return gabungan;
    } catch (err) {
      console.error('[Konfigurasi] Gagal menyimpan ke localStorage:', err);
      throw new Error('Gagal menyimpan pengaturan ke memori peramban.');
    }
  },

  /**
   * Mengembalikan semua parameter ke nilai default bawaan aplikasi
   */
  resetPengaturan() {
    try {
      localStorage.setItem(STORAGE_KEY_PENGATURAN, JSON.stringify(DEFAULT_PENGATURAN));
      return { ...DEFAULT_PENGATURAN };
    } catch (err) {
      console.error('[Konfigurasi] Gagal mereset pengaturan:', err);
      throw new Error('Gagal mengembalikan pengaturan ke awal.');
    }
  },

  /**
   * Menghasilkan teks ringkasan singkat parameter terpilih untuk ditampilkan di lobi
   */
  buatTeksRingkasan(cfg) {
    const config = cfg || this.ambilPengaturan();
    const list = [];

    // Soal
    const teksSoal = config.jumlah_soal > 0 ? `${config.jumlah_soal} Soal` : 'Semua Soal';
    list.push(`📝 ${teksSoal}`);

    // Topik
    if (config.topik !== 'semua') {
      const topLabel = DAFTAR_TOPIK_MATERI.find(t => t.id === config.topik)?.label || config.topik;
      list.push(`🌿 ${topLabel.split(':')[0] || topLabel}`);
    }

    // Waktu
    if (config.batas_waktu === 'otomatis') {
      list.push('⏱️ Waktu Otomatis');
    } else if (Number(config.batas_waktu) === 0) {
      list.push('⏱️ Waktu Bebas');
    } else {
      list.push(`⏱️ ${config.batas_waktu} dtk/soal`);
    }

    // Peringkat
    if (config.tampilkan_peringkat === 'akhir_saja') {
      list.push('🏆 Peringkat: Akhir Saja');
    } else if (config.tampilkan_peringkat === 'sembunyikan') {
      list.push('🏆 Peringkat: Disembunyikan');
    } else {
      list.push('🏆 Peringkat Tiap Soal');
    }

    // Poin
    if (config.poin_benar && config.poin_benar !== 10) {
      list.push(`⭐ ${config.poin_benar} Poin`);
    }

    // Suara & Teks
    if (!config.sfx_aktif) list.push('🔇 Suara Bisu');
    if (config.ukuran_teks === 'besar') list.push('📺 Smartboard');

    return list;
  },

  /**
   * Memasang elemen modal Pengaturan Game ke halaman dan menghubungkan event-nya
   */
  pasangModalPengaturan(opsi = {}) {
    const { onTersimpan, isReadOnly = false } = opsi;
    let modalEl = document.getElementById('modalPengaturanGame');

    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'modalPengaturanGame';
      modalEl.className = 'modal fade';
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('aria-labelledby', 'labelModalPengaturanGame');
      modalEl.setAttribute('aria-hidden', 'true');
      document.body.appendChild(modalEl);
    }

    const cfg = this.ambilPengaturan();

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div class="modal-content border-3 border-dark rounded-4 shadow-lg overflow-hidden" style="background-color: #FFFFFF;">
          <div class="modal-header border-bottom border-2 border-dark py-3 px-3 px-md-4" style="background-color: var(--kupas-cream-bg, #FFF6E0);">
            <div class="d-flex align-items-center gap-2">
              <span class="fs-3" aria-hidden="true">⚙️</span>
              <div>
                <h2 class="modal-title h5 fw-bolder mb-0 text-dark" id="labelModalPengaturanGame">Pengaturan Parameter Permainan</h2>
                <small class="text-secondary">Sesuaikan aturan main kuis untuk kelas Bapak/Ibu Guru.</small>
              </div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Tutup panel pengaturan"></button>
          </div>

          <div class="modal-body p-3 p-md-4" style="background-color: #FFFFFF;">
            ${isReadOnly ? `
              <div class="alert alert-warning border border-2 border-dark d-flex align-items-center gap-3 mb-4 rounded-4" role="alert">
                <span class="fs-2" aria-hidden="true">🔒</span>
                <div>
                  <strong class="d-block text-dark">Mode Hanya-Baca: Kuis Sedang Berjalan</strong>
                  <span class="small text-secondary">Pengaturan permainan terkunci dan hanya dapat diubah sebelum kuis dimulai demi menjaga keadilan kompetisi kelas.</span>
                </div>
              </div>
            ` : ''}

            <div id="alert-pesan-pengaturan" class="alert alert-danger d-none border border-2 border-dark rounded-4 mb-3" role="alert"></div>

            <!-- Accordion 6 Kategori Pengaturan -->
            <div class="accordion border-0 d-flex flex-column gap-2" id="accordionPengaturanGame">
              
              <!-- 1. SOAL -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingSoal">
                  <button class="accordion-button fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSoal" aria-expanded="true" aria-controls="collapseSoal">
                    <span class="me-2 fs-5">📝</span> 1. Butir Soal & Materi
                  </button>
                </h3>
                <div id="collapseSoal" class="accordion-collapse collapse show" aria-labelledby="headingSoal" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="cfg-jumlah-soal" class="form-label fw-bold small text-dark">Jumlah Soal per Sesi</label>
                        <select id="cfg-jumlah-soal" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="0" ${cfg.jumlah_soal === 0 ? 'selected' : ''}>Semua Soal yang Tersedia (Default)</option>
                          <option value="5" ${cfg.jumlah_soal === 5 ? 'selected' : ''}>5 Soal (Kuis Kilat)</option>
                          <option value="10" ${cfg.jumlah_soal === 10 ? 'selected' : ''}>10 Soal (Standar Kelas)</option>
                          <option value="15" ${cfg.jumlah_soal === 15 ? 'selected' : ''}>15 Soal (Pendalaman Materi)</option>
                          <option value="20" ${cfg.jumlah_soal === 20 ? 'selected' : ''}>20 Soal (Ujian Lengkap)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Pilih berapa banyak butir pertanyaan yang akan dijawab siswa.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <label for="cfg-topik" class="form-label fw-bold small text-dark">Pilihan Materi / Topik IPAS</label>
                        <select id="cfg-topik" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          ${DAFTAR_TOPIK_MATERI.map(t => `<option value="${t.id}" ${cfg.topik === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
                        </select>
                        <small class="text-secondary d-block mt-1">Fokuskan kuis pada satu bab spesifik atau campur seluruh materi.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <label for="cfg-kesulitan" class="form-label fw-bold small text-dark">Tingkat Kesulitan</label>
                        <select id="cfg-kesulitan" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="semua" ${cfg.tingkat_kesulitan === 'semua' ? 'selected' : ''}>Semua Kesulitan (Campuran)</option>
                          <option value="mudah" ${cfg.tingkat_kesulitan === 'mudah' ? 'selected' : ''}>Mudah Saja</option>
                          <option value="sedang" ${cfg.tingkat_kesulitan === 'sedang' ? 'selected' : ''}>Sedang Saja</option>
                          <option value="sulit" ${cfg.tingkat_kesulitan === 'sulit' ? 'selected' : ''}>Sulit Saja (Tantangan)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Sesuaikan bobot kesulitan soal dengan kesiapan belajar murid.</small>
                      </div>

                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-acak-soal">🔀 Acak Urutan Soal</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-acak-soal" ${cfg.acak_soal ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Urutan soal akan diacak pada setiap sesi kuis baru.</small>
                      </div>

                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-acak-jawaban">🔀 Acak Urutan Jawaban</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-acak-jawaban" ${cfg.acak_jawaban !== false ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Pilihan jawaban (A, B, C, D) akan diacak per siswa (default: Aktif).</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2. WAKTU -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingWaktu">
                  <button class="accordion-button collapsed fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapseWaktu" aria-expanded="false" aria-controls="collapseWaktu">
                    <span class="me-2 fs-5">⏱️</span> 2. Batas Waktu & Jeda Transisi
                  </button>
                </h3>
                <div id="collapseWaktu" class="accordion-collapse collapse" aria-labelledby="headingWaktu" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="cfg-batas-waktu" class="form-label fw-bold small text-dark">Batas Waktu per Soal</label>
                        <select id="cfg-batas-waktu" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="otomatis" ${cfg.batas_waktu === 'otomatis' ? 'selected' : ''}>Otomatis (Bawaan Soal, 20-30 dtk)</option>
                          <option value="15" ${String(cfg.batas_waktu) === '15' ? 'selected' : ''}>15 Detik (Cepat / Refleks)</option>
                          <option value="20" ${String(cfg.batas_waktu) === '20' ? 'selected' : ''}>20 Detik</option>
                          <option value="30" ${String(cfg.batas_waktu) === '30' ? 'selected' : ''}>30 Detik (Disarankan)</option>
                          <option value="45" ${String(cfg.batas_waktu) === '45' ? 'selected' : ''}>45 Detik (Membaca Teliti)</option>
                          <option value="60" ${String(cfg.batas_waktu) === '60' ? 'selected' : ''}>60 Detik (1 Menit Santai)</option>
                          <option value="0" ${String(cfg.batas_waktu) === '0' ? 'selected' : ''}>Tanpa Batas Waktu (Bebas)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Beri waktu yang pas agar siswa dapat berpikir tanpa terburu-buru.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <label for="cfg-jeda" class="form-label fw-bold small text-dark">Durasi Jeda Antar Soal</label>
                        <select id="cfg-jeda" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="manual" ${cfg.jeda_antar_soal === 'manual' ? 'selected' : ''}>Manual (Guru Mengklik Tombol Lanjut)</option>
                          <option value="3" ${String(cfg.jeda_antar_soal) === '3' ? 'selected' : ''}>Otomatis 3 Detik</option>
                          <option value="5" ${String(cfg.jeda_antar_soal) === '5' ? 'selected' : ''}>Otomatis 5 Detik</option>
                          <option value="10" ${String(cfg.jeda_antar_soal) === '10' ? 'selected' : ''}>Otomatis 10 Detik</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Pilih apakah guru mengontrol laju soal atau berpindah otomatis.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 3. POIN -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingPoin">
                  <button class="accordion-button collapsed fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapsePoin" aria-expanded="false" aria-controls="collapsePoin">
                    <span class="me-2 fs-5">⭐</span> 3. Poin & Penilaian
                  </button>
                </h3>
                <div id="collapsePoin" class="accordion-collapse collapse" aria-labelledby="headingPoin" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="cfg-poin-benar" class="form-label fw-bold small text-dark">Poin Dasar per Jawaban Benar</label>
                        <select id="cfg-poin-benar" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="10" ${cfg.poin_benar === 10 ? 'selected' : ''}>10 Poin (Standar)</option>
                          <option value="20" ${cfg.poin_benar === 20 ? 'selected' : ''}>20 Poin</option>
                          <option value="50" ${cfg.poin_benar === 50 ? 'selected' : ''}>50 Poin</option>
                          <option value="100" ${cfg.poin_benar === 100 ? 'selected' : ''}>100 Poin (Skor Besar)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Besaran nilai yang didapat murid setiap menjawab pertanyaan dengan benar.</small>
                      </div>

                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-bonus-kecepatan">⚡ Bonus Kecepatan Menjawab</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-bonus-kecepatan" ${cfg.bonus_kecepatan ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Beri nilai tambahan jika siswa menjawab benar dalam waktu cepat.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 4. SESI & PESERTA -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingSesi">
                  <button class="accordion-button collapsed fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSesi" aria-expanded="false" aria-controls="collapseSesi">
                    <span class="me-2 fs-5">👥</span> 4. Sesi, Peserta & Peringkat
                  </button>
                </h3>
                <div id="collapseSesi" class="accordion-collapse collapse" aria-labelledby="headingSesi" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="cfg-maks-peserta" class="form-label fw-bold small text-dark">Jumlah Peserta Maksimal</label>
                        <select id="cfg-maks-peserta" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="0" ${cfg.maks_peserta === 0 ? 'selected' : ''}>Tanpa Batas Kuota (Default)</option>
                          <option value="15" ${cfg.maks_peserta === 15 ? 'selected' : ''}>Maksimal 15 Siswa</option>
                          <option value="25" ${cfg.maks_peserta === 25 ? 'selected' : ''}>Maksimal 25 Siswa</option>
                          <option value="35" ${cfg.maks_peserta === 35 ? 'selected' : ''}>Maksimal 35 Siswa (1 Kelas SD)</option>
                          <option value="50" ${cfg.maks_peserta === 50 ? 'selected' : ''}>Maksimal 50 Siswa</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Batasi kuota siswa yang dapat masuk ke sesi agar kelas kondusif.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <label for="cfg-tampilkan-peringkat" class="form-label fw-bold small text-dark">Tampilkan Papan Peringkat</label>
                        <select id="cfg-tampilkan-peringkat" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="selama_kuis" ${cfg.tampilkan_peringkat === 'selama_kuis' ? 'selected' : ''}>Tiap Selesai Soal (Kompetisi Aktif)</option>
                          <option value="akhir_saja" ${cfg.tampilkan_peringkat === 'akhir_saja' ? 'selected' : ''}>Hanya di Akhir Kuis (Fokus Belajar)</option>
                          <option value="sembunyikan" ${cfg.tampilkan_peringkat === 'sembunyikan' ? 'selected' : ''}>Sembunyikan Papan Peringkat</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Tentukan kapan podium juara dan skor sementara ditampilkan ke murid.</small>
                      </div>

                      <div class="col-12">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-izinkan-gabung">🚪 Izinkan Siswa Bergabung Setelah Kuis Dimulai</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-izinkan-gabung" ${cfg.izinkan_gabung_setelah_mulai ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block mt-1">Bila dimatikan, murid yang terlambat tidak bisa masuk setelah guru menekan mulai.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 5. TAMPILAN & SUARA -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingTampilan">
                  <button class="accordion-button collapsed fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTampilan" aria-expanded="false" aria-controls="collapseTampilan">
                    <span class="me-2 fs-5">🎨</span> 5. Tampilan Layar & Suara
                  </button>
                </h3>
                <div id="collapseTampilan" class="accordion-collapse collapse" aria-labelledby="headingTampilan" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <label for="cfg-ukuran-teks" class="form-label fw-bold small text-dark">Ukuran Teks Layar Guru</label>
                        <select id="cfg-ukuran-teks" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="normal" ${cfg.ukuran_teks === 'normal' ? 'selected' : ''}>Normal (Layar Laptop / Tablet Guru)</option>
                          <option value="besar" ${cfg.ukuran_teks === 'besar' ? 'selected' : ''}>Besar (Smartboard / Proyektor Kelas)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Perbesar teks pertanyaan dan kode sesi agar terbaca jelas dari belakang kelas.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <label for="cfg-tingkat-gerak" class="form-label fw-bold small text-dark">Tingkat Gerak Animasi</label>
                        <select id="cfg-tingkat-gerak" class="form-select border-2 border-dark fw-semibold" style="min-height: 48px;" ${isReadOnly ? 'disabled' : ''}>
                          <option value="penuh" ${cfg.tingkat_gerak === 'penuh' ? 'selected' : ''}>Penuh (Ceria & Bergerak Aktif)</option>
                          <option value="sedang" ${cfg.tingkat_gerak === 'sedang' ? 'selected' : ''}>Sedang (Transisi Halus)</option>
                          <option value="tenang" ${cfg.tingkat_gerak === 'tenang' ? 'selected' : ''}>Tenang (Minimalis & Tanpa Gerak Cepat)</option>
                        </select>
                        <small class="text-secondary d-block mt-1">Sesuaikan kenyamanan visual animasi untuk anak berkebutuhan khusus.</small>
                      </div>

                      <div class="col-12">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-sfx-aktif">🔊 Efek Suara Ceria (SFX)</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-sfx-aktif" ${cfg.sfx_aktif ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block mt-1">Mainkan efek suara menyenangkan saat jawaban masuk, pembahasan, dan perayaan.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 6. UMPAN BALIK -->
              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">
                <h3 class="accordion-header" id="headingFeedback">
                  <button class="accordion-button collapsed fw-bold text-dark py-3" style="min-height: 48px;" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFeedback" aria-expanded="false" aria-controls="collapseFeedback">
                    <span class="me-2 fs-5">💡</span> 6. Umpan Balik & Pembahasan Siswa
                  </button>
                </h3>
                <div id="collapseFeedback" class="accordion-collapse collapse" aria-labelledby="headingFeedback" data-bs-parent="#accordionPengaturanGame">
                  <div class="accordion-body bg-white p-3 p-md-4">
                    <div class="row g-3">
                      <div class="col-12 col-md-6">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-tampilkan-kunci">🔑 Tampilkan Jawaban Benar</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-tampilkan-kunci" ${cfg.tampilkan_kunci_jawaban ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Beri tahu siswa pilihan jawaban yang benar langsung setelah soal selesai.</small>
                      </div>

                      <div class="col-12 col-md-6">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-tampilkan-penjelasan">📖 Tampilkan Penjelasan Materi</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-tampilkan-penjelasan" ${cfg.tampilkan_penjelasan ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Tampilkan kotak penjelasan konsep IPAS dan tautan kamus belajar.</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <div class="modal-footer border-top border-2 border-dark d-flex flex-wrap justify-content-between gap-2 p-3 px-3 px-md-4" style="background-color: var(--kupas-cream-bg, #FFF6E0);">
            ${isReadOnly ? `
              <button type="button" class="btn btn-outline-dark fw-bold px-4 py-2" data-bs-dismiss="modal" style="min-height: 48px;">Tutup</button>
            ` : `
              <button type="button" id="btn-reset-pengaturan" class="btn btn-outline-danger fw-bold py-2 px-3" style="min-height: 48px;">
                🔄 Kembalikan ke Pengaturan Awal
              </button>
              <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-dark fw-bold px-3 py-2" data-bs-dismiss="modal" style="min-height: 48px;">Batal</button>
                <button type="button" id="btn-simpan-pengaturan" class="btn btn-kupas-hijau fw-bold px-4 py-2 smartboard-btn" style="min-height: 48px;">
                  ✓ Simpan Pengaturan
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    // Event Listener Simpan & Reset jika tidak read-only
    if (!isReadOnly) {
      const btnSimpan = modalEl.querySelector('#btn-simpan-pengaturan');
      const btnReset = modalEl.querySelector('#btn-reset-pengaturan');
      const alertEl = modalEl.querySelector('#alert-pesan-pengaturan');

      const tampilkanPesanError = (pesan) => {
        alertEl.textContent = pesan;
        alertEl.classList.remove('d-none');
      };

      if (btnSimpan) {
        btnSimpan.addEventListener('click', () => {
          alertEl.classList.add('d-none');
          try {
            const dataBaru = {
              jumlah_soal: Number(document.getElementById('cfg-jumlah-soal').value) || 0,
              topik: document.getElementById('cfg-topik').value || 'semua',
              tingkat_kesulitan: document.getElementById('cfg-kesulitan').value || 'semua',
              acak_soal: document.getElementById('cfg-acak-soal').checked,
              acak_jawaban: document.getElementById('cfg-acak-jawaban') ? document.getElementById('cfg-acak-jawaban').checked : true,
              batas_waktu: document.getElementById('cfg-batas-waktu').value === 'otomatis' ? 'otomatis' : Number(document.getElementById('cfg-batas-waktu').value),
              jeda_antar_soal: document.getElementById('cfg-jeda').value,
              poin_benar: Number(document.getElementById('cfg-poin-benar').value) || 10,
              bonus_kecepatan: document.getElementById('cfg-bonus-kecepatan').checked,
              maks_peserta: Number(document.getElementById('cfg-maks-peserta').value) || 0,
              tampilkan_peringkat: document.getElementById('cfg-tampilkan-peringkat').value,
              izinkan_gabung_setelah_mulai: document.getElementById('cfg-izinkan-gabung').checked,
              ukuran_teks: document.getElementById('cfg-ukuran-teks').value,
              tingkat_gerak: document.getElementById('cfg-tingkat-gerak').value,
              sfx_aktif: document.getElementById('cfg-sfx-aktif').checked,
              tampilkan_kunci_jawaban: document.getElementById('cfg-tampilkan-kunci').checked,
              tampilkan_penjelasan: document.getElementById('cfg-tampilkan-penjelasan').checked
            };

            const tersimpan = this.simpanPengaturan(dataBaru);

            // Tutup modal bootstrap
            if (window.bootstrap && window.bootstrap.Modal) {
              const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
              if (modalInstance) modalInstance.hide();
            }

            if (typeof onTersimpan === 'function') {
              onTersimpan(tersimpan);
            }
          } catch (err) {
            tampilkanPesanError(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
          }
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', () => {
          const yakin = confirm('Apakah Bapak/Ibu guru yakin ingin mengembalikan semua parameter permainan ke pengaturan standar awal?');
          if (yakin) {
            const res = this.resetPengaturan();
            if (window.bootstrap && window.bootstrap.Modal) {
              const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
              if (modalInstance) modalInstance.hide();
            }
            if (typeof onTersimpan === 'function') {
              onTersimpan(res);
            }
          }
        });
      }
    }

    return modalEl;
  },

  /**
   * Membuka modal pengaturan langsung
   */
  bukaModalPengaturan(opsi = {}) {
    const modalEl = this.pasangModalPengaturan(opsi);
    if (window.bootstrap && window.bootstrap.Modal) {
      const modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }
};

if (typeof window !== 'undefined') {
  window.konfigurasiManager = konfigurasiManager; window.acakPilihanJawaban = acakPilihanJawaban;
}
