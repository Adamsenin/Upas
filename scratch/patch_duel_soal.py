with open('assets/js/duel-tim.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = """  // Acak soal
  state.soalList = [...BANK_SOAL_DUEL]
    .sort(() => 0.5 - Math.random())
    .slice(0, state.jumlahSoal);"""

replacement = """  // Acak urutan butir soal dengan Fisher-Yates
  const bankAcak = [...BANK_SOAL_DUEL];
  for (let i = bankAcak.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bankAcak[i], bankAcak[j]] = [bankAcak[j], bankAcak[i]];
  }
  state.soalList = bankAcak.slice(0, state.jumlahSoal);"""

if target in c:
    c = c.replace(target, replacement, 1)
    with open('assets/js/duel-tim.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("SUCCESS_PATCH_DUEL_SOAL")
else:
    print("TARGET_NOT_FOUND")

