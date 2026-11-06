import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, rm, writeFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const out = new URL('dist-preview/', root);
const engine = await readFile(new URL('invaders-game.html', root));
const blob = createHash('sha1').update(`blob ${engine.length}\0`).update(engine).digest('hex');
if (blob !== 'c260936729f0fb1d46f7432778cef034ac5c8e0a') throw new Error('Invaders preview engine mismatch');
await rm(out, {recursive:true, force:true});
await mkdir(out);
for (const file of ['index.html', 'launcher.js', 'invaders-game.html', 'bootstrap.mjs', 'session.mjs']) {
  await copyFile(new URL(file, root), new URL(file, out));
}
const buildId = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA ?? '0'.repeat(40);
await writeFile(new URL('build-id.mjs', out), 'export const buildId = ' + JSON.stringify(buildId) + ';\n');
await writeFile(new URL('_headers', out), `/*
  Content-Security-Policy: default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; frame-src 'self'; frame-ancestors 'self' https://bt-vocabulary-platform-staging.pages.dev https://*.bt-vocabulary-platform-staging.pages.dev; connect-src 'none'; base-uri 'none'; form-action 'none'
  X-Content-Type-Options: nosniff
`);
await writeFile(new URL('version.json', out), JSON.stringify({
  environment:'staging',
  sourceCommit:buildId,
  baselineCommit:'44a42014a09c6a5497528f626625a5cd0689ed4f',
  engineBlob:blob,
}, null, 2) + '\n');
