/* WHERE THE DEAL STANDS — the owner's own tab, measured in a real browser.
 *
 * Idea 15, picked by Young on 3 Oct 2026 and built on the 4th. This stage
 * drives the half that lives inside HaTi: the sixth tab in the contract room.
 *
 * WHAT IT DRIVES, where the user looks:
 *   1. the Overview is STILL the landing, and Where we are sits second;
 *   2. the sheet draws the deal: parties with their roles, the journey with
 *      the right step lit, the round, and how many points are settled;
 *   3. whose move is said as a PARTY NAME, never as "you" or "them" — the
 *      page has no seat, and a seat word is the one thing that cannot mean
 *      the same to everybody reading it;
 *   4. an open point is named by its CLAUSE, with the party that holds it;
 *   5. THE SUBTRACTION, which is the whole idea: the page carries no person's
 *      name, no reviewer, no note, and nothing from the internal review —
 *      seeded here on purpose so the check can fail if any of it leaks;
 *   6. it spends nothing: drawing it calls no generative route at all;
 *   7. and reading it starts no negotiation on a contract that never had one.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'deal-stands');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();

/* THE SECRETS ARE SEEDED ON PURPOSE. Each of these is a real wall somewhere
   else in the product, and a careless line on a page read by every party
   would walk through it. The stage looks for every one of them in what is
   drawn, so a leak fails here rather than in front of a counterparty. */
