# 1. Update siswa/main.html
with open('siswa/main.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '<div class="kupas-card p-3 mb-3 anim-slide-down">',
    '<div class="kupas-card p-3 mb-3 anim-slide-down bilah-status-kuis-sticky">'
)
text = text.replace(
    '<input type="text" class="form-control form-control-lg border-2 border-dark fw-bold" id="siswa-input-isian" placeholder="Ketik jawabanmu di sini...">',
    '<input type="text" class="form-control form-control-lg border-2 border-dark fw-bold" id="siswa-input-isian" placeholder="Ketik jawabanmu di sini..." inputmode="text" autocomplete="off" style="font-size: 1.15rem; min-height: 52px;">'
)
text = text.replace(
    '<button id="btn-langsung-soal-berikutnya" type="button" class="btn btn-kupas-hijau btn-sm fw-bold mt-2 smartboard-btn">',
    '<button id="btn-langsung-soal-berikutnya" type="button" class="btn btn-kupas-hijau fw-bold mt-2 w-100 smartboard-btn" style="min-height: 48px;">'
)

with open('siswa/main.html', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Add sticky CSS in assets/css/komponen.css
with open('assets/css/komponen.css', 'r', encoding='utf-8') as f:
    kcss = f.read()

sticky_rule = '''
/* Bilah Status Siswa Sticky di Layar Sempit (HP) */
@media (max-width: 639.98px) {
  .bilah-status-kuis-sticky {
    position: sticky;
    top: max(var(--safe-top), 0.5rem);
    z-index: var(--z-sticky, 1010);
    box-shadow: 0 6px 16px rgba(15, 61, 46, 0.14) !important;
  }
}
'''

if '.bilah-status-kuis-sticky' not in kcss:
    kcss += sticky_rule
    with open('assets/css/komponen.css', 'w', encoding='utf-8') as f:
        f.write(kcss)

print('Updated siswa/main.html and komponen.css!')

