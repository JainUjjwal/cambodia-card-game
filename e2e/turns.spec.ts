import { test, expect, BrowserContext, Page } from '@playwright/test';

async function setupGame(browser: any) {
  const context1 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/turns/host' } });
  const context2 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/turns/player2' } });

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Player 1 creates game
  await page1.goto('/');
  await page1.getByRole('button', { name: /Create Game/i }).click();
  await expect(page1.getByText('Game Lobby')).toBeVisible();
  const gameCode = (await page1.locator('p.font-mono').innerText()).trim();

  // Player 2 joins
  await page2.goto('/');
  page2.on('dialog', async dialog => {
    await dialog.accept(gameCode);
  });
  await page2.getByRole('button', { name: /Join Game/i }).click();
  await expect(page2.getByText('Game Lobby')).toBeVisible();

  // Ready and Start
  await page2.getByRole('button', { name: /Waiting\.\.\./i }).click();
  await expect(page2.getByRole('button', { name: 'Ready' })).toBeVisible();

  // Host should see Player 2 is ready
  const p2Row = page1.locator('div.flex.items-center.justify-between', { hasText: 'Player 2' });
  await expect(p2Row.getByText('Ready', { exact: true })).toBeVisible();

  await page1.getByRole('button', { name: /Start Game/i }).click();

  // Wait for game to start
  await expect(page1).toHaveURL(/\/game\//);
  await expect(page2).toHaveURL(/\/game\//);

  // Initial Peek Modal for both
  const gotIt1 = page1.getByRole('button', { name: /Got it!/i });
  await expect(gotIt1).toBeVisible({ timeout: 10000 });
  await gotIt1.click();

  const gotIt2 = page2.getByRole('button', { name: /Got it!/i });
  await expect(gotIt2).toBeVisible({ timeout: 10000 });
  await gotIt2.click();

  return { page1, page2, context1, context2, gameCode };
}

test('basic turn flow: draw and discard', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Player 1 turn - Draw from deck
  await expect(page1.getByText('Your turn')).toBeVisible();
  await page1.getByRole('button', { name: /Draw Card/i }).click();
  
  // Modal should appear
  await expect(page1.getByText('You Drew a Card')).toBeVisible();
  
  // Click Discard
  await page1.getByRole('button', { name: /Discard/i }).click();

  // Verify turn advanced to Player 2
  await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible();
  await expect(page2.getByText('Your turn')).toBeVisible();

  // Cleanup
  await context1.close();
  await context2.close();
});

test('basic turn flow: take from discard and swap', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Player 1 turn - Take from discard
  // First we need to know what's in discard to click the button
  const takeButton = page1.locator('button', { hasText: 'Take' });
  await takeButton.click();

  // Instruction should change
  await expect(page1.getByText('Select one of your cards to swap')).toBeVisible();

  // Select first card in hand
  const handCards = page1.locator('div.col-span-3.row-start-3 button');
  await handCards.first().click();

  // Verify turn advanced
  await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible();
  await expect(page2.getByText('Your turn')).toBeVisible();

  // Cleanup
  await context1.close();
  await context2.close();
});

test('basic turn flow: full turn cycle between two players', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Player 1 turn - Draw and Discard
  await page1.getByRole('button', { name: /Draw Card/i }).click();
  await page1.getByRole('button', { name: /Discard/i }).click();

  // Player 2 turn - Draw and Discard
  await expect(page2.getByText('Your turn')).toBeVisible();
  await page2.getByRole('button', { name: /Draw Card/i }).click();
  await page2.getByRole('button', { name: /Discard/i }).click();

  // Verify turn returned to Player 1
  await expect(page2.getByText(/Waiting for Player 1/i)).toBeVisible();
  await expect(page1.getByText('Your turn')).toBeVisible();

  // Cleanup
  await context1.close();
  await context2.close();
});

