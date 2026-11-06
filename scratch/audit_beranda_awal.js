const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function auditBeranda() {
  console.log('=== AUDIT BERANDA SAAT INI (ZOOM 100% & RESPONSIF) ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9250',
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
    const list = await httpGet('http://127.0.0.1:9250/json');
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

    const takeScreenshot = async (filePath) => {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log(`[Screenshot disimpan]: ${path.basename(filePath)}`);
    };

    // Helper ukur overlap dan status layout
    const analyzeLayout = async () => {
      return await evaluate(`
        (() => {
          const lokasiItems = Array.from(document.querySelectorAll('.lokasi-item'));
          const itemBoxes = lokasiItems.map(el => {
            const nama = el.querySelector('.lokasi-nama')?.textContent.trim() || 'Unknown';
            const rect = el.getBoundingClientRect();
            const papan = el.querySelector('.lokasi-papan')?.getBoundingClientRect() || rect;
            const medali = el.querySelector('.lokasi-medali')?.getBoundingClientRect() || rect;
            return { nama, rect, papan, medali };
          });

          // Cek overlap antar label/papan lokasi
          const overlaps = [];
          for (let i = 0; i < itemBoxes.length; i++) {
            for (let j = i + 1; j < itemBoxes.length; j++) {
              const a = itemBoxes[i].papan;
              const b = itemBoxes[j].papan;
              const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              const area = xOverlap * yOverlap;
              if (area > 0) {
                overlaps.push({
                  item1: itemBoxes[i].nama,
                  item2: itemBoxes[j].nama,
                  area,
                  xOverlap: Math.round(xOverlap),
                  yOverlap: Math.round(yOverlap)
                });
              }
            }
          }

          // Cek overlap maskot & balon dengan lokasi
          const maskot = document.querySelector('.maskot-peta')?.getBoundingClientRect();
          const balon = document.getElementById('balon-sapa-maskot')?.getBoundingClientRect();
          const maskotOverlaps = [];
          if (balon) {
            itemBoxes.forEach(ib => {
              const b = ib.papan;
              const xOverlap = Math.max(0, Math.min(balon.right, b.right) - Math.max(balon.left, b.left));
              const yOverlap = Math.max(0, Math.min(balon.bottom, b.bottom) - Math.max(balon.top, b.top));
              const area = xOverlap * yOverlap;
              if (area > 0) {
                maskotOverlaps.push({
                  target: ib.nama,
                  with: 'Balon Sapa Maskot',
                  area,
                  xOverlap: Math.round(xOverlap),
                  yOverlap: Math.round(yOverlap)
                });
              }
            });
          }

          // Buku Jejak status
          const bukuJejak = document.querySelector('.buku-jejak')?.getBoundingClientRect();
          const viewportH = window.innerHeight;
          const bukuJejakCutOff = bukuJejak ? (bukuJejak.bottom > viewportH) : false;
          const bukuJejakVisibleFraction = bukuJejak ? Math.max(0, Math.min(viewportH, bukuJejak.bottom) - bukuJejak.top) / bukuJejak.height : 0;

          // Hero & CTA analysis
          const heroJudul = document.getElementById('judul-beranda')?.getBoundingClientRect();
          const btnAdventure = document.getElementById('btn-adventure-siswa')?.getBoundingClientRect();
          const btnButterfly = document.getElementById('btn-butterfly-siswa')?.getBoundingClientRect();
          const btnSayaSiswa = document.getElementById('btn-saya-siswa')?.getBoundingClientRect();

          // Cek warna tombol
          const styleAdv = window.getComputedStyle(document.getElementById('btn-adventure-siswa'));
          const styleBtf = window.getComputedStyle(document.getElementById('btn-butterfly-siswa'));
          const styleKuis = window.getComputedStyle(document.getElementById('btn-saya-siswa'));

          return {
            viewport: { width: window.innerWidth, height: window.innerHeight },
            overlaps,
            maskotOverlaps,
            bukuJejak: {
              rect: bukuJejak,
              isCutOffBelowFold: bukuJejakCutOff,
              visibleFraction: Math.round(bukuJejakVisibleFraction * 100) + '%'
            },
            btnStyles: {
              adventureBg: styleAdv.backgroundImage || styleAdv.backgroundColor,
              butterflyBg: styleBtf.backgroundImage || styleBtf.backgroundColor,
              kuisBg: styleKuis.backgroundImage || styleKuis.backgroundColor
            },
            heroJudulSize: window.getComputedStyle(document.getElementById('judul-beranda')).fontSize,
            balonText: document.getElementById('balon-sapa-maskot')?.textContent.trim()
          };
        })()
      `);
    };

    // 1. Audit Viewport 1366 x 768 (Laptop Standar, Zoom 100%)
    console.log('--- 1. Viewport 1366x768 (Desktop Standard, Zoom 100%) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false
    });
    await send('Page.navigate', { url: 'http://localhost:8000/index.html' });
    await new Promise(r => setTimeout(r, 2000));

    const res1366 = await analyzeLayout();
    console.log('Hasil 1366x768:', JSON.stringify(res1366, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_1366x768_zoom100.png'));

    // 2. Audit Viewport 1920 x 1080 (Smartboard / Layar Besar, Zoom 100%)
    console.log('\n--- 2. Viewport 1920x1080 (Smartboard, Zoom 100%) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1000));
    const res1920 = await analyzeLayout();
    console.log('Hasil 1920x1080:', JSON.stringify(res1920, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_1920x1080_zoom100.png'));

    // 3. Audit Viewport 1536 x 864 (Resolusi Menengah Populer)
    console.log('\n--- 3. Viewport 1536x864 (Desktop, Zoom 100%) ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1536,
      height: 864,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1000));
    const res1536 = await analyzeLayout();
    console.log('Hasil 1536x864:', JSON.stringify(res1536, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_1536x864_zoom100.png'));

    // 4. Audit Viewport Tablet 768 x 1024
    console.log('\n--- 4. Viewport Tablet 768x1024 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 768,
      height: 1024,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1000));
    const resTablet = await analyzeLayout();
    console.log('Hasil Tablet 768x1024:', JSON.stringify(resTablet, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_tablet_768x1024.png'));

    // 5. Audit Viewport Mobile 375 x 667
    console.log('\n--- 5. Viewport Mobile 375x667 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 1000));
    const resMobile = await analyzeLayout();
    console.log('Hasil Mobile 375x667:', JSON.stringify(resMobile, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_mobile_375x667.png'));

    // 6. Audit Zoom 125% di 1366x768 (Device Scale Factor 1.25)
    console.log('\n--- 6. Zoom 125% di 1366x768 ---');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1093, // 1366 / 1.25
      height: 614, // 768 / 1.25
      deviceScaleFactor: 1.25,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 1000));
    const resZoom125 = await analyzeLayout();
    console.log('Hasil Zoom 125%:', JSON.stringify(resZoom125, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_beranda_awal_zoom125.png'));

    // Simpan data audit mentah untuk referensi dokumen rencana
    fs.writeFileSync(path.join(artifactDir, 'audit_beranda_raw.json'), JSON.stringify({
      res1366,
      res1920,
      res1536,
      resTablet,
      resMobile,
      resZoom125
    }, null, 2));
    console.log('\nAudit raw data tersimpan di audit_beranda_raw.json');

  } catch (err) {
    console.error('Error saat audit:', err);
  } finally {
    chrome.kill();
    process.exit(0);
  }
}

auditBeranda();

