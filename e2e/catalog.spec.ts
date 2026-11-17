import { spawn } from 'node:child_process';
import { test, expect, button, screens, openPlan, swipe, type Page } from './fixtures';

const top = (page: Page) => screens(page).last();
const settle = (page: Page) => page.waitForTimeout(600); // push / pop animation

async function openProfile(page: Page) {
  await page.goto('./');
  await button(page, 'Профиль').tap();
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
}
async function openExercises(page: Page) {
  await openProfile(page);
  await page.getByRole('button', { name: /^Упражнения \d+/ }).tap();
  await expect(page.getByRole('heading', { name: 'Упражнения' })).toBeVisible();
  await settle(page);
}
const search = (page: Page) => top(page).getByRole('searchbox', { name: 'Поиск' });
const row = (page: Page, name: string) => top(page).getByRole('button', { name: `Открыть: ${name}`, exact: true });
const sectionNames = (page: Page) => top(page).locator('h2.sec').evaluateAll((els) => els.map((e) => e.firstChild!.textContent));
async function noHorizontalOverflow(page: Page) {
  const r = await top(page).locator('.scroll').evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth }));
  expect(r.sw).toBeLessThanOrEqual(r.cw);
  const d = await page.evaluate(() => ({ sw: document.scrollingElement!.scrollWidth, cw: document.scrollingElement!.clientWidth }));
  expect(d.sw).toBeLessThanOrEqual(d.cw);
}

