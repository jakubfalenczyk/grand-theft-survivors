import { test, expect } from '@playwright/test';

test('Space selects once, harms the selected civilian, awards XP and pause freezes combat', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  await expect
    .poll(() => page.evaluate(() => window.__gameDebug!.getCombat().preview))
    .not.toBeNull();
  const before = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(before.shots).toBe(0);
  await page.keyboard.down('Space');
  await expect
    .poll(() => page.evaluate(() => window.__gameDebug!.getCombat().selected))
    .not.toBeNull();
  await page.keyboard.press('Escape');
  const paused = await page.evaluate(() => window.__gameDebug!.getCombat());
  await page.waitForTimeout(750);
  expect(await page.evaluate(() => window.__gameDebug!.getCombat())).toEqual(paused);
  await page.keyboard.up('Space');
  await page.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__gameDebug!.getCombat().xp))
    .toBeGreaterThan(0);
  await expect(page.locator('#combat-xp')).not.toHaveText('XP 0');
  expect(
    await page.evaluate(() => window.__gameDebug!.getCombat().projectileSlots),
  ).toBeLessThanOrEqual(96);
});
