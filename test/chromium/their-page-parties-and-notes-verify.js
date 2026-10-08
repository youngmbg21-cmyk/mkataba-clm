/* ============================================================
   their-page-parties-and-notes-verify — the overnight run's stream F, driven
   in a real browser against a real server (8 Oct 2026)
   ============================================================
     1  THREE PARTIES (owner's D2): Nordfrakt's link names Nordfrakt — the
        sheet lists all three parties, the open point waits on "you", the head
        says which party they are; Juno's link says the same about Juno.
     2  A REFUSED POINT IS NOT AGREED: the column reads "Settled", the refused
        row carries a cross and "not taken", the taken row a tick.
     3  A NOTE FROM OUR SIDE rings their bell and counts on their Notes door;
        opening the drawer clears both.
     4  A NOTE FROM THEIR SIDE rings OUR bell (note-theirs); opening the notes
        drawer clears it.
   Every driven half is guarded; waits ask for the state, bounded. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.SHOTS_DIR || path.join(__dirname, 'shots', 'their-page-parties-and-notes');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DEAL = {
  id: 'MK-F1', contractNo: 'MK-F1', name: 'Three-way Haulage',
  counterparty: 'Juno Limited', counterpartyEmail: 'legal@juno.example',
  parties: [
    { id: 'py_us', name: 'Highland Corporate Ltd', side: 'ours' },
    { id: 'py_a', name: 'Juno Limited', role: 'Supplier', side: 'theirs', involvement: 'negotiate', email: 'legal@juno.example' },
    { id: 'py_b', name: 'Nordfrakt AB', role: 'Carrier', side: 'theirs', involvement: 'negotiate', email: 'avtal@nordfrakt.example' },
  ],
  folder: 'proc', value: 900000, valueType: 'standard', status: 'Under Review',
  template: 'RM', lastAction: '1 Oct 2026', expiry: '2029-06-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 900000, currency: 'KES' },
  comments: [], signatures: [], obligations: [], rounds: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }],
  changes: [
    { id: 'CHG-1', status: 'pending', authorSide: 'owner', clauseId: 'c9', clauseLabel: '9. Liability Cap',
      kind: 'edit', changeType: 'edit', author: 'Amina Otieno', createdAt: iso(-2), seq: 1 },
    { id: 'CHG-2', status: 'rejected', authorSide: 'owner', clauseId: 'c6', clauseLabel: '6. Payment',
      kind: 'edit', changeType: 'edit', author: 'Amina Otieno', createdAt: iso(-3), resolvedAt: iso(-2), seq: 2 },
    { id: 'CHG-3', status: 'accepted', authorSide: 'counterparty', clauseId: 'c4', clauseLabel: '4. Term',
      kind: 'edit', changeType: 'edit', author: 'Lars', createdAt: iso(-4), resolvedAt: iso(-3), seq: 3 },
  ],
  negotiation: { round: 1, rounds: [] },
  body: '<h2>4. Term</h2><p>Two years.</p><h2>6. Payment</h2><p>Thirty days.</p><h2>9. Liability Cap</h2><p>Cap at 150%.</p>',
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [DEAL], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 9000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const seeded = await until(page, () => typeof getContract === 'function' && !!getContract('MK-F1'), null, 15000);
    ok('0a the three-party fixture is in the book', seeded);
    const mint = (partyId, who) => page.evaluate(async a => {
      const c = getContract('MK-F1');
      await ensureFull(c);
      const payload = buildSharePayload(c, null, { org: FIRST_PARTY, name: 'Amina Otieno' }, { purpose: 'negotiate', partyId: a.partyId || undefined });
      const x = await api('shares', 'POST', { payload, channel: 'link', purpose: 'negotiate', partyId: a.partyId || undefined,
        recipient: { name: a.who, email: a.who.toLowerCase() + '@example.org' } });
      return x && (x.token || (x.share && x.share.token));
    }, { partyId, who });
    const tokB = await mint('py_b', 'Lars');
    const tokA = await mint(null, 'Grace');
    ok('0b a link for Nordfrakt and one for Juno are minted', !!tokB && !!tokA);
    /* Our note into Nordfrakt's room, through the product's own route. */
    const posted = await page.evaluate(async () => { try {
      const r = await api('contracts/MK-F1/messages', 'POST', { topic: 'general', body: 'Please look at the cap before Friday.', partyId: 'py_b' });
      return !!(r && r.ok); } catch (e) { return e.message; } });
    ok('0c our note is posted into Nordfrakt\'s room', posted === true, posted);

    /* ===== 1 + 2 + 3: Nordfrakt's page ===== */
    const gctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const g = await gctx.newPage();
    g.on('pageerror', e => errs.push('guest: ' + e.message));
    await g.goto(h.base + '/#share=t:' + tokB, { waitUntil: 'networkidle' });
    const landed = await until(g, () => !!document.querySelector('#pt-where-pane .ds-sheet'), null, 15000);
    ok('1a their page lands on the shared sheet', landed);
    const s = await g.evaluate(() => {
      const sheet = document.querySelector('#pt-where-pane .ds-sheet');
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      return { chips: [...sheet.querySelectorAll('.ds-pch')].map(txt),
        open: [...sheet.querySelectorAll('.ds-cols > div:nth-child(2) .ds-li')].map(txt),
        settledHead: txt(sheet.querySelector('.ds-cols > div:nth-child(1) .ds-h')),
        settled: [...sheet.querySelectorAll('.ds-cols > div:nth-child(1) .ds-li')].map(li => ({ t: txt(li), refused: li.classList.contains('is-refused'),
          mark: txt(li.querySelector('.ds-tick')) })),
        facts: txt(sheet.querySelector('.ds-facts')),
        party: (window.PORTAL_OPTS && PORTAL_OPTS.payload && PORTAL_OPTS.payload.party) || null,
        parties: ((window.PORTAL_OPTS && PORTAL_OPTS.payload && PORTAL_OPTS.payload.contract.parties) || []).map(p => Object.keys(p).join(',')) };
    });
    ok('1b the sheet names all three parties', s.chips.some(t => /Juno/.test(t)) && s.chips.some(t => /Nordfrakt/.test(t)) && s.chips.some(t => /Highland/.test(t)), JSON.stringify(s.chips));
    ok('1c an outside party that negotiates is said to sign too', s.chips.filter(t => /Nordfrakt|Juno/.test(t)).every(t => /signs/.test(t)), JSON.stringify(s.chips));
    ok('1d the open point waits on "you" (Nordfrakt), not on Juno', s.open.some(t => /Liability/.test(t) && /with you/.test(t)), JSON.stringify(s.open));
    ok('1e the link carries its own party, and no address in the party list', s.party && s.party.id === 'py_b' && s.parties.every(k => !/email|address/.test(k)), JSON.stringify(s.party));
    ok('1f the facts say what waits on you', /Waiting on you/.test(s.facts), s.facts);
    ok('2a the column is headed Settled, not Agreed', /^Settled/.test(s.settledHead), s.settledHead);
    const refused = s.settled.find(r => /Payment/.test(r.t)), taken = s.settled.find(r => /Term/.test(r.t));
    ok('2b the refused point wears a cross and "not taken"', refused && refused.refused && refused.mark === '✕' && /not taken/.test(refused.t), JSON.stringify(refused));
    ok('2c the taken point wears a tick', taken && !taken.refused && taken.mark === '✓', JSON.stringify(taken));
    await g.screenshot({ path: path.join(OUT, '01-nordfrakt-where.png') });

    const n0 = await g.evaluate(() => { const n = document.getElementById('pt-notes-n'); return { door: n && !n.hidden ? n.textContent : null,
      rows: (typeof PT_ALERT_ROWS !== 'undefined' ? [] : []), alerts: [...document.querySelectorAll('#pt-alerts-body [data-pt-kind]')].map(x => x.getAttribute('data-pt-kind')) }; });
    ok('3a our note counts on their Notes door', n0.door === '1', JSON.stringify(n0));
    ok('3b and it is a row in their bell', n0.alerts.includes('note'), JSON.stringify(n0.alerts));
    const opened = await g.evaluate(() => { const b = document.getElementById('pt-notes-door'); if (!b) return false; b.click(); return true; });
    ok('3c the Notes door is there to press', opened);
    const cleared = await until(g, () => { const n = document.getElementById('pt-notes-n'); return !!n && n.hidden
      && ![...document.querySelectorAll('#pt-alerts-body [data-pt-kind]')].some(x => x.getAttribute('data-pt-kind') === 'note'); }, null, 5000);
    ok('3d reading the notes clears the door\'s count and the bell row', cleared);
    await g.screenshot({ path: path.join(OUT, '02-nordfrakt-notes.png') });

    /* ===== 1 again: Juno's page ===== */
    const jctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const j = await jctx.newPage();
    j.on('pageerror', e => errs.push('juno: ' + e.message));
    await j.goto(h.base + '/#share=t:' + tokA, { waitUntil: 'networkidle' });
    await until(j, () => !!document.querySelector('#pt-where-pane .ds-sheet'), null, 15000);
    const jo = await j.evaluate(() => ({ open: [...document.querySelectorAll('#pt-where-pane .ds-cols > div:nth-child(2) .ds-li')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      party: PORTAL_OPTS.payload && PORTAL_OPTS.payload.party,
      notes: (document.getElementById('pt-notes-n') || {}).hidden }));
    ok('1g Juno\'s link is Juno\'s — the open point waits on "you" there too', jo.party && jo.party.id === 'py_a' && jo.open.some(t => /with you/.test(t)), JSON.stringify(jo));
    ok('1h our note to Nordfrakt does not count on Juno\'s door', jo.notes === true);

    /* ===== 4: their note rings our bell ===== */
    const theirs = await g.evaluate(async t => { const r = await fetch('/api/shares/' + t + '/messages', { method: 'POST',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ author: 'Lars Berg', topic: 'general', body: 'Friday works.' }) });
      return r.status; }, tokB);
    ok('4a their note is posted', theirs === 200, theirs);
    const rung = await page.evaluate(async () => { await refreshWaitingQuestions();
      return buildAlerts().filter(a => a.kind === 'note-theirs' && a.id === 'MK-F1').map(a => a.text); });
    ok('4b our bell has a row for their note', rung.length === 1, JSON.stringify(rung));
    await page.evaluate(() => openNotesPanel('MK-F1', null, { force: true }));
    const quiet = await until(page, () => !buildAlerts().some(a => a.kind === 'note-theirs' && a.id === 'MK-F1'), null, 6000);
    ok('4c opening the notes drawer clears it', quiet);
    /* ===== 5: a withdrawn link still says whose it was (F13) ===== */
    await page.evaluate(async t => { await api('shares/' + t + '/revoke', 'POST', {}); }, tokA);
    await j.goto(h.base + '/#share=t:' + tokA, { waitUntil: 'networkidle' });
    const who = await until(j, () => !!document.getElementById('pt-gone-who'), null, 10000)
      ? await j.evaluate(() => document.getElementById('pt-gone-who').textContent.replace(/\s+/g, ' ').trim()) : '';
    ok('5a the withdrawn page names the contract and who sent it', /Three-way Haulage/.test(who) && /Amina Otieno/.test(who), who);
    ok('no page errors', !errs.length, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the stage ran to the end', false, e.stack || e.message);
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
