// Minimal iOS-like navigation stack: push (slide from right) and modal (slide up).

export type Kind = 'push' | 'modal';
interface Entry { el: HTMLElement; kind: Kind; dispose?: () => void }

const stack: Entry[] = [];
let root: HTMLElement;
const DURATION = 520;

export function h(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

const enterClass = (k: Kind) => (k === 'push' ? 'is-right' : 'is-below');
const behindClass = (k: Kind) => (k === 'push' ? 'is-behind' : 'is-sunk');

export function setRoot(container: HTMLElement, el: HTMLElement) {
  root = container;
  root.append(el);
  stack.push({ el, kind: 'push' });
}

export function push(el: HTMLElement, kind: Kind = 'push', dispose?: () => void) {
  const prev = stack[stack.length - 1];
  el.classList.add(enterClass(kind), 'no-anim');
  root.append(el);
  void el.offsetWidth; // commit start position
  el.classList.remove('no-anim');
  requestAnimationFrame(() => {
    el.classList.remove(enterClass(kind));
    prev?.el.classList.add(behindClass(kind));
  });
  stack.push({ el, kind, dispose });
}

export function pop() {
  if (stack.length < 2) return;
  const top = stack.pop()!;
  const prev = stack[stack.length - 1];
  top.el.classList.add(enterClass(top.kind));
  prev.el.classList.remove(behindClass(top.kind));
  top.dispose?.();
  setTimeout(() => top.el.remove(), DURATION);
}

/** Dismiss the top screen straight down to `depth`, dropping screens in between (e.g. workout → home). */
export function closeTo(depth: number) {
  const top = stack.pop();
  if (!top) return;
  while (stack.length > depth + 1) {
    const mid = stack.pop()!;
    mid.dispose?.();
    mid.el.remove();
  }
  const prev = stack[stack.length - 1];
  prev.el.classList.add('no-anim');
  prev.el.classList.remove('is-behind');
  prev.el.classList.add(behindClass(top.kind));
  void prev.el.offsetWidth;
  prev.el.classList.remove('no-anim');
  top.el.classList.add(enterClass(top.kind));
  prev.el.classList.remove(behindClass(top.kind));
  top.dispose?.();
  setTimeout(() => top.el.remove(), DURATION);
}

export function haptic(ms = 10) {
  // iOS Safari has no Vibration API; harmless no-op there.
  navigator.vibrate?.(ms);
}
