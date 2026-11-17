import { test, expect, button, screens, openPlan, swipe, type Page } from './fixtures';

async function autoClosedNote(page: Page) {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await button(page, 'Подход выполнен').tap();
  await page.waitForTimeout(500);
  await page.clock.install();
  await page.clock.fastForward(5 * 60 * 60 * 1000);
  await expect(screens(page)).toHaveCount(1);
  const note = page.getByText(/Прошлая тренировка завершена автоматически/);
  await expect(note).toBeVisible();
  await expect(page.locator('.auto .ac')).toHaveCount(1); // the animated check
  return note;
}

test('the auto-close note hides with the close button', async ({ page }) => {
  const note = await autoClosedNote(page);
  await button(page, 'Скрыть уведомление').tap();
  await expect(note).toHaveCount(0);
});

test('the auto-close note can be swiped away; a short swipe snaps back', async ({ page }) => {
  const note = await autoClosedNote(page);
  const box = (await page.locator('.auto').boundingBox())!;
  const y = box.y + box.height / 2;
  await swipe(page, [box.x + 40, y], [box.x + 70, y]);
  await page.waitForTimeout(400);
  await expect(note).toBeVisible();
  expect(await page.locator('.auto').evaluate((el) => el.style.transform)).toBe(''); // snapped back
  await swipe(page, [box.x + 40, y], [box.x + box.width - 10, y]);
  await expect(note).toHaveCount(0);
});

test('the restored workout note has the animated check', async ({ page }) => {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await button(page, 'Подход выполнен').tap();
  await page.waitForTimeout(500);
  await page.reload();
  await expect(page.getByText(/Тренировка восстановлена/)).toBeVisible();
  await expect(page.locator('.note.restored .ac')).toHaveCount(1);
});

test('a retry that works turns the banner green, then it goes away', async ({ page }) => {
  await page.addInitScript(() => {
    // only inside this test browser: indexedDB.open fails until the test lets it through
    const w = window as unknown as { __idbFail: boolean };
    w.__idbFail = true;
    const open = IDBFactory.prototype.open;
    IDBFactory.prototype.open = function (this: IDBFactory, ...a: Parameters<IDBFactory['open']>) {
      if (w.__idbFail) throw new DOMException('blocked for the test', 'SecurityError');
      return open.apply(this, a);
    };
  });
  await page.goto('./');
  await expect(page.getByText('Результаты не сохраняются', { exact: true })).toBeVisible();
  await page.evaluate(() => { (window as unknown as { __idbFail: boolean }).__idbFail = false; });
  await button(page, 'Повторить').tap();
  await expect(page.getByText('Хранилище работает')).toBeVisible();
  await expect(page.getByText('Результаты снова сохраняются.')).toBeVisible();
  await expect(page.getByText('Хранилище работает')).toHaveCount(0, { timeout: 4000 });
  await expect(page.getByText('Результаты не сохраняются', { exact: true })).toHaveCount(0);
});
