// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* ============================================================
   AI CONTRACT SCAN  (rule engine over live contract data)
   ============================================================ */
// Severity chips use the design's exact warm hexes (arbitrary Tailwind values
// so existing `${sm.chip}` className call-sites keep working unchanged).
const SEV_META = {
  high:{label:'High', chip:'bg-[#F4E2DD] text-[#9A342A] border-[#E6C9C1]', dot:'bg-[#B23A2E]', text:'text-[#9A342A]'},
  med:{label:'Medium', chip:'bg-[#F0E6CF] text-[#8A5E1B] border-[#E2D2AE]', dot:'bg-[#C79A3E]', text:'text-[#8A5E1B]'},
  low:{label:'Low', chip:'bg-[#ECE7DC] text-[#6B6559] border-[#DED5C6]', dot:'bg-[#9A9484]', text:'text-[#6B6559]'},
};
const SEV_RANK = {high:3, med:2, low:1};
const KIND_LABEL = {risk:'Risk', missing:'Missing', ambiguity:'Ambiguity'};

function scanRules(c){
  if(isUpload(c)) return uploadScanRules(c);
  const F=[], f=c.fields||{};
  const add=(id,sev,kind,title,anchor,what,why,fix)=>F.push({id,sev,kind,title,anchor,what,why,fix});
  const valAnchor = c.template==='ND' ? 'c1' : 'c2';

  // --- generic, data-driven (auto-clear when fixed) ---
  if(!c.counterparty) add('g-cp','high','missing','No counterparty named','recital',
    `The opening recital names ${FIRST_PARTY} but leaves the counterparty blank.`,
    'A contract with an unnamed party is unenforceable — there is no legal person to hold to its terms or serve notice on.',
    'Enter the counterparty\u2019s full registered name (as it appears on the BRS register) in the recital.');
  if(isMonetary(c) && !(Number(c.value)>0)) add('g-val','med','missing','Contract value not set',valAnchor,
    'The commercial value field reads KES 0 or is empty.',
    'Without a stated consideration the pricing clause is incomplete, and downstream stamp duty and approval thresholds cannot be assessed.',
    'Set the agreed KES value in the highlighted field \u2014 the deal summary and dashboard will sync automatically.');
  if(!f.effDate) add('g-date','med','missing','No effective date','recital',
    'The commencement date field in the recital is empty.',
    'Obligations, term length and notice periods all count from this date; leaving it open invites disputes about when duties began.',
    'Pick the effective date in the recital\u2019s date field.');
  if(c.status!=='Signed' && !c.compliance.consent) add('g-comp','low','missing','Intent-to-sign not yet confirmed','sig',
    'The signer has not yet confirmed intent to sign electronically.',
    'A recorded intent-to-sign strengthens attribution of the electronic signature under the Business Laws (Amendment) Act 2020.',
    'Tick the intent-to-sign consent box in the verification panel before signing.');

  // --- template-specific (tuned to FMCG contract types & Kenyan practice) ---
  if(c.template==='RM'){
    if(!f.material) add('rm-mat','med','missing','Material not specified','recital',
      'The recital leaves the material description blank.',
      'An unspecified input makes the specification, quality and rejection clauses unworkable and invites delivery disputes.',
      'Name the material and grade in the recital (e.g. \u201cICUMSA 45 refined white sugar\u201d).');
    add('rm-kebs','med','risk','KEBS/EAS standard not cited','c3',
      'The quality clause references a specification generally but names no KEBS/EAS standard number.',
      'For food-grade inputs, an unnamed standard makes rejection hard to enforce and risks non-compliant material entering production.',
      'Cite the applicable KEBS/EAS standard and make conformity a condition of acceptance.');
    add('rm-index','low','ambiguity','Price index unnamed','c2',
      'Pricing is \u201creviewed against commodity indices\u201d without naming one.',
      'Different indices move differently; an unnamed benchmark invites a pricing dispute at every quarterly review.',
      'Name the specific published index and state the review formula.');
    if(Number(c.value)>50000000) add('rm-sec','med','missing','No alternate-source / security of supply','c1',
      `At ${fmtKESshort(c.value)} a year this is a critical input, yet nothing addresses supply failure.`,
      'A single-source dependency at this scale can halt production if the supplier defaults.',
      'Add a business-continuity clause: safety stock, an approved alternate source, or step-in rights.');
  }
  if(c.template==='PK'){
    add('pk-ip','med','risk','Artwork / trademark ownership not explicit','c4',
      'IP is mentioned only briefly; ownership of dies, plates and artwork is not spelled out.',
      'If the supplier claims rights over tooling or artwork, a switch of supplier can be blocked or delayed.',
      'State expressly that all artwork, trademarks and Buyer-funded tooling remain the Buyer\u2019s property, returnable on request.');
    add('pk-moq','low','ambiguity','MOQ & obsolete-stock liability not addressed','c3',
      'Forecast and safety stock are covered, but minimum order quantities and who carries obsolete artwork stock are not.',
      'On an artwork change, unsold old-artwork packaging becomes a write-off nobody has agreed to fund.',
      'Set MOQs and agree that the Buyer funds obsolete stock only where it gave firm commitments.');
  }
  if(c.template==='CM'){
    add('cm-fs','high','risk','Food-safety certification not evidenced','c3',
      'The agreement requires FSSC 22000 / KEBS certification but attaches no current certificate.',
      'A lapsed co-packer certificate exposes the brand owner to recalls and Public Health / KEBS enforcement on its own label.',
      'Attach the current certificate and make continuous renewal a condition, with audit rights on notice.');
    add('cm-recall','high','missing','No product recall & traceability clause','c4',
      'Liability is noted generally but there is no defined recall process or batch traceability obligation.',
      'Without agreed recall roles and cost allocation, a contamination event becomes a dispute while product is still on shelf.',
      'Add a recall clause: batch coding, mock-recall tests, notification timelines and cost allocation by fault.');
    add('cm-ip','med','missing','Formulation IP protection is thin','c1',
      'The clause states the Brand Owner owns recipes but adds no non-compete or non-use protection.',
      'A co-packer that also makes competitor or own-label products could leak or reuse the formulation.',
      'Add a non-use / non-compete covenant on the specific formulation and ring-fence production records.');
  }
  if(c.template==='EQ'){
    if(!f.equipment) add('eq-eq','med','missing','Equipment not described','recital',
      'The equipment description in the recital is blank.',
      'The lease, insurance and maintenance obligations all attach to a defined asset; without it the contract is uncertain.',
      'Describe the equipment, make/model and serial number in the recital or a schedule.');
    add('eq-credit','med','missing','No uptime service credits','c3',
      'An uptime target is stated but nothing happens if the Lessor misses it.',
      'A target with no remedy is unenforceable in practice \u2014 downtime on a filling line directly stops sales.',
      'Add service credits against the monthly charge for each band of missed uptime.');
    add('eq-title','low','risk','Ownership on Lessor insolvency unclear','c1',
      'Title stays with the Lessor, but the Lessee\u2019s position if the Lessor becomes insolvent is not addressed.',
      'On the Lessor\u2019s insolvency the Lessee could lose access to equipment its production depends on.',
      'Add quiet-enjoyment and step-in / purchase-option protection on Lessor insolvency.');
  }
  if(c.template==='WH'){
    add('wh-temp','high','risk','Cold-chain excursion remedy missing','c3',
      'Temperature logging is required, but the consequence of an excursion (who bears spoiled stock) is not stated.',
      'For dairy and chilled goods a single excursion can write off a whole consignment; silence means a dispute, not a claim.',
      'Define excursion thresholds, mandatory quarantine, and Provider liability for stock spoiled outside range.');
    add('wh-ins','med','missing','Liability cap may sit below stock value','c4',
      'Liability is capped at \u201cstock value\u201d but no warehouse-keeper\u2019s insurance is required.',
      'If the Provider is uninsured, a fire or flood loss becomes an unrecoverable debt rather than an insurance claim.',
      'Require the Provider to carry warehouse-keeper\u2019s liability cover to the peak stock value, evidenced annually.');
  }
  if(c.template==='FF'){
    if(!f.region) add('ff-reg','med','missing','Distribution territory unspecified','recital',
      'The territory / lane field in the recital is blank.',
      'Rates, transit times and OTIF all depend on the named lanes; leaving them open invites billing and SLA disputes.',
      'Name the lanes or region (e.g. \u201cNairobi \u2013 Mombasa primary + coastal secondary\u201d).');
    add('ff-otif','med','ambiguity','OTIF penalty not defined','c3',
      'An OTIF target is set but carries no service credit or penalty for misses.',
      'Without a remedy the target is aspirational, and repeated late deliveries erode trade fill rates with no recourse.',
      'Attach service credits or penalties to defined OTIF bands, tiered by channel priority.');
    if(Number(c.value)>5000000) add('ff-ins','low','risk','Goods-in-transit insurance silent','c4',
      `At ${fmtKESshort(c.value)} of annual flows the agreement does not require goods-in-transit cover.`,
      'An uninsured hijack or accident lands as a dispute over the liability cap instead of a clean claim.',
      'Require the Carrier to maintain goods-in-transit insurance to full consignment value, Principal as loss payee.');
  }
  if(c.template==='DA'){
    add('da-credit','high','risk','Distributor credit inadequately secured','c3',
      'A credit limit is granted; confirm the bank guarantee is in place and covers the peak exposure.',
      'Distributor default on open credit is the single most common bad-debt loss in Kenyan FMCG route-to-market.',
      'Hold a bank guarantee or post-dated security sized to peak exposure and review it quarterly.');
    add('da-excl','med','ambiguity','Exclusivity vs. territory unclear','c1',
      'The appointment is \u201cnon-exclusive\u201d but sets a single-territory restriction, which reads inconsistently.',
      'Ambiguity over exclusivity fuels channel-conflict disputes when another distributor sells into the area.',
      'State clearly whether the territory is exclusive, and define permitted cross-territory sales.');
    add('da-perf','low','missing','No minimum-performance termination trigger','c4',
      'Termination is on notice only, with no link to missed volume targets.',
      'A weak distributor can hold a territory indefinitely while under-serving it, with no clean exit.',
      'Add a right to terminate or de-scope the territory on sustained failure to hit agreed targets.');
  }
  if(c.template==='RL'){
    if(Number(f.payDays||60)>45) add('rl-pay','med','risk','Payment terms strain working capital',valAnchor,
      `Payment terms are ${Number(f.payDays||60)} days \u2014 well beyond the 30\u201345 days that keeps cash healthy.`,
      'Long modern-trade terms on high volumes tie up working capital and magnify the risk if the retailer delays.',
      'Negotiate toward 30\u201345 days, or price the cost of the extended terms into the trading margin.');
    add('rl-listing','low','ambiguity','Listing fees & rebates not itemised','c2',
      'Trading terms bundle listing fees and rebates without an itemised schedule.',
      'Un-itemised trade spend is where margin quietly leaks and reconciliation disputes begin.',
      'Itemise listing fees, rebates and promotional support in a costed Annexure A.');
    add('rl-return','med','missing','Short-dated returns liability unclear','c3',
      'Returns are mentioned but the split of short-dated / damaged stock liability is not defined.',
      'Retailers often push short-dated stock back; without clear rules this becomes an unbudgeted write-off.',
      'Define return windows, condition criteria and who bears short-dated stock by cause.');
  }
  if(c.template==='MK'){
    add('mk-rebate','med','ambiguity','Media rebate transparency not guaranteed','c3',
      'The clause says rebates are passed back but requires no audit or disclosure of media buys.',
      'Undisclosed agency media rebates are a well-known leakage; without audit rights the Client cannot verify pass-back.',
      'Add media-transparency and audit rights over buys, rates and rebates.');
    add('mk-ip','med','risk','Campaign IP vests only on full payment','c4',
      'IP vests \u201con payment\u201d, which can strand rights if a dispute pauses a final invoice.',
      'A withheld final payment could leave the Client unable to use campaign assets it largely funded.',
      'Provide a licence to use delivered work pending payment, with full assignment on settlement.');
    add('mk-appr','low','missing','Spend approval threshold unset','c3',
      'All spend needs approval, but no monetary threshold or delegation is defined.',
      'Without thresholds, either every small cost needs sign-off (slow) or large spend slips through (risk).',
      'Set an approval matrix with KES thresholds and named approvers.');
  }
  if(c.template==='ND'){
    const term=Number(f.termYears||3);
    if(term>5) add('nd-term','med','ambiguity','Confidentiality term exceeds market norm','c3',
      `The term is set to ${term} years \u2014 beyond the 2\u20135 years typical for commercial NDAs in Kenya.`,
      'Overlong terms are harder to enforce and may be read down by a court as an unreasonable restraint.',
      'Reduce to 3\u20135 years, or give trade secrets an indefinite tail while other information expires.');
    add('nd-inj','low','missing','No injunctive-relief clause','c2',
      'The agreement is silent on equitable remedies.',
      'Damages arrive too late for a confidentiality breach \u2014 the value is in stopping disclosure fast.',
      'Add wording acknowledging irreparable harm and permitting interim injunctions in the High Court at Nairobi.');
  }
  if(c.template==='LE'){
    if(!f.deposit) add('le-dep','high','missing','Security deposit not specified','c3',
      'Clause 3 references a deposit but the amount field is blank.',
      'Without a stated deposit there is no defined security against dilapidations or arrears.',
      'Enter the deposit \u2014 market practice in Nairobi is around 3 months\u2019 gross rent for commercial space.');
    add('le-stamp','med','risk','Stamp duty not evidenced','c4',
      'Nothing records assessment or payment of stamp duty.',
      'Leases attract stamp duty under the Stamp Duty Act (Cap 480); an unstamped lease is inadmissible in evidence until duty and penalties are paid.',
      'Assess and pay stamp duty via iTax within 30 days of execution and attach the certificate.');
    add('le-esc','low','missing','No rent escalation clause','c2',
      `Rent is fixed for the ${Number(f.termYears||6)}-year term with no review mechanism.`,
      'Over a multi-year lease, flat rent shifts inflation risk to one side and invites informal renegotiation disputes.',
      'Add a periodic escalation (commonly 7.5% every 2 years) or an open-market rent review.');
  }
  if(c.template==='PS'){
    add('ps-cap','med','risk','Liability cap may be too low','c4',
      'Liability is capped at the fees paid, which for a low-fee engagement can be far below the exposure created.',
      'On audit or regulatory advice, a capped-at-fees limit may leave the Client under-protected against a costly error.',
      'Size the cap to the risk (a multiple of fees or a fixed KES amount) and carve out negligence.');
    add('ps-indep','low','missing','Independence / conflicts not addressed','c3',
      'The engagement is silent on conflicts of interest and independence.',
      'For audit and legal work, an undisclosed conflict can invalidate the work and create regulatory exposure.',
      'Add an independence and conflict-check clause with ongoing disclosure duties.');
  }
  return F;
}

