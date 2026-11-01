import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9285
tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_' + str(int(time.time())))
proc = subprocess.Popen([chrome_path, f"--remote-debugging-port={port}", "--headless=new", "--no-first-run", f"--user-data-dir={tmp_profile}"])
time.sleep(1.8)

try:
    req = urllib.request.Request(f"http://localhost:{port}/json/new?http://localhost:8090/index.html", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(0.8)

    info = cdp.eval("""
    (() => {
        const root = document.documentElement;
        const link = document.querySelector('#kupasOffcanvasNav a.btn');
        return {
            varTouch: window.getComputedStyle(root).getPropertyValue('--kupas-touch-min'),
            linkMinH: window.getComputedStyle(link).minHeight,
            linkInlineStyle: link.style.cssText
        };
    })()
    """)
    print("info:", info)
finally:
    proc.terminate()

