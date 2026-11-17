<script lang="ts">
  // Two Everkinetic frames: start and end position. Lines are a mask, so they take the theme colour.
  import type { Exercise } from '../../data/catalog';
  import { frameUrl } from '../art/art';
  import { t } from '../strings';

  let { art, name }: { art: NonNullable<Exercise['technique']['art']>; name: string } = $props();
  const order = $derived(art.first === 'tension' ? (['tension', 'relaxation'] as const) : (['relaxation', 'tension'] as const));
</script>

<div class="frames" role="img" aria-label={t.catalog.frames(name)}>
  {#each order as f, i (f)}
    <div class="fr">
      <span class="num n">{i + 1}</span>
      <img class="pic lineart" src={frameUrl(art.id, f)} alt="" decoding="async" />
      <span class="cap">{i === 0 ? t.catalog.start : t.catalog.end}</span>
    </div>
  {/each}
</div>

<style>
  .frames { display: flex; gap: 8px; }
  .fr { flex: 1; min-width: 0; position: relative; border-radius: 18px; background: var(--card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); padding: 10px 8px 9px; display: flex; flex-direction: column; }
  .num {
    position: absolute; top: 9px; left: 9px; width: 22px; height: 22px; border-radius: 11px;
    background: var(--lime); color: var(--lime-ink); font-size: 13px; display: flex; align-items: center; justify-content: center;
  }
  .pic { width: 100%; height: 150px; }
  .cap { font-size: 13px; font-weight: 600; color: var(--t2); margin: 4px 2px 0; }
</style>
