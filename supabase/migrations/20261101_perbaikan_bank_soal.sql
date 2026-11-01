-- ============================================================================
-- MIGRASI LENGKAP: PERBAIKAN INTEGRASI BANK SOAL KUPAS KUIS IPAS (v4.0)
-- Tanggal: 2026-11-01
--
-- Masalah yang Diselesaikan:
--   1. "Could not find the table 'public.soal' in the schema cache"
--   2. "column soal.urutan does not exist"
--   3. "column soal.opsi does not exist" & "column soal.kuis_id does not exist"
--   4. "Could not find the table 'public.soal_kunci' in the schema cache"
--   5. "Could not find the table 'public.kelas' in the schema cache"
-- ============================================================================

-- 1. TABEL PROFIL GURU (Induk akun)
CREATE TABLE IF NOT EXISTS public.profil (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama text NOT NULL,
    sekolah text,
    avatar_url text,
    created_at timestamptz DEFAULT now()
);

-- Profil demo default (agar foreign key selalu terpenuhi)
INSERT INTO public.profil (id, nama, sekolah)
VALUES ('00000000-0000-0000-0000-000000000001', 'Ibu Guru IPAS', 'SD Negeri Merdeka 01')
ON CONFLICT (id) DO NOTHING;

-- 2. TABEL KUIS (Induk kuis untuk Bank Soal)
CREATE TABLE IF NOT EXISTS public.kuis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid REFERENCES public.profil(id) ON DELETE CASCADE,
    judul text NOT NULL,
    topik text NOT NULL,
    deskripsi text,
    status text CHECK (status IN ('draf', 'terbit', 'arsip')) DEFAULT 'terbit',
    kkm int NOT NULL DEFAULT 75 CHECK (kkm BETWEEN 0 AND 100),
    acak_soal boolean NOT NULL DEFAULT false,
    durasi_menit int NOT NULL DEFAULT 15 CHECK (durasi_menit BETWEEN 1 AND 180),
    jadwal_buka timestamptz,
    jadwal_tutup timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Kuis default untuk Bank Soal & Petualangan IPAS
INSERT INTO public.kuis (id, guru_id, judul, topik, deskripsi, status)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'Petualangan Rantai Makanan & Ekosistem',
    'Ekosistem dan Rantai Makanan (IPAS Kelas V)',
    'Bank Soal Utama KUPAS KUIS IPAS Kelas V SD.',
    'terbit'
)
ON CONFLICT (id) DO NOTHING;

-- 3. TABEL SOAL (Lengkap dengan seluruh kolom yang digunakan aplikasi)
CREATE TABLE IF NOT EXISTS public.soal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kuis_id uuid REFERENCES public.kuis(id) ON DELETE CASCADE,
    kamus_id uuid,
    urutan int NOT NULL DEFAULT 1,
    tipe text NOT NULL DEFAULT 'pilihan_ganda' CHECK (tipe IN ('pilihan_ganda', 'benar_salah', 'isian_singkat')),
    bab text NOT NULL DEFAULT 'Bab 1: Rantai Makanan',
    tingkat_kesulitan text NOT NULL DEFAULT 'sedang' CHECK (tingkat_kesulitan IN ('mudah', 'sedang', 'sulit')),
    teks text NOT NULL DEFAULT '',
    gambar_path text,
    opsi jsonb NOT NULL DEFAULT '[]'::jsonb,
    penjelasan text DEFAULT '',
    waktu_detik int NOT NULL DEFAULT 30,
    poin int NOT NULL DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

-- 4. TAMBAHKAN SELURUH KOLOM JIKA TABEL SUDAH PERNAH DIBUAT SEBELUMNYA
ALTER TABLE public.soal
    ADD COLUMN IF NOT EXISTS kuis_id uuid REFERENCES public.kuis(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS kamus_id uuid,
    ADD COLUMN IF NOT EXISTS urutan int DEFAULT 1,
    ADD COLUMN IF NOT EXISTS tipe text DEFAULT 'pilihan_ganda',
    ADD COLUMN IF NOT EXISTS bab text DEFAULT 'Bab 1: Rantai Makanan',
    ADD COLUMN IF NOT EXISTS tingkat_kesulitan text DEFAULT 'sedang',
    ADD COLUMN IF NOT EXISTS teks text DEFAULT '',
    ADD COLUMN IF NOT EXISTS gambar_path text,
    ADD COLUMN IF NOT EXISTS opsi jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS penjelasan text DEFAULT '',
    ADD COLUMN IF NOT EXISTS waktu_detik int DEFAULT 30,
    ADD COLUMN IF NOT EXISTS poin int DEFAULT 10,
    ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Hubungkan soal yang belum memiliki kuis_id ke kuis default
UPDATE public.soal
SET kuis_id = '11111111-1111-1111-1111-111111111111'
WHERE kuis_id IS NULL;

-- Perbaiki nomor urutan yang NULL atau <= 0 pada data lama
UPDATE public.soal
SET urutan = sub.seq
FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY kuis_id ORDER BY created_at ASC, id ASC) AS seq
    FROM public.soal
) sub
WHERE public.soal.id = sub.id AND (public.soal.urutan IS NULL OR public.soal.urutan <= 0);

