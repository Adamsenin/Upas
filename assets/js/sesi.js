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
    const { data: kode, error: errKode } = await supabase.rpc('generate_kode_sesi');
    if (errKode) throw errKode;

    const { data: sesi, error: errSesi } = await supabase
      .from('sesi')
      .insert({
        kuis_id: kuisId,
        guru_id: guruId || 'guru-demo-1',
        kode: kode || Math.random().toString(36).substr(2, 6).toUpperCase(),
        mode,
        status: 'lobi',
        soal_aktif: 0,
        pengali_waktu: pengaliWaktu
      })
      .select()
      .single();

    if (errSesi) throw errSesi;
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

  // 7. Siswa Mengirim Jawaban (Penilaian dilakukan di server/RPC)
  async kirimJawabanSiswa({ sesiId, pesertaId, soalId, jawaban, waktuMs = 0 }) {
    const { data, error } = await supabase.rpc('kirim_jawaban', {
      p_sesi_id: sesiId,
      p_peserta_id: pesertaId,
      p_soal_id: soalId,
      p_jawaban: jawaban,
      p_waktu_ms: waktuMs
    });
    if (error) throw error;
    return data;
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

