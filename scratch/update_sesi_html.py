import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('guru/sesi.html', 'r', encoding='utf-8') as f:
    sesi_html = f.read()

# 1. Update Lobby button in HTML
target_lobi_btn = '''      <div class="d-flex justify-content-center gap-3">
        <button id="btn-mulai-kuis" class="btn btn-kupas-hijau btn-lg px-5 py-3 fs-3 smartboard-btn anim-denyut" disabled>
          ▶ Mulai Kuis Sekarang
        </button>
      </div>'''

repl_lobi_btn = '''      <div class="d-flex flex-wrap justify-content-center gap-3">
        <button id="btn-buka-pengaturan-lobi" type="button" class="btn btn-kupas-kuning btn-lg px-4 py-3 fs-5 fw-bold smartboard-btn shadow-sm" title="Ubah parameter permainan sebelum kuis dimulai">
          ⚙️ Pengaturan Game
        </button>
        <button id="btn-mulai-kuis" class="btn btn-kupas-hijau btn-lg px-5 py-3 fs-3 smartboard-btn anim-denyut" disabled>
          ▶ Mulai Kuis Sekarang
        </button>
      </div>'''

if 'btn-buka-pengaturan-lobi' not in sesi_html:
    sesi_html = sesi_html.replace(target_lobi_btn, repl_lobi_btn)

# 2. Update Question screen header with Info Pengaturan (Read-Only)
target_soal_header = '''      <!-- Header Soal & Timer -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div>
          <span class="badge bg-dark fs-5 rounded-pill px-3 py-2 text-white border border-dark" id="label-nomor-soal">
            Soal 1 dari 10
          </span>
          <span class="badge bg-info text-dark fs-6 rounded-pill px-3 py-2 ms-2 border border-dark" id="label-tipe-soal">
            Pilihan Ganda
          </span>
        </div>'''

repl_soal_header = '''      <!-- Header Soal & Timer -->
      <div class="d-flex justify-content-between align-items-center mb-3">
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="badge bg-dark fs-5 rounded-pill px-3 py-2 text-white border border-dark" id="label-nomor-soal">
            Soal 1 dari 10
          </span>
          <span class="badge bg-info text-dark fs-6 rounded-pill px-3 py-2 border border-dark" id="label-tipe-soal">
            Pilihan Ganda
          </span>
          <button id="btn-lihat-pengaturan-soal" type="button" class="btn btn-outline-dark btn-sm rounded-pill fw-bold ms-1" title="Lihat parameter permainan yang sedang aktif (Hanya-Baca)">
            ⚙️ Info Pengaturan
          </button>
        </div>'''

if 'btn-lihat-pengaturan-soal' not in sesi_html:
    sesi_html = sesi_html.replace(target_soal_header, repl_soal_header)

# 3. Refactor question & config loading in script
target_init_block = '''      // Ambil soal kuis (dukung opsi Acak Soal dari pengaturan kuis)
      const resKuis = await kuisManager.ambilKuisDetail(sesi.kuis_id);
      daftarSoal = [...(resKuis.soal || [])];

      // Fallback aman: jika kuis belum memiliki soal, muat bank soal cadangan default
      if (daftarSoal.length === 0) {
        console.warn(`[Lobi Guru] Kuis ${sesi.kuis_id} belum memiliki soal. Memuat bank soal cadangan default...`);
        try {
          const resFallback = await kuisManager.ambilKuisDetail('kuis-ekosistem-1');
          if (resFallback && resFallback.soal && resFallback.soal.length > 0) {
            daftarSoal = [...resFallback.soal];
          }
        } catch (errFallback) {
          console.error('[Lobi Guru] Gagal memuat soal cadangan kuis:', errFallback);
        }
      }

      // Terapkan konfigurasi parameter permainan terpusat
      const cfg = konfigurasiManager.ambilPengaturan();

      // Filter materi/topik spesifik jika disetel
      if (cfg.topik && cfg.topik !== 'semua') {
        const soalTopik = daftarSoal.filter(s => s.bab === cfg.topik);
        if (soalTopik.length > 0) {
          daftarSoal = soalTopik;
        } else {
          console.warn(`[Lobi Guru] Topik "${cfg.topik}" belum memiliki soal, menggunakan semua materi.`);
        }
      }

      // Filter tingkat kesulitan spesifik jika disetel
      if (cfg.tingkat_kesulitan && cfg.tingkat_kesulitan !== 'semua') {
        const soalDiff = daftarSoal.filter(s => s.tingkat_kesulitan === cfg.tingkat_kesulitan);
        if (soalDiff.length > 0) {
          daftarSoal = soalDiff;
        }
      }

      // Acak urutan soal
      if (cfg.acak_soal || (resKuis.kuis && resKuis.kuis.acak_soal)) {
        for (let i = daftarSoal.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [daftarSoal[i], daftarSoal[j]] = [daftarSoal[j], daftarSoal[i]];
        }
      }

      // Batasi jumlah butir soal per sesi
      if (cfg.jumlah_soal > 0 && daftarSoal.length > cfg.jumlah_soal) {
        daftarSoal = daftarSoal.slice(0, cfg.jumlah_soal);
      }

      // Terapkan bobot poin per soal
      if (cfg.poin_benar > 0) {
        daftarSoal.forEach(s => { s.poin = cfg.poin_benar; });
      }

      // Ukuran teks untuk smartboard
      if (cfg.ukuran_teks === 'besar') {
        document.body.classList.add('smartboard-mode');
      } else {
        document.body.classList.remove('smartboard-mode');
      }

      // Suara & Gerak
      if (typeof suara.setBisu === 'function') {
        suara.setBisu(!cfg.sfx_aktif);
      }
      if (cfg.tingkat_gerak && typeof animasi.setMode === 'function') {
        animasi.setMode(cfg.tingkat_gerak);
      }

      // Tampilkan ringkasan pengaturan di lobi
      segarkanRingkasanLobi(cfg);'''

