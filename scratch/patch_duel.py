with open('assets/js/duel-tim.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Update renderPertanyaanDuel
old_render = """  // Reset tampilan pilihan ganda
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-opsi-${i}`);
    const teks = document.getElementById(`teks-opsi-${i}`);
    if (btn && teks) {
      btn.className = 'tombol-opsi-duel w-100';
      btn.disabled = state.format === 'buzzer'; // Disable pada mode buzzer sampai bel ditekan
      teks.textContent = soal.opsi[i];
    }
  }"""

new_render = """  // Acak susunan pilihan jawaban dengan Fisher-Yates (stabil per soal aktif)
  if (!soal._opsiTersusun) {
    const items = soal.opsi.map((op, i) => ({ teks: op, originalIndex: i }));
    const regexTetapAkhir = /(semua.*(benar|salah)|tidak ada.*(benar|salah))/i;
    const normalItems = [];
    const akhirItems = [];
    items.forEach(it => {
      if (regexTetapAkhir.test(it.teks)) akhirItems.push(it);
      else normalItems.push(it);
    });
    for (let i = normalItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [normalItems[i], normalItems[j]] = [normalItems[j], normalItems[i]];
    }
    soal._opsiTersusun = [...normalItems, ...akhirItems];
  }

  // Reset tampilan pilihan ganda
  for (let i = 0; i < 4; i++) {
    const btn = document.getElementById(`btn-opsi-${i}`);
    const teks = document.getElementById(`teks-opsi-${i}`);
    if (btn && teks) {
      btn.className = 'tombol-opsi-duel w-100';
      btn.disabled = state.format === 'buzzer'; // Disable pada mode buzzer sampai bel ditekan
      const item = soal._opsiTersusun[i];
      teks.textContent = item ? item.teks : (soal.opsi[i] || '');
    }
  }"""

if old_render in c:
    c = c.replace(old_render, new_render, 1)
    print("REPLACED_RENDER_DUEL")
else:
    print("RENDER_DUEL_NOT_FOUND")

# 2. Update pilihJawaban
old_pilih = """  const soal = state.soalList[state.indeksSoal];
  const adalahBenar = indexJawaban === soal.jawaban;
  const btnDipilih = document.getElementById(`btn-opsi-${indexJawaban}`);
  const btnKunci = document.getElementById(`btn-opsi-${soal.jawaban}`);"""

new_pilih = """  const soal = state.soalList[state.indeksSoal];
  const itemDipilih = (soal._opsiTersusun && soal._opsiTersusun[indexJawaban]) 
    ? soal._opsiTersusun[indexJawaban] 
    : { originalIndex: indexJawaban };
  const adalahBenar = (itemDipilih.originalIndex === soal.jawaban);
  const btnDipilih = document.getElementById(`btn-opsi-${indexJawaban}`);

  // Posisi tombol yang menampilkan kunci jawaban asli setelah diacak
  const idxTampilanKunci = soal._opsiTersusun
    ? soal._opsiTersusun.findIndex(it => it.originalIndex === soal.jawaban)
    : soal.jawaban;
  const btnKunci = document.getElementById(`btn-opsi-${idxTampilanKunci >= 0 ? idxTampilanKunci : soal.jawaban}`);"""

if old_pilih in c:
    c = c.replace(old_pilih, new_pilih, 1)
    print("REPLACED_PILIH_DUEL")
else:
    print("PILIH_DUEL_NOT_FOUND")

# 3. Update lewatiSoalSaatIni
old_lewati = """  const soal = state.soalList[state.indeksSoal];
  const btnKunci = document.getElementById(`btn-opsi-${soal.jawaban}`);"""

new_lewati = """  const soal = state.soalList[state.indeksSoal];
  const idxTampilanKunci = soal._opsiTersusun
    ? soal._opsiTersusun.findIndex(it => it.originalIndex === soal.jawaban)
    : soal.jawaban;
  const btnKunci = document.getElementById(`btn-opsi-${idxTampilanKunci >= 0 ? idxTampilanKunci : soal.jawaban}`);"""

if old_lewati in c:
    c = c.replace(old_lewati, new_lewati, 1)
    print("REPLACED_LEWATI_DUEL")
else:
    print("LEWATI_DUEL_NOT_FOUND")

with open('assets/js/duel-tim.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS_PATCH_DUEL")

