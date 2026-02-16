import { test, expect } from '@playwright/test';

async function setupGame(browser: any) {
  const context1 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/actions/host' } });
  const context2 = await browser.newContext({ recordVideo: { dir: 'test-results/videos/actions/player2' } });

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  page1.on('console', msg => console.log('PAGE 1 LOG:', msg.text()));
  page2.on('console', msg => console.log('PAGE 2 LOG:', msg.text()));

  await page1.goto('/');
  await page1.getByRole('button', { name: /Create Game/i }).click();
  const gameCode = (await page1.locator('p.font-mono').innerText()).trim();

  await page2.goto('/');
  page2.on('dialog', async dialog => {
    await dialog.accept(gameCode);
  });
  await page2.getByRole('button', { name: /Join Game/i }).click();

  await page2.getByRole('button', { name: /Waiting\.\.\./i }).click();
  await expect(page2.getByRole('button', { name: 'Ready' })).toBeVisible();
  
  const p2Row = page1.locator('div.flex.items-center.justify-between', { hasText: 'Player 2' });
  await expect(p2Row.getByText('Ready', { exact: true })).toBeVisible();

  await page1.getByRole('button', { name: /Start Game/i }).click();

  await page1.getByRole('button', { name: /Got it!/i }).click();
  await page2.getByRole('button', { name: /Got it!/i }).click();

  return { page1, page2, context1, context2 };
}

test('action flow: peek and spy', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  // We will draw cards until we find a Peek (7, 8) or Spy (9, 10)
  let actionFound = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!actionFound && attempts < maxAttempts) {
    await page1.getByRole('button', { name: /Draw Card/i }).click();
    const modal = page1.locator('div.fixed.inset-0.bg-black.bg-opacity-75');
    await expect(modal).toBeVisible();

    const actionButton = page1.getByRole('button', { name: /Use Action/i });
    const isEnabled = await actionButton.isEnabled();

    if (isEnabled) {
      const cardText = await modal.locator('div.font-bold.text-5xl').innerText();
      console.log(`Found action card: ${cardText}`);
      
      if (['7', '8'].includes(cardText)) {
        // Test Peek
        await actionButton.click();
        await expect(modal).not.toBeVisible();
        await expect(page1.getByText('Select one of your cards to peek at')).toBeVisible();
        
        // Wait for hand buttons to be enabled (isPeeking state sync)
        const firstCard = page1.locator('div.col-span-3.row-start-3 button').first();
        await expect(firstCard).toBeEnabled();
        await page1.waitForTimeout(500); // UI Settle
        await firstCard.click();
        
        // Result modal
        await expect(page1.getByText('You Peeked')).toBeVisible({ timeout: 10000 });
        await page1.getByRole('button', { name: /Got it!/i }).click();
        
        // Verify turn advanced
        await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible();
        actionFound = true;
      } else if (['9', '10'].includes(cardText)) {
        // Test Spy
        await actionButton.click();
        await expect(modal).not.toBeVisible();
        await expect(page1.getByText("Select an opponent's card to spy on")).toBeVisible();
        
        // Wait for opponent hand buttons to be enabled (isSpying state sync)
        const opponentCard = page1.locator('div.col-start-2.row-start-1 button').first();
        await expect(opponentCard).toBeEnabled();
        await page1.waitForTimeout(500); // UI Settle
        await opponentCard.click();
        
        // Result modal
        await expect(page1.getByText('Spy Result')).toBeVisible({ timeout: 10000 });
        await page1.getByRole('button', { name: /Excellent!/i }).click();
        
        // Verify turn advanced
        await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible();
        actionFound = true;
      } else {
        // Other action card (J, Q, K) - not tested here yet, just discard
        await page1.getByRole('button', { name: /Discard/i }).click();
      }
    } else {
      await page1.getByRole('button', { name: /Discard/i }).click();
    }

    if (!actionFound) {
      // It's player 2's turn now, just discard to get back to player 1
      await expect(page2.getByText('Your turn')).toBeVisible();
      await page2.getByRole('button', { name: /Draw Card/i }).click();
      await page2.getByRole('button', { name: /Discard/i }).click();
      attempts++;
    }
  }

  if (!actionFound) {
    console.log('Could not find a Peek/Spy card in 10 attempts.');
  }

  await context1.close();
  await context2.close();
});

