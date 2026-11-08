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

const allFiles = getAllFiles(projectRoot);

const fileContents = new Map();
for (const file of allFiles) {
  try {
    const ext = path.extname(file).toLowerCase();
    if (['.html', '.js', '.css', '.json', '.md', '.py', '.sql', '.csv', '.svg'].includes(ext)) {
      fileContents.set(file, fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {}
}

const isProductionSource = (filePath) => {
  const rel = path.relative(projectRoot, filePath).replace(/\\/g, '/');
  if (rel.startsWith('scratch/')) return false;
  if (rel.startsWith('.test_profile_kamus/')) return false;
  if (rel.startsWith('__pycache__/')) return false;
  if (rel.startsWith('verify_')) return false;
  return true;
};

const detailedAudit = [];

for (const targetFile of allFiles) {
  const relPath = path.relative(projectRoot, targetFile).replace(/\\/g, '/');
  const basename = path.basename(targetFile);
  const ext = path.extname(targetFile).toLowerCase();

  const prodRefs = [];
  const scratchRefs = [];

  for (const [sourceFile, content] of fileContents.entries()) {
    if (sourceFile === targetFile) continue;
    const sourceRel = path.relative(projectRoot, sourceFile).replace(/\\/g, '/');

    const hasRelPath = content.includes(relPath);
    const hasBasename = content.includes(basename);
    const relativeFromSource = path.relative(path.dirname(sourceFile), targetFile).replace(/\\/g, '/');
    const hasRelative = content.includes(relativeFromSource) || content.includes('./' + relativeFromSource);

    if (hasRelPath || hasBasename || hasRelative) {
      const refItem = { source: sourceRel };
      if (isProductionSource(sourceFile)) {
        prodRefs.push(refItem);
      } else {
        scratchRefs.push(refItem);
      }
    }
  }

  detailedAudit.push({
    relPath,
    basename,
    ext,
    isProdFile: isProductionSource(targetFile),
    prodRefCount: prodRefs.length,
    prodRefs: prodRefs.map(r => r.source),
    scratchRefCount: scratchRefs.length,
    scratchRefs: scratchRefs.map(r => r.source)
  });
}

// Filter files in assets/ and see which have ZERO prod references
console.log('=== ASSETS FILES WITH ZERO PROD REFERENCES ===');
const zeroProdAssets = detailedAudit.filter(f => f.relPath.startsWith('assets/') && f.prodRefCount === 0);
console.log(zeroProdAssets.map(f => ({ path: f.relPath, scratchRefs: f.scratchRefCount })));

console.log('\n=== ROOT / NON-SCRATCH FILES WITH ZERO PROD REFERENCES ===');
const zeroProdRoot = detailedAudit.filter(f => !f.relPath.startsWith('scratch/') && !f.relPath.startsWith('assets/') && f.prodRefCount === 0);
console.log(zeroProdRoot.map(f => ({ path: f.relPath, scratchRefs: f.scratchRefCount })));

fs.writeFileSync(
  path.join(projectRoot, 'scratch', 'deep_audit_result.json'),
  JSON.stringify(detailedAudit, null, 2)
);

