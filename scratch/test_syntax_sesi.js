
    // import
    // import
    // import
    // import
    // import
    // import
    // import

    pasangHeader('guru', { berandaLink: '../index.html', rootAset: '../' });

    // Route Guard: Pastikan guru telah terotentikasi di Supabase
    const guruAktif = auth.periksaAksesGuru();
    if (!guruAktif) {
      throw new Error('Akses ditolak: Guru belum login.');
    }

    const params = new URLSearchParams(window.location.search);
    const kodeSesi = (params.get('kode') || '').toUpperCase();

    if (!kodeSesi) {
      alert('Kode sesi tidak ditemukan!');
      window.location.href = 'dasbor.html';
    }

    let sesi = null;
    let daftarSoal = [];
    let soalAktifIndex = 0;
    let daftarPeserta = [];
    let jawabanMasukSet = new Set();
    let channelRealtime = null;
    let timerInterval = null;
    let sisaWaktu = 30;
    let durasiMaks = 30;
    const progresPesertaMap = new Map();

    // Mode Mulai Langsung (Tanpa HP Siswa)
    let isModeLangsung = (params.get('langsung') === '1');
    const statsLangsung = { total: 0, benar: 0, salah: 0, poin: 0 };
    let sudahDijawabLangsung = false;

    function perbaruiTampilanProgresGuru() {
      const grid = document.getElementById('grid-progres-siswa');
      if (!grid) return;

      const totalSoal = (daftarSoal && daftarSoal.length) || 1;
      grid.innerHTML = '';

      let jumlahSelesai = 0;
      daftarPeserta.forEach(p => {
        const prog = progresPesertaMap.get(p.id) || {
          soalIndex: 1,
          totalSoal,
          skor: p.skor || 0,
          selesai: false
        };

        if (prog.selesai) jumlahSelesai++;

        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4';
        col.innerHTML = `
          <div class="p-2 bg-white rounded-2 border border-2 border-dark d-flex align-items-center justify-content-between gap-2">
            <div class="d-flex align-items-center gap-2 overflow-hidden">
              <img src="../assets/svg/${p.avatar || 'avatar-1.svg'}" width="24" height="24" alt="">
              <span class="fw-bold text-truncate small">${p.nama_panggilan}</span>
            </div>
            <div class="d-flex align-items-center gap-1 flex-shrink-0">
              <span class="badge ${prog.selesai ? 'bg-success' : 'bg-primary'} text-white small">
                ${prog.selesai ? 'Selesai' : 'Soal ' + prog.soalIndex + '/' + prog.totalSoal}
              </span>
              <span class="badge bg-warning text-dark border small fw-bold">${prog.skor || 0} pt</span>
            </div>
          </div>
        `;
        grid.appendChild(col);
      });

      const elHitung = document.getElementById('hitung-menjawab');
      if (elHitung) {
        elHitung.textContent = jumlahSelesai > 0 ? (jumlahSelesai + ' selesai') : (jawabanMasukSet.size);
      }

      if (daftarPeserta.length > 0 && jumlahSelesai >= daftarPeserta.length) {
        const badge = document.getElementById('badge-status-kuis-otomatis');
        if (badge) {
          badge.textContent = 'Seluruh Siswa Selesai!';
          badge.className = 'badge bg-success text-white rounded-pill px-2 py-1 small fw-bold';
        }
      }
    }

    // Elemen Tampilan
    const viewLobi = document.getElementById('tampilan-lobi');
    const viewSoal = document.getElementById('tampilan-soal');
    const viewPembahasan = document.getElementById('tampilan-pembahasan');
    const viewSkor = document.getElementById('tampilan-skor');
    const viewHasilAkhir = document.getElementById('tampilan-hasil-akhir');

    function gantiTampilan(targetView) {
      [viewLobi, viewSoal, viewPembahasan, viewSkor, viewHasilAkhir].forEach(v => v.classList.add('d-none'));
      targetView.classList.remove('d-none');
      animasi.pop(targetView);
    }

    async function inisialisasiSesi() {
      sesi = sesiManager.ambilSesiByKode(kodeSesi);
      if (!sesi) {
        alert('Sesi kuis tidak valid.');
        window.location.href = 'dasbor.html';
        return;
      }

      document.getElementById('tampilan-kode-sesi').textContent = sesi.kode;
      document.getElementById('badge-mode-sesi').textContent = 
        sesi.mode === 'adventure' ? 'Mode Adventure Kelas' : 'Mode Custom Guru';

      // Muat soal dan terapkan parameter permainan terpusat
      muatParameterDanSoal();

      // Langganan Realtime
      channelRealtime = sesiManager.langgananSesi(sesi.kode, {
        onPesertaUpdate: async () => {
          segarkanDaftarPeserta();
          perbaruiTampilanProgresGuru();
        },
        onAksiBroadcast: async (payload) => {
          if (payload) {
            if (payload.aksi === 'siswa_gabung' || payload.aksi === 'siswa_keluar') {
              if (payload.aksi === 'siswa_keluar' && payload.pesertaId) {
                try {
                  const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
                  const filtered = store.filter(p => p.id !== payload.pesertaId);
                  localStorage.setItem('kupas_db_peserta', JSON.stringify(filtered));
                } catch (e) {
                  console.error('[Lobi Guru] Gagal menghapus data peserta keluar:', e);
                }
              }
              segarkanDaftarPeserta();
              perbaruiTampilanProgresGuru();
            } else if (payload.aksi === 'progres_siswa') {
              progresPesertaMap.set(payload.pesertaId, {
                nama: payload.nama,
                avatar: payload.avatar,
                soalIndex: payload.soalIndex,
                totalSoal: payload.totalSoal,
                skor: payload.skor,
                selesai: payload.selesai
              });
              perbaruiTampilanProgresGuru();
            }
          }
        },
        onJawabanMasuk: (payload) => {
          if (payload.new && payload.new.sesi_id === sesi.id) {
            jawabanMasukSet.add(payload.new.peserta_id);
            document.getElementById('hitung-menjawab').textContent = jawabanMasukSet.size;
            perbaruiTampilanProgresGuru();
          }
        }
      });

      segarkanDaftarPeserta();

      // Jalur Mulai Langsung (Tanpa HP Siswa): Mulai langsung tanpa menunggu lobi
      if (isModeLangsung) {
        const badge = document.getElementById('badge-mode-sesi');
        if (badge) {
          badge.textContent = '🖥️ Mode Mulai Langsung (Tanpa HP Siswa)';
          badge.className = 'badge bg-success text-white border border-dark rounded-pill px-3 py-2 fs-6';
        }
        mulaiSoal(0);
      }
    }

        async function muatParameterDanSoal(cfgKustom) {
      const cfg = cfgKustom || konfigurasiManager.ambilPengaturan();
      let resKuis = null;
      try {
        resKuis = kuisManager.ambilKuisDetail(sesi.kuis_id);
      } catch (errDetail) {
        console.warn(`[Lobi Guru] Kuis ${sesi.kuis_id} tidak ditemukan di DB:`, errDetail);
      }
      let soalBaru = [...(resKuis?.soal || [])];

      if (soalBaru.length === 0) {
        console.warn(`[Lobi Guru] Kuis ${sesi.kuis_id} belum memiliki soal. Mengambil butir soal dari bank soal...`);
        try {
          const bank = kuisManager.ambilSemuaSoal();
          if (bank && bank.length > 0) {
            soalBaru = [...bank];
          }
        } catch (errFallback) {
          console.error('[Lobi Guru] Gagal memuat butir soal dari bank soal:', errFallback);
        }
      }

      // Pastikan setiap butir soal memiliki kunci jawaban yang valid
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      soalBaru.forEach(s => {
        if (!s.kunci && kunciDB[s.id]) {
          s.kunci = kunciDB[s.id];
        }
      });

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

    function segarkanRingkasanLobi(cfg) {
      const wadah = document.getElementById('wadah-ringkasan-pengaturan');
      if (!wadah) return;
      const config = cfg || konfigurasiManager.ambilPengaturan();
      const list = konfigurasiManager.buatTeksRingkasan(config);
      wadah.innerHTML = '';
      list.forEach(item => {
        const badge = document.createElement('span');
        badge.className = 'badge bg-light text-dark border border-dark rounded-pill px-3 py-2 small fw-bold shadow-sm';
        badge.textContent = item;
        wadah.appendChild(badge);
      });
    }

    async function segarkanDaftarPeserta() {
      try {
        daftarPeserta = sesiManager.ambilDaftarPeserta(sesi.id);
        document.getElementById('jumlah-peserta-lobi').textContent = daftarPeserta.length;
        document.getElementById('total-peserta-aktif').textContent = daftarPeserta.length;

        const wadahLobi = document.getElementById('wadah-peserta-lobi');
        const btnMulai = document.getElementById('btn-mulai-kuis');

        if (daftarPeserta.length > 0) {
          wadahLobi.innerHTML = '';
          daftarPeserta.forEach(p => {
            const bubble = document.createElement('div');
            bubble.className = 'peserta-gelembung anim-gelembung';
            bubble.innerHTML = `
              <img src="../assets/svg/${p.avatar || 'avatar-1.svg'}" alt="${p.nama_panggilan}" width="28" height="28">
              <span>${p.nama_panggilan}</span>
            `;
            wadahLobi.appendChild(bubble);
          });

          // Tombol hanya aktif jika minimal 1 peserta berada di lobi dan soal tersedia
          if (daftarSoal.length > 0 && !countdownSedangBerjalan) {
            btnMulai.disabled = false;
          } else {
            btnMulai.disabled = true;
          }
        } else {
          wadahLobi.innerHTML = '<p class="text-secondary my-auto">Menunggu siswa memasukkan kode...</p>';
          btnMulai.disabled = true;
        }
      } catch (err) {
        console.error('[Lobi Guru] Gagal menyegarkan daftar peserta:', err);
      }
    }

    let countdownSedangBerjalan = false;

    // Tombol Mulai Kuis (Countdown 3-2-1)
    document.getElementById('btn-mulai-kuis').addEventListener('click', () => {
      if (countdownSedangBerjalan) {
        console.warn('[Lobi Guru] Klik tombol mulai diabaikan karena hitung mundur sedang berjalan.');
        return;
      }
      if (daftarPeserta.length < 1) {
        console.warn('[Lobi Guru] Tidak dapat memulai kuis: minimal 1 peserta harus berada di lobi.');
        return;
      }
      if (daftarSoal.length < 1) {
        console.error('[Lobi Guru] Tidak dapat memulai kuis: belum ada soal yang dimuat.');
        alert('Kuis belum memiliki soal.');
        return;
      }

      countdownSedangBerjalan = true;
      const btnMulai = document.getElementById('btn-mulai-kuis');
      btnMulai.disabled = true;

      const overlay = document.getElementById('overlay-countdown');
      const angkaEl = document.getElementById('countdown-angka');
      overlay.classList.remove('d-none');
      
      let count = 3;
      angkaEl.textContent = count;
      suara.mainkan('benar');

      const cd = setInterval(async () => {
        try {
          count--;
          if (count > 0) {
            angkaEl.textContent = count;
            animasi.pop(angkaEl);
            suara.mainkan('benar');
          } else {
            clearInterval(cd);
            overlay.classList.add('d-none');

            // Cek kondisi peserta saat hitung mundur selesai
            if (daftarPeserta.length < 1) {
              console.warn('[Lobi Guru] Hitung mundur selesai tapi peserta telah keluar.');
              countdownSedangBerjalan = false;
              segarkanDaftarPeserta();
              return;
            }

            mulaiSoal(0);
            countdownSedangBerjalan = false;
          }
        } catch (err) {
          clearInterval(cd);
          countdownSedangBerjalan = false;
          overlay.classList.add('d-none');
          console.error('[Lobi Guru] Terjadi kesalahan saat hitung mundur atau memulai soal:', err);
          segarkanDaftarPeserta();
        }
      }, 1000);
    });

    // Mulai Menampilkan Soal
    async function mulaiSoal(idx) {
      try {
        if (!daftarSoal || daftarSoal.length === 0) {
          throw new Error('Daftar soal kosong atau belum berhasil dimuat.');
        }

        soalAktifIndex = idx;
        const soal = daftarSoal[idx];
        if (!soal) {
          throw new Error(`Data soal pada indeks ${idx} tidak valid.`);
        }

        jawabanMasukSet.clear();
        document.getElementById('hitung-menjawab').textContent = '0';

        // Update status sesi
        sesiManager.perbaruiStatusSesi(sesi.id, 'berjalan', idx + 1);

        const cfg = konfigurasiManager.ambilPengaturan();
        let durasiDetik = soal.waktu_detik || 30;
        if (cfg.batas_waktu !== 'otomatis') {
          durasiDetik = Number(cfg.batas_waktu);
        }
        const durasiFinal = durasiDetik > 0 ? Math.round(durasiDetik * (sesi.pengali_waktu || 1)) : 0;

        // Simpan daftar soal sesi ke storage lokal agar dapat diakses siswa yang berjalan mandiri
        try {
          localStorage.setItem('kupas_sesi_soal_' + sesi.id, JSON.stringify(daftarSoal));
        } catch(e) {}

        // Siarkan aksi ke siswa beserta seluruh paket butir soal untuk alur mandiri (jika mode bersama)
        if (!isModeLangsung) {
          sesiManager.kirimAksi(channelRealtime, 'tampil_soal', {
            soalIndex: idx,
            totalSoal: daftarSoal.length,
            soal: {
              id: soal.id,
              urutan: soal.urutan,
              tipe: soal.tipe,
              teks: soal.teks,
              opsi: soal.opsi,
              kunci: soal.kunci,
              waktu_detik: durasiFinal,
              penjelasan: soal.penjelasan,
              kamus_id: soal.kamus_id
            },
            daftarSoal: daftarSoal.map(s => ({
              id: s.id,
              urutan: s.urutan,
              tipe: s.tipe,
              teks: s.teks,
              opsi: s.opsi,
              kunci: s.kunci,
              waktu_detik: durasiFinal,
              penjelasan: s.penjelasan,
              kamus_id: s.kamus_id
            }))
          });
          perbaruiTampilanProgresGuru();
        }

        // Render Layar Soal Guru
        document.getElementById('label-nomor-soal').textContent = `Soal ${idx + 1} dari ${daftarSoal.length}`;
        document.getElementById('label-tipe-soal').textContent = (soal.tipe || 'pilihan_ganda').replace('_', ' ');
        document.getElementById('teks-pertanyaan').textContent = soal.teks;

        const wadahOpsi = document.getElementById('wadah-opsi-guru');
        wadahOpsi.innerHTML = '';

        // Sesuaikan tampilan panel kontrol berdasarkan mode
        const panelLangsung = document.getElementById('panel-kontrol-langsung');
        const panelBersama = document.getElementById('panel-kontrol-bersama');
        const wadahProgresSiswa = document.getElementById('wadah-progres-siswa-guru');
        const boxPembahasanLangsung = document.getElementById('wadah-pembahasan-langsung');

        if (isModeLangsung) {
          if (panelLangsung) panelLangsung.classList.remove('d-none');
          if (panelBersama) panelBersama.classList.add('d-none');
          if (wadahProgresSiswa) wadahProgresSiswa.classList.add('d-none');
          if (boxPembahasanLangsung) boxPembahasanLangsung.classList.add('d-none');

          sudahDijawabLangsung = false;
          const btnLanjut = document.getElementById('btn-lanjut-soal-langsung');
          if (btnLanjut) {
            btnLanjut.disabled = true;
            if (idx + 1 >= daftarSoal.length) {
              btnLanjut.innerHTML = `<span>Lihat Hasil Akhir Kelas</span> <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
            } else {
              btnLanjut.innerHTML = `<span>Soal Berikutnya</span> <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
            }
          }
        } else {
          if (panelLangsung) panelLangsung.classList.add('d-none');
          if (panelBersama) panelBersama.classList.remove('d-none');
          if (wadahProgresSiswa) wadahProgresSiswa.classList.remove('d-none');
          if (boxPembahasanLangsung) boxPembahasanLangsung.classList.add('d-none');
        }

        if (soal.tipe === 'pilihan_ganda' || soal.tipe === 'benar_salah') {
          const list = soal.opsi && soal.opsi.length ? soal.opsi : (soal.tipe === 'benar_salah' ? ['Benar', 'Salah'] : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D']);
          const labelHuruf = ['A', 'B', 'C', 'D'];
          list.forEach((op, i) => {
            const el = document.createElement('div');
            el.className = 'opsi-jawaban smartboard-teks-opsi';
            if (isModeLangsung) {
              el.setAttribute('role', 'button');
              el.setAttribute('tabindex', '0');
              el.style.cursor = 'pointer';
              el.setAttribute('data-index', i);
              el.addEventListener('click', () => pilihOpsiModeLangsung(i, el, soal));
              el.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pilihOpsiModeLangsung(i, el, soal);
                }
              });
            }
            el.innerHTML = `<span class="opsi-nomor">${labelHuruf[i] || (i + 1)}</span> <span>${op}</span>`;
            wadahOpsi.appendChild(el);
          });
        } else {
          wadahOpsi.innerHTML = '<div class="alert alert-secondary w-100 fs-5 text-center">Siswa menjawab dengan mengetik kata kunci.</div>';
        }

        gantiTampilan(viewSoal);
        jalankanTimer(durasiFinal);
        umumkanAria(`Soal ${idx + 1}: ${soal.teks}`);
      } catch (err) {
        console.error('[Lobi Guru] Gagal mengeksekusi mulaiSoal:', err);
        throw err;
      }
    }

    function jalankanTimer(detik) {
      clearInterval(timerInterval);
      durasiMaks = detik;
      sisaWaktu = detik;

      const teksTimer = document.getElementById('teks-timer');
      const timerBar = document.getElementById('timer-bar');

      if (detik <= 0) {
        teksTimer.textContent = 'Bebas';
        timerBar.style.transform = 'scaleX(1)';
        timerBar.style.backgroundColor = '#16A34A';
        return;
      }

      teksTimer.textContent = sisaWaktu;
      timerBar.style.transform = 'scaleX(1)';

      timerInterval = setInterval(() => {
        sisaWaktu--;
        teksTimer.textContent = sisaWaktu;
        const fraksi = Math.max(0, sisaWaktu / durasiMaks);
        timerBar.style.transform = `scaleX(${fraksi})`;

        if (sisaWaktu <= 5) {
          timerBar.style.backgroundColor = '#DC2626';
        } else {
          timerBar.style.backgroundColor = '#16A34A';
        }

        if (sisaWaktu <= 0) {
          clearInterval(timerInterval);
          if (isModeLangsung) {
            if (!sudahDijawabLangsung) {
              pilihOpsiModeLangsung(-1, null, daftarSoal[soalAktifIndex]);
            }
          } else {
            bukaPembahasan();
          }
        }
      }, 1000);
    }

    // Tambah Waktu
    document.getElementById('btn-tambah-waktu').addEventListener('click', () => {
      sisaWaktu += 10;
      durasiMaks += 10;
      document.getElementById('teks-timer').textContent = sisaWaktu;
      umumkanAria('Waktu ditambah 10 detik');
    });

    // Buka Pembahasan
    async function bukaPembahasan() {
      clearInterval(timerInterval);
      const soal = daftarSoal[soalAktifIndex];

      // Ambil kunci jawaban
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      const kunciRaw = soal.kunci || kunciDB[soal.id] || '0';

      let teksKunci = '';
      if (soal.tipe === 'pilihan_ganda') {
        const kStr = String(kunciRaw).trim().toLowerCase();
        let idxKunci = 0;
        const mapHuruf = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
        if (mapHuruf[kStr] !== undefined) {
          idxKunci = mapHuruf[kStr];
        } else if (!isNaN(parseInt(kStr, 10)) && parseInt(kStr, 10) >= 0 && parseInt(kStr, 10) < (soal.opsi?.length || 4)) {
          idxKunci = parseInt(kStr, 10);
        } else if (Array.isArray(soal.opsi)) {
          const textIdx = soal.opsi.findIndex(o => String(o).trim().toLowerCase() === kStr);
          if (textIdx >= 0) idxKunci = textIdx;
        }
        const huruf = ['A', 'B', 'C', 'D'][idxKunci] || '';
        teksKunci = (soal.opsi && soal.opsi[idxKunci]) ? `${huruf ? huruf + '. ' : ''}${soal.opsi[idxKunci]}` : (kunciRaw || 'Opsi 1');
      } else if (soal.tipe === 'benar_salah') {
        const kStr = String(kunciRaw).trim().toLowerCase();
        teksKunci = ['0', 'benar', 'true', 'b'].includes(kStr) ? 'Benar' : 'Salah';
      } else {
        teksKunci = kunciRaw;
      }

      document.getElementById('judul-jawaban-benar').textContent = `Kunci Jawaban Benar: ${teksKunci}`;
      document.getElementById('teks-penjelasan-guru').textContent = soal.penjelasan || 'Pembahasan materi ekosistem.';

      // Tautan Kamus Belajar pada Pembahasan (Fitur 6)
      let entriKamus = null;
      const wadahKamusGuru = document.getElementById('wadah-tombol-kamus-guru');
      const detailKamusGuru = document.getElementById('detail-kamus-guru');
      detailKamusGuru.classList.add('d-none');

      if (soal.kamus_id) {
        try {
          entriKamus = kamusManager.ambilKamusById(soal.kamus_id);
        } catch (e) {}
      }

      if (entriKamus) {
        wadahKamusGuru.classList.remove('d-none');
        const btnKamus = document.getElementById('btn-pelajari-kamus-guru');
        btnKamus.textContent = `Pelajari: ${entriKamus.istilah}`;
        document.getElementById('kamus-guru-kategori').textContent = entriKamus.kategori;
        document.getElementById('kamus-guru-istilah').textContent = entriKamus.istilah;
        document.getElementById('kamus-guru-definisi').textContent = entriKamus.definisi;
        document.getElementById('kamus-guru-contoh').textContent = entriKamus.contoh ? `Contoh: ${entriKamus.contoh}` : '';

        btnKamus.onclick = () => {
          detailKamusGuru.classList.toggle('d-none');
          animasi.pop(detailKamusGuru);
        };
      } else {
        wadahKamusGuru.classList.add('d-none');
      }

      // Mode Adventure: gerakkan maskot secara responsif (hanya transform: translateX)
      if (sesi.mode === 'adventure') {
        const wadahAdv = document.getElementById('wadah-peta-adventure');
        wadahAdv.classList.remove('d-none');
        const step = Math.min(soalAktifIndex + 1, 4);
        document.getElementById('label-langkah-peta').textContent = `Langkah ${step} dari 4`;
        const maskotPeta = document.getElementById('peta-maskot-el');
        const wadahPeta = wadahAdv.querySelector('.peta-container');
        const lebarPeta = (wadahPeta && wadahPeta.clientWidth) ? wadahPeta.clientWidth : 500;
        const geserPx = Math.round(lebarPeta * 0.72 * ((step - 1) / 3));
        maskotPeta.style.transform = `translateX(${geserPx}px)`;
      }

      const cfg = konfigurasiManager.ambilPengaturan();
      const elPenjelasan = document.getElementById('teks-penjelasan-guru');
      if (!cfg.tampilkan_penjelasan && elPenjelasan) {
        elPenjelasan.classList.add('d-none');
      } else if (elPenjelasan) {
        elPenjelasan.classList.remove('d-none');
      }

      // Siarkan ke siswa
      sesiManager.kirimAksi(channelRealtime, 'buka_pembahasan', {
        soalIndex: soalAktifIndex,
        kunciJawaban: cfg.tampilkan_kunci_jawaban ? teksKunci : null,
        penjelasan: cfg.tampilkan_penjelasan ? soal.penjelasan : null,
        kamusEntri: entriKamus
      });

      gantiTampilan(viewPembahasan);
      umumkanAria(`Pembahasan dibuka: Kunci jawaban adalah ${teksKunci}`);
    }

    document.getElementById('btn-buka-pembahasan').addEventListener('click', bukaPembahasan);

    // Lanjut ke Papan Skor
    document.getElementById('btn-lanjut-skor').addEventListener('click', async () => {
      tampilkanPapanSkor();
    });

    async function tampilkanPapanSkor() {
      const cfg = konfigurasiManager.ambilPengaturan();
      if (cfg.tampilkan_peringkat === 'sembunyikan') {
        if (soalAktifIndex + 1 < daftarSoal.length) {
          mulaiSoal(soalAktifIndex + 1);
          return;
        } else {
          selesaikanSesi();
          return;
        }
      }
      if (cfg.tampilkan_peringkat === 'akhir_saja' && soalAktifIndex + 1 < daftarSoal.length) {
        mulaiSoal(soalAktifIndex + 1);
        return;
      }

      const rekap = sesiManager.ambilRekapHasil(sesi.id);
      let pesertaUrut = [...(rekap.peserta || [])];

      // Sinkronisasi dengan skor realtime lokal jika ada yang lebih tinggi
      pesertaUrut.forEach(p => {
        const prog = progresPesertaMap.get(p.id);
        if (prog && typeof prog.skor === 'number') {
          p.skor = Math.max(p.skor || 0, prog.skor);
        }
      });
      pesertaUrut.sort((a, b) => (b.skor || 0) - (a.skor || 0));

      // Podium Top 3
      if (pesertaUrut[0]) {
        document.getElementById('podium-nama-1').textContent = pesertaUrut[0].nama_panggilan;
        animasi.hitungAngka(document.getElementById('podium-skor-1'), pesertaUrut[0].skor || 0);
      }
      if (pesertaUrut[1]) {
        document.getElementById('podium-nama-2').textContent = pesertaUrut[1].nama_panggilan;
        animasi.hitungAngka(document.getElementById('podium-skor-2'), pesertaUrut[1].skor || 0);
      }
      if (pesertaUrut[2]) {
        document.getElementById('podium-nama-3').textContent = pesertaUrut[2].nama_panggilan;
        animasi.hitungAngka(document.getElementById('podium-skor-3'), pesertaUrut[2].skor || 0);
      }

      // Isi Tabel Lengkap
      const tbody = document.getElementById('tabel-skor-body');
      tbody.innerHTML = '';
      pesertaUrut.forEach((p, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td data-label="Peringkat" class="fw-bold">#${i + 1}</td>
          <td data-label="Nama Siswa" class="fw-bold">
            <span class="d-inline-flex align-items-center gap-2">
              <img src="../assets/svg/${p.avatar || 'avatar-1.svg'}" width="24" height="24" alt="">
              <span>${p.nama_panggilan}</span>
            </span>
          </td>
          <td data-label="Total Skor" class="text-md-end fw-bolder">${p.skor || 0} pt</td>
        `;
        tbody.appendChild(tr);
      });

      // Tombol berikutnya / selesai
      const btnBerikutnya = document.getElementById('btn-lanjut-soal-berikutnya');
      if (soalAktifIndex + 1 >= daftarSoal.length) {
        btnBerikutnya.textContent = 'Lihat Hasil Akhir';
      } else {
        btnBerikutnya.textContent = `Lanjut ke Soal ${soalAktifIndex + 2}`;
      }

      // Siarkan ke siswa
      sesiManager.kirimAksi(channelRealtime, 'tampil_skor', {
        peserta: pesertaUrut
      });

      gantiTampilan(viewSkor);
      suara.mainkan('benar');
      umumkanAria('Papan skor diperbarui');
    }

    // Tombol Lanjut Soal Berikutnya / Hasil Akhir
    document.getElementById('btn-lanjut-soal-berikutnya').addEventListener('click', async () => {
      if (soalAktifIndex + 1 < daftarSoal.length) {
        mulaiSoal(soalAktifIndex + 1);
      } else {
        selesaikanSesi();
      }
    });

    document.getElementById('btn-langsung-hasil-akhir').addEventListener('click', async () => {
      selesaikanSesi();
    });

    async function selesaikanSesi() {
      sesiManager.perbaruiStatusSesi(sesi.id, 'selesai');
      sesiManager.kirimAksi(channelRealtime, 'selesai_sesi', {});

      gantiTampilan(viewHasilAkhir);
      cetusKonfeti();
      suara.mainkan('selesai');
      umumkanAria('Sesi kuis telah selesai! Menampilkan hasil akhir.');
    }

    // Unduh CSV Rekap Nilai
        // Tombol Buka Pengaturan di Lobi Guru (Dapat diedit sebelum kuis mulai)
    const btnBukaPengaturanLobi = document.getElementById('btn-buka-pengaturan-lobi');
    if (btnBukaPengaturanLobi) {
      btnBukaPengaturanLobi.addEventListener('click', () => {
        konfigurasiManager.bukaModalPengaturan({
          isReadOnly: sesi && sesi.status === 'berjalan',
          onTersimpan: async (cfgBaru) => {
            muatParameterDanSoal(cfgBaru);
            segarkanDaftarPeserta();
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

    document.getElementById('btn-unduh-csv').addEventListener('click', async () => {
      const rekap = sesiManager.ambilRekapHasil(sesi.id);
      sesiManager.unduhCSV(`Hasil_KUPAS_IPAS_${sesi.kode}.csv`, rekap.peserta);
      umumkanAria('Berkas CSV hasil kuis berhasil diunduh.');
    });

    // ==========================================
    // LOGIKA MODE MULAI LANGSUNG (TANPA HP SISWA)
    // ==========================================

    // Pilih Opsi untuk Mode Mulai Langsung (Layar Sentuh / Klik Guru & Siswa)
    async function pilihOpsiModeLangsung(pilihanIndex, elemenOpsi, soal) {
      if (sudahDijawabLangsung) return;
      sudahDijawabLangsung = true;
      clearInterval(timerInterval);

      // Ambil kunci jawaban
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      const kunciRaw = soal.kunci || kunciDB[soal.id] || '0';

      let idxKunci = 0;
      if (soal.tipe === 'pilihan_ganda') {
        const kStr = String(kunciRaw).trim().toLowerCase();
        const mapHuruf = { 'a': 0, 'b': 1, 'c': 2, 'd': 3 };
        if (mapHuruf[kStr] !== undefined) {
          idxKunci = mapHuruf[kStr];
        } else if (!isNaN(parseInt(kStr, 10)) && parseInt(kStr, 10) >= 0 && parseInt(kStr, 10) < (soal.opsi?.length || 4)) {
          idxKunci = parseInt(kStr, 10);
        } else if (Array.isArray(soal.opsi)) {
          const textIdx = soal.opsi.findIndex(o => String(o).trim().toLowerCase() === kStr);
          if (textIdx >= 0) idxKunci = textIdx;
        }
      } else if (soal.tipe === 'benar_salah') {
        const kStr = String(kunciRaw).trim().toLowerCase();
        idxKunci = ['0', 'benar', 'true', 'b'].includes(kStr) ? 0 : 1;
      }

      const isBenar = (pilihanIndex === idxKunci);
      const daftarElemenOpsi = document.querySelectorAll('#wadah-opsi-guru .opsi-jawaban');

      daftarElemenOpsi.forEach((el, idx) => {
        el.style.pointerEvents = 'none';
        if (idx === idxKunci) {
          el.classList.add('benar');
        }
        if (idx === pilihanIndex && !isBenar) {
          el.classList.add('salah');
        }
        if (idx === pilihanIndex) {
          el.classList.add('terpilih');
        }
      });

      statsLangsung.total++;
      const bobotPoin = soal.poin || 100;
      if (isBenar) {
        statsLangsung.benar++;
        statsLangsung.poin += bobotPoin;
        suara.mainkan('benar');
        if (elemenOpsi) animasi.pop(elemenOpsi);
      } else {
        statsLangsung.salah++;
        suara.mainkan('salah');
        if (elemenOpsi) animasi.goyang(elemenOpsi);
      }

      // Update HUD Langsung
      const skorEl = document.getElementById('skor-kelas-langsung');
      const benarEl = document.getElementById('hitung-benar-langsung');
      const salahEl = document.getElementById('hitung-salah-langsung');
      if (skorEl) skorEl.textContent = statsLangsung.poin + ' pt';
      if (benarEl) benarEl.textContent = statsLangsung.benar;
      if (salahEl) salahEl.textContent = statsLangsung.salah;

      // Tampilkan Box Pembahasan Langsung
      const boxPembahasan = document.getElementById('wadah-pembahasan-langsung');
      const badgeStatus = document.getElementById('badge-status-jawaban-langsung');
      const labelKunci = document.getElementById('label-kunci-teks');
      const teksPenjelasan = document.getElementById('teks-penjelasan-langsung');
      const wadahKamus = document.getElementById('wadah-tautan-kamus-langsung');

      if (boxPembahasan) {
        boxPembahasan.classList.remove('d-none');
        animasi.pop(boxPembahasan);
      }

      if (badgeStatus) {
        if (isBenar) {
          badgeStatus.className = 'badge bg-success text-white border border-dark fs-6 px-3 py-1';
          badgeStatus.textContent = `✅ Jawaban Benar! (+${bobotPoin} pt)`;
        } else if (pilihanIndex === -1) {
          badgeStatus.className = 'badge bg-secondary text-white border border-dark fs-6 px-3 py-1';
          badgeStatus.textContent = `⏱️ Waktu Habis!`;
        } else {
          badgeStatus.className = 'badge bg-danger text-white border border-dark fs-6 px-3 py-1';
          badgeStatus.textContent = `❌ Jawaban Kurang Tepat`;
        }
      }

      const hurufKunci = ['A', 'B', 'C', 'D'][idxKunci] || '';
      const teksKunci = (soal.opsi && soal.opsi[idxKunci]) ? `${hurufKunci ? hurufKunci + '. ' : ''}${soal.opsi[idxKunci]}` : (kunciRaw || 'Kunci Jawaban');
      if (labelKunci) {
        labelKunci.textContent = `Kunci: ${teksKunci}`;
      }

      if (teksPenjelasan) {
        teksPenjelasan.textContent = soal.penjelasan || 'Pembahasan materi pembelajaran IPAS.';
      }

      if (wadahKamus) {
        wadahKamus.innerHTML = '';
        if (soal.kamus_id) {
          try {
            const entri = kamusManager.ambilKamusById(soal.kamus_id);
            if (entri) {
              wadahKamus.innerHTML = `
                <div class="mt-2 p-2 bg-light rounded-2 border border-dark small">
                  <strong>📚 Istilah Kamus:</strong> <span class="badge bg-warning text-dark border border-dark">${entri.istilah}</span> - ${entri.definisi}
                </div>
              `;
            }
          } catch(e) {}
        }
      }

      // Aktifkan tombol Lanjut
      const btnLanjut = document.getElementById('btn-lanjut-soal-langsung');
      if (btnLanjut) {
        btnLanjut.disabled = false;
        animasi.pop(btnLanjut);
      }

      umumkanAria(isBenar ? `Benar! Poin bertambah ${bobotPoin}` : `Kurang tepat. Kunci jawaban adalah ${teksKunci}`);
    }

    // Selesaikan Sesi Mode Mulai Langsung
    async function selesaikanSesiLangsung() {
      sesiManager.perbaruiStatusSesi(sesi.id, 'selesai');

      const totalSoal = Math.max(statsLangsung.total, daftarSoal.length || 1);
      const persen = Math.round((statsLangsung.benar / totalSoal) * 100);

      const elPersen = document.getElementById('hasil-persen-langsung');
      const elBenar = document.getElementById('hasil-benar-langsung');
      const elSalah = document.getElementById('hasil-salah-langsung');
      const elPoin = document.getElementById('hasil-poin-langsung');
      const rekapLangsung = document.getElementById('rekap-nilai-langsung');

      if (elPersen) elPersen.textContent = persen + '%';
      if (elBenar) elBenar.textContent = statsLangsung.benar;
      if (elSalah) elSalah.textContent = statsLangsung.salah;
      if (elPoin) elPoin.textContent = statsLangsung.poin + ' pt';
      if (rekapLangsung) rekapLangsung.classList.remove('d-none');

      const judulAkhir = document.getElementById('judul-hasil-akhir');
      const subjudulAkhir = document.getElementById('subjudul-hasil-akhir');
      if (judulAkhir) judulAkhir.textContent = 'Kuis Kelas Selesai! 🎉';
      if (subjudulAkhir) {
        subjudulAkhir.textContent = `Kelas berhasil menjawab ${statsLangsung.benar} dari ${totalSoal} soal dengan capaian ${persen}%.`;
      }

      gantiTampilan(viewHasilAkhir);
      cetusKonfeti();
      suara.mainkan('selesai');
      umumkanAria(`Sesi kuis langsung selesai! Nilai kelas ${persen} persen.`);
    }

    // Tombol Mulai Langsung dari Lobi (Fallback bila siswa tidak ada HP)
    const btnLobiLangsung = document.getElementById('btn-mulai-langsung-lobi');
    if (btnLobiLangsung) {
      btnLobiLangsung.addEventListener('click', async () => {
        isModeLangsung = true;
        const badge = document.getElementById('badge-mode-sesi');
        if (badge) {
          badge.textContent = '🖥️ Mode Mulai Langsung (Tanpa HP Siswa)';
          badge.className = 'badge bg-success text-white border border-dark rounded-pill px-3 py-2 fs-6';
        }
        mulaiSoal(0);
      });
    }

    // Tombol Lanjut Soal Mode Langsung
    const btnLanjutLangsung = document.getElementById('btn-lanjut-soal-langsung');
    if (btnLanjutLangsung) {
      btnLanjutLangsung.addEventListener('click', async () => {
        if (soalAktifIndex + 1 < daftarSoal.length) {
          mulaiSoal(soalAktifIndex + 1);
        } else {
          selesaikanSesiLangsung();
        }
      });
    }

    // Navigasi Keyboard untuk Mode Mulai Langsung (1-4 atau A-D)
    window.addEventListener('keydown', (e) => {
      if (!isModeLangsung || sudahDijawabLangsung || viewSoal.classList.contains('d-none')) return;
      const key = e.key.toUpperCase();
      const mapKey = { '1': 0, '2': 1, '3': 2, '4': 3, 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
      if (mapKey[key] !== undefined) {
        const targetIdx = mapKey[key];
        const daftarElemenOpsi = document.querySelectorAll('#wadah-opsi-guru .opsi-jawaban');
        if (daftarElemenOpsi[targetIdx]) {
          pilihOpsiModeLangsung(targetIdx, daftarElemenOpsi[targetIdx], daftarSoal[soalAktifIndex]);
        }
      }
    });

    inisialisasiSesi();
  