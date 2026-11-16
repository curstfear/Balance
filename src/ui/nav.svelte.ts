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
  /** px offset while the user drags the screen back */
  drag: number | null;
}

export const DURATION = 520;
let seq = 0;

export const nav = $state({ stack: [] as Entry[] });

const top = () => nav.stack[nav.stack.length - 1];
const frames = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

function entry<P extends Record<string, unknown>>(component: Component<P>, props: P, kind: Kind, pos: Pos): Entry {
  return { id: ++seq, component, props, kind, pos, anim: false, drag: null };
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
  leaving.drag = prev.drag = null;
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

// ---- swipe back from the left edge (push screens only) ----
const EDGE = 28;
let start: { x: number; t: number; w: number } | null = null;

export function canSwipeBack(e: Entry): boolean {
  return e === top() && e.kind === 'push' && nav.stack.length > 1;
}

export function dragStart(ev: PointerEvent, e: Entry) {
  if (!canSwipeBack(e) || ev.clientX > EDGE) return;
  start = { x: ev.clientX, t: ev.timeStamp, w: (ev.currentTarget as HTMLElement).clientWidth };
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
}

export function dragMove(ev: PointerEvent) {
  if (!start) return;
  const dx = Math.max(0, ev.clientX - start.x);
  const cur = top();
  const prev = nav.stack[nav.stack.length - 2];
  cur.anim = prev.anim = false;
  cur.drag = dx;
  prev.drag = dx;
}

export function dragEnd(ev: PointerEvent) {
  if (!start) return;
  const dx = Math.max(0, ev.clientX - start.x);
  const v = dx / Math.max(1, ev.timeStamp - start.t);
  const w = start.w;
  start = null;
  if (dx > w * 0.33 || (v > 0.5 && dx > 30)) {
    pop();
  } else {
    const cur = top();
    const prev = nav.stack[nav.stack.length - 2];
    cur.anim = prev.anim = true;
    cur.drag = prev.drag = null;
  }
}

/** Inline transform while dragging; null = let the CSS position classes apply. */
export function dragStyle(e: Entry, index: number, width: number): string | null {
  if (e.drag === null) return null;
  const isTop = index === nav.stack.length - 1;
  if (isTop) return `transform: translateX(${e.drag}px)`;
  const p = Math.min(1, e.drag / width);
  return `transform: translateX(${(-28 + 28 * p).toFixed(2)}%); filter: brightness(${(0.7 + 0.3 * p).toFixed(3)})`;
}

export function haptic(ms = 10) {
  // iOS Safari has no Vibration API; harmless no-op there.
  navigator.vibrate?.(ms);
}
