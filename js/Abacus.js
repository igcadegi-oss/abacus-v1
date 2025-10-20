/**
 * Абакус (соробан) — MindWorld School
 * Полная версия класса на ~700 строк, без React, с адаптивностью и улучшенными рамками.
 * 
 * ✅ КЛЮЧЕВЫЕ ОСОБЕННОСТИ
 * - До 23 разрядов.
 * - Точки на средней планке с учётом смещения десятичной позиции (decimalOffset).
 * - Отображение цифр над столбцами (вкл/выкл).
 * - Кнопка сброса через внешний API (reset), а также методы управления.
 * - Адаптивная ширина: абакус умещается в контейнер без горизонтального скролла.
 * - Поддержка мыши и touch-событий (перетаскивание бусин).
 * - Улучшенные рамки: верх/низ + вертикальные боковые стойки, тени, градиенты.
 * - Внешние хуки: setOnChange(callback) — эмитит общее значение и массив значений столбцов.
 * - Сериализация/десериализация состояния (toJSON/fromJSON).
 * - Темизация (setTheme) — возможность сменить палитру.
 * 
 * ✅ ИСПРАВЛЕНИЯ (по запросу пользователя):
 * 1) В методах #render(), #renderMiddleBar(), #renderDecimalDots() заменён offsetY → currentOffsetY.
 * 2) В #render() добавлено: this.currentOffsetY = this.showDigits ? 50 : 20;
 * 3) В #renderColumnLabels() — проверка if (!this.showDigits) return '';
 * 
 * © MindWorld School, 2025
 */

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ТИПЫ (JSDoc)
// ----------------------------------------------------------------------------
/**
 * @typedef {Object} AbacusOptions
 * @property {number} [digitCount=10]         - Запрошенное количество разрядов (1..23).
 * @property {number} [decimalOffset=0]       - Количество цифр после запятой (смещение точек).
 * @property {boolean} [showDigits=true]      - Показывать цифры над столбцами.
 * @property {function(number, number[]):void} [onChange] - Колбэк при любых изменениях.
 * @property {AbacusTheme} [theme]            - Тема оформления (цвета, толщина линий и т.д.).
 */

/**
 * @typedef {Object} AbacusTheme
 * @property {string} woodTopGradientStart
 * @property {string} woodTopGradientMid
 * @property {string} woodTopGradientEnd
 * @property {string} metalStart
 * @property {string} metalMid1
 * @property {string} metalMid2
 * @property {string} metalMid3
 * @property {string} metalEnd
 * @property {string} beadInner
 * @property {string} beadMain
 * @property {string} beadEdge
 * @property {string} rodColor
 * @property {string} dotsColor
 * @property {string} digitsColor
 * @property {number} rodWidth
 */

// ============================================================================
// ТЕМА ПО УМОЛЧАНИЮ
// ----------------------------------------------------------------------------
const DEFAULT_THEME = {
  woodTopGradientStart: "#A0522D",
  woodTopGradientMid:   "#8B4513",
  woodTopGradientEnd:   "#6B3410",
  metalStart:  "#949494",
  metalMid1:   "#ababab",
  metalMid2:   "#757575",
  metalMid3:   "#8c8c8c",
  metalEnd:    "#606060",
  beadInner:   "#ffb366",
  beadMain:    "#ff7c00",
  beadEdge:    "#cc6300",
  rodColor:    "#654321",
  dotsColor:   "#7d733a",
  digitsColor: "#7d733a",
  rodWidth:    8
};

