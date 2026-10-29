with open('siswa/main.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    'jalankanTimerSiswa(soal.waktu_detik || 30);',
    'jalankanTimerSiswa(typeof soal.waktu_detik === "number" ? soal.waktu_detik : 30);'
)

with open('siswa/main.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('siswa/main.html updated successfully')

