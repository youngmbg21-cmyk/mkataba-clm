/* Chromium verification: the three readings and a More menu on their page.
   ============================================================
   Owner-asked, 15 Aug 2026 (OI-8), from a screenshot of the owner's own room:
   put the Redlined / As agreed / With changes switch on the counterparty's
   page, and give them a More menu carrying three of the owner's nine rows —
   PDF (clean copy), Word (tracked changes) and Focus mode. And only those
   three: importing a Word file writes to OUR record, Save as template fills
   OUR library, Delete destroys OUR contract, and Compare versions is already
   served by the Compare wording button a few pixels to its left.

   WHY THIS FILE AND NOT A NODE TEST. Every claim here is pixels and presses:
   that the switch is on screen in a header that already wraps, that pressing
   a segment actually changes the wording drawn on the paper, that the menu
   opens under its own button and not off the edge, that it is a MENU and not
   a select, that focus mode hides this page's header and Escape brings it
   back, and — the one that matters most — that the six rows the owner
   excluded are nowhere on the page. jsdom resolves no cascade, has no layout
   engine, and will happily press a control no reader could see.

   WHAT IS MEASURED:
     1  the reading switch is in THEIR header, visible, with three segments
     2  pressing each segment changes the wording actually drawn on the paper
     3  the switch and the document agree about which reading is on
     4  the More button is visible and is a real menu, not a <select>
     5  it opens under its own button, inside the window
     6  it carries exactly three rows, in two named groups
     7  the six owner-only rows are absent from the whole page
     8  focus mode hides their header and the notice stack, Escape restores it
     9  the wall line survives focus mode — a posture may not hide a promise
    10  the header still lays out on one row at 1440 and wraps without overlap
    11  outside-press and Escape close the menu
    12  the owner's own room is unchanged — same switch, same nine rows
    13  no page errors anywhere in the run

   Screenshots go to test/chromium/shots/cpmore/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'cpmore');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

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
const pause = ms => new Promise(r => setTimeout(r, ms));

/* A control is present when it paints pixels, not when it exists. */
const SEEN = `(el => { if (!el) return null;
  const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
  return { on: r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden',
    left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
    bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; })`;

/* The wording the reader actually sees on the paper, with the marks flattened
   away — what the three readings are FOR. */
