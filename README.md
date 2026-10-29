# KUPAS KUIS IPAS v4.0

Aplikasi web kuis interaktif IPAS (Ilmu Pengetahuan Alam dan Sosial) untuk siswa kelas V SD dengan materi **Ekosistem dan Rantai Makanan**.

## Fitur Utama
1. **Desain Responsif Mobile-First (320px–1920px)**: Design system terpusat (`Nunito` & `Inter`), target sentuh minimal `48px` (`64px` pada layar Smartboard), navigasi adaptif (Bottom-Nav & Offcanvas di HP/Tablet, Sidebar di Laptop), dan tabel yang otomatis berubah menjadi kartu bertumpuk di layar ponsel.
2. **Dashboard Guru Profesional**:
   - **Ekspor & Rekap Nilai**: Filter per kuis, kelas, siswa, dan rentang tanggal; unduh dalam format **Excel (`.xlsx` via SheetJS)**, **CSV (`.csv`)**, dan **PDF siap cetak (`.pdf` via jsPDF + autoTable)**.
   - **Statistik & KKM Dinamis**: Rata-rata, nilai tertinggi/terendah, persentase ketuntasan dengan batas KKM yang dapat diatur guru, serta jumlah peserta.
   - **Analisis Butir Soal & Daftar Remedial**: Identifikasi soal tersulit/termudah, `% siswa menjawab benar`, opsi pengecoh terbanyak, serta daftar siswa di bawah KKM atau belum mengerjakan.
   - **Grafik Perkembangan & Pemantauan Realtime**: Grafik perkembangan nilai per kelas dan per siswa dari waktu ke waktu (`Chart.js`) serta pemantauan progres siswa secara langsung saat sesi berlangsung.
   - **Manajemen Kuis, Bank Soal & Kelas/Siswa**: Acak soal, jadwal buka/tutup, arsip kuis, impor bank soal dari CSV/Excel, manajemen kelas/siswa massal, reset kode akses, pindah kelas, dan catatan guru privat yang dilindungi RLS.
3. **Gamifikasi Siswa & Animasi Kartun 2D 60fps**:
   - Maskot SVG ekspresif (*senang*, *berpikir*, *semangat*, *bersorak*, dan *sedih-menyemangati* yang ramah tanpa menghakimi).
   - Sistem **XP, Level, Streak Harian, Streak Jawaban, Lencana**, bar progres kuis halus, dan papan peringkat kelas.
   - Animasi murni menggunakan `transform` dan `opacity` dengan 3 opsi gerak (**Penuh**, **Kurang**, **Mati**) serta dukungan `@media (prefers-reduced-motion: reduce)`.
4. **Kamus Belajar IPAS**: Mode daftar & kartu bolak-balik (*flashcard*) mandiri bagi siswa sebelum kuis, terintegrasi langsung dengan layar pembahasan soal.
5. **Keamanan Kunci Jawaban & RLS**: Kunci jawaban hanya disimpan di tabel `soal_kunci` dan dinilai melalui fungsi RPC `kirim_jawaban`. Klien hanya menggunakan `SUPABASE_ANON_KEY`.

## Cara Menghubungkan Supabase Cloud
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Jalankan berkas SQL secara berurutan di SQL Editor Supabase:
   - `supabase/schema.sql`
   - `supabase/migrations/20261028_tabel_kamus.sql`
   - `supabase/migrations/20261029_dasbor_guru_profesional.sql`
   - `supabase/seed.sql`
3. Buka berkas `assets/js/config.js` dan isi nilai proyek Anda:
   ```javascript
   export const SUPABASE_URL = 'https://xyzcompany.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJh...';
   ```
4. Deploy folder proyek ke layanan hosting statis (Cloudflare Pages, Netlify, Vercel, atau GitHub Pages).

## Menjalankan Secara Lokal
Jalankan server statis sederhana di direktori proyek:
```bash
python -m http.server 8000
```
Lalu buka `http://localhost:8000` di peramban. Saat `SUPABASE_URL` masih berupa placeholder, aplikasi otomatis menjalankan simulasi basis data lokal dan `BroadcastChannel` Realtime lintas-tab.
