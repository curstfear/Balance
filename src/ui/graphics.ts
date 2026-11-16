import { MUSCLES } from '../preview-data';

/** Annular sector with rounded corners (rounded via a same-colour stroke). */
function sector(c: number, r0: number, r1: number, a1: number, a2: number, rr: number, gap: number): string {
  const R0 = r0 + rr;
  const R1 = Math.max(r1 - rr, R0 + 1.5);
  const i0 = (gap / 2 + rr) / R0;
  const i1 = (gap / 2 + rr) / R1;
  const p = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
  return `M${p(R1, a1 + i1)}A${R1},${R1} 0 0 1 ${p(R1, a2 - i1)}L${p(R0, a2 - i0)}A${R0},${R0} 0 0 0 ${p(R0, a1 + i0)}Z`;
}

/** «Баланс недели»: one petal per muscle group, length = % of weekly target. */
export function flower(values: number[], size: number, score: number): string {
  const c = size / 2;
  const r0 = size * 0.19;
  const rmax = size / 2 - 2;
  let s = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Баланс недели ${score}">`;
  MUSCLES.forEach((m, k) => {
    const a1 = -Math.PI / 2 - Math.PI / 6 + (k * Math.PI) / 3;
    const a2 = a1 + Math.PI / 3;
    const col = `var(--c-${m.id})`;
    const r1 = r0 + ((rmax - r0) * Math.min(values[k], 100)) / 100;
    s += `<path d="${sector(c, r0, rmax, a1, a2, 5, 5)}" style="fill:${col};stroke:${col};opacity:.17" stroke-width="10" stroke-linejoin="round"/>`;
    s += `<path d="${sector(c, r0, r1, a1, a2, 5, 5)}" style="fill:${col};stroke:${col}" stroke-width="10" stroke-linejoin="round"/>`;
  });
  s += `<text x="${c}" y="${c + size * 0.055}" text-anchor="middle" style="font-family:var(--font-num);fill:var(--t1)" font-weight="700" font-size="${size * 0.16}">${score}</text></svg>`;
  return s;
}

export function weekRing(planned: boolean): string {
  return `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="none" style="stroke:${planned ? 'var(--t3)' : 'var(--ring-lime)'}" stroke-width="3.2" ${planned ? 'stroke-dasharray="3 4.2" stroke-linecap="round"' : ''}/></svg>`;
}

export function dumbbell(): string {
  return `<svg class="hero-glyph" viewBox="0 0 170 170" aria-hidden="true"><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C95FF"/><stop offset="1" stop-color="#2F6BF0"/></linearGradient></defs>
  <g transform="rotate(-35 85 85)" fill="url(#hg)">
    <rect x="58" y="78" width="54" height="14" rx="7"/>
    <rect x="30" y="50" width="26" height="70" rx="11"/><rect x="114" y="50" width="26" height="70" rx="11"/>
    <rect x="16" y="64" width="16" height="42" rx="7"/><rect x="138" y="64" width="16" height="42" rx="7"/>
  </g></svg>`;
}

export const REST_R = 128;
export const REST_C = 2 * Math.PI * REST_R;

export function restRing(): string {
  return `<svg viewBox="0 0 290 290" aria-hidden="true"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4FF3A"/><stop offset="1" stop-color="#30D5C8"/></linearGradient></defs>
  <circle cx="145" cy="145" r="${REST_R}" fill="none" stroke="rgba(48,213,200,.16)" stroke-width="22"/>
  <circle class="arc" cx="145" cy="145" r="${REST_R}" fill="none" stroke="url(#rg)" stroke-width="22" stroke-linecap="round" stroke-dasharray="${REST_C} ${REST_C}" transform="rotate(-90 145 145)"/></svg>`;
}
