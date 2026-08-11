/* Chromium verification: THE REDLINE CARD — SHUT BY DEFAULT, OPENED BY ITS HEAD.
   ============================================================
   Asked for (Young, 11 Aug 2026). A card arrives showing TWO areas and no more:

     1  the header/message block — the change id, whose ask it is, the status
        badge, the clause line, and a preview of the proposed wording;
     2  the action bar — Edit, Retract, Send, aligned right.

   Everything else — "Why they asked" and the notes/reply section — is folded
   away, and pressing the header block reveals it. Pressing it again puts it
   back.

   THE VERBS MOVED OUT OF THE FOLD, which is the change. They used to sit inside
   the part display:none is applied to, so a shut card offered nothing to press
   and the commonest gesture on the page cost a press to reach.

   WHAT MUST NOT MOVE WITH THEM, and why this file exists rather than a node
   test: ONLY the header block toggles. Edit, Retract, Send, the
   Internal/Send-to-them switch, the reply box and "Send this reply" each do
   their own job and nothing else — a verb that folds the card away underneath
   the hand reaching for it is the failure this rule was written for, and jsdom
   has no cascade and no boxes, so it cannot tell a folded control from a
   visible one. Every check below is measured off real geometry.

   Screenshots go to test/chromium/shots/card-collapse/.
   Run: node test/chromium/card-collapse-verify.js */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'card-collapse');
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

/* Everything the page is asked in one block, so each press can re-query the
   card it just repainted — a node held across a repaint is detached, its
   classes frozen and its rectangle zero. */
