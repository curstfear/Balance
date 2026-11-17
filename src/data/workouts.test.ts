import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { BalanceDB } from './db';
import {
  autoCloseWorkout, buildWorkout, finishWorkout, loadWorkout, logSet, planFromWorkout, profileStats, resolveOnLaunch, saveCursor,
  saveNewWorkout, RESUME_WINDOW_MS, type PlanInput, type SetInput,
} from './workouts';
import type { Cursor } from './schema';

let n = 0;
let db: BalanceDB;
beforeEach(() => { db = new BalanceDB(`w-${Date.now()}-${n++}`); });

const plan: PlanInput = {
  title: 'Day',
  exercises: [
    { id: 'bench', muscle: 'chest', name: 'Bench', sets: 3, reps: [8, 10], weight: 60, step: 2.5, rest: 90, why: 'because' },
    { id: 'row', muscle: 'back', name: 'Row', sets: 3, reps: [8, 12], weight: 50, step: 2.5, rest: 90, why: '' },
  ],
};
const T0 = 1_000_000_000_000;
const cur = (o: Partial<Cursor> = {}): Cursor => ({ ex: 0, weight: 60, reps: 8, rir: null, pain: null, phase: 'rest', restEnd: T0 + 90_000, restTotal: 90, note: '', ...o });
const input = (d: ReturnType<typeof buildWorkout>, index: number, doneAt: number, o: Partial<SetInput> = {}): SetInput => ({
  workoutId: d.workout.id, workoutExerciseId: d.exercises[0].id, exerciseId: 'bench', index,
  weight: 60, reps: 8, rir: 2, pain: null, doneAt, ...o,
});
const start = async (at = T0) => { const d = buildWorkout(plan, at); await saveNewWorkout(db, d); return d; };

describe('workouts', () => {
  it('buildWorkout + saveNewWorkout', async () => {
    const d = await start();
    expect(d.workout.status).toBe('active');
    expect(d.workout.cursor).toMatchObject({ ex: 0, weight: 60, reps: 8, phase: 'set' });
    const l = await loadWorkout(db, d.workout.id);
    expect(l!.exercises.map((e) => e.name)).toEqual(['Bench', 'Row']);
    expect(l!.sets).toEqual([]);
    expect(await loadWorkout(db, 'nope')).toBeUndefined();
  });

  it('logSet writes set and cursor; idempotent by index', async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 1000), cur());
    await logSet(db, input(d, 1, T0 + 2000, { reps: 9 }), cur({ reps: 9 }));
    const l = (await loadWorkout(db, d.workout.id))!;
    expect(l.sets).toHaveLength(1);
    expect(l.sets[0]).toMatchObject({ reps: 9, pain: 'none', kind: 'work' });
    expect(l.workout.cursor!.phase).toBe('rest');
    expect(l.workout.lastActivityAt).toBe(T0 + 2000);
  });

  it('works with Proxy-wrapped cursor/input', async () => {
    const d = await start();
    await logSet(db, new Proxy({ ...input(d, 1, T0 + 5) }, {}), new Proxy({ ...cur() }, {}));
    await saveCursor(db, d.workout.id, new Proxy({ ...cur({ weight: 70 }) }, {}), T0 + 6);
    const l = (await loadWorkout(db, d.workout.id))!;
    expect(l.sets).toHaveLength(1);
    expect(l.workout.cursor!.weight).toBe(70);
  });

  it('saveCursor is a no-op after finish', async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 5), cur());
    await finishWorkout(db, d.workout.id, T0 + 10);
    await saveCursor(db, d.workout.id, cur({ weight: 99 }), T0 + 20);
    const w = (await loadWorkout(db, d.workout.id))!.workout;
    expect(w.status).toBe('finished');
    expect(w.cursor).toBeUndefined();
    expect(w.lastActivityAt).toBe(T0 + 5);
  });

  it('a late set on a workout closed without sets turns it finished, not reopened', async () => {
    const d = await start();
    await finishWorkout(db, d.workout.id, T0 + 10); // abandoned: no sets yet
    await logSet(db, input(d, 1, T0 + 20), cur());
    const w = (await loadWorkout(db, d.workout.id))!;
    expect(w.workout.status).toBe('finished');
    expect(w.workout.cursor).toBeUndefined();
    expect(w.sets).toHaveLength(1);
  });

  it('logSet for an unknown workout throws and stores nothing', async () => {
    const d = buildWorkout(planFromWorkout(await start()), T0);
    await expect(logSet(db, input(d, 1, T0 + 20), cur())).rejects.toThrow();
    expect(await db.sets.where('workoutId').equals(d.workout.id).count()).toBe(0);
  });

  it('finishWorkout: finished with sets, abandoned without; never deleted', async () => {
    const a = await start();
    await logSet(db, input(a, 1, T0 + 5), cur());
    await finishWorkout(db, a.workout.id, T0 + 100);
    const b = await start(T0 + 200);
    await finishWorkout(db, b.workout.id, T0 + 300);
    await finishWorkout(db, b.workout.id, T0 + 400); // repeated: ignored
    const wa = (await loadWorkout(db, a.workout.id))!.workout;
    const wb = (await loadWorkout(db, b.workout.id))!.workout;
    expect(wa).toMatchObject({ status: 'finished', endedAt: T0 + 100 });
    expect(wb).toMatchObject({ status: 'abandoned', endedAt: T0 + 300 });
    expect(await db.workouts.count()).toBe(2);
    expect(await db.sets.count()).toBe(1);
  });

  it('saveNewWorkout closes previous active', async () => {
    const a = await start();
    await logSet(db, input(a, 1, T0 + 5), cur());
    const b = await start(T0 + 1000);
    const wa = (await loadWorkout(db, a.workout.id))!.workout;
    expect(wa.status).toBe('finished');
    expect(wa.autoClosed).toBe(true);
    expect(wa.endedAt).toBe(T0 + 5);
    expect(await db.workouts.where('status').equals('active').count()).toBe(1);
    expect((await loadWorkout(db, b.workout.id))!.workout.status).toBe('active');
  });
});

