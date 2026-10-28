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
    const READ = () => {
      const rows = [], groups = [];
      document.querySelectorAll('.ap-table tbody tr').forEach(tr => {
        if (tr.classList.contains('ap-grp')) { const b = tr.querySelector('b'); groups.push({ k: (b || {}).textContent, n: (tr.querySelector('.n') || {}).textContent, whole: tr.firstElementChild.getBoundingClientRect().width >= tr.closest('table').getBoundingClientRect().width - 2, rows: [] }); return; }
        const r = { id: tr.getAttribute('data-ap-row'), kind: (tr.querySelector('.ap-kind') || {}).textContent, turn: (tr.querySelector('.ap-turn') || {}).textContent };
        rows.push(r); if (groups.length) groups[groups.length - 1].rows.push(r.id); });
      return { tabs: document.querySelectorAll('[data-ap-tab]').length, heads: [...document.querySelectorAll('.ap-table thead th')].map(t => t.textContent.trim()),
        rows, groups, facts: (document.querySelector('[data-ap-facts]') || {}).textContent || '', rules: !!document.querySelector('[data-ap-rules]') };
    };
    const A = await page.evaluate(READ);
    const row = id => A.rows.find(r => r.id === id) || {};
    check('1 one list, no tabs, a Kind column', A.tabs === 0 && A.heads.includes('Kind') && A.heads.includes('Rule') && A.heads.includes('Whose turn') /* RE-POINTED 28 Oct 2026: the rule's column is headed Rule, as drawn */, JSON.stringify({ tabs: A.tabs, heads: A.heads }));
    /* RE-POINTED 21 Oct 2026 (Part 8, the list head the Legora way; the
       owner's "tabs only"): ONE plain table, no group rows — the head's tabs
       ([data-ap-view]) are the two groups, each showing its own rows, and
       under All the rows that wait on the reader come first */
    const VIEWS = () => [...document.querySelectorAll('[data-lh-seat="approvals"] [data-ap-view]')].map(b => ({ k: b.getAttribute('data-ap-view'),
      label: (b.firstChild || {}).textContent, n: Number(((b.querySelector('.n') || {}).textContent || '0').replace(/\D/g, '')) || 0 }));
    const viewRows = async k => { await page.evaluate(v => { const b = document.querySelector(`[data-lh-seat="approvals"] [data-ap-view="${v}"]`); if (b) b.click(); }, k);
      return until(v => { const b = document.querySelector(`[data-lh-seat="approvals"] [data-ap-view="${v}"]`); return b && b.getAttribute('aria-selected') === 'true'
        ? [...document.querySelectorAll('.ap-table tbody tr[data-ap-row]')].map(tr => tr.getAttribute('data-ap-row')) : null; }, k, 4000); };
    const V = await page.evaluate(VIEWS);
    const yoursIds = await viewRows('yours') || [], othersIds = await viewRows('others') || [], allIds = await viewRows('all') || [];
    const lastYours = Math.max(...yoursIds.map(id => allIds.indexOf(id))), firstOthers = Math.min(...othersIds.map(id => allIds.indexOf(id)));
    check('2 the tabs are the groups: "Yours to answer" (the approval asked of you, your signature), "Waiting on others" (the one you raised); under All yours come first; no group rows',
      A.groups.length === 0 && V.map(v => v.label).join(' · ') === 'All · Yours to answer · Waiting on others'
      && ['MK-WL-1', 'MK-WL-3'].every(id => yoursIds.includes(id)) && JSON.stringify(othersIds) === JSON.stringify(['MK-WL-2'])
      && allIds.length === yoursIds.length + othersIds.length && lastYours < firstOthers,
      JSON.stringify({ groupRows: A.groups.length, views: V, yoursIds, othersIds, allIds }));
    check('3a Kind and Whose turn say it: Approval · You, Signature · You sign, Approval · its approver',
      row('MK-WL-1').kind === 'Approval' && row('MK-WL-1').turn === 'You' && row('MK-WL-3').kind === 'Signature' && row('MK-WL-3').turn === 'You sign'
      && row('MK-WL-2').kind === 'Approval' && row('MK-WL-2').turn && !/^You/.test(row('MK-WL-2').turn), JSON.stringify(A.rows));
    /* RE-POINTED (lane A1 pass 4, 18 Oct 2026): round 15 draws Approval rules
       for an Editor too — an admin goes to the rules, anyone else hears them
       from Jambo with Ask an admin (f807 (9), jambos-list-panel-verify) */
    /* RE-POINTED 21 Oct 2026 (Part 8): the counts on the title's line are the
       two tabs' numbers, in the same words */
    const nOf = k => (V.find(v => v.k === k) || {}).n;
    check('3b the band counts both groups in the same words as the tabs; Approval rules is everyone\'s door', V.length === 3 && A.facts === `${nOf('yours')} yours to answer · ${nOf('others')} waiting on others` && A.rules, JSON.stringify({ facts: A.facts, views: V, rules: A.rules }));
    await page.click('[data-ap-rules]');
    const RS = await until(() => { const f = document.getElementById('jl-feed') || document.getElementById('ai-feed'); const t = f ? f.textContent.replace(/\s+/g, ' ') : '';
      return /ask for a yes before anyone signs/.test(t) ? { said: true, door: !!(f.querySelector('[data-ai-rule-door="ask_admin"][data-ai-rule="approvals"]')), view: state.view } : null; }, null, 6000);
    check('3c for a non-admin, Jambo says the rules in his panel with the rule\'s own door, Ask an admin; the page stays', !!RS && RS.door && RS.view === 'approvals', JSON.stringify(RS));

    await page.click('[data-ap-row="MK-WL-3"]');
    const P3 = await until(() => { const p = document.getElementById('ins-panel'); return p && /MK-WL-3|Stratos/.test(p.textContent) ? { text: p.textContent.replace(/\s+/g, ' '), approve: !!p.querySelector('[data-ins-act="approve"]') } : null; });
    check('4a a signature\'s row opens its own panel: what stands before signing, no Approve', !!P3 && /before signing|ready to sign|to settle/i.test(P3.text) && !P3.approve, JSON.stringify(P3 && { approve: P3.approve }));
    await page.click('[data-ap-row="MK-WL-1"]');
    const P1 = await until(() => { const p = document.getElementById('ins-panel'); return p && /Helio/.test(p.textContent) && p.querySelector('[data-ins-act="approve"]') ? { approve: true, refuse: !!p.querySelector('[data-ins-act="refuse"]') } : null; });
    check('4b an approval\'s panel carries Approve and Refuse', !!P1 && P1.refuse, JSON.stringify(P1));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'one-worklist-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const t = r('.ap-table'), p = r('#ins-panel'), last = [...document.querySelectorAll('[data-ap-row]')].pop();
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
