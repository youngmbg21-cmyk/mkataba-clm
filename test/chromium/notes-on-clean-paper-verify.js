/* THE NEW LOOK: A NEGOTIATED CONTRACT'S CLEAN PAPER CARRIES ITS NOTES (owner-reported 6 Nov 2026, MK-469: "There are no
   side notes even when in the dossier tab"). pd2NotesPaint put the notes away whenever the paper was the negotiation's
   (.ig-redpaper) in its Clean view, so a contract with a round on the table showed none.
     1 · A lease with their change pending, Clean chosen, Dossier open: the clause groups stand beside the paper,
         clear of it, and the paper has moved left to make room
     2 · Redline: the notes are their asks (pd2RedNotes), as before
   At the parent 1 fails: no notes on the clean paper.
   Run: node test/chromium/notes-on-clean-paper-verify.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const W = require('../notes-world');
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const A = (n, t, subs) => `<h2>ARTICLE ${n}: ${t}</h2>` + subs.map(([h, b]) => `<p>${h}</p><p>${b}</p>`).join('');
const HTML = '<h1>COMMERCIAL LEASE AGREEMENT</h1><p>This Commercial Lease Agreement is made between Ventura Capital ("Landlord") and Highland Corporate Ltd ("Tenant").</p>'
  + A('I', 'PREMISES', [['1.1 Premises.', 'Landlord leases to Tenant the premises at the address stated in Schedule A.']])
  + A('II', 'RENT AND CHARGES', [['2.1 Base Rent.', 'Tenant covenants and agrees to pay Base Rent monthly in advance without any deduction or set-off whatsoever.'], ['2.2 Security Deposit.', 'Upon execution of this Lease Tenant shall deposit three months of Base Rent.'], ['2.3 Utilities and Operating Costs.', 'Tenant shall be responsible for all utilities and its proportionate share of operating costs.']])
  + A('III', 'USE OF PREMISES AND MAINTENANCE', [['3.1 Permitted Use.', 'The Premises shall be used and occupied solely for Permitted Use of Premises and for no other purpose without Landlord\'s prior written consent.'], ['3.2 Maintenance and Repairs.', 'Tenant shall keep the interior of the Premises in clean, sanitary, and good working condition.']])
  + A('IV', 'INSURANCE AND INDEMNIFICATION', [['4.1 Tenant Insurance.', 'Tenant shall maintain commercial general liability insurance with coverage limits of not less than $Insurance Coverage Limit Per Occurrence per occurrence.'], ['4.2 Indemnification.', 'Tenant shall indemnify and hold Landlord harmless from any claims, losses, or damages arising out of Tenant\'s use or occupancy of the Premises.']])
  + A('X', 'CONFIDENTIALITY AND NON-DISCLOSURE', [['X.1 Definition of Confidential Information.', 'For purposes of this Agreement, Confidential Information shall include all information that has commercial value.']])
  + A('XIV', 'TERM, TERMINATION, AND DEFAULT', [['XIV.1 Term.', 'This Lease runs for five years from the Commencement Date.']]);
const BD = { head: 'Rent first', sub: '', links: [], regions: [{ name: 'Money', status: 'look', kind: 'pay', headline: '', items: [{ ref: '2.1', title: 'Base Rent' }], quotes: [] }],
  points: [ { clause: '2.1', region: 1, status: 'look', missing: false, title: 'Rent · no deductions allowed', stake: 'You must pay full rent every month no matter what.', quote: 'without any deduction or set-off whatsoever', links: [] },
    { clause: '2.3', region: 1, status: 'look', missing: false, title: 'Operating costs · open-ended', stake: 'No cap on the share.', quote: 'proportionate share of operating costs', links: [] },
    { clause: '4.2', region: 1, status: 'look', missing: false, title: 'Indemnity · broad and one-sided', stake: 'Only the tenant indemnifies.', quote: 'indemnify and hold Landlord harmless', links: [] },
    { clause: 'X', region: 1, status: 'look', missing: false, title: 'Confidentiality wide', stake: 'Everything is confidential.', quote: 'all information that has commercial value', links: [] } ] };
(async () => {
  const h = await startHati();
  const c = fixtureContract('MK-110', 'Commercial Lease Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'Lease.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [c] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 1024 } });
  p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-110'), null, 40000);
  await p.evaluate(W.IN_PAGE, BD);
  const read = await until(p, () => !!(getContract('MK-110').breakdown || {}).ok && document.querySelectorAll('#pd-thread .doc-th-row').length > 3, null, 20000);
  /* a change of ours on 3.1, unsent: the paper gets its Clean / Redline switch, as MK-469 has */
  const filed = await p.evaluate(async () => { const c = getContract('MK-110'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
    const cl = cls.find(x => /Permitted Use/.test(JSON.stringify(negoClauseNowById(c, x.clauseId) || {}))) || cls[4];
    const now = negoClauseNowById(c, cl.clauseId); const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
    try { await negoEditClause(c, cl.clauseId, body.replace('solely for', 'solely and only for'), { side: 'counterparty', author: 'Ventura' }); await persist(c); } catch (e) { return 'ERR ' + e.message; }
    return (c.changes || []).length; });
  console.log('filed', filed);
  await p.evaluate(() => { pdOpenOnHome('MK-110', 'copilot'); });
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  const clean = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper.is-clean') && pdTab() === 'copilot', null, 15000);
  const shown = await until(p, () => document.querySelectorAll('#pd2-notes .pd2-mg').length >= 2, null, 15000);
  const r1 = await p.evaluate(() => { const a = document.querySelector('#ig-canvas').getBoundingClientRect(); const gs = [...document.querySelectorAll('#pd2-notes .pd2-mg')].map(g => g.getBoundingClientRect());
    return { groups: gs.length, artRight: Math.round(a.right), notesLeft: gs.length ? Math.round(Math.min(...gs.map(g => g.left))) : null, seen: gs.every(g => g.width > 0 && g.height > 0) }; });
  check('1 · clean paper of a negotiated lease: the notes stand beside it, clear of the paper', read && filed === 1 && clean && shown && r1.seen && r1.notesLeft > r1.artRight, r1);
  /* 2 · Redline: their asks */
  await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Redline/.test(x.textContent.trim())); if (b) b.click(); });
  const red = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper:not(.is-clean)') && document.querySelectorAll('#pd2-notes .pd2-mn.is-ask').length >= 1, null, 15000);
  check('2 · Redline: the notes are their asks, as before', red);
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
