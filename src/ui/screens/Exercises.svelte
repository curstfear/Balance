<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import ExerciseThumb from '../components/ExerciseThumb.svelte';
  import ExerciseCard from './ExerciseCard.svelte';
  import {
    EXERCISES, EQUIP, GROUPS, MUSCLE, MUSCLES, groupOf, mainMuscle, matches, usesEquipment, type Exercise, type MuscleGroup, type MuscleId,
  } from '../../data/catalog';
  import { catalogFilter } from '../catalog-filter.svelte';
  import { push, pop, haptic } from '../nav.svelte';
  import { t } from '../strings';

  /** equipment — exercises on one piece of equipment (from «Оборудование»); filters are then local */
  let { back, equipment }: { back: string; equipment?: string } = $props();

  const local = $state({ q: '', group: null as MuscleGroup | null, muscle: null as MuscleId | null });
  const f = $derived(equipment ? local : catalogFilter);
  const title = $derived(equipment ? EQUIP[equipment]?.name ?? t.catalog.title : t.catalog.title);
  const pool = $derived(equipment ? EXERCISES.filter((e) => usesEquipment(e, equipment)) : EXERCISES);
  const byName = (a: Exercise, b: Exercise) => a.name.ru.localeCompare(b.name.ru, 'ru');

  const found = $derived(pool.filter((e) =>
    matches(e, f.q)
    && (!f.group || groupOf(e) === f.group)
    && (!f.muscle || (e.muscles[f.muscle] ?? 0) >= 0.5)));
  const sections = $derived(GROUPS.map((g) => ({ ...g, items: found.filter((e) => groupOf(e) === g.id).sort(byName) })).filter((s) => s.items.length));
  const groupMuscles = $derived(f.group ? MUSCLES.filter((m) => m.group === f.group && pool.some((e) => (e.muscles[m.id] ?? 0) >= 0.5)) : []);

  function setGroup(g: MuscleGroup | null) {
    haptic();
    f.group = g;
    f.muscle = null;
  }
  function setMuscle(m: MuscleId) {
    haptic();
    f.muscle = f.muscle === m ? null : m;
  }
  function reset() {
    f.q = '';
    f.group = null;
    f.muscle = null;
  }
  const open = (e: Exercise) => push(ExerciseCard, { id: e.id, back: title });
  const sub = (e: Exercise) => [MUSCLE[mainMuscle(e)].name, e.mechanics === 'compound' ? t.catalog.compound : t.catalog.isolation].join(' · ');
</script>

<div class="scroll">
  <nav class="row navbar">
    <button class="back press" onclick={pop}><Icon name="chevL" size={24} /><span>{back}</span></button>
  </nav>
  <h1 class="large title">{title}</h1>

  <label class="search">
    <Icon name="search" size={17} />
    <input type="search" placeholder={t.catalog.search} aria-label={t.catalog.search} enterkeyhint="search" autocomplete="off" bind:value={f.q} />
    {#if f.q}<button class="clr" aria-label={t.catalog.clear} onclick={() => (f.q = '')}><Icon name="xFill" size={17} /></button>{/if}
  </label>

  <div class="chips" role="group" aria-label={t.catalog.groups}>
    <button class="chip press" aria-pressed={f.group === null} onclick={() => setGroup(null)}>{t.catalog.all}</button>
    {#each GROUPS as g (g.id)}
      <button class="chip press" aria-pressed={f.group === g.id} onclick={() => setGroup(f.group === g.id ? null : g.id)}><span class="dot" style="background:var(--c-{g.id})"></span>{g.name}</button>
    {/each}
  </div>
  {#if groupMuscles.length > 1}
    <div class="chips subs" role="group" aria-label={t.catalog.muscles}>
      {#each groupMuscles as m (m.id)}
        <button class="chip small press" aria-pressed={f.muscle === m.id} onclick={() => setMuscle(m.id)}>{m.name}</button>
      {/each}
    </div>
  {/if}

  {#each sections as s (s.id)}
    <h2 class="sec">{s.name}<span>{s.items.length}</span></h2>
    <div class="list">
      {#each s.items as e (e.id)}
        <button class="li" aria-label={t.catalog.open(e.name.ru)} onclick={() => open(e)}>
          <i class="bar" style="background:var(--c-{s.id})"></i>
          <ExerciseThumb exercise={e} size={46} />
          <span class="txt"><span class="nm">{e.name.ru}</span><span class="sub">{sub(e)}</span></span>
          <span class="chev"><Icon name="chevR" size={16} /></span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="empty" role="status">
      <div class="et">{t.catalog.empty}</div>
      <div class="es">{t.catalog.emptyText}</div>
      <button class="reset press" onclick={reset}>{t.catalog.reset}</button>
    </div>
  {/each}
</div>

<style>
  .navbar { height: 44px; margin: 0 -6px; }
  .back { display: flex; align-items: center; height: 44px; padding: 0 6px; color: var(--accent-text); font-size: 17px; }
  .title { margin: 2px 0 12px; }
  .search { display: flex; align-items: center; gap: 7px; height: 40px; padding: 0 10px; border-radius: 12px; background: var(--fill); color: var(--t2); }
  .search input { flex: 1; min-width: 0; height: 100%; border: 0; background: none; outline: none; font: inherit; font-size: 17px; color: var(--t1); -webkit-appearance: none; appearance: none; }
  .search input::placeholder { color: var(--t2); }
  .search input::-webkit-search-cancel-button { display: none; }
  .search:focus-within { box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-text) 60%, transparent); }
  .clr { display: flex; width: 44px; height: 40px; margin-right: -10px; align-items: center; justify-content: center; color: var(--t3); }
  .chips { display: flex; gap: 8px; overflow-x: auto; margin: 12px calc(-1 * var(--gutter)) 0; padding: 0 var(--gutter); scrollbar-width: none; }
  .chips::-webkit-scrollbar { display: none; }
  .chip { flex: none; display: flex; align-items: center; gap: 7px; height: 36px; padding: 0 14px; border-radius: 18px; background: var(--fill); font-size: 15px; font-weight: 600; }
  .chip.small { height: 32px; font-size: 14px; padding: 0 12px; }
  .chip[aria-pressed='true'] { background: var(--t1); color: var(--bg); }
  .subs { margin-top: 8px; }
  .sec { display: flex; gap: 6px; font-size: 13px; font-weight: 600; color: var(--t2); text-transform: uppercase; margin: 22px 14px 7px; }
  .sec span { color: var(--t3); }
  .list { background: var(--card); border-radius: var(--r-list); overflow: hidden; box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .li { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 64px; padding: 8px 14px 8px 0; text-align: left; position: relative; }
  .li + .li::before { content: ''; position: absolute; top: 0; left: 62px; right: 0; height: .5px; background: var(--sep); }
  .li:active { background: var(--fill2); }
  .bar { width: 4px; align-self: stretch; margin: 6px 0; border-radius: 0 3px 3px 0; flex: none; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; }
  .nm { font-size: 16px; font-weight: 600; letter-spacing: -.25px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sub { font-size: 13px; color: var(--t2); margin-top: 2px; }
  .chev { color: var(--t3); display: flex; }
  .empty { text-align: center; padding: 48px 24px; }
  .et { font-size: 20px; font-weight: 700; }
  .es { font-size: 15px; color: var(--t2); margin-top: 6px; }
  .reset { margin-top: 16px; height: 44px; padding: 0 20px; border-radius: 22px; background: var(--fill); font-weight: 600; color: var(--accent-text); }
</style>
