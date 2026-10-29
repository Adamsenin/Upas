-- ============================================================================
-- MIGRASI FASE A: AKTIVITAS SISWA (FAKTA/OPINI, RANTAI MAKANAN) & SERTIFIKAT DIGITAL
-- KUPAS KUIS IPAS v4.0
-- ============================================================================

-- 1. TABEL BANK PERNYATAAN (Fakta atau Opini)
CREATE TABLE IF NOT EXISTS public.fact_opinion_statements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid NOT NULL REFERENCES public.profil(id) ON DELETE CASCADE,
    pernyataan text NOT NULL,
    tipe text NOT NULL CHECK (tipe IN ('fakta', 'opini')),
    tingkat_kesulitan text NOT NULL CHECK (tingkat_kesulitan IN ('mudah', 'sedang', 'sulit')),
    penjelasan text NOT NULL,
    topik text NOT NULL DEFAULT 'Harmoni Ekosistem & Rantai Makanan',
    status text NOT NULL CHECK (status IN ('draf', 'terbit')) DEFAULT 'terbit',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. TABEL SKENARIO RANTAI MAKANAN
CREATE TABLE IF NOT EXISTS public.food_chain_scenarios (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid NOT NULL REFERENCES public.profil(id) ON DELETE CASCADE,
    judul text NOT NULL,
    ekosistem text NOT NULL CHECK (ekosistem IN ('sawah', 'kolam', 'hutan', 'laut', 'kebun', 'sungai')),
    deskripsi text NOT NULL,
    kartu_makhluk jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Struktur per item: { id, nama, peran, urutan, ikon_svg, petunjuk, deskripsi_peran }
    status text NOT NULL CHECK (status IN ('draf', 'terbit')) DEFAULT 'terbit',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. TABEL HASIL AKTIVITAS SISWA
CREATE TABLE IF NOT EXISTS public.activity_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    aktivitas_tipe text NOT NULL CHECK (aktivitas_tipe IN ('fakta_opini', 'rantai_makanan', 'kuis')),
    aktivitas_id text NOT NULL,
    siswa_id uuid REFERENCES public.siswa_terdaftar(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    nama_siswa text NOT NULL CHECK (char_length(trim(nama_siswa)) BETWEEN 1 AND 80),
    kelas text NOT NULL DEFAULT 'Kelas V-A',
    skor int NOT NULL DEFAULT 0,
    total_soal int NOT NULL DEFAULT 0,
    benar int NOT NULL DEFAULT 0,
    percobaan int NOT NULL DEFAULT 1,
    petunjuk_digunakan int NOT NULL DEFAULT 0,
    durasi_detik int NOT NULL DEFAULT 0,
    detail_jawaban jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. TABEL SERTIFIKAT DIGITAL "PENYELAMAT EKOSISTEM"
CREATE TABLE IF NOT EXISTS public.certificates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nomor_sertifikat text UNIQUE NOT NULL,
    siswa_id uuid REFERENCES public.siswa_terdaftar(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    nama_siswa text NOT NULL,
    kelas text NOT NULL DEFAULT 'Kelas V-A',
    aktivitas_tipe text NOT NULL CHECK (aktivitas_tipe IN ('fakta_opini', 'rantai_makanan', 'kuis')),
    aktivitas_id text NOT NULL,
    nama_kuis_topik text NOT NULL,
    nilai int NOT NULL CHECK (nilai BETWEEN 0 AND 100),
    ambang_batas int NOT NULL DEFAULT 80 CHECK (ambang_batas BETWEEN 0 AND 100),
    nama_guru text NOT NULL DEFAULT 'Ibu Guru IPAS',
    tanggal_terbit timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT unique_certificate_per_student_activity UNIQUE (nama_siswa, aktivitas_tipe, aktivitas_id)
);

-- Kolom ambang batas kelulusan sertifikat pada kuis
ALTER TABLE public.kuis
  ADD COLUMN IF NOT EXISTS sertifikat_ambang_batas int NOT NULL DEFAULT 80 CHECK (sertifikat_ambang_batas BETWEEN 0 AND 100);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.fact_opinion_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_chain_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 1. Kebijakan: fact_opinion_statements
DROP POLICY IF EXISTS "Publik dapat membaca pernyataan berstatus terbit" ON public.fact_opinion_statements;
CREATE POLICY "Publik dapat membaca pernyataan berstatus terbit"
  ON public.fact_opinion_statements FOR SELECT
  USING (status = 'terbit' OR auth.uid() = guru_id);

DROP POLICY IF EXISTS "Guru mengelola pernyataan miliknya" ON public.fact_opinion_statements;
CREATE POLICY "Guru mengelola pernyataan miliknya"
  ON public.fact_opinion_statements FOR ALL
  TO authenticated
  USING (auth.uid() = guru_id)
  WITH CHECK (auth.uid() = guru_id);

-- 2. Kebijakan: food_chain_scenarios
DROP POLICY IF EXISTS "Publik dapat membaca skenario berstatus terbit" ON public.food_chain_scenarios;
CREATE POLICY "Publik dapat membaca skenario berstatus terbit"
  ON public.food_chain_scenarios FOR SELECT
  USING (status = 'terbit' OR auth.uid() = guru_id);

DROP POLICY IF EXISTS "Guru mengelola skenario miliknya" ON public.food_chain_scenarios;
CREATE POLICY "Guru mengelola skenario miliknya"
  ON public.food_chain_scenarios FOR ALL
  TO authenticated
  USING (auth.uid() = guru_id)
  WITH CHECK (auth.uid() = guru_id);

-- 3. Kebijakan: activity_results
DROP POLICY IF EXISTS "Siswa dapat menyimpan hasil aktivitas" ON public.activity_results;
CREATE POLICY "Siswa dapat menyimpan hasil aktivitas"
  ON public.activity_results FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Siswa dapat melihat hasil aktivitas sendiri" ON public.activity_results;
CREATE POLICY "Siswa dapat melihat hasil aktivitas sendiri"
  ON public.activity_results FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Guru dapat membaca semua hasil aktivitas" ON public.activity_results;
CREATE POLICY "Guru dapat membaca semua hasil aktivitas"
  ON public.activity_results FOR SELECT
  TO authenticated
  USING (true);

-- 4. Kebijakan: certificates
DROP POLICY IF EXISTS "Siswa dan guru dapat melihat sertifikat" ON public.certificates;
CREATE POLICY "Siswa dan guru dapat melihat sertifikat"
  ON public.certificates FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Siswa dapat membuat sertifikat nilai tuntas" ON public.certificates;
CREATE POLICY "Siswa dapat membuat sertifikat nilai tuntas"
  ON public.certificates FOR INSERT
  WITH CHECK (nilai >= ambang_batas);

DROP POLICY IF EXISTS "Siswa dapat memperbarui sertifikat dengan nilai lebih tinggi" ON public.certificates;
CREATE POLICY "Siswa dapat memperbarui sertifikat dengan nilai lebih tinggi"
  ON public.certificates FOR UPDATE
  USING (true)
  WITH CHECK (nilai >= ambang_batas);

DROP POLICY IF EXISTS "Guru dapat mengelola sertifikat" ON public.certificates;
CREATE POLICY "Guru dapat mengelola sertifikat"
  ON public.certificates FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- SEED DATA AWAL: 20 PERNYATAAN FAKTA ATAU OPINI (SD/SMP IPAS)
-- ============================================================================
INSERT INTO public.fact_opinion_statements (guru_id, pernyataan, tipe, tingkat_kesulitan, penjelasan, topik, status)
SELECT 
  p.id,
  v.pernyataan,
  v.tipe,
  v.tingkat_kesulitan,
  v.penjelasan,
  v.topik,
  'terbit'
FROM public.profil p
CROSS JOIN (VALUES
  ('Padi membuat makanannya sendiri melalui fotosintesis dengan bantuan sinar matahari dan air.', 'fakta', 'mudah', 'Fakta ilmiah: padi adalah produsen autotrof yang melakukan fotosintesis.', 'Ekosistem'),
  ('Bunga mawar adalah produsen yang paling indah dan anggun di seluruh taman sekolah.', 'opini', 'mudah', 'Opini: keindahan adalah penilaian rasa subjektif setiap orang.', 'Ekosistem'),
  ('Konsumen tingkat satu pada rantai makanan darat umumnya adalah hewan pemakan tumbuhan (herbivora).', 'fakta', 'mudah', 'Fakta ilmiah: konsumen I langsung memakan biomassa dari produsen tumbuhan.', 'Rantai Makanan'),
  ('Ular sawah adalah hewan yang paling menakutkan dan sebaiknya dibasmi semuanya dari sawah.', 'opini', 'mudah', 'Opini: menakutkan adalah rasa takut individu, dan membasmi ular justru memicu ledakan hama tikus.', 'Keseimbangan Ekosistem'),
  ('Fitoplankton di lautan menyerap karbon dioksida dan menghasilkan sebagian besar oksigen bumi.', 'fakta', 'sedang', 'Fakta ilmiah: fitoplankton menghasilkan lebih dari 50% oksigen atmosfer bumi melalui fotosintesis.', 'Ekosistem Laut'),
  ('Belalang sawah memakan daun padi sehingga petani selalu merasa jengkel setiap hari.', 'opini', 'sedang', 'Opini: perasaan jengkel adalah kondisi emosional subjektif.', 'Interaksi Makhluk Hidup'),
  ('Dekomposer seperti jamur dan bakteri menguraikan bangkai makhluk hidup menjadi unsur hara tanah.', 'fakta', 'mudah', 'Fakta ilmiah: dekomposer mengembalikan mineral dan zat hara penting ke dalam tanah.', 'Rantai Makanan'),
  ('Cacing tanah adalah hewan yang paling menjijikkan saat bergerak di tanah sawah basah.', 'opini', 'mudah', 'Opini: anggapan menjijikkan bersifat subjektif; secara ekologis cacing sangat membantu menggemburkan tanah.', 'Dekomposer'),
  ('Energi matahari yang diserap produsen akan berkurang saat berpindah ke tingkat trofik berikutnya sebagai panas.', 'fakta', 'sedang', 'Fakta ilmiah: hanya sekitar 10% energi kimia yang berpindah ke konsumen berikutnya (hukum 10%).', 'Aliran Energi'),
  ('Kegiatan menanam pohon di hutan lindung jauh lebih menyenangkan daripada membersihkan selokan.', 'opini', 'sedang', 'Opini: tingkat rasa senang adalah preferensi masing-masing orang.', 'Dampak Lingkungan'),
  ('Simbiosis antara lebah madu dan bunga tanaman mangga saling menguntungkan kedua belah pihak.', 'fakta', 'mudah', 'Fakta ilmiah: lebah memperoleh nektar dan bunga terbantu dalam penyerbukan (mutualisme).', 'Simbiosis'),
  ('Lebah madu adalah serangga yang paling pintar dan rajin dibanding semua serangga di bumi.', 'opini', 'sedang', 'Opini: sebutan pintar dan rajin adalah kiasan/sifat subjektif manusia.', 'Simbiosis'),
  ('Penebangan hutan secara liar dapat merusak habitat alami dan mengancam kepunahan satwa langka.', 'fakta', 'mudah', 'Fakta ilmiah: deforestasi menghilangkan tempat bernaung, berkembang biak, dan sumber makanan satwa.', 'Dampak Lingkungan'),
  ('Pemberantasan hama dengan menyemprotkan pestisida kimia sebanyak-banyaknya adalah cara paling tepat merawat sawah.', 'opini', 'sedang', 'Opini keliru: pestisida berlebih membunuh serangga penyerbuk dan musuh alami, serta merusak tanah.', 'Keseimbangan Lingkungan'),
  ('Pada piramida makanan yang seimbang di daratan, jumlah biomassa produsen lebih besar daripada konsumen puncak.', 'fakta', 'sulit', 'Fakta ilmiah: dasar piramida makanan membutuhkan jumlah biomassa tumbuhan terbanyak untuk menyangga kehidupan tingkat atas.', 'Piramida Makanan'),
  ('Hewan karnivora pemangsa seperti elang jawa tampak lebih gagah dan berani daripada burung gereja.', 'opini', 'mudah', 'Opini: gagah dan berani adalah persepsi visual subjektif manusia.', 'Karakteristik Hewan'),
  ('Limbah detergen yang dibuang langsung ke sungai dapat menurunkan kadar oksigen terlarut sehingga ikan mati.', 'fakta', 'sedang', 'Fakta ilmiah: eutrofikasi dan bahan kimia detergen memicu ledakan alga lalu menghabiskan oksigen air.', 'Pencemaran Air'),
  ('Udara sejuk di kawasan pegunungan selalu lebih menyehatkan daripada udara di daerah pesisir pantai.', 'opini', 'sulit', '[perlu dicek guru] Opini: manfaat udara bergantung pada kondisi kesehatan tiap orang, kelembapan, dan tingkat alergen bebas polutan.', 'Lingkungan Hidup'),
  ('Burung hantu aktif berburu mangsa tikus dan serangga di malam hari sehingga tergolong hewan nokturnal.', 'fakta', 'mudah', 'Fakta ilmiah: hewan nokturnal beradaptasi aktif mencari makan pada malam hari.', 'Adaptasi Hewan'),
  ('Semua anak kelas lima pasti merasa sangat senang saat diajak mengamati jaring-jaring makanan di kebun sekolah.', 'opini', 'mudah', 'Opini: perasaan anak tidak seragam; ada yang menyukai dan mungkin ada yang belum tertarik.', 'Metode Pembelajaran')
) AS v(pernyataan, tipe, tingkat_kesulitan, penjelasan, topik)
LIMIT 20;

-- ============================================================================
-- SEED DATA AWAL: 4 SKENARIO RANTAI MAKANAN (SAWAH, KOLAM, HUTAN, LAUT)
-- ============================================================================
INSERT INTO public.food_chain_scenarios (guru_id, judul, ekosistem, deskripsi, kartu_makhluk, status)
SELECT
  p.id,
  v.judul,
  v.ekosistem,
  v.deskripsi,
  v.kartu_makhluk::jsonb,
  'terbit'
FROM public.profil p
CROSS JOIN (VALUES
  (
    'Rantai Makanan Ekosistem Sawah',
    'sawah',
    'Aliran energi makanan di hamparan sawah basah dari tanaman padi hingga burung elang.',
    '[
      {"id": "sw-1", "nama": "Padi", "peran": "Produsen", "urutan": 1, "ikon_svg": "padi", "petunjuk": "Tumbuhan hijau berklorofil penghasil beras melalui fotosintesis.", "deskripsi_peran": "Menangkap energi matahari untuk membuat sumber makanan pertama."},
      {"id": "sw-2", "nama": "Belalang", "peran": "Konsumen I", "urutan": 2, "ikon_svg": "belalang", "petunjuk": "Hewan herbivora kecil pemakan daun padi muda.", "deskripsi_peran": "Memakan daun padi untuk memperoleh energi nabati."},
      {"id": "sw-3", "nama": "Katak Sawah", "peran": "Konsumen II", "urutan": 3, "ikon_svg": "katak", "petunjuk": "Hewan amfibi karnivora pemakan serangga pelompat.", "deskripsi_peran": "Memangsa belalang dan mengendalikan populasinya."},
      {"id": "sw-4", "nama": "Ular Sawah", "peran": "Konsumen III", "urutan": 4, "ikon_svg": "ular", "petunjuk": "Reptil karnivora melata pemangsa katak dan tikus.", "deskripsi_peran": "Memangsa katak sebagai konsumen tingkat ketiga."},
      {"id": "sw-5", "nama": "Burung Elang", "peran": "Konsumen Puncak", "urutan": 5, "ikon_svg": "elang", "petunjuk": "Burung karnivora puncak bersarang tinggi pemangsa ular.", "deskripsi_peran": "Berada di puncak rantai makanan tanpa pemangsa alami."},
      {"id": "sw-6", "nama": "Jamur Pengurai", "peran": "Pengurai", "urutan": 6, "ikon_svg": "jamur", "petunjuk": "Dekomposer tanah pengurai bangkai menjadi zat hara.", "deskripsi_peran": "Menguraikan sisa organisme mati menjadi mineral tanah bagi padi."}
    ]'
  ),
  (
    'Rantai Makanan Ekosistem Kolam',
    'kolam',
    'Perpindahan energi antarmakhluk hidup di lingkungan perairan kolam tenang.',
    '[
      {"id": "kl-1", "nama": "Lumut & Alga Air", "peran": "Produsen", "urutan": 1, "ikon_svg": "alga", "petunjuk": "Tumbuhan air hijau yang mengapung dan berfotosintesis.", "deskripsi_peran": "Produsen utama perairan yang menyuplai oksigen kolam."},
      {"id": "kl-2", "nama": "Kutu Air", "peran": "Konsumen I", "urutan": 2, "ikon_svg": "kutu-air", "petunjuk": "Zooplankton kecil pemakan alga hijau air tawar.", "deskripsi_peran": "Herbivora mikroskopis penyaring alga perairan."},
      {"id": "kl-3", "nama": "Ikan Sepat Kecil", "peran": "Konsumen II", "urutan": 3, "ikon_svg": "ikan-kecil", "petunjuk": "Ikan kecil perenang lincah pemakan jentik dan kutu air.", "deskripsi_peran": "Karnivora perantara pemakan serangga dan kutu air."},
      {"id": "kl-4", "nama": "Ikan Gabus", "peran": "Konsumen III", "urutan": 4, "ikon_svg": "ikan-gabus", "petunjuk": "Ikan karnivora predator pemangsa ikan-ikan kecil.", "deskripsi_peran": "Predator air tawar yang memangsa ikan kecil di kolam."},
      {"id": "kl-5", "nama": "Burung Bangau", "peran": "Konsumen Puncak", "urutan": 5, "ikon_svg": "bangau", "petunjuk": "Burung berkaki panjang pemancing ikan di pinggir kolam.", "deskripsi_peran": "Konsumen puncak air tawar pemakan ikan besar."},
      {"id": "kl-6", "nama": "Bakteri Dekomposer", "peran": "Pengurai", "urutan": 6, "ikon_svg": "bakteri", "petunjuk": "Mikroorganisme pengurai lumpur dasar kolam.", "deskripsi_peran": "Mengembalikan unsur hara dari dasar kolam ke air."}
    ]'
  ),
  (
    'Rantai Makanan Ekosistem Hutan',
    'hutan',
    'Keseimbangan alami rantai makanan rimbun di pedalaman hutan hujan tropis.',
    '[
      {"id": "ht-1", "nama": "Tunas & Buah Hutan", "peran": "Produsen", "urutan": 1, "ikon_svg": "pohon-buah", "petunjuk": "Pohon dan semak hutan penghasil daun segar serta buah.", "deskripsi_peran": "Menyerap sinar matahari dari kanopi hutan untuk berbuah."},
      {"id": "ht-2", "nama": "Kancil / Rusa", "peran": "Konsumen I", "urutan": 2, "ikon_svg": "rusa", "petunjuk": "Mamalia herbivora pemakan pucuk daun dan buah jatuh.", "deskripsi_peran": "Konsumen pertama pemakan biomassa dedaunan hutan."},
      {"id": "ht-3", "nama": "Ular Sanca Hutan", "peran": "Konsumen II", "urutan": 3, "ikon_svg": "ular-sanca", "petunjuk": "Reptil karnivora pemangsa mamalia sedang di lantai hutan.", "deskripsi_peran": "Karnivora pemburu hewan herbivora hutan."},
      {"id": "ht-4", "nama": "Harimau Sumatera", "peran": "Konsumen Puncak", "urutan": 4, "ikon_svg": "harimau", "petunjuk": "Kucing besar karnivora penguasa wilayah hutan.", "deskripsi_peran": "Konsumen puncak menjaga keseimbangan populasi fauna rimba."},
      {"id": "ht-5", "nama": "Cacing & Rayap Tanah", "peran": "Pengurai", "urutan": 5, "ikon_svg": "cacing-rayap", "petunjuk": "Pengurai serasah kayu lapuk dan daun di lantai hutan.", "deskripsi_peran": "Mengubah sisa organik menjadi humus subur bagi pohon hutan."}
    ]'
  ),
  (
    'Rantai Makanan Ekosistem Laut',
    'laut',
    'Aliran energi samudra dari mikroorganisme fotosintesis hingga hiu pemangsa puncak.',
    '[
      {"id": "lt-1", "nama": "Fitoplankton", "peran": "Produsen", "urutan": 1, "ikon_svg": "fitoplankton", "petunjuk": "Tumbuhan mikroskopis melayang penyerap cahaya di laut.", "deskripsi_peran": "Produsen primer terbesar perairan laut bumi."},
      {"id": "lt-2", "nama": "Zooplankton", "peran": "Konsumen I", "urutan": 2, "ikon_svg": "zooplankton", "petunjuk": "Hewan mikroskopis melayang pemakan fitoplankton.", "deskripsi_peran": "Herbivora laut pertama pemakan fitoplankton."},
      {"id": "lt-3", "nama": "Ikan Teri / Sardin", "peran": "Konsumen II", "urutan": 3, "ikon_svg": "ikan-teri", "petunjuk": "Kawanan ikan kecil pemakan plankton di perairan lepas.", "deskripsi_peran": "Konsumen kedua pemakan zooplankton laut."},
      {"id": "lt-4", "nama": "Ikan Tuna", "peran": "Konsumen III", "urutan": 4, "ikon_svg": "ikan-tuna", "petunjuk": "Ikan perenang cepat karnivora pemakan kawanan ikan kecil.", "deskripsi_peran": "Karnivora laut pemangsa ikan pelagis kecil."},
      {"id": "lt-5", "nama": "Ikan Hiu Samudra", "peran": "Konsumen Puncak", "urutan": 5, "ikon_svg": "hiu", "petunjuk": "Apex predator laut bertaring tajam tanpa pemangsa alami.", "deskripsi_peran": "Konsumen puncak yang menjaga ekosistem terumbu dan samudra."},
      {"id": "lt-6", "nama": "Bakteri Laut Dalam", "peran": "Pengurai", "urutan": 6, "ikon_svg": "bakteri-laut", "petunjuk": "Dekomposer dasar laut pengurai sisa organisme.", "deskripsi_peran": "Menguraikan materi organik yang jatuh ke dasar samudra."}
    ]'
  )
) AS v(judul, ekosistem, deskripsi, kartu_makhluk)
LIMIT 4;

