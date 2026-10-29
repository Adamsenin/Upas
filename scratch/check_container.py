import sys, os, time, json, urllib.request, subprocess

sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9286
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
        const m = document.querySelector('main');
        const s = window.getComputedStyle(m);
        // Find which rules set padding on main
        const rules = [];
        for (let sheet of document.styleSheets) {
            try {
                for (let r of sheet.cssRules) {
                    if (r.selectorText && m.matches(r.selectorText)) {
                        if (r.style.padding || r.style.paddingLeft) {
                            rules.push({sel: r.selectorText, cssText: r.cssText});
                        }
                    }
                }
            } catch(e) {}
        }
        return {
            paddingLeft: s.paddingLeft,
            paddingRight: s.paddingRight,
            rules: rules
        };
    })()
    """)
    print("info:", info)
finally:
    proc.terminate()

