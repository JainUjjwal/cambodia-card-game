import { test, expect } from '@playwright/test';

async function setupGame(browser: any) {
  const context1 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/resilience/host' } });
  const context2 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/resilience/player2' } });

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  await page1.goto('/');
  await page1.getByRole('button', { name: /Create Game/i }).click();
  const gameCode = (await page1.locator('p.font-mono').innerText()).trim();

  await page2.goto('/');
  page2.on('dialog', async dialog => {
    await dialog.accept(gameCode);
  });
  await page2.getByRole('button', { name: /Join Game/i }).click();

  await page2.getByRole('button', { name: /Waiting\.\.\./i }).click();
  await page1.getByRole('button', { name: /Start Game/i }).click();

  // Handle initial peek
  await page1.getByRole('button', { name: /Got it!/i }).click();
  await page2.getByRole('button', { name: /Got it!/i }).click();

  return { page1, page2, context1, context2, gameCode };
}

test('resilience: game state persists after browser refresh', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Player 1 turn - Draw a card
  await page1.getByRole('button', { name: /Draw Card/i }).click();
  await expect(page1.getByText('You Drew a Card')).toBeVisible();

  // Refresh page 1
  await page1.reload();

  // Wait for reconnect and check if we are still in game and turn state is consistent
  // Note: Since we are using anonymous auth, refresh should maintain the same session 
  // because Playwright maintains the context unless we close it.
  
  // Actually, the app might need to wait for Firebase to initialize after refresh
  await expect(page1.getByText('Your turn')).toBeVisible({ timeout: 10000 });
  
  // The Draw modal should be gone after refresh (it's local state), 
  // but it's still Player 1's turn.
  await expect(page1.getByRole('button', { name: /Draw Card/i })).toBeEnabled();

  await context1.close();
  await context2.close();
});

test('security: buttons are disabled when not your turn', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // It's player 1's turn
  await expect(page1.getByText('Your turn')).toBeVisible();
  
  // Player 2's buttons should be disabled
  await expect(page2.getByText(/Waiting for Player 1/i)).toBeVisible();
  await expect(page2.getByRole('button', { name: /Draw Card/i })).toBeDisabled();
  await expect(page2.getByRole('button', { name: /Take/i })).toBeDisabled();

  // Hand cards should also be disabled for Player 2
  const p2HandCards = page2.locator('div.col-span-3.row-start-3 button');
  const count = await p2HandCards.count();
  for (let i = 0; i < count; i++) {
    await expect(p2HandCards.nth(i)).toBeDisabled();
  }

  await context1.close();
  await context2.close();
});
