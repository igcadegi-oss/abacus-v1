/**
 * Abacus Online - Виртуальный Соробан
 * Главный файл приложения
 */

import { Abacus } from './Abacus.js';
import { SettingsModal } from './Modal.js';

class AbacusApp {
  constructor() {
    // Элементы DOM
    this.abacusContainer = document.getElementById('abacusContainer');

    // Состояние
    this.settings = {
      digitCount: 10,
      decimalOffset: 0,
      showDigits: true
    };

    // Инстансы
    this.abacus = null;
    this.modal = null;

    // Инициализация
    this.#init();
  }

  /**
   * Инициализация приложения
   */
  #init() {
    // Загрузить сохранённые настройки из localStorage
    this.#loadSettings();

    // Создать абакус
    this.#createAbacus();

    // Создать модал
    this.#createModal();
  }

  /**
   * Создание абакуса
   */
  #createAbacus() {
    this.abacus = new Abacus(this.abacusContainer, {
      digitCount: this.settings.digitCount,
      decimalOffset: this.settings.decimalOffset
    });

    // Применить showDigits
    this.abacus.setShowDigits(this.settings.showDigits);

    // Обработчик изменений (для логирования или статистики)
    this.abacus.setOnChange((value, columns) => {
      console.log(`Абакус: ${value}, Разряды:`, columns);
    });
  }

  /**
   * Создание модала настроек
   */
  #createModal() {
    this.modal = new SettingsModal({
      initialDigitCount: this.settings.digitCount,
      initialDecimalOffset: this.settings.decimalOffset,
      initialShowDigits: this.settings.showDigits
    });

    // Обработчик сохранения
    this.modal.setOnSave((newSettings) => {
      this.#applySettings(newSettings);
    });
  }

  /**
   * Применить новые настройки
   */
  #applySettings(newSettings) {
    // Обновить состояние
    this.settings.digitCount = newSettings.digitCount;
    this.settings.decimalOffset = newSettings.decimalOffset;
    this.settings.showDigits = newSettings.showDigits;

    // Применить к абакусу
    this.abacus.setDigitCount(newSettings.digitCount);
    this.abacus.setDecimalOffset(newSettings.decimalOffset);
    this.abacus.setShowDigits(newSettings.showDigits);

    // Сохранить в localStorage
    this.#saveSettings();

    console.log('✅ Настройки применены:', this.settings);
  }

  /**
   * Загрузить настройки из localStorage
   */
  #loadSettings() {
    try {
      const saved = localStorage.getItem('abacusSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          digitCount: Math.max(1, Math.min(23, parsed.digitCount ?? 10)),
          decimalOffset: Math.max(0, Math.min(4, parsed.decimalOffset ?? 0)),
          showDigits: parsed.showDigits !== false // По умолчанию true
        };
        console.log('✅ Настройки загружены:', this.settings);
      }
    } catch (error) {
      console.warn('⚠️ Ошибка загрузки настроек:', error);
      this.settings = { digitCount: 10, decimalOffset: 0, showDigits: true };
    }
  }

  /**
   * Сохранить настройки в localStorage
   */
  #saveSettings() {
    try {
      localStorage.setItem('abacusSettings', JSON.stringify(this.settings));
      console.log('✅ Настройки сохранены в localStorage');
    } catch (error) {
      console.warn('⚠️ Ошибка сохранения настроек:', error);
    }
  }
}

// Инициализация приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Инициализация Abacus Online...');
  const app = new AbacusApp();
  const rb = document.getElementById('resetBtn');
  if (rb) rb.addEventListener('click', () => app.abacus && app.abacus.reset());
  console.log('✅ Приложение готово!');
});
