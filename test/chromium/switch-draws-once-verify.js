/* THE CLEAN | REDLINE | THEIR VIEW SWITCH DRAWS ONCE (owner, 11 Nov 2026: "why is the press from clean to redlines and so
   forth have a delay?"). Measured before: a press drew the notes twice (the old paper's width watcher heard itself leave),
   Their view drew the whole paper twice, and eight page-wide rules made every small change re-read the page's styles.
   Counted here, never timed (a number of milliseconds depends on the machine):
     1 · Clean → Redline: the paper is built once and its notes are laid out once
     2 · Redline → Clean: the same
     3 · → Their view: the paper is built ONCE, it is their paper, and the Redlines panel is open beside it
     4 · the page says what the panel is (data-igd-head, data-igd-door) and the paper's line keeps its height both ways
   At the parent 1, 2 and 3 fail (two note layouts; two papers) and 4 fails (no marks on the page).
   Run: node test/chromium/switch-draws-once-verify.js */
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
  const filed = await p.evaluate(async () => { const c = getContract('MK-110'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
    const cl = cls.find(x => /Permitted Use/.test(JSON.stringify(negoClauseNowById(c, x.clauseId) || {}))) || cls[3];
    const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
    try { await negoEditClause(c, cl.clauseId, body.replace('solely for', 'solely and only for'), { side: 'counterparty', author: 'Ventura' }); await persist(c); } catch (e) { return 'ERR ' + e.message; }
    return (c.changes || []).length; });
  await p.evaluate(() => { pdOpenOnHome('MK-110', 'copilot'); });
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  const up = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper.is-clean') && !!document.querySelector('#ig-strip [data-ig-red="1"]') && document.querySelectorAll('#pd2-notes .pd2-mn').length >= 1, null, 20000);
  /* COUNT WHAT ONE PRESS BUILDS: papers put on the page (.ig-paper-wrap added under #ig-paper) and layouts of the notes
     (each one writes #pd2-notes' rows afresh). Read after the browser has drawn twice, so a watcher that fires with the
     frame has fired. */
  const press = (v, wantSel) => p.evaluate(async ({ v, wantSel }) => {
    const host = document.getElementById('ig-paper'); const n = { papers: 0, notes: 0 };
    const mo = new MutationObserver(recs => recs.forEach(r => {
      if (r.target === host) r.addedNodes.forEach(x => { if (x.nodeType === 1 && x.classList.contains('ig-paper-wrap')) n.papers++; });
      if (r.target.id === 'pd2-notes' && [...r.addedNodes].some(x => x.nodeType === 1 && x.classList.contains('pd2-mn'))) n.notes++; }));
    mo.observe(host, { childList: true, subtree: true });
    const btn = document.querySelector(`#ig-strip [data-ig-red="${v}"]`); if (!btn) return { missing: true };
    btn.click();
    const frame = () => new Promise(r => requestAnimationFrame(() => r()));
    for (let k = 0; k < 40 && !document.querySelector(wantSel); k++) await frame();
    for (let k = 0; k < 6; k++) await frame();
    await new Promise(r => setTimeout(r, 0));
    mo.disconnect();
    return Object.assign(n, { shown: !!document.querySelector(wantSel), notesUp: document.querySelectorAll('#pd2-notes .pd2-mn').length });
  }, { v, wantSel });
  const r1 = up ? await press('1', '#ig-paper .ig-redpaper:not(.is-clean)') : { missing: true };
  check('1 · Clean → Redline: one paper built, the notes laid out once', filed === 1 && up && r1.shown && r1.papers === 1 && r1.notes === 1, r1);
  const r2 = up ? await press('0', '#ig-paper .ig-redpaper.is-clean') : { missing: true };
  check('2 · Redline → Clean: one paper built, the notes laid out once', up && r2.shown && r2.papers === 1 && r2.notes === 1, r2);
  const r3 = up ? await press('theirs', '#pd-redface') : { missing: true };
  const theirs = await p.evaluate(() => ({ pressed: !!document.querySelector('#ig-strip [data-ig-red="theirs"][aria-pressed="true"]'), face: !!document.getElementById('pd-redface'), paper: !!document.querySelector('#ig-paper .ig-redpaper:not(.is-clean)') }));
  check('3 · Their view: the paper is built ONCE, it is theirs, and the Redlines panel is open', up && r3.shown && r3.papers === 1 && theirs.pressed && theirs.face && theirs.paper, Object.assign(r3, theirs));
  /* 4 · the page says what the panel is, open and folded, and the paper's line keeps its height */
  const marks = () => p.evaluate(() => { const pg = document.getElementById('ig-page'), st = document.getElementById('ig-strip');
    return { head: pg.getAttribute('data-igd-head'), door: pg.hasAttribute('data-igd-door'), strip: st ? Math.round(st.getBoundingClientRect().height) : null, bar: Math.round(parseFloat(getComputedStyle(pg).getPropertyValue('--ig-bar-h')) || 0) }; });
  const open = await marks();
  const hasFold = await p.evaluate(() => { const f = document.getElementById('igd-collapse'); if (!f) return false; f.click(); return true; });
  const foldedUp = hasFold && await until(p, () => !!document.querySelector('#ig-dock > .igd-door'), null, 8000);
  const folded = await marks();
  check('4 · the page carries the panel\'s state, open and folded; the paper\'s line keeps its height', open.head === 'paper' && !open.door && foldedUp && folded.door && !folded.head && open.strip === folded.strip && open.strip > 0, { open, folded, hasFold });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
