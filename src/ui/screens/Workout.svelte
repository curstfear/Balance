<script lang="ts">
  import { untrack } from 'svelte';
  import { fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Button from '../components/Button.svelte';
  import RoundButton from '../components/RoundButton.svelte';
  import Chip from '../components/Chip.svelte';
  import Card from '../components/Card.svelte';
  import Dock from '../components/Dock.svelte';
  import Icon from '../components/Icon.svelte';
  import RestRing from '../components/RestRing.svelte';
  import type { Plan } from '../../preview-data';
  import { closeTo, haptic } from '../nav.svelte';
  import { fmt, clock } from '../format';
  import { t } from '../strings';

  interface SetLog { w: number; r: number; rir: number | null }

  let { plan }: { plan: Plan } = $props();
  const exercises = untrack(() => plan.exercises); // fixed for the whole workout
  const startedAt = Date.now();

  let now = $state(Date.now());
  let ex = $state(0);
  let weight = $state(exercises[0].weight);
  let reps = $state(exercises[0].reps[0]);
  let rir = $state<number | null>(null);
  let phase = $state<'set' | 'rest' | 'done'>('set');
  let restEnd = $state(0);
  let restTotal = $state(0);
  let note = $state('');
  let logs = $state<SetLog[][]>(exercises.map(() => []));
  let scrollEl: HTMLElement | undefined = $state();

  const cur = $derived(exercises[ex]);
  const done = $derived(logs[ex].length);
  const restLeft = $derived(Math.max(0, (restEnd - now) / 1000));
  const view = $derived(`${phase}-${ex}-${done}`);
  const all = $derived(logs.flat());

  function completeSet() {
    const e = cur;
    logs[ex].push({ w: weight, r: reps, rir });
    haptic(20);
    const lastOfExercise = logs[ex].length >= e.sets;
    if (lastOfExercise && ex === exercises.length - 1) { phase = 'done'; return; }

    if (lastOfExercise) {
      ex += 1;
      weight = exercises[ex].weight;
      reps = exercises[ex].reps[0];
      note = t.workout.notes.exerciseDone(exercises[ex].name.toLowerCase());
    } else if (rir === 0) {
      weight -= e.step;
      note = t.workout.notes.failure(fmt(e.step));
    } else if (rir === 3) {
      weight += e.step;
      note = t.workout.notes.easy(fmt(e.step));
    } else {
      note = rir === 1 ? t.workout.notes.hard : t.workout.notes.ok;
    }
    rir = null;
    restTotal = e.rest;
    restEnd = Date.now() + restTotal * 1000;
    now = Date.now();
    phase = 'rest';
  }

  function shiftRest(sec: number) {
    restEnd += sec * 1000;
    // ±15 s changes the planned rest itself; never shorter than what is left
    restTotal = Math.max(restTotal + sec, Math.ceil((restEnd - Date.now()) / 1000), 1);
    now = Date.now();
  }

  function step(fn: () => void) { fn(); haptic(); }

  // clock + automatic end of rest
  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
      if (phase === 'rest' && now >= restEnd) { haptic(200); phase = 'set'; }
    }, 250);
    return () => clearInterval(id);
  });

  // every new view starts from the top
  $effect(() => { void view; scrollEl?.scrollTo({ top: 0 }); });

  // keep the screen on during the workout
  $effect(() => {
    let lock: WakeLockSentinel | null = null;
    let alive = true;
    const request = () => navigator.wakeLock?.request('screen').then((l) => { if (alive) lock = l; else l.release(); }).catch(() => {});
    const onVisible = () => { if (document.visibilityState === 'visible') { request(); now = Date.now(); } };
    request();
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); lock?.release().catch(() => {}); };
  });
</script>

