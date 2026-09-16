// HaTi — extracted module (E0). Globals are window-attached on
// purpose: the app is written against a single global scope (inline
// onclick handlers, cross-module calls); modules give file isolation
// for editing, not scope isolation.
/* Folders follow the FMCG value stream, from raw materials to market.
   Each carries a distinct `color` — the single source of truth for the
   category colour used by card edge-stripes, the map and reports. */
const FOLDERS = {
  proc:  { id:'proc',  name:'Procurement & Raw Materials', ic:'leaf',      color:'#2e9f80', desc:'Ingredient, commodity and packaging supply into the plants.' },
  mfg:   { id:'mfg',   name:'Manufacturing & Production',  ic:'factory',   color:'#b45309', desc:'Co-packing, tolling and plant equipment agreements.' },
  dist:  { id:'dist',  name:'Warehousing & Distribution',  ic:'truck',     color:'#0369a1', desc:'3PL warehousing, cold chain and primary distribution.' },
  sales: { id:'sales', name:'Sales & Route-to-Market',     ic:'store',     color:'var(--st-amber-dot)', desc:'Distributor, modern-trade and e-commerce supply deals.' },
  mktg:  { id:'mktg',  name:'Marketing & Brand',           ic:'megaphone', color:'#7c3aed', desc:'Agency, media, activation and sponsorship contracts.' },
  corp:  { id:'corp',  name:'Corporate & Compliance',      ic:'briefcase', color:'var(--st-green-dot)', desc:'NDAs, leases, audit, legal and IT / professional services.' },
};

/* ---- Custom value streams ("folders") ----------------------------------
   Users can create their own named folders when filing contracts. They are
   persisted to localStorage and merged into FOLDERS on load, so every
   dropdown, filter chip, card stripe, map cluster and report grouping picks
   them up automatically (they all read from FOLDERS). templates.js loads
   before core.js, so this uses localStorage directly rather than lsGet. */
const FOLDER_LS = 'hati.v1.folders';
// palette cycled for new custom folders, kept distinct from the six built-ins
const CUSTOM_FOLDER_COLORS = ['#c2410c','#0e7490','#be123c','#4d7c0f','#1d4ed8','#9333ea','#0f766e','#a16207','#b91c1c','#0891b2'];
function loadCustomFolders(){
  let saved=null; try{ saved=JSON.parse(localStorage.getItem(FOLDER_LS)); }catch(e){}
  if(Array.isArray(saved)) saved.forEach(f=>{
    if(f && f.id && !FOLDERS[f.id]) FOLDERS[f.id]={ id:f.id, name:f.name, ic:f.ic||'folder', color:f.color||'var(--color-accent)', desc:f.desc||'Custom value stream.', custom:true };
  });
}
function saveCustomFolders(){
  const custom=Object.values(FOLDERS).filter(f=>f.custom).map(f=>({ id:f.id, name:f.name, ic:f.ic, color:f.color, desc:f.desc }));
  try{ localStorage.setItem(FOLDER_LS, JSON.stringify(custom)); }catch(e){}
}
function slugifyFolder(name){
  const base='cf_'+String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24);
  let id=(base==='cf_'?'cf_stream':base), n=2; while(FOLDERS[id]){ id=base+'-'+n; n++; } return id;
}
function addCustomFolder(name){
  name=String(name||'').trim(); if(!name) return null;
  // reuse an existing folder with the same name (case-insensitive) rather than duplicate
  const existing=Object.values(FOLDERS).find(f=>f.name.toLowerCase()===name.toLowerCase());
  if(existing) return existing;
  const used=Object.values(FOLDERS).map(f=>(f.color||'').toLowerCase());
  const color=CUSTOM_FOLDER_COLORS.find(c=>!used.includes(c.toLowerCase())) || CUSTOM_FOLDER_COLORS[Object.keys(FOLDERS).length%CUSTOM_FOLDER_COLORS.length];
  const id=slugifyFolder(name);
  FOLDERS[id]={ id, name, ic:'folder', color, get desc(){ return i18t('fo_custom_stream'); }, custom:true };
  saveCustomFolders();
  return FOLDERS[id];
}
// category colour for a contract (or folder id); falls back to a neutral hairline
function folderColor(idOrContract){
  const id=(idOrContract && typeof idOrContract==='object') ? idOrContract.folder : idOrContract;
  return (FOLDERS[id] && FOLDERS[id].color) || 'var(--color-divider)';
}
/* Legend that explains the card / row edge-stripe colours. Each entry mirrors
   the stripe (a short vertical bar) next to its stream name, so the colour code
   is self-documenting on any striped view. Custom streams are included too. */
