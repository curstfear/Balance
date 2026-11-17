<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import { cubicOut } from 'svelte/easing';
  import { t } from '../strings';

  // Bottom sheet: slides up over the current screen. Closes by tapping the dim area,
  // swiping down (when its content is scrolled to the top) or Escape.
  type Props = { open: boolean; title: string; subtitle?: string; onclose: () => void; children: Snippet };
  let { open, title, subtitle, onclose, children }: Props = $props();

  const id = `sheet-${Math.random().toString(36).slice(2, 8)}`;

  function slideUp(_node: Element, { duration = 420 } = {}) {
    return { duration, easing: cubicOut, css: (t: number) => `transform: translateY(${(1 - t) * 100}%)` };
  }

  function dragDown(node: HTMLElement) {
    let startY = 0, dy = 0, active = false, samples: { y: number; t: number }[] = [];
    const scroller = () => node.querySelector<HTMLElement>('.content');
    const onStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1 || (scroller()?.scrollTop ?? 0) > 0) return;
      startY = ev.touches[0].clientY; dy = 0; active = true; samples = [{ y: startY, t: ev.timeStamp }];
    };
    const onMove = (ev: TouchEvent) => {
      if (!active) return;
      dy = ev.touches[0].clientY - startY;
      if (dy <= 0) { node.style.transform = ''; return; }
      ev.preventDefault();
      node.style.transition = 'none';
      node.style.transform = `translateY(${dy}px)`;
      samples.push({ y: ev.touches[0].clientY, t: ev.timeStamp });
      if (samples.length > 6) samples.shift();
    };
    const onEnd = () => {
      if (!active) return;
      active = false;
      const v = (samples[samples.length - 1].y - samples[0].y) / Math.max(1, samples[samples.length - 1].t - samples[0].t);
      node.style.transition = 'transform .3s var(--ease-ios)';
      if (dy > node.offsetHeight * 0.3 || (v > 0.5 && dy > 24)) onclose();
      else node.style.transform = '';
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
  }
</script>

<svelte:window onkeydown={(e) => { if (open && e.key === 'Escape') onclose(); }} />

{#if open}
  <button class="dim" aria-label={t.common.close} tabindex="-1" onclick={onclose} transition:fade={{ duration: 300 }}></button>
  <div class="sheet" role="dialog" aria-modal="true" aria-labelledby={id} transition:slideUp {@attach dragDown}>
    <div class="grab" aria-hidden="true"></div>
    <h2 {id}>{title}</h2>
    {#if subtitle}<div class="sub">{subtitle}</div>{/if}
    <div class="content">{@render children()}</div>
  </div>
{/if}

<style>
  .dim { position: absolute; inset: 0; z-index: 60; background: rgba(0, 0, 0, .55); cursor: default; }
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 61; max-height: 92%;
    display: flex; flex-direction: column;
    background: var(--sheet); border-radius: 34px 34px 0 0;
    padding: 8px var(--gutter) max(24px, var(--safe-bottom));
  }
  .grab { width: 38px; height: 5px; border-radius: 3px; background: var(--t3); margin: 0 auto 14px; flex: none; }
  h2 { font-size: 22px; font-weight: 700; letter-spacing: -.4px; }
  .sub { font-size: 15px; color: var(--t2); margin-top: 3px; }
  .content { overflow-y: auto; overscroll-behavior: contain; margin: 0 calc(-1 * var(--gutter)); padding: 0 var(--gutter); }
</style>