test('action flow: blind swap', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  let actionFound = false;
  let attempts = 0;
  const maxAttempts = 15;

  while (!actionFound && attempts < maxAttempts) {
    await page1.getByRole('button', { name: /Draw Card/i }).click();
    const modal = page1.locator('div.fixed.inset-0.bg-black.bg-opacity-75');
    await expect(modal).toBeVisible();

    const actionButton = page1.getByRole('button', { name: /Use Action/i });
    const isEnabled = await actionButton.isEnabled();

    if (isEnabled) {
      const cardValue = await modal.locator('div.font-bold.text-5xl').innerText();
      console.log(`Found action card: ${cardValue}`);
      
      if (['J', 'Q'].includes(cardValue)) {
        // Test Blind Swap
        await actionButton.click();
        await expect(modal).not.toBeVisible();
        await expect(page1.getByText('Blind Swap: Select one of your cards...')).toBeVisible();
        
        // Step 1: Select own card
        const myFirstCard = page1.locator('div.col-span-3.row-start-3 button').first();
        await expect(myFirstCard).toBeEnabled();
        await page1.waitForTimeout(500); // UI Settle
        await myFirstCard.click();

        await expect(page1.getByText("Blind Swap: Select an opponent's card to swap with...")).toBeVisible();

        // Step 2: Select opponent card
        const opponentFirstCard = page1.locator('div.col-start-2.row-start-1 button').first();
        await expect(opponentFirstCard).toBeEnabled();
        await page1.waitForTimeout(500); // UI Settle
        await opponentFirstCard.click();
        
        // Verify turn advanced
        await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible({ timeout: 10000 });
        actionFound = true;
      } else {
        await page1.getByRole('button', { name: /Discard/i }).click();
      }
    } else {
      await page1.getByRole('button', { name: /Discard/i }).click();
    }

    if (!actionFound) {
      // Pass turn
      await expect(page2.getByText('Your turn')).toBeVisible();
      await page2.getByRole('button', { name: /Draw Card/i }).click();
      await page2.getByRole('button', { name: /Discard/i }).click();
      attempts++;
    }
  }

  await context1.close();
  await context2.close();
});

test('action flow: spy and swap', async ({ browser }) => {
  const { page1, page2, context1, context2 } = await setupGame(browser);

  let actionFound = false;
  let attempts = 0;
  const maxAttempts = 20;

  while (!actionFound && attempts < maxAttempts) {
    await page1.getByRole('button', { name: /Draw Card/i }).click();
    const modal = page1.locator('div.fixed.inset-0.bg-black.bg-opacity-75');
    await expect(modal).toBeVisible();

    const actionButton = page1.getByRole('button', { name: /Use Action/i });
    const isEnabled = await actionButton.isEnabled();

    if (isEnabled) {
      const cardValue = await modal.locator('div.font-bold.text-5xl').innerText();
      const cardSuit = await modal.locator('div.text-4xl').innerText();
      console.log(`Found action card: ${cardValue} of ${cardSuit}`);
      
      const isBlackKing = cardValue === 'K' && ['♠', '♣'].includes(cardSuit);

      if (isBlackKing) {
        // Test Spy and Swap
        await actionButton.click();
        await expect(modal).not.toBeVisible();
        
        // Phase 1: Select opponent card
        await expect(page1.getByText('Spy & Swap: Select an opponent\'s card to spy on...')).toBeVisible();
        const opponentCard = page1.locator('div.col-start-2.row-start-1 button').first();
        await expect(opponentCard).toBeEnabled();
        await page1.waitForTimeout(500); 
        await opponentCard.click();

        // Phase 2: Select own card
        await expect(page1.getByText('Spy & Swap: Select one of your cards to peek at...')).toBeVisible();
        const myCard = page1.locator('div.col-span-3.row-start-3 button').first();
        await expect(myCard).toBeEnabled();
        await page1.waitForTimeout(500);
        await myCard.click();

        // Phase 3: Decision Modal
        await expect(page1.getByRole('heading', { name: 'Spy & Swap' })).toBeVisible();
        await page1.getByRole('button', { name: /Keep My Card/i }).click();
        
        // Verify turn advanced
        await expect(page1.getByText(/Waiting for Player 2/i)).toBeVisible({ timeout: 10000 });
        actionFound = true;
      } else {
        await page1.getByRole('button', { name: /Discard/i }).click();
      }
    } else {
      await page1.getByRole('button', { name: /Discard/i }).click();
    }

    if (!actionFound) {
      // Pass turn
      await expect(page2.getByText('Your turn')).toBeVisible();
      await page2.getByRole('button', { name: /Draw Card/i }).click();
      await page2.getByRole('button', { name: /Discard/i }).click();
      attempts++;
    }
  }

  if (!actionFound) {
    console.log('Could not find a Black King in 20 attempts.');
  }

  await context1.close();
  await context2.close();
});
