const fs=require('node:fs'), path=require('node:path');
const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
const OUT='/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/shots';
const CARDS=`(()=>{
  const side=document.querySelector('#kt-side');
  return { order:[...side.children].map(e=>({id:e.id||e.className, h:Math.round(e.getBoundingClientRect().height),
      title:(e.querySelector('h6,h4,h3')||{}).textContent||''})),
    scrollH:side.scrollHeight, clientH:side.clientHeight, scrolls: side.scrollHeight>side.clientHeight+2 };
})()`;
(async()=>{
  const h=await startHati(); await seedWorkspace(h,{contracts:CONTRACTS});
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const page=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await page.goto(h.base+'/',{waitUntil:'networkidle'});
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
  await page.click('#li-go'); await page.waitForTimeout(3800);
  await page.evaluate(()=>openWorkspace('MK-101')); await page.waitForTimeout(2400);
  await page.click('[data-room-tab="terms"]'); await page.waitForTimeout(1800);
  const before=await page.evaluate(CARDS);
  console.log('TODAY  ', JSON.stringify(before,null,0));
  await page.locator('#kt-side').screenshot({path:path.join(OUT,'G1-column-today.png')});

  // the SAME injection, but the two new cards go after the brief and before the family
  await page.evaluate(()=>{
    const side=document.querySelector('#kt-side');
    const CARD='display:block;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);padding:13px 15px;text-align:left';
    const row=(k,v,cl,tone)=>`<div style="display:flex;flex-direction:row;flex:none;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--rule-faint)">
      <span style="flex:1;font-size:var(--t-meta);color:var(--color-neutral-600);text-align:left">${k}</span>
      <span style="font-size:var(--t-meta);font-weight:var(--w-strong);text-align:right${tone?';color:'+tone:''}">${v}</span>
      ${cl?`<span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink);border:1px solid var(--color-accent-200);background:var(--color-accent-50);border-radius:var(--radius);padding:1px 5px;flex:none">${cl}</span>`:'<span style="width:44px;flex:none"></span>'}</div>`;
    const head=(t,chip,tone)=>`<div style="display:flex;flex-direction:row;flex:none;align-items:center;gap:var(--s-2);margin-bottom:4px">
      <h6 style="margin:0;font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading);flex:1;text-align:left">${t}</h6>
      <span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-${tone}-fg);background:var(--st-${tone}-bg);border-radius:var(--radius);padding:2px 7px;flex:none">${chip}</span></div>`;
    const ct=document.createElement('section'); ct.className='kt-side-card'; ct.style.cssText=CARD;
    ct.innerHTML=head('Commercial terms','2 departures','amber')
      +row('Payment terms','30 days from receipt','cl. 2')+row('Volume rebate','3% over 120,000 t','cl. 9')
      +row('Rebate tiers','2% / 3% / 4.5%','cl. 9')+row('Price review','Quarterly, against indices','cl. 2')
      +row('Rejection window','3 days from delivery','cl. 3')
      +row('Exclusivity','<i style="font-weight:400;color:var(--color-neutral-500)">Not recorded</i>','')
      +`<p style="margin:9px 0 0;font-size:var(--t-label);color:var(--color-neutral-600);text-align:left">Quoted from the wording. Where it says nothing, this says nothing.</p>`;
    const dc=document.createElement('section'); dc.className='kt-side-card'; dc.style.cssText=CARD;
    dc.innerHTML=head('Documents they must hold','1 lapsed','ruby')
      +row('Product liability insurance','Lapsed 14 Sept','cl. 8','var(--st-ruby-fg)')
      +row('KEBS standard certificate','To 30 Apr 2027','cl. 1')
      +row('Food safety (FSSC 22000)','<i style="font-weight:400;color:var(--color-neutral-500)">Never supplied</i>','cl. 3')
      +`<div style="display:flex;flex-direction:row;flex:none;gap:7px;margin-top:10px"><button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px">Chase them</button><button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px">Require another</button></div>`;
    const fam=document.querySelector('#family-section');
    side.insertBefore(ct,fam); side.insertBefore(dc,fam);   // after the brief, before the family
    const rh=document.querySelector('#renewal-host'); const btns=rh&&[...rh.querySelectorAll('button')];
    if(btns&&btns.length){ const n=btns[btns.length-1].cloneNode(true); n.textContent='Serve a notice';
      btns[btns.length-1].parentElement.appendChild(n); }
    const fb=fam&&[...fam.querySelectorAll('button')];
    if(fb&&fb.length){ const n=fb[fb.length-1].cloneNode(true); n.textContent='Check the family';
      fb[fb.length-1].parentElement.appendChild(n); }
  });
  await page.waitForTimeout(600);
  const after=await page.evaluate(CARDS);
  console.log('AFTER  ', JSON.stringify(after,null,0));
  await page.screenshot({path:path.join(OUT,'C2-room-future.png')});
  await page.locator('#kt-side').screenshot({path:path.join(OUT,'G2-column-future.png')});
  // scrolled to the foot of the column, to show the brief and the family are still there
  await page.evaluate(()=>{const s=document.querySelector('#kt-side'); s.scrollTop=s.scrollHeight;});
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(OUT,'C3-room-future-scrolled.png')});
  fs.writeFileSync(OUT+'/column.json',JSON.stringify({before,after},null,1));
  await b.close(); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
