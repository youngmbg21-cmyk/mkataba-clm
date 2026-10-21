/* ============================================================
   LAND ON IT (the owner's rule, 18 Oct 2026: "a well crafted rule where you
   are directed towards what you are looking for exactly so you are not
   searching across the page for what you are looking for"; picked: Light,
   a pulse of about two seconds then a soft ring, the in-place list removed)
   ============================================================
   Driven in a real browser on a seeded workspace, from the Counter:
     1  "jambo's work" lands on the Board's Jambo's work card, lit
     2  "draft a new agreement" lands on the ONE Draft card in Jambo's panel,
        lit, "Use our template" ready; asked again, still one card, lit again
     3  "upload a document" lands on Jambo's drop area, lit, Choose files
        ready — and opens no file picker by itself (it presses nothing)
     4  a Needs you row ("Answer … redline") lands on the first row waiting
        on you in the Redlines face, lit
     5  the light: one look (the arrival and Jambo's glowing button share it),
        a ring drawn outside the box, the pulse stops under reduced motion,
        it follows a repaint, goes out at the next press, and a target that
        never shows is said, not silent
     6  the owner's three screens: each landing is in sight
   AT THE PARENT every claim but the setup FAILS: there is no lander, the
   upload word opens the picker, the Draft card is drawn twice and unlit.
     node test/chromium/land-on-it-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'land-on-it');
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
/* the lease ends inside the renewals agent's window, counted from today */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const DOC = ['RAW MATERIAL SUPPLY AGREEMENT', '', '1. Supply', '', 'The Supplier shall supply raw milk in the quantities ordered.', '',
  '2. Price', '', 'Invoices fall due within 45 days of receipt.', '', '3. Governing Law', '', 'This Agreement is governed by the laws of Sweden.'].join('\n');