/* ---- THE STREAMS THIS READER MAY SEE ----
   Every "file under" picker and every stream legend in the product is built
   from the two functions below, so this is the one place the question has to be
   asked. A restricted member being offered a stream they cannot open is either
   a dead end (the guard bounces them) or, on a picker, a contract filed
   somewhere they will never see it again. */
function visibleFolders(){
  const acc=(typeof userFolderAccess==='function')?userFolderAccess():'*';
  const all=Object.values(FOLDERS);
  return acc==='*' ? all : all.filter(f=>acc.includes(f.id));
}
function folderLegendHtml(opts={}){
  const short = f => (typeof STREAM_SHORT!=='undefined' && STREAM_SHORT[f.id]) || f.name;
  const items = visibleFolders().map(f=>`<span style="display:inline-flex;align-items:center;gap:6px;font-size:var(--t-label);color:var(--color-neutral-700);white-space:nowrap"><span style="width:4px;height:12px;border-radius:var(--radius);background:${f.color};flex:none"></span>${short(f)}</span>`).join('');
  return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:var(--s-2) 14px;${opts.style||''}">
    <span style="font-size:var(--t-micro);letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-500)">${i18t('fo_value_streams')}</span>
    ${items}
  </div>`;
}
// <option> list for any "file under" select — includes a create sentinel
function folderOptionsHtml(selectedId, includeAuto){
  const opts=visibleFolders();
  /* The stream a record is ALREADY in stays on the list even when it is out of
     reach, or reopening that record silently re-files it under whatever
     happened to be first. */
  if(selectedId && selectedId!=='auto' && selectedId!=='__new__'
     && FOLDERS[selectedId] && !opts.some(f=>f.id===selectedId)) opts.unshift(FOLDERS[selectedId]);
  return (includeAuto?`<option value="auto" ${selectedId==='auto'?'selected':''}>${i18t('fo_auto_route')}</option>`:'')
    + opts.map(f=>`<option value="${esc(f.id)}" ${selectedId===f.id?'selected':''}>${esc(f.name)}</option>`).join('')
    + `<option value="__new__">${i18t('fo_create_new')}</option>`;
}
function rebuildFolderSelect(sel, selectedId){
  if(!sel) return;
  const includeAuto=!!sel.querySelector('option[value="auto"]');
  sel.innerHTML=folderOptionsHtml(selectedId, includeAuto);
  sel.value=selectedId;
}
/* Styled "new stream" prompt — a self-contained body overlay (like
   confirmDialog) so it stacks ABOVE an open modal instead of clobbering it.
   Resolves to the created folder object, or null if cancelled. */
function promptNewFolder(){
  return new Promise(resolve=>{
    const prev=document.getElementById('newfolder-overlay'); if(prev) prev.remove();
    const ov=document.createElement('div'); ov.id='newfolder-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:var(--s-4)';
    ov.innerHTML=`
      <div id="nf-scrim" style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
      <div class="modal-in" role="dialog" aria-modal="true" style="position:relative;width:100%;max-width:26rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:var(--radius);padding:22px var(--s-6)">
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;margin:0 0 var(--s-1)">${i18t('fo_new_stream')}</h3>
        <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 14px;line-height:1.5">Create a custom folder to file contracts under. It becomes available everywhere streams are used — dropdowns, filters, the map and reports.</p>
        <input id="nf-name" placeholder="e.g. Legal &amp; Regulatory" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);padding:9px 11px;font:inherit;font-size:var(--t-body);outline:none" />
        <div id="nf-err" style="font-size:var(--t-label);color:var(--st-ruby-dot);margin-top:6px;display:none">${i18t('fo_enter_name')}</div>
        <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
          <button id="nf-cancel" class="ui-btn" style="font-size:var(--t-meta)">${i18t('act_cancel')}</button>
          <button id="nf-save" class="ui-btn ui-btn-primary" style="font-size:var(--t-meta)">${i18t('fo_create_stream')}</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    /* AND IT MOVES OUT OF THE WAY, like every other pop-up window here —
       one helper, one set of rules. See dragDialog in js/core.js. */
    const undrag = window.dragDialog ? window.dragDialog(ov.querySelector('[role="dialog"]')) : null;
    const input=ov.querySelector('#nf-name'); setTimeout(()=>input.focus(),30);
    const done=v=>{ if(undrag){ try{ undrag(); }catch(e){} } ov.remove(); resolve(v); };
    const save=()=>{ const name=input.value.trim(); if(!name){ ov.querySelector('#nf-err').style.display='block'; return; } done(addCustomFolder(name)); };
    ov.querySelector('#nf-save').addEventListener('click',save);
    ov.querySelector('#nf-cancel').addEventListener('click',()=>done(null));
    ov.querySelector('#nf-scrim').addEventListener('click',()=>done(null));
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); save(); } else if(e.key==='Escape') done(null); });
  });
}
/* Wire a "file under" <select> so choosing "＋ Create new stream…" opens the
   prompt, adds the folder and re-selects it — works in views and inside modals. */
