/**
 * AbacusFinalFixedV6.js — Полная самодостаточная версия
 * - 1..23 разрядов (по умолчанию 10)
 * - Десятичная запятая (decimalOffset) и точки каждые 4 разряда (цвет рамки)
 * - Цифры над столбцами (showDigits)
 * - Адаптивная ширина: без горизонтального скролла (<= 97% ширины контейнера)
 * - Перетаскивание: mouse + touch
 * - Увеличенная геометрия (~+20%) относительно базовой
 * - Кнопка «Сброс» снаружи вызывает abacus.reset()
 */

export class Abacus {
  /**
   * @param {HTMLElement} container
   * @param {{digitCount?:number, decimalOffset?:number, showDigits?:boolean, onChange?:(value:number, columns:number[])=>void}} [options]
   */
  constructor(container, options = {}) {
    if (!container) throw new Error('Container element is required for Abacus.');
    this.container = container;

    // ===== Options
    this.requestedDigitCount = this.#clampDigitCount(options.digitCount ?? 10);
    this.digitCount = this.requestedDigitCount;
    this.decimalOffset = Math.max(0, Math.round(options.decimalOffset ?? 0));
    this.showDigits = options.showDigits !== false;
    this.onChange = typeof options.onChange === 'function' ? options.onChange : null;

    // ===== Theme (цвета/толщины)
    this.theme = {
      woodTopGradientStart: '#A0522D',
      woodTopGradientMid:   '#8B4513', // !!! используется и для точек
      woodTopGradientEnd:   '#6B3410',
      metalStart:  '#949494',
      metalMid1:   '#ababab',
      metalMid2:   '#757575',
      metalMid3:   '#8c8c8c',
      metalEnd:    '#606060',
      beadInner:   '#ffb366',
      beadMain:    '#ff7c00',
      beadEdge:    '#cc6300',
      rodColor:    '#654321',
      digitsColor: '#7d733a',
      rodWidth:    8
    };

    // ===== Geometry (~+20%)
    this.columnSpacing = 113;  // было ~94 (+20%)
    this.columnStart = 50;
    this.columnEndPadding = 95; // увеличено
    this.beadHeight = 56;       // было ~47 (+20%)
    this.beadWidth = 50;        // было ~42 (+20%)
    this.gapFromBar = 4;        // было 3 (+)
    this.currentOffsetY = this.showDigits ? 50 : 20;

    // Базовые метрики (вертикаль)
    this.metrics = {
      baseTopFrameY: 10,
      baseBottomFrameY: 264,
      topFrameHeight: 30,
      bottomFrameHeight: 30,
      middleBarTop: 91,
      middleBarLightY: 92,
      middleBarShadowY: 101,
      columnTopBase: 40,
      earthActiveBase: 138  // подняли нижние активные бусины (пропорция)
    };

    // Высота SVG (увеличена)
    this.svgHeight =
      this.metrics.baseBottomFrameY + 130 + this.metrics.bottomFrameHeight + 40;

    // ===== State
    this.beads = [];         // [{ heaven:'up'|'down', earth:['up'|'down',...4] }]
    this.dragging = null;    // { col, type:'heaven'|'earth', index }
    this.dragStartY = null;
    this.resizeObserver = null;

    // ===== SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('class', 'abacus-svg');
    this.svg.setAttribute('height', this.svgHeight);
    this.svg.setAttribute('role', 'presentation');
    this.container.innerHTML = '';
    this.container.appendChild(this.svg);

    // ===== Init
    this.#initState();
    this.#attachEventListeners();
    this.#setupAdaptiveResize();
    this.#render();
  }

  // ================= Public API =================

