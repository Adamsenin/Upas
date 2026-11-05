/**
 * KUPAS KUIS IPAS - Sistem Audio Terpadu Web Audio API (adventure-audio.js)
 * Menyediakan Efek Suara (SFX) dan Musik Latar Ambient (BGM) Sintetis per Dunia.
 * Berjalan murni di browser tanpa memerlukan file mp3 eksternal.
 */

class AdventureAudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = (typeof localStorage !== 'undefined') ? (localStorage.getItem('kupas_suara_aktif') === 'false') : false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.currentWorldBgm = 1;
    this.bgmStep = 0;
    this.lastPlayTime = {};
  }

  throttle(key, minIntervalMs = 60) {
    const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
    if (this.lastPlayTime[key] && (now - this.lastPlayTime[key] < minIntervalMs)) {
      return true; // Debounce aktif, jangan tumpuk audio
    }
    this.lastPlayTime[key] = now;
    return false;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // ==========================================================================
  // EFEK SUARA (SFX) DENGAN PENCEGAHAN PENUMPUKAN (ANTI-STACKING)
  // ==========================================================================

  playJump() {
    if (this.muted || this.throttle('jump', 70)) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted || this.throttle('coin', 45)) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playLand() {
    if (this.muted || this.throttle('land', 90)) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {}
  }

  playSuccess() {
    if (this.muted || this.throttle('success', 150)) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.22, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.09 + 0.20);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.20);
      });
    } catch (e) {}
  }

  playWrong() {
    if (this.muted || this.throttle('wrong', 150)) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playFlagpole() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Arpeggio riang khas finis Super Mario
      const fanfare = [392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
      fanfare.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.25, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.12 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.28);
      });
    } catch (e) {}
  }

  // ==========================================================================
  // AMBIENT BGM SINTETIS (LOOPING MELODI LEMBUT PER DUNIA)
  // ==========================================================================

  startBgm(worldId = 1) {
    this.currentWorldBgm = worldId;
    if (this.bgmPlaying || this.muted) return;
    this.init();
    this.bgmPlaying = true;
    this.playNextBgmNote();
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  playNextBgmNote() {
    if (!this.bgmPlaying || this.muted || !this.ctx) return;

    // Melodi pentatonik lembut Hutan Ceria (C Mayor Pentatonik: C4, D4, E4, G4, A4)
    const melodyDunia1 = [
      261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66, 329.63,
      392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 261.63, 293.66
    ];

    const freq = melodyDunia1[this.bgmStep % melodyDunia1.length];
    this.bgmStep++;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine'; // Suara marimba/lonceng lembut
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.035, this.ctx.currentTime); // Volume ambient tenang
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.38);
    } catch (e) {}

    this.bgmTimer = setTimeout(() => {
      this.playNextBgmNote();
    }, 450); // Tempo santai ~133 BPM per beat
  }

  toggleMute() {
    this.muted = !this.muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('kupas_suara_aktif', this.muted ? 'false' : 'true');
    }
    if (this.muted) {
      this.stopBgm();
    } else {
      this.startBgm(this.currentWorldBgm);
    }
    return !this.muted;
  }
}

export const adventureAudio = new AdventureAudioSystem();

