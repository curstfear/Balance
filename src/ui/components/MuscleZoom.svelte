<script lang="ts">
  // Close-up of the anatomy atlas around the main muscle; worked muscles are tinted in their group colour.
  import { MUSCLE, type Exercise, type MuscleId } from '../../data/catalog';
  import { LAYERS } from '../art/overlays';
  import { CROP, atlasUrl, layerOpacity } from '../art/art';

  let { muscles, focus, label }: { muscles: Exercise['muscles']; focus: MuscleId; label: string } = $props();

  const crop = $derived(CROP[focus]);
  const layers = $derived(
    (Object.entries(muscles) as [MuscleId, number][])
      .filter(([, v]) => layerOpacity(v) > 0)
      .sort((a, b) => a[1] - b[1]) // main muscle on top
      .flatMap(([m, v]) => (LAYERS[m]?.[crop.view] ?? []).map((l) => ({ ...l, m, o: layerOpacity(v) }))),
  );
</script>

<svg viewBox={crop.box.join(' ')} preserveAspectRatio="xMidYMid slice" role="img" aria-label={label}>
  <image href={atlasUrl(crop.view)} width="200" height="369" />
  {#each layers as l, i (i)}
    <g transform={l.t} fill="var(--c-{MUSCLE[l.m].group})" opacity={l.o}>
      {#each l.d as d, k (k)}<path {d} />{/each}
    </g>
  {/each}
</svg>

<style>
  svg { display: block; width: 100%; height: 100%; }
</style>
