/**
 * KUPAS KUIS IPAS - Mesin Parallax 5 Lapis & Elemen Hidup (adventure-parallax.js)
 *
 * Menghadirkan latar belakang dinamis berkualitas HD:
 * Lapis 1: Langit bergradasi tematik
 * Lapis 2: Matahari berkilau & awan mengapung
 * Lapis 3: Pegunungan jauh berkabut
 * Lapis 4: Bukit tengah kanopi pinus
 * Lapis 5: Pepohonan & semak depan
 *
 * Elemen Hidup (Ambient Living Entities):
 * - Burung terbang melintasi langit
 * - Kupu-kupu beterbangan di dekat dedaunan
 * - Daun gugur melayang lembut ditiup angin
 * - Riak air sungai berkilau
 *
 * Aksesibilitas:
 * - Menghormati prefers-reduced-motion dan opsi "Gerak: Berkurang"
 */

export class AdventureParallaxEngine {
  constructor(virtualWidth = 960, virtualHeight = 540) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;

    // Deteksi Preferensi Gerak
    this.isReducedMotion = false;
    this.periksaReducedMotion();

    // Entitas Hidup (Living Ambient Entities)
    this.birds = [
      { x: 120, y: 80, speed: 1.4, wingCycle: 0 },
      { x: 260, y: 110, speed: 1.6, wingCycle: 1.2 },
      { x: 420, y: 70, speed: 1.3, wingCycle: 2.5 }
    ];

    this.butterflies = [
      { x: 300, y: 390, baseX: 300, baseY: 390, angle: 0, color: '#38BDF8' },
      { x: 700, y: 380, baseX: 700, baseY: 380, angle: 1.5, color: '#FACC15' },
      { x: 1500, y: 370, baseX: 1500, baseY: 370, angle: 3.0, color: '#EC4899' },
      { x: 2400, y: 390, baseX: 2400, baseY: 390, angle: 4.2, color: '#4ADE80' }
    ];

    this.fallingLeaves = [];
    this.initLeaves();

