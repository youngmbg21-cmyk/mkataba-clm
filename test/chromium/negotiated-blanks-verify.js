/* RE-POINTED 26 Nov 2026 (owner, #1035: "Fill in should not be a redline … For counter party contracts or 3rd party
   contracts, they should be filled in using their tools"): this file's lease is an upload, THEIR paper, so the claims
   below are now held as: nothing marked, said as theirs, nothing filed or kept, the wording untouched. Its history:
   A BLANK ON A NEGOTIATED PAPER IS FILLED AS A TRACKED CHANGE (owner, 13 Nov 2026: "yes, build option 2").
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
  /* RE-POINTED 26 Nov 2026 (owner, #1035: "Fill in should not be a redline … For counter party contracts or 3rd party
     contracts, they should be filled in using their tools"; it REVERSES 13 Nov's "a blank on a negotiated paper is filled
     as a tracked change"): this lease is an upload, their paper, so Fill in the contract marks nothing on it — negotiated
     or not — and says so where the reader looks; nothing is filed as a change, nothing is kept as an answer, and the
     stored wording keeps its placeholders. A change there is a redline (the Rent change stands as theirs). */
  const before = await p.evaluate(() => (getContract('MK-120').changes || []).length);
  const started = await p.evaluate(() => { if (typeof pd2FillHeldWhy !== 'function') return { missing: 'pd2FillHeldWhy' }; return { why: pd2FillHeldWhy(getContract('MK-120')), go: pdFillGo('MK-120') }; });
  /* the card's door with a detail of our record owed (no place on their paper) opens the details form, none of its rows
     the paper's spaces; with nothing owed it says the paper is theirs (pdFillGo, 26 Nov 2026) */
  const owed1 = await p.evaluate(() => typeof pd2TheirsDetailsOwed === 'function' && pd2TheirsDetailsOwed(getContract('MK-120')));
  const said = owed1
    ? await until(p, () => pdFormShows() && ![...document.querySelectorAll('#pd-og [data-pd-og-row]')].some(e => /^up_/.test(e.getAttribute('data-pd-og-row') || '')), null, 8000)
    : await until(p, () => ((document.getElementById('toast-root') || {}).textContent || '').includes(i18t('pd2_fill_theirs')), null, 8000);
  const marked = await p.evaluate(ids => {
    const inClause = id => [...document.querySelectorAll(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(id))}"] [data-pd2-nb], #ig-canvas section.rl-clause[data-clause="${CSS.escape(String(id))}"] input[data-pd2-bl]`)].length;
    return { prem: inClause(ids.prem), note: inClause(ids.note), rent: inClause(ids.rent), any: document.querySelectorAll('#ig-canvas [data-pd2-bl]').length,
      head: !!document.getElementById('pd2-fill-head'), on: pd2FillOn('MK-120'), panel: !!document.querySelector('#ig-dock [data-pd2-fp-row^="nb~"]') };
  }, ids || {});
  if (owed1){ await p.evaluate(() => { ['pdMidClose', 'pdFormClose'].forEach(f => { if (typeof window[f] === 'function') try { window[f](); } catch (_){} }); });
    await until(p, () => !pdFormShows() && !!document.querySelector('#ig-paper .ig-redpaper'), null, 8000); }
  check('1 · their paper, negotiated: Fill in marks no space in any clause, and says the paper is theirs to fill', !started.missing && started.why === 'theirs' && said
    && marked.prem === 0 && marked.note === 0 && marked.rent === 0 && marked.any === 0 && !marked.head && !marked.on, { started, said, marked });
  check('4a · the panel lists none of their spaces', !marked.panel, marked);
  /* a press on a placeholder on the paper is the same one way in: it too opens nothing */
  const pressed = await p.evaluate(ids => { const sec = document.querySelector(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(ids.prem))}"]`); if (!sec) return { missing: 'premises clause' };
    sec.scrollIntoView({ block: 'center' });
    const r = document.createRange(); const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT); let n, at = null;
    while ((n = w.nextNode())){ const i = n.data.indexOf('[Tenant Name]'); if (i >= 0){ r.setStart(n, i + 2); r.setEnd(n, i + 3); at = r.getBoundingClientRect(); break; } }
    if (!at) return { missing: 'placeholder' };
    const x = at.left + at.width / 2, y = at.top + at.height / 2, el = document.elementFromPoint(x, y);
    if (!(el && el.closest('#ig-canvas'))) return { missing: 'the placeholder is not what is under the press', el: el ? el.tagName + '.' + el.className : null };
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y }));
    return { ok: true }; }, ids || {});
  await until(p, () => ((document.getElementById('toast-root') || {}).textContent || '').includes(i18t('pd2_fill_theirs')), null, 4000);
  const afterPress = await p.evaluate(() => ({ any: document.querySelectorAll('#ig-canvas [data-pd2-bl]').length, on: pd2FillOn('MK-120') }));
  check('2 · a press on a placeholder of their paper starts nothing either', !!pressed.ok && afterPress.any === 0 && !afterPress.on, { pressed, afterPress });
  await p.evaluate(() => window.flushSaves && flushSaves()).catch(() => {});
  const filed = await p.evaluate(ids => { const c = getContract('MK-120');
    return { ours: (c.changes || []).filter(x => x && x.authorSide === 'owner').length, all: (c.changes || []).length,
      theirs: (c.changes || []).some(x => x && x.clauseId === ids.rent && x.authorSide === 'counterparty' && x.status === 'pending'),
      fills: c.fills && Object.keys(c.fills).length ? c.fills : null, stored: String(c.redlineText || '').includes('[Tenant Name]') && String(c.redlineText || '').includes('[Notice Address]') };
  }, ids || {});
  check('2b · nothing is filed as a change of ours, nothing kept as an answer; their change on Rent stands', filed.ours === 0 && filed.all === before && filed.theirs && !filed.fills, filed);
  check('3 · the stored wording is not touched: its placeholders stay', filed.stored, filed);
  const red = await p.evaluate(ids => { const sec = document.querySelector(`#ig-canvas section.rl-clause[data-clause="${CSS.escape(String(ids.prem))}"]`);
    return { marked: sec ? sec.querySelectorAll('[data-pd2-nb]').length : -1 }; }, ids || {});
  check('4b · the clause offers no space to fill in', red.marked === 0, red);
  check('5 · nothing on the page threw', errors.length === 0, errors.slice(0, 3));
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
