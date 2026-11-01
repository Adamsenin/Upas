import sys

sys.stdout.reconfigure(encoding='utf-8')

with open('siswa/main.html', 'r', encoding='utf-8') as f:
    c = f.read()

target = """    document.getElementById('btn-kirim-jawaban').addEventListener('click', () => {
      kunciJawaban(false);
    });"""

replacement = """    document.getElementById('btn-kirim-jawaban').addEventListener('click', () => {
      kunciJawaban(false);
    });

    if (typeof window !== 'undefined') {
      window.kunciJawaban = kunciJawaban;
      window.bukaLayarSoal = bukaLayarSoal;
      window.getDaftarSoal = () => daftarSoalSiswa;
      window.getIndexSoal = () => indexSoalSiswa;
    }"""

if target in c:
    c = c.replace(target, replacement)
    print("Replaced target in siswa/main.html")
elif target.replace('\n', '\r\n') in c:
    c = c.replace(target.replace('\n', '\r\n'), replacement.replace('\n', '\r\n'))
    print("Replaced target (CRLF) in siswa/main.html")

with open('siswa/main.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(c)

print("Done window exposure")

