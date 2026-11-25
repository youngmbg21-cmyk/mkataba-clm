/* THE SIDE PANEL NEVER GROWS WIDER THAN ITSELF (owner, 25 Nov 2026; f1227).
   At the iPad's size (1180×820, touch) and the shortest laptop (1366×950), on every tab of a contract's panel —
   Dossier, Clauses, Redlines with changes, Redlines with none (the playbook's gap rows) — nothing inside #ig-dock
   scrolls sideways and nothing stands past its right edge.
   At the parent the empty Redlines tab fails: the gap rows did not wrap (577px in a 383px panel).
   Run: node test/chromium/panel-never-wider-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? ' — ' + (typeof m === 'string' ? m : JSON.stringify(m)) : ''}`); if (!ok) fails++; };
const HTML = '<h1>SOFTWARE AS A SERVICE AGREEMENT</h1><p>This Agreement is made between Maersk A/S ("Maersk") and nShift Group A/S ("Supplier").</p>'
  + '<h1>1 SCOPE</h1><p>1.1 <b>Scope.</b> The Agreement sets out the terms and conditions for the delivery of Services to Maersk or any of its Affiliates.</p>'
  + '<h1>2 CHARGES</h1><p>2.1 <b>Price changes.</b> Supplier may revise pricing by providing thirty (30) days\' written notice to Maersk at any time during the term.</p>'
  + '<h1>3 GOVERNING LAW</h1><p>3.1 <b>Law.</b> This Agreement is governed by the laws of Denmark and the parties submit to the exclusive jurisdiction of its courts.</p>';
const PB = { verdicts: [
  { category: 'Price changes', status: 'deviation', quote: 'Supplier may revise pricing by providing thirty (30) days\' written notice to Maersk at any time during the term.', position: 'Prices fixed for a year' },
  { category: 'Governing law', status: 'deviation', quote: 'This Agreement is governed by the laws of Denmark and the parties submit to the exclusive jurisdiction of its courts.', position: 'Swedish law' },
  { category: 'Data protection', status: 'missing', position: 'A data processing clause' }] };
(async () => {
  const h = await startHati();
  const mk = (id, name) => Object.assign(fixtureContract(id, name, 'nShift Group A/S', 'proc', 600000, 'Under Review', 'x'),
    { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, playbook: PB, upload: { name: id + '.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [mk('MK-610', 'Software as a Service'), mk('MK-611', 'Software as a Service two')] });
  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  for (const [W, HH] of [[1180, 820], [1366, 950]]) {
    const ctx = await b.newContext({ viewport: { width: W, height: HH }, hasTouch: true }); const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await p.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
    await until(p, () => typeof roomHomeLand === 'function' && !!currentUser() && !!getContract('MK-610'), null, 40000);
    await p.evaluate(async () => { const c = getContract('MK-610'); if (window.ensureFull) await ensureFull(c);
      const cl = negoClauseList(c).find(x => /Denmark/.test(x.text)); if (cl) await negoEditClause(c, cl.clauseId, String(cl.text).replace('Denmark', 'Sweden'), { side: 'owner' }); });
    const sweep = () => p.evaluate(() => { const dock = document.getElementById('ig-dock'); if (!dock) return ['no panel']; const dr = dock.getBoundingClientRect(); const bad = [];
      for (const el of dock.querySelectorAll('*')) { const cs = getComputedStyle(el), r = el.getBoundingClientRect(); if (!r.width || cs.position === 'fixed') continue;
        if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) bad.push('scrolls sideways: ' + el.tagName + '.' + String(el.className).slice(0, 30) + ' ' + el.clientWidth + '/' + el.scrollWidth);
        else if (r.right > dr.right + 1) bad.push('past the edge: ' + el.tagName + '.' + String(el.className).slice(0, 30)); }
      return bad.slice(0, 5); });
    for (const [name, go, ready] of [
      ['Dossier', "roomHomeLand('MK-610',{open:true})", "!!document.querySelector('#ig-dock .pd2-card, #ig-dock [data-pd-tab=\"copilot\"]')"],
      ['Clauses', "pdSetTab('doc')", "!!document.querySelector('#ig-dock .doc-th-row, #ig-dock .doc-thread, #ig-dock [data-pd-tab=\"doc\"].on')"],
      ['Redlines with changes', "pdRedOpen('MK-610')", "!!document.querySelector('#ig-dock #nego-cards')"],
      ['Redlines with none (the playbook gap rows)', "pdRedOpen('MK-611')", "!!document.querySelector('#ig-dock .rl-ed-row')"]]) {
      await p.evaluate(f => { setView('dashboard'); (0, eval)(f); }, go);
      const up = await until(p, r => (0, eval)(r), ready, 15000);
      const bad = up ? await sweep() : ['the tab did not draw'];
      check(`${W}×${HH} ${name}: nothing scrolls sideways or stands past the panel's edge`, !bad.length, bad);
    }
    check(`${W}×${HH} no page errors`, !errs.length, errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  await b.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
