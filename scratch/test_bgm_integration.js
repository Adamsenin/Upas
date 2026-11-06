const http = require('http');
const { spawn } = require('child_process');

async function testBgmIntegration() {
  console.log('=== PENGUJIAN OTOMATIS BROWSER CDP: BGM BUTTERFLY CATCHER ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9247',
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
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

  const list = await httpGet('http://127.0.0.1:9247/json');
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

  const consoleErrors = [];
  ws.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map(a => a.value || a.description).join(' '));
    }
  });

  console.log('1. Membuka http://localhost:8000/butterfly-catcher.html...');
  await send('Page.navigate', { url: 'http://localhost:8000/butterfly-catcher.html' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('2. Memeriksa konfigurasi SoundSystem dan elemen audio BGM...');
  const checkAudioBefore = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.__kupasSound;
      return {
        bgmUrl: s ? (s.bgm ? s.bgm.src : null) : null,
        isLoop: s ? (s.bgm ? s.bgm.loop : null) : null
      };
    })()`,
    returnByValue: true
  });
  console.log('Informasi Audio Awal:', checkAudioBefore.result.value);

  console.log('3. Melakukan interaksi klik tombol PLAY SEKARANG untuk memicu startBGM()...');
  await send('Runtime.evaluate', { expression: `document.getElementById('btn-start-play').click()` });
  await new Promise(r => setTimeout(r, 1500));

  const checkAudioAfter = await send('Runtime.evaluate', {
    expression: `(() => {
      const s = window.__kupasSound;
      return {
        bgmSrc: s.bgm.src,
        paused: s.bgm.paused,
        currentTime: s.bgm.currentTime,
        duration: s.bgm.duration,
        volume: s.bgm.volume,
        isBgmPlaying: s.isBgmPlaying
      };
    })()`,
    returnByValue: true
  });
  console.log('Status BGM Setelah Play:', checkAudioAfter.result.value);

  const audioState = checkAudioAfter.result.value;
  const isCorrectSrc = audioState.bgmSrc.includes('assets/audio/butterfly-catcher-bgm.mp3');
  const isPlaying = !audioState.paused || audioState.isBgmPlaying || audioState.currentTime > 0;
  const hasValidDuration = !isNaN(audioState.duration) && audioState.duration > 100;

  console.log('\n=== HASIL VERIFIKASI BGM ===');
  console.log(`- Path Audio Benar: ${isCorrectSrc ? 'YA ✅' : 'TIDAK ❌'} (${audioState.bgmSrc})`);
  console.log(`- Durasi Audio Terbaca: ${hasValidDuration ? 'YA ✅' : 'TIDAK ❌'} (${Math.round(audioState.duration)}s)`);
  console.log(`- Status Pemutaran: ${isPlaying ? 'MEMUTAR ✅' : 'TERJEDA ⚠️'} (currentTime: ${audioState.currentTime}s, volume: ${audioState.volume})`);
  console.log(`- Error Konsol: ${consoleErrors.length === 0 ? 'NOL ERROR ✅' : 'ADA ERROR ❌'}`);

  const passed = isCorrectSrc && hasValidDuration && consoleErrors.length === 0;
  console.log(`\nStatus Pengujian: ${passed ? 'BERHASIL 100% 🎉' : 'GAGAL ❌'}`);

  ws.close();
  chrome.kill();
  process.exit(passed ? 0 : 1);
}

testBgmIntegration().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
