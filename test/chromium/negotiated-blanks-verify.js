/* A BLANK ON A NEGOTIATED PAPER IS FILLED AS A TRACKED CHANGE (owner, 13 Nov 2026: "yes, build option 2").
   On a contract with a negotiation on it, Fill in the contract used to take no typing at all on the paper. Now:
     1 · its blanks are marked for typing where they stand — but none in a clause with a change open on it
     2 · what is typed is filed by Save as OUR change on that clause, pending, through the one door (its note says so)
     3 · the stored wording is not touched (no quiet write): the placeholder is still in it until the change is accepted
     4 · the panel's list names the blank, and the change is in Redlines' count of ours
     5 · nothing on the page threw
   At the parent 1–4 fail (nothing is marked on a negotiated paper).
   Run: node test/chromium/negotiated-blanks-verify.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const HTML = '<h1>OFFICE LEASE</h1><p>This Lease is made between Ventura Capital ("Landlord") and the Tenant.</p>'
  + '<h2>1. Premises</h2><p>Landlord leases the premises to [Tenant Name] for use as offices only.</p>'
  + '<h2>2. Rent</h2><p>Tenant shall pay [Rent Amount] monthly in advance without any deduction.</p>'
  + '<h2>3. Notices</h2><p>Every notice shall be sent in writing to [Notice Address] by hand or by courier.</p>';
(async () => {
  const h = await startHati();
  const c = fixtureContract('MK-120', 'Office Lease', 'Ventura Capital', 'proc', 900000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, upload: { name: 'Lease.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [c] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 780 } });
  const errors = []; p.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-120'), null, 40000);
  await p.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m !== undefined ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  /* their change on Rent: that clause is argued */
  const ids = await p.evaluate(async () => { const c = getContract('MK-120'); if (window.ensureFull) await ensureFull(c);
    const cls = negoClauseList(c).filter(x => x && x.clauseId && x.clauseId !== 'front');
    const by = re => (cls.find(x => re.test(JSON.stringify(negoClauseNowById(c, x.clauseId) || {}))) || {}).clauseId || null;
    const rent = by(/Rent Amount/), prem = by(/Tenant Name/), note = by(/Notice Address/);
    const now = negoClauseNowById(c, rent); const body = (now && now.bodyHtml) || '';
    try { await negoEditClause(c, rent, body.replace('monthly in advance', 'quarterly in advance'), { side: 'counterparty', author: 'Ventura' }); } catch (e){ return { err: e.message }; }
    await persist(c); return { rent, prem, note }; });
  check('0 · the paper has three clauses and their change on Rent', !!(ids && ids.rent && ids.prem && ids.note), ids);
  await p.evaluate(() => { pdOpenOnHome('MK-120', 'copilot'); });
  const up = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper'), null, 20000);
  check('0b · the negotiated paper is in front', up);
  const started = await p.evaluate(() => { if (typeof pd2NegoMark !== 'function') return { missing: 'pd2NegoMark' }; return { go: pdFillGo('MK-120') }; });
  await until(p, () => !!document.querySelector('#ig-canvas [data-pd2-nb] input[data-pd2-bl]'), null, 8000);
  const marked = await p.evaluate(ids => {
    const inClause = id => [...document.querySelectorAll(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(id))}"] [data-pd2-nb] input[data-pd2-bl]`)].length;
    return { prem: inClause(ids.prem), note: inClause(ids.note), rent: inClause(ids.rent),
      panel: !!document.querySelector('#ig-dock [data-pd2-fp-row^="nb~"]') };
  }, ids || {});
  check('1 · the blanks are marked for typing where they stand, none in the clause with their change', !started.missing && marked.prem === 1 && marked.note === 1 && marked.rent === 0, { started, marked });
  check('4a · the panel lists them', !started.missing && marked.panel, marked);
  /* type into the Premises blank and save */
  await p.evaluate(ids => { const inp = document.querySelector(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(ids.prem))}"] input[data-pd2-bl]`);
    if (!inp) return; inp.focus(); inp.value = 'Highland Corporate Ltd'; inp.dispatchEvent(new Event('input', { bubbles: true })); }, ids || {});
  await p.evaluate(() => { const s = document.querySelector('[data-pd2-fill-save]'); if (s) s.click(); });
  await until(p, id => (getContract('MK-120').changes || []).some(x => x && x.clauseId === id && x.authorSide === 'owner' && x.status === 'pending'), ids && ids.prem, 10000);
  const filed = await p.evaluate(ids => { const c = getContract('MK-120');
    const ch = (c.changes || []).find(x => x && x.clauseId === ids.prem && x.authorSide === 'owner' && x.status === 'pending');
    return { ch: ch ? { newText: String(ch.newText || ''), note: ch.note || '', status: ch.status } : null,
      stored: String(c.redlineText || '').includes('[Tenant Name]'), notesLeft: (c.changes || []).filter(x => x && x.clauseId === ids.note && x.authorSide === 'owner').length,
      unsent: (typeof negoUnsentDecisions === 'function') ? null : null };
  }, ids || {});
  check('2 · Save filed it as our pending change on that clause, through the one door', !!filed.ch && /Highland Corporate Ltd/.test(filed.ch.newText) && !/\[Tenant Name\]/.test(filed.ch.newText) && /paper/i.test(filed.ch.note), filed);
  check('2b · a blank left empty files nothing', filed.notesLeft === 0, filed);
  check('3 · the stored wording is not touched: the placeholder stays until the change is accepted', filed.stored, filed);
  const red = await p.evaluate(ids => { const sec = document.querySelector(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(ids.prem))}"]`);
    return { marked: sec ? sec.querySelectorAll('[data-pd2-nb]').length : -1 }; }, ids || {});
  check('4b · once filed, the clause carries our change and offers no blank there', red.marked === 0 || red.marked === -1, red);
  check('5 · nothing on the page threw', errors.length === 0, errors.slice(0, 3));
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
