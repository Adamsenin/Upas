# PRD KUPAS KUIS IPAS v4.0

Aplikasi web kuis interaktif IPAS untuk kelas V SD, dengan animasi kartun 2D, mode Custom Guru dan Adventure Kelas, serta sinkronisasi waktu nyata lewat Supabase.

**Versi:** 4.0 | **Status:** Draf untuk implementasi | **Acuan:** AI coding agent dan pengembang

## 1. Ringkasan

KUPAS KUIS IPAS adalah website pembelajaran yang dipakai guru untuk menampilkan kuis di layar kelas (Smartboard atau laptop dengan proyektor) dan siswa menjawab lewat perangkat masing-masing atau langsung di Smartboard. Materi awal adalah ekosistem dan rantai makanan (IPAS kelas V). Produk ini online sejak versi pertama, tidak ada mode offline.

### 1.1 Tujuan

1. Membuat guru dapat menyusun dan menjalankan kuis IPAS dalam waktu singkat.
2. Membuat siswa kelas V terlibat lewat tampilan kartun 2D dan animasi yang responsif.
3. Menyajikan hasil belajar (skor, jawaban, penjelasan) secara langsung.
4. Berjalan lancar di laptop, tablet, Smartboard, dan ponsel.

### 1.2 Bukan tujuan (v4.0)

- Tidak ada aplikasi native dan tidak ada mode offline.
- Tidak ada pembayaran, iklan, atau fitur sosial di luar kelas.
- Tidak ada penilaian rapor resmi; skor hanya untuk latihan dan diskusi kelas.
- Tidak ada pengelolaan banyak sekolah atau peran administrator sekolah (skala awal 1 guru, 1 sekolah).

## 2. Riwayat versi

| Versi | Perubahan utama |
| --- | --- |
| 2.1 | PRD awal, stack Node.js/Express dan Supabase Cloud |
| 3.0 | Penajaman "Final Game Interaktif" |
| 4.0 | Website online sejak awal; stack disederhanakan menjadi HTML, CSS, JavaScript, Bootstrap 5, dan Supabase (Auth, Database, Realtime); spesifikasi animasi dan aksesibilitas ditambahkan; tanpa server Node.js sendiri |

## 3. Pengguna dan skala

| Peran | Deskripsi | Cara masuk |
| --- | --- | --- |
| Guru | Membuat kuis, menjalankan sesi, melihat hasil | Email dan kata sandi (Supabase Auth) |
| Siswa | Kelas V SD, sekitar 9 sampai 11 tahun, bergabung ke sesi | Kode sesi dan nama panggilan, tanpa email (Supabase anonymous sign-in) |

**Skala awal:** 1 guru, 1 sekolah, sekitar 20 sampai 40 siswa per sesi. Desain tetap memakai Row Level Security agar dapat berkembang tanpa perombakan.

## 4. Mode permainan

### 4.1 Custom Guru

Guru membuat kuis sendiri dan menjalankannya.

- Membuat, mengubah, menggandakan, dan menghapus kuis.
- Tipe soal: pilihan ganda (3 sampai 4 opsi), benar/salah, dan isian singkat. Soal urutan atau pasangkan (misalnya menyusun rantai makanan) dijadwalkan sebagai tipe tambahan jika waktu memungkinkan.
- Tiap soal memiliki teks, gambar opsional, kunci jawaban, penjelasan singkat, batas waktu, dan poin.
- Guru dapat mengacak urutan soal dan opsi.
- Guru menjalankan sesi: lobi, soal demi soal dikendalikan guru, papan skor, hasil akhir.

### 4.2 Adventure Kelas

Kuis berbentuk petualangan bersama satu kelas.

- Seluruh kelas bergerak sebagai satu tim melewati "rute" petualangan bertema ekosistem (misalnya hutan, sawah, sungai, laut).
- Tiap soal yang dijawab benar menggerakkan maskot kelas satu langkah di peta; jawaban salah memicu animasi hambatan lalu penjelasan.
- Di akhir rute ada ringkasan capaian kelas dan lencana.
- Mode ini memakai Supabase Realtime sehingga posisi di peta tampil serentak di layar guru dan layar siswa.
- Skor perorangan tetap dicatat, tetapi tampilan utama menekankan capaian kelas agar suasana kolaboratif.

### 4.3 Materi awal

Ekosistem dan rantai makanan: produsen, konsumen, pengurai, jaring-jaring makanan, hubungan saling bergantung, dan dampak perubahan lingkungan. Bank soal contoh disiapkan minimal 20 soal untuk uji coba. Isi soal harus ditinjau guru sebelum dipakai.

