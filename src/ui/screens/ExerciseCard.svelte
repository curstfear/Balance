<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import Chip from '../components/Chip.svelte';
  import MuscleZoom from '../components/MuscleZoom.svelte';
  import Frames from '../components/Frames.svelte';
  import ExerciseThumb from '../components/ExerciseThumb.svelte';
  import ExerciseCard from './ExerciseCard.svelte';
  import { EQUIP, EXERCISES, MUSCLE, ZONES, exerciseById, mainMuscle, musclesByShare, setupSec, weightStep } from '../../data/catalog';
  import { similar } from '../../engine/similar';
  import { push, pop } from '../nav.svelte';
  import { fmt } from '../format';
  import { t } from '../strings';

  let { id, back }: { id: string; back: string } = $props();

  const e = $derived(exerciseById(id));
  const main = $derived(e ? mainMuscle(e) : null);
  const list = $derived(e ? musclesByShare(e) : []);
  const helpers = $derived(list.slice(1).filter(([, v]) => v >= 0.5).map(([m]) => MUSCLE[m].name.toLowerCase()));
  const equipment = $derived(e ? e.equipment.map((any) => any.map((q) => EQUIP[q].name).join(` ${t.catalog.or} `)) : []);
  const step = $derived(e ? weightStep(e) : null);
  const subs = $derived(e ? similar(e, EXERCISES, setupSec) : []);
  const zone = (z: string) => ZONES.find((x) => x.id === z)?.name ?? z;
</script>

