import { describe, expect, it } from 'vitest';
import {
  EXERCISES, EQUIP, EQUIPMENT, MUSCLE, MUSCLES, PATTERN, PATTERNS, ZONES, RENAMED, exerciseById, weightStep, mainMuscle,
  matches, fitsEquipment, normalize, type Exercise,
} from './index';
import RELEASED from './released-ids.json';
import { ALL } from '../../preview-data';

const SHARES = new Set([1, 0.75, 0.5, 0.25]);
const ZONE_IDS = new Set<string>(ZONES.map((z) => z.id));
// files present in public/art/ek (keys only — nothing is loaded)
const ART = new Set(Object.keys(import.meta.glob('/public/art/ek/*.svg')).map((p) => p.split('/').pop()));
const existsSync = (file: string) => ART.has(file);
const bad = (pred: (e: Exercise) => boolean) => EXERCISES.filter(pred).map((e) => e.id);

describe('catalog integrity', () => {
  it('has 100–150 exercises', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(100);
    expect(EXERCISES.length).toBeLessThanOrEqual(150);
  });

  it('ids are unique kebab-case, Russian names are unique', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(bad((e) => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(e.id))).toEqual([]);
    const names = EXERCISES.map((e) => normalize(e.name.ru));
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  it('every released id still resolves and every id is released (ids are never deleted)', () => {
    expect((RELEASED as string[]).filter((id) => !exerciseById(id))).toEqual([]);
    expect(EXERCISES.map((e) => e.id).filter((id) => !(RELEASED as string[]).includes(id))).toEqual([]);
    for (const [from, to] of Object.entries(RENAMED)) { expect(EXERCISES.some((e) => e.id === from)).toBe(false); expect(exerciseById(to)).toBeTruthy(); }
  });

  it('preview exercises keep their ids in the catalog', () => {
    expect(ALL.map((e) => e.id).filter((id) => !exerciseById(id))).toEqual([]);
  });

  it('names, aliases and text fields are filled', () => {
    expect(bad((e) => !e.name.ru.trim() || !e.name.en.trim())).toEqual([]);
    expect(bad((e) => !e.station || !e.vectorKey || !e.transferGroup)).toEqual([]);
  });

  it('references are valid: patterns, equipment, muscles, zones', () => {
    expect(bad((e) => !PATTERN[e.pattern])).toEqual([]);
    expect(bad((e) => e.equipment.some((any) => any.length === 0 || any.some((id) => !EQUIP[id])))).toEqual([]);
    expect(bad((e) => Object.keys(e.muscles).some((m) => !(m in MUSCLE)))).toEqual([]);
    expect(bad((e) => e.contraindications.some((c) => !ZONE_IDS.has(c.zone) || !['avoid', 'modify'].includes(c.level)))).toEqual([]);
    expect(bad((e) => new Set(e.contraindications.map((c) => c.zone)).size !== e.contraindications.length)).toEqual([]);
  });

  it('muscle shares are 1 / .75 / .5 / .25 with exactly one main muscle', () => {
    expect(bad((e) => Object.values(e.muscles).some((v) => !SHARES.has(v!)))).toEqual([]);
    expect(bad((e) => Object.values(e.muscles).filter((v) => v === 1).length !== 1)).toEqual([]);
  });

  it('technique: 2–3 cues, formal tone, full stops', () => {
    expect(bad((e) => e.technique.cues.length < 2 || e.technique.cues.length > 3)).toEqual([]);
    expect(bad((e) => e.technique.cues.some((c) => !/^[А-ЯЁ]/.test(c) || !c.endsWith('.') || /[!?]/.test(c)))).toEqual([]);
    expect(bad((e) => e.technique.cues.some((c) => /\b(норм|качалк|добира|держи |давай)/i.test(c)))).toEqual([]);
  });

  it('pictures exist for every exercise and piece of equipment that has one', () => {
    expect(bad((e) => !!e.technique.art && ['relaxation', 'tension'].some((f) => !existsSync(`${e.technique.art!.id}-${f}.svg`)))).toEqual([]);
    expect(EQUIPMENT.filter((q) => q.art && !existsSync(`${q.art}-tension.svg`)).map((q) => q.id)).toEqual([]);
  });

  it('supersets are off for axial ≥ moderate or skill 3 (selection §7)', () => {
    expect(bad((e) => e.supersetOk && (e.axial === 'moderate' || e.axial === 'high' || e.skill === 3))).toEqual([]);
  });

  it('safety pins: only barbell; barbell bench presses and back/front squats need them (safety §5)', () => {
    expect(bad((e) => e.needsSafety && e.equipClass !== 'barbell')).toEqual([]);
    const pressOrSquat = (e: Exercise) => e.equipClass === 'barbell' && ['h_push', 'incline_push'].includes(e.pattern) && e.equipment.some((a) => a.includes('bench_flat') || a.includes('bench_adj'));
    const backSquat = (e: Exercise) => e.equipClass === 'barbell' && e.pattern === 'squat';
    expect(bad((e) => (pressOrSquat(e) || backSquat(e)) && !e.needsSafety)).toEqual([]);
  });

  it('weight step exists for loaded exercises, none only for body weight and bands', () => {
    expect(bad((e) => ['external', 'assisted', 'bodyweight_plus'].includes(e.load) && e.equipClass !== 'band' && !(weightStep(e)! > 0))).toEqual([]);
    expect(bad((e) => e.load === 'bodyweight' && weightStep(e) !== null)).toEqual([]);
  });

  it('novice exercises are not technically hard', () => {
    expect(bad((e) => e.minExperience === 'novice' && e.skill === 3)).toEqual([]);
  });

  it('shoulder-unfriendly movements are marked (safety §3)', () => {
    expect(bad((e) => /upright-row|behind-neck/.test(e.id) && !e.contraindications.some((c) => c.zone === 'shoulder' && c.level === 'avoid'))).toEqual([]);
    expect(bad((e) => e.axial === 'high' && !e.contraindications.some((c) => c.zone === 'lower_back'))).toEqual([]);
  });
});