## 5. Alur pengguna

### 5.1 Guru

1. Masuk, lalu tiba di dasbor.
2. Membuat atau memilih kuis.
3. Menekan **Mulai Sesi**; sistem membuat kode sesi 6 karakter.
4. Di lobi, nama siswa muncul secara langsung.
5. Guru menekan **Mulai**; soal pertama tampil.
6. Setelah waktu habis atau semua siswa menjawab, guru membuka pembahasan, lalu lanjut.
7. Di akhir: papan skor, hasil akhir, dan ekspor hasil (CSV).

### 5.2 Siswa

1. Membuka halaman gabung, memasukkan kode sesi dan nama panggilan, lalu memilih avatar.
2. Menunggu di lobi.
3. Menjawab tiap soal sebelum waktu habis.
4. Melihat umpan balik benar atau salah dan penjelasan.
5. Melihat posisi dan hasil akhir.

### 5.3 Penanganan keadaan khusus

- Siswa terputus: dapat bergabung kembali dengan kode dan nama yang sama; skor tetap tersimpan.
- Guru terputus: sesi tetap hidup 30 menit; guru dapat melanjutkan dari dasbor.
- Kode sesi tidak ditemukan atau sesi sudah selesai: tampil pesan ramah dengan animasi maskot bingung.
- Nama panggilan kosong, terlalu panjang (maks 20 karakter), atau memuat kata yang tidak pantas: ditolak dengan pesan jelas.

## 6. Spesifikasi UI dan UX

### 6.1 Prinsip

1. Satu layar, satu tujuan: setiap halaman hanya menampilkan tindakan utama yang diperlukan.
2. Tulisan besar dan jelas; bahasa Indonesia sederhana sesuai usia 9 sampai 11 tahun.
3. Tombol utama selalu mudah ditemukan dan berwarna konsisten.
4. Guru dapat mengendalikan sesi tanpa bingung: status sesi dan tombol berikutnya selalu terlihat.

### 6.2 Daftar halaman

| Halaman | Pengguna | Isi utama |
| --- | --- | --- |
| Beranda | Semua | Pilihan **Saya Guru** dan **Saya Siswa**, maskot |
| Gabung | Siswa | Kode sesi, nama panggilan, pilih avatar |
| Masuk dan Daftar | Guru | Formulir Supabase Auth, pemulihan kata sandi |
| Dasbor Guru | Guru | Daftar kuis, tombol buat kuis, riwayat sesi |
| Editor Kuis | Guru | Daftar soal, formulir soal, pratinjau |
| Lobi | Guru dan siswa | Kode sesi besar, daftar peserta, tombol mulai |
| Layar Soal | Guru dan siswa | Soal, opsi, penghitung waktu |
| Umpan Balik dan Pembahasan | Guru dan siswa | Hasil jawaban, penjelasan |
| Peta Petualangan | Guru dan siswa | Peta rute, posisi maskot (mode Adventure) |
| Papan Skor | Guru dan siswa | Peringkat sementara |
| Hasil Akhir | Guru dan siswa | Ringkasan, lencana, ekspor (guru) |
| Tidak Ditemukan dan Kesalahan | Semua | Pesan ramah dan tombol kembali |

### 6.3 Tata letak responsif (Bootstrap 5)

| Perangkat | Lebar acuan | Pedoman |
| --- | --- | --- |
| Ponsel | 360 sampai 430 px | Satu kolom, opsi jawaban bertumpuk, tombol penuh lebar |
| Tablet | 768 sampai 1024 px | Dua kolom untuk opsi, mode potret dan lanskap |
| Laptop | 1366 px ke atas | Tata letak penuh, dukungan keyboard |
| Smartboard | 1920 x 1080 | Font dan tombol diperbesar, tanpa kebutuhan gestur rumit, tidak bergantung pada hover |

Tata letak memakai grid, `container-fluid`, dan satuan relatif (`rem`, `vw`, `clamp()`). Tidak ada elemen penting yang hanya muncul saat hover.

### 6.4 Gaya visual

- Kartun 2D datar dengan garis tegas, warna cerah namun tidak menyilaukan, dan sudut membulat.
- Satu maskot tetap (nama dan rancangan ditentukan kemudian) dengan beberapa ekspresi: senang, berpikir, bingung, bersorak.
- Seluruh ilustrasi dibuat sebagai SVG agar tajam di layar besar dan ringan.
- Palet warna dan jenis huruf ditetapkan di variabel CSS (`:root`) agar mudah diubah.