const openFindings = c => !c.scan ? [] : c.scan.findings.filter(x=>!c.scan.dismissed.includes(x.id));
const worstSevOf = list => list.reduce((w,x)=>SEV_RANK[x.sev]>SEV_RANK[w]?x.sev:w,'low');
function runScan(c){
  const prev = c.scan ? c.scan.dismissed : [];
  c.scan = { at:new Date().toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'}), findings:scanRules(c), dismissed:prev };
}

window.scanUI = { running:false, filter:'all', expanded:new Set() };

function renderScanSection(c){
  const host = document.getElementById('scan-section'); if(!host) return;
  const open = openFindings(c);
  const worst = open.length ? worstSevOf(open) : null;

  let body;
  if(scanUI.running){
    body = `<div class="flex items-center gap-2.5 rounded-lg bg-brand-50 border border-brand-100 px-3 py-2.5 text-xs text-brand-700">
      <span class="scan-pulse text-brand-500">${icon('scan','w-4 h-4')}</span>
      <span>Scanning clauses against Kenyan practice checks\u2026</span></div>`;
  } else if(!c.scan){
    body = `
      <p class="text-xs text-brand-800/70 leading-relaxed">${isUpload(c)?'Run an AI review checklist over this received document \u2014 governing law, liability, payment and exit terms to confirm before you sign, tuned to Kenyan practice.':'Review this contract against risk checks tuned for Kenyan practice \u2014 missing clauses, enforceability gaps and market-norm deviations, each pinned to the clause it concerns.'}</p>
      <button id="scan-run" class="mt-3 w-full flex items-center justify-center gap-2 rounded-lg bg-brand-900 text-white py-2.5 text-sm font-medium hover:bg-brand-800 transition">${icon('scan')} Run AI scan</button>`;
  } else {
    const list = open.filter(x=>scanUI.filter==='all'||x.sev===scanUI.filter);
    const counts = s => open.filter(x=>x.sev===s).length;
    const chip = (key,label)=>`<button data-scan-filter="${key}" class="text-[10px] px-2 py-0.5 rounded-full border font-medium transition ${scanUI.filter===key?'bg-brand-900 text-white border-brand-900':'bg-white text-brand-700 border-brand-200 hover:border-brand-400'}">${label}</button>`;
    const cards = list.length ? list.map(x=>{
      const sm=SEV_META[x.sev], exp=scanUI.expanded.has(x.id);
      return `
      <div class="rounded-lg border ${exp?'border-brand-300':'border-brand-100'} bg-white overflow-hidden">
        <button data-scan-toggle="${x.id}" class="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-brand-50/50 transition">
          <span class="h-1.5 w-1.5 rounded-full ${sm.dot} shrink-0"></span>
          <span class="text-xs font-medium text-brand-900 flex-1 min-w-0 truncate">${x.title}</span>
          ${x.confidence?`<span class="hidden sm:inline text-[8px] uppercase tracking-wider text-brand-800/35" title="Heuristic confidence">${x.confidence}</span>`:''}
          <span class="text-[9px] uppercase tracking-wider font-semibold ${sm.text}">${sm.label}</span>
          <span class="text-brand-300 transition ${exp?'rotate-180':''}">${icon('chevD','w-3.5 h-3.5')}</span>
        </button>
        ${exp?`
        <div class="px-3 pb-3 space-y-2 border-t border-brand-100/60 pt-2.5">
          <div><div class="text-[9px] font-semibold uppercase tracking-wider text-brand-800/65 mb-0.5">What it says${x.confidence?` · <span class="text-brand-800/35">${x.confidence} confidence</span>`:''}</div><p class="text-[11px] leading-relaxed text-brand-800/80">${x.what}</p></div>
          <div><div class="text-[9px] font-semibold uppercase tracking-wider text-brand-800/65 mb-0.5">Why it matters</div><p class="text-[11px] leading-relaxed text-brand-800/80">${x.why}</p></div>
          <div><div class="text-[9px] font-semibold uppercase tracking-wider text-brand-800/65 mb-0.5">Suggested fix</div><p class="text-[11px] leading-relaxed text-brand-800/80">${x.fix}</p></div>
          <div class="flex items-center gap-2 pt-1">
            <button data-scan-goto="${x.anchor}" class="flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-800 transition">${icon('target','w-3 h-3')} ${x.anchor==='doc'?'Go to document':'Go to clause'}</button>
            <button data-scan-dismiss="${x.id}" class="ml-auto text-[11px] font-medium text-brand-800/65 hover:text-brand-800 transition">Dismiss</button>
          </div>
        </div>`:''}
      </div>`;
    }).join('') : `<div class="text-center text-[11px] text-brand-800/70 py-3">No ${scanUI.filter==='all'?'open':scanUI.filter+'-severity'} findings \u2014 looking clean.</div>`;

    body = `
      <div class="flex items-center gap-1.5 mb-2 flex-wrap">
        ${chip('all',`All ${open.length}`)}${chip('high',`High ${counts('high')}`)}${chip('med',`Med ${counts('med')}`)}${chip('low',`Low ${counts('low')}`)}
      </div>
      <div class="space-y-1.5 max-h-64 overflow-y-auto scroll-thin pr-0.5">${cards}</div>
      <div class="mt-2 flex items-center justify-between text-[10px] text-brand-800/60">
        <span>Scanned ${c.scan.at}</span>
        <button id="scan-rerun" class="font-medium text-brand-600 hover:text-brand-800 transition">Re-scan</button>
      </div>`;
  }

  host.innerHTML = `
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-gold-500">${icon('scan')}</span>
        <h3 class="text-sm font-display font-600 text-brand-900">AI Contract Scan</h3>
        ${(!scanUI.running && c.scan) ? `<span class="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${open.length?SEV_META[worst].chip:'bg-brand-50 text-brand-700 border-brand-200'}">${open.length?`${open.length} open`:'All clear'}</span>` : ''}
      </div>
      ${body}
    </div>`;

  // wiring
  host.querySelector('#scan-run')?.addEventListener('click',()=>{
    scanUI.running=true; renderScanSection(c);
    setTimeout(()=>{ runScan(c); scanUI.running=false; scanUI.filter='all'; scanUI.expanded=new Set();
      const n=openFindings(c).length;
      logAudit(c,'Scanned',`AI contract scan run \u2014 ${n} open finding${n===1?'':'s'}`);
      persist(c);
      renderScanSection(c); renderSignButton(c); renderAuditSection(c);
      toast(n?`Scan complete \u2014 ${n} finding${n===1?'':'s'} pinned to clauses`:'Scan complete \u2014 no issues found');
    }, 1100);
  });
  host.querySelector('#scan-rerun')?.addEventListener('click',()=>{
    scanUI.running=true; renderScanSection(c);
    setTimeout(()=>{ runScan(c); scanUI.running=false; persist(c); renderScanSection(c); renderSignButton(c); toast('Re-scan complete \u2014 findings refreshed'); }, 700);
  });
  host.querySelectorAll('[data-scan-filter]').forEach(b=>b.addEventListener('click',()=>{ scanUI.filter=b.getAttribute('data-scan-filter'); renderScanSection(c); }));
  host.querySelectorAll('[data-scan-toggle]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.getAttribute('data-scan-toggle');
    scanUI.expanded.has(id)?scanUI.expanded.delete(id):scanUI.expanded.add(id);
    renderScanSection(c);
  }));
  host.querySelectorAll('[data-scan-dismiss]').forEach(b=>b.addEventListener('click',()=>{
    c.scan.dismissed.push(b.getAttribute('data-scan-dismiss'));
    persist(c);
    renderScanSection(c); renderSignButton(c);
  }));
  host.querySelectorAll('[data-scan-goto]').forEach(b=>b.addEventListener('click',()=>{
    const anchor=b.getAttribute('data-scan-goto');
    const el=anchor==='doc' ? document.querySelector('#doc-canvas [data-anchor="doc"]') : document.querySelector(`#doc-canvas [data-anchor="${anchor}"]`);
    if(!el) return;
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.classList.remove('anchor-flash'); void el.offsetWidth; el.classList.add('anchor-flash');
  }));
}

