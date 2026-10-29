import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('assets/js/konfigurasi.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add poin ringkasan
old_ringkasan = '''    // Suara & Teks
    if (!config.sfx_aktif) list.push('🔇 Suara Bisu');
    if (config.ukuran_teks === 'besar') list.push('📺 Smartboard');'''

new_ringkasan = '''    // Poin
    if (config.poin_benar && config.poin_benar !== 10) {
      list.push(`⭐ ${config.poin_benar} Poin`);
    }

    // Suara & Teks
    if (!config.sfx_aktif) list.push('🔇 Suara Bisu');
    if (config.ukuran_teks === 'besar') list.push('📺 Smartboard');'''

if '⭐ ${config.poin_benar} Poin' not in code:
    code = code.replace(old_ringkasan, new_ringkasan)

# 2. Attach window.konfigurasiManager
window_attach = '''
if (typeof window !== 'undefined') {
  window.konfigurasiManager = konfigurasiManager;
}
'''
if 'window.konfigurasiManager' not in code:
    code = code + window_attach

with open('assets/js/konfigurasi.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('assets/js/konfigurasi.js updated')

