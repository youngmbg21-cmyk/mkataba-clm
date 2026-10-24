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
       (one dress); no hint line under Needs you (Chambers, 20 Oct 2026: the
       drawing carries no "each row's button opens its page")
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
    11 THIRD PASS (19 Oct 2026): the greeting in the title serif, 28px
       (re-pointed 20 Oct 2026, Chambers: it was 26px semibold Geist) and
       Jambo's work's tail 12px, as drawn; three owed rows in sight, the approval answered
       for an away colleague first and so the lead chip; the renewal row says
       its act and its time in words; the lead chip LANDS ON the approval
       gate it opens, lit; the Board card's head says Home's words; each piece
       FOLDED TO ONE LINE (the owner's answer (18)) — tag, what, reference,
       one sentence, Look · its act · Put away — Look opening it under its row
       and folding it again; a chase's Look shows the letter as the route will
       send it, the standing link's paragraph and all; the house fills its
       page to Jambo's strip, every room's agent name whole.
   RE-POINTED 19 Oct 2026: section 3 reads the folded rows (.hb-pc-acts) and
   presses Look to read a chase's letter (answer (18)); 7 reads three rows.
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
  /* a standing link to the chased agreement: the route adds its paragraph, so Look must show it too */
  await W.admin.json('/api/shares', { method: 'POST', body: { durable: true,
    payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', contract: { id: 'MK-0368', name: 'Supply agreement', counterparty: 'Kettle & Co' } },
    channel: 'email', recipient: { name: 'Kettle Insurance', email: 'insurance@kettle.example' } } });

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
      first: (() => { if (typeof cnRows !== 'function' || typeof cnNeedShort !== 'function') return '(no reading)'; const r = cnRows()[0]; return r ? cnNeedShort(r) : ''; })(), hint: { el: document.querySelectorAll('#cn-needs .cn-hint, .cn-ask .jb-hint, .cn-ask .jb-keys').length, said: /each row.s button opens its page/.test((document.getElementById('cn-needs') || {}).textContent || '') } }));
    check('1a "What do you need, Amina?" and the box\'s own words', head.h1 === 'What do you need, Amina?' && head.ph === 'Ask Jambo, or type / for a place', JSON.stringify([head.h1, head.ph]));
    check('1b the chips: the first owed row, then contracts · calendar · draft a new agreement — no upload, no "jambo\'s work"',
      head.chips.length === 4 && head.chips[0].lead && head.chips[0].t === head.first && !!head.chips[0].door
      && head.chips.slice(1).map(c => c.t).join('|') === 'contracts|calendar|draft a new agreement', JSON.stringify(head.chips));
    /* RE-POINTED 20 Oct 2026 (Chambers): the hint line is not drawn — no .cn-hint under Needs you, no hint under the box */
    check('1c no hint line: no "each row\'s button opens its page" under Needs you, no hint under the box', head.hint.el === 0 && !head.hint.said, JSON.stringify(head.hint));
    check('1d the four chips wear one dress, as drawn (the lead is not louder)', head.chips.length === 4 && new Set(head.chips.map(c => c.dress)).size === 1, JSON.stringify(head.chips.map(c => c.dress)));
    const type = await page.evaluate(() => { const h = document.querySelector('.cn-ask h1'), b = document.querySelector('#cn-needs .nd-r .cn-w b');
      const root = getComputedStyle(document.documentElement);
      const cs = e => e ? getComputedStyle(e) : null; return { h1: cs(h) && [cs(h).fontSize, cs(h).fontWeight].join(' '), fam: cs(h) && cs(h).fontFamily, title: root.getPropertyValue('--font-title').trim(), wSerif: root.getPropertyValue('--w-title-serif').trim(),
        name: cs(b) && cs(b).fontSize, btns: [...new Set([...document.querySelectorAll('#cn-needs .nd-btn')].map(x => Math.round(x.getBoundingClientRect().width)))] }; });
    /* RE-POINTED 20 Oct 2026 (Chambers): Home's question is in the title serif (--font-title), 28px, --w-title-serif (was 26px semibold);
       RE-POINTED 22 Oct 2026 (Round A, the owner: "make all of the buttons the same size"): every button of Needs you one width */
    check('11g the greeting large as drawn (28px, the title serif at its own weight); a row\'s name 14px; every Needs you button one width',
      !!type.h1 && type.h1 === '28px ' + type.wSerif && !!type.title && /Source Serif 4/.test(type.fam || '') && type.name === '14px' && type.btns.length === 1, JSON.stringify(type));
    check('11h the approval answered for an away colleague leads, so it is the lead chip: "Unrestricted\'s approval"', head.chips[0] && head.chips[0].t === 'Unrestricted’s approval' && head.chips[0].door === 'approval', JSON.stringify(head.chips[0]));

    /* RE-POINTED 22 Oct 2026 (Round A, the one desk — the owner picked "The Legora Way"): Home draws Jambo's
       prepared pieces as rows of their own, three of each group, and "Show all N" lands on the Board's card,
       where every piece is a row whose Look opens it in place (its body, its act, Put away last) */
    console.log('\n2 · Home\'s Needs you: Jambo\'s group first, three rows each, Show all onto the Board');
    const homeNd = await page.evaluate(() => ({ groups: [...document.querySelectorAll('#cn-needs .nd-g')].map(g => g.getAttribute('data-nd-g')),
      jambo: [...document.querySelectorAll('#cn-needs .nd-r [data-nd-look]')].length, step: [...document.querySelectorAll('#cn-needs .nd-r .nd-step')].length,
      read: [...document.querySelectorAll('#cn-needs .nd-r .nd-read')].map(e => e.textContent), words: [...new Set([...document.querySelectorAll('#cn-needs .nd-btn')].map(b => b.textContent))],
      inPlace: !!document.querySelector('#cn-jw-list, [data-cn-ag-item], [data-cn-look], [data-cn-house], .cn-jw'), n: ndRead().jambo.length }));
    check('2a Jambo\'s group first, three of his pieces in sight, each with its step and "Jambo read"',
      homeNd.groups[0] === 'jambo' && homeNd.jambo === Math.min(3, homeNd.n) && homeNd.step === homeNd.jambo && homeNd.read.length === homeNd.jambo && homeNd.read.every(t => t === 'Jambo read'), JSON.stringify(homeNd));
    check('2b no list of pieces in place on Home, and every button one word', !homeNd.inPlace && homeNd.words.every(w => /^(Look|Decide|Sign|Review|Fill in|Answer|Open)$/.test(w)), JSON.stringify(homeNd.words));
    await shot(page, 'main-23-home-1440x780');
    const card = () => page.evaluate(() => { const c = document.getElementById('hm-agents'); const r = c ? c.getBoundingClientRect() : null;
      return { view: state.view, face: window.hbFace ? hbFace() : null, card: !!c, nd: !!(c && c.classList.contains('nd-card')), lit: !!(c && c.classList.contains('is-landed')),
        tab: ((c && c.querySelector('.nd-tab.on')) || {}).getAttribute ? c.querySelector('.nd-tab.on').getAttribute('data-nd-tab') : null,
        inView: !!(r && r.top >= 0 && r.top < innerHeight && r.height > 0) }; });
    if (await press('[data-nd-all="jambo"]', '2c Show all on Jambo\'s group')) {
      const L = await until(() => { const c = document.getElementById('hm-agents'); return c && c.classList.contains('is-landed') ? true : null; }, null, 6000);
      const s1 = await card();
      check('2c Show all lands on the Board\'s Needs you card, on Jambo\'s tab, in view, lit', !!L && s1.view === 'dashboard' && s1.face === 'board' && s1.card && s1.nd && s1.tab === 'jambo' && s1.inView, JSON.stringify(s1));
      await shot(page, 'main-23-board-card-landed-1440x780');
    }

    console.log('\n3 · on the Board\'s card, where every piece is a row');
    const openAgent = async k => { await page.evaluate(k => hbOpenAgent(k), k);
      return until(k => { const r = document.querySelector('#hm-agents [data-nd-agent="' + k + '"]'); return r && state.view === 'dashboard' ? true : null; }, k, 6000); };
    /* a piece opened under its row through its own Look, read whole */
    const lookAt = async key => {
      /* a key, or the start of one (a desk row's key carries its stamp after the contract) */
      const was = await page.evaluate(k => { const r = document.querySelector('#hm-agents [data-hb-ag-item^="' + k + '"]'); return r ? r.classList.contains('is-look') : null; }, key);
      if (was === null) return null;
      if (!was) await page.click('#hm-agents [data-hb-ag-item^="' + key + '"] [data-hb-ag-look]');
      return until(k => { const r = document.querySelector('#hm-agents [data-hb-ag-item^="' + k + '"]'); if (!r || !r.classList.contains('is-look')) return null;
        return { acts: [...r.querySelectorAll('.nd-body [data-ag-act]')].map(b => ({ act: b.getAttribute('data-ag-act'), t: b.textContent.trim(), cls: b.className })),
          lead: (r.querySelector('.nd-body .ui-btn-primary') || {}).textContent || '', expanded: r.querySelector('[data-hb-ag-look]').getAttribute('aria-expanded') }; }, key, 6000); };
    await page.evaluate(() => hbOpenAgent());
    await until(() => document.querySelector('#hm-agents .nd-br') ? true : null, null, 6000);
    await page.click('#hm-agents [data-nd-tab="jambo"]');
    const kinds = await page.evaluate(() => [...new Set(ndRead().jambo.map(r => r.agent))]);
    check('(stage) the card lists the agents with work: their round, new paper, renewals, late promises, the import', ['round', 'paper', 'late', 'import'].every(k => kinds.includes(k)), JSON.stringify(kinds));
    const rows = await page.evaluate(() => [...document.querySelectorAll('#hm-agents .nd-br[data-hb-ag-item]')].map(r => ({ key: r.getAttribute('data-hb-ag-item'),
      title: (r.querySelector('.nd-c-what b') || {}).textContent || '', hover: (r.querySelector('.nd-c-what') || { getAttribute: () => '' }).getAttribute('title') || '',
      deal: (r.querySelector('.nd-c-deal') || {}).textContent || '', who: (r.querySelector('.nd-c-who') || {}).textContent || '', look: (r.querySelector('[data-hb-ag-look]') || {}).textContent || '',
      body: !!r.querySelector('.nd-body'), h: Math.round(r.getBoundingClientRect().height) })));
    const pieces = [];
    for (const r of rows){ const L = await lookAt(r.key); pieces.push({ ...r, open: L }); }
    const lastAway = pieces.filter(p => p.open && p.open.acts.length && p.open.acts[p.open.acts.length - 1].act === 'away' && p.open.acts[p.open.acts.length - 1].t === 'Put away' && /\bui-link\b/.test(p.open.acts[p.open.acts.length - 1].cls));
    check('3a Put away on EVERY piece the card draws, the last act, the quiet text button', pieces.length >= 5 && lastAway.length === pieces.length,
      JSON.stringify(pieces.map(p => p.key + ':' + (p.open ? p.open.acts.map(a => a.act).join('/') : 'not opened'))));
    check('3b their answer and a request carry it too (the owner\'s "every piece")',
      ['answer:MK-0382', 'request:'].every(k => pieces.some(p => p.key.startsWith(k) && p.open && p.open.acts.some(a => a.act === 'away'))), JSON.stringify(pieces.map(p => p.key)));
    const lead = k => { const p = pieces.find(x => x.key.startsWith(k)); return (p && p.open && p.open.lead) || ''; };
    const has = (k, t) => { const p = pieces.find(x => x.key.startsWith(k)); return !!(p && p.open && p.open.acts.some(a => a.t === t || (t instanceof RegExp && t.test(a.t)))); };
    check('3c each act named for what it does: Answer on Redlines · Fill in N details · Send the chase · Check the 3 files',
      lead('answer:') === 'Answer on Redlines' && has('read:', /^Fill in \d+ details?$/) && lead('desk:MK-0368') === 'Send the chase' && lead('import:') === 'Check the 3 files',
      JSON.stringify([lead('answer:'), lead('read:'), lead('desk:MK-0368'), lead('import:')]));
    check('11a each piece is ONE ROW: what it is, the agreement, "Jambo · step N of M", Look; no body until Look',
      rows.length >= 5 && rows.every(p => p.title && /^Jambo · step \d+ of \d+$/.test(p.who) && p.look === 'Look' && !p.body && p.h > 0 && p.h < 48),
      JSON.stringify(rows.map(p => [p.key, p.title, p.who, p.look, p.h])).slice(0, 900));
    const ans = rows.find(p => p.key === 'answer:MK-0382');
    check('11b their answer reads as drawn: "Nordvik Logistik\'s answer" · the agreement and its reference · step 5 of 6, what Jambo found on the hover',
      !!ans && ans.title === 'Nordvik Logistik’s answer' && /^MK-0382·Master services agreement · Nordvik Logistik$/.test(ans.deal) && ans.who === 'Jambo · step 5 of 6' && /^Answers to their 2 redlines, read against our standards: /.test(ans.hover), JSON.stringify(ans));
    const heads = await page.evaluate(() => ({ board: (document.querySelector('#hm-agents .hb-cs') || {}).textContent || '', n: ndRead().n }));
    check('11c the card\'s head says Home\'s count: "N things · …"', new RegExp('^' + heads.n + ' things?( · |$)').test(heads.board), JSON.stringify(heads));
    if (await openAgent('late')) {
      const lk = await lookAt('desk:MK-0368');
      const ok = await page.evaluate(() => !!document.querySelector('#hm-agents [data-hb-ag-item^="desk:MK-0368"] .ag-mail.is-whole'));
      check('11d Look opens the piece under its row: the letter as the route will send it, Look open, its act the filled button', !!lk && ok && lk.expanded === 'true' && lk.lead === 'Send the chase', JSON.stringify(lk));
      const mail = await until(() => { const p = document.querySelector('#hm-agents [data-hb-ag-item^="desk:MK-0368"]'); const m = p && p.querySelector('.ag-mail');
        if (!m) return null; return { to: (m.querySelector('.ag-mail-h dd') || {}).textContent || '', text: m.innerText.replace(/\s+/g, ' ').trim(), after: p.innerText.replace(/\s+/g, ' ').trim() }; }, null, 5000);
      check('3d a chase shows the email whole: To, Subject, the letter as drawn, the day in words, signed by the sender for our company',
        !!mail && mail.to === 'insurance@kettle.example' && /Subject A reminder about the insurance certificate/.test(mail.text)
        && /Hello, This is a reminder about the insurance certificate under our Supply agreement \(MK-0368\), which was due on \d{1,2} [A-Z][a-z]+( \d{4})?\. Could you send it, or let us know when it will come\?/.test(mail.text)
        && /Amina Otieno, Highland Corporate Ltd/.test(mail.text), mail && mail.text.slice(0, 300));
      check('3e and under it: "It goes to the address on the contract. You are asked once more before it is sent."',
        !!mail && /It goes to the address on the contract\. You are asked once more before it is sent\./.test(mail.after), mail && mail.after.slice(-300));
      check('11e the email WHOLE: with a standing link to the agreement, its paragraph and the link stand between the reminder and the sign-off, as the route will mail them',
        !!mail && /could you send it, or let us know when it will come\? You can open the agreement here — no account needed: https?:\/\/\S+ Amina Otieno, Highland Corporate Ltd/i.test(mail.text), mail && mail.text.slice(0, 500));
      await page.evaluate(() => { const p = document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'); if (p) p.scrollIntoView({ block: 'center' }); });
      await shot(page, 'main-23-board-chase-email-1440x780');
      if (await press('#hm-agents [data-hb-ag-item^="desk:MK-0368"] [data-hb-ag-look]', '11f Look again')) {
        const folded = await until(() => { const p = document.querySelector('[data-hb-ag-item^="desk:MK-0368"]'); return p && !p.classList.contains('is-look') && !p.querySelector('.ag-mail') ? true : null; }, null, 4000);
        check('11f pressed again, it folds back to its one row', !!folded);
      }
    }

    console.log('\n8 · it fits the owner\'s three screens');
    await openAgent('late');
    await lookAt('desk:MK-0368');
    await until(() => !!document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'), null, 4000);
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(300);
      const fit = await page.evaluate(() => { const card = document.getElementById('hm-agents'); const r = card ? card.getBoundingClientRect() : null;
        return { open: !!document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'), sx: document.scrollingElement.scrollWidth > innerWidth,
          past: card ? [...card.querySelectorAll('button, .ag-mail, .nd-c, .nd-body')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.right > r.right + 1); }).length : -1 }; });
      check(`8a at ${w}×${hh}: the Board with the chase open — no sideways scroll, nothing past the edge`, fit.open && !fit.sx && fit.past === 0, JSON.stringify(fit));
      await page.evaluate(() => { const p = document.querySelector('[data-hb-ag-item^="desk:MK-0368"] .ag-mail'); if (p) p.scrollIntoView({ block: 'center' }); });
      await shot(page, `main-23-board-chase-email-${w}x${hh}`);
      await page.evaluate(() => { const c = document.getElementById('hm-agents'); if (c) c.scrollIntoView({ block: 'start' }); });
      await shot(page, `main-23-board-card-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n4 · Put away a piece that is not the desk\'s');
    await openAgent('round');
    await lookAt('answer:MK-0382');
    const before = await page.evaluate(() => ({ asks: negoNeedsYouIds(getContract('MK-0382')).length }));
    if (await press('#hm-agents [data-hb-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4 Put away their answer')) {
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
      await lookAt('answer:MK-0382');
      await press('#hm-agents [data-hb-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4d Put away again');
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
    await lookAt('desk:MK-0368');
    if (await press('#hm-agents [data-hb-ag-item^="desk:MK-0368"] [data-ag-act="away"]', '5 Put away the chase')) {
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
    check('6a "All seven agents: Ask me first · the default, for everyone" at the card\'s foot and, for an admin, Change',
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
    /* RE-POINTED 22 Oct 2026 (Round A): your move is its own group — three rows, "Show all N" onto the Board;
       a request Jambo found the paper for is HIS row now (the one desk merges them), its door "Open the request" */
    await toCounter();
    const needs = await page.evaluate(() => [...document.querySelectorAll('#cn-needs .nd-r')].filter(r => !r.querySelector('[data-nd-look]')).map(r => ({
      title: (r.querySelector('.cn-w b') || {}).innerText || '', sub: (r.querySelector('.cn-w > span') || {}).innerText || '', when: (r.querySelector('.nd-when') || {}).textContent || '',
      btn: (r.querySelector('button') || {}).textContent || '' })));
    check('11i three of your own rows in sight, the approval answered for an away colleague first, as drawn', needs.length === 3 && /^Answer an approval for /.test(needs[0].title), JSON.stringify(needs.map(n => n.title)));
    const ap = needs.find(n => /^Answer an approval for /.test(n.title));
    check('7a "Answer an approval for Unrestricted" · "for Unrestricted · away until <day>" · name · party · value · Decide',
      !!ap && /Answer an approval for Unrestricted\s*for Unrestricted · away until \S+/.test(ap.title.replace(/\n/g, ' ')) && /^MK-\S+ · Power purchase agreement · Helio Energy AB · KES/.test(ap.sub) && ap.btn === 'Decide',
      JSON.stringify(ap));
    const D7 = await page.evaluate(() => { const D = ndRead(); return { you: D.you.map(r => r.bundle ? 'bundle:' + r.n : r.y ? r.y.k + ':' + r.y.kind : r.key), jambo: D.jambo.map(r => r.it.kind), n: D.n,
      all: (document.querySelector('[data-nd-all="you"]') || {}).textContent || '' }; });
    check('7b details still to fill in are on the list (one row once more than three contracts owe them)', D7.you.some(k => /^bundle:|:details$/.test(k)), JSON.stringify(D7.you));
    check('7c a note of yours due is your row; the request Jambo found the paper for is his', D7.you.some(k => k === 'note:mynote') && D7.jambo.includes('request'), JSON.stringify(D7));
    check('7d "Show all N" on your move', new RegExp('^Show all \\d+$').test(D7.all), D7.all);
    const days = await page.evaluate(() => [...document.querySelectorAll('#cn-needs .nd-when')].map(e => e.textContent).filter(Boolean));
    check('7f how long a row has waited is said in words, never a bare number', days.length > 0 && days.every(t => /^(\d+ days?( late)?|today|in \d+ days?|due \S+( \S+)?)$/.test(t)), JSON.stringify(days));
    const coLast = await page.evaluate(() => { const D = ndRead(); return D.you.length ? D.you[D.you.length - 1].key : ''; });
    check('7g the admin\'s own row is the last of your move', coLast === 'company' || coLast === 'setup', coLast);
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(200);
      const fit = await page.evaluate(() => { const card = document.getElementById('cn-needs'); const r = card ? card.getBoundingClientRect() : null;
        return { sx: document.scrollingElement.scrollWidth > innerWidth, fits: !!r && r.bottom <= innerHeight + 1,
          past: card ? [...card.querySelectorAll('button, .cn-w b, .cn-w span, .nd-when')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.right > r.right + 1); }).length : -1 }; });
      check(`8b at ${w}×${hh}: Home — no sideways scroll, nothing past the card, the card within the screen`, !fit.sx && fit.past === 0 && fit.fits, JSON.stringify(fit));
      await page.evaluate(() => window.scrollTo(0, 0));
      await shot(page, `main-23-home-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    const reqShort = await page.evaluate(() => { const r = cnRows().find(y => y.k === 'req'); return r ? cnNeedShort(r) : ''; });
    check('7h a request\'s short name says whose and what it is for: "<name>’s NDA request"', /^\S+’s NDA request$/.test(reqShort), reqShort);
    if (await press('[data-nd-all="you"]', '7e Show all of your move')) {
      const all = await until(() => { const c = document.getElementById('hm-agents'); const on = c && c.querySelector('.nd-tab.on');
        return on && on.getAttribute('data-nd-tab') === 'you' ? [...c.querySelectorAll('.nd-br .nd-btn')].map(x => x.textContent) : null; }, null, 6000);
      check('7e the Board\'s card on your move: the note\'s Open and the details\' Fill in among them', !!all && all.includes('Open') && all.includes('Fill in'), JSON.stringify(all));
      /* the renewal is Jambo's row while his renewals agent prepares, yours where you set it to "Leave it to me" (6b above) */
      const ren = await page.evaluate(() => { const D = ndRead(); const r = D.jambo.find(x => x.it.kind === 'renewal') || D.you.find(x => x.y && x.y.kind === 'renewal'); return r ? ndParts(r).when : null; });
      check('11j the renewal\'s time in words: "in N days", never "in 40d"', !!ren && /^in \d+ days$/.test(ren), JSON.stringify(ren));
    }
    if (await press('#hm-agents [data-cn-note]', '7i Open the note')) {
      const lit = await until(() => { const r = document.querySelector('.is-landed'); return state.view === 'mynotes' && r && r.matches('[data-mn-row]') ? { row: r.getAttribute('data-mn-row') } : null; }, null, 6000);
      check('7i a note\'s door lands ON its row on My notes, lit', !!lit, JSON.stringify(lit || await page.evaluate(() => ({ view: state.view, lit: [...document.querySelectorAll('.is-landed')].map(e => e.outerHTML.slice(0, 80)) }))));
      await shot(page, 'main-23-note-landed-1440x780');
    }
    const rq = await page.evaluate(() => { const r = ndRead().jambo.find(x => x.it.kind === 'request'); return r ? r.it.key : null; });
    if (rq){
      await page.evaluate(k => ndOpenBoard('jambo', k), rq);
      const L = await lookAt(rq);
      if (L && await press('#hm-agents [data-hb-ag-item="' + rq + '"] [data-ag-act="ikopen"]', '7j Open the request')) {
        const lit = await until(() => { const r = document.querySelector('.is-landed'); return state.view === 'intake' && r && r.matches('[data-ik-row]') ? { row: r.getAttribute('data-ik-row') } : null; }, null, 8000);
        check('7j a request\'s door lands ON its row on Requests, lit', !!lit, JSON.stringify(lit || await page.evaluate(() => ({ view: state.view, lit: [...document.querySelectorAll('.is-landed')].map(e => e.outerHTML.slice(0, 80)) }))));
        await shot(page, 'main-23-request-landed-1440x780');
      }
    } else check('7j the request is Jambo\'s row', false, 'no request piece');
    await toCounter();
    if (await press('#cn-chips [data-cn-lead]', '11k the lead chip')) {
      const lit = await until(() => { const l = document.querySelector('#pd-signface .is-landed'); return l ? { gate: !!l.querySelector('#ap-approve'), stop: l.matches('[data-pd-road-stop]'), sa: l.id === 'sa-card', html: l.outerHTML.slice(0, 120) } : null; }, null, 10000);
      check('11k the lead chip ("Unrestricted\'s approval") LANDS ON the approval it opens: Before you sign, the Approval gate lit with its Approve', !!lit && (lit.gate || lit.sa || lit.stop), JSON.stringify(lit));
      await shot(page, 'main-23-approval-landed-1440x780');
    }

    console.log('\n10 · Jambo\'s house says the card\'s count');
    /* their answer back on the card (taken out of this person's put-away list
       through its one writer), so the Negotiation room carries its long drawn
       line, "Their round came back · 1 waiting for you" (11m) */
    await page.evaluate(async () => { try { await agentAwaySet('answer:MK-0382', null); } catch (_){} });
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
        const pg = document.querySelector('.jh-page'), pr = pg && pg.getBoundingClientRect(), st = document.getElementById('jh-stage'), sr = st && st.getBoundingClientRect(), cr = ct ? ct.getBoundingClientRect() : { left: 0 };
        const names = L.filter(l => l.k !== 'desk').map(l => ({ k: l.k, whole: said.includes(i18t('ag_' + l.k) + ' · ') }));
        return { ready: W.ready, card: ndRead().jambo.length, by: W.by, said, links: L.map(l => l.k), g: jhGeom(), audit: jhOverlapAudit(), sx: document.scrollingElement.scrollWidth > innerWidth, readings: AG_READINGS.slice(),
          fill: pr && dr ? { pageL: Math.round(pr.left - cr.left), pageR: Math.round(pr.right), strip: Math.round(dr.left), stageL: sr ? Math.round(sr.left - cr.left) : null } : null, names,
          door: door ? { right: Math.round(dr.right), w: Math.round(dr.width), n: n ? n.textContent : '', count: counterNeedsCount(), word: (door.querySelector('.igd-door-w') || {}).textContent || '', edge } : null }; });
      if (v) return v; await page.waitForTimeout(150); } return null; };
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(400);
      const H0 = await house();
      if (!H0){ check(`10 at ${w}×${hh}: the house drew its links`, false, 'no links'); continue; }
      if (w === 1440){
        const acting = Object.keys(H0.by).filter(k => H0.by[k] > 0 && !H0.readings.includes(k));
        check('10a Your desk says the card\'s count: "N waiting for you" = the Board card\'s "Jambo prepared N" (the one desk\'s rows)', H0.ready > 0 && H0.ready === H0.card && H0.said.includes(`${H0.ready} waiting for you`), JSON.stringify({ ready: H0.ready, card: H0.card, said: H0.said.filter(t => /waiting/.test(t)) }));
        check('10b each acting room with a piece says its own "N waiting for you" where it has the room, and the approvals desk waits for nobody',
          acting.length >= 3 && acting.some(k => H0.links.includes(k)) && !H0.links.includes('approve') && !('approve' in H0.by), JSON.stringify({ by: H0.by, links: H0.links }));
        check('10c four and three rooms a floor, five floors, as drawn', H0.g.cols === 4 && H0.g.floors === 5, JSON.stringify(H0.g));
        check('10d Jambo folded to the right edge: his face, Home\'s count, his name, ‹', !!H0.door && Math.abs(H0.door.right - H0.door.edge) <= 1 && H0.door.w >= 40 && H0.door.w <= 50
          && H0.door.n === String(H0.door.count) && H0.door.word === 'Jambo', JSON.stringify(H0.door));
      }
      check(`10e at ${w}×${hh}: every agent clear of his room's words, nothing out of its room (the overlap audit), no sideways scroll`, H0.audit.ok && !H0.sx, JSON.stringify(H0.audit.faults.slice(0, 4)));
      check(`11l at ${w}×${hh}: the house fills its page, from 16px at the left to Jambo's folded strip, no band between`,
        !!H0.fill && H0.fill.pageL <= 1 && Math.abs(H0.fill.pageR - H0.fill.strip) <= 1 && H0.fill.stageL != null && H0.fill.stageL <= 17, JSON.stringify(H0.fill));
      check(`11m at ${w}×${hh}: each room's work line keeps its agent's name whole, " · " and all — only the link's end may be cut`,
        H0.names.length > 0 && H0.names.every(n => n.whole), JSON.stringify(H0.names));
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
      /* RE-POINTED 22 Oct 2026 (Round A): the room lands on its agent's first row in the Board's Needs you card, on Jambo's tab */
      const landed = await until(k => { const r = document.querySelector('#hm-agents [data-nd-agent="' + k + '"]'); const on = document.querySelector('#hm-agents .nd-tab.on');
        return state.view === 'dashboard' && r && r.classList.contains('is-landed') && on && on.getAttribute('data-nd-tab') === 'jambo' ? true : null; }, roomK, 6000);
      check('10h a room\'s "N waiting for you" lands on that agent\'s first row in the Board\'s card, on Jambo\'s tab', !!landed, roomK);
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
