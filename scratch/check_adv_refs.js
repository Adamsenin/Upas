const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('c:/Users/STEEL LEGEND/Downloads/KUPAS');
const detailedAudit = JSON.parse(fs.readFileSync(path.join(projectRoot, 'scratch', 'deep_audit_result.json'), 'utf8'));

console.log('=== PROD REFS FOR ALL ADVENTURE FILES IN ASSETS ===');
const advFiles = detailedAudit.filter(f => f.relPath.includes('adventure'));
for (const f of advFiles) {
  console.log(`${f.relPath}:`);
  console.log('  prodRefs:', f.prodRefs);
  console.log('  scratchRefs:', f.scratchRefs.length);
}

