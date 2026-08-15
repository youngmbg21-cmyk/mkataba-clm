/* Chromium verification of the counterparty's header verbs.
   ============================================================
   THIS FILE EXISTS BECAUSE JSDOM CANNOT SEE THE DEFECT IT MEASURES.

   It began (1 Aug 2026) as the browser check on a MIRROR: a second Ready to
   sign in the header that forwarded its click to the strip's real one. On
   12 Aug the owner asked for that strip to go — "delete the whole card the
   Decline and Share a read-only copy buttons sit in; the contract needs the
   space" — and the mirror went with it, because a mirror renders hidden until
   it finds the real button and would have been the last thing standing: a page
   with a readiness verb drawn twice becoming a page with none. The buttons
   moved up instead. What this file measures is the result.

   Three things here are invisible to jsdom BY CONSTRUCTION, and this project
   has paid for each of them:

     1  IS IT ON THE SCREEN, and beside what? jsdom has no layout engine, so
        getBoundingClientRect is all zeroes and "in the header row, on one
        line" has no meaning in it.

     2  DOES A HIDE ACTUALLY HIDE? index.html sets .ui-btn{display:inline-flex},
        and an author rule beats the browser's own [hidden]{display:none}. jsdom
        resolves no class rules at all — it reports a <button> as inline-block
        whatever the stylesheet says — so it answers "hidden" for a reason that
        has nothing to do with the cascade. Measured here against the real one.

     3  DID THE STRIP'S SPACE ACTUALLY REACH THE CONTRACT? That was the point of
        the request, and it is a question about pixels or it is nothing.

   And the roll call f180 taught: every deal verb, by name, walked from the
   button to the root through the real cascade. A verb that cannot be seen is
   not a verb, and this page has lost one that way before.

   Mounted through the parity fixture, which renders the counterparty's page
   from a payload built by the real buildSharePayload. Screenshots go to
   test/chromium/shots/portal-header/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'portal-header');
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

/* THE ROLL CALL, by name. Every deal-level verb the counterparty has. */
const VERBS = [
  ['pt-nego-ready', 'Ready to sign'],
  ['pt-nego-decline', 'Decline'],
  ['pt-derive', 'Share a read-only copy'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await pause(500);
  await page.screenshot({ path: path.join(OUT, '01-header.png') });

  const m = await page.evaluate(verbIds => {
    const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height),
        top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right),
        bottom: Math.round(r.bottom) }; };
    const byId = id => document.getElementById(id);
    /* VISIBLE PIXELS, the way this page has actually lost a button: walk to the
       root through the REAL cascade, so a class rule that resolves to
       display:none — the trap jsdom cannot see — is caught here. */
    const walk = el => {
      if (!el) return 'absent';
      for (let n = el; n && n.nodeType === 1; n = n.parentElement){
        const cs = getComputedStyle(n);
        if (cs.display === 'none') return `<${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}> display:none`;
        if (cs.visibility === 'hidden') return `<${n.tagName.toLowerCase()}${n.id ? '#' + n.id : ''}> visibility:hidden`;
      }
      const r = el.getBoundingClientRect();
      return (r.width > 0 && r.height > 0) ? '' : 'zero box';
    };
    const foot = byId('pt-nego-foot');
    const head = document.querySelector('.pw-id');
    const doc = document.querySelector('#pt-nego .rl-doc') || document.querySelector('.rl-doc');

    /* THE HIDE, MEASURED AGAINST THE REAL CASCADE. Flip [hidden] on a live
       verb and ask the browser what it did — the one question jsdom answers
       for the wrong reason. Put back immediately. */
    const ready = byId('pt-nego-ready');
    let hiddenDisplay = null, shownDisplay = null;
    if (ready){
      shownDisplay = getComputedStyle(ready).display;
      const was = ready.hasAttribute('hidden');
      ready.hidden = true;
      hiddenDisplay = getComputedStyle(ready).display;
      ready.hidden = was;
    }

    return {
      verbs: verbIds.map(id => ({ id, box: box(byId(id)), why: walk(byId(id)),
        label: byId(id) ? (byId(id).textContent || '').replace(/\s+/g, ' ').trim() : null,
        inHead: !!(head && byId(id) && head.contains(byId(id))) })),
      foot: box(foot), head: box(head), doc: box(doc),
      footInHead: !!(head && foot && head.contains(foot)),
      compare: box(byId('pt-compare')),
      stepper: box(document.querySelector('.pw-id .rl-type-step')),
      /* What the request deleted, and what it must not have deleted. */
      nameBoxGone: !byId('nego-cp-name') && !document.querySelector('.pw-id .nego-who'),
      mirrorGone: !byId('pt-ready-top') && !document.querySelector('.pt-ready-top'),
      readyCount: document.querySelectorAll('#pt-nego-ready').length,
      readyPhraseCount: Array.from(document.querySelectorAll('button'))
        .filter(b => /Ready to sign/i.test(b.textContent)).length,
      /* CLAIM REVERSED 15 Aug 2026 (owner-asked, OI-8): focus mode is back,
         as a ROW IN THE MENU rather than a button loose in the header. What
         12 Aug actually removed was a loose control in this row, and that is
         still gone — so the measurement follows the fact rather than being
         deleted. */
      focusLoose: !!document.querySelector('.pt-focus-btn')
        || [...(document.querySelector('.pw-id') || { children: [] }).children]
             .some(el => el.id === 'pt-focus'),
      focusInMenu: (() => { const b = byId('pt-focus'), m = byId('pt-more-menu');
        return !!(b && m && m.contains(b)); })(),
      /* THE WALL LINE STAYS — the one band this page is allowed, because they
         must read it before they answer anything. */
      wall: (() => { const w = document.querySelector('.rl-wall');
        return w ? { box: box(w), text: (w.textContent || '').replace(/\s+/g, ' ').trim() } : null; })(),
      hiddenDisplay, shownDisplay,
      readyDisabled: ready ? ready.disabled : null,
      readyWhy: ready ? ready.title : null,
    };
  }, VERBS.map(v => v[0]));

  /* ---- 1. THE ROLL CALL: every verb, on screen, in the header ---- */
  for (const [id, what] of VERBS){
    const v = m.verbs.find(x => x.id === id);
    check(`${what} is visible pixels`, v && !v.why && v.box && v.box.w > 0,
      v ? (v.why || `${v.box.w}x${v.box.h}`) : 'absent');
    check(`${what} sits in the header row`, v && v.inHead);
  }

  /* ---- 2. the strip is gone as a strip, and survives as a group ---- */
  check('the one verb slot still exists — one transport, however many doors',
    !!m.foot, m.foot ? `${m.foot.w}x${m.foot.h}` : 'absent');
  check('and it is inside the header row rather than a band across the page',
    m.footInHead);
  check('so it no longer spans the page',
    !!m.foot && !!m.head && m.foot.w < m.head.w * 0.85,
    m.foot && m.head ? `bar ${m.foot.w}px inside a ${m.head.w}px header` : 'missing one');

  /* ---- 3. THE SPACE REACHED THE CONTRACT, which was the actual request ----
     The document must start inside the first screenful, right under the header
     — no full-width card between them. */
  check('the contract starts immediately under the header',
    !!m.doc && !!m.head && m.doc.top - m.head.bottom < 90,
    m.doc && m.head ? `${m.doc.top - m.head.bottom}px between header and document` : 'missing one');

  /* ---- 4. beside Compare wording, and the stepper stayed put ---- */
  check('Ready to sign is on the header\'s own line, right of Compare wording',
    (() => { const r = m.verbs[0].box;
      return !!r && !!m.compare && r.left >= m.compare.right - 2; })(),
    m.compare ? `compare right=${m.compare.right}, ready left=${m.verbs[0].box && m.verbs[0].box.left}` : 'no compare');
  check('the text-size stepper is still in the header, untouched',
    !!m.stepper && m.stepper.w > 0, m.stepper ? `${m.stepper.w}x${m.stepper.h}` : 'absent');

  /* ---- 5. what the request deleted is deleted ---- */
  check('the YOU / name box is gone from the header', m.nameBoxGone);
  check('the mirror is gone, not left as the survivor', m.mirrorGone);
  check('Ready to sign exists exactly once', m.readyCount === 1, `${m.readyCount} found`);
  check('and a reader sees the phrase exactly once', m.readyPhraseCount === 1,
    `${m.readyPhraseCount} buttons say it`);
  check('no focus button loose in the header row — what 12 Aug removed stays removed',
    !m.focusLoose);
  check('and focus mode is back where the owner asked for it: a row in the More menu',
    m.focusInMenu);

  /* ---- 6. THE HIDE ACTUALLY HIDES — the .ui-btn cascade trap ----
     The pair is the assertion, not either half: shown it must be laid out,
     hidden it must be gone. This is the mechanism a future layout change would
     reach for, and the reason a hidden verb has twice looked fine in jsdom. */
  check('shown, the verb is laid out rather than removed', m.shownDisplay !== 'none',
    m.shownDisplay);
  check('hidden, the browser really removes it (beats .ui-btn display)',
    m.hiddenDisplay === 'none',
    m.hiddenDisplay !== 'none'
      ? `${m.hiddenDisplay} — [hidden] LOST to .ui-btn; a "hidden" verb would still stand`
      : m.hiddenDisplay);

  /* ---- 7. THE WALL LINE STAYS, and it is read before anything is pressed ---- */
  check('the wall line is still on the page',
    !!m.wall && /stay on this page until you press Send/i.test(m.wall.text),
    m.wall ? m.wall.text.slice(0, 90) : 'absent');
  check('and it is above the document, where it is read first',
    !!m.wall && !!m.doc && m.wall.box.top <= m.doc.top,
    m.wall && m.doc ? `wall top=${m.wall.box.top}, doc top=${m.doc.top}` : 'missing one');

  /* ---- 8. the gate is the engine's, and says so on the button ---- */
  check('Ready to sign is shut while the round is unanswered', m.readyDisabled === true,
    `disabled=${m.readyDisabled}`);
  check('and explains why on the button itself', !!m.readyWhy, m.readyWhy);

  /* ---- 9. THE SEND APPEARS, AND IS VISIBLE ----
     The postbox is drawn only once something is held, so it is the one verb
     that cannot be checked on a fresh page — and it is the verb this page lost
     to a layout change once already.

     CLAIM REVERSED IN PLACE, 15 Aug 2026. This used to require the batch Send
     to be #pt-nego-send and to sit INSIDE .pw-id with the other verbs. That
     was right when the header was the only place a batch send could live, and
     it stopped being right when the unsent band arrived on the change column —
     the place a reader is actually looking when they have answers to send.

     Both were drawn for a day and the owner reported it: "you sometimes have
     multiple send alerts. There should only be the one highlighted in yellow
     on top of the redline cards." They disagreed as well as duplicated,
     because the header counted DECISIONS and the band counts decisions AND
     held proposals. So the header's send stands down on the workbench (keyed
     on PORTAL_FOOT_COMPACT — the signing screen has no change column and
     still draws it) and the band is the door.

     WHAT THIS FILE IS FOR IS UNCHANGED and is what is measured below: a reader
     who has decided something must have VISIBLE PIXELS to send it with, and
     exactly one of them. Only the element carrying them has moved. */
  const afterDecision = await page.evaluate(async () => {
    const btn = document.querySelector('[data-nego-accept]');
    if (!btn) return { pressed: false };
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const send = document.querySelector('.rl-unsent-go');
    const band = document.querySelector('.rl-unsent');
    /* "on top of the redline cards" is a GEOMETRY claim, so it is measured as
       geometry: the band sits above the first card and shares its column. An
       ancestor walk would have been the wrong test — the band is prepended to
       .nego-index-head, which is a SIBLING of the card scroller, not its
       parent, so containment answers false on a page that is drawn correctly. */
    const card = document.querySelector('[data-nego-card]');
    let over = null;
    if (band && card){
      const b = band.getBoundingClientRect(), k = card.getBoundingClientRect();
      over = { above: b.bottom <= k.top + 1,
        sameColumn: Math.abs(b.left - k.left) < 40,
        b: Math.round(b.bottom), k: Math.round(k.top) };
    }
    let why = 'absent';
    if (send){
      why = '';
      for (let n = send; n && n.nodeType === 1; n = n.parentElement)
        if (getComputedStyle(n).display === 'none'){ why = 'display:none above it'; break; }
      const r = send.getBoundingClientRect();
      if (!why && !(r.width > 0 && r.height > 0)) why = 'zero box';
    }
    const r = send && send.getBoundingClientRect();
    return { pressed: true, why, label: send ? send.textContent.replace(/\s+/g, ' ').trim() : null,
      over,
      proxy: send ? send.getAttribute('data-redline-proxy') : null,
      w: r ? Math.round(r.width) : 0,
      /* ONE ALERT. The header's own send must not be drawn beside it — that is
         the duplicate the owner reported, and it is what this check exists to
         stop coming back. */
      headerSends: document.querySelectorAll('#pt-nego-send').length,
      batchSends: document.querySelectorAll('.rl-unsent-go').length,
      /* the card's own Send is a PROXY onto that one postbox — two doors, one
         transport, and both have to be pressable */
      cardSend: !!document.querySelector('[data-rl-send]') };
  });
  await page.screenshot({ path: path.join(OUT, '02-after-decision.png') });

  check('a decision draws the Send, and it is visible pixels',
    afterDecision.pressed && !afterDecision.why && afterDecision.w > 0,
    afterDecision.pressed ? (afterDecision.why || `${afterDecision.w}px — "${afterDecision.label}"`)
      : 'nothing to decide in the fixture');
  check('the Send is ON TOP OF THE REDLINE CARDS, in their own column',
    !!(afterDecision.over && afterDecision.over.above && afterDecision.over.sameColumn),
    afterDecision.over ? `band bottom ${afterDecision.over.b} · first card top ${afterDecision.over.k}`
      + ` · same column ${afterDecision.over.sameColumn}` : 'no band or no card to measure against');
  check('and it is a PROXY onto the one postbox, never a second transport',
    afterDecision.proxy === 'nego-send-decisions', afterDecision.proxy);
  check('ONE SEND ALERT — the header draws no second one beside it',
    afterDecision.headerSends === 0 && afterDecision.batchSends === 1,
    `header ${afterDecision.headerSends}, band ${afterDecision.batchSends}`);
  check('and the card keeps its own Send, proxying the one postbox',
    afterDecision.cardSend);

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})();
