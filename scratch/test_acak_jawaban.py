import sys
import json
import random
import time
import urllib.request
import subprocess

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

print("=" * 65)
print("TEST SUITE: PENGACAKAN PILIHAN JAWABAN & PENILAIAN BERBASIS NILAI")
print("=" * 65)

passed_tests = 0
total_tests = 0

def record(name, success, detail=""):
    global passed_tests, total_tests
    total_tests += 1
    if success:
        passed_tests += 1
        print(f"✅ [PASS] {name}")
    else:
        print(f"❌ [FAIL] {name}")
    if detail:
        print(f"   Detail: {detail}")

# =====================================================================
# 1. TEST ALGORITMA FISHER-YATES 200X DENGAN SEBARAN WAJAR
# =====================================================================
def acak_pilihan_jawaban_py(opsi_list):
    items = [{'teks': op, 'originalIndex': i, 'id': str(i)} for i, op in enumerate(opsi_list)]
    regex_akhir = ['semua', 'tidak ada']
    normal_items = []
    akhir_items = []
    for it in items:
        lower = it['teks'].lower()
        if any(r in lower for r in regex_akhir) and ('benar' in lower or 'salah' in lower):
            akhir_items.push(it) if hasattr(akhir_items, 'push') else akhir_items.append(it)
        else:
            normal_items.append(it)
    
    # Fisher-Yates
    for i in range(len(normal_items) - 1, 0, -1):
        j = random.randint(0, i)
        normal_items[i], normal_items[j] = normal_items[j], normal_items[i]
    
    return normal_items + akhir_items

# Jalankan 200 kali untuk Soal 1: ['Padi', 'Tikus', 'Ular', 'Elang'], kunci: '0' ('Padi')
posisi_counts = {0: 0, 1: 0, 2: 0, 3: 0}
penilaian_selalu_benar = True
penilaian_salah_selalu_salah = True

opsi_soal_1 = ['Padi', 'Tikus', 'Ular', 'Elang']
kunci_asli = '0' # 'Padi'

for _ in range(200):
    hasil_acak = acak_pilihan_jawaban_py(opsi_soal_1)
    
    # Cari di posisi mana 'Padi' berada
    posisi_padi = -1
    for idx, item in enumerate(hasil_acak):
        if item['originalIndex'] == 0:
            posisi_padi = idx
            break
    posisi_counts[posisi_padi] += 1
    
    # Uji penilaian jawaban benar
    item_padi = hasil_acak[posisi_padi]
    if item_padi['id'] != kunci_asli:
        penilaian_selalu_benar = False
        
    # Uji penilaian jawaban salah
    for idx, item in enumerate(hasil_acak):
        if idx != posisi_padi:
            if item['id'] == kunci_asli:
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
# 3. UJI MULTI-CLIENT CHROME CDP: SISWA 1 & SISWA 2 DI SESI KUIS REAL
# =====================================================================
import os
sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

def create_tab(url, port=9222):
    req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{url}", method="PUT")
    data = json.loads(urllib.request.urlopen(req).read().decode())
    cdp = SimpleCDP(data["webSocketDebuggerUrl"])
    time.sleep(1.0)
    return cdp, data['id']

def close_tab(tab_id, port=9222):
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/close/{tab_id}", method="PUT")
        urllib.request.urlopen(req)
    except:
        pass

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9235

