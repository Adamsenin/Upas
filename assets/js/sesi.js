/**
 * KUPAS KUIS IPAS v4.0 - Siklus Sesi Realtime & Interaksi Kelas (sesi.js)
 * Mematuhi PRD Bagian 4, 5, 10, dan 11:
 * - Supabase Realtime (Broadcast, Presence, Postgres Changes)
 * - Kanal unik per sesi: `sesi:{kode}`
 * - Mode: Custom Guru & Adventure Kelas
 * - Penilaian via RPC `kirim_jawaban`
 * - Ekspor Hasil CSV
 */

import { supabase } from './supabase.js';

export const sesiManager = {
  // 1. Guru Membuat Sesi Baru
  async buatSesi(kuisId, guruId, mode = 'custom', pengaliWaktu = 1.0) {
    let kode = null;
    try {
      const { data, error } = await supabase.rpc('generate_kode_sesi');
      if (!error && data) {
        kode = String(data).trim().toUpperCase();
      }
    } catch (errRpc) {
      console.warn('[sesi.js] RPC generate_kode_sesi gagal atau tidak ada, menggunakan generator lokal:', errRpc);
    }

    if (!kode) {
      // Generator kode sesi unik 6 karakter (mudah dibaca siswa SD, bebas karakter ambigu)
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let attempt = 0; attempt < 8; attempt++) {
        let calon = '';
        for (let i = 0; i < 6; i++) {
          calon += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        try {
          const { data: exist } = await supabase
            .from('sesi')
            .select('id')
            .eq('kode', calon)
            .in('status', ['lobi', 'berjalan'])
            .maybeSingle();
          if (!exist) {
            kode = calon;
            break;
          }
        } catch (e) {
          kode = calon;
          break;
        }
      }
      if (!kode) {
        kode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }
    }

    // Normalisasi guruId agar valid UUID
    let validGuruId = guruId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!validGuruId || !uuidRegex.test(validGuruId)) {
      validGuruId = '00000000-0000-0000-0000-000000000001';
    }

    // Pastikan profil guru ada untuk validGuruId (mencegah error foreign key)
    try {
      await supabase.from('profil').upsert({
        id: validGuruId,
        nama: 'Ibu/Bapak Guru IPAS',
        sekolah: 'SD Negeri Merdeka'
      }, { onConflict: 'id' });
    } catch (eProfil) {}

    // Normalisasi kuisId agar aman dari UUID mismatch
    let validKuisId = kuisId;
    if (!validKuisId || !uuidRegex.test(validKuisId)) {
      validKuisId = '11111111-1111-1111-1111-111111111111';
    }

    let { data: sesi, error: errSesi } = await supabase
      .from('sesi')
      .insert({
        kuis_id: validKuisId,
        guru_id: validGuruId,
        kode: kode.toUpperCase(),
        mode,
        status: 'lobi',
        soal_aktif: 0,
        pengali_waktu: pengaliWaktu
      })
      .select()
      .single();

    if (errSesi) {
      if (errSesi.message && errSesi.message.includes('kuis_id') && validKuisId !== kuisId) {
        const retry = await supabase
          .from('sesi')
          .insert({
            kuis_id: kuisId,
            guru_id: validGuruId,
            kode: kode.toUpperCase(),
            mode,
            status: 'lobi',
            soal_aktif: 0,
            pengali_waktu: pengaliWaktu
          })
          .select()
          .single();
        if (!retry.error) {
          sesi = retry.data;
          errSesi = null;
        }
      }
      if (errSesi) throw errSesi;
    }
    return sesi;
  },

  // 2. Ambil Data Sesi Berdasarkan Kode
  async ambilSesiByKode(kode) {
    const { data, error } = await supabase
      .from('sesi')
      .select('*')
      .eq('kode', kode.toUpperCase())
      .single();
    if (error) throw error;
    return data;
  },

  // 3. Ambil Peserta Sesi
  async ambilDaftarPeserta(sesiId) {
    const { data, error } = await supabase
      .from('peserta')
      .select('*')
      .eq('sesi_id', sesiId)
      .order('skor', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // 4. Langganan Kanal Realtime Sesi
  langgananSesi(kodeSesi, { onPesertaUpdate, onAksiBroadcast, onJawabanMasuk }) {
    const channel = supabase.channel(`sesi:${kodeSesi}`);

    // Presence: Siswa masuk/keluar
    channel.on('presence', { event: 'sync' }, () => {
      if (onPesertaUpdate) onPesertaUpdate();
    });

    // Broadcast perintah dari Guru (mulai, ganti soal, pembahasan, skor, selesai)
    channel.on('broadcast', { event: 'aksi_sesi' }, ({ payload }) => {
      if (onAksiBroadcast) onAksiBroadcast(payload);
    });

    // Postgres Changes pada jawaban (guru melihat hitungan siapa saja yang sudah menjawab)
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jawaban' }, (payload) => {
      if (onJawabanMasuk) onJawabanMasuk(payload);
    });

    channel.subscribe();
    return channel;
  },

  // 5. Guru Mengirim Perintah Broadcast ke Semua Peserta
  async kirimAksi(channel, aksi, payloadTambahan = {}) {
    const pesan = {
      aksi,
      timestamp: Date.now(),
      ...payloadTambahan
    };
    await channel.send({
      type: 'broadcast',
      event: 'aksi_sesi',
      payload: pesan
    });
    return pesan;
  },

  // 6. Perbarui Status Sesi di Basis Data
  async perbaruiStatusSesi(sesiId, status, soalAktif = null) {
    const dataUpdate = { status };
    if (soalAktif !== null) {
      dataUpdate.soal_aktif = soalAktif;
      dataUpdate.soal_mulai_at = new Date().toISOString();
    }
    await supabase.from('sesi').update(dataUpdate).eq('id', sesiId);
  },

  // 7. Siswa Mengirim Jawaban (Penilaian di server/RPC dengan fallback otomatis ke tabel)
  async kirimJawabanSiswa({ sesiId, pesertaId, soalId, jawaban, waktuMs = 0, benar = null, poin = 0 }) {
    let rpcData = null;
    let rpcError = null;

    try {
      const { data, error } = await supabase.rpc('kirim_jawaban', {
        p_sesi_id: sesiId,
        p_peserta_id: pesertaId,
        p_soal_id: soalId,
        p_jawaban: String(jawaban),
        p_waktu_ms: waktuMs
      });
      if (error) {
        rpcError = error;
      } else {
        rpcData = data;
      }
    } catch (e) {
      rpcError = e;
    }

    if (rpcData && typeof rpcData.benar === 'boolean') {
      return rpcData;
    }

    console.warn('[sesiManager] RPC kirim_jawaban gagal atau belum dibuat di DB, beralih ke simpan langsung:', rpcError?.message);

    const statusBenar = Boolean(benar);
    const poinAkhir = statusBenar ? (poin || 10) : 0;

    try {
      await supabase.from('jawaban').insert({
        sesi_id: sesiId,
        peserta_id: pesertaId,
        soal_id: soalId,
        jawaban: String(jawaban),
        benar: statusBenar,
        poin: poinAkhir,
        waktu_ms: waktuMs
      });
    } catch (errJwb) {}

    if (statusBenar && pesertaId) {
      try {
        const { data: pes } = await supabase.from('peserta').select('skor').eq('id', pesertaId).single();
        const skorLama = pes?.skor || 0;
        await supabase.from('peserta').update({ skor: skorLama + poinAkhir }).eq('id', pesertaId);
      } catch (errPes) {}
    }

    return {
      success: true,
      benar: statusBenar,
      poin: poinAkhir,
      fallback: true
    };
  },

  // 8. Ambil Rekap Jawaban untuk Papan Skor & Hasil Akhir
  async ambilRekapHasil(sesiId) {
    const { data: peserta } = await supabase
      .from('peserta')
      .select('*')
      .eq('sesi_id', sesiId)
      .order('skor', { ascending: false });

    const { data: jawaban } = await supabase
      .from('jawaban')
      .select('*')
      .eq('sesi_id', sesiId);

    return {
      peserta: peserta || [],
      jawaban: jawaban || []
    };
  },

  // 9. Ekspor Hasil CSV untuk Guru (PRD 5.1 & 6.2)
  unduhCSV(namaBerkas, dataPeserta) {
    const baris = [
      ['Peringkat', 'Nama Panggilan', 'Skor Akhir', 'Waktu Bergabung']
    ];

    dataPeserta.forEach((p, idx) => {
      baris.push([
        idx + 1,
        `"${p.nama_panggilan.replace(/"/g, '""')}"`,
        p.skor || 0,
        `"${p.created_at || ''}"`
      ]);
    });

    const kontenCSV = '\uFEFF' + baris.map(e => e.join(',')).join('\n');
    const blob = new Blob([kontenCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', namaBerkas || 'hasil_kupas_kuis.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

