const fs=require('node:fs'), path=require('node:path');
const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
const OUT='/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/shots';

/* the one grammar, as a string injected into every page */
const G = `
  const SEC='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);margin-bottom:10px';
  const HEAD='display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer';
  const HT='margin:0;font-size:var(--t-card);font-weight:var(--w-strong);font-family:var(--font-heading);flex:none';
  const SUM='font-size:var(--t-meta);color:var(--color-neutral-600);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const chip=(t,tone)=>'<span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-'+tone+'-fg);background:var(--st-'+tone+'-bg);border-radius:var(--radius);padding:2px 8px;flex:none">'+t+'</span>';
  const chev=o=>'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.5" style="flex:none;transform:rotate('+(o?'0':'-90')+'deg)"><path d="M4 6l4 4 4-4"/></svg>';
  const headHtml=(title,summary,chipHtml,openState)=>'<div style="'+HEAD+(openState?';border-bottom:1px solid var(--rule-faint)':'')+'">'
      +'<h3 style="'+HT+'">'+title+'</h3><span style="'+SUM+'">'+(summary||'')+'</span>'+(chipHtml||'')+chev(openState)+'</div>';
  const shell=(title,summary,chipHtml,openState,accent)=>{
    const s=document.createElement('section');
    s.style.cssText=SEC+(accent?';border-left:3px solid var(--st-'+accent+'-dot)':'');
    s.innerHTML=headHtml(title,summary,chipHtml,openState);
    return s; };
`;

