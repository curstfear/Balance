import { planFor, totals, type Plan } from '../preview-data';
import { icon } from './icons';
import { h, haptic } from './nav';
import { fmt } from './format';

type Minutes = 45 | 55 | 70;

function body(plan: Plan, minutes: Minutes): string {
  const t = totals(plan);
  return `
    <nav class="row navbar"><button class="press" data-act="back">${icon('chevL')}<span>Сегодня</span></button><span class="sp"></span></nav>
    <div class="eyebrow" style="margin-top:6px">План на сегодня</div>
    <h1 class="large" style="margin-top:2px">${plan.title}</h1>
    <div class="seg" role="group" aria-label="Длительность" style="margin-top:14px">
      ${([45, 55, 70] as Minutes[]).map((m) => `<button data-min="${m}" aria-pressed="${m === minutes}">${m === 45 ? 'Короче · 45' : m === 70 ? 'Длиннее · 70' : '55 мин'}</button>`).join('')}
    </div>
    <div class="stats3">
      <div><div class="eyebrow" style="font-size:12px">Подходы</div><div class="n" style="color:var(--blue)">${t.sets}</div></div>
      <div style="flex:1.2"><div class="eyebrow" style="font-size:12px">Объём</div><div class="n" style="color:var(--lime)">${fmt(t.tonnage / 1000, 1)}<span class="u">т</span></div></div>
      <div><div class="eyebrow" style="font-size:12px">Время</div><div class="n" style="color:var(--yellow)">${minutes}<span class="u">мин</span></div></div>
    </div>
    <div class="sec">Разминка · 5 мин</div>
    <div class="list"><div class="li" style="align-items:center">
      <div class="badge" style="background:var(--fill2);color:var(--t2)">${icon('flame', '', 'width:16px;height:16px')}</div>
      <div><div class="nm">Гребля + 2 лёгких подхода тяги</div><div class="sub">Добавлено само перед тяжёлой тягой</div></div></div></div>
    <div class="sec">Основная часть</div>
    <div class="list">
      ${plan.exercises.map((e, i) => `<div class="li">
        <div class="badge" style="background:color-mix(in srgb,var(--c-${e.muscle}) 20%,transparent);color:var(--c-${e.muscle})">${i + 1}</div>
        <div style="flex:1;min-width:0"><div class="nm">${e.name}</div>
          <div class="sub"><span class="n">${e.sets} × ${e.reps[0]}${e.reps[1] !== e.reps[0] ? '–' + e.reps[1] : ''}</span> · <span class="n">${fmt(e.weight)}</span> кг</div>
          <div class="why ${e.up ? 'up' : ''}">${icon(e.up ? 'trendUp' : 'bolt')}${e.why}</div></div>
        ${icon('swap', 'swap')}</div>`).join('')}
    </div>`;
}

export function planScreen(opts: { onBack: () => void; onStart: (plan: Plan, minutes: Minutes) => void }): HTMLElement {
  let minutes: Minutes = 55;
  let plan = planFor(minutes);

  const el = h(`<section class="screen" aria-label="План тренировки"><div class="scroll"></div>
    <div class="dock"><button class="btn press" data-act="go">${icon('play')}Начать тренировку</button></div></section>`);
  const scroll = el.querySelector('.scroll') as HTMLElement;
  const render = () => { scroll.innerHTML = body(plan, minutes); };
  render();

  el.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const seg = target.closest<HTMLElement>('[data-min]');
    if (seg) {
      const m = Number(seg.dataset.min) as Minutes;
      if (m !== minutes) { minutes = m; plan = planFor(m); haptic(); render(); }
      return;
    }
    if (target.closest('[data-act="back"]')) opts.onBack();
    if (target.closest('[data-act="go"]')) { haptic(15); opts.onStart(plan, minutes); }
  });
  return el;
}
