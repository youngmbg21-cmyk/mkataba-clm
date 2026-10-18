/* PILES, AS DRAWN (round 9's gaps: the owner's "build all the gaps", 18 Oct
   2026; the picked option "Piles" — the Redlines face beside the paper)

   WHAT THIS PINS, driven in a real browser on Nordvik's round 2: their two
   asks (four days old, one with two notes, one on a clause Erik holds), our
   change not yet sent, Lina's suggestion while the desk rule holds, six of
   ours settled in round 1, Erik and Lina on the contract
     1 the panel's row while the face is up: Jambo's tab, the face's word
       "Redlines", "‹ Jambo" at the row's end; the face's head draws no ×;
       no chips under the face
     2 the column's head as drawn: "Redlines N" where N is the rows in sight,
       "Notes 2", "Here now" with the faces of who is on it, "Round 2 ·
       their asks came 4 days ago", "Send all · 1 not sent", "Ask for review"
     3 each pile is a box with its head: "Waiting on you" first, "Lina
       suggests", "Your drafts, not yet sent", "Settled in round 1" folded
     4 a row: the whole name and when ("Anna Holm · 4 days ago", "You ·
       today"), "2 notes", the changed words cut around the edit with their
       marks (struck 50%, added 100%), the reason under it
     5 the lock line "Erik is editing this clause" with Ask for it (a press:
       Asked); the row's Counter grey and plain
     6 Lina's row: Adopt · Hand back · Ladder; Adopt moves it to our drafts
     7 our draft: Edit · Send · Review · Ladder · Discard last
     8 the settled fold: shut, a press opens it, a press again shuts it
     9 the head's doors: Notes opens the notes drawer; Ask for review opens
       the review's own chooser
    10 the owner's three screens: the face beside the paper, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/piles-as-drawn-verify.js */
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

