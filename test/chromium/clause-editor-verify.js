/* Chromium verification: the clause editor — a PAGE about one clause.
   ============================================================
   Built from the owner-approved prototype "The Clause Journey" (25 Aug 2026).
   The rules live in f245. This file exists for the parts jsdom cannot answer,
   and on this page almost every claim is one of them:

     · THE PAGE IS TWO COLUMNS AND THE RAIL IS A THIRD OF THE WINDOW. jsdom
       resolves no cascade at all, so a grid is a string there and a geometry
       here. The one-third was asked for in exactly those words.
     · THE READY-MADE QUESTIONS ARE ONE LINE, ALWAYS. Also asked for in those
       words, and only measurable by counting line boxes.
     · A REAL PRESS ON THE DOOR OPENS IT. Both doors are delegated or wired
       per-paint; a button that renders and is never reached looks identical in
       a string assertion, and this project has shipped that fault more than
       once (the unsent band's Send, dead on the counterparty's seat for a day).
     · THE REDLINE DRAWS. The marks are computed by the product's own engine
       and painted through the sheet's own ins/del rules — which are scoped, and
       a rule that loses a cascade fight is a feature that was never built.
     · THE WHOLE JOURNEY, driven: open, apply, save, say why, file — and the
       change on the record with the clause panel back up behind it.
   ============================================================ */
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright-core');
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
  const br=await chromium.launch({executablePath:EXEC,args:['--no-sandbox']});
  const p=await br.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`,{waitUntil:'load'});
  await p.evaluate(()=>window.READY); await pause(500);

  /* One ask on one clause, through the product's own funnel — nothing
     hand-built, so what this page reads is what the product really holds. */
  const staged = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c)[1];
    const ch = await negoFileChange(c, { clauseId: cl.clauseId, changeType:'modify',
      side:'counterparty', author:'Henry M.', oldText: cl.text,
      newText: cl.text.replace(/\.\s*$/, ', in each case at its own cost.'),
      summary:'add a cost allocation' });
    renderRedline();
    return { clauseId: cl.clauseId, id: ch && ch.id };
  });
  await pause(400);
  ck('the fixture has an ask on a clause', !!staged.id, staged.id);

  /* ---- 1. THE DOOR ON THE CHANGE ROW, AND IT LEADS ----
     REVERSED IN PLACE, 25 Aug 2026 (the owner's own drawing of this column).
     The door was a ✦ button sitting on the card's face beside Open; both moved
     into the card's ⋯ MENU, which is what the drawing puts there and where the
     approved clause journey has always put Edit with Copilot. Every half of
     the claim survives and each is asserted below: the door exists, it is
     VISIBLE PIXELS once the ⋯ is pressed (f180's rule — for a menu, the ⋯ is
     what has to be on the face), it LEADS the menu, it wears its words, and it
     is dressed rather than left as an unstyled mark. */
  const rowDoor = await p.evaluate(id => {
    const card = document.querySelector(`.redline-page [data-rl-card="${id}"]`)
      || document.querySelector('.redline-page .rl-card');
    if (!card) return null;
    const more = card.querySelector('.rl-more-btn');
    const mr = more && more.getBoundingClientRect();
    const ms = more && getComputedStyle(more);
    if (more) more.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const ce = card.querySelector('[data-rl-cp-editor-row]');
    const rows = [...card.querySelectorAll('.rl-more-row')];
    if (!ce) return { more: !!more, ce: false };
    const a = ce.getBoundingClientRect();
    const s = getComputedStyle(ce);
    return { more: !!more,
      moreVisible: !!(mr && mr.width > 10 && mr.height > 10 && ms.display !== 'none'),
      ce: true, leads: rows[0] === ce,
      w: Math.round(a.width), h: Math.round(a.height), colour: s.color,
      label: (ce.textContent || '').trim(), vis: s.visibility, disp: s.display };
  }, staged.id);
  ck('1a the ⋯ is on the card face, as visible pixels',
     !!rowDoor && rowDoor.more && rowDoor.moreVisible, rowDoor && rowDoor.moreVisible);
  ck('1a the Copilot door is real pixels once it is pressed',
     !!rowDoor && rowDoor.ce && rowDoor.w > 10 && rowDoor.h > 10 && rowDoor.disp !== 'none',
     rowDoor && `${rowDoor.w}x${rowDoor.h}`);
  ck('1b it LEADS — the menu\'s first row',
     !!rowDoor && rowDoor.leads, rowDoor && `leads ${rowDoor.leads}`);
  ck('1c and it wears its words, not a bare mark',
     !!rowDoor && /Copilot|Redigera/.test(rowDoor.label), rowDoor && rowDoor.label);
  ck('1d it is dressed, not left as an unstyled row',
     !!rowDoor && rowDoor.colour !== 'rgb(0, 0, 0)' && rowDoor.h >= 24,
     rowDoor && `ink ${rowDoor.colour}, ${rowDoor.h}px tall`);

  /* ---- 2. A REAL PRESS OPENS THE PAGE ---- */
  await p.click(`.redline-page [data-rl-cp-editor-row="${staged.clauseId}"]`);
  await pause(500);
  const opened = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    if (!page) return null;
    const r = page.getBoundingClientRect(), s = getComputedStyle(page);
    const grid = page.querySelector('.ce-grid');
    const col = page.querySelector('.ce-col'), rail = page.querySelector('.ce-rail');
    const cr = col.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    const head = page.querySelector('.ce-head').getBoundingClientRect();
    return { w:Math.round(r.width), h:Math.round(r.height),
      pos:s.position, z:s.zIndex, bg:s.backgroundColor,
      coversWindow: Math.round(r.width) >= window.innerWidth - 1
        && Math.round(r.height) >= window.innerHeight - 1,
      cols: getComputedStyle(grid).gridTemplateColumns,
      colW: Math.round(cr.width), railW: Math.round(rr.width),
      railRight: Math.round(Math.abs(rr.right - r.right)) <= 1,
      railTop: Math.round(rr.top), railBottom: Math.round(rr.bottom),
      pageTop: Math.round(r.top), pageBottom: Math.round(r.bottom),
      /* The rail runs floor to ceiling, and the header sits INSIDE the left
         column rather than across both — a full-width header pushes the rail
         down by its own height, which is the one thing about this layout that
         was corrected repeatedly before it was built. */
      railFullHeight: Math.round(rr.top) <= Math.round(r.top) + 1
        && Math.round(rr.bottom) >= Math.round(r.bottom) - 1,
      headInsideColumn: Math.round(head.width) <= Math.round(cr.width) + 1
        && Math.round(head.right) <= Math.round(rr.left) + 1,
      headW: Math.round(head.width),
      title: (page.querySelector('#ce-title')||{}).textContent || '',
      /* RE-POINTED 25 Aug 2026: the facts wear the room head's own .room-facet
         markup now, so one rule dresses both heads. The claim is unchanged —
         four facts under the clause's name. */
      facts: page.querySelectorAll('#ce-facts .room-facet').length };
  });
  ck('2a the page mounted and covers the window',
     !!opened && opened.coversWindow && opened.pos === 'fixed',
     opened && `${opened.w}x${opened.h} ${opened.pos}`);
  ck('2b it is opaque — the shell underneath does not show through',
     !!opened && !/rgba\(0, 0, 0, 0\)|transparent/.test(opened.bg), opened && opened.bg);
  ck('2c THE RAIL IS ONE THIRD OF THE WINDOW, measured',
     !!opened && Math.abs(opened.railW / (opened.colW + opened.railW) - 1/3) < 0.02,
     opened && `${opened.railW} of ${opened.colW + opened.railW} = `
       + (opened && (opened.railW/(opened.colW+opened.railW)).toFixed(3)));
  ck('2d and it is on the right, flush with the window edge',
     !!opened && opened.railRight, opened && `right edge`);
  ck('2d2 THE COPILOT RAIL RUNS THE FULL HEIGHT OF THE WINDOW — top to bottom',
     !!opened && opened.railFullHeight,
     opened && `rail ${opened.railTop}–${opened.railBottom} of page `
       + `${opened.pageTop}–${opened.pageBottom}`);
  ck('2d3 and the header sits INSIDE the left column, never across both — a '
     + 'full-width header is what pushes the rail down',
     !!opened && opened.headInsideColumn,
     opened && `header ${opened.headW}px of a ${opened.colW}px column`);
  ck('2e the clause is named, with four facts under it',
     !!opened && opened.title.trim().length > 0 && opened.facts === 4,
     opened && `"${opened.title.trim()}" / ${opened.facts} facts`);

  /* The one control that floats OVER the page rather than sitting inside the
     shell's grid, and therefore the one z-index alone does not settle: two
     Copilots on one screen, offering different things. */
  const launcher = await p.evaluate(() => {
    /* Standing one in, so the claim is measured rather than skipped: this
       harness builds its own page and has no #ai-launch of its own, and a
       check that passes because the element is absent proves nothing about the
       rule. The rule is in index.html and this stage loads that stylesheet. */
    let el = document.getElementById('ai-launch');
    let planted = false;
    if (!el){ el = document.createElement('button'); el.id = 'ai-launch';
      document.body.appendChild(el); planted = true; }
    const s = getComputedStyle(el);
    const out = { planted, display: s.display, cls: document.body.classList.contains('ce-open') };
    if (planted) el.remove();
    return out;
  });
  ck('2f the page marks the body, so the shell knows it is covered',
     launcher.cls, 'body.ce-open');
  ck('2g and the floating Copilot launcher stands down — two Copilots on one '
     + 'screen offer different things',
     launcher.display === 'none', `display ${launcher.display}`);

  /* ---- 2h. THE HEADER IS THE NEGOTIATION HEAD'S OWN DESIGN ----
     Owner-asked 25 Aug 2026, off two screenshots: "the highlighted part should
     be the same exact design as image 2 including the font sizes." Measured as
     a RELATION against the real head rather than against typed numbers, so a
     later type pass costs no edit here: whatever this product decides a room
     title, a facet label and a facet value are, this page wears the same. */
  const dress = await p.evaluate(() => {
    const T = el => { if (!el) return null; const s = getComputedStyle(el);
      return { fs:s.fontSize, fw:s.fontWeight, c:s.color, tt:s.textTransform,
        ls:s.letterSpacing, lh:s.lineHeight }; };
    const ref = document.querySelector('#ws-head');
    const ed = document.querySelector('#ce-head');
    if (!ref || !ed) return null;
    return {
      h1: [T(ref.querySelector('h1')), T(ed.querySelector('h1'))],
      sub: [T(ref.querySelector('.room-headsub')), T(ed.querySelector('.room-sub'))],
      l: [T(ref.querySelector('.room-facet .l')), T(ed.querySelector('.room-facet .l'))],
      v: [T(ref.querySelector('.room-facet .v')), T(ed.querySelector('.room-facet .v'))],
      facets: ed.querySelectorAll('.room-facet').length,
      dividers: [...ed.querySelectorAll('.room-facet')]
        .filter(f => getComputedStyle(f).borderRightWidth !== '0px').length };
  });
  const alike = k => dress && JSON.stringify(dress[k][0]) === JSON.stringify(dress[k][1]);
  ck('2h the clause name is set exactly as the head it copies', alike('h1'),
     dress && JSON.stringify(dress.h1[1]));
  ck('2i the line under it too', alike('sub'), dress && JSON.stringify(dress.sub[1]));
  ck('2j and the fact labels and values, property for property',
     alike('l') && alike('v'),
     dress && `label ${JSON.stringify(dress.l[1])} / value ${JSON.stringify(dress.v[1])}`);
  ck('2k four facts, ruled apart the way that head rules its own',
     !!dress && dress.facets === 4 && dress.dividers === 3,
     dress && `${dress.facets} facts, ${dress.dividers} dividers`);

  /* ---- 2l. NO COLLAPSE CONTROL ANYWHERE ON THIS PAGE ----
     "remove the collapse feature entirely in the page with image 1". Asserted
     as an ABSENCE of the control AND of the state it toggled, because hiding a
     control while leaving the machinery is how it comes back. */
  const fold = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    /* RE-POINTED 26 Aug 2026, and the claim is unchanged. It used to count
       every [aria-expanded] on the page as a proxy for "a collapse control",
       which was true only while this page had no toggles at all; the paper's
       own pencils carry that attribute, so the proxy started reporting eleven
       collapse controls on a page that has none. Named machinery only. */
    return { control: page.querySelectorAll('.ce-fold, #ce-fold, .ce-ohwrap').length,
      folded: page.querySelectorAll('.is-folded').length,
      snap: page.querySelectorAll('.room-snap, #ws-facts-toggle').length };
  });
  ck('2l the collapse control is gone, and so is the state it toggled',
     !!fold && fold.control === 0 && fold.folded === 0 && fold.snap === 0,
     fold && `control ${fold.control}, folded ${fold.folded}, borrowed ${fold.snap}`);

  /* ---- 2m. THE WAY BACK IS AT THE RIGHT, DRESSED LIKE THE DOOR IT MIRRORS ----
     "move the back to negotiations button to the right where I have
     highlighted and it should look like the button in image 3." The reference
     is built here exactly as the Document tab builds #ws-to-nego, so this is a
     comparison against the real control rather than against typed values. */
  const back = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const head = page.querySelector('#ce-head');
    const mine = page.querySelector('.ce-back-btn');
    if (!mine) return null;
    const ref = document.createElement('button');
    ref.className = 'ui-btn';
    ref.setAttribute('style', 'flex:none;font-size:14px;padding:7px 14px');
    ref.textContent = 'Open Negotiate';
    page.appendChild(ref);
    const T = el => { const s = getComputedStyle(el); return { fs:s.fontSize, fw:s.fontWeight,
      c:s.color, bg:s.backgroundColor, bw:s.borderTopWidth, bc:s.borderTopColor, pad:s.padding }; };
    const out = { ref:T(ref), mine:T(mine),
      hr: head.getBoundingClientRect(), br: mine.getBoundingClientRect(),
      crumbHasBack: !!page.querySelector('.ce-crumb [data-ce-act="close"]'),
      waysOut: page.querySelectorAll('[data-ce-act="close"]').length };
    ref.remove();
    return out;
  });
  /* REVERSED IN PLACE 25 Aug 2026 (owner-asked: "Remove bold lettering from the
     back to negotiations as well … the same size font like the other buttons in
     the platform"). The claim this check was written for is UNCHANGED and is
     still the whole of what it measures — this button is the tab row's own door,
     compared against the real control rather than against typed values. What
     moved is ONE property: the weight. MEASURED against the negotiation head's
     own row, those buttons are --w-body and this was 600, so it read heavier
     than every button the owner was comparing it with. So the comparison now
     names the exception out loud and still fails on a drift in any of the other
     six — which is what it was really guarding. */
  const BACK_SAME = ['fs', 'c', 'bg', 'bw', 'bc', 'pad'];
  const backSame = !!back && BACK_SAME.every(k => back.ref[k] === back.mine[k]);
  ck('2m it is dressed like the tab row\'s own door — every property but the '
     + 'weight, which the owner asked to come off',
     backSame && back.mine.fw !== back.ref.fw,
     back && (backSame
       ? `same but the weight — ref ${back.ref.fw}, mine ${back.mine.fw}`
       : `ref ${JSON.stringify(back.ref)} / mine ${JSON.stringify(back.mine)}`));
  ck('2n it sits at the RIGHT of the header, not in the crumb',
     !!back && Math.round(back.hr.right - back.br.right) < 40 && !back.crumbHasBack,
     back && `${Math.round(back.hr.right - back.br.right)}px from the right edge`);
  ck('2o and it is the ONE way out — two controls leaving the same page is the '
     + 'duplication reported on the contract room the same morning',
     !!back && back.waysOut === 1, back && `${back.waysOut}`);

  /* ---- 3. THE MIDDLE OF THE PAGE IS THE CONTRACT ----
     REVERSED IN PLACE 26 Aug 2026 (owner-asked: "There is no current wording vs
     proposed wording windows. Just one screen in which you can edit like you
     were able to edit in the proposed wording"). What this section guarded was
     never the two boxes — it was that the reader can SEE their draft marked
     against what stands, in colour, with the counts agreeing. Every one of
     those claims is still made; they are made about the paper now. */
  const paper = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const wrap = page.querySelector('.ce-paperwrap');
    const host = page.querySelector('#ce-doc');
    if (!wrap || !host) return null;
    const sheet = host.querySelector('.rl-paper');
    const live = host.querySelector('.rl-clause-live');
    const clauses = host.querySelectorAll('.rl-clause').length;
    return {
      /* The RETIRED ids, named literally: this check is the absence of the two
         boxes, so it must not be re-pointed at whatever replaced them. */
      boxes: page.querySelectorAll('#ce-stands, #ce-prop, .ce-box, .ce-seg').length,
      sheet: !!sheet,
      clauses,
      live: !!live,
      liveIsOne: host.querySelectorAll('.rl-clause-live').length,
      liveText: live ? live.innerText.replace(/\s+/g, ' ').trim().slice(0, 140) : '',
      /* the whole document, not one clause: the paper carries the front matter
         and the signature lines the rest of the product draws */
      head: !!host.querySelector('.rl-paper-head'),
      foot: !!host.querySelector('.rl-paper-foot'),
      scrolls: getComputedStyle(host).overflowY,
    };
  });
  ck('3a the two boxes are GONE and one contract stands in their place',
     !!paper && paper.boxes === 0 && paper.sheet && paper.clauses > 1,
     paper && `boxes ${paper.boxes}, clauses ${paper.clauses}, sheet ${paper.sheet}`);
  ck('3a2 it is the whole document — front matter and signature lines, not one clause',
     !!paper && paper.head && paper.foot && /auto|scroll/.test(paper.scrolls || ''),
     paper && `head ${paper.head}, foot ${paper.foot}, scrolls ${paper.scrolls}`);
  ck('3a3 EXACTLY ONE clause carries the live draft — the override is one clause '
     + 'wide or it is a second document renderer',
     !!paper && paper.liveIsOne === 1, paper && `${paper.liveIsOne} live`);

  /* The draft's own marks. Read after leaving the typing state, because the
     clause opens TYPEABLE — which is a claim of its own, below. */
  const marked = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const pen = page.querySelector('.rl-clause-live [data-ce-pencil]');
    if (pen && pen.getAttribute('aria-expanded') === 'true') pen.click();
    const body = page.querySelector('#ce-clausebody');
    if (!body) return null;
    const ins = body.querySelector('ins, .nego-ins');
    const del = body.querySelector('del, .nego-del');
    return { ins: body.querySelectorAll('ins, .nego-ins').length,
      del: body.querySelectorAll('del, .nego-del').length,
      insColour: ins ? getComputedStyle(ins).color : null,
      delColour: del ? getComputedStyle(del).color : null,
      delLine: del ? getComputedStyle(del).textDecorationLine : null,
      stat: (page.querySelector('#ce-stat') || {}).innerText || '',
      editable: body.getAttribute('contenteditable') };
  });
  ck('3b the redline DRAWS on the paper — the counterparty\'s ask is marked '
     + 'against what stands',
     !!marked && (marked.ins + marked.del) > 0,
     marked && `${marked.ins} ins / ${marked.del} del`);
  ck('3c and the counts agree with the marks',
     !!marked && /\+\s*\d/.test(marked.stat), marked && marked.stat.replace(/\s+/g, ' ').trim());
  ck('3d the marks are COLOURED and the deletion is struck — the rule really reaches them',
     !!marked && !!marked.insColour && marked.insColour !== marked.delColour
       && /line-through/.test(marked.delLine || ''),
     marked && `ins ${marked.insColour}, del ${marked.delColour} ${marked.delLine}`);

  /* ---- 4. THE READY-MADE QUESTIONS ARE ONE LINE ---- */
  const chips = await p.evaluate(() => {
    const box = document.querySelector('#ce-chips');
    if (!box) return null;
    const bs = [...box.querySelectorAll('button')];
    const tops = [...new Set(bs.map(b => Math.round(b.getBoundingClientRect().top)))];
    /* Each chip's own words on one line too: one line box per button. */
    const wraps = bs.filter(b => {
      const r = document.createRange(); r.selectNodeContents(b);
      return r.getClientRects().length > 1;
    }).length;
    return { n: bs.length, rows: tops.length, wraps,
      overflowX: getComputedStyle(box).overflowX, wrap: getComputedStyle(box).flexWrap };
  });
  ck('4a the chips are there', !!chips && chips.n >= 3, chips && `${chips.n} chips`);
  ck('4b THEY NEVER TAKE MORE THAN ONE LINE',
     !!chips && chips.rows === 1 && chips.wraps === 0 && chips.wrap === 'nowrap',
     chips && `${chips.rows} row(s), ${chips.wraps} wrapped`);
  ck('4c and a chip past the edge scrolls rather than wrapping',
     !!chips && /auto|scroll/.test(chips.overflowX), chips && chips.overflowX);

  /* ---- 5. THE ASK BOX IS A REAL BOX THAT WRAPS AND GROWS ---- */
  const ask0 = await p.evaluate(() => {
    const t = document.querySelector('#ce-ask');
    const r = t.getBoundingClientRect(), s = getComputedStyle(t);
    return { h: Math.round(r.height), resize: s.resize, ws: s.whiteSpace };
  });
  await p.fill('#ce-ask', 'One '.repeat(80));
  await pause(200);
  const ask1 = await p.evaluate(() => Math.round(document.querySelector('#ce-ask').getBoundingClientRect().height));
  ck('5a it is three lines deep at rest, not a single-line field',
     ask0.h >= 70, `${ask0.h}px`);
  ck('5b it wraps and GROWS as you write', ask1 > ask0.h && ask0.ws === 'pre-wrap',
     `${ask0.h} to ${ask1}px`);
  await p.fill('#ce-ask', '');

  /* ---- 6. APPLY IS THE ONLY THING THAT MOVES THE WORDING, AND IT STACKS ---- */
  const applied = await p.evaluate(() => {
    const before = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g,' ').trim();
    ceApply('The Supplier shall bear every cost of delivery.', 'test one');
    const one = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g,' ').trim();
    ceApply('The Supplier shall bear half of every cost of delivery.', 'test two');
    const two = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g,' ').trim();
    ceUndo();
    const back = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g,' ').trim();
    return { before, one, two, back,
      undoLive: !document.querySelector('#ce-undo').disabled,
      draft: (document.querySelector('#ce-draft')||{}).innerText || '' };
  });
  ck('6a Apply moves the lower box', /bear every cost/.test(applied.one), 'applied once');
  ck('6b it STACKS — a second Apply does not lose the first',
     /half of every cost/.test(applied.two) && applied.two !== applied.one, 'applied twice');
  ck('6c Undo steps back ONE, not all the way',
     /bear every cost/.test(applied.back) && !/half of every cost/.test(applied.back),
     'one step back');
  ck('6d the foot says the draft is held', /\d\d:\d\d/.test(applied.draft), applied.draft.trim());

  /* ---- 7. THE WHOLE JOURNEY: SAVE FILES ----
     REVERSED IN PLACE 28 Aug 2026. 7a read "Save does not file — it asks why
     first" and 7b pinned the Skip and the way back; the owner has removed the
     question, so the two claims become the one that matters: the press files,
     and nothing stands between the reader and the record. */
  const beforeN = await p.evaluate(() => (window.CONTRACT.changes||[]).length);
  const noStep = await p.evaluate(() => ({
    panel: !!document.querySelector('#ce-reason'),
    box: !!document.querySelector('#ce-why'),
    acts: ['reason-back','reason-skip','reason-file']
      .filter(a => !!document.querySelector('[data-ce-act="' + a + '"]')) }));
  ck('7a NOTHING ASKS WHY — the step is gone, not hidden',
     noStep.panel === false && noStep.box === false && noStep.acts.length === 0,
     JSON.stringify(noStep));
  await p.click('#clause-editor [data-ce-act="save"]');
  await pause(900);
  const filed = await p.evaluate(() => {
    const c = window.CONTRACT;
    const mine = (c.changes||[]).filter(x => x.authorSide === 'owner');
    const last = mine[mine.length-1] || null;
    return { n: (c.changes||[]).length, id: last && last.id,
      why: last && last.why, newText: last && String(last.newText||'').slice(0,80),
      pageGone: !document.getElementById('clause-editor'),
      panelOpen: !!(window.rlCpOpenId && rlCpOpenId()) };
  });
  ck('7c the change is on the record, filed through the ordinary funnel',
     filed.n === beforeN + 1 && !!filed.id && /bear every cost/.test(filed.newText||''),
     `${filed.id} — "${(filed.newText||'').slice(0,50)}"`);
  ck('7d and it carries NO reason, because nothing asked for one',
     filed.why == null || filed.why === '', JSON.stringify(filed.why));
  ck('7e the editor closed', filed.pageGone, 'closed');
  ck('7f AND IT LANDED BACK ON THE CLAUSE PANEL it came from',
     filed.panelOpen, filed.panelOpen ? 'panel up' : 'panel not up');

  /* ---- 8. THE PANEL'S OWN COPILOT BUTTON IS THE OTHER DOOR ---- */
  await p.evaluate(() => { if (window.rlCpSetShown) rlCpSetShown(document, null); });
  await pause(200);
  await p.click(`.redline-page .nego-clause[data-clause="${staged.clauseId}"] .rl-cp-pill`);
  await pause(500);
  const panelDoor = await p.evaluate(() => {
    /* The panel holds ONE body per clause and only the open one is visible, so
       the button has to be resolved through .is-on — the first of eleven is
       some other clause's, and it is never on screen. */
    const b = document.querySelector('#rl-cp .rl-cp-src.is-on .rl-cp-act-ai');
    if (!b) return null;
    return { there:true, editor: b.hasAttribute('data-rl-cp-editor'),
      closes: b.hasAttribute('data-rl-cp-close'),
      label: b.textContent.replace(/\s+/g,' ').trim() };
  });
  ck('8a the panel\'s Copilot button carries the editor marker',
     !!panelDoor && panelDoor.editor, panelDoor && panelDoor.label);
  ck('8b and NOT data-rl-cp-close — the panel has to still be there to come back to',
     !!panelDoor && !panelDoor.closes, panelDoor && `closes ${panelDoor.closes}`);
  await p.click('#rl-cp .rl-cp-src.is-on .rl-cp-act-ai');
  await pause(600);
  const fromPanel = await p.evaluate(() => ({
    page: !!document.getElementById('clause-editor'),
    panelStillOpen: !!(window.rlCpOpenId && rlCpOpenId()) }));
  ck('8c a real press opens the page', fromPanel.page, 'opened');
  ck('8d and the panel is still standing behind it',
     fromPanel.panelStillOpen, 'panel held');

  /* ---- 9. THE WAYS OUT ---- */
  await p.keyboard.press('Escape');
  await pause(400);
  const gone = await p.evaluate(() => ({
    page: !!document.getElementById('clause-editor'),
    panel: !!(window.rlCpOpenId && rlCpOpenId()),
    docThere: !!document.querySelector('.redline-page #rl-doc') }));
  ck('9a Escape closes it', !gone.page, 'closed');
  ck('9b and lands back on the clause panel, with the contract still there',
     gone.panel && gone.docThere, `panel ${gone.panel}, doc ${gone.docThere}`);

  /* ============================================================================
     12. THE PAPER IS WHERE YOU TYPE, AND A READING CAN REFUSE IT
     ----------------------------------------------------------------------------
     (owner-asked 26 Aug 2026: "Just one screen in which you can edit like you
     were able to edit in the proposed wording. It should also include the
     redlined, as agreed and with changes features".)

     EVERY CLAIM HERE IS MEASURED BEHAVIOUR, NEVER A CLASS. "Nothing is
     typeable" asked as "does the element carry a class" is satisfied by a page
     that still accepts a caret, which is the one thing Phase 4 exists to stop;
     so it is asked of contenteditable, of the pencil's presence as pixels, and
     of whether Apply actually moves the wording.
     ========================================================================== */
  await p.evaluate(() => {
    const cl = (window.negoClauseList ? negoClauseList(window.CONTRACT) : [])[0];
    if (window.rlSetReadMode) rlSetReadMode('marks');
    window.rlOpenClauseEditor(window.CONTRACT, cl.clauseId, {});
  });
  await pause(600);

  const typing = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const body = page.querySelector('#ce-clausebody');
    const live = page.querySelector('.rl-clause-live');
    const pen = live ? live.querySelector('[data-ce-pencil]') : null;
    const pr = pen ? pen.getBoundingClientRect() : null;
    return {
      editable: body ? body.getAttribute('contenteditable') : null,
      pencils: page.querySelectorAll('[data-ce-pencil]').length,
      penPressed: pen ? pen.getAttribute('aria-expanded') : null,
      penPainted: !!pr && pr.width > 0 && pr.height > 0,
      /* the pencil the paper draws is the product's own control, not a second
         one written beside it */
      penClass: pen ? pen.className : '',
      cpDoors: page.querySelectorAll('[data-rl-cp-open]').length,
    };
  });
  ck('12a the clause you came in on opens TYPEABLE, in place on the paper',
     typing.editable === 'true' && typing.penPressed === 'true' && typing.penPainted,
     `contenteditable ${typing.editable}, pencil pressed ${typing.penPressed}`);
  ck('12b the pencil is the PRODUCT\'S OWN control, in its second home — a second '
     + 'pencil is how the two surfaces come to disagree',
     /rl-cp-pill/.test(typing.penClass) && typing.pencils > 1 && typing.cpDoors === 0,
     `${typing.pencils} pencils, class "${typing.penClass}", panel doors ${typing.cpDoors}`);

  /* Typing for real, then blurring — a hand edit is an Apply like any other. */
  await p.evaluate(() => {
    const body = document.querySelector('#ce-clausebody');
    body.focus();
    body.innerHTML = '<p>The Buyer shall pay within ninety days of invoice.</p>';
    body.blur();
  });
  await pause(400);
  const typed = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const stat = (page.querySelector('#ce-stat') || {}).innerText.replace(/\s+/g, ' ').trim();
    /* THE COUNTS MOVE AS YOU TYPE; THE MARKS ARRIVE WHEN YOU STOP. While the
       caret is in the clause the reader is looking at their own wording, not at
       strikes drawn over it — the pencil is the toggle, and it is what this
       presses. */
    page.querySelector('.rl-clause-live [data-ce-pencil]').click();
    const body = page.querySelector('#ce-clausebody');
    /* THE WHOLE BODY, never a slice: a clause replaced outright draws as one
       long strike followed by the new sentence, so the typed words sit well
       past the first hundred characters and a slice reports them missing. */
    return { marks: body.querySelectorAll('ins, .nego-ins, del, .nego-del').length,
      text: body.innerText.replace(/\s+/g, ' ').trim(),
      ins: [...body.querySelectorAll('ins, .nego-ins')]
        .map(e => e.textContent).join(' ').replace(/\s+/g, ' ').trim(),
      stat, editableAfter: body.getAttribute('contenteditable') };
  });
  ck('12c TYPING ON THE PAPER PRODUCES A LIVE MARK — a draft nobody has filed, '
     + 'drawn on the contract',
     typed.marks > 0 && /ninety/.test(typed.ins) && /\+\s*\d/.test(typed.stat)
       && typed.editableAfter !== 'true',
     `${typed.marks} marks, counts "${typed.stat}", inserted "${typed.ins.slice(0, 60)}"`);

  /* ---- THE THREE READINGS ---- */
  const segs = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const wrap = page.querySelector('.rl-readwrap');
    if (!wrap) return null;
    const bs = [...wrap.querySelectorAll('[data-rl-read]')];
    return { n: bs.length, vals: bs.map(b => b.getAttribute('data-rl-read')),
      on: bs.filter(b => b.getAttribute('aria-pressed') === 'true')
        .map(b => b.getAttribute('data-rl-read')),
      seg: bs.every(b => /rl-seg/.test(b.className)) };
  });
  ck('12d the three readings are the product\'s OWN builder, in its third home',
     !!segs && segs.n === 3 && segs.seg
       && segs.vals.join(',') === 'marks,agreed,proposed' && segs.on.join(',') === 'marks',
     segs && `${segs.n} tabs ${JSON.stringify(segs.vals)}, live ${JSON.stringify(segs.on)}`);

  /* MEASURED ON THE LIVE CLAUSE, not on the whole document. A SETTLED change
     keeps its marks in all three readings — an accepted insertion IS the
     wording and a refused one is struck rather than dropped — and that rule is
     older than this page. What a reading governs is what is still being argued
     about, and the draft is the most live thing on the paper. */
  const marksBefore = await p.evaluate(() =>
    document.querySelectorAll('.rl-clause-live ins, .rl-clause-live .nego-ins,'
      + ' .rl-clause-live del, .rl-clause-live .nego-del').length);
  /* How the draft's own acts look while they WORK — the reference 12i3 measures
     the greyed state against. */
  const actsLive = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const pick = sel => { const b = page.querySelector(sel); if (!b) return { look: '' };
      const cs = getComputedStyle(b); return { look: cs.color + '|' + cs.opacity }; };
    return { save: pick('[data-ce-act="save"]'), undo: pick('#ce-undo') };
  });
  await p.click('#clause-editor [data-rl-read="agreed"]');
  await pause(500);
  const agreed = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const host = page.querySelector('#ce-doc');
    const band = page.querySelector('#ce-band .rl-readnote');
    const back = band ? band.querySelector('[data-rl-read]') : null;
    const br = back ? back.getBoundingClientRect() : null;
    return {
      marks: page.querySelectorAll('.rl-clause-live ins, .rl-clause-live .nego-ins,'
        + ' .rl-clause-live del, .rl-clause-live .nego-del').length,
      /* MEASURED BEHAVIOUR: is there anything on this page a caret can land in */
      editables: host.querySelectorAll('[contenteditable="true"]').length,
      pencils: page.querySelectorAll('[data-ce-pencil]').length,
      band: !!band,
      bandWords: band ? band.innerText.replace(/\s+/g, ' ').trim() : '',
      backTo: back ? back.getAttribute('data-rl-read') : null,
      backPainted: !!br && br.width > 0 && br.height > 0,
      /* the round's reading order is the negotiation page's, not this one's */
      queue: page.querySelectorAll('.rl-q-tab, .rl-queue, [data-rl-queue-ids]').length,
    };
  });
  ck('12e a reading really changes what the paper draws — the draft\'s marks '
     + 'come off',
     marksBefore > 0 && agreed.marks === 0,
     `${marksBefore} marks on Redlined, ${agreed.marks} on As agreed`);
  ck('12f AND NOTHING ON IT IS TYPEABLE — asked of the caret and of the pencil, '
     + 'never of a class',
     agreed.editables === 0 && agreed.pencils === 0,
     `${agreed.editables} editable, ${agreed.pencils} pencils`);
  ck('12g the band says so, in the owner\'s own words, and CARRIES the way back',
     agreed.band && /not editable/i.test(agreed.bandWords) && agreed.backTo === 'marks'
       && agreed.backPainted,
     agreed.band ? `"${agreed.bandWords}"` : 'no band');
  ck('12h and the round\'s queue rail is NOT on this page — it is about the round '
     + 'and this page is about one clause',
     agreed.queue === 0, `${agreed.queue}`);

  /* Apply is the third door into the wording, and a rule kept in two of three
     places is not a rule. */
  const refused = await p.evaluate(() => {
    const before = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g, ' ').trim();
    const took = window.ceApply('Something the reader cannot see arriving.', 'x');
    const after = document.querySelector('#ce-clausebody').innerText.replace(/\s+/g, ' ').trim();
    return { took, moved: before !== after };
  });
  ck('12i Apply is refused on a clean reading too — and the wording provably '
     + 'does not move',
     refused.took === false && refused.moved === false,
     `took ${refused.took}, moved ${refused.moved}`);

  /* A band saying "not editable" over a live Save is a page arguing with
     itself. GREYED, not hidden, with the reason on the hover. */
  const acts = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const pick = sel => { const b = page.querySelector(sel); if (!b) return { there: false };
      const cs = getComputedStyle(b);
      return { there: true, off: b.disabled, why: (b.getAttribute('title') || ''),
        look: cs.color + '|' + cs.opacity }; };
    return { save: pick('[data-ce-act="save"]'), discard: pick('[data-ce-act="discard"]'),
      undo: pick('#ce-undo') };
  });
  ck('12i2 and the draft\'s own acts stand down with the caret — greyed, drawn, '
     + 'and each saying why',
     acts.save.there && acts.save.off && /not editable|Endast|reading only/i.test(acts.save.why)
       && acts.discard.off && acts.undo.off,
     `save off ${acts.save.off} ("${acts.save.why}"), discard ${acts.discard.off}, undo ${acts.undo.off}`);
  /* A DIMMED CONTROL THAT STILL LOOKS LIVE IS WORSE THAN NO SIGNAL, so the
     greying is measured against how the same controls look when they work —
     a relation, never a typed colour. */
  ck('12i3 and the greying really READS — measured against the same controls live',
     !!actsLive && actsLive.save.look !== acts.save.look && actsLive.undo.look !== acts.undo.look,
     actsLive && `save ${actsLive.save.look} → ${acts.save.look}, undo ${actsLive.undo.look} → ${acts.undo.look}`);

  /* The way back, pressed for real. */
  await p.click('#clause-editor #ce-band [data-rl-read="marks"]');
  await pause(500);
  const backOn = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    return { marks: page.querySelectorAll('.rl-clause-live ins, .rl-clause-live .nego-ins,'
        + ' .rl-clause-live del, .rl-clause-live .nego-del').length,
      band: page.querySelectorAll('#ce-band .rl-readnote').length,
      pencils: page.querySelectorAll('[data-ce-pencil]').length,
      /* the negotiation page's own retirement stands: the notice stack calls
         this builder with nothing and still gets nothing */
      retired: (window.rlReadNoticeHtml ? rlReadNoticeHtml() : 'x') === '' };
  });
  ck('12j the way back on the band really works — the marks return',
     backOn.marks > 0 && backOn.pencils > 0, `${backOn.marks} marks, ${backOn.pencils} pencils`);
  ck('12k and on Redlined the band draws NOTHING — a band that is always there '
     + 'stops being read',
     backOn.band === 0, `${backOn.band} bands`);
  ck('12l THE NEGOTIATION PAGE\'S OWN RETIREMENT STANDS — its notice stack asks '
     + 'this same builder and still gets nothing',
     backOn.retired, backOn.retired ? 'still empty there' : 'the band came back on that page');

  /* Moving to another clause is ONE act, whether it is the crumb or a pencil. */
  const moved = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const here = window.clauseEditorClauseId();
    const other = [...page.querySelectorAll('[data-ce-pencil]')]
      .map(b => b.getAttribute('data-ce-pencil')).find(id => id && id !== here);
    if (!other) return null;
    page.querySelector(`[data-ce-pencil="${other}"]`).click();
    return { from: here, to: other };
  });
  await pause(600);
  const landed = await p.evaluate(() => ({
    on: window.clauseEditorClauseId(),
    open: !!document.getElementById('clause-editor') }));
  ck('12m the pencil on ANOTHER clause moves the page to that clause',
     !!moved && landed.open && landed.on === moved.to && landed.on !== moved.from,
     moved && `${moved.from} → ${landed.on}`);

  /* ---- THE PAGE UNDERNEATH COMES BACK IN STEP ----
     The reading is one value for the whole product, so a reader who leaves this
     page on 'As agreed' has set the negotiation page's reading too — and
     rlSetReadMode repaints that page's TAB ROW while it is covered. Left there,
     they would come back to a page whose tabs say As agreed over a document
     still carrying its marks, which is the exact fault the reading notice
     exists for. */
  await p.evaluate(() => { if (window.rlSetReadMode) rlSetReadMode('agreed'); });
  await p.evaluate(() => window.rlCloseClauseEditor());
  await pause(600);
  const under = await p.evaluate(() => {
    const doc = document.querySelector('.redline-page #rl-doc') || document.querySelector('#rl-doc');
    const tab = document.querySelector('.redline-page .rl-readwrap [data-rl-read="agreed"]');
    return { mode: window.rlReadMode ? rlReadMode() : null,
      tabOn: tab ? tab.getAttribute('aria-pressed') : null,
      marks: doc ? doc.querySelectorAll('.rl-clause:not(.is-changed) ins, '
        + '.rl-clause:not(.is-changed) del').length : -1,
      pencils: doc ? doc.querySelectorAll('[data-rl-cp-open]').length : -1 };
  });
  ck('12n leaving on a clean reading leaves the page underneath IN STEP — its '
     + 'tabs and its document say the same thing',
     under.mode === 'agreed' && under.tabOn === 'true' && under.pencils === 0,
     `mode ${under.mode}, tab ${under.tabOn}, pencils ${under.pencils}`);
  await p.evaluate(() => { if (window.rlSetReadMode) rlSetReadMode('marks'); if (window.renderRedline) renderRedline(); });
  await pause(500);

  /* ---- 11. THE COUNTERPARTY'S SEAT IS UNTOUCHED ----
     Mounted from a REAL share payload, which is the only honest way to ask:
     their page is not a mode of ours, it is renderSharePortal building a
     contract back out of what travelled. Checked as a set of absences AND as
     behaviour, because identical markup can still behave differently — the one
     thing this work changed in a file their page loads is the clause panel's
     Escape handler, which now defers while the editor is open. It is never
     open here, so it must behave exactly as it did. */
  await p.evaluate(() => window.SHOW_COUNTERPARTY()); await pause(1300);
  const theirs = await p.evaluate(() => ({
    rowDoors: document.querySelectorAll('[data-rl-cp-editor-row]').length,
    panelDoors: document.querySelectorAll('[data-rl-cp-editor]').length,
    editorClass: document.querySelectorAll('.rl-cp-editor-btn').length,
    aiButtons: document.querySelectorAll('#share-root [data-nego-ai-clause]').length,
    cards: document.querySelectorAll('#share-root .rl-card').length }));
  ck('11a their page holds cards to check', theirs.cards > 0, `${theirs.cards} cards`);
  ck('11b no ✦ door on any of their tracked changes, and no marker on their panel',
     theirs.rowDoors === 0 && theirs.panelDoors === 0 && theirs.editorClass === 0,
     `rows ${theirs.rowDoors}, panel ${theirs.panelDoors}, class ${theirs.editorClass}`);
  ck('11c and their panel draws no Copilot button at all — it never did',
     theirs.aiButtons === 0, `${theirs.aiButtons}`);

  const forced = await p.evaluate(() => {
    const id = negoClauseList(window.CONTRACT)[1].clauseId;
    const seat = window.clauseEditorRefusal(window.CONTRACT, { side: 'counterparty' });
    const ro = window.clauseEditorRefusal(window.CONTRACT, { readonly: true });
    const ok = window.rlOpenClauseEditor(window.CONTRACT, id, { side: 'counterparty' });
    return { seat, ro, ok, mounted: !!document.getElementById('clause-editor'),
      body: document.body.className };
  });
  ck('11d forced open from their seat is refused, and mounts nothing',
     forced.ok === false && forced.mounted === false && !/ce-open/.test(forced.body),
     `${forced.ok}, mounted ${forced.mounted}`);
  ck('11e each refusal names itself rather than one covering both',
     typeof forced.seat === 'string' && typeof forced.ro === 'string' && forced.seat !== forced.ro,
     forced.seat);

  const theirPanel = await p.evaluate(() => {
    const b = document.querySelector('#share-root .rl-cp-pill');
    if (!b) return { none: true };
    b.click(); return { none: false };
  });
  await pause(500);
  const theirOpen = await p.evaluate(() => !!(window.rlCpOpenId && rlCpOpenId()));
  await p.keyboard.press('Escape');
  await pause(400);
  const theirShut = await p.evaluate(() => !(window.rlCpOpenId && rlCpOpenId()));
  ck('11f their clause panel still opens from the pill',
     !theirPanel.none && theirOpen, `open ${theirOpen}`);
  ck('11g and Escape still closes it — the deferral added for the editor never '
     + 'engages on a page that cannot open one',
     theirShut, `shut ${theirShut}`);

  const theirVerbs = await p.evaluate(async () => {
    const btn = document.querySelector('#share-root [data-nego-accept]');
    if (!btn) return { none: true };
    const card = btn.closest('.rl-card');
    const id = (card.querySelector('.rl-card-id') || {}).textContent || '?';
    btn.click();
    await new Promise(r => setTimeout(r, 700));
    /* MEASURED AS A PERSON SEES IT, never off a store: PORTAL_NEGO_DECISIONS is
       module-local and is not on window, so reading it through window reports
       zero however well the press worked. What a reader sees is the card's own
       verbs become Send and Undo, and the batch send appear.
       RE-POINTED 26 Aug 2026: the owner deleted the "N not sent" strip and moved
       its act into the column's head — "only move the button" — so what appears
       is the act itself, in that head, on their seat exactly as on ours. */
    const after = [...document.querySelectorAll('#share-root .rl-card')]
      .find(c => ((c.querySelector('.rl-card-id') || {}).textContent || '') === id);
    return { none: false, id,
      verbs: after ? [...after.querySelectorAll('button')]
        .map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) : [],
      band: !!document.querySelector('#share-root .rl-idx-top .rl-unsent-go'),
      strip: !!document.querySelector('#share-root .rl-unsent') };
  });
  ck('11h and their own decide verbs still work end to end',
     !theirVerbs.none && /Send/i.test((theirVerbs.verbs || []).join(' '))
       && /Undo/i.test((theirVerbs.verbs || []).join(' '))
       && theirVerbs.band && !theirVerbs.strip,
     theirVerbs.none ? 'no accept verb on their page'
       : `${theirVerbs.id} now offers ${JSON.stringify(theirVerbs.verbs)}`);

  /* ==========================================================================
     12. TWO LISTS, TWO VERBS — a rule that is not about this clause
     --------------------------------------------------------------------------
     OWNER-REPORTED 26 Aug 2026: on a LEASE CHARGES clause the scan rail listed a
     DATA PROTECTION rule and its "Use our standard" struck out the whole
     lease-charge sentence and put a data protection paragraph in its place.

     The rules are pinned in f245. What is asked HERE is what jsdom cannot
     answer: that both group headings are PAINTED, that the missing card's verbs
     are visible pixels rather than markup nobody can reach (f180's rule, which
     this project has shipped the wrong side of before), that the missing card
     draws NO strike-through against the open clause, and that a REAL press on a
     REAL delegated listener files a new clause instead of overwriting the one on
     screen.

     THE CLAUSE LIBRARY IS SUPPLIED ON THE STAGE. parity.html does not load
     js/playbook.js and is shared by ten browser files, so it is not this
     change's to add a script to; the library is stood up here instead, in the
     shape the product's own returns. The claim that "our standard" is the
     WORKSPACE'S wording is a data claim and is proved in f131 and f245 against
     the real library — this file proves the pixels and the press.
     ========================================================================== */
  await p.evaluate(() => {
    if (window.rlSetReadMode) rlSetReadMode('marks');
    window.clauseLibrary = () => ([
      { id:'cl-pay', category:'Payment terms', name:'Payment within 30 days',
        preferred:'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.',
        fallback:'Payment within forty-five (45) days of a valid invoice.' },
      { id:'cl-dp', category:'Data protection', name:'Data Protection Act 2019 compliance',
        preferred:'Where personal data is processed, each party complies with the Data Protection Act, 2019 and applicable ODPC guidance.',
        fallback:'The parties comply with the Data Protection Act, 2019.' },
    ]);
    const cls = negoClauseList(window.CONTRACT);
    const here = cls[0];
    window.CONTRACT.playbook = { key:'x', label:'test', source:'ai', verdicts: [
      { category:'Payment terms', status:'deviation', quote: here.text.slice(0, 60),
        position:'Payment due within 30 days',
        redline:'The Buyer shall pay within thirty (30) days of the invoice date.', escalate:false },
      { category:'Data protection', status:'missing', quote:'',
        position:'Data protection clause preferred where personal data is involved',
        redline:'Insert a data protection clause addressing GDPR obligations.', escalate:false },
    ] };
    window.rlOpenClauseEditor(window.CONTRACT, here.clauseId, {});
  });
  await pause(600);
  await p.click('#clause-editor [data-ce-tab="scan"]');
  await pause(300);

  const rail = await p.evaluate(() => {
    const seen = el => { if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const page = document.getElementById('clause-editor');
    const heads = [...page.querySelectorAll('.ce-scan-h')]
      .filter(seen).map(h => h.textContent.replace(/\s+/g, ' ').trim());
    const cards = [...page.querySelectorAll('.ce-rule')];
    const miss = cards.find(el => /Data protection/.test(el.textContent));
    const here = cards.find(el => /Payment terms/.test(el.textContent));
    const verbsOf = el => el ? [...el.querySelectorAll('[data-ce-scan]')]
      .filter(seen).map(b => b.textContent.replace(/\s+/g, ' ').trim()) : [];
    const pv = miss ? miss.querySelector('.pv') : null;
    return {
      heads,
      missVerbs: verbsOf(miss), hereVerbs: verbsOf(here),
      missMarks: pv ? pv.querySelectorAll('del, ins').length : -1,
      hereMarks: here && here.querySelector('.pv')
        ? here.querySelector('.pv').querySelectorAll('del, ins').length : -1,
      missLine: miss ? (miss.querySelector('.l') || {}).textContent || '' : '',
      pvk: miss ? (miss.querySelector('.pvk') || {}).textContent || '' : '',
    };
  });
  ck('12a both group headings are painted, and the second carries its promise',
     rail.heads.length === 2 && /This clause/.test(rail.heads[0])
       && /Missing from the contract/.test(rail.heads[1])
       && /never replace the clause you are in/.test(rail.heads[1]),
     JSON.stringify(rail.heads));
  ck('12b every verb on a missing rule ADDS — none of them offers to replace',
     rail.missVerbs.length > 0 && rail.missVerbs.every(v => /^Add /.test(v))
       && !rail.missVerbs.some(v => /^Use /.test(v)),
     JSON.stringify(rail.missVerbs));
  ck('12c a located rule keeps the USE verbs, so the split is real either way',
     rail.hereVerbs.length > 0 && rail.hereVerbs.every(v => /^Use /.test(v)),
     JSON.stringify(rail.hereVerbs));
  ck('12d the missing card marks up nothing of the clause on screen',
     rail.missMarks === 0 && rail.hereMarks > 0,
     `missing ${rail.missMarks} marks, located ${rail.hereMarks}`);
  ck('12e "our standard" leads the preview and says whose wording it is',
     /Our standard/.test(rail.pvk), rail.pvk);
  /* THE SEPARATOR CLAIM IS NOT ASKED HERE, and that is deliberate rather than an
     omission. The doubly-escaped "&middot;" came out of pbVerdictLine, which
     lives in js/playbook.js — absent from this stage, so the rail correctly
     falls back to the bare position and there is no separator to measure. It is
     a text claim, jsdom answers it with the real module loaded, and f245 (12)
     does exactly that and fails against the old code. Stubbing the function
     here would only prove the stub. */

  /* THE PRESS ITSELF — through the page's own delegated listener. */
  const pressed = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const before = negoChanges(c).length;
    const id = clauseEditorClauseId();
    const wordingBefore = String((negoClauseNowById(c, id) || {}).text || '');
    const btn = [...document.querySelectorAll('#clause-editor [data-ce-scan]')]
      .find(b => /^Add our standard$/.test(b.textContent.trim()));
    if (!btn) return { none: true };
    btn.click();
    await new Promise(r => setTimeout(r, 400));
    const chs = negoChanges(c);
    const ch = chs[chs.length - 1];
    return { none: false, grew: chs.length - before,
      type: ch && ch.changeType, status: ch && ch.status,
      clauseHeld: String((negoClauseNowById(c, id) || {}).text || '') === wordingBefore,
      settled: /Added as a new clause/.test(document.getElementById('clause-editor').innerHTML) };
  });
  ck('12f with no playbook module the line degrades to the position — never blank, never an entity',
     rail.missLine.trim().length > 0 && !/&middot;|&amp;/.test(rail.missLine), rail.missLine);
  ck('12g pressing Add files ONE new clause as a proposal',
     !pressed.none && pressed.grew === 1 && pressed.type === 'insertClause'
       && pressed.status === 'pending',
     pressed.none ? 'no Add button found' : `${pressed.grew} change, ${pressed.type}/${pressed.status}`);
  ck('12h and the clause the reader had open is untouched',
     !pressed.none && pressed.clauseHeld === true, String(pressed.clauseHeld));
  ck('12i the card settles rather than offering the same press again',
     !pressed.none && pressed.settled === true, String(pressed.settled));

  /* ==========================================================================
     13. WHAT A PRESS COSTS — drawn, quiet, and per verb
     --------------------------------------------------------------------------
     The rules are in f245 (13). What is asked HERE is what jsdom cannot answer:
     that the line is PAINTED under the preview, that its computed colour is the
     label shade rather than an alarm, and that two verbs offering wordings of
     different cost really do carry different hovers — which is the whole reason
     the hover exists.
     ========================================================================== */
  await p.evaluate(() => {
    if (window.rlSetReadMode) rlSetReadMode('marks');
    window.clauseLibrary = () => ([
      { id:'cl-pay', category:'Payment terms', name:'Payment within 30 days',
        preferred:'The Buyer shall pay each undisputed invoice within thirty (30) days of receipt.',
        fallback:'Payment within forty-five (45) days of a valid invoice.' },
    ]);
    const here = negoClauseList(window.CONTRACT)[0];
    window.CONTRACT.playbook = { key:'x', label:'t', source:'ai', verdicts: [
      { category:'Payment terms', status:'deviation', quote: here.text.slice(0, 50),
        position:'Payment due within 30 days',
        /* a SURGICAL draft, so the two wordings cost different amounts */
        redline: here.text.replace(/\.$/, ', in each case within thirty (30) days.'), escalate:false },
    ] };
    window.rlOpenClauseEditor(window.CONTRACT, here.clauseId, {});
  });
  await pause(600);
  await p.click('#clause-editor [data-ce-tab="scan"]');
  await pause(300);

  const cost = await p.evaluate(() => {
    const card = document.querySelector('#clause-editor .ce-rule');
    if (!card) return { none: true };
    const line = card.querySelector('.cost');
    const pv = card.querySelector('.pv');
    const cs = line ? getComputedStyle(line) : null;
    const r = line ? line.getBoundingClientRect() : null;
    const titles = {};
    for (const b of card.querySelectorAll('[data-ce-scan]'))
      titles[b.textContent.replace(/\s+/g, ' ').trim()] = b.getAttribute('title');
    /* the label shade, resolved — and the two alarm tones, resolved, to compare
       against rather than typing a hex that a palette pass would move */
    const probe = document.createElement('span');
    document.body.appendChild(probe);
    const tone = v => { probe.style.color = `var(${v})`; return getComputedStyle(probe).color; };
    const label = tone('--color-neutral-600'), amber = tone('--st-amber-fg'), ruby = tone('--st-ruby-fg');
    probe.remove();
    return { none: false,
      text: line ? line.textContent.replace(/\s+/g, ' ').trim() : null,
      painted: !!(r && r.width > 0 && r.height > 0),
      colour: cs ? cs.color : null, label, amber, ruby,
      belowPreview: !!(line && pv && (line.compareDocumentPosition(pv) & Node.DOCUMENT_POSITION_PRECEDING)),
      titles };
  });
  ck('13a the cost line is painted under the preview, not merely in the markup',
     !cost.none && cost.painted && cost.belowPreview, cost.none ? 'no card' : `"${cost.text}"`);
  ck('13b it reads as a count of this clause\'s own words',
     !cost.none && /\d+ words?/.test(cost.text || ''), cost.text);
  ck('13c and it is drawn QUIET — the label shade, and neither alarm tone',
     !cost.none && cost.colour === cost.label && cost.colour !== cost.amber && cost.colour !== cost.ruby,
     `${cost.colour} (label ${cost.label}, amber ${cost.amber}, ruby ${cost.ruby})`);
  const t = cost.titles || {};
  const std = t['Use our standard'], draft = t["Use Copilot's draft"];
  ck('13d each verb carries its OWN cost, so the two can be compared unpressed',
     !!std && !!draft && std !== draft && /keeps none/.test(std) && /keeps \d/.test(draft),
     JSON.stringify({ std, draft }));

  /* ---- 14. COMMENTARY NEVER REACHES THE CARD (owner-reported 26 Aug 2026) ----
     "i asked copilot to replace an entire clause and this is what it did", over
     a screenshot of the clause struck through with the model's own commentary
     filed as its replacement wording. The rule is in f135e; what only a browser
     can answer is the half the owner actually saw — whether a CARD is drawn,
     and whether the words are still readable when it is not.

     THE STUB IS window.copilotAsk, NOT copilotPropose, and that is the whole
     point of doing it here: copilotPropose reads window.copilotAsk by name and
     then calls the REAL aiParseProposal, so everything between the model's
     reply and the pixels is the product's own. selection-verify stubs
     copilotPropose instead, which is why no browser file has ever exercised
     this parser. */
  const THIRD_PERSON = 'The drafter wants to replace Clause 2 (Term and Termination), '
    + 'but the playbook concern is about Clause 5 (Limitation of Liability), not Clause 2. '
    + 'This is a mismatch. The passage shown is indeed Clause 2 and contains only term '
    + 'and termination language — nothing about liability.';
  const REAL_WORDING = 'This Agreement shall continue for three (3) years from the '
    + 'Effective Date and may be terminated by either Party on ninety (90) days written notice.';

  const askWith = async reply => await p.evaluate(async ({ reply, THIRD_PERSON }) => {
    const cl = negoClauseList(window.CONTRACT)[1];
    window.rlOpenClauseEditor(window.CONTRACT, cl.clauseId, {});
    /* the rail's chat, not the scan */
    const tab = document.querySelector('#clause-editor [data-ce-tab="chat"]');
    if (tab) tab.click();
    window.copilotAvailable = () => true;
    window.copilotAsk = async () => reply;
    return { before: (document.querySelector('#ce-paper, .ce-doc, #clause-editor .rl-doc')
      || document.body).textContent.length };
  }, { reply, THIRD_PERSON });

  const readLane = async () => await p.evaluate(() => {
    const lane = document.querySelector('#ce-lane');
    const card = lane && lane.querySelector('.ce-card');
    const cr = card ? card.getBoundingClientRect() : null;
    const bubbles = [...(lane ? lane.querySelectorAll('.ce-ai p.t') : [])];
    const said = bubbles.map(b => ({ text: b.textContent.replace(/\s+/g, ' ').trim(),
      painted: b.getBoundingClientRect().width > 0 && b.getBoundingClientRect().height > 0 }));
    return { cardPainted: !!(cr && cr.width > 0 && cr.height > 0), said };
  });

  await askWith(THIRD_PERSON);
  await p.fill('#ce-ask', 'replace this clause');
  await p.click('#clause-editor [data-ce-act="ask"]');
  await pause(600);
  const talk = await readLane();
  const spoken = talk.said.find(x => /playbook concern is about Clause 5/.test(x.text));
  ck('14a THE FIX: commentary draws NO card — nothing to apply over a remark',
     !talk.cardPainted, talk.cardPainted ? 'a card was drawn' : 'no card');
  ck('14b and the reader still reads every word of it, as painted pixels',
     !!spoken && spoken.painted && /nothing about liability/.test(spoken.text),
     spoken ? spoken.text.slice(0, 80) : 'the words are nowhere on screen');

  /* THE NEGATIVE CONTROL, and without it 14a passes on a broken stub: a reply
     that IS wording must still draw its card through the identical path. */
  await askWith(REAL_WORDING);
  await p.fill('#ce-ask', 'make the term three years');
  await p.click('#clause-editor [data-ce-act="ask"]');
  await pause(600);
  const drafted = await readLane();
  ck('14c CONTROL: real wording down the same stub still draws its card',
     drafted.cardPainted, drafted.cardPainted ? 'card drawn' : 'no card — the stub is broken, 14a proves nothing');

  await p.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"]'); if (b) b.click(); });
  await pause(300);

  /* ---- 15. ORDINARY DRAFTING IS NOT BROKEN INTO SUB-PARAGRAPHS ----
     Owner-reported 26 Aug 2026, off a screenshot: "now the structure is
     breaking". A whole clause replaced with one paragraph came back on the
     paper as "…three" / "(" / "3) years…", the lone bracket on a line of its
     own and the digit that followed it read as a sub-paragraph number and put
     in the hanging indent's gutter. The rule is in F97d.

     DRIVEN THROUGH aiPreserveTypography WITH THE REAL CLAUSE'S OWN TEXT, not
     through a stubbed ask: this page's harness already seeds a proposal card
     of its own, so a check that pressed "the first [data-ce-apply]" applied
     THAT and passed identically on the broken code. It was written that way
     first and caught by running it against the parent commit — which is the
     only reason this section says anything at all.

     Clause 1 is the right fixture on both counts: its text is TWO lines, which
     is what sends the repair looking for items, and it already carries a
     numeral gloss of its own. */
  const CLAUSE_PROSE = 'This Agreement has an initial term of three (3) years from the '
    + "Effective Date. Either party may terminate by six (6) months' written notice.";

  const gloss = await p.evaluate(async ({ prose }) => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c)[1];
    window.rlOpenClauseEditor(c, cl.clauseId, {});
    await new Promise(r => setTimeout(r, 200));
    /* the product's own repair, on the passage the editor really sends */
    const repaired = String(window.aiPreserveTypography
      ? aiPreserveTypography(cl.text, prose) : '');
    ceApply(repaired, 'test');
    await new Promise(r => setTimeout(r, 300));
    const body = document.querySelector('#ce-clausebody');
    return { baseLines: String(cl.text).split('\n').filter(Boolean).length,
      repaired,
      repairedLines: repaired.split('\n').filter(l => l.trim()).length,
      lines: [...(body ? body.querySelectorAll('.rl-line') : [])]
        .map(el => el.textContent.replace(/\s+/g, ' ').trim()),
      text: body ? body.textContent.replace(/\s+/g, ' ') : '' };
  }, { prose: CLAUSE_PROSE });

  ck('15a the fixture really is the shape that triggers the repair',
     gloss.baseLines > 1, `${gloss.baseLines} lines in the clause it replaces`);
  ck('15b THE FIX: one paragraph of drafting stays one paragraph',
     gloss.repairedLines === 1, `${gloss.repairedLines} line(s): ${JSON.stringify(gloss.repaired.slice(0, 90))}`);
  ck('15c and no lone bracket is left anywhere in it',
     !/\n\(\s*\n/.test(gloss.repaired) && !/(^|\n)\d\)/.test(gloss.repaired),
     JSON.stringify(gloss.repaired.slice(0, 70)));
  /* `.every` on an empty list is true, so the count is asserted first. */
  ck('15d and the paper draws it whole, numerals and all',
     gloss.lines.length > 0 && gloss.lines.every(l => l !== '(' && !/^\d\)/.test(l))
       && /three \(3\) years/.test(gloss.text),
     `${gloss.lines.length} lines; offenders `
       + JSON.stringify(gloss.lines.filter(l => l === '(' || /^\d\)/.test(l))));

  await p.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"]'); if (b) b.click(); });
  await pause(300);

  /* ==========================================================================
     16. THE DIVIDER (owner-asked 26 Aug 2026)
     --------------------------------------------------------------------------
     Ported from the negotiation page the way Key Terms was. It can only be
     proved here: a drag through the real input pipeline against a real grid,
     and a set of geometries a source read cannot answer.

     THE FIRST CLAIM IS THE ONE THE OWNER ASKED FOR BY NAME. A strip written
     across this grid once pushed the Copilot rail 172px down the window, and it
     took more than one go to correct — so the rail's own top and bottom are
     measured again WITH the divider in place, not merely asserted to be
     unchanged.
     ======================================================================== */
  await p.evaluate(() => {
    const cl = (window.negoClauseList ? negoClauseList(window.CONTRACT) : [])[0];
    if (window.rlSetReadMode) rlSetReadMode('marks');
    try{ localStorage.removeItem('hati.v1.ceLeftFrac'); }catch(_){}
    window.rlOpenClauseEditor(window.CONTRACT, cl.clauseId, {});
  });
  await pause(600);

  const box = () => p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const grid = page.querySelector('.ce-grid');
    const rail = page.querySelector('.ce-rail');
    const col  = page.querySelector('.ce-col');
    const rez  = page.querySelector('#ce-resizer');
    const pr = page.getBoundingClientRect(), rr = rail.getBoundingClientRect();
    const cr = col.getBoundingClientRect(), zr = rez ? rez.getBoundingClientRect() : null;
    const cs = rez ? getComputedStyle(rez) : null;
    return {
      hasRez: !!rez,
      pos: cs && cs.position, vis: cs && cs.visibility, cursor: cs && cs.cursor,
      rezW: zr ? Math.round(zr.width) : 0, rezH: zr ? Math.round(zr.height) : 0,
      gripW: rez && rez.firstElementChild
        ? Math.round(rez.firstElementChild.getBoundingClientRect().width) : 0,
      cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      colW: Math.round(cr.width), railW: Math.round(rr.width),
      /* THE BREAK THAT MUST NOT COME BACK. */
      railTop: Math.round(rr.top), railBottom: Math.round(rr.bottom),
      pageTop: Math.round(pr.top), pageBottom: Math.round(pr.bottom),
      railFullHeight: Math.round(rr.top) <= Math.round(pr.top) + 1
        && Math.round(rr.bottom) >= Math.round(pr.bottom) - 1,
      /* The handle straddles the seam rather than sitting beside it. */
      onSeam: zr ? Math.abs(Math.round(zr.left + zr.width / 2) - Math.round(rr.left)) <= 1 : false,
      sideways: Math.round(document.documentElement.scrollWidth)
        <= Math.round(document.documentElement.clientWidth),
      atLimit: rez ? rez.getAttribute('data-rl-at-limit') : null,
    };
  });

  const b0 = await box();
  ck('16a the divider is drawn, as real pixels with the negotiation page\'s grip',
    b0.hasRez && b0.pos === 'absolute' && b0.vis === 'visible'
      && b0.rezW > 0 && b0.rezH > 0 && b0.gripW > 0,
    `${b0.rezW}x${b0.rezH}, grip ${b0.gripW}px, ${b0.pos}/${b0.vis}`);
  ck('16b and it says it is a divider by the cursor it offers',
    b0.cursor === 'col-resize', b0.cursor);
  ck('16c THE RAIL STILL RUNS FLOOR TO CEILING — the break that must not come back',
    b0.railFullHeight, `rail ${b0.railTop}-${b0.railBottom} of page ${b0.pageTop}-${b0.pageBottom}`);
  ck('16d the handle claims NO TRACK — the grid is still two columns',
    b0.cols === 2, `${b0.cols} columns`);
  ck('16e it straddles the seam rather than sitting beside it',
    b0.onSeam, `handle centre against the rail's left edge`);
  ck('16f at rest the rail is still exactly one third',
    Math.abs(b0.railW / (b0.colW + b0.railW) - 1 / 3) < 0.02,
    `${b0.railW} of ${b0.colW + b0.railW} = ${(b0.railW / (b0.colW + b0.railW)).toFixed(3)}`);
  ck('16g and the page does not scroll sideways', b0.sideways, 'no horizontal overflow');

  /* ---- A REAL DRAG, THROUGH THE REAL INPUT PIPELINE ---- */
  const drag = async dx => {
    const rz = await p.evaluate(() => {
      const r = document.querySelector('#ce-resizer').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
    });
    await p.mouse.move(rz.x, rz.y); await p.mouse.down();
    await p.mouse.move(rz.x + dx, rz.y, { steps: 14 }); await p.mouse.up();
    await pause(400);
    return box();
  };

  const wide = await drag(-260);
  ck('16h dragging LEFT gives the room to Copilot, and the contract gives it up',
    wide.railW > b0.railW + 40 && wide.colW < b0.colW - 40,
    `rail ${b0.railW} -> ${wide.railW}, contract ${b0.colW} -> ${wide.colW}`);
  ck('16i and the rail STILL runs floor to ceiling after a drag',
    wide.railFullHeight, `rail ${wide.railTop}-${wide.railBottom}`);
  ck('16j nothing scrolls sideways at that split', wide.sideways, 'no horizontal overflow');

  const narrow = await drag(520);
  ck('16k dragging RIGHT gives it back to the contract',
    narrow.colW > wide.colW + 40, `contract ${wide.colW} -> ${narrow.colW}`);
  ck('16l and the rail never goes below its own 340px floor',
    narrow.railW >= 339, `${narrow.railW}px`);
  ck('16m at a limit the grip SAYS SO rather than just stopping',
    narrow.atLimit === 'max', `data-rl-at-limit=${narrow.atLimit}`);

  /* ---- THE LEFT-HAND LIMIT IS THE ONE THE OWNER ASKED TO BE IDENTICAL ---- */
  const hardLeft = await drag(-900);
  const frac = hardLeft.colW / (hardLeft.colW + hardLeft.railW);
  ck('16n dragged hard LEFT it stops at 45% — the negotiation page\'s own limit',
    Math.abs(frac - 0.45) < 0.02 && hardLeft.atLimit === 'min',
    `contract at ${(frac * 100).toFixed(1)}%, limit=${hardLeft.atLimit}`);
  ck('16o and the rail is still floor to ceiling at the extreme',
    hardLeft.railFullHeight, `rail ${hardLeft.railTop}-${hardLeft.railBottom}`);

  /* ---- AND IT REMEMBERS, AND A DOUBLE-CLICK PUTS IT BACK ---- */
  const stored = await p.evaluate(() => { try{ return localStorage.getItem('hati.v1.ceLeftFrac'); }
    catch(_){ return null; } });
  ck('16p the split is remembered, in its OWN key',
    stored != null && Number(stored) > 0, `hati.v1.ceLeftFrac = ${stored}`);
  const otherKey = await p.evaluate(() => { try{ return localStorage.getItem('hati.v1.rlLeftFrac'); }
    catch(_){ return null; } });
  ck('16q and the negotiation page\'s divider was not moved by any of this',
    otherKey == null, `hati.v1.rlLeftFrac = ${otherKey}`);

  await p.evaluate(() => {
    const r = document.querySelector('#ce-resizer');
    r.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
  });
  await pause(300);
  const reset = await box();
  ck('16r a double-click puts it back to one third',
    Math.abs(reset.railW / (reset.colW + reset.railW) - 1 / 3) < 0.02,
    `${(reset.railW / (reset.colW + reset.railW)).toFixed(3)}`);

  /* ---- THE KEYBOARD REACHES IT ---- */
  await p.evaluate(() => document.querySelector('#ce-resizer').focus());
  const focused = await p.evaluate(() => document.activeElement
    && document.activeElement.id === 'ce-resizer');
  await p.keyboard.press('ArrowLeft'); await pause(250);
  const keyed = await box();
  ck('16s a keyboard reaches it and the arrows move it',
    focused && keyed.railW > reset.railW,
    `focused=${focused}, rail ${reset.railW} -> ${keyed.railW}`);

  await p.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"]'); if (b) b.click(); });
  await pause(300);

  /* ==========================================================================
     17. THE CLAUSE YOU ARE TYPING IN IS STILL THE PAPER
     ==========================================================================
     Owner-reported 26 Aug 2026: the editing region "opens up to be like a
     search field", and Option A of the drawn render — no colour change, "a
     very light almost dotted line". Every claim here is a COMPUTED value or a
     geometry, because that is the only place this question can be asked: the
     rule sits in a JS-injected sheet among three thousand lines and a rule
     that loses a cascade fight looks perfectly correct in the source.

     THE CLAIMS ARE RELATIONS, not values. The fill is measured against the
     PAPER beside it (does the sheet show through) rather than against a typed
     colour, and the line is measured against the accent and against the ink,
     so the next palette or type pass costs no edit here.
     ========================================================================== */
  await p.evaluate(id => {
    if (window.rlSetReadMode) rlSetReadMode('marks');
    window.rlOpenClauseEditor(window.CONTRACT, id, {});
  }, staged.clauseId);
  await pause(600);

  const quiet = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const body = page.querySelector('#ce-clausebody');
    const sheet = page.querySelector('.ce-paperwrap .rl-paper')
      || page.querySelector('.ce-paperwrap .rl-doc');
    const cs = getComputedStyle(body), ps = getComputedStyle(sheet);
    const live = page.querySelector('.rl-clause-live');
    const bar = live ? getComputedStyle(live, '::before') : null;
    return {
      typing: body.className,
      bg: cs.backgroundColor, shadow: cs.boxShadow,
      style: cs.outlineStyle, width: cs.outlineWidth,
      colour: cs.outlineColor, offset: cs.outlineOffset,
      paperBg: ps.backgroundColor,
      accent: getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-solid').trim(),
      ink: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-doc-text').trim(),
      barBg: bar ? bar.backgroundColor : null, barW: bar ? bar.width : null,
    };
  });
  /* Chromium answers a color-mix() as `color(srgb r g b / a)` and everything
     else as `rgb()`/`rgba()`. Reading only the second reports every mixed
     colour as fully opaque, which is a check that cannot fail. */
  const alphaOf = c => {
    const m = /(?:rgba?|color)\(([^)]+)\)/.exec(c || '');
    if (!m) return 1;
    const slash = m[1].split('/');
    if (slash.length > 1) return Number(slash[1].trim());
    const parts = m[1].split(',').map(x => x.trim());
    return parts.length > 3 ? Number(parts[3]) : 1;
  };

  ck('17a the clause really is the editing region', /ce-typing/.test(quiet.typing), quiet.typing);
  ck('17b THE REPORTED CASE: no fill of its own — the PAPER shows through',
     alphaOf(quiet.bg) === 0,
     `region ${quiet.bg} over a sheet of ${quiet.paperBg}`);
  ck('17c and no ring — the other half of the search-box costume',
     quiet.shadow === 'none', quiet.shadow);
  ck('17d what is left is a DASHED HAIRLINE',
     quiet.style === 'dashed' && parseFloat(quiet.width) > 0 && parseFloat(quiet.width) <= 1.5,
     `${quiet.style} ${quiet.width}`);
  ck('17e set clear of the words, so it frames them rather than touching them',
     parseFloat(quiet.offset) > 0, quiet.offset);
  ck('17f it is FAINT — not the accent, and not opaque',
     alphaOf(quiet.colour) > 0 && alphaOf(quiet.colour) < 0.5
       && quiet.colour !== quiet.accent,
     `${quiet.colour} against an accent of ${quiet.accent}`);
  ck('17g THE MARGIN BAR IS UNTOUCHED — the one signal still at full strength',
     alphaOf(quiet.barBg) === 1 && parseFloat(quiet.barW) >= 3,
     `${quiet.barBg} at ${quiet.barW}`);

  /* ---- ONE DECLARATION, BOTH THEMES ----
     The whole reason the line is mixed off the document's own ink rather than
     typed as a grey. A fixed light grey that whispers on the cream sheet is
     invisible on the near-black one, and the dark override is the half that
     gets forgotten. So: switch the theme for real and require the line to have
     MOVED with the paper — and to still be there. */
  const night = await p.evaluate(() => {
    document.documentElement.classList.add('dark');
    const page = document.getElementById('clause-editor');
    const body = page.querySelector('#ce-clausebody');
    const sheet = page.querySelector('.ce-paperwrap .rl-paper')
      || page.querySelector('.ce-paperwrap .rl-doc');
    const cs = getComputedStyle(body);
    return { colour: cs.outlineColor, style: cs.outlineStyle,
      bg: cs.backgroundColor, paperBg: getComputedStyle(sheet).backgroundColor };
  });
  await p.evaluate(() => document.documentElement.classList.remove('dark'));
  ck('17h the line FOLLOWS THE PAPER into the dark theme, from one declaration',
     night.style === 'dashed' && night.colour !== quiet.colour
       && night.paperBg !== quiet.paperBg,
     `${quiet.colour} on ${quiet.paperBg} -> ${night.colour} on ${night.paperBg}`);
  ck('17i and it never gains a fill there either', alphaOf(night.bg) === 0, night.bg);

  /* ---- THE STRIP IS GONE AND THE CONTRACT HAS THE SPACE ---- */
  const room = await p.evaluate(() => {
    const page = document.getElementById('clause-editor');
    const left = page.querySelector('.ce-left');
    const bar = page.querySelector('#ce-readbar');
    const write = page.querySelector('#ce-bar');
    const paper = page.querySelector('.ce-paperwrap');
    const br = bar.getBoundingClientRect(), pr = paper.getBoundingClientRect();
    /* Whatever sits between the readings row and the paper, added up. */
    let between = 0;
    for (const el of left.children){
      const r = el.getBoundingClientRect();
      if (r.top >= br.bottom - 1 && r.bottom <= pr.top + 1) between += r.height;
    }
    /* AND THE SPACE THE STRIP ACTUALLY HELD, which is a different gap: it was
       a sibling of this column rather than a child of it, so a walk over the
       column's own children never saw it. Measured from the last thing in the
       page head down to the paper, the only band in there is the readings row
       and the gaps around it. */
    const facts = page.querySelector('#ce-facts');
    const fr = facts.getBoundingClientRect();
    const headToPaper = pr.top - fr.bottom;
    const chips = [...page.querySelectorAll('#ce-readbar .ce-chip')];
    const segs = page.querySelector('#ce-readbar .rl-segwrap')
      || page.querySelector('#ce-readbar .rl-readwrap');
    return {
      strip: page.querySelectorAll('#ce-ctx, .ce-ctx').length,
      strays: /On this clause|Nothing has been proposed|Something of my own/
        .test(page.textContent),
      between, gap: pr.top - br.bottom, headToPaper, barH0: br.height,
      /* Every full-width BAND standing in that space. The retired strip was
         one; the readings row and the writing bar are the only two that may
         be. Anything scrolled out of the paper's own scroller reports a rect
         up there too, so the paper's contents are excluded by ancestry rather
         than by geometry. */
      bands: [...page.querySelectorAll('*')].filter(el => {
        if (el === bar || bar.contains(el) || paper.contains(el)) return false;
        if (write && (el === write || write.contains(el))) return false;
        const r = el.getBoundingClientRect();
        return r.height > 0 && r.top >= fr.bottom - 1 && r.bottom <= pr.top + 1
          && r.width >= br.width * 0.9;
      }).map(el => `${el.tagName}.${el.className || el.id}`),
      /* The writing bar, read as a RELATION rather than as a height: it is
         drawn, it stands between the head's facts and the paper, and it lives
         inside .ce-head — which is inside the LEFT column, so it cannot push
         the Copilot rail down. */
      writeDrawn: !!write && write.getBoundingClientRect().height > 0,
      writeInHead: !!write && !!write.closest('.ce-head'),
      writeAbovePaper: !!write
        && write.getBoundingClientRect().bottom <= pr.top + 1
        && write.getBoundingClientRect().top >= fr.bottom - 1,
      chips: chips.length,
      chipText: chips.map(b => b.textContent.trim()),
      chipLeft: chips.length ? chips[0].getBoundingClientRect().left : null,
      segRight: segs ? segs.getBoundingClientRect().right : null,
      barRight: br.right,
      /* "One line" is a claim about CENTRES: these children are deliberately
         different heights (a 20px segment group beside a 26px chip), so equal
         tops would report a correctly-centred row as three lines. */
      offCentre: (() => { const mid = br.top + br.height / 2;
        return [...bar.children].filter(el => { const r = el.getBoundingClientRect();
          return r.height > 0 && Math.abs((r.top + r.height / 2) - mid) > 3; }).length; })(),
      barH: br.height,
      tallest: Math.max(...[...bar.children].map(el => el.getBoundingClientRect().height)),
    };
  });
  ck('17j THE STRIP IS GONE — not emptied, gone', room.strip === 0, `${room.strip} found`);
  ck('17k and none of its three sentences is drawn anywhere on the page',
     room.strays === false, room.strays ? 'a retired sentence is still printed' : 'none');
  ck('17l nothing stands in its place — the paper begins under the readings row',
     room.between === 0 && room.gap < 24,
     `${room.between}px of band, ${Math.round(room.gap)}px of gap`);
  /* REVERSED IN PLACE 28 Aug 2026 — the WRITING BAR joins the readings row,
     and the two are not the same kind of thing as the strip that left.

     The retired one was a NOTICE: "On this clause", the change's name and a
     sentence saying nothing had been proposed — three facts the crumb and the
     fact row twelve pixels above already carried, printed a fourth time in a
     full-width band with a rule under it. The owner asked for that space back
     and it went back.

     The bar is the CONTROL the owner then asked for, in their own words: the
     tools above the contract, all white, symmetric and balanced. A band that
     carries an act is exactly what NO NEW BANDS ON THE PAGE keeps; a band that
     restates the screen is what it removes. So the claim is unchanged in kind
     and is simply named: between the head and the paper stand the writing bar
     and the readings row and NOTHING ELSE — in particular not the notice,
     which 17j and 17k pin as an absence in its own right.

     Still a RELATION rather than a pixel budget, which is what stops this
     needing re-typing at every type pass. */
  ck('17l2 the only bands between the head and the paper are the writing bar '
     + 'and the readings row — the notice has not come back through another door',
     room.bands.length === 0 && room.writeDrawn === true
       && room.writeAbovePaper === true,
     room.bands.length ? room.bands.join(', ')
       : `bar drawn ${room.writeDrawn}, above the paper ${room.writeAbovePaper}, `
         + `nothing else in ${Math.round(room.headToPaper)}px`);
  /* THE OWNER'S ONE CONSTRAINT ON BUILDING IT, in their own words: "make sure
     you do not forget the copilot panel goes all the way to the top". A row
     placed above .ce-grid would push the rail down by its own height, which is
     what this page was corrected for repeatedly before it was built — so the
     bar's HOME is the claim, and 2d2 measures the rail itself. */
  ck('17l3 and it sits inside .ce-head — in the LEFT column, so the Copilot '
     + 'rail still runs floor to ceiling',
     room.writeInHead === true, `inside .ce-head: ${room.writeInHead}`);
  ck('17m the chip moved ONTO the readings row, named by its change',
     room.chips === 1 && /CHG-/.test(room.chipText[0] || ''), room.chipText.join(','));
  ck('17n it sits at the RIGHT of that row, in the space the row already had',
     room.chipLeft > room.segRight && room.chipLeft < room.barRight,
     `seg ends ${Math.round(room.segRight)}, chip at ${Math.round(room.chipLeft)}, row ends ${Math.round(room.barRight)}`);
  ck('17o and the row is still ONE line — the space was there, not taken',
     room.offCentre === 0 && room.barH <= room.tallest + 12,
     `${room.offCentre} off centre, row ${Math.round(room.barH)}px against a tallest child of ${Math.round(room.tallest)}px`);

  /* ---- PRESSING IT STILL WORKS, AND STILL LIGHTS ----
     The one cost of moving the chips: the row that draws them has to be
     repainted too. Pressed and read back, because a chip that acts and never
     lights is the fault this move could have shipped. */
  const chipPress = await p.evaluate(() => {
    const b = document.querySelector('#ce-readbar .ce-chip');
    if (!b) return { none: true };
    b.click();
    const after = document.querySelector('#ce-readbar .ce-chip');
    return { on: after ? after.classList.contains('is-on') : null,
      still: !!after, where: after ? !!after.closest('#ce-readbar') : null };
  });
  await pause(300);
  ck('17p pressing the chip lights it, on the row it now lives on',
     chipPress.on === true && chipPress.where === true, JSON.stringify(chipPress));

  /* ============================================================
     18. HIGHLIGHT A PASSAGE, TYPE THE REPLACEMENT, PRESS ENTER
     ============================================================
     Owner-asked, off Oneflow: "you can highlight a word or sentence and it
     opens up a window and you enter the replacement redline manually … you get
     a single strip to enter your change and click and enter button."

     DRIVEN, never inspected. Whether a strip exists is a different question
     from whether a person can highlight a sentence, retype it and see the
     redline — and only the second one matters. The selection is made with a
     real Range over the clause's own text node. */
  /* THE STRIP IS FOR THE READING, never for a caret already in the clause: a
     drag inside the typing box is somebody selecting words to bold them, which
     is why the page's own mouseup bails on it. Section 17 left typing ON, so
     the pencil is pressed once to come out of it. */
  await p.evaluate(() => {
    const pen = document.querySelector('#clause-editor [data-ce-pencil][aria-pressed="true"]')
      || document.querySelector('#clause-editor .rl-clause-live [data-ce-pencil]');
    if (pen) pen.click();
  });
  await pause(500);
  const beforeStrip = await p.evaluate(() => (window.CONTRACT.changes || []).length);
  const sel18 = await p.evaluate(() => {
    /* THE CLAUSE THIS PAGE IS ABOUT, not the longest paragraph on the paper:
       ceSelection refuses a highlight outside #ce-clausebody, and it has to —
       a passage in another clause has no line in the text this page holds.

       AND IT ASKS THE PAGE'S OWN RULE WHETHER THE HIGHLIGHT COUNTS, rather
       than assuming any forty characters will do: the paper is drawn as a
       REDLINE, so a text node can be a struck run that is not in the wording
       at all, and a slice cut mid-word can straddle two of them. The candidate
       nodes are tried in order and the first one ceSelection accepts is the
       one used — which is exactly what a person dragging over a sentence gets. */
    const box = document.getElementById('ce-clausebody');
    if (!box) return { ok: false, why: 'no live clause on the paper' };
    if (window.ceIsTyping && ceIsTyping()) return { ok: false, why: 'still typing' };
    const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = w.nextNode())){
      if (n.parentElement && n.parentElement.closest('.rl-marker, .mk')) continue;
      if (n.data.trim().length >= 24) nodes.push(n);
    }
    nodes.sort((a, b) => b.data.trim().length - a.data.trim().length);
    const s = window.getSelection();
    for (const node of nodes){
      const txt = node.data;
      const from = txt.search(/\S/);
      /* Cut on a word boundary — a slice ending mid-word is a highlight no
         person makes and no rule has to accept. */
      let to = Math.min(txt.length, from + 44);
      const sp = txt.lastIndexOf(' ', to);
      if (sp > from + 12) to = sp;
      const r = document.createRange();
      r.setStart(node, from); r.setEnd(node, to);
      s.removeAllRanges(); s.addRange(r);
      if (window.ceSelection && ceSelection()){
        document.getElementById('ce-doc')
          .dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
        return { ok: true, text: String(s.toString()) };
      }
    }
    s.removeAllRanges();
    return { ok: false, why: `no candidate the page accepts (${nodes.length} tried)` };
  });
  await pause(400);
  const strip = await p.evaluate(() => {
    const pop = document.getElementById('ce-inline');
    const ta = document.getElementById('ce-inline-ask');
    if (!pop || !ta) return { on: false };
    const r = pop.getBoundingClientRect();
    return { on: pop.classList.contains('is-on'), w: Math.round(r.width), h: Math.round(r.height),
      value: ta.value, focused: document.activeElement === ta,
      ctx: !!document.getElementById('ce-inline-q'),
      chips: [...pop.querySelectorAll('[data-ce-inline-chip]')].length,
      arrow: !!pop.querySelector('[data-ce-act="inline-go"]') };
  });
  ck('18a highlighting a sentence opens ONE strip, as visible pixels',
     sel18.ok && strip.on && strip.w > 100 && strip.h > 20,
     sel18.ok ? `${strip.w}x${strip.h}` : sel18.why);
  ck('18b the box CARRIES the highlighted wording, ready to be edited',
     !!strip.value && strip.value.trim() === (sel18.text || '').trim(),
     `"${(strip.value || '').slice(0, 46)}…"`);
  ck('18c and the caret is in it — no second press to start typing', strip.focused === true,
     strip.focused ? 'focused' : 'not focused');
  ck('18d THE CONTEXT BOX IS GONE — the words are not printed twice',
     strip.ctx === false, strip.ctx ? '#ce-inline-q still drawn' : 'no context line');
  ck('18e Copilot is still one press away, on the same strip',
     strip.chips === 3 && strip.arrow === true, `${strip.chips} chips, arrow ${strip.arrow}`);

  /* THE PRESS ITSELF: type a replacement and hit Enter for real. */
  const enterPress = await p.evaluate(async () => {
    const ta = document.getElementById('ce-inline-ask');
    ta.value = 'Payment falls due within forty-five (45) days of a valid invoice.';
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Enter', shiftKey: false, bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 500));
    const doc = document.getElementById('ce-clausebody');
    return {
      shut: !document.getElementById('ce-inline').classList.contains('is-on'),
      ins: [...doc.querySelectorAll('.nego-ins')].map(e => e.textContent).join(' '),
      del: doc.querySelectorAll('.nego-del').length,
      words: doc.textContent.replace(/\s+/g, ' '),
      filed: (window.CONTRACT.changes || []).length };
  });
  ck('18f pressing Enter puts the new wording on the paper',
     /forty-five \(45\) days/.test(enterPress.ins) || /forty-five \(45\) days/.test(enterPress.words),
     (enterPress.ins || '').slice(0, 60) || 'nothing inserted');
  ck('18g …as a REDLINE — the words it replaces are struck, not deleted',
     enterPress.del > 0, `${enterPress.del} struck runs`);
  ck('18h the strip closes behind it', enterPress.shut === true, enterPress.shut ? 'shut' : 'still open');
  /* THE ONE DOOR: a strip that FILED would be a third way onto an act that
     already has one. It applies to the draft; the rail's foot still files. */
  ck('18i AND IT FILES NOTHING — the record is untouched until the one act is pressed',
     enterPress.filed === beforeStrip, `${enterPress.filed} changes, ${beforeStrip} before`);

  /* ============================================================
     19. THE FOUR FAULTS REPORTED OFF THE SCREENSHOTS (28 Aug 2026)
     ============================================================
     "almost all of the features do not seem to be working like undo and the
     font as well and even bullet points does not give you the bullet point it
     just pushes you inwards", and the expand control that was on the approved
     render and not in the build. Every one reproduced in a browser before it
     was touched — which is why these are DRIVEN rather than read.

     AND THE READING OF "IS IT TYPEABLE" IS THE BOX'S OWN contenteditable, not
     ceIsTyping: that function is not published to window, so a probe asking
     for it reads undefined and reports false however well the page works. It
     cost an hour and it is this codebase's own recorded lesson — rule out the
     instrument before believing the finding. */
  await p.evaluate(() => { if (window.rlSetReadMode) rlSetReadMode('marks'); });
  await p.evaluate(cid => rlOpenClauseEditor(window.CONTRACT, cid, {}), staged.clauseId);
  await pause(900);
  const typeable = () => p.evaluate(() => {
    const b = document.getElementById('ce-clausebody');
    return b ? b.getAttribute('contenteditable') : null; });
  ck('19a the clause opens ready to type in — no second press to start',
     (await typeable()) === 'true', String(await typeable()));

  const bullets = await p.evaluate(async () => {
    const box = document.getElementById('ce-clausebody'); box.focus();
    const p0 = box.querySelector('p') || box;
    const r = document.createRange(); r.selectNodeContents(p0);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    document.querySelector('#ce-bar [data-rb="insertUnorderedList"]')
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 800));
    const now = document.getElementById('ce-clausebody');
    const ul = now.querySelector('ul'), li = now.querySelector('li');
    return { made: !!(ul && li), nested: !!now.querySelector('p>ul'),
      marker: ul ? getComputedStyle(ul).listStyleType : '(none)',
      pad: ul ? Math.round(parseFloat(getComputedStyle(ul).paddingLeft)) : 0,
      wide: li ? Math.round(li.getBoundingClientRect().width) : 0 };
  });
  ck('19b THE BULLET BUTTON MAKES A REAL LIST', bullets.made, JSON.stringify(bullets));
  ck('19c …and it DRAWS A BULLET — the reported fault was an indent with no marker',
     bullets.marker === 'disc' && bullets.wide > 100,
     `${bullets.marker}, item ${bullets.wide}px wide`);
  /* NOT what killed it, and said so rather than left implying it: the HTML
     parser closes the <p> that execCommand opens, so the stored body was never
     malformed. Pinned anyway, because a list that DID end up inside a paragraph
     would draw exactly the reported symptom for a second reason. */
  ck('19d …and no list is left inside a paragraph, which would break it again',
     bullets.nested === false, bullets.nested ? 'a <ul> is still inside a <p>' : 'well formed');
  const numbers = await p.evaluate(async () => {
    const box = document.getElementById('ce-clausebody'); box.focus();
    const ps = [...box.querySelectorAll('p')];
    const p0 = ps[ps.length - 1] || box;
    const r = document.createRange(); r.selectNodeContents(p0);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    document.querySelector('#ce-bar [data-rb="insertOrderedList"]')
      .dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 800));
    const ol = document.querySelector('#ce-clausebody ol');
    return { made: !!ol, marker: ol ? getComputedStyle(ol).listStyleType : '(none)' };
  });
  ck('19e and a numbered list draws its numbers',
     numbers.made && numbers.marker === 'decimal', JSON.stringify(numbers));

  const errsBefore = errs.length;
  const undone = await p.evaluate(async () => {
    const box = document.getElementById('ce-clausebody'); box.focus();
    const p0 = box.querySelector('p') || box.querySelector('li') || box;
    p0.insertAdjacentText('afterbegin', 'ZZTYPED ');
    box.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 350));
    const u = document.querySelector('#ce-bar [data-rb="undo"]');
    const wasOffered = !u.disabled;
    u.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    await new Promise(r => setTimeout(r, 600));
    const now = document.getElementById('ce-clausebody');
    return { wasOffered, gone: !/ZZTYPED/.test(now ? now.innerHTML : '') };
  });
  ck('19f UNDO IS OFFERED THE MOMENT SOMETHING IS TYPED — it was greyed out before',
     undone.wasOffered === true, undone.wasOffered ? 'live' : 'still greyed');
  ck('19g …and it undoes the typing', undone.gone === true,
     undone.gone ? 'the typing is gone' : 'the typing is still there');
  ck('19h …without throwing — the repaint used to race the blur handler',
     errs.length === errsBefore, errs.slice(errsBefore).join(' | ') || 'clean');

  const wideCtl = await p.evaluate(async () => {
    const b = document.querySelector('#ce-bar [data-ce-wide]');
    if (!b) return { there: false };
    const rail = () => Math.round(document.querySelector('.ce-rail').getBoundingClientRect().width);
    const col = () => Math.round(document.querySelector('.ce-col').getBoundingClientRect().width);
    const was = { rail: rail(), col: col() };
    b.click(); await new Promise(r => setTimeout(r, 400));
    const on = { rail: rail(), col: col(),
      pressed: document.querySelector('#ce-bar [data-ce-wide]').getAttribute('aria-pressed') };
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 400));
    return { there: true, was, on, back: { rail: rail(), col: col() },
      stillOpen: !!document.getElementById('clause-editor') };
  });
  ck('19i THE CONTRACT-ALONE CONTROL IS ON THE BAR — the render had it, the build did not',
     wideCtl.there === true, wideCtl.there ? 'drawn' : 'missing');
  ck('19j pressing it gives the whole page to the contract',
     wideCtl.there && wideCtl.on.rail === 0 && wideCtl.on.col > wideCtl.was.col && wideCtl.on.pressed === 'true',
     wideCtl.there ? `rail ${wideCtl.was.rail}→${wideCtl.on.rail}, contract ${wideCtl.was.col}→${wideCtl.on.col}` : '');
  ck('19k Escape brings Copilot back and does NOT close the page',
     wideCtl.there && wideCtl.back.rail > 100 && wideCtl.stillOpen === true,
     wideCtl.there ? `rail back to ${wideCtl.back.rail}, page open ${wideCtl.stillOpen}` : '');

  const greyed = await p.evaluate(async () => {
    const read = () => ({
      bold: document.querySelector('#ce-bar [data-rb="bold"]').disabled,
      size: document.querySelector('#ce-bar [data-rb-size-open]').disabled,
      undo: document.querySelector('#ce-bar [data-rb="undo"]').disabled,
      wide: document.querySelector('#ce-bar [data-ce-wide]').disabled,
      tip: document.querySelector('#ce-bar [data-rb="bold"]').getAttribute('title'),
      dim: getComputedStyle(document.querySelector('#ce-bar [data-rb="bold"]')).opacity });
    const live = read();
    document.querySelector('#clause-editor .rl-clause-live [data-ce-pencil]').click();
    await new Promise(r => setTimeout(r, 600));
    const off = read();
    document.querySelector('#clause-editor .rl-clause-live [data-ce-pencil]').click();
    await new Promise(r => setTimeout(r, 600));
    return { live, off, back: read() };
  });
  ck('19l with the caret in the clause every tool is live',
     greyed.live.bold === false && greyed.live.size === false, JSON.stringify(greyed.live));
  ck('19m WITH THE PENCIL OFF THEY GREY, with the reason on the hover — not a dead press',
     greyed.off.bold === true && greyed.off.size === true
       && /pencil|penna/i.test(greyed.off.tip || '') && Number(greyed.off.dim) < 0.6,
     JSON.stringify(greyed.off));
  ck('19n …but Undo and the contract-alone control still work, because they can',
     greyed.off.undo === false && greyed.off.wide === false,
     `undo off=${greyed.off.undo}, wide off=${greyed.off.wide}`);
  ck('19o and pressing the pencil again brings the tools back',
     greyed.back.bold === false, JSON.stringify(greyed.back));

  await p.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="close"]'); if (b) b.click(); });
  await pause(300);

  /* ---- 10. NO PAGE ERRORS THROUGHOUT ---- */
  ck('10 the whole journey ran with no page errors', errs.length === 0, errs.join(' | ') || 'none');

  await br.close(); srv.close();
  const bad = R.filter(x => !x).length;
  console.log(`\n${R.length - bad}/${R.length} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
