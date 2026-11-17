// Workout persistence: a set is written the moment it is entered, together with the cursor
// (where the person stopped), so a workout survives closing the app or rebooting the phone.
// Records are always built field by field: Svelte $state proxies cannot be structured-cloned.
import { uid, type BalanceDB } from './db';
import type { Cursor, Epoch, Muscle, PainLevel, SetRecord, Workout, WorkoutExercise } from './schema';

/** Rules the workout was built with; the preview has no engine yet. */
export const ENGINE_VERSION = 'preview-0';
/** A workout left without input for longer than this is closed on the next launch instead of resumed. */
export const RESUME_WINDOW_MS = 4 * 60 * 60 * 1000;

export interface PlanInput {
  title: string;
  exercises: readonly {
    id: string; muscle: Muscle; name: string; sets: number; reps: readonly [number, number];
    weight: number; step: number; rest: number; why: string;
  }[];
}

export interface WorkoutData { workout: Workout; exercises: WorkoutExercise[]; sets: SetRecord[] }

export interface SetInput {
  workoutId: string; workoutExerciseId: string; exerciseId: string; index: number;
  weight: number; reps: number; rir: number | null; pain: PainLevel | null; doneAt: number; restBefore?: number;
}

export type Launch =
  | { kind: 'none' }
  | { kind: 'resume'; data: WorkoutData; autoClosed: boolean }
  | { kind: 'closed'; autoClosed: boolean };

export function cursorOf(c: Cursor): Cursor {
  return {
    ex: c.ex, weight: c.weight, reps: c.reps, rir: c.rir, pain: c.pain, phase: c.phase,
    restEnd: c.restEnd, restTotal: c.restTotal, note: c.note,
  };
}

export function firstCursor(plan: PlanInput): Cursor {
  const e = plan.exercises[0];
  return { ex: 0, weight: e.weight, reps: e.reps[0], rir: null, pain: null, phase: 'set', restEnd: 0, restTotal: 0, note: '' };
}

/** Records of a new workout, built synchronously so the UI has ids before the write finishes. */
export function buildWorkout(plan: PlanInput, now: number): WorkoutData {
  const workout: Workout = {
    id: uid(), title: plan.title, status: 'active', startedAt: now, lastActivityAt: now,
    modes: [], engineVersion: ENGINE_VERSION, seed: Math.floor(Math.random() * 2 ** 31),
    cursor: firstCursor(plan),
  };
  const exercises = plan.exercises.map((e, i): WorkoutExercise => ({
    id: uid(), workoutId: workout.id, exerciseId: e.id, name: e.name, muscle: e.muscle, order: i,
    reasons: e.why ? [{ code: 'preview', params: { text: e.why } }] : [],
    target: { sets: e.sets, reps: [e.reps[0], e.reps[1]], weight: e.weight, rest: e.rest, step: e.step },
  }));
  return { workout, exercises, sets: [] };
}

export function setRecord(s: SetInput): SetRecord {
  const r: SetRecord = {
    id: `${s.workoutExerciseId}:${s.index}`, workoutId: s.workoutId, workoutExerciseId: s.workoutExerciseId,
    exerciseId: s.exerciseId, index: s.index, kind: 'work', weight: s.weight, reps: s.reps,
    rir: s.rir, pain: s.pain ?? 'none', doneAt: s.doneAt,
  };
  if (s.restBefore !== undefined) r.restBefore = s.restBefore;
  return r;
}

/** Saves a new workout. Only one workout can be active: any other one is closed first. */
export async function saveNewWorkout(db: BalanceDB, data: WorkoutData) {
  await db.transaction('rw', db.workouts, db.workoutExercises, db.sets, async () => {
    const others = await db.workouts.where('status').equals('active').toArray();
    for (const w of others) await close(db, w, data.workout.startedAt, true);
    await db.workouts.add(data.workout);
    await db.workoutExercises.bulkAdd(data.exercises);
  });
}

export async function logSet(db: BalanceDB, s: SetInput, cursor: Cursor) {
  const rec = setRecord(s);
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const w = await db.workouts.get(s.workoutId);
    if (!w) throw new Error(`logSet: workout ${s.workoutId} not found`); // never leave orphan sets
    // a repeated write of the same set (double tap, retry) replaces it instead of adding a copy
    await db.sets.put(rec);
    if (w.status === 'active') await db.workouts.update(w.id, { cursor: cursorOf(cursor), lastActivityAt: s.doneAt });
    // a late write after closing without sets: the workout now has a set, so it counts as finished
    else if (w.status === 'abandoned') await db.workouts.update(w.id, { status: 'finished' });
  });
}