function bindFolderSelect(sel, onPick){
  if(!sel || sel.dataset.folderBound) return; sel.dataset.folderBound='1';
  let last=sel.value;
  sel.addEventListener('change', async ()=>{
    if(sel.value==='__new__'){
      const f=await promptNewFolder();
      if(f){ rebuildFolderSelect(sel, f.id); last=f.id; if(onPick) onPick(f.id); }
      else sel.value=last;
      return;
    }
    last=sel.value; if(onPick) onPick(sel.value);
  });
}
loadCustomFolders();
const TEMPLATES = {
  RM:{ id:'RM', name:'Raw Material Supply Agreement', kind:'Raw Material Supply', ic:'leaf', folder:'proc', valueType:'estimated', blurb:'Commodity & ingredient supply into the plants.' },
  PK:{ id:'PK', name:'Packaging Supply Agreement', kind:'Packaging Supply', ic:'box', folder:'proc', valueType:'estimated', blurb:'Bottles, cartons, films and labels.' },
  CM:{ id:'CM', name:'Contract Manufacturing (Co-Packing)', kind:'Contract Manufacturing', ic:'factory', folder:'mfg', valueType:'estimated', blurb:'Outsourced production & tolling.' },
  EQ:{ id:'EQ', name:'Equipment Lease & Maintenance', kind:'Equipment Lease', ic:'wrench', folder:'mfg', valueType:'fixed', blurb:'Plant machinery lease and servicing.' },
  WH:{ id:'WH', name:'Warehousing & Cold-Chain Agreement', kind:'Warehousing', ic:'box', folder:'dist', valueType:'fixed', blurb:'3PL storage and temperature-controlled space.' },
  FF:{ id:'FF', name:'Freight & Distribution Agreement', kind:'Distribution Logistics', ic:'truck', folder:'dist', valueType:'estimated', blurb:'Primary and last-mile distribution.' },
  DA:{ id:'DA', name:'Distributor Agreement', kind:'Distributor', ic:'cart', folder:'sales', valueType:'estimated', blurb:'Regional route-to-market distributor terms.' },
  RL:{ id:'RL', name:'Retail Listing & Supply Agreement', kind:'Retail Listing', ic:'store', folder:'sales', valueType:'estimated', blurb:'Modern-trade supermarket listing & supply.' },
  MK:{ id:'MK', name:'Marketing & Trade Promotion Services', kind:'Marketing Services', ic:'megaphone', folder:'mktg', valueType:'fixed', blurb:'Agency, media and activation services.' },
  ND:{ id:'ND', name:'Mutual Non-Disclosure Agreement', kind:'NDA', ic:'shield', folder:'corp', valueType:'none', blurb:'Confidentiality for NPD & vendor onboarding.' },
  LE:{ id:'LE', name:'Commercial Property Lease', kind:'Lease', ic:'building', folder:'corp', valueType:'fixed', blurb:'Office, depot and premises leases.' },
  PS:{ id:'PS', name:'Professional Services Agreement', kind:'Professional Services', ic:'briefcase', folder:'corp', valueType:'fixed', blurb:'Audit, legal and advisory retainers.' },
};
/* ---- unified field schema for the built-ins (Task 7) ----
   The twelve generators now expose the SAME `fields` shape as a customer's own
   uploaded template, so the wizard, the preview and bulk creation work off one
   accessor (templateFields) and neither knows nor cares which kind it has.
   `maps` is what feeds the register: a value typed here lands on the contract
   AND in c.metadata, with no separate data-entry step.
   TEMPLATE_PRIMARY (wizard.js) supplies each template's one distinctive field;
   it loads after this module, so the merge happens lazily on first read. */
