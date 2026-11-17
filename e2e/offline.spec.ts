import { spawn } from 'node:child_process';
import { test, expect, button } from './fixtures';

// WebKit in Playwright refuses reloads while requests are intercepted, so the test runs its own
// preview server and really stops it — the app must then come entirely from the service worker.
const PORT = 4183;
const URL = `http://localhost:${PORT}/Balance/`;

test('works without network after the first visit', async ({ page }) => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true });
  try {
    await expect.poll(() => fetch(URL).then((r) => r.status).catch(() => 0), { timeout: 20_000 }).toBe(200);
    await page.goto(URL);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    process.kill(-server.pid!); // whole process group: npx + vite
    await expect.poll(() => fetch(URL).then(() => 'up').catch(() => 'down')).toBe('down');

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Сегодня' })).toBeVisible();
    await button(page, 'Начать тренировку').first().tap();
    await expect(page.getByRole('heading', { name: 'Спина и бицепс' })).toBeVisible();
  } finally {
    try { process.kill(-server.pid!); } catch { /* already stopped */ }
  }
});