test('basic turn flow: snap option visibility', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Verify instructional text includes Snap
  await expect(page1.getByText(/Snap/i)).toBeVisible();
  
  // Verify cards in hand are enabled at start of turn
  const handCards = page1.locator('div.col-span-3.row-start-3 button');
  const count = await handCards.count();
  for (let i = 0; i < count; i++) {
    await expect(handCards.nth(i)).toBeEnabled();
  }

  await context1.close();
  await context2.close();
});

test('basic turn flow: call cambodia', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // Player 1 calls Cambodia
  await page1.getByRole('button', { name: /Call Cambodia/i }).click();

  // Banner should appear on both screens
  await expect(page1.getByText(/CAMBODIA CALLED BY PLAYER 1/i)).toBeVisible();
  await expect(page2.getByText(/CAMBODIA CALLED BY PLAYER 1/i)).toBeVisible();

  // Instruction for Player 2 should be final turn
  await expect(page2.getByText(/FINAL TURN!/i)).toBeVisible({ timeout: 10000 });
  // In our GameTable logic, when Cambodia is active, "Your turn" text is replaced by "FINAL TURN!"
  // so we check for that instead of 'Your turn'.
  await expect(page2.getByText(/Make your last move/i)).toBeVisible();

  await context1.close();
  await context2.close();
});

test('scoring flow: full round end after Cambodia call', async ({ browser }) => {
  const { page1, page2, context1, context2, gameCode } = await setupGame(browser);

  // 1. Player 1 calls Cambodia
  await page1.getByRole('button', { name: /Call Cambodia/i }).click();
  
  // 2. Player 2 takes final turn (Draw and Discard)
  await expect(page2.getByText(/FINAL TURN!/i)).toBeVisible();
  await page2.getByRole('button', { name: /Draw Card/i }).click();
  await page2.getByRole('button', { name: /Discard/i }).click();

  // 3. Both should be redirected to /end
  const endUrlPattern = new RegExp(`end\\?gameId=${gameCode}`, 'i');
  await expect(page1).toHaveURL(endUrlPattern, { timeout: 15000 });
  await expect(page2).toHaveURL(endUrlPattern, { timeout: 15000 });

  // 4. Verify score table is visible on end screen
  await expect(page1.getByText('ROUND ENDED')).toBeVisible();
  await expect(page1.locator('table')).toBeVisible();
  
  // Total row should have scores
  const totals = page1.locator('tfoot tr td');
  await expect(totals).toHaveCount(2);

  await context1.close();
  await context2.close();
});

test('game flow: host can start next round', async ({ browser }) => {
  const { page1, page2, context1, context2, gameCode } = await setupGame(browser);

  // 1. Complete a round
  await page1.getByRole('button', { name: /Call Cambodia/i }).click();
  await page2.getByRole('button', { name: /Draw Card/i }).click();
  await page2.getByRole('button', { name: /Discard/i }).click();

  // 2. Both redirected to /end
  const endUrlPattern = new RegExp(`end\\?gameId=${gameCode}`, 'i');
  await expect(page1).toHaveURL(endUrlPattern, { timeout: 15000 });
  await expect(page2).toHaveURL(endUrlPattern, { timeout: 15000 });

  // 3. Host clicks Next Round
  const nextRoundButton = page1.getByRole('button', { name: /Next Round/i });
  await expect(nextRoundButton).toBeVisible();
  await nextRoundButton.click();

  // 4. Verify redirect back to game
  const gameUrlPattern = new RegExp('game/' + gameCode, 'i');
  await expect(page1).toHaveURL(gameUrlPattern, { timeout: 15000 });
  await expect(page2).toHaveURL(gameUrlPattern, { timeout: 15000 });

  // 5. Verify initial peek modal is back
  await expect(page1.getByText('Your Bottom Cards')).toBeVisible({ timeout: 10000 });
  await expect(page2.getByText('Your Bottom Cards')).toBeVisible({ timeout: 10000 });

  await context1.close();
  await context2.close();
});
