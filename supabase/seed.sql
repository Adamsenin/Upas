-- ========================================================
-- KUPAS KUIS IPAS v4.0 - Seed Data (20 Kamus & 20 Soal Ekosistem)
-- ========================================================

do $$
declare
    v_guru_id uuid := '00000000-0000-0000-0000-000000000001';
    v_kuis_id uuid := '11111111-1111-1111-1111-111111111111';
    v_soal_id uuid;
begin
    -- 1. Buat profil guru contoh
    insert into public.profil (id, nama, sekolah)
    values (v_guru_id, 'Pak Budi Hartono', 'SD Negeri Merdeka 01')
    on conflict (id) do update set nama = excluded.nama;

    -- 2. Buat 20 Entri Kamus Belajar IPAS Kelas V (PRD Bagian 4.3)
    insert into public.kamus (id, guru_id, istilah, kategori, definisi, contoh, status) values
    ('30000000-0000-0000-0000-000000000001', v_guru_id, 'Produsen', 'Rantai Makanan', 
     'Makhluk hidup autotrof yang mampu membuat makanannya sendiri melalui proses fotosintesis.', 
     'Padi, rumput teki, pohon mangga, dan fitoplankton.', 'terbit'),
    ('30000000-0000-0000-0000-000000000002', v_guru_id, 'Konsumen Tingkat I', 'Rantai Makanan', 
     'Hewan herbivora yang langsung memakan produsen untuk memperoleh energi kelangsungan hidupnya.', 
     'Belalang sawah, ulat daun, kelinci, dan sapi.', 'terbit'),
    ('30000000-0000-0000-0000-000000000003', v_guru_id, 'Konsumen Tingkat II', 'Rantai Makanan', 
     'Hewan karnivora atau omnivora yang memangsa konsumen tingkat pertama dalam rantai makanan.', 
     'Katak pemakan belalang, ayam pemakan ulat, dan burung pipit.', 'terbit'),
    ('30000000-0000-0000-0000-000000000004', v_guru_id, 'Pengurai (Dekomposer)', 'Rantai Makanan', 
     'Organisme yang bertugas menguraikan sisa organisme mati menjadi unsur hara yang menyuburkan tanah.', 
     'Bakteri pengurai, jamur tanah, dan cacing tanah.', 'terbit'),
    ('30000000-0000-0000-0000-000000000005', v_guru_id, 'Energi Matahari', 'Ekosistem', 
     'Sumber energi primer terbesar di bumi yang diserap oleh klorofil tumbuhan untuk membuat makanan.', 
     'Cahaya matahari pagi yang menyinari hamparan sawah dan hutan.', 'terbit'),
    ('30000000-0000-0000-0000-000000000006', v_guru_id, 'Keseimbangan Ekosistem', 'Ekosistem', 
     'Kondisi harmonis di mana seluruh komponen biotik dan abiotik saling mendukung tanpa ada populasi yang punah atau meledak liar.', 
     'Terjaganya populasi katak di sawah yang mencegah ledakan hama belalang perusak padi.', 'terbit'),
    ('30000000-0000-0000-0000-000000000007', v_guru_id, 'Jaring-jaring Makanan', 'Rantai Makanan', 
     'Kumpulan dari beberapa rantai makanan yang saling tumpang tindih dan terhubung dalam suatu ekosistem.', 
     'Jaring-jaring makanan di hutan: pohon dimakan rusa dan ulat; ulat dimakan burung; burung dan rusa dimakan harimau.', 'terbit'),
    ('30000000-0000-0000-0000-000000000008', v_guru_id, 'Fitoplankton', 'Ekosistem', 
     'Organisme tumbuhan mikroskopis bersel tunggal yang melayang di perairan dan bertindak sebagai produsen utama laut.', 
     'Fitoplankton di lapisan atas laut yang menjadi makanan zooplankton.', 'terbit'),
    ('30000000-0000-0000-0000-000000000009', v_guru_id, 'Fotosintesis', 'Ekosistem', 
     'Proses pembentukan karbohidrat (glukosa) dan oksigen oleh tumbuhan berklorofil menggunakan air, karbon dioksida, dan cahaya matahari.', 
     'Daun menyerap cahaya matahari dan CO2 lalu melepaskan gas oksigen ke udara.', 'terbit'),
    ('30000000-0000-0000-0000-000000000010', v_guru_id, 'Piramida Makanan', 'Rantai Makanan', 
     'Diagram berbentuk piramida yang menggambarkan perbandingan biomassa dan energi, di mana produsen memiliki jumlah terbanyak di bagian dasar.', 
     'Piramida biomassa darat: produsen di dasar, herbivora di tengah, dan karnivora puncak di pucuk piramida.', 'terbit'),
    ('30000000-0000-0000-0000-000000000011', v_guru_id, 'Simbiosis Mutualisme', 'Saling Bergantung', 
     'Hubungan timbal balik antara dua makhluk hidup berbeda jenis yang saling menguntungkan kedua pihak.', 
     'Lebah madu yang mengisap nektar bunga sembari membantu proses penyerbukan serbuk sari.', 'terbit'),
    ('30000000-0000-0000-0000-000000000012', v_guru_id, 'Simbiosis Komensalisme', 'Saling Bergantung', 
     'Hubungan antara dua jenis makhluk hidup di mana satu pihak diuntungkan dan pihak lain tidak dirugikan maupun diuntungkan.', 
     'Tanaman anggrek yang menempel pada dahan pohon mangga untuk memperoleh sinar matahari.', 'terbit'),
    ('30000000-0000-0000-0000-000000000013', v_guru_id, 'Simbiosis Parasitisme', 'Saling Bergantung', 
     'Hubungan di mana satu pihak (parasit) mengambil keuntungan dan menyebabkan kerugian bagi pihak lain (inang).', 
     'Nyamuk mengisap darah manusia sehingga menimbulkan gatal dan risiko demam berdarah.', 'terbit'),
    ('30000000-0000-0000-0000-000000000014', v_guru_id, 'Pencemaran Air', 'Dampak Lingkungan', 
     'Masuknya limbah kimia, racun, atau sampah ke dalam badan air sehingga menurunkan mutu air dan mematikan biota perairan.', 
     'Pembuangan detergen dan limbah pabrik ke sungai yang mematikan ikan-ikan kecil.', 'terbit'),
    ('30000000-0000-0000-0000-000000000015', v_guru_id, 'Karnivora', 'Rantai Makanan', 
     'Kelompok hewan pemangsa yang makanan utamanya adalah daging atau hewan lain.', 
     'Harimau sumatera, elang jawa, serigala, dan singa.', 'terbit'),
    ('30000000-0000-0000-0000-000000000016', v_guru_id, 'Deforestasi (Penebangan Hutan)', 'Dampak Lingkungan', 
     'Kegiatan penebangan dan pembabatan pohon hutan secara liar yang merusak habitat satwa dan memicu banjir.', 
     'Pembalakan liar di kawasan hutan lindung yang memaksa gajah dan monyet masuk ke permukiman warga.', 'terbit'),
    ('30000000-0000-0000-0000-000000000017', v_guru_id, 'Pestisida Berlebihan', 'Dampak Lingkungan', 
     'Penggunaan racun pembasmi hama kimia secara berlebihan yang mematikan musuh alami serta mencemari tanah.', 
     'Penyemprotan insektisida kimia yang mematikan serangga penyerbuk seperti kupu-kupu dan lebah.', 'terbit'),
    ('30000000-0000-0000-0000-000000000018', v_guru_id, 'Aliran Energi', 'Rantai Makanan', 
     'Perpindahan energi makanan dari produsen ke konsumen puncak, di mana sebagian besar energi terlepas sebagai kalor/panas.', 
     'Energi fotosintesis padi berpindah ke belalang, lalu berkurang saat berpindah ke katak.', 'terbit'),
    ('30000000-0000-0000-0000-000000000019', v_guru_id, 'Omnivora', 'Rantai Makanan', 
     'Kelompok hewan pemakan segala yang dapat mengonsumsi bagian tumbuhan sekaligus hewan lain.', 
     'Ayam (memakan biji jagung dan cacing), bebek, tikus, dan beruang.', 'terbit'),
    ('30000000-0000-0000-0000-000000000020', v_guru_id, 'Habitat', 'Ekosistem', 
     'Tempat tinggal dan lingkungan hidup alami bagi suatu organisme untuk bertumbuh dan berkembang biak.', 
     'Hutan bakau pesisir sebagai habitat kepiting bakau dan ikan gelodok.', 'terbit')
    on conflict (id) do nothing;

    -- 3. Buat kuis contoh IPAS Kelas V
    insert into public.kuis (id, guru_id, judul, topik, deskripsi, status)
    values (
        v_kuis_id,
        v_guru_id,
        'Petualangan Rantai Makanan & Ekosistem',
        'Ekosistem dan Rantai Makanan (IPAS Kelas V)',
        'Kuis interaktif tentang produsen, konsumen, pengurai, jaring-jaring makanan, dan keseimbangan alam.',
        'terbit'
    )
    on conflict (id) do nothing;

    -- 4. Buat 20 Soal dengan Tautan ke Kamus (kamus_id)
    -- Soal 1 -> Produsen
    v_soal_id := '20000000-0000-0000-0000-000000000001';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000001', 1, 'pilihan_ganda',
        'Dalam ekosistem sawah, makhluk hidup yang berperan sebagai produsen adalah...',
        '["Padi", "Tikus", "Ular", "Elang"]'::jsonb,
        'Padi adalah tumbuhan hijau yang mampu membuat makanan sendiri melalui proses fotosintesis sehingga berperan sebagai produsen.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 2 -> Konsumen Tingkat I
    v_soal_id := '20000000-0000-0000-0000-000000000002';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000002', 2, 'pilihan_ganda',
        'Hewan yang memakan produsen secara langsung disebut sebagai...',
        '["Konsumen puncak", "Konsumen tingkat I", "Pengurai (Dekomposer)", "Produsen kedua"]'::jsonb,
        'Konsumen tingkat I (herbivora) adalah hewan yang langsung memakan produsen/tumbuhan hijau.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 3 -> Konsumen Tingkat II
    v_soal_id := '20000000-0000-0000-0000-000000000003';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000003', 3, 'pilihan_ganda',
        'Perhatikan urutan: Rumput -> Belalang -> Katak -> Ular -> Elang. Makhluk hidup yang berperan sebagai konsumen tingkat II adalah...',
        '["Belalang", "Katak", "Ular", "Elang"]'::jsonb,
        'Rumput = produsen, Belalang = konsumen I, Katak = konsumen II yang memakan belalang.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 4 -> Pengurai
    v_soal_id := '20000000-0000-0000-0000-000000000004';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000004', 4, 'pilihan_ganda',
        'Makhluk hidup yang bertugas menguraikan bangkai hewan dan tumbuhan yang telah mati menjadi zat hara tanah adalah...',
        '["Karnivora", "Herbivora", "Bakteri dan Jamur", "Omnivora"]'::jsonb,
        'Bakteri dan jamur adalah dekomposer (pengurai) yang mengembalikan nutrisi ke dalam tanah.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"2"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 5 -> Energi Matahari
    v_soal_id := '20000000-0000-0000-0000-000000000005';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000005', 5, 'benar_salah',
        'Semua rantai makanan di darat berawal dari tumbuhan hijau yang mendapatkan energi dari cahaya matahari.',
        '["Benar", "Salah"]'::jsonb,
        'Benar, tumbuhan hijau adalah dasar dari seluruh rantai makanan darat melalui fotosintesis.',
        25, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 6 -> Keseimbangan Ekosistem
    v_soal_id := '20000000-0000-0000-0000-000000000006';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000006', 6, 'pilihan_ganda',
        'Jika populasi katak di sawah tiba-tiba punah karena diburu, peristiwa yang kemungkinan besar akan terjadi adalah...',
        '["Populasi belalang meningkat drastis", "Populasi padi meningkat cepat", "Populasi ular bertambah banyak", "Populasi elang bertambah banyak"]'::jsonb,
        'Katak memangsa belalang; jika katak punah, pemangsa belalang berkurang sehingga populasi belalang melonjak merusak tanaman padi.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 7 -> Jaring-jaring Makanan
    v_soal_id := '20000000-0000-0000-0000-000000000007';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000007', 7, 'pilihan_ganda',
        'Kumpulan dari beberapa rantai makanan yang saling berhubungan dalam suatu ekosistem disebut...',
        '["Piramida makanan", "Jaring-jaring makanan", "Siklus air", "Habitat makhluk hidup"]'::jsonb,
        'Jaring-jaring makanan adalah gabungan rantai makanan yang saling tumpang tindih dalam satu ekosistem.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 8 -> Fitoplankton
    v_soal_id := '20000000-0000-0000-0000-000000000008';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000008', 8, 'pilihan_ganda',
        'Di dalam ekosistem laut, makhluk renik yang berfotosintesis dan bertindak sebagai produsen utama adalah...',
        '["Zooplankton", "Fitoplankton", "Ikan teri", "Hiu"]'::jsonb,
        'Fitoplankton adalah produsen utama di perairan yang dapat melakukan fotosintesis.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 9 -> Fotosintesis
    v_soal_id := '20000000-0000-0000-0000-000000000009';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000009', 9, 'isian_singkat',
        'Proses pembuatan makanan oleh tumbuhan hijau dengan bantuan cahaya matahari disebut...',
        '[]'::jsonb,
        'Fotosintesis adalah proses tumbuhan hijau mengubah air dan karbon dioksida menjadi glukosa dan oksigen dengan sinar matahari.',
        35, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"fotosintesis"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 10 -> Piramida Makanan
    v_soal_id := '20000000-0000-0000-0000-000000000010';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000010', 10, 'benar_salah',
        'Piramida makanan menunjukkan bahwa jumlah produsen selalu lebih sedikit dibandingkan jumlah konsumen puncak.',
        '["Benar", "Salah"]'::jsonb,
        'Salah, dalam ekosistem seimbang, jumlah produsen selalu paling banyak di bagian dasar piramida.',
        25, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 11 -> Simbiosis Mutualisme
    v_soal_id := '20000000-0000-0000-0000-000000000011';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000011', 11, 'pilihan_ganda',
        'Hubungan antara lebah yang mengisap nektar bunga sekaligus membantu penyerbukan bunga merupakan contoh simbiosis...',
        '["Mutualisme", "Komensalisme", "Parasitisme", "Predasi"]'::jsonb,
        'Simbiosis mutualisme adalah hubungan yang saling menguntungkan kedua pihak.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 12 -> Simbiosis Komensalisme
    v_soal_id := '20000000-0000-0000-0000-000000000012';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000012', 12, 'pilihan_ganda',
        'Tanaman anggrek yang menempel pada batang pohon mangga tanpa merugikan maupun menguntungkan pohon tersebut disebut simbiosis...',
        '["Parasitisme", "Komensalisme", "Mutualisme", "Saprofitisme"]'::jsonb,
        'Komensalisme adalah hubungan di mana satu pihak diuntungkan dan pihak lain tidak dirugikan atau diuntungkan.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 13 -> Simbiosis Parasitisme
    v_soal_id := '20000000-0000-0000-0000-000000000013';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000013', 13, 'pilihan_ganda',
        'Nyamuk yang mengisap darah manusia dan menyebabkan gatal serta penyakit merupakan contoh simbiosis...',
        '["Komensalisme", "Mutualisme", "Parasitisme", "Netralisme"]'::jsonb,
        'Parasitisme menguntungkan satu pihak (nyamuk) namun merugikan pihak lain (manusia).',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"2"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 14 -> Pencemaran Air
    v_soal_id := '20000000-0000-0000-0000-000000000014';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000014', 14, 'pilihan_ganda',
        'Tindakan manusia yang dapat merusak rantai makanan di sungai adalah...',
        '["Membersihkan sampah di tepi sungai", "Membuang limbah pabrik dan racun ke sungai", "Menanam pohon di bantaran sungai", "Membuat suaka margasatwa"]'::jsonb,
        'Limbah dan racun mematikan produsen dan ikan kecil sehingga mengganggu seluruh kehidupan di sungai.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 15 -> Karnivora
    v_soal_id := '20000000-0000-0000-0000-000000000015';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000015', 15, 'isian_singkat',
        'Hewan pemakan daging seperti harimau dan elang digolongkan sebagai hewan...',
        '[]'::jsonb,
        'Karnivora adalah sebutan untuk kelompok hewan pemakan daging.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"karnivora"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 16 -> Deforestasi
    v_soal_id := '20000000-0000-0000-0000-000000000016';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000016', 16, 'benar_salah',
        'Penebangan hutan secara liar dapat menyebabkan hewan kehilangan habitat dan sumber makanan.',
        '["Benar", "Salah"]'::jsonb,
        'Benar, hutan adalah tempat tinggal alami dan sumber makanan bagi ribuan jenis hewan liar.',
        25, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 17 -> Pestisida Berlebihan
    v_soal_id := '20000000-0000-0000-0000-000000000017';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000017', 17, 'pilihan_ganda',
        'Penggunaan pestisida kimia yang berlebihan di lahan pertanian dapat menyebabkan...',
        '["Tanaman selalu sehat selamanya", "Matinya serangga penyerbuk dan musuh alami hama", "Tanah bertambah subur alami", "Populasi burung pemakan serangga bertambah"]'::jsonb,
        'Pestisida berlebihan membunuh serangga menguntungkan dan mengganggu keseimbangan ekosistem pertanian.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"1"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 18 -> Aliran Energi
    v_soal_id := '20000000-0000-0000-0000-000000000018';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000018', 18, 'pilihan_ganda',
        'Dalam perpindahan energi pada rantai makanan, sebagian energi hilang dalam bentuk...',
        '["Panas", "Oksigen", "Cahaya", "Air"]'::jsonb,
        'Hanya sebagian kecil energi yang tersimpan pada tubuh makhluk hidup, sisanya terbuang sebagai panas saat beraktivitas.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"0"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 19 -> Omnivora
    v_soal_id := '20000000-0000-0000-0000-000000000019';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000019', 19, 'pilihan_ganda',
        'Hewan yang memakan tumbuhan sekaligus hewan lain (seperti ayam memakan biji dan cacing) disebut...',
        '["Herbivora", "Karnivora", "Omnivora", "Insektivora"]'::jsonb,
        'Omnivora adalah hewan pemakan segala (tumbuhan dan hewan).',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"2"'::jsonb) on conflict (soal_id) do nothing;

    -- Soal 20 -> Habitat
    v_soal_id := '20000000-0000-0000-0000-000000000020';
    insert into public.soal (id, kuis_id, kamus_id, urutan, tipe, teks, opsi, penjelasan, waktu_detik, poin)
    values (
        v_soal_id, v_kuis_id, '30000000-0000-0000-0000-000000000020', 20, 'isian_singkat',
        'Tempat hidup alami tempat bertumbuh dan berkembang biaknya suatu makhluk hidup disebut...',
        '[]'::jsonb,
        'Habitat adalah tempat tinggal alami bagi makhluk hidup.',
        30, 10
    ) on conflict (id) do update set kamus_id = excluded.kamus_id;
    insert into public.soal_kunci (soal_id, kunci) values (v_soal_id, '"habitat"'::jsonb) on conflict (soal_id) do nothing;

end $$;
