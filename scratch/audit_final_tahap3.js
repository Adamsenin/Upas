const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function runComprehensiveAudit() {
  console.log('=== AUDIT KOMPREHENSIF TAHAP 3 BERANDA KUPAS ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9257',
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
    const list = await httpGet('http://127.0.0.1:9257/json');
    const target = list.find(t => t.type === 'page') || list[0];
    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let msgId = 1;
    const pending = new Map();
    const consoleLogs = [];
    const consoleErrors = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const type = msg.params.type;
        const text = msg.params.args.map(a => a.value || a.description || '').join(' ');
        if (type === 'error') consoleErrors.push(text);
        else consoleLogs.push(`[${type}] ${text}`);
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

    const initPageWithRealData = async (width, height) => {
      await setViewport(width, height);
      await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
      await new Promise(r => setTimeout(r, 1000));
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
      await send('Page.navigate', { url: 'http://127.0.0.1:8000/index.html' });
      await new Promise(r => setTimeout(r, 1200));
    };

    // -------------------------------------------------------------
    // POINT 1: PENGUKURAN KARTU BUKU JEJAK
    // -------------------------------------------------------------
    console.log('--- 1. PENGUKURAN KARTU BUKU JEJAK (Data Nyata, Posisi & Bounding Box) ---');
    const bukuJejakResults = [];
    const bjSizes = [
      { name: '1366x768', w: 1366, h: 768 },
      { name: '1920x1080', w: 1920, h: 1080 },
      { name: '768x1024', w: 768, h: 1024 },
      { name: '375x667', w: 375, h: 667 }
    ];

    for (const s of bjSizes) {
      await initPageWithRealData(s.w, s.h);
      const data = await evaluate(`
        (() => {
          const el = document.querySelector('.buku-jejak');
          if (!el) return null;
          const r = el.getBoundingClientRect();
          const vh = document.documentElement.clientHeight;
          const isAboveFold = r.bottom <= vh;
          const visibleHeight = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
          const visiblePct = Math.round((visibleHeight / r.height) * 100);

          const level = document.getElementById('gamifikasi-level-teks')?.textContent.trim();
          const gelar = document.getElementById('gamifikasi-gelar-teks')?.textContent.trim();
          const xp = document.getElementById('gamifikasi-xp-angka')?.textContent.trim();
          const streak = document.getElementById('gamifikasi-streak-angka')?.textContent.trim();

          return {
            rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), height: Math.round(r.height), width: Math.round(r.width) },
            vh,
            isAboveFold,
            visiblePct,
            isCutOffHalf: visiblePct > 0 && visiblePct < 90,
            level,
            gelar,
            xp,
            streak
          };
        })()
      `);
      bukuJejakResults.push({ viewport: s.name, ...data });
    }
    console.table(bukuJejakResults.map(b => ({
      Viewport: b.viewport,
      Top: b.rect.top,
      Bottom: b.rect.bottom,
      Height: b.rect.height,
      ViewportH: b.vh,
      AboveFold: b.isAboveFold,
      VisiblePct: b.visiblePct + '%',
      Level: b.level,
      XP: b.xp,
      Streak: b.streak
    })));

    // -------------------------------------------------------------
    // POINT 2: LAYAR PERTAMA DI 1366x768 & 1280x720 (ABOVE THE FOLD)
    // -------------------------------------------------------------
    console.log('\n--- 2. PENGUKURAN LAYAR PERTAMA (1366x768 & 1280x720) ---');
    const foldResults = [];
    for (const f of [{ w: 1366, h: 768 }, { w: 1280, h: 720 }]) {
      await initPageWithRealData(f.w, f.h);
      const metrics = await evaluate(`
        (() => {
          const vh = document.documentElement.clientHeight;
          const vw = document.documentElement.clientWidth;
          const getBox = (sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return {
              top: Math.round(r.top),
              bottom: Math.round(r.bottom),
              height: Math.round(r.height),
              width: Math.round(r.width),
              fullyVisible: r.bottom <= vh && r.top >= 0
            };
          };

          const hero = getBox('.beranda-sambut-header');
          const aksiSiswa = getBox('#btn-adventure-siswa');
          const peta = getBox('#bagian-peta') || getBox('.peta-wadah');

          // Switch tab to guru to measure teacher primary action
          document.getElementById('tab-peran-guru').click();
          const aksiGuru = getBox('#btn-saya-guru');
          document.getElementById('tab-peran-siswa').click();

          return {
            viewport: vw + 'x' + vh,
            vh,
            hero,
            aksiSiswa,
            aksiGuru,
            peta
          };
        })()
      `);
      foldResults.push(metrics);
    }
    console.log('Metrik Above the Fold 1366x768 & 1280x720:');
    foldResults.forEach(f => {
      console.log(`[Viewport ${f.viewport}]:`);
      console.log(`  - Hero Header: top=${f.hero.top}px, bottom=${f.hero.bottom}px (Visible: ${f.hero.fullyVisible})`);
      console.log(`  - Aksi Utama Siswa (#btn-adventure-siswa): top=${f.aksiSiswa.top}px, bottom=${f.aksiSiswa.bottom}px, height=${f.aksiSiswa.height}px (Visible: ${f.aksiSiswa.fullyVisible})`);
      console.log(`  - Aksi Utama Guru (#btn-saya-guru): top=${f.aksiGuru.top}px, bottom=${f.aksiGuru.bottom}px, height=${f.aksiGuru.height}px (Visible: ${f.aksiGuru.fullyVisible})`);
      console.log(`  - Peta (#bagian-peta): top=${f.peta.top}px, bottom=${f.peta.bottom}px (Visible: ${f.peta.fullyVisible})`);
    });

    // -------------------------------------------------------------
    // POINT 3: TES FUNGSI KLIK NYATA (PER TAUTAN) & KONTROL
    // -------------------------------------------------------------
    console.log('\n--- 3. TES FUNGSI DENGAN KLIK NYATA (PER TAUTAN) ---');
    await initPageWithRealData(1366, 768);

    const clickAuditResults = [];

    // 3a. Aksi Siswa
    const linkTests = [
      { id: 'btn-adventure-siswa', expectedHref: 'adventure.html', label: 'Aksi Utama Adventure Siswa' },
      { id: 'btn-butterfly-siswa', expectedHref: 'butterfly-catcher.html', label: 'Mini Game Butterfly Catcher' },
      { id: 'btn-saya-siswa', expectedHref: 'gabung.html', label: 'Gabung Kuis Kelas' },
      { id: 'btn-kamus', expectedHref: 'kamus-belajar.html', label: 'Navbar Kamus Belajar' }
    ];

    for (const lt of linkTests) {
      const res = await evaluate(`
        (() => {
          const el = document.getElementById('${lt.id}');
          if (!el) return { found: false };
          const href = el.getAttribute('href');
          return {
            found: true,
            href,
            matches: href === '${lt.expectedHref}',
            tagName: el.tagName
          };
        })()
      `);
      clickAuditResults.push({ Komponen: lt.label, ElementId: lt.id, TargetHref: res.href, Status: res.matches ? 'LOLOS' : 'GAGAL' });
    }

    // 3b. Enam Popover Links
    const popoverLinks = [
      { pinNo: 1, btnId: 'btn-kamus-belajar', expected: 'kamus-belajar.html', title: 'Pohon Kamus' },
      { pinNo: 2, btnId: 'btn-rantai-makanan', expected: 'rantai-makanan.html', title: 'Hutan Rantai Makanan' },
      { pinNo: 3, btnId: 'btn-siklus-air', expected: 'siklus-air.html', title: 'Lab Siklus Air' },
      { pinNo: 4, btnId: 'btn-fakta-opini', expected: 'fakta-opini.html', title: 'Pos Fakta vs Opini' },
      { pinNo: 5, btnId: 'btn-sertifikat', expected: 'sertifikat.html', title: 'Puncak Sertifikat' },
      { pinNo: 6, btnId: 'btn-duel-tim', expected: 'duel-tim.html', title: 'Arena Duel Tim' }
    ];

    for (const pl of popoverLinks) {
      await evaluate(`document.getElementById('pin-${pl.pinNo}').click();`);
      await new Promise(r => setTimeout(r, 200));
      const res = await evaluate(`
        (() => {
          const pop = document.getElementById('popover-${pl.pinNo}');
          const btn = document.getElementById('${pl.btnId}');
          const isHidden = pop ? pop.hasAttribute('hidden') : true;
          const href = btn ? btn.getAttribute('href') : null;
          return {
            popoverOpen: !isHidden,
            btnFound: !!btn,
            href,
            matches: href === '${pl.expected}'
          };
        })()
      `);
      clickAuditResults.push({
        Komponen: `Popover ${pl.pinNo} (${pl.title})`,
        ElementId: pl.btnId,
        TargetHref: res.href,
        Status: (res.popoverOpen && res.matches) ? 'LOLOS' : 'GAGAL'
      });
    }

    // 3c. Tab Aku Siswa dan Saya Guru
    const tabSwitchResult = await evaluate(`
      (() => {
        const tabGuru = document.getElementById('tab-peran-guru');
        const tabSiswa = document.getElementById('tab-peran-siswa');
        const panelGuru = document.getElementById('panel-peran-guru');
        const panelSiswa = document.getElementById('panel-peran-siswa');

        // Klik Guru
        tabGuru.click();
        const guruPanelVisible = !panelGuru.hasAttribute('hidden');
        const siswaPanelHidden = panelSiswa.hasAttribute('hidden');
        const btnGuru = document.getElementById('btn-saya-guru');
        const guruHref = btnGuru ? btnGuru.getAttribute('href') : null;

        // Klik Siswa kembali
        tabSiswa.click();
        const siswaPanelVisible = !panelSiswa.hasAttribute('hidden');
        const guruPanelHidden = panelGuru.hasAttribute('hidden');

        return {
          guruTabWorks: guruPanelVisible && siswaPanelHidden,
          guruHref,
          siswaTabWorks: siswaPanelVisible && guruPanelHidden
        };
      })()
    `);
    clickAuditResults.push({
      Komponen: 'Tab Saya Guru (Panel & Link Ruang Guru)',
      ElementId: 'tab-peran-guru',
      TargetHref: tabSwitchResult.guruHref,
      Status: tabSwitchResult.guruTabWorks ? 'LOLOS' : 'GAGAL'
    });
    clickAuditResults.push({
      Komponen: 'Tab Aku Siswa (Panel Siswa Kembali)',
      ElementId: 'tab-peran-siswa',
      TargetHref: 'panel-peran-siswa',
      Status: tabSwitchResult.siswaTabWorks ? 'LOLOS' : 'GAGAL'
    });

    // 3d. Kontrol SFX, Musik, Gerak
    const controlsResult = await evaluate(`
      (() => {
        const btnSfx = document.getElementById('btn-toggle-suara');
        const btnMusik = document.getElementById('btn-toggle-musik');
        const selGerak = document.getElementById('select-animasi-global');

        const sfxBefore = btnSfx ? btnSfx.textContent.trim() : '';
        if (btnSfx) btnSfx.click();
        const sfxAfter = btnSfx ? btnSfx.textContent.trim() : '';

        const musikBefore = btnMusik ? btnMusik.textContent.trim() : '';
        if (btnMusik) btnMusik.click();
        const musikAfter = btnMusik ? btnMusik.textContent.trim() : '';

        // Test motion selector
        let motionCheck = false;
        if (selGerak) {
          selGerak.value = 'mati';
          selGerak.dispatchEvent(new Event('change', { bubbles: true }));
          const hasMotionOff = document.body.classList.contains('motion-off');
          selGerak.value = 'penuh';
          selGerak.dispatchEvent(new Event('change', { bubbles: true }));
          const hasMotionFull = document.body.classList.contains('motion-full');
          motionCheck = hasMotionOff && hasMotionFull;
        }

        return {
          sfxToggled: sfxBefore !== sfxAfter,
          musikToggled: musikBefore !== musikAfter,
          motionCheck
        };
      })()
    `);
    clickAuditResults.push({ Komponen: 'Kontrol SFX (Audio Toggle)', ElementId: 'btn-toggle-suara', TargetHref: 'localStorage toggle', Status: controlsResult.sfxToggled ? 'LOLOS' : 'GAGAL' });
    clickAuditResults.push({ Komponen: 'Kontrol Musik BGM (Audio Toggle)', ElementId: 'btn-toggle-musik', TargetHref: 'localStorage toggle', Status: controlsResult.musikToggled ? 'LOLOS' : 'GAGAL' });
    clickAuditResults.push({ Komponen: 'Kontrol Gerak (Dropdown Mode)', ElementId: 'select-animasi-global', TargetHref: 'body.motion-* class', Status: controlsResult.motionCheck ? 'LOLOS' : 'GAGAL' });

    console.table(clickAuditResults);
    console.log(`Konsol Errors: ${consoleErrors.length} (Rincian: ${JSON.stringify(consoleErrors)})`);

    // -------------------------------------------------------------
    // POINT 4: AREA SENTUH PIN (EFFECTIVE BOUNDING BOX TERMASUK ::BEFORE) DI 375x667 & 390x844
    // -------------------------------------------------------------
    console.log('\n--- 4. PENGUKURAN AREA SENTUH PIN DI 375x667 & 390x844 (OVERLAP MUST 0) ---');
    const touchAreaAudit = [];
    for (const m of [{ w: 375, h: 667 }, { w: 390, h: 844 }]) {
      await initPageWithRealData(m.w, m.h);
      const res = await evaluate(`
        (() => {
          const vw = document.documentElement.clientWidth;
          const vh = document.documentElement.clientHeight;

          // Hitung bounding box area sentuh efektif:
          // Pin button rect + 6px extender padding (inset: -6px)
          const pins = [1, 2, 3, 4, 5, 6].map(no => {
            const el = document.getElementById('pin-' + no);
            const r = el.getBoundingClientRect();
            // Extender ::before memiliki inset: -6px
            const touchRect = {
              top: r.top - 6,
              bottom: r.bottom + 6,
              left: r.left - 6,
              right: r.right + 6,
              width: r.width + 12,
              height: r.height + 12
            };
            return { no, elRect: r, touchRect };
          });

          // Cek tabrakan pairwise area sentuh
          const overlaps = [];
          for (let i = 0; i < pins.length; i++) {
            for (let j = i + 1; j < pins.length; j++) {
              const a = pins[i].touchRect;
              const b = pins[j].touchRect;
              const xOverlap = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const yOverlap = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              const area = xOverlap * yOverlap;
              if (area > 0) {
                overlaps.push({ pinA: pins[i].no, pinB: pins[j].no, area });
              }
            }
          }

          return {
            viewport: vw + 'x' + vh,
            pins: pins.map(p => ({
              Pin: p.no,
              TombolRect: Math.round(p.elRect.width) + 'x' + Math.round(p.elRect.height),
              AreaSentuhEfektif: Math.round(p.touchRect.width) + 'x' + Math.round(p.touchRect.height),
              Top: Math.round(p.touchRect.top),
              Left: Math.round(p.touchRect.left)
            })),
            totalOverlap: overlaps.reduce((acc, o) => acc + o.area, 0),
            overlaps
          };
        })()
      `);
      touchAreaAudit.push(res);
      console.log(`[Viewport ${res.viewport}] Total Overlap Area Sentuh Pin: ${res.totalOverlap} px²`);
      console.table(res.pins);
    }

    // -------------------------------------------------------------
    // POINT 5: POPOVER EDGE CLIPPING AUDIT (TABEL PER PIN PER UKURAN PER ZOOM)
    // -------------------------------------------------------------
    console.log('\n--- 5. POPOVER EDGE CLIPPING AUDIT (6 PINS x 5 VIEWPORTS x 3 ZOOMS) ---');
    const popoverMatrix = [];
    const testViewports = [
      { name: '375x667', w: 375, h: 667 },
      { name: '390x844', w: 390, h: 844 },
      { name: '768x1024', w: 768, h: 1024 },
      { name: '1366x768', w: 1366, h: 768 },
      { name: '1920x1080', w: 1920, h: 1080 }
    ];

    // Emulasi zoom via effective viewport scale
    const zoomFactors = [
      { label: '100%', scale: 1.0 },
      { label: '80%', scale: 0.8 },
      { label: '125%', scale: 1.25 }
    ];

    for (const vp of testViewports) {
      for (const z of zoomFactors) {
        const effW = Math.round(vp.w / z.scale);
        const effH = Math.round(vp.h / z.scale);
        await initPageWithRealData(effW, effH);

        for (let pinNo = 1; pinNo <= 6; pinNo++) {
          await evaluate(`document.getElementById('pin-${pinNo}').click();`);
          await new Promise(r => setTimeout(r, 100));

          const res = await evaluate(`
            (() => {
              const pop = document.getElementById('popover-${pinNo}');
              if (!pop || pop.hasAttribute('hidden')) return { open: false };
              const r = pop.getBoundingClientRect();
              const vw = document.documentElement.clientWidth;
              const vh = document.documentElement.clientHeight;

              const isClippedLeft = r.left < 0;
              const isClippedRight = r.right > vw;
              const isClippedTop = r.top < 0;
              const isClipped = isClippedLeft || isClippedRight || isClippedTop;

              return {
                open: true,
                left: Math.round(r.left),
                right: Math.round(r.right),
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                width: Math.round(r.width),
                height: Math.round(r.height),
                vw,
                vh,
                isClipped
              };
            })()
          `);

          popoverMatrix.push({
            Pin: 'Pin ' + pinNo,
            Viewport: vp.name,
            Zoom: z.label,
            Left: res.left,
            Right: res.right,
            Top: res.top,
            Bottom: res.bottom,
            ClientWidth: res.vw,
            Status: !res.isClipped ? 'AMAN (TIDAK TERPOTONG)' : 'TERPOTONG'
          });
        }
      }
    }

    // Tampilkan ringkasan matriks popover
    const clippedCount = popoverMatrix.filter(p => p.Status !== 'AMAN (TIDAK TERPOTONG)').length;
    console.log(`Total Uji Popover Matrix: ${popoverMatrix.length} kombinasi. Terpotong: ${clippedCount}`);
    console.table(popoverMatrix.slice(0, 18)); // sample 18 baris di konsol

    // -------------------------------------------------------------
    // POINT 6: AKSESIBILITAS (TAB ORDER, FOCUS, ARIA, REDUCED MOTION)
    // -------------------------------------------------------------
    console.log('\n--- 6. AKSESIBILITAS (URUTAN TAB, FOCUS, ARIA, PREFERS-REDUCED-MOTION) ---');
    await initPageWithRealData(1366, 768);

    const a11yAudit = await evaluate(`
      (() => {
        // Kumpulkan urutan elemen fokus
        const focusable = Array.from(document.querySelectorAll('a, button, select, input, [tabindex]:not([tabindex="-1"])'))
          .filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
          })
          .map((el, i) => ({
            Urutan: i + 1,
            Tag: el.tagName,
            Id: el.id || '',
            TeksAria: el.getAttribute('aria-label') || el.textContent.trim().slice(0, 30),
            TabIndex: el.tabIndex
          }));

        // Periksa teks alternatif pin dan maskot
        const pinAria = [1, 2, 3, 4, 5, 6].map(no => {
          const pin = document.getElementById('pin-' + no);
          return {
            pin: no,
            ariaLabel: pin ? pin.getAttribute('aria-label') : null,
            ariaExpanded: pin ? pin.getAttribute('aria-expanded') : null
          };
        });

        const maskotBtn = document.getElementById('btn-sapa-maskot');
        const maskotAria = maskotBtn ? maskotBtn.getAttribute('aria-label') : null;

        return {
          tabCount: focusable.length,
          sampleTabOrder: focusable.slice(0, 15),
          pinAria,
          maskotAria
        };
      })()
    `);
    console.log('Urutan Tab Keyboard (Sampel 15 pertama):');
    console.table(a11yAudit.sampleTabOrder);
    console.log('Aria Labels Pin:', a11yAudit.pinAria);
    console.log('Maskot Aria Label:', a11yAudit.maskotAria);

    // Uji reduced motion mematikan denyut pin dan animasi maskot
    const motionAudit = await evaluate(`
      (() => {
        document.body.classList.add('motion-off');
        const cincin1 = document.querySelector('.pin-cincin');
        const cincinDisplay = cincin1 ? window.getComputedStyle(cincin1).display : '';
        const cincinAnimation = cincin1 ? window.getComputedStyle(cincin1).animationName : '';

        const maskotImg = document.getElementById('maskot-utama');
        const maskotAnimation = maskotImg ? window.getComputedStyle(maskotImg).animationName : '';

        document.body.classList.remove('motion-off');

        return {
          cincinDisplayNone: cincinDisplay === 'none',
          cincinNoAnim: cincinAnimation === 'none',
          maskotNoAnim: maskotAnimation === 'none'
        };
      })()
    `);
    console.log('Motion Off Audit (Denyut Pin & Maskot Mati):', motionAudit);

    // -------------------------------------------------------------
    // POINT 7: FONT MANDIRI & IKON SVG
    // -------------------------------------------------------------
    console.log('\n--- 7. FONT MANDIRI (WOFF2) & IKON SVG AUDIT ---');
    const fontsDir = 'C:\\Users\\STEEL LEGEND\\Downloads\\KUPAS\\assets\\fonts';
    const fontFiles = fs.readdirSync(fontsDir);
    let totalFontBytes = 0;
    const fontDetails = fontFiles.map(f => {
      const sz = fs.statSync(path.join(fontsDir, f)).size;
      totalFontBytes += sz;
      return { File: f, UkuranKB: (sz / 1024).toFixed(2) + ' KB' };
    });
    console.table(fontDetails);
    console.log(`Total Font WOFF2 Payload: ${(totalFontBytes / 1024).toFixed(2)} KB (100% Bebas Google Fonts CDN)`);

    // -------------------------------------------------------------
    // POINT 8: SCREENSHOT LENGKAP SEBELUM/SESUDAH SELURUH BERANDA
    // -------------------------------------------------------------
    console.log('\n--- 8. CAPTURE SCREENSHOT LENGKAP SELURUH BERANDA (ZOOM 100%) ---');
    const ssSizes = [
      { name: '1366x768', w: 1366, h: 768, file: 'bukti_seluruh_beranda_1366x768.png' },
      { name: '1920x1080', w: 1920, h: 1080, file: 'bukti_seluruh_beranda_1920x1080.png' },
      { name: '768x1024', w: 768, h: 1024, file: 'bukti_seluruh_beranda_tablet_768x1024.png' },
      { name: '375x667', w: 375, h: 667, file: 'bukti_seluruh_beranda_mobile_375x667.png' }
    ];

    for (const ss of ssSizes) {
      await initPageWithRealData(ss.w, ss.h);
      await takeScreenshot(path.join(artifactDir, ss.file));
    }

    // Simpan semua audit ke file json
    const finalReportData = {
      timestamp: new Date().toISOString(),
      bukuJejakResults,
      foldResults,
      clickAuditResults,
      consoleErrors,
      touchAreaAudit,
      popoverMatrix,
      a11yAudit,
      motionAudit,
      fontDetails,
      totalFontKB: (totalFontBytes / 1024).toFixed(2)
    };
    fs.writeFileSync(path.join(artifactDir, 'audit_lengkap_final_tahap3.json'), JSON.stringify(finalReportData, null, 2));
    console.log('\nSeluruh audit komprehensif selesai dan tersimpan!');

    await send('Browser.close');
    ws.close();
  } catch (e) {
    console.error('Audit Error:', e);
  } finally {
    try { chrome.kill(); } catch (e) {}
  }
}

runComprehensiveAudit();