const TEMPLATE_BASE_FIELDS = [
  /* OUR SIDE, ASKED FIRST AND BESIDE THEIRS. A group holds more than one legal
     entity, and until this the paper always named the workspace — see
     contractParty in js/core.js. The default is a GETTER, not a value: an
     object literal holding the workspace name would freeze whichever name was
     current when this module loaded, which is the table-built-once trap named
     twice already in THE MAP. */
  { key:'party', get label(){ return i18t('tf_our_party'); }, type:'party', maps:'party', required:false,
    get def(){ return (typeof window!=='undefined' && window.FIRST_PARTY) || ''; },
    get ph(){ return i18t('tf_our_party_ph'); } },
  { key:'counterparty', label:'Counterparty', type:'party', maps:'counterparty', required:true, def:'',
    ph:'Full registered name' },
  { key:'value',        get label(){ return `Contract value (${jxCurrency()})`; }, type:'num', maps:'value', required:false, def:'', ph:'0' },
  { key:'effDate',      label:'Start date', type:'date', maps:'effDate', required:false, def:'' },
  { key:'expiry',       label:'End / expiry date', type:'date', maps:'expiry', required:false, def:'' },
];
/* ---- WHAT A TEMPLATE MAY ASK FOR ----------------------------------------
   ONE RULE, AND IT IS THE WHOLE SECTION: A TEMPLATE ASKS ONLY FOR FACTS ITS
   OWN PAPER STATES, plus the contract essentials every record needs.

   Reported by the owner (11 Aug 2026) against the NDA: "NDA should not have
   payment terms." It was worse than one stray field — every one of the twelve
   built-ins was handed the same payment question regardless of whether its
   drafting mentioned money at all, so nine of them asked for a number that
   then appeared nowhere in the contract it created. On the NDA the paper
   actively CONTRADICTED the question: its own clause 1 reads "No monetary
   consideration passes under this Agreement."

   A question with no answer on the page is worse than a missing question. The
   drafter believes they have agreed a payment window; the counterparty reads a
   document that never mentions one; the disagreement surfaces at the first
   invoice. So each template names its own payment question below, and where
   the answer had nowhere to print, the drafting now prints it (js/views/
   contract.js — the fee or price clause of each).

   THREE ANSWERS, and each is a decision about the paper rather than the form:
     · a key + default — the paper states a payment window, and this is it
     · 'creditDays' on the distributor — its clause 3 ALREADY asks this, in the
       document, and two blanks for one fact is how they come to disagree
     · null — no payment window exists. The NDA carries no money at all; a
       property lease's rent and an equipment lease's charge both fall due IN
       ADVANCE on a stated day, which their own clauses say, so a number of
       days after invoice is not a term either of them has. */
