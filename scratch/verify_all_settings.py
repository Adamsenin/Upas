import sys
import subprocess
import urllib.request
import json
import time
import os
import shutil
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_settings_suite_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9236
base_url = "http://localhost:8090"

print("=================================================================", flush=True)
print("MENJALANKAN TEST SUITE LENGKAP: FITUR PENGATURAN KUIS GURU", flush=True)
print("=================================================================", flush=True)

proc = subprocess.Popen([
    chrome_path,
    f"--remote-debugging-port={port}",
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    f"--user-data-dir={tmp_profile}"
])

results = []

def record_test(name, passed, detail=""):
    status = "PASS" if passed else "FAIL"
    results.append({"name": name, "passed": passed, "detail": detail})
    symbol = "✅" if passed else "❌"
    print(f"{symbol} [{status}] {name}", flush=True)
    if detail:
        print(f"   Detail: {detail}", flush=True)

try:
    time.sleep(2)

    def create_page(url):
        req = urllib.request.Request(f"http://localhost:{port}/json/new?{url}", method="PUT")
        res = urllib.request.urlopen(req)
        target = json.loads(res.read().decode('utf-8'))
        cdp = SimpleCDP(target["webSocketDebuggerUrl"])
        time.sleep(1.5)
        return cdp, target["id"]

    def close_page(target_id):
        try:
            req = urllib.request.Request(f"http://localhost:{port}/json/close/{target_id}", method="PUT")
            urllib.request.urlopen(req)
        except:
            pass

    # -------------------------------------------------------------
    # TEST 1: Navigasi & Trigger di Dasbor Guru
    # -------------------------------------------------------------
    print("\n--- TEST 1: Navigasi & Trigger di Dasbor Guru ---", flush=True)
    page_dasbor, id_dasbor = create_page(f"{base_url}/guru/dasbor.html")

    has_sidebar_btn = page_dasbor.eval("!!document.getElementById('btn-sidebar-pengaturan-kuis')")
    record_test("Tombol Pengaturan di Sidebar Guru", has_sidebar_btn)

    has_tab_btn = page_dasbor.eval("!!document.getElementById('btn-tab-pengaturan-kuis')")
    record_test("Tombol Pengaturan di Tab Dasbor", has_tab_btn)

    page_dasbor.eval("""
    (function() {
        const btn = document.getElementById('btn-tab-pengaturan-kuis');
        if (btn) btn.click();
    })()
    """)
    time.sleep(1)

    modal_opened = page_dasbor.eval("""
    (function() {
        const modal = document.getElementById('modalPengaturanGame');
        return !!modal && (modal.classList.contains('show') || modal.style.display === 'block');
    })()
    """)
    record_test("Modal Pengaturan Terbuka saat Tombol Tab Diklik", modal_opened)

    accordions_ok = page_dasbor.eval("""
    (function() {
        const ids = ['collapseSoal', 'collapseWaktu', 'collapsePoin', 'collapseSesi', 'collapseTampilan', 'collapseFeedback'];
        return ids.every(id => !!document.getElementById(id));
    })()
    """)
    record_test("6 Kategori Accordion Lengkap di Modal Pengaturan", accordions_ok)

    has_modal_mulai_btn = page_dasbor.eval("!!document.getElementById('btn-atur-parameter-dasbor')")
    record_test("Tombol Atur Parameter di Modal Mulai Sesi", has_modal_mulai_btn)

    close_page(id_dasbor)

    # -------------------------------------------------------------
    # TEST 2: Perilaku Default Tanpa Mengubah Pengaturan
    # -------------------------------------------------------------
    print("\n--- TEST 2: Nilai Default Pengaturan & Perilaku Bawaan ---", flush=True)
    page_def, id_def = create_page(f"{base_url}/guru/dasbor.html")
    
    defaults_ok = page_def.eval("""
    (function() {
        localStorage.removeItem('kupas_pengaturan_kuis');
        const cfg = window.konfigurasiManager ? window.konfigurasiManager.ambilPengaturan() : null;
        if (!cfg) return false;
        return cfg.jumlah_soal === 0 &&
               cfg.topik === 'semua' &&
               cfg.tingkat_kesulitan === 'semua' &&
               cfg.acak_soal === false &&
               cfg.batas_waktu === 'otomatis' &&
               cfg.jeda_antar_soal === 'manual' &&
               cfg.poin_benar === 10 &&
               cfg.maks_peserta === 0 &&
               cfg.izinkan_gabung_setelah_mulai === true &&
               cfg.ukuran_teks === 'normal' &&
               cfg.tampilkan_kunci_jawaban === true &&
               cfg.tampilkan_penjelasan === true;
    })()
    """)
    record_test("Nilai Default Sesuai 100% dengan Perilaku Lama Proyek", defaults_ok)
    close_page(id_def)

    # -------------------------------------------------------------
    # TEST 3: Ubah Jumlah Soal ke 5 & Poin ke 50 (Sesi Kuis Berjalan)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Pengaturan Jumlah Soal = 5, Poin = 50, Teks = Besar ---", flush=True)
    kode_sesi_3 = "SETT03"
    page_guru, id_guru = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi_3}")
    time.sleep(1.5)

    page_guru.eval(f"""
    (function() {{
        const sesi = {{
            id: 'sesi-test-3',
            kode: '{kode_sesi_3}',
            guru_id: 'guru-demo-1',
            kuis_id: 'kuis-ekosistem-1',
            status: 'lobi',
            mode: 'custom',
            created_at: new Date().toISOString()
        }};
        localStorage.setItem('kupas_db_sesi', JSON.stringify([sesi]));
        localStorage.setItem('kupas_db_peserta', JSON.stringify([]));
        
        const cfgBaru = {{
            jumlah_soal: 5,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            acak_soal: false,
            batas_waktu: 'otomatis',
            jeda_antar_soal: 'manual',
            poin_benar: 50,
            bonus_kecepatan: false,
            maks_peserta: 0,
            tampilkan_peringkat: 'selama_kuis',
            izinkan_gabung_setelah_mulai: true,
            ukuran_teks: 'besar',
            tingkat_gerak: 'penuh',
            sfx_aktif: true,
            tampilkan_kunci_jawaban: true,
            tampilkan_penjelasan: true
        }};
        localStorage.setItem('kupas_pengaturan_kuis', JSON.stringify(cfgBaru));
        window.location.reload();
    }})()
    """)
    time.sleep(2)

    summary_text = page_guru.eval("document.getElementById('wadah-ringkasan-pengaturan').textContent")
    has_5_soal_badge = "5 Soal" in summary_text
    has_50_poin_badge = "50 Poin" in summary_text
    has_smartboard_badge = "Smartboard" in summary_text
    record_test("Pill Ringkasan Lobi Menampilkan 5 Soal", has_5_soal_badge, summary_text)
    record_test("Pill Ringkasan Lobi Menampilkan 50 Poin", has_50_poin_badge, summary_text)
    record_test("Pill Ringkasan Lobi Menampilkan Smartboard", has_smartboard_badge, summary_text)

    is_smartboard_active = page_guru.eval("document.body.classList.contains('smartboard-mode')")
    record_test("Class 'smartboard-mode' Diterapkan pada Body", is_smartboard_active)

    # Siswa 1 bergabung lewat gabung.html
    page_s3, id_s3 = create_page(f"{base_url}/gabung.html")
    page_s3.eval(f"""
    (function() {{
        document.getElementById('input-kode').value = '{kode_sesi_3}';
        document.getElementById('input-nama').value = 'Budi';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2)

    page_guru.eval("document.getElementById('btn-mulai-kuis').click();")
    time.sleep(4.5)

    label_soal = page_guru.eval("document.getElementById('label-nomor-soal').textContent.trim()")
    soal_count_is_5 = "5" in label_soal
    record_test("Kuis Berjalan Menggunakan Tepat 5 Butir Soal", soal_count_is_5, label_soal)

    has_btn_info = page_guru.eval("!document.getElementById('btn-lihat-pengaturan-soal').classList.contains('d-none')")
    record_test("Tombol Info Pengaturan Tersedia di Layar Soal Guru", has_btn_info)

    read_only_verified = page_guru.eval("""
    (function() {
        document.getElementById('btn-lihat-pengaturan-soal').click();
        const modal = document.getElementById('modalPengaturanGame');
        const alertLock = modal.querySelector('.alert-warning');
        const inputDisabled = document.getElementById('cfg-jumlah-soal').disabled;
        const noSaveBtn = !document.getElementById('btn-simpan-pengaturan');
        return !!alertLock && inputDisabled && noSaveBtn;
    })()
    """)
    record_test("Mode Hanya-Baca Aktif Sempurna saat Kuis Berjalan (Form Terkunci)", read_only_verified)

    close_page(id_guru)
    close_page(id_s3)

    # -------------------------------------------------------------
    # TEST 4: Batas Waktu Tanpa Batas (Bebas / 0 Detik)
    # -------------------------------------------------------------
    print("\n--- TEST 4: Batas Waktu Tanpa Batas (0 Detik) ---", flush=True)
    kode_sesi_4 = "SETT04"
    page_guru4, id_guru4 = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi_4}")
    time.sleep(1.5)

    page_guru4.eval(f"""
    (function() {{
        const sesi = {{
            id: 'sesi-test-4',
            kode: '{kode_sesi_4}',
            guru_id: 'guru-demo-1',
            kuis_id: 'kuis-ekosistem-1',
            status: 'lobi',
            mode: 'custom',
            created_at: new Date().toISOString()
        }};
        localStorage.setItem('kupas_db_sesi', JSON.stringify([sesi]));
        localStorage.setItem('kupas_db_peserta', JSON.stringify([]));
        
        const cfg = {{
            jumlah_soal: 5,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            acak_soal: false,
            batas_waktu: 0, // Tanpa batas waktu
            jeda_antar_soal: 'manual',
            poin_benar: 10,
            bonus_kecepatan: false,
            maks_peserta: 0,
            tampilkan_peringkat: 'selama_kuis',
            izinkan_gabung_setelah_mulai: true,
            ukuran_teks: 'normal',
            tingkat_gerak: 'penuh',
            sfx_aktif: true,
            tampilkan_kunci_jawaban: true,
            tampilkan_penjelasan: true
        }};
        localStorage.setItem('kupas_pengaturan_kuis', JSON.stringify(cfg));
        window.location.reload();
    }})()
    """)
    time.sleep(2)

    # Siswa bergabung
    page_s4, id_s4 = create_page(f"{base_url}/gabung.html")
    page_s4.eval(f"""
    (function() {{
        document.getElementById('input-kode').value = '{kode_sesi_4}';
        document.getElementById('input-nama').value = 'Ani';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2)

    page_guru4.eval("document.getElementById('btn-mulai-kuis').click();")
    time.sleep(4.5)

    teks_timer_guru = page_guru4.eval("document.getElementById('teks-timer').textContent.trim()")
    timer_guru_ok = (teks_timer_guru == 'Bebas' or teks_timer_guru == '∞')
    record_test("Timer Guru Menampilkan 'Bebas' / '∞' (Tanpa Batas)", timer_guru_ok, teks_timer_guru)

    # Cek timer di layar guru soal
    close_page(id_guru4)
    close_page(id_s4)

    # -------------------------------------------------------------
    # TEST 5: Batasan Maksimal Kuota Peserta (maks_peserta: 1)
    # -------------------------------------------------------------
    print("\n--- TEST 5: Batasan Kuota Maksimal Peserta ---", flush=True)
    kode_sesi_5 = "SETT05"
    page_g5, id_g5 = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi_5}")
    time.sleep(1.5)

    page_g5.eval(f"""
    (function() {{
        const sesi = {{
            id: 'sesi-test-5',
            kode: '{kode_sesi_5}',
            guru_id: 'guru-demo-1',
            kuis_id: 'kuis-ekosistem-1',
            status: 'lobi',
            mode: 'custom',
            created_at: new Date().toISOString()
        }};
        localStorage.setItem('kupas_db_sesi', JSON.stringify([sesi]));
        localStorage.setItem('kupas_db_peserta', JSON.stringify([]));
        
        const cfg = {{
            jumlah_soal: 0,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            acak_soal: false,
            batas_waktu: 'otomatis',
            jeda_antar_soal: 'manual',
            poin_benar: 10,
            bonus_kecepatan: false,
            maks_peserta: 1, // Hanya 1 murid boleh masuk!
            tampilkan_peringkat: 'selama_kuis',
            izinkan_gabung_setelah_mulai: true,
            ukuran_teks: 'normal',
            tingkat_gerak: 'penuh',
            sfx_aktif: true,
            tampilkan_kunci_jawaban: true,
            tampilkan_penjelasan: true
        }};
        localStorage.setItem('kupas_pengaturan_kuis', JSON.stringify(cfg));
        window.location.reload();
    }})()
    """)
    time.sleep(2)

    page_s1, id_s1 = create_page(f"{base_url}/gabung.html")
    res1 = page_s1.eval(f"""
    (async function() {{
        const {{ auth }} = await import('./assets/js/auth.js');
        const res = await auth.gabungSesiSiswa('{kode_sesi_5}', 'Citra', 'avatar-1.svg');
        return res ? res.peserta.nama_panggilan : null;
    }})()
    """, await_promise=True)
    record_test("Siswa Pertama Berhasil Masuk Kuota", res1 == 'Citra', res1)

    page_s2, id_s2 = create_page(f"{base_url}/gabung.html")
    err_pesan = page_s2.eval(f"""
    (async function() {{
        try {{
            const {{ auth }} = await import('./assets/js/auth.js');
            await auth.gabungSesiSiswa('{kode_sesi_5}', 'Doni', 'avatar-2.svg');
            return 'BERHASIL_SEHARUSNYA_GAGAL';
        }} catch(err) {{
            return err.message;
        }}
    }})()
    """, await_promise=True)

    kuota_terpenuhi_ditolak = "penuh" in err_pesan.lower() and "maksimal 1" in err_pesan.lower()
    record_test("Siswa Kedua Ditolak dengan Pesan Ramah Kuota Penuh", kuota_terpenuhi_ditolak, err_pesan)

    close_page(id_g5)
    close_page(id_s1)
    close_page(id_s2)

    # -------------------------------------------------------------
    # TEST 6: Larangan Bergabung Terlambat (izinkan_gabung: false)
    # -------------------------------------------------------------
    print("\n--- TEST 6: Larangan Bergabung Setelah Kuis Dimulai ---", flush=True)
    kode_sesi_6 = "SETT06"
    page_g6, id_g6 = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi_6}")
    time.sleep(1.5)

    page_g6.eval(f"""
    (function() {{
        const sesi = {{
            id: 'sesi-test-6',
            kode: '{kode_sesi_6}',
            guru_id: 'guru-demo-1',
            kuis_id: 'kuis-ekosistem-1',
            status: 'lobi',
            mode: 'custom',
            created_at: new Date().toISOString()
        }};
        localStorage.setItem('kupas_db_sesi', JSON.stringify([sesi]));
        localStorage.setItem('kupas_db_peserta', JSON.stringify([]));
        
        const cfg = {{
            jumlah_soal: 0,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            acak_soal: false,
            batas_waktu: 'otomatis',
            jeda_antar_soal: 'manual',
            poin_benar: 10,
            bonus_kecepatan: false,
            maks_peserta: 0,
            tampilkan_peringkat: 'selama_kuis',
            izinkan_gabung_setelah_mulai: false, // TIDAK IZINKAN GABUNG TERLAMBAT
            ukuran_teks: 'normal',
            tingkat_gerak: 'penuh',
            sfx_aktif: true,
            tampilkan_kunci_jawaban: true,
            tampilkan_penjelasan: true
        }};
        localStorage.setItem('kupas_pengaturan_kuis', JSON.stringify(cfg));
        window.location.reload();
    }})()
    """)
    time.sleep(2)

    page_s6_1, id_s6_1 = create_page(f"{base_url}/gabung.html")
    page_s6_1.eval(f"""
    (function() {{
        document.getElementById('input-kode').value = '{kode_sesi_6}';
        document.getElementById('input-nama').value = 'Eka';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2)

    page_g6.eval("document.getElementById('btn-mulai-kuis').click();")
    time.sleep(4.5)

    page_s6_late, id_s6_late = create_page(f"{base_url}/gabung.html")
    err_late = page_s6_late.eval(f"""
    (async function() {{
        try {{
            const {{ auth }} = await import('./assets/js/auth.js');
            await auth.gabungSesiSiswa('{kode_sesi_6}', 'Fajar', 'avatar-3.svg');
            return 'BERHASIL_SEHARUSNYA_GAGAL';
        }} catch(err) {{
            return err.message;
        }}
    }})()
    """, await_promise=True)

    late_rejected = "sudah dimulai" in err_late.lower() and "tidak mengizinkan" in err_late.lower()
    record_test("Siswa Terlambat Ditolak saat Kuis Sedang Berjalan", late_rejected, err_late)

    close_page(id_g6)
    close_page(id_s6_1)
    close_page(id_s6_late)

    # -------------------------------------------------------------
    # TEST 7: Reset ke Pengaturan Awal (Kembalikan ke Pengaturan Awal)
    # -------------------------------------------------------------
    print("\n--- TEST 7: Kembalikan ke Pengaturan Awal (Reset) ---", flush=True)
    page_reset, id_reset = create_page(f"{base_url}/guru/dasbor.html")
    
    reset_verified = page_reset.eval("""
    (function() {
        const custom = {
            jumlah_soal: 20,
            batas_waktu: 60,
            poin_benar: 100,
            ukuran_teks: 'besar'
        };
        window.konfigurasiManager.simpanPengaturan(custom);
        const resetRes = window.konfigurasiManager.resetPengaturan();
        const cfg = window.konfigurasiManager.ambilPengaturan();
        return cfg.jumlah_soal === 0 &&
               cfg.batas_waktu === 'otomatis' &&
               cfg.poin_benar === 10 &&
               cfg.ukuran_teks === 'normal';
    })()
    """)
    record_test("Fitur Reset Mengembalikan Seluruh Konfigurasi ke Bawaan Standar", reset_verified)
    close_page(id_reset)

    # -------------------------------------------------------------
    # RINGKASAN HASIL
    # -------------------------------------------------------------
    print("\n=================================================================", flush=True)
    print("HASIL AKHIR TEST SUITE:", flush=True)
    passed_cnt = sum(1 for r in results if r["passed"])
    total_cnt = len(results)
    print(f"Total Uji: {total_cnt} | Lulus: {passed_cnt} | Gagal: {total_cnt - passed_cnt}", flush=True)
    print("=================================================================", flush=True)

    if passed_cnt == total_cnt:
        print("ALL TESTS PASSED 100%!", flush=True)
    else:
        sys.exit(1)

finally:
    proc.terminate()
    proc.wait()
    shutil.rmtree(tmp_profile, ignore_errors=True)
