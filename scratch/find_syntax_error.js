import fs from 'fs';

const src = fs.readFileSync('assets/js/kuis.js', 'utf8');

// Replace export/import with dummy to test with Function constructor
const scriptOnly = src
  .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
  .replace(/export\s+const\s+/g, 'const ')
  .replace(/export\s+async\s+function\s+/g, 'async function ')
  .replace(/export\s+function\s+/g, 'function ')
  .replace(/export\s+default\s+/g, 'const defaultExport = ')
  .replace(/export\s*\{[\s\S]*?\};?/g, '');

const lines = scriptOnly.split('\n');

for (let i = 1; i <= lines.length; i++) {
  const code = lines.slice(0, i).join('\n');
  try {
    new Function(code);
  } catch (err) {
    if (err.message.includes("Unexpected token 'if'")) {
      console.log(`Syntax error at original line ~${i}:`, lines[i - 1]);
      // print 5 lines before and after
      console.log('--- Context ---');
      for (let j = Math.max(0, i - 5); j < Math.min(lines.length, i + 5); j++) {
        console.log(`${j + 1}: ${lines[j]}`);
      }
      break;
    }
  }
}

