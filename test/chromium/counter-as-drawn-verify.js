/* HOME (ONCE THE COUNTER) AND JAMBO'S WORK AS DRAWN — REBUILT FOR LAND ON IT
   (round 23's gaps, 18 Oct 2026: the owner's "build all the gaps" over the
   picked "Open in place", then LAND ON IT, which reversed "Open in place":
   "when you click on jambos work, it should take you to the jambos work card
   in the board", "remove the in-place list"; the Board KEEPS its Jambo's work
   card, the build's answer (14). The word stays "Put away"; js/views/counter.js,
   js/views/homeboard.js, js/views/agents.js, js/sharemail.js, js/views/jambohouse.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 Home's head as drawn: "What do you need, <name>?", the box's words, the
       chips "<first owed row> · contracts · calendar · draft a new agreement"
       (one dress), "each row's button opens its page"
     2 Home's Jambo's work row: "Jambo's work · N prepared · nothing sent or
       filed until you press", whose work it is, and Open — which LANDS ON the
       Board's Jambo's work card, lit; NO list of pieces in place on Home
     3 on the Board's card, where the pieces live: a chase's piece shows the
       email whole (To, Subject, the letter with the day in words, signed by
       the person, and "It goes to the address on the contract. You are asked
       once more before it is sent."); every piece of every agent ends its
       acts with Put away; the acts are named for what they do
     4 Put away a piece that is not the desk's: gone for this person, Undo
       brings it back, kept on the server, a colleague still has it, the work
       it is about still waits
     5 Put away a desk row (the chase): on the contract, Undo takes it back
     6 under the card's agents, "All seven agents: Ask me first · <who set it>
       for everyone" with Change for an admin; a member reads who set it and
       sends Ask an admin from the Board (the tracked ask), staying there
     7 Home's Needs you as drawn (an approval answered for somebody away,
       "Fill in N details", a note due, a request nobody holds, "waiting N
       days", "Show N more · <names>" last); a note's and a request's door
       LANDS ON its own row, lit
     8 it fits the owner's three screens: Home, and the Board with the chase open
    10 Jambo's house says the card's count; its "N waiting for you" lands on
       the Board's card (a room's: that agent's work below it); four and three
       rooms a floor, faces clear of words; Jambo folded to the right edge
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/counter-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
/* every date counted from today, so no answer depends on the day this runs */
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const BODY = ['MASTER SERVICES AGREEMENT', '', 'The supplier shall provide the services.', '',
  'Each party\'s liability is capped at 100% of the fees paid in that year.', '', 'Invoices are payable within 30 days.', '',
  'This agreement runs for two years.'].join('\n');
