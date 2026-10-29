-- ========================================================
-- KUPAS KUIS IPAS v4.0 - Migrasi Kamus Belajar
-- ========================================================

-- 1. TABEL KAMUS
create table if not exists public.kamus (
    id uuid primary key default gen_random_uuid(),
    guru_id uuid not null references public.profil(id) on delete cascade,
    istilah text not null,
    kategori text not null,
    definisi text not null,
    contoh text,
    gambar_path text,
    status text check (status in ('draf', 'terbit')) default 'terbit',
    created_at timestamptz default now()
);

-- 2. RELASI SOAL KE KAMUS
alter table public.soal 
add column if not exists kamus_id uuid references public.kamus(id) on delete set null;

-- 3. ROW LEVEL SECURITY (RLS)
alter table public.kamus enable row level security;

-- Semua pengguna (termasuk anonim & siswa tanpa login) dapat membaca entri yang berstatus terbit
create policy "Siapapun dapat membaca kamus berstatus terbit"
    on public.kamus for select
    using (status = 'terbit' or auth.uid() = guru_id);

-- Hanya guru pemilik yang dapat menambah entri kamus
create policy "Hanya guru pemilik yang dapat menambah entri kamus"
    on public.kamus for insert
    with check (auth.uid() = guru_id);

-- Hanya guru pemilik yang dapat mengubah entri kamus
create policy "Hanya guru pemilik yang dapat mengubah entri kamus"
    on public.kamus for update
    using (auth.uid() = guru_id)
    with check (auth.uid() = guru_id);

-- Hanya guru pemilik yang dapat menghapus entri kamus
create policy "Hanya guru pemilik yang dapat menghapus entri kamus"
    on public.kamus for delete
    using (auth.uid() = guru_id);

