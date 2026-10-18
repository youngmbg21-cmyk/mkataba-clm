/* BEFORE YOU SIGN, "THE ROAD", EVERY DRAWN PART (round 10 of the redesign,
   option 2 "The road"; the owner's yes of 18 Oct 2026 to build every gap
   between the picked drawing and HaTi; js/paperdesk.js pdRoadStops,
   pdRoadYesHtml, pdRoadPress)

   WHAT THIS PINS, driven in a real browser on the drawing's own state: Lina
   leads MK-0391 and her contracts need Jonas Berg's yes before anyone signs;
   Jonas is away and the reader (Amina) answers for him; Henrik Dahl signs for
   Helio, then Jonas for us
     1 Ready to sign names its checks and folds them behind "Show"; the yes is
       its own stop, "Jonas Berg's yes", framed: where it stands (asked ›
       waiting › approved · or refused, lapsed), Jambo's line ("Jonas is away
       until … You may give their yes for them; their signature still waits
       for them."), what it covers, Approve for Jonas · Refuse…; each signer's
       stop says what it waits for; Sealed and sent; the foot "Who signs can
       change until the first signature." · Change opens the route's editor
     2 the column's own approval card is not drawn a second time; Show unfolds
       the checks under Ready to sign and Hide folds them
     3 the asker (Lina) sees where it stands and Remind Jonas — never Approve
     4 the email's link (go=approval) lands on the frame and lights it
     5 Approve for Jonas: the server records the yes for Jonas, the stop is
       ticked "Approved by Amina Otieno for Jonas Berg, today", the road
       moves on to Helio
     6 in Svenska; the owner's three screens: the yes and its buttons in
       view, nothing sideways
   THE SECOND PASS (the checker's list, 18 Oct 2026; node half f754):
     1b re-pointed — with the sign check off and nothing read, Ready to sign
        names the checks that came back clear and the rest "not clear yet";
        the brief is never called clear unread
     7 before the yes: the pill "1 to settle" (Helio's turn is a wait, not a
       thing to settle); "Signing copy", its page arrows and size on the
       paper's line, nothing above the paper; no "Sign here" for a reader
       whose turn it is not; no "Signing it their way" line on the face — the
       Menu tab's row; no chips under the face; the road fits the owner's
       screens (none at 1440×780 and 1366×950, at most 41px at 1536×730)
     8 after the yes: the pill "Their turn"; Helio's stop is the open one with
       its own button, the column folded behind Show
     9 the receipt: every stop ticked, the yes off the record, each signer
       with the day they signed
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/the-road-as-drawn-verify.js */
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
const DOC = ['POWER PURCHASE AGREEMENT', '', '1. Supply', '', 'The Seller delivers electricity from the Solberga solar park to the Buyer at the delivery point for the whole term.', '',
  '2. Price', '', 'The Buyer pays a fixed price per megawatt hour as set out in Schedule 1.'].join('\n');
