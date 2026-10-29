import sys
import subprocess
import urllib.request
import json
import time
import os
import shutil
from simple_cdp import SimpleCDP

sys.stdout.reconfigure(encoding='utf-8')

tmp_profile = os.path.join(os.environ['TEMP'], 'chrome_test_profile_' + str(int(time.time())))
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

proc = subprocess.Popen([
    chrome_path,
    "--remote-debugging-port=9223",
    "--headless=new",
    "--no-first-run",
    "--no-default-browser-check",
    f"--user-data-dir={tmp_profile}"
])

try:
    time.sleep(1.5)
    # Get targets
    targets = json.loads(urllib.request.urlopen("http://localhost:9223/json").read().decode('utf-8'))
    page = next(t for t in targets if t.get("type") == "page")
    print("Connecting to page:", page["webSocketDebuggerUrl"])
    cdp = SimpleCDP(page["webSocketDebuggerUrl"])
    val = cdp.eval("1 + 1")
    print("CDP Eval 1 + 1 =", val)
    assert val == 2
    cdp.close()
    print("SimpleCDP works perfectly!")
finally:
    proc.terminate()
    proc.wait()
    shutil.rmtree(tmp_profile, ignore_errors=True)

