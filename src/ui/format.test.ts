import { describe, expect, it } from 'vitest';
import { clock, fmt } from './format';

const NBSP = ' ';

describe('fmt', () => {
  it('uses a decimal comma', () => expect(fmt(62.5)).toBe('62,5'));
  it('drops trailing zeros', () => expect(fmt(60)).toBe('60'));
  it('groups thousands with a non-breaking space', () => expect(fmt(6340, 0)).toBe(`6${NBSP}340`));
  it('uses a real minus sign', () => expect(fmt(-25)).toBe('−25'));
  it('rounds to the requested precision', () => expect(fmt(4.468, 1)).toBe('4,5'));
});

describe('clock', () => {
  it('formats minutes and seconds', () => expect(clock(84)).toBe('1:24'));
  it('pads seconds', () => expect(clock(65)).toBe('1:05'));
  it('never goes negative', () => expect(clock(-3)).toBe('0:00'));
  it('rounds fractions', () => expect(clock(119.6)).toBe('2:00'));
});
