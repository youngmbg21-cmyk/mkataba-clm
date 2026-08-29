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
  /* RE-POINTED AGAIN, 16 Aug 2026 (Option 4): a change that needs nothing is
     a RECEIPT now and carries no Edit — on the counterparty's seat their own
     sent Net-45 ask is exactly that. The probe's subject is the ROUTE, so it
     runs on a card that HAS the door on this seat: the Net-45 card where it is
     a working card, else any working card over a PENDING change — and the
     continues-vs-restarts claim reads that change's own record instead of a
     hard-coded phrase. */
  const net45 = (window.negoChanges ? negoChanges(window.CONTRACT) : [])
    .find(x => /forty-five|Net-45/.test(String(x.newText || x.proposedText || '')));
  const want = net45 && document.querySelector(
    `#rl-changes [data-nego-card="${CSS.escape(net45.id)}"]`);
  const btns = [...document.querySelectorAll('#rl-changes [data-rl-edit]')];
  const btn = (want && want.querySelector('[data-rl-edit]'))
    || btns.find(b => { const card = b.closest('[data-nego-card]');
        const ch = negoChangeById(CONTRACT, card.getAttribute('data-nego-card'));
        return ch && ch.status === 'pending'; })
    || btns[0];
  if (!btn) return { error: 'no card Edit button on this seat' };
  const probeCh = negoChangeById(CONTRACT,
    btn.closest('[data-nego-card]').getAttribute('data-nego-card'));
  const words = t => String(t || '').split(/\W+/).filter(x => x.length > 3);
  const marker = words(probeCh && probeCh.newText)
    .find(x => !words(probeCh && probeCh.oldText).includes(x)) || null;
  const goneWord = words(probeCh && probeCh.oldText)
    .find(x => !words(probeCh && probeCh.newText).includes(x)) || null;
  const id = btn.getAttribute('data-rl-edit');
  const clause = document.querySelector(`#rl-doc [data-clause="${CSS.escape(id)}"]`);
  if (!clause) return { error: 'the card names a clause the document does not draw' };
  const w = el => Math.round(el.getBoundingClientRect().width);
  const before = w(clause);
  btn.click();
  await new Promise(r => setTimeout(r, 800));
  const s = getComputedStyle(clause);
  const head = clause.querySelector('.rl-clause-h');
  /* RE-STAGED 16 Aug 2026: the card's Edit no longer opens an editor on the
     clause — the tool row is retired and all writing happens in the panel. So
     the editor half of this measurement now walks the door that exists: the
     clause's Edit pill, then the panel's ＋. The clause itself must carry NO
     editor and NO tool row on either seat. */
  /* RE-POINTED 20 Aug 2026: the card's Edit now opens the clause panel
     ITSELF (owner-asked — "Edit should take you to the edit side panel, not
     to the contract"), so the pill press is only the fallback for a world
     where it did not. Pressing the pill unconditionally would TOGGLE the
     freshly opened panel shut — the pill's own deliberate behaviour. */
  /* ---- WHAT THE EDIT PRESS ALONE DID, RECORDED BEFORE THE FALLBACK ----
     (owner-reported 26 Aug 2026, L-3: "In the counterparty page, if you click
     Edit in the card it should take you to the attached edit window not to the
     contract.")

     THE FALLBACK BELOW IS WHY NOBODY NOTICED. It was written on 20 Aug as a
     kindness — press the pill "for a world where it did not" — and a kindness
     in a test is a hole: from that day this file passed whether or not Edit
     opened the panel, because the pill press put it right before anything was
     measured. The granted ask then stopped working on one seat and 40/40 went
     on being printed.

     So the answer is taken FIRST and asserted on its own. The fallback stays,
     because the measurements after it are about the editor and the clause and
     want the panel open however it got there — but it can no longer stand in
     for the claim it was hiding. */
  const openedFromEdit = !!document.querySelector('.rl-cp-src.is-on');
  const openedOnThisClause = openedFromEdit
    && document.querySelector('.rl-cp-src.is-on').getAttribute('data-rl-cp-for') === id;
  if (!openedFromEdit){
    const pill = clause.querySelector('[data-rl-cp-open]');
    if (pill) pill.click();
    await new Promise(r => setTimeout(r, 250));
  }
  const body = document.querySelector('.rl-cp-src.is-on');
  const plus = body && body.querySelector('[data-rl-cp-edit]');
  if (plus) plus.click();
  await new Promise(r => setTimeout(r, 250));
  const ed = body && body.querySelector('[data-nego-editor]');
  const para = ed && ed.querySelector('p');
  return { before, after: w(clause),
    maxWidth: s.maxWidth, overflowX: s.overflowX,
    headWrap: head ? getComputedStyle(head).whiteSpace : null,
    arrived: clause.classList.contains('rl-arrived'),
    wearsPickerClass: clause.classList.contains('rl-jump'),
    editorOpen: !!ed, editing: !!(body && body.classList.contains('is-editing')),
    clauseCarriesNothing: !clause.querySelector('[data-nego-editor]')
      && !clause.querySelector('.rl-tools'),
    paraWrap: para ? getComputedStyle(para).whiteSpace : null,
    /* The wording the editor opened ON, with the probe change's own before/
       after markers: the editor must show the NEW wording (continuing the
       redline) and not only the old (restarting from underneath it). */
    opensOn: ed ? ed.textContent.replace(/\s+/g, ' ').trim() : null,
    openedFromEdit, openedOnThisClause,
    marker, goneWord };
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
      /* THE CLAIM THE FALLBACK WAS ABSORBING (owner-reported 26 Aug 2026).
         Not "the panel is open by the time we measure" — one press of Edit,
         and the panel open ON THE CLAUSE THAT CARD NAMES. A press that lands
         the reader on the contract and stops is exactly what was reported. */
      check(`9 ${who}: ONE press of Edit opens the clause panel`,
        r.openedFromEdit, `panel open after Edit alone: ${r.openedFromEdit}`);
      check(`9 ${who}: and it opens on the clause the card names`,
        r.openedOnThisClause, `right clause: ${r.openedOnThisClause}`);
      check(`9 ${who}: the editor opened in the panel, and the panel knows it`,
        r.editorOpen && r.editing, `editor:${r.editorOpen} is-editing:${r.editing}`);
      /* The editor arrives dressed as wording: the body rules have to reach
         it, or the wording changes shape the moment it is edited. */
      check(`9 ${who}: the wording wraps in the editor as it does in the document`,
        r.paraWrap === 'normal', r.paraWrap);
      /* REVERSED IN PLACE, 16 Aug 2026: this kept the hover verbs down while
         the clause was typed in. The verbs are retired with their row and the
         clause is not typed in at all any more — what must now be true is
         that the paper stayed clean while the panel carried the writing. */
      check(`9 ${who}: the clause itself carries no editor and no tool row`,
        r.clauseCarriesNothing, `clean: ${r.clauseCarriesNothing}`);
      /* Judged against the probe change's own record — see CARD_EDIT. */
      check(`9 ${who}: the editor continues the redline, it does not restart it`,
        !!r.marker && (r.opensOn || '').includes(r.marker)
          && (!r.goneWord || !(r.opensOn || '').includes(r.goneWord)),
        `wants "${r.marker}", not "${r.goneWord}" — ` + (r.opensOn || '').slice(0, 60));
    }
    /* AND THE TWO AGREE. Each assertion above could pass on one seat and fail
       on the other; this is the one that says they are the same product. */
    const same = ['maxWidth', 'overflowX', 'headWrap', 'arrived', 'wearsPickerClass',
      'editorOpen', 'editing', 'paraWrap', 'clauseCarriesNothing']
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
     silently relies on a flex rule that went with it.

     RE-POINTED 25 Aug 2026 to the design reference: our seat's row is
     .rl-card-txt (a reference line over a bold summary) beside .rl-card-side
     (the state, the verbs, the ⋯), on hairlines rather than in a box. So two
     of the three claims move home and neither loses anything:
       · "the status badge is still on the row" becomes "the ACTS group is" —
         the badge itself stands down under the two headings that already say
         it (see f246), and what the check has always been for is that a
         monstrous name cannot shove the acts off the row;
       · "the coloured left edge still marks it as theirs" becomes the ORIGIN
         ATTRIBUTE plus the words on the meta line. The spine went with the box
         — the reference draws neither — and the channel the pill's removal
         rested on is the attribute, which no renderer can forget to draw. */
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
    const meta = card.querySelector('.rl-card-meta');
    /* .rl-card-txt on our seat, .rl-card-top on the counterparty's — one file,
       both shapes, so the claim reads whichever this page drew. */
    const top = card.querySelector('.rl-card-txt, .rl-card-top');
    const acts = card.querySelector('.rl-card-side, .rl-card-verbs');
    const box = card.getBoundingClientRect();
    return { pill: !!card.querySelector('.rl-origin'),
      headText: top.textContent.replace(/\s+/g, ' ').trim(),
      actsOnRow: !!acts && acts.getBoundingClientRect().right <= box.right + 1
        && acts.getBoundingClientRect().width > 0,
      origin: card.getAttribute('data-rl-origin'),
      meta: (meta ? meta.textContent : '').replace(/\s+/g, ' ').trim(),
      metaTitle: meta ? (meta.getAttribute('title') || '') : '' };
  });
  if (!badges){
    check('10 there is a card to read the head of', false, 'no card carrying an origin');
  } else {
    check('10 THE ORIGIN PILL IS GONE FROM THE HEAD', !badges.pill && !/ask/i.test(badges.headText),
      badges.headText);
    check('10 and a monstrous company name no longer has anywhere to shove anything',
      badges.actsOnRow, `acts on row: ${badges.actsOnRow}`);
    check('10 the row still knows whose ask it is',
      badges.origin === 'them', badges.origin);
    /* RE-POINTED 16 Aug 2026: the routing row's visible meta line is the
       clause; the organisation moved into that line's HOVER (and, in words,
       into the clause panel's row). The claim — the monstrous name is still
       reachable from the card, and never printed as the reader's own company —
       survives on the hover. */
    check('10 and the name reads on the meta line\'s hover',
      /APEX LOGISTICS & WAREHOUSING KENYA LTD/.test(badges.metaTitle || ''),
      badges.metaTitle || badges.meta);
  }

  /* ---- 11. THE PANEL'S TYPE IS THE SAME ON BOTH SEATS ----
     (owner-asked 16 Aug 2026: "font sizes on the edit panel in the
     counterparty side should mirror exactly what is on the owner side".)
     Measured, not assumed: one stylesheet serves both seats, but that is a
     fact about today's code — a portal-side override or a second copy of the
     rules is exactly the drift this file exists to catch. The Copilot note is
     deliberately absent on their seat (presence, not size), so it is not in
     the roll call.

     AND NEITHER IS THE CARD, since 25 Aug 2026. The two card sizes that were
     in it — .rl-card-meta and .rl-badge — were riding along because the two
     seats happened to draw one card shape; the owner's own drawing gives OUR
     column its own shape (a meta line over a bold summary, with an action row
     under it) and leaves theirs exactly as it was, which was the whole
     condition on building it. The PANEL is what this check is about and what
     the owner asked about, and the panel is still one stylesheet for both. */
  /* RE-POINTED 29 Aug 2026, and the claim is unchanged. This opened the panel
     by pressing a pill carrying data-rl-cp-open — and on OUR seat that pencil
     opens the clause EDITOR now, so it carried a different attribute, the
     selector found nothing, and this check had been red on main since the door
     moved. What it is about is the PANEL'S TYPE ON BOTH SEATS, so it opens the
     panel by its own act, which is the same door both seats' controls press. */
  const PANEL_TYPE = `(() => {
    const pill = document.querySelector('.rl-cp-pill[data-rl-cp-open], .rl-cp-pill[data-rl-cp-editor]');
    if (!pill) return { err: 'no pill' };
    const id = pill.getAttribute('data-rl-cp-open') || pill.getAttribute('data-rl-cp-editor');
    if (window.rlCpSetShown) rlCpSetShown(document, id); else pill.click();
    const panel = document.querySelector('.rl-cp');
    if (!panel) return { err: 'no panel' };
    const fz = sel => { const el = panel.querySelector(sel);
      return el ? getComputedStyle(el).fontSize : null; };
    return { h: fz('.rl-cp-h'), stands: fz('.rl-cp-stands'), who: fz('.rl-cp-who'),
      note: fz('.rl-cp-note'), act: fz('.rl-cp-act'), clname: fz('.rl-cp-clname'),
      segs: fz('.rl-cp-segs button'),
      wd: fz('.rl-cp-wd'), why: fz('.rl-cp-why') };
  })()`;
  await page.evaluate(() => window.SHOW_OWNER());
  await pause(600);
  const ownerType = await page.evaluate(PANEL_TYPE);
  await page.evaluate(() => window.SHOW_COUNTERPARTY());
  await pause(700);
  const cpType = await page.evaluate(PANEL_TYPE);
  if (ownerType.err || cpType.err){
    check('11 the panel opened on both seats for the type roll call', false,
      (ownerType.err || '') + ' / ' + (cpType.err || ''));
  } else {
    const drift = Object.keys(ownerType).filter(k => ownerType[k] !== cpType[k]);
    check('11 EVERY MEASURED PANEL SIZE IS IDENTICAL ON BOTH SEATS',
      drift.length === 0,
      drift.length ? drift.map(k => `${k}: ${ownerType[k]} vs ${cpType[k]}`).join(', ')
        : JSON.stringify(ownerType));
    /* ---- THE CLAIM IS THE RELATION, NOT THE NUMBERS ----
       This pinned three literals and they have now been moved twice in one day
       by two separate, correct decisions: the platform-wide type lift (22 Aug
       2026, off the design's scale) and the negotiation page's own render. It
       failed both times for a reason that had nothing to do with what it is
       for, which is that the panel is DRESSED and not a stale copy of some
       earlier sheet — the same correction main made to the twin claims in
       redline-verify and f173 on the same day.
       So: the panel's standing wording is the largest thing in it and its
       section headings are the smallest. Sizes may move; that order is the
       design. (The third leg was the card's meta line and it left the roll
       call on 25 Aug 2026 with the rest of the card — see the note above.) */
    const sz = k => parseFloat(ownerType[k]);
    check('11 and the panel is dressed, not a stale copy — the order holds',
      sz('stands') > sz('h') && sz('stands') >= 13 && sz('h') >= 10,
      `stands ${ownerType.stands} · h ${ownerType.h}`);
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
