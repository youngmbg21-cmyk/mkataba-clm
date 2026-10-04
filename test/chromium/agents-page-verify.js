/* Chromium verification: COPILOT'S WORK — THE AGENTS (Young ruled 27 Sep 2026:
   "Build the agents idea", over the "Work Board Options" artifact, option 2).
   ====================================================================
   f399 pins what the code SAYS. This file measures what a reader SEES and
   DOES on the real app: the rail door and its count, the five agents, the
   page head, the steps, the cards, and every button on every review panel —
   each pressed with a real pointer and followed to where it lands.

   THE STAGE is a new workspace with the sample portfolio and five things put
   into states through the product's own acts:
     MK-149 Carrefour — three of their asks, nine days old (their round);
     MK-143 Sendy     — ending in 64 days with 30 days' notice (a notice due);
     MK-131 Kabras    — a promise of theirs six days late, with an address;
     MK-158 PwC       — read on arrival, three things to look at, not opened;
     three contracts  — an import batch, two still to check, one unreadable.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out.
   AT THE PARENT (231b9fc) every check but the stage and the page-error sweep
   FAILS: there is no door, no page and no panel to press.
   AND AT a0f7cae (27 Sep 2026, "fix the two problems you found") 3c, 8c and
   8d FAIL: a letter put away let the plain renewal row back in its place,
   and a step held back in a payment chain was offered for chasing. 3c0, 8b
   and 8e are the controls and pass on both sides.
   AND AT faa8f95 (27 Sep 2026, "Read the brief" empty and the cards thinner
   than the drawing) 1i, 2b2, 3a2, 5a2, 6a2 and 10a–10f FAIL: no foot, no
   wording, no letter, no message, no names, and a brief panel that says
   "Nothing has been briefed" over a brief that exists. The two section-10
   stage lines are the gate.

   Run: node test/chromium/agents-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { DatabaseSync } = require('node:sqlite');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'agents-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* ---- the stage ---- */
    const staged = await page.evaluate(async () => {
      const me = currentUser();
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const w = getContract('MK-149'), r = getContract('MK-143'), k = getContract('MK-131'), p = getContract('MK-158');
      if (!w || !r || !k || !p) return null;
      w.changes = []; delete w.negotiation; negoInit(w);
      const cls = negoClauseList(w).filter(x => x && x.clauseId && x.clauseId !== 'front');
      const byName = re => cls.find(x => re.test((typeof clauseLabel === 'function' ? clauseLabel(x) : '') + ' ' + (x.headingText || '')));
      const asks = [
        [/Trading Terms/, b => b.replace('5% volume rebate', '7.5% volume rebate')],
        [/Payment/, b => b.replace(/within 60 days/, 'within 90 days')],
        [/Limitation of Liability/, b => b.replace(/<\/p>(?![\s\S]*<\/p>)/, ' The cap shall not apply to product recalls.</p>')],
      ];
      for (const [re, edit] of asks) {
        const cl = byName(re); if (!cl) continue;
        const now = negoClauseNowById(w, cl.clauseId);
        const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
        await negoEditClause(w, cl.clauseId, edit(body), { side: 'counterparty', author: 'Carrefour Kenya' });
        const last = w.changes[w.changes.length - 1];
        if (last) last.createdAt = new Date(Date.now() - 9 * 864e5).toISOString();
      }
      persist(w);
      /* An executed record keeps its dates on file; the in-memory move is
         what the desk reads, as the checklist's own bench does. */
      r.owner = { id: me.id, name: me.name };
      r.expiry = day(64);
      r.metadata = Object.assign({}, r.metadata || {}, { expiryDate: day(64), noticePeriodDays: 30 });
      k.obligations = (k.obligations || []).concat([{ id: 'ob_late1', desc: 'Deliver the Q3 stock report', due: day(-6), party: 'theirs' }]);
      k.counterpartyEmail = k.counterpartyEmail || 'ops@kabras.example';
      persist(k);
      p.triage = { at: new Date(Date.now() - 2 * 864e5).toISOString(), by: me.name, steps: {
        brief: { ok: true, line: 'An audit engagement for FY2026' },
        playbook: { ok: true, dev: 2, miss: 1, cats: ['Payment', 'Liability'] },
        oblig: { ok: true, found: [{ desc: 'Deliver the audit plan' }, { desc: 'Quarterly fee invoice' }] } } };
      persist(p);
      const imp = state.contracts.filter(c => !['MK-149', 'MK-143', 'MK-131', 'MK-158'].includes(c.id) && !c.archived && c.status !== 'Declined').slice(0, 3);
      imp.forEach((c, i) => { c.migration = { batch: 'B-7', importedAt: new Date(Date.now() - 864e5).toISOString(), importedBy: me.name,
        needsReview: i < 2, blocked: i === 0 ? 'no-text' : null }; persist(c); });
      const D = agentsData();
      return { ready: D.ready, per: Object.fromEntries(AG_KEYS.map(x => [x, D.agents[x].ready.length])) };
    });
    /* RE-POINTED 27 Sep 2026: a SIXTH agent, "No link to sign" (f412), and
       nothing in the sample book is stuck without a link — so its count is 0
       and the other five hold one each, as before. */
    ok('the stage: one of each kind of work, through the product\'s own acts',
      !!staged && staged.ready === 5 && Object.entries(staged.per).every(([k, n]) => n === ((k === 'link' || k === 'ours') ? 0 : 1)), JSON.stringify(staged));

    /* ---- 1. the door ---- */
    const door = await page.$('[data-view="agents"]');
    ok('1a the rail carries the door', !!door);
    if (door) { await door.click(); await page.waitForTimeout(900); }
    const head = await page.evaluate(() => ({
      view: state.view,
      title: (document.querySelector('#page-head h1') || document.querySelector('h1') || {}).textContent || '',
      facts: (document.getElementById('page-head-facts') || {}).textContent || '',
      rail: (document.querySelector('[data-count="agents"]') || {}).textContent || '',
      rows: [...document.querySelectorAll('[data-ag-agent]')].map(b => b.getAttribute('data-ag-agent')),
      on: (document.querySelector('.ag-row.on') || { getAttribute: () => null }).getAttribute('data-ag-agent'),
      over: document.documentElement.scrollWidth - innerWidth,
    }));
    ok('1b a press on the door opens the page', head.view === 'agents', head.view);
    ok('1c the page names itself', /Copilot.s work/.test(head.title), head.title);
    /* Seven since 27 Sep 2026: Our promises sits after Late promises. */
    ok('1d seven agents, in the drawing\'s order with "No link to sign" second', head.rows.join(',') === 'round,link,renew,paper,late,ours,import', head.rows.join(','));
    ok('1e THE NUMBER ON THE DOOR IS THE NUMBER ON THE PAGE', head.rail === '5' && /^5 ready for review/.test(head.facts), `door ${head.rail} · head "${head.facts}"`);
    ok('1f it opens on the first agent with work ready', head.on === 'round', head.on);
    ok('1g no sideways scroll at 1440', head.over <= 0, head.over + 'px');
    /* THE DOOR'S PLACE, read off the pixels (Young, 27 Sep 2026: "move it to
       be after the home page then move insights to below calendar"). */
    const railOrder = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#side-nav .nav-item[data-view]')]
        .filter(b => getComputedStyle(b).display !== 'none')
        .map(b => ({ v: b.getAttribute('data-view'), top: Math.round(b.getBoundingClientRect().top) }))
        .sort((a, b) => a.top - b.top).map(x => x.v);
      return items;
    });
    ok('1h the door is painted directly below Home, and Insights directly below Calendar',
      railOrder[railOrder.indexOf('dashboard') + 1] === 'agents' && railOrder[railOrder.indexOf('calendar') + 1] === 'intel',
      railOrder.slice(0, 9).join(' · '));
    await page.screenshot({ path: path.join(OUT, '1-round.png') });

    const openFirst = async () => { const it = await page.$('#ag-main [data-ag-open]'); if (!it) return false; await it.click(); await page.waitForTimeout(450); return !!(await page.$('#side-panel [data-ag-panel]')); };
    const pick = async k => { const b = await page.$(`[data-ag-agent="${k}"]`); if (b) { await b.click(); await page.waitForTimeout(350); } return !!b; };
    const act = async a => { const b = await page.$(`#side-panel [data-ag-act="${a}"]`); if (!b) return false; await b.click(); await page.waitForTimeout(900); return true; };

    /* ---- 1i. the card says when (Young, 27 Sep 2026: the cards were thinner
       than the drawing). The round's card arrived nine days ago. RED at faa8f95. */
    const foot = await page.evaluate(() => { const f = document.querySelector('#ag-main .ag-item .ag-foot'); return f ? f.textContent.replace(/\s+/g, ' ').trim() : null; });
    ok('1i the card carries its own foot: when it arrived (and who it is for, where the record names one)', !!foot && /Arrived /.test(foot), String(foot));

    /* ---- 2. their round ---- */
    const steps = await page.evaluate(() => [...document.querySelectorAll('.ag-stp')].map(s => s.textContent.trim()));
    ok('2a the steps name where a person looks, and count what waits there', steps.some(s => /Your review\s*1/.test(s)), steps.join(' | '));
    const roundPanel = await openFirst();
    const rp = await page.evaluate(() => {
      const p = document.getElementById('side-panel');
      return p ? { chg: p.querySelectorAll('.ag-chg').length, tags: [...p.querySelectorAll('.ag-chg .ag-tag')].map(t => t.textContent.trim()),
        acts: [...p.querySelectorAll('[data-ag-act]')].map(b => b.getAttribute('data-ag-act')) } : null;
    });
    ok('2b the round\'s panel lists each ask with the co-pilot\'s answer', roundPanel && rp && rp.chg === 3 && rp.tags.length === 3, JSON.stringify(rp));
    const words = await page.evaluate(async () => {
      const d = document.querySelector('#side-panel details.ag-words'); if (!d) return null;
      const n = document.querySelectorAll('#side-panel details.ag-words').length;
      d.querySelector('summary').click(); await new Promise(r => setTimeout(r, 150));
      const b = d.querySelector('.ag-words-b');
      return { n, open: d.open, marks: b ? b.querySelectorAll('ins,del').length : 0, text: b ? b.textContent.trim().slice(0, 60) : '' };
    });
    ok('2b2 each ask carries THEIR WORDING one press away, drawn with its marks (RED at faa8f95)', !!words && words.n === 3 && words.open && words.marks > 0, JSON.stringify(words));
    ok('2c and it offers the negotiation, never a decision', !!rp && rp.acts.includes('nego') && !rp.acts.some(a => /accept|reject|counter/.test(a)), rp && rp.acts.join(','));
    await page.screenshot({ path: path.join(OUT, '2-round-panel.png') });
    if (roundPanel) await act('nego');
    const landed = await page.evaluate(() => ({ view: state.view, held: (typeof redlineHeldId === 'function') ? redlineHeldId() : null, panel: !!document.getElementById('side-panel') }));
    ok('2d "Answer on the negotiation" lands on that contract\'s negotiation, and the panel goes', landed.view === 'redline' && String(landed.held) === 'MK-149' && !landed.panel, JSON.stringify(landed));

    const back = async () => { await page.evaluate(() => setView('agents')); await page.waitForTimeout(700); };

    /* ---- 3. renewals: the notice ---- */
    await back();
    await pick('renew');
    const renewPanel = await openFirst();
    ok('3a a notice is ready under Renewals', renewPanel);
    const letterOn = await page.evaluate(() => { const l = document.querySelector('#side-panel .ag-letter'); return l ? l.textContent.trim().slice(0, 40) : null; });
    ok('3a2 the notice\'s panel carries THE LETTER itself, written from the record (RED at faa8f95)', !!letterOn && /^NOTICE OF/.test(letterOn), String(letterOn));
    if (renewPanel) await act('notice');
    const letter = await page.evaluate(() => !!document.getElementById('nt-close'));
    ok('3b "Read the letter" opens the notice letter — the renewal card\'s own dialog', letter);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await openFirst()) await act('away');
    /* REVERSED IN PLACE 27 Sep 2026 (Young: "fix the two problems you
       found"). This said the desk's plain renewal row "may then stand in its
       place" and asked only about the NOTICE — which is the fault itself: the
       reader had just cleared this contract, and the same subject walked back
       in under another name. The claim is the CONTRACT now, on both pages,
       and on what each page DRAWS as well as what it reads. RED at the parent
       (a0f7cae), which prints here:1 · drawn:1 — the renewal row. 3c0 is the
       CONTROL: the renewal reading still answers for this contract, so the
       absence is the fix and never a stage that stopped qualifying. */
    const away = await page.evaluate(() => {
      const w = renewalWindow(getContract('MK-143'));
      return {
        inWindow: !!(w && w.inWindow && !w.decided),
        stamped: !!(getContract('MK-143').desk && getContract('MK-143').desk.notice),
        here: agentsData().agents.renew.ready.filter(x => x.cid === 'MK-143').length,
        drawn: document.querySelectorAll('#ag-main [data-ag-key^="desk:MK-143:"]').length,
        home: deskItems().filter(x => x.cid === 'MK-143').length };
    });
    ok('3c0 CONTROL — the renewal decision is still open on this contract', away.inWindow, JSON.stringify(away));
    ok('3c "Put away" writes the desk\'s own stamp, and the contract leaves this page AND Home\'s desk — no renewal row in its place',
      away.stamped && away.here === 0 && away.drawn === 0 && away.home === 0, JSON.stringify(away));

    /* ---- 4. new paper ---- */
    await pick('paper');
    const paperPanel = await openFirst();
    /* RE-POINTED IN PLACE 27 Sep 2026: the five tiles are each OPENED now —
       a section under the tile's own head, carrying the reading itself. */
    const tiles = await page.evaluate(() => [...document.querySelectorAll('#side-panel [data-ag-tile]')].length);
    ok('4a what HaTi read on arrival is laid out reading by reading, under each tile\'s own head', paperPanel && tiles >= 3, tiles + ' sections');
    if (paperPanel) await act('seen');
    const seen = await page.evaluate(() => ({ seenAt: !!(getContract('MK-158').triage || {}).seenAt,
      ready: agentsData().agents.paper.ready.length, done: agentsData().agents.paper.done.map(x => x.cid) }));
    ok('4b "Mark as read" is the arrival strip\'s own stamp, and the item moves to Done recently', seen.seenAt && seen.ready === 0 && seen.done.includes('MK-158'), JSON.stringify(seen));
    const doneRow = await page.evaluate(() => [...document.querySelectorAll('.ag-runs tbody tr')].map(r => r.textContent).join(' | '));
    ok('4c the finished row is drawn on the page', /PwC/.test(doneRow), doneRow.slice(0, 120));

    /* ---- 5. late promises: the chase asks before it sends ---- */
    await pick('late');
    const latePanel = await openFirst();
    ok('5a a late promise is ready, with the address it will go to', latePanel && /ops@kabras\.example/.test(await page.evaluate(() => (document.getElementById('side-panel') || {}).textContent || '')));
    const mail = await page.evaluate(() => { const m = document.querySelector('#side-panel .ag-mail'); return m ? m.textContent.replace(/\s+/g, ' ').trim() : null; });
    ok('5a2 the chase\'s panel carries THE MESSAGE it will send — its subject and its words (RED at faa8f95)',
      !!mail && /A reminder about Deliver the Q3 stock report/.test(mail) && /Could you let us know where it stands\?/.test(mail), String(mail).slice(0, 160));
    if (latePanel) {
      const b = await page.$('#side-panel [data-ag-act="chase"]');
      if (b) { await b.click(); await page.waitForTimeout(500); }
    }
    const asked = await page.evaluate(() => !!document.getElementById('confirm-overlay'));
    ok('5b "Send the chase" asks before it sends — obligationChase\'s own question', asked);
    if (asked) { await page.click('#cf-ok'); await page.waitForTimeout(1500); }
    const chased = await page.evaluate(() => {
      const o = (getContract('MK-131').obligations || []).find(x => x.id === 'ob_late1') || {};
      return { at: o.chasedAt || '', ready: agentsData().agents.late.ready.length, done: agentsData().agents.late.done.map(x => x.ob && x.ob.id) };
    });
    ok('5c the chase is stamped on the obligation and the item moves to Done recently', !!chased.at && chased.ready === 0 && chased.done.includes('ob_late1'), JSON.stringify(chased));

    /* ---- 6. archive import ---- */
    await page.evaluate(() => { if (document.getElementById('side-panel')) closeModal(); });
    await pick('import');
    const impPanel = await openFirst();
    const impText = await page.evaluate(() => (document.getElementById('side-panel') || {}).textContent || '');
    ok('6a the batch says how many there are, how many to check, how many could not be read', impPanel && /Contracts\s*3/i.test(impText) && /To check\s*2/i.test(impText), impText.replace(/\s+/g, ' ').slice(0, 160));
    const named = await page.evaluate(() => [...document.querySelectorAll('#side-panel .ag-names li b')].map(b => b.textContent.trim()));
    ok('6a2 the batch\'s panel NAMES the contracts — the one that could not be read and the ones to check (RED at faa8f95)', named.length >= 2, named.join(' | '));
    if (impPanel) await act('import');
    ok('6b "Open the import queue" lands on the import page', (await page.evaluate(() => state.view)) === 'migration');

    /* ---- 7. the rules door, and the keyboard ---- */
    await back();
    await pick('round');
    const rules = await page.$('[data-ag-door="standards"]');
    if (rules) { await rules.click(); await page.waitForTimeout(700); }
    ok('7a the round\'s rules are Our standards, one press away', rules && (await page.evaluate(() => state.view)) === 'playbook');
    await back();
    await page.focus('[data-ag-agent="round"]').catch(() => {});
    await page.keyboard.press('ArrowDown'); await page.waitForTimeout(400);
    const kb = await page.evaluate(() => ({ on: (document.querySelector('.ag-row.on') || { getAttribute: () => null }).getAttribute('data-ag-agent'),
      focus: document.activeElement && document.activeElement.getAttribute('data-ag-agent') }));
    ok('7b the arrow keys walk the agents list, and the focus follows', kb.on === 'link' && kb.focus === 'link', JSON.stringify(kb));

    /* ---- 8. the door count follows the work ---- */
    const after = await page.evaluate(() => ({ rail: (document.querySelector('[data-count="agents"]') || {}).textContent || '', ready: agentsData().ready }));
    ok('8a with work done, the count went down and the door and the page still agree', after.rail === String(after.ready) && after.ready < 5, JSON.stringify(after));

    /* ---- 8b–8e. a step held back in a payment chain is not chased (27 Sep 2026) ----
       Young: "fix the two problems you found". The desk asked the chain
       reading with its arguments the wrong way round, so it never once
       answered "held": a late step whose earlier payment had not happened was
       offered for chasing on both pages that read the desk. Staged on Kabras:
       our deposit first, their delivery after it. 8b is the GATE (the real
       chain reading answers "held" and the step is overdue); 8c and 8d are
       RED at the parent (a0f7cae); 8e is the CONTROL — once the deposit is
       paid through the product's own act, the same step IS offered. */
    const held = await page.evaluate(() => {
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const k = getContract('MK-131');
      k.obligations = (k.obligations || []).concat([
        { id: 'ob_dep', desc: 'Pay the stock deposit', due: day(-12), party: 'ours' },
        { id: 'ob_held', desc: 'Deliver the Q4 stock', due: day(-5), party: 'theirs', after: 'ob_dep' }]);
      persist(k);
      const o = k.obligations.find(x => x.id === 'ob_held');
      return { blocked: obligationBlocked(o, k), st: obState(o) };
    });
    ok('8b GATE — the chain reading answers "held" and the step is overdue', held.blocked === true && held.st === 'overdue', JSON.stringify(held));
    await back();
    await pick('late');
    const heldHere = await page.evaluate(() => ({
      ready: agentsData().agents.late.ready.filter(x => x.ob && x.ob.id === 'ob_held').length,
      drawn: document.querySelectorAll('#ag-main [data-ag-key="desk:MK-131:chase:ob_held"]').length }));
    ok('8c Copilot\'s work does not offer to chase a step nobody could have done yet', heldHere.ready === 0 && heldHere.drawn === 0, JSON.stringify(heldHere));
    await page.evaluate(() => setView('dashboard')); await page.waitForTimeout(900);
    const heldHome = await page.evaluate(() => ({
      read: deskItems().filter(x => x.kind === 'chase' && x.ob && x.ob.id === 'ob_held').length,
      drawn: document.querySelectorAll('.hm-row.is-desk [data-desk-ob="ob_held"]').length }));
    ok('8d nor does Home\'s Prepared for you', heldHome.read === 0 && heldHome.drawn === 0, JSON.stringify(heldHome));
    await page.evaluate(() => toggleObligationById('MK-131', 'ob_dep')); await page.waitForTimeout(400);
    await back();
    await pick('late');
    const freed = await page.evaluate(() => ({
      ready: agentsData().agents.late.ready.filter(x => x.ob && x.ob.id === 'ob_held').length,
      drawn: document.querySelectorAll('#ag-main [data-ag-key="desk:MK-131:chase:ob_held"]').length }));
    ok('8e CONTROL — once our deposit is marked paid, the same step IS offered, on the page', freed.ready === 1 && freed.drawn === 1, JSON.stringify(freed));

    /* ---- 9. a narrow window and the dark theme ---- */
    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(500);
    const narrow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok('9a no sideways scroll at 1024', narrow <= 0, narrow + 'px');
    await page.screenshot({ path: path.join(OUT, '9-narrow.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); else document.documentElement.classList.add('dark'); });
    await page.waitForTimeout(400);
    const dark = await page.evaluate(() => {
      const card = document.querySelector('.ag-card'); if (!card) return null;
      return { bg: getComputedStyle(card).backgroundColor, ink: getComputedStyle(card.querySelector('h2') || card).color };
    });
    ok('9b the dark theme dresses the page (a dark card, light ink)', !!dark && !/255, 255, 255/.test(dark.bg) && /2[0-9]{2}/.test(dark.ink), JSON.stringify(dark));
    await page.screenshot({ path: path.join(OUT, '9-dark.png') });

    /* ---- 10. THE BRIEF THAT OPENED EMPTY (Young, 27 Sep 2026: "for many cards
       in there when i click on read brief, the panel comes up but it has no
       brief in it but when i go through the overview door the brief works") ----
       The page is drawn off the LIGHT list and the brief rides only a single
       contract's own read, so the list's contracts carry "there is a brief" and
       not the brief. Reproduced as it happens: a contract read on arrival with a
       brief written, the page RELOADED so every contract is a light row again.
       10d and 10f print the owner's report at faa8f95 ("Nothing has been
       briefed"); 10a–10c are the opened readings; 10e is the one door onto
       adding the obligations found. */
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });
    const fresh = await page.evaluate(async () => {
      const me = currentUser();
      const used = new Set(['MK-149', 'MK-143', 'MK-131', 'MK-158']);
      const pick = () => state.contracts.find(c => c && !used.has(c.id) && !c.migration && !c.archived && c.status !== 'Declined' && !c.triage);
      const a = pick(); if (!a) return null; used.add(a.id);
      const b = pick(); if (!b) return null;
      a.triage = { at: new Date(Date.now() - 864e5).toISOString(), by: me.name, steps: {
        brief: { ok: true, line: 'x' },
        playbook: { ok: true, dev: 1, miss: 1, cats: ['Liability cap', 'Data protection'] },
        oblig: { ok: true, found: [{ desc: 'Deliver the audit plan by 15 Jan', party: 'theirs' }, { desc: 'Pay the first fee part on signing', party: 'ours' }] } } };
      a.playbook = { key: 'services', label: 'Services', source: 'ai', at: new Date().toISOString(), verdicts: [
        { category: 'Liability cap', status: 'deviation', escalate: true, quote: 'Neither party’s liability under this Agreement is limited.', position: '≥ 12 months’ fees.' },
        { category: 'Data protection', status: 'missing', position: 'A data protection clause naming the regulator.' },
        { category: 'Governing law', status: 'aligned', quote: 'The laws of Kenya.', position: 'Kenya' }] };
      persist(a); await flushSaves();
      return { a: a.id, b: b.id };
    });
    ok('10 the stage: a contract read on arrival, and a second with only a brief', !!fresh, JSON.stringify(fresh));
    if (fresh) {
      const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
      /* THE SERVER IS STILL A WRITER (30 Sep 2026): this connection had no busy
         timeout, so a write landing while the server held the lock (the
         arrival read, a save) was refused at once — "database is locked" on
         CI. It now waits for the lock, bounded, as the server's own writes do. */
      db.exec('PRAGMA busy_timeout = 5000');
      const put = (id, overview) => db.prepare('INSERT OR REPLACE INTO briefs(contract_id,json,created_at) VALUES(?,?,?)').run(id, JSON.stringify({
        at: new Date().toISOString(), inputHash: 'x', data: { overview, watchouts: [{ point: 'Fees rise if the scope grows', why: 'There is no cap on extra work.' }], unusual: [] } }), new Date().toISOString());
      put(fresh.a, 'An engagement letter for the FY2026 external audit, billed in three parts.');
      put(fresh.b, 'A supply agreement for packaging, renewed each year.');
      db.close();
      await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
      const light = await page.evaluate(id => { const c = getContract(id); return c ? { light: !!c._light, loaded: !!c._loaded, hasBrief: !!c._hasBrief, brief: !!c._brief } : null; }, fresh.a);
      ok('10 GATE — after the reload the contract is a LIGHT row that knows a brief exists and does not carry it', !!light && light.light && !light.loaded && light.hasBrief && !light.brief, JSON.stringify(light));
      await page.evaluate(() => setView('agents')); await page.waitForTimeout(900);
      await pick('paper');
      const it = await page.$(`#ag-main [data-ag-key="read:${fresh.a}"]`);
      if (it) { await it.click(); await page.waitForTimeout(1500); }
      const opened = await page.evaluate(() => {
        const t = k => { const x = document.querySelector(`#side-panel [data-ag-tile="${k}"]`); return x ? x.textContent.replace(/\s+/g, ' ').trim() : ''; };
        return { brief: t('brief'), std: t('playbook'), obs: t('oblig'),
          obsBtn: (document.querySelector('#side-panel [data-ag-act="obs"]') || {}).textContent || '' };
      });
      ok('10a the panel shows THE BRIEF itself once the whole record lands (RED at faa8f95)', /FY2026 external audit/.test(opened.brief) && /Why it matters/.test(opened.brief), opened.brief.slice(0, 140));
      ok('10b and the departures, their words beside your standard (RED at faa8f95)',
        /Liability cap/.test(opened.std) && /Their words/.test(opened.std) && /Your standard/.test(opened.std) && /1 other standard is met/.test(opened.std), opened.std.slice(0, 160));
      ok('10c and the obligations found, whose each is, with one door onto adding them (RED at faa8f95)',
        /Deliver the audit plan/.test(opened.obs) && /Theirs/.test(opened.obs) && /Review 2 obligations/.test(opened.obsBtn), opened.obs.slice(0, 120) + ' · ' + opened.obsBtn);
      await page.screenshot({ path: path.join(OUT, '10-new-paper-panel.png') });
      const rb = await page.$('#side-panel [data-ag-act="brief"]');
      if (rb) { await rb.click(); await page.waitForTimeout(1800); }
      const briefShown = await page.evaluate(() => { const s = document.getElementById('brief-section'); if (!s) return null; const x = s.cloneNode(true); x.querySelectorAll('style').forEach(n => n.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); });
      ok('10d "Read the brief" opens the brief, not an empty panel — the owner\'s report (RED at faa8f95)',
        !!briefShown && /FY2026 external audit/.test(briefShown) && !/Nothing has been briefed/.test(briefShown), String(briefShown).slice(0, 140));
      await page.screenshot({ path: path.join(OUT, '10-brief.png') });
      await page.evaluate(() => { if (document.getElementById('side-panel')) closeModal(); setView('agents'); }); await page.waitForTimeout(900);
      await pick('paper');
      const it2 = await page.$(`#ag-main [data-ag-key="read:${fresh.a}"]`);
      if (it2) { await it2.click(); await page.waitForTimeout(800); }
      const ob = await page.$('#side-panel [data-ag-act="obs"]');
      if (ob) { await ob.click(); await page.waitForTimeout(1200); }
      const review = await page.evaluate(() => ({ dialog: !!document.getElementById('or-add'), text: ((document.getElementById('modal-root') || {}).textContent || '').replace(/\s+/g, ' ').slice(0, 120) }));
      ok('10e "Review 2 obligations" opens the one review dialog, where each is ticked by the reader — nothing is added from the card (RED at faa8f95)', review.dialog, JSON.stringify(review));
      await page.evaluate(() => { try { closeModal(); } catch (_){} });
      /* THE FUNNEL: any door that opens the brief panel on a light row — here
         pressed straight, with nothing loaded first. NOT FROM THE CONTRACTS
         PAGE: its side panel loads the first row's record for its own reasons,
         which made this pass at the parent for the wrong one (measured). The
         gate asks that the row is still light at the moment of the press. */
      await page.evaluate(() => setView('agents')); await page.waitForTimeout(700);
      const stillLight = await page.evaluate(id => { const c = getContract(id); return !!(c && c._light && !c._loaded && c._hasBrief && !c._brief); }, fresh.b);
      ok('10f GATE — the second contract is still a light row that carries no brief', stillLight);
      await page.evaluate(id => openCheckPanel(getContract(id), 'brief'), fresh.b);
      await page.waitForTimeout(1500);
      const funnel = await page.evaluate(() => { const s = document.getElementById('brief-section'); if (!s) return null; const x = s.cloneNode(true); x.querySelectorAll('style').forEach(n => n.remove()); return x.textContent.replace(/\s+/g, ' ').trim(); });
      ok('10f the brief panel\'s own funnel loads a light record first, whatever door opened it (RED at faa8f95)',
        !!funnel && /supply agreement for packaging/.test(funnel), String(funnel).slice(0, 140));
      await page.evaluate(() => { try { closeModal(); } catch (_){} });

      /* ---- 11. NO STUTTER ON OPENING A CARD (Young, 29 Sep 2026: "when i open
         one of the new cards, it opens up without a brief and flashed like a
         stutter then the brief appears") ----
         The panel's FIRST PAINT is recorded the moment it enters the page. Fast
         path: a pointer resting on the card starts the whole record's fetch, so
         the panel opens with the brief already in it. Slow path (the record's
         read held back 900ms): the brief's place is held by a placeholder, and
         when it lands only the brief is swapped — the standards section beside
         it is the same element before and after. RED at the parent: the first
         paint carried neither the brief nor a placeholder, and the whole body
         was replaced. */
      const recordFirst = () => page.evaluate(() => {
        window.__agFirst = null; window.__agStd = null;
        const mo = new MutationObserver(() => {
          const p = document.querySelector('[data-ag-panel]');
          if (!p || window.__agFirst) return;
          const b = p.querySelector('[data-ag-tile="brief"]'), sk = b && b.querySelector('.ag-skel');
          window.__agFirst = { brief: !!b && /FY2026 external audit/.test(b.textContent), skel: !!sk,
            skelH: sk ? Math.round(sk.getBoundingClientRect().height) : 0 };
          window.__agStd = p.querySelector('[data-ag-tile="playbook"]');
          mo.disconnect();
        });
        mo.observe(document.body, { childList: true, subtree: true });
      });
      const settleLoaded = id => page.waitForFunction(i => { const c = getContract(i); return !!(c && c._loaded); }, id, { timeout: 8000 }).catch(() => {});
      /* FAST: hover, let the read land, then press. */
      await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
      await page.evaluate(() => setView('agents')); await page.waitForTimeout(700);
      await pick('paper');
      const card = `#ag-main [data-ag-key="read:${fresh.a}"]`;
      const light2 = await page.evaluate(id => { const c = getContract(id); return !!(c && c._light && !c._loaded); }, fresh.a);
      ok('11 GATE — after a reload the card\'s contract is a light row again', light2);
      if (await page.$(card)) {
        await page.hover(card);
        await settleLoaded(fresh.a);
        ok('11a resting the pointer on a card fetches its whole record before any press',
          await page.evaluate(id => !!(getContract(id) || {})._loaded, fresh.a));
        await recordFirst();
        await page.click(card);
        await page.waitForSelector('[data-ag-panel]', { timeout: 5000 }).catch(() => {});
        const f1 = await page.evaluate(() => window.__agFirst);
        ok('11b the panel\'s FIRST paint already carries the brief — no half-drawn panel', !!f1 && f1.brief && !f1.skel, JSON.stringify(f1));
        await page.evaluate(() => { try { closeModal(); } catch (_){} });
      }
      /* SLOW: the record's own read held back, so the wait runs out. */
      await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2000);
      await page.route(u => new URL(u).pathname === '/api/contracts/' + fresh.a, async r => {
        if (r.request().method() === 'GET') await new Promise(res => setTimeout(res, 900));
        await r.continue();
      });
      await page.evaluate(() => setView('agents')); await page.waitForTimeout(700);
      await pick('paper');
      if (await page.$(card)) {
        await recordFirst();
        await page.click(card);
        await page.waitForSelector('[data-ag-panel]', { timeout: 5000 }).catch(() => {});
        const f2 = await page.evaluate(() => window.__agFirst);
        ok('11c slow: the brief\'s place is held by a placeholder the size of a brief, never an empty gap',
          !!f2 && f2.skel && !f2.brief && f2.skelH >= 100, JSON.stringify(f2));
        await page.screenshot({ path: path.join(OUT, '11-placeholder.png') });
        await page.waitForFunction(() => { const b = document.querySelector('[data-ag-panel] [data-ag-tile="brief"]'); return !!b && /FY2026 external audit/.test(b.textContent); }, null, { timeout: 8000 }).catch(() => {});
        const after = await page.evaluate(() => {
          const p = document.querySelector('[data-ag-panel]');
          const b = p && p.querySelector('[data-ag-tile="brief"]');
          return { brief: !!b && /FY2026 external audit/.test(b.textContent), skel: !!(b && b.querySelector('.ag-skel')),
            sameStd: !!window.__agStd && window.__agStd === (p && p.querySelector('[data-ag-tile="playbook"]')) };
        });
        ok('11d when it lands the brief fills its place', after.brief && !after.skel, JSON.stringify(after));
        ok('11e and only the brief is swapped — the standards section beside it is the very same element', after.sameStd, JSON.stringify(after));
        await page.screenshot({ path: path.join(OUT, '11-landed.png') });
        await page.evaluate(() => { try { closeModal(); } catch (_){} });
      }
      await page.unroute(u => new URL(u).pathname === '/api/contracts/' + fresh.a).catch(() => {});
    }
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    ok('no page errors', errs.length === 0, errs.join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
