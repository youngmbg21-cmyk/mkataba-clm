const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
(async()=>{
  const h=await startHati(); const w=await seedWorkspace(h,{contracts:CONTRACTS});
  for(const r of [{title:'Review their haulage terms',need:'Their own paper, about KES 17.8M.',counterparty:'Mombasa Haulage Co',folder:'dist'},
    {title:'Renew the Kabras sugar supply',need:'Same terms as last year.',counterparty:'Kabras Sugar Ltd',folder:'proc'},
    {title:'NDA for the Eldoret flavour trial',need:'Standard mutual NDA.',counterparty:'Givaudan East Africa',folder:'corp'},
    {title:'Data processing terms for the new CRM',need:'A CRM holding distributor data.',counterparty:'Salesforce EA',folder:'corp'}])
    await w.admin.json('/api/intake',{method:'POST',body:r});
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const page=await b.newPage({viewport:{width:1440,height:900}});
  await page.goto(h.base+'/',{waitUntil:'networkidle'});
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
  await page.click('#li-go'); await page.waitForTimeout(3500);
  const out={};
  // HOME: where is the first thing you can act on?
  out.home={ firstAction: await page.evaluate(()=>{
      const r=document.querySelector('#hm-desk-rows .hm-row, #hm-dd-rows .hm-row');
      return r?Math.round(r.getBoundingClientRect().top):null; }),
    rowsVisible: await page.evaluate(()=>[...document.querySelectorAll('#hm-desk-rows .hm-row, #hm-dd-rows .hm-row')]
      .filter(r=>r.getBoundingClientRect().top<900).length) };
  // CONTRACTS: how tall is the filter region?
  await page.evaluate(()=>setView('register')); await page.waitForTimeout(1600);
  out.contracts={ filterH: await page.evaluate(()=>{const b=document.querySelector('.reg-filterbar');return b?Math.round(b.getBoundingClientRect().height):null;}),
    controls: await page.evaluate(()=>document.querySelectorAll('.reg-filterbar select, .reg-filterbar input').length),
    rowsVisible: await page.evaluate(()=>[...document.querySelectorAll('.reg-table tbody tr, table tbody tr')].filter(r=>r.getBoundingClientRect().bottom<880).length) };
  // OBLIGATIONS
  await page.evaluate(()=>setView('obligations')); await page.waitForTimeout(1600);
  out.obligations={ filterH: await page.evaluate(()=>{const f=document.querySelector('.obw-filters');return f?Math.round(f.getBoundingClientRect().height):null;}),
    controls: await page.evaluate(()=>document.querySelectorAll('.obw-filters select, .obw-filters button').length),
    rows: await page.evaluate(()=>document.querySelectorAll('.obw-table tbody tr:not(.obw-band)').length),
    bands: await page.evaluate(()=>document.querySelectorAll('.obw-table tbody tr.obw-band').length) };
  // REQUESTS
  await page.evaluate(()=>setView('intake')); await page.waitForTimeout(1800);
  out.requests={ cardH: await page.evaluate(()=>{const r=document.querySelector('.ik-row');return r?Math.round(r.getBoundingClientRect().height):null;}),
    fourCards: await page.evaluate(()=>[...document.querySelectorAll('.ik-row')].slice(0,4).reduce((n,r)=>n+r.getBoundingClientRect().height,0)|0),
    visible: await page.evaluate(()=>[...document.querySelectorAll('.ik-row')].filter(r=>r.getBoundingClientRect().bottom<880).length) };
  // INSIGHTS
  await page.evaluate(()=>setView('intel')); await page.waitForTimeout(2400);
  out.insights={ firstChartTop: await page.evaluate(()=>{const c=[...document.querySelectorAll('#ig-frame div')].filter(d=>d.textContent.trim().startsWith('The renewal runway')).pop();
      return c?Math.round(c.getBoundingClientRect().top):null;}) };
  console.log(JSON.stringify(out,null,1));
  await b.close(); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
