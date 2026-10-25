import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
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
  await page.getByRole('button', { name: 'Play', exact: true }).click();
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
    await expect.poll(() => page.evaluate(() => window.__gameDebug!.getAudio().managed)).toBe(0);
    expect(await page.evaluate(() => window.__gameDebug!.getAudio().cached)).toBe(7);
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
  await expect(page.getByRole('dialog')).toHaveAccessibleName('CONTROLS');
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('CITY MAP');
  await page.keyboard.press('m');
  await expect(page.locator('#district-name')).toHaveText('Ironworks');
  await expect(page.locator('body')).not.toContainText('{{');
});

test('switching dialogs restores the original focus and blocks background content', async ({
  page,
}) => {
  const help = page.getByRole('button', { name: 'Controls H' });
  const map = page.locator('#open-map');
  for (const sequence of [
    { opener: help, keys: ['m', 'h', 'm'] },
    { opener: map, keys: ['h', 'm', 'h'] },
  ]) {
    await sequence.opener.click();
    for (const key of sequence.keys) {
      await page.keyboard.press(key);
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await page.keyboard.press('Shift+Tab');
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
      ).toBe(true);
      expect(
        await page
          .locator('#asset-credits')
          .evaluate((node) => node instanceof HTMLElement && node.inert),
      ).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(sequence.opener).toBeFocused();
    expect(
      await page
        .locator('#asset-credits')
        .evaluate((node) => node instanceof HTMLElement && node.inert),
    ).toBe(false);
  }
});

test('destroying an open dialog restores external focus and removes its handlers', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/lifecycle.html');
  await expect(page.locator('#restarts')).toHaveText('1');
  const outside = page.locator('#restart-scene');
  await outside.focus();
  await page.keyboard.press('h');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('CONTROLS');
  await page.locator('#destroy-interface').click();
  await expect(page.locator('#app')).toBeEmpty();
  await expect(outside).toBeFocused();
  await page.keyboard.press('h');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('keyboard-opened dialogs return focus to a visible control', async ({ page }) => {
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  await page.keyboard.press('h');
  await page.keyboard.press('m');
  await page.keyboard.press('Escape');
  expect(
    await page.evaluate(() => {
      const active = document.activeElement;
      return (
        active instanceof HTMLElement &&
        active !== document.body &&
        !active.closest('[hidden], [inert]')
      );
    }),
  ).toBe(true);
});
