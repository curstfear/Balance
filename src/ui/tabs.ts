// Switching between root tabs. Screens are loaded on demand: the catalog stays out of the first download.
import { setRoot } from './nav.svelte';
import Home from './screens/Home.svelte';

export type Tab = 'today' | 'history' | 'progress' | 'profile';

export async function goTab(tab: Tab) {
  if (tab === 'today') setRoot(Home, {});
  else if (tab === 'profile') setRoot((await import('./screens/Profile.svelte')).default, {});
  // «История» and «Прогресс» arrive at stage 6
}