(async()=>{
  const h=await startHati(); const w=await seedWorkspace(h,{contracts:CONTRACTS});
  for(const r of [
    {title:'Review their haulage terms', need:'Mombasa Haulage sent their own paper for the coast route, about KES 17.8M.', counterparty:'Mombasa Haulage Co', folder:'dist'},
    {title:'Renew the Kabras sugar supply', need:'Same terms as last year if we can. Volumes are up about 8%.', counterparty:'Kabras Sugar Ltd', folder:'proc'},
    {title:'NDA for the Eldoret flavour trial', need:'Standard mutual NDA so we can share the formulation brief.', counterparty:'Givaudan East Africa', folder:'corp'},
    {title:'Data processing terms for the new CRM', need:'IT are onboarding a CRM that will hold distributor contact data.', counterparty:'Salesforce EA', folder:'corp'},
  ]) await w.admin.json('/api/intake',{method:'POST',body:r});

  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const page=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await page.goto(h.base+'/',{waitUntil:'networkidle'});
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
  await page.click('#li-go'); await page.waitForTimeout(3800);
  const shot=async n=>{ await page.screenshot({path:path.join(OUT,n+'.png')}); console.log('shot',n); };
  const view=async(v,ms=1800)=>{ await page.evaluate(x=>setView(x),v); await page.waitForTimeout(ms); };

  /* ================= HOME: work first, numbers second ================= */
  await view('dashboard');
  const mHome=await page.evaluate(G+`
    const pageEl=document.querySelector('.hm-page');
    const secs=[...pageEl.querySelectorAll('.hm-sec')];
    const kpi=document.querySelector('#kpi-grid');
    const port=document.querySelector('.hm-tiles.is-port');
    const desk=document.querySelector('#hm-desk-rows');
    const dd=document.querySelector('#hm-dd-rows');
    const greet=document.querySelector('.hm-greet');
    // a notice to serve joins Prepared for you, as proposed
    if(desk&&desk.firstElementChild){ const n=desk.firstElementChild.cloneNode(true);
      n.querySelector('.hm-rt').textContent='Notice ready to serve — Kabras Sugar Ltd';
      n.querySelector('.hm-rm').textContent='Do not renew · drafted from clause 18.2 · to the address in clause 24';
      n.querySelector('.hm-rtag').textContent='14 days left';
      const a=n.querySelectorAll('.hm-tri-b'); if(a[0]) a[0].textContent='Read it';
      desk.insertBefore(n,desk.firstElementChild); }
    const wrap=document.createElement('div');
    const s1=shell('Prepared for you','Three things HaTi worked on overnight. Nothing was sent or filed.','',1,'amber');
    s1.appendChild(desk);
    const s2=shell('Needs your decision','Renewals, approvals and answers that are waiting on you','',1);
    s2.appendChild(dd);
    const s3=shell('My work','Your four numbers','',1);
    s3.appendChild(kpi);
    const s4=shell('The book','KES 670.50M under management · 22 live agreements · 86% follow your playbook · 22 still to read','',0);
    s4.appendChild(port); port.style.display='none';
    [s1,s2,s3,s4].forEach(s=>wrap.appendChild(s));
    secs.forEach(s=>s.remove());
    pageEl.innerHTML=''; pageEl.appendChild(greet); pageEl.appendChild(wrap);
    ({h:Math.round(pageEl.getBoundingClientRect().height)});
  `);
  console.log('home',JSON.stringify(mHome));
  await page.waitForTimeout(500); await shot('J1-home-grammar');
  console.log('AFTER home', JSON.stringify(await page.evaluate(()=>({
    firstAction: Math.round(document.querySelector('.hm-row').getBoundingClientRect().top),
    rowsVisible: [...document.querySelectorAll('.hm-row')].filter(r=>r.getBoundingClientRect().top<900).length }))));

  /* ================= CONTRACTS: the filter bar states itself ================= */
  await view('register');
  await page.selectOption('#reg-stage-sel','Signed').catch(()=>{});
  await page.waitForTimeout(1200);
  await page.evaluate(G+`(()=>{
    const bar=document.querySelector('.reg-filterbar'); if(!bar) return;
    bar.style.display='none';
    const line=document.createElement('div');
    line.style.cssText='display:flex;align-items:center;gap:12px;padding:9px 2px';
    line.innerHTML='<h3 style="'+HT+'">Showing</h3>'
      +'<span style="'+SUM+';flex:none;color:var(--color-text);font-weight:var(--w-strong)">14 executed agreements</span>'
      +'<span style="'+SUM+'">of 22 &middot; every stream &middot; every category &middot; a required document has lapsed</span>'
      +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px;flex:none">Change what is shown</button>'
      +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px;flex:none">Clear</button>'
      +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px;flex:none">Do this to these 14 &nbsp;&#9662;</button>';
    bar.parentElement.insertBefore(line,bar);
  })()`);
  await page.waitForTimeout(400); await shot('J2-contracts-grammar');
  console.log('AFTER contracts', JSON.stringify(await page.evaluate(()=>({
    rowsVisible: [...document.querySelectorAll('table tbody tr')].filter(r=>r.getBoundingClientRect().bottom<880).length }))));

  /* ================= OBLIGATIONS: the bands collapse ================= */
  await view('obligations');
  await page.evaluate(G+`(()=>{
    const tb=document.querySelector('.obw-table tbody'); if(!tb) return;
    // the filters state themselves in one line
    const fl=document.querySelector('.obw-filters');
    if(fl){ fl.style.display='none';
      const line=document.createElement('div');
      line.style.cssText='display:flex;align-items:center;gap:12px;padding:10px 16px;border-bottom:1px solid var(--rule-faint)';
      line.innerHTML='<h3 style="'+HT+'">Showing</h3>'
        +'<span style="flex:none;font-size:var(--t-meta);color:var(--color-text);font-weight:var(--w-strong)">everything still outstanding</span>'
        +'<span style="'+SUM+'">anybody &middot; both sides &middot; every stream &middot; any date</span>'
        +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px;flex:none">Change what is shown</button>';
      fl.parentElement.insertBefore(line,fl); }
    // every band becomes a door: shut ones keep their count and their money
    const rows=[...tb.children]; let band=null, hide=false, idx=0;
    rows.forEach(r=>{
      if(r.classList.contains('obw-band')){
        idx++; band=r; hide = idx>1;               // the first band stays open
        const td=r.querySelector('td');
        td.style.cursor='pointer';
        const c=document.createElement('span');
        c.style.cssText='float:right;margin-left:10px;display:inline-block;transform:translateY(2px)';
        c.innerHTML='<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.5" style="transform:rotate('+(hide?'-90':'0')+'deg)"><path d="M4 6l4 4 4-4"/></svg>';
        td.appendChild(c);
        if(hide){ const s=document.createElement('i');
          s.style.cssText='font-style:normal;font-weight:400;color:var(--color-neutral-600);margin-left:14px;font-size:var(--t-meta);text-transform:none;letter-spacing:0';
          s.textContent = idx===2 ? 'Kabras Sugar, Africa Logistics, Bidco, Rift Valley — none late yet'
                        : idx===3 ? 'Kevian, Africa Logistics, Naivas — the earliest is 6 October' : '';
          td.appendChild(s); }
      } else if(hide){ r.style.display='none'; }
    });
  })()`);
  await page.waitForTimeout(400); await shot('J3-obligations-grammar');
  console.log('AFTER obligations', JSON.stringify(await page.evaluate(()=>({
    rowsShown: [...document.querySelectorAll('.obw-table tbody tr:not(.obw-band)')].filter(r=>r.style.display!=='none').length,
    bands: document.querySelectorAll('.obw-table tbody tr.obw-band').length }))));

  /* ================= INSIGHTS: every panel says its finding ================= */
  await view('intel',2600);
  await page.evaluate(G+`(()=>{
    const frame=document.querySelector('#ig-frame'); if(!frame) return;
    /* find the CARD that holds a heading, without walking past it into the page */
    const cardOf=txt=>{
      const head=[...frame.querySelectorAll('h1,h2,h3,h4,div,span')]
        .filter(e=>e.children.length<=2 && e.textContent.trim().startsWith(txt)).pop();
      if(!head) return null;
      let n=head;
      for(let i=0;i<6 && n.parentElement && n.parentElement!==frame; i++){
        const r=n.getBoundingClientRect();
        if(r.height>220 && r.width>650) return n;
        n=n.parentElement;
      }
      const r=n.getBoundingClientRect();
      return (n!==frame && r.height>220) ? n : null;
    };
    /* the amber band becomes a section row rather than a banner */
    const bandTxt=[...frame.querySelectorAll('div,span,p')]
      .filter(d=>d.children.length<=3 && d.textContent.trim().startsWith('19 contracts cannot be grouped yet.')).pop();
    if(bandTxt){
      /* the banner is the ancestor actually painted amber — hide that one, not a child of it */
      let n=bandTxt;
      for(let i=0;i<5 && n.parentElement && n.parentElement!==frame; i++){
        const bg=getComputedStyle(n).backgroundColor;
        if(bg && bg!=='rgba(0, 0, 0, 0)' && n.getBoundingClientRect().width>650) break;
        n=n.parentElement; }
      const row=document.createElement('section');
      row.style.cssText=SEC+';border-left:3px solid var(--st-amber-dot)';
      row.innerHTML='<div style="'+HEAD+'"><h3 style="'+HT+'">Not yet grouped</h3>'
        +'<span style="'+SUM+'">19 contracts were filed before HaTi could read a category, so they fall out of every figure that groups by one.</span>'
        +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 11px;flex:none">Read them now</button></div>';
      n.parentElement.insertBefore(row,n); n.style.display='none';
    }
    /* each panel is WRAPPED, never replaced: a head that states the finding, and the card inside it */
    const dress=(txt,title,finding,openState)=>{
      const c=cardOf(txt); if(!c) return txt+':not found';
      const sec=document.createElement('section'); sec.style.cssText=SEC;
      sec.innerHTML=headHtml(title,finding,'',openState);
      c.parentElement.insertBefore(sec,c);
      if(openState){ sec.appendChild(c); c.style.border='0'; c.style.boxShadow='none'; c.style.margin='0';
        /* the section head now carries the title, so the card must not say it twice */
        const dup=[...c.querySelectorAll('h1,h2,h3,h4,div,span')]
          .filter(e=>e.children.length<=2 && e.textContent.trim().startsWith(title)).shift();
        if(dup){ let d=dup; for(let i=0;i<3 && d.parentElement && d.parentElement!==c; i++){
            if(d.getBoundingClientRect().height>28 && d.getBoundingClientRect().height<70) break; d=d.parentElement; }
          d.style.display='none'; } }
      else { c.style.display='none'; }
      return null;
    };
    const miss=[dress('The renewal runway','The renewal runway','KES 21.30M lands in the next six months, and nothing has been decided on any of it',1),
      dress('The risk map','The risk map','Naivas at KES 85M took the longest to agree; four agreements have no end date at all',0),
      dress('Where the value sits','Where the value sits','71% of the book — KES 475.50M — sits in contracts with no category yet',0)].filter(Boolean);
    miss;
  })()`);
  await page.waitForTimeout(600); await shot('J4-insights-grammar');

  /* ================= REQUESTS: a request is a row ================= */
  await view('intake',2000);
  const mReq=await page.evaluate(G+`
    const rows=[...document.querySelectorAll('.ik-row')];
    const meta=[['Close read','Tomás Wanjiku','1 day over','ruby','Their paper · KES 17.8M · a counterparty we have not dealt with'],
      ['Routine','Tomás Wanjiku','2 hours left','amber','On file · no change asked for · same terms as last year'],
      ['Cleared by a lane','—','done in 4 min','green','Our template · no money · nothing outside the playbook'],
      ['Standard','Unassigned','Thu 18 Sept','gray','Their paper · personal data · no counterparty on file']];
    rows.forEach((r,i)=>{
      const m=meta[i%4];
      const ref=(r.textContent.match(/REQ-[A-Z0-9]+/)||[''])[0];
      const title=(r.querySelector('h4,h3,strong,b')||{}).textContent||r.textContent.split('\\n').map(s=>s.trim()).filter(Boolean)[1]||'Request';
      const openState = i===0;
      r.style.cssText=SEC+(openState?';border-left:3px solid var(--st-ruby-dot)':'');
      const head='<div style="'+HEAD+(openState?';border-bottom:1px solid var(--rule-faint)':'')+'">'
        +'<span style="font-family:var(--font-code);font-size:var(--t-meta);color:var(--color-neutral-600);flex:none">'+ref+'</span>'
        +'<h3 style="'+HT+'">'+title+'</h3>'
        +'<span style="'+SUM+'">'+m[4]+'</span>'
        +'<span style="font-size:var(--t-meta);color:var(--st-'+m[3]+'-fg);font-weight:var(--w-strong);flex:none">'+m[0]+'</span>'
        +'<span style="font-size:var(--t-meta);color:var(--color-neutral-600);flex:none">'+m[1]+'</span>'
        +'<span style="font-size:var(--t-meta);color:var(--st-'+m[3]+'-fg);font-weight:var(--w-strong);flex:none;width:96px;text-align:right">'+m[2]+'</span>'
        +chev(openState)+'</div>';
      const F='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 24px;padding:12px 16px 4px';
      const fld=(l,v)=>'<div><div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:1px">'+l+'</div>'
        +'<div style="font-size:var(--t-body);font-weight:var(--w-strong)">'+v+'</div></div>';
      const body=openState?('<div style="padding:12px 16px 0"><p style="margin:0;font-size:var(--t-body);color:var(--color-neutral-600)">Mombasa Haulage sent their own paper for the coast route, about KES 17.8M.</p></div>'
        +'<div style="'+F+'">'+fld('Raised by','Amina Otieno')+fld('Raised','16 September')+fld('Counterparty','Mombasa Haulage Co')+fld('Value stream','Warehousing &amp; Distribution')+'</div>'
        +'<div style="display:flex;gap:8px;padding:10px 16px 13px;flex-wrap:wrap"><button type="button" class="ui-btn ui-btn-primary" style="font-size:var(--t-label);padding:5px 12px">Draft it</button>'
        +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 12px">Decline</button>'
        +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 12px">Ask the requester for more</button>'
        +'<button type="button" class="ui-btn" style="font-size:var(--t-label);padding:5px 12px">Copy the tracker link</button></div>'):'';
      r.innerHTML=head+body;
    });
    const h3=[...document.querySelectorAll('h3')].find(x=>/Waiting to be picked up/.test(x.textContent));
    if(h3){ const s=document.createElement('span');
      s.style.cssText='margin-left:14px;font-size:var(--t-meta);font-weight:400;color:var(--color-neutral-600)';
      s.textContent='· 1 past its date · median 1.4 days this month'; h3.appendChild(s); }
    ({rows:rows.length});
  `);
  console.log('requests',JSON.stringify(mReq));
  await page.waitForTimeout(400); await shot('J5-requests-grammar');
  console.log('AFTER requests', JSON.stringify(await page.evaluate(()=>({
    fourRows: [...document.querySelectorAll('.ik-row')].slice(0,4).reduce((n,r)=>n+r.getBoundingClientRect().height,0)|0,
    visible: [...document.querySelectorAll('.ik-row')].filter(r=>r.getBoundingClientRect().bottom<880).length }))));
  await b.close(); process.exit(0);
})().catch(e=>{console.error('FAILED',e);process.exit(1);});
