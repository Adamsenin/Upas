import sys
import subprocess
import urllib.request
import json
import time
import os

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_audit_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9290
base_url = "http://127.0.0.1:8090"

pages_to_audit = [
    {"name": "Beranda (index.html)", "url": f"{base_url}/index.html"},
    {"name": "Gabung Siswa (gabung.html)", "url": f"{base_url}/gabung.html"},
    {"name": "Kuis Sesi Siswa (siswa/main.html)", "url": f"{base_url}/siswa/main.html?kode=DEMO"},
    {"name": "Kamus Belajar (kamus-belajar.html)", "url": f"{base_url}/kamus-belajar.html"},
    {"name": "Fakta vs Opini (fakta-opini.html)", "url": f"{base_url}/fakta-opini.html"},
    {"name": "Rantai Makanan (rantai-makanan.html)", "url": f"{base_url}/rantai-makanan.html"},
    {"name": "Lab Siklus Air (siklus-air.html)", "url": f"{base_url}/siklus-air.html"},
    {"name": "Duel Tim (duel-tim.html)", "url": f"{base_url}/duel-tim.html"},
    {"name": "Sertifikat (sertifikat.html)", "url": f"{base_url}/sertifikat.html"},
    {"name": "Masuk Guru (guru/masuk.html)", "url": f"{base_url}/guru/masuk.html"},
    {"name": "Dasbor Guru (guru/dasbor.html)", "url": f"{base_url}/guru/dasbor.html"},
    {"name": "Layar Sesi Guru (guru/sesi.html)", "url": f"{base_url}/guru/sesi.html?kode=DEMO"},
    {"name": "Editor Guru (guru/editor.html)", "url": f"{base_url}/guru/editor.html"},
    {"name": "Kamus Guru (guru/kamus.html)", "url": f"{base_url}/guru/kamus.html"},
]

viewports = [
    {"label": "320px (Mobile S)", "w": 320, "h": 568},
    {"label": "360px (Android S)", "w": 360, "h": 640},
    {"label": "390px (iPhone 12/13/14)", "w": 390, "h": 844},
    {"label": "412px (Android L)", "w": 412, "h": 915},
    {"label": "667x375 (Mobile Landscape)", "w": 667, "h": 375},
    {"label": "768px (Tablet Portrait)", "w": 768, "h": 1024},
    {"label": "1024px (Laptop/Tablet L)", "w": 1024, "h": 768},
    {"label": "1920px (Desktop/Smartboard)", "w": 1920, "h": 1080},
]

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
    req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{url}", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(0.5)
    return cdp, target["id"]

def close_page(target_id):
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/close/{target_id}", method="PUT")
        urllib.request.urlopen(req)
    except:
        pass

audit_results = {}

for p_info in pages_to_audit:
    p_name = p_info["name"]
    p_url = p_info["url"]
    print(f"Auditing {p_name}...", flush=True)
    audit_results[p_name] = {}

    try:
        cdp, tid = create_page(p_url)
        time.sleep(0.8)

        for vp in viewports:
            cdp.send_cmd("Emulation.setDeviceMetricsOverride", {
                "width": vp["w"],
                "height": vp["h"],
                "deviceScaleFactor": 1,
                "mobile": (vp["w"] < 1024)
            })
            time.sleep(0.15)

            report = cdp.eval("""
            (() => {
                const w = window.innerWidth;
                const h = window.innerHeight;
                const docW = document.documentElement.scrollWidth;
                const bodyW = document.body.scrollWidth;
                const hasHScroll = (docW > w + 1) || (bodyW > w + 1);

                // Cari elemen yang overflow horizontal
                const overflowingElements = [];
                document.querySelectorAll('*').forEach(el => {
                    if (el.closest('#kupasOffcanvasNav')) return;
                    if (el.closest('.sertifikat-scroll-wrapper')) return;
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        if (r.right > w + 2 || r.left < -2) {
                            overflowingElements.push({
                                tag: el.tagName.toLowerCase(),
                                id: el.id,
                                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                                right: Math.round(r.right),
                                left: Math.round(r.left),
                                width: Math.round(r.width)
                            });
                        }
                    }
                });

                // Cek target sentuh tombol/link/input (< 44px)
                const smallTouchTargets = [];
                document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]').forEach(el => {
                    if (el.offsetParent === null) return;
                    const r = el.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) {
                        if (r.width < 44 || r.height < 44) {
                            smallTouchTargets.push({
                                tag: el.tagName.toLowerCase(),
                                id: el.id,
                                className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                                text: (el.innerText || el.value || el.placeholder || '').trim().slice(0, 30),
                                w: Math.round(r.width),
                                h: Math.round(r.height)
                            });
                        }
                    }
                });

                // Cek input font-size < 16px (memicu auto zoom di iOS Safari)
                const smallFontInputs = [];
                document.querySelectorAll('input, select, textarea').forEach(el => {
                    const fs = parseFloat(window.getComputedStyle(el).fontSize);
                    if (fs < 15.5 && el.type !== 'hidden') {
                        smallFontInputs.push({
                            id: el.id,
                            name: el.name,
                            fs: fs
                        });
                    }
                });

                return {
                    w, h, docW, bodyW, hasHScroll,
                    overflowCount: overflowingElements.length,
                    topOverflows: overflowingElements.slice(0, 5),
                    smallTouchCount: smallTouchTargets.length,
                    topSmallTouches: smallTouchTargets.slice(0, 5),
                    smallFontCount: smallFontInputs.length,
                    smallFontInputs
                };
            })()
            """)
            audit_results[p_name][vp["label"]] = report

        close_page(tid)
    except Exception as e:
        print(f"Error auditing {p_name}: {e}", flush=True)

proc.terminate()

with open('scratch/audit_report_raw.json', 'w', encoding='utf-8') as f:
    json.dump(audit_results, f, ensure_ascii=False, indent=2)

print("AUDIT_COMPLETE", flush=True)
