/**
 * KUPAS KUIS IPAS - Pengelola Gerbang Tantangan Soal IPAS (adventure-questions.js)
 * Mengatur deteksi kedekatan, penampilan prompt [E], pembukaan modal tantangan,
 * evaluasi jawaban benar/salah dengan umpan balik ramah anak, dan animasi terbukanya gerbang.
 */

export class AdventureQuestionGates {
  constructor(gatesData = [], options = {}) {
    this.gates = JSON.parse(JSON.stringify(gatesData));
    this.onGateUnlocked = options.onGateUnlocked || (() => {});
    this.onCoinAwarded = options.onCoinAwarded || (() => {});
    this.onDialogOpen = options.onDialogOpen || (() => {});
    this.onDialogClosed = options.onDialogClosed || (() => {});
    this.audio = options.audio || null;

    this.activeGate = null;
    this.dialogOverlay = null;
    this.isDialogOpen = false;

    if (typeof document !== 'undefined') {
      this.initDOM();
    }
  }

  initDOM() {
    this.dialogOverlay = document.getElementById('dialog-tantangan-overlay');
  }

  reset() {
    this.gates.forEach(g => { g.terbuka = false; });
    this.activeGate = null;
    this.isDialogOpen = false;
    if (this.dialogOverlay) {
      this.dialogOverlay.classList.remove('aktif');
    }
  }

  /**
   * Cari gerbang terdekat dari pemain untuk memunculkan prompt [E]
   * Memperhitungkan jangkauan horizontal (95px) dan vertikal (90px) terhadap pusat gerbang
   */
  getNearbyGate(player) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    for (const gate of this.gates) {
      if (gate.terbuka) continue;
      const gcx = gate.x + (gate.width || 48) / 2;
      const gcy = gate.y + (gate.height || 64) / 2;
      const dx = Math.abs(px - gcx);
      const dy = Math.abs(py - gcy);
      if (dx <= 95 && dy <= 90) {
        return gate;
      }
    }
    return null;
  }

  /**
   * Buka dialog tantangan saat tombol [E] atau tombol Aksi ditekan
   */
  openChallenge(gate) {
    if (!gate || gate.terbuka || this.isDialogOpen) return;
    this.activeGate = gate;
    this.isDialogOpen = true;
    this.onDialogOpen(gate);

    if (!this.dialogOverlay) this.initDOM();
    if (!this.dialogOverlay) return;

    const judulEl = document.getElementById('dialog-judul');
    const instruksiEl = document.getElementById('dialog-instruksi');
    const soalEl = document.getElementById('dialog-soal-teks');
    const gridOpsiEl = document.getElementById('dialog-grid-opsi');
    const feedbackEl = document.getElementById('dialog-feedback-wadah');

    if (judulEl) judulEl.textContent = gate.judul;
    if (instruksiEl) instruksiEl.textContent = gate.instruksi;
    if (soalEl) soalEl.textContent = gate.pertanyaan;
    if (feedbackEl) feedbackEl.innerHTML = '';

    if (gridOpsiEl) {
      gridOpsiEl.innerHTML = '';
      gate.opsi.forEach((opsiTeks, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-opsi-adventure';
        btn.innerHTML = `<span class="opsi-huruf">${idx + 1}</span> <span>${opsiTeks}</span>`;
        btn.addEventListener('click', () => this.handleAnswer(idx, gate));
        gridOpsiEl.appendChild(btn);
      });
    }

    this.dialogOverlay.classList.add('aktif');
  }

  /**
   * Evaluasi pilihan jawaban siswa
   */
  handleAnswer(pilihanIdx, gate) {
    const feedbackEl = document.getElementById('dialog-feedback-wadah');
    const gridOpsiEl = document.getElementById('dialog-grid-opsi');
    if (!feedbackEl || !gridOpsiEl) return;

    const buttons = gridOpsiEl.querySelectorAll('.btn-opsi-adventure');
    const isCorrect = (pilihanIdx === gate.kunci);

    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === gate.kunci) {
        btn.classList.add('benar');
      } else if (idx === pilihanIdx) {
        btn.classList.add('salah');
      }
    });

    if (isCorrect) {
      if (this.audio) this.audio.playSuccess();
      gate.terbuka = true;

      feedbackEl.innerHTML = `
        <div class="feedback-kotak benar">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span style="font-size: 1.4rem;">🎉</span>
            <strong>Hebat Sekali! Jawabanmu Tepat!</strong>
          </div>
          <p class="small mb-2">${gate.penjelasan}</p>
          <button type="button" class="btn btn-kupas-hijau btn-sm fw-bold px-4 py-2 rounded-pill" id="btn-tutup-tantangan-berhasil">
            ✔ Lanjutkan Petualangan (+15 Koin 🍃)
          </button>
        </div>
      `;

      let awarded = false;
      document.getElementById('btn-tutup-tantangan-berhasil')?.addEventListener('click', () => {
        if (!awarded) {
          awarded = true;
          this.closeDialog();
          this.onGateUnlocked(gate);
          this.onCoinAwarded(15);
        }
      });
    } else {
      if (this.audio) this.audio.playWrong();

      const jawabanBenarTeks = gate.opsi[gate.kunci];
      feedbackEl.innerHTML = `
        <div class="feedback-kotak salah">
          <div class="d-flex align-items-center gap-2 mb-1">
            <span style="font-size: 1.3rem;">💡</span>
            <strong>Belum Tepat, Pelajari Materinya Yuk!</strong>
          </div>
          <p class="small mb-1">Jawaban yang tepat: <strong class="text-success">${jawabanBenarTeks}</strong></p>
          <p class="small text-secondary mb-3"><strong>Penjelasan:</strong> ${gate.penjelasan}</p>
          <button type="button" class="btn btn-outline-dark btn-sm fw-bold px-3 py-1 rounded-pill" id="btn-coba-lagi-tantangan">
            🔄 Coba Jawab Ulang
          </button>
        </div>
      `;

      document.getElementById('btn-coba-lagi-tantangan')?.addEventListener('click', () => {
        feedbackEl.innerHTML = '';
        buttons.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('benar', 'salah');
        });
      });
    }
  }

  closeDialog() {
    this.isDialogOpen = false;
    this.activeGate = null;
    if (this.dialogOverlay) {
      this.dialogOverlay.classList.remove('aktif');
    }
    this.onDialogClosed();
  }
}

