/**
 * KUPAS KUIS IPAS v4.0 - Manajemen Kuis, Bank Soal, Kelas, Siswa & Analitik (kuis.js)
 * Mematuhi PRD Bagian 4.1 & 10 serta Fase 2 Dashboard Guru Profesional:
 * - CRUD Kuis (Buat, Ubah, Duplikasi, Arsipkan, Acak Soal, KKM, Durasi, Jadwal Buka/Tutup)
 * - Bank Soal (Filter Bab/Topik/Tingkat Kesulitan & Impor CSV/Excel)
 * - Manajemen Kelas & Siswa (Tambah/Impor Massal, Reset Kode Akses, Pindah Kelas, Catatan Guru)
 * - Rekap Nilai, Statistik, Analisis Butir Soal & Pengecoh, Daftar Remedial
 * - Kunci jawaban tetap terpisah di soal_kunci
 */

import { supabase } from './supabase.js';

export const kuisManager = {
  // =========================================================================
  // 1. MANAJEMEN KUIS
  // =========================================================================
  async ambilDaftarKuis() {
    const { data, error } = await supabase
      .from('kuis')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async ambilKuisDetail(kuisId) {
    const { data: kuis, error: errKuis } = await supabase
      .from('kuis')
      .select('*')
      .eq('id', kuisId)
      .single();
    if (errKuis) throw errKuis;

    const { data: soal, error: errSoal } = await supabase
      .from('soal')
      .select('*')
      .eq('kuis_id', kuisId)
      .order('urutan', { ascending: true });
    if (errSoal) throw errSoal;

    return { kuis, soal: soal || [] };
  },

  async simpanKuis({
    id,
    guru_id,
    judul,
    topik,
    deskripsi,
    status = 'terbit',
    kkm = 75,
    acak_soal = false,
    durasi_menit = 15,
    jadwal_buka = '',
    jadwal_tutup = ''
  }) {
    const payload = {
      judul,
      topik,
      deskripsi,
      status,
      kkm: Number(kkm) || 75,
      acak_soal: Boolean(acak_soal),
      durasi_menit: Number(durasi_menit) || 15,
      jadwal_buka: jadwal_buka || null,
      jadwal_tutup: jadwal_tutup || null
    };

    if (id) {
      const { error } = await supabase
        .from('kuis')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
      return id;
    } else {
      const { data, error } = await supabase
        .from('kuis')
        .insert({
          guru_id: guru_id || 'guru-demo-1',
          ...payload
        });
      if (error) throw error;
      return data?.[0]?.id;
    }
  },

  async ubahStatusKuis(kuisId, statusBaru) {
    const { error } = await supabase
      .from('kuis')
      .update({ status: statusBaru })
      .eq('id', kuisId);
    if (error) throw error;
  },

  async duplikatKuis(kuisId) {
    const { kuis, soal } = await this.ambilKuisDetail(kuisId);
    const idKuisBaru = await this.simpanKuis({
      guru_id: kuis.guru_id,
      judul: kuis.judul + ' (Salinan)',
      topik: kuis.topik,
      deskripsi: kuis.deskripsi,
      status: 'draf',
      kkm: kuis.kkm || 75,
      acak_soal: kuis.acak_soal || false,
      durasi_menit: kuis.durasi_menit || 15,
      jadwal_buka: kuis.jadwal_buka || '',
      jadwal_tutup: kuis.jadwal_tutup || ''
    });

    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

    for (let i = 0; i < soal.length; i++) {
      const s = soal[i];
      const kunci = kunciDB[s.id] || '0';
      await this.simpanSoal(idKuisBaru, {
        urutan: s.urutan,
        tipe: s.tipe,
        bab: s.bab || 'Bab 1: Rantai Makanan',
        tingkat_kesulitan: s.tingkat_kesulitan || 'sedang',
        teks: s.teks,
        opsi: s.opsi,
        penjelasan: s.penjelasan,
        waktu_detik: s.waktu_detik,
        poin: s.poin,
        kamus_id: s.kamus_id
      }, kunci);
    }

    return idKuisBaru;
  },

  async hapusKuis(kuisId) {
    const { error } = await supabase.from('kuis').delete().eq('id', kuisId);
    if (error) throw error;
  },

  // =========================================================================
  // 2. BANK SOAL & IMPOR MASSAL CSV/EXCEL
  // =========================================================================
  async ambilSemuaSoal() {
    const { data, error } = await supabase
      .from('soal')
      .select('*')
      .order('urutan', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async simpanSoal(kuisId, soalData, kunciJawaban) {
    const {
      id,
      urutan,
      tipe,
      bab = 'Bab 1: Rantai Makanan',
      tingkat_kesulitan = 'sedang',
      teks,
      opsi,
      penjelasan,
      waktu_detik,
      poin,
      kamus_id
    } = soalData;

    const payloadSoal = {
      urutan: Number(urutan) || 1,
      tipe: tipe || 'pilihan_ganda',
      bab,
      tingkat_kesulitan,
      teks,
      opsi: Array.isArray(opsi) ? opsi : [],
      penjelasan: penjelasan || '',
      waktu_detik: Number(waktu_detik) || 30,
      poin: Number(poin) || 10,
      kamus_id: kamus_id || null
    };

    let soalId = id;
    if (id) {
      const { error } = await supabase
        .from('soal')
        .update({ ...payloadSoal, kuis_id: kuisId || soalData.kuis_id })
        .eq('id', id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase
        .from('soal')
        .insert({
          kuis_id: kuisId || 'kuis-ekosistem-1',
          ...payloadSoal
        });
      if (error) throw error;
      soalId = data?.[0]?.id;
    }

    if (kunciJawaban !== undefined && kunciJawaban !== null) {
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      kunciDB[soalId] = String(kunciJawaban);
      localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(kunciDB));

      try {
        await supabase.from('soal_kunci').insert({
          soal_id: soalId,
          kunci: JSON.stringify(kunciJawaban)
        });
      } catch (e) {}
    }

    return soalId;
  },

  async hapusSoal(soalId) {
    const { error } = await supabase.from('soal').delete().eq('id', soalId);
    if (error) throw error;
  },

  async imporSoalMassal(kuisIdTarget, daftarBaris) {
    const soalSekarang = await this.ambilSemuaSoal();
    let urutanMulai = soalSekarang.filter(s => s.kuis_id === kuisIdTarget).length + 1;
    let jumlahBerhasil = 0;

    for (const row of daftarBaris) {
      const teks = (row.teks || row.Pertanyaan || row.pertanyaan || '').toString().trim();
      if (!teks) continue;

      const tipeRaw = (row.tipe || row.Tipe || 'pilihan_ganda').toString().trim().toLowerCase();
      const tipe = ['pilihan_ganda', 'benar_salah', 'isian_singkat'].includes(tipeRaw) ? tipeRaw : 'pilihan_ganda';
      const bab = (row.bab || row.Bab || 'Bab 1: Rantai Makanan').toString().trim();
      const kesulitanRaw = (row.tingkat_kesulitan || row.Kesulitan || row.kesulitan || 'sedang').toString().trim().toLowerCase();
      const tingkat_kesulitan = ['mudah', 'sedang', 'sulit'].includes(kesulitanRaw) ? kesulitanRaw : 'sedang';

      let opsi = [];
      if (tipe === 'pilihan_ganda') {
        if (Array.isArray(row.opsi)) {
          opsi = row.opsi;
        } else {
          opsi = [
            row.opsi_a || row.OpsiA || row.A || 'Opsi A',
            row.opsi_b || row.OpsiB || row.B || 'Opsi B',
            row.opsi_c || row.OpsiC || row.C || 'Opsi C',
            row.opsi_d || row.OpsiD || row.D || 'Opsi D'
          ].map(x => String(x).trim());
        }
      } else if (tipe === 'benar_salah') {
        opsi = ['Benar', 'Salah'];
      }

      const kunci = (row.kunci ?? row.Kunci ?? '0').toString().trim();
      const penjelasan = (row.penjelasan || row.Penjelasan || 'Pembahasan materi IPAS.').toString().trim();
      const waktu_detik = parseInt(row.waktu_detik || row.Waktu || 30, 10) || 30;
      const poin = parseInt(row.poin || row.Poin || 10, 10) || 10;

      await this.simpanSoal(kuisIdTarget || 'kuis-ekosistem-1', {
        urutan: urutanMulai++,
        tipe,
        bab,
        tingkat_kesulitan,
        teks,
        opsi,
        penjelasan,
        waktu_detik,
        poin
      }, kunci);
      jumlahBerhasil++;
    }
    return jumlahBerhasil;
  },

  // =========================================================================
  // 3. MANAJEMEN KELAS & SISWA + CATATAN GURU
  // =========================================================================
  async ambilDaftarKelas() {
    const { data, error } = await supabase
      .from('kelas')
      .select('*')
      .order('nama_kelas', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async tambahKelas({ nama_kelas, tingkat = 'Kelas V SD', tahun_ajaran = '2026/2027', guru_id = 'guru-demo-1' }) {
    const { data, error } = await supabase
      .from('kelas')
      .insert({ guru_id, nama_kelas, tingkat, tahun_ajaran });
    if (error) throw error;
    return data?.[0];
  },

  async hapusKelas(kelasId) {
    const { error } = await supabase.from('kelas').delete().eq('id', kelasId);
    if (error) throw error;
  },

  async ambilDaftarSiswa() {
    const { data, error } = await supabase
      .from('siswa_terdaftar')
      .select('*')
      .order('nama_lengkap', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async simpanSiswa({ id, guru_id = 'guru-demo-1', kelas_id, nama_kelas, nama_lengkap, nama_panggilan, kode_akses, avatar = 'avatar-1.svg', catatan_guru = '' }) {
    const kodeFinal = kode_akses || ('KPS' + Math.floor(100 + Math.random() * 900));
    const payload = {
      guru_id,
      kelas_id: kelas_id || 'kelas-5a',
      nama_kelas: nama_kelas || 'Kelas V-A',
      nama_lengkap,
      nama_panggilan: nama_panggilan || nama_lengkap.split(' ')[0].slice(0, 20),
      kode_akses: kodeFinal,
      avatar,
      catatan_guru
    };

    if (id) {
      const { error } = await supabase.from('siswa_terdaftar').update(payload).eq('id', id);
      if (error) throw error;
      return id;
    } else {
      const { data, error } = await supabase.from('siswa_terdaftar').insert(payload);
      if (error) throw error;
      return data?.[0]?.id;
    }
  },

  async imporSiswaMassal(daftarBaris, defaultKelas = 'Kelas V-A', guruId = 'guru-demo-1') {
    let jumlah = 0;
    for (const r of daftarBaris) {
      const namaLengkap = (r.nama_lengkap || r.Nama || r.nama || '').toString().trim();
      if (!namaLengkap) continue;
      const panggilan = (r.nama_panggilan || r.Panggilan || namaLengkap.split(' ')[0]).toString().trim().slice(0, 20);
      const kelas = (r.nama_kelas || r.Kelas || r.kelas || defaultKelas).toString().trim();
      const catatan = (r.catatan_guru || r.Catatan || '').toString().trim();
      await this.simpanSiswa({
        guru_id: guruId,
        nama_lengkap: namaLengkap,
        nama_panggilan: panggilan,
        nama_kelas: kelas,
        catatan_guru: catatan
      });
      jumlah++;
    }
    return jumlah;
  },

  async resetKodeAksesSiswa(siswaId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let kodeBaru = 'KPS';
    for (let i = 0; i < 3; i++) {
      kodeBaru += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const { error } = await supabase
      .from('siswa_terdaftar')
      .update({ kode_akses: kodeBaru })
      .eq('id', siswaId);
    if (error) throw error;
    return kodeBaru;
  },

  async pindahKelasSiswa(siswaId, namaKelasBaru, kelasIdBaru = null) {
    const updateObj = { nama_kelas: namaKelasBaru };
    if (kelasIdBaru) updateObj.kelas_id = kelasIdBaru;
    const { error } = await supabase
      .from('siswa_terdaftar')
      .update(updateObj)
      .eq('id', siswaId);
    if (error) throw error;
  },

  async simpanCatatanGuru(siswaId, catatan) {
    const { error } = await supabase
      .from('siswa_terdaftar')
      .update({ catatan_guru: catatan })
      .eq('id', siswaId);
    if (error) throw error;
  },

  async hapusSiswa(siswaId) {
    const { error } = await supabase.from('siswa_terdaftar').delete().eq('id', siswaId);
    if (error) throw error;
  },

  // =========================================================================
  // 4. REKAP NILAI, STATISTIK, ANALISIS BUTIR SOAL & REMEDIAL
  // =========================================================================
  async ambilAnalitikLengkap(kkmGlobal = 75) {
    const [daftarKuis, daftarSoal, daftarKelas, daftarSiswa] = await Promise.all([
      this.ambilDaftarKuis(),
      this.ambilSemuaSoal(),
      this.ambilDaftarKelas(),
      this.ambilDaftarSiswa()
    ]);

    const { data: daftarSesi } = await supabase.from('sesi').select('*').order('created_at', { ascending: true });
    const { data: daftarPeserta } = await supabase.from('peserta').select('*');
    const { data: daftarJawaban } = await supabase.from('jawaban').select('*');

    const sesiList = daftarSesi || [];
    const pesertaList = daftarPeserta || [];
    const jawabanList = daftarJawaban || [];
    const kuisMap = Object.fromEntries(daftarKuis.map(k => [k.id, k]));
    const sesiMap = Object.fromEntries(sesiList.map(s => [s.id, s]));
    const siswaByNama = Object.fromEntries(daftarSiswa.map(s => [s.nama_panggilan.toLowerCase(), s]));
    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

    // A. Susun Baris Rekap Nilai
    const rekapNilai = pesertaList.map(p => {
      const sesi = sesiMap[p.sesi_id] || {};
      const kuis = kuisMap[sesi.kuis_id] || daftarKuis[0] || { id: 'kuis-ekosistem-1', judul: 'Kuis IPAS', kkm: kkmGlobal };
      const siswaReg = daftarSiswa.find(s => s.id === p.siswa_id) || siswaByNama[(p.nama_panggilan || '').toLowerCase()];
      const kelas = p.kelas || siswaReg?.nama_kelas || 'Kelas V-A';
      const namaLengkap = siswaReg?.nama_lengkap || p.nama_panggilan || 'Siswa';

      const jwbPeserta = jawabanList.filter(j => j.peserta_id === p.id);
      const jmlBenar = jwbPeserta.length > 0
        ? jwbPeserta.filter(j => j.benar).length
        : Math.round((p.skor || 0) / 10);
      const totalSoalDijawab = jwbPeserta.length > 0 ? jwbPeserta.length : 10;
      const jmlSalah = Math.max(0, totalSoalDijawab - jmlBenar);

      const totalDetik = p.durasi_detik || Math.round(jwbPeserta.reduce((acc, j) => acc + (j.waktu_ms || 9000), 0) / 1000) || 95;
      const menit = Math.floor(totalDetik / 60);
      const detik = totalDetik % 60;
      const durasiTeks = menit > 0 ? `${menit}m ${detik}d` : `${detik}d`;

      const tanggalISO = (p.created_at || sesi.created_at || new Date().toISOString()).slice(0, 10);
      const nilai = Number(p.skor) || 0;
      const batasKKM = Number(kkmGlobal || kuis.kkm || 75);
      const lulus = nilai >= batasKKM;

      return {
        id: p.id,
        sesi_id: p.sesi_id,
        kode_sesi: sesi.kode || '-',
        siswa_id: siswaReg?.id || null,
        nama: namaLengkap,
        nama_panggilan: p.nama_panggilan,
        kelas,
        kuis_id: kuis.id,
        kuis: kuis.judul,
        nilai,
        benar: jmlBenar,
        salah: jmlSalah,
        benar_salah: `${jmlBenar} Benar / ${jmlSalah} Salah`,
        durasi_detik: totalDetik,
        durasi: durasiTeks,
        tanggal: tanggalISO,
        status: lulus ? 'Lulus' : 'Remedial'
      };
    });

    // B. Analisis Butir Soal & Opsi Pengecoh
    const analisisButir = daftarSoal.map((soal, idx) => {
      const jwbSoal = jawabanList.filter(j => j.soal_id === soal.id);
      const totalJawab = jwbSoal.length;
      const totalBenar = jwbSoal.filter(j => j.benar).length;
      const persenBenar = totalJawab > 0 ? Math.round((totalBenar / totalJawab) * 100) : 0;

      // Hitung frekuensi pengecoh (jawaban salah terbanyak)
      const hitungSalah = {};
      jwbSoal.filter(j => !j.benar).forEach(j => {
        const key = String(j.jawaban ?? '-');
        hitungSalah[key] = (hitungSalah[key] || 0) + 1;
      });

      let pengecohUtama = 'Belum ada pengecoh';
      let maxCount = 0;
      Object.entries(hitungSalah).forEach(([k, cnt]) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          const idxOpsi = parseInt(k, 10);
          const labelOpsi = (soal.opsi && soal.opsi[idxOpsi]) ? soal.opsi[idxOpsi] : k;
          pengecohUtama = `${labelOpsi} (${cnt} siswa)`;
        }
      });

      const idxKunci = parseInt(kunciDB[soal.id] || '0', 10);
      const labelKunci = (soal.opsi && soal.opsi[idxKunci]) ? soal.opsi[idxKunci] : (kunciDB[soal.id] || 'Opsi 1');

      return {
        id: soal.id,
        nomor: idx + 1,
        kuis_id: soal.kuis_id,
        bab: soal.bab || 'Bab 1: Rantai Makanan',
        tingkat_kesulitan: soal.tingkat_kesulitan || 'sedang',
        tipe: soal.tipe,
        teks: soal.teks,
        kunci_label: labelKunci,
        total_jawab: totalJawab,
        total_benar: totalBenar,
        persen_benar: persenBenar,
        pengecoh_terbanyak: pengecohUtama
      };
    });

    // C. Daftar Remedial & Siswa Perlu Perhatian (Di Bawah KKM atau Belum Mengerjakan)
    const daftarPerhatian = [];
    daftarSiswa.forEach(s => {
      const riwayatSiswa = rekapNilai.filter(
        r => r.siswa_id === s.id || r.nama_panggilan.toLowerCase() === s.nama_panggilan.toLowerCase()
      );
      if (riwayatSiswa.length === 0) {
        daftarPerhatian.push({
          siswa_id: s.id,
          nama: s.nama_lengkap,
          kelas: s.nama_kelas,
          kuis_terakhir: '-',
          nilai_terakhir: 0,
          kategori: 'Tidak Mengerjakan',
          catatan_guru: s.catatan_guru || 'Belum mengikuti sesi kuis.'
        });
      } else {
        const terakhir = riwayatSiswa[riwayatSiswa.length - 1];
        if (terakhir.nilai < kkmGlobal) {
          daftarPerhatian.push({
            siswa_id: s.id,
            nama: s.nama_lengkap,
            kelas: s.nama_kelas,
            kuis_terakhir: terakhir.kuis,
            nilai_terakhir: terakhir.nilai,
            kategori: 'Perlu Remedial (< KKM)',
            catatan_guru: s.catatan_guru || 'Nilai di bawah KKM, perlu pendampingan.'
          });
        }
      }
    });

    return {
      daftarKuis,
      daftarSoal,
      daftarKelas,
      daftarSiswa,
      sesiList,
      pesertaList,
      jawabanList,
      rekapNilai,
      analisisButir,
      daftarPerhatian
    };
  }
};
