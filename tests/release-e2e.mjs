import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';

execFileSync(process.execPath, ['scripts/build-preview.mjs']);
const base = process.env.GAME_TEST_BASE ?? 'http://127.0.0.1:8765';
const engine = await readFile('dist-preview/invaders-game.html', 'utf8');
// Put an existing answer in firing range. Actual input, hit detection and scoring still run.
const engineFixture = engine.replace('})();</script>', `
window.positionTestTarget = correct => {
  const target = invaders.find(q => (q.pair.id === current.id) === correct);
  target.x = ship.x;
  target.y = .76;
  return target.pair.target;
};
})();</script>`);
assert.notEqual(engineFixture, engine);
const bootstrap = await readFile('dist-preview/bootstrap.mjs', 'utf8');
// Allow HTTP loopback in the intercepted test response only.
const testBootstrap = bootstrap.replace('engineOrigin:location.origin,buildId',
  'engineOrigin:location.origin,buildId,allowLoopback:true');
assert.notEqual(testBootstrap, bootstrap);
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN});
try {
  for (const mobile of [false, true]) {
    const page = await browser.newPage({
      viewport: mobile ? {width:390,height:844} : {width:1280,height:900},
      isMobile:mobile, hasTouch:mobile,
    });
    await page.addInitScript(() => {
      window.testMessages = [];
      window.addEventListener('message', event => {
        if (event.data?.protocol === 'bt-vocabulary-engine/1') window.testMessages.push(event.data);
      });
    });
    await page.route('**/dist-preview/invaders-game.html', route =>
      route.fulfill({contentType:'text/html',body:engineFixture}));
    await page.route('**/dist-preview/bootstrap.mjs', route =>
      route.fulfill({contentType:'text/javascript',body:testBootstrap}));
    page.on('pageerror', error => console.error(error));
    await page.goto(base+'/dist-preview/index.html');
    await page.waitForFunction(() => document.querySelector('#status').textContent === 'Fixture running');
    const frame = page.frames().find(candidate => candidate.url().endsWith('/invaders-game.html'));
    assert.ok(frame);
    assert.match(await frame.locator('#progress').innerText(), /0\/5 WORDS/);
    const fire = async () => {
      if (mobile) await frame.locator('#thumbDeck').tap();
      else await frame.locator('canvas').press('Space');
    };
    await frame.evaluate(() => window.positionTestTarget(false));
    await fire();
    await frame.waitForFunction(() => document.querySelector('#lives').textContent === '❤❤');
    assert.equal(await frame.locator('#score').innerText(), '0');

    await frame.locator('#restart').click();
    const word = await frame.evaluate(() => window.positionTestTarget(true));
    await fire();
    await frame.waitForFunction(() => document.querySelector('#score').textContent === '10');
    await page.waitForFunction(target => window.testMessages.some(
      message => message.type === 'SPEAK' && message.payload.text === target), word);
    assert.ok(['gato','perro','pájaro','caballo','vaca'].includes(word));
    assert.match(await frame.locator('#progress').innerText(), /1\/5 WORDS/);

    await frame.locator('#pause').click();
    assert.equal(await frame.locator('#pause').innerText(), 'RESUME');
    await frame.locator('#pause').click();
    assert.equal(await frame.locator('#pause').innerText(), 'PAUSE');
    await frame.locator('#restart').click();
    assert.equal(await frame.locator('#score').innerText(), '0');
    assert.equal(await frame.locator('#lives').innerText(), '❤❤❤');
    await page.close();
    console.log(`Invaders ${mobile ? 'touch' : 'keyboard'} regression passed`);
  }
} finally {
  await browser.close();
}
