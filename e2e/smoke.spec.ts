import { test, expect, button } from './fixtures';

test('home screen renders', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
  await expect(page.getByText('Следующая тренировка')).toBeVisible();
  await expect(page.getByRole('img', { name: /Баланс недели/ })).toBeVisible();
  await expect(button(page, 'Начать тренировку')).toBeVisible();
});

test('status bar style is not black-translucent (iOS 26 leaves an unpainted strip)', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute('content', 'default');
});
