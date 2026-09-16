const fs=require('node:fs'), path=require('node:path');
const { chromium } = require('/home/user/mkataba-clm/node_modules/playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const { CONTRACTS } = require('/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/seed.js');
const OUT='/tmp/claude-0/-home-user-mkataba-clm/54a1252e-7fd0-584c-b937-a8fcb2070e56/scratchpad/shots';

const LIB = `
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
  const foot=t=>'<p style="margin:0;padding:0 16px 13px;font-size:var(--t-label);color:var(--color-neutral-600)">'+t+'</p>';
  const secOpen=(title,chipHtml,body,actsHtml,footHtml)=>'<section style="'+SEC+'">'
    +'<div style="'+HEAD+';border-bottom:1px solid var(--rule-faint)"><h3 style="'+H+'">'+title+'</h3>'
      +'<span style="'+SUM+'"></span>'+(chipHtml||'')+chev(1)+'</div>'
    +body+(actsHtml?acts(actsHtml):'')+(footHtml?foot(footHtml):'')+'</section>';
  const secShut=(title,summary,chipHtml)=>'<section style="'+SEC+'">'
    +'<div style="'+HEAD+'"><h3 style="'+H+'">'+title+'</h3>'
      +'<span style="'+SUM+'">'+summary+'</span>'+(chipHtml||'')+chev(0)+'</div></section>';
  const cols=b=>'<div style="'+GRID+'">'+b+'</div>';
  const TH='text-align:left;font-size:var(--t-micro);font-weight:var(--w-title);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);padding:8px 0;border-bottom:1px solid var(--rule-faint)';
  const TD='padding:10px 0;border-bottom:1px solid var(--rule-faint);font-size:var(--t-body)';
`;

const SECTIONS = `
  const renewal='<section style="'+SEC+';border-left:3px solid var(--st-amber-dot)">'
    +'<div style="'+HEAD+'"><h3 style="'+H+'">Renewal decision</h3>'
      +'<span style="'+SUM+'">Decide by <b style="color:var(--color-text)">30 September 2026</b> &mdash; 90 days&rsquo; notice, and it ends 29 December 2026.</span>'
      +chip('14 days left','amber')+'</div>'
    +acts(btn('Serve a notice',1)+btn('Let it renew')+btn('What should we do?'))+'</section>';

  const dealBody=cols(
      f('Contract value','KES 48,000,000','cl. 2')+f('Payment terms','30 days from receipt','cl. 2')
     +f('Volume rebate','3% over 120,000 t','cl. 9')+f('Rebate tiers','2% / 3% / 4.5%','cl. 9')
     +f('Price review','Quarterly, vs indices','cl. 2')+f('Rejection window','3 days from delivery','cl. 3')
     +f('Liability cap','12 months&rsquo; fees','cl. 11')+f('Exclusivity',dash)
     +f('Effective',dash)+f('Expiry','29 December 2026')+f('Notice period','90 days','cl. 18')+f('Governing law','Kenya','cl. 14'));
  const deal=secOpen('The deal', chip('2 departures from your standards','amber'), dealBody,
      btn('Read it against your playbook')+btn('Re-read the wording'),
      'Read from the wording, not typed. An em-dash means the agreement says nothing.');

  const recordBody=cols(
      f('Reference','MK-101')+f('Our party','Highland Corporate Ltd')+f('Counterparty','Kabras Sugar Ltd')+f('Their email',dash)
     +f('Value stream','Procurement &amp; Raw Materials')+f('Template','Raw Material Supply Agreement')
     +f('Owner','Amina Otieno')+f('Status','Executed')
     +f('Raised','23 July 2025')+f('Signed','23 July 2025')+f('Filed by','Amina Otieno')+f('Last updated','12 September 2026'));
  const recordSum='Highland Corporate Ltd and Kabras Sugar Ltd &middot; Procurement &amp; Raw Materials &middot; Raw Material Supply Agreement';

  const docsBody='<div style="padding:2px 16px 8px"><table style="width:100%;border-collapse:collapse;table-layout:fixed">'
    +'<colgroup><col><col style="width:110px"><col style="width:190px"><col style="width:180px"><col style="width:130px"></colgroup>'
    +'<thead><tr><th style="'+TH+'">Document</th><th style="'+TH+'">Required by</th><th style="'+TH+'">On file</th><th style="'+TH+'">Good until</th><th style="'+TH+'"></th></tr></thead><tbody>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Product liability insurance</td><td style="'+TD+'"><span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink)">cl. 8</span></td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">Policy 2026 &middot; PDF</td><td style="'+TD+';color:var(--st-ruby-fg);font-weight:var(--w-strong)">Lapsed 14 Sept</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink);font-weight:var(--w-strong)">Chase them</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">KEBS standard certificate</td><td style="'+TD+'"><span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink)">cl. 1</span></td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">KS 2456:2024</td><td style="'+TD+'">30 April 2027</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink)">Replace</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Food safety (FSSC 22000)</td><td style="'+TD+'"><span style="font-family:var(--font-code);font-size:var(--t-label);color:var(--accent-ink)">cl. 3</span></td>'
      +'<td style="'+TD+';color:var(--color-neutral-500);font-style:italic">Never supplied</td><td style="'+TD+'">'+dash+'</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink);font-weight:var(--w-strong)">Ask for it</a></td></tr>'
    +'</tbody></table></div>';
  const docsSum='Insurance, KEBS certificate, food safety &mdash; one has lapsed';

  const famBody=cols(
      f('Parent','None &mdash; this is the top')+f('Amendments','1')+f('Order forms',dash)+f('Order of precedence','This agreement wins','cl. 21'))
    +'<div style="padding:2px 16px 8px"><table style="width:100%;border-collapse:collapse;table-layout:fixed">'
    +'<colgroup><col style="width:130px"><col><col style="width:190px"><col style="width:160px"></colgroup>'
    +'<thead><tr><th style="'+TH+'">Reference</th><th style="'+TH+'">Document</th><th style="'+TH+'">Signed</th><th style="'+TH+'">Agrees?</th></tr></thead><tbody>'
    +'<tr><td style="'+TD+'"><span style="font-family:var(--font-code);font-size:var(--t-meta);color:var(--accent-ink)">MK-101-A1</span></td>'
      +'<td style="'+TD+';font-weight:var(--w-strong)">Amendment 1 &mdash; price review moved to quarterly</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">4 March 2026</td>'
      +'<td style="'+TD+';color:var(--st-green-fg);font-weight:var(--w-strong)">Agrees</td></tr>'
    +'</tbody></table></div>';
  const famSum='One amendment &middot; no order forms &middot; nothing disagrees';

  const copilotBody='<div style="padding:2px 16px 8px"><table style="width:100%;border-collapse:collapse;table-layout:fixed">'
    +'<colgroup><col style="width:210px"><col><col style="width:150px"><col style="width:150px"></colgroup>'
    +'<thead><tr><th style="'+TH+'">Reading</th><th style="'+TH+'">What it found</th><th style="'+TH+'">When</th><th style="'+TH+'"></th></tr></thead><tbody>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">The brief</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">A two-year sugar supply on our own paper. Watch the quarterly price review &mdash; it is tied to an index with no ceiling.</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">14 Sept 2026</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink)">Read it all</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Against your standards</td>'
      +'<td style="'+TD+';color:var(--st-amber-fg)">2 departures &mdash; payment terms 30 days against your 45, no ceiling on the price review</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">14 Sept 2026</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink);font-weight:var(--w-strong)">Open the review</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Obligations found</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">3 &mdash; two theirs, one ours</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">14 Sept 2026</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink)">Open Obligations</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Risk scan</td>'
      +'<td style="'+TD+';color:var(--color-neutral-500);font-style:italic">Not run on this wording</td>'
      +'<td style="'+TD+'">'+dash+'</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink);font-weight:var(--w-strong)">Run it</a></td></tr>'
    +'<tr><td style="'+TD+';font-weight:var(--w-strong)">Plain English edition</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">Ready &mdash; 21 clauses, read clause by clause</td>'
      +'<td style="'+TD+';color:var(--color-neutral-600)">14 Sept 2026</td>'
      +'<td style="'+TD+'"><a href="#" style="color:var(--accent-ink)">Open it</a></td></tr>'
    +'</tbody></table></div>';
  const copilotSum='Brief written &middot; 2 departures from your standards &middot; risk scan not run';
`;

(async()=>{
  const h=await startHati(); await seedWorkspace(h,{contracts:CONTRACTS});
  const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox']});
  const page=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await page.goto(h.base+'/',{waitUntil:'networkidle'});
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1');
  await page.click('#li-go'); await page.waitForTimeout(3800);
  const rename=()=>page.evaluate(()=>{const t=document.querySelector('[data-room-tab="terms"]'); if(t) t.textContent='Overview';});
  await page.evaluate(()=>openWorkspace('MK-101')); await page.waitForTimeout(2400);
  await page.click('[data-room-tab="terms"]'); await page.waitForTimeout(1800);
  await rename();

  // ---- state 1: how it opens ----
  const m1=await page.evaluate(LIB+SECTIONS+`
    const grid=document.querySelector('.terms-grid');
    grid.style.display='block';
    grid.innerHTML='<div>'+renewal+deal
      +secShut('The record',recordSum,'')
      +secShut('Documents they must hold',docsSum,chip('1 lapsed','ruby'))
      +secShut('Related agreements',famSum,'')
      +secShut('What Copilot read',copilotSum,'')+'</div>';
    const p=grid.firstElementChild;
    ({stack:Math.round(p.getBoundingClientRect().height),track:Math.round(grid.getBoundingClientRect().height)});
  `);
  console.log('DEFAULT', JSON.stringify(m1));
  await page.waitForTimeout(400);
  await page.screenshot({path:path.join(OUT,'H1-overview.png')});

  // ---- state 2: every section open ----
  const m2=await page.evaluate(LIB+SECTIONS+`
    const grid=document.querySelector('.terms-grid');
    grid.style.display='block';
    grid.innerHTML='<div>'+renewal+deal
      +secOpen('The record','<span style="font-size:var(--t-meta);color:var(--color-neutral-600)">What HaTi files this as</span>',recordBody,btn('Edit these details')+btn('Move to another stream'),'')
      +secOpen('Documents they must hold',chip('1 lapsed','ruby'),docsBody,btn('Chase them')+btn('Require another document'),'Chases go to the contact on the contract, never to an address typed here. These are the same rows the Obligations tab tracks.')
      +secOpen('Related agreements','<span style="font-size:var(--t-meta);color:var(--color-neutral-600)">One amendment</span>',famBody,btn('Create an amendment')+btn('Link an existing document')+btn('Check the family'),'')
      +secOpen('What Copilot read',chip('2 departures','amber'),copilotBody,btn('Read it all again'),'Every reading says when it was made. A reading older than the wording is offered again rather than trusted.')
      +'</div>';
    const p=grid.firstElementChild;
    ({stack:Math.round(p.getBoundingClientRect().height),track:Math.round(grid.getBoundingClientRect().height)});
  `);
  console.log('ALL OPEN', JSON.stringify(m2));
  await page.setViewportSize({width:1440,height:1820});
  await page.waitForTimeout(900);
  await page.evaluate(()=>{const g=document.querySelector('.terms-grid'); if(g){g.style.height='auto';g.style.overflow='visible';}});
  await page.waitForTimeout(500);
  await page.screenshot({path:path.join(OUT,'H3-overview-open.png')});
  await page.setViewportSize({width:1440,height:900});
  await page.waitForTimeout(600);

  // ---- the NDA, renamed ----
  await page.evaluate(()=>openWorkspace('MK-121')); await page.waitForTimeout(2200);
  await page.click('[data-room-tab="terms"]'); await page.waitForTimeout(1600);
  await rename();
  await page.evaluate(LIB+`
    const grid=document.querySelector('.terms-grid');
    grid.style.display='block';
    const ndaBody='<div style="'+GRID+'">'
      +f('Contract value','No money passes')+f('Effective',dash)+f('Expiry','20 November 2027')+f('Notice period',dash)
      +f('Confidentiality','3 years','cl. 4')+f('Governing law','Kenya','cl. 9')+f('Liability cap',dash)+f('Exclusivity',dash)
      +'</div>';
    grid.innerHTML='<div>'
      +secOpen('The deal','',ndaBody,btn('Read it against your playbook'),'Read from the wording, not typed.')
      +secShut('The record','Highland Corporate Ltd and Givaudan East Africa &middot; Corporate &amp; Compliance &middot; Mutual NDA','')
      +secShut('Related agreements','A standalone agreement','')
      +secShut('What Copilot read','Not written yet','')+'</div>';
  `);
  await page.waitForTimeout(400);
  await page.screenshot({path:path.join(OUT,'H2-overview-nda.png')});
  await b.close(); process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
