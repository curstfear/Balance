import { describe, expect, it } from 'vitest';
import { similar, similarity } from './similar';
import type { Exercise } from '../data/catalog/types';

const base: Exercise = {
  id: 'a', name: { ru: 'A', en: 'A' }, aliases: [], equipment: [], equipClass: 'dumbbell', station: 'db_area', pattern: 'h_push',
  vectorKey: 'a', mechanics: 'compound', laterality: 'bilateral', muscles: { chest: 1, triceps: 0.5 }, lengthBias: 'mid',
  lengthenedPartialsOk: false, stability: 2, skill: 1, fatigue: 2, axial: 'none', needsSafety: false, gripLimited: false,
  load: 'external', supersetOk: true, minExperience: 'novice', contraindications: [], transferGroup: 'a',
  technique: { cues: ['А.', 'Б.'] }, custom: false, dataSource: 'curated',
};
const ex = (o: Partial<Exercise>): Exercise => ({ ...base, ...o });
const setup = () => 60;

describe('similar', () => {
  it('identical markup scores 0.85 (no history term)', () => {
    expect(similarity(base, ex({ id: 'b' }), setup)).toBeCloseTo(0.85);
  });

  it('prefers the same pattern and muscle mix, excludes other main muscles', () => {
    const pool = [
      base,
      ex({ id: 'same-key', vectorKey: 'a' }),
      ex({ id: 'fly', vectorKey: 'f', pattern: 'chest_fly', muscles: { chest: 1 } }),
      ex({ id: 'press', vectorKey: 'p', muscles: { chest: 1, triceps: 0.5, delt_front: 0.25 } }),
      ex({ id: 'row', vectorKey: 'r', muscles: { lats: 1 } }),
    ];
    expect(similar(base, pool, setup).map((e) => e.id)).toEqual(['same-key', 'press', 'fly']);
  });

  it('is deterministic on ties', () => {
    const pool = [ex({ id: 'z', vectorKey: 'z' }), ex({ id: 'y', vectorKey: 'y' })];
    expect(similar(base, pool, setup).map((e) => e.id)).toEqual(['y', 'z']);
  });
});
