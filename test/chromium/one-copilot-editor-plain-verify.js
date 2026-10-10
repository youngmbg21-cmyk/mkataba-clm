/* ONE COPILOT EDITOR, PLAIN (Young, 6 Oct 2026: the Copilot editor job order,
   built on "Go with your recommendations")
   ============================================================
   Driven where the reader stands, at the owner's iPad-sized window, Copilot
   scripted at its transport to answer the way the owner's screen showed —
   working notes, a first draft, "Wait, I should reconsider… Let me refine:",
   and the final draft:
     1. B1 — over the wording, "Why change it" and "What the new wording does"
        in plain words; no working note anywhere on the panel; "✦ Copilot ·
        check before sending" under the answer;
     2. B3 — a dropdown where "Written by Copilot…" stood, no taller than it;
        on Risks the open risks by short title in a severity group; on
        Suggestions the redlined clauses grouped, with dots and state words in
        HaTi's own list; a pick moves the editor to that clause;
     3. B4 — no Selected card; a tag in the ask box;
     4. B5 — the risk's heading has no box: the short title, the severity,
        then Why it matters; no step count;
     5. B6 — the card in the Redlines column wears the same short title, the
        whole sentence on its hover;
     6. no page errors.
   Every driven half is GUARDED. Run: node test/chromium/one-copilot-editor-plain-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'one-copilot-editor-plain');
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
        const words = /specification and quality/.test(t) ? QUAL_NEW : LIAB_NEW;
        /* the owner's screen: working notes, a first draft, "Wait… Let me refine:", the final draft */
        return { answer: 'Now I have the context. However, I notice the user said "The drafter has now asked".\n\nLet me draft a response.\n'
          + JSON.stringify({ advice: 'Let me draft', proposedText: 'First try.' }) + '\n\nWait, I should reconsider. Let me refine:\n'
          + JSON.stringify({ advice: 'Worth proposing.', whyChange: 'As written, the cap is three months of charges, far below what a data breach could cost you.',
            whatItDoes: 'It raises the cap to twelve months and keeps the losses a cap should never cover outside it.', proposedText: words }) };
      };
    }, { LIAB_NEW, QUAL_NEW });
    await page.evaluate(id => openWorkspace(id), ID);
    await page.evaluate(id => roomGoTab(getContract(id), 'redline'), ID);
    await until(page, () => !!document.querySelector('.redline-page #rl-changes'));
    const row = await until(page, id => { if (!document.getElementById('rl-risks') && window.renderRedline) renderRedline();
      return !!document.querySelector('#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]'); }, ID);
    check(!!row, '0 the Redlines card lists the liability risk with Edit with Copilot');

    /* ============ 4/5. THE RISK DOOR ============ */
    const card = await page.evaluate(() => { const t = document.querySelector('#rl-risks [data-rk-key="s:t-liab"] .rk-t'); return t ? { t: t.textContent.trim(), full: t.getAttribute('title') } : null; });
    check(!!card && card.t === 'Liability · may favour them' && /Liability cap may be too low/.test(card.full || ''), '5 the card in the Redlines column wears the short title, the whole one on its hover', card && JSON.stringify(card));
    await press(page, '#rl-risks [data-rk-key="s:t-liab"] [data-rk-act="edit-ce"]');
    const rk = await until(page, () => { const lane = document.querySelector('#clause-editor #ce-lane');
      /* RE-POINTED 7 Oct 2026 (One footer): the risk's Apply is the feet's top row */
      return lane && !lane.querySelector('.rk-busy') && lane.querySelector('.ce-card .pv') && document.querySelector('#ce-lane [data-ce-apply="rk:0"]') ? true : null; }, null, 10000);
    check(!!rk, '1- the Risks tab has Copilot\'s answer');
    const H = await page.evaluate(() => {
      const h = document.querySelector('#ce-lane .rk-ce-head'), k = h && getComputedStyle(h), why = document.querySelector('#ce-lane .rk-ce-why');
      return h ? { t: (h.querySelector('.rk-t') || {}).textContent, sev: (h.querySelector('.rk-sev') || {}).textContent, border: k.borderTopStyle + ' ' + k.borderTopWidth,
        bg: k.backgroundColor, step: !!document.querySelector('#ce-lane .rk-ce-step'), why: why ? why.textContent.trim() : '' } : null; });
    check(!!H && H.t === 'Liability · may favour them' && /High/i.test(H.sev || ''), '4a the heading: the short title, the severity on the right', H && JSON.stringify([H.t, H.sev]));
    check(!!H && /^none|0px$/.test(H.border) && /rgba\(0, 0, 0, 0\)|transparent/.test(H.bg), '4b with no box round it', H && H.border + ' ' + H.bg);
    check(!!H && !H.step, '4c no step count: the dropdown says which risk this is');
    check(!!H && /^Why it matters/i.test(H.why) && /Contracts written by the other side/.test(H.why), '4d then Why it matters, in the rule\'s own plain words', H && H.why.slice(0, 60));
    const L = await page.evaluate(() => { const lane = document.querySelector('#ce-lane'); const ex = lane.querySelector('.ce-explain');
      return { ex: ex ? ex.textContent.replace(/\s+/g, ' ').trim() : '', text: lane.textContent, foot: (lane.querySelector('.ce-aifoot') || {}).textContent || '' }; });
    check(/^Why change it As written, the cap is three months/.test(L.ex) && /What the new wording does It raises the cap to twelve months/.test(L.ex), '1a over the wording: Why change it · What the new wording does, in plain words', L.ex.slice(0, 90));
    check(!/Now I have|Let me|Wait, I should|the user|First try/.test(L.text), '1b no working note and no first try anywhere on the panel');
    check(/Copilot · check before sending/.test(L.foot), '1c "Copilot · check before sending" under the answer', L.foot);
    const P = await page.evaluate(() => { const p = document.getElementById('ce-pick'), s = document.getElementById('ce-pick-sel');
      return p ? { h: Math.round(p.getBoundingClientRect().height), disc: !!document.querySelector('#clause-editor .ce-disc'),
        groups: s ? [...s.querySelectorAll('optgroup')].map(g => g.label) : [], on: s ? s.options[s.selectedIndex].textContent : '' } : { disc: !!document.querySelector('#clause-editor .ce-disc'),
        discH: document.querySelector('#clause-editor .ce-disc') ? Math.round(document.querySelector('#clause-editor .ce-disc').getBoundingClientRect().height) : 0 }; });
    check(!!P.h && !P.disc && P.h <= 34, '2a the dropdown stands where "Written by Copilot" stood, no taller than it (34px, measured at main)', JSON.stringify(P));
    check(P.groups && P.groups.length === 1 && /^High · 1$/.test(P.groups[0]) && P.on === 'Liability · may favour them', '2b on Risks: the open risks by short title, grouped by severity, on the one being edited', JSON.stringify(P));
    const T = await page.evaluate(() => { const t = document.querySelector('#ce-askrow #ce-scope.ce-tag'); return { tag: t ? t.textContent.trim() : null, card: !!document.querySelector('#clause-editor .ce-scope') }; });
    check(T.tag !== null && !T.card, '3a no Selected card; what it said rides in the ask box', JSON.stringify(T));
    await shot('1-risk-door.png');

    /* ============ 2. ON SUGGESTIONS ============ */
    const other = await page.evaluate(id => { const c = getContract(id); const cl = negoClauseList(c).find(x => /Supply/.test(x.title || x.headingText || ''));
      if (!cl) return null; negoEditClause(c, cl.clauseId, '<p>The Supplier shall supply the goods to the agreed specification, quality and delivery dates.</p>', { side: 'owner' }); return String(cl.clauseId); }, ID);
    await press(page, '#clause-editor [data-ce-tab="chat"]');
    const S = await until(page, () => { const s = document.getElementById('ce-pick-sel'); return s && s.querySelectorAll('optgroup').length >= 2 ? { groups: [...s.querySelectorAll('optgroup')].map(g => g.label),
      opts: [...s.options].map(o => [o.textContent, o.dataset.dot, o.dataset.st]), on: s.options[s.selectedIndex].textContent } : null; });
    check(!!S && S.groups.some(g => /^This clause/.test(g)) && S.groups.some(g => /^Our asks · 1$/.test(g)) && S.opts.some(o => /Supply/.test(o[0]) && o[1] === 'us' && o[2] === 'not sent'),
      '2c on Suggestions: the redlined clauses grouped, each with a dot and a state word', S && JSON.stringify(S));
    await page.click('#ce-pick-sel');
    const M = await until(page, () => { const m = document.querySelector('.hati-selmenu.has-groups'); return m ? { g: [...m.querySelectorAll('.hati-selmenu-g')].map(x => x.textContent),
      dots: m.querySelectorAll('.hati-selmenu-dot').length, st: [...m.querySelectorAll('.hati-selmenu-st')].map(x => x.textContent) } : null; });
    check(!!M && M.g.length >= 2 && M.dots >= 2 && M.st.includes('not sent'), '2d it opens in HaTi\'s own list, with its groups, dots and state words', M && JSON.stringify(M));
    await shot('2-suggestions-list.png');
    await page.keyboard.press('Escape');
    if (other){
      await page.evaluate(o => { const s = document.getElementById('ce-pick-sel'); s.value = o; s.dispatchEvent(new Event('change', { bubbles: true })); }, other);
      const moved = await until(page, o => window.clauseEditorClauseId && clauseEditorClauseId() === o ? true : null, other);
      check(!!moved, '2e a pick moves the editor to that clause');
    } else check(false, '2e a pick moves the editor to that clause', 'no other clause');
    for (const dark of [false, true]){
      await page.evaluate(d => { if (window.setDark) setDark(d); else document.documentElement.classList.toggle('dark', d); }, dark);
      await page.waitForTimeout(250);
      await shot(dark ? '3-dark.png' : '3-light.png');
    }
    check(!errors.length, '6 no page errors', errors.slice(0, 2).join(' | '));
  } catch (e){ check(false, 'the stage ran to the end', e.message); }
  finally { await browser.close(); await h.stop(); }
  console.log(failures ? `${failures} failed` : 'all passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
