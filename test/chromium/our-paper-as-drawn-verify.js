/* OUR PAPER AND THE BUILDER, AS DRAWN (round 21 of the redesign, "Paper
   first", both scenes — every drawn part on the owner's "build all the gaps",
   18 Oct 2026; js/views/library.js tplPf*, js/views/templatebuilder.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace: a published
   master services agreement with five contracts drafted from it (two came
   back changed on liability, one of them on payment too) and a draft
   reseller agreement.
     1 the page's head: its name with "N templates", the one facts line
       ("N contracts drafted from them in 12 months · N came back changed"),
       and a count on each of the three tabs
     2 the index: the chosen template's shelf open, the others one line each;
       a shelf's line opens it, pressed again it folds; rows say "v1 · used 5
       · Sales" and "2 changed" / "draft"
     3 the template's head: name, version pill, "Company standard · Sales ·
       used 5 times in 12 months · 2 came back changed · updated …", and its
       verbs Open in the builder · Draft from it (greyed with its reason on a
       draft)
     4 the paper: blanks as blanks (no form boxes), and small marks under a
       clause — "✓ Liability cap at 12 months fees", "Came back changed 2
       times" — never wording (not selectable, data-not-wording)
     5 Jambo's panel beside it: "<name> v1, from the record — nothing spent.
       Used 5 times in 12 months. 2 came back changed: clause 2 Liability
       twice, clause 3 Payment once. It meets all N of Our standards." + Next
       steps chips; the ask box, with no hint line under it (Chambers, owner's
       pick 20 Oct 2026: no hint line under any Jambo box); ‹ Jambo lets the
       template go and a press holds it again
     6 doors land: "where it came back changed" lands on the mark; the mark
       opens the Contracts list narrowed to the contracts it counts; Draft
       from it opens the ONE New agreement form with the template chosen
     7 the builder (scene b): the head card on one line (name · v1 draft ·
       Category · Stream · Save draft · Publish v1); Jambo's panel at the
       window's edge with Build · Outline · Playbook n/m · Blanks n, opening
       on the Outline (sections with "1 blank", ✓, "+ … proposed"), Blanks
       and Our standards said under it; the ask box, no hint line under it
     8 Jambo proposes on the paper (Add · Skip, "Our standard: …"); Skip takes
       it away for this template; Add puts our standard's heading in through
       the one push; marks under the sections that meet a standard
     9 an Outline row lands on its section; ‹ Jambo is Build with nothing in
       hand; › folds the panel to the edge and its strip opens it
    10 the owner's three screens: nothing sideways, the panel and the page
       side by side, the builder's head on one line
   RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way): 1 the head is the name alone with
   Our playbook › and New standard, one ask box and the chips; the numbers said once, in the panel under All; 2 one
   calm table (shelf and kind badges, drafted, signed), "+ Shelf" in place of the stream chips; 3 the paper's column:
   badges and a 2×2 of facts; 5 panels without tiles (the paper's: latest drafted; the list's: three bars, 5g).
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/our-paper-as-drawn-verify.js */
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

