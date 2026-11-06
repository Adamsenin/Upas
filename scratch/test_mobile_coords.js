const http = require('http');
const { spawn } = require('child_process');

async function testMobileCoordinates() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9256',
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
    const list = await httpGet('http://127.0.0.1:9256/json');
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

    // Coba posisi maskot alternatif pada mobile:
    // Contoh: left: 14%, top: 88%, balon di sebelah kanan maskot atau sembunyikan balon pada mobile
    const result = await evaluate(`
      (() => {
        const maskot = document.getElementById('maskot-peta');
        const balon = document.getElementById('balon-sapa-maskot');
        
        // Simulasikan styling mobile
        maskot.style.left = '12%';
        maskot.style.top = '86%';
        balon.style.display = 'none'; // Pada mobile, balon sapa maskot tidak melayang menutupi peta

        const pins = [1, 2, 3, 4, 5, 6].map(no => {
          const el = document.getElementById('pin-' + no);
          const r = el.getBoundingClientRect();
          return { no, r: { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height } };
        });

        const mr = maskot.getBoundingClientRect();
        const mRect = { top: mr.top, left: mr.left, right: mr.right, bottom: mr.bottom, width: mr.width, height: mr.height };

        const overlaps = [];
        pins.forEach(p => {
          const xOverlap = Math.max(0, Math.min(mRect.right, p.r.right) - Math.max(mRect.left, p.r.left));
          const yOverlap = Math.max(0, Math.min(mRect.bottom, p.r.bottom) - Math.max(mRect.top, p.r.top));
          const area = xOverlap * yOverlap;
          if (area > 0) overlaps.push({ pin: p.no, area });
        });

        return {
          mRect,
          pin1: pins[0],
          overlaps,
          totalOverlap: overlaps.reduce((a, b) => a + b.area, 0)
        };
      })()
    `);

    console.log('Test Alternative:', JSON.stringify(result, null, 2));

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

testMobileCoordinates();

