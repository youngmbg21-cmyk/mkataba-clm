/* ============================================================
   THE DESIGN CENSUS — did a rename move a pixel?
   ============================================================
   Phase C renamed ~5,000 hand-typed sizes, weights and spacings onto the
   design tokens on the promise that NOT ONE PIXEL MOVES. That is a claim only
   measurement can make, and this is the instrument that makes it.

   RUN BY HAND, IN PAIRS. It is not in `npm test` and not on run-all's list,
   because it answers a question about a CHANGE rather than about the product:
   record before, record after, diff.

     node test/design-census.cjs /tmp/before.json     # on the parent commit
     node test/design-census.cjs /tmp/after.json      # on the branch
     # then compare the two files

   THE PARENT COMMIT MEANS A WORKTREE. Recording "before" on a tree you have
   already edited measures nothing.

   IT MUST NOT FLAP. Run twice on unchanged code and the diff has to be empty
   — the first version of this reported 12 moved paths on an identical tree,
   because Reports hydrates its charts asynchronously and the census read the
   CSS fallback strip on one run and the canvas on the next. A census that
   moves on its own teaches the reader to discount it, which is how a real
   regression gets waved through.

   ---
   PHASE C's PROOF OBLIGATION, as an instrument. Records every font-size,
   font-weight, line-height, padding, margin, gap and box-shadow the browser
   RESOLVES, on 20 screens in both themes, keyed by a stable path to the
   element. Run before the sweep and after; any element whose value moved is
   either a bug or a named exception. */
