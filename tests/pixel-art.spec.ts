import { test, expect } from '@playwright/test';

test('detailed source textures preserve player scale and survive scene restart', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/lifecycle.html');
  await expect(page.locator('#restarts')).toHaveText('1');
  const metrics = page.locator('#art-metrics');
  const before = JSON.parse((await metrics.textContent())!);
  expect(before.minWidth).toBeGreaterThanOrEqual(128);
  expect(before.minHeight).toBeGreaterThanOrEqual(128);
  expect(before.playerFrame).toEqual([128, 128]);
  expect(before.playerDisplay).toEqual([24, 24]);
  expect(before.playerBody).toEqual([10, 10]);
  expect(before.paletteSize).toBeGreaterThan(32);
  expect(before.roofs).toBeGreaterThan(100);
  const textures = await page.locator('#textures').textContent();
  await page.locator('#restart-scene').click();
  await expect(page.locator('#restarts')).toHaveText('2');
  expect(JSON.parse((await metrics.textContent())!)).toEqual(before);
  await expect(page.locator('#textures')).toHaveText(textures!);
});
