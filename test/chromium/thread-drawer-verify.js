/* Chromium verification: THE DRAWER — Form & links lands, the clauses come over it
   (Young picked "Drawer", 5 Oct 2026: "when you land to documents page, form
   and links is the landing panel but you click on a button above which then
   brings you the clauses")
   ============================================================
   f507 (6)–(10) pin the shape; this file proves what the owner SEES, on a
   credit application shaped like the owner's own "Kwetu - V2" (a template
   form of eighteen boxes, a part title, a risk scan staged on the record) and
   a scripted Copilot answering the readings route:

     1  the tab lands on FORM & LINKS: the form at the height of what it holds
        (it was squeezed to 136px of 1107), the column the one scroller, the
        clauses shut, and a Clauses door on the tab row saying what is marked
     2  the door brings the clauses over it — opening on the clause at the
        paper's line, with the colour filter, a part title drawn as a label,
        and ONE scroller (the open row grows); the contract does not move
     3  the filter: a colour nobody carries is greyed and says why; Red shows
        the red clause alone ("1 of 1 shown"); Red + Amber steps only between
        the two, the paper gliding to each
     4  PLAIN: a clause Copilot answers empty — twice — says "Could not read"
        on its row, with Plain to ask again; the next press reads it; the one
        after costs nothing
     5  Escape and × go back to Form & links, the hand back on the door
     6  a refresh puts back the drawer and the colours; leaving the room and
        coming back lands on Form & links
     7  a contract with no form, no link and no round: the clauses ARE the
        panel — no door, no ×
     8  at night the drawer keeps its colours

   AT UNMODIFIED MAIN there is no door, no drawer and no filter: every driven
   half is GUARDED so the checks REPORT rather than hang.
   Screenshots go to $HATI_SHOT_DIR, else test/chromium/shots/thread-drawer/.
   Run: node test/chromium/thread-drawer-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');
const TF = require('../../js/templateform.js');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'thread-drawer');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* ---- the paper: a credit application with a part title ---- */
const F = (k, l) => ({ fieldKey: k, label: l, fieldType: 'text', required: true });
const fields = [F('effDate', 'Effective Date'), F('coName', 'Company Name'), F('coReg', 'Registration Number'), F('coPin', 'PIN'),
  F('coAddr', 'Physical Address'), F('coPhone', 'Phone'), F('poName', 'Procurement Contact'), F('poMail', 'Procurement Email'),
  F('poPhone', 'Procurement Phone'), F('dlAddr', 'Delivery Address'), F('dlHours', 'Receiving Hours'), F('tr1n', 'Trade Reference 1 – Name'),
  F('tr1p', 'Trade Reference 1 – Contact Number'), F('tr1e', 'Trade Reference 1 – Email'), F('tr2n', 'Trade Reference 2 – Name'),
  F('tr2p', 'Trade Reference 2 – Contact Number'), F('tr2e', 'Trade Reference 2 – Email'), F('limit', 'Credit Limit')];
