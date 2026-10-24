/* THE FIRST-TIMER ROUNDS — where the reader looks
   ============================================================
   The owner, 22 Oct 2026: a forklift driver asked to draft and negotiate a
   warehouse and transport agreement, on HaTi for the first time. Five rounds,
   each picked by name (On the card · One question · Who pays whom · He speaks ·
   Four doors). f866 pins the readings; this file walks them in a real browser:
     1 · a read-only account asks to draft: the card says what is true and who
         lifts it; Ask presses the one Ask an admin record; the Guide's door says
         the same with the same press
     2 · "draft a warehouse partnership agreement with Kilifi Haulage": the
         sheet says no paper is called that, asks store · move · both, the cards
         carry what they share and when to use them; an answer moves and marks,
         picks nothing
     3 · Who pays whom? as three presses, the meaning under them, stored as the
         same field; the other company named in plain words
     4 · Create: Jambo speaks once beside the new Dossier; Fill them in lands on
         the first owed line; the empty Redlines column says send it first, and
         its Send opens the send screen set to Negotiate
     5 · their asks: a plain reason where no rule is written; Ask a colleague
         opens the send screen set to a colleague with the change named; Accept
         says it has not gone yet; Counter on a number names the figures
     6 · the owner's three screens: painted, nothing sideways, no page error
   Run: node test/chromium/first-timer-rounds-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'first-timer-rounds');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0, passes = 0;
const check = (ok, what, detail) => {
  console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : ''));
  if (ok) passes++; else failures++;
};
/* A WAIT ASKS FOR THE STATE, BOUNDED — never a fixed pause */
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
const still = page => until(page, () => !document.getAnimations().some(a => a.playState === 'running'), null, 4000);
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const DOC = ['WAREHOUSING AND TRANSPORT AGREEMENT', '', '1. SERVICES', 'The Provider shall store the Goods and carry them to the Customer\'s depots.',
  '2. PAYMENT', 'Invoices are payable within thirty (30) days of receipt.', '3. LIABILITY', 'Each party is liable for loss it causes.'].join('\n');

