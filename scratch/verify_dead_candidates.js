const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('c:/Users/STEEL LEGEND/Downloads/KUPAS');

// List of dead adventure files in assets/
const deadAdventureAssets = [
  'assets/css/adventure-platformer.css',
  'assets/data/adventure-manifest.json',
  'assets/images/adventure/bg-sky.png',
  'assets/images/adventure/bg-trees.png',
  'assets/images/adventure/character-aliya.png',
  'assets/images/adventure/character-rara.png',
  'assets/images/adventure/character-spritesheet.png',
  'assets/images/adventure/level1-banner.png',
  'assets/images/adventure/tileset-grassland.png',
  'assets/js/adventure-audio.js',
  'assets/js/adventure-camera.js',
  'assets/js/adventure-character-config.js',
  'assets/js/adventure-entities.js',
  'assets/js/adventure-env-config.js',
  'assets/js/adventure-level1-data.js',
  'assets/js/adventure-parallax.js',
  'assets/js/adventure-physics.js',
  'assets/js/adventure-platformer.js',
  'assets/js/adventure-questions-data.js',
  'assets/js/adventure-questions.js',
  'assets/js/adventure-worlds-data.js'
];

console.log('=== VERIFYING DEAD ADVENTURE ASSETS ===');
let allConfirmedDead = true;

for (const rel of deadAdventureAssets) {
  const fullPath = path.join(projectRoot, rel);
  if (!fs.existsSync(fullPath)) {
    console.log(`[NOT FOUND] ${rel}`);
    continue;
  }
  
  // Search for mentions in any active file
  const activeExts = ['.html', '.js', '.css'];
  const activeFiles = [];
  function scan(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (['.git', 'node_modules', 'scratch', '.test_profile_kamus', '__pycache__'].includes(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (activeExts.includes(path.extname(e.name).toLowerCase())) {
        const r = path.relative(projectRoot, p).replace(/\\/g, '/');
        // Do not include the dead adventure assets themselves
        if (!deadAdventureAssets.includes(r)) {
          activeFiles.push(p);
        }
      }
    }
  }
  scan(projectRoot);

  const basename = path.basename(rel);
  const foundIn = [];
  for (const af of activeFiles) {
    const text = fs.readFileSync(af, 'utf8');
    if (text.includes(basename) || text.includes(rel)) {
      foundIn.push(path.relative(projectRoot, af).replace(/\\/g, '/'));
    }
  }

  if (foundIn.length > 0) {
    console.log(`[WARNING] ${rel} is referenced in active files:`, foundIn);
    allConfirmedDead = false;
  } else {
    console.log(`[CONFIRMED DEAD] ${rel} (0 active references)`);
  }
}

console.log(`\nAll 21 adventure assets confirmed 100% dead: ${allConfirmedDead}`);

