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
     7 · Our paper: the chosen paper small, Standards and Shelves beside it
     8 · My notes: the ledger (Note · Contract · Due) and the note's panel
     9 · Requests: Request · Where it stands · Asked by · Lane, Start the draft on the row
    10 · Import: What Jambo read · Looks · Stream · Value, the ones that need you first
    11 · DNA by contract: one strand each, its worst mark, the Board's DNA door
    13 · New agreement: the papers as cards; two tabs, no From scratch (re-pointed 14 Nov 2026)
         the rest (one call each), Create files the paper through the one creator
   And the switch off:
    12 · Contracts opens on the list (no folders), Parties and Reads are drawn as before
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
    const up = await until(page, () => document.querySelectorAll('[data-ctf-folder]').length >= 2, null, 15000);
    const cards = up ? await page.evaluate(() => [...document.querySelectorAll('[data-ctf-folder]')].map(b => b.innerText.replace(/\s+/g, ' ').trim())) : [];
    const ended = up ? await page.evaluate(() => !!document.querySelector('[data-ctf-ended]')) : false;
    await shot('1-folders');
    const views = up ? await page.evaluate(() => [...document.querySelectorAll('[data-ctf-view]')].map(b => b.innerText.replace(/\s+/g, ' ').trim())) : [];
    check('1 Contracts opens on its folders: the views, then the folders with their facts, Ended & archived its own door',
      up && cards.some(t => /Procurement/.test(t) && /\d+ · /.test(t) && /need you/.test(t)) && ended && views.length >= 1 && views.every(t => /^\d+ /.test(t)),
      JSON.stringify({ views, cards: cards.slice(0, 3) }));
  } catch (e) { check('1 Contracts opens on its folders', false, String(e).slice(0, 200)); }

  /* 2 · a folder's list */
  try {
    const proc = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-ctf-folder]')].find(x => /Procurement/.test(x.innerText)); if (b) b.click(); return !!b; });
    await until(page, () => !!document.querySelector('#reg-tbody tr[data-row]'), null, 10000);
    await page.evaluate('(' + R6_BRING.toString() + ')()');
    /* RE-POINTED (owner, 9 Nov 2026: "the column should only reflect the name of the column … The count should maybe go to
       the side panel"): the head is the question's name alone; how far it is read stands in the panel, "3 of 6 read" */
    const up = await until(page, () => !!document.querySelector('#ct-place th.ac-th.is-nl') && /3 of \d+ read/.test((document.querySelector('.rfp-panel') || {}).innerText || ''), null, 15000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('#ct-place .reg-table thead th')].map(x => x.innerText.trim().toLowerCase().split('\n')[0].trim()).filter(Boolean));
    const sub = await txt(page, '#ct-place th.ac-th.is-nl .reg-th-sub');
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#ct-place .reg-views .reg-vtab')].filter(b => b.offsetParent).map(b => b.innerText.replace(/\s+/g, ' ').trim()));
    /* RE-POINTED (owner's pick, 10 Nov 2026: the Scorecard): what is missing is named on the standards bar's hover, the cell one line */
    const miss = await page.evaluate(() => [...document.querySelectorAll('#ct-place .ls-score')].map(x => x.getAttribute('title') || '').join(' | '));
    /* RE-POINTED (owner, 8 Nov 2026: "the side panel is completely cluttered with no structure"; the Reads & Contracts drawing):
       the folder's panel is This folder · Columns you asked; the kept question stands there, on this list, with Remove from list */
    const panel = await until(page, () => /Columns you asked/i.test((document.querySelector('.rfp-panel') || {}).innerText || '') && /on this list/i.test((document.querySelector('.rfp-panel') || {}).innerText || ''), null, 12000);
    const kept = await txt(page, '.rfp-panel');
    await shot('2-folder-list');
    check('2 a folder\'s list: Standing, the kept question (its name alone; how far it is read in the panel), what is missing; All · Needs you · Signed; the folder\'s panel as drawn',
      proc && up && heads.includes('standing') && !sub.trim() && /3 of \d+ read · on this list/i.test(kept) && tabs.some(t => /^Signed/.test(t)) && /missing: insurance/i.test(miss)
      && panel && /This folder/i.test(kept) && /Remove from list/.test(kept) && !/\bcalls?\b|\bfree\b/i.test(kept), { heads, sub, tabs, miss, panel, kept: kept.slice(0, 600) });
  } catch (e) { check('2 a folder\'s list', false, String(e).slice(0, 200)); }

  /* 3 · the Wall */
  try {
    await page.evaluate(() => { const b = document.querySelector('[data-ctf-back]'); if (b) b.click(); });
    await until(page, () => !!document.querySelector('[data-ctf-show="wall"]'), null, 8000);
    await page.evaluate(() => document.querySelector('[data-ctf-show="wall"]').click());
    const up = await until(page, () => document.querySelectorAll('.igw-card.is-nl').length > 3, null, 12000);
    const both = up ? await page.evaluate(() => [...document.querySelectorAll('.igw-card.is-nl .igw-p')].some(x => / and /.test(x.textContent))) : false;
    if (up) await page.evaluate(() => { const k = [...document.querySelectorAll('.igw-card.is-nl')].find(x => /Raw Milk/.test(x.textContent)); if (k) k.click(); });
    const chosen = up && await until(page, () => !!document.querySelector('.pd2-chosen .pd2-ch-tbl'), null, 10000);
    const said = await txt(page, '.pd2-chosen');
    const hint = await txt(page, '.igw2-hint');
    await shot('3-wall');
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */
    check('3 the Wall: both parties on each paper; a press chooses, the panel reads it off its paper with its doors, no cost said, no how-to line under the papers',
      up && both && chosen && /Raw Milk Collection, chosen/.test(said) && /Read off its paper/i.test(said) && /Open it/i.test(said) && !/\bfree\b|\bcalls?\b|costs? nothing/i.test(said) && !hint /* RE-POINTED (the harmony review, EVEN CARDS, owner's yes 9 Nov 2026): the how-to line under the papers is gone; the panel says what is chosen */, { said: said.slice(0, 160), hint });
  } catch (e) { check('3 the Wall', false, String(e).slice(0, 200)); }

  /* 4 · Parties: folders and a party's page */
  try {
    await page.evaluate(() => setView('customers'));
    await until(page, () => !!document.querySelector('.cun-page [data-cun-tab="folders"]'), null, 12000);
    await page.evaluate(() => document.querySelector('[data-cun-tab="folders"]').click());
    const cards = await until(page, () => document.querySelectorAll('.cunf-card').length >= 3, null, 8000);
    const card = await txt(page, '.cunf-card');
    await shot('4a-party-folders');
    await page.evaluate(() => { const b = [...document.querySelectorAll('.cunf-card')].find(x => /Naivas/.test(x.innerText)); if (b) b.click(); });
    const pageUp = await until(page, () => !!document.querySelector('.cunp-page .cunp-table tbody tr'), null, 10000);
    const facts = await txt(page, '.cunp-two');
    const ags = await page.evaluate(() => document.querySelectorAll('.cunp-table tbody tr').length);
    await shot('4b-party');
    check('4 Parties: a card per party; a party\'s own page with its facts, what waits on you and its agreements',
      cards && /deal/.test(card) && pageUp && /Mombasa/.test(facts) && /Waiting on you/i.test(facts) && ags === 3, { card: card.slice(0, 120), facts: facts.slice(0, 160), ags });
    await page.evaluate(() => { const b = document.querySelector('[data-cunp-back]'); if (b) b.click(); });
  } catch (e) { check('4 Parties', false, String(e).slice(0, 200)); }

  /* 5 · People */
  try {
    await page.evaluate(() => setView('directory'));
    const up = await until(page, () => /Right now/i.test((document.querySelector('#ins-panel .cun-panel') || {}).innerText || ''), null, 12000);
    const said = await txt(page, '#ins-panel .cun-panel');
    await shot('5-people');
    check('5 People: the person in one sentence, Right now, Doors', up && /Show their contracts/.test(said) && /Email them/.test(said), said.slice(0, 160));
  } catch (e) { check('5 People', false, String(e).slice(0, 200)); }

  /* 6 · Reads */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'reads' }));
    const up = await until(page, () => !!document.querySelector('.rdn-table tbody tr[data-rd-row]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.rdn-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    /* RE-POINTED (owner, 8 Nov 2026, the Reads & Contracts drawing): the next batch is the panel's Read the other N, not the row's */
    const more = await until(page, () => !!document.querySelector('#ins-panel [data-rd-act="next"]'), null, 8000);
    /* RE-POINTED (owner, 12 Nov 2026, Discover): a pack is a chip under the ask box, and a row of the Packs tab */
    const packs = await page.evaluate(() => !!document.querySelector('#rd-page.dsc-page [data-dsc-pack]'));
    await shot('6-reads');
    check('6 Reads: questions and packs in one table, Read the other N in the panel', up && heads.join('|') === 'question|read|answers|on the list of|asked' && more && packs, heads);
  } catch (e) { check('6 Reads', false, String(e).slice(0, 200)); }

  /* 7 · Our paper */
  try {
    await page.evaluate(() => setView('templates'));
    const up = await until(page, () => !!document.querySelector('.tpln .tpln-r[data-tpl-pf]'), null, 12000);
    const caps = await page.evaluate(() => [...document.querySelectorAll('.tpln .pd2-ch-cap')].map(x => x.innerText.trim().toLowerCase()));
    const sheet = await page.evaluate(() => !!document.querySelector('.tpln-sheet .tpl-pf-sheet, .tpln-sheet .tpl-pf-none'));
    const used = await until(page, () => /How it has been used/i.test((document.querySelector('#ins-panel') || {}).innerText || ''), null, 8000);
    await shot('7-our-paper');
    /* THE LEGORA WAY (owner's pick, 14 Nov 2026): one ask box, the streams as chips on one line, a quiet list whose rows quote their first line; Shelves stay beside the paper */
    const lg = await page.evaluate(() => ({ ask: !!document.querySelector('.tpln [data-tpln-q]'), chips: !!document.querySelector('.tpln .tpln-chips'), quote: !!document.querySelector('.tpln .tpln-r .tpln-q') }));
    check('7 Our paper: one ask box, the streams on one line, each row quoting its first line; the paper small, Shelves beside it, its use in the panel', up && lg.ask && lg.chips && lg.quote && caps.includes('shelves') && sheet && used, { caps, lg });
  } catch (e) { check('7 Our paper', false, String(e).slice(0, 200)); }

  /* 8 · My notes */
  try {
    await page.evaluate(() => setView('mynotes'));
    const up = await until(page, () => !!document.querySelector('.mnn-table tbody tr[data-mn-row]'), null, 12000);
    const due = await txt(page, '.mnn-table .mnn-due');
    const panel = await until(page, () => /The note/i.test((document.querySelector('#ins-panel .cun-panel') || {}).innerText || ''), null, 8000);
    await shot('8-my-notes');
    check('8 My notes: the ledger with Today in amber, the note\'s panel', up && /Today/.test(due) && panel, due);
  } catch (e) { check('8 My notes', false, String(e).slice(0, 200)); }

  /* 9 · Requests */
  try {
    await page.evaluate(() => setView('intake'));
    const up = await until(page, () => !!document.querySelector('.ikn-table tbody tr[data-ikn-row]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.ikn-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    const go = await page.evaluate(() => !!document.querySelector('.ikn-table [data-ikn-draft]'));
    await shot('9-requests');
    /* THE SAP WAY WITH COLOUR (owner's pick, 14 Nov 2026): the stream is its own chip column; the lane's person went into Where it stands */
    check('9 Requests: Request · Stream · Where it stands · Asked by, Start the draft on the row', up && heads.join('|') === 'request|stream|where it stands|asked by' && go, heads);
  } catch (e) { check('9 Requests', false, String(e).slice(0, 200)); }

  /* 10 · Import */
  try {
    await page.evaluate(() => setView('migration'));
    const up = await until(page, () => !!document.querySelector('.mign-table tbody tr[data-row]'), null, 12000);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.mign-table thead th')].map(x => x.innerText.trim().toLowerCase()).filter(Boolean));
    const first = await txt(page, '.mign-table tbody tr[data-row]');
    await shot('10-import');
    check('10 Import: What Jambo read · Looks · Stream · Value, the ones that need you first', up && heads.join('|') === 'file|what jambo read|looks|stream|value' && /Fill in|Name it/.test(first), { heads, first: first.slice(0, 120) });
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

  /* 12 · the switch off */
  try {
    await page.evaluate(async () => { await stPrefSet('newLook', false); newLookApply(); });
    await page.evaluate(() => caGo({ kind: 'go', place: 'contracts' }));
    await until(page, () => !!document.querySelector('#ct-place'), null, 10000);
    await page.waitForTimeout(800);
    const folders = await page.evaluate(() => !!document.querySelector('[data-ctf-folder]'));
    await page.evaluate(() => setView('customers'));
    await page.waitForTimeout(800);
    const cun = await page.evaluate(() => !!document.querySelector('.cun-page'));
    await page.evaluate(() => caGo({ kind: 'go', place: 'reads' }));
    await page.waitForTimeout(800);
    const rdn = await page.evaluate(() => !!document.querySelector('.rdn-page'));
    check('12 the switch off: no folders, Parties and Reads as before', !folders && !cun && !rdn, { folders, cun, rdn });
  } catch (e) { check('12 the switch off', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `${fails} FAILED` : 'all passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
