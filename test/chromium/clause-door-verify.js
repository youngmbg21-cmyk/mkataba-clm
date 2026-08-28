/* Chromium verification: the green Edit pill and the clause panel.
   ============================================================
   Owner-asked, 16 Aug 2026: "Just add a green pill that says Edit on the top
   right of the clause."

   The rules live in f210. This file exists for the parts jsdom cannot answer,
   and on this page that list is long enough to matter:

     · WHERE the pill actually lands. jsdom resolves no cascade, so "it is in
       the heading row" is a string assertion there and a GEOMETRY question
       here: is it above the wording, and is it on the right of the clause?
     · WHAT COLOUR IT COMPUTES TO. A green pill was the ask. .rl-cp-pill's rule
       is scoped to .redline-page, and this project has already shipped a
       control whose clothes were scoped to a page it was not on — the
       counterparty's reading switch, caught by a screenshot on 15 Aug 2026.
     · THAT A REAL PRESS OPENS IT. The listener is delegated on `document` and
       armed at module load; a button that renders but is never reached looks
       identical in a string assertion, and this project has shipped exactly
       that fault more than once (the unsent band's Send, dead on the
       counterparty's seat for a day).
     · THAT THE PANEL IS ON SCREEN AND THE CONTRACT UNDER IT HAS NOT MOVED.
       The whole justification for an overlay rather than a column.
     · THE THREE WAYS OUT, each pressed for real.
     · THE COUNTERPARTY'S SEAT, mounted from a real share payload.
   ============================================================ */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
/* WHERE THE REPO IS AND WHICH CHROMIUM TO START — asked, not assumed. Both were
   written as the dev sandbox's own absolute paths, which is true in exactly one
   place; on a CI runner the checkout is elsewhere and playwright installs its
   own browser. Derived from this file's own location, and from the same
   CHROMIUM_BIN → sandbox → playwright's-own ladder every other harness uses. */
const ROOT=path.join(__dirname,'..','..');
const EXEC=process.env.CHROMIUM_BIN
  ||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'};
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const R=[];const ck=(n,p,d)=>{R.push(!!p);console.log((p?'PASS':'FAIL')+'  '+n+(d!=null?' — '+d:''))};
function serve(){return new Promise(res=>{const s=http.createServer((q,rep)=>{
  const rel=decodeURIComponent(q.url.split('?')[0]).replace(/^\/+/,'');
  const f=path.join(ROOT,rel||'index.html');
  if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rep.writeHead(404);rep.end('nf');return}
  rep.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(rep)});s.listen(0,'127.0.0.1',()=>res(s))})}