<div class="scroll" bind:this={scrollEl}>
  {#if phase !== 'done'}
    <div class="row top">
      <RoundButton icon="close" label={t.workout.finish} size={40} onclick={() => closeTo(0)} />
      <div style="flex:1">
        <div class="prog">
          {#each exercises as e, i (i)}
            <span><i style:width="{i < ex ? 100 : i === ex ? (done / e.sets) * 100 : 0}%"></i></span>
          {/each}
        </div>
        <div class="t2 small">{t.workout.exerciseOf(ex + 1, exercises.length)}</div>
      </div>
      <div class="n elapsed">{clock((now - startedAt) / 1000)}</div>
    </div>
  {/if}

  {#key view}
    <div in:fly={{ y: 10, duration: 380, easing: cubicOut }}>
      {#if phase === 'set'}
        <div class="eyebrow" style="color:var(--c-{cur.muscle});margin-top:14px">{t.workout.exercise(ex + 1)}</div>
        <h1 class="name">{cur.name}</h1>
        <div class="row sets">
          {#each Array(cur.sets) as _, i (i)}
            {#if logs[ex][i]}
              <Chip variant="done"><Icon name="check" size={14} color="var(--lime)" /><span class="n">{logs[ex][i].r} × {fmt(logs[ex][i].w)}</span></Chip>
            {:else if i === done}
              <Chip variant="accent">{t.workout.set(i + 1)}</Chip>
            {:else}
              <Chip variant="muted">{i + 1}</Chip>
            {/if}
          {/each}
        </div>

        <div class="hr" style="margin-top:22px"></div>
        <div class="row big-row">
          <div><div class="eyebrow">{t.workout.weight}</div><div class="n big lime">{fmt(weight)}<span class="u">{t.units.kg}</span></div></div>
          <span class="sp"></span>
          <div class="row" style="gap:10px">
            <RoundButton icon="minus" size={52} label={t.workout.weightLess} onclick={() => step(() => (weight -= cur.step))} />
            <RoundButton icon="plus" size={52} label={t.workout.weightMore} onclick={() => step(() => (weight += cur.step))} />
          </div>
        </div>
        <div class="hr"></div>
        <div class="row big-row">
          <div><div class="eyebrow">{t.workout.reps} <span class="t3">· {t.workout.target(cur.reps[0], cur.reps[1])}</span></div><div class="n big">{reps}<span class="u">{t.units.reps}</span></div></div>
          <span class="sp"></span>
          <div class="row" style="gap:10px">
            <RoundButton icon="minus" size={52} label={t.workout.repsLess} onclick={() => step(() => (reps = Math.max(0, reps - 1)))} />
            <RoundButton icon="plus" size={52} label={t.workout.repsMore} onclick={() => step(() => (reps += 1))} />
          </div>
        </div>
        <div class="hr"></div>

        <div class="label">{t.workout.reserve}</div>
        <div class="rir-row" role="radiogroup" aria-label={t.workout.reserve}>
          {#each t.workout.reserveOptions as [n, word], i (n)}
            <button class="rir press" role="radio" aria-checked={rir === i} onclick={() => step(() => (rir = rir === i ? null : i))}><b class="n">{n}</b><span>{word}</span></button>
          {/each}
        </div>
      {:else if phase === 'rest'}
        <RestRing progress={1 - restLeft / restTotal}>
          <div class="eyebrow rest-label">{t.workout.rest}</div>
          <div class="n timer">{clock(Math.ceil(restLeft))}</div>
          <div class="t2" style="font-size:15px">{t.workout.of} <span class="n" style="font-weight:600">{clock(restTotal)}</span></div>
        </RestRing>
        <div class="row" style="gap:10px;margin:26px 0 22px">
          <Button variant="secondary" size="m" grow onclick={() => shiftRest(-15)}><span class="n">{t.workout.minus15}</span></Button>
          <Button variant="secondary" size="m" grow onclick={() => { phase = 'set'; }}>{t.workout.skip}</Button>
          <Button variant="secondary" size="m" grow onclick={() => shiftRest(15)}><span class="n">{t.workout.plus15}</span></Button>
        </div>
        <Card>
          <div class="eyebrow">{t.workout.next} · {done === 0 ? cur.name.toLowerCase() : t.workout.nextSet(done + 1, cur.sets)}</div>
          <div class="n next">{fmt(weight)}<span class="u">{t.units.kg}</span> <span class="t3">×</span> {reps}</div>
          {#if note}<div class="note"><Icon name="bolt" size={16} color="var(--accent-text)" /><span>{note}</span></div>{/if}
        </Card>
      {:else}
        <div class="row" style="gap:8px;margin-top:56px">
          <span class="badge-ok"><Icon name="check" size={16} /></span><span class="eyebrow">{t.workout.done}</span>
        </div>
        <h1 class="large" style="margin-top:6px">{plan.title}</h1>
        <Card pad={0} style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr">
          <div class="stat"><div class="eyebrow">{t.plan.time}</div><div class="n" style="color:var(--yellow)">{clock((now - startedAt) / 1000)}</div></div>
          <div class="stat bl"><div class="eyebrow">{t.workout.tonnage}</div><div class="n" style="color:var(--lime)">{fmt(all.reduce((a, l) => a + Math.max(l.w, 0) * l.r, 0), 0)}<span class="u">{t.units.kg}</span></div></div>
          <div class="stat bt"><div class="eyebrow">{t.plan.sets}</div><div class="n" style="color:var(--blue)">{all.length}</div></div>
          <div class="stat bl bt"><div class="eyebrow">{t.workout.exercises}</div><div class="n" style="color:var(--orange)">{exercises.length}</div></div>
        </Card>
      {/if}
    </div>
  {/key}
</div>

{#if phase === 'set'}
  <Dock>
    <Button variant="danger" icon="alert">{t.workout.pain}</Button>
    <Button icon="check" grow onclick={completeSet}>{t.workout.setDone}</Button>
  </Dock>
{:else if phase === 'done'}
  <Dock><Button grow onclick={() => closeTo(0)}>{t.workout.close}</Button></Dock>
{/if}

<style>
  .top { height: 48px; gap: 12px; margin-top: 4px; }
  .prog { display: flex; gap: 4px; }
  .prog span { flex: 1; height: 4px; border-radius: 2px; background: var(--fill); overflow: hidden; }
  .prog i { display: block; height: 100%; background: var(--lime); transition: width .4s var(--ease-ios); }
  .small { font-size: 12px; font-weight: 600; margin-top: 6px; }
  .elapsed { font-size: 20px; color: var(--yellow); font-weight: 650; }
  .name { font-size: 28px; font-weight: 700; letter-spacing: -.5px; line-height: 33px; margin-top: 3px; }
  .sets { gap: 6px; margin-top: 14px; flex-wrap: wrap; }
  .sets .n { font-weight: 600; }
  .hr { border-top: .5px solid var(--sep); }
  .big-row { padding: clamp(8px, 1.6vh, 14px) 0 clamp(6px, 1.4vh, 12px); }
  .big { font-size: clamp(58px, 10vh, 82px); line-height: 1.05; letter-spacing: -.04em; }
  .big .u { font-size: 30px; letter-spacing: 0; }
  .lime { color: var(--lime); }
  @media (prefers-color-scheme: light) { .lime { color: var(--t1); } }
  .label { font-size: 15px; font-weight: 600; margin: 16px 0 10px; }
  .rir-row { display: flex; gap: 8px; }
  .rir { flex: 1; height: 68px; border-radius: 18px; background: var(--fill2); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; transition: background .2s, box-shadow .2s, transform .25s var(--ease-ios); }
  .rir b { font-size: 24px; }
  .rir span { font-size: 12px; color: var(--t2); font-weight: 600; }
  .rir[aria-checked='true'] { background: rgba(212, 255, 58, .14); box-shadow: inset 0 0 0 2px var(--lime); }
  .rir[aria-checked='true'] b, .rir[aria-checked='true'] span { color: var(--accent-text); }
  .rest-label { color: var(--teal); letter-spacing: 1px; }
  .timer { font-size: clamp(56px, 10vh, 80px); line-height: 1.05; letter-spacing: -.04em; }
  .next { font-size: 40px; margin-top: 4px; letter-spacing: -1px; }
  .note { margin-top: 12px; padding: 11px 12px; border-radius: 14px; background: rgba(212, 255, 58, .08); display: flex; gap: 9px; font-size: 14px; line-height: 19px; }
  .note :global(.ic) { margin-top: 1px; }
  .badge-ok { width: 24px; height: 24px; border-radius: 8px; background: var(--lime); color: var(--lime-ink); display: flex; align-items: center; justify-content: center; }
  .stat { padding: 14px 16px; }
  .stat .n { font-size: 30px; }
  .bl { border-left: .5px solid var(--sep); }
  .bt { border-top: .5px solid var(--sep); }
</style>
