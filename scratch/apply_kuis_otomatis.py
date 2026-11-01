import sys

sys.stdout.reconfigure(encoding='utf-8')

print("Starting patch for kuis otomatis (Pilihan A)...")

# ==============================================================================
# 1. PATCH SISWA/MAIN.HTML
# ==============================================================================
with open('siswa/main.html', 'r', encoding='utf-8') as f:
    siswa = f.read()

# Replace the feedback waiting container
old_feedback_waiting = """      <div class="p-2 bg-light rounded-3 border-2 border-dark text-secondary small fw-bold">
        ⏳ Menunggu Guru melanjutkan ke babak berikutnya...
      </div>"""

new_feedback_waiting = """      <div id="feedback-status-lanjut" class="p-2 bg-light rounded-3 border-2 border-dark text-secondary small fw-bold">
        <span id="feedback-hitung-mundur-teks">⚡ Lanjut otomatis ke soal berikutnya dalam 2 detik...</span>
      </div>
      <button id="btn-langsung-soal-berikutnya" type="button" class="btn btn-kupas-hijau btn-sm fw-bold mt-2 smartboard-btn">
        Lanjut Sekarang ➔
      </button>"""

if old_feedback_waiting in siswa:
    siswa = siswa.replace(old_feedback_waiting, new_feedback_waiting)
elif old_feedback_waiting.replace('\n', '\r\n') in siswa:
    siswa = siswa.replace(old_feedback_waiting.replace('\n', '\r\n'), new_feedback_waiting.replace('\n', '\r\n'))

# Replace JavaScript state declarations & channel handler in siswa/main.html
old_js_start = """    let soalSekarang = null;
    let jawabanDipilih = null;
    let sudahMengunci = false;
    let waktuMulaiSoal = 0;
    let timerInterval = null;

    const channel = sesiManager.langgananSesi(kodeSesi, {
      onAksiBroadcast: async (payload) => {
        try {
          if (!payload) return;
          const { aksi } = payload;

          if (aksi === 'tampil_soal') {
            if (!payload.soal) {
              console.error('[Siswa] Payload tampil_soal tidak memiliki objek soal:', payload);
              return;
            }
            bukaLayarSoal(payload.soal, payload.soalIndex, payload.totalSoal);
          } else if (aksi === 'buka_pembahasan') {
            tampilkanUmpanBalik(payload);
          } else if (aksi === 'tampil_skor') {
            tampilkanPapanSkorSiswa(payload.peserta);
          } else if (aksi === 'selesai_sesi') {
            tampilkanHasilAkhirSiswa();
          }
        } catch (err) {
          console.error('[Siswa] Gagal memproses aksi_sesi broadcast:', err);
        }
      }
    });"""

new_js_start = """    let soalSekarang = null;
    let jawabanDipilih = null;
    let sudahMengunci = false;
    let waktuMulaiSoal = 0;
    let timerInterval = null;
    let daftarSoalSiswa = [];
    let indexSoalSiswa = 0;
    let timerLanjutOtomatis = null;
    let timerCountdownJeda = null;

    const channel = sesiManager.langgananSesi(kodeSesi, {
      onAksiBroadcast: async (payload) => {
        try {
          if (!payload) return;
          const { aksi } = payload;

          if (aksi === 'tampil_soal' || aksi === 'mulai_kuis') {
            if (payload.daftarSoal && Array.isArray(payload.daftarSoal) && payload.daftarSoal.length > 0) {
              daftarSoalSiswa = payload.daftarSoal;
            } else if (payload.soal) {
              daftarSoalSiswa = [payload.soal];
            }
            indexSoalSiswa = payload.soalIndex || 0;
            if (daftarSoalSiswa[indexSoalSiswa]) {
              bukaLayarSoal(daftarSoalSiswa[indexSoalSiswa], indexSoalSiswa, daftarSoalSiswa.length);
            }
          } else if (aksi === 'tampil_skor') {
            tampilkanPapanSkorSiswa(payload.peserta);
          } else if (aksi === 'selesai_sesi') {
            tampilkanHasilAkhirSiswa();
          }
        } catch (err) {
          console.error('[Siswa] Gagal memproses aksi_sesi broadcast:', err);
        }
      }
    });"""

if old_js_start in siswa:
    siswa = siswa.replace(old_js_start, new_js_start)
elif old_js_start.replace('\n', '\r\n') in siswa:
    siswa = siswa.replace(old_js_start.replace('\n', '\r\n'), new_js_start.replace('\n', '\r\n'))

