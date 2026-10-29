-- ========================================================
-- KUPAS KUIS IPAS v4.0 - Supabase Schema
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. TABEL PROFIL (Guru)
create table if not exists public.profil (
    id uuid primary key references auth.users(id) on delete cascade,
    nama text not null,
    sekolah text,
    created_at timestamptz default now()
);

-- 2. TABEL KUIS
create table if not exists public.kuis (
    id uuid primary key default gen_random_uuid(),
    guru_id uuid not null references public.profil(id) on delete cascade,
    judul text not null,
    topik text not null,
    deskripsi text,
    status text check (status in ('draf', 'terbit')) default 'terbit',
    created_at timestamptz default now()
);

-- 2B. TABEL KAMUS BELAJAR
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

-- 3. TABEL SOAL
create table if not exists public.soal (
    id uuid primary key default gen_random_uuid(),
    kuis_id uuid not null references public.kuis(id) on delete cascade,
    kamus_id uuid references public.kamus(id) on delete set null,
    urutan int not null,
    tipe text not null check (tipe in ('pilihan_ganda', 'benar_salah', 'isian_singkat')),
    teks text not null,
    gambar_path text,
    opsi jsonb default '[]'::jsonb,
    penjelasan text,
    waktu_detik int default 30,
    poin int default 10,
    created_at timestamptz default now()
);

-- 4. TABEL SOAL_KUNCI (Terpisah, aman dari siswa)
create table if not exists public.soal_kunci (
    soal_id uuid primary key references public.soal(id) on delete cascade,
    kunci jsonb not null,
    created_at timestamptz default now()
);

-- 5. TABEL SESI
create table if not exists public.sesi (
    id uuid primary key default gen_random_uuid(),
    kuis_id uuid not null references public.kuis(id) on delete cascade,
    guru_id uuid not null references public.profil(id) on delete cascade,
    kode text unique not null,
    mode text check (mode in ('custom', 'adventure')) default 'custom',
    status text check (status in ('lobi', 'berjalan', 'selesai')) default 'lobi',
    soal_aktif int default 0,
    soal_mulai_at timestamptz,
    pengali_waktu numeric default 1.0,
    created_at timestamptz default now()
);

