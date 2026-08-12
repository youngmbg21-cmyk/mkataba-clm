/* Chromium verification: THE REDLINE CARD POPS OUT; IT DOES NOT GROW.
   ============================================================
   Owner's call, 12 Aug 2026. A change card used to unfold in place, which put
   the reason, the reviewer's note and the whole thread into the narrowest
   column on the screen and moved every card below it down the page while
   somebody was reading one of them. It opens a floating panel now, with a
   scroll of its own.

   This file replaces card-collapse-verify.js, which pinned the fold.

   WHY A BROWSER, AND NOT ANOTHER NODE TEST. Three of the claims below cannot be
   made anywhere else:

     · THE PANEL MUST NOT BE CLIPPED. The change column is a scroller. Anything
       parented inside it and sticking out of its left edge is cut off — laid
       out, reporting a sane rectangle, and not on screen. jsdom resolves no
       overflow and no cascade, so to it a clipped panel and a visible one are
       the same object. `position:fixed` is what escapes it, and only a browser
       can confirm that nothing in the ancestry (a transform, a filter) has
       quietly turned it back into an absolute one.
     · THE REPLY BOX MUST STILL SEND. The panel BORROWS the card's body node
       rather than rendering a copy — the engine binds that composer by element
       id and scopes every lookup to its own mount, so a copy is a box that
       accepts typing and never sends. The proof is a note typed into the panel
       arriving on the record.
     · A VERB IS VISIBLE PIXELS (f180). The verbs stay on the card while the
       panel is open, and jsdom will happily "press" something with no box.

   Screenshots go to test/chromium/shots/card-popout/.
   Run: node test/chromium/card-popout-verify.js */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'card-popout');
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
const pause = ms => new Promise(r => setTimeout(r, ms == null ? 260 : ms));

/* Real geometry, not classes: a control hidden by a cascade still has an
   offsetParent, and that is exactly the failure mode being guarded. */
