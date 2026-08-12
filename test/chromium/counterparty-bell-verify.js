/* Chromium verification: the counterparty gets a bell, and an alerts panel.
   ============================================================
   Owner-asked, 13 Aug 2026. The owner has a bell in the top bar: it carries a
   count, and pressing it slides an ALERTS panel in from the right listing
   everything waiting on them, each row a door to the thing itself. The
   counterparty had nothing of the kind — they get a page and are left to work
   out for themselves what is outstanding.

   WHY THIS FILE EXISTS AND NOT A NODE TEST. Every claim here is about pixels
   and presses: that the bell is on screen, that a panel slides in from the
   right, that a backdrop covers the page, that three different gestures close
   it, and that a row's press lands on the thing it named with nothing left
   covering it. jsdom resolves no cascade, has no layout engine and will
   happily press a control no reader could see — which is precisely how this
   page once spent a week with every deal verb hidden and every test green.

   WHAT IS MEASURED:
     1  the bell is in THEIR header, beside the reading verbs, and visible
     2  its count is real, and it hides at zero
     3  pressing it slides a panel in from the right, with a backdrop
     4  ✕, the backdrop and Escape each close it
     5  every row is a door, and the panel closes behind it
     6  the count agrees with the numbers already printed on the page
     7  ONE bell on their page — the floating amber one stands down there,
        and the owner's workbench still has its own
     8  the wall line is still the first thing under the header, unfolded
     9  nothing internal appears anywhere in the panel
    10  no bell on the phone
    11  opening the link started no negotiation on a contract that had none

   Screenshots go to test/chromium/shots/cpbell/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'cpbell');
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

/* A control is present when it paints pixels — not when it exists. This page
   has been burned by that distinction before. */
