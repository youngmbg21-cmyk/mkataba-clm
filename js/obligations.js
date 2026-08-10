// HaTi — E3 obligations + renewal decisions. Globals window-attached.

const OBLIG_RECUR = [['none','One-off'],['monthly','Monthly'],['quarterly','Quarterly'],['annual','Annual']];

/* ---- A DATE FIELD IS NOT ALWAYS A DATE ----

   Everything downstream of an expiry — the calendar grid, the dashboard's
   "decisions due", the register's auto-renew filter — assumes a clean
   YYYY-MM-DD. Most of the time it is one, because the date pickers produce one.
   But an expiry can also arrive from metadata extraction, from a bulk
   migration, or from a spreadsheet a person typed by hand, and then it reads
   "30 September 2026", or a full ISO datetime, or something that is not a date
   at all.

   `new Date("30 September 2026" + "T00:00:00")` is an Invalid Date, and
   `toISOString()` on an Invalid Date THROWS. That threw out of
   renewalDecisionDate, out of renderDashboard and renderCalendar, and took the
   whole portfolio's Home and Calendar screens down — over one record. Two
   working screens, dead, because of one badly typed field on one contract.

   So the value is normalised before any arithmetic touches it: a leading
   YYYY-MM-DD is taken as-is, anything else is offered to Date.parse, and a
   value that survives neither is null. Null is a real answer here — "we do not
   know when this expires" — and every caller already handles it.

   AND Date.parse ON ITS OWN IS NOT THE TEST. Handing it any string at all was
   the second half of the same mistake, one step further down: outside the ISO
   grammar the engine falls back to a legacy parser that will find a date in
   almost anything. `Date.parse("Phase 2")` is 1 February 2001.
   `Date.parse("clause 4.2")` is 2 April 2001. So an expiry a migration left as
   "Phase 2" did not come back as "we do not know" — it came back as a
   confident calendar day twenty-five years ago, and the contract read as long
   expired, sat in the expiring buckets and drew itself on a 2001 calendar.
   A wrong date stated as fact is worse than no date, because nobody goes
   looking for it.

   Only shapes a person actually writes a date in are offered to the parser.
   Anything else is null — which is the honest answer and the handled one. */
const DATE_MONTH_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i;
const DATE_SHAPES = [
  /^(\d{1,2})(?:st|nd|rd|th)?[ .\-]+([A-Za-z]{3,9})\.?,?[ .\-]+(\d{4})$/,   // 30 September 2026
  /^([A-Za-z]{3,9})\.?[ .\-]+(\d{1,2})(?:st|nd|rd|th)?,?[ .\-]+(\d{4})$/,   // September 30, 2026
];
function dateOnly(v){
  if(v instanceof Date) return isNaN(v.getTime()) ? null : isoDay(v);
  const s = String(v==null?'':v).trim();
  if(!s) return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10);
  // the same year-first date with the other separators
  if(!/^\d{4}[/.]\d{1,2}[/.]\d{1,2}$/.test(s)){
    const shape = DATE_SHAPES.map(re=>re.exec(s)).find(Boolean);
    // a month has to be a month — "Foo 30, 2026" is not a date, it is a label
    if(!shape || !DATE_MONTH_RE.test(shape[1].length>2?shape[1]:shape[2])) return null;
  }
  const t = Date.parse(s);
  if(Number.isNaN(t)) return null;
  const d = new Date(t);
  if(isNaN(d.getTime())) return null;
  return isoDay(d);
}
/* A Date as the calendar day it IS, read in the reader's own timezone.
   `toISOString()` converts to UTC first, so midnight local in Nairobi (UTC+3)
   comes back as the PREVIOUS day — a renewal deadline reported one day early,
   every time, for the market this product is built for. */
const isoDay = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

/* The date by which a renewal decision must be made: expiry minus the notice
   period (from E1 metadata). Null when we don't know both. */
