/**
 * KUPAS KUIS IPAS v4.0 - Logika Permainan Susun Rantai Makanan (rantai-makanan.js)
 * Versi Radial/Circular Drag & Drop Touch & Mouse
 *
 * Fitur:
 * - Radial / Circular Layout: Slot tersusun melingkar di sekeliling Pusat Energi Matahari.
 * - Drag & Drop langsung memakai Pointer Events (mouse, layar sentuh Smartboard/tablet, stylus).
 * - Pertukaran (swap) slot intuitif dengan visual highlight pada slot sasaran.
 * - Alternatif keyboard & ketuk aksesibel: pilih kartu lalu ketuk slot tujuan, atau tekan angka 1-N.
 * - Panah aliran energi lengkung SVG (searah jarum jam dari Produsen ke Pengurai, bukan siklus tertutup).
 * - Animasi aliran energi 60fps saat susunan benar, dilengkapi review peran biologis.
 * - 4 skenario ekosistem dari database, sistem petunjuk, skor, dan sertifikat digital.
 */

import { supabase } from './supabase.js';
import { animasi } from './animasi.js';
import { pasangHeader, suara, gamifikasi, cetusKonfeti, umumkanAria, renderSkeletonMaskot, renderEmptyStateRamah } from './ui.js';

// Generator Ikon Kartun Makhluk Hidup Bersih & Ceria (SVG Inline)
export const IKON_MAKHLUK_SVG = {
  padi: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M24 44V18" stroke="#16A34A" stroke-width="3" stroke-linecap="round"/><path d="M24 20C18 16 14 8 20 6C24 6 24 16 24 20Z" fill="#FACC15" stroke="#16A34A" stroke-width="2"/><path d="M24 26C30 22 34 14 28 12C24 12 24 22 24 26Z" fill="#FACC15" stroke="#16A34A" stroke-width="2"/><path d="M24 32C18 28 14 20 20 18C24 18 24 28 24 32Z" fill="#FACC15" stroke="#16A34A" stroke-width="2"/></svg>`,
  belalang: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="24" cy="24" rx="14" ry="7" transform="rotate(-15 24 24)" fill="#22C55E" stroke="#15803D" stroke-width="2"/><circle cx="14" cy="20" r="2.5" fill="#000"/><path d="M12 17L6 9M15 16L12 8M28 26L36 38M20 28L16 40" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  katak: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="24" cy="28" rx="15" ry="12" fill="#4ADE80" stroke="#16A34A" stroke-width="2"/><circle cx="16" cy="18" r="5" fill="#86EFAC" stroke="#16A34A" stroke-width="2"/><circle cx="32" cy="18" r="5" fill="#86EFAC" stroke="#16A34A" stroke-width="2"/><circle cx="16" cy="18" r="2.5" fill="#000"/><circle cx="32" cy="18" r="2.5" fill="#000"/><path d="M18 30C22 34 26 34 30 30" stroke="#166534" stroke-width="2" stroke-linecap="round"/></svg>`,
  ular: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M8 36C12 30 18 30 22 36C26 42 32 42 36 36C40 30 40 20 34 16C28 12 28 24 20 20" stroke="#059669" stroke-width="4.5" stroke-linecap="round"/><circle cx="33" cy="15" r="2" fill="#000"/><path d="M38 16L44 14" stroke="#DC2626" stroke-width="1.5"/></svg>`,
  elang: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M8 22C16 12 32 12 40 22L24 34L8 22Z" fill="#B45309" stroke="#78350F" stroke-width="2"/><circle cx="24" cy="20" r="6" fill="#FDE68A" stroke="#78350F" stroke-width="2"/><path d="M22 23L24 28L26 23Z" fill="#F59E0B"/><circle cx="22" cy="19" r="1.5" fill="#000"/><circle cx="26" cy="19" r="1.5" fill="#000"/></svg>`,
  jamur: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M8 26C8 14 40 14 40 26Z" fill="#EF4444" stroke="#991B1B" stroke-width="2"/><circle cx="18" cy="20" r="2.5" fill="#FFF"/><circle cx="30" cy="20" r="2.5" fill="#FFF"/><rect x="20" y="26" width="8" height="14" rx="2" fill="#F3F4F6" stroke="#991B1B" stroke-width="2"/></svg>`,
  alga: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M16 40C12 30 20 20 16 10M24 42C28 32 20 22 24 8M32 40C28 30 36 20 32 12" stroke="#10B981" stroke-width="3" stroke-linecap="round"/></svg>`,
  'kutu-air': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="11" fill="#38BDF8" stroke="#0284C7" stroke-width="2"/><circle cx="20" cy="20" r="2" fill="#000"/><path d="M22 14L16 8M26 14L32 8M14 26L8 30M34 26L40 30" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/></svg>`,
  'ikan-kecil': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="22" cy="24" rx="12" ry="7" fill="#FB923C" stroke="#C2410C" stroke-width="2"/><polygon points="34,24 42,17 42,31" fill="#FB923C" stroke="#C2410C" stroke-width="2"/><circle cx="16" cy="22" r="2" fill="#000"/></svg>`,
  'ikan-gabus': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="22" cy="24" rx="14" ry="8" fill="#475569" stroke="#1E293B" stroke-width="2"/><polygon points="36,24 44,16 44,32" fill="#475569" stroke="#1E293B" stroke-width="2"/><circle cx="14" cy="22" r="2.5" fill="#FEF08A"/><circle cx="14" cy="22" r="1.2" fill="#000"/></svg>`,
  bangau: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="24" cy="20" rx="9" ry="7" fill="#F8FAFC" stroke="#64748B" stroke-width="2"/><path d="M16 22L6 26M22 27L20 42M26 27L28 42" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"/><circle cx="28" cy="18" r="1.5" fill="#000"/><path d="M33 18L44 19" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  bakteri: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><rect x="14" y="16" width="20" height="16" rx="8" fill="#A855F7" stroke="#6B21A8" stroke-width="2"/><circle cx="20" cy="22" r="1.5" fill="#FFF"/><circle cx="28" cy="26" r="1.5" fill="#FFF"/><path d="M12 20L6 18M12 28L6 30M36 20L42 18M36 28L42 30" stroke="#6B21A8" stroke-width="2" stroke-linecap="round"/></svg>`,
  'pohon-buah': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><rect x="22" y="28" width="4" height="14" fill="#9A3412"/><circle cx="24" cy="20" r="12" fill="#22C55E" stroke="#15803D" stroke-width="2"/><circle cx="18" cy="16" r="2.5" fill="#EF4444"/><circle cx="28" cy="18" r="2.5" fill="#EF4444"/><circle cx="22" cy="24" r="2.5" fill="#EF4444"/></svg>`,
  rusa: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="24" cy="26" rx="12" ry="9" fill="#B45309" stroke="#78350F" stroke-width="2"/><circle cx="34" cy="18" r="5" fill="#B45309" stroke="#78350F" stroke-width="2"/><path d="M34 13L32 6M36 13L40 7" stroke="#78350F" stroke-width="2" stroke-linecap="round"/><circle cx="35" cy="17" r="1.5" fill="#000"/><path d="M18 35L17 44M28 35L29 44" stroke="#78350F" stroke-width="2"/></svg>`,
  'ular-sanca': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M10 34C14 28 20 28 24 34C28 40 34 40 38 34C42 28 40 18 32 16C24 14 22 24 16 20" stroke="#713F12" stroke-width="5" stroke-linecap="round"/><circle cx="33" cy="16" r="2" fill="#000"/></svg>`,
  harimau: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="13" fill="#F97316" stroke="#C2410C" stroke-width="2"/><circle cx="19" cy="21" r="2" fill="#000"/><circle cx="29" cy="21" r="2" fill="#000"/><polygon points="24,25 21,28 27,28" fill="#000"/><path d="M14 16L19 19M34 16L29 19M24 12L24 16" stroke="#000" stroke-width="2"/></svg>`,
  'cacing-rayap': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M10 24C14 18 18 30 22 24C26 18 30 30 34 24C38 18 42 24 42 24" stroke="#E11D48" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="23" r="1.5" fill="#000"/></svg>`,
  fitoplankton: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="10" fill="#86EFAC" stroke="#16A34A" stroke-width="2"/><path d="M24 6V14M24 34V42M6 24H14M34 24H42" stroke="#16A34A" stroke-width="2" stroke-linecap="round"/></svg>`,
  zooplankton: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="24" cy="24" rx="9" ry="6" fill="#7DD3FC" stroke="#0284C7" stroke-width="2"/><path d="M33 24L42 18M33 24L42 30" stroke="#0284C7" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="22" r="1.5" fill="#000"/></svg>`,
  'ikan-teri': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="20" cy="24" rx="10" ry="5" fill="#94A3B8" stroke="#475569" stroke-width="1.8"/><polygon points="30,24 38,18 38,30" fill="#94A3B8" stroke="#475569" stroke-width="1.8"/><circle cx="14" cy="23" r="1.5" fill="#000"/></svg>`,
  'ikan-tuna': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><ellipse cx="22" cy="24" rx="14" ry="7" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/><polygon points="36,24 44,16 44,32" fill="#3B82F6" stroke="#1D4ED8" stroke-width="2"/><circle cx="14" cy="22" r="2" fill="#FFF"/><circle cx="14" cy="22" r="1" fill="#000"/></svg>`,
  hiu: `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><path d="M8 26C16 16 34 16 42 26L32 30L22 28Z" fill="#64748B" stroke="#334155" stroke-width="2"/><polygon points="24,18 20,8 28,18" fill="#64748B" stroke="#334155" stroke-width="2"/><circle cx="14" cy="24" r="1.5" fill="#000"/></svg>`,
  'bakteri-laut': `<svg viewBox="0 0 48 48" width="36" height="36" fill="none"><circle cx="24" cy="24" r="11" fill="#06B6D4" stroke="#0E7490" stroke-width="2"/><path d="M20 20L28 28M28 20L20 28" stroke="#FFF" stroke-width="2" stroke-linecap="round"/></svg>`
};

