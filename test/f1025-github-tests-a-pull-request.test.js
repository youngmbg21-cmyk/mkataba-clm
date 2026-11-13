/* f1025 — GITHUB TESTS A PULL REQUEST, AND MAIN EVERY NIGHT — NEVER A BARE PUSH (owner, 13 Nov 2026).
   The repository goes private, where every minute of a check is billed: one run is about 110 billed minutes and
   it ran on every push, about 43 times a day. The whole set now runs when a pull request is open (and on each
   push to it), once a night on main, and by hand; a bare push and a merge onto main start nothing. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* the settings only: every comment line dropped, so a sentence ABOUT push is never read as the setting */
const yml = R('.github/workflows/tests.yml').split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
const on = yml.slice(yml.indexOf('\non:'), yml.indexOf('\nconcurrency:'));

test('the three ways in: a pull request, the clock, a hand', () => {
  assert.match(on, /\n {2}pull_request:/);
  assert.match(on, /\n {2}schedule:\n {4}- cron: '\d+ \d+ \* \* \*'/, 'once a day, every day');
  assert.match(on, /\n {2}workflow_dispatch:/);
});

test('a bare push starts nothing, on a branch or on main', () => {
  assert.doesNotMatch(on, /\n {2}push:/);
  assert.doesNotMatch(on, /pull_request_target/, 'never the kind that runs with the repository\'s secrets');
});

test('a newer push cancels the older check of the same pull request', () => {
  const c = yml.slice(yml.indexOf('\nconcurrency:'), yml.indexOf('\njobs:'));
  assert.match(c, /group: tests-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/);
  assert.match(c, /cancel-in-progress: true/);
});

test('it is still the whole set: the proofreader, the node suite, six browser machines', () => {
  assert.match(yml, /npm run lint/); assert.match(yml, /npm test/);
  assert.match(yml, /shard: \[1, 2, 3, 4, 5, 6\]/);
});

test('the session greeting says the same', () => {
  assert.match(R('.claude/hooks/session-start.sh'), /once the pull request is open, and on main every night/);
});