const TEMPLATE_PAY = {
  RM:{ key:'payDays',    def:'30' },
  PK:{ key:'payDays',    def:'30' },
  CM:{ key:'payDays',    def:'30' },
  WH:{ key:'payDays',    def:'30' },
  FF:{ key:'payDays',    def:'30' },
  DA:{ key:'creditDays', def:'30', label:'Credit terms (days)' },
  RL:{ key:'payDays',    def:'60' },   // its own clause 3 has always said 60
  MK:{ key:'payDays',    def:'30' },
  PS:{ key:'payDays',    def:'30' },
  ND:null,
  LE:null,
};
/* ---- AND WHAT ITS PAPER SAYS ABOUT NOTICE (16 Sep 2026, build plan solution 1) ----
   THE SAME SHAPE AS TEMPLATE_PAY ABOVE, and for the same reason: a per-template
   table, written by hand, keyed to the very blank the clause prints, so the
   figure on the page and the figure on the record cannot drift apart.

   THE WHOLE RENEWAL MACHINE TURNED ON THIS ONE MISSING QUESTION. HaTi works out
   a renewal decision date by counting the notice period back from the expiry,
   counts down to it, writes an overnight memo and mails at fourteen, seven and
   one day. On a contract HaTi itself drafted it never fired: the Distributor
   Agreement PRINTS "90 days' written notice" onto its own clause 4, but that 90
   was only ever ink — nothing asked for it, so metadata.noticePeriodDays stayed
   empty and the clock fell back to the expiry, which is the one day that is
   already too late.

   ONLY PAPER THAT STATES ONE IS ASKED. Every twelve built-ins were read for
   this and exactly one carries a termination notice period as a blank:

     · DA  clause 4 — "terminable on {noticeDays} days' written notice"

   And two near misses that are deliberately NOT here, because asking them would
   repeat the fault the owner reported in August, when every template was handed
   a payment question it had no clause for:
     · CM  clause 3 has `auditNotice` — the notice before an AUDIT VISIT. It is
           a notice period, it is not this one, and mapping it would put a
           seven-day renewal deadline on every co-packing agreement.
     · ND  clause 3 says "terminated earlier by written notice" with no number
           at all. There is no blank to key to and no figure to record.
   The other nine say nothing about notice. THEY ARE NAMED null RATHER THAN
   OMITTED — TEMPLATE_PAY leaves EQ out entirely and `if(pay)` makes absent and
   null behave identically, so that table can look complete while a template is
   silently missing from it. TEMPLATE_OBLIGATIONS names its exclusions; so does
   this.

   THE LABEL IS AN ENGLISH LITERAL, like TEMPLATE_PAY's. js/wizard.js spreads
   the descriptor (`{...f}`) rather than copying it by descriptor, so a getter
   label would be read ONCE at wizard-open and would not follow a language
   switch mid-sitting. It is also a label that becomes part of the RECORD. */
