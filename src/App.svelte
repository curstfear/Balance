<script lang="ts">
  import { nav, dragStart, dragMove, dragEnd, dragStyle } from './ui/nav.svelte';

  let width = $state(400);
</script>

<div id="app" bind:clientWidth={width}>
  {#each nav.stack as e, i (e.id)}
    <section
      class="screen pos-{e.pos}"
      class:no-anim={!e.anim}
      class:modal={e.kind === 'modal'}
      style={dragStyle(e, i, width)}
      onpointerdown={(ev) => dragStart(ev, e)}
      onpointermove={dragMove}
      onpointerup={dragEnd}
      onpointercancel={dragEnd}
      aria-hidden={i < nav.stack.length - 1}
      inert={i < nav.stack.length - 1}
    >
      <e.component {...e.props} />
    </section>
  {/each}
</div>

<style>
  #app {
    position: fixed;
    inset: 0;
    max-width: 440px;
    margin: 0 auto;
    overflow: hidden;
    background: var(--bg);
  }
  .screen {
    position: absolute;
    inset: 0;
    background: var(--bg);
    overflow: hidden;
    touch-action: pan-y;
    transition: transform 0.5s var(--ease-ios), filter 0.5s var(--ease-ios);
  }
  .screen.pos-enter { transform: translateX(100%); }
  .screen.modal.pos-enter { transform: translateY(100%); }
  .screen.pos-behind-push { transform: translateX(-28%); filter: brightness(0.7); }
  .screen.pos-behind-modal { transform: scale(0.94); filter: brightness(0.6); }
  .screen.no-anim { transition: none; }
  @media (prefers-reduced-motion: reduce) {
    .screen { transition-duration: 0.01s; }
  }
</style>