# Replace periksaStatusSesiAwal to load full questions for late joiners
old_periksa = """    async function periksaStatusSesiAwal() {
      try {
        const sesiTerkini = await sesiManager.ambilSesiByKode(kodeSesi);
        if (sesiTerkini && sesiTerkini.status === 'berjalan') {
          console.log('[Siswa] Sesi sudah berjalan saat siswa bergabung. Mengambil soal aktif...');
          const resKuis = await kuisManager.ambilKuisDetail(sesiTerkini.kuis_id);
          let listSoal = resKuis.soal || [];
          if (listSoal.length === 0) {
            const resFallback = await kuisManager.ambilKuisDetail('kuis-ekosistem-1');
            listSoal = resFallback.soal || [];
          }
          const idx = Math.max(0, (sesiTerkini.soal_aktif || 1) - 1);
          const soal = listSoal[idx] || listSoal[0];
          if (soal) {
            bukaLayarSoal({
              id: soal.id,
              urutan: soal.urutan,
              tipe: soal.tipe,
              teks: soal.teks,
              opsi: soal.opsi,
              waktu_detik: Math.round(soal.waktu_detik * (sesiTerkini.pengali_waktu || 1))
            }, idx, listSoal.length);
          }
        }
      } catch (err) {
        console.error('[Siswa] Gagal memeriksa status sesi awal:', err);
      }
    }"""

new_periksa = """    async function periksaStatusSesiAwal() {
      try {
        const sesiTerkini = await sesiManager.ambilSesiByKode(kodeSesi);
        if (sesiTerkini && sesiTerkini.status === 'berjalan') {
          console.log('[Siswa] Sesi sudah berjalan saat siswa bergabung. Mengambil daftar soal...');
          let listSoal = [];
          const storedSoal = localStorage.getItem('kupas_sesi_soal_' + sesiTerkini.id);
          if (storedSoal) {
            try { listSoal = JSON.parse(storedSoal); } catch(e) {}
          }
          if (!listSoal || listSoal.length === 0) {
            const resKuis = await kuisManager.ambilKuisDetail(sesiTerkini.kuis_id);
            listSoal = resKuis.soal || [];
            if (listSoal.length === 0) {
              const resFallback = await kuisManager.ambilKuisDetail('kuis-ekosistem-1');
              listSoal = resFallback.soal || [];
            }
          }
          if (listSoal.length > 0) {
            daftarSoalSiswa = listSoal;
            indexSoalSiswa = 0;
            bukaLayarSoal(daftarSoalSiswa[0], 0, daftarSoalSiswa.length);
          }
        }
      } catch (err) {
        console.error('[Siswa] Gagal memeriksa status sesi awal:', err);
      }
    }"""

if old_periksa in siswa:
    siswa = siswa.replace(old_periksa, new_periksa)
elif old_periksa.replace('\n', '\r\n') in siswa:
    siswa = siswa.replace(old_periksa.replace('\n', '\r\n'), new_periksa.replace('\n', '\r\n'))