const PROBE = `(() => {
  const settle = ms => new Promise(r => setTimeout(r, ms == null ? 260 : ms));
  const card = id => document.querySelector('#rl-changes [data-nego-card="' + CSS.escape(id) + '"]');
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const seen = el => { const b = box(el); return !!b && b.w > 0 && b.h > 0; };
  const press = el => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  return { settle, card, box, seen, press };
})()`;

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

    /* The fixture files its changes without a reason; a reason is exactly what
       the fold is supposed to hide, so one is put on the change under test. */
    const ID = await page.evaluate(() => {
      const ch = negoChanges(CONTRACT).find(x => x.authorSide === 'counterparty' && x.status === 'pending')
        || negoChanges(CONTRACT)[0];
      ch.why = 'Our accounts payable cycle runs monthly, so Net-30 forces out-of-cycle payments.';
      renderRedline();
      return ch.id;
    });
    await pause(400);
    await page.screenshot({ path: path.join(OUT, '01-column-shut.png') });

    /* ---- 1. THE DEFAULT STATE IS TWO AREAS ---- */
    const shut = await page.evaluate(([probeSrc, id]) => {
      const p = eval(probeSrc);
      const el = p.card(id);
      if (!el) return { there: false };
      const q = s => el.querySelector(s);
      return { there: true,
        open: el.getAttribute('data-rl-open'),
        cardBox: p.box(el),
        head: p.seen(q('.rl-card-head')),
        cid: (q('.rl-card-id') || {}).textContent || '',
        pill: p.seen(q('.rl-origin')),
        badge: p.seen(q('.rl-badge')),
        meta: p.seen(q('.rl-card-meta')),
        preview: p.seen(q('.rl-card-diff')),
        actions: p.seen(q('.rl-card-actions')),
        verbBoxes: [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')]
          .map(b => ({ t: (b.textContent || '').trim(), ...p.box(b) })),
        why: p.seen(q('.rl-card-why')),
        whyInDom: !!q('.rl-card-why'),
        notes: p.seen(q('.rl-cnotes')),
        notesInDom: !!q('.rl-cnotes'),
        reply: p.seen(q('.rl-cnote-in')),
        visSwitch: p.seen(q('.nego-visswitch')),
      };
    }, [PROBE, ID]);

    check('a card arrives shut', shut.there && shut.open === '0', shut.open);
    check('the header block is on screen — id, whose ask, status, clause, preview',
      shut.head && shut.pill && shut.badge && shut.meta && shut.preview,
      `id=${shut.cid} pill=${shut.pill} badge=${shut.badge} meta=${shut.meta} preview=${shut.preview}`);
    check('and the action bar is on screen with it',
      shut.actions && shut.verbBoxes.length > 0, `${shut.verbBoxes.length} verbs`);
    check('every verb on a shut card is real, pressable pixels',
      shut.verbBoxes.length > 0 && shut.verbBoxes.every(v => v.w > 0 && v.h > 0),
      shut.verbBoxes.map(v => `${v.t} ${v.w}x${v.h}`).join(' · '));
    check('"Why they asked" is rendered and NOT shown', shut.whyInDom && !shut.why,
      `inDom=${shut.whyInDom} shown=${shut.why}`);
    check('the notes and reply section is rendered and NOT shown',
      shut.notesInDom && !shut.notes && !shut.reply && !shut.visSwitch,
      `notes=${shut.notes} reply=${shut.reply} switch=${shut.visSwitch}`);

    /* ---- 2. THE HEADER BLOCK OPENS IT ---- */
    const opened = await page.evaluate(async ([probeSrc, id]) => {
      const p = eval(probeSrc);
      p.press(p.card(id).querySelector('.rl-card-head'));
      await p.settle();
      const el = p.card(id);            // re-queried: the press repainted it
      const q = s => el.querySelector(s);
      return { open: el.getAttribute('data-rl-open'),
        why: p.seen(q('.rl-card-why')), notes: p.seen(q('.rl-cnotes')),
        reply: p.seen(q('.rl-cnote-in')), visSwitch: p.seen(q('.nego-visswitch')),
        sendReply: p.seen(q('.rl-cnote-add')),
        actions: p.seen(q('.rl-card-actions')),
        verbs: [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')]
          .every(b => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0; }) };
    }, [PROBE, ID]);
    await page.screenshot({ path: path.join(OUT, '02-card-open.png') });

    check('pressing the header block opens it', opened.open === '1');
    check('and the two folded sections appear — "Why they asked" and the notes',
      opened.why && opened.notes, `why=${opened.why} notes=${opened.notes}`);
    check('the reply box, the Internal / Send-to-them switch and its send button come with them',
      opened.reply && opened.visSwitch && opened.sendReply,
      `reply=${opened.reply} switch=${opened.visSwitch} send=${opened.sendReply}`);
    check('and the action bar is still there, unmoved by the unfold',
      opened.actions && opened.verbs);

    /* ---- 3. AND THE SAME PRESS PUTS IT BACK ---- */
    const reshut = await page.evaluate(async ([probeSrc, id]) => {
      const p = eval(probeSrc);
      p.press(p.card(id).querySelector('.rl-card-head'));
      await p.settle();
      const el = p.card(id);
      return { open: el.getAttribute('data-rl-open'),
        why: p.seen(el.querySelector('.rl-card-why')),
        actions: p.seen(el.querySelector('.rl-card-actions')) };
    }, [PROBE, ID]);
    check('pressing it again collapses it', reshut.open === '0' && !reshut.why);
    check('and the action bar survives the collapse', reshut.actions);

    /* ---- 4. NOTHING BELOW THE HEAD TOGGLES ANYTHING ----
       The rule this file is really here for. Each control is pressed on a card
       whose state is known, and the state is read again afterwards. Accept,
       Reject and Send are deliberately not pressed: they settle the change and
       take the card off the column, so a fold could not be told from a
       decision. Their structural safety is asserted instead — they are not
       inside the element that toggles. */
    const inert = await page.evaluate(async ([probeSrc, id]) => {
      const p = eval(probeSrc);
      const out = {};
      /* open it, then press into the composer and its controls */
      p.press(p.card(id).querySelector('.rl-card-head'));
      await p.settle();
      out.start = p.card(id).getAttribute('data-rl-open');

      p.press(p.card(id).querySelector('.rl-cnote-in'));
      await p.settle();
      out.afterReplyBox = p.card(id).getAttribute('data-rl-open');

      p.press(p.card(id).querySelector('.nego-visswitch .v-sh'));
      await p.settle();
      out.afterSwitch = p.card(id).getAttribute('data-rl-open');

      /* "Send this reply" with an empty box: it refuses, which is the point —
         it must not fold the card on its way to refusing. */
      p.press(p.card(id).querySelector('.rl-cnote-add'));
      await p.settle();
      out.afterSendReply = p.card(id).getAttribute('data-rl-open');

      /* And on a SHUT card, the action bar must not open it either. Edit is
         the safe one to press: it navigates to the clause and settles
         nothing. */
      p.press(p.card(id).querySelector('.rl-card-head'));
      await p.settle();
      out.shutAgain = p.card(id).getAttribute('data-rl-open');
      const edit = p.card(id).querySelector('.rl-card-actions [data-rl-edit]');
      out.hasEdit = !!edit;
      if (edit) p.press(edit);
      await p.settle(400);
      out.afterEdit = p.card(id) ? p.card(id).getAttribute('data-rl-open') : 'gone';

      /* Structural: no verb is inside the toggle, on any card on the page. */
      out.verbsInsideHead = [...document.querySelectorAll('#rl-changes .rl-card-head .rl-card-verbs')].length;
      out.verbsInsideFold = [...document.querySelectorAll('#rl-changes .rl-card-body .rl-card-verbs')].length;
      return out;
    }, [PROBE, ID]);

    check('the reply box does not fold the card', inert.start === '1' && inert.afterReplyBox === '1',
      `${inert.start} → ${inert.afterReplyBox}`);
    check('the Internal / Send-to-them switch does not fold the card',
      inert.afterSwitch === '1', inert.afterSwitch);
    check('"Send this reply" does not fold the card', inert.afterSendReply === '1',
      inert.afterSendReply);
    check('and Edit on a shut card does not unfold it',
      inert.hasEdit && inert.shutAgain === '0' && inert.afterEdit === '0',
      `hasEdit=${inert.hasEdit} ${inert.shutAgain} → ${inert.afterEdit}`);
    check('no verb is inside the header block, on any card',
      inert.verbsInsideHead === 0, String(inert.verbsInsideHead));
    check('and none is inside the part that folds away',
      inert.verbsInsideFold === 0, String(inert.verbsInsideFold));

    /* ---- 5. EVERY CARD ON THE COLUMN, NOT JUST THE ONE UNDER TEST ---- */
    const all = await page.evaluate(([probeSrc]) => {
      const p = eval(probeSrc);
      const cards = [...document.querySelectorAll('#rl-changes [data-nego-card]')];
      const shutOnes = cards.filter(el => el.getAttribute('data-rl-open') === '0');
      const bad = shutOnes.filter(el => {
        const verbs = [...el.querySelectorAll('.rl-card-actions .rl-card-verbs button')];
        if (!verbs.length) return false;             // a settled card offers nothing — fine
        return !verbs.every(b => p.seen(b));
      });
      return { total: cards.length, shut: shutOnes.length, bad: bad.length,
        withVerbs: shutOnes.filter(el => el.querySelector('.rl-card-actions .rl-card-verbs button')).length };
    }, [PROBE]);
    check('the whole column arrives shut', all.shut === all.total,
      `${all.shut} of ${all.total}`);
    check('and every verb on every shut card is visible pixels',
      all.bad === 0 && all.withVerbs > 0,
      `${all.withVerbs} cards carry verbs, ${all.bad} with a hidden one`);

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
