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
    return { control: page.querySelectorAll('.ce-fold, #ce-fold, [aria-expanded]').length,
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
  ck('2m it is dressed identically to the tab row\'s own door — every property',
     !!back && JSON.stringify(back.ref) === JSON.stringify(back.mine),
     back && (JSON.stringify(back.ref) === JSON.stringify(back.mine)
       ? 'identical' : `ref ${JSON.stringify(back.ref)} / mine ${JSON.stringify(back.mine)}`));
  ck('2n it sits at the RIGHT of the header, not in the crumb',
     !!back && Math.round(back.hr.right - back.br.right) < 40 && !back.crumbHasBack,
     back && `${Math.round(back.hr.right - back.br.right)}px from the right edge`);
  ck('2o and it is the ONE way out — two controls leaving the same page is the '
     + 'duplication reported on the contract room the same morning',
     !!back && back.waysOut === 1, back && `${back.waysOut}`);

  /* ---- 3. THE TWO BOXES, AND THE REDLINE BETWEEN THEM ---- */
  const boxes = await p.evaluate(() => {
    const stands = document.querySelector('#ce-stands'), prop = document.querySelector('#ce-prop');
    if (!stands || !prop) return null;
    const a = stands.getBoundingClientRect(), b = prop.getBoundingClientRect();
    return { standsText: stands.innerText.replace(/\s+/g,' ').trim().slice(0,120),
      propText: prop.innerText.replace(/\s+/g,' ').trim().slice(0,120),
      stacked: Math.round(a.bottom) <= Math.round(b.top) + 2,
      sameLeft: Math.abs(Math.round(a.left) - Math.round(b.left)) <= 2,
      ins: prop.querySelectorAll('ins, .nego-ins').length,
      del: prop.querySelectorAll('del, .nego-del').length,
      stat: (document.querySelector('#ce-stat')||{}).innerText || '' };
  });
  ck('3a the wording as it stands is ABOVE the wording being proposed',
     !!boxes && boxes.stacked && boxes.sameLeft && boxes.standsText.length > 20,
     boxes && `stacked ${boxes.stacked}`);
  ck('3b the redline DRAWS — the counterparty\'s ask is marked against what stands',
     !!boxes && (boxes.ins + boxes.del) > 0,
     boxes && `${boxes.ins} ins / ${boxes.del} del`);
  ck('3c and the counts agree with the marks',
     !!boxes && /\+\s*\d/.test(boxes.stat), boxes && boxes.stat.replace(/\s+/g,' ').trim());

  const marks = await p.evaluate(() => {
    const ins = document.querySelector('#ce-prop ins, #ce-prop .nego-ins');
    const del = document.querySelector('#ce-prop del, #ce-prop .nego-del');
    return { insColour: ins ? getComputedStyle(ins).color : null,
      delColour: del ? getComputedStyle(del).color : null,
      delLine: del ? getComputedStyle(del).textDecorationLine : null };
  });
  ck('3d the marks are COLOURED and the deletion is struck — the rule really reaches them',
     !!marks.insColour && marks.insColour !== marks.delColour
       && /line-through/.test(marks.delLine || ''),
     `ins ${marks.insColour}, del ${marks.delColour} ${marks.delLine}`);

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
    const before = document.querySelector('#ce-prop').innerText.replace(/\s+/g,' ').trim();
    ceApply('The Supplier shall bear every cost of delivery.', 'test one');
    const one = document.querySelector('#ce-prop').innerText.replace(/\s+/g,' ').trim();
    ceApply('The Supplier shall bear half of every cost of delivery.', 'test two');
    const two = document.querySelector('#ce-prop').innerText.replace(/\s+/g,' ').trim();
    ceUndo();
    const back = document.querySelector('#ce-prop').innerText.replace(/\s+/g,' ').trim();
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

  /* ---- 7. THE WHOLE JOURNEY: SAVE, SAY WHY, FILE ---- */
  const beforeN = await p.evaluate(() => (window.CONTRACT.changes||[]).length);
  await p.click('#clause-editor [data-ce-act="save"]');
  await pause(300);
  const reason = await p.evaluate(() => {
    const box = document.querySelector('#ce-reason');
    const r = box.getBoundingClientRect();
    return { shown: !box.hidden && r.height > 20,
      words: box.innerText.replace(/\s+/g,' ').trim(),
      hasSkip: !!box.querySelector('[data-ce-act="reason-skip"]'),
      hasBack: !!box.querySelector('[data-ce-act="reason-back"]') };
  });
  ck('7a Save does not file — it asks why first',
     reason.shown && /why/i.test(reason.words) || /[Vv]arför/.test(reason.words),
     reason.words.slice(0, 70));
  ck('7b with HaTi\'s own Skip and a way back to the wording',
     reason.hasSkip && reason.hasBack, 'both drawn');

  await p.fill('#ce-why', 'Delivery costs sit with the supplier under our standard terms.');
  await p.click('#clause-editor [data-ce-act="reason-file"]');
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
  ck('7d the reason travelled with it',
     /Delivery costs sit with the supplier/.test(filed.why||''), filed.why);
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
       verbs become Send and Undo, and the unsent band appear. */
    const after = [...document.querySelectorAll('#share-root .rl-card')]
      .find(c => ((c.querySelector('.rl-card-id') || {}).textContent || '') === id);
    return { none: false, id,
      verbs: after ? [...after.querySelectorAll('button')]
        .map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean) : [],
      band: !!document.querySelector('#share-root .rl-unsent') };
  });
  ck('11h and their own decide verbs still work end to end',
     !theirVerbs.none && /Send/i.test((theirVerbs.verbs || []).join(' '))
       && /Undo/i.test((theirVerbs.verbs || []).join(' ')) && theirVerbs.band,
     theirVerbs.none ? 'no accept verb on their page'
       : `${theirVerbs.id} now offers ${JSON.stringify(theirVerbs.verbs)}`);

  /* ---- 10. NO PAGE ERRORS THROUGHOUT ---- */
  ck('10 the whole journey ran with no page errors', errs.length === 0, errs.join(' | ') || 'none');

  await br.close(); srv.close();
  const bad = R.filter(x => !x).length;
  console.log(`\n${R.length - bad}/${R.length} checks passed`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
