// Sample data for the design preview. Replaced by the training engine + IndexedDB later.

export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';

export const MUSCLES: { id: Muscle; name: string }[] = [
  { id: 'chest', name: 'Грудь' },
  { id: 'shoulders', name: 'Плечи' },
  { id: 'arms', name: 'Руки' },
  { id: 'core', name: 'Кор' },
  { id: 'legs', name: 'Ноги' },
  { id: 'back', name: 'Спина' },
];

/** % of weekly target volume per muscle, in MUSCLES order */
export const weekBalance: number[] = [92, 74, 88, 66, 81, 58];

export interface Exercise {
  muscle: Muscle;
  name: string;
  sets: number;
  reps: [number, number];
  weight: number;
  step: number;
  why: string;
  up?: boolean;
  rest: number; // seconds
}

export interface Plan {
  title: string;
  muscles: { id: Muscle; name: string }[];
  reason: string;
  exercises: Exercise[];
}

const ALL: Exercise[] = [
  { muscle: 'back', name: 'Подтягивания в гравитроне', sets: 4, reps: [8, 10], weight: -25, step: 5, why: 'Спина отстаёт по недельному балансу', rest: 120 },
  { muscle: 'back', name: 'Тяга штанги в наклоне', sets: 4, reps: [8, 10], weight: 62.5, step: 2.5, why: '+2,5\u00A0кг: в прошлый раз подходы были лёгкими', up: true, rest: 120 },
  { muscle: 'back', name: 'Тяга гантели одной рукой', sets: 3, reps: [10, 12], weight: 26, step: 2, why: 'Добор недельного объёма спины', rest: 90 },
  { muscle: 'shoulders', name: 'Обратные разведения', sets: 3, reps: [12, 15], weight: 8, step: 1, why: 'Задняя дельта не получала нагрузку 5 дней', rest: 60 },
  { muscle: 'arms', name: 'Сгибания со штангой', sets: 3, reps: [10, 12], weight: 30, step: 2.5, why: '+1 повторение к прошлой тренировке', up: true, rest: 75 },
  { muscle: 'arms', name: 'Молотки с гантелями', sets: 2, reps: [10, 12], weight: 14, step: 2, why: 'Добор недельного объёма бицепса', rest: 60 },
];

/** Shorter/longer variants — the engine will do this properly; here we just trim the list. */
export function planFor(minutes: 45 | 55 | 70): Plan {
  const exercises = minutes === 45 ? ALL.slice(0, 4).map((e, i) => (i === 2 ? { ...e, sets: 2 } : e))
    : minutes === 55 ? ALL.slice(0, 5)
    : ALL.map((e) => (e.muscle === 'back' && e.sets === 3 ? { ...e, sets: 4 } : e));
  return {
    title: 'Спина и бицепс',
    muscles: [{ id: 'back', name: 'Спина' }, { id: 'arms', name: 'Бицепс' }, { id: 'shoulders', name: 'Задняя дельта' }],
    reason: 'Спина не получала нагрузку 6 дней и отстаёт сильнее других групп.',
    exercises,
  };
}

export function totals(plan: Plan) {
  const sets = plan.exercises.reduce((a, e) => a + e.sets, 0);
  const tonnage = plan.exercises.reduce((a, e) => a + e.sets * e.reps[0] * Math.max(e.weight, 0), 0);
  return { sets, tonnage };
}
