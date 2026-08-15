/* The whole reported loop, driven with real presses in a real browser. */
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
  ck('and both asks still carry a tag on the clause',
     await p.evaluate(id=>document.querySelectorAll(
       `.nego-clause[data-clause="${id}"] .rl-asktag`).length,staged.clauseId)===2);

  /* ---- IMAGE 2 ---- */
  const inColumn = await p.evaluate(a=>!!document.querySelector(`[data-nego-card="${a}"]`),staged.a);
  ck('the adopted change has no card — which is why "reopen it first" was unreachable',!inColumn);

  await p.click(`.nego-clause[data-clause="${staged.clauseId}"] [data-rl-asktag="${staged.a}"]`);
  await pause(450);
  ck('pressing its tag opens the reveal',
     await p.evaluate(a=>!!document.querySelector(`[data-rl-askrv="${a}"]`),staged.a));
  const btn = await p.evaluate(a=>{
    const el=document.querySelector(`[data-rl-askrv="${a}"] [data-nego-undo]`);
    if(!el) return null; const r=el.getBoundingClientRect();
    return {t:el.textContent.trim(),w:Math.round(r.width),h:Math.round(r.height)};},staged.a);
  ck('IMAGE 2 — and the reveal offers a REACHABLE Reopen, as visible pixels',
     !!btn&&btn.w>20&&btn.h>10,btn?`"${btn.t}" ${btn.w}x${btn.h}`:'absent');

  await p.click(`[data-rl-askrv="${staged.a}"] [data-nego-undo]`);
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
    const t=document.querySelector('[data-rl-asktag]'); if(!t) return 'no tag'; t.click(); return 'pressed';});
  await pause(500);
  ck('their seat gets the reveal but NEVER our reopen',
     await p.evaluate(()=>!document.querySelector('[data-rl-askrv] [data-nego-undo]')),cpTag);

  ck('no page errors in the whole run',errs.length===0,errs.join(' ; ')||'clean');
  await p.evaluate(()=>window.SHOW_OWNER()); await pause(400);
  await p.screenshot({path:'/tmp/claude-0/-home-user-mkataba-clm/a47eb1ce-f56b-5887-8467-21854b02f6d1/scratchpad/shots/mk311.png'});
  await p.close(); await br.close(); srv.close();
  console.log('\n'+R.filter(Boolean).length+'/'+R.length+' passed');
  if(R.some(x=>!x))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
