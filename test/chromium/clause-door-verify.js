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
const ROOT='/home/user/mkataba-clm';
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
  const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
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
      bg:s.backgroundColor, colour:s.color, border:s.borderTopColor,
      aboveWording: Math.round(r.bottom) <= Math.round(body.top) + 2,
      rightGap: Math.round(box.right - r.right), leftGap: Math.round(r.left - box.left),
      opacity: s.opacity, visibility: s.visibility, display: s.display };
  }, staged.clauseId);
  ck('1a the pill is on the clause, as visible pixels', !!pill && pill.w > 20 && pill.h > 10,
     pill ? `"${pill.text}" ${pill.w}x${pill.h}` : 'absent');
  ck('1b it says Edit', !!pill && pill.text === 'Edit', pill && pill.text);
  ck('1c it is GREEN — measured, not read off a rule that may be scoped elsewhere',
     !!pill && /rgb\(236, 253, 245\)/.test(pill.bg) && /rgb\(6, 95, 70\)/.test(pill.colour),
     pill && `bg ${pill.bg}, text ${pill.colour}`);
  ck('1d it is ABOVE the wording', !!pill && pill.aboveWording,
     pill && `pill bottom vs body top`);
  ck('1e it is on the RIGHT of the clause, not the left',
     !!pill && pill.rightGap < pill.leftGap, pill && `${pill.rightGap}px right / ${pill.leftGap}px left`);
  ck('1f and it is visible with NOTHING hovered — a door you cannot see is not a door',
     !!pill && pill.opacity === '1' && pill.visibility === 'visible' && pill.display !== 'none',
     pill && `opacity ${pill.opacity}, ${pill.visibility}`);

  const allPills = await p.evaluate(() => ({
    clauses: document.querySelectorAll('.redline-page #rl-doc section.rl-clause').length,
    pills: document.querySelectorAll('.redline-page #rl-doc .rl-cp-pill').length }));
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
    const scrim = document.querySelector('.redline-page #rl-cp-scrim');
    return { openClass: panel.classList.contains('is-open'),
      visible: getComputedStyle(panel).visibility === 'visible',
      w: Math.round(r.width), h: Math.round(r.height),
      onRightWall: Math.abs(Math.round(r.right - grid.right)) <= 2,
      onScreen: r.left < 1500 && r.right > 0,
      forClause: on && on.getAttribute('data-rl-cp-for'),
      heads, bodies: panel.querySelectorAll('.rl-cp-src').length,
      shown: panel.querySelectorAll('.rl-cp-src.is-on').length,
      scrimOn: !!scrim && getComputedStyle(scrim).opacity === '1' };
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
     !!open && open.heads.slice(0,3).join('|') === 'As it stands|On the table|History',
     open && open.heads.join(' · '));
  ck('2g the backdrop is up', !!open && open.scrimOn);

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
        ai:b.getAttribute('data-nego-ai-clause'), close:b.hasAttribute('data-rl-cp-close'),
        cls:b.className })),
      sheetTools: document.querySelectorAll('#rl-cp .rl-tool').length,
    };
  }, staged.clauseId);
  ck('3a "As it stands" carries real wording', said.stands.length > 40, said.stands.slice(0,60)+'…');
  ck('3b the live ask is on the table AND in the history', said.table === 1 && said.history === 1,
     `table ${said.table}, history ${said.history}`);
  ck('3c the row names the ask, where it stands and who asked',
     /CHG-/.test(said.names[0]||'') && /their ask/i.test(said.names[0]||'')
     && /from /i.test(said.names[0]||''), said.names[0]);
  ck('3d the acts are the ENGINE\'s own controls, and they close the panel behind them',
     said.acts.length === 2
     && said.acts.some(a => a.ai === staged.clauseId && a.close)
     && said.acts.some(a => a.edit === staged.clauseId && a.close),
     said.acts.map(a=>a.t).join(' / '));
  ck('3d′ and they do NOT wear the sheet\'s tool-pill class — a control that is not '
     + 'on the paper must not answer to the paper\'s selectors',
     said.sheetTools === 0 && said.acts.every(a=>/rl-cp-act/.test(a.cls)),
     said.acts.map(a=>a.cls).join(' / '));

  /* A real press on Direct edit inside the panel must open the editor on the
     clause AND shut the panel — a door that opens something behind a wall
     reads as broken. */
  await p.click(`.redline-page .rl-cp-src[data-rl-cp-for="${staged.clauseId}"] [data-nego-edit]`);
  await pause(700);
  const edited = await p.evaluate(id => ({
    editor: !!document.querySelector(`.nego-clause[data-clause="${id}"] [data-nego-editor]`),
    panelShut: !document.querySelector('.redline-page #rl-cp').classList.contains('is-open') }), staged.clauseId);
  ck('3e pressing Direct edit in the panel opens the editor on the clause', edited.editor);
  ck('3f …and shuts the panel so the editor is not behind it', edited.panelShut);
  await p.evaluate(id => {
    const b = document.querySelector(`.nego-clause[data-clause="${id}"] .nego-edit-bar button:last-child`);
    if (b) b.click();
  }, staged.clauseId);
  await pause(500);

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

  await reopen();
  await p.click('.redline-page #rl-cp-scrim', { position:{x:40,y:40} }); await pause(500);
  ck('4d the backdrop closes it', await shut());

  /* AND THE PILL IS BEHIND THE BACKDROP WHILE THE PANEL IS UP — which is what
     makes the backdrop the way out rather than a second press of the door. The
     queue behaves the same way and for the same reason. */
  await reopen();
  const covered = await p.evaluate(id => {
    const b = document.querySelector(`.nego-clause[data-clause="${id}"] .rl-cp-pill`);
    const r = b.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width/2, r.top + r.height/2);
    return top && top.id; }, staged.clauseId);
  ck('4e while it is open the backdrop covers the page, so the door is not a second way out',
     covered === 'rl-cp-scrim', covered);
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
    const pills = [...document.querySelectorAll('.rl-cp-pill')];
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
    await p.evaluate(()=>rlCpSetShown(document,null)); await pause(300);
  }

  ck('no page errors', errs.length===0, errs.join(' | ')||'clean');
  const pass=R.filter(Boolean).length;
  console.log(`\n${pass}/${R.length} checks passed`);
  await br.close(); srv.close();
  process.exit(pass===R.length?0:1);
})();
