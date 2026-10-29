import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9280
base_url = "http://localhost:8090"

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

try:
    req = urllib.request.Request(f"http://localhost:{port}/json/new?{base_url}/index.html", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(1.0)

    print("=" * 70)
    print("VERIFIKASI RESPONSIVE INDEX.HTML (CHECKPOINT 2)")
    print("=" * 70)

    for vp in viewports:
        cdp.send_cmd("Emulation.setDeviceMetricsOverride", {
            "width": vp["w"],
            "height": vp["h"],
            "deviceScaleFactor": 1,
            "mobile": (vp["w"] < 1024)
        })
        time.sleep(0.3)

        res = cdp.eval("""
        (() => {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const docW = document.documentElement.scrollWidth;
            const bodyW = document.body.scrollWidth;
            const hasHScroll = (docW > w + 1) || (bodyW > w + 1);

            // Periksa elemen overflow
            const overflows = [];
            document.querySelectorAll('*').forEach(el => {
                if (el.closest('#kupasOffcanvasNav')) return; // offcanvas is offscreen
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0 && (r.right > w + 2 || r.left < -2)) {
                    overflows.push({
                        tag: el.tagName.toLowerCase(),
                        id: el.id,
                        className: (typeof el.className === 'string') ? el.className.slice(0, 30) : '',
                        right: Math.round(r.right),
                        left: Math.round(r.left)
                    });
                }
            });

            // Target sentuh < 48px
            const smallTargets = [];
            document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="tab"]').forEach(el => {
                if (el.offsetParent === null) return;
                const r = el.getBoundingClientRect();
                if (r.width > 0 && r.height > 0) {
                    if (r.width < 44 || r.height < 44) {
                        smallTargets.push({
                            tag: el.tagName.toLowerCase(),
                            id: el.id,
                            text: el.innerText ? el.innerText.trim().slice(0, 25) : '',
                            w: Math.round(r.width),
                            h: Math.round(r.height)
                        });
                    }
                }
            });

            return {
                vp: w + 'x' + h,
                docW, bodyW, hasHScroll,
                overflowCount: overflows.length,
                overflows: overflows.slice(0, 5),
                smallTargetCount: smallTargets.length,
                smallTargets: smallTargets.slice(0, 5)
            };
        })()
        """)

        status_scroll = "PASSED (No horizontal scroll)" if not res["hasHScroll"] else f"FAILED (bodyW={res['bodyW']}, docW={res['docW']})"
        print(f"\n[{vp['label']}] Viewport: {res['vp']}")
        print(f"  Scroll Status: {status_scroll}")
        if res["overflowCount"] > 0:
            print(f"  Overflowing Elements ({res['overflowCount']}):")
            for o in res["overflows"]:
                print(f"    - <{o['tag']} id='{o['id']}' class='{o['className']}'> right={o['right']} left={o['left']}")
        print(f"  Touch Targets < 44px: {res['smallTargetCount']}")
        if res["smallTargetCount"] > 0:
            for st in res["smallTargets"]:
                print(f"    - <{st['tag']} id='{st['id']}'> '{st['text']}' ({st['w']}x{st['h']}px)")

finally:
    proc.terminate()

