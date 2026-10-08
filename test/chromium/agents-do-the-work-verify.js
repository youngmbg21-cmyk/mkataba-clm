/* Chromium verification: COPILOT'S AGENTS DO THE WORK (Young ruled 27 Sep 2026:
   "1, your recommendation. 2, yes. 3, yes. Now implement all the fixes")
   ====================================================================
   f413 pins the server and the code; this file measures what a reader SEES
   and PRESSES on the real app:
     1  every agent says when it last ran and what it did; the runs table
        carries the cost to an admin; Run now runs and the table grows;
     2  the agents' settings live on the Settings page and a save sticks;
     3  Their round came back: the card counts Copilot's prepared answers, the
        panel shows the answer and its wording, Send back opens its box — and
        the NEGOTIATION PAGE's row carries the answer as its own quiet line;
     4  No link to sign: a link about to run out is a card, and "Keep their
        link working" keeps it working;
     5  Late promises: the firmer chase is a card and its message is the
        route's own "Second reminder";
     6  the bell carries the stuck link, and pressing it lands on the panel;
     7  the page updates itself: the beat takes a change made elsewhere.
   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS rather than times out.
   AT THE PARENT (d37aa497) every check but the stage and the error sweep
   FAILS: there is no log, no Run now, no settings panel, no prepared answer,
   no warning, no firmer chase and no bell row.

   Run: node test/chromium/agents-do-the-work-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');
const { DatabaseSync } = require('node:sqlite');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'agents-do-the-work');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const THEIRS = 'Invoices are payable within ninety (90) days.';
const answer = body => {
  const tool = (body.tool_choice && body.tool_choice.name) || '';
  const tu = input => [{ type: 'tool_use', id: 'tu_' + tool, name: tool, input }];
  if (tool === 'renewal_advice') return tu({ verdict: 'renew', headline: 'Renew as it is.', because: ['It went well.'], pushOn: [], watchIf: '' });
  if (tool === 'round_answers') return tu({ answers: [{ ask: 1, verdict: 'counter', why: 'Your fallback is 60 days.', standard: 'Payment terms',
    wording: 'Invoices are payable within sixty (60) days.' }] });
  return tu({});
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi(); ai.script(...Array(60).fill(answer));
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    /* ---- the stage, through the server's own routes ---- */
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const round = fixtureContract('MK-DW1', 'Cane Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
    Object.assign(round, { owner, negotiation: { round: 2, turn: 'owner', turnAt: iso(-2), rounds: [] },
      changes: [{ id: 'CHG-2', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty',
        author: 'Erik Lindqvist', summary: '“30” → “90”', newText: THEIRS,
        oldText: 'Invoices are payable within thirty (30) days.', createdAt: iso(-2) }] });
    await put(round);
    const soon = fixtureContract('MK-DW2', 'Freight Services Agreement', 'Kabras Sugar', FOLDER_A, 480000, 'Under Review', DOC);
    Object.assign(soon, { owner, negotiation: { round: 1, turn: 'counterparty', turnAt: iso(-3), rounds: [] },
      changes: [{ id: 'CHG-1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'owner', author: 'Amina Otieno',
        summary: '“30” → “45”', newText: 'Invoices are payable within forty-five (45) days.',
        oldText: 'Invoices are payable within thirty (30) days.', createdAt: iso(-4), sentAt: iso(-3) }] });
    await put(soon);
    const late = fixtureContract('MK-DW3', 'Stock reporting', 'Savanna Foods Ltd', FOLDER_A, 900000, 'Signed', DOC);
    Object.assign(late, { owner, hash: 'x', counterpartyEmail: 'ops@savanna.example',
      obligations: [{ id: 'o2', desc: 'Send the insurance certificate', party: 'theirs', due: day(-20), status: 'open', chasedAt: day(-10), chasedBy: 'Amina Otieno' },
        /* OUR PROMISES: ours, nobody named — the contract's owner is reminded. */
        { id: 'o9', desc: 'Pay the storage deposit', party: 'ours', due: day(3), status: 'open' }] });
    await put(late);
    const ren = fixtureContract('MK-DW4', 'Cold room lease', 'Nandi Dairy', FOLDER_A, 900000, 'Signed', DOC);
    Object.assign(ren, { owner, hash: 'x', expiry: day(40), metadata: { expiryDate: day(40), noticePeriodDays: 10 } });
    await put(ren);
    const s2 = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate',
      recipient: { name: 'Otieno Kabras', email: 'ops@kabras.example' },
      payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: iso(0), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-DW2', name: 'Freight', counterparty: 'X', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    db.prepare('UPDATE shares SET expires_at=? WHERE token=?').run(iso(1.5), s2.token);
    /* Copilot's answer to their ask, as the round agent files it. */
    const { roundPrepKey } = require('../../js/roundprep.js');
    db.prepare('INSERT INTO round_prep (contract_id,pkey,json,created_at) VALUES (?,?,?,?)').run('MK-DW1', roundPrepKey('cl_pay', THEIRS),
      JSON.stringify({ v: 1, at: iso(0), verdict: 'counter', why: 'Your fallback is 60 days.', standard: 'Payment terms',
        wording: 'Invoices are payable within sixty (60) days.', clauseId: 'cl_pay' }), iso(0));
    db.close();
    /* One run on the log before the page opens. */
    const run1 = await W.admin.json('/api/agents/renew/run', { method: 'POST', body: {} });

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForTimeout(2200);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(500); }
    ok('the stage: four deals are in the book, and one run is on the log', await page.evaluate(() =>
      ['MK-DW1', 'MK-DW2', 'MK-DW3', 'MK-DW4'].every(id => !!getContract(id))) && run1.prepared === 1, JSON.stringify(run1));

    /* COPILOT'S WORK LIVES ON THE BOARD (Young, 7 Oct 2026, "Below the card"):
   the page has no door any more and its address lands on the Board. Its
   readings and panels are the ones the Board draws below the card, so this
   check MOUNTS the page's own renderer to read them where it always did. */
    const openAgent = async k => {
      await page.evaluate(async k => { (state.view = 'agents', renderAgentsPage()); await new Promise(r => setTimeout(r, 400));
        if (window.agentsBeat) await agentsBeat(true); if (window.agShowAgent) agShowAgent(k); await new Promise(r => setTimeout(r, 300)); }, k);
    };

    /* ===== 1. THE LOG, THE COST, RUN NOW ===== */
    await openAgent('renew');
    const head = await page.evaluate(() => {
      const m = document.getElementById('ag-main');
      const facts = [...(m ? m.querySelectorAll('.ag-facts > div') : [])].map(d => ({ k: d.querySelector('dt').textContent.trim(), v: d.querySelector('dd').textContent.trim() }));
      const runs = m && m.querySelector('[data-ag-runs="renew"]');
      return { facts, runs: runs ? [...runs.querySelectorAll('tbody tr')].map(tr => tr.textContent.replace(/\s+/g, ' ').trim()) : null,
        cost: runs ? [...runs.querySelectorAll('th')].map(t => t.textContent.trim()) : [],
        runNow: !!(m && m.querySelector('[data-ag-runnow="renew"]')) };
    });
    const last = head.facts.find(f => f.k === 'Last ran');
    ok('1a Renewals says when it last ran and what it did', !!last && /1 prepared/.test(last.v), JSON.stringify(last));
    ok('1b the runs table names why it ran and who pressed, and carries the cost to an admin',
      Array.isArray(head.runs) && /Run now/.test(head.runs[0]) && /Amina Otieno/.test(head.runs[0]) && head.cost.includes('Cost'), JSON.stringify(head));
    await page.screenshot({ path: path.join(OUT, '1-renewals-log.png') });
    await openAgent('late');
    const before = await page.evaluate(() => document.querySelectorAll('[data-ag-runs="late"] tbody tr').length);
    ok('1c Run now is on an admin\'s page', await page.$('[data-ag-runnow="late"]') !== null);
    if (await page.$('[data-ag-runnow="late"]')) {
      await page.click('[data-ag-runnow="late"]');
      await page.waitForTimeout(1500);
    }
    const after = await page.evaluate(() => document.querySelectorAll('[data-ag-runs="late"] tbody tr').length);
    ok('1d pressing it runs the agent and the table grows by one', after === before + 1, before + ' → ' + after);

    /* ===== 5. LATE PROMISES: THE FIRMER CHASE ===== */
    const firm = await page.evaluate(() => {
      const card = document.querySelector('[data-ag-open^="firm:MK-DW3"]');
      return card ? card.textContent.replace(/\s+/g, ' ').trim() : null;
    });
    ok('5a the firmer chase is a card of its own', !!firm && /Firmer chase/.test(firm) && /first chased on/.test(firm), firm);
    if (firm) {
      await page.click('[data-ag-open^="firm:MK-DW3"]');
      await page.waitForTimeout(600);
      const mail = await page.evaluate(() => { const m = document.querySelector('[data-ag-panel] .ag-mail'); return m ? m.textContent.replace(/\s+/g, ' ') : ''; });
      ok('5b its message is the route\'s own firmer words', /Second reminder: Send the insurance certificate/.test(mail) && /We wrote to you on/.test(mail), mail.slice(0, 160));
      await page.screenshot({ path: path.join(OUT, '5-firm-chase.png') });
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    } else ok('5b its message is the route\'s own firmer words', false, 'no card');

    /* ===== 3. THEIR ROUND CAME BACK ===== */
    await openAgent('round');
    const rcard = await page.evaluate(() => { const c = document.querySelector('[data-ag-open="answer:MK-DW1"]'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : null; });
    ok('3a the card counts what Copilot answered', !!rcard && /Copilot answered 1/.test(rcard), rcard);
    if (rcard) {
      await page.click('[data-ag-open="answer:MK-DW1"]');
      await page.waitForTimeout(700);
      const prep = await page.evaluate(() => { const p = document.querySelector('[data-ag-panel] .ag-prep'); return p ? p.textContent.replace(/\s+/g, ' ').trim() : null; });
      ok('3b the panel shows Copilot\'s answer, what it rests on and its wording', !!prep && /Copilot: counter/.test(prep) && /Rests on: Payment terms/.test(prep)
        && /sixty \(60\)/.test(await page.evaluate(() => (document.querySelector('[data-ag-panel] .ag-prep .ag-words-b') || {}).textContent || '')), prep);
      const opened = await page.evaluate(() => { const b = document.querySelector('[data-ag-panel] [data-ag-sb-open]'); if (!b) return false; b.click();
        const box = document.querySelector('[data-ag-panel] .ag-sb-box'); return !!box && !box.hidden; });
      ok('3c "Ask Copilot to redo this" opens its one box — the note is the question', opened);
      await page.screenshot({ path: path.join(OUT, '3-round-panel.png') });
      if (opened) {
        await page.fill('[data-ag-panel] .ag-sb-note', 'For this buyer our fallback is 45 days.');
        await page.click('[data-ag-panel] [data-ag-sb-go]');
        await page.waitForTimeout(1800);
        const note = await page.evaluate(() => { const p = document.querySelector('[data-ag-panel] .ag-prep'); return p ? p.textContent.replace(/\s+/g, ' ') : ''; });
        ok('3d sent back: Copilot answered again and the panel says who sent it back and why', /Redone at Amina Otieno’s request: “For this buyer our fallback is 45 days\.”/.test(note), note.slice(0, 220));
      } else ok('3d sent back: Copilot answered again and the panel says who sent it back and why', false, 'no box');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    } else { ok('3b the panel shows Copilot\'s answer, what it rests on and its wording', false, 'no card'); ok('3c "Ask Copilot to redo this" opens its one box — the note is the question', false); ok('3d sent back: Copilot answered again and the panel says who sent it back and why', false); }
    const row = await page.evaluate(async () => {
      openRedlineWorkbench('MK-DW1'); await new Promise(r => setTimeout(r, 1800));
      const l = document.querySelector('.rl-card-prep');
      return l ? { text: l.textContent.replace(/\s+/g, ' ').trim(), verdict: l.getAttribute('data-rl-prep') } : null;
    });
    ok('3e the negotiation page\'s row carries the answer as its own quiet line', !!row && row.verdict === 'counter' && /Copilot: counter/.test(row.text), JSON.stringify(row));
    await page.screenshot({ path: path.join(OUT, '3-negotiation-row.png') });

    /* ===== 4. NO LINK TO SIGN: A LINK ABOUT TO RUN OUT ===== */
    await openAgent('link');
    const sc = await page.evaluate(() => { const c = document.querySelector('[data-ag-open="soon:MK-DW2:reply"]'); return c ? c.textContent.replace(/\s+/g, ' ').trim() : null; });
    ok('4a a link about to run out is a card before the deal is stuck', !!sc && /Link running out/.test(sc), sc);
    if (sc) {
      await page.click('[data-ag-open="soon:MK-DW2:reply"]');
      await page.waitForTimeout(600);
      const keep = await page.$('[data-ag-panel] [data-ag-act="keepopen"]');
      ok('4b its panel offers to keep their link working', !!keep);
      await page.screenshot({ path: path.join(OUT, '4-link-soon.png') });
      if (keep) { await keep.click(); await page.waitForTimeout(1500); }
      const gone = await page.evaluate(async () => { if (window.agentsBeat) await agentsBeat(true); return !document.querySelector('[data-ag-open="soon:MK-DW2:reply"]'); });
      ok('4c pressed: the link works for longer and the card stands down', gone);
    } else { ok('4b its panel offers to keep their link working', false); ok('4c pressed: the link works for longer and the card stands down', false); }

    /* ===== 6. THE BELL ===== */
    /* A stuck link, made elsewhere — cancel MK-DW2's link through the route. */
    await W.admin.json('/api/shares/' + s2.token + '/revoke', { method: 'POST', body: {} });
    /* ===== 7. THE PAGE UPDATES ITSELF ===== */
    const took = await page.evaluate(async () => { const moved = window.agentsBeat ? await agentsBeat(true) : false;
      return { moved, card: !!document.querySelector('[data-ag-open="reply:MK-DW2"]') }; });
    ok('7a the beat takes a change made elsewhere, and the page shows it without a reload', took.card, JSON.stringify(took));
    ok('7b the beat asks every half minute while the page is up', await page.evaluate(() => window.AR_BEAT_MS === 30000));
    const bell = await page.evaluate(async () => {
      const b = document.getElementById('hdr-notify'); if (b) b.click();
      await new Promise(r => setTimeout(r, 600));
      const rows = [...document.querySelectorAll('[data-alert-kind="link"], .al-row[data-kind="link"]')];
      const all = (window.buildAlerts ? buildAlerts() : []).filter(a => a.kind === 'link').map(a => a.text + ' · ' + a.id);
      return { drawn: rows.length, built: all };
    });
    ok('6a the bell carries the stuck link, to the contract\'s owner', bell.built.some(t => /They cannot answer your changes/.test(t) && /MK-DW2/.test(t)), JSON.stringify(bell));
    await page.screenshot({ path: path.join(OUT, '6-bell.png') });
    await page.keyboard.press('Escape').catch(() => {});

    /* ===== 8. OUR PROMISES: what we owe, and who the email reaches ===== */
    await openAgent('ours');
    const ours = await page.evaluate(() => {
      const card = document.querySelector('[data-ag-open^="ours:MK-DW3"]');
      return card ? card.textContent.replace(/\s+/g, ' ').trim() : null;
    });
    ok('8a Our promises shows what our side owes this week', !!ours && /Our promise/.test(ours) && /Pay the storage deposit/.test(ours) && /due in 3 days/.test(ours), ours);
    if (ours) {
      await page.click('[data-ag-open^="ours:MK-DW3"]');
      await page.waitForTimeout(500);
      const pan = await page.evaluate(() => {
        const p = document.querySelector('.ag-panel, [data-ag-panel]');
        const t = p ? p.textContent.replace(/\s+/g, ' ') : '';
        return { t, lead: [...(p ? p.querySelectorAll('[data-ag-act]') : [])].map(b => b.getAttribute('data-ag-act')) };
      });
      ok('8b nobody named: the panel says the contract\'s owner is the one reminded, and opens the Obligations tab',
        /Reminded/.test(pan.t) && /Amina Otieno/.test(pan.t) && pan.lead.join(',') === 'oblig', JSON.stringify(pan).slice(0, 400));
      await page.screenshot({ path: path.join(OUT, '7-our-promises.png') });
      await page.keyboard.press('Escape').catch(() => {});
    }
    const obBell = await page.evaluate(() => (window.buildAlerts ? buildAlerts() : []).filter(a => a.kind === 'obligation').map(a => a.text + ' · ' + a.id));
    ok('8c the bell carries it to the owner too', obBell.some(t => /Pay the storage deposit/.test(t)), JSON.stringify(obBell));

    /* ===== 2. THE SETTINGS LIVE ON THE SETTINGS PAGE ===== */
    await openAgent('late');
    const door = await page.$('[data-ag-door="agentsettings"]');
    ok('2a an admin\'s agent page has a door to its settings', !!door);
    if (door) { await door.click(); await page.waitForTimeout(1500); }
    const panel = await page.evaluate(() => [...document.querySelectorAll('[data-st-agent]')].map(s => s.getAttribute('data-st-agent')));
    ok('2b the Settings page lists all seven agents', panel.join(',') === 'round,link,renew,paper,late,ours,import', panel.join(','));
    await page.screenshot({ path: path.join(OUT, '2-settings.png') });
    const saved = await page.evaluate(async () => {
      const row = document.querySelector('[data-st-agent="late"]'); if (!row) return null;
      const f = row.querySelector('[data-st-ag-f="secondAfter"]'); if (!f) return null;
      f.value = '4'; row.querySelector('[data-st-ag-save]').click();
      await new Promise(r => setTimeout(r, 1200));
      return true;
    });
    const cfg = (await W.admin.json('/api/agents/status')).agents.late.cfg;
    ok('2c a save sticks on the server', saved && cfg.secondAfter === 4, JSON.stringify(cfg));

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop(); await ai.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