  /** Подписка на изменения */
  setOnChange(cb) { this.onChange = typeof cb === 'function' ? cb : null; this.#emitChange(); }

  /** Установить количество разрядов (1..23) с адаптивным пересчётом */
  setDigitCount(n) {
    const clamped = this.#clampDigitCount(n);
    if (clamped === this.requestedDigitCount) return;
    this.requestedDigitCount = clamped;
    this.#updateAdaptiveDigitCount();
    if (this.decimalOffset > this.digitCount - 1) this.decimalOffset = Math.max(0, this.digitCount - 1);
    this.#render();
    this.#emitChange();
  }

  /** Установить десятичный сдвиг (0..digitCount-1) */
  setDecimalOffset(n) {
    const max = Math.max(0, this.digitCount - 1);
    const clamped = Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
    if (clamped === this.decimalOffset) return;
    this.decimalOffset = clamped;
    this.#render();
    this.#emitChange();
  }

  /** Показать/скрыть цифры над разрядами */
  setShowDigits(show) {
    const val = !!show;
    if (val === this.showDigits) return;
    this.showDigits = val;
    this.#render();
    this.#emitChange();
  }

  /** Сбросить все бусины в ноль */
  reset() {
    for (let col = 0; col < this.digitCount; col++) {
      const c = this.beads[col];
      c.heaven = 'up';
      c.earth = ['down','down','down','down'];
    }
    this.#render();
    this.#emitChange();
  }

  /** Значение столбца (0..9) */
  getColumnValue(col) {
    const c = this.beads[col];
    if (!c) return 0;
    let v = c.heaven === 'down' ? 5 : 0;
    c.earth.forEach(p => { if (p === 'up') v += 1; });
    return v;
  }

  /** Значение всего абакуса как целого числа */
  getValue() {
    let total = 0;
    for (let col = 0; col < this.digitCount; col++) {
      const mul = Math.pow(10, this.digitCount - col - 1);
      total += this.getColumnValue(col) * mul;
    }
    return total;
  }

  // ================= Internal =================

  #clampDigitCount(n) {
    const x = Math.round(Number(n) || 0);
    return Math.max(1, Math.min(23, x));
  }

