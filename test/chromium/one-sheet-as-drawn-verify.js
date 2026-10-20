/* DRAFT FROM A SENTENCE, "ONE SHEET", EVERY DRAWN PART (round 4 of the
   redesign, option 2 "One sheet"; the owner's yes of 18 Oct 2026 to build
   every gap between the picked drawing and HaTi; js/wizard.js
   openNewAgreement, js/copilotacts.js caDraftRank / caDraftWhatOf,
   js/core.js dlgPageAdopt)

   WHAT THIS PINS, driven in a real browser from Home's box (once "the Counter"; code keeps counter)
     1 the head: "New agreement · not created yet", the reason beside Create
       draft, Cancel — and no "Skip the questions" (the way back is the SAP
       bar's: see 1b and 7 below; the desk tabs row is gone on main)
     2 the sheet stands on the desk beside Jambo's panel, which says in one
       line what he read ("… an NDA, with Volvo Cars. The closest of our paper
       is our NDA; you pick. …") — no line before it, no doors back to a sheet
       that is up, no wall furniture
     3 From your words: What · With (amber, not in Parties yet) · What it is
       for (Not read yet) · Let Jambo fill the form
     4 1 Start from: the three closest as cards with a radio and their shelf's
       facts, the closest marked, nothing picked; the search and Legal on the
       step's line
     5 picked: its questions say "N questions · only Counterparty is needed
       now", the counterparty "✦ from your words"; who else says nobody is
       emailed until you send; the cost of reading stands on the stream's row
     6 a stream chosen: the reason goes, Create makes the draft
     7 the bar's ‹ goes back to the page asked from (Home, or the page named)
     8 the owner's three screens: the head and Create in view, nothing
       sideways
   THE SECOND PASS (the checker's list, 18 Oct 2026; node half f753):
     3  re-pointed — What is the kind the words ask for ("A non-disclosure
        agreement"), What it is for read from the words ("A pilot")
     9  the panel beside the sheet: "Jambo · New agreement", no bin, the box
        asking "Ask for a number, a list or a contract…", the party and the
        paper in bold
     10 the costs in our own money, measured: "about KES 0.10", "… obligations,
        about KES 0.90." (a seeded ledger and a dated USD rate)
     11 step 2 in three columns, two rows, "Who else" straight under them
     12 step 3 one row: the streams, "Needed before Create", the cost; no
        "+ New stream"
     13 the owner's three screens: the page scrolls at most 32px at 1440×780,
        82px at 1536×730, none at 1366×950 (the drawing's own measure)
     14 a second sentence in the sitting: one exchange in the panel
   THE THIRD PASS (the checker's second list, 18 Oct 2026; main's SAP bar
   brought in; node half f753 (4), (8), (9)):
     1b re-pointed — the way back is the app's: no crumb in the sheet's head,
        the bar names it "New agreement", its ‹ live, nothing arrives ringed
     7  re-pointed — the bar's ‹ asks first where something was typed (Keep
        editing keeps the sheet), then lands on the page asked from
     10 re-pointed — the owner's answer (4): the costs in Jambo calls, never
        money, even with a ledger and a dated USD rate on file
     15 step 3's streams are separate buttons, each its own edge, amber-washed
        and amber-edged while owed
   THE FOURTH PASS (main brought in again, 19 Oct 2026; node half f753 (10)):
     16 "Change the ask" lands on Jambo's box through the one lander (LAND ON IT)
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/one-sheet-as-drawn-verify.js */
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
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const SAY = 'NDA with Volvo Cars for a pilot';

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W0 = await H.seedWorkspace(h, { contracts: [H.fixtureContract('MK-A1', 'Refined Sugar Supply', 'Kabras Sugar', H.FOLDER_A, 48000000, 'Under Review')], approvalRules: [] });
  /* 10 — a ledger and a rate, as a workspace that has used Jambo has them: the
     draft read averaged USD 0.00081 a request, the three arrival readings
     USD 0.006925 together, and the admins' dated rate USD → KES 129.5 */
  await W0.admin.json('/api/settings/fx-rates', { method: 'PUT', body: { code: 'USD', rate: 129.5 } });
  { const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const day = new Date().toISOString().slice(0, 10); const ins = db.prepare('INSERT OR REPLACE INTO ai_spend (day,feature,requests,calls,cost) VALUES (?,?,?,?,?)');
    ins.run(day, 'draft', 10, 10, 0.0081); ins.run(day, 'brief', 4, 4, 0.012); ins.run(day, 'playbook', 4, 4, 0.0095); ins.run(day, 'obligations', 4, 4, 0.0062); db.close(); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.length > 0, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const ask = async () => {
      await page.evaluate(() => { if (window.deskGoCounter) deskGoCounter(); });
      await until(() => !!document.getElementById('cn-q'), null, 8000);
      await page.fill('#cn-q', SAY); await page.keyboard.press('Enter');
      return until(() => !!document.getElementById('na-root') && !!document.querySelector('#ig-dock .ca-dr-said'), null, 12000); };
    const SHEET = () => { const panel = document.querySelector('[data-dlg-page]'), head = panel && panel.querySelector('.dlg-pg-head');
      const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const dock = document.getElementById('ig-dock'), frame = panel && panel.parentElement;
      const fr = frame && frame.getBoundingClientRect(), dr = dock && dock.getBoundingClientRect();
      const cards = [...document.querySelectorAll('#na-closest .na-pick')];
      return { title: t(head && head.querySelector('.dlg-pg-title')), crumb: t(head && head.querySelector('.dlg-pg-crumb')),
        acts: [...(head ? head.querySelectorAll('.dlg-pg-acts > *') : [])].filter(vis).map(x => t(x)),
        skip: !!document.getElementById('na-skip'), create: (document.getElementById('na-create') || {}).disabled,
        beside: !!(fr && dr && vis(dock) && Math.abs(fr.right - dr.left) <= 2), dockVis: vis(dock),
        said: t(document.querySelector('#ig-dock .ca-dr-said .ca-say')), saidActs: vis(document.querySelector('#ig-dock .ca-dr-said .ca-acts')),
        lines: [...document.querySelectorAll('#ig-dock .ai-msg .ai-bub')].filter(vis).map(t),
        wall: ['.pd-hello', '#pd-drop', '[data-ig-chips]'].some(s => vis(document.querySelector('#ig-dock ' + s))),
        words: [...document.querySelectorAll('#na-words .na-w-c')].map(c => ({ t: t(c), owed: c.classList.contains('is-owed') })), fill: t(document.getElementById('dr-read')),
        step1: t(document.querySelector('#wz-pick .na-step')), cards: cards.map(c => ({ t: t(c), radio: !!c.querySelector('.na-radio'), checked: c.getAttribute('aria-checked') })),
        sub: t(document.getElementById('na-card-sub')), cardName: t(document.getElementById('na-card-name')),
        cp: t([...document.querySelectorAll('#na-form label > span:first-child')].find(sp => /Counterparty/.test(sp.textContent))),
        people: t(document.querySelector('#na-people > summary')), file: (() => { const row = document.querySelector('#na-file .na-file-b'), cost = row && row.querySelector('.na-file-cost');
          return row && cost ? { cost: t(cost), inRow: cost.getBoundingClientRect().top < row.getBoundingClientRect().bottom && cost.getBoundingClientRect().top >= row.getBoundingClientRect().top - 1 } : null; })() }; };

    /* 1 + 2 the head, the sheet beside Jambo */
    check('0 Home\'s box brings the sheet and Jambo\'s line', !!(await ask()));
    await page.waitForTimeout(400);
    const S1 = await page.evaluate(SHEET);
    check('1a "New agreement · not created yet"', S1.title === 'New agreement not created yet', S1.title);
    /* RE-POINTED (the third pass, 18 Oct 2026; main's SAP bar "‹ · HA · the page's name"): the way
       back is the app's — no crumb in the sheet's head, the bar names the sheet, its ‹ is live, and
       nothing arrives wearing a dark ring */
    const B1 = await page.evaluate(() => ({ page: ((document.getElementById('dk-page') || {}).innerText || '').trim(), back: !!document.getElementById('dk-back') && !document.getElementById('dk-back').disabled,
      focus: (document.activeElement || {}).id || (document.activeElement || {}).className, crumbEl: !!document.querySelector('[data-na-counter], .na-crumb'),
      ring: (() => { const a = document.activeElement; if (!a || a === document.body) return 'none'; const c = getComputedStyle(a); return (c.outlineStyle === 'none' || parseFloat(c.outlineWidth) === 0) && !/0px 0px 0px [1-9]/.test(c.boxShadow) ? 'none' : c.outlineStyle + ' ' + c.outlineWidth + ' ' + c.boxShadow; })() }));
    check('1b the way back is the bar\'s: no crumb in the sheet\'s head, the bar says "New agreement", its ‹ live, no ring on arrival',
      S1.crumb === '' && !B1.crumbEl && B1.page === 'New agreement' && B1.back && B1.ring === 'none', JSON.stringify({ crumb: S1.crumb, B1 }));
    check('1c the reason beside Create draft, then Cancel — no "Skip the questions"', S1.acts.join('|') === 'Pick a template first|Create draft|Cancel' && !S1.skip && S1.create, JSON.stringify(S1.acts));
    check('2a the sheet stands on the desk beside Jambo\'s panel', S1.beside, JSON.stringify({ beside: S1.beside, dock: S1.dockVis }));
    check('2b Jambo says in one line what he read, as drawn', S1.said === 'I’ve opened a new agreement on the desk with what I read: an NDA, with Volvo Cars. The closest of our paper is our NDA; you pick. Nothing is created until you press Create.', S1.said);
    check('2c no line in front of it, no doors back to a sheet that is up, no wall furniture', !S1.lines.some(l => /carry this/.test(l)) && !S1.saidActs && !S1.wall, JSON.stringify({ lines: S1.lines, acts: S1.saidActs, wall: S1.wall }));
    /* 2d THE PAGE FOLLOWS THE PANEL (owner's picture, 20 Oct 2026): when Jambo's panel
       leaves, the sheet takes the room it held; when it comes back, the sheet stands
       beside it again. At the parent the gap stayed and Home showed through it. */
    const frameEdge = () => page.evaluate(() => { const f = document.querySelector('#modal-root [data-dlg-page]'); return f ? Math.round(f.parentElement.getBoundingClientRect().right) : null; });
    const e0 = await frameEdge();
    await page.evaluate(() => { document.getElementById('ig-dock').style.display = 'none'; });
    const e1 = await until(() => { const f = document.querySelector('#modal-root [data-dlg-page]'); const r = f && Math.round(f.parentElement.getBoundingClientRect().right); return r === window.innerWidth ? r : null; }, null, 3000);
    await page.evaluate(() => { document.getElementById('ig-dock').style.display = ''; });
    const e2 = await until(() => { const f = document.querySelector('#modal-root [data-dlg-page]'), d = document.getElementById('ig-dock'); const r = f && Math.round(f.parentElement.getBoundingClientRect().right); return d && r === Math.round(d.getBoundingClientRect().left) ? r : null; }, null, 3000);
    check('2d Jambo\'s panel gone, the sheet takes its room; back, the sheet stands beside it again', e0 != null && e0 < 1440 && e1 === 1440 && e2 === e0, JSON.stringify({ e0, e1, e2 }));
    /* 3 From your words */
    const W3 = S1.words.map(w => w.t);
    /* RE-POINTED (pass 2, 18 Oct 2026): What is the KIND the words ask for, What it is for read from the words */
    check('3 From your words: What (the kind asked for) · With (amber, not in Parties yet) · What it is for (read from the words) · Let Jambo fill the form',
      W3.length === 3 && W3[0] === 'What A non-disclosure agreement' && W3[1] === 'With · not in Parties yet Volvo Cars' && S1.words[1].owed && W3[2] === 'What it is for A pilot' && /^Let Jambo fill the form/.test(S1.fill), JSON.stringify({ W3, fill: S1.fill }));
    /* 9 the panel beside the sheet */
    const P9 = await page.evaluate(() => { const d = document.getElementById('ig-dock'), vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const said = d.querySelector('.ca-dr-said .ca-say');
      return { word: (d.querySelector('.pd-head-word') || {}).textContent || '', bin: vis(document.getElementById('igd-history-clear')), fold: vis(document.getElementById('igd-collapse')),
        ph: (document.getElementById('igd-input') || {}).placeholder, bold: said ? [...said.querySelectorAll('b')].map(b => b.textContent) : [] }; });
    check('9a the panel\'s head: "Jambo · New agreement · ›", no bin', P9.word === 'New agreement' && !P9.bin && P9.fold, JSON.stringify(P9));
    check('9b its box asks "Ask for a number, a list or a contract…"', P9.ph === 'Ask for a number, a list or a contract…', P9.ph);
    check('9c the party and the paper in bold', P9.bold.join('|') === 'Volvo Cars|NDA', JSON.stringify(P9.bold));
    /* 10 RE-POINTED (the third pass; the owner's answer (4): costs stay in Jambo calls, never money —
       even with a ledger and a dated USD rate on file, as seeded above) */
    await page.waitForTimeout(600);
    const C10 = await page.evaluate(() => ({ f: (document.getElementById('na-w-cost') || {}).textContent || '', r: (document.getElementById('na-file-cost') || {}).textContent || '' }));
    check('10a Let Jambo fill the form says its cost in calls: "· 1 Jambo call"', C10.f === '· 1 Jambo call', JSON.stringify(C10));
    check('10b creating says what Jambo\'s reading costs in calls: "… — about three Jambo calls."', C10.r === 'When it is created, Jambo reads it: the brief, our standards, risks and obligations — about three Jambo calls.', JSON.stringify(C10));
    /* 4 Start from */
    check('4a 1 Start from: the three closest on our paper, nothing picked for you; the search and Legal on its line',
      /^1 Start from the three closest on our paper · nothing is picked for you Search all our paper \(\d+\) · None fits\? Ask Legal with a request$/.test(S1.step1), S1.step1);
    check('4b three cards, each with a radio and its shelf, the closest marked, none checked', S1.cards.length === 3 && S1.cards.every(c => c.radio && c.checked === 'false')
      && /the closest/.test(S1.cards[0].t) && S1.cards.every(c => /template|standard/i.test(c.t)), JSON.stringify(S1.cards));
    await shot(page, '4-one-sheet-1440x780');
    /* 5 picked */
    await page.click('#na-closest .na-pick');
    await until(() => !!document.querySelector('#na-form input'), null, 8000);
    await page.waitForTimeout(300);
    const S5 = await page.evaluate(SHEET);
    check('5a the closest picked: its radio checked', S5.cards[0].checked === 'true', JSON.stringify(S5.cards[0]));
    check('5b its questions: "N questions · only Counterparty is needed now"', /^\d+ questions · only Counterparty is needed now$/.test(S5.sub) && /asks$/.test(S5.cardName), `${S5.cardName} · ${S5.sub}`);
    check('5c the counterparty the sentence filled says so: "✦ from your words"', /^Counterparty \*? ?✦ from your words$/.test(S5.cp.replace(/\s+/g, ' ')), S5.cp);
    check('5d who else: "Who else is on this agreement · nobody is emailed until you send"', /^Who else is on this agreement · nobody is emailed until you send/.test(S5.people), S5.people);
    check('5e the cost of reading on the stream\'s own row', !!S5.file && S5.file.inRow && /^When it is created, Jambo reads it/.test(S5.file.cost), JSON.stringify(S5.file));
    check('5f the reason is now the stream\'s', S5.acts.join('|') === 'Choose a stream first|Create draft|Cancel', JSON.stringify(S5.acts));
    /* 11 step 2 in three columns, two rows; who else straight under */
    const Q11 = await page.evaluate(() => { const ls = [...document.querySelectorAll('#na-form .field-grid > label')].filter(l => l.getClientRects().length && getComputedStyle(l).display !== 'none');
      const r = ls.map(l => l.getBoundingClientRect()), tops = [...new Set(r.map(x => Math.round(x.top)))];
      const names = ls.map(l => (l.querySelector('span') || l).textContent.replace(/\s+/g, ' ').trim());
      const sum = document.querySelector('#na-people > summary'), last = Math.max(...r.map(x => x.bottom));
      return { n: ls.length, tops: tops.length, widths: [...new Set(r.map(x => Math.round(x.width)))].length, first: names.slice(0, 3), gap: sum ? Math.round(sum.getBoundingClientRect().top - last) : null }; });
    check('11 step 2: three columns, two rows — who we are, the counterparty, their email first — and "Who else" straight under',
      Q11.n === 6 && Q11.tops === 2 && Q11.widths === 1 && /^Our party/.test(Q11.first[0]) && /^Counterparty/.test(Q11.first[1]) && /^Their email/.test(Q11.first[2]) && Q11.gap != null && Q11.gap <= 30, JSON.stringify(Q11));
    /* 12 step 3 one row */
    const R12 = await page.evaluate(() => { const row = document.querySelector('#na-file .na-file-b'), seg = row && row.querySelector('.na-seg'), need = row && row.querySelector('.na-need'), cost = row && row.querySelector('.na-file-cost');
      const r = el => el.getBoundingClientRect();
      return row && seg && need && cost ? { needBeside: r(need).left >= r(seg).right - 1 && r(need).top < r(seg).bottom, costRight: r(cost).left >= r(need).right - 1 && r(cost).top < r(seg).bottom,
        newStream: !!row.querySelector('[data-na-stream="__new__"]') } : null; });
    check('12 step 3, one row: the streams, "Needed before Create", the cost — no "+ New stream"', !!R12 && R12.needBeside && R12.costRight && !R12.newStream, JSON.stringify(R12));
    /* 15 (the third pass) the streams are separate buttons, each its own edge, amber while owed */
    const B15 = await page.evaluate(() => { const seg = document.querySelector('#na-file .na-seg'), bs = [...document.querySelectorAll('#na-file .na-seg-b')];
      const cs = el => getComputedStyle(el), edge = el => ['Top', 'Right', 'Bottom', 'Left'].every(k => cs(el)['border' + k + 'Style'] === 'solid' && parseFloat(cs(el)['border' + k + 'Width']) >= 1);
      const rs = bs.map(b => b.getBoundingClientRect());
      const apart = rs.every((r, i) => rs.every((q, j) => i === j || r.right <= q.left + 0.5 || q.right <= r.left + 0.5 || r.bottom <= q.top + 0.5 || q.bottom <= r.top + 0.5));
      return { n: bs.length, box: seg ? parseFloat(cs(seg).borderTopWidth) : null, edges: bs.every(edge), apart,
        amber: bs.every(b => cs(b).backgroundColor === cs(document.querySelector('#na-file .na-need') ? document.body : document.body).backgroundColor ? false : true),
        wash: bs.map(b => cs(b).backgroundColor), line: bs.map(b => cs(b).borderTopColor) }; });
    const AMB = await page.evaluate(() => { const d = document.createElement('i'); d.style.cssText = 'background:var(--need-bg);border:1px solid var(--st-amber-line)'; document.body.appendChild(d);
      const c = getComputedStyle(d), out = { bg: c.backgroundColor, line: c.borderTopColor }; d.remove(); return out; });
    check('15 step 3\'s streams are separate buttons — each its own edge, none sharing a box — amber-washed and amber-edged while owed',
      B15.n >= 2 && B15.box === 0 && B15.edges && B15.apart && B15.wash.every(x => x === AMB.bg) && B15.line.every(x => x === AMB.line), JSON.stringify({ B15, AMB }));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
      const S = await page.evaluate(() => { const c = document.getElementById('na-create'), r = c && c.getBoundingClientRect();
        const why = document.getElementById('na-why'), wr = why && why.getBoundingClientRect();
        return { create: !!r && r.top >= 0 && r.bottom <= innerHeight && r.right <= innerWidth, why: !!wr && wr.width > 0, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`8 ${w}×${ht}: Create and its reason in view in the head, nothing sideways`, S.create && S.why && S.side, JSON.stringify(S));
      /* 13 the drawing's own measure of the page's scroll, once a paper is picked */
      const sc = await page.evaluate(() => { const b = document.querySelector('[data-dlg-page] .dlg-pg-body'); return b ? b.scrollHeight - b.clientHeight : null; });
      const most = w === 1440 ? 32 : w === 1536 ? 82 : 0;
      check(`13 ${w}×${ht}: the page scrolls at most ${most}px to reach step 3's foot`, sc != null && sc <= most, String(sc));
      await shot(page, `4-one-sheet-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    /* 6 a stream, then Create */
    await page.click('#na-file [data-na-stream]');
    const S6 = await until(() => { const b = document.getElementById('na-create'); return b && !b.disabled ? (document.getElementById('na-why') || {}).textContent : null; }, null, 6000);
    check('6a a stream chosen: Create wakes, the reason goes', S6 === '', JSON.stringify(S6));
    const n0 = await page.evaluate(() => state.contracts.length);
    await page.click('#na-create');
    const made = await until(n => !document.getElementById('na-root') && state.contracts.length > n, n0, 15000);
    check('6b Create makes the draft', !!made);
    /* 7 the way back */
    await ask();
    /* 14 a second sentence in the sitting: the panel holds one exchange */
    const L14 = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .ca-dr-said')].length);
    check('14 a second sheet in the sitting: one exchange in the panel', L14 === 1, String(L14));
    /* RE-POINTED (the third pass): the bar's ‹ is the sheet's way out — asked first where something
       was typed, as Cancel asks; then the page the reader asked from, named again in the bar */
    await page.click('#na-closest .na-pick');
    await until(() => !!document.querySelector('#na-form input'), null, 8000);
    const typed = await page.evaluate(() => { const i = [...document.querySelectorAll('#na-form input[type="text"], #na-form input[type="email"], #na-form input:not([type])')]
      .find(x => x.getClientRects().length && !x.readOnly && !x.disabled && !String(x.value || '').trim()); if (!i) return null; i.setAttribute('data-typed-here', ''); return i.id || i.name || 'box'; });
    if (typed) await page.fill('#na-form [data-typed-here]', 'legal@volvocars.example');
    await page.click('#dk-back');
    const askedQ = await until(() => { const o = document.getElementById('confirm-overlay'); return o && o.getClientRects().length ? o.innerText.replace(/\s+/g, ' ').trim() : null; }, null, 4000);
    const pressIn = word => page.evaluate(w => { const o = document.getElementById('confirm-overlay'); const b = o && [...o.querySelectorAll('button')].find(x => x.textContent.trim() === w); if (b) b.click(); return !!b; }, word);
    await pressIn('Keep editing'); await page.waitForTimeout(400);
    const stays = await page.evaluate(() => !!document.getElementById('na-root') && !document.getElementById('confirm-overlay'));
    check('7a the bar\'s ‹ asks first where something was typed — and keeping on editing keeps the sheet', !!askedQ && /Leave without creating\?/.test(askedQ) && stays, JSON.stringify({ typed, askedQ, stays }));
    const was = await page.evaluate(() => (window.deskSheetFrom ? deskSheetFrom() : null));
    await page.click('#dk-back');
    await until(() => !!document.getElementById('confirm-overlay'), null, 4000);
    await pressIn('Discard my answers');
    const back = await until(() => !document.getElementById('na-root') ? { page: ((document.getElementById('dk-page') || {}).innerText || '').trim(), key: window.deskKeyNow ? deskKeyNow() : null, view: state.view } : null, null, 6000);
    check('7b leaving by the bar\'s ‹ puts the sheet away and lands on the page asked from, named in the bar',
      !!back && back.page !== 'New agreement' && (was === 'home' ? back.view === 'counter' : back.key === was), JSON.stringify({ was, back }));
    /* 16 THE FOURTH PASS (main's LAND ON IT): "Change the ask" puts the sentence back in Jambo's
       box and lands on it through the one lander — lit, the caret in it, the sheet put away */
    const up16 = await ask();
    const has16 = up16 && await page.evaluate(() => !!document.getElementById('na-ask-again'));
    if (has16) await page.click('#na-ask-again');
    const L16 = has16 ? await until(() => { const i = document.getElementById('igd-input');
      return !document.getElementById('na-root') && i && i.classList.contains('is-landed') ? { v: i.value, here: document.activeElement === i, end: i.selectionStart === i.value.length } : null; }, null, 6000) : null;
    const D16 = L16 ? null : await page.evaluate(() => { const i = document.getElementById('igd-input'); return { root: !!document.getElementById('na-root'), box: !!i, v: i && i.value, cls: i && i.className.slice(-60), act: (document.activeElement || {}).id, conf: !!document.getElementById('confirm-overlay') }; });
    check('16 Change the ask lands on Jambo\'s box: the sentence in it, lit, the caret at its end', !!L16 && L16.v === SAY && L16.here && L16.end, JSON.stringify({ up16: !!up16, has16, L16, D16 }));
    /* 17 HA PUTS THE PAGE AWAY FIRST (owner's picture, 20 Oct 2026): pressed with New
       agreement up, Home's mark closed nothing and the page stood over Home with Jambo's
       panel gone. Nothing typed: it goes, and Home is in front. Something typed: it asks
       first; "Discard my answers" goes Home. At the parent the page stayed up both times. */
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); setView('register'); });
    await until(() => document.getElementById('ig-dock') ? true : null, null, 6000);
    await page.evaluate(() => caDraftForm());
    await until(() => document.getElementById('na-root') ? true : null, null, 6000);
    await page.click('#dk-mark');
    const H17a = await until(() => !document.getElementById('na-root') && state.view === 'counter' ? true : null, null, 4000);
    await page.evaluate(() => setView('register'));
    await until(() => document.getElementById('ig-dock') ? true : null, null, 6000);
    await page.evaluate(() => caDraftForm());
    await until(() => document.getElementById('dr-say') ? true : null, null, 6000);
    await page.fill('#dr-say', 'NDA with Volvo Cars');
    await page.click('#dk-mark');
    const asked17 = await until(() => { const b = [...document.querySelectorAll('button')].find(x => x.getClientRects().length && /^Discard my answers$/.test(x.textContent.trim())); return b ? true : null; }, null, 4000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => x.getClientRects().length && /^Discard my answers$/.test(x.textContent.trim())); if (b) b.click(); });
    const H17b = await until(() => !document.getElementById('na-root') && state.view === 'counter' ? true : null, null, 4000);
    check('17 HA puts the page away first: untyped it goes and Home is in front; typed it asks, and "Discard my answers" lands on Home', !!H17a && !!asked17 && !!H17b, JSON.stringify({ H17a, asked17, H17b }));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
