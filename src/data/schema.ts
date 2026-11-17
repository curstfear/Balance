// Records stored in IndexedDB. Raw facts only — derived values (volume, records, e1RM) are computed.
// Spec: docs/data-model.md. Timestamps are epoch ms; calendar dates are local 'YYYY-MM-DD' strings.

export type Epoch = number;
export type LocalDate = string;

export type Muscle = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
export type PainLevel = 'none' | 'tolerable' | 'acute';
export type SetKind = 'ramp' | 'warmup' | 'work' | 'calibration';
export type WorkoutStatus = 'planned' | 'active' | 'finished' | 'abandoned';

/** The single profile record (id 'me'). Filled by onboarding (stage 4). */
export interface Profile {
  id: 'me';
  sex?: 'm' | 'f';
  birthDate?: LocalDate;
  heightCm?: number;
  experience?: 'none' | 'lt1y' | '1to3y' | 'gt3y';
  goal?: 'muscle' | 'strength' | 'fitness' | 'fatloss';
  priorityMuscles: Muscle[];
  workoutsPerWeek?: number;
  minutesPerWorkout?: number;
  units: 'kg';
  onboardedAt?: Epoch;
  supersets: 'auto' | 'always' | 'never';
  rirBias: number;
  rirBiasAt?: Epoch;
}

export interface Gym {
  id: string;
  name: string;
  equipment: string[];
  /** rack / safety pins available */
  safety: boolean;
  weightSteps: { dumbbells: number[]; stack: number; microPlates: number[] };
  isDefault: boolean;
}

/** Where the person stopped inside an active workout — lets the app resume on the same set. */
export interface Cursor {
  ex: number;
  weight: number;
  reps: number;
  rir: number | null;
  pain: PainLevel | null;
  phase: 'set' | 'rest' | 'done';
  restEnd: Epoch;
  restTotal: number;
  note: string;
}

export interface Workout {
  id: string;
  gymId?: string;
  title: string;
  status: WorkoutStatus;
  startedAt: Epoch;
  endedAt?: Epoch;
  /** last set or input — decides between resume and auto-close on launch */
  lastActivityAt: Epoch;
  checkin?: { sleep?: number; feeling?: number; ill?: boolean; zones?: string[] };
  modes: string[];
  engineVersion: string;
  seed: number;
  note?: string;
  rating?: number;
  cursor?: Cursor;
  /** closed by the app because it was left open too long */
  autoClosed?: boolean;
}

export interface Reason { code: string; params?: Record<string, string | number> }

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  /** snapshot: history stays readable even if the catalog entry changes or disappears */
  name: string;
  muscle: Muscle;
  order: number;
  reasons: Reason[];
  target: { sets: number; reps: [number, number]; weight: number; rir?: number; rest: number; step: number };
  replacedFrom?: { exerciseId: string; reason: 'busy' | 'dislike' | 'pain' };
  skipped?: boolean;
  supersetGroup?: number;
}

/** The main raw fact. id = `${workoutExerciseId}:${index}` so a repeated write never duplicates a set. */
export interface SetRecord {
  id: string;
  workoutId: string;
  workoutExerciseId: string;
  exerciseId: string;
  /** 1-based */
  index: number;
  kind: SetKind;
  weight: number;
  reps: number;
  /** as entered, 0…3 (3 = «3+»); null when not marked */
  rir: number | null;
  pain: PainLevel;
  doneAt: Epoch;
  /** seconds of rest before this set */
  restBefore?: number;
}

export interface BodyMetric {
  id: string;
  date: LocalDate;
  weight?: number;
  fatPct?: number;
  girths?: Partial<Record<'waist' | 'chest' | 'hip' | 'arm', number>>;
}

/** The single settings record (id 'app'). */
export interface Settings {
  id: 'app';
  theme: 'system' | 'dark' | 'light';
  sound: boolean;
  vibration: boolean;
  backupReminder: boolean;
  lastBackupAt?: Epoch;
  installHintHiddenUntil?: Epoch;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  theme: 'system',
  sound: true,
  vibration: true,
  backupReminder: true,
};
