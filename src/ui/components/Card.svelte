<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = { hero?: boolean; pad?: number; label?: string; onclick?: () => void; children: Snippet; style?: string };
  let { hero = false, pad = 16, label, onclick, children, style = '' }: Props = $props();
</script>

{#if onclick}
  <button class="card press tap" class:hero style="padding:{pad}px;{style}" aria-label={label} {onclick}>{@render children()}</button>
{:else}
  <div class="card" class:hero style="padding:{pad}px;{style}">{@render children()}</div>
{/if}

<style>
  .card {
    display: block; width: 100%; text-align: left; position: relative; overflow: hidden;
    background: var(--card); border-radius: var(--r-card);
    box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke);
  }
  .tap:active { transform: scale(.985); }
  /* the one place glow is allowed: cards with an illustration */
  .hero { background: radial-gradient(90% 90% at 105% -5%, var(--hero-glow), transparent 60%), var(--card); }
  .hero > :global(*) { position: relative; }
</style>
