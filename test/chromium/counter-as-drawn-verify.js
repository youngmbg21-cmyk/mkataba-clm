/* THE COUNTER AND JAMBO'S WORK AS DRAWN (round 23's gaps, 18 Oct 2026: the
   owner's "build all the gaps" over the picked "Open in place"; the word stays
   "Put away"; js/views/counter.js, js/views/agents.js, js/sharemail.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 the head as drawn: "What do you need, <name>?", the box's words, and the
       chips "<first owed row> · contracts · calendar · draft a new agreement"
       — the lead chip presses that row's own door
     2 Jambo's work, opened: "· N prepared · nothing sent or filed until you
       press" in its head; every piece one row — its tag, what it is, its
       reference, one sentence — with Look, ONE act and Put away, on EVERY
       piece (their round's answer and a request too); the acts named as drawn
     3 Look on a chase is the email whole: To, Subject, the body with the day
       in words and the sender's name, and "It goes to the address on the
       contract. You are asked once more before it is sent." — no facts; Look
       stays "Look", pressed, and Send the chase is the one filled button
     4 Put away a piece that is not the desk's: gone for this person, Undo
       brings it back, kept on the server (a fresh load), a colleague still
       has it, and the work it is about still waits
     5 Put away a desk row (the chase): on the contract, Undo takes it back
     6 under the pieces, "All seven agents: Ask me first · <who set it> for
       everyone" with Change for an admin; a member reads who set it, any
       agent at another level by name, and Ask an admin opens the tracked ask
     7 Needs you as drawn: an approval answered for somebody away ("Answer an
       approval for X" · "for X · away until <day>" · name · party · value ·
       Open approval), "Fill in N details", a note of yours due, a request
       nobody holds, and "Show N more · <their names>"
     8 it fits the owner's three screens with a chase open
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
    const openWork = async pg => { const p = pg || page;
      if (!(await p.evaluate(() => !!document.getElementById('cn-jw-list')))) await p.locator('[data-cn-jw]').first().click().catch(() => {});
      const t0 = Date.now(); while (Date.now() - t0 < 4000) { if (await p.evaluate(() => !!document.getElementById('cn-jw-list'))) return true; await p.waitForTimeout(120); } return false; };

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
      chips: [...document.querySelectorAll('.cn-chips .cn-chip')].map(b => ({ t: b.textContent.trim(), lead: b.classList.contains('is-lead'), door: b.getAttribute('data-cn-need') || b.getAttribute('data-cn-note') || b.getAttribute('data-cn-req') || '' })),
      first: (() => { if (typeof cnRows !== 'function' || typeof cnNeedShort !== 'function') return '(no reading)'; const r = cnRows()[0]; return r ? cnNeedShort(r) : ''; })(), hint: (document.querySelector('#cn-needs .cn-hint') || {}).textContent || '' }));
    check('1a "What do you need, Amina?" and the box\'s own words', head.h1 === 'What do you need, Amina?' && head.ph === 'A contract, a party, a place, a draft, a question… or /', JSON.stringify([head.h1, head.ph]));
    check('1b the chips: the first owed row, then contracts · calendar · draft a new agreement — no upload, no "jambo\'s work"',
      head.chips.length === 4 && head.chips[0].lead && head.chips[0].t === head.first && !!head.chips[0].door
      && head.chips.slice(1).map(c => c.t).join('|') === 'contracts|calendar|draft a new agreement', JSON.stringify(head.chips));
    check('1c "each row\'s button opens its page"', head.hint === 'each row’s button opens its page', head.hint);

    console.log('\n2 · Jambo\'s work, opened');
    await openWork();
    const work = await page.evaluate(() => {
      const L = document.getElementById('cn-jw-list');
      const row = document.querySelector('#cn-needs .cn-jw .cn-w');
      return { head: row ? row.innerText.replace(/\s+/g, ' ').trim() : '',
        pieces: L ? [...L.querySelectorAll('[data-cn-ag-item]')].map(p => ({ key: p.getAttribute('data-cn-ag-item'),
          tag: !!p.querySelector('.cn-jw-tag i'), name: (p.querySelector('.cn-jw-name') || {}).textContent || '', line: (p.querySelector('.cn-jw-line') || {}).textContent || '',
          ctl: [...p.querySelectorAll('.cn-jw-acts button')].map(b => b.getAttribute('data-cn-look') ? 'Look' : b.getAttribute('data-ag-act') === 'away' ? 'Put away' : 'act:' + b.textContent.trim()) })) : [] };
    });
    check('2a its head: "Jambo\'s work · N prepared · nothing sent or filed until you press", one line',
      /^Jambo’s work · \d+ prepared · nothing sent or filed until you press$/.test(work.head), work.head);
    const three = work.pieces.filter(p => p.ctl.length === 3 && p.ctl[0] === 'Look' && /^act:/.test(p.ctl[1]) && p.ctl[2] === 'Put away');
    check('2b every piece: Look · ONE act · Put away', work.pieces.length >= 6 && three.length === work.pieces.length, JSON.stringify(work.pieces.map(p => p.key + ':' + p.ctl.join('/'))));
    check('2c Put away on their answer and on a request too (the owner\'s "every piece")',
      ['answer:MK-0382', 'request:'].every(k => work.pieces.some(p => p.key.startsWith(k) && p.ctl.includes('Put away'))), JSON.stringify(work.pieces.map(p => p.key)));
    const act = k => (work.pieces.find(p => p.key.startsWith(k)) || { ctl: [] }).ctl[1] || '';
    check('2d each act named for what it does: Answer on Redlines · Fill in 1 detail · Send the chase · Check the 3 files',
      act('answer:') === 'act:Answer on Redlines' && /^act:Fill in \d+ details?$/.test(act('read:')) && act('desk:MK-0368') === 'act:Send the chase' && act('import:') === 'act:Check the 3 files',
      JSON.stringify([act('answer:'), act('read:'), act('desk:MK-0368'), act('import:')]));
    const P = k => work.pieces.find(p => p.key.startsWith(k)) || {};
    check('2e each piece says what it is and one sentence: "A chase to Kettle & Co" · "A read of Baltic Freight" · "3 imports to check"',
      P('desk:MK-0368').name === 'A chase to Kettle & Co' && P('read:').name === 'A read of Baltic Freight' && P('import:').name === '3 imports to check'
      && /^Read on arrival: a brief, 2 obligations found/.test(P('read:').line) && /^3 files wait for your check: /.test(P('import:').line)
      && work.pieces.every(p => p.tag), JSON.stringify(work.pieces.map(p => [p.name, p.line.slice(0, 50)])));

    console.log('\n3 · Look on a chase is the email whole');
    if (await press('[data-cn-ag-item^="desk:MK-0368"] [data-cn-look]', '3 Look')) {
      const look = await until(() => { const p = document.querySelector('[data-cn-ag-item^="desk:MK-0368"]'); const b = p && p.querySelector('.cn-jw-body');
        if (!b) return null;
        return { text: b.innerText.replace(/\s+/g, ' ').trim(), facts: b.querySelectorAll('.ag-kv').length, to: (b.querySelector('.ag-mail-h dd') || {}).textContent || '',
          pressed: (p.querySelector('[data-cn-look]') || {}).getAttribute('aria-pressed'), word: (p.querySelector('[data-cn-look]') || {}).textContent,
          filled: [...document.querySelectorAll('#cn-jw-list .ui-btn-primary')].map(x => x.textContent.trim()) }; }, null, 4000);
      check('3a To, Subject and the body, the day in words, signed by the sender for our company',
        !!look && look.to === 'insurance@kettle.example' && /Subject A reminder about the insurance certificate/.test(look.text)
        && /Hello, This is a reminder about "the insurance certificate" under our agreement "Supply agreement" \(MK-0368\), which was due on \d{1,2} [A-Z][a-z]+ \d{4}\./.test(look.text)
        && /Amina Otieno, Highland Corporate Ltd/.test(look.text), look && look.text.slice(0, 300));
      check('3b and under it: "It goes to the address on the contract. You are asked once more before it is sent." — no facts',
        !!look && /It goes to the address on the contract\. You are asked once more before it is sent\.$/.test(look.text) && look.facts === 0, look && look.text.slice(-120));
      check('3c Look stays "Look", pressed, and Send the chase is the one filled button', !!look && look.word === 'Look' && look.pressed === 'true'
        && look.filled.length === 1 && look.filled[0] === 'Send the chase', JSON.stringify(look && [look.word, look.pressed, look.filled]));
      await shot(page, 'counter-chase-open-1440x780');
    }

    console.log('\n8 · it fits the owner\'s three screens with the chase open');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.waitForTimeout(250);
      const fit = await page.evaluate(() => { const L = document.getElementById('cn-jw-list'); const card = document.getElementById('cn-needs');
        const r = card ? card.getBoundingClientRect() : null;
        return { open: !!L, sx: document.scrollingElement.scrollWidth > innerWidth,
          past: card ? [...card.querySelectorAll('button, .cn-w b, .cn-w span, .ag-mail')].filter(e => { const q = e.getBoundingClientRect(); return q.width && (q.right > innerWidth + 1 || q.right > r.right + 1); }).length : -1 }; });
      check(`8 at ${w}×${hh}: open, no sideways scroll, nothing past the edge`, fit.open && !fit.sx && fit.past === 0, JSON.stringify(fit));
      await shot(page, `counter-as-drawn-${w}x${hh}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    console.log('\n7 · Needs you as drawn');
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
    if (await press('[data-cn-all]', '7e Show more')) {
      const all = await until(() => { const b = document.querySelector('[data-cn-all]'); return b && b.textContent === 'Show fewer' ? [...document.querySelectorAll('#cn-needs [data-cn-note], #cn-needs [data-cn-req]')].map(x => x.textContent) : null; }, null, 3000);
      check('7e the rest come, the note\'s Open note and the request\'s Open request among them', !!all && all.includes('Open note') && all.includes('Open request'), JSON.stringify(all));
    }

    console.log('\n4 · Put away a piece that is not the desk\'s');
    await openWork();
    const before = await page.evaluate(() => ({ keys: hbAgentsData(null).rows.flatMap(r => r.items.map(i => i.key)), asks: negoNeedsYouIds(getContract('MK-0382')).length }));
    if (await press('[data-cn-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4 Put away their answer')) {
      const gone = await until(() => !hbAgentsData(null).rows.some(r => r.items.some(i => i.key === 'answer:MK-0382')) && !document.querySelector('[data-cn-ag-item="answer:MK-0382"]')
        ? { kept: (currentUser().prefs.agentAway || {})['answer:MK-0382'] || null, toast: [...document.querySelectorAll('#toast-root [data-toast-act]')].map(b => b.textContent) } : null, null, 5000);
      check('4a gone from this person\'s list, kept in their own prefs, with Undo', !!gone && !!gone.kept && gone.toast.includes('Undo'), JSON.stringify(gone));
      const asks = await page.evaluate(() => negoNeedsYouIds(getContract('MK-0382')).length);
      check('4b the work it is about still waits (their asks untouched)', asks === before.asks && asks > 0, `${before.asks} → ${asks}`);
      if (await press('#toast-root [data-toast-act]', '4c Undo')) {
        const back = await until(() => hbAgentsData(null).rows.some(r => r.items.some(i => i.key === 'answer:MK-0382')) && !(currentUser().prefs.agentAway || {})['answer:MK-0382']
          && !!document.querySelector('[data-cn-ag-item="answer:MK-0382"]'), null, 5000);
        const dbg = back ? '' : await page.evaluate(() => JSON.stringify({ view: state.view, list: !!document.getElementById('cn-jw-list'), rows: [...document.querySelectorAll('[data-cn-ag-item]')].map(x => x.getAttribute('data-cn-ag-item')), away: currentUser().prefs.agentAway || null }));
        check('4c Undo brings it back, on the list in front of you', !!back, dbg);
      }
      await press('[data-cn-ag-item="answer:MK-0382"] [data-ag-act="away"]', '4d Put away again');
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
    await toCounter(); await openWork();
    if (await press('[data-cn-ag-item^="desk:MK-0368"] [data-ag-act="away"]', '5 Put away the chase')) {
      const gone = await until(() => { const c = getContract('MK-0368'); const k = Object.keys(c.desk || {}).find(x => /^chase/.test(x));
        return k && !document.querySelector('[data-cn-ag-item^="desk:MK-0368"]') ? k : null; }, null, 5000);
      check('5a the desk keeps the stamp on the contract (its one writer)', !!gone, String(gone));
      if (await press('#toast-root [data-toast-act]', '5b Undo')) {
        const back = await until(() => { const c = getContract('MK-0368'); return !Object.keys(c.desk || {}).some(x => /^chase/.test(x)) && hbAgentsData(null).rows.some(r => r.items.some(i => /^desk:MK-0368/.test(i.key))); }, null, 5000);
        check('5b Undo takes the stamp back off, through the same writer', !!back);
      }
    }

    console.log('\n6 · how far the agents may go');
    await toCounter(); await openWork();
    const lvA = await until(() => { const e = document.querySelector('[data-cn-levels]'); return e ? { t: e.innerText.replace(/\s+/g, ' ').trim(), change: !!document.querySelector('[data-cn-lv-change]'), ask: !!document.querySelector('[data-cn-lv-ask]') } : null; }, null, 6000);
    check('6a "All seven agents: Ask me first · the default, for everyone" and, for an admin, Change',
      !!lvA && lvA.t === 'All seven agents: Ask me first · the default, for everyone' && lvA.change && !lvA.ask, JSON.stringify(lvA));
    const saved = await page.evaluate(async () => { try { await agentSaveCfg('renew', { level: 'mine' }); const s = agentsStatus(); return s.agents.renew.levelBy || null; } catch (e) { return 'err ' + e.message; } });
    check('6b the server records who moved a level', saved === 'Amina Otieno', String(saved));
    const resave = await page.evaluate(async () => { const was = agentsStatus().agents.renew.levelAt; await new Promise(r => setTimeout(r, 20));
      await agentSaveCfg('renew', { level: 'mine', at: 3 }); const now = agentsStatus().agents.renew.levelAt; return was && now === was ? now : null; });
    const member = await open('everything@example.co.ke', 'their-own-pass-9', 1);
    await toCounter(member); await openWork(member);
    const lvM = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) {
      const v = await member.evaluate(() => { const e = document.querySelector('[data-cn-levels]'); return e ? { t: e.innerText.replace(/\s+/g, ' ').trim(), ask: !!document.querySelector('[data-cn-lv-ask]') } : null; });
      if (v) return v; await member.waitForTimeout(150); } return null; })();
    check('6c a member reads who set it, and the agent at another level by name, with Ask an admin',
      !!lvM && lvM.t === '6 agents: Ask me first · Renewals: Leave it to me · set by Amina for everyone' && lvM.ask, JSON.stringify(lvM));
    await member.evaluate(() => { const e = document.querySelector('.cn-jw-foot'); if (e) e.scrollIntoView({ block: 'center' }); });
    await shot(member, 'counter-levels-member-1440x780');
    check('6d a Save that leaves the level where it was names nobody new', !!resave, String(resave));
    if (lvM && await press('[data-cn-lv-ask]', '6e Ask an admin', member)) {
      const asked = await (async () => { const t0 = Date.now(); while (Date.now() - t0 < 8000) {
        const v = await member.evaluate(() => state.view === 'team' && document.querySelector('[data-st-ask-panel="agents"]') ? (document.querySelector('.st-jb-feed, #st-jb-feed') || {}).innerText || 'card' : null);
        if (v) return v; await member.waitForTimeout(150); } return null; })();
      check('6e Ask an admin opens the tracked ask, about the agents', !!asked && /How far Jambo’s agents may go/.test(asked), String(asked).slice(0, 160));
    }
    await member.close();

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