describe('autoCloseWorkout', () => {
  it('ends at the last set, keeps sets, flags it; ignores closed workouts', async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 60_000), cur());
    await autoCloseWorkout(db, d.workout.id, T0 + RESUME_WINDOW_MS * 3);
    const w = (await loadWorkout(db, d.workout.id))!;
    expect(w.workout).toMatchObject({ status: 'finished', endedAt: T0 + 60_000, autoClosed: true });
    expect(w.workout.cursor).toBeUndefined();
    expect(w.sets).toHaveLength(1);
    await autoCloseWorkout(db, d.workout.id, T0 + RESUME_WINDOW_MS * 4); // second call changes nothing
    expect((await loadWorkout(db, d.workout.id))!.workout.endedAt).toBe(T0 + 60_000);
  });
});

describe('resolveOnLaunch', () => {
  it('none', async () => {
    expect(await resolveOnLaunch(db, T0)).toEqual({ kind: 'none' });
  });

  it('resumes within window', async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 1000), cur());
    const r = await resolveOnLaunch(db, T0 + 1000 + RESUME_WINDOW_MS - 1);
    expect(r.kind).toBe('resume');
    if (r.kind === 'resume') { expect(r.autoClosed).toBe(false); expect(r.data.sets).toHaveLength(1); }
  });

  it('stale with sets: auto-closed at last set', async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 1000), cur());
    const r = await resolveOnLaunch(db, T0 + 1000 + RESUME_WINDOW_MS + 1);
    expect(r).toEqual({ kind: 'closed', autoClosed: true });
    const w = (await loadWorkout(db, d.workout.id))!.workout;
    expect(w).toMatchObject({ status: 'finished', autoClosed: true, endedAt: T0 + 1000 });
    expect(w.cursor).toBeUndefined();
  });

  it('stale without sets: abandoned, not flagged', async () => {
    const d = await start();
    const r = await resolveOnLaunch(db, T0 + RESUME_WINDOW_MS + 1);
    expect(r).toEqual({ kind: 'closed', autoClosed: false });
    expect((await loadWorkout(db, d.workout.id))!.workout).toMatchObject({ status: 'abandoned', endedAt: T0 });
    expect((await loadWorkout(db, d.workout.id))!.workout.autoClosed).toBe(true);
  });

  it('clock moved back: resume', async () => {
    const d = await start();
    expect((await resolveOnLaunch(db, T0 - 10 * RESUME_WINDOW_MS)).kind).toBe('resume');
    expect((await loadWorkout(db, d.workout.id))!.workout.status).toBe('active');
  });

  it("cursor phase 'done': finished, not resumed", async () => {
    const d = await start();
    await logSet(db, input(d, 1, T0 + 10), cur({ phase: 'done' }));
    const r = await resolveOnLaunch(db, T0 + 20);
    expect(r.kind).toBe('closed');
    expect((await loadWorkout(db, d.workout.id))!.workout.status).toBe('finished');
  });
});

describe('planFromWorkout', () => {
  it('round-trips', async () => {
    const d = buildWorkout(plan, T0);
    expect(planFromWorkout(d)).toEqual(plan);
  });
});

describe('profileStats', () => {
  it('empty database', async () => {
    expect(await profileStats(db)).toEqual({ workouts: 0, sets: 0, since: null });
  });
  it('counts finished workouts and their work sets only', async () => {
    const a = await start(T0);
    await logSet(db, input(a, 1, T0 + 60_000), cur());
    await logSet(db, input(a, 2, T0 + 120_000), cur());
    await finishWorkout(db, a.workout.id, T0 + 200_000);
    const b = await start(T0 + 86_400_000); // still active — not counted
    await logSet(db, input(b, 1, T0 + 86_460_000), cur());
    expect(await profileStats(db)).toEqual({ workouts: 1, sets: 2, since: T0 });
  });
});
