/* Chromium verification: EVERY PARTY BUT OURS ON THE RIGHT-HAND PANEL (Young
   ruled it 26 Sep 2026).
   ====================================================================
   "For contracts that have multiple parties, all the parties apart from the
   owner should be listed on the right panels. MK-430 as an example has another
   party in the contract as well but they are not listed on the right panels."

   f391 pins what the code SAYS. This file measures what a reader SEES on the
   real app, at 1440 wide, on the four panels that describe a contract: the
   Contracts page, the Negotiations page, Approvals & signing, and the
   departures panel under Our standards. A contract recorded between us, its
   customer and a guarantor must name BOTH outside parties there, each on a
   line of its own with the word the paper calls them beside it — and our own
   side on none of them.

   THE STAGE is a new workspace with the sample portfolio. One live contract is
   given an ask from the other side (so it is on Negotiations) and a third
   party; the first contract on Approvals & signing is given one too; the
   product's own rule-based standards check is run and a contract that departs
   is given one. Nothing is sent and nothing is signed.

   Every claim is GATED on the panel being on the page, so a build without the
   change REPORTS its failures rather than timing out. AT THE PARENT (0e93de1)
   10 of 16 FAIL, MEASURED in a worktree — the head reads "SAP East Africa+1",
   the guarantor is on the hover only, and the departures panel names the
   customer alone. The six that pass there pass on both sides by design and
   are named: the stage, the control 1f (a two-party contract's head is its
   one name, as it always was), the three walls 1d, 2b and 4b (our own side
   was never on the panel, and still is not) and the page-error sweep.

   Run: node test/chromium/every-party-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'every-party');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const THIRD = 'Nordkust Holding ASA';

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};

/* What one panel's head says, measured off the painted page. `sel` is the
   element the parties are drawn in: the heading on the list panels, the line
   under the contract's name on the departures panel. */
