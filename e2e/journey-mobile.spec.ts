import { test, expect, BrowserContext, Page } from '@playwright/test';

const ACTION_DELAY = 500; 

async function setupScriptedGame(browser: any, isMobile: boolean = true) {
  const playerCount = 3;
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];

  for (let i = 0; i < playerCount; i++) {
    const context = await browser.newContext({
      viewport: i === 2 && isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 },
      isMobile: i === 2 && isMobile,
      recordVideo: { dir: `test-results/videos/journey/mobile/player${i + 1}` }
    });
    
    const page = await context.newPage();
    await page.addInitScript(() => {
      (window as any).__DETERMINISTIC_DECK__ = true;
    });
    
    contexts.push(context);
    pages.push(page);
  }

  await test.step('Host creates game', async () => {
    await pages[0].goto('/');
    const createBtn = pages[0].getByRole('button', { name: /Create Game/i });
    await expect(createBtn).toBeEnabled();
    await createBtn.click();
    await expect(pages[0].getByText('Game Lobby')).toBeVisible();
  });

  const gameCode = (await pages[0].locator('p.font-mono').innerText()).trim();

  await test.step('Players 2-3 join', async () => {
    for (let i = 1; i < playerCount; i++) {
      await pages[i].goto('/');
      pages[i].on('dialog', d => d.accept(gameCode));
      await pages[i].getByRole('button', { name: /Join Game/i }).click();
      await expect(pages[i].getByText('Game Lobby')).toBeVisible();
      await pages[i].waitForTimeout(200);
    }
  });

  await test.step('All players ready', async () => {
    for (let i = 1; i < playerCount; i++) {
      await pages[i].getByRole('button', { name: /Waiting\.\.\./i }).and(pages[i].locator(':not([disabled])')).click();
    }
  });

  await test.step('Host starts and all peek', async () => {
    await pages[0].getByRole('button', { name: /Start Game/i }).click();
    await Promise.all(pages.map(async (p) => {
      const gotIt = p.getByRole('button', { name: /Got it!/i });
      await expect(gotIt).toBeVisible({ timeout: 15000 });
      await gotIt.click();
    }));
  });

  return { pages, contexts, gameCode };
}

test('User Journey: Scripted 3-player game (Mobile POV P3)', async ({ browser }) => {
  const { pages, contexts, gameCode } = await setupScriptedGame(browser, true);
  const [p1, p2, p3] = pages;

  const getHandCards = (page: Page) => page.locator('div').filter({ hasText: /You/ }).locator('button');
  const getOpponentCards = (page: Page, name: string) => page.locator('div').filter({ hasText: new RegExp(`^${name}$`) }).locator('..').locator('button');

  await test.step('Round 1: Peek, Spy, Blind Swap', async () => {
    // 1.1 P1: Draw 7 (Peek)
    await expect(p1.getByText(/Draw, Take/i)).toBeVisible();
    await p1.getByRole('button', { name: /^Draw$/i }).click();
    await p1.getByRole('button', { name: /Use Action/i }).click();
    await getHandCards(p1).first().click();
    await p1.getByRole('button', { name: /Got it!/i }).click();

    // 1.2 P2: Draw 9 (Spy)
    await expect(p2.getByText(/Draw, Take/i)).toBeVisible();
    await p2.getByRole('button', { name: /^Draw$/i }).click();
    await p2.getByRole('button', { name: /Use Action/i }).click();
    await getOpponentCards(p2, 'Player 1').first().click(); 
    await p2.getByRole('button', { name: /Excellent!/i }).click();

    // 1.3 P3: Draw J (Blind Swap)
    await expect(p3.getByText(/Draw, Take/i)).toBeVisible();
    await p3.getByRole('button', { name: /^Draw$/i }).click();
    await p3.getByRole('button', { name: /Use Action/i }).click();
    await getHandCards(p3).last().click();
    await getOpponentCards(p3, 'Player 1').first().click();
    await p3.waitForTimeout(ACTION_DELAY);
  });

  await test.step('Round 2: Black King, Snap, Red King', async () => {
    // 2.1 P1: Draw K Black (Spy/Swap) -> Spy P2, Peek own, Swap
    await expect(p1.getByText(/Draw, Take/i)).toBeVisible();
    await p1.getByRole('button', { name: /^Draw$/i }).click();
    await p1.getByRole('button', { name: /Use Action/i }).click();
    await getOpponentCards(p1, 'Player 2').first().click();
    await getHandCards(p1).first().click();
    await p1.getByRole('button', { name: /Swap Cards/i }).click();

    // 2.2 P2: Draw 5 -> Swap with Card 2 (Discarding 10)
    await expect(p2.getByText(/Draw, Take/i)).toBeVisible();
    await p2.getByRole('button', { name: /^Draw$/i }).click();
    await p2.getByRole('button', { name: /Swap Card/i }).click();
    await getHandCards(p2).nth(1).click();

    // 2.3 P3: SNAP! (10 was discarded by P2)
    await expect(p3.getByText(/Snap/i)).toBeVisible();
    await getHandCards(p3).nth(1).click(); // Card 2 is 10
    await p3.waitForTimeout(ACTION_DELAY);
  });

  await test.step('Round 3: Finale', async () => {
    // 3.1 P1: Call Cambodia
    await expect(p1.getByText(/Draw, Take/i)).toBeVisible();
    await p1.getByRole('button', { name: /Cambodia/i }).click();

    // 3.2 P2: Last Turn
    await expect(p2.getByText(/FINAL/i)).toBeVisible();
    await p2.getByRole('button', { name: /^Draw$/i }).click();
    await p2.getByRole('button', { name: /Discard/i }).click();

    // 3.3 P3: Last Turn
    await expect(p3.getByText(/FINAL/i)).toBeVisible();
    await p3.getByRole('button', { name: /^Draw$/i }).click();
    await p3.getByRole('button', { name: /Discard/i }).click();
  });

  await test.step('Verify Results', async () => {
    const endUrlPattern = new RegExp(`end\\?gameId=${gameCode}`, 'i');
    await expect(p3).toHaveURL(endUrlPattern, { timeout: 20000 });
    await expect(p3.getByText('ROUND ENDED')).toBeVisible();
    await expect(p3.locator('table')).toBeVisible();
  });

  await Promise.all(contexts.map(c => c.close()));
});
