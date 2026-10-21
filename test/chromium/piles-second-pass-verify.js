/* PILES, THE SECOND PASS (round 9's gaps, 18 Oct 2026: the adversarial
   checker's differences against the picked drawing "Piles" and its "E · Where
   Edit lands"), driven in a real browser on Nordvik's round 2 — their two asks
   (clause 7 and clause 11, Erik holding 11), our change on 9, Lina's suggestion
   on 5, six settled in round 1:
     1 inside "Waiting on you" the paper's order: 7 before 11; each clause named
       as the paper prints it ("7. Liability cap"); "Redlines 4" in a grey pill;
       nothing under the settled fold; no step chips on Home's paper; the box
       says "Ask for a number, a list or a contract…"
     2 Notes opens the notes IN the column: "Internal 2" with its lock, the
       party's tab, "‹ Redlines"; a note as "Maria Lindgren · clause 7 · …"
       with its words in a bubble; the clause is a link to the paper; "Write
       to Internal… type @ to name someone" and Post files a note; ‹ Redlines
       and a second press on Notes both bring the piles back
     3 Counter on clause 7 lands on the editor as drawn: ‹ Redlines, "Counter ·
       7. Liability cap", "Nordvik asks 100% · back lands on the same row",
       B I U • 1. ⇤ ⇥, Exit; the context line; clause 7 alone in its box with
       "Step 2 · your counter · saved as you type, not sent", clause 8 dimmed;
       Playbook · Risks · Ladder; "What they asked" with "— Anna Holm"; Ask
       Jambo with its cost before the press; "‹ 1 of 2 of their asks ›" and
       Save; › onto Erik's clause is said and the page stays; ‹ Redlines lands
       on the clause 7 row, lit
     4 the owner's three screens: the face, the notes and the editor fit,
       nothing sideways, the editor's head one row
   At b1ea174 (this lane's previous pass) every part of 1–3 FAILS.
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/piles-second-pass-verify.js */
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

    /* 1 the column and the paper */
    const one = await page.evaluate(() => {
      const f = document.getElementById('pd-redface');
      const aw = f.querySelector('[data-rl-pile="awaiting"]');
      const names = aw ? [...aw.querySelectorAll('[data-nego-card] .rl-card-meta')].map(e => e.textContent.replace(/\s+/g, ' ').trim()) : [];
      const pill = f.querySelector('.rl-idx-title i'); const ps = pill ? getComputedStyle(pill) : null;
      const rungs = [...document.querySelectorAll('#ig-canvas .rl-rung')].filter(e => e.getClientRects().length).length;
      return { names, pill: ps ? { bg: ps.backgroundColor, r: parseFloat(ps.borderTopLeftRadius) } : null, risks: !!f.querySelector('#rl-risks'),
        lastPile: [...f.querySelectorAll('#rl-changes > [data-rl-pile]')].map(p => p.getAttribute('data-rl-pile')).pop(),
        after: (() => { const ch = f.querySelector('#rl-changes'); let n = ch && ch.nextElementSibling, t = '';
          while (n){ if (n.getClientRects().length) t += n.textContent.trim(); n = n.nextElementSibling; } return t.slice(0, 60); })(),
        rungs, ph: (document.getElementById('igd-input') || {}).placeholder };
    });
    check('1a inside "Waiting on you" the paper\'s order: 7. Liability cap, then 11. Payment terms', one.names.join('|') === '7. Liability cap|11. Payment terms', JSON.stringify(one.names));
    /* RE-POINTED 21 Oct 2026 (Chambers): the count beside the name is a plain number */
    check('1b "Redlines 4" is a plain number beside the name, no pill', !!one.pill && one.pill.bg === 'rgba(0, 0, 0, 0)' && one.pill.r === 0, JSON.stringify(one.pill));
    /* RE-POINTED 20 Oct 2026 (owner, 19 Oct: the risk cards back under the piles beside the paper) */
    check('1c under the settled fold only "Risks to look at"', one.risks && one.lastPile === 'accepted' && /^Risks to look at/.test(one.after), JSON.stringify({ risks: one.risks, last: one.lastPile, after: one.after }));
    check('1d Home\'s paper draws no step chips while Redlines is open', one.rungs === 0, String(one.rungs));
    check('1e the box asks "Ask for a number, a list or a contract…"', one.ph === 'Ask for a number, a list or a contract…', one.ph);

    /* 2 the notes in the column */
    await page.click('#pd-redface [data-rl-notes-all]');
    const nv = await waitFor(page, () => { const v = document.querySelector('#pd-redface .rl-fn'); if (!v) return null;
      return { tabs: [...v.querySelectorAll('.rl-fn-tab')].map(t => ({ t: t.innerText.replace(/\s+/g, ' ').trim(), lock: !!t.querySelector('svg'), on: t.classList.contains('on') })),
        back: ((document.querySelector('#ig-dock > .pd-trail') || {}).textContent || ''),  /* ONE TRAIL: the back is the trail's (20 Oct 2026) */ lines: [...v.querySelectorAll('.rl-fn-line')].map(l => l.innerText.replace(/\s+/g, ' ').trim()),
        say: [...v.querySelectorAll('.rl-fn-say')].map(s => s.textContent.trim()), ph: (v.querySelector('.rl-fn-in') || {}).placeholder,
        post: (v.querySelector('[data-rl-fn-post]') || {}).textContent, piles: !!(document.querySelector('#pd-redface #rl-changes') || {}).hidden,
        drawer: !!(state.panelOpen && panelFace() === 'notes'), pressed: document.querySelector('#pd-redface [data-rl-notes-all]').getAttribute('aria-pressed') }; }, 6000);
    check('2a Notes opens the notes in the column (no drawer), the button pressed', !!nv && nv.piles && !nv.drawer && nv.pressed === 'true', JSON.stringify(nv && { piles: nv.piles, drawer: nv.drawer, pressed: nv.pressed }));
    check('2b the rooms as tabs: "Internal 2" with its lock (on), the party\'s tab, "‹ Redlines"', !!nv && nv.tabs.length === 2 && /^Internal 2$/.test(nv.tabs[0].t) && nv.tabs[0].lock && nv.tabs[0].on
      && /^Nordvik Logistik AB 0$/.test(nv.tabs[1].t) && /Redlines[\s\S]*Notes/.test(nv.back || ''), JSON.stringify(nv && [nv.tabs, nv.back]));
    check('2c each note "Name · clause 7 · when" with its words in a bubble', !!nv && nv.lines.length === 2 && nv.lines.every(l => /^Maria Lindgren · clause 7 · today$/.test(l))
      && nv.say.join('|') === 'Their cap doubles our exposure.|Ask Sara before we move.', JSON.stringify(nv && [nv.lines, nv.say]));
    check('2d "Write to Internal… type @ to name someone" and Post', !!nv && nv.ph === 'Write to Internal… type @ to name someone' && /^Post$/.test((nv.post || '').trim()), JSON.stringify(nv && [nv.ph, nv.post]));
    await shot(page, '9-notes-1440x780');
    await page.click('#pd-redface .rl-fn [data-rl-fn-clause]');
    /* RE-POINTED 19 Oct 2026 (LAND ON IT, main's rule): the link lands on the clause through the one lander */
    check('2e the clause is a link to it on the paper', !!(await waitFor(page, () => !!document.querySelector('#ig-paper .is-landed[data-clause]'), 4000)));
    await page.fill('#pd-redface .rl-fn-in', 'Finance can live with 45 days. Not 60.');
    await page.click('#pd-redface [data-rl-fn-post]');
    const posted = await waitFor(page, () => { const v = document.querySelector('#pd-redface .rl-fn'); const c = getContract('MK-0382');
      const own = (c.thread || []).filter(m => /Finance can live with 45 days/.test(m.text || ''));
      return v && own.length === 1 && own[0].visibility !== 'shared' && /Internal 3/.test(v.querySelector('.rl-fn-tab').innerText.replace(/\s+/g, ' '))
        && [...v.querySelectorAll('.rl-fn-say')].some(s => /Finance can live with 45 days/.test(s.textContent)) ? true : null; }, 8000);
    check('2f Post files one internal note through the drawer\'s own send, and it shows', !!posted);
    await page.click('#ig-dock > .pd-trail [data-pd-back="red-notes"]');
    check('2g ‹ Redlines brings the piles back', !!(await waitFor(page, () => !document.querySelector('#pd-redface .rl-fn') && !!document.querySelector('#pd-redface [data-rl-pile="awaiting"]'), 5000)));
    await page.click('#pd-redface [data-rl-notes-all]');
    await waitFor(page, () => !!document.querySelector('#pd-redface .rl-fn'), 5000);
    await page.click('#pd-redface [data-rl-notes-all]');
    check('2h a second press on Notes closes them', !!(await waitFor(page, () => !document.querySelector('#pd-redface .rl-fn'), 5000)));

    /* 3 Counter on clause 7: the editor as drawn */
    await page.evaluate(() => { const card = [...document.querySelectorAll('#pd-redface [data-nego-card]')].find(c => /Liability cap/.test(c.innerText));
      const b = card && card.querySelector('[data-rl-cp-editor-row]'); if (b) b.click(); });
    const ed = await waitFor(page, () => { const p = document.getElementById('clause-editor'); if (!p || !p.classList.contains('ce-rowmode')) return null;
      const doc = document.getElementById('ce-doc');
      const shown = [...doc.querySelectorAll('[data-clause]')].filter(e => e.getClientRects().length && !e.parentElement.closest('[data-clause]'));
      return { head: (document.getElementById('ce-rowhead') || {}).innerText, bar: [...document.querySelectorAll('#ce-bar [data-rb]')].map(b => b.getAttribute('data-rb')).join(','),
        exit: !!(p.querySelector('[data-ce-act="close"]') && p.querySelector('[data-ce-act="close"]').getClientRects().length), ctx: (doc.querySelector('.ce-row-ctx') || {}).textContent,
        shown: shown.map(e => e.querySelector('h4, .rl-clause-h') ? e.querySelector('h4, .rl-clause-h').textContent.trim() : e.getAttribute('data-clause')),
        step: (doc.querySelector('.ce-row-on .ce-row-is') || {}).textContent, boxEdge: (() => { const b = doc.querySelector('.ce-row-on #ce-clausebody'); return b ? parseFloat(getComputedStyle(b).borderTopWidth) : null; })(),
        dim: (() => { const n = doc.querySelector('.ce-row-next'); return n ? Number(getComputedStyle(n).opacity) : null; })(),
        tabs: [...document.querySelectorAll('#ce-tabs [data-ce-tab]')].map(b => b.getAttribute('data-ce-tab')),
        lane: (document.getElementById('ce-lane') || {}).innerText, foot: (document.getElementById('ce-railfoot') || {}).innerText,
        cost: (document.querySelector('#ce-lane .ce-row-jb .cost') || {}).textContent, ask: !!document.querySelector('#ce-lane .ce-row-jb [data-ce-chip]'),
        rowH: Math.round(document.querySelector('#clause-editor .ce-barrow').getBoundingClientRect().height) }; }, 8000);
    /* RE-POINTED 20 Oct 2026 (owner: the whole contract, the way back the
       panel's, the old rail, no blue box): from a row the editor is as it was
       before, with ONE TRAIL's back on its own row above the full shelf */
    check('3a the head: the trail "‹ Redlines · Jambo / Redlines / Counter · 7. Liability cap", no Exit',
      !!ed && /Redlines[\s\S]*Jambo\s*\/\s*Redlines\s*\/\s*Counter · 7\. Liability cap/.test(ed.head || '') && !ed.exit, JSON.stringify(ed && [ed.head, ed.exit]));
    check('3b the full shelf, as before', !!ed && /bold,italic,underline/.test(ed.bar) && ed.bar.split(',').length > 7, ed && ed.bar);
    check('3c the whole paper: no context line, every clause drawn, none dimmed', !!ed && !ed.ctx && ed.shown.length > 2 && ed.dim == null, JSON.stringify(ed && [ed.ctx, ed.shown.length, ed.dim]));
    check('3d the clause says "Your counter · nothing is filed until you save", no blue box round it', !!ed && ed.step === 'Your counter · nothing is filed until you save' && !ed.boxEdge, JSON.stringify(ed && [ed.step, ed.boxEdge]));
    check('3e the rail: Playbook · Risks · Ladder', !!ed && ed.tabs.join() === 'chat,risks,ladder', JSON.stringify(ed && ed.tabs));
    check('3f the rail as before: the ladder card leads ("What moved"), no row cards', !!ed && /What moved/.test(ed.lane || '') && !ed.ask, JSON.stringify(ed && ed.lane));
    check('3g the foot: "‹ 1 of 2 of their asks ›" and Save', !!ed && /1 of 2 of their asks/.test(ed.foot || '') && /Save/.test(ed.foot || ''), JSON.stringify(ed && ed.foot));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht }); await pause(400);
      const fit = await page.evaluate(() => ({ rowH: Math.round(document.querySelector('#clause-editor .ce-barrow').getBoundingClientRect().height), sideways: document.documentElement.scrollWidth > innerWidth }));
      /* RE-POINTED 20 Oct 2026: the trail's row above the shelf's — two rows, nothing sideways */
      check(`4 ${w}×${ht}: the editor's head is the trail row and the shelf's row, nothing sideways`, fit.rowH <= 110 && !fit.sideways, JSON.stringify(fit));
      await shot(page, `9E-counter-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await pause(300);
    await page.click('#ce-railfoot [data-ce-act="walk-next"]');
    const stay = await waitFor(page, () => !!document.getElementById('clause-editor') && /Liability cap/.test((document.getElementById('ce-rowhead') || {}).innerText || '')
      && [...document.querySelectorAll('.toast, [data-toast], #toast-root *')].some(t => /Erik/.test(t.textContent)), 5000);
    check('3h › onto the clause Erik holds is said, and the page stays', !!stay);
    await page.click('#ce-rowhead [data-ce-act="row-back"]');
    const lit = await waitFor(page, () => { const el = document.querySelector('#pd-redface .is-linked[data-nego-card]'); return !document.getElementById('clause-editor') && el && /Liability cap/.test(el.innerText) ? true : null; }, 6000);
    check('3i ‹ Redlines lands on the clause 7 row, lit', !!lit);

    /* 4 the face and the notes at the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]){
      await page.setViewportSize({ width: w, height: ht }); await pause(400);
      const fit = await page.evaluate(() => { const d = document.getElementById('ig-dock').getBoundingClientRect(); const f = document.getElementById('pd-redface');
        return { wide: [...f.querySelectorAll('*')].filter(el => { const q = el.getBoundingClientRect(); return q.width && q.right > d.right + 1; }).length, sideways: document.documentElement.scrollWidth > innerWidth }; });
      check(`4 ${w}×${ht}: the face fits beside the paper`, fit.wide === 0 && !fit.sideways, JSON.stringify(fit));
      await shot(page, `9-piles-${w}x${ht}`);
      await page.click('#pd-redface [data-rl-notes-all]'); await waitFor(page, () => !!document.querySelector('#pd-redface .rl-fn'), 4000);
      const nfit = await page.evaluate(() => { const d = document.getElementById('ig-dock').getBoundingClientRect(); const f = document.getElementById('pd-redface');
        return { wide: [...f.querySelectorAll('*')].filter(el => { const q = el.getBoundingClientRect(); return q.width && q.right > d.right + 1; }).length }; });
      check(`4 ${w}×${ht}: the notes fit in the panel`, nfit.wide === 0, JSON.stringify(nfit));
      await shot(page, `9-notes-${w}x${ht}`);
      await page.click('#pd-redface [data-rl-notes-all]'); await waitFor(page, () => !document.querySelector('#pd-redface .rl-fn'), 4000);
    }
    check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e) { check('the walk ran to its end', false, e && e.stack); }
  finally { await b.close(); await h.stop(); }
  console.log(failures ? `${failures} FAILED` : 'ALL PASSED');
  process.exit(failures ? 1 : 0);
})();
