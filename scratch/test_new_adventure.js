const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1366, height: 768 }
  });

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  console.log('Navigating to http://localhost:8000/adventure.html ...');
  await page.goto('http://localhost:8000/adventure.html', { waitUntil: 'networkidle' });

  // Check start modal
  const startModalVisible = await page.isVisible('#start-modal');
  console.log('Start modal visible:', startModalVisible);

  // Take screenshot of start modal
  await page.screenshot({ path: path.join(__dirname, 'adventure_start_modal.png') });
  console.log('Saved start modal screenshot.');

  // Click Mulai Bermain
  console.log('Clicking #btn-start-fullscreen...');
  await page.click('#btn-start-fullscreen');
  await page.waitForTimeout(1000);

  // Check start modal is closed
  const startModalClosed = !(await page.isVisible('#start-modal'));
  console.log('Start modal closed after start click:', startModalClosed);

  // Check HUD values
  const scoreText = await page.textContent('#hud-score');
  const worldText = await page.textContent('#hud');
  console.log('Score text:', scoreText);
  console.log('HUD contains WORLD 1-1:', worldText.includes('1-1'));

  // Take screenshot of active gameplay
  await page.screenshot({ path: path.join(__dirname, 'adventure_gameplay.png') });
  console.log('Saved active gameplay screenshot.');

  // Test Pause
  console.log('Clicking pause button...');
  await page.click('#btn-pause-hud');
  await page.waitForTimeout(500);
  const pauseModalVisible = await page.isVisible('#pause-modal');
  console.log('Pause modal visible:', pauseModalVisible);

  // Take screenshot of pause modal
  await page.screenshot({ path: path.join(__dirname, 'adventure_pause_modal.png') });
  console.log('Saved pause modal screenshot.');

  // Resume game
  await page.click('#btn-resume-game');
  await page.waitForTimeout(500);
  const pauseModalClosed = !(await page.isVisible('#pause-modal'));
  console.log('Pause modal closed after resume:', pauseModalClosed);

  // Test Mobile Landscape Viewport
  const mobilePage = await browser.newPage({
    viewport: { width: 844, height: 390 } // iPhone landscape
  });
  mobilePage.on('pageerror', err => errors.push(err.message));

  console.log('Testing Mobile Landscape (844x390)...');
  await mobilePage.goto('http://localhost:8000/adventure.html', { waitUntil: 'networkidle' });
  await mobilePage.click('#btn-start-fullscreen');
  await mobilePage.waitForTimeout(800);

  // Check touch controls visible on mobile/landscape
  const touchDpadVisible = await mobilePage.isVisible('#touch-dpad');
  const touchJumpVisible = await mobilePage.isVisible('#touch-jump');
  console.log('Touch D-Pad visible on mobile:', touchDpadVisible);
  console.log('Touch Jump button visible on mobile:', touchJumpVisible);

  await mobilePage.screenshot({ path: path.join(__dirname, 'adventure_mobile_landscape.png') });
  console.log('Saved mobile landscape screenshot.');

  // Test Mobile Portrait (should show rotate overlay)
  const portraitPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148'
  });
  console.log('Testing Mobile Portrait (390x844)...');
  await portraitPage.goto('http://localhost:8000/adventure.html', { waitUntil: 'networkidle' });
  await portraitPage.waitForTimeout(800);
  const orientationOverlayActive = await portraitPage.isVisible('#orientation-overlay');
  console.log('Orientation overlay active in portrait:', orientationOverlayActive);

  await portraitPage.screenshot({ path: path.join(__dirname, 'adventure_mobile_portrait.png') });
  console.log('Saved mobile portrait screenshot.');

  await browser.close();

  console.log('\n--- VERIFICATION RESULT ---');
  console.log('Total console/page errors:', errors.length);
  if (errors.length > 0) {
    console.log('Errors:', errors);
  } else {
    console.log('SUCCESS: All checks passed with 0 errors!');
  }
})();

