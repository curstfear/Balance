import { test as base, expect, type Page } from '@playwright/test';

/** Every test fails if the page throws or logs an error. */
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await use(errors);
    expect(errors, 'errors on the page').toEqual([]);
  }, { auto: true }],
});
export { expect };
export type { Page } from '@playwright/test';

export const screens = (page: Page) => page.locator('section.screen');
export const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

export async function openPlan(page: Page) {
  await page.goto('./');
  await button(page, 'Начать тренировку').first().tap();
  await expect(screens(page)).toHaveCount(2);
  await expect(page.getByRole('heading', { name: 'Спина и бицепс' })).toBeVisible();
  await page.waitForTimeout(600); // push animation
}

/**
 * Touch gesture. WebKit on macOS cannot construct Touch objects, so plain events carry the
 * fields the app reads (touches, changedTouches, timeStamp). Returns how many moves were prevented.
 */
export function swipe(page: Page, from: [number, number], to: [number, number], opts: { steps?: number; dt?: number; end?: 'touchend' | 'touchcancel' } = {}) {
  const { steps = 16, dt = 16, end = 'touchend' } = opts;
  return page.evaluate(async ({ from, to, steps, dt, end }) => {
    const target = document.elementFromPoint(from[0], from[1])!;
    const touch = (x: number, y: number) => ({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
    const fire = (type: string, x: number, y: number, down: boolean) => {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(ev, 'touches', { value: down ? [touch(x, y)] : [] });
      Object.defineProperty(ev, 'changedTouches', { value: [touch(x, y)] });
      target.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    fire('touchstart', from[0], from[1], true);
    let prevented = 0;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, dt));
      if (fire('touchmove', from[0] + ((to[0] - from[0]) * i) / steps, from[1] + ((to[1] - from[1]) * i) / steps, true)) prevented++;
    }
    fire(end, to[0], to[1], false);
    return prevented;
  }, { from, to, steps, dt, end });
}
