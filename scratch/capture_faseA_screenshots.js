const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function main() {
  console.log('Menjalankan Chrome CDP untuk mengambil tangkapan layar verifikasi Fase A...');

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

  // 1. PETA DUNIA PETUALANGAN (Desktop 1366x768)
  console.log('\nNavigasi ke http://localhost:8000/adventure.html ...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1500));

  await capture('adventure_faseA_peta_dunia_1366x768.png', 1366, 768, 1, false);

  // 2. Modal Rangkuman Materi Dunia 1
  console.log('Membuka modal Rangkuman Materi Dunia 1...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-materi-dunia-1')?.click()`
  });
  await new Promise(r => setTimeout(r, 600));
  await capture('adventure_faseA_modal_materi_1366x768.png', 1366, 768, 1, false);

  // Tutup modal rangkuman
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-tutup-ringkasan')?.click()`
  });
  await new Promise(r => setTimeout(r, 400));

  // 3. Masuk ke Level 1-1
  console.log('Klik tombol Mainkan Level 1-1...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 2000));

  // A. Desktop In-Game 1366x768
  await capture('adventure_faseA_ingame_1366x768.png', 1366, 768, 1, false);

  // B. Smartboard 1080p (1920x1080)
  await capture('adventure_faseA_ingame_1920x1080.png', 1920, 1080, 1.25, false);

  // C. Tablet Portrait (768x1024)
  await capture('adventure_faseA_tablet_768x1024.png', 768, 1024, 1.5, false);

  // D. Mobile Landscape (667x375) - Kontrol sentuh 56px & HUD
  await capture('adventure_faseA_mobile_landscape_667x375.png', 667, 375, 2, true);

  // E. Mobile Portrait (375x667) - Overlay putar orientasi ramah anak
  await capture('adventure_faseA_mobile_portrait_375x667.png', 375, 667, 2, true);

  console.log('\n✅ Seluruh tangkapan layar verifikasi Fase A berhasil diambil!');

  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(err => {
  console.error('Error saat capture screenshots:', err);
  process.exit(1);
});

