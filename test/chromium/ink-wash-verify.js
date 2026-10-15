/* ============================================================
   INK WASH AND SENTENCE CASE — HaTi without grey (owner, 9 Oct 2026)
   ============================================================
   docs/WORKORDER-ink-wash-and-sentence-case.md. Light mode's greys become
   ONE ink per brand (black + the theme colour, softened with a pale wash of
   it), and headers and labels stop being set in capitals. On pages AND in
   pop-ups.

   WHAT MUST NOT MOVE, each the owner's own words, is measured against a
   census recorded from the code BEFORE the change (ink-wash-baseline.json):
     · dark mode, exactly as today ("Dark mode should stay as is today")
     · the contract paper ("this should not impact the paper contract")
     · the redline cards' buttons ("do not change the colors of the redline
       cards Buttons")
     · danger buttons and the amber / green / ruby status colours
     · every text size ("exclude the Type Scale from this work")
   A census, not a pixel hash: every element in the scope is asked for its
   resolved colours (or size) and the whole set is tallied — the same method
   theme-tokens-verify uses, for the same reason.

     node test/chromium/ink-wash-verify.js --save   (record, on the code BEFORE)

   RE-RECORDED 10 Oct 2026, OWNER-ASKED ("yes, update the record"): the
   page redesigns after 9 Oct (SAP batches, pop-ups as drawn, the obligations
   table, the History fold) moved the headcounts and a few dark-mode colours.
   Audited first as a set difference against the 9 Oct record: one new 15px
   text on Home; in dark mode a drawn pop-up's danger ground, the dialog foot,
   the table edges on Obligations and Settings, and the accent rule and strokes
   the History and Document redesigns removed. Every Ink Wash claim (ramp, no
   grey, no capitals, status, paper, redline and danger buttons) passed before
   and after. From here the record is today's pages.
   RE-RECORDED 11 Oct 2026, OWNER-ASKED ("yes, update the record"): the "My
   notes" menu door adds a few rows on every page (counts only), and in dark
   mode the Calendar's new layer keys add two swatches (the contract-dates dot
   --st-ruby-dot and Copilot's plan dashed edge --alt). Audited as a set
   difference: 8 new keys, all those swatches; 0 gone. Every Ink Wash claim
   passed before and after.
   RE-RECORDED AGAIN 11 Oct 2026, OWNER-ASKED ("Yes, update it"): the
   Calendar became one card with Copilot beside it (the design). Audited as a
   set difference: only the three calendar screens moved (green-light sizes,
   green-dark and navy-dark colours); every other screen is byte-identical.
   RE-RECORDED 11 Oct 2026 (third), OWNER-ASKED ("Yes, update the record"):
   Your book's six figures became one strip (the new Board design). Audited
   as a set difference: only dark Home's counts moved (five tile grounds and
   edges became the strip's one); 0 keys new, 0 gone; every other screen is
   identical.
   RE-RECORDED 12 Oct 2026, OWNER-ASKED ("Yes, update the record"): Jambo's
   face on his own doors (the top bar's ✦ and Home's Jambo tab became his
   picture). Audited first as a set difference: no colour appeared or vanished
   (the two faces carry data-ink-exempt and no tinted disc); counts moved by
   one element per page (svg + use → img), text sizes by one.
   RE-RECORDED 11 Oct 2026 (fifth), OWNER-ASKED ("yes go ahead with both"):
   the four builds (WORKORDER-four-builds) — the Calendar row left the menu
   (one 13px label and one 11px count fewer on every page), the calendar draws
   on Home's Calendar tab, the zoom stands where A⁻/A⁺ stood. Audited first as a
   set difference: 254 counts moved, NO colour appeared or vanished, light
   mode's colours unchanged (text-size counts only), status colours as before.
   RE-RECORDED 13 Oct 2026 (second), OWNER-ASKED ("revert all the buttons
   back to the previous thin grey outline"): --btn-edge is the hairline again.
   Audited as a set difference: light mode nothing moved; dark mode the
   accent edges (teal / blue) gone from buttons, steppers and switches (6
   keys), the dark rule's count up (38 keys new or moved), nothing else.
   170 of 170 pass after.
   RE-RECORDED 13 Oct 2026 with the owner's asked palette change ("the page
   adjustment buttons on the paper pages need to go back to what it was"):
   the zoom's edge is the grey hairline again and the Overview's card edits
   again. Audited as a set difference first: light mode no colour moved (one
   text-size count on the Overview); dark mode 8 keys new (the Overview's
   restored edit card edge, the zoom's grey edge on Negotiate), 0 gone, moves
   on Overview, Document and Negotiate only. 170 of 170 pass after.
   RE-RECORDED 12 Oct 2026, OWNER-ASKED ("yes, update the record"): after
   #233-#236 (the Details tab as a form, the SAP-way buttons). Audited first as
   a set difference: light mode NO colour new, gone or moved (text-size counts
   only, on every screen); dark mode 26 keys new and 78 gone, all the buttons'
   grey edges and white icons becoming the theme's lighter ink (the SAP way,
   owner picked 12 Oct). 170 of 170 pass after.
   RE-RECORDED 11 Oct 2026 (fourth), OWNER-ASKED ("yes"): the Board as drawn
   (rounds 1-3, owner-approved). Audited as a set difference: only Home moved,
   0 other screens. Light Home: counts only. Dark Home: 2 new (a card edge at
   .12 where it was .10) and 11 gone per brand (the old blocks' teal, amber
   and blue fills and strokes, now one hue squarified; the old agent-icon
   squares' glow grounds; an amber tile edge). Every Ink Wash claim passed
   before and after; the check passes twice running on the new record.
   RE-RECORDED 13 Oct 2026, OWNER-ASKED ("Yes"): Stakes on Home's Clauses
   tab (its head: one sentence, "Read the deal" and its cost line). Audited
   first as a set difference: only the Document screen moved. Light mode: no
   colour new, gone or moved (12px 51→54, 12.5px 64→67). Dark mode: counts
   +1 to +6, and per brand three new keys — the filled button's edge in the
   brand colour (top, bottom, left), a colour the screen already carried as a
   ground. 0 keys gone; every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (second), OWNER-ASKED (the build: "You were also
   supposed to delete breakdown", "This is how the panel should look like but
   with a plain English button", then "merge to main once tests pass"): the
   Breakdown face left Home's pill, and Home's Clauses lost its title row,
   colour filter and the open row's marks. Audited first as a set difference:
   only Home, Calendar and Document moved. Light mode: text-size counts only.
   Dark mode: counts, the filled "Read the deal" button's brand edge GONE (the
   read starts itself now), and the status ruby text NEW on Document — the
   reading's refusal said where the reader looks (this stage's Jambo cannot
   answer). Every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (third), OWNER-ASKED ("Yes, update the record"):
   Home's panel lost its Overview tab, and the company view's summary, ribbon
   and key gave way to three filters. Audited first as a set difference: only
   the Document screen moved, and only in counts (light: 13px 245→243, 10px
   5→4, 15px 5→4; dark: a handful fewer of the same colours). No key new, none
   gone. Every Ink Wash claim passed before and after.
   RE-RECORDED 13 Oct 2026 (fourth), OWNER-ASKED ("Yes, update the record"):
   the Negotiate page lost its Focus button and its Obligations and Risk scan
   squares, and gained Open workspace. Audited first as a set difference: only
   the Negotiate screen moved, and only in counts (light: 13px 269→257; dark:
   fewer of the same colours). No key new, none gone. Every Ink Wash claim
   passed before and after.
   RE-RECORDED 14 Oct 2026, OWNER-ASKED ("Yes, re-record it"): stage 5 of
   the one-page Home plan redrew five screens — Overview (two room tabs),
   Document, Signing (Jambo's Before you sign face beside the signing copy),
   History (the Board's view) and Negotiate (the Redlines face beside Home's
   paper). Audited first as a set difference: only those five moved; nothing
   new in light mode; the values new to the whole record are existing styles
   now seen on these screens — 11.5px (the panel's pill, .pd-pill), the navy
   theme's accent-400 rgb(91,130,207) on Jambo's suggestion chips in dark, and
   the Board's own dark text inks on History. Gone: the Negotiate page's paper
   frame and kicker. Every Ink Wash claim passed before and after.
     node test/chromium/ink-wash-verify.js          (check)
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const BASELINE = path.join(__dirname, 'ink-wash-baseline.json');
const OUT = path.join(__dirname, 'shots', 'ink-wash');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SAVE = process.argv.includes('--save');
const pause = ms => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  ok ? pass++ : fail++;
};

/* THE TABLE IN THE WORK ORDER, as the browser reports it. */
const INK = {
  green: { text: 'rgb(3, 46, 42)', n600: 'rgb(58, 95, 90)', n500: 'rgb(58, 95, 90)', n400: 'rgb(84, 121, 116)',
           n300: 'rgb(190, 214, 209)', n200: 'rgb(220, 233, 230)', n100: 'rgb(240, 245, 244)', bg: 'rgb(244, 248, 247)' },
  navy:  { text: 'rgb(9, 25, 56)', n600: 'rgb(55, 74, 109)', n500: 'rgb(55, 74, 109)', n400: 'rgb(80, 100, 138)',
           n300: 'rgb(186, 200, 228)', n200: 'rgb(218, 226, 241)', n100: 'rgb(238, 242, 249)', bg: 'rgb(243, 246, 251)' },
};

