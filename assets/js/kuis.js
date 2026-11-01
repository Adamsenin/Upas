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

// ============================================================================
// HELPER VALIDASI & NORMALISASI IMPOR BANK SOAL
// ============================================================================

/**
 * Normalisasi format kunci jawaban agar konsisten 0-3 untuk pilihan ganda
 */
export function normalisasiKunciJawaban(rawKunci, tipe, opsi = []) {
  if (rawKunci === undefined || rawKunci === null) return '0';
  const rawStr = String(rawKunci).trim();

  if (tipe === 'benar_salah') {
    const s = rawStr.toLowerCase();
    if (['0', 'benar', 'true', 'b'].includes(s)) return '0';
    if (['1', 'salah', 'false', 's'].includes(s)) return '1';
    return '0';
  }

  if (tipe === 'isian_singkat') {
    return rawStr.toLowerCase();
  }

  // Tipe: pilihan_ganda (harus indeks 0, 1, 2, 3)
  const up = rawStr.toUpperCase();
  if (['0', '1', '2', '3'].includes(up)) return up;
  if (up === 'A') return '0';
  if (up === 'B') return '1';
  if (up === 'C') return '2';
  if (up === 'D') return '3';

  // 1-based index support jika ada guru yang memakai 1-4
  if (up === '4') return '3';

  // Cek apakah isi kunci cocok dengan teks salah satu opsi
  if (Array.isArray(opsi) && opsi.length > 0) {
    const idx = opsi.findIndex(o => String(o).trim().toLowerCase() === rawStr.toLowerCase());
    if (idx >= 0 && idx <= 3) return String(idx);
  }

  // Default fallback 0 (opsi A)
  return '0';
}

/**
 * Parsing teks CSV ke array objek dengan penanganan tanda kutip dan spasi
 */
