import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
const audio = (page: Page) => page.evaluate(() => window.__gameDebug!.getAudio());
const start = async (page: Page) => {
  await page.getByRole('button', { name: 'Play', exact: true }).click();
  await page.waitForFunction(() => window.__gameDebug?.isReady());
};
async function volume(page: Page, name: string, value: number) {
  await page.getByRole('slider', { name, exact: true }).fill(String(value));
}

test('Play gates engine and audio, footsteps play only while moving and pause stops them', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/audio\/[^/]+\.wav/.test(request.url())) requests.push(request.url());
  });
  await page.goto('/');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('WESTBRIDGE IS WAITING.');
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('m');
  await page.keyboard.press('h');
  await expect(page.locator('#game canvas')).toHaveCount(0);
  expect(requests).toHaveLength(0);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.__gameDebug?.isReady());
  await expect.poll(async () => (await audio(page)).context).toBe('running');
  expect((await audio(page)).cached).toBe(7);
  const before = (await audio(page)).played;
  const startY = await page.evaluate(() => window.__gameDebug!.getState().y);
  await page.keyboard.down('w');
  await expect
    .poll(async () => startY - (await page.evaluate(() => window.__gameDebug!.getState().y)), {
      timeout: 8000,
    })
    .toBeGreaterThan(70);
  await page.keyboard.up('w');
  await expect.poll(() => page.evaluate(() => window.__gameDebug!.getState().moving)).toBe(0);
  expect((await audio(page)).played).toBeGreaterThan(before + 1);
  expect((await audio(page)).lastCue).toBe('player:footstep:concrete');
  const idle = (await audio(page)).played;
  await page.waitForTimeout(450);
  expect((await audio(page)).played).toBe(idle);
  await page.keyboard.down('a');
  await page.waitForTimeout(250);
  await page.keyboard.up('a');
  expect((await audio(page)).played).toBe(idle);
  await page.keyboard.press('Escape');
  expect((await audio(page)).active.every((voice) => voice.bus === 'ui')).toBe(true);
});

test('sound controls mix live voices, persist preferences and trap focus', async ({ page }) => {
  await page.goto('/');
  await start(page);
  await page.getByRole('button', { name: 'Sound', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveAccessibleName('SOUND');
  const frame = await page.locator('#audio-overlay').boundingBox();
  const back = await page.getByRole('button', { name: 'Back', exact: true }).boundingBox();
  expect(back!.y + back!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
  await expect(page.getByRole('checkbox', { name: 'Mute all sound' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Back', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('checkbox', { name: 'Mute all sound' })).toBeFocused();
  await page.getByRole('slider', { name: 'Player', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('slider', { name: 'Player', exact: true })).toHaveValue('69');
  await volume(page, 'Master', 50);
  await volume(page, 'All SFX', 50);
  await volume(page, 'Interface', 50);
  await page.getByRole('button', { name: 'Test sound' }).click();
  await expect
    .poll(async () =>
      (await audio(page)).active.some(
        (voice) => voice.bus === 'ui' && Math.abs(voice.volume - 0.06875) < 0.0001,
      ),
    )
    .toBe(true);
  await page.getByRole('checkbox', { name: 'Mute all sound' }).check();
  await expect
    .poll(async () => (await audio(page)).active.every((voice) => voice.volume === 0))
    .toBe(true);
  const before = (await audio(page)).played;
  await page.getByRole('button', { name: 'Test sound' }).click();
  expect((await audio(page)).played).toBe(before);
  await page.reload();
  await start(page);
  await page.getByRole('button', { name: 'Sound', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Mute all sound' })).toBeChecked();
  await expect(page.getByRole('slider', { name: 'Master', exact: true })).toHaveValue('50');
  await expect(page.getByRole('slider', { name: 'Interface', exact: true })).toHaveValue('50');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sound', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.locator('#pause-audio-button').click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveAccessibleName('PAUSED');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#pause-audio-button').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('missing sounds and denied storage leave the game playable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('Storage denied');
    };
    Storage.prototype.setItem = () => {
      throw new Error('Storage denied');
    };
  });
  await page.route('**/audio/*.wav', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await start(page);
  await page.getByRole('button', { name: 'Sound', exact: true }).click();
  await expect(page.locator('#audio-status')).toContainText('Sound is unavailable');
  await expect(page.locator('#audio-storage-status')).toContainText('could not save');
  await volume(page, 'Player', 33);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
});

test('unavailable audio hardware does not prevent Play', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: class {
        constructor() {
          throw new Error('Audio device unavailable');
        }
      },
    });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await start(page);
  expect((await audio(page)).context).toBe('unavailable');
  await page.getByRole('button', { name: 'Sound', exact: true }).click();
  await expect(page.locator('#audio-status')).toContainText('Sound is unavailable');
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.keyboard.down('w');
  await page.waitForTimeout(400);
  await page.keyboard.up('w');
  expect(await page.evaluate(() => window.__gameDebug!.getState().y)).toBeLessThan(1234);
  expect(errors).toEqual([]);
});

test('partial loading and corrupt saved preferences retain working cues and default levels', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('gts.audio.v1', '{broken-json'));
  await page.route('**/audio/concrete-1.wav', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto('/');
  await start(page);
  expect((await audio(page)).cached).toBe(6);
  await page.getByRole('button', { name: 'Sound', exact: true }).click();
  await expect(page.locator('#audio-status')).toContainText('Some sounds could not load');
  await expect(page.getByRole('slider', { name: 'Master', exact: true })).toHaveValue('80');
  for (let i = 0; i < 12; i++) {
    await volume(page, 'Interface', 60 + i);
    expect((await audio(page)).active.length).toBeLessThanOrEqual(8);
    expect(
      (await audio(page)).active.filter((voice) => voice.cue === 'ui:change').length,
    ).toBeLessThanOrEqual(2);
  }
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  const before = (await audio(page)).played;
  await page.keyboard.down('w');
  await page.waitForTimeout(950);
  await page.keyboard.up('w');
  expect((await audio(page)).played).toBeGreaterThan(before);
});
