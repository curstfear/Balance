<script lang="ts">
  import Icon from './Icon.svelte';
  import type { Exercise } from '../../preview-data';
  import { fmt } from '../format';
  import { t } from '../strings';

  let { exercise: e, index, onopen }: { exercise: Exercise; index: number; onopen?: () => void } = $props();
</script>

<div class="li">
  <div class="badge" style="--c:var(--c-{e.muscle})">{index}</div>
  <button class="body" aria-label={t.catalog.open(e.name)} onclick={onopen}>
    <div class="nm">{e.name}</div>
    <div class="sub"><span class="n">{e.sets} × {e.reps[0]}{e.reps[1] !== e.reps[0] ? '–' + e.reps[1] : ''}</span> · <span class="n">{fmt(e.weight)}</span>&nbsp;{t.units.kg}</div>
    <div class="why" class:up={e.up}><Icon name={e.up ? 'trendUp' : 'bolt'} size={13} />{e.why}</div>
  </button>
  <button class="swap press" aria-label="{t.plan.replace}: {e.name}"><Icon name="swap" /></button>
</div>

<style>
  .li { display: flex; gap: 12px; padding: 13px 14px; position: relative; }
  :global(.li + .li)::before { content: ''; position: absolute; top: 0; left: 56px; right: 0; height: .5px; background: var(--sep); }
  .badge {
    width: 30px; height: 30px; border-radius: 10px; flex: none; margin-top: 1px;
    display: flex; align-items: center; justify-content: center; font: 700 15px var(--font-num);
    background: color-mix(in srgb, var(--c) 20%, transparent); color: var(--c);
  }
  .body { flex: 1; min-width: 0; text-align: left; }
  .body:active .nm { opacity: .6; }
  .nm { font-size: 16px; font-weight: 600; letter-spacing: -.25px; }
  .sub { font-size: 15px; color: var(--t2); margin-top: 2px; }
  .sub .n { font-weight: 600; color: var(--t1); }
  .why { display: flex; align-items: center; gap: 5px; font-size: 13px; color: var(--t2); margin-top: 5px; }
  .why :global(.ic) { color: var(--accent-text); }
  .why.up { color: var(--accent-text); }
  .swap { color: var(--t3); align-self: flex-start; margin-top: 2px; padding: 2px; }
</style>
