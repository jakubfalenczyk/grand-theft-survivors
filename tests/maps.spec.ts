import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function metrics(page: Page) {
  return JSON.parse((await page.locator('#metrics').textContent())!);
}

test('equal-seed maps switch A to B to A with bounded resources and fresh state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/tests/fixtures/maps.html');
  await expect(page.locator('#loads')).toHaveText('1');
  const initial = await metrics(page);
  expect(initial.mapId).toBe('fixture-a');
  expect(initial.groundSize).toEqual([840, 840]);
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => window.__gameDebug!.getState().y)).toBeLessThan(370);
  await page.keyboard.up('w');
  for (const [index, id] of ['b', 'a', 'b', 'a'].entries()) {
    await page.locator(`#load-${id}`).click();
    await expect(page.locator('#loads')).toHaveText(String(index + 2));
    const current = await metrics(page);
    expect(current.mapId).toBe(`fixture-${id}`);
    expect(current.oldObjectsAlive).toBe(0);
    expect(current.oldBodiesAlive).toBe(0);
    expect(current.oldKeysAlive).toBe(0);
    expect(current.oldAudioActive).toBe(0);
    await expect.poll(() => page.evaluate(() => window.__gameDebug!.getAudio().managed)).toBe(0);
    expect(current.blurListeners).toBe(initial.blurListeners);
    expect(current.subscriptions).toBe(initial.subscriptions);
    expect(current.bodies).toBe(1);
    expect(current.staticBodies).toBe(4);
    expect(current.colliders).toBe(1);
    expect(current.audioCached).toBe(7);
    expect(current.groundSize).toEqual(id === 'a' ? [840, 840] : [1260, 840]);
    expect(current.physicsBounds).toMatchObject({
      x: 8,
      y: 8,
      width: current.bounds.width - 16,
      height: current.bounds.height - 16,
    });
    expect(current.cameraBounds).toMatchObject({
      x: 0,
      y: 0,
      width: current.bounds.width,
      height: current.bounds.height,
    });
    expect(
      current.textures
        .filter((key: string) => key.startsWith('map:'))
        .every((key: string) => key.startsWith(`map:fixture-${id}:`)),
    ).toBe(true);
    expect(current.roofKey).toBe(`map:fixture-${id}:2042:roof-0`);
    expect(current.material).toBe(id === 'a' ? 'old-town' : 'greenfield');
    const state = await page.evaluate(() => window.__gameDebug!.getState());
    expect(state).toMatchObject({
      mapId: `fixture-${id}`,
      x: id === 'a' ? 420 : 840,
      y: 394,
      moving: 0,
      running: false,
      heading: -Math.PI / 2,
    });
    await expect(page.locator('#map-name')).toHaveText(id === 'a' ? 'OLD TOWN' : 'GREENFIELD');
    await expect(page.locator('#district-name')).toHaveText(id === 'a' ? 'Old Town' : 'Greenfield');
    if (id === 'a') {
      expect(current.textures).toEqual(initial.textures);
      expect(current.objects).toBe(initial.objects);
    }
    await page.keyboard.press('m');
    await expect(page.getByRole('dialog')).toHaveAccessibleName('CITY MAP');
    await page.keyboard.press('m');
  }
  await page.locator('#load-invalid').click();
  await expect(page.locator('#game-status')).toContainText('Unknown map ID: missing');
  await expect(page.locator('#loads')).toHaveText('5');
  expect(await page.evaluate(() => window.__gameDebug!.getState().mapId)).toBe('fixture-a');
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => window.__gameDebug!.getState().y)).toBeLessThan(380);
  await page.keyboard.up('w');
  expect(errors).toEqual([]);
});

test('Restart run reloads Westbridge, keeps audio settings and restores accessible focus', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Restart run', exact: true })).toBeHidden();
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  const initial = await page.evaluate(() => window.__gameDebug!.getBuildings());
  await page.locator('#audio-button').click();
  await page.locator('#audio-mute').check();
  await page.locator('#audio-close').click();
  const preferences = await page.evaluate(() => localStorage.getItem('gts.audio.v1'));
  await page.keyboard.down('w');
  await expect.poll(() => page.evaluate(() => window.__gameDebug!.getState().y)).toBeLessThan(1200);
  await page.keyboard.up('w');
  await page.locator('#pause-button').click();
  await expect(page.getByRole('button', { name: 'Restart run', exact: true })).toBeVisible();
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Restart run', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(await page.evaluate(() => window.__gameDebug!.getState())).toMatchObject({
      mapId: 'westbridge',
      seed: 2042,
      x: 1260,
      y: 1234,
      moving: 0,
      running: false,
    });
    expect(await page.evaluate(() => window.__gameDebug!.getBuildings())).toEqual(initial);
    expect(await page.evaluate(() => localStorage.getItem('gts.audio.v1'))).toBe(preferences);
    await expect(page.locator('#pause-button')).toBeFocused();
    await page.locator('#pause-button').click();
  }
  await page.locator('#pause-audio-button').click();
  await expect(page.locator('#audio-mute')).toBeChecked();
  expect(errors).toEqual([]);
});
