// Swipe a card sideways to dismiss it (like a notification). Touch events, as in nav.svelte.ts:
// iOS cancels pointer streams once it starts scrolling. Vertical movement is left to the page.
import { haptic } from './nav.svelte';

const SLOP = 8;

export function swipeAway(onDismiss: () => void) {
  return (node: HTMLElement) => {
    let mode: 'idle' | 'track' | 'drag' = 'idle';
    let sx = 0, sy = 0, dx = 0;

    const reset = () => { node.style.transition = 'transform .3s var(--ease-ios), opacity .3s'; node.style.transform = ''; node.style.opacity = ''; };

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) { mode = 'idle'; return; }
      sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; mode = 'track';
    };
    const onMove = (e: TouchEvent) => {
      if (mode === 'idle') return;
      const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
      if (mode === 'track') {
        if (Math.abs(x) < SLOP && Math.abs(y) < SLOP) return;
        if (Math.abs(x) < Math.abs(y) * 1.2) { mode = 'idle'; return; } // vertical scroll wins
        mode = 'drag';
        node.style.transition = 'none';
        sx += Math.sign(x) * SLOP;
      }
      e.preventDefault();
      dx = e.touches[0].clientX - sx;
      node.style.transform = `translateX(${dx}px)`;
      node.style.opacity = String(Math.max(0.15, 1 - Math.abs(dx) / node.offsetWidth));
    };
    const onEnd = (e: TouchEvent) => {
      if (mode !== 'drag') { mode = 'idle'; return; }
      mode = 'idle';
      if (e.type === 'touchend' && Math.abs(dx) > node.offsetWidth * 0.35) {
        node.style.transition = 'transform .25s var(--ease-ios), opacity .25s';
        node.style.transform = `translateX(${Math.sign(dx) * node.offsetWidth * 1.1}px)`;
        node.style.opacity = '0';
        haptic();
        setTimeout(onDismiss, 220);
      } else reset();
    };

    node.addEventListener('touchstart', onStart, { passive: true });
    node.addEventListener('touchmove', onMove, { passive: false });
    node.addEventListener('touchend', onEnd);
    node.addEventListener('touchcancel', onEnd);
    return () => {
      node.removeEventListener('touchstart', onStart);
      node.removeEventListener('touchmove', onMove);
      node.removeEventListener('touchend', onEnd);
      node.removeEventListener('touchcancel', onEnd);
    };
  };
}
