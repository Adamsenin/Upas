-- ============================================================================
-- SQL PERBAIKAN LENGKAP: BANK SOAL, KAMUS & HAK AKSES KUPAS KUIS IPAS
-- (Aman dijalankan berulang kali / Idempotent - Bebas Error 42P01)
-- ============================================================================

-- 1. AKTIFKAN EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. BUAT SEMUA TABEL DAHULU JIKA BELUM ADA (URUTAN TERSTRUKTUR)

-- 2A. TABEL PROFIL GURU
CREATE TABLE IF NOT EXISTS public.profil (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nama text NOT NULL DEFAULT 'Ibu/Bapak Guru IPAS',
    sekolah text DEFAULT 'SD Negeri Merdeka',
    avatar_url text,
    created_at timestamptz DEFAULT now()
);

-- Profil default
INSERT INTO public.profil (id, nama, sekolah)
VALUES ('00000000-0000-0000-0000-000000000001', 'Ibu Guru IPAS', 'SD Negeri Merdeka 01')
ON CONFLICT (id) DO NOTHING;

-- 2B. TABEL KUIS
CREATE TABLE IF NOT EXISTS public.kuis (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid,
    judul text NOT NULL DEFAULT 'Kuis IPAS',
    topik text NOT NULL DEFAULT 'Topik IPAS',
    deskripsi text,
    status text CHECK (status IN ('draf', 'terbit', 'arsip')) DEFAULT 'terbit',
    kkm int NOT NULL DEFAULT 75,
    acak_soal boolean NOT NULL DEFAULT false,
    durasi_menit int NOT NULL DEFAULT 15,
    jadwal_buka timestamptz,
    jadwal_tutup timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Kuis default Bank Soal
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

-- 2C. TABEL KAMUS BELAJAR
CREATE TABLE IF NOT EXISTS public.kamus (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid,
    istilah text NOT NULL,
    kategori text NOT NULL DEFAULT 'Ekosistem',
    definisi text NOT NULL,
    contoh text,
    gambar_path text,
    status text CHECK (status IN ('draf', 'terbit')) DEFAULT 'terbit',
    created_at timestamptz DEFAULT now()
);

-- 2D. TABEL SOAL
CREATE TABLE IF NOT EXISTS public.soal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kuis_id uuid,
    kamus_id uuid,
    urutan int NOT NULL DEFAULT 1,
    tipe text NOT NULL DEFAULT 'pilihan_ganda',
    bab text NOT NULL DEFAULT 'Bab 1: Rantai Makanan',
    tingkat_kesulitan text NOT NULL DEFAULT 'sedang',
    teks text NOT NULL DEFAULT '',
    gambar_path text,
    opsi jsonb NOT NULL DEFAULT '[]'::jsonb,
    penjelasan text DEFAULT '',
    waktu_detik int NOT NULL DEFAULT 30,
    poin int NOT NULL DEFAULT 10,
    created_at timestamptz DEFAULT now()
);

-- Pastikan kolom penting di tabel soal ada jika tabel dibuat versi lama
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS kuis_id uuid;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS kamus_id uuid;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS urutan int DEFAULT 1;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS tipe text DEFAULT 'pilihan_ganda';
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS bab text DEFAULT 'Bab 1: Rantai Makanan';
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS tingkat_kesulitan text DEFAULT 'sedang';
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS teks text DEFAULT '';
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS gambar_path text;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS opsi jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS penjelasan text DEFAULT '';
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS waktu_detik int DEFAULT 30;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS poin int DEFAULT 10;
ALTER TABLE public.soal ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Pastikan kolom kunci tidak memblokir jika tabel soal memiliki kolom kunci bertipe NOT NULL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'soal' AND column_name = 'kunci'
    ) THEN
        ALTER TABLE public.soal ALTER COLUMN kunci DROP NOT NULL;
    END IF;
END $$;

-- 2E. TABEL SOAL KUNCI (Dibuat SEBELUM RLS dipasang agar tidak ada error relation does not exist)
CREATE TABLE IF NOT EXISTS public.soal_kunci (
    soal_id uuid PRIMARY KEY,
    kunci jsonb NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2F. TABEL KELAS & SISWA TERDAFTAR
CREATE TABLE IF NOT EXISTS public.kelas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid,
    nama_kelas text NOT NULL,
    tingkat text NOT NULL DEFAULT 'Kelas V SD',
    tahun_ajaran text DEFAULT '2026/2027',
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.siswa_terdaftar (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guru_id uuid,
    kelas_id uuid,
    nama_kelas text NOT NULL DEFAULT 'Kelas V-A',
    nama_lengkap text NOT NULL,
    nama_panggilan text NOT NULL,
    kode_akses text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
    avatar text NOT NULL DEFAULT 'avatar-1.svg',
    catatan_guru text DEFAULT '',
    created_at timestamptz DEFAULT now()
);

-- 3. PERIZINAN DATABASE (GRANT) UNTUK SEMUA ROLE
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 4. AKTIFKAN ROW LEVEL SECURITY (RLS) SETELAH SEMUA TABEL TERKONFIRMASI ADA
ALTER TABLE public.profil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kuis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kamus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soal_kunci ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa_terdaftar ENABLE ROW LEVEL SECURITY;

-- 5. KEBIJAKAN RLS
DROP POLICY IF EXISTS "Profil akses" ON public.profil;
CREATE POLICY "Profil akses" ON public.profil FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Kuis akses" ON public.kuis;
CREATE POLICY "Kuis akses" ON public.kuis FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Kamus akses" ON public.kamus;
CREATE POLICY "Kamus akses" ON public.kamus FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Soal akses" ON public.soal;
CREATE POLICY "Soal akses" ON public.soal FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Soal_kunci akses" ON public.soal_kunci;
CREATE POLICY "Soal_kunci akses" ON public.soal_kunci FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Kelas akses" ON public.kelas;
CREATE POLICY "Kelas akses" ON public.kelas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Siswa akses" ON public.siswa_terdaftar;
CREATE POLICY "Siswa akses" ON public.siswa_terdaftar FOR ALL USING (true) WITH CHECK (true);

-- 6. REFRESH SCHEMA CACHE SUPABASE
NOTIFY pgrst, 'reload schema';
