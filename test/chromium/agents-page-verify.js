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

   Run: node test/chromium/agents-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

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
    ok('the stage: one of each kind of work, through the product\'s own acts',
      !!staged && staged.ready === 5 && Object.values(staged.per).every(n => n === 1), JSON.stringify(staged));

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
    ok('1d five agents, in the drawing\'s order', head.rows.join(',') === 'round,renew,paper,late,import', head.rows.join(','));
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
    if (renewPanel) await act('notice');
    const letter = await page.evaluate(() => !!document.getElementById('nt-close'));
    ok('3b "Read the letter" opens the notice letter — the renewal card\'s own dialog', letter);
    await page.keyboard.press('Escape'); await page.waitForTimeout(300);
    if (await openFirst()) await act('away');
    /* THE NOTICE LEAVES; the desk's own renewal row for the same contract may
       then stand in its place — that is deskItems' rule (a notice put away is
       not the decision), so the claim is about the NOTICE, read on both pages. */
    const away = await page.evaluate(() => ({
      stamped: !!(getContract('MK-143').desk && getContract('MK-143').desk.notice),
      here: agentsData().agents.renew.ready.filter(x => x.cid === 'MK-143' && x.kind === 'notice').length,
      home: deskItems().filter(x => x.cid === 'MK-143' && x.kind === 'notice').length }));
    ok('3c "Put away" writes the desk\'s own stamp; the notice leaves this page AND Home\'s desk', away.stamped && away.here === 0 && away.home === 0, JSON.stringify(away));

    /* ---- 4. new paper ---- */
    await pick('paper');
    const paperPanel = await openFirst();
    const tiles = await page.evaluate(() => [...document.querySelectorAll('#side-panel .ag-tiles li')].length);
    ok('4a what HaTi read on arrival is laid out tile by tile', paperPanel && tiles >= 3, tiles + ' tiles');
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
    ok('7b the arrow keys walk the agents list, and the focus follows', kb.on === 'renew' && kb.focus === 'renew', JSON.stringify(kb));

    /* ---- 8. the door count follows the work ---- */
    const after = await page.evaluate(() => ({ rail: (document.querySelector('[data-count="agents"]') || {}).textContent || '', ready: agentsData().ready }));
    ok('8a with work done, the count went down and the door and the page still agree', after.rail === String(after.ready) && after.ready < 5, JSON.stringify(after));

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
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    ok('no page errors', errs.length === 0, errs.join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
