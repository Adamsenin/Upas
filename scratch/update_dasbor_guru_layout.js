import fs from 'fs';

let html = fs.readFileSync('guru/dasbor.html', 'utf8');

// 1. Ganti section KPI Stat Card
const kpiOldRegex = /<section aria-label="Ringkasan Statistik Kelas" class="row g-3 mb-4">[\s\S]*?<\/section>/;
const kpiNew = `<section aria-label="Ringkasan Statistik Kelas" class="stat-kpi-grid mb-4">
      <div class="stat-kpi-card stat-kpi-success">
        <div class="kpi-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          <span>Rata-rata Nilai</span>
        </div>
        <div class="kpi-nilai text-success" id="stat-rata-rata">0</div>
        <div class="kpi-subteks">Skala capaian 0–100</div>
      </div>

      <div class="stat-kpi-card stat-kpi-warning">
        <div class="kpi-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" /><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" /><path d="M4 3h16v6a8 8 0 0 1-16 0V3z" /><path d="M12 17v4" /><path d="M8 21h8" /></svg>
          <span>Tertinggi / Terendah</span>
        </div>
        <div class="kpi-nilai text-dark" id="stat-tinggi-rendah">0 / 0</div>
        <div class="kpi-subteks">Rentang capaian kelas</div>
      </div>

      <div class="stat-kpi-card stat-kpi-primary">
        <div class="kpi-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          <span>Ketuntasan KKM</span>
        </div>
        <div class="kpi-nilai text-primary" id="stat-ketuntasan">0%</div>
        <div class="kpi-subteks">Siswa lulus KKM</div>
      </div>

      <div class="stat-kpi-card stat-kpi-primary">
        <div class="kpi-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <span>Jumlah Peserta</span>
        </div>
        <div class="kpi-nilai text-dark" id="stat-jumlah-peserta">0 Siswa</div>
        <div class="kpi-subteks">Partisipasi sesi aktif</div>
      </div>

      <div class="stat-kpi-card stat-kpi-danger">
        <div class="kpi-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          <span>Perlu Perhatian</span>
        </div>
        <div class="kpi-nilai text-danger" id="stat-jumlah-remedial">0 Siswa</div>
        <div class="kpi-subteks">Remedial / Belum ikut</div>
      </div>
    </section>`;

html = html.replace(kpiOldRegex, kpiNew);

// 2. Bungkus #dasborTab dengan .tab-nav-scroller
if (!html.includes('<div class="tab-nav-scroller">')) {
  html = html.replace(
    /(<!-- Navigasi Tab Fitur Dasbor Guru -->\s*)(<ul[^>]*id="dasborTab"[^>]*>[\s\S]*?<\/ul>)/,
    '$1<div class="tab-nav-scroller">\n      $2\n    </div>'
  );
}

// 3. Modals scrollable
html = html.replace(/class="modal-dialog modal-dialog-centered"/g, 'class="modal-dialog modal-dialog-centered modal-dialog-scrollable"');
html = html.replace(/class="modal-dialog"/g, 'class="modal-dialog modal-dialog-centered modal-dialog-scrollable"');

fs.writeFileSync('guru/dasbor.html', html, 'utf8');
console.log('Successfully updated guru/dasbor.html layout!');
