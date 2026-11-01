-- ============================================================================
-- SQL PERBAIKAN: TABEL SESI, PESERTA, JAWABAN & FUNGSI KODE SESI REALTIME
-- Jalankan di SQL Editor Supabase untuk mengatasi:
-- 1. "Could not find the function public.generate_kode_sesi without parameters in the schema cache"
-- 2. Hak akses / permission denied pada sesi permainan kuis
-- ============================================================================

-- 1. EXTENSION UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1B. PASTIKAN TABEL KUIS MEMILIKI KOLOM LENGKAP (jadwal_buka, jadwal_tutup, durasi, kkm, acak_soal)
ALTER TABLE public.kuis ADD COLUMN IF NOT EXISTS kkm int DEFAULT 75;
ALTER TABLE public.kuis ADD COLUMN IF NOT EXISTS acak_soal boolean DEFAULT false;
ALTER TABLE public.kuis ADD COLUMN IF NOT EXISTS durasi_menit int DEFAULT 15;
ALTER TABLE public.kuis ADD COLUMN IF NOT EXISTS jadwal_buka timestamptz;
ALTER TABLE public.kuis ADD COLUMN IF NOT EXISTS jadwal_tutup timestamptz;

-- 2. TABEL SESI KUIS KELAS
CREATE TABLE IF NOT EXISTS public.sesi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kuis_id uuid,
    guru_id uuid,
    kode text UNIQUE NOT NULL,
    mode text CHECK (mode IN ('custom', 'adventure')) DEFAULT 'custom',
    status text CHECK (status IN ('lobi', 'berjalan', 'selesai')) DEFAULT 'lobi',
    soal_aktif int DEFAULT 0,
    soal_mulai_at timestamptz,
    pengali_waktu numeric DEFAULT 1.0,
    created_at timestamptz DEFAULT now()
);