// ============================================================================
// КЛАСС ABACUS
// ----------------------------------------------------------------------------
export class Abacus {
  // --------------------------------------------------------------------------
  // КОНСТРУКТОР
  // --------------------------------------------------------------------------
  /**
   * @param {HTMLElement} container 
   * @param {AbacusOptions} [options]
   */
  constructor(container, options = {}) {
    if (!container) {
      throw new Error("Container element is required for Abacus.");
    }

    /** @type {HTMLElement} */
    this.container = container;

    // Параметры пользователя
    /** @type {number} */
    this.requestedDigitCount = this.#clampDigitCount(options.digitCount ?? 10);
    /** @type {number} */
    this.digitCount = this.requestedDigitCount;
    /** @type {number} */
    this.decimalOffset = Math.max(0, Math.round(options.decimalOffset ?? 0));
    /** @type {boolean} */
    this.showDigits = options.showDigits !== false; // по умолчанию true

    // Геометрия
    /** @type {number} */
    this.columnSpacing = 72;
    /** @type {number} */
    this.columnStart = 50;
    /** @type {number} */
    this.columnEndPadding = 62;
    /** @type {number} */
    this.beadHeight = 36;
    /** @type {number} */
    this.beadWidth = 32;
    /** @type {number} */
    this.gapFromBar = 2;

    /**
     * Базовые метрики (без смещения). Далее в рендере учитываем currentOffsetY.
     */
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

    // Внутренние служебные поля
    /** @type {number} Смещение по вертикали в зависимости от showDigits */
    this.currentOffsetY = this.showDigits ? 50 : 20;
    /** @type {number} Высота SVG (постоянная, место для рамок+цифр) */
    this.svgHeight = this.metrics.baseBottomFrameY + 50 + this.metrics.bottomFrameHeight + 40;

    /** @type {{heaven:'up'|'down', earth:('up'|'down')[]}[]} */
    this.beads = [];

    // Drag state
    /** @type {null|{col:number,type:'heaven'|'earth',index:number}} */
    this.dragging = null;
    /** @type {null|number} */
    this.dragStartY = null;

    // Callbacks
    /** @type {null|function(number,number[]):void} */
    this.onChange = typeof options.onChange === "function" ? options.onChange : null;

    // Theme
    /** @type {AbacusTheme} */
    this.theme = { ...DEFAULT_THEME, ...(options.theme || {}) };

    // Создаём SVG
    /** @type {SVGSVGElement} */
    this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svg.setAttribute("class", "abacus-svg");
    this.svg.setAttribute("height", String(this.svgHeight));
    this.svg.setAttribute("role", "presentation");
    this.svg.setAttribute("aria-hidden", "true");

    // Монтируем
    this.container.innerHTML = "";
    this.container.appendChild(this.svg);

    // Инициализация
    this.#initState();
    this.#attachEventListeners();
    this.#setupAdaptiveResize();
    this.#render();
  }

  // --------------------------------------------------------------------------
  // ПУБЛИЧНЫЙ API
  // --------------------------------------------------------------------------

  /**
   * Подписка на изменение значения.
   * @param {(value:number, columns:number[])=>void} callback 
   */
  setOnChange(callback) {
    this.onChange = typeof callback === "function" ? callback : null;
    this.#emitChange();
  }

  /**
   * Установить количество разрядов (1..23), с учётом адаптивности.
   * @param {number} count 
   */
  setDigitCount(count) {
    const clamped = this.#clampDigitCount(count);
    if (clamped === this.requestedDigitCount) return;
    this.requestedDigitCount = clamped;

    // Обновим наибольшее подходящее значение под ширину контейнера
    this.#updateAdaptiveDigitCount();

    // Гарантия корректности decimalOffset
    if (this.decimalOffset > this.digitCount - 1) {
      this.decimalOffset = Math.max(0, this.digitCount - 1);
    }

    this.#render();
    this.#emitChange();
  }

  /**
   * Получить общее значение абакуса (целое число).
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
   * Получить значение конкретного столбца (0..9).
   * @param {number} colIndex 
   * @returns {number}
   */
  getColumnValue(colIndex) {
    const column = this.beads[colIndex];
    if (!column) return 0;
    let value = column.heaven === "down" ? 5 : 0;
    column.earth.forEach((pos) => { if (pos === "up") value += 1; });
    return value;
  }

  /**
   * Установить число (автоматически разложит по столбцам).
   * @param {number} value 
   */
  setValue(value) {
    const digits = String(Math.max(0, Number(value) || 0))
      .padStart(this.digitCount, "0")
      .split("");

    digits.forEach((digit, index) => {
      const num = parseInt(digit, 10);
      if (!Number.isFinite(num)) return;

      const column = this.beads[index];
      if (!column) return;

      if (num >= 5) {
        column.heaven = "down";
        const remainder = num - 5;
        column.earth = [
          remainder >= 1 ? "up" : "down",
          remainder >= 2 ? "up" : "down",
          remainder >= 3 ? "up" : "down",
          remainder >= 4 ? "up" : "down"
        ];
      } else {
        column.heaven = "up";
        column.earth = [
          num >= 1 ? "up" : "down",
          num >= 2 ? "up" : "down",
          num >= 3 ? "up" : "down",
          num >= 4 ? "up" : "down"
        ];
      }
    });

    this.#render();
    this.#emitChange();
  }

  /**
   * Сбросить все бусины в нулевое положение.
   */
  reset() {
    this.#initState();
    this.#render();
    this.#emitChange();
  }