class GameRantaiMakanan {
  constructor() {
    this.daftarSkenario = [];
    this.skenarioAktif = null;
    this.kartuSekarang = [];
    this.percobaan = 1;
    this.petunjukDipakai = 0;
    this.sudahTuntas = false;
    this.kartuTerpilihKeyboard = null;
    this.waktuMulai = Date.now();
    this.namaSiswa = localStorage.getItem('kupas_nama_siswa') || 'Siswa Hebat';

    // Elemen DOM
    this.wadahUtama = document.getElementById('wadah-arena-rantai');
    this.wadahPills = document.getElementById('wadah-pills-ekosistem');
    this.maskotEl = document.getElementById('maskot-reaksi-rantai');
    this.balonTeksEl = document.getElementById('balon-ucapan-rantai');
    this.judulSkenarioEl = document.getElementById('judul-skenario-aktif');
    this.deskripsiSkenarioEl = document.getElementById('deskripsi-skenario-aktif');
    this.btnPeriksa = document.getElementById('btn-periksa-rantai');
    this.btnPetunjuk = document.getElementById('btn-petunjuk-rantai');
    this.btnUlangi = document.getElementById('btn-ulangi-rantai');
    this.wadahPenjelasan = document.getElementById('wadah-penjelasan-rantai');
    this.boxSertifikat = document.getElementById('box-sertifikat-rantai');
  }

