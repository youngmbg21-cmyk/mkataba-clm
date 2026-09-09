/* Chromium verification: THE STANDARDS PAGE — the row opens, the playbook learns.
   ============================================================
   Owner-asked 9 Sep 2026 off a screenshot of "Our standards", and then ruled
   on four decisions: the closed row states the position, keeps ONE LINE of
   wording clipped by WIDTH, the learned proposals read the last QUARTER, and
   the two tabs stay apart.

   WHY A BROWSER FILE. f272 pins the readings and the words; every claim here
   is a MEASUREMENT or a PRESS, and three of them cannot be asked anywhere
   else:

     · "one line, clipped by width" is a GEOMETRY. A source check sees
       `text-overflow:ellipsis` and cannot see whether the rule reached the
       element — this codebase's most repeated visual defect is a rule that
       looks perfectly correct and lost a cascade fight, and these classes are
       written in a <style> block inside the page rather than in index.html,
       which is exactly the arrangement that can fail silently;
     · "the row opens" is a PRESS. A handler that is attached is not a handler
       that lands, and a body rendered into markup is not a body on screen;
     · and the page must SURVIVE being drawn at all — renderStandardsDraft and
       the rewritten renderPrecedentPanel are called from renderClauseLibrary,
       so a throw in either takes the whole tab down and no node test can see
       it.

   Run: node test/chromium/standards-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'standards-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* THE FIXTURE IS THE CLAIM, and it is the same one f272 makes: payment
   settled at 45 three times inside the quarter and at 90 twice over a year
   ago. Payment is higher-is-worse, so all-time the held figure is 90 and this
   quarter it is 45 — the window CHANGES the answer rather than trimming it.
   The seeded book carries no settled rounds of its own, so without this the
   learned card would never draw and every claim below would be vacuous. */
