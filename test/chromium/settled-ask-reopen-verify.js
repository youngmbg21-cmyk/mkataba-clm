/* Chromium verification: MK-311's three reports, driven with real presses.
   ============================================================
   Owner-reported 15 Aug 2026, three things in one message with three
   screenshots. The rules live in f208 (sections 6 and 7) and f207; this file
   exists for the parts jsdom cannot answer.

   WHAT IS MEASURED HERE AND NOWHERE ELSE:
     · the Reopen in the ask-tag reveal as VISIBLE PIXELS with a real size, and
       a real click on it actually reopening the change. It is painted into the
       document on a repaint and wired by the mount's own scan — a button that
       renders but is never wired looks identical in a string assertion, and
       this project has shipped exactly that fault more than once.
     · the whole loop the owner was stuck in, end to end: the guard refuses,
       the tag opens, Reopen is pressed, the rival goes through.
     · that the counterparty's seat, mounted from a real share payload, draws
       the reveal and never the reopen.

   THE FIXTURE IS THE PARITY HARNESS's own contract, with the reported state
   staged through the product's own funnel — an ask of theirs adopted by us,
   then a second ask of theirs measured against the same baseline. Two rivals,
   one already adopted, which is the state the report was made in. */
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
  const br=await chromium.launch({executablePath:EXEC,args:['--no-sandbox']});
  const p=await br.newPage({viewport:{width:1500,height:1000},deviceScaleFactor:2});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(`http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`,{waitUntil:'load'});
  await p.evaluate(()=>window.READY); await pause(500);

  /* Stage the reported state on the harness contract: THEIR ask deleting a
     sentence, adopted by us; then ANOTHER of their asks on the same clause,
     measured against the same baseline — two rivals, one already adopted. */
  const staged = await p.evaluate(async () => {
    const c = window.CONTRACT;
    const cl = negoClauseList(c)[1];
    const BASE = cl.text;
    const cut  = BASE.replace(/\s*[^.]*\.$/, '.');          // drop the last sentence
    const a = await negoEditClause(c, cl.clauseId, '<p>'+cut+'</p>',
      { side:'counterparty', author:'Henry M.', summary:'drop the last sentence' });
    await negoResolve(c, a.id, 'accepted', { by:'Wanjiru Kamau' });
    const b = await negoFileChange(c, { clauseId: cl.clauseId, changeType:'modify',
      side:'counterparty', author:'Henry M.', oldText: BASE,
      newText: BASE.replace(/\.\s*$/, ', in each case at its own cost.'),
      summary:'add a cost allocation' });
    renderRedline();
    return { clauseId: cl.clauseId, a:a.id, b:b&&b.id, base:BASE, cut };
  });
  await pause(500);
  ck('the state staged — one adopted, one pending rival',!!(staged.a&&staged.b),
     staged.a+' adopted, '+staged.b+' pending');

  const clauseText = () => p.evaluate(id => {
    const s=document.querySelector(`.redline-page .nego-clause[data-clause="${id}"]`);
    return s ? s.querySelector('.nego-body').innerText.replace(/\s+/g,' ').trim() : null;
  }, staged.clauseId);

  /* ---- IMAGE 3 ---- */
  const shown = await clauseText();
  const dropped = staged.base.slice(staged.cut.length).trim();
  ck('IMAGE 3 — the paper shows the ADOPTED wording',
     !!shown && !shown.includes(dropped.slice(0,30)),
     'dropped sentence still on the paper? '+(shown&&shown.includes(dropped.slice(0,30))?'YES':'no'));
  /* REVERSED IN PLACE, 16 Aug 2026 — the ask tags have come off the paper
     (owner-asked: "remove the pills from the contracts"). The clause panel names
     every ask now; the paper says at a glance that a clause has been argued over
     with a red rule down its right edge. */
  ck('and the clause is marked as argued over, with both asks named in its panel',
     await p.evaluate(id=>{
       const marked=!!document.querySelector(`.nego-clause[data-clause="${id}"].is-changed`);
       const src=document.querySelector(`#rl-cp .rl-cp-src[data-rl-cp-for="${id}"]`);
       const n=src?src.querySelectorAll('.rl-cp-row').length:0;
       return marked && n===2;},staged.clauseId));

  /* ---- IMAGE 2 ---- */
  const inColumn = await p.evaluate(a=>!!document.querySelector(`[data-nego-card="${a}"]`),staged.a);
  ck('the adopted change has no card — which is why "reopen it first" was unreachable',!inColumn);

  /* RE-POINTED 29 Aug 2026, claim unchanged. On OUR seat the clause's pencil
     opens the clause EDITOR now (owner-ruled), so pressing it here would cover
     the panel this section is about with a full-window page. The panel is
     opened by its own act — the same door the pencil pressed when this was
     written — and what is asserted below is what the PANEL offers, which is
     what the owner's report was about. */
  await p.evaluate(id => window.rlCpSetShown(document, id), staged.clauseId);
  await pause(600);
  ck('the clause\'s panel opens on it',
     await p.evaluate(id=>!!document.querySelector(
       `#rl-cp .rl-cp-src.is-on[data-rl-cp-for="${id}"]`),staged.clauseId));
  const btn = await p.evaluate(a=>{
    const el=document.querySelector(`#rl-cp [data-rl-cp-change="${a}"] [data-nego-undo]`);
    if(!el) return null; const r=el.getBoundingClientRect();
    return {t:el.textContent.trim(),w:Math.round(r.width),h:Math.round(r.height)};},staged.a);
  ck('IMAGE 2 — and the panel offers a REACHABLE Reopen, as visible pixels',
     !!btn&&btn.w>20&&btn.h>10,btn?`"${btn.t}" ${btn.w}x${btn.h}`:'absent');

  await p.click(`#rl-cp [data-rl-cp-change="${staged.a}"] [data-nego-undo]`);
  await pause(600);
  ck('pressing it really reopens the change',
     await p.evaluate(a=>negoChangeById(window.CONTRACT,a).status,staged.a)==='pending',
     await p.evaluate(a=>negoChangeById(window.CONTRACT,a).status,staged.a));
  ck('and the clause goes back to the wording it had before',
     (await clauseText()||'').includes(dropped.slice(0,25)));

  /* now the guard lets the other one through — the loop the owner was stuck in */
  const accepted = await p.evaluate(async b=>{
    await negoResolve(window.CONTRACT,b,'accepted',{by:'Wanjiru Kamau'});
    renderRedline();
    return negoChangeById(window.CONTRACT,b).status;},staged.b);
  await pause(400);
  ck('THE LOOP CLOSES — the second ask can now be accepted',accepted==='accepted',accepted);

  /* ---- IMAGE 1 ---- */
  ck('IMAGE 1 — no "Counters #…" line anywhere on the cards',
     await p.evaluate(()=>!/Counters #/.test(document.body.innerText)));

  /* the counterparty must not be handed our reopen */
  await p.evaluate(()=>window.SHOW_COUNTERPARTY()); await pause(700);
  const cpTag = await p.evaluate(()=>{
    const t=document.querySelector('#rl-doc .nego-clause.is-changed .rl-cp-pill')
      || document.querySelector('.rl-cp-pill');
    if(!t) return 'no pill'; t.click();
    return t.getAttribute('data-rl-cp-open');});
  await pause(700);
  const cpSeen = await p.evaluate(()=>({
    open: !!document.querySelector('#rl-cp .rl-cp-src.is-on'),
    rows: document.querySelectorAll('#rl-cp .rl-cp-src.is-on .rl-cp-row').length,
    anyReopen: document.querySelectorAll('#rl-cp [data-nego-undo]').length }));
  /* The claim is about the REOPEN, and it is asserted over their whole page
     rather than one opened body: their copy must not carry it anywhere, opened
     or not. That the panel opens at all on their seat is measured in
     clause-door-verify (6b/6c), against a mount built for it. */
  ck('their seat carries the panel and NEVER our reopen',
     !!cpTag && cpSeen.anyReopen === 0
     && await p.evaluate(()=>document.querySelectorAll('#rl-cp .rl-cp-src').length > 0),
     JSON.stringify(cpSeen) + ' on ' + cpTag);

  ck('no page errors in the whole run',errs.length===0,errs.join(' ; ')||'clean');
  await p.evaluate(()=>window.SHOW_OWNER()); await pause(400);
  await p.screenshot({path:'/tmp/claude-0/-home-user-mkataba-clm/a47eb1ce-f56b-5887-8467-21854b02f6d1/scratchpad/shots/mk311.png'});
  await p.close(); await br.close(); srv.close();
  console.log('\n'+R.filter(Boolean).length+'/'+R.length+' passed');
  if(R.some(x=>!x))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
