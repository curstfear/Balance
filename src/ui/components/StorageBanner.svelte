<script lang="ts">
  // Shown when IndexedDB cannot be used: the app still works, but nothing outlives closing it.
  // After a retry that worked it turns into a short green confirmation, then fades away.
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import Button from './Button.svelte';
  import Sheet from './Sheet.svelte';
  import AnimatedCheck from './AnimatedCheck.svelte';
  import { storage, retryStorage } from '../../data/storage.svelte';
  import { haptic } from '../nav.svelte';
  import { t } from '../strings';

  const s = t.storage;
  let open = $state(false);
  const ok = $derived(storage.status === 'ok');

  $effect(() => { if (ok) { open = false; haptic(15); } });
</script>

<div class="banner" class:ok role="status" aria-label={ok ? s.recoveredTitle : s.errorLabel} out:fade={{ duration: 300 }}>
  {#if ok}
    <div class="row head">
      <span class="chip"><AnimatedCheck size={20} /></span>
      <span><b>{s.recoveredTitle}</b><span class="sub">{s.recoveredText}</span></span>
    </div>
  {:else}
    <div class="row head">
      <span class="chip"><Icon name="alert" size={20} /></span>
      <b>{s.errorTitle}</b>
    </div>
    <p>{s.errorText}{#if storage.retryFailed} <span class="failed">{s.retryFailed}</span>{/if}</p>
    <div class="row actions">
      <Button variant="secondary" size="m" onclick={() => { if (!storage.retrying) retryStorage(); }}>{storage.retrying ? s.retrying : s.retry}</Button>
      <button class="more" onclick={() => (open = true)}>{s.more}</button>
    </div>
  {/if}
</div>

<Sheet {open} title={s.adviceTitle} onclose={() => (open = false)}>
  <p class="advice">{s.advice[storage.problem ?? 'unknown']}</p>
  <Button grow onclick={() => (open = false)}>{t.storage.install.ok}</Button>
</Sheet>

<style>
  .banner {
    margin-top: 14px; padding: 14px;
    background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
    transition: background-color .35s var(--ease-ios);
  }
  .banner.ok { background: color-mix(in srgb, var(--green) 12%, var(--card)); }
  .head { gap: 12px; }
  .head b { display: block; font-size: 15px; font-weight: 600; letter-spacing: -.2px; }
  .sub { display: block; font-size: 13px; line-height: 17px; color: var(--t2); margin-top: 2px; }
  .chip { width: 36px; height: 36px; border-radius: 14px; background: rgba(255, 138, 61, .14); color: var(--orange); display: flex; align-items: center; justify-content: center; flex: none; transition: background-color .35s, color .35s; }
  .ok .chip { background: rgba(52, 199, 89, .18); color: var(--green); }
  @media (prefers-color-scheme: light) { .ok .chip { color: #1F8A3B; } }
  p { font-size: 14px; line-height: 19px; color: var(--t2); margin-top: 8px; }
  .failed { color: var(--t1); }
  .actions { gap: 10px; margin-top: 12px; }
  .more { flex: none; padding: 0 14px; height: 44px; color: var(--accent-text); font-size: 15px; font-weight: 600; }
  .advice { font-size: 15px; line-height: 20px; color: var(--t1); margin: 10px 0 18px; }
</style>
