const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('=== PENGUJIAN MENYELURUH BUG LEVEL 1-1 & 1-2 DI BROWSER NYATA ===');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9222',
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

  const list = await httpGet('http://127.0.0.1:9222/json');
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

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1200));

  // TEST 1: Bypass Gerbang 1 via Jumping over it
  console.log('\n--- UJI 1: BYPASS GERBANG DENGAN MELOMPAT ---');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Berjalan ke x: 800 lalu melompat
  console.log('Jalan ke depan gerbang...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 4500));
  console.log('Melompat melompati gerbang 1...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 400));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 1000));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });

  // TEST 2: Blok '?' Sundulan vs Tombol E
  console.log('\n--- UJI 2: INTERAKSI BLOK ? ---');
  // Cek apakah ada blok '?' di dekat pemain
  const blockCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      // Periksa apakah prompt [E] muncul untuk blok '?'
      return {
        // ...
      };
    })()`,
    returnByValue: true
  });

  // TEST 3: Jembatan Ranting di Level 1-1
  console.log('\n--- UJI 3: PEMBENTUKAN JEMBATAN SETELAH JAWAB BENAR ---');
  // Jawab soal gerbang 1 jika dialog terbuka atau buka dialog
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 500));

  const dialogOpen = await send('Runtime.evaluate', {
    expression: `document.getElementById('dialog-tantangan-overlay')?.classList.contains('aktif')`,
    returnByValue: true
  });
  console.log('Apakah dialog tantangan terbuka?', dialogOpen.result?.value);

  // TEST 4: Verifikasi Level 1-2
  console.log('\n--- UJI 4: LEVEL 1-2 GERBANG & FINIS ---');
  // Klik kembali ke peta lalu buka Level 1-2
  await send('Runtime.evaluate', {
    expression: `
      document.getElementById('btn-kembali-pilih-level')?.click();
    `
  });
  await new Promise(r => setTimeout(r, 1000));

  // Paksa buka level 1-2 untuk pengujian
  await send('Runtime.evaluate', {
    expression: `
      const p = JSON.parse(localStorage.getItem('kupas_adventure_progress_v2') || '{}');
      if (!p.levels) p.levels = {};
      p.levels['1-2'] = { unlocked: true, completed: false, stars: 0, coins: 0, score: 0 };
      localStorage.setItem('kupas_adventure_progress_v2', JSON.stringify(p));
      location.reload();
    `
  });
  await new Promise(r => setTimeout(r, 1500));

  // Klik Level 1-2
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-2"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Cek gerbang di Level 1-2
  const lvl2Check = await send('Runtime.evaluate', {
    expression: `(() => {
      const badge = document.getElementById('hud-level-badge')?.textContent;
      const misi = document.getElementById('hud-misi-teks')?.textContent;
      return { badge, misi };
    })()`,
    returnByValue: true
  });
  console.log('Level 1-2 Aktif:', lvl2Check.result?.value);

  const ssLvl2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937\\debug_level1_2.png', Buffer.from(ssLvl2.data, 'base64'));
  console.log('📸 Screenshot Level 1-2 diambil: debug_level1_2.png');

  ws.close();
  chrome.kill();
  console.log('=== PENGUJIAN SELESAI ===');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

