import sys
import subprocess
import urllib.request
import json
import time
import os
import shutil
import base64
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_shot_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
port = 9235
base_url = "http://localhost:8090"

proc = subprocess.Popen([
    chrome_path,
    f"--remote-debugging-port={port}",
    "--headless=new",
    "--window-size=1280,800",
    "--no-first-run",
    "--no-default-browser-check",
    f"--user-data-dir={tmp_profile}"
])

try:
    time.sleep(2)
    req = urllib.request.Request(f"http://localhost:{port}/json/new?{base_url}/guru/dasbor.html", method="PUT")
    res = urllib.request.urlopen(req)
    target = json.loads(res.read().decode('utf-8'))
    cdp = SimpleCDP(target["webSocketDebuggerUrl"])
    time.sleep(1.5)

    # Click tab pengaturan kuis
    cdp.eval("""
    (function() {
        const btn = document.getElementById('btn-tab-pengaturan-kuis');
        if (btn) btn.click();
    })()
    """)
    time.sleep(1.2)

    # Capture screenshot
    shot_res = cdp.send_cmd("Page.captureScreenshot", {"format": "png"})
    img_data = base64.b64decode(shot_res["result"]["data"])
    
    out_path = os.path.abspath("scratch/modal_after_fix.png")
    with open(out_path, "wb") as f:
        f.write(img_data)
    print("Screenshot saved successfully to:", out_path)

    # Also verify computed style of modal-content and modal-header
    styles = cdp.eval("""
    (function() {
        const modalContent = document.querySelector('#modalPengaturanGame .modal-content');
        const modalHeader = document.querySelector('#modalPengaturanGame .modal-header');
        const modalFooter = document.querySelector('#modalPengaturanGame .modal-footer');
        return {
            contentBg: window.getComputedStyle(modalContent).backgroundColor,
            headerBg: window.getComputedStyle(modalHeader).backgroundColor,
            footerBg: window.getComputedStyle(modalFooter).backgroundColor
        };
    })()
    """)
    print("Computed styles:", styles)

finally:
    proc.terminate()
    proc.wait()
    shutil.rmtree(tmp_profile, ignore_errors=True)

