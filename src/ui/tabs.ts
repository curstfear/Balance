// Switching between root tabs and starting a workout from any of them.
// Profile is loaded on demand: the catalog stays out of the first download.
import { depth, push, setRoot, haptic } from './nav.svelte';
import { storage } from '../data/storage.svelte';
import Home from './screens/Home.svelte';
import Plan from './screens/Plan.svelte';

export type Tab = 'today' | 'history' | 'progress' | 'profile';

let seq = 0;

export async function goTab(tab: Tab) {
  const my = ++seq;
  if (tab === 'today') setRoot(Home, {});
  else if (tab === 'profile') {
    const Profile = (await import('./screens/Profile.svelte')).default;
    // while the chunk was loading: a newer tab tap, or a restored workout opened on top — keep that
    if (my !== seq || depth() !== 1) return;
    setRoot(Profile, {});
  }
  // «История» and «Прогресс» arrive at stage 6
}

export function startWorkout() {
  haptic(15);
  storage.autoClosed = false;
  push(Plan, {});
}
