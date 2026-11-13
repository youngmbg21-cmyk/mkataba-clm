/* THE NOTES BESIDE THE REDLINED PAPER SAY HOW THEY ENDED (owner picked "The Legora Way", 13 Nov 2026; f1037).
   A services contract with three risks from the scan and one redline of ours (unsent) on the pricing clause; the
   Redlines face, new look.
     1 · Redline: the risks stand beside the paper by their clause, clear of it: the pricing one ANSWERED (a green tick
         painted, "Answered by your redline · not sent yet", our new words quoted), the others OPEN (amber, "no redline
         yet", Draft a redline); no two groups overlap
     2 · the chips: All · Still open · Answered with their counts; Still open shows no answered line, Answered no open
         one, All both again
     3 · our standards too: the one our pricing redline answers is green, one we differ from with no redline amber with
         its door, a missing one at the paper's end; no answered note carries a link (owner: "Remove the link")
     4 · Draft a redline opens the editor on that risk's clause (the risk's own Edit)
     5 · Clean: the paper's ordinary notes, none of these
     6 · Clean: ONE button, Hide notes then Show notes; the paper widens when they are away; no button behind the zoom
   At the parent 1–4 fail: on the red paper only their asks stood beside it.
   Run: node test/chromium/redline-notes-answered-verify.js */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const until = async (p, fn, a, ms = 15000) => { try { await p.waitForFunction(fn, a, { timeout: ms }); return true; } catch (_) { return false; } };
const HTML = '<h1>WAREHOUSING AND TRANSPORTATION SERVICES AGREEMENT</h1><p>This Agreement is made between AIT Worldwide Logistics Norway AS ("AIT") and the Customer.</p>'
  + '<h2>1. Services</h2><p>AIT shall provide warehousing and transportation services as described in the schedules.</p>'
  + '<h2>2. Pricing and Payment</h2><p>The Customer shall pay all rates and charges specified in the applicable rate schedules.</p><p>AIT may revise pricing by providing thirty (30) days\' written notice.</p>'
  + '<h2>3. Liability</h2><p>AIT\'s liability for loss of or damage to goods is limited to two (2) SDR per kilogram.</p>'
  + '<h2>4. Insurance</h2><p>AIT shall maintain insurance appropriate to the Services, without specifying coverage types or minimum amounts.</p>'
  + '<h2>5. Governing Law</h2><p>This Agreement is governed by the laws of Norway.</p>';
const SCAN = { at: 'today', on: new Date().toISOString().slice(0, 10), lang: 'en', dismissed: [], findings: [
  { id: 'f-price', sev: 'high', kind: 'risk', title: 'AIT can raise prices on its own say', quote: 'AIT may revise pricing by providing thirty (30) days\' written notice.',
    what: 'AIT can change prices with only a notice.', why: 'Your costs could rise with no cap.', fix: 'Tie increases to verified costs and cap them.' },
  { id: 'f-liab', sev: 'medium', kind: 'risk', title: 'Liability for goods is very low', quote: 'limited to two (2) SDR per kilogram',
    what: 'AIT pays very little for lost goods.', why: 'A lost pallet could cost far more.', fix: 'Raise the limit.' },
  { id: 'f-ins', sev: 'medium', kind: 'risk', title: 'No coverage types or amounts', quote: 'without specifying coverage types or minimum amounts',
    what: 'The insurance is not defined.', why: 'You cannot check it covers a loss.', fix: 'Name the cover and the amounts.' }] };
