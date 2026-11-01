with open('kamus-belajar.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    '<input type="search" class="form-control border-2 border-dark fw-semibold" id="input-cari-kamus"\n              placeholder="Ketik produsen, fotosintesis, dekomposer..." autocomplete="off">',
    '<input type="search" class="form-control border-2 border-dark fw-semibold" id="input-cari-kamus"\n              placeholder="Ketik produsen, fotosintesis, dekomposer..." autocomplete="off" inputmode="search">'
)

text = text.replace(
    '<div class="d-flex align-items-center gap-3 latar-pita-baca py-2 px-3">',
    '<div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3 latar-pita-baca py-2 px-3">'
)

with open('kamus-belajar.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated kamus-belajar.html!')

