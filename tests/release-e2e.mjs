import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';

const base = process.env.GAME_TEST_BASE ?? 'http://127.0.0.1:8765';
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN});
try {
  for (const [width, height] of [[1280, 800], [390, 844]]) {
    const page = await browser.newPage({viewport:{width,height}, hasTouch:width < 760});
    const external = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (new URL(request.url()).origin !== new URL(base).origin) external.push(request.url());
    });
    await page.goto(base + '/dist-preview/index.html');
    const engine = page.frameLocator('#engine');
    await engine.getByText('ROUND 1 · 0/5 WORDS').waitFor();
    assert.equal(await engine.locator('#thumbDeck').isVisible(), width < 760);
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser.close();
}