function renewalDecisionDate(c){
  // family-aware: if a later amendment moved the term, the decision deadline
  // moves with it (window.effectiveExpiry — family.js loads after this module)
  const raw = (window.effectiveExpiry?effectiveExpiry(c):null) || (c&&c.metadata&&c.metadata.expiryDate) || (c&&c.expiry);
  const expiry = dateOnly(raw);
  const notice = c&&c.metadata&&Number(c.metadata.noticePeriodDays)||0;
  if(!expiry) return null;                   // not a date we can count from
  if(!notice) return expiry;                 // no notice period known — decide by expiry
  const d = new Date(expiry+'T00:00:00');
  if(isNaN(d.getTime())) return null;
  d.setDate(d.getDate()-notice);
  if(isNaN(d.getTime())) return null;        // arithmetic can still land outside the range
  return isoDay(d);
}
/* An obligation's due date, normalised — the same treatment the expiry gets,
   and for the same reason. `due` is filed from whatever the Copilot scan put in
   it ("31 March 2027" is a perfectly ordinary answer to "ISO yyyy-mm-dd if a
   concrete date is stated") or from a migration spreadsheet somebody typed.
   Nothing throws on it, which is why it went unnoticed: `daysUntil` simply
   returns NaN, every comparison against NaN is false, and the obligation was
   never overdue however long ago it was due. */
const obligationDue = o => (window.dateOnly ? dateOnly(o && o.due) : ((o && o.due) || null));
function obState(o){
  if(o.status==='done') return 'done';
  const due=obligationDue(o);
  if(due && daysUntil(due)<0) return 'overdue';
  return 'open';
}

/* ---- WHOSE DELIVERABLE IS IT? ----

   A contract's obligations are almost never all one side's. A supply agreement
   has things we must do — pay within thirty days, give sixty days' notice — and
   things they must do — deliver monthly, keep insurance current, file quarterly
   returns. The record had one field for this, `assignee`, and it offered a list
   of people in THIS workspace. There was no way to write down "the supplier
   owes us this one".

   So every screen that counted obligations counted both kinds together, and
   "six due this month" could not be read: it might mean six jobs for our team,
   or six things to chase them about. Those are different mornings.

   `party` is the answer, and it is deliberately two values and not a directory
   of people on the other side. We do not have their staff list, we are not
   going to maintain one, and the useful distinction is ours/theirs — the
   counterparty's own internal owner is their business.

   A record filed before this existed has no `party`. It reads as ours, which is
   what it was: the only assignees the form ever offered were our own people. */
const OBLIG_PARTY = [['ours','Us'],['theirs','Counterparty']];
const obligationParty = o => ((o && o.party)==='theirs' ? 'theirs' : 'ours');
const obligationIsTheirs = o => obligationParty(o)==='theirs';
/* Who to chase, in the words a person would use. Their side speaks as the
   counterparty — we hold no names over there — and ours names the colleague, or
   says plainly that nobody has it. */
function obligationOwner(o, c){
  if(obligationIsTheirs(o)) return String((c && c.counterparty) || '').trim() || 'the counterparty';
  return String((o && o.assignee) || '').trim() || 'unassigned';
}
const obligationsOurs   = list => (list||[]).filter(o=>!obligationIsTheirs(o));
const obligationsTheirs = list => (list||[]).filter(obligationIsTheirs);
function contractObligations(c){ return (c.obligations||[]); }
function allObligations(){
  const out=[];
  /* `counterparty` travels with each one so a screen listing obligations from
     several contracts can name who owes a "theirs" without looking the contract
     up again — and cannot name the wrong one. */
  state.contracts.forEach(c=>{ (c.obligations||[]).forEach(o=>out.push({...o,
    cid:c.id, cname:c.name, counterparty:c.counterparty||'' })); });
  return out;
}
/* Everything still outstanding across the portfolio, soonest first. What the
   dashboard panel reads. Declined contracts are out — a deal nobody is doing
   has no deliverables — and so is anything already done. */