/* ============================================================
   AI ASSISTANT  (local intent engine over live state)
   ============================================================ */
const ai = { open:false, minimized:false, unread:false, history:[] };
const AI_SUGGESTIONS = [
  'What is pending counterparty action?',
  'Total value of signed contracts',
  'Which contract has the highest value?',
  'Find contracts with Naivas',
  'How many drafts do I have?',
  'Which contracts have open risk findings?',
  'What expires in the next 90 days?',
];

function openAI(prefill){
  document.getElementById('ai-panel').classList.add('open');
  document.getElementById('ai-scrim').classList.add('open');
  ai.open=true;
  ai.minimized=false; ai.unread=false; updateAIBadge();   // opening clears the glow
  if(!ai.history.length){
    aiPush('assistant',{text:`Habari! I'm your contract intelligence assistant. I can search, aggregate and summarize everything in your HaTi workspace — try one of the suggestions below, or ask in your own words.`});
  }
  renderAIFeed(); renderAISuggest();
  const inp=document.getElementById('ai-input');
  if(prefill){ inp.value=prefill; aiSubmit(); } else inp.focus();
}
function closeAI(){
  document.getElementById('ai-panel').classList.remove('open');
  document.getElementById('ai-scrim').classList.remove('open');
  ai.open=false;
  ai.minimized=false; updateAIBadge();   // full close: no minimized dot (unread glow may still arrive)
}
/* Minimize: hide the panel but keep the conversation "live" — the launcher
   shows a dot, and pulses if an answer lands while minimized. */