(async () => {
  const h = await startHati();
  const c = fixtureContract('MK-382', 'Warehousing and Transportation Services', 'AIT Worldwide Logistics Norway AS', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, scan: SCAN,
    playbook: { verdicts: [
      { category: 'Price changes', status: 'deviation', quote: 'AIT may revise pricing by providing thirty (30) days\' written notice.', position: 'Prices fixed for a year' },
      { category: 'Governing law', status: 'deviation', quote: 'This Agreement is governed by the laws of Norway.', position: 'Swedish law' },
      { category: 'Data protection', status: 'missing', position: 'A data processing clause' }] },
    upload: { name: 'AIT.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [c] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 780 } });
  p.on('pageerror', e => console.log('ERR', String(e).slice(0, 200)));
  await p.goto(h.base + '/', { waitUntil: 'networkidle' });
  await p.fill('#li-email', 'admin@example.co.ke'); await p.fill('#li-pass', 'adminpassword1'); await p.click('#li-go');
  await until(p, () => typeof caGo === 'function' && !!currentUser() && !!getContract('MK-382'), null, 40000);
  const filed = await p.evaluate(async () => { await stPrefSet('newLook', true); newLookApply();
    const c = getContract('MK-382'); if (window.ensureFull) await ensureFull(c);
    const cl = negoClauseList(c).find(x => /Pricing/.test(String(x.heading || x.headingText || '') + ' ' + x.text));
    if (!cl) return 'no clause';
    try { await negoEditClause(c, cl.clauseId, '<p>The Customer shall pay all rates and charges specified in the applicable rate schedules.</p><p>AIT may adjust pricing to reflect a verified increase in external costs, and any such adjustment shall not exceed ten (10) per cent in any twelve (12) month period.</p>', { side: 'owner', author: 'Young' }); await persist(c); } catch (e) { return 'ERR ' + e.message; }
    return (c.changes || []).length; });
  console.log('filed', filed);
  await p.evaluate(() => { setView('dashboard'); pdRedOpen('MK-382'); });
  let fails = 0; const check = (n, ok, m) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? ' — ' + JSON.stringify(m) : ''}`); if (!ok) fails++; };
  const red = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper:not(.is-clean)'), null, 15000);
  const shown = await until(p, () => !!document.querySelector('#pd2-notes .pd2-rn.is-done') && !!document.querySelector('#pd2-notes .pd2-rn.is-owe'), null, 15000);
  const r1 = await p.evaluate(() => {
    const a = document.querySelector('#ig-canvas').getBoundingClientRect();
    const gs = [...document.querySelectorAll('#pd2-notes .pd2-rn')]; const rs = gs.map(g => g.getBoundingClientRect());
    const overlap = rs.some((r, i) => rs.some((q, j) => j > i && r.bottom > q.top + 1 && q.bottom > r.top + 1));
    const done = document.querySelector('#pd2-notes .pd2-mg-i.is-done'), open = document.querySelector('#pd2-notes .pd2-mg-i.is-owe');
    const tick = done && done.querySelector('.pd2-rn-tick'); const tr = tick ? tick.getBoundingClientRect() : null;
    const hitTick = tr ? document.elementFromPoint(tr.left + tr.width / 2, tr.top + tr.height / 2) : null;
    return { groups: gs.length, clear: rs.every(r => r.left > a.right), overlap,
      done: done ? done.textContent.replace(/\s+/g, ' ').trim() : '', open: open ? open.textContent.replace(/\s+/g, ' ').trim() : '',
      tickPainted: !!(hitTick && tick && (hitTick === tick || tick.contains(hitTick))),
      tickBg: tick ? getComputedStyle(tick).backgroundColor : '' };
  });
  check('1 · Redline: answered and open notes beside the paper, clear of it, none overlapping', red && filed === 1 && shown && r1.clear && !r1.overlap
    && /Resolved by your redline/.test(r1.done) && /not yet sent/.test(r1.done) && /verified increase/.test(r1.done) && r1.tickPainted
    && /not yet addressed/.test(r1.open) && /Draft a redline/.test(r1.open), r1);
  /* 2 · the chips */
  const chips = await p.evaluate(() => [...document.querySelectorAll('#pd2-notes [data-pd2-rn-chip]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  const pick = async k => { await p.click(`#pd2-notes [data-pd2-rn-chip="${k}"]`);
    await until(p, kk => { const x = document.querySelector(`#pd2-notes [data-pd2-rn-chip="${kk}"]`); return !!(x && x.getAttribute('aria-pressed') === 'true'); }, k, 5000);
    return p.evaluate(() => ({ done: document.querySelectorAll('#pd2-notes .pd2-mg-i.is-done').length, open: document.querySelectorAll('#pd2-notes .pd2-mg-i.is-owe').length })); };
  const hasChips = chips.length === 3;
  const o = hasChips ? await pick('open') : null, d = hasChips ? await pick('done') : null, all = hasChips ? await pick('all') : null;
  check('2 · chips: Still open hides the answered, Answered hides the open, All shows both', hasChips && (() => { const n = t => Number((String(t).match(/(\d+)$/) || [])[1] || 0); return n(chips[0]) === n(chips[1]) + n(chips[2]) && n(chips[1]) >= 1 && n(chips[2]) >= 1; })()
    && o.done === 0 && o.open >= 1 && d.open === 0 && d.done >= 1 && all.done >= 1 && all.open >= 1, { chips, o, d, all });
  /* 3 · our standards */
  const r3 = await p.evaluate(() => {
    const items = [...document.querySelectorAll('#pd2-notes .pd2-rn .pd2-mg-i')].map(x => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), done: x.classList.contains('is-done') }));
    const f = re => items.find(x => re.test(x.t)) || null;
    return { price: f(/Price changes/), law: f(/Governing law/), data: f(/Data protection/), see: !!document.querySelector('#pd2-notes [data-pd2-go="see"]'),
      drafts: document.querySelectorAll('#pd2-notes [data-pd2-go="std-draft"]').length };
  });
  check('3 · standards beside the paper: answered green, open amber with its door, missing listed; no link on answered notes',
    !!(r3.price && r3.price.done && r3.law && !r3.law.done && /not yet addressed/.test(r3.law.t) && r3.data && !r3.data.done && r3.drafts >= 2 && !r3.see), r3);
  /* 4 · Draft a redline */
  const draft = await p.$('#pd2-notes [data-pd2-go="redline"]');
  if (draft) await draft.click();
  const ed = draft ? await until(p, () => !!document.querySelector('#clause-editor'), null, 10000) : false;
  check('4 · Draft a redline opens the editor on that risk\'s clause', ed);
  /* the editor is put away the way every check puts it away, and the page waits until it is gone (it lies over the paper) */
  if (ed){ await p.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
    await until(p, () => !document.querySelector('#clause-editor'), null, 8000); }
  /* 5 · Clean */
  await p.evaluate(() => { setView('dashboard'); pdRedOpen('MK-382'); });
  await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper'), null, 10000);
  await p.evaluate(() => { const b = document.querySelector('[data-ig-red="0"]') || [...document.querySelectorAll('button')].find(x => /^Clean$/.test(x.textContent.trim())); if (b) b.click(); });
  const clean = await until(p, () => !!document.querySelector('#ig-paper .ig-redpaper.is-clean'), null, 8000);
  const none = clean ? await until(p, () => !document.querySelector('#pd2-notes .pd2-rn'), null, 8000) : false;
  check('5 · Clean: none of these notes', clean && none);
  /* 6 · HIDE NOTES IS ONE BUTTON (owner, 13 Nov 2026), and no button lands behind the zoom */
  const UNDER = () => { const zc = document.querySelector('#ig-paper-scroll .paper-zc, #ig-paper .paper-zc');
    const Z = zc ? [...zc.querySelectorAll('*')].map(e => e.getBoundingClientRect()).filter(r => r.width && r.height) : [];
    return [...document.querySelectorAll('#pd2-notes .pd2-rn-chip, #pd2-notes-tg .pd2-rn-chip')].filter(b => { const r = b.getBoundingClientRect();
      const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return Z.some(z => r.left < z.right && r.right > z.left && r.top < z.bottom && r.bottom > z.top) || !(at === b || b.contains(at)); }).map(b => b.textContent.trim()); };
  const on = clean ? await until(p, () => !!document.querySelector('#pd2-notes [data-pd2-notes-tg="hide"]') && document.querySelectorAll('#pd2-notes .pd2-mg').length > 0, null, 8000) : false;
  /* the paper's width, and whether it was moved aside for the notes (data-pd2-left): on a wide screen it is already at its
     full width and only moves back to its place; on a narrower one it widens too */
  const GEO = () => ({ w: Math.round(document.getElementById('ig-canvas').getBoundingClientRect().width), aside: !!document.querySelector('#ig-paper [data-pd2-left]') });
  const w0 = on ? await p.evaluate(GEO) : null;
  const u0 = on ? await p.evaluate(UNDER) : ['not drawn'];
  if (on) await p.click('#pd2-notes [data-pd2-notes-tg="hide"]');
  const off = on ? await until(p, () => !document.querySelector('#pd2-notes .pd2-mg') && !!document.querySelector('#pd2-notes-tg [data-pd2-notes-tg="show"]'), null, 8000) : false;
  const w1 = off ? await p.evaluate(GEO) : null;
  const u1 = off ? await p.evaluate(UNDER) : ['not drawn'];
  if (off) await p.click('#pd2-notes-tg [data-pd2-notes-tg="show"]');
  const back = off ? await until(p, () => document.querySelectorAll('#pd2-notes .pd2-mg').length > 0 && !document.getElementById('pd2-notes-tg') && !!document.querySelector('#pd2-notes [data-pd2-notes-tg="hide"]'), null, 8000) : false;
  check('6 · Clean: Hide notes puts them away and gives the paper back its full width and place; Show notes brings them back; no button behind the zoom',
    on && off && back && w0 && w1 && w0.aside && !w1.aside && w1.w >= w0.w && !u0.length && !u1.length, { on, off, back, w0, w1, u0, u1 });
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  await b.close(); await h.stop(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