function openObligations(withinDays){
  const live=new Set((state.contracts||[]).filter(c=>c.status!=='Declined').map(c=>c.id));
  return allObligations()
    .filter(o=>live.has(o.cid) && obState(o)!=='done')
    .map(o=>{ const due=obligationDue(o); return { ...o, due, days:due?daysUntil(due):null }; })
    .filter(o=>withinDays==null || o.days==null || o.days<=withinDays)
    .sort((a,b)=>{ if(a.days==null) return 1; if(b.days==null) return -1; return a.days-b.days; });
}
function overdueObligationCount(){ return allObligations().filter(o=>obState(o)==='overdue').length; }
function renewalDecisionsDue(withinDays=30){
  const out=[];
  state.contracts.forEach(c=>{ if(c.status==='Declined'||c.status==='Signed'&&!c.metadata) {/*keep signed w/ renewal*/}
    const dd=renewalDecisionDate(c); if(dd){ const d=daysUntil(dd); if(d>=0&&d<=withinDays) out.push({cid:c.id, cname:c.name, decideBy:dd, days:d}); } });
  return out.sort((a,b)=>a.days-b.days);
}

/* ---- heuristic obligation finder (no key): payment/notice/reporting cues ---- */
function heuristicObligations(text, c){
  const t=String(text||'').replace(/\s+/g,' '); const out=[];   // read across the document's line wrapping
  const add=(desc,quote)=>{ if(out.length<8) out.push({desc, quote:quote?quote.slice(0,160):'', due:'', recurring:'none'}); };
  const sent = t.split(/(?<=[.;])\s+/);
  sent.forEach(s=>{
    if(/\bshall\s+(pay|remit|invoice)\b/i.test(s) && out.every(o=>!/pay/i.test(o.desc))) add('Payment obligation', s);
    else if(/\b(\d{1,3})\s+days'?\s+(?:written\s+)?notice\b/i.test(s)) add('Notice / termination obligation', s);
    else if(/\b(monthly|quarterly|annual|annually|weekly)\b[^.]*\b(report|statement|forecast|return)\b/i.test(s) || /\b(report|statement|forecast)\b[^.]*\b(monthly|quarterly|annually)\b/i.test(s)) add('Reporting obligation', s);
    else if(/\b(deliver|supply|provide)\b.*\bwithin\b/i.test(s) && out.every(o=>!/deliver/i.test(o.desc))) add('Delivery obligation', s);
    else if(/\b(insurance|indemnif|maintain\s+cover)\b/i.test(s) && out.every(o=>!/insurance/i.test(o.desc))) add('Insurance / indemnity obligation', s);
  });
  return out;
}
async function extractObligations(c){
  const text = isUpload(c) ? (c.upload&&c.upload.extractedText)||'' : (window.contractPlainText?contractPlainText(c):'');
  if(!text || text.length<120){ toast(i18t('ob_no_readable'),'err'); return []; }
  if(API_MODE() && state.aiConfigured){
    try{ const r=await api('ai/obligations','POST',{ text:text.slice(0,20000) }); return r.obligations||[]; }
    catch(e){ toast(i18t('ob_scan_unavailable'),'err'); }
  }
  return heuristicObligations(text, c);
}

/* EVERY SURFACE THAT COUNTS OBLIGATIONS, when the obligations change.

   The sidebar badge on Calendar is "due in the next sixty days", and it is
   recomputed at the end of setView() — a SCREEN SWITCH. All three things that
   move that number (adding one, completing one, removing one) happen inside the
   workspace, which is not a screen switch. So the badge went on reading 1 over
   a portfolio with nothing due, and corrected itself silently the next time the
   reader navigated anywhere. The Calendar itself, if it is the open screen, has
   the same problem for the same reason. */
function obligationSurfacesChanged(){
  if(window.updateSidebarCounts) updateSidebarCounts();
  if(window.state && state.view==='calendar' && window.renderCalendar) renderCalendar();
  /* AND THE DASHBOARD, now that it counts them too. Same reasoning as the
     calendar above: its numbers are computed during a render, and ticking an
     obligation off is not a screen switch. */
  if(window.state && state.view==='dashboard' && window.renderDashboard) renderDashboard();
}

/* ---- ONE VERB, PRESSED FROM THREE SCREENS ----

   Completing an obligation used to exist only as an inline handler inside the
   workspace panel, which is why it could only ever be done there. It is a verb
   now: the calendar and the dashboard call the same function, so there is one
   place that decides what completing means, one audit line, and one refresh of
   every surface that counts them. A second copy of this logic on the calendar
   is exactly how two screens come to disagree.

   Addressed BY ID rather than by position. The workspace lists a contract's
   obligations in their stored order, but the calendar sorts by date and the
   dashboard filters to what is due — so an index means three different things
   on three screens, and the wrong one would be ticked off. */
function findObligation(cid, obId){
  const c=window.getContract?getContract(cid):null;
  if(!c) return null;
  const list=c.obligations||[];
  const i=list.findIndex(o=>o&&String(o.id)===String(obId));
  return i<0 ? null : { c, o:list[i], i };
}
function toggleObligation(c, i, opts={}){
  if(!canEdit()){ toast(i18t('ob_viewers_no_change'),'err'); return null; }
  const o=(c&&c.obligations||[])[i]; if(!o) return null;
  o.status = o.status==='done' ? 'open' : 'done';
  logAudit(c,'Obligation',`${o.status==='done'?'Completed':'Reopened'}: ${o.desc}`
    +` — ${obligationIsTheirs(o)?`${c.counterparty||'the counterparty'}'s to deliver`:'ours'}`
    +(opts.from?` (from the ${opts.from})`:''));
  persist(c);
  if(window.renderObligationsSection) renderObligationsSection(c);
  obligationSurfacesChanged();
  return o;
}
/* The calendar's and the dashboard's way in. Returns the obligation so a caller
   can report what happened; null when the record has moved on underneath. */
function toggleObligationById(cid, obId, opts={}){
  const hit=findObligation(cid, obId);
  if(!hit){ toast('That obligation is no longer on the contract','err'); return null; }
  return toggleObligation(hit.c, hit.i, opts);
}

/* ---- workspace obligations section ---- */
function renderObligationsSection(c){
  const host=document.getElementById('obligations-section'); if(!host) return;
  const obs=c.obligations||[];
  /* AN EXECUTED CONTRACT IS WHERE OBLIGATIONS START, not where they stop.

     This read `canEdit() && c.status !== 'Signed'`, so the moment a deal was
     signed every control in this panel disappeared — no ticking one off, no
     adding the one the scan missed, no correcting a due date. On exactly the
     contracts whose obligations are live. The whole point of tracking a
     quarterly report is that the quarter comes round after signature.

     The 'Signed' guard belongs to the DOCUMENT: sealed wording does not change,
     and nothing here touches the wording. An obligation is a note about what
     the parties have to do, kept alongside it. It stays editable for as long as
     the contract is running. */
  const editable=canEdit();
  const dd=renewalDecisionDate(c);
  if(!obs.length && !editable && !dd){ host.innerHTML=''; return; }   // nothing to show; empty:hidden collapses it
  const chip=st=>st==='overdue'?'bg-rose-50 text-rose-600 border-rose-200':st==='done'?'bg-brand-50 text-brand-600 border-brand-200':'bg-gold-500/10 text-gold-600 border-gold-500/25';
  host.innerHTML=`
    <div class="px-5 py-4">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-brand-500">${icon('calendar')}</span>
        <h3 class="text-sm font-display font-600 text-ink">${i18t('ob_obligations')}</h3>
        <span class="ml-auto text-[10px] font-mono text-ink/60">${obs.length}</span>
      </div>
      ${dd?`<div class="mb-3 rounded-lg border ${daysUntil(dd)<0?'border-rose-200 bg-rose-50':'border-gold-500/25 bg-gold-500/8'} px-3 py-2 text-[11px]">
        <span class="font-600 text-ink">Renewal decision by ${dd}</span> <span class="text-ink/60">· ${daysUntil(dd)<0?'passed':daysUntil(dd)+' days'}${c.metadata&&c.metadata.noticePeriodDays?` (expiry ${(c.metadata.expiryDate||c.expiry)} − ${c.metadata.noticePeriodDays}d notice)`:''}</span></div>`:''}
      ${obs.length?`<div class="space-y-1.5 mb-2">${obs.map((o,i)=>{ const st=obState(o); return `
        <div class="rounded-lg border border-line bg-white px-3 py-2">
          <div class="flex items-center gap-2 text-[12px]">
            <span class="inline-block rounded-full border ${chip(st)} px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide">${st}</span>
            <span class="text-ink font-500 truncate">${(o.desc||'').replace(/</g,'&lt;')}</span>
            <span class="ml-auto shrink-0 text-[10px] font-mono text-ink/55">${o.due||'no date'}</span>
          </div>
          <div class="mt-1 flex items-center gap-2 text-[10px] text-ink/55">
            ${o.recurring&&o.recurring!=='none'?`<span>${(OBLIG_RECUR.find(r=>r[0]===o.recurring)||[])[1]}</span>·`:''}
            ${''/* Ours or theirs, said on the row rather than inferred from a
                   name. "Wanjiku Kamau" reads as a job; "Kabras Sugar" beside
                   it would read as one too unless the row says which it is. */}
            <span class="inline-block rounded border px-1 py-px text-[9px] font-mono uppercase tracking-wide ${obligationIsTheirs(o)?'border-gold-500/30 bg-gold-500/10 text-gold-700':'border-brand-200 bg-brand-50 text-brand-600'}">${obligationIsTheirs(o)?'theirs':'ours'}</span>
            <span>${String(obligationOwner(o,c)).replace(/</g,'&lt;')}</span>
            ${editable?`<span class="ml-auto flex gap-2">
              <button data-ob-toggle="${i}" class="text-brand-600 hover:text-brand-800 font-600">${o.status==='done'?'reopen':'done'}</button>
              <button data-ob-edit="${i}" class="text-brand-600 hover:text-brand-800">edit</button>
              <button data-ob-del="${i}" class="text-rose-500 hover:text-rose-700">remove</button></span>`:''}
          </div>
          ${o.quote?`<div class="mt-1 text-[10px] text-ink/50 italic border-l-2 border-line pl-2">“${o.quote.replace(/</g,'&lt;')}”</div>`:''}
        </div>`; }).join('')}</div>`
      :`<p class="text-[11px] text-ink/60 mb-2">${i18t('ob_none_tracked')}</p>`}
      ${''/* ---- A BUTTON THAT CANNOT BE SEEN IS NOT A BUTTON ----
             Reported (Young, 10 Aug 2026): "the buttons are almost
             transparent". They were outlines only — border-brand-200 is a pale
             mint and border-gold-500/30 is amber at three-tenths — with no fill
             behind them, on a white card. At rest they read as two labels
             floating in the empty state's whitespace.

             THE FILL IS THE FIX, not a heavier border. Each takes the tint of
             its own family (accent for the manual add, amber for the Copilot
             sweep, which is the colour every AI act on this page wears), so the
             pair stays quiet against the primary actions elsewhere on the
             screen while being unmistakably pressable. Hover deepens the same
             tint rather than introducing a new one. */}
      ${editable?`<div class="flex flex-wrap gap-2">
        <button id="ob-add" class="ob-btn ob-btn-add">${icon('plus','w-3 h-3')} Add obligation</button>
        <button id="ob-find" class="ob-btn ob-btn-find">${icon('sparkle','w-3 h-3')} Find obligations</button>
      </div>`:''}
    </div>`;
  host.querySelectorAll('[data-ob-toggle]').forEach(b=>b.addEventListener('click',()=>
    toggleObligation(c, Number(b.getAttribute('data-ob-toggle')))));
  host.querySelectorAll('[data-ob-edit]').forEach(b=>b.addEventListener('click',()=>{
    const i=Number(b.getAttribute('data-ob-edit'));
    openObligationForm(c, { ...obs[i], _i:i }); }));
  host.querySelectorAll('[data-ob-del]').forEach(b=>b.addEventListener('click',()=>{
    const o=obs[Number(b.getAttribute('data-ob-del'))];
    obs.splice(Number(b.getAttribute('data-ob-del')),1);
    if(o) logAudit(c,'Obligation',`Removed: ${o.desc}`);
    persist(c); renderObligationsSection(c); obligationSurfacesChanged(); }));
  document.getElementById('ob-add')?.addEventListener('click',()=>openObligationForm(c));
  document.getElementById('ob-find')?.addEventListener('click',()=>runFindObligations(c));
}
function openObligationForm(c, seed){
  seed=seed||{desc:'',due:'',recurring:'none',assignee:'',quote:''};
  const members=(getUsers()||[]).map(u=>u.name);
  openModal(`
    <div class="p-6">
      <h3 class="font-serif font-600 text-lg text-ink mb-3">${seed._i!=null?'Edit':'Add'} obligation</h3>
      <label class="block mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_description')}</span>
        <input id="of-desc" value="${(seed.desc||'').replace(/"/g,'&quot;')}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
      <div class="grid grid-cols-2 gap-3 mb-2.5">
        <label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_due_date')}</span>
          <input id="of-due" type="date" value="${seed.due||''}" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/></label>
        <label class="block"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_recurring')}</span>
          <select id="of-recur" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500">${OBLIG_RECUR.map(([k,l])=>`<option value="${k}" ${seed.recurring===k?'selected':''}>${l}</option>`).join('')}</select></label>
      </div>
      ${''/* WHOSE JOB, ASKED BEFORE WHO ON OUR SIDE. The two questions are not
              independent — "assign to" only means anything for an obligation
              that is ours — so the field that decides it comes first, and the
              one it governs is hidden when it does not apply. */}
      <div class="mb-2.5"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_whose')}</span>
        <div id="of-party" class="mt-1 grid grid-cols-2 gap-2">
          ${OBLIG_PARTY.map(([k,l])=>{ const on=(seed.party==='theirs'?'theirs':'ours')===k;
            return `<button type="button" data-of-party="${k}" class="rounded-lg border px-3 py-2 text-[12.5px] font-600 transition ${on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/70 hover:bg-slate-50'}">${k==='theirs'?((c.counterparty||'').replace(/</g,'&lt;')||l):l}</button>`; }).join('')}
        </div></div>
      <label id="of-assignee-wrap" class="block mb-4 ${seed.party==='theirs'?'hidden':''}"><span class="text-[11px] font-600 text-ink/70">${i18t('ob_assign_to')}</span>
        <input id="of-assignee" list="of-members" value="${(seed.assignee||'').replace(/"/g,'&quot;')}" placeholder="Team member" class="mt-1 w-full rounded-lg border border-inputln bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"/>
        <datalist id="of-members">${members.map(m=>`<option value="${m}">`).join('')}</datalist></label>
      <p id="of-theirs-note" class="mb-4 text-[11px] text-ink/55 leading-relaxed ${seed.party==='theirs'?'':'hidden'}">This is something ${(c.counterparty||'the counterparty').replace(/</g,'&lt;')} owes. It appears on your calendar and dashboard as something to chase rather than something to do.</p>
      <div class="flex justify-end gap-2">
        <button id="of-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        <button id="of-save" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('act_save')}</button>
      </div>
    </div>`);
  let party=(seed.party==='theirs')?'theirs':'ours';
  const paintParty=()=>{
    document.querySelectorAll('[data-of-party]').forEach(b=>{
      const on=b.getAttribute('data-of-party')===party;
      b.className=`rounded-lg border px-3 py-2 text-[12.5px] font-600 transition ${on?'border-brand-500 bg-brand-50 text-brand-700':'border-line bg-white text-ink/70 hover:bg-slate-50'}`;
    });
    document.getElementById('of-assignee-wrap')?.classList.toggle('hidden', party==='theirs');
    document.getElementById('of-theirs-note')?.classList.toggle('hidden', party!=='theirs');
  };
  document.querySelectorAll('[data-of-party]').forEach(b=>b.addEventListener('click',()=>{
    party=b.getAttribute('data-of-party')==='theirs'?'theirs':'ours'; paintParty(); }));
  document.getElementById('of-cancel').addEventListener('click',closeModal);
  document.getElementById('of-save').addEventListener('click',()=>{
    const o={ id:seed.id||('ob_'+Math.abs((Date.parse(nowISO())+(c.obligations||[]).length)).toString(36)),
      desc:document.getElementById('of-desc').value.trim(), due:document.getElementById('of-due').value,
      recurring:document.getElementById('of-recur').value,
      party,
      /* An obligation that is theirs carries no assignee of ours. Leaving a
         stale colleague's name on it would put their job in our queue. */
      assignee: party==='theirs' ? '' : document.getElementById('of-assignee').value.trim(),
      status:seed.status||'open', quote:seed.quote||'' };
    if(!o.desc){ toast('Enter a description','err'); return; }
    c.obligations=c.obligations||[];
    const editing=seed._i!=null;
    if(editing) c.obligations[seed._i]=o; else c.obligations.push(o);
    logAudit(c,'Obligation',`${editing?'Updated':'Added'}: ${o.desc}${o.due?` (due ${o.due})`:''}`
      +` — ${party==='theirs'?`${c.counterparty||'the counterparty'}'s to deliver`:`ours${o.assignee?`, assigned to ${o.assignee}`:''}`}`);
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
  });
}
async function runFindObligations(c){
  const btn=document.getElementById('ob-find'); if(btn){ btn.disabled=true; btn.innerHTML=`<span class="animate-pulse">${i18t('ob_scanning')}</span>`; }
  const found=await extractObligations(c);
  if(btn){ btn.disabled=false; }
  renderObligationsSection(c);
  if(!found.length){ toast('No obligations detected'); return; }
  openObligationsReview(c, found);
}
function openObligationsReview(c, found){
  openModal(`
    <div class="p-6">
      <div class="flex items-center gap-2 mb-1"><span class="text-gold-600">${icon('sparkle','w-4 h-4')}</span>
        <h3 class="font-serif font-600 text-lg text-ink">${i18t('ob_proposed')}</h3></div>
      <p class="text-xs text-ink/60 mb-3">${i18t('ob_tick_to_add')} <b>ours</b> — open any one afterwards to mark it as the counterparty&rsquo;s, or to set a date and an owner. Nothing is saved until you confirm.</p>
      <div class="space-y-2 max-h-[45vh] overflow-y-auto scroll-thin mb-4">
        ${found.map((o,i)=>`<label class="flex gap-2.5 rounded-lg border border-line bg-white px-3 py-2.5 cursor-pointer">
          <input type="checkbox" data-ob-pick="${i}" checked class="mt-0.5 h-4 w-4 rounded border-brand-200 accent-brand-700"/>
          <span class="min-w-0"><span class="block text-[12.5px] font-500 text-ink">${(o.desc||'').replace(/</g,'&lt;')}</span>
          ${o.quote?`<span class="block text-[10px] text-ink/50 italic mt-0.5">“${o.quote.replace(/</g,'&lt;')}”</span>`:''}</span></label>`).join('')}
      </div>
      <div class="flex justify-end gap-2">
        <button id="or-cancel" class="rounded-lg border border-line px-4 py-2 text-sm font-600 text-ink/70 hover:bg-slate-50">${i18t('act_cancel')}</button>
        <button id="or-add" class="rounded-lg bg-brand-600 text-white px-4 py-2 text-sm font-600 hover:bg-brand-700">${i18t('ob_add_selected')}</button>
      </div>
    </div>`);
  document.getElementById('or-cancel').addEventListener('click',closeModal);
  document.getElementById('or-add').addEventListener('click',()=>{
    c.obligations=c.obligations||[];
    let n=0;
    document.querySelectorAll('[data-ob-pick]').forEach(cb=>{ if(cb.checked){ const o=found[Number(cb.getAttribute('data-ob-pick'))];
      c.obligations.push({ id:'ob_'+Math.random().toString(36).slice(2,8), desc:o.desc, due:o.due||'', recurring:o.recurring||'none', assignee:'', status:'open', quote:o.quote||'' }); n++; } });
    logAudit(c,'Obligation',`Added ${n} obligation${n===1?'':'s'} from Copilot scan`);
    persist(c); closeModal(); renderObligationsSection(c); obligationSurfacesChanged();
    toast(`Added ${n} obligation${n===1?'':'s'}`);
  });
}

Object.assign(window,{OBLIG_RECUR,OBLIG_PARTY,obligationParty,obligationIsTheirs,obligationOwner,obligationsOurs,obligationsTheirs,findObligation,toggleObligation,toggleObligationById,openObligations,dateOnly,isoDay,renewalDecisionDate,obligationDue,obligationSurfacesChanged,obState,contractObligations,allObligations,overdueObligationCount,renewalDecisionsDue,heuristicObligations,extractObligations,renderObligationsSection,openObligationForm,runFindObligations,openObligationsReview});
