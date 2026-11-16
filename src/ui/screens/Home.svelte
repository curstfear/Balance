<script lang="ts">
  import Card from '../components/Card.svelte';
  import Chip from '../components/Chip.svelte';
  import Icon from '../components/Icon.svelte';
  import Flower from '../components/Flower.svelte';
  import WeekStrip from '../components/WeekStrip.svelte';
  import TabBar from '../components/TabBar.svelte';
  import Plan from './Plan.svelte';
  import { MUSCLES, weekBalance, planFor, totals } from '../../preview-data';
  import { push, haptic } from '../nav.svelte';
  import { t, plural, FORMS } from '../strings';

  const now = new Date();
  const plan = planFor(55);
  const sum = totals(plan);
  const score = Math.round(weekBalance.reduce((a, b) => a + b, 0) / weekBalance.length);

  function start() {
    haptic(15);
    push(Plan, {});
  }
</script>

<div class="scroll">
  <header class="row head">
    <div>
      <div class="eyebrow">{t.date.weekdays[now.getDay()]}, {now.getDate()} {t.date.months[now.getMonth()]}</div>
      <h1 class="large">{t.home.title}</h1>
    </div>
    <span class="sp"></span>
    <div class="avatar" aria-hidden="true">А</div>
  </header>

  <WeekStrip today={now} />

  <Card hero pad={18} label="{t.home.next}: {plan.title}" onclick={start}>
    <svg class="glyph" viewBox="0 0 170 170" aria-hidden="true">
      <defs><linearGradient id="dumbbell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4C95FF" /><stop offset="1" stop-color="#2F6BF0" /></linearGradient></defs>
      <g transform="rotate(-35 85 85)" fill="url(#dumbbell)">
        <rect x="58" y="78" width="54" height="14" rx="7" />
        <rect x="30" y="50" width="26" height="70" rx="11" /><rect x="114" y="50" width="26" height="70" rx="11" />
        <rect x="16" y="64" width="16" height="42" rx="7" /><rect x="138" y="64" width="16" height="42" rx="7" />
      </g>
    </svg>
    <div class="row" style="gap:7px"><span class="dot" style="background:var(--lime)"></span><span class="eyebrow" style="font-size:12px">{t.home.next}</span></div>
    <div class="title">Спина<br />и бицепс</div>
    <div class="row t2 meta">
      <span class="row" style="gap:4px"><Icon name="clock" size={15} /><span class="n">55</span> {t.units.min}</span>
      <span><span class="n">{plan.exercises.length}</span> {plural(plan.exercises.length, FORMS.exercise)}</span>
      <span><span class="n">{sum.sets}</span> {plural(sum.sets, FORMS.set)}</span>
    </div>
    <div class="why"><Icon name="bolt" size={16} color="var(--accent-text)" /><span>{plan.reason}</span></div>
    <div class="row chips">
      {#each plan.muscles as m (m.id)}<Chip dot="var(--c-{m.id})">{m.name}</Chip>{/each}
    </div>
  </Card>

  <Card style="margin-top:12px">
    <div class="card-h">{t.home.balance}<span class="chev"><Icon name="chevR" size={18} /></span></div>
    <div class="row" style="gap:18px;margin-top:10px">
      <Flower values={weekBalance} size={150} {score} />
      <div class="legend">
        {#each MUSCLES as m, k (m.id)}
          <div class="lg" class:low={weekBalance[k] < 70}><span class="dot" style="background:var(--c-{m.id})"></span>{m.name}<b>{weekBalance[k]}%</b></div>
        {/each}
      </div>
    </div>
  </Card>

  <div class="duo">
    <Card pad={14}>
      <div class="card-h small"><Icon name="pulse" size={17} color="var(--teal)" />{t.home.readiness}</div>
      <div class="n big">82<span class="u">%</span></div>
      <div class="bar ready"><span class="knob" style="left:82%"></span></div>
    </Card>
    <Card pad={14}>
      <div class="card-h small"><Icon name="stack" size={17} color="var(--blue)" />{t.home.week}</div>
      <div class="n big">34<span class="u">/ 52</span></div>
      <div class="row" style="gap:4px;margin-top:8px">
        <div class="bar" style="flex:1;background:var(--blue)"></div>
        <div class="bar" style="flex:1;background:linear-gradient(90deg,var(--blue) 30%,var(--fill) 30%)"></div>
        <div class="bar" style="flex:1;background:var(--fill)"></div>
      </div>
    </Card>
  </div>
</div>

<TabBar active="today" onstart={start} />

<style>
  .head { margin-top: 10px; }
  .avatar {
    width: 38px; height: 38px; border-radius: 50%; margin-top: 14px; color: #fff;
    background: linear-gradient(135deg, #8B9BFF, #C77DFF);
    display: flex; align-items: center; justify-content: center; font: 700 16px var(--font-num);
  }
  .glyph { position: absolute; right: -22px; top: -30px; width: 140px; height: 140px; filter: drop-shadow(0 14px 26px rgba(62, 139, 255, .45)); }
  .title { font-size: 28px; font-weight: 700; letter-spacing: -.5px; margin-top: 6px; line-height: 1.15; }
  .meta { gap: 14px; font-size: 15px; margin-top: 8px; }
  .meta .n { font-weight: 600; }
  .why { margin-top: 14px; padding: 11px 12px; border-radius: 14px; background: var(--fill2); display: flex; gap: 9px; font-size: 14px; line-height: 19px; }
  .why :global(.ic) { margin-top: 1px; }
  .chips { gap: 6px; margin-top: 12px; flex-wrap: wrap; }
  .card-h { display: flex; align-items: center; gap: 7px; font-size: 17px; font-weight: 600; letter-spacing: -.3px; }
  .card-h.small { font-size: 15px; }
  .chev { margin-left: auto; color: var(--t3); display: flex; }
  .legend { flex: 1; }
  .lg { display: flex; align-items: center; gap: 8px; font-size: 14px; height: 23px; }
  .lg b { margin-left: auto; font-family: var(--font-num); font-weight: 650; font-variant-numeric: tabular-nums; }
  .lg.low b { color: var(--orange); }
  .duo { display: flex; gap: 12px; margin-top: 12px; }
  .big { font-size: 32px; margin-top: 6px; }
  .bar { height: 8px; border-radius: 4px; }
  .ready { position: relative; margin-top: 8px; background: var(--ready-gradient); }
  .knob { position: absolute; top: -3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid var(--bg); transform: translateX(-50%); }
</style>
