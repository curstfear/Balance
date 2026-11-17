<script lang="ts">
  // Small picture for lists: the end frame of the exercise, or the atlas close-up when there is no frame.
  import { mainMuscle, type Exercise } from '../../data/catalog';
  import { frameUrl } from '../art/art';
  import MuscleZoom from './MuscleZoom.svelte';

  let { exercise: e, size = 48 }: { exercise: Exercise; size?: number } = $props();
</script>

<span class="th" style:width="{size}px" style:height="{size}px" aria-hidden="true">
  {#if e.technique.art}
    <span class="pic" style="--src:url('{frameUrl(e.technique.art.id, e.technique.art.first === 'tension' ? 'relaxation' : 'tension')}')"></span>
  {:else}
    <MuscleZoom muscles={e.muscles} focus={mainMuscle(e)} label="" />
  {/if}
</span>

<style>
  .th { flex: none; border-radius: 12px; overflow: hidden; background: var(--fill2); display: flex; padding: 3px; }
  .pic { flex: 1; background: var(--t1); opacity: .85; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
</style>