function minimizeAI(){
  document.getElementById('ai-panel').classList.remove('open');
  document.getElementById('ai-scrim').classList.remove('open');
  ai.open=false; ai.minimized=true; updateAIBadge();
}
function clearAIHistory(){
  if(!confirm('Delete this conversation? This cannot be undone.')) return;
  ai.history=[];
  aiPush('assistant',{text:`Habari! I'm your contract intelligence assistant. I can search, aggregate and summarize everything in your HaTi workspace — try one of the suggestions below, or ask in your own words.`});
  renderAIFeed();
  toast('Conversation deleted');
}
/* Launcher badge: solid dot when minimized, pulsing when an unread answer waits. */
function updateAIBadge(){
  const b=document.getElementById('ai-badge'); if(!b) return;
  b.classList.toggle('hidden', !(ai.minimized||ai.unread));
  b.classList.toggle('pulse', ai.unread);
}
function aiPush(role,payload){ ai.history.push({role,...payload}); }

function renderAISuggest(){
  const el=document.getElementById('ai-suggest');
  el.innerHTML=AI_SUGGESTIONS.map(q=>`<button data-sug="${q}" class="text-[11px] rounded-full border border-brand-100 bg-canvas hover:bg-brand-50 hover:border-brand-300 px-2.5 py-1 text-brand-700 transition">${q}</button>`).join('');
  el.querySelectorAll('[data-sug]').forEach(b=>b.addEventListener('click',()=>{ document.getElementById('ai-input').value=b.getAttribute('data-sug'); aiSubmit(); }));
}
function renderAIFeed(typing=false){
  const feed=document.getElementById('ai-feed');
  feed.innerHTML=ai.history.map(m=>{
    if(m.role==='user'){
      return `<div class="ai-msg flex justify-end"><div class="max-w-[85%] rounded-2xl rounded-br-md bg-brand-900 text-white px-4 py-2.5 text-sm">${m.text}</div></div>`;
    }
    return `<div class="ai-msg flex gap-2.5">
      <div class="h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3.5 h-3.5')}</div>
      <div class="max-w-[88%] space-y-2">
        ${m.text?`<div class="rounded-2xl rounded-tl-md bg-canvas border border-brand-100 px-4 py-2.5 text-sm text-brand-900 leading-relaxed">${m.text}</div>`:''}
        ${m.cards?m.cards:''}
      </div>
    </div>`;
  }).join('') + (typing?`
    <div class="ai-msg flex gap-2.5">
      <div class="h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-gold-500/15 text-gold-600 mt-0.5">${icon('sparkle','w-3.5 h-3.5')}</div>
      <div class="rounded-2xl rounded-tl-md bg-canvas border border-brand-100 px-4 py-3 typing"><span></span><span></span><span></span></div>
    </div>`:'');
  feed.scrollTop=feed.scrollHeight;
  feed.querySelectorAll('[data-ai-open]').forEach(el=>el.addEventListener('click',()=>{ closeAI(); openWorkspace(el.getAttribute('data-ai-open')); }));
}

