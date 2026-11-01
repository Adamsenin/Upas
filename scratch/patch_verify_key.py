with open('scratch/verify_kuis_otomatis_v2.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("sessionStorage.getItem('kupas_peserta_login')", "sessionStorage.getItem('kupas_peserta')")

with open('scratch/verify_kuis_otomatis_v2.py', 'w', encoding='utf-8') as f:
    f.write(c)
print("PATCHED")

