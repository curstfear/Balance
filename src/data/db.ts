// IndexedDB through Dexie. No UI here — reactive status lives in storage.svelte.ts.
import { Dexie, type Table } from 'dexie';
import { MIGRATIONS, applyMigrations, type Migration } from './migrations';
import type { BodyMetric, Gym, Profile, SetRecord, Settings, Workout, WorkoutExercise } from './schema';

export const DB_NAME = 'balance';

export class BalanceDB extends Dexie {
  profile!: Table<Profile, string>;
  gyms!: Table<Gym, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<SetRecord, string>;
  bodyMetrics!: Table<BodyMetric, string>;
  settings!: Table<Settings, string>;

  constructor(name = DB_NAME, migrations: Migration[] = MIGRATIONS) {
    super(name);
    applyMigrations(this, migrations);
  }
}

export type StorageProblem = 'unavailable' | 'newer' | 'quota' | 'blocked' | 'unknown';

/** Why the database could not be opened or written — decides the advice shown to the person. */
export function classifyError(e: unknown): StorageProblem {
  const names: string[] = [];
  for (let cur: any = e, i = 0; cur && i < 4; cur = cur.inner, i++) if (typeof cur.name === 'string') names.push(cur.name);
  if (names.some((n) => n === 'VersionError')) return 'newer';
  if (names.some((n) => n === 'QuotaExceededError')) return 'quota';
  if (names.some((n) => n === 'MissingAPIError' || n === 'InvalidStateError' || n === 'SecurityError')) return 'unavailable';
  return 'unknown';
}

/** randomUUID needs iOS 15.4+ and a secure context; fall back to getRandomValues. */
export function uid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
