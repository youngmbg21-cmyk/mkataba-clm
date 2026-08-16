/* Chromium verification of owner / counterparty parity.
   ============================================================
   THIS FILE EXISTS BECAUSE JSDOM CANNOT SEE THE DEFECT IT MEASURES.

   The counterparty's contract pane was 419px wide where the owner's was 925px,
   their page was 2.6 screens tall where the owner's filled the window, the
   Discussion tab was clipped at the panel edge, the origin badge truncated to
   "Count", and change cards broke mid-identifier — all while roughly a hundred
   test files passed. jsdom has no layout engine and no cascade, so every one of
   those is invisible to it by construction. A claim about how a page LOOKS is
   not proven by a test that cannot look.

   ONE CONTRACT, TWO SURFACES. Both sides render from the same record through
   the product's own code — renderRedline() for the owner, renderSharePortal()
   off a payload from the real buildSharePayload() for the counterparty. Two
   fixtures would let the pages differ for reasons that have nothing to do with
   the layout under test.

   WHAT IS MEASURED, and why each one:
     1  the contract pane, both sides, within tolerance
     2  the change index, both sides
     3  the page does not scroll — the columns scroll inside themselves
     4  the sidebar has one face on both seats, and the notes are on the cards
     5  no label is truncated (badge, tab, card identifier)
     6  exactly one document surface on the counterparty's page
     7  the owner's distribution and round controls are absent from their seat
     8  no AI control on their side
     9  the card's Edit route behaves identically on both seats
    10  the origin badge names a party, and a long name still fits the card

   Every number comes from getBoundingClientRect or getComputedStyle. None is
   read out of a stylesheet.

   Screenshots go to test/chromium/shots/parity/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'parity');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/* How far apart the two sides may be before it is a defect rather than a
   rounding difference. 5% of the owner's width — the counterparty's page
   legitimately carries a banner the owner's does not, so demanding equality
   would be demanding the wrong thing. */
const TOLERANCE = 0.05;

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

/* Measured on whichever surface is currently mounted. Selectors are the shared
   component's own ids, which is the point: if the counterparty's page stops
   mounting the shared component, these come back null and the checks fail
   rather than quietly measuring something else. */
const MEASURE = () => {
  const box = sel => { const el = document.querySelector(sel);
    if (!el) return null; const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
      left: Math.round(r.left), right: Math.round(r.right) }; };
  /* A label is truncated when the text is wider than the box painting it. Read
     from scrollWidth vs clientWidth, which is the browser's own answer. */
  const clipped = sel => Array.from(document.querySelectorAll(sel))
    .filter(el => el.scrollWidth > el.clientWidth + 1)
    .map(el => (el.textContent || '').trim().slice(0, 40));
  const tabs = Array.from(document.querySelectorAll('.rl-side-tab')).map(el => {
    const r = el.getBoundingClientRect();
    const host = el.closest('.rl-side') || el.parentElement;
    const hr = host.getBoundingClientRect();
    return { text: (el.textContent || '').trim().slice(0, 24), w: Math.round(r.width),
      inside: r.left >= hr.left - 1 && r.right <= hr.right + 1,
      visible: r.width > 0 && r.height > 0 };
  });
  return {
    doc: box('#rl-doc') || box('.nego-doc'),
    index: box('#rl-changes-col') || box('.nego-pane.index'),
    pageH: document.documentElement.scrollHeight,
    winH: window.innerHeight,
    tabs,
    /* The conversation moved onto the cards when the Discussion face went,
       and into the clause panel's rows on 16 Aug 2026. */
    cardNotes: document.querySelectorAll('#rl-cp-body .rl-cnotes').length,
    clippedLabels: clipped('.rl-side-tab, .nego-origin, .nego-chip, .nego-card-id'),
    /* Counted across BOTH renderings of a contract: .doc-surface is the plain
       document (the old #pt-doc, and the viewer's sheet) and .nego-doc is the
       workbench's marked-up pane. The claim is "one contract on the page", not
       "one of a particular class" — counting only one class is how a duplicate
       in the other shape would pass unnoticed. */
    docSurfaces: document.querySelectorAll('.doc-surface, .nego-doc').length,
    ids: ['pt-doc', 'portal-redline', 'portal-plain', 'pt-name', 'pt-sign', 'pt-accept',
      'nego-copilot', 'nego-insert-lib', 'nego-save-draft', 'nego-bulk-acc',
      'nego-send', 'nego-exit', 'nego-publish-round', 'nego-close-round']
      .filter(id => !!document.getElementById(id)),
    bulkLabels: Array.from(document.querySelectorAll('.nego-bulk button'))
      .map(el => (el.textContent || '').trim()),
    sideToggle: document.querySelectorAll('[data-redline-side]').length,
    backArrow: document.querySelectorAll('[data-rl-back]').length,
    shellActs: Array.from(document.querySelectorAll('[data-rl-shell]')).map(el => el.getAttribute('data-rl-shell')),
  };
};