const TEMPLATE_NOTICE = {
  DA:{ key:'noticeDays', def:'90', label:'Termination notice (days)' },
  RM:null, PK:null, CM:null, EQ:null, WH:null,
  FF:null, RL:null, MK:null, ND:null, LE:null, PS:null,
};
/* ============================================================
   WHAT A TEMPLATE'S OWN PAPER PROMISES (13 Sep 2026, build plan phase 7)
   ============================================================
   WORKORDER-pre-signature-check.md Part B. A template knows where its dates
   and amounts live, so a contract drafted from it can have its obligations
   WRITTEN rather than READ — no model, no guesswork, and no cost. This is the
   piece that makes the whole pre-signature idea cheap: nothing pays to read a
   contract HaTi wrote unless the check at the door finds the wording moved.

   WRITTEN BY HAND, LIKE valueType AND TEMPLATE_PAY BESIDE IT. Each entry
   QUOTES ITS OWN TEMPLATE'S CLAUSE — there is no entry here that the paper
   above it does not say — and names how the date is derived:
     from      'effective' | 'expiry' | 'signed'  — which of the record's dates
     offset    days after (or, negative, before) it
     field     a numbered field on the contract used as the offset instead
     party     'ours' | 'theirs', from who the template makes the payer
     recurring the cadence the clause states, or 'none'

   WHAT IS DELIBERATELY NOT HERE. The built-ins' rejection windows ("within 3
   days of delivery") and their per-invoice terms are counted from an event
   HaTi does not hold a date for. A single due date for those would be a date
   the product invented, so the payment duties below take their FIRST date from
   the contract's own start date and recur from there — and a contract with no
   start date gets nothing at all. HaTi does not invent dates. */
