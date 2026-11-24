/* Chromium verification: THE TWO CLAUSE-LIST FAULTS, AND THE LINES REMOVED
   (the owner, 21 Oct 2026: "there is a bug where some clause 2 is missing",
   "some clauses refuse to close once you go past them", "no dotted lines in
   the clauses", and of the three-count line "remove the highlighted area as
   it is redundant").

   1a a NUMBERED CLAUSE LEFT BLANK is a real clause row — its number, its
      bead, its press — and 1b a genuine section title ("3." over 3.1 and
      3.2) is still a section title
   2  the finding about that clause sits ON clause 2's row, not above it under
      "After §1 — not in the contract"; the tab's number counts it
   3  a press on the open row CLOSES it ("nothing open" is allowed), the close
      holds while its clause is at the line and the next clause the paper
      brings up opens (re-pointed 16 Nov 2026), the next press lets it go —
      and the paper's follow still opens the clause at the line afterwards
      (the one-page Home plan's own mechanism)
   4  the not-in-the-contract group has its own open and close, so nothing in
      the list is uncloseable
   5  no dashed or dotted border is painted anywhere in the list, and the
      point card's 2px coloured left edge is untouched
   6  the three-count line is gone; the title, its grey sub and the three
      filter boxes stand, and Severity still filters by the same three

   RED AT 826e87cb: 1a, 2, 3, 4, 5 and 6 all fail there (clause 2 is drawn as
   a bare section title with no number, so the finding falls to the foot of
   the list; the open row cannot be closed; the group is a dashed box with no
   control; the count line is drawn).

   Jambo's route is stubbed in the page (window.api), so nothing is spent.
   Run: node test/chromium/clause-list-fixed-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'clause-list-fixed');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const ID = 'MK-CB1';
const long = (s, n) => (s + ' ').repeat(n);
/* The owner's own shape: clause 2 is a numbered heading with NO paragraph
   under it; clause 3 is a real section title over 3.1 and 3.2. */
const BODY = '<h1>LOGISTICS SERVICES AGREEMENT</h1>'
  + '<p>This agreement is made between Highland Corporate Ltd and AIT Worldwide Logistics Norway AS.</p>'
  + '<h2>1. Services and Applicable Terms</h2><p>' + long('The Provider shall perform freight forwarding, customs clearance and warehousing services for the Client.', 6)
  + 'The Provider may appoint subcontractors to perform any part of the services without the Client’s prior consent.</p>'
  + '<h2>2. Term and Termination</h2>'
  + '<h2>3. Pricing and Payment</h2>'
  + '<h3>3.1 Rates</h3><p>' + long('The Client shall pay the rates set out in the rate sheet, which the Provider may revise at any time by written notice.', 5) + '</p>'
  + '<h3>3.2 Invoices</h3><p>' + long('Invoices are payable within fifteen (15) days of the invoice date.', 5) + '</p>'
  + '<h2>4. Liability</h2><p>' + long('The Provider’s liability shall not exceed the fees paid in the three (3) months before the claim.', 6) + '</p>'
  + '<h2>5. Confidentiality and Data</h2><p>' + long('Each party shall keep the other party’s confidential information secret for the term of this agreement.', 6) + '</p>'
  + '<h2>6. Governing Law and Disputes</h2><p>' + long('This agreement is governed by the laws of Norway and disputes are referred to arbitration in Oslo.', 6) + '</p>';
const deal = () => ({ id: ID, contractNo: ID, name: 'AIT Logistics Services', counterparty: 'AIT Worldwide Logistics Norway AS', folder: 'proc',
  value: 42000000, valueType: 'standard', status: 'Under Review', template: '', format: 'rich', redlineText: BODY,
  lastAction: '14 Oct 2026', expiry: '2029-09-30', hash: null, signedAt: null,
  fields: {}, metadata: { value: 42000000, currency: 'KES' }, comments: [], signatures: [], obligations: [], rounds: [], changes: [],
  audit: [{ at: iso(-6), user: 'System', action: 'Created', detail: 'fixture' }] });
/* what the route now answers for such a contract: the blank clause NAMES its
   clause and says it is blank (server.js, /api/ai/breakdown), so it is not a
   missing point; one genuinely missing point stands after §1 as before */
