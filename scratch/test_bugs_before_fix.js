const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function main() {
  console.log('=== PENGUJIAN KODE SEBELUM PERBAIKAN (PEMBUKTIAN BUG) ===');

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

  console.log('\nNavigasi ke http://localhost:8000/adventure.html ...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1500));

  // Mulai Level 1-1
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // -------------------------------------------------------------
  // TEST BUG 1: Kotak '?' tidak bisa dibuka dengan AKSI / E saat didekati
  // -------------------------------------------------------------
  console.log('\n[TEST 1 - SEBELUM] Berjalan ke dekat Kotak ? pertama (x: 340) dan tekan E & tombol AKSI...');
  // Jalan ke x: 300
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 1400));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  // Tangkap screenshot sebelum tekan E di dekat kotak
  const ssBoxBefore = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sebelum_kotak_interaksi.png'), Buffer.from(ssBoxBefore.data, 'base64'));

  // Tekan tombol E
  console.log('Menekan tombol E di samping kotak ?...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 300));

  // Coba juga klik tombol AKSI di layar (#btn-sentuh-aksi)
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-sentuh-aksi')?.click()`
  });
  await new Promise(r => setTimeout(r, 300));

  const boxState = await send('Runtime.evaluate', {
    expression: `(() => {
      const koin = document.getElementById('hud-koin-jumlah')?.textContent;
      const overlayAktif = document.getElementById('dialog-tantangan-overlay')?.classList.contains('aktif');
      return { koin, overlayAktif };
    })()`,
    returnByValue: true
  });
  console.log('HASIL TEST 1 (KOTAK): Koin bertambah?', boxState.result?.value?.koin, '(Koin tetap 0/tidak ada respon = BUG TERBUKTI)');

  // -------------------------------------------------------------
  // TEST BUG 2: Melompati / Menembus Gerbang Soal Terkunci
  // -------------------------------------------------------------
  console.log('\n[TEST 2 - SEBELUM] Mencoba menembus / melompati Gerbang 1 terkunci (x: 840)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 3200));
  // Lompat saat di depan gerbang
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 300));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 1200));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  const ssGateBefore = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sebelum_gerbang_bypass.png'), Buffer.from(ssGateBefore.data, 'base64'));

  const gateBypassState = await send('Runtime.evaluate', {
    expression: `(() => {
      const misi = document.getElementById('hud-misi-teks')?.textContent;
      return { misi };
    })()`,
    returnByValue: true
  });
  console.log('HASIL TEST 2 (GERBANG BYPASS): Pemain melewati gerbang dengan status:', gateBypassState.result?.value?.misi, '(Bisa dilewati tanpa jawab = BUG TERBUKTI)');

  // -------------------------------------------------------------
  // TEST BUG 3: Jembatan Tidak Terbentuk Setelah Jawaban Benar (Tetap Kotak Merah !)
  // -------------------------------------------------------------
  console.log('\n[TEST 3 - SEBELUM] Menjawab soal Gerbang 1 dengan benar...');
  // Buka dialog jika di dekat gerbang
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 500));

  // Pilih jawaban 1
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = document.querySelectorAll('.btn-opsi-adventure');
      btns[0]?.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Tutup dialog
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-tutup-tantangan-berhasil')?.click()`
  });
  await new Promise(r => setTimeout(r, 800));

  const ssBridgeBefore = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sebelum_jembatan_merah.png'), Buffer.from(ssBridgeBefore.data, 'base64'));
  console.log('📸 Tangkapan layar bukti jembatan disimpan: bukti_sebelum_jembatan_merah.png');

  ws.close();
  chrome.kill();
  console.log('\n=== PENGUJIAN SEBELUM SELESAI ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