/* ---------- the probes, run in the page ---------- */
const CENSUS = ([sel, props]) => {
  const out = {};
  const els = [];
  for (const root of document.querySelectorAll(sel)) { els.push(root, ...root.querySelectorAll('*')); }
  for (const el of new Set(els)) {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    for (const p of props) { const v = s[p]; if (!v || v === 'none') continue;
      const k = p + ' ' + v; out[k] = (out[k] || 0) + 1; }
  }
  return out;
};
/* A colour is GREY when it is opaque enough to be seen as itself, is neither
   white nor near-black, and carries almost no hue (HSL saturation under 12%).
   Today's ramp measures 4–9%; every Ink Wash value measures 17% or more. */
const GREYS = () => {
  const parse = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const n = m[1].split(/[,\s\/]+/).filter(Boolean).map(Number); return [n[0], n[1], n[2], n.length > 3 ? n[3] : 1]; };
  const grey = c => { if (!c || c[3] < .5) return false;
    const mx = Math.max(c[0], c[1], c[2]) / 255, mn = Math.min(c[0], c[1], c[2]) / 255, l = (mx + mn) / 2;
    if (l < .06 || l > .975) return false;
    const sat = mx === mn ? 0 : (l > .5 ? (mx - mn) / (2 - mx - mn) : (mx - mn) / (mx + mn));
    return sat < .12; };
  const hits = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.pg-sheet, #ig-canvas.rl-paper, svg, script, style, #theme-menu, [data-brand-pick], .hati-ref, .rl-card button, .rl-unsent-go, .rl-decisions-go, #nego-send, [data-ink-exempt]')) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    const props = [['backgroundColor', 1]];
    if (own.trim()) props.push(['color', 1]);
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== 'none') props.push(['borderTopColor', 1]);
    if (parseFloat(s.borderBottomWidth) > 0 && s.borderBottomStyle !== 'none') props.push(['borderBottomColor', 1]);
    for (const [p] of props) { const v = s[p]; if (grey(parse(v))) {
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      const k = `${p} ${v} ${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
      hits[k] = (hits[k] || 0) + 1; } }
  }
  return hits;
};
const CAPS = () => {
  const hits = {};
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('.pg-sheet, #ig-canvas.rl-paper, svg, script, style, .hati-ref, kbd, [data-ink-exempt]')) continue;
    let own = ''; for (const n of el.childNodes) if (n.nodeType === 3) own += n.nodeValue;
    if (!/[a-z]/i.test(own)) continue;
    const s = getComputedStyle(el);
    if (s.textTransform !== 'uppercase') continue;
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const k = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''} "${own.trim().slice(0, 24)}"`;
    hits[k] = (hits[k] || 0) + 1;
  }
  return hits;
};

