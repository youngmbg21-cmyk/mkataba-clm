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
    if(f && f.id && !FOLDERS[f.id]) FOLDERS[f.id]={ id:f.id, name:f.name, ic:f.ic||'folder', color:f.color||'var(--color-accent)', desc:f.desc||'Custom value stream.', custom:true, local:true };
  });
}
function saveCustomFolders(){
  const custom=Object.values(FOLDERS).filter(f=>f.custom&&f.local).map(f=>({ id:f.id, name:f.name, ic:f.ic, color:f.color, desc:f.desc }));
  try{ localStorage.setItem(FOLDER_LS, JSON.stringify(custom)); }catch(e){}
}
/* ---- A VALUE STREAM IS THE COMPANY'S, NOT THIS BROWSER'S (Young ruled 17 Sep 2026) ----
   *"it is not clear how you create category and value stream but also how you
   delete them."* It was worse than unclear: a stream anybody made was written
   to localStorage and NO COLLEAGUE EVER LEARNED OF IT, so a company standard
   template filed under one was filed under a stream that did not exist for the
   person beside them. The panel admitted it in a note, which is honest and is
   not a product.

   THE SHARED LIST IS `state.settings.valueStreams` — the same blob
   customTemplates has ridden since the template library was built, so this
   invents no storage and no new idea of where company settings live.

   THE LOCALSTORAGE READER STAYS, AND IS NOT A MIGRATION. Streams already made
   are still that browser's own; they merge as before and carry `local:true`,
   which is what lets the panel say which ones the team cannot see and offer the
   one press that shares them. Nothing is lifted silently — the owner's rule
   that an absence is stated rather than guessed, applied to a store. */
const valueStreamsSaved = () => {
  const s = (typeof state === 'object' && state && state.settings) || {};
  return Array.isArray(s.valueStreams) ? s.valueStreams : [];
};
/* Merge the company's own streams into FOLDERS — the ONE map every dropdown,
   filter chip, card stripe, map cluster and report grouping reads, which is why
   this is a change to the LOAD and not to fifty readers. Called again whenever
   the bootstrap lands (js/api.js) and after every write. */
function foldersFromSettings(){
  for(const f of valueStreamsSaved()){
    if(!f || !f.id) continue;
    const had=FOLDERS[f.id];
    /* A shared stream OUTRANKS a local one of the same id: two people who
       typed the same name should end up on the company's copy, not on their
       own. `local` is cleared so the panel stops offering to share it. */
    FOLDERS[f.id]={ id:f.id, name:f.name, ic:f.ic||'folder',
      color:f.color||(had&&had.color)||'var(--color-accent)',
      desc:f.desc||(had&&had.desc)||'Custom value stream.', custom:true };
  }
}
/* ---- THE ONE ROUTE BOTH LISTS RIDE ----
   Value streams and template categories are the same kind of thing — the
   company's filing structure — so they are written together and read together,
   and no screen can move one without the other's copy staying true. It mirrors
   PUT /api/settings/templates line for line, including WHY that route exists:
   PUT /api/settings is admin-only and a template manager (Admin or Legal) is
   the person who files a template, so a whole-blob save would refuse them.

   WHAT THIS DOES NOT DO: creating an empty stream grants nobody anything. The
   access map (folderAccess) keeps its own admin-only route, and re-filing a
   contract into a stream is still an admin's act. A name is not a permission.
   The catch is deliberate: the lists are already right on this screen, and a
   failed save says so rather than throwing into a picker. */
function saveFilingSettings(){
  const s=(typeof state==='object'&&state&&state.settings)||{};
  const body={ valueStreams:Array.isArray(s.valueStreams)?s.valueStreams:[],
    templateCategories:Array.isArray(s.templateCategories)?s.templateCategories:[] };
  if(typeof API_MODE==='function'&&API_MODE()&&typeof api==='function')
    return api('settings/filing','PUT',body).catch(e=>{
      if(typeof toast==='function') toast(i18t('fo_save_failed',{err:e.message}),'err');
      return null;
    });
  return Promise.resolve();
}
function slugifyFolder(name){
  const base='cf_'+String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24);
  let id=(base==='cf_'?'cf_stream':base), n=2; while(FOLDERS[id]){ id=base+'-'+n; n++; } return id;
}
/* THE ONE ACT "make a value stream", and it is why the picker's own
   `+ New value stream…` is not a second implementation: both doors land here,
   exactly as the two Prepare-redlines buttons land on one handler. It writes
   the COMPANY's list; `saveValueStreams` is the one writer. */
