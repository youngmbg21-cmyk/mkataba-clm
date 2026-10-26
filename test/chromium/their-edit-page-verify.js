/* Chromium verification — THEIR EDIT PAGE, AND THE SAVE SYMBOL ON BOTH SEATS
   (Young, 28 Sep 2026: "the landing page should come with a button at the top
   that says edit"; "there should be no outline around the clause … If you
   attempt to click elsewhere you get pop up alerting you to save"; "okay we
   will go with symbol … build it both in the counterparty and owner page").
   ============================================================
   Measured off the parity fixture, both seats:

     1  their landing: Edit at the top, no pencil on the paper, the column's
        rows keep their buttons;
     2  Edit opens the editor on their page: the Redlines column stays beside
        it, the foot (Discard / Save) is pinned under the column, the header
        stands down, the wall line stays in view;
     3  the save symbol: hidden until typing, then a drawn disk with no word,
        its hover "Save · Ctrl+S"; Ctrl+S files it and a tick shows, then goes;
     4  a column press with unfiled typing asks "Leave this clause?"; leaving
        drops only the unfiled words and the press goes through;
     5  Exit gives their header back;
     6  OUR seat: the same symbol, Ctrl+S and tick;
     and, on both seats, Save and Discard are live while the caret is still in
     the words (3a2, 6a2), a misspelt defined term is caught (6e), and a
     misspelt word is underlined in red while typing (3a3, 6f, 6g), in the
     narrow window's clause panel too (7).

   Every driven half is GUARDED: a missing control reports FAIL rather than
   sitting out a long wait. Waits ask for the state, bounded. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = process.env.SHOTS_DIR || path.join(__dirname, 'shots', 'their-edit-page');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* A bounded wait that ASKS FOR THE STATE and answers whether it arrived. */
const until = async (page, fn, arg, ms = 5000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_){ return false; }
};
/* A press through the page's own DOM, so a missing control is a false, not a
   thirty-second retry loop. */
const press = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.click(); return true; }, sel);

const pause = ms => new Promise(r => setTimeout(r, ms));

/* A real click in a clause's words on the editor's paper, then End: the
   reader's own way into typing. */
const clickInto = async (page, re) => {
  const at = await page.evaluate(src => {
    const rx = new RegExp(src);
    const cl = [...document.querySelectorAll('#clause-editor #ce-doc [data-clause]')].find(e => rx.test(e.textContent));
    if (!cl) return null;
    const p = [...cl.querySelectorAll('p, div')].find(e => rx.test(e.textContent.trim()) && !e.querySelector('p')) || cl;
    const r = p.getBoundingClientRect();
    return { x: r.left + 40, y: r.top + 8 };
  }, re.source);
  if (!at) return false;
  await page.mouse.click(at.x, at.y);
  await until(page, () => !!document.querySelector('#clause-editor .ce-typing'), null, 3000);
  await page.keyboard.press('End');
  return true;
};
/* The foot's two buttons, read while the caret is still in the box — no
   blur, no press: exactly what the reader sees mid-sentence. */
const footNow = page => page.evaluate(() => {
  const save = document.querySelector('#clause-editor [data-ce-act="save"]');
  const discard = document.querySelector('#clause-editor [data-ce-act="discard"]');
  const a = document.activeElement;
  return { focused: !!(a && a.closest && a.closest('#ce-clausebody')), save: save ? save.disabled : null,
    discard: discard ? discard.disabled : null, word: save ? save.textContent.trim() : '' };
});
/* HaTi's underline: the words its highlight covers, whether the browser's
   own underline is off on the box, and whether the rule paints a wavy line. */
