const fs = require('fs');

const content = fs.readFileSync('guru/sesi.html', 'utf8');
const scriptMatch = content.match(/<script type="module">([\s\S]*?)<\/script>/);
if (scriptMatch) {
  const code = scriptMatch[1]
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import')
    .replace(/await\s+/g, '');
  fs.writeFileSync('scratch/test_syntax_sesi.js', code, 'utf8');
  console.log('Script extracted successfully');
} else {
  console.error('Script tag not found');
}

