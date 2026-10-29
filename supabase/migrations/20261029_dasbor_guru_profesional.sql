-- ============================================================================
-- MIGRASI FASE 2: DASBOR GURU PROFESIONAL (KUPAS KUIS IPAS v4.0)
-- Fitur: Kelas, Siswa Terdaftar, Catatan Guru, Pengaturan Kuis (KKM, Acak,
--        Durasi, Jadwal Buka/Tutup, Status Arsip), dan Metadata Bank Soal.
-- ============================================================================

-- 1. Tabel Kelas
CREATE TABLE IF NOT EXISTS public.kelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL REFERENCES public.profil(id) ON DELETE CASCADE,
  nama_kelas text NOT NULL CHECK (char_length(nama_kelas) BETWEEN 1 AND 50),
  tingkat text NOT NULL DEFAULT 'Kelas V SD',
  tahun_ajaran text DEFAULT '2026/2027',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabel Siswa Terdaftar & Catatan Guru
CREATE TABLE IF NOT EXISTS public.siswa_terdaftar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id uuid NOT NULL REFERENCES public.profil(id) ON DELETE CASCADE,
  kelas_id uuid REFERENCES public.kelas(id) ON DELETE SET NULL,
  nama_kelas text NOT NULL DEFAULT 'Kelas V-A',
  nama_lengkap text NOT NULL CHECK (char_length(nama_lengkap) BETWEEN 1 AND 80),
  nama_panggilan text NOT NULL CHECK (char_length(nama_panggilan) BETWEEN 1 AND 20),
  kode_akses text NOT NULL DEFAULT upper(substr(md5(random()::text), 1, 6)),
  avatar text NOT NULL DEFAULT 'avatar-1.svg',
  catatan_guru text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Perluasan Kolom Tabel Kuis (KKM, Acak Soal, Durasi, Jadwal Buka/Tutup, Status Arsip)
ALTER TABLE public.kuis
  DROP CONSTRAINT IF EXISTS kuis_status_check;

ALTER TABLE public.kuis
  ADD CONSTRAINT kuis_status_check CHECK (status IN ('draf', 'terbit', 'arsip'));

ALTER TABLE public.kuis
  ADD COLUMN IF NOT EXISTS kkm int NOT NULL DEFAULT 75 CHECK (kkm BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS acak_soal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS durasi_menit int NOT NULL DEFAULT 15 CHECK (durasi_menit BETWEEN 1 AND 180),
  ADD COLUMN IF NOT EXISTS jadwal_buka timestamptz,
  ADD COLUMN IF NOT EXISTS jadwal_tutup timestamptz;

-- 4. Perluasan Kolom Tabel Soal (Bab/Topik & Tingkat Kesulitan)
ALTER TABLE public.soal
  ADD COLUMN IF NOT EXISTS bab text NOT NULL DEFAULT 'Bab 2: Harmoni dalam Ekosistem',
  ADD COLUMN IF NOT EXISTS tingkat_kesulitan text NOT NULL DEFAULT 'sedang'
    CHECK (tingkat_kesulitan IN ('mudah', 'sedang', 'sulit'));

-- 5. Perluasan Kolom Tabel Peserta Sesi (Tautan Kelas & Siswa)
ALTER TABLE public.peserta
  ADD COLUMN IF NOT EXISTS kelas text NOT NULL DEFAULT 'Kelas V-A',
  ADD COLUMN IF NOT EXISTS siswa_id uuid REFERENCES public.siswa_terdaftar(id) ON DELETE SET NULL;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Guru Hanya Melihat & Mengelola Data Kelasnya Sendiri
-- ============================================================================
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa_terdaftar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Guru mengelola kelas miliknya sendiri" ON public.kelas;
CREATE POLICY "Guru mengelola kelas miliknya sendiri"
  ON public.kelas FOR ALL
  TO authenticated
  USING (auth.uid() = guru_id)
  WITH CHECK (auth.uid() = guru_id);

DROP POLICY IF EXISTS "Guru mengelola siswa dan catatan miliknya sendiri" ON public.siswa_terdaftar;
CREATE POLICY "Guru mengelola siswa dan catatan miliknya sendiri"
  ON public.siswa_terdaftar FOR ALL
  TO authenticated
  USING (auth.uid() = guru_id)
  WITH CHECK (auth.uid() = guru_id);