function aiContractCard(c){
  return `
  <button data-ai-open="${c.id}" class="w-full text-left flex items-center gap-2.5 rounded-xl border border-brand-100 bg-white hover:border-brand-300 hover:shadow-sm px-3 py-2.5 transition group">
    <span class="h-7 w-7 shrink-0 grid place-items-center rounded-lg bg-brand-50 text-brand-500">${icon(cIcon(c),'w-3.5 h-3.5')}</span>
    <span class="min-w-0 flex-1">
      <span class="block text-xs font-medium text-brand-900 truncate group-hover:text-brand-600 transition">${c.name}</span>
      <span class="block text-[10px] font-mono text-brand-800/65 truncate">${c.counterparty||'—'} · ${!isMonetary(c)?'non-monetary':(c.value?fmtKESshort(c.value):'no value')}</span>
    </span>
    ${statusChip(c.status)}
  </button>`;
}
const aiCards = list => `<div class="space-y-1.5">${list.map(aiContractCard).join('')}</div>`;

/* --- the intent engine --- */
function aiAnswer(qRaw){
  const q=qRaw.toLowerCase();
  const cs=state.contracts;
  const has=(...words)=>words.some(w=>q.includes(w));

  // 1) direct contract-ID summary
  const idMatch=qRaw.match(/MK-\d+/i);
  if(idMatch||has('summarize','summary','brief me','tell me about')){
    let c=null;
    if(idMatch) c=getContract(idMatch[0].toUpperCase());
    if(!c) c=cs.find(x=>q.includes(x.counterparty.toLowerCase().split(' ')[0]) && x.counterparty);
    if(!c) c=cs.find(x=>x.name.toLowerCase().split(' ').some(w=>w.length>4&&q.includes(w)));
    if(c){
      return { text:`<strong>${c.name}</strong> (${c.id}) is ${isUpload(c)?'an uploaded <strong>external document</strong>':`a ${cKind(c)}`} with <strong>${c.counterparty||'no counterparty yet'}</strong>, filed under ${FOLDERS[c.folder].name}. Value: <strong>${!isMonetary(c)?'non-monetary (no consideration passes)':(c.value?fmtKES(c.value)+(c.valueType==='estimated'?' (estimated)':''):'not set')}</strong> · Status: <strong>${c.status}</strong> · Last action ${c.lastAction}. ${c.status==='Signed'?'It is fully executed with an SHA-256 seal and verified IPRS + PKI compliance.':c.status==='Under Review'?'It is waiting on counterparty action — compliance checks are '+((c.compliance.iprs&&c.compliance.pki)?'complete':'still open')+'.':c.status==='Draft'?'It is still in draft — fill the counterparty and value to move it into review.':'It was declined and is closed without signature.'} There are ${c.comments.length} comments on the thread.${(()=>{ if(!c.scan) return ' It has not been AI-scanned yet.'; const o=openFindings(c); return o.length?` The AI scan shows <strong>${o.length} open finding${o.length===1?'':'s'}</strong> (worst: ${SEV_META[worstSevOf(o)].label.toLowerCase()}).`:' The AI scan is clean — no open findings.'; })()}`,
        cards:aiCards([c]) };
    }
  }

  // 1a) expiry / renewal queries
  if(has('expir','renew','lapse','ending','due soon')){
    const exp=cs.filter(c=>c.expiry && c.status!=='Declined')
      .map(c=>({c,d:Math.ceil((new Date(c.expiry+'T00:00:00')-Date.now())/86400000)}))
      .filter(x=>x.d>=0&&x.d<=90).sort((a,b)=>a.d-b.d);
    if(!exp.length) return { text:`Nothing in the active book lapses in the next 90 days.` };
    const soon=exp.filter(x=>x.d<=30).length;
    return { text:`<strong>${exp.length} contract${exp.length===1?'':'s'}</strong> lapse within 90 days${soon?`, including <strong>${soon} inside 30 days</strong>`:''}. Closest first — ${exp[0].c.name} with ${exp[0].c.counterparty} in <strong>${exp[0].d} days</strong>:`, cards:aiCards(exp.map(x=>x.c)) };
  }
  // 1b) risk / findings / scan queries
  if(has('risk','finding','findings','issue','issues','problem','scan','red flag','exposure')){
    const scanned=cs.filter(c=>c.scan);
    if(!scanned.length) return { text:`No contracts have been scanned yet. Open any contract and hit <strong>Run AI scan</strong> in the workspace — I’ll check its clauses against Kenyan practice and pin every finding to the clause it concerns.` };
    const withOpen=scanned.filter(c=>openFindings(c).length).sort((a,b)=>SEV_RANK[worstSevOf(openFindings(b))]-SEV_RANK[worstSevOf(openFindings(a))]);
    if(!withOpen.length) return { text:`${scanned.length} contract${scanned.length===1?' has':'s have'} been scanned and every finding is resolved or dismissed — the reviewed book is clean.`, cards:aiCards(scanned) };
    const high=withOpen.reduce((s,c)=>s+openFindings(c).filter(x=>x.sev==='high').length,0);
    return { text:`<strong>${withOpen.length} contract${withOpen.length===1?'':'s'}</strong> ${withOpen.length===1?'has':'have'} open scan findings${high?`, including <strong>${high} high-severity</strong>`:''}. Sorted by worst exposure:`, cards:aiCards(withOpen) };
  }
  // 2) pending / under review
  if(has('pending','under review','waiting','counterparty action','awaiting')){
    const list=cs.filter(c=>c.status==='Under Review');
    const val=list.reduce((s,c)=>s+Number(c.value||0),0);
    return { text:`You have <strong>${list.length} contracts pending counterparty action</strong>, worth ${fmtKES(val)} combined. Tap any to open its workspace:`, cards:aiCards(list) };
  }
  // 3) drafts
  if(has('draft')){
    const list=cs.filter(c=>c.status==='Draft');
    return { text:`There are <strong>${list.length} drafts</strong> in your workspace. Drafts move to "Under Review" automatically once a counterparty and value are set.`, cards:aiCards(list) };
  }
  // 4) signed / executed
  if(has('signed','executed','sealed','completed')){
    const list=cs.filter(c=>c.status==='Signed');
    const val=list.reduce((s,c)=>s+Number(c.value||0),0);
    return { text:`<strong>${list.length} contracts are signed and executed</strong> this month, totalling <strong>${fmtKES(val)}</strong>. All carry SHA-256 document seals with IPRS and CAK PKI verification.`, cards:aiCards(list) };
  }
  // 5) declined
  if(has('declined','expired','rejected','lost')){
    const list=cs.filter(c=>c.status==='Declined');
    return { text:`${list.length} contract${list.length===1?'':'s'} closed without signature. Worth a follow-up call:`, cards:aiCards(list) };
  }
  // 6) totals / value analytics
  if(has('total','value','worth','how much','portfolio')){
    const m=metrics();
    const byFolder=Object.values(FOLDERS).map(f=>{
      const v=folderContracts(f.id).filter(c=>c.status!=='Declined').reduce((s,c)=>s+Number(c.value||0),0);
      return `<div class="flex items-center justify-between text-xs py-1.5 border-b border-brand-100/60 last:border-0"><span class="text-brand-800/70">${f.name}</span><span class="font-mono font-medium text-brand-900">${fmtKESshort(v)}</span></div>`;
    }).join('');
    return { text:`Your active portfolio is worth <strong>${fmtKES(m.totalValue)}</strong> across ${cs.filter(c=>c.status!=='Declined').length} live agreements. Breakdown by folder:`,
      cards:`<div class="rounded-xl border border-brand-100 bg-white px-3.5 py-1.5">${byFolder}</div>` };
  }
  // 7) highest / largest
  if(has('highest','largest','biggest','top contract','most valuable')){
    const sorted=[...cs].filter(c=>c.status!=='Declined').sort((a,b)=>b.value-a.value).slice(0,3);
    return { text:`Your highest-value agreement is <strong>${sorted[0].name}</strong> at <strong>${fmtKES(sorted[0].value)}</strong>. Top three by value:`, cards:aiCards(sorted) };
  }
  // 8) counterparty / free-text search
  const terms=q.replace(/[?.,!]/g,'').split(/\s+/).filter(w=>w.length>2&&!['the','and','for','with','find','show','search','contracts','contract','any','all','have','what','which'].includes(w));
  if(terms.length){
    const list=cs.filter(c=>terms.some(t=>(c.name+' '+c.counterparty+' '+FOLDERS[c.folder].name+' '+cKind(c)).toLowerCase().includes(t)));
    if(list.length){
      return { text:`Found <strong>${list.length} contract${list.length===1?'':'s'}</strong> matching "${terms.join(', ')}":`, cards:aiCards(list) };
    }
  }
  // fallback
  return { text:`I couldn't match that to your contract data. I can help with things like: <em>"show pending contracts"</em>, <em>"total value of signed"</em>, <em>"summarize MK-103"</em>, or searching by counterparty name (e.g. <em>"Naivas"</em>).` };
}

