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

# Simple RFC 6455 WebSocket Client using standard library
class SimpleWebSocket:
    def __init__(self, host, port, path):
        self.sock = socket.create_connection((host, port))
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
                continue
            try:
                data = json.loads(res.decode('utf-8'))
                if data.get("id") == self.msg_id:
                    return data
            except Exception:
                pass

    def recv_frame(self):
        head = self.sock.recv(2)
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
        res = self.send_cmd("Runtime.evaluate", {"expression": expression, "returnByValue": True})
        return res.get("result", {}).get("result", {}).get("value")

    def close(self):
        try:
            self.sock.close()
        except Exception:
            pass

def run_tests():
    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    port = 9226
    proc = subprocess.Popen([
        chrome_path,
        "--headless=new",
        f"--remote-debugging-port={port}",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--remote-allow-origins=*",
        "about:blank"
    ])
    time.sleep(2)

    try:
        tabs_data = urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read()
        all_tabs = json.loads(tabs_data)
        page_tabs = [t for t in all_tabs if t.get('type') == 'page']
        ws_url = page_tabs[0]["webSocketDebuggerUrl"]
        path = ws_url.split(f":{port}")[1]
        ws = SimpleWebSocket("127.0.0.1", port, path)

        print("=======================================================")
        print("1. VERIFIKASI TAMPILAN RESPONSIVE 375px & 1440px")
        print("=======================================================")
        pages = [
            ("index.html", "#btn-saya-siswa"),
            ("gabung.html", "#btn-gabung-submit"),
            ("guru/masuk.html", "#btn-submit-masuk"),
            ("guru/dasbor.html", "#btn-buat-kuis-baru"),
            ("guru/editor.html", "#btn-simpan-kuis"),
            ("404.html", ".btn-kupas-hijau")
        ]

        for width, label in [(375, "Ponsel 375px"), (1440, "Desktop/Smartboard 1440px")]:
            print(f"\n--- Menguji Lebar: {label} ---")
            ws.send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": width,
                "height": 800,
                "deviceScaleFactor": 1,
                "mobile": (width == 375)
            })

            for page, btn_selector in pages:
                url = f"http://localhost:8090/{page}"
                ws.send_cmd("Page.navigate", {"url": url})
                time.sleep(0.8)

                check_script = f"""
                (() => {{
                    const scrollW = document.documentElement.scrollWidth;
                    const innerW = window.innerWidth;
                    const noOverflow = (scrollW <= innerW + 1); // 1px rounding tolerance
                    const btn = document.querySelector('{btn_selector}');
                    const btnVisible = Boolean(btn && (btn.offsetWidth > 0 || btn.offsetHeight > 0));
                    return {{ noOverflow, scrollW, innerW, btnVisible }};
                }})()
                """
                res = ws.eval_js(check_script)
                status_overflow = 'BEBAS OVERFLOW' if res['noOverflow'] else f"OVERFLOW (scrollW: {res['scrollW']} > innerW: {res['innerW']})"
                print(f"  [{page:17}] {status_overflow:18} | Tombol Utama Terlihat: {res['btnVisible']}")
                assert res['noOverflow'], f"Overflow di {page} pada {width}px: scrollW={res['scrollW']} > innerW={res['innerW']}"
                assert res['btnVisible'], f"Tombol {btn_selector} tidak terlihat di {page}"

        print("\n✅ Seluruh halaman lolos uji responsif (375px & 1440px) tanpa overflow dan tombol utama terlihat.")

        print("\n=======================================================")
        print("2. PENGUJIAN SESI LENGKAP: 1 GURU & 1 SISWA (REALTIME)")
        print("=======================================================")

        # Guru membuka dasbor
        ws.send_cmd("Page.navigate", {"url": "http://localhost:8090/guru/dasbor.html"})
        time.sleep(1)

        # Klik Mulai Sesi pada kuis pertama
        ws.eval_js("document.querySelector('.btn-buka-modal').click()")
        time.sleep(0.5)

        # Pilih Mode Adventure Kelas
        ws.eval_js("document.getElementById('modeAdventure').checked = true")
        ws.eval_js("document.getElementById('btn-konfirmasi-mulai').click()")
        time.sleep(1.2)

        guru_url = ws.eval_js("window.location.href")
        print(f"1. Guru membuka lobi sesi: {guru_url}")
        kode = ws.eval_js("document.getElementById('tampilan-kode-sesi').textContent.trim()")
        print(f"   Kode Sesi Dihasilkan: {kode}")
        assert len(kode) == 6, f"Kode sesi tidak 6 karakter: {kode}"

        # Buka tab kedua untuk Siswa via CDP Target.createTarget
        tab_siswa = ws.send_cmd("Target.createTarget", {"url": f"http://localhost:8090/gabung.html?kode={kode}"})
        target_id = tab_siswa["result"]["targetId"]
        time.sleep(1)

        # Connect websocket ke tab siswa
        tabs_data = urllib.request.urlopen(f"http://127.0.0.1:{port}/json").read()
        all_tabs = json.loads(tabs_data)
        siswa_ws_url = [t["webSocketDebuggerUrl"] for t in all_tabs if t["id"] == target_id][0]
        siswa_path = siswa_ws_url.split(f":{port}")[1]
        ws_siswa = SimpleWebSocket("127.0.0.1", port, siswa_path)

        # Siswa mengisi nama dan klik tombol gabung
        print(f"2. Siswa memasukkan nama 'Budi Pintar' dan memilih avatar...")
        ws_siswa.eval_js("document.getElementById('input-nama').value = 'Budi Pintar'")
        ws_siswa.eval_js("document.getElementById('btn-gabung-submit').click()")
        time.sleep(1.5)

        # Cek siswa masuk ke main.html
        nama_siswa_aktif = ws_siswa.eval_js("document.getElementById('nama-siswa-aktif').textContent")
        print(f"   Siswa berhasil masuk ke ruang kuis sebagai: '{nama_siswa_aktif}'")
        assert 'Budi' in nama_siswa_aktif, f"Nama siswa tidak sesuai: {nama_siswa_aktif}"

        # Guru melihat peserta bertambah di lobi
        jml_peserta = ws.eval_js("document.getElementById('jumlah-peserta-lobi').textContent")
        print(f"   Peserta terdeteksi di layar Guru: {jml_peserta} orang")
        assert int(jml_peserta) >= 1, "Peserta tidak muncul di lobi guru"

        # Guru menekan Mulai Kuis Sekarang
        print("3. Guru menekan 'Mulai Kuis Sekarang' (Menjalankan hitung mundur 3-2-1)...")
        ws.eval_js("document.getElementById('btn-mulai-kuis').click()")
        time.sleep(4.5) # Waktu untuk hitung mundur 3 detik selesai

        # Cek Soal tampil di Guru dan Siswa
        soal_guru = ws.eval_js("document.getElementById('teks-pertanyaan').textContent.trim()")
        soal_siswa = ws_siswa.eval_js("document.getElementById('siswa-pertanyaan').textContent.trim()")
        print(f"4. Soal aktif tampil di Guru: '{soal_guru[:55]}...'")
        print(f"   Soal aktif tampil di Siswa: '{soal_siswa[:55]}...'")
        assert len(soal_guru) > 10, "Soal guru kosong"
        assert len(soal_siswa) > 10, "Soal siswa kosong"

        # Siswa menjawab soal menggunakan tombol keyboard shortcut '1'
        print("5. Siswa menjawab soal via shortcut keyboard angka '1'...")
        ws_siswa.eval_js("""
            const evt = new KeyboardEvent('keydown', { key: '1' });
            document.dispatchEvent(evt);
        """)
        time.sleep(0.5)

        # Siswa mengunci jawaban dengan Enter
        print("   Siswa mengunci jawaban via tombol Enter...")
        ws_siswa.eval_js("""
            const evtEnter = new KeyboardEvent('keydown', { key: 'Enter' });
            document.dispatchEvent(evtEnter);
        """)
        time.sleep(1.2)

        # Guru melihat hitungan siswa yang sudah menjawab
        terjawab = ws.eval_js("document.getElementById('hitung-menjawab').textContent")
        print(f"6. Guru menerima status jawaban: {terjawab} peserta selesai menjawab.")
        assert int(terjawab) >= 1, f"Jawaban siswa tidak terhitung di layar guru: {terjawab}"

        # Guru membuka pembahasan materi
        print("7. Guru membuka Pembahasan & Jawaban Materi IPAS...")
        ws.eval_js("document.getElementById('btn-buka-pembahasan').click()")
        time.sleep(1.5)

        # Cek siswa menerima pembahasan
        feedback_judul = ws_siswa.eval_js("document.getElementById('feedback-judul').textContent")
        print(f"   Umpan balik pada layar Siswa: '{feedback_judul}'")
        assert 'Hebat' in feedback_judul or 'Benar' in feedback_judul or 'Belum' in feedback_judul, "Feedback tidak muncul"

        # Mode Adventure: Maskot bergerak di peta
        peta_langkah = ws.eval_js("document.getElementById('label-langkah-peta').textContent")
        print(f"   Posisi Peta Petualangan Adventure Kelas: '{peta_langkah}'")

        # Guru lanjut ke Papan Skor
        print("8. Guru membuka Papan Skor Kelas...")
        ws.eval_js("document.getElementById('btn-lanjut-skor').click()")
        time.sleep(1.2)

        juara1 = ws.eval_js("document.getElementById('podium-nama-1').textContent")
        skor1 = ws.eval_js("document.getElementById('podium-skor-1').textContent")
        print(f"   Podium Juara 1 di Layar Kelas: {juara1} ({skor1} Poin)")

        # Guru menyelesaikan sesi ke Hasil Akhir
        print("9. Guru menyelesaikan sesi kuis hingga Hasil Akhir...")
        ws.eval_js("document.getElementById('btn-lanjut-soal-berikutnya').click()")
        time.sleep(2)

        hasil_guru_terlihat = not ws.eval_js("document.getElementById('tampilan-hasil-akhir').classList.contains('d-none')")
        hasil_siswa_terlihat = not ws_siswa.eval_js("document.getElementById('siswa-hasil').classList.contains('d-none')")
        print(f"   Layar Hasil Akhir Guru Tampil: {hasil_guru_terlihat}")
        print(f"   Layar Hasil Akhir Siswa Tampil: {hasil_siswa_terlihat}")
        assert hasil_guru_terlihat, "Layar hasil akhir guru gagal tampil"
        assert hasil_siswa_terlihat, "Layar hasil akhir siswa gagal tampil"

        # Guru menekan unduh CSV
        print("10. Menguji fungsi unduh rekap CSV hasil belajar...")
        ws.eval_js("document.getElementById('btn-unduh-csv').click()")
        time.sleep(0.5)
        print("   Ekspor CSV berhasil dipicu.")

        print("\n✅ ALUR SESI PENUH (1 GURU & 1 SISWA) BERJALAN SEMPURNA SAMPAI HASIL AKHIR!")

        ws.close()
        ws_siswa.close()

    finally:
        proc.terminate()
        proc.kill()

if __name__ == "__main__":
    run_tests()
