import sys

# 1. Update siswa/main.html
with open('siswa/main.html', 'r', encoding='utf-8') as f:
    siswa_content = f.read()

# Replace waiting text in siswa-feedback
old_feedback_waiting = """      <div class="p-2 bg-light rounded-3 border-2 border-dark text-secondary small fw-bold">
        ⏳ Menunggu Guru melanjutkan ke babak berikutnya...
      </div>"""

new_feedback_waiting = """      <div id="feedback-status-lanjut" class="p-2 bg-light rounded-3 border-2 border-dark text-secondary small fw-bold">
        <span id="feedback-hitung-mundur-teks">⚡ Lanjut otomatis ke soal berikutnya dalam 2 detik...</span>
      </div>
      <button id="btn-langsung-soal-berikutnya" type="button" class="btn btn-kupas-hijau btn-sm fw-bold mt-2 smartboard-btn">
        Lanjut Sekarang ➔
      </button>"""

if old_feedback_waiting in siswa_content:
    siswa_content = siswa_content.replace(old_feedback_waiting, new_feedback_waiting)
    print("✅ [siswa/main.html] Updated feedback waiting HTML")
else:
    # Try with CRLF
    old_crlf = old_feedback_waiting.replace('\n', '\r\n')
    new_crlf = new_feedback_waiting.replace('\n', '\r\n')
    if old_crlf in siswa_content:
        siswa_content = siswa_content.replace(old_crlf, new_crlf)
        print("✅ [siswa/main.html] Updated feedback waiting HTML (CRLF)")
    else:
        print("❌ [siswa/main.html] Could not find feedback waiting block")

with open('siswa/main.html', 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(siswa_content)

print("Done phase 1")

