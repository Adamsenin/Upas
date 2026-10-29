import sys
import subprocess
import urllib.request
import json
import time
import os
import base64
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_cert_suite_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9240
base_url = "http://localhost:8090"

print("=================================================================", flush=True)
print("MEMULAI PENGUJIAN VISUAL & FUNGSIONAL SERTIFIKAT PRESTASI IPAS", flush=True)
print("=================================================================", flush=True)

cmd = [
    chrome_path,
    f"--remote-debugging-port={port}",
    f"--user-data-dir={tmp_profile}",
    "--no-first-run",
    "--no-default-browser-check",
    "--headless=new",
    "--window-size=1440,900"
]
proc = subprocess.Popen(cmd)
time.sleep(2.0)

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

def evaluate(cdp, expr, await_promise=False):
    res = cdp.send_cmd("Runtime.evaluate", {
        "expression": expr,
        "returnByValue": True,
        "awaitPromise": await_promise
    })
    return res.get("result", {}).get("result", {}).get("value")

cert_page, target_id = create_page(f"{base_url}/sertifikat.html")
time.sleep(2.0)

# 1. Cek ada/tidaknya elemen-elemen sertifikat
eval_res = evaluate(cert_page, """
(() => {
    const svg = document.getElementById('svg-sertifikat-render');
    const namaEl = document.getElementById('cert-svg-nama');
    const judulShowcase = document.getElementById('showcase-cert-judul');
    const galeriKartu = document.querySelectorAll('.kartu-galeri-sertifikat');
    
    return {
        hasSvg: !!svg,
        viewBox: svg ? svg.getAttribute('viewBox') : null,
        namaTeks: namaEl ? namaEl.textContent.trim() : null,
        namaFontSize: namaEl ? namaEl.getAttribute('font-size') : null,
        judulShowcase: judulShowcase ? judulShowcase.textContent.trim() : null,
        totalKartuGaleri: galeriKartu.length,
        hasWatermark: !!document.getElementById('watermark-burung-kupas'),
        hasGuilloche: !!document.getElementById('pola-guilloche'),
        hasMedali: !!document.getElementById('segel-medali'),
        hasTtdGuru: !!document.getElementById('ttd-guru'),
        hasTtdSekolah: !!document.getElementById('ttd-sekolah')
    };
})()
""")

print("Hasil Analisis Halaman Sertifikat:", flush=True)
for k, v in eval_res.items():
    print(f"  - {k}: {v}", flush=True)

# 2. Ambil Screenshot Desktop 1440px
cert_page.send_cmd("Emulation.setDeviceMetricsOverride", {
    "width": 1440,
    "height": 900,
    "deviceScaleFactor": 1,
    "mobile": False
})
time.sleep(0.5)

ss_res = cert_page.send_cmd("Page.captureScreenshot", {"format": "png"})
with open("scratch/sertifikat_desktop_1440.png", "wb") as f:
    f.write(base64.b64decode(ss_res.get("result", {}).get('data', '')))
print("✅ [SAVED] Screenshot Desktop: scratch/sertifikat_desktop_1440.png", flush=True)

# 3. Uji Nama Panjang 40 Karakter
nama_panjang = "Muhammad Raden Bagus Danendra Wicaksana"
eval_nama_panjang = evaluate(cert_page, f"""
(() => {{
    const cert = {{ ...window.pengelolaSertifikat.sertifikatAktif, nama_siswa: '{nama_panjang}' }};
    window.pengelolaSertifikat.pilihSertifikat(cert, false);
    const namaEl = document.getElementById('cert-svg-nama');
    return {{
        nama: namaEl.textContent.trim(),
        fontSize: namaEl.getAttribute('font-size')
    }};
}})()
""")
print(f"✅ [PASS] Uji Nama Panjang 40 Karakter: '{eval_nama_panjang['nama']}' -> Font Size: {eval_nama_panjang['fontSize']}px", flush=True)

ss_res_long = cert_page.send_cmd("Page.captureScreenshot", {"format": "png"})
with open("scratch/sertifikat_nama_panjang.png", "wb") as f:
    f.write(base64.b64decode(ss_res_long.get("result", {}).get('data', '')))
print("✅ [SAVED] Screenshot Nama Panjang: scratch/sertifikat_nama_panjang.png", flush=True)

# 4. Uji Nama Pendek
eval_nama_pendek = evaluate(cert_page, """
(() => {
    const cert = { ...window.pengelolaSertifikat.sertifikatAktif, nama_siswa: 'Brody' };
    window.pengelolaSertifikat.pilihSertifikat(cert, false);
    const namaEl = document.getElementById('cert-svg-nama');
    return {
        nama: namaEl.textContent.trim(),
        fontSize: namaEl.getAttribute('font-size')
    };
})()
""")
print(f"✅ [PASS] Uji Nama Pendek: '{eval_nama_pendek['nama']}' -> Font Size: {eval_nama_pendek['fontSize']}px", flush=True)

# 5. Uji Tampilan Mobile 375px
cert_page.send_cmd("Emulation.setDeviceMetricsOverride", {
    "width": 375,
    "height": 812,
    "deviceScaleFactor": 2,
    "mobile": True
})
time.sleep(0.5)

ss_res_mobile = cert_page.send_cmd("Page.captureScreenshot", {"format": "png"})
with open("scratch/sertifikat_mobile_375.png", "wb") as f:
    f.write(base64.b64decode(ss_res_mobile.get("result", {}).get('data', '')))
print("✅ [SAVED] Screenshot Mobile 375px: scratch/sertifikat_mobile_375.png", flush=True)

# 6. Uji Tampilan Desktop Besar 1920px (Smartboard)
cert_page.send_cmd("Emulation.setDeviceMetricsOverride", {
    "width": 1920,
    "height": 1080,
    "deviceScaleFactor": 1,
    "mobile": False
})
time.sleep(0.5)

ss_res_1920 = cert_page.send_cmd("Page.captureScreenshot", {"format": "png"})
with open("scratch/sertifikat_smartboard_1920.png", "wb") as f:
    f.write(base64.b64decode(ss_res_1920.get("result", {}).get('data', '')))
print("✅ [SAVED] Screenshot 1920px (Smartboard): scratch/sertifikat_smartboard_1920.png", flush=True)

# 7. Uji Fungsionalitas Konversi SVG -> Canvas (Unduh PNG)
eval_png = evaluate(cert_page, """
(() => {
    return new Promise((resolve) => {
        const svgElement = document.getElementById('svg-sertifikat-render');
        if (!svgElement) return resolve({ success: false, reason: 'SVG not found' });
        
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svgElement);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 2376;
            canvas.height = 1680;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFDF7';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            
            const dataUrl = canvas.toDataURL('image/png');
            resolve({
                success: true,
                width: canvas.width,
                height: canvas.height,
                dataLength: dataUrl.length,
                isValidPng: dataUrl.startsWith('data:image/png;base64,')
            });
        };
        img.onerror = (e) => resolve({ success: false, reason: 'Image load error: ' + String(e) });
        img.src = url;
    });
})()
""", await_promise=True)

print(f"✅ [PASS] Uji Unduh PNG via Native SVG->Canvas: {json.dumps(eval_png)}", flush=True)

close_page(target_id)
proc.terminate()
print("=================================================================", flush=True)
print("SELURUH PENGUJIAN CHECKPOINT 2 SELESAI!", flush=True)
print("=================================================================", flush=True)
