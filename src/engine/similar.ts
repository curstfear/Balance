// Substitutes for an exercise — the static part of sim() from exercise-selection §4.
// History, skill limits and the gym's equipment are added by the engine (stage 3); here: catalog data only.
import type { Exercise, MuscleId } from '../data/catalog/types';

function cosine(a: Exercise['muscles'], b: Exercise['muscles']): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<MuscleId>;
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const x = a[k] ?? 0, y = b[k] ?? 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** sim(x, y) without the history and skill terms: 0.45·cos(muscles) + 0.2·pattern + 0.1·lengthBias + 0.1·[setup ≤ 60 s] */
export function similarity(x: Exercise, y: Exercise, setupSec: (e: Exercise) => number): number {
  return 0.45 * cosine(x.muscles, y.muscles)
    + 0.2 * (x.pattern === y.pattern ? 1 : 0)
    + 0.1 * (x.lengthBias === y.lengthBias ? 1 : 0)
    + 0.1 * (setupSec(y) <= 60 ? 1 : 0);
}

/** Top-n substitutes: same main muscle, not the same movement (vectorKey), most similar first; ties by id. */
export function similar(x: Exercise, pool: Exercise[], setupSec: (e: Exercise) => number, n = 3): Exercise[] {
  const main = (e: Exercise) => Object.entries(e.muscles).find(([, v]) => v === 1)?.[0];
  return pool
    .filter((y) => y.id !== x.id && y.vectorKey !== x.vectorKey && main(y) === main(x))
    .map((y) => ({ y, s: similarity(x, y, setupSec) }))
    .sort((a, b) => b.s - a.s || a.y.id.localeCompare(b.y.id))
    .slice(0, n)
    .map(({ y }) => y);
}
