export const dictionaries = {
  en: {
    language: "English",
    header: {
      title: "Abacus Trainer v1",
      tagline: "Digital soroban practice",
      steps: {
        settings: "Settings",
        confirmation: "Review",
        game: "Training",
        results: "Results"
      }
    },
    footer: "MindWorld School © 2025",
    buttons: {
      back: "Back",
      continue: "Continue",
      start: "Start session",
      finish: "Finish"
    },
    settings: {
      title: "Configure the session",
      description: "Choose the core mode, number of steps, and how answers are entered.",
      mode: {
        label: "Mode",
        options: [
          { value: "prosto", label: "Prosto" },
          { value: "prosto5", label: "Prosto 5" }
        ]
      },
      chain: {
        label: "Steps per example",
        min: 1,
        max: 6
      },
      examples: {
        label: "Examples in the session",
        min: 1,
        max: 30
      },
      display: {
        label: "Display format",
        options: [
          { value: "column", label: "Column" },
          { value: "inline", label: "Inline" }
        ]
      },
      answerMode: {
        label: "Answer input",
        options: [
          { value: "input", label: "Manual" },
          { value: "choice2", label: "2 options" },
          { value: "choice3", label: "3 options" }
        ]
      }
    },
    confirmation: {
      title: "Double-check the setup",
      description: "Make sure everything looks right before you start.",
      items: {
        mode: "Mode",
        chain: "Steps",
        examples: "Examples",
        display: "Display",
        answerMode: "Answer input"
      }
    },
    game: {
      title: "Training session",
      description: "Solve each example. Check the answer to move forward.",
      progress: "Example {current} of {total}",
      actions: {
        check: "Check answer",
        next: "Next example",
        finish: "Show results"
      },
      answer: {
        label: "Your answer",
        placeholder: "Type the result"
      },
      feedback: {
        correct: "Correct!",
        incorrect: "Right answer: {answer}",
        invalid: "Enter a number to continue"
      },
      example: {
        start: "Start value: {value}",
        question: "= ?",
        inlineSuffix: "= ?"
      }
    },
    results: {
      title: "Session results",
      description: "Here is how the attempt went.",
      stats: {
        correct: "Solved correctly",
        accuracy: "Accuracy",
        time: "Time",
        timeValue: "{minutes}:{seconds}",
        streak: "Best streak"
      },
      leo: {
        title: "Leo says",
        excellent: "Amazing pace! The beads are flying.",
        good: "Great rhythm. Keep sharpening it!",
        keepGoing: "Solid effort — keep going!",
        tryAgain: "Stay focused, the next run will be stronger.",
        summary: "Correct: {success}/{total}. Mistakes: {mistakes}."
      },
      cta: "Configure again"
    }
  },
  ru: {
    language: "Русский",
    header: {
      title: "Абакус Тренер v1",
      tagline: "Цифровая тренировка соробана",
      steps: {
        settings: "Настройки",
        confirmation: "Проверка",
        game: "Тренировка",
        results: "Итоги"
      }
    },
    footer: "MindWorld School © 2025",
    buttons: {
      back: "Назад",
      continue: "Далее",
      start: "Начать сессию",
      finish: "Готово"
    },
    settings: {
      title: "Настройте тренировку",
      description: "Выберите режим, длину цепочек и способ ответа.",
      mode: {
        label: "Режим",
        options: [
          { value: "prosto", label: "Просто" },
          { value: "prosto5", label: "Просто 5" }
        ]
      },
      chain: {
        label: "Шагов в примере",
        min: 1,
        max: 6
      },
      examples: {
        label: "Примеров за сессию",
        min: 1,
        max: 30
      },
      display: {
        label: "Формат показа",
        options: [
          { value: "column", label: "В столбик" },
          { value: "inline", label: "В строку" }
        ]
      },
      answerMode: {
        label: "Ответ",
        options: [
          { value: "input", label: "Ввод вручную" },
          { value: "choice2", label: "2 варианта" },
          { value: "choice3", label: "3 варианта" }
        ]
      }
    },
    confirmation: {
      title: "Проверьте параметры",
      description: "Убедитесь, что всё готово к запуску.",
      items: {
        mode: "Режим",
        chain: "Шаги",
        examples: "Примеры",
        display: "Формат",
        answerMode: "Ответ"
      }
    },
    game: {
      title: "Тренировочная сессия",
      description: "Решайте примеры и фиксируйте ответ.",
      progress: "Пример {current} из {total}",
      actions: {
        check: "Проверить ответ",
        next: "Следующий пример",
        finish: "Показать итоги"
      },
      answer: {
        label: "Ваш ответ",
        placeholder: "Введите результат"
      },
      feedback: {
        correct: "Верно!",
        incorrect: "Правильный ответ: {answer}",
        invalid: "Введите число, чтобы продолжить"
      },
      example: {
        start: "Стартовое значение: {value}",
        question: "= ?",
        inlineSuffix: "= ?"
      }
    },
    results: {
      title: "Итоги сессии",
      description: "Так прошла тренировка.",
      stats: {
        correct: "Решено верно",
        accuracy: "Точность",
        time: "Время",
        timeValue: "{minutes}:{seconds}",
        streak: "Лучшая серия"
      },
      leo: {
        title: "Лео говорит",
        excellent: "Отличный темп! Бусины едва успевают.",
        good: "Здорово! Продолжай в том же духе.",
        keepGoing: "Хорошо держишься — не сдавайся!",
        tryAgain: "Чуть больше внимания, и всё получится.",
        summary: "Верно: {success}/{total}. Ошибок: {mistakes}."
      },
      cta: "Настроить заново"
    }
  },
  ua: {
    language: "Українська",
    header: {
      title: "Абакус Тренер v1",
      tagline: "Цифрове тренування соробана",
      steps: {
        settings: "Налаштування",
        confirmation: "Перевірка",
        game: "Тренування",
        results: "Підсумки"
      }
    },
    footer: "MindWorld School © 2025",
    buttons: {
      back: "Назад",
      continue: "Далі",
      start: "Почати сесію",
      finish: "Готово"
    },
    settings: {
      title: "Налаштуйте сесію",
      description: "Обирайте режим, кількість кроків та формат відповіді.",
      mode: {
        label: "Режим",
        options: [
          { value: "prosto", label: "Просто" },
          { value: "prosto5", label: "Просто 5" }
        ]
      },
      chain: {
        label: "Кроків у прикладі",
        min: 1,
        max: 6
      },
      examples: {
        label: "Прикладів за сесію",
        min: 1,
        max: 30
      },
      display: {
        label: "Формат показу",
        options: [
          { value: "column", label: "В стовпчик" },
          { value: "inline", label: "В рядок" }
        ]
      },
      answerMode: {
        label: "Відповідь",
        options: [
          { value: "input", label: "Ввід вручну" },
          { value: "choice2", label: "2 варіанти" },
          { value: "choice3", label: "3 варіанти" }
        ]
      }
    },
    confirmation: {
      title: "Перевірте параметри",
      description: "Переконайтеся, що все готово до старту.",
      items: {
        mode: "Режим",
        chain: "Кроки",
        examples: "Приклади",
        display: "Формат",
        answerMode: "Відповідь"
      }
    },
    game: {
      title: "Тренувальна сесія",
      description: "Розвʼязуйте приклади та фіксуйте результат.",
      progress: "Приклад {current} з {total}",
      actions: {
        check: "Перевірити відповідь",
        next: "Наступний приклад",
        finish: "Показати підсумки"
      },
      answer: {
        label: "Ваша відповідь",
        placeholder: "Введіть результат"
      },
      feedback: {
        correct: "Правильно!",
        incorrect: "Правильна відповідь: {answer}",
        invalid: "Введіть число, щоб продовжити"
      },
      example: {
        start: "Початкове значення: {value}",
        question: "= ?",
        inlineSuffix: "= ?"
      }
    },
    results: {
      title: "Підсумки сесії",
      description: "Так пройшло тренування.",
      stats: {
        correct: "Розвʼязано вірно",
        accuracy: "Точність",
        time: "Час",
        timeValue: "{minutes}:{seconds}",
        streak: "Найкраща серія"
      },
      leo: {
        title: "Лео каже",
        excellent: "Неймовірний темп! Бусини летять.",
        good: "Чудовий ритм. Продовжуй!",
        keepGoing: "Добре тримаєшся — не зупиняйся!",
        tryAgain: "Ще трохи уваги, і все вийде.",
        summary: "Правильно: {success}/{total}. Помилок: {mistakes}."
      },
      cta: "Налаштувати знову"
    }
  },
  es: {
    language: "Español",
    header: {
      title: "Entrenador Ábaco v1",
      tagline: "Práctica digital de soroban",
      steps: {
        settings: "Ajustes",
        confirmation: "Revisión",
        game: "Entrenamiento",
        results: "Resultados"
      }
    },
    footer: "MindWorld School © 2025",
    buttons: {
      back: "Atrás",
      continue: "Continuar",
      start: "Iniciar sesión",
      finish: "Hecho"
    },
    settings: {
      title: "Configura la sesión",
      description: "Elige el modo, los pasos por ejemplo y el formato de respuesta.",
      mode: {
        label: "Modo",
        options: [
          { value: "prosto", label: "Prosto" },
          { value: "prosto5", label: "Prosto 5" }
        ]
      },
      chain: {
        label: "Pasos por ejemplo",
        min: 1,
        max: 6
      },
      examples: {
        label: "Ejemplos en la sesión",
        min: 1,
        max: 30
      },
      display: {
        label: "Formato de visualización",
        options: [
          { value: "column", label: "En columna" },
          { value: "inline", label: "En línea" }
        ]
      },
      answerMode: {
        label: "Respuesta",
        options: [
          { value: "input", label: "Manual" },
          { value: "choice2", label: "2 opciones" },
          { value: "choice3", label: "3 opciones" }
        ]
      }
    },
    confirmation: {
      title: "Revisa los parámetros",
      description: "Confirma que todo está listo antes de empezar.",
      items: {
        mode: "Modo",
        chain: "Pasos",
        examples: "Ejemplos",
        display: "Formato",
        answerMode: "Respuesta"
      }
    },
    game: {
      title: "Sesión de entrenamiento",
      description: "Resuelve cada ejemplo y confirma la respuesta.",
      progress: "Ejemplo {current} de {total}",
      actions: {
        check: "Comprobar respuesta",
        next: "Siguiente ejemplo",
        finish: "Mostrar resultados"
      },
      answer: {
        label: "Tu respuesta",
        placeholder: "Escribe el resultado"
      },
      feedback: {
        correct: "¡Correcto!",
        incorrect: "Respuesta correcta: {answer}",
        invalid: "Introduce un número para continuar"
      },
      example: {
        start: "Valor inicial: {value}",
        question: "= ?",
        inlineSuffix: "= ?"
      }
    },
    results: {
      title: "Resultados de la sesión",
      description: "Así fue el intento.",
      stats: {
        correct: "Resueltos correctamente",
        accuracy: "Precisión",
        time: "Tiempo",
        timeValue: "{minutes}:{seconds}",
        streak: "Mejor racha"
      },
      leo: {
        title: "Leo dice",
        excellent: "¡Ritmo increíble! Las cuentas vuelan.",
        good: "Gran ritmo. ¡Sigue así!",
        keepGoing: "Buen trabajo, continúa practicando.",
        tryAgain: "Con un poco más de foco lo lograrás.",
        summary: "Correctos: {success}/{total}. Errores: {mistakes}."
      },
      cta: "Configurar de nuevo"
    }
  }
};

export const LANG_CODES = Object.keys(dictionaries);
