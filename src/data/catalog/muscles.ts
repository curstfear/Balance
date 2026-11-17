import type { MuscleGroup, MuscleId, MuscleInfo, Pattern, PatternFamily, PatternInfo } from './types';

// docs/engine/catalog.md «Мышцы (16 групп)»
export const MUSCLES: MuscleInfo[] = [
  { id: 'chest', name: 'Грудь', group: 'chest', size: 'large', tauH: 30 },
  { id: 'delt_front', name: 'Передняя дельта', group: 'shoulders', size: 'small', tauH: 20 },
  { id: 'delt_side', name: 'Средняя дельта', group: 'shoulders', size: 'small', tauH: 20 },
  { id: 'delt_rear', name: 'Задняя дельта', group: 'shoulders', size: 'small', tauH: 20 },
  { id: 'lats', name: 'Широчайшие', group: 'back', size: 'large', tauH: 30 },
  { id: 'upper_back', name: 'Верх спины', group: 'back', size: 'large', tauH: 30 },
  { id: 'biceps', name: 'Бицепс', group: 'arms', size: 'small', tauH: 20 },
  { id: 'triceps', name: 'Трицепс', group: 'arms', size: 'small', tauH: 20 },
  { id: 'forearms', name: 'Предплечья', group: 'arms', size: 'small', tauH: 20 },
  { id: 'abs', name: 'Пресс', group: 'core', size: 'small', tauH: 20 },
  { id: 'lower_back', name: 'Разгибатели спины', group: 'back', size: 'large', tauH: 36 },
  { id: 'glutes', name: 'Ягодицы', group: 'legs', size: 'large', tauH: 30 },
  { id: 'quads', name: 'Квадрицепс', group: 'legs', size: 'large', tauH: 30 },
  { id: 'hamstrings', name: 'Бицепс бедра', group: 'legs', size: 'large', tauH: 30 },
  { id: 'adductors', name: 'Приводящие', group: 'legs', size: 'medium', tauH: 30 },
  { id: 'calves', name: 'Икры', group: 'legs', size: 'small', tauH: 20 },
];

export const MUSCLE: Record<MuscleId, MuscleInfo> = Object.fromEntries(MUSCLES.map((m) => [m.id, m])) as Record<MuscleId, MuscleInfo>;

/** Order and names of the 6 colour families (filters, «Баланс недели»). */
export const GROUPS: { id: MuscleGroup; name: string }[] = [
  { id: 'chest', name: 'Грудь' },
  { id: 'back', name: 'Спина' },
  { id: 'shoulders', name: 'Плечи' },
  { id: 'arms', name: 'Руки' },
  { id: 'legs', name: 'Ноги' },
  { id: 'core', name: 'Кор' },
];

const P = (id: Pattern, name: string, family: PatternFamily): PatternInfo => ({ id, name, family });

// docs/engine/catalog.md «Паттерны» + families for the balance
export const PATTERNS: PatternInfo[] = [
  P('h_push', 'Горизонтальный жим', 'push'),
  P('incline_push', 'Жим под углом', 'push'),
  P('v_push', 'Вертикальный жим', 'push'),
  P('chest_fly', 'Сведение', 'push'),
  P('elbow_ext', 'Разгибание локтя', 'push'),
  P('h_pull', 'Горизонтальная тяга', 'pull'),
  P('v_pull', 'Вертикальная тяга', 'pull'),
  P('shoulder_ext', 'Пуловер', 'pull'),
  P('rear_delt', 'Задняя дельта', 'pull'),
  P('shrug', 'Шраги', 'pull'),
  P('elbow_flex', 'Сгибание локтя', 'pull'),
  P('squat', 'Присед', 'quad'),
  P('single_leg', 'На одной ноге', 'quad'),
  P('knee_ext', 'Разгибание колена', 'quad'),
  P('hinge', 'Наклон в тазобедренных', 'posterior'),
  P('hip_thrust', 'Ягодичный мост', 'posterior'),
  P('knee_flex', 'Сгибание колена', 'posterior'),
  P('lateral_raise', 'Махи в стороны', 'other'),
  P('hip_add', 'Сведение ног', 'other'),
  P('hip_abd', 'Разведение ног', 'other'),
  P('calf', 'Икры', 'other'),
  P('core_flex', 'Сгибание корпуса', 'core'),
  P('core_anti_ext', 'Удержание корпуса', 'core'),
  P('core_anti_rot', 'Против вращения', 'core'),
  P('carry', 'Переноска', 'core'),
];
export const PATTERN: Record<Pattern, PatternInfo> = Object.fromEntries(PATTERNS.map((p) => [p.id, p])) as Record<Pattern, PatternInfo>;

/** Joint zones in the order of safety.md §3. */
export const ZONES = [
  { id: 'shoulder', name: 'Плечо' },
  { id: 'elbow', name: 'Локоть' },
  { id: 'wrist', name: 'Запястье' },
  { id: 'lower_back', name: 'Поясница' },
  { id: 'knee', name: 'Колено' },
  { id: 'hip', name: 'Тазобедренный сустав' },
  { id: 'neck', name: 'Шея' },
] as const;
