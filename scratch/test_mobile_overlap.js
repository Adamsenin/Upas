const http = require('http');
const { spawn } = require('child_process');

async function testMobileOverlap() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  try {
    const list = await httpGet('http://127.0.0.1:9255/json');
    const target = list.find(t => t.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    const send = (method, params = {}) => new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

    await new Promise(r => ws.onopen = r);
    await send('Page.enable');
    await send('Runtime.enable');

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    };

    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1200));

    const check = await evaluate(`
      (() => {
        const pins = [1, 2, 3, 4, 5, 6].map(no => {
          const el = document.getElementById('pin-' + no);
          return { no, r: el.getBoundingClientRect() };
        });

        const maskot = document.getElementById('maskot-peta');
        const mr = maskot.getBoundingClientRect();
        const balon = document.getElementById('balon-sapa-maskot');
        const br = balon ? balon.getBoundingClientRect() : null;

        const overlaps = [];
        pins.forEach(p => {
          const xOverlap = Math.max(0, Math.min(mr.right, p.r.right) - Math.max(mr.left, p.r.left));
          const yOverlap = Math.max(0, Math.min(mr.bottom, p.r.bottom) - Math.max(mr.top, p.r.top));
          if (xOverlap * yOverlap > 0) {
            overlaps.push({ target: 'maskot-peta', pin: p.no, area: xOverlap * yOverlap });
          }
        });

        return {
          maskotRect: mr,
          balonRect: br,
          pinRects: pins,
          overlaps
        };
      })()
    `);

    console.log('Mobile Check:', JSON.stringify(check, null, 2));

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

testMobileOverlap();

