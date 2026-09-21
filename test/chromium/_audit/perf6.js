/* WHERE THE TIME GOES. Every array pass over a big list is counted while one
   act runs, and the stack it came from is recorded — so the report names the
   function rather than guessing at it. */
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
    const r = await page.evaluate(()=>{
      const seed=state.contracts[0]; const arr=[seed];
      for(let i=0;i<3000;i++){ const c=JSON.parse(JSON.stringify(seed)); c.id='MK-P'+(1000+i);
        c.name='Perf '+i; c.counterparty='Party '+(i%37);
        c.expiry=new Date(Date.now()+(i%700)*86400000).toISOString().slice(0,10); arr.push(c); }
      state.contracts=arr;
      const MIN=500, tally={};
      const orig={};
      ['filter','find','some','findIndex','map','reduce','forEach'].forEach(m=>{
        orig[m]=Array.prototype[m];
        Array.prototype[m]=function(...a){
          if(this && this.length>=MIN){
            const st=(new Error()).stack.split('\n').slice(2,5)
              .map(s=>(s.match(/at ([A-Za-z0-9_$.]+)/)||[])[1]).filter(Boolean).join(' < ');
            tally[st]=(tally[st]||0)+this.length;
          }
          return orig[m].apply(this,a);
        };
      });
      const run=(name,fn)=>{ for(const k in tally) delete tally[k];
        const t=performance.now(); try{ fn(); }catch(e){}
        const ms=Math.round(performance.now()-t);
        const top=Object.entries(tally).sort((a,b)=>b[1]-a[1]).slice(0,6);
        return { name, ms, touched: Object.values(tally).reduce((a,b)=>a+b,0), top };
      };
      const out=[];
      out.push(run('buildAlerts', ()=>buildAlerts()));
      out.push(run('approvalsDoorCount', ()=>window.approvalsDoorCount && approvalsDoorCount()));
      out.push(run('obligationSurfacesChanged', ()=>window.obligationSurfacesChanged && obligationSurfacesChanged(state.contracts[0])));
      out.push(run('setView(home)', ()=>setView('home')));
      ['filter','find','some','findIndex','map','reduce','forEach'].forEach(m=>{ Array.prototype[m]=orig[m]; });
      return { n: state.contracts.length, out };
    });
    console.log(JSON.stringify(r,null,2));
  } finally { await browser.close(); await h.stop(); }
})().catch(e=>{ console.error(e); process.exit(1); });
