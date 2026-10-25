import { test, expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

// Boundaries from the owner's reference, plus representative phone, laptop and desktop sizes.
const viewports = [
  { width: 320, height: 740, scale: 0.85 },
  { width: 390, height: 844, scale: 0.85 },
  { width: 480, height: 900, scale: 0.85 },
  { width: 481, height: 900, scale: 0.9 },
  { width: 768, height: 1024, scale: 0.9 },
  { width: 769, height: 900, scale: 0.95 },
  { width: 1024, height: 768, scale: 0.95 },
  { width: 1279, height: 900, scale: 0.95 },
  { width: 1280, height: 900, scale: 1 },
  { width: 1440, height: 1000, scale: 1 },
  { width: 1920, height: 1080, scale: 1 },
];

async function noPageOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
  ).toBeLessThanOrEqual(1);
}
async function hudFits(page: Page) {
  const layout = await page.evaluate(() => {
    const frame = document.querySelector('.game-frame')!.getBoundingClientRect().toJSON();
    const selectors = ['.location', '.game-tools', '.player-card', '.minimap-wrap', '.game-bottom'];
    return {
      frame,
      content: {
        width: document.querySelector('#game')!.clientWidth,
        height: document.querySelector('#game')!.clientHeight,
      },
      parts: selectors
        .filter((selector) => document.querySelector(selector)!.getClientRects().length > 0)
        .map((selector) => ({
          selector,
          rect: document.querySelector(selector)!.getBoundingClientRect().toJSON(),
        })),
    };
  });
  for (const part of layout.parts) {
    expect(part.rect.left, part.selector).toBeGreaterThanOrEqual(layout.frame.left);
    expect(part.rect.right, part.selector).toBeLessThanOrEqual(layout.frame.right);
    expect(part.rect.top, part.selector).toBeGreaterThanOrEqual(layout.frame.top);
    expect(part.rect.bottom, part.selector).toBeLessThanOrEqual(layout.frame.bottom);
  }
  for (let i = 0; i < layout.parts.length; i++) {
    for (const b of layout.parts.slice(i + 1)) {
      const a = layout.parts[i];
      const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
      const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
      expect(width <= 1 || height <= 1, `${a.selector} overlaps ${b.selector}`).toBe(true);
    }
  }
  const canvas = await page.locator('#game canvas').boundingBox();
  expect(Math.abs(canvas!.width - layout.content.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(canvas!.height - layout.content.height)).toBeLessThanOrEqual(1);
}
async function dialogIsUsable(page: Page, close: Locator) {
  const dialog = page.getByRole('dialog');
  const box = await dialog.boundingBox();
  const title = await dialog.locator('h2').boundingBox();
  expect(title!.y).toBeGreaterThanOrEqual(box!.y);
  expect(title!.x).toBeGreaterThanOrEqual(box!.x);
  expect(title!.x + title!.width).toBeLessThanOrEqual(box!.x + box!.width);
  expect(await dialog.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(
    1,
  );
  await close.scrollIntoViewIfNeeded();
  expect(
    await close.evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const parent = node.closest('[role="dialog"]')!.getBoundingClientRect();
      const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
      return (
        rect.top >= parent.top &&
        rect.bottom <= parent.bottom + 1 &&
        (hit === node || node.contains(hit))
      );
    }),
  ).toBe(true);
  await close.click();
}
async function minimumTargets(page: Page) {
  for (const control of await page
    .locator('button:visible, input[type="range"]:visible, .audio-mute:visible, .brand')
    .all()) {
    const box = await control.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
    if (!(await control.evaluate((node) => node.matches('input[type="range"]'))))
      expect(box!.width).toBeGreaterThanOrEqual(48);
  }
}

