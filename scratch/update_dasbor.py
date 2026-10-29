import sys
sys.stdout.reconfigure(encoding='utf-8')

# 1. Update guru/dasbor.html
with open('guru/dasbor.html', 'r', encoding='utf-8') as f:
    dasbor_html = f.read()

target_tab = '''      <li class="nav-item" role="presentation">
        <button class="nav-link fw-bold text-dark border border-dark d-inline-flex align-items-center gap-1" id="tab-btn-aktivitas" data-bs-toggle="pill" data-bs-target="#pane-aktivitas" type="button" role="tab">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 3h16v6a8 8 0 0 1-16 0V3z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
          <span>Aktivitas & Sertifikat</span>
        </button>
      </li>
    </ul>'''

repl_tab = '''      <li class="nav-item" role="presentation">
        <button class="nav-link fw-bold text-dark border border-dark d-inline-flex align-items-center gap-1" id="tab-btn-aktivitas" data-bs-toggle="pill" data-bs-target="#pane-aktivitas" type="button" role="tab">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 3h16v6a8 8 0 0 1-16 0V3z"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>
          <span>Aktivitas & Sertifikat</span>
        </button>
      </li>
      <li class="nav-item ms-auto" role="presentation">
        <button class="btn btn-kupas-kuning fw-bold border border-2 border-dark d-inline-flex align-items-center gap-1 shadow-sm px-3" id="btn-tab-pengaturan-kuis" type="button" style="min-height: 44px;" title="Buka pengaturan parameter permainan kuis">
          <span>⚙️</span>
          <span>Pengaturan Kuis</span>
        </button>
      </li>
    </ul>'''

if 'btn-tab-pengaturan-kuis' not in dasbor_html:
    dasbor_html = dasbor_html.replace(target_tab, repl_tab)

target_modal = '''          <div class="mb-3">
            <label for="pengaliWaktu" class="form-label fw-bold">Pengali Waktu Jawab (Aksesibilitas)</label>
            <select class="form-select border-2 border-dark" id="pengaliWaktu">
              <option value="1.0" selected>Standar (1x)</option>
              <option value="1.5">Santai (+50% waktu, 1.5x)</option>
              <option value="2.0">Ekstra (+100% waktu, 2x)</option>
            </select>
          </div>
        </div>
        <div class="modal-footer border-top-0 pt-0">'''

repl_modal = '''          <div class="mb-3">
            <label for="pengaliWaktu" class="form-label fw-bold">Pengali Waktu Jawab (Aksesibilitas)</label>
            <select class="form-select border-2 border-dark" id="pengaliWaktu">
              <option value="1.0" selected>Standar (1x)</option>
              <option value="1.5">Santai (+50% waktu, 1.5x)</option>
              <option value="2.0">Ekstra (+100% waktu, 2x)</option>
            </select>
          </div>

          <div class="p-3 bg-white rounded-3 border-2 border-dark d-flex align-items-center justify-content-between mb-3 shadow-sm">
            <div>
              <span class="fw-bold d-block text-dark">⚙️ Parameter Game & Aturan</span>
              <small class="text-secondary">Jumlah soal, timer, poin, dan batasan peserta.</small>
            </div>
            <button type="button" id="btn-atur-parameter-dasbor" class="btn btn-kupas-kuning btn-sm fw-bold px-3 py-2 border-2 border-dark smartboard-btn" style="min-height: 44px;">
              Atur Parameter
            </button>
          </div>
        </div>
        <div class="modal-footer border-top-0 pt-0">'''

if 'btn-atur-parameter-dasbor' not in dasbor_html:
    dasbor_html = dasbor_html.replace(target_modal, repl_modal)

with open('guru/dasbor.html', 'w', encoding='utf-8') as f:
    f.write(dasbor_html)
print('guru/dasbor.html updated')

# 2. Update assets/js/dasbor-guru.js
with open('assets/js/dasbor-guru.js', 'r', encoding='utf-8') as f:
    dasbor_js = f.read()

if 'konfigurasiManager' not in dasbor_js:
    dasbor_js = dasbor_js.replace(
        "import { pasangHeader, umumkanAria, suara } from './ui.js';",
        "import { pasangHeader, umumkanAria, suara } from './ui.js';\nimport { konfigurasiManager } from './konfigurasi.js';"
    )

target_init = '''  // Pasang Header Navigasi Guru
  pasangHeader('guru', { berandaLink: '../index.html', rootAset: '../' });'''

repl_init = '''  // Pasang Header Navigasi Guru
  pasangHeader('guru', { berandaLink: '../index.html', rootAset: '../' });

  // Event listener tombol Pengaturan Kuis di Dasbor
  const btnTabPengaturan = document.getElementById('btn-tab-pengaturan-kuis');
  if (btnTabPengaturan) {
    btnTabPengaturan.addEventListener('click', () => {
      konfigurasiManager.bukaModalPengaturan();
    });
  }

  const btnAturParameter = document.getElementById('btn-atur-parameter-dasbor');
  if (btnAturParameter) {
    btnAturParameter.addEventListener('click', () => {
      konfigurasiManager.bukaModalPengaturan();
    });
  }'''

if 'btnTabPengaturan' not in dasbor_js:
    dasbor_js = dasbor_js.replace(target_init, repl_init)

with open('assets/js/dasbor-guru.js', 'w', encoding='utf-8') as f:
    f.write(dasbor_js)
print('assets/js/dasbor-guru.js updated')

