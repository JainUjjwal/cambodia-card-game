import { test, expect } from '@playwright/test';

async function runScaleTest(browser: any, isMobile: boolean) {
  const playerCount = 6;
  const contexts = await Promise.all(
    Array.from({ length: playerCount }).map((_, i) => 
      browser.newContext({ 
        viewport: isMobile ? { width: 375, height: 667 } : { width: 1280, height: 800 },
        isMobile: isMobile,
        recordVideo: { dir: `test-results/videos/scale/${isMobile ? 'mobile' : 'desktop'}/player${i + 1}` } 
      })
    )
  );
  
  const pages = await Promise.all(contexts.map(context => context.newPage()));
  
  // Host
  await pages[0].goto('/');
  await expect(pages[0].getByRole('button', { name: /Create Game/i })).toBeEnabled();
  await pages[0].getByRole('button', { name: /Create Game/i }).click();
  const gameCode = (await pages[0].locator('p.font-mono').innerText()).trim();

  // Joiners
  for (let i = 1; i < playerCount; i++) {
    await pages[i].goto('/');
    pages[i].on('dialog', d => d.accept(gameCode));
    await pages[i].getByRole('button', { name: /Join Game/i }).click();
    await expect(pages[i].getByText('Game Lobby')).toBeVisible();
  }

  // All Ready
  for (let i = 1; i < playerCount; i++) {
    await pages[i].getByRole('button', { name: /Waiting\.\.\./i }).and(pages[i].locator(':not([disabled])')).click();
  }

  // Verify sync on host
  await expect(pages[0].locator('button', { hasText: 'Ready' })).toHaveCount(6, { timeout: 20000 });

  await Promise.all(contexts.map(c => c.close()));
}

test('scale: 6-player lobby join and ready (Desktop)', async ({ browser }) => {
  await runScaleTest(browser, false);
});

test('scale: 6-player lobby join and ready (Mobile)', async ({ browser }) => {
  await runScaleTest(browser, true);
});
