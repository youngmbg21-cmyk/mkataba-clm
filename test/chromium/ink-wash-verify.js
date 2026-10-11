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
    if (el.closest('.pg-sheet, svg, script, style, #theme-menu, [data-brand-pick], .hati-ref, .rl-card button, .rl-unsent-go, .rl-decisions-go, #nego-send, [data-ink-exempt]')) continue;
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
    if (el.closest('.pg-sheet, svg, script, style, .hati-ref, kbd, [data-ink-exempt]')) continue;
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
   which shows the desk and follows it. */
const PAPER = props => {
  const out = {};
  for (const root of document.querySelectorAll('.pg-sheet')) for (const el of [root, ...root.querySelectorAll('*')]) {
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
      ['home',        () => setView('dashboard')],
      ['contracts',   () => setView('register')],
      ['obligations', () => setView('obligations')],
      ['calendar',    () => setView('calendar')],
      ['ourpaper',    () => setView('templates')],
      ['settings',    () => setView('team')],
      ['overview',    id => { openWorkspace(id); roomGoTab(getContract(id), 'terms'); }],
      ['document',    id => { openWorkspace(id); roomGoTab(getContract(id), 'docs'); }],
      ['signing',     id => { openWorkspace(id); roomGoTab(getContract(id), 'signing'); }],
      ['history',     id => { openWorkspace(id); roomGoTab(getContract(id), 'history'); }],
      ['negotiate',   id => openRedlineWorkbench(id)],
    ];
    /* THE POP-UPS the owner named: a dialog (with a danger button), the one
       panel (alerts), a toast. Each opened over the Contracts page. */
    const POPUPS = [
      ['dialog', () => { setView('register'); confirmDialog({ title: 'Delete this draft?', message: 'It cannot be brought back.', confirmLabel: 'Delete', danger: true }); }],
      ['alerts', () => { setView('register'); const b = document.querySelector('#hdr-notify'); if (b) b.click(); }],
      ['toast',  () => { setView('register'); toast('Saved', 'ok'); }],
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
        if (name === 'negotiate') await page.waitForSelector('#view-redline #rl-doc', { timeout: 10000 }).catch(() => {});
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