<div class="scroll">
  <nav class="row navbar">
    <button class="back press" onclick={pop}><Icon name="chevL" size={24} /><span>{back}</span></button>
  </nav>

  {#if e && main}
    <div class="hero">
      <MuscleZoom muscles={e.muscles} focus={main} label={t.catalog.worked(list.filter(([, v]) => v >= 0.5).map(([m]) => MUSCLE[m].name.toLowerCase()).join(', '))} />
    </div>

    <h1 class="title">{e.name.ru}</h1>
    <div class="main" style="color:var(--c-{MUSCLE[main].group})">{MUSCLE[main].name}</div>
    {#if helpers.length}<div class="helpers">{t.catalog.helpers}: {helpers.join(', ')}</div>{/if}

    <div class="chips">
      {#each equipment as q (q)}<Chip>{q}</Chip>{:else}<Chip>{t.catalog.bodyweight}</Chip>{/each}
      <Chip>{e.mechanics === 'compound' ? t.catalog.compound : t.catalog.isolation}</Chip>
      <Chip>{t.catalog.skill[e.skill - 1]}</Chip>
    </div>

    <h2 class="sec">{t.catalog.technique}</h2>
    {#if e.technique.art}<Frames art={e.technique.art} name={e.name.ru} />{/if}
    <ol class="card cues" class:gap={!!e.technique.art}>
      {#each e.technique.cues as c, i (i)}<li><span class="num n">{i + 1}</span><span>{c}</span></li>{/each}
    </ol>

    {#if e.contraindications.length || e.needsSafety}
      <div class="warn" role="note">
        <Icon name="alert" size={19} />
        <div>
          {#if e.contraindications.length}
            <div class="wt">{t.catalog.caution}</div>
            {#each e.contraindications as c (c.zone)}<div class="wl">{zone(c.zone)} — {c.level === 'avoid' ? t.catalog.avoid : t.catalog.modify}</div>{/each}
          {/if}
          {#if e.needsSafety}<div class="wl strong" class:solo={!e.contraindications.length}>{t.catalog.safetyPins}</div>{/if}
          <div class="wn">{t.catalog.notMedical}</div>
        </div>
      </div>
    {/if}

    <h2 class="sec">{t.catalog.muscleList}</h2>
    <div class="card list">
      {#each list as [m, v] (m)}
        <div class="mrow">
          <span class="dot" style="background:var(--c-{MUSCLE[m].group})"></span>
          <span class="mn">{MUSCLE[m].name}</span>
          <span class="ml">{t.catalog.share[v]}</span>
          <span class="b4" aria-hidden="true">{#each [1, 2, 3, 4] as k (k)}<i style:background={k <= v * 4 ? `var(--c-${MUSCLE[m].group})` : 'var(--fill)'}></i>{/each}</span>
        </div>
      {/each}
    </div>

    {#if subs.length}
      <h2 class="sec">{t.catalog.similar}</h2>
      <div class="similar">
        {#each subs as s (s.id)}
          <button class="mini press" aria-label={t.catalog.open(s.name.ru)} onclick={() => push(ExerciseCard, { id: s.id, back: e.name.ru })}>
            <ExerciseThumb exercise={s} size={108} />
            <span>{s.name.ru}</span>
          </button>
        {/each}
      </div>
    {/if}

    <div class="card list step">
      <div class="mrow"><span class="mn">{t.catalog.step}</span><span class="val">{step ? `${fmt(step, 2)} ${t.units.kg}` : t.catalog.stepNone}</span></div>
    </div>
    {#if step}<div class="note">{t.catalog.stepNote}</div>{/if}
  {:else}
    <div class="missing" role="status">{t.catalog.notFound}</div>
  {/if}
</div>

<style>
  .navbar { height: 44px; margin: 0 -6px; }
  .back { display: flex; align-items: center; height: 44px; padding: 0 6px; color: var(--accent-text); font-size: 17px; max-width: 70%; }
  .back span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hero { height: 232px; margin-top: 6px; border-radius: var(--r-card); overflow: hidden; background: var(--card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .title { font-size: 28px; font-weight: 700; letter-spacing: -.5px; line-height: 33px; margin-top: 18px; }
  .main { font-size: 22px; font-weight: 700; letter-spacing: -.3px; margin-top: 6px; }
  .helpers { font-size: 15px; color: var(--t2); margin-top: 2px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
  .sec { font-size: 13px; font-weight: 600; color: var(--t2); text-transform: uppercase; margin: 24px 14px 8px; }
  .card { background: var(--card); border-radius: var(--r-list); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .cues { list-style: none; padding: 4px 16px; }
  .cues.gap { margin-top: 10px; }
  .cues li { display: flex; gap: 12px; padding: 11px 0; font-size: 16px; line-height: 22px; }
  .cues li + li { border-top: .5px solid var(--sep); }
  .cues .num { color: var(--accent-text); width: 12px; flex: none; font-size: 15px; }
  .warn { display: flex; gap: 12px; margin-top: 14px; padding: 14px 16px; border-radius: var(--r-list); background: color-mix(in srgb, #FFB020 13%, var(--card)); }
  .warn :global(.ic) { color: #FFB020; margin-top: 1px; }
  .wt { font-size: 16px; font-weight: 600; margin-bottom: 3px; }
  .wl { font-size: 15px; line-height: 21px; }
  .wl.strong { margin-top: 6px; font-weight: 600; }
  .wl.solo { margin-top: 0; }
  .wn { font-size: 13px; color: var(--t2); margin-top: 6px; }
  .list { overflow: hidden; }
  .mrow { display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 16px; position: relative; }
  .mrow + .mrow::before { content: ''; position: absolute; top: 0; left: 34px; right: 0; height: .5px; background: var(--sep); }
  .mn { flex: 1; font-size: 16px; }
  .ml { font-size: 13px; color: var(--t2); }
  .b4 { display: flex; gap: 3px; }
  .b4 i { width: 8px; height: 14px; border-radius: 3px; }
  .similar { display: flex; gap: 10px; overflow-x: auto; margin: 0 calc(-1 * var(--gutter)); padding: 0 var(--gutter) 6px; scrollbar-width: none; }
  .similar::-webkit-scrollbar { display: none; }
  .mini { flex: none; width: 132px; padding: 10px 10px 12px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); text-align: left; display: flex; flex-direction: column; gap: 8px; }
  .mini :global(.th) { width: 112px !important; height: 96px !important; }
  .mini span:last-child { font-size: 14px; font-weight: 600; line-height: 18px; }
  .step { margin-top: 24px; }
  .val { font-size: 16px; color: var(--t2); }
  .note { font-size: 13px; color: var(--t2); margin: 6px 16px 0; }
  .missing { padding: 60px 20px; text-align: center; color: var(--t2); }
</style>
