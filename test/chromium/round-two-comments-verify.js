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
    const active = document.activeElement && document.activeElement.id;
    const lines0 = ceLines().slice();
    const s0 = ceHeldPassage();
    const ok = s0 ? ceReplacePassage(s0, s0.text.replace('sixty (60)', 'ninety (90)')) : 'no passage';
    await new Promise(r => setTimeout(r, 300));
    return { held, cut, chips, active, ok, lines0, lines1: ceLines() };
  });
  ck('D3 Edit with Copilot holds a piece in each sub-paragraph, offers the cut and the rewrite chips', d2.held === 2 && d2.cut && d2.chips.length === 3, JSON.stringify({ held: d2.held, cut: d2.cut, chips: d2.chips }));
  /* RE-POINTED (round four, 11 Sep 2026): the verb puts the caret in the ask box,
     so the live selection is let go; the held pieces are what the rail keeps. */
  ck('D4 the verb puts the caret in the ask box (round four)', d2.active === 'ce-ask', String(d2.active));
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
    const s0 = ceHeldPassage(); if (!s0) return { noSel: true, typingBefore };
    const ok = ceReplacePassage(s0, s0.text.replace(/\b(\w+)\b/, 'REPLACED'), { keepView: false });
    await new Promise(r => setTimeout(r, 300));
    return { typingBefore, ok, typingAfter: ceIsTyping(), marks: !!document.querySelector('#clause-editor .rl-clause .nego-ins, #clause-editor .rl-clause ins, #clause-editor .redline-page .nego-ins') };
  });
  ck('H4 Apply drops the clause out of typing and the marks it made are shown', h4 && h4.typingBefore && h4.ok === true && !h4.typingAfter && h4.marks, JSON.stringify(h4));
  await p.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);

  /* H5 · REVERSED (round four, the same night): the blur is gone — the sheet
     carries no rule for it, measured as a computed style. */
  const h5 = await p.evaluate(() => {
    const d = document.createElement('div'); d.id = 'panel-scrim'; d.className = 'is-blur'; document.body.appendChild(d);
    const cs = getComputedStyle(d);
    const out = { bf: cs.backdropFilter || cs.webkitBackdropFilter };
    d.remove(); return out;
  });
  ck('H5 no blur rule survives in the sheet (round four reversal)', !h5 || !/blur\(/.test(h5.bf || ''), JSON.stringify(h5));

  /* ---- I · ROUND FOUR (Young, 11 Sep 2026, late night) ---- */
  await p.evaluate(() => { document.querySelectorAll('.nego-selmenu').forEach(n => n.remove()); window.getSelection().removeAllRanges(); closeContextPanel(); const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);
  await p.evaluate(async () => { window.confirmDialog = async () => true; });

  /* I1 · a comment from a real drag: the caret lands in the note box, and the
     marker is on the paper the moment Add note is pressed. */
  await p.evaluate(() => { const c = window.CONTRACT; const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0); rlOpenClauseEditor(c, cl.clauseId, { typing: true }); });
  await pause(500);
  await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('17.') === 0);
    const sec = document.querySelector('#ce-doc .rl-clause[data-clause="' + cl.clauseId + '"]');
    const pane = sec && (sec.closest('.nego-scroll') || sec.closest('#ce-doc'));
    if (pane){ const pr0 = pane.getBoundingClientRect(), sr0 = sec.getBoundingClientRect(); pane.scrollTop += (sr0.top - pr0.top - 60); }
  });
  await pause(700);
  const i1g = await p.evaluate(() => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('17.') === 0);
    const sec = document.querySelector('#ce-doc .rl-clause[data-clause="' + cl.clauseId + '"]');
    const body = sec && sec.querySelector('p, li'); if (!body) return null;
    const w = document.createTreeWalker(body, NodeFilter.SHOW_TEXT); let tn = null;
    while ((tn = w.nextNode())) if (tn.data.trim().length > 30 && !tn.parentElement.closest('.rl-marker, button')) break;
    if (!tn) return null;
    const r = document.createRange(); r.setStart(tn, 0); r.setEnd(tn, Math.min(30, tn.data.length));
    const rr = r.getBoundingClientRect(); const r0 = document.createRange(); r0.setStart(tn, 0); r0.setEnd(tn, 1); const a0 = r0.getBoundingClientRect();
    return { id: cl.clauseId, a: [a0.left + 1, a0.top + a0.height / 2], b: [rr.right - 2, rr.bottom - 3], marks: document.querySelectorAll('#ce-doc .rl-note-mk').length };
  });
  let i1 = null;
  if (i1g){
    await p.mouse.move(i1g.a[0], i1g.a[1]); await p.mouse.down(); await p.mouse.move(i1g.b[0], i1g.b[1], { steps: 8 }); await p.mouse.up(); await pause(400);
    const cm = await p.$('.nego-selmenu [data-nego-ai="comment"]');
    if (cm) await cm.dispatchEvent('mousedown');
    await pause(400);
    i1 = await p.evaluate(async id => {
      const box = document.querySelector('#context-panel .rl-np-in');
      const focused = !!(box && document.activeElement === box);
      const pinned = !!document.querySelector('#context-panel .rl-np-pin');
      if (!box) return { focused, pinned };
      box.value = 'A comment from the paper.'; box.dispatchEvent(new Event('input', { bubbles: true }));
      const before = document.querySelectorAll('#ce-doc .rl-note-mk').length;
      document.querySelector('#context-panel [data-rl-np-send], #context-panel [data-rl-chat-send]').click();
      await new Promise(r => setTimeout(r, 60));
      const after = document.querySelectorAll('#ce-doc .rl-note-mk').length;
      const onClause = !!document.querySelector('#ce-doc .rl-clause[data-clause="' + id + '"] .rl-note-mk');
      return { focused, pinned, before, after, onClause };
    }, i1g.id);
  }
  ck('I1a Comment from a real drag pins the words and puts the caret in the note box', !!(i1 && i1.pinned && i1.focused), JSON.stringify(i1));
  ck('I1b the marker is on the paper the moment Add note is pressed (60 ms, no repaint, no refresh)', !!(i1 && i1.after === i1.before + 1 && i1.onClause), JSON.stringify(i1));

  /* I2 · a marker for an EXTERNAL note pressed while the drawer shows Internal
     lands on the note, in its own room, lit. */
  const i2 = await p.evaluate(async () => {
    closeContextPanel();
    const c = window.CONTRACT;
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('19.') === 0);
    const m = negoPostComment(c, null, 'External words on nineteen', { side: 'owner', visibility: 'shared',
      anchor: { clauseId: cl.clauseId, quote: 'entire agreement' } });
    rlRepaintNoteMarks(c, { side: 'owner' });
    rlNpSetRoom('internal');
    const key = negoNoteKey(m);
    const b = document.querySelector('#ce-doc .rl-note-mk[data-rl-note-open="' + key + '"]');
    if (!b) return { noMark: true };
    b.click();
    await new Promise(r => setTimeout(r, 300));
    const el = document.querySelector('#context-panel [data-rl-np-key="' + key + '"]');
    return { room: rlNpRoom(), shown: !!el, lit: !!(el && el.classList.contains('is-lit')), open: state.panelOpen };
  });
  ck('I2 pressing a marker lands on that note in its own room, lit', !!(i2 && i2.open && i2.room === 'external' && i2.shown && i2.lit), JSON.stringify(i2));

  /* I3 · Reply on a reply: the box opens under it; the answer joins the root. */
  const i3 = await p.evaluate(async () => {
    closeContextPanel();
    const c = window.CONTRACT;
    const ch = negoAllChanges(c).find(x => x.status === 'pending');
    const root = negoPostComment(c, ch.id, 'root of a thread', { side: 'owner' });
    const first = negoPostComment(c, ch.id, 'first answer', { side: 'owner', replyTo: negoNoteKey(root) });
    rlNpSetRoom('internal');
    openNotesPanel(c.id, ch.id, { force: true });
    await new Promise(r => setTimeout(r, 200));
    const rk = negoNoteKey(root), ak = negoNoteKey(first);
    const btn = document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + ak + '"] [data-rl-np-reply]');
    if (!btn) return { noReply: true };
    btn.click();
    await new Promise(r => setTimeout(r, 200));
    const bx = document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + ak + '"] [data-rl-np-rin]');
    if (!bx) return { noBox: true };
    const underRoot = !!document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + rk + '"] > .rl-np-rbox');
    bx.value = 'second answer';
    document.querySelector('#context-panel [data-rl-np-reply-send="' + rk + '"]').click();
    await new Promise(r => setTimeout(r, 300));
    const th = negoNoteThreads(ch.thread).find(t => negoNoteKey(t.root) === rk);
    return { underRoot, replies: th ? th.replies.length : -1, last: ch.thread[ch.thread.length - 1].replyTo === rk };
  });
  ck('I3 Reply on a reply opens the box under it and the answer joins the root, flat', !!(i3 && !i3.underRoot && i3.replies === 2 && i3.last), JSON.stringify(i3));

  /* I4 · Delete beside Done: your own note goes after one confirm, and its
     marker goes with it in the same breath. */
  const i4 = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const ch = negoAllChanges(c).find(x => x.status === 'pending');
    const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('19.') === 0);
    const m = negoPostComment(c, ch.id, 'delete me', { side: 'owner', anchor: { clauseId: cl.clauseId, quote: 'supersedes all prior' } });
    rlRepaintNoteMarks(c, { side: 'owner' });
    const before = document.querySelectorAll('#ce-doc .rl-note-mk').length;
    openNotesPanel(c.id, ch.id, { force: true });
    await new Promise(r => setTimeout(r, 200));
    const k = negoNoteKey(m);
    const btn = document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + k + '"] [data-rl-np-delete]');
    if (!btn) return { noDelete: true };
    const done = !!document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + k + '"] [data-rl-np-done]');
    btn.click();
    await new Promise(r => setTimeout(r, 300));
    const gone = !ch.thread.some(x => negoNoteKey(x) === k);
    const after = document.querySelectorAll('#ce-doc .rl-note-mk').length;
    return { done, gone, before, after, row: !!document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + k + '"]') };
  });
  ck('I4 Delete sits beside Done, removes your own note after one confirm, and the marker goes in the same breath', !!(i4 && i4.done && i4.gone && i4.after === i4.before - 1 && !i4.row), JSON.stringify(i4));

  /* I5 · Suggest deleting a whole paragraph files a deletion. */
  const i5 = await p.evaluate(async () => {
    closeContextPanel();
    const box = document.querySelector('#ce-clausebody');
    const ps = [...box.querySelectorAll('p, li')];
    if (ps.length < 2) return { fewLines: ps.length };
    const last = ps[ps.length - 1];
    const w = document.createTreeWalker(last, NodeFilter.SHOW_TEXT); const tns = []; let tn; while ((tn = w.nextNode())) tns.push(tn);
    if (!tns.length) return { noText: true };
    const r = document.createRange(); r.setStart(tns[0], 0); r.setEnd(tns[tns.length - 1], tns[tns.length - 1].data.length);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    ceAttachPassage(ceSelection(), 'edit');
    if (!ceHeldPassage()) return { notHeld: true, why: ceSelectionRead().why || null };
    const before = (window.CONTRACT.changes || []).length, n0 = ceLines().length;
    const btn = document.querySelector('#ce-scope [data-ce-act="scope-cut"]');
    if (!btn) return { noButton: true };
    btn.click();
    await new Promise(r => setTimeout(r, 900));
    const chs = window.CONTRACT.changes || [];
    const ch = chs[chs.length - 1];
    const words = tns.map(x => x.data).join('').replace(/\s+/g, ' ').trim().slice(0, 24);
    const kept = String((ch && (ch.bodyHtml || ch.html)) || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    return { before, after: chs.length, n0, words, cutFromFiling: !kept.includes(words),
      struck: document.querySelectorAll('#clause-editor .rl-clause .nego-del, #clause-editor .rl-clause del').length };
  });
  /* After the filing the box shows the clause as it STANDS with the change's
     marks on it (the editor's standing posture), so the proof is the filed
     change's own body lacking the paragraph, and the strike on the paper. */
  ck('I5 Suggest deleting on a whole paragraph strikes it out as a filed deletion', !!(i5 && i5.after === i5.before + 1 && i5.cutFromFiling && i5.struck > 0), JSON.stringify(i5));

  /* I6 · the Save control says the note comes with it. */
  const i6 = await p.evaluate(() => { const b = document.querySelector('#clause-editor [data-ce-act="save"]'); return b ? b.title : null; });
  ck('I6 Save says it files and opens the note drawer', /note|anteckning/i.test(i6 || ''), JSON.stringify(i6));
  await p.evaluate(() => { const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);

  /* ---- J · THE MORNING AFTER ROUND FOUR (Young, 12 Sep 2026: "edit with
     copilot is now missing the feature with apply", "when i click reply it
     now brings up a pop up", "the delete button is not working") ---- */

  /* J1 · a REAL menu press. The menu picks on mousedown and is gone by the
     mouse-up, which lands on the paper: the passage the rail just took must
     survive that mouse-up, and the answer must be for THE PASSAGE, with Apply. */
  await p.evaluate(() => { const c = window.CONTRACT; const cl = negoClauseList(c).find(x => (x.headingText||'').indexOf('8.2') === 0); rlOpenClauseEditor(c, cl.clauseId, { typing: true }); });
  await pause(500);
  const j1g = await p.evaluate(() => {
    const box = document.querySelector('#ce-clausebody'); if (!box) return null;
    const w = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let tn = null;
    while ((tn = w.nextNode())) if (tn.data.trim().length > 30 && !tn.parentElement.closest('.rl-marker, button')) break;
    if (!tn) return null;
    const r = document.createRange(); r.setStart(tn, 0); r.setEnd(tn, Math.min(30, tn.data.length));
    const rr = r.getBoundingClientRect(); const r0 = document.createRange(); r0.setStart(tn, 0); r0.setEnd(tn, 1); const a0 = r0.getBoundingClientRect();
    window.copilotPropose = async o => ({ advice: 'Firmer.', proposedText: 'Firmer wording for the words held.' });
    window.copilotAvailable = () => true;
    return { a: [a0.left + 1, a0.top + a0.height / 2], b: [rr.right - 2, rr.bottom - 3] };
  });
  let j1 = null;
  if (j1g){
    await p.mouse.move(j1g.a[0], j1g.a[1]); await p.mouse.down(); await p.mouse.move(j1g.b[0], j1g.b[1], { steps: 8 }); await p.mouse.up(); await pause(400);
    const eb = await p.$('.nego-selmenu [data-nego-ai="edit"]');
    const bb = eb ? await eb.boundingBox() : null;
    if (bb){
      await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
      await p.mouse.down(); await p.mouse.up();
      await pause(400);
      const held = await p.evaluate(() => ({ held: !!(window.ceHeldPassage && ceHeldPassage()), scope: !!document.querySelector('#ce-scope .ce-scope'), asking: !!document.querySelector('#ce-scope .ce-scope.is-asking'), focused: document.activeElement === document.getElementById('ce-ask') }));
      await p.keyboard.type('make it firmer'); await p.keyboard.press('Enter');
      await pause(900);
      const card = await p.evaluate(() => { const c = document.querySelector('#clause-editor .ce-card'); return { name: c ? (c.querySelector('.n span') || {}).textContent : '', apply: !!(c && c.querySelector('[data-ce-apply]')), want: i18t('ce_suggestion_passage') }; });
      j1 = { ...held, ...card };
    }
  }
  ck('J1a a real press on Edit with Copilot leaves the words on the rail, under the edit verb, with the caret in the ask box', !!(j1 && j1.held && j1.scope && !j1.asking && j1.focused), JSON.stringify(j1));
  ck('J1b …and the answer is Suggested wording FOR THE PASSAGE, with Apply', !!(j1 && j1.name === j1.want && j1.apply), JSON.stringify(j1));

  /* J2 · Reply in the external room posts with no pop-up: the room is the
     thread's own, chosen by pressing Reply under a note already in it. */
  const j2 = await p.evaluate(async () => {
    closeContextPanel();
    const c = window.CONTRACT;
    const ch = negoAllChanges(c).find(x => x.status === 'pending');
    const root = negoPostComment(c, ch.id, 'their room, our root', { side: 'owner', visibility: 'shared' });
    rlNpSetRoom('external');
    openNotesPanel(c.id, ch.id, { force: true });
    await new Promise(r => setTimeout(r, 200));
    const rk = negoNoteKey(root);
    const btn = document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + rk + '"] [data-rl-np-reply]');
    if (!btn) return { noReply: true };
    btn.click(); await new Promise(r => setTimeout(r, 200));
    const bx = document.querySelector('#context-panel [data-rl-np-rin="' + rk + '"]'); if (!bx) return { noBox: true };
    bx.value = 'Okay';
    document.querySelector('#context-panel [data-rl-np-reply-send="' + rk + '"]').click();
    await new Promise(r => setTimeout(r, 400));
    const popup = !!document.getElementById('cf-ok');
    const last = ch.thread[ch.thread.length - 1];
    return { popup, posted: !!(last && last.replyTo === rk && last.text === 'Okay' && last.visibility === 'shared') };
  });
  ck('J2 Reply in the external room simply posts the reply — no "Send this to…?" pop-up', !!(j2 && !j2.popup && j2.posted), JSON.stringify(j2));

  /* J3 · a Delete the model refuses is GREYED, with the reason on it — as
     pixels, not only as an attribute. */
  const j3 = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const ch = negoAllChanges(c).find(x => x.status === 'pending');
    const m = negoPostComment(c, ch.id, 'already with them', { side: 'owner', visibility: 'shared' });
    m.sentAt = new Date().toISOString();
    rlNpSetRoom('external');
    openNotesPanel(c.id, ch.id, { force: true });
    await new Promise(r => setTimeout(r, 200));
    const k = negoNoteKey(m);
    const b = document.querySelector('#context-panel .rl-np-note[data-rl-np-key="' + k + '"] [data-rl-np-delete]');
    if (!b) return { noDelete: true };
    const live = document.querySelector('#context-panel [data-rl-np-delete]:not([disabled])');
    return { disabled: b.disabled, why: b.title, opacity: parseFloat(getComputedStyle(b).opacity), cursor: getComputedStyle(b).cursor,
      liveOpacity: live ? parseFloat(getComputedStyle(live).opacity) : null };
  });
  ck('J3 Delete on a note that has reached the other side is greyed, says why on the hover, and a live Delete is not', !!(j3 && j3.disabled && j3.why && j3.opacity < 0.6 && j3.cursor === 'not-allowed' && (j3.liveOpacity === null || j3.liveOpacity === 1)), JSON.stringify(j3));
  await p.evaluate(() => { closeContextPanel(); const x = document.querySelector('#clause-editor [data-ce-act="close"]'); x && x.click(); });
  await pause(300);
  await p.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(200);

  ck('no page errors along the way', errs.length === 0, errs.join(' | ') || 'none');
  } catch (e){ ck('the run completed', false, e && e.message); }
  await br.close(); srv.close();
  const pass = R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} passed`);
  process.exit(pass === R.length ? 0 : 1);
})();
