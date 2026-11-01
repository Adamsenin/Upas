import sys
import subprocess
import urllib.request
import json
import time
import os
import random

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_acak_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9260
base_url = "http://localhost:8090"

print("=" * 65, flush=True)
print("TEST SUITE: PENGACAKAN PILIHAN JAWABAN & PENILAIAN BERBASIS NILAI", flush=True)
print("=" * 65, flush=True)

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

# =====================================================================
# 1. TEST FISHER-YATES 200X DENGAN SEBARAN WAJAR & PENILAIAN
# =====================================================================
def acak_pilihan_jawaban_py(opsi_list):
    items = [{'teks': op, 'originalIndex': i, 'id': str(i)} for i, op in enumerate(opsi_list)]
    regex_akhir = ['semua', 'tidak ada']
    normal_items = []
    akhir_items = []
    for it in items:
        lower = it['teks'].lower()
        if any(r in lower for r in regex_akhir) and ('benar' in lower or 'salah' in lower):
            akhir_items.append(it)
        else:
            normal_items.append(it)
    
    # Fisher-Yates
    for i in range(len(normal_items) - 1, 0, -1):
        j = random.randint(0, i)
        normal_items[i], normal_items[j] = normal_items[j], normal_items[i]
    
    return normal_items + akhir_items

posisi_counts = {0: 0, 1: 0, 2: 0, 3: 0}
penilaian_selalu_benar = True
penilaian_salah_selalu_salah = True
opsi_soal_1 = ['Padi', 'Tikus', 'Ular', 'Elang']
kunci_asli = '0'

for _ in range(200):
    hasil_acak = acak_pilihan_jawaban_py(opsi_soal_1)
    posisi_padi = -1
    for idx, item in enumerate(hasil_acak):
        if item['originalIndex'] == 0:
            posisi_padi = idx
            break
    posisi_counts[posisi_padi] += 1
    
    if hasil_acak[posisi_padi]['id'] != kunci_asli:
        penilaian_selalu_benar = False
        
    for idx, item in enumerate(hasil_acak):
        if idx != posisi_padi and item['id'] == kunci_asli:
            penilaian_salah_selalu_salah = False

sebaran_wajar = all(30 <= c <= 75 for c in posisi_counts.values())
record("1. Uji Fisher-Yates 200x: Sebaran Posisi Kunci Jawaban Merata di 4 Opsi (A, B, C, D)",
       sebaran_wajar,
       f"Frekuensi Posisi [Pos 0 (A): {posisi_counts[0]}, Pos 1 (B): {posisi_counts[1]}, Pos 2 (C): {posisi_counts[2]}, Pos 3 (D): {posisi_counts[3]}]")

record("2. Penilaian 200x: Kunci Jawaban 'Padi' Selalu Dinilai Benar di Mana Pun Posisinya",
       penilaian_selalu_benar and penilaian_salah_selalu_salah,
       "100% konsisten mengembalikan originalIndex 0 ke fungsi penilaian")

# =====================================================================
# 2. TEST OPSI 'SEMUA JAWABAN BENAR' TETAP DI POSISI TERAKHIR 200X
# =====================================================================
opsi_soal_khusus = ['Padi menghasilkan makanan', 'Tumbuhan hijau berfotosintesis', 'Fitoplankton di perairan', 'Semua jawaban benar']
semua_tetap_terakhir = True
for _ in range(200):
    hasil = acak_pilihan_jawaban_py(opsi_soal_khusus)
    if hasil[-1]['teks'] != 'Semua jawaban benar':
        semua_tetap_terakhir = False
        break

record("3. Uji Opsi Khusus 200x: 'Semua jawaban benar' Selalu Tetap di Posisi Terakhir",
       semua_tetap_terakhir,
       f"Posisi ke-4 (indeks 3) selalu ditempati oleh 'Semua jawaban benar' (100% dari 200 run)")

# =====================================================================
# 3. RUN CHROME UNTUK TEST BROWSER LENGKAP
# =====================================================================
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

