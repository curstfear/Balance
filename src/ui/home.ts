import { MUSCLES, weekBalance, planFor, totals } from '../preview-data';
import { icon } from './icons';
import { flower, weekRing, dumbbell } from './graphics';
import { h } from './nav';

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

function weekStrip(today: Date): string {
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  // preview pattern: trained Mon + Wed, next planned Sat
  const state = (i: number) => (i === dow ? 'today' : i < dow ? (i % 2 === 0 ? 'done' : 'rest') : i === 5 ? 'plan' : 'rest');
  return DAYS.map((d, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const st = state(i);
    const ring = st === 'done' ? weekRing(false) : st === 'plan' ? weekRing(true) : '';
    return `<div><div class="d ${st === 'today' ? 'cur' : ''}">${d}</div><div class="c ${st === 'today' ? 'today' : st === 'rest' ? 'rest' : ''}">${ring}${date.getDate()}</div></div>`;
  }).join('');
}

export function homeScreen(onStart: () => void): HTMLElement {
  const now = new Date();
  const plan = planFor(55);
  const t = totals(plan);
  const score = Math.round(weekBalance.reduce((a, b) => a + b, 0) / weekBalance.length);

  const el = h(`<section class="screen" aria-label="Сегодня"><div class="scroll">
    <header class="row home-head">
      <div><div class="eyebrow">${WEEKDAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]}</div><h1 class="large">Сегодня</h1></div>
      <span class="sp"></span><div class="avatar" aria-hidden="true">А</div>
    </header>
    <div class="week">${weekStrip(now)}</div>

    <button class="card hero press-soft press" data-act="start" aria-label="Следующая тренировка: ${plan.title}">
      ${dumbbell()}
      <div class="row" style="gap:7px"><span class="dot" style="background:var(--lime)"></span><span class="eyebrow" style="font-size:12px">Следующая тренировка</span></div>
      <div class="hero-title">Спина<br>и бицепс</div>
      <div class="row t2" style="gap:14px;font-size:15px;margin-top:8px">
        <span class="row" style="gap:4px">${icon('clock', '', 'width:15px;height:15px')}<span class="n" style="font-weight:600">55</span> мин</span>
        <span><span class="n" style="font-weight:600">${plan.exercises.length}</span> упражнений</span>
        <span><span class="n" style="font-weight:600">${t.sets}</span> подходов</span>
      </div>
      <div class="whybox">${icon('bolt')}<span>${plan.reason}</span></div>
      <div class="row" style="gap:6px;margin-top:12px;flex-wrap:wrap">
        ${plan.muscles.map((m) => `<span class="chip"><span class="dot" style="background:var(--c-${m.id})"></span>${m.name}</span>`).join('')}
      </div>
    </button>

    <div class="card" style="margin-top:12px">
      <div class="card-h">Баланс недели${icon('chevR', 'chev')}</div>
      <div class="row" style="gap:18px;margin-top:10px">
        ${flower(weekBalance, 150, score)}
        <div class="legend" style="flex:1">
          ${MUSCLES.map((m, k) => `<div class="lg ${weekBalance[k] < 70 ? 'low' : ''}"><span class="dot" style="background:var(--c-${m.id})"></span>${m.name}<b>${weekBalance[k]}%</b></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="duo">
      <div class="card"><div class="card-h" style="font-size:15px">${icon('pulse', '', 'width:17px;height:17px;color:var(--teal)')}Готовность</div>
        <div class="n" style="font-size:32px;margin-top:6px">82<span class="u">%</span></div>
        <div class="bar8" style="margin-top:8px;background:var(--ready-gradient);position:relative"><span class="knob" style="left:82%"></span></div></div>
      <div class="card"><div class="card-h" style="font-size:15px">${icon('stack', '', 'width:17px;height:17px;color:var(--blue)')}Неделя</div>
        <div class="n" style="font-size:32px;margin-top:6px">34<span class="u">/ 52</span></div>
        <div class="row" style="gap:4px;margin-top:8px"><div class="bar8" style="flex:1;background:var(--blue)"></div><div class="bar8" style="flex:1;background:linear-gradient(90deg,var(--blue) 30%,var(--fill) 30%)"></div><div class="bar8" style="flex:1;background:var(--fill)"></div></div></div>
    </div>
  </div>
  <div class="bottom-fade"></div>
  <nav class="tabbar" aria-label="Разделы">
    <button class="tab press" aria-current="page">${icon('home')}Сегодня</button>
    <button class="tab press">${icon('cal')}История</button>
    <button class="tab-go press" data-act="start" aria-label="Начать тренировку">${icon('play')}</button>
    <button class="tab press">${icon('chart')}Прогресс</button>
    <button class="tab press">${icon('user')}Профиль</button>
  </nav></section>`);

  el.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('[data-act="start"]')) onStart();
  });
  return el;
}