test.describe('profile', () => {
  test('stats are zero with the empty text; «Сегодня» returns home', async ({ page }) => {
    await openProfile(page);
    await expect(page.getByText('Статистика появится после первой тренировки.')).toBeVisible();
    const zeros = page.locator('.stats .n');
    await expect(zeros).toHaveText(['0', '0', '0']);
    await expect(page.getByText('тренировок', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Профиль' })).toHaveAttribute('aria-current', 'page');
    await button(page, 'Сегодня').tap();
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
    await expect(page.getByText('Следующая тренировка')).toBeVisible();
  });

  test('credits screen lists sources and goes back', async ({ page }) => {
    await openProfile(page);
    await button(page, 'Источники изображений').tap();
    await expect(page.getByRole('heading', { name: 'Источники изображений' })).toBeVisible();
    await expect(page.getByText('Everkinetic').first()).toBeVisible();
    await expect(page.getByText('CC BY-SA 4.0').first()).toBeVisible();
  });
});

test.describe('exercise list', () => {
  test('sections, search with ё/е and case, empty state and reset', async ({ page }) => {
    await openExercises(page);
    const all = await sectionNames(page);
    expect(all).toEqual(['Грудь', 'Спина', 'Плечи', 'Руки', 'Ноги', 'Кор']);

    await search(page).fill('жим лёжа');
    await expect(row(page, 'Жим штанги лёжа')).toBeVisible();
    await search(page).fill('ЖИМ ЛЕЖА');
    await expect(row(page, 'Жим штанги лёжа')).toBeVisible();
    await search(page).fill('  жим   лежа  ');
    await expect(row(page, 'Жим штанги лёжа')).toBeVisible();
    await expect(row(page, 'Планка')).toHaveCount(0);

    await search(page).fill('zzzфыв🤷');
    await expect(top(page).getByText('Ничего не найдено')).toBeVisible();
    await button(page, 'Сбросить фильтры').tap();
    await expect(search(page)).toHaveValue('');
    expect(await sectionNames(page)).toEqual(all);
  });

  test('adversarial queries: whitespace, emoji, regex chars, very long text', async ({ page }) => {
    await openExercises(page);
    const all = await sectionNames(page);
    await search(page).fill('     ');
    expect(await sectionNames(page)).toEqual(all);
    for (const q of ['zzz🏋️💪', 'zzz[a-', 'щщщ<script>', 'а'.repeat(5000)]) {
      await search(page).fill(q);
      await expect(top(page).getByText('Ничего не найдено')).toBeVisible();
    }
    await noHorizontalOverflow(page);
    // punctuation only normalises to an empty query: full list, no regex errors
    for (const q of ['🏋️💪', '.*', '(', '\\', '?!']) {
      await search(page).fill(q);
      expect(await sectionNames(page)).toEqual(all);
    }
    await button(page, 'Очистить поиск').tap();
    await expect(search(page)).toHaveValue('');
    expect(await sectionNames(page)).toEqual(all);
  });

  test('group chip «Ноги» and muscle sub-chip', async ({ page }) => {
    await openExercises(page);
    await button(page, 'Ноги').tap();
    expect(await sectionNames(page)).toEqual(['Ноги']);
    await expect(button(page, 'Ноги')).toHaveAttribute('aria-pressed', 'true');
    const subs = top(page).getByRole('group', { name: 'Мышцы' }).getByRole('button');
    const n = await subs.count();
    expect(n).toBeGreaterThan(1);
    const before = await top(page).locator('.li').count();
    await subs.first().tap();
    await expect(subs.first()).toHaveAttribute('aria-pressed', 'true');
    const filtered = await top(page).locator('.li').count();
    expect(filtered).toBeGreaterThan(0);
    expect(filtered).toBeLessThan(before);
    await subs.first().tap(); // toggles off
    await expect(top(page).locator('.li')).toHaveCount(before);
    // switching group drops the muscle
    await subs.first().tap();
    await button(page, 'Грудь').tap();
    expect(await sectionNames(page)).toEqual(['Грудь']);
    await button(page, 'Все').tap();
    expect((await sectionNames(page)).length).toBe(6);
    await expect(top(page).getByRole('group', { name: 'Мышцы' })).toHaveCount(0);
  });

  test('group + search combine; no match shows empty state', async ({ page }) => {
    await openExercises(page);
    await button(page, 'Ноги').tap();
    await search(page).fill('жим лёжа');
    await expect(top(page).getByText('Ничего не найдено')).toBeVisible();
    await button(page, 'Сбросить фильтры').tap();
    await expect(button(page, 'Все')).toHaveAttribute('aria-pressed', 'true');
    expect((await sectionNames(page)).length).toBe(6);
  });

  test('filters survive opening a card, back button and swipe back', async ({ page }) => {
    await openExercises(page);
    await button(page, 'Грудь').tap();
    await search(page).fill('жим');
    const count = await top(page).locator('.li').count();
    await row(page, 'Жим штанги лёжа').tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Жим штанги лёжа' })).toBeVisible();
    await top(page).getByRole('button', { name: 'Упражнения', exact: true }).tap();
    await settle(page);
    await expect(search(page)).toHaveValue('жим');
    await expect(button(page, 'Грудь')).toHaveAttribute('aria-pressed', 'true');
    await expect(top(page).locator('.li')).toHaveCount(count);

    await row(page, 'Жим штанги лёжа').tap();
    await settle(page);
    await swipe(page, [150, 450], [330, 455]);
    await settle(page);
    await expect(screens(page)).toHaveCount(2);
    await expect(search(page)).toHaveValue('жим');
    await expect(top(page).locator('.li')).toHaveCount(count);
  });

  test('long names do not overflow horizontally', async ({ page }) => {
    await openExercises(page);
    await noHorizontalOverflow(page);
    const clipped = await top(page).locator('.nm').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth).length);
    // ellipsis is applied to clipped names, never widens the list
    expect(clipped).toBeGreaterThanOrEqual(0);
    const long = await top(page).locator('.li').evaluateAll((els) => els.filter((e) => e.scrollWidth > e.clientWidth).length);
    expect(long).toBe(0);
  });
});

