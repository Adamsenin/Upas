with open('scratch/test_acak_jawaban.py', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace CDPClient with SimpleCDP
old_cdp = """class CDPClient:
    def __init__(self, port=9222):
        self.port = port
        self.session_id = None
        self.msg_id = 0

    def connect(self, target_id):
        url = f"http://127.0.0.1:{self.port}/json"
        req = urllib.request.urlopen(url)
        tabs = json.loads(req.read().decode())
        ws_url = None
        for t in tabs:
            if t['id'] == target_id:
                ws_url = t.get('webSocketDebuggerUrl')
                break
        if not ws_url:
            raise Exception("Tab not found: " + target_id)
        import websocket
        self.ws = websocket.create_connection(ws_url, timeout=10)

    def eval(self, expr):
        self.msg_id += 1
        req = {
            "id": self.msg_id,
            "method": "Runtime.evaluate",
            "params": {"expression": expr, "returnByValue": True, "awaitPromise": True}
        }
        self.ws.send(json.dumps(req))
        res = json.loads(self.ws.recv())
        if 'error' in res:
            raise Exception(res['error'])
        result = res.get('result', {}).get('result', {})
        if 'exceptionDetails' in res.get('result', {}):
            raise Exception("JS Error: " + str(res['result']['exceptionDetails']))
        return result.get('value')

    def close(self):
        try:
            self.ws.close()
        except:
            pass

def create_tab(url, port=9222):
    req = urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{url}", method="PUT"))
    data = json.loads(req.read().decode())
    return data['id']

def close_tab(tab_id, port=9222):
    try:
        urllib.request.urlopen(f"http://127.0.0.1:{port}/json/close/{tab_id}")
    except:
        pass"""

new_cdp = """import os
sys.path.append(os.path.abspath('scratch'))
from simple_cdp import SimpleCDP

def create_tab(url, port=9222):
    req = urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{url}", method="PUT")
    data = json.loads(urllib.request.urlopen(req).read().decode())
    cdp = SimpleCDP(data["webSocketDebuggerUrl"])
    time.sleep(1.0)
    return cdp, data['id']

def close_tab(tab_id, port=9222):
    try:
        req = urllib.request.Request(f"http://127.0.0.1:{port}/json/close/{tab_id}", method="PUT")
        urllib.request.urlopen(req)
    except:
        pass"""

c = c.replace(old_cdp, new_cdp)

# Also update the page connection calls
c = c.replace("""    id_guru = create_tab(f"http://localhost:8090/guru/sesi.html?mode=baru&topik=ekosistem", port=port)
    page_guru = CDPClient(port=port)
    page_guru.connect(id_guru)""", """    page_guru, id_guru = create_tab(f"http://localhost:8090/guru/sesi.html?mode=baru&topik=ekosistem", port=port)""")

c = c.replace("""    id_s1 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)
    page_s1 = CDPClient(port=port)
    page_s1.connect(id_s1)

    id_s2 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)
    page_s2 = CDPClient(port=port)
    page_s2.connect(id_s2)""", """    page_s1, id_s1 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)
    page_s2, id_s2 = create_tab(f"http://localhost:8090/siswa/main.html?kode={kode_sesi}", port=port)""")

c = c.replace("""    id_fo = create_tab(f"http://localhost:8090/fakta-opini.html", port=port)
    page_fo = CDPClient(port=port)
    page_fo.connect(id_fo)""", """    page_fo, id_fo = create_tab(f"http://localhost:8090/fakta-opini.html", port=port)""")

c = c.replace("""    id_duel = create_tab(f"http://localhost:8090/duel-tim.html", port=port)
    page_duel = CDPClient(port=port)
    page_duel.connect(id_duel)""", """    page_duel, id_duel = create_tab(f"http://localhost:8090/duel-tim.html", port=port)""")

with open('scratch/test_acak_jawaban.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("PATCHED_SIMPLE_CDP")