## 7. Spesifikasi animasi

Animasi bersifat interaktif, bergaya kartun 2D, berintensitas tinggi, dan hadir di seluruh halaman. Animasi harus membantu pemahaman dan memberi umpan balik, bukan sekadar hiasan.

### 7.1 Teknologi

- HTML, CSS (`@keyframes`, transition, custom properties), JavaScript, dan SVG.
- Web Animations API (`element.animate()`) untuk animasi yang dikendalikan lewat skrip.
- Tidak memakai pustaka animasi berat. Pustaka kecil hanya dipertimbangkan jika benar-benar perlu dan disetujui.
- Semua animasi dikelola lewat satu modul `animasi.js` agar mudah diatur, dijeda, dan dimatikan.

### 7.2 Aturan umum

| Aspek | Ketentuan |
| --- | --- |
| Properti | Utamakan `transform` dan `opacity`; hindari animasi `width`, `height`, `top`, `left` |
| Durasi | Mikro-interaksi 120 sampai 250 ms; transisi halaman 300 sampai 500 ms; perayaan hingga 2 detik |
| Easing | Memantul (overshoot) untuk elemen ceria; ease-out untuk masuk; ease-in untuk keluar |
| Stagger | Elemen daftar masuk berurutan dengan jeda 40 sampai 80 ms |
| Batas bersamaan | Maksimal sekitar 30 elemen beranimasi serentak di perangkat lemah |
| Kedip | Tidak ada kedipan lebih dari 3 kali per detik |
| Tab tidak aktif | Animasi berulang dijeda saat tab tidak terlihat |
| Target kinerja | 60 fps di laptop dan tablet kelas menengah; minimal 30 fps stabil di Smartboard |

### 7.3 Respons terhadap masukan

Setiap elemen interaktif merespons sentuh, klik, dan keyboard dengan animasi yang sama:

- **Tekan:** mengecil sedikit (skala 0,95).
- **Lepas:** memantul kembali.
- **Fokus keyboard:** cincin fokus tebal dengan denyut halus.
- **Tidak aktif:** meredup tanpa animasi.
- Pada layar sentuh, riak atau percikan kecil muncul di titik sentuh.

### 7.4 Katalog animasi per halaman

| Halaman | Animasi |
| --- | --- |
| Beranda | Maskot melambai dan berkedip; latar berlapis (awan, daun) bergerak pelan; dua tombol besar memantul masuk bergantian |
| Gabung | Kolom kode sesi bergoyang halus saat salah; avatar yang dipilih melompat dan berputar kecil; tombol gabung berdenyut saat siap |
| Masuk dan Daftar | Kartu formulir meluncur masuk; kesalahan validasi menggoyang kolom; keberhasilan memunculkan centang berbentuk gambar garis |
| Dasbor Guru | Kartu kuis masuk berurutan; hover atau tekan mengangkat kartu; status kosong menampilkan maskot dan panah menunjuk tombol Buat Kuis |
| Editor Kuis | Soal baru tumbuh dari tombol tambah; hapus dengan efek menyusut dan hilang; urutan soal bergeser mulus saat diseret |
| Lobi | Peserta baru muncul sebagai gelembung yang melayang masuk dengan nama; kode sesi besar bergetar halus; hitung mundur 3-2-1 sebelum mulai |
| Layar Soal | Soal masuk dari sisi; opsi muncul berurutan; penghitung waktu berbentuk lingkaran atau bar yang menyusut dan berubah warna mendekati habis; opsi terpilih menandai dengan memantul |
| Umpan Balik | Benar: maskot bersorak, percikan bintang dan konfeti ringan. Salah: maskot berpikir, opsi benar disorot dengan lembut; tidak ada animasi yang mempermalukan |
| Pembahasan | Panel penjelasan terbuka seperti buku; diagram rantai makanan tergambar bertahap (panah mengalir dari produsen ke konsumen) |
| Peta Petualangan | Maskot berjalan di sepanjang rute SVG; rintangan dan pemandangan berganti tiap zona; langkah maju memicu debu atau daun beterbangan |
| Papan Skor | Baris peringkat bertukar tempat dengan geser mulus; angka skor menghitung naik; tiga teratas diberi mahkota dan podium |
| Hasil Akhir | Perayaan penuh: konfeti, lencana berputar masuk, angka capaian menghitung naik, maskot melompat |
| Kesalahan dan Tidak Ditemukan | Maskot kebingungan dengan tanda tanya bergoyang; tombol Kembali berdenyut |

