<script lang="ts">
  import Segmented from '../components/Segmented.svelte';
  import Button from '../components/Button.svelte';
  import Dock from '../components/Dock.svelte';
  import Icon from '../components/Icon.svelte';
  import ExerciseRow from '../components/ExerciseRow.svelte';
  import Workout from './Workout.svelte';
  import { planFor, totals } from '../../preview-data';
  import { push, pop, haptic } from '../nav.svelte';
  import { fmt } from '../format';
  import { t } from '../strings';
  import { storageReady } from '../../data/storage.svelte';

  type Minutes = 45 | 55 | 70;
  let minutes = $state<Minutes>(55);
  const plan = $derived(planFor(minutes));
  const sum = $derived(totals(plan));
  const options = ([45, 55, 70] as Minutes[]).map((m) => ({ value: m, label: `${m} ${t.units.min}` }));

  async function start() {
    haptic(15);
    await storageReady; // otherwise a workout started on a slow cold launch would stay in memory only
    push(Workout, { plan }, 'modal');
  }
</script>

<div class="scroll">
  <nav class="row navbar">
    <button class="back press" onclick={pop}><Icon name="chevL" size={24} /><span>{t.plan.back}</span></button>
  </nav>
  <div class="eyebrow" style="margin-top:6px">{t.plan.eyebrow}</div>
  <h1 class="large" style="margin-top:2px">{plan.title}</h1>
  <div style="margin-top:14px"><Segmented {options} bind:value={minutes} label={t.plan.duration} onchange={() => haptic()} /></div>

  <div class="stats">
    <div><div class="eyebrow">{t.plan.sets}</div><div class="n" style="color:var(--blue)">{sum.sets}</div></div>
    <div style="flex:1.2"><div class="eyebrow">{t.plan.volume}</div><div class="n" style="color:var(--lime)">{fmt(sum.tonnage / 1000, 1)}<span class="u">{t.units.t}</span></div></div>
    <div><div class="eyebrow">{t.plan.time}</div><div class="n" style="color:var(--yellow)">{minutes}<span class="u">{t.units.min}</span></div></div>
  </div>

  <div class="sec">{t.plan.warmup}</div>
  <div class="list">
    <div class="warm">
      <div class="badge"><Icon name="flame" size={16} /></div>
      <div><div class="nm">{t.plan.warmupName}</div><div class="sub">{t.plan.warmupNote}</div></div>
    </div>
  </div>

  <div class="sec">{t.plan.main}</div>
  <div class="list">
    {#each plan.exercises as e, i (e.name)}<ExerciseRow exercise={e} index={i + 1} />{/each}
  </div>
</div>

<Dock><Button icon="play" grow onclick={start}>{t.plan.start}</Button></Dock>

<style>
  .navbar { height: 44px; margin: 0 -6px; }
  .back { display: flex; align-items: center; height: 44px; padding: 0 6px; color: var(--accent-text); font-size: 17px; }
  .stats { display: flex; margin: 18px 4px 2px; }
  .stats > div { flex: 1; }
  .stats .eyebrow { font-size: 12px; }
  .stats .n { font-size: 30px; }
  .sec { font-size: 13px; font-weight: 600; color: var(--t2); text-transform: uppercase; margin: 20px 14px 7px; }
  .list { background: var(--card); border-radius: var(--r-list); overflow: hidden; box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .warm { display: flex; gap: 12px; align-items: center; padding: 13px 14px; }
  .badge { width: 30px; height: 30px; border-radius: 10px; flex: none; display: flex; align-items: center; justify-content: center; background: var(--fill2); color: var(--t2); }
  .nm { font-size: 16px; font-weight: 600; letter-spacing: -.25px; }
  .sub { font-size: 15px; color: var(--t2); margin-top: 2px; }
</style>