const SEEN = `(el => { if (!el) return null;
  const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
  return { on: r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden',
    left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top),
    w: Math.round(r.width), h: Math.round(r.height) }; })`;

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

    /* ---- 11. COUNTING MUST NOT WRITE, and this is measured BEFORE anything
       else so a later step cannot mask it. negoChanges() runs negoInit(),
       which creates a negotiation on any contract that has none; a panel that
       asked it about the page's contract would start one every repaint. */
    const virgin = await page.evaluate(() => {
      const c = { id: 'MK-VIRGIN', name: 'Untouched', counterparty: 'Nobody',
        status: 'Draft', folder: 'dist', fields: {}, metadata: {}, audit: [],
        rounds: [], versions: [], signatures: [], comments: [],
        redlineText: '<h1>Untouched</h1><h2>1. One</h2><p>A clause.</p>', format: 'rich' };
      state.contracts.push(c);
      return { before: !!c.negotiation, id: c.id };
    });

    await page.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(900);

    /* ---- 1. THE BELL IS IN THEIR HEADER ---- */
    const bell = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const b = document.getElementById('pt-bell');
      const hist = document.getElementById('pt-hist');
      const head = document.querySelector('.pw-id');
      return { box: s(b), inHead: !!(b && head && head.contains(b)),
        besideReading: !!(b && hist),
        dot: (() => { const d = document.getElementById('pt-bell-dot');
          return d ? { text: d.textContent.trim(), hidden: d.hidden, box: s(d) } : null; })(),
        /* THE OWNER'S SHELL IS STILL HIDDEN. Reusing the owner's bell would
           have meant un-hiding it, which drops the whole workspace onto this
           page. */
        shellHidden: !!document.getElementById('app-shell')
          && document.getElementById('app-shell').classList.contains('hidden'),
        ownerBell: !!(document.getElementById('hdr-notify')
          && document.getElementById('hdr-notify').getBoundingClientRect().width > 0) };
    }, [SEEN]);
    check('1 THE BELL IS IN THEIR HEADER ROW, and it is visible pixels',
      bell.box && bell.box.on && bell.inHead, JSON.stringify(bell.box));
    check('1 beside the reading verbs it was asked to sit with', bell.besideReading);
    check('1 AND THE OWNER\'S SHELL IS STILL HIDDEN — nothing was un-hidden to get a bell',
      bell.shellHidden && !bell.ownerBell, `shell hidden=${bell.shellHidden}, owner bell drawn=${bell.ownerBell}`);

    /* ---- 2. THE COUNT IS REAL ---- */
    check('2 the count is drawn and is a number', bell.dot && !bell.dot.hidden
      && /^\d+\+?$/.test(bell.dot.text), bell.dot && bell.dot.text);

    /* ---- 6. AND IT AGREES WITH THE PAGE ----
       One count, many surfaces: the bell must not say 3 over a column
       showing 2. Read the page's OWN numbers and compare. */
    const agree = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#pt-alerts-body .pt-alert-t')]
        .map(x => x.textContent.trim());
      const awaiting = (rows.find(t => /waiting on your answer/i.test(t)) || '').match(/\d+/);
      /* The cards the column actually draws for them to answer. */
      const cards = [...document.querySelectorAll('#rl-changes [data-nego-card]')]
        .filter(el => /Awaiting you/i.test(el.textContent || '')).length;
      return { alertN: awaiting ? Number(awaiting[0]) : (rows.some(t => /waiting on your answer/i.test(t)) ? -1 : 0),
        cards, rows };
    });
    check('6 ONE COUNT, MANY SURFACES — the bell agrees with the column',
      agree.alertN === agree.cards, `panel says ${agree.alertN}, column draws ${agree.cards}`);

    /* ---- 3 & 4. THE PANEL ---- */
    await page.click('#pt-bell');
    await pause(400);
    const open = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const a = document.getElementById('pt-alerts');
      const sc = document.getElementById('pt-alerts-scrim');
      const r = a.getBoundingClientRect();
      return { box: s(a), scrim: !!sc && !sc.hidden,
        fromRight: Math.abs(r.right - window.innerWidth) <= 2,
        onScreen: r.left < window.innerWidth && r.right > 0,
        title: (document.querySelector('.pt-alerts-title') || {}).textContent };
    }, [SEEN]);
    check('3 pressing it slides a panel IN FROM THE RIGHT',
      open.box && open.box.on && open.fromRight && open.onScreen, JSON.stringify(open.box));
    check('3 with a dimmed backdrop', open.scrim);
    check('3 and a title saying what it is', /alert/i.test(open.title || ''), open.title);
    await page.screenshot({ path: path.join(OUT, '01-open.png') });

    const closes = async how => {
      /* OPENED, not toggled. The panel may already be open from the check
         above, and a toggle would shut it and then time out looking for a ✕
         nobody can see — which is what happened while this was being written. */
      await page.evaluate(() => portalAlertsOpen(true));
      await pause(320);
      if (how === 'x') await page.click('#pt-alerts-close');
      else if (how === 'scrim') await page.click('#pt-alerts-scrim', { position: { x: 40, y: 300 } });
      else await page.keyboard.press('Escape');
      await pause(320);
      return page.evaluate(() => {
        const a = document.getElementById('pt-alerts');
        const r = a.getBoundingClientRect();
        return !a.classList.contains('open') && r.left >= window.innerWidth - 1;
      });
    };
    check('4 the ✕ closes it', await closes('x'));
    check('4 the backdrop closes it', await closes('scrim'));
    check('4 Escape closes it', await closes('esc'));

    /* ---- 5. EVERY ROW IS A DOOR, AND THE PANEL CLOSES BEHIND IT ---- */
    await page.evaluate(() => portalAlertsOpen(true));
    await pause(350);
    const door = await page.evaluate(async () => {
      const btn = document.querySelector('#pt-alerts-body [data-pt-alert]');
      if (!btn) return { none: true };
      const kind = btn.getAttribute('data-pt-kind');
      btn.click();
      await new Promise(r => setTimeout(r, 700));
      const a = document.getElementById('pt-alerts');
      /* Where it took them: the first undecided change's card, in view. */
      const card = document.activeElement && document.activeElement.closest
        ? document.activeElement.closest('[data-nego-card]') : null;
      const r = card ? card.getBoundingClientRect() : null;
      return { kind, closed: !a.classList.contains('open'),
        landedOn: card ? card.getAttribute('data-nego-card') : null,
        inView: !!r && r.top > -20 && r.top < window.innerHeight,
        covered: !!r && r.right > a.getBoundingClientRect().left };
    });
    check('5 a row is a door — it goes to the thing it names',
      !door.none && !!door.landedOn, JSON.stringify(door));
    check('5 AND THE PANEL CLOSES BEHIND IT — a door under a panel is not a door',
      door.closed, String(door.closed));
    check('5 the thing it pointed at is on screen', door.inView, String(door.inView));
    await page.screenshot({ path: path.join(OUT, '02-after-door.png') });

    /* ---- 7. ONE BELL ON THEIR PAGE ---- */
    const bells = await page.evaluate(([seen]) => {
      const s = eval(seen);
      return { floating: document.querySelectorAll('.rl-notices-fab').length,
        header: document.querySelectorAll('#pt-bell').length,
        readNote: s(document.getElementById('rl-read-note')) };
    }, [SEEN]);
    check('7 ONE BELL ON THEIR PAGE — the floating amber one is not drawn here',
      bells.floating === 0 && bells.header === 1, `floating=${bells.floating}, header=${bells.header}`);

    /* ---- 8. THE WALL LINE IS STILL FIRST, AND UNFOLDED ----
       "Decisions stay on this page until you press Send" is read before they
       start; folding it behind a bell produces exactly the mistake it exists
       to prevent. */
    const wall = await page.evaluate(([seen]) => {
      const s = eval(seen);
      const w = document.querySelector('.pw-mount .rl-wall') || document.querySelector('#rl-banner .rl-wall');
      const head = document.querySelector('.pw-id');
      const mount = document.querySelector('.pw-mount');
      return { box: s(w), text: w ? w.textContent.replace(/\s+/g, ' ').trim().slice(0, 90) : null,
        underHead: !!(w && head && w.getBoundingClientRect().top >= head.getBoundingClientRect().bottom - 2),
        firstInMount: !!(w && mount && mount.querySelector('.rl-wall') === w) };
    }, [SEEN]);
    check('8 THE WALL LINE IS STILL DRAWN, UNFOLDED, under the header',
      wall.box && wall.box.on && wall.underHead, wall.text);
    check('8 and it is the first of its kind on the working area', wall.firstInMount);

    /* ---- 9. NOTHING INTERNAL LEAKS ---- */
    const leak = await page.evaluate(() => {
      const t = (document.getElementById('pt-alerts') || {}).textContent || '';
      const bad = ['review', 'reviewer', 'Legal', 'colleague', 'internal', 'lead', 'desk',
        'Wanjiru Kamau', 'held back', 'cleared'];
      return { text: t.replace(/\s+/g, ' ').trim(),
        hits: bad.filter(w => new RegExp(w, 'i').test(t)) };
    });
    check('9 NOTHING INTERNAL IS ANYWHERE IN THE PANEL',
      leak.hits.length === 0, leak.hits.join(', ') || leak.text.slice(0, 120));

    /* ---- 2b. AND IT HIDES AT ZERO ----
       Answer everything and send nothing back: with nothing outstanding the
       bell must not sit there decorating the header. */
    const zero = await page.evaluate(async ([seen]) => {
      const s = eval(seen);
      /* Through the page's own state, not by rewriting the DOM. */
      PORTAL_OPTS.responded = false;
      const c = portalNegoContract(PORTAL_OPTS.payload);
      (c.changes || []).forEach(x => { if (x.authorSide === 'owner') x.status = 'accepted'; });
      /* Nothing held, nothing changed, no unread reply: the empty case. */
      Object.keys(PORTAL_NEGO_DECISIONS).forEach(k => delete PORTAL_NEGO_DECISIONS[k]);
      Object.keys(PORTAL_NEGO_PROPOSED).forEach(k => delete PORTAL_NEGO_PROPOSED[k]);
      window.portalChangedText = () => null;
      PORTAL_OPTS.share = { recipientName: 'Amina Wanjiru' };   // no expiry to report
      portalPaintAlerts(c, PORTAL_OPTS.payload);
      await new Promise(r => setTimeout(r, 200));
      const d = document.getElementById('pt-bell-dot');
      return { dotHidden: !!d && d.hidden, bell: s(document.getElementById('pt-bell')),
        body: (document.getElementById('pt-alerts-body') || {}).textContent };
    }, [SEEN]);
    check('2b THE COUNT HIDES AT ZERO — a badge that is always on is one nobody reads',
      zero.dotHidden, `dot hidden=${zero.dotHidden}`);
    check('2b and the panel has a real empty state',
      /nothing needs you/i.test(zero.body || ''), (zero.body || '').replace(/\s+/g, ' ').trim().slice(0, 70));

    /* ---- 11 (concluded). NO NEGOTIATION WAS STARTED ---- */
    const after = await page.evaluate(id =>
      !!(state.contracts.find(c => c.id === id) || {}).negotiation, virgin.id);
    check('11 OPENING THE LINK STARTED NO NEGOTIATION on a contract that had none',
      virgin.before === false && after === false, `before=${virgin.before}, after=${after}`);

    /* ---- 10. THE PHONE KEEPS WHAT IT HAS ---- */
    const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    ph.on('pageerror', e => errors.push('phone: ' + e.message));
    await ph.goto(PAGE, { waitUntil: 'load' });
    await ph.evaluate(() => window.READY);
    await pause(500);
    await ph.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(900);
    const phone = await ph.evaluate(([seen]) => {
      const s = eval(seen);
      return { bell: s(document.getElementById('pt-bell')),
        notices: document.querySelectorAll('.rl-notices, .m-notices, .rl-note-card').length };
    }, [SEEN]);
    check('10 NO BELL ON THE PHONE — the header there has no room for one',
      !phone.bell || !phone.bell.on, JSON.stringify(phone.bell));
    await ph.screenshot({ path: path.join(OUT, '03-phone.png') });
    await ph.close();

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    srv.close();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  console.log('screenshots → test/chromium/shots/cpbell');
  process.exit(failed.length ? 1 : 0);
})();
