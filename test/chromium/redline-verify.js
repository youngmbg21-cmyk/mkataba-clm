/* Chromium verification of the Redline Workbench refactor.
   ============================================================
   jsdom has no layout engine and no cascade, so everything the refactor claims
   about how the page LOOKS is asserted at the rule level in
   test/f89-negotiation-workbench-refactor.test.js and has to be confirmed
   against a real box model here. Every number this prints is measured from
   getComputedStyle or getBoundingClientRect, not read out of a stylesheet:

     1  the header carries no border and no card shadow
     2  the contract sheet has exactly ONE frame, not a sheet inside a panel
     3  no modal or floating dialog opens on the redline route
     4  a selection drives the docked Copilot panel
     5  the selection menu offers exactly three actions
     6  the uploaded headings and block structure survive to the canvas
     7  the contract body and the Tracked Changes diff compute to one size
     8  every marked span carries a "Last updated by …" tooltip
     9  folding the discussion re-deals the row to two thirds / one third
    10  only live redlines have cards
    11  the four card verbs compute to the specified fills
    12  Edit scrolls the document to the clause and opens the editor
    13  the batch send is in the toolbar, counted and animated

   Screenshots go to test/chromium/shots/redline/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'redline');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = '/opt/pw-browsers/chromium';
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

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/redline.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  await page.screenshot({ path: path.join(OUT, '01-workbench.png'), fullPage: false });

  /* ---- 1. the header is a band ---- */
  const head = await page.evaluate(() => {
    const s = getComputedStyle(document.querySelector('#view-redline .rl-head'));
    return { border: s.borderTopWidth, shadow: s.boxShadow, radius: s.borderTopLeftRadius,
      bg: s.backgroundColor };
  });
  check('1 header has no border', head.border === '0px', head.border);
  check('1 header has no card shadow', head.shadow === 'none', head.shadow);
  check('1 header has no fill of its own',
    /rgba\(0, 0, 0, 0\)|transparent/.test(head.bg), head.bg);

  /* ---- 2. one sheet, not a sheet inside a panel ----
     Counted rather than asserted: the failure was two visible frames a few
     pixels apart, so what is measured is how many painted borders sit between
     the column edge and the first clause. */
  const sheet = await page.evaluate(() => {
    const col = document.getElementById('rl-doc');
    const paper = col.querySelector('.nego-doc');
    const framed = el => {
      const s = getComputedStyle(el);
      return parseFloat(s.borderTopWidth) > 0 || (s.boxShadow !== 'none' && s.boxShadow !== '');
    };
    let n = 0, el = paper;
    while (el && el !== col.parentElement){ if (framed(el)) n++; el = el.parentElement; }
    return { frames: n, paperBorder: getComputedStyle(paper).borderTopWidth,
      paperShadow: getComputedStyle(paper).boxShadow,
      colBorder: getComputedStyle(col).borderTopWidth,
      paperWidth: paper.getBoundingClientRect().width,
      colWidth: col.getBoundingClientRect().width };
  });
  check('2 the inner sheet has no border', sheet.paperBorder === '0px', sheet.paperBorder);
  check('2 the inner sheet has no shadow', sheet.paperShadow === 'none', sheet.paperShadow);
  check('2 the column carries no border either', sheet.colBorder === '0px', sheet.colBorder);
  check('2 exactly one painted frame around the contract text', sheet.frames === 1,
    `${sheet.frames} frame(s)`);
  /* The sheet takes the column's width rather than the 720px measure .nego-doc
     sets for the room — allowing only for the scroller's own 4px gutter each
     side. A centred 720px block inside a wider column is the "page floating in
     a panel" look the flattening exists to end. */
  check('2 the sheet fills the column', sheet.paperWidth >= sheet.colWidth - 12,
    `${Math.round(sheet.paperWidth)} of ${Math.round(sheet.colWidth)}px`);

  /* ---- 6. the uploaded document survives ---- */
  const struct = await page.evaluate(() => {
    const doc = document.getElementById('rl-doc');
    const heads = [...doc.querySelectorAll('.rl-clause-h')].map(h => h.textContent.trim());
    /* The headings the FILE carried, read back out of the uploaded markup.
       Compared as sets rather than pattern-matched, because the only correct
       answer to "what does this heading say" is "whatever the document says". */
    const src = [...new DOMParser().parseFromString(CONTRACT.redlineText, 'text/html')
      .querySelectorAll('h2')].map(h => h.textContent.replace(/\s+/g, ' ').trim());
    const payment = [...doc.querySelectorAll('.rl-clause')]
      .find(s => /Payment Terms/i.test(s.textContent));
    return { heads, src,
      bold: !!doc.querySelector('.nego-body strong'),
      list: doc.querySelectorAll('.nego-body ol li').length,
      paras: payment ? payment.querySelectorAll('.nego-body .rl-line, .nego-body > p').length : 0 };
  });
  check('6 every heading is drawn exactly as the file wrote it',
    struct.heads.join('|') === struct.src.join('|'),
    `${JSON.stringify(struct.heads)} vs ${JSON.stringify(struct.src)}`);
  check('6 "1.1 Definitions" survives verbatim', struct.heads.includes('1.1 Definitions'));
  check('6 "8.2(a)" is not re-punctuated',
    struct.heads.some(h => h.indexOf('8.2(a)') === 0)
    && !struct.heads.some(h => /^8\.2\.\s*\(a\)/.test(h)));
  check('6 bold survives ingestion', struct.bold);
  check('6 a numbered sub-clause list stays a list', struct.list === 2, struct.list);
  check('6 a two-paragraph clause stays two blocks', struct.paras >= 2, struct.paras);

  /* ---- 7. one computed type size ---- */
  const type = await page.evaluate(() => {
    const body = document.querySelector('#rl-doc .nego-body');
    const diff = document.querySelector('#rl-changes .rl-card-diff');
    return { body: getComputedStyle(body).fontSize, diff: getComputedStyle(diff).fontSize };
  });
  check('7 contract body and card diff compute to the same size',
    type.body === type.diff, `${type.body} / ${type.diff}`);

  /* ---- 8. attribution on every mark ---- */
  const marks = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#rl-doc ins, #rl-doc del')];
    return { n: els.length,
      titled: els.filter(e => /^Last updated by /.test(e.getAttribute('title') || '')).length,
      sample: els.length ? els[0].getAttribute('title') : '' };
  });
  check('8 the document carries marked wording', marks.n > 0, marks.n);
  check('8 every mark names who last touched it', marks.n > 0 && marks.titled === marks.n,
    `${marks.titled}/${marks.n} · ${marks.sample}`);

  /* ---- 10 / 11. the column and its verbs ---- */
  const cards = await page.evaluate(() => {
    const live = negoChanges(CONTRACT).filter(x => x.status === 'pending').length;
    const btn = sel => {
      const b = document.querySelector('#rl-changes ' + sel);
      if (!b) return null;
      const s = getComputedStyle(b);
      return { bg: s.backgroundColor, fg: s.color };
    };
    return { cards: document.querySelectorAll('#rl-changes [data-nego-card]').length,
      clauses: document.querySelectorAll('#rl-doc .rl-clause').length, live,
      acc: btn('button.rl-acc'), rej: btn('button.rl-rej'),
      edit: btn('button.rl-edit'), send: btn('button.rl-send') };
  });
  check('10 one card per live redline, not per clause',
    cards.cards === cards.live && cards.clauses > cards.cards,
    `${cards.cards} cards · ${cards.live} live · ${cards.clauses} clauses`);
  check('11 Accept is emerald-600', cards.acc && cards.acc.bg === 'rgb(5, 150, 105)',
    cards.acc && cards.acc.bg);
  check('11 Reject is red-600', cards.rej && cards.rej.bg === 'rgb(220, 38, 38)',
    cards.rej && cards.rej.bg);
  check('11 Edit is slate-200 on slate-800', cards.edit && cards.edit.bg === 'rgb(226, 232, 240)',
    cards.edit && `${cards.edit.bg} / ${cards.edit.fg}`);
  check('11 Send is emerald-600', cards.send && cards.send.bg === 'rgb(5, 150, 105)',
    cards.send && cards.send.bg);

  /* ---- 13. the batch send ---- */
  const blast = await page.evaluate(() => {
    const b = document.querySelector('[data-rl-blast]');
    if (!b) return null;
    const s = getComputedStyle(b);
    const headBox = document.querySelector('.rl-head').getBoundingClientRect();
    return { text: b.textContent.replace(/\s+/g, ' ').trim(), bg: s.backgroundColor,
      anim: s.animationName, inHeader: b.getBoundingClientRect().top < headBox.bottom + 1,
      unsent: negoUnsentAsks(CONTRACT, 'owner').length };
  });
  check('13 the batch send is in the toolbar', !!blast && blast.inHeader);
  check('13 it counts the unsent drafts',
    !!blast && blast.text.indexOf(`(${blast.unsent})`) >= 0, blast && blast.text);
  check('13 it is animated', !!blast && blast.anim === 'rlBlast', blast && blast.anim);
  check('13 it is emerald-600', !!blast && blast.bg === 'rgb(5, 150, 105)', blast && blast.bg);

  /* ---- 9. the fold re-deals the row ----
     Measured as a RATIO of the grid's own width, which is what "two thirds"
     means; a span that stops applying would show up here and nowhere else. */
  const fold = await page.evaluate(() => {
    const grid = document.getElementById('rl-grid');
    const w = () => ({ grid: grid.getBoundingClientRect().width,
      doc: document.getElementById('rl-doc').getBoundingClientRect().width,
      chg: document.getElementById('rl-changes-col').getBoundingClientRect().width,
      disc: document.getElementById('rl-disc-col').offsetParent === null ? 0
        : document.getElementById('rl-disc-col').getBoundingClientRect().width });
    const open = w();
    rlToggleDiscussion(true);
    const shut = w();
    rlToggleDiscussion(false);
    return { open, shut };
  });
  const ratio = (a, b) => a / b;
  check('9 open, the document takes half the row',
    Math.abs(ratio(fold.open.doc, fold.open.grid) - 0.5) < 0.03,
    ratio(fold.open.doc, fold.open.grid).toFixed(3));
  check('9 folded, the document takes two thirds',
    Math.abs(ratio(fold.shut.doc, fold.shut.grid) - 2 / 3) < 0.03,
    ratio(fold.shut.doc, fold.shut.grid).toFixed(3));
  check('9 folded, tracked changes takes one third',
    Math.abs(ratio(fold.shut.chg, fold.shut.grid) - 1 / 3) < 0.03,
    ratio(fold.shut.chg, fold.shut.grid).toFixed(3));
  check('9 folded, the discussion leaves the row rather than sitting at zero',
    fold.shut.disc === 0, fold.shut.disc);

  /* ---- 12. Edit lands on the clause ---- */
  const jump = await page.evaluate(async () => {
    const btn = document.querySelector('#rl-changes [data-rl-edit]');
    const id = btn.getAttribute('data-rl-edit');
    const clause = document.querySelector(`#rl-doc [data-clause="${CSS.escape(id)}"]`);
    const scroller = document.getElementById('nego-scroll-work');
    const seen = () => {
      const b = clause.getBoundingClientRect(), v = scroller.getBoundingClientRect();
      return b.top < v.bottom && b.bottom > v.top;
    };
    scroller.scrollTop = scroller.scrollHeight;      // send it out of view first
    await new Promise(r => setTimeout(r, 80));
    /* Whether it WAS out of view is recorded rather than assumed: a document
       short enough to fit the column cannot scroll, and a check that demanded
       movement would fail on a contract with nothing wrong with it. What must
       hold either way is that the clause is on the screen afterwards. */
    const wasHidden = !seen();
    btn.click();
    await new Promise(r => setTimeout(r, 600));
    return { wasHidden, inView: seen(),
      lit: clause.classList.contains('rl-jump'),
      editing: !!clause.querySelector('[data-nego-editor]'),
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('12 Edit puts the clause on screen', jump.inView,
    jump.wasHidden ? 'it had scrolled out of view and came back' : 'the document fits the column');
  check('12 the clause says it has arrived', jump.lit);
  check('12 and the editor opens on the clause itself, inline', jump.editing);
  check('12 no modal was opened to do it', jump.modals === 0, jump.modals);
  await page.screenshot({ path: path.join(OUT, '02-edit-jump.png') });

  /* ---- 3 / 4 / 5. the Copilot route ---- */
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(250);
  const menu = await page.evaluate(() => {
    const tool = [...document.querySelectorAll('#rl-doc .rl-tool')]
      .find(b => /AI Assist/.test(b.textContent));
    tool.click();
    const m = document.querySelector('.nego-selmenu');
    return { open: !!m,
      items: m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim()) : [],
      dialogs: document.querySelectorAll('.nego-aipop, .lab-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length };
  });
  check('5 the selection menu offers exactly three actions', menu.items.length === 3,
    JSON.stringify(menu.items));
  check('5 they are rephrase, shorten, tag',
    /Rephrase with Copilot/.test(menu.items[0] || '')
    && /Shorten & Simplify/.test(menu.items[1] || '')
    && /Tag with internal note/.test(menu.items[2] || ''));
  check('3 opening the menu opens no dialog', menu.dialogs === 0 && menu.modals === 0);
  await page.screenshot({ path: path.join(OUT, '03-selection-menu.png') });

  const routed = await page.evaluate(async () => {
    const btn = [...document.querySelectorAll('.nego-selmenu [data-nego-ai]')]
      .find(b => b.getAttribute('data-nego-ai') === 'shorten');
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 700));
    const panel = document.getElementById('ai-panel');
    return { open: panel.classList.contains('open'), docked: panel.classList.contains('docked'),
      scrim: document.getElementById('ai-scrim').classList.contains('open'),
      card: !!document.querySelector('#ai-feed .ai-proposal'),
      dialogs: document.querySelectorAll('.nego-aipop').length,
      modals: document.querySelectorAll('#modal-root *').length,
      docVisible: document.getElementById('rl-doc').getBoundingClientRect().width > 200 };
  });
  check('4 the Copilot panel opens', routed.open);
  check('4 docked, with no scrim over the document', routed.docked && !routed.scrim);
  check('4 the document is still on screen beside it', routed.docVisible);
  check('3 the proposal is a card in the panel, not a popover', routed.card && routed.dialogs === 0,
    JSON.stringify({ card: routed.card, dialogs: routed.dialogs }));
  check('3 no modal anywhere on the redline route', routed.modals === 0, routed.modals);
  await page.screenshot({ path: path.join(OUT, '04-copilot-panel.png') });

  /* Tagging goes to the Discussion column, not to a dialog either. */
  const tagged = await page.evaluate(async () => {
    const ch = negoChanges(CONTRACT).find(x => x.status === 'pending');
    const ok = rlTagInternalNote({ c: CONTRACT, clauseId: ch.clauseId, text: 'thirty (30) days' });
    await new Promise(r => setTimeout(r, 120));
    const input = document.getElementById('nego-ti-' + ch.id);
    const pressed = [...document.querySelectorAll(`[data-nego-vis][data-for="${ch.id}"]`)]
      .filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.getAttribute('data-nego-vis'));
    return { ok, focused: document.activeElement === input, value: input ? input.value : '',
      inDiscussion: !!(input && input.closest('#rl-disc-col')), pressed,
      dialogs: document.querySelectorAll('.nego-aipop, .lab-notepop').length };
  });
  check('5 Tag lands in the Discussion column', tagged.ok && tagged.inDiscussion);
  check('5 with the internal switch pressed',
    tagged.pressed.length === 1 && tagged.pressed[0] === 'internal', JSON.stringify(tagged.pressed));
  check('5 the field is focused and carries the quote',
    tagged.focused && /thirty \(30\) days/.test(tagged.value), tagged.value);
  check('3 and it opened no dialog', tagged.dialogs === 0);
  await page.screenshot({ path: path.join(OUT, '05-tag-note.png') });

  await browser.close();
  srv.close();
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log(`screenshots → ${path.relative(ROOT, OUT)}`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