    this.cloudOffset = 0;
  }

  periksaReducedMotion() {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = mediaQuery.matches;

      // Cek juga setelan manual KUPAS jika ada
      const setelanKupas = localStorage.getItem('kupas_motion_pref');
      if (setelanKupas === 'reduced') {
        this.isReducedMotion = true;
      }
    }
  }

  setMotionReduced(isReduced) {
    this.isReducedMotion = isReduced;
  }

  setReducedMotion(isReduced) {
    this.setMotionReduced(isReduced);
  }

  initLeaves() {
    const leafCount = this.isReducedMotion ? 4 : 16;
    this.fallingLeaves = [];
    for (let i = 0; i < leafCount; i++) {
      this.fallingLeaves.push({
        x: Math.random() * this.virtualWidth * 2,
        y: Math.random() * this.virtualHeight,
        speedY: 0.6 + Math.random() * 0.8,
        speedX: -0.4 - Math.random() * 0.6,
        size: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: 0.02 + Math.random() * 0.03,
        color: Math.random() > 0.5 ? '#86EFAC' : '#FCD34D'
      });
    }
  }

  update(dt = 0.016) {
    if (this.isReducedMotion) {
      dt = dt * 0.3; // Perlambat gerak ambient drastis untuk reduced motion
    }

    // 1. Geser awan perlahan
    this.cloudOffset += 6 * dt;

    // 2. Update Burung Terbang
    for (const b of this.birds) {
      b.x += b.speed * (this.isReducedMotion ? 0.3 : 1.0);
      b.wingCycle += dt * 6;
      if (b.x > this.virtualWidth + 100) {
        b.x = -80;
        b.y = 50 + Math.random() * 100;
      }
    }

    // 3. Update Kupu-kupu
    for (const bf of this.butterflies) {
      bf.angle += dt * 2.5;
      bf.x = bf.baseX + Math.cos(bf.angle) * 35;
      bf.y = bf.baseY + Math.sin(bf.angle * 1.5) * 18;
    }

    // 4. Update Daun Gugur
    for (const leaf of this.fallingLeaves) {
      leaf.y += leaf.speedY;
      leaf.x += leaf.speedX + Math.sin(leaf.rot) * 0.4;
      leaf.rot += leaf.rotSpeed;

      if (leaf.y > this.virtualHeight + 10) {
        leaf.y = -10;
        leaf.x = Math.random() * this.virtualWidth * 2;
      }
    }
  }

  /**
   * Render Lapis Parallax 5 Tingkat
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} cameraX
   * @param {number} worldId - 1: Hutan, 2: Savana, 3: Sungai
   */
  render(ctx, cameraX, worldId = 1) {
    const vw = this.virtualWidth;
    const vh = this.virtualHeight;

    // ========================================================================
    // LAPIS 1: LANGIT BERGRADASI TEMATIK
    // ========================================================================
    const gradSky = ctx.createLinearGradient(0, 0, 0, vh);
    if (worldId === 1) {
      // Hutan Ceria: Fajar tropis sejuk keemasan
      gradSky.addColorStop(0, '#38BDF8');
      gradSky.addColorStop(0.55, '#BAE6FD');
      gradSky.addColorStop(1, '#DCFCE7');
    } else if (worldId === 2) {
      // Padang Rumput Savana: Hangat keemasan
      gradSky.addColorStop(0, '#0EA5E9');
      gradSky.addColorStop(0.5, '#FDE68A');
      gradSky.addColorStop(1, '#FEF08A');
    } else {
      // Sungai Kehidupan: Biru jernih segar
      gradSky.addColorStop(0, '#0284C7');
      gradSky.addColorStop(0.6, '#7DD3FC');
      gradSky.addColorStop(1, '#E0F2FE');
    }
    ctx.fillStyle = gradSky;
    ctx.fillRect(0, 0, vw, vh);

    // ========================================================================
    // LAPIS 2: MATAHARI & AWAN MENGAPUNG (Parallax 0.08x)
    // ========================================================================
    const sunCamOffset = cameraX * 0.04;
    const sunX = 220 - (sunCamOffset % vw);

    // Matahari & Halo Hangat
    ctx.save();
    const gradSunHalo = ctx.createRadialGradient(sunX, 100, 10, sunX, 100, 95);
    gradSunHalo.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
    gradSunHalo.addColorStop(0.4, 'rgba(253, 224, 71, 0.45)');
    gradSunHalo.addColorStop(1, 'rgba(254, 249, 195, 0)');
    ctx.fillStyle = gradSunHalo;
    ctx.beginPath();
    ctx.arc(sunX, 100, 95, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(sunX, 100, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Awan Mengapung Lembut
    this.renderClouds(ctx, cameraX * 0.08 + this.cloudOffset);

    // Burung Terbang di Langit
    this.renderBirds(ctx);

    // ========================================================================
    // LAPIS 3: SILUET GUNUNG JAUH (Parallax 0.20x)
    // ========================================================================
    this.renderDistantMountains(ctx, cameraX * 0.20, worldId);

    // ========================================================================
    // LAPIS 4: BUKIT TENGAH & KANOPI PINUS (Parallax 0.40x)
    // ========================================================================
    this.renderMidgroundHills(ctx, cameraX * 0.40, worldId);

    // ========================================================================
    // LAPIS 5: PEPOHONAN & SEMAK DEPAN (Parallax 0.70x)
    // ========================================================================
    this.renderForegroundFlora(ctx, cameraX * 0.70, worldId);
  }

  renderClouds(ctx, offset) {
    const vw = this.virtualWidth;
    const clouds = [
      { x: 120, y: 70, w: 140, h: 44 },
      { x: 440, y: 110, w: 180, h: 52 },
      { x: 780, y: 65, w: 160, h: 48 }
    ];

    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    for (const c of clouds) {
      let cx = (c.x - offset) % (vw + 200);
      if (cx < -200) cx += (vw + 400);

      ctx.beginPath();
      ctx.ellipse(cx, c.y, c.w * 0.5, c.h * 0.45, 0, 0, Math.PI * 2);
      ctx.ellipse(cx - c.w * 0.22, c.y + 6, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + c.w * 0.22, c.y + 6, c.w * 0.35, c.h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderBirds(ctx) {
    ctx.strokeStyle = '#1E3A8A';
    ctx.lineWidth = 2.2;
    for (const b of this.birds) {
      const wingY = Math.sin(b.wingCycle) * 6;
      ctx.beginPath();
      // Sayap kiri
      ctx.moveTo(b.x - 12, b.y + wingY);
      ctx.quadraticCurveTo(b.x - 6, b.y - 4, b.x, b.y);
      // Sayap kanan
      ctx.quadraticCurveTo(b.x + 6, b.y - 4, b.x + 12, b.y + wingY);
      ctx.stroke();
    }
  }

  renderDistantMountains(ctx, offset, worldId) {
    const vw = this.virtualWidth;
    const shift = offset % vw;

    ctx.fillStyle = (worldId === 1) ? '#64A587' : (worldId === 2) ? '#927E58' : '#477B96';

    for (let loop = -1; loop <= 1; loop++) {
      const baseX = loop * vw - shift;
      ctx.beginPath();
      ctx.moveTo(baseX - 20, 360);
      ctx.lineTo(baseX + 160, 210);
      ctx.lineTo(baseX + 320, 300);
      ctx.lineTo(baseX + 480, 180);
      ctx.lineTo(baseX + 660, 280);
      ctx.lineTo(baseX + 820, 200);
      ctx.lineTo(baseX + vw + 40, 360);
      ctx.lineTo(baseX + vw + 40, 480);
      ctx.lineTo(baseX - 20, 480);
      ctx.closePath();
      ctx.fill();
    }
  }

  renderMidgroundHills(ctx, offset, worldId) {
    const vw = this.virtualWidth;
    const shift = offset % vw;

    ctx.fillStyle = (worldId === 1) ? '#2D6A4F' : (worldId === 2) ? '#786538' : '#23607E';

    for (let loop = -1; loop <= 1; loop++) {
      const baseX = loop * vw - shift;
      ctx.beginPath();
      ctx.moveTo(baseX - 40, 410);
      ctx.quadraticCurveTo(baseX + 220, 270, baseX + 460, 390);
      ctx.quadraticCurveTo(baseX + 700, 260, baseX + vw + 40, 410);
      ctx.lineTo(baseX + vw + 40, 540);
      ctx.lineTo(baseX - 40, 540);
      ctx.closePath();
      ctx.fill();

      // Pohon-pohon siluet ramah anak di punggung bukit (Mahkota Bertingkat Lembut, Bukan Duri/Jebakan)
      ctx.fillStyle = (worldId === 1) ? '#1B4332' : (worldId === 2) ? '#544624' : '#143C52';
      for (let px = baseX + 40; px < baseX + vw; px += 85) {
        const py = 330 + Math.sin(px * 0.01) * 30;
        // Batang kayu kecil
        ctx.fillRect(px - 2, py - 6, 4, 10);
        // Daun mahkota bulat bertingkat ramah anak
        ctx.beginPath();
        ctx.arc(px, py - 12, 11, 0, Math.PI * 2);
        ctx.arc(px, py - 22, 8, 0, Math.PI * 2);
        ctx.arc(px, py - 30, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = (worldId === 1) ? '#2D6A4F' : (worldId === 2) ? '#786538' : '#23607E';
    }
  }

  renderForegroundFlora(ctx, offset, worldId) {
    const vw = this.virtualWidth;
    const shift = offset % vw;

    // Semak dan rumpun pohon depan
    ctx.fillStyle = (worldId === 1) ? '#1E4620' : (worldId === 2) ? '#5A461E' : '#16423C';

    for (let loop = -1; loop <= 1; loop++) {
      const baseX = loop * vw - shift;
      for (let bx = baseX + 20; bx < baseX + vw; bx += 180) {
        ctx.beginPath();
        ctx.arc(bx, 420, 44, 0, Math.PI * 2);
        ctx.arc(bx + 35, 410, 52, 0, Math.PI * 2);
        ctx.arc(bx + 75, 422, 38, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /**
   * Render Elemen Hidup di Layer Dunia (Kupu-kupu & Daun Gugur)
   */
  renderLivingEntities(ctx, cameraX) {
    // 1. Kupu-kupu
    for (const bf of this.butterflies) {
      const screenX = bf.x - cameraX;
      if (screenX < -50 || screenX > this.virtualWidth + 50) continue;

      ctx.save();
      ctx.translate(screenX, bf.y);
      const wingFlap = Math.sin(bf.angle * 8);
      ctx.scale(wingFlap, 1);

      ctx.fillStyle = bf.color;
      ctx.beginPath();
      ctx.ellipse(-5, -5, 8, 12, -0.4, 0, Math.PI * 2);
      ctx.ellipse(5, -5, 8, 12, 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.fillRect(-1.5, -7, 3, 14);
      ctx.restore();
    }

    // 2. Daun Gugur
    for (const leaf of this.fallingLeaves) {
      const screenX = leaf.x - (cameraX * 0.9);
      const sx = ((screenX % (this.virtualWidth * 2)) + (this.virtualWidth * 2)) % (this.virtualWidth * 2) - 100;
      if (sx < -40 || sx > this.virtualWidth + 40) continue;

      ctx.save();
      ctx.translate(sx, leaf.y);
      ctx.rotate(leaf.rot);
      ctx.fillStyle = leaf.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, leaf.size * 1.5, leaf.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