const underlined = page => page.evaluate(() => {
  const h = CSS.highlights && CSS.highlights.get('hati-spell');
  const box = document.getElementById('ce-clausebody');
  let wavy = false;
  for (const sh of document.styleSheets){ let rs; try{ rs = sh.cssRules; }catch(_){ continue; }
    for (const r of rs) if (/::highlight\(hati-spell\)/.test(r.selectorText || '') && /wavy/.test(r.cssText)) wavy = true; }
  return { words: h ? [...h].map(r => r.toString()) : [], native: box ? box.spellcheck : null, wavy };
});
const symbol = page => page.evaluate(() => {
  const b = document.querySelector('#clause-editor #ce-doc .rl-cp-pill-save');
  if (!b) return null;
  const r = b.getBoundingClientRect();
  return { vis: getComputedStyle(b).visibility, tip: b.getAttribute('data-tip'), word: b.textContent.trim(),
    label: b.getAttribute('aria-label'), svg: !!b.querySelector('svg'), x: r.left + r.width / 2, y: r.top + r.height / 2 };
});

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);

  /* ---- 6 · OUR SEAT FIRST (the fixture lands on it) ---- */
  const ourOpen = await page.evaluate(() => {
    const cl = negoClauseList(window.CONTRACT).find(x => /Late payments/.test(x.text || x.body || ''))
      || negoClauseList(window.CONTRACT)[1];
    return window.rlOpenClauseEditor ? rlOpenClauseEditor(window.CONTRACT, cl.clauseId, {}) !== false : false;
  });
  await until(page, () => !!document.getElementById('clause-editor'));
  const ourIn = ourOpen && await clickInto(page, /Late payments/);
  const ourRest = await symbol(page);
  check('6a our seat: the save symbol is placed on the clause, out of sight before typing',
    ourIn && !!ourRest && ourRest.vis === 'hidden', JSON.stringify(ourRest));
  await page.keyboard.type(' Paid promptly.');
  await until(page, () => document.getElementById('clause-editor').classList.contains('ce-typed'), null, 2000);
  const ourFoot = await footNow(page);
  check('6a2 our seat: while the caret is still in the words, Save is live, not grey (no foot Discard since 10 Oct)',
    /* RE-POINTED 11 Oct 2026: ONE PANEL FOR PLAYBOOK AND RISKS retired the
       foot's Discard (your own typing comes back with Ctrl+Z, or the question
       on the way out); the foot is ‹ k of n › and Save. Save is live. */
    ourFoot.focused && ourFoot.save === false && ourFoot.discard === null, JSON.stringify(ourFoot));
  const ourTyped = await symbol(page);
  check('6b …and shows once typed: a drawn disk, no word, named Save, the hover says the keys',
    !!ourTyped && ourTyped.vis === 'visible' && ourTyped.svg && ourTyped.word === '' && ourTyped.label === 'Save'
      && ourTyped.tip === 'Save · Ctrl+S', JSON.stringify(ourTyped));
  await page.keyboard.press('Control+s');
  const ourTick = await until(page, () => !!document.querySelector('#clause-editor .ce-saved-tick'), null, 3000);
  const ourAfter = await page.evaluate(() => ({ dirty: clauseEditorDirty(),
    typed: document.getElementById('clause-editor').classList.contains('ce-typed'),
    filed: /Paid promptly/.test(JSON.stringify(window.CONTRACT.changes || [])) }));
  check('6c Ctrl+S files it on our seat, and a tick shows where the symbol was',
    ourTick && !ourAfter.dirty && !ourAfter.typed && ourAfter.filed, JSON.stringify({ tick: ourTick, ...ourAfter }));
  const ourTickGone = await until(page, () => !document.querySelector('#clause-editor .ce-saved-tick'), null, 3000);
  check('6d the tick goes by itself', ourTickGone);
  /* A MISSPELT DEFINED TERM (Young, 28 Sep 2026: "fix the spelling error
     issue as it is not working"): the fixture's paper says "the Provider"; a
     capitalised slip of it used to pass as a name. */
  await clickInto(page, /Late payments/);
  await page.keyboard.type(' The Provdier pays and recieves.');
  const ul = await until(page, () => { const h = CSS.highlights && CSS.highlights.get('hati-spell'); return !!h && h.size >= 2; }, null, 5000);
  const ulOur = await underlined(page);
  await page.screenshot({ path: path.join(OUT, '06-underline-ours.png') });
  check('6f our seat: while typing, the misspelt words carry HaTi\'s red underline — the same words the Save will list, nothing else',
    ul && ulOur.words.join(',') === 'Provdier,recieves' && ulOur.native === false && ulOur.wavy, JSON.stringify(ulOur));
  await page.keyboard.press('Control+s');
  const spelt = await until(page, () => /Provdier/.test((document.getElementById('ce-spell') || {}).textContent || ''), null, 5000);
  const spell = await page.evaluate(() => ({ list: ((document.getElementById('ce-spell') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
    dirty: clauseEditorDirty(), save: ((document.querySelector('#clause-editor [data-ce-act="save"]') || {}).textContent || '').trim() }));
  check('6e a capitalised slip of the contract\'s own term is caught, with the term as the suggestion, and nothing is filed',
    spelt && /Provider/.test(spell.list) && spell.dirty && /as written/i.test(spell.save), JSON.stringify(spell));
  await page.evaluate(() => rlCloseClauseEditor());
  const ulGone = await page.evaluate(() => !(CSS.highlights && CSS.highlights.has('hati-spell')));
  check('6g closing the page takes the underline with it', ulGone);

  /* ---- 1 · their landing ---- */
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await until(page, () => !!document.querySelector('#rl-changes-col .rl-card'));
  const land = await page.evaluate(() => {
    const e = document.querySelector('#pt-edit');
    const r = e && e.getBoundingClientRect();
    return { edit: !!e && r.width > 0 && r.top < 80, word: e ? e.textContent.trim() : '',
      pencils: document.querySelectorAll('#pt-nego #rl-doc .rl-cp-pill, #pt-nego #rl-doc [data-rl-cp-editor]').length,
      rows: document.querySelectorAll('#rl-changes-col .rl-card').length,
      verbs: [...document.querySelectorAll('#rl-changes-col .rl-card button')].map(b => b.textContent.trim()).filter(Boolean) };
  });
  await page.screenshot({ path: path.join(OUT, '01-landing.png') });
  check('1a Edit is at the top of their page', land.edit && land.word === 'Edit', JSON.stringify({ edit: land.edit, word: land.word }));
  check('1b their paper draws no pencil', land.pencils === 0, land.pencils);
  check('1c their rows keep every button — Accept, Reject, Counter, Edit, Ladder',
    ['Accept', 'Reject', 'Counter', 'Edit', 'Ladder'].every(v => land.verbs.includes(v)), [...new Set(land.verbs)].join(','));

  /* ---- 2 · Edit opens the editing page beside the column ---- */
  if (!(await press(page, '#pt-edit'))) check('2 the Edit button can be pressed', false, 'missing');
  const opened = await until(page, () => { const e = document.getElementById('clause-editor'); return !!e && e.classList.contains('is-theirs'); });
  if (!opened){
    check('2 Edit opens the editing page on their page', false, 'no editor');
    await browser.close(); srv.close();
    console.log(`\n${results.filter(r => r.pass).length} of ${results.length} passed`);
    process.exit(1);
  }
  await pause(300);
  const ed = await page.evaluate(() => {
    const pg = document.getElementById('clause-editor');
    const side = document.querySelector('#pt-nego #rl-side');
    const rail = pg && pg.querySelector('.ce-rail');
    const wall = document.querySelector('#pt-nego #rl-banner');
    const r = pg.getBoundingClientRect(), s = side.getBoundingClientRect(), f = rail.getBoundingClientRect();
    const w = wall && wall.getBoundingClientRect();
    const at = (x, y) => document.elementFromPoint(x, y);
    const colSeen = side.contains(at(s.left + s.width / 2, s.top + 30));
    const footBtns = [...rail.querySelectorAll('.ce-railfoot button')].map(b => b.textContent.trim());
    const typing = pg.querySelector('.ce-typing');
    return { theirs: pg.classList.contains('is-theirs'), right: Math.round(r.right), colLeft: Math.round(s.left), colSeen,
      footUnder: Math.abs(f.left - s.left) < 2 && Math.abs(f.width - s.width) < 2 && f.bottom <= s.bottom + 1 && f.top > s.top,
      footBtns, head: getComputedStyle(document.querySelector('.pw-id')).display,
      wall: !!w && w.height > 0 && w.bottom <= r.top, typing: !!typing,
      symbolShown: [...pg.querySelectorAll('.rl-cp-pill-save')].some(b => getComputedStyle(b).visibility !== 'hidden'),
      /* A PAINTED ring: style none/hidden draws nothing whatever width the
         browser reports — CI's Chromium reports the declared width (30 Sep 2026). */
      ring: [...pg.querySelectorAll('#ce-doc .rl-clause')].some(c => { const cs = getComputedStyle(c);
        return cs.outlineStyle !== 'none' && cs.outlineStyle !== 'hidden' && parseFloat(cs.outlineWidth) > 0; }) };
  });
  await page.screenshot({ path: path.join(OUT, '02-editing.png') });
  check('2a the editor opens on their page and stops short of their Redlines column',
    ed.theirs && ed.right <= ed.colLeft && ed.colSeen, JSON.stringify({ right: ed.right, col: ed.colLeft, seen: ed.colSeen }));
  /* RE-POINTED 5 Oct 2026: the foot's words are "Discard" and "File"/"Save" (one row of feet) */
  /* RE-POINTED 11 Oct 2026: the foot's Discard retired with the one-panel
     change (10 Oct); Save (or File) is the foot's act, under the column. */
  check('2b Save sits under the column, and the retired Discard is not on the foot', ed.footUnder
    && !ed.footBtns.includes('Discard') && ed.footBtns.some(t => /^(Save|File)/.test(t)), ed.footBtns.join(','));
  /* REVERSED 29 Sep 2026 (Young said yes): the "Your table" strip is gone on
       the ordinary live link; its promise rides the Send all hover and heads
       the check before Send. What is measured now is that it is NOT there. */
  check('2c their header stands down, and no strip stands above the page', ed.head === 'none' && !ed.wall,
    JSON.stringify({ head: ed.head, wall: ed.wall }));
  /* A clause with no marks opens ready to type (the editor's arrival rule,
     "nothing to hide"); what the owner asked is that it LOOKS clean. */
  check('2d a clean page: no outline round a clause, no save symbol showing', !ed.ring && !ed.symbolShown,
    JSON.stringify({ ring: ed.ring, symbol: ed.symbolShown }));

  /* ---- 3 · the symbol on their seat ---- */
  const inTheirs = await clickInto(page, /Late payments/);
  const rest = await symbol(page);
  check('3a the symbol is out of sight before anything is typed', inTheirs && !!rest && rest.vis === 'hidden', JSON.stringify(rest));
  await page.keyboard.type(' Paid promptly.');
  await until(page, () => document.getElementById('clause-editor').classList.contains('ce-typed'), null, 2000);
  const theirFoot = await footNow(page);
  check('3a2 their seat: while the caret is still in the words, Save under the column is live',
    theirFoot.focused && theirFoot.save === false && theirFoot.discard === null, JSON.stringify(theirFoot));
  const cleanUl = await underlined(page);
  check('3a3 their seat: correctly spelt words carry no underline', cleanUl.words.length === 0 && cleanUl.native === false, JSON.stringify(cleanUl));
  const typed = await symbol(page);
  check('3b once typed it shows: a drawn disk, no word, "Save · Ctrl+S" on the hover',
    !!typed && typed.vis === 'visible' && typed.svg && typed.word === '' && typed.tip === 'Save · Ctrl+S', JSON.stringify(typed));
  if (typed){ await page.mouse.move(typed.x, typed.y); await pause(250); }
  const tipPainted = await page.evaluate(() => { const b = document.querySelector('#clause-editor .rl-cp-pill-save');
    return b ? getComputedStyle(b, '::after').content : ''; });
  check('3c the hover paints the words', /Save · Ctrl\+S/.test(tipPainted), tipPainted);
  await page.screenshot({ path: path.join(OUT, '03-symbol-hover.png') });
  await page.keyboard.press('Control+s');
  const tick = await until(page, () => !!document.querySelector('#clause-editor .ce-saved-tick'), null, 3000);
  /* A SAVE ASKS WHY (Young, 29 Sep 2026); skipped here — see where-we-are-verify. */
  /* RE-POINTED 10 Oct 2026 (the sixteen red after the pop-ups, item 16): on
     GitHub's slower runner this question arrived after the 3 s the wait gave
     it, so section 4's typing went into ITS box, never the clause's — and with
     nothing unfiled there is rightly nothing to ask. A save on their seat
     always asks why, so the wait asks for that state, bounded and longer. */
  if (await until(page, () => !!document.getElementById('pd-input'), null, 10000)){
    await press(page, '#pd-cancel');
    await until(page, () => !document.getElementById('pd-input'), null, 4000);
  }
  await page.screenshot({ path: path.join(OUT, '04-saved-tick.png') });
  const saved = await page.evaluate(() => ({ dirty: clauseEditorDirty(),
    typed: document.getElementById('clause-editor').classList.contains('ce-typed'),
    words: /Paid promptly/.test(document.getElementById('ce-doc').textContent) }));
  check('3d Ctrl+S files it, the tick shows, the symbol goes', tick && !saved.dirty && !saved.typed && saved.words,
    JSON.stringify({ tick, ...saved }));

  /* ---- 4 · a column press with unfiled typing asks ---- */
  /* SLOW-RUNNER WAITS (10 Oct 2026, "get main to green"): on GitHub's runner
     this section's press went through WITHOUT the question while 4b found the
     typed words gone — the shape of the 3d save still settling (its tick, its
     "Why this change?", its repaint) after the typing began, so the repaint
     took the words and there was rightly nothing unfiled to ask about. Each
     wait below asks for the STATE it needs, bounded; none is a fixed pause. */
  await until(page, () => !document.getElementById('pd-input') && !document.getElementById('confirm-overlay')
    && !document.querySelector('#clause-editor .ce-saved-tick'), null, 10000);
  /* …and the typed words really STAY in the clause's box, counted as unfiled.
     MEASURED on GitHub's runner, 10 Oct 2026: the caret was in the box
     (focus "ce-clausebody") yet the words were gone and nothing was unfiled —
     a late repaint after the 3d save replaced the box after the keys landed.
     So the stage clicks in and types again until the words hold, bounded at
     three tries; a retry is SAID, because a repaint that wipes typing is
     worth a person's eye (BUGLOG, "noticed, not fixed", 10 Oct 2026). */
  /* WHO TOOK THE TYPING (26 Oct 2026, flag C of the flow report): from here
     on, every DOM write is followed by one question — is the clause's box a
     different element, or has it lost the words just typed? — and the answer
     is kept with the code that did it. Measured locally (normal speed, six
     times slower, a slow word list, typing during the save) nothing wipes the
     words; if GitHub's runner ever does, the stage check below prints WHICH
     code rebuilt the box instead of only saying that the words are gone. */
  await page.evaluate(() => {
    window.__boxLog = []; window.__boxT0 = performance.now();
    window.__boxNow = document.getElementById('ce-clausebody');
    window.__boxText = window.__boxNow ? window.__boxNow.textContent : '';
    const look = how => {
      const b = document.getElementById('ce-clausebody'), t = b ? b.textContent : '';
      const lost = /Always\./.test(window.__boxText) && !/Always\./.test(t);
      if (b !== window.__boxNow || lost) window.__boxLog.push({ t: Math.round(performance.now() - window.__boxT0), how,
        rebuilt: b !== window.__boxNow, lost,
        by: String(new Error().stack).split('\n').slice(3, 8).map(s => s.trim().replace(/https?:\/\/[^/]+\//, '')).join(' < ') });
      window.__boxNow = b; window.__boxText = t;
    };
    const wrap = (proto, name) => { const f = proto[name]; proto[name] = function(){ const r = f.apply(this, arguments); look(name); return r; }; };
    const wrapSet = (proto, name) => { const d = Object.getOwnPropertyDescriptor(proto, name);
      Object.defineProperty(proto, name, { ...d, set(v){ d.set.call(this, v); look(name); } }); };
    wrapSet(Element.prototype, 'innerHTML'); wrapSet(Element.prototype, 'outerHTML');
    ['replaceChild', 'removeChild', 'appendChild', 'insertBefore'].forEach(n => wrap(Node.prototype, n));
    ['replaceWith', 'remove', 'insertAdjacentHTML', 'replaceChildren'].forEach(n => wrap(Element.prototype, n));
  });
  let typedIn = false, tries = 0;
  while (!typedIn && tries < 3){
    tries++;
    await clickInto(page, /Late payments/);
    let inBox = await until(page, () => { const a = document.activeElement;
      return !!(a && a.closest && a.closest('#ce-clausebody')); }, null, 4000);
    /* A CLICK THAT DID NOT LAND IN THE BOX IS HELPED, AND SAID (26 Oct 2026): on a
       slow GitHub runner the click once left the focus on the page three times
       running. What this section tests is the column's question over unfiled
       typing, not the click (section 3 tests that), so the stage does what the
       editor's own ceFocusTyping does — the box takes the focus and the caret
       goes to its end — and prints that it had to. */
    if (!inBox){
      inBox = await page.evaluate(() => { const box = document.getElementById('ce-clausebody'); if (!box) return false;
        try { box.focus({ preventScroll: true }); } catch (_){ box.focus(); }
        const r = document.createRange(); r.selectNodeContents(box); r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        const a = document.activeElement; return !!(a && a.closest && a.closest('#ce-clausebody')); });
      console.log(`   note: try ${tries}: the click left the focus outside the box; the box took it itself (${inBox ? 'held' : 'no box to focus'})`);
    }
    await page.keyboard.type(' Always.');
    /* A WAIT ASKS FOR THE STATE, BOUNDED: the typed words are in the box and
       the editor itself counts them as unfiled — the very reading the
       column's guard asks before it raises the question. */
    typedIn = await until(page, () => /Always\./.test((document.getElementById('ce-doc') || {}).textContent || '')
      && ((window.ceBoxDirty && ceBoxDirty()) || (window.clauseEditorDirty && clauseEditorDirty())), null, 4000);
  }
  if (tries > 1) console.log(`   note: the typing had to be made ${tries} times before it held in the box`);
  /* the press is made only on unfiled typing that is really in the clause's
     box — otherwise the stage, not the product, is what failed, and it says so */
  check('4 · stage: the typing is in the clause\u2019s box before the press', typedIn,
    typedIn ? null : 'the typed words never reached the box: ' + JSON.stringify(await page.evaluate(() => ({
      question: !!document.getElementById('pd-input'),
      inBox: /Always\./.test((document.getElementById('ce-doc') || {}).textContent || ''),
      dirty: !!(window.clauseEditorDirty && clauseEditorDirty()),
      focus: (document.activeElement && (document.activeElement.id || document.activeElement.className || document.activeElement.tagName)) || '',
      /* what rebuilt the box, or took the words out of it, while they were being typed */
      boxLog: (window.__boxLog || []).filter(e => e.lost || e.rebuilt).slice(-6) }))));
  const pressed = await page.evaluate(() => { const b = [...document.querySelectorAll('#rl-changes-col button')]
    .find(x => x.textContent.trim() === 'Accept'); if (!b) return false; b.click(); return true; });
  const asked = await until(page, () => !!document.getElementById('confirm-overlay'), null, 8000);
  const askWords = await page.evaluate(() => (document.getElementById('confirm-overlay') || {}).textContent || '');
  await page.screenshot({ path: path.join(OUT, '05-leave-ask.png') });
  check('4a a press on their column with unfiled typing asks "Leave this clause?"',
    pressed && asked && /Leave this clause\?/.test(askWords) && /Leave and lose it/.test(askWords), askWords.replace(/\s+/g, ' ').slice(0, 80));
  await press(page, '#cf-ok');
  await until(page, () => !document.getElementById('confirm-overlay'), null, 2000);
  await pause(500);
  const left = await page.evaluate(() => ({ dirty: clauseEditorDirty(),
    kept: /Paid promptly/.test(document.getElementById('ce-doc').textContent),
    lost: !/Always\./.test(document.getElementById('ce-doc').textContent),
    accepted: /Accepted/.test(document.getElementById('rl-changes-col').textContent) }));
  check('4b leaving drops only the unfiled words, and the press goes through', !left.dirty && left.kept && left.lost && left.accepted,
    JSON.stringify(left));


  /* ---- 5 · Exit gives the header back ---- */
  await page.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"], #clause-editor .ce-exit'); if (b) b.click(); });
  await until(page, () => !document.getElementById('clause-editor'), null, 3000);
  const out = await page.evaluate(() => ({ ed: !!document.getElementById('clause-editor'),
    cls: document.body.classList.contains('pw-editing'), head: getComputedStyle(document.querySelector('.pw-id')).display,
    panel: !!(window.rlCpOpenId && rlCpOpenId()) }));
  check('5 Exit closes the page and their header comes back', !out.ed && !out.cls && out.head !== 'none', JSON.stringify(out));

  /* ---- 7 · the narrow window's clause panel underlines too ---- */
  await page.setViewportSize({ width: 900, height: 900 });
  await page.evaluate(() => window.SHOW_OWNER());
  await until(page, () => !!document.querySelector('#rl-doc [data-rl-cp-open]'));
  const opened7 = await page.evaluate(() => { const b = [...document.querySelectorAll('#rl-doc [data-rl-cp-open]')]
    .find(x => x.getAttribute('data-rl-cp-open') !== 'front'); if (!b) return false; b.click(); return true; });
  await until(page, () => !!document.querySelector('[data-rl-cp-edit]'), null, 3000);
  await press(page, '[data-rl-cp-edit]');
  const boxed7 = await until(page, () => !!document.querySelector('.nego-editing[contenteditable="true"]'), null, 3000);
  if (opened7 && boxed7){
    await page.evaluate(() => { const b = document.querySelector('.nego-editing[contenteditable="true"]');
      const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); b.focus(); });
    await page.keyboard.type(' The Provdier recieves.');
  }
  await until(page, () => { const h = CSS.highlights && CSS.highlights.get('hati-spell'); return !!h && h.size >= 2; }, null, 5000);
  const ul7 = await page.evaluate(() => { const h = CSS.highlights && CSS.highlights.get('hati-spell');
    const b = document.querySelector('.nego-editing[contenteditable="true"]');
    return { words: h ? [...h].map(r => r.toString()) : [], native: b ? b.spellcheck : null }; });
  check('7 on a narrow window the clause panel\'s box underlines the same way', opened7 && boxed7
    && ul7.words.join(',') === 'Provdier,recieves' && ul7.native === false, JSON.stringify({ opened7, boxed7, ...ul7 }));

  /* 4c/4d run LAST since 26 Oct 2026: they type into a box of their own and take the
     focus with them, so standing before section 4 they could leave its first click
     with nowhere to land (GitHub, PR #485: focus on the page, "boxLog: []"). */
  /* ---- 4c/4d · WORDS TYPED AT A STRUCK RUN ARE NEVER LOST (26 Oct 2026) ----
     What GitHub's runner showed, once section 4 could name the culprit: the
     typed words had gone INTO a struck run (some Chromium builds take a point
     just after an inline element as the end of its text), and ceMarksClear —
     run by every repaint of the marks and by every read of the box for a save
     (ceBoxHtml) — removed the run and the words with it. This container's
     Chromium never puts them there and this fixture draws no struck run at
     that moment, so the two checks build a box of their own with one, wired
     the way the editor's is (ceAtomWall on beforeinput), and drive it with
     real keys. 4c: words typed at the run's end land beside it. 4d: words that
     DID land inside it (as that Chromium does) are read for the save, put back
     beside it by the clear, and the caret's count lands after them.
     Red at the parent: 4d (the read and the clear dropped the words). */
  const runBox = async extra => page.evaluate(x => {
    document.getElementById('t-runbox')?.remove();
    const b = document.createElement('div'); b.id = 't-runbox'; b.contentEditable = 'true';
    b.style.cssText = 'position:fixed;left:20px;bottom:20px;width:520px;z-index:99999;background:#fff;font:15px serif;padding:8px';
    b.innerHTML = '<p>Late payments are charged<del class="hati-del nego-del rl-them" data-ce-mark="del" data-ce-was=" at two per cent"> at two per cent' + (x || '') + '</del></p>';
    document.body.appendChild(b);
    b.addEventListener('beforeinput', ev => window.ceAtomWall(b, ev));
    b.focus();
    const t = b.querySelector('del').firstChild;
    const r = document.createRange(); r.setStart(t, t.data.length); r.collapse(true);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    return true;
  }, extra);
  await runBox('');
  await page.keyboard.type(' Kept.');
  const typedAt = await page.evaluate(() => { const b = document.getElementById('t-runbox');
    const run = b.querySelector('[data-ce-mark="del"]');
    const read = window.ceBoxHtml(b);
    return { run: run ? run.textContent : null, read: /Kept\./.test(read), shown: /Kept\./.test(b.textContent) }; });
  check('4c words typed at the end of a struck run land beside it, not in it, and the save reads them',
    typedAt.run === ' at two per cent' && typedAt.read && typedAt.shown, JSON.stringify(typedAt));
  await runBox(' Forced.');
  const inside = await page.evaluate(() => { const b = document.getElementById('t-runbox');
    const read = /Forced\./.test(window.ceBoxHtml(b));
    const kept = window.ceMarksClear(b);
    const txt = b.textContent;
    return { read, shown: /Forced\./.test(txt), noRun: !b.querySelector('[data-ce-mark="del"]'),
      caretAfter: !!kept && kept.after === txt.indexOf(' Forced.') + ' Forced.'.length };
  });
  check('4d words that landed inside a struck run are read for the save, kept by the clear, and the caret count lands after them',
    inside.read && inside.shown && inside.noRun && inside.caretAfter, JSON.stringify(inside));
  await page.evaluate(() => document.getElementById('t-runbox')?.remove());

  await browser.close(); srv.close();
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed} of ${results.length} passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
