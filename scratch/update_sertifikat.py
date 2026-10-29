# Update sertifikat.html
with open('sertifikat.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '<div class="d-flex align-items-center gap-3 latar-pita-baca py-2 px-3">',
    '<div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3 latar-pita-baca py-2 px-3">'
)

text = text.replace(
    'class="badge rounded-pill fw-bold px-3 py-1 mb-2 d-inline-flex align-items-center gap-1"',
    'class="badge rounded-pill fw-bold px-3 py-1 mb-2 d-inline-flex align-items-center gap-1 text-wrap"'
)

with open('sertifikat.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated sertifikat.html!')

