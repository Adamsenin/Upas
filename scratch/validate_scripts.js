const fs = require('fs');

const files = ['guru/editor.html', 'guru/sesi.html', 'siswa/main.html'];
let hasError = false;

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let idx = 0;
  while ((match = regex.exec(content)) !== null) {
    idx++;
    let script = match[1].trim();
    if (!script) continue;
    script = script.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '// import');
    script = script.replace(/import\s+['"][^'"]+['"];?/g, '// import');
    script = script.replace(/export\s+[\s\S]*?;/g, '// export');
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      new AsyncFunction(script);
      console.log(`[PASS] ${f} (script #${idx})`);
    } catch (err) {
      console.error(`[FAIL] ${f} (script #${idx}):`, err.message);
      hasError = true;
    }
  }
});

if (hasError) {
  process.exit(1);
} else {
  console.log('All inline scripts syntax OK!');
}
