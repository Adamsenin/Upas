import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('assets/js/konfigurasi.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace modal-content open
old_content_open = '<div class="modal-content kupas-card border-3 border-dark" style="background-color: var(--kupas-cream-light);">'
new_content_open = '<div class="modal-content border-3 border-dark rounded-4 shadow-lg overflow-hidden" style="background-color: #FFFFFF;">'
code = code.replace(old_content_open, new_content_open)

# Replace modal-header
old_header = '<div class="modal-header border-bottom border-2 border-dark py-3">'
new_header = '<div class="modal-header border-bottom border-2 border-dark py-3 px-3 px-md-4" style="background-color: var(--kupas-cream-bg, #FFF6E0);">'
code = code.replace(old_header, new_header)

# Replace modal-body
old_body = '<div class="modal-body p-3 p-md-4">'
new_body = '<div class="modal-body p-3 p-md-4" style="background-color: #FFFFFF;">'
code = code.replace(old_body, new_body)

# Replace accordion wrapper
old_accordion = '<div class="accordion border border-2 border-dark rounded-4 overflow-hidden shadow-sm" id="accordionPengaturanGame">'
new_accordion = '<div class="accordion border-0 d-flex flex-column gap-2" id="accordionPengaturanGame">'
code = code.replace(old_accordion, new_accordion)

# Replace accordion item classes
code = code.replace('<div class="accordion-item border-bottom border-dark">', '<div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">')
code = code.replace('<!-- 6. UMPAN BALIK -->\n              <div class="accordion-item">', '<!-- 6. UMPAN BALIK -->\n              <div class="accordion-item border border-2 border-dark rounded-3 overflow-hidden shadow-sm mb-2">')

# Replace modal-footer
old_footer = '<div class="modal-footer border-top border-2 border-dark d-flex flex-wrap justify-content-between gap-2 p-3">'
new_footer = '<div class="modal-footer border-top border-2 border-dark d-flex flex-wrap justify-content-between gap-2 p-3 px-3 px-md-4" style="background-color: var(--kupas-cream-bg, #FFF6E0);">'
code = code.replace(old_footer, new_footer)

with open('assets/js/konfigurasi.js', 'w', encoding='utf-8') as f:
    f.write(code)

print('assets/js/konfigurasi.js modal design updated')

