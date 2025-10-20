/*
  MindWorld School — Абакус (Соробан)
  Чистый JS + SVG. Без React.
  Особенности:
    • До 23 разрядов
    • Цифры над стойками (опционально)
    • Точки каждые 4 разряда с учетом decimalOffset
    • Кнопка Сброс
    • Полная рамка (вертикальные стойки слева и справа)
    • Адаптивное масштабирование по ширине контейнера (без горизонтального скролла)
    • Поддержка touch-событий
*/

class Abacus {
  constructor(container, {
    digitCount = 10,
    decimalOffset = 0,
    showNumbers = true
  } = {}){
    this.container = container;
    this.digitCount = Math.min(Math.max(digitCount, 2), 23);
    this.decimalOffset = Math.max(0, decimalOffset|0); // количество цифр после запятой
    this.showNumbers = !!showNumbers;

    // геометрия
    this.colWidth = 72;
    this.marginX = 10;
    this.frameTop = 10;
    this.frameBottom = 264;
    this.svgHeight = 300;

    // состояние
    this.beads = {}; // { col: { heaven:'up'|'down', earth:['up'|'down', ...4] } }
    this.dragging = null;
    this.dragStartY = null;

    // хост для масштабирования
    this.scaleHost = document.createElement('div');
    this.scaleHost.className = 'abacus-scale-host';
    this.container.innerHTML = '';
    this.container.appendChild(this.scaleHost);

    this.initState();
    this.render();
    this.attachEvents();

    // resize
    this.resizeObserver = new ResizeObserver(() => this.applyScaleToFit());
    this.resizeObserver.observe(this.container);
    window.addEventListener('orientationchange', () => this.applyScaleToFit());
    setTimeout(() => this.applyScaleToFit(), 0);
  }

  initState(){
    this.beads = {};
    for (let col = 0; col < this.digitCount; col++){
      this.beads[col] = {
        heaven: 'up',
        earth: ['down', 'down', 'down', 'down']
      };
    }
  }

  // ============== Рендер ==============

  computeSvgWidth(){
    return this.digitCount * this.colWidth + (this.marginX * 2) + 20; // +20 ширина рамки
  }

  render(){
    const width = this.computeSvgWidth();

    this.scaleHost.innerHTML = `
      <svg id="abacus-svg" width="${width}" height="${this.svgHeight}" style="user-select:none; -webkit-tap-highlight-color: transparent;">
        ${this.renderDefs()}
        ${this.renderFrame(width)}
        ${this.renderRods()}
        ${this.renderMiddleBar(width)}
        ${this.renderBeadsAndNumbers()}
      </svg>
    `;

    this.svgEl = this.scaleHost.querySelector('#abacus-svg');
    this.applyScaleToFit();
    this.updateTotalValue();
  }

