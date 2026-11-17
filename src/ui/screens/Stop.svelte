<script lang="ts">
  import Button from '../components/Button.svelte';
  import Dock from '../components/Dock.svelte';
  import { closeTo, pop } from '../nav.svelte';
  import { t } from '../strings';

  // onfinish: the workout underneath closes itself (and saves that it ended)
  let { onfinish }: { onfinish?: () => void } = $props();
</script>

<div class="scroll">
  <svg class="sign" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8.2 2.5h7.6l5.7 5.7v7.6l-5.7 5.7H8.2l-5.7-5.7V8.2z" fill="var(--red)" />
    <path d="M12 7v6M12 16.5v.3" stroke="#fff" stroke-width="2.6" stroke-linecap="round" />
  </svg>
  <h1 class="title">{t.stop.title}</h1>
  <p class="text">{t.stop.text}</p>
  <ol class="list">
    {#each t.stop.flags as flag, i (i)}
      <li class:urgent={i < t.stop.urgentCount}>
        <span class="num">{i + 1}</span>
        <span>{#if i < t.stop.urgentCount}<b>{t.stop.urgent}</b> {/if}{flag}</span>
      </li>
    {/each}
  </ol>
</div>

<Dock>
  <div class="actions">
    <Button variant="alarm" grow href="tel:{t.stop.phone}">{t.stop.call}</Button>
    <Button variant="secondary" grow onclick={() => (onfinish ? onfinish() : closeTo(0))}>{t.stop.finish}</Button>
    <button class="back" onclick={pop}>{t.stop.back}</button>
  </div>
</Dock>

<style>
  .scroll { padding-bottom: calc(var(--safe-bottom) + 240px); }
  .sign { width: 44px; height: 44px; margin-top: 14px; display: block; }
  .title { font-size: 28px; font-weight: 700; letter-spacing: -.5px; line-height: 33px; margin-top: 10px; }
  .text { font-size: 15px; line-height: 20px; color: var(--t2); margin-top: 6px; }
  .list { list-style: none; margin-top: 14px; background: var(--card); border-radius: var(--r-list); overflow: hidden; box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  li { display: flex; gap: 12px; padding: 10px 14px; position: relative; font-size: 15px; line-height: 20px; }
  li + li::before { content: ''; position: absolute; top: 0; left: 52px; right: 0; height: .5px; background: var(--sep); }
  .num { width: 26px; height: 26px; border-radius: 8px; flex: none; margin-top: 1px; display: flex; align-items: center; justify-content: center; font: 700 14px var(--font-num); background: var(--fill2); color: var(--t2); }
  .urgent .num { background: rgba(255, 69, 58, .18); color: #FF6961; }
  b { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; color: #FF6961; margin-right: 2px; }
  .actions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
  .actions :global(.btn) { flex: none; width: 100%; }
  .back { height: 40px; font-size: 15px; color: var(--t2); }
  @media (prefers-color-scheme: light) {
    .urgent .num, b { color: #D70015; }
  }
</style>