async function readHead(page, hostSel, sel){
  return page.evaluate(({ hostSel, sel }) => {
    const host = document.querySelector(hostSel);
    if (!host) return null;
    const box = host.querySelector(sel);
    /* a head that is not drawn reports as empty lines, so every check below says so rather than throwing */
    if (!box) return { id: host.getAttribute('data-ins-id'), box: false, many: false, text: '', names: [], roles: [], tops: [], shown: [], inside: false, titles: [], plusN: false };
    const lines = [...box.querySelectorAll('[data-ins-party]')];
    const pr = host.getBoundingClientRect();
    return {
      id: host.getAttribute('data-ins-id'),
      box: true,
      many: box.classList.contains('is-many'),
      text: box.textContent.replace(/\s+/g, ' ').trim(),
      names: lines.map(l => (l.querySelector('.ins-cp-n') || {}).textContent || ''),
      roles: lines.map(l => (l.querySelector('.ins-cp-r') || {}).textContent || ''),
      tops: lines.map(l => Math.round(l.getBoundingClientRect().top)),
      shown: lines.map(l => { const r = l.getBoundingClientRect(); return r.width > 0 && r.height > 0; }),
      inside: lines.every(l => { const r = l.getBoundingClientRect(); return r.left >= pr.left - 0.5 && r.right <= pr.right + 0.5; }),
      titles: lines.map(l => l.getAttribute('title') || ''),
      plusN: !!box.querySelector('.reg-py-n') || /\+\d/.test(box.textContent),
    };
  }, { hostSel, sel });
}

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
    /* RE-POINTED 20 Oct 2026 (Chambers): the bar's language switch is gone; langSet is the one writer */
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en') langSet('en'); }); await page.waitForTimeout(800);

    /* ---- THE STAGE ---- */
    await page.evaluate(() => setView('approvals')); await page.waitForTimeout(1000);
    const apFirst = await page.evaluate(() => (document.querySelector('.ap-table tbody tr[data-ap-row]') || { getAttribute: () => null }).getAttribute('data-ap-row'));
    const staged = await page.evaluate(async ({ apFirst, THIRD }) => {
      const three = c => partiesSet(c, [
        { side: 'ours', name: 'Highland Corporate Ltd' },
        { side: 'theirs', name: c.counterparty, role: 'Customer', email: c.counterpartyEmail || '' },
        { side: 'theirs', name: THIRD, role: 'Guarantor', involvement: 'sign' },
      ]);
      const live = state.contracts.filter(c => c.status !== 'Signed' && c.status !== 'Declined' && !c.archived && c.counterparty);
      /* A — a live negotiation, the other side's ask filed through the product's own funnel. */
      const A = live.find(c => c.id !== apFirst);
      if (!A) return null;
      try { await ensureFull(A); } catch (e) {}
      A.changes = []; delete A.negotiation;
      negoInit(A);
      const cls = negoClauseList(A).filter(x => x && x.clauseId && x.clauseId !== 'front');
      const cl = cls[Math.min(2, cls.length - 1)];
      const now = negoClauseNowById(A, cl.clauseId);
      const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
      await negoEditClause(A, cl.clauseId, body.replace(/<\/p>(?![\s\S]*<\/p>)/, ' Payment is due within sixty (60) days.</p>'),
        { side: 'counterparty', author: A.counterparty });
      const errA = three(A);
      /* B — the first contract on Approvals & signing. */
      const B = apFirst ? getContract(apFirst) : null;
      const errB = B ? three(B) : 'no approvals row';
      /* C — a contract that departs from a standard, off HaTi's own rule-based check. */
      state.aiConfigured = false;
      let C = null;
      for (const c of live.filter(x => x !== A && x !== B).slice(0, 8)) {
        try { await ensureFull(c); } catch (e) {}
        try { const r = await runPlaybookReview(c, { quiet: true }); if (r && !r.error) { c.playbook = r; persist(c); } } catch (e) {}
        if (!C && typeof stdDepartures === 'function' && stdDepartures(c).length) C = c;
      }
      const errC = C ? three(C) : 'no contract departs';
      /* D — the control: a contract nobody has named a third party on. */
      const D = live.find(c => ![A, B, C].includes(c) && !(Array.isArray(c.parties) && c.parties.length));
      /* …on Negotiations too, an ask from the other side as A has, so the
         control stands on a list that still draws the panel (step 7) */
      if (D){ try { await ensureFull(D); } catch (e) {}
        D.changes = []; delete D.negotiation; negoInit(D);
        const dcl = negoClauseList(D).filter(x => x && x.clauseId && x.clauseId !== 'front');
        const dk = dcl[Math.min(2, dcl.length - 1)]; const dnow = negoClauseNowById(D, dk.clauseId);
        const dbody = (dnow && dnow.bodyHtml) || '<p>' + ((dnow && dnow.text) || '') + '</p>';
        await negoEditClause(D, dk.clauseId, dbody.replace(/<\/p>(?![\s\S]*<\/p>)/, ' Payment is due within sixty (60) days.</p>'), { side: 'counterparty', author: D.counterparty });
        persist(D); }
      [A, B, C].filter(Boolean).forEach(c => persist(c));
      try { await flushSaves(); } catch (e) {}
      return { A: A.id, B: B && B.id, C: C && C.id, D: D && D.id, errA, errB, errC,
        cpA: A.counterparty, cpB: B && B.counterparty, cpC: C && C.counterparty, cpD: D && D.counterparty };
    }, { apFirst, THIRD });
    ok('0 · the stage: three contracts between us, a customer and a guarantor, and one control',
      !!(staged && !staged.errA && !staged.errB && !staged.errC && staged.D), staged);
    if (!staged) throw new Error('nothing to stage');

    const expectNames = cp => `${cp} | ${THIRD}`;
    const listed = (r, cp) => !!r && r.box && r.many && r.names.join(' | ') === expectNames(cp)
      && r.shown.every(Boolean) && r.tops.length === 2 && r.tops[1] > r.tops[0] && r.inside;

    /* RETIRED 17 Nov 2026 (#762, owner's ruling 4): sections 1 (1a–1f), 2 (2a, 2b) and 3 (3a) — the Negotiations and
       Approvals panels name every outside party on a line of its own, with its role, and a two-party control. In the
       new look those panels are the five parts (ngnPanelFiveHtml, apnLeadFiveHtml) and carry no all-parties list; the
       owner ruled it stays gone (a guarantor named only by its first other party is accepted). */
    void listed;

    /* ================= 4 · OUR STANDARDS, THE DEPARTURES PANEL ================= */
    let s1 = null;
    if (staged.C) {
      await page.evaluate(() => setView('playbook')); await page.waitForTimeout(1200);
      await page.evaluate(({ id }) => sdGoDev({ id }), { id: staged.C }); await page.waitForTimeout(600);
      s1 = await readHead(page, '#ins-panel', '.ins-sub.is-item');
    }
    ok('4a Our standards: under the contract\'s name, both outside parties, one line each', !!s1 && s1.box
      && s1.names.join(' | ') === expectNames(staged.cpC) && s1.tops.length === 2 && s1.tops[1] > s1.tops[0] && s1.inside,
      s1 ? { id: s1.id, names: s1.names, tops: s1.tops, text: s1.text } : 'no departing contract, or no panel');
    ok('4b [wall] and not our own side', !!s1 && s1.box && !/Highland Corporate/.test(s1.text), s1 && s1.text);
    await page.screenshot({ path: path.join(OUT, '4-standards-departures-three-parties.png') });

    /* RETIRED 17 Nov 2026 (#762, owner's ruling 4): 5a (after a refresh the Negotiations panel still names both) and
       6a (the role word on that list reads AA) — the panels' all-parties list stays gone in the new look. */

    ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
