import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9271
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

    info = cdp.eval("""
    (() => {
        const w = window.innerWidth;
        const res = [];
        document.querySelectorAll('*').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.right > w + 1 || el.scrollWidth > w + 1 || el.offsetWidth > w + 1) {
                res.push({
                    tag: el.tagName,
                    id: el.id,
                    className: (el.className && typeof el.className === 'string') ? el.className : '',
                    scrollW: el.scrollWidth,
                    offsetW: el.offsetWidth,
                    right: Math.round(r.right),
                    left: Math.round(r.left),
                    parentTag: el.parentElement ? el.parentElement.tagName : '',
                    parentId: el.parentElement ? el.parentElement.id : '',
                    parentClass: el.parentElement ? (el.parentElement.className || '') : ''
                });
            }
        });
        return {
            windowW: w,
            docScrollW: document.documentElement.scrollWidth,
            bodyScrollW: document.body.scrollWidth,
            elements: res
        };
    })()
    """)
    print("Window W:", info["windowW"])
    print("Doc Scroll W:", info["docScrollW"])
    print("Body Scroll W:", info["bodyScrollW"])
    print("Overflowing elements count:", len(info["elements"]))
    for el in info["elements"]:
        print(f"[{el['tag']}] #{el['id']} .{el['className']} -> scrollW={el['scrollW']}, offsetW={el['offsetW']}, right={el['right']}, left={el['left']} (Parent: {el['parentTag']} #{el['parentId']} .{el['parentClass']})")

finally:
    proc.terminate()

