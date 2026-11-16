<script lang="ts">
  import { t } from '../strings';

  let { today }: { today: Date } = $props();

  type State = 'today' | 'done' | 'plan' | 'rest';
  const days = $derived.by(() => {
    const dow = (today.getDay() + 6) % 7; // 0 = Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow);
    // preview pattern until there is real history: trained on even past days, next planned on Saturday
    const state = (i: number): State => (i === dow ? 'today' : i < dow ? (i % 2 === 0 ? 'done' : 'rest') : i === 5 ? 'plan' : 'rest');
    return t.date.days.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { label, date: d.getDate(), state: state(i) };
    });
  });
</script>

<div class="week">
  {#each days as d (d.label)}
    <div>
      <div class="d" class:cur={d.state === 'today'}>{d.label}</div>
      <div class="c {d.state}">
        {#if d.state === 'done' || d.state === 'plan'}
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" /></svg>
        {/if}
        {d.date}
      </div>
    </div>
  {/each}
</div>

<style>
  .week { display: grid; grid-template-columns: repeat(7, 1fr); margin: 14px -4px 18px; text-align: center; }
  .d { font-size: 12px; font-weight: 600; color: var(--t2); margin-bottom: 6px; }
  .d.cur { color: var(--t1); }
  .c { position: relative; width: 40px; height: 40px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font: 650 15px var(--font-num); }
  svg { position: absolute; inset: 0; }
  circle { fill: none; stroke: var(--ring-lime); stroke-width: 3.2; }
  .plan circle { stroke: var(--t3); stroke-dasharray: 3 4.2; stroke-linecap: round; }
  .rest { color: var(--t3); }
  .today { background: var(--lime); color: var(--lime-ink); border-radius: 13px; height: 52px; margin-top: -6px; flex-direction: column; font-size: 17px; }
  .today::after { content: ''; width: 4px; height: 4px; border-radius: 2px; background: var(--lime-ink); margin-top: 2px; }
</style>
