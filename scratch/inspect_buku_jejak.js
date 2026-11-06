const http = require('http');
const { spawn } = require('child_process');

async function inspectBukuJejak() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9253',
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
    const list = await httpGet('http://127.0.0.1:9253/json');
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

    await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1200));

    const breakdown = await evaluate(`
      (() => {
        const bj = document.querySelector('.buku-jejak');
        if (!bj) return 'No .buku-jejak';
        const children = Array.from(bj.querySelectorAll('*')).map(el => {
          const r = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            cls: el.className,
            h: r.height,
            w: r.width,
            top: r.top,
            display: window.getComputedStyle(el).display,
            flexDir: window.getComputedStyle(el).flexDirection
          };
        });
        return {
          bjHeight: bj.getBoundingClientRect().height,
          bjTop: bj.getBoundingClientRect().top,
          children: children.filter(c => c.h > 15)
        };
      })()
    `);
    console.log('Breakdown:', JSON.stringify(breakdown, null, 2));

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

inspectBukuJejak();

