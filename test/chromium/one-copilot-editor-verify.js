/* ONE COPILOT EDITOR FOR BOTH DOORS (Young, 5 Oct 2026: "The risk scan edit
   with copilot design … should be exactly like the edit with copilot design
   … the area … should have the feature to expand the box"; picked "Fill the
   panel" and "yes to waiting for Apply")
   ============================================================
   Driven where the reader stands, at the owner's own iPad-sized window,
   Copilot scripted at its transport:
     1. FROM A RISK — the Risks tab draws the risk, then Copilot's answer the
        way the conversation draws it: the reading rows and ONE Suggested
        wording card with Apply · Ask for a change · the votes · Expand; the
        risk's quick asks sit in the rail's own chips row and the typed ask
        in the rail's own box; the box is untouched until Apply;
     2. FROM A CLAUSE — the same parts in the same places;
     3. RE-POINTED 7 Oct 2026 (Young, "Copilot Panel Tidy-up": Sticky bar
        and, on the risk walk, One footer — reversing Fill the panel): no
        Expand and no full view; the wording is printed whole in the lane;
        on the walk its Apply · Ask for a change · votes are the feet's top
        row (#ce-rksug), and Apply there moves the wording;
     4. a typed ask on the Risks tab asks about the risk, never the chat;
     5. THE SECOND PASS (Young, 5 Oct 2026): our marks wear the paper's
        colour, not bold, in the card and the expanded view; the card is in
        the panel's type, the expanded view in the paper's; "Where it goes"
        for a new clause is on the expanded view too; the walk's buttons and
        Discard · File share ONE row of small buttons; the prompt box is one
        line at rest, grows as it wraps, and stops at five lines.
   Every driven half is GUARDED — a build without the feature REPORTS.
   Screenshots: test/chromium/shots/one-copilot-editor/ (or HATI_SHOT_DIR).
   Run: node test/chromium/one-copilot-editor-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-copilot-editor');
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

const LIAB = 'Each party\'s total liability under this Agreement shall not exceed the charges paid in the preceding three (3) months.';
const QUAL = 'The Supplier shall supply the goods to the agreed specification and quality.';
const BODY = '<h1>Supply Agreement</h1><p>Between Highland Corporate Ltd and Nordkust Industri AB</p>'
  + `<h2>1. Supply</h2><p>${QUAL}</p>`
  + '<h2>2. Confidentiality</h2><p>Each party shall keep the other party\'s information confidential.</p>'
  + `<h2>3. Limitation of liability</h2><p>${LIAB}</p>`
  + '<h2>4. Signatures</h2><p>Signed for and on behalf of each party by its authorised signatory.</p>';
const SCAN = { at: '5 Oct 2026, 07:20', on: '2026-10-05', lang: 'en', dismissed: [], findings: [
  { id: 't-liab', sev: 'high', kind: 'risk', title: 'Liability cap may be too low', anchor: 'doc', quote: LIAB,
    what: 'Liability is capped at three months of charges.', why: 'A data breach could cost far more than the cap.', fix: 'Raise the cap to twelve months.' },
] };
/* A LONG redline, so there is something to expand. */
const LIAB_NEW = 'Each party\'s total liability under this Agreement shall not exceed the charges paid or payable in the preceding twelve (12) months. '
  + 'This limitation shall not apply to (i) breach of clause 2 (Confidentiality), (ii) death or personal injury caused by negligence, (iii) fraud or fraudulent '
  + 'misrepresentation, or (iv) any liability which cannot be limited or excluded by applicable law. Neither party shall be liable for any indirect or '
  + 'consequential loss, loss of profit or loss of revenue, save that the Buyer\'s costs of procuring replacement goods shall be recoverable as direct loss. '
  + 'Each party shall use reasonable endeavours to mitigate any loss for which the other party is liable under this Agreement.';
const QUAL_NEW = 'The Supplier shall supply the goods to the agreed specification and quality, and shall replace any goods that do not conform within ten (10) Work Days of notice.';

