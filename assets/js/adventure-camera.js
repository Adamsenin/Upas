/**
 * KUPAS KUIS IPAS - Kamera Halus Side-Scroller (adventure-camera.js)
 * Mengontrol pergerakan kamera halus berbasis lerp, antisipasi pandangan (lookahead),
 * serta batasan dunia game.
 */

export class AdventureCamera {
  constructor(virtualWidth = 960, virtualHeight = 540, worldWidth = 7200, worldHeight = 540) {
    this.virtualWidth = virtualWidth;
    this.virtualHeight = virtualHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;

    // Parameter Halus (Smoothness)
    this.lerpSpeed = 0.09;             // Faktor interpolasi kamera
    this.lookaheadDist = 60;           // Antisipasi jarak pandang ke depan
    this.deadzoneWidth = 80;           // Area toleransi tengah tanpa gerak kamera
  }

  /**
   * Reset posisi kamera seketika ke target
   */
  resetTo(targetX, targetY = 0) {
    this.x = Math.max(0, Math.min(this.worldWidth - this.virtualWidth, targetX - this.virtualWidth * 0.35));
    this.y = 0;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  /**
   * Update pergerakan kamera mengikuti pemain
   * @param {Object} player - Entitas pemain { x, y, width, facing }
   * @param {number} dt - Delta time
   */
  update(player, dt = 0.016) {
    const playerCenterX = player.x + player.width / 2;
    const lookahead = (player.facing || 1) * this.lookaheadDist;

    // Hitung posisi kamera ideal agar pemain berada sekitar sepertiga kiri/tengah layar
    const desiredX = playerCenterX - (this.virtualWidth * 0.38) + lookahead;

    // Batasi dalam batas peta
    this.targetX = Math.max(0, Math.min(this.worldWidth - this.virtualWidth, desiredX));

    // Interpolasi lerp halus
    this.x += (this.targetX - this.x) * (this.lerpSpeed * (dt / 0.016));

    // Sumbu Y tetap stabil di 0 untuk lanskap datar padang rumput
    this.y = 0;
  }

  /**
   * Menghitung offset paralaks latar belakang
   * @param {number} speedFactor - Faktor kecepatan layer (misal: 0.1 sky, 0.35 pohon)
   * @returns {number} Offset X dalam piksel
   */
  getParallaxOffset(speedFactor = 0.2) {
    return this.x * speedFactor;
  }
}

