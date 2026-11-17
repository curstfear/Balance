<script lang="ts">
  import Icon from './Icon.svelte';
  import type { IconName } from '../icons';
  import { t } from '../strings';

  type Tab = 'today' | 'history' | 'progress' | 'profile';
  let { active, onstart, onselect }: { active: Tab; onstart: () => void; onselect?: (tab: Tab) => void } = $props();

  const left: [Tab, IconName][] = [['today', 'home'], ['history', 'cal']];
  const right: [Tab, IconName][] = [['progress', 'chart'], ['profile', 'user']];
</script>

{#snippet tab(id: Tab, icon: IconName)}
  <button class="tab press" aria-current={active === id ? 'page' : undefined} onclick={() => id !== active && onselect?.(id)}><Icon name={icon} size={25} />{t.tabs[id]}</button>
{/snippet}

<div class="fade" aria-hidden="true"></div>
<nav class="tabbar" aria-label={t.tabs.label}>
  {#each left as [id, icon] (id)}{@render tab(id, icon)}{/each}
  <button class="go press" aria-label={t.tabs.start} onclick={onstart}><Icon name="play" size={22} /></button>
  {#each right as [id, icon] (id)}{@render tab(id, icon)}{/each}
</nav>

<style>
  .fade {
    position: absolute; left: 0; right: 0; bottom: 0; height: 120px; pointer-events: none; z-index: 25;
    background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 70%, transparent));
  }
  .tabbar {
    position: absolute; left: 14px; right: 14px; bottom: max(10px, calc(var(--safe-bottom) - 8px)); z-index: 30;
    height: 66px; border-radius: 33px; padding: 0 6px;
    display: flex; align-items: center; justify-content: space-around;
    background: var(--glass); box-shadow: inset 0 0 0 .7px var(--glass-stroke);
    -webkit-backdrop-filter: blur(22px) saturate(180%); backdrop-filter: blur(22px) saturate(180%);
  }
  .tab { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 62px; font-size: 10.5px; font-weight: 600; color: var(--t2); }
  .tab[aria-current='page'] { color: var(--t1); }
  .tab[aria-current='page'] :global(.ic) { color: var(--accent-text); }
  .go { width: 64px; height: 48px; border-radius: 24px; background: var(--lime); color: var(--lime-ink); display: flex; align-items: center; justify-content: center; }
</style>
