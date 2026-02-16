import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // The title in index.html is "Vite + React + TS"
  await expect(page).toHaveTitle(/Vite/);
});

test('can click create game', async ({ page }) => {
  await page.goto('/');

  // The landing page has a "Create Game" button
  const createButton = page.getByRole('button', { name: /Create Game/i });
  await expect(createButton).toBeVisible();
});

test('scoreboard can be opened and closed in game', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Create Game/i }).click();
  
  await expect(page.getByText('Game Lobby')).toBeVisible();
  
  // Start the game (as host, single player for this test is fine to just check UI)
  await page.getByRole('button', { name: /Start Game/i }).click();
  await expect(page).toHaveURL(/\/game\//);

  // Close initial peek
  await page.getByRole('button', { name: /Got it!/i }).click();

  // Click Scoreboard button
  await page.getByTitle('View Scoreboard').click();
  
  // Verify modal content
  await expect(page.getByRole('heading', { name: 'Scoreboard' })).toBeVisible();
  await expect(page.getByText('Total')).toBeVisible();

  // Close modal - using a more specific locator for the X button
  await page.locator('button:has(svg.lucide-x)').click();
  await expect(page.getByRole('heading', { name: 'Scoreboard' })).not.toBeVisible();
});
