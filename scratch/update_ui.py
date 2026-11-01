with open('assets/js/ui.js', 'r', encoding='utf-8') as f:
    text = f.read()

old_block = '''            <!-- Tombol Suara SFX -->
            <button id="btn-toggle-suara" type="button" class="btn btn-outline-dark btn-sm d-flex align-items-center justify-content-center gap-1" aria-label="Beralih efek suara">
              SFX
            </button>

            <!-- Tombol Musik Latar BGM -->
            <button id="btn-toggle-musik" type="button" class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1" aria-label="Beralih musik latar">
              Musik
            </button>

            <!-- Pengaturan Animasi -->
            <div class="d-flex align-items-center justify-content-between gap-1 bg-white px-2 py-1 rounded-3 border border-2 border-dark" style="min-height: 44px;">
              <label for="select-animasi-global" class="small fw-bold mb-0">Gerak:</label>
              <select id="select-animasi-global" class="form-select form-select-sm border-0 fw-bold py-0" style="width: auto; min-height: 36px;" aria-label="Pilih tingkat animasi">
                <option value="penuh" ${modeSekarang === 'penuh' ? 'selected' : ''}>Penuh</option>
                <option value="kurang" ${modeSekarang === 'kurang' ? 'selected' : ''}>Kurang</option>
                <option value="mati" ${modeSekarang === 'mati' ? 'selected' : ''}>Mati</option>
              </select>
            </div>'''

new_block = '''            <!-- Tombol Suara SFX -->
            <button id="btn-toggle-suara" type="button" class="btn btn-outline-dark btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold" style="min-height: 48px; min-width: 48px; padding: 0.5rem 0.85rem;" aria-label="Beralih efek suara">
              SFX
            </button>

            <!-- Tombol Musik Latar BGM -->
            <button id="btn-toggle-musik" type="button" class="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-1 fw-bold" style="min-height: 48px; min-width: 48px; padding: 0.5rem 0.85rem;" aria-label="Beralih musik latar">
              Musik
            </button>

            <!-- Pengaturan Animasi -->
            <div class="d-flex align-items-center justify-content-between gap-2 bg-white px-2 py-1 rounded-3 border border-2 border-dark" style="min-height: 48px;">
              <label for="select-animasi-global" class="small fw-bold mb-0">Gerak:</label>
              <select id="select-animasi-global" class="form-select form-select-sm border-0 fw-bold py-0" style="width: auto; min-height: 48px; font-size: 0.95rem;" aria-label="Pilih tingkat animasi">
                <option value="penuh" ${modeSekarang === 'penuh' ? 'selected' : ''}>Penuh</option>
                <option value="kurang" ${modeSekarang === 'kurang' ? 'selected' : ''}>Kurang</option>
                <option value="mati" ${modeSekarang === 'mati' ? 'selected' : ''}>Mati</option>
              </select>
            </div>'''

assert old_block in text, 'old_block not found in ui.js'
text = text.replace(old_block, new_block)

with open('assets/js/ui.js', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated ui.js successfully!')
