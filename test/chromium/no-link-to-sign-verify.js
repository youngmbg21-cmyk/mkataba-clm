/* Chromium verification: NO LINK TO SIGN (Young ruled 27 Sep 2026: "Fix it
   and build a sixth agent. Afterwards, make sure the highlighted card stays
   stagnant and does not move when you click around the different agents").
   ====================================================================
   f412 pins what the code SAYS. This file measures what a reader SEES and
   DOES on the real app, in three parts:

   1  CAN THEY STILL ANSWER — the Negotiations list says "Mine" of a deal whose
      only link ran out, on first look and after a reload, and keeps saying
      "Theirs" of a deal whose one-time link is unused even after the deal has
      been opened (the share cache used to count standing links only).
   2  THE SIXTH AGENT — "No link to sign" sits second, lists the reply-stuck
      and the signing-stuck deal, and its "Send a fresh link" sends on the panel's one press (4 Oct 2026; it asked first before),
      naming who it goes to, then sends — through the round send for an
      answer, through the Signing tab's own act for a signature — and the deal
      leaves Ready for Done recently.
   3  THE LIST STAYS STILL — measured as a rectangle and as element identity,
      at rest and with the right side scrolled, pressing every agent.

   THE STAGE is a seeded workspace (no approval rules, so a signing link may
   be issued) with three deals put into states through the server's own
   routes, a link expired by backdating its row as time passing would.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out.
   AT THE PARENT (e351a91) 16 of 21 FAIL: 1a (the ran-out deal read
   "Theirs"), 1c (the unused one-time link read "Mine" once opened), 1d, 1e,
   every check in part 2 (there is no sixth agent), and 3b/3d (every press
   tore the list down and drew it again — the rows are new elements after each
   one). 1b, 3a and 3c are CONTROLS and pass on both sides: on this stage the
   parent's list happened to land on the same pixels after its redraw, and a
   redraw is what the reader saw move.

   Run: node test/chromium/no-link-to-sign-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');
const { DatabaseSync } = require('node:sqlite');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'no-link-to-sign');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const payloadFor = (id, over = {}) => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Agreement', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] }, ...over });
/* A deal whose change of OURS went out eight days ago: pending, handed over. */
const inRound = (id, name, cp) => {
  const c = fixtureContract(id, name, cp, FOLDER_A, 480000, 'Under Review', DOC);
  c.changes = [{ id: 'CHG-1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'owner',
    author: 'Amina Otieno', summary: '“30” → “45”', newText: 'Invoices are payable within forty-five (45) days.',
    oldText: 'Invoices are payable within thirty (30) days.', createdAt: iso(-9) }];
  c.negotiation = { round: 1, turn: 'counterparty', turnAt: iso(-8), rounds: [] };
  return c;
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    /* ---- the stage, through the server's own routes ---- */
    const put = async c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await put(inRound('MK-NL1', 'Cane Supply Agreement', 'Nordkust Industri AB'));
    await put(inRound('MK-NL2', 'Freight Services Agreement', 'Kabras Sugar'));
    const ns = fixtureContract('MK-NS1', 'Distribution Agreement', 'Savanna Foods Ltd', FOLDER_A, 480000, 'Under Review', DOC);
    ns.signerPlan = [
      { id: 'sg-cp-1', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@savanna.example', role: 'Director', signed: false },
      { id: 'sg-us-1', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'Director', signed: false }];
    await put(ns);
    const mint = (id, over) => W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(id, { purpose: over.purpose }), durable: !!over.durable, channel: 'link', purpose: over.purpose,
      recipient: over.recipient, signerId: over.signerId } });
    const nl1 = await mint('MK-NL1', { purpose: 'negotiate', durable: true, recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.example' } });
    await mint('MK-NL2', { purpose: 'negotiate', durable: false, recipient: { name: 'Otieno Kabras', email: 'ops@kabras.example' } });
    const ns1 = await mint('MK-NS1', { purpose: 'sign', durable: false, signerId: 'sg-cp-1', recipient: { name: 'Grace Njeri', email: 'grace@savanna.example' } });
    await W.admin.json('/api/shares/' + ns1.token + '/revoke', { method: 'POST', body: {} });
    /* NL1's standing link ran out three days ago — a row backdated, as time passing would. */
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    db.prepare('UPDATE shares SET expires_at=?, created_at=? WHERE token=?').run(iso(-3), iso(-8), nl1.token);
    db.close();

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    const login = async () => {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);
      if (await page.$('#li-email')) {
        await page.fill('#li-email', 'admin@example.co.ke');
        await page.fill('#li-pass', 'adminpassword1');
        await page.click('#li-go');
      }
      await page.waitForTimeout(2200);
      await page.keyboard.press('Escape').catch(() => {});
      const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(500); }
    };
    await login();
    ok('the stage: the three deals are in the book', await page.evaluate(() =>
      ['MK-NL1', 'MK-NL2', 'MK-NS1'].every(id => !!getContract(id))));

    /* ===== 1. CAN THEY STILL ANSWER ===== */
    const listRows = () => page.evaluate(async () => {
      if (window.insForce) insForce(false);
      openNegotiations({ list: true });
      await new Promise(r => setTimeout(r, 700));
      const out = {};
      let band = '';
      for (const tr of document.querySelectorAll('tr.ngl-band, tr[data-row]')) {
        if (tr.classList.contains('ngl-band')) { band = (tr.querySelector('.ngl-band-k') || {}).textContent || ''; continue; }
        const w = tr.querySelector('.ngl-w');
        out[tr.getAttribute('data-row')] = { band: band.trim(), word: w ? w.textContent.trim() : null, say: w ? (w.getAttribute('title') || '') : null };
      }
      return out;
    });
    let rows = await listRows();
    const r1 = rows['MK-NL1'] || {}, r2 = rows['MK-NL2'] || {};
    ok('1a on first look, a deal whose only link ran out is MINE, under "Waiting on you" — nothing has to be opened first',
      r1.word === 'Mine' && /waiting on you/i.test(r1.band) && /no live copy/i.test(r1.say || ''), JSON.stringify(r1));
    ok('1b CONTROL: a deal with an unused one-time link is theirs', r2.word === 'Theirs', JSON.stringify(r2));
    /* Open NL2 — the negotiation page fills the share cache — and come back. */
    await page.evaluate(async () => { openRedlineWorkbench('MK-NL2'); await new Promise(r => setTimeout(r, 1500)); });
    rows = await listRows();
    ok('1c and STILL theirs once the deal has been opened (an unused one-time link can be answered on)',
      (rows['MK-NL2'] || {}).word === 'Theirs', JSON.stringify(rows['MK-NL2']));
    await login();
    rows = await listRows();
    ok('1d after a reload: the stuck deal is still mine and the live one theirs',
      (rows['MK-NL1'] || {}).word === 'Mine' && (rows['MK-NL2'] || {}).word === 'Theirs',
      JSON.stringify({ nl1: rows['MK-NL1'], nl2: rows['MK-NL2'] }));
    const fact = await page.evaluate(async () => {
      openWorkspace('MK-NL1'); await new Promise(r => setTimeout(r, 1500));
      const f = [...document.querySelectorAll('.room-facts .ngl-w, #ws-head .ngl-w')];
      return f.length ? f[0].textContent.trim() : null;
    });
    ok('1e the contract\'s own head says the same: whose move is mine', fact === 'Mine', String(fact));

    /* ===== 2. THE SIXTH AGENT ===== */
    await page.evaluate(() => setView('agents'));
    await page.waitForTimeout(900);
    const lst = await page.evaluate(() => ({
      rows: [...document.querySelectorAll('[data-ag-agent]')].map(b => b.getAttribute('data-ag-agent')),
      name: ((document.querySelector('[data-ag-agent="link"] .ag-nm') || {}).textContent || '').trim(),
      rail: ((document.querySelector('[data-count="agents"]') || {}).textContent || '').trim(),
      ready: (typeof agentsData === 'function') ? agentsData().ready : null,
    }));
    ok('2a "No link to sign" is the sixth agent and sits second, under "Their round came back"',
      /* Seven agents since 27 Sep 2026 (Our promises); this one stays second. */
      lst.rows[0] === 'round' && lst.rows[1] === 'link' && lst.rows.length === 7 && lst.name === 'No link to sign', JSON.stringify(lst));
    ok('2b the rail\'s door counts what is ready here, this agent\'s work included', lst.rail === String(lst.ready) && lst.ready >= 2,
      JSON.stringify({ rail: lst.rail, ready: lst.ready }));
    const agentRow = await page.$('[data-ag-agent="link"]');
    if (agentRow) { await agentRow.click(); await page.waitForTimeout(500); }
    const cards = await page.evaluate(() => [...document.querySelectorAll('#ag-main [data-ag-open]')].map(b => ({
      key: b.getAttribute('data-ag-open'), text: b.textContent.replace(/\s+/g, ' ').trim() })));
    await page.screenshot({ path: path.join(OUT, 'link-agent.png') });
    const c1 = cards.find(x => x.key === 'reply:MK-NL1'), c2 = cards.find(x => x.key === 'sign:MK-NS1');
    ok('2c the stuck answer and the stuck signature are both ready; the live deal is not',
      !!c1 && !!c2 && !cards.some(x => /MK-NL2/.test(x.key)), JSON.stringify(cards.map(x => x.key)));
    ok('2d the card says what is stuck, what became of their link, for how long, and who it last went to',
      !!c1 && /Cannot answer/.test(c1.text) && /ran out on/.test(c1.text) && /Stuck \d+ days?/.test(c1.text) && /Last sent to Erik Lindqvist/.test(c1.text),
      c1 && c1.text);
    ok('2e the signing card names whose turn it is and that their link was cancelled',
      !!c2 && /Cannot sign/.test(c2.text) && /Grace Njeri/.test(c2.text) && /cancelled/.test(c2.text), c2 && c2.text);

    /* The fresh link for an answer: it asks first, naming who, then sends. */
    const openCard = async key => { const b = await page.$(`#ag-main [data-ag-open="${key}"]`); if (b) { await b.click(); await page.waitForTimeout(500); } return !!b; };
    let asked = null, sent = null;
    if (await openCard('reply:MK-NL1')) {
      const panel = await page.evaluate(() => ({
        title: ((document.querySelector('.ag-p-title') || {}).textContent || '').trim(),
        acts: [...document.querySelectorAll('[data-ag-act]')].map(b => b.getAttribute('data-ag-act') + ':' + b.textContent.trim()) }));
      await page.screenshot({ path: path.join(OUT, 'link-panel.png') });
      ok('2f the panel says what the work is and carries the fresh link and the send screen', /cannot answer/i.test(panel.title)
        && panel.acts[0] === 'fresh:Send a fresh link' && panel.acts.includes('sendscreen:Choose who it goes to'), JSON.stringify(panel));
      /* REVERSED 4 Oct 2026 (Young: "i do not need another press to send the
         link. The one in the side panel should be enough"): the panel names
         who it last went to, and its press sends. */
      const named = await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
      await page.click('[data-ag-act="fresh"]');
      await page.waitForTimeout(600);
      asked = await page.evaluate(() => !!document.getElementById('confirm-overlay'));
      ok('2g the panel\'s one press sends — no second question — and the panel named who it goes to', !asked && /Erik Lindqvist/.test(named), JSON.stringify({ asked }));
      await page.waitForTimeout(2500);
      sent = await page.evaluate(async () => {
        const r = await api('contracts/MK-NL1/shares');
        const open = (r.shares || []).filter(s => s.durable && !s.revokedAt && !(s.expiresAt && s.expiresAt < new Date().toISOString()));
        return { open: open.length, to: open.map(s => s.recipientEmail), reply: (r.reach || {}).reply,
          ready: agentsData().agents.link.ready.map(x => x.key), done: agentsData().agents.link.done.map(x => x.key),
          doneText: [...document.querySelectorAll('.ag-runs tbody tr')].map(t => t.textContent.replace(/\s+/g, ' ').trim()) };
      });
    }
    ok('2h the fresh link is a working link to the same person, and the server now says they can answer',
      !!sent && sent.open === 1 && sent.to[0] === 'erik@nordkust.example' && sent.reply === 'live', JSON.stringify(sent));
    ok('2i the deal left Ready for Done recently, which says what went and to whom',
      !!sent && !sent.ready.includes('reply:MK-NL1') && sent.done.some(k => /^relinked:MK-NL1/.test(k))
        && sent.doneText.some(t => /Fresh link sent to Erik Lindqvist/.test(t)), JSON.stringify(sent && { ready: sent.ready, done: sent.done, t: sent.doneText }));
    rows = await listRows();
    ok('2j and the Negotiations list says theirs now', (rows['MK-NL1'] || {}).word === 'Theirs', JSON.stringify(rows['MK-NL1']));

    /* The fresh link for a signature: asks first, then the Signing tab's own act. */
    await page.evaluate(() => setView('agents'));
    await page.waitForTimeout(700);
    const linkRow = await page.$('[data-ag-agent="link"]'); if (linkRow) { await linkRow.click(); await page.waitForTimeout(400); }
    let signAsk = null, signed = null;
    if (await openCard('sign:MK-NS1')) {
      const signNamed = await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
      await page.click('[data-ag-act="fresh"]');
      await page.waitForTimeout(600);
      signAsk = { asked: await page.evaluate(() => !!document.getElementById('confirm-overlay')), named: /Grace Njeri/.test(signNamed) };
      await page.waitForTimeout(3000);
      signed = await page.evaluate(async () => {
        const r = await api('contracts/MK-NS1/shares');
        return { view: state.view, id: state.activeId, live: (r.shares || []).filter(s => s.purpose === 'sign' && !s.revokedAt).length,
          sign: (r.reach || {}).sign || null, fresh: ((r.reach || {}).fresh || []).map(f => f.kind) };
      });
    }
    ok('2k the signing link goes on the panel\'s one press, the panel naming the signer whose turn it is', !!signAsk && !signAsk.asked && signAsk.named, JSON.stringify(signAsk));
    ok('2l it lands on the contract and the signing route issues a fresh link — the Signing tab\'s own act',
      !!signed && signed.view === 'workspace' && signed.id === 'MK-NS1' && signed.live >= 1 && signed.sign === null && signed.fresh.includes('sign'),
      JSON.stringify(signed));
    await page.screenshot({ path: path.join(OUT, 'signing-tab.png') });

    /* ===== 3. THE LIST STAYS STILL ===== */
    await page.evaluate(() => setView('agents'));
    await page.waitForTimeout(900);
    const measure = () => page.evaluate(() => {
      const l = document.querySelector('.ag-list');
      const first = document.querySelector('#ag-main > .ag-card');
      const r = l ? l.getBoundingClientRect() : null;
      return { list: r ? [Math.round(r.left), Math.round(r.top * 10) / 10, Math.round(r.width), Math.round(r.height)].join(',') : null,
        top: r ? r.top : null, card: first ? first.getBoundingClientRect().top : null,
        marks: [...document.querySelectorAll('[data-ag-agent]')].filter(b => b.dataset.probe === '1').length };
    });
    const rest = await measure();
    ok('3a at rest the list is level with the cards', rest.top != null && rest.card != null && Math.abs(rest.top - rest.card) < 0.5,
      JSON.stringify({ list: rest.top, card: rest.card }));
    await page.evaluate(() => document.querySelectorAll('[data-ag-agent]').forEach(b => { b.dataset.probe = '1'; }));
    const keys = await page.evaluate(() => [...document.querySelectorAll('[data-ag-agent]')].map(b => b.getAttribute('data-ag-agent')));
    const moved = [];
    for (const k of keys.concat(keys.slice().reverse())) {
      const b = await page.$(`[data-ag-agent="${k}"]`); if (!b) { moved.push(k + ':gone'); continue; }
      await b.click(); await page.waitForTimeout(250);
      const m = await measure();
      if (m.list !== rest.list || m.marks !== keys.length) moved.push(k + ':' + m.list + ':' + m.marks);
    }
    ok('3b pressing every agent, the list does not move by a pixel and its rows are the same rows', moved.length === 0, moved.join(' | ') || rest.list);
    /* Scroll the right side as a reader does, then press every agent again. */
    const tall = keys.find(k => k === 'link') || keys[0];
    const tb = await page.$(`[data-ag-agent="${tall}"]`); if (tb) { await tb.click(); await page.waitForTimeout(250); }
    await page.evaluate(() => { const m = document.getElementById('ag-main'); if (m) { m.style.minHeight = ''; } });
    const box = await page.evaluate(() => { const m = document.getElementById('ag-main'); const r = m ? m.getBoundingClientRect() : null; return r ? { x: r.left + r.width / 2, y: r.top + 200 } : null; });
    if (box) { await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, 600); await page.waitForTimeout(400); }
    const scrolled = await measure();
    ok('3c scrolling the right side leaves the list where it was', scrolled.list === rest.list, JSON.stringify({ rest: rest.list, now: scrolled.list }));
    const moved2 = [];
    for (const k of keys) {
      const b = await page.$(`[data-ag-agent="${k}"]`); if (!b) { moved2.push(k + ':gone'); continue; }
      await b.click(); await page.waitForTimeout(250);
      const m = await measure();
      if (m.list !== rest.list || m.marks !== keys.length) moved2.push(k + ':' + m.list + ':' + m.marks);
    }
    ok('3d and pressing every agent from there, it still does not move', moved2.length === 0, moved2.join(' | ') || rest.list);
    await page.screenshot({ path: path.join(OUT, 'agents.png') });

    ok('no page errors', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 600));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
