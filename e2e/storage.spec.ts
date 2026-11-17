import { test, expect, button, screens, openPlan, type Page } from './fixtures';

async function startWorkout(page: Page) {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();
}

/** Raw IndexedDB edit of the active workout (bypasses the app on purpose). */
function patchActiveWorkout(page: Page, ageMs: number) {
  return page.evaluate((ageMs) => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('balance');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const idb = open.result;
      const tx = idb.transaction('workouts', 'readwrite');
      const store = tx.objectStore('workouts');
      const all = store.getAll();
      all.onsuccess = () => {
        const w = all.result.find((x) => x.status === 'active');
        if (!w) { reject(new Error('no active workout')); return; }
        w.lastActivityAt = Date.now() - ageMs;
        store.put(w);
      };
      tx.oncomplete = () => { idb.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  }), ageMs);
}

test('reload on the rest screen restores the workout', async ({ page }) => {
  await startWorkout(page);
  await page.getByRole('radio', { name: /3\+/ }).tap();
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  await button(page, 'Пропустить').tap();
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  await page.waitForTimeout(500); // let the cursor write settle

  await page.reload();
  await expect(screens(page)).toHaveCount(2);
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  const top = screens(page).last();
  const timer = top.locator('.timer');
  const t0 = await timer.textContent();
  await page.waitForTimeout(1300);
  expect(await timer.textContent()).not.toBe(t0);
  await expect(page.getByText(/Тренировка восстановлена/)).toBeVisible();
  await expect(page.getByText(/Тренировка восстановлена/)).toBeHidden({ timeout: 6000 });

  // back to the set screen: same exercise, two done chips
  await button(page, 'Пропустить').tap();
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();
  await expect(top.locator('.sets .n')).toHaveCount(2);
});

test('a changed weight survives a reload', async ({ page }) => {
  await startWorkout(page);
  const weight = () => screens(page).last().locator('.big').first();
  await expect(weight()).toContainText('−25');
  await button(page, 'Увеличить вес').tap();
  await expect(weight()).toContainText('−20');
  await page.waitForTimeout(800);
  await page.reload();
  await expect(screens(page)).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();
  await expect(weight()).toContainText('−20');
});

test('finishing via the close button leaves nothing to restore', async ({ page }) => {
  await startWorkout(page);
  await page.getByRole('radio', { name: /3\+/ }).tap();
  await button(page, 'Подход выполнен').tap();
  await button(page, 'Пропустить').tap();
  await button(page, 'Завершить тренировку').tap();
  await expect(screens(page)).toHaveCount(1);
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByText('Прошлая тренировка завершена автоматически')).toHaveCount(0);
});

test('a workout idle for 5 hours is closed on launch with a note', async ({ page }) => {
  await startWorkout(page);
  await page.getByRole('radio', { name: /3\+/ }).tap();
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  await patchActiveWorkout(page, 5 * 60 * 60 * 1000);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByText('Прошлая тренировка завершена автоматически')).toBeVisible();
});

test.describe('install hint', () => {
  test('visible on iPhone, «Позже» hides it for good', async ({ page }) => {
    await page.goto('./');
    const hint = page.getByRole('button', { name: /Установка на экран/ });
    await expect(hint).toBeVisible();
    await button(page, 'Скрыть на 14 дней').tap();
    await expect(hint).toBeHidden();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
    await expect(hint).toHaveCount(0);
  });

  test('hidden when launched from the home screen', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /Установка на экран/ })).toHaveCount(0);
  });
});

test('finishing from the stop screen closes the workout for good', async ({ page }) => {
  await startWorkout(page);
  await button(page, 'Подход выполнен').tap();
  await button(page, 'Пропустить').tap();
  await button(page, 'Боль').tap();
  await button(page, 'Что делать').tap();
  await expect(page.getByRole('heading', { name: 'Прекратите тренировку' })).toBeVisible();
  await page.locator('.dock').last().getByRole('button', { name: 'Завершить тренировку' }).tap();
  await expect(screens(page)).toHaveCount(1);
  await page.waitForTimeout(300); // let the write land
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await page.waitForTimeout(500);
  await expect(screens(page)).toHaveCount(1);
});

test('a workout left open longer than 4 hours closes itself while the app stays open', async ({ page }) => {
  await startWorkout(page);
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  await page.waitForTimeout(500);
  await page.clock.install();
  await page.clock.fastForward(5 * 60 * 60 * 1000);
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByText(/Прошлая тренировка завершена автоматически/)).toBeVisible();
});
