import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9291
tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
proc = subprocess.Popen([chrome_path, f"--remote-debugging-port={port}", "--headless=new", "--no-first-run", f"--user-data-dir={tmp_profile}"])
time.sleep(1.8)

try:
    req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?http://127.0.0.1:8090/guru/sesi.html?kode=DEMO", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(0.8)

    cdp.send_cmd("Emulation.setDeviceMetricsOverride", {
        "width": 320,
        "height": 568,
        "deviceScaleFactor": 1,
        "mobile": True
    })
    time.sleep(0.3)

    elements = cdp.eval("""
    (() => {
        const els = [];
        const w = window.innerWidth;
        document.querySelectorAll('body *').forEach(el => {
            if (el.closest('#kupasOffcanvasNav')) return;
            const r = el.getBoundingClientRect();
            if (r.right > w + 1 || el.scrollWidth > w + 1) {
                els.push({
                    tag: el.tagName,
                    id: el.id,
                    cls: (typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                    scrollW: el.scrollWidth,
                    offsetW: el.offsetWidth,
                    right: Math.round(r.right)
                });
            }
        });
        return {
            bodyScrollW: document.body.scrollWidth,
            elements: els
        };
    })()
    """)
    print("bodyScrollW:", elements["bodyScrollW"])
    print("Elements count:", len(elements["elements"]))
    for el in elements["elements"]:
        print(el)
finally:
    proc.terminate()

