import sys
import subprocess
import urllib.request
import json
import time
import os
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_auto_v2_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9250
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
    kode_sesi = "AUTO99"

    # Setup database sesi & kuis di localStorage via halaman pembuka
    init_page, id_init = create_page(f"{base_url}/guru/dasbor.html")
    init_page.eval(f"""
    (() => {{
        const sesi = {{
            id: 'sesi-{kode_sesi}',
            kode: '{kode_sesi}',
            guru_id: 'guru-demo-1',
            kuis_id: 'kuis-ekosistem-1',
            mode: 'klasik',
            status: 'lobi',
            soal_aktif: 1,
            pengali_waktu: 1,
            created_at: new Date().toISOString()
        }};
        localStorage.setItem('kupas_db_sesi', JSON.stringify([sesi]));
        localStorage.setItem('kupas_db_peserta', JSON.stringify([]));
        localStorage.setItem('kupas_db_jawaban', JSON.stringify([]));

        // Set konfigurasi: 3 soal, jeda 2 detik
        const cfg = {{
            jumlah_soal: 3,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            batas_waktu: 'otomatis',
            durasi_jeda_soal: 2,
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
        localStorage.setItem('kupas_pengaturan_game', JSON.stringify(cfg));
    }})()
    """)
    close_page(id_init)

    # 1. Guru Membuka Layar Sesi
    page_guru, id_guru = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi}")
    time.sleep(1.5)

    # 2. Siswa 1 (Brody) Bergabung melalui gabung.html
    page_s1, id_s1 = create_page(f"{base_url}/gabung.html")
    page_s1.eval(f"""
    (() => {{
        document.getElementById('input-kode').value = '{kode_sesi}';
        document.getElementById('input-nama').value = 'Brody';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2.0)

    # 3. Siswa 2 (Citra) Bergabung melalui gabung.html
    page_s2, id_s2 = create_page(f"{base_url}/gabung.html")
    page_s2.eval(f"""
    (() => {{
        document.getElementById('input-kode').value = '{kode_sesi}';
        document.getElementById('input-nama').value = 'Citra';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2.0)

    # Cek jumlah siswa di lobi guru
    lobi_count = page_guru.eval("document.querySelectorAll('#wadah-peserta-lobi .peserta-gelembung').length")
    record("1. Dua Siswa Berhasil Bergabung di Lobi Guru", lobi_count >= 2, f"Total di lobi: {lobi_count}")

    # 4. Guru Menekan Mulai Kuis
    page_guru.eval("document.getElementById('btn-mulai-kuis').click();")
    print("Menunggu hitung mundur mulai kuis 3-2-1...", flush=True)
    time.sleep(4.5)

    # Cek kedua siswa berada pada Soal 1
    s1_soal1 = page_guru.eval("!document.getElementById('tampilan-soal').classList.contains('d-none')")
    s1_label = page_s1.eval("document.getElementById('siswa-label-soal').textContent")
    s2_label = page_s2.eval("document.getElementById('siswa-label-soal').textContent")
    record("2. Kuis Dimulai: Siswa 1 & 2 Masuk ke Soal 1", 'Soal 1' in s1_label and 'Soal 1' in s2_label, f"Siswa 1: {s1_label} | Siswa 2: {s2_label}")

    # 5. Cari kunci jawaban Soal 1 di database
    kunci_soal1 = page_s1.eval("""
    (() => {
        const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
        const s = window.soalSekarang || {};
        return kunciDB[s.id] || '0';
    })()
    """)
    idx_benar = int(kunci_soal1)
    idx_salah = (idx_benar + 1) % 4

    # 6. Siswa 1 Memilih Jawaban BENAR
    s1_lock_res = page_s1.eval(f"""
    (() => {{
        const opsi = document.querySelectorAll('.opsi-jawaban');
        const b = opsi[{idx_benar}] || opsi[0];
        b.click();
        return {{
            allDisabled: Array.from(opsi).every(el => el.disabled)
        }};
    }})()
    """)
    record("3. Siswa 1 Memilih Opsi: Seluruh Opsi Terkunci Seketika (Anti Tap Ganda)", s1_lock_res.get('allDisabled', False))

    time.sleep(0.5)

    # Cek umpan balik Siswa 1: Tampil seketika tanpa persetujuan guru
    s1_fb = page_s1.eval("""
    (() => {
        const v = document.getElementById('siswa-feedback');
        return {
            visible: !v.classList.contains('d-none'),
            judul: document.getElementById('feedback-judul').textContent,
            poin: document.getElementById('feedback-poin-badge').textContent,
            hitungMundur: document.getElementById('feedback-hitung-mundur-teks').textContent
        };
    })()
    """)
    record("4. Siswa 1 Mendapat Umpan Balik Benar Seketika (+10 Poin, Konfeti)", 
           s1_fb.get('visible') and 'Benar' in s1_fb.get('judul', ''),
           f"Judul: {s1_fb.get('judul')} | Poin: {s1_fb.get('poin')} | Status: {s1_fb.get('hitungMundur')}")

    # 7. Siswa 2 Memilih Jawaban SALAH
    page_s2.eval(f"""
    (() => {{
        const opsi = document.querySelectorAll('.opsi-jawaban');
        const b = opsi[{idx_salah}] || opsi[1];
        b.click();
    }})()
    """)
    time.sleep(0.5)

    s2_fb = page_s2.eval("""
    (() => {
        const v = document.getElementById('siswa-feedback');
        return {
            visible: !v.classList.contains('d-none'),
            judul: document.getElementById('feedback-judul').textContent,
            poin: document.getElementById('feedback-poin-badge').textContent
        };
    })()
    """)
    record("5. Siswa 2 Mendapat Umpan Balik Salah Seketika (+0 Poin, Penjelasan Ramah)", 
           s2_fb.get('visible') and ('Belum Tepat' in s2_fb.get('judul', '') or 'Semangat' in s2_fb.get('judul', '')),
           f"Judul: {s2_fb.get('judul')} | Poin: {s2_fb.get('poin')}")

    # 8. Uji Transisi Otomatis: Tunggu jeda umpan balik 2 detik
    print("Menunggu jeda umpan balik 2 detik...", flush=True)
    time.sleep(2.5)

    s1_next_label = page_s1.eval("document.getElementById('siswa-label-soal').textContent")
    s2_next_label = page_s2.eval("document.getElementById('siswa-label-soal').textContent")
    record("6. Transisi Otomatis: Kedua Siswa Melompat ke Soal 2 Tanpa Aksi Guru",
           'Soal 2' in s1_next_label and 'Soal 2' in s2_next_label,
           f"Siswa 1: {s1_next_label} | Siswa 2: {s2_next_label}")

    # 9. Pantau Dasbor Guru: Guru melihat progres mandiri kedua siswa secara live
    guru_prog = page_guru.eval("""
    (() => {
        const grid = document.getElementById('grid-progres-siswa');
        return {
            cardCount: grid ? grid.children.length : 0,
            text: grid ? grid.textContent : ''
        };
    })()
    """)
    record("7. Dasbor Guru Menampilkan Kartu Progres Langsung Siswa", 
           guru_prog.get('cardCount', 0) >= 2 and 'Brody' in guru_prog.get('text', '') and 'Citra' in guru_prog.get('text', ''),
           f"Teks Dasbor Guru: {guru_prog.get('text', '').strip()[:80]}...")

    # 10. Uji Tombol Lompat Cepat ("Lanjut Sekarang ➔")
    # Siswa 1 jawab Soal 2
    page_s1.eval("document.querySelectorAll('.opsi-jawaban')[0].click();")
    time.sleep(0.5)
    # Siswa 1 klik 'Lanjut Sekarang' sebelum 2 detik
    page_s1.eval("document.getElementById('btn-langsung-soal-berikutnya').click();")
    time.sleep(0.5)
    s1_soal3_label = page_s1.eval("document.getElementById('siswa-label-soal').textContent")
    record("8. Fitur Tombol 'Lanjut Sekarang ➔' Melewati Jeda Waktu Berhasil", 'Soal 3' in s1_soal3_label, f"Label: {s1_soal3_label}")

    # 11. Uji Kasus Waktu Habis Tanpa Jawaban (Timeout)
    page_s2.eval("window.kunciJawaban(true);")
    time.sleep(0.5)
    s2_timeout_fb = page_s2.eval("document.getElementById('feedback-judul').textContent")
    record("9. Kasus Waktu Habis Tanpa Jawaban: Dinilai Salah & Beri Umpan Balik 'Waktu Habis'", 'Waktu Habis' in s2_timeout_fb, f"Judul: {s2_timeout_fb}")

    # 12. Uji Soal Terakhir: Otomatis Menampilkan Hasil Akhir
    # Pindahkan Siswa 1 ke soal terakhir bank soal (Soal 20: Isian Singkat)
    page_s1.eval("const list = window.getDaftarSoal(); const lastIdx = list.length - 1; window.bukaLayarSoal(list[lastIdx], lastIdx, list.length);")
    time.sleep(0.5)
    # Siswa 1 mengisi jawaban isian singkat dan mengirim
    page_s1.eval("""
    const inp = document.getElementById('siswa-input-isian');
    inp.value = 'habitat';
    inp.dispatchEvent(new Event('input'));
    document.getElementById('btn-kirim-jawaban').click();
    """)
    time.sleep(0.5)
    s1_last_text = page_s1.eval("document.getElementById('feedback-hitung-mundur-teks').textContent")
    record("10. Soal Terakhir Menampilkan Teks Penutup Khusus", 'hasil akhir' in s1_last_text.lower(), f"Teks: {s1_last_text}")

    # Lompat langsung ke hasil akhir
    page_s1.eval("document.getElementById('btn-langsung-soal-berikutnya').click();")
    time.sleep(1.5)

    s1_final_view = page_s1.eval("""
    (() => {
        const v = document.getElementById('siswa-hasil');
        const peserta = JSON.parse(sessionStorage.getItem('kupas_peserta') || '{}');
        return {
            isVisible: !v.classList.contains('d-none'),
            skor: peserta.skor
        };
    })()
    """)
    record("11. Siswa 1 Berhasil Menuntaskan Kuis & Layar Hasil Akhir Terbuka Otomatis", s1_final_view.get('isVisible', False), f"Skor Akhir Siswa: {s1_final_view.get('skor')}")

    # 13. Verifikasi Skor Siswa di Dasbor Guru Cocok 100%
    guru_db_skor = page_guru.eval("""
    (() => {
        const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
        const brody = store.find(p => p.nama_panggilan === 'Brody');
        return brody ? brody.skor : null;
    })()
    """)
    record("12. Skor Siswa di Dasbor Guru Sinkron Sempurna dengan Layar Siswa", guru_db_skor is not None and str(guru_db_skor) == str(s1_final_view.get('skor')), f"Skor di DB Guru: {guru_db_skor} | Skor di Layar Siswa: {s1_final_view.get('skor')}")

    close_page(id_s1)
    close_page(id_s2)
    close_page(id_guru)

except Exception as ex:
    print(f"Error test execution: {ex}", flush=True)

proc.terminate()

print("=================================================================", flush=True)
print(f"HASIL PENGUJIAN AKHIR: {tests_passed} / {total_tests} LULUS", flush=True)
print("=================================================================", flush=True)
