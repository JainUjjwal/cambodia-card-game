import { test, expect } from '@playwright/test';

test('lobby and turn flow with 6 players', async ({ browser }) => {
  const playerCount = 6;
  const contexts = await Promise.all(
    Array.from({ length: playerCount }).map((_, i) => 
      browser.newContext({ recordVideo: { dir: `test-results/videos/scale/player${i + 1}` } })
    )
  );
  
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  
  // Host (Player 1) creates game
  await pages[0].goto('/');
  await pages[0].getByRole('button', { name: /Create Game/i }).click();
  await expect(pages[0].getByText('Game Lobby')).toBeVisible();
  const gameCode = (await pages[0].locator('p.font-mono').innerText()).trim();
  console.log(`Game created with code: ${gameCode}`);

  // Players 2-6 join
  for (let i = 1; i < playerCount; i++) {
    const page = pages[i];
    page.on('console', msg => console.log(`PAGE ${i + 1} LOG:`, msg.text()));
    
    await page.goto('/');
    page.on('dialog', async dialog => {
      await dialog.accept(gameCode);
    });
    await page.getByRole('button', { name: /Join Game/i }).click();
    
    // Check for error messages
    const errorText = page.locator('.text-red-500');
    if (await errorText.isVisible()) {
      console.log(`PAGE ${i + 1} ERROR:`, await errorText.innerText());
    }

    await expect(page.getByText('Game Lobby')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`Player ${i + 1} (You)`)).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000); // Wait between joins
  }

  // Host should see 6 players
  await expect(pages[0].getByText(/Players \(6\/6\)/)).toBeVisible({ timeout: 20000 });

  // All players (2-6) click Ready
  for (let i = 1; i < playerCount; i++) {
    const page = pages[i];
    const readyButton = page.getByRole('button', { name: /Waiting\.\.\./i }).and(page.locator(':not([disabled])'));
    await readyButton.click();
    await expect(page.getByRole('button', { name: 'Ready' })).toBeVisible();
  }

  // Host (Player 1) verifies all are ready and starts
  // We check for "Ready" text in all 6 player rows
  const allReady = pages[0].locator('button', { hasText: 'Ready' });
  await expect(allReady).toHaveCount(6, { timeout: 20000 });

  const startButton = pages[0].getByRole('button', { name: /Start Game/i });
  await expect(startButton).toBeEnabled();
  await startButton.click();

  // Verify all transition to game page
  await Promise.all(pages.map(page => expect(page).toHaveURL(/\/game\//, { timeout: 15000 })));

  // Handle initial peek for all
  await Promise.all(pages.map(page => page.getByRole('button', { name: /Got it!/i }).click()));

  // Verify Turn Order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 1
  for (let i = 0; i < playerCount; i++) {
    const currentPlayerPage = pages[i];
    const nextPlayerIndex = (i + 1) % playerCount;
    
    await expect(currentPlayerPage.getByText('Your turn')).toBeVisible({ timeout: 10000 });
    
    // Draw and Discard to pass turn
    await currentPlayerPage.getByRole('button', { name: /Draw Card/i }).click();
    await currentPlayerPage.getByRole('button', { name: /Discard/i }).click();
    
    // Wait for turn to advance to next
    await expect(pages[nextPlayerIndex].getByText('Your turn')).toBeVisible({ timeout: 10000 });
  }

  // Cleanup
  await Promise.all(contexts.map(context => context.close()));
});
