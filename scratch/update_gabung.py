with open('gabung.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    'id="input-kode" placeholder="ABC123" maxlength="6" autocomplete="off" required',
    'id="input-kode" placeholder="ABC123" maxlength="6" autocomplete="off" inputmode="text" autocapitalize="characters" spellcheck="false" required'
)
text = text.replace(
    'id="input-nama" placeholder="Contoh: Budi, Siti, Edo" maxlength="20" autocomplete="nickname" required',
    'id="input-nama" placeholder="Contoh: Budi, Siti, Edo" maxlength="20" autocomplete="nickname" autocapitalize="words" spellcheck="false" required'
)

with open('gabung.html', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated gabung.html!')

