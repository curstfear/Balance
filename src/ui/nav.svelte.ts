// Navigation stack: push (slide from the right, swipe back from the left edge) and modal (slide up).
import { tick, type Component } from 'svelte';

export type Kind = 'root' | 'push' | 'modal';
export type Pos = 'enter' | 'active' | 'behind-push' | 'behind-modal';

export interface Entry {
  id: number;
  component: Component<any>;
  props: Record<string, unknown>;
  kind: Kind;
  pos: Pos;
  anim: boolean;
}

export const DURATION = 520;
let seq = 0;

export const nav = $state({ stack: [] as Entry[] });

const top = () => nav.stack[nav.stack.length - 1];
const frames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function entry<P extends Record<string, unknown>>(component: Component<P>, props: P, kind: Kind, pos: Pos): Entry {
  return { id: ++seq, component, props, kind, pos, anim: false };
}

export function setRoot<P extends Record<string, unknown>>(component: Component<P>, props: P) {
  nav.stack = [entry(component, props, 'root', 'active')];
}

export async function push<P extends Record<string, unknown>>(component: Component<P>, props: P, kind: 'push' | 'modal' = 'push') {
  const prev = top();
  nav.stack.push(entry(component, props, kind, 'enter'));
  const added = top();
  await tick();
  await frames(); // let the start position paint first
  added.anim = true;
  added.pos = 'active';
  if (prev) {
    prev.anim = true;
    prev.pos = kind === 'push' ? 'behind-push' : 'behind-modal';
  }
}

export function pop() {
  if (nav.stack.length < 2) return;
  const leaving = top();
  const prev = nav.stack[nav.stack.length - 2];
  leaving.anim = prev.anim = true;
  leaving.pos = 'enter';
  prev.pos = 'active';
  const id = leaving.id;
  setTimeout(() => { nav.stack = nav.stack.filter((e) => e.id !== id); }, DURATION);
}

/** Dismiss the top screen straight down to `depth`, dropping the screens in between (workout → home). */
export async function closeTo(depth: number) {
  const leaving = top();
  if (!leaving || nav.stack.length <= depth + 1) return;
  nav.stack = [...nav.stack.slice(0, depth + 1), leaving];
  const target = nav.stack[depth];
  const behind: Pos = leaving.kind === 'modal' ? 'behind-modal' : 'behind-push';
  if (target.pos !== behind) {
    target.anim = false;
    target.pos = behind;
    await tick();
    await frames();
  }
  pop();
}

// ---- swipe back (push screens only) ----
// Touch events, not pointer events: iOS cancels pointer streams as soon as it starts scrolling.
// The gesture can start anywhere on the screen (as in iOS 26); direction is decided after 8px.
// While dragging, styles are written straight to the DOM — no re-render per frame.

export function canSwipeBack(e: Entry): boolean {
  return e === top() && e.kind === 'push' && nav.stack.length > 1;
}

const SLOP = 8;
const BEHIND = 28; // % the screen underneath is shifted left

export function swipeBack(e: Entry) {
  return (node: HTMLElement) => {
    let mode: 'idle' | 'track' | 'drag' = 'idle';
    let sx = 0, sy = 0, w = 1;
    let under: HTMLElement | null = null;
    let samples: { x: number; t: number }[] = [];

    const set = (el: HTMLElement | null, transform: string, filter = '') => {
      if (!el) return;
      el.style.transform = transform;
      el.style.filter = filter;
    };
    const apply = (dx: number) => {
      const p = Math.min(1, dx / w);
      set(node, `translateX(${dx}px)`);
      set(under, `translateX(${(-BEHIND + BEHIND * p).toFixed(2)}%)`, `brightness(${(0.7 + 0.3 * p).toFixed(3)})`);
    };
    const release = () => {
      for (const el of [node, under]) {
        if (!el) continue;
        el.style.transition = el.style.transform = el.style.filter = el.style.willChange = '';
      }
    };

    const onStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1 || !canSwipeBack(e)) { mode = 'idle'; return; }
      const t = ev.touches[0];
      sx = t.clientX; sy = t.clientY; w = node.clientWidth || 1;
      samples = [{ x: sx, t: ev.timeStamp }];
      mode = 'track';
    };

    const onMove = (ev: TouchEvent) => {
      if (mode === 'idle') return;
      const t = ev.touches[0];
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (mode === 'track') {
        if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
        if (dx <= 0 || Math.abs(dx) < Math.abs(dy) * 1.2) { mode = 'idle'; return; } // vertical scroll wins
        mode = 'drag';
        under = node.previousElementSibling as HTMLElement | null;
        for (const el of [node, under]) if (el) { el.style.transition = 'none'; el.style.willChange = 'transform'; }
        sx = t.clientX; // start from here so the screen doesn't jump by the slop
      }
      ev.preventDefault();
      apply(Math.max(0, t.clientX - sx));
      samples.push({ x: t.clientX, t: ev.timeStamp });
      if (samples.length > 6) samples.shift();
    };

    const onEnd = (ev: TouchEvent) => {
      if (mode !== 'drag') { mode = 'idle'; return; }
      mode = 'idle';
      const last = samples[samples.length - 1];
      const first = samples[0];
      const dx = Math.max(0, last.x - sx);
      const v = (last.x - first.x) / Math.max(1, last.t - first.t); // px/ms
      const commit = ev.type === 'touchend' && (dx > w * 0.4 || (v > 0.35 && dx > 24));
      release(); // inline styles off → CSS classes take over and animate from the current spot
      if (commit) pop();
      under = null;
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

export function haptic(ms = 10) {
  // iOS Safari has no Vibration API; harmless no-op there.
  navigator.vibrate?.(ms);
}
