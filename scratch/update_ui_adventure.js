import fs from 'fs';

let content = fs.readFileSync('assets/js/ui.js', 'utf8');
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Offcanvas mobile menu
const oldOffcanvas = `<a href="\${berandaHref}" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Beranda Utama</span>
              </a>`;

const newOffcanvas = `<a href="\${berandaHref}" class="btn btn-kupas-putih w-100 justify-content-start d-flex align-items-center gap-2">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                <span>Beranda Utama</span>
              </a>
              <a href="\${root}adventure.html" class="btn btn-kupas-kuning w-100 justify-content-start d-flex align-items-center gap-2 fw-bold">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span>Adventure: Petualangan IPAS</span>
              </a>`;

content = content.replace(oldOffcanvas, newOffcanvas);

// 2. Desktop navbar button next to Kamus
const oldDesktopKamus = `<!-- Tombol Kamus Belajar Cepat (Desktop) -->
            <a href="\${root}kamus-belajar.html" class="btn btn-outline-success btn-sm fw-bold d-none d-lg-inline-flex align-items-center gap-1" aria-label="Buka Kamus Belajar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
              <span>Kamus</span>
            </a>`;

const newDesktopKamus = `<!-- Tombol Adventure Cepat (Desktop) -->
            <a href="\${root}adventure.html" class="btn btn-success btn-sm fw-bold d-none d-lg-inline-flex align-items-center gap-1 text-white shadow-sm" aria-label="Buka Adventure Mandiri" style="background-color: var(--n-pandan, #2E7D4F); border: 2px solid var(--n-rimba, #1B3A2F);">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span>Adventure</span>
            </a>

            <!-- Tombol Kamus Belajar Cepat (Desktop) -->
            <a href="\${root}kamus-belajar.html" class="btn btn-outline-success btn-sm fw-bold d-none d-lg-inline-flex align-items-center gap-1" aria-label="Buka Kamus Belajar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
              <span>Kamus</span>
            </a>`;

content = content.replace(oldDesktopKamus, newDesktopKamus);

// 3. Bottom nav for mobile
const oldBottomNav = `<a href="\${berandaHref}" class="kupas-bottom-nav-item \${pathSekarang.endsWith('index.html') || pathSekarang.endsWith('/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          <span>Beranda</span>
        </a>
        <a href="\${root}gabung.html"`;

const newBottomNav = `<a href="\${berandaHref}" class="kupas-bottom-nav-item \${pathSekarang.endsWith('index.html') || pathSekarang.endsWith('/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          <span>Beranda</span>
        </a>
        <a href="\${root}adventure.html" class="kupas-bottom-nav-item \${pathSekarang.includes('adventure.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </span>
          <span>Adventure</span>
        </a>
        <a href="\${root}gabung.html"`;

content = content.replace(oldBottomNav, newBottomNav);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync('assets/js/ui.js', content, 'utf8');
console.log('Successfully updated assets/js/ui.js with Adventure navigation');
