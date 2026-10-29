/**
 * KUPAS KUIS IPAS v4.0 - Komponen Latar Belakang "Hutan Tropis Hidup"
 * Berkas: assets/js/latar-hidup.js
 *
 * Fitur & Kepatuhan:
 * - 7 lapisan SVG inline + CSS murni (tanpa aset gambar eksternal, total < 45KB).
 * - Mendukung variasi tema via atribut `data-latar-tema` pada <body>:
 *   'beranda' | 'hutan' | 'air' | 'pohon' | 'pos' | 'puncak' | 'arena' |
 *   'arena-tenang' | 'petualang' | 'fokus-kuis' | 'tenang'.
 * - Biru sungai/danau (Lapisan 5) HANYA ditampilkan pada tema 'air'.
 * - Parallax ringan maks ±20px (mouse desktop + scroll semua perangkat) via rAF,
 *   berhenti otomatis ke 0% CPU saat diam.
 * - Tidak menangkap klik/fokus: pointer-events: none, aria-hidden="true", z-index: -1.
 * - Jeda otomatis saat tab tidak terlihat (visibilitychange).
 * - Berhenti TOTAL menjadi ilustrasi statis saat Gerak = Kurang (.motion-reduced),
 *   Gerak = Mati (.motion-off), atau prefers-reduced-motion: reduce.
 */

function buatSvgAwan(idGrad) {
  return `
    <svg viewBox="0 0 220 84" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="${idGrad}" x1="110" y1="10" x2="110" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#FAF2DF"/>
        </linearGradient>
      </defs>
      <path d="M36 70H184C198.4 70 209 59.5 209 46.2C209 33.8 199.4 23.7 187 22.8C182.2 11.4 170.6 4 157 4C144.3 4 133.2 10.9 127.8 21.2C122.4 17.5 115.8 15.4 108.6 15.4C93.2 15.4 80.4 26.2 77.4 40.5C73.4 38.6 68.9 37.5 64.1 37.5C47.8 37.5 34.6 50.1 34.6 65.8C34.6 67.3 35 68.7 36 70Z"
        fill="url(#${idGrad})" stroke="#0F3D2E" stroke-opacity="0.24" stroke-width="2" stroke-linejoin="round"/>
      <path d="M58 63H172" stroke="#EDE2C8" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  `;
}

