<script lang="ts">
  // A check that draws itself once: the ring, then the tick. Static when motion is reduced.
  let { size = 16, color = 'currentColor' }: { size?: number; color?: string } = $props();
</script>

<span class="ac" style:width="{size}px" style:height="{size}px" style:color={color} aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <circle class="ring" cx="12" cy="12" r="9.5" pathLength="1" />
    <path class="tick" d="M7.6 12.4l3 3 5.8-6.3" pathLength="1" />
  </svg>
</span>

<style>
  .ac { display: inline-flex; flex: none; margin-top: 1px; }
  svg { width: 100%; height: 100%; overflow: visible; }
  .ring, .tick { stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .42s var(--ease-ios) forwards; }
  .ring { opacity: .4; stroke-width: 2; }
  .tick { animation-delay: .28s; animation-duration: .34s; }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @media (prefers-reduced-motion: reduce) {
    .ring, .tick { animation: none; stroke-dashoffset: 0; }
  }
</style>