# Replace pilihOpsi, kunciJawaban, and tampilkanUmpanBalik
old_opsi_logic = """    function pilihOpsi(nilai, elemenBtn) {
      jawabanDipilih = nilai;
      const hurufOpsi = ['A', 'B', 'C', 'D'];
      document.querySelectorAll('.opsi-jawaban').forEach((b, idx) => {
        b.classList.remove('terpilih');
        b.setAttribute('aria-checked', 'false');
        const ind = b.querySelector('.indikator-pilih-opsi');
        if (ind) {
          ind.className = 'badge bg-light text-secondary border border-dark rounded-pill small indikator-pilih-opsi';
          ind.textContent = hurufOpsi[idx] || '';
        }
      });
      elemenBtn.classList.add('terpilih');
      elemenBtn.setAttribute('aria-checked', 'true');
      const indAktif = elemenBtn.querySelector('.indikator-pilih-opsi');
      if (indAktif) {
        indAktif.className = 'badge bg-dark text-white rounded-pill small indikator-pilih-opsi';
        indAktif.textContent = '✓ Dipilih';
      }

      suara.mainkan('klik');
      animasi.pop(elemenBtn);

      const btnKirim = document.getElementById('btn-kirim-jawaban');
      btnKirim.disabled = false;
      btnKirim.focus();
    }

    // Dukungan Pintasan Keyboard 1-4 & Enter (PRD 8.2)
    document.addEventListener('keydown', (e) => {
      if (vSoal.classList.contains('d-none') || sudahMengunci) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const tombolOpsi = document.querySelectorAll('.opsi-jawaban');
        if (tombolOpsi[idx]) {
          e.preventDefault();
          tombolOpsi[idx].click();
        }
      } else if (e.key === 'Enter') {
        const btnKirim = document.getElementById('btn-kirim-jawaban');
        if (!btnKirim.disabled) {
          e.preventDefault();
          btnKirim.click();
        }
      }
    });

    function jalankanTimerSiswa(detik) {
      clearInterval(timerInterval);
      const bar = document.getElementById('siswa-timer-bar');
      const txt = document.getElementById('siswa-teks-timer');

      if (!detik || detik <= 0) {
        txt.textContent = 'Bebas';
        bar.style.transform = 'scaleX(1)';
        bar.style.backgroundColor = '#16A34A';
        return;
      }

      let sisa = detik;
      const maks = detik;
      txt.textContent = sisa + ' dtk';
      bar.style.transform = 'scaleX(1)';

      timerInterval = setInterval(() => {
        sisa--;
        txt.textContent = sisa + ' dtk';
        bar.style.transform = `scaleX(${Math.max(0, sisa / maks)})`;

        if (sisa <= 0) {
          clearInterval(timerInterval);
          if (!sudahMengunci) {
            kunciJawaban();
          }
        }
      }, 1000);
    }

    async function kunciJawaban() {
      if (sudahMengunci) return;
      sudahMengunci = true;
      clearInterval(timerInterval);

      const btnKirim = document.getElementById('btn-kirim-jawaban');
      btnKirim.disabled = true;
      btnKirim.textContent = 'Jawaban Terkunci ✓';
      btnKirim.classList.remove('btn-kupas-hijau');
      btnKirim.classList.add('btn-secondary');

      const waktuMs = Date.now() - waktuMulaiSoal;

      try {
        const hasil = await sesiManager.kirimJawabanSiswa({
          sesiId: sesi.id,
          pesertaId: peserta.id,
          soalId: soalSekarang.id,
          jawaban: jawabanDipilih !== null ? jawabanDipilih : '-1',
          waktuMs
        });

        sessionStorage.setItem('kupas_terakhir_jawab', JSON.stringify(hasil));

        if (hasil.benar) {
          peserta.skor = (peserta.skor || 0) + hasil.poin;
          sessionStorage.setItem('kupas_peserta', JSON.stringify(peserta));
        }

        umumkanAria('Jawaban berhasil dikunci dan dikirim!');
      } catch (err) {
        console.warn('Gagal kirim jawaban:', err);
      }
    }

    document.getElementById('btn-kirim-jawaban').addEventListener('click', kunciJawaban);

    // 2. Tampilkan Umpan Balik Ekspresif (Lompat + Konfeti bila Benar, Goyang Lembut + Menyemangati bila Salah)
    function tampilkanUmpanBalik(payload) {
      clearInterval(timerInterval);
      const hasilJawab = JSON.parse(sessionStorage.getItem('kupas_terakhir_jawab') || '{}');
      const benar = hasilJawab.benar || false;

      const infoG = gamifikasi.catatHasilJawab(benar);
      segarkanStatusAtas();

      const maskotFeedback = document.getElementById('maskot-siswa-feedback');
      const judulFeedback = document.getElementById('feedback-judul');
      const subpesanFeedback = document.getElementById('feedback-subpesan');
      const badgePoin = document.getElementById('feedback-poin-badge');
      const badgeXP = document.getElementById('feedback-xp-badge');
      const kotakFeedback = document.getElementById('feedback-kotak');

      const pesanSemangatRamah = [
        'Hampir tepat! Jangan menyerah ya, setiap usaha membuatmu makin pintar memahami ekosistem!',
        'Tidak apa-apa belum tepat! Yuk baca pembahasannya agar di soal berikutnya kamu makin hebat!',
        'Tetap semangat Petualang! Belajar dari kesalahan adalah kunci ilmuwan IPAS sejati!'
      ];

      if (benar) {
        maskotFeedback.src = '../assets/svg/maskot-bersorak.svg';
        maskotFeedback.className = 'mb-2 anim-lompat-benar';
        judulFeedback.textContent = '✓ Hebat, Jawabanmu Benar! 🌟';
        judulFeedback.className = 'h3 fw-bolder mb-1 text-success';
        subpesanFeedback.textContent = infoG.streakJawab >= 2
          ? `🔥 Luar biasa! Kamu menjawab ${infoG.streakJawab} soal benar berturut-turut!`
          : 'Teruskan langkah hebatmu menjelajahi rantai makanan!';
        badgePoin.textContent = `✓ +${hasilJawab.poin || 10} Poin`;
        badgePoin.className = 'badge fs-6 rounded-pill px-3 py-2 border border-dark bg-success text-white';
        badgeXP.textContent = `+${infoG.streakJawab >= 3 ? 35 : 25} XP ⭐`;
        kotakFeedback.className = 'feedback-box text-start mb-3 feedback-benar';
        suara.mainkan('benar');
        cetusKonfeti();
        animasi.lompat(maskotFeedback);
      } else {
        maskotFeedback.src = '../assets/svg/maskot-sedih-menyemangati.svg';
        maskotFeedback.className = 'mb-2 anim-melambai';
        judulFeedback.textContent = '💡 Belum Tepat, Ayo Semangat! 💪';
        judulFeedback.className = 'h3 fw-bolder mb-1 text-dark';
        subpesanFeedback.textContent = pesanSemangatRamah[(payload.soalIndex || 0) % pesanSemangatRamah.length];
        badgePoin.textContent = '+0 Poin';
        badgePoin.className = 'badge fs-6 rounded-pill px-3 py-2 border border-dark bg-secondary text-white';
        badgeXP.textContent = '+5 XP Usaha Belajar ⭐';
        kotakFeedback.className = 'feedback-box text-start mb-3 feedback-salah';
        suara.mainkan('salah');
      }

      const elPenjelasan = document.getElementById('feedback-penjelasan');
      if (payload.penjelasan === null) {
        if (elPenjelasan && elPenjelasan.parentElement) {
          elPenjelasan.parentElement.classList.add('d-none');
        }
      } else {
        if (elPenjelasan && elPenjelasan.parentElement) {
          elPenjelasan.parentElement.classList.remove('d-none');
          elPenjelasan.textContent = payload.penjelasan || 'Konsep ekosistem & rantai makanan.';
        }
      }

      const wadahKamusSiswa = document.getElementById('wadah-tombol-kamus-siswa');
      const detailKamusSiswa = document.getElementById('detail-kamus-siswa');
      detailKamusSiswa.classList.add('d-none');

      if (payload.kamusEntri) {
        const k = payload.kamusEntri;
        wadahKamusSiswa.classList.remove('d-none');
        const btnKamus = document.getElementById('btn-pelajari-kamus-siswa');
        btnKamus.textContent = `📖 Pelajari: ${k.istilah}`;
        document.getElementById('kamus-siswa-kategori').textContent = k.kategori;
        document.getElementById('kamus-siswa-istilah').textContent = k.istilah;
        document.getElementById('kamus-siswa-definisi').textContent = k.definisi;
        document.getElementById('kamus-siswa-contoh').textContent = k.contoh ? `Contoh: ${k.contoh}` : '';

        btnKamus.onclick = () => {
          detailKamusSiswa.classList.toggle('d-none');
          suara.mainkan('klik');
          animasi.pop(detailKamusSiswa);
        };
      } else {
        wadahKamusSiswa.classList.add('d-none');
      }

      if (sesi && sesi.mode === 'adventure') {
        const petaBox = document.getElementById('siswa-peta-box');
        petaBox.classList.remove('d-none');
        const step = Math.min((payload.soalIndex || 0) + 1, 4);
        const maskotPeta = document.getElementById('siswa-peta-maskot');
        const wadahPeta = petaBox.querySelector('.peta-container');
        const lebarPeta = (wadahPeta && wadahPeta.clientWidth) ? wadahPeta.clientWidth : 300;
        const geserPx = Math.round(lebarPeta * 0.72 * ((step - 1) / 3));
        maskotPeta.style.transform = `translateX(${geserPx}px)`;
      }

      gantiView(vFeedback);
      if (!benar) {
        animasi.goyang(vFeedback);
      }
      umumkanAria(benar ? 'Jawaban Anda benar!' : 'Jawaban belum tepat, tetap semangat!');
    }"""

