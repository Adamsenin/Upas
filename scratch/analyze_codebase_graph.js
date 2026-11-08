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
console.log(`Total files found: ${allFiles.length}`);

// Read all file contents into memory for fast searching
const fileContents = new Map();
for (const file of allFiles) {
  try {
    const ext = path.extname(file).toLowerCase();
    // Only read text files into memory
    if (['.html', '.js', '.css', '.json', '.md', '.py', '.sql', '.csv', '.svg'].includes(ext)) {
      fileContents.set(file, fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    // Binary or unreadable
  }
}

const results = [];

for (const targetFile of allFiles) {
  const relPath = path.relative(projectRoot, targetFile).replace(/\\/g, '/');
  const basename = path.basename(targetFile);
  const ext = path.extname(targetFile).toLowerCase();

  // References to this file from other files
  const inboundReferences = [];

  for (const [sourceFile, content] of fileContents.entries()) {
    if (sourceFile === targetFile) continue;
    const sourceRel = path.relative(projectRoot, sourceFile).replace(/\\/g, '/');

    // Check if source mentions target's relative path, basename, or name without extension
    const nameWithoutExt = path.basename(targetFile, ext);

    const hasRelPath = content.includes(relPath);
    const hasBasename = content.includes(basename);
    
    // Also check relative path from sourceFile to targetFile
    const relativeFromSource = path.relative(path.dirname(sourceFile), targetFile).replace(/\\/g, '/');
    const hasRelative = content.includes(relativeFromSource) || content.includes('./' + relativeFromSource);

    if (hasRelPath || hasBasename || hasRelative) {
      inboundReferences.push({
        source: sourceRel,
        matchType: hasRelPath ? 'relPath' : (hasRelative ? 'relative' : 'basename')
      });
    }
  }

  results.push({
    file: targetFile,
    relPath,
    basename,
    ext,
    inboundCount: inboundReferences.length,
    inboundReferences: inboundReferences.slice(0, 5) // first 5 for preview
  });
}

// Write full analysis to scratch/analysis_result.json
fs.writeFileSync(
  path.join(projectRoot, 'scratch', 'analysis_result.json'),
  JSON.stringify(results, null, 2)
);

console.log('Analysis complete. Summary by directory:');
const summary = {};
for (const r of results) {
  const topDir = r.relPath.split('/')[0];
  if (!summary[topDir]) summary[topDir] = { total: 0, zeroRefs: 0, hasRefs: 0 };
  summary[topDir].total++;
  if (r.inboundCount === 0) summary[topDir].zeroRefs++;
  else summary[topDir].hasRefs++;
}
console.table(summary);

