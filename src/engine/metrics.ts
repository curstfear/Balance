// Derived metrics — computed from raw sets every time, never stored (docs/data-model.md).
// Formulas: docs/engine/load-and-progression.md §1 (volume) and §5 (e1RM).
import type { Muscle, SetKind } from '../data/schema';

export const E1RM_MAX_REPS = 12; // config.md: e1RM max reps + RIR
export const WORK_SET_MAX_RIR = 4; // config.md: a set counts as working at RIR ≤ 4
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface SetFact {
  id?: string;
  exerciseId: string;
  kind: SetKind;
  weight: number;
  reps: number;
  rir: number | null;
  doneAt: number;
}

/** muscle → contribution (1 / 0.75 / 0.5 / 0.25) per exercise; comes from the catalog (stage 2) */
export type Contributions = Record<string, Partial<Record<Muscle, number>>>;

/**
 * Estimated one-rep max, Epley with reps in reserve: w · (1 + (r + RIR) / 30).
 * r + RIR = 1 → w; r + RIR > 12 or unknown RIR → null (not updated). Assisted (negative) weights → null.
 */
export function e1rm(weight: number, reps: number, rir: number | null, bias = 0): number | null {
  if (rir === null || weight <= 0 || reps <= 0) return null;
  const total = reps + Math.max(0, rir + bias);
  if (total > E1RM_MAX_REPS) return null;
  if (total <= 1) return weight;
  return weight * (1 + total / 30);
}

export const isWorkSet = (s: SetFact, bias = 0) =>
  (s.kind === 'work' || s.kind === 'calibration') && s.reps > 0 && (s.rir === null || s.rir + bias <= WORK_SET_MAX_RIR);

/**
 * Weekly volume: working sets in [to − 7 days, to), each counted with its contribution.
 * 1 / 0.75 / 0.5 count as is; 0.25 (stabiliser) adds nothing to volume.
 */
export function volumeByMuscle(sets: readonly SetFact[], contrib: Contributions, to: number, from = to - WEEK_MS, bias = 0) {
  const out: Partial<Record<Muscle, number>> = {};
  for (const s of sets) {
    if (s.doneAt < from || s.doneAt >= to || !isWorkSet(s, bias)) continue;
    for (const [m, c] of Object.entries(contrib[s.exerciseId] ?? {}) as [Muscle, number][]) {
      if (c < 0.5) continue;
      out[m] = (out[m] ?? 0) + c;
    }
  }
  return out;
}

export function tonnage(sets: readonly SetFact[]) {
  return sets.reduce((a, s) => a + (s.kind === 'work' || s.kind === 'calibration' ? Math.max(0, s.weight) * s.reps : 0), 0);
}

export interface Best { value: number; set: SetFact }
export interface Records { e1rm?: Best; weight?: Best; setVolume?: Best }

/** Personal records per exercise over working sets: best e1RM, heaviest weight, biggest weight × reps. */
export function records(sets: readonly SetFact[], bias = 0): Record<string, Records> {
  const out: Record<string, Records> = {};
  const better = (cur: Best | undefined, value: number, set: SetFact) =>
    !cur || value > cur.value || (value === cur.value && set.doneAt < cur.set.doneAt) ? { value, set } : cur;
  for (const s of sets) {
    if (!isWorkSet(s, bias) || s.weight <= 0) continue;
    const r = (out[s.exerciseId] ??= {});
    const est = e1rm(s.weight, s.reps, s.rir, bias);
    if (est !== null) r.e1rm = better(r.e1rm, est, s);
    r.weight = better(r.weight, s.weight, s);
    r.setVolume = better(r.setVolume, s.weight * s.reps, s);
  }
  return out;
}
