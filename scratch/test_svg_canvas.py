import urllib.request
import json
import websocket
import time
import base64

def run_test():
    ws_url = None
    with urllib.request.urlopen("http://localhost:9222/json") as resp:
        pages = json.loads(resp.read().decode())
        for p in pages:
            if p.get('type') == 'page':
                ws_url = p.get('webSocketDebuggerUrl')
                break

    if not ws_url:
        print("No debug page found")
        return

    ws = websocket.create_connection(ws_url)
    msg_id = 1

    def send(method, params=None):
        nonlocal msg_id
        msg_id += 1
        ws.send(json.dumps({'id': msg_id, 'method': method, 'params': params or {}}))
        while True:
            res = json.loads(ws.recv())
            if res.get('id') == msg_id:
                return res

    # Test SVG -> Canvas export
    eval_code = """
    (() => {
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="1188" height="840" viewBox="0 0 1188 840">
            <rect width="100%" height="100%" fill="#FFFDF7"/>
            <rect x="20" y="20" width="1148" height="800" fill="none" stroke="#0F3D2E" stroke-width="4"/>
            <rect x="30" y="30" width="1128" height="780" fill="none" stroke="#D97706" stroke-width="2"/>
            <text x="594" y="100" font-family="Georgia, serif" font-size="32" font-weight="bold" fill="#0F3D2E" text-anchor="middle">SERTIFIKAT PENCAPAIAN</text>
        </svg>`;

        return new Promise((resolve, reject) => {
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 1188;
                canvas.height = 840;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                URL.revokeObjectURL(url);
                resolve({
                    success: true,
                    dataUrlLen: canvas.toDataURL('image/png').length
                });
            };
            img.onerror = (err) => resolve({ success: false, err: String(err) });
            img.src = url;
        });
    })()
    """

    res = send('Runtime.evaluate', {'expression': eval_code, 'awaitPromise': True, 'returnByValue': True})
    print("Test result:", json.dumps(res.get('result', {}).get('value', {})))
    ws.close()

if __name__ == '__main__':
    run_test()

