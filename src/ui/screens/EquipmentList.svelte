<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Exercises from './Exercises.svelte';
  import { EQUIPMENT, EXERCISES, usesEquipment } from '../../data/catalog';
  import { frameUrl } from '../art/art';
  import { push, pop } from '../nav.svelte';
  import { t } from '../strings';

  const items = EQUIPMENT.map((q) => ({ ...q, n: EXERCISES.filter((e) => usesEquipment(e, q.id)).length }));
</script>

<div class="scroll">
  <nav class="row navbar">
    <button class="back press" onclick={pop}><Icon name="chevL" size={24} /><span>{t.profile.title}</span></button>
  </nav>
  <h1 class="large title">{t.equipment.title}</h1>

  <div class="grid">
    {#each items as q (q.id)}
      <button class="eq press" aria-label="{q.name}, {t.equipment.exercises(q.n)}" onclick={() => push(Exercises, { back: t.equipment.title, equipment: q.id })}>
        {#if q.art}<span class="pic" style="--src:url('{frameUrl(q.art, 'tension')}')"></span>{:else}<span class="ph"><Icon name="stack" size={30} /></span>{/if}
        <span class="nm">{q.name}</span>
        <span class="sub">{t.equipment.exercises(q.n)}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .navbar { height: 44px; margin: 0 -6px; }
  .back { display: flex; align-items: center; height: 44px; padding: 0 6px; color: var(--accent-text); font-size: 17px; }
  .title { margin: 2px 0 14px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .eq { display: flex; flex-direction: column; text-align: left; padding: 12px 14px 14px; border-radius: var(--r-list); background: var(--card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); min-height: 190px; }
  .pic { display: block; height: 112px; margin-bottom: 10px; background: var(--t1); opacity: .85; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
  .ph { height: 112px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: var(--t3); border-radius: 14px; background: var(--fill2); }
  .nm { font-size: 16px; font-weight: 600; line-height: 20px; letter-spacing: -.2px; }
  .sub { font-size: 13px; color: var(--t2); margin-top: auto; padding-top: 4px; }
</style>
