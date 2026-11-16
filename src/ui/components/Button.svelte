<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from './Icon.svelte';
  import type { IconName } from '../icons';

  type Props = {
    variant?: 'primary' | 'secondary' | 'danger';
    size?: 'l' | 'm';
    icon?: IconName;
    grow?: boolean;
    label?: string;
    onclick?: () => void;
    children: Snippet;
  };
  let { variant = 'primary', size = 'l', icon, grow = false, label, onclick, children }: Props = $props();
</script>

<button class="btn {variant} {size} press" class:grow aria-label={label} {onclick}>
  {#if icon}<Icon name={icon} size={18} />{/if}
  {@render children()}
</button>

<style>
  .btn {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-weight: 600; letter-spacing: -.2px; white-space: nowrap; padding: 0 18px;
  }
  .l { height: 56px; border-radius: 28px; font-size: 17px; }
  .m { height: 44px; border-radius: 22px; font-size: 15px; }
  .grow { flex: 1; width: 100%; }
  .primary { background: var(--lime); color: var(--lime-ink); font-weight: 650; }
  .secondary { background: var(--fill); color: var(--t1); }
  .danger { background: rgba(255, 69, 58, .16); color: #FF6961; }
</style>
