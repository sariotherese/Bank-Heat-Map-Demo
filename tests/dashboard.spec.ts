import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('renders all geographic districts with synthetic KPI cards and no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.district')).toHaveCount(22);
  await expect(page.getByRole('region', { name: 'Key performance indicators' }).locator('article')).toHaveCount(4);
  await expect(page.locator('.demo-pill')).toHaveText('Synthetic data');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('metric selection updates choropleth, legend and ranking', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.district')).toHaveCount(22);
  const district = page.getByRole('button', { name: /^Cu Chi:/ });
  const initial = await district.getAttribute('fill');
  await page.getByRole('button', { name: 'Working population', exact: true }).click();
  await expect(page.locator('.map-legend strong')).toHaveText('Working population');
  expect(await district.getAttribute('fill')).not.toBe(initial);
  await page.getByRole('button', { name: 'New opportunities', exact: true }).click();
  await expect(page.locator('.ranking-card')).toContainText('new opportunities');
  await expect(page.locator('.map-legend strong')).toHaveText('New opportunities');
});

test('keyboard and pointer selection expose portfolios and filter the KPI scope', async ({ page }) => {
  await page.goto('/');
  const district = page.getByRole('button', { name: /^Thu Duc City:/ });
  await district.focus();
  await expect(page.locator('.map-tooltip')).toContainText('Eximbank portfolio');
  await expect(page.locator('.map-tooltip')).toContainText('Working population');
  await district.press('Enter');
  await expect(page.locator('.scope-row')).toContainText('Thu Duc City overview');
  await expect(district).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.kpi-value').first()).toHaveText('105.6K');
  await page.getByRole('button', { name: 'Clear district' }).click();
  await expect(page.locator('.scope-row')).toContainText('Citywide at a glance');
  await district.dispatchEvent('pointerenter');
  await expect(page.locator('.portfolio-card h2')).toHaveText('Thu Duc City');
  await page.getByRole('button', { name: /^Cu Chi:/ }).hover();
  await expect(page.locator('.map-tooltip strong')).toHaveText('Cu Chi');
});

test('zoom, pan, reset and label controls work', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.district')).toHaveCount(22);
  const group = page.locator('.district-map > g');
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect(group).toHaveAttribute('transform', /scale\(1.4\)/);
  await page.getByRole('button', { name: 'Zoom out', exact: true }).click();
  await expect(group).toHaveAttribute('transform', /scale\(1\)/);
  const map = page.locator('.district-map');
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .6, box.y + box.height * .6, { steps: 5 });
  await page.mouse.up();
  await expect(group).not.toHaveAttribute('transform', 'translate(440, 315) scale(1) translate(-440, -315)');
  await page.getByRole('button', { name: 'Reset map view' }).click();
  await expect(group).toHaveAttribute('transform', 'translate(440, 315) scale(1) translate(-440, -315)');
  await page.getByRole('button', { name: 'Toggle map labels' }).click();
  await expect(page.locator('.district-label')).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle map labels' }).click();
  expect(await page.locator('.district-label').count()).toBeGreaterThan(0);
});

test('search handles empty results and district explorer selects rows', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('textbox', { name: 'Search districts' });
  await search.fill('unknown');
  await expect(page.locator('.ranking-grid')).toContainText('No districts found');
  await expect(page.locator('.kpi-value').first()).toHaveText('0');
  await search.fill('Thu Duc');
  await expect(page.locator('.rank-item')).toHaveCount(1);
  await page.locator('.rank-item').click();
  await page.getByRole('button', { name: 'Explore district', exact: true }).click();
  await expect(page.locator('tbody tr')).toHaveCount(1);
  await expect(page.locator('tbody')).toContainText('Thu Duc City');
  await search.fill('');
  await expect(page.locator('tbody tr')).toHaveCount(22);
  await page.locator('tbody').getByRole('button', { name: 'District 1', exact: true }).click();
  await expect(page.locator('.portfolio-card h2')).toHaveText('District 1');
  await page.getByRole('button', { name: 'Show heat map' }).click();
  await expect(page.locator('.district')).toHaveCount(22);
  await page.getByRole('button', { name: 'Show district table' }).click();
  await expect(page.locator('tbody tr')).toHaveCount(22);
});

test('CSV exports match the active district scope', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Search districts' }).fill('Thu Duc');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('eximbank-synthetic-mortgage-overview.csv');
  const file = await download.path();
  const lines = readFileSync(file!, 'utf8').trim().split('\r\n');
  expect(lines).toHaveLength(2);
  expect(lines[0]).toContain('synthetic');
  expect(lines[1]).toContain('Thu Duc City');
  expect(lines[1]).toContain('true');
});

test('boundary errors are explicit and can be retried', async ({ page }) => {
  await page.route('**/data/hcm-districts.geojson', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('Boundary request failed (503)');
  await page.unroute('**/data/hcm-districts.geojson');
  await page.getByRole('button', { name: 'Retry map' }).click();
  await expect(page.locator('.district')).toHaveCount(22);
});

test('methodology preserves target workspace and keyboard focus', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Data & methodology' });
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('not a Rayfin-native artifact');
  await expect(dialog).toContainText('Eximbank Demo');
  await expect(dialog.getByRole('link', { name: 'Open target Fabric workspace' })).toHaveAttribute('href', /6d6350e8-6f22-4a8b-b06a-eb4a3b68dd23.*subfolderId=102243/);
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'Nguyễn Cao Nhân' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close methodology' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
