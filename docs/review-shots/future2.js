const fs=require('node:fs'), path=require('node:path');
const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
const OUT='/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/shots';
(async()=>{
  const h=await startHati(); const s=await seedWorkspace(h,{contracts:CONTRACTS});
  for(const r of [
    {title:'Review their haulage terms', need:'Mombasa Haulage sent their own paper for the coast route, about KES 17.8M.', counterparty:'Mombasa Haulage Co', folder:'dist'},
    {title:'Renew the Kabras sugar supply', need:'Same terms as last year if we can. Volumes are up about 8%.', counterparty:'Kabras Sugar Ltd', folder:'proc'},
    {title:'NDA for the Eldoret flavour trial', need:'Standard mutual NDA so we can share the formulation brief.', counterparty:'Givaudan East Africa', folder:'corp'},
    {title:'Data processing terms for the new CRM', need:'IT are onboarding a CRM that will hold distributor contact data.', counterparty:'Salesforce EA', folder:'corp'},
  ]) await s.admin.json('/api/intake',{method:'POST',body:r});
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const page=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await page.goto(h.base+'/',{waitUntil:'networkidle'});
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
  await page.click('#li-go'); await page.waitForTimeout(3800);
  const shot=async n=>{ await page.screenshot({path:path.join(OUT,n+'.png')}); console.log('shot',n); };
  const view=async(v,ms=1800)=>{ await page.evaluate(x=>setView(x),v); await page.waitForTimeout(ms); };

  /* ---- CONTRACTS: the cohort act ---- */
  await view('register');
  await page.selectOption('#reg-stage-sel','Signed').catch(()=>{});
  await page.waitForTimeout(1200);
  await page.evaluate(()=>{
    const bar=document.querySelector('.reg-filterbar'), model=bar&&bar.querySelector('.reg-f');
    if(bar&&model){ const f=model.cloneNode(true);
      f.querySelector('.reg-f-l').textContent='Required document';
      const sel=f.querySelector('select'); if(sel){ sel.id='reg-doc-sel';
        sel.innerHTML='<option>Any</option><option selected>A required document has lapsed</option><option>Expiring within 60 days</option>'; }
      bar.insertBefore(f, model.nextSibling); }
    const draft=[...document.querySelectorAll('button')].find(x=>/Draft new agreement/.test(x.textContent));
    if(draft&&draft.parentElement){
      const act=document.createElement('button'); act.type='button'; act.className='ui-btn';
      act.style.cssText='margin-right:10px;height:auto';
      act.textContent='Do this to these 14  ▾';
      draft.parentElement.insertBefore(act,draft);
      const menu=document.createElement('div'); menu.id='cohort-menu';
      menu.style.cssText='position:absolute;z-index:60;background:var(--color-surface);border:1px solid var(--rule-strong);border-radius:var(--radius);box-shadow:var(--shadow-lg,0 8px 24px rgba(0,0,0,.12));padding:4px 0;min-width:260px;font-size:var(--t-meta)';
      menu.innerHTML=['Send an amendment to all 14','Ask all 14 for a document','','Build a diligence pack from these 14','Export the list']
        .map(r=>r?`<div style="padding:8px 14px">${r}</div>`:'<div style="border-top:1px solid var(--rule-faint);margin:4px 0"></div>').join('');
      document.body.appendChild(menu);
      const r=act.getBoundingClientRect();
      menu.style.left=(r.left)+'px'; menu.style.top=(r.bottom+6)+'px';
      menu.firstElementChild.style.background='var(--color-accent-50)';
      menu.firstElementChild.style.color='var(--accent-ink)';
      menu.firstElementChild.style.fontWeight='var(--w-strong)';
    }
  });
  await page.waitForTimeout(400); await shot('B2-contracts-future');
  await page.evaluate(()=>{const m=document.getElementById('cohort-menu'); if(m) m.remove();});

  /* ---- ROOM: key terms cards, laid out as blocks ---- */
  await page.evaluate(()=>openWorkspace('MK-101')); await page.waitForTimeout(2400);
  await page.click('[data-room-tab="terms"]'); await page.waitForTimeout(1800);
  await page.evaluate(()=>{
    const side=document.querySelector('#kt-side'); if(!side) return;
    const CARD='display:block;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);padding:13px 15px;text-align:left';
    const row=(k,v,cl,tone)=>`<div style="display:flex;flex-direction:row;flex:none;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid var(--rule-faint)">
      <span style="flex:1;font-size:var(--t-meta);color:var(--color-neutral-600);text-align:left">${k}</span>
      <span style="font-size:var(--t-meta);font-weight:var(--w-strong);text-align:right${tone?';color:'+tone:''}">${v}</span>
      ${cl?`<span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink);border:1px solid var(--color-accent-200);background:var(--color-accent-50);border-radius:var(--radius);padding:1px 5px;flex:none">${cl}</span>`:'<span style="width:44px;flex:none"></span>'}</div>`;
    const head=(title,chip,tone)=>`<div style="display:flex;flex-direction:row;flex:none;align-items:center;gap:var(--s-2);margin-bottom:4px">
      <h6 style="margin:0;font-size:var(--t-body);font-weight:var(--w-title);font-family:var(--font-heading);flex:1;text-align:left">${title}</h6>
      <span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-${tone}-fg);background:var(--st-${tone}-bg);border-radius:var(--radius);padding:2px 7px;flex:none">${chip}</span></div>`;
    const ct=document.createElement('section'); ct.className='kt-side-card'; ct.style.cssText=CARD;
    ct.innerHTML=head('Commercial terms','2 departures','amber')
      +row('Payment terms','30 days from receipt','cl. 2')
      +row('Volume rebate','3% over 120,000 t','cl. 9')
      +row('Rebate tiers','2% / 3% / 4.5%','cl. 9')
      +row('Price review','Quarterly, against indices','cl. 2')
      +row('Rejection window','3 days from delivery','cl. 3')
      +row('Exclusivity','<i style="font-weight:400;color:var(--color-neutral-500)">Not recorded</i>','')
      +`<p style="margin:9px 0 0;font-size:var(--t-label);color:var(--color-neutral-600);text-align:left">Quoted from the wording. Where it says nothing, this says nothing.</p>`;
    const dc=document.createElement('section'); dc.className='kt-side-card'; dc.style.cssText=CARD;
    dc.innerHTML=head('Documents they must hold','1 lapsed','ruby')
      +row('Product liability insurance','Lapsed 14 Sept','cl. 8','var(--st-ruby-fg)')
      +row('KEBS standard certificate','To 30 Apr 2027','cl. 1')
      +row('Food safety (FSSC 22000)','<i style="font-weight:400;color:var(--color-neutral-500)">Never supplied</i>','cl. 3')
      +`<div style="display:flex;flex-direction:row;flex:none;gap:7px;margin-top:10px"><button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px">Chase them</button><button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px">Require another</button></div>`;
    const brief=document.querySelector('#brief-card');
    side.insertBefore(ct,brief); side.insertBefore(dc,brief);
    const rh=document.querySelector('#renewal-host'); const btns=rh&&[...rh.querySelectorAll('button')];
    if(btns&&btns.length){ const n=btns[btns.length-1].cloneNode(true); n.textContent='Serve a notice';
      btns[btns.length-1].parentElement.appendChild(n); }
    const fam=document.querySelector('#family-section'); const fb=fam&&[...fam.querySelectorAll('button')];
    if(fb&&fb.length){ const n=fb[fb.length-1].cloneNode(true); n.textContent='Check the family';
      fb[fb.length-1].parentElement.appendChild(n); }
  });
  await page.waitForTimeout(500); await shot('C2-room-future');

  /* ---- OBLIGATIONS ---- */
  await view('obligations');
  await page.evaluate(()=>{
    const tb=document.querySelector('.obw-table tbody'); if(!tb) return;
    const band=tb.querySelector('tr.obw-band'); const row=[...tb.querySelectorAll('tr')].find(r=>!r.classList.contains('obw-band'));
    const nb=band.cloneNode(true);
    nb.querySelector('td').innerHTML='Earned, not claimed<b>3</b><i class="obw-bandsum">KES 5.20M</i>';
    const mk=(title,sub,who,amt,when)=>{ const r=row.cloneNode(true);
      r.children[0].innerHTML=`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--st-green-dot);margin-right:8px"></span><b style="font-weight:var(--w-strong)">${title}</b><div style="font-size:var(--t-meta);color:var(--color-neutral-600);margin-left:16px">${sub}</div>`;
      r.children[1].innerHTML='<span style="border:1px solid var(--color-accent-200);color:var(--accent-ink);border-radius:var(--radius);padding:1px 6px;font-size:var(--t-label);letter-spacing:.06em;white-space:nowrap">TO CLAIM</span>';
      r.children[2].innerHTML=who; r.children[3].innerHTML=`<b>${amt}</b>`; r.children[4].innerHTML=when;
      r.children[5].innerHTML='<a href="#" style="color:var(--accent-ink);font-weight:var(--w-strong)">Claim</a> &nbsp; <a href="#" style="color:var(--accent-ink)">Open</a>';
      return r; };
    const rows=[
      mk('Volume rebate, Q2','Refined Sugar Supply · MK-101 · 134,000 t against a 120,000 t threshold','Kabras Sugar Ltd','KES 4.10M','earned 30 Jun'),
      mk('Service credits — late loads','Primary Distribution — Nairobi · MK-110 · 4 late loads recorded','Siginon Freight','KES 900K','earned 31 Aug'),
      mk('Listing fee refund','Modern Trade Listing · MK-113 · campaign not run','Naivas Supermarkets','KES 200K','earned 12 Sep')];
    tb.insertBefore(nb,tb.firstChild);
    rows.reverse().forEach(r=>tb.insertBefore(r,nb.nextSibling));
    const cap=document.querySelector('.obt-cap'); if(cap) cap.textContent='14 outstanding';
    const ov=document.querySelector('.obw-head');
    if(ov){ const e=document.createElement('span'); e.style.cssText='margin-left:14px;color:var(--accent-ink);font-weight:var(--w-strong)';
      e.textContent='KES 5.20M earned, not claimed'; ov.appendChild(e); }
  });
  await page.waitForTimeout(400); await shot('D2-oblig-future');

  /* ---- INSIGHTS ---- */
  await view('intel',2600);
  await page.evaluate(()=>{
    const tabs=[...document.querySelectorAll('[data-ig-tab]')];
    const on=tabs.find(t=>t.style.fontWeight==='700')||tabs[0];
    const nt=on.cloneNode(true); nt.setAttribute('data-ig-tab','exposure'); nt.textContent='Exposure';
    tabs.forEach(t=>{ t.style.fontWeight='400'; t.style.color='var(--color-text)'; t.style.borderBottomColor='transparent'; });
    on.parentElement.insertBefore(nt, tabs[4]||null);
    const frame=document.querySelector('#ig-frame'); if(!frame) return;
    // keep the frame's own <style>, clone the two real components we want, rebuild
    const styles=[...frame.querySelectorAll(':scope > style')].map(e=>e.cloneNode(true));
    const leafWith=t=>[...frame.querySelectorAll('*')].filter(e=>e.children.length===0&&e.textContent.trim()===t)[0];
    const anchor=leafWith('CONTRACTED VALUE');
    let tilesRow=null;
    if(anchor){ let n=anchor; while(n&&n.parentElement&&!/ENDS WITHIN 90 DAYS/.test(n.textContent)) n=n.parentElement;
      tilesRow=n&&n.cloneNode(true); }
    const runway=[...frame.querySelectorAll('div')].filter(d=>d.textContent.trim().startsWith('The renewal runway')).pop();
    let card=null;
    if(runway){ let n=runway; for(let i=0;i<4&&n.parentElement;i++){ const st=getComputedStyle(n);
        if(st.backgroundColor&&st.backgroundColor!=='rgba(0, 0, 0, 0)'&&n.getBoundingClientRect().width>800) break; n=n.parentElement; }
      card=n.cloneNode(true); }
    if(tilesRow){ const swap={'CONTRACTED VALUE':'LIABILITY UNCAPPED','KES 670.50M':'7 contracts','22 live contracts':'KES 188.00M of value on paper',
        'ENDS WITHIN 90 DAYS':'THEY MAY RAISE THE PRICE','KES 230.50M':'9 contracts','4 contracts — the near horizon':'no cap, and no way out',
        'NO CATEGORY YET':'NOT READ CLOSELY ENOUGH','19':'19 contracts','cannot be grouped until they are filed':'HaTi cannot speak for these yet'};
      [...tilesRow.querySelectorAll('*')].filter(e=>e.children.length===0).forEach(e=>{ const t=e.textContent.trim(); if(swap[t]) e.textContent=swap[t]; }); }
    const rows=[['Liability is uncapped','no limit stated anywhere in the wording','7','KES 188.00M','Krones East Africa','See all'],
      ['They may change the price','no cap, and no right to walk away','9','KES 241.60M','Kabras Sugar Ltd','See all'],
      ['Indemnity with no ceiling','we indemnify them, they do not indemnify us','4','KES 96.40M','Naivas Supermarkets','See all'],
      ['Renews itself with no reminder','notice window under 30 days','5','KES 118.20M','Jumia Kenya','See all'],
      ['Exclusive, and we cannot exit early','no termination for convenience','3','KES 64.00M','Rift Valley Distributors','See all']];
    const body=`<div style="padding:18px 20px">
      <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:2px">
        <h3 style="margin:0;font-size:var(--t-card);font-weight:var(--w-strong)">What could hurt you</h3>
        <span style="font-size:var(--t-meta);color:var(--color-neutral-600)">every row opens the contracts behind it</span></div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:var(--t-body);margin-top:14px">
        <colgroup><col><col style="width:110px"><col style="width:170px"><col style="width:230px"><col style="width:90px"></colgroup>
        <thead><tr style="text-align:left;border-bottom:1px solid var(--rule-strong)">
          <th style="padding:8px 0;font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600)">Exposure</th>
          <th style="padding:8px 0;font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600);text-align:right">Contracts</th>
          <th style="padding:8px 0;font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600);text-align:right">Value on paper</th>
          <th style="padding:8px 0 8px 20px;font-size:var(--t-label);font-weight:var(--w-title);color:var(--color-neutral-600)">Worst one</th>
          <th></th></tr></thead><tbody>
        ${rows.map(r=>`<tr style="border-bottom:1px solid var(--rule-faint)">
          <td style="padding:12px 0"><b style="font-weight:var(--w-strong)">${r[0]}</b><div style="font-size:var(--t-meta);color:var(--color-neutral-600)">${r[1]}</div></td>
          <td style="text-align:right;font-variant-numeric:tabular-nums">${r[2]}</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:var(--w-strong)">${r[3]}</td>
          <td style="padding-left:20px;color:var(--color-neutral-600)">${r[4]}</td>
          <td style="text-align:right"><a href="#" style="color:var(--accent-ink)">${r[5]}</a></td></tr>`).join('')}
        <tr><td style="padding:12px 0"><b style="font-weight:var(--w-strong);color:var(--accent-ink)">Not read closely enough to say</b><div style="font-size:var(--t-meta);color:var(--color-neutral-600)">no brief, no playbook pass, no risk scan</div></td>
          <td style="text-align:right;font-variant-numeric:tabular-nums">19</td>
          <td style="text-align:right;font-variant-numeric:tabular-nums;font-weight:var(--w-strong)">KES 475.50M</td>
          <td style="padding-left:20px;color:var(--color-neutral-600)">—</td>
          <td style="text-align:right"><a href="#" style="color:var(--accent-ink)">Read them</a></td></tr></tbody></table>
      <p style="margin:16px 0 0;font-size:var(--t-meta);color:var(--color-neutral-600)">Live agreements only — declined and shelved are out. Value on paper is the contract value, not what you would lose.</p></div>`;
    frame.innerHTML='';
    styles.forEach(st=>frame.appendChild(st));
    if(tilesRow){ tilesRow.style.marginBottom='16px'; frame.appendChild(tilesRow); }
    if(card){ card.innerHTML=body; frame.appendChild(card); }
    else { const d=document.createElement('div');
      d.style.cssText='background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius);box-shadow:var(--shadow-sm)';
      d.innerHTML=body; frame.appendChild(d); }
  });
  await page.waitForTimeout(600); await shot('E2-insights-future');

  /* ---- REQUESTS ---- */
  await view('intake',2000); await shot('F1-requests-today');
  await page.evaluate(()=>{
    const rows=[...document.querySelectorAll('.ik-row')];
    const meta=[['Close read','Tomás Wanjiku','1 day over','ruby'],
      ['Routine','Tomás Wanjiku','2 hours left','amber'],
      ['Cleared by a lane','—','done in 4 min','green'],
      ['Standard','Unassigned','Thu 18 Sept','gray']];
    rows.slice(0,8).forEach((r,i)=>{
      const m=meta[i%4];
      const box=document.createElement('div');
      box.style.cssText='display:flex;flex-direction:row;gap:26px;align-items:center;flex:none;position:absolute;right:20px;top:50%;transform:translateY(-50%)';
      box.innerHTML=`<span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">Road</span>
          <span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-${m[3]}-fg)">${m[0]}</span></span>
        <span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">With</span>
          <span style="font-size:var(--t-meta);font-weight:var(--w-strong)">${m[1]}</span></span>
        <span style="display:flex;flex-direction:column;gap:2px"><span style="font-size:var(--t-label);color:var(--color-neutral-600)">Promised</span>
          <span style="font-size:var(--t-meta);font-weight:var(--w-strong);color:var(--st-${m[3]}-fg)">${m[2]}</span></span>
        <a href="#" style="font-size:var(--t-meta);color:var(--accent-ink)">Tracker link</a>`;
      r.style.position='relative'; r.style.paddingRight='430px'; r.appendChild(box);
    });
    const h3=[...document.querySelectorAll('h3')].find(x=>/Waiting to be picked up/.test(x.textContent));
    if(h3){ const s=document.createElement('span');
      s.style.cssText='margin-left:14px;font-size:var(--t-meta);font-weight:400;color:var(--color-neutral-600)';
      s.textContent='· 1 past its date · median 1.4 days this month'; h3.appendChild(s); }
  });
  await page.waitForTimeout(400); await shot('F2-requests-future');
  await b.close(); process.exit(0);
})().catch(e=>{console.error('FAILED',e);process.exit(1);});
