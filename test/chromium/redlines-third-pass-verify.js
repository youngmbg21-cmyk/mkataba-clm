/* REDLINES AND THE LETTER, THE THIRD PASS (rounds 9 and 11's gaps, 19 Oct
   2026: the adversarial checker's differences against the picked drawings
   "Piles" and "The letter", fitted to main's newer rules — LAND ON IT, and
   nothing of the ladder on the paper or in the editor), driven in a real
   browser on Nordvik's round 2: their two asks (clause 7, clause 11), our
   change on 9, Lina's suggestion on 5, six settled in round 1, Erik and Lina
   on the contract.
     1 the face: Ladder opens the clause's ladder under its row and folds on
       the same press; a row's "2 notes" opens that change's notes in the same
       panel (no drawer); Discard last asks first and Cancel keeps the draft
       (owner decision D3, kept on 19 Oct 2026); every live verb in the accent ink, Reject and Discard last
       red; "Here now" filled circles, one colour each; Lina's suggestion
       dashed on the paper, our draft solid
     2 the editor from Counter: the head bar spans the window with a quiet
       Exit at its far right; no step number; ‹ Redlines lands on the row
     3 a counter on 11, a counter on 7 out with Sara for review: no review
       band over the head, the Out for review pile says "Remind Sara"; Send
       all opens the letter with no pop-up first; no hand-over strip; the
       checks a card; the panel fits at the owner's three screens; a gap
       before the sign-off; the history preview keeps its rows
     4 Go to clause 7: the letter waits (out of sight, the note kept), the
       clause is landed on, Recent's first row is the letter; Back to the
       letter brings it back as it was
     5 after Send: "Round 3 · since …" (their asks did not just come), the
       pile "With Nordvik Logistik AB"
     6 (the fourth pass, fitted to main's LAND ON IT) the letter as a plain
       dialog away from Home: its Go to clause 7 lands ON the clause on Home's
       paper through the one lander, the dialog put away
   At d47fadb (the merge of main, this pass's parent) parts 1–5 FAIL; part 6
   FAILS at d4789db (the third pass), where that way waited a fixed 400 ms.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/redlines-third-pass-verify.js
   Photos: HATI_SHOT_DIR=/some/dir node test/chromium/redlines-third-pass-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const pause = ms => new Promise(r => setTimeout(r, ms));
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const DOC = ['MASTER SERVICES AGREEMENT', '',
  '1. Parties and purpose', '', 'This Agreement is made between Lindqvist & Co AB, Stockholm (the Customer), and Nordvik Logistik AB, Gothenburg (the Supplier).', '',
  '2. Services', '', 'The Supplier provides the logistics services described in Schedule 1 with reasonable skill and care.', '',
  '3. Term', '', 'This Agreement starts on 1 April 2026 and runs until 31 March 2028.', '',
  '4. Fees', '', 'The Customer pays the fees in Schedule 3. Fees are stated in SEK.', '',
  '5. Service levels', '', 'If the Supplier misses a service level, the Customer receives service credits, capped at 10% of the monthly fees.', '',
  '6. Confidentiality', '', 'Each party keeps the other party\'s confidential information secret during this Agreement and for three years after it ends.', '',
  '7. Liability cap', '', 'Each party\'s total liability under this Agreement in any contract year is capped at 50% of the fees paid in that year.', '',
  '8. Insurance', '', 'The Supplier holds liability insurance of at least SEK 10 million.', '',
  '9. Data protection', '', 'The Supplier notifies the Customer of a personal data breach without undue delay.', '',
  '10. Subcontractors', '', 'The Supplier may use subcontractors only with the Customer\'s consent.', '',
  '11. Payment terms', '', 'The Customer pays each correct invoice within 30 days of receipt.', '',
  '12. Law and disputes', '', 'Swedish law governs this Agreement. Disputes are settled by arbitration seated in Stockholm.'].join('\n');

async function mkUser(h, admin, name, email){
  const created = await admin.json('/api/users', { method: 'POST', body: { name, email, role: 'legal', password: 'temporary-pass-1' } });
  const c = h.client(email);
  await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
  await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  return { client: c, user: created.user };
}
async function login(b, base, email, pass, errs){
  const ctx = await b.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(email + ': ' + e.message));
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
  await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0382'), null, { timeout: 20000 });
  await page.keyboard.press('Escape').catch(() => {});
  const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
  return page;
}
const openFace = async page => {
  await page.evaluate(() => { try { pdRedOpen('MK-0382'); } catch (_) {} });
  return waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 10000);
};

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const me = (await admin.json('/api/bootstrap')).me;
  await admin.json('/api/users/' + me.id, { method: 'PATCH', body: { title: 'Legal counsel' } });
  const erik = await mkUser(h, admin, 'Erik Sandberg', 'erik@lindqvist.example');
  const lina = await mkUser(h, admin, 'Lina Ek', 'lina@lindqvist.example');
  const sara = await mkUser(h, admin, 'Sara Nyström', 'sara@lindqvist.example');
  const c0 = H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik AB', H.FOLDER_B, 4200000, 'Under Review', DOC);
  c0.owner = { id: me.id, name: me.name }; c0.metadata = { value: 4200000, currency: 'SEK' };
  await admin.json('/api/contracts/MK-0382', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const share = await admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Anna Holm', email: 'anna.holm@nordvik.example' },
    payload: { v: 1, kind: 'hati-share', org: 'Lindqvist & Co AB', sharedBy: 'Maria', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
      contract: { id: 'MK-0382', name: 'Master services agreement', counterparty: 'Nordvik Logistik AB', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });

  const b = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await login(b, h.base, 'admin@example.co.ke', 'adminpassword1', errs);
    await page.evaluate(async (linaU) => { saveDeskCfg({ on: true }); if (window.flushSaves) await flushSaves();
      const c = getContract('MK-0382'); if (c._light) await ensureFull(c);
      deskOpen(c, { lead: currentUser(), by: currentUser() }); deskAddContributor(c, { id: linaU.id, name: linaU.name, email: linaU.email });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, lina.user);
    const days = n => new Date(Date.now() - n * 86400000).toISOString();
    await page.evaluate(async (d) => { const c = getContract('MK-0382');
      const list = negoClauseList(c);
      const edits = [[/Gothenburg \(the Supplier\)/, 'Gothenburg (the Supplier), each a party'], [/reasonable skill and care\./, 'reasonable skill and care, and to the service levels in Schedule 2.'],
        [/until 31 March 2028\./, 'until 31 March 2028 and renews for a year at a time.'], [/stated in SEK\./, 'stated in SEK and exclude VAT.'],
        [/for three years/, 'for five years'], [/SEK 10 million\./, 'SEK 20 million and shows its certificate when asked.']];
      for (const [re, to] of edits){ const k = list.find(x => re.test(String(x.text || ''))); if (!k) continue;
        await negoEditClause(c, k.clauseId, '<p>' + String(k.text).replace(re, to) + '</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Our standard' }); }
      for (const ch of c.changes){ ch.createdAt = d.d8; ch.status = 'accepted'; ch.resolvedAt = d.d6; ch.resolvedBy = 'Anna Holm'; }
      c.negotiation.round = 2; c.negotiation.roundAt = d.d5; c.negotiation.turn = 'counterparty'; c.negotiation.turnAt = d.d5;
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, { d8: days(8), d6: days(6), d5: days(5) });
    const cls = await page.evaluate(() => negoClauseList(getContract('MK-0382')).map(k => ({ id: k.clauseId, label: clauseLabel(k), text: String(k.text || '').trim() })));
    const ask = (re, a, bb, why) => { const k = cls.find(x => re.test(x.text)); return { clauseId: k.id, clauseLabel: k.label, oldText: k.text, newText: k.text.replace(a, bb), why }; };
    await h.client('anna').raw('/api/shares/' + share.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Anna Holm', id: 'MK-0382', at: new Date().toISOString(),
      negoProposed: [ask(/capped at 50%/, '50%', '100%', 'Standard in our contracts.'), ask(/within 30 days/, '30 days', '60 days', 'Our own customers pay us at 60 days.')] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    const gotAsks = await waitFor(page, () => (getContract('MK-0382').changes || []).filter(x => x.authorSide === 'counterparty').length >= 2, 10000);
    check('0  seed: their two asks arrived', !!gotAsks);
    await page.evaluate(async (d) => { const c = getContract('MK-0382');
      for (const ch of c.changes) if (ch.authorSide === 'counterparty') ch.createdAt = d.d4;
      const seven = c.changes.find(x => x.authorSide === 'counterparty' && /100%/.test(JSON.stringify(x)));
      if (seven){ negoPostComment(c, seven.id, 'Their cap doubles our exposure.', { side: 'owner' }); negoPostComment(c, seven.id, 'Ask Sara before we move.', { side: 'owner' }); }
      const k9 = negoClauseList(c).find(x => /without undue delay/.test(String(x.text || '')));
      await negoEditClause(c, k9.clauseId, '<p>The Supplier notifies the Customer of a personal data breach within 24 hours of becoming aware of it.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Our data protection standard' });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, { d4: days(4) });
    const lp = await login(b, h.base, 'lina@lindqvist.example', 'their-own-pass-9', errs);
    const sg = await lp.evaluate(async () => { const c = getContract('MK-0382'); c._loaded = false; await ensureFull(c);
      const k5 = negoClauseList(c).find(x => /capped at 10%/.test(String(x.text || '')));
      const ch = await negoEditClause(c, k5.clauseId, '<p>If the Supplier misses a service level, the Customer receives service credits, capped at 15% of the monthly fees.</p>', { side: 'owner', author: 'Lina Ek', why: 'Their on-time rate fell to 91% last quarter.' });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); return ch ? { id: ch.id, sg: !!ch.suggested } : null; });
    check('0  seed: Lina\'s change is a suggestion', !!(sg && sg.sg), JSON.stringify(sg));
    await lp.context().close();
    await erik.client.json('/api/contracts/MK-0382/here', { method: 'POST', body: {} }).catch(() => {});
    await lina.client.json('/api/contracts/MK-0382/here', { method: 'POST', body: {} }).catch(() => {});
    await page.evaluate(async () => { const c = getContract('MK-0382'); c._loaded = false; await ensureFull(c); });
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0382', 'copilot'); });
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 10000);
    check('0  the Redlines face is up beside the paper', !!(await openFace(page)));
    await waitFor(page, () => document.querySelectorAll('#pd-redface .rl-head-here .pz-face').length >= 2, 8000);
    await shot(page, '9-face-1440x780');

    /* 1a Ladder under its row */
    const lad = page.locator('#pd-redface [data-rl-pile="awaiting"] [data-rl-ladder-ch]').first();
    let la = null;
    if (await lad.count()){
      /* THE PICKED CARD (27 Oct 2026): Ladder waits behind More ▾; the stage
         opens the fold the way a reader would. */
      await page.evaluate(() => { const l = document.querySelector('#pd-redface [data-rl-pile="awaiting"] [data-rl-ladder-ch]'); const m = l && l.closest('[data-nego-card]') && l.closest('[data-nego-card]').querySelector('[data-rl-more]'); if (m) m.click(); });
      await lad.click({ timeout: 5000 }).catch(() => {});
      la = await waitFor(page, () => { const l = document.querySelector('#pd-redface .rl-row-ladder'); const v = document.querySelector('#pd-redface [data-rl-ladder-ch][aria-expanded="true"]');
        return l && v ? { under: !!v.closest('[data-nego-card]').querySelector('.rl-row-ladder'), text: l.innerText.slice(0, 120), panel: !!document.querySelector('#rl-cp.is-open') } : null; }, 5000);
    }
    check('1a Ladder opens the clause\'s ladder under its own row (the steps, our standard)', !!la && la.under && /ladder/i.test(la.text) && !la.panel, JSON.stringify(la));
    await shot(page, '9-ladder-1440x780');
    if (la){
      await page.evaluate(() => { const l = document.querySelector('#pd-redface [data-rl-ladder-ch][aria-expanded="true"]'); const m = l && l.closest('[data-nego-card]') && l.closest('[data-nego-card]').querySelector('[data-rl-more]'); if (m && l.closest('.rl-card-more[hidden]')) m.click(); });
      await page.click('#pd-redface [data-rl-ladder-ch][aria-expanded="true"]', { timeout: 5000 }).catch(() => {}); }
    const folded = await waitFor(page, () => !document.querySelector('#pd-redface .rl-row-ladder'), 4000);
    check('1a the same press folds it', !!la && !!folded);

    /* 1b a row's "2 notes" */
    const rn = page.locator('#pd-redface [data-rl-pile="awaiting"] [data-rl-notes]').first();
    let nv = null;
    if (await rn.count()){
      await rn.click({ timeout: 5000 }).catch(() => {});
      nv = await waitFor(page, () => { const v = document.querySelector('#pd-redface .rl-fn[data-rl-fn-change]'); if (!v) return null;
        return { only: (v.querySelector('.rl-fn-only') || {}).innerText, all: !!v.querySelector('[data-rl-fn-all]'), say: [...v.querySelectorAll('.rl-fn-say')].map(s => s.textContent.trim()),
          drawer: !!(state.panelOpen), ctx: (() => { const p = document.getElementById('context-panel'); return !!(p && p.getClientRects().length && p.getBoundingClientRect().width > 50 && getComputedStyle(p).visibility !== 'hidden' && p.classList.contains('open')); })() }; }, 5000);
    }
    check('1b a row\'s "2 notes" opens that change\'s notes in the same panel, not the drawer', !!nv && /Liability cap/.test(nv.only || '') && nv.all && nv.say.length === 2 && !nv.drawer && !nv.ctx, JSON.stringify(nv));
    await shot(page, '9-rownotes-1440x780');
    await page.click('#ig-dock > .pd-trail [data-pd-back="red-notes"]', { timeout: 5000 }).catch(() => {});  /* ONE TRAIL's back (20 Oct 2026) */
    await waitFor(page, () => !document.querySelector('#pd-redface .rl-fn'), 4000);

    /* 1c Discard last asks first (owner decision D3, 9 Oct 2026; the drawing's
       Undo was put to the owner on 19 Oct 2026: "Keep asking first") */
    const before = await page.evaluate(() => (getContract('MK-0382').changes || []).filter(x => /24 hours/.test(x.newText || '')).length);
    const dl = page.locator('#pd-redface [data-rl-retract]').first();
    let asked = null;
    if (await dl.count()){
      await dl.click({ timeout: 5000 }).catch(() => {});
      asked = await waitFor(page, () => !!document.getElementById('confirm-overlay'), 4000);
      if (asked) await page.click('#cf-cancel', { timeout: 5000 }).catch(() => {});
    }
    const kept = await waitFor(page, () => !document.getElementById('confirm-overlay')
      && (getContract('MK-0382').changes || []).filter(x => /24 hours/.test(x.newText || '')).length === 1, 4000);
    check('1c Discard last asks first, and Cancel keeps the draft', before === 1 && !!asked && !!kept, JSON.stringify({ before, asked: !!asked, kept: !!kept }));

    /* 1d–1f the ink, the faces, the marks */
    const ink = await page.evaluate(() => {
      const col = sel => { const el = document.querySelector('#pd-redface ' + sel); return el ? getComputedStyle(el).color : null; };
      const faces = [...document.querySelectorAll('#pd-redface .rl-head-here .pz-face')].map(f => { const s = getComputedStyle(f); return { w: s.width, bg: s.backgroundColor, fg: s.color }; });
      const sgIns = document.querySelector('#ig-paper .rl-sg-marks ins'); const ourIns = [...document.querySelectorAll('#ig-paper ins.rl-us')].find(i => /24 hours/.test(i.textContent));
      return { accept: col('[data-rl-pile="awaiting"] [data-nego-accept]'), counter: col('[data-rl-pile="awaiting"] .rl-verb-ai'), ladder: col('[data-rl-pile="awaiting"] [data-rl-ladder]'),
        review: col('[data-rl-ask-review]'), edit: col('[data-rl-pile="drafts"] .rl-verb-ai'), reject: col('[data-rl-pile="awaiting"] [data-nego-reject]'), discard: col('[data-rl-retract]'), faces,
        sg: sgIns ? getComputedStyle(sgIns).textDecorationStyle : null, ours: ourIns ? getComputedStyle(ourIns).textDecorationStyle : null };
    });
    /* RE-POINTED 27 Oct 2026 (THE PICKED CARD): Counter leads as the row's one
       filled button — white word on the product's filled ink — so it leaves
       the accent roll-call; Ladder, Review and Edit still wear Accept's ink. */
    const live = [ink.ladder, ink.review, ink.edit];
    check('1d Ladder, Review and Edit wear the same accent ink as Accept', !!ink.accept && live.every(x => x === ink.accept), JSON.stringify(ink));
    check('1d the lead Counter is the picked card\'s filled button, its word white', ink.counter === 'rgb(255, 255, 255)', ink.counter);
    check('1d Reject and Discard last stay red', !!ink.reject && ink.reject === ink.discard && ink.reject !== ink.accept, JSON.stringify({ reject: ink.reject, discard: ink.discard }));
    check('1e "Here now": 22px filled circles, white initials, one colour each', ink.faces.length >= 2 && ink.faces.every(f => f.w === '22px' && f.fg === 'rgb(255, 255, 255)')
      && new Set(ink.faces.map(f => f.bg)).size === ink.faces.length, JSON.stringify(ink.faces));
    check('1f Lina\'s suggestion is dashed on the paper, our draft solid', ink.sg === 'dashed' && ink.ours === 'solid', JSON.stringify({ sg: ink.sg, ours: ink.ours }));

    /* 2 the editor from Counter on clause 7 */
    const ctr = page.locator('#pd-redface [data-rl-pile="awaiting"] [data-nego-card]').first().locator('button:has-text("Counter")');
    let ed = null;
    if (await ctr.count()){
      await ctr.click({ timeout: 5000 }).catch(() => {});
      /* RE-POINTED 20 Oct 2026 (owner): from a row the strip keeps to the
         paper's column as before; ONE TRAIL's back leads it on its own row,
         dressed as the panel's; no Exit */
      ed = await waitFor(page, () => { const e = document.getElementById('clause-editor'); const hd = document.getElementById('ce-head'); const x = e && e.querySelector('.ce-exit');
        const back = e && e.querySelector('#ce-rowhead .ce-rowback'), path = e && e.querySelector('#ce-rowhead .ce-rowpath');
        if (!e || !hd || !back || !e.classList.contains('ce-rowmode')) return null;
        return { headW: Math.round(hd.getBoundingClientRect().width), vw: innerWidth, exitShown: !!(x && x.getClientRects().length), back: back.textContent.trim(), path: path ? path.textContent.trim() : '',
          step: !!e.querySelector('.ce-row-step'), is: (e.querySelector('.ce-row-is') || {}).textContent }; }, 8000);
    }
    check('2a from a row the strip keeps to the paper\'s column, the trail first', !!ed && ed.headW < ed.vw - 100 && ed.back === 'Redlines' && /Jambo \/ Redlines \/ Counter/.test(ed.path), JSON.stringify(ed));
    check('2b no Exit from a row: the trail\'s back is the way out', !!ed && !ed.exitShown, JSON.stringify(ed));
    check('2c no step number; the line says only what is true', !!ed && !ed.step && ed.is === 'Your counter · nothing is filed until you save', JSON.stringify(ed && ed.is));
    await shot(page, '9E-editor-1440x780');
    await page.click('#ce-rowhead [data-ce-act="row-back"]', { timeout: 5000 }).catch(() => {});
    const lit = await waitFor(page, () => { const el = document.querySelector('#pd-redface [data-nego-card].is-landed'); return !document.getElementById('clause-editor') && el && /Liability cap/.test(el.innerText) ? true : null; }, 6000);
    check('2d ‹ Redlines lands on the same row through the one lander (is-landed)', !!lit);

    /* 3 round 11: counters on 11 and 7, 7 out with Sara */
    await page.evaluate(async (saraU) => { const c = getContract('MK-0382');
      const t11 = c.changes.find(x => x.authorSide === 'counterparty' && /60 days/.test(JSON.stringify(x)));
      const t7 = c.changes.find(x => x.authorSide === 'counterparty' && /100%/.test(JSON.stringify(x)));
      await negoEditClause(c, t11.clauseId, '<p>The Customer pays each correct invoice within 45 days of receipt.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'We can meet you at 45 days.', onTop: t11.id });
      const c7 = await negoEditClause(c, t7.clauseId, '<p>Each party\'s total liability under this Agreement in any contract year is capped at 75% of the fees paid in that year.</p>', { side: 'owner', author: 'Maria Lindgren', why: 'Halfway.', onTop: t7.id });
      reviewAsk(c, { reviewer: { id: saraU.id, name: saraU.name, email: saraU.email }, ids: [c7 && c7.id].filter(Boolean) });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, sara.user);
    await page.evaluate(() => { try { pdRedClose(); } catch (_) {} });
    await openFace(page);
    const rv = await waitFor(page, () => { const p = document.querySelector('#pd-redface [data-rl-band="review"]'); if (!p) return null;
      return { band: p.innerText.replace(/\s+/g, ' '), notices: ((document.querySelector('#pd-redface .pd-rf-notices') || {}).innerText || ''),
        head: ((document.querySelector('#pd-redface .rl-round-at') || {}).textContent || '') }; }, 6000);
    check('3a no review band over the head; the Out for review pile says "Remind Sara"', !!rv && /Remind Sara/.test(rv.band) && !/internal review/i.test(rv.notices), JSON.stringify(rv));
    check('3a while the move is ours, "Round 2 · their asks came 4 days ago"', !!rv && /^(\d+ not sent · )?Round 2 · their asks came 4 days ago$/.test(rv.head) /* RE-POINTED 24 Oct 2026 (Round 3): "N not sent" may lead the line */, rv && rv.head);
    await shot(page, '11-face-1440x780');
    await page.click('#pd-redface [data-redline-proxy]', { timeout: 5000 }).catch(() => {});
    /* the parent's review pop-up first: answered, so the walk reports the rest */
    await pause(800); await page.evaluate(() => { const r = document.getElementById('rv-warn-rest'); if (r) r.click(); });
    const lt = await waitFor(page, () => { if (!document.getElementById('sh-letter')) return null;
      const pop = document.querySelector('#modal-root .modal-in:not([data-sh-page])');
      const side = document.getElementById('pd-sendface') || document.getElementById('pd-send-slot');
      return { pop: !!pop, handover: !!document.getElementById('share-handover'), card: !!document.querySelector('#share-readiness.sh-lt-card'),
        strip: !!document.querySelector('#share-readiness details'), stays: !!(side && /Clause 7 stays here/.test(side.innerText)) }; }, 12000);
    check('3b Send all opens the letter with no pop-up first', !!lt && !lt.pop, JSON.stringify(lt));
    check('3c Jambo\'s panel holds cards only: no hand-over strip, the checks a card, the stays card', !!lt && !lt.handover && lt.card && !lt.strip && lt.stays, JSON.stringify(lt));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht }); await pause(700);
      /* RE-POINTED 20 Oct 2026 (ONE TRAIL's line under the tabs takes a line of the
         panel): the card is scrolled to in the panel, then it must sit clear of the box */
      await page.evaluate(() => { const e = document.getElementById('sh-lt-else'); if (e) e.scrollIntoView({ block: 'end' }); });
      await pause(200);
      const fit = await page.evaluate(() => { const e = document.getElementById('sh-lt-else'); const box = document.querySelector('#ig-dock .igd-ask, #ig-dock #igd-input');
        const er = e && e.getBoundingClientRect(), br = box && box.getBoundingClientRect();
        const btns = e ? [...e.querySelectorAll('button')].filter(x => x.getClientRects().length).map(x => Math.round(x.getBoundingClientRect().bottom)) : [];
        return { elseBottom: er && Math.round(er.bottom), boxTop: br && Math.round(br.top), btns, sideways: document.documentElement.scrollWidth > innerWidth }; });
      check(`3d ${w}×${ht}: "Something else to send?" and its buttons sit clear above the ask box, nothing sideways`, !!fit.elseBottom && !!fit.boxTop && fit.elseBottom <= fit.boxTop && fit.btns.every(y => y <= fit.boxTop) && !fit.sideways, JSON.stringify(fit));
      await shot(page, `11-letter-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(500);
    const gap = await page.evaluate(() => { const f = document.querySelector('#sh-letter .sh-lt-foot'); const p = f && f.previousElementSibling;
      return f && p ? Math.round(f.getBoundingClientRect().top - p.getBoundingClientRect().bottom) : null; });
    check('3e a gap before the sign-off', gap != null && gap >= 14, String(gap));
    await page.click('[data-sh-lt-else="history"]', { timeout: 5000 }).catch(() => {});
    const hist = await waitFor(page, () => { const p = document.getElementById('share-hist-preview'); return p && !p.classList.contains('hidden') && /Negotiation history/.test(p.innerText) ? p.innerText.length : null; }, 6000);
    check('3f the history preview keeps its rows', !!hist, String(hist));
    await shot(page, '11-history-1440x780');
    await page.click('[data-sh-lt-else="contract"]', { timeout: 5000 }).catch(() => {});
    await waitFor(page, () => { const s = document.getElementById('sh-lt-subject'); return s && /^Round/.test(s.textContent); }, 6000);

    /* 4 Go to clause 7: the letter waits */
    await page.fill('#sh-summary', 'Here is our round.', { timeout: 5000 }).catch(() => {});
    await page.click('.pd-send-slot [data-sh-lt-goto]', { timeout: 5000 }).catch(() => {});
    const wait = await waitFor(page, () => { const p = document.querySelector('#modal-root .modal-in[data-sh-page]'); if (!p) return null;
      const landed = document.querySelector('#ig-paper .is-landed[data-clause]');
      return getComputedStyle(p.parentElement).display === 'none' && landed ? { landed: landed.innerText.slice(0, 40), bar: (document.querySelector('#dk-page .dk-page-w') || {}).textContent,
        back: !!document.querySelector('.pd-send-slot.is-waiting [data-sh-lt-back]') } : null; }, 6000);
    check('4a Go to clause 7: the letter waits out of sight, the clause is landed on, the bar names the paper', !!wait && /Liability cap/.test(wait.landed) && !/^Send/.test(wait.bar || '') && wait.back, JSON.stringify(wait));
    await shot(page, '11-goto-1440x780');
    await page.click('#dk-page', { timeout: 5000 }).catch(() => {});
    const rec = await waitFor(page, () => { const r = document.querySelector('#dk-recent .dk-r:not(.dk-r-home) .dk-r-t'); return r ? r.textContent : null; }, 3000);
    check('4b Recent\'s first row is the letter', /^Send · /.test(rec || ''), rec);
    await page.click('#dk-page', { timeout: 5000 }).catch(() => {});
    await page.click('.pd-send-slot.is-waiting [data-sh-lt-back]', { timeout: 5000 }).catch(() => {});
    const again = await waitFor(page, () => { const p = document.querySelector('#modal-root .modal-in[data-sh-page]');
      return p && getComputedStyle(p.parentElement).display !== 'none' ? { note: document.getElementById('sh-summary').value } : null; }, 4000);
    check('4c Back to the letter brings it back as it was', !!again && again.note === 'Here is our round.', JSON.stringify(again));

    /* 5 after Send */
    await page.click('#share-send', { timeout: 5000 }).catch(() => {});
    await waitFor(page, () => !document.querySelector('#modal-root .modal-in'), 15000);
    await openFace(page);
    const after = await waitFor(page, () => { const hd = document.querySelector('#pd-redface .rl-round-at'); const w = document.querySelector('#pd-redface [data-rl-band="with"]');
      return hd && w ? { head: hd.textContent, with: w.innerText.replace(/\s+\d+\s*$/, '').trim() } : null; }, 8000);
    check('5a after Send the head says the round\'s own day, not that their asks just came', !!after && /^Round 3 · since /.test(after.head), JSON.stringify(after));
    check('5b the pile with the other side is named for the party', !!after && after.with === 'With Nordvik Logistik AB', JSON.stringify(after));
    await shot(page, '11-after-send-1440x780');

    /* 6 fitted to main (LAND ON IT, 19 Oct 2026): the letter as a plain dialog
       (opened away from Home, so not beside Jambo) — its "Go to clause 7" puts
       the dialog away and lands ON the clause on Home's paper, the one lander's
       way; at the parent this way only scrolled after a fixed pause */
    await page.evaluate(() => { setView('approvals'); });
    await waitFor(page, () => state.view === 'approvals', 4000);
    await page.evaluate(() => { openShareModal(getContract('MK-0382')); });
    const dlgGo = await waitFor(page, () => { const g = document.querySelector('#modal-root [data-sh-lt-goto]');
      return g && !(window.pdSendFor && pdSendFor()) ? g.getAttribute('data-sh-lt-goto') : null; }, 15000);
    check('6a the letter as a dialog still carries the stays card\'s Go to clause 7', !!dlgGo, String(dlgGo));
    if (dlgGo){
      await page.click('#modal-root [data-sh-lt-goto]', { timeout: 5000 }).catch(() => {});
      const dl = await waitFor(page, (want) => { const l = document.querySelector('.is-landed');
        return l && l.getAttribute('data-clause') === want ? { onPaper: !!l.closest('#ig-paper'), face: !!document.querySelector('#pd-redface'),
          dialog: !!document.querySelector('#modal-root .modal-in'), text: l.innerText.slice(0, 40) } : null; }, 8000, dlgGo);
      check('6b Go to clause 7 from the dialog lands on the clause on Home\'s paper, the dialog put away, Redlines beside it', !!dl && dl.onPaper && dl.face && !dl.dialog && /Liability cap/.test(dl.text), JSON.stringify(dl));
      await shot(page, '11-goto-from-dialog-1440x780');
    }
    check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { check('the walk ran to its end', false, e && e.stack); }
  finally { await b.close(); await h.stop(); }
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
