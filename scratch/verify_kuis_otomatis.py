import sys
import subprocess
import urllib.request
import json
import time
import os
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_auto_quiz_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9245
base_url = "http://localhost:8090"

print("=================================================================", flush=True)
print("TEST SUITE: PENILAIAN JAWABAN OTOMATIS & LANJUT MANDIRI (OPSI A)", flush=True)
print("=================================================================", flush=True)

proc = subprocess.Popen([
    chrome_path,
    f"--remote-debugging-port={port}",
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    f"--user-data-dir={tmp_profile}"
])
time.sleep(2.0)

def create_page(url):
    req = urllib.request.Request(f"http://localhost:{port}/json/new?{url}", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(1.0)
    return cdp, target["id"]

def close_page(target_id):
    try:
        req = urllib.request.Request(f"http://localhost:{port}/json/close/{target_id}", method="PUT")
        urllib.request.urlopen(req)
    except:
        pass

def eval_code(cdp, expr, await_promise=False):
    res = cdp.send_cmd("Runtime.evaluate", {
        "expression": expr,
        "returnByValue": True,
        "awaitPromise": await_promise
    })
    return res.get("result", {}).get("result", {}).get("value")

tests_passed = 0
total_tests = 0

def record(name, condition, detail=""):
    global tests_passed, total_tests
    total_tests += 1
    if condition:
        tests_passed += 1
        print(f"✅ [PASS] {name}", flush=True)
    else:
        print(f"❌ [FAIL] {name}", flush=True)
    if detail:
        print(f"   Detail: {detail}", flush=True)

try:
    # 1. Buka Dasbor Guru & Buat Sesi Baru
    guru_dash, id_guru_dash = create_page(f"{base_url}/guru/dasbor.html")
    time.sleep(1.5)

    # Dapatkan sesi atau buat sesi
    kode_sesi = eval_code(guru_dash, """
    (() => {
        const row = document.querySelector('.table tbody tr');
        if (row) {
            const btn = row.querySelector('.btn-buka-layar-sesi');
            if (btn) return btn.getAttribute('data-kode');
        }
        return 'AKE3SW';
    })()
    """)
    print(f"Menggunakan sesi aktif dengan kode: {kode_sesi}", flush=True)
    close_page(id_guru_dash)

    # 2. Guru Membuka Layar Sesi Kelas
    guru_sesi, id_guru_sesi = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi}")
    time.sleep(2.0)

    # 3. Siswa 1 (Brody) & Siswa 2 (Citra) Bergabung ke Sesi
    # Setup Siswa 1
    eval_code(guru_sesi, f"""
    (() => {{
        const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
        const filtered = store.filter(p => p.sesi_id !== '{kode_sesi}');
        filtered.push({{
            id: 'peserta-brody',
            sesi_id: '{kode_sesi}',
            nama_panggilan: 'Brody',
            avatar: 'avatar-1.svg',
            skor: 0
        }});
        filtered.push({{
            id: 'peserta-citra',
            sesi_id: '{kode_sesi}',
            nama_panggilan: 'Citra',
            avatar: 'avatar-2.svg',
            skor: 0
        }});
        localStorage.setItem('kupas_db_peserta', JSON.stringify(filtered));
        const bc = new BroadcastChannel('kupas_postgres_changes');
        bc.postMessage({{ type: 'postgres_changes', table: 'peserta', eventType: 'INSERT' }});
    }})()
    """)
    time.sleep(1.0)

    # Buka tab Siswa 1 (Brody)
    siswa1, id_s1 = create_page(f"{base_url}/siswa/main.html?kode={kode_sesi}")
    eval_code(siswa1, f"""
    (() => {{
        sessionStorage.setItem('kupas_peserta', JSON.stringify({{
            id: 'peserta-brody',
            sesi_id: '{kode_sesi}',
            nama_panggilan: 'Brody',
            avatar: 'avatar-1.svg',
            skor: 0
        }}));
        location.reload();
    }})()
    """)
    time.sleep(1.5)

    # Buka tab Siswa 2 (Citra)
    siswa2, id_s2 = create_page(f"{base_url}/siswa/main.html?kode={kode_sesi}")
    eval_code(siswa2, f"""
    (() => {{
        sessionStorage.setItem('kupas_peserta', JSON.stringify({{
            id: 'peserta-citra',
            sesi_id: '{kode_sesi}',
            nama_panggilan: 'Citra',
            avatar: 'avatar-2.svg',
            skor: 0
        }}));
        location.reload();
    }})()
    """)
    time.sleep(1.5)

    # Periksa kedua siswa di lobi guru
    lobi_peserta_count = eval_code(guru_sesi, "document.querySelectorAll('#wadah-peserta-lobi .peserta-gelembung').length")
    record("Dua Siswa Terhubung di Lobi Guru", lobi_peserta_count >= 2, f"Total di lobi: {lobi_peserta_count}")

    # 4. Guru Menekan Tombol Mulai Kuis
    eval_code(guru_sesi, "document.getElementById('btn-mulai-kuis').click()")
    time.sleep(4.5) # Tunggu hitung mundur 3-2-1 selesai

    # Periksa kedua siswa menerima soal pertama
    s1_soal_tampil = eval_code(siswa1, "!document.getElementById('siswa-soal').classList.contains('d-none')")
    s2_soal_tampil = eval_code(siswa2, "!document.getElementById('siswa-soal').classList.contains('d-none')")
    record("Siswa 1 Menerima Soal Pertama", s1_soal_tampil)
    record("Siswa 2 Menerima Soal Pertama", s2_soal_tampil)

    # 5. UJI PENILAIAN LANGSUNG: Siswa 1 Menjawab Benar
    # Cari indeks opsi jawaban benar di database
    kunci_jawaban_soal1 = eval_code(siswa1, """
    (() => {
        const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
        const s = window.soalSekarang || JSON.parse(sessionStorage.getItem('kupas_soal_aktif') || '{}');
        return kunciDB[s.id] || '0';
    })()
    """)

    # Siswa 1 klik opsi benar
    s1_jawab_res = eval_code(siswa1, f"""
    (() => {{
        const opsi = document.querySelectorAll('.opsi-jawaban');
        const idx = parseInt('{kunci_jawaban_soal1}', 10);
        const targetBtn = opsi[idx] || opsi[0];
        targetBtn.click();
        return {{
            btnDisabled: targetBtn.disabled,
            totalOpsiDisabled: Array.from(opsi).every(b => b.disabled)
        }};
    }})()
    """)
    record("Opsi Jawaban Langsung Terkunci saat Diklik (Cegah Tap Ganda)", s1_jawab_res.get('totalOpsiDisabled', False))

    time.sleep(0.8)

    # Periksa Umpan Balik Siswa 1 tampil seketika tanpa aksi guru
    s1_feedback_tampil = eval_code(siswa1, """
    (() => {
        const vFeedback = document.getElementById('siswa-feedback');
        const judul = document.getElementById('feedback-judul').textContent;
        const poin = document.getElementById('feedback-poin-badge').textContent;
        const isVisible = !vFeedback.classList.contains('d-none');
        return { isVisible, judul, poin };
    })()
    """)
    record("Umpan Balik Benar Tampil Seketika Tanpa Persetujuan Guru", 
           s1_feedback_tampil.get('isVisible') and 'Benar' in s1_feedback_tampil.get('judul', ''),
           f"Judul: {s1_feedback_tampil.get('judul')} | Poin: {s1_feedback_tampil.get('poin')}")

    # 6. UJI PENILAIAN LANGSUNG: Siswa 2 Menjawab Salah
    s2_salah_idx = (int(kunci_jawaban_soal1) + 1) % 4
    eval_code(siswa2, f"""
    (() => {{
        const opsi = document.querySelectorAll('.opsi-jawaban');
        const targetBtn = opsi[{s2_salah_idx}] || opsi[1];
        targetBtn.click();
    }})()
    """)
    time.sleep(0.8)

    s2_feedback_tampil = eval_code(siswa2, """
    (() => {
        const vFeedback = document.getElementById('siswa-feedback');
        const judul = document.getElementById('feedback-judul').textContent;
        const poin = document.getElementById('feedback-poin-badge').textContent;
        const isVisible = !vFeedback.classList.contains('d-none');
        return { isVisible, judul, poin };
    })()
    """)
    record("Umpan Balik Salah Tampil Seketika (+0 Poin, Menyemangati)", 
           s2_feedback_tampil.get('isVisible') and ('Belum Tepat' in s2_feedback_tampil.get('judul', '') or 'Semangat' in s2_feedback_tampil.get('judul', '')),
           f"Judul: {s2_feedback_tampil.get('judul')} | Poin: {s2_feedback_tampil.get('poin')}")

    # 7. UJI TRANSISI OTOMATIS: Setelah jeda 2 detik, lanjut ke soal berikutnya
    print("Menunggu jeda umpan balik 2 detik...", flush=True)
    time.sleep(2.5)

    s1_soal2_tampil = eval_code(siswa1, """
    (() => {
        const vSoal = document.getElementById('siswa-soal');
        const label = document.getElementById('siswa-label-soal').textContent;
        return { isVisible: !vSoal.classList.contains('d-none'), label };
    })()
    """)
    record("Siswa 1 Otomatis Lanjut ke Soal Berikutnya Tanpa Aksi Guru", 
           s1_soal2_tampil.get('isVisible') and 'Soal 2' in s1_soal2_tampil.get('label', ''),
           f"Layar: {s1_soal2_tampil.get('label')}")

    # 8. UJI SINKRONISASI DASBOR GURU: Progres siswa terpantau live
    guru_progres_res = eval_code(guru_sesi, """
    (() => {
        const elProgres = document.getElementById('grid-progres-siswa');
        return {
            hasGrid: !!elProgres,
            cardsCount: elProgres ? elProgres.children.length : 0,
            text: elProgres ? elProgres.textContent.trim() : ''
        };
    })()
    """)
    record("Dasbor Guru Menampilkan Progres Langsung Tiap Siswa", 
           guru_progres_res.get('cardsCount', 0) >= 2,
           f"Kartu Siswa di Dasbor Guru: {guru_progres_res.get('cardsCount')} kartu")

    # 9. UJI CEGAH TAP GANDA
    s1_double_tap = eval_code(siswa1, """
    (() => {
        const opsi = document.querySelectorAll('.opsi-jawaban');
        const b = opsi[0];
        b.click();
        b.click();
        b.click();
        return {
            sudahMengunci: window.sudahMengunci,
            disabled: b.disabled
        };
    })()
    """)
    record("Perlindungan Anti Tap Ganda Bekerja Sempurna", s1_double_tap.get('disabled', False))

    # 10. UJI LOMPAT CEPAT (TOMBOL 'Lanjut Sekarang ➔')
    time.sleep(1.0)
    # Siswa 1 jawab soal 2
    eval_code(siswa1, "document.querySelectorAll('.opsi-jawaban')[0].click()")
    time.sleep(0.5)
    # Klik tombol 'Lanjut Sekarang'
    eval_code(siswa1, "document.getElementById('btn-langsung-soal-berikutnya').click()")
    time.sleep(0.5)
    s1_soal3_tampil = eval_code(siswa1, "document.getElementById('siswa-label-soal').textContent")
    record("Tombol 'Lanjut Sekarang ➔' Berfungsi Melompati Jeda 2 Detik", 'Soal 3' in s1_soal3_tampil, f"Posisi: {s1_soal3_tampil}")

    # 11. UJI KASUS WAKTU HABIS TANPA JAWABAN (Timeout)
    eval_code(siswa1, """
    (() => {
        // Simulasi waktu habis pada timer
        window.kunciJawaban(true);
    })()
    """)
    time.sleep(0.8)
    s1_timeout_feedback = eval_code(siswa1, """
    (() => {
        const judul = document.getElementById('feedback-judul').textContent;
        const poin = document.getElementById('feedback-poin-badge').textContent;
        return { judul, poin };
    })()
    """)
    record("Waktu Habis Otomatis Dihitung Salah & Beri Umpan Balik Ramah",
           'Waktu Habis' in s1_timeout_feedback.get('judul', ''),
           f"Judul: {s1_timeout_feedback.get('judul')} | Poin: {s1_timeout_feedback.get('poin')}")

    # 12. UJI SOAL TERAKHIR OTOMATIS TAMPIL HASIL AKHIR
    eval_code(siswa1, """
    (() => {
        // Pindahkan index ke soal terakhir dan selesaikan
        window.indexSoalSiswa = window.daftarSoalSiswa.length - 1;
        window.bukaLayarSoal(window.daftarSoalSiswa[window.indexSoalSiswa], window.indexSoalSiswa, window.daftarSoalSiswa.length);
        window.kunciJawaban(false);
    })()
    """)
    time.sleep(0.5)
    # Klik lanjut sekarang untuk langsung ke hasil akhir
    eval_code(siswa1, "document.getElementById('btn-langsung-soal-berikutnya').click()")
    time.sleep(1.5)

    s1_hasil_akhir = eval_code(siswa1, """
    (() => {
        const vHasil = document.getElementById('siswa-hasil');
        const skor = document.getElementById('hasil-akhir-skor-angka').textContent;
        return {
            isVisible: !vHasil.classList.contains('d-none'),
            skor
        };
    })()
    """)
    record("Soal Terakhir Otomatis Menampilkan Hasil Akhir Siswa", s1_hasil_akhir.get('isVisible', False), f"Skor Akhir: {s1_hasil_akhir.get('skor')}")

    close_page(id_s1)
    close_page(id_s2)
    close_page(id_guru_sesi)

except Exception as ex:
    print(f"Error during test: {ex}", flush=True)

proc.terminate()

print("=================================================================", flush=True)
print(f"HASIL PENGUJIAN: {tests_passed} / {total_tests} LULUS", flush=True)
print("=================================================================", flush=True)

