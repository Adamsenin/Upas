import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9281
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
        "width": 360,
        "height": 640,
        "deviceScaleFactor": 1,
        "mobile": True
    })
    time.sleep(0.5)

    info = cdp.eval("""
    (() => {
        // Find why body scrollWidth is 372
        const body = document.body;
        const bStyle = window.getComputedStyle(body);
        
        // Check offcanvas link height
        const link = document.querySelector('#kupasOffcanvasNav a.btn');
        const lStyle = link ? window.getComputedStyle(link) : null;

        // Elements wider than 360 or with right > 360
        const wide = [];
        document.querySelectorAll('body *').forEach(el => {
            if (el.scrollWidth > 360) {
                wide.push({
                    tag: el.tagName,
                    id: el.id,
                    cls: (typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                    scrollW: el.scrollWidth,
                    offsetW: el.offsetWidth,
                    clientW: el.clientWidth,
                    boxSizing: window.getComputedStyle(el).boxSizing,
                    paddingLeft: window.getComputedStyle(el).paddingLeft,
                    paddingRight: window.getComputedStyle(el).paddingRight,
                    marginLeft: window.getComputedStyle(el).marginLeft,
                    marginRight: window.getComputedStyle(el).marginRight
                });
            }
        });

        return {
            bodyScrollW: body.scrollWidth,
            bodyOffsetW: body.offsetWidth,
            bodyPaddingLeft: bStyle.paddingLeft,
            bodyPaddingRight: bStyle.paddingRight,
            bodyMargin: bStyle.margin,
            linkHeight: link ? link.getBoundingClientRect().height : null,
            linkMinHeight: lStyle ? lStyle.minHeight : null,
            wideElements: wide
        };
    })()
    """)
    print("bodyScrollW:", info["bodyScrollW"])
    print("bodyOffsetW:", info["bodyOffsetW"])
    print("bodyPaddingLeft:", info["bodyPaddingLeft"])
    print("bodyPaddingRight:", info["bodyPaddingRight"])
    print("linkHeight:", info["linkHeight"])
    print("linkMinHeight:", info["linkMinHeight"])
    print("Wide elements count:", len(info["wideElements"]))
    for w in info["wideElements"]:
        print(w)

finally:
    proc.terminate()

