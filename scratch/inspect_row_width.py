import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9287
tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
proc = subprocess.Popen([chrome_path, f"--remote-debugging-port={port}", "--headless=new", "--no-first-run", f"--user-data-dir={tmp_profile}"])
time.sleep(1.8)

try:
    req = urllib.request.Request(f"http://localhost:{port}/json/new?http://localhost:8090/index.html", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(0.8)

    cdp.send_cmd("Emulation.setDeviceMetricsOverride", {
        "width": 360,
        "height": 640,
        "deviceScaleFactor": 1,
        "mobile": True
    })
    time.sleep(0.3)

    info = cdp.eval("""
    (() => {
        const body = document.body;
        const main = document.querySelector('main');
        const row = document.querySelector('main .row');
        
        function getBox(el) {
            const r = el.getBoundingClientRect();
            const s = window.getComputedStyle(el);
            return {
                w: r.width,
                left: r.left,
                right: r.right,
                padL: s.paddingLeft,
                padR: s.paddingRight,
                marL: s.marginLeft,
                marR: s.marginRight,
                scrollW: el.scrollWidth,
                offsetW: el.offsetWidth
            };
        }

        return {
            windowW: window.innerWidth,
            htmlW: document.documentElement.scrollWidth,
            body: getBox(body),
            main: getBox(main),
            row: getBox(row)
        };
    })()
    """)
    print("info:", info)
finally:
    proc.terminate()