### 7.5 Suara (opsional)

Efek suara pendek untuk benar, salah, dan perayaan, dimatikan secara bawaan di sisi siswa dan dapat dinyalakan. Ada tombol bisukan yang selalu terlihat. Tidak ada musik latar otomatis.

### 7.6 Pengaturan animasi

Tiga tingkat, dapat diubah dari ikon pengaturan di semua halaman:

1. **Penuh** (bawaan): seluruh katalog di atas.
2. **Kurang:** animasi dikurangi menjadi pemudaran dan perubahan warna sederhana; maskot tetap muncul tetapi tidak bergerak berlebihan.
3. **Mati:** tanpa gerak; hanya perubahan keadaan instan.

Bila perangkat melaporkan `prefers-reduced-motion: reduce`, tingkat awal otomatis **Kurang**. Pilihan pengguna disimpan di `localStorage`.

## 8. Aksesibilitas

Target: WCAG 2.2 level AA sejauh relevan, ditambah kebutuhan khusus Smartboard dan anak SD.

### 8.1 Gerak

- Wajib mendukung `prefers-reduced-motion` seperti pada bagian 7.6.
- Tidak ada konten yang hanya dapat dipahami lewat animasi; setiap animasi berarti selalu disertai teks atau ikon.
- Tidak ada kedipan melebihi 3 kali per detik.

### 8.2 Keyboard dan fokus

- Semua fungsi dapat dipakai dengan keyboard: Tab, Shift+Tab, Enter, Spasi, tombol panah.
- Pintasan di Layar Soal: tombol 1 sampai 4 memilih opsi; Enter mengunci jawaban; Spasi atau Enter melanjutkan (guru).
- Urutan fokus mengikuti urutan baca; fokus berpindah ke soal baru saat soal berganti.
- Cincin fokus selalu terlihat dengan kontras cukup.

### 8.3 Pembaca layar dan semantik

- Memakai elemen HTML semantik (`header`, `main`, `nav`, `button`, `label`).
- Hasil jawaban, hitung mundur penting, dan peserta baru diumumkan lewat `aria-live` secara sopan (`polite`), tanpa membanjiri.
- SVG dekoratif diberi `aria-hidden="true"`; SVG bermakna diberi `role="img"` dan teks alternatif.
- Atribut `lang="id"` pada dokumen.

### 8.4 Visual

- Kontras teks minimal 4,5:1 (teks besar 3:1).
- Benar dan salah tidak hanya dibedakan oleh warna: ditambah ikon (centang dan silang) dan teks.
- Teks minimal 16 px di ponsel; di Smartboard teks soal minimal 32 px dan teks opsi minimal 24 px.
- Zoom teks hingga 200 persen tanpa kehilangan fungsi.

### 8.5 Sentuh dan Smartboard

- Target sentuh minimal 48 x 48 px (ponsel dan tablet) dan 64 x 64 px (Smartboard).
- Tidak bergantung pada gestur multi-sentuh, tekan lama, atau hover.
- Waktu menjawab dapat diperpanjang guru per sesi (misalnya pengali 1,5x atau 2x) untuk siswa yang membutuhkan.

## 9. Arsitektur teknis

### 9.1 Stack

| Lapisan | Pilihan |
| --- | --- |
| Antarmuka | HTML5, CSS3, JavaScript (ES modules), Bootstrap 5, SVG |
| Autentikasi | Supabase Auth (email untuk guru; anonymous sign-in untuk siswa) |
| Basis data | Supabase PostgreSQL dengan Row Level Security |
| Waktu nyata | Supabase Realtime (Broadcast, Presence, Postgres Changes) |
| Penyimpanan gambar | Supabase Storage (bucket untuk gambar soal) |
| Hosting | Hosting statis (misalnya Netlify, Vercel, Cloudflare Pages, atau GitHub Pages); tidak ada server Node.js sendiri |

Klien Supabase dimuat lewat `@supabase/supabase-js`. Hanya `anon` key publik yang berada di kode klien; `service_role` key tidak pernah dipakai di klien. Pendekatan tanpa langkah build dipilih agar sederhana; bila nanti dibutuhkan, Vite dapat dipakai tanpa mengubah struktur modul.

### 9.2 Struktur proyek