const values = {}; fields.forEach(f => { values[f.fieldKey] = 'Kwetu ' + f.label.split(' ')[0]; });
const form = { templateId: 'TK', templateName: 'Warehousing Logistics Agreement', versionNumber: 1, fields, values,
  blocks: [
    { blockType: 'heading', content: 'Credit Application', orderIndex: 0 },
    { blockType: 'heading', content: 'Company Information', orderIndex: 1 },
    { blockType: 'fixed_text', content: 'The Client confirms that the information given in this application is true and complete, and agrees to tell the Supplier in writing of any change within fourteen days.', orderIndex: 2 },
    { blockType: 'field_group', content: 'Company name: {{coName}}. Registration: {{coReg}}. PIN: {{coPin}}. Address: {{coAddr}}. Phone: {{coPhone}}.', orderIndex: 3 },
    { blockType: 'heading', content: 'Personnel Information - Procurement Division', orderIndex: 4 },
    { blockType: 'field_group', content: 'Contact: {{poName}}. Email: {{poMail}}. Phone: {{poPhone}}.', orderIndex: 5 },
    { blockType: 'heading', content: 'Delivery Information', orderIndex: 6 },
    { blockType: 'fixed_text', content: 'The following section is to be completed only where the Client is applying for credit. Where credit is requested, the Client must, in addition to completing the information below, attach copies of the Directors\' identification documents, the Certificate of Incorporation or Certificate of Registration, and the CR12.', orderIndex: 7 },
    { blockType: 'field_group', content: 'Delivery address: {{dlAddr}}. Receiving hours: {{dlHours}}.', orderIndex: 8 },
    { blockType: 'heading', content: 'Trade References', orderIndex: 9 },
    { blockType: 'field_group', content: 'Trade Reference 1 – Name: {{tr1n}}. Contact Number: {{tr1p}}. Email: {{tr1e}}. Trade Reference 2 – Name: {{tr2n}}. Contact Number: {{tr2p}}. Email: {{tr2e}}.', orderIndex: 10 },
    { blockType: 'heading', content: 'Part B Terms of Credit', orderIndex: 11 },
    { blockType: 'heading', content: 'Credit Terms', orderIndex: 12 },
    { blockType: 'fixed_text', content: 'Credit is granted at the Supplier\'s sole discretion up to the Credit Limit of {{limit}}. Invoices are payable within thirty (30) days of the invoice date. The Supplier may suspend deliveries if any amount is overdue.', orderIndex: 13 },
    { blockType: 'heading', content: 'Interest on Overdue Amounts', orderIndex: 14 },
    { blockType: 'fixed_text', content: 'Any amount not paid when due bears interest at two percent (2%) per month until paid in full, and the Client shall pay the Supplier\'s costs of recovery.', orderIndex: 15 },
    { blockType: 'heading', content: 'Effective Date', orderIndex: 16 },
    { blockType: 'field_group', content: 'This application takes effect on {{effDate}}.', orderIndex: 17 },
  ] };
const base = { counterparty: 'Bull Building Supplies Ltd', counterpartyEmail: 'b@bull.example', party: 'Kwetu Distributors Ltd',
  folder: 'proc', status: 'Under Review', value: 0, template: null, fields: {}, comments: [], rounds: [], versions: [],
  signatures: [], metadata: {}, compliance: {}, audit: [] };
const KWETU = Object.assign({}, base, { id: 'MK-314', name: 'Kwetu - V2', format: 'rich', templateForm: form,
  templateId: 'TK', templateName: 'Warehousing Logistics Agreement', templateVersion: 1, redlineText: TF.templateFormDocHtml(form) });
const BARE = Object.assign({}, base, { id: 'MK-315', name: 'Supply note', format: 'rich',
  redlineText: '<h2>1. Supply</h2><p>The Supplier shall deliver the goods on the agreed dates.</p><h2>2. Payment</h2><p>The Buyer shall pay within thirty (30) days of each invoice.</p><h2>3. Law</h2><p>This note is governed by the laws of Kenya.</p>' });