new_opsi_logic = """    function pilihOpsi(nilai, elemenBtn) {
      if (sudahMengunci) return;
      jawabanDipilih = nilai;
      const hurufOpsi = ['A', 'B', 'C', 'D'];
      document.querySelectorAll('.opsi-jawaban').forEach((b, idx) => {
        b.classList.remove('terpilih');
        b.setAttribute('aria-checked', 'false');
        const ind = b.querySelector('.indikator-pilih-opsi');
        if (ind) {
          ind.className = 'badge bg-light text-secondary border border-dark rounded-pill small indikator-pilih-opsi';
          ind.textContent = hurufOpsi[idx] || '';
        }
      });
      if (elemenBtn) {
        elemenBtn.classList.add('terpilih');
        elemenBtn.setAttribute('aria-checked', 'true');
        const indAktif = elemenBtn.querySelector('.indikator-pilih-opsi');
        if (indAktif) {
          indAktif.className = 'badge bg-dark text-white rounded-pill small indikator-pilih-opsi';
          indAktif.textContent = '✓ Dipilih';
        }
        suara.mainkan('klik');
        animasi.pop(elemenBtn);
      }

      // LANGSUNG nilai seketika tanpa persetujuan guru (cegah tap ganda)
      kunciJawaban(false);
    }

    // Dukungan Pintasan Keyboard 1-4 & Enter (PRD 8.2)
    document.addEventListener('keydown', (e) => {
      if (vSoal.classList.contains('d-none') || sudahMengunci) return;

      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const tombolOpsi = document.querySelectorAll('.opsi-jawaban');
        if (tombolOpsi[idx]) {
          e.preventDefault();
          tombolOpsi[idx].click();
        }
      } else if (e.key === 'Enter') {
        const btnKirim = document.getElementById('btn-kirim-jawaban');
        if (!btnKirim.disabled) {
          e.preventDefault();
          btnKirim.click();
        }
      }
    });

    function jalankanTimerSiswa(detik) {
      clearInterval(timerInterval);
      const bar = document.getElementById('siswa-timer-bar');
      const txt = document.getElementById('siswa-teks-timer');

      if (!detik || detik <= 0) {
        txt.textContent = 'Bebas';
        bar.style.transform = 'scaleX(1)';
        bar.style.backgroundColor = '#16A34A';
        return;
      }

      let sisa = detik;
      const maks = detik;
      txt.textContent = sisa + ' dtk';
      bar.style.transform = 'scaleX(1)';

      timerInterval = setInterval(() => {
        sisa--;
        txt.textContent = sisa + ' dtk';
        bar.style.transform = `scaleX(${Math.max(0, sisa / maks)})`;

        if (sisa <= 0) {
          clearInterval(timerInterval);
          if (!sudahMengunci) {
            // Waktu habis: hitung salah dan kuis lanjut otomatis
            kunciJawaban(true);
          }
        }
      }, 1000);
    }

    async function kunciJawaban(isTimeout = false) {
      if (sudahMengunci) return;
      sudahMengunci = true;
      clearInterval(timerInterval);

      // Kunci seluruh tombol seketika untuk mencegah tap ganda
      document.querySelectorAll('.opsi-jawaban').forEach(b => {
        b.disabled = true;
        b.style.pointerEvents = 'none';
      });
      const inputIsian = document.getElementById('siswa-input-isian');
      if (inputIsian) inputIsian.disabled = true;

      const btnKirim = document.getElementById('btn-kirim-jawaban');
      if (btnKirim) {
        btnKirim.disabled = true;
        btnKirim.textContent = isTimeout ? 'Waktu Habis ⏱️' : 'Jawaban Terkunci ✓';
        btnKirim.classList.remove('btn-kupas-hijau');
        btnKirim.classList.add('btn-secondary');
      }

      const waktuMs = Date.now() - waktuMulaiSoal;
      const jawabanKirim = (isTimeout || jawabanDipilih === null) ? '-1' : jawabanDipilih;

      let hasil = null;
      try {
        hasil = await sesiManager.kirimJawabanSiswa({
          sesiId: sesi.id,
          pesertaId: peserta.id,
          soalId: soalSekarang.id,
          jawaban: jawabanKirim,
          waktuMs
        });
      } catch (err) {
        console.warn('Gagal kirim jawaban via RPC, fallback penilaian lokal:', err);
        hasil = {
          success: true,
          benar: false,
          poin: 0,
          penjelasan: soalSekarang ? soalSekarang.penjelasan : ''
        };
      }

      sessionStorage.setItem('kupas_terakhir_jawab', JSON.stringify(hasil));

      if (hasil && hasil.benar) {
        peserta.skor = (peserta.skor || 0) + (hasil.poin || 10);
        sessionStorage.setItem('kupas_peserta', JSON.stringify(peserta));
      }

      // Beritahu dasbor guru progres siswa saat ini secara langsung
      try {
        channel.send({
          type: 'broadcast',
          event: 'aksi_sesi',
          payload: {
            aksi: 'progres_siswa',
            pesertaId: peserta.id,
            nama: peserta.nama_panggilan,
            avatar: peserta.avatar,
            soalIndex: indexSoalSiswa + 1,
            totalSoal: Math.max(1, daftarSoalSiswa.length),
            skor: peserta.skor || 0,
            benar: hasil ? hasil.benar : false,
            selesai: (indexSoalSiswa + 1 >= Math.max(1, daftarSoalSiswa.length))
          }
        });
      } catch (e) {
        console.warn('[Siswa] Gagal menyiarkan progres ke guru:', e);
      }

      // Entri kamus
      let entriKamus = null;
      const kamusId = (hasil && hasil.kamus_id) || (soalSekarang && soalSekarang.kamus_id);
      if (kamusId) {
        try {
          entriKamus = await kamusManager.ambilKamusById(kamusId);
        } catch (e) {}
      }

      // Ambil teks kunci jawaban jika diperlukan
      let teksKunci = '';
      if (soalSekarang && soalSekarang.opsi && soalSekarang.opsi.length) {
        try {
          const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
          const idxKunci = parseInt(kunciDB[soalSekarang.id] || '0', 10);
          teksKunci = soalSekarang.opsi[idxKunci] || `Opsi ${idxKunci + 1}`;
        } catch (e) {}
      }

      // Tampilkan umpan balik seketika
      tampilkanUmpanBalik({
        soalIndex: indexSoalSiswa,
        totalSoal: daftarSoalSiswa.length,
        benar: hasil ? hasil.benar : false,
        poin: hasil ? hasil.poin : 0,
        kunciJawaban: teksKunci,
        penjelasan: (hasil && hasil.penjelasan) || (soalSekarang && soalSekarang.penjelasan) || '',
        kamusEntri: entriKamus,
        isTimeout
      });
    }

    document.getElementById('btn-kirim-jawaban').addEventListener('click', () => {
      kunciJawaban(false);
    });

    // 2. Tampilkan Umpan Balik Ekspresif & Lanjut Otomatis (Tanpa Persetujuan Guru)
    function tampilkanUmpanBalik(payload) {
      clearInterval(timerInterval);
      clearTimeout(timerLanjutOtomatis);
      clearInterval(timerCountdownJeda);

      const benar = Boolean(payload.benar);
      const infoG = gamifikasi.catatHasilJawab(benar);
      segarkanStatusAtas();

      const maskotFeedback = document.getElementById('maskot-siswa-feedback');
      const judulFeedback = document.getElementById('feedback-judul');
      const subpesanFeedback = document.getElementById('feedback-subpesan');
      const badgePoin = document.getElementById('feedback-poin-badge');
      const badgeXP = document.getElementById('feedback-xp-badge');
      const kotakFeedback = document.getElementById('feedback-kotak');

      const pesanSemangatRamah = [
        'Hampir tepat! Jangan menyerah ya, setiap usaha membuatmu makin pintar memahami ekosistem!',
        'Tidak apa-apa belum tepat! Yuk baca pembahasannya agar di soal berikutnya kamu makin hebat!',
        'Tetap semangat Petualang! Belajar dari kesalahan adalah kunci ilmuwan IPAS sejati!'
      ];

      if (benar) {
        maskotFeedback.src = '../assets/svg/maskot-bersorak.svg';
        maskotFeedback.className = 'mb-2 anim-lompat-benar';
        judulFeedback.textContent = '✓ Hebat, Jawabanmu Benar! 🌟';
        judulFeedback.className = 'h3 fw-bolder mb-1 text-success';
        subpesanFeedback.textContent = infoG.streakJawab >= 2
          ? `🔥 Luar biasa! Kamu menjawab ${infoG.streakJawab} soal benar berturut-turut!`
          : 'Teruskan langkah hebatmu menjelajahi rantai makanan!';
        badgePoin.textContent = `✓ +${payload.poin || 10} Poin`;
        badgePoin.className = 'badge fs-6 rounded-pill px-3 py-2 border border-dark bg-success text-white';
        badgeXP.textContent = `+${infoG.streakJawab >= 3 ? 35 : 25} XP ⭐`;
        kotakFeedback.className = 'feedback-box text-start mb-3 feedback-benar';
        suara.mainkan('benar');
        cetusKonfeti();
        animasi.lompat(maskotFeedback);
      } else {
        maskotFeedback.src = '../assets/svg/maskot-sedih-menyemangati.svg';
        maskotFeedback.className = 'mb-2 anim-melambai';
        judulFeedback.textContent = payload.isTimeout ? '⏱️ Waktu Habis!' : '💡 Belum Tepat, Ayo Semangat! 💪';
        judulFeedback.className = 'h3 fw-bolder mb-1 text-dark';
        subpesanFeedback.textContent = pesanSemangatRamah[(payload.soalIndex || 0) % pesanSemangatRamah.length];
        badgePoin.textContent = '+0 Poin';
        badgePoin.className = 'badge fs-6 rounded-pill px-3 py-2 border border-dark bg-secondary text-white';
        badgeXP.textContent = '+5 XP Usaha Belajar ⭐';
        kotakFeedback.className = 'feedback-box text-start mb-3 feedback-salah';
        suara.mainkan('salah');
      }

      // Ambil konfigurasi guru jika ada
      let cfg = { tampilkan_kunci_jawaban: true, tampilkan_penjelasan: true, durasi_jeda_soal: 2 };
      try {
        if (typeof konfigurasiManager !== 'undefined') {
          cfg = { ...cfg, ...konfigurasiManager.ambilPengaturan() };
        }
      } catch (e) {}

      const elPenjelasan = document.getElementById('feedback-penjelasan');
      if (!cfg.tampilkan_penjelasan || payload.penjelasan === null) {
        if (elPenjelasan && elPenjelasan.parentElement) {
          elPenjelasan.parentElement.classList.add('d-none');
        }
      } else {
        if (elPenjelasan && elPenjelasan.parentElement) {
          elPenjelasan.parentElement.classList.remove('d-none');
          let teks = payload.penjelasan || 'Konsep ekosistem & rantai makanan.';
          if (!benar && cfg.tampilkan_kunci_jawaban && payload.kunciJawaban) {
            teks = `Jawaban Benar: ${payload.kunciJawaban}. ` + teks;
          }
          elPenjelasan.textContent = teks;
        }
      }

      // Kamus Belajar
      const wadahKamusSiswa = document.getElementById('wadah-tombol-kamus-siswa');
      const detailKamusSiswa = document.getElementById('detail-kamus-siswa');
      detailKamusSiswa.classList.add('d-none');

      if (payload.kamusEntri) {
        const k = payload.kamusEntri;
        wadahKamusSiswa.classList.remove('d-none');
        const btnKamus = document.getElementById('btn-pelajari-kamus-siswa');
        btnKamus.textContent = `📖 Pelajari: ${k.istilah}`;
        document.getElementById('kamus-siswa-kategori').textContent = k.kategori;
        document.getElementById('kamus-siswa-istilah').textContent = k.istilah;
        document.getElementById('kamus-siswa-definisi').textContent = k.definisi;
        document.getElementById('kamus-siswa-contoh').textContent = k.contoh ? `Contoh: ${k.contoh}` : '';

        btnKamus.onclick = () => {
          detailKamusSiswa.classList.toggle('d-none');
          suara.mainkan('klik');
          animasi.pop(detailKamusSiswa);
        };
      } else {
        wadahKamusSiswa.classList.add('d-none');
      }

      if (sesi && sesi.mode === 'adventure') {
        const petaBox = document.getElementById('siswa-peta-box');
        petaBox.classList.remove('d-none');
        const step = Math.min((payload.soalIndex || 0) + 1, 4);
        const maskotPeta = document.getElementById('siswa-peta-maskot');
        const wadahPeta = petaBox.querySelector('.peta-container');
        const lebarPeta = (wadahPeta && wadahPeta.clientWidth) ? wadahPeta.clientWidth : 300;
        const geserPx = Math.round(lebarPeta * 0.72 * ((step - 1) / 3));
        maskotPeta.style.transform = `translateX(${geserPx}px)`;
      }

      gantiView(vFeedback);
      if (!benar) {
        animasi.goyang(vFeedback);
      }
      umumkanAria(benar ? 'Jawaban Anda benar!' : 'Jawaban belum tepat, tetap semangat!');

      // Transisi otomatis setelah jeda umpan balik singkat
      const jedaDetik = Number(cfg.durasi_jeda_soal) || 2;
      const totalSoal = Math.max(1, daftarSoalSiswa.length);
      const isSoalTerakhir = (indexSoalSiswa + 1 >= totalSoal);

      const teksHitungMundur = document.getElementById('feedback-hitung-mundur-teks');
      const btnLangsung = document.getElementById('btn-langsung-soal-berikutnya');

      let sisaDetik = jedaDetik;
      const updateTeksJeda = () => {
        if (teksHitungMundur) {
          if (isSoalTerakhir) {
            teksHitungMundur.textContent = `🏁 Soal terakhir selesai! Membuka hasil akhir dalam ${sisaDetik} detik...`;
          } else {
            teksHitungMundur.textContent = `⚡ Lanjut otomatis ke soal berikutnya dalam ${sisaDetik} detik...`;
          }
        }
      };
      updateTeksJeda();

      if (btnLangsung) {
        btnLangsung.textContent = isSoalTerakhir ? 'Lihat Hasil Akhir Sekarang ➔' : 'Lanjut Sekarang ➔';
      }

      const eksekusiLanjut = () => {
        clearTimeout(timerLanjutOtomatis);
        clearInterval(timerCountdownJeda);
        indexSoalSiswa++;
        if (indexSoalSiswa < daftarSoalSiswa.length) {
          bukaLayarSoal(daftarSoalSiswa[indexSoalSiswa], indexSoalSiswa, daftarSoalSiswa.length);
        } else {
          tampilkanHasilAkhirSiswa();
        }
      };

      if (btnLangsung) {
        btnLangsung.onclick = eksekusiLanjut;
      }

      timerCountdownJeda = setInterval(() => {
        sisaDetik--;
        if (sisaDetik > 0) {
          updateTeksJeda();
        } else {
          clearInterval(timerCountdownJeda);
        }
      }, 1000);

      timerLanjutOtomatis = setTimeout(eksekusiLanjut, jedaDetik * 1000);
    }"""

