import fs from 'fs';

let content = fs.readFileSync('assets/js/kuis.js', 'utf8');
const hadCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

content = content.replace(
  /soalId = soalId \|\| res\.data\?\.\[0\]\?\.id;\s*\}\s*if \(kunciJawaban !== undefined/,
  'soalId = soalId || res.data?.[0]?.id;\n\n    if (kunciJawaban !== undefined'
);

if (hadCRLF) {
  content = content.replace(/\n/g, '\r\n');
}
fs.writeFileSync('assets/js/kuis.js', content, 'utf8');
console.log('Fixed brace via normalized CRLF');