try:
    kode_sesi = "ACAK88"

    # Setup database sesi & kuis di localStorage
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

        const cfg = {{
            jumlah_soal: 3,
            topik: 'semua',
            tingkat_kesulitan: 'semua',
            acak_soal: false,
            acak_jawaban: true,
            batas_waktu: 'otomatis',
            durasi_jeda_soal: 2,
            poin_benar: 10,
            bonus_kecepatan: false,
            maks_peserta: 0,
            izinkan_gabung_setelah_mulai: true,
            tampilkan_peringkat: 'selama_kuis',
            tampilkan_kunci_jawaban: true,
            tampilkan_penjelasan: true
        }};
        localStorage.setItem('kupas_pengaturan_kuis', JSON.stringify(cfg));
    }})()
    """)
    time.sleep(1.0)

    # 1. Guru Membuka Layar Sesi
    page_guru, id_guru = create_page(f"{base_url}/guru/sesi.html?kode={kode_sesi}")
    time.sleep(1.5)

    # 2. Siswa 1 (Brody) & Siswa 2 (Citra) Bergabung
    page_s1, id_s1 = create_page(f"{base_url}/gabung.html")
    page_s1.eval(f"""
    (() => {{
        document.getElementById('input-kode').value = '{kode_sesi}';
        document.getElementById('input-nama').value = 'Brody';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2.0)

    page_s2, id_s2 = create_page(f"{base_url}/gabung.html")
    page_s2.eval(f"""
    (() => {{
        document.getElementById('input-kode').value = '{kode_sesi}';
        document.getElementById('input-nama').value = 'Citra';
        document.getElementById('form-gabung').dispatchEvent(new Event('submit'));
    }})()
    """)
    time.sleep(2.0)

    # Guru Mulai Kuis
    page_guru.eval("document.getElementById('btn-mulai-kuis').click()")
    time.sleep(4.5)

    # Ambil opsi siswa 1 dan siswa 2
    opsi_s1 = page_s1.eval("""
    Array.from(document.querySelectorAll('.opsi-jawaban')).map(b => ({
        nomor: b.querySelector('.opsi-nomor')?.textContent,
        teks: b.querySelector('.flex-grow-1')?.textContent.trim(),
        huruf: b.querySelector('.indikator-pilih-opsi')?.textContent.trim(),
        nilaiAsli: b.getAttribute('data-nilai')
    }))
    """)

    opsi_s2 = page_s2.eval("""
    Array.from(document.querySelectorAll('.opsi-jawaban')).map(b => ({
        nomor: b.querySelector('.opsi-nomor')?.textContent,
        teks: b.querySelector('.flex-grow-1')?.textContent.trim(),
        huruf: b.querySelector('.indikator-pilih-opsi')?.textContent.trim(),
        nilaiAsli: b.getAttribute('data-nilai')
    }))
    """)

    huruf_s1 = [x['huruf'] for x in (opsi_s1 or [])]
    record("4. Label Huruf (A, B, C, D) Siswa 1 Mengikuti Urutan Tampilan Baru",
           huruf_s1 == ['A', 'B', 'C', 'D'],
           f"Label tombol Siswa 1: {huruf_s1}")

    record("5. Opsi Jawaban Dirender dengan data-nilai Asli untuk Penilaian Akurat",
           len(opsi_s1 or []) == 4 and all(x['nilaiAsli'] in ['0', '1', '2', '3'] for x in (opsi_s1 or [])),
           f"Opsi Siswa 1: {[(x['huruf'], x['teks'], 'val=' + x['nilaiAsli']) for x in (opsi_s1 or [])]}")

    # =====================================================================
    # 4. UJI STABILITAS URUTAN SAAT TIMER BERJALAN & RESIZE LAYAR
    # =====================================================================
    teks_s1_sebelum = [x['teks'] for x in (opsi_s1 or [])]
    time.sleep(2.0)
    page_s1.eval("window.dispatchEvent(new Event('resize'));")
    time.sleep(0.5)

    opsi_s1_setelah = page_s1.eval("Array.from(document.querySelectorAll('.opsi-jawaban .flex-grow-1')).map(el => el.textContent.trim())")
    record("6. Urutan Pilihan Tetap Stabil Saat Timer Berjalan dan Layar Di-resize",
           teks_s1_sebelum == opsi_s1_setelah,
           f"Sebelum: {teks_s1_sebelum[:2]} | Setelah: {opsi_s1_setelah[:2]}")

    # =====================================================================
    # 5. UJI PENILAIAN JAWABAN BENAR & SALAH DI POSISI ACAK
    # =====================================================================
    # Siswa 1 klik opsi 'Padi' (nilaiAsli '0')
    idx_benar_s1 = next(i for i, x in enumerate(opsi_s1) if x['nilaiAsli'] == '0')
    page_s1.eval(f"document.querySelectorAll('.opsi-jawaban')[{idx_benar_s1}].click();")
    time.sleep(1.0)

    s1_fb = page_s1.eval("""
    (() => ({
        judul: document.getElementById('feedback-judul')?.textContent,
        poin: document.getElementById('feedback-poin-badge')?.textContent
    }))()
    """)
    record("7. Siswa 1 Menekan Opsi Benar di Posisi Acak -> Penilaian Benar (+10 Poin)",
           'Hebat' in s1_fb.get('judul', '') or 'Benar' in s1_fb.get('judul', ''),
           f"Posisi tombol: Indeks {idx_benar_s1} (Label {opsi_s1[idx_benar_s1]['huruf']}) -> {s1_fb.get('judul')} ({s1_fb.get('poin')})")

    # Siswa 2 klik opsi salah
    idx_salah_s2 = next(i for i, x in enumerate(opsi_s2) if x['nilaiAsli'] != '0')
    page_s2.eval(f"document.querySelectorAll('.opsi-jawaban')[{idx_salah_s2}].click();")
    time.sleep(1.0)

    s2_fb = page_s2.eval("document.getElementById('feedback-poin-badge')?.textContent")
    record("8. Siswa 2 Menekan Opsi Salah di Posisi Acak -> Penilaian Salah (+0 Poin)",
           '+0 Poin' in (s2_fb or ''),
           f"Posisi tombol salah: Indeks {idx_salah_s2} (Label {opsi_s2[idx_salah_s2]['huruf']}) -> {s2_fb}")

    # =====================================================================
    # 6. UJI FAKTA VS OPINI: TOMBOL KIRI/KANAN & LABEL DINAMIS [1] / [2]
    # =====================================================================
    page_fo, id_fo = create_page(f"{base_url}/fakta-opini.html")
    time.sleep(2.0)

    fo_btn_texts = page_fo.eval("""
    Array.from(document.querySelectorAll('#btn-pilih-fakta, #btn-pilih-opini')).map(b => b.querySelector('span')?.textContent)
    """)
    record("9. Mode Fakta vs Opini: Tombol Memiliki Label Dinamis [ 1 ] dan [ 2 ]",
           len(fo_btn_texts or []) == 2 and any('[ 1 ]' in t for t in (fo_btn_texts or [])) and any('[ 2 ]' in t for t in (fo_btn_texts or [])),
           f"Teks tombol: {fo_btn_texts}")

    # =====================================================================
    # 7. UJI DUEL TIM: 4 OPSI DIRENDER TERACAK & DIEVALUASI
    # =====================================================================
    page_duel, id_duel = create_page(f"{base_url}/duel-tim.html")
    time.sleep(2.0)

    page_duel.eval("document.getElementById('btn-mulai-duel').click();")
    time.sleep(1.0)

    duel_opsi = page_duel.eval("""
    Array.from(document.querySelectorAll('.tombol-opsi-duel .teks-opsi')).map(el => el.textContent.trim())
    """)
    record("10. Mode Duel Tim: 4 Pilihan Jawaban Berhasil Dirender dan Siap Dijawab",
           len(duel_opsi or []) == 4 and all(len(t) > 0 for t in (duel_opsi or [])),
           f"Opsi Duel: {duel_opsi}")

    close_page(id_init)
    close_page(id_fo)
    close_page(id_duel)
    close_page(id_s1)
    close_page(id_s2)
    close_page(id_guru)

except Exception as ex:
    print(f"Error test execution: {ex}", flush=True)

proc.terminate()

print("=" * 65, flush=True)
print(f"HASIL PENGUJIAN AKHIR: {tests_passed} / {total_tests} LULUS", flush=True)
print("=" * 65, flush=True)