function aiSubmit(){
  const inp=document.getElementById('ai-input');
  const q=inp.value.trim(); if(!q) return;
  inp.value='';
  aiPush('user',{text:q});
  renderAIFeed(true);
  setTimeout(()=>{
    const ans=aiAnswer(q);
    aiPush('assistant',ans);
    renderAIFeed();
    // answer arrived while the panel was minimized/closed -> light up the launcher
    if(!ai.open){ ai.unread=true; updateAIBadge(); }
  }, 650+Math.random()*500);
}

document.getElementById('ai-send').addEventListener('click',aiSubmit);
document.getElementById('ai-input').addEventListener('keydown',e=>{if(e.key==='Enter')aiSubmit();});
document.getElementById('ai-close').addEventListener('click',closeAI);
document.getElementById('ai-min').addEventListener('click',minimizeAI);
document.getElementById('ai-clear').addEventListener('click',clearAIHistory);
document.getElementById('ai-scrim').addEventListener('click',closeAI);
// AI is opened from the command bar (#cmd-ai, wired in app.js). The "/" key
// focuses the command-bar search (app.js); Esc closes the AI panel.
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&ai.open) closeAI();
});

Object.assign(window,{AI_SUGGESTIONS,KIND_LABEL,SEV_META,SEV_RANK,ai,aiAnswer,aiCards,aiContractCard,aiPush,aiSubmit,clearAIHistory,closeAI,minimizeAI,openAI,openFindings,renderAIFeed,renderAISuggest,renderScanSection,runScan,scanRules,scanUI,updateAIBadge,worstSevOf});
