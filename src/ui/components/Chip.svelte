<script lang="ts">
  import type { Snippet } from 'svelte';

  let { dot, variant = 'default', children }: { dot?: string; variant?: 'default' | 'accent' | 'done' | 'muted'; children: Snippet } = $props();
</script>

<span class="chip {variant}">
  {#if dot}<span class="dot" style:background={dot}></span>{/if}
  {@render children()}
</span>

<style>
  .chip {
    display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px;
    border-radius: 14px; background: var(--fill2); font-size: 13px; font-weight: 600; white-space: nowrap;
  }
  .accent { background: var(--lime); color: var(--lime-ink); }
  .done { color: var(--t2); }
  .muted { color: var(--t3); }
</style>
