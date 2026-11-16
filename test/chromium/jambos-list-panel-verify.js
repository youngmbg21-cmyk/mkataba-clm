/* JAMBO'S PANEL BESIDE THE LISTS (the owner's "build all the gaps", 18 Oct
   2026: rounds 14, 15 and 19 of the redesign as drawn, and the hint line under
   every Jambo ask box — that line since removed by "Chambers", 20 Oct 2026;
   js/views/inspector.js jlFrame/jlAsk, the pages'
   regInsPaint · apInsPaint · dirPaintPanel)

   WHAT THIS PINS, driven in a real browser as an admin who stands in for an
   away colleague (Jonas):
     1 NEGOTIATIONS, nothing chosen: the panel at the right edge, Jambo's tab,
       the page in his words from the page's own counts, its doors as chips,
       the ask box with its words and NO hint line under it (RE-POINTED 20 Oct
       2026, Chambers: the hint line under every Jambo box is removed)
     2 a row pressed: "Negotiation", the pill with its wait, the facts as rows
       (Value · Lead · Their changes · Last sent), Needs you "Answer N
       redlines", What Jambo read; ‹ Jambo lets the row go
     3 the ask: "/" lists the places; a question is said in the panel, the
       window stays shut; a place word opens its page
     4 the fold: a strip with his face, the page takes the room; the strip opens it
     5 APPROVALS: the list head's pill and its late note, the foot "Showing N
       of N", Whose turn "You for Jonas", a colleague's signature "Jonas signs
       · back <day>"; the panel "Approval": Approve for Jonas · Refuse… ·
       Open Before you sign, "Since last look · Nothing changed in the wording",
       the recorded-as sentence
     6 PEOPLE: Jonas in the panel — "Person", Show their contracts · Email, the
       rows Email · In HaTi · Streams · Named on · Away, "Waiting on Jonas"
     7 NO HINT LINE under Home's box beside a paper, Settings' or Import's
       (RE-POINTED 20 Oct 2026, Chambers: the hint line is removed everywhere);
       each box still in view
     8 the owner's three screens: the panel inside the window, the list beside
       it (never under it), the box in view, nothing sideways
   PASS 3 (18 Oct 2026, the checker against the picked drawings):
     2f "What is open" says "2 redlines to answer"; Needs you names "Clause N
        Name · clause N Name"; only the doors — no ⋯, no icon on a door
     5g the Approval's panel draws no doors; 5h a colleague's approval says
        "Sara approves", Whose turn "Sara"
     6d Jonas is "Named on" the contracts he approves and signs: the row, the
        list ("approver", "signer") and a live Show their contracts; no ⋯
     9  PARTIES: a row of what waits on you reads whole in the 384px panel (380 until The Brief, 21 Oct 2026) —
        its title, its short door, the Waiting on you fact — at three screens
   PASS 4 (18 Oct 2026, evening, the checker's second pass):
     5i "Since last look" when the value moved after the question was put
     10a the whose-move pill right after the party's name
     10b–d at three screens (RE-POINTED 29 Oct 2026, ONE SHEET): the head and the
        list card one sheet, the card reaching the foot of Jambo's panel, its foot
        inside it; Approval rules inside the head; every party's name reads whole
     10e a colleague's signature says how long it has waited
     10f an away signer: Jambo says the rule and the proper step, with its door
     10g the list panel's ask reads as the Counter's: a party's name and
        "contracts ending in 90 days" are answered IN the panel, the reader
        stays on the list (RE-POINTED 22 Oct 2026, Part 8's question 3 = A;
        was: handed to Home's Board); "draft an NDA with …" opens the one
        form — no Jambo call
     10h Our paper: the bar's Jambo door opens the window (a hidden panel is
        not on screen)
     10i–j the person panel: "1 contract · 1 live"; Waiting on without dots,
        one line; Named on in a bordered card
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/jambos-list-panel-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/jambos-list-panel-verify.js */
/* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way"): nothing chosen, his words are the Overview's (.jov-head, .jov-v, .jov-src) and his chips its offers (.jov-lnk.is-ask) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
if (OUT) { try { fs.mkdirSync(OUT, { recursive: true }); } catch (_) {} }
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const jonas = W.users.unrestricted;
  await W.admin.json('/api/users/' + jonas.id, { method: 'PATCH', body: { name: 'Jonas Berg' } }).catch(() => {});
  const admin = (await W.admin.json('/api/bootstrap')).me;
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Over 10 M',
    cond: { type: 'value', op: '>=', value: 10000000 }, approver: { kind: 'member', id: jonas.id, name: 'Jonas Berg' } }] } });
  /* Jonas is away; the admin answers his approvals until he is back */
  await W.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: admin.id, from: day(0), to: day(4) } });
  /* PASS 3: a second rule naming Sara, so an approval waits on someone the reader does not stand in for */
  const sara = W.users.restricted;
  await W.admin.json('/api/users/' + sara.id, { method: 'PATCH', body: { name: 'Sara Nyström' } }).catch(() => {});
  await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [{ id: 'r1', order: 1, name: 'Over 10 M',
    cond: { type: 'value', op: '>=', value: 10000000 }, approver: { kind: 'member', id: jonas.id, name: 'Jonas Berg' } },
    { id: 'r2', order: 2, name: 'Over 5 M', cond: { type: 'value', op: '>=', value: 5000000 }, approver: { kind: 'member', id: sara.id, name: 'Sara Nyström' } }] } });
  const mk = async (id, name, value, status, extra) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: Object.assign(
    H.fixtureContract(id, name, name.split(' ')[0] + ' AB', H.FOLDER_A, value, status), { owner: { id: admin.id, name: admin.name } }, extra || {}) } });
  /* an approval the admin answers for Jonas: the save that makes it due stamps its question */
  await mk('MK-AP1', 'Helio power purchase', 20000000, 'Draft');
  { const c = await W.admin.json('/api/contracts/MK-AP1'); const v = c._v; delete c._v; c.status = 'Under Review';
    await W.admin.raw('/api/contracts/MK-AP1', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  /* PASS 3: one that waits on Sara alone (over 5 M, under 10 M) */
  await mk('MK-AP2', 'Kustfrakt freight', 6000000, 'Draft');
  { const c = await W.admin.json('/api/contracts/MK-AP2'); const v = c._v; delete c._v; c.status = 'Under Review';
    await W.admin.raw('/api/contracts/MK-AP2', { method: 'PUT', body: { contract: c, baseVersion: v } }); }
  /* the admin's own contract, below the rule, that waits on Jonas's signature */
  await mk('MK-SG1', 'Stratos support', 300000, 'Under Review',
    { signerPlan: [{ id: 's-j', party: 'internal', name: 'Jonas Berg', memberId: jonas.id, order: 1 }] });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    /* THE WINDOW IN THE PAGE IS WHAT THIS FILE PRESSES THE ✦ FOR (14 Nov 2026): where the browser keeps a window on top the ✦ opens Jambo popped out (ai.js aiStarPress, f1049), so this page is a browser without one, as Safari and Firefox are */
    await page.addInitScript(() => { try { Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, writable: true, value: undefined }); } catch (_) {} });
    page.on('pageerror', e => errors.push(e.message));
    /* a part whose control is missing reports and the next part runs — never a 30s wait */
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Negotiations is ONE table (.ngn-table,
       tr[data-ngn-row]); a round is chosen on arrival, and the CHOSEN row pressed again OPENS it — so a row is
       pressed only when it is not already the chosen one (.is-sel) */
    const NGN = id => `.ngn-table tr[data-ngn-row="${id}"]`;
    const ngnChoose = async id => { await until(sel => document.querySelector(sel), NGN(id), 8000);
      if (!(await page.evaluate(sel => { const r = document.querySelector(sel); return !!(r && r.classList.contains('is-sel')); }, NGN(id)))) await page.click(NGN(id)); };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-SG1') && state.away, null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* two negotiations with their changes on the table: our move */
    await page.evaluate(async () => {
      for (const id of ['MK-A2', 'MK-B2']) { const c = getContract(id); if (!c) continue; if (c._light) await ensureFull(c); negoInit(c);
        const cl = negoClauseList(c);
        await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within sixty (60) days.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Net-60' });
        if (cl[1]) await negoEditClause(c, cl[1].clauseId, '<p>Liability is capped at 100% of the fees.</p>', { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Cap at 100%' });
        persist(c); }
    });

    /* ---- 1 Negotiations, nothing chosen ---- */
    await page.evaluate(() => openNegotiations({ list: true }));
    await until(() => document.querySelectorAll('.ngn-table tr[data-ngn-row]').length >= 2 && document.querySelector('#ins-panel.is-jambo .jl-body'), null, 10000);
    await page.waitForTimeout(300);
    const PANEL = () => { const p = document.getElementById('ins-panel'); if (!p) return null; const r = p.getBoundingClientRect();
      const q = document.getElementById('jl-q'), hint = p.querySelector('.jb-hint, .jb-keys, .jb-kbd');
      return { jambo: p.classList.contains('is-jambo'), folded: p.classList.contains('is-folded'), w: Math.round(r.width), right: Math.round(r.right), left: Math.round(r.left),
        tab: !!p.querySelector('[data-jl-home] .pd-tab-g'), word: (p.querySelector('[data-jl-word]') || {}).textContent || '',
        back: !!(p.querySelector('[data-jl-back]') && !p.querySelector('[data-jl-back]').hidden),
        words: [...p.querySelectorAll('[data-jl-words] :is(.jl-bub, .jov-head, .jov-v)')].map(b => b.textContent.trim()),
        chips: [...p.querySelectorAll(':is([data-jl-chip], .jov-lnk.is-ask)')].map(b => b.textContent.trim()),
        ph: q ? q.getAttribute('placeholder') : null, hint: hint ? hint.textContent.replace(/\s+/g, ' ').trim() : null,
        text: p.innerText.replace(/\s+/g, ' ') }; };
    const N0 = await page.evaluate(PANEL);
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): Jambo's panel FLOATS, a white card 8px in from the window's edge, its top and its foot (the owner's drawing) */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the new look's list panel stands EDGE TO EDGE
       (CLAUDE.md: a panel that is not edge to edge is the old look) — its right edge is the window's */
    check('1a the panel is Jambo\'s, edge to edge at the right, Home\'s panel\'s width, with his tab', !!N0 && N0.jambo && N0.tab && N0.w === 384 && Math.abs(N0.right - 1440) <= 1, JSON.stringify(N0 && { w: N0.w, right: N0.right, tab: N0.tab }));
    /* RE-POINTED 20 Oct 2026 (Chambers): no hint line under any Jambo box */
    check('1c the box asks in its words, and no hint line under it', !!N0 && N0.ph === 'Ask Jambo, or type / for a place' && N0.hint === null, JSON.stringify(N0 && { ph: N0.ph, hint: N0.hint }));

    /* ---- 2 a row pressed ---- */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the chosen round's panel is THE PRESSED ROUND ALONE
       (CLAUDE.md, ngnPanelFiveHtml, owner 16 Nov 2026): its name the headline, the party · reference · value over it,
       whose move in Jambo's sentence, three numbers (unsent · asks still open · round), its facts (Their asks · Desk),
       and ONE black button, Open the redlines. Each old claim is asked of its new place. */
    await ngnChoose('MK-A2');
    const N1 = await until(() => { const p = document.getElementById('ins-panel'); return p && p.querySelector('.ngn-panel[data-ngn-for="MK-A2"] .jov5-title') ? true : null; });
    const N1p = await page.evaluate(PANEL);
    const N1r = await page.evaluate(() => { const p = document.getElementById('ins-panel'), f = p.querySelector('.ngn-panel[data-ngn-for="MK-A2"]') || p;
      const facts = {}; f.querySelectorAll('.jov5-group .jov5-row').forEach(r => { const b = r.querySelector('.jov5-rt > b'), s = r.querySelector('.jov5-rt > span'); if (b) facts[b.textContent.trim()] = s ? s.textContent.replace(/\s+/g, ' ').trim() : ''; });
      return { eb: ((f.querySelector('.jov5-eb') || {}).textContent || '').trim(), sub: ((f.querySelector('.jov5-sub') || {}).textContent || '').trim(), facts,
        glance: [...f.querySelectorAll('.jov5-glance .jov5-g')].map(g => [...g.children].map(x => x.textContent.trim()).join(' ')) }; });
    check('2a no word beside his tab, no duplicate back button', !!N1 && !N1p.word && !N1p.back, JSON.stringify({ word: N1p.word, back: N1p.back }));
    /* was: the pill "Our move · …" — the wait is said in Jambo's sentence under the round's name */
    check('2b the panel says whose move it is: "Waiting on your answer."', /^Waiting on your answer/.test(N1r.sub), JSON.stringify(N1r.sub));
    /* was: the rows Value · Lead · Their changes · Last sent — the value rides the line over the name, the lead is the Desk, their changes are Their asks */
    check('2c the facts: the party · reference · value over the name; Their asks; the Desk with its lead', /Nandi Dairy · MK-A2 · KES /.test(N1r.eb) && 'Their asks' in N1r.facts && /leads/.test(N1r.facts.Desk || ''), JSON.stringify(N1r));
    /* was: Needs you "Answer 2 redlines" — the round's own number of asks still open, in amber */
    check('2d the asks waiting on you are counted: "2 asks still open"', N1r.glance.includes('2 asks still open') && /^2, waiting on your answers/.test(N1r.facts['Their asks'] || ''), JSON.stringify(N1r.glance));
    /* RETIRED 16 Nov 2026 (#762): 2d's second half, "What Jambo read in the drawing's order" (brief · playbook · scan ·
       oblig) — old look only: the pressed round's five parts carry no reading list; the Dossier holds the reads */
    await shot('r14-negotiation-panel-1440x780.png');
    await part('2f pass 3', async () => {
      const N4 = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        const row = document.querySelector('.ngn-table tr[data-ngn-row="MK-A2"]');
        const f = p.querySelector('.ngn-panel[data-ngn-for="MK-A2"]') || p;
        const asks = [...f.querySelectorAll('.jov5-group .jov5-row')].find(r => /Their asks/.test(r.textContent));
        return { open: row ? ((row.querySelector('.ngn-open') || {}).textContent || '').trim() : null,
          sub: asks ? ((asks.querySelector('.jov5-rt > span') || {}).textContent || '').trim() : '',
          more: !!p.querySelector('[data-ins-more]'),
          go: [...f.querySelectorAll('.jov5-go')].map(b => ({ t: b.textContent.trim(), svg: !!b.querySelector('svg') })) }; });
      /* was: "2 redlines to answer" in the row — the row's open-asks column leads with their number and quotes each ask */
      check('2f "What is open": the row says 2 asks, each quoted with its §', /^2 · .*§ ?\d.*§ ?\d/.test(N4.open || ''), JSON.stringify(N4.open));
      /* was: "Clause N Name · clause N Name" — the panel's Their asks names each clause by its § */
      check('2g Their asks names the clauses: "§ N · § N"', /§ ?[\dIVXLC.]+ · § ?[\dIVXLC.]+/.test(N4.sub), JSON.stringify(N4.sub));
      /* was: the doors Negotiation · Workspace — the round's one black button opens its redlines, no ⋯, no icon */
      check('2h one door: Open the redlines, no ⋯, no icon on it', !N4.more && N4.go.length === 1 && N4.go[0].t === 'Open the redlines' && !N4.go[0].svg, JSON.stringify(N4));
    });
    await part('2e ‹ Overview', async () => {
      /* RE-POINTED 16 Nov 2026 (#762): the tab "‹ Overview" is the way back from the chosen round (_jlBack) */
      await page.click('#ins-panel [data-jl-home]');
      const N2 = await until(() => { const p = document.getElementById('ins-panel'); return p && p.querySelector('.ngn-panel[data-ngn-for=""] .jov5-title') && !document.querySelector('.ngn-table tr.is-sel') ? true : null; });
      check('2e ‹ Overview lets the row go: the page\'s overview back, no row lit', !!N2);
      const N3 = await page.evaluate(() => { const p = document.getElementById('ins-panel'), f = p && p.querySelector('.ngn-panel[data-ngn-for=""]'); if (!f) return null;
        return { title: ((f.querySelector('.jov5-title') || {}).textContent || '').trim(), sub: ((f.querySelector('.jov5-sub') || {}).textContent || '').trim(),
          you: !!f.querySelector('[data-ngn-gotab="you"]'), picks: [...f.querySelectorAll('[data-ngn-pick]')].map(b => b.getAttribute('data-ngn-pick')),
          back: !!(p.querySelector('[data-jl-back]') && !p.querySelector('[data-jl-back]').hidden), live: document.querySelectorAll('.ngn-table tr[data-ngn-row]:not(.is-settled)').length }; });
      /* RE-POINTED 16 Nov 2026 (#762): the overview's five parts — its headline counted from the page, Jambo's sentence of
         whose answers wait, "your move" a door to that tab and each round a row that chooses it; no ‹ Jambo.
         RETIRED half: the "start a negotiation" chip (old look only: the five parts draw no such offer) */
      check('1b nothing chosen: the page in his words from its own counts, its doors, no ‹ Jambo',
        !!N3 && /^\d+ rounds? waits? on you\.$/.test(N3.title) && /wait on your answers/.test(N3.sub) && N3.you && N3.picks.includes('MK-A2') && !N3.back,
        JSON.stringify(N3));
      await shot('r14-negotiations-words-1440x780.png');
    });

    /* ---- 3 the ask ---- */
    await part('3 the ask', async () => {
      await page.click('#jl-q'); await page.keyboard.type('/');
      const POP = await until(() => { const p = document.querySelector('[data-jl-pop]'); return p && !p.hidden && p.querySelectorAll('[data-jl-pop-row], button, li').length ? p.innerText.replace(/\s+/g, ' ') : null; });
      check('3a "/" lists the places in the box', !!POP && /Approvals|Contracts|Calendar/i.test(POP), POP && POP.slice(0, 120));
      await page.keyboard.press('Escape');
      await page.fill('#jl-q', 'which of these is worth the most?');
      await page.press('#jl-q', 'Enter');
      const ANS = await until(() => { const f = document.getElementById('jl-feed');
        return f && f.querySelectorAll('.ai-msg').length >= 2 && !f.querySelector('.typing, [data-jb-thinking]') && /\S/.test((f.querySelector('.ai-msg:last-child') || {}).textContent || '') ? { n: f.querySelectorAll('.ai-msg').length, open: !!(window.ai && ai.open), win: (document.getElementById('ai-feed') || {}).innerHTML === '' } : null; }, null, 15000);
      check('3b a question is said in the panel; the window stays shut and holds no second copy', !!ANS && !ANS.open && ANS.win, JSON.stringify(ANS));
      await shot('r14-negotiations-ask-1440x780.png');
    });
    /* ---- 4 the fold ---- */
    await part('4 the fold', async () => {
      await page.click('#ins-panel [data-jl-fold]');
      const F = await until(() => { const p = document.getElementById('ins-panel'); const cs = document.getElementById('content-scroll');
        return p && p.classList.contains('is-folded') ? { w: Math.round(p.getBoundingClientRect().width), door: !!p.querySelector('[data-jl-door] .igd-door-face, [data-jl-door] img'),
          page: cs ? Math.round(cs.getBoundingClientRect().right) : 0 } : null; });
      check('4a folded: a strip with his face, the page takes the room', !!F && F.w === 46 && F.door && F.page >= 1440 - 46 - 8 - 2, JSON.stringify(F));
      await page.click('#ins-panel [data-jl-door]');
      const F2 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.classList.contains('is-folded') ? Math.round(p.getBoundingClientRect().width) : null; });
      check('4b the strip opens it again', F2 === 384, String(F2));
    });
    await part('3c a place word', async () => {
      /* RE-POINTED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"):
         the free readers are Overview's; Jambo's tab sends every typed word to the chat (every-jambo-tab-verify) */
      await page.evaluate(() => { try { jlTalkBack(); } catch (_) {} });
      await page.fill('#jl-q', 'approvals'); await page.press('#jl-q', 'Enter');
      const V = await until(() => state.view === 'approvals' ? state.view : null);
      check('3c a place word opens its page, costing nothing', V === 'approvals', String(V));
    });
    if (await page.evaluate(() => state.view !== 'approvals')) await page.evaluate(() => setView('approvals'));

    /* ---- 5 Approvals ---- */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Approvals is ONE table (.apn-table) under its own
       head (.cun-head) with the tabs Mine · Waiting on others · Done ([data-apn-tab]) and a foot (.apn-foot); whose turn
       is the row's mark and its hover (listSapCellHtml, apTurnText); the chosen approval's panel is THE FIVE PARTS
       (apnLeadFiveHtml, owner 16 Nov 2026): no button — Approve and Decline stay on the row. Each claim asked of its new place. */
    const apMark = id => page.evaluate(k => { const r = document.querySelector(`[data-ap-row="${k}"]`); const m = r && r.querySelector('td:first-child [title]'); return m ? m.getAttribute('title') : null; }, id);
    const apTab = async k => { const b = await page.$(`[data-apn-tab="${k}"]`); if (b) { await b.click(); await page.waitForTimeout(300); } return !!b; };
    await part('5 Approvals', async () => {
      await until(() => document.querySelector('[data-ap-row="MK-AP1"]') && document.querySelector('#ins-panel.is-jambo'), null, 10000);
      const A0 = await page.evaluate(() => { const on = document.querySelector('.apn-tab.is-on');
        return { pill: ((on && on.querySelector('span')) || {}).textContent || '', foot: ((document.querySelector('.apn-card .apn-foot') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
          band: !!document.querySelector('.ap-band'), rows: document.querySelectorAll('[data-ap-row]').length }; });
      check('5a the head: the lit tab counts the rows, the foot says the same number; no band',
        A0.rows > 0 && Number(A0.pill.trim()) === A0.rows && new RegExp('^' + A0.rows + ' for you').test(A0.foot) && !A0.band, JSON.stringify(A0));
      const ap1 = await apMark('MK-AP1');
      await apTab('others');
      const sg1 = await until(() => { const r = document.querySelector('[data-ap-row="MK-SG1"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 4000);
      check('5b Whose turn: "You for Jonas" on the row\'s mark; a colleague\'s signature "Jonas signs · back …"', ap1 === 'You for Jonas' && /Jonas signs · back /.test(sg1 || ''), JSON.stringify({ ap1, sg1 }));
      const ap2 = await apMark('MK-AP2');
      check('5h a colleague\'s approval: whose turn "Sara"', !!ap2 && /^Sara\b/.test(ap2), JSON.stringify(ap2));
      await apTab('mine');
      await page.click('#ins-panel [data-jl-home]');
      const A0w = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title'); return t ? p.innerText.replace(/\s+/g, ' ') : null; });
      check('5c nothing chosen: the page in his words — how many wait, and the late ones', !!A0w && /wait for a yes or a signature/.test(A0w) && /late — past 7 days/.test(A0w), JSON.stringify(A0w && A0w.slice(0, 300)));
      /* kept from 5c: whom the reader stands in for, said on the page's overview */
      check('5c2 nothing chosen: whom the reader stands in for', !!A0w && /Jonas/.test(A0w), JSON.stringify(A0w && A0w.slice(0, 300)));
      await shot('r15-approvals-words-1440x780.png');
      await page.click('[data-ap-row="MK-AP1"]');
      const A1 = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !/Helio/.test(p.textContent) || !p.querySelector('.jov5-title')) return null;
        const row = document.querySelector('[data-ap-row="MK-AP1"]');
        return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', go: p.querySelectorAll('.jov5-go, [data-ins-act]').length,
          approve: row ? ((row.querySelector('[data-ap-approve]') || {}).textContent || '').trim() : null, decline: row ? ((row.querySelector('[data-ap-refuse]') || {}).textContent || '').trim() : null,
          sub: ((p.querySelector('.jov5-sub') || {}).textContent || '').trim(),
          rows: [...p.querySelectorAll('.jov5-group .jov5-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()),
          labels: [...p.querySelectorAll('.jov5-label')].map(l => l.textContent.trim()), text: p.innerText.replace(/\s+/g, ' ') }; });
      /* was: Approve for Jonas · Refuse… · Open Before you sign in the panel — the panel draws no button; Approve and Decline stand on the row */
      check('5d an approval: no word beside the tabs, no button in the panel; Approve · Decline on its row', !!A1 && !A1.word && A1.go === 0 && A1.approve === 'Approve' && A1.decline === 'Decline', JSON.stringify(A1 && { word: A1.word, go: A1.go, approve: A1.approve, decline: A1.decline }));
      /* was: the rows Why it waits · Asked by · Value — who asks and under which rule is Jambo's sentence; the value a row of what the paper says */
      check('5e who asks, under which rule, and the value', !!A1 && /asks under the rule “Over 10 M”/.test(A1.sub) && A1.rows.some(r => /^Value KES 20,000,000/.test(r)), JSON.stringify(A1 && { sub: A1.sub, rows: A1.rows }));
      /* RETIRED 16 Nov 2026 (#762): 5e's "Since last look · Nothing changed in the wording" row — old look only: the five
         parts say nothing when nothing moved; when something moved it must still be said (5i, kept) */
      check('5f the panel says whom the answer is for', !!A1 && /for Jonas/i.test(A1.text), JSON.stringify(A1 && A1.text.slice(0, 300)));
      /* was: no Negotiation · Workspace doors, the head straight into Why it waits */
      check('5g the Approval\'s panel: no Negotiation · Workspace — the headline goes straight into what the paper says', !!A1 && !A1.text.match(/\bWorkspace\b/) && A1.labels[0] === 'What the paper says', JSON.stringify(A1 && A1.labels));
      await shot('r15-approval-panel-1440x780.png');
    });

    /* ---- 5i PASS 4: "Since last look" when something moved (the stage kept
       only "Nothing changed"): the value changes after the question was put,
       and the panel says so from the question's own stamp ---- */
    await part('5i since last look, moved', async () => {
      await page.evaluate(async () => { const c = getContract('MK-AP1'); if (c._light) await ensureFull(c); c.value = 21000000; persist(c); });
      await page.evaluate(() => setView('approvals'));
      await until(() => document.querySelector('[data-ap-row="MK-AP1"]'), null, 8000);
      if (!(await page.evaluate(() => { const r = document.querySelector('[data-ap-row="MK-AP1"]'); return !!(r && r.classList.contains('is-sel')); }))) await page.click('[data-ap-row="MK-AP1"]');
      /* RE-POINTED 16 Nov 2026 (#762): asked of the five-part panel's words (no .jl-rows in the new look) */
      const S = await until(() => { const p = document.getElementById('ins-panel'); const t = p && p.querySelector('.jov5-title') ? p.innerText.replace(/\s+/g, ' ') : '';
        return /The value changed since it was asked/.test(t) ? 'The value changed since it was asked' : null; }, null, 8000);
      check('5i "Since last look": the value moved after the question was put — said, read from the question\'s own stamp', S === 'The value changed since it was asked', JSON.stringify(S));
    });

    /* ---- 6 People ---- */
    await part('6 People', async () => {
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('[data-dir-row]'), null, 10000);
      const picked = await page.evaluate(() => { const f = [...document.querySelectorAll('[data-dir-row]')].find(x => /Jonas Berg/.test(x.textContent)); if (f) f.click(); return !!f; });
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the person's panel is THE FIVE PARTS (dirnPanelFive):
         the name and role over three numbers (agreements · waiting on them · away), Named on (most recent), Waiting on
         them (each its own door), Reach them (Email them · Show their contracts). Each claim asked of its new place. */
      const P = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !/Jonas Berg/.test(p.textContent) || !p.querySelector('.jov5-title')) return null;
        const groups = {}; p.querySelectorAll('.jov5-sec').forEach(sc => { const l = sc.querySelector('.jov5-label'); if (l) groups[l.textContent.trim()] = [...sc.querySelectorAll('.jov5-row')].map(r => r.innerText.replace(/\s+/g, ' ').trim()); });
        return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', groups, text: p.innerText.replace(/\s+/g, ' '),
          glance: [...p.querySelectorAll('.jov5-glance .jov5-g')].map(g => [...g.children].map(x => x.textContent.trim()).join(' ')),
          show: (() => { const b = p.querySelector('.jov5-row[data-dirn-contracts]'); return b ? !b.disabled : null; })(), mail: !!p.querySelector('[data-dirn-mail]'),
          more: !!p.querySelector('[data-ins-more]') }; });
      check('6a a person: Show their contracts · Email them, no word beside the tabs', picked && !!P && !P.word && P.show === true && P.mail, JSON.stringify(P && { word: P.word, groups: P.groups['Reach them'] }));
      /* was: the rows Email · In HaTi · Streams · Named on · Away — the five parts say the agreements, the waits and the away as three numbers */
      check('6b the numbers: agreements · waiting on them · away', !!P && P.glance.length === 3 && /^\d+ agreements?$/.test(P.glance[0]) && /waiting on them$/.test(P.glance[1]) && /^Away Away until /.test(P.glance[2]), JSON.stringify(P && P.glance));
      check('6c "Waiting on them": his approval with its own door; away until a day, with the stand-in', !!P && (P.groups['Waiting on them'] || []).some(r => /^Helio power purchase Approval/.test(r)) && /Away until \S+ · stand-in: /.test(P.text), P && P.text.slice(0, 400));
      await shot('r19-person-panel-1440x780.png');
      const sg1 = await page.evaluate(() => { const j = dirBook().find(x => /Jonas Berg/.test(x.name || '')); return j ? j.roleOn('MK-SG1').join('+') : null; });
      /* was: "N contracts · N live", the list's "approver" and the asked line — Named on lists the agreements, Waiting on them says what each waits for */
      check('6d Jonas is named on what he approves and signs: Named on, what waits (Approval · Signature), a live Show their contracts, no ⋯',
        !!P && Number((P.glance[0] || '').split(' ')[0]) >= 2 && (P.groups['Named on, most recent'] || []).some(r => /Helio power purchase/.test(r))
        && (P.groups['Waiting on them'] || []).some(r => /Signature$/.test(r)) && /sign/.test(sg1 || '') && P.show === true && !P.more, JSON.stringify(P && { glance: P.glance, groups: P.groups, sg1 }));
    });

    /* ---- 10 PASS 4: the checker's second pass ---- */
    const aiCalls = [];
    page.on('request', r => { if (/\/api\/ai\//.test(r.url())) aiCalls.push(r.url().replace(/^.*\/api/, '/api')); });
    /* RETIRED 16 Nov 2026 (#762): 10a "the whose-move pill right after the party's name" — old look only: the pressed
       round's five parts draw no pill; whose move is the row's Move column and Jambo's sentence (2b) */
    const CARD = (sel) => { const card = document.querySelector(sel.card), rows = [...document.querySelectorAll(sel.rows)].filter(r => r.getClientRects().length);
      /* RE-POINTED 16 Nov 2026 (#762): the page's head is drawn IN the card (.cun-head) — the sheet's head */
      const last = rows[rows.length - 1], foot = document.querySelector(sel.foot), head = (card && card.querySelector('.cun-head')) || document.getElementById('page-head');
      if (!card || !last || !foot) return null;
      const c = card.getBoundingClientRect(), l = last.getBoundingClientRect(), f = foot.getBoundingClientRect();
      const rules = document.querySelector('[data-ap-rules]'), hr = head ? head.getBoundingClientRect() : null;
      /* ONE SHEET (owner, 29 Oct 2026): the list head's sheet and the card meet with no ground between, and the card reaches the foot of Jambo's panel */
      const lh = (card && card.querySelector('.cun-head')) || document.querySelector('[data-lh-seat]'), lr = lh && lh.getBoundingClientRect(), pn = document.getElementById('ins-panel'), pr = pn && pn.getClientRects().length ? pn.getBoundingClientRect() : null;
      return { footUnder: Math.round(f.top - l.bottom), cardEnd: Math.round(c.bottom - f.bottom), ground: Math.round(innerHeight - c.bottom),
        headGround: hr ? Math.round(c.top - hr.bottom) : null, rulesIn: rules && hr ? Math.round(hr.bottom - rules.getBoundingClientRect().bottom) : null,
        sheetGap: lr ? (card.contains(lh) ? 0 : Math.round(c.top - lr.bottom)) : null, panelFoot: pr ? Math.round(pr.bottom - c.bottom) : null }; };
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await part('10b the card ends after its rows ' + w, async () => {
        await page.evaluate(() => openNegotiations({ list: true }));
        await until(() => document.querySelector('.ngn-table tr[data-ngn-row="MK-A2"]'), null, 8000); await page.waitForTimeout(300);
        const N = await page.evaluate(CARD, { card: '#content .ngn-page .apn-card', rows: '.ngn-table tbody tr', foot: '.apn-foot' });
        /* RE-POINTED 29 Oct 2026 (owner: ONE SHEET — the head and the list are one sheet, and the list card
           reaches the foot of Jambo's panel; REVERSES rounds 14–15's "the card ends after its last row") */
        check(`10b Negotiations ${w}×${ht}: one sheet — the card meets the head with no ground, reaches the foot of Jambo's panel, the foot right under the rows inside it`,
          /* RE-POINTED 16 Nov 2026 (#762): Negotiations is drawn as Approvals is (one .apn-card): its foot right under the rows, inside the card */
          !!N && N.sheetGap != null && Math.abs(N.sheetGap) <= 1 && N.panelFoot != null && Math.abs(N.panelFoot) <= 2 && N.footUnder >= 0 && N.footUnder <= 2 && N.cardEnd >= 0, JSON.stringify(N));
        await page.evaluate(() => setView('approvals'));
        await until(() => document.querySelector('[data-ap-row="MK-AP1"]'), null, 8000); await page.waitForTimeout(300);
        /* RE-POINTED 21 Oct 2026 (Part 8): the foot is the list head's own */
        const A = await page.evaluate(CARD, { card: '#content .apn-card', rows: '.apn-table tbody tr', foot: '.apn-card .apn-foot' });
        /* RE-POINTED 29 Oct 2026 (owner: ONE SHEET): no grey ground between the head and the card; the card reaches
           the foot of Jambo's panel; the foot still right under the rows, inside the card */
        check(`10c Approvals ${w}×${ht}: one sheet — head and card meet with no ground, the card reaches the foot of Jambo's panel, the foot right under the rows; Approval rules inside the head`,
          !!A && A.footUnder >= 0 && A.footUnder <= 2 && A.cardEnd >= 0 && A.sheetGap != null && Math.abs(A.sheetGap) <= 1 && A.panelFoot != null && Math.abs(A.panelFoot) <= 2 && A.rulesIn >= 0, JSON.stringify(A)); /* RE-POINTED 16 Nov 2026 (#762): the rules door sits IN the head's own row (.cun-head), so "inside" is >= 0 */
        const C = await page.evaluate(() => [...document.querySelectorAll('.apn-table .apn-name')].filter(e => e.scrollWidth > e.clientWidth + 1 || /…$/.test(e.textContent)).map(e => e.textContent));
        check(`10d Approvals ${w}×${ht}: every party's name reads whole`, !C.length, JSON.stringify(C));
        await shot(`r15-approvals-frame-${w}x${ht}.png`);
      });
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    await part('10e a signature row says how long it has waited', async () => {
      /* RE-POINTED 16 Nov 2026 (#762): a colleague's signature stands under the tab "Waiting on others"; its wait is the .apn-wait cell */
      await page.evaluate(() => { const b = document.querySelector('[data-apn-tab="others"]'); if (b) b.click(); });
      await until(() => document.querySelector('[data-ap-row="MK-SG1"]'), null, 4000);
      const S = await page.evaluate(() => ['MK-SG1'].map(id => { const r = document.querySelector(`[data-ap-row="${id}"]`); return r ? (r.querySelector('td.apn-wait') || { textContent: '' }).textContent.trim() : null; }));
      /* RE-POINTED 28 Oct 2026 (round 10, Approve on the row): the wait is read by its own cell, not its place — the
         row's Approve column can make a ranked column step aside (listCols), moving the place */
      check('10e round 15: "Jonas signs" waits "today" / "N days", never "—" while the trail holds a day', S.every(x => x && x !== '—'), JSON.stringify(S));
    });
    await part('10f an away signer: the rule, the proper step, its door', async () => {
      await page.click('[data-ap-row="MK-SG1"]');
      const R = await until(() => { const sec = document.querySelector('#ins-panel [data-jl-sign-rule]'); return sec ? { t: sec.innerText.replace(/\s+/g, ' ').trim(),
        door: !!sec.querySelector('[data-ins-act="sign"]'), headDoor: !!document.querySelector('#ins-panel .ins-h [data-ins-act="sign"]') } : null; });
      check('10f Jambo says only Jonas signs, a stand-in never does, and the proper step — with Open Before you sign in his sentence',
        !!R && /^If it cannot wait Only Jonas can sign it: a stand-in answers approvals and reviews, never a signature\. If it cannot wait until \S+, name another signer on Before you sign, before anyone has signed\. Open Before you sign$/.test(R.t) && R.door && !R.headDoor, JSON.stringify(R));
      await shot('r15-signature-away-1440x780.png');
    });
    /* RE-POINTED 22 Oct 2026 (the owner's answer to Part 8's question 3: "A —
       Answer beside the list … Jambo's own box beside the list works the same
       way"). 10g pinned the ruling this reverses: a party's name and
       "contracts ending in 90 days" typed in the list panel were handed to
       Home's Board (the reader left Approvals). Now what the Board's own
       reader finds is SAID IN THE PANEL, free, and the reader stays on
       Approvals; a draft from a sentence is still a door (the one form). */
    await part('10g the ask reads the way the Counter\'s does: nothing spent, no cost said', async () => {
      for (const [q, want] of [['Nandi Dairy', 'panel'], ['contracts ending in 90 days', 'panel'], ['draft an NDA with Kabras Sugar', 'form']]) {
        await page.evaluate(() => setView('approvals'));
        await until(() => document.getElementById('jl-q') && document.querySelector('[data-ap-row]'), null, 8000);
        aiCalls.length = 0;
        await page.evaluate(() => { try { jlTalkBack(); } catch (_) {} }); /* RE-POINTED 27 Oct 2026: Overview's free readers */
        /* RE-PINNED 28 Oct 2026 ("Door above the box"): the free readers, asked as a chip asks */
        await page.fill('#jl-q', q); await H.chipEnter(page, '#jl-q');
        const G = await until(([w, said]) => {
          if (w === 'form') return state.view === 'dashboard' && document.querySelector('#na-q, .na-one, #dr-say') ? { face: hbFace(), form: true } : null;
          if (state.view !== 'approvals') return null;
          const f = document.querySelector('#ins-panel #jl-feed'); if (!f) return null;
          const T = [...f.querySelectorAll('.jb-turn')], wd = e => e.textContent.replace(/\s+/g, ' ').trim();
          let i = -1; T.forEach((e, k) => { if (wd(e) === said) i = k; });
          const a = i >= 0 ? T[i + 1] : null;
          /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said — the answer turn is waited for, and says no cost */
          return a && !/\bcalls?\b|\bfree\b|costs? nothing/i.test(wd(a)) ? { view: state.view, answer: wd(a).slice(0, 120), box: document.getElementById('jl-q').value } : null; }, [want, q], 10000);
        await page.waitForTimeout(400);
        check(`10g "${q}" in the list panel: ${want === 'form' ? 'the one form opens (a door)' : 'answered IN the panel, the reader stays on Approvals'}, nothing spent, no cost said`,
          !!G && !aiCalls.length && (want === 'form' || G.box === ''), JSON.stringify({ G, aiCalls }));
      }
      /* the draft form is a page over Home: put it away so the next parts can press */
      await page.evaluate(() => { try { if (typeof closeModal === 'function') closeModal(); } catch (_) {} });
      await page.keyboard.press('Escape').catch(() => {});
      await until(() => !document.querySelector('#modal-root > *') ? true : null, null, 4000);
    });
    await part('10h Our paper: the bar\'s Jambo door opens Jambo', async () => {
      await page.evaluate(() => setView('templates'));
      await until(() => state.view === 'templates' ? true : null);
      await page.waitForTimeout(400);
      /* RE-POINTED AGAIN 21 Oct 2026 (owner picked "The old chat window": "when i type in it, it
         just jumps to the jambo in the side panel"): the ✦ opens the floating chat window beside
         the page's own panel, and what is typed there is answered IN the window — never handed to
         the panel beside the book */
      await page.click('#cmd-ai');
      const O = await until(() => { const p = document.getElementById('ai-panel'); const f = document.activeElement && document.activeElement.id;
        return p.classList.contains('open') ? { floating: p.classList.contains('floating'), aside: p.classList.contains('ai-stepaside'), focus: f, bar: !!document.getElementById('jb-bar') } : null; }, null, 6000);
      check('10h the bar\'s door opens the floating chat window, the cursor in its box', !!O && O.floating && !O.aside && !O.bar && O.focus === 'ai-input', JSON.stringify(O));
      if (O && O.floating) {
        await page.type('#ai-input', 'which of these are waiting on me', { delay: 4 }); await page.keyboard.press('Enter');
        const A = await until(() => { const w = document.getElementById('ai-feed'); const f = document.getElementById('jl-feed');
          return w && /waiting on me/.test(w.textContent) ? { list: !!(f && /waiting on me/.test(f.textContent)), open: document.getElementById('ai-panel').classList.contains('open') } : null; }, null, 6000);
        check('10h and its words are answered in the window, not in the panel beside the book', !!A && A.open && !A.list, JSON.stringify(A));
      }
      await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });
    });
    await part('10i the person panel as drawn', async () => {
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('[data-dir-row]'), null, 10000);
      /* RE-POINTED 19 Oct 2026 (round 19's People scene, lane A2's check #1):
         "N contracts · K live" is OUR side's Named on (Jonas, drawn "1 contract ·
         1 live"); someone on their side reads "N contracts" alone, with what they
         do under it (Henrik). The seed's one person named on one contract is on
         their side, so both shapes are asked: ours with the fewest contracts, in
         its own number (the singular is pinned in f809 (7)), and theirs whole */
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Named on is the five parts' first number,
         "N agreement(s)", on either side (dirnPanelFive). RETIRED half: "· K live" — old look only (the five parts say
         what waits on them as their own number instead) */
      const named = async key => { await page.evaluate(k => dirSelect(k), key);
        return until(k => { const p = document.getElementById('ins-panel'); if (!p || !p.querySelector('.jov5-title')) return null;
          const g = p.querySelector('.jov5-glance .jov5-g'); return g ? [...g.children].map(x => x.textContent.trim()).join(' ') : null; }, key); };
      const pick = await page.evaluate(() => { const B = dirBook();
        const o = B.filter(x => x.side === 'ours' && x.contracts && x.contracts.length).sort((a, b) => a.contracts.length - b.contracts.length)[0];
        const t = B.find(x => x.side === 'theirs' && x.contracts && x.contracts.length === 1);
        return { ours: o ? { key: o.key, n: o.contracts.length } : null, theirs: t ? t.key : null }; });
      const NO = pick.ours ? await named(pick.ours.key) : null;
      const want = pick.ours ? new RegExp('^' + pick.ours.n + (pick.ours.n === 1 ? ' agreement' : ' agreements') + '$') : null;
      check('10i our side\'s Named on says its number: "N agreements"', !!want && want.test(NO || ''), JSON.stringify({ pick, NO }));
      const NT = pick.theirs ? await named(pick.theirs) : null;
      check('10i2 their side\'s Named on says the number: "1 agreement"', /^1 agreement$/.test(NT || ''), JSON.stringify({ pick, NT }));
      /* RETIRED 16 Nov 2026 (#762): 10j "Waiting on Jonas rows without dots, one line each; Named on in a bordered card" —
         old look only: the five parts draw their own rows (a mark per row, no card round Named on); their tidiness is the tidy sweep's */
    });

    /* ---- 9 Parties: a row of what waits on you reads whole (pass 3) ---- */
    for (const [w, ht] of SCREENS) {
      await part('9 Parties ' + w, async () => {
        await page.setViewportSize({ width: w, height: ht });
        await page.evaluate(() => setView('customers'));
        await until(() => document.querySelector('[data-cu-cust]'), null, 10000);
        /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the party's panel is THE FIVE PARTS (Agreements ·
           the party's own facts · More · Jambo); it draws no "waits on you" list (RETIRED half, old look only: the short
           door word with its landing on the hover). Kept: every row of the panel reads whole, at three screens, nothing sideways */
        const found = await page.evaluate(async () => {
          for (const r of [...document.querySelectorAll('[data-cu-cust]')]){ if (!r.classList.contains('is-sel')) r.click(); await new Promise(z => setTimeout(z, 250));
            if (document.querySelector('#ins-panel .jov5-group .jov5-row')) return r.getAttribute('data-cu-cust'); }
          return null; });
        const R = found ? await page.evaluate(() => { const p = document.getElementById('ins-panel');
          const cut = el => !!el && el.scrollWidth > el.clientWidth + 1;
          const rows = [...p.querySelectorAll('.jov5-group .jov5-row')].filter(r => r.getClientRects().length).map(li => { const b = li.querySelector('.jov5-rt > b'), v = li.querySelector('.jov5-v');
            return { t: b ? b.textContent.trim().slice(0, 60) : '', cut: cut(b) || cut(v) || cut(li) }; });
          return { rows, side: document.documentElement.scrollWidth <= innerWidth + 1 }; }) : null;
        check(`9 Parties ${w}×${ht}: the party's panel reads whole — every row uncut, nothing sideways`,
          !!R && R.rows.length && R.rows.every(r => !r.cut) && R.side, JSON.stringify(R));
        await shot(`r19-party-panel-${w}x${ht}.png`);
      });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ---- 8 the three screens, on each list ---- */
    const FIT = () => { const p = document.getElementById('ins-panel'), q = document.getElementById('jl-q');
      const pr = p ? p.getBoundingClientRect() : null, qr = q ? q.getBoundingClientRect() : null;
      const list = document.querySelector('.ngn-table, .ap-table, .dir-wall, .dir-faces, [data-dir-row]');
      const lr = list ? (list.closest('table') || list.parentElement || list).getBoundingClientRect() : null;
      return { panel: !!pr && pr.left >= 0 && pr.right <= innerWidth + 1 && pr.top >= 0 && pr.bottom <= innerHeight + 1,
        box: !!qr && qr.bottom <= innerHeight && qr.top >= 0, beside: !!lr && !!pr && lr.right <= pr.left + 1,
        side: document.documentElement.scrollWidth <= innerWidth + 1 }; };
    const pages = [
      ['r14-negotiations', async () => { await page.evaluate(() => openNegotiations({ list: true })); await ngnChoose('MK-A2'); await until(() => /Nandi|Raw Milk/.test((document.getElementById('ins-panel') || {}).textContent || '')); }],
      /* RE-POINTED 16 Nov 2026 (#762): MK-AP1 stands under the tab Mine ([data-apn-tab="mine"]) */
      ['r15-approvals', async () => { await page.evaluate(() => { setView('approvals'); const b = document.querySelector('[data-apn-tab="mine"]'); if (b && !b.classList.contains('is-on')) b.click(); }); await until(() => document.querySelector('[data-ap-row="MK-AP1"]'), null, 8000);
        await page.click('[data-ap-row="MK-AP1"]'); await until(() => /Helio/.test((document.getElementById('ins-panel') || {}).textContent || '')); }],
      ['r19-person', async () => { await page.evaluate(() => setView('directory')); await until(() => document.querySelector('[data-dir-row]'), null, 8000);
        await page.evaluate(() => { const f = [...document.querySelectorAll('[data-dir-row]')].find(x => /Jonas Berg/.test(x.textContent)); if (f) f.click(); });
        await until(() => /Jonas Berg/.test((document.getElementById('ins-panel') || {}).textContent || '')); }],
    ];
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      for (const [name, go] of pages) {
        await part('8 the three screens', async () => {
          await go(); await page.waitForTimeout(350);
          const R = await page.evaluate(FIT);
          check(`8 ${name} ${w}×${ht}: the panel inside the window, the list beside it, the box in view, nothing sideways`, R.panel && R.box && R.beside && R.side, JSON.stringify(R));
          await shot(`${name}-${w}x${ht}.png`);
        });
      }
    }

    /* ---- 7 no hint line under every other Jambo box ----
       RE-POINTED 20 Oct 2026 (the owner picked "Chambers", which draws no hint
       line under any Jambo box: jamboHintHtml, igHintKeys and .jb-hint are
       gone). Each stage now asserts the line is ABSENT — none on the whole
       page — and that the box itself still stands in view. */
    const HINTS = '.jb-hint, .jb-keys, .jb-kbd, .ai-hint, #ai-hint';
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await part('7a Home', async () => {
        await page.evaluate(() => { if (typeof regOpenContract === 'function') regOpenContract('MK-A2'); });
        const HH = await until(sel => { const c = typeof pdContract === 'function' && pdContract(), e = document.querySelector('#ig-dock .jb-card');
          return c && c.id === 'MK-A2' && e && e.getClientRects().length ? { hints: document.querySelectorAll(sel).length, inView: e.getBoundingClientRect().bottom <= innerHeight } : null; }, HINTS, 10000);
        check(`7a Home ${w}×${ht}: no hint line under Jambo's box while a paper is up, the box in view`, !!HH && HH.hints === 0 && HH.inView, JSON.stringify(HH));
        await shot(`hint-home-${w}x${ht}.png`);
      });
      await part('7b Settings', async () => {
        await page.evaluate(() => setView('team'));
        /* the page re-measures its side once its entrance has settled (stSideFit): wait for that, bounded */
        /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings' Jambo is the page's panel (#ins-panel), its box #jl-q */
        await until(() => { const sd = document.getElementById('ins-panel'); return sd && document.querySelector('#ins-panel #jl-q') && sd.getBoundingClientRect().bottom <= innerHeight + 1; }, null, 4000);
        const HS = await until(sel => { const q = document.querySelector('#ins-panel #jl-q'), e = q && (q.closest('.jb-card') || q); if (!e || !e.getClientRects().length) return null;
          const r = e.getBoundingClientRect(), side = e.closest('#ins-panel'), sr = side ? side.getBoundingClientRect() : null;
          return { hints: document.querySelectorAll(sel).length, inView: r.bottom <= innerHeight && (!sr || r.bottom <= sr.bottom + 1), at: [Math.round(r.top), Math.round(r.bottom)], side: sr && [Math.round(sr.top), Math.round(sr.bottom)], ih: innerHeight }; }, HINTS, 10000);
        check(`7b Settings ${w}×${ht}: no hint line under its Jambo box, the box in view`, !!HS && HS.hints === 0 && HS.inView, JSON.stringify(HS));
        await shot(`hint-settings-${w}x${ht}.png`);
      });
      await part('7c Import', async () => {
        await page.evaluate(() => setView('migration'));
        const HI = await until(sel => { const q = document.querySelector('#mig-side #jl-q'), e = q && (q.closest('.jb-card') || q);
          return e && e.getClientRects().length ? { hints: document.querySelectorAll(sel).length, inView: e.getBoundingClientRect().bottom <= innerHeight, ph: q.getAttribute('placeholder') } : null; }, HINTS, 10000);
        check(`7c Import ${w}×${ht}: the shared box in its panel, no hint line under it, in view`, !!HI && HI.hints === 0 && HI.ph === 'Ask Jambo, or type / for a place' && HI.inView, JSON.stringify(HI));
        await shot(`hint-import-${w}x${ht}.png`);
      });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
