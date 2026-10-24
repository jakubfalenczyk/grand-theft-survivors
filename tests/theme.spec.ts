import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameDebug?.isReady());
});

test('Kerbside fonts, ink, shadows, targets and modal focus are applied', async ({ page }) => {
  await page.evaluate(() => document.fonts.ready);
  const styles = await page.evaluate(() => {
    const primary = document.querySelector<HTMLButtonElement>('#resume-button')!;
    const hud = document.querySelector<HTMLElement>('.player-card')!;
    return {
      background: getComputedStyle(document.documentElement).backgroundColor,
      primary: getComputedStyle(primary).backgroundColor,
      shadow: getComputedStyle(hud).boxShadow,
      fonts: ['Big Shoulders Display', 'Barlow Semi Condensed', 'Martian Mono'].map((font) =>
        document.fonts.check(
          `${font === 'Big Shoulders Display' ? 900 : font === 'Barlow Semi Condensed' ? 600 : 400} 18px "${font}"`,
        ),
      ),
    };
  });
  expect(styles.background).toBe('rgb(20, 21, 26)');
  expect(styles.primary).toBe('rgb(255, 158, 27)');
  expect(styles.shadow).toContain('rgb(255, 77, 125) 6px 6px 0px');
  expect(styles.fonts).toEqual([true, true, true]);
  for (const button of await page.locator('button:visible').all()) {
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  }
  await page.locator('#help-button').click();
  await expect(page.locator('#resume-button')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#resume-button')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#help-button')).toBeFocused();
});

test('game and its fonts load without third-party network requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:5173') && !request.url().startsWith('data:'))
      external.push(request.url());
  });
  await page.reload();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  await page.evaluate(() => document.fonts.ready);
  expect(external).toEqual([]);
});

test('restarting a scene reuses textures and does not multiply listeners', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/fixtures/lifecycle.html');
  await expect(page.locator('#restarts')).toHaveText('1');
  const textures = await page.locator('#textures').textContent();
  const listeners = await page.locator('#listeners').textContent();
  for (let i = 2; i <= 4; i++) {
    await page.locator('#restart-scene').click();
    await expect(page.locator('#restarts')).toHaveText(String(i));
    await expect(page.locator('#textures')).toHaveText(textures!);
    await expect(page.locator('#listeners')).toHaveText(listeners!);
    await expect(page.locator('#game canvas')).toHaveCount(1);
    await page.keyboard.press('m');
    await expect(page.locator('#map-overlay')).toBeVisible();
    await page.keyboard.press('m');
    await expect(page.locator('#map-overlay')).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('English text and accessible names are available in every interface mode', async ({
  page,
}) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('button', { name: 'Controls H' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pause game' })).toBeVisible();
  await page.getByRole('button', { name: 'Controls H' }).click();
  await expect(page.getByRole('dialog')).toContainText('Walk backward');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('FIRST TIME ON THE STREETS?');
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('FIND YOUR WAY.');
  await page.keyboard.press('m');
  await expect(page.locator('#district-name')).toHaveText('Ironworks');
  await expect(page.locator('body')).not.toContainText('{{');
});
