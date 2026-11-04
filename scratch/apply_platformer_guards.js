import fs from 'fs';

let content = fs.readFileSync('assets/js/adventure-platformer.js', 'utf8');

// 1. Guard localStorage in AdventureAudio
content = content.replace(
  "this.muted = localStorage.getItem('kupas_suara_aktif') === 'false';",
  "this.muted = (typeof localStorage !== 'undefined') ? (localStorage.getItem('kupas_suara_aktif') === 'false') : false;"
);

// 2. Guard document in perbaruiHUD
content = content.replace(
`  perbaruiHUD() {
    const elKoin = document.getElementById('hud-koin-jumlah');
    const elMisi = document.getElementById('hud-misi-teks');
    if (elKoin) elKoin.textContent = this.stateLevel.koinTerkumpul;
    if (elMisi) elMisi.textContent = \`Misi: \${this.stateLevel.misiSelesai}/\${this.stateLevel.totalMisi}\`;
  }`,
`  perbaruiHUD() {
    if (typeof document === 'undefined') return;
    const elKoin = document.getElementById('hud-koin-jumlah');
    const elMisi = document.getElementById('hud-misi-teks');
    if (elKoin) elKoin.textContent = this.stateLevel.koinTerkumpul;
    if (elMisi) elMisi.textContent = \`Misi: \${this.stateLevel.misiSelesai}/\${this.stateLevel.totalMisi}\`;
  }`
);

// 3. Guard document in tampilkanKemenanganLevel
content = content.replace(
`    setTimeout(() => {
      const modal = document.getElementById('modal-victory-overlay');
      if (modal) {
        document.getElementById('victory-koin').textContent = \`+\${coins} Koin Daun 🍃\`;
        document.getElementById('victory-skor').textContent = \`Skor Petualangan: \${score}\`;
        modal.classList.add('aktif');
      }
    }, 1200);`,
`    setTimeout(() => {
      if (typeof document === 'undefined') return;
      const modal = document.getElementById('modal-victory-overlay');
      if (modal) {
        document.getElementById('victory-koin').textContent = \`+\${coins} Koin Daun 🍃\`;
        document.getElementById('victory-skor').textContent = \`Skor Petualangan: \${score}\`;
        modal.classList.add('aktif');
      }
    }, 1200);`
);

// 4. Barrier improvement in updateFisika:
content = content.replace(
`    // Penghalang Jembatan jika belum selesai diperbaiki
    if (!this.stateLevel.jembatanSelesai) {
      if (newX + p.width > 750 && p.x + p.width <= 750) {
        newX = 750 - p.width;
        p.vx = 0;
      }
    }`,
`    // Penghalang Jembatan jika belum selesai diperbaiki (x: 750 .. 960)
    if (!this.stateLevel.jembatanSelesai) {
      if (newX + p.width > 750 && p.x < 760) {
        newX = 750 - p.width;
        p.vx = 0;
      }
    }`
);

fs.writeFileSync('assets/js/adventure-platformer.js', content, 'utf8');
console.log('Guards and barrier updated in assets/js/adventure-platformer.js');

