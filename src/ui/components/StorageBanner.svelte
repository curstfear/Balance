<script lang="ts">
  // Shown when IndexedDB cannot be used: the app still works, but nothing outlives closing it.
  import { fade } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import Button from './Button.svelte';
  import Sheet from './Sheet.svelte';
  import { storage, retryStorage } from '../../data/storage.svelte';
  import { t } from '../strings';

  const s = t.storage;
  let open = $state(false);
</script>

<div class="banner" role="status" aria-label={s.errorLabel} out:fade={{ duration: 250 }}>
  <div class="row head">
    <span class="chip"><Icon name="alert" size={20} /></span>
    <b>{s.errorTitle}</b>
  </div>
  <p>{s.errorText}{#if storage.retryFailed} <span class="failed">{s.retryFailed}</span>{/if}</p>
  <div class="row actions">
    <Button variant="secondary" size="m" grow onclick={() => { if (!storage.retrying) retryStorage(); }}>{storage.retrying ? s.retrying : s.retry}</Button>
    <button class="more" onclick={() => (open = true)}>{s.more}</button>
  </div>
</div>

<Sheet {open} title={s.adviceTitle} onclose={() => (open = false)}>
  <p class="advice">{s.advice[storage.problem ?? 'unknown']}</p>
  <Button grow onclick={() => (open = false)}>{t.storage.install.ok}</Button>
</Sheet>

<style>
  .banner {
    margin-top: 14px; padding: 14px;
    background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
  }
  .head { gap: 12px; }
  .head b { font-size: 15px; font-weight: 600; letter-spacing: -.2px; }
  .chip { width: 36px; height: 36px; border-radius: 14px; background: rgba(255, 138, 61, .14); color: var(--orange); display: flex; align-items: center; justify-content: center; flex: none; }
  p { font-size: 14px; line-height: 19px; color: var(--t2); margin-top: 8px; }
  .failed { color: var(--t1); }
  .actions { gap: 10px; margin-top: 12px; }
  .more { flex: 1; height: 44px; color: var(--accent-text); font-size: 15px; font-weight: 600; }
  .advice { font-size: 15px; line-height: 20px; color: var(--t1); margin: 10px 0 18px; }
</style>
