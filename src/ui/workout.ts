import type { Plan } from '../preview-data';
import { icon } from './icons';
import { restRing, REST_C } from './graphics';
import { h, haptic } from './nav';
import { fmt, clock } from './format';

interface SetLog { w: number; r: number; rir: number | null }
type Phase = 'set' | 'rest' | 'done';

const RIR = [['0', 'отказ'], ['1', 'тяжело'], ['2', 'норм'], ['3+', 'легко']] as const;

export function workoutScreen(plan: Plan, opts: { onClose: () => void }): { el: HTMLElement; dispose: () => void } {
  const startedAt = Date.now();
  const logs: SetLog[][] = plan.exercises.map(() => []);
  let ex = 0;
  let weight = plan.exercises[0].weight;
  let reps = plan.exercises[0].reps[0];
  let rir: number | null = null;
  let phase: Phase = 'set';
  let restEnd = 0;
  let restTotal = 0;
  let note = '';

  const el = h(`<section class="screen" aria-label="Тренировка"><div class="scroll"></div><div class="dock"></div></section>`);
  const scroll = el.querySelector('.scroll') as HTMLElement;
  const dock = el.querySelector('.dock') as HTMLElement;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => el.querySelector<T>(s);

  const cur = () => plan.exercises[ex];
  const setNo = () => logs[ex].length + 1;

  function topBar(): string {
    const segs = plan.exercises.map((e, i) => {
      const p = i < ex ? 100 : i === ex ? (logs[i].length / e.sets) * 100 : 0;
      return `<span><i style="width:${p}%"></i></span>`;
    }).join('');
    return `<div class="row wk-top">
      <button class="circ press" data-act="close" aria-label="Закончить">${icon('close')}</button>
      <div style="flex:1"><div class="wk-prog">${segs}</div>
        <div class="t2" style="font-size:12px;font-weight:600;margin-top:6px">Упражнение ${ex + 1} из ${plan.exercises.length}</div></div>
      <div class="n wk-elapsed" data-el="elapsed">${clock((Date.now() - startedAt) / 1000)}</div>
    </div>`;
  }

  function renderSet() {
    const e = cur();
    const chips = Array.from({ length: e.sets }, (_, i) => {
      const l = logs[ex][i];
      if (l) return `<span class="chip done">${icon('check')}<span class="n" style="font-weight:600">${l.r} × ${fmt(l.w)}</span></span>`;
      if (i === logs[ex].length) return `<span class="chip cur">Подход ${i + 1}</span>`;
      return `<span class="chip">${i + 1}</span>`;
    }).join('');
    scroll.innerHTML = `${topBar()}<div class="fade-in">
      <div class="eyebrow" style="color:var(--c-${e.muscle});margin-top:14px">Упражнение ${ex + 1}</div>
      <h1 class="wk-name">${e.name}</h1>
      <div class="sets">${chips}</div>
      <div class="hr" style="margin-top:22px"></div>
      <div class="row big-row">
        <div><div class="eyebrow">Вес</div><div class="n big lime"><span data-el="w">${fmt(weight)}</span><span class="u">кг</span></div></div>
        <span class="sp"></span><div class="row" style="gap:10px">
          <button class="circ step press" data-act="w-" aria-label="Меньше вес">${icon('minus')}</button>
          <button class="circ step press" data-act="w+" aria-label="Больше вес">${icon('plus')}</button></div>
      </div>
      <div class="hr"></div>
      <div class="row big-row">
        <div><div class="eyebrow">Повторы <span class="t3">· цель ${e.reps[0]}–${e.reps[1]}</span></div><div class="n big"><span data-el="r">${reps}</span><span class="u">раз</span></div></div>
        <span class="sp"></span><div class="row" style="gap:10px">
          <button class="circ step press" data-act="r-" aria-label="Меньше повторов">${icon('minus')}</button>
          <button class="circ step press" data-act="r+" aria-label="Больше повторов">${icon('plus')}</button></div>
      </div>
      <div class="hr"></div>
      <div style="font-size:15px;font-weight:600;margin:16px 0 10px">Сколько ещё смог бы?</div>
      <div class="rir-row" role="group" aria-label="Запас повторов">
        ${RIR.map(([n, t], i) => `<button class="rir press" data-rir="${i}" aria-pressed="${rir === i}"><b class="n">${n}</b><span>${t}</span></button>`).join('')}
      </div></div>`;
    dock.innerHTML = `<button class="gbtn hurt press" data-act="hurt">${icon('alert')}Больно</button>
      <button class="btn press" style="flex:1" data-act="done">${icon('check')}Подход сделан</button>`;
    dock.hidden = false;
  }

  function renderRest() {
    const e = cur();
    scroll.innerHTML = `${topBar()}<div class="fade-in">
      <div class="rest-ring">${restRing()}
        <div class="mid"><div class="eyebrow">Отдых</div>
          <div class="n" style="font-size:clamp(56px,10vh,80px);line-height:1.05;letter-spacing:-.04em" data-el="rest">${clock((restEnd - Date.now()) / 1000)}</div>
          <div class="t2" style="font-size:15px">из <span class="n" style="font-weight:600" data-el="restTotal">${clock(restTotal)}</span></div></div>
      </div>
      <div class="row" style="gap:10px;margin:26px 0 22px">
        <button class="gbtn press" style="flex:1" data-act="rest-"><span class="n" style="font-weight:600">−15 с</span></button>
        <button class="gbtn press" style="flex:1.3" data-act="skip">Пропустить</button>
        <button class="gbtn press" style="flex:1" data-act="rest+"><span class="n" style="font-weight:600">+15 с</span></button>
      </div>
      <div class="card">
        <div class="eyebrow">Дальше · ${logs[ex].length === 0 ? e.name.toLowerCase() : `подход ${setNo()} из ${e.sets}`}</div>
        <div class="n" style="font-size:40px;margin-top:4px;letter-spacing:-1px">${fmt(weight)}<span class="u">кг</span> <span class="t3">×</span> ${reps}</div>
        ${note ? `<div class="note">${icon('bolt')}<span>${note}</span></div>` : ''}
      </div></div>`;
    dock.innerHTML = '';
    dock.hidden = true;
    tick();
  }

  function renderDone() {
    const all = logs.flat();
    const tonnage = all.reduce((a, l) => a + Math.max(l.w, 0) * l.r, 0);
    const mins = (Date.now() - startedAt) / 1000;
    scroll.innerHTML = `<div class="fade-in">
      <div class="row" style="gap:8px;margin-top:56px"><span style="width:24px;height:24px;border-radius:8px;background:var(--lime);color:var(--lime-ink);display:flex;align-items:center;justify-content:center">${icon('check', '', 'width:16px;height:16px')}</span><span class="eyebrow">Тренировка завершена</span></div>
      <h1 class="large" style="margin-top:6px">${plan.title}</h1>
      <div class="card" style="margin-top:16px;padding:0;display:grid;grid-template-columns:1fr 1fr">
        <div style="padding:14px 16px"><div class="eyebrow">Время</div><div class="n" style="font-size:30px;color:var(--yellow)">${clock(mins)}</div></div>
        <div style="padding:14px 16px;border-left:.5px solid var(--sep)"><div class="eyebrow">Тоннаж</div><div class="n" style="font-size:30px;color:var(--lime)">${fmt(tonnage, 0)}<span class="u">кг</span></div></div>
        <div style="padding:14px 16px;border-top:.5px solid var(--sep)"><div class="eyebrow">Подходы</div><div class="n" style="font-size:30px;color:var(--blue)">${all.length}</div></div>
        <div style="padding:14px 16px;border-top:.5px solid var(--sep);border-left:.5px solid var(--sep)"><div class="eyebrow">Упражнения</div><div class="n" style="font-size:30px;color:var(--orange)">${plan.exercises.length}</div></div>
      </div></div>`;
    dock.innerHTML = `<button class="btn press" data-act="close">Готово</button>`;
    dock.hidden = false;
  }

  function render() {
    scroll.scrollTop = 0;
    if (phase === 'set') renderSet();
    else if (phase === 'rest') renderRest();
    else renderDone();
  }

  function completeSet() {
    const e = cur();
    logs[ex].push({ w: weight, r: reps, rir });
    haptic(20);
    const lastOfExercise = logs[ex].length >= e.sets;
    if (lastOfExercise && ex === plan.exercises.length - 1) { phase = 'done'; render(); return; }

    restTotal = e.rest;
    if (lastOfExercise) {
      ex += 1;
      weight = cur().weight;
      reps = cur().reps[0];
      note = `Упражнение готово. Дальше — ${cur().name.toLowerCase()}.`;
    } else if (rir === 0) {
      weight -= e.step;
      note = `Это был отказ — сбавлю на ${fmt(e.step)} кг, чтобы добрать повторы.`;
    } else if (rir === 3) {
      weight += e.step;
      note = `Было легко — добавлю ${fmt(e.step)} кг.`;
    } else if (rir === 1) {
      note = 'Подход был тяжёлым — вес не трогаю, держи технику.';
    } else {
      note = 'Хороший запас — держим вес.';
    }
    rir = null;
    restEnd = Date.now() + restTotal * 1000;
    phase = 'rest';
    render();
  }

  function tick() {
    const elapsed = q('[data-el="elapsed"]');
    if (elapsed) elapsed.textContent = clock((Date.now() - startedAt) / 1000);
    if (phase !== 'rest') return;
    const left = (restEnd - Date.now()) / 1000;
    if (left <= 0) { haptic(200); phase = 'set'; render(); return; }
    const restEl = q('[data-el="rest"]');
    if (restEl) restEl.textContent = clock(Math.ceil(left));
    const arc = q<HTMLElement>('.arc');
    if (arc) arc.setAttribute('stroke-dashoffset', String(REST_C * (1 - left / restTotal)));
  }

  el.addEventListener('click', (ev) => {
    const t = ev.target as HTMLElement;
    const rirBtn = t.closest<HTMLElement>('[data-rir]');
    if (rirBtn) {
      const v = Number(rirBtn.dataset.rir);
      rir = rir === v ? null : v;
      el.querySelectorAll<HTMLElement>('[data-rir]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.rir) === rir)));
      haptic();
      return;
    }
    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    const e = cur();
    switch (act) {
      case 'w-': weight -= e.step; break;
      case 'w+': weight += e.step; break;
      case 'r-': reps = Math.max(0, reps - 1); break;
      case 'r+': reps += 1; break;
      case 'done': completeSet(); return;
      case 'skip': phase = 'set'; render(); return;
      case 'rest-': restEnd -= 15000; tick(); return;
      case 'rest+':
        restEnd += 15000;
        restTotal = Math.max(restTotal, Math.ceil((restEnd - Date.now()) / 1000));
        q('[data-el="restTotal"]')!.textContent = clock(restTotal);
        tick();
        return;
      case 'close': opts.onClose(); return;
      default: return;
    }
    haptic();
    q('[data-el="w"]')!.textContent = fmt(weight);
    q('[data-el="r"]')!.textContent = String(reps);
  });

  // keep the screen on during the workout
  let lock: WakeLockSentinel | null = null;
  const requestLock = () => navigator.wakeLock?.request('screen').then((l) => { lock = l; }).catch(() => {});
  const onVisible = () => { if (document.visibilityState === 'visible') { requestLock(); tick(); } };
  requestLock();
  document.addEventListener('visibilitychange', onVisible);

  const timer = setInterval(tick, 250);
  render();

  return {
    el,
    dispose: () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    },
  };
}
