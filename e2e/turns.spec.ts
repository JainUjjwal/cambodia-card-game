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

  return { page1, page2, context1, context2 };
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
  const discardText = await takeButton.innerText(); // e.g., "Take 5♣"
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
