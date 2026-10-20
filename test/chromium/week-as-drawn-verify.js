/* OBLIGATIONS AND THE CALENDAR AS ROUND 16 DRAWS THEM ("Week by week";
   the owner's "build all the gaps", 18 Oct 2026; lane A4 — js/obligations.js
   obwWeekRowHtml/obYourWeekSay, js/views/calendar.js calChipLook/calKeyHtml/
   calLevelSegHtml)

   WHAT THIS PINS, driven in a real browser, as the reader sees it
     1 Obligations: the head says "N outstanding · 1 overdue" with Open every
       week, Filter and + Add an obligation; each week a card of its own with
       what it holds ("work somebody could do now", "both theirs", "a renewal
       decision", a folded week's "Private" and "we pay …", "nobody owns it
       yet"); Late's row has Mark done, theirs Chase / Chase again with
       "chased …", a renewal decision Decide; Jambo's finds a row with Review
     2 nothing is chosen: Jambo's panel says "Your week" counted from the list,
       his offer, the planner's two asks as chips, and "Jambo may change my
       calendar" — Never is kept on the server and changes his offer
     3 every act ends in its door: Chase asks first; Review opens the review
       desk; Decide lands on the renewal card, lit; a row press says
       "Obligation" and ‹ Jambo goes back; + Add an obligation asks which
       contract and opens that contract's own form; the chip opens the Calendar
     4 the Calendar: its head (six weeks, the ⋯), the key as drawn, "This week,
       then five more", late work on this week's first day, their chip with
       their name, the decision in its week, "3 due", the hours "09", "+ Add
       your own" on an empty hour, Jambo's panel "Your week"
     5 the owner's three screens: both pages whole, nothing sideways, nothing
       under the panel, the head's acts and the panel's box in view
   Every date is built from today; a wait asks for the state, bounded.
   Run: node test/chromium/week-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
  if (!pass) failures++;
};
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* the Monday "this week" names: today's, the next one on a weekend */
const weekOf = () => {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  const mon = new Date(t); if (t.getDay() === 6) mon.setDate(t.getDate() + 2); else if (t.getDay() === 0) mon.setDate(t.getDate() + 1); else mon.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const at = (w, d) => { const x = new Date(mon); x.setDate(x.getDate() + 7 * w + d); return iso(x); };
  const back = n => { const x = new Date(t); x.setDate(t.getDate() - n); return iso(x); };
  return { at, back, today: iso(t) };
};

