import { describe, expect, it } from 'vitest';
import { FORMS, plural, t } from './strings';

describe('plural', () => {
  const cases: [number, string][] = [
    [1, 'подход'], [2, 'подхода'], [4, 'подхода'], [5, 'подходов'], [11, 'подходов'], [12, 'подходов'],
    [14, 'подходов'], [21, 'подход'], [22, 'подхода'], [25, 'подходов'], [101, 'подход'], [111, 'подходов'], [0, 'подходов'],
  ];
  it.each(cases)('%i → %s', (n, word) => expect(plural(n, FORMS.set)).toBe(word));
});

describe('interface texts', () => {
  // tone rule from docs/roadmap.md «Тексты интерфейса»
  const all = JSON.stringify(t, (_k, v) => (typeof v === 'function' ? v(1, 2) : v));
  it.each(['норм', 'добира', 'качалк', '!'])('contain no «%s»', (word) => expect(all.toLowerCase()).not.toContain(word));
  it('keep units glued to numbers', () => {
    expect(t.workout.notes.easy('5')).toContain('5 кг');
    expect(t.workout.notes.failure('2,5')).toContain('2,5 кг');
  });
});
