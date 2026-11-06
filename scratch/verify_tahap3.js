const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function verifyTahap3() {
  console.log('=== VERIFIKASI TAHAP 3: SISTEM PIN PETA, POPOVER, CHIPS, & MASKOT ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9254',
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
    const list = await httpGet('http://127.0.0.1:9254/json');
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

    // Fungsi pengukur tabrakan (overlap) geometris presisi
    const auditMapGeometry = async () => {
      return await evaluate(`
        (() => {
          const docW = document.documentElement.clientWidth;
          const docH = document.documentElement.clientHeight;
          const scrollW = document.documentElement.scrollWidth;

          // 1. Ukur Pin 1 s/d 6
          const pins = [1, 2, 3, 4, 5, 6].map(no => {
            const el = document.getElementById('pin-' + no);
            const rect = el ? el.getBoundingClientRect() : null;
            return { no, rect };
          }).filter(p => p.rect !== null);

          // Hitung tabrakan antar pin
          const pinOverlaps = [];
          for (let i = 0; i < pins.length; i++) {
            for (let j = i + 1; j < pins.length; j++) {
              const a = pins[i].rect;
              const b = pins[j].rect;
              const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              const area = xOverlap * yOverlap;
              if (area > 0) {
                pinOverlaps.push({ pinA: pins[i].no, pinB: pins[j].no, area });
              }
            }
          }

          // 2. Ukur Maskot & Balon
          const maskotEl = document.getElementById('maskot-peta');
          const maskotRect = maskotEl ? maskotEl.getBoundingClientRect() : null;
          const balonEl = document.getElementById('balon-sapa-maskot');
          const balonRect = balonEl ? balonEl.getBoundingClientRect() : null;

          const maskotPinOverlaps = [];
          if (maskotRect) {
            pins.forEach(p => {
              const b = p.rect;
              const xOverlap = Math.max(0, Math.min(maskotRect.right, b.right) - Math.max(maskotRect.left, b.left));
              const yOverlap = Math.max(0, Math.min(maskotRect.bottom, b.bottom) - Math.max(maskotRect.top, b.top));
              const area = xOverlap * yOverlap;
              if (area > 0) {
                maskotPinOverlaps.push({ pin: p.no, area });
              }
            });
          }

          // 3. Ukur Target Sentuh Pin & Chips
          const pinTouchTargets = pins.map(p => ({
            no: p.no,
            width: p.rect.width,
            height: p.rect.height,
            isCompliant: p.rect.width >= 36 && p.rect.height >= 36 // with hit-extender to 44px
          }));

          const chips = Array.from(document.querySelectorAll('.peta-chip')).map(c => {
            const r = c.getBoundingClientRect();
            return {
              text: c.textContent.trim().replace(/\\s+/g, ' '),
              width: r.width,
              height: r.height,
              isCompliant: r.height >= 44
            };
          });

          // 4. Periksa Pulau Tetap Tampil Utuh (tidak display: none)
          const pulauIlustrasi = document.querySelector('.pulau-ilustrasi');
          const pulauRect = pulauIlustrasi ? pulauIlustrasi.getBoundingClientRect() : null;
          const isPulauVisible = pulauIlustrasi && window.getComputedStyle(pulauIlustrasi).display !== 'none' && pulauRect.width > 0;

          return {
            scrollW,
            docW,
            hasHorizontalScroll: scrollW > docW,
            pinCount: pins.length,
            pinOverlaps,
            totalPinOverlapArea: pinOverlaps.reduce((acc, o) => acc + o.area, 0),
            maskotPinOverlaps,
            totalMaskotOverlapArea: maskotPinOverlaps.reduce((acc, o) => acc + o.area, 0),
            isPulauVisible,
            pulauWidth: pulauRect ? pulauRect.width : 0,
            pulauHeight: pulauRect ? pulauRect.height : 0,
            pinTouchTargets,
            chips
          };
        })()
      `);
    };

    // 1. UJI VIEWPORT 1366x768 (Laptop / Smartboard)
    console.log('--- 1. Uji 1366x768 Zoom 100% ---');
    await setViewport(1366, 768);
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1200));
    await setRealGamificationData();
    await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
    await new Promise(r => setTimeout(r, 1200));

    const geo1366 = await auditMapGeometry();
    console.log('Geometri 1366:', JSON.stringify(geo1366, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_1366x768_peta_overview.png'));

    // UJI INTERAKSI POPOVER VIA CDP
    console.log('\n--- Uji Interaksi Popover Pin 1 (Pohon Kamus) ---');
    await evaluate(`document.getElementById('pin-1').click();`);
    await new Promise(r => setTimeout(r, 400));
    const popover1Status = await evaluate(`
      (() => {
        const pop = document.getElementById('popover-1');
        const pin = document.getElementById('pin-1');
        const r = pop.getBoundingClientRect();
        const docW = document.documentElement.clientWidth;
        const docH = document.documentElement.clientHeight;
        const balloon = document.getElementById('balon-sapa-maskot')?.textContent.trim();
        return {
          isHidden: pop.hasAttribute('hidden'),
          ariaExpanded: pin.getAttribute('aria-expanded'),
          rect: { top: r.top, left: r.left, width: r.width, height: r.height, right: r.right, bottom: r.bottom },
          withinScreen: r.left >= 0 && r.right <= docW && r.top >= 0 && r.bottom <= docH,
          balloonText: balloon
        };
      })()
    `);
    console.log('Status Popover 1:', JSON.stringify(popover1Status, null, 2));
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_1366x768_popover_terbuka.png'));

    // Uji buka Pin 2 (harus menutup Pin 1)
    console.log('\n--- Uji Buka Pin 2 (Single Active Popover) ---');
    await evaluate(`document.getElementById('pin-2').click();`);
    await new Promise(r => setTimeout(r, 400));
    const singlePopoverStatus = await evaluate(`
      (() => {
        const pop1Hidden = document.getElementById('popover-1').hasAttribute('hidden');
        const pop2Hidden = document.getElementById('popover-2').hasAttribute('hidden');
        return { pop1Hidden, pop2Hidden, exactlyOneOpen: pop1Hidden && !pop2Hidden };
      })()
    `);
    console.log('Single Popover Status:', singlePopoverStatus);

    // Uji Tutup dengan Escape
    console.log('\n--- Uji Tutup via Escape ---');
    await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));`);
    await new Promise(r => setTimeout(r, 400));
    const escStatus = await evaluate(`
      (() => {
        const allHidden = Array.from(document.querySelectorAll('.popover-lokasi')).every(p => p.hasAttribute('hidden'));
        return { allHidden };
      })()
    `);
    console.log('Escape Tutup Status:', escStatus);

    // 2. UJI VIEWPORT 1920x1080
    console.log('\n--- 2. Uji 1920x1080 Zoom 100% ---');
    await setViewport(1920, 1080);
    await new Promise(r => setTimeout(r, 600));
    const geo1920 = await auditMapGeometry();
    console.log('Geometri 1920 Overlap:', { pinOverlap: geo1920.totalPinOverlapArea, maskotOverlap: geo1920.totalMaskotOverlapArea, horizScroll: geo1920.hasHorizontalScroll });
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_1920x1080.png'));

    // 3. UJI TABLET 768x1024
    console.log('\n--- 3. Uji 768x1024 (Tablet) ---');
    await setViewport(768, 1024);
    await new Promise(r => setTimeout(r, 600));
    const geo768 = await auditMapGeometry();
    console.log('Geometri Tablet 768 Overlap:', { pinOverlap: geo768.totalPinOverlapArea, maskotOverlap: geo768.totalMaskotOverlapArea, isPulauVisible: geo768.isPulauVisible, horizScroll: geo768.hasHorizontalScroll });
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_tablet_768x1024.png'));

    // 4. UJI MOBILE 375x667
    console.log('\n--- 4. Uji 375x667 (Ponsel) ---');
    await setViewport(375, 667);
    await new Promise(r => setTimeout(r, 600));
    const geo375 = await auditMapGeometry();
    console.log('Geometri Ponsel 375:', {
      pinOverlap: geo375.totalPinOverlapArea,
      maskotOverlap: geo375.totalMaskotOverlapArea,
      isPulauVisible: geo375.isPulauVisible,
      pulauWidth: geo375.pulauWidth,
      pulauHeight: geo375.pulauHeight,
      horizScroll: geo375.hasHorizontalScroll,
      chipCount: geo375.chips.length
    });
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_mobile_375x667.png'));

    // 5. UJI ZOOM 125% (1093x614) & ZOOM 80% (1708x960)
    console.log('\n--- 5. Uji Zoom 125% (1093x614) ---');
    await setViewport(1093, 614);
    await new Promise(r => setTimeout(r, 600));
    const geoZoom125 = await auditMapGeometry();
    console.log('Geometri Zoom 125%:', { pinOverlap: geoZoom125.totalPinOverlapArea, horizScroll: geoZoom125.hasHorizontalScroll });
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_zoom125.png'));

    console.log('\n--- 6. Uji Zoom 80% (1708x960) ---');
    await setViewport(1708, 960);
    await new Promise(r => setTimeout(r, 600));
    const geoZoom80 = await auditMapGeometry();
    console.log('Geometri Zoom 80%:', { pinOverlap: geoZoom80.totalPinOverlapArea, horizScroll: geoZoom80.hasHorizontalScroll });
    await takeScreenshot(path.join(artifactDir, 'bukti_tahap3_zoom80.png'));

    // Simpan semua metrik ke audit_tahap3_raw.json
    const fullAudit = {
      timestamp: new Date().toISOString(),
      geo1366,
      popover1Status,
      singlePopoverStatus,
      escStatus,
      geo1920,
      geo768,
      geo375,
      geoZoom125,
      geoZoom80
    };
    fs.writeFileSync(path.join(artifactDir, 'audit_tahap3_raw.json'), JSON.stringify(fullAudit, null, 2));
    console.log('\nAudit Tahap 3 sukses disimpan ke audit_tahap3_raw.json!');

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error(e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

verifyTahap3();
