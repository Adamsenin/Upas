import fs from 'fs';

let code = fs.readFileSync('assets/js/ui.js', 'utf8');

const targetStr = `  // Pasang Sidebar untuk Laptop (>=1024px) bila halaman guru`;
const idx = code.indexOf(targetStr);
if (idx === -1) {
  console.error('Target not found');
  process.exit(1);
}

const endRegex = /document\.body\.appendChild\(bottomNav\);[\r\n\s]*\}/;
const match = endRegex.exec(code);
if (!match) {
  console.error('End target not found via regex');
  process.exit(1);
}
const endIdx = match.index;
const endLen = match[0].length;

const replacement = `  // Pasang Sidebar untuk Laptop (>=1024px) bila halaman guru
  const adalahHalamanGuruKelola = peran === 'guru' &&
    !pathSekarang.includes('masuk.html') &&
    !pathSekarang.includes('sesi.html');

  const mainEl = document.querySelector('main');
  if (adalahHalamanGuruKelola && mainEl && !document.querySelector('.kupas-sidebar')) {
    const isCollapsedAwal = localStorage.getItem('kupas_sidebar_collapsed') === 'true';

    const wrapper = document.createElement('div');
    wrapper.className = \`kupas-app-wrapper has-sidebar \${isCollapsedAwal ? 'sidebar-collapsed' : ''}\`;

    const sidebar = document.createElement('aside');
    sidebar.className = \`kupas-sidebar \${isCollapsedAwal ? 'collapsed' : ''}\`;
    sidebar.setAttribute('aria-label', 'Menu Samping Guru');
    sidebar.innerHTML = \`
      <div class="d-flex align-items-center justify-content-between mb-3 px-1">
        <span class="text-uppercase small fw-bolder text-secondary sidebar-label">Ruang Guru</span>
        <button id="btn-toggle-sidebar" type="button" class="btn btn-sm btn-outline-dark p-1 rounded-circle d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" title="Ciutkan / Buka Sidebar" aria-label="Alihkan Sidebar">
          <svg class="icon-toggle-sidebar" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="\${isCollapsedAwal ? '9 18 15 12 9 6' : '15 18 9 12 15 6'}"></polyline>
          </svg>
        </button>
      </div>
      <nav class="d-flex flex-column gap-2 flex-grow-1">
        <a href="\${root}guru/dasbor.html" class="kupas-sidebar-link \${pathSekarang.includes('dasbor.html') ? 'active' : ''}" title="Dasbor Kuis">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span class="sidebar-label">Dasbor Kuis</span>
        </a>
        <a href="\${root}guru/editor.html" class="kupas-sidebar-link \${pathSekarang.includes('editor.html') ? 'active' : ''}" title="Editor Kuis">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          <span class="sidebar-label">Editor Kuis</span>
        </a>
        <a href="\${root}guru/kamus.html" class="kupas-sidebar-link \${pathSekarang.includes('guru/kamus.html') ? 'active' : ''}" title="Kelola Kamus">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          <span class="sidebar-label">Kelola Kamus</span>
        </a>
        <button type="button" id="btn-sidebar-pengaturan-kuis" class="kupas-sidebar-link border-0 bg-transparent text-start w-100" style="min-height: 48px; cursor: pointer;" title="Pengaturan Kuis">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span class="sidebar-label">Pengaturan Kuis</span>
        </button>
        <hr class="border-dark my-2" />
        <a href="\${root}kamus-belajar.html" class="kupas-sidebar-link" title="Kamus Siswa">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>
          <span class="sidebar-label">Kamus Siswa</span>
        </a>
        <a href="\${berandaHref}" class="kupas-sidebar-link" title="Beranda Utama">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span class="sidebar-label">Beranda Utama</span>
        </a>
      </nav>
    \`;

    mainEl.parentNode.insertBefore(wrapper, mainEl);
    mainEl.classList.add('kupas-main-content');
    wrapper.appendChild(sidebar);
    wrapper.appendChild(mainEl);

    // Pasang handler toggle collapse sidebar
    const btnToggle = sidebar.querySelector('#btn-toggle-sidebar');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        wrapper.classList.toggle('sidebar-collapsed', isCollapsed);
        localStorage.setItem('kupas_sidebar_collapsed', isCollapsed ? 'true' : 'false');
        const iconPoly = btnToggle.querySelector('polyline');
        if (iconPoly) {
          iconPoly.setAttribute('points', isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6');
        }
      });
    }
  }

  // Pasang Bottom Navigation untuk HP & Tablet (<1024px)
  if (!opsi.sembunyikanBottomNav && !document.getElementById('kupas-bottom-nav')) {
    const bottomNav = document.createElement('nav');
    bottomNav.id = 'kupas-bottom-nav';
    bottomNav.className = 'kupas-bottom-nav';
    bottomNav.setAttribute('aria-label', 'Navigasi Bawah Perangkat Seluler');

    if (peran === 'guru' && !pathSekarang.includes('masuk.html')) {
      bottomNav.innerHTML = \`
        <a href="\${root}guru/dasbor.html" class="kupas-bottom-nav-item \${pathSekarang.includes('dasbor.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </span>
          <span>Dasbor</span>
        </a>
        <a href="\${root}guru/editor.html" class="kupas-bottom-nav-item \${pathSekarang.includes('editor.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </span>
          <span>Editor</span>
        </a>
        <a href="\${root}guru/kamus.html" class="kupas-bottom-nav-item \${pathSekarang.includes('guru/kamus.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          </span>
          <span>Kamus</span>
        </a>
        <button type="button" class="kupas-bottom-nav-item" data-bs-toggle="offcanvas" data-bs-target="#kupasOffcanvasNav" aria-label="Buka Pengaturan">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </span>
          <span>Atur</span>
        </button>
      \`;
    } else {
      bottomNav.innerHTML = \`
        <a href="\${berandaHref}" class="kupas-bottom-nav-item \${pathSekarang.endsWith('index.html') || pathSekarang.endsWith('/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </span>
          <span>Beranda</span>
        </a>
        <a href="\${root}gabung.html" class="kupas-bottom-nav-item \${pathSekarang.includes('gabung.html') || pathSekarang.includes('siswa/main.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="14" rx="2"/><path d="M7 8V6a5 5 0 0 1 10 0v2"/></svg>
          </span>
          <span>Gabung</span>
        </a>
        <a href="\${root}kamus-belajar.html" class="kupas-bottom-nav-item \${pathSekarang.includes('kamus-belajar.html') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
          </span>
          <span>Kamus</span>
        </a>
        <a href="\${root}guru/dasbor.html" class="kupas-bottom-nav-item \${pathSekarang.includes('guru/') ? 'active' : ''}">
          <span class="kupas-bottom-nav-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </span>
          <span>Guru</span>
        </a>
      \`;
    }
    document.body.appendChild(bottomNav);
  }`;

const newCode = code.slice(0, idx) + replacement + code.slice(endIdx + endLen);
fs.writeFileSync('assets/js/ui.js', newCode, 'utf8');
console.log('Successfully updated assets/js/ui.js with collapsible sidebar and SVG icons!');
