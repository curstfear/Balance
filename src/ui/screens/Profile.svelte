<script lang="ts">
  import Card from '../components/Card.svelte';
  import Icon from '../components/Icon.svelte';
  import TabBar from '../components/TabBar.svelte';
  import Exercises from './Exercises.svelte';
  import EquipmentList from './EquipmentList.svelte';
  import Credits from './Credits.svelte';
  import { EXERCISES, EQUIPMENT } from '../../data/catalog';
  import { read } from '../../data/storage.svelte';
  import { profileStats, type ProfileStats } from '../../data/workouts';
  import { depth, push } from '../nav.svelte';
  import { goTab, startWorkout } from '../tabs';
  import { fmt } from '../format';
  import { t } from '../strings';
  import type { IconName } from '../icons';

  // null — loading; 'off' — storage unavailable
  let stats = $state<ProfileStats | 'off' | null>(null);
  // re-read whenever Profile is the visible root again (e.g. after a workout started from here)
  $effect(() => {
    if (depth() === 1) read(profileStats).then((s) => (stats = s ?? 'off'));
  });
  const s = $derived(stats && stats !== 'off' ? stats : null);
  const days = $derived(s?.since ? Math.floor((Date.now() - s.since) / 86_400_000) + 1 : 0);
  const num = (n: number | undefined) => (n === undefined ? '–' : fmt(n));

  const rows: { icon: IconName; color: string; label: string; count?: number; open: () => void }[] = [
    { icon: 'list', color: 'var(--lime)', label: t.profile.exercises, count: EXERCISES.length, open: () => push(Exercises, { back: t.profile.title }) },
    { icon: 'stack', color: 'var(--blue)', label: t.profile.equipment, count: EQUIPMENT.length, open: () => push(EquipmentList, {}) },
  ];
</script>

<div class="scroll">
  <h1 class="large head">{t.profile.title}</h1>

  <Card pad={0}>
    <div class="stats" aria-busy={stats === null}>
      <div><div class="n big">{num(s?.workouts)}</div><div class="cap">{t.profile.workouts(s?.workouts ?? 0)}</div></div>
      <div><div class="n big">{num(s?.sets)}</div><div class="cap">{t.profile.sets(s?.sets ?? 0)}</div></div>
      <div><div class="n big">{s ? fmt(days) : '–'}</div><div class="cap">{t.profile.days(days)}</div></div>
    </div>
    {#if stats === 'off'}<div class="empty">{t.profile.statsOff}</div>
    {:else if s && s.workouts === 0}<div class="empty">{t.profile.statsEmpty}</div>{/if}
  </Card>

  <h2 class="sec">{t.profile.reference}</h2>
  <div class="list">
    {#each rows as r (r.label)}
      <button class="li press" onclick={r.open}>
        <span class="sq" style="--c:{r.color}"><Icon name={r.icon} size={18} /></span>
        <span class="lbl">{r.label}</span>
        {#if r.count}<span class="cnt">{r.count}</span>{/if}
        <span class="chev"><Icon name="chevR" size={16} /></span>
      </button>
    {/each}
  </div>

  <h2 class="sec">{t.profile.about}</h2>
  <div class="list">
    <button class="li press" onclick={() => push(Credits, {})}>
      <span class="sq" style="--c:var(--t2)"><Icon name="book" size={18} /></span>
      <span class="lbl">{t.profile.credits}</span>
      <span class="chev"><Icon name="chevR" size={16} /></span>
    </button>
  </div>
</div>

<TabBar active="profile" onstart={startWorkout} onselect={goTab} />

<style>
  .head { margin: 10px 0 14px; }
  .stats { display: flex; padding: 18px 6px 16px; }
  .stats > div { flex: 1; text-align: center; }
  .big { font-size: 30px; }
  .cap { font-size: 13px; color: var(--t2); margin-top: 2px; }
  .empty { font-size: 14px; color: var(--t2); text-align: center; padding: 0 16px 16px; margin-top: -4px; }
  .sec { font-size: 13px; font-weight: 600; color: var(--t2); text-transform: uppercase; margin: 24px 14px 7px; }
  .list { background: var(--card); border-radius: var(--r-list); overflow: hidden; box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .li { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 52px; padding: 0 14px; text-align: left; position: relative; }
  .li + .li::before { content: ''; position: absolute; top: 0; left: 58px; right: 0; height: .5px; background: var(--sep); }
  .li:active { background: var(--fill2); transform: none; }
  .sq { width: 32px; height: 32px; border-radius: 9px; flex: none; display: flex; align-items: center; justify-content: center; color: var(--c); background: color-mix(in srgb, var(--c) 20%, transparent); }
  .lbl { flex: 1; font-size: 17px; }
  .cnt { font-size: 17px; color: var(--t2); font-variant-numeric: tabular-nums; }
  .chev { color: var(--t3); display: flex; }
</style>
