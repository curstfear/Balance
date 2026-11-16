<script lang="ts">
  import type { Snippet } from 'svelte';

  /** progress 0..1 of the rest that has passed */
  let { progress, children }: { progress: number; children: Snippet } = $props();

  const R = 128;
  const C = 2 * Math.PI * R;
</script>

<div class="ring">
  <svg viewBox="0 0 290 290" aria-hidden="true">
    <defs><linearGradient id="rest-grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4FF3A" /><stop offset="1" stop-color="#30D5C8" /></linearGradient></defs>
    <circle cx="145" cy="145" r={R} class="track" />
    <circle cx="145" cy="145" r={R} class="arc" stroke-dasharray="{C} {C}" stroke-dashoffset={C * Math.min(1, Math.max(0, progress))} transform="rotate(-90 145 145)" />
  </svg>
  <div class="mid">{@render children()}</div>
</div>

<style>
  .ring { position: relative; width: min(290px, 40vh); aspect-ratio: 1; margin: 18px auto 0; }
  svg { width: 100%; height: 100%; }
  circle { fill: none; stroke-width: 22; }
  .track { stroke: rgba(48, 213, 200, .16); }
  .arc { stroke: url(#rest-grad); stroke-linecap: round; }
  .mid { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
</style>