const TEMPLATE_OBLIGATIONS = {
  /* We are the Buyer on both supply papers: "invoices fall due within N days
     of receipt" is ours to meet. */
  RM:[{ key:'pay', desc:'Pay the supplier’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  PK:[{ key:'pay', desc:'Pay the supplier’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  /* The Brand Owner pays the Co-Packer. */
  CM:[{ key:'pay', desc:'Pay the co-packer’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  WH:[{ key:'pay', desc:'Pay the provider’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  FF:[{ key:'pay', desc:'Pay the carrier’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  MK:[{ key:'pay', desc:'Pay the agency’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  PS:[{ key:'pay', desc:'Pay the provider’s invoices within {n} days of receipt',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  /* A lease is rent we pay, on the template's own 60-day clause. */
  RL:[{ key:'pay', desc:'Pay the rent and charges within {n} days of the invoice',
        party:'ours', from:'effective', field:'payDays', recurring:'monthly' }],
  /* A distribution agreement's credit terms run the other way: they owe us. */
  DA:[{ key:'pay', desc:'Collect payment from the distributor within {n} days',
        party:'theirs', from:'effective', field:'creditDays', recurring:'monthly' }],
  ND:[], LE:[], EQ:[],
};
/* THE DERIVATION, AND IT REFUSES RATHER THAN GUESSES. Every input has to be
   really there: the date it counts from, the number of days, and a description.
   Anything missing and that entry is simply not minted — an absence is stated
   by there being nothing, never by a date nobody chose. */
function templateObligationDue(c, spec){
  const f=(c&&c.fields)||{}, m=(c&&c.metadata)||{};
  const base=spec.from==='expiry' ? String((c&&c.expiry)||f.expiry||m.expiryDate||'')
    : spec.from==='signed' ? String((window.contractSignedAt?contractSignedAt(c):'')||'')
    : String(f.effDate||m.effectiveDate||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(base)) return null;
  let days=Number(spec.offset||0);
  if(spec.field){
    const raw=f[spec.field];
    const n=Number(String(raw==null?'':raw).replace(/[^\d.-]/g,''));
    if(!Number.isFinite(n)||!String(raw==null?'':raw).trim()) return null;
    days=n;
  }
  const d=new Date(base+'T00:00:00Z');
  if(!Number.isFinite(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate()+days);
  return d.toISOString().slice(0,10);
}
/* MINTED ONCE, AND NEVER TWICE. obligationAlreadyOn is the same duplicate test
   every other door asks, so a duty typed by hand and one written from the
   template cannot both end up on the list. Each carries origin:'template', so
   a reader can see where it came from — and edits or deletes it like any
   other obligation. */
function mintTemplateObligations(c){
  if(!c||!c.template) return 0;
  const specs=TEMPLATE_OBLIGATIONS[c.template];
  if(!Array.isArray(specs)||!specs.length) return 0;
  c.obligations=Array.isArray(c.obligations)?c.obligations:[];
  let n=0;
  for(const spec of specs){
    const due=templateObligationDue(c,spec);
    if(!due) continue;
    const f=(c&&c.fields)||{};
    const days=spec.field?String(f[spec.field]||'').trim():String(spec.offset||'');
    const desc=String(spec.desc||'').replace('{n}',days);
    if(!desc||desc.includes('{n}')) continue;
    const o={ id:'ob_t'+Math.random().toString(36).slice(2,8), desc, due,
      recurring:spec.recurring||'none', party:spec.party==='theirs'?'theirs':'ours',
      assignee:'', status:'open', quote:'', origin:'template' };
    if(window.obligationAlreadyOn&&obligationAlreadyOn(c,o)) continue;
    c.obligations.push(o); n++;
  }
  return n;
}

/* Copied by DESCRIPTOR, not spread. `value`'s label is a getter that names the
   workspace's currency, and `{...f}` reads it once and freezes the answer — so
   a workspace switched to Sweden went on asking for KES until the page was
   reloaded. This is the getter trap CLAUDE.md names, and dropping the cache is
   the other half of it: a frozen list is a frozen label. */
const _tplCloneField = f => Object.defineProperties({}, Object.getOwnPropertyDescriptors(f));
function builtinTemplateFields(tid){
  const t=TEMPLATES[tid]; if(!t) return [];
  const out=TEMPLATE_BASE_FIELDS
    .filter(f=>!(f.key==='value' && t.valueType==='none'))
    .map(_tplCloneField);
  const prim=(typeof TEMPLATE_PRIMARY!=='undefined') ? TEMPLATE_PRIMARY[tid] : null;
  if(prim && prim.field) out.push({ key:prim.field, label:prim.label, type:'text', maps:'', required:false, def:prim.def||'', ph:prim.ph||'' });
  const pay=TEMPLATE_PAY[tid];
  if(pay) out.push({ key:pay.key, label:pay.label||'Payment terms (days)', type:'num',
    maps:'paymentTerms', required:false, def:pay.def, ph:pay.def });
  /* `maps:'noticePeriodDays'` is all this needs: applyTemplateValues already
     knew that key and writes both c.fields[key] and the record, stamped high
     because a person typed it. Writing c.fields.noticeDays in the same breath
     is not incidental — the paper's own blank reads it, and the 05912c4
     listener that fills the record FROM the paper goes inert once the record
     holds a figure, so a creation-time answer that did not also reach the
     clause would leave the page printing the 90 default over a different
     recorded number. */
  const notice=(typeof TEMPLATE_NOTICE!=='undefined')?TEMPLATE_NOTICE[tid]:null;
  if(notice) out.push({ key:notice.key, label:notice.label||'Termination notice (days)', type:'num',
    maps:'noticePeriodDays', required:false, def:notice.def, ph:notice.def });
  return out;
}
// give every built-in a live `fields` accessor so templateFields(t) just works
Object.values(TEMPLATES).forEach(t=>{
  t.builtin=true;
  Object.defineProperty(t,'fields',{ get(){ return builtinTemplateFields(t.id); }, enumerable:false, configurable:true });
});

Object.assign(window,{TEMPLATE_BASE_FIELDS,TEMPLATE_PAY,TEMPLATE_NOTICE,TEMPLATE_OBLIGATIONS,templateObligationDue,mintTemplateObligations,builtinTemplateFields,FOLDERS,TEMPLATES,addCustomFolder,folderColor,visibleFolders,folderLegendHtml,folderOptionsHtml,rebuildFolderSelect,promptNewFolder,bindFolderSelect,saveCustomFolders});