repl_init_block = '''      // Muat soal dan terapkan parameter permainan terpusat
      await muatParameterDanSoal();'''

if target_init_block in sesi_html:
    sesi_html = sesi_html.replace(target_init_block, repl_init_block)

# 4. Add muatParameterDanSoal and settings button event listeners
helper_functions = '''    async function muatParameterDanSoal(cfgKustom) {
      const cfg = cfgKustom || konfigurasiManager.ambilPengaturan();
      const resKuis = await kuisManager.ambilKuisDetail(sesi.kuis_id);
      let soalBaru = [...(resKuis.soal || [])];

      if (soalBaru.length === 0) {
        console.warn(`[Lobi Guru] Kuis ${sesi.kuis_id} belum memiliki soal. Memuat bank soal cadangan default...`);
        try {
          const resFallback = await kuisManager.ambilKuisDetail('kuis-ekosistem-1');
          if (resFallback && resFallback.soal && resFallback.soal.length > 0) {
            soalBaru = [...resFallback.soal];
          }
        } catch (errFallback) {
          console.error('[Lobi Guru] Gagal memuat soal cadangan kuis:', errFallback);
        }
      }

      // Filter materi/topik spesifik jika disetel
      if (cfg.topik && cfg.topik !== 'semua') {
        const soalTopik = soalBaru.filter(s => s.bab === cfg.topik);
        if (soalTopik.length > 0) {
          soalBaru = soalTopik;
        } else {
          console.warn(`[Lobi Guru] Topik "${cfg.topik}" belum memiliki soal, menggunakan semua materi.`);
        }
      }

      // Filter tingkat kesulitan spesifik jika disetel
      if (cfg.tingkat_kesulitan && cfg.tingkat_kesulitan !== 'semua') {
        const soalDiff = soalBaru.filter(s => s.tingkat_kesulitan === cfg.tingkat_kesulitan);
        if (soalDiff.length > 0) {
          soalBaru = soalDiff;
        }
      }

      // Acak urutan soal
      if (cfg.acak_soal || (resKuis.kuis && resKuis.kuis.acak_soal)) {
        for (let i = soalBaru.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [soalBaru[i], soalBaru[j]] = [soalBaru[j], soalBaru[i]];
        }
      }

      // Batasi jumlah butir soal per sesi
      if (cfg.jumlah_soal > 0 && soalBaru.length > cfg.jumlah_soal) {
        soalBaru = soalBaru.slice(0, cfg.jumlah_soal);
      }

      // Terapkan bobot poin per soal
      if (cfg.poin_benar > 0) {
        soalBaru.forEach(s => { s.poin = cfg.poin_benar; });
      }

      daftarSoal = soalBaru;

      // Ukuran teks untuk smartboard
      if (cfg.ukuran_teks === 'besar') {
        document.body.classList.add('smartboard-mode');
      } else {
        document.body.classList.remove('smartboard-mode');
      }

      // Suara & Gerak
      if (typeof suara.setBisu === 'function') {
        suara.setBisu(!cfg.sfx_aktif);
      }
      if (cfg.tingkat_gerak && typeof animasi.setMode === 'function') {
        animasi.setMode(cfg.tingkat_gerak);
      }

      // Tampilkan ringkasan pengaturan di lobi
      segarkanRingkasanLobi(cfg);
    }
'''

if 'async function muatParameterDanSoal' not in sesi_html:
    # insert before function segarkanRingkasanLobi
    sesi_html = sesi_html.replace('function segarkanRingkasanLobi(cfg) {', helper_functions + '\n    function segarkanRingkasanLobi(cfg) {')

# 5. Wire Settings buttons in guru/sesi.html
listeners = '''    // Tombol Buka Pengaturan di Lobi Guru (Dapat diedit sebelum kuis mulai)
    const btnBukaPengaturanLobi = document.getElementById('btn-buka-pengaturan-lobi');
    if (btnBukaPengaturanLobi) {
      btnBukaPengaturanLobi.addEventListener('click', () => {
        konfigurasiManager.bukaModalPengaturan({
          isReadOnly: sesi && sesi.status === 'berjalan',
          onTersimpan: async (cfgBaru) => {
            await muatParameterDanSoal(cfgBaru);
            await segarkanDaftarPeserta();
            umumkanAria('Pengaturan kuis berhasil disimpan dan diterapkan.');
          }
        });
      });
    }

    // Tombol Lihat Pengaturan di Layar Soal (Hanya-baca saat kuis aktif)
    const btnLihatPengaturanSoal = document.getElementById('btn-lihat-pengaturan-soal');
    if (btnLihatPengaturanSoal) {
      btnLihatPengaturanSoal.addEventListener('click', () => {
        konfigurasiManager.bukaModalPengaturan({
          isReadOnly: true
        });
      });
    }
'''

if 'btnBukaPengaturanLobi' not in sesi_html:
    sesi_html = sesi_html.replace("document.getElementById('btn-unduh-csv').addEventListener('click',", listeners + "\n    document.getElementById('btn-unduh-csv').addEventListener('click',")

with open('guru/sesi.html', 'w', encoding='utf-8') as f:
    f.write(sesi_html)

print('guru/sesi.html successfully updated')

