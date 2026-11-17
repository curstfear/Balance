import type { EquipClass, Exercise, MuscleGroup, MuscleId } from './types';
import { MUSCLE, PATTERN } from './muscles';
import { PUSH } from './exercises/push';
import { PULL } from './exercises/pull';
import { LEGS } from './exercises/legs';
import { ARMS } from './exercises/arms';
import { CORE } from './exercises/core';

export * from './types';
export { MUSCLES, MUSCLE, GROUPS, PATTERNS, PATTERN, ZONES } from './muscles';
export { EQUIPMENT, EQUIP } from './equipment';

/** Bumped whenever exercises are added or their markup changes. Stored with workouts later (engine version). */
export const CATALOG_VERSION = 1;

export const EXERCISES: Exercise[] = [...PUSH, ...PULL, ...LEGS, ...ARMS, ...CORE];
export const EXERCISE: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

/**
 * Ids that were renamed: old → new. Ids are never deleted — history keeps pointing at them.
 * catalog.test.ts checks every id ever released (RELEASED_IDS) is still resolvable.
 */
export const RENAMED: Record<string, string> = {};

export function exerciseById(id: string): Exercise | undefined {
  return EXERCISE[id] ?? (RENAMED[id] ? EXERCISE[RENAMED[id]] : undefined);
}

const SETUP: Record<EquipClass, number> = {
  machine_stack: 45, machine_plate: 60, cable: 45, dumbbell: 60, kettlebell: 45, barbell: 120, smith: 90, bodyweight: 30, band: 30,
};
export const setupSec = (e: Exercise) => e.setupSec ?? SETUP[e.equipClass];

const LOWER = new Set(['quad', 'posterior']);
/** Weight step in kg (load-and-progression §4, config.md). null — progression by repetitions. Real steps come from the gym (stage 4). */
export function weightStep(e: Exercise): number | null {
  if (e.weightStep !== undefined) return e.weightStep;
  if (e.load === 'bodyweight') return null;
  if (e.load === 'assisted') return 5;
  if (e.load === 'bodyweight_plus') return 2.5;
  const lower = LOWER.has(PATTERN[e.pattern].family) || e.pattern === 'calf';
  switch (e.equipClass) {
    case 'barbell': case 'smith': case 'machine_plate': return lower ? 5 : 2.5;
    case 'dumbbell': return 2;
    case 'kettlebell': return 4;
    case 'cable': return 2.5;
    case 'machine_stack': return 5;
    default: return null;
  }
}

/** Main muscle: the first with share 1. */
export function mainMuscle(e: Exercise): MuscleId {
  return (Object.entries(e.muscles).find(([, v]) => v === 1)?.[0] ?? Object.keys(e.muscles)[0]) as MuscleId;
}
export const groupOf = (e: Exercise): MuscleGroup => MUSCLE[mainMuscle(e)].group;

/** Muscles sorted by share, largest first. */
export function musclesByShare(e: Exercise): [MuscleId, number][] {
  return (Object.entries(e.muscles) as [MuscleId, number][]).sort((a, b) => b[1] - a[1]);
}

/** Search key: lower case, ё → е, punctuation and repeated spaces removed. */
export function normalize(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/g, ' ').trim();
}

const INDEX = new Map(EXERCISES.map((e) => [e.id, normalize([e.name.ru, e.name.en, ...e.aliases].join(' '))]));
/** Every word of the query must start a word in the name, English name or an alias. */
export function matches(e: Exercise, query: string): boolean {
  const q = normalize(query);
  if (!q) return true;
  const hay = ' ' + (INDEX.get(e.id) ?? '');
  return q.split(' ').every((w) => hay.includes(' ' + w));
}

/** Equipment requirement is AND of OR-groups. */
export function fitsEquipment(e: Exercise, have: ReadonlySet<string>): boolean {
  return e.equipment.every((any) => any.some((id) => have.has(id)));
}
export const usesEquipment = (e: Exercise, id: string) => e.equipment.some((any) => any.includes(id));
