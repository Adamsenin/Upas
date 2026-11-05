const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function main() {
  console.log('=== PEMERIKSAAN & REPRODUKSI BUG REVIEW 1 ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
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

  const list = await httpGet('http://127.0.0.1:9226/json');
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

  // UJI 1: PENYEBAB PASTI NYAWA JADI 2
  console.log('1. Menguji penyebab nyawa berkurang jadi 2...');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html?test=1' });
  await new Promise(r => setTimeout(r, 1500));
  await send('Runtime.evaluate', { expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()` });
  await new Promise(r => setTimeout(r, 1500));

  // Catat nyawa awal
  const stateStart = await send('Runtime.evaluate', {
    expression: `({ nyawa: window.__gameEngine.player.nyawa, x: window.__gameEngine.player.x })`,
    returnByValue: true
  });
  console.log('State Awal Pemain:', stateStart.result?.value);

  // Berjalan melewati x: 480 (lokasi ulat en_1_1_1)
  console.log('Berjalan ke x: 550 melewati lokasi ulat en_1_1_1 (x: 480)...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 1600));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  const stateAfterEnemy = await send('Runtime.evaluate', {
    expression: `({ nyawa: window.__gameEngine.player.nyawa, x: Math.round(window.__gameEngine.player.x), enemyX: Math.round(window.__gameEngine.entities.enemies[0].x) })`,
    returnByValue: true
  });
  console.log('State Setelah Melewati Ulat:', stateAfterEnemy.result?.value);

  // UJI 2: MENYENTUH BENDERA FINIS SAAT GERBANG TERKUNCI
  console.log('\n2. Menguji apakah bendera finis bisa disentuh saat gerbang terkunci...');
  const resFlagTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      // Coba pindahkan pemain ke dekat tiang bendera di x: 3600
      g.player.x = 3600;
      g.player.y = 396;
      g.entities.updateFlagpole(g.player, 0.016, null, { isAllGatesUnlocked: false });
      return {
        misiSelesai: g.stateLevel.misiSelesai,
        isCleared: g.stateLevel.isCleared,
        poleWinTriggered: g.entities.finishFlagpole.animating
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Uji Bendera Saat Gerbang Terkunci:', resFlagTest.result?.value);

  // UJI 3: SUNDULAN BLOK ? DARI BAWAH
  console.log('\n3. Menguji sundulan blok ? dari bawah...');
  const resHeadbutt = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const b = g.entities.mysteryBlocks[0]; // x: 340, y: 220, w: 36, h: 36
      // Posisikan pemain tepat di bawah blok
      g.player.x = b.x;
      g.player.y = b.y + b.height + 10;
      g.player.vy = -8.0; // melompat ke atas
      g.player.isGrounded = false;
      const koinAwal = g.stateLevel.koinTerkumpul;
      const events = g.physics.update(g.player, { left: false, right: false, jumpHeld: true }, [b], 0.016);
      return {
        vyAfter: g.player.vy,
        blockHit: !!events.blockHit,
        koinAwal
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Uji Sundulan Fisika Bawah:', resHeadbutt.result?.value);

  ws.close();
  chrome.kill();
  console.log('\n=== PEMERIKSAAN AWAL SELESAI ===');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