const SECRET = {
  reviewer: 'Priya Internal Reviewer',
  noteWord: 'Zanzibarium',          /* a word that appears in no other place */
  colleague: 'Tomas Backroom',
};
const DEAL = {
  id: 'MK-D1', contractNo: 'MK-D1', name: 'Master Services Agreement',
  counterparty: 'Nordbygg AB', counterpartyEmail: 'deals@nordbygg.example',
  folder: 'proc', value: 2400000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-10-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 2400000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-9), user: 'System', action: 'Created', detail: 'fixture' }],
  /* Two settled points and one open one, the open one ours so the move is
     theirs — which is the case the party-name wording has to get right. */
  changes: [
    { id: 'CHG-1', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4',
      clauseLabel: '4. Payment Terms', kind: 'edit', changeType: 'edit', author: SECRET.colleague,
      resolvedBy: SECRET.colleague, createdAt: iso(-8), resolvedAt: iso(-7), seq: 1 },
    { id: 'CHG-2', status: 'accepted', authorSide: 'owner', clauseId: 'c6',
      clauseLabel: '6. Confidentiality', kind: 'edit', changeType: 'edit', author: SECRET.colleague,
      resolvedBy: 'Nordbygg', createdAt: iso(-6), resolvedAt: iso(-5), seq: 2 },
    { id: 'CHG-3', status: 'pending', authorSide: 'owner', clauseId: 'c9',
      clauseLabel: '9. Liability Cap', kind: 'edit', changeType: 'edit', author: SECRET.colleague,
      createdAt: iso(-3), seq: 3 },
  ],
  negotiation: { round: 2, rounds: [{ n: 1, at: iso(-4), changes: [] }] },
  /* AN INTERNAL REVIEW AND A NOTE, both walled elsewhere and both seeded so
     this stage can prove they stay walled here. */
  review: { by: SECRET.reviewer, at: iso(-2), open: ['CHG-3'], due: null },
  thread: [{ id: 'm1', at: iso(-2), who: SECRET.reviewer, visibility: 'internal',
    text: 'Hold this until ' + SECRET.noteWord + ' confirms the cap.' }],
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 9000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    const ai = [];
    await page.route('**/api/ai/**', r => {
      const u = r.request().url();
      if (!/\/api\/ai\/(usage|config|spend)\b/.test(u)) ai.push(u);
      return r.continue();
    });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);

    /* ===== 1. THE LANDING IS STILL THE OVERVIEW ===== */
    await page.evaluate(() => openWorkspace('MK-D1'));
    const opened = await until(page, () => state.view === 'workspace' && !!document.getElementById('ws-tabs'));
    ok('0 the contract opens', opened);
    const tabs = await page.evaluate(() => ({
      keys: [...document.querySelectorAll('#ws-tabs [data-ws-tab]')].map(b => b.getAttribute('data-ws-tab')),
      words: [...document.querySelectorAll('#ws-tabs [data-ws-tab]')].map(b => b.textContent.trim()),
      on: typeof roomCurrentTab === 'function' ? roomCurrentTab() : null }));
    /* THE LANDING IS UNTOUCHED, which is the whole reason the new tab went in
       SECOND. roomOpenOnTerms sends a NEW DRAFT to the Overview; an existing
       contract opens on the Document tab, as it always has. What a tab added
       second must never do is change either of those. */
    ok('1a an existing contract still opens on the Document tab, as before', tabs.on === 'docs', tabs.on);
    const landing = await page.evaluate(() => ({ first: (window.ROOM_TABS || [[]])[0][0],
      onTerms: typeof roomOpenOnTerms === 'function' }));
    ok('1a2 and the Overview still leads the row, which is where a new draft lands',
      landing.first === 'terms', JSON.stringify(landing));
    /* RE-POINTED 7 Oct 2026: Overview 2 (owner-instructed, work order O-36)
       sat right after the Overview; it went on 9 Oct 2026 (owner-asked). */
    ok('1b Where we are sits right after the Overview',
      tabs.keys[0] === 'terms' && tabs.keys[1] === 'stands' && !tabs.keys.includes('ov2'), tabs.keys.join(','));

    /* ===== 2-5. THE SHEET ===== */
    await page.click('#ws-tabs [data-ws-tab="stands"]').catch(() => {});
    const drew = await until(page, () => !!document.querySelector('[data-ws-pane="stands"] .ds-sheet'));
    ok('2a the tab draws the sheet', drew);
    const S = await page.evaluate(() => {
      const el = document.querySelector('[data-ws-pane="stands"] .ds-sheet');
      if (!el) return null;
      const txt = s => [...el.querySelectorAll(s)].map(e => e.textContent.replace(/\s+/g, ' ').trim());
      return { all: el.textContent.replace(/\s+/g, ' ').trim(),
        parties: txt('.ds-pch'), steps: txt('.ds-j li'),
        now: (el.querySelector('.ds-j li.is-now b') || {}).textContent || '',
        done: el.querySelectorAll('.ds-j li.is-done').length,
        facts: txt('.ds-facts > div'), points: txt('.ds-li'), lately: txt('.ds-late'),
        data: typeof dealStands === 'function' ? dealStands(getContract('MK-D1')) : null };
    });
    ok('2b it names every party, with what each one does',
      !!S && S.parties.length >= 2 && S.parties.some(p => /Nordbygg/.test(p)) && S.parties.some(p => /negotiat/i.test(p)),
      JSON.stringify(S && S.parties));
    ok('2c the journey is four steps and the live one is Negotiating',
      !!S && S.steps.length === 4 && /Negotiating/i.test(S.now), JSON.stringify([S && S.steps.length, S && S.now]));
    ok('2d it counts the points the record holds — two settled, one open',
      !!S && S.data && S.data.settled === 2 && S.data.open === 1 && S.data.total === 3,
      JSON.stringify(S && S.data && { s: S.data.settled, o: S.data.open, t: S.data.total }));
    ok('2e and the round is the record\'s own', !!S && S.data && S.data.round === 2, S && S.data && S.data.round);

    /* 3. WHAT WAITS ON EACH PARTY IS SAID BY ITS NAME, NOT A SEAT (the shared
       sheet's one row of facts, 4 Oct 2026, in place of "Whose move") */
    const move = (S && S.facts.find(f => /waiting on nordbygg/i.test(f))) || '';
    ok('3a the facts row names the party that holds the open point, with its count',
      /Nordbygg/.test(move) && /1/.test(move), JSON.stringify(S && S.facts));
    ok('3b and it uses no seat word anywhere on the page',
      !!S && !/\byou\b|\byour\b|\bthem\b|\btheir\b|\bus\b|\bour\b/i.test(S.all),
      JSON.stringify((S && S.all || '').match(/\b(you|your|them|their|us|our)\b/i) || null));

    /* 4. AN OPEN POINT IS A CLAUSE */
    ok('4a the open point is named by its clause, and by who holds it',
      !!S && S.points.some(p => /Liability/i.test(p) && /Nordbygg/.test(p)), JSON.stringify(S && S.points));
    ok('4b and no change id is printed — CHG-3 means nothing to anyone outside',
      !!S && !/CHG-/.test(S.all));

    /* 5. THE SUBTRACTION */
    const leaks = [];
    for (const [k, v] of Object.entries(SECRET)) if (S && S.all.includes(v)) leaks.push(k);
    ok('5a no person is named on it — not a reviewer, not a colleague, not an author',
      leaks.length === 0, leaks.join(', ') || 'none');
    ok('5b and nothing from the internal review or the notes is on it',
      !!S && !/review/i.test(S.all) && !S.all.includes('Zanzibarium'));
    ok('5c it says it is the same page every party sees (the disclaimer went, 4 Oct 2026)',
      !!S && /same page every party sees/i.test(S.all) && !/never shows/i.test(S.all));

    /* 6. IT SPENDS NOTHING */
    ok('6a drawing it called no generative route', ai.length === 0, ai.join(', ') || 'none');

    /* 7. READING STARTS NOTHING */
    const clean = await page.evaluate(() => {
      const c = state.contracts.find(x => !x.negotiation && !(x.changes || []).length);
      if (!c) return { skipped: true };
      const before = { neg: !!c.negotiation, ch: Array.isArray(c.changes) ? c.changes.length : null };
      try { dealStands(c); } catch (_){}
      return { skipped: false, before, after: { neg: !!c.negotiation, ch: Array.isArray(c.changes) ? c.changes.length : null } };
    });
    ok('7a reading a contract that never negotiated starts no negotiation on it',
      clean.skipped ? true : (clean.after.neg === clean.before.neg && clean.after.ch === clean.before.ch),
      clean.skipped ? 'no clean contract in the book — not asked' : JSON.stringify(clean));

    await page.screenshot({ path: path.join(OUT, '1-where-we-are.png') });
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
