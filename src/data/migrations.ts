// Database versions. Never edit a released version — add a new one with `stores` (only the changed
// tables, null drops one) and an `upgrade` that converts existing data. Each new version needs a
// test in db.test.ts that seeds data of the previous version and checks it after the upgrade.
import type { Dexie, Transaction } from 'dexie';

export interface Migration {
  version: number;
  stores: Record<string, string | null>;
  upgrade?: (tx: Transaction) => Promise<unknown> | void;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    stores: {
      profile: 'id',
      gyms: 'id',
      workouts: 'id, status, startedAt',
      workoutExercises: 'id, workoutId, exerciseId',
      sets: 'id, workoutId, workoutExerciseId, exerciseId, doneAt',
      bodyMetrics: 'id, date',
      settings: 'id',
    },
  },
];

export const DB_VERSION = MIGRATIONS[MIGRATIONS.length - 1].version;

export function applyMigrations(db: Dexie, list: Migration[] = MIGRATIONS) {
  let prev = 0;
  for (const m of list) {
    if (m.version <= prev) throw new Error(`migrations out of order at version ${m.version}`);
    prev = m.version;
    const v = db.version(m.version).stores(m.stores);
    if (m.upgrade) v.upgrade(m.upgrade);
  }
}