const SEEN = `(el => { if (!el) return null; const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height),
    x: Math.round(r.left), y: Math.round(r.top),
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        && Number(cs.opacity) > 0.01 }; })`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.evaluate(() => window.READY);
    await pause(300);

    /* A reason on the change under test — a reason is exactly the reading
       matter the panel exists to hold. */
    const ID = await page.evaluate(() => {
      const ch = negoChanges(CONTRACT).find(x => x.status === 'pending') || negoChanges(CONTRACT)[0];
      ch.why = 'Our accounts payable cycle runs monthly, so Net-30 forces out-of-cycle payments '
        + 'and a manual approval on every invoice. Net-45 lines the contract up with the cycle.';
      renderRedline();
      return ch.id;
    });
    await pause(400);
    await page.screenshot({ path: path.join(OUT, '01-column.png') });

    const card = sel => `document.querySelector('[data-nego-card="${ID}"]${sel || ''}')`;

    /* ---- 1. THE CARD, BEFORE ANYTHING IS OPENED ---- */
    const shut = await page.evaluate(([seen, id]) => {
      const s = eval(seen);
      const el = document.querySelector(`[data-nego-card="${id}"]`);
      if (!el) return { there: false };
      return { there: true,
        popped: el.getAttribute('data-rl-popped'),
        card: s(el),
        head: s(el.querySelector('.rl-card-head')),
        badge: s(el.querySelector('.rl-badge')),
        meta: s(el.querySelector('.rl-card-meta')),
        popBtn: s(el.querySelector('[data-rl-pop]')),
        /* On the card and never shown there — the panel borrows it. */
        bodyInDom: !!el.querySelector('.rl-card-body'),
        bodyShown: s(el.querySelector('.rl-card-body')),
        verbs: [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')]
          .map(b => ({ t: (b.textContent || '').trim(), ...s(b) })),
        panel: !!document.getElementById('rl-pop'),
      };
    }, [SEEN, ID]);

    check('the card is on screen', shut.there && shut.card.on, shut.there && `${shut.card.w}x${shut.card.h}`);
    check('nothing is popped out to begin with', shut.popped === '0' && !shut.panel, shut.popped);
    check('the header block reads — status and clause, on the card',
      shut.head.on && shut.badge.on && shut.meta.on);
    check('the door into the panel is a real, aimable button',
      !!shut.popBtn && shut.popBtn.on && shut.popBtn.w >= 20 && shut.popBtn.h >= 20,
      shut.popBtn ? `${shut.popBtn.w}x${shut.popBtn.h}` : 'MISSING');
    check('the reading matter is on the card and NOT shown there',
      shut.bodyInDom && !(shut.bodyShown && shut.bodyShown.on),
      `inDom=${shut.bodyInDom} shown=${!!(shut.bodyShown && shut.bodyShown.on)}`);
    check('and the verbs are visible pixels, as they always must be (f180)',
      shut.verbs.length > 0 && shut.verbs.every(v => v.on),
      shut.verbs.map(v => `${v.t} ${v.w}x${v.h}`).join(' · ') || 'no verbs');

    /* ---- 2. PRESSING THE CARD NAVIGATES, AND ONLY THAT ---- */
    await page.evaluate(([id]) => document.querySelector(`[data-nego-card="${id}"] .rl-card-head`)
      .dispatchEvent(new MouseEvent('click', { bubbles: true })), [ID]);
    await pause(400);
    check('pressing the card opens no panel — it takes you to the clause',
      await page.evaluate(() => !document.getElementById('rl-pop')));

    /* ---- 3. THE BUTTON OPENS IT ---- */
    await page.evaluate(([id]) => document.querySelector(`[data-nego-card="${id}"] [data-rl-pop]`).click(), [ID]);
    await pause(450);
    await page.screenshot({ path: path.join(OUT, '02-open.png') });

    const open = await page.evaluate(([seen, id]) => {
      const s = eval(seen);
      const pop = document.getElementById('rl-pop');
      if (!pop) return { there: false };
      const col = document.getElementById('rl-changes');
      const el = document.querySelector(`[data-nego-card="${id}"]`);
      const body = pop.querySelector('.rl-pop-body');
      const cs = getComputedStyle(pop);
      return { there: true,
        box: s(pop),
        cardBox: s(el),
        colBox: s(col),
        position: cs.position,
        inColumn: !!pop.closest('#rl-changes'),
        inPage: !!pop.closest('.redline-page'),
        /* the borrowed node — one copy, in the panel, out of the card */
        notesInPanel: !!pop.querySelector('.rl-cnotes'),
        notesOnCard: !!el.querySelector('.rl-cnotes'),
        /* Per CHANGE, not per page: six cards have six threads, and the claim
           is that THIS one exists once. The composer's id is the change's. */
        notesCopies: document.querySelectorAll(`[id="nego-ti-${id}"]`).length,
        whyShown: s(pop.querySelector('.rl-card-why')),
        wording: s(pop.querySelector('.rl-pop-word')),
        bodyOverflow: body ? getComputedStyle(body).overflowY : null,
        scrolls: body ? body.scrollHeight > body.clientHeight + 2 : false,
        marked: el.getAttribute('data-rl-popped'),
        /* the card's own verbs while the panel is open */
        verbs: [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')]
          .map(b => ({ t: (b.textContent || '').trim(), ...s(b) })),
      };
    }, [SEEN, ID]);

    check('the panel is on screen, with a real box', open.there && open.box.on,
      open.there ? `${open.box.w}x${open.box.h}` : 'MISSING');
    check('THE CLIPPING TRAP: it is fixed, and not parented inside the scroller',
      open.position === 'fixed' && !open.inColumn,
      `${open.position}, inColumn=${open.inColumn}`);
    check('THE WIRING TRAP: but it IS inside the mount the engine wires', open.inPage);
    check('it sits to the LEFT of its card, over the document',
      open.box.x + open.box.w <= open.cardBox.x + 2,
      `panel ends ${open.box.x + open.box.w}, card starts ${open.cardBox.x}`);
    check('and entirely on screen', open.box.x >= 0 && open.box.y >= 0
      && open.box.y + open.box.h <= 980, `x${open.box.x} y${open.box.y} h${open.box.h}`);
    check('the card it belongs to is marked', open.marked === '1');
    check('the reading matter MOVED — one node, now in the panel',
      open.notesInPanel && !open.notesOnCard && open.notesCopies === 1,
      `inPanel=${open.notesInPanel} onCard=${open.notesOnCard} copies of its composer=${open.notesCopies}`);
    check('the reason is readable in it', !!open.whyShown && open.whyShown.on);
    check('and the wording in full, which the card only clamps',
      !!open.wording && open.wording.on);
    check('the panel scrolls inside itself', open.bodyOverflow === 'auto' || open.bodyOverflow === 'scroll',
      open.bodyOverflow);
    check('the card keeps its verbs while the panel is open',
      open.verbs.length > 0 && open.verbs.every(v => v.on),
      open.verbs.map(v => v.t).join(' · '));

    /* ---- 4. THE REPLY BOX STILL SENDS — the whole reason for borrowing ---- */
    const sent = await page.evaluate(async ([id]) => {
      const pop = document.getElementById('rl-pop');
      const opener = pop.querySelector('.rl-cnote-add, [data-nego-reply]');
      if (opener) { opener.click(); await new Promise(r => setTimeout(r, 300)); }
      const live = document.getElementById('rl-pop') || pop;
      const box = live.querySelector('textarea');
      const send = live.querySelector('[data-nego-send]');
      if (!box || !send) return { wired: false, box: !!box, send: !!send };
      /* A note lands on the CHANGE's own thread (negoPostComment), not on the
         contract's comments. */
      const th = () => (negoChangeById(CONTRACT, id) || {}).thread || [];
      const before = th().length;
      box.value = 'Typed into the panel, not into a copy of it.';
      box.dispatchEvent(new Event('input', { bubbles: true }));
      send.click();
      await new Promise(r => setTimeout(r, 800));
      return { wired: true, before, after: th().length,
        text: JSON.stringify(th().slice(-1)).slice(0, 90) };
    }, [ID]);
    check('the panel carries a real reply box and its send', sent.wired !== false,
      sent.wired === false ? `box=${sent.box} send=${sent.send}` : 'both there');
    check('THE MOVE PROVED: a note typed in the panel actually posts',
      sent.wired && sent.after > sent.before,
      sent.wired ? `${sent.before} → ${sent.after} · ${String(sent.text).slice(0, 70)}` : 'no box to try');

    /* ---- 5. CLOSING GIVES THE BODY BACK ---- */
    await page.evaluate(() => document.querySelector('#rl-pop [data-rl-pop-close]').click());
    await pause(400);
    const closed = await page.evaluate(([id]) => {
      const el = document.querySelector(`[data-nego-card="${id}"]`);
      return { panel: !!document.getElementById('rl-pop'),
        notesOnCard: !!el.querySelector('.rl-cnotes'),
        copies: document.querySelectorAll(`[id="nego-ti-${id}"]`).length,
        marked: el.getAttribute('data-rl-popped') };
    }, [ID]);
    check('the panel is gone, not merely hidden', !closed.panel);
    check('and the body went home — still exactly one of it',
      closed.notesOnCard && closed.copies === 1,
      `onCard=${closed.notesOnCard} copies=${closed.copies}`);
    check('the card is no longer marked', closed.marked === '0');

    /* ---- 6. ESCAPE, AND A PRESS OUTSIDE ---- */
    await page.evaluate(([id]) => document.querySelector(`[data-nego-card="${id}"] [data-rl-pop]`).click(), [ID]);
    await pause(350);
    await page.keyboard.press('Escape');
    await pause(350);
    check('Escape closes it', await page.evaluate(() => !document.getElementById('rl-pop')));

    await page.evaluate(([id]) => document.querySelector(`[data-nego-card="${id}"] [data-rl-pop]`).click(), [ID]);
    await pause(350);
    await page.evaluate(() => document.getElementById('rl-doc')
      .dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await pause(350);
    check('and a press outside closes it too',
      await page.evaluate(() => !document.getElementById('rl-pop')));

    /* ---- 7. ONE AT A TIME ---- */
    const one = await page.evaluate(async () => {
      const btns = [...document.querySelectorAll('#rl-changes .rl-card [data-rl-pop]')];
      if (btns.length < 2) return { enough: false, n: btns.length };
      btns[0].click(); await new Promise(r => setTimeout(r, 250));
      const first = rlPopId();
      document.querySelectorAll('#rl-changes .rl-card [data-rl-pop]')[1].click();
      await new Promise(r => setTimeout(r, 250));
      return { enough: true, first, second: rlPopId(),
        panels: document.querySelectorAll('#rl-pop').length,
        bodies: document.querySelectorAll('.rl-cnotes').length,
        cards: document.querySelectorAll('.rl-card').length };
    });
    check('a second card moves the panel rather than stacking one',
      !one.enough || (one.panels === 1 && one.first !== one.second),
      one.enough ? `${one.first} → ${one.second}, ${one.panels} panel(s)` : 'only one card on the table');
    check('and every card still has exactly its own body',
      !one.enough || one.bodies === one.cards, `${one.bodies} bodies / ${one.cards} cards`);
    await page.screenshot({ path: path.join(OUT, '03-moved.png') });

    /* ---- 8. A PHONE GETS A SHEET ---- */
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    phone.on('pageerror', e => errors.push('phone: ' + e.message));
    await phone.goto(PAGE, { waitUntil: 'load' });
    await phone.evaluate(() => window.READY);
    await pause(500);
    const sheet = await phone.evaluate(([seen]) => {
      const s = eval(seen);
      const b = document.querySelector('#rl-changes .rl-card [data-rl-pop]');
      if (!b) return { there: false };
      b.click();
      const pop = document.getElementById('rl-pop');
      if (!pop) return { there: false };
      return { there: true, sheet: pop.classList.contains('rl-pop-sheet'), box: s(pop) };
    }, [SEEN]);
    check('on a phone it is a bottom sheet, not a floating panel',
      sheet.there && sheet.sheet && sheet.box.on,
      sheet.there ? `${sheet.box.w}x${sheet.box.h} at y${sheet.box.y}` : 'no card to open');
    check('and it spans the width a thumb has',
      sheet.there && sheet.box.w >= 380, sheet.there && sheet.box.w);
    await phone.screenshot({ path: path.join(OUT, '04-phone-sheet.png') });
    await phone.close();

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    srv.close();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