-- Pastikan semua kolom penting di tabel sesi ada
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS kuis_id uuid;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS guru_id uuid;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS kode text;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS mode text DEFAULT 'custom';
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS status text DEFAULT 'lobi';
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS soal_aktif int DEFAULT 0;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS soal_mulai_at timestamptz;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS pengali_waktu numeric DEFAULT 1.0;
ALTER TABLE public.sesi ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 3. TABEL PESERTA SISWA
CREATE TABLE IF NOT EXISTS public.peserta (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sesi_id uuid NOT NULL,
    user_id uuid,
    siswa_id text,
    nama_panggilan text NOT NULL,
    kelas text DEFAULT 'Kelas V-A',
    avatar text NOT NULL DEFAULT 'avatar-1.svg',
    skor int DEFAULT 0,
    durasi_detik int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS sesi_id uuid;
ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS nama_panggilan text;
ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS avatar text DEFAULT 'avatar-1.svg';
ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS skor int DEFAULT 0;
ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS durasi_detik int DEFAULT 0;
ALTER TABLE public.peserta ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 4. TABEL JAWABAN SISWA
CREATE TABLE IF NOT EXISTS public.jawaban (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sesi_id uuid NOT NULL,
    peserta_id uuid NOT NULL,
    soal_id uuid NOT NULL,
    jawaban text NOT NULL,
    benar boolean NOT NULL DEFAULT false,
    poin int NOT NULL DEFAULT 0,
    waktu_ms int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS sesi_id uuid;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS peserta_id uuid;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS soal_id uuid;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS jawaban text;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS benar boolean DEFAULT false;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS poin int DEFAULT 0;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS waktu_ms int DEFAULT 0;
ALTER TABLE public.jawaban ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 5. FUNGSI PEMBUAT KODE SESI 6 KARAKTER (generate_kode_sesi)
CREATE OR REPLACE FUNCTION public.generate_kode_sesi()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_code text;
    v_exists boolean;
    i int;
BEGIN
    LOOP
        v_code := '';
        FOR i IN 1..6 LOOP
            v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        END LOOP;

        SELECT exists (
            SELECT 1 FROM public.sesi 
            WHERE kode = v_code AND status IN ('lobi', 'berjalan')
        ) INTO v_exists;

        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$;

-- 6. FUNGSI PENILAIAN JAWABAN SISWA (kirim_jawaban Multi-Format Pintar)
CREATE OR REPLACE FUNCTION public.kirim_jawaban(
    p_sesi_id uuid,
    p_peserta_id uuid,
    p_soal_id uuid,
    p_jawaban jsonb,
    p_waktu_ms int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sesi record;
    v_soal record;
    v_benar boolean := false;
    v_poin_dapat int := 0;
    v_raw_jawaban text;
    v_raw_kunci text;
    v_kunci_val text := '0';
    v_idx int;
    v_opsi_text text;
BEGIN
    SELECT * INTO v_sesi FROM public.sesi WHERE id = p_sesi_id;
    SELECT * INTO v_soal FROM public.soal WHERE id = p_soal_id;

    -- Ambil kunci dari soal_kunci atau soal.kunci
    IF EXISTS (SELECT 1 FROM public.soal_kunci WHERE soal_id = p_soal_id) THEN
        SELECT (kunci #>> '{}') INTO v_kunci_val FROM public.soal_kunci WHERE soal_id = p_soal_id;
    ELSIF v_soal.kunci IS NOT NULL THEN
        v_kunci_val := v_soal.kunci::text;
    END IF;

    v_raw_jawaban := trim(lower(p_jawaban #>> '{}'));
    v_raw_kunci := trim(lower(v_kunci_val));

    -- Evaluasi Multi-Format:
    -- 1. Kecocokan langsung (e.g. '0' = '0', 'a' = 'a', 'padi' = 'padi')
    IF v_raw_jawaban = v_raw_kunci THEN
        v_benar := true;
    -- 2. Konversi Index ('0','1','2','3') ke Huruf ('a','b','c','d') dan sebaliknya
    ELSIF (v_raw_jawaban = '0' AND v_raw_kunci = 'a') OR (v_raw_jawaban = 'a' AND v_raw_kunci = '0') THEN
        v_benar := true;
    ELSIF (v_raw_jawaban = '1' AND v_raw_kunci = 'b') OR (v_raw_jawaban = 'b' AND v_raw_kunci = '1') THEN
        v_benar := true;
    ELSIF (v_raw_jawaban = '2' AND v_raw_kunci = 'c') OR (v_raw_jawaban = 'c' AND v_raw_kunci = '2') THEN
        v_benar := true;
    ELSIF (v_raw_jawaban = '3' AND v_raw_kunci = 'd') OR (v_raw_jawaban = 'd' AND v_raw_kunci = '3') THEN
        v_benar := true;
    -- 3. Benar / Salah format ('0'='benar', '1'='salah')
    ELSIF (v_raw_jawaban IN ('0', 'benar', 'true', 'b') AND v_raw_kunci IN ('0', 'benar', 'true', 'b')) THEN
        v_benar := true;
    ELSIF (v_raw_jawaban IN ('1', 'salah', 'false', 's') AND v_raw_kunci IN ('1', 'salah', 'false', 's')) THEN
        v_benar := true;
    -- 4. Cek teks opsi jika jawaban berupa indeks dan kunci berupa teks opsi, atau sebaliknya
    ELSIF v_soal.opsi IS NOT NULL AND jsonb_typeof(v_soal.opsi) = 'array' THEN
        IF v_raw_jawaban ~ '^[0-3]$' THEN
            v_idx := v_raw_jawaban::int;
            v_opsi_text := trim(lower(v_soal.opsi ->> v_idx));
            IF v_opsi_text = v_raw_kunci THEN
                v_benar := true;
            END IF;
        END IF;
        IF NOT v_benar AND v_raw_kunci ~ '^[0-3]$' THEN
            v_idx := v_raw_kunci::int;
            v_opsi_text := trim(lower(v_soal.opsi ->> v_idx));
            IF v_opsi_text = v_raw_jawaban THEN
                v_benar := true;
            END IF;
        END IF;
    END IF;

    IF v_benar THEN
        v_poin_dapat := COALESCE(v_soal.poin, 10);
    END IF;

    INSERT INTO public.jawaban (sesi_id, peserta_id, soal_id, jawaban, benar, poin, waktu_ms)
    VALUES (p_sesi_id, p_peserta_id, p_soal_id, v_raw_jawaban, v_benar, v_poin_dapat, p_waktu_ms);

    UPDATE public.peserta 
    SET skor = skor + v_poin_dapat
    WHERE id = p_peserta_id;

    RETURN jsonb_build_object(
        'success', true,
        'benar', v_benar,
        'poin', v_poin_dapat,
        'kunci', v_kunci_val,
        'penjelasan', COALESCE(v_soal.penjelasan, '')
    );
END;
$$;

-- 7. BERIKAN HAK AKSES (GRANT) LENGKAP
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.generate_kode_sesi() TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.kirim_jawaban(uuid, uuid, uuid, jsonb, int) TO postgres, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 8. AKTIFKAN RLS & POLICIES
ALTER TABLE public.sesi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jawaban ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sesi akses penuh" ON public.sesi;
CREATE POLICY "Sesi akses penuh" ON public.sesi FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Peserta akses penuh" ON public.peserta;
CREATE POLICY "Peserta akses penuh" ON public.peserta FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Jawaban akses penuh" ON public.jawaban;
CREATE POLICY "Jawaban akses penuh" ON public.jawaban FOR ALL USING (true) WITH CHECK (true);

-- 9. MUAT ULANG CACHE SUPABASE
NOTIFY pgrst, 'reload schema';

