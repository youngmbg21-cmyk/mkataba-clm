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
    if (!box) return { id: host.getAttribute('data-ins-id'), box: false };
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
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

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

    /* ================= 1 · CONTRACTS ================= */
    const toContracts = async () => { await page.evaluate(() => { regSetScope(null); setView('register'); }); await page.waitForTimeout(1000); };
    const pickRow = async (tbodySel, attr, id) => {
      const row = await page.$(`${tbodySel} tr[${attr}="${id}"]`);
      if (!row) return false;
      await row.click(); await page.waitForTimeout(350);
      return true;
    };
    await toContracts();
    const onA = await pickRow('#reg-tbody', 'data-row', staged.A);
    const c1 = onA ? await readHead(page, '#ins-panel', 'h2.ins-cp') : null;
    ok('1a Contracts: the panel names both outside parties, each on a line of its own', listed(c1, staged.cpA),
      c1 ? { id: c1.id, names: c1.names, tops: c1.tops, text: c1.text } : `row ${staged.A} not on the first page or no panel`);
    ok('1b the word the paper calls each party is beside its name', !!c1 && c1.roles.join(' | ') === 'Customer | Guarantor', c1 && c1.roles);
    ok('1c no "+1" — the names are the count', !!c1 && c1.box && !c1.plusN, c1 && c1.text);
    ok('1d [wall] our own side is not on the panel', !!c1 && c1.box && !/Highland Corporate/.test(c1.text), c1 && c1.text);
    const lineTitle = await page.evaluate(({ id }) => { const c = getContract(id); return partyLine(partiesTheirs(c)[1]); }, { id: staged.A });
    ok('1e each line carries its whole line on the hover', !!c1 && c1.titles[1] === lineTitle, c1 && { hover: c1.titles[1], want: lineTitle });
    await page.screenshot({ path: path.join(OUT, '1-contracts-three-parties.png') });

    /* the control: an ordinary two-party contract draws one name, as it always did */
    const onD = await pickRow('#reg-tbody', 'data-row', staged.D);
    const d1 = onD ? await readHead(page, '#ins-panel', 'h2.ins-cp') : null;
    const d1Name = await page.evaluate(() => { const h = document.querySelector('#ins-panel h2.ins-cp .ins-cp-n'); return h ? h.textContent : null; });
    ok('1f [control] a two-party contract\'s head is its one counterparty, no list', !!d1 && d1.box && !d1.many && d1.names.length === 0 && d1Name === staged.cpD,
      d1 ? { many: d1.many, lines: d1.names.length, name: d1Name, want: staged.cpD } : 'control row not on the first page');

    /* ================= 2 · NEGOTIATIONS ================= */
    await page.evaluate(() => openNegotiations({ list: true })); await page.waitForTimeout(1200);
    const onNg = await pickRow('#reg-tbody', 'data-row', staged.A);
    const n1 = onNg ? await readHead(page, '#ins-panel', 'h2.ins-cp') : null;
    ok('2a Negotiations: the same contract\'s panel names both outside parties', listed(n1, staged.cpA),
      n1 ? { names: n1.names, tops: n1.tops } : `row ${staged.A} not on the Negotiations list or no panel`);
    ok('2b [wall] and not our own side', !!n1 && n1.box && !/Highland Corporate/.test(n1.text), n1 && n1.text);
    await page.screenshot({ path: path.join(OUT, '2-negotiations-three-parties.png') });

    /* ================= 3 · APPROVALS & SIGNING ================= */
    await page.evaluate(() => setView('approvals')); await page.waitForTimeout(1000);
    const onAp = staged.B ? await pickRow('.ap-table tbody', 'data-ap-row', staged.B) : false;
    const a1 = onAp ? await readHead(page, '#ins-panel', 'h2.ins-cp') : null;
    ok('3a Approvals & signing: the panel names both outside parties', listed(a1, staged.cpB),
      a1 ? { names: a1.names, tops: a1.tops } : 'no approvals row to press, or no panel');
    await page.screenshot({ path: path.join(OUT, '3-approvals-three-parties.png') });

    /* ================= 4 · OUR STANDARDS, THE DEPARTURES PANEL ================= */
    let s1 = null;
    if (staged.C) {
      await page.evaluate(() => setView('playbook')); await page.waitForTimeout(1200);
      await page.evaluate(({ id }) => sdGoDev({ id }), { id: staged.C }); await page.waitForTimeout(600);
      s1 = await readHead(page, '#sd-panel-dev', '.ins-sub.is-item');
    }
    ok('4a Our standards: under the contract\'s name, both outside parties, one line each', !!s1 && s1.box
      && s1.names.join(' | ') === expectNames(staged.cpC) && s1.tops.length === 2 && s1.tops[1] > s1.tops[0] && s1.inside,
      s1 ? { id: s1.id, names: s1.names, tops: s1.tops, text: s1.text } : 'no departing contract, or no panel');
    ok('4b [wall] and not our own side', !!s1 && s1.box && !/Highland Corporate/.test(s1.text), s1 && s1.text);
    await page.screenshot({ path: path.join(OUT, '4-standards-departures-three-parties.png') });

    /* ================= 5 · AFTER A REFRESH — the list the server serves ================= */
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
    await page.keyboard.press('Escape').catch(() => {});
    await toContracts();
    const onA2 = await pickRow('#reg-tbody', 'data-row', staged.A);
    const r1 = onA2 ? await readHead(page, '#ins-panel', 'h2.ins-cp') : null;
    ok('5a after a refresh the panel still names both — the parties ride the list the server sends', listed(r1, staged.cpA),
      r1 ? { names: r1.names, tops: r1.tops } : 'row not found after the refresh');

    /* ================= 6 · READABLE, BY DAY AND AT NIGHT ================= */
    const inkOf = () => page.evaluate(() => {
      const p = document.getElementById('ins-panel'); const r = p && p.querySelector('.ins-cp-r'); if (!r) return null;
      const rgb = s => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
      const lum = c => { const [x, y, z] = rgb(c).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * x + .7152 * y + .0722 * z; };
      const ratio = (a, b) => { const [m, n] = [lum(a), lum(b)].sort((u, v) => v - u); return (m + .05) / (n + .05); };
      return { ratio: +ratio(getComputedStyle(r).color, getComputedStyle(p).backgroundColor).toFixed(2), size: getComputedStyle(r).fontSize };
    });
    const ink = await inkOf();
    ok('6a the role word reads (AA) against the panel', !!ink && ink.ratio >= 4.5, ink);
    await page.evaluate(() => { setDark(true); applyAppearance(); }); await toContracts();
    await pickRow('#reg-tbody', 'data-row', staged.A);
    const night = await inkOf();
    ok('6b and at night', !!night && night.ratio >= 4.5, night);
    await page.screenshot({ path: path.join(OUT, '6-contracts-night.png') });
    await page.evaluate(() => { setDark(false); applyAppearance(); });

    ok('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
