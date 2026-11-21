/* THE NEW LOOK: THE BOOK (round 6, 1 Nov 2026; the review room's Contracts by folder, a folder's list, the Wall,
   Parties (list, folders, a party), People, Reads, Our paper, My notes, Requests, Import and DNA by contract; behind
   the switch). The round's own world (test/round6-world.js): the contracts filed across three streams, a kept
   question read over a folder, a second one whose one answer stands apart, the parties' own facts, three notes, two
   requests and four imported files.
   With the switch on, at the owner's first screen:
     1 · Contracts opens on its folders: the views across every folder, then a row per stream with its facts
          (RE-POINTED 10 Nov 2026, the owner picked "Views first", f998: the cards became two compact columns and the
           row says "5 · KES 86.30M · 3 need you", the count as a figure, so "N contracts" is gone), Ended & archived
           keeps its own door
     2 · A folder's list: Standing, the kept question (with its count line), Our standards with what is missing; the
         tabs All · Needs you · Signed; the panel reads the folder (Unusual for you, the kept question, Ask)
     3 · The Wall: both parties on each paper; a press chooses and the panel reads it off its paper (Doors, free)
     4 · Parties: Folders (a card per party) and a party's own page (its facts, what waits on you, its agreements)
     5 · People: the person's panel (Right now · Doors)
     6 · Reads: kept questions and packs in one table, Read N more on the row
     7 · Our paper: Shelves with a card per folder, then the list, then the paper small
     8 · My notes: the ledger (Note · Contract · Due) and the note's panel
     9 · Requests: Request · Status · Steps · Asked by · Paper that fits · Waiting, no button on a row; Start the draft
       in the chosen row's panel (RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way))
    10 · Import: What Jambo read · Looks · Stream · Value, the ones that need you first
    11 · DNA by contract: one strand each, its worst mark, the Board's DNA door
    13 · New agreement: the papers as cards; two tabs, no From scratch (re-pointed 14 Nov 2026)
         the rest (one call each), Create files the paper through the one creator
   (12, the switch off, RETIRED 16 Nov 2026, #762: the new look is the only look)
   At the parent (before this round) 1–11 and 13 fail: none of it is drawn.
   Run: node test/chromium/round6-new-look-verify.js   (pictures: ROUND6_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedRound6, R6_IN_PAGE, R6_BRING } = require('../round6-world');

const OUT = process.env.ROUND6_SHOTS || path.join(__dirname, 'shots', 'round6-new-look');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const txt = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel).catch(() => '');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedRound6(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  const shot = async k => { try { await page.screenshot({ path: path.join(OUT, k + '.png') }); } catch (_) {} };
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && typeof getContract === 'function' && !!getContract('MK-CR'), null, 40000);
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
  await page.evaluate(R6_IN_PAGE).catch(e => console.log('world', String(e).slice(0, 200)));

  /* 1 · Contracts on its folders */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'contracts' }));
    /* RE-POINTED (P-31, owner's pick 20 Nov 2026: Contracts the Legora + Stripe way): the folders landing is a summary
       (.ctf-ls) — four figure cards (button.ctf-fig, each its number), where all of them stand (one bar), when they end
       (twelve months of dots), then the folders as a calm table whose rows carry the folder's name, its count and an
       amber "N need you" badge; Ended & archived keeps its own row-door. The views cards (data-ctf-view) are gone. */
    const up = await until(page, () => document.querySelectorAll('.ctf-ls .ctf-ftable tr[data-ctf-folder]').length >= 2, null, 15000);
    const cards = up ? await page.evaluate(() => [...document.querySelectorAll('.ctf-ls .ctf-ftable tr[data-ctf-folder]')].map(b => b.innerText.replace(/\s+/g, ' ').trim())) : [];
    const ended = up ? await page.evaluate(() => !!document.querySelector('.ctf-ls [data-ctf-ended]')) : false;
    await shot('1-folders');
    const views = up ? await page.evaluate(() => [...document.querySelectorAll('.ctf-ls button.ctf-fig[data-ctf-fig]')].map(b => b.innerText.replace(/\s+/g, ' ').trim())) : [];
    /* RE-POINTED 21 Nov 2026 (P-31, as drawn): the bar and the month dots are the one drawing the panels share (.ctls-bar, .ctls-endm) */
    const parts = up ? await page.evaluate(() => ({ stand: !!document.querySelector('.ctf-ls .ctls-bar'), months: document.querySelectorAll('.ctf-ls .ctls-endm span').length,
      oldViews: document.querySelectorAll('[data-ctf-view], .ctf-list').length })) : {};
    check('1 Contracts opens on its folders: four figure cards, where they stand, when they end, then the folders as a table with their facts, Ended & archived its own door',
      up && cards.some(t => /Procurement/.test(t) && /\d+ needs? you/.test(t)) && ended && views.length === 4 && views.every(t => /\d/.test(t))
      && parts.stand && parts.months === 12 && parts.oldViews === 0,
      JSON.stringify({ views, parts, cards: cards.slice(0, 3) }));
  } catch (e) { check('1 Contracts opens on its folders', false, String(e).slice(0, 200)); }

  /* 2 · a folder's list */
  try {
    /* RE-POINTED (P-31, 20 Nov 2026): a folder's row CHOOSES on the first press (.is-sel, the panel sums the folder) and
       opens on the second */
    const proc = await page.evaluate(() => { const b = [...document.querySelectorAll('.ctf-ftable tr[data-ctf-folder]')].find(x => /Procurement/.test(x.innerText)); if (b) b.click(); return !!b; });
    if (proc && await until(page, () => !!document.querySelector('.ctf-ftable tr.is-sel[data-ctf-folder]'), null, 4000))
      await page.evaluate(() => { const b = document.querySelector('.ctf-ftable tr.is-sel[data-ctf-folder]'); if (b) b.click(); });
    await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'), null, 10000);
    await page.evaluate('(' + R6_BRING.toString() + ')()');
    /* RE-POINTED (owner, 9 Nov 2026: "the column should only reflect the name of the column … The count should maybe go to
       the side panel"): the head is the question's name alone; how far it is read stands in the panel, "3 of 6 read" */
    /* RE-POINTED (14 Nov 2026): the panel no longer says "3 of N read" (Columns you asked is gone); the column's head and the panel drawn are the wait */
    /* RE-POINTED 21 Nov 2026 (P-31, as drawn): beside a folder's list the panel is the list's own (.ctls-list) */
    const up = await until(page, () => !!document.querySelector('#ct-place th.ac-th.is-nl') && !!document.querySelector('#ig-dock .ctls-list'), null, 15000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('#ct-place .reg-table thead th')].map(x => x.innerText.trim().toLowerCase().split('\n')[0].trim()).filter(Boolean));
    const sub = await txt(page, '#ct-place th.ac-th.is-nl .reg-th-sub');
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#ct-place .reg-views .reg-vtab')].filter(b => b.offsetParent).map(b => b.innerText.replace(/\s+/g, ' ').trim()));
    /* RE-POINTED (owner's pick, 10 Nov 2026: the Scorecard): what is missing is named on the standards bar's hover, the cell one line */
    /* RETIRED (P-31, owner's pick 20 Nov 2026: Contracts the Legora + Stripe way): Our playbook steps out of the List
       (Agreement · Standing · Stream · Needs you · Ends · Value), so no row carries the scorecard and its "missing: …"
       hover; what is missing against our standards is read on the contract's own Clauses tab */
    const miss = '';
    /* RE-POINTED (owner, 8 Nov 2026: "the side panel is completely cluttered with no structure"; the Reads & Contracts drawing):
       the folder's panel is This folder.
       RE-POINTED AGAIN (owner, 14 Nov 2026: "the feature for these search being added to the panel should be deleted"):
       Columns you asked is gone from the panel: no asked question, no Add to list, no Remove from list there */
    /* RE-POINTED (owner's pick by name, 15 Nov 2026: At a Glance, f1056): the folder's panel is the count and one chip, When
       they end (a month with any is a door to exactly those), Where the money is, Not done yet (who is not checked, its list) */
    /* RE-POINTED 21 Nov 2026 (P-31, as drawn; reverses At a Glance on the new look): the folder's panel is the list's own —
       a sentence of the rows on screen, where they stand (one bar), when they end (twelve months of dots), what needs you
       by name (each name its contract's door); NO money, no cards; nothing spills */
    const panel = await until(page, () => !!document.querySelector('#ig-dock .ctls-list .jov5-title'), null, 12000);
    const kept = await txt(page, '#ig-dock .ctls-list');
    const says = await page.evaluate(() => { const p = document.querySelector('#ig-dock .ctls-list'), b = p ? p.getBoundingClientRect() : null;
      const R = regState(), rows = regFiltered({ flat: true });
      return { months: document.querySelectorAll('#ig-dock .ctls-list .ctls-endm span').length, bar: !!document.querySelector('#ig-dock .ctls-list .ctls-bar'),
        needs: document.querySelectorAll('#ig-dock .ctls-list [data-ctls-open]').length,
        owed: Math.min(4, rows.filter(c => { try { return needsYouOf(c).length > 0; } catch (_){ return false; } }).length),
        head: ((p && p.querySelector('.jov5-title')) || {}).textContent || '', n: rows.length, folder: R.type,
        cards: p ? p.querySelectorAll('.jov5-tile, .jov5-row, .jov5-g, .rfp-row').length : -1,
        money: !!p && /KES|SEK|USD|EUR|on paper|Where the money is/i.test(p.innerText),
        spill: b ? [...p.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.right > b.right + 1 || r.left < b.left - 1); }).length : -1 }; });
    check('2b the folder\'s panel as drawn: a sentence of its own rows, where they stand, twelve months, what needs you by name, NO money, no cards; nothing spills',
      panel && says.months === 12 && says.bar && says.needs === says.owed && new RegExp('^' + says.n + ' contracts?').test(says.head) && !says.money && says.cards === 0 && says.spill === 0
      && /Where they stand[\s\S]*When they end/i.test(kept), { says });
    await shot('2-folder-list');
    check('2 a folder\'s list: Standing, the kept question (its name alone), what is missing; All · Needs you · Signed; the folder\'s panel as drawn',
      proc && up && heads.includes('standing') && heads.includes('needs you') && !heads.includes('our playbook') && !sub.trim() && !/Columns you asked|read · (not )?on this list|Add to list/i.test(kept) && tabs.some(t => /^Signed/.test(t)) && !miss
      && panel && /When they end/i.test(kept) && !/Remove from list/.test(kept) && !/\bcalls?\b|\bfree\b/i.test(kept), { heads, sub, tabs, miss, panel, kept: kept.slice(0, 600) });
    /* (P-31 as drawn, 21 Nov 2026) the heads say Folder only where the list holds many folders: inside one it steps out */
  } catch (e) { check('2 a folder\'s list', false, String(e).slice(0, 200)); }

  /* 3 · the Wall */
  try {
    await page.evaluate(() => { const b = document.querySelector('[data-ctf-back]'); if (b) b.click(); });
    await until(page, () => !!document.querySelector('[data-ctf-show="wall"]'), null, 8000);
    await page.evaluate(() => document.querySelector('[data-ctf-show="wall"]').click());
    const up = await until(page, () => document.querySelectorAll('.igw-card.is-nl').length > 3, null, 12000);
    /* RE-POINTED (P-31, owner's pick 20 Nov 2026: the Stripe wall): the paper carries its title alone (no parties line on
       it); the other side is said UNDER each paper (.igw2-who), beside a soft standing badge */
    const both = up ? await page.evaluate(() => { const K = [...document.querySelectorAll('.igw-card.is-nl:not(.is-coded)')];
      return K.length > 0 && K.every(k => !k.querySelector('.igw-sheet .igw-p') && !!k.querySelector('.igw2-foot .reg-badge'))
        && K.some(k => ((k.querySelector('.igw2-who') || {}).textContent || '').trim().length > 0); }) : false;
    if (up) await page.evaluate(() => { const k = [...document.querySelectorAll('.igw-card.is-nl')].find(x => /Raw Milk/.test(x.textContent)); if (k) k.click(); });
    /* RE-POINTED 21 Nov 2026 (P-31, as drawn): the chosen paper's panel (.ctls-chosen) — badge, name, Open it, the six
       stages, what was read off its paper (where its wording is loaded), a timeline */
    const chosen = up && await until(page, () => !!document.querySelector('#ig-dock .ctls-chosen .ctls-spine'), null, 10000);
    const said = await txt(page, '#ig-dock .ctls-chosen');
    const hint = await txt(page, '.igw2-hint');
    await shot('3-wall');
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */
    check('3 the Wall: the other side under each paper, a soft badge beside it; a press chooses, the panel reads it off its paper with its doors, no cost said, no how-to line under the papers',
      up && both && chosen && /Raw Milk Collection/.test(said) && /Where it stands/i.test(said) && /Timeline/i.test(said) && /Open it/i.test(said) && !/\bfree\b|\bcalls?\b|costs? nothing/i.test(said) && !hint /* RE-POINTED (the harmony review, EVEN CARDS, owner's yes 9 Nov 2026): the how-to line under the papers is gone; the panel says what is chosen */, { said: said.slice(0, 160), hint });
  } catch (e) { check('3 the Wall', false, String(e).slice(0, 200)); }

  /* 4 · Parties: RE-POINTED 19 Nov 2026 (the Parties round, owner's "build all the designs in parties"): Folders and a
     party's own page are gone — the list is the landing page, a sentence over it, a row's press opens its panel: the
     party's own facts, its contacts, three agreements and all of them on Contracts */
  try {
    await page.evaluate(() => setView('customers'));
    const up = await until(page, () => !!document.querySelector('.cun-page[data-cu-screen="list"] #cu-tbody [data-cu-cust]') && !document.querySelector('[data-cun-tab="folders"]'), null, 12000);
    const say = await txt(page, '.cun-page .cun-say');
    await shot('4a-parties');
    await page.evaluate(() => { const r = [...document.querySelectorAll('#cu-tbody [data-cu-cust]')].find(x => /Naivas/.test(x.innerText)); if (r) r.click(); });
    /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way): the agreements' group is gone — all
       of them on Contracts is the panel's black button (.jov5-go[data-cun-cts], "Open on Contracts") */
    const panel = await until(page, () => !!document.querySelector('#ins-panel .jov5-go[data-cun-cts]'), null, 10000);
    const said = await txt(page, '#ins-panel');
    await shot('4b-party');
    check('4 Parties: the list first, no sentence over it (owner, 20 Nov 2026: "delete the highlighted parts"); a row\'s panel with its facts, contacts and agreements, all of them on Contracts',
      up && say === '' && panel && /own facts/i.test(said) && /Contacts/.test(said) && /on Contracts/.test(said), { say: say.slice(0, 160), said: said.slice(0, 200) });
  } catch (e) { check('4 Parties', false, String(e).slice(0, 200)); }

  /* 5 · People */
  try {
    await page.evaluate(() => setView('directory'));
/* RE-POINTED 15 Nov 2026 (owner: Jambo's panels "Build as drawn", the five parts): the panel is the five-part builder's now */ 
    const up = await until(page, () => /Show their contracts/i.test((document.querySelector('#ins-panel .jov5[data-jov-slot="dirn"]') || {}).innerText || ''), null, 12000);
    const said = await txt(page, '#ins-panel .jov5[data-jov-slot="dirn"]');
    await shot('5-people');
    check('5 People: the person in one sentence, Right now, Doors', up && /Show their contracts/.test(said) && /Email them/.test(said), said.slice(0, 160));
  } catch (e) { check('5 People', false, String(e).slice(0, 200)); }

  /* 6 · Reads */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'reads' }));
    /* RE-POINTED (owner, 15 Nov 2026: THE NEW DISCOVER, f1055): the list of reads; a pack is a chip on New read */
    /* RE-POINTED (P-42, owner's pick 20 Nov 2026: Discover the Legora + Stripe way): the columns are Question · Status ·
       Answered · To look at · Where · By · When */
    const up = await until(page, () => !!document.querySelector('#rd-page.dsn-page tbody tr[data-dsn-run]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.dsn-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    const more = await until(page, () => !!document.querySelector('#ins-panel [data-dsn-open]'), null, 8000);
    await page.evaluate(() => { const b = document.getElementById('dsn-new'); if (b) b.click(); });
    const packs = await until(page, () => !!document.querySelector('#rd-page.dsn-page [data-dsc-pack]'), null, 8000);
    await shot('6-reads');
    check('6 Reads: every read in one table, its summary in the panel, a pack a chip on New read', up && heads.join('|') === 'question|status|answered|to look at|where|by|when' && more && packs, heads);
  } catch (e) { check('6 Reads', false, String(e).slice(0, 200)); }

  /* 7 · Our paper */
  try {
    /* RE-POINTED 17 Nov 2026 (f1091, the owner's pick: Shelves with Cover flow, then the Legora way, then the paper):
       Shelves first (the filter line, the figures, a Cover flow row per folder), All opens the list (chips, rows quoting
       their first line), a row pressed twice opens the paper small beside its facts; the panel speaks for the step */
    await page.evaluate(() => setView('templates'));
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* Shelves: one ask box (label.apn-ask) and chips Shelves · All (.apn-tab.is-chip), NO figure cards, a calm card per
       shelf (.tpln6-fc); All: one calm table (.tpln6-table, rows tr.tpln-lr quoting § 1); a row pressed twice opens the paper */
    const up = await until(page, () => !!document.querySelector('.tpln6.is-shelves .tpln6-fcg .tpln6-fc'), null, 12000);
    const shelf = await page.evaluate(() => ({ ask: !!document.querySelector('.tpln5 label.apn-ask [data-tpln-q]'), figs: !document.querySelector('.tpln5 .tpln5-figs, .tpln5 .tpln5-fig'),
      chips: document.querySelectorAll('.tpln5 .apn-bar .apn-tab.is-chip[data-tpln-view]').length === 2 }));
    const used = await until(page, () => /came back changed/i.test((document.querySelector('#ins-panel') || {}).innerText || ''), null, 8000);
    await shot('7-our-paper');
    await page.evaluate(() => { const b = document.querySelector('.tpln5 .apn-bar [data-tpln-view="list"]'); if (b) b.click(); });
    const listed = await until(page, () => !!document.querySelector('.tpln5.is-list .tpln6-table tr.tpln-lr[data-tpl-pf]'), null, 8000);
    const lg = await page.evaluate(() => ({ chips: !!document.querySelector('.tpln5.is-list .apn-bar .apn-tab.is-chip'), quote: !!document.querySelector('.tpln5.is-list tr.tpln-lr .tpln-q') }));
    await page.evaluate(() => { const r = document.querySelector('.tpln5.is-list tr.tpln-lr[data-tpl-pf]:not([hidden])'); if (r) r.click(); });
    await until(page, () => !!document.querySelector('.tpln5.is-list tr.tpln-lr.is-on'), null, 6000);
    await page.evaluate(() => { const r = document.querySelector('.tpln5.is-list tr.tpln-lr.is-on'); if (r) r.click(); });
    const sheet = await until(page, () => !!document.querySelector('.tpln5.is-paper .tpln-sheet .tpl-pf-sheet, .tpln5.is-paper .tpln-sheet .tpl-pf-none'), null, 8000);
    check('7 Our paper: Shelves (one ask box, chips, no figure cards, a card per shelf), then the list (chips, each row quoting its first line), then the paper small; its use in the panel', up && shelf.ask && shelf.figs && shelf.chips && used && listed && lg.chips && lg.quote && sheet, { shelf, lg, listed, sheet });
  } catch (e) { check('7 Our paper', false, String(e).slice(0, 200)); }

  /* 8 · My notes */
  try {
    await page.evaluate(() => setView('mynotes'));
    const up = await until(page, () => !!document.querySelector('.mnn-table tbody tr[data-mn-row]'), null, 12000);
    /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): the amber word is now the Status
       column's soft badge (.apn-st.is-amber, "Due today") */
    const due = await txt(page, '.mnn-table tbody .apn-st.is-amber');
    /* RE-POINTED (owner, 16 Nov 2026: the chosen row's panel in the five parts; f1073): the note's panel is drawn by the
       one builder (data-jov-slot="mnn"), "This note" over its rows, Mark reviewed its button */
    const panel = await until(page, () => { const p = document.querySelector('#ins-panel [data-jov-slot="mnn"]'); return !!p && /This note/i.test(p.innerText) && /Mark reviewed|Review again/i.test(p.innerText); }, null, 8000);
    await shot('8-my-notes');
    check('8 My notes: the ledger with Today in amber, the note\'s panel', up && /Due today/.test(due) && panel, due); /* RE-POINTED (P-27, owner's pick 20 Nov 2026: My notes the Legora + Stripe way): the badge says "Due today" */
  } catch (e) { check('8 My notes', false, String(e).slice(0, 200)); }

  /* 9 · Requests */
  try {
    await page.evaluate(() => setView('intake'));
    const up = await until(page, () => !!document.querySelector('.ikn-table tbody tr[data-ikn-row]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.ikn-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    /* RE-POINTED (P-32, owner's pick 20 Nov 2026: Requests the Legora + Stripe way): no button on a row; Start the draft
       lives in the chosen row's panel — an undrafted row is chosen, then #ins-panel [data-ikn-draft] stands */
    const rowBtn = await page.evaluate(() => !!document.querySelector('.ikn-table tbody [data-ikn-draft], .ikn-table tbody [data-ikn-open], .ikn-table tbody .ikn-go, .ikn-table tbody button'));
    const open = await page.$('.ikn-table tbody tr[data-ikn-row]:not(.is-done)');
    if (open) await open.click();
    const go = !!open && !!(await until(page, () => !!document.querySelector('#ins-panel [data-ikn-draft]'), null, 6000));
    await shot('9-requests');
    const ALL = ['request', 'status', 'steps', 'asked by', 'paper that fits', 'waiting'];
    const colsOk = ['request', 'status', 'asked by', 'waiting'].every(x => heads.includes(x)) && heads.every(x => ALL.includes(x)) && heads.every((x, i) => !i || ALL.indexOf(x) > ALL.indexOf(heads[i - 1]));
    check('9 Requests: Request · Status · Steps · Asked by · Paper that fits · Waiting, no button on a row, Start the draft in the chosen row\'s panel', up && colsOk && !rowBtn && go, JSON.stringify({ heads, rowBtn, go }));
  } catch (e) { check('9 Requests', false, String(e).slice(0, 200)); }

  /* 10 · Import */
  try {
    await page.evaluate(() => setView('migration'));
    const up = await until(page, () => !!document.querySelector('.mign-table tbody tr[data-row]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.mign-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    /* RE-POINTED 21 Nov 2026 (P-33, as drawn): a parked file (is it signed?, a copy?) says no sureness ("—"), so "N of 5" is
       looked for over the rows, not only the first */
    const first = await page.evaluate(() => [...document.querySelectorAll('.mign-table tbody tr[data-row]')].map(r => r.innerText).join(' | '));
    await shot('10-import');
    /* RE-POINTED (owner, 16 Nov 2026: the figures and "the level of confidence for each contract" are back; f1081): How sure
       stands after What Jambo read, and five figures over the list */
    /* RE-POINTED (P-33, owner's pick 20 Nov 2026: Import the Legora + Stripe way) */
    /* the five figures became ONE batch bar with its legend; the table File · Reading (a soft badge) · What Jambo read ·
       How sure ("N of 5" with three bars) · Stream · Value; no buttons on the rows — the first row waits, said by its badge */
    const figs = await page.evaluate(() => ({ tiles: document.querySelectorAll('.mign-page .mign-figs, .mign-page .mign-fig').length, bar: !!document.querySelector('.mign-page .mign-batch .mign-bbar'),
      key: [...document.querySelectorAll('.mign-page .mign-batch .mign-bk')].map(x => x.innerText.replace(/\s+/g, ' ').trim()),
      badge: ((document.querySelector('.mign-table tbody tr[data-row] .apn-st') || {}).textContent || '').trim(), rowBtn: !!document.querySelector('.mign-table tbody tr[data-row] button') }));
    check('10 Import: File · Reading · What Jambo read · How sure · Stream · Value, one batch bar with its legend, the ones that need you first, no button on a row', up && heads.join('|') === 'file|reading|what jambo read|how sure|stream|value'
      && !figs.tiles && figs.bar && figs.key.length >= 1 && /^(To check|A copy\?|No readable text|Is it signed\?|Could not be read)$/.test(figs.badge) && !figs.rowBtn && /\d+ of \d+/.test(first), { heads, figs, first: first.slice(0, 160) });
  } catch (e) { check('10 Import', false, String(e).slice(0, 200)); }

  /* 11 · DNA by contract — RE-POINTED 10 Nov 2026: the owner deleted the DNA page and its button.
     The Board's head carries no DNA door any more, and nothing draws its page. */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'board' }));
    const head = await until(page, () => !!document.querySelector('#hb-bhead [data-hb-rdn]'), null, 12000);
    const gone = await page.evaluate(() => ({ btn: !!document.querySelector('[data-hb-dna]'), page: !!document.querySelector('.dna-page'), fn: typeof window.hbDnaHtml }));
    check('11 DNA is gone: no button beside Read down, no page, nothing published', head && !gone.btn && !gone.page && gone.fn === 'undefined', gone);
  } catch (e) { check('11 DNA is gone', false, String(e).slice(0, 200)); }

  /* 13 · New agreement: the papers as cards. RE-POINTED 14 Nov 2026 (owner: "in the new agreement page, delete the from
     scratch option. This will only be featured in the our paper page and only if you have been granted access to it"):
     the sheet carries two tabs, Our paper and Their paper, and no From scratch section; the new-paper grant still gates
     New standard contract → From scratch on Our paper */
  try {
    await page.evaluate(() => openNewAgreement({ asked: 'a two-year supply agreement with Nandi Dairy for raw milk', words: { who: 'Nandi Dairy', what: 'supply agreement', facts: [{ k: 'term', say: 'two years', months: 24, quote: 'two-year' }] } }));
    const up = await until(page, () => !!document.querySelector('#na-root.na-one [data-na-paper="ours"]'), null, 10000);
    const cards = up && await page.evaluate(() => getComputedStyle(document.querySelector('#na-root .na-closest')).display);
    const gated = await page.evaluate(() => typeof mayMakeNewPaper === 'function' && mayMakeNewPaper({ role: 'editor' }) === false);
    const tabs = up && await page.evaluate(() => [...document.querySelectorAll('#na-root [data-na-paper]')].map(b => b.getAttribute('data-na-paper')));
    const gone = await page.evaluate(() => !document.getElementById('na-scratch') && typeof window.naScratchNow !== 'function');
    await shot('13-new-agreement');
    check('13 New agreement: the papers as cards; two tabs (Our paper, Their paper), no From scratch; new paper stays behind its grant',
      !!up && cards === 'grid' && gated && Array.isArray(tabs) && tabs.join(',') === 'ours,theirs' && gone, { cards, gated, tabs, gone });
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
  } catch (e) { check('13 New agreement', false, String(e).slice(0, 200)); }

  /* RETIRED 16 Nov 2026 (#762): 12 "the switch off: as before" — there is no switch; the new look is the only look */

  await browser.close(); await h.stop();
  console.log(fails ? `${fails} FAILED` : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