const C = [
  H.fixtureContract('MK-0382', 'Master services agreement', 'Nordvik Logistik', H.FOLDER_A, 4.2e6, 'Under Review', BODY),
  H.fixtureContract('MK-0405', 'Freight agreement', 'Baltic Freight', H.FOLDER_A, 1.1e6, 'Under Review', BODY),
  H.fixtureContract('MK-0377', 'Supply agreement', 'Brightwater Foods', H.FOLDER_A, 7.1e6, 'Signed'),
  { ...H.fixtureContract('MK-0368', 'Supply agreement', 'Kettle & Co', H.FOLDER_A, 2.4e6, 'Signed'), counterpartyEmail: 'insurance@kettle.example',
    obligations: [{ id: 'ob-k1', desc: 'the insurance certificate', due: day(-5), party: 'theirs', status: 'open' }] },
  H.fixtureContract('MK-0391', 'Lease Göteborg', 'Fastighets AB', H.FOLDER_A, 0.9e6, 'Under Review'),
  H.fixtureContract('MK-0392', 'NDA Kettle 2023', 'Kettle & Co', H.FOLDER_A, 0, 'Under Review'),
  H.fixtureContract('MK-0393', 'Freight terms', 'Baltic Freight', H.FOLDER_A, 0.3e6, 'Under Review'),
  H.fixtureContract('MK-0410', 'Power purchase agreement', 'Helio Energy AB', H.FOLDER_B, 8.1e6, 'Under Review', BODY),
  H.fixtureContract('MK-0412', 'Warehouse lease', 'Fastighets AB', H.FOLDER_A, 0.6e6, 'Under Review'),
  H.fixtureContract('MK-0413', 'Cleaning services', 'Städ AB', H.FOLDER_A, 0.2e6, 'Under Review'),
];
C[2].metadata = { ...(C[2].metadata || {}), expiryDate: day(40) }; C[2].expiry = day(40);
['Lease Göteborg.pdf', 'NDA Kettle 2023.docx', 'Freight terms scan.pdf'].forEach((f, i) => { C[4 + i].upload = { fileName: f }; });

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: C, approvalRules: [] });
  const U = W.users.unrestricted;
  const boot = await W.admin.json('/api/bootstrap');
  const adminId = (boot.me && boot.me.id) || ((boot.users || []).find(u => u.email === 'admin@example.co.ke') || {}).id;
  /* a rule names the colleague, who is away and leaves the admin to answer */
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r-ppa', name: 'Energy sign-off', order: 1,
    cond: { type: 'folder', value: H.FOLDER_B }, approver: { kind: 'member', id: U.id, name: U.name } }] } });
  await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: adminId, from: day(0), to: day(3) } });
  await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item: { body: 'Ask about the Kettle insurance before Friday', reviewBy: day(0) } } });
  await W.restricted.json('/api/intake', { method: 'POST', body: { title: 'NDA with Kettle & Co', need: 'We need a mutual NDA before the pilot.', counterparty: 'Kettle & Co', folder: H.FOLDER_A } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, n) => {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    /* the server's book, not the sample a signed-out page holds */
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0368') && window.currentUser && currentUser(), null, { timeout: 20000 });
    return page;
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1', C.length);
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what, pg) => { const p = pg || page; if (!(await p.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await p.locator(sel).first().click(); return true; };
    const toCounter = async pg => { const p = pg || page; await p.evaluate(() => setView('counter'));
      const t0 = Date.now(); while (Date.now() - t0 < 8000) { if (await p.evaluate(() => !!document.querySelector('#cn-needs .cn-jw'))) return true; await p.waitForTimeout(120); } return false; };

    /* the stage: their round on the master services agreement, read through the product's own funnel */
    const staged = await page.evaluate(async () => {
      const me = currentUser();
      const w = getContract('MK-0382');
      if (typeof ensureFull === 'function') await ensureFull(w);
      w.changes = []; delete w.negotiation; negoInit(w);
      const cls = negoClauseList(w).filter(x => x && x.clauseId && x.clauseId !== 'front');
      const txt = x => { const n = negoClauseNowById(w, x.clauseId); return String((n && (n.text || n.bodyHtml)) || ''); };
      for (const [re, from, to] of [[/capped at 100%/, '100%', '200%'], [/within 30 days/, '30 days', '60 days']]) {
        const cl = cls.find(x => re.test(txt(x))); if (!cl) continue;
        const now = negoClauseNowById(w, cl.clauseId);
        const body = (now && now.bodyHtml) || '<p>' + ((now && now.text) || '') + '</p>';
        await negoEditClause(w, cl.clauseId, body.replace(from, to), { side: 'counterparty', author: 'Nordvik Logistik' });
      }
      /* their round came in eight days ago: it has waited, as drawn ("waiting 4 days") */
      (w.changes || []).forEach(ch => { if (ch.authorSide === 'counterparty') ch.createdAt = new Date(Date.now() - 8 * 864e5).toISOString(); });
      persist(w);
      const p = getContract('MK-0405');
      p.triage = { at: new Date(Date.now() - 864e5).toISOString(), by: me.name, steps: {
        brief: { ok: true, line: 'A freight agreement' }, playbook: { ok: true, dev: 1, miss: 0, cats: ['Notice period'] },
        oblig: { ok: true, found: [{ desc: 'Monthly freight report', party: 'theirs' }, { desc: 'Pay the freight invoice', party: 'ours' }] } } };
      persist(p);
      ['MK-0391', 'MK-0392', 'MK-0393'].forEach(id => { const c = getContract(id);
        c.migration = { batch: 'B-12', importedAt: new Date(Date.now() - 6 * 864e5).toISOString(), importedBy: me.name, needsReview: true, blocked: null }; persist(c); });
      await new Promise(r => setTimeout(r, 1500));
      const D = agentsData();
      return { ready: D.ready, kinds: AG_KEYS.flatMap(k => D.agents[k].ready.map(i => i.kind)) };
    });
    check('(stage) their answer, a renewal, a read, a chase, an import and a request are prepared',
      !!staged.kinds && ['answer', 'renewal', 'read', 'chase', 'import', 'request'].every(k => staged.kinds.includes(k)), JSON.stringify(staged));
    await toCounter();

    console.log('\n1 · the head as drawn');
    const head = await page.evaluate(() => ({ h1: (document.querySelector('.cn-ask h1') || {}).textContent || '', ph: (document.getElementById('cn-q') || {}).placeholder || '',
      chips: [...document.querySelectorAll('.cn-chips .cn-chip')].map(b => { const cs = getComputedStyle(b); return { t: b.textContent.trim(), lead: b.hasAttribute('data-cn-lead'), door: b.getAttribute('data-cn-need') || b.getAttribute('data-cn-note') || b.getAttribute('data-cn-req') || '',
        dress: [cs.borderTopColor, cs.fontWeight, cs.backgroundColor, cs.color].join('|') }; }),
      first: (() => { if (typeof cnRows !== 'function' || typeof cnNeedShort !== 'function') return '(no reading)'; const r = cnRows()[0]; return r ? cnNeedShort(r) : ''; })(), hint: (document.querySelector('#cn-needs .cn-hint') || {}).textContent || '' }));
    check('1a "What do you need, Amina?" and the box\'s own words', head.h1 === 'What do you need, Amina?' && head.ph === 'A contract, a party, a place, a draft, a question… or /', JSON.stringify([head.h1, head.ph]));
    check('1b the chips: the first owed row, then contracts · calendar · draft a new agreement — no upload, no "jambo\'s work"',
      head.chips.length === 4 && head.chips[0].lead && head.chips[0].t === head.first && !!head.chips[0].door
      && head.chips.slice(1).map(c => c.t).join('|') === 'contracts|calendar|draft a new agreement', JSON.stringify(head.chips));
    check('1c "each row\'s button opens its page"', head.hint === 'each row’s button opens its page', head.hint);
    check('1d the four chips wear one dress, as drawn (the lead is not louder)', head.chips.length === 4 && new Set(head.chips.map(c => c.dress)).size === 1, JSON.stringify(head.chips.map(c => c.dress)));

    console.log('\n2 · Home\'s Jambo\'s work row lands on the Board\'s card');
    const jw = await page.evaluate(() => { const r = document.querySelector('#cn-needs .cn-jw');
      return r ? { head: (r.querySelector('.cn-w b') || {}).innerText.replace(/\s+/g, ' ').trim(), who: (r.querySelector('.cn-w > span') || {}).textContent || '',
        btn: ((r.querySelector('[data-cn-jw]') || {}).textContent || '').trim(), inPlace: !!document.querySelector('#cn-jw-list, [data-cn-ag-item], [data-cn-look], [data-cn-house]') } : null; });
    check('2a its head as drawn: "Jambo\'s work · N prepared · nothing sent or filed until you press", whose work under it, Open',
      !!jw && /^Jambo’s work · \d+ prepared · nothing sent or filed until you press$/.test(jw.head) && !!jw.who && jw.btn === 'Open', JSON.stringify(jw));
    check('2b no list of pieces in place on Home', !!jw && !jw.inPlace, JSON.stringify(jw));
    await shot(page, 'main-23-home-1440x780');
    const card = () => page.evaluate(() => { const c = document.getElementById('hm-agents'); const r = c ? c.getBoundingClientRect() : null;
      return { view: state.view, face: window.hbFace ? hbFace() : null, card: !!c, lit: !!(c && c.classList.contains('is-landed')),
        inView: !!(r && r.top >= 0 && r.top < innerHeight && r.height > 0) }; });
    if (await press('[data-cn-jw]', '2c Open')) {
      const L = await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const s1 = await card();
      check('2c Open lands on the Board\'s Jambo\'s work card: the Board, the card in view, lit', !!L && s1.view === 'dashboard' && s1.face === 'board' && s1.card && s1.inView, JSON.stringify(s1));
      await shot(page, 'main-23-board-card-landed-1440x780');
    }

    console.log('\n3 · on the Board\'s card, where the pieces live');
    const openAgent = async k => { await page.evaluate(k => hbOpenAgent(k), k);
      return until(k => { const w = document.querySelector('.hb-ag-works'); return w && hbS().path[0] === 'ag:' + k && w.querySelector('[data-hb-ag-item]') ? true : null; }, k, 6000); };
    const kinds = await page.evaluate(() => hbAgentsData(null).rows.map(r => r.k));
    check('(stage) the card lists the agents with work: their round, new paper, renewals, late promises, the import', ['round', 'paper', 'late', 'import'].every(k => kinds.includes(k)), JSON.stringify(kinds));
    const pieces = [];
    for (const k of kinds){
      if (!(await openAgent(k))){ check(`3 the ${k} agent's work opens below the card`, false); continue; }
      pieces.push(...await page.evaluate(() => [...document.querySelectorAll('.hb-ag-works [data-hb-ag-item]')].map(p => ({ key: p.getAttribute('data-hb-ag-item'),
        acts: [...p.querySelectorAll('.ag-p-acts button')].map(b => ({ act: b.getAttribute('data-ag-act'), t: b.textContent.trim(), cls: b.className })) }))));
    }
    const lastAway = pieces.filter(p => p.acts.length && p.acts[p.acts.length - 1].act === 'away' && p.acts[p.acts.length - 1].t === 'Put away' && /\bui-link\b/.test(p.acts[p.acts.length - 1].cls));
    check('3a Put away on EVERY piece the card draws, the last act, the quiet text button', pieces.length >= 5 && lastAway.length === pieces.length,
      JSON.stringify(pieces.map(p => p.key + ':' + p.acts.map(a => a.act).join('/'))));
    check('3b their answer and a request carry it too (the owner\'s "every piece")',
      ['answer:MK-0382', 'request:'].every(k => pieces.some(p => p.key.startsWith(k) && p.acts.some(a => a.act === 'away'))), JSON.stringify(pieces.map(p => p.key)));
    const lead = k => { const p = pieces.find(x => x.key.startsWith(k)); const a = p && p.acts.find(x => /ui-btn-primary/.test(x.cls)); return a ? a.t : ''; };
    const has = (k, t) => { const p = pieces.find(x => x.key.startsWith(k)); return !!(p && p.acts.some(a => a.t === t || (t instanceof RegExp && t.test(a.t)))); };
    check('3c each act named for what it does: Answer on Redlines · Fill in N details · Send the chase · Check the 3 files',
      lead('answer:') === 'Answer on Redlines' && has('read:', /^Fill in \d+ details?$/) && lead('desk:MK-0368') === 'Send the chase' && lead('import:') === 'Check the 3 files',
      JSON.stringify([lead('answer:'), pieces.find(x => x.key.startsWith('read:')), lead('desk:MK-0368'), lead('import:')]));
    if (await openAgent('late')) {
      const mail = await until(() => { const p = document.querySelector('.hb-ag-works [data-hb-ag-item^="desk:MK-0368"]'); const m = p && p.querySelector('.ag-mail');
        if (!m) return null; return { to: (m.querySelector('.ag-mail-h dd') || {}).textContent || '', text: m.innerText.replace(/\s+/g, ' ').trim(), after: p.innerText.replace(/\s+/g, ' ').trim() }; }, null, 5000);
      check('3d a chase shows the email whole: To, Subject, the letter as drawn, the day in words, signed by the sender for our company',
        !!mail && mail.to === 'insurance@kettle.example' && /Subject A reminder about the insurance certificate/.test(mail.text)
        && /Hello, This is a reminder about the insurance certificate under our Supply agreement \(MK-0368\), which was due on \d{1,2} [A-Z][a-z]+( \d{4})?\. Could you send it, or let us know when it will come\?/.test(mail.text)
        && /Amina Otieno, Highland Corporate Ltd/.test(mail.text), mail && mail.text.slice(0, 300));
      check('3e and under it: "It goes to the address on the contract. You are asked once more before it is sent."',
        !!mail && /It goes to the address on the contract\. You are asked once more before it is sent\./.test(mail.after), mail && mail.after.slice(-300));
      await page.evaluate(() => { const p = document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'); if (p) p.scrollIntoView({ block: 'center' }); });
      await shot(page, 'main-23-board-chase-email-1440x780');
    }

    console.log('\n8 · it fits the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(300);
      const fit = await page.evaluate(() => { const card = document.querySelector('.hb-ag-works'); const r = card ? card.getBoundingClientRect() : null;
        return { open: !!document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'), sx: document.scrollingElement.scrollWidth > innerWidth,
          past: card ? [...card.querySelectorAll('button, .ag-mail, .ag-p-head, .ag-p-body')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.right > r.right + 1); }).length : -1 }; });
      check(`8a at ${w}×${hh}: the Board with the chase open — no sideways scroll, nothing past the edge`, fit.open && !fit.sx && fit.past === 0, JSON.stringify(fit));
      await page.evaluate(() => { const p = document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'); if (p) p.scrollIntoView({ block: 'center' }); });
      await shot(page, `main-23-board-chase-email-${w}x${hh}`);
      await page.evaluate(() => { const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'start' }); });
      await shot(page, `main-23-board-card-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n4 · Put away a piece that is not the desk\'s');
    await openAgent('round');
    const before = await page.evaluate(() => ({ asks: negoNeedsYouIds(getContract('MK-0382')).length }));
    if (await press('[data-hb-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4 Put away their answer')) {
      const gone = await until(() => !hbAgentsData(null).rows.some(r => r.items.some(i => i.key === 'answer:MK-0382')) && !document.querySelector('[data-hb-ag-item="answer:MK-0382"]')
        ? { kept: (currentUser().prefs.agentAway || {})['answer:MK-0382'] || null, toast: [...document.querySelectorAll('#toast-root [data-toast-act]')].map(b => b.textContent) } : null, null, 5000);
      check('4a gone from this person\'s card, kept in their own prefs, with Undo', !!gone && !!gone.kept && gone.toast.includes('Undo'), JSON.stringify(gone));
      const asks = await page.evaluate(() => negoNeedsYouIds(getContract('MK-0382')).length);
      check('4b the work it is about still waits (their asks untouched)', asks === before.asks && asks > 0, `${before.asks} → ${asks}`);
      if (await press('#toast-root [data-toast-act]', '4c Undo')) {
        const back = await until(() => hbAgentsData(null).rows.some(r => r.items.some(i => i.key === 'answer:MK-0382')) && !(currentUser().prefs.agentAway || {})['answer:MK-0382'], null, 5000);
        check('4c Undo brings it back onto the card', !!back);
      }
      await openAgent('round');
      await press('[data-hb-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4d Put away again');
      await until(() => !!(currentUser().prefs.agentAway || {})['answer:MK-0382'], null, 5000);
      await page.waitForTimeout(400);
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0368') && window.currentUser && currentUser(), null, { timeout: 20000 });
      const fresh = await until(() => !!(currentUser().prefs.agentAway || {})['answer:MK-0382'] && !hbAgentsData(null).rows.some(r => r.items.some(i => i.key === 'answer:MK-0382')) ? 'kept' : null, null, 6000);
      check('4d a fresh load still has it put away (kept on the server)', fresh === 'kept', String(fresh));
      const theirs = await W.unrestricted.json('/api/bootstrap');
      const mine = (theirs.me && theirs.me.prefs && theirs.me.prefs.agentAway) || {};
      check('4e a colleague\'s own list is untouched (it was put away for this person only)', !mine['answer:MK-0382'], JSON.stringify(mine));
    }

    console.log('\n5 · Put away a desk row: on the contract');
    await openAgent('late');
    if (await press('[data-hb-ag-item^="desk:MK-0368"] [data-ag-act="away"]', '5 Put away the chase')) {
      const gone = await until(() => { const c = getContract('MK-0368'); const k = Object.keys(c.desk || {}).find(x => /^chase/.test(x));
        return k && !document.querySelector('[data-hb-ag-item^="desk:MK-0368"]') ? k : null; }, null, 5000);
      check('5a the desk keeps the stamp on the contract (its one writer)', !!gone, String(gone));
      if (await press('#toast-root [data-toast-act]', '5b Undo')) {
        const back = await until(() => { const c = getContract('MK-0368'); return !Object.keys(c.desk || {}).some(x => /^chase/.test(x)) && hbAgentsData(null).rows.some(r => r.items.some(i => /^desk:MK-0368/.test(i.key))); }, null, 5000);
        check('5b Undo takes the stamp back off, through the same writer', !!back);
      }
    }

    console.log('\n6 · how far the agents may go, under the card');
    await page.evaluate(() => hbOpenAgent());
    const lvA = await until(() => { const e = document.querySelector('#hm-agents [data-hb-levels]'); return e ? { t: e.innerText.replace(/\s+/g, ' ').trim(), change: !!document.querySelector('#hm-agents [data-hb-lv-change]'), ask: !!document.querySelector('#hm-agents [data-hb-lv-ask]') } : null; }, null, 6000);
    check('6a "All seven agents: Ask me first · the default, for everyone" under the card\'s agents and, for an admin, Change',
      !!lvA && lvA.t === 'All seven agents: Ask me first · the default, for everyone' && lvA.change && !lvA.ask, JSON.stringify(lvA));
    const saved = await page.evaluate(async () => { try { await agentSaveCfg('renew', { level: 'mine' }); const s = agentsStatus(); return s.agents.renew.levelBy || null; } catch (e) { return 'err ' + e.message; } });
    check('6b the server records who moved a level', saved === 'Amina Otieno', String(saved));
    const resave = await page.evaluate(async () => { const was = agentsStatus().agents.renew.levelAt; await new Promise(r => setTimeout(r, 20));
      await agentSaveCfg('renew', { level: 'mine', at: 3 }); const now = agentsStatus().agents.renew.levelAt; return was && now === was ? now : null; });
    check('6d a Save that leaves the level where it was names nobody new', !!resave, String(resave));
    await page.evaluate(() => { const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'start' }); });
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(250);
      await page.evaluate(() => { hbPaintBoard(); const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'start' }); });
      const lvFit = await page.evaluate(() => { const e = document.querySelector('#hm-agents .hb-ag-lv'), c = document.getElementById('hm-agents'); if (!e || !c) return null;
        const r = e.getBoundingClientRect(), q = c.getBoundingClientRect(); return { inCard: r.left >= q.left - 1 && r.right <= q.right + 1, sx: document.scrollingElement.scrollWidth > innerWidth }; });
      check(`6g at ${w}×${hh}: the levels line sits inside the card, no sideways scroll`, !!lvFit && lvFit.inCard && !lvFit.sx, JSON.stringify(lvFit));
      await shot(page, `main-23-board-levels-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    const member = await open('everything@example.co.ke', 'their-own-pass-9', 1);
    await member.evaluate(() => hbOpenAgent());
    const lvM = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) {
      const v = await member.evaluate(() => { const e = document.querySelector('#hm-agents [data-hb-levels]'); return e ? { t: e.innerText.replace(/\s+/g, ' ').trim(), ask: !!document.querySelector('#hm-agents [data-hb-lv-ask]') } : null; });
      if (v) return v; await member.waitForTimeout(150); } return null; })();
    check('6c a member reads who set it, and the agent at another level by name, with Ask an admin',
      !!lvM && lvM.t === '6 agents: Ask me first · Renewals: Leave it to me · set by Amina for everyone' && lvM.ask, JSON.stringify(lvM));
    await member.evaluate(() => { const e = document.querySelector('#hm-agents .hb-ag-lv'); if (e) e.scrollIntoView({ block: 'center' }); });
    await shot(member, 'main-23-board-levels-member-1440x780');
    if (lvM && await press('#hm-agents [data-hb-lv-ask]', '6e Ask an admin', member)) {
      const asked = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) {
        const v = await member.evaluate(() => { const e = document.querySelector('#hm-agents [data-hb-lv-asked]'); return e ? { view: state.view, face: hbFace(), said: e.textContent, btn: !!document.querySelector('#hm-agents [data-hb-lv-ask]') } : null; });
        if (v) return v; await member.waitForTimeout(150); } return null; })();
      check('6e Ask an admin is sent from the Board: the member stays on it, the line says so where the button stood',
        !!asked && asked.view === 'dashboard' && asked.face === 'board' && /^Asked .+ · waiting for an answer$/.test(asked.said) && !asked.btn, JSON.stringify(asked));
      const rec = await W.admin.json('/api/settings-asks');
      const mineAsk = (rec.asks || []).find(a => a.panel === 'agents' && a.status === 'open');
      check('6f the ask is the tracked record, in the admin\'s list: "How far Jambo’s agents may go"', !!mineAsk && /How far Jambo’s agents may go/.test(mineAsk.what), JSON.stringify(mineAsk || rec).slice(0, 200));
      await member.evaluate(() => { const e = document.querySelector('#hm-agents .hb-ag-lv'); if (e) e.scrollIntoView({ block: 'center' }); });
      await shot(member, 'main-23-board-asked-member-1440x780');
    }
    await member.close();

    console.log('\n7 · Home\'s Needs you as drawn');
    await toCounter();
    const needs = await page.evaluate(() => [...document.querySelectorAll('#cn-needs > .cn-r:not(.cn-jw)')].map(r => ({
      title: (r.querySelector('.cn-w b') || {}).innerText || '', sub: (r.querySelector('.cn-w > span') || {}).innerText || '',
      btn: (r.querySelector('button') || {}).textContent || '', door: (r.querySelector('button') || { getAttribute: () => '' }).getAttribute('data-cn-need') || (r.querySelector('[data-cn-note]') ? 'note' : r.querySelector('[data-cn-req]') ? 'req' : '') })));
    const ap = needs.find(n => /^Answer an approval for /.test(n.title));
    check('7a "Answer an approval for Unrestricted" · "for Unrestricted · away until <day>" · name · party · value · Open approval',
      !!ap && /Answer an approval for Unrestricted\s*for Unrestricted · away until \S+/.test(ap.title.replace(/\n/g, ' ')) && /^Power purchase agreement · Helio Energy AB · KES/.test(ap.sub) && ap.btn === 'Open approval',
      JSON.stringify(ap));
    check('7b "Fill in N details" rows open Fill in', needs.some(n => /^Fill in \d+ details?$/.test(n.title.trim()) && n.btn === 'Fill in'), JSON.stringify(needs.map(n => n.title)));
    const hidden = await page.evaluate(() => ({ foot: (document.querySelector('#cn-needs .cn-foot') || {}).innerText || '', rows: typeof cnRows === 'function' ? cnRows().map(r => r.k) : [] }));
    check('7c a note of yours due and a request nobody holds are on the list', hidden.rows.includes('note') && hidden.rows.includes('req'), JSON.stringify(hidden.rows));
    check('7d "Show N more · <their names>"', /^Show \d+ more\s+\S/.test(hidden.foot), hidden.foot);
    const days = await page.evaluate(() => [...document.querySelectorAll('#cn-needs > .cn-r .cn-w > span')].map(e => e.textContent).filter(t => /waiting/.test(t)));
    check('7f how long a row has waited is said in words: "waiting N days", never a bare number', days.length > 0 && days.every(t => /waiting (\d+ days?|today)(\s|$|·)/.test(t)) && !days.some(t => /waiting \d+(\s*·|$)/.test(t)), JSON.stringify(days));
    const order = await page.evaluate(() => { const kids = [...document.getElementById('cn-needs').children]; const i = c => kids.findIndex(k => k.classList.contains(c));
      return { co: i('cn-co'), foot: i('cn-foot'), last: kids.length - 1 }; });
    check('7g the admin\'s own row comes before "Show N more", the card\'s last line', order.foot === order.last && (order.co < 0 || order.co < order.foot), JSON.stringify(order));
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(200);
      const fit = await page.evaluate(() => { const card = document.getElementById('cn-needs'); const r = card ? card.getBoundingClientRect() : null;
        return { sx: document.scrollingElement.scrollWidth > innerWidth, past: card ? [...card.querySelectorAll('button, .cn-w b, .cn-w span')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.right > r.right + 1); }).length : -1 }; });
      check(`8b at ${w}×${hh}: Home — no sideways scroll, nothing past the card`, !fit.sx && fit.past === 0, JSON.stringify(fit));
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, `main-23-home-${w}x${hh}`);
      await page.evaluate(() => { const f = document.querySelector('#cn-needs .cn-foot'); if (f) f.scrollIntoView({ block: 'end' }); });
      await shot(page, `main-23-home-foot-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    const reqShort = await page.evaluate(() => { const r = cnRows().find(y => y.k === 'req'); return r ? cnNeedShort(r) : ''; });
    check('7h a request\'s short name says whose and what it is for: "<name>’s NDA request"', /^\S+’s NDA request$/.test(reqShort), reqShort);
    if (await press('[data-cn-all]', '7e Show more')) {
      const all = await until(() => { const b = document.querySelector('[data-cn-all]'); return b && b.textContent === 'Show fewer' ? [...document.querySelectorAll('#cn-needs [data-cn-note], #cn-needs [data-cn-req]')].map(x => x.textContent) : null; }, null, 3000);
      check('7e the rest come, the note\'s Open note and the request\'s Open request among them', !!all && all.includes('Open note') && all.includes('Open request'), JSON.stringify(all));
    }
    if (await press('#cn-needs [data-cn-note]', '7i Open note')) {
      const lit = await until(() => { const r = document.querySelector('.is-landed'); return state.view === 'mynotes' && r && r.matches('[data-mn-row]') ? { row: r.getAttribute('data-mn-row') } : null; }, null, 6000);
      check('7i a note\'s door lands ON its row on My notes, lit', !!lit, JSON.stringify(lit || await page.evaluate(() => ({ view: state.view, lit: [...document.querySelectorAll('.is-landed')].map(e => e.outerHTML.slice(0, 80)) }))));
      await shot(page, 'main-23-note-landed-1440x780');
    }
    await toCounter();
    if (!(await page.evaluate(() => !!document.querySelector('#cn-needs [data-cn-req]')))) await press('[data-cn-all]', '7j Show more');
    if (await press('#cn-needs [data-cn-req]', '7j Open request')) {
      const lit = await until(() => { const r = document.querySelector('.is-landed'); return state.view === 'intake' && r && r.matches('[data-ik-row]') ? { row: r.getAttribute('data-ik-row') } : null; }, null, 8000);
      check('7j a request\'s door lands ON its row on Requests, lit', !!lit, JSON.stringify(lit || await page.evaluate(() => ({ view: state.view, lit: [...document.querySelectorAll('.is-landed')].map(e => e.outerHTML.slice(0, 80)) }))));
      await shot(page, 'main-23-request-landed-1440x780');
    }

    console.log('\n10 · Jambo\'s house says the card\'s count');
    /* every word the house paints on its canvas, kept as it is painted (the page's own 2D context, read through window) */
    await page.evaluate(() => { if (window._fillTextKept) return; window._fillTextKept = true; const P = window.CanvasRenderingContext2D.prototype, ft = P.fillText;
      window._jhSaid = []; P.fillText = function(t){ if (this.canvas && this.canvas.id === 'jh-cv') window._jhSaid.push(String(t)); return ft.apply(this, arguments); }; });
    await page.evaluate(() => setView('jambo'));
    const house = async () => { const t0 = Date.now(); while (Date.now() - t0 < 10000) {
      const v = await page.evaluate(() => { if (!document.getElementById('jh-cv') || typeof jhGeom !== 'function' || typeof jhLinks !== 'function' || !jhLinks().length) return null;
        window._jhSaid = []; jhRepaint();
        const W = counterWorkByAgent(), said = window._jhSaid.slice(), L = jhLinks();
        const door = document.getElementById('jh-jambo'), dr = door && door.getBoundingClientRect(), n = door && door.querySelector('[data-jh-jambo-n]');
        const ct = document.getElementById('content'), edge = ct ? Math.round(ct.getBoundingClientRect().left + ct.clientWidth) : innerWidth;
        return { ready: W.ready, card: hbAgentsData(null).ready, by: W.by, said, links: L.map(l => l.k), g: jhGeom(), audit: jhOverlapAudit(), sx: document.scrollingElement.scrollWidth > innerWidth, readings: AG_READINGS.slice(),
          door: door ? { right: Math.round(dr.right), w: Math.round(dr.width), n: n ? n.textContent : '', count: counterNeedsCount(), word: (door.querySelector('.igd-door-w') || {}).textContent || '', edge } : null }; });
      if (v) return v; await page.waitForTimeout(150); } return null; };
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(400);
      const H0 = await house();
      if (!H0){ check(`10 at ${w}×${hh}: the house drew its links`, false, 'no links'); continue; }
      if (w === 1440){
        const acting = Object.keys(H0.by).filter(k => H0.by[k] > 0 && !H0.readings.includes(k));
        check('10a Your desk says the card\'s count: "N waiting for you" = the Board card\'s "N ready" = Home\'s "N prepared"', H0.ready > 0 && H0.ready === H0.card && H0.said.includes(`${H0.ready} waiting for you`), JSON.stringify({ ready: H0.ready, card: H0.card, said: H0.said.filter(t => /waiting/.test(t)) }));
        check('10b each acting room with a piece says its own "N waiting for you" where it has the room, and the approvals desk waits for nobody',
          acting.length >= 3 && acting.some(k => H0.links.includes(k)) && !H0.links.includes('approve') && !('approve' in H0.by), JSON.stringify({ by: H0.by, links: H0.links }));
        check('10c four and three rooms a floor, five floors, as drawn', H0.g.cols === 4 && H0.g.floors === 5, JSON.stringify(H0.g));
        check('10d Jambo folded to the right edge: his face, Home\'s count, his name, ‹', !!H0.door && Math.abs(H0.door.right - H0.door.edge) <= 1 && H0.door.w >= 40 && H0.door.w <= 50
          && H0.door.n === String(H0.door.count) && H0.door.word === 'Jambo', JSON.stringify(H0.door));
      }
      check(`10e at ${w}×${hh}: every agent clear of his room's words, nothing out of its room (the overlap audit), no sideways scroll`, H0.audit.ok && !H0.sx, JSON.stringify(H0.audit.faults.slice(0, 4)));
      await shot(page, `main-23-house-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.waitForTimeout(300);
    const linkAt = k => page.evaluate(k => { const l = typeof jhLinks === 'function' ? jhLinks().find(x => x.k === k) : null; const cv = document.getElementById('jh-cv'); if (!l || !cv) return null;
      const r = cv.getBoundingClientRect(), g = jhGeom(); return { x: r.left + (l.x + l.w / 2) * r.width / g.w, y: r.top + (l.y + l.h / 2) * r.height / g.h }; }, k);
    const at = await linkAt('desk');
    if (!at) check('10f the desk\'s words are a door', false, 'no desk link');
    else {
      await page.mouse.move(at.x, at.y); await page.waitForTimeout(150);
      const cur = await page.evaluate(() => document.getElementById('jh-cv').style.cursor);
      await page.mouse.click(at.x, at.y);
      const landed = await until(() => { const c = document.getElementById('hm-agents'); return state.view === 'dashboard' && c && c.classList.contains('is-landed') ? { face: hbFace() } : null; }, null, 6000);
      check('10f "N waiting for you" is a door: a press LANDS ON the Board\'s Jambo\'s work card, lit', cur === 'pointer' && !!landed && landed.face === 'board', JSON.stringify({ cur, landed }));
    }
    await page.evaluate(() => setView('jambo'));
    await until(() => typeof jhLinks === 'function' && jhLinks().length > 1, null, 6000);
    const roomK = await page.evaluate(() => { const L = jhLinks().filter(l => l.k !== 'desk'); return L.length ? L[0].k : null; });
    const ra = roomK ? await linkAt(roomK) : null;
    if (!ra) check('10h a room\'s "1 waiting for you" is a door', false, 'no room link');
    else {
      await page.mouse.click(ra.x, ra.y);
      const landed = await until(k => { const w = document.querySelector('.hb-ag-works'); return state.view === 'dashboard' && w && w.classList.contains('is-landed') && hbS().path[0] === 'ag:' + k ? true : null; }, roomK, 6000);
      check('10h a room\'s "N waiting for you" lands on that agent\'s work below the Board\'s card, lit', !!landed, roomK);
    }
    await page.evaluate(() => setView('jambo'));
    await until(() => !!document.querySelector('[data-jh-jambo]'), null, 6000);
    if (await press('[data-jh-jambo]', '10g the folded strip')) {
      const opened = await until(() => { const p = document.getElementById('ai-panel'); return p && p.classList.contains('open') ? true : null; }, null, 4000);
      check('10g a press on the strip opens Jambo beside the page (his window, the one Copilot door\'s own act)', !!opened);
      await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });
    }

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
