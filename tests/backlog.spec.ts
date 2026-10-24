import { test, expect } from '@playwright/test';
import { writeFile, unlink } from 'node:fs/promises';

test('backlog supports searching, task links and separate feedback drafts', async ({
  page,
  context,
}) => {
  await page.goto('/docs/backlog/');
  await expect(page.getByRole('navigation', { name: 'Tasks' }).getByRole('link')).toHaveCount(10);
  await page.getByLabel('Search task text').fill('codec');
  await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(1);
  await page.getByRole('navigation').getByRole('link').click();
  await expect(page.locator('article h1')).toHaveText('GTS-01. Replaceable audio');
  await expect(page.locator('article')).toBeFocused();
  await page.getByRole('link', { name: 'Skip to document' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#01-GTS-01-audio$/);
  await expect(page.locator('article')).toBeFocused();
  await page.getByLabel('Your notes or new task idea').fill('Review the footstep mix.');
  await page.getByLabel('Search task text').fill('');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /GTS-03B/ })
    .click();
  await expect(page.locator('article table')).toHaveCount(2);
  await expect(page.getByLabel('Your notes or new task idea')).toHaveValue('');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: /GTS-01/ })
    .click();
  await expect(page.getByLabel('Your notes or new task idea')).toHaveValue(
    'Review the footstep mix.',
  );
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copy feedback' }).click();
  await expect(page.getByRole('status').last()).toHaveText(
    'Feedback copied. Paste it into the project chat.',
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'Review the footstep mix.',
  );
  // Exercise the manual copy path used when clipboard permission is unavailable.
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: 'Copy feedback' }).click();
  await expect(page.getByLabel('Prepared message')).toHaveValue(
    /GTS-01.*\n.*#01-GTS-01-audio\n\nReview the footstep mix\./,
  );
  await page.reload();
  await expect(page.locator('article h1')).toHaveText('GTS-01. Replaceable audio');
  await expect(page.getByLabel('Your notes or new task idea')).toHaveValue('');
  await page.getByLabel('Search task text').fill('no-such-task');
  await expect(page.getByRole('navigation')).toContainText('No matching documents');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Search task text').fill('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/docs/backlog/#missing-task');
  await expect(page.locator('article')).toContainText('This task does not exist.');
});

test('adding and removing Markdown updates discovery without changing the browser', async ({
  page,
}) => {
  const path = 'docs/backlog/99-discovery-test.md';
  try {
    await writeFile(
      path,
      '# Discovery fixture\n\nUnique discovery text.\n\n<script>window.injected = true</script>\n\n[Unsafe](javascript:alert(1))\n',
    );
    await page.goto('/docs/backlog/');
    await page
      .getByRole('navigation')
      .getByRole('link', { name: /Discovery fixture/ })
      .click();
    await expect(page.locator('article')).toContainText('Unique discovery text.');
    await expect(page.locator('article script')).toHaveCount(0);
    await expect(page.locator('article a[href^="javascript:"]')).toHaveCount(0);
    await unlink(path);
    await page.reload();
    await expect(
      page.getByRole('navigation').getByRole('link', { name: /Discovery fixture/ }),
    ).toHaveCount(0);
  } finally {
    await unlink(path).catch(() => {});
  }
});
