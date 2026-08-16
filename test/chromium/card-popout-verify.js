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

    /* ---- 9. THE CARD'S HEAD, AND THE EMPTY SLOT WHERE ITS SEND WAS ----
       (owner-asked, 12 and 13 Aug 2026.) Two changes to the same card, and
       both are about saying a thing ONCE.

         · the origin pill ("Your ask" / "<their company>'s ask") came out of
           the head: a third tag in a corner with two, answering what the
           column's Mine / Theirs filter and the meta line already answer;
         · the spent Send first stopped saying "Sent" (12 Aug) and then came
           off the card entirely (13 Aug). The status corner a centimetre above
           says the word, in colour, from the same reading, and the owner has
           weighed the loss of the second confirmation and accepted it.

       BROWSER, because these are claims about what a reader SEES: that the
       word appears once on the whole card, that the coloured spine still tells
       the two sides apart (a computed border colour), and that a card with
       nothing left to press still reads as needing nothing. */
    const heads = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const cards = [...document.querySelectorAll('#rl-changes .rl-card')];
      const ours = cards.find(el => el.getAttribute('data-rl-origin') === 'us');
      const theirs = cards.find(el => el.getAttribute('data-rl-origin') === 'them');
      const read = el => el && ({
        pill: !!el.querySelector('.rl-origin'),
        headText: (el.querySelector('.rl-card-top').textContent || '').replace(/\s+/g, ' ').trim(),
        spine: getComputedStyle(el).borderLeftColor,
        meta: (el.querySelector('.rl-card-meta') || {}).textContent || '',
        send: s(el.querySelector('[data-rl-send]')),
        sendText: ((el.querySelector('[data-rl-send]') || {}).textContent || '').trim(),
      });
      return { ours: read(ours), theirs: read(theirs),
        anyPill: document.querySelectorAll('#rl-changes .rl-origin').length,
        tagsInDoc: document.querySelectorAll('#rl-doc .rl-asktag').length,
        markedClauses: document.querySelectorAll('#rl-doc .nego-clause.is-changed').length,
        filter: !!document.querySelector('#rl-changes [data-rl-cardfilter], .rl-idx-head') };
    }, [SEEN]);
    check('NO ORIGIN PILL ON ANY CARD IN THE COLUMN', heads.anyPill === 0, heads.anyPill + ' found');
    check('and none of the words it carried are left in a head',
      !/ask/i.test(heads.ours.headText) && !/ask/i.test(heads.theirs.headText),
      `${heads.ours.headText} | ${heads.theirs.headText}`);
    check('THE COLOURED EDGE STILL TELLS THE TWO SIDES APART',
      heads.ours.spine !== heads.theirs.spine, `${heads.ours.spine} vs ${heads.theirs.spine}`);
    check('the name is still on the card, on the line under the head',
      /Nordfrakt/.test(heads.theirs.meta), heads.theirs.meta.replace(/\s+/g, ' ').trim());
    /* REVERSED IN PLACE, 16 Aug 2026 — the ask tags have come off the paper
       (owner-asked: "remove the pills from the contracts"). What replaced them
       is the red rule down a changed clause's right edge, which is what this
       claim was really about: the paper still says which clauses have been
       argued over. */
    check('the ask tags have left the document, and the clause still says it changed',
      heads.tagsInDoc === 0 && heads.markedClauses > 0,
      heads.tagsInDoc + ' tags, ' + heads.markedClauses + ' clauses marked');
    check('the Tracked Changes head — where the Mine/Theirs filter lives — is still drawn',
      heads.filter);
    check('a change of ours that has NOT been sent still shows the green Send',
      !!heads.ours.send && heads.ours.send.on && /Send/i.test(heads.ours.sendText),
      heads.ours.sendText || 'MISSING');
    await page.screenshot({ path: path.join(OUT, '05-heads.png') });

    /* Hand the round over, which is the only thing that makes a change "sent". */
    await page.evaluate(() => { negoHandOver(CONTRACT, { to: 'counterparty' }); renderRedline(); });
    await pause(500);
    const gone = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const el = [...document.querySelectorAll('#rl-changes .rl-card')]
        .find(x => x.getAttribute('data-rl-origin') === 'us');
      if (!el) return { there: false };
      const mark = el.querySelector('[data-rl-sent]');
      const bar = [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')];
      const cs = mark ? getComputedStyle(mark) : null;
      return { there: true,
        saysSent: (el.textContent.match(/Sent/g) || []).length,
        badge: (el.querySelector('.rl-badge') || {}).textContent.trim(),
        mark: s(mark),
        markText: mark ? mark.textContent.replace(/\s+/g, ' ').trim() : null,
        disabled: mark ? mark.disabled : null,
        opacity: cs ? Number(cs.opacity) : null,
        fill: cs ? cs.backgroundColor : null,
        slot: bar.map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        /* The whole safety argument for removing the marker: the attribute it
           carried was what told the card "nothing here is waiting on you".
           Asked of the real rule, off the real rendered verbs. */
        needsYou: window.rlCardNeedsYou(bar.map(b => b.outerHTML)),
        liveSend: !!el.querySelector('[data-rl-send]'),
        bodyShown: s(el.querySelector('.rl-card-body')),
      };
    }, [SEEN]);
    check('after the send there is a card of ours to read', gone.there);
    check('THE WORD "SENT" APPEARS EXACTLY ONCE ON THE CARD',
      gone.saysSent === 1 && gone.badge === 'Sent', `${gone.saysSent} time(s), pill says "${gone.badge}"`);
    /* ---- CLAIMS REVERSED, 13 Aug 2026, OWNER-ASKED ----
       Five checks used to describe the spent Send marker: that it kept its
       slot last in the action bar, that it was a tick and a caption rather
       than the corner's word, that it was dead, that it stayed at full
       strength (a state the reader must READ, not a withheld control) and
       that it was neutral rather than the amber it replaced.

       The owner has asked for the marker to come off the card. The status
       corner says Sent, in colour, one line up, from the same reading — and
       the loss of the second confirmation is weighed and accepted. So the
       checks are turned round in place rather than deleted: the slot is
       EMPTY, and what remains in the bar is Edit alone. */
    check('NOTHING WHERE THE SEND WAS — no marker at all',
      !gone.mark, gone.markText || 'absent');
    check('and the action bar keeps only what still belongs there',
      gone.slot.length === 1 && /Edit/i.test(gone.slot[0] || ''), gone.slot.join(' · '));
    check('the card still reads as needing nothing from you',
      gone.needsYou === false, String(gone.needsYou));
    check('the live Send is gone — it cannot be sent twice', !gone.liveSend);
    check('and the card still collapses to a line — the reading matter is not shown',
      !(gone.bodyShown && gone.bodyShown.on));
    await page.screenshot({ path: path.join(OUT, '06-sent-slot-empty.png') });

    /* ---- 10. THE PHONE DRAWS THE SAME BUILDER, SO CHECK IT THERE TOO ---- */
    const ph2 = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    ph2.on('pageerror', e => errors.push('phone2: ' + e.message));
    await ph2.goto(PAGE, { waitUntil: 'load' });
    await ph2.evaluate(() => window.READY);
    await pause(500);
    const onPhone = await ph2.evaluate(() => {
      negoHandOver(CONTRACT, { to: 'counterparty' });
      renderRedline();
      const el = [...document.querySelectorAll('#rl-changes .rl-card')]
        .find(x => x.getAttribute('data-rl-origin') === 'us');
      if (!el) return { there: false };
      const mark = el.querySelector('[data-rl-sent]');
      const r = mark ? mark.getBoundingClientRect() : null;
      return { there: true, pills: document.querySelectorAll('#rl-changes .rl-origin').length,
        saysSent: (el.textContent.match(/Sent/g) || []).length,
        markOn: !!r && r.width > 0 && r.height > 0,
        markText: mark ? mark.textContent.replace(/\s+/g, ' ').trim() : null };
    });
    check('on a phone: no origin pill either', onPhone.there && onPhone.pills === 0, onPhone.pills);
    check('on a phone: "Sent" still said exactly once', onPhone.saysSent === 1, onPhone.saysSent);
    /* REVERSED with its desktop twin: the marker is not drawn anywhere, and
       the phone renders the same builder, so it must be absent here too. */
    check('on a phone: no spent-Send marker either', !onPhone.markOn, onPhone.markText);
    await ph2.screenshot({ path: path.join(OUT, '07-phone-card.png') });
    await ph2.close();

    /* ---- 11. THE TOP BAR IS A HANDLE (owner-asked, 13 Aug 2026) ----
       The panel can be dragged around the screen by its top bar, on both
       seats. THREE decisions were taken with it and each one is a claim a
       screenshot cannot make on its own:

         · once moved, the reader's position WINS. The default panel follows
           its card, re-placed on every scroll, resize and repaint — so the
           thing to prove is not that a drag moves it but that a scroll and a
           repaint afterwards leave it exactly where it was put.
         · it stops FADING when its card scrolls out of the column. That rule
           belongs to a panel pinned to a card.
         · the position is remembered ACROSS CARDS for the sitting, so a reader
           working down the column drags once, not once per clause.

       AND A BROWSER IS THE ONLY PLACE ANY OF IT CAN BE ASKED: jsdom has no
       pointer events, no pointer capture, no layout to clamp against and no
       cascade to resolve a cursor from. Every check below is a real mouse
       press, a real move and a real release. */
    const bar = pg => pg.evaluate(([seen]) => {
      const s = eval(seen);
      const pop = document.getElementById('rl-pop');
      const head = pop && pop.querySelector('.rl-pop-head');
      if (!head) return { there: false };
      const cs = getComputedStyle(head);
      return { there: true, box: s(pop), head: s(head),
        cursor: cs.cursor, select: cs.userSelect || cs.webkitUserSelect,
        touch: cs.touchAction, title: head.getAttribute('title') || '',
        away: pop.classList.contains('rl-pop-away'),
        at: window.rlPopAt ? window.rlPopAt() : 'no rlPopAt' };
    }, [SEEN]);
    /* A real drag: press the LEFT of the bar (the ✕ lives at its right), move
       in steps so pointermove actually fires, release. */
    const dragBar = async (pg, dx, dy) => {
      const h = await pg.evaluate(() => {
        const el = document.querySelector('#rl-pop .rl-pop-head');
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { x: r.left + 40, y: r.top + r.height / 2 };
      });
      if (!h) return false;
      await pg.mouse.move(h.x, h.y);
      await pg.mouse.down();
      for (let i = 1; i <= 6; i++) await pg.mouse.move(h.x + dx * i / 6, h.y + dy * i / 6);
      await pg.mouse.up();
      await pause(220);
      return true;
    };

    /* Back to a clean owner's page: section 9 handed the round over, and a
       drag reads better against a column that still has both sides on it. */
    const drag = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
    drag.on('pageerror', e => errors.push('drag: ' + e.message));
    await drag.goto(PAGE, { waitUntil: 'load' });
    await drag.evaluate(() => window.READY);
    await pause(400);
    await drag.evaluate(() => document.querySelector('#rl-changes .rl-card [data-rl-pop]').click());
    await pause(400);

    const before = await bar(drag);
    check('11 · the panel opens beside its card, unmoved',
      before.there && before.at === null, before.there ? String(before.at) : 'no panel');
    check('11 · THE BAR SAYS IT IS A HANDLE — grab cursor, and a word for it',
      before.cursor === 'grab' && /drag/i.test(before.title),
      `cursor:${before.cursor} · "${before.title}"`);
    check('11 · and a drag over it will not select the text it passes',
      before.select === 'none' && before.touch === 'none',
      `user-select:${before.select} touch-action:${before.touch}`);

    await dragBar(drag, -260, 150);
    await drag.screenshot({ path: path.join(OUT, '08-dragged.png') });
    const moved = await bar(drag);
    check('11 · A REAL DRAG MOVES IT — by the distance the mouse travelled',
      moved.there && Math.abs((moved.box.x - before.box.x) + 260) <= 6
        && Math.abs((moved.box.y - before.box.y) - 150) <= 6,
      `${before.box.x},${before.box.y} → ${moved.box.x},${moved.box.y}`);
    check('11 · and the position is recorded, not merely painted',
      !!moved.at && Math.abs(moved.at.x - moved.box.x) <= 2,
      JSON.stringify(moved.at));
    /* The whole reason the panel borrows the card's body: a drag must not have
       quietly rebuilt it into a copy with no handlers. */
    const intact = await drag.evaluate(() => {
      const pop = document.getElementById('rl-pop');
      return { notes: !!pop.querySelector('.rl-cnotes'),
        onCard: document.querySelectorAll('#rl-changes .rl-card .rl-cnotes').length,
        boxes: document.querySelectorAll('#rl-pop textarea, #rl-pop .rl-cnote-add').length };
    });
    check('11 · THE BORROWED BODY CAME WITH IT — one node, still in the panel',
      intact.notes && intact.boxes > 0,
      `thread=${intact.notes} composer bits=${intact.boxes} still-on-cards=${intact.onCard}`);

    /* ---- THE POSITION HOLDS. Three things that used to re-place it. ---- */
    const afterScroll = await drag.evaluate(async () => {
      const col = document.getElementById('rl-changes');
      col.scrollTop = col.scrollTop + 320;
      col.dispatchEvent(new Event('scroll', { bubbles: true }));
      await new Promise(r => setTimeout(r, 260));
      const p = document.getElementById('rl-pop').getBoundingClientRect();
      return { x: Math.round(p.left), y: Math.round(p.top) };
    });
    check('11 · SCROLLING THE COLUMN NO LONGER SNATCHES IT BACK',
      Math.abs(afterScroll.x - moved.box.x) <= 1 && Math.abs(afterScroll.y - moved.box.y) <= 1,
      `${afterScroll.x},${afterScroll.y}`);

    const afterPaint = await drag.evaluate(async () => {
      renderRedline();
      await new Promise(r => setTimeout(r, 420));
      const pop = document.getElementById('rl-pop');
      if (!pop) return { gone: true };
      const p = pop.getBoundingClientRect();
      return { gone: false, x: Math.round(p.left), y: Math.round(p.top),
        notes: !!pop.querySelector('.rl-cnotes') };
    });
    check('11 · AND A REPAINT LEAVES IT WHERE THE READER PUT IT',
      !afterPaint.gone && Math.abs(afterPaint.x - moved.box.x) <= 1
        && Math.abs(afterPaint.y - moved.box.y) <= 1 && afterPaint.notes,
      afterPaint.gone ? 'the panel went' : `${afterPaint.x},${afterPaint.y} body=${afterPaint.notes}`);

    /* Its card scrolled clean out of the column. A PINNED panel fades here, on
       purpose; a panel somebody parked does not. */
    const offCard = await drag.evaluate(async ([seen]) => {
      const s = eval(seen);
      const col = document.getElementById('rl-changes');
      col.scrollTop = col.scrollHeight;
      col.dispatchEvent(new Event('scroll', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      const pop = document.getElementById('rl-pop');
      const card = document.querySelector(`[data-nego-card="${rlPopId()}"]`);
      const cr = card ? card.getBoundingClientRect() : null;
      const colr = col.getBoundingClientRect();
      return { away: pop.classList.contains('rl-pop-away'), box: s(pop),
        cardOut: !!cr && (cr.bottom < colr.top + 4 || cr.top > colr.bottom - 4) };
    }, [SEEN]);
    check('11 · IT NO LONGER VANISHES WITH ITS CARD once it has been moved',
      !offCard.away && offCard.box.on,
      `card scrolled out=${offCard.cardOut} · away=${offCard.away} · ${offCard.box.w}x${offCard.box.h}`);

    /* ---- CLAMPED. A panel dragged past the corner is a panel you lose. ---- */
    await dragBar(drag, 4000, 4000);
    const far = await bar(drag);
    check('11 · IT CANNOT BE DRAGGED OFF THE SCREEN',
      far.box.x >= 0 && far.box.y >= 0 && far.box.x + far.box.w <= 1440
        && far.box.y + far.box.h <= 980,
      `x${far.box.x} y${far.box.y} ${far.box.w}x${far.box.h} in 1440x980`);

    /* ---- REMEMBERED ACROSS CARDS, for this sitting ---- */
    await dragBar(drag, -700, -300);
    const parked = await bar(drag);
    const next = await drag.evaluate(async () => {
      const btns = [...document.querySelectorAll('#rl-changes .rl-card [data-rl-pop]')];
      const first = rlPopId();
      const other = btns.find(b => b.getAttribute('data-rl-pop') !== first);
      if (!other) return { enough: false };
      other.click();
      await new Promise(r => setTimeout(r, 350));
      const pop = document.getElementById('rl-pop');
      const p = pop.getBoundingClientRect();
      return { enough: true, first, second: rlPopId(),
        x: Math.round(p.left), y: Math.round(p.top) };
    });
    check('11 · THE NEXT CARD OPENS WHERE THE LAST ONE WAS LEFT',
      !next.enough || (next.first !== next.second
        && Math.abs(next.x - parked.box.x) <= 2 && Math.abs(next.y - parked.box.y) <= 2),
      next.enough ? `${next.first} → ${next.second} at ${next.x},${next.y} (was ${parked.box.x},${parked.box.y})`
        : 'only one card on the table');

    /* ---- THE ✕ SHARES THE HANDLE AND MUST STILL BE A PRESS ---- */
    const closedByX = await drag.evaluate(async () => {
      const x = document.querySelector('#rl-pop [data-rl-pop-close]');
      const r = x.getBoundingClientRect();
      return { cursor: getComputedStyle(x).cursor, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await drag.mouse.move(closedByX.x, closedByX.y);
    await drag.mouse.down();
    /* A press is never perfectly still. Two pixels must stay a press. */
    await drag.mouse.move(closedByX.x + 2, closedByX.y + 1);
    await drag.mouse.up();
    await pause(350);
    check('11 · THE ✕ ON THE HANDLE IS STILL A PRESS, not a two-pixel drag',
      await drag.evaluate(() => !document.getElementById('rl-pop')),
      `its cursor is ${closedByX.cursor}`);

    /* ---- AND THE WAY BACK ---- */
    const back = await drag.evaluate(async ([seen]) => {
      const s = eval(seen);
      document.querySelector('#rl-changes .rl-card [data-rl-pop]').click();
      await new Promise(r => setTimeout(r, 300));
      const kept = document.getElementById('rl-pop').getBoundingClientRect().left;
      window.rlPopResetAt();
      window.rlPopPlace();
      await new Promise(r => setTimeout(r, 220));
      const pop = document.getElementById('rl-pop');
      const card = document.querySelector(`[data-nego-card="${rlPopId()}"]`);
      return { kept: Math.round(kept), at: window.rlPopAt(), box: s(pop), card: s(card) };
    }, [SEEN]);
    check('11 · putting it back returns it beside its card',
      back.at === null && back.box.x + back.box.w <= back.card.x + 2 && back.box.x !== back.kept,
      `parked at ${back.kept} → back at ${back.box.x}, card starts ${back.card.x}`);
    await drag.close();

    /* ---- THE COUNTERPARTY'S SEAT, which is a different MOUNT ----
       One builder draws both, so this is a check that nothing about their
       page — a different root, a different host id, a page with no toolbar —
       stops the handle working there. parity.html is the harness that mounts
       the two seats off one record. */
    const par = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
    par.on('pageerror', e => errors.push('parity: ' + e.message));
    await par.goto(PAGE.replace('redline.html', 'parity.html'), { waitUntil: 'load' });
    await par.evaluate(() => window.READY);
    await pause(500);
    await par.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(700);
    const cpOpened = await par.evaluate(async () => {
      const b = document.querySelector('#rl-changes .rl-card [data-rl-pop]');
      if (!b) return false;
      b.click();
      await new Promise(r => setTimeout(r, 350));
      return !!document.getElementById('rl-pop');
    });
    check('11 · counterparty: the panel opens on their page too', cpOpened);
    if (cpOpened){
      const cpBefore = await bar(par);
      check('11 · counterparty: THE SAME HANDLE, on the same one builder',
        cpBefore.cursor === 'grab' && /drag/i.test(cpBefore.title),
        `cursor:${cpBefore.cursor} · "${cpBefore.title}"`);
      await dragBar(par, -220, 120);
      const cpMoved = await bar(par);
      check('11 · counterparty: AND IT DRAGS THERE — one fix reaches both seats',
        Math.abs((cpMoved.box.x - cpBefore.box.x) + 220) <= 6
          && Math.abs((cpMoved.box.y - cpBefore.box.y) - 120) <= 6,
        `${cpBefore.box.x},${cpBefore.box.y} → ${cpMoved.box.x},${cpMoved.box.y}`);
      const cpHeld = await par.evaluate(async () => {
        renderSharePortal(buildSharePayload(CONTRACT, { purpose: 'negotiate' }),
          { token: 'harness-token', share: { recipientName: 'Amina Wanjiru' } });
        await new Promise(r => setTimeout(r, 500));
        const pop = document.getElementById('rl-pop');
        if (!pop) return null;
        const r = pop.getBoundingClientRect();
        return { x: Math.round(r.left), y: Math.round(r.top) };
      });
      check('11 · counterparty: their repaint does not move it either',
        !cpHeld || (Math.abs(cpHeld.x - cpMoved.box.x) <= 2 && Math.abs(cpHeld.y - cpMoved.box.y) <= 2),
        cpHeld ? `${cpHeld.x},${cpHeld.y}` : 'the panel closed with the repaint');
      await par.screenshot({ path: path.join(OUT, '09-counterparty-dragged.png') });
    }
    await par.close();

    /* ---- AND NOT ON A PHONE ----
       Down there the panel is a bottom sheet pinned where a thumb reaches.
       Dragging it somewhere would be dragging it out of reach, so the handler
       refuses AND the bar does not dress like a handle — a cursor promising a
       drag the code will not do is a fault a reader blames themselves for. */
    const ph3 = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    ph3.on('pageerror', e => errors.push('phone3: ' + e.message));
    await ph3.goto(PAGE, { waitUntil: 'load' });
    await ph3.evaluate(() => window.READY);
    await pause(500);
    await ph3.evaluate(() => document.querySelector('#rl-changes .rl-card [data-rl-pop]').click());
    await pause(400);
    const phBefore = await bar(ph3);
    check('11 · phone: the sheet\'s bar is not dressed as a handle',
      phBefore.there && phBefore.cursor !== 'grab', phBefore.cursor);
    /* DOWN, into the sheet's own body, and that is not fussiness. Released
       outside the panel the press is an ordinary click on the page, which
       closes it by the rule in rlPopWireOnce — and a closed panel would pass
       "it did not move" for the wrong reason. On the desktop the same gesture
       stays open because pointer capture puts the release back on the bar,
       which is the difference under test. */
    await dragBar(ph3, 0, 200);
    const phAfter = await bar(ph3);
    check('11 · phone: AND A DRAG DOES NOT MOVE THE SHEET',
      phAfter.there && Math.abs(phAfter.box.y - phBefore.box.y) <= 1 && phAfter.at === null,
      phAfter.there ? `y${phBefore.box.y} → y${phAfter.box.y}, remembered=${JSON.stringify(phAfter.at)}`
        : 'the sheet closed instead');
    await ph3.screenshot({ path: path.join(OUT, '10-phone-sheet-unmoved.png') });
    await ph3.close();

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
