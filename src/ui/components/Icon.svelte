<script lang="ts">
  import { ICON_PATHS, type IconName } from '../icons';

  let { name, size = 20, color, flip = false }: { name: IconName; size?: number; color?: string; flip?: boolean } = $props();
</script>

<span class="ic" class:flip style:width="{size}px" style:height="{size}px" style:color={color} aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{@html ICON_PATHS[name]}</svg>
</span>

<style>
  .ic { display: inline-flex; flex: none; }
  .flip { transform: scaleX(-1); }
  svg { width: 100%; height: 100%; }
</style>