```
kupas/
  index.html
  gabung.html
  guru/
    masuk.html
    dasbor.html
    editor.html
    sesi.html
  siswa/
    main.html
  assets/
    css/ (tema.css, animasi.css, komponen.css)
    js/
      supabase.js     (inisialisasi klien)
      auth.js
      kuis.js         (CRUD kuis dan soal)
      sesi.js         (siklus sesi, Realtime)
      animasi.js      (pengelola animasi dan pengaturan gerak)
      ui.js
    svg/ (maskot, ikon, latar, peta)
    audio/
  README.md
```

## 10. Model data

Semua tabel memakai `uuid` sebagai kunci utama dan `created_at` bertipe `timestamptz`.

| Tabel | Kolom utama |
| --- | --- |
| `profil` | `id` (= `auth.users.id`), `nama`, `sekolah` |
| `kuis` | `id`, `guru_id`, `judul`, `topik`, `deskripsi`, `status` (draf atau terbit) |
| `soal` | `id`, `kuis_id`, `urutan`, `tipe`, `teks`, `gambar_path`, `opsi` (jsonb), `penjelasan`, `waktu_detik`, `poin` |
| `soal_kunci` | `soal_id`, `kunci` (jsonb); terpisah agar tidak terbaca siswa |
| `sesi` | `id`, `kuis_id`, `guru_id`, `kode`, `mode` (custom atau adventure), `status` (lobi, berjalan, selesai), `soal_aktif`, `pengali_waktu` |
| `peserta` | `id`, `sesi_id`, `user_id`, `nama_panggilan`, `avatar`, `skor` |
| `jawaban` | `id`, `sesi_id`, `peserta_id`, `soal_id`, `jawaban` (jsonb), `benar`, `poin`, `waktu_ms` |

### 10.1 Aturan keamanan (Row Level Security)

- Guru hanya dapat membaca dan mengubah `kuis`, `soal`, `soal_kunci`, dan `sesi` miliknya.
- Siswa tidak pernah dapat membaca `soal_kunci`.
- Penilaian jawaban dilakukan di sisi basis data (fungsi Postgres `SECURITY DEFINER`, misalnya `kirim_jawaban(...)`) sehingga kunci tidak pernah dikirim ke klien dan skor tidak dapat dimanipulasi dari konsol peramban.
- Siswa hanya dapat menambah `peserta` pada sesi berstatus lobi atau berjalan dan hanya dapat menulis `jawaban` miliknya sendiri, satu kali per soal.
- Pembuatan kode sesi dilakukan lewat fungsi basis data yang memastikan kode unik di antara sesi aktif.
- Soal yang dikirim ke siswa hanya soal aktif; soal berikutnya belum terbaca sebelum guru membukanya.

## 11. Desain waktu nyata

Satu kanal per sesi: `sesi:{kode}`.

| Kebutuhan | Mekanisme |
| --- | --- |
| Siswa masuk atau keluar lobi | Presence |
| Guru menggerakkan sesi (mulai, soal berikut, buka pembahasan, selesai) | Broadcast dari guru, disimpan pula di `sesi.status` dan `sesi.soal_aktif` sebagai sumber kebenaran |
| Guru melihat jumlah siswa yang sudah menjawab | Postgres Changes pada `jawaban` (tanpa menampilkan isi jawaban ke siswa lain) |
| Posisi peta dan skor kelas (Adventure) | Dihitung dari data `jawaban` dan disiarkan guru |

Bila koneksi putus, klien mengambil ulang keadaan terakhir dari `sesi` saat tersambung kembali. Pengatur waktu soal berbasis waktu server (`soal_mulai_at`) agar jam di perangkat siswa yang berbeda tidak memengaruhi hasil.

## 12. Keamanan dan privasi

- Siswa tidak memasukkan email, nama lengkap, atau data pribadi lain; hanya nama panggilan.
- Data siswa dibatasi pada sesi dan dapat dihapus otomatis setelah periode tertentu (usulan: 12 bulan) atau atas permintaan guru.
- Semua lalu lintas memakai HTTPS.
- Masukan pengguna dibersihkan dan ditampilkan sebagai teks, bukan HTML, untuk mencegah XSS.
- Pembatasan laju (rate limit) pada pembuatan sesi dan percobaan gabung untuk mencegah penyalahgunaan; mengandalkan batas bawaan Supabase dan validasi di fungsi basis data.
- Persetujuan penggunaan data siswa mengikuti kebijakan sekolah; sekolah bertanggung jawab atas izin orang tua bila diwajibkan.

## 13. Persyaratan non-fungsional