-- Pastikan default & constraint pada kolom penting
ALTER TABLE public.soal ALTER COLUMN urutan SET DEFAULT 1;
ALTER TABLE public.soal ALTER COLUMN urutan SET NOT NULL;
ALTER TABLE public.soal ALTER COLUMN opsi SET DEFAULT '[]'::jsonb;
ALTER TABLE public.soal ALTER COLUMN opsi SET NOT NULL;

-- 5. TABEL KUNCI JAWABAN TERPISAH (SOAL_KUNCI)
CREATE TABLE IF NOT EXISTS public.soal_kunci (
    soal_id uuid PRIMARY KEY REFERENCES public.soal(id) ON DELETE CASCADE,
    kunci jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 6. TABEL KELAS & SISWA TERDAFTAR (Pendukung Dasbor Guru)
CREATE TABLE IF NOT EXISTS public.kelas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid REFERENCES public.profil(id) ON DELETE CASCADE,
    nama_kelas text NOT NULL,
    tingkat text NOT NULL DEFAULT 'Kelas V SD',
    tahun_ajaran text DEFAULT '2026/2027',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.siswa_terdaftar (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid REFERENCES public.profil(id) ON DELETE CASCADE,
    kelas_id uuid REFERENCES public.kelas(id) ON DELETE SET NULL,
    nama_kelas text NOT NULL DEFAULT 'Kelas V-A',
    nama_lengkap text NOT NULL,
    nama_panggilan text NOT NULL,
    kode_akses text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
    avatar text NOT NULL DEFAULT 'avatar-1.svg',
    catatan_guru text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- 7. INDEKS OPTIMASI PENCARIAN & PENGURUTAN BANK SOAL
CREATE INDEX IF NOT EXISTS idx_soal_kuis_urutan ON public.soal (kuis_id, urutan ASC);
CREATE INDEX IF NOT EXISTS idx_soal_bab ON public.soal (bab);
CREATE INDEX IF NOT EXISTS idx_soal_kesulitan ON public.soal (tingkat_kesulitan);

-- 8. ROW LEVEL SECURITY (RLS) AMAN
ALTER TABLE public.profil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal_kunci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa_terdaftar ENABLE ROW LEVEL SECURITY;

-- Kebijakan Profil: Publik dapat membaca
DROP POLICY IF EXISTS "Profil dapat dibaca" ON public.profil;
CREATE POLICY "Profil dapat dibaca" ON public.profil FOR SELECT USING (true);

-- Kebijakan Kuis: Publik dapat membaca kuis terbit
DROP POLICY IF EXISTS "Kuis terbit dapat dibaca publik" ON public.kuis;
CREATE POLICY "Kuis terbit dapat dibaca publik" ON public.kuis FOR SELECT
USING (status = 'terbit' OR auth.uid() = guru_id);

DROP POLICY IF EXISTS "Guru mengelola kuis miliknya" ON public.kuis;
CREATE POLICY "Guru mengelola kuis miliknya" ON public.kuis FOR ALL
TO authenticated
USING (auth.uid() = guru_id)
WITH CHECK (auth.uid() = guru_id);

-- Kebijakan Soal: Publik dapat membaca soal kuis terbit
DROP POLICY IF EXISTS "Soal kuis terbit dapat dibaca" ON public.soal;
CREATE POLICY "Soal kuis terbit dapat dibaca" ON public.soal FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.kuis 
        WHERE kuis.id = soal.kuis_id AND (kuis.status = 'terbit' OR kuis.guru_id = auth.uid())
    )
    OR kuis_id IS NULL
);

-- Kebijakan Soal: Guru mengelola soal
DROP POLICY IF EXISTS "Guru mengelola soal" ON public.soal;
CREATE POLICY "Guru mengelola soal" ON public.soal FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.kuis 
        WHERE kuis.id = soal.kuis_id AND kuis.guru_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.kuis 
        WHERE kuis.id = soal.kuis_id AND kuis.guru_id = auth.uid()
    )
);

-- Kebijakan Soal Kunci: Hanya guru pemilik kuis yang dapat membaca dan mengubah
DROP POLICY IF EXISTS "Guru mengakses kunci kuisnya" ON public.soal_kunci;
CREATE POLICY "Guru mengakses kunci kuisnya" ON public.soal_kunci FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.soal s 
        JOIN public.kuis k ON k.id = s.kuis_id 
        WHERE s.id = soal_kunci.soal_id AND k.guru_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.soal s 
        JOIN public.kuis k ON k.id = s.kuis_id 
        WHERE s.id = soal_kunci.soal_id AND k.guru_id = auth.uid()
    )
);

-- Kebijakan Kelas & Siswa
DROP POLICY IF EXISTS "Guru mengelola kelasnya" ON public.kelas;
CREATE POLICY "Guru mengelola kelasnya" ON public.kelas FOR ALL
TO authenticated
USING (auth.uid() = guru_id)
WITH CHECK (auth.uid() = guru_id);

DROP POLICY IF EXISTS "Guru mengelola siswanya" ON public.siswa_terdaftar;
CREATE POLICY "Guru mengelola siswanya" ON public.siswa_terdaftar FOR ALL
TO authenticated
USING (auth.uid() = guru_id)
WITH CHECK (auth.uid() = guru_id);

-- 9. PERIZINAN PERAN SUPABASE
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.soal, public.soal_kunci, public.kuis, public.kelas, public.siswa_terdaftar TO authenticated;

-- 10. REFRESH SCHEMA CACHE POSTGREST SUPABASE SECARA INSTAN
NOTIFY pgrst, 'reload schema';
