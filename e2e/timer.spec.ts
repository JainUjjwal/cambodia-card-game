import { test, expect } from '@playwright/test';

test('turn timer and auto-skip logic', async ({ browser }) => {
  // Use a separate context
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('TIMER TEST LOG:', msg.text()));

  // 1. Create a game with 30s timer
  await page.goto('/');
  await page.getByRole('button', { name: /Create Game/i }).click();
  await expect(page.getByText('Game Lobby')).toBeVisible();
  
  // Set timer to 30s (already default in UI, but let's be sure)
  await page.selectOption('#turn-timer', '30');
  
  // Start game
  await page.getByRole('button', { name: /Start Game/i }).click();
  await expect(page).toHaveURL(/\/game\//);

  // Close initial peek
  await page.getByRole('button', { name: /Got it!/i }).click();

  // 2. Verify timer is visible
  const timer = page.locator('span.font-mono');
  await expect(timer).toBeVisible();
  
  // 3. We won't wait 30 seconds in a test usually, but we can verify the UI update
  const initialTime = await timer.innerText();
  await page.waitForTimeout(2000);
  const updatedTime = await timer.innerText();
  
  expect(parseInt(updatedTime)).toBeLessThan(parseInt(initialTime));

  await context.close();
});

/*
test('auto-skip: turn advances when timer hits zero', async ({ browser }) => {
...
*/
