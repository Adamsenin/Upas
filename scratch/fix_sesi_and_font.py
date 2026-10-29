# 1. Update guru/sesi.html
with open('guru/sesi.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '<div class="d-flex justify-content-between align-items-center mb-3">\n        <span class="badge bg-primary fs-6 border border-dark rounded-pill px-3 py-2" id="badge-mode-sesi">',
    '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">\n        <span class="badge bg-primary fs-6 border border-dark rounded-pill px-3 py-2" id="badge-mode-sesi">'
)
text = text.replace(
    '<div class="d-flex justify-content-between align-items-center mb-3">\n        <div class="d-flex align-items-center flex-wrap gap-2">',
    '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">\n        <div class="d-flex align-items-center flex-wrap gap-2">'
)

with open('guru/sesi.html', 'w', encoding='utf-8') as f:
    f.write(text)

# 2. Update tema.css to ensure input font-size >= 16px to prevent iOS auto-zoom
with open('assets/css/tema.css', 'r', encoding='utf-8') as f:
    tcss = f.read()

font_rules = '''
/* Pastikan font input & select minimal 16px agar tidak memicu auto-zoom di perangkat seluler */
input, select, textarea, .form-control, .form-select {
  font-size: 16px !important;
}

#select-animasi-global {
  font-size: 16px !important;
  min-height: 48px !important;
}
'''

if '#select-animasi-global' not in tcss:
    tcss += font_rules
    with open('assets/css/tema.css', 'w', encoding='utf-8') as f:
        f.write(tcss)

print('Updated guru/sesi.html and tema.css font rules!')