function bangunMarkupLatar(tema) {
  const partikelTenang = tema === 'tenang' || tema === 'fokus-kuis' || tema === 'arena-tenang';

  // Daftar 12 partikel hidup di tepi kiri & kanan (tengah dijaga tenang)
  const daftarKunang = [
    { left: '6%', top: '34%', delay: '-1.5s', dur: '12s', desktopOnly: false },
    { left: '14%', top: '62%', delay: '-6.2s', dur: '14.5s', desktopOnly: false },
    { left: '88%', top: '30%', delay: '-3.8s', dur: '13s', desktopOnly: false },
    { left: '92%', top: '58%', delay: '-8.4s', dur: '15.5s', desktopOnly: true },
    { left: '10%', top: '76%', delay: '-4.9s', dur: '11.5s', desktopOnly: true },
    { left: '84%', top: '72%', delay: '-10.1s', dur: '14s', desktopOnly: !partikelTenang }
  ];

  const daftarDaun = [
    { left: '8%', top: '22%', delay: '-2.5s', dur: '19s', warna: '#2E8B67', desktopOnly: false },
    { left: '90%', top: '20%', delay: '-11s', dur: '22s', warna: '#1E6B4E', desktopOnly: true },
    { left: '17%', top: '16%', delay: '-7.4s', dur: '24s', warna: '#65A162', desktopOnly: true },
    { left: '81%', top: '26%', delay: '-15.2s', dur: '21s', warna: '#2E8B67', desktopOnly: true }
  ];

  const daftarKupu = [
    { left: '11%', top: '50%', delay: '-3.2s', dur: '21s', warna: '#F59E0B', desktopOnly: false },
    { left: '87%', top: '46%', delay: '-12.6s', dur: '25s', warna: '#FBBF24', desktopOnly: true }
  ];

  const htmlKunang = daftarKunang.map((k) => `
    <div class="latar-partikel latar-kunang ${k.desktopOnly ? 'latar-khusus-desktop' : ''}"
         style="left:${k.left}; top:${k.top}; animation-delay:${k.delay}; animation-duration:${k.dur};">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#FDE047" fill-opacity="0.28"/>
        <circle cx="12" cy="12" r="5.5" fill="#FACC15" fill-opacity="0.55"/>
        <circle cx="12" cy="12" r="2.8" fill="#FFFBEB" stroke="#F59E0B" stroke-width="1"/>
      </svg>
    </div>
  `).join('');

  const htmlDaun = partikelTenang ? '' : daftarDaun.map((d) => `
    <div class="latar-partikel latar-daun-jatuh ${d.desktopOnly ? 'latar-khusus-desktop' : ''}"
         style="left:${d.left}; top:${d.top}; animation-delay:${d.delay}; animation-duration:${d.dur};">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 19C4 10.5 11.5 4 20 4C20 12.5 13.5 19 4 19Z" fill="${d.warna}" stroke="#0F3D2E" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M5 18L16 7" stroke="#0F3D2E" stroke-opacity="0.55" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
    </div>
  `).join('');

  const htmlKupu = partikelTenang ? '' : daftarKupu.map((kp) => `
    <div class="latar-partikel latar-kupu ${kp.desktopOnly ? 'latar-khusus-desktop' : ''}"
         style="left:${kp.left}; top:${kp.top}; animation-delay:${kp.delay}; animation-duration:${kp.dur};">
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g class="latar-kupu-sayap">
          <path d="M13.5 14C9.5 7.5 3 8.5 3.5 13.5C3.8 16.8 8.8 17.5 13.5 15Z" fill="${kp.warna}" stroke="#0F3D2E" stroke-width="1.5"/>
          <path d="M14.5 14C18.5 7.5 25 8.5 24.5 13.5C24.2 16.8 19.2 17.5 14.5 15Z" fill="${kp.warna}" stroke="#0F3D2E" stroke-width="1.5"/>
          <path d="M13.5 15.2C10.5 17 7 20.5 9.8 22.5C12.2 24 13.6 19.8 13.8 16Z" fill="#FEF3C7" stroke="#0F3D2E" stroke-width="1.4"/>
          <path d="M14.5 15.2C17.5 17 21 20.5 18.2 22.5C15.8 24 14.4 19.8 14.2 16Z" fill="#FEF3C7" stroke="#0F3D2E" stroke-width="1.4"/>
          <line x1="14" y1="10.5" x2="14" y2="20" stroke="#0F3D2E" stroke-width="1.8" stroke-linecap="round"/>
        </g>
      </svg>
    </div>
  `).join('');

  const svgBurung = `
    <svg viewBox="0 0 32 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 11C6.5 4.5 12.5 5.2 16 11.5C19.5 5.2 25.5 4.5 30 11"
            stroke="#0F3D2E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;

  return `
    <!-- 1. LANGIT PAGI -> KREM HANGAT & SINAR MATAHARI BERDENYUT PELAN -->
    <div class="latar-lapis latar-lapis-1">
      <div class="latar-langit-gradasi"></div>
      <div class="latar-matahari-wadah">
        <svg class="latar-matahari-svg" viewBox="0 0 360 320" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="kupas-pendar-matahari" cx="215" cy="115" r="165" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.72"/>
              <stop offset="48%" stop-color="#F59E0B" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#FFF6E0" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <g class="latar-sinar-denyut">
            <circle cx="215" cy="115" r="160" fill="url(#kupas-pendar-matahari)"/>
            <!-- Berkas Sinar Pagi Lembut -->
            <polygon points="215,115 35,185 65,235" fill="#FDE68A" fill-opacity="0.16"/>
            <polygon points="215,115 110,285 168,300" fill="#FDE68A" fill-opacity="0.14"/>
            <polygon points="215,115 230,305 288,288" fill="#FDE68A" fill-opacity="0.13"/>
            <polygon points="215,115 20,82 32,130" fill="#FFFBEB" fill-opacity="0.18"/>
          </g>
          <circle cx="215" cy="115" r="42" fill="#FFFBEB" stroke="#F59E0B" stroke-opacity="0.45" stroke-width="2"/>
          <circle cx="215" cy="115" r="30" fill="#FEF08A" fill-opacity="0.65"/>
        </svg>
      </div>
      <div class="latar-zona-tenang-tengah"></div>
    </div>

    <!-- 2. AWAN FLAT MELAYANG HORIZONTAL (40-90 DETIK) -->
    <div class="latar-lapis latar-lapis-2">
      <div class="latar-awan-item latar-awan-1">${buatSvgAwan('kupas-grad-awan-1')}</div>
      <div class="latar-awan-item latar-awan-2">${buatSvgAwan('kupas-grad-awan-2')}</div>
      <div class="latar-awan-item latar-awan-3 latar-khusus-desktop">${buatSvgAwan('kupas-grad-awan-3')}</div>
      <div class="latar-awan-item latar-awan-4 latar-khusus-desktop">${buatSvgAwan('kupas-grad-awan-4')}</div>
    </div>

    <!-- 3. PERBUKITAN JAUH (3 LAPISAN BUKIT HIJAU MAKIN GELAP KE DEPAN + KABUT TIPIS) -->
    <div class="latar-lapis latar-lapis-3">
      <div class="latar-lanskap-bawah">
        <svg class="latar-lanskap-svg" viewBox="0 0 1440 380" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Bukit Paling Jauh & Siluet Gunung Tropis Lembut di Tepi -->
          <path d="M0 215C95 168 175 112 265 116C355 120 435 198 555 216C675 234 785 232 905 210C1025 188 1135 110 1245 114C1330 118 1392 162 1440 198V380H0V215Z"
                fill="var(--latar-bukit-jauh)" stroke="#0F3D2E" stroke-opacity="0.14" stroke-width="1.6"/>

          <!-- Pita Kabut Pagi Tipis 1 -->
          <g class="latar-pita-kabut-1">
            <ellipse cx="310" cy="222" rx="340" ry="26" fill="#FFF8E8" fill-opacity="0.58"/>
            <ellipse cx="1140" cy="216" rx="330" ry="24" fill="#FFF8E8" fill-opacity="0.55"/>
          </g>

          <!-- Bukit Lapisan Tengah -->
          <path d="M0 246C135 202 275 196 420 228C565 260 660 274 775 270C910 266 1045 204 1205 198C1305 194 1385 214 1440 236V380H0V246Z"
                fill="var(--latar-bukit-tengah)" stroke="#0F3D2E" stroke-opacity="0.2" stroke-width="1.8"/>

          <!-- Pita Kabut Pagi Tipis 2 (Desktop/Tablet) -->
          <g class="latar-pita-kabut-2 latar-khusus-desktop">
            <ellipse cx="720" cy="282" rx="490" ry="22" fill="#FFF6E0" fill-opacity="0.46"/>
          </g>

          <!-- Bukit Lebih Dekat (Rendah di Tengah agar Area Konten Tetap Tenang) -->
          <path d="M0 278C145 248 290 258 445 292C585 322 855 322 995 292C1150 258 1295 246 1440 274V380H0V278Z"
                fill="var(--latar-bukit-dekat)" stroke="#0F3D2E" stroke-opacity="0.28" stroke-width="2"/>
        </svg>
      </div>
    </div>

    <!-- 4. HUTAN TENGAH (PALEM, PISANG, PAKIS, BAMBU) & SAWAH BERUNDAK INDONESIA -->
    <div class="latar-lapis latar-lapis-4">
      <div class="latar-tanah-dasar"></div>

      <!-- Gugus Hutan Tropis & Sawah Berundak Kiri -->
      <svg class="latar-hutan-sisi latar-hutan-kiri" viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rumpun Bambu Nusantara (Tepi Kiri) -->
        <g class="latar-khusus-desktop" stroke="#0F3D2E" stroke-opacity="0.55" stroke-width="1.6">
          <path d="M34 320C32 238 26 156 18 76" stroke="#1E5A43" stroke-width="5" stroke-linecap="round"/>
          <path d="M54 320C53 246 50 170 46 96" stroke="#276E53" stroke-width="4.5" stroke-linecap="round"/>
          <line x1="25" y1="140" x2="33" y2="140" stroke="#0F3D2E" stroke-width="2"/>
          <line x1="29" y1="196" x2="36" y2="196" stroke="#0F3D2E" stroke-width="2"/>
          <line x1="47" y1="158" x2="54" y2="158" stroke="#0F3D2E" stroke-width="2"/>
          <path d="M22 98C8 90 2 96 10 106C16 111 22 104 22 98Z" fill="#276E53"/>
          <path d="M24 114C38 104 44 110 35 120C29 125 24 120 24 114Z" fill="#1E5A43"/>
          <path d="M48 116C62 108 68 114 59 124C53 128 48 122 48 116Z" fill="#276E53"/>
        </g>

        <!-- Pohon Palem / Kelapa Tropis -->
        <g>
          <path d="M101 312C107 248 121 188 145 134L151 136C129 190 118 250 114 312H101Z" fill="#144835" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <!-- Pelepah Palem Melengkung -->
          <path d="M148 134C116 112 76 116 54 140C84 134 116 136 148 134Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M148 134C114 94 82 82 58 92C88 96 118 112 148 134Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M148 134C144 94 162 66 190 58C172 82 158 106 148 134Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M148 134C182 102 222 100 248 118C214 116 180 122 148 134Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M148 134C184 126 218 140 234 166C204 150 176 140 148 134Z" fill="#165B45" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
        </g>

        <!-- Siluet Daun Pisang Lebar -->
        <g>
          <path d="M174 304C178 264 192 230 218 202C228 220 216 254 174 304Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M168 304C152 262 128 232 96 216C94 238 118 270 168 304Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
        </g>

        <!-- Sawah Berundak (Terasering Nusantara) Kiri -->
        <g>
          <path d="M0 242C95 238 190 252 276 282L254 328H0V242Z" fill="var(--latar-sawah-emas)" stroke="#0F3D2E" stroke-opacity="0.42" stroke-width="2"/>
          <path d="M0 264C112 260 222 274 332 304L316 334H0V264Z" fill="var(--latar-sawah-1)" stroke="#0F3D2E" stroke-opacity="0.48" stroke-width="2"/>
          <path d="M0 288C136 284 268 296 398 322L388 340H0V288Z" fill="var(--latar-sawah-2)" stroke="#0F3D2E" stroke-opacity="0.54" stroke-width="2"/>
          <path d="M0 312C155 310 312 318 462 338H0V312Z" fill="#4E8D63" stroke="#0F3D2E" stroke-opacity="0.6" stroke-width="2"/>
        </g>

        <!-- Rumpun Pakis Tropis Lereng Bawah -->
        <g class="latar-khusus-desktop">
          <path d="M256 322C264 296 282 280 304 274C296 294 280 310 256 322Z" fill="#1E5A43" stroke="#0F3D2E" stroke-width="1.6"/>
          <path d="M250 322C242 298 226 284 206 280C214 298 230 312 250 322Z" fill="#165B45" stroke="#0F3D2E" stroke-width="1.6"/>
        </g>
      </svg>

      <!-- Gugus Hutan Tropis & Sawah Berundak Kanan -->
      <svg class="latar-hutan-sisi latar-hutan-kanan" viewBox="0 0 520 340" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rumpun Bambu Tepi Kanan -->
        <g class="latar-khusus-desktop" stroke="#0F3D2E" stroke-opacity="0.55" stroke-width="1.6">
          <path d="M486 320C488 236 494 156 502 80" stroke="#1E5A43" stroke-width="5" stroke-linecap="round"/>
          <path d="M466 320C468 248 470 174 475 104" stroke="#276E53" stroke-width="4.5" stroke-linecap="round"/>
          <path d="M496 102C510 94 516 100 508 110C502 115 496 108 496 102Z" fill="#276E53"/>
          <path d="M472 120C458 112 452 118 461 128C467 132 472 126 472 120Z" fill="#1E5A43"/>
        </g>

        <!-- Pohon Palem Tropis Kanan -->
        <g>
          <path d="M419 312C413 244 398 182 371 126L365 128C389 184 402 246 406 312H419Z" fill="#144835" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M368 126C402 102 442 106 466 130C434 124 402 126 368 126Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M368 126C400 86 432 76 458 86C426 90 398 104 368 126Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M368 126C372 86 354 60 326 52C344 76 358 100 368 126Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M368 126C334 96 294 96 268 114C302 112 336 116 368 126Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M368 126C332 120 298 134 282 160C312 144 340 134 368 126Z" fill="#165B45" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
        </g>

        <!-- Daun Pisang & Pakis Kanan -->
        <g>
          <path d="M342 302C338 262 322 228 296 202C286 220 298 254 342 302Z" fill="#277958" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M348 302C366 262 390 234 422 218C424 240 400 270 348 302Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="1.8" stroke-linejoin="round"/>
        </g>

        <!-- Sawah Berundak (Terasering Nusantara) Kanan -->
        <g>
          <path d="M520 246C426 242 332 256 246 286L268 330H520V246Z" fill="var(--latar-sawah-emas)" stroke="#0F3D2E" stroke-opacity="0.42" stroke-width="2"/>
          <path d="M520 268C408 264 298 278 188 306L204 334H520V268Z" fill="var(--latar-sawah-1)" stroke="#0F3D2E" stroke-opacity="0.48" stroke-width="2"/>
          <path d="M520 290C384 286 252 298 122 324L132 340H520V290Z" fill="var(--latar-sawah-2)" stroke="#0F3D2E" stroke-opacity="0.54" stroke-width="2"/>
          <path d="M520 314C365 312 208 320 58 338H520V314Z" fill="#4E8D63" stroke="#0F3D2E" stroke-opacity="0.6" stroke-width="2"/>
        </g>
      </svg>
    </div>

    <!-- 5. PITA SUNGAI / DANAU BIRU BERKILAU (HANYA AKTIF DI ZONA AIR) -->
    <div class="latar-lapis latar-lapis-5">
      <div class="latar-sungai-bawah">
        <svg class="latar-lanskap-svg" viewBox="0 0 1440 230" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="kupas-air-sungai" x1="720" y1="85" x2="720" y2="230" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#38BDF8"/>
              <stop offset="45%" stop-color="#0284C7"/>
              <stop offset="100%" stop-color="#0369A1"/>
            </linearGradient>
          </defs>
          <!-- Pita Danau & Aliran Sungai Melengkung -->
          <path d="M0 132C185 114 365 148 565 138C775 128 955 96 1165 112C1275 120 1368 134 1440 128V230H0V132Z"
                fill="url(#kupas-air-sungai)" stroke="#0F3D2E" stroke-opacity="0.55" stroke-width="2.2"/>
          <!-- Garis Tepi Air Lembut -->
          <path d="M0 138C185 120 365 154 565 144C775 134 955 102 1165 118C1275 126 1368 140 1440 134"
                stroke="#E0F2FE" stroke-opacity="0.7" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Kilau Air Bergerak Pelan -->
          <g class="latar-kilau-air-1">
            <rect x="210" y="160" width="95" height="5" rx="2.5" fill="#E0F2FE" fill-opacity="0.72"/>
            <rect x="640" y="154" width="125" height="5.5" rx="2.75" fill="#FFFFFF" fill-opacity="0.68"/>
            <rect x="1080" y="148" width="105" height="5" rx="2.5" fill="#E0F2FE" fill-opacity="0.72"/>
          </g>
          <g class="latar-kilau-air-2">
            <rect x="390" y="182" width="110" height="4.5" rx="2.25" fill="#BAE6FD" fill-opacity="0.65"/>
            <rect x="850" y="176" width="135" height="5" rx="2.5" fill="#E0F2FE" fill-opacity="0.65"/>
          </g>
        </svg>
      </div>
    </div>

    <!-- 6. LAPISAN DEPAN: DAUN & SEMAK BINGKAI SUDUT BAWAH-KIRI & BAWAH-KANAN -->
    <div class="latar-lapis latar-lapis-6">
      <!-- Sudut Bawah-Kiri -->
      <svg class="latar-bingkai-sudut latar-bingkai-kiri" viewBox="0 0 280 230" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Daun Pakis & Tropis Belakang -->
        <path d="M18 214C28 148 74 96 132 72C126 128 86 182 18 214Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M40 198L114 92" stroke="#0F3D2E" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M6 196C4 134 26 84 64 52C76 98 54 154 6 196Z" fill="#277958" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M42 222C98 184 162 168 224 178C188 210 124 226 42 222Z" fill="#277958" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <!-- Semak Bulat Depan Bergaya Selaras Maskot -->
        <path d="M-12 232V164C6 154 30 158 44 174C58 158 88 156 106 174C122 164 148 170 158 188C178 184 198 198 202 220L204 232H-12Z"
              fill="#144835" stroke="#0F3D2E" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M-8 232V186C12 178 34 184 46 198C64 184 92 186 108 202C126 196 148 204 156 222L160 232H-8Z"
              fill="#1E6B4E" stroke="#0F3D2E" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- Kuncup Bunga Hutan Marigold Hangat -->
        <circle cx="88" cy="176" r="6.5" fill="#F59E0B" stroke="#0F3D2E" stroke-width="2"/>
        <circle cx="88" cy="176" r="2.5" fill="#FEF3C7"/>
        <circle cx="42" cy="166" r="5" fill="#FBBF24" stroke="#0F3D2E" stroke-width="1.8"/>
      </svg>

      <!-- Sudut Bawah-Kanan -->
      <svg class="latar-bingkai-sudut latar-bingkai-kanan" viewBox="0 0 280 230" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Daun Tropis Belakang -->
        <path d="M262 214C252 148 206 96 148 72C154 128 194 182 262 214Z" fill="#1E6B4E" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M240 198L166 92" stroke="#0F3D2E" stroke-opacity="0.45" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M274 196C276 134 254 84 216 52C204 98 226 154 274 196Z" fill="#277958" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M238 222C182 184 118 168 56 178C92 210 156 226 238 222Z" fill="#277958" stroke="#0F3D2E" stroke-width="2.4" stroke-linejoin="round"/>
        <!-- Semak Bulat Depan -->
        <path d="M292 232V164C274 154 250 158 236 174C222 158 192 156 174 174C158 164 132 170 122 188C102 184 82 198 78 220L76 232H292Z"
              fill="#144835" stroke="#0F3D2E" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M288 232V186C268 178 246 184 234 198C216 184 188 186 172 202C154 196 132 204 124 222L120 232H288Z"
              fill="#1E6B4E" stroke="#0F3D2E" stroke-width="2.2" stroke-linejoin="round"/>
        <!-- Kuncup Bunga Hutan Marigold Hangat -->
        <circle cx="192" cy="176" r="6.5" fill="#F59E0B" stroke="#0F3D2E" stroke-width="2"/>
        <circle cx="192" cy="176" r="2.5" fill="#FEF3C7"/>
        <circle cx="238" cy="166" r="5" fill="#FBBF24" stroke="#0F3D2E" stroke-width="1.8"/>
      </svg>
    </div>

    <!-- 7. PARTIKEL HIDUP (8-14 KUNANG-KUNANG/KUPU-KUPU/DAUN) & 2-3 BURUNG MELINTAS -->
    <div class="latar-lapis latar-lapis-7">
      ${htmlKunang}
      ${htmlDaun}
      ${htmlKupu}
      <div class="latar-burung latar-burung-1">${svgBurung}</div>
      <div class="latar-burung latar-burung-2 latar-khusus-desktop">${svgBurung}</div>
      <div class="latar-burung latar-burung-3 latar-khusus-desktop">${svgBurung}</div>
    </div>
  `;
}

/**
 * Memeriksa apakah animasi & parallax diizinkan berjalan
 * Berhenti total saat:
 * - body.motion-reduced (Gerak: Kurang / Minim)
 * - body.motion-off (Gerak: Mati)
 * - prefers-reduced-motion: reduce
 * - tab tidak terlihat (document.hidden / body.tab-tersembunyi)
 */
function apakahParallaxAktif(mediaReduced) {
  if (document.hidden) return false;
  if (mediaReduced.matches) return false;
  const cl = document.body.classList;
  if (cl.contains('motion-reduced') || cl.contains('motion-off') || cl.contains('tab-tersembunyi')) {
    return false;
  }
  return true;
}

export function pasangLatarHidup(opsi = {}) {
  if (typeof document === 'undefined' || !document.body) return null;

  // Hindari duplikasi pemasangan
  let wadah = document.getElementById('kupas-latar-hidup');
  const tema = opsi.tema || document.body.dataset.latarTema || 'beranda';

  document.body.dataset.latarTema = tema;
  document.body.classList.add('memiliki-latar-hidup');

  if (!wadah) {
    wadah = document.createElement('div');
    wadah.id = 'kupas-latar-hidup';
    wadah.className = 'kupas-latar-hidup';
    wadah.setAttribute('aria-hidden', 'true');
    wadah.setAttribute('role', 'presentation');
    wadah.innerHTML = bangunMarkupLatar(tema);
    document.body.insertBefore(wadah, document.body.firstChild);
  }

  // Mesin Parallax Ringan (Maks ±20px, berhenti total saat diam / gerak minim)
  const mediaReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointerHalus = window.matchMedia('(pointer: fine)');

  let mouseX = 0;
  let mouseY = 0;
  let scrollYNorm = 0;
  let targetX = 0;
  let targetY = 0;
  let saatIniX = 0;
  let saatIniY = 0;
  let idRaf = null;

  const jepit = (nilai, min, maks) => Math.max(min, Math.min(maks, nilai));

  const resetParallax = () => {
    if (idRaf !== null) {
      cancelAnimationFrame(idRaf);
      idRaf = null;
    }
    mouseX = 0;
    mouseY = 0;
    scrollYNorm = 0;
    targetX = 0;
    targetY = 0;
    saatIniX = 0;
    saatIniY = 0;
    wadah.style.setProperty('--px', '0');
    wadah.style.setProperty('--py', '0');
  };

  const langkahParallax = () => {
    if (!apakahParallaxAktif(mediaReduced)) {
      resetParallax();
      return;
    }

    saatIniX += (targetX - saatIniX) * 0.12;
    saatIniY += (targetY - saatIniY) * 0.12;

    wadah.style.setProperty('--px', saatIniX.toFixed(4));
    wadah.style.setProperty('--py', saatIniY.toFixed(4));

    if (Math.abs(targetX - saatIniX) > 0.003 || Math.abs(targetY - saatIniY) > 0.003) {
      idRaf = requestAnimationFrame(langkahParallax);
    } else {
      idRaf = null;
    }
  };

  const jadwalkanParallax = () => {
    if (!apakahParallaxAktif(mediaReduced)) return;
    targetX = jepit(mouseX, -1, 1);
    targetY = jepit(mouseY * 0.65 + scrollYNorm * 0.55, -1, 1);
    if (idRaf === null) {
      idRaf = requestAnimationFrame(langkahParallax);
    }
  };

  // Mouse Parallax (Desktop)
  window.addEventListener('pointermove', (e) => {
    if (!pointerHalus.matches || !apakahParallaxAktif(mediaReduced)) return;
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    mouseX = ((e.clientX / w) - 0.5) * 2;
    mouseY = ((e.clientY / h) - 0.5) * 2;
    jadwalkanParallax();
  }, { passive: true });

  // Scroll Parallax (Semua Perangkat)
  window.addEventListener('scroll', () => {
    if (!apakahParallaxAktif(mediaReduced)) return;
    const batasScroll = Math.max(360, document.documentElement.scrollHeight - window.innerHeight);
    scrollYNorm = jepit((window.scrollY / batasScroll) * 1.4 - 0.35, -1, 1);
    jadwalkanParallax();
  }, { passive: true });

  // Jeda saat tab tersembunyi (visibilitychange)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      document.body.classList.add('tab-tersembunyi');
      if (idRaf !== null) {
        cancelAnimationFrame(idRaf);
        idRaf = null;
      }
    } else {
      document.body.classList.remove('tab-tersembunyi');
      if (!apakahParallaxAktif(mediaReduced)) {
        resetParallax();
      }
    }
  });

  // Pantau perubahan kelas Gerak pada <body> (.motion-full / .motion-reduced / .motion-off)
  const pengamatKelas = new MutationObserver(() => {
    if (!apakahParallaxAktif(mediaReduced)) {
      resetParallax();
    }
  });
  pengamatKelas.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  mediaReduced.addEventListener('change', () => {
    if (!apakahParallaxAktif(mediaReduced)) {
      resetParallax();
    }
  });

  if (!apakahParallaxAktif(mediaReduced)) {
    resetParallax();
  }

  return wadah;
}

// Auto-mount ketika berkas dimuat sebagai modul
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => pasangLatarHidup());
} else {
  pasangLatarHidup();
}
