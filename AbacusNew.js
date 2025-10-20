/**
 * Абакус (соробан) с интерактивным управлением на чистом JavaScript + SVG.
 * Поддерживает до 23 разрядов, точки на средней планке и отображение
 * текущего значения каждого столбца.
 */
export class Abacus {
  /**
   * @param {HTMLElement} container
   * @param {{digitCount?: number, decimalOffset?: number}} [options]
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error('Container element is required for Abacus.');
    }

    this.container = container;
    this.digitCount = this.#clampDigitCount(options.digitCount ?? 2);
    this.decimalOffset = 0;
    this.columnSpacing = 72;
    this.columnStart = 50;
    this.columnEndPadding = 62;
    this.beadHeight = 36;
    this.beadWidth = 32;
    this.gapFromBar = 2;

    this.metrics = {
      baseTopFrameY: 10,
      baseBottomFrameY: 264,
      topFrameHeight: 30,
      bottomFrameHeight: 30,
      middleBarTop: 91,
      middleBarLightY: 92,
      middleBarShadowY: 101,
      columnTopBase: 40,
      earthActiveBase: 101
    };

    this.offsetY = 40; // дополнительное пространство сверху для цифр

    this.svgHeight =
      this.metrics.baseBottomFrameY +
      this.offsetY +
      this.metrics.bottomFrameHeight +
      40;

    this.dragging = null;
    this.dragStartY = null;
    this.onChange = null;

    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'abacus-svg');
    this.svg.setAttribute('height', this.svgHeight);
    this.svg.setAttribute('role', 'presentation');
    this.container.innerHTML = '';
    this.container.appendChild(this.svg);

    this.#initState();
    this.setDecimalOffset(options.decimalOffset ?? 0);
    this.#attachEventListeners();
    this.#render();
  }

  /**
   * Привязка внешнего обработчика изменений.
   * @param {(value: number, columns: number[]) => void} callback
   */
  setOnChange(callback) {
    this.onChange = typeof callback === 'function' ? callback : null;
    this.#emitChange();
  }

  /**
   * Установить количество разрядов (2-23).
   * @param {number} count
   */
  setDigitCount(count) {
    const clamped = this.#clampDigitCount(count);
    if (clamped === this.digitCount) return;

    this.digitCount = clamped;
    this.#initState();

    if (this.decimalOffset > this.digitCount - 1) {
      this.decimalOffset = this.digitCount - 1;
    }

    this.#render();
    this.#emitChange();
  }

  /**
   * Возвращает значение всего абакуса.
   * @returns {number}
   */
  getValue() {
    let total = 0;
    for (let col = 0; col < this.digitCount; col++) {
      const multiplier = Math.pow(10, this.digitCount - col - 1);
      total += this.getColumnValue(col) * multiplier;
    }
    return total;
  }

  /**
   * Возвращает значение конкретной стойки.
   * @param {number} colIndex
   * @returns {number}
   */
  getColumnValue(colIndex) {
    const column = this.beads[colIndex];
    if (!column) return 0;

    let value = column.heaven === 'down' ? 5 : 0;
    column.earth.forEach((pos) => {
      if (pos === 'up') value += 1;
    });
    return value;
  }

  /**
   * Установить значение (с автоматическим распределением по столбцам).
   * @param {number} value
   */
  setValue(value) {
    const digits = String(Math.max(0, Number(value) || 0))
      .padStart(this.digitCount, '0')
      .split('');

    digits.forEach((digit, index) => {
      const num = parseInt(digit, 10);
      if (!Number.isFinite(num)) return;

      const column = this.beads[index];
      if (!column) return;

      if (num >= 5) {
        column.heaven = 'down';
        const remainder = num - 5;
        column.earth = [
          remainder >= 1 ? 'up' : 'down',
          remainder >= 2 ? 'up' : 'down',
          remainder >= 3 ? 'up' : 'down',
          remainder >= 4 ? 'up' : 'down'
        ];
      } else {
        column.heaven = 'up';
        column.earth = [
          num >= 1 ? 'up' : 'down',
          num >= 2 ? 'up' : 'down',
          num >= 3 ? 'up' : 'down',
          num >= 4 ? 'up' : 'down'
        ];
      }
    });

    this.#render();
    this.#emitChange();
  }

