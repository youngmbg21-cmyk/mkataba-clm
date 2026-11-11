/* A DECISION REDRAWS ONLY ITS CLAUSE (owner, 11 Nov 2026: "time it on GitHub first, then fix Accept and Reject").
   Measured on GitHub: one Accept on a 40-section contract froze the page about 125 ms, the decision itself 6; the rest
   was the whole paper built and cut into pages again, and Jambo's panel written twice. Counted here, never timed:
     1 · Accept in the Redlines panel: the paper is NOT built whole, one block of it is put back, the panel is written once
     2 · the words on the page are, block for block, what a whole drawing makes (and stay the same when it is then drawn whole)
     3 · Reject (the record's own door, then the panel's repaint): the same
     4 · the Clean paper is patched the same way, and reads the same as its whole drawing
     5 · another switch position is still drawn whole (the patch never guesses)
   At the parent every check fails (no igPaperLastPatch; the paper is built whole and the panel twice).
   Run: node test/chromium/decision-redraws-one-clause-verify.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const W = require('../notes-world');
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const A = (n, t, subs) => `<h2>ARTICLE ${n}: ${t}</h2>` + subs.map(([h, b]) => `<p>${h}</p><p>${b}</p>`).join('');
const HTML = '<h1>COMMERCIAL LEASE AGREEMENT</h1><p>This Commercial Lease Agreement is made between Ventura Capital ("Landlord") and Highland Corporate Ltd ("Tenant").</p>'
  + A('I', 'PREMISES', [['1.1 Premises.', 'Landlord leases to Tenant the premises at the address stated in Schedule A.']])
  + A('II', 'RENT AND CHARGES', [['2.1 Base Rent.', 'Tenant covenants and agrees to pay Base Rent monthly in advance without any deduction or set-off whatsoever.'], ['2.2 Security Deposit.', 'Upon execution of this Lease Tenant shall deposit three months of Base Rent.']])
  + A('III', 'USE OF PREMISES AND MAINTENANCE', [['3.1 Permitted Use.', 'The Premises shall be used and occupied solely for Permitted Use of Premises and for no other purpose without Landlord\'s prior written consent.']])
  + A('IV', 'INSURANCE AND INDEMNIFICATION', [['4.1 Tenant Insurance.', 'Tenant shall maintain commercial general liability insurance.'], ['4.2 Indemnification.', 'Tenant shall indemnify and hold Landlord harmless from any claims, losses and expenses.']]);
const BD = { head: 'Rent first', sub: '', links: [], regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: '', items: [{ ref: '2.1', title: 'Base Rent' }], quotes: [] }],
  points: [{ clause: '2.1', region: 1, status: 'look', missing: false, title: 'Rent · no deductions allowed', stake: 'You must pay full rent every month no matter what.', quote: 'without any deduction or set-off whatsoever', links: [] },
    { clause: '4.2', region: 1, status: 'look', missing: false, title: 'Indemnity · broad and one-sided', stake: 'Only the tenant indemnifies.', quote: 'indemnify and hold Landlord harmless', links: [] }] };
(async () => {
  const h = await startHati();
  const c = fixtureContract('MK-110', 'Commercial Lease Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'Lease.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [c] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 780 } });
  p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
  await p.evaluate(W.IN_PAGE, BD);
  await until(p, () => !!(getContract('MK-110').breakdown || {}).ok, null, 20000);
  /* four changes of theirs, on four clauses (one stays open to the end, so the switch stays) */
  const filed = await p.evaluate(async () => { const c = getContract('MK-110'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front'); let n = 0;
    for (const [re, a, z] of [[/Permitted Use/, 'solely for', 'solely and only for'], [/Base Rent/, 'monthly in advance', 'quarterly in advance'], [/Tenant Insurance/, 'commercial general liability', 'full commercial general liability'], [/Security Deposit/, 'three months', 'two months']]){
      const cl = cls.find(x => re.test(JSON.stringify(negoClauseNowById(c, x.clauseId) || {}))); if (!cl) continue;
      const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
      try { await negoEditClause(c, cl.clauseId, body.replace(a, z), { side: 'counterparty', author: 'Ventura' }); n++; } catch (e) { return 'ERR ' + e.message; } }
    await persist(c); return n; });
  await p.evaluate(() => { pdOpenOnHome('MK-110', 'copilot'); });
  await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper'), null, 20000);
  await p.evaluate(() => { if (typeof pdRedOpen === 'function') pdRedOpen('MK-110'); });
  const faceUp = await until(p, () => !!document.querySelector('#pd-redface [data-nego-accept]') && !!document.querySelector('#ig-paper .ig-redpaper:not(.is-clean)'), null, 20000);
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  /* what one act builds, and whether the page then reads as a whole drawing would */
  const act = (kind) => p.evaluate(async kind => {
    if (typeof igPaperLastPatch !== 'function' || typeof igRedBodyHtml !== 'function') return { missing: 'igPaperLastPatch' };
    const host = document.getElementById('ig-paper'), dock = document.getElementById('ig-dock'); const n = { papers: 0, panel: 0 };
    const mo = new MutationObserver(recs => recs.forEach(r => { const add = [...r.addedNodes].filter(x => x.nodeType === 1);
      if (r.target === host && add.some(x => x.classList.contains('ig-paper-wrap'))) n.papers++;
      if (r.target === dock && add.length) n.panel++; }));
    mo.observe(host, { childList: true }); mo.observe(dock, { childList: true });
    const sc0 = document.getElementById('ig-paper-scroll'); if (sc0) sc0.scrollTop = 240; const top0 = sc0 ? sc0.scrollTop : 0;
    const c = getContract('MK-110');
    if (kind === 'accept'){ const btn = document.querySelector('#pd-redface [data-nego-accept]'); if (!btn) return { missing: 'accept button' }; btn.click(); }
    else if (kind === 'reject'){ const ch = (c.changes || []).find(x => x.status === 'pending'); if (!ch) return { missing: 'a pending change' }; if (!negoResolve(c, ch.id, 'rejected', { side: 'owner', reply: 'No' })) return { missing: 'refused: ' + (window.negoLastRefusal || '') }; pdRedRepaint(); }
    else if (kind === 'refresh'){ igPaperRefresh(); }
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    for (let k = 0; k < 6; k++) await frame();
    await new Promise(r => setTimeout(r, 0));
    mo.disconnect();
    const patch = igPaperLastPatch();
    /* block for block against a whole drawing's markup */
    const doc = document.querySelector('#ig-canvas .rl-zoom > .rl-paper'); if (!doc) return { missing: 'the paper' };
    const live = [...doc.children].filter(x => !x.hasAttribute('data-pg-layer'));
    const clean = !!document.querySelector('#ig-paper .ig-redpaper.is-clean');
    const t = document.createElement('template'); t.innerHTML = igRedBodyHtml(getContract('MK-110'), clean);
    const fresh = [...t.content.querySelector('.rl-zoom > .rl-paper').children];
    const sameSrc = live.length === fresh.length && live.every((x, i) => x._igSrc === fresh[i].outerHTML);
    const words = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
    const before = live.map(words).join(' | ');
    const top1 = (document.getElementById('ig-paper-scroll') || {}).scrollTop;
    /* and then drawn whole: the same words */
    delete host.dataset.for; igPaintPaper();
    const doc2 = document.querySelector('#ig-canvas .rl-zoom > .rl-paper');
    const after = [...doc2.children].filter(x => !x.hasAttribute('data-pg-layer')).map(words).join(' | ');
    return { patch, papers: n.papers, panel: n.panel, blocks: live.length, sameSrc, sameWords: before === after && before.length > 200, kept: Math.abs(top1 - top0) < 2, top0, top1 };
  }, kind);
  const ok = r => !r.missing && r.patch && r.patch.n >= 1 && r.patch.n < r.patch.of && r.papers === 0 && r.panel === 1;
  const r1 = faceUp ? await act('accept') : { missing: 'the Redlines panel' };
  check('1 · Accept: the paper is not built whole, a block is put back, the panel is written once, the place is kept', filed === 4 && ok(r1) && r1.kept, r1);
  check('2 · block for block the page is what a whole drawing makes, and reads the same once drawn whole', !r1.missing && r1.sameSrc && r1.sameWords, { sameSrc: r1.sameSrc, sameWords: r1.sameWords, blocks: r1.blocks });
  const r3 = faceUp ? await act('reject') : { missing: 'the Redlines panel' };
  check('3 · Reject: the same', ok(r3) && r3.sameSrc && r3.sameWords, r3);
  /* 4 · the Clean paper: accept the last change by the record, refresh, compare */
  const toClean = await p.evaluate(() => { const b = document.querySelector('#ig-strip [data-ig-red="0"]'); if (!b) return false; b.click(); return true; });
  const cleanUp = toClean && await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper.is-clean'), null, 10000);
  const r4 = cleanUp ? await p.evaluate(() => { const c = getContract('MK-110'); const ch = (c.changes || []).find(x => x.status === 'pending'); if (!ch) return 'no pending change'; return negoResolve(c, ch.id, 'accepted', { side: 'owner' }) ? 'ok' : 'refused'; }) : 'no clean paper';
  const r4b = r4 === 'ok' ? await act('refresh') : { missing: r4 };
  check('4 · the Clean paper takes the agreed words by a patch, and reads as its whole drawing', !r4b.missing && r4b.patch && r4b.patch.n >= 1 && r4b.papers === 0 && r4b.sameSrc && r4b.sameWords, r4b);
  /* 5 · another switch position is drawn whole */
  const r5 = await p.evaluate(async () => { const host = document.getElementById('ig-paper'); let papers = 0;
    const mo = new MutationObserver(recs => recs.forEach(r => { if (r.target === host && [...r.addedNodes].some(x => x.nodeType === 1 && x.classList.contains('ig-paper-wrap'))) papers++; })); mo.observe(host, { childList: true });
    const b = document.querySelector('#ig-strip [data-ig-red="1"]'); if (!b) return { missing: true }; b.click();
    for (let k = 0; k < 6; k++) await new Promise(r => requestAnimationFrame(() => r())); mo.disconnect();
    return { papers, red: !!document.querySelector('#ig-paper .ig-redpaper:not(.is-clean)') }; });
  check('5 · another switch position is still drawn whole', !r5.missing && r5.papers === 1 && r5.red, r5);
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