| Aspek | Target |
| --- | --- |
| Waktu muat awal | Di bawah 3 detik pada jaringan 4G; total aset halaman awal sebaiknya di bawah 1,5 MB |
| Latensi realtime | Perubahan keadaan sesi tampil di klien dalam kurang dari 1 detik pada kondisi normal |
| Kapasitas | 40 siswa serentak dalam satu sesi tanpa penurunan kualitas |
| Ketersediaan | Mengikuti ketersediaan Supabase dan hosting statis; tampilkan pesan jelas bila koneksi hilang |
| Peramban | Dua versi terbaru Chrome, Edge, Firefox, dan Safari; Chrome Android dan Safari iOS |
| Bahasa | Bahasa Indonesia; teks disimpan terpusat agar mudah diubah |

## 14. Pengujian kompatibilitas dan kualitas

### 14.1 Matriks perangkat

| Perangkat | Yang diuji |
| --- | --- |
| Laptop (Windows dan macOS) | Tata letak penuh, keyboard, kinerja animasi |
| Tablet (Android dan iPad) | Potret dan lanskap, sentuh, keyboard virtual saat mengisi nama |
| Smartboard (1920 x 1080, layar sentuh IR) | Ukuran huruf dan target sentuh, kinerja animasi, sentuh dari jarak dan posisi berdiri, tanpa hover |
| Ponsel (360 sampai 430 px) | Satu kolom, penggunaan satu tangan, jaringan lambat |

### 14.2 Daftar periksa

1. Semua halaman dapat dipakai dengan keyboard saja.
2. Mode animasi Penuh, Kurang, dan Mati bekerja di semua halaman.
3. `prefers-reduced-motion` mengubah tingkat awal secara otomatis.
4. Pembaca layar mengumumkan hasil jawaban dan perubahan soal.
5. Kontras dan ukuran huruf memenuhi bagian 8.4.
6. Sesi dengan 40 peserta berjalan sampai selesai tanpa kehilangan skor.
7. Putus sambung jaringan siswa dan guru tertangani sesuai bagian 5.3.
8. Kunci jawaban tidak dapat ditemukan lewat konsol atau tab jaringan peramban siswa.
9. Tidak ada kedipan di atas 3 kali per detik.
10. Animasi tetap lancar (tidak patah-patah) di perangkat Smartboard sebenarnya milik sekolah.

## 15. Tahapan pengerjaan

| Tahap | Hasil |
| --- | --- |
| M0. Fondasi | Proyek Supabase, skema dan RLS, kerangka halaman, tema Bootstrap, modul `animasi.js` dengan pengaturan gerak |
| M1. Akun dan kuis | Masuk guru, dasbor, editor kuis (CRUD soal), unggah gambar |
| M2. Mode Custom Guru | Pembuatan sesi, gabung siswa, lobi, soal, penilaian lewat fungsi basis data, papan skor, hasil, ekspor CSV |
| M3. Mode Adventure Kelas | Peta SVG, maskot berjalan, skor kelas, lencana |
| M4. Poles animasi | Seluruh katalog bagian 7.4, suara opsional |
| M5. Aksesibilitas dan kompatibilitas | Pengujian bagian 14, perbaikan |
| M6. Uji coba kelas | Dipakai di satu kelas nyata, kumpulkan masukan guru dan siswa |

## 16. Kriteria penerimaan v4.0

1. Guru dapat membuat kuis 10 soal dan menjalankan sesi sampai selesai dalam satu kali duduk tanpa bantuan pengembang.
2. Siswa dapat bergabung hanya dengan kode dan nama panggilan, dan hasil mereka tersimpan.
3. Kedua mode (Custom Guru dan Adventure Kelas) berjalan di laptop dan Smartboard.
4. Seluruh halaman dalam bagian 6.2 memiliki animasi sesuai katalog bagian 7.4, dan ketiga tingkat animasi berfungsi.
5. Semua item daftar periksa bagian 14.2 lolos.
6. Tidak ada kunci rahasia (`service_role`) di kode klien dan RLS aktif di semua tabel.

## 17. Risiko dan mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Animasi intensitas tinggi membuat Smartboard atau ponsel lama patah-patah | Anggaran animasi (bagian 7.2), uji di perangkat sekolah sejak M0, tingkat animasi Kurang atau Mati |
| Animasi mengganggu siswa yang sensitif gerak | Dukungan `prefers-reduced-motion` dan pengaturan manual |
| Kecurangan lewat konsol peramban | Penilaian dan kunci jawaban hanya di sisi basis data |
| Jaringan sekolah tidak stabil | Pemulihan keadaan sesi otomatis, pengatur waktu berbasis server, pesan koneksi jelas |
| Batas gratis Supabase terlampaui | Pantau penggunaan; skala 1 guru 1 sekolah diperkirakan masih aman, rencana upgrade disiapkan |
| Kode berantakan karena tanpa kerangka kerja | Struktur modul jelas (bagian 9.2), pembagian tanggung jawab per berkas |