describe('catalog coverage', () => {
  it('every pattern has at least 2 exercises', () => {
    expect(PATTERNS.filter((p) => EXERCISES.filter((e) => e.pattern === p.id).length < 2).map((p) => p.id)).toEqual([]);
  });

  it('every muscle is worked (share ≥ .5) by at least 3 exercises', () => {
    expect(MUSCLES.filter((m) => EXERCISES.filter((e) => (e.muscles[m.id] ?? 0) >= 0.5).length < 3).map((m) => m.id)).toEqual([]);
  });

  it('every muscle is the main one of at least 1 exercise, except forearms and lower back', () => {
    const mains = new Set(EXERCISES.map(mainMuscle));
    expect(MUSCLES.filter((m) => !mains.has(m.id)).map((m) => m.id).filter((m) => !['forearms', 'lower_back'].includes(m))).toEqual([]);
  });

  it('a dumbbells-only gym still reaches every large muscle', () => {
    const have = new Set(['dumbbells', 'bench_adj', 'bench_flat', 'mat']);
    const pool = EXERCISES.filter((e) => fitsEquipment(e, have));
    const large = MUSCLES.filter((m) => m.size === 'large').map((m) => m.id);
    expect(large.filter((m) => !pool.some((e) => (e.muscles[m] ?? 0) >= 0.5))).toEqual([]);
  });

  it('every piece of equipment is used by an exercise', () => {
    expect(EQUIPMENT.filter((q) => !EXERCISES.some((e) => e.equipment.some((a) => a.includes(q.id)))).map((q) => q.id)).toEqual([]);
  });
});

describe('search', () => {
  const bench = EXERCISES.find((e) => e.id === 'barbell-bench-press')!;
  it('matches by word starts, case and ё-insensitive, by English name', () => {
    expect(matches(bench, 'жим лёжа')).toBe(true);
    expect(matches(bench, 'ЖИМ ЛЕЖА')).toBe(true);
    expect(matches(bench, 'bench')).toBe(true);
    expect(matches(bench, 'жим стоя')).toBe(false);
    expect(matches(bench, '   ')).toBe(true);
  });
});
