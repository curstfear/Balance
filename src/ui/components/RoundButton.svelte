<script lang="ts">
  import Icon from './Icon.svelte';
  import type { IconName } from '../icons';

  let { icon, label, size = 44, onclick }: { icon: IconName; label: string; size?: number; onclick?: () => void } = $props();
</script>

<button class="round press" style:width="{size}px" style:height="{size}px" aria-label={label} {onclick}>
  <Icon name={icon} size={Math.round(size * 0.4)} />
</button>

<style>
  .round { border-radius: 50%; background: var(--fill); display: flex; align-items: center; justify-content: center; flex: none; }
</style>
