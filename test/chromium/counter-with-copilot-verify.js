/* Chromium verification: COUNTER WITH COPILOT, AND THE REDO THAT REACHES THE
   PAPER (Young said "go", 9 Oct 2026 — the Paper and Counter review, changes 1
   and 2).
   ====================================================================
   On a real server with a scripted Copilot:
     1  Copilot first answered their ask with "ask a colleague": Negotiate
        shows no dashed box and no lit Counter;
     2  Home's round card: "Ask Copilot to redo this" → "Counter at 60 days" →
        Redo. The card says "Copilot has redone it" and the answer is the
        page's own at once (change 1a, 1c);
     3  a colleague's tab ALREADY on Negotiate catches up on its own beat —
        the dashed box appears without anybody reopening (change 1b);
     4  Negotiate here: the dashed box under their wording carries 60 days,
        nothing is filed, Counter glows (change 2, S2);
     5  Counter opens the editor with Copilot's counter IN THE BOX; ONE card,
        "In the box", no Apply, "Take it out" undoes it and Apply puts it
        back; "Rests on:" said once (S3);
     6  "Note to Nandi Dairy" is drafted from Copilot's reason and editable;
        the Save reads "Save counter" (S4);
     7  Save counter goes back to Negotiate: our counter is an unsent draft
        whose reason is the note, Send all says 1 not sent (S5).
   Every claim is gated on what it measures being on the page.
   AT THE PARENT (6a709b6) 1 passes and everything from 2 fails: the redo's
   answer is thrown away, there is no dashed box, no glow, no "In the box",
   no note and no "Save counter".

   Run: node test/chromium/counter-with-copilot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');
const { DatabaseSync } = require('node:sqlite');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'counter-with-copilot');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. Supply\nThe Supplier shall supply 5000 metric tonnes of raw milk.\n2. Price\nInvoices fall due within 45 days of receipt.\n3. Term\nThis Agreement runs for two years.';
const WHY = 'Meets them half way; our standard is 45 days.';
const answer = body => {
  const tool = (body.tool_choice && body.tool_choice.name) || '';
  const tu = input => [{ type: 'tool_use', id: 'tu_' + tool, name: tool, input }];
  if (tool === 'round_answers') return tu({ answers: [{ ask: 1, verdict: 'counter', why: WHY, standard: 'Payment terms',
    wording: 'Invoices fall due within 60 days of receipt.' }] });
  return tu({});
};

async function login(page, base){
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  if (await page.$('#li-email')) {
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  }
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-CP1'), null, { timeout: 20000 });
  await page.keyboard.press('Escape').catch(() => {});
  const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(300); }
}
const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(150); }
  return v; };
/* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the Negotiate door
   now lands on Jambo's Redlines face beside Home's paper — the row and its
   verbs (the glow) in #pd-redface, the wording on Home's paper (#ig-paper,
   Redlined while their ask is pending), where the dashed box is painted. */
const openNego = async page => {
  await page.evaluate(() => openRedlineWorkbench('MK-CP1'));
  return until(page, () => !!document.querySelector('#pd-redface [data-nego-card]') && !!document.querySelector('#ig-paper .rl-paper .rl-clause') && state.view === 'dashboard', null, 10000);
};
/* RE-POINTED 18 Oct 2026 (owner: "make the counter changes in the clause
   itself … do not add a new clause unless the counter clause is completely
   different"): his words are marked inside the clause; the box is only a rewrite's */