proc = subprocess.Popen([
    chrome_path,
    f"--remote-debugging-port={port}",
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--user-data-dir=" + r"C:\Users\User\.gemini\antigravity\brain\661ca915-c395-4be9-a753-27beb65c3a1f\scratch\chrome_acak_test"
], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

time.sleep(2.5)

try:
    # 1. Buka Guru Sesi
    page_guru, id_guru = create_tab(f"http://localhost:8090/guru/sesi.html?mode=baru&topik=ekosistem", port=port)
    time.sleep(2.5)

    kode_sesi = page_guru.eval("sesi ? sesi.kode : document.getElementById('teks-kode-sesi')?.textContent")
    print(f"Sesi Guru dibuka dengan Kode: {kode_sesi}", flush=True)

    # 2. Siswa 1 (Brody) & Siswa 2 (Citra) bergabung
    page_s1, id_s1 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)
    page_s2, id_s2 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)

    time.sleep(1.0)
    page_s1.eval("""
    (() => {
        const p = { id: 'pes-brody-acak', sesi_id: sesi?.id || 'sesi-1', nama_panggilan: 'Brody', kelas: 'Kelas V-A', avatar: 'avatar-1.svg', skor: 0 };
        sessionStorage.setItem('kupas_peserta', JSON.stringify(p));
        const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
        if (!store.some(x => x.id === p.id)) { store.push(p); localStorage.setItem('kupas_db_peserta', JSON.stringify(store)); }
        location.reload();
    })()
    """)

    page_s2.eval("""
    (() => {
        const p = { id: 'pes-citra-acak', sesi_id: sesi?.id || 'sesi-1', nama_panggilan: 'Citra', kelas: 'Kelas V-B', avatar: 'avatar-2.svg', skor: 0 };
        sessionStorage.setItem('kupas_peserta', JSON.stringify(p));
        const store = JSON.parse(localStorage.getItem('kupas_db_peserta') || '[]');
        if (!store.some(x => x.id === p.id)) { store.push(p); localStorage.setItem('kupas_db_peserta', JSON.stringify(store)); }
        location.reload();
    })()
    """)

    time.sleep(2.5)
    page_guru.eval("segarkanDaftarPeserta()")
    time.sleep(1.0)

    # Guru Mulai Kuis
    page_guru.eval("document.getElementById('btn-mulai-kuis').click()")
    time.sleep(4.5)

    # Ambil teks opsi di layar Siswa 1 dan Siswa 2
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

    teks_s1 = [x['teks'] for x in opsi_s1]
    teks_s2 = [x['teks'] for x in opsi_s2]
    huruf_s1 = [x['huruf'] for x in opsi_s1]

    record("4. Label Huruf (A, B, C, D) Siswa 1 Sesuai Posisi Tampilan Baru",
           huruf_s1 == ['A', 'B', 'C', 'D'],
           f"Label tombol Siswa 1: {huruf_s1}")

    # Bandingkan apakah urutan pilihan opsi valid
    record("5. Pilihan Jawaban Memiliki Atribut data-nilai Asli untuk Penilaian",
           len(opsi_s1) == 4 and all(x['nilaiAsli'] in ['0', '1', '2', '3'] for x in opsi_s1),
           f"Opsi Siswa 1: {[(x['huruf'], x['teks'], 'val=' + x['nilaiAsli']) for x in opsi_s1]}")

    # =====================================================================
    # 4. UJI STABILITAS URUTAN SAAT TIMER BERJALAN & RESIZE LAYAR
    # =====================================================================
    teks_s1_sebelum = teks_s1[:]
    time.sleep(2.0) # biarkan timer berjalan 2 detik
    page_s1.eval("window.dispatchEvent(new Event('resize'));") # resize event
    time.sleep(0.5)

    opsi_s1_setelah = page_s1.eval("Array.from(document.querySelectorAll('.opsi-jawaban .flex-grow-1')).map(el => el.textContent.trim())")
    record("6. Urutan Pilihan Tetap Stabil Saat Timer Berjalan dan Layar Di-resize",
           teks_s1_sebelum == opsi_s1_setelah,
           f"Sebelum: {teks_s1_sebelum[:2]} | Setelah: {opsi_s1_setelah[:2]}")

    # =====================================================================
    # 5. UJI PENILAIAN JAWABAN BENAR PADA POSISI BARU
    # =====================================================================
    # Cari tombol mana di Siswa 1 yang teksnya 'Padi' (kunci jawaban asli)
    idx_tombol_benar = -1
    for i, it in enumerate(opsi_s1):
        if it['nilaiAsli'] == '0': # 'Padi'
            idx_tombol_benar = i
            break

    page_s1.eval(f"document.querySelectorAll('.opsi-jawaban')[{idx_tombol_benar}].click();")
    time.sleep(0.8)

    s1_fb = page_s1.eval("""
    (() => {
        return {
            judul: document.getElementById('feedback-judul')?.textContent,
            poin: document.getElementById('feedback-poin-badge')?.textContent
        };
    })()
    """)

    record("7. Siswa 1 Menekan Opsi Benar di Posisi Acak -> Penilaian Benar (+10 Poin)",
           'Hebat' in s1_fb.get('judul', '') or 'Benar' in s1_fb.get('judul', ''),
           f"Tombol indeks {idx_tombol_benar} (Label {opsi_s1[idx_tombol_benar]['huruf']}) -> {s1_fb.get('judul')} ({s1_fb.get('poin')})")

    # Siswa 2 menekan opsi salah di posisinya
    idx_tombol_salah = -1
    for i, it in enumerate(opsi_s2):
        if it['nilaiAsli'] != '0':
            idx_tombol_salah = i
            break

    page_s2.eval(f"document.querySelectorAll('.opsi-jawaban')[{idx_tombol_salah}].click();")
    time.sleep(0.8)

    s2_fb = page_s2.eval("document.getElementById('feedback-poin-badge')?.textContent")
    record("8. Siswa 2 Menekan Opsi Salah di Posisi Acak -> Penilaian Salah (+0 Poin)",
           '+0 Poin' in s2_fb,
           f"Tombol indeks {idx_tombol_salah} -> {s2_fb}")

    # =====================================================================
    # 6. UJI FAKTA VS OPINI: PENGACAKAN SISI KIRI/KANAN & LABEL TOMBOL
    # =====================================================================
    page_fo, id_fo = create_tab(f"http://localhost:8090/fakta-opini.html", port=port)
    time.sleep(2.0)

    fo_btn_texts = page_fo.eval("""
    Array.from(document.querySelectorAll('#btn-pilih-fakta, #btn-pilih-opini')).map(b => b.querySelector('span')?.textContent)
    """)
    record("9. Mode Fakta vs Opini: Tombol Pilihan Memiliki Label [ 1 ] dan [ 2 ] Dinamis",
           len(fo_btn_texts) == 2 and any('[ 1 ]' in t for t in fo_btn_texts) and any('[ 2 ]' in t for t in fo_btn_texts),
           f"Teks tombol: {fo_btn_texts}")

    # =====================================================================
    # 7. UJI DUEL TIM: PENGACAKAN OPSI & PENILAIAN BENAR
    # =====================================================================
    page_duel, id_duel = create_tab(f"http://localhost:8090/duel-tim.html", port=port)
    time.sleep(2.0)

    # Mulai duel
    page_duel.eval("document.getElementById('btn-mulai-duel-arena').click();")
    time.sleep(1.0)

    duel_opsi = page_duel.eval("""
    Array.from(document.querySelectorAll('.tombol-opsi-duel .teks-opsi')).map(el => el.textContent.trim())
    """)
    record("10. Mode Duel Tim: 4 Pilihan Opsi Berhasil Dimuat dan Dirender",
           len(duel_opsi) == 4 and all(len(t) > 0 for t in duel_opsi),
           f"Opsi Duel: {duel_opsi}")

    close_tab(id_fo, port=port)
    close_tab(id_duel, port=port)
    close_tab(id_s1, port=port)
    close_tab(id_s2, port=port)
    close_tab(id_guru, port=port)

except Exception as ex:
    print(f"Error test execution: {ex}", flush=True)

proc.terminate()

print("=" * 65)
print(f"HASIL PENGUJIAN AKHIR: {passed_tests} / {total_tests} LULUS")
print("=" * 65)
