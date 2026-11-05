const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function main() {
  console.log('=== TEST DETAIL GERBANG 1 & INTERAKSI E ===');

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

  // Ekspos gameEngine ke window agar kita bisa inspect internal state secara akurat
  await send('Runtime.evaluate', {
    expression: `
      // Modifikasi sedikit agar kita bisa membaca engine instance
      const origMul = window.AdventureGameEngine;
    `
  });

  // Start Level 1-1
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // Pindahkan pemain langsung ke posisi dekat Gerbang 1 (x: 800) untuk menguji interaksi
  // Tapi tunggu, pemain bergerak dengan tombol 'd' selama 4.5 detik
  console.log('Berjalan 4.5 detik ke depan Gerbang 1...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 4500));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  // Cek posisi pemain dan badge [E]
  const gateInfo = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.getElementById('dialog-tantangan-overlay');
      return {
        overlayExists: Boolean(overlay),
        overlayClasses: overlay?.className,
        overlayStyles: overlay?.style.cssText
      };
    })()`,
    returnByValue: true
  });
  console.log('Pemeriksaan elemen dialog overlay:', gateInfo.result?.value);

  // Tekan 'E'
  console.log('Menekan E...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 400));

  let resDialog = await send('Runtime.evaluate', {
    expression: `(() => {
      const overlay = document.getElementById('dialog-tantangan-overlay');
      return {
        aktif: overlay?.classList.contains('aktif'),
        soal: document.getElementById('dialog-soal-teks')?.textContent,
        opsiCount: document.getElementById('dialog-grid-opsi')?.children.length
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil setelah menekan E:', resDialog.result?.value);

  // Coba klik tombol sentuh AKSI (#btn-sentuh-aksi) jika belum aktif
  if (!resDialog.result?.value?.aktif) {
    console.log('Mencoba klik tombol #btn-sentuh-aksi via click & dispatchEvent...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-sentuh-aksi');
        btn?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 400));
    resDialog = await send('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('dialog-tantangan-overlay');
        return {
          aktif: overlay?.classList.contains('aktif'),
          soal: document.getElementById('dialog-soal-teks')?.textContent
        };
      })()`,
      returnByValue: true
    });
    console.log('Hasil setelah klik tombol AKSI:', resDialog.result?.value);
  }

  // Jika dialog aktif, coba jawab soalnya!
  if (resDialog.result?.value?.aktif) {
    console.log('Dialog aktif! Memilih jawaban benar (tombol 1)...');
    await send('Runtime.evaluate', {
      expression: `(() => {
        const btns = document.querySelectorAll('.btn-opsi-adventure');
        btns[0]?.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));

    // Klik tombol Lanjutkan Petualangan
    console.log('Mengklik #btn-tutup-tantangan-berhasil...');
    await send('Runtime.evaluate', {
      expression: `document.getElementById('btn-tutup-tantangan-berhasil')?.click()`
    });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot setelah jembatan terbentuk
    const ssAfter = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937\\debug_after_answer.png', Buffer.from(ssAfter.data, 'base64'));
    console.log('📸 Screenshot diambil: debug_after_answer.png');

    // Coba berjalan menyeberangi jembatan!
    console.log('Pemain mencoba berjalan menyeberangi jembatan ke kanan...');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
    await new Promise(r => setTimeout(r, 2000));
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
    await new Promise(r => setTimeout(r, 500));

    const ssCross = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937\\debug_cross_bridge.png', Buffer.from(ssCross.data, 'base64'));
    console.log('📸 Screenshot diambil: debug_cross_bridge.png');
  }

  // Uji apakah pemain bisa melompati gerbang tanpa menjawab
  // Pindah ke Level 1-2
  console.log('\n--- UJI LEVEL 1-2 ---');
  // ...
  ws.close();
  chrome.kill();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

