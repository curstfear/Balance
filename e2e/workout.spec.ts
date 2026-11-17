import { test, expect, button, screens, openPlan } from './fixtures';

test('duration switch changes the plan', async ({ page }) => {
  await openPlan(page);
  const sets = page.locator('.stats .n').first();
  await expect(sets).toHaveText('17');
  await page.getByRole('radio', { name: '70 мин' }).tap();
  await expect(sets).toHaveText('20');
  await page.getByRole('radio', { name: '45 мин' }).tap();
  await expect(sets).toHaveText('13');
});

test('a full workout: sets, rest, adjustment, summary, back home', async ({ page }) => {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();

  // steppers
  const top = screens(page).last(); // screens underneath stay in the DOM
  const weight = top.locator('.big').first();
  await expect(weight).toContainText('−25');
  await button(page, 'Увеличить вес').tap();
  await expect(weight).toContainText('−20');
  await button(page, 'Больше повторений').tap();
  await expect(top.locator('.big').nth(1)).toContainText('9');

  // easy set → rest screen shows the adjustment and the timer runs
  await page.getByRole('radio', { name: /3\+/ }).tap();
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText('Отдых', { exact: true })).toBeVisible();
  await expect(page.getByText(/вес увеличен на 5 кг/)).toBeVisible();
  const timer = top.locator('.timer');
  const t0 = await timer.textContent();
  await page.waitForTimeout(1300);
  expect(await timer.textContent()).not.toBe(t0);
  await button(page, '+15 с').tap();
  await expect(top.getByText('из 2:15')).toBeVisible();
  await button(page, '−15 с').tap();
  await expect(top.getByText('из 2:00')).toBeVisible();
  await button(page, 'Пропустить').tap();

  // finish every remaining set
  let guard = 0;
  while (await button(page, 'Подход выполнен').count()) {
    await button(page, 'Подход выполнен').tap();
    if (await button(page, 'Пропустить').count()) await button(page, 'Пропустить').tap();
    if (++guard > 40) throw new Error('workout never ended');
  }
  await expect(page.getByText('Тренировка завершена')).toBeVisible();
  await expect(screens(page).last().locator('.stat').nth(2)).toContainText('17');

  await button(page, 'Готово').tap();
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
});

test('closing a workout returns straight home', async ({ page }) => {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await button(page, 'Завершить тренировку').tap();
  await expect(screens(page)).toHaveCount(1);
});