(async()=>{
  const srv=await serve();
  /* THE SAME LOOKUP THE OTHER FIFTY-SIX USE. This file named the dev sandbox's
     browser outright, which works in the sandbox and nowhere else: on a CI
     runner playwright installs its own copy and /opt/pw-browsers does not
     exist, so the launch threw before a single check ran. It never showed
     because this file only ever ran in the sandbox — the exact habit run-all.js
     was written to end, caught by run-all.js on its first push. */
  const br=await chromium.launch({executablePath:EXEC,args:['--no-sandbox']});
  const p=await br.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`,{waitUntil:'load'});
  await p.evaluate(()=>window.READY); await pause(500);

  /* Put one ask on one clause, so the panel has something to say beyond "as it
     stands". Through the product's own funnel — nothing hand-built. */
  const staged = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c)[1];
    const ch = await negoFileChange(c, { clauseId: cl.clauseId, changeType:'modify',
      side:'counterparty', author:'Henry M.', oldText: cl.text,
      newText: cl.text.replace(/\.\s*$/, ', in each case at its own cost.'),
      summary:'add a cost allocation' });
    renderRedline();
    return { clauseId: cl.clauseId, id: ch && ch.id, heading: cl.headingText || '' };
  });
  await pause(500);
  ck('the fixture has an ask on a clause', !!staged.id, staged.id);

  /* ---- 1. THE PILL, AS PIXELS ---- */
  const pill = await p.evaluate(id => {
    const sec = document.querySelector(`.redline-page .nego-clause[data-clause="${id}"]`);
    const b = sec && sec.querySelector('.rl-cp-pill');
    if (!b) return null;
    const r = b.getBoundingClientRect(), s = getComputedStyle(b);
    const body = sec.querySelector('.nego-body').getBoundingClientRect();
    const box = sec.getBoundingClientRect();
    return { text:b.textContent.trim(), w:Math.round(r.width), h:Math.round(r.height),
      hasSvg:!!b.querySelector('svg'), aria:b.getAttribute('aria-label'),
      bg:s.backgroundColor, colour:s.color, border:s.borderTopColor,
      aboveWording: Math.round(r.bottom) <= Math.round(body.top) + 2,
      rightGap: Math.round(box.right - r.right), leftGap: Math.round(r.left - box.left),
      opacity: s.opacity, visibility: s.visibility, display: s.display };
  }, staged.clauseId);
  ck('1a the pill is on the clause, as visible pixels', !!pill && pill.w > 20 && pill.h > 10,
     pill ? `"${pill.text}" ${pill.w}x${pill.h}` : 'absent');
  /* Re-pointed 20 Aug 2026 (owner-asked, off a picture of the glyph): the WORD
     left the paper for the pencil icon; it survives as aria-label + title. */
  ck('1b it is the pencil icon, and the word Edit survives for a screen reader',
     !!pill && pill.text === '' && pill.hasSvg && pill.aria === 'Edit',
     pill && `text "${pill.text}", svg ${pill.hasSvg}, aria "${pill.aria}"`);
  ck('1c it wears a VISIBLE GREY on a transparent face — measured, not named',
     /* REVERSED IN PLACE, 26 Aug 2026 (owner-asked: "the edit symbol should be
        in a visible grey font"). The accent went the way the dark nav-bg fill
        went before it; what this check has always been about is that the glyph
        is neither invisible nor a black blot, and that survives the hue. */
     !!pill && /rgba\(0, 0, 0, 0\)|transparent/.test(pill.bg) && !/rgb\(11, 61, 58\)/.test(pill.colour)
       && pill.colour !== 'rgb(255, 255, 255)',
     pill && `bg ${pill.bg}, ink ${pill.colour}`);
  ck('1d it is ABOVE the wording', !!pill && pill.aboveWording,
     pill && `pill bottom vs body top`);
  ck('1e it is on the RIGHT of the clause, not the left',
     !!pill && pill.rightGap < pill.leftGap, pill && `${pill.rightGap}px right / ${pill.leftGap}px left`);
  /* ---- REVERSED IN PLACE, 26 Aug 2026 (owner-asked: "you should only see the
     highlighted edit button when you hover over a respective clause") ----
     The sentence this check was named for — a door you cannot see is not a
     door — is the argument that put it here, and the owner has seen it in
     place and ruled the other way; the reference column does the same. So the
     PAIR is what is measured: away at rest, there on a real hover. It is still
     in the DOM and still the right size at rest (1a above), which is what makes
     this a reveal rather than a rebuild. */
  ck('1f it is out of the way with NOTHING hovered',
     !!pill && pill.opacity === '0' && pill.display !== 'none',
     pill && `opacity ${pill.opacity}, ${pill.visibility}`);
  await p.hover('#rl-doc .rl-clause, .rl-clause');
  await pause(200);
  const pillOnHover = await p.evaluate(() => {
    const el = document.querySelector('.rl-clause .rl-cp-pill');
    if (!el) return null;
    const s = getComputedStyle(el);
    return { opacity: s.opacity, pe: s.pointerEvents };
  });
  ck('1f and a real hover brings it out, pressable',
     !!pillOnHover && pillOnHover.opacity === '1' && pillOnHover.pe !== 'none',
     pillOnHover && `opacity ${pillOnHover.opacity}, pointer-events ${pillOnHover.pe}`);

  const allPills = await p.evaluate(() => ({
    clauses: document.querySelectorAll('.redline-page #rl-doc section.rl-clause').length,
    pills: document.querySelectorAll('.redline-page #rl-doc .rl-clause .rl-cp-pill').length }));
  ck('1g every clause has one, including the ones nobody has asked about',
     allPills.clauses > 1 && allPills.pills === allPills.clauses,
     `${allPills.pills} pills / ${allPills.clauses} clauses`);

  /* ---- 2. A REAL PRESS OPENS THE PANEL ---- */
  const docBefore = await p.evaluate(() => {
    const d = document.querySelector('.redline-page #rl-doc');
    const r = d.getBoundingClientRect();
    return { w:Math.round(r.width), left:Math.round(r.left),
      text: d.innerText.replace(/\s+/g,' ').trim().slice(0, 400) };
  });
  await p.click(`.redline-page .nego-clause[data-clause="${staged.clauseId}"] .rl-cp-pill`);
  await pause(600);
  const open = await p.evaluate(id => {
    const panel = document.querySelector('.redline-page #rl-cp');
    if (!panel) return null;
    const r = panel.getBoundingClientRect();
    const grid = document.querySelector('.redline-page .rl-grid').getBoundingClientRect();
    const on = panel.querySelector('.rl-cp-src.is-on');
    const heads = [...panel.querySelectorAll('.rl-cp-src.is-on .rl-cp-h')].map(h=>h.textContent.trim());
    const side = document.querySelector('.redline-page #rl-side').getBoundingClientRect();
    const doc = document.querySelector('.redline-page #rl-doc');
    return { openClass: panel.classList.contains('is-open'),
      visible: getComputedStyle(panel).visibility === 'visible',
      w: Math.round(r.width), h: Math.round(r.height), w0left: Math.round(r.left),
      onRightWall: Math.abs(Math.round(r.right - grid.right)) <= 2,
      onScreen: r.left < 1500 && r.right > 0,
      forClause: on && on.getAttribute('data-rl-cp-for'),
      /* THE CLAUSES' bodies. The front matter has one too since 28 Aug 2026,
         and this claim is "every CLAUSE has one waiting" — counting the region
         in would make it read one short for ever. */
      heads, bodies: panel.querySelectorAll('.rl-cp-src:not([data-rl-cp-for="front"])').length,
      shown: panel.querySelectorAll('.rl-cp-src.is-on').length,
      noScrim: !document.querySelector('.redline-page #rl-cp-scrim'),
      /* IT IS THE CARDS COLUMN, to the pixel, on all four edges. */
      onColumn: [Math.round(r.left) === Math.round(side.left),
        Math.round(r.right) === Math.round(side.right),
        Math.round(r.top) === Math.round(side.top),
        Math.round(r.bottom) === Math.round(side.bottom)],
      /* …and no word of the contract is behind it. Measured off the wording's
         own boxes, not off the column's, because the sheet is narrower than the
         column it sits in and it is the WORDS the owner asked to keep. */
      textRight: (() => { let x = 0;
        document.querySelectorAll('.redline-page #rl-doc .nego-body').forEach(n => {
          const b = n.getBoundingClientRect(); if (b.right > x) x = b.right; });
        return Math.round(x); })(),
      pillsClear: [...document.querySelectorAll('.redline-page #rl-doc .rl-clause .rl-cp-pill')]
        .filter(b => b.getBoundingClientRect().right <= r.left).length,
      pillsTotal: document.querySelectorAll('.redline-page #rl-doc .rl-clause .rl-cp-pill').length,
      docDimmed: getComputedStyle(doc).opacity !== '1' || getComputedStyle(doc).filter !== 'none',
      docReachable: (() => {
        /* Is a word of the contract still the top thing at its own coordinates?
           If it is, the reader can still read it, select it and press it. */
        const cl = document.querySelector('.redline-page #rl-doc section.rl-clause .nego-body');
        const b = cl.getBoundingClientRect();
        const top = document.elementFromPoint(b.left + 20, b.top + 8);
        return !!(top && top.closest && top.closest('#rl-doc')); })() };
  }, staged.clauseId);
  ck('2a a real press opens the panel — the delegated listener is armed',
     !!open && open.openClass && open.visible, open && `is-open ${open.openClass}, ${open.visibility||open.visible}`);
  ck('2b it is really on screen, with a real size',
     !!open && open.onScreen && open.w > 300 && open.h > 300, open && `${open.w}x${open.h}`);
  ck('2c it hangs on the PAGE\'s own right wall, not the window\'s',
     !!open && open.onRightWall, open && `right edge offset ${open.w}`);
  ck('2d it opened on the clause that was pressed',
     !!open && open.forClause === staged.clauseId, open && open.forClause);
  ck('2e ONE clause at a time, though every clause\'s body is in the panel',
     !!open && open.shown === 1 && open.bodies === allPills.clauses,
     open && `${open.shown} shown of ${open.bodies}`);
  ck('2f the three sections are there',
     !!open && open.heads.filter(h=>h!=='Change this clause').join('|')
       === 'As it stands|On the table|History',
     open && open.heads.join(' · '));
  /* ---- REVERSED IN PLACE, 16 Aug 2026 ---- this used to read "the backdrop is
     up". The owner asked for the opposite: no shading, "it has to remain
     active". So the three claims are now that there is no backdrop, that the
     contract is not dimmed, and that it is still the top thing at its own
     coordinates — which is what "usable" means to a mouse. */
  ck('2g there is NO backdrop — the contract must stay lit', !!open && open.noScrim);
  ck('2g′ and it is not dimmed or filtered', !!open && !open.docDimmed);
  ck('2g″ and it is still reachable — the reader can read and press it',
     !!open && open.docReachable);
  /* ---- 2i REVERSED IN PLACE, 16 Aug 2026 ---- this used to prove the panel
     reached PAST the cards column by more than 120px, which is what the
     proportion bought and what covered the contract's own words. Owner-asked:
     stop it at the cards column. The claim is now the opposite and it is
     stricter — the panel must BE that column, to the pixel, on every edge. */
  ck('2i it IS the cards column, to the pixel, on all four edges',
     !!open && open.onColumn.every(Boolean), open && JSON.stringify(open.onColumn));
  ck('2i′ and NO WORD of the contract is behind it',
     !!open && open.textRight < open.w0left, open && `text ends ${open.textRight}, panel starts ${open.w0left}`);
  ck('2i″ every clause\'s Edit pill stays in the clear',
     !!open && open.pillsTotal > 1 && open.pillsClear === open.pillsTotal,
     open && `${open.pillsClear}/${open.pillsTotal}`);

  const docAfter = await p.evaluate(() => {
    const d = document.querySelector('.redline-page #rl-doc');
    const r = d.getBoundingClientRect();
    return { w:Math.round(r.width), left:Math.round(r.left),
      text: d.innerText.replace(/\s+/g,' ').trim().slice(0, 400) };
  });
  ck('2h AND THE CONTRACT UNDER IT DID NOT MOVE — the whole reason it is an overlay',
     docAfter.w === docBefore.w && docAfter.left === docBefore.left && docAfter.text === docBefore.text,
     `${docBefore.w}px → ${docAfter.w}px`);

  /* ---- 3. WHAT THE PANEL SAYS ---- */
  const said = await p.evaluate(id => {
    const on = document.querySelector(`.redline-page .rl-cp-src[data-rl-cp-for="${id}"]`);
    const sec = n => [...on.querySelectorAll('.rl-cp-sec')]
      .find(s => new RegExp(n,'i').test(s.querySelector('.rl-cp-h').textContent));
    const clause = document.querySelector(`.redline-page .nego-clause[data-clause="${id}"] .nego-body`);
    return {
      stands: on.querySelector('.rl-cp-stands').innerText.replace(/\s+/g,' ').trim(),
      onPaper: clause.innerText.replace(/\s+/g,' ').trim(),
      table: sec('On the table').querySelectorAll('.rl-cp-row').length,
      history: sec('History').querySelectorAll('.rl-cp-row').length,
      names: [...on.querySelectorAll('.rl-cp-who')].map(w=>w.innerText.trim()),
      acts: [...on.querySelectorAll('.rl-cp-acts button')].map(b=>({
        t:b.textContent.trim(), edit:b.getAttribute('data-nego-edit'),
        plus:b.getAttribute('data-rl-cp-edit'),
        ai:b.getAttribute('data-nego-ai-clause'), close:b.hasAttribute('data-rl-cp-close'),
        cls:b.className })),
      sheetTools: document.querySelectorAll('#rl-cp .rl-tool').length,
    };
  }, staged.clauseId);
  ck('3a "As it stands" carries real wording', said.stands.length > 40, said.stands.slice(0,60)+'…');
  /* ---- 3b REVERSED IN PLACE, 16 Aug 2026 ---- this used to assert the ask was
     in BOTH sections. Owner-reported: "when i redline, the new change appears
     On the Table and also as the last redline which is redundant." The two
     sections sit twelve pixels apart, so a live ask printed itself twice,
     identically. It is on the table only until it settles. */
  ck('3b the live ask is ON THE TABLE ONLY, never in the history as well',
     said.table === 1 && said.history === 0, `table ${said.table}, history ${said.history}`);
  ck('3c the row names the ask, where it stands and who asked',
     /CHG-/.test(said.names[0]||'') && /their ask/i.test(said.names[0]||'')
     && /from /i.test(said.names[0]||''), said.names[0]);
  /* ---- 3d REVERSED IN PLACE, 16 Aug 2026 ---- this used to prove the panel's
     two acts were Copilot and Direct Edit, BOTH carrying data-rl-cp-close
     because both opened something on the clause behind the panel. The editing
     is in the panel now: the ＋ opens the engine's editor HERE and must NOT
     close what it is opening into, while the Copilot still hands off to a panel
     elsewhere and still closes behind itself. Direct Edit has left. */
  /* ---- 3d/3d″ REVERSED AGAIN, 19 Aug 2026 ---- the Copilot is a button once
     more (owner-asked; see 8c), so the panel offers TWO acts: the ＋ that writes
     here, and the Copilot that hands the whole clause over and closes behind
     itself. Direct Edit is still gone, and that half of the claim is unchanged. */
  ck('3d the panel offers the ＋ and the Copilot, and Direct Edit is gone',
     said.acts.length === 2 && said.acts[0].plus === staged.clauseId
     && !said.acts.some(a => a.edit) && said.acts.some(a => a.ai),
     said.acts.map(a=>a.t).join(' / '));
  ck('3d″ and it does not close the panel it writes into',
     !!said.acts[0] && !said.acts[0].close,
     said.acts.map(a=>`${a.t}:${a.close?'closes':'stays'}`).join(' / '));
  ck('3d′ and they do NOT wear the sheet\'s tool-pill class — a control that is not '
     + 'on the paper must not answer to the paper\'s selectors',
     said.sheetTools === 0 && said.acts.every(a=>/rl-cp-act/.test(a.cls)),
     said.acts.map(a=>a.cls).join(' / '));

  /* ---- 3e/3f REVERSED IN PLACE, 16 Aug 2026 ---- these used to press Direct
     edit inside the panel and prove it opened the editor ON THE CLAUSE and shut
     the panel behind it. The editing is in the panel now: the ＋ opens the
     editor HERE, and the panel stays. Direct Edit is gone from this seat
     (asserted at 3d); it remains on the clause's own hover row, which is a
     different place and its own piece of work. */
  await p.click(`.redline-page .rl-cp-src[data-rl-cp-for="${staged.clauseId}"] [data-rl-cp-edit]`);
  await pause(700);
  const edited = await p.evaluate(id => ({
    inPanel: !!document.querySelector('.redline-page #rl-cp [data-nego-editor]'),
    notOnClause: !document.querySelector(`.nego-clause[data-clause="${id}"] [data-nego-editor]`),
    panelOpen: document.querySelector('.redline-page #rl-cp').classList.contains('is-open') }), staged.clauseId);
  ck('3e pressing the ＋ opens the editor INSIDE the panel', edited.inPanel && edited.notOnClause);
  ck('3f …and the panel stays open, because that is what it opened into', edited.panelOpen);
  await p.evaluate(() => {
    const b = document.querySelector('#rl-cp [data-nego-cancel]');
    if (b) b.click();
  });
  await pause(600);
  ck('3f′ Cancel puts the panel back as it was, still open on the clause',
     await p.evaluate(id => {
       const on = document.querySelector('#rl-cp .rl-cp-src.is-on');
       return !document.querySelector('#rl-cp [data-nego-editor]')
         && !!document.querySelector('#rl-cp .rl-cp-stands')
         && !!on && on.getAttribute('data-rl-cp-for') === id; }, staged.clauseId));
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(400);

  /* ---- 4. THE THREE WAYS OUT, EACH PRESSED ---- */
  const reopen = async () => {
    await p.click(`.redline-page .nego-clause[data-clause="${staged.clauseId}"] .rl-cp-pill`);
    await pause(500);
    return p.evaluate(()=>document.querySelector('.redline-page #rl-cp').classList.contains('is-open'));
  };
  const shut = () => p.evaluate(()=>!document.querySelector('.redline-page #rl-cp').classList.contains('is-open'));

  ck('4a it opens again', await reopen());
  await p.click('.redline-page #rl-cp-min'); await pause(500);
  ck('4b the ✕ closes it', await shut());

  await reopen();
  await p.keyboard.press('Escape'); await pause(500);
  ck('4c Escape closes it', await shut());

  /* ---- 4d/4e REVERSED IN PLACE, 16 Aug 2026 ---- these used to press a
     backdrop and then prove the backdrop covered the door. There is no backdrop
     now. What takes their place is the property the owner actually asked for:
     the contract behind the panel is still SCROLLABLE, and a clause whose pill
     is still in the clear is still a door. */
  await reopen();
  const scrolls = await p.evaluate(async () => {
    const s = document.querySelector('#nego-scroll-work');
    const was = s.scrollTop; s.scrollTop = was + 240;
    await new Promise(r=>setTimeout(r,700));
    return { was, now: s.scrollTop };
  });
  ck('4d the contract behind the panel still scrolls — it stayed active',
     scrolls.now > scrolls.was, `${scrolls.was} → ${scrolls.now}`);

  const swapped = await p.evaluate(() => {
    /* Any clause whose pill is not under the panel is still a live door: press
       it and the panel should swap to that clause rather than needing a close
       first. */
    const pills = [...document.querySelectorAll('.redline-page #rl-doc .rl-clause .rl-cp-pill')];
    const cp = document.querySelector('#rl-cp').getBoundingClientRect();
    const clear = pills.find(b => b.getBoundingClientRect().right < cp.left
      && b.getBoundingClientRect().top > 0);
    if (!clear) return { none: true };
    const want = clear.getAttribute('data-rl-cp-open');
    clear.click();
    const on = document.querySelector('#rl-cp .rl-cp-src.is-on');
    return { want, got: on && on.getAttribute('data-rl-cp-for') };
  });
  ck('4e …and a pill still in the clear swaps the panel straight to its clause',
     swapped.none ? true : swapped.want === swapped.got,
     swapped.none ? 'no pill in the clear at this width' : `${swapped.want} → ${swapped.got}`);
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(400);

  /* ---- 4g THE DIVIDER RESIZES THE PANEL, WITH A REAL MOUSE DRAG ----
     Owner-asked, 16 Aug 2026: "in the position where you can expand it and
     minimize right to left with the cards and the contracts using the divider
     feature already available." This is the whole point of the panel having no
     width of its own, and it can only be tested here: it is a drag through the
     input pipeline against a real grid.

     THE CLAIM IS ONE OF ALIGNMENT, NOT OF NUMBERS. What must hold at every
     split is that the panel and the cards column are still the same box, that
     the contract still has all its words on the visible side of it, and that
     the drag moved the panel at all — a panel that ignored the divider would
     sit at one width through both drags and still "pass" a size check. */
  await reopen();
  const drag = async dx => {
    const rz = await p.evaluate(() => { const r = document.querySelector('#rl-resizer').getBoundingClientRect();
      return { x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }; });
    await p.mouse.move(rz.x, rz.y); await p.mouse.down();
    await p.mouse.move(rz.x + dx, rz.y, { steps: 12 }); await p.mouse.up();
    await pause(500);
    return p.evaluate(() => {
      const cp = document.querySelector('#rl-cp').getBoundingClientRect();
      const sd = document.querySelector('#rl-side').getBoundingClientRect();
      let x = 0; document.querySelectorAll('#rl-doc .nego-body').forEach(n => {
        const b = n.getBoundingClientRect(); if (b.right > x) x = b.right; });
      return { w: Math.round(cp.width), left: Math.round(cp.left),
        aligned: Math.round(cp.left) === Math.round(sd.left)
          && Math.round(cp.right) === Math.round(sd.right)
          && Math.round(cp.width) === Math.round(sd.width),
        textRight: Math.round(x),
        pillsClear: [...document.querySelectorAll('#rl-doc .rl-clause .rl-cp-pill')]
          .filter(b => b.getBoundingClientRect().right <= cp.left).length,
        pillsTotal: document.querySelectorAll('#rl-doc .rl-clause .rl-cp-pill').length };
    });
  };
  const start = await drag(0);
  const wider = await drag(-260);
  ck('4g dragging the divider LEFT widens the panel with the cards',
     wider.w > start.w + 100, `${start.w} → ${wider.w}`);
  ck('4g′ …and it is still exactly the cards column', wider.aligned);
  ck('4g″ …and the contract still has every word on the visible side',
     wider.textRight < wider.left && wider.pillsClear === wider.pillsTotal,
     `text ends ${wider.textRight}, panel starts ${wider.left}, pills ${wider.pillsClear}/${wider.pillsTotal}`);
  const narrower = await drag(400);
  ck('4h dragging it RIGHT gives the width back to the contract',
     narrower.w < wider.w - 100, `${wider.w} → ${narrower.w}`);
  ck('4h′ …still the cards column, still no words covered',
     narrower.aligned && narrower.textRight < narrower.left
     && narrower.pillsClear === narrower.pillsTotal,
     `text ends ${narrower.textRight}, panel starts ${narrower.left}`);
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(400);

  /* ---- 4f THE SLIDE IS SMOOTH — MEASURED FRAME BY FRAME ----
     Owner-reported 16 Aug 2026: "the page shakes rather than have a smooth
     transition". This is the only place that claim can be tested: it is about
     what happens DURING the 300ms, and neither a node test nor a before/after
     snapshot can see it. Every animation frame of the open is sampled, and
     nothing behind the panel — the document's box, the change column's box, the
     contract's own scroll position, the grid's scroll offset, the window's — is
     allowed to move by a single pixel on any of them. */
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(500);
  await p.evaluate(()=>{document.querySelector('#nego-scroll-work').scrollTop=300;});
  await pause(1200);                       // scroll-behavior is smooth; let it land
  const frames = await p.evaluate(id => new Promise(done => {
    const out = [], t0 = performance.now();
    const read = () => {
      const d = document.querySelector('#rl-doc').getBoundingClientRect();
      const sd = document.querySelector('#rl-side').getBoundingClientRect();
      const sc = document.querySelector('#nego-scroll-work');
      const g = document.querySelector('.rl-grid');
      return [Math.round(d.x), Math.round(d.width), Math.round(sd.x),
        Math.round(sc.scrollTop), Math.round(g.scrollLeft), Math.round(window.scrollX)].join(',');
    };
    out.push(read());
    document.querySelector(`.nego-clause[data-clause="${id}"] .rl-cp-pill`).click();
    const tick = () => { out.push(read());
      if (performance.now() - t0 < 700) requestAnimationFrame(tick); else done(out); };
    requestAnimationFrame(tick);
  }), staged.clauseId);
  const moved = frames.filter(f => f !== frames[0]);
  ck('4f THE PAGE DOES NOT SHAKE — no frame of the slide moves anything behind it',
     frames.length > 20 && moved.length === 0,
     `${frames.length} frames, ${moved.length} moved` + (moved.length ? ` (first: ${moved[0]} vs ${frames[0]})` : ''));
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(400);

  /* ---- 5. A REPAINT KEEPS IT OPEN ON THE RIGHT CLAUSE ---- */
  await reopen();
  await p.evaluate(()=>renderRedline()); await pause(700);
  const survived = await p.evaluate(id => {
    const panel = document.querySelector('.redline-page #rl-cp');
    const on = panel.querySelector('.rl-cp-src.is-on');
    return { open: panel.classList.contains('is-open'),
      forClause: on && on.getAttribute('data-rl-cp-for') }; }, staged.clauseId);
  ck('5a a repaint leaves the panel open on the same clause',
     survived.open && survived.forClause === staged.clauseId, JSON.stringify(survived));
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);

  /* ---- 6. THE COUNTERPARTY'S SEAT ---- */
  await p.evaluate(()=>window.SHOW_COUNTERPARTY()); await pause(900);
  const cp = await p.evaluate(() => {
    const pills = [...document.querySelectorAll('.rl-clause .rl-cp-pill')];
    const panel = document.querySelector('#rl-cp');
    return { pills: pills.length, panel: !!panel,
      first: pills[0] ? pills[0].getAttribute('data-rl-cp-open') : null };
  });
  ck('6a their page draws the door too — the panel is built in the shared panes',
     cp.pills > 0 && cp.panel, `${cp.pills} pills`);
  if (cp.first){
    await p.click(`[data-rl-cp-open="${cp.first}"]`); await pause(600);
    const cpOpen = await p.evaluate(() => {
      const panel = document.querySelector('#rl-cp');
      const on = panel.querySelector('.rl-cp-src.is-on');
      return { open: panel.classList.contains('is-open'),
        ruled: !!(on && /by /i.test(on.innerText)),
        heads: [...(on?on.querySelectorAll('.rl-cp-h'):[])].map(h=>h.textContent.trim()) };
    });
    ck('6b and a real press opens it there — the listener is armed at MODULE LOAD, '
       + 'so it belongs to no one page', cpOpen.open, JSON.stringify(cpOpen.heads));
    /* AND THEY CAN WRITE IN IT. The panel is built in the shared panes, so the
       ＋ reaches their seat unless something stops it — and nothing should:
       proposing wording is exactly what their page is for. */
    const cpPlus = await p.evaluate(async () => {
      const b = document.querySelector('#rl-cp .rl-cp-src.is-on [data-rl-cp-edit]');
      if (!b) return { none: true };
      b.click();
      await new Promise(r => setTimeout(r, 500));
      const e = document.querySelector('#rl-cp [data-nego-editor]');
      return { word: b.textContent.trim(), editor: !!e,
        direct: !!document.querySelector('#rl-cp [data-nego-edit]'),
        seeded: e ? e.innerText.trim().length > 20 : false };
    });
    ck('6c their seat gets the ＋, and pressing it opens the editor in their panel',
       !cpPlus.none && cpPlus.editor && cpPlus.seeded && !cpPlus.direct,
       cpPlus.none ? 'no ＋ on their seat' : `${cpPlus.word}, editor ${cpPlus.editor}`);
    await p.evaluate(()=>{const b=document.querySelector('#rl-cp [data-nego-cancel]');if(b)b.click();});
    await pause(500);
    await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);
  }

  /* ---- 7. THE EDITING IS IN THE PANEL, DRIVEN FOR REAL ----
     Owner-asked, 16 Aug 2026: "Now build the editing inside the panel." The
     model rules live in f210; what only a browser can answer is whether the
     whole journey lands — the ＋ pressed, the engine's editor arriving in the
     panel at the panel's own scale, wording typed, the two-step save walked,
     and a change actually on the record with a card in the column and a mark on
     the paper. */
  await p.evaluate(()=>window.SHOW_OWNER&&window.SHOW_OWNER()); await pause(800);
  const target = await p.evaluate(()=>negoClauseList(window.CONTRACT)[2].clauseId);
  const nBefore = await p.evaluate(()=>(window.CONTRACT.changes||[]).length);
  await p.click(`.nego-clause[data-clause="${target}"] .rl-cp-pill`); await pause(650);
  const acts = await p.evaluate(()=>[...document.querySelectorAll(
    '#rl-cp .rl-cp-src.is-on .rl-cp-acts button')].map(b => ({
      t:b.textContent.trim(), plus:b.hasAttribute('data-rl-cp-edit'),
      ai:b.hasAttribute('data-nego-ai-clause'), direct:b.hasAttribute('data-nego-edit') })));
  ck('7a the panel offers the ＋ and the Copilot; Direct Edit is not among them',
     acts.length===2 && acts[0].plus && acts.some(a=>a.ai) && !acts.some(a=>a.direct),
     acts.map(a=>a.t).join(' / '));

  await p.click('#rl-cp .rl-cp-src.is-on [data-rl-cp-edit]'); await pause(500);
  const ed = await p.evaluate(() => {
    const e = document.querySelector('#rl-cp [data-nego-editor]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    const stands = document.querySelector('#rl-cp .rl-cp-stands');
    const save = document.querySelector('#rl-cp .nego-edit-bar button');
    return { w:Math.round(r.width), h:Math.round(r.height),
      text: e.innerText.replace(/\s+/g,' ').trim().slice(0,50),
      fmt: !!document.querySelector('#rl-cp .nego-fmt-bar'),
      bar: [...document.querySelectorAll('#rl-cp .nego-edit-bar button')].map(b=>b.textContent.trim()),
      actsGone: !stands && !document.querySelector('#rl-cp .rl-cp-src.is-on .rl-cp-acts')
        || getComputedStyle(document.querySelector('#rl-cp .rl-cp-src.is-on .rl-cp-acts')).display === 'none',
      saveSize: save ? getComputedStyle(save).fontSize : null,
      inPanel: !!e.closest('#rl-cp') };
  });
  ck('7b the ＋ opens the engine\'s own editor, inside the panel, with real size',
     !!ed && ed.inPanel && ed.w > 200 && ed.h > 80, ed && `${ed.w}x${ed.h}`);
  ck('7c seeded with the wording as it stands', !!ed && ed.text.length > 20, ed && ed.text);
  ck('7d it is the WHOLE editor — formatting bar and the two-step bar',
     !!ed && ed.fmt && ed.bar.length === 2, ed && ed.bar.join(' / '));
  ck('7e and the ＋ stands down while it is open', !!ed && ed.actsGone);

  /* THE PANEL DOES NOT FOLLOW THE READER'S DOCUMENT TYPE. Measured against the
     sheet's own furniture at a document type the reader has moved: the paper's
     pill changes size, the panel's Save does not. (The furniture measured was
     the clause tool row until 16 Aug 2026; the row is retired — no edits on
     the paper — and the Edit pill is the furniture that rides the clause and
     the --doc-scale reading with it.) */
  const scale = await p.evaluate(async () => {
    const read = () => ({
      save: parseFloat(getComputedStyle(document.querySelector('#rl-cp .nego-edit-bar button')).fontSize),
      tool: parseFloat(getComputedStyle(document.querySelector('#rl-doc .rl-clause .rl-cp-pill')).fontSize) });
    const at15 = read();
    rlSetDocType(20); await new Promise(r=>setTimeout(r,300));
    const at20 = read();
    rlSetDocType(15); await new Promise(r=>setTimeout(r,300));
    return { at15, at20 };
  });
  ck('7f the paper scales with the reader\'s type and the PANEL does not',
     scale.at20.tool > scale.at15.tool && scale.at20.save === scale.at15.save,
     `paper ${scale.at15.tool}→${scale.at20.tool}, panel ${scale.at15.save}→${scale.at20.save}`);

  /* A HIGHLIGHT INSIDE THE EDITOR OFFERS ONE ACTION; the same drag on the
     contract offers all three. One menu, narrowed on one surface. */
  const selMenu = async (sel) => {
    await p.evaluate(s => {
      const el = document.querySelector(s);
      const node = el.querySelector('p') || el;
      const r = document.createRange(); r.selectNodeContents(node);
      const g = window.getSelection(); g.removeAllRanges(); g.addRange(r);
      node.dispatchEvent(new MouseEvent('mouseup', { bubbles:true }));
    }, sel);
    await pause(400);
    return p.evaluate(()=>[...document.querySelectorAll('.nego-selmenu [data-nego-ai]')]
      .map(b=>b.textContent.trim()));
  };
  const inPanelMenu = await selMenu('#rl-cp [data-nego-editor]');
  ck('7g a highlight in the panel\'s editor offers exactly Edit with Copilot',
     inPanelMenu.length === 1 && /Edit with Copilot/.test(inPanelMenu[0]),
     inPanelMenu.join(' / ') || 'no menu');
  await p.evaluate(()=>{const g=window.getSelection&&window.getSelection();if(g)g.removeAllRanges();
    document.querySelectorAll('.nego-selmenu').forEach(n=>n.remove());});
  await pause(200);

  /* TYPE, AND WALK THE TWO STEPS. */
  await p.evaluate(() => {
    const e = document.querySelector('#rl-cp [data-nego-editor]');
    e.focus();
    e.innerHTML = '<p>Written in the panel: either party may terminate on thirty (30) days notice.</p>';
  });
  /* REVERSED IN PLACE 28 Aug 2026: 7h read "Save leads into the reason
     question, in the panel, exactly as on the clause" and counted three
     buttons. The owner has removed the question, so what is pinned is the
     other half of the same claim — the panel's editor and the clause's file
     ALIKE, and both in ONE press. */
  const bar1 = await p.evaluate(()=>({
    reason: !!document.querySelector('#rl-cp [data-nego-reason]'),
    bar: [...document.querySelectorAll('#rl-cp .nego-edit-bar button')].map(b=>b.textContent.trim()) }));
  ck('7h Save FILES — there is no reason step in the panel either',
     bar1.reason === false && bar1.bar.length === 2, bar1.bar.join(' / '));
  await p.click('#rl-cp [data-nego-next]'); await pause(1100);

  const filed = await p.evaluate(t => {
    const c = window.CONTRACT;
    const ch = (c.changes||[]).slice(-1)[0];
    const sec = document.querySelectorAll('#rl-cp .rl-cp-src.is-on .rl-cp-sec');
    return { n:(c.changes||[]).length, id:ch&&ch.id, why:ch&&ch.why, side:ch&&ch.authorSide,
      clause: ch && ch.clauseId === t, hasOps: !!(ch && Array.isArray(ch.ops) && ch.ops.length),
      text: ch && String(ch.newText||'').slice(0,40),
      card: !!document.querySelector(`[data-nego-card="${ch&&ch.id}"]`),
      marked: !!document.querySelector(`.nego-clause[data-clause="${t}"].is-changed`),
      noTags: document.querySelectorAll('#rl-doc .rl-asktag').length === 0,
      panelStillOpen: document.querySelector('#rl-cp').classList.contains('is-open'),
      onTable: (() => { const t = [...sec].find(x =>
        /On the table/i.test((x.querySelector('.rl-cp-h')||{}).textContent||''));
        return t ? t.querySelectorAll('.rl-cp-row').length : -1; })(),
      plusWord: (document.querySelector('#rl-cp .rl-cp-src.is-on [data-rl-cp-edit]')||{}).textContent,
      /* The LABEL is fixed since 26 Aug 2026 and the hover is where the act is
         named, so both are captured — see 7m. */
      plusTitle: (document.querySelector('#rl-cp .rl-cp-src.is-on [data-rl-cp-edit]')||{}).title };
  }, target);
  ck('7i FILING FROM THE PANEL PUTS A REAL CHANGE ON THE RECORD',
     filed.n === nBefore + 1 && filed.clause && filed.hasOps && filed.side === 'owner',
     `${filed.id} on ${filed.text}…`);
  /* 7j REVERSED IN PLACE 28 Aug 2026: it read "…with the reason it was given"
     and typed one into the step. Nothing types a reason on this path any more,
     so what it pins is the honest opposite — a filing with no question asked
     files with no reason, rather than with a stray half-sentence. */
  ck('7j …and with NO reason, because nothing asked for one',
     filed.why == null || filed.why === '', JSON.stringify(filed.why));
  /* AND A REASON THAT EXISTS STILL REACHES A READER, which is the half that has
     actually broken before: a reason was once written to two card renderers and
     not the third, and every test in the suite passed because they all checked
     that the FIELD existed rather than that the answer arrived. The reason moved
     off the card to this panel on 19 Aug 2026, so this is where that walk ends.

     THE STAGE IS BUILT BY HAND NOW AND SAYS SO. The editor stopped asking on
     28 Aug 2026 and the Copilot proposal card is the one surface that still
     writes a `why` — a stage that opened Copilot, waited on a model and applied
     a card would be testing three other features to reach this one. So the fact
     is stamped onto the change that was just filed and the panel repainted; the
     claim was always about the RENDERER. */
  const whyStaged = await p.evaluate(() => {
    const c = window.CONTRACT;
    const ch = (c.changes || []).slice(-1)[0];
    if (!ch) return { ok: false, why: 'no change on the record' };
    ch.why = 'Thirty is our standard.';
    /* THE PANEL'S BODIES ARE BUILT BY THE CANVAS, not by the panel:
       redlineDocHtml pushes them into opts.cpSink, so a change to the record
       reaches this panel only through a document repaint. rlCpSetShown alone
       merely flips which of the already-built bodies is on show, which is why
       a first attempt staged the reason and the panel drew none. */
    const host = document.querySelector('.redline-page');
    if (host && window.rlRepaintFrom) rlRepaintFrom(host);
    return { ok: true, clause: ch.clauseId, id: ch.id };
  });
  await pause(700);
  /* The repaint rebuilds the panel's markup, so put it back on the clause the
     reason is about before reading it. */
  await p.evaluate(id => { if (window.rlCpSetShown) rlCpSetShown(document, id); }, target);
  await pause(500);
  const whyDrawn = await p.evaluate(() => {
    const el = [...document.querySelectorAll('#rl-cp .rl-cp-why')]
      .find(e => /Thirty is our standard/.test(e.textContent));
    if (!el) return { there: false };
    return { there: true, text: el.textContent,
      /* Shown WHOLE. The card clamped to two lines because a column of forty
         cards is a wall; the panel is where a reader has gone TO read it. */
      whole: el.scrollHeight <= el.clientHeight + 1,
      onScreen: el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 };
  });
  ck('7j2 …and the panel DRAWS that reason, named, as visible pixels',
     whyDrawn.there && whyDrawn.onScreen && /Why they asked/i.test(whyDrawn.text || ''),
     whyDrawn.there ? (whyDrawn.text || '').slice(0, 60)
       : 'no .rl-cp-why on the panel · staged=' + JSON.stringify(whyStaged));
  ck('7j3 …whole, not clamped — the panel is where you go to read it',
     whyDrawn.whole === true, `whole=${whyDrawn.whole}`);
  /* REVERSED IN PLACE, 16 Aug 2026: the tags have come off the paper. What the
     paper says now is that the clause has been argued over — the red rule down
     its right edge — and the detail is in the panel and the card. */
  ck('7k …a card in the column, and the clause marked as changed on the paper',
     filed.card && filed.marked, `card ${filed.card}, marked ${filed.marked}`);
  ck('7l …the panel still open on the same clause, now showing it on the table',
     filed.panelStillOpen && filed.onTable === 1, `open ${filed.panelStillOpen}, table ${filed.onTable}`);
  /* REVERSED IN PLACE, 26 Aug 2026 (owner-asked: "the highlighted box should
     always be called propose new wording but it seems it changes based on how
     you get there"). This asserted the LABEL changed to "Continue your draft"
     once an ask of ours was on the clause. The behaviour is unchanged — the
     engine still folds a second edit into that ask — but the button's NAME may
     no longer move with it, so what was pinned here now lives on the hover.
     BOTH HALVES, because dropping the second would let the product quietly
     stop saying what the press does. */
  ck('7m …the ＋ keeps its one name, whatever it is about to do',
     /Propose new wording/.test(filed.plusWord||''), filed.plusWord);
  ck('7m2 …and the hover says it would continue that draft',
     /already have on this clause/i.test(filed.plusTitle||''), filed.plusTitle);
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);

  /* ---- 8. THE THREE FAULTS REPORTED THE MORNING AFTER THE EDITING LANDED ---- */

  /* 8a/8b THE SETTLED ASK MOVES SECTION. Filed above at 7i; settle it and watch
     it change places, which is the whole of what the owner asked for. */
  const settledId = await p.evaluate(()=>(window.CONTRACT.changes||[]).slice(-1)[0].id);
  await p.evaluate(async id => { await negoResolve(window.CONTRACT, id, 'accepted',
    { by:'Wanjiru Kamau' }); renderRedline(); }, settledId);
  await pause(900);
  await p.evaluate(id => rlCpSetShown(document, id), target); await pause(500);
  const shifted = await p.evaluate(() => {
    /* BY NAME, NOT BY POSITION. The acts section moved between the first two on
       16 Aug 2026 and took two index-based readings down with it. */
    const sec = [...document.querySelectorAll('#rl-cp .rl-cp-src.is-on .rl-cp-sec')];
    const of = re => sec.find(x => re.test((x.querySelector('.rl-cp-h')||{}).textContent||''));
    const ids = el => [...el.querySelectorAll('.rl-cp-row')]
      .map(r => r.getAttribute('data-rl-cp-change'));
    return { table: ids(of(/On the table/i)), hist: ids(of(/History/i)) };
  });
  ck('8a a settled ask leaves the table', shifted.table.length === 0, shifted.table.join(','));
  ck('8b …and takes its place at the bottom of the history',
     shifted.hist[shifted.hist.length-1] === settledId, shifted.hist.join(' → '));

  /* 8c THE COPILOT BUTTON HANDS STRAIGHT OVER. Reported as "the panel
     disappears and the copilot dropdown appears on the top right corner" — the
     menu was anchored on a button whose rect had already gone to zeros, because
     closing the panel hides the body it sits in. */
  /* ---- 8c/8d REVERSED IN PLACE AGAIN, 19 Aug 2026 ---- and back to what they
     asserted before 16 Aug: a real, pressable Copilot BUTTON in the panel.
     Owner-asked, in these words: "change 'edit with copilot' to be a button
     which if clicked, it takes you to copilot and you can edit the entire
     clause." The words-without-a-pill were right while the paper still offered
     a highlight menu of its own; with that gone they named the only Copilot on
     the page and named it as something nobody could press.

     THE ORIGINAL REPORT IS STILL PINNED HERE — "the panel disappears and the
     copilot dropdown appears on the top right corner": the press must hand
     straight to the Copilot and leave no stray menu clamped into the corner of
     the window. That is 8d, measured after a real press. */
  const cop = await p.evaluate(() => {
    const on = document.querySelector('#rl-cp .rl-cp-src.is-on');
    const btn = on.querySelector('[data-nego-ai-clause]');
    if (!btn) return { none: true };
    const s = getComputedStyle(btn), r = btn.getBoundingClientRect();
    return { tag: btn.tagName, text: btn.textContent.trim(), cursor: s.cursor,
      colour: s.color, w: Math.round(r.width), h: Math.round(r.height),
      note: !!on.querySelector('.rl-cp-ai-note') };
  });
  ck('8c the Copilot is a real, pressable button in the panel',
     !cop.none && cop.tag === 'BUTTON' && /Edit with Copilot/.test(cop.text)
     && cop.w > 40 && cop.h > 10 && !cop.note,
     cop.none ? 'no button' : `${cop.tag} "${cop.text}" ${cop.w}x${cop.h}`);
  const copPress = await (async () => {
    await p.click('#rl-cp .rl-cp-src.is-on [data-nego-ai-clause]');
    await pause(400);
    return p.evaluate(() => {
      const m = document.querySelector('.nego-selmenu');
      const box = m ? m.getBoundingClientRect() : null;
      return { menu: !!m, left: box ? Math.round(box.left) : null,
        top: box ? Math.round(box.top) : null,
        editor: !!document.getElementById('clause-editor'),
        panelHeld: !!document.querySelector('#rl-cp.is-open') };
    });
  })();
  /* WHAT THE PRESS HANDS OVER TO CHANGED ON 25 Aug 2026 and this claim is
     REVERSED IN PLACE: it used to open the Copilot DRAWER, and it opens the
     clause EDITOR now (f245). The original report is still exactly what is
     pinned — "the panel disappears and the copilot dropdown appears on the top
     right corner" — so the no-stray-menu half is untouched, and the half that
     names the destination follows the destination. */
  ck('8d …and pressing it opens the clause editor, with no dropdown left in the corner',
     copPress.menu === false && copPress.editor === true,
     copPress.menu ? `a menu at ${copPress.left},${copPress.top}`
       : (copPress.editor ? 'the editor, no stray menu' : 'no editor'));
  ck('8d2 and the clause panel is still standing behind it, to come back to',
     copPress.panelHeld === true, copPress.panelHeld ? 'panel held' : 'panel shut');
  /* CLOSED AGAIN BEFORE THE FILE GOES ON. The editor is a fixed layer over the
     whole window; left open it covers every pixel the checks below measure,
     and 14b reported a pill as unreachable for exactly that reason. */
  await p.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
  await pause(300);

  /* 8e THE COUNTERPARTY'S UNSENT COUNT. Reported as "the counterparty side the
     changes do not seem to be working", and it PREDATES the clause panel —
     measured against the commit before it, same numbers. Their page held every
     ask that had ARRIVED on the payload as though it were unsent, so the first
     edit of any kind offered to re-send a whole round. */
  await p.evaluate(()=>window.SHOW_COUNTERPARTY()); await pause(1100);
  const cpBefore = await p.evaluate(()=>({
    band: !!document.querySelector('.rl-unsent'),
    arrived: document.querySelectorAll('#rl-changes .rl-card').length }));
  const cpAfter = await p.evaluate(async () => {
    const pill = document.querySelector('.rl-clause .rl-cp-pill');
    pill.click(); await new Promise(r=>setTimeout(r,500));
    document.querySelector('#rl-cp .rl-cp-src.is-on [data-rl-cp-edit]').click();
    await new Promise(r=>setTimeout(r,450));
    const e = document.querySelector('#rl-cp [data-nego-editor]');
    e.focus(); e.innerHTML = '<p>Their rewrite: ninety (90) days.</p>';
    document.querySelector('#rl-cp [data-nego-next]').click();
    await new Promise(r=>setTimeout(r,1100));
    /* RE-POINTED 26 Aug 2026: the strip went and its count went with the act
       into the column's head — "only move the button". The claim is unchanged:
       one edit puts ONE thing on their side of the table, not the whole round. */
    return { n: (document.querySelector('.rl-unsent-go')||{}).textContent,
      cards: document.querySelectorAll('#rl-changes .rl-card').length };
  });
  ck('8e their page holds NOTHING before they touch anything', !cpBefore.band,
     `${cpBefore.arrived} asks already on the payload`);
  ck('8f …and after one edit it holds exactly ONE, not the whole round',
     /\b1$/.test(String(cpAfter.n||'').trim()) && cpAfter.cards === cpBefore.arrived + 1,
     `act "${cpAfter.n}", cards ${cpBefore.arrived} → ${cpAfter.cards}`);
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);

  /* ---- 9. HOW THE PANEL READS, MEASURED (owner-asked 16 Aug 2026) ----
     Three asks off three screenshots, and every one of them is a computed style
     or a geometry — none of it visible to a node test. */
  await p.evaluate(()=>window.SHOW_OWNER&&window.SHOW_OWNER()); await pause(800);
  await p.evaluate(id=>rlCpSetShown(document,id), staged.clauseId); await pause(600);
  const look = await p.evaluate(() => {
    const on = document.querySelector('#rl-cp .rl-cp-src.is-on');
    const box = s => { const e = on.querySelector(s); return e ? e.getBoundingClientRect() : null; };
    const st = (root, s) => { const e = root.querySelector(s); return e ? getComputedStyle(e) : null; };
    const insP = st(on, '.nego-ins, ins.hati-ins');
    const insDoc = st(document.querySelector('#rl-doc'), '.nego-ins, ins.hati-ins');
    const stands = box('.rl-cp-stands'), acts = box('.rl-cp-acts');
    const table = [...on.querySelectorAll('.rl-cp-sec')]
      .find(s => /On the table/i.test((s.querySelector('.rl-cp-h')||{}).textContent||''));
    return {
      insPanel: insP && { fw: insP.fontWeight, bb: parseFloat(insP.borderBottomWidth),
        td: insP.textDecorationLine, col: insP.color },
      insDoc: insDoc && { fw: insDoc.fontWeight, bb: parseFloat(insDoc.borderBottomWidth),
        td: insDoc.textDecorationLine },
      actsUnderStands: !!(stands && acts) && acts.top >= stands.bottom,
      actsAboveTable: !!(acts && table) && acts.bottom <= table.getBoundingClientRect().top,
      head: (st(on, '.rl-cp-h')||{}).color, id: (st(on, '.rl-cp-who b')||{}).color,
      meta: (st(on, '.rl-cp-who')||{}).color, note: (st(on, '.rl-cp-note')||{}).color,
      body: getComputedStyle(document.body).color };
  });
  ck('9a the panel\'s additions are plain green — no bold, no underline, no rule',
     !!look.insPanel && look.insPanel.fw === '400' && look.insPanel.bb === 0
     && look.insPanel.td === 'none' && /rgb\(4, 120, 87\)/.test(look.insPanel.col),
     JSON.stringify(look.insPanel));
  /* ---- 9b REVERSED IN PLACE, 16 Aug 2026 ---- this proved the paper KEPT the
     bold-and-underlined convention while only the panel went plain. The owner
     reported it a second time, pointing at the paper, so the rule moved to the
     base and both surfaces now read the same. What must still hold is that a
     DELETION keeps its strike: colour alone can say "added", nothing but the
     strike can say "taken out". */
  ck('9b …and the PAPER now reads the same way — one fact, one rule',
     !!look.insDoc && look.insDoc.fw === '400' && look.insDoc.bb === 0
     && look.insDoc.td === 'none', JSON.stringify(look.insDoc));
  const struck = await p.evaluate(() => {
    const d = document.querySelector('#rl-doc .nego-del, #rl-doc del.hati-del');
    return d ? getComputedStyle(d).textDecorationLine : null; });
  ck('9b′ …while a DELETION keeps its strike', /line-through/.test(struck || ''), struck);
  ck('9c the acts sit between "As it stands" and "On the table"',
     look.actsUnderStands && look.actsAboveTable,
     `under ${look.actsUnderStands}, above ${look.actsAboveTable}`);
  ck('9d the section headings and the change id are the page\'s own text colour',
     look.head === look.body && look.id === look.body,
     `head ${look.head}, id ${look.id}, body ${look.body}`);
  ck('9e …and the captions under them are NOT — only the signposts were lifted',
     look.note !== look.body && look.meta !== look.body,
     `note ${look.note}, meta ${look.meta}`);
  await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);

  /* ---- 10. A CONTRACT LIMB KEEPS ITS LABEL AND HANGS ITS WRAPS ----
     Two owner reports off a Copilot proposal (16 Aug 2026). The rules are in
     f210 (16); what only a browser can answer is where the characters land —
     whether the second line of a limb really starts on the same vertical line
     as the first WORD of it, which is a measurement and nothing else. */
  const limbs = await p.evaluate(async () => {
    const c = window.CONTRACT, cl = negoClauseList(c)[0];
    const add = 'The Co-Packer shall:\n'
      + '(a) Manufacture all products in accordance with the written recipe, formulation and '
      + 'specifications, including all quality parameters and shelf-life requirements.\n'
      + '(b) Maintain full traceability of all materials, batch records and production logs '
      + 'for each manufacturing run and retain them for three years.';
    await negoEditClause(c, cl.clauseId,
      (cl.bodyHtml || ('<p>' + cl.text + '</p>')) + window.docRichFromText(add),
      { side:'owner', author:'Young Mbagaya', why:'add the limbs' });
    renderRedline();
    await new Promise(r => setTimeout(r, 600));
    const sec = document.querySelector(`#rl-doc .nego-clause[data-clause="${cl.clauseId}"]`);
    const hang = [...sec.querySelectorAll('.rl-line.rl-hang')];
    /* Where does the first painted character of each visual row sit? Measured
       from the real text nodes, because "is it indented" is a question about
       glyphs and not about a class. */
    const columns = el => {
      /* RE-MEASURED 16 Aug 2026, second report on the same geometry
         ("specifications and provided needs to start at the same line as
         manufacture"): the marker is boxed into a fixed gutter now, so the
         measurement separates the LABEL's column from the WORDING's. The ask
         is that the wording sits in ONE column on every row, first and
         wrapped alike, with the label alone in the gutter. */
      const nodes = [];
      const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) nodes.push(n);
        else for (const k of n.childNodes) walk(k); };
      walk(el);
      if (!nodes.length) return null;
      const r = document.createRange(), pts = [];
      for (const tn of nodes){
        const inMarker = !!(tn.parentElement && tn.parentElement.closest('.rl-marker'));
        for (let i = 0; i < tn.length; i++){
          r.setStart(tn, i); r.setEnd(tn, i + 1);
          const b = r.getBoundingClientRect();
          if (b.width || b.height) pts.push({ x: Math.round(b.x), y: Math.round(b.y), inMarker });
        }
      }
      const word = pts.filter(p => !p.inMarker);
      const marks = pts.filter(p => p.inMarker);
      if (!word.length || !marks.length) return null;
      const rows = [...new Set(word.map(p => p.y))].sort((a, b) => a - b);
      return { label: Math.min(...marks.map(p => p.x)),
        word: rows.slice(0, 3).map(y => Math.min(...word.filter(p => p.y === y).map(p => p.x))) };
    };
    return { text: sec.innerText,
      hangCount: hang.length,
      style: hang[0] ? (s => ({ pl: s.paddingLeft, ti: s.textIndent }))(getComputedStyle(hang[0])) : null,
      cols: hang.slice(0, 2).map(columns) };
  });
  ck('10a the lettered labels survive into the contract',
     /\(a\)/.test(limbs.text) && /\(b\)/.test(limbs.text)
     && !/\u2022\s*Manufacture/.test(limbs.text),
     limbs.text.split('\n').filter(l=>/^\(/.test(l.trim())).join(' / ').slice(0,80));
  ck('10b each limb is a hanging line', limbs.hangCount >= 2 && !!limbs.style,
     limbs.style && `${limbs.style.pl} / ${limbs.style.ti}`);
  ck('10c THE WORDING STARTS ON ONE VERTICAL LINE — the first row and its wraps alike',
     /* ±6px, and the residue is named: the first fragment of a marked run
        carries the ins element's own 1px side padding and the glyph's left
        bearing, which a wrapped fragment (box-decoration-break: slice) does
        not — a sub-glyph offset, where the reported fault was the whole
        hanging measure (~40px). The wraps against EACH OTHER stay exact. */
     /* NARROWED IN PLACE, 19 Aug 2026: this required THREE rows from every
        limb, which is a claim about where the text happens to wrap rather
        than about the column it starts in — and the clause got 17px wider
        when the redline mark moved out into the sheet's margin, so one limb
        now needs two lines instead of three. The claim is unchanged: first
        row against its wrap always, and wrap against wrap wherever there is
        a second one. */
     limbs.cols.every(c => c && c.word.length >= 2
       && Math.abs(c.word[0] - c.word[1]) <= 6
       && (c.word.length < 3 || Math.abs(c.word[1] - c.word[2]) <= 1)),
     JSON.stringify(limbs.cols));
  ck('10d …and past the label, which sits alone in the gutter',
     limbs.cols.every(c => c && c.word[0] > c.label), JSON.stringify(limbs.cols));

  /* ---- 11. THE WAY OUT TO THE NOTES — REVERSED IN PLACE (owner-ruled 27 Aug
     2026: "Internal vs external notes should not be in the same view").

     This was History | + notes: a two-way switch in the panel's head that
     folded a conversation living INSIDE the panel, and its four checks asked a
     cascade question no node test can answer — does the conversation COMPUTE
     hidden on the default face and visible after the press.

     The conversation has left the panel for the side drawer, where it is two
     rooms, so there is no face left to fold and nothing here to compute. What
     the section was really guarding survives and is asked instead: the panel
     opens WITHOUT the conversation in it, and the reader has a way to it that
     is real pixels rather than a name in the markup. Which room a note lands in,
     and that the drawer opens on the press, is notes-two-rooms-verify's job —
     it drives the real shell, which this harness page does not load. */
  await p.evaluate(() => {
    const pill = document.querySelector('.rl-clause .rl-cp-pill');
    if (pill) pill.click();
  });
  await pause(500);
  const notesDoor = await p.evaluate(() => {
    const row = document.querySelector('#rl-cp-body [data-rl-cp-change]');
    const door = row && row.querySelector('[data-rl-notes]');
    const r = door ? door.getBoundingClientRect() : null;
    return { segs: !!document.querySelector('#rl-cp .rl-cp-segs'),
      box: !!document.querySelector('#rl-cp-body .rl-cnotes'),
      door: !!door, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
      vis: door ? getComputedStyle(door).visibility : 'absent',
      panelStillOpen: !!document.querySelector('#rl-cp.is-open') };
  });
  ck('11a the switch is gone with the face it folded',
     !!notesDoor && !notesDoor.segs, notesDoor && (notesDoor.segs ? 'still drawn' : 'absent'));
  ck('11b the panel opens without the conversation in it — COMPUTED, not assumed',
     !!notesDoor && !notesDoor.box, notesDoor && (notesDoor.box ? 'a box is in the panel' : 'no box'));
  ck('11c the change\u2019s own row carries the way to it, as real pixels',
     !!notesDoor && notesDoor.door && notesDoor.w > 30 && notesDoor.h > 10
       && notesDoor.vis === 'visible',
     notesDoor && `${notesDoor.w}x${notesDoor.h} ${notesDoor.vis}`);
  ck('11d and reaching for it does not shut the panel behind you',
     !!notesDoor && notesDoor.panelStillOpen, notesDoor && String(notesDoor.panelStillOpen));
  await p.evaluate(() => { const x = document.querySelector('#rl-cp-min'); if (x) x.click(); });
  await pause(300);

  /* ---- 13. THE PANEL IS SET LIKE THE CONTRACT (owner-reported 19 Aug 2026,
     off a screenshot of clause 3 side by side: "make sure the structure in the
     contract is resembled in the panel on the left so that users can follow the
     words and structure as well.")

     The paper gave a numbered limb a gutter — the number out to the left, every
     wrapped line under the first word — and the panel printed the same wording
     flush, because the paper's marker treatment came from the redline's own
     block renderer and the panel's standing wording never went through it. One
     shared treatment now, applied to both. Measured as GLYPH COLUMNS in the
     panel, exactly as 10c measures them on the paper: a question about where
     letters land, which no node test can answer. */
  const paperVsPanel = await p.evaluate(async () => {
    /* A clause whose STANDING wording really is sub-numbered — filed and
       adopted through the product's own funnel, so "as it stands" contains the
       limbs rather than a proposal of them. */
    const c = window.CONTRACT, cl = negoClauseList(c)[3] || negoClauseList(c)[2];
    const text = '3.1 Delivery Terms. Unless otherwise specified in an applicable purchase order, '
      + 'all deliveries shall be made DDP to the Buyer\'s designated manufacturing or storage facility.\n'
      + '3.2 Timely Delivery. Time is of the essence for all deliveries under this Agreement, and the '
      + 'Supplier shall maintain a minimum on-time in-full delivery rate of ninety-five per cent.';
    /* Filed by THEM and adopted by US — the ordinary way wording becomes what
       stands, and the one negoResolve accepts (you do not accept your own ask). */
    const ch = await negoEditClause(c, cl.clauseId, window.docRichFromText(text),
      { side: 'counterparty', author: 'Henry M.', why: 'sub-numbered limbs' });
    await negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Young Mbagaya' });
    renderRedline();
    await new Promise(r => setTimeout(r, 600));
    const sec = document.querySelector(`#rl-doc .nego-clause[data-clause="${cl.clauseId}"]`);
    if (!sec || !sec.querySelector('.rl-cp-pill')) return { none: 'the staged clause has no door' };
    sec.querySelector('.rl-cp-pill').click();
    await new Promise(r => setTimeout(r, 450));
    const stands = document.querySelector('#rl-cp .rl-cp-src.is-on .rl-cp-stands');
    if (!stands) return { none: 'the panel did not open' };
    const hang = [...stands.querySelectorAll('.rl-hang')];
    const cols = el => {
      const nodes = [];
      const walk = n => { if (n.nodeType === 3 && n.textContent.trim()) nodes.push(n);
        else for (const k of n.childNodes) walk(k); };
      walk(el);
      const r = document.createRange(), pts = [];
      for (const tn of nodes){
        const inMarker = !!(tn.parentElement && tn.parentElement.closest('.rl-marker'));
        for (let i = 0; i < tn.length; i++){
          r.setStart(tn, i); r.setEnd(tn, i + 1);
          const b = r.getBoundingClientRect();
          if (b.width || b.height) pts.push({ x: Math.round(b.x), y: Math.round(b.y), inMarker });
        }
      }
      const word = pts.filter(p => !p.inMarker), marks = pts.filter(p => p.inMarker);
      if (!word.length || !marks.length) return null;
      const rows = [...new Set(word.map(p => p.y))].sort((a, b) => a - b);
      return { label: Math.min(...marks.map(p => p.x)),
        word: rows.slice(0, 3).map(y => Math.min(...word.filter(p => p.y === y).map(p => p.x))) };
    };
    const style = hang[0] ? getComputedStyle(hang[0]) : null;
    /* A failure here prints the panel's own markup: "the gutter is missing" and
       "the panel is showing a different clause" look identical in a verdict. */
    if (!hang.length) return { none: 'no hanging line', dump: stands.innerHTML.slice(0, 200) };
    return { hangs: hang.length,
      pl: style ? style.paddingLeft : null, ti: style ? style.textIndent : null,
      cols: hang.slice(0, 2).map(cols).filter(Boolean) };
  });
  ck('13a the panel gives a numbered limb the same gutter the paper gives it',
     !paperVsPanel.none && paperVsPanel.hangs >= 1 && !!paperVsPanel.pl,
     paperVsPanel.none ? `${paperVsPanel.none} :: ${paperVsPanel.dump || ''}`
       : `${paperVsPanel.hangs} hanging line(s), ${paperVsPanel.pl} / ${paperVsPanel.ti}`);
  ck('13b …and its wording sits in ONE column, first row and wraps alike',
     !paperVsPanel.none && paperVsPanel.cols.length >= 1
     && paperVsPanel.cols.every(c => c.word.length >= 2
        && Math.abs(c.word[0] - c.word[1]) <= 6 && c.word[0] > c.label),
     JSON.stringify(paperVsPanel.cols));
  await p.evaluate(() => { const x = document.querySelector('#rl-cp-min'); if (x) x.click(); });
  await pause(250);

  /* THE DUPLICATION RULE: their page mounts the same builder inside the same
     .redline-page wrapper, so the rule reaches it — asserted rather than
     assumed, because "it is the same markup" is exactly the reasoning that has
     been wrong on this page before. */
  await p.evaluate(()=>window.SHOW_COUNTERPARTY()); await pause(1100);
  const theirHang = await p.evaluate(() => {
    const h = document.querySelector('#rl-doc .rl-line.rl-hang');
    if (!h) return { none: true };
    const s = getComputedStyle(h);
    return { pl: s.paddingLeft, ti: s.textIndent, label: /\([a-z]\)/.test(h.innerText) };
  });
  ck('10e their page hangs its limbs too — the same rule, the same mount',
     theirHang.none ? false : (parseFloat(theirHang.pl) > 20 && parseFloat(theirHang.ti) < 0),
     theirHang.none ? 'no hanging line on their copy' : `${theirHang.pl} / ${theirHang.ti}`);

  /* ---- 12. THE PILL DOES NOT MOVE WHEN A CLAUSE IS REDLINED ----
     (owner-asked, 19 Aug 2026.) A marked clause used to gain 14px of padding
     and a 3px rule an unmarked one did not have, so the wording slid 14px
     right and the pill jumped 17px left the moment anything landed on the
     clause. Both are measured here, on the same page, at three document
     sizes — the reader's type must not be able to pull them apart either. */
  const rails = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.redline-page .rl-doc .rl-clause').forEach(cl => {
      const pill = cl.querySelector('.rl-cp-pill');
      const body = cl.querySelector('.nego-body, p');
      if (!pill || !body) return;
      out.push({ marked: cl.classList.contains('is-changed'),
        pillRight: Math.round(pill.getBoundingClientRect().right),
        textLeft: Math.round(body.getBoundingClientRect().left) });
    });
    return out;
  });
  const marked = rails.filter(r => r.marked), plain = rails.filter(r => !r.marked);
  ck('12a the page has both a redlined clause and a plain one to compare',
     marked.length >= 1 && plain.length >= 1, `${marked.length} marked / ${plain.length} plain`);
  const pillEdges = [...new Set(rails.map(r => r.pillRight))];
  const textEdges = [...new Set(rails.map(r => r.textLeft))];
  ck('12b every Edit pill sits on one rail, redlined or not',
     pillEdges.length === 1, pillEdges.join(', ') + 'px');
  ck('12c and the wording starts in one column, redlined or not',
     textEdges.length === 1, textEdges.join(', ') + 'px');

  for (const size of [8, 20]) {
    await p.evaluate(px => { if (window.rlSetDocType) rlSetDocType(px); }, size);
    await pause(400);
    const at = await p.evaluate(() => {
      const e = [];
      document.querySelectorAll('.redline-page .rl-doc .rl-clause').forEach(cl => {
        const pill = cl.querySelector('.rl-cp-pill');
        if (pill) e.push(Math.round(pill.getBoundingClientRect().right));
      });
      return [...new Set(e)];
    });
    ck(`12d the rail holds at ${size}px document type`, at.length === 1, at.join(', ') + 'px');
  }
  await p.evaluate(() => { if (window.rlSetDocType) rlSetDocType(15); });
  await pause(300);

  /* ---- 14. A CLAUSE YOU PROPOSED IS EDITABLE TOO (owner-asked 25 Aug 2026,
     off a screenshot of a payment-terms clause added from the playbook:
     "standard clauses added should be editable as well") ----
     A BROWSER FILE because the claim is a JOURNEY: the pencil has to be
     pressable pixels on the proposed clause, the panel behind it has to open
     with the ＋ on it, the editor has to arrive seeded with the proposal, and
     the save has to revise THE SAME ASK rather than file a second clause into
     the agreement. f210 pins the model and the markup; this drives it. */
  const ins = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const list = negoClauseList(c);
    await negoInsertClause(c, list[list.length - 1].clauseId, {
      headingText: 'Payment terms',
      bodyHtml: '<p>Paid within thirty (30) days of the invoice date.</p>' },
      { side: 'owner', author: 'Young Mbagaya' });
    renderRedline();
    const ask = negoChanges(c).find(x => x.changeType === 'insertClause');
    return { id: ask && ask.id, clauseId: ask && ask.clauseId };
  });
  await pause(600);
  /* SCROLLED INTO VIEW FIRST. elementFromPoint only answers about the visible
     viewport, and the proposed clause is the last thing in the document — a
     pill below the fold reads as unreachable when it is merely off-screen. */
  await p.evaluate(id => {
    const sec = document.querySelector(`.redline-page .nego-clause[data-clause="${id}"]`);
    if (sec) sec.scrollIntoView({ block: 'center' });
  }, ins.clauseId);
  await pause(400);
  ck('14a the fixture proposes a clause the way the playbook does', !!ins.id, ins.id);
  const newPill = await p.evaluate(id => {
    const sec = document.querySelector(`.redline-page .nego-clause[data-clause="${id}"]`);
    const b = sec && sec.querySelector('.rl-cp-pill');
    if (!b) return { drawn:false };
    const r = b.getBoundingClientRect();
    return { drawn:true, w:Math.round(r.width), h:Math.round(r.height),
      reachable: document.elementFromPoint(r.left + r.width/2, r.top + r.height/2) === b
        || b.contains(document.elementFromPoint(r.left + r.width/2, r.top + r.height/2)) };
  }, ins.clauseId);
  ck('14b it carries the same door as every other clause, and it is reachable',
    newPill.drawn && newPill.w > 12 && newPill.h > 10 && newPill.reachable,
    JSON.stringify(newPill));
  await p.evaluate(id => {
    document.querySelector(`.redline-page .nego-clause[data-clause="${id}"] .rl-cp-pill`).click();
  }, ins.clauseId);
  await pause(500);
  const newPanel = await p.evaluate(id => {
    const b = document.querySelector(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${id}"]`);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { on: b.classList.contains('is-on'), w: Math.round(r.width),
      head: (b.querySelector('.rl-cp-h')||{}).textContent,
      stands: (b.querySelector('.rl-cp-stands')||{}).textContent.trim().slice(0, 40),
      act: (b.querySelector('.rl-cp-act-new')||{}).textContent.trim() };
  }, ins.clauseId);
  ck('14c the panel opens on it, headed as a PROPOSAL rather than as in force',
    !!newPanel && newPanel.on && newPanel.w > 100 && !/stands/i.test(newPanel.head||''),
    JSON.stringify(newPanel));
  ck('14d and it shows the wording being proposed, with the ＋ over it',
    !!newPanel && /thirty \(30\)/.test(newPanel.stands||'') && /\+/.test(newPanel.act||''),
    JSON.stringify(newPanel));
  await p.evaluate(id => {
    document.querySelector(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${id}"] .rl-cp-act-new`).click();
  }, ins.clauseId);
  await pause(500);
  const seeded = await p.evaluate(id => {
    const b = document.querySelector(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${id}"]`);
    const e = b && b.querySelector('[data-nego-editor]');
    return e ? { text: e.textContent.trim().slice(0, 40),
      bar: !!b.querySelector('.nego-edit-bar') } : null;
  }, ins.clauseId);
  ck('14e the editor opens in the panel, seeded with the proposal',
    !!seeded && /thirty \(30\)/.test(seeded.text) && seeded.bar, JSON.stringify(seeded));
  const filed13 = await p.evaluate(async id => {
    const b = document.querySelector(`#rl-cp-body .rl-cp-src[data-rl-cp-for="${id}"]`);
    const e = b.querySelector('[data-nego-editor]');
    e.innerHTML = '<p>Paid within forty-five (45) days of the invoice date.</p>';
    b.querySelector('[data-nego-next]').click();
    await new Promise(r => setTimeout(r, 1200));
    const all = negoChanges(window.CONTRACT).filter(x => x.changeType === 'insertClause');
    return { n: all.length, id: all[0] && all[0].id, text: (all[0]||{}).newText || '',
      revs: ((all[0]||{}).revisions || []).length,
      paper: [...document.querySelectorAll('.redline-page section.rl-clause-new')]
        .map(x => x.textContent.replace(/\s+/g, ' ')).join(' | ') };
  }, ins.clauseId);
  ck('14f saving revises the SAME ask — one proposed clause, not two',
    filed13.n === 1 && filed13.id === ins.id && filed13.revs === 1,
    `${filed13.n} clause(s) · ${filed13.id} · ${filed13.revs} revision(s)`);
  ck('14g and the new wording is on the paper',
    /forty-five \(45\)/.test(filed13.text) && /forty-five \(45\)/.test(filed13.paper),
    filed13.text.slice(0, 70));

  /* ============================================================
     15. THE FRONT MATTER IS A REGION, AND IT HAS THE SAME ONE CONTROL
     ------------------------------------------------------------
     (owner-ruled 28 Aug 2026: front matter "editable, recorded as a document
     change".) f250 pins the model — the reserved id, the two refusals, the
     round close; what only a browser can answer is whether the reader can
     actually get at it: is the pencil reachable pixels, does a real press open
     a real panel on it, and is the paper otherwise untouched. */
  const fm = await p.evaluate(() => {
    const head = document.querySelector('.redline-page .rl-paper-head');
    const pen = head && head.querySelector('.rl-cp-pill');
    const title = document.querySelector('.redline-page .rl-paper-title');
    const r = pen ? pen.getBoundingClientRect() : null;
    const hr = head ? head.getBoundingClientRect() : null;
    return { head: !!head, pen: !!pen,
      w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0,
      opens: pen ? pen.getAttribute('data-rl-cp-open') : null,
      /* top right of the region, exactly where a clause's sits */
      rightGap: (r && hr) ? Math.round(hr.right - r.right) : -1,
      topGap: (r && hr) ? Math.round(r.top - hr.top) : -1,
      title: !!title, bands: head ? head.querySelectorAll('.rl-note-card, .nego-note').length : -1 };
  });
  ck('15a THE REGION CARRIES THE PENCIL, as real pixels',
     fm.head && fm.pen && fm.w > 10 && fm.h > 10, `${fm.w}x${fm.h}`);
  ck('15b …it opens the same panel every clause\u2019s does',
     fm.opens === 'front', String(fm.opens));
  ck('15c …at the region\u2019s top right, where a clause\u2019s sits',
     fm.rightGap >= 0 && fm.rightGap < 40 && fm.topGap >= 0 && fm.topGap < 40,
     `${fm.rightGap}px right / ${fm.topGap}px top`);
  ck('15d and NOTHING else is added to the paper \u2014 no band, no caption',
     fm.title === true && fm.bands === 0, `title ${fm.title}, bands ${fm.bands}`);
  const fmOpen = await p.evaluate(async () => {
    const pen = document.querySelector('.redline-page .rl-paper-head .rl-cp-pill');
    pen.click(); await new Promise(r => setTimeout(r, 600));
    const body = document.querySelector('#rl-cp-body .rl-cp-src[data-rl-cp-for="front"]');
    const r = body ? body.getBoundingClientRect() : null;
    return { shown: !!(body && body.classList.contains('is-on')),
      visible: !!(r && r.width > 40 && r.height > 20),
      name: body ? (body.querySelector('.rl-cp-clname') || {}).textContent : null,
      stands: body ? /Warehousing|Between/.test(body.textContent) : false };
  });
  ck('15e a real press opens a real panel on the region',
     fmOpen.shown && fmOpen.visible, JSON.stringify(fmOpen));
  ck('15f …named in the reader\u2019s language, showing the opening\u2019s own words',
     fmOpen.name === 'Title and recital' && fmOpen.stands === true,
     `${fmOpen.name} · wording ${fmOpen.stands}`);
  await p.evaluate(() => { if (window.rlCpSetShown) rlCpSetShown(document, null); });
  await pause(300);

  ck('no page errors', errs.length===0, errs.join(' | ')||'clean');
  const pass=R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} checks passed`);
  await br.close(); srv.close();
  process.exit(pass===R.length?0:1);
})();
