/* THE NOTES FOLLOW THE WORDING (owner, 11 Nov 2026: "what happens to the notes once the counterparty accepts the changes …
   when does the paper update"; then "Automatically"). A lease that Jambo has read, with their change waiting:
     1 · accepted, the Clean paper carries the agreed words at once
     2 · a little later the arrival readings are asked for again, ONCE, marked `agreed` (the reading itself is stood in
         for here: no call is made)
     3 · a second decision that moves no words asks for nothing more
     4 · a contract nobody has read is not read by an acceptance
   At the parent 2 fails (nothing reads again until the next send).
   Run: node test/chromium/notes-follow-the-wording-verify.js */
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
  const up = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper.is-clean'), null, 20000);
  /* Jambo HAS read this wording (the stamp the arrival read leaves), and the reading is stood in for: what is asked of
     it is counted, nothing is spent */
  const ready = await p.evaluate(() => { const c = getContract('MK-110'); const h = triageWordingHash(c); if (!h) return false;
    c.triage = { at: new Date().toISOString(), by: 'x', steps: {}, seenAt: null, hash: h };
    window.__asked = []; window.triageAndPaint = (x, o) => { window.__asked.push({ id: x.id, agreed: !!(o && o.agreed) }); return Promise.resolve(null); };
    return typeof triageWordingMoved === 'function' && typeof TRIAGE_MOVED_MS === 'number'; });
  const acc = await p.evaluate(async () => { const c = getContract('MK-110'); const ch = (c.changes || []).find(x => x.status === 'pending'); if (!ch) return 'no change';
    const r = negoResolve(c, ch.id, 'accepted', { side: 'owner' }); if (!r) return 'refused: ' + (window.negoLastRefusal || ''); await persist(c); if (window.igPaperRefresh) igPaperRefresh(); return r.status; });
  const words = await until(p, () => /solely and only for/.test((document.getElementById('ig-canvas') || {}).textContent || ''), null, 8000);
  check('1 · accepted: the Clean paper carries the agreed words at once', filed === 1 && up && acc === 'accepted' && words, { filed, acc });
  const asked = ready && await until(p, () => (window.__asked || []).length >= 1, null, 12000);
  const a1 = await p.evaluate(() => window.__asked || []);
  check('2 · the readings are asked for again, once, marked agreed', ready && asked && a1.length === 1 && a1[0].id === 'MK-110' && a1[0].agreed === true, { ready, a1 });
  /* 3 · the stand-in stamped nothing, so stamp what a finished reading stamps; a decision that moves no words asks nothing */
  /* the clause review reads the new words after the arrival readings; wait for it to be of these words */
  const fresh = await until(p, () => typeof bdStale === 'function' && !bdStale(getContract('MK-110')), null, 15000);
  const again = await p.evaluate(async () => { const c = getContract('MK-110'); c.triage.hash = triageWordingHash(c); window.__asked = [];
    const started = triageWordingMoved(c); const ran = await triageMovedRun(c.id); return { started, ran, asked: window.__asked.length }; });
  check('3 · the wording did not move: nothing more is asked', fresh && again.ran === false && again.asked === 0, Object.assign(again, { fresh }));
  /* 4 · never read: an acceptance reads nothing */
  const never = await p.evaluate(() => { const c = getContract('MK-110'); const keep = c.triage, bd = c.breakdown; delete c.triage; delete c.breakdown; const r = triageWordingMoved(c); c.triage = keep; c.breakdown = bd; return r; });
  check('4 · a contract nobody has read is not read by an acceptance', never === false, { never });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