if old_opsi_logic in siswa:
    siswa = siswa.replace(old_opsi_logic, new_opsi_logic)
elif old_opsi_logic.replace('\n', '\r\n') in siswa:
    siswa = siswa.replace(old_opsi_logic.replace('\n', '\r\n'), new_opsi_logic.replace('\n', '\r\n'))

with open('siswa/main.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(siswa)

print("Siswa/main.html patched successfully.")

# ==============================================================================
# 2. PATCH GURU/SESI.HTML
# ==============================================================================
with open('guru/sesi.html', 'r', encoding='utf-8') as f:
    guru = f.read()

# Add progress container under teacher control panel in viewSoal
old_guru_panel = """        <div class="d-flex gap-2">
          <button id="btn-tambah-waktu" class="btn btn-outline-dark fw-bold smartboard-btn">
            +10 Detik
          </button>
          <button id="btn-buka-pembahasan" class="btn btn-kupas-kuning fw-bold px-4 smartboard-btn">
            Buka Pembahasan & Jawaban ➔
          </button>
        </div>
      </div>
    </section>"""

new_guru_panel = """        <div class="d-flex gap-2">
          <button id="btn-tambah-waktu" class="btn btn-outline-dark fw-bold smartboard-btn">
            +10 Detik
          </button>
          <button id="btn-buka-pembahasan" class="btn btn-kupas-kuning fw-bold px-4 smartboard-btn">
            📊 Papan Skor Kelas ➔
          </button>
        </div>
      </div>

      <!-- Progres Mandiri Siswa Real-time -->
      <div class="mt-3 p-3 bg-light rounded-3 border-2 border-dark" id="wadah-progres-siswa-guru">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="small fw-bold text-dark">🚀 Progres Langsung Siswa (Penilaian Otomatis):</span>
          <span class="badge bg-success-subtle text-success border border-success rounded-pill px-2 py-1 small fw-bold" id="badge-status-kuis-otomatis">Siswa Bergerak Mandiri</span>
        </div>
        <div class="row g-2" id="grid-progres-siswa">
          <!-- Diisi progres real-time per siswa -->
        </div>
      </div>
    </section>"""

if old_guru_panel in guru:
    guru = guru.replace(old_guru_panel, new_guru_panel)
elif old_guru_panel.replace('\n', '\r\n') in guru:
    guru = guru.replace(old_guru_panel.replace('\n', '\r\n'), new_guru_panel.replace('\n', '\r\n'))

# Add live tracking map & perbaruiTampilanProgresGuru in guru/sesi.html
old_guru_vars = """    let channelRealtime = null;
    let timerInterval = null;
    let sisaWaktu = 30;
    let durasiMaks = 30;"""

new_guru_vars = """    let channelRealtime = null;
    let timerInterval = null;
    let sisaWaktu = 30;
    let durasiMaks = 30;
    const progresPesertaMap = new Map();

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
                ${prog.selesai ? '🏁 Selesai' : 'Soal ' + prog.soalIndex + '/' + prog.totalSoal}
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
          badge.textContent = '🎉 Seluruh Siswa Selesai!';
          badge.className = 'badge bg-success text-white rounded-pill px-2 py-1 small fw-bold';
        }
      }
    }"""

if old_guru_vars in guru:
    guru = guru.replace(old_guru_vars, new_guru_vars)
elif old_guru_vars.replace('\n', '\r\n') in guru:
    guru = guru.replace(old_guru_vars.replace('\n', '\r\n'), new_guru_vars.replace('\n', '\r\n'))

# Update subscriptions in guru/sesi.html to listen to progres_siswa
old_subs = """        onPesertaUpdate: async () => {
          await segarkanDaftarPeserta();
        },
        onAksiBroadcast: async (payload) => {
          if (payload && (payload.aksi === 'siswa_gabung' || payload.aksi === 'siswa_keluar')) {
            if (payload.aksi === 'siswa_keluar' && payload.pesertaId) {
              try {
                const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
                const filtered = store.filter(p => p.id !== payload.pesertaId);
                localStorage.setItem('kupas_db_peserta', JSON.stringify(filtered));
              } catch (e) {
                console.error('[Lobi Guru] Gagal menghapus data peserta keluar:', e);
              }
            }
            await segarkanDaftarPeserta();
          }
        },
        onJawabanMasuk: (payload) => {
          if (payload.new && payload.new.sesi_id === sesi.id) {
            jawabanMasukSet.add(payload.new.peserta_id);
            document.getElementById('hitung-menjawab').textContent = jawabanMasukSet.size;
          }
        }"""

new_subs = """        onPesertaUpdate: async () => {
          await segarkanDaftarPeserta();
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
              await segarkanDaftarPeserta();
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
        }"""

if old_subs in guru:
    guru = guru.replace(old_subs, new_subs)
elif old_subs.replace('\n', '\r\n') in guru:
    guru = guru.replace(old_subs.replace('\n', '\r\n'), new_subs.replace('\n', '\r\n'))

# Update broadcast in mulaiSoal to include daftarSoal & save to localStorage
old_broadcast_soal = """        // Siarkan aksi ke siswa
        await sesiManager.kirimAksi(channelRealtime, 'tampil_soal', {
          soalIndex: idx,
          totalSoal: daftarSoal.length,
          soal: {
            id: soal.id,
            urutan: soal.urutan,
            tipe: soal.tipe,
            teks: soal.teks,
            opsi: soal.opsi,
            waktu_detik: durasiFinal
          }
        });"""

new_broadcast_soal = """        // Simpan daftar soal sesi ke storage lokal agar dapat diakses siswa yang berjalan mandiri
        try {
          localStorage.setItem('kupas_sesi_soal_' + sesi.id, JSON.stringify(daftarSoal));
        } catch(e) {}

        // Siarkan aksi ke siswa beserta seluruh paket butir soal untuk alur mandiri
        await sesiManager.kirimAksi(channelRealtime, 'tampil_soal', {
          soalIndex: idx,
          totalSoal: daftarSoal.length,
          soal: {
            id: soal.id,
            urutan: soal.urutan,
            tipe: soal.tipe,
            teks: soal.teks,
            opsi: soal.opsi,
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
            waktu_detik: durasiFinal,
            penjelasan: s.penjelasan,
            kamus_id: s.kamus_id
          }))
        });
        perbaruiTampilanProgresGuru();"""

if old_broadcast_soal in guru:
    guru = guru.replace(old_broadcast_soal, new_broadcast_soal)
elif old_broadcast_soal.replace('\n', '\r\n') in guru:
    guru = guru.replace(old_broadcast_soal.replace('\n', '\r\n'), new_broadcast_soal.replace('\n', '\r\n'))

with open('guru/sesi.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(guru)

print("Guru/sesi.html patched successfully.")

