import { test, expect, screens, openPlan, swipe } from './fixtures';

test.describe('swipe back from the plan', () => {
  test.beforeEach(async ({ page }) => openPlan(page));

  test('long swipe from the middle goes back', async ({ page }) => {
    expect(await swipe(page, [150, 450], [330, 455])).toBeGreaterThan(0);
    await expect(screens(page)).toHaveCount(1);
  });

  test('short fast flick goes back', async ({ page }) => {
    await swipe(page, [200, 450], [260, 452], { steps: 4, dt: 12 });
    await expect(screens(page)).toHaveCount(1);
  });

  test('short slow drag snaps back and leaves no inline styles', async ({ page }) => {
    await swipe(page, [200, 450], [230, 452], { steps: 12, dt: 40 });
    await page.waitForTimeout(600);
    await expect(screens(page)).toHaveCount(2);
    const inline = await screens(page).evaluateAll((els) => els.map((e) => (e as HTMLElement).style.transform));
    expect(inline.every((v) => v === '')).toBe(true);
  });

  test('vertical scroll is not hijacked', async ({ page }) => {
    expect(await swipe(page, [200, 600], [210, 300], { steps: 15 })).toBe(0);
    await expect(screens(page)).toHaveCount(2);
  });

  test('leftward swipe is ignored', async ({ page }) => {
    expect(await swipe(page, [300, 450], [120, 452])).toBe(0);
    await expect(screens(page)).toHaveCount(2);
  });

  test('cancelled gesture stays on the screen', async ({ page }) => {
    await swipe(page, [100, 450], [330, 455], { end: 'touchcancel' });
    await page.waitForTimeout(600);
    await expect(screens(page)).toHaveCount(2);
  });
});

test('workout (modal) cannot be swiped away', async ({ page }) => {
  await openPlan(page);
  await page.locator('.dock').getByRole('button', { name: 'Начать тренировку' }).tap();
  await page.waitForTimeout(600);
  expect(await swipe(page, [150, 450], [330, 455])).toBe(0);
  await expect(screens(page)).toHaveCount(3);
});

async function openCard(page: import('@playwright/test').Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Профиль', exact: true }).tap();
  await page.getByRole('button', { name: /^Упражнения/ }).tap();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Открыть: Жим штанги лёжа', exact: true }).tap();
  await page.waitForTimeout(600);
  await expect(screens(page)).toHaveCount(3);
}

test('a second swipe back right after the first one works (no dead time while the screen slides away)', async ({ page }) => {
  await openCard(page);
  await swipe(page, [150, 450], [330, 455]);
  await page.waitForTimeout(120); // the card is still sliding out
  expect(await swipe(page, [150, 450], [330, 455])).toBeGreaterThan(0);
  await page.waitForTimeout(700);
  await expect(screens(page)).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Профиль' })).toBeVisible();
});

test('the screen underneath takes taps right after going back', async ({ page }) => {
  await openCard(page);
  await swipe(page, [150, 450], [330, 455]);
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: 'Открыть: Жим гантелей лёжа', exact: true }).tap();
  await page.waitForTimeout(600);
  await expect(page.getByRole('heading', { name: 'Жим гантелей лёжа' })).toBeVisible();
});

test('swiping a sideways strip scrolls it instead of going back; the left edge still goes back', async ({ page }) => {
  await openCard(page);
  const strip = page.locator('section.screen').last().locator('.similar');
  await strip.scrollIntoViewIfNeeded();
  await strip.evaluate((el) => { el.scrollLeft = 120; });
  const box = (await strip.boundingBox())!;
  const y = box.y + box.height / 2;
  expect(await swipe(page, [box.x + 120, y], [box.x + 300, y + 2])).toBe(0);
  await page.waitForTimeout(600);
  await expect(screens(page)).toHaveCount(3);
  expect(await swipe(page, [8, y], [300, y + 2])).toBeGreaterThan(0);
  await page.waitForTimeout(700);
  await expect(screens(page)).toHaveCount(2);
});
