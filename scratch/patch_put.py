with open('scratch/test_acak_jawaban.py', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('urllib.request.urlopen(f"http://127.0.0.1:{port}/json/new?{url}")', 'urllib.request.urlopen(urllib.request.Request(f"http://127.0.0.1:{port}/json/new?{url}", method="PUT"))')

with open('scratch/test_acak_jawaban.py', 'w', encoding='utf-8') as f:
    f.write(c)

print("PATCHED_PUT")

