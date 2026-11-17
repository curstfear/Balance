// Offline support + safe updates.
// A new version is downloaded in the background and applied only when the app is hidden
// and the user is on the root screen — an update never interrupts a workout.
import { registerSW } from 'virtual:pwa-register';
import { nav } from './ui/nav.svelte';

export function setupPwa() {
  if (!('serviceWorker' in navigator)) return;

  let pending = false;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() { pending = true; },
    onRegisteredSW(_url, reg) {
      // iOS keeps home-screen apps alive for days — check for a new version when the app comes back
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg?.update().catch(() => {});
      });
    },
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pending && nav.stack.length === 1) {
      pending = false;
      updateSW(true); // activates the new worker and reloads while the app is not on screen
    }
  });

  // storage.persist() is requested in src/data/storage.svelte.ts once the database is open
}
