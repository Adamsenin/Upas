const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function main() {
  console.log('Menjalankan Chrome CDP untuk mengambil tangkapan layar verifikasi...');

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
  await send('DOM.enable');

  const capture = async (filename, width, height, dpr = 1, isMobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: dpr,
      mobile: isMobile
    });
    await new Promise(r => setTimeout(r, 800));
    const { data } = await send('Page.captureScreenshot', { format: 'png' });
    const fullPath = path.join(artifactDir, filename);
    fs.writeFileSync(fullPath, Buffer.from(data, 'base64'));
    console.log(`📸 Tangkapan layar tersimpan: ${filename} (${width}x${height}, size: ${fs.statSync(fullPath).size} bytes)`);
  };

  // 1. Level Selection Screen (Desktop 1366x768)
  console.log('\nNavigasi ke http://localhost:8000/adventure.html ...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1200));

  await capture('adventure_tahap3_pilih_level_1366x768.png', 1366, 768, 1, false);

  // 2. Klik "Mulai Petualangan" -> Masuk ke In-Game Canvas
  console.log('Mengklik tombol Mulai Petualangan...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-main-level-1')?.click()`
  });
  await new Promise(r => setTimeout(r, 2000));

  await capture('adventure_tahap3_ingame_1366x768.png', 1366, 768, 1, false);

  // 3. Smartboard 1080p
  await capture('adventure_tahap3_ingame_1920x1080.png', 1920, 1080, 1.25, false);

  // 4. Mobile Landscape (667x375) - Tampilkan Kontrol Sentuh 56px+ & Safe-Area
  await capture('adventure_tahap3_mobile_landscape_667x375.png', 667, 375, 2, true);

  // 5. Mobile Portrait (375x667) - Tampilkan Overlay Ajakan Putar Layar
  await capture('adventure_tahap3_mobile_portrait_375x667.png', 375, 667, 2, true);

  console.log('\n✅ Seluruh 5 tangkapan layar verifikasi berhasil disimpan di folder artifacts!');

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error saat mengambil tangkapan layar:', err);
  process.exit(1);
});

