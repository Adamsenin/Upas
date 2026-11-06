const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function verifyTahap2() {
  console.log('=== VERIFIKASI TAHAP 2 (HERO, SEGMENTED CONTROL, AKSI UTAMA & SEKUNDER, BUKU JEJAK) ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9251',
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
    const list = await httpGet('http://127.0.0.1:9251/json');
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

    const evaluate = async (expr) => {
      const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      return res.result?.value;
    };

    const setViewport = async (width, height, dsf = 1) => {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: dsf,
        mobile: width <= 768
      });
    };

    const takeScreenshot = async (filePath) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log(`[Screenshot]: ${path.basename(filePath)} (${fs.statSync(filePath).size} bytes)`);
    };

    const setRealGamificationData = async () => {
      await evaluate(`
        localStorage.setItem('kupas_gamifikasi_siswa', JSON.stringify({
          xp: 1060,
          streakHarian: 3,
          streakJawab: 4,
          tanggalTerakhir: new Date().toISOString().slice(0, 10),
          lencana: ['pemula', 'streak_3']
        }));
        localStorage.setItem('kupas_nama_pemain', 'Budi Santoso');
      `);
    };

    const measureLayout = async () => {
      return await evaluate(`
        (() => {
          const body = document.body;
          const doc = document.documentElement;
          const scrollW = Math.max(body.scrollWidth, doc.scrollWidth);
          const clientW = doc.clientWidth;
          const scrollH = Math.max(body.scrollHeight, doc.scrollHeight);
          const clientH = doc.clientHeight;

          const hero = document.querySelector('.beranda-sambut');
          const heroRect = hero ? hero.getBoundingClientRect() : null;

          const panelSiswa = document.getElementById('panel-peran-siswa');
          const panelSiswaRect = panelSiswa ? panelSiswa.getBoundingClientRect() : null;

          const panelGuru = document.getElementById('panel-peran-guru');
          const panelGuruRect = panelGuru ? panelGuru.getBoundingClientRect() : null;

          const bukuJejak = document.querySelector('.buku-jejak');
          const bukuJejakRect = bukuJejak ? bukuJejak.getBoundingClientRect() : null;

          const peta = document.getElementById('bagian-peta');
          const petaRect = peta ? peta.getBoundingClientRect() : null;

          const ctaSiswa = document.getElementById('btn-adventure-siswa');
          const ctaSiswaRect = ctaSiswa ? ctaSiswa.getBoundingClientRect() : null;

          const ctaGuru = document.getElementById('btn-saya-guru');
          const ctaGuruRect = ctaGuru ? ctaGuru.getBoundingClientRect() : null;

          // Cek teks buku jejak
          const jejakText = bukuJejak ? bukuJejak.innerText : '';

          return {
            scrollW,
            clientW,
            hasHorizontalScroll: scrollW > clientW,
            scrollH,
            clientH,
            heroRect: heroRect ? { top: heroRect.top, bottom: heroRect.bottom, height: heroRect.height } : null,
            panelSiswaRect: panelSiswaRect ? { top: panelSiswaRect.top, bottom: panelSiswaRect.bottom, height: panelSiswaRect.height } : null,
            bukuJejakRect: bukuJejakRect ? { top: bukuJejakRect.top, bottom: bukuJejakRect.bottom, height: bukuJejakRect.height } : null,
            petaRect: petaRect ? { top: petaRect.top, bottom: petaRect.bottom, height: petaRect.height } : null,
            ctaSiswaRect: ctaSiswaRect ? { top: ctaSiswaRect.top, bottom: ctaSiswaRect.bottom, height: ctaSiswaRect.height } : null,
            ctaGuruRect: ctaGuruRect ? { top: ctaGuruRect.top, bottom: ctaGuruRect.bottom, height: ctaGuruRect.height } : null,
            jejakText: jejakText.replace(/\\s+/g, ' ').trim()
          };
        })()
      `);
    };

    // 1. UJI 1366x768 (Laptop Standar SD / Smartboard 768p) - SISWA
    console.log('--- 1. Viewport 1366x768 Zoom 100% (Siswa) ---');
    await setViewport(1366, 768);
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1500));
    await setRealGamificationData();
    // Reload to apply localStorage
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1500));

    const m1366_siswa = await measureLayout();
    console.log('Metrik 1366 Siswa:', JSON.stringify(m1366_siswa, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_1366x768_siswa.png'));

    // 2. UJI 1366x768 - GURU
    console.log('\n--- 2. Viewport 1366x768 Zoom 100% (Guru Tab) ---');
    await evaluate(`document.getElementById('tab-peran-guru').click();`);
    await new Promise(r => setTimeout(r, 500));
    const m1366_guru = await measureLayout();
    console.log('Metrik 1366 Guru:', JSON.stringify(m1366_guru, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_1366x768_guru.png'));

    // Kembalikan ke tab siswa
    await evaluate(`document.getElementById('tab-peran-siswa').click();`);
    await new Promise(r => setTimeout(r, 500));

    // 3. UJI 1920x1080 (Desktop / Smartboard FHD)
    console.log('\n--- 3. Viewport 1920x1080 Zoom 100% ---');
    await setViewport(1920, 1080);
    await new Promise(r => setTimeout(r, 600));
    const m1920 = await measureLayout();
    console.log('Metrik 1920:', JSON.stringify(m1920, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_1920x1080.png'));

    // 4. UJI 768x1024 (Tablet Vertikal)
    console.log('\n--- 4. Viewport 768x1024 (Tablet) ---');
    await setViewport(768, 1024);
    await new Promise(r => setTimeout(r, 600));
    const m768 = await measureLayout();
    console.log('Metrik Tablet 768:', JSON.stringify(m768, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_tablet_768x1024.png'));

    // 5. UJI 375x667 (Ponsel)
    console.log('\n--- 5. Viewport 375x667 (Ponsel) ---');
    await setViewport(375, 667);
    await new Promise(r => setTimeout(r, 600));
    const m375 = await measureLayout();
    console.log('Metrik Ponsel 375:', JSON.stringify(m375, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_mobile_375x667.png'));

    // 6. UJI ZOOM 125% (1093x614) & ZOOM 80% (1708x960)
    console.log('\n--- 6. Viewport Zoom 125% (1093x614) ---');
    await setViewport(1093, 614);
    await new Promise(r => setTimeout(r, 600));
    const mZoom125 = await measureLayout();
    console.log('Metrik Zoom 125%:', JSON.stringify(mZoom125, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_zoom125.png'));

    console.log('\n--- 7. Viewport Zoom 80% (1708x960) ---');
    await setViewport(1708, 960);
    await new Promise(r => setTimeout(r, 600));
    const mZoom80 = await measureLayout();
    console.log('Metrik Zoom 80%:', JSON.stringify(mZoom80, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap2_zoom80.png'));

    // Simpan hasil metrik ke file json
    const auditData = {
      timestamp: new Date().toISOString(),
      fontPayloadBytes: 120612, // 117.8 KB
      m1366_siswa,
      m1366_guru,
      m1920,
      m768,
      m375,
      mZoom125,
      mZoom80
    };
    fs.writeFileSync(path.join(artifactDir, 'audit_tahap2_raw.json'), JSON.stringify(auditData, null, 2));
    console.log('\nAudit tahap 2 selesai disimpan!');

    await send('Browser.close');
    ws.close();
  } catch (err) {
    console.error('Error saat audit:', err);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

verifyTahap2();
