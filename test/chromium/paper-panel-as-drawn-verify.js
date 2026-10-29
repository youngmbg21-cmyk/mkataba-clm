/* JAMBO BESIDE A PAPER, AND FOLLOW ME ON HOME, AS DRAWN (rounds 3 and 6 of
   the redesign: "Tabs and faces" and "One line"; the owner's "build all the
   gaps", 18 Oct 2026; js/paperdesk.js pdNoteRows, pdGlanceRows, pdAskSay,
   pdGlGoTo; js/copilotacts.js caOwedSteps; js/presence.js presenceCanWalk,
   presenceGo; js/views/intelligence.js igPaperGoClause)

   PASS 2 (the checker's review, 18 Oct 2026): their redlines are a row in
   Needs you here from the day they arrive (quiet, "Arrived today" / "Waiting
   4 days"); each ask says what its number is of and which way it moved;
   "Risks not read yet" costs 1 Jambo call and Read it runs the Clauses
   tab's deep read; the lead chip is a strong link in the accent ink
   (re-pointed 20 Oct 2026, Chambers: it wore the accent's outline); Follow me
   names the clause on the hover, says what a press did, and works on the
   signing copy beside Before you sign — photographed at all three screens.

   WHAT THIS PINS, in real browsers on a seeded workspace with a contract
   whose other side sent two redlines, a note of the reader's due today on
   it, and a colleague on it too
     1 Needs you here lists the note — "1 note due today", its words, "only
       you" — and Open note opens it in My notes; the colleague never sees it
     2 the glance, as drawn: the stage with its round; "<party> sent 2
       redlines …" with "Your move." and Redlines; one row per ask, "Clause 7:
       they ask for “100%” in place of “50%”." · their ask · Go to it; "Nobody
       has been named to sign yet." · Needed before signing; "Risks not read
       yet." with what reading costs, and Read it
     3 Go to it Redlines the paper and brings that clause up, lit
     4 Read it runs the risk read, and its row goes
     5 the chips lead with what is owed — "answer the redlines", "name a
       signer" — never also "redline" or "sign"; "name a signer" opens the
       signing route
     6 FOLLOW ME ON HOME: the colleague's face on the paper's line is a
       button; pressed, it lights, and when the colleague moves to another
       clause the reader's own paper arrives there; pressed again it stops
     7 the owner's three screens: both cards, the chips and the box in view,
       nothing past the panel's edge
   PASS 3 (the second review and the owner's answers 6 and 8, 18 Oct 2026):
     1e their redlines are owed after the quiet standard, unchanged: no row
        before it, the urgent row after it; the tab and pill count the same
     1g Jambo's work here: "Jambo's work · Nordvik's answer", its line whole
     1h Needs you here is pinned above the conversation: asked something,
        the talk scrolls and the card stays in view
     2c "Clause 11: they ask for 60 days to pay, up from 30."
     2e "Risks not read yet · Reading is free: HaTi's own rules, no Jambo
        call · Read it"; 4 Read it runs the free scan, no Jambo call
     3  Go to it lands on the clause through landOn (lit, .is-landed)
     1d Open note lands on the note's row in My notes
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/paper-panel-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Master Services Agreement is made between Highland Corporate Ltd (the Customer) and Nordvik Logistik AB (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '3. Term', '', 'This Agreement starts on 1 April 2026 and runs until 31 March 2027.', '',
  '4. Fees', '', 'The Customer pays the fees in Schedule 3.', '',
  '5. Service levels', '', 'If the Supplier misses a service level the Customer receives a credit.', '',
  '6. Confidentiality', '', 'Each party keeps the other\'s confidential information secret.', '',
  '7. Limitation of liability', '', 'Each party\'s total liability under this Agreement shall not exceed 50% of the fees paid in the twelve months before the claim.', '',
  '8. Insurance', '', 'The Supplier holds liability insurance of at least KES 10 million for the whole term.', '',
  '9. Law and disputes', '', 'This Agreement is governed by the laws of Kenya.', '',
  '10. Notices', '', 'Notices are given in writing.', '',
  '11. Payment terms', '', 'The Customer shall pay each correct invoice within 30 days of receipt.'].join('\n');

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4.2e6, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Per', email: 'per@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
  /* a note of the reader's own, due today, on this contract — My notes' own route */
  const t = new Date(); const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Check Nordvik\'s insurance broker.', contractId: 'MK-0382', reviewBy: today } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, tag) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(tag + ': ' + e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, { timeout: 20000 });
    return page;
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1', 'reader');
    const until = async (fn, arg, ms = 8000, p = page) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await p.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await p.waitForTimeout(120); }
      return v; };
    const press = async (sel, what, p = page) => { if (!(await p.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await p.locator(sel).first().click(); return true; };
    /* their two redlines come back through the link, as a real round does */
    const cls = await page.evaluate(async () => { const c = getContract('MK-0382'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const ask = (re, a, b) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, b), why: 'Standard in our contracts' }; };
    await h.client('per').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Per', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/50%/, '50%', '100%'), ask(/30 days/, '30 days', '60 days')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await until(() => (getContract('MK-0382').changes || []).length >= 2, null, 10000);
    const k7 = cls.find(x => /50%/.test(x.text)), k11 = cls.find(x => /30 days/.test(x.text)), k1 = cls.find(x => /Parties/.test(x.label));
    const settled = (p = page) => until(() => { const d = document.getElementById('ig-dock'); if (!d) return false;
      return Math.abs(d.getBoundingClientRect().width - parseFloat(d.style.width || '0')) < 2; }, null, 4000, p);
    const onPaper = async (p = page) => { await p.evaluate(() => pdOpenOnHome('MK-0382', 'copilot'));
      const ok = await until(() => !!document.getElementById('pd-glance') && !!document.querySelector('#ig-paper [data-clause]'), null, 12000, p); await settled(p); return ok; };

    console.log('\n1 · a note of yours, in Needs you here');
    await onPaper();
    const nt = await until(() => { const r = document.querySelector('#pd-needs [data-pd-nd-kind="mynote"]'); if (!r) return null;
      /* RE-POINTED 29 Oct 2026 (the Dossier's rows, one grid): Your note · Due today · Open; its own words and "only you" on the hover */
      return { title: ((r.querySelector('.ds-nm') || {}).textContent || '').trim(), val: ((r.querySelector('.ds-val') || {}).textContent || '').trim(), sub: (r.getAttribute('title') || '').trim(), btn: (r.querySelector('[data-pd-nd-note]') || {}).textContent || '',
        n: Number(((document.querySelector('#pd-needs .pd-gl-h .ds-ck-n') || {}).textContent || '').replace(/\D+/g, '') || 0), rows: document.querySelectorAll('#pd-needs .pd-gl-row:not(.is-done), #pd-needs #pd-og tr.pd-og-row:not(.is-saved):not(.is-named)').length,
        all: (document.querySelector('#pd-needs [data-pd-nd-all]') || {}).textContent || '', counter: counterNeedsCount() }; }, null, 10000);
    check('1a "Your note · Due today", its own words and "only you" on the hover, with Open', !!nt && nt.title === 'Your note' && nt.val === 'Due today' && nt.sub === '“Check Nordvik\'s insurance broker.” · only you' && nt.btn === 'Open', JSON.stringify(nt));
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): Needs you here's rows are the dossier's Still owed card,
       "Still owed · N" counting its rows; its head says "everything, one list" where "all N" stood */
    /* RE-POINTED 21 Oct 2026 (the Legora way, owner 20 Oct 2026): the owed FACTS are rows of the grid
       (#pd-og) above the list — the pill counts them with the list's rows, so both are counted here */
    check('1b Still owed counts it with its rows', !!nt && nt.n === nt.rows && !nt.all, JSON.stringify(nt));
    /* PASS 3 (the owner's answer 8): their redlines are owed after the desk's quiet standard, unchanged —
       before it, Needs you here draws no row of its own; past it, needsYouOf's own urgent row */
    const qrow = () => page.evaluate(() => { const r = document.querySelector('#pd-needs [data-pd-nd-kind="quiet"]'); if (!r) return null;
      const sm = r.querySelector('small'); return { title: r.querySelector('b').textContent.trim(), sub: sm ? sm.textContent.trim() : '', late: !!(sm && sm.querySelector('.late')), btn: (r.querySelector('[data-pd-nd]') || {}).textContent || '' }; });
    const counts = () => page.evaluate(() => ({ pill: Number(((document.querySelector('#pd-needs .pd-gl-h .ds-ck-n') || {}).textContent || '').replace(/\D+/g, '') || 0), rows: document.querySelectorAll('#pd-needs .pd-gl-row:not(.is-done), #pd-needs #pd-og tr.pd-og-row:not(.is-saved):not(.is-named)').length,
      quietOwed: (needsYouOf(getContract('MK-0382')) || []).some(it => it.kind === 'quiet') }));
    const q0 = await qrow(), c0 = await counts();
    check('1e (pass 3) the day they came: no redlines row in Needs you here — not owed before the standard', !q0 && !c0.quietOwed && c0.pill === c0.rows, JSON.stringify({ q0, c0 }));
    await page.evaluate(() => { const at = new Date(Date.now() - 4 * 864e5).toISOString();
      (getContract('MK-0382').changes || []).forEach(x => { if (x.authorSide === 'counterparty') x.createdAt = at; }); pdNeedsRepaint(); });
    await page.waitForTimeout(300);
    const q4 = await qrow();
    check('1e2 (pass 3) four days on: still none — the standard is five quiet days', !q4, JSON.stringify(q4));
    await page.evaluate(() => { const at = new Date(Date.now() - 9 * 864e5).toISOString();
      (getContract('MK-0382').changes || []).forEach(x => { if (x.authorSide === 'counterparty') x.createdAt = at; }); pdNeedsRepaint(); });
    /* RE-POINTED 23 Oct 2026 (the rest of Round A, as drawn: "Nordvik Logistik's answer · 5 of 6 /
       Jambo read … · waiting 8 days · Look"): past the standard, their redlines are the answer
       Jambo prepared for them — ONE row carrying their wait, late — never a second row */
    /* RE-POINTED 29 Oct 2026 (one grid): Jambo's work · their answer · Look, late in amber, the wait on the hover */
    const q9 = await until(() => { const r = document.querySelector('#pd-needs .pd-nd-row.is-jw'); if (!r || !r.classList.contains('is-hot')) return null;
      return { title: ((r.querySelector('.ds-val') || {}).textContent || '').trim(), name: ((r.querySelector('.ds-nm') || {}).textContent || '').trim(), sub: (r.getAttribute('title') || '').trim(), late: r.classList.contains('is-hot'), btn: (r.querySelector('[data-pd-nd-jw]') || {}).textContent.trim(),
        quietRow: !!document.querySelector('#pd-needs [data-pd-nd-kind="quiet"]') }; }, null, 6000);
    const c9 = await counts();
    check('1f (pass 3) past the standard: "Answer Nordvik Logistik AB’s 2 redlines" · Waiting N days · clauses 7 and 11 · Open redlines, counted with the rows',
      !!q9 && q9.name === 'Jambo’s work' && /^Nordvik Logistik AB’s answer/.test(q9.title) && /waiting 9 days/.test(q9.sub) && q9.late && q9.btn === 'Look' && !q9.quietRow && c9.quietOwed && c9.pill === c9.rows, JSON.stringify({ q9, c9 }));
    await shot(page, '3-panel-asks-past-the-standard-1440x780');
    await page.evaluate(() => { const at = new Date().toISOString();
      (getContract('MK-0382').changes || []).forEach(x => { if (x.authorSide === 'counterparty') x.createdAt = at; }); pdNeedsRepaint(); });

    console.log('\n1g · Jambo\'s work here, in the drawing\'s words');
    /* RE-POINTED 29 Oct 2026 (one grid): the row is Jambo's work · their answer; what he read and its step on the hover, the answer never cut */
    const jw = await until(() => { const r = document.querySelector('#pd-needs .pd-nd-row.is-jw'); if (!r) return null; const v = r.querySelector('.ds-val');
      return { name: ((r.querySelector('.ds-nm') || {}).textContent || '').trim(), title: v ? v.textContent.trim() : '', sub: (r.getAttribute('title') || '').trim(), cut: v ? v.scrollWidth > v.clientWidth + 1 : null }; }, null, 6000);
    /* RE-POINTED 23 Oct 2026 (as drawn): the one desk's row — its title and step, what Jambo read */
    check('1g "Jambo’s work · Nordvik’s answer", its line said whole (never cut)', !!jw && jw.name === 'Jambo’s work' && /^Nordvik Logistik AB’s answer$/.test(jw.title) && /^\d+ of \d+ · Jambo read .+/.test(jw.sub) && jw.cut === false, JSON.stringify(jw));

    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the glance became the dossier — the spine for the stage,
       What Jambo read, and Still owed as one list (each empty detail, the signer, their asks · Reply ›) */
    console.log('\n2 · the dossier as drawn');
    const gl = await page.evaluate(() => { const g = document.getElementById('pd-glance'); const owed = g.querySelector('[data-pd-ds-card="owed"]');
      const rows = [...owed.querySelectorAll('.pd-gl-row:not(.is-done)')];
      /* RE-POINTED 29 Oct 2026 (one grid): Their redlines · the ask in its own words · Reply; how long it waits on the hover */
      const row = k => rows.filter(r => r.getAttribute('data-pd-gl') === k).map(r => ({ say: ((r.querySelector('.ds-val') || {}).textContent || '').trim(), sub: ((r.getAttribute('title') || '').split(' · ').pop() || '').trim(), btn: ((r.querySelector('button') || {}).textContent || '').trim() }));
      const rk = g.querySelector('[data-pd-ds="risks"]');
      const D = dossierOf(getContract('MK-0382')), want = D.stages.find(x => x.k === 'nego').n;
      /* RE-POINTED 23 Oct 2026 (Spine): the stage is a line down the spine; its number on its hover as before */
      return { nego: (g.querySelector('.ds-sp-st[data-ds-sp="nego"]') || {}).className || '', negoN: (/^\D*(\d+)/.exec(((g.querySelector('.ds-sp-st[data-ds-sp="nego"]') || {}).title || '').split('·')[1] || '') || [])[1] || '', want,
        /* RE-POINTED 21 Oct 2026 (the Legora way): the signer is a row of Still owed's grid, answered there;
           the grid stands above the list, so the order reads the grid's rows first */
        order: [...owed.querySelectorAll('#pd-og tr.pd-og-row:not(.is-saved)')].map(r => r.getAttribute('data-pd-og-kind') === 'signer' ? 'sign' : 'fact').concat(rows.map(r => r.getAttribute('data-pd-gl'))),
        asks: row('ask'),
        sign: [...owed.querySelectorAll('#pd-og tr.pd-og-row[data-pd-og-kind="signer"]')].map(r => ({ say: ((r.querySelector('.pd-og-f b') || {}).textContent || '').trim(),
          box: !!r.querySelector('input'), door: !!r.querySelector('.pd-ck-hd[data-pd-og-route]') })),
        scan: rk ? { say: ((rk.querySelector('.ds-nm') || {}).textContent || '').replace(/\s+/g, ' ').trim(), val: ((rk.querySelector('.ds-val') || {}).textContent || '').trim(), btn: ((rk.querySelector('[data-pd-gl-scan]') || {}).textContent || '').trim(), tip: ((rk.querySelector('[data-pd-gl-scan]') || {}).title || '') } : null }; });
    check('2a the spine: Negotiate lit, its number the owed rows filed under it (their two asks among them)', /is-(?:cur|owed)/.test(gl.nego) && gl.negoN === String(gl.want) && gl.want >= 2, JSON.stringify({ nego: gl.nego, n: gl.negoN, want: gl.want }));
    /* RE-POINTED 29 Oct 2026 (the owner: one grey pill per row, no arrow) */
    check('2c one row per ask, in its own words — what the number is of, which way it moved · waits · Reply',
      gl.asks.length === 2 && gl.asks.some(a => a.say === 'Clause 7: they ask for 100% of the fees paid, up from 50%.') && gl.asks.some(a => a.say === 'Clause 11: they ask for 60 days to pay, up from 30.')
      && gl.asks.every(a => /^waits /.test(a.sub) && a.btn === 'Reply'), JSON.stringify(gl.asks));
    /* RE-POINTED 22 Oct 2026 (owner: the signer boxes went): the Signer line is the signing route editor's door */
    check('2d nobody named to sign: the signer is one grid row, no boxes, its line the signing route\'s door', gl.sign.length === 1 && !gl.sign[0].box && gl.sign[0].door, JSON.stringify(gl.sign));
    check('2e the risks not read yet, in What Jambo read: "free" said before the press, and Read it (the owner\'s answer 6)',
      /* RE-POINTED 22 Oct 2026 (the Checklist): the name, then "Not read · free" in its own column, then Read */
      !!gl.scan && gl.scan.say === 'Risks to look at' && gl.scan.val === 'Not read · free' && gl.scan.btn === 'Read' && gl.scan.tip === 'Reading is free: HaTi’s own rules, no Jambo call', JSON.stringify(gl.scan));
    check('2f Still owed: the signer, then their asks', gl.order.indexOf('sign') >= 0 && gl.order.indexOf('sign') < gl.order.indexOf('ask'), gl.order.join(','));
    /* 2g WHAT JAMBO READ SAYS WHAT THE BOARD COUNTS (21 Oct 2026): a brief that already names watch-outs is
       counted (never "not read yet" beside them); obligations on the record with none waiting in the reading
       are counted as the record's, never "0 found · N recorded" */
    const g2 = await page.evaluate(async () => { const c = getContract('MK-0382'); const keep = { b: c._brief, o: c.obligations, t: c.triage };
      c._brief = { data: { overview: 'A logistics deal.', watchouts: [{ title: 'Uncapped liability', point: 'Liability is not capped.', wording: true }] } };
      c.obligations = [{ id: 'ob1', desc: 'Pay within 30 days' }, { id: 'ob2', desc: 'Deliver monthly' }];
      pdGlanceRepaint(); await new Promise(r => setTimeout(r, 300));
      /* RE-POINTED 22 Oct 2026 (the Checklist): the figure leads the row's grey value */
      const rd = k => { const r = document.querySelector(`#pd-glance [data-pd-ds="${k}"]`); return r ? { fig: (/^\d+/.exec(r.querySelector('.ds-val').textContent.trim()) || [''])[0], nm: r.querySelector('.ds-nm').textContent.replace(/\s+/g, ' ').trim() + ' ' + r.querySelector('.ds-val').textContent.trim() } : null; };
      /* RE-POINTED 23 Oct 2026 (Spine): the record's duties are the Obligations line under Sign */
      const ob = document.querySelector('#pd-glance .ds-ob-line');
      const out = { risks: rd('risks'), oblig: ob ? { fig: (/^\d+/.exec(ob.querySelector('.ds-this-v').textContent.trim()) || [''])[0], nm: ob.querySelector('b').textContent.trim() + ' ' + ob.querySelector('.ds-this-v').textContent.trim() } : null, want: riskOpenOf(c).length };
      Object.assign(c, { _brief: keep.b, obligations: keep.o, triage: keep.t }); pdGlanceRepaint(); return out; });
    check('2g What Jambo read counts the brief\'s watch-outs as the Board does, and the record\'s obligations without a "0 found"',
      !!g2.risks && g2.risks.fig === String(g2.want) && g2.want >= 1 && !/not read yet/i.test(g2.risks.nm) && !!g2.oblig && g2.oblig.fig === '2' && /^Obligations\b/.test(g2.oblig.nm), JSON.stringify(g2));
    await shot(page, '3-panel-beside-a-paper-1440x780');

    console.log('\n3 · Reply');
    await page.evaluate(() => { const b = document.querySelector('#pd-glance [data-pd-gl="ask"] [data-pd-glance="redline"]'); if (b) b.click(); });
    const went = await until(() => document.getElementById('pd-redface') && document.querySelector('#pd-redface [data-nego-card]') ? true : null, null, 8000);
    check('3 Reply opens the Redlines face beside the paper, their asks in it', !!went);
    await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-pd-back="red"]'); if (b) b.click(); });
    await until(() => !document.getElementById('pd-redface') && !!document.getElementById('pd-glance'), null, 6000);

    console.log('\n4 · Read it');
    /* PASS 3 (the owner's answer 6): the free rules scan — no Jambo call — and its row goes */
    const asked = [];
    page.on('request', r => { if (/\/api\/ai\//.test(r.url()) && r.method() === 'POST') asked.push(r.url()); });
    if (await page.evaluate(() => { const b = document.querySelector('#pd-glance [data-pd-gl-scan]'); if (b) b.click(); return !!b; })) {
      const read = await until(() => { const c = getContract('MK-0382'); return c && c.scan && !document.querySelector('#pd-glance [data-pd-gl-scan]') ? true : null; }, null, 10000);
      check('4 Read it runs the free scan (HaTi\'s own rules), its row goes, and no Jambo call is made', !!read && asked.length === 0, JSON.stringify({ read, asked }));
    } else check('4 Read it (nothing to press)', false);

    /* RE-POINTED 19 Oct 2026 (Jambo as a tab you flip to, and back). The owner: "you land on the page and if
       you want to chat with jambo it takes you to a new jambo tab but you can go back to the landing side
       panel". The talk is its own view now, so Needs you here no longer rides above it: it stays on the
       landing, and the back returns there with it pinned at the top as before. */
    console.log('\n1h · asking flips to the conversation; the back lands on Needs you here, pinned at the top');
    await page.evaluate(() => intelAsk('what does clause 7 say?'));
    const flipped = await until(() => { if (!(window.pdTalkShows && pdTalkShows()) || !(intel.history || []).length || intel.busy) return null;
      const nd = document.getElementById('pd-needs'), r = nd && nd.getBoundingClientRect();
      return { talk: (intel.history || []).length, needsShown: !!(r && r.width > 0 && r.height > 0), back: !!document.querySelector('#ig-dock [data-jb-door] [data-pd-back]') }; }, null, 10000);
    check('1h asked something: the panel turns to the conversation, its back above the box (Door above the box, 28 Oct 2026), Needs you here kept on the landing', !!flipped && flipped.talk > 0 && !flipped.needsShown && flipped.back, JSON.stringify(flipped));
    await shot(page, '3-panel-asked-1440x780');
    if (flipped && flipped.back) await page.click('#ig-dock [data-jb-door] [data-pd-back]');
    /* RE-POINTED 20 Oct 2026 (owner picked "The Dossier"): the landing is the dossier, Still owed its second card */
    const pinned = await until(() => { const nd = document.getElementById('pd-needs'), sp = document.querySelector('#pd-glance .ds-spine'); if (!nd || !sp || (window.pdTalkShows && pdTalkShows())) return null;
      const n = nd.getBoundingClientRect();
      return { spine: true, inView: n.top >= 0 && n.top <= innerHeight - 40 }; }, null, 10000);
    check('1h2 the back: the dossier again, Still owed in view', !!pinned && pinned.inView, JSON.stringify(pinned));
    await page.evaluate(() => { intel.history = []; renderIntelDock(); });

    console.log('\n5 · the chips');
    const ch = await until(() => { const L = [...document.querySelectorAll('#ig-dock [data-ca-chip]')]; return L.length ? L.map(b => ({ k: b.getAttribute('data-ca-chip'), w: b.textContent.trim(), owed: b.classList.contains('ca-chip-owed') })) : null; }, null, 6000);
    const ks = (ch || []).map(x => x.k);
    /* RE-POINTED 21 Oct 2026 — the owner picked "The SAP way" for the Signer row in Still owed
       ("adding signer should be next to the signers area not at the bottom"): the "name a
       signer" chip at the foot of the panel is GONE, the row asks it, and the row carries the
       one door left to the route editor (signer-row-as-drawn-verify 1c, 6a, 6b). What the
       chip's rule carried stays: signing is not offered while nobody is named. */
    check('5a the owed lead — "answer the redlines" — no "name a signer" chip, and never "redline" or "sign"',
      ks.includes('answer') && !ks.includes('signer') && !ks.includes('redline') && !ks.includes('sign') && ks.length === 4 && ch[0].owed
      && ch.find(x => x.k === 'answer').w === 'answer the redlines', JSON.stringify(ch));
    /* PASS 2, RE-POINTED 20 Oct 2026 (Chambers: suggestions are links): the lead chip is a link in
       the accent ink, its words strong, underlined, no outline and no wash — and never amber */
    const edge = await page.evaluate(() => { const b = document.querySelector('#ig-dock .ca-chip-owed'); if (!b) return null;
      const probe = document.createElement('i'); probe.style.color = 'var(--accent-ink)'; probe.style.fontWeight = 'var(--w-strong)'; document.body.appendChild(probe);
      const pcs = getComputedStyle(probe), ink = pcs.color, strong = pcs.fontWeight; probe.remove();
      const cs = getComputedStyle(b); return { jb: b.classList.contains('jb-chip'), color: cs.color, ink, weight: cs.fontWeight, strong, line: cs.textDecorationLine, style: cs.borderTopStyle, width: cs.borderTopWidth, bg: cs.backgroundColor }; });
    check('5c (pass 2) the lead chip: a link in the accent ink, strong and underlined, no outline, not amber',
      !!edge && edge.jb && edge.color === edge.ink && edge.weight === edge.strong && /underline/.test(edge.line) && (edge.style === 'none' || edge.width === '0px')
      && edge.bg === 'rgba(0, 0, 0, 0)' && !/180, 83, 9|254, 243, 199/.test(edge.bg + edge.color), JSON.stringify(edge));
    /* 5b WENT WITH THE CHIP (21 Oct 2026). "Order the signing ›" on the Signer row in Still
       owed is the one door left to the route editor, and signer-row-as-drawn-verify 6a/6b
       presses it there: it opens over the same page and closing it lands back on the row. */

    console.log('\n6 · Follow me on Home');
    const peer = await open('everything@example.co.ke', 'their-own-pass-9', 'colleague');
    await onPaper(peer);
    /* the colleague's own paper says where they are, on the beat it already has */
    await peer.evaluate(() => presenceSay('MK-0382'));
    await onPaper();
    await page.evaluate(() => presenceSay('MK-0382'));
    const face = await until(() => { const b = document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]'); return b ? b.getAttribute('data-pz-follow') : null; }, null, 10000);
    check('6a the colleague\'s face on the paper\'s line is a button on Home', !!face, String(face));
    if (face) {
      /* THEIR SPOT RIDES THEIR NEXT BEAT (made steady 25 Oct 2026: with four checks running side by side the face
         came before the colleague's paper had settled on a clause, and the hover said "has this contract open"):
         both sides say their beat again until the face names a clause, bounded */
      const FACE = '#ig-strip [data-pz-slot="paper"] button[data-pz-follow]';
      for (let i = 0; i < 8; i++) {
        if (await page.evaluate(s => /is reading clause/.test((document.querySelector(s) || {}).title || ''), FACE)) break;
        await peer.evaluate(() => presenceSay('MK-0382')); await page.evaluate(() => presenceSay('MK-0382'));
        await until(s => /is reading clause/.test((document.querySelector(s) || {}).title || '') || null, FACE, 1500);
      }
      /* PASS 2: the hover names the clause they are on */
      const hover = await page.evaluate(() => (document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]') || {}).title || '');
      check('6a2 (pass 2) its hover names where they are: "<name> is reading clause N now. Press to follow: the paper goes where <first> reads."',
        /^Unrestricted Legal is reading clause \d+ now\. Press to follow: the paper goes where Unrestricted reads\.$/.test(hover), hover);
      await page.click('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]');
      const lit = await until(() => { const b = document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]'); return b && b.classList.contains('is-following') && b.getAttribute('aria-pressed') === 'true' && !!presenceFollowing(); }, null, 6000);
      check('6b pressed, it lights: following', !!lit);
      const said = await until(() => [...document.querySelectorAll('#toast-root > *')].map(e => e.textContent.trim()).find(t => /^Following /.test(t)) || null, null, 4000);
      check('6b2 (pass 2) and the press says what it did, once', /^Following Unrestricted Legal: the paper goes to clause \d+ and moves when they do\. Press the face again to stop\.$/.test(said || ''), said);
      /* the colleague goes to clause 7 on their own paper, and says so on their beat */
      const lead = await peer.evaluate(id => { igPaperGoClause(id); return new Promise(r => setTimeout(async () => { await presenceSay('MK-0382'); r(presenceSpotNow()); }, 900)); }, k7.id);
      await page.evaluate(() => presenceSay('MK-0382'));
      const arrived = await until(id => presenceSpotNow() === id ? true : null, lead, 8000);
      check('6c the colleague moves to another clause, and the reader\'s own paper arrives there', !!arrived && lead === k7.id, JSON.stringify({ lead, want: k7.id, mine: await page.evaluate(() => presenceSpotNow()) }));
      await shot(page, '6-follow-me-on-home-1440x780');
      await page.click('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]');
      const off = await until(() => !presenceFollowing() && !document.querySelector('#ig-strip [data-pz-slot="paper"] .is-following'), null, 6000);
      check('6d pressed again, it stops', !!off);
      const stopped = await until(() => [...document.querySelectorAll('#toast-root > *')].map(e => e.textContent.trim()).find(t => /^You stopped following/.test(t)) || null, null, 4000);
      check('6d2 (pass 2) and says so', stopped === 'You stopped following Unrestricted Legal.', stopped);
      await peer.evaluate(id => { igPaperGoClause(id); return new Promise(r => setTimeout(async () => { await presenceSay('MK-0382'); r(true); }, 900)); }, k1.id);
      await page.evaluate(() => presenceSay('MK-0382'));
      await page.waitForTimeout(900);
      const stayed = await page.evaluate(() => presenceSpotNow());
      check('6e and the page stops moving', stayed !== k1.id, String(stayed));

      /* PASS 2: THE SIGNING COPY beside Before you sign — its headings marked, so the face walks there too */
      console.log('\n6f · Follow me on the signing copy, at the owner\'s three screens');
      for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
        await page.setViewportSize({ width: w, height: ht }); await peer.setViewportSize({ width: w, height: ht });
        await page.evaluate(() => { if (presenceFollowing()) presenceFollow(presenceFollowing()); if (typeof toastsClear === 'function') toastsClear(); });
        await peer.evaluate(id => { igPaperGoClause(id); return new Promise(r => setTimeout(async () => { await presenceSay('MK-0382'); r(true); }, 900)); }, k11.id);
        await page.evaluate(() => pdSignOpen('MK-0382'));
        const up = await until(() => !!document.querySelector('#ig-paper .ig-signpaper [data-pz-clause]'), null, 12000);
        await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); if (sc) sc.scrollTop = 0; return presenceSay('MK-0382'); });
        const btn = await until(() => !!document.querySelector('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]'), null, 8000);
        check(`6f ${w}×${ht}: the signing copy's headings carry their clauses, and the face is a button there`, !!up && !!btn, JSON.stringify({ up, btn }));
        if (!btn) continue;
        await page.click('#ig-strip [data-pz-slot="paper"] button[data-pz-follow]');
        const there = await until(id => { const el = document.querySelector(`#ig-paper [data-pz-clause="${id}"]`), sc = document.getElementById('ig-paper-scroll'); if (!el || !sc) return null;
          const r = el.getBoundingClientRect(), b = sc.getBoundingClientRect(); const spot = presenceSpotNow();
          /* the walk scrolls smoothly: asked until it has come to rest there */
          return (r.top >= b.top - 1 && r.bottom <= b.bottom + 1 && spot === id) ? { top: Math.round(sc.scrollTop), spot } : null; }, k11.id, 8000);
        check(`6g ${w}×${ht}: pressed, the signing copy goes to the clause the colleague reads, and the reader's own place is that clause`, !!there && there.top > 0 && there.spot === k11.id, JSON.stringify(there));
        await shot(page, `6-follow-me-signing-copy-${w}x${ht}`);
        await page.evaluate(() => { if (presenceFollowing()) presenceFollow(presenceFollowing()); });
        await page.evaluate(() => { if (typeof pdSignClose === 'function') pdSignClose(); });
      }
      await page.setViewportSize({ width: 1440, height: 780 }); await peer.setViewportSize({ width: 1440, height: 780 });
    }
    console.log('\n1c · the note is the reader\'s alone');
    const theirs = await until(() => !!document.getElementById('pd-glance'), null, 6000, peer) && await peer.evaluate(() => !!document.querySelector('#pd-needs [data-pd-nd-kind="mynote"]') || /insurance broker/.test((document.getElementById('ig-dock') || {}).innerText || ''));
    check('1c the colleague, on the same paper, sees no note of the reader\'s', theirs === false, String(theirs));
    if (await press('#pd-needs [data-pd-nd-note]', '1d Open note')) {
      const mn = await until(() => state.view === 'mynotes' && /insurance broker/.test((document.getElementById('content') || document.body).innerText) && !!document.querySelector('[data-mn-row].is-landed'), null, 8000);
      check('1d Open note opens it in My notes, landed on its row (landOn)', !!mn);
    }

    console.log('\n7 · the owner\'s three screens');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await onPaper(); await settled();
      const fit = await until(() => { const dock = document.getElementById('ig-dock'), feed = document.getElementById('igd-feed'),
        /* RE-POINTED 23 Oct 2026 (Spine): Needs you takes no box; the dossier's first stage line is measured */
        /* RE-POINTED 24 Oct 2026 (Round 4, owner's "mix"): the stage line across */
        nd = document.querySelector('#ig-dock .ds-ln-st') || document.querySelector('#ig-dock .ds-sp-st'), gl = document.getElementById('pd-glance'), box = document.getElementById('igd-input');
        if (!dock || !feed || !gl || !box) return null;
        const d = dock.getBoundingClientRect(), b = box.getBoundingClientRect(), n = nd ? nd.getBoundingClientRect() : null;
        const wide = [...dock.querySelectorAll('#pd-needs *, #pd-glance *, [data-ig-chips] *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > d.right + 1; }).length;
        return { needs: !n || n.top >= d.top, box: b.bottom <= innerHeight + 1 && b.top >= 0, wide, side: document.documentElement.scrollWidth <= innerWidth + 1 }; }, null, 8000);
      check(`7 ${w}×${ht}: the cards and the box in view, nothing past the panel's edge`, !!fit && fit.needs && fit.box && fit.wide === 0 && fit.side, JSON.stringify(fit));
      await page.evaluate(() => { if (typeof toastsClear === 'function') toastsClear(); });
      await shot(page, `3-panel-beside-a-paper-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
