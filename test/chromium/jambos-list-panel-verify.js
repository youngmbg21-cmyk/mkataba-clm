/* JAMBO'S PANEL BESIDE THE LISTS (the owner's "build all the gaps", 18 Oct
   2026: rounds 14, 15 and 19 of the redesign as drawn, and the hint line under
   every Jambo ask box; js/views/inspector.js jlFrame/jlAsk, the pages'
   regInsPaint · apInsPaint · dirPaintPanel)

   WHAT THIS PINS, driven in a real browser as an admin who stands in for an
   away colleague (Jonas):
     1 NEGOTIATIONS, nothing chosen: the panel at the right edge, Jambo's tab,
       the page in his words from the page's own counts, its doors as chips,
       the ask box with its words and the hint line under it
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
     7 THE HINT LINE under Home's box (with "/ places · Esc closes" while a
       paper is up), Settings' and Import's
     8 the owner's three screens: the panel inside the window, the list beside
       it (never under it), the box in view, nothing sideways
   PASS 3 (18 Oct 2026, the checker against the picked drawings):
     2f "What is open" says "2 redlines to answer"; Needs you names "Clause N
        Name · clause N Name"; only the doors — no ⋯, no icon on a door
     5g the Approval's panel draws no doors; 5h a colleague's approval says
        "Sara approves", Whose turn "Sara"
     6d Jonas is "Named on" the contracts he approves and signs: the row, the
        list ("approver", "signer") and a live Show their contracts; no ⋯
     9  PARTIES: a row of what waits on you reads whole in the 380px panel —
        its title, its short door, the Waiting on you fact — at three screens
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/jambos-list-panel-verify.js
   Photographs: HATI_SHOT_DIR=<dir> node test/chromium/jambos-list-panel-verify.js */
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
    page.on('pageerror', e => errors.push(e.message));
    /* a part whose control is missing reports and the next part runs — never a 30s wait */
    page.setDefaultTimeout(6000);
    const part = async (name, fn) => { try { await fn(); } catch (e) { check(name + ': the part ran', false, String((e && e.message) || e).split('\n')[0]); } };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const shot = async name => { if (OUT) await page.screenshot({ path: path.join(OUT, name) }); };
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
    await until(() => document.querySelectorAll('#reg-tbody tr[data-row]').length >= 2 && document.querySelector('#ins-panel.is-jambo .jl-body'), null, 10000);
    await page.waitForTimeout(300);
    const PANEL = () => { const p = document.getElementById('ins-panel'); if (!p) return null; const r = p.getBoundingClientRect();
      const q = document.getElementById('jl-q'), hint = p.querySelector('.jl-foot .jb-hint');
      return { jambo: p.classList.contains('is-jambo'), folded: p.classList.contains('is-folded'), w: Math.round(r.width), right: Math.round(r.right), left: Math.round(r.left),
        tab: !!p.querySelector('[data-jl-home] .pd-tab-g'), word: (p.querySelector('[data-jl-word]') || {}).textContent || '',
        back: !!(p.querySelector('[data-jl-back]') && !p.querySelector('[data-jl-back]').hidden),
        words: [...p.querySelectorAll('[data-jl-words] .jl-bub')].map(b => b.textContent.trim()),
        chips: [...p.querySelectorAll('[data-jl-chip]')].map(b => b.textContent.trim()),
        ph: q ? q.getAttribute('placeholder') : null, hint: hint ? hint.textContent.replace(/\s+/g, ' ').trim() : null,
        text: p.innerText.replace(/\s+/g, ' ') }; };
    const N0 = await page.evaluate(PANEL);
    check('1a the panel is Jambo\'s, at the right edge, Home\'s panel\'s width, with his tab', !!N0 && N0.jambo && N0.tab && N0.w === 380 && Math.abs(N0.right - 1440) <= 1, JSON.stringify(N0 && { w: N0.w, right: N0.right, tab: N0.tab }));
    check('1c the box asks in its words, the hint line under it', !!N0 && N0.ph === 'Ask for a contract, a number or a list…' && N0.hint === 'Typing never signs, sends or files — a press does.', JSON.stringify(N0 && { ph: N0.ph, hint: N0.hint }));

    /* ---- 2 a row pressed ---- */
    await page.click('#reg-tbody tr[data-row="MK-A2"]');
    const N1 = await until(() => { const p = document.getElementById('ins-panel'); return p && /Nandi|Raw Milk/.test(p.textContent) && p.querySelector('.jl-needs') ? true : null; });
    const N1p = await page.evaluate(PANEL);
    const N1r = await page.evaluate(() => { const p = document.getElementById('ins-panel');
      return { rows: [...p.querySelectorAll('[data-ins-fact] dt')].map(x => x.textContent.trim()),
        pill: (p.querySelector('.ins-h .reg-stg') || {}).textContent || '',
        need: (p.querySelector('.jl-needs .jl-need-t') || {}).textContent || '',
        reads: [...p.querySelectorAll('[data-jl-read]')].map(x => x.getAttribute('data-jl-read')) }; });
    check('2a "Negotiation" beside his tab, ‹ Jambo to go back', !!N1 && N1p.word === 'Negotiation' && N1p.back, JSON.stringify({ word: N1p.word, back: N1p.back }));
    check('2b the pill carries the wait: "Our move · …"', /^Our move · /.test(N1r.pill.trim()), JSON.stringify(N1r.pill));
    check('2c the facts as rows: Value · Lead · Their changes · Last sent', ['Value', 'Lead', 'Their changes', 'Last sent'].every(k => N1r.rows.includes(k)), JSON.stringify(N1r.rows));
    check('2d Needs you leads with "Answer 2 redlines"; What Jambo read in the drawing\'s order', N1r.need === 'Answer 2 redlines'
      && JSON.stringify(N1r.reads) === JSON.stringify(['brief', 'playbook', 'scan', 'oblig']), JSON.stringify({ need: N1r.need, reads: N1r.reads }));
    await shot('r14-negotiation-panel-1440x780.png');
    await part('2f pass 3', async () => {
      const N4 = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        const row = document.querySelector('#reg-tbody tr[data-row="MK-A2"]');
        return { open: row ? ((row.querySelector('.reg-ch') || {}).textContent || '').trim() : null,
          sub: ((p.querySelector('.jl-needs .jl-need-s') || {}).textContent || '').trim(),
          more: !!p.querySelector('[data-ins-more]'),
          doors: [...p.querySelectorAll('.ins-doors [data-ins-act]')].map(b => ({ k: b.getAttribute('data-ins-act'), t: b.textContent.trim(), svg: !!b.querySelector('svg') })) }; });
      check('2f "What is open": "2 redlines to answer"', N4.open === '2 redlines to answer', JSON.stringify(N4.open));
      check('2g Needs you names the clauses as drawn: "Clause N Name · clause N Name"', /^Clause [\dIVXLC.]+ \S.* · clause [\dIVXLC.]+ \S/.test(N4.sub), JSON.stringify(N4.sub));
      check('2h only the doors: Negotiation · Workspace, no ⋯, no icon on a door', !N4.more && N4.doors.map(d => d.t).join('|') === 'Negotiation|Workspace' && N4.doors.every(d => !d.svg), JSON.stringify(N4));
    });
    await part('2e ‹ Jambo', async () => {
      await page.click('#ins-panel [data-jl-back]');
      const N2 = await until(() => { const p = document.getElementById('ins-panel'); return p && p.querySelector('[data-jl-words]') && !document.querySelector('#reg-tbody tr.is-sel') ? true : null; });
      check('2e ‹ Jambo lets the row go: his words back, no row lit', !!N2);
      const N3 = await page.evaluate(PANEL);
      check('1b nothing chosen: the page in his words from its own counts, its doors as chips, no ‹ Jambo',
        !!N3 && /^\d+ live negotiations?: /.test(N3.words[0] || '') && /wait on our side|waits on our side/.test(N3.words[0] || '') && N3.chips.includes('our move') && N3.chips.includes('start a negotiation') && !N3.back,
        JSON.stringify(N3 && { words: N3.words, chips: N3.chips, back: N3.back }));
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
        return f && f.querySelectorAll('.ai-msg').length >= 2 && !f.querySelector('.typing') && /\S/.test((f.querySelector('.ai-msg:last-child') || {}).textContent || '') ? { n: f.querySelectorAll('.ai-msg').length, open: !!(window.ai && ai.open), win: (document.getElementById('ai-feed') || {}).innerHTML === '' } : null; }, null, 15000);
      check('3b a question is said in the panel; the window stays shut and holds no second copy', !!ANS && !ANS.open && ANS.win, JSON.stringify(ANS));
      await shot('r14-negotiations-ask-1440x780.png');
    });
    /* ---- 4 the fold ---- */
    await part('4 the fold', async () => {
      await page.click('#ins-panel [data-jl-fold]');
      const F = await until(() => { const p = document.getElementById('ins-panel'); const cs = document.getElementById('content-scroll');
        return p && p.classList.contains('is-folded') ? { w: Math.round(p.getBoundingClientRect().width), door: !!p.querySelector('[data-jl-door] .igd-door-face, [data-jl-door] img'),
          page: cs ? Math.round(cs.getBoundingClientRect().right) : 0 } : null; });
      check('4a folded: a strip with his face, the page takes the room', !!F && F.w === 46 && F.door && F.page >= 1440 - 46 - 2, JSON.stringify(F));
      await page.click('#ins-panel [data-jl-door]');
      const F2 = await until(() => { const p = document.getElementById('ins-panel'); return p && !p.classList.contains('is-folded') ? Math.round(p.getBoundingClientRect().width) : null; });
      check('4b the strip opens it again', F2 === 380, String(F2));
    });
    await part('3c a place word', async () => {
      await page.fill('#jl-q', 'approvals'); await page.press('#jl-q', 'Enter');
      const V = await until(() => state.view === 'approvals' ? state.view : null);
      check('3c a place word opens its page, costing nothing', V === 'approvals', String(V));
    });
    if (await page.evaluate(() => state.view !== 'approvals')) await page.evaluate(() => setView('approvals'));

    /* ---- 5 Approvals ---- */
    await part('5 Approvals', async () => {
      await until(() => document.querySelector('[data-ap-row="MK-AP1"]') && document.querySelector('#ins-panel.is-jambo'), null, 10000);
      const A0 = await page.evaluate(() => { const row = id => document.querySelector(`[data-ap-row="${id}"]`);
        const t = id => { const r = row(id); return r ? ((r.querySelector('.ap-turn') || {}).textContent || '').replace(/\s+/g, ' ').trim() : null; };
        return { pill: (document.querySelector('.ap-card-n.is-pill') || {}).textContent || '', late: (document.querySelector('.ap-card-m') || {}).textContent || '',
          foot: (document.querySelector('[data-ap-foot]') || {}).textContent || '', ap1: t('MK-AP1'), sg1: t('MK-SG1'), band: !!document.querySelector('.ap-band'),
          rows: document.querySelectorAll('[data-ap-row]').length,
          words: [...document.querySelectorAll('#ins-panel [data-jl-words] .jl-bub')].map(b => b.textContent.trim()) }; });
      check('5a the list head: the count in a pill, "late after 7 days"; the foot "Showing N of N"; no band',
        /^\d+$/.test(A0.pill.trim()) && /late after 7 days/.test(A0.late) && A0.foot.trim() === `Showing ${A0.rows} of ${A0.rows}` && !A0.band, JSON.stringify(A0));
      check('5b Whose turn: "You for Jonas"; a colleague\'s signature "Jonas signs · back …"', A0.ap1 === 'You for Jonas' && /^Jonas signs · back /.test(A0.sg1 || ''), JSON.stringify({ ap1: A0.ap1, sg1: A0.sg1 }));
      if (await page.evaluate(() => { const b = document.querySelector('#ins-panel [data-jl-back]'); return !!(b && !b.hidden); })) await page.click('#ins-panel [data-jl-back]');
      const A0w = await until(() => { const w = [...document.querySelectorAll('#ins-panel [data-jl-words] .jl-bub')].map(b => b.textContent.trim()); return w.length ? w : null; });
      check('5c nothing chosen: the page in his words, whom the reader stands in for', !!A0w && A0w.some(w => /wait for a yes or a signature/.test(w)) && A0w.some(w => /You answer Jonas’s approvals and reviews until/.test(w)), JSON.stringify(A0w));
      await shot('r15-approvals-words-1440x780.png');
      await page.click('[data-ap-row="MK-AP1"]');
      const A1 = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !/Helio/.test(p.textContent) || !p.querySelector('[data-ins-act="approve"]')) return null;
        const btn = k => ((p.querySelector(`[data-ins-act="${k}"]`) || {}).textContent || '').replace(/\s+/g, ' ').trim();
        const rows = {}; p.querySelectorAll('.jl-rows > div').forEach(r => { const l = r.querySelector('dt'), v = r.querySelector('dd'); if (l && v) rows[l.textContent.trim()] = v.textContent.replace(/\s+/g, ' ').trim(); });
        return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', approve: btn('approve'), refuse: btn('refuse'), gate: btn('gate'),
          rows, rec: ((p.querySelector('.jl-rec') || {}).textContent || '').replace(/\s+/g, ' ').trim(), forPill: !!p.querySelector('.ap-for-pill, .ap-for') }; });
      check('5d "Approval": Approve for Jonas · Refuse… · Open Before you sign', !!A1 && A1.word === 'Approval' && A1.approve === 'Approve for Jonas' && /^Refuse/.test(A1.refuse) && A1.gate === 'Open Before you sign', JSON.stringify(A1 && { word: A1.word, approve: A1.approve, refuse: A1.refuse, gate: A1.gate }));
      check('5e the rows: Why it waits · Asked by · Value · Since last look "Nothing changed in the wording"',
        !!A1 && ['Why it waits', 'Asked by', 'Value'].every(k => A1.rows[k]) && A1.rows['Since last look'] === 'Nothing changed in the wording', JSON.stringify(A1 && A1.rows));
      check('5f the recorded-as sentence says whom the answer is for', !!A1 && /for Jonas/i.test(A1.rec), JSON.stringify(A1 && A1.rec));
      const A2 = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        const head = p.querySelector('.ins-h'), first = p.querySelector('.jl-rows');
        return { doors: p.querySelectorAll('[data-ins-act^="door-"]').length, doorsRow: !!p.querySelector('.ins-doors'),
          order: head && first ? !!(head.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING) : null }; });
      check('5g the Approval\'s panel: no Negotiation · Workspace — the head goes straight into Why it waits', A2.doors === 0 && !A2.doorsRow && A2.order === true, JSON.stringify(A2));
      await shot('r15-approval-panel-1440x780.png');
      const A3 = await page.evaluate(() => { const r = document.querySelector('[data-ap-row="MK-AP2"]'); if (!r) return null;
        const cell = r.querySelector('td.ap-turn') && r.querySelector('td.ap-turn').previousElementSibling;
        return { why: cell ? ((cell.querySelector('.ap-sub') || {}).textContent || '').trim() : null, turn: ((r.querySelector('.ap-turn') || {}).textContent || '').replace(/\s+/g, ' ').trim() }; });
      check('5h a colleague\'s approval: "Sara approves", Whose turn "Sara"', !!A3 && A3.why === 'Sara approves' && A3.turn === 'Sara', JSON.stringify(A3));
    });

    /* ---- 6 People ---- */
    await part('6 People', async () => {
      await page.evaluate(() => setView('directory'));
      await until(() => document.querySelector('[data-dir-row]'), null, 10000);
      const picked = await page.evaluate(() => { const f = [...document.querySelectorAll('[data-dir-row]')].find(x => /Jonas Berg/.test(x.textContent)); if (f) f.click(); return !!f; });
      const P = await until(() => { const p = document.getElementById('ins-panel'); if (!p || !/Jonas Berg/.test(p.textContent) || !p.querySelector('.jl-av')) return null;
        const rows = [...p.querySelectorAll('.jl-rows dt')].map(x => x.textContent.trim());
        const acts = [...p.querySelectorAll('.ins-acts [data-ins-act], .ins-h [data-ins-act]')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
        return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', rows, acts, text: p.innerText.replace(/\s+/g, ' '),
          wait: !!p.querySelector('[data-dir-wait="approval"][data-dir-wait-id="MK-AP1"]') }; });
      check('6a "Person": Show their contracts · Email', picked && !!P && P.word === 'Person' && P.acts.includes('Show their contracts') && P.acts.includes('Email'), JSON.stringify(P && { word: P.word, acts: P.acts }));
      check('6b the rows: Email · In HaTi · Streams · Named on · Away', !!P && ['Email', 'In HaTi', 'Streams', 'Named on', 'Away'].every(k => P.rows.includes(k)), JSON.stringify(P && P.rows));
      check('6c "Waiting on Jonas": his approval with its own door, "you may answer for them"; away until a day', !!P && P.wait && /Waiting on Jonas/.test(P.text) && /you may answer for them/.test(P.text) && /Away until /.test(P.text), P && P.text.slice(0, 400));
      await shot('r19-person-panel-1440x780.png');
      const P2 = await page.evaluate(() => { const p = document.getElementById('ins-panel');
        const named = [...p.querySelectorAll('.jl-rows > div')].find(r => /Named on/.test((r.querySelector('dt') || {}).textContent || ''));
        const show = p.querySelector('[data-ins-act="contracts"]');
        return { named: named ? ((named.querySelector('dd') || {}).textContent || '').trim() : null,
          list: [...p.querySelectorAll('.jl-ct .dir-ct-sub')].map(x => x.textContent.trim()),
          show: show ? !show.disabled : null, more: !!p.querySelector('[data-ins-more]') }; });
      check('6d Jonas is named on what he approves and signs: the row, the list, a live Show their contracts, no ⋯',
        !!P2 && /^\d+ contracts · \d+ live$/.test(P2.named || '') && Number((P2.named || '').split(' ')[0]) >= 2
        && P2.list.some(x => /MK-AP1 · .* · approver/.test(x)) && P2.list.some(x => /MK-SG1 · .* · signer/.test(x)) && P2.show === true && !P2.more, JSON.stringify(P2));
    });

    /* ---- 9 Parties: a row of what waits on you reads whole (pass 3) ---- */
    for (const [w, ht] of SCREENS) {
      await part('9 Parties ' + w, async () => {
        await page.setViewportSize({ width: w, height: ht });
        await page.evaluate(() => setView('customers'));
        await until(() => document.querySelector('[data-cu-cust]'), null, 10000);
        const found = await page.evaluate(async () => {
          for (const r of [...document.querySelectorAll('[data-cu-cust]')]){ r.click(); await new Promise(z => setTimeout(z, 250));
            if (document.querySelector('#ins-panel .cu-needs .cu-li')) return r.getAttribute('data-cu-cust'); }
          return null; });
        const R = found ? await page.evaluate(() => { const p = document.getElementById('ins-panel');
          const cut = el => !!el && el.scrollWidth > el.clientWidth + 1;
          const rows = [...p.querySelectorAll('.cu-needs .cu-li')].map(li => { const b = li.querySelector('.cu-li-b b'), btn = li.querySelector('button');
            return { t: b ? b.textContent.trim() : '', cut: cut(b), btn: btn ? btn.textContent.trim() : '', hover: btn ? btn.getAttribute('title') : '' }; });
          const fact = p.querySelector('[data-ins-fact="waiting"] dd');
          return { rows, factCut: cut(fact), fact: fact ? fact.textContent.trim() : null, side: document.documentElement.scrollWidth <= innerWidth + 1 }; }) : null;
        check(`9 Parties ${w}×${ht}: what waits on you reads whole — titles uncut, a short door word (its landing on the hover), the fact uncut`,
          !!R && R.rows.length && R.rows.every(r => !r.cut && r.btn.length <= 16 && r.hover) && !R.factCut && R.side, JSON.stringify(R));
        await shot(`r19-party-panel-${w}x${ht}.png`);
      });
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* ---- 8 the three screens, on each list ---- */
    const FIT = () => { const p = document.getElementById('ins-panel'), q = document.getElementById('jl-q');
      const pr = p ? p.getBoundingClientRect() : null, qr = q ? q.getBoundingClientRect() : null;
      const list = document.querySelector('#reg-tbody, .ap-table, .dir-wall, .dir-faces, [data-dir-row]');
      const lr = list ? (list.closest('table') || list.parentElement || list).getBoundingClientRect() : null;
      return { panel: !!pr && pr.left >= 0 && pr.right <= innerWidth + 1 && pr.top >= 0 && pr.bottom <= innerHeight + 1,
        box: !!qr && qr.bottom <= innerHeight && qr.top >= 0, beside: !!lr && !!pr && lr.right <= pr.left + 1,
        side: document.documentElement.scrollWidth <= innerWidth + 1 }; };
    const pages = [
      ['r14-negotiations', async () => { await page.evaluate(() => openNegotiations({ list: true })); await until(() => document.querySelector('#reg-tbody tr[data-row="MK-A2"]'), null, 8000);
        await page.click('#reg-tbody tr[data-row="MK-A2"]'); await until(() => /Nandi|Raw Milk/.test((document.getElementById('ins-panel') || {}).textContent || '')); }],
      ['r15-approvals', async () => { await page.evaluate(() => setView('approvals')); await until(() => document.querySelector('[data-ap-row="MK-AP1"]'), null, 8000);
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

    /* ---- 7 the hint line under every other Jambo box ---- */
    for (const [w, ht] of SCREENS) {
      await page.setViewportSize({ width: w, height: ht });
      await part('7a Home', async () => {
        await page.evaluate(() => { if (typeof regOpenContract === 'function') regOpenContract('MK-A2'); });
        const HH = await until(() => { const e = document.querySelector('#ig-dock .jb-hint'); return e && e.getClientRects().length && /\//.test(e.textContent) ? { t: e.textContent.replace(/\s+/g, ' ').trim(), kbd: e.querySelectorAll('kbd').length, needs: !!document.getElementById('pd-needs'),
          inView: e.getBoundingClientRect().bottom <= innerHeight, keysOne: (() => { const k = e.querySelector('.jb-keys'); return !!k && k.getClientRects().length === 1; })() } : null; }, null, 10000);
        /* RE-POINTED 18 Oct 2026 (pass 3, round 3 as drawn): beside a paper whose Needs you here has rows, "/ lists the places." */
        check(`7a Home ${w}×${ht}: the hint under Jambo's box, with the keys while a paper is up, in view, the keys on one line`, !!HH && (HH.needs
          ? HH.t === 'Typing never signs, sends or files — a press does. / lists the places.' && HH.kbd === 1
          : HH.t === 'Typing never signs, sends or files — a press does. / places · Esc closes' && HH.kbd === 2) && HH.inView && HH.keysOne, JSON.stringify(HH));
        await shot(`hint-home-${w}x${ht}.png`);
      });
      await part('7b Settings', async () => {
        await page.evaluate(() => setView('team'));
        /* the page re-measures its side once its entrance has settled (stSideFit): wait for that, bounded */
        await until(() => { const sd = document.getElementById('st-side'); return sd && document.querySelector('#st-side .jb-hint') && sd.getBoundingClientRect().bottom <= innerHeight + 1; }, null, 4000);
        const HS = await until(() => { const e = document.querySelector('#st-side .jb-hint, .st-side .jb-hint'); if (!e || !e.getClientRects().length) return null;
          const r = e.getBoundingClientRect(), side = e.closest('.st-side, #st-side'), sr = side ? side.getBoundingClientRect() : null;
          return { t: e.textContent.replace(/\s+/g, ' ').trim(), inView: r.bottom <= innerHeight && (!sr || r.bottom <= sr.bottom + 1), at: [Math.round(r.top), Math.round(r.bottom)], side: sr && [Math.round(sr.top), Math.round(sr.bottom)], ih: innerHeight }; }, null, 10000);
        check(`7b Settings ${w}×${ht}: under its Jambo box`, !!HS && HS.t === 'Typing never signs, sends or files — a press does.' && HS.inView, JSON.stringify(HS));
        await shot(`hint-settings-${w}x${ht}.png`);
      });
      await part('7c Import', async () => {
        await page.evaluate(() => setView('migration'));
        const HI = await until(() => { const e = document.querySelector('#mig-side .jb-hint'); const q = document.querySelector('#mig-side #jl-q');
          return e && q && e.getClientRects().length ? { t: e.textContent.replace(/\s+/g, ' ').trim(), inView: e.getBoundingClientRect().bottom <= innerHeight, ph: q.getAttribute('placeholder') } : null; }, null, 10000);
        check(`7c Import ${w}×${ht}: the shared box in its panel, the hint under it`, !!HI && HI.t === 'Typing never signs, sends or files — a press does.' && HI.ph === 'Ask for anything, or type /' && HI.inView, JSON.stringify(HI));
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
