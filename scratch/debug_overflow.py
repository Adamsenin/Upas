import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9278
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
    req = urllib.request.Request(f"http://localhost:{port}/json/new?{base_url}/index.html", method="PUT")
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

    cdp.eval("""
    const nav = document.getElementById('kupasOffcanvasNav');
    if (nav) nav.remove();
    const bg = document.getElementById('kupas-latar-hidup');
    if (bg) bg.remove();
    """)
    print("After removing both:")
    print("body.scrollWidth:", cdp.eval("document.body.scrollWidth"))

    # Also check if any element still overflows
    remaining = cdp.eval("""
    (() => {
        const res = [];
        const w = window.innerWidth;
        document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > w + 1) {
                res.push({tag: el.tagName, id: el.id, cls: el.className, right: r.right});
            }
        });
        return res;
    })()
    """)
    print("Remaining overflowing elements:", len(remaining))
    for r in remaining:
        print(r)

finally:
    proc.terminate()
