/* THE STATUS LINK — the public half of idea 15, driven end to end.
 *
 * A status link is the one purpose whose address does not open HaTi at all.
 * It is a page the server builds from the stored record on every open: the
 * state of the deal and nothing else, with no account, nothing to press, and
 * NO COPY OF THE CONTRACT behind it.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the send screen offers Status, as one more answer to the question it
 *      already asks — not a door of its own;
 *   2. minting one puts the quiet line on the owner's tab: who can see the
 *      page, copy the link, turn it off;
 *   3. a stranger with the address — no account, no cookie, a fresh browser —
 *      reads the same deal the owner's tab reads;
 *   4. THE WALLS. The row behind that address holds no contract, the payload
 *      route refuses the token outright, and the page names no person;
 *   5. turning it off kills the address for everyone, straight away.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'status-link');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const SECRET = { author: 'Tomas Backroom', reviewer: 'Priya Internal', word: 'Zanzibarium' };
const DEAL = {
  id: 'MK-S9', contractNo: 'MK-S9', name: 'Master Services Agreement',
  counterparty: 'Nordbygg AB', counterpartyEmail: 'deals@nordbygg.example',
  folder: 'proc', value: 2400000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-10-31', hash: null, signedAt: null,
  fields: {}, metadata: { value: 2400000, currency: 'SEK' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-9), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [
    { id: 'CHG-1', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4',
      clauseLabel: '4. Payment Terms', kind: 'edit', changeType: 'edit', author: SECRET.author,
      resolvedBy: SECRET.author, createdAt: iso(-8), resolvedAt: iso(-7), seq: 1 },
    { id: 'CHG-2', status: 'pending', authorSide: 'owner', clauseId: 'c9',
      clauseLabel: '9. Liability Cap', kind: 'edit', changeType: 'edit', author: SECRET.author,
      createdAt: iso(-3), seq: 2 },
  ],
  negotiation: { round: 2, rounds: [{ n: 1, at: iso(-4), changes: [] }] },
  review: { by: SECRET.reviewer, at: iso(-2), open: ['CHG-2'] },
  thread: [{ id: 'm1', at: iso(-2), who: SECRET.reviewer, visibility: 'internal',
    text: 'Hold until ' + SECRET.word + ' confirms.' }],
  /* The wording, so a payload that carried the contract would be caught. */
  body: '<h2>9. Liability Cap</h2><p>' + SECRET.word + ' limits liability to 150%.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL, ...FIXTURES], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 9000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  let token = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    /* The payload names whoever is sending it, so the stage waits for the
       session to land rather than racing it. */
    await until(page, () => typeof currentUser === 'function' && !!currentUser(), null, 12000);

    /* ===== 1. THE SEND SCREEN OFFERS IT ===== */
    const offered = await page.evaluate(() => ({
      purposes: typeof SHARE_PURPOSE === 'function'
        ? ['sign', 'negotiate', 'view', 'advise', 'status', 'nonsense'].map(p => [p, SHARE_PURPOSE(p)])
        : null,
      copy: (window.SHARE_PURPOSE_COPY && SHARE_PURPOSE_COPY.status)
        ? { label: SHARE_PURPOSE_COPY.status.label, line: SHARE_PURPOSE_COPY.status.line } : null }));
    ok('1a Status is a purpose the send screen accepts, and nonsense still is not',
      !!offered.purposes && offered.purposes.find(p => p[0] === 'status')[1] === 'status'
        && offered.purposes.find(p => p[0] === 'nonsense')[1] === null, JSON.stringify(offered.purposes));
    ok('1b and it says what the other side will be able to do',
      !!offered.copy && /status/i.test(offered.copy.label) && offered.copy.line.length > 20,
      JSON.stringify(offered.copy && offered.copy.label));

    /* ===== 2. MINT ONE, THE WAY THE SCREEN DOES ===== */
    const minted = await page.evaluate(async () => {
      const c = getContract('MK-S9');
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Admin' }, { purpose: 'status' });
      const r = await api('shares', 'POST', { payload, channel: 'link', purpose: 'status',
        recipient: { name: 'Nordbygg AB' } });
      /* WHAT THE BROWSER ACTUALLY SENT. The id is needed — the server has to
         know which contract the address is for, and that the sender may reach
         it — so the claim is that the payload carries the id AND NOTHING
         ELSE, not that it carries nothing. */
      return { token: r && (r.token || (r.share && r.share.token)), url: r && r.url,
        keys: payload && payload.contract ? Object.keys(payload.contract) : null };
    });
    token = minted.token;
    ok('2a a status link is minted', !!token, JSON.stringify(minted.url || minted));
    ok('2b and the browser sent the contract\'s id and not one field more',
      !!minted.keys && minted.keys.length === 1 && minted.keys[0] === 'id',
      JSON.stringify(minted.keys));

    /* ===== 3. THE OWNER'S QUIET LINE ===== */
    await page.evaluate(() => { try { delete window._dsShares; } catch (_){} });
    await page.evaluate(() => openWorkspace('MK-S9'));
    await until(page, () => state.view === 'workspace' && !!document.getElementById('ws-tabs'));
    await page.click('#ws-tabs [data-ws-tab="stands"]').catch(() => {});
    const lineOn = await until(page, () => {
      const el = document.querySelector('#ws-stands-pane [data-ds-own]');
      return !!el && el.getAttribute('data-ds-own') === 'on';
    }, null, 12000);
    const line = await page.evaluate(() => {
      const el = document.querySelector('#ws-stands-pane [data-ds-own]');
      return el ? { state: el.getAttribute('data-ds-own'), text: el.textContent.replace(/\s+/g, ' ').trim(),
        copy: !!el.querySelector('[data-ds-copy]'), off: !!el.querySelector('[data-ds-off]'),
        href: (el.querySelector('[data-ds-copy]') || {}).getAttribute
          ? el.querySelector('[data-ds-copy]').getAttribute('data-ds-copy') : null } : null;
    });
    ok('3a the owner\'s tab says the page is on, and who can see it',
      lineOn && !!line && /Nordbygg/.test(line.text), JSON.stringify(line && line.text));
    ok('3b with the two acts on it — copy the link, turn it off',
      !!line && line.copy && line.off, JSON.stringify(line && [line.copy, line.off]));
    ok('3c and the link it copies is the public address',
      !!line && /\/deal\//.test(line.href || ''), JSON.stringify(line && line.href));

    /* ===== 4. A STRANGER READS IT ===== */
    const stranger = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const spage = await stranger.newPage();
    const res = await spage.goto(h.base + '/deal/' + token, { waitUntil: 'load' });
    ok('4a the address answers, with no account and no cookie', res && res.status() === 200, res && res.status());
    const seen = await spage.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    ok('4b and it is the same deal the owner\'s tab reads',
      /Nordbygg AB/.test(seen) && /MK-S9/.test(seen) && /Liability Cap/.test(seen)
        && /Payment Terms/.test(seen) && /Round/.test(seen), seen.slice(0, 120));
    ok('4c whose move is a party, and it is the side that must answer',
      /Nordbygg AB/.test(seen) && !/\byour\b|\btheir\b/i.test(seen),
      (seen.match(/Whose move[^·]*/i) || [''])[0].slice(0, 60));
    /* ---- THE TWO READINGS, PINNED AGAINST EACH OTHER ----
       The browser has dealStands and the server has srvDealStands, written
       twice because the public page is served outside the application. Two
       surfaces may DRAW differently; the READING may never differ, and the
       only way to know is to ask both about the same contract and compare
       what each one says out loud. */
    const mine = await page.evaluate(() => {
      const D = dealStands(getContract('MK-S9'));
      return { round: D.round, open: D.open, total: D.total, settled: D.settled,
        move: D.move && D.move.party, days: D.move && D.move.days,
        points: D.points.map(p => p.clause), settledPoints: D.settledPoints.map(p => p.clause),
        parties: D.parties.map(p => p.name), step: (D.steps.find(s => s.now) || {}).key };
    });
    const says = s => (seen.match(s) || [])[1];
    ok('4d the owner\'s reading and the public page agree, field by field',
      mine.round === Number(says(/ROUND (\d+)/))
        && `${mine.open} / ${mine.total}` === says(/OPEN POINTS (\d+ \/ \d+)/)
        && seen.includes(mine.move)
        && mine.points.every(p => seen.includes(p))
        && mine.settledPoints.every(p => seen.includes(p))
        && mine.parties.every(p => seen.includes(p))
        && mine.step === 'negotiating' && /Negotiating/.test(seen),
      JSON.stringify(mine));
    await spage.screenshot({ path: path.join(OUT, '1-public-page.png') });

    /* ===== 5. THE WALLS ===== */
    const leaks = Object.entries(SECRET).filter(([, v]) => seen.includes(v)).map(([k]) => k);
    ok('5a no person and no wording is on the public page', leaks.length === 0, leaks.join(', ') || 'none');
    const payloadTry = await spage.evaluate(async t => {
      const r = await fetch('/api/shares/' + t);
      let j = null; try { j = await r.json(); } catch (_){}
      return { status: r.status, err: j && j.error };
    }, token);
    ok('5b the payload route refuses a status token outright',
      payloadTry.status === 403, JSON.stringify(payloadTry));
    const stored = await page.evaluate(async t => {
      const r = await api('contracts/MK-S9/shares');
      const s = (r.shares || []).find(x => x.token === t);
      return s ? { purpose: s.purpose, keys: Object.keys(s) } : null;
    }, token);
    ok('5c and the row behind the address is a status row',
      !!stored && stored.purpose === 'status', JSON.stringify(stored && stored.purpose));

    /* ===== 6. TURNING IT OFF ===== */
    await page.evaluate(async t => { await api('shares/' + t + '/revoke', 'POST', {}); }, token);
    const after = await spage.goto(h.base + '/deal/' + token, { waitUntil: 'load' });
    const gone = await spage.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
    ok('6a the address stops working the moment it is switched off',
      after && after.status() === 410 && /switched off/i.test(gone), (after && after.status()) + ' ' + gone.slice(0, 70));
    const bad = await spage.goto(h.base + '/deal/not-a-real-token', { waitUntil: 'load' });
    ok('6b and an address that was never minted says so without leaking anything',
      bad && bad.status() === 404, bad && bad.status());

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