  /**
   * Установить смещение десятичной запятой (0 — без запятой).
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
   * Показать / скрыть цифры над столбцами.
   * @param {boolean} show 
   */
  setShowDigits(show) {
    const value = Boolean(show);
    if (value === this.showDigits) return;
    this.showDigits = value;
    this.#render();
    this.#emitChange();
  }

  /**
   * Установить тему.
   * @param {Partial<AbacusTheme>} next 
   */
  setTheme(next = {}) {
    this.theme = { ...this.theme, ...next };
    this.#render();
  }

  /**
   * Получить исходно запрошенное количество разрядов (до адаптивности).
   * @returns {number}
   */
  getRequestedDigitCount() {
    return this.requestedDigitCount;
  }

  /**
   * Получить текущее (адаптивное) количество разрядов.
   * @returns {number}
   */
  getAdaptiveDigitCount() {
    return this.digitCount;
  }

  /**
   * Сериализовать состояние (для сохранения/восстановления).
   * @returns {string} JSON
   */
  toJSON() {
    const payload = {
      digitCount: this.digitCount,
      requestedDigitCount: this.requestedDigitCount,
      decimalOffset: this.decimalOffset,
      showDigits: this.showDigits,
      beads: this.beads
    };
    return JSON.stringify(payload);
  }

  /**
   * Восстановить состояние из JSON (совпадение структур обязательно).
   * @param {string|object} json 
   */
  fromJSON(json) {
    let data = json;
    if (typeof json === "string") {
      try { data = JSON.parse(json); } catch {}
    }
    if (!data || typeof data !== "object") return;
    if (Array.isArray(data.beads) && typeof data.digitCount === "number") {
      this.requestedDigitCount = this.#clampDigitCount(data.requestedDigitCount ?? data.digitCount);
      this.digitCount = this.#clampDigitCount(data.digitCount);
      this.decimalOffset = Math.max(0, Math.round(data.decimalOffset ?? 0));
      this.showDigits = !!data.showDigits;
      this.beads = data.beads;
      this.#render();
      this.#emitChange();
    }
  }

  // --------------------------------------------------------------------------
  // ВНУТРЕННИЕ МЕТОДЫ (PRIVATE)
  // --------------------------------------------------------------------------

