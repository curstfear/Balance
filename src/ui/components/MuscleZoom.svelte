<script lang="ts">
  // Close-up of the anatomy atlas around the main muscle; worked muscles are tinted in their group colour.
  import { MUSCLE, type Exercise, type MuscleId } from '../../data/catalog';
  import { LAYERS } from '../art/overlays';
  import { CROP, atlasUrl, layerOpacity } from '../art/art';

  /** delay — ms before the atlas is drawn: rasterising it during the push transition makes the slide stutter */
  let { muscles, focus, label, delay = 0 }: { muscles: Exercise['muscles']; focus: MuscleId; label: string; delay?: number } = $props();

  let shown = $state(false);
  $effect(() => {
    const id = setTimeout(() => (shown = true), delay);
    return () => clearTimeout(id);
  });

  const crop = $derived(CROP[focus]);
  const layers = $derived(
    (Object.entries(muscles) as [MuscleId, number][])
      .filter(([, v]) => layerOpacity(v) > 0)
      .sort((a, b) => a[1] - b[1]) // main muscle on top
      .flatMap(([m, v]) => (LAYERS[m]?.[crop.view] ?? []).map((l) => ({ ...l, m, o: layerOpacity(v) }))),
  );
</script>

<svg viewBox={crop.box.join(' ')} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} class:shown>
  {#if shown}
    <image href={atlasUrl(crop.view)} width="200" height="369" />
    {#each layers as l, i (i)}
      <g transform={l.t} fill="var(--c-{MUSCLE[l.m].group})" opacity={l.o}>
        {#each l.d as d, k (k)}<path {d} />{/each}
      </g>
    {/each}
  {/if}
</svg>

<style>
  svg { display: block; width: 100%; height: 100%; opacity: 0; transition: opacity .25s ease-out; }
  svg.shown { opacity: 1; }
  @media (prefers-reduced-motion: reduce) { svg { transition: none; } }
</style>