  async init() {
    pasangHeader('siswa', { rootAset: '', berandaLink: 'index.html' });

    await this.muatDataSkenario();

    // Event listener tombol kontrol
    if (this.btnPeriksa) {
      this.btnPeriksa.addEventListener('click', () => this.periksaRantai());
    }
    if (this.btnPetunjuk) {
      this.btnPetunjuk.addEventListener('click', () => this.beriPetunjuk());
    }
    if (this.btnUlangi) {
      this.btnUlangi.addEventListener('click', () => this.ulangiPosisi());
    }

    // Keyboard global listener untuk memindahkan kartu yang terpilih (angka 1 s/d N atau Escape)
    window.addEventListener('keydown', (e) => {
      if (this.kartuTerpilihKeyboard !== null) {
        const total = this.kartuSekarang.length;
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= total) {
          e.preventDefault();
          this.tukarPosisi(this.kartuTerpilihKeyboard, num - 1);
        } else if (e.key === 'Escape') {
          this.kartuTerpilihKeyboard = null;
          this.renderKartu();
          umumkanAria('Pilihan kartu dibatalkan.');
        }
      }
    });
  }

  async muatDataSkenario() {
    if (this.wadahUtama) {
      this.wadahUtama.innerHTML = renderSkeletonMaskot('', 'Si Kupas sedang menyiapkan ekosistem alam...');
    }

    try {
      const { data, error } = await supabase.from('food_chain_scenarios').select();
      if (error || !data || data.length === 0) {
        if (this.wadahUtama) {
          this.wadahUtama.innerHTML = renderEmptyStateRamah('', 'Skenario Belum Tersedia', 'Guru belum menerbitkan skenario rantai makanan.');
        }
        return;
      }

      this.daftarSkenario = data.filter(d => d.status === 'terbit');
      this.renderPillsEkosistem();
      this.pilihSkenario(this.daftarSkenario[0]?.ekosistem || 'sawah');
    } catch (e) {
      console.error('Gagal memuat skenario rantai makanan:', e);
    }
  }

  renderPillsEkosistem() {
    if (!this.wadahPills) return;

    const ikonPeta = { sawah: '🌾', kolam: '💧', hutan: '🌲', laut: '🌊', kebun: '🌻', sungai: '🏞️' };
    this.wadahPills.innerHTML = this.daftarSkenario.map(s => {
      const aktif = (this.skenarioAktif && this.skenarioAktif.id === s.id) ? 'btn-kupas-hijau' : 'btn-kupas-putih';
      return `
        <button type="button" class="btn ${aktif} btn-sm px-3 py-2 rounded-pill fw-bold d-flex align-items-center gap-1 smartboard-btn pill-ekosistem" data-ekosistem="${s.ekosistem}">
          <span aria-hidden="true">${ikonPeta[s.ekosistem] || '🌿'}</span>
          <span class="text-capitalize">${s.ekosistem}</span>
        </button>
      `;
    }).join('');

    this.wadahPills.querySelectorAll('.pill-ekosistem').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eko = e.currentTarget.getAttribute('data-ekosistem');
        this.pilihSkenario(eko);
      });
    });
  }

  pilihSkenario(ekosistemKey) {
    const target = this.daftarSkenario.find(s => s.ekosistem === ekosistemKey) || this.daftarSkenario[0];
    if (!target) return;

    this.skenarioAktif = target;
    this.percobaan = 1;
    this.petunjukDipakai = 0;
    this.sudahTuntas = false;
    this.kartuTerpilihKeyboard = null;
    this.waktuMulai = Date.now();

    // Judul & Deskripsi
    if (this.judulSkenarioEl) this.judulSkenarioEl.textContent = target.judul;
    if (this.deskripsiSkenarioEl) this.deskripsiSkenarioEl.textContent = target.deskripsi;

    // Acak urutan kartu makhluk dengan Fisher-Yates
    const kartuAsli = Array.isArray(target.kartu_makhluk) ? target.kartu_makhluk : JSON.parse(target.kartu_makhluk || '[]');
    let teracak = [...kartuAsli];
    for (let i = teracak.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [teracak[i], teracak[j]] = [teracak[j], teracak[i]];
    }
    // Pastikan kartu awal tidak langsung benar agar ada tantangan belajar
    if (teracak.every((k, idx) => k.urutan === idx + 1) && teracak.length > 2) {
      const temp = teracak[0];
      teracak[0] = teracak[1];
      teracak[1] = temp;
    }
    this.kartuSekarang = teracak;

    // Reset tombol petunjuk
    if (this.btnPetunjuk) {
      this.btnPetunjuk.disabled = false;
      this.btnPetunjuk.innerHTML = `💡 Petunjuk (Tersisa: 2)`;
    }

    if (this.wadahPenjelasan) this.wadahPenjelasan.innerHTML = '';
    if (this.boxSertifikat) this.boxSertifikat.innerHTML = '';

    this.renderPillsEkosistem();
    this.aturMaskot('assets/svg/maskot-semangat.svg', `Seret kartu makhluk hidup ke slot melingkar mulai dari Produsen autotrof hingga Dekomposer!`);
    this.renderKartu();
  }

  // Menghitung koordinat sudut & posisi radial untuk N kartu (Bentuk Terbuka Searah Jarum Jam)
  hitungKoordinatRadial(total) {
    // Rentang sudut dari -150° (Kiri Atas) s/d +150° (Kiri Bawah) searah jarum jam
    // Memberikan celah alami di sisi kiri sehingga jelas BUKAN siklus tertutup
    const startAngle = -150;
    const endAngle = 150;
    const step = (endAngle - startAngle) / (total - 1);

    const R = 38; // Radius 38% dari lebar wadah
    const koordinat = [];

    for (let i = 0; i < total; i++) {
      const deg = startAngle + i * step;
      const rad = (deg * Math.PI) / 180;
      const xPersen = 50 + R * Math.cos(rad);
      const yPersen = 50 + R * Math.sin(rad);
      koordinat.push({ deg, xPersen, yPersen });
    }

    return koordinat;
  }

  renderKartu() {
    if (!this.wadahUtama) return;

    const total = this.kartuSekarang.length;
    const koordinat = this.hitungKoordinatRadial(total);

    // SVG Panah Busur Lengkung Antar Slot
    let svgArrows = `
      <svg class="radial-svg-layer" viewBox="0 0 600 600" preserveAspectRatio="none">
        <defs>
          <marker id="panah-energi" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#16A34A" />
          </marker>
          <marker id="panah-energi-abu" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#94A3B8" />
          </marker>
        </defs>
    `;

    // Buat busur panah dari Slot i ke Slot i+1 (Linear melingkar, tanpa panah tertutup kembali)
    for (let i = 0; i < total - 1; i++) {
      const p1 = koordinat[i];
      const p2 = koordinat[i + 1];

      // Konversi persen ke viewBox 600x600
      const x1 = (p1.xPersen / 100) * 600;
      const y1 = (p1.yPersen / 100) * 600;
      const x2 = (p2.xPersen / 100) * 600;
      const y2 = (p2.yPersen / 100) * 600;

      // Titik kontrol busur melengkung
      const midAngle = ((p1.deg + p2.deg) / 2) * (Math.PI / 180);
      const rArc = 232;
      const cx = 300 + rArc * Math.cos(midAngle);
      const cy = 300 + rArc * Math.sin(midAngle);

      const animClass = this.sudahTuntas ? 'anim-aliran-energi' : '';
      const markerId = this.sudahTuntas ? 'url(#panah-energi)' : 'url(#panah-energi-abu)';

      svgArrows += `
        <path class="panah-busur-energi ${animClass}" 
              d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" 
              marker-end="${markerId}" />
      `;
    }

    svgArrows += `</svg>`;

    // Pusat Energi Hub (Matahari / Ekosistem)
    const centerHub = `
      <div class="radial-center-hub anim-pop" aria-hidden="true">
        <span class="d-inline-flex align-items-center justify-content-center anim-melambai" style="width: 44px; height: 44px;" aria-hidden="true">
    <svg viewBox="0 0 48 48" width="40" height="40" fill="none"><circle cx="24" cy="24" r="11" fill="#FEF08A" stroke="#B45309" stroke-width="2.5"/><path d="M24 4V10M24 38V44M4 24H10M38 24H44M9.86 9.86L14.1 14.1M33.9 33.9L38.14 38.14M9.86 38.14L14.1 33.9M33.9 14.1L38.14 9.86" stroke="#B45309" stroke-width="3" stroke-linecap="round"/></svg>
  </span>
        <span class="badge bg-white text-dark border border-dark rounded-pill px-2 py-0 mt-1 fw-bold" style="font-size: 0.65rem;">
          Aliran Energi
        </span>
        <small class="text-dark fw-bold d-block mt-0" style="font-size: 0.6rem;">
          ${this.skenarioAktif ? this.skenarioAktif.ekosistem.toUpperCase() : 'IPAS'}
        </small>
      </div>
    `;

    // Render Slot-Slot Melingkar beserta Kartu Organisme di dalamnya
    let slotsHtml = '';
    this.kartuSekarang.forEach((k, idx) => {
      const pos = koordinat[idx];
      const slotUrutan = idx + 1;
      const isSelected = (this.kartuTerpilihKeyboard === idx);
      const ikonSvg = IKON_MAKHLUK_SVG[k.ikon_svg] || IKON_MAKHLUK_SVG['padi'];

      // Label Peran Default Slot (Bila sudah tuntas)
      const labelPeran = this.sudahTuntas ? `<span class="badge bg-success text-white py-0 px-1 small fw-bold text-truncate" style="max-width: 90%; font-size: 0.65rem;">${k.peran}</span>` : '';

      slotsHtml += `
        <div class="radial-slot-drop" id="slot-radial-${idx}" data-slot-index="${idx}" style="left: ${pos.xPersen}%; top: ${pos.yPersen}%;">
          <div class="kartu-makhluk-radial anim-pop ${isSelected ? 'kartu-terpilih' : ''}" 
               id="kartu-rantai-${idx}" 
               data-card-index="${idx}" 
               tabindex="0" 
               role="button" 
               aria-label="Slot ${slotUrutan}: ${k.nama}. Seret atau ketuk untuk memindahkan posisi.">
            
            <div class="d-flex justify-content-between align-items-center w-100 px-1">
              <span class="badge ${idx === 0 ? 'bg-success text-white' : idx === total - 1 ? 'bg-danger text-white' : 'bg-warning text-dark'} border border-dark rounded-pill px-2 py-0 fw-bold" style="font-size: 0.65rem;">
                #${slotUrutan}
              </span>
              ${this.sudahTuntas ? '<span class="text-success fw-bold" style="font-size: 0.75rem;">✓</span>' : ''}
            </div>

            <div class="kartu-makhluk-ikon-radial" aria-hidden="true">
              ${ikonSvg}
            </div>

            <div class="fw-bolder text-dark kartu-nama-teks text-truncate w-100 px-1" style="font-size: 0.85rem;" title="${k.nama}">
              ${k.nama}
            </div>

            <div class="w-100 d-flex justify-content-center">
              ${labelPeran}
            </div>
          </div>
        </div>
      `;
    });

    this.wadahUtama.innerHTML = `
      <div class="arena-radial-rantai" id="arena-radial-rantai">
        ${svgArrows}
        ${centerHub}
        ${slotsHtml}
      </div>
    `;

    // Pasang Interaksi Drag & Drop Pointer Events & Tap/Keyboard
    this.pasangInteraksiDragDanDrop();
  }

  pasangInteraksiDragDanDrop() {
    const cards = this.wadahUtama.querySelectorAll('.kartu-makhluk-radial');
    const slots = this.wadahUtama.querySelectorAll('.radial-slot-drop');

    cards.forEach(card => {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let hasDraggedDistance = false;
      let hoveredSlot = null;
      let fromSlotIndex = parseInt(card.getAttribute('data-card-index'), 10);

      // 1. POINTER DOWN (Mulai Seret)
      card.addEventListener('pointerdown', (e) => {
        if (this.sudahTuntas) return;

        isDragging = true;
        hasDraggedDistance = false;
        startX = e.clientX;
        startY = e.clientY;
        fromSlotIndex = parseInt(card.getAttribute('data-card-index'), 10);

        try {
          card.setPointerCapture(e.pointerId);
        } catch (err) {}

        card.classList.add('sedang-diseret');
      });

      // 2. POINTER MOVE (Sedang Menyeret)
      card.addEventListener('pointermove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (Math.hypot(dx, dy) > 8) {
          hasDraggedDistance = true;
        }

        card.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(1.1)`;

        // Deteksi slot di bawah kursor
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const slotUnder = elemUnder ? elemUnder.closest('.radial-slot-drop') : null;

        slots.forEach(s => s.classList.remove('slot-target-hover'));

        if (slotUnder && slotUnder.id !== `slot-radial-${fromSlotIndex}`) {
          slotUnder.classList.add('slot-target-hover');
          hoveredSlot = slotUnder;
        } else {
          hoveredSlot = null;
        }
      });

      // 3. POINTER UP / END (Lepas Kartu & Tukar Slot)
      const handlePointerEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;

        try {
          card.releasePointerCapture(e.pointerId);
        } catch (err) {}

        slots.forEach(s => s.classList.remove('slot-target-hover'));
        card.classList.remove('sedang-diseret');
        card.style.transform = '';

        // Jika diseret ke slot tujuan yang valid, lakukan pertukaran (swap)
        if (hasDraggedDistance && hoveredSlot) {
          const toSlotIndex = parseInt(hoveredSlot.getAttribute('data-slot-index'), 10);
          if (toSlotIndex !== fromSlotIndex) {
            this.tukarPosisi(fromSlotIndex, toSlotIndex);
          }
        }
      };

      card.addEventListener('pointerup', handlePointerEnd);
      card.addEventListener('pointercancel', handlePointerEnd);

      // 4. CLICK HANDLER (Untuk tap layar sentuh, mouse, dan pengujian programatik)
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.sudahTuntas) return;
        if (hasDraggedDistance) {
          hasDraggedDistance = false;
          return;
        }
        this.handleKetukKartu(fromSlotIndex);
      });

      // Alternatif Keyboard (Enter / Space)
      card.addEventListener('keydown', (e) => {
        if (this.sudahTuntas) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.handleKetukKartu(fromSlotIndex);
        }
      });
    });

    // Pasang listener pada slot kosong/terisi untuk menukar kartu saat mode ketuk aktif
    slots.forEach(slot => {
      slot.addEventListener('click', (e) => {
        if (this.sudahTuntas) return;
        if (this.kartuTerpilihKeyboard !== null) {
          const targetSlotIdx = parseInt(slot.getAttribute('data-slot-index'), 10);
          if (targetSlotIdx !== this.kartuTerpilihKeyboard) {
            this.tukarPosisi(this.kartuTerpilihKeyboard, targetSlotIdx);
          }
        }
      });
    });
  }

  handleKetukKartu(idx) {
    if (this.sudahTuntas) return;

    if (this.kartuTerpilihKeyboard === null) {
      // Pilih kartu sumber
      this.kartuTerpilihKeyboard = idx;
      this.renderKartu();
      const nama = this.kartuSekarang[idx].nama;
      this.aturMaskot('assets/svg/maskot-berpikir.svg', `Kartu "${nama}" dipilih! Sekarang ketuk slot sasaran atau tekan angka 1 s/d ${this.kartuSekarang.length} untuk memindahkannya.`);
      umumkanAria(`Kartu ${nama} dipilih. Ketuk slot sasaran untuk menukar posisi.`);
    } else if (this.kartuTerpilihKeyboard === idx) {
      // Batal pilih jika mengetuk kartu yang sama
      this.kartuTerpilihKeyboard = null;
      this.renderKartu();
      umumkanAria('Pilihan kartu dibatalkan.');
    } else {
      // Tukar kartu yang sedang terpilih dengan kartu yang baru diketuk
      const fromIdx = this.kartuTerpilihKeyboard;
      this.kartuTerpilihKeyboard = null;
      this.tukarPosisi(fromIdx, idx);
    }
  }

  tukarPosisi(indexA, indexB) {
    if (this.sudahTuntas) return;
    if (indexA < 0 || indexA >= this.kartuSekarang.length) return;
    if (indexB < 0 || indexB >= this.kartuSekarang.length) return;

    suara.mainkan('klik');
    const namaA = this.kartuSekarang[indexA].nama;
    const namaB = this.kartuSekarang[indexB].nama;

    // Tukar isi posisi kartu
    const temp = this.kartuSekarang[indexA];
    this.kartuSekarang[indexA] = this.kartuSekarang[indexB];
    this.kartuSekarang[indexB] = temp;

    this.kartuTerpilihKeyboard = null;
    this.renderKartu();

    umumkanAria(`${namaA} ditukar dengan ${namaB} ke Slot #${indexB + 1}.`);
  }

  beriPetunjuk() {
    if (this.sudahTuntas) return;

    if (this.petunjukDipakai >= 2) {
      this.aturMaskot('assets/svg/maskot-bingung.svg', 'Bantuan petunjuk untuk skenario ini sudah habis (maksimal 2 kali). Kamu pasti bisa menuntaskannya!');
      return;
    }

    this.petunjukDipakai++;
    if (this.btnPetunjuk) {
      const sisa = 2 - this.petunjukDipakai;
      this.btnPetunjuk.innerHTML = `💡 Petunjuk (Tersisa: ${sisa})`;
      if (sisa === 0) this.btnPetunjuk.disabled = true;
    }

    // Cari kartu pertama yang posisinya masih salah
    let kartuSalah = null;
    let slotSeharusnya = 0;
    for (let i = 0; i < this.kartuSekarang.length; i++) {
      if (this.kartuSekarang[i].urutan !== (i + 1)) {
        kartuSalah = this.kartuSekarang[i];
        slotSeharusnya = kartuSalah.urutan;
        break;
      }
    }

    // Ambil pesan petunjuk
    let pesanPetunjuk = '';
    if (kartuSalah) {
      pesanPetunjuk = `Petunjuk #${this.petunjukDipakai}: "${kartuSalah.nama}" seharusnya berada di Slot #${slotSeharusnya} (${kartuSalah.peran}). ${kartuSalah.petunjuk || ''}`;
    } else {
      pesanPetunjuk = `Petunjuk #${this.petunjukDipakai}: Ingat, rantai makanan selalu diawali oleh Produsen tumbuhan hijau di Slot #1 dan diakhiri oleh Dekomposer pengurai!`;
    }

    // Kurangi sedikit XP (-5)
    gamifikasi.tambahXP(-5, 'Memakai petunjuk rantai makanan');
    suara.mainkan('balik');
    this.aturMaskot('assets/svg/maskot-berpikir.svg', pesanPetunjuk);
    umumkanAria(pesanPetunjuk);
  }

  ulangiPosisi() {
    if (!this.skenarioAktif) return;
    suara.mainkan('klik');
    this.pilihSkenario(this.skenarioAktif.ekosistem);
    umumkanAria('Posisi kartu diulangi ke posisi awal.');
  }

  async periksaRantai() {
    if (this.sudahTuntas) return;

    const benarSemua = this.kartuSekarang.every((k, idx) => k.urutan === (idx + 1));

    if (benarSemua) {
      this.sudahTuntas = true;
      suara.mainkan('benar');
      suara.mainkan('selesai');
      cetusKonfeti();

      this.aturMaskot('assets/svg/maskot-senang.svg', 'Hebat sekali! Rantai makanan tersusun sempurna dan energi mengalir harmonis tanpa hambatan!');
      if (this.maskotEl) animasi.lompat(this.maskotEl);

      // Hitung skor akhir berdasarkan percobaan dan petunjuk
      const skorAkhir = Math.max(60, 100 - ((this.percobaan - 1) * 10) - (this.petunjukDipakai * 10));
      gamifikasi.tambahXP(skorAkhir, `Menyelesaikan Rantai Makanan ${this.skenarioAktif.judul}`);

      const durasiDetik = Math.round((Date.now() - this.waktuMulai) / 1000);

      // Simpan hasil ke Supabase activity_results
      try {
        await supabase.from('activity_results').insert({
          aktivitas_tipe: 'rantai_makanan',
          aktivitas_id: this.skenarioAktif.id,
          nama_siswa: this.namaSiswa,
          kelas: 'Kelas V-A',
          skor: skorAkhir,
          total_soal: this.kartuSekarang.length,
          benar: this.kartuSekarang.length,
          percobaan: this.percobaan,
          petunjuk_digunakan: this.petunjukDipakai,
          durasi_detik: durasiDetik,
          detail_jawaban: this.kartuSekarang.map(k => ({ id: k.id, nama: k.nama, peran: k.peran, urutan: k.urutan }))
        });
      } catch (err) {
        console.warn('Gagal menyimpan hasil rantai makanan:', err);
      }

      // Terbitkan sertifikat otomatis jika skor >= 80
      if (skorAkhir >= 80) {
        try {
          await supabase.from('certificates').insert({
            nama_siswa: this.namaSiswa,
            kelas: 'Kelas V-A',
            aktivitas_tipe: 'rantai_makanan',
            aktivitas_id: this.skenarioAktif.id,
            nama_kuis_topik: this.skenarioAktif.judul,
            nilai: skorAkhir,
            ambang_batas: 80,
            nama_guru: 'Ibu Guru IPAS'
          });
        } catch (err) {
          console.warn('Gagal menerbitkan sertifikat:', err);
        }
      }

      // Render ulang kartu dengan status tuntas & animasi panah energi
      this.renderKartu();

      // Tampilkan banner sertifikat jika tuntas >= 80
      if (this.boxSertifikat) {
        if (skorAkhir >= 80) {
          this.boxSertifikat.innerHTML = `
            <div class="alert alert-success border-2 border-dark d-flex align-items-center justify-content-between flex-wrap gap-2 anim-pop mb-4" role="alert">
              <div class="d-flex align-items-center gap-2">
                <span class="fs-2" aria-hidden="true">🏆</span>
                <div>
                  <h4 class="h6 fw-bolder mb-0">Selamat! Nilaimu ${skorAkhir}% Memenuhi Syarat Sertifikat</h4>
                  <p class="small mb-0 text-secondary">Berhasil menuntaskan ${this.skenarioAktif.judul} dengan rapi.</p>
                </div>
              </div>
              <a href="sertifikat.html" class="btn btn-kupas-hijau btn-sm fw-bold px-3">
                📜 Lihat Sertifikat
              </a>
            </div>
          `;
        }
      }

      // Tampilkan Penjelasan Rinci Peran Biologis Tiap Makhluk Hidup
      if (this.wadahPenjelasan) {
        this.wadahPenjelasan.innerHTML = `
          <div class="penjelasan-peran-box anim-slide-up mt-4">
            <div class="d-flex align-items-center gap-2 mb-3">
              <span class="fs-4" aria-hidden="true">🔬</span>
              <h3 class="h5 fw-bolder text-dark mb-0">Penjelasan Peran Biologis & Aliran Energi</h3>
            </div>
            <div class="row g-2">
              ${this.kartuSekarang.map(k => `
                <div class="col-12 col-md-6 col-lg-4">
                  <div class="p-2 bg-light rounded-3 border border-dark h-100">
                    <span class="badge bg-success text-white mb-1 small">${k.peran}</span>
                    <h4 class="h6 fw-bolder mb-1">${k.nama}</h4>
                    <p class="small text-secondary mb-0">${k.deskripsi_peran || k.petunjuk || 'Berperan dalam perpindahan biomassa dan energi.'}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      umumkanAria(`Selamat! Rantai makanan tersusun benar. Skormu ${skorAkhir}%.`);
    } else {
      suara.mainkan('salah');
      this.percobaan++;

      // Goyang kartu yang masih di posisi salah
      this.kartuSekarang.forEach((k, idx) => {
        if (k.urutan !== (idx + 1)) {
          const el = document.getElementById(`kartu-rantai-${idx}`);
          if (el) animasi.goyang(el);
        }
      });

      this.aturMaskot('assets/svg/maskot-sedih-menyemangati.svg', 'Urutan rantai makanan belum tepat. Perhatikan posisi produsen di Slot #1 dan predator/dekomposer di slot akhir!');
      umumkanAria('Urutan belum tepat. Coba periksa kembali makhluk hidup yang bertindak sebagai produsen dan konsumen.');
    }
  }

  aturMaskot(svgPath, teks) {
    if (this.maskotEl) this.maskotEl.src = svgPath;
    if (this.balonTeksEl) this.balonTeksEl.textContent = teks;
  }
}

// Inisialisasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  const game = new GameRantaiMakanan();
  game.init();
});