export async function saveCursor(db: BalanceDB, workoutId: string, cursor: Cursor, now: number) {
  // only while active: a late debounced save must not reopen a finished workout
  await db.workouts.where('id').equals(workoutId).and((w) => w.status === 'active')
    .modify({ cursor: cursorOf(cursor), lastActivityAt: now });
}

/** Ends a workout. Nothing is deleted: without sets it is kept as 'abandoned'. */
export async function finishWorkout(db: BalanceDB, id: string, now: number) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const w = await db.workouts.get(id);
    if (w && w.status === 'active') await close(db, w, now, false);
  });
}

/** Closes a workout left too long without input, as on launch: ends at the last set, sets kept. */
export async function autoCloseWorkout(db: BalanceDB, id: string, now: number) {
  await db.transaction('rw', db.workouts, db.sets, async () => {
    const w = await db.workouts.get(id);
    if (w && w.status === 'active') await close(db, w, now, true);
  });
}

async function close(db: BalanceDB, w: Workout, now: number, auto: boolean) {
  const sets = await db.sets.where('workoutId').equals(w.id).sortBy('doneAt');
  const last = sets[sets.length - 1];
  const changes: Partial<Workout> = {
    status: sets.length ? 'finished' : 'abandoned',
    // an auto-closed workout ends when the person actually stopped, not when the app noticed
    endedAt: auto ? (last?.doneAt ?? w.startedAt) : now,
    cursor: undefined, // Dexie removes the key
  };
  if (auto) changes.autoClosed = true;
  await db.workouts.update(w.id, changes);
  return sets.length > 0;
}

export async function loadWorkout(db: BalanceDB, id: string): Promise<WorkoutData | undefined> {
  const workout = await db.workouts.get(id);
  if (!workout) return undefined;
  const [exercises, sets] = await Promise.all([
    db.workoutExercises.where('workoutId').equals(id).sortBy('order'),
    db.sets.where('workoutId').equals(id).toArray(),
  ]);
  sets.sort((a, b) => a.doneAt - b.doneAt || a.index - b.index);
  return { workout, exercises, sets };
}

/**
 * On launch: resume the active workout if it was touched recently, otherwise close it
 * (sets kept). `autoClosed` is true when a workout with sets was closed — the UI says so once.
 */
export async function resolveOnLaunch(db: BalanceDB, now: number, windowMs = RESUME_WINDOW_MS): Promise<Launch> {
  return db.transaction('rw', db.workouts, db.workoutExercises, db.sets, async () => {
    const active = (await db.workouts.where('status').equals('active').toArray())
      .sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    if (!active.length) return { kind: 'none' } as Launch;

    let autoClosed = false;
    let resume: Workout | undefined;
    for (const w of active) {
      const idle = now - w.lastActivityAt; // negative if the clock moved back — treat as fresh
      if (!resume && idle <= windowMs && w.cursor && w.cursor.phase !== 'done') { resume = w; continue; }
      if (w.cursor?.phase === 'done') await close(db, w, w.lastActivityAt, false);
      else if (await close(db, w, now, true)) autoClosed = true;
    }
    if (!resume) return { kind: 'closed', autoClosed } as Launch;
    const data = await loadWorkout(db, resume.id);
    return (data ? { kind: 'resume', data, autoClosed } : { kind: 'closed', autoClosed }) as Launch;
  });
}

/** The plan of a stored workout, from the snapshots in its exercises. */
export function planFromWorkout(data: WorkoutData): PlanInput {
  return {
    title: data.workout.title,
    exercises: data.exercises.map((e) => ({
      id: e.exerciseId, muscle: e.muscle, name: e.name, sets: e.target.sets, reps: e.target.reps,
      weight: e.target.weight, step: e.target.step, rest: e.target.rest,
      why: String(e.reasons.find((r) => r.code === 'preview')?.params?.text ?? ''),
    })),
  };
}

export interface ProfileStats { workouts: number; sets: number; since: Epoch | null }

/** Numbers for the profile card: finished workouts, work sets, date of the first workout. Computed, not stored. */
export async function profileStats(db: BalanceDB): Promise<ProfileStats> {
  const done = await db.workouts.where('status').equals('finished').toArray();
  const ids = new Set(done.map((w) => w.id));
  const sets = ids.size ? (await db.sets.where('workoutId').anyOf([...ids]).toArray()).filter((s) => s.kind === 'work').length : 0;
  const since = done.length ? Math.min(...done.map((w) => w.startedAt)) : null;
  return { workouts: done.length, sets, since };
}
