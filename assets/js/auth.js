/**
 * KUPAS KUIS IPAS v4.0 - Autentikasi & Validasi (auth.js)
 * Mematuhi PRD Bagian 3, 5, dan 12:
 * - Supabase Auth (Email & Password untuk Guru)
 * - Masuk Tanpa Nama Akun / Anonim untuk Siswa (Kode Sesi + Nama Panggilan + Avatar)
 * - Sanitasi input pencegah XSS & batasan panjang karakter 1-20
 */

import { supabase } from './supabase.js';
import { konfigurasiManager } from './konfigurasi.js';

/**
 * Sanitasi string sederhana pencegah XSS
 */
export function bersihkanTeks(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .trim();
}

/**
 * Validasi nama panggilan siswa (1-20 karakter, tanpa kata terlarang sederhana)
 */
export function validasiNamaPanggilan(nama) {
  const bersih = bersihkanTeks(nama);
  if (!bersih || bersih.length < 1) {
    return { valid: false, pesan: 'Nama panggilan tidak boleh kosong.' };
  }
  if (bersih.length > 20) {
    return { valid: false, pesan: 'Nama panggilan maksimal 20 karakter.' };
  }
  // Filter kata kasar sederhana
  const kataKasar = ['kasar', 'bodoh', 'jelek', 'anjing', 'babi'];
  const mengandungKasar = kataKasar.some(k => bersih.toLowerCase().includes(k));
  if (mengandungKasar) {
    return { valid: false, pesan: 'Gunakan nama panggilan yang sopan ya!' };
  }
  return { valid: true, nama: bersih };
}

export const auth = {
  // Masuk Guru (Email + Kata Sandi)
  async masukGuru(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });
    if (error) throw error;
    return data;
  },

  // Daftar Guru Baru
  async daftarGuru(email, password, nama, sekolah) {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          nama: bersihkanTeks(nama),
          sekolah: bersihkanTeks(sekolah)
        }
      }
    });
    if (error) throw error;
    return data;
  },

  // Keluar Guru
  async keluarGuru() {
    await supabase.auth.signOut();
  },

  // Ambil Guru Saat Ini
  async ambilGuruAktif() {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user || null;
    } catch (e) {
      return null;
    }
  },

  // Periksa Akses Guru (Route Guard): Cegah akses tamu tanpa login
  async periksaAksesGuru({ redirectJikaGagal = true, pathMasuk = 'masuk.html' } = {}) {
    const guru = await this.ambilGuruAktif();
    if (!guru && redirectJikaGagal) {
      try {
        sessionStorage.setItem('kupas_redirect_tujuan', window.location.href);
      } catch (e) {}
      window.location.replace(pathMasuk);
      return null;
    }
    return guru;
  },

  // Siswa Gabung Sesi
  async gabungSesiSiswa(kodeSesi, namaPanggilan, avatarDipilih) {
    const kode = kodeSesi.trim().toUpperCase();
    const cekNama = validasiNamaPanggilan(namaPanggilan);
    if (!cekNama.valid) {
      throw new Error(cekNama.pesan);
    }

    // 1. Cek sesi aktif
    const { data: sesi, error: errSesi } = await supabase
      .from('sesi')
      .select('*')
      .eq('kode', kode)
      .single();

    if (errSesi || !sesi) {
      throw new Error('Kode sesi tidak ditemukan. Periksa kembali kodenya!');
    }

    if (sesi.status === 'selesai') {
      throw new Error('Sesi kuis ini sudah selesai.');
    }

    const cfg = konfigurasiManager.ambilPengaturan();
    if (sesi.status === 'berjalan' && !cfg.izinkan_gabung_setelah_mulai) {
      throw new Error('Kuis sudah dimulai dan guru tidak mengizinkan peserta baru bergabung.');
    }

    // 2. Daftar atau gunakan sesi anonim Supabase
    let userId = null;
    try {
      const { data: anonData } = await supabase.auth.signInAnonymously();
      userId = anonData?.user?.id || null;
    } catch (e) {
      // Abaikan jika anonymous auth dinonaktifkan di instance Supabase
    }

    // 3. Masukkan ke tabel peserta (atau cek nama panggilan yang sama untuk pemulihan)
    const { data: pesertaLama } = await supabase
      .from('peserta')
      .select('*')
      .eq('sesi_id', sesi.id)
      .eq('nama_panggilan', cekNama.nama)
      .single();

    if (pesertaLama) {
      // Siswa terputus dan kembali dengan kode + nama yang sama
      return { sesi, peserta: pesertaLama, pulih: true };
    }

    if (cfg.maks_peserta > 0) {
      const { data: listPeserta } = await supabase
        .from('peserta')
        .select('id')
        .eq('sesi_id', sesi.id);
      if (listPeserta && listPeserta.length >= cfg.maks_peserta) {
        throw new Error(`Sesi kelas sudah penuh (maksimal ${cfg.maks_peserta} siswa). Hubungi gurumu ya!`);
      }
    }

    const { data: pesertaBaru, error: errPeserta } = await supabase
      .from('peserta')
      .insert({
        sesi_id: sesi.id,
        user_id: userId,
        nama_panggilan: cekNama.nama,
        avatar: avatarDipilih || 'avatar-1.svg',
        skor: 0
      })
      .select()
      .single();

    if (errPeserta) {
      throw new Error('Gagal bergabung ke sesi: ' + (errPeserta.message || 'Nama sudah dipakai'));
    }

    return { sesi, peserta: pesertaBaru, pulih: false };
  }
};

