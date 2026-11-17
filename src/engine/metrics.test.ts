import { describe, expect, it } from 'vitest';
import { e1rm, records, volumeByMuscle, type Contributions, type SetFact } from './metrics';

const T = 1_000_000_000_000;
const DAY = 86_400_000;
const set = (o: Partial<SetFact> = {}): SetFact => ({ exerciseId: 'bench', kind: 'work', weight: 100, reps: 5, rir: 2, doneAt: T, ...o });
const contrib: Contributions = { bench: { chest: 1, shoulders: 0.5, arms: 0.25 } };

describe('e1rm', () => {
  it('scenario 13', () => {
    expect(e1rm(100, 5, 2)).toBeCloseTo(123.33, 1);
    expect(e1rm(60, 15, 0)).toBeNull();
    expect(e1rm(140, 1, 0)).toBe(140);
  });
  it('boundary 12 allowed, 13 not', () => {
    expect(e1rm(60, 12, 0)).toBeCloseTo(84);
    expect(e1rm(60, 13, 0)).toBeNull();
  });
  it('null RIR / bad weight / reps', () => {
    expect(e1rm(100, 5, null)).toBeNull();
    expect(e1rm(-20, 5, 2)).toBeNull();
    expect(e1rm(0, 5, 2)).toBeNull();
    expect(e1rm(100, 0, 2)).toBeNull();
  });
});

describe('volumeByMuscle', () => {
  it('counts contributions, ignores 0.25', () => {
    expect(volumeByMuscle([set(), set()], contrib, T + 1)).toEqual({ chest: 2, shoulders: 1 });
  });
  it('7-day window [to-7d, to)', () => {
    const to = T + 10 * DAY;
    const v = volumeByMuscle([set({ doneAt: to - 7 * DAY }), set({ doneAt: to - 7 * DAY - 1 }), set({ doneAt: to })], contrib, to);
    expect(v.chest).toBe(1);
  });
  it('ignores warmups, high RIR, unknown exercise', () => {
    const v = volumeByMuscle([set({ kind: 'warmup' }), set({ rir: 5 }), set({ exerciseId: 'x' }), set({ reps: 0 }), set({ rir: 4 }), set({ rir: null })], contrib, T + 1);
    expect(v.chest).toBe(2);
  });
  it('empty', () => expect(volumeByMuscle([], contrib, T)).toEqual({}));
});

describe('records', () => {
  it('ties pick earliest', () => {
    const r = records([set({ id: 'b', doneAt: T + 5 }), set({ id: 'a', doneAt: T }), set({ id: 'c', doneAt: T + 9 })]);
    expect(r.bench.e1rm!.set.id).toBe('a');
    expect(r.bench.weight!.set.id).toBe('a');
    expect(r.bench.setVolume!.value).toBe(500);
  });
  it('skips non-work and non-positive weight; e1rm absent when null', () => {
    const r = records([set({ kind: 'warmup', weight: 200 }), set({ weight: -10 }), set({ rir: null, weight: 80 })]);
    expect(r.bench.weight!.value).toBe(80);
    expect(r.bench.e1rm).toBeUndefined();
  });
});
