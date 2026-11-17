import { test, expect, button, screens, openPlan, swipe, type Page } from './fixtures';

async function startWorkout(page: Page) {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();
  await page.waitForTimeout(600);
}
const sheet = (page: Page) => page.getByRole('dialog', { name: 'Боль во время подхода' });
const painButton = (page: Page) => page.locator('.dock').getByRole('button', { name: /^Боль/ });

test('pain sheet opens with three levels and the warning signs', async ({ page }) => {
  await startWorkout(page);
  await painButton(page).tap();
  await expect(sheet(page)).toBeVisible();
  await expect(sheet(page)).toContainText('Подтягивания в гравитроне · подход 1');
  for (const name of ['Слабая или нет', 'Терпимая', 'Острая']) await expect(page.getByRole('radio', { name: new RegExp(name) })).toBeVisible();
  await expect(sheet(page)).toContainText('Тревожные признаки');
});

test('tolerable pain marks the set and lowers the next weight', async ({ page }) => {
  await startWorkout(page);
  await painButton(page).tap();
  await page.getByRole('radio', { name: /Терпимая/ }).tap();
  await expect(sheet(page)).toBeHidden();
  await expect(painButton(page)).toHaveText(/Боль · 4–5/);
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText(/Отмечена терпимая боль — вес снижен на 5 кг/)).toBeVisible();
  await expect(screens(page).last().locator('.next')).toContainText('−30');
  await button(page, 'Пропустить').tap();
  await expect(painButton(page)).toHaveText('Боль'); // reset for the next set
  await expect(screens(page).last().locator('.dot.pain-tolerable')).toHaveCount(1);
});

test('acute pain stops the exercise', async ({ page }) => {
  await startWorkout(page);
  await painButton(page).tap();
  await page.getByRole('radio', { name: /Острая/ }).tap();
  await button(page, 'Подход выполнен').tap();
  await expect(page.getByText(/Упражнение остановлено из-за острой боли/)).toBeVisible();
  await button(page, 'Пропустить').tap();
  await expect(page.getByRole('heading', { name: 'Тяга штанги в наклоне' })).toBeVisible();
});

test('the sheet closes by tapping the dim area and by swiping down', async ({ page }) => {
  await startWorkout(page);
  await painButton(page).tap();
  await expect(sheet(page)).toBeVisible();
  await page.mouse.click(200, 120); // dim area above the sheet
  await expect(sheet(page)).toBeHidden();

  await painButton(page).tap();
  await expect(sheet(page)).toBeVisible();
  await page.waitForTimeout(500);
  const box = (await sheet(page).boundingBox())!;
  await swipe(page, [200, box.y + 30], [205, box.y + 330], { steps: 12 });
  await expect(sheet(page)).toBeHidden();
});

test('warning signs → stop screen → back, and finishing from there', async ({ page }) => {
  await startWorkout(page);
  await painButton(page).tap();
  await button(page, 'Что делать').tap();
  await expect(page.getByRole('heading', { name: 'Прекратите тренировку' })).toBeVisible();
  await expect(page.locator('li.urgent')).toHaveCount(3);
  await expect(page.getByRole('link', { name: 'Вызвать скорую · 112' })).toHaveAttribute('href', 'tel:112');

  await button(page, 'Признаков нет — вернуться').tap();
  await expect(screens(page)).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Подтягивания в гравитроне' })).toBeVisible();

  await painButton(page).tap();
  await button(page, 'Что делать').tap();
  await button(page, 'Завершить тренировку').tap();
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
});
