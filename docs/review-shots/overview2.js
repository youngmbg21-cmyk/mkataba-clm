const fs=require('node:fs'), path=require('node:path');
const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
const OUT='/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/shots';

const BUILD = `(()=>{
  const grid=document.querySelector('.terms-grid'); if(!grid) return 'no grid';
  const SEC='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);margin-bottom:10px';
  const HEAD='display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer';
  const H='margin:0;font-size:var(--t-card);font-weight:var(--w-strong);font-family:var(--font-heading);flex:none';
  const SUM='font-size:var(--t-meta);color:var(--color-neutral-600);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
  const GRID='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 24px;padding:2px 16px 14px';
  const chip=(t,tone)=>'<span style="font-size:var(--t-label);font-weight:var(--w-strong);color:var(--st-'+tone+'-fg);background:var(--st-'+tone+'-bg);border-radius:var(--radius);padding:2px 8px;flex:none">'+t+'</span>';
  const chev=o=>'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.5" style="flex:none;transform:rotate('+(o?'0':'-90')+'deg)"><path d="M4 6l4 4 4-4"/></svg>';
  const f=(l,v,cl,tone)=>'<div style="min-width:0">'
    +'<div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:1px">'+l+'</div>'
    +'<div style="display:flex;align-items:baseline;gap:6px;min-width:0">'
    +'<span style="font-size:var(--t-body);font-weight:var(--w-strong);'+(tone?'color:'+tone+';':'')+'min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v+'</span>'
    +(cl?'<span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink);border:1px solid var(--color-accent-200);background:var(--color-accent-50);border-radius:var(--radius);padding:0 5px;flex:none">'+cl+'</span>':'')
    +'</div></div>';
  const dash='<span style="color:var(--color-neutral-500);font-weight:400">&mdash;</span>';
  const btn=(t,pri)=>'<button type="button" class="ui-btn'+(pri?' ui-btn-primary':'')+'" style="font-size:var(--t-label);padding:5px 12px">'+t+'</button>';
  const acts=h=>'<div style="display:flex;gap:8px;padding:0 16px 13px;flex-wrap:wrap">'+h+'</div>';
  const open=(title,chipHtml,body,actsHtml)=>'<section style="'+SEC+'">'
    +'<div style="'+HEAD+';border-bottom:1px solid var(--rule-faint)"><h3 style="'+H+'">'+title+'</h3>'
      +'<span style="'+SUM+'"></span>'+(chipHtml||'')+chev(1)+'</div>'
    +'<div style="'+GRID+'">'+body+'</div>'+(actsHtml?acts(actsHtml):'')+'</section>';
  const shut=(title,summary,chipHtml)=>'<section style="'+SEC+'">'
    +'<div style="'+HEAD+'"><h3 style="'+H+'">'+title+'</h3>'
      +'<span style="'+SUM+'">'+summary+'</span>'+(chipHtml||'')+chev(0)+'</div></section>';

  const renewal='<section style="'+SEC+';border-left:3px solid var(--st-amber-dot)">'
    +'<div style="'+HEAD+'"><h3 style="'+H+'">Renewal decision</h3>'
      +'<span style="'+SUM+'">Decide by <b style="color:var(--color-text)">30 September 2026</b> &mdash; 90 days&rsquo; notice, and it ends 29 December 2026.</span>'
      +chip('14 days left','amber')+'</div>'
    +acts(btn('Serve a notice',1)+btn('Let it renew')+btn('What should we do?'))+'</section>';

  const deal=open('The deal', chip('2 departures from your standards','amber'),
      f('Contract value','KES 48,000,000','cl. 2')+f('Payment terms','30 days from receipt','cl. 2')
     +f('Volume rebate','3% over 120,000 t','cl. 9')+f('Rebate tiers','2% / 3% / 4.5%','cl. 9')
     +f('Price review','Quarterly, vs indices','cl. 2')+f('Rejection window','3 days from delivery','cl. 3')
     +f('Liability cap','12 months&rsquo; fees','cl. 11')+f('Exclusivity',dash)
     +f('Effective',dash)+f('Expiry','29 December 2026')+f('Notice period','90 days','cl. 18')+f('Governing law','Kenya','cl. 14'),
      btn('Read it against your playbook')+btn('Re-read the wording'));

  const record=shut('The record','Highland Corporate Ltd and Kabras Sugar Ltd &middot; Procurement &amp; Raw Materials &middot; Raw Material Supply Agreement','');
  const docs=shut('Documents they must hold','Insurance, KEBS certificate, food safety &mdash; one has lapsed', chip('1 lapsed','ruby'));
  const family=shut('Related agreements','A standalone agreement &mdash; no amendments or addenda are linked to it','');
  const brief=shut('What Copilot read','Not written yet &mdash; Copilot reads the wording and explains it in plain English','');

  grid.style.display='block';
  grid.innerHTML='<div>'+renewal+deal+record+docs+family+brief+'</div>';
  const page=grid.firstElementChild;
  return { stack:Math.round(page.getBoundingClientRect().height), track:Math.round(grid.getBoundingClientRect().height),
    scrolls: page.getBoundingClientRect().height > grid.getBoundingClientRect().height+2 };
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
  console.log('OVERVIEW', JSON.stringify(await page.evaluate(BUILD)));
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(OUT,'H1-overview.png')});
  // and an ordinary contract: no renewal window, no money, no documents
  await page.evaluate(()=>openWorkspace('MK-121')); await page.waitForTimeout(2200);
  await page.click('[data-room-tab="terms"]'); await page.waitForTimeout(1600);
  console.log('PLAIN NDA', JSON.stringify(await page.evaluate(`(()=>{
    const grid=document.querySelector('.terms-grid');
    const SEC='background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-sm);border-radius:var(--radius);margin-bottom:10px';
    const HEAD='display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer';
    const H='margin:0;font-size:var(--t-card);font-weight:var(--w-strong);font-family:var(--font-heading);flex:none';
    const SUM='font-size:var(--t-meta);color:var(--color-neutral-600);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    const GRID='display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px 24px;padding:2px 16px 14px';
    const chev=o=>'<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--color-neutral-500)" stroke-width="1.5" style="flex:none;transform:rotate('+(o?'0':'-90')+'deg)"><path d="M4 6l4 4 4-4"/></svg>';
    const f=(l,v,cl)=>'<div style="min-width:0"><div style="font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);margin-bottom:1px">'+l+'</div><div style="display:flex;align-items:baseline;gap:6px;min-width:0"><span style="font-size:var(--t-body);font-weight:var(--w-strong);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+v+'</span>'+(cl?'<span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink);border:1px solid var(--color-accent-200);background:var(--color-accent-50);border-radius:var(--radius);padding:0 5px;flex:none">'+cl+'</span>':'')+'</div></div>';
    const dash='<span style="color:var(--color-neutral-500);font-weight:400">&mdash;</span>';
    const open=(t,body)=>'<section style="'+SEC+'"><div style="'+HEAD+';border-bottom:1px solid var(--rule-faint)"><h3 style="'+H+'">'+t+'</h3><span style="'+SUM+'"></span>'+chev(1)+'</div><div style="'+GRID+'">'+body+'</div></section>';
    const shut=(t,s)=>'<section style="'+SEC+'"><div style="'+HEAD+'"><h3 style="'+H+'">'+t+'</h3><span style="'+SUM+'">'+s+'</span>'+chev(0)+'</div></section>';
    grid.style.display='block';
    grid.innerHTML='<div>'+open('The deal', f('Contract value','No money passes')+f('Effective',dash)+f('Expiry','20 November 2027')+f('Notice period',dash)+f('Confidentiality','3 years','cl. 4')+f('Governing law','Kenya','cl. 9')+f('Liability cap',dash)+f('Exclusivity',dash))
      +shut('The record','Highland Corporate Ltd and Givaudan East Africa &middot; Corporate &amp; Compliance &middot; Mutual NDA')
      +shut('Related agreements','A standalone agreement')
      +shut('What Copilot read','Not written yet')+'</div>';
    const p=grid.firstElementChild;
    return { stack:Math.round(p.getBoundingClientRect().height), track:Math.round(grid.getBoundingClientRect().height) };
  })()`)));
  await page.waitForTimeout(400);
  await page.screenshot({path:path.join(OUT,'H2-overview-nda.png')});
  await b.close(); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
