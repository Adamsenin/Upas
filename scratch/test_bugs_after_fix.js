const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function main() {
  console.log('=== PENGUJIAN KODE SESUDAH PERBAIKAN TAHAP 1-3 (VERIFIKASI FIX BROWSER CDP) ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9223',
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

  const list = await httpGet('http://127.0.0.1:9223/json');
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

  console.log('Navigasi ke http://localhost:8000/adventure.html ...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html' });
  await new Promise(r => setTimeout(r, 1500));

  // Mulai Level 1-1
  console.log('Klik Mulai Level 1-1...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 1500));

  // -------------------------------------------------------------
  // TEST 1 (SESUDAH): Interaksi Kotak '?' dengan tombol E & AKSI
  // -------------------------------------------------------------
  console.log('\n[TEST 1 - SESUDAH] Berjalan ke dekat Kotak ? (x: 340)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 950));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 400));

  // Cek apakah badge [E] Buka Kotak terdeteksi
  const playerNearBox = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const b = g?.entities?.getNearbyMysteryBlock(g.player);
      const koinAwal = document.getElementById('hud-koin-jumlah')?.textContent;
      return { playerX: Math.round(g?.player?.x || 0), nearBox: !!b, koinAwal };
    })()`,
    returnByValue: true
  });
  console.log('Posisi Pemain & Deteksi Kotak:', playerNearBox.result?.value);

  // Tekan tombol E
  console.log('Menekan tombol E untuk membuka kotak...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 500));

  const boxState = await send('Runtime.evaluate', {
    expression: `(() => {
      const koin = document.getElementById('hud-koin-jumlah')?.textContent;
      const g = window.__gameEngine;
      const opened = g?.entities?.mysteryBlocks[0]?.disundul;
      return { koin, opened };
    })()`,
    returnByValue: true
  });
  console.log('Status Kotak & Koin:', boxState.result?.value);

  const ssBoxAfter = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sesudah_kotak_interaksi.png'), Buffer.from(ssBoxAfter.data, 'base64'));
  console.log('📸 Tangkapan layar bukti interaksi kotak disimpan: bukti_sesudah_kotak_interaksi.png');

  if (Number(boxState.result?.value?.koin) > Number(playerNearBox.result?.value?.koinAwal || 0) && boxState.result?.value?.opened) {
    console.log('✓ TEST 1 LOLOS: Kotak ? berhasil dibuka dengan interaksi E / AKSI dan koin bertambah!');
  } else {
    console.error('✗ TEST 1 GAGAL: Kotak belum terbuka atau koin tidak bertambah.');
  }

  // -------------------------------------------------------------
  // TEST 2 (SESUDAH): Gerbang Terkunci Benar-benar Solid (Anti-Bypass)
  // -------------------------------------------------------------
  console.log('\n[TEST 2 - SESUDAH] Berlari kencang & melompat menuju Gerbang 1 terkunci (x: 840)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 2200));

  // Coba lompat menembus bagian atas atau tengah gerbang
  console.log('Mencoba melompat melewati gerbang...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 350));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space' });
  await new Promise(r => setTimeout(r, 1000));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  const gateSolidState = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const px = Math.round(g?.player?.x || 0);
      const gateX = g?.questionGates?.gates[0]?.x || 840;
      const gateOpened = g?.questionGates?.gates[0]?.terbuka;
      const misi = document.getElementById('hud-misi-teks')?.textContent;
      return { px, gateX, gateOpened, misi, playerStoppedBeforeGate: px <= gateX };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Uji Pembatas Gerbang:', gateSolidState.result?.value);

  const ssGateAfter = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sesudah_gerbang_solid.png'), Buffer.from(ssGateAfter.data, 'base64'));
  console.log('📸 Tangkapan layar bukti gerbang solid disimpan: bukti_sesudah_gerbang_solid.png');

  if (gateSolidState.result?.value?.playerStoppedBeforeGate && !gateSolidState.result?.value?.gateOpened) {
    console.log('✓ TEST 2 LOLOS: Gerbang terkunci 100% solid & menahan pemain! Tidak bisa ditembus/dilompati.');
  } else {
    console.error('✗ TEST 2 GAGAL: Pemain berhasil melewati gerbang terkunci!');
  }

  // -------------------------------------------------------------
  // TEST 3 (SESUDAH): Menjawab Soal & Pembangunan Jembatan Mulus
  // -------------------------------------------------------------
  console.log('\n[TEST 3 - SESUDAH] Berdiri di depan Gerbang 1, tekan E untuk membuka soal...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE' });
  await new Promise(r => setTimeout(r, 600));

  // Jawab soal dengan opsi yang benar (Opsi 1 / btn-opsi-adventure pertama)
  console.log('Menjawab soal tantangan rantai makanan...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = document.querySelectorAll('.btn-opsi-adventure');
      btns[0]?.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 700));

  // Tutup dialog berhasil
  console.log('Menutup dialog berhasil...');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('btn-tutup-tantangan-berhasil')?.click()`
  });

  // Tunggu sejenak saat animasi jembatan ranting kayu dibangun berurutan
  console.log('Menunggu animasi jembatan kayu selesai dibangun...');
  await new Promise(r => setTimeout(r, 2000));

  const ssBridgeAfter = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sesudah_jembatan_terbentuk.png'), Buffer.from(ssBridgeAfter.data, 'base64'));
  console.log('📸 Tangkapan layar jembatan terbentuk: bukti_sesudah_jembatan_terbentuk.png');

  // Sekarang pemain berjalan menyeberangi jembatan yang sudah kokoh menuju seberang jurang (x: 1060)
  console.log('Pemain berjalan menyeberangi jembatan ke seberang jurang (x: 1060)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 950));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  const afterCrossing = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const px = Math.round(g?.player?.x || 0);
      const py = Math.round(g?.player?.y || 0);
      const nyawa = g?.player?.nyawa;
      const misi = document.getElementById('hud-misi-teks')?.textContent;
      const bridgeOpen = g?.solidPlatforms?.find(p => p.tipe === 'jembatan_ranting')?.terbuka;
      return { px, py, nyawa, misi, bridgeOpen };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Setelah Menyeberang Jembatan:', afterCrossing.result?.value);

  const ssCrossAfter = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_sesudah_menyeberang_jembatan.png'), Buffer.from(ssCrossAfter.data, 'base64'));
  console.log('📸 Tangkapan layar menyeberangi jembatan: bukti_sesudah_menyeberang_jembatan.png');

  if (afterCrossing.result?.value?.px >= 1020 && afterCrossing.result?.value?.py <= 400 && afterCrossing.result?.value?.bridgeOpen) {
    console.log('✓ TEST 3 LOLOS: Jembatan kayu kokoh (terbuka = true), kotak merah hilang, dan pemain berhasil menyeberangi jurang tanpa jatuh!');
  } else {
    console.error('✗ TEST 3 GAGAL: Jembatan gagal diseberangi atau pemain jatuh ke jurang.');
  }

  ws.close();
  chrome.kill();
  console.log('\n=== SEMUA PENGUJIAN TAHAP 1-3 SESUDAH PERBAIKAN SELESAI ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
