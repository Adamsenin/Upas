/**
 * KUPAS KUIS IPAS v4.0 - Pengelola Kamus Belajar (kamus.js)
 * Mematuhi PRD Bagian 19:
 * - CRUD Kamus Belajar (Guru)
 * - Pencarian, filter kategori, dan penanda progres belajar siswa (LocalStorage)
 * - Sanitasi output agar aman dari XSS
 */

import { supabase } from './supabase.js';
import { bersihkanTeks } from './auth.js';

const STORAGE_DIPELAJARI = 'kupas_dipelajari_kamus';

export const kamusManager = {
  // Ambil semua entri kamus (dengan filter kata kunci dan kategori opsional)
  async ambilSemuaKamus({ kategori = '', kataKunci = '', hanyaTerbit = true } = {}) {
    let query = supabase.from('kamus').select('*').order('istilah', { ascending: true });
    
    if (hanyaTerbit) {
      query = query.eq('status', 'terbit');
    }

    const { data, error } = await query;
    if (error) throw error;

    let hasil = data || [];

    if (kategori && kategori !== 'semua') {
      hasil = hasil.filter(item => item.kategori.toLowerCase() === kategori.toLowerCase());
    }

    if (kataKunci && kataKunci.trim()) {
      const q = kataKunci.trim().toLowerCase();
      hasil = hasil.filter(item => 
        item.istilah.toLowerCase().includes(q) ||
        item.definisi.toLowerCase().includes(q) ||
        (item.contoh && item.contoh.toLowerCase().includes(q))
      );
    }

    return hasil;
  },

  // Ambil detail entri kamus tunggal
  async ambilKamusById(id) {
    const { data, error } = await supabase
      .from('kamus')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  // Simpan atau perbarui entri kamus (Khusus Guru)
  async simpanKamus({ id, guru_id, istilah, kategori, definisi, contoh, status = 'terbit' }) {
    const dataBersih = {
      istilah: bersihkanTeks(istilah),
      kategori: bersihkanTeks(kategori),
      definisi: bersihkanTeks(definisi),
      contoh: bersihkanTeks(contoh),
      status
    };

    if (!dataBersih.istilah || !dataBersih.kategori || !dataBersih.definisi) {
      throw new Error('Istilah, kategori, dan definisi wajib diisi!');
    }

    if (id) {
      const { data, error } = await supabase
        .from('kamus')
        .update(dataBersih)
        .eq('id', id);
      if (error) throw error;
      return id;
    } else {
      const validGuruId = (guru_id && /^[0-9a-fA-F-]{36}$/.test(guru_id)) ? guru_id : null;
      const { data, error } = await supabase
        .from('kamus')
        .insert({
          guru_id: validGuruId,
          ...dataBersih
        })
        .select()
        .single();
      if (error) throw error;
      return data?.id;
    }
  },

  // Impor Kamus Massal dari CSV / Excel (Fitur Tahap 2)
  async imporKamusMassal(guruId, daftarBaris) {
    if (!Array.isArray(daftarBaris) || daftarBaris.length === 0) {
      throw new Error('Berkas tidak memuat baris entri istilah yang dapat diimpor.');
    }

    const itemSiap = [];
    const errors = [];
    const validGuruId = (guruId && /^[0-9a-fA-F-]{36}$/.test(guruId)) ? guruId : null;

    daftarBaris.forEach((row, idx) => {
      const nomorBaris = idx + 2;
      const istilah = bersihkanTeks(row.istilah || row.Istilah || row.kata || row.Kata || '');
      const kategori = bersihkanTeks(row.kategori || row.Kategori || 'Ekosistem');
      const definisi = bersihkanTeks(row.definisi || row.Definisi || row.arti || row.Arti || row.penjelasan || '');
      const contoh = bersihkanTeks(row.contoh || row.Contoh || '');
      const statusRaw = (row.status || row.Status || 'terbit').toString().trim().toLowerCase();
      const status = statusRaw === 'draf' ? 'draf' : 'terbit';

      if (!istilah) {
        errors.push(`Baris ${nomorBaris}: Istilah/kata tidak boleh kosong.`);
        return;
      }
      if (!definisi) {
        errors.push(`Baris ${nomorBaris}: Definisi/penjelasan istilah tidak boleh kosong.`);
        return;
      }

      itemSiap.push({
        guru_id: validGuruId,
        istilah,
        kategori: kategori || 'Ekosistem',
        definisi,
        contoh: contoh || null,
        status
      });
    });

    if (itemSiap.length === 0) {
      throw new Error('Tidak ada data kamus valid yang dapat diimpor:\n' + errors.slice(0, 5).join('\n'));
    }

    // Coba simpan sekaligus (bulk insert)
    const { data, error } = await supabase
      .from('kamus')
      .insert(itemSiap)
      .select();

    if (error) {
      // Fallback simpan per baris jika bulk insert ditolak
      let sukses = 0;
      for (const item of itemSiap) {
        try {
          const res = await supabase.from('kamus').insert(item);
          if (!res.error) sukses++;
        } catch (e) {}
      }
      if (sukses > 0) return sukses;
      throw new Error('Gagal menyimpan entri kamus ke database: ' + error.message);
    }

    return (data && data.length) ? data.length : itemSiap.length;
  },

  // Hapus entri kamus (Khusus Guru)
  async hapusKamus(id) {
    const { error } = await supabase.from('kamus').delete().eq('id', id);
    if (error) throw error;
  },

  // Ambil daftar kategori unik
  async ambilDaftarKategori() {
    const { data, error } = await supabase.from('kamus').select('kategori');
    if (error) return ['Rantai Makanan', 'Ekosistem', 'Saling Bergantung', 'Dampak Lingkungan'];
    const katSet = new Set((data || []).map(d => d.kategori).filter(Boolean));
    return Array.from(katSet);
  },

  // Pelacak Progres Siswa: Apakah entri sudah dipelajari
  apakahDipelajari(kamusId) {
    const tersimpan = JSON.parse(localStorage.getItem(STORAGE_DIPELAJARI) || '[]');
    return tersimpan.includes(kamusId);
  },

  // Pelacak Progres Siswa: Beralih status dipelajari
  toggleDipelajari(kamusId) {
    let tersimpan = JSON.parse(localStorage.getItem(STORAGE_DIPELAJARI) || '[]');
    const index = tersimpan.indexOf(kamusId);
    let statusSekarang = false;

    if (index === -1) {
      tersimpan.push(kamusId);
      statusSekarang = true;
    } else {
      tersimpan.splice(index, 1);
      statusSekarang = false;
    }

    localStorage.setItem(STORAGE_DIPELAJARI, JSON.stringify(tersimpan));
    return statusSekarang;
  },

  ambilTotalDipelajari() {
    const tersimpan = JSON.parse(localStorage.getItem(STORAGE_DIPELAJARI) || '[]');
    return tersimpan.length;
  }
};

/**
 * Pengurai berkas CSV menjadi array objek kamus yang bersih
 */
export function parseCSVKeObjekKamus(teksCSV) {
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

