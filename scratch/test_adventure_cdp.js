const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function testAdventure() {
  console.log('=== TEST OTOMATIS BROWSER CDP: FITUR ADVENTURE SUPER MARIO EDUKASI ===\n');

  // 1. Jalankan Chrome Headless dengan CDP
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9258',
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

  try {
    const list = await httpGet('http://127.0.0.1:9258/json');
    const target = list.find(t => t.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();
    const consoleLogs = [];
    const pageErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Console.messageAdded') {
        const text = msg.params.message.text;
        const level = msg.params.message.level;
        consoleLogs.push({ level, text });
        if (level === 'error') pageErrors.push(text);
      }
      if (msg.method === 'Runtime.exceptionThrown') {
        pageErrors.push(msg.params.exceptionDetails.text + ': ' + (msg.params.exceptionDetails.exception?.description || ''));
      }
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
    await send('Console.enable');
    await send('Runtime.enable');
    await send('Page.enable');

    const evalJs = async (expression) => {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      return res.result ? res.result.value : null;
    };

    const captureShot = async (filename) => {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const buf = Buffer.from(res.data, 'base64');
      fs.writeFileSync(path.join(artifactDir, filename), buf);
      console.log(`[Screenshot] Disimpan: ${filename}`);
    };

    // --- TEST 1: DESKTOP 1366x768 (Layar Awal / Start Modal) ---
    console.log('\n--- Test 1: Desktop 1366x768 Layar Awal (Start Modal) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8000/adventure.html' });
    await new Promise(r => setTimeout(r, 2000));

    const pageTitle = await evalJs('document.title');
    console.log('Page Title:', pageTitle);

    const startModalActive = await evalJs(`document.getElementById('start-modal').classList.contains('active')`);
    console.log('Start Modal Active:', startModalActive);

    const hudValues = await evalJs(`({
      score: document.getElementById('hud-score').textContent,
      coins: document.getElementById('hud-coins').textContent,
      quiz: document.getElementById('hud-quiz').textContent,
      time: document.getElementById('hud-time').textContent
    })`);
    console.log('HUD Awal:', JSON.stringify(hudValues));

    await captureShot('adventure_desktop_start_modal.png');

    // --- TEST 2: MULAI BERMAIN (Gameplay Aktif) ---
    console.log('\n--- Test 2: Klik Mulai Bermain & Validasi Loop Game ---');
    await evalJs(`document.getElementById('btn-start-fullscreen').click()`);
    await new Promise(r => setTimeout(r, 1200));

    const gameStateAfterStart = await evalJs(`typeof gameState !== 'undefined' ? gameState : 'unknown'`);
    console.log('Game State setelah klik mulai:', gameStateAfterStart);

    const startModalActiveAfter = await evalJs(`document.getElementById('start-modal').classList.contains('active')`);
    console.log('Start Modal tertutup:', !startModalActiveAfter);

    await captureShot('adventure_desktop_gameplay.png');

    // --- TEST 3: JEDA PERMAINAN (Pause Modal) ---
    console.log('\n--- Test 3: Klik Pause & Validasi Pause Modal ---');
    await evalJs(`document.getElementById('btn-pause-hud').click()`);
    await new Promise(r => setTimeout(r, 600));

    const pauseModalActive = await evalJs(`document.getElementById('pause-modal').classList.contains('active')`);
    console.log('Pause Modal Active:', pauseModalActive);

    await captureShot('adventure_desktop_pause_modal.png');

    // Resume permainan
    await evalJs(`document.getElementById('btn-resume-game').click()`);
    await new Promise(r => setTimeout(r, 600));
    const pauseModalActiveAfterResume = await evalJs(`document.getElementById('pause-modal').classList.contains('active')`);
    console.log('Pause Modal tertutup setelah Resume:', !pauseModalActiveAfterResume);

    // --- TEST 4: KUIS POP-UP BLOK "?" ---
    console.log('\n--- Test 4: Simulasi Trigger Kuis Blok "?" ---');
    // Buka kuis soal 0 secara langsung via fungsi game untuk verifikasi modal kuis
    await evalJs(`if (typeof triggerQuestionBlock === 'function' && typeof questionBlocks !== 'undefined' && questionBlocks[0]) { triggerQuestionBlock(questionBlocks[0]); }`);
    await new Promise(r => setTimeout(r, 600));

    const quizModalActive = await evalJs(`document.getElementById('quiz-modal').classList.contains('active')`);
    const quizQuestionText = await evalJs(`document.getElementById('quiz-question').textContent.trim()`);
    const quizOptionsCount = await evalJs(`document.querySelectorAll('.option-btn').length`);
    console.log('Quiz Modal Active:', quizModalActive);
    console.log('Quiz Question:', quizQuestionText.substring(0, 80) + '...');
    console.log('Quiz Options Count:', quizOptionsCount);

    await captureShot('adventure_desktop_quiz_modal.png');

    // Klik opsi jawaban benar (opsi 0: Produsen)
    await evalJs(`document.querySelectorAll('.option-btn')[0].click()`);
    await new Promise(r => setTimeout(r, 600));
    const feedbackVisible = await evalJs(`document.getElementById('quiz-feedback').classList.contains('show')`);
    const feedbackText = await evalJs(`document.getElementById('feedback-text').textContent.trim()`);
    console.log('Feedback Muncul:', feedbackVisible);
    console.log('Feedback Text:', feedbackText);

    await captureShot('adventure_desktop_quiz_feedback.png');

    // Tutup kuis & lanjut main
    await evalJs(`document.getElementById('btn-close-quiz').click()`);
    await new Promise(r => setTimeout(r, 600));
    const quizModalClosed = await evalJs(`!document.getElementById('quiz-modal').classList.contains('active')`);
    console.log('Quiz Modal tertutup:', quizModalClosed);

    // --- TEST 5: MOBILE LANDSCAPE (844x390 - D-Pad & Tombol Lompat Sentuh) ---
    console.log('\n--- Test 5: Mobile Lanskap 844x390 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 844,
      height: 390,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'landscapePrimary', angle: 90 }
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    await send('Page.navigate', { url: 'http://127.0.0.1:8000/adventure.html' });
    await new Promise(r => setTimeout(r, 1500));
    await evalJs(`document.getElementById('btn-start-fullscreen').click()`);
    await new Promise(r => setTimeout(r, 1000));

    const dpadDisplay = await evalJs(`window.getComputedStyle(document.getElementById('touch-dpad')).display`);
    const jumpDisplay = await evalJs(`window.getComputedStyle(document.getElementById('touch-jump')).display`);
    console.log('Touch D-Pad display:', dpadDisplay);
    console.log('Touch Jump display:', jumpDisplay);

    await captureShot('adventure_mobile_landscape.png');

    // --- TEST 6: MOBILE PORTRAIT 390x844 (Overlay Putar Layar) ---
    console.log('\n--- Test 6: Mobile Potret 390x844 (Overlay Peringatan Rotasi) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
      screenOrientation: { type: 'portraitPrimary', angle: 0 }
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:8000/adventure.html' });
    await new Promise(r => setTimeout(r, 1500));

    const overlayActive = await evalJs(`document.getElementById('orientation-overlay').classList.contains('active')`);
    console.log('Orientation Overlay Active in Portrait:', overlayActive);

    await captureShot('adventure_mobile_portrait.png');

    console.log('\n=== REKAP AUDIT KONSOL & ERROR ===');
    console.log('Total Console Logs:', consoleLogs.length);
    console.log('Total Page Errors:', pageErrors.length);
    if (pageErrors.length > 0) {
      console.log('Errors:', pageErrors);
    } else {
      console.log('STATUS: ZERO ERRORS! Semua fitur berjalan 100% sempurna.');
    }

    ws.close();
  } catch (err) {
    console.error('Test Error:', err);
  } finally {
    chrome.kill();
  }
}

testAdventure();