## 18. Asumsi dan pertanyaan terbuka

1. Nama dan rancangan maskot belum ditetapkan.
2. Kebijakan retensi data (usulan 12 bulan) perlu disetujui pihak sekolah.
3. Apakah suara efek diperlukan di kelas atau cukup visual.
4. Hosting statis mana yang dipakai (Netlify, Vercel, Cloudflare Pages, atau GitHub Pages).
5. Tipe soal tambahan (urutan, pasangkan) masuk v4.0 atau ditunda ke v4.1.
6. Spesifikasi dan browser sebenarnya pada Smartboard sekolah perlu dipastikan sebelum M5.

## 19. Fitur Kamus Belajar
Kamus Belajar memungkinkan siswa mempelajari materi IPAS kelas V sebelum latihan soal, serta meninjau konsep setelah kuis.
- **Tabel `kamus`:** `id`, `guru_id`, `istilah`, `kategori`, `definisi`, `contoh`, `gambar_path`, `status` (terbit/draf), `created_at`.
- **Relasi:** Kolom `soal.kamus_id` (nullable, `on delete set null`) menghubungkan soal ke entri kamus terkait.
- **Keamanan RLS:** Entri 'terbit' dibaca publik/siswa tanpa login; manipulasi (tambah, ubah, hapus) hanya oleh guru pemilik.
- **Halaman Siswa (`kamus-belajar.html`):** Akses langsung dari Beranda; pencarian, filter kategori, mode kartu balik (flashcard), dan penanda progres belajar tersimpan di `localStorage`.
- **Halaman Guru (`guru/kamus.html`):** CRUD entri kamus terhubung langsung dengan kuis; pembuatan entri baru cepat dari editor soal.
- **Tautan Pembahasan:** Layar pembahasan menampilkan tombol pintas "Pelajari: [istilah]" bila soal tertaut ke kamus.
- **Audio & Musik:** Generator suara interaktif dan musik latar ceria sintetis Web Audio API tanpa dependensi berkas eksternal.

## 19. Ukuran keberhasilan

Ukuran ini dipakai pada tahap uji coba kelas (M6) untuk menilai apakah produk layak dipakai rutin.

| Ukuran | Target awal | Cara mengukur |
| --- | --- | --- |
| Guru menyelesaikan pembuatan kuis 10 soal tanpa bantuan | Di bawah 20 menit | Pengamatan saat uji coba |
| Siswa berhasil bergabung ke sesi | Di atas 95 persen percobaan pertama | Pengamatan dan catatan sesi |
| Sesi selesai tanpa gangguan teknis | Di atas 90 persen sesi | Catatan guru setelah sesi |
| Animasi lancar di Smartboard sekolah | Tidak patah-patah pada pengamatan guru | Uji langsung di perangkat |
| Kepuasan guru | Nilai 4 dari 5 atau lebih | Formulir singkat setelah uji coba |
| Keterlibatan siswa | Mayoritas siswa menjawab semua soal dalam sesi | Data jawaban per peserta |

Target di atas adalah usulan awal dan boleh disesuaikan setelah uji coba pertama.

## 20. Lampiran

### Lampiran A. Pintasan keyboard

| Tombol | Fungsi | Berlaku di |
| --- | --- | --- |
| 1, 2, 3, 4 | Memilih opsi jawaban | Layar Soal |
| Enter | Mengunci jawaban atau melanjutkan | Layar Soal, Pembahasan |
| Spasi | Melanjutkan ke langkah berikutnya (guru) | Pembahasan, Papan Skor |
| Tab dan Shift+Tab | Berpindah antar elemen | Semua halaman |
| Esc | Menutup panel pengaturan atau dialog | Semua halaman |
| M | Membisukan atau menyalakan suara | Semua halaman |

### Lampiran B. Palet warna awal (usulan)

Nilai ini disimpan sebagai variabel CSS di `:root` dan boleh diganti. Semua pasangan teks dan latar harus diperiksa agar memenuhi kontras 4,5:1.

| Peran | Warna | Kode |
| --- | --- | --- |
| Utama (tombol utama) | Hijau daun | `#2E9E5B` |
| Sekunder | Biru langit | `#2F80ED` |
| Aksen | Kuning cerah | `#F2C94C` |
| Benar | Hijau tua | `#1B7F43` |
| Salah | Merah bata | `#C0392B` |
| Teks | Abu gelap | `#1F2937` |
| Latar | Krem muda | `#FFF8E7` |

