with open('assets/js/fakta-opini.js', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Replace sort(() => 0.5 - Math.random()) in muatDataPernyataan
old_shuffle = """      // Acak dan ambil 8-10 butir pernyataan untuk 1 ronde
      const terbit = data.filter(d => d.status === 'terbit');
      const acak = [...terbit].sort(() => 0.5 - Math.random());
      const jumlahRonde = Math.min(10, Math.max(8, acak.length));"""

new_shuffle = """      // Acak dan ambil 8-10 butir pernyataan untuk 1 ronde menggunakan Fisher-Yates
      const terbit = data.filter(d => d.status === 'terbit');
      const acak = [...terbit];
      for (let i = acak.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [acak[i], acak[j]] = [acak[j], acak[i]];
      }
      const jumlahRonde = Math.min(10, Math.max(8, acak.length));"""

if old_shuffle in c:
    c = c.replace(old_shuffle, new_shuffle, 1)
    print("REPLACED_SHUFFLE_FAKTA")
else:
    print("SHUFFLE_FAKTA_NOT_FOUND")

# 2. Add left/right randomization in renderSoalAktif
old_render_target = "    // Reset Maskot ke ekspresi berpikir/semangat\n    this.aturMaskot('assets/svg/maskot-semangat.svg', `Pernyataan ke-${urutan}: Apakah ini fakta nyata atau hanya opini?`);"

new_render_code = """    // Reset Maskot ke ekspresi berpikir/semangat
    this.aturMaskot('assets/svg/maskot-semangat.svg', `Pernyataan ke-${urutan}: Apakah ini fakta nyata atau hanya opini?`);

    // Acak posisi kiri/kanan tombol dan drop zone (50% probabilitas bertukar sisi)
    const harusTukarSisi = Math.random() < 0.5;
    this.sisiKiri = harusTukarSisi ? 'opini' : 'fakta';

    const btnFakta = document.getElementById('btn-pilih-fakta');
    const btnOpini = document.getElementById('btn-pilih-opini');
    const wadahTombol = btnFakta ? btnFakta.parentElement : null;

    if (wadahTombol && btnFakta && btnOpini) {
      if (this.sisiKiri === 'opini') {
        wadahTombol.insertBefore(btnOpini, btnFakta);
        const spOpini = btnOpini.querySelector('span');
        if (spOpini) spOpini.textContent = '[ 1 ] Ini OPINI';
        btnOpini.setAttribute('aria-label', 'Pilih Opini (Tombol 1)');

        const spFakta = btnFakta.querySelector('span');
        if (spFakta) spFakta.textContent = '[ 2 ] Ini FAKTA';
        btnFakta.setAttribute('aria-label', 'Pilih Fakta (Tombol 2)');
      } else {
        wadahTombol.insertBefore(btnFakta, btnOpini);
        const spFakta = btnFakta.querySelector('span');
        if (spFakta) spFakta.textContent = '[ 1 ] Ini FAKTA';
        btnFakta.setAttribute('aria-label', 'Pilih Fakta (Tombol 1)');

        const spOpini = btnOpini.querySelector('span');
        if (spOpini) spOpini.textContent = '[ 2 ] Ini OPINI';
        btnOpini.setAttribute('aria-label', 'Pilih Opini (Tombol 2)');
      }
    }

    // Sesuaikan susunan kolom zona drop
    const colFakta = this.zonaFakta ? this.zonaFakta.closest('.col-12') : null;
    const colOpini = this.zonaOpini ? this.zonaOpini.closest('.col-12') : null;
    const rowZona = colFakta ? colFakta.parentElement : null;
    if (rowZona && colFakta && colOpini) {
      if (this.sisiKiri === 'opini') {
        rowZona.insertBefore(colOpini, colFakta);
      } else {
        rowZona.insertBefore(colFakta, colOpini);
      }
    }"""

if old_render_target in c:
    c = c.replace(old_render_target, new_render_code, 1)
    print("REPLACED_RENDER_TARGET_FAKTA")
else:
    print("RENDER_TARGET_FAKTA_NOT_FOUND")

# 3. Update handleKeyboard
old_kb = """  handleKeyboard(e) {
    if (this.sedangAnimasi || this.indeksSoal >= this.daftarSoal.length) return;

    if (e.key === '1' || e.key === 'f' || e.key === 'F' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.jawab('fakta');
    } else if (e.key === '2' || e.key === 'o' || e.key === 'O' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.jawab('opini');
    }
  }"""

new_kb = """  handleKeyboard(e) {
    if (this.sedangAnimasi || this.indeksSoal >= this.daftarSoal.length) return;

    const pilihanKiri = this.sisiKiri || 'fakta';
    const pilihanKanan = (pilihanKiri === 'fakta') ? 'opini' : 'fakta';

    if (e.key === '1' || e.key === 'ArrowLeft') {
      e.preventDefault();
      this.jawab(pilihanKiri);
    } else if (e.key === '2' || e.key === 'ArrowRight') {
      e.preventDefault();
      this.jawab(pilihanKanan);
    } else if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      this.jawab('fakta');
    } else if (e.key === 'o' || e.key === 'O') {
      e.preventDefault();
      this.jawab('opini');
    }
  }"""

if old_kb in c:
    c = c.replace(old_kb, new_kb, 1)
    print("REPLACED_KB_FAKTA")
else:
    print("KB_FAKTA_NOT_FOUND")

# 4. Update slide animation in jawab
old_slide = "const geserX = pilihan === 'fakta' ? -120 : 120;"
new_slide = "const geserX = (this.sisiKiri === 'fakta') ? (pilihan === 'fakta' ? -120 : 120) : (pilihan === 'fakta' ? 120 : -120);"

if old_slide in c:
    c = c.replace(old_slide, new_slide, 1)
    print("REPLACED_SLIDE_FAKTA")
else:
    print("SLIDE_FAKTA_NOT_FOUND")

with open('assets/js/fakta-opini.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("SUCCESS_PATCH_FAKTA")