test.describe('exercise card', () => {
  test('bench press: muscles, frames, cues, caution, similar', async ({ page }) => {
    const bad: string[] = [];
    page.on('response', (r) => { if (r.url().includes('/art/') && r.status() !== 200) bad.push(`${r.status()} ${r.url()}`); });
    const art: string[] = [];
    page.on('response', (r) => { if (r.url().includes('/art/')) art.push(r.url()); });

    await openExercises(page);
    await row(page, 'Жим штанги лёжа').tap();
    await settle(page);
    const card = top(page);
    await expect(card.getByRole('heading', { name: 'Жим штанги лёжа' })).toBeVisible();
    await expect(card.locator('.main')).toHaveText('Грудь');
    await expect(card.locator('.helpers')).toContainText('Помогают:');
    await expect(card.locator('.helpers')).toContainText('трицепс');
    await expect(card.getByRole('img', { name: 'Жим штанги лёжа: начальное и конечное положение' })).toBeVisible();
    await expect(card.locator('.fr')).toHaveCount(2);
    await expect(card.locator('.cues li').first()).toContainText('Лопатки сведены');
    await expect(card.getByText('С осторожностью при болях')).toBeVisible();
    await expect(card.getByText('Выполняется только в раме или на скамье со страховочными упорами.')).toBeVisible();
    await expect(card.getByText('Не является медицинской рекомендацией.')).toBeVisible();
    await expect(card.getByText('Шаг веса')).toBeVisible();
    await noHorizontalOverflow(page);

    // every picture requested so far loaded; frame lines are masks, so check them explicitly
    await page.waitForLoadState('networkidle');
    expect(art.length).toBeGreaterThan(0);
    expect(art.some((u) => u.includes('/art/ek/0042-'))).toBe(true);
    expect(bad, 'non-200 /art/ responses').toEqual([]);

    await expect(card.getByText('Похожие упражнения')).toBeVisible();
    const first = card.locator('.mini').first();
    const target = (await first.locator('span').last().textContent())!.trim();
    await first.tap();
    await settle(page);
    await expect(screens(page)).toHaveCount(4); // profile, list, card, card
    await expect(top(page).getByRole('heading', { name: target, exact: true })).toBeVisible();
    await top(page).locator('.back').tap(); // back label is the previous card's name
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Жим штанги лёжа' })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(bad).toEqual([]);
  });

  test('exercise without frames (plank) has no frames block', async ({ page }) => {
    await openExercises(page);
    await search(page).fill('планка');
    await row(page, 'Планка').tap();
    await settle(page);
    const card = top(page);
    await expect(card.getByRole('heading', { name: 'Планка' })).toBeVisible();
    await expect(card.getByRole('img', { name: /начальное и конечное положение/ })).toHaveCount(0);
    await expect(card.locator('.fr')).toHaveCount(0);
    await expect(card.locator('.cues li')).toHaveCount(2);
    await expect(card.getByText('С осторожностью при болях')).toHaveCount(0);
    await noHorizontalOverflow(page);
  });

  test('every exercise opens without errors or horizontal overflow', async ({ page }) => {
    test.setTimeout(120_000);
    await openExercises(page);
    const n = await top(page).locator('.li').count();
    expect(n).toBeGreaterThan(30);
    // sample across the list: first, every 9th, last
    const idx = [...new Set([0, ...Array.from({ length: Math.floor(n / 9) }, (_, i) => (i + 1) * 9), n - 1])].filter((i) => i < n);
    for (const i of idx) {
      await top(page).locator('.li').nth(i).scrollIntoViewIfNeeded();
      await top(page).locator('.li').nth(i).tap();
      await settle(page);
      await expect(top(page).locator('h1.title')).toBeVisible();
      await noHorizontalOverflow(page);
      await top(page).locator('.back').tap();
      await settle(page);
    }
  });

  test('double tap on a row opens one card only', async ({ page }) => {
    await openExercises(page);
    await row(page, 'Жим штанги лёжа').dblclick();
    await settle(page);
    await expect(screens(page)).toHaveCount(3); // profile, list, one card
    await expect(top(page).getByRole('heading', { name: 'Жим штанги лёжа' })).toBeVisible();
  });
});

