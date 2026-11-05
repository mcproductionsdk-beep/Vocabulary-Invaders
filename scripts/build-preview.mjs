import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const out = new URL('dist-preview/', root);
const engine = await readFile(new URL('invaders-game.html', root));
const blob = createHash('sha1').update(`blob ${engine.length}\0`).update(engine).digest('hex');
if (blob !== '63b0c2724c9f7df52fc976261e28c0c52bd0ddca') throw new Error('Pinned Invaders engine mismatch');
await rm(out, {recursive:true, force:true});
await mkdir(out);
for (const file of ['index.html', 'launcher.js', 'invaders-game.html']) {
  await copyFile(new URL(file, root), new URL(file, out));
}
await writeFile(new URL('_headers', out), `/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
`);
await writeFile(new URL('version.json', out), JSON.stringify({
  environment:'staging',
  sourceCommit:process.env.CF_PAGES_COMMIT_SHA ?? 'local',
  baselineCommit:'44a42014a09c6a5497528f626625a5cd0689ed4f',
  engineBlob:blob,
}, null, 2) + '\n');
