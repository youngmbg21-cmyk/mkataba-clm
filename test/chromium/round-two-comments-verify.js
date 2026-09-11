/* ROUND TWO OF THE COMMENTS SYSTEM, MEASURED ON A REAL PAGE (Young, 11 Sep 2026, evening)
   ============================================================================
   Every check here is something only a rendered page can know:
     A  the marker's number sits INSIDE its disc — on the negotiation paper AND
        in the clause editor (where the font shorthand used to be thrown away);
     B  the marker pressed again takes the drawer down;
     C  the pin says Internal / External, no caption, and Add note spends it;
     D  a real drag across two sub-paragraphs in the editor gets the three
        rows; Edit with Copilot holds every piece; the replacement keeps the
        break;
     E  Ask Copilot is a question — question chips, no cut;
     F  opening the editor on an untouched clause draws no ruby bar and files
        nothing on the way out;
     G  a real drag across two paragraphs on the PAPER gets the three rows, and
        so does one released on the pencil.
   parity.html has no shell, so the drawer is stood in for exactly as
   clause-editor-verify stands it in. */
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
  const p=await br.newPage({viewport:{width:1500,height:1000}});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  try{
  await p.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`,{waitUntil:'load'});
  await p.evaluate(()=>window.READY); await pause(400);
  await p.evaluate(() => {
    window.state = window.state || {}; window.state.notesFor = null; window.state.panelOpen = false;
    const aside = document.createElement('aside'); aside.id = 'context-panel';
    aside.style.cssText='position:fixed;top:0;right:0;bottom:0;width:365px;z-index:46;background:#fff;border-left:1px solid #ddd;display:none;flex-direction:column';
    aside.innerHTML = '<div id="panel-body" class="pb-flow" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>'; document.body.appendChild(aside);
    window.notesPanelShowing = (cid, chId) => { const w = state.notesFor || {}; return !!(state.panelOpen && String(w.contractId||'') === String(cid||'') && String(w.changeId==null?'':w.changeId) === String(chId==null?'':chId)); };
    window.openNotesPanel = (cid, chId, o) => {
      const force = !!(o && o.force); const same = !force && notesPanelShowing(cid, chId);
      state.notesFor = { contractId: String(cid), changeId: chId == null ? null : String(chId) };
      state.panelOpen = !same; aside.style.display = state.panelOpen ? 'flex' : 'none';
      if (!state.panelOpen){ if (window.rlNotesPanelClosed) rlNotesPanelClosed(); return; }
      const c = window.CONTRACT; const body = document.getElementById('panel-body');
      const opts = { side: 'owner', author: 'Wanjiru Kamau' };
      const ch = (chId && window.negoChangeById) ? negoChangeById(c, chId) : null;
      if (ch) rlNotesPanelPaint(body, c, ch, opts); else rlChatPanelPaint(body, c, opts);
    };
    window.closeContextPanel = () => { state.panelOpen = false; aside.style.display = 'none'; if (window.rlNotesPanelClosed) rlNotesPanelClosed(); };
  });
  const measureMark = () => p.evaluate(() => {
    const b = document.querySelector('.rl-clause .rl-note-mk');
    if (!b) return null;
    const br = b.getBoundingClientRect();
    const r = document.createRange(); r.selectNodeContents(b);
    const gr = r.getBoundingClientRect();
    return { inside: gr.left >= br.left - .5 && gr.right <= br.right + .5 && gr.top >= br.top - .5 && gr.bottom <= br.bottom + .5,
      box: [Math.round(br.width), Math.round(br.height)], glyph: [Math.round(gr.width), Math.round(gr.height)], lh: getComputedStyle(b).lineHeight };
  });

  /* ---- A · the marker's glyph, both canvases ---- */
  await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('15.') === 0);
    negoPostComment(c, null, 'Which regulations apply here?', { side:'owner', author:'Wanjiru Kamau',
      anchor: { clauseId: cl.clauseId, quote: 'Data Protection Act, 2019' } });
    renderRedline();
  });
  await pause(250);
  const mkPaper = await measureMark();
  ck('A1 on the negotiation paper the number sits inside the disc', mkPaper && mkPaper.inside, JSON.stringify(mkPaper));
  await p.evaluate(() => { const c = window.CONTRACT; const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('15.') === 0); rlOpenClauseEditor(c, cl.clauseId, {}); });
  await pause(500);
  const mkEd = await p.evaluate(() => {
    const b = document.querySelector('#clause-editor .rl-clause .rl-note-mk');
    if (!b) return null;
    const br = b.getBoundingClientRect(); const r = document.createRange(); r.selectNodeContents(b); const gr = r.getBoundingClientRect();
    return { inside: gr.left >= br.left - .5 && gr.right <= br.right + .5 && gr.top >= br.top - .5 && gr.bottom <= br.bottom + .5,
      box: [Math.round(br.width), Math.round(br.height)], glyph: [Math.round(gr.width), Math.round(gr.height)], lh: getComputedStyle(b).lineHeight, fs: getComputedStyle(b).fontSize };
  });
  ck('A2 in the clause editor too — the size and line that fit the disc, not the paper’s', mkEd && mkEd.inside && mkEd.fs === '10px', JSON.stringify(mkEd));
  await p.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(400);

  /* ---- B · the marker toggles ---- */
  const tog = await p.evaluate(async () => {
    const mk = () => document.querySelector('.redline-page .rl-note-mk');
    const open = () => !!window.state.panelOpen;
    const out = [];
    for (let i = 0; i < 3; i++){ mk().click(); await new Promise(r => setTimeout(r, 200)); out.push(open()); }
    return out;
  });
  ck('B1 the marker opens the drawer, closes it on the second press, opens it on the third', JSON.stringify(tog) === '[true,false,true]', JSON.stringify(tog));

  /* ---- C · the pin ---- */
  const pin = await p.evaluate(async () => {
    closeContextPanel();
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('17.') === 0);
    rlNoteFromSelection(c, { clauseId: cl.clauseId, quote: 'Neither party may assign this Agreement\nwithout the prior written consent' }, { side: 'owner' });
    await new Promise(r => setTimeout(r, 200));
    const pinEl = document.querySelector('#context-panel .rl-np-pin');
    if (!pinEl) return null;
    const labels = [...pinEl.querySelectorAll('[data-rl-np-pin-room]')].map(b => b.textContent.trim());
    const lead = (pinEl.querySelector('.lead') || {}).textContent || '';
    const q = pinEl.querySelector('q');
    const qRect = q ? q.getBoundingClientRect() : null;
    const lineH = q ? parseFloat(getComputedStyle(q).lineHeight) : 0;
    const box = document.querySelector('#context-panel .rl-np-in'); box.value = 'Assignment: fine for us.'; box.dispatchEvent(new Event('input', { bubbles: true }));
    const before = (c.thread||[]).length;
    document.querySelector('#context-panel [data-rl-np-send], #context-panel [data-rl-chat-send]').click();
    await new Promise(r => setTimeout(r, 400));
    return { labels, lead: lead.trim(), twoLines: qRect ? qRect.height >= lineH * 1.8 : false, pinAfter: !!document.querySelector('#context-panel .rl-np-pin'), posted: (c.thread||[]).length - before,
      quote: ((c.thread||[]).slice(-1)[0] || {}).anchor && (c.thread||[]).slice(-1)[0].anchor.quote };
  });
  ck('C1 the pin says Internal / External, the tabs’ own words', pin && JSON.stringify(pin.labels) === JSON.stringify(['Internal', 'External']), pin && JSON.stringify(pin.labels));
  ck('C2 and carries no "Comment on these words" caption', pin && pin.lead === '', pin && JSON.stringify(pin.lead));
  ck('C3 a two-paragraph quote is printed on two lines', pin && pin.twoLines, pin && JSON.stringify(pin.twoLines));
  ck('C4 Add note posts the note on those words and the pin is gone', pin && pin.posted === 1 && !pin.pinAfter && /\n/.test(pin.quote || ''), JSON.stringify(pin));
  await p.evaluate(() => closeContextPanel());

  /* ---- D · the editor: a real drag across two list items ---- */
  await p.evaluate(() => { const c = window.CONTRACT; const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0); rlOpenClauseEditor(c, cl.clauseId, { typing: true }); });
  await pause(500);
  const boxes = await p.evaluate(() => {
    const box = document.querySelector('#ce-clausebody');
    const ps = box.querySelectorAll('p, li');
    const a = ps[0].getBoundingClientRect(), b = ps[ps.length-1].getBoundingClientRect();
    return { n: ps.length, a: [a.left+8, a.top+a.height/2], b: [b.left+Math.min(b.width-20, 300), b.top+b.height/2] };
  });
  await p.mouse.move(boxes.a[0], boxes.a[1]); await p.mouse.down(); await p.mouse.move(boxes.b[0], boxes.b[1], { steps: 8 }); await p.mouse.up(); await pause(400);
  const d1 = await p.evaluate(() => {
    const menu = document.querySelector('.nego-selmenu');
    const read = ceSelectionRead();
    return { rows: menu ? [...menu.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai')) : [], multi: !!(read.sel && read.sel.multi), why: read.why || null };
  });
  ck('D1 a drag across two sub-paragraphs gets the three rows', JSON.stringify(d1.rows) === JSON.stringify(['ask', 'edit', 'comment']), JSON.stringify(d1));
  ck('D2 and the reading carries it as one passage', d1.multi, JSON.stringify(d1));
  const edit = await p.$('.nego-selmenu [data-nego-ai="edit"]');
  if (edit) await edit.dispatchEvent('mousedown');
  await pause(300);
  const d2 = await p.evaluate(async () => {
    const held = document.querySelectorAll('#ce-clausebody .ce-held').length;
    const cut = !!document.querySelector('#ce-scope .ce-scope .cut');
    const chips = [...document.querySelectorAll('#ce-chips button')].map(b => b.textContent);
    const sel = window.getSelection(); const selected = !!(sel && !sel.isCollapsed && String(sel.toString()).length > 20);
    const lines0 = ceLines().slice();
    const s0 = ceSelection();
    const ok = s0 ? ceReplacePassage(s0, s0.text.replace('sixty (60)', 'ninety (90)')) : 'no passage';
    await new Promise(r => setTimeout(r, 300));
    return { held, cut, chips, selected, ok, lines0, lines1: ceLines() };
  });
  ck('D3 Edit with Copilot holds a piece in each sub-paragraph, offers the cut and the rewrite chips', d2.held === 2 && d2.cut && d2.chips.length === 3, JSON.stringify({ held: d2.held, cut: d2.cut, chips: d2.chips }));
  ck('D4 the browser’s selection survives the mark', d2.selected, String(d2.selected));
  ck('D5 the one replacement splices the run and keeps the break: two lines in, two lines out', d2.ok === true && d2.lines1.length === d2.lines0.length && /ninety \(90\)/.test(d2.lines1[0]) && d2.lines1[1] === d2.lines0[1],
     JSON.stringify(d2.lines1));

  /* ---- E · Ask is a question ---- */
  const e1 = await p.evaluate(() => {
    ceDetachPassage();
    const ok = ceAttachWords('Termination shall not affect fees', 'ask');
    return { ok, asking: !!document.querySelector('#ce-scope .ce-scope.is-asking'), cut: !!document.querySelector('#ce-scope .ce-scope .cut'),
      chips: [...document.querySelectorAll('#ce-chips button')].map(b => b.textContent), ph: document.querySelector('#ce-ask').placeholder,
      apply: !!document.querySelector('#ce-lane [data-ce-apply]') };
  });
  ck('E1 Ask Copilot holds the words under the question verb: question chips, no cut, the box says so', e1.ok && e1.asking && !e1.cut && e1.chips.length === 3 && /ask about|fråga om/i.test(e1.ph) && !e1.apply, JSON.stringify(e1));
  await p.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(400);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(300);

  /* ---- F · no ruby bar on a clause you only opened ---- */
  const f1 = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('19.') === 0);
    const before = (c.changes||[]).length;
    rlOpenClauseEditor(c, cl.clauseId, { typing: true });
    await new Promise(r => setTimeout(r, 400));
    const box = document.querySelector('#ce-clausebody'); box.focus(); await new Promise(r => setTimeout(r, 80)); box.blur(); await new Promise(r => setTimeout(r, 80));
    const inEditor = !!document.querySelector('#clause-editor .rl-clause.is-changed[data-clause="' + cl.clauseId + '"]');
    const bar = (() => { const s = document.querySelector('#clause-editor .rl-clause[data-clause="' + cl.clauseId + '"]'); if (!s) return null; const cs = getComputedStyle(s, '::after'); return cs.width; })();
    const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click();
    await new Promise(r => setTimeout(r, 400));
    const b = document.getElementById('cf-ok'); if (b){ b.click(); await new Promise(r => setTimeout(r, 300)); }
    const after = (c.changes||[]).length;
    const sec = document.querySelector('.redline-page .rl-clause[data-clause="' + cl.clauseId + '"]');
    return { inEditor, bar, filed: after - before, afterOnPaper: !!(sec && sec.classList.contains('is-changed')) };
  });
  ck('F1 the clause you only opened draws no ruby bar in the editor', !f1.inEditor && f1.bar !== '3px', JSON.stringify(f1));
  ck('F2 and leaving files nothing and marks nothing on the paper', f1.filed === 0 && !f1.afterOnPaper, JSON.stringify(f1));

  /* ---- G · the paper: two paragraphs, and a release on the pencil ---- */
  const g0 = await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0);
    const sec = document.querySelector('.redline-page .rl-clause[data-clause="' + cl.clauseId + '"]');
    sec.scrollIntoView({ block: 'center' });
    const lis = sec.querySelectorAll('li');
    const a = lis[0].getBoundingClientRect(), b = lis[lis.length-1].getBoundingClientRect();
    /* The NEXT clause's heading row — where a drag that overshoots the last
       line is released, on or beside that clause's pencil. */
    let next = sec.nextElementSibling; while (next && !next.matches('[data-clause]')) next = next.nextElementSibling;
    const top = next ? next.querySelector('.rl-clause-top') : null;
    const pr = top ? top.getBoundingClientRect() : null;
    return { a: [a.left+6, a.top+a.height/2], b: [b.right-60, b.top+b.height/2], pen: pr ? [pr.left+30, pr.top+pr.height/2] : null };
  });
  await p.mouse.move(g0.a[0], g0.a[1]); await p.mouse.down(); await p.mouse.move(g0.b[0], g0.b[1], { steps: 8 }); await p.mouse.up(); await pause(400);
  const g1 = await p.evaluate(() => { const m = document.querySelector('.nego-selmenu'); return m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai')) : []; });
  ck('G1 on the paper a drag across two paragraphs inside one clause gets the three rows', JSON.stringify(g1) === JSON.stringify(['ask', 'edit', 'comment']), JSON.stringify(g1));
  await p.evaluate(() => { document.querySelectorAll('.nego-selmenu').forEach(n => n.remove()); window.getSelection().removeAllRanges(); });
  if (g0.pen){
    /* THE OVERSHOOT, BUILT AS A RANGE: from the first item's words into the
       next clause's heading text, then the page's own mouse-up handler fired
       on the heading — the reading the real gesture arrives at. (A second
       real drag here collided with the page's own click on the heading.) */
    const g2 = await p.evaluate(async () => {
      document.querySelectorAll('.nego-selmenu').forEach(n => n.remove());
      const c = window.CONTRACT;
      const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0);
      const sec = document.querySelector('.redline-page .rl-clause[data-clause="' + cl.clauseId + '"]');
      let next = sec.nextElementSibling; while (next && !next.matches('[data-clause]')) next = next.nextElementSibling;
      const h = next.querySelector('.rl-clause-top h4, .rl-clause-top');
      const t0 = sec.querySelector('li').firstChild;
      const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); const t1 = walker.nextNode();
      const r = document.createRange(); r.setStart(t0, 3); r.setEnd(t1, Math.min(6, t1.data.length));
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      h.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: 10, clientY: 10 }));
      await new Promise(x => setTimeout(x, 300));
      const m = document.querySelector('.nego-selmenu');
      const pane = document.querySelector('.redline-page .nego-doc');
      const pas = negoReadPassage(r, pane);
      return { rows: m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai')) : [],
        clauses: pas.clauseIds.length, spill: pas.parts[1] ? pas.parts[1].text.slice(0, 30) : null,
        quote: m ? (m.querySelector('.nego-selquote') || {}).textContent : null };
    });
    ck('G2 a selection that OVERSHOOTS into the next clause’s heading is read as one clause and offered, the heading left out',
       JSON.stringify(g2.rows) === JSON.stringify(['ask', 'edit', 'comment']) && !/Governing|Law/.test(g2.quote || ''), JSON.stringify(g2));
  } else ck('G2 the next clause’s heading row was found', false, 'none');

  /* ---- H · ROUND THREE (Young, 11 Sep 2026, late) ---- */
  await p.evaluate(() => { document.querySelectorAll('.nego-selmenu').forEach(n => n.remove()); window.getSelection().removeAllRanges(); const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);
  /* H1 · two equal halves, measured with Internal lit and then External lit. */
  const h1 = await p.evaluate(async () => {
    closeContextPanel();
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('17.') === 0);
    rlNoteFromSelection(c, { clauseId: cl.clauseId, quote: 'Neither party may assign this Agreement' }, { side: 'owner' });
    await new Promise(r => setTimeout(r, 200));
    const read = () => [...document.querySelectorAll('#context-panel .rl-np-pin [data-rl-np-pin-room]')].map(b => { const r = b.getBoundingClientRect(); return { w: Math.round(r.width * 10) / 10, on: b.getAttribute('aria-pressed') === 'true', room: b.getAttribute('data-rl-np-pin-room') }; });
    const a = read();
    const ext = document.querySelector('#context-panel .rl-np-pin [data-rl-np-pin-room="external"]'); ext && ext.click();
    await new Promise(r => setTimeout(r, 200));
    const b = read();
    return { a, b };
  });
  const eq = xs => xs.length === 2 && Math.abs(xs[0].w - xs[1].w) <= 1;
  ck('H1 Internal and External are two equal halves, whichever is lit', h1 && eq(h1.a) && eq(h1.b) && h1.a[0].on && h1.b[1].on, JSON.stringify(h1));
  await p.evaluate(() => closeContextPanel());

  /* H2 · the FILED pin quotes the change and carries no lead line — the
     highlight pin's shape, one builder. */
  const h2 = await p.evaluate(async () => {
    const c = window.CONTRACT;
    let ch = (negoAllChanges(c) || []).find(x => x.status === 'pending' && x.type !== 'deleteClause');
    if (!ch){
      const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('17.') === 0);
      ch = await negoEditClause(c, cl.clauseId, '<p>Neither party may assign this Agreement without the prior written consent of the other party, such consent not to be unreasonably withheld.</p>', { side: 'owner' });
    }
    if (!ch) return { pin: false, why: 'no change to pin to' };
    openChangeNoteDialog(c, ch, { filed: true, side: 'owner' });
    await new Promise(r => setTimeout(r, 250));
    const pin = document.querySelector('#context-panel .rl-np-pin');
    if (!pin) return { pin: false };
    const q = pin.querySelector('q');
    const rows = [...pin.querySelectorAll('[data-rl-np-pin-room]')].map(b => b.getAttribute('data-rl-np-pin-room'));
    const out = { pin: true, ref: (pin.querySelector('.ref') || {}).textContent, lead: !!pin.querySelector('.lead'),
      quote: q ? q.textContent.trim().slice(0, 60) : null, qPainted: !!(q && q.getBoundingClientRect().height > 0),
      skip: (pin.querySelector('[data-rl-np-unpin]') || {}).textContent, rows };
    pin.querySelector('[data-rl-np-unpin]').click();
    await new Promise(r => setTimeout(r, 150));
    out.gone = !document.querySelector('#context-panel .rl-np-pin');
    return out;
  });
  ck('H2 the filed pin is reference · the change’s own wording · the switch, with no "filed · add a note" line, and Skip is the way out',
     h2 && h2.pin && /CHG-/.test(h2.ref || '') && !h2.lead && h2.qPainted && (h2.quote || '').length > 3 && /skip/i.test(h2.skip || '') && h2.rows.length === 2 && h2.gone, JSON.stringify(h2));
  await p.evaluate(() => closeContextPanel());

  /* H3 · the editor's paper offers on ANOTHER clause — a real drag from the
     clause's heading into its body, while the page is open on 8.2. */
  await p.evaluate(() => { const c = window.CONTRACT; const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0); rlOpenClauseEditor(c, cl.clauseId, { typing: true }); });
  await pause(500);
  /* The paper scrolls inside its own pane under the editor's foot bar, and
     `.nego-scroll` GLIDES (a bare assignment animates): scroll first, wait,
     then measure — and check the press really lands on the clause. */
  await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('19.') === 0);
    const sec = document.querySelector('#ce-doc .rl-clause[data-clause="' + cl.clauseId + '"]');
    const pane = sec && (sec.closest('.nego-scroll') || sec.closest('#ce-doc'));
    if (pane){ const pr0 = pane.getBoundingClientRect(), sr0 = sec.getBoundingClientRect(); pane.scrollTop += (sr0.top - pr0.top - 60); }
  });
  await pause(700);
  const h3g = await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('19.') === 0);
    const sec = document.querySelector('#ce-doc .rl-clause[data-clause="' + cl.clauseId + '"]');
    if (!sec) return null;
    const h = sec.querySelector('.rl-clause-top h4, .rl-clause-top');
    const body = sec.querySelector('p, li');
    if (!h || !body) return null;
    const hr = h.getBoundingClientRect();
    const r = document.createRange(); r.setStart(body.firstChild, 0); r.setEnd(body.firstChild, Math.min(40, body.firstChild.data.length));
    const rr = r.getBoundingClientRect();
    const a = [hr.left + 4, hr.top + hr.height / 2], b = [rr.right - 4, rr.bottom - 4];
    const hitA = document.elementFromPoint(a[0], a[1]), hitB = document.elementFromPoint(b[0], b[1]);
    return { id: cl.clauseId, a, b, head: h.textContent.trim().slice(0, 30), lands: !!(hitA && sec.contains(hitA) && hitB && sec.contains(hitB)) };
  });
  if (h3g){
    await p.mouse.move(h3g.a[0], h3g.a[1]); await p.mouse.down(); await p.mouse.move(h3g.b[0], h3g.b[1], { steps: 10 }); await p.mouse.up(); await pause(400);
    const h3 = await p.evaluate(() => {
      const m = document.querySelector('.nego-selmenu');
      return { rows: m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai')) : [],
        quote: m ? ((m.querySelector('.nego-selquote') || {}).textContent || '') : '', here: clauseEditorClauseId() };
    });
    ck('H3a in the editor a real drag over another clause, heading included, offers the three rows', h3g.lands && JSON.stringify(h3.rows) === JSON.stringify(['ask', 'edit', 'comment']), JSON.stringify({ ...h3, lands: h3g.lands }));
    ck('H3b and the heading is left out of the words offered', h3.quote && !h3.quote.includes(h3g.head.slice(0, 12)), JSON.stringify({ quote: h3.quote.slice(0, 60), head: h3g.head }));
    const editBtn = await p.$('.nego-selmenu [data-nego-ai="edit"]');
    if (editBtn) await editBtn.dispatchEvent('mousedown');
    await pause(500);
    const h3c = await p.evaluate(() => ({ here: clauseEditorClauseId(), cut: !!document.querySelector('#ce-scope .ce-scope .cut'), held: document.querySelectorAll('#ce-clausebody .ce-held').length }));
    ck('H3c Edit with Copilot moves the page to THAT clause with the words in hand', h3c.here === h3g.id && h3c.cut && h3c.held >= 1, JSON.stringify(h3c));
  } else { ck('H3a the other clause was found on the editor’s paper', false, 'none'); }

  /* H4 · Apply on a Copilot card ends typing: the card's press goes through
     ceReplacePassage with keepView:false (f245 pins the site); measured here
     as the effect of that call — typing off, marks shown. */
  const h4 = await p.evaluate(async () => {
    const box = document.querySelector('#ce-clausebody'); if (!box) return null;
    const typingBefore = ceIsTyping();
    const s0 = ceSelection(); if (!s0) return { noSel: true, typingBefore };
    const ok = ceReplacePassage(s0, s0.text.replace(/\b(\w+)\b/, 'REPLACED'), { keepView: false });
    await new Promise(r => setTimeout(r, 300));
    return { typingBefore, ok, typingAfter: ceIsTyping(), marks: !!document.querySelector('#clause-editor .rl-clause .nego-ins, #clause-editor .rl-clause ins, #clause-editor .redline-page .nego-ins') };
  });
  ck('H4 Apply drops the clause out of typing and the marks it made are shown', h4 && h4.typingBefore && h4.ok === true && !h4.typingAfter && h4.marks, JSON.stringify(h4));
  await p.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);

  /* H5 · the blur is a SLIGHT one with no shade — measured as the sheet's own
     computed rule (the harness has no app.js, so the shell's door is a source
     claim in f304). */
  const h5 = await p.evaluate(() => {
    const d = document.createElement('div'); d.id = 'panel-scrim'; d.className = 'is-blur'; document.body.appendChild(d);
    const cs = getComputedStyle(d);
    const out = { bg: cs.backgroundColor, bf: cs.backdropFilter || cs.webkitBackdropFilter };
    d.remove(); return out;
  });
  const blurPx = h5 && /blur\((\d+(?:\.\d+)?)px\)/.exec(h5.bf || '');
  ck('H5 the negotiation page’s scrim is a slight blur (under 3px) and transparent', blurPx && Number(blurPx[1]) > 0 && Number(blurPx[1]) < 3 && /rgba\(0, 0, 0, 0\)|transparent/.test(h5.bg), JSON.stringify(h5));

  ck('no page errors along the way', errs.length === 0, errs.join(' | ') || 'none');
  } catch (e){ ck('the run completed', false, e && e.message); }
  await br.close(); srv.close();
  const pass = R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} passed`);
  process.exit(pass === R.length ? 0 : 1);
})();
