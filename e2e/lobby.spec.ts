import { test, expect } from '@playwright/test';

test('two players can join a lobby and start a game', async ({ browser }) => {
  // Player 1 (Host) - Separate context with video enabled
  const context1 = await browser.newContext({
    recordVideo: { dir: 'test-results/videos/host' }
  });
  const page1 = await context1.newPage();
  await page1.goto('/');
  await page1.getByRole('button', { name: /Create Game/i }).click();
  
  // Wait for the lobby to load and get the game code
  await expect(page1.getByText('Game Lobby')).toBeVisible();
  const gameCodeElement = page1.locator('p.font-mono');
  const gameCode = (await gameCodeElement.innerText()).trim();

  // Player 2 - Separate context with video enabled
  const context2 = await browser.newContext({
    recordVideo: { dir: 'test-results/videos/player2' }
  });
  const page2 = await context2.newPage();
  await page2.goto('/');
  
  // Handle the prompt for Joining Game
  page2.on('dialog', async dialog => {
    await dialog.accept(gameCode);
  });
  
  await page2.getByRole('button', { name: /Join Game/i }).click();

  // Verify Player 2 joined
  await expect(page2).toHaveURL(new RegExp(`lobby/${gameCode}`));
  await expect(page2.getByText('Game Lobby')).toBeVisible();

  // Verify both players appear in the list on both screens
  await expect(page1.getByText(/Player 1.*You/)).toBeVisible();
  await expect(page1.getByText(/Player 2/)).toBeVisible();
  
  await expect(page2.getByText(/Player 1/)).toBeVisible();
  await expect(page2.getByText(/Player 2.*You/)).toBeVisible();

  // Player 2 clicks Ready
  const readyButton2 = page2.getByRole('button', { name: /Waiting\.\.\./i });
  await readyButton2.click();
  await expect(page2.getByRole('button', { name: 'Ready' })).toBeVisible();

  // Player 1 (Host) should see Player 2 is ready
  const player2Row = page1.locator('div.flex.items-center.justify-between', { hasText: 'Player 2' });
  await expect(player2Row.getByText('Ready', { exact: true })).toBeVisible();

  // Host starts the game
  const startButton = page1.getByRole('button', { name: /Start Game/i });
  await expect(startButton).toBeEnabled();
  await startButton.click();

  // Both should be redirected to the game page
  await expect(page1).toHaveURL(/\/game\//);
  await expect(page2).toHaveURL(/\/game\//);

  await context1.close();
  await context2.close();
});