-- 6. TABEL PESERTA
create table if not exists public.peserta (
    id uuid primary key default gen_random_uuid(),
    sesi_id uuid not null references public.sesi(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null,
    nama_panggilan text not null check (char_length(trim(nama_panggilan)) between 1 and 20),
    avatar text not null,
    skor int default 0,
    created_at timestamptz default now(),
    constraint unique_peserta_per_sesi unique (sesi_id, nama_panggilan)
);

-- 7. TABEL JAWABAN
create table if not exists public.jawaban (
    id uuid primary key default gen_random_uuid(),
    sesi_id uuid not null references public.sesi(id) on delete cascade,
    peserta_id uuid not null references public.peserta(id) on delete cascade,
    soal_id uuid not null references public.soal(id) on delete cascade,
    jawaban jsonb not null,
    benar boolean not null default false,
    poin int not null default 0,
    waktu_ms int default 0,
    created_at timestamptz default now(),
    constraint unique_jawaban_peserta_soal unique (sesi_id, peserta_id, soal_id)
);

-- ========================================================
-- FUNGSI: Pembuat Kode Sesi Unik (6 Karakter Alfanumerik)
-- ========================================================
create or replace function public.generate_kode_sesi()
returns text
language plpgsql
as $$
declare
    v_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    v_code text;
    v_exists boolean;
    i int;
begin
    loop
        v_code := '';
        for i in 1..6 loop
            v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
        end loop;

        select exists (
            select 1 from public.sesi 
            where kode = v_code and status in ('lobi', 'berjalan')
        ) into v_exists;

        if not v_exists then
            return v_code;
        end if;
    end loop;
end;
$$;

-- ========================================================
-- FUNGSI: Penilaian Jawaban (SECURITY DEFINER)
-- Kunci tidak pernah dikirim ke klien, skor dihitung di DB
-- ========================================================
create or replace function public.kirim_jawaban(
    p_sesi_id uuid,
    p_peserta_id uuid,
    p_soal_id uuid,
    p_jawaban jsonb,
    p_waktu_ms int default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_sesi record;
    v_soal record;
    v_kunci record;
    v_sudah_jawab boolean;
    v_benar boolean := false;
    v_poin_dapat int := 0;
    v_raw_jawaban text;
    v_raw_kunci text;
begin
    -- 1. Validasi sesi berstatus berjalan
    select * into v_sesi from public.sesi where id = p_sesi_id;
    if not found or v_sesi.status <> 'berjalan' then
        return jsonb_build_object('success', false, 'message', 'Sesi tidak sedang aktif');
    end if;

    -- 2. Validasi peserta
    if not exists (select 1 from public.peserta where id = p_peserta_id and sesi_id = p_sesi_id) then
        return jsonb_build_object('success', false, 'message', 'Peserta tidak terdaftar di sesi ini');
    end if;

    -- 3. Cek apakah sudah pernah menjawab
    select exists (
        select 1 from public.jawaban 
        where sesi_id = p_sesi_id and peserta_id = p_peserta_id and soal_id = p_soal_id
    ) into v_sudah_jawab;
    
    if v_sudah_jawab then
        return jsonb_build_object('success', false, 'message', 'Jawaban sudah tercatat sebelumnya');
    end if;

    -- 4. Ambil soal dan kuncinya
    select * into v_soal from public.soal where id = p_soal_id and kuis_id = v_sesi.kuis_id;
    if not found then
        return jsonb_build_object('success', false, 'message', 'Soal tidak ditemukan');
    end if;

    select * into v_kunci from public.soal_kunci where soal_id = p_soal_id;
    if not found then
        return jsonb_build_object('success', false, 'message', 'Kunci soal belum ditetapkan');
    end if;

    -- 5. Penilaian berdasarkan tipe soal
    v_raw_jawaban := trim(lower(p_jawaban #>> '{}'));
    v_raw_kunci := trim(lower(v_kunci.kunci #>> '{}'));

    if v_soal.tipe in ('pilihan_ganda', 'benar_salah') then
        -- Opsi bisa dicocokkan sebagai index atau teks
        v_benar := (v_raw_jawaban = v_raw_kunci);
    elsif v_soal.tipe = 'isian_singkat' then
        -- Cocokkan teks tanpa memperhatikan spasi berlebih
        v_benar := (v_raw_jawaban = v_raw_kunci);
    end if;

    if v_benar then
        v_poin_dapat := coalesce(v_soal.poin, 10);
    else
        v_poin_dapat := 0;
    end if;

    -- 6. Simpan jawaban
    insert into public.jawaban (
        sesi_id, peserta_id, soal_id, jawaban, benar, poin, waktu_ms
    ) values (
        p_sesi_id, p_peserta_id, p_soal_id, p_jawaban, v_benar, v_poin_dapat, coalesce(p_waktu_ms, 0)
    );

    -- 7. Update akumulasi skor peserta
    update public.peserta 
    set skor = skor + v_poin_dapat
    where id = p_peserta_id;

    -- 8. Kembalikan hasil dan penjelasan (kunci tetap tidak diekspos langsung)
    return jsonb_build_object(
        'success', true,
        'benar', v_benar,
        'poin', v_poin_dapat,
        'penjelasan', v_soal.penjelasan
    );
end;
$$;

-- ========================================================
-- KEAMANAN: Row Level Security (RLS)
-- ========================================================
alter table public.profil enable row level security;
alter table public.kuis enable row level security;
alter table public.kamus enable row level security;
alter table public.soal enable row level security;
alter table public.soal_kunci enable row level security;
alter table public.sesi enable row level security;
alter table public.peserta enable row level security;
alter table public.jawaban enable row level security;

-- Kebijakan: KAMUS
create policy "Siapapun dapat membaca kamus berstatus terbit"
    on public.kamus for select
    using (status = 'terbit' or auth.uid() = guru_id);

create policy "Hanya guru pemilik yang dapat menambah entri kamus"
    on public.kamus for insert
    with check (auth.uid() = guru_id);

create policy "Hanya guru pemilik yang dapat mengubah entri kamus"
    on public.kamus for update
    using (auth.uid() = guru_id)
    with check (auth.uid() = guru_id);

create policy "Hanya guru pemilik yang dapat menghapus entri kamus"
    on public.kamus for delete
    using (auth.uid() = guru_id);

-- Kebijakan: PROFIL
create policy "Profil dapat dibaca oleh publik"
    on public.profil for select
    using (true);

create policy "Guru dapat mengubah profil sendiri"
    on public.profil for all
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Kebijakan: KUIS
create policy "Guru dapat melihat kuis sendiri"
    on public.kuis for select
    using (auth.uid() = guru_id);

create policy "Publik dapat melihat kuis berstatus terbit jika ada sesi aktif"
    on public.kuis for select
    using (
        status = 'terbit' and exists (
            select 1 from public.sesi where sesi.kuis_id = kuis.id and sesi.status in ('lobi', 'berjalan')
        )
    );

create policy "Guru dapat mengelola kuis miliknya"
    on public.kuis for all
    using (auth.uid() = guru_id)
    with check (auth.uid() = guru_id);

-- Kebijakan: SOAL
create policy "Guru dapat mengelola soal kuisnya"
    on public.soal for all
    using (
        exists (select 1 from public.kuis where kuis.id = soal.kuis_id and kuis.guru_id = auth.uid())
    )
    with check (
        exists (select 1 from public.kuis where kuis.id = soal.kuis_id and kuis.guru_id = auth.uid())
    );

create policy "Siswa dapat melihat soal kuis yang sedang aktif di sesi"
    on public.soal for select
    using (
        exists (
            select 1 from public.sesi 
            where sesi.kuis_id = soal.kuis_id 
              and sesi.status in ('berjalan', 'selesai')
              and soal.urutan <= sesi.soal_aktif
        )
    );

-- Kebijakan: SOAL_KUNCI (HANYA GURU, SISWA TIDAK PERNAH BISA SELECT)
create policy "Hanya guru pembuat yang dapat melihat kunci soal"
    on public.soal_kunci for select
    using (
        exists (
            select 1 from public.soal s 
            join public.kuis k on k.id = s.kuis_id 
            where s.id = soal_kunci.soal_id and k.guru_id = auth.uid()
        )
    );

create policy "Hanya guru pembuat yang dapat mengubah kunci soal"
    on public.soal_kunci for all
    using (
        exists (
            select 1 from public.soal s 
            join public.kuis k on k.id = s.kuis_id 
            where s.id = soal_kunci.soal_id and k.guru_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.soal s 
            join public.kuis k on k.id = s.kuis_id 
            where s.id = soal_kunci.soal_id and k.guru_id = auth.uid()
        )
    );

-- Kebijakan: SESI
create policy "Siapapun dapat melihat sesi lewat kode atau id"
    on public.sesi for select
    using (true);

create policy "Guru dapat mengelola sesi miliknya"
    on public.sesi for all
    using (auth.uid() = guru_id)
    with check (auth.uid() = guru_id);

-- Kebijakan: PESERTA
create policy "Semua dapat melihat peserta di sesi yang sama"
    on public.peserta for select
    using (true);

create policy "Siswa dapat mendaftar ke sesi aktif"
    on public.peserta for insert
    with check (
        exists (
            select 1 from public.sesi 
            where sesi.id = peserta.sesi_id and sesi.status in ('lobi', 'berjalan')
        )
    );

create policy "Peserta dapat mengupdate data miliknya sendiri"
    on public.peserta for update
    using (auth.uid() = user_id or user_id is null);

-- Kebijakan: JAWABAN
create policy "Guru dapat melihat semua jawaban pada sesinya"
    on public.jawaban for select
    using (
        exists (
            select 1 from public.sesi 
            where sesi.id = jawaban.sesi_id and sesi.guru_id = auth.uid()
        )
    );

create policy "Peserta dapat melihat jawaban miliknya"
    on public.jawaban for select
    using (
        exists (
            select 1 from public.peserta 
            where peserta.id = jawaban.peserta_id and (peserta.user_id = auth.uid() or auth.uid() is null)
        )
    );

-- Trigger profil saat akun guru dibuat lewat Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.profil (id, nama, sekolah)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'nama', 'Guru IPAS'),
        coalesce(new.raw_user_meta_data->>'sekolah', 'SD Negeri')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