  #initState() {
    this.beads = Array.from({ length: this.digitCount }, () => ({
      heaven: 'up',
      earth: ['down', 'down', 'down', 'down']
    }));
  }

  #setupAdaptiveResize() {
    this.resizeObserver = new ResizeObserver(() => this.#updateAdaptiveDigitCount());
    this.resizeObserver.observe(this.container);
  }

  #calculateSvgWidth(d) {
    if (!d) return 0;
    return this.columnStart + (d - 1) * this.columnSpacing + this.columnEndPadding;
  }

  /** Без горизонтального скролла: вписываемся <= 97% ширины контейнера */
  #updateAdaptiveDigitCount() {
    const containerWidth = this.container.clientWidth || 0;
    const requiredWidth = this.#calculateSvgWidth(this.requestedDigitCount);

    if (requiredWidth <= containerWidth * 0.97) {
      if (this.digitCount !== this.requestedDigitCount) {
        this.digitCount = this.requestedDigitCount;
        this.#initState();
        this.#render();
        this.#emitChange();
      }
      return;
    }

    let best = 1;
    for (let d = 1; d <= this.requestedDigitCount; d++) {
      if (this.#calculateSvgWidth(d) <= containerWidth * 0.97) best = d;
      else break;
    }
    if (best !== this.digitCount) {
      this.digitCount = best;
      this.#initState();
      this.#render();
      this.#emitChange();
    }
  }

  #attachEventListeners() {
    // Mouse
    this.svg.addEventListener('mousedown', (e) => this.#handlePointerDown(e, e));
    window.addEventListener('mousemove', (e) => this.#handlePointerMove(e, e));
    window.addEventListener('mouseup', () => this.#handlePointerUp());
    // Touch
    this.svg.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) this.#handlePointerDown(e.touches[0], e);
    }, { passive: false });
    window.addEventListener('touchmove', (e) => {
      if (this.dragging && e.touches && e.touches[0]) {
        e.preventDefault();
        this.#handlePointerMove(e.touches[0], e);
      }
    }, { passive: false });
    window.addEventListener('touchend', () => this.#handlePointerUp());
    window.addEventListener('touchcancel', () => this.#handlePointerUp());
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

    originalEvent?.preventDefault?.();
  }

  #handlePointerMove(pointer, originalEvent) {
    if (!this.dragging) return;
    const rect = this.svg.getBoundingClientRect();
    const y = pointer.clientY - rect.top;
    const delta = y - this.dragStartY;
    const T = 8;

    const colIdx = this.dragging.col;
    const column = this.beads[colIdx];
    if (!column) return;

    if (this.dragging.type === 'heaven') {
      if (delta > T && column.heaven !== 'down') {
        column.heaven = 'down';
        this.dragStartY = y;
        this.#render();
        this.#emitChange();
      } else if (delta < -T && column.heaven !== 'up') {
        column.heaven = 'up';
        this.dragStartY = y;
        this.#render();
        this.#emitChange();
      }
    } else {
      const earth = [...column.earth];
      let changed = false;
      if (delta < -T) {
        for (let i = 0; i <= this.dragging.index; i++) {
          if (earth[i] !== 'up') { earth[i] = 'up'; changed = true; }
        }
      } else if (delta > T) {
        for (let i = this.dragging.index; i < earth.length; i++) {
          if (earth[i] !== 'down') { earth[i] = 'down'; changed = true; }
        }
      }
      if (changed) {
        column.earth = earth;
        this.dragStartY = y;
        this.#render();
        this.#emitChange();
      }
    }
    originalEvent?.preventDefault?.();
  }

  #handlePointerUp() { this.dragging = null; this.dragStartY = null; }

  #emitChange() {
    if (typeof this.onChange === 'function') {
      const columns = Array.from({ length: this.digitCount }, (_, i) => this.getColumnValue(i));
      this.onChange(this.getValue(), columns);
    }
  }

  // ================= Render =================

  #render() {
    const width = this.#calculateSvgWidth(this.digitCount);
    this.svg.setAttribute('width', width);
    this.currentOffsetY = this.showDigits ? 50 : 20;

    const topY = this.metrics.baseTopFrameY + this.currentOffsetY;
    const botY = this.metrics.baseBottomFrameY + this.currentOffsetY;

    const defs = this.#renderDefs();
    const frame = this.#renderFrame(width, topY, botY);
    const rods = this.#renderRods(topY, botY);
    const middle = this.#renderMiddleBar(width);
    const dots = this.#renderDecimalDots();
    const labels = this.#renderColumnLabels(topY);
    const beads = this.#renderBeads();

    this.svg.innerHTML = `${defs}${frame}${rods}${middle}${dots}${labels}${beads}`;
  }

  #renderDefs() {
    return `
      <defs>
        <filter id="beadShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <filter id="frameShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${this.theme.woodTopGradientStart}" />
          <stop offset="50%" stop-color="${this.theme.woodTopGradientMid}" />
          <stop offset="100%" stop-color="${this.theme.woodTopGradientEnd}" />
        </linearGradient>

        <linearGradient id="metalBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${this.theme.metalStart}" />
          <stop offset="30%" stop-color="${this.theme.metalMid1}" />
          <stop offset="50%" stop-color="${this.theme.metalMid2}" />
          <stop offset="70%" stop-color="${this.theme.metalMid3}" />
          <stop offset="100%" stop-color="${this.theme.metalEnd}" />
        </linearGradient>

        <radialGradient id="beadGradient" cx="45%" cy="40%">
          <stop offset="0%" stop-color="${this.theme.beadInner}" />
          <stop offset="50%" stop-color="${this.theme.beadMain}" />
          <stop offset="100%" stop-color="${this.theme.beadEdge}" />
        </radialGradient>
      </defs>
    `;
  }

  #renderFrame(width, topY, botY) {
    const fw = width - 20;
    const leftBarY = topY + this.metrics.topFrameHeight;
    const verticalH = botY - leftBarY;
    return `
      <!-- Top frame -->
      <rect x="10" y="${topY}" width="${fw}" height="${this.metrics.topFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${topY + 3}" width="${fw - 10}" height="4" fill="rgba(255,255,255,0.15)" rx="2" />

      <!-- Bottom frame -->
      <rect x="10" y="${botY}" width="${fw}" height="${this.metrics.bottomFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${botY + 3}" width="${fw - 10}" height="4" fill="rgba(255,255,255,0.15)" rx="2" />

      <!-- Left vertical bar -->
      <rect x="10" y="${leftBarY}" width="10" height="${verticalH}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <!-- Right vertical bar -->
      <rect x="${width - 20}" y="${leftBarY}" width="10" height="${verticalH}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
    `;
  }

  #renderRods(topY, botY) {
    const y1 = topY + this.metrics.topFrameHeight;
    const y2 = botY;
    let out = '';
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      out += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${this.theme.rodColor}" stroke-width="${this.theme.rodWidth}" />`;
    }
    return out;
  }

  #renderMiddleBar(width) {
    const barTop   = this.metrics.middleBarTop + this.currentOffsetY;
    const barLight = this.metrics.middleBarLightY + this.currentOffsetY;
    const barShadow= this.metrics.middleBarShadowY + this.currentOffsetY;
    const fw = width - 20;
    return `
      <rect x="10" y="${barTop}" width="${fw}" height="10" fill="url(#metalBarGradient)" rx="2" />
      <rect x="15" y="${barLight}" width="${fw - 10}" height="2" fill="rgba(255,255,255,0.6)" rx="1" />
      <rect x="10" y="${barShadow}" width="${fw}" height="2" fill="rgba(0,0,0,0.3)" rx="1" />
    `;
  }

  #renderDecimalDots() {
    const y = this.metrics.middleBarTop + this.currentOffsetY + 5;
    const unitsIndex = this.digitCount - this.decimalOffset - 1;
    let out = '';
    for (let col = 0; col < this.digitCount; col++) {
      const rel = unitsIndex - col;
      if (rel < 0) continue;
      if (rel % 4 !== 0) continue;
      const x = this.columnStart + col * this.columnSpacing;
      out += `<circle cx="${x}" cy="${y}" r="3" fill="${this.theme.woodTopGradientMid}" />`;
    }
    return out;
  }

  #renderColumnLabels(topY) {
    if (!this.showDigits) return '';
    const y = topY - 22;
    let out = '';
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      out += `
        <text
          x="${x}"
          y="${y}"
          fill="${this.theme.digitsColor}"
          font-family="'Montserrat','Baloo 2',sans-serif"
          font-size="32"
          font-weight="600"
          text-anchor="middle"
          dominant-baseline="middle"
        >${this.getColumnValue(col)}</text>`;
    }
    return out;
  }

  #renderBeads() {
    let groups = '';
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      const c = this.beads[col];
      const h = this.beadHeight;
      const w = this.beadWidth;
      const g = this.gapFromBar;

      // Heaven bead position
      const heavenY = (c.heaven === 'down')
        ? (this.metrics.middleBarTop + this.currentOffsetY - h / 2 - g)
        : (this.metrics.columnTopBase + this.currentOffsetY + h / 2 + g);

      // Earth beads positions
      const upCount = c.earth.filter(p => p === 'up').length;
      const downCount = 4 - upCount;

      const positions = c.earth.map((p, idx) => {
        if (p === 'up') {
          const activeIndex = c.earth.slice(0, idx).filter(v => v === 'up').length;
          return this.metrics.earthActiveBase + this.currentOffsetY + h / 2 + g + activeIndex * h;
        } else {
          const inactiveIndex = c.earth.slice(0, idx).filter(v => v === 'down').length;
          return this.metrics.baseBottomFrameY + this.currentOffsetY - h / 2 - g - (downCount - 1 - inactiveIndex) * h;
        }
      });

      const heaven = this.#renderBead(x, heavenY, w, h, col, 'heaven', 0);
      const earth = positions.map((y, i) => this.#renderBead(x, y, w, h, col, 'earth', i)).join('');
      groups += `<g>${heaven}${earth}</g>`;
    }
    return groups;
  }

  #renderBead(x, y, width, height, col, type, index) {
    const hh = height / 2;
    const cut = 12;
    const side = 2;
    const path = `
      M ${x - cut} ${y - hh}
      L ${x + cut} ${y - hh}
      Q ${x + cut + 2} ${y - hh + 2} ${x + width - side} ${y - side}
      Q ${x + width} ${y} ${x + width - side} ${y + side}
      Q ${x + cut + 2} ${y + hh - 2} ${x + cut} ${y + hh}
      L ${x - cut} ${y + hh}
      Q ${x - cut - 2} ${y + hh - 2} ${x - width + side} ${y + side}
      Q ${x - width} ${y} ${x - width + side} ${y - side}
      Q ${x - cut - 2} ${y - hh + 2} ${x - cut} ${y - hh}
      Z`;
    return `
      <g data-role="bead" data-col="${col}" data-type="${type}" data-index="${index}" style="cursor: grab;">
        <path d="${path}" fill="url(#beadGradient)" filter="url(#beadShadow)" />
        <line x1="${x - width}" y1="${y}" x2="${x + width}" y2="${y}" stroke="rgba(0,0,0,0.075)" stroke-width="2" />
      </g>
    `;
  }
}
