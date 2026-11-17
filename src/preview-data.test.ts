import { describe, expect, it } from 'vitest';
import { planFor, totals } from './preview-data';

describe('preview plans', () => {
  it('longer sessions have more sets', () => {
    const s = [45, 55, 70].map((m) => totals(planFor(m as 45 | 55 | 70)).sets);
    expect(s[0]).toBeLessThan(s[1]);
    expect(s[1]).toBeLessThan(s[2]);
  });
  it('assisted exercises do not add negative tonnage', () => {
    for (const m of [45, 55, 70] as const) expect(totals(planFor(m)).tonnage).toBeGreaterThan(0);
  });
});
