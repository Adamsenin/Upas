const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('c:/Users/STEEL LEGEND/Downloads/KUPAS');
const IGNORED_DIRS = new Set(['.git', 'node_modules', 'dist', 'build']);

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const all = getAllFiles(projectRoot);
console.log('Total files across whole repo:', all.length);

const groupA = [
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

const groupB = [
  '.test_profile_kamus/Local State',
  '.test_profile_kamus/Variations',
  '.test_profile_kamus/VariationsSafeSeedV2',
  '.test_profile_kamus/VariationsSeedV2',
  '.test_profile_kamus/Crashpad/metadata',
  '.test_profile_kamus/Crashpad/settings.dat',
  '__pycache__/debug_session.cpython-312.pyc',
  '__pycache__/verify_all.cpython-312.pyc'
];

const groupC = all.filter(f => {
  const r = path.relative(projectRoot, f).replace(/\\/g, '/');
  return r.startsWith('scratch/');
});

const activeToKeep = all.filter(f => {
  const r = path.relative(projectRoot, f).replace(/\\/g, '/');
  if (groupA.includes(r)) return false;
  if (groupB.includes(r)) return false;
  if (r.startsWith('scratch/')) return false;
  return true;
});

console.log('Group A (Dead Adventure Assets):', groupA.length);
console.log('Group B (Cache / Temp Runtime):', groupB.length);
console.log('Group C (Scratch Directory Files):', groupC.length);
console.log('Active Files to KEEP:', activeToKeep.length);
console.log('Sum:', groupA.length + groupB.length + groupC.length + activeToKeep.length);

