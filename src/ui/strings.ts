// All interface texts. Tone: official and neutral — see docs/roadmap.md «Тексты интерфейса».

export const t = {
  tabs: {
    label: 'Разделы',
    today: 'Сегодня',
    history: 'История',
    start: 'Начать тренировку',
    progress: 'Прогресс',
    profile: 'Профиль',
  },
  home: {
    title: 'Сегодня',
    next: 'Следующая тренировка',
    balance: 'Баланс недели',
    readiness: 'Готовность',
    week: 'Неделя',
  },
  plan: {
    back: 'Сегодня',
    eyebrow: 'План на сегодня',
    duration: 'Длительность',
    sets: 'Подходы',
    volume: 'Объём',
    time: 'Время',
    warmup: 'Разминка · 5 мин',
    warmupName: 'Гребной тренажёр и 2 разминочных подхода тяги',
    warmupNote: 'Добавлена автоматически перед тяжёлой тягой',
    main: 'Основная часть',
    replace: 'Заменить упражнение',
    start: 'Начать тренировку',
  },
  workout: {
    label: 'Тренировка',
    finish: 'Завершить тренировку',
    exerciseOf: (i: number, n: number) => `Упражнение ${i} из ${n}`,
    exercise: (i: number) => `Упражнение ${i}`,
    set: (i: number) => `Подход ${i}`,
    weight: 'Вес',
    reps: 'Повторения',
    target: (a: number, b: number) => `цель ${a}–${b}`,
    weightLess: 'Уменьшить вес',
    weightMore: 'Увеличить вес',
    repsLess: 'Меньше повторений',
    repsMore: 'Больше повторений',
    reserve: 'Запас повторений',
    reserveOptions: [['0', 'отказ'], ['1', 'тяжело'], ['2', 'умеренно'], ['3+', 'легко']] as const,
    pain: 'Боль',
    setDone: 'Подход выполнен',
    rest: 'Отдых',
    of: 'из',
    minus15: '−15 с',
    plus15: '+15 с',
    skip: 'Пропустить',
    next: 'Далее',
    nextSet: (i: number, n: number) => `подход ${i} из ${n}`,
    notes: {
      exerciseDone: (next: string) => `Упражнение завершено. Следующее — ${next}.`,
      failure: (step: string) => `Подход выполнен до отказа — вес снижен на ${step}\u00A0кг.`,
      easy: (step: string) => `Подход был лёгким — вес увеличен на ${step}\u00A0кг.`,
      hard: 'Подход был тяжёлым — вес сохранён. Следите за техникой.',
      ok: 'Запас повторений достаточный — вес сохранён.',
    },
    done: 'Тренировка завершена',
    tonnage: 'Тоннаж',
    exercises: 'Упражнения',
    close: 'Готово',
  },
  units: { kg: 'кг', t: 'т', min: 'мин', reps: 'повт.' },
  date: {
    days: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
    weekdays: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
  },
};

/** Russian plural: plural(5, ['подход', 'подхода', 'подходов']) → 'подходов' */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export const FORMS = {
  exercise: ['упражнение', 'упражнения', 'упражнений'],
  set: ['подход', 'подхода', 'подходов'],
} as const;