const SEED = () => {
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const ch = (id, at, txt) => ({ id, clauseId: 'c1', clauseLabel: 'Payment terms',
    oldText: 'within thirty (30) days', newText: txt, status: 'accepted',
    withdrawn: false, authorSide: 'counterparty', author: 'Them',
    createdAt: at, updatedAt: at });
  const mk = (id, changes) => ({ id, name: 'Staged ' + id, counterparty: 'Naivas',
    status: 'Signed', folder: 'proc', value: 1000000, valueType: 'estimated',
    fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
    signatures: [], comments: [], changes, negotiation: { round: 2 } });
  state.contracts.unshift(
    mk('SP-1', [ch('CX1', ago(10), 'within forty-five (45) days')]),
    mk('SP-2', [ch('CX2', ago(20), 'within forty-five (45) days'),
                ch('CX3', ago(30), 'within forty-five (45) days')]),
    mk('SP-3', [ch('CX4', ago(400), 'within ninety (90) days'),
                ch('CX5', ago(420), 'within ninety (90) days')]),
  );
  setView('playbook');
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    await page.evaluate(SEED);
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '01-standards.png'), fullPage: true });

    /* ================= 0 · THE CONTROL — the page drew at all ================ */
    const rows = await page.evaluate(() => {
      const r = [...document.querySelectorAll('[data-std-row]')];
      return { n: r.length, ids: r.map(e => e.getAttribute('data-std-row')) };
    });
    check('0a · the page drew and every clause is a row',
      rows.n >= 6, rows);
    check('0b · and nothing on it threw',
      errors.length === 0, errors.slice(0, 3));

    /* ================= 1 · RULING 1 — the position, on the closed row ======= */
    /* READ THE POSITION CHIP BY ITS OWN CLASS. A bare .std-chip resolves to
       whichever chip comes first, and on a row with no position that is the
       FALLBACK — so the probe would report a chip on a row that draws none. */
    const chips = await page.evaluate(() => [...document.querySelectorAll('[data-std-row]')].map(e => {
      const c = e.querySelector('.std-chip-pos');
      const s = c ? getComputedStyle(c) : null;
      return { id: e.getAttribute('data-std-row'), txt: c ? c.textContent.trim() : null,
        title: c ? c.getAttribute('title') : null,
        bg: s ? s.backgroundColor : null, border: s ? s.borderTopWidth : null,
        chips: e.querySelectorAll('.std-chip').length };
    }));
    const pay = chips.find(c => c.id === 'cl-pay');
    const conf = chips.find(c => c.id === 'cl-conf');
    check('1a · the closed row states the position, in words',
      pay && /preferred|önskvärt/i.test(pay.txt || ''), pay);
    check('1b · a required position says so',
      conf && /required|krav/i.test(conf.txt || ''), conf);
    /* PARTIAL IS DRAWN QUIETER — measured as PAINT, because a filled chip and
       an outlined one are the same markup with a different style attribute. */
    check('1c · a position true of only some contract types is an outline, not a fill',
      conf && parseFloat(conf.border) >= 1
        && (conf.bg === 'rgba(0, 0, 0, 0)' || conf.bg === 'transparent'),
      { border: conf && conf.border, bg: conf && conf.bg });
    check('1d · and the chip says WHICH types on its own hover',
      conf && /,|and|professional|nda/i.test(conf.title || ''), conf && conf.title);
    const term = chips.find(c => c.id === 'cl-term');
    check('1e · a clause the playbook says nothing about draws no position at all',
      term && term.txt === null && term.chips === 1,
      'silence is the honest answer; the one chip left is its fallback: ' + JSON.stringify(term));

    /* ================= 2 · RULING 2 — one line, clipped by WIDTH ============ */
    const clip = await page.evaluate(() => {
      const e = document.querySelector('[data-std-row="cl-law"] .std-clip');
      if (!e) return null;
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      const line = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.5;
      return { h: Math.round(r.height), line: Math.round(line), w: Math.round(r.width),
        overflow: s.textOverflow, wrap: s.whiteSpace,
        clipped: e.scrollWidth > e.clientWidth + 1,
        textLen: e.textContent.trim().length,
        titleLen: (e.getAttribute('title') || '').length };
    });
    check('2a · the wording is exactly one line tall',
      clip && clip.h <= clip.line + 3, clip);
    check('2b · it never wraps, and the ellipsis rule really reached the element',
      clip && clip.overflow === 'ellipsis' && clip.wrap === 'nowrap', clip);
    /* THE CUT IS A WIDTH, AND THIS IS THE ONLY WAY TO SAY SO. At 1500px that
       sentence fits, so a check that merely found it clipped would be reading
       the window rather than the rule — narrow the page and the SAME row must
       clip, and stay one line while it does. A character count would cut at
       exactly the same place on both. */
    await page.setViewportSize({ width: 900, height: 1000 });
    await pause(400);
    const narrow = await page.evaluate(() => {
      const e = document.querySelector('[data-std-row="cl-law"] .std-clip');
      if (!e) return null;
      const s = getComputedStyle(e), r = e.getBoundingClientRect();
      return { h: Math.round(r.height), line: Math.round(parseFloat(s.lineHeight)),
        clipped: e.scrollWidth > e.clientWidth + 1, w: Math.round(r.width) };
    });
    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(400);
    check('2b2 · narrow the page and the same row clips — the cut follows the width',
      narrow && clip && narrow.clipped && narrow.h <= narrow.line + 3 && !clip.clipped,
      { wide: clip && { w: clip.w, clipped: clip.clipped }, narrow });
    check('2c · nothing was cut in the MARKUP — the whole sentence is there to hover',
      clip && clip.titleLen === clip.textLen && clip.textLen > 140,
      { text: clip && clip.textLen, title: clip && clip.titleLen });
    const fbchip = await page.evaluate(() => {
      const c = document.querySelector('[data-std-row="cl-pay"] .std-chip-fb');
      return c ? c.textContent.trim() : null;
    });
    check('2d · and the fallback is on the closed row, as a figure',
      /45/.test(fbchip || ''), fbchip);

    /* ================= 3 · THE ROW OPENS — a real press =================== */
    /* EVERY DRIVEN HALF IS GUARDED so a build without the feature reports its
       failures rather than timing out on a control that is not there. */
    const canOpen = await page.evaluate(() => !!document.querySelector('[data-std-open="cl-pay"]'));
    const before = await page.evaluate(() =>
      !!document.querySelector('[data-std-row="cl-pay"] .std-body'));
    if (canOpen) { await page.click('[data-std-open="cl-pay"]'); await pause(400); }
    await page.screenshot({ path: path.join(OUT, '02-open.png'), fullPage: true });
    const opened = await page.evaluate(() => {
      const e = document.querySelector('[data-std-row="cl-pay"]');
      const b = e && e.querySelector('.std-body');
      if (!b) return { open: false };
      const r = b.getBoundingClientRect();
      const q = [...b.querySelectorAll('.std-quote')].map(x => x.textContent.trim().length);
      return { open: true, h: Math.round(r.height), w: Math.round(r.width),
        quotes: q, labs: [...b.querySelectorAll('.std-lab')].map(x => x.textContent.trim()),
        acts: [...b.querySelectorAll('.std-acts button')].map(x => x.textContent.trim()),
        others: document.querySelectorAll('.std-body').length };
    });
    check('3a · it was shut, and the press opened it as visible pixels',
      !before && opened.open && opened.h > 40 && opened.w > 200, { before, opened });
    check('3b · both halves are on it, each named',
      opened.quotes && opened.quotes.length === 2 && opened.quotes.every(n => n > 10)
      && opened.labs.length === 2, opened.labs);
    check('3c · one row open at a time',
      opened.others === 1, { open: opened.others });
    if (canOpen) { await page.click('[data-std-open="cl-law"]'); await pause(400); }
    const swapped = await page.evaluate(() => ({
      law: !!document.querySelector('[data-std-row="cl-law"] .std-body'),
      pay: !!document.querySelector('[data-std-row="cl-pay"] .std-body'),
    }));
    check('3d · and opening another closes the first',
      swapped.law && !swapped.pay, swapped);

    /* ================= 4 · RULING 3 — the last quarter ==================== */
    const learned = await page.evaluate(() => {
      const h = document.getElementById('precedent-panel');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { h: Math.round(r.height), txt: h.textContent.replace(/\s+/g, ' ').trim(),
        pref: [...h.querySelectorAll('[data-std-pref]')].map(b => b.textContent.trim()),
        fb: [...h.querySelectorAll('[data-std-fb]')].map(b => b.textContent.trim()) };
    });
    check('4a · the learned card drew, and it says which window it read',
      learned && learned.h > 40 && /–|-/.test(learned.txt), learned && learned.txt.slice(0, 120));
    check('4b · the figure is this QUARTER\'s 45, not the 90 held over a year ago',
      learned && /\b45\b/.test(learned.txt) && !/\b90\b/.test(learned.txt),
      learned && learned.txt.slice(0, 200));
    check('4c · and it proposes moving the preferred, which the old panel never did',
      learned && learned.pref.length === 1 && /45/.test(learned.pref[0]),
      { pref: learned && learned.pref, fb: learned && learned.fb });

    /* MOVING A PREFERRED OPENS THE EDITOR AND WRITES NOTHING — driven, because
       "it opens the editor" is a journey and a source check cannot see whether
       the confirm was answered or the modal ever appeared. */
    const libBefore = await page.evaluate(() => JSON.stringify(clauseLibrary()));
    const canPref = await page.evaluate(() => !!document.querySelector('[data-std-pref]'));
    if (canPref) { await page.click('[data-std-pref]'); await pause(500); }
    const dlg = await page.evaluate(() => {
      const b = [...document.querySelectorAll('#modal-root button, [data-top-overlay] button')];
      return { n: b.length, labels: b.map(x => x.textContent.trim()) };
    });
    check('4d · it asks before it does anything',
      dlg.n >= 2, dlg.labels);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#modal-root button, [data-top-overlay] button')];
      const go = b.find(x => /edit|ändra/i.test(x.textContent)) || b[b.length - 1];
      if (go) go.click();
    });
    await pause(600);
    await page.screenshot({ path: path.join(OUT, '03-editor.png'), fullPage: true });
    const after = await page.evaluate(() => ({
      lib: JSON.stringify(clauseLibrary()),
      editor: !!document.getElementById('ce-preferred'),
    }));
    check('4e · the clause editor is open with the wording in it',
      after.editor, { editor: after.editor });
    check('4f · and NOTHING was written — a person still has to press Save',
      after.lib === libBefore, { moved: after.lib !== libBefore });

    /* THE EDITOR SECTION 4 OPENED IS STILL UP, and its scrim swallows every
       press after it — a probe that leaves a modal standing reports the next
       section as broken product. Close it before staging anything else. */
    await page.evaluate(() => { if (typeof closeModal === 'function') closeModal(); });
    await pause(400);

    /* ================= 6 · IDEA 21 — read off what was signed ============= */
    /* THE OFFER IS ONLY MADE TO A WORKSPACE THAT HAS SAVED NEITHER a clause
       library nor a playbook, so it is staged rather than assumed: the seeded
       book may carry either. Four signed contracts, three of them paying at
       60 against a standard that says 30 — a pattern that DIFFERS, which is
       the only case that proposes anything. */
    await page.evaluate(() => {
      state.settings = Object.assign({}, state.settings);
      delete state.settings.clauseLibrary; delete state.settings.playbook;
      const mk = (id, days, law) => ({ id, name: 'Signed ' + id, counterparty: 'Naivas',
        status: 'Signed', folder: 'proc', fields: {}, obligations: [], audit: [],
        rounds: [], versions: [], signatures: [], comments: [], changes: [],
        metadata: { paymentTerms: days + ' days from invoice', governingLaw: law } });
      /* AND THE GOVERNING LAWS DEPART, which is the owner's own case (9 Sep
         2026): four recorded, all different, one naming home. Seeded all-Kenya
         the row would only ever say "Already matches" and the finding this
         section exists for could not be measured at all. */
      state.contracts.unshift(mk('SG-1', 60, 'California'), mk('SG-2', 60, 'Delaware'),
        mk('SG-3', 60, 'England and Wales'), mk('SG-4', 30, 'Kenya'));
      setView('playbook');
    });
    await pause(1000);
    await page.screenshot({ path: path.join(OUT, '04-offer.png'), fullPage: true });
    const offer = await page.evaluate(() => {
      const h = document.getElementById('standards-draft');
      if (!h) return null;
      const r = h.getBoundingClientRect();
      return { h: Math.round(r.height), txt: h.textContent.replace(/\s+/g, ' ').trim(),
        go: !!h.querySelector('[data-std-draft-go]'),
        rows: h.querySelectorAll('[data-std-draft-row]').length };
    });
    check('6a · the offer draws, and it does not claim "no standards yet"',
      offer && offer.h > 40 && offer.go && !/no standards/i.test(offer.txt)
      && /still on/i.test(offer.txt), offer && offer.txt.slice(0, 110));
    check('6b · and it is an OFFER — the comparison is behind a press',
      offer && offer.rows === 0, offer && offer.rows);
    const canGo = await page.evaluate(() => !!document.querySelector('[data-std-draft-go]'));
    if (canGo) { await page.click('[data-std-draft-go]'); await pause(500); }
    await page.screenshot({ path: path.join(OUT, '05-comparison.png'), fullPage: true });
    const table = await page.evaluate(() => {
      const h = document.getElementById('standards-draft');
      if (!h) return { pay: null, law: null, txt: '', n: 0 };
      const row = k => {
        const e = h.querySelector(`[data-std-draft-row="${k}"]`);
        if (!e) return null;
        return { cells: [...e.querySelectorAll('td')].map(c => c.textContent.trim()),
          adopt: !!e.querySelector('[data-std-adopt]') };
      };
      return { pay: row('payment'), law: row('law'),
        txt: h.textContent.replace(/\s+/g, ' ').trim(),
        n: h.querySelectorAll('[data-std-draft-row]').length };
    });
    check('6c · the comparison arrived, a row per subject',
      table.n >= 3, { n: table.n });
    check('6d · a standard that disagrees with the book is proposed, with both figures shown',
      table.pay && table.pay.adopt && table.pay.cells.some(c => /60/.test(c))
      && table.pay.cells.some(c => /30/.test(c)), table.pay);
    check('6d2 · and the verb names the MOVE, not "Adopt" — it opens an editor',
      !!(table.pay && /move|flytta/i.test(table.pay.cells[table.pay.cells.length - 1])),
      table.pay && table.pay.cells[table.pay.cells.length - 1]);
    check('6e · and what HaTi cannot read off the record is NAMED',
      /confidentiality/i.test(table.txt) && /data protection/i.test(table.txt),
      table.txt.slice(-150));

    /* ---- THE GOVERNING LAW ROW, owner-reported 9 Sep 2026 ----
       It printed "Nothing to compare — your standard is wording, not a
       figure" over a standard sitting visible below it saying Sweden, and
       with the comparison missing it was dropping the strongest finding the
       card can make. MEASURED AS PAINT, because the whole complaint was about
       what the row SAID: the reading can be right while the cells still read
       wrong. */
    const home = await page.evaluate(() =>
      (typeof jxName === 'function' ? jxName() : ''));
    check('6i · the standard column NAMES the market, not "nothing to compare"',
      !!(table.law && home && table.law.cells.some(c => c.includes(home))
         && !table.law.cells.some(c => /nothing to compare|inget att jämföra/i.test(c))),
      { home, cells: table.law && table.law.cells });
    /* "1 of 4" ALONE IS NOT THE CLAIM — the old row printed that too, meaning
       how many shared a spelling. What is new is what the count is OF. */
    check('6j · and the row COUNTS how many of the signed book name it',
      !!(table.law && /1 of 4 name it|1 av 4 anger den/.test(table.law.cells.join(' | '))),
      table.law && table.law.cells);
    check('6k · the finding is stated — three name a different law',
      !!(table.law && /\b3\b/.test(table.law.cells[table.law.cells.length - 1])
         && /different law|annan lag/i.test(table.law.cells[table.law.cells.length - 1])),
      table.law && table.law.cells[table.law.cells.length - 1]);
    check('6l · "what you usually sign" claims nothing where one in four is not a habit',
      !!(table.law && /no usual value|inget vanligt värde/i.test(table.law.cells[1])
         && !/california/i.test(table.law.cells[1])),
      table.law && table.law.cells[1]);
    /* A CONTROL: true before this fix and after it. Its job is to fail the day
       somebody gives this row a button, which would be a second door onto a
       settings act that already has one. */
    check('6m · and it presses nothing — a governing law moves with the market setting',
      !!(table.law && table.law.adopt === false),
      table.law && { adopt: table.law.adopt });
    /* IT OPENS THE EDITOR AND WRITES NOTHING — driven, and this is the check
       that caught the defect it now pins. Written as a straight write, the
       press replaced "The Buyer shall pay each undisputed invoice within
       thirty (30) days…" with "Payment terms at 60 days.": the company's
       drafted clause thrown away to move a number inside it. */
    const payBefore = await page.evaluate(() =>
      (clauseLibrary().find(c => c.id === 'cl-pay') || {}).preferred || '');
    const canAdopt = await page.evaluate(() =>
      !!document.querySelector('[data-std-draft-row="payment"] [data-std-adopt]'));
    if (canAdopt) { await page.click('[data-std-draft-row="payment"] [data-std-adopt]'); await pause(500); }
    const asked = await page.evaluate(() => ({
      labels: [...document.querySelectorAll('#modal-root button, [data-top-overlay] button')]
        .map(b => b.textContent.trim()),
      msg: (document.querySelector('#modal-root p, [data-top-overlay] p') || {}).textContent || '',
    }));
    check('6f · it asks first, and the question names the figure it read',
      asked.labels.length >= 2 && /60/.test(asked.msg), asked);
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('#modal-root button, [data-top-overlay] button')];
      const go = b.find(x => /edit|ändra/i.test(x.textContent)) || b[b.length - 1];
      if (go) go.click();
    });
    await pause(700);
    const payAfter = await page.evaluate(() => ({
      pref: (clauseLibrary().find(c => c.id === 'cl-pay') || {}).preferred || '',
      editor: !!document.getElementById('ce-preferred'),
    }));
    check('6g · the clause editor opened on that clause',
      payAfter.editor, { editor: payAfter.editor });
    check('6h · and the drafted wording is UNTOUCHED — a person still writes it',
      payAfter.pref === payBefore && payBefore.length > 40,
      { before: payBefore.slice(0, 60), after: payAfter.pref.slice(0, 60) });

    /* ================= 5 · RULING 4 — two tabs, not one =================== */
    const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-pb-tab]')]
      .map(e => e.getAttribute('data-pb-tab')));
    check('5a · the clause library and the negotiation playbook are still two tabs',
      tabs.includes('clauses') && tabs.includes('playbook'), tabs);

    check('9 · and the whole journey raised no page error',
      errors.length === 0, errors.slice(0, 3));

  } catch (e) {
    check('RUN', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
