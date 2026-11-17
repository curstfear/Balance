<script lang="ts">
  // Safari may evict data of a site that was not opened for a while; a home-screen app keeps it.
  import Icon from './Icon.svelte';
  import Button from './Button.svelte';
  import Sheet from './Sheet.svelte';
  import { hideInstallHint } from '../../data/storage.svelte';
  import { haptic } from '../nav.svelte';
  import { t } from '../strings';

  const s = t.storage.install;
  let open = $state(false);
</script>

<div class="hint">
  <button class="main press" aria-label={s.label} onclick={() => { open = true; haptic(); }}>
    <span class="chip"><Icon name="share" size={20} /></span>
    <span class="txt"><b>{s.title}</b><span>{s.text}</span></span>
  </button>
  <button class="later" aria-label={s.laterLabel} onclick={() => { hideInstallHint(); haptic(); }}>{s.later}</button>
</div>

<Sheet {open} title={s.sheetTitle} subtitle={s.sheetText} onclose={() => (open = false)}>
  <ol class="steps">
    {#each s.steps as step, i (i)}
      <li><span class="num n" aria-hidden="true">{i + 1}</span><span>{#if i === 0}<span class="share"><Icon name="share" size={16} /></span>{/if}{step}</span></li>
    {/each}
  </ol>
  <Button grow onclick={() => (open = false)}>{s.ok}</Button>
</Sheet>

<style>
  .hint {
    display: flex; align-items: center; margin-top: 12px; padding-right: 8px;
    background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
  }
  .main { flex: 1; display: flex; align-items: center; gap: 12px; padding: 14px; text-align: left; min-width: 0; }
  .chip { width: 36px; height: 36px; border-radius: 14px; background: var(--fill2); color: var(--t2); display: flex; align-items: center; justify-content: center; flex: none; }
  .txt b { display: block; font-size: 15px; font-weight: 600; letter-spacing: -.2px; }
  .txt span { display: block; font-size: 13px; line-height: 17px; color: var(--t2); margin-top: 2px; }
  .later { min-width: 44px; min-height: 44px; padding: 0 8px; color: var(--t2); font-size: 15px; font-weight: 500; flex: none; }
  .steps { list-style: none; margin: 10px 0 18px; }
  .steps li { display: flex; align-items: center; gap: 12px; padding: 12px 0; font-size: 15px; line-height: 20px; }
  .steps li + li { border-top: .5px solid var(--sep); }
  .num { width: 28px; height: 28px; border-radius: 50%; background: var(--fill2); display: flex; align-items: center; justify-content: center; font-size: 14px; flex: none; }
  .share { display: inline-flex; vertical-align: -3px; margin-right: 5px; color: var(--blue); }
  @media (prefers-color-scheme: light) { .share { color: #007AFF; } }
</style>
