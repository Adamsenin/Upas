with open('assets/js/konfigurasi.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update DEFAULT_PENGATURAN acak_jawaban: true
c = c.replace('acak_jawaban: false,', 'acak_jawaban: true,')

# 2. Add acakPilihanJawaban utility function
func_code = '''
/**
 * Mengacak urutan pilihan jawaban menggunakan algoritma Fisher-Yates murni.
 * Opsi khusus seperti "Semua jawaban benar" atau "Tidak ada yang benar"
 * akan selalu dipertahankan di posisi paling akhir.
 * @param {Array<string>} opsiArray - Array teks pilihan jawaban
 * @returns {Array<{ teks: string, originalIndex: number, id: string }>}
 */
export function acakPilihanJawaban(opsiArray) {
  if (!Array.isArray(opsiArray) || opsiArray.length === 0) return [];

  const items = opsiArray.map((teks, idx) => ({
    teks,
    originalIndex: idx,
    id: String(idx)
  }));

  // Deteksi opsi yang harus tetap di posisi terakhir
  const regexTetapAkhir = /(semua.*(benar|salah)|tidak ada.*(benar|salah)|semua pilihan)/i;
  const normalItems = [];
  const akhirItems = [];

  for (const item of items) {
    if (regexTetapAkhir.test(item.teks)) {
      akhirItems.push(item);
    } else {
      normalItems.push(item);
    }
  }

  // Fisher-Yates Shuffle murni
  for (let i = normalItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [normalItems[i], normalItems[j]] = [normalItems[j], normalItems[i]];
  }

  return [...normalItems, ...akhirItems];
}
'''

if 'export function acakPilihanJawaban' not in c:
    c = c.replace('export const konfigurasiManager = {', func_code + '\nexport const konfigurasiManager = {')

# 3. Add switch HTML in modal dialog
switch_old = '''                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-acak-soal">🔀 Acak Urutan Soal</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-acak-soal" ${cfg.acak_soal ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Urutan soal akan diacak pada setiap sesi kuis baru.</small>
                      </div>'''

switch_new = '''                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-acak-soal">🔀 Acak Urutan Soal</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-acak-soal" ${cfg.acak_soal ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Urutan soal akan diacak pada setiap sesi kuis baru.</small>
                      </div>

                      <div class="col-12 col-md-6 d-flex flex-column justify-content-center">
                        <div class="form-check form-switch p-2 border-2 border-dark rounded-3 bg-light d-flex align-items-center justify-content-between mb-2" style="min-height: 48px;">
                          <label class="form-check-label fw-bold text-dark ps-2 cursor-pointer" for="cfg-acak-jawaban">🔀 Acak Urutan Jawaban</label>
                          <input class="form-check-input ms-0 me-2" type="checkbox" role="switch" id="cfg-acak-jawaban" ${cfg.acak_jawaban !== false ? 'checked' : ''} ${isReadOnly ? 'disabled' : ''}>
                        </div>
                        <small class="text-secondary d-block">Pilihan jawaban (A, B, C, D) akan diacak per siswa (default: Aktif).</small>
                      </div>'''

if switch_old in c:
    c = c.replace(switch_old, switch_new, 1)

# 4. Save acak_jawaban in dataBaru
target_save = "acak_soal: document.getElementById('cfg-acak-soal').checked,"
replace_save = """acak_soal: document.getElementById('cfg-acak-soal').checked,
              acak_jawaban: document.getElementById('cfg-acak-jawaban') ? document.getElementById('cfg-acak-jawaban').checked : true,"""
if target_save in c:
    c = c.replace(target_save, replace_save, 1)

# 5. Expose on window if in browser
c = c.replace("window.konfigurasiManager = konfigurasiManager;", "window.konfigurasiManager = konfigurasiManager; window.acakPilihanJawaban = acakPilihanJawaban;")

with open('assets/js/konfigurasi.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS_PATCH_KONFIGURASI")