(async () => {
  const h = await startHati({});
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-OCE1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich', scan: SCAN,
    upload: { name: 'Supply_Agreement_v3.docx', extractedText: BODY.replace(/<[^>]+>/g, ' ') } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  /* The owner's own window (the iPad screenshots, 5 Oct 2026). */
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = n => page.screenshot({ path: path.join(OUT, n) });
  /* What the rail shows, read off the painted page. */
  const railNow = () => page.evaluate(() => {
    const pg = document.getElementById('clause-editor'); if (!pg) return null;
    const vis = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden';
    const lane = pg.querySelector('#ce-lane'), card = lane && lane.querySelector('.ce-card .pv') ? lane.querySelector('.ce-card .pv').closest('.ce-card') : null;
    const full = pg.querySelector('#ce-full');
    const col = pg.querySelector('.ce-col, .ce-left');
    const r = col ? col.getBoundingClientRect() : null;
    return {
      /* RE-POINTED 6 Oct 2026: the panel's dropdown stands where "Written by
         Copilot…" stood (one-copilot-editor-plain-verify measures it) */
      disc: vis(pg.querySelector('#ce-pick')),
      read: lane ? [...lane.querySelectorAll('.ce-read b')].map(b => b.textContent.trim()) : [],
      cardName: card ? (card.querySelector('.n span') || {}).textContent : '',
      cardBtns: card ? [...card.querySelectorAll('button')].map(b => b.textContent.trim() || b.getAttribute('aria-label')) : [],
      dock: vis(pg.querySelector('#ce-rksug')) ? [...pg.querySelectorAll('#ce-rksug button')].map(b => b.textContent.trim() || b.getAttribute('aria-label')) : [],
      pvScroll: card ? card.querySelector('.pv').scrollHeight - card.querySelector('.pv').clientHeight : -1,
      chips: vis(pg.querySelector('#ce-chips')) ? [...pg.querySelectorAll('#ce-chips button')].map(b => b.textContent.trim()) : null,
      ask: vis(pg.querySelector('#ce-askrow')),
      scope: vis(pg.querySelector('#ce-scope.ce-tag:not(:empty)')),
      lane: vis(lane), full: vis(full),
      fullH: vis(full) ? Math.round(full.getBoundingClientRect().height) : 0,
      pvH: card ? Math.round(card.querySelector('.pv').getBoundingClientRect().height) : 0,
      fullBodyH: vis(full) ? Math.round(full.querySelector('.ce-full-body').getBoundingClientRect().height) : 0,
      fullBtns: vis(full) ? [...full.querySelectorAll('button')].map(b => b.textContent.trim() || b.getAttribute('aria-label')) : [],
      feet: [...pg.querySelectorAll('.ce-railfoot:not(.ce-rksug)')].filter(vis).map(f => [...f.querySelectorAll('button')].map(b => b.textContent.trim()).join(' · ')),
      footTops: [...pg.querySelectorAll('.ce-railfoot:not(.ce-rksug) button')].filter(vis).map(b => Math.round(b.getBoundingClientRect().top)),
      footH: [...pg.querySelectorAll('.ce-railfoot:not(.ce-rksug) button')].filter(vis).map(b => Math.round(b.getBoundingClientRect().height)),
      col: r ? [Math.round(r.left), Math.round(r.width)] : null,
      box: ceBoxWords(),
    };
  });
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => !!(window.state && state.contracts && state.contracts.length));
    if (!(await page.evaluate(() => typeof riskAnswerOf === 'function'))) throw new Error('there is no one Copilot editor on this build');
    await page.evaluate(({ LIAB_NEW, QUAL_NEW }) => {
      state.aiConfigured = true;
      window._ocAsked = [];
      window.copilotAsk = async msgs => {
        const t = String((msgs[0] || {}).content || '');
        window._ocAsked.push(t);
        const words = /Asked now:/.test(t) ? LIAB_NEW.replace('twelve (12)', 'twenty-four (24)')
          : /specification and quality/.test(t) ? QUAL_NEW : LIAB_NEW;
        return { answer: JSON.stringify({ proposedText: words, advice: 'I raised the cap and carved out the losses a cap should never cover.' }) };
      };
    }, { LIAB_NEW, QUAL_NEW });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const row = await until(page, id => { if (!document.getElementById('rl-risks') && window.renderRedline) renderRedline();
      return !!document.querySelector('#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]'); }, ID);
    check(!!row, '0 the Redlines card lists the liability risk with Edit with Copilot');

    /* ============ 1. FROM A RISK ============ */
    await press(page, '#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]');
    const rk = await until(page, () => {
      const lane = document.querySelector('#clause-editor #ce-lane');
      return lane && lane.querySelector('.rk-ce-head') && !lane.querySelector('.rk-busy') && lane.querySelector('.ce-card .pv') && document.querySelector('#ce-lane [data-ce-apply="rk:0"]') ? true : null;
    }, null, 10000);
    check(!!rk, '1- the Risks tab has Copilot\'s answer');
    const R = await railNow();
    check(!!R && R.disc, '1a the panel\'s dropdown stands over the risk as over the clause');
    check(!!R && R.read.length >= 2 && /playbook/i.test(R.read[0]) && R.read.some(x => /wording/i.test(x)), '1b the reading rows the clause screen draws (Our playbook · The wording)', R && R.read.join(' · '));
    /* RE-POINTED 7 Oct 2026 (One footer): on the walk the card's buttons are the feet's top row */
    /* RE-POINTED 10 Oct 2026 (Young, "one Copilot panel"): the card carries Apply · Discard itself; no Apply strip */
    check(!!R && R.cardName === 'Suggested wording' && R.cardBtns.join(' · ') === 'Apply · Discard' && R.dock.length === 0, '1c ONE Suggested wording with Apply · Discard on the card — no strip, no Ask for a change, no votes, no Expand', R && (R.cardBtns.join(' · ') + ' | ' + R.dock.join(' · ')));
    check(!!R && Array.isArray(R.chips) && R.chips.join(' · ') === 'Make it firmer · Give me a softer version · Shorter · What does our playbook say?', '1d the risk\'s quick asks sit in the rail\'s own chips row', R && String(R.chips));
    check(!!R && R.ask, '1e and the typed ask in the rail\'s own box');
    check(!!R && R.scope, '1f with the clause card over it, as from a clause');
    check(!!R && !/twelve \(12\)/.test(R.box), '1g the box is untouched until Apply');
    check(!!R && R.feet.length === 1 && /^‹ · › · (File|Save)/.test(R.feet[0]), '1h one foot: ‹ k of n › and Save — no Skip, no Save & next, no Discard', R && R.feet.join(' | '));
    check(!!R && R.footTops.length === 3 && new Set(R.footTops).size === 1, '5a all three on ONE row', R && R.footTops.join(','));
    check(!!R && R.footH.every(h => h <= 24), '5b on the small rung', R && R.footH.join(','));
    const face = await page.evaluate(() => {
      const p = [...document.querySelectorAll('#ce-doc .rl-clause p, #ce-doc p')].find(x => x.textContent.trim().length > 20);
      const pv = document.querySelector('#ce-lane .ce-card .pv'), ins = pv && pv.querySelector('ins'), del = pv && pv.querySelector('del');
      const probe = document.createElement('ins'); probe.className = 'rl-us'; probe.textContent = 'x';
      const host = document.querySelector('#ce-doc .rl-doc, #ce-doc') ; host.appendChild(probe);
      const c = el => { const k = getComputedStyle(el); return { f: k.fontFamily, s: k.fontSize, col: k.color, bg: k.backgroundColor, w: k.fontWeight, dec: k.textDecorationLine }; };
      const out = { para: c(p), pv: c(pv), ins: c(ins), del: c(del), paperIns: c(probe) }; probe.remove(); return out;
    });
    /* RE-POINTED 5 Oct 2026 (Young): the small card speaks the PANEL's type
       (Copilot's answer above it); only the expanded view takes the paper's. */
    const panelType = await page.evaluate(() => { const t = document.querySelector('#ce-lane .ce-ai p.t'); const k = t && getComputedStyle(t); return k ? { f: k.fontFamily, s: k.fontSize } : null; });
    check(!!face && !!panelType && face.pv.f === panelType.f && face.pv.s === panelType.s, '5c the card is in the panel\'s own face and size', face && JSON.stringify([panelType, face.pv.f.slice(0, 20), face.pv.s]));
    check(!!face && face.ins.col === face.paperIns.col && face.ins.bg === face.paperIns.bg && /underline/.test(face.ins.dec) && Number(face.ins.w) < 500, '5d an added run wears the paper\'s colour, underlined, not bold', face && JSON.stringify([face.ins, face.paperIns]));
    /* RE-POINTED 7 Oct 2026 (the one-build work order part G): a struck run
       is red, words and line — the ruby token — never the side's colour */
    const ruby5e = await page.evaluate(() => { const x = document.createElement('span'); x.style.color = 'var(--st-ruby-fg)'; document.body.appendChild(x); const v = getComputedStyle(x).color; x.remove(); return v; });
    check(!!face && face.del.col === ruby5e && face.del.col !== face.paperIns.col && /line-through/.test(face.del.dec), '5e a struck run is red, struck', face && JSON.stringify(face.del));
    const ask0 = await page.evaluate(() => Math.round(document.querySelector('#ce-ask').getBoundingClientRect().height));
    await page.fill('#ce-ask', 'Please raise the cap and carve out confidentiality, data protection, fraud, personal injury and anything that cannot be limited at law, and keep it to one paragraph that reads cleanly in the contract and leaves the rest of the clause as it stands today with no other edits at all please. '.repeat(3));
    const ask1 = await page.evaluate(() => { const b = document.querySelector('#ce-ask'); return { h: Math.round(b.getBoundingClientRect().height), lh: parseFloat(getComputedStyle(b).lineHeight), ov: getComputedStyle(b).overflowY }; });
    check(ask0 <= 30, '5f the prompt box is one line at rest', ask0);
    check(ask1.h > ask0 && ask1.h <= Math.ceil(ask1.lh * 5) + 14 && ask1.ov === 'auto', '5g a long prompt wraps and grows to five lines, then scrolls', JSON.stringify(ask1));
    await page.fill('#ce-ask', '');
    /* RE-POINTED 7 Oct 2026 (Sticky bar): printed whole, no window */
    check(!!R && R.pvH > 0 && R.pvScroll <= 1, '1i the card is printed whole: nothing inside it scrolls', R && (R.pvH + ' / ' + R.pvScroll));
    await shot('1-from-a-risk.png');

    /* ============ 3. NO FULL VIEW; APPLY FROM THE FOOTER ============
       RE-POINTED 7 Oct 2026 (Sticky bar, One footer; reversing Fill the panel) */
    const none = await page.evaluate(() => ({ expand: document.querySelectorAll('[data-ce-expand]').length, full: !!document.getElementById('ce-full'),
      text: (document.querySelector('#ce-lane .ce-card .pv') || {}).textContent || '' }));
    check(none.expand === 0 && !none.full, '3a no Expand and no full view', JSON.stringify({ expand: none.expand, full: none.full }));
    check(/Each party shall use reasonable endeavours to mitigate/.test(none.text), '3g the whole redline is there in the lane, to its last sentence');
    await press(page, '#ce-lane [data-ce-apply="rk:0"]');
    const ap = await until(page, () => /twelve \(12\) months/.test(ceBoxWords()) && /Applied/.test((document.querySelector('#ce-lane .av[data-ce-card="rk:0"] .is-applied') || {}).textContent || '') ? true : null);
    check(!!ap, '3i Apply on the card moves the wording into the box, and the card says Applied');
    const save = await page.evaluate(() => { const b = document.querySelector('#ce-railfoot [data-ce-act="save"]'); return b ? !b.disabled : false; });
    check(save, '3j and Save is live once applied');

    /* ============ 4. A TYPED ASK ON THE RISKS TAB ============ */
    const n0 = await page.evaluate(() => window._ocAsked.length);
    await page.fill('#ce-ask', 'make it two years');
    await page.focus('#ce-ask');
    await page.keyboard.press('Enter');
    const typed = await until(page, n => window._ocAsked.length > n && /Asked now: make it two years/.test(window._ocAsked[window._ocAsked.length - 1])
      && /twenty-four/.test((document.querySelector('#ce-lane .ce-card .pv') || {}).textContent || '') ? true : null, n0, 10000);
    check(!!typed, '4a a typed ask asks about the risk and redrafts the card');
    check(await page.evaluate(() => !/make it two years/.test((document.querySelector('#ce-lane') || {}).textContent || '')), '4b and it does not open a chat on the Risks tab');

    /* ============ 2. FROM A CLAUSE ============ */
    await press(page, '[data-ce-tab="chat"]');
    await until(page, () => document.querySelector('[data-ce-tab="chat"].is-on') ? true : null);
    await page.evaluate(() => ceAsk('Make the supply clause firmer'));
    const ch = await until(page, () => document.querySelector('#ce-lane .ce-card.ce-sug .av[data-ce-card]:not([data-ce-card^="rk"])') ? true : null, null, 10000);
    check(!!ch, '2- the conversation has a Suggested wording card');
    const C = await railNow();
    check(!!C && C.disc && C.cardName === 'Suggested wording' && (C.cardBtns.includes('Apply') || C.cardBtns.some(b => /Applied/.test(b))) && !C.cardBtns.includes('Ask for a change') && !C.cardBtns.includes('Expand') && C.dock.length === 0, '2a the same wording, its own Apply on this tab — no Ask for a change, no Expand', C && C.cardBtns.join(' · '));
    check(!!C && C.read.length >= 2 && /playbook/i.test(C.read[0]), '2b the same reading rows', C && C.read.join(' · '));
    check(!!C && Array.isArray(C.chips) && C.chips.length > 0 && C.ask, '2c the chips row and the ask box in the same places');
    check(!!C && C.feet.length === 1 && /(File|Save)$/.test(C.feet[0]), '2d the same one foot on this tab', C && C.feet.join(' | '));
    await shot('2-from-a-clause.png');
    /* RE-POINTED 7 Oct 2026 (Sticky bar): the buttons stick to the panel's bottom edge */
    const stick = await page.evaluate(() => { const av = [...document.querySelectorAll('#ce-lane .ce-card.ce-sug > .av')].pop(); return av ? getComputedStyle(av).position : null; });
    check(stick === 'sticky', '2e on the clause screen the card\'s buttons stick to the panel\'s bottom edge', stick);

    check(errors.length === 0, '9 no page errors', errors.join(' | ') || 'none');
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
