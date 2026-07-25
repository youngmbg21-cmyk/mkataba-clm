// Shared Playwright driver for the HaTi QA run.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const BASE = process.env.HATI_BASE || 'http://localhost:3100';
const SHOT = '/tmp/claude-0/-home-user-mkataba-clm/755f1890-2593-5c40-9fce-6b486bee6495/scratchpad/shots';
require('fs').mkdirSync(SHOT, { recursive: true });

const TW = require('./twshim.js').css();

async function stubCdn(ctx) {
  // The environment blocks CDN egress (403 at the policy proxy), so stand in
  // for the Tailwind Play CDN and Google Fonts. Everything else 404s honestly.
  await ctx.route('https://cdn.tailwindcss.com/**', r => r.fulfill({
    contentType: 'application/javascript',
    body: 'window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=' + JSON.stringify(TW) + ';document.head.appendChild(s);})();'
  }));
  await ctx.route('https://cdn.tailwindcss.com', r => r.fulfill({
    contentType: 'application/javascript',
    body: 'window.tailwind={config:{}};(function(){var s=document.createElement("style");s.textContent=' + JSON.stringify(TW) + ';document.head.appendChild(s);})();'
  }));
  await ctx.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
  await ctx.route('https://fonts.gstatic.com/**', r => r.fulfill({ status: 404, body: '' }));
}

async function launch(opts = {}) {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: opts.viewport || { width: 1440, height: 950 }, acceptDownloads: true });
  if (opts.noStub !== true) await stubCdn(ctx);
  const pg = await ctx.newPage();
  const logs = [];
  pg.on('console', m => logs.push(m.type() + ': ' + m.text()));
  pg.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  pg.on('dialog', async d => { logs.push('DIALOG(' + d.type() + '): ' + d.message()); await d.accept(); });
  pg.logs = logs;
  return { b, ctx, pg };
}
const shot = (pg, n) => pg.screenshot({ path: SHOT + '/' + n + '.png', fullPage: false });
const txt = pg => pg.evaluate(() => document.body.innerText);
async function toastText(pg) {
  return pg.evaluate(() => Array.from(document.querySelectorAll('[class*=toast],#toast,.ui-toast')).map(e => e.innerText).join(' | '));
}
module.exports = { BASE, SHOT, launch, shot, txt, toastText, chromium, stubCdn };
