const https = require('https');
const fs = require('fs');
const path = require('path');

const cssUrl = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Grandstander:wght@600;700;800&display=swap';

https.get(cssUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let css = '';
  res.on('data', chunk => css += chunk);
  res.on('end', async () => {
    // Parse font-face blocks for latin subset
    const blocks = css.split('@font-face');
    const fontsDir = path.join(__dirname, '..', 'assets', 'fonts');
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }

    let localCss = '/* KUPAS Self-hosted Fonts (WOFF2 Latin Subset, font-display: swap) */\n\n';
    let totalBytes = 0;
    const downloaded = [];

    for (const b of blocks) {
      if (!b.includes('font-family')) continue;
      // We only care about latin subset
      if (!b.includes('/* latin */')) continue;

      const familyMatch = b.match(/font-family:\s*['"]?([^'";]+)['"]?;/);
      const styleMatch = b.match(/font-style:\s*([^;]+);/);
      const weightMatch = b.match(/font-weight:\s*([^;]+);/);
      const urlMatch = b.match(/url\((https:[^)]+\.woff2)\)/);
      const unicodeMatch = b.match(/unicode-range:\s*([^;]+);/);

      if (familyMatch && weightMatch && urlMatch) {
        const family = familyMatch[1].trim();
        const style = styleMatch ? styleMatch[1].trim() : 'normal';
        const weight = weightMatch[1].trim();
        const url = urlMatch[1].trim();
        const unicode = unicodeMatch ? unicodeMatch[1].trim() : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';

        const safeFamily = family.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${safeFamily}-${weight}-${style}.woff2`;
        const filePath = path.join(fontsDir, fileName);

        // Download WOFF2 file
        await new Promise((resolve, reject) => {
          https.get(url, (fRes) => {
            const chunks = [];
            fRes.on('data', c => chunks.push(c));
            fRes.on('end', () => {
              const buf = Buffer.concat(chunks);
              fs.writeFileSync(filePath, buf);
              totalBytes += buf.length;
              downloaded.push({ fileName, bytes: buf.length, family, weight });
              resolve();
            });
          }).on('error', reject);
        });

        localCss += `@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  font-display: swap;
  src: url('../fonts/${fileName}') format('woff2');
  unicode-range: ${unicode};
}

`;
      }
    }

    fs.writeFileSync(path.join(__dirname, '..', 'assets', 'css', 'fonts.css'), localCss, 'utf8');
    console.log('Fonts downloaded successfully:');
    downloaded.forEach(d => console.log(` - ${d.fileName} (${(d.bytes / 1024).toFixed(1)} KB) [${d.family} wght ${d.weight}]`));
    console.log(`\nTotal font payload size: ${(totalBytes / 1024).toFixed(1)} KB`);
  });
}).on('error', err => console.error('Error fetching CSS:', err));