const paperRead = page => page.evaluate(() => {
  const box = document.querySelector('#ig-paper .rl-sug-box');
  const glow = document.querySelector('#pd-redface .rl-glow');
  const insEl = document.querySelector('#ig-paper .rl-sug-ins');
  return { box: box ? box.textContent.replace(/\s+/g, ' ').trim() : null, ins: [...document.querySelectorAll('#ig-paper .rl-sug-ins')].map(x => x.textContent.trim()),
    dels: [...document.querySelectorAll('#ig-paper .rl-sug-del')].map(x => x.textContent.trim()),
    dashed: insEl ? getComputedStyle(insEl).textDecorationStyle : null, glow: glow ? glow.textContent.trim() : null,
    /* the house's ONE light (LAND ON IT, 18 Oct 2026): a ring drawn as an outline */
    glowShadow: glow ? getComputedStyle(glow).outlineStyle + ' ' + getComputedStyle(glow).outlineWidth : null };
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi(); ai.script(...Array(40).fill(answer));
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c0 = fixtureContract('MK-CP1', 'Raw Material Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    Object.assign(c0, { owner: { id: me.id, name: me.name }, negotiation: { round: 1, turn: 'owner', turnAt: iso(-1), rounds: [] } });
    await W.admin.json('/api/contracts/MK-CP1', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await login(page, h.base);
    /* Their ask, through the product's own funnel, and saved. */
    const staged = await page.evaluate(async () => {
      const c = getContract('MK-CP1');
      if (window.ensureFull) await ensureFull(c);
      const cl = negoClauseList(c).find(x => /Price/.test(JSON.stringify(x))); if (!cl) return { list: negoClauseList(c).map(x => Object.keys(x).join(',') + ':' + JSON.stringify(x).slice(0, 80)) };
      const ch = await negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify', side: 'counterparty', author: 'Erik',
        oldText: cl.text, newText: cl.text.replace('45', '90'), summary: '“45” → “90”', why: 'Our payment cycle is 90 days' });
      await persist(c);
      return { clauseId: cl.clauseId, id: ch && ch.id, newText: ch && ch.newText };
    });
    ok('the stage: their ask on the Price clause is filed', !!(staged && staged.id), JSON.stringify(staged));
    await until(page, () => !(window.contractSavePending && contractSavePending(getContract('MK-CP1'))), null, 6000);
    /* Copilot's FIRST answer, as the round agent files it: ask a colleague. */
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    const { roundPrepKey } = require('../../js/roundprep.js');
    db.prepare('INSERT INTO round_prep (contract_id,pkey,json,created_at) VALUES (?,?,?,?)').run('MK-CP1', roundPrepKey(staged.clauseId, staged.newText),
      JSON.stringify({ v: 1, at: iso(-0.5), verdict: 'escalate', why: WHY, standard: 'Payment terms', wording: '', clauseId: staged.clauseId }), iso(-0.5));
    db.close();

    /* A colleague's tab, already on Negotiate before the redo. */
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const other = await ctx2.newPage();
    other.on('pageerror', e => errs.push('tab2: ' + String(e).slice(0, 200)));
    await login(other, h.base);
    ok('the colleague\'s tab is on Negotiate', !!(await openNego(other)));

    await page.reload({ waitUntil: 'networkidle' });
    await login(page, h.base);
    ok('1 the first answer: Negotiate shows no dashed box and no lit Counter', !!(await openNego(page))
      && await page.evaluate(() => !document.querySelector('.rl-sug-box') && !document.querySelector('.rl-glow')));
    await page.screenshot({ path: path.join(OUT, '1-before.png') });

    /* ===== 2. HOME'S ROUND CARD: ASK COPILOT TO REDO THIS ===== */
    await page.evaluate(() => { setView('dashboard'); });
    /* RE-POINTED AT THE INTEGRATION (19 Oct 2026): the owner's answer (18),
       "Fold to one line" (lane G) — a piece on the Board's Jambo's work card is
       one line with Look · its own act · Put away; Look opens it under its row,
       where "Ask Jambo to redo this" stands with its other acts. So Look is
       pressed first (once: pressed again it folds). */
    const item = await until(page, () => { if (typeof hbOpenAgent !== 'function') return null; hbOpenAgent('round');
      const it = [...document.querySelectorAll('[data-hb-ag-item]')].find(x => /MK-CP1/.test(x.getAttribute('data-hb-ag-item')));
      if (!it) return null;
      if (!it.querySelector('[data-ag-sb-open]')){ const look = it.querySelector('[data-hb-ag-look]'); if (look && look.getAttribute('aria-pressed') !== 'true') look.click(); return null; }
      return it.getAttribute('data-hb-ag-item'); }, null, 10000);
    ok('2a Home\'s round card offers "Ask Copilot to redo this"', !!item, item);
    let toastSaid = '';
    if (item) {
      const sel = `[data-hb-ag-item="${item}"]`;
      await page.click(`${sel} [data-ag-sb-open]`);
      await page.fill(`${sel} .ag-sb-note`, 'Counter at 60 days.');
      await page.screenshot({ path: path.join(OUT, '2-redo.png') });
      await page.click(`${sel} [data-ag-sb-go]`);
      toastSaid = await until(page, () => { const t = [...document.querySelectorAll('.toast, [role="status"]')].map(x => x.textContent).join(' | ');
        return /redone|catching up/.test(t) ? t : null; }, null, 15000);
    }
    ok('2b the card says "Copilot has redone it"', /Jambo has redone it/.test(toastSaid || ''), toastSaid);
    const taken = await page.evaluate(k => { const c = getContract('MK-CP1'); const a = c._roundPrep && c._roundPrep[k]; return a ? a.verdict : null; },
      require('../../js/roundprep.js').roundPrepKey(staged.clauseId, staged.newText));
    ok('2c the redone answer is the page\'s own at once (counter)', taken === 'counter', taken);

    /* ===== 4. NEGOTIATE HERE: THE DASHED BOX AND THE LIT COUNTER ===== */
    await openNego(page);
    const p4 = await until(page, () => { const b = document.querySelector('#ig-paper .rl-sug-ins'); return b ? true : null; }, null, 6000)
      ? await paperRead(page) : await paperRead(page);
    ok('4a Jambo\'s counter is marked inside the clause, in his dashed ink — no second copy', !p4.box && p4.ins.length >= 1 && p4.dashed === 'dashed', JSON.stringify(p4));
    ok('4b the word it adds (60) beside the one it takes out (their 90)', p4.ins.some(t => /60/.test(t)) && p4.dels.some(t => /90/.test(t)), JSON.stringify({ ins: p4.ins, dels: p4.dels }));
    ok('4c Counter glows', p4.glow === 'Counter' && /solid 2px/.test(String(p4.glowShadow)), p4.glow + ' ' + p4.glowShadow);
    ok('4d nothing was filed: one change on the record, theirs', await page.evaluate(() => getContract('MK-CP1').changes.length === 1));
    await page.screenshot({ path: path.join(OUT, '4-nego.png') });

    /* ===== 3. THE COLLEAGUE'S TAB CATCHES UP ON ITS OWN BEAT ===== */
    /* RE-POINTED 14 Oct 2026 (stage 5): the colleague's tab stands on the face
       too; the box it catches up is on Home's paper */
    const caught = await until(other, () => !!document.querySelector('#ig-paper .rl-sug-ins'), null, 30000);
    ok('3 a tab already on Negotiate draws the redone answer without reopening', !!caught);
    await other.screenshot({ path: path.join(OUT, '3-other-tab.png') });
    await ctx2.close();

    /* ===== 5. COUNTER OPENS THE EDITOR WITH THE COUNTER IN THE BOX ===== */
    /* RE-POINTED 14 Oct 2026 (stage 5): the press is the face's glowing verb;
       where none glows (4c reports that) it is the same row's Counter, so 5
       still measures what Counter opens */
    await page.click(p4.glow ? '#pd-redface .rl-glow' : '#pd-redface [data-rl-cp-editor-change]').catch(() => {});
    const ed = await until(page, () => !!document.querySelector('#clause-editor #ce-lane .ce-card'), null, 8000);
    const e5 = ed ? await page.evaluate(() => {
      const lane = document.querySelector('#ce-lane');
      const paper = document.querySelector('#clause-editor #ce-doc') || document.querySelector('#clause-editor');
      /* RE-POINTED 18 Oct 2026 (round 9's gaps, second pass — "where Edit
         lands" from a row): the rail also draws "What they asked" and "Ask
         Jambo" under it, as drawn; ONE suggestion card (.ce-sug), and it leads */
      return { cards: lane.querySelectorAll('.ce-sug').length, name: (lane.querySelector('.ce-card .n span') || {}).textContent || '',
        inBox: !!lane.querySelector('.ce-inbox'), applies: lane.querySelectorAll('[data-ce-apply]').length,
        restsTwice: /Rests on:\s*Rests on:/.test(lane.textContent), rests: (lane.querySelector('.ce-card .r') || {}).textContent || '',
        boxHas60: [...paper.querySelectorAll('ins')].some(x => /60/.test(x.textContent)),
        note: (document.querySelector('#ce-prep-note') || {}).value || null,
        noteLabel: ((document.querySelector('.ce-prep-note .k') || {}).textContent || '').trim(),
        save: ((document.querySelector('[data-ce-act="save"]') || {}).textContent || '').trim() };
    }) : null;
    ok('5a the editor opens with Copilot\'s counter already in the box (60 added)', !!e5 && e5.boxHas60, JSON.stringify(e5));
    ok('5b ONE card, "Copilot\'s counter", marked In the box, with no Apply', !!e5 && e5.cards === 1 && /Jambo's counter/.test(e5.name) && e5.inBox && e5.applies === 0, e5 && JSON.stringify({ c: e5.cards, n: e5.name, i: e5.inBox, a: e5.applies }));
    ok('5c "Rests on:" is said once', !!e5 && !e5.restsTwice && /Rests on: Payment terms/.test(e5.rests), e5 && e5.rests);
    ok('6a "Note to Nandi Dairy" is drafted from Copilot\'s reason', !!e5 && /Note to Nandi Dairy/i.test(e5.noteLabel) && e5.note === WHY, e5 && (e5.noteLabel + ' / ' + e5.note));
    ok('6b the Save reads "Save counter"', !!e5 && e5.save === 'Save counter', e5 && e5.save);
    await page.screenshot({ path: path.join(OUT, '5-editor.png') });
    if (e5) {
      await page.click('#ce-lane [data-ce-act="prep-out"]');
      const out = await until(page, () => !document.querySelector('#ce-lane .ce-inbox') && document.querySelectorAll('#ce-lane [data-ce-apply]').length === 1
        ? ![...document.querySelectorAll('#clause-editor #ce-doc ins')].some(x => /60/.test(x.textContent)) : null, null, 4000);
      ok('5d "Take it out" undoes it: the counter leaves the box and Apply comes back', !!out);
      await page.click('#ce-lane [data-ce-apply]');
      ok('5e Apply puts it back In the box', !!(await until(page, () => !!document.querySelector('#ce-lane .ce-inbox'), null, 4000)));
      await page.fill('#ce-prep-note', 'We can meet you part-way: 60 days. Our standard is 45 days.');
      await page.click('[data-ce-act="save"]');
      /* RE-POINTED 14 Oct 2026 (stage 5): back to where Counter was pressed —
         Jambo's Redlines face beside Home's paper */
      const back = await until(page, () => !document.querySelector('#clause-editor') && state.view === 'dashboard' && !!document.querySelector('#pd-redface [data-nego-card]'), null, 8000);
      ok('7a Save counter goes back to Negotiate', !!back);
      const s7 = await page.evaluate(() => {
        const c = getContract('MK-CP1');
        const ours = (c.changes || []).filter(x => x.authorSide === 'owner' && x.status === 'pending');
        const send = document.querySelector('.redline-page .rl-unsent-go');
        return { n: ours.length, why: ours[0] && ours[0].why, sent: ours[0] && !!ours[0].sentAt, newText: ours[0] && ours[0].newText,
          send: send ? send.textContent.replace(/\s+/g, ' ').trim() : null,
          drawer: !!document.querySelector('#context-panel.open [data-rl-np-pin], #context-panel.open .rl-np-pin') };
      });
      ok('7b our counter is filed as an unsent draft carrying 60 days', s7.n === 1 && !s7.sent && /60 days/.test(s7.newText || ''), JSON.stringify(s7));
      ok('7c the note travels with it as its reason', s7.why === 'We can meet you part-way: 60 days. Our standard is 45 days.', s7.why);
      /* RE-POINTED 24 Oct 2026 (Round 3): the round line says "1 not sent"; the button "Send all · 1" */
      ok('7d Send all says 1', /Send all\s*·\s*1\b/.test(s7.send || ''), s7.send);
      await page.screenshot({ path: path.join(OUT, '7-back.png') });
    }
    ok('no page errors', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('run', false, e && e.stack ? e.stack.slice(0, 400) : String(e));
  } finally {
    await browser.close(); await h.stop(); try { ai.stop && await ai.stop(); } catch (_) {}
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
