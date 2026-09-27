/* Playwright settings for HaTi's END-TO-END tests: whole journeys through the
   REAL app (index.html served by server/server.js), in a real Chrome, pressing
   the same buttons a person presses.

     Run them:          npm run test:e2e
     One journey:       npm run test:e2e -- -g "sign up"
     List them:         npx playwright test --list
     See the results:   npx playwright show-report
     Watch them run:    npm run test:e2e -- --headed

   WHAT A RUN PRINTS IS PLAIN ENGLISH (test/e2e/plain-english-reporter.js),
   saved again to test-results/flow-check.md: this is the "process flow check"
   the owner asks Claude for (.claude/skills/flow-check). Playwright's own
   listing is one flag away: npm run test:e2e -- --reporter=list

   These are not the browser checks in test/chromium — those are the project's
   own scripts, one screen each, run by test/chromium/run-all.js. The tests here
   live in test/e2e and are run by Playwright's own test runner.

   THERE IS NO SHARED SERVER TO START HERE ON PURPOSE. Each test starts its own
   brand-new, empty HaTi server (with test/helpers.js, like the rest of the
   suite), so a run can never trip over data a previous run left behind — a
   sign-up screen only appears on a workspace that does not exist yet. */
const fs = require('node:fs');
const { defineConfig } = require('@playwright/test');

/* WHICH CHROME. The cloud workspace this was written in has Chrome installed
   at a fixed place — the same one the scripts in test/chromium use. Anywhere
   else Playwright uses its own copy, which `npx playwright install chromium`
   downloads once. */
const CHROME = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

module.exports = defineConfig({
  testDir: './test/e2e',
  /* A whole journey — a server booting, a sign-up, a contract drafted and
     sent — takes a while; two minutes is room to spare, not a target. */
  timeout: 120_000,
  expect: { timeout: 15_000 },
  /* No automatic retries: a journey that fails once has found something. */
  retries: 0,
  reporter: [['./test/e2e/plain-english-reporter.js'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    /* When a test fails, keep a step-by-step recording and a screenshot, so
       the failure can be SEEN in the report rather than guessed at. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    /* A button that never appears fails in fifteen seconds with "it never
       appeared", not after the whole two minutes. */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    launchOptions: CHROME ? { executablePath: CHROME } : {},
  },
});