const fs=require('node:fs'), path=require('node:path');
const {chromium}=require('playwright-core');
const {startHati}=require('./helpers');
const EXEC=process.env.CHROMIUM_BIN||(fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const OUT=process.argv[2]||'/tmp/ccensus.json';

const BASE=['RAW MATERIAL SUPPLY AGREEMENT','1. SUPPLY & SPECIFICATION',
 '1. The Supplier shall supply an estimated 5000 metric tonnes per annum.',
 '2. PRICE & CONTRACT VALUE','2. The estimated annual contract value is KES 78,000,000.',
 '3. QUALITY & REJECTION','3. Consignments failing specification may be rejected within 3 days.',
 '4. PAYMENT TERMS','4. All invoices are payable within thirty (30) days.'].join('\n\n');

const SCREENS=[
 ['dashboard',async p=>{await p.evaluate(()=>setView('dashboard'));await pause(800);}],
 ['register', async p=>{await p.evaluate(()=>setView('register'));await pause(700);}],
 /* REPORTS HYDRATES ITS CHARTS ASYNCHRONOUSLY, and a census taken while that
     is in flight reads the CSS fallback strip (58px) instead of the canvas
     (220px) — which makes every ancestor of the chart report a height change
     on identical code. MEASURED: run twice on an unchanged tree and 12 paths
     moved, then moved back. A census that flaps is worse than no census. So
     wait for the canvases, then for the height to STOP changing. */
 ['reports',  async p=>{
    await p.evaluate(()=>setView('reports'));
    try{
      await p.waitForFunction(()=>{
        const hosts=[...document.querySelectorAll('[id^="repchart-"]')];
        return hosts.length>0 && hosts.every(h=>h.querySelector('canvas'));
      },{timeout:8000});
    }catch(_){ /* no network for Chart.js: the fallback strips ARE the page,
                  and they settle immediately — which is stable either way. */ }
    let last=-1;
    for(let i=0;i<20;i++){
      const h=await p.evaluate(()=>{const e=document.getElementById('repchart-0');
        return e?Math.round(e.getBoundingClientRect().height):0;});
      if(h===last) break;
      last=h; await pause(200);
    }
    await pause(400);
  }],
 ['calendar', async p=>{await p.evaluate(()=>setView('calendar'));await pause(700);}],
 ['templates',async p=>{await p.evaluate(()=>setView('templates'));await pause(700);}],
 ['intel',    async p=>{await p.evaluate(()=>setView('intel'));await pause(1000);}],
 ['team',     async p=>{await p.evaluate(()=>setView('team'));await pause(800);}],
 ['directory',async p=>{await p.evaluate(()=>setView('directory'));await pause(700);}],
 ['contract', async p=>{await p.evaluate(()=>{openWorkspace('MK-82');roomGoTab(getContract('MK-82'),'docs');});await pause(900);}],
 ['keyterms', async p=>{await p.evaluate(()=>roomGoTab(getContract('MK-82'),'terms'));await pause(700);}],
 ['signing',  async p=>{await p.evaluate(()=>roomGoTab(getContract('MK-82'),'signing'));await pause(700);}],
 ['history',  async p=>{await p.evaluate(()=>roomGoTab(getContract('MK-82'),'history'));await pause(700);}],
 ['negotiate',async p=>{await p.evaluate(()=>openRedlineWorkbench('MK-82'));await p.waitForSelector('#view-redline #rl-doc',{timeout:10000});await pause(900);}],
 ['menu',     async p=>{await p.evaluate(()=>{openWorkspace('MK-82');});await p.waitForSelector('#ws-more');await p.click('#ws-more');await pause(400);}],
];

const SWEEP=()=>{
  const PROPS=['fontSize','fontWeight','lineHeight','letterSpacing','fontFamily',
    'paddingTop','paddingRight','paddingBottom','paddingLeft',
    'marginTop','marginRight','marginBottom','marginLeft',
    'gap','rowGap','columnGap','boxShadow','borderTopWidth','borderRadius','minHeight','height'];
  /* A STABLE PATH. Not an index into querySelectorAll — an element added
     anywhere shifts every path after it and the whole census reads as moved.
     Tag + id + first two classes + child index within its parent is stable
     against everything a rename should not touch. */
  const pathOf=el=>{
    const bits=[];
    let n=el, d=0;
    while(n && n.nodeType===1 && d++<6){
      const cls=(typeof n.className==='string'?n.className.trim().split(/\s+/).slice(0,2).join('.'):'');
      const i=n.parentElement?[...n.parentElement.children].indexOf(n):0;
      bits.unshift(n.tagName.toLowerCase()+(n.id?'#'+n.id:'')+(cls?'.'+cls:'')+':'+i);
      n=n.parentElement;
    }
    return bits.join('>');
  };
  const out={};
  for(const el of document.querySelectorAll('*')){
    if(el.closest('script,style,svg,#theme-menu,[data-brand-pick]')) continue;
    const r=el.getBoundingClientRect();
    if(r.width<1&&r.height<1) continue;
    const s=getComputedStyle(el);
    const v=PROPS.map(p=>s[p]).join('|');
    const k=pathOf(el);
    /* Several elements can share a path (a repeated row). Keep a COUNT of each
       distinct value under that path, so a change to one of forty rows shows
       and a re-ordering of identical rows does not. */
    (out[k]=out[k]||{})[v]=(out[k][v]||0)+1;
  }
  return out;
};

(async()=>{
  const h=await startHati();
  const admin=h.client('admin');
  await admin.json('/api/setup',{method:'POST',body:{org:'Highland Corporate Ltd',name:'Amina Otieno',
    email:'amina@highland.co.ke',password:'adminpassword1',data:{uid:300,contracts:[
      {id:'MK-82',name:'Retail Supply — Coast',counterparty:'Naivas Supermarkets',folder:'proc',
       value:78000000,valueType:'standard',status:'Under Review',template:'RM',lastAction:'06 Aug 2026',
       expiry:'2027-06-30',fields:{effDate:'2026-07-01'},metadata:{},comments:[],audit:[],signatures:[],
       obligations:[],rounds:[],versions:[],redlineText:BASE,format:'text'},
      {id:'MK-83',name:'Cold Chain Logistics',counterparty:'Nordfrakt Logistik AB',folder:'dist',
       value:24500000,valueType:'standard',status:'Signed',template:'WH',lastAction:'02 Aug 2026',
       expiry:'2027-03-31',fields:{},metadata:{},comments:[],audit:[],signatures:[],obligations:[],
       rounds:[],versions:[],redlineText:BASE,format:'text'},
      {id:'MK-84',name:'Packaging Supply — Nairobi',counterparty:'Bull Packaging Ltd',folder:'proc',
       value:12750000,valueType:'standard',status:'Draft',template:'RM',lastAction:'05 Aug 2026',
       expiry:'2027-01-15',fields:{},metadata:{},comments:[],audit:[],signatures:[],obligations:[],
       rounds:[],versions:[],redlineText:BASE,format:'text'}],settings:{}}}});
  const browser=await chromium.launch({executablePath:EXEC,args:['--no-sandbox']});
  const [ck,cv]=String(admin.cookie||'').split('=');
  const all={};
  for(const theme of ['light','dark']){
    const ctx=await browser.newContext({viewport:{width:1440,height:900}});
    await ctx.addCookies([{name:ck,value:cv,url:h.base}]);
    const page=await ctx.newPage();
    await page.goto(h.base,{waitUntil:'load'});
    await page.waitForFunction(()=>window.state&&Array.isArray(state.contracts)&&state.contracts.some(c=>c&&c.id==='MK-82'));
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
    if(theme==='dark'){await page.evaluate(()=>applyTheme('dark'));await pause(400);}
    for(const [name,go] of SCREENS){
      try{ await go(page); }catch(e){ all[`${name}--${theme}`]={ERROR:{[e.message]:1}}; continue; }
      await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'});
      all[`${name}--${theme}`]=await page.evaluate(SWEEP);
    }
    await ctx.close();
  }
  await browser.close(); await h.stop();
  fs.writeFileSync(OUT, JSON.stringify(all));
  let n=0; for(const k of Object.keys(all)) n+=Object.keys(all[k]).length;
  console.log(`recorded ${Object.keys(all).length} screens, ${n} element paths -> ${OUT}`);
})();
