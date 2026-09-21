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
    for(const n of [100,400,1200,3000]){
      const r = await page.evaluate((n)=>{
        const seed=state.contracts[0]; const out=[seed];
        for(let i=0;i<n;i++){ const c=JSON.parse(JSON.stringify(seed)); c.id='MK-P'+(1000+i);
          c.name='Perf '+i; c.counterparty='Party '+(i%37);
          c.expiry=new Date(Date.now()+(i%700)*86400000).toISOString().slice(0,10); out.push(c); }
        state.contracts=out;
        const t0=performance.now(); state.contracts.forEach(c=>effectiveExpiry(c));
        const ee=Math.round(performance.now()-t0);
        const t1=performance.now(); state.contracts.forEach(c=>fxHome(c));
        const fx=Math.round(performance.now()-t1);
        const t2=performance.now(); const rows=regFiltered(); const rf=Math.round(performance.now()-t2);
        const t3=performance.now(); renderRegister(); const rr=Math.round(performance.now()-t3);
        const t4=performance.now(); setView('intel'); const iv=Math.round(performance.now()-t4);
        return { n: state.contracts.length, effectiveExpiry: ee, fxHome: fx,
          regFiltered: rf, rows: rows.length, renderRegister: rr, intel: iv };
      }, n);
      out.push(r);
    }
    console.log(JSON.stringify(out,null,2));
  } finally { await browser.close(); await h.stop(); }
})().catch(e=>{ console.error(e); process.exit(1); });
