import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Cambodia/);
});

test('can click create game', async ({ page }) => {
  await page.goto('/');

  // The landing page has a "Create Game" button
  const createButton = page.getByRole('button', { name: /Create Game/i });
  await expect(createButton).toBeVisible();
});
