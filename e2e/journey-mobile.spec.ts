import { test, expect, BrowserContext, Page } from '@playwright/test';

const ACTION_DELAY = 1000; 

async function setupScriptedGame(browser: any, isMobile: boolean = true) {
  const playerCount = 6;
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];

  for (let i = 0; i < playerCount; i++) {
    const context = await browser.newContext({
      viewport: i === 5 && isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 },
      isMobile: i === 5 && isMobile,
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

  await test.step('Players 2-6 join', async () => {
    for (let i = 1; i < playerCount; i++) {
      await pages[i].goto('/');
      pages[i].on('dialog', d => d.accept(gameCode));
      await pages[i].getByRole('button', { name: /Join Game/i }).click();
      await expect(pages[i].getByText('Game Lobby')).toBeVisible();
      await pages[i].waitForTimeout(500);
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
      await p.getByRole('button', { name: /Got it!/i }).click();
    }));
  });

  return { pages, contexts, gameCode };
}

test('User Journey: Full scripted 6-player game (Mobile POV P6)', async ({ browser }) => {
  const { pages, contexts, gameCode } = await setupScriptedGame(browser, true);
  const [p1, p2, p3, p4, p5, p6] = pages;

  await test.step('Round 1: Initial Actions', async () => {
    // P1: Peek
    await p1.getByRole('button', { name: /Draw/i }).click();
    await p1.getByRole('button', { name: /Use Action/i }).click();
    await p1.locator('div.col-span-3.row-start-3 button').first().click();
    await p1.getByRole('button', { name: /Got it!/i }).click();
    await p1.waitForTimeout(ACTION_DELAY);

    // P2: Spy
    await p2.getByRole('button', { name: /Draw/i }).click();
    await p2.getByRole('button', { name: /Use Action/i }).click();
    await p2.locator('div.col-start-2.row-start-1 button').first().click(); 
    await p2.getByRole('button', { name: /Excellent!/i }).click();
    await p2.waitForTimeout(ACTION_DELAY);

    // P3: Blind Swap
    await p3.getByRole('button', { name: /Draw/i }).click();
    await p3.getByRole('button', { name: /Use Action/i }).click();
    await p3.locator('div.col-span-3.row-start-3 button').last().click();
    await p3.locator('div.col-start-3.row-start-1 button').last().click();
    await p3.waitForTimeout(ACTION_DELAY);

    // P4: Black King
    await p4.getByRole('button', { name: /Draw/i }).click();
    await p4.getByRole('button', { name: /Use Action/i }).click();
    await p4.locator('div.col-start-3.row-start-1 button').first().click();
    await p4.locator('div.col-span-3.row-start-3 button').first().click();
    await p4.getByRole('button', { name: /Swap Cards/i }).click();
    await p4.waitForTimeout(ACTION_DELAY);

    // P5: Swap (Discard 10)
    await p5.getByRole('button', { name: /Draw/i }).click();
    await p5.getByRole('button', { name: /Swap Card/i }).click();
    await p5.locator('div.col-span-3.row-start-3 button').nth(1).click();
    await p5.waitForTimeout(ACTION_DELAY);

    // P6: SNAP
    await expect(p6.getByText(/Snap/i)).toBeVisible();
    await p6.locator('div.col-span-3.row-start-3 button').nth(1).click();
    await p6.waitForTimeout(ACTION_DELAY);
  });

  await test.step('Round 2: Acquisition', async () => {
    // P1: Discard
    await p1.getByRole('button', { name: /Draw/i }).click();
    await p1.getByRole('button', { name: /Discard/i }).click();
    
    // P2: Take from Discard
    await p2.getByRole('button', { name: /Take/i }).click();
    await p2.locator('div.col-span-3.row-start-3 button').first().click();

    // P3: Peek
    await p3.getByRole('button', { name: /Draw/i }).click();
    await p3.getByRole('button', { name: /Use Action/i }).click();
    await p3.locator('div.col-span-3.row-start-3 button').nth(1).click();
    await p3.getByRole('button', { name: /Got it!/i }).click();

    // P4: Spy P6
    await p4.getByRole('button', { name: /Draw/i }).click();
    await p4.getByRole('button', { name: /Use Action/i }).click();
    await p4.locator('div.col-start-3.row-start-2 button').first().click();
    await p4.getByRole('button', { name: /Excellent!/i }).click();

    // P5: Swap
    await p5.getByRole('button', { name: /Draw/i }).click();
    await p5.getByRole('button', { name: /Swap Card/i }).click();
    await p5.locator('div.col-span-3.row-start-3 button').first().click();

    // P6: Red King
    await p6.getByRole('button', { name: /Draw/i }).click();
    await p6.getByRole('button', { name: /Swap Card/i }).click();
    await p6.locator('div.col-span-3.row-start-3 button').last().click();
  });

  await test.step('Round 3: Finale', async () => {
    await p1.getByRole('button', { name: /Cambodia/i }).click();
    for (const p of [p2, p3, p4, p5, p6]) {
      await expect(p.getByText(/FINAL/i)).toBeVisible();
      await p.getByRole('button', { name: /Draw/i }).click();
      await p.getByRole('button', { name: /Discard/i }).click();
    }
  });

  await test.step('Verify Results and Restart', async () => {
    await expect(p6).toHaveURL(new RegExp(`end\?gameId=${gameCode}`, 'i'), { timeout: 20000 });
    await p1.getByRole('button', { name: /Next Round/i }).click();
    await expect(p6).toHaveURL(new RegExp(`game/${gameCode}`, 'i'), { timeout: 15000 });
  });

  await Promise.all(contexts.map(c => c.close()));
});