const PAPER = `(() => {
  const p = document.querySelector('#pt-nego .redline-page .nego-scroll')
    || document.querySelector('#pt-nego .nego-scroll')
    || document.querySelector('#pt-nego');
  if (!p) return { text: '', ins: 0, del: 0 };
  return { text: (p.textContent || '').replace(/\\s+/g, ' ').trim(),
    ins: p.querySelectorAll('ins').length, del: p.querySelectorAll('del').length };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.evaluate(() => window.READY);
    await pause(400);

    /* ---- 12a. THE OWNER'S ROOM FIRST, as the baseline this must not move ---- */
    const ownerBefore = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const wrap = document.querySelector('#view-redline .rl-readwrap');
      return { box: s(wrap),
        segs: [...document.querySelectorAll('#view-redline .rl-readwrap .rl-seg')].map(b => b.textContent.trim()) };
    }, [SEEN]);
    check('12 the owner\'s own reading switch is untouched — three segments, still drawn',
      ownerBefore.box && ownerBefore.box.on && ownerBefore.segs.length === 3,
      JSON.stringify(ownerBefore.segs));

    await page.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '01-their-page.png') });

    /* ---- 1. THE READING SWITCH IS IN THEIR HEADER ---- */
    const sw = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const wrap = document.querySelector('.pw-id .rl-readwrap');
      const head = document.querySelector('.pw-id');
      const segs = [...document.querySelectorAll('.pw-id .rl-readwrap .rl-seg')];
      return { box: s(wrap), inHead: !!(wrap && head && head.contains(wrap)),
        labels: segs.map(b => b.textContent.trim()),
        boxes: segs.map(b => s(b)),
        pressed: segs.map(b => b.getAttribute('aria-pressed')) };
    }, [SEEN]);
    check('1 THE READING SWITCH IS IN THEIR HEADER, as visible pixels',
      sw.box && sw.box.on && sw.inHead, JSON.stringify(sw.box));
    check('1 three segments, each drawn', sw.labels.length === 3
      && sw.boxes.every(b => b && b.on), JSON.stringify(sw.labels));
    check('1 exactly one of them reads as chosen',
      sw.pressed.filter(x => x === 'true').length === 1, JSON.stringify(sw.pressed));

    /* ---- 2 & 3. PRESSING ONE CHANGES THE PAPER ----
       The claim that matters. Their document renderer has always honoured the
       setting; what was missing was any way to set it. So the proof is not
       that a button lights up — it is that the WORDING ON THE PAPER moves. */
    const readings = {};
    for (const want of ['marks', 'agreed', 'proposed']){
      await page.click(`.pw-id .rl-readwrap [data-rl-read="${want}"]`);
      await pause(500);
      readings[want] = await page.evaluate(([paper]) => {
        const p = eval(paper);
        const on = [...document.querySelectorAll('.pw-id .rl-readwrap .rl-seg')]
          .filter(b => b.getAttribute('aria-pressed') === 'true')
          .map(b => b.getAttribute('data-rl-read'));
        return { ...p, on };
      }, [PAPER]);
      await page.screenshot({ path: path.join(OUT, `02-reading-${want}.png`) });
    }
    check('3 the switch and the page agree about which reading is on',
      ['marks', 'agreed', 'proposed'].every(k => readings[k].on.length === 1 && readings[k].on[0] === k),
      JSON.stringify(Object.fromEntries(Object.entries(readings).map(([k, v]) => [k, v.on]))));
    check('2 REDLINED draws marks on the paper',
      readings.marks.ins + readings.marks.del > 0,
      `${readings.marks.ins} insertions, ${readings.marks.del} deletions`);
    check('2 AS AGREED takes the marks off',
      readings.agreed.ins === 0 && readings.agreed.del === 0,
      `${readings.agreed.ins} insertions, ${readings.agreed.del} deletions`);
    check('2 WITH CHANGES takes them off too, and is not the same wording as As agreed',
      readings.proposed.ins === 0 && readings.proposed.del === 0
      && readings.proposed.text !== readings.agreed.text,
      readings.proposed.text === readings.agreed.text
        ? 'the two clean readings drew identical text — one of them is not doing its job'
        : 'the two clean readings differ, as they must');

    /* ---- 2b. AND A NON-DEFAULT READING SAYS SO, WITH THE WAY BACK ----
       The standing rule, and the most expensive thing this page could get
       wrong: a document silently missing its strikes looks like a document
       with nothing on the table. The notice is built into the shared panes, so
       it SHOULD arrive by construction on their seat — which is the claim, not
       the proof. */
    await page.click('.pw-id .rl-readwrap [data-rl-read="agreed"]');
    await pause(600);
    const notice = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const n = document.getElementById('rl-read-note');
      return { box: s(n), text: n ? (n.textContent || '').replace(/\s+/g, ' ').trim() : '',
        back: !!document.querySelector('#rl-read-note [data-rl-read="marks"]') };
    }, [SEEN]);
    check('2b a non-default reading says so on their page, in visible pixels',
      notice.box && notice.box.on, notice.text.slice(0, 90));
    check('2b and the way back is on the notice itself', notice.back);

    /* back to the default before the rest of the run */
    await page.click('.pw-id .rl-readwrap [data-rl-read="marks"]');
    await pause(350);

    /* ---- 4, 5, 6. THE MENU ---- */
    const moreShut = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const b = document.getElementById('pt-more');
      const m = document.getElementById('pt-more-menu');
      return { btn: s(b), tag: b ? b.tagName : null,
        selects: document.querySelectorAll('.pw-id select').length,
        menuHidden: !!(m && m.classList.contains('hidden')),
        expanded: b ? b.getAttribute('aria-expanded') : null };
    }, [SEEN]);
    check('4 the More button is visible pixels', moreShut.btn && moreShut.btn.on,
      JSON.stringify(moreShut.btn));
    check('4 IT IS A MENU, NOT A SELECT — these three rows are acts, not a setting',
      moreShut.tag === 'BUTTON' && moreShut.selects === 0,
      `button=${moreShut.tag}, selects in the header=${moreShut.selects}`);
    check('4 and it starts shut', moreShut.menuHidden && moreShut.expanded === 'false');

    await page.click('#pt-more');
    await pause(350);
    await page.screenshot({ path: path.join(OUT, '03-more-open.png') });
    const moreOpen = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const m = document.getElementById('pt-more-menu');
      const b = document.getElementById('pt-more');
      const rows = [...m.querySelectorAll('button')].map(x => ({
        id: x.id, text: x.textContent.replace(/\s+/g, ' ').trim(), box: s(x) }));
      const groups = [...m.querySelectorAll('.mgroup')].map(x => x.textContent.trim());
      return { box: s(m), btn: s(b), rows, groups,
        expanded: b.getAttribute('aria-expanded'),
        win: { w: innerWidth, h: innerHeight } };
    }, [SEEN]);
    check('5 it opens, under its own button and inside the window',
      moreOpen.box && moreOpen.box.on
      && moreOpen.box.top >= moreOpen.btn.bottom - 2
      && moreOpen.box.left >= 0 && moreOpen.box.right <= moreOpen.win.w,
      JSON.stringify(moreOpen.box));
    check('5 aria-expanded turns over', moreOpen.expanded === 'true');
    check('6 exactly three rows, every one of them drawn',
      moreOpen.rows.length === 3 && moreOpen.rows.every(r => r.box && r.box.on),
      moreOpen.rows.map(r => r.id).join(', '));
    check('6 they are PDF, Word and Focus mode',
      ['pt-pdf', 'pt-word', 'pt-focus'].every(id => moreOpen.rows.some(r => r.id === id)),
      moreOpen.rows.map(r => r.text).join(' | '));
    check('6 in two named groups', moreOpen.groups.length === 2, JSON.stringify(moreOpen.groups));

    /* ---- 7. THE SIX ROWS THE OWNER EXCLUDED ARE NOWHERE ON THE PAGE ----
       Not "not in the menu" — nowhere. Each of them writes to our record, our
       library or our contract, and this page is not ours. */
    const owner只 = await page.evaluate(() => {
      const ids = ['ws-import', 'ws-tpl', 'ws-delete', 'ws-pdf-record', 'ws-compare', 'ws-more'];
      const found = ids.filter(id => {
        const el = document.getElementById(id);
        return el && el.getBoundingClientRect().width > 0;
      });
      const words = (document.querySelector('.pw-page') || document.body).textContent || '';
      const phrases = ['Import their Word file', 'Save as template', 'Delete this draft',
        'Compare versions'].filter(p => words.includes(p));
      return { found, phrases,
        /* the one that LOOKS like a gap and is not: their own door is here */
        compareWording: !!document.getElementById('pt-compare') };
    });
    check('7 none of the owner-only controls is drawn on their page',
      owner只.found.length === 0, owner只.found.join(', ') || 'none');
    check('7 and none of their words appears anywhere on it',
      owner只.phrases.length === 0, owner只.phrases.join(', ') || 'none');
    check('7 Compare versions is absent because Compare wording is present',
      owner只.compareWording && !owner只.phrases.includes('Compare versions'));

    /* ---- 11. CLOSING IT ---- */
    await page.mouse.click(700, 700);
    await pause(300);
    const afterOutside = await page.evaluate(() =>
      document.getElementById('pt-more-menu').classList.contains('hidden'));
    check('11 an outside press closes it', afterOutside);
    await page.click('#pt-more'); await pause(250);
    await page.keyboard.press('Escape'); await pause(300);
    const afterEsc = await page.evaluate(() => ({
      shut: document.getElementById('pt-more-menu').classList.contains('hidden'),
      /* Escape must close the MENU and not fall through into focus mode. */
      focused: document.body.classList.contains('pw-focused') }));
    check('11 Escape closes it, and does not fall through to focus mode',
      afterEsc.shut && !afterEsc.focused, JSON.stringify(afterEsc));

    /* ---- 8 & 9. FOCUS MODE ---- */
    const headBefore = await page.evaluate(([seen]) => eval(seen)(document.querySelector('.pw-id')), [SEEN]);
    await page.click('#pt-more'); await pause(250);
    await page.click('#pt-focus'); await pause(600);
    await page.screenshot({ path: path.join(OUT, '04-focus-on.png') });
    const focusOn = await page.evaluate(([seen]) => {
      const s = eval(seen);
      return { body: document.body.classList.contains('pw-focused'),
        head: s(document.querySelector('.pw-id')),
        notes: s(document.querySelector('.pw-notes')),
        /* THE PROMISE STAYS. The wall line says decisions are held on this page
           until Send; a reading posture may not take that off the screen. */
        wall: s(document.querySelector('#rl-banner .rl-wall') || document.querySelector('.rl-wall')),
        menuShut: document.getElementById('pt-more-menu').classList.contains('hidden'),
        paper: s(document.querySelector('#pt-nego .redline-page')) };
    }, [SEEN]);
    check('8 focus mode hides their header',
      focusOn.body && (!focusOn.head || !focusOn.head.on), JSON.stringify(focusOn.head));
    check('8 and the notice stack with it',
      !focusOn.notes || !focusOn.notes.on, JSON.stringify(focusOn.notes));
    check('8 the menu closed behind the press', focusOn.menuShut);
    check('9 THE WALL LINE SURVIVES — a posture may not hide a promise',
      focusOn.wall && focusOn.wall.on, JSON.stringify(focusOn.wall));
    check('8 and the contract still has the window',
      focusOn.paper && focusOn.paper.on && focusOn.paper.h > 200, JSON.stringify(focusOn.paper));

    await page.keyboard.press('Escape');
    await pause(600);
    await page.screenshot({ path: path.join(OUT, '05-focus-off.png') });
    const focusOff = await page.evaluate(([seen]) => {
      const s = eval(seen);
      return { body: document.body.classList.contains('pw-focused'),
        head: s(document.querySelector('.pw-id')) };
    }, [SEEN]);
    check('8 ESCAPE IS THE WAY OUT — the header comes back',
      !focusOff.body && focusOff.head && focusOff.head.on
      && Math.abs(focusOff.head.h - headBefore.h) <= 2,
      `${JSON.stringify(focusOff.head)} vs before ${JSON.stringify(headBefore)}`);

    /* ---- 10. THE ROW STILL LAYS OUT ----
       This header already wrapped at narrow widths before three more controls
       were put in it. Nothing may overlap and nothing may leave the window. */
    for (const w of [1440, 1180, 980]){
      await page.setViewportSize({ width: w, height: 940 });
      await pause(500);
      const row = await page.evaluate(([seen]) => {
        const s = eval(seen);
        const head = document.querySelector('.pw-id');
        const kids = [...head.children].map(el => ({ cls: el.className || el.id, box: s(el) }))
          .filter(k => k.box && k.box.on);
        const overflow = kids.filter(k => k.box.right > innerWidth + 1 || k.box.left < -1);
        /* Nothing in the row may sit on top of anything else in it. */
        let overlaps = 0;
        for (let i = 0; i < kids.length; i++) for (let j = i + 1; j < kids.length; j++){
          const a = kids[i].box, b = kids[j].box;
          if (a.left < b.right - 1 && b.left < a.right - 1
            && a.top < b.bottom - 1 && b.top < a.bottom - 1) overlaps++;
        }
        return { n: kids.length, overflow: overflow.map(k => k.cls), overlaps,
          headH: s(head).h, switchOn: !!s(document.querySelector('.pw-id .rl-readwrap')),
          moreOn: !!(s(document.getElementById('pt-more')) || {}).on };
      }, [SEEN]);
      check(`10 at ${w}px nothing leaves the window`, row.overflow.length === 0, row.overflow.join(', ') || 'none');
      check(`10 at ${w}px nothing in the row overlaps`, row.overlaps === 0, `${row.overlaps} overlaps`);
      check(`10 at ${w}px both new controls are still drawn`, row.switchOn && row.moreOn,
        `switch=${row.switchOn}, more=${row.moreOn}`);
      await page.screenshot({ path: path.join(OUT, `06-row-${w}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 940 });
    await pause(400);

    /* ---- 12b. AND THE OWNER'S ROOM IS STILL THE OWNER'S ---- */
    await page.evaluate(() => window.SHOW_OWNER());
    await pause(800);
    const ownerAfter = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const wrap = document.querySelector('#view-redline .rl-readwrap');
      return { box: s(wrap),
        segs: [...document.querySelectorAll('#view-redline .rl-readwrap .rl-seg')].map(b => b.textContent.trim()),
        theirMore: !!document.getElementById('pt-more') };
    }, [SEEN]);
    check('12 the owner\'s switch is drawn by the same builder and did not move',
      ownerAfter.box && ownerAfter.box.on
      && JSON.stringify(ownerAfter.segs) === JSON.stringify(ownerBefore.segs)
      && Math.abs(ownerAfter.box.w - ownerBefore.box.w) <= 2,
      `${JSON.stringify(ownerAfter.segs)} — ${ownerAfter.box && ownerAfter.box.w}px vs ${ownerBefore.box && ownerBefore.box.w}px`);
    check('12 and their menu is not on the owner\'s page', !ownerAfter.theirMore);
    await page.screenshot({ path: path.join(OUT, '07-owner-unchanged.png') });

    /* ================================================================
       14-16 · THREE OWNER ASKS OFF ONE SCREENSHOT, 23 Aug 2026
       ================================================================
       "In the counterparty page, the redlined, agreed and with changes should
       be similar to what is in image 2 from the negotiations page. Also, the
       More button should be white inside just like the other buttons. When you
       are on focus mode, there should be an exit focus mode button ... like in
       the negotiations page as well."

       EVERY CLAIM HERE IS A RELATION READ LIVE OFF THE OWNER'S OWN PAGE, never
       a literal: "the same as the negotiations page" is what was asked, and a
       pinned rgb would cost a test edit on the next type or palette pass while
       proving less. The reference is captured on the owner's page first and
       the counterparty's is compared to it. */

    /* ---- 14. THE READING SWITCH WEARS THE NEGOTIATION PAGE'S DRESS ----
       The dress was written `.redline-page .rl-readwrap`, and their copy sits
       in the .pw-id header, which is not that page — so it fell through to the
       base .rl-seg rule and drew the grey pill group these tabs replaced.
       MEASURED before the fix: 13px in a bordered box on rgb(241,245,249) with
       a white fill on the live one, against the reference's 14px, 700, accent
       and a 2px underline on nothing.

       THE HEIGHT IS DELIBERATELY NOT COMPARED. On the owner's page the row
       stretches to a 44px control bar; their header is compact and the same
       segments measure ~20px. That difference is correct and pinning it would
       be pinning the wrong thing. */
    const READ_SEG = ({ sel }) => {
      const segs = [...document.querySelectorAll(sel)];
      if (!segs.length) return null;
      const wrap = segs[0].parentElement;
      const ws = getComputedStyle(wrap);
      const one = e => { const c = getComputedStyle(e);
        return { fs: c.fontSize, fw: c.fontWeight, color: c.color, bg: c.backgroundColor,
          pad: c.padding, shadow: c.boxShadow }; };
      const on = segs.find(e => e.getAttribute('aria-pressed') === 'true');
      const off = segs.find(e => e.getAttribute('aria-pressed') !== 'true');
      return { wrap: { bg: ws.backgroundColor, border: ws.borderStyle, pad: ws.padding },
        on: on && one(on), off: off && one(off), n: segs.length };
    };

    await page.evaluate(() => window.SHOW_OWNER());
    await pause(800);
    const refSeg = await page.evaluate(READ_SEG, { sel: '#view-redline .rl-readwrap .rl-seg' });
    await page.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(900);
    const cpSeg = await page.evaluate(READ_SEG, { sel: '.pw-id .rl-readwrap .rl-seg' });
    await page.screenshot({ path: path.join(OUT, '08-their-reading-tabs.png') });

    const sameSeg = (a, b, keys) => a && b && keys.every(k => String(a[k]) === String(b[k]));
    check('14 their reading switch has no box of its own, like the reference',
      refSeg && cpSeg && sameSeg(refSeg.wrap, cpSeg.wrap, ['bg', 'border', 'pad']),
      JSON.stringify({ ref: refSeg && refSeg.wrap, theirs: cpSeg && cpSeg.wrap }));
    check('14 the LIVE segment reads the same on both pages',
      sameSeg(refSeg && refSeg.on, cpSeg && cpSeg.on,
        ['fs', 'fw', 'color', 'bg', 'pad', 'shadow']),
      JSON.stringify({ ref: refSeg && refSeg.on, theirs: cpSeg && cpSeg.on }));
    check('14 and so does a RESTING one',
      sameSeg(refSeg && refSeg.off, cpSeg && cpSeg.off,
        ['fs', 'fw', 'color', 'bg', 'pad']),
      JSON.stringify({ ref: refSeg && refSeg.off, theirs: cpSeg && cpSeg.off }));
    check('14 the live one carries the underline, and it is not a fill',
      cpSeg && cpSeg.on && /inset/.test(cpSeg.on.shadow)
      && cpSeg.on.bg === 'rgba(0, 0, 0, 0)',
      cpSeg && cpSeg.on && `${cpSeg.on.shadow} on ${cpSeg.on.bg}`);

    /* ---- 15. MORE IS WHITE INSIDE, LIKE THE THREE BESIDE IT ----
       It carried .pt-verb, which fills the face with --color-accent-100 —
       measured rgb(204,251,241) against three transparent neighbours. Compared
       against those neighbours rather than against a colour, because "like the
       other buttons" is the ask. */
    const verbs = await page.evaluate(() => {
      const g = id => { const e = document.getElementById(id); if (!e) return null;
        const s = getComputedStyle(e);
        return { id, bg: s.backgroundColor, cls: e.className }; };
      return ['pt-more', 'pt-nego-ready', 'pt-derive', 'pt-nego-decline'].map(g).filter(Boolean);
    });
    const more = verbs.find(v => v.id === 'pt-more');
    const others = verbs.filter(v => v.id !== 'pt-more');
    check('15 the three plain verbs really are on screen to compare against',
      others.length >= 2, others.map(v => v.id).join(', '));
    check('15 More has no fill, exactly like them',
      more && others.length >= 2 && others.every(v => v.bg === more.bg),
      JSON.stringify(verbs.map(v => `${v.id}:${v.bg}`)));
    check('15 and it no longer carries the signing screen\'s verb class',
      more && !/\bpt-verb\b/.test(more.cls), more && more.cls);

    /* ---- 16. THERE IS A WAY OUT OF FOCUS MODE ----
       Focus mode stands this page's header down, and the header is where the
       More menu that turned it on lives — so before this there was no visible
       way back at all, only Escape. MEASURED: .rl-focus-exit did not exist on
       this page.

       OWNER-CHOSEN OPTION (a): the same corner as the negotiation page, not a
       different one. So the corner is read off the owner's page and compared,
       never typed here. */
    await page.evaluate(() => window.SHOW_OWNER());
    await pause(700);
    const refExit = await page.evaluate(() => {
      if (window.rlSetFocus) rlSetFocus(true);
      const e = document.querySelector('.rl-focus-exit'); if (!e) return null;
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { on: r.width > 0 && r.height > 0 && s.display !== 'none',
        fromRight: Math.round(window.innerWidth - r.right),
        fromBottom: Math.round(window.innerHeight - r.bottom),
        bg: s.backgroundColor, fs: s.fontSize };
    });
    await page.evaluate(() => { if (window.rlSetFocus) rlSetFocus(false); });
    await pause(400);

    await page.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(900);
    const cpExit = await page.evaluate(() => {
      if (window.rlSetFocus) rlSetFocus(true);
      const e = document.querySelector('.rl-focus-exit');
      const head = document.querySelector('.pw-id');
      if (!e) return { missing: true, headHidden: head ? getComputedStyle(head).display === 'none' : null };
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { on: r.width > 0 && r.height > 0 && s.display !== 'none',
        fromRight: Math.round(window.innerWidth - r.right),
        fromBottom: Math.round(window.innerHeight - r.bottom),
        bg: s.backgroundColor, fs: s.fontSize,
        headHidden: head ? getComputedStyle(head).display === 'none' : null };
    });
    await page.screenshot({ path: path.join(OUT, '09-their-focus.png') });

    check('16 focus mode really is on and their header really is down',
      cpExit && cpExit.headHidden === true, JSON.stringify(cpExit));
    check('16 THERE IS A WAY OUT, as visible pixels',
      cpExit && !cpExit.missing && cpExit.on, JSON.stringify(cpExit));
    check('16 in the same corner as the negotiation page — option (a)',
      refExit && cpExit && !cpExit.missing
      && Math.abs(refExit.fromRight - cpExit.fromRight) <= 2
      && Math.abs(refExit.fromBottom - cpExit.fromBottom) <= 2,
      JSON.stringify({ ref: refExit && [refExit.fromRight, refExit.fromBottom],
        theirs: cpExit && [cpExit.fromRight, cpExit.fromBottom] }));
    check('16 and wearing the same dress, not an unstyled word',
      refExit && cpExit && !cpExit.missing
      && refExit.bg === cpExit.bg && refExit.fs === cpExit.fs,
      JSON.stringify({ ref: refExit && [refExit.bg, refExit.fs],
        theirs: cpExit && [cpExit.bg, cpExit.fs] }));

    /* THE PRESS IS THE CLAIM. A button that shows and does nothing is the
       fault this suite has recorded more than once. */
    const left = await page.evaluate(async () => {
      const e = document.querySelector('.rl-focus-exit'); if (e) e.click();
      await new Promise(r => setTimeout(r, 500));
      const head = document.querySelector('.pw-id');
      return { cls: document.body.className,
        headBack: head ? getComputedStyle(head).display !== 'none' : null,
        exitGone: (() => { const x = document.querySelector('.rl-focus-exit');
          return x ? getComputedStyle(x).display === 'none' : true; })() };
    });
    check('16 pressing it leaves focus and brings their header back',
      left.headBack === true && !/pw-focused/.test(left.cls) && left.exitGone,
      JSON.stringify(left));

    /* ---- AND THE COLLISION THAT WAS WORRIED ABOUT DOES NOT EXIST ----
       The floating notices stack is pinned to the same corner, which is why
       the owner was offered a bottom-LEFT option. It never coexists with this
       button: .redline-page.rl-focus hides the stack outright, and the
       counterparty's seat draws no floating bell at all. Asserted rather than
       assumed, because "they do not overlap" was the reason for choosing (a). */
    const clash = await page.evaluate(() => {
      if (window.rlSetFocus) rlSetFocus(true);
      const bx = e => { if (!e) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e);
        return { on: r.width > 0 && r.height > 0 && s.display !== 'none',
          l: r.left, t: r.top, r: r.right, b: r.bottom }; };
      const ex = bx(document.querySelector('.rl-focus-exit'));
      const no = bx(document.querySelector('.rl-notices'));
      const hit = !(!ex || !no || !ex.on || !no.on || ex.r < no.l || no.r < ex.l || ex.b < no.t || no.b < ex.t);
      return { exit: !!(ex && ex.on), notices: !!(no && no.on), overlap: hit };
    });
    check('16 the exit never sits on top of the notices stack',
      clash.exit && !clash.overlap, JSON.stringify(clash));
    await page.evaluate(() => { if (window.rlSetFocus) rlSetFocus(false); });

    check('13 no page errors during the whole run', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    srv.close();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed — shots in ${OUT}`);
  if (pass !== results.length) process.exitCode = 1;
})();
