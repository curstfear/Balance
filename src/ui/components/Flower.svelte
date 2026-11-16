<script lang="ts">
  import { MUSCLES } from '../../preview-data';
  import { t } from '../strings';

  // «Баланс недели»: one petal per muscle group, length = % of the weekly target.
  let { values, size = 150, score }: { values: number[]; size?: number; score: number } = $props();

  function sector(c: number, r0: number, r1: number, a1: number, a2: number, rr = 5, gap = 5): string {
    const R0 = r0 + rr;
    const R1 = Math.max(r1 - rr, R0 + 1.5);
    const i0 = (gap / 2 + rr) / R0;
    const i1 = (gap / 2 + rr) / R1;
    const p = (r: number, a: number) => `${(c + r * Math.cos(a)).toFixed(2)},${(c + r * Math.sin(a)).toFixed(2)}`;
    return `M${p(R1, a1 + i1)}A${R1},${R1} 0 0 1 ${p(R1, a2 - i1)}L${p(R0, a2 - i0)}A${R0},${R0} 0 0 0 ${p(R0, a1 + i0)}Z`;
  }

  const petals = $derived.by(() => {
    const c = size / 2, r0 = size * 0.19, rmax = size / 2 - 2;
    return MUSCLES.map((m, k) => {
      const a1 = -Math.PI / 2 - Math.PI / 6 + (k * Math.PI) / 3;
      const a2 = a1 + Math.PI / 3;
      return {
        id: m.id,
        track: sector(c, r0, rmax, a1, a2),
        fill: sector(c, r0, r0 + ((rmax - r0) * Math.min(values[k], 100)) / 100, a1, a2),
      };
    });
  });
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" role="img" aria-label="{t.home.balance}: {score}">
  {#each petals as p (p.id)}
    <path d={p.track} class="track" style="--c:var(--c-{p.id})" />
    <path d={p.fill} class="petal" style="--c:var(--c-{p.id})" />
  {/each}
  <text x={size / 2} y={size / 2 + size * 0.055} text-anchor="middle" font-size={size * 0.16}>{score}</text>
</svg>

<style>
  svg { flex: none; }
  path { fill: var(--c); stroke: var(--c); stroke-width: 10; stroke-linejoin: round; }
  .track { opacity: .17; }
  .petal { transition: d .6s var(--ease-ios); }
  text { font-family: var(--font-num); font-weight: 700; fill: var(--t1); }
</style>