export function parseCSVKeObjek(teksCSV) {
  if (!teksCSV) return [];
  const baris = teksCSV.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (baris.length < 2) return [];

  const pemisah = baris[0].includes(';') ? ';' : ',';
  const splitBaris = (line) => {
    const res = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === pemisah && !inQuotes) {
        res.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    return res;
  };

  const headers = splitBaris(baris[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return baris.slice(1).map(line => {
    const cols = splitBaris(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = cols[i] ?? ''; });
    return obj;
  });
}

// ============================================================================
// HELPER DETEKSI SKEMA & PAYLOAD ADAPTIF (KOMPATIBILITAS SUPABASE CLOUD)
// ============================================================================

let cacheKolomSoal = null;

/**
 * Deteksi kolom yang benar-benar ada pada tabel public.soal di Supabase
 * Mencegah PostgREST schema cache rejection (misal: kamus_id atau opsi vs opsi_a..d)
 */
export async function ambilKolomTabelSoal() {
  if (cacheKolomSoal) return new Set(cacheKolomSoal);

  const set = new Set([
    'id', 'urutan', 'teks', 'tipe', 'bab', 'tingkat_kesulitan',
    'penjelasan', 'poin', 'waktu_detik'
  ]);

  const kandidat = [
    'opsi', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d',
    'kuis_id', 'kamus_id', 'gambar_path', 'kunci'
  ];

  for (const col of kandidat) {
    try {
      const { error } = await supabase.from('soal').select(col).limit(1);
      if (!error) {
        set.add(col);
      }
    } catch (e) {}
  }

  cacheKolomSoal = set;
  return new Set(cacheKolomSoal);
}

/**
 * Membentuk objek payload yang adaptif dan kompatibel dengan kolom Supabase aktual
 */
export function buatPayloadSoalAdaptif(soalData, kuisIdTarget, kolomTersedia = new Set(), kunciJawaban = null) {
  const payload = {
    urutan: Number.isInteger(soalData.urutan) ? soalData.urutan : 1,
    teks: String(soalData.teks || '').trim(),
    tipe: soalData.tipe || 'pilihan_ganda',
    bab: soalData.bab || 'Bab 1: Rantai Makanan',
    tingkat_kesulitan: soalData.tingkat_kesulitan || 'sedang',
    penjelasan: soalData.penjelasan || 'Pembahasan materi IPAS.',
    waktu_detik: Number(soalData.waktu_detik) || 30,
    poin: Number(soalData.poin) || 10
  };

  const opsiArr = Array.isArray(soalData.opsi) ? soalData.opsi : [];

  // Format kolom opsi: jsonb vs opsi_a..d
  if (kolomTersedia.has('opsi')) {
    payload.opsi = opsiArr;
  }
  if (kolomTersedia.has('opsi_a')) {
    payload.opsi_a = opsiArr[0] || '';
    payload.opsi_b = opsiArr[1] || '';
    payload.opsi_c = opsiArr[2] || '';
    payload.opsi_d = opsiArr[3] || '';
  }
  if (!kolomTersedia.has('opsi') && !kolomTersedia.has('opsi_a')) {
    payload.opsi_a = opsiArr[0] || '';
    payload.opsi_b = opsiArr[1] || '';
    payload.opsi_c = opsiArr[2] || '';
    payload.opsi_d = opsiArr[3] || '';
  }

  // kuis_id (hanya jika kolom tersedia di DB)
  if (kolomTersedia.has('kuis_id') && kuisIdTarget) {
    payload.kuis_id = kuisIdTarget;
  }

  // kamus_id: JANGAN kirim jika kolom tidak ada di DB!
  if (kolomTersedia.has('kamus_id') && soalData.kamus_id) {
    payload.kamus_id = soalData.kamus_id;
  }

  // gambar_path (hanya jika kolom tersedia di DB)
  if (kolomTersedia.has('gambar_path') && soalData.gambar_path) {
    payload.gambar_path = soalData.gambar_path;
  }

  // Kolom kunci jika tabel soal memiliki kolom kunci (legacy/compatibility)
  const nilaiKunci = soalData.kunci !== undefined ? soalData.kunci : kunciJawaban;
  if (kolomTersedia.has('kunci') && nilaiKunci !== null && nilaiKunci !== undefined) {
    payload.kunci = String(nilaiKunci);
  }

  return payload;
}

/**
 * Validasi mendalam seluruh baris sebelum transaksi penyimpanan dimulai
 */
export function validasiDanSiapkanSoal(daftarBaris, urutanAwal = 1) {
  if (!Array.isArray(daftarBaris) || daftarBaris.length === 0) {
    throw new Error('Berkas tidak memuat baris soal yang dapat diimpor.');
  }

  const errors = [];
  const hasilSiap = [];

  daftarBaris.forEach((row, idx) => {
    const nomorBaris = idx + 2; // +1 header, +1 1-based index

    // 1. Teks Pertanyaan (Wajib)
    const teks = (row.teks || row.pertanyaan || row.Pertanyaan || '').toString().trim();
    if (!teks) {
      errors.push(`Baris ${nomorBaris}: Pertanyaan (teks) tidak boleh kosong.`);
      return;
    }

    // 2. Tipe Soal
    const tipeRaw = (row.tipe || row.Tipe || 'pilihan_ganda').toString().trim().toLowerCase();
    const tipeValid = ['pilihan_ganda', 'benar_salah', 'isian_singkat'];
    const tipe = tipeValid.includes(tipeRaw) ? tipeRaw : 'pilihan_ganda';

    // 3. Bab / Topik & Tingkat Kesulitan
    const bab = (row.bab || row.Bab || 'Bab 1: Rantai Makanan').toString().trim();
    const kesulitanRaw = (row.tingkat_kesulitan || row.kesulitan || row.Kesulitan || 'sedang').toString().trim().toLowerCase();
    const tingkat_kesulitan = ['mudah', 'sedang', 'sulit'].includes(kesulitanRaw) ? kesulitanRaw : 'sedang';

    // 4. Opsi Jawaban
    let opsi = [];
    if (tipe === 'pilihan_ganda') {
      if (Array.isArray(row.opsi)) {
        opsi = row.opsi.map(x => String(x).trim());
      } else {
        const oA = (row.opsi_a ?? row.opsia ?? row.a ?? row.A ?? '').toString().trim();
        const oB = (row.opsi_b ?? row.opsib ?? row.b ?? row.B ?? '').toString().trim();
        const oC = (row.opsi_c ?? row.opsic ?? row.c ?? row.C ?? '').toString().trim();
        const oD = (row.opsi_d ?? row.opsid ?? row.d ?? row.D ?? '').toString().trim();

        opsi = [
          oA || 'Opsi A',
          oB || 'Opsi B',
          oC || 'Opsi C',
          oD || 'Opsi D'
        ];
      }

      if (opsi.filter(Boolean).length < 2) {
        errors.push(`Baris ${nomorBaris}: Soal pilihan ganda harus memiliki minimal 2 opsi pilihan.`);
        return;
      }
    } else if (tipe === 'benar_salah') {
      opsi = ['Benar', 'Salah'];
    } else {
      opsi = [];
    }

    // 5. Kunci Jawaban (Harus 0-3 untuk pilihan ganda)
    const rawKunci = row.kunci ?? row.Kunci ?? '0';
    const kunci = normalisasiKunciJawaban(rawKunci, tipe, opsi);

    if (tipe === 'pilihan_ganda' && !['0', '1', '2', '3'].includes(kunci)) {
      errors.push(`Baris ${nomorBaris}: Kunci jawaban tidak valid (harus 0–3 atau A–D, diberikan: "${rawKunci}").`);
      return;
    }

    // 6. Penjelasan, Waktu, Poin
    const penjelasan = (row.penjelasan || row.Penjelasan || 'Pembahasan materi IPAS.').toString().trim();
    const waktu_detik = Math.max(5, parseInt(row.waktu_detik || row.waktu || row.Waktu || 30, 10) || 30);
    const poin = Math.max(1, parseInt(row.poin || row.Poin || 10, 10) || 10);

    // 7. Urutan Soal Terjamin Berurutan
    const urutan = urutanAwal + hasilSiap.length;

    hasilSiap.push({
      soalPayload: {
        urutan,
        tipe,
        bab,
        tingkat_kesulitan,
        teks,
        opsi,
        penjelasan,
        waktu_detik,
        poin,
        kamus_id: row.kamus_id || null
      },
      kunci
    });
  });

  if (errors.length > 0) {
    const pesanRingkas = errors.slice(0, 5).join('\n');
    const sisa = errors.length > 5 ? `\n...dan ${errors.length - 5} kesalahan lainnya.` : '';
    throw new Error(`Validasi berkas soal gagal (${errors.length} masalah ditemukan):\n${pesanRingkas}${sisa}`);
  }

  return hasilSiap;
}

export const kuisManager = {
  ambilKolomTabelSoal,
  buatPayloadSoalAdaptif,

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

    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
    const soalTerformat = (soal || []).map(s => {
      let opsiArray = [];
      if (Array.isArray(s.opsi) && s.opsi.length > 0) {
        opsiArray = s.opsi;
      } else if (s.opsi_a !== undefined || s.opsi_b !== undefined || s.opsi_c !== undefined || s.opsi_d !== undefined) {
        opsiArray = [s.opsi_a || '', s.opsi_b || '', s.opsi_c || '', s.opsi_d || ''];
      } else if (typeof s.opsi === 'string') {
        try { opsiArray = JSON.parse(s.opsi); } catch (e) { opsiArray = []; }
      }
      return {
        ...s,
        opsi: opsiArray,
        kunci: (s.kunci !== undefined && s.kunci !== null) ? s.kunci : (kunciDB[s.id] || '0')
      };
    });

    return { kuis, soal: soalTerformat };
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
    let payload = {
      judul,
      topik,
      deskripsi,
      status,
      kkm: Number(kkm) || 75,
      acak_soal: Boolean(acak_soal),
      durasi_menit: Number(durasi_menit) || 15
    };

    if (jadwal_buka) payload.jadwal_buka = jadwal_buka;
    if (jadwal_tutup) payload.jadwal_tutup = jadwal_tutup;

    // Normalisasi guru_id agar UUID valid
    let validGuruId = guru_id;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!validGuruId || !uuidRegex.test(validGuruId)) {
      validGuruId = '00000000-0000-0000-0000-000000000001';
    }

    // Pastikan entri profil guru tersedia untuk mencegah violation constraint FK
    try {
      await supabase.from('profil').upsert({
        id: validGuruId,
        nama: 'Ibu/Bapak Guru IPAS',
        sekolah: 'SD Negeri Merdeka'
      }, { onConflict: 'id' });
    } catch (eProfil) {}

    if (id) {
      let res = await supabase.from('kuis').update(payload).eq('id', id);
      while (res.error && res.error.message && res.error.message.includes("Could not find the '")) {
        const match = res.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          delete payload[match[1]];
          res = await supabase.from('kuis').update(payload).eq('id', id);
        } else {
          break;
        }
      }
      if (res.error) throw res.error;
      return id;
    } else {
      let insertPayload = {
        guru_id: validGuruId,
        ...payload
      };

      let res = await supabase.from('kuis').insert(insertPayload).select();
      while (res.error && res.error.message && res.error.message.includes("Could not find the '")) {
        const match = res.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          delete insertPayload[match[1]];
          res = await supabase.from('kuis').insert(insertPayload).select();
        } else {
          break;
        }
      }
      if (res.error) throw res.error;
      return res.data?.[0]?.id;
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
    
    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

    return (data || []).map(s => {
      let opsiArray = [];
      if (Array.isArray(s.opsi) && s.opsi.length > 0) {
        opsiArray = s.opsi;
      } else if (s.opsi_a !== undefined || s.opsi_b !== undefined || s.opsi_c !== undefined || s.opsi_d !== undefined) {
        opsiArray = [s.opsi_a || '', s.opsi_b || '', s.opsi_c || '', s.opsi_d || ''];
      } else if (typeof s.opsi === 'string') {
        try { opsiArray = JSON.parse(s.opsi); } catch (e) { opsiArray = []; }
      }
      return {
        ...s,
        opsi: opsiArray,
        kunci: (s.kunci !== undefined && s.kunci !== null) ? s.kunci : (kunciDB[s.id] || '0')
      };
    });
  },

  async ambilSoalKuis(kuisId) {
    const { data, error } = await supabase
      .from('soal')
      .select('*')
      .eq('kuis_id', kuisId)
      .order('urutan', { ascending: true });
    if (error) throw error;

    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

    return (data || []).map(s => {
      let opsiArray = [];
      if (Array.isArray(s.opsi) && s.opsi.length > 0) {
        opsiArray = s.opsi;
      } else if (s.opsi_a !== undefined || s.opsi_b !== undefined || s.opsi_c !== undefined || s.opsi_d !== undefined) {
        opsiArray = [s.opsi_a || '', s.opsi_b || '', s.opsi_c || '', s.opsi_d || ''];
      } else if (typeof s.opsi === 'string') {
        try { opsiArray = JSON.parse(s.opsi); } catch (e) { opsiArray = []; }
      }
      return {
        ...s,
        opsi: opsiArray,
        kunci: (s.kunci !== undefined && s.kunci !== null) ? s.kunci : (kunciDB[s.id] || '0')
      };
    });
  },

  async simpanSoal(kuisId, soalData, kunciJawaban) {
    const kolomTersedia = await ambilKolomTabelSoal();
    let payload = buatPayloadSoalAdaptif(soalData, kuisId || soalData.kuis_id, kolomTersedia, kunciJawaban);
    let soalId = soalData.id;

    if (soalId) {
      let resUpdate = await supabase
        .from('soal')
        .update(payload)
        .eq('id', soalId);

      // Penanganan otomatis jika kolom kunci dituntut di DB
      if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes('column "kunci" of relation "soal"')) {
        kolomTersedia.add('kunci');
        payload.kunci = String(kunciJawaban ?? soalData.kunci ?? '0');
        resUpdate = await supabase.from('soal').update(payload).eq('id', soalId);
      }

      // Penanganan otomatis jika ada kolom yang tidak ada di schema cache
      if (resUpdate.error && resUpdate.error.message && resUpdate.error.message.includes("Could not find the '")) {
        const match = resUpdate.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          kolomTersedia.delete(match[1]);
          delete payload[match[1]];
          resUpdate = await supabase.from('soal').update(payload).eq('id', soalId);
        }
      }
      if (resUpdate.error) throw resUpdate.error;
    } else {
      let resInsert = await supabase
        .from('soal')
        .insert(payload)
        .select();

      // Penanganan otomatis jika kolom kunci dituntut di DB
      if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('column "kunci" of relation "soal"')) {
        kolomTersedia.add('kunci');
        payload.kunci = String(kunciJawaban ?? soalData.kunci ?? '0');
        resInsert = await supabase.from('soal').insert(payload).select();
      }

      if (resInsert.error && resInsert.error.message && resInsert.error.message.includes("Could not find the '")) {
        const match = resInsert.error.message.match(/Could not find the '([^']+)' column/);
        if (match && match[1]) {
          kolomTersedia.delete(match[1]);
          delete payload[match[1]];
          resInsert = await supabase.from('soal').insert(payload).select();
        }
      }
      if (resInsert.error) throw resInsert.error;
      soalId = resInsert.data?.[0]?.id;
    }

    if (kunciJawaban !== undefined && kunciJawaban !== null && soalId) {
      const kunciNorm = normalisasiKunciJawaban(kunciJawaban, payload.tipe, soalData.opsi);
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      kunciDB[soalId] = String(kunciNorm);
      localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(kunciDB));

      try {
        await supabase.from('soal_kunci').upsert({
          soal_id: soalId,
          kunci: JSON.stringify(kunciNorm)
        });
      } catch (e) {
        console.warn('Tabel soal_kunci belum siap di cloud:', e.message);
      }
    }

    return soalId;
  },

  async hapusSoal(soalId) {
    const { error } = await supabase.from('soal').delete().eq('id', soalId);
    if (error) throw error;
    try {
      await supabase.from('soal_kunci').delete().eq('soal_id', soalId);
      const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');
      delete kunciDB[soalId];
      localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(kunciDB));
    } catch (e) {}
  },

  /**
   * Impor Massal Soal dari CSV / Array Objek
   * Dilengkapi validasi pra-impor, penyesuaian kolom adaptif, dan perlindungan rollback
   */
  async imporSoalMassal(kuisIdTarget, daftarBaris) {
    if (!daftarBaris || !Array.isArray(daftarBaris) || daftarBaris.length === 0) {
      throw new Error('Berkas tidak memuat baris data soal untuk diimpor.');
    }

    // 1. Deteksi kolom tabel soal aktual secara dinamis (bebas bug schema cache)
    const kolomTersedia = await ambilKolomTabelSoal();

    // 2. Tentukan target kuis yang valid jika kuis_id didukung di DB
    let idKuisFinal = kuisIdTarget;
    if (kolomTersedia.has('kuis_id')) {
      try {
        const { data: listKuis } = await supabase.from('kuis').select('id, judul, guru_id').limit(20);
        if (listKuis && listKuis.length > 0) {
          const user = (await supabase.auth.getUser())?.data?.user;
          const found = listKuis.find(k => k.id === kuisIdTarget) ||
                        (user ? listKuis.find(k => k.guru_id === user.id) : null) ||
                        listKuis[0];
          idKuisFinal = found ? found.id : listKuis[0].id;
        }
      } catch (e) {}
      if (!idKuisFinal) idKuisFinal = '11111111-1111-1111-1111-111111111111';
    } else {
      idKuisFinal = null;
    }

    // 3. Tentukan urutan awal secara konsisten dari urutan tertinggi saat ini
    let urutanAwal = 1;
    try {
      let queryUrutan = supabase.from('soal').select('urutan').order('urutan', { ascending: false }).limit(1);
      if (kolomTersedia.has('kuis_id') && idKuisFinal) {
        queryUrutan = queryUrutan.eq('kuis_id', idKuisFinal);
      }
      const { data: soalAda } = await queryUrutan;
      if (soalAda && soalAda.length > 0 && Number.isInteger(soalAda[0].urutan)) {
        urutanAwal = Number(soalAda[0].urutan) + 1;
      }
    } catch (e) {
      try {
        const soalSemua = await this.ambilSemuaSoal();
        urutanAwal = soalSemua.length + 1;
      } catch (errAll) {
        urutanAwal = 1;
      }
    }

    // 4. FASE VALIDASI ATOMIK PRA-IMPOR:
    const itemTervalidasi = validasiDanSiapkanSoal(daftarBaris, urutanAwal);

    // 5. FASE PENYIMPANAN ADAPTIF DENGAN PERLINDUNGAN ROLLBACK:
    const idSoalTerbuat = [];
    const kunciDB = JSON.parse(localStorage.getItem('kupas_db_soal_kunci_secure') || '{}');

    try {
      for (const item of itemTervalidasi) {
        let payload = buatPayloadSoalAdaptif(item.soalPayload, idKuisFinal, kolomTersedia, item.kunci);
        if (kolomTersedia.has('kunci')) {
          payload.kunci = String(item.kunci ?? '0');
        }

        let resInsert = await supabase
          .from('soal')
          .insert(payload)
          .select();

        // Penanganan otomatis jika kolom "kunci" memiliki constraint NOT NULL di DB
        if (resInsert.error && resInsert.error.message && resInsert.error.message.includes('column "kunci" of relation "soal"')) {
          kolomTersedia.add('kunci');
          payload.kunci = String(item.kunci ?? '0');
          resInsert = await supabase.from('soal').insert(payload).select();
        }

        // Penanganan otomatis jika ada kolom yang ditolak oleh PostgREST schema cache
        if (resInsert.error && resInsert.error.message && resInsert.error.message.includes("Could not find the '")) {
          const match = resInsert.error.message.match(/Could not find the '([^']+)' column/);
          if (match && match[1]) {
            const badCol = match[1];
            console.warn(`Menghapus kolom "${badCol}" yang tidak ada di schema cache lalu mencoba kembali.`);
            kolomTersedia.delete(badCol);
            delete payload[badCol];
            resInsert = await supabase.from('soal').insert(payload).select();
          }
        }

        if (resInsert.error) {
          if (resInsert.error.message && resInsert.error.message.toLowerCase().includes('permission denied')) {
            throw new Error(`Izin database ditolak (permission denied). Silakan jalankan file SQL '20261101_perbaikan_akses_dan_kamus.sql' di SQL Editor Supabase untuk memberikan hak akses tabel soal.`);
          }
          throw new Error(`Gagal menyimpan butir soal urutan #${payload.urutan}: ${resInsert.error.message}`);
        }

        const createdId = resInsert.data?.[0]?.id || ('soal-imp-' + Math.random().toString(36).substr(2, 9));
        idSoalTerbuat.push(createdId);

        // Simpan kunci jawaban lokal
        kunciDB[createdId] = String(item.kunci);

        // Coba simpan ke tabel soal_kunci jika tabel tersedia
        try {
          await supabase.from('soal_kunci').upsert({
            soal_id: createdId,
            kunci: JSON.stringify(item.kunci)
          });
        } catch (errKunci) {
          // Abaikan jika tabel soal_kunci belum dibuat di Supabase
        }
      }

      localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(kunciDB));
      return itemTervalidasi.length;

    } catch (errEksekusi) {
      // ROLLBACK: Jika terjadi kegagalan, hapus butir yang sempat tersimpan
      if (idSoalTerbuat.length > 0) {
        console.warn(`Impor gagal di tengah jalan. Melakukan rollback terhadap ${idSoalTerbuat.length} soal...`);
        for (const rollbackId of idSoalTerbuat) {
          try {
            await supabase.from('soal').delete().eq('id', rollbackId);
            await supabase.from('soal_kunci').delete().eq('soal_id', rollbackId);
            delete kunciDB[rollbackId];
          } catch (eRollback) {}
        }
        localStorage.setItem('kupas_db_soal_kunci_secure', JSON.stringify(kunciDB));
      }
      throw new Error(`Transaksi impor dibatalkan: ${errEksekusi.message}`);
    }
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
      this.ambilDaftarKuis().catch(err => { console.warn('Kuis belum tersedia di DB:', err.message); return []; }),
      this.ambilSemuaSoal().catch(err => { console.warn('Soal belum tersedia di DB:', err.message); return []; }),
      this.ambilDaftarKelas().catch(err => { console.warn('Kelas belum tersedia di DB:', err.message); return []; }),
      this.ambilDaftarSiswa().catch(err => { console.warn('Siswa belum tersedia di DB:', err.message); return []; })
    ]);

    let daftarSesi = [];
    let daftarPeserta = [];
    let daftarJawaban = [];
    try {
      const resSesi = await supabase.from('sesi').select('*').order('created_at', { ascending: true });
      daftarSesi = resSesi.data || [];
    } catch (e) {}

    try {
      const resPeserta = await supabase.from('peserta').select('*');
      daftarPeserta = resPeserta.data || [];
    } catch (e) {}

    try {
      const resJawaban = await supabase.from('jawaban').select('*');
      daftarJawaban = resJawaban.data || [];
    } catch (e) {}

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
