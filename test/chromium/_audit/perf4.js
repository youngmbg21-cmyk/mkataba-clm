const fs=require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
(async () => {
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport:{width:1440,height:900} })).newPage();
  try{
    await page.goto(h.base+'/',{waitUntil:'networkidle'}); await page.waitForTimeout(600);
    await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
    await page.click('#li-go'); await page.waitForTimeout(2600);
    const out=[];
    for(const n of [400, 3000]){
      const r = await page.evaluate((n)=>{
        const seed=state.contracts[0]; const arr=[seed];
        for(let i=0;i<n;i++){ const c=JSON.parse(JSON.stringify(seed)); c.id='MK-P'+(1000+i);
          c.name='Perf '+i; c.counterparty='Party '+(i%37);
          c.expiry=new Date(Date.now()+(i%700)*86400000).toISOString().slice(0,10); arr.push(c); }
        state.contracts=arr;
        const t=(fn)=>{ const a=performance.now(); try{ fn(); }catch(e){ return -1; } return Math.round(performance.now()-a); };
        const o={ n: state.contracts.length };
        o.home = t(()=>setView('home'));
        o.register = t(()=>setView('register'));
        o.calendar = t(()=>setView('calendar'));
        o.obligations = t(()=>setView('obligations'));
        o.intel_open = t(()=>setView('intel'));
        for(const tab of ['portfolio','friction','oblig','pay','exposure','graph']){
          o['intel_'+tab] = t(()=>{ if(window.intelGoTab) intelGoTab(tab); });
        }
        o.buildGraphModel = t(()=>{ if(window.buildGraphModel) buildGraphModel(); });
        o.buildGraphEdges = t(()=>{ if(window.buildGraphEdges) buildGraphEdges(state.contracts); });
        o.exposureData = t(()=>{ if(window.exposureData) exposureData(); });
        o.payTermsData = t(()=>{ if(window.payTermsData) payTermsData(); });
        o.intelFrictionStats = t(()=>{ if(window.intelFrictionStats) intelFrictionStats(); });
        o.allObligations = t(()=>{ if(window.allObligations) allObligations(); });
        o.hmDashSlices = t(()=>{ if(window.hmDashSlices) hmDashSlices(state.contracts); });
        return o;
      }, n);
      out.push(r);
    }
    console.log(JSON.stringify(out,null,2));
  } finally { await browser.close(); await h.stop(); }
})().catch(e=>{ console.error(e); process.exit(1); });
