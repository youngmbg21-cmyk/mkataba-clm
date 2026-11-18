/* APPROVALS & SIGNING, "ONE WORKLIST" (round 15 of the redesign: the owner
   picked "One worklist" by name, 17 Oct 2026; js/views/approvalsview.js
   apWorkRows, renderApprovalsPage)

   WHAT THIS PINS, driven in a real browser as a colleague (not an admin)
     1 one list, no tabs: approvals and signatures together, a Kind column
     2 grouped by who owes the next step: "Yours to answer" (an approval asked
       of you, your signature) first, then "Waiting on others" (an approval you
       raised, waiting on its approver)
     3 Whose turn says it: "You", "You sign", the approver's name for the rest;
       the band counts both groups in the same words
     4 a signature's row opens its own panel (what stands before signing);
       an approval's carries Approve and Refuse
     5 the owner's three screens: the list and its panel in view, nothing
       sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/one-worklist-verify.js */
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
const RULES = [
  { id: 'r-leg', name: 'Legal lead', order: 1, cond: { type: 'value', op: '>=', value: 50000000 }, approver: { kind: 'role', role: 'legal' } },
  { id: 'r-fin', name: 'Finance director', order: 2, cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } },
];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: RULES });
  const me = W.users.unrestricted, admin = (await W.admin.json('/api/bootstrap')).me;
  const mk = async (id, name, value, owner, extra) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: Object.assign({
    id, name, counterparty: name.split(' ')[0] + ' AB', folder: H.FOLDER_A, status: 'Under Review', value, valueType: 'estimated', template: 'RM',
    fields: {}, metadata: {}, comments: [], audit: [], signatures: [], owner }, extra || {}) } });
  await mk('MK-WL-1', 'Helio power purchase', 60000000, { id: admin.id, name: admin.name });
  await mk('MK-WL-2', 'Kustfrakt freight', 6000000, { id: me.id, name: me.name });
  await mk('MK-WL-3', 'Stratos support', 300000, { id: admin.id, name: admin.name },
    { signerPlan: [{ id: 's-me', party: 'internal', name: me.name, memberId: me.id, order: 1 }] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'everything@example.co.ke'); await page.fill('#li-pass', 'their-own-pass-9'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-WL-3'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => setView('approvals'));
    await until(() => document.querySelectorAll('[data-ap-row]').length >= 3, null, 10000);
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; the harmony review, owner's yes 9 Nov 2026, and
       Jambo's panels, 16 Nov): Approvals is ONE table (.apn-table) under the page's own head, its tabs Mine · Waiting on
       others · Done ([data-apn-tab]); approvals and signatures together, the signatures under a "Signing" group line
       (that line says the kind — the Kind column's place), each row's kind on the row (data-ap-kind) and whose turn on its
       mark (the mark's title, apTurnText); the head's facts count what is yours in "to decide · to sign"; Approve and
       Decline stand on the row (the panel has no button: apnLeadFiveHtml). WHAT IS PINNED IS UNCHANGED: one list, the
       kinds said, yours first, whose turn said, the counts the same as the tab, a decision one press away. */
    const READ = () => {
      const rows = [], groups = [];
      document.querySelectorAll('.apn-table tbody tr').forEach(tr => {
        if (tr.classList.contains('apn-group')) { groups.push({ k: tr.textContent.trim(), at: rows.length }); return; }
        if (!tr.hasAttribute('data-ap-row')) return;
        const mk = tr.querySelector('.ls-mk');
        rows.push({ id: tr.getAttribute('data-ap-row'), kind: tr.getAttribute('data-ap-kind'), turn: mk ? mk.getAttribute('title') : null,
          approve: !!tr.querySelector('[data-ap-approve]'), refuse: !!tr.querySelector('[data-ap-refuse]'), sign: !!tr.querySelector('[data-ap-open]') }); });
      return { tabs: [...document.querySelectorAll('[data-apn-tab]')].map(b => ({ k: b.getAttribute('data-apn-tab'), label: (b.firstChild || {}).textContent.trim(),
        n: Number(((b.querySelector('span') || {}).textContent || '0').replace(/\D/g, '')) || 0, on: b.classList.contains('is-on') })),
        heads: [...document.querySelectorAll('.apn-table thead th')].map(t => t.textContent.trim()),
        rows, groups, facts: (document.querySelector('[data-ap-facts]') || {}).textContent || '', rules: !!document.querySelector('[data-ap-rules]') };
    };
    await until(() => document.querySelectorAll('.apn-table tbody tr[data-ap-row]').length >= 2, null, 8000);
    const A = await page.evaluate(READ);
    const row = id => A.rows.find(r => r.id === id) || {};
    const ids = A.rows.map(r => r.id);
    const sgAt = A.groups.length ? A.groups[0].at : -1;
    check('1 one list (approvals and signatures together), the signatures under one "Signing" line, a Rule column',
      ids.includes('MK-WL-1') && ids.includes('MK-WL-3') && A.groups.length === 1 && A.groups[0].k === 'Signing'
      && ids.indexOf('MK-WL-3') >= sgAt && ids.indexOf('MK-WL-1') < sgAt && A.heads.includes('Rule'), JSON.stringify({ heads: A.heads, groups: A.groups, ids }));
    const tabRows = async k => { await page.evaluate(v => { const b = document.querySelector(`[data-apn-tab="${v}"]`); if (b) b.click(); }, k);
      return until(v => { const b = document.querySelector(`[data-apn-tab="${v}"]`); return b && b.classList.contains('is-on')
        ? [...document.querySelectorAll('.apn-table tbody tr[data-ap-row]')].map(tr => tr.getAttribute('data-ap-row')) : null; }, k, 4000); };
    const othersIds = await tabRows('others') || [], mineIds = await tabRows('mine') || [];
    check('2 the tabs are the groups: "Mine" (the approval asked of you, your signature), "Waiting on others" (the one you raised)',
      A.tabs.map(t => t.label).slice(0, 2).join(' · ') === 'Mine · Waiting on others'
      && ['MK-WL-1', 'MK-WL-3'].every(id => mineIds.includes(id)) && JSON.stringify(othersIds) === JSON.stringify(['MK-WL-2']),
      JSON.stringify({ tabs: A.tabs, mineIds, othersIds }));
    const O = await page.evaluate(() => { const b = document.querySelector('[data-apn-tab="others"]'); if (b) b.click(); return null; })
      .then(() => until(() => { const tr = document.querySelector('.apn-table tbody tr[data-ap-row="MK-WL-2"]'); if (!tr) return null; const mk = tr.querySelector('.ls-mk');
        return { kind: tr.getAttribute('data-ap-kind'), turn: mk ? mk.getAttribute('title') : null, approve: !!tr.querySelector('[data-ap-approve]') }; }, null, 4000));
    await tabRows('mine');
    check('3a the kind and whose turn are said: Approval · You, Signature · You sign, Approval · its approver (not you, no Approve)',
      row('MK-WL-1').kind === 'approval' && row('MK-WL-1').turn === 'You' && row('MK-WL-3').kind === 'signature' && row('MK-WL-3').turn === 'You sign'
      && !!O && O.kind === 'approval' && !!O.turn && !/^You/.test(O.turn) && !O.approve, JSON.stringify({ rows: A.rows, others: O }));
    const mineN = (A.tabs.find(t => t.k === 'mine') || {}).n;
    const fm = /^(\d+) to decide · (\d+) to sign$/.exec(A.facts.trim());
    check('3b the head counts what is yours (to decide · to sign) as the Mine tab does; Approval rules is everyone\'s door',
      !!fm && Number(fm[1]) + Number(fm[2]) === mineN && A.rules, JSON.stringify({ facts: A.facts, tabs: A.tabs, rules: A.rules }));
    await page.click('[data-ap-rules]');
    const RS = await until(() => { const f = document.getElementById('jl-feed') || document.getElementById('ai-feed'); const t = f ? f.textContent.replace(/\s+/g, ' ') : '';
      return /ask for a yes before anyone signs/.test(t) ? { said: true, door: !!(f.querySelector('[data-ai-rule-door="ask_admin"][data-ai-rule="approvals"]')), view: state.view } : null; }, null, 6000);
    check('3c for a non-admin, Jambo says the rules in his panel with the rule\'s own door, Ask an admin; the page stays', !!RS && RS.door && RS.view === 'approvals', JSON.stringify(RS));

    await page.click('[data-ap-row="MK-WL-3"]');
    const P3 = await until(() => { const p = document.getElementById('ins-panel'); return p && /MK-WL-3|Stratos/.test(p.textContent) ? { text: p.textContent.replace(/\s+/g, ' '), approve: !!p.querySelector('[data-ins-act="approve"]') } : null; });
    check('4a a signature\'s row opens its own panel: what stands before signing, no Approve', !!P3 && /before signing|ready to sign|to settle/i.test(P3.text) && !P3.approve, JSON.stringify(P3 && { approve: P3.approve }));
    await page.click('[data-ap-row="MK-WL-1"] .apn-name');
    /* RE-POINTED 16 Nov 2026 (#762): the chosen approval's panel is Jambo's Five panel with no button (apnLeadFiveHtml);
       Approve and Decline stand on the chosen row itself, one press away */
    const P1 = await until(() => { const p = document.getElementById('ins-panel'); const tr = document.querySelector('.apn-table tr[data-ap-row="MK-WL-1"]');
      return p && /Helio/.test(p.textContent) && tr && tr.querySelector('[data-ap-approve]') ? { approve: true, refuse: !!tr.querySelector('[data-ap-refuse]') } : null; });
    check('4b an approval carries Approve and Decline (on its row, beside its panel)', !!P1 && P1.refuse, JSON.stringify(P1));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'one-worklist-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const t = r('.ap-table'), p = r('#ins-panel'), last = [...document.querySelectorAll('tr[data-ap-row]')].pop();
        /* RE-POINTED 28 Oct 2026 (THE LIST LANGUAGE): the reference rides the party's grey line, so the party is the first column */
        const party = document.querySelector('.ap-table thead th:nth-child(1)');
        return { list: !!t && t.top < innerHeight, panel: !!p && p.right <= innerWidth + 1, rows: !!last && last.getBoundingClientRect().bottom <= innerHeight,
          party: party ? Math.round(party.getBoundingClientRect().width) : 0,
          side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`5 ${w}×${ht}: the list, every row and its panel in view, the party column room for a name, nothing sideways`, F.list && F.panel && F.rows && F.party >= 170 && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `one-worklist-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
