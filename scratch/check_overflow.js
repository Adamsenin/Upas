const http = require('http');
const { spawn } = require('child_process');

async function checkOverflow() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9252',
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
    const list = await httpGet('http://127.0.0.1:9252/json');
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

    for (const w of [1366, 375]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: 768, deviceScaleFactor: 1, mobile: w <= 768 });
      await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
      await new Promise(r => setTimeout(r, 1200));

      const overflowElements = await evaluate(`
        (() => {
          const docW = document.documentElement.clientWidth;
          const offenders = [];
          document.querySelectorAll('*').forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.right > docW + 1) {
              offenders.push({
                tag: el.tagName,
                id: el.id,
                className: el.className,
                rectRight: rect.right,
                rectWidth: rect.width,
                diff: rect.right - docW
              });
            }
          });
          return offenders.slice(0, 10);
        })()
      `);
      console.log('Overflow at width ' + w + ':', overflowElements);
    }

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

checkOverflow();