/* the seed, run in the page through the product's own routes */
async function SEED(){
  const B = (t, c) => ({ blockType: t, content: c });
  const F = (k, l) => ({ fieldKey: k, label: l, fieldType: 'short_text', control: 'free', options: [], required: false, defaultValue: '', helpText: '' });
  const mk = async (name, blocks, fields, publish) => {
    const d = await api('templates', 'POST', { name, category: 'commercial', folder: 'sales', description: '' });
    const t = await api('templates/' + d.template.id);
    const vid = t.versions[0].id;
    await api(`templates/${d.template.id}/versions/${vid}`, 'PUT', { blocks: blocks.map((b, i) => ({ orderIndex: i, ...b })), fields });
    if (publish) await api(`templates/${d.template.id}/versions/${vid}/publish`, 'POST', { changeNote: 'First' });
    return { tid: d.template.id, vid };
  };
  const msa = await mk('Master services agreement', [
    B('heading', 'Master Services Agreement'),
    B('fixed_text', 'This agreement is made between Highland Corporate Ltd ("the Supplier") and {{client_name}} ("the Client").'),
    B('heading', 'Services'), B('fixed_text', 'The Supplier provides the Services described in each statement of work signed by both parties.'),
    B('heading', 'Liability'), B('fixed_text', "Each party's total liability under this agreement is capped at the fees paid in the 12 months before the claim."),
    B('heading', 'Payment'), B('fixed_text', 'Invoices are payable within 30 days of the invoice date.'),
    B('heading', 'Governing law'), B('fixed_text', 'This agreement is governed by the laws of Kenya. Disputes go to the courts of Nairobi.'),
    B('signature_block', 'Highland Corporate Ltd'),
  ], [F('client_name', 'Client name')], true);
  for (const who of ['Nordvik Logistics Ltd', 'Brightwater Foods Ltd', 'Savanna Packaging Ltd', 'Lakeside Retail Ltd', 'Tana Freight Ltd'])
    await api(`templates/${msa.tid}/contracts`, 'POST', { counterparty: who, values: { client_name: who } });
  const res = await mk('Reseller agreement', [
    B('heading', 'Parties'), B('fixed_text', 'This agreement is made between Highland Corporate Ltd ("the Supplier") and {{reseller_name}} ("the Reseller").'),
    B('heading', 'Appointment'), B('fixed_text', 'The Supplier appoints the Reseller as its non-exclusive reseller of the Products in the Territory.'),
    B('heading', 'Territory'), B('fixed_text', 'The Territory is {{territory}}.'),
    B('heading', 'Prices and payment'), B('fixed_text', "The Reseller buys at the Supplier's list price less {{discount}} per cent. Invoices are payable within 30 days of the invoice date."),
    B('heading', 'Liability'), B('fixed_text', "Each party's total liability under this agreement is capped at the fees paid in the 12 months before the claim."),
    B('heading', 'Governing law'), B('fixed_text', 'This agreement is governed by the laws of Kenya.'),
    B('signature_block', 'Highland Corporate Ltd'),
  ], [F('reseller_name', 'Reseller name'), F('territory', 'Territory'), F('discount', 'Discount')], false);
  return { msa, res };
}

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* a press that reports a missing part rather than waiting out a timeout */
    const press = sel => page.evaluate(q => { const e = document.querySelector(q); if (!e) return false; e.click(); return true; }, sel);
    const signIn = async () => {
      await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
      await page.keyboard.press('Escape').catch(() => {});
    };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await signIn();
    const ids = await page.evaluate(SEED);
    await page.reload({ waitUntil: 'networkidle' });
    await signIn();
    /* the playbook's verdicts on the drafted contracts: two came back changed */
    const n = await page.evaluate(tid => {
      const V = (cat, st) => ({ category: cat, status: st, quote: '', position: '', redline: '', escalate: false });
      const cs = state.contracts.filter(c => c.libraryTemplateId === tid);
      cs.forEach((c, i) => { c.playbook = { verdicts: i < 2 ? [V('Liability cap', 'deviation'), V('Payment terms', i === 0 ? 'deviation' : 'aligned')] : [V('Liability cap', 'aligned'), V('Payment terms', 'aligned')] }; });
      return cs.length;
    }, ids.msa.tid);
    check('0 five contracts drawn from the master services agreement are on the book', n === 5, n);
    await page.evaluate(() => { setView('templates'); if (typeof tplPageSetTab === 'function') tplPageSetTab('book'); });
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Jambo's panel for the chosen template is the
       Five panel (tplnPanelHtml → jamboOverviewHtml, .jov5), no longer the old .tpl-pf-jl words */
    const JL = '#ins-panel .jl-words.is-ov .jov5';
    /* RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way, owner's pick by prototype): the book is three
       steps — Shelves › a folder's list (or All) › the paper. Every promise below is asked on the step that now carries
       it: the head and its counts on Shelves (1), the index on All with the chosen row lit (2), the chosen paper as its
       own step — its name the head, its facts and verbs beside it (3), its blanks and marks (4), Jambo's panel (5).
       0b moved to where the paper is first drawn. */
    await until(() => document.querySelector('[data-tpl-sec="book"] .tpln5.is-shelves'), null, 12000);
    const MSA = 'company:' + ids.msa.tid, RES = 'company:' + ids.res.tid;
    /* a row: one press chooses, a second opens its paper (a row already chosen opens at once) */
    const openPaper = async key => {
      if (await page.evaluate(() => tplPlace().view) === 'paper') { await press('[data-tpln-back]'); await until(() => tplPlace().view === 'list'); }
      if (await page.evaluate(() => tplPlace().view) === 'shelves') { await press('[data-tpl-sec="book"] [data-tpln-view="list"]'); await until(() => tplPlace().view === 'list'); }
      await press(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${key}"]`);
      if (await until(k => tplPlace().pick === k ? tplPlace().view : null, key) === 'list') await press(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${key}"]`);
      return until(k => tplPlace().view === 'paper' && tplPlace().pick === k && !!document.querySelector('[data-tpl-sec="book"] .tpln5.is-paper .tpl-pf-sheet'), key);
    };

    /* 1 THE HEAD */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick of "the Legora way"):
       the page's three parts are the switch at the head's right, drawn like
       Contracts' List | Wall (.paper-seg), no longer a tab row; each still
       carries its count */
    /* RE-POINTED 17 Nov 2026 (#762): the head's name is .tpln5-h1 with its count beside it (.tpl-hd-n); the switch is
       the filter line's Shelves · All, each with its count */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* the head: Our paper alone (no count, no facts line beside it), Our playbook › and New standard (black) on its right;
       under it ONE ask box and chips Shelves · All with their counts. The three numbers are said ONCE, in the panel under
       All (1b, read below once All is open) */
    const A = await page.evaluate(() => ({ h1: (document.querySelector('.tpln5-h1') || {}).textContent || '', count: !!document.querySelector('.tpln5-hrow .tpl-hd-n, [data-tpl-hd-sub]'),
      std: ((document.querySelector('.tpln5-hrow .tpln5-std') || {}).textContent || '').trim(), neu: (b => b ? [b.textContent.trim(), b.classList.contains('ui-btn-primary')] : null)(document.querySelector('.tpln5-hrow [data-tpln-new]')),
      ask: !!document.querySelector('[data-tpl-sec="book"] label.apn-ask [data-tpln-q]'),
      tabs: [...document.querySelectorAll('[data-tpl-sec="book"] .apn-bar .apn-tab.is-chip[data-tpln-view]')].map(b => b.textContent.trim()) }));
    check('1a the head says the page\'s name alone, Our playbook › and New standard (black) beside it', A.h1.trim() === 'Our paper' && !A.count && A.std === 'Our playbook ›'
      && !!A.neu && A.neu[0] === 'Create a template' && A.neu[1], JSON.stringify(A)); /* RE-POINTED 23 Nov 2026: the owner named it "Create a template" */
    /* RE-POINTED 17 Nov 2026 (the Ladder): Our standards left Our paper; two parts remain, the book and Templates */
    check('1c one ask box, and a count on each of the two chips (Shelves · All)', A.ask && A.tabs.length === 2 && A.tabs.every(t => /\d+$/.test(t)), JSON.stringify(A.tabs));

    /* 2 THE INDEX */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; OUR PAPER, THE LEGORA WAY, owner's pick 14 Nov 2026):
       no shelves — every template is ONE row in one list (.tpln-lrs), the chosen one lit; a row says its name, its
       stream, its first line quoted and its uses; the streams are chips that narrow the list in place (tplnFilter).
       "2 changed" moved to the chosen paper's facts line (3b) and Jambo's "came back changed" tile (5b) */
    /* RE-POINTED 17 Nov 2026 (#762): the one list is the All step; a press there chooses (lit) */
    await press('[data-tpl-sec="book"] [data-tpln-view="list"]');
    await until(() => tplPlace().view === 'list' && !!document.querySelector('.tpln-lrs [data-tpl-pf]'));
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* the three numbers said once: under All, Jambo's panel speaks for the whole book — N templates, and how many of the
       drafts came back changed */
    const A2 = await until(() => { const p = document.getElementById('ins-panel'); const sub = p && p.querySelector('.jov5 .jov5-sub'); if (!sub) return null;
      return { sub: sub.textContent.trim(), ch: ((p.querySelector('.jov5 [data-jov5-sec="changed"]') || {}).textContent || '').replace(/\s+/g, ' ').trim() }; }, null, 6000);
    check('1b the numbers said once, in the panel: N templates · N of N drafts came back changed', !!A2 && /^\d+ templates in \d+ folders\.$/.test(A2.sub) && /\d+ of ([5-9]|\d{2,}) drafts came back changed\./.test(A2.ch), JSON.stringify(A2));
    await press(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${MSA}"]`);
    await until(k => tplPlace().pick === k && document.querySelector('.tpln-lrs .tpln-lr.is-on'), MSA);
    /* a company paper's first line is read in the background (tplnQuotesFill), bounded */
    await until(k => !!document.querySelector(`.tpln-lrs [data-tpl-pf="${k}"] .tpln-q`), MSA, 6000);
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* ONE CALM TABLE (.tpln6-table): a row (tr.tpln-lr) is a lettered mark, the name with "§ 1 · " and its opening words,
       Shelf and Kind as soft badges, Drafted from it (a bar and the number), Signed; the chosen row aria-selected */
    const B = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.tpln-lrs tr.tpln-lr[data-tpl-pf]')].map(b => [b.textContent.replace(/\s+/g, ' ').trim(), b.classList.contains('is-on') && b.getAttribute('aria-selected') === 'true', !b.hidden,
      [...b.children].map(td => td.textContent.replace(/\s+/g, ' ').trim())]), table: !!document.querySelector('.tpln5.is-list table.tpln6-table') }));
    const lit = B.rows.filter(r => r[1]);
    check('2a every template one row in one calm table, the chosen one lit, the rest one line each', B.table && B.rows.length >= 14 && lit.length === 1 && /^M Master services agreement/.test(lit[0][0]) && B.rows.every(r => r[2]), JSON.stringify(B.rows.map(r => r[0].slice(0, 40) + (r[1] ? ' *' : ''))));
    const msaRow = B.rows.find(r => /^M Master services agreement/.test(r[0])), resRow = B.rows.find(r => /Reseller agreement/.test(r[0]));
    check('2b a row says its name with its first line quoted (§ 1), its shelf and kind, drafted from it and signed',
      !!msaRow && msaRow[3].length === 5 && /Master services agreement\s*§ 1 · “This agreement is made between Highland Corporate Ltd.*”$/.test(msaRow[3][0]) && msaRow[3][1] === 'Sales' && !!msaRow[3][2] && msaRow[3][3] === '5' && /^\d+$/.test(msaRow[3][4])
      && !!resRow && resRow[3][1] === 'Sales' && resRow[3][3] === '0', JSON.stringify([msaRow && msaRow[3], resRow && resRow[3]]));
    const shown = () => page.evaluate(() => [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(b => !b.hidden).length);
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* the streams' chips went: "+ Shelf" opens a small menu of the shelves, a shelf chosen opens its own list (the shelves
       then as chips, the chosen one set); Shelves and All bring every row back */
    const salesChip = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-tpl-sec="book"] [data-tpln-shelfchip]')].find(x => /^Sales\b/.test(x.textContent.trim())); if (!b) return null; b.click(); return b.textContent.trim(); });
    const B2 = salesChip ? await until(n => { const k = [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(b => !b.hidden); const set = document.querySelector('[data-tpl-sec="book"] .apn-tab.is-chip.is-shelf.is-on');
      return k.length && k.length < n && set && /^Sales\b/.test(set.textContent.trim()) && k.every(b => /Sales/.test(b.textContent)) ? k.length : null; }, B.rows.length) : 0;
    /* RE-POINTED 21 Nov 2026 (P-34, as drawn): on a shelf the chips are the shelves alone; the way back is "‹ Our paper" over the name */
    /* RE-POINTED 22 Nov 2026 (P-34 as drawn, PR 881): the page's head — "‹ Our paper" over the shelf's name — stands above
       the book now, not inside its section, so the way back is pressed where it is drawn */
    await press('[data-tpln-back]');
    await until(() => tplPlace().view === 'shelves');
    await press('[data-tpl-sec="book"] [data-tpln-view="list"]');
    const B3 = await until(n => [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(b => !b.hidden).length === n ? n : null, B.rows.length);
    check('2c "+ Shelf" opens a shelf\'s list (its chip set), All brings every row back', !!salesChip && B2 >= 2 && B3 === B.rows.length, `${salesChip} ${B2} → ${B3 || await shown()}`);

    const ready = await openPaper(MSA) && await until(q => document.querySelector('[data-tpl-sec="book"] .tpln5.is-paper .tpl-pf-sheet .tpl-mks') && !!document.querySelector(q), JL, 12000);
    check('0b the book paints its paper, its marks and Jambo\'s panel', !!ready);

    /* 3 THE TEMPLATE'S HEAD */
    /* RE-POINTED 17 Nov 2026 (#762): the chosen paper is a step of its own — its name the step's head (.tpln5-h1); beside
       the paper its facts line (kind · folder · N uses; .tpln5-meta), its figures (made · signed · came back changed;
       .tpln5-facts) and its own verbs, the black one first (tplnPaperHtml, as drawn). The 16 Nov "used 5 times, last
       with <party>" line is not drawn on this step (MAP-HISTORY: "the paper step says 'N uses'") */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ /* the column the Stripe way: shelf and kind as soft badges (.tpln6-badges), four facts as a 2×2 with thin bars (.tpln6-facts .tpln6-fa) */
    const C = await page.evaluate(() => ({ h2: (document.querySelector('.tpln5-h1') || {}).textContent || '', facts: [...document.querySelectorAll('.tpln5.is-paper .tpln6-badges .tpln6-badge')].map(b => b.textContent.trim()),
      figs: [...document.querySelectorAll('.tpln5.is-paper .tpln6-facts > .tpln6-fa')].map(d => d.textContent.replace(/\s+/g, ' ').trim()),
      acts: [...document.querySelectorAll('.tpln5.is-paper [data-tpl-pf-act]')].map(b => [b.textContent.trim(), b.disabled, b.classList.contains('ui-btn-primary')]) }));
    check('3a the chosen paper\'s name heads the step', /^Master services agreement$/.test(C.h2.trim()), C.h2);
    check('3b its shelf (Sales) and kind as badges, and four facts: made 5 · signed · 2 came back changed · blanks',
      C.facts.length === 2 && /^Sales\b/.test(C.facts[0]) && C.figs.length === 4 && C.figs.some(f => /^Made\s*5$/.test(f)) && C.figs.some(f => /came back changed\s*2$/i.test(f)), JSON.stringify({ facts: C.facts, figs: C.figs }));
    check('3c the verbs: Draft from it (the primary, first) · Open in the builder', JSON.stringify(C.acts.map(a => a[0])) === JSON.stringify(['Draft from it', 'Open in the builder']) && C.acts[0][2] === true && !C.acts[0][1], JSON.stringify(C.acts));

    /* 4 THE PAPER */
    const D = await page.evaluate(() => { const sh = document.querySelector('[data-tpl-sec="book"] .tpl-pf-sheet');
      const mks = [...sh.querySelectorAll('.tpl-mks')];
      return { inputs: sh.querySelectorAll('input,select,textarea').length, blanks: [...sh.querySelectorAll('.tpl-pf-blank, .hati-field')].map(b => b.textContent.trim()),
        marks: mks.map(m => m.textContent.replace(/\s+/g, ' ').trim()), notWording: mks.length > 0 && mks.every(m => m.hasAttribute('data-not-wording') && getComputedStyle(m).userSelect === 'none'),
        under: mks.map(m => { let p = m.previousElementSibling; while (p && !/^H[1-6]$/.test(p.tagName) && !p.querySelector('h1,h2,h3,h4')) p = p.previousElementSibling; return p ? p.textContent.trim() : ''; }) }; });
    check('4a the blanks read as blanks — no form box on the template\'s paper', D.inputs === 0 && D.blanks.includes('Client name'), JSON.stringify(D.blanks));
    check('4b marks under the clause: "✓ Liability cap at 12 months fees" and "Came back changed 2 times" under Liability; "Came back changed once" under Payment',
      /* RE-POINTED 21 Nov 2026 (P-34, as drawn): a met position reads "<what it holds> · our position" */
      D.marks.some(m => /Liability cap at 12 months fees(?:\s*· our position)?\s*Came back changed 2 times/.test(m)) && D.marks.some(m => /Payment within 30 days(?:\s*· our position)?\s*Came back changed once/.test(m)), JSON.stringify(D.marks));
    check('4c a mark is never wording (data-not-wording, not selectable)', D.notWording, '');

    /* 5 JAMBO'S PANEL */
    const E = await page.evaluate(() => { const p = document.getElementById('ins-panel');
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', back: !!(p.querySelector('[data-jl-back]') && !p.querySelector('[data-jl-back]').hidden),
        /* RE-POINTED 16 Nov 2026 (#762): his words are the Five panel's parts — title, sub, tiles, groups, the act */
        title: (p.querySelector('.jov5 .jov5-title') || {}).textContent || '', sub: (p.querySelector('.jov5 .jov5-sub') || {}).textContent || '',
        tiles: [...p.querySelectorAll('.jov5 .jov5-g')].map(g => [g.textContent.replace(/\s+/g, ' ').trim(), g.tagName === 'BUTTON']),
        /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ labels: [...p.querySelectorAll('.jov5 .jov5-sec .jov5-label')].map(l => l.textContent.trim()), foot: ((p.querySelector('.jov5 [data-jov5-sec="latest"] .tpln6-all') || {}).textContent || '').trim(),
        /* RE-POINTED 21 Nov 2026 (P-34, as drawn): the latest drafted are plain lines with a state badge (.tpln6-dr), "All N ›" a link (.tpln6-all) */
        latest: p.querySelectorAll('.jov5 [data-jov5-sec="latest"] .tpln6-dr').length,
        groups: [...p.querySelectorAll('.jov5 .jov5-sec')].map(g => g.textContent.replace(/\s+/g, ' ').trim()),
        say: (p.querySelector('.jov5 .jov5-act .jov5-say') || {}).textContent || '', go: (p.querySelector('.jov5 .jov5-act .jov5-go') || {}).textContent || '',
        link: (p.querySelector('.jov5 .jov5-act .jov5-acts > :not(.jov5-go)') || {}).textContent || '', ph: (p.querySelector('#jl-q') || {}).placeholder || '', th: (typeof teachHintOn === 'function' && teachHintOn()) ? i18t('teach_hint_ph') : null, hints: p.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length,
        fixed: getComputedStyle(p).position, right: (d => d >= 0 && d <= 9)(innerWidth - Math.round(p.getBoundingClientRect().right)) }; });
    /* RE-POINTED 24 Oct 2026 (Round 2, owner's yes): no "‹ Overview" beside the Overview tab; the tab is the way back */
    /* RE-POINTED 25 Oct 2026 (owner: "this page does not need an overview page"): ONE Jambo window —
       no name tab and no Overview tab; the template is named in his words under the greeting */
    const E0 = await page.evaluate(() => { const p = document.getElementById('ins-panel'); const vis = el => !!el && !el.hidden && el.getBoundingClientRect().width > 0;
      return { solo: p.classList.contains('is-solo'), word: vis(p.querySelector('[data-jl-word]')), home: vis(p.querySelector('[data-jl-home]')), hello: !!p.querySelector('[data-jl-greet] [data-jb-hello]'), landHello: !!p.querySelector('.jl-body [data-jb-hello]') }; });
    /* RE-POINTED 26 Oct 2026 (owner: "we will have an overview tab side panel in each page followed by the jambo tab",
       answered "Yes, every page"; REVERSES the 25 Oct "this page does not need an overview page"): the template is
       named under the Overview tab, his greeting the Jambo tab's; still no name tab and no back button */
    /* RE-POINTED 22 Nov 2026 (P-34, Our paper as drawn, PR 881): the panel draws no head row — the paper's own card (slot
       "tpln") is the panel, so no Overview tab is drawn; the rest stands: no greeting on it, no name word, no back button */
    /* RE-POINTED 22 Nov 2026 (owner: "ensure all the jambo panels do have the minimize button"): the head row stands for the
       minimise arrow ALONE — still no Overview tab, no name word, no back button */
    E0.head = await page.evaluate(() => { const h = document.querySelector('#ins-panel .jl-head'), f = document.querySelector('#ins-panel .jov5[data-jov-slot="tpln"]');
      const shown = h ? [...h.children].filter(x => x.getBoundingClientRect().width > 0) : [];
      return { drawn: shown.some(x => !x.matches('.jl-fold, .jl-sp')), arrow: shown.some(x => x.matches('.jl-fold')), own: !!f && f.getClientRects().length > 0 }; });
    check('5a the panel as drawn: the template\'s own card, a head row holding only the minimise arrow, no greeting there, no name tab, no back button', !E0.solo && !E0.word && !E0.home && !E0.head.drawn && E0.head.arrow && E0.head.own && !E.back
      && !E0.landHello, JSON.stringify({ ...E0, b: E.back }));
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; JAMBO'S PANELS — THE FIVE PARTS): his words from the
       record are the panel's title, sub and tiles (made 5 · signed · 2 came back changed, the last a door) and the
       group of what came back changed by clause kind (Liability cap 2 times, Payment terms 1 time). "It meets N of Our
       standards" is no longer said on this panel (the Standards shelf counts them) — RETIRED that clause only */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* on the paper's own step the panel carries what the page's column does not: no tiles, no "Made N" (said in the
       column), the latest agreements drafted from it with "All 5 ›" (and, where our playbook is read on it, what this
       paper holds). RETIRED: the group "came back changed by clause kind" (Liability cap twice, Payment terms once) — no
       panel draws it now; the paper's own marks say it under each clause (4b) */
    /* RE-POINTED 21 Nov 2026 (P-34, as drawn): the panel is titled "What this paper holds" with its one-line sub (the paper's name heads the page) */
    check('5b his words, from the record: What this paper holds, no tiles, the latest drafted from it and All 5 ›',
      E.title.trim() === 'What this paper holds' && /^Our playbook’s positions, already written in, and the agreements drafted from it\.$/.test(E.sub.trim()) && E.tiles.length === 0 && E.labels.includes('Latest drafted from it') && E.latest === 3 && /^All 5 ›$/.test(E.foot),
      JSON.stringify({ t: E.title, s: E.sub, tiles: E.tiles, labels: E.labels, latest: E.latest, foot: E.foot }));
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ /* the verbs stand once, in the page's column beside the paper (3c): the panel draws no second Draft from it */
    check('5c the next step is the column\'s: the panel on the paper draws no second Draft from it', !E.go.trim(), JSON.stringify({ say: E.say, go: E.go, link: E.link }));
    /* RE-POINTED 21 Oct 2026 (Chambers, owner's pick 20 Oct 2026): no hint line under any Jambo box */
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): Jambo's panel FLOATS, a white card 8px in from the window's edge, its top and its foot (the owner's drawing) */
    /* RE-POINTED 22 Nov 2026 (owner: "make them honest labels but jambo should have the ability to answer those questions"): the
       page's example question moved from the top box into Jambo's box at the panel's foot */
    /* RE-POINTED 23 Nov 2026 (Jambo the instructor, f1189: a newcomer's box carries the "I'm new" hint until they say, teachPh/jlPagePh) */
    check('5d the ask box at the panel\'s foot with the page\'s question (or the newcomer\'s hint), no hint line under it; the panel 8px in from the window\'s edge', E.ph === (E.th || 'Ask Jambo: “which paper for a new supplier?”') && E.hints === 0 && E.right, JSON.stringify({ ph: E.ph, hints: E.hints, right: E.right }));
    await press('#ins-panel [data-jl-home]');
    const E2 = await until(() => { const p = document.getElementById('ins-panel'); return p && ![...p.querySelectorAll('.jov5-title')].some(t => /Master services agreement/.test(t.textContent)) && p.querySelector('[data-jl-words]') ? p.querySelector('[data-jl-words]').textContent.replace(/\s+/g, ' ').trim() : null; });
    check('5e ‹ Jambo lets the template go: his words say the book', !!E2 && /Our paper holds \d+ templates/.test(E2) && /contracts were drafted from them in 12 months; 2 came back changed/.test(E2), E2);
    /* RE-POINTED 17 Nov 2026 (#762): the template is pressed where its row stands now — the list, one step back */
    await press('[data-tpln-back]');
    await until(() => tplPlace().view === 'list' && !!document.querySelector('.tpln-lrs [data-tpl-pf]'));
    /* RE-POINTED 21 Nov 2026 (THE LIST: a press CHOOSES, a second OPENS): back from its paper the template is still the
       chosen row, so the list's panel already speaks for it — a press here would be the second, and open the paper */
    const E3 = await until(q => [...document.querySelectorAll(q + ' .jov5-title')].some(t => t.textContent.trim() === 'Master services agreement'), JL);
    check('5f back in the list, the template is still held', !!E3);
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* chosen in the list, the panel speaks for the paper: its badges, "Made 5 agreements · 2 came back changed", what
       happened to its drafts as three bars (Drafted · Signed · Came back changed, the last a door), Draft from it black
       with Open the paper beside it; no tiles */
    const E4 = await until(q => { const p = document.querySelector(q); if (!p) return null; const t = p.querySelector('.jov5-title'); if (!t || t.textContent.trim() !== 'Master services agreement') return null;
      return { sub: ((p.querySelector('.jov5-sub') || {}).textContent || '').trim(), tiles: p.querySelectorAll('.jov5-g, .jov5-glance').length,
        /* RE-POINTED 21 Nov 2026 (P-34, as drawn): the three bars are the funnel's rows (.tpln6-fun .tpln6-fr), the first "Drafted from it" */
        bars: [...p.querySelectorAll('.tpln6-fun .tpln6-fr')].map(b => [b.textContent.replace(/\s+/g, ' ').trim(), b.hasAttribute('data-tpln-changed')]),
        go: ((p.querySelector('.jov5-act .jov5-go') || {}).textContent || '').trim(), link: ((p.querySelector('.jov5-act .jov5-acts > :not(.jov5-go)') || {}).textContent || '').trim() }; }, JL);
    check('5g in the list, the panel: Made 5 · 2 came back changed, three bars (the last a door), Draft from it with Open the paper', !!E4 && /^Made 5 agreements · 2 came back changed$/.test(E4.sub) && !E4.tiles
      && E4.bars.length === 3 && /^Drafted from it\s*5$/.test(E4.bars[0][0]) && /^Came back changed\s*2$/.test(E4.bars[2][0]) && E4.bars[2][1] && E4.go === 'Draft from it' && E4.link === 'Open the paper', JSON.stringify(E4));

    /* 6 DOORS LAND */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the old panel's chip "where it came back changed"
       (which lit the mark on the paper) is gone; its door is Jambo's "came back changed" tile, which opens the Contracts
       list narrowed to the contracts it counts (the same door as the mark, 6b) */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ /* the "came back changed" tile is the panel's bar of that name, a door ([data-tpln-changed]) */
    /* RE-POINTED 21 Nov 2026 (P-34, as drawn): the bar is a funnel row (.tpln6-fr) */
    await page.evaluate(q => { const b = [...document.querySelectorAll(q + ' button.tpln6-fr[data-tpln-changed]')].find(x => /came back changed/i.test(x.textContent)); if (b) b.click(); }, JL);
    const F1 = await until(() => { if (state.view !== 'register' && state.view !== 'dashboard' && state.view !== 'counter') return null;
      const only = state.reg && state.reg.only; return only && Array.isArray(only.ids) ? only.ids.slice().sort().join(',') : null; }, null, 8000);
    check('6a Jambo\'s "came back changed" bar opens the Contracts list narrowed to the two contracts it counts', !!F1 && F1.split(',').length === 2, F1);
    await page.evaluate(() => { if (state.reg) state.reg.only = null; setView('templates'); tplPageSetTab('book'); });
    /* RE-POINTED 21 Nov 2026: the book comes back on the list step (5f no longer opens the paper); the marks are the
       paper's, so the paper is opened as a person does — the chosen row pressed again */
    await until(() => !!document.querySelector('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf], [data-tpl-sec="book"] .tpln5.is-paper'));
    await openPaper(MSA);
    await until(() => !!document.querySelector('.tpl-mk.is-changed'));
    await press('.tpl-mk.is-changed');
    const F2 = await until(() => { if (state.view !== 'register' && state.view !== 'dashboard' && state.view !== 'counter') return null;
      const only = state.reg && state.reg.only; return only && Array.isArray(only.ids) ? only.ids.slice().sort().join(',') : null; }, null, 8000);
    check('6b the mark opens the Contracts list narrowed to the two contracts it counts', !!F2 && F2.split(',').length === 2, F2);
    await page.evaluate(() => { setView('templates'); tplPageSetTab('book'); });
    await until(() => !!document.querySelector('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf], [data-tpl-sec="book"] .tpln5.is-paper'));
    if (!(await page.evaluate(() => !!document.querySelector('[data-tpl-pf-act]')))) await openPaper(MSA);
    await until(() => !!document.querySelector('[data-tpl-pf-act]'));
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-tpl-pf-act]')].find(x => x.textContent.trim() === 'Draft from it'); if (b) b.click(); });
    const F3 = await until(() => { const on = document.querySelector('.na-pick.on'); return on ? on.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('6c Draft from it opens the ONE New agreement form with the template chosen', !!F3 && /Master services agreement/.test(F3), F3);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.evaluate(() => { setView('templates'); tplPageSetTab('book'); });
    /* RE-POINTED 17 Nov 2026 (#762): the draft's verbs are read on its own paper's step */
    await openPaper(RES);
    const F4 = await until(() => { const b = [...document.querySelectorAll('.tpln5.is-paper [data-tpl-pf-act]')].find(x => x.textContent.trim() === 'Draft from it'); return b ? { off: b.disabled, why: b.title } : null; });
    check('6d on a draft, Draft from it is greyed with its reason', !!F4 && F4.off && /publish it first/i.test(F4.why), JSON.stringify(F4));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'our-paper-book-1440x780.png') });

    /* 7 THE BUILDER */
    try { await page.evaluate(() => localStorage.removeItem('hati.v1.tbSkipped')); } catch (_) {}
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), ids.res);
    await until(() => document.querySelector('#tb-rail .tb-olt'));   /* RE-POINTED 23 Nov 2026 (the Builder L+S): the Outline is one calm table */
    const G = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right) }; };
      const strip = document.querySelector('.tb-strip'); const rail = document.getElementById('tb-rail');
      return { strip: r(strip), stripMin: parseFloat(getComputedStyle(strip).minHeight) || 0, stripBg: getComputedStyle(strip).backgroundColor, head: strip.textContent.replace(/\s+/g, ' ').trim(),
        rail: r(rail), tabs: [...rail.querySelectorAll('[data-tb-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), on: (rail.querySelector('[data-tb-tab].is-on') || {}).textContent || '',
        word: (rail.querySelector('.jl-word') || {}).textContent || '', ol: [...rail.querySelectorAll('.tb-olt tr[data-tb-ol], .tb-olt tr[data-tb-ol-prop]')].map(b => [...b.children].map(x => x.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).join(' ')),
        line: ((rail.querySelector('.tb-ol-line') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
        ph: (document.getElementById('tb-ask') || {}).placeholder || '', hints: rail.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length, send: (() => { const b = rail.querySelector('[data-tb-send]'); return b ? b.getAttribute('aria-label') || '' : ''; })() }; });  /* RE-POINTED 20 Oct 2026 (Two-row card): the round send says Ask to a screen reader and on its hover */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the head is the page's white band, as tall as Jambo's
       panel head (min-height var(--rail-head-h), 58px) — one line means it never grows past that */
    /* RE-POINTED 23 Nov 2026 (the Builder L+S, as drawn): "Draft · v1" a badge, More ▾ before Save draft (never published) */
    check('7a the head card is one line: name · Draft · v1 · Category · Stream · More · Save draft · Publish v1',
      G.stripMin > 0 && G.strip.h <= G.stripMin + 1 && /Reseller agreement\s*Draft · v1\s*Category\s*\S+.*Stream.*More\s*Save draft\s*Publish v1/.test(G.head), JSON.stringify({ h: G.strip.h, min: G.stripMin, head: G.head }));
    /* RE-POINTED 25 Oct 2026 (the builder works like the clause editor; item 12, the panel floats 8px in as every panel does): the head is his tab and the four tabs, no page word */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the panel stands edge to edge — flush with the
       window's right edge, no longer floating 8px in */
    check('7b Jambo\'s panel at the window\'s edge, his tab and the four tabs in its head, no page word', G.rail.r === 1440 && G.word === '', JSON.stringify({ ...G.rail, word: G.word }));
    check('7c tabs Build · Outline · Playbook n/m · Blanks 3, opening on the Outline',
      G.tabs.length === 4 && G.tabs[0] === 'Build' && /^Outline ?\d+$/.test(G.tabs[1]) && /^Playbook ?\d+ of \d+$/.test(G.tabs[2]) && /^Blanks ?3$/.test(G.tabs[3]) && /^Outline/.test(G.on), JSON.stringify(G.tabs)); /* RE-POINTED 23 Nov 2026: tabs carry their counts, "n of m" */
    /* RE-POINTED 23 Nov 2026 (the Builder L+S, as drawn): § · name · a soft status badge; "+ … proposed" where the paper draws it */
    check('7d the Outline: "· Parties <status>", numbered sections with a status badge, "+ … proposed"',
      /^· Parties(?:“.*”)? (Written|To write)$/.test(G.ol[0] || '') && G.ol.some(r => /^2 Territory(?:“.*”)? (Written|To write)$/.test(r)) && G.ol.some(r => /^\+ .+ proposed$/.test(r)), JSON.stringify(G.ol));
    check('7e Blanks and the playbook said in one line under it', /^Blanks 3 asked ?Playbook \d+ of \d+ met$/.test(G.line), JSON.stringify(G.line));
    /* RE-POINTED 21 Oct 2026 (Chambers, owner's pick 20 Oct 2026): no hint line under any Jambo box */
    check('7f the ask box as drawn, no hint line under it', G.ph === 'Ask Jambo, or type / for a place' && /^Ask/.test(G.send) && G.hints === 0, JSON.stringify({ ph: G.ph, send: G.send, hints: G.hints }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'our-paper-builder-1440x780.png') });

    /* 8 PROPOSALS AND MARKS ON THE PAPER */
    const P = await page.evaluate(() => ({ props: [...document.querySelectorAll('#tb-paper .tb-prop')].map(p => [p.getAttribute('data-tb-prop'), p.textContent.replace(/\s+/g, ' ').trim(), p.hasAttribute('data-not-wording'), p.getAttribute('contenteditable')]),
      marks: [...document.querySelectorAll('#tb-paper .tpl-mks')].map(m => m.textContent.replace(/\s+/g, ' ').trim()) }));
    check('8a Jambo proposes on the paper: "Jambo proposes · <standard>", Add · Skip, "Our standard: …"; never wording',
      P.props.length >= 1 && P.props.every(p => /^Jambo proposes · .+ Add Skip Our position: .+\.$/.test(p[1]) && p[2] && p[3] === 'false'), JSON.stringify(P.props));
    check('8b marks under the sections that meet a standard', P.marks.some(m => /Payment within 30 days/.test(m)) && P.marks.some(m => /Liability cap at 12 months fees/.test(m)), JSON.stringify(P.marks));
    const cat = P.props[0] && P.props[0][0];
    const before = await page.evaluate(() => document.querySelectorAll('#tb-paper [data-tb-row]').length);
    await press(`[data-tb-prop-skip="${cat}"]`);
    /* RE-POINTED (check #1, 19 Oct 2026): a skip is kept ON THE TEMPLATE, on
       the server, so another computer is not offered it again */
    await until(c => !document.querySelector(`[data-tb-prop="${c}"]`), cat);
    const S = await until(async a => { const r = await api('templates/' + a.tid); return (r.template.skippedStandards || []).includes(a.cat) ? r.template.skippedStandards : null; }, { tid: ids.res.tid, cat });
    check('8c Skip takes the proposal away for this template, kept on the template (the server)', !!S && !(await page.evaluate(() => localStorage.getItem('hati.v1.tbSkipped'))) && !(await page.evaluate(c => [...document.querySelectorAll('.tb-olt tr.is-prop')].some(r => r.textContent.includes(c)), cat)), JSON.stringify(S));
    await page.evaluate(a => api('templates/' + a.tid + '/skipped', 'PUT', { category: a.cat, undo: true }), { tid: ids.res.tid, cat });
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), ids.res);
    await until(() => document.querySelector(`#tb-paper [data-tb-prop-add]`));
    await press('#tb-paper [data-tb-prop-add]');
    const AD = await until(c => { const heads = [...document.querySelectorAll('#tb-paper .tb-hed')].map(h => h.textContent.trim()); return heads.includes(c) ? { n: document.querySelectorAll('#tb-paper [data-tb-row]').length, heads } : null; }, cat);
    check('8d Add puts our standard\'s heading and wording in (the one push)', !!AD && AD.n === before + 2, JSON.stringify(AD));
    check('8e Add puts it where the proposal stood — before Governing law, as drawn', !!AD && AD.heads.indexOf(cat) >= 0 && AD.heads.indexOf('Governing law') > AD.heads.indexOf(cat), JSON.stringify(AD && AD.heads));

    /* 9 OUTLINE ROWS, ‹ JAMBO, FOLD */
    await press('#tb-rail [data-tb-tab="outline"]');
    await until(() => !!document.querySelector('[data-tb-ol]'));
    const k = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-tb-ol]')].find(x => /Territory/.test(x.textContent)); return r ? r.getAttribute('data-tb-ol') : null; });
    await press(`[data-tb-ol="${k}"]`);
    const L = await until(kk => { const s = document.querySelector(`[data-tb-sec="${kk}"]`); return s && s.classList.contains('is-landed') ? { on: (document.querySelector('[data-tb-tab].is-on') || {}).textContent, sel: (document.querySelector('#tb-rail .tb-olt tr.is-sel') || {}).textContent } : null; }, k);
    check('9a an Outline row lands on its section (lit), the Outline stays open with the row lit', !!L && /^Outline/.test(L.on || '') && /Territory/.test(L.sel || ''), JSON.stringify(L));
    await press('#tb-rail .pd-back[data-tb-jambo]');
    const J = await until(() => { const on = document.querySelector('[data-tb-tab].is-on'); return on && on.textContent.trim() === 'Build' && !document.querySelector('#tb-paper .tb-sec.is-on') ? true : null; });
    check('9b ‹ Jambo is Build with nothing in hand', !!J);
    await press('#tb-rail [data-tb-fold]');
    const FO = await until(() => { const r = document.getElementById('tb-rail'); return r && r.classList.contains('is-folded') ? Math.round(r.getBoundingClientRect().width) : null; });
    await press('#tb-rail [data-tb-door]');
    const UN = await until(() => { const r = document.getElementById('tb-rail'); return r && !r.classList.contains('is-folded') ? Math.round(r.getBoundingClientRect().width) : null; });
    check('9c › folds the panel to a strip at the edge; its strip opens it', FO != null && FO <= 48 && UN > 300, `${FO} → ${UN}`);

    /* 10 THE OWNER'S THREE SCREENS */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      const T = await page.evaluate(() => { const strip = document.querySelector('.tb-strip'), rail = document.getElementById('tb-rail'), paper = document.getElementById('tb-paper');
        const a = strip.getBoundingClientRect(), r = rail.getBoundingClientRect(), p = paper.getBoundingClientRect();
        /* RE-POINTED 16 Nov 2026 (#762): one line = no taller than its own one-line height; the panel edge to edge */
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, oneLine: a.height <= (parseFloat(getComputedStyle(strip).minHeight) || 46) + 1, beside: p.right <= r.left + 1 && a.right <= r.left + 1, edge: Math.round(r.right) === innerWidth, bottom: Math.round(r.bottom) === innerHeight }; });
      check(`10 ${w}×${ht} the builder: head on one line, paper and panel side by side, the panel at the window's edge and foot, nothing sideways`, T.side && T.oneLine && T.beside && T.edge && T.bottom, JSON.stringify(T));
      if (OUT) await page.screenshot({ path: path.join(OUT, `our-paper-builder-${w}x${ht}.png`) });
    }
    await page.evaluate(() => { tbLeave(() => { setView('templates'); tplPageSetTab('book'); }); });
    await until(q => !!document.querySelector(q), JL);
    await openPaper(MSA);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; the Legora way): the paper (.tpln-sheet), the list
         with the chosen paper's head and verbs (.tpln-side) and Jambo's panel stand side by side */
      /* RE-POINTED 17 Nov 2026 (#762): on the paper's own step — the paper, its facts and verbs (.tpln5-side) and
         Jambo's panel side by side */
      const T = await page.evaluate(() => { const q = s => document.querySelector(s), R = e => e ? e.getBoundingClientRect() : null;
        const parts = [R(q('.tpln5.is-paper .tpln-sheet')), R(q('.tpln5.is-paper .tpln5-side')), R(document.getElementById('ins-panel'))], acts = R(q('.tpln5.is-paper .tpln-acts')), side = parts[1];
        if (parts.some(x => !x) || !acts) return { missing: parts.map(x => !!x).concat(!!acts) };
        const lr = parts.slice().sort((a, b) => a.left - b.left);
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, beside: lr.every((x, i) => i === 0 || lr[i - 1].right <= x.left + 1),
          acts: acts.right <= side.right + 1 && acts.left >= side.left - 1, inView: parts[0].bottom <= innerHeight + 1 && parts[0].top < innerHeight }; });
      check(`10 ${w}×${ht} the book: paper, its facts and verbs, and Jambo's panel side by side, nothing sideways`, T.side && T.beside && T.acts && T.inView, JSON.stringify(T));
      if (OUT) await page.screenshot({ path: path.join(OUT, `our-paper-book-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
