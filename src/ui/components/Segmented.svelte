<script lang="ts" generics="T extends string | number">
  type Props = { options: { value: T; label: string }[]; value: T; label: string; onchange?: (v: T) => void };
  let { options, value = $bindable(), label, onchange }: Props = $props();

  const index = $derived(Math.max(0, options.findIndex((o) => o.value === value)));
</script>

<div class="seg" role="radiogroup" aria-label={label} style="--n:{options.length};--i:{index}">
  <span class="thumb" aria-hidden="true"></span>
  {#each options as o (o.value)}
    <button role="radio" aria-checked={o.value === value} onclick={() => { if (o.value !== value) { value = o.value; onchange?.(o.value); } }}>{o.label}</button>
  {/each}
</div>

<style>
  .seg { position: relative; display: flex; background: var(--fill2); border-radius: 10px; padding: 2px; height: 34px; }
  .thumb {
    position: absolute; top: 2px; bottom: 2px; left: 2px; width: calc((100% - 4px) / var(--n));
    transform: translateX(calc(100% * var(--i))); border-radius: 8px; background: var(--seg-on);
    transition: transform .35s var(--ease-ios);
  }
  button { position: relative; flex: 1; font-size: 13px; font-weight: 600; }
</style>