/* ---- THE EDIT ROUTE, AS A PROBE ----
   Pressing Edit on a Tracked Changes card: jump to the clause, land on it, open
   its editor. One function so the two seats cannot be measured differently —
   the whole point is the comparison. Returns { error } rather than throwing, so
   a seat that has no card Edit at all fails as a readable check instead of as a
   stack trace. */
const CARD_EDIT = async () => {
  /* NAMED, NOT POSITIONAL. The column's order is a product decision — work
     still being argued about comes first and settled work sinks (rlCardSort) —
     so "the first card" is not a stable way to reach a particular redline. The
     assertions below are about the Net-45 ask specifically. FOUND ON THE
     RECORD, not by the card's text (16 Aug 2026): the routing row carries no
     copy of the wording any more, so the change is looked up by what it
     proposes and its card by its id. */
  const net45 = (window.negoChanges ? negoChanges(window.CONTRACT) : [])
    .find(x => /forty-five|Net-45/.test(String(x.newText || x.proposedText || '')));
  const want = net45 && document.querySelector(
    `#rl-changes [data-nego-card="${CSS.escape(net45.id)}"]`);
  const btn = (want && want.querySelector('[data-rl-edit]'))
    || document.querySelector('#rl-changes [data-rl-edit]');
  if (!btn) return { error: 'no card Edit button on this seat' };
  const id = btn.getAttribute('data-rl-edit');
  const clause = document.querySelector(`#rl-doc [data-clause="${CSS.escape(id)}"]`);
  if (!clause) return { error: 'the card names a clause the document does not draw' };
  const w = el => Math.round(el.getBoundingClientRect().width);
  const before = w(clause);
  btn.click();
  await new Promise(r => setTimeout(r, 800));
  const s = getComputedStyle(clause);
  const head = clause.querySelector('.rl-clause-h');
  const ed = clause.querySelector('[data-nego-editor]');
  const tools = clause.querySelector('.rl-tools');
  const para = ed && ed.querySelector('p');
  return { before, after: w(clause),
    maxWidth: s.maxWidth, overflowX: s.overflowX,
    headWrap: head ? getComputedStyle(head).whiteSpace : null,
    arrived: clause.classList.contains('rl-arrived'),
    wearsPickerClass: clause.classList.contains('rl-jump'),
    editorOpen: !!ed, editing: clause.classList.contains('is-editing'),
    paraWrap: para ? getComputedStyle(para).whiteSpace : null,
    toolsOpacity: tools ? getComputedStyle(tools).opacity : null,
    toolsPointer: tools ? getComputedStyle(tools).pointerEvents : null,
    /* The wording the editor opened ON. The fixture files Net-45 over a Net-30
       baseline, so which of the two comes back says whether the editor
       continues the redline or silently restarts from underneath it. */
    opensOn: ed ? ed.textContent.replace(/\s+/g, ' ').trim() : null };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
  page.on('pageerror', e => check('no page error', false, e.message));
  await page.goto(PAGE, { waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(300);

  const owner = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '01-owner.png') });

  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await pause(400);
  const cp = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, '02-counterparty.png'), fullPage: true });

  /* ---- 9. the reported edit route, driven on BOTH seats ----
     Everything above measures the page AT REST. This drives it: press Edit on a
     Tracked Changes card, which is the route the field report took, and read
     what the clause becomes on each side.

     It is here rather than in redline-verify because the failure it guards is a
     parity failure by nature. The counterparty's page mounts the same component
     through a different door — redlineEmbed under .redline-page.rl-embed, no
     #view-redline, no contract picker in its toolbar — so "the owner's page is
     fixed" is not evidence about theirs. Three of the four faults in this
     sequence lived in shared code and one lived in a shared stylesheet; all
     four could have been fixed on one seat and not the other, and no check
     would have said so.

     Measured on each side and then COMPARED, so a future fix applied to one
     door and not the other fails here even if both look individually plausible. */
  const cpEdit = await page.evaluate(CARD_EDIT);
  await page.screenshot({ path: path.join(OUT, '03-counterparty-editing.png') });
  await page.reload({ waitUntil: 'load' });
  await page.evaluate(() => window.READY);
  await pause(300);
  const ownerEdit = await page.evaluate(CARD_EDIT);
  await page.screenshot({ path: path.join(OUT, '04-owner-editing.png') });

  /* ---- 1. the contract pane ---- */
  if (!owner.doc || !cp.doc){
    check('1 both sides mount the shared document pane', false,
      `owner=${JSON.stringify(owner.doc)} counterparty=${JSON.stringify(cp.doc)}`);
  } else {
    const drift = Math.abs(owner.doc.w - cp.doc.w) / owner.doc.w;
    check('1 contract pane within 5% of the owner\'s',
      drift <= TOLERANCE, `owner ${owner.doc.w}px · counterparty ${cp.doc.w}px · ${(drift * 100).toFixed(1)}% apart`);
  }

  /* ---- 2. the change index ---- */
  if (owner.index && cp.index){
    const drift = Math.abs(owner.index.w - cp.index.w) / owner.index.w;
    check('2 change index within 5% of the owner\'s',
      drift <= TOLERANCE, `owner ${owner.index.w}px · counterparty ${cp.index.w}px`);
  } else check('2 both sides mount the change index', false,
    `owner=${!!owner.index} counterparty=${!!cp.index}`);

  /* ---- 3. the page does not scroll ---- */
  check('3 owner page fills the window and does not scroll',
    owner.pageH <= owner.winH + 2, `${owner.pageH}px in ${owner.winH}px`);
  check('3 counterparty page does not scroll either',
    cp.pageH <= cp.winH + 2, `${cp.pageH}px in ${cp.winH}px`);

  /* ---- 4. one sidebar face, on both seats ----
     This checked that BOTH sidebar tabs reached the counterparty's panel
     un-clipped. The Discussion face is gone from both seats (10 Aug 2026) and
     the conversation reads on the change's own card, so parity is now the
     absence of the switcher plus the presence of the notes. */
  check('4 no sidebar switcher on their page', cp.tabs.length === 0, cp.tabs.length);
  check('4 and the conversation is on the change instead',
    cp.cardNotes > 0, `${cp.cardNotes} change rows carry their notes in the panel`);

  /* ---- 5. nothing truncated ---- */
  check('5 no label truncated on the counterparty\'s page',
    cp.clippedLabels.length === 0, cp.clippedLabels.join(' | ') || 'none');

  /* ---- 6. one document ---- */
  check('6 exactly one document surface on their page',
    cp.docSurfaces === 1, `${cp.docSurfaces} found`);
  check('6 the duplicate document and standalone editor are gone',
    !cp.ids.includes('pt-doc') && !cp.ids.includes('portal-redline') && !cp.ids.includes('portal-plain'),
    cp.ids.join(', ') || 'none present');

  /* ---- 7. the owner's controls are not on their seat ---- */
  check('7 no side toggle on their page', cp.sideToggle === 0, cp.sideToggle);
  check('7 no back arrow — there is no page behind theirs', cp.backArrow === 0, cp.backArrow);
  check('7 no Share or Import — distribution stays with the owner',
    !cp.shellActs.includes('share') && !cp.shellActs.includes('import'),
    cp.shellActs.join(', ') || 'none');
  check('7 no round controls', !cp.ids.includes('nego-publish-round') && !cp.ids.includes('nego-close-round'),
    cp.ids.join(', ') || 'none');

  /* ---- 8. no AI, no clause library, no draft state ---- */
  check('8 no AI or clause-library control on their side',
    !cp.ids.includes('nego-copilot') && !cp.ids.includes('nego-insert-lib') && !cp.ids.includes('nego-save-draft'),
    cp.ids.filter(i => /copilot|insert-lib|save-draft/.test(i)).join(', ') || 'none');
  /* Checked by LABEL, not by presence. The button keeps its id on both sides —
     it is the same act, accept the other side's pending asks — and what must
     not cross to the counterparty is the claim that HaTi has sorted the
     changes by risk, because that sorting reads our playbook and our scan
     signals. So the assertion is about what the button says it does. */
  check('8 no risk-derived bulk verb on their side',
    !/Non-Risk/i.test(cp.bulkLabels.join(' ')), cp.bulkLabels.join(' | ') || 'none');
  /* AND NOW NEITHER SIDE HAS ONE. The verbs left our column first (10 Aug
     2026) — deciding the other side's wording is a press per clause, and
     Publish Round is our batch act. Their seat kept the plain pair a while
     longer as their only way to answer a whole round; it went the same day the
     head was restyled as a rule, because the press disposes of every ask we
     filed from a header with no clause in front of the reader.

     THE PARITY CLAIM IS THEREFORE SYMMETRIC NOW, which is the strongest form
     it has taken: no bulk verb on either seat, risk-sorted or plain. Check 8
     above still earns its place — it is the one that would fire if the
     risk-sorted verb ever crossed over. */
  check('8 and NEITHER seat carries a bulk verb',
    cp.bulkLabels.length === 0 && owner.bulkLabels.length === 0,
    `theirs: ${cp.bulkLabels.join(' | ') || 'none'} · ours: ${owner.bulkLabels.join(' | ') || 'none'}`);

  /* ---- 9. the edit route behaves the same on both seats ---- */
  if (cpEdit.error || ownerEdit.error){
    check('9 both seats offer the card\'s Edit route', false,
      `owner: ${ownerEdit.error || 'ok'} · counterparty: ${cpEdit.error || 'ok'}`);
  } else {
    for (const [who, r] of [['owner', ownerEdit], ['counterparty', cpEdit]]){
      /* THE REPORTED DEFECT. rl-jump was the clause's flash AND the toolbar
         contract picker's class, so landing on a clause clamped it to a
         dropdown's width. Compared against the clause's own width a moment
         earlier — never a fixed number. */
      check(`9 ${who}: landing on a clause does not shrink it`,
        r.after === r.before, `${r.before} -> ${r.after}px`);
      check(`9 ${who}: no dropdown clamp or clipping on the clause`,
        r.maxWidth === 'none' && r.overflowX === 'visible',
        `max-width:${r.maxWidth}, overflow-x:${r.overflowX}`);
      check(`9 ${who}: the clause heading wraps rather than being cut off`,
        r.headWrap === 'normal', r.headWrap);
      check(`9 ${who}: the clause says it has arrived, without the picker's name`,
        r.arrived && !r.wearsPickerClass,
        `arrived:${r.arrived} wearsPickerClass:${r.wearsPickerClass}`);
      check(`9 ${who}: the editor opened, and the clause knows it`,
        r.editorOpen && r.editing, `editor:${r.editorOpen} is-editing:${r.editing}`);
      /* The editor is the clause: the room's body rules have to reach it, or
         the wording changes shape the moment it is edited. */
      check(`9 ${who}: the wording wraps in the editor as it does in the document`,
        r.paraWrap === 'normal', r.paraWrap);
      check(`9 ${who}: the hover verbs stand down while the clause is typed in`,
        r.toolsOpacity === '0' && r.toolsPointer === 'none',
        `opacity ${r.toolsOpacity}, pointer-events ${r.toolsPointer}`);
      /* Net-45 is the filed redline; Net-30 is the baseline under it. */
      check(`9 ${who}: the editor continues the redline, it does not restart it`,
        /Net-45/.test(r.opensOn) && !/Net-30/.test(r.opensOn),
        (r.opensOn || '').slice(0, 80));
    }
    /* AND THE TWO AGREE. Each assertion above could pass on one seat and fail
       on the other; this is the one that says they are the same product. */
    const same = ['maxWidth', 'overflowX', 'headWrap', 'arrived', 'wearsPickerClass',
      'editorOpen', 'editing', 'paraWrap', 'toolsOpacity', 'toolsPointer']
      .filter(k => String(ownerEdit[k]) !== String(cpEdit[k]));
    check('9 the two seats edit a clause identically', same.length === 0,
      same.length ? same.map(k => `${k}: ${ownerEdit[k]} vs ${cpEdit[k]}`).join(' · ')
        : 'every measured property matches');
  }

  /* ---- 10. the origin pill is OFF the card, and the head still fits ----
     THE CLAIM THIS REPLACES. The badge read "Counterparty" until 2026-08-02 —
     the word both parties use for the party opposite them, so on the
     counterparty's own page it labelled the SENDER's ask with the reader's own
     word for themselves. It was then made to name the organisation that
     actually asked, which meant carrying text of unbounded length ("APEX
     LOGISTICS & WAREHOUSING KENYA LTD") in a head that also holds the change
     id, the door into the panel and the status badge, on a column ~285px wide.
     What was measured here was that a long name elided rather than shoving the
     status badge off the row.

     THE PILL CAME OFF ON 12 Aug 2026 — a third tag in a head with two,
     answering a question the column's own Mine / Theirs filter and the meta
     line underneath both already answer. So the measurement turns round: with
     a monstrous company name on the record, the head must carry no pill AND
     the status badge must still be on the row. The second half is the part
     worth keeping — removing an element is exactly the kind of change that
     silently relies on a flex rule that went with it. */
  const badges = await page.evaluate(() => {
    /* A company name long enough to have been a problem, pushed through the
       real renderer rather than hoped for in the fixture. */
    window.CONTRACT.counterparty = 'APEX LOGISTICS & WAREHOUSING KENYA LTD';
    /* Through the page's OWN renderer. An earlier draft mounted redlineEmbed on
       a host that only exists on the counterparty's surface, so on this one it
       silently did nothing and the check read the pre-existing card — passing
       or failing for reasons unconnected to the name under test. */
    renderRedline();
    const card = document.querySelector('#rl-changes [data-rl-origin="them"]');
    if (!card) return null;
    const st = card.querySelector('.rl-badge');
    const meta = card.querySelector('.rl-card-meta');
    const head = card.querySelector('.rl-card-top').getBoundingClientRect();
    return { pill: !!card.querySelector('.rl-origin'),
      headText: card.querySelector('.rl-card-top').textContent.replace(/\s+/g, ' ').trim(),
      statusOnRow: st.getBoundingClientRect().right <= head.right + 1,
      spine: getComputedStyle(card).borderLeftColor,
      spineW: getComputedStyle(card).borderLeftWidth,
      meta: (meta ? meta.textContent : '').replace(/\s+/g, ' ').trim(),
      metaTitle: meta ? (meta.getAttribute('title') || '') : '' };
  });
  if (!badges){
    check('10 there is a card to read the head of', false, 'no card carrying an origin');
  } else {
    check('10 THE ORIGIN PILL IS GONE FROM THE HEAD', !badges.pill && !/ask/i.test(badges.headText),
      badges.headText);
    check('10 and a monstrous company name no longer has anywhere to shove anything',
      badges.statusOnRow, `status on row: ${badges.statusOnRow}`);
    check('10 the coloured left edge still marks it as theirs',
      parseFloat(badges.spineW) >= 2 && !!badges.spine, `${badges.spineW} ${badges.spine}`);
    /* RE-POINTED 16 Aug 2026: the routing row's visible meta line is the
       clause; the organisation moved into that line's HOVER (and, in words,
       into the clause panel's row). The claim — the monstrous name is still
       reachable from the card, and never printed as the reader's own company —
       survives on the hover. */
    check('10 and the name reads on the meta line\'s hover',
      /APEX LOGISTICS & WAREHOUSING KENYA LTD/.test(badges.metaTitle || ''),
      badges.metaTitle || badges.meta);
  }

  /* The owner's side is the control: if these were absent there too, every
     assertion above would be passing for the wrong reason.
     nego-bulk-acc is no longer one of them — it is gone from our column by
     design — so the control is the send, which is the act our seat has and
     theirs does not. */
  check('control — the owner DOES have the controls being checked for',
    owner.ids.includes('nego-copilot') || owner.ids.includes('nego-send'),
    owner.ids.join(', ') || 'none');

  await browser.close();
  srv.close();

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  console.log(`screenshots → test/chromium/shots/parity`);
  if (bad.length){ process.exitCode = 1; }
})();
