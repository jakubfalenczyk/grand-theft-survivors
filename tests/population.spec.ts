import { test, expect } from '@playwright/test';

test('ambient pedestrians move before provocation and maintain budget and valid offscreen entries', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  const initial = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(initial.actors.some((actor) => actor.kind === 'civilian')).toBe(true);
  expect(initial.actors.some((actor) => actor.kind === 'officer')).toBe(true);
  expect(initial.actors.some((actor) => actor.kind === 'ranged')).toBe(true);
  await expect
    .poll(async () => {
      const now = await page.evaluate(() => window.__gameDebug!.getCombat());
      return now.actors.some((actor) => {
        const original = initial.actors.find((entry) => entry.id === actor.id);
        return (
          actor.kind === 'civilian' &&
          original &&
          Math.hypot(actor.x - original.x, actor.y - original.y) > 10
        );
      });
    })
    .toBe(true);
  const after = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(after.population!.ambient).toBeLessThanOrEqual(44);
  expect(after.actorSlots).toBeLessThanOrEqual(64);
  expect(after.population!.pathRequests).toBeLessThanOrEqual(4);
  expect(after.hostility!.every((faction) => faction.progress === 0)).toBe(true);
  for (const spawn of after.population!.recentSpawns.filter((entry) => !entry.initial))
    expect(spawn.visible).toBe(false);
});

test('witnessed crime reaches HUD, death cannot resume, and new run clears pressure and XP', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/lifecycle.html');
  await expect(page.locator('#restarts')).toHaveText('1');
  await page.locator('#stage-crime').click();
  await expect.poll(() => page.evaluate(() => window.__gameDebug!.getCombat().xp)).toBe(2);
  await expect(page.locator('#hostility-summary')).toHaveText('Docklands 0 · Police 4');
  await expect(page.locator('#hostility-cause')).toHaveText('Kill: Docklands +0 · Police +4');
  await page.setViewportSize({ width: 481, height: 900 });
  const card = await page.locator('.player-card').boundingBox();
  const map = await page.locator('.minimap-wrap').boundingBox();
  expect(
    card!.x + card!.width <= map!.x ||
      card!.y >= map!.y + map!.height ||
      card!.y + card!.height <= map!.y,
  ).toBe(true);
  await page.locator('#end-run').click();
  await expect(page.getByRole('heading', { name: 'RUN ENDED', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await expect(page.getByRole('heading', { name: 'RUN ENDED', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Start new run', exact: true }).click();
  await expect(page.locator('#restarts')).toHaveText('2');
  const fresh = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(fresh.health).toBe(100);
  expect(fresh.xp).toBe(0);
  expect(fresh.hostility!.every((faction) => faction.progress === 0 && faction.alert === 0)).toBe(
    true,
  );
  expect(fresh.projectiles).toHaveLength(0);
  expect(fresh.population!.ambient).toBeLessThanOrEqual(44);
  await expect(page.locator('#overlay')).toBeHidden();
  await expect(page.locator('#hostility-cause')).toBeHidden();
});

test('switching away from a populated crime scene clears run state and restores Westbridge population', async ({
  page,
}) => {
  await page.goto('/tests/fixtures/lifecycle.html');
  await expect(page.locator('#restarts')).toHaveText('1');
  const initial = await page.evaluate(() => window.__gameDebug!.getCombat());
  await page.locator('#stage-crime').click();
  await expect(page.locator('#hostility-summary')).toHaveText('Docklands 0 · Police 4');
  await page.locator('#load-alternate').click();
  await expect(page.locator('#restarts')).toHaveText('2');
  const alternate = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(alternate.health).toBe(100);
  expect(alternate.xp).toBe(0);
  expect(alternate.actors).toHaveLength(0);
  expect(alternate.projectiles).toHaveLength(0);
  expect(alternate.hostility!.every((entry) => entry.progress === 0)).toBe(true);
  await page.locator('#load-westbridge').click();
  await expect(page.locator('#restarts')).toHaveText('3');
  const restored = await page.evaluate(() => window.__gameDebug!.getCombat());
  expect(restored.xp).toBe(0);
  expect(restored.health).toBe(100);
  expect(restored.actorSlots).toBe(initial.actorSlots);
  expect(restored.hostility!.every((entry) => entry.progress === 0)).toBe(true);
  expect(restored.actors.some((entry) => entry.kind === 'officer')).toBe(true);
});
