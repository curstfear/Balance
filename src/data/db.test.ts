import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { BalanceDB, classifyError } from './db';
import { DB_VERSION, MIGRATIONS, applyMigrations, type Migration } from './migrations';
import { Dexie } from 'dexie';

let n = 0;
const name = () => `db-${Date.now()}-${n++}`;

describe('BalanceDB', () => {
  it('fresh install has all 7 tables at DB_VERSION', async () => {
    const db = new BalanceDB(name());
    await db.open();
    expect(db.tables.map((t) => t.name).sort()).toEqual(
      ['bodyMetrics', 'gyms', 'profile', 'sets', 'settings', 'workoutExercises', 'workouts']);
    expect(db.verno).toBe(DB_VERSION);
    db.close();
  });

  it('migration converts data', async () => {
    const nm = name();
    const a = new BalanceDB(nm);
    await a.gyms.add({ id: 'g', name: 'Gym', equipment: [], safety: true, isDefault: true,
      weightSteps: { dumbbells: [], stack: 5, microPlates: [] } });
    a.close();
    const v2: Migration[] = [...MIGRATIONS, {
      version: 2, stores: {},
      upgrade: (tx) => tx.table('gyms').toCollection().modify((g: any) => { g.name = g.name.toUpperCase(); }),
    }];
    const b = new BalanceDB(nm, v2);
    expect((await b.gyms.get('g'))!.name).toBe('GYM');
    expect(b.verno).toBe(2);
    b.close();
  });

  it('failing upgrade leaves v1 data intact and old code can still open', async () => {
    const nm = name();
    const a = new BalanceDB(nm);
    await a.gyms.add({ id: 'g', name: 'Gym', equipment: [], safety: true, isDefault: true,
      weightSteps: { dumbbells: [], stack: 5, microPlates: [] } });
    a.close();
    const bad: Migration[] = [...MIGRATIONS, { version: 2, stores: {}, upgrade: () => { throw new Error('boom'); } }];
    const b = new BalanceDB(nm, bad);
    await expect(b.open()).rejects.toBeTruthy();
    b.close();
    const c = new BalanceDB(nm);
    await c.open();
    expect(c.verno).toBe(1);
    expect((await c.gyms.get('g'))!.name).toBe('Gym');
    c.close();
  });

  it('applyMigrations rejects out-of-order list', () => {
    const d = new Dexie(name());
    expect(() => applyMigrations(d, [{ version: 2, stores: {} }, { version: 1, stores: {} }])).toThrow(/out of order/);
    expect(() => applyMigrations(d, [{ version: 1, stores: {} }, { version: 1, stores: {} }])).toThrow(/out of order/);
  });
});

describe('classifyError', () => {
  const e = (nm: string, inner?: unknown) => Object.assign(new Error(nm), { name: nm, inner });
  it('maps known errors', () => {
    expect(classifyError(e('VersionError'))).toBe('newer');
    expect(classifyError(e('QuotaExceededError'))).toBe('quota');
    expect(classifyError(e('DatabaseClosedError', e('QuotaExceededError')))).toBe('quota');
    expect(classifyError(e('MissingAPIError'))).toBe('unavailable');
    expect(classifyError(e('Whatever'))).toBe('unknown');
    expect(classifyError(undefined)).toBe('unknown');
    expect(classifyError('str')).toBe('unknown');
  });
});
