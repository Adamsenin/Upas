with open('scratch/verify_kuis_otomatis_v2.py', 'r', encoding='utf-8') as f:
    c = f.read()

old_block = """    # 12. Uji Soal Terakhir: Otomatis Menampilkan Hasil Akhir
    # Siswa 1 jawab soal 3 (soal terakhir dari 3)
    page_s1.eval("document.querySelectorAll('.opsi-jawaban')[0].click();")
    time.sleep(0.5)
    s1_last_text = page_s1.eval("document.getElementById('feedback-hitung-mundur-teks').textContent")"""

new_block = """    # 12. Uji Soal Terakhir: Otomatis Menampilkan Hasil Akhir
    # Pindahkan Siswa 1 ke soal terakhir bank soal
    page_s1.eval("const list = window.getDaftarSoal(); const lastIdx = list.length - 1; window.bukaLayarSoal(list[lastIdx], lastIdx, list.length);")
    time.sleep(0.5)
    # Siswa 1 jawab soal terakhir
    page_s1.eval("document.querySelectorAll('.opsi-jawaban')[0].click();")
    time.sleep(0.5)
    s1_last_text = page_s1.eval("document.getElementById('feedback-hitung-mundur-teks').textContent")"""

if old_block in c:
    c = c.replace(old_block, new_block, 1)
    with open('scratch/verify_kuis_otomatis_v2.py', 'w', encoding='utf-8') as f:
        f.write(c)
    print("SUCCESS")
else:
    print("NOT FOUND")

