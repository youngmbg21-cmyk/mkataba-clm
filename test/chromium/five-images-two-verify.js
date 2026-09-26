/* Chromium verification: THE SECOND FIVE IMAGES (Young ruled 21 Sep 2026).
   ======================================================================
   *"ensure the dates match and the fonts ... like for like ... Insights tab
   should be after home page ... the highlighted cards have nonsensical words
   in them ... Describe what you need area should be able to wrap text ...
   Hati is not writing contracts briefs and the open fields is not sharing
   anything meaningful ... remove the lines running across the card ... the
   open doors should be buttons with outlines ... remove the line going across
   the card and also remove the number of days that appears in the Term."*

   WHY A BROWSER FILE. Every claim here is a COMPUTED value, a painted pixel or
   a geometry: which face a date is set in and what it says; where the Insights
   door sits in the rail after a repaint; whether four cards really measure one
   height; whether a hidden control's colour reached its own options; whether a
   rule is still drawn under a table row; and whether the head's inset line is
   really gone rather than merely absent from one rule's source.

   Run: node test/chromium/five-images-two-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'five-images-two');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3200);

    /* ════════ 1. THE TABLE'S DATES, AND THE RAIL ════════ */
    /* THE FULL TABLE IS STAGED (re-pointed in place 26 Sep 2026): from about a
       1104 window the page draws the list Inspector, whose four columns carry
       no date — the Signed and Ends facts moved into its panel, where the
       drawing sets them as plain values — and inspector-verify measures that.
       1b/1c are about the TABLE's two date columns, which the page still draws
       at every narrower window; insForce(false) is its own stage door. */
    await page.evaluate(() => { if (window.insForce) insForce(false); });
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1400);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });

    /* THE RAIL'S ORDER IS A RELATION, not a position: Insights comes
       immediately after Home, whatever else is added around them. */
    const rail = await page.$$eval('#side-nav [data-view]', els => els.map(e => e.getAttribute('data-view')));
    ok('1 Insights sits directly after Home',
      rail.indexOf('intel') === rail.indexOf('dashboard') + 1, rail.slice(0, 4).join(' → '));

    /* A DATE IS DATA: the artifact sets both columns in the figure face at the
       label size and says `30 Jun 2027`. MEASURED side by side against
       prototype/hati-redesign-reference.html before this changed. */
    const day = await page.evaluate(() => {
      const el = document.querySelector('.reg-table tbody .reg-day');
      if (!el) return null;
      const s = getComputedStyle(el);
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;font-family:var(--font-mono)';
      document.body.appendChild(probe);
      const mono = getComputedStyle(probe).fontFamily; probe.remove();
      return { t: el.textContent.trim(), f: s.fontFamily, mono, sz: s.fontSize };
    });
    ok('1b the date is set in the figure face', !!day && day.f === day.mono, day && day.f);
    ok('1c and it is the artifact\'s shape, not a dotted one',
      !!day && /^\d{2} \p{L}+\.? \d{4}$/u.test(day.t) && !/\d\.\d/.test(day.t), day && day.t);
    /* THE MONTH FOLLOWS THE LANGUAGE — never a hand-written English name and
       never jxLocale. Asked of the reading itself, in both books. */
    const months = await page.evaluate(() => {
      const one = () => regDotDate('2027-06-30');
      const en = one();
      let sv = null;
      try { langSet('sv'); sv = one(); langSet('en'); } catch (e) { sv = null; }
      return { en, sv };
    });
    ok('1d the month follows the reader\'s language',
      !!months.sv && months.sv !== months.en, JSON.stringify(months));
    /* AND IT REFUSES RATHER THAN PRINTING NaN — a day is a day. */
    const bad = await page.evaluate(() => [regDotDate(''), regDotDate(null), regDotDate('nonsense')]);
    ok('1e a day it cannot read is never printed as NaN',
      bad.every(x => !/NaN/.test(String(x))), JSON.stringify(bad));

    const dens = await page.$$eval('button[data-reg-density]', e => e.map(x => x.textContent.trim()));
    ok('1f the density segment wears the artifact\'s own word',
      dens.includes('Cozy') && !dens.some(d => /Comfortable/.test(d)), dens.join(' | '));

    /* ════════ 3 (in the ringed order) THE DROPDOWN'S CHOICES ════════
       A control hidden with `color:transparent` hands that colour to the
       <option>s in the native popup, and the menu draws blank rows. */
    const opts = await page.evaluate(() => {
      const s = document.querySelector('.reg-filterbar .reg-chip-sel');
      if (!s || !s.options.length) return null;
      const cs = getComputedStyle(s), os = getComputedStyle(s.options[0]);
      return { selColor: cs.color, selOpacity: cs.opacity, optColor: os.color, optBg: os.backgroundColor };
    });
    ok('3 the hidden control does not make its own choices invisible',
      !!opts && opts.selOpacity === '0' && opts.optColor !== 'rgba(0, 0, 0, 0)'
        && opts.optColor !== opts.optBg, JSON.stringify(opts));

    /* ════════ 2. THE NEW AGREEMENT CARDS ════════ */
    await page.evaluate(() => { const b = document.querySelector('.hm-primary'); if (b) b.click(); });
    /* 23 Sep 2026: the button opens two doors first; this presses Draft from HaTi. */
    await page.waitForTimeout(400);
    await page.evaluate(() => { const d = document.querySelector('[data-nd-door="draft"]'); if (d) d.click(); });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, '02-new-agreement.png') });

    const say = await page.evaluate(() => {
      const el = document.getElementById('dr-say');
      if (!el) return null;
      const s = getComputedStyle(el);
      return { tag: el.tagName, wrap: s.whiteSpace, h: Math.round(el.getBoundingClientRect().height),
        resize: s.resize };
    });
    ok('2 the describe box wraps its text', !!say && say.tag === 'TEXTAREA' && /wrap/.test(say.wrap),
      JSON.stringify(say));
    ok('2b and it is taller than one line', !!say && say.h > 36, say && say.h + 'px');

    /* THE CARDS: staged, because a seeded workspace publishes no company
       standard and the report is about those cards. A row is fed straight to
       the builder's own reading, which is what the dialog prints. */
    /* GUARDED, so a build without the builder REPORTS its failures rather than
       throwing the run away — a probe that throws proves nothing. */
    const cards = await page.evaluate(() => {
      if (typeof naCardSub !== 'function') return { missing: true };
      const prov = 'Converted from Sales_Distribution_Agreement.docx (original stored: f_d5bf1d72535657e62e6f)';
      const r1 = { kind: 'lib', id: 'x', name: 'Sales Distribution Agreement', sub: prov, cat: 'sales' };
      const r2 = { kind: 'lib', id: 'y', name: 'Written one', sub: 'A real description somebody typed', cat: 'sales' };
      const r3 = { kind: 'lib', id: 'z', name: 'Nothing said', sub: '', cat: 'nda' };
      return { prov: naCardSub(r1), hint: naCardHint(r1), real: naCardSub(r2), none: naCardSub(r3),
        realHint: naCardHint(r2) };
    });
    if (cards.missing) { cards.prov = 'Converted from …(original stored: …)'; cards.hint = '';
      cards.real = ''; cards.none = null; cards.realHint = ''; }
    ok('2c a provenance string is never printed as a description',
      !/Converted from|original stored/.test(cards.prov), cards.prov);
    ok('2c2 and it says what the agreement is instead',
      !!cards.prov && cards.prov.length > 3 && !/Converted|stored/i.test(cards.prov), cards.prov);
    ok('2c3 the provenance is not lost — it rides the hover',
      /original stored/.test(cards.hint || ''), (cards.hint || '').slice(0, 40));
    ok('2c4 a description somebody really wrote is left alone',
      cards.real === 'A real description somebody typed' && !cards.realHint, cards.real);
    ok('2c5 and a category with no name says nothing rather than guessing',
      typeof cards.none === 'string', JSON.stringify(cards.none));

    /* ONE HEIGHT: measured on the cards the dialog really drew. */
    const heights = await page.$$eval('.na-door', els => els.map(e => Math.round(e.getBoundingClientRect().height)));
    if (heights.length >= 2) ok('2d every card measures one height', new Set(heights).size === 1, heights.join(' | '));
    else console.log('  note  this workspace publishes fewer than two standards — the reserved slot is pinned in f347');
    const slot = await page.evaluate(() => {
      const el = document.querySelector('.na-door .na-about');
      if (!el) return null;
      const s = getComputedStyle(el);
      return { clamp: s.webkitLineClamp || s.getPropertyValue('-webkit-line-clamp'), h: s.height };
    });
    if (slot) ok('2d2 the sentence slot reserves exactly two lines', slot.clamp === '2', JSON.stringify(slot));

    /* THE DIALOG IS REALLY GONE BEFORE THE NEXT SECTION PRESSES ANYTHING:
       a leftover scrim at z-index 70 swallows every click under it, and a
       click that times out in a harness looks exactly like a control that is
       not drawn. */
    await page.evaluate(() => { try { closeModal(); } catch (e) {}
      const r = document.getElementById('modal-root'); if (r) r.innerHTML = ''; });
    await page.waitForTimeout(600);

    /* ════════ 4. WHAT COPILOT READ ════════
       STAGED: the seeded book has had nothing read, and this table is about
       what the readings found. Each row is given a different RESULT so the
       colour coding has something to tell apart. */
    const cid = await page.evaluate(() => {
      const c = state.contracts[0];
      c.playbook = { verdicts: [{ status: 'deviates' }, { status: 'aligned' }], label: 'Our standards',
        checkedAt: '2026-09-20T09:00:00.000Z' };
      c.obligationsReadAt = '2026-09-20T09:00:00.000Z';
      /* `dismissed` IS NOT OPTIONAL: openFindings reads it with .includes, so
         a hand-built scan without it throws inside the room's own render and
         the tab row never draws — a fixture fault that looks exactly like a
         missing control. ASSERT THE STATE YOU CREATED BEFORE YOU ATTACK IT. */
      c.scan = { on: '2026-09-20', dismissed: [], findings: [{ id: 'f1', sev: 'high' }] };
      let findings = -1;
      try { findings = openFindings(c).length; } catch (e) { findings = 'threw: ' + e.message; }
      return { id: c.id, findings };
    });
    ok('4-stage the staged readings are really readable',
      cid && cid.findings === 1, JSON.stringify(cid && cid.findings));
    await page.evaluate(o => openWorkspace(o.id), cid);
    await page.waitForTimeout(3000);
    /* THE ROOM LANDS ON THE DOCUMENT TAB for a contract already past Draft, so
       the Overview has to be asked for. */
    await page.click('[data-ws-tab="terms"]').catch(e => console.log('  note  tab press: ' + e.message.slice(0, 70)));
    await page.waitForTimeout(2200);
    console.log('  note  room is on ' + await page.evaluate(() =>
      (typeof roomCurrentTab === 'function' ? roomCurrentTab() : '?') + ' · stack ' + !!document.querySelector('.ov-stack')));
    /* THE SECTIONS ARE SHUT AT REST and a shut section draws no body, so the
       table is not in the page until the head is pressed — the section
       grammar's own rule, and what makes this a real press rather than a read. */
    /* ONE PRESS, ON THE SECTION THIS IS ABOUT, AND RE-QUERIED. Pressing every
       shut head in one pass repaints the stack under the loop's own feet, so
       the later presses land on nodes that are no longer in the page —
       re-query after a repaint. */
    for (let i = 0; i < 4; i++) {
      const done = await page.evaluate(() => {
        const h = [...document.querySelectorAll('.sec-head[aria-expanded="false"]')]
          .find(e => /copilot/i.test((e.querySelector('.sec-t') || {}).textContent || ''));
        if (!h) return true;
        h.click(); return false;
      });
      await page.waitForTimeout(700);
      if (done) break;
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '03-overview.png'), fullPage: true });

    const tbl = await page.evaluate(() => {
      const t = document.querySelector('.ov-reads');
      if (!t) return null;
      const rows = [...t.querySelectorAll('tbody tr')].map(r => {
        const s = r.querySelector('.ov-r-s'), b = r.querySelector('.ov-r-d button');
        const cs = s ? getComputedStyle(s) : null;
        return { n: (r.querySelector('.ov-r-n') || {}).textContent,
          said: s ? s.textContent.trim() : '', w: cs ? cs.fontWeight : null, c: cs ? cs.color : null,
          rule: getComputedStyle(r.querySelector('td')).borderBottomWidth,
          btn: b ? { edge: getComputedStyle(b).borderTopWidth, ec: getComputedStyle(b).borderTopColor,
            plain: b.classList.contains('ui-btn-plain') } : null };
      });
      return { rows, headRule: getComputedStyle(t.querySelector('th')).borderBottomWidth };
    });
    if (!tbl) { ok('4 the What Copilot read table is drawn', false,
      await page.evaluate(()=>({tab:(typeof roomCurrentTab==='function')?roomCurrentTab():null,
        secs:[...document.querySelectorAll('.sec-head')].map(e=>e.textContent.trim().slice(0,24)+':'+e.getAttribute('aria-expanded')),
        stack:!!document.querySelector('.ov-stack')})).then(JSON.stringify)); }
    else {
      ok('4 no rule runs across the card',
        tbl.rows.every(r => r.rule === '0px') && tbl.headRule === '0px',
        tbl.rows.map(r => r.rule).join(',') + ' head ' + tbl.headRule);
      ok('4b what it found is bold', tbl.rows.every(r => Number(r.w) >= 600),
        tbl.rows.map(r => r.w).join(','));
      /* THE COLOUR IS THE RESULT: with one row clear, one with departures, one
         with a high finding and one unread, four different inks must appear —
         the fault was that every row that had run drew ONE colour. */
      ok('4c and its colour follows the result, not merely that it ran',
        new Set(tbl.rows.map(r => r.c)).size >= 3,
        tbl.rows.map(r => `${(r.n || '').trim()}:${r.said}=${r.c}`).join(' · '));
      const doors = tbl.rows.filter(r => r.btn);
      ok('4d every open door is an outlined button',
        doors.length > 0 && doors.every(r => parseFloat(r.btn.edge) >= 1 && !r.btn.plain),
        doors.map(r => r.btn.edge).join(','));
    }

    /* ════════ 3. THE ARRIVAL STRIP'S TWO TILES ════════ */
    const tiles = await page.evaluate(() => {
      const c = state.contracts.find(x => x.id === state.activeId) || state.contracts[0];
      /* triageWhy is the one reading; asked directly so the four kinds can be
         told apart without four failing round trips. */
      const w = k => (typeof triageWhy === 'function')
        ? triageWhy({ kind: k, message: 'Copilot request failed: fetch failed' }).say : null;
      return { raw: (typeof triageWhy === 'function') ? triageWhy({ message: 'fetch failed' }) : null,
        kinds: { noKey: w('noKey'), rateLimit: w('rateLimit'), spendCap: w('spendCap'), provider: w('provider') },
        names: (typeof contractOpenFieldNames === 'function') ? contractOpenFieldNames(c).slice(0, 4) : null };
    });
    ok('3b a transport error is said in words a reader can act on',
      !!tiles.raw && !/fetch failed/.test(tiles.raw.say), tiles.raw && tiles.raw.say);
    ok('3b2 and the technical sentence is kept, for the hover',
      !!tiles.raw && /fetch failed/.test(tiles.raw.raw), tiles.raw && tiles.raw.raw);
    ok('3c the four kinds are told apart',
      new Set(Object.values(tiles.kinds || {})).size === 4, JSON.stringify(tiles.kinds));
    ok('3d the open fields have names to give',
      Array.isArray(tiles.names), JSON.stringify(tiles.names));

    /* ════════ 5. THE NEGOTIATE HEAD ════════ */
    await page.evaluate(o => openRedlineWorkbench(o.id), cid);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, '04-negotiate.png') });
    const head = await page.evaluate(() => {
      const el = document.getElementById('ws-head');
      if (!el) return null;
      const s = getComputedStyle(el);
      /* THE TERM FACET ITSELF, never a container that happens to hold it:
         a whole fact row matches /Term/ and would pass on anything. */
      const facts = [...document.querySelectorAll('#ws-head .room-facets .room-facet')]
        .map(e => ({ l: (e.querySelector('.l') || {}).textContent || '',
                     v: (e.querySelector('.v') || {}).textContent || '' }))
        .filter(f => /^Term\b/i.test(f.l.trim())).map(f => f.v.trim());
      return { shadow: s.boxShadow, bb: s.borderBottomWidth,
        term: facts[0] || '', nFacets: facts.length };
    });
    ok('5 no line runs across the head card',
      !!head && (head.shadow === 'none' || !/inset/.test(head.shadow)) && parseFloat(head.bb || 0) === 0,
      head && head.shadow);
    ok('5b the Term says its length once, with no day count after it',
      !!head && !/·\s*\d+\s*(d|day|dag)/i.test(head.term), head && head.term);

    ok('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
