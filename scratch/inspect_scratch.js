const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve('c:/Users/STEEL LEGEND/Downloads/KUPAS');
const scratchDir = path.join(projectRoot, 'scratch');

const scratchFiles = fs.readdirSync(scratchDir, { withFileTypes: true });
console.log(`Total items in scratch: ${scratchFiles.length}`);

const fileCategories = {
  js: [],
  py: [],
  json: [],
  png: [],
  csv: [],
  dirs: [],
  other: []
};

for (const f of scratchFiles) {
  if (f.isDirectory()) {
    fileCategories.dirs.push(f.name);
  } else {
    const ext = path.extname(f.name).toLowerCase().replace('.', '');
    if (fileCategories[ext]) {
      fileCategories[ext].push(f.name);
    } else {
      fileCategories.other.push(f.name);
    }
  }
}

for (const [cat, list] of Object.entries(fileCategories)) {
  console.log(`${cat.toUpperCase()} (${list.length}):`);
  if (list.length <= 10) {
    console.log(list.map(n => '  ' + n).join('\n'));
  } else {
    console.log(list.slice(0, 10).map(n => '  ' + n).join('\n') + `\n  ... and ${list.length - 10} more`);
  }
}