const READING = {
  head: 'Clause 2 is blank', sub: '', links: [], regions: [
    { name: 'Scope', status: 'look', kind: 'get', headline: '', items: [{ ref: '1' }], quotes: [] },
    { name: 'Term and exit', status: 'need', kind: 'protect', headline: '', items: [{ ref: '2' }], quotes: [] },
    { name: 'Risk', status: 'need', kind: 'protect', headline: '', items: [{ ref: '4' }], quotes: [] }],
  points: [
    { clause: '1', region: 1, status: 'look', missing: false, blank: false, title: 'They may subcontract without asking us',
      stake: 'The Provider can hand our goods to any subcontractor.', quote: 'The Provider may appoint subcontractors to perform any part of the services without the Client’s prior consent.', links: [] },
    { clause: '2', region: 2, status: 'need', missing: false, blank: true, title: 'Term and termination: clause 2 is blank',
      stake: 'No notice period, exit terms or renewal dates.', quote: '', links: [] },
    { clause: '', after: '1', region: 1, status: 'look', missing: true, blank: false, title: 'No service levels anywhere',
      stake: 'Nothing says how late a load may be.', quote: '', links: [] },
    { clause: '4', region: 3, status: 'need', missing: false, blank: false, title: 'Their cover stops at three months of fees',
      stake: 'A single lost load could cost far more than the cap.', quote: 'liability shall not exceed the fees paid in the three (3) months before the claim', links: [] }] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [deal()], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    /* RE-POINTED 24 Nov 2026 (the clause page L+S, f1208): the head's line stands over the LIST; the one-clause page draws
       no head line (the bar names the contract), so this check reads the list as it always did */
    await page.addInitScript(() => { try { localStorage.setItem('hati.v1.thList', '1'); } catch (_){} });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(id => typeof getContract === 'function' && !!getContract(id), ID, { timeout: 15000 });
    await page.evaluate(([id, reading]) => {
      state.aiConfigured = true;
      window.__bd = 0;
      const o = window.api;
      window.api = async function (p, ...a){
        if (p !== 'ai/breakdown') return o.call(this, p, ...a);
        window.__bd++; return reading;
      };
      setView('dashboard');
      pdOpenOnHome(id, 'doc');
    }, [ID, READING]);
    const up = await page.waitForSelector('#pd-thread .doc-th-row', { timeout: 10000 })
      .then(() => page.waitForFunction(id => !!(getContract(id).breakdown || {}).ok, ID, { timeout: 10000 })).then(() => true, () => false);
    await page.waitForTimeout(700);

    /* ===== 1 the walk of the list ===== */
    const walk = await page.evaluate(() => [...document.querySelectorAll('#pd-thread .doc-th-rows > .doc-th-row, #pd-thread .doc-th-rows > .doc-th-sec')].map(el => ({
      sec: el.classList.contains('doc-th-sec'),
      name: ((el.querySelector('.doc-th-name') || el).textContent || '').replace(/\s+/g, ' ').trim(),
      go: !!el.querySelector('[data-th-go]'), bead: !!el.querySelector('.doc-th-bead') })));
    const two = walk.find(r => /^2\. Term and Termination/.test(r.name));
    ok('1a the blank numbered clause is a real clause row: its number, its bead, its press',
      up && !!two && !two.sec && two.go && two.bead, JSON.stringify({ two, walk: walk.map(r => (r.sec ? '§ ' : '') + r.name.slice(0, 26)) }));
    const three = walk.find(r => /^3\. Pricing and Payment/.test(r.name));
    ok('1b a genuine section title over 3.1 and 3.2 is still a section title',
      !!three && three.sec && !three.go && walk.some(r => /^3\.1/.test(r.name) && !r.sec) && walk.some(r => /^3\.2/.test(r.name) && !r.sec),
      JSON.stringify({ three, subs: walk.filter(r => /^3\./.test(r.name)).map(r => r.name.slice(0, 20) + (r.sec ? ' (sec)' : '')) }));

    /* ===== 2 the finding sits ON clause 2 ===== */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the row's name shows the paper's title, its number
       carried by the mark (THE LIST SHOWS THE PAPER'S OWN NUMBERS AND TITLES), so a row is found by its whole name's
       text (textContent), number included, not by what innerText paints */
    const open2 = () => page.evaluate(async () => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^2\. Term/.test((r.querySelector('.doc-th-name') || {}).textContent || ''));
      if (!row) return false;
      if (!row.classList.contains('is-open')){ row.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); }
      return true;
    });
    await open2();
    const e2 = await page.evaluate(id => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^2\. Term/.test((r.querySelector('.doc-th-name') || {}).textContent || ''));
      const card = row && row.querySelector('.stk-card');
      const txt = el => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim();
      const groups = [...document.querySelectorAll('#pd-thread .stk-miss')].map(m => ({ h: txt(m.querySelector('.stk-miss-h')), t: txt(m) }));
      return { onRow: !!(card && /clause 2 is blank/.test(card.textContent)), state: txt(row && row.querySelector('[data-th-state]')),
        inGroup: groups.some(g => /clause 2 is blank/.test(g.t)), groups: groups.map(g => g.h), need: stkNeedCount(getContract(id)),
        marked: !!(row && row.classList.contains('stk-b-need')) };
    }, ID);
    /* RE-POINTED 16 Nov 2026 (#762): the Legora way's rows carry no "Needs you · 1" sentence (CLAUDE.md "no amber
       sentence on a row"); the row is MARKED need (stk-b-need, its amber mark) and the tab's count still counts it */
    ok('2 "clause 2 is blank" stands ON clause 2\'s row, not in a not-in-the-contract group, and the tab counts it',
      e2.onRow && !e2.inGroup && e2.marked && e2.need === 2, JSON.stringify(e2));
    /* 2b A CLAUSE WITH NO WORDING HAS NOTHING TO READ: HaTi knows before the
       press, so Plain is greyed with the reason rather than spending a call
       to be told the clause is empty. */
    const plain = await page.evaluate(() => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^2\. Term/.test((r.querySelector('.doc-th-name') || {}).textContent || ''));
      const b = row && row.querySelector('[data-th-explain]');
      const say = row && row.querySelector('.doc-th-cost');
      return { there: !!b, dis: !!(b && b.disabled), why: b ? b.getAttribute('title') : '', said: say ? say.textContent.trim() : '' };
    });
    /* and it is still live on a clause that HAS wording (only the open row
       draws its own press, so clause 1 is opened to be asked, then clause 2
       is put back for the close below) */
    const plainLive = await page.evaluate(async () => {
      const open = async re => { const r = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(x => re.test((x.querySelector('.doc-th-name') || {}).textContent || ''));
        if (r && !r.classList.contains('is-open')) r.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); return r; };
      const one = await open(/^1\. Services/);
      const b = one && one.querySelector('[data-th-explain]');
      const out = { there: !!b, live: !!(b && !b.disabled), said: ((one && one.querySelector('.doc-th-cost')) || {}).textContent };
      await open(/^2\. Term/);
      return out;
    });
    ok('2b its Plain press is greyed with the reason, and lives on the clauses that have wording',
      plain.there && plain.dis && /no wording here to read/.test(plain.why || '') && /no wording here to read/.test(plain.said || '')
      && plainLive.there && plainLive.live && /one short reading/.test(plainLive.said || ''), JSON.stringify({ plain, plainLive }));
    await page.screenshot({ path: path.join(OUT, '2-finding-on-clause-2.png') });

    /* ===== 3 press it again and it closes; the close holds while you scroll ===== */
    const openName = () => page.evaluate(() => { const r = document.querySelector('#pd-thread .doc-th-row.is-open .doc-th-name'); return r ? r.textContent.trim() : ''; });
    const shownCards = () => page.evaluate(() => [...document.querySelectorAll('#pd-thread .doc-th-row .stk-card')].filter(c => c.getClientRects().length).length);
    const before = { name: await openName(), cards: await shownCards() };
    await page.evaluate(async () => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row.is-open')][0];
      const b = row && row.querySelector('[data-th-go]'); if (!b) return;
      b.click(); await new Promise(z => setTimeout(z, 500));
    });
    const shut = { name: await openName(), cards: await shownCards() };
    ok('3a a press on the open row closes it — nothing open, its card put away',
      /^2\. Term/.test(before.name) && before.cards === 1 && shut.name === '' && shut.cards === 0, JSON.stringify({ before, shut }));
    /* RE-POINTED 16 Nov 2026 (owner: "if you close one of the clauses in the panel, the feature switches off"):
       the close holds while ITS clause is at the line — a nudge of the paper does not undo it — and the next clause
       the paper brings up opens, as the follow always opens it. AT THE PARENT 3b fails: the panel stayed empty. */
    const wheel = async n => { const b = await page.evaluate(() => { const r = document.getElementById('ig-paper-scroll').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
      await page.mouse.move(b.x, b.y);
      for (let k = 0; k < n; k++){ await page.mouse.wheel(0, 90); await page.waitForTimeout(40); } };
    await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); sc.scrollTop += 2; });
    await page.waitForTimeout(300);
    const nudged = await openName();
    await wheel(14);
    let moved = null;
    for (let k = 0; k < 20 && !moved; k++){ const n = await openName(); if (n) moved = n; else await page.waitForTimeout(100); }
    const held = { nudged, moved, top: await page.evaluate(() => document.getElementById('ig-paper-scroll').scrollTop) };
    ok('3b a nudge keeps the close (its clause still at the line); scrolling on, the next clause at the line opens',
      nudged === '' && !!moved && !/^2\. Term/.test(moved) && held.top > 100, JSON.stringify(held));
    await page.screenshot({ path: path.join(OUT, '3-closed-and-scrolled.png') });
    /* the next press lets the close go, and the paper's follow works again */
    await page.evaluate(async () => {
      const row = [...document.querySelectorAll('#pd-thread .doc-th-row')].find(r => /^1\. Services/.test((r.querySelector('.doc-th-name') || {}).textContent || ''));
      const b = row && row.querySelector('[data-th-go]'); if (!b) return;
      b.click(); await new Promise(z => setTimeout(z, 900));
    });
    const pressed = await openName();
    await wheel(16);
    const followed = await openName();
    ok('3c the next press opens again, and the paper\'s follow still opens the clause at the line',
      /^1\. Services/.test(pressed) && !!followed && followed !== pressed, JSON.stringify({ pressed, followed }));

    /* ===== 4 the not-in-the-contract group folds ===== */
    const grp = await page.evaluate(async () => {
      /* RE-POINTED 22 Oct 2026: the group stands inside §1 and shows while §1 is open */
      const openIn = async el => { const r = el && el.closest('.doc-th-row'); if (r && !r.classList.contains('is-open')){ r.querySelector('[data-th-go]').click(); await new Promise(z => setTimeout(z, 900)); } };
      const find = () => [...document.querySelectorAll('#pd-thread .stk-miss')].find(x => /After §1/.test(x.textContent));
      await openIn(find());
      const m = find();
      if (!m) return { there: false };
      const btn = m.querySelector('[data-stk-miss-go]');
      const body = m.querySelector('.stk-miss-body');
      if (!btn || !body) return { there: true, control: false, head: String((m.querySelector('.stk-miss-h') || {}).textContent || '').trim() };
      const seen = () => !!(body && body.getClientRects().length);
      const was = { open: seen(), exp: btn && btn.getAttribute('aria-expanded'), tag: btn && btn.tagName };
      btn.click(); await new Promise(z => setTimeout(z, 150));
      const now = { open: seen(), exp: btn.getAttribute('aria-expanded') };
      btn.click(); await new Promise(z => setTimeout(z, 150));
      const again = { open: seen(), exp: btn.getAttribute('aria-expanded') };
      return { there: true, control: true, was, now, again, head: String((m.querySelector('.stk-miss-h') || {}).textContent || '').trim() };
    });
    ok('4 the group\'s own head opens and closes it; pressed again it comes back',
      grp.there && grp.control && grp.was.open && grp.was.tag === 'BUTTON' && grp.was.exp === 'true' && !grp.now.open && grp.now.exp === 'false' && grp.again.open && grp.again.exp === 'true',
      JSON.stringify(grp));
    /* §1 open with its missing point inside it, at the owner's three screens (22 Oct 2026) */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(300);
      await page.evaluate(() => { const m = [...document.querySelectorAll('#pd-thread .stk-miss')].find(x => /After §1/.test(x.textContent)); if (m) m.scrollIntoView({ block: 'center' }); });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(OUT, `4-missing-inside-its-clause-${w}x${ht}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(300);

    /* ===== 5 no dashed or dotted border; the card's coloured edge stands ===== */
    const lines = await page.evaluate(() => {
      const bad = [];
      const styles = el => [getComputedStyle(el), getComputedStyle(el, '::before'), getComputedStyle(el, '::after')];
      [...document.querySelectorAll('#pd-thread *')].forEach(el => {
        if (!el.getClientRects().length) return;
        styles(el).forEach((s, k) => ['Top', 'Right', 'Bottom', 'Left'].forEach(side => {
          const st = s['border' + side + 'Style'], w = parseFloat(s['border' + side + 'Width']) || 0;
          if ((st === 'dashed' || st === 'dotted') && w > 0) bad.push((el.className || el.tagName) + (k ? (k === 1 ? '::before' : '::after') : '') + ' ' + side + ' ' + st);
        }));
      });
      const card = document.querySelector('#pd-thread .stk-card');
      const edge = card ? getComputedStyle(card, '::before') : null;
      return { bad: bad.slice(0, 6), edge: edge ? { w: edge.width, bg: edge.backgroundColor, c: edge.content } : null,
        miss: (() => { const m = document.querySelector('#pd-thread .stk-miss'); const s = m && getComputedStyle(m);
          return s ? { style: s.borderTopStyle, w: s.borderTopWidth, pad: s.paddingLeft, ml: s.marginLeft } : null; })() };
    });
    ok('5a nothing in the list paints a dashed or dotted border', lines.bad.length === 0, JSON.stringify(lines.bad));
    ok('5b the not-in-the-contract group keeps its indent and its label, with no border',
      !!lines.miss && (lines.miss.style === 'none' || lines.miss.w === '0px') && parseFloat(lines.miss.ml) >= 20, JSON.stringify(lines.miss));
    /* RE-POINTED 23 Oct 2026 (owner: "Build the dot but without the quote"): the verdict is a coloured dot before the title, no edge */
    /* RE-POINTED 16 Nov 2026 (#762): the Legora way draws no card dot — the verdict's colour is the ROW's own mark
       (.doc-th-bead, amber for a clause that needs you, never the resting grey), and still no edge */
    const dot = await page.evaluate(() => { const row = document.querySelector('#pd-thread .doc-th-row.stk-b-need, #pd-thread .doc-th-row.stk-b-look');
      /* RE-POINTED 24 Nov 2026 (the list L+S, f1214): the verdict is the row's soft badge; a row with nothing found has none */
      const d = row && row.querySelector('.doc-th-lbadge'); const s = d && getComputedStyle(d);
      const rest = document.querySelector('#pd-thread .doc-th-row.stk-b-none .doc-th-lbadge:not(.k-read)');
      return s ? { bg: s.backgroundColor, rest: rest ? getComputedStyle(rest).backgroundColor : null, shown: d.getClientRects().length > 0 } : null; });
    ok('5c the point\'s verdict shows as its row\'s soft badge, and no edge',
      !!dot && dot.shown && dot.bg !== 'rgba(0, 0, 0, 0)' && dot.bg !== dot.rest && !!lines.edge && lines.edge.c === 'none', JSON.stringify({ dot, edge: lines.edge }));

    /* ===== 6 no count line; the tabs do the filters' work =====
       RE-POINTED 23 Oct 2026 (owner picked "Marquee"): a headline and the clauses as tabs with counts in place of
       the three boxes; "Needs you" narrows to the same points and All lets go */
    const head = await page.evaluate(() => ({
      tally: !!document.querySelector('#pd-thread .stk-tally, #pd-thread [data-stk-sev]'),
      title: ((document.querySelector('#pd-thread .stk-mq-t') || {}).textContent || '').trim(),
      boxes: document.querySelectorAll('#pd-thread .stk-flt').length,
      tabs: [...document.querySelectorAll('#pd-thread .stk-tab')].map(b => b.getAttribute('data-stk-tab')).join(','),
      top: (() => { const t = document.querySelector('#pd-thread .stk-lg-top'); if (!t) return null; const r = t.getBoundingClientRect();
        const cs = getComputedStyle(t), lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.4;
        return { words: t.textContent.trim(), h: Math.round(r.height), lh, oneLine: r.height > 0 && r.height < lh * 1.6 }; })() }));
    /* RE-POINTED 16 Nov 2026 (#762; the owner's "Legora way" for Clauses, 16 Nov 2026): no count line, no headline, no
       tabs — ONE line, "Clause review · the contract · where to start" (stkMarqueeHtml, .stk-lg-top), no boxes */
    ok('6a the three-count line is gone; the one top line stands, no headline, no tabs, no boxes',
      /* RE-POINTED 24 Nov 2026 (owner: "delete this as well", the list L+S, f1214): no "Clause review" line over the list at all */
      !head.tally && head.title === '' && head.tabs === '' && head.boxes === 0 && (!head.top || head.top.h === 0), JSON.stringify(head));
    /* RETIRED 16 Nov 2026 (#762): 6b "the Needs you tab narrows to the same points" — the new look's Clauses draw no tabs */
    await page.screenshot({ path: path.join(OUT, '6-head-without-the-count-line.png') });

    ok('7 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } catch (e) {
    ok('the stage ran', false, String((e && e.stack) || e).slice(0, 400));
  } finally { await browser.close().catch(() => {}); await h.stop().catch(() => {}); }
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