const ROWS_RE = /\[(R\d{1,3})\] (?:CLAUSE|SECTION)[^\n]*\nheading: ([^\n]*)/g;
const answer = say => b => [{ type: 'tool_use', id: 'tu', name: 'clause_readings', input: { readings:
  [...String(b.messages[0].content).matchAll(ROWS_RE)].map(m => ({ key: m[1], heading: m[2], plain: /SECTION/.test(m[0]) ? '' : say(m[2]) })) } }];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h);
  for (const c of [KWETU, BARE]) await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* a high and a medium finding, staged in the browser's copy of the record
       (never saved): red on Credit Terms, amber on Delivery Information, and
       nobody blue */
    const stage = id => page.evaluate(i => { const c = getContract(i);
      c.scan = { at: 'today', on: '2026-10-05', dismissed: [], findings: [
        { id: 'w1', sev: 'high', title: 'Credit can be cut without warning', why: 'Bull may cancel your credit at any time.', quote: 'Credit is granted at the Supplier' },
        { id: 'w2', sev: 'med', title: 'Directors’ identity papers', why: 'Sensitive papers are handed over before credit is agreed.', quote: 'attach copies of the Directors' }] };
      roomGoTab(c, 'docs'); }, id);
    const open = async id => { await page.evaluate(i => openWorkspace(i), id); await page.waitForTimeout(900); await stage(id); await page.waitForTimeout(1200); };
    await open('MK-314');

    const read = () => page.evaluate(() => {
      const txt = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
      const box = id => { const e = document.getElementById(id); if (!e) return null; const r = e.getBoundingClientRect();
        return { h: Math.round(r.height), content: e.scrollHeight, client: e.clientHeight, shown: !e.hidden && getComputedStyle(e).display !== 'none' && r.height > 0 }; };
      const th = document.getElementById('doc-thread');
      const door = document.getElementById('ws-th-door');
      const right = document.getElementById('doc-right');
      const rows = th ? [...th.querySelectorAll('.doc-th-row')].map(r => ({ i: Number(r.dataset.thRow), name: txt(r.querySelector('.doc-th-name')),
        state: txt(r.querySelector('.doc-th-state')), open: r.classList.contains('is-open'), shown: !r.hidden,
        tone: (r.className.match(/is-(ruby|amber|steel)/) || [])[1] || '' })) : [];
      const openRow = th && th.querySelector('.doc-th-row.is-open');
      const body = openRow && openRow.querySelector('.doc-th-in');
      const chips = th ? [...th.querySelectorAll('[data-th-tone]')].map(b => ({ tone: b.getAttribute('data-th-tone'), text: txt(b),
        pressed: b.getAttribute('aria-pressed') === 'true', dead: b.getAttribute('aria-disabled') === 'true', title: b.getAttribute('title') || '' })) : [];
      const list = th && th.querySelector('.doc-th-rows');
      return { door: door ? { shown: !door.hidden && door.getBoundingClientRect().width > 0, text: txt(door), expanded: door.getAttribute('aria-expanded') } : null,
        threadShown: !!(th && !th.hidden && th.getBoundingClientRect().height > 0), form: box('tplform-section'),
        rightScrolls: right ? right.scrollHeight > right.clientHeight + 1 : null, rightTop: right ? right.scrollTop : -1,
        close: !!(th && th.querySelector('[data-th-close]')), chips, rows,
        secs: th ? [...th.querySelectorAll('.doc-th-sec')].map(s => ({ text: txt(s), shown: !s.hidden, bead: !!s.querySelector('.doc-th-bead'), button: !!s.querySelector('button') })) : [],
        openIdx: openRow ? Number(openRow.dataset.thRow) : -1, openText: txt(body).slice(0, 400),
        bodyScroll: body ? { y: getComputedStyle(body).overflowY, max: getComputedStyle(body).maxHeight } : null,
        listScroll: list ? getComputedStyle(list).overflowY : '',
        atLine: typeof docThreadAtLine === 'function' ? docThreadAtLine() : -2,
        focus: document.activeElement ? (document.activeElement.id || document.activeElement.className) : '' };
    });
    const ink = () => page.evaluate(() => {
      const cv = document.getElementById('doc-canvas'); if (!cv) return null;
      const w = document.createTreeWalker(cv, NodeFilter.SHOW_TEXT, { acceptNode: n => /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP });
      const t = w.nextNode(); if (!t) return null;
      const r = document.createRange(); r.selectNodeContents(t);
      const b = r.getBoundingClientRect();
      return { top: Math.round(b.top * 10) / 10, left: Math.round(b.left * 10) / 10, w: Math.round(cv.getBoundingClientRect().width) };
    });
    const hasDoor = () => page.evaluate(() => { const d = document.getElementById('ws-th-door'); return !!(d && !d.hidden); });
    const pressDoor = async () => { if (await hasDoor()) { await page.click('#ws-th-door'); await page.waitForTimeout(700); return true; } return false; };
    const chip = async tone => {
      const ok = await page.evaluate(t => { const b = document.querySelector(`#doc-thread [data-th-tone="${t}"]`); if (!b) return false; b.click(); return true; }, tone);
      await page.waitForTimeout(1200); return ok; };

    /* ===== 1. THE TAB LANDS ON FORM & LINKS ===== */
    const s1 = await read();
    const ink0 = await ink();
    check('1a the tab lands on Form & links: the clauses are shut', !s1.threadShown && s1.form && s1.form.shown,
      JSON.stringify({ thread: s1.threadShown, form: s1.form && s1.form.shown }));
    check('1b the form stands at the height of what it holds — the column scrolls, the card is not squeezed',
      s1.form && s1.form.h >= s1.form.content - 2 && s1.form.h > 600 && s1.rightScrolls === true,
      JSON.stringify({ form: s1.form, columnScrolls: s1.rightScrolls }));
    check('1c a Clauses door on the tab row says what is marked', !!(s1.door && s1.door.shown && /Clauses/.test(s1.door.text) && /2 to review/.test(s1.door.text) && s1.door.expanded === 'false'),
      JSON.stringify(s1.door));
    await page.screenshot({ path: path.join(OUT, '01-landing.png') });

    /* ===== 2. THE DOOR BRINGS THE CLAUSES OVER IT ===== */
    /* the paper is put on the second clause first: the drawer opens THERE
       (not the first, which is where it would open anyway; not one near the
       end, which the paper cannot bring up to the line) */
    await page.evaluate(() => { const sc = document.getElementById('doc-scroll'); const rows = docXrayRows(getContract(state.activeId)).filter(x => !(x.row && x.row.kind === 'section'));
      const el = rows[1] && rows[1].el; if (el) sc.scrollTop = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 20; });
    await page.waitForTimeout(500);
    const ink1 = await ink();
    const opened = await pressDoor();
    const s2 = await read();
    const ink2 = await ink();
    const second = s2.rows[1];
    check('2a the door brings the clauses over Form & links, and says it is open', opened && s2.threadShown && !(s2.form && s2.form.shown) && s2.door && s2.door.expanded === 'true',
      JSON.stringify({ opened, thread: s2.threadShown, form: s2.form && s2.form.shown, door: s2.door }));
    check('2b it opens on the clause at the paper\'s line', opened && !!(second && second.open) && s2.openIdx === s2.atLine, (second ? second.name : '-') + ' · open ' + s2.openIdx + ' · line ' + s2.atLine);
    check('2c × is there, and the filter: All · Red · Amber · Blue with their counts', s2.close && s2.chips.length === 4
      && /All 7/.test(s2.chips[0].text) && /Red 1/.test(s2.chips[1].text) && /Amber 1/.test(s2.chips[2].text) && /Blue 0/.test(s2.chips[3].text),
      s2.chips.map(c => c.text).join(' | '));
    check('2d a part title is a label — no bead, no button', s2.secs.length >= 1 && s2.secs.every(x => !x.bead && !x.button) && s2.secs.some(x => /PART B/i.test(x.text)),
      JSON.stringify(s2.secs));
    check('2e ONE scroller: the open row grows, the list scrolls', !!(s2.bodyScroll && s2.bodyScroll.y !== 'auto' && s2.bodyScroll.max === 'none' && s2.listScroll === 'auto'),
      JSON.stringify({ body: s2.bodyScroll, list: s2.listScroll }));
    check('2f [control] THE CONTRACT DOES NOT MOVE when the drawer opens (refusal 3)', !!(ink1 && ink2 && ink1.top === ink2.top && ink1.left === ink2.left && ink1.w === ink2.w && ink0 && ink0.w === ink2.w),
      JSON.stringify({ before: ink1, after: ink2 }));
    await page.screenshot({ path: path.join(OUT, '02-drawer.png') });

    /* ===== 3. THE COLOUR FILTER ===== */
    const blue = s2.chips.find(c => c.tone === 'steel');
    check('3a a colour nobody carries is greyed and says why', !!(blue && blue.dead && /No clause is marked blue/.test(blue.title)), JSON.stringify(blue));
    await chip('ruby');
    const s3 = await read();
    const shown3 = s3.rows.filter(r => r.shown);
    check('3b Red shows the red clause alone, and says "1 of 1 shown"', shown3.length === 1 && shown3[0].tone === 'ruby' && shown3[0].open && /1 of 1 shown/.test(s3.openText),
      shown3.map(r => r.name).join(' | ') + ' · ' + s3.openText.slice(0, 60));
    check('3c while filtering the part titles step aside', s3.secs.length >= 1 && s3.secs.every(x => !x.shown), JSON.stringify(s3.secs));
    await chip('amber');
    let s4 = await read();
    const shown4 = s4.rows.filter(r => r.shown);
    check('3d Red and Amber together show the two', shown4.length === 2 && shown4.every(r => r.tone === 'ruby' || r.tone === 'amber'), shown4.map(r => r.name + ':' + r.tone).join(' | '));
    /* ‹ from the red one steps to the amber one, the paper gliding there */
    const amberIdx = (shown4.find(r => r.tone === 'amber') || {}).i;
    await page.evaluate(() => { const b = document.querySelector('#doc-thread .doc-th-row.is-open [data-th-step="-1"]'); if (b && !b.disabled) b.click(); });
    await page.waitForTimeout(1400);
    s4 = await read();
    check('3e ‹ steps only through the shown clauses, and the paper glides there', s4.openIdx === amberIdx && s4.atLine === amberIdx,
      JSON.stringify({ open: s4.openIdx, line: s4.atLine, want: amberIdx }));
    await page.screenshot({ path: path.join(OUT, '03-filter.png') });
    await chip('');

    /* ===== 4. PLAIN NEVER ENDS IN SILENCE ===== */
    const deliv = await page.evaluate(() => { const r = [...document.querySelectorAll('#doc-thread .doc-th-row')].find(x => /Delivery Information/.test(x.textContent)); return r ? r.dataset.thRow : null; });
    if (deliv != null) { await page.evaluate(i => document.querySelector(`#doc-thread [data-th-go="${i}"]`).click(), deliv); await page.waitForTimeout(1400); }
    const press = async () => { const c0 = ai.calls.length;
      await page.evaluate(() => { const b = document.querySelector('#doc-thread .doc-th-row.is-open [data-th-explain]'); if (b) b.click(); });
      await page.waitForTimeout(3500);
      const s = await read(); return { calls: ai.calls.length - c0, s, row: s.rows.find(r => r.open) || {} }; };
    const s5 = await read();
    /* RE-POINTED 6 Oct 2026 (Young: "there should never be an option to
       translate all clauses so please delete"). */
    check('4a the button says Plain, and NO "All N clauses in plain English" sits beside it', /Plain/.test(s5.openText) && !/clauses in plain English/.test(s5.openText), s5.openText.slice(0, 120));
    ai.script(answer(() => ''), answer(() => ''));
    const p1 = await press();
    check('4b answered empty (twice), the clause says "Could not read" on its row, and why, with Plain to ask again',
      p1.calls === 2 && /Could not read/.test(p1.row.state) && /Copilot could not read this clause/.test(p1.s.openText) && /Plain/.test(p1.s.openText),
      JSON.stringify({ calls: p1.calls, state: p1.row.state, text: p1.s.openText.slice(0, 140) }));
    await page.screenshot({ path: path.join(OUT, '04-could-not-read.png') });
    ai.script(answer(hd => 'In plain words, ' + hd + ' asks you to hand over your directors’ identity papers.'));
    const p2 = await press();
    check('4c the next press reads it, into the open row', p2.calls === 1 && /In plain words/.test(p2.s.openText) && /Read/.test(p2.row.state) && !/Could not read/.test(p2.row.state),
      JSON.stringify({ calls: p2.calls, state: p2.row.state }));
    const p3 = await press();
    check('4d and it is kept: a press after that costs nothing', p3.calls === 0 && /In plain words/.test(p3.s.openText), p3.calls + ' calls');
    await page.screenshot({ path: path.join(OUT, '05-read.png') });

    /* ===== 5. ESCAPE AND × GO BACK ===== */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    const s6 = await read();
    check('5a Escape goes back to Form & links, the hand on the door', !s6.threadShown && s6.form && s6.form.shown && s6.focus === 'ws-th-door' && s6.door.expanded === 'false',
      JSON.stringify({ thread: s6.threadShown, focus: s6.focus }));
    await pressDoor();
    await page.evaluate(() => { const x = document.querySelector('#doc-thread [data-th-close]'); if (x) x.click(); });
    await page.waitForTimeout(600);
    const s7 = await read();
    check('5b and so does ×', !s7.threadShown && s7.form && s7.form.shown, JSON.stringify({ thread: s7.threadShown }));

    /* ===== 6. A REFRESH KEEPS IT; LEAVING DOES NOT ===== */
    await pressDoor();
    await chip('ruby');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3200);
    await stage('MK-314');
    await page.waitForTimeout(1200);
    const s8 = await read();
    const red8 = s8.chips.find(c => c.tone === 'ruby');
    check('6a a refresh puts back the open drawer and the colour it showed', s8.threadShown && !!(red8 && red8.pressed) && s8.rows.filter(r => r.shown).every(r => r.tone === 'ruby'),
      JSON.stringify({ thread: s8.threadShown, red: red8 && red8.pressed, shown: s8.rows.filter(r => r.shown).map(r => r.name) }));
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    await open('MK-314');
    const s9 = await read();
    check('6b leaving the room and coming back lands on Form & links', !s9.threadShown && s9.form && s9.form.shown && s9.door && s9.door.shown, JSON.stringify({ thread: s9.threadShown, door: s9.door }));

    /* ===== 7. NOTHING TO COVER: THE CLAUSES ARE THE PANEL ===== */
    await open('MK-315');
    const s10 = await read();
    check('7 [control] a contract with no form, link or round: the clauses ARE the panel — no door, no ×',
      s10.threadShown && s10.rows.length >= 3 && !(s10.door && s10.door.shown) && !s10.close,
      JSON.stringify({ thread: s10.threadShown, rows: s10.rows.length, door: s10.door, close: s10.close }));
    await page.screenshot({ path: path.join(OUT, '06-one-home.png') });

    /* ===== 8. AT NIGHT ===== */
    await open('MK-314');
    await pressDoor();
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); });
    await page.waitForTimeout(700);
    const night = await page.evaluate(() => { const th = document.getElementById('doc-thread'); const ch = th && th.querySelector('[data-th-tone=""]');
      return { bg: th ? getComputedStyle(th).backgroundColor : '', body: getComputedStyle(document.body).backgroundColor, chip: ch ? getComputedStyle(ch).backgroundColor : '' }; });
    const dark = c => { const v = (String(c).match(/[\d.]+/g) || []).map(Number); return v.length >= 3 && v[0] < 80 && v[1] < 80 && v[2] < 80; };
    check('8 at night the drawer is dark, and the pressed chip stands out of it', dark(night.bg) && !!night.chip && night.chip !== night.bg, JSON.stringify(night));
    await page.screenshot({ path: path.join(OUT, '07-night.png') });
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });

    check('9 [control] no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    console.error(e);
    check('the run finished', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