### Lampiran C. Contoh soal untuk bank soal awal

Contoh berikut menunjukkan format data soal. Guru wajib meninjau isi soal sebelum dipakai di kelas.

| Tipe | Soal | Opsi | Jawaban | Penjelasan |
| --- | --- | --- | --- | --- |
| Pilihan ganda | Makhluk hidup yang membuat makanannya sendiri disebut ... | A. Konsumen, B. Produsen, C. Pengurai, D. Pemangsa | B. Produsen | Tumbuhan hijau membuat makanan sendiri lewat fotosintesis. |
| Benar/salah | Jamur dan bakteri termasuk pengurai. | Benar, Salah | Benar | Pengurai menguraikan sisa makhluk hidup menjadi zat yang dibutuhkan tanah. |
| Pilihan ganda | Urutan rantai makanan yang tepat adalah ... | A. Elang, ular, tikus, padi; B. Padi, tikus, ular, elang; C. Tikus, padi, elang, ular; D. Ular, elang, padi, tikus | B | Panah rantai makanan menunjukkan arah perpindahan energi dari produsen ke konsumen. |

### Lampiran D. Daftar istilah

| Istilah | Arti |
| --- | --- |
| PRD | Dokumen kebutuhan produk yang menjadi acuan pembuatan aplikasi |
| RLS (Row Level Security) | Aturan di basis data yang membatasi baris data yang boleh dibaca atau diubah tiap pengguna |
| Realtime | Pembaruan tampilan secara langsung tanpa memuat ulang halaman |
| Presence | Fitur pelacak siapa yang sedang terhubung ke sebuah kanal |
| Broadcast | Pengiriman pesan ke semua klien yang terhubung ke kanal yang sama |
| Anonymous sign-in | Masuk tanpa email atau kata sandi, dipakai siswa |
| Smartboard | Layar sentuh interaktif besar di kelas |
| Reduced motion | Pengaturan perangkat yang meminta animasi dikurangi |
| Maskot | Tokoh kartun tetap yang menemani pengguna di seluruh aplikasi |

## 21. Penutup dan persetujuan

### 21.1 Ringkasan keputusan v4.0

1. Produk berupa website online sejak awal, tanpa mode offline dan tanpa server Node.js sendiri.
2. Teknologi: HTML, CSS, JavaScript, Bootstrap 5, dan SVG, dengan Supabase untuk autentikasi, basis data, dan Realtime.
3. Dua mode: Custom Guru dan Adventure Kelas, dengan materi awal ekosistem dan rantai makanan kelas V.
4. Animasi kartun 2D berintensitas tinggi di semua halaman, dengan tiga tingkat pengaturan dan dukungan `prefers-reduced-motion`.
5. Penilaian dan kunci jawaban hanya di sisi basis data; siswa tidak memberi data pribadi selain nama panggilan.
6. Target perangkat: laptop, tablet, Smartboard, dan ponsel.

### 21.2 Langkah berikutnya

1. Memutuskan pertanyaan terbuka pada bagian 18, terutama maskot, hosting, dan tipe soal tambahan.
2. Menyimpan dokumen ini sebagai `PRD.md` di folder proyek dan memberikannya kepada AI coding agent.
3. Membuat proyek Supabase dan mengisi konfigurasi klien di berkas konfigurasi proyek.
4. Mengerjakan tahap M0 sampai M6 sesuai bagian 15, lalu menguji sesuai bagian 14.
5. Menjalankan uji coba di satu kelas nyata dan mencatat masukan untuk versi berikutnya.

### 21.3 Ruang pengembangan berikutnya

Hal berikut sengaja tidak masuk v4.0 dan dapat dipertimbangkan di versi lanjutan: materi IPAS selain ekosistem, banyak guru dan banyak sekolah, laporan perkembangan siswa antarsesi, tipe soal tambahan, dan mode belajar mandiri untuk siswa.

### 21.4 Pengesahan

| Peran | Nama | Tanggal | Tanda tangan |
| --- | --- | --- | --- |
| Penyusun PRD |  |  |  |
| Guru pengguna utama |  |  |  |
| Pengembang |  |  |  |

Dokumen ini adalah acuan pengerjaan. Perubahan berikutnya dicatat pada tabel riwayat versi di bagian 2.

**Akhir dokumen PRD KUPAS KUIS IPAS v4.0.**
