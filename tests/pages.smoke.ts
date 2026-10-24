import { test, expect } from '@playwright/test';

test('the Pages build loads assets, dialogs and licenses at the repository path', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('requestfailed', (request) => errors.push(request.url()));
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('./');
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page).toHaveTitle('Grand Theft Survivors city prototype');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => window.__gameDebug)).toBeUndefined();
  for (const asset of await page.locator('script[src], link[rel="stylesheet"]').all()) {
    expect((await asset.getAttribute('src')) ?? (await asset.getAttribute('href'))).toMatch(
      /^\/grand-theft-survivors\/assets\//,
    );
  }
  await page.getByRole('button', { name: 'Controls H' }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('CONTROLS');
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('CITY MAP');
  await page.keyboard.press('m');
  await page.locator('#asset-credits').evaluate((node) => node.setAttribute('open', ''));
  for (const link of await page.locator('#asset-credits a[href*="licenses/"]').all()) {
    const href = await link.getAttribute('href');
    if (!href) throw new Error('A license link has no destination');
    const response = await page.request.get(new URL(href, page.url()).href);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('Copyright');
  }
  const license = await page.request.get('licenses/project.txt');
  expect(license.status()).toBe(200);
  expect(await license.text()).toContain('Copyright (c) 2026 Jakub Falenczyk');
  expect(errors).toEqual([]);
});
