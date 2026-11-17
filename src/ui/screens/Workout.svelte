<script lang="ts">
  import { untrack } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import Button from '../components/Button.svelte';
  import RoundButton from '../components/RoundButton.svelte';
  import Chip from '../components/Chip.svelte';
  import Card from '../components/Card.svelte';
  import Dock from '../components/Dock.svelte';
  import Icon from '../components/Icon.svelte';
  import RestRing from '../components/RestRing.svelte';
  import Sheet from '../components/Sheet.svelte';
  import Stop from './Stop.svelte';
  import { closeTo, push, haptic } from '../nav.svelte';
  import { fmt, clock } from '../format';
  import { t, type PainLevel } from '../strings';
  import { storage, write, canPersist } from '../../data/storage.svelte';
  import {
    buildWorkout, saveNewWorkout, logSet, saveCursor, finishWorkout, autoCloseWorkout, firstCursor, RESUME_WINDOW_MS,
    type PlanInput, type WorkoutData, type SetInput,
  } from '../../data/workouts';
  import type { Cursor } from '../../data/schema';

  interface SetLog { w: number; r: number; rir: number | null; pain: PainLevel | null }

  // `restored` — an unfinished workout reopened on launch; otherwise a new one is started from `plan`
  let { plan, restored }: { plan: PlanInput; restored?: WorkoutData } = $props();
  const exercises = untrack(() => plan.exercises); // fixed for the whole workout
  const session = untrack(() => restored ?? buildWorkout(plan, Date.now()));
  const persisting = canPersist(); // a workout started without storage stays in memory to the end
  if (persisting && !untrack(() => restored)) write((db) => saveNewWorkout(db, session));
  const startedAt = session.workout.startedAt;
  const c0: Cursor = session.workout.cursor ?? firstCursor({ title: "", exercises });

  let now = $state(Date.now());
  let ex = $state(c0.ex);
  let weight = $state(c0.weight);
  let reps = $state(c0.reps);
  let rir = $state<number | null>(c0.rir);
  let pain = $state<PainLevel | null>(c0.pain);
  let painOpen = $state(false);
  // a rest that ran out while the app was closed ends quietly — no second vibration
  let phase = $state<'set' | 'rest' | 'done'>(c0.phase === 'rest' && c0.restEnd <= Date.now() ? 'set' : c0.phase);
  let restEnd = $state(c0.restEnd);
  let restTotal = $state(c0.restTotal);
  let note = $state(c0.note);
  let logs = $state<SetLog[][]>(session.exercises.map((we) => session.sets
    .filter((s) => s.workoutExerciseId === we.id)
    .sort((a, b) => a.index - b.index)
    .map((s) => ({ w: s.weight, r: s.reps, rir: s.rir, pain: s.pain === 'none' ? null : s.pain }))));
  let scrollEl: HTMLElement | undefined = $state();
  let restoredNote = $state(!!untrack(() => restored));
  let closed = false;
  let lastActivity = session.workout.lastActivityAt;

  const cur = $derived(exercises[ex]);
  const done = $derived(logs[ex].length);
  const restLeft = $derived(Math.max(0, (restEnd - now) / 1000));
  const view = $derived(`${phase}-${ex}-${done}`);
  const all = $derived(logs.flat());

  const cursorNow = (): Cursor => ({ ex, weight, reps, rir, pain, phase, restEnd, restTotal, note });

  function completeSet() {
    const input: SetInput = {
      workoutId: session.workout.id, workoutExerciseId: session.exercises[ex].id, exerciseId: cur.id,
      index: logs[ex].length + 1, weight, reps, rir, pain, doneAt: Date.now(),
    };
    advance();
    // the set and the new position are written together, right away
    if (persisting) {
      const c = cursorNow();
      lastActivity = input.doneAt;
      write((db) => logSet(db, input, c));
      if (phase === 'done') { closed = true; write((db) => finishWorkout(db, input.workoutId, input.doneAt)); }
    }
  }

  function exit() {
    if (persisting && !closed) {
      closed = true;
      const at = Date.now();
      write((db) => finishWorkout(db, session.workout.id, at));
    }
    closeTo(0);
  }

  function advance() {
    const e = cur;
    logs[ex].push({ w: weight, r: reps, rir, pain });
    haptic(20);
    // preview rules; the engine (stage 3) replaces them with docs/engine/safety.md §2
    const acute = pain === 'acute';
    const lastOfExercise = acute || logs[ex].length >= e.sets;
    if (lastOfExercise && ex === exercises.length - 1) { phase = 'done'; return; }

    if (lastOfExercise) {
      ex += 1;
      weight = exercises[ex].weight;
      reps = exercises[ex].reps[0];
      note = acute
        ? `${t.pain.notes.acute} ${t.workout.notes.exerciseDone(exercises[ex].name.toLowerCase())}`
        : t.workout.notes.exerciseDone(exercises[ex].name.toLowerCase());
    } else if (pain === 'tolerable') {
      weight -= e.step;
      note = t.pain.notes.tolerable(fmt(e.step));
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
    pain = null;
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

  // iOS can keep the app alive for hours: a workout left without input longer than the resume
  // window is closed the same way as on launch (sets kept) instead of continuing
  function closeIfStale() {
    if (closed || phase === 'done' || Date.now() - lastActivity <= RESUME_WINDOW_MS) return false;
    closed = true;
    clearTimeout(timer);
    if (logs.some((l) => l.length)) storage.autoClosed = true;
    const at = Date.now();
    if (persisting) write((db) => autoCloseWorkout(db, session.workout.id, at));
    closeTo(0);
    return true;
  }

  // clock + automatic end of rest
  $effect(() => {
    const id = setInterval(() => {
      if (closeIfStale()) return;
      now = Date.now();
      if (phase === 'rest' && now >= restEnd) { haptic(200); phase = 'set'; }
    }, 250);
    return () => clearInterval(id);
  });

  // input between sets (weight, reps, reserve, rest) is saved shortly after it changes,
  // and at once when the app goes to the background — iOS may close it there
  let timer: ReturnType<typeof setTimeout> | undefined;
  let dirty = false;
  function flushCursor() {
    clearTimeout(timer);
    if (closeIfStale() || !dirty || !persisting || closed) return;
    dirty = false;
    const c = cursorNow();
    const at = Date.now();
    lastActivity = at;
    write((db) => saveCursor(db, session.workout.id, c, at));
  }
  let first = true;
  $effect(() => {
    cursorNow();
    if (first) { first = false; return; }
    dirty = true;
    clearTimeout(timer);
    timer = setTimeout(flushCursor, 300);
  });
  $effect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flushCursor(); };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushCursor);
    return () => {
      flushCursor();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushCursor);
    };
  });

  $effect(() => {
    if (!restoredNote) return;
    const id = setTimeout(() => (restoredNote = false), 3000);
    return () => clearTimeout(id);
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
      <RoundButton icon="close" label={t.workout.finish} size={40} onclick={exit} />
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
  {#if storage.status === 'error'}
    <div class="note warn" role="status"><Icon name="alert" size={16} color="var(--orange)" /><span>{t.storage.notSaved}</span></div>
  {:else if restoredNote}
    <div class="note restored" role="status" out:fade={{ duration: 300 }}><Icon name="bolt" size={16} color="var(--accent-text)" /><span>{t.workout.restored(done + 1)}</span></div>
  {/if}

  {#key view}
    <div in:fly={{ y: 10, duration: 380, easing: cubicOut }}>
      {#if phase === 'set'}
        <div class="eyebrow" style="color:var(--c-{cur.muscle});margin-top:14px">{t.workout.exercise(ex + 1)}</div>
        <h1 class="name">{cur.name}</h1>
        <div class="row sets">
          {#each Array(cur.sets) as _, i (i)}
            {#if logs[ex][i]}
              <Chip variant="done"><Icon name="check" size={14} color="var(--lime)" /><span class="n">{logs[ex][i].r} × {fmt(logs[ex][i].w)}</span>{#if logs[ex][i].pain === 'tolerable' || logs[ex][i].pain === 'acute'}<span class="dot pain-{logs[ex][i].pain}"></span>{/if}</Chip>
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
    <Button variant="danger" icon="alert" onclick={() => (painOpen = true)}>{pain ? `${t.pain.button} · ${t.pain.options.find((o) => o.level === pain)?.scale}` : t.pain.button}</Button>
    <Button icon="check" grow onclick={completeSet}>{t.workout.setDone}</Button>
  </Dock>
{:else if phase === 'done'}
  <Dock><Button grow onclick={() => closeTo(0)}>{t.workout.close}</Button></Dock>
{/if}

<Sheet open={painOpen} title={t.pain.title} subtitle={t.pain.subtitle(cur.name, done + 1)} onclose={() => (painOpen = false)}>
  <div class="opts" role="radiogroup" aria-label={t.pain.title}>
    {#each t.pain.options as o (o.level)}
      <button class="opt press pain-{o.level}" role="radio" aria-checked={pain === o.level}
        onclick={() => { pain = o.level === 'none' ? null : o.level; painOpen = false; haptic(); }}>
        <span class="scale n">{o.scale}</span>
        <span><b>{o.name}</b><span class="d">{o.note}</span></span>
      </button>
    {/each}
  </div>
  <div class="flags">
    <div class="ft"><Icon name="alert" size={18} />{t.pain.flagsTitle}</div>
    <p>{t.pain.flagsText}</p>
    <Button variant="alarm" size="m" grow onclick={() => { painOpen = false; push(Stop, { onfinish: exit }, 'modal'); }}>{t.pain.flagsAction}</Button>
  </div>
</Sheet>

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
  .note.warn { background: rgba(255, 138, 61, .12); }
  .scroll > .note { margin-top: 10px; }
  /* floats over the screen so nothing jumps when it fades out (the person may be tapping −/+) */
  .scroll > .note.restored {
    position: absolute; z-index: 5; margin: 0;
    left: var(--gutter); right: var(--gutter); top: calc(var(--safe-top) + 12px + 58px);
    background: linear-gradient(rgba(212, 255, 58, .1), rgba(212, 255, 58, .1)), var(--sheet);
    box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
  }
  .badge-ok { width: 24px; height: 24px; border-radius: 8px; background: var(--lime); color: var(--lime-ink); display: flex; align-items: center; justify-content: center; }
  .stat { padding: 14px 16px; }
  .stat .n { font-size: 30px; }
  .bl { border-left: .5px solid var(--sep); }
  .bt { border-top: .5px solid var(--sep); }
  .dot.pain-tolerable { background: var(--yellow); }
  .dot.pain-acute { background: var(--red); }
  .opts { margin-top: 6px; }
  .opt { display: flex; align-items: center; gap: 14px; width: 100%; text-align: left; padding: 14px; border-radius: 20px; background: var(--fill2); margin-top: 8px; }
  .opt[aria-checked='true'] { box-shadow: inset 0 0 0 2px currentColor; }
  .opt b { display: block; font-size: 17px; font-weight: 600; letter-spacing: -.2px; color: var(--t1); }
  .opt .d { display: block; font-size: 13px; line-height: 17px; color: var(--t2); margin-top: 2px; }
  .scale { width: 52px; height: 44px; border-radius: 14px; flex: none; display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .pain-none { color: var(--green); }
  .pain-none .scale { background: rgba(52, 199, 89, .16); }
  .pain-tolerable { color: var(--yellow); }
  .pain-tolerable .scale { background: rgba(255, 214, 10, .16); }
  .pain-acute { color: #FF6961; }
  .pain-acute .scale { background: rgba(255, 69, 58, .18); }
  @media (prefers-color-scheme: light) {
    .pain-none { color: #1F8A3B; }
    .pain-tolerable { color: #9A7400; }
    .pain-acute { color: #D70015; }
    .flags .ft { color: #D70015; }
  }
  .flags { margin-top: 14px; padding: 14px; border-radius: 20px; background: rgba(255, 69, 58, .12); }
  .ft { display: flex; align-items: center; gap: 8px; color: #FF6961; font-weight: 650; font-size: 15px; }
  .flags p { font-size: 14px; line-height: 19px; margin: 6px 0 12px; }
</style>
