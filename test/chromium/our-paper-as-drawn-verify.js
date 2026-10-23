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
    const ready = await until(() => document.querySelector('[data-tpl-sec="book"] .tpl-pf-sheet .tpl-mks') && !!document.querySelector('#ins-panel .tpl-pf-jl'), null, 12000);
    check('0b the book paints its paper, its marks and Jambo\'s panel', !!ready);

    /* 1 THE HEAD */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick of "the Legora way"):
       the page's three parts are the switch at the head's right, drawn like
       Contracts' List | Wall (.paper-seg), no longer a tab row; each still
       carries its count */
    const A = await page.evaluate(() => ({ h1: (document.querySelector('.tpl-hd-row h1') || {}).textContent || '', sub: (document.querySelector('[data-tpl-hd-sub]') || {}).textContent || '',
      tabs: [...document.querySelectorAll('.tpl-band .paper-seg button')].map(b => b.textContent.trim()) }));
    check('1a the head says the page\'s name with its count', /^Our paper\s*\d+ templates$/.test(A.h1.trim()), A.h1);
    check('1b one facts line: contracts drafted in 12 months · came back changed', /^\d+ contracts? drafted from them in 12 months · \d+ came back changed$/.test(A.sub.trim()) && /^5 |^[5-9]|^\d{2}/.test(A.sub.trim()), A.sub);
    check('1c a count on each of the three tabs', A.tabs.length === 3 && A.tabs.every(t => /\d+$/.test(t)), JSON.stringify(A.tabs));

    /* 2 THE INDEX */
    const B = await page.evaluate(() => ({ shelves: [...document.querySelectorAll('[data-tpl-pf-shelf]')].map(b => [b.textContent.trim(), b.getAttribute('aria-expanded')]),
      rows: [...document.querySelectorAll('[data-tpl-pf]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }));
    check('2a the chosen template\'s shelf is open, the others one line each', B.shelves.length >= 2 && B.shelves[0][1] === 'true' && B.shelves.slice(1).every(s => s[1] === 'false')
      && B.rows.length === 2, JSON.stringify(B.shelves));
    check('2b a row says its version, how often used in 12 months and its stream; "2 changed" and "draft" ride beside',
      B.rows.some(r => /Master services agreement\s*v1 · used 5 · Sales\s*2 changed/.test(r)) && B.rows.some(r => /Reseller agreement\s*v1 draft · used 0 · Sales\s*draft/.test(r)), JSON.stringify(B.rows));
    await press('[data-tpl-pf-shelf="builtin"]');
    const B2 = await until(() => { const s = document.querySelector('[data-tpl-pf-shelf="builtin"]'); return s && s.getAttribute('aria-expanded') === 'true' ? document.querySelectorAll('[data-tpl-pf]').length : 0; });
    await press('[data-tpl-pf-shelf="builtin"]');
    const B3 = await until(() => { const s = document.querySelector('[data-tpl-pf-shelf="builtin"]'); return s && s.getAttribute('aria-expanded') === 'false' ? document.querySelectorAll('[data-tpl-pf]').length : 0; });
    check('2c a shelf\'s line opens it, pressed again it folds', B2 >= 12 && B3 === 2, `${B2} → ${B3}`);

    /* 3 THE TEMPLATE'S HEAD */
    const C = await page.evaluate(() => ({ h2: (document.querySelector('.tpl-pf-hl h2') || {}).textContent || '', facts: (document.querySelector('.tpl-pf-hl p') || {}).textContent || '',
      acts: [...document.querySelectorAll('[data-tpl-pf-act]')].map(b => [b.textContent.trim(), b.disabled, b.classList.contains('ui-btn-primary')]) }));
    check('3a name and version pill', /^Master services agreement\s*v1$/.test(C.h2.trim()), C.h2);
    check('3b "Company standard · Sales · used 5 times in 12 months · 2 came back changed · updated <day> by <name>"',
      /^Company standard · Sales · used 5 times in 12 months · 2 came back changed · updated \d{1,2} \w+ by \w+$/.test(C.facts.trim()), C.facts);
    check('3c the verbs: Open in the builder · Draft from it (the primary)', JSON.stringify(C.acts.map(a => a[0])) === JSON.stringify(['Open in the builder', 'Draft from it']) && C.acts[1][2] === true && !C.acts[1][1], JSON.stringify(C.acts));

    /* 4 THE PAPER */
    const D = await page.evaluate(() => { const sh = document.querySelector('[data-tpl-sec="book"] .tpl-pf-sheet');
      const mks = [...sh.querySelectorAll('.tpl-mks')];
      return { inputs: sh.querySelectorAll('input,select,textarea').length, blanks: [...sh.querySelectorAll('.tpl-pf-blank, .hati-field')].map(b => b.textContent.trim()),
        marks: mks.map(m => m.textContent.replace(/\s+/g, ' ').trim()), notWording: mks.length > 0 && mks.every(m => m.hasAttribute('data-not-wording') && getComputedStyle(m).userSelect === 'none'),
        under: mks.map(m => { let p = m.previousElementSibling; while (p && !/^H[1-6]$/.test(p.tagName) && !p.querySelector('h1,h2,h3,h4')) p = p.previousElementSibling; return p ? p.textContent.trim() : ''; }) }; });
    check('4a the blanks read as blanks — no form box on the template\'s paper', D.inputs === 0 && D.blanks.includes('Client name'), JSON.stringify(D.blanks));
    check('4b marks under the clause: "✓ Liability cap at 12 months fees" and "Came back changed 2 times" under Liability; "Came back changed once" under Payment',
      D.marks.some(m => /Liability cap at 12 months fees\s*Came back changed 2 times/.test(m)) && D.marks.some(m => /Payment within 30 days\s*Came back changed once/.test(m)), JSON.stringify(D.marks));
    check('4c a mark is never wording (data-not-wording, not selectable)', D.notWording, '');

    /* 5 JAMBO'S PANEL */
    const E = await page.evaluate(() => { const p = document.getElementById('ins-panel');
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', back: !!(p.querySelector('[data-jl-back]') && !p.querySelector('[data-jl-back]').hidden),
        said: (p.querySelector('.tpl-pf-jl .jl-bub') || {}).textContent || '', chips: [...p.querySelectorAll('[data-tpl-pf-chip]')].map(b => b.textContent.trim()),
        next: (p.querySelector('.jl-next-h') || {}).textContent || '', ph: (p.querySelector('#jl-q') || {}).placeholder || '', hints: p.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length,
        fixed: getComputedStyle(p).position, right: (d => d >= 0 && d <= 9)(innerWidth - Math.round(p.getBoundingClientRect().right)) }; });
    check('5a the head says the template; ‹ Jambo is there', E.word === 'Master services agreement' && E.back, JSON.stringify({ w: E.word, b: E.back }));
    check('5b his words, from the record — nothing spent, with where it came back changed and what it meets',
      /Master services agreement v1, from the record — nothing spent\./.test(E.said) && /Used 5 times in 12 months\. 2 came back changed: clause 2 Liability twice, clause 3 Payment once\. It meets (all \d+|\d+ of (the )?\d+)( of Our standards| standards every contract is read against| standards Our standards set for [^.;]+)[.;]/.test(E.said), E.said);
    check('5c Next steps: open it in the builder · draft a contract from it · where it came back changed', E.next === 'Next steps'
      && JSON.stringify(E.chips) === JSON.stringify(['open it in the builder', 'draft a contract from it', 'where it came back changed']), JSON.stringify(E.chips));
    /* RE-POINTED 21 Oct 2026 (Chambers, owner's pick 20 Oct 2026): no hint line under any Jambo box */
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): Jambo's panel FLOATS, a white card 8px in from the window's edge, its top and its foot (the owner's drawing) */
    check('5d the ask box at the panel\'s foot, no hint line under it; the panel 8px in from the window\'s edge', E.ph === 'Ask for anything, or type /' && E.hints === 0 && E.right, JSON.stringify({ ph: E.ph, hints: E.hints, right: E.right }));
    await press('#ins-panel [data-jl-back]');
    const E2 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.querySelector('.tpl-pf-jl') && p.querySelector('[data-jl-words]') ? p.querySelector('[data-jl-words]').textContent.replace(/\s+/g, ' ').trim() : null; });
    check('5e ‹ Jambo lets the template go: his words say the book', !!E2 && /Our paper holds \d+ templates/.test(E2) && /contracts were drafted from them in 12 months; 2 came back changed/.test(E2), E2);
    await press('[data-tpl-pf="company:' + ids.msa.tid + '"]');
    const E3 = await until(() => !!document.querySelector('#ins-panel .tpl-pf-jl'));
    check('5f a press on the template holds it again', !!E3);

    /* 6 DOORS LAND */
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-tpl-pf-chip]')].find(x => /came back changed/.test(x.textContent)); if (b) b.click(); });
    const F1 = await until(() => { const m = document.querySelector('.tpl-mk.is-changed.is-landed'); return m ? m.textContent.trim() : null; });
    check('6a "where it came back changed" lands on the mark, lit', F1 === 'Came back changed 2 times', F1);
    await press('.tpl-mk.is-changed');
    const F2 = await until(() => { if (state.view !== 'register' && state.view !== 'dashboard' && state.view !== 'counter') return null;
      const only = state.reg && state.reg.only; return only && Array.isArray(only.ids) ? only.ids.slice().sort().join(',') : null; }, null, 8000);
    check('6b the mark opens the Contracts list narrowed to the two contracts it counts', !!F2 && F2.split(',').length === 2, F2);
    await page.evaluate(() => { setView('templates'); tplPageSetTab('book'); });
    await until(() => !!document.querySelector('[data-tpl-pf-act]'));
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-tpl-pf-act]')].find(x => x.textContent.trim() === 'Draft from it'); if (b) b.click(); });
    const F3 = await until(() => { const on = document.querySelector('.na-pick.on'); return on ? on.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('6c Draft from it opens the ONE New agreement form with the template chosen', !!F3 && /Master services agreement/.test(F3), F3);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await page.evaluate(() => { setView('templates'); tplPageSetTab('book'); });
    await press('[data-tpl-pf="company:' + ids.res.tid + '"]');
    const F4 = await until(() => { const b = [...document.querySelectorAll('[data-tpl-pf-act]')].find(x => x.textContent.trim() === 'Draft from it'); return b ? { off: b.disabled, why: b.title } : null; });
    check('6d on a draft, Draft from it is greyed with its reason', !!F4 && F4.off && /publish it first/i.test(F4.why), JSON.stringify(F4));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'our-paper-book-1440x780.png') });

    /* 7 THE BUILDER */
    try { await page.evaluate(() => localStorage.removeItem('hati.v1.tbSkipped')); } catch (_) {}
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), ids.res);
    await until(() => document.querySelector('#tb-rail .tb-ol'));
    const G = await page.evaluate(() => { const r = e => { const b = e.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), r: Math.round(b.right) }; };
      const strip = document.querySelector('.tb-strip'); const rail = document.getElementById('tb-rail');
      return { strip: r(strip), stripBg: getComputedStyle(strip).backgroundColor, head: strip.textContent.replace(/\s+/g, ' ').trim(),
        rail: r(rail), tabs: [...rail.querySelectorAll('[data-tb-tab]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), on: (rail.querySelector('[data-tb-tab].is-on') || {}).textContent || '',
        word: (rail.querySelector('.jl-word') || {}).textContent || '', ol: [...rail.querySelectorAll('.tb-ol-r')].map(b => [...b.children].map(x => x.textContent.trim()).filter(Boolean).join(' ')),
        sh: [...rail.querySelectorAll('.tb-ol-sh')].map(x => x.textContent.trim()), p: [...rail.querySelectorAll('.tb-ol-p')].map(x => x.textContent.trim()),
        ph: (document.getElementById('tb-ask') || {}).placeholder || '', hints: rail.querySelectorAll('.jb-hint, .jb-keys, .jb-kbd').length, send: (() => { const b = rail.querySelector('[data-tb-send]'); return b ? b.getAttribute('aria-label') || '' : ''; })() }; });  /* RE-POINTED 20 Oct 2026 (Two-row card): the round send says Ask to a screen reader and on its hover */
    check('7a the head card is one line: name · v1 draft · Category · Stream · Save draft · Publish v1',
      G.strip.h <= 46 && /Reseller agreement\s*v1 draft\s*Category\s*\S+.*Stream.*Save draft\s*Publish v1/.test(G.head), JSON.stringify({ h: G.strip.h, head: G.head }));
    check('7b Jambo\'s panel at the window\'s edge, "Builder" in its head', G.rail.r === 1440 && G.word === 'Builder', JSON.stringify(G.rail));
    check('7c tabs Build · Outline · Playbook n/m · Blanks 3, opening on the Outline',
      G.tabs.length === 4 && G.tabs[0] === 'Build' && G.tabs[1] === 'Outline' && /^Playbook ?\d+\/\d+$/.test(G.tabs[2]) && /^Blanks ?3$/.test(G.tabs[3]) && G.on === 'Outline', JSON.stringify(G.tabs));
    check('7d the Outline: "· Parties 1 blank", numbered sections, ✓ where a standard is met, "+ … proposed"',
      /^· Parties 1 blank$/.test(G.ol[0] || '') && G.ol.some(r => /^2 Territory 1 blank$/.test(r)) && G.ol.some(r => /^\+ .+ proposed$/.test(r)), JSON.stringify(G.ol));
    check('7e Blanks and Our standards said under it', G.sh[0] === 'Blanks 3' && /Reseller name · Territory · Discount: asked of whoever drafts from it\./.test(G.p[0] || '')
      && /^\d+ of \d+ met\. .+ (is|are) proposed on the paper\.$/.test(G.p[1] || ''), JSON.stringify({ sh: G.sh, p: G.p }));
    /* RE-POINTED 21 Oct 2026 (Chambers, owner's pick 20 Oct 2026): no hint line under any Jambo box */
    check('7f the ask box as drawn, no hint line under it', G.ph === 'Ask for anything, or type /' && /^Ask/.test(G.send) && G.hints === 0, JSON.stringify({ ph: G.ph, send: G.send, hints: G.hints }));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'our-paper-builder-1440x780.png') });

    /* 8 PROPOSALS AND MARKS ON THE PAPER */
    const P = await page.evaluate(() => ({ props: [...document.querySelectorAll('#tb-paper .tb-prop')].map(p => [p.getAttribute('data-tb-prop'), p.textContent.replace(/\s+/g, ' ').trim(), p.hasAttribute('data-not-wording'), p.getAttribute('contenteditable')]),
      marks: [...document.querySelectorAll('#tb-paper .tpl-mks')].map(m => m.textContent.replace(/\s+/g, ' ').trim()) }));
    check('8a Jambo proposes on the paper: "Jambo proposes · <standard>", Add · Skip, "Our standard: …"; never wording',
      P.props.length >= 1 && P.props.every(p => /^Jambo proposes · .+ Add Skip Our standard: .+\.$/.test(p[1]) && p[2] && p[3] === 'false'), JSON.stringify(P.props));
    check('8b marks under the sections that meet a standard', P.marks.some(m => /Payment within 30 days/.test(m)) && P.marks.some(m => /Liability cap at 12 months fees/.test(m)), JSON.stringify(P.marks));
    const cat = P.props[0] && P.props[0][0];
    const before = await page.evaluate(() => document.querySelectorAll('#tb-paper [data-tb-row]').length);
    await press(`[data-tb-prop-skip="${cat}"]`);
    /* RE-POINTED (check #1, 19 Oct 2026): a skip is kept ON THE TEMPLATE, on
       the server, so another computer is not offered it again */
    await until(c => !document.querySelector(`[data-tb-prop="${c}"]`), cat);
    const S = await until(async a => { const r = await api('templates/' + a.tid); return (r.template.skippedStandards || []).includes(a.cat) ? r.template.skippedStandards : null; }, { tid: ids.res.tid, cat });
    check('8c Skip takes the proposal away for this template, kept on the template (the server)', !!S && !(await page.evaluate(() => localStorage.getItem('hati.v1.tbSkipped'))) && !(await page.evaluate(c => [...document.querySelectorAll('.tb-ol-r.is-prop')].some(r => r.textContent.includes(c)), cat)), JSON.stringify(S));
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
    const L = await until(kk => { const s = document.querySelector(`[data-tb-sec="${kk}"]`); return s && s.classList.contains('is-landed') ? { on: (document.querySelector('[data-tb-tab].is-on') || {}).textContent, sel: (document.querySelector('.tb-ol-r.is-sel') || {}).textContent } : null; }, k);
    check('9a an Outline row lands on its section (lit), the Outline stays open with the row lit', !!L && L.on === 'Outline' && /Territory/.test(L.sel || ''), JSON.stringify(L));
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
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, oneLine: a.height <= 46, beside: p.right <= r.left + 1 && a.right <= r.left + 1, edge: Math.round(r.right) === innerWidth, bottom: Math.round(r.bottom) >= innerHeight - 2 }; });
      check(`10 ${w}×${ht} the builder: head on one line, paper and panel side by side, the panel at the edge to the foot, nothing sideways`, T.side && T.oneLine && T.beside && T.edge && T.bottom, JSON.stringify(T));
      if (OUT) await page.screenshot({ path: path.join(OUT, `our-paper-builder-${w}x${ht}.png`) });
    }
    await page.evaluate(() => { tbLeave(() => { setView('templates'); tplPageSetTab('book'); }); });
    await until(() => !!document.querySelector('#ins-panel .tpl-pf-jl'));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      const T = await page.evaluate(() => { const i = document.querySelector('.tpl-pf-idx'), p = document.querySelector('.tpl-pf-paper'), j = document.getElementById('ins-panel');
        const a = i.getBoundingClientRect(), b = p.getBoundingClientRect(), c = j.getBoundingClientRect(), acts = document.querySelector('.tpl-pf-acts').getBoundingClientRect();
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, beside: a.right <= b.left && b.right <= c.left + 1, acts: acts.right <= b.right + 1, inView: b.bottom <= innerHeight + 1 }; });
      check(`10 ${w}×${ht} the book: index, paper and Jambo's panel side by side, the verbs inside the head, nothing sideways`, T.side && T.beside && T.acts && T.inView, JSON.stringify(T));
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
