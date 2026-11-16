<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="dock">{@render children()}</div>

<style>
  .dock {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 20; display: flex; gap: 10px;
    padding: 40px var(--gutter) max(16px, calc(var(--safe-bottom) - 6px));
    background: linear-gradient(180deg, transparent, var(--bg) 45%);
  }
</style>
