/* THE CONTRACT ROOM, AS DRAWN (SAP benchmark, batch 3, owner 9 Oct 2026:
   "Build exactly the drawings of SAP way"; Obligations "Exactly as drawn";
   Where we are "Same look for them").

   WHAT THIS PINS, driven in a real browser on a signed contract and one in
   negotiation
     1 the head is one white band, the bar says Contracts on every tab, the
       counterparty wears its initials
     2 Document and Signing: the facts step aside, the paper's tools sit on
       their own row with the lock said on its left, and no dark banner sits
       over the paper
     3 Signing is one panel, the sealed record's two acts on top
     4 Where we are: the open points are a table (clause · what · by), Settled
       and Lately are cards, and our own act is "Share a status link"
     5 Obligations: Overdue is a tab on the list's card, Amount is a column,
       an unassigned duty of ours says "Nobody"
     6 History: a search, the five filters folded behind Filter, entries under
       a day heading with an outcome tag

   Run: node test/chromium/room-tabs-as-drawn-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };
const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };

const SIGNED = { ...H.fixtureContract('MK-R1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Signed', H.FIXTURE_BODY_A1),
  expiry: day(120),
  obligations: [
    { id: 'o1', desc: 'Deliver monthly volumes report', due: day(-3), party: 'theirs', status: 'open' },
    { id: 'o2', desc: 'Pay invoice within 30 days', due: day(5), party: 'ours', status: 'open' },
  ],
  audit: [
    { at: day(-30) + 'T09:12:00Z', user: 'Grace Njeri', action: 'Approved', detail: '"Value ≥ KES 5M" approved' },
    { at: day(-29) + 'T11:41:00Z', user: 'System', action: 'Sealed', detail: 'The signed copy was sealed' },
  ] };
const LIVE = { ...H.fixtureContract('MK-R2', 'Raw Milk Collection', 'Nandi Dairy Co-operative', H.FOLDER_A, 36000000, 'Under Review'),
  expiry: day(300),
  negotiation: { round: 2, rounds: [{ n: 1, at: day(-15) }] },
  changes: [
    { id: 'CHG-1', clauseId: 'cl_a1', clauseLabel: 'Article 1 Supply', changeType: 'edit', status: 'accepted', authorSide: 'counterparty', summary: '5,000 tonnes a year', createdAt: day(-15), resolvedAt: day(-7), roundN: 1 },
    { id: 'CHG-2', clauseId: 'cl_a2', clauseLabel: 'Article 2 Price', changeType: 'edit', status: 'pending', authorSide: 'counterparty', summary: 'Price reviewed every month', createdAt: day(-1), roundN: 2 },
  ] };

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: [SIGNED, LIVE], approvalRules: [] });
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const tab = async (id, k) => {
    await page.evaluate(([id, k]) => { openWorkspace(id); setTimeout(() => roomGoTab(getContract(id), k), 300); }, [id, k]);
    await page.waitForFunction(k => !!document.querySelector(`#ws-tabs [data-ws-tab="${k}"].on`), k, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(700);
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof openWorkspace === 'function' && state.contracts && state.contracts.length > 1, null, { timeout: 15000 });

    console.log('\n1 · the head');
    await tab('MK-R1', 'docs');
    const head = await page.evaluate(() => {
      const band = document.querySelector('.room-band');
      const probe = document.createElement('div'); probe.style.background = 'var(--color-surface)'; document.body.appendChild(probe);
      const white = getComputedStyle(probe).backgroundColor; probe.remove();
      return { band: band && getComputedStyle(band).backgroundColor, white,
        bar: ((document.getElementById('shell-title') || {}).textContent || '').trim(),
        cpAv: !!document.querySelector('#ws-facts .room-cp .reg-av') };
    });
    ok('1a the name, facts and tabs sit on one white band', head.band === head.white, `${head.band} vs ${head.white}`);
    ok('1b the bar says Contracts on the Document tab', /^Contracts/.test(head.bar), head.bar);
    ok('1c the counterparty fact wears its initials', head.cpAv);

    console.log('\n2 · the paper\'s tools');
    const doc = await page.evaluate(() => {
      const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      return { facts: vis(document.getElementById('ws-facts')),
        row: vis(document.querySelector('.room-toolrow')),
        lock: ((document.getElementById('ws-lockline') || {}).textContent || '').trim(),
        banner: /This document is executed and locked/.test(document.getElementById('doc-scroll') ? document.getElementById('doc-scroll').textContent : '') };
    });
    ok('2a the facts strip steps aside on Document', !doc.facts);
    ok('2b the tools have their own row, the lock said on its left', doc.row && /locked/i.test(doc.lock), doc.lock);
    ok('2c no dark banner over the paper', !doc.banner);

    console.log('\n3 · Signing is one panel');
    await tab('MK-R1', 'sign');
    const sg = await page.evaluate(() => {
      const one = document.querySelector('.sign-one');
      const acts = document.getElementById('sign-seal-acts');
      return { one: !!one, actsFirst: !!(one && acts && one.firstElementChild === acts),
        verify: !!(acts && acts.querySelector('#verify-seal.ui-btn-primary')),
        cards: one ? [...one.querySelectorAll('#sign-side > section')].filter(s => parseFloat(getComputedStyle(s).borderTopLeftRadius) > 2).length : -1 };
    });
    ok('3a the column is one panel', sg.one && sg.cards === 0, `rounded sections inside: ${sg.cards}`);
    ok('3b Verify seal leads it, filled', sg.actsFirst && sg.verify);

    console.log('\n4 · Where we are');
    await tab('MK-R2', 'stands');
    const ws = await page.evaluate(() => ({
      th: [...document.querySelectorAll('.ds-pt-table th')].map(t => t.textContent.trim()),
      row: ((document.querySelector('.ds-pt') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      cards: document.querySelectorAll('.ds-sheet .ds-card').length,
      share: !!document.querySelector('.ds-hrow [data-ds-share]') }));
    ok('4a the open points are a table: Clause · What is proposed · Proposed by', ws.th.length === 3, ws.th.join(' · '));
    ok('4b a row says what is proposed and by whom', /Price reviewed every month/.test(ws.row) && /Nandi Dairy/.test(ws.row), ws.row);
    ok('4c the sheet is cards: the top, Still open, Settled, Lately', ws.cards >= 4, String(ws.cards));
    await page.waitForFunction(() => !!document.querySelector('.ds-hrow [data-ds-share]'), null, { timeout: 5000 }).catch(() => {});
    ok('4d our own act sits on the title line: Share a status link',
      await page.evaluate(() => !!document.querySelector('.ds-hrow [data-ds-share]')));

    console.log('\n5 · Obligations');
    await tab('MK-R1', 'oblig');
    const ob = await page.evaluate(() => ({
      tabs: [...document.querySelectorAll('.obt-head [data-obt-view]')].map(b => b.getAttribute('data-obt-view')),
      th: [...document.querySelectorAll('#obt-scroll .ob-lt th')].map(t => t.textContent.trim()),
      nobody: [...document.querySelectorAll('#obt-scroll .ob-nobody')].map(x => x.textContent.trim()) }));
    ok('5a Overdue is a tab on the list\'s card', ob.tabs.includes('overdue') && ob.tabs.length === 4, ob.tabs.join(','));
    ok('5b Amount is a column', ob.th.length === 4, ob.th.join(' · '));
    ok('5c an unassigned duty of ours says Nobody', ob.nobody.length === 1 && /Nobody/.test(ob.nobody[0]), JSON.stringify(ob.nobody));

    console.log('\n6 · History');
    await tab('MK-R1', 'history');
    const hi = await page.evaluate(() => ({
      q: !!document.getElementById('hist-q'),
      folded: !!(document.getElementById('hist-filters') && document.getElementById('hist-filters').hidden),
      days: document.querySelectorAll('.hist-day-h').length,
      pills: document.querySelectorAll('.hist-pill').length }));
    ok('6a a search box on the head', hi.q);
    ok('6b the five filters fold behind Filter', hi.folded);
    ok('6c entries sit under a day heading, with outcome tags', hi.days >= 1 && hi.pills >= 1, JSON.stringify(hi));
    if (hi.q) {
      await page.click('#hist-filter-btn');
      ok('6d Filter opens them', await page.evaluate(() => !document.getElementById('hist-filters').hidden));
    }
  } catch (e) {
    fail++; console.log('  FAIL harness — ' + e.message);
  }
  ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})();