/* the days of the away rule, from the server's own today (never the day this check happens to run on a fixed calendar) */
const dayAfter = (iso, n) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  /* 9 (pass 2): a sealed copy of the same agreement, its yes and its two signatures on the record */
  const ago = n => new Date(Date.now() - n * 864e5).toISOString();
  const sealed = H.fixtureContract('MK-0392', 'Power purchase agreement', 'Helio Energy AB', H.FOLDER_A, 8100000, 'Signed', DOC);
  sealed.template = null; sealed.signedAt = ago(9);
  sealed.signerPlan = [{ id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 1, signed: true, at: ago(10), by: 'Henrik Dahl' },
    { id: 's-us', party: 'internal', name: 'Amina Otieno', email: 'admin@example.co.ke', order: 2, signed: true, at: ago(9), by: 'Amina Otieno' }];
  sealed.signatures = [{ name: 'Henrik Dahl', party: 'counterparty', at: ago(10) }, { name: 'Amina Otieno', party: 'internal', at: ago(9) }];
  sealed.signApprovals = [{ id: 'sa_r1', key: 'k-jonas', status: 'approved', approverName: 'Jonas Berg', askedBy: { id: 'x', name: 'Lina Ek' }, askedAt: ago(12),
    decidedBy: { id: 'y', name: 'Amina Otieno' }, decidedAt: ago(11), for: { id: 'z', name: 'Jonas Berg' } }];
  const W = await H.seedWorkspace(h, { contracts: [sealed], approvalRules: [] });
  /* the checks are the gate's to hold (signCheckGate): off here, so Ready to sign is clear, as drawn */
  await W.admin.json('/api/settings', { method: 'PUT', body: { signCheckGate: 'off', approvalRules: [] } });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const mk = async (name, email) => { const r = await W.admin.json('/api/users', { method: 'POST', body: { name, email, role: 'legal', password: 'temporary-pass-1' } });
    const c = h.client(email); await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
    await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } }); return { c, u: r.user }; };
  const jonas = await mk('Jonas Berg', 'jonas@example.co.ke');
  const lina = await mk('Lina Ek', 'lina@example.co.ke');
  await W.admin.json('/api/users/' + lina.u.id, { method: 'PATCH', body: { overseerId: jonas.u.id, overseerOn: 'always' } });
  const c0 = H.fixtureContract('MK-0391', 'Power purchase agreement', 'Helio Energy AB', H.FOLDER_A, 8100000, 'Under Review', DOC);
  c0.template = null; c0.owner = { id: lina.u.id, name: 'Lina Ek' };
  c0.signerPlan = [{ id: 's-cp', party: 'counterparty', name: 'Henrik Dahl', email: 'henrik@helio.example', order: 1 },
    { id: 's-us', party: 'internal', name: 'Jonas Berg', memberId: jonas.u.id, email: 'jonas@example.co.ke', order: 2 }];
  await W.admin.json('/api/contracts/MK-0391', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const login = async (email, pass) => { const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0391'), null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    return page; };
  const untilOn = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const openFace = async page => { await page.evaluate(async () => { const c = getContract('MK-0391'); if (c._light && window.ensureFull) await ensureFull(c); setView('dashboard'); pdOpenOnHome('MK-0391', 'copilot'); });
    await untilOn(page, () => !!document.getElementById('ig-canvas'), null, 15000);
    await page.evaluate(() => pdSignOpen('MK-0391'));
    return untilOn(page, () => document.querySelectorAll('#pd-signface [data-pd-road-stop]').length >= 3, null, 15000); };
  const ROAD = () => { const f = document.getElementById('pd-signface'); if (!f) return null;
    const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
    const stops = [...f.querySelectorAll('[data-pd-road-stop]')].map(x => ({ k: x.getAttribute('data-pd-road-stop'), cls: x.className, t: x.querySelector('b').textContent,
      sub: (x.querySelector(':scope > .pd-road-t > small') || {}).textContent || '', order: Number(x.style.order) }));
    const card = f.querySelector('.pd-rd-card');
    const body = f.querySelector('.pd-sf-body'), foot = f.querySelector('[data-pd-rd-foot]');
    return { stops, card: card ? { id: card.id, states: [...card.querySelectorAll('.pd-rd-st')].map(s => s.className.replace('pd-rd-st', '').trim() + ':' + s.textContent),
      jline: (card.querySelector('.pd-rd-jline') || {}).textContent || '', facts: (card.querySelector('.pd-rd-facts') || {}).textContent || '',
      acts: [...card.querySelectorAll('.pd-rd-acts button')].map(b => b.textContent.trim() + (b.classList.contains('ui-btn-primary') ? '*' : '')),
      inStop: !!card.closest('[data-pd-road-stop="yes"]') } : null,
      body: { vis: vis(body), order: Number(body && body.style.order) }, cards: document.querySelectorAll('#sa-card').length,
      foot: foot ? { vis: vis(foot), text: [...foot.children].map(x => x.textContent.trim()).join(' ') } : null }; };
  try {
    /* Lina asks Jonas, through the one request */
    const lp = await login('lina@example.co.ke', 'their-own-pass-9');
    const asked = await lp.evaluate(async () => { const c = getContract('MK-0391'); if (c._light && window.ensureFull) await ensureFull(c);
      const ok = await signApprovalRequest(c, ''); if (window.flushSaves) await flushSaves(); return ok; });
    check('0 the lead asked Jonas Berg for his yes', asked === true, String(asked));
    /* Jonas is away from today for five days; Amina answers for him */
    const today = (await jonas.c.json('/api/me/away')).today;
    const aw = await jonas.c.json('/api/me/away', { method: 'PUT', body: { from: today, to: dayAfter(today, 4), deputyId: me.id } });
    check('0 Jonas is away and Amina answers for him', !!(aw && aw.mine && aw.mine.deputyId === me.id), JSON.stringify(aw && aw.mine));

    /* 3 first: the asker's view */
    await openFace(lp);
    const L = await lp.evaluate(ROAD);
    check('3 the asker sees where it stands and Remind Jonas — never Approve, never the stand-in\'s line', !!L && !!L.card && L.card.acts.join('|') === 'Remind Jonas' && !L.card.jline && L.card.id !== 'sa-card',
      JSON.stringify(L && L.card));
    await lp.close();

    const page = await login('admin@example.co.ke', 'adminpassword1');
    await openFace(page);
    await page.waitForTimeout(300);
    const R1 = await page.evaluate(ROAD);
    const ks = R1.stops.map(s => s.k);
    check('1a the way to "signed": Ready to sign, Jonas Berg\'s yes, Helio signs, we sign, Sealed and sent', ks.join('|') === 'ready|yes|step1|step2|sealed', ks.join('|'));
    /* RE-POINTED (pass 2, 18 Oct 2026): a check is clear only where it came back clear — with the gate
       off and nothing read, the readings are "not clear yet", and the brief is never called clear unread */
    check('1b Ready to sign is ticked, names what came back clear and what is not clear yet, its body folded behind Show',
      /is-done/.test(R1.stops[0].cls) && /^\d checks? clear: [a-z, ]+ · not clear yet: [a-z, ]*standards[a-z, ]*the brief · Show$/.test(R1.stops[0].sub) && !/clear: [^·]*the brief/.test(R1.stops[0].sub) && !R1.body.vis,
      JSON.stringify({ s: R1.stops[0], body: R1.body }));
    check('1c the yes is its own stop, "Jonas Berg’s yes", the open one, framed', R1.stops[1].t === 'Jonas Berg’s yes' && /is-now/.test(R1.stops[1].cls) && /is-framed/.test(R1.stops[1].cls) && !!R1.card && R1.card.inStop, JSON.stringify(R1.stops[1]));
    check('1d where the approval stands: Asked today › Waiting (lit) › Approved · or Refused, Lapsed', !!R1.card && R1.card.states.join('|') === 'is-past:Asked today|is-cur:Waiting|:Approved|:Refused|:Lapsed', JSON.stringify(R1.card && R1.card.states));
    check('1e Jambo\'s line at the stop: "Jonas is away until <day>. You may give their yes for them; their signature still waits for them."',
      !!R1.card && /^Jonas is away until \S+\. You may give their yes for them; their signature still waits for them\.$/.test(R1.card.jline.trim()), R1.card && R1.card.jline);
    check('1f what it covers: "Lina Ek asked. It covers the wording as it stands, KES 8.10M and the signers below; a change undoes it."',
      !!R1.card && R1.card.facts === 'Lina Ek asked. It covers the wording as it stands, KES 8.10M and the signers below; a change undoes it.', R1.card && R1.card.facts);
    check('1g its acts: Approve for Jonas (the lead button) · Refuse…', !!R1.card && R1.card.acts.slice(0, 2).join('|') === 'Approve for Jonas*|Refuse…', JSON.stringify(R1.card && R1.card.acts));
    check('1h each signer\'s stop says what it waits for', R1.stops[2].t === 'Helio Energy AB signs' && R1.stops[2].sub === 'Henrik Dahl · their link opens after the yes'
      && /signs$/.test(R1.stops[3].t) && /^Jonas Berg · back \S+( \S+)? · only they can sign$/.test(R1.stops[3].sub), JSON.stringify(R1.stops.slice(2, 4)));
    check('1i Sealed and sent: copies to both sides', R1.stops[4].t === 'Sealed and sent' && /^Copies to both sides/.test(R1.stops[4].sub), R1.stops[4].sub);
    check('1j the foot: "Who signs can change until the first signature." · Change', !!R1.foot && R1.foot.vis && R1.foot.text === 'Who signs can change until the first signature. Change', JSON.stringify(R1.foot));
    await shot(page, '10-the-road-1440x780');
    /* 7 (pass 2) before the yes */
    const S7 = await page.evaluate(() => { const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const strip = document.getElementById('ig-strip'), sc = strip && strip.querySelector('[data-ig-sc]');
      const menu = (window.pdMenuGroups ? pdMenuGroups(getContract('MK-0391')) : []).map(g => g.rows.join('')).join('');
      return { pill: ((document.querySelector('#pd-signface [data-pd-sf-pill]') || {}).textContent || '').trim(),
        word: sc ? (sc.querySelector('.ig-sc-word') || {}).textContent : null, page: !!(sc && sc.querySelector('[data-sc-page]')), zoom: !!(sc && sc.querySelector('[data-sc-zoom]')),
        above: !!document.querySelector('#ig-paper .paper-zc'), flags: document.querySelectorAll('#ig-canvas .rl-sigline.pg-mine').length,
        theirWay: vis(document.querySelector('#pd-signface #sign-paper')), menuRow: /id="ws-m-their-way"/.test(menu),
        chips: document.querySelectorAll('#ig-dock [data-ig-chips] button').length }; });
    check('7a the pill counts only what is ours to settle: "1 to settle" (Helio\'s turn is a wait)', S7.pill === '1 to settle', S7.pill);
    check('7b "Signing copy", its page arrows and size on the paper\'s line — nothing above the paper', S7.word === 'Signing copy' && S7.page && S7.zoom && !S7.above, JSON.stringify(S7));
    check('7c no "Sign here" for a reader whose turn it is not', S7.flags === 0, String(S7.flags));
    check('7d no "Signing it their way" line on the face — its door is the Menu tab\'s row', !S7.theirWay && S7.menuRow, JSON.stringify({ face: S7.theirWay, menu: S7.menuRow }));
    check('7e no chips under the face', S7.chips === 0, String(S7.chips));
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
      const over = await page.evaluate(() => { const f = document.querySelector('#pd-signface .pd-sf'); return f ? f.scrollHeight - f.clientHeight : null; });
      const most = w === 1536 ? 41 : 0;
      check(`7f ${w}×${ht}: the road fits the panel (scrolls at most ${most}px)`, over != null && over <= most, String(over));
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    await page.click('#pd-signface [data-pd-rd-route]');
    const ed = await untilOn(page, () => !!document.querySelector('#sr-say, .sr-win, [data-sr-step], #sp-save'), null, 6000);
    check('1k Change opens the signing route\'s own editor', !!ed);
    await page.keyboard.press('Escape').catch(() => {}); await page.waitForTimeout(300);
    await page.evaluate(() => { if (window.closeModal) closeModal(); });
    await untilOn(page, () => !document.querySelector('#sr-say, .sr-win') && !!document.querySelector('#pd-signface .pd-rd-card'), null, 6000);

    /* 2 one card; the fold */
    check('2a the column\'s own approval card is not drawn a second time: one #sa-card, the stop\'s', R1.cards === 1 && R1.card.id === 'sa-card', String(R1.cards));
    await page.click('#pd-signface [data-pd-rd-show]');
    const R2 = await page.evaluate(ROAD);
    check('2b Show unfolds the checks under Ready to sign; the link says Hide', R2.body.vis && R2.body.order === 3 && /· Hide$/.test(R2.stops[0].sub), JSON.stringify({ body: R2.body, s: R2.stops[0].sub }));
    await page.click('#pd-signface [data-pd-rd-show]');
    check('2c pressed again, it folds', !(await page.evaluate(ROAD)).body.vis);

    /* 4 the email's link */
    const landed = await page.evaluate(() => new Promise(r => { setView('dashboard'); location.hash = '#contract=MK-0391&tab=sign&go=approval'; openFromHash();
      const t0 = Date.now(); let lit = false; const look = () => { const el = document.getElementById('sa-card'); if (el && el.classList.contains('is-landed')) lit = true;
        if ((el && lit) || Date.now() - t0 > 5000) return r({ there: !!el, lit, inStop: !!(el && el.closest('[data-pd-road-stop="yes"]')) }); setTimeout(look, 100); }; setTimeout(look, 100); }));
    check('4 the approval email\'s link lands on the yes at its stop, and lights it', landed.there && landed.lit && landed.inStop, JSON.stringify(landed));
    await untilOn(page, () => !!document.querySelector('#pd-signface [data-pd-rd-approve]'), null, 6000);

    /* 6 the three screens, then Svenska (before the yes is given) */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
      const S = await page.evaluate(() => { const f = document.getElementById('pd-signface'), hd = f && f.querySelector('.pd-sf-h'), ap = f && f.querySelector('[data-pd-rd-approve]');
        const r = hd && hd.getBoundingClientRect(), a = ap && ap.getBoundingClientRect();
        return { head: !!r && r.top >= 0 && r.bottom <= innerHeight, approve: !!a && a.top >= 0 && a.bottom <= innerHeight, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the head and Approve for Jonas in view, nothing sideways`, S.head && S.approve && S.side, JSON.stringify(S));
      await shot(page, `10-the-road-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 }); await page.waitForTimeout(300);
    await page.evaluate(() => { if (window.langSet) langSet('sv'); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const c = getContract('MK-0391'); if (window.renderSignButton) renderSignButton(c); });
    const SV = await untilOn(page, () => { const t = (document.querySelector('#pd-signface [data-pd-road-stop="yes"] b') || {}).textContent; return t && /Godkännande/.test(t) ? { t, st: [...document.querySelectorAll('#pd-signface .pd-rd-st')].map(s => s.textContent).join('|') } : null; }, null, 6000);
    check('6 in Svenska: "Godkännande från Jonas Berg", its states in Swedish', !!SV && SV.t === 'Godkännande från Jonas Berg' && /Väntar/.test(SV.st), JSON.stringify(SV));
    await shot(page, '10-the-road-sv-1440x780');
    await page.evaluate(() => { if (window.langSet) langSet('en'); });
    await page.waitForTimeout(500);
    await page.evaluate(() => { const c = getContract('MK-0391'); if (window.renderSignButton) renderSignButton(c); });
    await untilOn(page, () => /Approve for/.test((document.querySelector('#pd-signface [data-pd-rd-approve]') || {}).textContent || ''), null, 6000);

    /* 5 the yes, given for Jonas */
    await page.click('#pd-signface [data-pd-rd-approve]');
    const gone = await untilOn(page, () => { const s = document.querySelector('#pd-signface [data-pd-road-stop="yes"]'); return s && /is-done/.test(s.className) ? (s.querySelector('small') || {}).textContent : null; }, null, 10000);
    const rec = await W.admin.json('/api/contracts/MK-0391');
    const q = (rec.signApprovals || []).slice(-1)[0] || {};
    check('5a the server records the yes, given by Amina for Jonas', q.status === 'approved' && q.decidedBy && q.decidedBy.id === me.id && q.for && q.for.id === jonas.u.id, JSON.stringify({ s: q.status, by: q.decidedBy, for: q.for }));
    check('5b the stop is ticked: "Approved by Amina Otieno for Jonas Berg, today"', gone === 'Approved by Amina Otieno for Jonas Berg, today', String(gone));
    const R5 = await page.evaluate(ROAD);
    check('5c the road moves on: Helio\'s turn now, nothing framed', /is-now/.test(R5.stops[2].cls) && R5.stops[2].sub === 'Henrik Dahl · their turn now' && !R5.card, JSON.stringify(R5.stops[2]));
    await shot(page, '10-the-road-given-1440x780');
    /* 8 (pass 2) after the yes: whose turn it is, Helio's stop open with its own button */
    await page.evaluate(() => { const c = getContract('MK-0391'); if (window.renderSignButton) renderSignButton(c); });
    const R8 = await untilOn(page, () => { const f = document.getElementById('pd-signface'); if (!f) return null;
      const st = f.querySelector('[data-pd-road-stop="step1"]'), body = f.querySelector('.pd-sf-body');
      const acts = st ? [...st.querySelectorAll('[data-pd-rd-press]')].map(b => b.textContent.trim()) : [];
      return acts.length ? { pill: ((f.querySelector('[data-pd-sf-pill]') || {}).textContent || '').trim(), acts, folded: !!body && getComputedStyle(body).display === 'none' } : null; }, null, 8000);
    check('8a after the yes the pill says whose turn it is: "Their turn"', !!R8 && R8.pill === 'Their turn', JSON.stringify(R8));
    check('8b Helio\'s stop is the open one with its own button; the column folds behind Show', !!R8 && R8.acts.length >= 1 && /link|Tell|Remind/.test(R8.acts.join(' ')) && R8.folded, JSON.stringify(R8));
    /* 9 (pass 2) the receipt */
    await page.evaluate(async () => { const c = getContract('MK-0392'); if (c._light && window.ensureFull) await ensureFull(c); setView('dashboard'); pdOpenOnHome('MK-0392', 'copilot'); });
    await untilOn(page, () => !!document.getElementById('ig-canvas') && window.intel && intel.paper && intel.paper.id === 'MK-0392', null, 15000);
    await page.evaluate(() => pdSignOpen('MK-0392'));
    const R9 = await untilOn(page, () => { const f = document.getElementById('pd-signface'); const s = f ? [...f.querySelectorAll('[data-pd-road-stop]')] : [];
      return s.length >= 4 ? { stops: s.map(x => ({ k: x.getAttribute('data-pd-road-stop'), done: /is-done/.test(x.className), sub: ((x.querySelector(':scope > .pd-road-t > small') || {}).textContent || '').trim() })),
        want: [pdDayWord(getContract('MK-0392').signApprovals[0].decidedAt), pdDayWord(getContract('MK-0392').signerPlan[0].at), pdDayWord(getContract('MK-0392').signerPlan[1].at)] } : null; }, null, 10000);
    check('9a the receipt: every stop ticked, the yes on the road', !!R9 && R9.stops.map(x => x.k).join('|') === 'ready|yes|step1|step2|sealed' && R9.stops.every(x => x.done), JSON.stringify(R9 && R9.stops));
    check('9b who approved, and when: "Approved by Amina Otieno for Jonas Berg, <day>"', !!R9 && R9.stops[1].sub === `Approved by Amina Otieno for Jonas Berg, ${R9.want[0]}`, JSON.stringify(R9 && [R9.stops[1], R9.want]));
    check('9c who signed, and when: "Henrik Dahl · signed <day>", "Amina Otieno · signed <day>"', !!R9 && R9.stops[2].sub === `Henrik Dahl · signed ${R9.want[1]}` && R9.stops[3].sub === `Amina Otieno · signed ${R9.want[2]}`, JSON.stringify(R9 && R9.stops.slice(2, 4)));
    await shot(page, '10-the-road-receipt-1440x780');
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
