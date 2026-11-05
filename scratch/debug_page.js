const http = require('http');
const { spawn } = require('child_process');

async function debugPage() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 1500));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const list = await httpGet('http://127.0.0.1:9225/json');
  const target = list.find(t => t.type === 'page') || list[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Console.messageAdded') {
      console.log('CONSOLE:', msg.params.message.text);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      console.log('EXCEPTION:', d.text, d.exception?.description, 'at', d.url, 'L' + d.lineNumber + ':C' + d.columnNumber);
    }
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
  await send('Console.enable');

  console.log('Navigating...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('Clicking Level 1-1...');
  const resClick = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('.btn-mainkan-level[data-level="1-1"]');
      if (!btn) return 'NO_BTN';
      btn.click();
      return 'CLICKED';
    })()`,
    returnByValue: true
  });
  console.log('Click result:', resClick.result?.value);
  await new Promise(r => setTimeout(r, 2000));

  const resEngine = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        hasEngine: !!window.__gameEngine,
        player: window.__gameEngine ? {
          x: window.__gameEngine.player.x,
          y: window.__gameEngine.player.y,
          vx: window.__gameEngine.player.vx,
          vy: window.__gameEngine.player.vy
        } : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Engine state:', resEngine.result?.value);

  ws.close();
  chrome.kill();
}
debugPage();
