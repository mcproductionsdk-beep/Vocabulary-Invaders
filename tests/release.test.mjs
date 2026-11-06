import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile, readdir} from 'node:fs/promises';
import test from 'node:test';

test('build publishes the pinned engine and isolated fixture only', async () => {
  execFileSync(process.execPath, ['scripts/build-preview.mjs']);
  assert.deepEqual((await readdir('dist-preview')).sort(),
    ['_headers', 'bootstrap.mjs', 'build-id.mjs', 'index.html', 'invaders-game.html', 'launcher.js', 'session.mjs', 'version.json']);
  assert.deepEqual(await readFile('dist-preview/invaders-game.html'), await readFile('invaders-game.html'));
  assert.match(await readFile('dist-preview/_headers', 'utf8'), /connect-src 'none'/);
});
