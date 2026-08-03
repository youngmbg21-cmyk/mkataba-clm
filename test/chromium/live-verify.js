/* Chromium verification against the REAL server and the REAL index.html.
   ============================================================
   THIS FILE EXISTS BECAUSE THE OTHER HARNESS PASSED WHILE PRODUCTION WAS BROKEN.

   parity.html copies index.html's styles into a stage and then mounts the
   owner's screen first. Production does neither: it serves index.html itself,
   and on a share link the counterparty's page is the FIRST thing that renders.
   Stylesheets are injected as screens mount, so the two orders differ — and a
   CSS rule that ties on specificity is settled by exactly that order.

   The counterparty's reading buttons tied with .ui-btn at one class each. In
   the harness the portal's sheet landed last and won; in production it landed
   first and lost, so the buttons rendered surface-white with --color-text on
   them. Three rounds of "still white" against a fix that was live, because
   every check I had was answering a different question from the one the
   browser asks.

   So this boots the actual server, creates an actual share through the actual
   API, opens the actual URL, and reads getComputedStyle. No stage, no copied
   markup, no stubbed globals. Anything asserted here is asserted about the
   thing that ships.

   Run: node test/chromium/live-verify.js */
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The tinted reading verb: --color-accent-100 on --color-accent, accent-800
   text. Written as the computed values a browser reports, because that is the
   only form of this claim that cannot be satisfied by a rule that loses. */
const TINT = 'rgb(204, 251, 241)';
const INK = 'rgb(17, 94, 89)';
const SURFACE_WHITE = 'rgb(255, 255, 255)';

function contract(){
  return { id: 'MK-LIVE', name: 'Mutual Non-Disclosure Agreement — Juno Limited',
    counterparty: 'Juno Limited', template: 'WH', status: 'Under Review', folder: 'proc',
    format: 'text', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [],
    redlineText: '1. Purpose\n\nThe Parties wish to explore a relationship.\n\n3. Term\n\nTwo (2) years.',
    changes: [{ id: 'CHG-001', clauseId: 'cl-1', clauseLabel: 'Clause 1 · Purpose',
      changeType: 'modify', status: 'pending', summary: 'Purpose narrowed',
      oldText: 'The Parties wish to explore a relationship.',
      newText: 'The Parties may explore a relationship.',
      ops: [{ op: 'del', text: 'wish to' }, { op: 'ins', text: 'may' }],
      author: 'Young Mbagaya', authorSide: 'owner', createdAt: new Date().toISOString() }] };
}

const READ = () => {
  const out = {};
  for (const id of ['pt-hist', 'pt-compare']){
    const el = document.getElementById(id);
    if (!el){ out[id] = null; continue; }
    const cs = getComputedStyle(el);
    out[id] = { bg: cs.backgroundColor, color: cs.color, icon: !!el.querySelector('svg') };
  }
  return out;
};

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const c = contract();
  await W.admin.json('/api/contracts/MK-LIVE', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const mk = async purpose => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', purpose, org: 'Young', sharedBy: 'Young Mbagaya', contract: c },
      recipient: { name: 'Juno Limited', email: 'juno@example.co.ke' }, channel: 'link', purpose } });
    return r.token || (r.link || '').split('share=')[1];
  };

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const purpose of ['negotiate', 'sign']){
    const token = await mk(purpose);
    /* A fresh context each time: no storage, no cache carried between runs —
       the state a counterparty opening a link for the first time is in. */
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${purpose}: ${e.message}`));
    await page.goto(`${h.base}/#share=t:${token}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(900);

    const m = await page.evaluate(READ);
    const seen = m['pt-hist'] || m['pt-compare'];
    check(`${purpose}: the reading buttons are on the page`, !!seen,
      seen ? '' : 'neither #pt-hist nor #pt-compare rendered');
    if (seen){
      for (const [id, v] of Object.entries(m)){
        if (!v) continue;
        check(`${purpose}: #${id} is tinted, not surface-white`,
          v.bg === TINT, `${v.bg}${v.bg === SURFACE_WHITE ? ' — this is the bug' : ''}`);
        check(`${purpose}: #${id} carries the accent ink`, v.color === INK, v.color);
        check(`${purpose}: #${id} has a shape to aim at`, v.icon, v.icon ? 'svg' : 'no icon');
      }
    }
    await ctx.close();
  }

  await browser.close();
  await h.stop();
  errors.slice(0, 5).forEach(e => check('no page error', false, e));

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
