import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9279
base_url = "http://localhost:8090"

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
    req = urllib.request.Request(f"http://localhost:{port}/json/new?{base_url}/sertifikat.html", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(1.0)

    cdp.send_cmd("Emulation.setDeviceMetricsOverride", {
        "width": 320,
        "height": 568,
        "deviceScaleFactor": 1,
        "mobile": True
    })
    time.sleep(0.5)

    print("Initial body.scrollWidth:", cdp.eval("document.body.scrollWidth"))

    # Also check which elements have bounding right > 320.5 excluding kupas-latar-hidup and kupasOffcanvasNav
    remaining = cdp.eval("""
    (() => {
        const res = [];
        const w = window.innerWidth;
        document.querySelectorAll('*').forEach(el => {
            if (el.closest('#kupas-latar-hidup') || el.closest('#kupasOffcanvasNav')) return;
            const r = el.getBoundingClientRect();
            if (r.right > w + 1) {
                res.push({tag: el.tagName, id: el.id, cls: (typeof el.className === 'string') ? el.className.slice(0, 40) : '', right: r.right});
            }
        });
        return res;
    })()
    """)
    print("Remaining overflowing elements:", len(remaining))
    for r in remaining[:15]:
        print(r)

finally:
    proc.terminate()

