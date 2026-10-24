import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';
const state = (page: Page) => page.evaluate(() => window.__gameDebug!.getState());
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__gameDebug?.isReady());
});

test('boots without browser errors and renders the playable city', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.reload();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  await expect(page.locator('#game canvas')).toBeVisible();
  await expect(page).toHaveTitle('Grand Theft Survivors city prototype');
  expect((await state(page)).buildings).toBeGreaterThan(100);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'docs/prototype-desktop.png' });
});

test('tank controls: forward, backward, rotation, and faster running', async ({ page }) => {
  const start = await state(page);
  await page.keyboard.down('w');
  await page.waitForTimeout(500);
  await page.keyboard.up('w');
  const walking = await state(page);
  expect(start.y - walking.y).toBeGreaterThan(35);
  expect(Math.abs(start.x - walking.x)).toBeLessThan(2);
  await page.waitForTimeout(80);
  const backwardStart = await state(page);
  await page.keyboard.down('s');
  await page.waitForTimeout(500);
  await page.keyboard.up('s');
  const backwardDistance = (await state(page)).y - backwardStart.y;
  expect(backwardDistance / (start.y - walking.y)).toBeGreaterThan(0.85);
  expect(backwardDistance / (start.y - walking.y)).toBeLessThan(1.15);
  await page.locator('#reset-button').click();
  const reset = await state(page);
  await page.keyboard.down('Shift');
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowUp');
  await page.keyboard.up('Shift');
  expect(reset.y - (await state(page)).y).toBeGreaterThan((start.y - walking.y) * 1.35);
  await page.waitForTimeout(80);
  const before = await state(page);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  const after = await state(page);
  expect(after.heading - before.heading).toBeGreaterThan(1.15);
  expect(Math.abs(after.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
});

test('building footprints stop the player', async ({ page }) => {
  await page.keyboard.down('w');
  await page.waitForTimeout(800);
  await page.keyboard.up('w');
  await page.keyboard.down('d');
  await page.waitForTimeout(325);
  await page.keyboard.up('d');
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  const buildings = await page.evaluate(() => window.__gameDebug!.getBuildings());
  for (let i = 0; i < 12; i++) {
    await page.waitForTimeout(100);
    const p = await state(page);
    expect(
      buildings.some(
        (b) => p.x > b.x + 2 && p.x < b.x + b.w - 2 && p.y > b.y + 2 && p.y < b.y + b.h - 2,
      ),
    ).toBe(false);
  }
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  const stopped = await state(page);
  expect(stopped.x).toBeLessThan(1340);
  expect(stopped.x).toBeGreaterThan(1300);
});

test('pause and map stop movement; help, zoom and restart work', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect(page.locator('#overlay')).toBeVisible();
  const p = await state(page);
  await page.keyboard.down('w');
  await page.waitForTimeout(300);
  await page.keyboard.up('w');
  expect((await state(page)).y).toBe(p.y);
  await page.locator('#resume-button').click();
  await expect(page.locator('#overlay')).toBeHidden();
  await page.keyboard.press('m');
  await expect(page.locator('#map-overlay')).toBeVisible();
  await page.keyboard.down('w');
  await page.waitForTimeout(200);
  await page.keyboard.up('w');
  expect((await state(page)).y).toBe(p.y);
  await page.keyboard.press('m');
  await expect(page.locator('#map-overlay')).toBeHidden();
  await page.locator('#help-button').click();
  await expect(page.locator('#help-content')).toBeVisible();
  await page.locator('#resume-button').click();
  await page.locator('#zoom-in').click();
  expect((await state(page)).zoom).toBe(2.5);
  await page.locator('#zoom-out').click();
  expect((await state(page)).zoom).toBe(2);
  await page.keyboard.down('w');
  await page.waitForTimeout(200);
  await page.keyboard.up('w');
  await page.locator('#reset-button').click();
  expect((await state(page)).y).toBe(1234);
});

test('mobile layout fits and the viewport resizes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  const canvas = await page.locator('#game canvas').boundingBox();
  expect(canvas!.width).toBeLessThan(390);
  await page.screenshot({ path: 'docs/prototype-mobile.png' });
});

test('high roofs expand in perspective and react to camera movement without moving colliders', async ({
  page,
}) => {
  await page.waitForTimeout(250);
  const footprints = await page.evaluate(() => window.__gameDebug!.getBuildings());
  const views = await page.evaluate(() => window.__gameDebug!.getBuildingViews());
  const tall = views.find((b) => b.height === 165);
  const low = views.find((b) => b.height === 95);
  if (!tall || !low) throw new Error('Expected visible high and low buildings');
  expect(tall.scale).toBeGreaterThan(1.45);
  expect(tall.scale).toBeGreaterThan(low.scale);
  await page.keyboard.down('w');
  await page.waitForTimeout(450);
  await page.keyboard.up('w');
  await page.waitForTimeout(350);
  const after = await page.evaluate(() => window.__gameDebug!.getBuildingViews());
  const same = after.find((b) => b.x === tall.x && b.y === tall.y);
  if (!same) throw new Error('Expected same building after movement');
  expect(same.roofY - tall.roofY).toBeGreaterThan(12);
  expect(same.scale).toBe(tall.scale);
  expect(await page.evaluate(() => window.__gameDebug!.getBuildings())).toEqual(footprints);
  await page.screenshot({ path: 'docs/perspective-in-motion.png' });
});
