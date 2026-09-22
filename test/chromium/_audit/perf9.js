/* The three recounts, and what they cost now. Reports numbers; asserts nothing. */
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
      const t=(fn)=>{ const a=performance.now(); try{ fn(); }catch(e){ return -1; } return Math.round(performance.now()-a); };
      setView('home');
      return { n:state.contracts.length,
        updateAlertBadge: t(()=>window.updateAlertBadge&&updateAlertBadge()),
        buildAlerts: t(()=>window.buildAlerts&&buildAlerts()),
        approvalsDoorCount: t(()=>window.approvalsDoorCount&&approvalsDoorCount()),
        obligationSurfacesChanged: t(()=>window.obligationSurfacesChanged&&obligationSurfacesChanged()),
        allObligations: t(()=>window.allObligations&&allObligations()),
        setViewHome: t(()=>setView('home')) };
    });
    console.log(JSON.stringify(r,null,2));
  } finally { await browser.close(); await h.stop(); }
})().catch(e=>{ console.error(e); process.exit(1); });
