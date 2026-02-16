import { test, expect, BrowserContext, Page } from '@playwright/test';

// Configuration for delays to make video review easier
const ACTION_DELAY = 1000; 

async function setupScriptedGame(browser: any, isMobile: boolean = false) {
  const playerCount = 6;
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [];

  for (let i = 0; i < playerCount; i++) {
    const context = await browser.newContext({
      viewport: i === 5 && isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 },
      isMobile: i === 5 && isMobile,
      recordVideo: { dir: `test-results/videos/journey/${isMobile ? 'mobile' : 'desktop'}/player${i + 1}` }
    });
    
    const page = await context.newPage();
    // Inject the deterministic deck flag
    await page.addInitScript(() => {
      (window as any).__DETERMINISTIC_DECK__ = true;
    });
    
    contexts.push(context);
    pages.push(page);
  }

  // P1 (Host) creates game
  await pages[0].goto('/');
  const createBtn = pages[0].getByRole('button', { name: /Create Game/i });
  await expect(createBtn).toBeEnabled();
  await createBtn.click();
  const gameCode = (await pages[0].locator('p.font-mono').innerText()).trim();

  // Players 2-6 join
  for (let i = 1; i < playerCount; i++) {
    await pages[i].goto('/');
    pages[i].on('dialog', d => d.accept(gameCode));
    const joinBtn = pages[i].getByRole('button', { name: /Join Game/i });
    await joinBtn.click();
    await expect(pages[i].getByText('Game Lobby')).toBeVisible();
    await pages[i].waitForTimeout(500); // Slow down for Firestore
  }

  // All Ready
  for (let i = 1; i < playerCount; i++) {
    const readyBtn = pages[i].getByRole('button', { name: /Waiting\.\.\./i }).and(pages[i].locator(':not([disabled])'));
    await readyBtn.click();
  }

  // Host Starts
  await expect(pages[0].getByRole('button', { name: /Start Game/i })).toBeEnabled();
  await pages[0].getByRole('button', { name: /Start Game/i }).click();

  // Initial Peek for all
  await Promise.all(pages.map(async (p) => {
    const btn = p.getByRole('button', { name: /Got it!/i });
    await expect(btn).toBeVisible({ timeout: 15000 });
    await btn.click();
  }));

  return { pages, contexts, gameCode };
}

