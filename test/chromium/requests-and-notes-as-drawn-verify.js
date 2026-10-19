/* REQUESTS AND MY NOTES, AS DRAWN (round 20 of the redesign, owner picked
   "The SAP way" by name, 17 Oct 2026; every drawn part built on the owner's
   yes of 18 Oct 2026; js/views/intake.js, js/views/mynotes.js)

   WHAT THIS PINS, driven in a real browser through the real routes (four
   requests from three colleagues, one sent to the reader by the NDA lane with
   a file; five private notes)
     1 Requests' band: the tabs and, beside them on ONE row, Request · Stream ·
       With, each label before its box; the head "4 open · what colleagues ask
       Legal for · advice too"; the Open list oldest waiting first, its card
       ending after the rows with "4 of 4 open" under them
     2 the request in Jambo's panel: Routine and "With you · by the NDA lane",
       Start the draft · Promise a day · Hand back on one line (⋯ at the pills'
       end), her words quoted, the rows, "Attachments 1 of 3", Jambo naming the
       paper that fits
     3 Start the draft opens the New agreement form with THAT paper chosen and
       lit — no model route asked
     4 the counterparty's name lands on their contracts on the Contracts place
     5 a finger on the Stream box opens HaTi's one list, never the iPad's
     6 My notes: the band, the tabs and boxes, the table, the note in Jambo's
       panel ("Note") with its three verbs on one line, Delete note; ‹ Jambo
       says the ledger; the chip lands on a row
     7 the owner's three screens (1440×780, 1536×730, 1366×950): nothing
       sideways, the band on one row, the panel's verbs whole, no head cut
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/requests-and-notes-as-drawn-verify.js
   Photos: HATI_SHOT_DIR=<dir> */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
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
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    /* ---- the stage, through the real routes ---- */
    const admin = W.admin;
    const me = (await admin.json('/api/bootstrap')).me;
    const mk = async (name, email) => {
      await admin.json('/api/users', { method: 'POST', body: { name, email, role: 'viewer', password: 'temporary-pass-1' } });
      const c = h.client(email);
      await c.json('/api/login', { method: 'POST', body: { email, password: 'temporary-pass-1' } });
      await c.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
      return c;
    };
    const wan = await mk('Wanjiru Kamau', 'wanjiru@example.co.ke');
    const ach = await mk('Achieng Odhiambo', 'achieng@example.co.ke');
    const bri = await mk('Brian Ochieng', 'brian@example.co.ke');
    const pdf = n => ({ name: n, mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,' + Buffer.alloc(240000, 1).toString('base64') });
    const ask = async (c, body) => (await c.json('/api/intake', { method: 'POST', body })).request;
    const r1 = await ask(wan, { title: 'Mutual NDA with Naivas Supermarkets', need: 'Naivas want to start a two-month pilot in November and will share their shelf data with us. They asked for a mutual NDA first. Can we use our standard one?', counterparty: 'Naivas Supermarkets', folder: 'sales', files: [pdf('pilot-brief.pdf')] });
    const r2 = await ask(ach, { title: 'Reseller agreement for Uganda', need: 'A reseller in Kampala wants to carry our range; they expect about KES 2,000,000 a year.', folder: 'sales' });
    const r3 = await ask(bri, { title: 'Event venue booking, March kick-off', need: 'The hotel sent their own contract for the venue. Please read it before we sign.', folder: 'proc', files: [pdf('venue-contract.pdf'), pdf('floor-plan.pdf')] });
    const r4 = await ask(bri, { title: 'Transport for the milk routes', need: 'We need a haulage agreement for the three milk routes from Nandi.', counterparty: 'Nandi Dairy', folder: 'proc' });
    await admin.json('/api/intake/' + r1.id, { method: 'PATCH', body: { status: 'open', assignee: me.id, lane: 'NDA' } });
    await admin.json('/api/intake/' + r4.id, { method: 'PATCH', body: { status: 'open', assignee: W.users.unrestricted.id } });
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const ago = d => new Date(Date.now() - d * 86400000).toISOString();
    [[r1, 1], [r4, 3], [r2, 4], [r3, 5]].forEach(([r, d]) => db.prepare('UPDATE intake_requests SET created_at=? WHERE id=?').run(ago(d), r.id));
    db.close();
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const aiCalls = [];
    /* a model is asked by a POST to an /api/ai/ route; reading the usage is not one */
    page.on('request', rq => { if (rq.method() === 'POST' && /\/api\/ai\//.test(rq.url())) aiCalls.push(rq.url()); });
    /* a press on something that may be missing reports instead of timing out */
    const press = async sel => { const el = await page.$(sel); if (!el) return false; await el.click({ timeout: 3000 }).catch(() => {}); return true; };
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const today = await page.evaluate(() => todayISO());
    const day = n => { const d = new Date(today + 'T12:00:00'); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    const note = item => admin.json('/api/me/items', { method: 'POST', body: { kind: 'note', item } });
    await note({ title: 'Delivery window moved', body: 'A week.', contractId: 'MK-B1', reviewBy: day(-5), reviewedAt: ago(5) });
    await note({ title: 'Their counsel prefers Ugandan law', body: 'We hold Kenya.', contractId: 'MK-B2' });
    await note({ title: 'Is the Kabras price index right', body: 'Clause 4.', contractId: 'MK-A1', reviewBy: day(3) });
    await note({ title: 'The NDA must cover shelf data', body: 'Shelf data too.', reviewBy: day(1) });
    await note({ title: "Check Nandi Dairy's insurance broker", body: 'Check the broker before we accept a higher cap in clause 7.', contractId: 'MK-A2', reviewBy: day(0) });

    /* ---- 1 · REQUESTS: the band, the head, the list ---- */
    await page.evaluate(() => setView('intake'));
    const listed = await until(() => document.querySelectorAll('.ik-lt [data-ik-row]').length === 4 ? true : null, null, 10000);
    check('1 the four requests are listed', !!listed);
    const B = await page.evaluate(() => {
      const tabs = document.querySelector('.ik-tabbar .rq-kinds'), fb = document.querySelector('.ik-tabbar .ik-fb');
      const box = el => el && el.getBoundingClientRect();
      const pairs = [...(fb ? fb.querySelectorAll('.ik-fb-find, .reg-chip') : [])].map(l => { const lab = l.querySelector('.ik-fb-l, .reg-f-l'), val = l.querySelector('.ik-search, .reg-f-v');
        return { label: lab ? lab.textContent.trim() : '', before: !!(lab && val && box(lab).right <= box(val).left + 1), framed: !!(val && getComputedStyle(val).borderTopStyle !== 'none' && parseFloat(getComputedStyle(val).borderTopWidth) > 0) }; });
      const facts = document.getElementById('page-head-facts');
      const card = document.querySelector('.ik-ins .ins-card'), foot = document.querySelector('[data-ik-foot]');
      const rows = [...document.querySelectorAll('.ik-lt [data-ik-row]')];
      return { oneRow: !!(tabs && fb) && Math.abs(box(tabs).top - box(fb).top) < 24, pairs,
        head: facts ? [...facts.children].map(e => e.textContent.trim()) : null,
        order: rows.map(r => r.querySelector('.ins-c2 b').textContent),
        cardNote: (document.querySelector('.ins-cardhead-t') || {}).textContent,
        foot: foot ? foot.textContent.trim() : '', footUnder: !!(foot && rows.length && box(foot).top - box(rows[rows.length - 1]).bottom < 4),
        cardEnds: !!card && box(card).bottom < innerHeight - 60 };
    });
    check('1a the tabs and the boxes on one row; Request · Stream · With, each label before its framed box', B.oneRow
      && JSON.stringify(B.pairs.map(p => p.label)) === '["Request","Stream","With"]' && B.pairs.every(p => p.before && p.framed), JSON.stringify(B.pairs));
    check('1b the head: "4 open · what colleagues ask Legal for · advice too"', JSON.stringify(B.head) === '["4 open","what colleagues ask Legal for · advice too"]', JSON.stringify(B.head));
    check('1c oldest waiting first, as the list\'s head says', B.order[0] === 'Event venue booking, March kick-off' && B.order[3] === 'Mutual NDA with Naivas Supermarkets'
      && /oldest waiting first/.test(B.cardNote), JSON.stringify({ order: B.order, note: B.cardNote }));
    check('1d the card ends after its rows, "4 of 4 open" right under them', B.foot === '4 of 4 open' && B.footUnder && B.cardEnds, JSON.stringify({ foot: B.foot, under: B.footUnder, ends: B.cardEnds }));

    /* ---- 2 · the request in Jambo's panel ---- */
    await press(`.ik-lt [data-ik-row="${r1.id}"]`);
    const P = await until(id => { const p = document.querySelector('#ins-panel.is-jambo'); if (!p || p.getAttribute('data-ins-id') !== id) return null;
      const verbs = [...p.querySelectorAll('.ins-h .ins-acts [data-ins-act]')];
      const tops = new Set(verbs.map(b => Math.round(b.getBoundingClientRect().top)));
      const pr = p.getBoundingClientRect();
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent, eb: (p.querySelector('.ins-eb') || {}).textContent,
        pills: [...p.querySelectorAll('.jl-pills .ik-road, .jl-pills .ik-with-chip')].map(e => e.textContent.trim()), more: !!p.querySelector('.jl-pills [data-ins-more]'),
        verbs: verbs.map(b => b.textContent.trim()), oneLine: tops.size === 1, inside: verbs.every(b => b.getBoundingClientRect().right <= pr.right + 1),
        quote: (p.querySelector('.ik-ask-q') || {}).textContent, rows: [...p.querySelectorAll('.ik-rows dt')].map(e => e.textContent.trim()),
        cp: (p.querySelector('[data-ins-fact="cp"] dd') || {}).textContent, files: (p.querySelector('.ik-files h3') || {}).textContent,
        file: (p.querySelector('.ik-file-b span') || {}).textContent, fit: (p.querySelector('.ik-fit .jl-bub b') || {}).textContent };
    }, r1.id);
    check('2a "Request" in his head; the reference line, Routine and "With you · by the NDA lane"; the ⋯ at the pills\' end', !!P && P.word === 'Request'
      && /from Wanjiru Kamau · Sales/.test(P.eb) && JSON.stringify(P.pills) === '["Routine","With you · by the NDA lane"]' && P.more, P && JSON.stringify({ eb: P.eb, pills: P.pills, more: P.more }));
    check('2b Start the draft · Promise a day · Hand back on one line, whole', !!P && JSON.stringify(P.verbs) === '["Start the draft","Promise a day","Hand back"]' && P.oneLine && P.inside, P && JSON.stringify(P.verbs));
    check('2c her words quoted, the rows, "no NDA with them today", Attachments 1 of 3 with who added it', !!P && /^“Naivas want/.test(P.quote)
      && JSON.stringify(P.rows) === '["Counterparty","Stream","How it is handled","With","Asked"]' && /no NDA with them today/.test(P.cp)
      && /1 of 3/.test(P.files) && /added by Wanjiru/.test(P.file), P && JSON.stringify({ rows: P.rows, cp: P.cp, files: P.files, file: P.file }));
    check('2d Jambo names the paper that fits, read without a call', !!P && /Non-Disclosure/.test(P.fit || '') && aiCalls.length === 0, JSON.stringify({ fit: P && P.fit, ai: aiCalls }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '20-requests-1440x780.png') });

    /* ---- 3 · Start the draft ---- */
    await press('#ins-panel [data-ins-act="draft"]');
    const S = await until(() => { const on = document.querySelector('#na-root .na-pick.on'); return on ? { name: on.textContent.trim(), lit: on.classList.contains('is-landed') || on.classList.contains('is-landed-held') } : null; });
    check('3 Start the draft opens the New agreement form with that paper chosen and lit — no model asked', !!S && /NDA/.test(S.name) && S.lit && aiCalls.length === 0, JSON.stringify({ S, ai: aiCalls }));
    if (OUT && S) { await page.waitForTimeout(900); await page.screenshot({ path: path.join(OUT, '20-requests-start-the-draft-1440x780.png') }); }
    /* the form is the page in front: Jambo's panel at the edge does not sit over it */
    const O = await page.evaluate(() => { const on = document.querySelector('#na-root .na-pick.on'); const p = document.getElementById('ins-panel');
      const cr = document.querySelector('#na-create'); const at = el => { if (!el) return null; const r = el.getBoundingClientRect(); const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!(top && (el === top || el.contains(top))); };
      return { pick: at(on), create: at(cr), panelHidden: !p || !p.getClientRects().length || !at(p) }; });
    check('3b the form stands in front: its chosen paper and Create are painted, not under Jambo\'s panel', O.pick && O.create !== false, JSON.stringify(O));
    await page.keyboard.press('Escape').catch(() => {});
    await until(() => !document.getElementById('na-root'), null, 4000);
    await page.evaluate(() => { if (document.getElementById('na-root')) { const b = document.querySelector('#modal-root [data-dlg-cancel], #na-cancel'); if (b) b.click(); } });
    await until(() => !document.getElementById('na-root'), null, 4000);

    /* ---- 4 · the counterparty's door ---- */
    await page.evaluate(() => setView('intake'));
    await until(id => document.querySelector('#ins-panel.is-jambo') && document.querySelector('#ins-panel').getAttribute('data-ins-id') === id ? true : null, r1.id);
    await press('#ins-panel [data-ik-cp]');
    const C = await until(() => { const el = document.querySelector('.is-landed, .is-landed-held'); return el && /Naivas/.test(document.body.innerText) && (state.view !== 'intake') ? { view: state.view, lit: el.className } : null; });
    check('4 the counterparty\'s name lands on their contracts', !!C, JSON.stringify(C));

    /* ---- 5 · a finger on the Stream box ---- */
    await page.evaluate(() => setView('intake'));
    await until(() => document.querySelector('.ik-fb select[data-ik-f="folder"]') ? true : null);
    const T = await page.evaluate(async () => {
      const sel = document.querySelector('.ik-fb select[data-ik-f="folder"]');
      if (!sel) return { menus: 0, missing: true };
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      const r = sel.getBoundingClientRect();
      sel.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerType: 'touch', clientX: r.x + 5, clientY: r.y + 5 }));
      await new Promise(z => setTimeout(z, 200));
      const menus = document.querySelectorAll('.hati-selmenu').length;
      const a = document.activeElement;
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return { menus, focusedSelect: !!(a && a.tagName === 'SELECT') };
    });
    check('5 a finger on the Stream box opens HaTi\'s one list, the box not focused', T.menus === 1 && !T.focusedSelect, JSON.stringify(T));

    /* ---- 6 · MY NOTES ---- */
    await page.evaluate(() => mineLoad(true).then(() => setView('mynotes')));
    const N = await until(() => { const p = document.querySelector('#ins-panel.is-jambo'); const rows = document.querySelectorAll('.mn-t [data-mn-row]');
      if (!p || rows.length !== 5) return null;
      const verbs = [...p.querySelectorAll('.ins-h .ins-acts [data-ins-act]')]; const tops = new Set(verbs.map(b => Math.round(b.getBoundingClientRect().top)));
      return { word: (p.querySelector('[data-jl-word]') || {}).textContent, title: (document.querySelector('.mn-t1') || {}).textContent, n: (document.querySelector('.mn-hn') || {}).textContent,
        tabs: [...document.querySelectorAll('[data-mn-tab]')].map(b => b.firstChild.textContent + (b.querySelector('.n') && !b.querySelector('.n').hidden ? ' ' + b.querySelector('.n').textContent : '')),
        boxes: [...document.querySelectorAll('.mn-band .ik-fb .ik-fb-l, .mn-band .ik-fb .reg-f-l')].map(e => e.textContent.trim()),
        pills: [...document.querySelectorAll('.mn-t [data-mn-row] .mn-pill')].map(e => e.textContent.trim()),
        verbs: verbs.map(b => b.textContent.trim()), oneLine: tops.size === 1, del: !!p.querySelector('[data-mn-act="delete"]'),
        review: (p.querySelector('[data-ins-fact="review"] dd') || {}).textContent };
    }, null, 10000);
    check('6a My notes: the band, the tabs, Note · Contract, the review pills as drawn', !!N && N.title === 'My notes' && N.n === '5'
      && JSON.stringify(N.tabs) === '["All 5","Due today 1","Later 2","Reviewed 1"]' && JSON.stringify(N.boxes) === '["Note","Contract"]'
      && N.pills[0] === 'Review today' && /^Review \S+ \d/.test(N.pills[1]) && N.pills[3] === 'No review day' && /^Reviewed/.test(N.pills[4]), N && JSON.stringify({ tabs: N.tabs, boxes: N.boxes, pills: N.pills }));
    check('6b the note in Jambo\'s panel ("Note"): three verbs on one line, Review "Today, … · in your bell", Delete note', !!N && N.word === 'Note'
      && /^Mark reviewed,Snooze a week,Open MK-A2$/.test(N.verbs.join(',')) && N.oneLine && /^Today, .* · in your bell$/.test(N.review) && N.del, N && JSON.stringify({ verbs: N.verbs, review: N.review }));
    if (OUT) await page.screenshot({ path: path.join(OUT, '20-mynotes-1440x780.png') });
    await press('#ins-panel [data-jl-back]');
    const J = await until(() => { const b = document.querySelector('#ins-panel .jl-bub'); return b ? { say: b.textContent.trim(), chips: [...document.querySelectorAll('#ins-panel .jl-chip')].map(c => c.textContent.trim()) } : null; });
    check('6c ‹ Jambo: the ledger in his words, counted, with its two doors', !!J && /^You have 5 notes, private to you\. 1 is due today\. 2 come up later\./.test(J.say)
      && JSON.stringify(J.chips) === '["the ones due today","new note"]', JSON.stringify(J));
    await press('#ins-panel .jl-chip');
    const L = await until(() => { const el = document.querySelector('.mn-t [data-mn-row].is-landed, .mn-t [data-mn-row].is-landed-held'); const on = document.querySelector('[data-mn-tab].on');
      return el && on ? { lit: el.getAttribute('data-mn-row'), tab: on.getAttribute('data-mn-tab'), rows: document.querySelectorAll('.mn-t [data-mn-row]').length } : null; });
    check('6d "the ones due today" turns the tab and lands on its row', !!L && L.tab === 'today' && L.rows === 1, JSON.stringify(L));
    await page.evaluate(() => { const t = document.querySelector('[data-mn-tab="all"]'); if (t) t.click(); });

    /* ---- 7 · the owner's three screens ---- */
    for (const [view, sel] of [['intake', '.ik-lt'], ['mynotes', '.mn-t']]) {
      await page.evaluate(v => setView(v), view);
      await until(s => document.querySelector(s) ? true : null, sel);
      if (view === 'intake') await press(`.ik-lt [data-ik-row="${r1.id}"]`);
      else await press('.mn-t [data-mn-row]');
      for (const [w, ht] of SCREENS) {
        await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(450);
        const F = await page.evaluate(s => {
          const tabs = document.querySelector('.reg-tabbar .reg-views'), fb = document.querySelector('.reg-tabbar .ik-fb');
          const heads = [...document.querySelectorAll(s + ' thead th')].filter(t => t.scrollWidth > t.clientWidth + 1).map(t => t.textContent.trim());
          const p = document.querySelector('#ins-panel.is-jambo'); const pr = p && p.getBoundingClientRect();
          const verbs = p ? [...p.querySelectorAll('.ins-h .ins-acts [data-ins-act]')] : [];
          const cutVerb = verbs.filter(b => b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > pr.right + 1).map(b => b.textContent.trim());
          const tops = new Set(verbs.map(b => Math.round(b.getBoundingClientRect().top)));
          return { side: document.documentElement.scrollWidth <= innerWidth + 1, oneRow: !!(tabs && fb) && Math.abs(tabs.getBoundingClientRect().top - fb.getBoundingClientRect().top) < 24,
            heads, cutVerb, verbsOneLine: tops.size <= 1, panel: !!p && pr.right <= innerWidth + 1 && pr.bottom <= innerHeight + 1 };
        }, sel);
        check(`7 ${view} ${w}×${ht}: nothing sideways, the band one row, no head cut, the panel's verbs whole on one line`, F.side && F.oneRow && !F.heads.length && !F.cutVerb.length && F.verbsOneLine && F.panel, JSON.stringify(F));
        if (OUT) await page.screenshot({ path: path.join(OUT, `20-${view === 'intake' ? 'requests' : 'mynotes'}-${w}x${ht}.png`) });
      }
      await page.setViewportSize({ width: 1440, height: 780 });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