  renderDefs(){
    return `
      <defs>
        <filter id="beadShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
          <feOffset dx="0" dy="3" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.6"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <filter id="frameShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
          <feOffset dx="0" dy="4" result="offsetblur"/>
          <feComponentTransfer><feFuncA type="linear" slope="0.5"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a8824d" />
          <stop offset="50%" stop-color="#7d733a" />
          <stop offset="100%" stop-color="#5f5630" />
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

  renderFrame(width){
    // верх/низ + боковые стойки
    const leftX = this.marginX;
    const rightX = width - this.marginX - 10;
    return `
      <!-- Верхняя перекладина -->
      <rect x="${leftX}" y="${this.frameTop}" width="${width - this.marginX*2}" height="30" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <rect x="${leftX+5}" y="${this.frameTop+3}" width="${width - this.marginX*2 - 10}" height="4" fill="rgba(255,255,255,0.12)" rx="2"/>

      <!-- Нижняя перекладина -->
      <rect x="${leftX}" y="${this.frameBottom}" width="${width - this.marginX*2}" height="30" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <rect x="${leftX+5}" y="${this.frameBottom+3}" width="${width - this.marginX*2 - 10}" height="4" fill="rgba(255,255,255,0.12)" rx="2"/>

      <!-- Левая стойка -->
      <rect x="${leftX}" y="${this.frameTop+30}" width="10" height="${this.frameBottom - (this.frameTop+30)}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
      <!-- Правая стойка -->
      <rect x="${rightX}" y="${this.frameTop+30}" width="10" height="${this.frameBottom - (this.frameTop+30)}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5"/>
    `;
  }

  renderRods(){
    let rods = '';
    for (let col = 0; col < this.digitCount; col++){
      const x = this.marginX + 30 + col * this.colWidth; // 30 = отступ от левого борта до первой стойки
      rods += `<line x1="${x}" y1="40" x2="${x}" y2="${this.frameBottom}" stroke="#654321" stroke-width="8"/>`;
    }
    return rods;
  }

  renderMiddleBar(width){
    // сама планка
    let html = `
      <rect x="${this.marginX}" y="91" width="${width - this.marginX*2}" height="10" fill="url(#metalBarGradient)" rx="2"/>
      <rect x="${this.marginX+5}" y="92" width="${width - this.marginX*2 - 10}" height="2" fill="rgba(255,255,255,0.6)" rx="1"/>
      <rect x="${this.marginX}" y="101" width="${width - this.marginX*2}" height="2" fill="rgba(0,0,0,0.3)" rx="1"/>
    `;

    // точки каждые 4 разряда с учетом decimalOffset
    let dots = '';
    for (let col = 0; col < this.digitCount; col++){
      const fromRight = this.digitCount - 1 - col;
      if (((fromRight - this.decimalOffset) % 4 + 4) % 4 === 0){ // безопасно для отрицательных
        const x = this.marginX + 30 + col * this.colWidth;
        dots += `<circle cx="${x}" cy="96" r="3" fill="#7d733a" />`;
      }
    }
    html += dots;
    return html;
  }

  renderBeadsAndNumbers(){
    let html = '';

    for (let col = 0; col < this.digitCount; col++){
      const x = this.marginX + 30 + col * this.colWidth;
      const beadH = 36;
      const beadW = 32;
      const gap = 1;

      // небесная
      const heavenDown = this.beads[col].heaven === 'down';
      const heavenY = heavenDown ? 91 - beadH/2 - gap : 40 + beadH/2 + gap;

      // земные
      const earth = this.beads[col].earth;
      const upCount = earth.filter(p => p === 'up').length;
      const downCount = 4 - upCount;

      // позиции для 4 нижних
      const earthY = earth.map((p, idx) => {
        if (p === 'up'){
          const activeIndex = earth.slice(0, idx).filter(v => v === 'up').length;
          return 101 + beadH/2 + gap + activeIndex * beadH;
        } else {
          const inactiveIndex = earth.slice(0, idx).filter(v => v === 'down').length;
          return this.frameBottom - beadH/2 - gap - (downCount - 1 - inactiveIndex) * beadH;
        }
      });

      // цифры над стойкой
      if (this.showNumbers){
        const colVal = this.getColumnValue(col);
        html += `<text x="${x}" y="26" text-anchor="middle" fill="#7d733a" font-size="16" font-weight="700">${colVal}</text>`;
      }

      // небесная бусина
      html += this.beadPath(x, heavenY, beadW, beadH, col, 'heaven', 0);

      // нижние бусины
      for (let i = 0; i < 4; i++){
        html += this.beadPath(x, earthY[i], beadW, beadH, col, 'earth', i);
      }
    }

    return html;
  }

  beadPath(x, y, width, height, col, type, index){
    const hw = width;
    const hh = height/2;
    const cut = 12;
    const sideR = 2;

    const d = `
      M ${x - cut} ${y - hh}
      L ${x + cut} ${y - hh}
      Q ${x + cut + 2} ${y - hh + 2} ${x + hw - sideR} ${y - sideR}
      Q ${x + hw} ${y} ${x + hw - sideR} ${y + sideR}
      Q ${x + cut + 2} ${y + hh - 2} ${x + cut} ${y + hh}
      L ${x - cut} ${y + hh}
      Q ${x - cut - 2} ${y + hh - 2} ${x - hw + sideR} ${y + sideR}
      Q ${x - hw} ${y} ${x - hw + sideR} ${y - sideR}
      Q ${x - cut - 2} ${y - hh + 2} ${x - cut} ${y - hh}
      Z
    `;

    return `
      <g class="bead" data-col="${col}" data-type="${type}" data-index="${index}" style="cursor: grab;">
        <path d="${d}" fill="url(#beadGradient)" filter="url(#beadShadow)"/>
        <line x1="${x - width}" y1="${y}" x2="${x + width}" y2="${y}" stroke="rgba(0,0,0,0.075)" stroke-width="2"/>
      </g>
    `;
  }

  // ============== События ==============

  attachEvents(){
    const svg = () => this.svgEl;
    if (!svg()) return;

    // mouse
    svg().addEventListener('mousedown', (e) => this.onPointerDown(e));
    document.addEventListener('mousemove', (e) => this.onPointerMove(e));
    document.addEventListener('mouseup', () => this.onPointerUp());

    // touch
    svg().addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]){
        this.onPointerDown(e.touches[0], e);
      }
    }, {passive:false});
    document.addEventListener('touchmove', (e) => {
      if (this.dragging && e.touches && e.touches[0]){
        e.preventDefault();
        this.onPointerMove(e.touches[0]);
      }
    }, {passive:false});
    document.addEventListener('touchend', () => this.onPointerUp());
  }

  getSvgRect(){
    return this.svgEl.getBoundingClientRect();
  }

  onPointerDown(e, originalEvent){
    const target = e.target.closest('.bead');
    if (!target) return;
    const col = parseInt(target.dataset.col, 10);
    const type = target.dataset.type;
    const index = parseInt(target.dataset.index, 10);

    const rect = this.getSvgRect();
    this.dragStartY = e.clientY - rect.top;
    this.dragging = { col, type, index };
    if (originalEvent) originalEvent.preventDefault();
  }

  onPointerMove(e){
    if (!this.dragging || this.dragStartY === null) return;

    const rect = this.getSvgRect();
    const y = e.clientY - rect.top;
    const deltaY = y - this.dragStartY;
    const threshold = 10;

    const col = this.dragging.col;

    if (this.dragging.type === 'heaven'){
      if (deltaY > threshold && this.beads[col].heaven !== 'down'){
        this.beads[col].heaven = 'down';
        this.render();
      } else if (deltaY < -threshold && this.beads[col].heaven !== 'up'){
        this.beads[col].heaven = 'up';
        this.render();
      }
    } else {
      const earth = [...this.beads[col].earth];
      let changed = false;
      if (deltaY < -threshold){
        for (let i = 0; i <= this.dragging.index; i++){
          if (earth[i] !== 'up'){ earth[i] = 'up'; changed = true; }
        }
      } else if (deltaY > threshold){
        for (let i = this.dragging.index; i < 4; i++){
          if (earth[i] !== 'down'){ earth[i] = 'down'; changed = true; }
        }
      }
      if (changed){
        this.beads[col].earth = earth;
        this.render();
      }
    }
  }

  onPointerUp(){
    this.dragging = null;
    this.dragStartY = null;
  }

  // ============== API ==============

  getColumnValue(col){
    if (!this.beads[col]) return 0;
    let val = 0;
    if (this.beads[col].heaven === 'down') val += 5;
    this.beads[col].earth.forEach(p => { if (p === 'up') val += 1; });
    return val;
  }

  getTotalValue(){
    let total = 0;
    for (let col = 0; col < this.digitCount; col++){
      const multiplier = Math.pow(10, this.digitCount - col - 1);
      total += this.getColumnValue(col) * multiplier;
    }
    return total;
  }

  updateTotalValue(){
    const el = document.getElementById('totalValue');
    if (el) el.textContent = this.getTotalValue().toString();
  }

  reset(){
    for (let col = 0; col < this.digitCount; col++){
      this.beads[col].heaven = 'up';
      this.beads[col].earth = ['down','down','down','down'];
    }
    this.render();
  }

  setDigitCount(n){
    this.digitCount = Math.min(Math.max(n|0, 2), 23);
    // сохранить правую часть при изменении разрядности
    const prev = this.beads;
    this.initState();
    // переносим значения с правого края (младшие разряды должны сохраниться визуально)
    const copyFromRight = Math.min(Object.keys(prev).length, this.digitCount);
    for (let i = 0; i < copyFromRight; i++){
      const srcCol = Object.keys(prev).length - 1 - i;
      const dstCol = this.digitCount - 1 - i;
      this.beads[dstCol] = JSON.parse(JSON.stringify(prev[srcCol]));
    }
    this.render();
  }

  setDecimalOffset(n){
    this.decimalOffset = Math.max(0, n|0);
    this.render();
  }

  setShowNumbers(flag){
    this.showNumbers = !!flag;
    this.render();
  }

  // ============== Масштабирование ==============

  applyScaleToFit(){
    if (!this.svgEl) return;
    const desiredW = this.computeSvgWidth();
    const host = this.scaleHost;
    const containerW = this.container.clientWidth || 1;
    const scale = Math.min(1, containerW / desiredW);
    host.style.transform = `scale(${scale})`;
    // важно: чтобы контейнер занимал место по высоте после скейла
    const scaledHeight = this.svgHeight * scale;
    host.style.height = `${this.svgHeight}px`; // реальная высота содержимого (до scale)
    this.container.style.height = `${scaledHeight}px`;
  }
}

// ======== Инициализация страницы ========
(function(){
  const container = document.getElementById('abacusContainer');
  const abacus = new Abacus(container, { digitCount: 10, decimalOffset: 0, showNumbers: true });

  // controls
  const digitsRange = document.getElementById('digits');
  const digitsVal = document.getElementById('digitsVal');
  const decimalSel = document.getElementById('decimal');
  const showNumbers = document.getElementById('showNumbers');
  const resetBtn = document.getElementById('resetBtn');

  digitsRange.addEventListener('input', () => {
    digitsVal.textContent = digitsRange.value;
    abacus.setDigitCount(parseInt(digitsRange.value, 10));
  });

  decimalSel.addEventListener('change', () => {
    abacus.setDecimalOffset(parseInt(decimalSel.value, 10));
  });

  showNumbers.addEventListener('change', () => {
    abacus.setShowNumbers(!!showNumbers.checked);
  });

  resetBtn.addEventListener('click', () => abacus.reset());

  // доступ наружу для отладки
  window._abacus = abacus;
})();
