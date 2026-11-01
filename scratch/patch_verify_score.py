with open('scratch/verify_kuis_otomatis_v2.py', 'r', encoding='utf-8') as f:
    c = f.read()

old_block = """    s1_final_view = page_s1.eval(\"\"\"
    (() => {
        const v = document.getElementById('siswa-hasil');
        const skor = document.getElementById('hasil-akhir-skor-angka').textContent;
        return {
            isVisible: !v.classList.contains('d-none'),
            skor
        };
    })()
    \"\"\")"""

new_block = """    s1_final_view = page_s1.eval(\"\"\"
    (() => {
        const v = document.getElementById('siswa-hasil');
        const peserta = JSON.parse(sessionStorage.getItem('kupas_peserta_login') || '{}');
        return {
            isVisible: !v.classList.contains('d-none'),
            skor: peserta.skor
        };
    })()
    \"\"\")"""

if old_block in c:
    c = c.replace(old_block, new_block, 1)
    with open('scratch/verify_kuis_otomatis_v2.py', 'w', encoding='utf-8') as f:
        f.write(c)
    print("SUCCESS")
else:
    print("NOT FOUND")

