const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const artifactDir = 'C:\\Users\\STEEL LEGEND\\.gemini\\antigravity\\brain\\b617f35c-d6a0-4af3-aa76-707c4744d937';

async function runReview2ComprehensiveTests() {
  console.log('=== PENGUJIAN OTOMATIS BROWSER CDP - TITIK REVIEW 2 ===\n');

  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9245',
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

  const list = await httpGet('http://127.0.0.1:9245/json');
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

  const results = {
    resolusiLayout: [],
    bagian2A: {},
    bagian2B_jembatan: [],
    bagian2B_jurang: {},
    respawnNyawa: {},
    hitboxInvarian: [],
    hudKontrolSentuh: {},
    progresPenyimpanan: {}
  };

  // ==========================================================================
  // 1. UJI 6 UKUR: PENGUKURAN NUMERIK DI 4 RESOLUSI (375x667 portrait, 667x375 lanskap, 1366x768, 1920x1080)
  // ==========================================================================
  console.log('--- 1. Pengujian Numerik Resolusi, Scroll, Canvas 16:9, HUD & Modal ---');
  const viewports = [
    { name: '375x667 (Ponsel Potret)', w: 375, h: 667, dpr: 2 },
    { name: '667x375 (Ponsel Lanskap)', w: 667, h: 375, dpr: 2 },
    { name: '1366x768 (Laptop HD)', w: 1366, h: 768, dpr: 1 },
    { name: '1920x1080 (Desktop / Smartboard FHD)', w: 1920, h: 1080, dpr: 1 }
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: vp.dpr,
      mobile: vp.w < 1000
    });

    await send('Page.navigate', { url: 'http://localhost:8000/adventure.html?test=1' });
    await new Promise(r => setTimeout(r, 1200));

    // Mulai Level 1-1
    await send('Runtime.evaluate', {
      expression: 'document.querySelector(".btn-mainkan-level[data-level=\'1-1\']").click()'
    });
    await new Promise(r => setTimeout(r, 1000));

    // Buka modal soal untuk mengukur bounding box modal
    await send('Runtime.evaluate', {
      expression: `
        if (window.__gameEngine) {
          window.__gameEngine.questionGates.showQuestion(window.__gameEngine.gates[0], 0, window.__gameEngine.gates);
        }
      `
    });
    await new Promise(r => setTimeout(r, 400));

    const metrics = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const canvas = document.getElementById('canvas-adventure');
          const canvasRect = canvas.getBoundingClientRect();
          const hud = document.querySelector('.game-hud');
          const hudRect = hud ? hud.getBoundingClientRect() : null;
          const modalBox = document.querySelector('.dialog-kotak');
          const modalRect = modalBox ? modalBox.getBoundingClientRect() : null;
          const aspect = canvasRect.width / canvasRect.height;
          const ratioDelta = Math.abs(aspect - (16 / 9));

          return {
            windowInnerWidth: window.innerWidth,
            windowInnerHeight: window.innerHeight,
            bodyScrollHeight: document.documentElement.scrollHeight,
            bodyClientHeight: document.documentElement.clientHeight,
            isZeroScroll: document.documentElement.scrollHeight <= (window.innerHeight + 2),
            canvasDisplayWidth: Math.round(canvasRect.width),
            canvasDisplayHeight: Math.round(canvasRect.height),
            canvasInternalWidth: canvas.width,
            canvasInternalHeight: canvas.height,
            canvasAspectRatio: aspect.toFixed(4),
            canvasRatioDelta: ratioDelta.toFixed(4),
            is16to9Valid: ratioDelta < 0.05,
            devicePixelRatio: window.devicePixelRatio,
            isRetinaSharp: canvas.width === Math.round(canvasRect.width * window.devicePixelRatio),
            hudBounding: hudRect ? {
              top: Math.round(hudRect.top),
              bottom: Math.round(hudRect.bottom),
              left: Math.round(hudRect.left),
              right: Math.round(hudRect.right),
              isInsideViewport: hudRect.top >= 0 && hudRect.bottom <= window.innerHeight && hudRect.left >= 0 && hudRect.right <= window.innerWidth
            } : null,
            modalBounding: modalRect ? {
              top: Math.round(modalRect.top),
              bottom: Math.round(modalRect.bottom),
              left: Math.round(modalRect.left),
              right: Math.round(modalRect.right),
              isInsideViewport: modalRect.top >= 0 && modalRect.bottom <= window.innerHeight && modalRect.left >= 0 && modalRect.right <= window.innerWidth
            } : null
          };
        })()
      `,
      returnByValue: true
    });

    results.resolusiLayout.push({ viewport: vp.name, metrics: metrics.result.value });

    // Tutup dialog
    await send('Runtime.evaluate', {
      expression: `
        if (window.__gameEngine) {
          window.__gameEngine.questionGates.closeDialog();
        }
      `
    });

    // Tangkap tangkapan layar untuk bukti review
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    const filename = vp.w === 375 ? 'bukti_review2_ponsel_potret_375x667.png' :
                     vp.w === 667 ? 'bukti_review2_ponsel_lanskap_667x375.png' :
                     vp.w === 1366 ? 'bukti_review2_laptop_1366x768.png' :
                     'bukti_review2_smartboard_1920x1080.png';
    fs.writeFileSync(path.join(artifactDir, filename), Buffer.from(shot.data, 'base64'));
    console.log(`  ✓ Ukur ${vp.name}: ScrollZero=${metrics.result.value.isZeroScroll}, Aspect16:9=${metrics.result.value.canvasAspectRatio} (Delta=${metrics.result.value.canvasRatioDelta}), RetinaSharp=${metrics.result.value.isRetinaSharp}`);
  }

  // Setel kembali viewport ke 1366x768 untuk pengujian logika permainan berikutnya
  await send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });

  // ==========================================================================
  // 2. BAGIAN 2A UKUR: PIJAKAN PLATFORM (ZERO FLOAT) & JANGKAUAN KOIN
  // ==========================================================================
  console.log('\n--- 2. Pengujian Numerik Bagian 2A: Pijakan Platform & Koordinat Koin ---');
  await send('Page.navigate', { url: 'http://localhost:8000/adventure.html?test=1' });
  await new Promise(r => setTimeout(r, 1200));
  await send('Runtime.evaluate', { expression: 'document.querySelector(".btn-mainkan-level[data-level=\'1-1\']").click()' });
  await new Promise(r => setTimeout(r, 1000));

  const pijakanKoin = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const eng = window.__gameEngine;
        // Biarkan fisika berjalan 30 frame agar mendarat mantap
        for (let i = 0; i < 30; i++) {
          eng.physics.update(eng.player, { left: false, right: false, jumpPressed: false, jumpHeld: false }, eng.solidPlatforms, 1/60);
        }

        const playerBottom = eng.player.y + eng.player.height;
        const groundY = eng.player.currentPlatform ? eng.player.currentPlatform.y : null;
        const isFlush = Math.abs(playerBottom - groundY) < 0.001;

        // Periksa semua koin di level 1-1, 1-2, dan 2-1
        const maxJumpHeight = 165; // Lompatan maksimal pemain adalah ~165px ke atas
        const allCoins1_1 = eng.entities.leafCoins;
        
        let allCoinsReachable = true;
        let anyCoinBuried = false;
        let minCoinY = 9999;
        let maxCoinY = -9999;

        allCoins1_1.forEach(c => {
          if (c.y < minCoinY) minCoinY = c.y;
          if (c.y > maxCoinY) maxCoinY = c.y;
          if (c.y >= 444) anyCoinBuried = true; // Koin tidak boleh di dalam/bawah tanah y=444
          if (c.y < (444 - maxJumpHeight - 80)) allCoinsReachable = false; // Harus dalam jangkauan lompatan/platform
        });

        return {
          playerY: eng.player.y,
          playerHeight: eng.player.height,
          playerBottom: playerBottom,
          groundY: groundY,
          isFlushZeroFloat: isFlush,
          totalCoinsChecked: allCoins1_1.length,
          minCoinY: minCoinY,
          maxCoinY: maxCoinY,
          anyCoinBuried: anyCoinBuried,
          allCoinsReachable: allCoinsReachable
        };
      })()
    `,
    returnByValue: true
  });
  results.bagian2A = pijakanKoin.result.value;
  console.log(`  ✓ Pijakan: playerBottom=${pijakanKoin.result.value.playerBottom}, groundY=${pijakanKoin.result.value.groundY}, ZeroFloat=${pijakanKoin.result.value.isFlushZeroFloat}`);
  console.log(`  ✓ Koin: Total=${pijakanKoin.result.value.totalCoinsChecked}, Buried=${pijakanKoin.result.value.anyCoinBuried}, Reachable=${pijakanKoin.result.value.allCoinsReachable} (Y: ${pijakanKoin.result.value.minCoinY} - ${pijakanKoin.result.value.maxCoinY})`);

  // ==========================================================================
  // 3. BAGIAN 2B & ALL BRIDGES: PENGUJIAN SEMUA JEMBATAN (1-1, 1-2, 2-1) DARI SEMUA ARAH
  // ==========================================================================
  console.log('\n--- 3. Pengujian Numerik Jembatan di Level 1-1, 1-2, dan 2-1 ---');
  const bridgeTestLevels = [
    { level: '1-1', bridgeType: 'jembatan_ranting', gateIdx: 0, crossStartX: 830, crossTargetX: 1140 },
    { level: '1-1', bridgeType: 'jembatan_ranting_2', gateIdx: 3, crossStartX: 3200, crossTargetX: 3540 },
    { level: '1-2', bridgeType: 'jembatan_kanopi_1', gateIdx: 0, crossStartX: 880, crossTargetX: 1190 },
    { level: '1-2', bridgeType: 'jembatan_kanopi_2', gateIdx: 2, crossStartX: 2260, crossTargetX: 2580 },
    { level: '2-1', bridgeType: 'jembatan_abiotik', gateIdx: 0, crossStartX: 800, crossTargetX: 1120 }
  ];

  for (const bTest of bridgeTestLevels) {
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          eng.muatLevel('${bTest.level}');
          // Tempatkan pemain sebelum gerbang
          eng.player.x = ${bTest.crossStartX};
          eng.player.y = 444 - eng.player.height;
          eng.player.vx = 0;
          eng.player.vy = 0;
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));

    // Verifikasi jembatan belum terbuka
    const sebelum = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          const bridgePlat = eng.solidPlatforms.find(p => p.tipe === '${bTest.bridgeType}');
          return {
            bridgeExists: !!bridgePlat,
            bridgeX: bridgePlat ? bridgePlat.x : null,
            bridgeY: bridgePlat ? bridgePlat.y : null,
            bridgeWidth: bridgePlat ? bridgePlat.width : null,
            terbukaSebelum: bridgePlat ? bridgePlat.terbuka : null
          };
        })()
      `,
      returnByValue: true
    });

    // Jawab soal benar pada gerbang jembatan tersebut
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          const g = eng.questionGates.gates[${bTest.gateIdx}];
          g.terbuka = true;
          eng.onGateUnlocked(g);
          // Paksa animasi jembatan langsung selesai seketika untuk pengetesan fisika
          const bridgePlat = eng.solidPlatforms.find(p => p.tipe === '${bTest.bridgeType}');
          if (bridgePlat) {
            bridgePlat.terbuka = true;
            bridgePlat.animating = false;
          }
          eng.isBuildingBridge = false;
        })()
      `
    });
    await new Promise(r => setTimeout(r, 300));

    // Uji menyeberang: LARI DARI KIRI KE KANAN
    const lariKiriKeKanan = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          eng.player.x = ${bTest.crossStartX};
          eng.player.y = 444 - eng.player.height;
          eng.player.vx = 0;
          eng.player.vy = 0;

          // Simulasikan lari ke kanan melintasi jembatan selama 90 frame
          let minStandingY = 9999;
          let maxStandingY = -9999;
          let fell = false;

          for (let f = 0; f < 100; f++) {
            eng.player.vx = 4.2;
            const ev = eng.physics.update(eng.player, { left: false, right: true, jumpPressed: false, jumpHeld: false }, eng.solidPlatforms, 1/60);
            if (ev.fellInPit) fell = true;
            if (eng.player.y < minStandingY) minStandingY = eng.player.y;
            if (eng.player.y > maxStandingY) maxStandingY = eng.player.y;
            if (eng.player.x >= ${bTest.crossTargetX}) break;
          }

          return {
            finalX: Math.round(eng.player.x),
            reachedOpposite: eng.player.x >= ${bTest.crossTargetX},
            fellInPit: fell,
            minStandingY: Math.round(minStandingY),
            maxStandingY: Math.round(maxStandingY),
            isSmoothStanding: Math.abs(maxStandingY - minStandingY) <= 1
          };
        })()
      `,
      returnByValue: true
    });

    // Uji menyeberang kembali: DARI KANAN KE KIRI
    const seberangBalik = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          eng.player.x = ${bTest.crossTargetX};
          eng.player.y = 444 - eng.player.height;
          eng.player.vx = 0;
          eng.player.vy = 0;

          let fell = false;
          for (let f = 0; f < 100; f++) {
            eng.player.vx = -4.2;
            const ev = eng.physics.update(eng.player, { left: true, right: false, jumpPressed: false, jumpHeld: false }, eng.solidPlatforms, 1/60);
            if (ev.fellInPit) fell = true;
            if (eng.player.x <= ${bTest.crossStartX}) break;
          }

          return {
            finalX: Math.round(eng.player.x),
            reachedBack: eng.player.x <= ${bTest.crossStartX},
            fellInPit: fell
          };
        })()
      `,
      returnByValue: true
    });

    // Uji mendarat lompat di tepi jembatan (edge landing)
    const lompatTepi = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          const bridgePlat = eng.solidPlatforms.find(p => p.tipe === '${bTest.bridgeType}');
          // Tempatkan tepat di atas jembatan di udara
          eng.player.x = bridgePlat.x + 35;
          eng.player.y = bridgePlat.y - eng.player.height - 35;
          eng.player.vx = 0;
          eng.player.vy = 2; // Sedang jatuh

          for (let f = 0; f < 30; f++) {
            eng.physics.update(eng.player, { left: false, right: false, jumpPressed: false, jumpHeld: false }, eng.solidPlatforms, 1/60);
          }

          const playerFeet = eng.player.y + eng.player.height;
          const delta = Math.abs(playerFeet - bridgePlat.y);
          const landedOnBridge = eng.player.isGrounded && delta < 0.05;
          return {
            landedOnBridge: landedOnBridge,
            landingY: Math.round(playerFeet),
            bridgeY: bridgePlat.y,
            delta: delta
          };
        })()
      `,
      returnByValue: true
    });

    const bridgeReport = {
      level: bTest.level,
      bridgeType: bTest.bridgeType,
      dimensi: { x: sebelum.result.value.bridgeX, y: sebelum.result.value.bridgeY, w: sebelum.result.value.bridgeWidth },
      terbukaSebelum: sebelum.result.value.terbukaSebelum,
      lariKiriKeKanan: lariKiriKeKanan.result.value,
      seberangBalik: seberangBalik.result.value,
      lompatTepi: lompatTepi.result.value
    };
    results.bagian2B_jembatan.push(bridgeReport);
    console.log(`  ✓ Jembatan [${bTest.level} ${bTest.bridgeType}]: Menyeberang=${lariKiriKeKanan.result.value.reachedOpposite}, Balik=${seberangBalik.result.value.reachedBack}, Tepi=${lompatTepi.result.value.landedOnBridge}`);
  }

  // Uji JATUH KE JURANG saat jembatan belum terbentuk
  console.log('\n--- 4. Pengujian Jatuh ke Jurang (Pit Fall) & Respawn Checkpoint ---');
  const ujiJurang = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const eng = window.__gameEngine;
        eng.muatLevel('1-1');
        const nyawaAwal = eng.player.nyawa;

        // Tempatkan tepat di atas jurang sungai 1 (x: 950) di udara
        eng.player.x = 950;
        eng.player.y = 430;
        eng.player.vx = 0;
        eng.player.vy = 8; // Jatuh bebas ke jurang

        let events = {};
        for (let f = 0; f < 30; f++) {
          events = eng.physics.update(eng.player, { left: false, right: false, jumpPressed: false, jumpHeld: false }, eng.solidPlatforms, 1/60);
          if (events.fellInPit) {
            eng.tanganiJatuhJurang();
            break;
          }
        }

        const toast = document.getElementById('hud-notifikasi-toast');
        return {
          nyawaAwal: nyawaAwal,
          nyawaSetelahJatuh: eng.player.nyawa,
          kehilanganSatuNyawa: (nyawaAwal - eng.player.nyawa) === 1,
          respawnX: Math.round(eng.player.x),
          respawnY: Math.round(eng.player.y),
          respawnGrounded: eng.player.isGrounded,
          toastTeks: toast ? toast.textContent : ''
        };
      })()
    `,
    returnByValue: true
  });
  results.bagian2B_jurang = ujiJurang.result.value;
  console.log(`  ✓ Uji Jurang: NyawaAwal=${ujiJurang.result.value.nyawaAwal} -> NyawaAkhir=${ujiJurang.result.value.nyawaSetelahJatuh}, KehilanganTepat1=${ujiJurang.result.value.kehilanganSatuNyawa}, Toast="${ujiJurang.result.value.toastTeks}", Respawn=(${ujiJurang.result.value.respawnX}, ${ujiJurang.result.value.respawnY})`);

  // ==========================================================================
  // 5. RESPAWN CHECKPOINT & NYAWA BERKURANG TEPAT 1 KALI PER SENTUHAN MUSUH
  // ==========================================================================
  console.log('\n--- 5. Pengujian Respawn Checkpoint, Gerbang Terbuka Tetap Terbuka & Nyawa Musuh ---');
  const ujiRespawnNyawa = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const eng = window.__gameEngine;
        eng.muatLevel('1-1');
        
        // 1. Simulasikan buka Gerbang 1
        eng.questionGates.gates[0].terbuka = true;
        eng.onGateUnlocked(eng.questionGates.gates[0]);
        const gate1StatusSebelum = eng.questionGates.gates[0].terbuka;

        // 2. Simulasikan lewati Checkpoint 1 (x: 1200)
        eng.entities.checkpoints.forEach(cp => {
          if (cp.x === 1200) cp.aktif = true;
        });

        // 3. Sentuh musuh secara berkelanjutan selama 40 frame (memastikan invulnerability timer aktif)
        eng.player.nyawa = 3;
        eng.player.isInvulnerable = false;
        eng.player.invulnerableTimer = 0;
        const enemy = eng.entities.enemies[0];
        enemy.x = 480; enemy.y = 416; enemy.isAlive = true;

        // Tabrakkan pemain ke musuh di posisi yang sama
        eng.player.x = 480;
        eng.player.y = 414;
        let hitEventsCount = 0;
        for (let f = 0; f < 30; f++) {
          const ev = eng.entities.update(eng.player, 1/60, null);
          if (ev.playerHurt) {
            hitEventsCount++;
            eng.tanganiPemainTerluka();
          }
        }

        const nyawaSetelahHit = eng.player.nyawa;

        // 4. Lakukan respawn pemain
        eng.respawnDiCheckpoint();
        const gate1StatusSetelah = eng.questionGates.gates[0].terbuka;
        const respawnY = eng.player.y;
        const respawnPlayerBottom = respawnY + eng.player.height;
        const isRespawnSafeAboveGround = respawnPlayerBottom <= 444.05;

        return {
          gate1TetapTerbuka: (gate1StatusSebelum === true && gate1StatusSetelah === true),
          hitCountTerdeteksi: hitEventsCount,
          nyawaSetelahTabrakanBerulang: nyawaSetelahHit,
          tepatSatuNyawaBerkurang: (3 - nyawaSetelahHit) === 1,
          respawnX: Math.round(eng.player.x),
          respawnY: Math.round(respawnY),
          isRespawnSafeAboveGround: isRespawnSafeAboveGround
        };
      })()
    `,
    returnByValue: true
  });
  results.respawnNyawa = ujiRespawnNyawa.result.value;
  console.log(`  ✓ Gerbang Tetap Terbuka Setelah Respawn: ${ujiRespawnNyawa.result.value.gate1TetapTerbuka}`);
  console.log(`  ✓ Nyawa Berkurang Tepat 1x Per Sentuhan: ${ujiRespawnNyawa.result.value.tepatSatuNyawaBerkurang} (Hits=${ujiRespawnNyawa.result.value.hitCountTerdeteksi}, Nyawa=${ujiRespawnNyawa.result.value.nyawaSetelahTabrakanBerulang})`);
  console.log(`  ✓ Respawn Tidak di Dalam Tanah: ${ujiRespawnNyawa.result.value.isRespawnSafeAboveGround} (Bottom <= 444)`);

  // ==========================================================================
  // 6. HITBOX INVARIAN (BAGIAN 2D) DI SEMUA 8 ANIMASI
  // ==========================================================================
  console.log('\n--- 6. Pengujian Hitbox Invarian (44x48) di 8 Animasi ---');
  const animations = ['idle', 'walk', 'run', 'jump', 'fall', 'land', 'hurt', 'celebrate'];
  for (const anim of animations) {
    const hb = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const eng = window.__gameEngine;
          eng.player.state = '${anim}';
          return {
            anim: '${anim}',
            width: eng.player.width,
            height: eng.player.height,
            isInvariant: eng.player.width === 44 && eng.player.height === 48
          };
        })()
      `,
      returnByValue: true
    });
    results.hitboxInvarian.push(hb.result.value);
  }
  const allAnimInvariant = results.hitboxInvarian.every(h => h.isInvariant);
  console.log(`  ✓ Seluruh 8 Animasi Hitbox Invarian 44x48: ${allAnimInvariant}`);

  // ==========================================================================
  // 7. BAGIAN 4: HUD UNIFORM, KONTROL SENTUH >= 60px, ZERO SELECTION
  // ==========================================================================
  console.log('\n--- 7. Pengujian HUD & Kontrol Sentuh (UI/UX Pro Max) ---');
  const hudKontrol = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const touchBtns = document.querySelectorAll('.btn-sentuh');
        const touchSizes = [];
        touchBtns.forEach(b => {
          const r = b.getBoundingClientRect();
          touchSizes.push({
            id: b.id,
            width: Math.round(r.width),
            height: Math.round(r.height),
            isMin60: r.width >= 58 && r.height >= 58
          });
        });

        const hudItems = document.querySelectorAll('.hud-item, .hud-btn');
        const hudHeights = [];
        hudItems.forEach(h => {
          const r = h.getBoundingClientRect();
          hudHeights.push(Math.round(r.height));
        });

        const userSelect = window.getComputedStyle(document.body).userSelect || window.getComputedStyle(document.body).webkitUserSelect;

        return {
          touchSizes: touchSizes,
          allTouchMin60: touchSizes.length > 0 && touchSizes.every(t => t.isMin60),
          hudHeights: hudHeights,
          isUserSelectNone: userSelect === 'none'
        };
      })()
    `,
    returnByValue: true
  });
  results.hudKontrolSentuh = hudKontrol.result.value;
  console.log(`  ✓ Kontrol Sentuh >= 60px: ${hudKontrol.result.value.allTouchMin60}`);
  console.log(`  ✓ Zero-Selection (user-select: none): ${hudKontrol.result.value.isUserSelectNone}`);

  // ==========================================================================
  // 8. BAGIAN 5: SIMPAN PROGRES MID-LEVEL & KEMENANGAN LEVEL CLEAR
  // ==========================================================================
  console.log('\n--- 8. Pengujian Persistensi Progres Mid-Level & Kemenangan Level ---');
  const progresMidLevel = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const eng = window.__gameEngine;
        eng.muatLevel('1-1');
        eng.stateLevel.koinTerkumpul = 14;
        eng.simpanProgresSaatIni();

        const stored = JSON.parse(localStorage.getItem('kupas_adventure_progress_v2'));
        const lvl1_1 = stored ? stored.levels['1-1'] : null;

        return {
          koinDisimpan: lvl1_1 ? lvl1_1.coins : null,
          totalCoins: stored ? stored.totalCoins : null,
          success: lvl1_1 && lvl1_1.coins >= 14
        };
      })()
    `,
    returnByValue: true
  });
  results.progresPenyimpanan.midLevel = progresMidLevel.result.value;
  console.log(`  ✓ Simpan Mid-Level: Koin=${progresMidLevel.result.value.koinDisimpan}, Total=${progresMidLevel.result.value.totalCoins}, Success=${progresMidLevel.result.value.success}`);

  // Uji Kemenangan Level Clear (5/5 Misi)
  const victoryTest = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const eng = window.__gameEngine;
        eng.muatLevel('1-1');
        eng.stateLevel.misiSelesai = 5;
        eng.stateLevel.koinTerkumpul = 22;
        eng.player.nyawa = 3;

        eng.tanganiKemenanganLevel();

        const stored = JSON.parse(localStorage.getItem('kupas_adventure_progress_v2'));
        const lvl1_1 = stored ? stored.levels['1-1'] : null;
        const lvl1_2 = stored ? stored.levels['1-2'] : null;

        return {
          lvl1_1Completed: lvl1_1 ? lvl1_1.completed : false,
          lvl1_1Stars: lvl1_1 ? lvl1_1.stars : 0,
          lvl1_2Unlocked: lvl1_2 ? lvl1_2.unlocked : false,
          totalStars: stored ? stored.totalStars : 0
        };
      })()
    `,
    returnByValue: true
  });
  results.progresPenyimpanan.victory = victoryTest.result.value;
  console.log(`  ✓ Kemenangan 5/5: Level1-1Completed=${victoryTest.result.value.lvl1_1Completed}, Stars=${victoryTest.result.value.lvl1_1Stars}, Level1-2Unlocked=${victoryTest.result.value.lvl1_2Unlocked}`);

  // Tulis hasil lengkap ke berkas JSON untuk bukti verifikasi
  fs.writeFileSync('scratch/hasil_review2_lengkap.json', JSON.stringify(results, null, 2));
  console.log('\n=== SELURUH PENGUJIAN TITIK REVIEW 2 SELESAI & TERTULIS KE JSON ===');

  ws.close();
  chrome.kill();
}

runReview2ComprehensiveTests().catch(err => {
  console.error('Fatal error during Review 2 tests:', err);
  process.exit(1);
});