const CONTRACTS = [
  H.fixtureContract('MK-L1', 'Raw Material Supply Agreement', 'Nandi Dairy', H.FOLDER_A, 800000, 'Under Review', DOC),
  H.fixtureContract('MK-L2', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
];
CONTRACTS[1].metadata = { ...(CONTRACTS[1].metadata || {}), expiryDate: day(40) };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const c1 = (await W.admin.json('/api/contracts/MK-L1')).contract || CONTRACTS[0];
  c1.owner = { id: me.id, name: me.name };
  await W.admin.json('/api/contracts/MK-L1', { method: 'PUT', body: { contract: c1, baseVersion: c1.version || 0 } }).catch(() => {});
  const share = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@nandi.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-L1', name: 'Raw Material Supply Agreement', counterparty: 'Nandi Dairy', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    let pickers = 0; page.on('filechooser', () => { pickers++; });
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') }).catch(() => {});
    const toCounter = async () => { await page.evaluate(() => setView('counter')); return until(() => !!document.getElementById('cn-q')); };
    /* RE-POINTED 18 Oct 2026 (round 23's gaps, rebuilt on LAND ON IT): Home's
       chips are the picked drawing's — the first owed row, contracts,
       calendar, draft a new agreement — so a word with no chip of its own
       ("jambo's work", "upload a document") is asked in Home's own box, the
       door every chip presses (counterAsk); the landing it pins is the same */
    const chip = async word => {
      const how = await page.evaluate(w => { const b = [...document.querySelectorAll('#cn-page [data-cn-ask]')].find(x => x.getAttribute('data-cn-ask') === w);
        if (b){ b.click(); return 'chip'; } return document.getElementById('cn-q') ? 'box' : ''; }, word);
      if (how === 'box'){ await page.fill('#cn-q', word); await page.press('#cn-q', 'Enter'); }
      if (!how) check(`(Home has no "${word}" chip and no box to ask it in)`, false);
      return !!how;
    };
    /* what is lit, and is it in sight, ringed, with a button ready */
    const LIT = () => { const L = [...document.querySelectorAll('.is-landed')];
      const el = L[0]; const r = el ? el.getBoundingClientRect() : null; const cs = el ? getComputedStyle(el) : null;
      return { n: L.length, id: el ? (el.id || el.getAttribute('data-ca-card') || el.getAttribute('data-nego-card') || el.className) : null,
        inView: !!r && r.top >= -2 && r.bottom <= innerHeight + 2 && r.left >= -2 && r.right <= innerWidth + 2,
        ring: cs ? cs.outlineStyle + ' ' + cs.outlineWidth : '',
        focus: !!(el && document.activeElement && (el === document.activeElement || el.contains(document.activeElement))),
        focusText: (document.activeElement && document.activeElement.textContent || '').trim().slice(0, 40) }; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 2, null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    /* their round: one ask, sent from their link */
    const cls = await page.evaluate(async () => { const c = getContract('MK-L1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      return negoClauseList(c).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || k.body || '').trim() })); });
    const k = cls.find(x => /45 days/.test(x.text));
    await h.client('erik').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-L1', at: new Date().toISOString(),
      negoProposed: [{ clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace('45 days', '90 days'), why: 'Our terms' }] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    const setup = await until(() => (getContract('MK-L1').changes || []).length >= 1 && hbAgentsData(null).ready >= 1, null, 10000);
    check('0 (setup) their ask is in, and Jambo has prepared work', !!setup);
    const hasLander = await page.evaluate(() => typeof landOn === 'function');
    check('0b one lander exists for every door', hasLander);

    /* ===== 1 · JAMBO'S WORK ===== */
    await toCounter();
    if (await chip("jambo's work")) {
      const L = await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const s = await page.evaluate(LIT);
      check('1a "jambo\'s work" lands on the Board\'s Jambo\'s work card', !!L && s.id === 'hm-agents' && await page.evaluate(() => state.view === 'dashboard' && hbFace() === 'board'), JSON.stringify(s));
      check('1b it is in sight, no light drawn (owner, 21 Oct 2026), a button on it ready', s.inView && /^none/.test(s.ring) && s.focus, JSON.stringify(s));
      await shot('1-work-1440x780');
    }

    /* ===== 2 · DRAFT A NEW AGREEMENT ===== */
    await toCounter();
    if (await chip('draft a new agreement')) {
      const L = await until(() => { const c = document.querySelector('#ig-dock .ca-dr'); const card = c && c.closest('[data-ca-card]');
        return card && card.classList.contains('is-landed') ? true : null; }, null, 8000);
      const s = await page.evaluate(LIT);
      const n1 = await page.evaluate(() => document.querySelectorAll('#ig-dock .ca-dr').length);
      check('2a it lands on the Draft card in Jambo\'s panel, lit', !!L && n1 === 1, JSON.stringify({ s, n1 }));
      check('2b in sight, no light drawn, "Use our template" ready', s.inView && /^none/.test(s.ring) && s.focus && /Use our template/.test(s.focusText), JSON.stringify(s));
      await shot('2-draft-1440x780');
      /* asked again from the panel itself: the same card, lit again, never a second */
      await page.mouse.click(5, 400);
      await page.evaluate(() => intelAsk('draft a new agreement'));
      const L2 = await until(() => { const c = document.querySelector('#ig-dock .ca-dr'); const card = c && c.closest('[data-ca-card]');
        return card && card.classList.contains('is-landed') ? true : null; }, null, 6000);
      const n2 = await page.evaluate(() => document.querySelectorAll('#ig-dock .ca-dr').length);
      check('2c asked again, still ONE Draft card, and it is lit again', !!L2 && n2 === 1, 'cards ' + n2);
      /* THE LIGHT FOLLOWS A REPAINT: the panel draws the card again */
      await page.waitForTimeout(2300);
      await page.evaluate(() => renderIntelDock());
      const held = await until(() => { const c = document.querySelector('#ig-dock .ca-dr'); const card = c && c.closest('[data-ca-card]');
        return card && card.classList.contains('is-landed') ? { held: card.classList.contains('is-landed-held') } : null; }, null, 3000);
      check('5a the light follows a repaint, without pulsing again', !!held && held.held, JSON.stringify(held));
      await page.mouse.click(5, 400);
      const out = await until(() => !document.querySelector('.is-landed'), null, 3000);
      check('5b it goes out at the reader\'s next press', !!out);
    }

    /* ===== 3 · UPLOAD A DOCUMENT ===== */
    await toCounter();
    const pick0 = pickers;
    if (await chip('upload a document')) {
      const L = await until(() => { const d = document.getElementById('pd-drop'); return d && d.classList.contains('is-landed') ? true : null; }, null, 8000);
      const s = await page.evaluate(LIT);
      check('3a it lands on Jambo\'s drop area on the Contracts place, lit', !!L && s.id === 'pd-drop' && await page.evaluate(() => state.view === 'dashboard'), JSON.stringify(s));
      check('3b in sight, no light drawn, Choose files ready', s.inView && /^none/.test(s.ring) && s.focus && /Choose/i.test(s.focusText), JSON.stringify(s));
      await page.waitForTimeout(600);
      check('3c it presses nothing: no file picker opened by itself', pickers === pick0, 'pickers ' + (pickers - pick0));
      await shot('3-upload-1440x780');
    }

    /* ===== 4 · A NEEDS YOU ROW ===== */
    /* The row ("Answer Nandi Dairy's redline") is drawn once their ask has
       waited; its press is the Counter's one door, hbNeedsPress → needsYouGo,
       pressed here as the row presses it. */
    await toCounter();
    const row = await page.evaluate(() => typeof hbNeedsPress === 'function');
    check('4 (setup) the row\'s door is on the page', row);
    if (row) {
      await page.evaluate(() => hbNeedsPress('quiet', 'MK-L1'));
      const L = await until(() => { const r = document.querySelector('#pd-redface [data-nego-card]'); return r && r.classList.contains('is-landed') ? true : null; }, null, 10000);
      const s = await page.evaluate(LIT);
      check('4a it lands on the first row waiting on you in the Redlines face, lit', !!L && s.n === 1, JSON.stringify(s));
      check('4b in sight, ringed, its main button ready', s.inView && /^none/.test(s.ring) && s.focus, JSON.stringify(s));
      await shot('4-needs-1440x780');
    }

    /* ===== 5 · ONE LOOK ===== */
    const look = await page.evaluate(() => {
      const a = document.createElement('button'); a.className = 'is-landed'; a.textContent = 'a';
      const b = document.createElement('button'); b.className = 'rl-glow'; b.textContent = 'b';
      document.body.append(a, b);
      const A = getComputedStyle(a), B = getComputedStyle(b);
      const out = { a: [A.outlineStyle, A.outlineWidth, A.outlineColor, A.animationName].join(' '), b: [B.outlineStyle, B.outlineWidth, B.outlineColor, B.animationName].join(' '),
        margin: A.marginTop + A.paddingTop };
      a.remove(); b.remove(); return out; });
    /* RE-POINTED 21 Oct 2026 (owner): an arrival draws nothing; Jambo's glowing button keeps its ring */
    check('5c an arrival draws no light; Jambo\'s glowing button keeps its ring', /^none/.test(look.a) && / none$/.test(look.a) && /solid 2px/.test(look.b) && /hatiLand/.test(look.b), JSON.stringify(look));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const still = await page.evaluate(() => { const a = document.createElement('i'); a.className = 'is-landed'; document.body.append(a);
      const n = getComputedStyle(a).animationName; a.remove(); return n; });
    check('5d under reduced motion nothing moves either', still === 'none', still);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const said = await page.evaluate(async () => { await landOn('#no-such-thing', { tries: 2, missing: 'Nothing to land on' });
      return [...document.querySelectorAll('#toast-root [data-toast-msg], #toast-root *')].some(e => /Nothing to land on/.test(e.textContent || '')); });
    check('5e a target that never shows is said where the reader looks', said);

    /* ===== 6 · THE OWNER'S THREE SCREENS ===== */
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await toCounter();
      await chip('upload a document');
      await until(() => { const d = document.getElementById('pd-drop'); return d && d.classList.contains('is-landed') ? true : null; }, null, 8000);
      const u = await page.evaluate(LIT);
      await shot(`6-upload-${w}x${hh}`);
      await toCounter();
      await chip("jambo's work");
      await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const j = await page.evaluate(LIT);
      await shot(`6-work-${w}x${hh}`);
      check(`6 at ${w}×${hh}: the drop area and the Jambo's work card land in sight`, u.inView && u.id === 'pd-drop' && j.inView && j.id === 'hm-agents', JSON.stringify({ u: u.id + ' ' + u.inView, j: j.id + ' ' + j.inView }));
    }

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack ? e.stack.slice(0, 400) : String(e));
  } finally {
    await browser.close().catch(() => {}); await h.stop().catch(() => {});
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
