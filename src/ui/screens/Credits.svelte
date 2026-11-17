<script lang="ts">
  import Icon from '../components/Icon.svelte';
  import { pop } from '../nav.svelte';
  import { t } from '../strings';
</script>

<div class="scroll">
  <nav class="row navbar">
    <button class="back press" onclick={pop}><Icon name="chevL" size={24} /><span>{t.profile.title}</span></button>
  </nav>
  <h1 class="large title">{t.credits.title}</h1>
  <p class="intro">{t.credits.intro}</p>

  <div class="list">
    {#each t.credits.items as c (c.name)}
      <div class="li">
        <div class="nm">{c.name}</div>
        <div class="sub">{c.author} · {c.license}</div>
        <div class="links">
          <a href={c.url} target="_blank" rel="noopener noreferrer">{t.credits.sourceLink}</a>
          <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer">{t.credits.licenseLink}</a>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .navbar { height: 44px; margin: 0 -6px; }
  .back { display: flex; align-items: center; height: 44px; padding: 0 6px; color: var(--accent-text); font-size: 17px; }
  .title { margin: 2px 0 10px; }
  .intro { font-size: 15px; line-height: 21px; color: var(--t2); margin: 0 4px 16px; }
  .list { background: var(--card); border-radius: var(--r-list); overflow: hidden; box-shadow: var(--shadow), inset 0 0 0 1px var(--stroke); }
  .li { padding: 13px 16px; position: relative; }
  .li + .li::before { content: ''; position: absolute; top: 0; left: 16px; right: 0; height: .5px; background: var(--sep); }
  .nm { font-size: 16px; font-weight: 600; }
  .sub { font-size: 14px; color: var(--t2); margin-top: 2px; }
  .links { display: flex; gap: 18px; margin-top: 4px; }
  .links a { color: var(--accent-text); font-size: 15px; text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; }
</style>
