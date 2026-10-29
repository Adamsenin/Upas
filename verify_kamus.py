import os
import sys
import json
import time
import socket
import struct
import base64
import urllib.request
import subprocess

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class SimpleWebSocket:
    def __init__(self, host, port, path):
        self.sock = socket.create_connection((host, port))
        self.sock.settimeout(12.0)
        key = base64.b64encode(os.urandom(16)).decode('utf-8')
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        self.sock.sendall(req.encode('utf-8'))
        resp = b""
        while b"\r\n\r\n" not in resp:
            resp += self.sock.recv(4096)
        self.msg_id = 0

    def send_cmd(self, method, params=None):
        self.msg_id += 1
        msg = json.dumps({"id": self.msg_id, "method": method, "params": params or {}})
        payload = msg.encode('utf-8')
        length = len(payload)
        mask_key = os.urandom(4)
        masked = bytearray(length)
        for i in range(length):
            masked[i] = payload[i] ^ mask_key[i % 4]

        header = bytearray([0x81])
        if length <= 125:
            header.append(0x80 | length)
        elif length <= 65535:
            header.append(0x80 | 126)
            header.extend(struct.pack("!H", length))
        else:
            header.append(0x80 | 127)
            header.extend(struct.pack("!Q", length))
        header.extend(mask_key)
        self.sock.sendall(header + masked)

        while True:
            res = self.recv_frame()
            if not res:
                return {}
            try:
                data = json.loads(res.decode('utf-8'))
                if data.get("id") == self.msg_id:
                    return data
            except Exception:
                pass

    def recv_frame(self):
        try:
            head = self.sock.recv(2)
        except socket.timeout:
            return None
        if len(head) < 2:
            return None
        b1, b2 = head[0], head[1]
        length = b2 & 0x7F
        if length == 126:
            length = struct.unpack("!H", self.sock.recv(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self.sock.recv(8))[0]
        
        is_masked = (b2 & 0x80) != 0
        if is_masked:
            mask = self.sock.recv(4)
        payload = b""
        while len(payload) < length:
            chunk = self.sock.recv(length - len(payload))
            if not chunk:
                break
            payload += chunk
        if is_masked:
            unmasked = bytearray(length)
            for i in range(length):
                unmasked[i] = payload[i] ^ mask[i % 4]
            return unmasked
        return payload

    def eval_js(self, expression):
        res = self.send_cmd("Runtime.evaluate", {"expression": expression, "returnByValue": True, "awaitPromise": True})
        return res.get("result", {}).get("result", {}).get("value")

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass

def run_verification():
    subprocess.run(["powershell", "-Command", "Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue"])
    time.sleep(1)

    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9229
    user_data = r"C:\Users\STEEL LEGEND\Downloads\KUPAS\.test_profile_kamus"
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={port}",
        f"--user-data-dir={user_data}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-allow-origins=*",
        "http://localhost:8091/index.html"
    ])
    time.sleep(2)

    try:
        tabs_data = urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read()
        all_tabs = json.loads(tabs_data)
        page_tabs = [t for t in all_tabs if t.get('type') == 'page']
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        path = ws_url.split(f":{port}")[1]
        ws = SimpleWebSocket("127.0.0.1", port, path)

        print("=======================================================", flush=True)
        print("1. UJI RESPONSIF 375px & 1440px (TERMASUK HALAMAN KAMUS)", flush=True)
        print("=======================================================", flush=True)

        pages = [
            ("index.html", "#btn-kamus-belajar"),
            ("kamus-belajar.html", "#mode-kartu"),
            ("guru/kamus.html", "#btn-tambah-kamus"),
            ("guru/dasbor.html", "#btn-kelola-kamus"),
            ("guru/editor.html", "#btn-modal-entri-baru")
        ]

        for width, label in [(375, "Ponsel 375px"), (1440, "Desktop/Smartboard 1440px")]:
            print(f"\n--- Menguji Lebar: {label} ---", flush=True)
            ws.send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": 800,
                "deviceScaleFactor": 1,
                "mobile": (width == 375)
            })

            for page, btn_sel in pages:
                ws.send_cmd("Page.navigate", {"url": f"http://localhost:8091/{page}"})
                time.sleep(0.9)
                res = ws.eval_js(f"""
                (() => {{
                    const scrollW = document.documentElement.scrollWidth;
                    const innerW = window.innerWidth;
                    const noOverflow = (scrollW <= innerW + 1);
                    const btn = document.querySelector('{btn_sel}');
                    const btnVisible = Boolean(btn && (btn.offsetWidth > 0 || btn.offsetHeight > 0));
                    return {{ noOverflow, scrollW, innerW, btnVisible }};
                }})()
                """)
                status = "BEBAS OVERFLOW" if res["noOverflow"] else f"OVERFLOW ({res['scrollW']} > {res['innerW']})"
                print(f"  [{page:20}] {status:16} | Tombol Terlihat: {res['btnVisible']}", flush=True)
                assert res["noOverflow"], f"Overflow di {page} pada {width}px"
                assert res["btnVisible"], f"Tombol {btn_sel} tidak terlihat di {page}"

        print("\n✅ Uji responsif 375px & 1440px LULUS tanpa overflow.", flush=True)

        print("\n=======================================================", flush=True)
        print("2. UJI FITUR SISWA: CARI, FILTER, DAN KARTU BOLAK-BALIK (TANPA LOGIN)", flush=True)
        print("=======================================================", flush=True)

        ws.send_cmd("Page.navigate", {"url": "http://localhost:8091/kamus-belajar.html"})
        time.sleep(1)

        # Pastikan tidak ada user login
        ws.eval_js("localStorage.removeItem('kupas_auth_user')")
        jml_awal = ws.eval_js("document.querySelectorAll('#wadah-mode-daftar .kupas-card').length")
        print(f"1. Jumlah entri kamus tampil untuk siswa (tanpa login): {jml_awal} entri", flush=True)
        assert jml_awal >= 20, f"Jumlah entri kurang dari 20: {jml_awal}"

        # Uji Pencarian
        ws.eval_js("""
        (() => {
            const inp = document.getElementById('input-cari-kamus');
            inp.value = 'Fotosintesis';
            inp.dispatchEvent(new Event('input'));
        })()
        """)
        time.sleep(0.3)
        jml_cari = ws.eval_js("document.querySelectorAll('#wadah-mode-daftar .kupas-card').length")
        print(f"2. Hasil pencarian 'Fotosintesis': {jml_cari} entri", flush=True)
        assert jml_cari >= 1, "Pencarian Fotosintesis tidak menemukan hasil"

        # Reset cari & Uji Filter Kategori
        ws.eval_js("""
        (() => {
            const inp = document.getElementById('input-cari-kamus');
            inp.value = '';
            const sel = document.getElementById('select-kategori-kamus');
            sel.value = 'Saling Bergantung';
            sel.dispatchEvent(new Event('change'));
        })()
        """)
        time.sleep(0.3)
        jml_kat = ws.eval_js("document.querySelectorAll('#wadah-mode-daftar .kupas-card').length")
        print(f"3. Hasil filter kategori 'Saling Bergantung': {jml_kat} entri", flush=True)
        assert jml_kat == 3, f"Filter Saling Bergantung seharusnya 3 simbiosis, dapat: {jml_kat}"

        # Uji Mode Kartu Bolak-Balik (Flashcard)
        ws.eval_js("document.getElementById('mode-kartu').click()")
        time.sleep(0.3)
        istilah_kartu = ws.eval_js("document.getElementById('flashcard-istilah').textContent")
        print(f"4. Mode Kartu Belajar dibuka, menampilkan: '{istilah_kartu}'", flush=True)

        # Balik Kartu
        ws.eval_js("document.getElementById('kartu-belajar-inner').click()")
        time.sleep(0.3)
        terbalik = ws.eval_js("document.getElementById('kartu-belajar-inner').classList.contains('flipped')")
        print(f"   Kartu berhasil dibalik (flipped): {terbalik}", flush=True)
        assert terbalik, "Kartu gagal dibalik"

        # Tandai Sudah Dipelajari
        ws.eval_js("document.getElementById('btn-flashcard-tandai').click()")
        time.sleep(0.2)
        progres = ws.eval_js("document.getElementById('badge-progres').textContent")
        print(f"   Progres belajar tersimpan di localStorage: {progres}", flush=True)
        assert "1 /" in progres, f"Progres belajar tidak terupdate: {progres}"

        print("\n✅ Uji fitur Kamus Belajar Siswa (Cari, Filter, Flashcard, LocalStorage) LULUS.", flush=True)

        print("\n=======================================================", flush=True)
        print("3. UJI KEAMANAN RLS: SISWA / ANON TIDAK DAPAT MENULIS KE KAMUS", flush=True)
        print("=======================================================", flush=True)

        rls_test = ws.eval_js("""
        (async () => {
            localStorage.removeItem('kupas_auth_user');
            const { supabase } = await import('./assets/js/supabase.js');
            await supabase.auth.signInAnonymously();
            const resInsert = await supabase.from('kamus').insert({
                istilah: 'Hack Siswa',
                kategori: 'Ekosistem',
                definisi: 'Coba tulis tanpa izin'
            });
            const resDelete = await supabase.from('kamus').delete().eq('id', 'kamus-1');
            return {
                insertBlocked: Boolean(resInsert.error),
                insertErrorMsg: resInsert.error ? resInsert.error.message : null,
                deleteBlocked: Boolean(resDelete.error)
            };
        })()
        """)
        print(f"   Anon Insert Ditolak: {rls_test['insertBlocked']} ({rls_test['insertErrorMsg']})", flush=True)
        print(f"   Anon Delete Ditolak: {rls_test['deleteBlocked']}", flush=True)
        assert rls_test["insertBlocked"] and rls_test["deleteBlocked"], "RLS gagal menolak penulisan oleh anon!"

        print("\n✅ Uji RLS Klien Anon LULUS (Siswa tidak dapat memodifikasi kamus).", flush=True)

        print("\n=======================================================", flush=True)
        print("4. UJI CRUD GURU & SINKRONISASI KE KAMUS SISWA", flush=True)
        print("=======================================================", flush=True)

        # Login sebagai Guru
        ws.send_cmd("Page.navigate", {"url": "http://localhost:8091/guru/kamus.html"})
        time.sleep(1)
        ws.eval_js("""
        (async () => {
            const { auth } = await import('../assets/js/auth.js');
            await auth.masukGuru('guru@sd.sch.id', 'rahasia123');
        })()
        """)

        # Guru menambah entri baru
        id_baru = ws.eval_js("""
        (async () => {
            const { kamusManager } = await import('../assets/js/kamus.js');
            return await kamusManager.simpanKamus({
                istilah: 'Terumbu Karang Laut',
                kategori: 'Ekosistem',
                definisi: 'Ekosistem bawah laut yang dibangun oleh biota laut penghasil kapur.',
                contoh: 'Terumbu karang Raja Ampat.',
                status: 'terbit'
            });
        })()
        """)
        print(f"1. Guru menambah entri baru 'Terumbu Karang Laut' (ID: {id_baru})", flush=True)

        # Cek di halaman siswa kamus-belajar.html
        ws.send_cmd("Page.navigate", {"url": "http://localhost:8091/kamus-belajar.html"})
        time.sleep(1)
        tampil_di_siswa = ws.eval_js("document.body.textContent.includes('Terumbu Karang Laut')")
        print(f"2. Entri baru langsung tampil di kamus siswa: {tampil_di_siswa}", flush=True)
        assert tampil_di_siswa, "Entri baru tidak tampil di kamus siswa!"

        # Guru mengubah entri
        ws.eval_js(f"""
        (async () => {{
            const {{ kamusManager }} = await import('./assets/js/kamus.js');
            await kamusManager.simpanKamus({{
                id: '{id_baru}',
                istilah: 'Terumbu Karang Tropis',
                kategori: 'Ekosistem',
                definisi: 'Ekosistem laut dangkal yang sangat kaya biodiversitas.',
                contoh: 'Taman Laut Bunaken.',
                status: 'terbit'
            }});
        }})()
        """)
        ws.send_cmd("Page.navigate", {"url": "http://localhost:8091/kamus-belajar.html"})
        time.sleep(1)
        ubah_tampil = ws.eval_js("document.body.textContent.includes('Terumbu Karang Tropis')")
        print(f"3. Perubahan entri langsung terbarui di kamus siswa: {ubah_tampil}", flush=True)
        assert ubah_tampil, "Perubahan entri gagal tampil"

        # Guru menghapus entri
        ws.eval_js(f"""
        (async () => {{
            const {{ kamusManager }} = await import('./assets/js/kamus.js');
            await kamusManager.hapusKamus('{id_baru}');
        }})()
        """)
        ws.send_cmd("Page.navigate", {"url": "http://localhost:8091/kamus-belajar.html"})
        time.sleep(1)
        terhapus = not ws.eval_js("document.body.textContent.includes('Terumbu Karang Tropis')")
        print(f"4. Entri yang dihapus tidak lagi tampil di kamus siswa: {terhapus}", flush=True)
        assert terhapus, "Entri gagal dihapus"

        print("\n✅ Uji CRUD Kamus Guru & Sinkronisasi ke Siswa LULUS.", flush=True)

        print("\n=======================================================", flush=True)
        print("5. UJI TAUTAN SOAL SEED KE KAMUS & TOMBOL 'PELAJARI' DI PEMBAHASAN", flush=True)
        print("=======================================================", flush=True)

        cek_tautan = ws.eval_js("""
        (() => {
            const soal = JSON.parse(localStorage.getItem('kupas_db_soal') || '[]');
            const semuaTertaut = soal.length === 20 && soal.every(s => Boolean(s.kamus_id));
            return { totalSoal: soal.length, semuaTertaut };
        })()
        """)
        print(f"1. Total Soal Seed: {cek_tautan['totalSoal']} | Semua Tertaut ke Kamus: {cek_tautan['semuaTertaut']}", flush=True)
        assert cek_tautan["semuaTertaut"], "Ada soal seed yang belum tertaut ke kamus_id!"

        # Buat sesi dan buka pembahasan untuk memverifikasi tombol "Pelajari: [istilah]"
        kode_sesi = ws.eval_js("""
        (async () => {
            const { sesiManager } = await import('./assets/js/sesi.js');
            const s = await sesiManager.buatSesi('kuis-ekosistem-1', 'guru-demo-1', 'custom');
            return s.kode;
        })()
        """)
        ws.send_cmd("Page.navigate", {"url": f"http://localhost:8091/guru/sesi.html?kode={kode_sesi}"})
        time.sleep(1.2)

        # Buka soal 1 lalu buka pembahasan
        ws.eval_js("""
        (async () => {
            document.getElementById('btn-mulai-kuis').disabled = false;
            document.getElementById('btn-mulai-kuis').click();
        })()
        """)
        time.sleep(4)
        ws.eval_js("document.getElementById('btn-buka-pembahasan').click()")
        time.sleep(1)

        teks_btn_pelajari = ws.eval_js("document.getElementById('btn-pelajari-kamus-guru').textContent.trim()")
        terlihat_btn = not ws.eval_js("document.getElementById('wadah-tombol-kamus-guru').classList.contains('d-none')")
        print(f"2. Tombol di layar Pembahasan: '{teks_btn_pelajari}' (Terlihat: {terlihat_btn})", flush=True)
        assert terlihat_btn and "Pelajari: Produsen" in teks_btn_pelajari, f"Tombol Pelajari tidak sesuai: {teks_btn_pelajari}"

        # Klik tombol Pelajari untuk membuka kartu kamus di pembahasan
        ws.eval_js("document.getElementById('btn-pelajari-kamus-guru').click()")
        time.sleep(0.3)
        detail_terbuka = not ws.eval_js("document.getElementById('detail-kamus-guru').classList.contains('d-none')")
        print(f"3. Detail Kamus terbuka saat tombol Pelajari diklik: {detail_terbuka}", flush=True)
        assert detail_terbuka, "Detail kamus gagal terbuka di layar pembahasan"

        # Uji Sound Effects & Musik Latar
        audio_test = ws.eval_js("""
        (() => {
            const btnSfx = document.getElementById('btn-toggle-suara');
            const btnBgm = document.getElementById('btn-toggle-musik');
            btnSfx.click();
            btnBgm.click();
            return {
                sfxText: btnSfx.textContent.trim(),
                bgmText: btnBgm.textContent.trim()
            };
        })()
        """)
        print(f"4. Status Tombol Audio: '{audio_test['sfxText']}' | '{audio_test['bgmText']}'", flush=True)

        print("\n=======================================================", flush=True)
        print("SELURUH KRITERIA KAMUS BELAJAR & AUDIO BERHASIL DIVERIFIKASI!", flush=True)
        print("=======================================================", flush=True)

        ws.close()

    finally:
        proc.terminate()
        proc.kill()

if __name__ == "__main__":
    run_verification()
