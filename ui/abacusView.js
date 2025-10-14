// ui/abacusView.js
// HTML-представление одного разряда и всей рамки + проигрывание steps[]
import { Abacus } from '../core/abacus.js';

export class AbacusView {
  constructor(root, columns = 1, opts = { speed: 400 }) {
    this.root = root;
    this.speed = opts.speed;
    this.model = new Abacus(columns);
    this._build();
  }

  _build() {
    this.root.classList.add('abacus');
    this.root.innerHTML = '';
    this.columns = this.model.cols.map((digit, index) => {
      const col = document.createElement('div');
      col.className = 'col';
      col.innerHTML = `
        <div class="beam top"></div>
        <div class="bead U ${digit.U ? 'on' : ''}"></div>
        <div class="bar"></div>
        <div class="rack">
          ${Array.from({ length: 5 })
            .map((_, i) => `<div class="bead L ${i < digit.L ? 'on' : ''}" data-i="${i}"></div>`)
            .join('')}
        </div>
        <div class="beam bottom"></div>
      `;
      this.root.appendChild(col);
      return col;
    });
  }

  setSpeed(ms) {
    this.speed = ms;
  }

  render() {
    this.model.cols.forEach((digit, index) => {
      this.columns[index]
        .querySelector('.bead.U')
        ?.classList.toggle('on', digit.U === 1);
      const beads = this.columns[index].querySelectorAll('.bead.L');
      beads.forEach((bead, position) => {
        bead.classList.toggle('on', position < digit.L);
      });
    });
  }

  async playStep(step) {
    const ok = this.model.applyStep(step);
    if (!ok) throw new Error('illegal step');
    const columnElement = this.columns[step.col];
    if (step.type.startsWith('U')) {
      columnElement.querySelector('.bead.U')?.classList.toggle('on');
    } else {
      const beads = columnElement.querySelectorAll('.bead.L');
      const L = this.model.cols[step.col].L;
      beads.forEach((bead, position) => {
        bead.classList.toggle('on', position < L);
      });
    }
    await new Promise((resolve) => setTimeout(resolve, this.speed));
  }

  async play(sequence) {
    for (const step of sequence) {
      await this.playStep(step);
    }
  }
}