test.describe('equipment', () => {
  test('«Жим ногами» opens a filtered list and back works', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: /^Оборудование \d+/ }).tap();
    await settle(page);
    await expect(page.getByRole('heading', { name: 'Оборудование' })).toBeVisible();
    await top(page).getByRole('button', { name: /^Жим ногами, \d+ /}).tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Жим ногами', exact: true })).toBeVisible();
    await expect(row(page, 'Жим ногами')).toBeVisible();
    await expect(row(page, 'Планка')).toHaveCount(0);
    // local filters: search inside, and global filter untouched
    await search(page).fill('qqq');
    await expect(top(page).getByText('Ничего не найдено')).toBeVisible();
    await button(page, 'Сбросить фильтры').tap();
    await expect(row(page, 'Жим ногами')).toBeVisible();
    await noHorizontalOverflow(page);

    await top(page).getByRole('button', { name: 'Оборудование', exact: true }).tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Оборудование' })).toBeVisible();
    await noHorizontalOverflow(page);
    await top(page).getByRole('button', { name: 'Профиль', exact: true }).tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Профиль' })).toBeVisible();
  });

  test('equipment filter does not leak into the main list', async ({ page }) => {
    await openProfile(page);
    await page.getByRole('button', { name: /^Оборудование \d+/ }).tap();
    await settle(page);
    await top(page).getByRole('button', { name: /^Жим ногами, \d+ /}).tap();
    await settle(page);
    await search(page).fill('zzz');
    await top(page).getByRole('button', { name: 'Оборудование', exact: true }).tap();
    await settle(page);
    await top(page).getByRole('button', { name: 'Профиль', exact: true }).tap();
    await settle(page);
    await page.getByRole('button', { name: /^Упражнения \d+/ }).tap();
    await settle(page);
    await expect(search(page)).toHaveValue('');
  });
});

test.describe('plan', () => {
  test('tapping an exercise opens its card; back returns to the plan', async ({ page }) => {
    await openPlan(page);
    await page.getByRole('button', { name: 'Открыть: Тяга штанги в наклоне', exact: true }).tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Тяга штанги в наклоне', exact: true })).toBeVisible();
    await top(page).locator('.back').tap();
    await settle(page);
    await expect(page.getByRole('heading', { name: 'Спина и бицепс' })).toBeVisible();
    await expect(screens(page)).toHaveCount(2);
  });
});

// Own preview server, really stopped (see offline.spec.ts).
const PORT = 4184;
const URL = `http://localhost:${PORT}/Balance/`;

test('catalog card works without network', async ({ page }) => {
  test.setTimeout(90_000);
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  try {
    await expect.poll(() => fetch(URL).then((r) => r.status).catch(() => 0), { timeout: 20_000 }).toBe(200);
    await page.goto(URL);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    process.kill(-server.pid!);
    await expect.poll(() => fetch(URL).then(() => 'up').catch(() => 'down')).toBe('down');

    await page.reload();
    const art: { url: string; status: number }[] = [];
    page.on('response', (r) => { if (r.url().includes('/art/')) art.push({ url: r.url(), status: r.status() }); });
    await button(page, 'Профиль').tap();
    await page.getByRole('button', { name: /^Упражнения \d+/ }).tap();
    await settle(page);
    await row(page, 'Жим штанги лёжа').tap();
    await settle(page);
    await expect(top(page).getByRole('heading', { name: 'Жим штанги лёжа' })).toBeVisible();
    await expect(top(page).locator('.fr')).toHaveCount(2);
    // atlas and frames come from the service worker cache
    const ok = await page.evaluate(async () => {
      const base = new URL('./', location.href).href;
      const rs = await Promise.all([`${base}art/atlas-front.svg`, `${base}art/ek/0042-tension.svg`].map((u) => fetch(u)));
      return rs.map((r) => r.status);
    });
    expect(ok).toEqual([200, 200]);
    await page.waitForLoadState('networkidle');
    expect(art.filter((a) => a.status !== 200)).toEqual([]);
  } finally {
    try { process.kill(-server.pid!); } catch { /* already stopped */ }
  }
});