  /** Сбросить абакус. */
  reset() {
    this.#initState();
    this.#render();
    this.#emitChange();
  }

  /**
   * Установить смещение десятичной точки (0 — после крайнего правого столбца).
   * @param {number} offset
   */
  setDecimalOffset(offset) {
    const maxOffset = Math.max(0, this.digitCount - 1);
    const clamped = Math.max(0, Math.min(maxOffset, Math.round(Number(offset) || 0)));
    if (clamped === this.decimalOffset) return;

    this.decimalOffset = clamped;
    this.#render();
    this.#emitChange();
  }

  /**
   * Внутренние методы
   */

  #clampDigitCount(count) {
    const num = Math.round(Number(count) || 0);
    return Math.max(2, Math.min(23, num));
  }

  #initState() {
    this.beads = Array.from({ length: this.digitCount }, () => ({
      heaven: 'up',
      earth: ['down', 'down', 'down', 'down']
    }));
  }

  #attachEventListeners() {
    this.#boundMouseDown = (event) => this.#handlePointerDown(event, event);
    this.#boundMouseMove = (event) => this.#handlePointerMove(event, event);
    this.#boundMouseUp = () => this.#handlePointerUp();
    this.#boundTouchStart = (event) => {
      if (event.touches.length === 0) return;
      this.#handlePointerDown(event.touches[0], event);
    };
    this.#boundTouchMove = (event) => {
      if (!this.dragging || event.touches.length === 0) return;
      this.#handlePointerMove(event.touches[0], event);
    };
    this.#boundTouchEnd = () => this.#handlePointerUp();

    this.svg.addEventListener('mousedown', this.#boundMouseDown);
    window.addEventListener('mousemove', this.#boundMouseMove);
    window.addEventListener('mouseup', this.#boundMouseUp);

    this.svg.addEventListener('touchstart', this.#boundTouchStart, { passive: false });
    window.addEventListener('touchmove', this.#boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.#boundTouchEnd);
    window.addEventListener('touchcancel', this.#boundTouchEnd);
  }

  #handlePointerDown(pointer, originalEvent) {
    const target = pointer.target instanceof Element ? pointer.target : null;
    if (!target) return;

    const beadGroup = target.closest('[data-role="bead"]');
    if (!beadGroup) return;

    const col = Number(beadGroup.getAttribute('data-col'));
    const type = beadGroup.getAttribute('data-type');
    const index = Number(beadGroup.getAttribute('data-index'));

    const rect = this.svg.getBoundingClientRect();
    this.dragStartY = pointer.clientY - rect.top;
    this.dragging = { col, type, index };

    if (originalEvent?.preventDefault) {
      originalEvent.preventDefault();
    }
  }

  #handlePointerMove(pointer, originalEvent) {
    if (!this.dragging) return;

    const rect = this.svg.getBoundingClientRect();
    const currentY = pointer.clientY - rect.top;
    const deltaY = currentY - this.dragStartY;
    const threshold = 8;

    if (this.dragging.type === 'heaven') {
      const column = this.beads[this.dragging.col];
      if (!column) return;

      if (deltaY > threshold && column.heaven !== 'down') {
        column.heaven = 'down';
        this.dragStartY = currentY;
        this.#render();
        this.#emitChange();
      } else if (deltaY < -threshold && column.heaven !== 'up') {
        column.heaven = 'up';
        this.dragStartY = currentY;
        this.#render();
        this.#emitChange();
      }
    } else {
      const column = this.beads[this.dragging.col];
      if (!column) return;

      const earthBeads = [...column.earth];
      let changed = false;

      if (deltaY < -threshold) {
        for (let i = 0; i <= this.dragging.index; i++) {
          if (earthBeads[i] !== 'up') {
            earthBeads[i] = 'up';
            changed = true;
          }
        }
      } else if (deltaY > threshold) {
        for (let i = this.dragging.index; i < earthBeads.length; i++) {
          if (earthBeads[i] !== 'down') {
            earthBeads[i] = 'down';
            changed = true;
          }
        }
      }

      if (changed) {
        column.earth = earthBeads;
        this.dragStartY = currentY;
        this.#render();
        this.#emitChange();
      }
    }

    if (originalEvent?.preventDefault) {
      originalEvent.preventDefault();
    }
  }

  #handlePointerUp() {
    this.dragging = null;
    this.dragStartY = null;
  }

  #emitChange() {
    if (typeof this.onChange === 'function') {
      const columns = Array.from({ length: this.digitCount }, (_, col) => this.getColumnValue(col));
      this.onChange(this.getValue(), columns);
    }
  }

  #render() {
    const width = this.#getSvgWidth();
    this.svg.setAttribute('width', width);

    const topFrameY = this.metrics.baseTopFrameY + this.offsetY;
    const bottomFrameY = this.metrics.baseBottomFrameY + this.offsetY;

    const defs = this.#renderDefs();
    const frame = this.#renderFrame(width, topFrameY, bottomFrameY);
    const middleBar = this.#renderMiddleBar(width);
    const rods = this.#renderRods(topFrameY, bottomFrameY);
    const dots = this.#renderDecimalDots();
    const columnLabels = this.#renderColumnLabels(topFrameY);
    const beads = this.#renderBeads();

    this.svg.innerHTML = `${defs}${frame}${rods}${middleBar}${dots}${columnLabels}${beads}`;
  }

  #getSvgWidth() {
    if (this.digitCount === 0) return 0;
    return (
      this.columnStart +
      (this.digitCount - 1) * this.columnSpacing +
      this.columnEndPadding
    );
  }

  #renderDefs() {
    return `
      <defs>
        <filter id="beadShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.6" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="frameShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id="topFrameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#A0522D" />
          <stop offset="50%" stop-color="#8B4513" />
          <stop offset="100%" stop-color="#6B3410" />
        </linearGradient>

        <linearGradient id="metalBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#949494" />
          <stop offset="30%" stop-color="#ababab" />
          <stop offset="50%" stop-color="#757575" />
          <stop offset="70%" stop-color="#8c8c8c" />
          <stop offset="100%" stop-color="#606060" />
        </linearGradient>

        <radialGradient id="beadGradient" cx="45%" cy="40%">
          <stop offset="0%" stop-color="#ffb366" />
          <stop offset="50%" stop-color="#ff7c00" />
          <stop offset="100%" stop-color="#cc6300" />
        </radialGradient>
      </defs>
    `;
  }

  #renderFrame(width, topFrameY, bottomFrameY) {
    const frameWidth = width - 20;
    const sideWidth = 18;
    const verticalHeight =
      bottomFrameY - (topFrameY + this.metrics.topFrameHeight);

    return `
      <rect x="10" y="${topFrameY}" width="${frameWidth}" height="${this.metrics.topFrameHeight}" fill="url(#topFrameGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${topFrameY + 3}" width="${frameWidth - 10}" height="4" fill="rgba(255, 255, 255, 0.15)" rx="2" />

      <rect x="10" y="${bottomFrameY}" width="${frameWidth}" height="${this.metrics.bottomFrameHeight}" fill="url(#topFrameGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${bottomFrameY + 3}" width="${frameWidth - 10}" height="4" fill="rgba(255, 255, 255, 0.15)" rx="2" />

      <rect x="10" y="${topFrameY + this.metrics.topFrameHeight}" width="${sideWidth}" height="${verticalHeight}" fill="url(#topFrameGradient)" />
      <rect x="${width - sideWidth - 10}" y="${topFrameY + this.metrics.topFrameHeight}" width="${sideWidth}" height="${verticalHeight}" fill="url(#topFrameGradient)" />
    `;
  }

  #renderRods(topFrameY, bottomFrameY) {
    const rodTop = topFrameY + this.metrics.topFrameHeight;
    const rodBottom = bottomFrameY;

    let rods = '';
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      rods += `<line x1="${x}" y1="${rodTop}" x2="${x}" y2="${rodBottom}" stroke="#654321" stroke-width="8" />`;
    }
    return rods;
  }

  #renderMiddleBar(width) {
    const barTop = this.metrics.middleBarTop + this.offsetY;
    const barLight = this.metrics.middleBarLightY + this.offsetY;
    const barShadow = this.metrics.middleBarShadowY + this.offsetY;
    const frameWidth = width - 20;

    return `
      <rect x="10" y="${barTop}" width="${frameWidth}" height="10" fill="url(#metalBarGradient)" rx="2" />
      <rect x="15" y="${barLight}" width="${frameWidth - 10}" height="2" fill="rgba(255, 255, 255, 0.6)" rx="1" />
      <rect x="10" y="${barShadow}" width="${frameWidth}" height="2" fill="rgba(0, 0, 0, 0.3)" rx="1" />
    `;
  }

  #renderDecimalDots() {
    const dots = [];
    const centerY = this.metrics.middleBarTop + this.offsetY + 5;
    const unitsIndex = this.digitCount - this.decimalOffset - 1;

    for (let col = 0; col < this.digitCount; col++) {
      const distance = unitsIndex - col;
      if (distance < 0) continue;
      if (distance % 4 !== 0) continue;

      const x = this.columnStart + col * this.columnSpacing;
      dots.push(`<circle cx="${x}" cy="${centerY}" r="3" fill="#7d733a" />`);
    }

    return dots.join('');
  }

  #renderColumnLabels(topFrameY) {
    const labelY = topFrameY - 14;

    const labels = [];
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      const value = this.getColumnValue(col);
      labels.push(`
        <text x="${x}" y="${labelY}" fill="#7d733a" font-family="'Montserrat', 'Baloo 2', sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">${value}</text>
      `);
    }

    return labels.join('');
  }

  #renderBeads() {
    const groups = [];

    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      const column = this.beads[col];
      const beadHeight = this.beadHeight;
      const beadWidth = this.beadWidth;
      const gap = this.gapFromBar;

      const heavenActiveY =
        this.metrics.middleBarTop + this.offsetY - beadHeight / 2 - gap;
      const heavenInactiveY =
        this.metrics.columnTopBase + this.offsetY + beadHeight / 2 + gap;
      const heavenY = column.heaven === 'down' ? heavenActiveY : heavenInactiveY;

      const earthActive = column.earth;
      const upCount = earthActive.filter((p) => p === 'up').length;
      const downCount = earthActive.length - upCount;

      const earthPositions = earthActive.map((position, index) => {
        if (position === 'up') {
          const activeIndex = earthActive
            .slice(0, index)
            .filter((p) => p === 'up').length;
          return (
            this.metrics.earthActiveBase +
            this.offsetY +
            beadHeight / 2 +
            gap +
            activeIndex * beadHeight
          );
        }

        const inactiveIndex = earthActive
          .slice(0, index)
          .filter((p) => p === 'down').length;
        return (
          this.metrics.baseBottomFrameY +
          this.offsetY -
          beadHeight / 2 -
          gap -
          (downCount - 1 - inactiveIndex) * beadHeight
        );
      });

      const heavenBead = this.#renderBead(x, heavenY, beadWidth, beadHeight, col, 'heaven', 0);
      const earthBeads = earthPositions
        .map((y, index) => this.#renderBead(x, y, beadWidth, beadHeight, col, 'earth', index))
        .join('');

      groups.push(`<g>${heavenBead}${earthBeads}</g>`);
    }

    return groups.join('');
  }

  #renderBead(x, y, width, height, col, type, index) {
    const halfHeight = height / 2;
    const cutSize = 12;
    const sideRoundness = 2;

    const path = `
      M ${x - cutSize} ${y - halfHeight}
      L ${x + cutSize} ${y - halfHeight}
      Q ${x + cutSize + 2} ${y - halfHeight + 2} ${x + width - sideRoundness} ${y - sideRoundness}
      Q ${x + width} ${y} ${x + width - sideRoundness} ${y + sideRoundness}
      Q ${x + cutSize + 2} ${y + halfHeight - 2} ${x + cutSize} ${y + halfHeight}
      L ${x - cutSize} ${y + halfHeight}
      Q ${x - cutSize - 2} ${y + halfHeight - 2} ${x - width + sideRoundness} ${y + sideRoundness}
      Q ${x - width} ${y} ${x - width + sideRoundness} ${y - sideRoundness}
      Q ${x - cutSize - 2} ${y - halfHeight + 2} ${x - cutSize} ${y - halfHeight}
      Z
    `;

    return `
      <g data-role="bead" data-col="${col}" data-type="${type}" data-index="${index}" style="cursor: grab;">
        <path d="${path}" fill="url(#beadGradient)" filter="url(#beadShadow)" />
        <line x1="${x - width}" y1="${y}" x2="${x + width}" y2="${y}" stroke="rgba(0, 0, 0, 0.075)" stroke-width="2" />
      </g>
    `;
  }
}
