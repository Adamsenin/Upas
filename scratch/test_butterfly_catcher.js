const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function testButterflyCatcher() {
  console.log('=== PENGUJIAN OTOMATIS BROWSER CDP: BUTTERFLY CATCHER ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9246',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await new Promise(r => setTimeout(r, 2000));

  const httpGet = (url) => new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const list = await httpGet('http://127.0.0.1:9246/json');
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

  const consoleErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
  });

  const results = [];

  // ==========================================
  // TES 1: Periksa index.html (Pintu Masuk)
  // ==========================================
  console.log('[TES 1] Memeriksa index.html untuk tombol Butterfly Catcher...');
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:8000/index.html' });
  await new Promise(r => setTimeout(r, 2500));

  const checkIndexBtn = await send('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.getElementById('btn-butterfly-siswa');
      if (!btn) return { exists: false };
      return {
        exists: true,
        href: btn.getAttribute('href'),
        text: btn.innerText.trim(),
        visible: btn.offsetParent !== null
      };
    })()`,
    returnByValue: true
  });

  const indexPass = checkIndexBtn.result.value.exists && checkIndexBtn.result.value.href === 'butterfly-catcher.html';
  results.push({ name: 'Tombol Butterfly Catcher di index.html', pass: indexPass, detail: checkIndexBtn.result.value });
  console.log(`- Hasil: ${indexPass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkIndexBtn.result.value);

  // Capture screenshot index.html
  const shotIndex = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_index_butterfly_btn.png'), Buffer.from(shotIndex.data, 'base64'));

  // ==========================================
  // TES 2: Buka butterfly-catcher.html
  // ==========================================
  console.log('\n[TES 2] Membuka butterfly-catcher.html...');
  await send('Page.navigate', { url: 'http://localhost:8000/butterfly-catcher.html' });
  await new Promise(r => setTimeout(r, 2500));

  const checkInit = await send('Runtime.evaluate', {
    expression: `(() => {
      const canvas = document.getElementById('gameCanvas');
      const modalStart = document.getElementById('modal-start');
      const btnPlay = document.getElementById('btn-start-play');
      const btnBeranda = document.getElementById('btn-start-beranda');
      const hudHome = document.getElementById('btn-hud-beranda');
      return {
        canvasWidth: canvas ? canvas.width : 0,
        canvasHeight: canvas ? canvas.height : 0,
        modalStartVisible: modalStart ? modalStart.classList.contains('visible') : false,
        btnPlayExists: !!btnPlay,
        btnBerandaExists: !!btnBeranda && btnBeranda.getAttribute('href') === 'index.html',
        hudHomeExists: !!hudHome && hudHome.getAttribute('href') === 'index.html'
      };
    })()`,
    returnByValue: true
  });

  const initPass = checkInit.result.value.canvasWidth > 0 && 
                   checkInit.result.value.modalStartVisible && 
                   checkInit.result.value.btnPlayExists &&
                   checkInit.result.value.btnBerandaExists &&
                   checkInit.result.value.hudHomeExists;

  results.push({ name: 'Inisialisasi Game & Menu Awal', pass: initPass, detail: checkInit.result.value });
  console.log(`- Hasil: ${initPass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkInit.result.value);

  // Capture screenshot layar awal
  const shotStart = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_butterfly_start_menu.png'), Buffer.from(shotStart.data, 'base64'));

  // ==========================================
  // TES 3: Buka Buku Saku Ekosistem (Bestiary)
  // ==========================================
  console.log('\n[TES 3] Membuka Buku Saku Ekosistem...');
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-start-bestiary').click()` });
  await new Promise(r => setTimeout(r, 600));

  const checkBestiary = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-bestiary');
      const items = document.querySelectorAll('.bestiary-item');
      return {
        modalVisible: modal ? modal.classList.contains('visible') : false,
        itemCount: items.length
      };
    })()`,
    returnByValue: true
  });

  const bestiaryPass = checkBestiary.result.value.modalVisible && checkBestiary.result.value.itemCount >= 10;
  results.push({ name: 'Modal Buku Saku Ekosistem (Bestiary 10 Entri)', pass: bestiaryPass, detail: checkBestiary.result.value });
  console.log(`- Hasil: ${bestiaryPass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkBestiary.result.value);

  const shotBestiary = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_butterfly_bestiary.png'), Buffer.from(shotBestiary.data, 'base64'));

  // Tutup Buku Saku
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-close-bestiary').click()` });
  await new Promise(r => setTimeout(r, 500));

  // ==========================================
  // TES 4: Buka Toko (Shop)
  // ==========================================
  console.log('\n[TES 4] Membuka Toko (Shop)...');
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-start-shop').click()` });
  await new Promise(r => setTimeout(r, 600));

  const checkShop = await send('Runtime.evaluate', {
    expression: `(() => {
      const modal = document.getElementById('modal-shop');
      const items = document.querySelectorAll('.shop-item');
      return {
        modalVisible: modal ? modal.classList.contains('visible') : false,
        itemCount: items.length
      };
    })()`,
    returnByValue: true
  });

  const shopPass = checkShop.result.value.modalVisible && checkShop.result.value.itemCount >= 3;
  results.push({ name: 'Modal Toko (Karakter & Jaring)', pass: shopPass, detail: checkShop.result.value });
  console.log(`- Hasil: ${shopPass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkShop.result.value);

  const shotShop = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_butterfly_shop.png'), Buffer.from(shotShop.data, 'base64'));

  // Tutup Toko
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-close-shop').click()` });
  await new Promise(r => setTimeout(r, 500));

  // ==========================================
  // TES 5: Mulai Permainan (Start Play)
  // ==========================================
  console.log('\n[TES 5] Memulai permainan (Klik PLAY)...');
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-start-play').click()` });
  await new Promise(r => setTimeout(r, 1000));

  const checkPlay = await send('Runtime.evaluate', {
    expression: `(() => {
      const modalStart = document.getElementById('modal-start');
      const hudTimer = document.getElementById('hud-timer');
      const hudFps = document.getElementById('hud-fps');
      return {
        modalStartClosed: !modalStart.classList.contains('visible'),
        timerText: hudTimer ? hudTimer.textContent : '',
        fpsText: hudFps ? hudFps.textContent : ''
      };
    })()`,
    returnByValue: true
  });

  const playPass = checkPlay.result.value.modalStartClosed && checkPlay.result.value.timerText.includes('s');
  results.push({ name: 'Masuk Mode Permainan (PLAYING)', pass: playPass, detail: checkPlay.result.value });
  console.log(`- Hasil: ${playPass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkPlay.result.value);

  // ==========================================
  // TES 6: Gerakan Pemain & Aksi Ayun Jaring
  // ==========================================
  console.log('\n[TES 6] Menguji input gerak keyboard & ayunan jaring...');
  // Tekan tombol D selama 500ms
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code: 'KeyD', key: 'd' });
  await new Promise(r => setTimeout(r, 600));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyD', key: 'd' });

  // Tekan SPASI untuk tangkap
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', code: 'Space', key: ' ' });
  await new Promise(r => setTimeout(r, 100));
  await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'Space', key: ' ' });
  await new Promise(r => setTimeout(r, 400));

  // Klik tombol tangkap HUD
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-catch').click()` });
  await new Promise(r => setTimeout(r, 800));

  const shotIngame = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_butterfly_ingame.png'), Buffer.from(shotIngame.data, 'base64'));

  // ==========================================
  // TES 7: Uji Layar Responsif Ponsel (375x667)
  // ==========================================
  console.log('\n[TES 7] Menguji tata letak responsif ponsel (375x667)...');
  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 667, deviceScaleFactor: 2, mobile: true });
  await new Promise(r => setTimeout(r, 1000));

  const checkMobile = await send('Runtime.evaluate', {
    expression: `(() => {
      const joy = document.getElementById('joystick-zone');
      const catchBtn = document.getElementById('btn-catch');
      const canvas = document.getElementById('gameCanvas');
      return {
        joyVisible: joy && joy.offsetParent !== null,
        catchBtnVisible: catchBtn && catchBtn.offsetParent !== null,
        canvasW: canvas.width,
        canvasH: canvas.height
      };
    })()`,
    returnByValue: true
  });

  const mobilePass = checkMobile.result.value.joyVisible && checkMobile.result.value.catchBtnVisible;
  results.push({ name: 'Kontrol Virtual Sentuh di Layar Ponsel', pass: mobilePass, detail: checkMobile.result.value });
  console.log(`- Hasil: ${mobilePass ? 'LOLOS ✅' : 'GAGAL ❌'}`, checkMobile.result.value);

  const shotMobile = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(artifactDir, 'bukti_butterfly_mobile_375x667.png'), Buffer.from(shotMobile.data, 'base64'));

  // ==========================================
  // TES 8: Konsol Error
  // ==========================================
  const errorPass = consoleErrors.length === 0;
  results.push({ name: 'Nol Error Konsol JavaScript', pass: errorPass, detail: { errors: consoleErrors } });
  console.log(`\n- Hasil Konsol: ${errorPass ? 'NOL ERROR ✅' : 'ADA ERROR ❌'}`, consoleErrors);

  console.log('\n================ RINGKASAN TES ================');
  let allPassed = true;
  results.forEach((r, idx) => {
    console.log(`${idx + 1}. [${r.pass ? 'PASS' : 'FAIL'}] ${r.name}`);
    if (!r.pass) allPassed = false;
  });
  console.log(`\nStatus Akhir: ${allPassed ? 'SEMUA TES LOLOS (100%) 🎉' : 'ADA TES GAGAL ⚠️'}`);

  ws.close();
  chrome.kill();
  process.exit(allPassed ? 0 : 1);
}

testButterflyCatcher().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