(async () => {
  const h = await H.startHatiWithMail({}, { HATI_AGENTS_AUTO: 'off' });
  const admin = h.client('admin');
  await admin.json('/api/setup', { method: 'POST', body: { org: 'Lindqvist & Co AB', name: 'Maria Lindgren', email: 'admin@example.co.ke',
    password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
  await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
  const me = (await admin.json('/api/bootstrap')).me;
  const erik = await mkUser(h, admin, 'Erik Sandberg', 'erik@lindqvist.example');
  const lina = await mkUser(h, admin, 'Lina Ek', 'lina@lindqvist.example');
  await mkUser(h, admin, 'Sara Nyström', 'sara@lindqvist.example');
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
    /* the desk: Maria leads, Lina on it */
    await page.evaluate(async (linaU) => { saveDeskCfg({ on: true }); if (window.flushSaves) await flushSaves();
      const c = getContract('MK-0382'); if (c._light) await ensureFull(c);
      deskOpen(c, { lead: currentUser(), by: currentUser() }); deskAddContributor(c, { id: linaU.id, name: linaU.name, email: linaU.email });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); }, lina.user);
    /* six of ours, settled in round 1 */
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
    /* their two asks */
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
    /* Lina's suggestion on clause 5, from her own seat */
    const lp = await login(b, h.base, 'lina@lindqvist.example', 'their-own-pass-9', errs);
    const sg = await lp.evaluate(async () => { const c = getContract('MK-0382'); c._loaded = false; await ensureFull(c);
      const k5 = negoClauseList(c).find(x => /capped at 10%/.test(String(x.text || '')));
      const ch = await negoEditClause(c, k5.clauseId, '<p>If the Supplier misses a service level, the Customer receives service credits, capped at 15% of the monthly fees.</p>', { side: 'owner', author: 'Lina Ek', why: 'Their on-time rate fell to 91% last quarter.' });
      if (window.persist) persist(c); if (window.flushSaves) await flushSaves(); return ch ? { id: ch.id, sg: !!ch.suggested } : null; });
    check('0  seed: Lina\'s change is a suggestion', !!(sg && sg.sg), JSON.stringify(sg));
    await lp.context().close();
    /* Erik holds clause 11; Erik and Lina are on the contract */
    const k11 = cls.find(x => /within 30 days/.test(x.text)).id;
    await erik.client.json('/api/contracts/MK-0382/lock', { method: 'POST', body: { clauseId: k11 } });
    await erik.client.json('/api/contracts/MK-0382/here', { method: 'POST', body: {} }).catch(() => {});
    await lina.client.json('/api/contracts/MK-0382/here', { method: 'POST', body: {} }).catch(() => {});
    await page.evaluate(async () => { const c = getContract('MK-0382'); c._loaded = false; await ensureFull(c); });
    await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-0382', 'copilot'); });
    await waitFor(page, () => !!document.getElementById('ig-canvas'), 10000);
    await page.evaluate(() => pdRedOpen('MK-0382'));
    const up = await waitFor(page, () => !!document.querySelector('#pd-redface [data-nego-card]'), 10000);
    check('0  the Redlines face is up beside the paper', !!up);
    await waitFor(page, () => document.querySelectorAll('#pd-redface [data-pz-slot="redlines"] .pz-face, #pd-redface [data-pz-slot="redlines"] [data-pz-follow]').length >= 2, 8000);

    /* 1 the panel's row */
    const row = await page.evaluate(() => {
      const head = document.querySelector('#ig-dock .igd-head') || document.querySelector('#ig-dock');
      const tabs = [...head.querySelectorAll('[data-pd-tab]')].map(t => t.getAttribute('data-pd-tab'));
      const word = head.querySelector('[data-pd-face-w]'); const back = head.querySelector('[data-pd-back]');
      const face = document.getElementById('pd-redface');
      const x = face ? [...face.querySelectorAll('button')].filter(bt => (bt.textContent || '').trim() === '×' && bt.offsetParent).length : -1;
      const chips = document.querySelector('#ig-dock [data-ig-chips]');
      return { tabs, word: word ? word.textContent.trim() : null, back: back ? back.textContent.trim() : null, backFace: back && back.getAttribute('data-pd-back'),
        x, chips: chips ? getComputedStyle(chips).display : 'none' };
    });
    check('1a the row: only Jambo\'s tab, then the face\'s word "Redlines"', row.tabs.join() === 'copilot' && row.word === 'Redlines', JSON.stringify(row));
    check('1b "‹ Jambo" at the row\'s end, for this face', /Jambo/.test(row.back || '') && row.backFace === 'red', row.back);
    check('1c the face\'s head draws no ×', row.x === 0, String(row.x));
    check('1d no chips under the face', row.chips === 'none', row.chips);

    /* 2 the head */
    const head = await page.evaluate(() => {
      const f = document.getElementById('pd-redface'); const q = s => f.querySelector(s);
      const title = q('.rl-idx-top') ? q('.rl-idx-top').innerText : '';
      const n = (title.match(/Redlines\s*(\d+)/) || [])[1];
      const inSight = [...f.querySelectorAll('[data-rl-pile]:not(.rl-pile-quiet) [data-nego-card]')].length;
      const notes = q('[data-rl-notes-all]'); const here = q('.rl-head-here'); const round = q('.rl-round-at');
      const send = q('.rl-unsent-go[data-redline-proxy="nego-send"]'); const rv = q('[data-rl-review-go]');
      const faces = here ? here.querySelectorAll('[data-pz-slot] .pz-face, [data-pz-slot] [data-pz-follow]').length : 0;
      return { n: n == null ? null : Number(n), inSight, notes: notes ? notes.innerText.replace(/\s+/g, ' ').trim() : null,
        here: here ? here.innerText.replace(/\s+/g, ' ').trim() : null, hereShown: !!(here && here.offsetParent), faces,
        round: round ? round.textContent.trim() : null, send: send ? send.innerText.replace(/\s+/g, ' ').trim() : null,
        review: rv ? rv.innerText.trim() : null, reviewOn: !!(rv && !rv.disabled) };
    });
    check('2a "Redlines N" counts the rows in sight', head.n != null && head.n === head.inSight && head.n === 4, JSON.stringify({ n: head.n, inSight: head.inSight }));
    check('2b "Notes 2" in the head', head.notes === 'Notes 2', head.notes);
    check('2c "Here now" with the faces of who is on it', head.hereShown && /^Here now/.test(head.here || '') && head.faces >= 2, JSON.stringify({ here: head.here, faces: head.faces }));
    check('2d "Round 2 · their asks came 4 days ago"', head.round === 'Round 2 · their asks came 4 days ago', head.round);
    check('2e "Send all · 1 not sent" and "Ask for review"', /Send all\s*·\s*1 not sent/.test(head.send || '') && head.review === 'Ask for review' && head.reviewOn, JSON.stringify({ send: head.send, review: head.review }));

    /* 3 the piles */
    const piles = await page.evaluate(() => [...document.querySelectorAll('#pd-redface [data-rl-pile]')].map(p => {
      const hd = p.querySelector('.rl-band'); const cs = getComputedStyle(p);
      return { band: p.getAttribute('data-rl-pile'), head: hd ? hd.innerText.replace(/\s+/g, ' ').trim() : '', boxed: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0,
        rows: p.querySelectorAll('[data-nego-card]').length };
    }));
    const order = piles.map(p => p.band);
    check('3a the piles in order: waiting on you, Lina suggests, our drafts, settled', order.slice(0, 4).join() === 'awaiting,suggest,drafts,accepted', order.join());
    check('3b each pile a box with a line round it', piles.length >= 4 && piles.every(p => p.boxed), JSON.stringify(piles.map(p => [p.band, p.boxed])));
    const ph = Object.fromEntries(piles.map(p => [p.band, p.head]));
    check('3c the heads say it: "Waiting on you 2", "Lina suggests 1", "Your drafts, not yet sent 1", "Settled in round 1 6"',
      /^Waiting on you 2$/.test(ph.awaiting || '') && /^Lina suggests 1$/.test(ph.suggest || '') && /^Your drafts, not yet sent 1$/.test(ph.drafts || '') && /^Settled in round 1 6/.test(ph.accepted || ''), JSON.stringify(ph));

    /* 4 the rows */
    const rows = await page.evaluate(() => {
      const f = document.getElementById('pd-redface');
      const cardOf = re => [...f.querySelectorAll('[data-nego-card]')].find(el => re.test(el.innerText));
      const said = el => el ? {
        by: (el.querySelector('.rl-card-by') || {}).textContent || '', notes: el.querySelector('.rl-card-notes') ? el.querySelector('.rl-card-notes').innerText.replace(/\s+/g, ' ').trim() : '',
        ex: el.querySelector('.rl-card-ex') ? el.querySelector('.rl-card-ex').innerText.replace(/\s+/g, ' ').trim() : '',
        del: [...el.querySelectorAll('.rl-card-ex del')].map(x => x.textContent.trim()), ins: [...el.querySelectorAll('.rl-card-ex ins')].map(x => x.textContent.trim()),
        why: (el.querySelector('.rl-card-whyq') || {}).textContent || '', verbs: [...el.querySelectorAll('.rl-card-verbs button')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
        lock: el.querySelector('.rl-card-lock') ? el.querySelector('.rl-card-lock').innerText.replace(/\s+/g, ' ').trim() : '',
        locked: [...el.querySelectorAll('.rl-card-verbs .is-locked')].map(x => ({ t: x.textContent.trim(), mono: !!x.querySelector('.rl-lock-mono'), dis: x.disabled })) } : null;
      return { seven: said(cardOf(/Liability/i)), eleven: said(cardOf(/Payment/i)), nine: said(cardOf(/Data protection/i)), five: said(cardOf(/Service levels/i)) };
    });
    const r7 = rows.seven || {}, r11 = rows.eleven || {}, r9 = rows.nine || {};
    check('4a the whole name and when: "Anna Holm · 4 days ago"; ours "You · today"', r7.by === 'Anna Holm · 4 days ago' && r11.by === 'Anna Holm · 4 days ago' && r9.by === 'You · today', JSON.stringify([r7.by, r11.by, r9.by]));
    check('4b "2 notes" on the clause 7 row', r7.notes === '2 notes', r7.notes);
    check('4c the changed words cut around the edit, with their marks', /^… .*capped at 50% 100% of the fees paid in that year\.$/.test(r7.ex || '') && (r7.del || []).join() === '50%' && (r7.ins || []).join() === '100%', JSON.stringify(r7.ex));
    check('4d the reason they gave under it', /Standard in our contracts\./.test(r7.why || ''), r7.why);

    /* 5 the lock line */
    check('5a "Erik is editing this clause" with Ask for it', /Erik is editing this clause/.test(r11.lock || '') && /Ask for it/.test(r11.lock || ''), r11.lock);
    const ctr = (r11.locked || []).find(x => /Counter/.test(x.t));
    check('5b the locked row\'s Counter is grey and plain', !!(ctr && ctr.dis && !ctr.mono), JSON.stringify(r11.locked));
    await page.click('#pd-redface .rl-card-lock [data-rl-lock-ask]');
    const asked = await waitFor(page, () => { const l = document.querySelector('#pd-redface .rl-card-lock'); return l && /Asked/.test(l.innerText) && !l.querySelector('[data-rl-lock-ask]') ? l.innerText.replace(/\s+/g, ' ').trim() : null; }, 8000);
    check('5c Ask for it, pressed, says Asked (and the ask reached the lock)', !!asked, asked);

    /* 7 our draft */
    check('7  our draft: Edit · Send · Review · Ladder · Discard last', ['Edit', 'Send', 'Review', 'Ladder', 'Discard last'].every(v => (r9.verbs || []).includes(v)), JSON.stringify(r9.verbs));

    /* 6 Lina's row */
    const r5 = rows.five || {};
    check('6a Lina\'s row: Adopt · Hand back · Ladder', ['Adopt', 'Hand back', 'Ladder'].every(v => (r5.verbs || []).includes(v)) && r5.by === 'Lina Ek · today', JSON.stringify([r5.verbs, r5.by]));
    await page.click('#pd-redface [data-rl-pile="suggest"] [data-dk-adopt]');
    const moved = await waitFor(page, () => { const f = document.getElementById('pd-redface');
      const d = f.querySelector('[data-rl-pile="drafts"]'); return !f.querySelector('[data-rl-pile="suggest"]') && d && /Service levels/i.test(d.innerText) ? d.querySelectorAll('[data-nego-card]').length : null; }, 8000);
    check('6b Adopt moves it to our drafts; the suggestion pile is gone', moved === 2, String(moved));

    /* 8 the settled fold */
    const fold = async () => page.evaluate(() => { const b = document.querySelector('#pd-redface [data-rl-settled-fold]');
      const rowsShown = [...document.querySelectorAll('#pd-redface [data-rl-pile="accepted"] [data-nego-card]')].filter(el => el.offsetParent && el.getBoundingClientRect().height > 0).length;
      return { ex: b && b.getAttribute('aria-expanded'), rowsShown }; });
    const f0 = await fold();
    check('8a settled is shut: its six rows are not drawn', f0.ex === 'false' && f0.rowsShown === 0, JSON.stringify(f0));
    await page.click('#pd-redface [data-rl-settled-fold]'); await pause(150);
    const f1 = await fold();
    check('8b a press opens it', f1.ex === 'true' && f1.rowsShown === 6, JSON.stringify(f1));
    await page.click('#pd-redface [data-rl-settled-fold]'); await pause(150);
    const f2 = await fold();
    check('8c a press again shuts it', f2.ex === 'false' && f2.rowsShown === 0, JSON.stringify(f2));

    /* 9 the head's doors */
    /* RE-POINTED 18 Oct 2026 (round 9's gaps, second pass: "The notes open in
       the same panel"): Notes turns the column's body to the notes — no
       drawer — and the same press turns it back to the piles */
    await page.click('#pd-redface [data-rl-notes-all]');
    const notesUp = await waitFor(page, () => !!document.querySelector('#pd-redface .rl-fn[data-rl-fn="MK-0382"]') && !(state.panelOpen && panelFace() === 'notes'), 5000);
    check('9a Notes opens the notes in the column, not the drawer', !!notesUp);
    await page.click('#pd-redface [data-rl-notes-all]');
    await waitFor(page, () => !document.querySelector('#pd-redface .rl-fn') && !!document.querySelector('#pd-redface [data-rl-pile]'), 5000);
    await page.click('#pd-redface [data-rl-review-go]');
    const rvUp = await waitFor(page, () => { const m = document.querySelector('#modal-root'); return m && (m.querySelector('[data-rv-entry]') || m.querySelector('[data-rv-pick], .rv-pick, #rv-ask-send')) ? m.innerText.replace(/\s+/g, ' ').slice(0, 80) : null; }, 5000);
    check('9b Ask for review opens the review\'s own chooser', !!rvUp, rvUp);
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });

    /* 10 three screens */
    await page.evaluate(() => { const s = document.querySelector('#pd-redface #nego-cards'); if (s) s.scrollTop = 0; });
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht }); await pause(500);
      const fit = await page.evaluate(() => { const f = document.getElementById('pd-redface'); const d = document.getElementById('ig-dock');
        const r = f.getBoundingClientRect(), dr = d.getBoundingClientRect();
        const wide = [...f.querySelectorAll('*')].filter(el => { const q = el.getBoundingClientRect(); return q.width && q.right > dr.right + 1; }).length;
        const send = f.querySelector('.rl-unsent-go'); const sr = send ? send.getBoundingClientRect() : null;
        return { inDock: r.left >= dr.left - 1 && r.right <= dr.right + 1, wide, sideways: document.documentElement.scrollWidth > innerWidth,
          sendSeen: !!(sr && sr.top >= 0 && sr.bottom <= innerHeight) }; });
      check(`10 ${w}×${ht}: the face in the panel, nothing past its edge, Send all in view`, fit.inDock && fit.wide === 0 && !fit.sideways && fit.sendSeen, JSON.stringify(fit));
      await shot(page, `9-redlines-${w}x${ht}`);
    }
    check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { check('the walk ran to its end', false, e && e.stack); }
  finally { await b.close(); await h.stop(); }
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