for (const viewport of viewports) {
  test(`game UI at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await noPageOverflow(page);
    expect(
      await page.evaluate(() =>
        Number(getComputedStyle(document.documentElement).getPropertyValue('--kb-ui-scale')),
      ),
    ).toBe(viewport.scale);
    await dialogIsUsable(page, page.getByRole('button', { name: 'Play', exact: true }));
    await page.waitForFunction(() => window.__gameDebug?.isReady());
    await hudFits(page);
    await minimumTargets(page);
    await page.locator('#help-button').click();
    await dialogIsUsable(page, page.locator('#resume-button'));
    await page.locator('#pause-button').click();
    await minimumTargets(page);
    await dialogIsUsable(page, page.locator('#restart-run-button'));
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (viewport.width <= 480) {
      await expect(page.locator('.minimap-wrap')).toBeHidden();
      await page.locator('#open-map-compact').click();
    } else {
      await expect(page.locator('.minimap-wrap')).toBeVisible();
      await page.locator('#open-map').click();
    }
    await dialogIsUsable(page, page.locator('#close-map'));
    await page.getByRole('button', { name: 'Sound', exact: true }).click();
    await minimumTargets(page);
    await dialogIsUsable(page, page.getByRole('button', { name: 'Back', exact: true }));
    await noPageOverflow(page);
  });
}

for (const viewport of [
  { width: 568, height: 320 },
  { width: 844, height: 390 },
  { width: 1024, height: 480 },
  { width: 390, height: 390 },
]) {
  test(`short fullscreen UI at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.waitForFunction(() => window.__gameDebug?.isReady());
    await page.locator('#fullscreen-button').click();
    await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
    await expect
      .poll(async () => Math.round((await page.locator('#game canvas').boundingBox())!.height))
      .toBe(viewport.height);
    await hudFits(page);
    await page.keyboard.press('h');
    await dialogIsUsable(page, page.locator('#resume-button'));
    await page.keyboard.press('m');
    await dialogIsUsable(page, page.locator('#close-map'));
    await page.keyboard.press('Escape');
    await page.locator('#pause-audio-button').click();
    await dialogIsUsable(page, page.locator('#audio-close'));
    await dialogIsUsable(page, page.locator('#restart-run-button'));
    await page.locator('#fullscreen-button').click();
    await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
  });
}

test('live resizing changes UI scale without restarting or changing world state', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  await page.keyboard.press('Escape');
  const original = await page.evaluate(() => window.__gameDebug!.getState());
  for (const width of [480, 481, 768, 769, 1279, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('#game canvas')).toHaveCount(1);
    const state = await page.evaluate(() => window.__gameDebug!.getState());
    expect({ x: state.x, y: state.y, zoom: state.zoom, seed: state.seed }).toEqual({
      x: original.x,
      y: original.y,
      zoom: original.zoom,
      seed: original.seed,
    });
    const metrics = await page.evaluate(() => ({
      title: parseFloat(getComputedStyle(document.querySelector('#dialog-title')!).fontSize),
      gap: parseFloat(getComputedStyle(document.querySelector('#overlay .dialog')!).gap),
      panel: document.querySelector('.player-card')!.getBoundingClientRect().width,
      metadata: parseFloat(getComputedStyle(document.querySelector('#coordinates')!).fontSize),
      transform: getComputedStyle(document.querySelector('#game canvas')!).transform,
    }));
    const scale = width <= 480 ? 0.85 : width <= 768 ? 0.9 : width <= 1279 ? 0.95 : 1;
    expect(metrics.title).toBeCloseTo(44 * scale, 1);
    expect(metrics.gap).toBeCloseTo(24 * scale, 1);
    expect(metrics.panel).toBeCloseTo(320 * scale, 1);
    expect(metrics.metadata).toBeGreaterThanOrEqual(13);
    expect(metrics.transform).toBe('none');
    await noPageOverflow(page);
  }
});

for (const width of [320, 480, 481, 768, 769, 1279, 1280, 1920]) {
  test(`task browser fits at ${width}px including wide Markdown tables`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/docs/backlog/#05-GTS-03B-progression');
    await expect(page.locator('article table')).toHaveCount(2);
    await page.evaluate(() => document.fonts.ready);
    await noPageOverflow(page);
    await page.getByLabel('Your notes or new task idea').fill('Responsive review note.');
    await page.getByRole('button', { name: 'Copy feedback' }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Copy feedback' }).click();
    await expect(page.getByRole('status').last()).not.toBeEmpty();
    await noPageOverflow(page);
  });
}

test('closing a map after a breakpoint change restores focus to a visible control', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  for (const transition of [
    { opener: '#open-map-compact', width: 1440 },
    { opener: '#open-map', width: 390 },
  ]) {
    await page.locator(transition.opener).click();
    await page.setViewportSize({ width: transition.width, height: 900 });
    await page.locator('#close-map').click();
    expect(
      await page.evaluate(() => {
        const active = document.activeElement;
        return (
          active instanceof HTMLElement &&
          active !== document.body &&
          active.getClientRects().length > 0 &&
          !active.closest('[hidden], [inert]')
        );
      }),
    ).toBe(true);
  }
});