  /** @param {number} count */
  #clampDigitCount(count) {
    const num = Math.round(Number(count) || 0);
    return Math.max(1, Math.min(23, num));
  }

  #initState() {
    this.beads = Array.from({ length: this.digitCount }, () => ({
      heaven: "up",
      earth: ["down", "down", "down", "down"]
    }));
  }

  #setupAdaptiveResize() {
    // Перерисовываем по изменению размеров контейнера (responsive)
    this.resizeObserver = new ResizeObserver(() => {
      this.#updateAdaptiveDigitCount();
    });
    this.resizeObserver.observe(this.container);
  }

  #updateAdaptiveDigitCount() {
    const containerWidth = this.container.clientWidth || 0;
    const requiredWidth = this.#calculateSvgWidth(this.requestedDigitCount);

    if (requiredWidth <= containerWidth - 20) {
      if (this.requestedDigitCount !== this.digitCount) {
        this.digitCount = this.requestedDigitCount;
        this.#initState(); // сбрасываем состояние стоек (при желании можно переносить младшие разряды)
        this.#render();
        this.#emitChange();
      }
      return;
    }

    let bestDigitCount = 1;
    for (let d = 1; d <= this.requestedDigitCount; d++) {
      const width = this.#calculateSvgWidth(d);
      if (width <= containerWidth - 20) {
        bestDigitCount = d;
      } else {
        break;
      }
    }

    if (bestDigitCount !== this.digitCount) {
      this.digitCount = bestDigitCount;
      this.#initState();
      this.#render();
      this.#emitChange();
    }
  }

  /**
   * Рассчитать ширину SVG для данного числа разрядов.
   * @param {number} digitCount 
   * @returns {number}
   */
  #calculateSvgWidth(digitCount) {
    if (!digitCount) return 0;
    return this.columnStart + (digitCount - 1) * this.columnSpacing + this.columnEndPadding;
  }

  #attachEventListeners() {
    // Mouse
    this.svg.addEventListener("mousedown", (e) => this.#handlePointerDown(e, e));
    window.addEventListener("mousemove", (e) => this.#handlePointerMove(e, e));
    window.addEventListener("mouseup", () => this.#handlePointerUp());

    // Touch
    this.svg.addEventListener("touchstart", (e) => {
      if (e.touches && e.touches[0]) this.#handlePointerDown(e.touches[0], e);
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (this.dragging && e.touches && e.touches[0]) {
        e.preventDefault();
        this.#handlePointerMove(e.touches[0], e);
      }
    }, { passive: false });

    window.addEventListener("touchend", () => this.#handlePointerUp());
    window.addEventListener("touchcancel", () => this.#handlePointerUp());
  }

  #handlePointerDown(pointer, originalEvent) {
    const target = pointer.target instanceof Element ? pointer.target : null;
    if (!target) return;

    const beadGroup = target.closest("[data-role='bead']");
    if (!beadGroup) return;

    const col = Number(beadGroup.getAttribute("data-col"));
    const type = beadGroup.getAttribute("data-type");
    const index = Number(beadGroup.getAttribute("data-index"));

    const rect = this.svg.getBoundingClientRect();
    this.dragStartY = pointer.clientY - rect.top;
    this.dragging = { col, type, index };

    originalEvent?.preventDefault?.();
  }

  #handlePointerMove(pointer, originalEvent) {
    if (!this.dragging) return;

    const rect = this.svg.getBoundingClientRect();
    const currentY = pointer.clientY - rect.top;
    const deltaY = currentY - this.dragStartY;
    const threshold = 8;

    if (this.dragging.type === "heaven") {
      const column = this.beads[this.dragging.col];
      if (!column) return;

      if (deltaY > threshold && column.heaven !== "down") {
        column.heaven = "down";
        this.dragStartY = currentY;
        this.#render();
        this.#emitChange();
      } else if (deltaY < -threshold && column.heaven !== "up") {
        column.heaven = "up";
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
          if (earthBeads[i] !== "up") {
            earthBeads[i] = "up";
            changed = true;
          }
        }
      } else if (deltaY > threshold) {
        for (let i = this.dragging.index; i < earthBeads.length; i++) {
          if (earthBeads[i] !== "down") {
            earthBeads[i] = "down";
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

    originalEvent?.preventDefault?.();
  }

  #handlePointerUp() {
    this.dragging = null;
    this.dragStartY = null;
  }

  #emitChange() {
    if (typeof this.onChange === "function") {
      const columns = Array.from({ length: this.digitCount }, (_, col) => this.getColumnValue(col));
      this.onChange(this.getValue(), columns);
    }
  }

  // --------------------------------------------------------------------------
  // РЕНДЕР
  // --------------------------------------------------------------------------

  #render() {
    const width = this.#calculateSvgWidth(this.digitCount);
    this.svg.setAttribute("width", String(width));

    // ✅ ВАЖНО: смещение завязано на видимость цифр
    this.currentOffsetY = this.showDigits ? 50 : 20;

    const topFrameY = this.metrics.baseTopFrameY + this.currentOffsetY;
    const bottomFrameY = this.metrics.baseBottomFrameY + this.currentOffsetY;

    const defs = this.#renderDefs();
    const frame = this.#renderFrame(width, topFrameY, bottomFrameY);
    const verticalBars = this.#renderVerticalBars(width, topFrameY, bottomFrameY);
    const middleBar = this.#renderMiddleBar(width);
    const rods = this.#renderRods(topFrameY, bottomFrameY);
    const dots = this.#renderDecimalDots();
    const columnLabels = this.#renderColumnLabels(topFrameY);
    const beads = this.#renderBeads();

    this.svg.innerHTML = `${defs}${frame}${verticalBars}${rods}${middleBar}${dots}${columnLabels}${beads}`;
  }

  #renderDefs() {
    // Полные defs с фильтрами и градиентами для рамки, металла и бусин
    return `
      <defs>
        <!-- Shadow for beads -->
        <filter id="beadShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
          <feOffset dx="0" dy="3" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.6" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <!-- Shadow for frame -->
        <filter id="frameShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" />
          <feOffset dx="0" dy="4" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
          <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <!-- Wood gradient -->
        <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${this.theme.woodTopGradientStart}" />
          <stop offset="50%" stop-color="${this.theme.woodTopGradientMid}" />
          <stop offset="100%" stop-color="${this.theme.woodTopGradientEnd}" />
        </linearGradient>

        <!-- Metal bar gradient -->
        <linearGradient id="metalBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${this.theme.metalStart}" />
          <stop offset="30%" stop-color="${this.theme.metalMid1}" />
          <stop offset="50%" stop-color="${this.theme.metalMid2}" />
          <stop offset="70%" stop-color="${this.theme.metalMid3}" />
          <stop offset="100%" stop-color="${this.theme.metalEnd}" />
        </linearGradient>

        <!-- Bead gradient -->
        <radialGradient id="beadGradient" cx="45%" cy="40%">
          <stop offset="0%" stop-color="${this.theme.beadInner}" />
          <stop offset="50%" stop-color="${this.theme.beadMain}" />
          <stop offset="100%" stop-color="${this.theme.beadEdge}" />
        </radialGradient>
      </defs>
    `;
  }

  #renderFrame(width, topFrameY, bottomFrameY) {
    const frameWidth = width - 20;
    return `
      <!-- Top frame -->
      <rect x="10" y="${topFrameY}" width="${frameWidth}" height="${this.metrics.topFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${topFrameY + 3}" width="${frameWidth - 10}" height="4" fill="rgba(255,255,255,0.15)" rx="2" />

      <!-- Bottom frame -->
      <rect x="10" y="${bottomFrameY}" width="${frameWidth}" height="${this.metrics.bottomFrameHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <rect x="15" y="${bottomFrameY + 3}" width="${frameWidth - 10}" height="4" fill="rgba(255,255,255,0.15)" rx="2" />
    `;
  }

  #renderVerticalBars(width, topFrameY, bottomFrameY) {
    const verticalHeight = bottomFrameY - (topFrameY + this.metrics.topFrameHeight);
    const sideW = 10;
    return `
      <!-- Left vertical bar -->
      <rect x="10" y="${topFrameY + this.metrics.topFrameHeight}" width="${sideW}" height="${verticalHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
      <!-- Right vertical bar -->
      <rect x="${width - sideW - 10}" y="${topFrameY + this.metrics.topFrameHeight}" width="${sideW}" height="${verticalHeight}" fill="url(#woodGradient)" filter="url(#frameShadow)" rx="5" />
    `;
  }

  #renderRods(topFrameY, bottomFrameY) {
    const rodTop = topFrameY + this.metrics.topFrameHeight;
    const rodBottom = bottomFrameY;
    let rods = "";
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      rods += `<line x1="${x}" y1="${rodTop}" x2="${x}" y2="${rodBottom}" stroke="${this.theme.rodColor}" stroke-width="${this.theme.rodWidth}" />`;
    }
    return rods;
  }

  #renderMiddleBar(width) {
    // ✅ Используем currentOffsetY (фикс)
    const barTop   = this.metrics.middleBarTop   + this.currentOffsetY;
    const barLight = this.metrics.middleBarLightY + this.currentOffsetY;
    const barShadow= this.metrics.middleBarShadowY+ this.currentOffsetY;
    const frameWidth = width - 20;

    return `
      <!-- Middle metal bar -->
      <rect x="10" y="${barTop}" width="${frameWidth}" height="10" fill="url(#metalBarGradient)" rx="2" />
      <rect x="15" y="${barLight}" width="${frameWidth - 10}" height="2" fill="rgba(255,255,255,0.6)" rx="1" />
      <rect x="10" y="${barShadow}" width="${frameWidth}" height="2" fill="rgba(0,0,0,0.3)" rx="1" />
    `;
  }

  #renderDecimalDots() {
    // ✅ Используем currentOffsetY (фикс)
    const centerY = this.metrics.middleBarTop + this.currentOffsetY + 5;
    const unitsIndex = this.digitCount - this.decimalOffset - 1;

    let dots = "";
    for (let col = 0; col < this.digitCount; col++) {
      const distance = unitsIndex - col;
      if (distance < 0) continue;
      if (distance % 4 !== 0) continue;

      const x = this.columnStart + col * this.columnSpacing;
      dots += `<circle cx="${x}" cy="${centerY}" r="3" fill="${this.theme.dotsColor}" />`;
    }
    return dots;
  }

  #renderColumnLabels(topFrameY) {
    // ✅ Если цифры отключены — ничего не рисуем (фикс)
    if (!this.showDigits) return "";
    const labelY = topFrameY - 22;
    let labels = "";
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      const value = this.getColumnValue(col);
      labels += `
        <text
          x="${x}"
          y="${labelY}"
          fill="${this.theme.digitsColor}"
          font-family="'Montserrat','Baloo 2',sans-serif"
          font-size="32"
          font-weight="600"
          text-anchor="middle"
          dominant-baseline="middle"
        >${value}</text>
      `;
    }
    return labels;
  }

  #renderBeads() {
    let groups = "";
    for (let col = 0; col < this.digitCount; col++) {
      const x = this.columnStart + col * this.columnSpacing;
      const column = this.beads[col];
      const h = this.beadHeight;
      const w = this.beadWidth;
      const gap = this.gapFromBar;

      // Heaven (верхняя) — активна у планки, иначе наверху
      const heavenActiveY   = this.metrics.middleBarTop + this.currentOffsetY - h / 2 - gap;
      const heavenInactiveY = this.metrics.columnTopBase + this.currentOffsetY + h / 2 + gap;
      const heavenY = column.heaven === "down" ? heavenActiveY : heavenInactiveY;

      // Earth (нижние), группировка у планки и внизу
      const earthActive = column.earth;
      const upCount = earthActive.filter((p) => p === "up").length;
      const downCount = earthActive.length - upCount;

      const earthPositions = earthActive.map((position, index) => {
        if (position === "up") {
          const activeIndex = earthActive.slice(0, index).filter((p) => p === "up").length;
          return this.metrics.earthActiveBase + this.currentOffsetY + h / 2 + gap + activeIndex * h;
        } else {
          const inactiveIndex = earthActive.slice(0, index).filter((p) => p === "down").length;
          return this.metrics.baseBottomFrameY + this.currentOffsetY - h / 2 - gap - (downCount - 1 - inactiveIndex) * h;
        }
      });

      const heavenBead = this.#renderBead(x, heavenY, w, h, col, "heaven", 0);
      const earthBeads = earthPositions
        .map((y, index) => this.#renderBead(x, y, w, h, col, "earth", index))
        .join("");

      groups += `<g>${heavenBead}${earthBeads}</g>`;
    }
    return groups;
  }

  #renderBead(x, y, width, height, col, type, index) {
    const hh = height / 2;
    const cut = 12;
    const sideR = 2;

    const path = `
      M ${x - cut} ${y - hh}
      L ${x + cut} ${y - hh}
      Q ${x + cut + 2} ${y - hh + 2} ${x + width - sideR} ${y - sideR}
      Q ${x + width} ${y} ${x + width - sideR} ${y + sideR}
      Q ${x + cut + 2} ${y + hh - 2} ${x + cut} ${y + hh}
      L ${x - cut} ${y + hh}
      Q ${x - cut - 2} ${y + hh - 2} ${x - width + sideR} ${y + sideR}
      Q ${x - width} ${y} ${x - width + sideR} ${y - sideR}
      Q ${x - cut - 2} ${y - hh + 2} ${x - cut} ${y - hh}
      Z
    `;

    return `
      <g data-role="bead" data-col="${col}" data-type="${type}" data-index="${index}" style="cursor: grab;">
        <path d="${path}" fill="url(#beadGradient)" filter="url(#beadShadow)" />
        <line x1="${x - width}" y1="${y}" x2="${x + width}" y2="${y}" stroke="rgba(0,0,0,0.075)" stroke-width="2" />
      </g>
    `;
  }

  // --------------------------------------------------------------------------
  // ОТЛАДОЧНЫЕ/СЛУЖЕБНЫЕ МЕТОДЫ (необязательные, но полезные)
  // --------------------------------------------------------------------------

  /**
   * Установить состояние столбца вручную (для тестов/скриптов).
   * @param {number} col 
   * @param {0|1} heavenDown 
   * @param {number} earthUpCount 0..4
   */
  __setColumnState(col, heavenDown, earthUpCount) {
    if (!this.beads[col]) return;
    this.beads[col].heaven = heavenDown ? "down" : "up";
    this.beads[col].earth = [
      earthUpCount >= 1 ? "up" : "down",
      earthUpCount >= 2 ? "up" : "down",
      earthUpCount >= 3 ? "up" : "down",
      earthUpCount >= 4 ? "up" : "down",
    ];
    this.#render();
    this.#emitChange();
  }

  /**
   * Установить сразу все столбцы значениями 0..9 (массива).
   * @param {number[]} digits 
   */
  __setAllColumns(digits) {
    const arr = Array.isArray(digits) ? digits : [];
    for (let i = 0; i < Math.min(arr.length, this.digitCount); i++) {
      const num = Math.max(0, Math.min(9, Math.round(arr[i] || 0)));
      this.__setColumnState(i, num >= 5 ? 1 : 0, num >= 5 ? num - 5 : num);
    }
  }
}