(async () => {
  const h = await startHati({});
  /* their asks wait on us: a figure moved (payment) and words added (liability) */
  const live = Object.assign(fixtureContract('MW-K1', 'Warehousing & Transport Agreement', 'Kilifi Haulage & Logistics Ltd', 'dist', 2400000, 'Under Review', DOC),
    { template: 'WH', negotiation: { round: 2, turn: 'owner', turnAt: iso(-1), rounds: [] }, changes: [
      { id: 'K1', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty', author: 'Otieno Baraka',
        newText: 'Invoices are payable within sixty (60) days of receipt.', oldText: 'Invoices are payable within thirty (30) days of receipt.', createdAt: iso(-1) },
      { id: 'K2', clauseId: 'cl_liab', clauseLabel: '3. LIABILITY', status: 'pending', authorSide: 'counterparty', author: 'Otieno Baraka',
        newText: "Each party is liable for loss it causes. Liability of either party is limited to one month's fees.", oldText: 'Each party is liable for loss it causes.', createdAt: iso(-1) } ] });
  const S = await seedWorkspace(h, { contracts: FIXTURES.concat([live]), approvalRules: [] });
  await S.admin.json('/api/users', { method: 'POST', body: { name: 'Amina Odhiambo', email: 'amina@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  const vc = h.client('amina@example.co.ke');
  await vc.json('/api/login', { method: 'POST', body: { email: 'amina@example.co.ke', password: 'temporary-pass-1' } });
  await vc.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [], blocked = [];
  const login = async (email, pw, size = SCREENS[0]) => {
    const ctx = await browser.newContext({ viewport: { width: size[0], height: size[1] } });
    const P = await ctx.newPage(); P.setDefaultTimeout(8000);
    P.on('pageerror', e => errors.push(String(e && e.message || e)));
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', email); await P.fill('#li-pass', pw); await press(P, '#li-go');
    await until(P, () => !!(window.currentUser && currentUser() && typeof getContract === 'function'), null, 15000);
    /* the first page painted and its Jambo panel standing, before anything is asked */
    await until(P, () => !!(typeof state === 'object' && state.view && document.querySelector('#content') && document.querySelector('#content').children.length), null, 10000);
    await still(P);
    return P;
  };
  const drive = async (P, fn, arg, fallback) => { try { return await P.evaluate(fn, arg); } catch (e) { blocked.push(String(e && e.message || e).split('\n')[0]); return fallback; } };
  /* A PRESS THAT FINDS NOTHING REPORTS RATHER THAN STOPS: every round says what it saw */
  const press = (P, sel) => drive(P, x => { const el = document.querySelector(x); if (!el) return false; el.click(); return true; }, sel, false);
  const painted = (P, sel) => drive(P, s => { const el = document.querySelector(s); if (!el) return false; el.scrollIntoView({ block: 'nearest' });
    const r = el.getBoundingClientRect(); const at = document.elementFromPoint(r.left + Math.min(12, r.width / 2), r.top + Math.min(8, r.height / 2)); return !!(at && el.contains(at)); }, sel, false);
  const sideways = P => drive(P, () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, null, true);
  const shot = async (P, name) => { await still(P); await P.screenshot({ path: path.join(OUT, name + '.png') }); };
  try {
    /* ============ 1 · A "NO" THAT HELPS ============ */
    for (const [w, hgt] of SCREENS){
      const V = await login('amina@example.co.ke', 'their-own-pass-9', [w, hgt]);
      await drive(V, () => counterAsk('draft'));
      const card = await until(V, () => !!document.querySelector('.ca-card.ca-dr [data-ca-wall-act]'), null, 12000);
      const seen = await drive(V, () => { const c = [...document.querySelectorAll('.ca-card.ca-dr')].pop(); if (!c) return null;
        const why = c.querySelector('.ca-why.ca-wall'), ask = c.querySelector('[data-ca-wall-ask]');
        return { why: why && why.innerText.replace(/\s+/g, ' '), ask: ask && ask.innerText, filled: [...c.querySelectorAll('.ui-btn-primary:not([disabled])')].length,
          dead: [...c.querySelectorAll('button[disabled]')].map(b => b.title) }; }, null, null);
      if (w === 1440){
        check(card && !!(seen && /^You can read contracts but not start one yet\./.test(seen.why) && /your admin, can change it/.test(seen.why)), '1a the card says what is true and who lifts it', seen);
        check(!!(seen && /^Ask \S+ to let me draft$/.test(seen.ask) && seen.filled === 1), '1b the ask is the one filled button', seen);
        check(!!(seen && seen.dead.length === 2 && seen.dead.every(t => /not start one yet/.test(t))), '1c the two acts stay greyed, each saying why', seen && seen.dead);
      }
      /* asked once already (at the first screen), the card says so where the ask stood */
      check(await painted(V, '.ca-card.ca-dr [data-ca-wall-act]'), `1d the ask (or that it was asked) is painted at ${w}×${hgt}`);
      check(!(await sideways(V)), `1e nothing sideways at ${w}×${hgt}`);
      await shot(V, `${w}x${hgt}-1-card`);
      if (w === 1440){
        await press(V, '.ca-card.ca-dr [data-ca-wall-ask]');
        const asked = await until(V, () => !!document.querySelector('.ca-card.ca-dr .ca-wall-asked'), null, 8000);
        const r = await S.admin.json('/api/settings-asks');
        const mine = (r.asks || []).filter(a => a.by && a.by.name === 'Amina Odhiambo');
        check(asked && mine.length === 1 && mine[0].panel === 'me:role' && mine[0].status === 'open', '1f the press is the one Ask an admin record about her role, on the admin\'s list', mine.map(a => [a.panel, a.status, a.what]));
        await shot(V, `${w}x${hgt}-1-asked`);
        await drive(V, () => { document.getElementById('toast-root').innerHTML = ''; openNewAgreement(); });
        const toastSaid = await drive(V, () => document.getElementById('toast-root').innerText.replace(/\s+/g, ' '), null, '');
        check(/^Asked .* · it waits on their Needs you list until they answer/.test(toastSaid.trim()), '1g another door (New agreement) says the same, and that it was asked', toastSaid);
      }
      await V.context().close();
    }

    /* ============ 2 · THE RIGHT TEMPLATE ============ */
    const P = await login('admin@example.co.ke', 'adminpassword1');
    await drive(P, () => counterAsk('draft a warehouse partnership agreement with Kilifi Haulage'));
    await until(P, () => !!(document.querySelector('[data-ca-act="form"]') || document.getElementById('na-words')), null, 10000);
    await drive(P, () => { const x = [...document.querySelectorAll('[data-ca-act="form"]')].pop(); if (x) x.click(); });
    await until(P, () => !!document.getElementById('na-dq'), null, 8000);
    const sheet = await drive(P, () => ({ hint: (document.querySelector('#wz-pick .na-step .na-hint') || {}).innerText,
      q: (document.querySelector('#na-dq .na-dq-q') || {}).innerText,
      cards: [...document.querySelectorAll('#na-closest .na-pick')].map(b => ({ n: b.querySelector('.na-pick-n').innerText, best: !!b.querySelector('.na-best'),
        m: (b.querySelector('.na-pick-m') || {}).innerText || '', use: (b.querySelector('.na-use') || {}).innerText || '', on: b.getAttribute('aria-checked') })) }), null, null);
    check(!!(sheet && /^No paper is called “warehouse partnership”\. One question decides it\.$/.test(sheet.hint)), '2a the sheet says no paper is called that', sheet && sheet.hint);
    check(!!(sheet && sheet.q === 'Will Kilifi Haulage store your goods, move them, or both?'), '2b and asks the one question', sheet && sheet.q);
    const wh = sheet && sheet.cards.find(c => c.n === 'Warehousing'), ff = sheet && sheet.cards.find(c => /Logistics|Freight/.test(c.n));
    check(!!(wh && wh.best && /shares “warehouse”/.test(wh.m) && /^Use when another company keeps our goods/.test(wh.use)), '2c Warehousing is the closest, says what it shares and when to use it', wh);
    check(!!(ff && /shares “haulage”/.test(ff.m) && /^Use when another company moves our goods/.test(ff.use)), '2d Freight answers to "haulage", with its own line', ff);
    check(!!(sheet && sheet.cards.every(c => c.use) && sheet.cards.every(c => c.on === 'false')), '2e every card has its line; nothing is picked', sheet && sheet.cards.map(c => [c.n, c.on]));
    await press(P, '#na-dq [data-na-dq="move"]');
    const moved = await drive(P, () => [...document.querySelectorAll('#na-closest .na-pick')].map(b => [b.querySelector('.na-pick-n').innerText, !!b.querySelector('.na-best'), b.getAttribute('aria-checked')]), null, []);
    check(/Logistics|Freight/.test((moved[0] || [])[0]) && moved[0][1] === true && moved.every(x => x[2] === 'false'), '2f "They move them" moves Freight first and marks it; still nothing picked', moved);
    await press(P, '#na-dq [data-na-dq="both"]');
    for (const [w, hgt] of SCREENS){
      await P.setViewportSize({ width: w, height: hgt });
      await drive(P, () => document.getElementById('wz-pick').scrollIntoView({ block: 'start' }));
      check(await painted(P, '#na-dq [data-na-dq="both"]') && !(await sideways(P)), `2g the question is painted, nothing sideways, at ${w}×${hgt}`);
      await shot(P, `${w}x${hgt}-2-start-from`);
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 3 · WHO PAYS WHOM ============ */
    await press(P, '#na-closest [data-wz-tid="WH"]');
    await until(P, () => !!document.querySelector('[data-pw-for="wz-side"]'), null, 8000);
    const before = await drive(P, () => ({ v: document.getElementById('wz-side').value, say: document.querySelector('[data-pw-for="wz-side"] [data-pw-say]').textContent,
      words: [...document.querySelectorAll('[data-pw-for="wz-side"] [data-pw-v]')].map(b => b.innerText),
      label: document.querySelector('[data-pw-for="wz-side"]').parentElement.innerText.split('\n')[0],
      cp: document.getElementById('wz-counterparty').closest('label').innerText.replace(/\s+/g, ' ') }), null, null);
    check(!!(before && before.label === 'Who pays whom?' && before.words.join(' · ') === 'We pay them · They pay us · No money' && before.v === '' && before.say === ''),
      '3a "Who pays whom?" as three presses, none chosen, nothing said', before);
    check(!!(before && /^The other company \* .*As on their invoices or letterhead$/.test(before.cp)), '3b the other company is named in plain words, with where the name is found', before && before.cp);
    await press(P, '[data-pw-for="wz-side"] [data-pw-v="customer"]');
    const after = await drive(P, () => ({ v: document.getElementById('wz-side').value, say: document.querySelector('[data-pw-for="wz-side"] [data-pw-say]').textContent }), null, null);
    check(!!(after && after.v === 'customer' && /^So we are the customer\./.test(after.say)), '3c "We pay them" stores customer and says so', after);
    for (const [w, hgt] of SCREENS){
      await P.setViewportSize({ width: w, height: hgt });
      await drive(P, () => document.querySelector('[data-pw-for="wz-side"]').scrollIntoView({ block: 'center' }));
      check(await painted(P, '[data-pw-for="wz-side"] [data-pw-v="none"]') && !(await sideways(P)), `3d the three presses are painted, nothing sideways, at ${w}×${hgt}`);
      await shot(P, `${w}x${hgt}-3-who-pays`);
    }
    await P.setViewportSize({ width: 1440, height: 780 });

    /* ============ 4 · JAMBO SPEAKS FIRST ON A DRAFT ============ */
    await press(P, '[data-na-stream="dist"]');
    await until(P, () => { const b = document.getElementById('na-create'); return !!(b && !b.disabled); }, null, 6000);
    await press(P, '#na-create');
    const spoke = await until(P, () => [...document.querySelectorAll('#ig-dock .jb-turn')].some(t => /A few things are still open/.test(t.innerText)), null, 15000);
    const id = await drive(P, () => pdContract() && pdContract().id, null, null);
    const said = await drive(P, () => { const T = [...document.querySelectorAll('#ig-dock .jb-turn')].map(t => t.innerText.replace(/\s+/g, ' '));
      const box = [...document.querySelectorAll('#ig-dock .igd-choices')].pop();
      return { T: T.slice(-2), choices: box ? [...box.querySelectorAll('button')].map(b => [b.innerText.trim(), b.classList.contains('ui-btn-primary')]) : [] }; }, null, null);
    check(spoke && !!id, '4a Create: Jambo speaks beside the new paper', id);
    check(!!(said && /^This is our Warehousing & Cold-Chain Agreement with Kilifi Haulage\. A few things are still open: /.test(said.T[0])), '4b what is still open, read off what the paper owes', said && said.T[0]);
    check(!!(said && /^Fill those in, then send it to Kilifi Haulage so they can mark it up\./.test(said.T[1])), '4c and what comes after', said && said.T[1]);
    check(!!(said && said.choices.length === 2 && said.choices[0][0] === 'Fill them in' && said.choices[0][1] && !said.choices[1][1] && /^Send it to Kilifi Haulage to mark up$/.test(said.choices[1][0])), '4d Fill them in leads, the one filled button', said && said.choices);
    check((await drive(P, c => getContract(c) && getContract(c).metadata && getContract(c).metadata.category, id, null)) === 'customer', '4e "We pay them" is stored as customer on the record');
    for (const [w, hgt] of SCREENS){
      await P.setViewportSize({ width: w, height: hgt });
      check(await painted(P, '#ig-dock .igd-choices .ui-btn-primary') && !(await sideways(P)), `4f his words and Fill them in are painted, nothing sideways, at ${w}×${hgt}`);
      await shot(P, `${w}x${hgt}-4-he-speaks`);
    }
    await P.setViewportSize({ width: 1440, height: 780 });
    const n0 = await drive(P, () => [...document.querySelectorAll('#ig-dock .jb-turn')].filter(t => /A few things are still open/.test(t.innerText)).length, null, -1);
    await drive(P, () => renderIntelDock());
    const n1 = await drive(P, () => intel.history.filter(m => m && /A few things are still open/.test(String(m.text || ''))).length, null, -1);
    check(n0 === 1 && n1 === 1, '4g he says it once: a repaint adds nothing', { n0, n1 });
    await drive(P, () => { const b = [...document.querySelectorAll('#ig-dock .igd-choices button')].find(x => x.innerText.trim() === 'Fill them in'); if (b) b.click(); });
    const landed = await until(P, () => !!document.querySelector('#pd-og .pd-og-row.is-open'), null, 8000);
    check(landed && await drive(P, () => !document.querySelector('#ig-dock .jb-turn'), null, false) !== null, '4h Fill them in turns the panel back to the Dossier, the first owed line open');
    /* the empty Redlines column of a paper not yet sent */
    await drive(P, () => pdRedOpen(pdContract().id));
    await until(P, () => !!document.querySelector('#confirm-overlay button') || !!document.querySelector('#ig-dock .rl-empty-first'), null, 8000);
    await drive(P, () => { const b = [...document.querySelectorAll('#confirm-overlay button')].find(x => /anyway/i.test(x.innerText)); if (b) b.click(); });
    await until(P, () => !!document.querySelector('#ig-dock .rl-empty-first'), null, 8000);
    const empty = await drive(P, () => ({ first: (document.querySelector('#ig-dock .rl-empty-first') || {}).innerText,
      filled: [...document.querySelectorAll('#ig-dock .rl-empty-acts button')].filter(b => getComputedStyle(b).backgroundColor !== 'rgba(0, 0, 0, 0)' && !b.disabled).map(b => b.innerText.trim()) }), null, null);
    check(!!(empty && empty.first === 'Nothing to answer yet. Send the paper to Kilifi Haulage; their changes come back here.'), '4i the empty Redlines column says what is true for a paper not yet sent', empty && empty.first);
    check(!!(empty && empty.filled.length === 1 && empty.filled[0] === 'Send to mark up'), '4j Send to mark up is its one filled button', empty && empty.filled);
    await shot(P, '1440x780-4-empty-redlines');
    await press(P, '#ig-dock [data-rl-empty-send]');
    const neg = await until(P, () => { const b = document.querySelector('[data-share-purpose][aria-pressed="true"]'); return !!(b && b.getAttribute('data-share-purpose') === 'negotiate'); }, null, 8000);
    check(neg, '4k Send opens the one send screen, set to Negotiate');
    await drive(P, () => { try { closeModal(); } catch (_) {} });

    /* ============ 5 · ANSWERING THEIR CHANGES ============ */
    /* the asks stand on the paper's own clauses */
    await drive(P, () => { const c = getContract('MW-K1'); const L = negoClauseList(c);
      const at = re => (L.find(x => re.test(String(x.headingText || x.title || ''))) || {}).clauseId;
      c.changes.find(x => x.id === 'K1').clauseId = at(/payment/i); c.changes.find(x => x.id === 'K2').clauseId = at(/liability/i); persist(c); });
    await drive(P, () => pdOpenOnHome('MW-K1', 'copilot'));
    await until(P, () => !!(pdContract() && pdContract().id === 'MW-K1'), null, 8000);
    await drive(P, () => pdRedOpen('MW-K1'));
    await until(P, () => !!document.querySelector('#ig-dock [data-nego-accept="K2"]'), null, 10000);
    const rows = await drive(P, () => ['K1', 'K2'].map(id => { const c = document.querySelector(`#ig-dock [data-nego-card="${id}"]`); if (!c) return null;
      const r = c.querySelector('[data-rl-row-read]');
      return { id, read: r && r.getAttribute('data-rl-row-read'), w: r && r.querySelector('.rl-card-read-w').innerText, bg: r && getComputedStyle(r).backgroundColor, card: getComputedStyle(c).backgroundColor,
        verbs: [...c.querySelectorAll('.rl-card-verbs button')].map(b => b.innerText.trim()), clamp: r && getComputedStyle(r.querySelector('.rl-card-read-w')).webkitLineClamp }; }), null, []);
    const liab = rows.find(r => r && r.id === 'K2'), pay = rows.find(r => r && r.id === 'K1');
    check(!!(liab && liab.read === 'look' && /^This adds “Liability of either party is limited to one month's fees”\. Your paper says nothing like it\.$/.test(liab.w)), '5a no rule written: "Worth a look", with what the ask adds', liab);
    check(!!(liab && liab.clamp !== '2'), '5b the plain reason is read whole', liab && liab.clamp);
    /* 24 Oct 2026 (owner, third word): "i am only talking about the cards that are under risks to look at …
       Anything above them should have the grey color they always had" — the change card holding "Worth a
       look" is the grey card like its neighbour, and its read has no box of its own */
    check(!!(liab && pay && liab.card === pay.card && /rgba\(0, 0, 0, 0\)/.test(liab.bg)), '5a2 the change card holding "Worth a look" keeps the grey of the cards above the risks, no box inside', { look: liab && [liab.card, liab.bg], esc: pay && pay.card });
    check(!!(pay && pay.read === 'escalate'), '5c where a rule is written, its verdict still stands (the workspace\'s payment range)', pay && pay.read);
    check(!!(liab && pay && [liab, pay].every(r => r.verbs.slice(0, 4).join(' · ') === 'Accept · Reject · Counter · Ask a colleague')), '5d Ask a colleague sits after Counter on each of their asks', rows.map(r => r && r.verbs));
    for (const [w, hgt] of SCREENS){
      await P.setViewportSize({ width: w, height: hgt });
      check(await painted(P, '#ig-dock [data-rl-ask-colleague="K2"]') && !(await sideways(P)), `5e the row and its new door are painted, nothing sideways, at ${w}×${hgt}`);
      await shot(P, `${w}x${hgt}-5-rows`);
    }
    await P.setViewportSize({ width: 1440, height: 780 });
    await press(P, '#ig-dock [data-rl-cp-editor-change="K1"]');
    const fact = await until(P, () => { const l = document.getElementById('ce-lane'); return !!(l && /They asked for 60 days; your paper says 30\./.test(l.innerText)); }, null, 10000);
    check(fact, '5f Counter on a number opens with Jambo naming the two figures');
    await shot(P, '1440x780-5-counter');
    await drive(P, () => { if (typeof window.ceRowBack === 'function') window.ceRowBack(); else if (typeof window.clauseEditorClose === 'function') window.clauseEditorClose(); });
    await until(P, () => !document.body.classList.contains('ce-open'), null, 6000);
    await drive(P, () => { pdOpenOnHome('MW-K1', 'copilot'); pdRedOpen('MW-K1'); });
    await until(P, () => !!document.querySelector('#ig-dock [data-nego-accept="K2"]'), null, 10000);
    await drive(P, () => { document.getElementById('toast-root').innerHTML = ''; });
    await press(P, '#ig-dock [data-nego-accept="K2"]');
    const accepted = await until(P, () => /^Accepted: 3\. Liability\. It goes to Kilifi Haulage & Logistics Ltd when you press Send all\. Changed your mind\? Press Reopen\./.test(document.getElementById('toast-root').innerText.trim()), null, 6000);
    const reopen = await drive(P, () => { const c = document.querySelector('#ig-dock [data-nego-card="K2"]'); return !!(c && [...c.querySelectorAll('button')].some(b => b.innerText.trim() === 'Reopen')); }, null, false);
    check(accepted && reopen, '5g Accept says it has not gone yet and names Reopen, which is on the row');
    await press(P, '#ig-dock [data-rl-ask-colleague="K1"]');
    const col = await until(P, () => { const b = document.querySelector('[data-share-purpose][aria-pressed="true"]'); return !!(b && b.getAttribute('data-share-purpose') === 'colleague'); }, null, 8000);
    /* THE WORDS ARE WAITED FOR, NOT READ ON THE BEAT THE PURPOSE LANDS (24 Oct 2026): the screen sets the purpose
       first and writes the summary a tick later, so a slow machine read it empty. until() answers true/false, so it
       waits and drive() reads. */
    await until(P, () => { const e = document.getElementById('sh-summary'); return !!(e && e.value); }, null, 12000);
    const note = await drive(P, () => (document.getElementById('sh-summary') || {}).value, null, '');
    check(col && /^Kilifi Haulage & Logistics Ltd asked to change 2\. Payment\. They want 60 days instead of the 30 in your paper\./.test(note || ''), '5h Ask a colleague opens the send screen set to a colleague, the change named', note);
    await shot(P, '1440x780-5-ask-colleague');

    /* ============ 6 · NO PAGE ERROR ============ */
    check(errors.length === 0, '6a no page error', errors.slice(0, 3));
    check(blocked.length === 0, '6b every probe ran', blocked.slice(0, 3));
  } catch (e) {
    check(false, 'the walk finished', String(e && e.message || e).split('\n')[0]);
  } finally {
    await browser.close();
    await h.stop?.();
    console.log(`\n${passes} passed, ${failures} failed`);
    process.exit(failures ? 1 : 0);
  }
})();
