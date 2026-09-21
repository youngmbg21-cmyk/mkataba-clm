/* PROOF OF CAUSE: with a parent→children index in front of the one reading,
   how much of the cost goes? Measured, not argued. The index is built in the
   PAGE for the measurement only — nothing here is a change to the product. */
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
      const t=(fn)=>{ const a=performance.now(); try{ fn(); }catch(e){} return Math.round(performance.now()-a); };
      const before={ home:t(()=>setView('home')), alerts:t(()=>buildAlerts()) };
      /* THE SAME FILTER, ANSWERED FROM A MAP BUILT ONCE. The product's own
         reading is a module const so it cannot be patched from here; what CAN
         be measured is the work the filter itself does, which is the whole of
         the difference. */
      const N=state.contracts.length;
      const naive=()=>{ let n=0; for(const c of state.contracts){ n+=state.contracts.filter(k=>k.parentId===c.id).length; } return n; };
      const indexed=()=>{ const m=new Map(); for(const k of state.contracts){ if(!k.parentId) continue;
          const a=m.get(k.parentId)||[]; a.push(k); m.set(k.parentId,a); }
        let n=0; for(const c of state.contracts){ n+=(m.get(c.id)||[]).length; } return n; };
      const one=t(naive), two=t(indexed);
      return { N, before, onePassNaiveMs:one, onePassIndexedMs:two };
    });
    console.log(JSON.stringify(r,null,2));
  } finally { await browser.close(); await h.stop(); }
})().catch(e=>{ console.error(e); process.exit(1); });