function addCustomFolder(name){
  name=String(name||'').trim(); if(!name) return null;
  // reuse an existing folder with the same name (case-insensitive) rather than duplicate
  const existing=Object.values(FOLDERS).find(f=>f.name.toLowerCase()===name.toLowerCase());
  if(existing) return existing;
  const used=Object.values(FOLDERS).map(f=>(f.color||'').toLowerCase());
  const color=CUSTOM_FOLDER_COLORS.find(c=>!used.includes(c.toLowerCase())) || CUSTOM_FOLDER_COLORS[Object.keys(FOLDERS).length%CUSTOM_FOLDER_COLORS.length];
  const id=slugifyFolder(name);
  FOLDERS[id]={ id, name, ic:'folder', color, get desc(){ return i18t('fo_custom_stream'); }, custom:true };
  saveValueStreams();
  return FOLDERS[id];
}
/* Rename, remove, and lift a browser-only stream to the team — three acts, one
   writer, so no screen can move a stream without the company's list moving. A
   removal that would strand contracts is REFUSED BY ITS CALLER (the panel asks
   the count first); this is the store, not the wall. */
function renameCustomFolder(id, name){
  name=String(name||'').trim();
  const f=FOLDERS[id]; if(!f||!f.custom||!name) return false;
  f.name=name; saveValueStreams(); return true;
}
function removeCustomFolder(id){
  const f=FOLDERS[id]; if(!f||!f.custom) return false;
  delete FOLDERS[id]; saveValueStreams(); return true;
}
function shareCustomFolder(id){
  const f=FOLDERS[id]; if(!f||!f.custom||!f.local) return false;
  delete f.local; saveValueStreams(); return true;
}
/* ONE WRITER. It writes BOTH stores on purpose: the company's list is what
   colleagues read, and localStorage keeps whatever is still local to this
   browser — so sharing one stream does not drop the others this reader made. */
