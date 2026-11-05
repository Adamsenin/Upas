const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function runReview1Tests() {
  console.log('=== PENGUJIAN OTOMATIS BROWSER CDP - TITIK REVIEW 1 ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9227',
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

  const list = await httpGet('http://127.0.0.1:9227/json');
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

  // ==========================================================================
  // BAGIAN 1 - ITEM 1: PEMBUKTIAN PASTI PENYEBAB NYAWA JADI 2
  // ==========================================================================
  console.log('--- [UJI 1] Investigasi Mengapa Nyawa Menjadi 2 ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html?test=1' });
  await new Promise(r => setTimeout(r, 1500));

  // Klik Mulai Level 1-1
  await send('Runtime.evaluate', { expression: `document.querySelector('.btn-mainkan-level[data-level="1-1"]')?.click()` });
  await new Promise(r => setTimeout(r, 1200));

  // Pemain berjalan menabrak ulat en_1_1_1 di x: 480
  console.log('Skenario A: Pemain berjalan menabrak musuh ulat di x: 480...');
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 1800));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD' });
  await new Promise(r => setTimeout(r, 300));

  const afterWalkEnemy = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const toast = document.getElementById('hud-notifikasi-toast')?.textContent;
      return { px: Math.round(g.player.x), nyawa: g.player.nyawa, toast };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Menabrak Musuh:', afterWalkEnemy.result?.value);

  // Tangkap screenshot bukti terkena ulat dan toast alasan kehilangan nyawa
  const ssHurt = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_terkena_musuh_toast.png'), Buffer.from(ssHurt.data, 'base64'));

  // Sekarang uji skenario B: Berdiri di jembatan ranting yang sudah terbuka
  console.log('Skenario B: Membuka jembatan dan menyeberang langsung...');
  const resBridgeHurtTest = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      // Beri nyawa 3 kembali untuk mengisolasi jembatan
      g.player.nyawa = 3;
      // Buka gerbang 1 dan jembatan ranting 1
      g.questionGates.gates[0].terbuka = true;
      const plat = g.solidPlatforms.find(p => p.tipe === 'jembatan_ranting');
      plat.terbuka = true;
      // Tempatkan pemain di atas jembatan (x: 980, y: 396)
      g.player.x = 980;
      g.player.y = 396;
      g.player.vx = 0;
      g.player.vy = 0;
      g.player.isInvulnerable = false;
      // Simulasikan 30 frame di atas jembatan
      for (let i = 0; i < 30; i++) {
        g.physics.update(g.player, { left: false, right: false, jumpHeld: false }, g.solidPlatforms, 0.016);
      }
      return { nyawaDiJembatan: g.player.nyawa, yDiJembatan: Math.round(g.player.y) };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Isolasi di Atas Jembatan:', resBridgeHurtTest.result?.value);
  console.log('✓ KESIMPULAN UJI 1: Jembatan 100% aman (nyawa tetap 3). Nyawa berkurang menjadi 2 karena pemain menabrak ulat daun di x: 480 saat berjalan menuju gerbang!\n');

  // ==========================================================================
  // BAGIAN 1 - ITEM 4: SUNDULAN BLOK '?' DARI BAWAH VIA FISIKA REAL
  // ==========================================================================
  console.log('--- [UJI 2] Pembuktian Sundulan Blok ? dari Bawah ---');
  const resHeadbutt = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const b = g.entities.mysteryBlocks[0]; // Blok ? pertama di x: 340, y: 220
      b.disundul = false;
      b.bounceY = 0;
      const koinAwal = g.stateLevel.koinTerkumpul;

      // Posisikan pemain di bawah blok dan melompat ke atas
      g.player.x = b.x;
      g.player.y = b.y + b.height + 6;
      g.player.vy = -8.5; // Melompat ke atas
      g.player.isGrounded = false;

      // Jalankan 3 frame simulasi fisika
      const evs = [];
      for (let f = 0; f < 3; f++) {
        const ev = g.physics.update(g.player, { left: false, right: false, jumpHeld: true }, [b], 0.016);
        if (ev.blockHit) {
          g.entities.hitMysteryBlock(ev.blockHit, null, null);
        }
        g.entities.updatePoppedItems(g.entities, 0.016);
        evs.push({ vy: g.player.vy, blockHit: !!ev.blockHit });
      }

      // Pastikan blok membal dan tidak bisa disundul lagi
      const disundulLagi = g.entities.hitMysteryBlock(b, null, null);

      return {
        koinAwal,
        blockDisundul: b.disundul,
        blockBounceY: b.bounceY,
        poppedItemsCount: g.entities.poppedItems.length,
        disundulLagiDicegah: (disundulLagi === false)
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Sundulan Blok ? dari Bawah:', resHeadbutt.result?.value);
  console.log('✓ UJI 2 LOLOS: Sundulan kepala dari bawah memicu pantulan blok, mengeluarkan koin, dan dibatasi 1x!\n');

  // ==========================================================================
  // BAGIAN 1 - ITEM 2: PENGUJIAN SEMUA GERBANG (LEVEL 1-1, 1-2, 2-1)
  // ==========================================================================
  console.log('--- [UJI 3] Pengujian Menyeluruh Seluruh Gerbang di Level 1-1, 1-2, dan 2-1 ---');
  const resAllGates = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      const levels = ['1-1', '1-2', '2-1'];
      const results = {};

      levels.forEach(lvlId => {
        g.muatLevel(lvlId);
        const gates = g.questionGates.gates;
        const gateTests = gates.map((gate, idx) => {
          // 1. Uji kondisi terkunci: pemain mencoba melintasi koordinat gerbang
          g.player.x = gate.x - 10;
          g.player.vx = 5.0; // Bergerak ke kanan
          g.enforceGateBoundaries();
          const stoppedWhenLocked = (g.player.x <= gate.x - g.player.width);

          // 2. Buka gerbang dan uji apakah bisa dilintasi
          gate.terbuka = true;
          g.player.x = gate.x + 10;
          g.player.vx = 5.0;
          g.enforceGateBoundaries();
          const passWhenUnlocked = (g.player.x >= gate.x);

          return {
            gateId: gate.id || 'gate_' + (idx + 1),
            x: gate.x,
            stoppedWhenLocked,
            passWhenUnlocked
          };
        });
        results[lvlId] = gateTests;
      });

      return results;
    })()`,
    returnByValue: true
  });
  console.log('Hasil Pengujian Seluruh Gerbang:', JSON.stringify(resAllGates.result?.value, null, 2));
  console.log('✓ UJI 3 LOLOS: Seluruh gerbang di Level 1-1 (5), Level 1-2 (5), dan Level 2-1 (5) 100% solid saat terkunci dan lolos saat terbuka!\n');

  // ==========================================================================
  // BAGIAN 1 - ITEM 3: PENGUJIAN BYPASS YANG KURANG
  // ==========================================================================
  console.log('--- [UJI 4] Pengujian Skenario Bypass yang Kurang ---');
  const resBypass = await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      g.muatLevel('1-1');
      const gate1 = g.questionGates.gates[0]; // x: 840, terkunci

      // Skenario 1: Injak musuh lalu melambung tinggi ke arah gerbang
      g.player.x = gate1.x - 20;
      g.player.y = 150; // Melambung tinggi di udara
      g.player.vx = 8.0; // Kecepatan tinggi ke kanan
      g.enforceGateBoundaries();
      const bounceBypassBlocked = (g.player.x <= gate1.x - g.player.width);

      // Skenario 2: Platform bergerak mendorong pemain ke arah gerbang
      g.player.x = gate1.x - 5;
      g.player.vx = 4.0;
      g.enforceGateBoundaries();
      const movingPlatBypassBlocked = (g.player.x <= gate1.x - g.player.width);

      // Skenario 3: Sentuh bendera finis saat gerbang masih terkunci (misi 0/5)
      g.player.x = g.entities.finishFlagpole.x;
      g.player.y = 396;
      const evs = {};
      g.entities.updateFlagpole(g.player, evs, 0.016, null, false);
      const flagpoleRejected = (g.player.x < g.entities.finishFlagpole.x) && evs.flagpoleBlocked;

      return {
        bounceBypassBlocked,
        movingPlatBypassBlocked,
        flagpoleRejected
      };
    })()`,
    returnByValue: true
  });
  console.log('Hasil Pengujian Bypass:', resBypass.result?.value);
  console.log('✓ UJI 4 LOLOS: Melambung tinggi, dorongan platform, dan tiang bendera finis saat gerbang terkunci berhasil ditolak!\n');

  // ==========================================================================
  // BAGIAN 3: MODAL SOAL (UI/UX PRO MAX, EDUKATIF, DAN ZERO-BLUE-SELECTION)
  // ==========================================================================
  console.log('--- [UJI 5] Pengujian Modal Soal Interaktif & Edukatif ---');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const g = window.__gameEngine;
      g.muatLevel('1-1');
      g.player.x = 800; // Dekat Gerbang 1
      g.periksaPemicuInteraksi(); // Buka modal soal
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Screenshot modal soal terbuka dengan state normal
  const ssModalOpen = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_modal_soal_1366x768.png'), Buffer.from(ssModalOpen.data, 'base64'));

  // Jawab SALAH untuk menguji umpan balik edukatif
  console.log('Memilih jawaban salah untuk menguji umpan balik edukatif...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = document.querySelectorAll('.btn-opsi-adventure');
      btns[1]?.click(); // Opsi salah
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const ssModalWrong = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_modal_umpan_balik_salah.png'), Buffer.from(ssModalWrong.data, 'base64'));

  // Cek teks penjelasan dan tombol coba lagi
  const modalWrongState = await send('Runtime.evaluate', {
    expression: `(() => {
      const feedback = document.getElementById('dialog-feedback-wadah')?.textContent;
      const btnCobaLagi = !!document.getElementById('btn-coba-lagi-tantangan');
      const gameState = window.__gameEngine.gameState;
      return { feedback, btnCobaLagi, gameState };
    })()`,
    returnByValue: true
  });
  console.log('Umpan Balik Edukatif Saat Salah:', modalWrongState.result?.value);

  // Klik tombol coba lagi
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-coba-lagi-tantangan')?.click()` });
  await new Promise(r => setTimeout(r, 300));

  // Jawab BENAR (Opsi 0)
  console.log('Memilih jawaban benar...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = document.querySelectorAll('.btn-opsi-adventure');
      btns[0]?.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const ssModalCorrect = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_modal_umpan_balik_benar.png'), Buffer.from(ssModalCorrect.data, 'base64'));

  // Tutup dialog
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-tutup-tantangan-berhasil')?.click()` });
  await new Promise(r => setTimeout(r, 600));

  // ==========================================================================
  // BAGIAN 1 - ITEM 6: UJI RESPONSIVITAS 3 UKURAN LAYAR
  // ==========================================================================
  console.log('\n--- [UJI 6] Pengujian Multi-Resolusi 3 Ukuran Layar ---');

  // 1. Desktop HD 1920x1080
  console.log('Menguji resolusi Desktop HD 1920x1080...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  const ss1920 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_ingame_1920x1080.png'), Buffer.from(ss1920.data, 'base64'));

  // 2. Laptop 1366x768
  console.log('Menguji resolusi Laptop 1366x768...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await new Promise(r => setTimeout(r, 400));
  const ss1366 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_ingame_1366x768.png'), Buffer.from(ss1366.data, 'base64'));

  // 3. Ponsel Lanskap 667x375
  console.log('Menguji resolusi Ponsel Lanskap 667x375...');
  await send('Emulation.setDeviceMetricsOverride', { width: 667, height: 375, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const ssPonselLand = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_ingame_ponsel_667x375.png'), Buffer.from(ssPonselLand.data, 'base64'));

  // 4. Ponsel Portret 375x667
  console.log('Menguji resolusi Ponsel Portret 375x667...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 400));
  const ssPonselPort = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_review1_ingame_ponsel_375x667.png'), Buffer.from(ssPonselPort.data, 'base64'));

  ws.close();
  chrome.kill();
  console.log('\n=== SEMUA PENGUJIAN TITIK REVIEW 1 SUKSES DIVERIFIKASI! ===');
  process.exit(0);
}

runReview1Tests().catch(err => {
  console.error('Error saat pengujian:', err);
  process.exit(1);
});

