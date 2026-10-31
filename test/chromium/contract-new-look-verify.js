/* THE NEW LOOK: A CONTRACT, PART 1 (the contract round, 31 Oct 2026; the review room's "A contract"; behind the switch).
   An uploaded supply agreement with two blanks, a value over the approval rule's line, an end date that renews by itself
   and one risk read off its § 3. With the switch on, at the owner's three screens:
     1 · the Dossier as drawn: ONE line of the six stages in words (owed stages say how much), ONE sentence with its one
         link, what Jambo read, the facts each with where it was read (Value § 2, Ends § 4, Signer route, Stream filed,
         Approval § 2, Standards with its cost), then Jambo's one remark (the risk he read)
     2 · ONE row of links above Jambo's box (the paper's own: fill in · redline · share · history), not two
     3 · the notes beside the paper, only what HaTi read: the two blanks (amber, Fill in), the value (the approval rests
         on it, Approve), the end date (grey), the risk (Start redlining); each by the line it was read from (or pushed
         under the one above), none overlapping, all to the right of the paper, in the paper's order
     4 · the paper stands at the left, 40 from the page's edge, and nothing goes sideways
     5 · a note's Fill in is the one Fill in door: the form opens on that blank
   And the switch off:
     6 · the old Dossier and no notes, the paper where it was
   At the parent (before this change) 1–5 fail: none of it is drawn.
   Run: node test/chromium/contract-new-look-verify.js   (pictures: CONTRACT_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = process.env.CONTRACT_SHOTS || path.join(__dirname, 'shots', 'contract-new-look');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

const PARAS = [
  'This Raw Material Supply Agreement is made on [DATE] between Highland Corporate Ltd (the "Buyer") and Nandi Dairy (the "Supplier") for the supply of [GOODS] into the Buyer\'s production facilities in Kenya.',
  ['1. Supply & Specification', 'The Supplier shall supply an estimated 5000 metric tonnes per annum meeting the agreed specification and the applicable KEBS standard, delivered DDP to the Buyer\'s plant.'],
  ['2. Price & Contract Value', 'The estimated annual contract value is KES 36,000,000, based on agreed per-tonne pricing reviewed quarterly against published commodity indices. Prices are exclusive of VAT and invoices fall due within 30 days of receipt.'],
  ['3. Quality & Rejection', 'Consignments failing specification or Public Health / KEBS requirements may be rejected within 3 days of delivery, with replacement at the Supplier\'s cost.'],
  ['4. Term and Renewal', 'This agreement runs until 30 June 2027 and renews for one year unless either party gives ninety days\' notice.']
];
const HTML = '<h1>Raw Milk Collection</h1><p>Between Highland Corporate Ltd and Nandi Dairy</p>' + PARAS.map(p => Array.isArray(p) ? `<h2>${p[0].replace('&', '&amp;')}</h2><p>${p[1]}</p>` : `<p>${p}</p>`).join('');

/* what the page draws, read off the page */
const READ = () => {
  const dock = document.getElementById('ig-dock'), d = dock && dock.querySelector('.pd2-dossier');
  const facts = d ? [...d.querySelectorAll('.pd2-fact')].map(f => ({ k: f.getAttribute('data-pd2-fact'), s: f.querySelector('.pd2-s').textContent.trim(), v: f.querySelector('.pd2-v').textContent.trim() })) : [];
  const zoom = document.querySelector('#ig-paper .ig-zoom'), sheet = zoom && zoom.querySelector(':scope > .pg-sheet'), sc = document.getElementById('ig-paper-scroll');
  const host = document.getElementById('pd2-notes');
  const notes = host ? [...host.querySelectorAll('.pd2-mn')].map(n => { const r = n.getBoundingClientRect(); return { tone: n.className.replace('pd2-mn', '').trim(), k: n.querySelector('.pd2-mn-k').textContent, top: r.top, bottom: r.bottom, left: r.left, right: r.right }; }) : [];
  const anchorTop = re => { const w = document.createTreeWalker(document.getElementById('ig-canvas'), NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()){ const i = n.nodeValue.search(re); if (i >= 0){ const rg = document.createRange(); rg.setStart(n, i); rg.setEnd(n, i + 1); return rg.getBoundingClientRect().top; } } return null; };
  return {
    spine: d && d.querySelector('.pd2-spine') ? d.querySelector('.pd2-spine').textContent.replace(/\s+/g, ' ').trim() : '',
    next: d && d.querySelector('.pd2-next') ? d.querySelector('.pd2-next').textContent.trim() : '',
    nextLinks: d ? d.querySelectorAll('.pd2-next .ui-link').length : 0,
    read: d && d.querySelector('.pd2-read') ? d.querySelector('.pd2-read').textContent.trim() : '',
    facts, turn: d && d.querySelector('.pd2-turn') ? d.querySelector('.pd2-turn').textContent.trim() : '',
    rows: [...document.querySelectorAll('#ig-dock [data-ig-chips], #ig-dock .jb-ways')].filter(e => e.getBoundingClientRect().height > 0 && e.children.length).map(e => [...e.children].map(b => b.textContent.trim()).join(' · ')),
    old: !!(dock && dock.querySelector('.pd-dossier')),
    notes, sheetLeft: sheet && sc ? Math.round(sheet.getBoundingClientRect().left - sc.getBoundingClientRect().left) : null,
    sheetRight: sheet ? sheet.getBoundingClientRect().right : null, scRight: sc ? sc.getBoundingClientRect().right : null,
    anchors: { date: anchorTop(/\[DATE\]/), value: anchorTop(/36,000,000/), risk: anchorTop(/rejected within 3 days/), ends: anchorTop(/30 June 2027/) },
    sideways: document.documentElement.scrollWidth - innerWidth
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const b = fixtureContract('MK-A2', 'Raw Milk Collection', 'Nandi Dairy', 'proc', 36000000, 'Under Review', 'x');
  Object.assign(b, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {}, expiry: '2027-06-30',
    upload: { name: 'Raw_Milk_Collection.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString(), uploadedBy: 'Amina Otieno' },
    scan: { at: 'today', on: new Date().toISOString().slice(0, 10), lang: 'en', dismissed: [], findings: [
      { id: 'rm-reject', sev: 'high', kind: 'risk', title: 'Rejection window: 3 days', anchor: 'c3', quote: 'rejected within 3 days of delivery',
        what: 'Consignments may be rejected only within 3 days.', why: 'Your standard says 7.', fix: 'Extend to 7 days.' }] } });
  b.metadata = Object.assign({}, b.metadata, { expiryDate: '2027-06-30', autoRenew: true });
  await seedWorkspace(h, { contracts: [b] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => typeof roomHomeLand === 'function' && typeof currentUser === 'function' && !!currentUser(), null, 40000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-A2'); });
      const drawn = await until(page, () => document.querySelectorAll('#pd2-notes .pd2-mn').length >= 5 && !!document.querySelector('#ig-dock .pd2-turn'), null, 20000);
      check(`${nm} 0 the contract's new look is drawn`, drawn);
      await page.evaluate(() => document.fonts && document.fonts.ready);
      const R = await page.evaluate(READ);
      const F = Object.fromEntries(R.facts.map(f => [f.k, f]));
      check(`${nm} 1 the Dossier: one line of stages, one sentence, what Jambo read, the facts with their sources, his one remark`,
        /Arrived .*·\s*Read\s*·\s*Fill, \d+ to do\s*·\s*Negotiate\s*·\s*Sign, \d+ to do\s*·\s*Live/.test(R.spine) && /before anyone signs/.test(R.next) && R.nextLinks === 1
        && /Jambo/.test(R.read) && F.value && F.value.s === '§ 2' && F.ends && F.ends.s === '§ 4' && /renews by itself/.test(F.ends.v)
        && F.signer && F.signer.s === 'route' && F.stream && F.stream.s === 'filed' && F.approval && F.approval.s === '§ 2' && F.std && /1 call/.test(F.std.v)
        && /Rejection window/.test(R.turn) && !R.old, { spine: R.spine, next: R.next, facts: R.facts, turn: R.turn.slice(0, 80) });
      check(`${nm} 2 one row of links above Jambo's box`, R.rows.length === 1 && R.rows[0] === 'fill in · redline · share · history', R.rows);
      const tones = R.notes.map(n => n.tone).join(',');
      const ordered = R.notes.every((n, i) => !i || n.top >= R.notes[i - 1].bottom);
      const byLine = (re, a) => { const n = R.notes.find(x => re.test(x.k)); return !!n && a != null && Math.abs(n.top - a) <= 14; };
      check(`${nm} 3 the notes: the blanks, the value, the risk, the end date — each by its line, none overlapping, right of the paper`,
        tones === 'is-owe,is-owe,is-ask,is-risk,is-fact' && ordered && R.notes.every(n => n.left >= R.sheetRight + 8 && n.right <= R.scRight)
        && byLine(/^Date/, R.anchors.date) && byLine(/^Value/, R.anchors.value) && byLine(/^Rejection/, R.anchors.risk), { tones, notes: R.notes.map(n => [n.k, Math.round(n.top)]), anchors: R.anchors, sheetRight: R.sheetRight });
      check(`${nm} 4 the paper 40 from the page's edge, nothing sideways`, R.sheetLeft != null && Math.abs(R.sheetLeft - 40) <= 2 && R.sideways <= 0, { sheetLeft: R.sheetLeft, sideways: R.sideways });
      await page.screenshot({ path: path.join(OUT, `contract-${nm}.png`) });
      if (nm === 'laptop-a'){
        /* 4b the paper scrolls in its own scroller (it once grew to its whole length and stood still) */
        const S = await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); return { client: sc.clientHeight, whole: sc.scrollHeight }; });
        check('4b the paper scrolls', S.whole > S.client + 100, S);
        /* 5 FILL IN ON THE PAPER (part 3): a note's Fill in turns the paper's blanks into boxes where they stand; what is
           typed is in the panel's list; nothing is saved until Save; Save stores it (the server holds it) */
        await page.click('#pd2-notes [data-pd2-go="fill"][data-pd2-key="up_date"]');
        const boxes = await until(page, () => document.querySelectorAll('#ig-canvas [data-pd2-bl]').length === 2 && !!document.getElementById('pd2-fill-head') && !!document.querySelector('#ig-dock .pd2-dossier.is-fill'), null, 15000);
        await page.keyboard.type('31 October 2026');
        const F = await page.evaluate(() => ({ list: (document.querySelector('#ig-dock [data-pd2-fp-row="up_date"] [data-pd2-fp-state]') || {}).textContent || '',
          stored: (getContract('MK-A2').fields || {}).up_date || '', count: (document.querySelector('[data-pd2-ff-n]') || {}).textContent || '',
          scrolls: document.getElementById('ig-paper-scroll').scrollHeight > document.getElementById('ig-paper-scroll').clientHeight + 100 }));
        check('5 a note\'s Fill in fills on the paper: the boxes, the head, the list beside it, nothing saved yet, the paper still scrolls',
          boxes && /31 October 2026/.test(F.list) && !F.stored && /^1 of 2 filled/.test(F.count) && F.scrolls, F);
        await page.click('[data-pd2-fill-save]');
        const saved = await until(page, async () => !document.getElementById('pd2-fill-head') && (getContract('MK-A2').fields || {}).up_date === '31 October 2026', null, 10000);
        /* the save is on its way (persist): asked of the server until it holds it, bounded */
        const srv = await page.evaluate(async () => { for (let i = 0; i < 40; i++){ const r = await fetch('/api/contracts/MK-A2', { credentials: 'include' }); const j = await r.json(); const v = ((j.contract || j).fields || {}).up_date || ''; if (v) return v; await new Promise(z => setTimeout(z, 250)); } return ''; });
        check('5b Save stores it through the one writer, and the server holds it', saved && srv === '31 October 2026', { srv });
        /* put back as it was, so the screens after this one read the same paper */
        await page.evaluate(async () => { const c = getContract('MK-A2'); contractBlankSet(c, 'up_date', '', { quiet: true, hold: true }); await persist(c); igPaperRefresh(); });
        /* 7 THE BRIEF IN THE MIDDLE (part 2): its link on the Dossier; every line with its clause and the paper's words;
           "I have read it" recorded for this wording; the Dossier says who read it; ‹ Paper brings the paper back */
        await page.evaluate(() => { pdMidClose(); if (typeof pdFormShows === 'function' && pdFormShows()) pdFormClose(); const c = getContract('MK-A2');
          c._brief = { v: 1, at: new Date(Date.now() - 3600e3).toISOString(), by: 'Jambo', truncated: false, data: {
            overview: 'A supply agreement for raw milk from Nandi Dairy, worth about KES 36M a year.',
            money: { value: 'KES 36,000,000 a year, estimated.', paymentTerms: 'Invoices fall due within 30 days of receipt.' },
            term: { end: 'Runs to 30 June 2027 and renews for a year.' },
            watchouts: [{ point: 'The rejection window is 3 days.', why: 'Your standard says 7.', quote: 'may be rejected within 3 days of delivery' }], unusual: [] } };
          c.briefRead = { u9: { at: new Date(Date.now() - 1800e3).toISOString(), by: 'Wanjiru K.', key: briefReadKey(c) } };
          pdGlanceRepaint(); });
        await until(page, () => !!document.querySelector('#ig-dock .pd2-dossier [data-pd-gl-brief]'), null, 10000);
        await page.click('#ig-dock .pd2-dossier [data-pd-gl-brief]');
        const up = await until(page, () => !!document.querySelector('[data-pd-mid^="brief:"] .pd2-br-sheet') && !!document.querySelector('#ig-dock .pd2-dossier.is-brief'), null, 10000);
        const B = await page.evaluate(() => ({ secs: [...document.querySelectorAll('.pd2-br-ln .pd2-br-src b')].map(b => b.textContent),
          quotes: document.querySelectorAll('.pd2-br-ln .pd2-br-src q').length, meta: (document.querySelector('[data-pd2-br-meta]') || {}).textContent || '',
          face: (document.querySelector('#ig-dock .pd2-next') || {}).textContent || '', bg: getComputedStyle(document.querySelector('.pd2-brief')).backgroundColor,
          head: Math.round(document.querySelector('[data-pd-mid^="brief:"] .dlg-pg-head').getBoundingClientRect().height) }));
        check('7 the brief in the middle: each line\'s clause and words, who read it, the Dossier turned to it, head 56, on the grey desk',
          up && B.secs.join() === '§ 2,§ 2,§ 4,§ 3' && B.quotes === 4 && /read by Wanjiru K\. · not yet by you/.test(B.meta) && /Wanjiru K\. has read it/.test(B.face)
          && B.head === 56 && B.bg !== 'rgb(255, 255, 255)', B);
        await page.evaluate(() => { const b = document.querySelector('[data-pd2-brief] [data-brief-read]'); if (b) b.click(); });
        const read = await until(page, () => briefReadBy(getContract('MK-A2')) && /read by you/.test(document.querySelector('[data-pd2-br-meta]').textContent) && /You read the brief/.test(document.querySelector('#ig-dock .pd2-next').textContent), null, 10000);
        check('8 "I have read it" is recorded for this wording, and the page and the Dossier say so', read);
        await page.click('[data-pd-mid^="brief:"] .pd2-br-head [data-pd-mid-back]');
        const back = await until(page, () => !document.querySelector('[data-pd-mid]') && !!document.querySelector('#ig-dock .pd2-dossier:not(.is-brief)'), null, 10000);
        check('9 ‹ Paper brings the paper and the Dossier back', back);
        /* 10 THE FORM IN THE MIDDLE (part 3b): the Dossier's Fill in lays the form flat where the paper was; what is typed is
           said in the Dossier as it is typed; the one Save stores it and brings the paper back */
        await page.evaluate(() => pdFillOpen('MK-A2'));
        const fm = await until(page, () => !!document.querySelector('[data-pd-mid^="form:"] #pd-og.is-form tr[data-pd-og-row="up_goods"] input') && !!document.querySelector('#ig-dock .pd2-dossier.is-form'), null, 15000);
        await page.fill('[data-pd-mid^="form:"] tr[data-pd-og-row="up_goods"] input', 'raw milk');
        const said = await until(page, () => /raw milk/.test((document.querySelector('#ig-dock [data-pd2-ft="up_goods"]') || {}).textContent || ''), null, 5000);
        await page.click('[data-pd-mid^="form:"] [data-pd-fm-save]');
        const kept = await until(page, () => !document.querySelector('[data-pd-mid]') && (getContract('MK-A2').fields || {}).up_goods === 'raw milk' && !!document.querySelector('#ig-dock .pd2-dossier:not(.is-form)'), null, 10000);
        check('10 the form in the middle: typed, said beside it, stored by the one Save, the paper back', fm && said && kept, { fm, said, kept });
        /* 11 THE READ, WATCHED (part 4): the Dossier's "Watch the read" puts the walk over the paper; played fast it walks
           every clause, each fact lands in its group with its clause, it ends in one sentence and the next doors; it files
           nothing; × puts it away and the paper and its Dossier come back */
        const before = await page.evaluate(() => { const c = getContract('MK-A2'); return JSON.stringify([c.fields, (c.audit || []).length, c.obligations]); });
        await page.click('#ig-dock .pd2-dossier [data-pd2-wk-open]');
        const ready = await until(page, () => !!document.getElementById('pd2-walk-head') && /^0 of \d+$/.test(((document.querySelector('#pd2-walk-foot b') || {}).textContent || '').trim()), null, 10000);
        await page.click('[data-pd2-wk-speed="fast"]'); await page.click('[data-pd2-wk-play]');
        const ended = await until(page, () => /Read whole/.test((document.querySelector('#pd2-walk-foot') || {}).textContent || '') && !!document.querySelector('#ig-dock .pd2-wk-nx'), null, 30000);
        const Wk = await page.evaluate(() => ({ groups: [...document.querySelectorAll('#ig-dock .pd2-dossier.is-walk [data-pd2-wk-fact]')].map(f => f.getAttribute('data-pd2-wk-fact') + ':' + f.querySelector('.pd2-s').textContent),
          say: (document.querySelector('#ig-dock .pd2-wk-say') || {}).textContent || '', next: [...document.querySelectorAll('#ig-dock .pd2-wk-nx .ui-link')].map(b => b.textContent),
          same: JSON.stringify((c => [c.fields, (c.audit || []).length, c.obligations])(getContract('MK-A2'))) }));
        check('11 the read, watched: every clause, the facts in their groups with their clauses, one sentence, the next doors, nothing filed',
          ready && ended && Wk.groups.includes('party:preamble') && Wk.groups.includes('money:§ 2') && Wk.groups.includes('date:§ 4') && Wk.groups.includes('risk:§ 3')
          && /^Read whole\./.test(Wk.say) && Wk.next.some(w => /redline on § 3/.test(w)) && Wk.same === before, Wk);
        await page.click('[data-pd2-wk-close]');
        const gone = await until(page, () => !document.getElementById('pd2-walk-head') && !document.querySelector('#ig-canvas .pd2-wk-on, #ig-canvas .pd2-wk-done') && !!document.querySelector('#ig-dock .pd2-dossier:not(.is-walk)'), null, 10000);
        check('12 × puts the walk away: the paper as it was and its Dossier back', gone);
        /* 13 CLAUSES (part 5): the notes step aside, the same one row of links stands, and the clause open in the list is
           tinted on the paper (its read stubbed: no key in a test) */
        await page.evaluate(() => { state.aiConfigured = true; const o = window.api; window.__apiWas = o;
          window.api = async function (p, ...a){ if (p !== 'ai/breakdown') return o.call(this, p, ...a);
            return { head: 'The rejection window first', sub: '', links: [], regions: [{ name: 'Quality', status: 'need', kind: 'protect', headline: '', items: [{ ref: '3', title: 'Rejection' }], quotes: [] }],
              points: [{ clause: '3', region: 1, status: 'need', missing: false, title: 'Three days to reject a load', stake: 'Your standard says seven.', quote: 'may be rejected within 3 days of delivery', links: [] }] }; };
          pdOpenOnHome('MK-A2', 'doc'); });
        await until(page, () => [...document.querySelectorAll('#pd-thread .doc-th-row')].some(r => /Quality/.test(r.textContent)), null, 15000);
        await page.evaluate(() => { const q = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /Quality/.test(r.textContent)); (q.querySelector('button') || q).click(); });
        const tinted = await until(page, () => [...document.querySelectorAll('#ig-canvas .pd2-cl-on')].some(e => /rejected within 3 days/.test(e.textContent)), null, 10000);
        const Cl = await page.evaluate(() => ({ notes: !!document.getElementById('pd2-notes'), rows: [...document.querySelectorAll('#ig-dock [data-ig-chips], #ig-dock .jb-ways')].filter(e => e.getBoundingClientRect().height > 0 && e.children.length).map(e => [...e.children].map(b => b.textContent.trim()).join(' · ')) }));
        check('13 Clauses: no notes beside the paper, the one row of links, the open clause tinted', tinted && !Cl.notes && Cl.rows.length === 1 && Cl.rows[0] === 'fill in · redline · share · history', Cl);
        await page.evaluate(() => { window.api = window.__apiWas; pdSetTab('copilot'); renderIntelDock(); });
        /* put back as it was (the form's Save filled "Goods"), held until the server has it, so the next screens read the same paper */
        await page.evaluate(async () => { const c = getContract('MK-A2'); contractBlankSet(c, 'up_goods', '', { quiet: true, hold: true }); await persist(c);
          for (let i = 0; i < 40; i++){ const r = await fetch('/api/contracts/MK-A2', { credentials: 'include' }); const j = await r.json(); if (!(((j.contract || j).fields || {}).up_goods)) return; await new Promise(z => setTimeout(z, 250)); } });
        await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); roomHomeLand('MK-A2'); });
        /* the crossfade's ghost of the face before (no ids) is gone a moment later */
        await until(page, () => !!document.querySelector('#ig-dock .pd-dossier') && !document.querySelector('.pd2-dossier'), null, 20000);
        const O = await page.evaluate(() => ({ notes: !!document.getElementById('pd2-notes'), pd2: !!document.querySelector('.pd2-dossier'), moved: !!document.querySelector('[data-pd2-left]') }));
        check('6 off: the old Dossier, no notes, the paper where it was', !O.notes && !O.pd2 && !O.moved, O);
      }
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
