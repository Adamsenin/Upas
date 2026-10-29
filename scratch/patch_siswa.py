with open('siswa/main.html', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. Add import for konfigurasiManager and acakPilihanJawaban
import_target = "import { kuisManager } from '../assets/js/kuis.js';"
import_replace = """import { kuisManager } from '../assets/js/kuis.js';
    import { konfigurasiManager, acakPilihanJawaban } from '../assets/js/konfigurasi.js';"""

if import_target in c and 'acakPilihanJawaban' not in c:
    c = c.replace(import_target, import_replace, 1)

# 2. Update bukaLayarSoal options rendering
old_render = """      if (soal.tipe === 'pilihan_ganda' || soal.tipe === 'benar_salah') {
        wadahIsian.classList.add('d-none');
        wadahOpsi.classList.remove('d-none');

        const opsiList = soal.opsi && soal.opsi.length ? soal.opsi : ['Opsi 1', 'Opsi 2'];
        const hurufOpsi = ['A', 'B', 'C', 'D'];
        opsiList.forEach((op, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `opsi-jawaban anim-slide-up anim-stagger-${Math.min(i + 1, 4)}`;
          btn.setAttribute('role', 'radio');
          btn.setAttribute('aria-checked', 'false');
          btn.setAttribute('data-nilai', String(i));
          btn.innerHTML = `
            <span class="opsi-nomor">${i + 1}</span>
            <span class="flex-grow-1">${op}</span>
            <span class="badge bg-light text-secondary border border-dark rounded-pill small indikator-pilih-opsi">${hurufOpsi[i] || ''}</span>
          `;

          btn.addEventListener('click', () => {
            if (sudahMengunci) return;
            pilihOpsi(String(i), btn, hurufOpsi[i] || '');
          });

          wadahOpsi.appendChild(btn);
        });
      }"""

new_render = """      if (soal.tipe === 'pilihan_ganda' || soal.tipe === 'benar_salah') {
        wadahIsian.classList.add('d-none');
        wadahOpsi.classList.remove('d-none');

        const opsiList = soal.opsi && soal.opsi.length ? soal.opsi : ['Opsi 1', 'Opsi 2'];
        const cfg = (typeof konfigurasiManager !== 'undefined' && konfigurasiManager.ambilPengaturan)
          ? konfigurasiManager.ambilPengaturan()
          : { acak_jawaban: true };
        const harusAcak = (cfg.acak_jawaban !== false);

        // Acak sekali per butir soal (stabil saat re-render atau resize)
        if (!soal._opsiTersusun) {
          soal._opsiTersusun = harusAcak
            ? acakPilihanJawaban(opsiList)
            : opsiList.map((op, i) => ({ teks: op, originalIndex: i, id: String(i) }));
        }

        const listTersusun = soal._opsiTersusun;
        const hurufOpsi = ['A', 'B', 'C', 'D'];
        listTersusun.forEach((item, displayIdx) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `opsi-jawaban anim-slide-up anim-stagger-${Math.min(displayIdx + 1, 4)}`;
          btn.setAttribute('role', 'radio');
          btn.setAttribute('aria-checked', 'false');
          btn.setAttribute('data-nilai', String(item.originalIndex));
          btn.setAttribute('data-display-idx', String(displayIdx));
          btn.innerHTML = `
            <span class="opsi-nomor">${displayIdx + 1}</span>
            <span class="flex-grow-1">${item.teks}</span>
            <span class="badge bg-light text-secondary border border-dark rounded-pill small indikator-pilih-opsi">${hurufOpsi[displayIdx] || ''}</span>
          `;

          btn.addEventListener('click', () => {
            if (sudahMengunci) return;
            pilihOpsi(String(item.originalIndex), btn, hurufOpsi[displayIdx] || '');
          });

          wadahOpsi.appendChild(btn);
        });
      }"""

if old_render in c:
    c = c.replace(old_render, new_render, 1)
    print("REPLACED_RENDER_SISWA")
else:
    print("RENDER_BLOCK_NOT_FOUND")

with open('siswa/main.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("SUCCESS_PATCH_SISWA")

