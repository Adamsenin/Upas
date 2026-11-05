const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('=== MEMULAI REPRODUKSI BUG ADVENTURE DI BROWSER NYATA ===');

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

  // Set desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  console.log('Navigasi ke http://localhost:8000/adventure.html ...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1500));

  // Klik Mainkan Level 1-1
  console.log('Memulai Level 1-1...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // TEST BUG 1 & 2: Berjalan mendekati Blok '?' dan Gerbang 1, lalu tekan E / tombol AKSI
  console.log('\n--- UJI BUG 2: INTERAKSI TOMBOL E & TOMBOL AKSI ---');
  const evalEngine = async (expr) => {
    const res = await send('Runtime.evaluate', {
      expression: `(() => {
        const engine = window.__gameEngine;
        ${expr}
      })()`,
      returnByValue: true
    });
    return res.result ? res.result.value : null;
  };

  // Cek apakah window.__gameEngine terekspos
  let engineCheck = await send('Runtime.evaluate', {
    expression: `Boolean(window.__gameEngine)`
  });
  console.log('window.__gameEngine terekspos:', engineCheck.result?.value);

  // Jika belum diekspos di window, cari variabel gameEngine di modul
  const stateCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const hud = document.getElementById('hud-level-badge');
      const canvas = document.getElementById('canvas-adventure');
      return {
        levelText: hud?.textContent,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height
      };
    })()`,
    returnByValue: true
  });
  console.log('Status Layar Permainan:', stateCheck.result?.value);

  // Jalankan simulasi gerak pemain ke kanan mendekati Gerbang 1 (x: 840)
  // Tekan tombol 'd' (gerak kanan)
  console.log('Mensimulasikan pemain berjalan ke kanan ke arah Gerbang 1 (x: 840)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 3200)); // Jalan ~3 detik
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });

  // Ambil screenshot posisi pemain dekat Gerbang 1
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  const p1Path = path.join('C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937', 'debug_near_gate1.png');
  fs.writeFileSync(p1Path, Buffer.from(ss1.data, 'base64'));
  console.log('📸 Screenshot diambil: debug_near_gate1.png');

  // Tekan tombol E
  console.log('Menekan tombol E via keydown...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 500));

  // Cek apakah modal dialog tantangan aktif
  let dialogStatus = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.getElementById('dialog-tantangan-overlay');
      return {
        overlayAktif: overlay?.classList.contains('aktif'),
        display: overlay?.style.display,
        judul: document.getElementById('dialog-judul')?.textContent,
        soal: document.getElementById('dialog-soal-teks')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Status Dialog Tantangan setelah tekan E:', dialogStatus.result?.value);

  // Sekarang coba klik tombol AKSI di layar (#btn-sentuh-aksi)
  console.log('Mencoba klik tombol AKSI (#btn-sentuh-aksi)...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-sentuh-aksi');
      btn?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      btn?.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  dialogStatus = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.getElementById('dialog-tantangan-overlay');
      return {
        overlayAktif: overlay?.classList.contains('aktif'),
        soal: document.getElementById('dialog-soal-teks')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Status Dialog Tantangan setelah klik #btn-sentuh-aksi:', dialogStatus.result?.value);

  // TEST BUG 3: Apakah gerbang soal bisa dilewati tanpa menjawab?
  console.log('\n--- UJI BUG 3: APAKAH GERBANG BISA DILEWATI TANPA MENJAWAB? ---');
  // Tutup dialog jika terbuka
  await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.getElementById('dialog-tantangan-overlay');
      overlay?.classList.remove('aktif');
    })()`
  });

  // Coba jalan melintasi Gerbang 1 (terus berjalan ke kanan selama 3 detik)
  console.log('Pemain mencoba terus berjalan ke kanan menembus Gerbang 1...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 2000));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });

  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  const p2Path = path.join('C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937', 'debug_pass_gate1.png');
  fs.writeFileSync(p2Path, Buffer.from(ss2.data, 'base64'));
  console.log('📸 Screenshot diambil: debug_pass_gate1.png');

  // Cek posisi pemain dan status gerbang 1
  const gateBypassCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      // Ambil objek dari adventure.html jika ada
      return {
        misiTeks: document.getElementById('hud-misi-teks')?.textContent,
        nyawa: document.getElementById('hud-nyawa-teks')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('Status setelah mencoba menembus gerbang:', gateBypassCheck.result?.value);

  ws.close();
  chrome.kill();
  console.log('=== SELESAI INVESTIGASI AWAL ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