function saveValueStreams(){
  const shared=Object.values(FOLDERS).filter(f=>f.custom&&!f.local)
    .map(f=>({ id:f.id, name:f.name, ic:f.ic, color:f.color, desc:f.desc }));
  if(typeof state==='object'&&state){ state.settings=state.settings||{}; state.settings.valueStreams=shared; }
  saveCustomFolders();
  if(typeof saveFilingSettings==='function') return saveFilingSettings();
  return Promise.resolve();
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
/* ---- ONE NAME BOX, TWO LISTS (Young ruled 17 Sep 2026) ----
   Value streams have had this overlay since the folders feature; categories
   needed the same box with three words changed. A second copy of it is the
   duplication this codebase pays for most, so the overlay is generic and
   `promptNewFolder` is its first caller. `make` is the ACT — the one function
   that really adds the thing — so no door can add a stream or a category
   without going through the store's own writer. */
function promptNewName(o){
  return new Promise(resolve=>{
    const prev=document.getElementById('newfolder-overlay'); if(prev) prev.remove();
    const ov=document.createElement('div'); ov.id='newfolder-overlay';
    ov.style.cssText='position:fixed;inset:0;z-index:95;display:grid;place-items:center;padding:var(--s-4)';
    ov.innerHTML=`
      <div id="nf-scrim" style="position:absolute;inset:0;background:color-mix(in srgb,#2b2b2d 50%,transparent)"></div>
      <div class="modal-in" role="dialog" aria-modal="true" style="position:relative;width:100%;max-width:26rem;background:var(--color-surface);border:1px solid var(--color-divider);box-shadow:var(--shadow-lg);border-radius:var(--radius);padding:22px var(--s-6)">
        <h3 style="font-family:var(--font-heading);font-weight:var(--w-strong);font-size:16px;margin:0 0 var(--s-1)">${esc(o.title)}</h3>
        <p style="font-size:var(--t-meta);color:var(--color-neutral-600);margin:0 0 14px;line-height:1.5">${esc(o.sub)}</p>
        <input id="nf-name" placeholder="${esc(o.placeholder||'')}" style="width:100%;border:1px solid var(--color-divider);background:var(--color-surface);border-radius:var(--radius);font:inherit;outline:none;height:var(--field-h);padding:0 var(--field-pad-x);font-size:var(--field-size)" />
        <div id="nf-err" style="font-size:var(--t-label);color:var(--st-ruby-dot);margin-top:6px;display:none">${i18t('fo_enter_name')}</div>
        <div style="display:flex;justify-content:flex-end;gap:var(--s-2);margin-top:var(--s-4)">
          <button id="nf-cancel" class="ui-btn">${i18t('act_cancel')}</button>
          <button id="nf-save" class="ui-btn ui-btn-primary">${esc(o.ok)}</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    /* AND IT MOVES OUT OF THE WAY, like every other pop-up window here —
       one helper, one set of rules. See dragDialog in js/core.js. */
    const undrag = window.dragDialog ? window.dragDialog(ov.querySelector('[role="dialog"]')) : null;
    const input=ov.querySelector('#nf-name'); setTimeout(()=>input.focus(),30);
    const done=v=>{ if(undrag){ try{ undrag(); }catch(e){} } ov.remove(); resolve(v); };
    const save=()=>{ const name=input.value.trim(); if(!name){ ov.querySelector('#nf-err').style.display='block'; return; } done(o.make(name)); };
    ov.querySelector('#nf-save').addEventListener('click',save);
    ov.querySelector('#nf-cancel').addEventListener('click',()=>done(null));
    ov.querySelector('#nf-scrim').addEventListener('click',()=>done(null));
    input.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); save(); } else if(e.key==='Escape') done(null); });
  });
}
/* THE SUB-LINE SAYS THE ONE THING A FIRST-TIMER CANNOT SEE: the team gets it
   too. The old line listed the machinery (dropdowns, filters, the map and
   reports) — true, visible the moment they look, and it is the sentence the
   pop-up diet retires. What it never said is the fact that was actually wrong
   until today. */
function promptNewFolder(){
  return promptNewName({ title:i18t('fo_new_stream'), sub:i18t('fo_new_stream_sub'),
    placeholder:i18t('fo_new_stream_eg'), ok:i18t('fo_create_stream'), make:addCustomFolder });
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
  /* ---- WHICH SIDE OF THE MONEY WE ARE ON (the sixth repair, 18 Sep 2026) ----
     Never asked anywhere, at any door, so `metadata.category` was only ever
     filled by the extractor reading an UPLOADED document — and the payment
     terms analysis, which is good, was blind across every contract HaTi drafted
     itself. It is the one question that reading cannot work out from our own
     paper: the same supply template is a purchase to one business and a sale
     to another.
     THREE ANSWERS, AND THE THIRD WRITES NOTHING. "Neither" is not a category —
     applyTemplateValues skips an empty value — so a contract that is not about
     buying or selling records no claim, and the extractor may still fill it
     later from the wording. The two that do write land on the SAME field the
     upload path writes, so paySide has one reading and not two. */
  { key:'side', get label(){ return i18t('tf_our_side'); }, type:'select', maps:'category', required:false, def:'',
    get opts(){ return [ { v:'', l:i18t('tf_side_none') },
                         { v:'customer', l:i18t('tf_side_customer') },
                         { v:'supplier', l:i18t('tf_side_supplier') } ]; } },
  { key:'effDate',      label:'Start date', type:'date', maps:'effDate', required:false, def:'' },
  { key:'expiry',       label:'End / expiry date', type:'date', maps:'expiry', required:false, def:'' },
  /* ---- WHERE THIS ONE IS FILED, ASKED WHERE IT IS CREATED (Young ruled
     18 Sep 2026: "All created contracts should have a door to being categorized
     by value stream") ----
     The stream was taken SILENTLY from the template every time, and a template
     serves more than one part of a business — so a supply agreement drafted by
     procurement landed wherever the template happened to be filed and only an
     admin could move it afterwards. It is the last field on purpose: it is
     filing, not a term of the agreement, and it is never required — left as it
     opens it keeps exactly the answer it had before this question existed.
     `type:'stream'` is drawn by folderOptionsHtml and bound by
     bindFolderSelect, the product's OWN pair, so "+ New value stream" works
     here as it does in the upload dialog. The def is written per template by
     builtinTemplateFields. */
  { key:'folder', get label(){ return i18t('tl_stream'); }, type:'stream', maps:'folder', required:false, def:'' },
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
/* THE 90 IS PRE-FILLED, AND THAT IS OWNER-RULED (Young, 16 Sep 2026: "keep it
   pre-filled with 90"). It is not an idle default: applyTemplateValues stamps
   whatever is in that box `confidence:'high'` under the comment "A human typed
   this", and from that moment the renewal clock counts 90 days back on this
   contract, runReminders mails at 14/7/1, and runRenewalPrep buys an overnight
   memo the OWNER pays for — whether or not the drafter ever looked at the box.
   Put to the owner in exactly those words, with an empty box as the
   alternative, and ruled: the paper has always PRINTED 90, and a record
   disagreeing with the paper is the bug this whole feature exists to close. */
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
  /* THE TEMPLATE'S OWN STREAM IS THE ANSWER ALREADY IN THE BOX, so a reader who
     does not touch it creates exactly what this door created before the
     question existed. Written after the descriptor clone, never on the shared
     list, which would freeze one template's filing onto all twelve. */
  const fld=out.find(f=>f.key==='folder');
  if(fld) fld.def = (FOLDERS[t.folder] ? t.folder : 'corp');
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

Object.assign(window,{TEMPLATE_BASE_FIELDS,TEMPLATE_PAY,TEMPLATE_NOTICE,TEMPLATE_OBLIGATIONS,templateObligationDue,mintTemplateObligations,builtinTemplateFields,FOLDERS,TEMPLATES,addCustomFolder,folderColor,visibleFolders,folderLegendHtml,folderOptionsHtml,rebuildFolderSelect,promptNewFolder,promptNewName,bindFolderSelect,saveCustomFolders,foldersFromSettings,valueStreamsSaved,saveValueStreams,saveFilingSettings,renameCustomFolder,removeCustomFolder,shareCustomFolder});