(async () => {
  const W = weekOf();
  /* a lease whose notice deadline is next Monday, and an employment agreement in a private stream */
  const exp = new Date(W.at(1, 0) + 'T00:00:00'); exp.setDate(exp.getDate() + 90);
  const lease = H.fixtureContract('MK-C1', 'Office Lease', 'Kvarnholmen Fastigheter', 'dist', 12000000, 'Signed');
  lease.metadata = { value: 12000000, currency: 'KES', expiryDate: iso(exp), noticePeriodDays: 90, renewalType: 'auto-renew' };
  lease.expiry = iso(exp);
  const emp = H.fixtureContract('MK-C2', 'Employment Agreement', 'Wanjiru Kamau', 'corp', 2400000, 'Signed');
  /* a scripted Jambo: the planner's ask gets a plan of two blocks on this
     week's working days still ahead (any other route gets the stub answer) */
  const ai = await H.startScriptedAi();
  const ahead = [0, 1, 2, 3, 4].map(d => W.at(0, d)).filter(d => d >= W.today).slice(0, 2);
  const planTurn = body => {
    const names = (body.tools || []).map(t => t.name);
    if (!names.includes('answer')) return null;
    if (!names.includes('propose_blocks')) return [{ type: 'tool_use', id: 'tu_ans', name: 'answer', input: { say: 'Tuesday morning is free; nothing is added.' } }];
    return [{ type: 'tool_use', id: 'tu_plan', name: 'propose_blocks', input: { say: 'Two hours around your own events: chase the certificate, then the late invoice.',
      blocks: ahead.map((d, i) => ({ date: d, start: i ? '14:00' : '10:00', end: i ? '15:00' : '11:00', title: i ? 'Check the September invoice' : 'Chase the insurance certificate', why: 'Free and before it is due.', contractId: i ? 'MK-A1' : 'MK-A2' })) } }];
  };
  ai.script(...Array(40).fill(planTurn));
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off', ANTHROPIC_BASE_URL: ai.base });
  const S = await H.seedWorkspace(h, { contracts: H.FIXTURES.concat([lease, emp]), approvalRules: [] });
  const boot = await S.admin.json('/api/bootstrap');
  const me = boot.user || (boot.users || []).find(u => u.email === 'admin@example.co.ke') || {};
  await S.admin.json('/api/private-streams/corp', { method: 'PUT', body: { on: true, ids: [String(me.id)] } }).catch(() => {});
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-C1'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    /* the stage's dates, built here from today and handed in as plain strings */
    const D = { today: W.today, b3: W.back(3), b7: W.back(7), a13: W.at(1, 3), a11: W.at(1, 1), a20: W.at(2, 0), a22: W.at(2, 2), a92: W.at(9, 2) };
    await page.evaluate(async D => {
      const me = currentUser(), other = getUsers().find(u => u.email === 'everything@example.co.ke') || me;
      for (const id of ['MK-A1', 'MK-A2', 'MK-B2', 'MK-C1', 'MK-C2']) { const c = getContract(id); if (c && c._light) await ensureFull(c); }
      const A1 = getContract('MK-A1'), A2 = getContract('MK-A2'), B2 = getContract('MK-B2'), C1 = getContract('MK-C1'), C2 = getContract('MK-C2');
      A1.obligations = [
        { id: 'o1', desc: 'Check the September invoice against the price list', due: D.b3, party: 'us', assignee: me.email, recurring: 'monthly', status: 'open' },
        { id: 'o2', desc: 'Quarterly volume report', due: D.a13, party: 'us', assignee: other.email, recurring: 'none', status: 'open' },
        { id: 'o3', desc: 'Pay the storage fee', due: D.a20, party: 'us', assignee: me.email, recurring: 'none', status: 'open', amount: 258000 } ];
      A2.obligations = [
        { id: 'o4', desc: 'Send a current insurance certificate', due: D.today, party: 'theirs', recurring: 'none', status: 'open' },
        { id: 'o5', desc: 'Minimum volume evidence', due: D.today, party: 'theirs', recurring: 'none', status: 'open', chasedAt: D.b7, chasedBy: me.name },
        { id: 'o6', desc: 'Monthly storage statement', due: D.a11, party: 'theirs', recurring: 'none', status: 'open' },
        { id: 'o7', desc: 'Rebate reconciliation', due: D.a92, party: 'us', assignee: '', recurring: 'none', status: 'open' } ];
      C2.obligations = [{ id: 'o8', desc: 'Probation review', due: D.a22, party: 'us', assignee: me.email, recurring: 'none', status: 'open' }];
      C1.owner = { id: me.id, name: me.name };
      B2.triage = Object.assign({}, B2.triage || {}, { at: new Date().toISOString(), steps: Object.assign({}, (B2.triage || {}).steps, { oblig: { ok: true, found: [
        { desc: 'Deliver monthly sales figures', quote: 'shall deliver monthly sales figures', due: '', recurring: 'monthly', party: 'theirs' },
        { desc: 'Keep product liability insurance', quote: 'shall maintain product liability insurance', due: '', recurring: 'none', party: 'theirs' },
        { desc: 'Pay listing fees within 30 days', quote: 'shall pay listing fees within thirty days', due: '', recurring: 'none', party: 'us' } ] } }) });
      [A1, A2, B2, C1, C2].forEach(c => persist(c));
    }, D);
    await page.waitForTimeout(600);

    /* ---- 1 the Obligations page as drawn ---- */
    await page.evaluate(() => setView('obligations'));
    await until(() => document.querySelectorAll('.obw-wk').length >= 4 && !!document.querySelector('#ins-panel [data-jl-word]'), null, 12000);
    await page.mouse.move(2, 400);
    const P = await page.evaluate(() => {
      const card = k => document.querySelector(`.obw-wk[data-obw-card="${k}"]`);
      const sub = k => { const c = card(k); return c ? ((c.querySelector('.ob-wk-rng') || {}).textContent || '') + ' | ' + ((c.querySelector('.ob-wk-said') || {}).textContent || '') + ' | ' + ((c.querySelector('.ins-g-r') || {}).textContent || '') + ' | ' + ((c.querySelector('.obw-priv') || {}).textContent || '') : null; };
      const row = k => document.querySelector(`tr[data-ob-key="${k}"]`);
      const act = k => { const r = row(k); const b = r && r.querySelector('[data-obw-act]'); return b ? b.textContent.trim() : ''; };
      const line = k => { const r = row(k); return r ? (r.querySelector('td:nth-child(2) .ins-c2 > span') || {}).textContent || '' : ''; };
      const finds = document.querySelector('tr.obw-finds');
      return { head: (document.getElementById('page-head-facts') || {}).textContent || '',
        acts: [...document.querySelectorAll('#page-head-acts button')].map(b => b.textContent.trim()),
        cards: [...document.querySelectorAll('.obw-wk')].map(c => c.getAttribute('data-obw-card')),
        late: sub('overdue'), w0: sub('w0'), w1: sub('w1'), w2: sub('w2'), later: sub('later'),
        actLate: act('MK-A1::o1'), actTheirs: act('MK-A2::o4'), actChased: act('MK-A2::o5'), lineChased: line('MK-A2::o5'),
        actDec: act('MK-C1::~renewal'), lineDec: line('MK-C1::~renewal'), actColleague: act('MK-A1::o2'), lineColleague: line('MK-A1::o2'),
        finds: finds ? { t: finds.textContent.replace(/\s+/g, ' ').trim(), face: !!finds.querySelector('.obw-av.is-jambo img'), card: finds.closest('.obw-wk').getAttribute('data-obw-card') } : null };
    });
    check('1a the head: "N outstanding · 1 overdue", Open every week, Filter, + Add an obligation',
      /^\d+ outstanding · 1 overdue$/.test(P.head.trim()) && JSON.stringify(P.acts) === JSON.stringify(['Open every week', 'Filter', 'Add an obligation']), { head: P.head, acts: P.acts });
    check('1b each week a card of its own, in order', JSON.stringify(P.cards.slice(0, 3)) === JSON.stringify(['overdue', 'w0', 'w1']) && P.cards.includes('later'), P.cards);
    check('1c each card says what it holds', /work somebody could do now/.test(P.late) && /both theirs/.test(P.w0) && /nothing to pay/.test(P.w0)
      && /a renewal decision/.test(P.w1) && /Pay the storage fee/.test(P.w2) && /Private/.test(P.w2) && /we pay/.test(P.w2) && /nobody owns it yet/.test(P.later),
      { late: P.late, w0: P.w0, w1: P.w1, w2: P.w2, later: P.later });
    check('1d each row\'s one act: Mark done (ours), Chase / Chase again (theirs), Decide (a renewal decision), none on a colleague\'s',
      P.actLate === 'Mark done' && P.actTheirs === 'Chase' && P.actChased === 'Chase again' && /chased/.test(P.lineChased)
      && P.actDec === 'Decide' && /notice deadline/.test(P.lineDec) && P.actColleague === '' && /Unrestricted Legal/.test(P.lineColleague), P);
    check('1e Jambo\'s finds: one row on this week\'s line, his face, "none is added until you say", Review 3',
      !!P.finds && P.finds.card === 'w0' && P.finds.face && /Jambo found 3 obligations in/.test(P.finds.t) && /none is added until you say/.test(P.finds.t) && /Review 3/.test(P.finds.t), P.finds);
    if (OUT) await page.screenshot({ path: path.join(OUT, '16-obligations-1440x780.png') });

    /* ---- 2 Your week ---- */
    const Y = await page.evaluate(() => { const p = document.getElementById('ins-panel');
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent || '', bubs: [...p.querySelectorAll('.jl-bub')].map(b => b.textContent.trim()),
        src: (p.querySelector('.jl-src') || {}).textContent || '', chips: [...p.querySelectorAll('.jl-chip')].map(c => c.textContent.trim()),
        lv: [...p.querySelectorAll('[data-cal-lv]')].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')),
        ph: (p.querySelector('#jl-q') || {}).placeholder || '', hint: (p.querySelector('.jb-hint') || {}).textContent || '', sel: document.querySelectorAll('.obw-wk tr.is-sel').length }; });
    check('2a nothing chosen: Jambo says "Your week", counted from the list, no call',
      Y.word === 'Your week' && Y.sel === 0 && /^This week: 1 late \(yours\), 2 due from the other side, and Jambo’s 3 finds to review\. Next week holds the renewal decision on Office Lease\.$/.test(Y.bubs[0] || '')
      && Y.src === 'Counted from your list · no Jambo call', Y);
    check('2b his offer, the planner\'s two asks as chips, the setting as three buttons, the box and the hint',
      /Want me to plan the week\?/.test(Y.bubs[1] || '') && JSON.stringify(Y.chips) === JSON.stringify(['plan my week · 1 Jambo call', 'find time for what is due · 1 call'])
      && JSON.stringify(Y.lv) === JSON.stringify(['On his own', 'Ask me first*', 'Never']) && Y.ph === 'Ask for a number, a list or a contract…' && /Typing never signs/.test(Y.hint), Y);
    await page.click('[data-cal-lv="never"]');
    const nv = await until(async () => { if (minePref().copilotLevel !== 'never') return null;
      const r = await api('me/items'); const p = (r.items || []).find(x => x.kind === 'pref');
      const off = (document.querySelectorAll('#ins-panel .jl-bub')[1] || {}).textContent || '';
      return p && p.copilotLevel === 'never' && /You chose Never/.test(off) ? { stored: p.copilotLevel, off } : null; });
    check('2c Never is kept on the server and changes his offer', !!nv, nv);
    await page.click('[data-cal-lv="ask"]');
    await until(() => minePref().copilotLevel === 'ask');

    /* ---- 3 every act ends in its door ---- */
    await page.click('tr[data-ob-key="MK-A2::o4"] [data-obw-act="chase"]');
    const ask = await until(() => { const m = document.querySelector('.modal-in'); return m && /Chase them for this\?/.test(m.textContent) ? true : null; });
    check('3a Chase asks first (the chase route\'s own question)', !!ask);
    /* Cancel: nothing is sent */
    await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-in button')].find(x => /^Cancel$/.test(x.textContent.trim())); if (b) b.click(); });
    await until(() => !document.querySelector('.modal-in'));
    await page.click('tr.obw-finds [data-obw-act="review"]');
    const desk = await until(() => { const m = document.querySelector('.modal-in'); return m && /Proposed obligations/.test(m.textContent) ? true : null; });
    check('3b Review opens the review desk', !!desk);
    await page.keyboard.press('Escape'); await page.evaluate(() => { if (document.querySelector('.modal-in')) closeModal(); });
    await until(() => !document.querySelector('.modal-in'));
    await page.click('tr[data-ob-key="MK-A2::o6"] td:nth-child(2)');
    const chosen = await until(() => { const w = (document.querySelector('#ins-panel [data-jl-word]') || {}).textContent; const b = document.querySelector('#ins-panel [data-jl-back]');
      return w === 'Obligation' && b && !b.hidden ? w : null; });
    await page.click('#ins-panel [data-jl-back]');
    const back = await until(() => (document.querySelector('#ins-panel [data-jl-word]') || {}).textContent === 'Your week' && !document.querySelector('.obw-wk tr.is-sel'));
    check('3c a row press: the panel says "Obligation"; ‹ Jambo goes back to the week', !!chosen && !!back, { chosen, back });
    await page.click('[data-obw-add]');
    await until(() => !!document.querySelector('#obw-pick-q'));
    await page.fill('#obw-pick-q', 'milk');
    const shown = await page.evaluate(() => [...document.querySelectorAll('[data-obw-pick]')].filter(b => !b.hidden).map(b => b.getAttribute('data-obw-pick')));
    await page.click('[data-obw-pick="MK-A2"]');
    const form = await until(() => { const m = document.querySelector('.modal-in'); return m && /Add obligation/.test(m.textContent) && /Raw Milk Collection/.test(m.textContent) ? true : null; });
    check('3d + Add an obligation asks which contract, then opens that contract\'s own form', JSON.stringify(shown) === '["MK-A2"]' && !!form, { shown, form });
    await page.evaluate(() => closeModal());
    await until(() => !document.querySelector('.modal-in'));
    await page.click('tr[data-ob-key="MK-C1::~renewal"] [data-obw-act="decide"]');
    const dec = await until(() => { const h = document.querySelector('#renewal-host'); return h && state.view === 'dashboard' && (h.classList.contains('is-landed') || h.classList.contains('is-landed-held')) ? true : null; }, null, 12000);
    check('3e Decide lands on the renewal card, lit', !!dec);
    await page.evaluate(() => setView('obligations'));
    await until(() => !!document.querySelector('#ins-panel .jl-chip'));
    await page.click('#ins-panel .jl-chip >> nth=0');
    const cal = await until(() => calOnScreen() && document.querySelector('#cal-plan') ? true : null, null, 12000);
    check('3f "plan my week" opens the Calendar, whose planner takes the ask', !!cal);
    const plan = await until(() => { const p = [...document.querySelectorAll('#cal-plan [data-cal-prop]')];
      return p.length && !document.querySelector('#cal-plan .cal-plan-busy') ? { props: p.length, add: document.querySelectorAll('#cal-plan [data-cal-plan-add]').length,
        mine: (typeof mineList === 'function' ? mineList('event') : []).length } : null; }, null, 15000);
    check('3g Ask me first: his plan waits as proposals with Add, nothing added to the calendar', !!plan && plan.props === ahead.length && plan.add === ahead.length && plan.mine === 0, plan);

    /* ---- 4 the Calendar as drawn ---- */
    await until(() => !!document.querySelector('#cal-wk-more'), null, 10000);
    await page.waitForTimeout(500);
    const C = await page.evaluate(() => {
      const chips = [...document.querySelectorAll('#cal-week .cal-chip')].map(c => ({ t: c.textContent.trim(), k: (c.className.match(/is-ck-(\w+)/) || [])[1] || '' }));
      /* LATE WORK STANDS ON TODAY (on a weekend, this week's Monday): the
         column under the head marked today, else the first — reading only
         the first made this check red Tuesday to Friday */
      const heads = [...document.querySelectorAll('.cal-wk-h')], at = heads.findIndex(x => x.classList.contains('is-today'));
      const first = document.querySelectorAll('.cal-wk-alls .cal-wk-all')[at > 0 ? at : 0];
      return { facts: (document.getElementById('cal-head-sub') || {}).textContent || '', more: !!document.querySelector('.cal-head #cal-more'),
        title: (document.getElementById('cal-title') || {}).textContent || '', key: [...document.querySelectorAll('.cal-key span')].map(s => s.textContent.trim()),
        firstDay: first ? [...first.querySelectorAll('.cal-chip')].map(c => c.textContent.trim()) : [], chips,
        labels: [...document.querySelectorAll('#cal-wk-more .cal-wkm-lab span')].map(s => s.textContent.trim()),
        hours: [...document.querySelectorAll('.cal-wk-t')].map(t => t.textContent.trim()).slice(0, 3),
        panel: (document.querySelector('#cal-plan .jl-word') || {}).textContent || '', bub: (document.querySelector('#cal-plan .jl-bub') || {}).textContent || '',
        lv: document.querySelectorAll('#cal-plan [data-cal-lv]').length };
    });
    check('4a the head: the six weeks, the ⋯ in it; the card: "This week, then five more" and the key as drawn',
      /· six weeks$/.test(C.facts) && C.more && C.title === 'This week, then five more' && JSON.stringify(C.key) === JSON.stringify(['Ours', 'Theirs', 'Contract date', 'Mine', 'Jambo’s plan']), C);
    check('4b late work stands on today (a weekend: this week\'s first day); their chips carry their name first; a decision in its week',
      C.firstDay.some(t => /^Late: Check the September invoice/.test(t)) && C.chips.some(c => c.k === 'theirs' && /^Nandi: /.test(c.t)) && C.chips.some(c => c.k === 'decide' && /^Decide: Office Lease/.test(c.t)), { firstDay: C.firstDay, chips: C.chips.slice(0, 8) });
    check('4c a later week says "N due"; the hours read "09"', C.labels.some(l => /^\d+ due$/.test(l)) && C.hours.every(h => /^\d\d$/.test(h)), { labels: C.labels, hours: C.hours });
    check('4d Jambo\'s panel beside the Calendar says "Your week" in the same words', C.panel === 'Your week' && C.bub === Y.bubs[0] && C.lv === 3, { panel: C.panel, lv: C.lv });
    const slot = await page.$('#cal-wk-body .cal-wk-col:nth-of-type(3) .cal-wk-slot:nth-child(4)');
    if (slot) await slot.hover();
    const hint = slot ? await slot.evaluate(s => getComputedStyle(s, '::after').content) : '';
    check('4e an empty hour says "+ Add your own" under the hand', /\+ Add your own/.test(hint), hint);
    if (OUT) await page.screenshot({ path: path.join(OUT, '16-calendar-1440x780.png') });

    /* ---- 6 the checks' differences, built (lane A4's second pass, 19 Oct 2026) ---- */
    await page.evaluate(async D => { const A1 = getContract('MK-A1');
      A1.obligations.push({ id: 'o9', desc: 'Pay the second instalment', due: D.a13, party: 'us', assignee: currentUser().email, recurring: 'none', status: 'open', after: 'o3' });
      persist(A1); }, D);
    await page.waitForTimeout(400);
    const wt = await until(() => { if (!calOnScreen()) return null;
      const c = [...document.querySelectorAll('#cal-stage .cal-chip')].find(x => /Pay the second instalment/.test(x.textContent));
      return c ? { t: c.textContent.trim(), k: (c.className.match(/is-ck-(\w+)/) || [])[1] || '' } : null; }, null, 8000);
    check('6a the Calendar draws a step held back by an earlier one as "Waiting: …", never due or late', !!wt && wt.k === 'wait' && /^Waiting: /.test(wt.t), wt);
    const decChip = await page.$('#cal-stage .cal-chip.is-ck-decide');
    if (decChip) await decChip.click();
    const decC = await until(() => { const h = document.querySelector('#renewal-host'); return h && state.view === 'dashboard' && (h.classList.contains('is-landed') || h.classList.contains('is-landed-held')) ? true : null; }, null, 12000);
    check('6b the Calendar\'s Decide chip lands on the renewal card, lit (the list\'s own door)', !!decC);
    await page.evaluate(() => setView('obligations'));
    await until(() => document.querySelectorAll('.obw-wk').length >= 4);
    const O6 = await page.evaluate(() => ({ outstanding: !!document.querySelector('.obw-ins tr[data-ob-key="MK-A1::o9"]'),
      wait: ((document.querySelector('[data-obw-view="waiting"]') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      lateInk: (() => { const sp = document.querySelector('tr.obw-late-row .obw-late-when > span'); return sp ? [getComputedStyle(sp).color, getComputedStyle(document.documentElement).getPropertyValue('--st-ruby-fg').trim()] : null; })() }));
    const rgb = hx => { const m = /^#([0-9a-f]{6})$/i.exec(hx || ''); if (!m) return hx; const n = parseInt(m[1], 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
    check('6c Outstanding leaves the waiting step out; it is on Waiting on a step', !O6.outstanding && /Waiting on a step\s*1/.test(O6.wait), O6);
    check('6d Late\'s "3 days late" wears the late ink, on the right of its row', !!O6.lateInk && O6.lateInk[0] === rgb(O6.lateInk[1]), O6.lateInk);
    await page.click('.obw-wk[data-obw-card="w2"] .ob-wk-said');
    const w2open = await until(() => document.querySelector('.obw-wk[data-obw-card="w2"]:not(.is-shut)') ? true : null);
    await page.click('tr[data-ob-key="MK-A2::o6"] td:nth-child(2)');
    await until(() => (document.querySelector('#ins-panel [data-jl-word]') || {}).textContent === 'Obligation');
    await page.reload({ waitUntil: 'networkidle' });
    const kept = await until(() => { if (state.view !== 'obligations' || !document.querySelector('.obw-wk')) return null;
      return { w2: !!document.querySelector('.obw-wk[data-obw-card="w2"]:not(.is-shut)'), word: (document.querySelector('#ins-panel [data-jl-word]') || {}).textContent || '',
        sel: !!document.querySelector('tr[data-ob-key="MK-A2::o6"].is-sel') }; }, null, 20000);
    check('6e a folded week opens on a press on its line; a refresh keeps it open and the chosen row chosen', !!w2open && !!kept && kept.w2 && kept.word === 'Obligation' && kept.sel, { w2open, kept });

    /* ---- 5 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await page.evaluate(() => setView('obligations'));
      await until(() => document.querySelectorAll('.obw-wk').length >= 4);
      await page.waitForTimeout(400);
      const fitO = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, side = document.documentElement.scrollWidth <= vw + 1;
        const panel = document.getElementById('ins-panel').getBoundingClientRect();
        const cards = [...document.querySelectorAll('.obw-wk')].map(c => c.getBoundingClientRect());
        const under = cards.some(r => r.right > panel.left + 1);
        const acts = [...document.querySelectorAll('#page-head-acts button')].every(b => { const r = b.getBoundingClientRect(); return r.right <= panel.left + 1 && r.width > 0; });
        const box = document.querySelector('#ins-panel #jl-q').getBoundingClientRect();
        return { side, under, acts, box: box.bottom <= window.innerHeight && box.top > 0 };
      });
      check(`5 ${w}×${ht}: Obligations whole — nothing sideways, no card under the panel, the head's acts and Jambo's box in view`,
        fitO.side && !fitO.under && fitO.acts && fitO.box, fitO);
      if (OUT) await page.screenshot({ path: path.join(OUT, `16-obligations-${w}x${ht}.png`) });
      await page.evaluate(() => setView('calendar'));
      await until(() => !!document.querySelector('#cal-wk-more'));
      await page.waitForTimeout(400);
      const fitC = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth, side = document.documentElement.scrollWidth <= vw + 1;
        const stage = document.getElementById('cal-stage').getBoundingClientRect();
        const rows = [...document.querySelectorAll('#cal-wk-more .cal-wkm-row')];
        const whole = rows.length === 5 && rows.every(r => r.getBoundingClientRect().bottom <= window.innerHeight + 1);
        const head = [...document.querySelectorAll('.cal-head-r > *')].every(b => b.getBoundingClientRect().right <= stage.right + 1);
        const key = document.querySelector('.cal-key').getBoundingClientRect();
        const box = document.querySelector('#cal-plan-in').getBoundingClientRect();
        return { side, whole, head, key: key.right <= stage.right + 1, box: box.bottom <= window.innerHeight && box.top > 0 };
      });
      check(`5 ${w}×${ht}: the Calendar whole — six weeks in view, the head and the key not cut, Jambo's box in view, nothing sideways`,
        fitC.side && fitC.whole && fitC.head && fitC.key && fitC.box, fitC);
      if (OUT) await page.screenshot({ path: path.join(OUT, `16-calendar-${w}x${ht}.png`) });
    }
  } catch (e) {
    check('the stage ran to the end', false, e.message.split('\n')[0]);
  } finally {
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop(); await ai.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