async function runJourney(pages: Page[], contexts: BrowserContext[], gameCode: string) {
  const [p1, p2, p3, p4, p5, p6] = pages;

  // --- ROUND 1 ---
  
  // 1.1 P1: Draw 7 (Peek) -> Peek own Card 1
  await expect(p1.getByText('Your turn')).toBeVisible();
  await p1.getByRole('button', { name: /Draw Card/i }).click();
  await p1.getByRole('button', { name: /Use Action/i }).click();
  await p1.locator('div.col-span-3.row-start-3 button').nth(0).click();
  await p1.getByRole('button', { name: /Got it!/i }).click();
  await p1.waitForTimeout(ACTION_DELAY);

  // 1.2 P2: Draw 9 (Spy) -> Spy P1's Card 1
  await expect(p2.getByText('Your turn')).toBeVisible();
  await p2.getByRole('button', { name: /Draw Card/i }).click();
  await p2.getByRole('button', { name: /Use Action/i }).click();
  await p2.locator('div.col-start-2.row-start-1 button').first().click(); // P1 is the first opponent for P2 usually
  await p2.getByRole('button', { name: /Excellent!/i }).click();
  await p2.waitForTimeout(ACTION_DELAY);

  // 1.3 P3: Draw J (Blind Swap) -> P3 Card 4 with P4 Card 4
  await expect(p3.getByText('Your turn')).toBeVisible();
  await p3.getByRole('button', { name: /Draw Card/i }).click();
  await p3.getByRole('button', { name: /Use Action/i }).click();
  await p3.locator('div.col-span-3.row-start-3 button').nth(3).click(); // My Card 4
  await p3.locator('div.col-start-3.row-start-1 button').nth(3).click(); // Opponent Card 4 (P4)
  await p3.waitForTimeout(ACTION_DELAY);

  // 1.4 P4: Draw K Black (Spy/Swap) -> Spy P5, Peek own, Swap
  await expect(p4.getByText('Your turn')).toBeVisible();
  await p4.getByRole('button', { name: /Draw Card/i }).click();
  await p4.getByRole('button', { name: /Use Action/i }).click();
  await p4.locator('div.col-start-3.row-start-1 button').first().click(); // Spy Opponent (P5)
  await p4.locator('div.col-span-3.row-start-3 button').first().click(); // Peek Own
  await p4.getByRole('button', { name: /Swap Cards/i }).click();
  await p4.waitForTimeout(ACTION_DELAY);

  // 1.5 P5: Draw 5 -> Swap with own Card 2 (Discarding 10)
  await expect(p5.getByText('Your turn')).toBeVisible();
  await p5.getByRole('button', { name: /Draw Card/i }).click();
  await p5.getByRole('button', { name: /Swap Card/i }).click();
  await p5.locator('div.col-span-3.row-start-3 button').nth(1).click(); // My Card 2
  await p5.waitForTimeout(ACTION_DELAY);

  // 1.6 P6: SNAP! (10 was discarded)
  await expect(p6.getByText(/Snap/i)).toBeVisible();
  const my10 = p6.locator('div.col-span-3.row-start-3 button').nth(1); // My Card 2 is 10
  await my10.click();
  await p6.waitForTimeout(ACTION_DELAY);

  // --- ROUND 2 ---

  // 2.1 P1: Draw 2 -> Discard
  await expect(p1.getByText('Your turn')).toBeVisible();
  await p1.getByRole('button', { name: /Draw Card/i }).click();
  await p1.getByRole('button', { name: /Discard/i }).click();
  await p1.waitForTimeout(ACTION_DELAY);

  // 2.2 P2: Take 2 from Discard -> Swap
  await expect(p2.getByText('Your turn')).toBeVisible();
  await p2.getByRole('button', { name: /Take/i }).click();
  await p2.locator('div.col-span-3.row-start-3 button').first().click();
  await p2.waitForTimeout(ACTION_DELAY);

  // 2.3 P3: Draw 8 (Peek)
  await expect(p3.getByText('Your turn')).toBeVisible();
  await p3.getByRole('button', { name: /Draw Card/i }).click();
  await p3.getByRole('button', { name: /Use Action/i }).click();
  await p3.locator('div.col-span-3.row-start-3 button').nth(1).click();
  await p3.getByRole('button', { name: /Got it!/i }).click();
  await p3.waitForTimeout(ACTION_DELAY);

  // 2.4 P4: Draw 10 (Spy)
  await expect(p4.getByText('Your turn')).toBeVisible();
  await p4.getByRole('button', { name: /Draw Card/i }).click();
  await p4.getByRole('button', { name: /Use Action/i }).click();
  await p4.locator('div.col-start-3.row-start-2 button').first().click(); // Spy P6
  await p4.getByRole('button', { name: /Excellent!/i }).click();
  await p4.waitForTimeout(ACTION_DELAY);

  // 2.5 P5: Draw A -> Swap
  await expect(p5.getByText('Your turn')).toBeVisible();
  await p5.getByRole('button', { name: /Draw Card/i }).click();
  await p5.getByRole('button', { name: /Swap Card/i }).click();
  await p5.locator('div.col-span-3.row-start-3 button').first().click();
  await p5.waitForTimeout(ACTION_DELAY);

  // 2.6 P6: Draw K Red (0 pts) -> Swap with 7
  await expect(p6.getByText('Your turn')).toBeVisible();
  await p6.getByRole('button', { name: /Draw Card/i }).click();
  await p6.getByRole('button', { name: /Swap Card/i }).click();
  await p6.locator('div.col-span-3.row-start-3 button').last().click(); // Swap with Card 4 (last)
  await p6.waitForTimeout(ACTION_DELAY);

  // --- ROUND 3: THE FINALE ---

  // 3.1 P1: CALL CAMBODIA
  await expect(p1.getByText('Your turn')).toBeVisible();
  await p1.getByRole('button', { name: /Call Cambodia/i }).click();
  await p1.waitForTimeout(ACTION_DELAY);

  // 3.2 - 3.5: Others take final turns
  for (const p of [p2, p3, p4, p5]) {
    await expect(p.getByText(/FINAL TURN/i)).toBeVisible();
    await p.getByRole('button', { name: /Draw Card/i }).click();
    // Some swap, some discard to vary it
    if (p === p2) await p.getByRole('button', { name: /Swap Card/i }).click();
    else await p.getByRole('button', { name: /Discard/i }).click();
    
    if (p === p2) await p.locator('div.col-span-3.row-start-3 button').last().click();
    await p.waitForTimeout(ACTION_DELAY);
  }

  // 3.6 P6: Final move
  await expect(p6.getByText(/FINAL TURN/i)).toBeVisible();
  await p6.getByRole('button', { name: /Draw Card/i }).click();
  await p6.getByRole('button', { name: /Discard/i }).click();
  await p6.waitForTimeout(ACTION_DELAY);

  // Verify Results
  const endUrlPattern = new RegExp(`end\\?gameId=${gameCode}`, 'i');
  await expect(p6).toHaveURL(endUrlPattern, { timeout: 20000 });
  await expect(p6.getByText('ROUND ENDED')).toBeVisible();
  
  // Verify Player 6 is leading (likely has lowest score with Joker and Red King)
  // We'll just verify the table exists
  await expect(p6.locator('table')).toBeVisible();

  // Host restarts for next round
  await p1.getByRole('button', { name: /Next Round/i }).click();
  await expect(p6).toHaveURL(new RegExp(`game/${gameCode}`, 'i'), { timeout: 15000 });

  // Cleanup
  await Promise.all(contexts.map(c => c.close()));
}

test('User Journey: Full scripted 6-player game (Desktop POV P6)', async ({ browser }) => {
  const { pages, contexts, gameCode } = await setupScriptedGame(browser, false);
  await runJourney(pages, contexts, gameCode);
});

test('User Journey: Full scripted 6-player game (Mobile POV P6)', async ({ browser }) => {
  const { pages, contexts, gameCode } = await setupScriptedGame(browser, true);
  await runJourney(pages, contexts, gameCode);
});
