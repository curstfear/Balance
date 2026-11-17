<script lang="ts">
  // Small picture for lists: the end frame of the exercise, or a pre-rendered atlas close-up of the main muscle.
  import { mainMuscle, type Exercise } from '../../data/catalog';
  import { frameUrl, thumbUrl } from '../art/art';

  let { exercise: e, size = 48 }: { exercise: Exercise; size?: number } = $props();
  const art = $derived(e.technique.art);
</script>

<span class="th" style:width="{size}px" style:height="{size}px" aria-hidden="true">
  {#if art}
    <img class="lineart" src={frameUrl(art.id, art.first === 'tension' ? 'relaxation' : 'tension')} alt="" loading="lazy" decoding="async" />
  {:else}
    <img class="atlas" src={thumbUrl(mainMuscle(e))} alt="" loading="lazy" decoding="async" />
  {/if}
</span>

<style>
  .th { flex: none; border-radius: 12px; overflow: hidden; background: var(--fill2); display: flex; }
  img { width: 100%; height: 100%; }
  .lineart { padding: 1px; }
  .atlas { object-fit: cover; }
</style>
