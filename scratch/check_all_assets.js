const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('c:/Users/STEEL LEGEND/Downloads/KUPAS');
const detailedAudit = JSON.parse(fs.readFileSync(path.join(projectRoot, 'scratch', 'deep_audit_result.json'), 'utf8'));

console.log('=== ALL ASSETS FILES AND THEIR PROD REFS ===');
const nonAdvAssets = detailedAudit.filter(f => f.relPath.startsWith('assets/') && !f.relPath.includes('adventure'));
for (const f of nonAdvAssets) {
  console.log(`${f.relPath}: ${f.prodRefs.length > 0 ? 'ACTIVE (' + f.prodRefs.join(', ') + ')' : 'DEAD / UNREFERENCED'}`);
}

