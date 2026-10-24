/* ONE SHADE, ONE CARD AT A TIME (owner, 23 Oct 2026: "when hovering over the worth a look, do not underline
   the words but at least shade the card a different color … when you have clicked on it, the color stay on it
   until you move and remove the outline around the card … only highlight one at a time … delete the hide why
   feature from worth a look … make the design for 'settled this round' look the same as 'covered by your
   redlines'"), driven on Nordvik's round 2 beside Home's paper (the staging is piles-second-pass-verify's):
     1 a redline row pressed is shaded, with no ring; the pointer gone, the shade stays
     2 a risk card under the pointer is shaded and the pressed row lets its shade go: one card lit; its title
       is not underlined
     3 a risk card pressed takes the shade from the row (one lit), no ring
     4 no Why / Hide why press on any risk card
     5 the settled fold wears the Covered fold's dress: the accent ink, the same size, "(N)" and its arrow
   Run: node test/chromium/one-shade-verify.js */
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

    const CARD_GROUND = await page.evaluate(() => { const e = document.createElement('i'); e.style.background = 'var(--color-bg)'; document.body.appendChild(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c; });
    /* 24 Oct 2026 (owner): a card under "Risks to look at" rests on a very light amber, its own ground */
    const LOOK_GROUND = await page.evaluate(() => { const e = document.createElement('i'); e.style.background = 'color-mix(in srgb, var(--st-amber-bg) 55%, var(--color-surface))'; document.body.appendChild(e); const c = getComputedStyle(e).backgroundColor; e.remove(); return c; });
    const lit = () => page.evaluate(([ground, look]) => [...document.querySelectorAll('#pd-redface :is(.rl-card-d, .rk-row)')]
      .map(e => ({ k: e.getAttribute('data-nego-card') || e.getAttribute('data-rk-key') || '', bg: getComputedStyle(e).backgroundColor, ring: getComputedStyle(e).boxShadow !== 'none', on: e.classList.contains('is-linked') }))
      /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK, stage 2: each redline change is its own soft grey card,
         the owner's pick of the drawing): a card at rest wears the card ground (--color-bg), so "lit" is a
         shade OTHER than the ground and other than none — the relation, not a colour */
      .filter(x => (x.bg !== 'rgba(0, 0, 0, 0)' && x.bg !== ground && x.bg !== look) || x.ring), [CARD_GROUND, LOOK_GROUND]);
    await page.evaluate(() => { const r = document.querySelector('#pd-redface [data-rk-act="run"]'); if (r) r.click(); });
    await waitFor(page, () => !!document.querySelector('#pd-redface .rk-row:not(.is-none):not(.is-covered)'), 8000);
    /* 1 */
    const card = await page.$('#pd-redface [data-nego-card] .rl-card-meta');
    if (card){ await page.click('#pd-redface [data-nego-card] .rl-card-meta'); await pause(500); await page.mouse.move(5, 5); await pause(300); }
    const L1 = card ? await lit() : null;
    check('1  a pressed redline row is shaded, with no ring, and stays shaded with the pointer gone', !!L1 && L1.length === 1 && L1[0].on && !L1[0].ring && /^CHG-/.test(L1[0].k), JSON.stringify(L1));
    /* 2 */
    const rk = await page.$('#pd-redface .rk-row:not(.is-none):not(.is-covered)');
    if (rk){ await page.hover('#pd-redface .rk-row:not(.is-none):not(.is-covered) .rk-head'); await pause(300); }
    const L2 = rk ? await lit() : null;
    const ul = rk ? await page.evaluate(() => getComputedStyle(document.querySelector('#pd-redface .rk-row:not(.is-none):not(.is-covered) .rk-t')).textDecorationLine) : null;
    check('2  a risk card under the pointer is shaded and the pressed row lets go: one card lit, its title not underlined',
      !!L2 && L2.length === 1 && !/^CHG-/.test(L2[0].k) && !L2[0].ring && ul === 'none', JSON.stringify({ L2, ul }));
    /* 3 */
    if (rk){ await page.click('#pd-redface .rk-row:not(.is-none):not(.is-covered) .rk-head'); await pause(500); await page.mouse.move(5, 5); await pause(300); }
    const L3 = rk ? await lit() : null;
    check('3  a pressed risk card takes the shade from the row: one lit, no ring', !!L3 && L3.length === 1 && L3[0].on && !/^CHG-/.test(L3[0].k) && !L3[0].ring, JSON.stringify(L3));
    /* 3b (owner, 24 Oct 2026): the risk cards are very light amber with no white box inside; the pressed one
       is a deeper amber; the change cards above them keep their grey */
    const rkLook = await page.evaluate(() => { const rows = [...document.querySelectorAll('#pd-redface .rk-row:not(.is-none):not(.is-covered)')];
      const on = rows.find(r => r.classList.contains('is-linked')), rest = rows.find(r => !r.classList.contains('is-linked'));
      const g = e => e ? getComputedStyle(e).backgroundColor : null;
      return { rest: g(rest), on: g(on), why: g(rest && rest.querySelector('.rk-why')), card: g(document.querySelector('#pd-redface [data-nego-card]:not(.is-linked)')) }; });
    const amb = c => { const k = /^color\(srgb/.test(String(c || '')) ? 255 : 1; const v = (String(c || '').match(/[\d.]+/g) || []).map(Number).map((x, i) => i < 3 ? x * k : x);
      return v.length >= 3 && (v.length < 4 || v[3] > 0) && v[0] > v[1] && v[1] > v[2] && v[0] > 240; };
    check('3b the risk cards are very light amber with no box inside, the pressed one a deeper amber; the change cards keep their grey',
      rkLook.rest === LOOK_GROUND && amb(rkLook.on) && rkLook.on !== rkLook.rest && /rgba\(0, 0, 0, 0\)/.test(rkLook.why || '') && rkLook.card === CARD_GROUND, JSON.stringify(rkLook));
    /* 4 */
    const why = await page.evaluate(() => ({ cards: document.querySelectorAll('#pd-redface .rk-row:not(.is-none):not(.is-covered)').length,
      presses: document.querySelectorAll('#pd-redface [data-rk-act="why"], #pd-redface .rk-why-btn').length, open: document.querySelectorAll('#pd-redface .rk-row .rk-why').length }));
    check('4  no Why or Hide why press on a risk card; each reason is open', why.cards > 0 && why.presses === 0 && why.open >= why.cards, JSON.stringify(why));
    /* 5 */
    const fold = await page.evaluate(() => { const b = document.querySelector('#pd-redface button.rl-band-fold'), cv = document.querySelector('#pd-redface .rk-cov-t');
      if (!b) return null; const s = getComputedStyle(b), n = b.querySelector('b'), i = b.querySelector('i');
      return { color: s.color, size: s.fontSize, weight: s.fontWeight, open: n ? getComputedStyle(n, '::before').content : '', arrow: i ? getComputedStyle(i).display : '',
        cv: cv ? { color: getComputedStyle(cv).color, size: getComputedStyle(cv).fontSize, weight: getComputedStyle(cv).fontWeight } : null,
        /* the accent ink as the page resolves it (re-pointed 23 Oct 2026, THE LEGORA LOOK: the RELATION, not Chambers' literal green) */
        ink: (() => { const p = document.createElement('i'); p.style.color = 'var(--accent-ink)'; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })() }; });
    check('5  the settled fold wears the Covered fold\'s dress: accent ink, same size and weight, "(N)" and its arrow',
      !!fold && (!fold.cv || (fold.color === fold.cv.color && fold.size === fold.cv.size && fold.weight === fold.cv.weight)) && fold.color === fold.ink && /\(/.test(fold.open) && fold.arrow !== 'none', JSON.stringify(fold));
    await shot(page, 'one-shade-1440x780');
    check('no page errors', !errs.length, errs.join(' | '));
  } finally { await b.close(); await h.stop(); }
  console.log(failures ? `${failures} FAILED` : 'all passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
