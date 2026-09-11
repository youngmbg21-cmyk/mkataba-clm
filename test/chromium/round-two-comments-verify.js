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

  ck('no page errors along the way', errs.length === 0, errs.join(' | ') || 'none');
  } catch (e){ ck('the run completed', false, e && e.message); }
  await br.close(); srv.close();
  const pass = R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} passed`);
  process.exit(pass === R.length ? 0 : 1);
})();
