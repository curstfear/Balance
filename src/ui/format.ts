const cache = new Map<number, Intl.NumberFormat>();

/** Russian number formatting: 62,5 · 6 340 · −25 */
export function fmt(n: number, maxFrac = 1): string {
  let f = cache.get(maxFrac);
  if (!f) { f = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: maxFrac }); cache.set(maxFrac, f); }
  return f.format(n).replace('-', '−');
}

export function clock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
