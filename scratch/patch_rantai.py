with open('assets/js/rantai-makanan.js', 'r', encoding='utf-8') as f:
    c = f.read()

old_target = """    // Acak urutan kartu makhluk
    const kartuAsli = Array.isArray(target.kartu_makhluk) ? target.kartu_makhluk : JSON.parse(target.kartu_makhluk || '[]');
    let teracak = [...kartuAsli].sort(() => 0.5 - Math.random());"""

new_target = """    // Acak urutan kartu makhluk dengan Fisher-Yates
    const kartuAsli = Array.isArray(target.kartu_makhluk) ? target.kartu_makhluk : JSON.parse(target.kartu_makhluk || '[]');
    let teracak = [...kartuAsli];
    for (let i = teracak.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teracak[i], teracak[j]] = [teracak[j], teracak[i]];
    }"""

if old_target in c:
    c = c.replace(old_target, new_target, 1)
    with open('assets/js/rantai-makanan.js', 'w', encoding='utf-8') as f:
        f.write(c)
    print("SUCCESS_PATCH_RANTAI")
else:
    print("RANTAI_TARGET_NOT_FOUND")

