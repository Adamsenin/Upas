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
      const { data, error } = await supabase
        .from('kamus')
        .insert({
          guru_id: guru_id || 'guru-demo-1',
          ...dataBersih
        })
        .select()
        .single();
      if (error) throw error;
      return data?.id;
    }
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

