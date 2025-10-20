/**
 * Компонент модального окна для Настроек
 * Управляет состоянием модала и взаимодействием с пользователем
 */
export class SettingsModal {
  /**
   * @param {Object} options
   * @param {number} options.initialDigitCount - Начальное количество разрядов
   * @param {number} options.initialDecimalOffset - Начальное смещение запятой
   */
  constructor(options = {}) {
    this.initialDigitCount = options.initialDigitCount ?? 10;
    this.initialDecimalOffset = options.initialDecimalOffset ?? 0;
    this.initialShowDigits = options.initialShowDigits ?? true;

    this.elements = {
      overlay: document.getElementById('settingsModal'),
      openBtn: document.getElementById('settingsBtn'),
      closeBtn: document.getElementById('closeModalBtn'),
      saveBtn: document.getElementById('saveSettingsBtn'),
      cancelBtn: document.getElementById('cancelSettingsBtn'),
      digitCountInput: document.getElementById('digitCountInput'),
      digitCountValue: document.getElementById('digitCountValue'),
      decimalOffsetSelect: document.getElementById('decimalOffsetSelect'),
      showDigitsCheckbox: document.getElementById('showDigitsCheckbox')
    };

    this.onSave = null;
    this.isOpen = false;

    this.#init();
  }

  /**
   * Установить callback для сохранения
   * @param {(settings) => void} callback
   */
  setOnSave(callback) {
    this.onSave = typeof callback === 'function' ? callback : null;
  }

  /**
   * Открыть модальное окно
   */
  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.elements.overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Закрыть модальное окно
   */
  close() {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.elements.overlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * Получить текущие значения из формы
   */
  getSettings() {
    return {
      digitCount: parseInt(this.elements.digitCountInput.value, 10),
      decimalOffset: parseInt(this.elements.decimalOffsetSelect.value, 10),
      showDigits: this.elements.showDigitsCheckbox.checked
    };
  }

  /**
   * Установить значения в форму
   * @param {Object} settings
   * @param {number} settings.digitCount
   * @param {number} settings.decimalOffset
   * @param {boolean} settings.showDigits
   */
  setSettings(settings) {
    if (settings.digitCount !== undefined) {
      this.elements.digitCountInput.value = settings.digitCount;
      this.elements.digitCountValue.textContent = settings.digitCount;
    }
    if (settings.decimalOffset !== undefined) {
      this.elements.decimalOffsetSelect.value = settings.decimalOffset;
    }
    if (settings.showDigits !== undefined) {
      this.elements.showDigitsCheckbox.checked = settings.showDigits;
    }
  }

  /**
   * Внутренние методы
   */

  #init() {
    this.#initializeValues();
    this.#attachEventListeners();
  }

  #initializeValues() {
    this.setSettings({
      digitCount: this.initialDigitCount,
      decimalOffset: this.initialDecimalOffset,
      showDigits: this.initialShowDigits
    });
  }

  #attachEventListeners() {
    // Открытие модала
    this.elements.openBtn.addEventListener('click', () => this.open());

    // Закрытие модала
    this.elements.closeBtn.addEventListener('click', () => this.close());
    this.elements.cancelBtn.addEventListener('click', () => this.close());

    // Закрытие по клику на оверлей
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay) {
        this.close();
      }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    // Обновление значения при изменении ползунка
    this.elements.digitCountInput.addEventListener('input', (e) => {
      this.elements.digitCountValue.textContent = e.target.value;
    });

    // Сохранение настроек
    this.elements.saveBtn.addEventListener('click', () => {
      if (typeof this.onSave === 'function') {
        const settings = this.getSettings();
        this.onSave(settings);
      }
      this.close();
    });
  }
}
