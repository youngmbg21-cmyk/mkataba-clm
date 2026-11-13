/* f1034 — A PULL REQUEST THAT ONLY CHANGES NOTES RUNS NOTHING (owner, 13 Nov 2026: "Why does send something to bug
   log need to go through GitHub check?" … "do option 2"). The bug log and the notes straight in docs/ are skipped;
   CLAUDE.md and docs/design/ (both read by tests) are not; the night's run and Run workflow are untouched.
   Red at the parent: no paths-ignore. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const yml = fs.readFileSync(path.join(__dirname, '..', '.github', 'workflows', 'tests.yml'), 'utf8').replace(/^\s*#.*$/mg, '');
const on = yml.slice(yml.indexOf('\non:'), yml.indexOf('\nconcurrency:'));

test('a pull request skips only the notes nobody reads', () => {
  const ig = (on.match(/\n {2}pull_request:\n {4}paths-ignore:\n((?: {6}- '[^']+'\n)+)/) || [])[1] || '';
  const list = [...ig.matchAll(/'([^']+)'/g)].map(m => m[1]);
  assert.deepStrictEqual(list, ['BUGLOG.md', 'docs/*.md']);
});

test('what a test reads is never skipped', () => {
  assert.ok(!/CLAUDE\.md|docs\/\*\*|docs\/design/.test(on), 'CLAUDE.md and docs/design/ still run the checks');
  assert.ok(fs.readFileSync(path.join(__dirname, 'f256-signing-on-the-paper.test.js'), 'utf8').includes("read('CLAUDE.md')"), 'a test reads CLAUDE.md');
});

test('the night and the hand are untouched', () => {
  assert.match(on, /\n {2}schedule:\n {4}- cron: '\d+ \d+ \* \* \*'/);
  assert.match(on, /\n {2}workflow_dispatch:/);
});