/* THE PAPER: every .pg-sheet and what is in it, except the GAP between pages,
   which shows the desk and follows it — and Home's Document paper, which is
   the same paper drawn without the page-maker's sheet (#ig-canvas.rl-paper,
   Redlined and Clean; added 11 Oct 2026 when the Document tab's paper moved
   there). */
const PAPER = props => {
  const out = {};
  for (const root of document.querySelectorAll('.pg-sheet, #ig-canvas.rl-paper')) for (const el of [root, ...root.querySelectorAll('*')]) {
    if (el.closest('.pg-gap')) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    for (const p of props) { const v = s[p]; if (!v || v === 'none') continue; const k = p + ' ' + v; out[k] = (out[k] || 0) + 1; }
  }
  return out;
};
const COLOUR_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'textDecorationColor', 'fill', 'stroke'];
const BTN_PROPS = ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'borderRightColor'];
const STATUS_TOKENS = ['amber', 'green', 'ruby'].flatMap(h => ['bg', 'fg', 'dot', 'line'].map(k => `--st-${h}-${k}`));

const diff = (a, b) => {
  const out = [];
  for (const k of new Set([...Object.keys(a || {}), ...Object.keys(b || {})]))
    if ((a || {})[k] !== (b || {})[k]) out.push(`${k}: ${(a || {})[k] || 0} → ${(b || {})[k] || 0}`);
  return out;
};

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => check('no page error', false, e.message));
  const rec = {};
  const base = SAVE ? null : JSON.parse(fs.readFileSync(BASELINE, 'utf8'));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0);
    await pause(1500);
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

    /* One contract with a change of ours AND an ask of theirs, so the redline
       column draws both rows: Edit · Send · Discard and Accept · Reject · Counter. */
    const cid = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      negoInit(c);
      const cl = negoClauseList(c);
      const bump = html => html.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500));
      await negoEditClause(c, cl[0].clauseId, bump(cl[0].bodyHtml), { author: 'Amina Otieno', side: 'owner', why: 'Volumes.' });
      const other = cl.find((x, i) => i > 0 && /\d/.test(x.bodyHtml)) || cl[1];
      await negoEditClause(c, other.clauseId, bump(other.bodyHtml), { author: 'Henry M.', side: 'counterparty', why: 'Their ask.' });
      return c.id;
    });

    const SCREENS = [
      /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): 'signing',
         'history' and 'negotiate' are drawn on Home now (below), and each
         leaves Home turned to its own face — the Board's History view, Jambo's
         Before you sign and Redlines faces, the paper Redlined while the last
         is open. So Home is put back as the census always saw it, as the
         'document' visit's face was put back before: the face it had, Your
         book on the Board, Jambo's faces put away and the panel on the tab
         the Document door leaves it on. Nothing to put back on the first round. */
      ['home',        () => { if (window.__hbFaceWas) {
        if (window.pdRedAway) pdRedAway(); if (window.pdSignAway) pdSignAway(); if (window.pdFillAway) pdFillAway();
        if (window.hbCvSet) hbCvSet('book', null); if (window.pdSetTab) pdSetTab('doc');
        hbS().face = window.__hbFaceWas; hbSave(); delete window.__hbFaceWas; }
        setView('dashboard'); }],
      ['contracts',   () => (regPlaceSet({ show: 'list' }), setView('register'))],
      ['obligations', () => setView('obligations')],
      ['calendar',    () => setView('calendar')],
      ['ourpaper',    () => setView('templates')],
      ['settings',    () => setView('team')],
      ['overview',    id => { openWorkspace(id); roomGoTab(getContract(id), 'terms'); }],
      /* RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner). The
         paper it drew is read on Home's Document now, so 'document' measures
         that; Home's face is put back afterwards so the next 'home' census
         sees the face it always saw. 'signing' used the key 'signing', which
         is no tab: it drew the Document tab's paper by fall-through, and with
         that tab gone it drew none — it measures the real Signing tab
         ('sign') now, where the signing copy lives. */
      ['document',    id => { window.__hbFaceWas = hbFace(); pdOpenOnHome(id, 'doc'); }],
      /* RE-POINTED 14 Oct 2026 (stage 5): the room's Signing and History tabs
         went home, by their own doors — 'signing' is Jambo's Before you sign
         face beside the signing copy on Home's paper, 'history' the Board's
         History view; 'negotiate' is Jambo's Redlines face beside Home's paper
         (every door onto Negotiate lands there). Home's face is put back at
         the next round's 'home', above. */
      ['signing',     id => { openWorkspace(id); roomGoTab(getContract(id), 'sign'); }],
      ['history',     id => { openWorkspace(id); roomGoTab(getContract(id), 'history'); }],
      ['negotiate',   id => openRedlineWorkbench(id)],
    ];
    /* THE POP-UPS the owner named: a dialog (with a danger button), the one
       panel (alerts), a toast. Each opened over the Contracts page. */
    const POPUPS = [
      ['dialog', () => { (regPlaceSet({ show: 'list' }), setView('register')); confirmDialog({ title: 'Delete this draft?', message: 'It cannot be brought back.', confirmLabel: 'Delete', danger: true }); }],
      ['alerts', () => { (regPlaceSet({ show: 'list' }), setView('register')); const b = document.querySelector('#hdr-notify'); if (b) b.click(); }],
      ['toast',  () => { (regPlaceSet({ show: 'list' }), setView('register')); toast('Saved', 'ok'); }],
    ];
    const closeLayers = async () => { await page.keyboard.press('Escape'); await pause(150); await page.keyboard.press('Escape'); await pause(150);
      await page.evaluate(() => { document.querySelectorAll('.modal-bg, [data-modal-bg]').forEach(n => n.remove()); window.toastsClear && toastsClear(); }); };

    const APPEAR = [['green', false], ['green', true], ['navy', false], ['navy', true]];
    for (const [brand, dark] of APPEAR) {
      const tag = `${brand}-${dark ? 'dark' : 'light'}`;
      await page.evaluate(([b, d]) => { setBrand(b); setDark(d); }, [brand, dark]);
      await pause(500);
      rec[tag] = { screens: {}, popups: {} };
      rec[tag].status = await page.evaluate(names => { const s = getComputedStyle(document.documentElement);
        return Object.fromEntries(names.map(n => [n, s.getPropertyValue(n).trim()])); }, STATUS_TOKENS);
      rec[tag].tokens = await page.evaluate(() => { const probe = document.createElement('div'); document.body.append(probe);
        const read = v => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
        const out = { text: read('--color-text'), n600: read('--color-neutral-600'), n500: read('--color-neutral-500'),
          n400: read('--color-neutral-400'), n300: read('--color-neutral-300'), n200: read('--color-neutral-200'),
          n100: read('--color-neutral-100'), bg: read('--color-bg') };
        probe.remove(); return out; });

      for (const [name, go] of [...SCREENS, ...POPUPS]) {
        const isPop = POPUPS.some(x => x[0] === name);
        await page.evaluate(`(${go.toString()})(${JSON.stringify(cid)})`);
        /* RE-POINTED 14 Oct 2026 (stage 5): each twin on Home waited for, by this contract's id */
        if (name === 'negotiate') await page.waitForFunction(id => !!document.querySelector(`#pd-redface [data-pd-rf="${id}"]`) && !!document.querySelector('#ig-canvas'), cid, { timeout: 10000 }).catch(() => {});
        if (name === 'document') await page.waitForSelector('#ig-canvas', { timeout: 10000 }).catch(() => {});
        if (name === 'signing') await page.waitForFunction(id => !!document.querySelector(`#pd-signface .pd-sf[data-pd-sf="${id}"]`) && !!document.querySelector('#ig-paper .pg-sheet.pg-sign'), cid, { timeout: 10000 }).catch(() => {});
        if (name === 'history') await page.waitForFunction(id => { const b = document.querySelector(`#hb-cv-body[data-hb-cv="hist"][data-hb-cv-cid="${id}"]`); return !!b && !b.querySelector('.hb-cv-wait'); }, cid, { timeout: 10000 }).catch(() => {});
        await pause(name === 'home' ? 1400 : 800);
        const r = {};
        if (dark) r.all = await page.evaluate(CENSUS, ['body', COLOUR_PROPS]);
        r.paper = await page.evaluate(PAPER, [...COLOUR_PROPS, 'textTransform', 'letterSpacing']);
        if (name === 'negotiate') r.redlineButtons = await page.evaluate(CENSUS,
          ['.rl-card button, .rl-unsent-go, .rl-decisions-go, #nego-send', BTN_PROPS]);
        if (name === 'dialog') r.danger = await page.evaluate(CENSUS, ['#cf-ok, .ui-btn-danger', BTN_PROPS]);
        if (!dark && brand === 'green') r.sizes = await page.evaluate(CENSUS, ['body', ['fontSize']]);
        if (!dark) { r.greys = await page.evaluate(GREYS); r.caps = await page.evaluate(CAPS); }
        if (!SAVE && !dark) await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`) });
        (isPop ? rec[tag].popups : rec[tag].screens)[name] = r;
        if (isPop) await closeLayers();
      }
    }

    if (SAVE) {
      for (const t of Object.values(rec)) for (const g of [t.screens, t.popups]) for (const r of Object.values(g)) { delete r.greys; delete r.caps; }
      fs.writeFileSync(BASELINE, JSON.stringify(rec, null, 1) + '\n');
      console.log('saved', BASELINE);
      return;
    }

    for (const [tag, now] of Object.entries(rec)) {
      const was = base[tag];
      const dark = tag.endsWith('dark'), brand = tag.split('-')[0];
      check(`${tag}: amber, green and ruby status colours are as before`, !diff(was.status, now.status).length, diff(was.status, now.status));
      if (dark) check(`${tag}: the ramp is as before`, !diff(was.tokens, now.tokens).length, diff(was.tokens, now.tokens));
      else check(`${tag}: the ramp is Ink Wash`, !diff(INK[brand], now.tokens).length, diff(INK[brand], now.tokens));
      for (const kind of ['screens', 'popups']) for (const [name, r] of Object.entries(now[kind])) {
        const w = was[kind][name] || {};
        if (dark) { const d = diff(w.all, r.all); check(`${tag} ${name}: every colour as before (dark stays as today)`, !d.length, d.slice(0, 8)); }
        { const d = diff(w.paper, r.paper); check(`${tag} ${name}: the contract paper is as before`, !d.length, d.slice(0, 8)); }
        if (r.redlineButtons) { const d = diff(w.redlineButtons, r.redlineButtons);
          check(`${tag} ${name}: the redline cards' buttons are as before`, !d.length && Object.keys(r.redlineButtons).length > 0, d.slice(0, 8)); }
        if (r.danger) { const d = diff(w.danger, r.danger);
          check(`${tag} ${name}: the danger button is as before`, !d.length && Object.keys(r.danger).length > 0, d.slice(0, 8)); }
        if (r.sizes) { const d = diff(w.sizes, r.sizes); check(`${tag} ${name}: no text size moved`, !d.length, d.slice(0, 8)); }
        if (r.greys) { const k = Object.keys(r.greys); check(`${tag} ${name}: no grey left`, !k.length, k.slice(0, 12)); }
        if (r.caps) { const k = Object.keys(r.caps); check(`${tag} ${name}: no header or label in capitals`, !k.length, k.slice(0, 12)); }
      }
    }
  } catch (e) {
    check('the run finished', false, e && e.stack || String(e));
  } finally {
    await browser.close();
    await h.stop();
    if (!SAVE) { console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0; }
  }
})();
