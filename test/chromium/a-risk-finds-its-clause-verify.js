/* A RISK FINDS ITS CLAUSE, AND WHERE HaTi CANNOT TELL THE READER POINTS
   (Young, 5 Oct 2026: "Product standard not cited" opened an empty new clause
   after Governing Law and Copilot refused; picked "Find the clause" with "You
   point" behind it, then "Build the recommendation and merge to main")
   ============================================================
   Driven where the reader stands, on a raw-material agreement drawn from the
   template, Copilot scripted at its transport:
     1. FIND THE CLAUSE — "Product standard not cited" (the rule names template
        clause 3) opens Edit with Copilot ON "Quality & Rejection", and Copilot
        is asked to REWRITE it with its wording; nothing to choose;
     2. YOU POINT — a risk HaTi cannot place holds a place and asks "Which
        clause is this about?"; Copilot is not asked and the quick asks are
        grey until the reader chooses; "Change 1. Supply & Specification"
        opens that clause and asks Copilot once; a place for a new clause
        holds it there, and the request says there is no wording yet;
     3. COPILOT WROTE NOTHING — said quietly with the way forward, not in red,
        and the box opens on the clause in front of the reader.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/a-risk-finds-its-clause/ (or HATI_SHOT_DIR).
   Run: node test/chromium/a-risk-finds-its-clause-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'a-risk-finds-its-clause');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const until = async (page, fn, arg, ms = 8000) => {
  const t0 = Date.now();
  for (;;){
    let v = null;
    try{ v = await page.evaluate(fn, arg); }catch(_){ v = null; }
    if (v) return v;
    if (Date.now() - t0 > ms) return v;
    await new Promise(r => setTimeout(r, 120));
  }
};
const press = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); if (!b || b.disabled) return false; b.click(); return true; }, sel);

const SCAN = { at: '5 Oct 2026, 16:40', on: '2026-10-05', lang: 'en', dismissed: [], findings: [
  { id: 'rm-kebs', sev: 'med', kind: 'risk', title: 'Product standard not cited', anchor: 'c3',
    what: 'The quality clause references a specification generally but names no product standard number.',
    why: 'For food-grade inputs, an unnamed standard makes rejection hard to enforce.',
    fix: 'Cite the applicable product standard and make conformity a condition of acceptance.' },
  { id: 'x-odd', sev: 'med', kind: 'risk', title: 'Counter-signature mechanics unclear', anchor: 'doc',
    what: 'It is not said who counter-signs first.', why: 'Disputes about when the agreement binds.', fix: 'Say who signs first.' },
  { id: 'rm-index', sev: 'low', kind: 'ambiguity', title: 'Price index unnamed', anchor: 'c2',
    what: 'Price reviews track a market index that is not named.', why: 'Every review can become an argument.', fix: 'Name the index.' },
] };
const QUAL_NEW = 'Consignments failing specification or KEBS/EAS standard requirements may be rejected within 3 days of delivery, conformity to the named standard being a condition of acceptance.';
const SUPPLY_NEW = 'The Supplier shall supply the material to the agreed specification, and both parties shall counter-sign each order in the order set out in Schedule 1.';
const NEW_CL = 'Each party shall sign this Agreement in the order the Buyer names, and it binds when the last party has signed.';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-RFC1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Highland sugar supply agreement', counterparty: 'Kenya Sugar Mills Ltd', counterpartyEmail: 'ops@ksm.example',
    folder: FOLDER_A, status: 'Under Review', template: 'RM', fields: { material: 'refined white sugar' }, metadata: {},
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 2400000, valueType: 'estimated', scan: SCAN } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  /* RE-POINTED 6 Oct 2026 ("one Copilot editor"): the Risks tab no longer
     prints "Risk k of n" (the panel's dropdown says which risk this is) and
     its heading wears the short title with the whole one on its hover. The
     lane's reading for these checks is its text, the hover titles in it and
     the dropdown's position, said as before. */
  await page.addInitScript(() => {
    window.__riskStep = () => { const s = document.getElementById('ce-pick-sel'); if (!s || !document.querySelector('[data-ce-tab="risks"].is-on')) return '';
      const o = [...s.options].filter(x => !x.disabled); const i = o.findIndex(x => x.selected); return i < 0 ? '' : 'Risk ' + (i + 1) + ' of ' + o.length; };
    window.__laneText = el => !el ? '' : el.textContent + ' ' + [...el.querySelectorAll('[title]')].map(x => x.getAttribute('title')).join(' ') + ' ' + window.__riskStep();
  });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  let shares = 0;
  page.on('request', r => { if (/\/api\/shares/.test(r.url()) && r.method() !== 'GET') shares++; });
  const shot = n => page.screenshot({ path: path.join(OUT, n) });
  /* What the Risks tab shows, read off the painted page. */
  const lane = () => page.evaluate(() => {
    const pg = document.getElementById('clause-editor'); if (!pg) return null;
    const ln = pg.querySelector('#ce-lane');
    const sel = ln && ln.querySelector('[data-ce-rk-where]');
    const where = sel ? sel.closest('.rk-where') : null;
    return { text: ln ? window.__laneText(ln).replace(/\s+/g, ' ') : '',
      step: ((ln && window.__laneText(ln).match(/Risk \d+ of \d+/)) || [''])[0],
      /* RE-POINTED 5 Oct 2026 ("Copilot Panel Tidy"): the rail head no longer
         names the clause; the top bar's crumb ("Edit …") does. */
      clause: (((document.querySelector('#shell-title .crumb-layer') || {}).textContent || '') + ' '
        /* RE-POINTED 6 Oct 2026: the Selected card is gone; the clause on the
           paper the editor holds names it */
        + (() => { const id = window.clauseEditorClauseId ? clauseEditorClauseId() : ''; const k = id && pg.querySelector('#ce-doc [data-clause="' + id + '"]');
          return k ? ((k.querySelector('.rl-clause-h, h4') || {}).textContent || '') : ''; })()).replace(/\s+/g, ' ').trim(),
      label: where ? (where.querySelector('.rk-k') || {}).textContent : null,
      value: sel ? sel.value : null,
      opts: sel ? [...sel.options].map(o => ({ v: o.value, t: o.textContent.trim(), d: o.disabled })) : [],
      card: !!(ln && ln.querySelector('[data-ce-apply="rk:0"]')),
      busy: !!(ln && ln.querySelector('.rk-busy')),
      red: !!(ln && ln.querySelector('.rk-err')),
      say: ln && ln.querySelector('.rk-say') ? ln.querySelector('.rk-say').textContent.replace(/\s+/g, ' ').trim() : '',
      chipsOff: [...pg.querySelectorAll('#ce-chips [data-ce-rk^="ask-"]')].map(b => b.disabled) };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskWherePick === 'function' && typeof templateClauseTitles === 'function'))) throw new Error('a risk cannot find its clause on this build');
    await page.evaluate(({ QUAL_NEW, SUPPLY_NEW, NEW_CL }) => {
      state.aiConfigured = true;
      window._asked = [];
      window.copilotAsk = async msgs => {
        const t = String((msgs[0] || {}).content || '');
        window._asked.push(t);
        if (/Price index unnamed/.test(t)) return { answer: JSON.stringify({ proposedText: '', advice: 'I cannot tell which wording names the index; I need the clause that sets prices.' }) };
        const words = /There is no existing wording/.test(t) ? NEW_CL
          : /Quality & Rejection|failing specification/.test(t) ? QUAL_NEW : SUPPLY_NEW;
        return { answer: JSON.stringify({ proposedText: words, advice: 'Drafted.' }) };
      };
    }, { QUAL_NEW, SUPPLY_NEW, NEW_CL });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const titles = await page.evaluate(id => templateClauseTitles(getContract(id)), ID);
    check(titles && titles.c3 === 'Quality & Rejection' && titles.c2 === 'Price & Contract Value', '0 the template\'s own paper names its tagged clauses', JSON.stringify(titles));
    const row = await until(page, () => { if (!document.getElementById('rl-risks') && window.renderRedline) renderRedline();
      return !!document.querySelector('#rl-risks [data-rk-key="s:rm-kebs"] [data-rk-act="edit-ce"]'); });
    check(!!row, '0 the Redlines card lists "Product standard not cited"');

    /* ============ 1. FIND THE CLAUSE ============ */
    await press(page, '#rl-risks [data-rk-key="s:rm-kebs"] [data-rk-act="edit-ce"]');
    const L1 = await until(page, async () => { const pg = document.getElementById('clause-editor');
      const ln = pg && pg.querySelector('#ce-lane'); return ln && ln.querySelector('[data-ce-apply="rk:0"]') ? true : null; }, null, 10000) && await lane();
    check(!!L1 && /Risk 1 of 3/.test(L1.step), '1- the walk is on "Product standard not cited"', L1 && L1.step);
    check(!!L1 && /Quality & Rejection/i.test(L1.clause), '1a it opens ON the quality clause, not a new one', L1 && L1.clause);
    const ask1 = await page.evaluate(() => window._asked[window._asked.length - 1] || '');
    check(/Rewrite this contract clause/.test(ask1) && /failing specification/.test(ask1), '1b Copilot is asked to rewrite it, with its wording', ask1.slice(0, 90));
    check(!!L1 && L1.card && !L1.red, '1c Copilot\'s Suggested wording card is there, no refusal');
    check(!!L1 && L1.label == null, '1d nothing to choose: HaTi knew the clause');
    await shot('1-the-quality-clause.png');

    /* ============ 2. YOU POINT ============ */
    const n0 = await page.evaluate(() => window._asked.length);
    await press(page, '[data-ce-act="rk-skip"]');
    const L2 = await until(page, async () => { const ln = document.querySelector('#clause-editor #ce-lane');
      return ln && /Risk 2 of 3/.test(window.__laneText(ln)) && ln.querySelector('[data-ce-rk-where]') ? true : null; }, null, 8000) && await lane();
    check(!!L2 && /Which clause is this about\?/i.test(L2.label || ''), '2a a risk HaTi cannot place asks "Which clause is this about?"', L2 && L2.label);
    check(!!L2 && L2.value === '' && L2.opts[0] && L2.opts[0].d, '2b nothing is chosen for the reader', L2 && JSON.stringify(L2.opts[0]));
    const chg = L2 ? L2.opts.filter(o => /^chg:/.test(o.v)) : [], add = L2 ? L2.opts.filter(o => o.v && !/^chg:/.test(o.v)) : [];
    check(chg.length >= 4 && add.length === chg.length && /^Change 1\. Supply & Specification$/.test(chg[0].t) && /^New clause after/.test(add[0].t),
      '2c every clause to change and every place for a new one', chg.length + ' · ' + add.length + ' · ' + (chg[0] && chg[0].t));
    const still = await until(page, n => window._asked.length > n ? true : null, n0, 900);
    check(!still, '2d Copilot is not asked while the reader chooses');
    check(!!L2 && L2.chipsOff.length === 4 && L2.chipsOff.every(Boolean), '2e the quick asks are grey until then', L2 && JSON.stringify(L2.chipsOff));
    await shot('2-which-clause.png');
    await page.selectOption('#clause-editor #ce-lane [data-ce-rk-where]', chg[0] ? chg[0].v : 'none');
    const L3 = await until(page, async () => { const pg = document.getElementById('clause-editor'); const ln = pg && pg.querySelector('#ce-lane');
      return ln && /Risk 2 of 3/.test(window.__laneText(ln)) && ln.querySelector('[data-ce-apply="rk:0"]') ? true : null; }, null, 10000) && await lane();
    check(!!L3 && /Supply & Specification/i.test(L3.clause), '2f "Change 1. Supply & Specification" opens that clause', L3 && L3.clause);
    const ask3 = await page.evaluate(() => window._asked.slice(-1)[0] || '');
    check(/Rewrite this contract clause/.test(ask3) && /shall supply an estimated/i.test(ask3), '2g and asks Copilot once, to rewrite it', ask3.slice(0, 90));
    check(!!L3 && L3.value === chg[0].v, '2h the box keeps the choice, so it can be changed', L3 && L3.value);
    await shot('2f-changed-clause-1.png');
    const before = await page.evaluate(() => window._asked.length);
    const last = add[add.length - 1];
    await page.selectOption('#clause-editor #ce-lane [data-ce-rk-where]', last.v);
    const L4 = await until(page, async (n) => { const pg = document.getElementById('clause-editor'); const ln = pg && pg.querySelector('#ce-lane');
      return ln && window._asked.length > n && ln.querySelector('[data-ce-apply="rk:0"]') && document.querySelector('#clause-editor .ce-new-badge') ? true : null; }, before, 10000) && await lane();
    check(!!L4, '2i a place for a new clause holds it there, and Copilot is asked');
    const ask4 = await page.evaluate(() => window._asked.slice(-1)[0] || '');
    check(/There is no existing wording/.test(ask4) && !/The selected wording is/.test(ask4) && !/"""/.test(ask4),
      '2j the request says there is no wording yet — no empty quote', ask4.slice(0, 90));
    await shot('2i-new-clause.png');

    /* ============ 3. COPILOT WROTE NOTHING ============ */
    await page.evaluate(() => { if (window.ceForgetUnfiled) ceForgetUnfiled(); });
    await press(page, '[data-ce-act="rk-skip"]');
    const L5 = await until(page, async () => { const ln = document.querySelector('#clause-editor #ce-lane');
      return ln && /Risk 3 of 3/.test(window.__laneText(ln)) && ln.querySelector('.rk-say') ? true : null; }, null, 10000) && await lane();
    check(!!L5 && /Price & Contract Value/i.test(L5.clause), '3- "Price index unnamed" (clause 2) opens on its clause', L5 && L5.clause);
    check(!!L5 && !L5.red && /I need the clause that sets prices/.test(L5.say) && /Choose the clause this is about above/.test(L5.say),
      '3a Copilot\'s answer is said quietly, with the way forward — not in red', L5 && L5.say.slice(0, 140));
    check(!!L5 && /Which clause is this about\?/i.test(L5.label || '') && /^chg:/.test(L5.value || ''), '3b and the box opens on the clause in front of the reader', L5 && L5.value);
    const red = await page.evaluate(() => { const s = document.querySelector('#clause-editor .rk-say'); return s ? getComputedStyle(s.querySelector('p')).color : ''; });
    const ruby = await page.evaluate(() => { const p = document.createElement('span'); p.style.color = 'var(--st-ruby-fg)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; });
    check(red && red !== ruby, '3c measured: the sentence is not in the error colour', red + ' vs ' + ruby);
    await shot('3-copilot-wrote-nothing.png');

    check(shares === 0, '9a nothing was sent', shares);
    check(errors.length === 0, '9b no page errors', errors.join(' | ') || 'none');
  } catch (e){
    console.log('  FAIL — the run stopped: ' + (e && e.message));
    failures++;
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
